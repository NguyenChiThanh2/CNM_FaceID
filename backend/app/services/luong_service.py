from app.models.luong_model import Luong
from app import db
from datetime import date
from app.models.nhan_vien_model import NhanVien

# Lấy tất cả lương
def get_all_luong_service():
    return Luong.query.all()

# Lấy lương theo ID
def get_luong_by_id_service(id):
    return Luong.query.get(id)

# Lấy lương của nhân viên theo ID nhân viên
def get_luong_by_nhan_vien_id_service(nhan_vien_id):
    return Luong.query.filter_by(nhan_vien_id=nhan_vien_id).all()

# Tạo lương mới
def create_luong_service(nhan_vien_id, thang, luong_co_ban, phu_cap, khau_tru):
    new_luong = Luong(
        nhan_vien_id=nhan_vien_id,
        thang=thang,
        nam=date.today().year,  # mặc định lấy năm hiện tại nếu chưa truyền
        so_ngay_cong=0,
        phu_cap=phu_cap,
        khau_tru=khau_tru
    )
    db.session.add(new_luong)
    db.session.commit()
    return new_luong

# Cập nhật lương theo ID
def update_luong_service(id, luong_co_ban=None, phu_cap=None, khau_tru=None):
    luong = Luong.query.get(id)
    if luong:
        if luong_co_ban is not None and luong.luong_nv:
            luong.luong_nv.luong_co_ban = luong_co_ban  # cập nhật ở bảng nhân viên
        if phu_cap is not None:
            luong.phu_cap = phu_cap
        if khau_tru is not None:
            luong.khau_tru = khau_tru
        db.session.commit()
        return luong
    return None

# Xóa lương theo ID
def delete_luong_service(id):
    luong = Luong.query.get(id)
    if luong:
        db.session.delete(luong)
        db.session.commit()
        return True
    return False

# Tạo hoặc cập nhật bảng lương
def tao_hoac_cap_nhat_luong(nhan_vien_id: int, thang: int, nam: int):
    # Tính số ngày công thực tế
    so_ngay_cong = Luong.tinh_so_ngay_cong(nhan_vien_id, thang, nam)

    # Tìm bản ghi lương hiện có
    luong = Luong.query.filter_by(nhan_vien_id=nhan_vien_id, thang=thang, nam=nam).first()

    if luong:
        # Cập nhật nếu đã có
        luong.so_ngay_cong = so_ngay_cong
        phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
        khau_tru = Luong.tinh_khau_tru(so_ngay_cong)
    else:
        # Tạo mới nếu chưa có
        phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
        khau_tru = Luong.tinh_khau_tru(so_ngay_cong)
        luong = Luong(
            nhan_vien_id=nhan_vien_id,
            thang=thang,
            nam=nam,
            so_ngay_cong=so_ngay_cong,
            phu_cap=phu_cap,
            khau_tru=khau_tru
        )
        db.session.add(luong)

    db.session.commit()
    return luong.to_dict()


def tao_hoac_cap_nhat_luong_cho_tat_ca_nhan_vien(thang: int, nam: int):
    """
    Tạo hoặc cập nhật bảng lương cho tất cả nhân viên theo tháng/năm.
    """
    nhan_viens = NhanVien.query.all()
    ket_qua = []

    for nv in nhan_viens:
        so_ngay_cong = Luong.tinh_so_ngay_cong(nv.id, thang, nam)

        # Kiểm tra lương đã tồn tại?
        luong = Luong.query.filter_by(nhan_vien_id=nv.id, thang=thang, nam=nam).first()

        if luong:
            # Cập nhật nếu đã có
            luong.so_ngay_cong = so_ngay_cong
            luong.phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
            luong.khau_tru = Luong.tinh_khau_tru(so_ngay_cong)
        else:
            # Tạo mới nếu chưa có
            phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
            khau_tru = Luong.tinh_khau_tru(so_ngay_cong)
            luong = Luong(
                nhan_vien_id=nv.id,
                thang=thang,
                nam=nam,
                so_ngay_cong=so_ngay_cong,
                phu_cap=phu_cap,
                khau_tru=khau_tru
            )
            db.session.add(luong)

        ket_qua.append(luong.to_dict())

    db.session.commit()
    return ket_qua
