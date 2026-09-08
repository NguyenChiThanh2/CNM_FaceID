from app import db
from app.models.thuong_model import Thuong
from app.models.thuong_nhanvien_model import ThuongNhanVien
from app.models.nhan_vien_model import NhanVien  
from app.models.hopdong_laodong_model import HopDongLaoDong   
from app.models.bang_luong_model import BangLuong
from datetime import datetime, date
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

    # Chặn xóa nếu còn nhân viên đang gắn với khoản thưởng này — trước đây
    # xóa cứng (db.session.delete) trong khi ThuongNhanVien.thuong_id có
    # ondelete="CASCADE" ở tầng DB, nghĩa là xóa 1 Thuong sẽ tự động xóa CỨNG
    # theo toàn bộ lịch sử ThuongNhanVien liên quan, mất luôn không khôi phục
    # được — dù ThuongNhanVien vốn được thiết kế để xóa MỀM.
    so_nhan_vien = ThuongNhanVien.query.filter_by(thuong_id=thuong_id).count()
    if so_nhan_vien:
        raise ValueError(
            f"Không thể xóa vì còn {so_nhan_vien} nhân viên đang gắn với khoản thưởng này"
        )

    try:
        thuong.soft_delete()
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))


def add_nhan_vien_to_thuong_service(thuong_id, nhan_vien_ids):
    for nv_id in nhan_vien_ids:
        so_tien = nv_id.get("so_tien_thuc_te")  # có thể là None
        existing = db.session.query(ThuongNhanVien).filter_by(
            nhanvien_id=nv_id["id"], thuong_id=thuong_id
        ).first()

        if not existing:
            new_entry = ThuongNhanVien(nhanvien_id=nv_id["id"], thuong_id=thuong_id, so_tien_thuc_te=so_tien)
            db.session.add(new_entry)
        else:
            # cập nhật lại nếu khác
            if existing.so_tien_thuc_te != so_tien:
                existing.so_tien_thuc_te = so_tien
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))

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
            "so_tien_thuc_te": float(tg.so_tien_thuc_te) if tg.so_tien_thuc_te else None,
        })

    return result, None, 200


def remove_nhan_vien_from_thuong_service(thuong_id, nhan_vien_id):
    entry = ThuongNhanVien.query.filter_by(
        thuong_id=thuong_id,
        nhanvien_id=nhan_vien_id
    ).first()

    if entry:
        entry.soft_delete()
        db.session.commit()
        return "Xóa nhân viên khỏi thưởng thành công", None, 200
    else:
        return None, "Không tìm thấy nhân viên trong thưởng", 404
    
    

def get_thang13_nhan_vien_service(nhanvien_id, ngay_quyet_dinh):
    # Chuyển ngày quyết định sang datetime.date
    ngay_qd = datetime.strptime(ngay_quyet_dinh, "%Y-%m-%d").date()
    nam_qd = ngay_qd.year

    # 1️⃣ Lấy tất cả hợp đồng hợp lệ trong năm
    hop_dongs = (
        HopDongLaoDong.query
        .filter(HopDongLaoDong.nhan_vien_id == nhanvien_id)
        .filter(db.extract('year', HopDongLaoDong.ngay_bat_dau) <= nam_qd)
        .filter(
            (HopDongLaoDong.ngay_ket_thuc == None) |
            (db.extract('year', HopDongLaoDong.ngay_ket_thuc) >= nam_qd)
        )
        .order_by(HopDongLaoDong.ngay_bat_dau.asc())
        .all()
    )
    if not hop_dongs:
        return 0

    # 2️⃣ Đếm SỐ THÁNG có bảng lương trong năm — dùng distinct(BangLuong.thang)
    # thay vì đếm số dòng: nếu payroll lỡ bị chạy lại 2 lần cho cùng 1 tháng
    # (tạo 2 dòng BangLuong cùng tháng), đếm dòng sẽ ra >12 tháng, thưởng bị
    # tính vượt quá 1 tháng lương.
    so_thang_lam = (
        db.session.query(db.func.count(db.distinct(BangLuong.thang)))
        .filter(BangLuong.nhan_vien_id == nhanvien_id, BangLuong.nam == nam_qd)
        .scalar() or 0
    )
    if so_thang_lam == 0:
        return 0

    # 3️⃣ Tính lương cơ bản bình quân theo tháng trong năm, dựa trên TỪNG hợp
    # đồng theo đúng số tháng hợp đồng đó có hiệu lực trong năm — trước đây
    # phần này bị comment hết, chỉ còn dùng "muc_luong_cb" của lần lặp CUỐI
    # CÙNG (hợp đồng mới nhất) áp cho cả năm, bỏ qua mọi hợp đồng có mức
    # lương khác trước đó trong cùng năm.
    tong_luong_cb = Decimal("0")
    for hd in hop_dongs:
        muc_luong_cb = hd.muc_luong_co_ban
        ngay_bd = hd.ngay_bat_dau
        ngay_kt = hd.ngay_ket_thuc

        if isinstance(ngay_bd, datetime):
            ngay_bd = ngay_bd.date()
        if ngay_kt and isinstance(ngay_kt, datetime):
            ngay_kt = ngay_kt.date()

        # Giới hạn phạm vi hợp đồng trong năm quyết định thưởng
        ngay_bd_trong_nam = max(ngay_bd, date(nam_qd, 1, 1))
        ngay_kt_trong_nam = min(ngay_kt or date(nam_qd, 12, 31), date(nam_qd, 12, 31))

        # Số tháng hợp đồng còn hiệu lực trong năm
        so_thang_hd = max(
            0,
            (ngay_kt_trong_nam.year - ngay_bd_trong_nam.year) * 12
            + ngay_kt_trong_nam.month - ngay_bd_trong_nam.month + 1,
        )
        tong_luong_cb += Decimal(str(muc_luong_cb)) * so_thang_hd / Decimal("12")

    # 4️⃣ Kiểm tra hợp đồng hết hạn trước ngày quyết định
    last_hd = hop_dongs[-1]
    last_kt = last_hd.ngay_ket_thuc
    if last_kt:
        if isinstance(last_kt, datetime):
            last_kt = last_kt.date()
        if last_kt < ngay_qd:
            return 0

    # 5️⃣ Tính thưởng tháng 13 theo số tháng thực tế làm việc
    thuong_thang13 = tong_luong_cb * so_thang_lam / Decimal("12")

    return round(float(thuong_thang13), 0)