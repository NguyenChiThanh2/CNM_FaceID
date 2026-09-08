# app/services/vai_tro_service.py
from app import db
from app.models.vai_tro_model import VaiTro
from app.models.quyen_model import Quyen
from app.models.nhan_vien_model import NhanVien


def get_all_vai_tro_service():
    return VaiTro.query.order_by(VaiTro.ten_vai_tro).all()


def get_vai_tro_by_id_service(vai_tro_id):
    return VaiTro.query.get(vai_tro_id)


def create_vai_tro_service(ten_vai_tro, mo_ta=None, ma_quyen_list=None):
    if VaiTro.query.filter_by(ten_vai_tro=ten_vai_tro).first():
        raise ValueError(f"Vai trò '{ten_vai_tro}' đã tồn tại")

    vai_tro = VaiTro(ten_vai_tro=ten_vai_tro, mo_ta=mo_ta)
    if ma_quyen_list:
        vai_tro.quyen_list = Quyen.query.filter(Quyen.ma_quyen.in_(ma_quyen_list)).all()

    db.session.add(vai_tro)
    db.session.commit()
    return vai_tro


def update_vai_tro_service(vai_tro_id, ten_vai_tro=None, mo_ta=None):
    vai_tro = VaiTro.query.get(vai_tro_id)
    if not vai_tro:
        return None

    if ten_vai_tro and ten_vai_tro != vai_tro.ten_vai_tro:
        if VaiTro.query.filter_by(ten_vai_tro=ten_vai_tro).first():
            raise ValueError(f"Vai trò '{ten_vai_tro}' đã tồn tại")
        vai_tro.ten_vai_tro = ten_vai_tro

    if mo_ta is not None:
        vai_tro.mo_ta = mo_ta

    db.session.commit()
    return vai_tro


def delete_vai_tro_service(vai_tro_id):
    vai_tro = VaiTro.query.get(vai_tro_id)
    if not vai_tro:
        return None

    so_nhan_vien = NhanVien.query.filter_by(vai_tro_id=vai_tro_id).count()
    if so_nhan_vien > 0:
        raise ValueError(
            f"Không thể xóa vai trò '{vai_tro.ten_vai_tro}' vì còn {so_nhan_vien} "
            "nhân viên đang thuộc vai trò này — hãy chuyển họ sang vai trò khác trước"
        )

    db.session.delete(vai_tro)
    db.session.commit()
    return True


def set_quyen_cho_vai_tro_service(vai_tro_id, ma_quyen_list):
    """Gán lại TOÀN BỘ quyền cho 1 vai trò (thay thế danh sách cũ, không cộng dồn)."""
    vai_tro = VaiTro.query.get(vai_tro_id)
    if not vai_tro:
        return None

    vai_tro.quyen_list = Quyen.query.filter(Quyen.ma_quyen.in_(ma_quyen_list or [])).all()
    db.session.commit()
    return vai_tro


def gan_vai_tro_cho_nhan_vien_service(nhan_vien_id, vai_tro_id):
    nv = NhanVien.query.get(nhan_vien_id)
    if not nv:
        return None, "Không tìm thấy nhân viên"

    if vai_tro_id is not None and not VaiTro.query.get(vai_tro_id):
        return None, "Không tìm thấy vai trò"

    nv.vai_tro_id = vai_tro_id
    db.session.commit()
    return nv, None
