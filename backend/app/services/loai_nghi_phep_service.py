from app.models.loai_nghi_phep_model import LoaiNghiPhep
from app import db

def get_all_loai_nghi_phep_service():
    return LoaiNghiPhep.query.all()

def get_loai_nghi_phep_by_id_service(id):
    return LoaiNghiPhep.query.get(id)

def create_loai_nghi_phep_service(ten, mo_ta=None, co_luong=True):
    if LoaiNghiPhep.query.filter_by(ten=ten).first():
        raise ValueError("Loại nghỉ phép đã tồn tại")
    new_loai = LoaiNghiPhep(ten=ten, mo_ta=mo_ta, co_luong=co_luong)
    db.session.add(new_loai)
    db.session.commit()
    return new_loai

def update_loai_nghi_phep_service(id, ten=None, mo_ta=None, co_luong=None):
    loai = LoaiNghiPhep.query.get(id)
    if not loai:
        raise ValueError("Loại nghỉ phép không tồn tại")
    if ten:
        if ten != loai.ten and LoaiNghiPhep.query.filter_by(ten=ten).first():
            raise ValueError("Tên loại nghỉ phép đã tồn tại")
        loai.ten = ten
    if mo_ta is not None:
        loai.mo_ta = mo_ta
    if co_luong is not None:
        loai.co_luong = co_luong
    db.session.commit()
    return loai

def delete_loai_nghi_phep_service(id):
    loai = LoaiNghiPhep.query.get(id)
    if not loai:
        raise ValueError("Loại nghỉ phép không tồn tại")
    if loai.nghi_phep:
        raise ValueError("Không thể xóa loại nghỉ phép đang được sử dụng")
    db.session.delete(loai)
    db.session.commit()
    return {"message": "Xóa thành công"}