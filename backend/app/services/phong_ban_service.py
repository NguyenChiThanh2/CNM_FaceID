# app/services/phong_ban_service.py
from app import db
from app.models.phong_ban_model import PhongBan
from app.models.nhan_vien_model import NhanVien
from sqlalchemy import func
# Lấy tất cả phòng ban
def get_all_phong_ban_service():
    query_results = db.session.query(PhongBan,func.count(NhanVien.id).label('so_luong_nhan_vien')).outerjoin(NhanVien, PhongBan.id == NhanVien.phong_ban_id).group_by(PhongBan.id).all()
    danh_sach_phong_ban = []
    for phong_ban, so_luong in query_results:
        pb_dict = phong_ban.to_dict()  # Dùng hàm to_dict() bạn đã định nghĩa
        pb_dict['so_luong_nhan_vien'] = so_luong
        danh_sach_phong_ban.append(pb_dict)
    return danh_sach_phong_ban

# Lấy phòng ban theo tên
def get_phong_ban_by_name_service(ten_phong_ban):
    return PhongBan.query.filter_by(ten_phong_ban=ten_phong_ban).first()

# Lấy phòng ban theo mã (ID)
def get_phong_ban_by_ma_service(ma_phong_ban):
    return PhongBan.query.get(ma_phong_ban)

# Tạo mới phòng ban
def create_phong_ban_service(data):
    new_pb = PhongBan(
        ma_phong_ban=data.get("ma_phong_ban"),
        ten_phong_ban=data.get("ten_phong_ban"),
        mo_ta=data.get("mo_ta")
    )
    db.session.add(new_pb)
    db.session.commit()
    return new_pb

# Cập nhật phòng ban
def update_phong_ban_service(id, data):
    pb = PhongBan.query.get(id)
    if not pb:
        return None
    
    pb.ma_phong_ban = data.get("ma_phong_ban", pb.ma_phong_ban)
    pb.ten_phong_ban = data.get("ten_phong_ban", pb.ten_phong_ban)
    pb.mo_ta = data.get("mo_ta", pb.mo_ta)

    db.session.commit()
    return pb

# Xoá phòng ban
def delete_phong_ban_service(ma_phong_ban):
    pb = PhongBan.query.get(ma_phong_ban)
    if not pb:
        # không tìm thấy phòng ban
        return {"status": "not_found", "phong_ban": None}

    # Kiểm tra xem còn nhân viên thuộc phòng ban này không
    nhan_vien_count = (
        db.session.query(func.count(NhanVien.id))
        .filter(NhanVien.phong_ban_id == pb.id)
        .scalar()
    )

    if nhan_vien_count and nhan_vien_count > 0:
        # còn nhân viên -> không cho xoá
        return {
            "status": "has_employee",
            "count": nhan_vien_count,
            "phong_ban": pb
        }

    # An toàn -> xoá
    db.session.delete(pb)
    db.session.commit()
    return {"status": "deleted", "phong_ban": pb}

def get_nhan_vien_by_phong_ban_id_service(phong_ban_id):
    return NhanVien.query.filter_by(phong_ban_id=phong_ban_id).all()