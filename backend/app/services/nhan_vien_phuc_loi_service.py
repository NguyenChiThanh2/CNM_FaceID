from app.models.nhan_vien_phuc_loi_model import NhanVienPhucLoi
from app import db
from sqlalchemy.orm import joinedload

# to_dict() của NhanVienPhucLoi load thêm quan hệ nhan_vien + phuc_loi (xem
# app/models/nhan_vien_phuc_loi_model.py) — nếu không eager-load sẵn ở đây,
# mỗi bản ghi trong danh sách sẽ tự lazy-load 2 quan hệ đó riêng lẻ khi
# to_dict() chạy, thành N+1 query (1 query lấy danh sách + 2N query lấy quan
# hệ). joinedload gộp hết vào 1 câu SQL bằng JOIN.
_EAGER = (joinedload(NhanVienPhucLoi.nhan_vien), joinedload(NhanVienPhucLoi.phuc_loi))

# Lấy tất cả các bản ghi phúc lợi nhân viên
def get_all_nhan_vien_phuc_loi_service():
    return NhanVienPhucLoi.query.options(*_EAGER).all()

# Lấy bản ghi theo ID
def get_nhan_vien_phuc_loi_by_id_service(id):
    return NhanVienPhucLoi.query.options(*_EAGER).filter_by(id=id).first()

# Lấy các phúc lợi theo ID nhân viên
def get_phuc_loi_by_nhan_vien_id_service(nhan_vien_id):
    return NhanVienPhucLoi.query.options(*_EAGER).filter_by(nhan_vien_id=nhan_vien_id).all()

# Lấy danh sách nhân viên nhận một phúc lợi cụ thể
def get_nhan_vien_by_phuc_loi_id_service(phuc_loi_id):
    return NhanVienPhucLoi.query.options(*_EAGER).filter_by(phuc_loi_id=phuc_loi_id).all()

# Tạo mới phúc lợi cho nhân viên
def create_nhan_vien_phuc_loi_service(nhan_vien_id, phuc_loi_id, ngay_ap_dung, ghi_chu=None):
    new_item = NhanVienPhucLoi(
        nhan_vien_id=nhan_vien_id,
        phuc_loi_id=phuc_loi_id,
        ngay_ap_dung=ngay_ap_dung,
        ghi_chu=ghi_chu
    )
    db.session.add(new_item)
    db.session.commit()
    return new_item

# Cập nhật bản ghi phúc lợi nhân viên
def update_nhan_vien_phuc_loi_service(id, ngay_ap_dung=None, ghi_chu=None):
    item = NhanVienPhucLoi.query.filter_by(id=id).first()
    if not item:
        return None
    if ngay_ap_dung is not None:
        item.ngay_ap_dung = ngay_ap_dung
    if ghi_chu is not None:
        item.ghi_chu = ghi_chu
    db.session.commit()
    return item

# Xóa bản ghi
def delete_nhan_vien_phuc_loi_service(id):
    item = NhanVienPhucLoi.query.filter_by(id=id).first()
    if not item:
        return False
    item.soft_delete()
    db.session.commit()
    return True
