# app/services/danh_gia_service.py
from app.models.danh_gia_model import DanhGia
from app import db

# Lấy tất cả đánh giá
def get_all_danh_gia_service():
    return DanhGia.query.all()

# Lấy đánh giá theo ID
def get_danh_gia_by_id_service(id):
    return DanhGia.query.get(id)

# Lấy tất cả đánh giá của một nhân viên
def get_danh_gia_by_nhan_vien_id_service(nhan_vien_id):
    return DanhGia.query.filter_by(nhan_vien_id=nhan_vien_id).all()

# Tạo đánh giá mới
def create_danh_gia_service(nhan_vien_id, thoi_gian, diem_so, nhan_xet):
    danh_gia = DanhGia(
        nhan_vien_id=nhan_vien_id,
        thoi_gian=thoi_gian,
        diem_so=diem_so,
        nhan_xet=nhan_xet
    )
    db.session.add(danh_gia)
    db.session.commit()
    return danh_gia

# Cập nhật đánh giá
def update_danh_gia_service(id, thoi_gian=None, diem_so=None, nhan_xet=None):
    danh_gia = DanhGia.query.get(id)
    if not danh_gia:
        return None
    if thoi_gian is not None:
        danh_gia.thoi_gian = thoi_gian
    if diem_so is not None:
        danh_gia.diem_so = diem_so
    if nhan_xet is not None:
        danh_gia.nhan_xet = nhan_xet
    db.session.commit()
    return danh_gia

# Xóa đánh giá
def delete_danh_gia_service(id):
    danh_gia = DanhGia.query.get(id)
    if not danh_gia:
        return False
    db.session.delete(danh_gia)
    db.session.commit()
    return True
