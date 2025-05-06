from app import db
from app.models.phuc_loi_model import PhucLoi
from app.models.nhan_vien_phuc_loi_model import NhanVienPhucLoi


# Lấy tất cả phúc lợi
def get_all_phuc_loi_service():
    return PhucLoi.query.all()

# Lấy phúc lợi theo tên
def get_phuc_loi_by_name_service(ten_phuc_loi):
    return PhucLoi.query.filter_by(ten_phuc_loi=ten_phuc_loi).first()

# Lấy phúc lợi theo ID
def get_phuc_loi_by_id_service(phuc_loi_id):
    return PhucLoi.query.get(phuc_loi_id)
def get_phuc_loi_by_nhan_vien_id_service(nhan_vien_id):
    return db.session.query(PhucLoi).join(NhanVienPhucLoi).filter(NhanVienPhucLoi.nhan_vien_id == nhan_vien_id).all()

# Thêm mới phúc lợi
def create_phuc_loi_service(data):
    phuc_loi = PhucLoi(
        ten_phuc_loi=data.get('ten_phuc_loi'),
        mo_ta=data.get('mo_ta'),
        gia_tri=data.get('gia_tri'),
        loai=data.get('loai')
    )
    db.session.add(phuc_loi)
    db.session.commit()
    return phuc_loi

# Cập nhật phúc lợi
def update_phuc_loi_service(phuc_loi_id, data):
    phuc_loi = get_phuc_loi_by_id_service(phuc_loi_id)
    if not phuc_loi:
        return None
    phuc_loi.ten_phuc_loi = data.get('ten_phuc_loi', phuc_loi.ten_phuc_loi)
    phuc_loi.mo_ta = data.get('mo_ta', phuc_loi.mo_ta)
    phuc_loi.gia_tri = data.get('gia_tri', phuc_loi.gia_tri)
    phuc_loi.loai = data.get('loai', phuc_loi.loai)

    db.session.commit()
    return phuc_loi

# Xóa phúc lợi
def delete_phuc_loi_service(phuc_loi_id):
    phuc_loi = get_phuc_loi_by_id_service(phuc_loi_id)
    if not phuc_loi:
        return False
    db.session.delete(phuc_loi)
    db.session.commit()
    return True
