from app.models.nhan_vien_phuc_loi_model import NhanVienPhucLoi
from app import db

# Lấy tất cả các bản ghi phúc lợi nhân viên
def get_all_nhan_vien_phuc_loi_service():
    return NhanVienPhucLoi.query.all()

# Lấy bản ghi theo ID
def get_nhan_vien_phuc_loi_by_id_service(id):
    return NhanVienPhucLoi.query.get(id)

# Lấy các phúc lợi theo ID nhân viên
def get_phuc_loi_by_nhan_vien_id_service(nhan_vien_id):
    return NhanVienPhucLoi.query.filter_by(nhan_vien_id=nhan_vien_id).all()

# Lấy danh sách nhân viên nhận một phúc lợi cụ thể
def get_nhan_vien_by_phuc_loi_id_service(phuc_loi_id):
    return NhanVienPhucLoi.query.filter_by(phuc_loi_id=phuc_loi_id).all()

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
    item = NhanVienPhucLoi.query.get(id)
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
    item = NhanVienPhucLoi.query.get(id)
    if not item:
        return False
    db.session.delete(item)
    db.session.commit()
    return True
