from app.models.loai_nghi_phep_model import LoaiNghiPhep, DonViTinh
from app import db

def get_all_loai_nghi_phep_service():
    return LoaiNghiPhep.query.all()

def get_loai_nghi_phep_by_id_service(id):
    return LoaiNghiPhep.query.get(id)

def _parse_don_vi_tinh(value):
    if value is None:
        return None
    try:
        return DonViTinh(value)
    except ValueError:
        raise ValueError("don_vi_tinh không hợp lệ (chỉ nhận NGAY hoặc GIO)")

def create_loai_nghi_phep_service(
    ten, mo_ta=None, co_luong=True,
    don_vi_tinh=None, yeu_cau_cham_cong=False, yeu_cau_thong_tin_sinh=False
):
    if LoaiNghiPhep.query.filter_by(ten=ten).first():
        raise ValueError("Loại nghỉ phép đã tồn tại")
    new_loai = LoaiNghiPhep(
        ten=ten,
        mo_ta=mo_ta,
        co_luong=co_luong,
        don_vi_tinh=_parse_don_vi_tinh(don_vi_tinh) or DonViTinh.NGAY,
        yeu_cau_cham_cong=bool(yeu_cau_cham_cong),
        yeu_cau_thong_tin_sinh=bool(yeu_cau_thong_tin_sinh),
    )
    db.session.add(new_loai)
    db.session.commit()
    return new_loai

def update_loai_nghi_phep_service(
    id, ten=None, mo_ta=None, co_luong=None,
    don_vi_tinh=None, yeu_cau_cham_cong=None, yeu_cau_thong_tin_sinh=None
):
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
    if don_vi_tinh is not None:
        loai.don_vi_tinh = _parse_don_vi_tinh(don_vi_tinh)
    if yeu_cau_cham_cong is not None:
        loai.yeu_cau_cham_cong = bool(yeu_cau_cham_cong)
    if yeu_cau_thong_tin_sinh is not None:
        loai.yeu_cau_thong_tin_sinh = bool(yeu_cau_thong_tin_sinh)
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
