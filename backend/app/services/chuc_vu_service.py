# app/services/chuc_vu_service.py
from app.models.chuc_vu_model import ChucVu
from app import db

# Lấy tất cả chức vụ
def get_all_chuc_vu_service():
    return ChucVu.query.all()

# Lấy chức vụ theo ID
def get_chuc_vu_by_id_service(id):
    return ChucVu.query.get(id)

# Tạo chức vụ mới
def create_chuc_vu_service(ma_chuc_vu, ten_chuc_vu, mo_ta):
    chuc_vu = ChucVu(
        ma_chuc_vu=ma_chuc_vu,
        ten_chuc_vu=ten_chuc_vu,
        mo_ta=mo_ta
    )
    db.session.add(chuc_vu)
    db.session.commit()
    return chuc_vu

# Cập nhật chức vụ theo ID
def update_chuc_vu_service(id, ma_chuc_vu=None, ten_chuc_vu=None, mo_ta=None):
    chuc_vu = ChucVu.query.get(id)
    if not chuc_vu:
        return None
    if ma_chuc_vu is not None:
        chuc_vu.ma_chuc_vu = ma_chuc_vu
    if ten_chuc_vu is not None:
        chuc_vu.ten_chuc_vu = ten_chuc_vu
    if mo_ta is not None:
        chuc_vu.mo_ta = mo_ta
    db.session.commit()
    return chuc_vu

# Xóa chức vụ theo ID
def delete_chuc_vu_service(id):
    chuc_vu = ChucVu.query.get(id)
    if not chuc_vu:
        return False
    db.session.delete(chuc_vu)
    db.session.commit()
    return True
