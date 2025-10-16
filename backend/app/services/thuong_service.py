from app import db
from app.models.thuong_model import Thuong
from app.models.thuong_nhanvien_model import ThuongNhanVien
from datetime import datetime
from decimal import Decimal

# Lấy tất cả phúc lợi
def get_all_thuong_service():
    return Thuong.query.order_by(Thuong.ngay_quyet_dinh.desc()).all()

# Lấy phúc lợi theo tên
def get_thuong_by_name_service(ten_thuong):
    return Thuong.query.filter_by(ten_thuong=ten_thuong).first()

# Lấy phúc lợi theo ID
def get_thuong_by_id_service(thuong_id):
    return Thuong.query.get(thuong_id)
def get_thuong_by_nhan_vien_id_service(nhan_vien_id):
    return db.session.query(Thuong).join(ThuongNhanVien).filter(ThuongNhanVien.nhanvien_id == nhan_vien_id).all()

# Thêm mới phúc lợi
def create_thuong_service(data):
    try:
       # Ép kiểu an toàn
        so_tien = Decimal(str(data.get("so_tien", 0)))
        ngay_quyet_dinh = datetime.strptime(data["ngay_quyet_dinh"], "%Y-%m-%d").date()

        addthuong = Thuong(
            ten_thuong=data["ten_thuong"],
            loai_thuong=data.get("loai_thuong"),
            so_tien=so_tien,
            ngay_quyet_dinh=ngay_quyet_dinh,
            ghi_chu=data.get("ghi_chu"),
        )

        db.session.add(addthuong)
        db.session.commit()

        return addthuong
    except Exception as e:
        db.session.rollback()
        return {"message": f"Lỗi server: {str(e)}"}, 500

# Cập nhật phúc lợi
def update_thuong_service(thuong_id, data):
    thuong = get_thuong_by_id_service(thuong_id)
    so_tien = Decimal(str(data.get("so_tien", 0)))
    ngay_quyet_dinh = datetime.strptime(data["ngay_quyet_dinh"], "%Y-%m-%d").date()
    if not thuong:
        return None
    thuong.ten_thuong = data.get('ten_thuong', thuong.ten_thuong)
    thuong.loai_thuong = data.get('loai_thuong', thuong.loai_thuong)
    thuong.so_tien = so_tien
    thuong.ngay_quyet_dinh = ngay_quyet_dinh
    thuong.ghi_chu = data.get('ghi_chu', thuong.ghi_chu)

    db.session.commit()
    return thuong

# Xóa phúc lợi
def delete_thuong_service(thuong_id):
    thuong = get_thuong_by_id_service(thuong_id)
    if not thuong:
        return False
    try:
        db.session.delete(thuong)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))


def add_nhan_vien_to_thuong_service(thuong_id, nhan_vien_ids):
    for nv_id in nhan_vien_ids:
        existing = db.session.query(ThuongNhanVien).filter_by(
            nhanvien_id=nv_id, thuong_id=thuong_id
        ).first()

        if not existing:
            new_entry = ThuongNhanVien(nhanvien_id=nv_id, thuong_id=thuong_id)
            db.session.add(new_entry)

    db.session.commit()

def get_nhan_vien_by_thuong_service(thuong_id):
    thuong = Thuong.query.get(thuong_id)
    if not thuong:
        return None, "Thưởng không tồn tại", 404

    tham_gias = ThuongNhanVien.query.filter_by(thuong_id=thuong_id).all()
    if not tham_gias:
        return None, "Không có nhân viên tham gia thưởng này", 404

    result = []
    for tg in tham_gias:
        nv = tg.nhanvien
        result.append({
            "id": nv.id,
            "ho_ten": nv.ho_ten,
            "email": nv.email,
            "phong_ban_id": nv.phong_ban_id,
        })

    return result, None, 200


def remove_nhan_vien_from_thuong_service(thuong_id, nhan_vien_id):
    entry = ThuongNhanVien.query.filter_by(
        thuong_id=thuong_id,
        nhanvien_id=nhan_vien_id
    ).first()

    if entry:
        db.session.delete(entry)
        db.session.commit()
        return "Xóa nhân viên khỏi thưởng thành công", None, 200
    else:
        return None, "Không tìm thấy nhân viên trong thưởng", 404