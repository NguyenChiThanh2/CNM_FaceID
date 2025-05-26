from app.models.luong_model import Luong
from app import db
from datetime import date
from app.models.nhan_vien_model import NhanVien

# Lấy tất cả bảng lương
def get_all_luong_service():
    return Luong.query.all()

# Lấy bảng lương theo ID
def get_luong_by_id_service(id):
    return Luong.query.get(id)

# Lấy tất cả bảng lương theo ID nhân viên
def get_luong_by_nhan_vien_id_service(nhan_vien_id):
    return Luong.query.filter_by(nhan_vien_id=nhan_vien_id).all()

# Tạo bảng lương mới thủ công (ít dùng)
def create_luong_service(nhan_vien_id, thang, nam, phu_cap=0, khau_tru=0):
    new_luong = Luong(
        nhan_vien_id=nhan_vien_id,
        thang=thang,
        nam=nam,
        so_ngay_cong=0,
        phu_cap=phu_cap,
        khau_tru=khau_tru
    )
    db.session.add(new_luong)
    db.session.commit()
    return new_luong

# Cập nhật phụ cấp và khấu trừ thủ công
def update_luong_service(id, phu_cap=None, khau_tru=None):
    luong = Luong.query.get(id)
    if luong:
        if phu_cap is not None:
            luong.phu_cap = phu_cap
        if khau_tru is not None:
            luong.khau_tru = khau_tru
        db.session.commit()
        return luong
    return None

# Xóa bảng lương theo ID
def delete_luong_service(id):
    luong = Luong.query.get(id)
    if luong:
        db.session.delete(luong)
        db.session.commit()
        return True
    return False

# Tạo hoặc cập nhật bảng lương cho 1 nhân viên theo tháng và năm
def tao_hoac_cap_nhat_luong(nhan_vien_id: int, thang: int, nam: int):
    so_ngay_cong = Luong.tinh_so_ngay_cong(nhan_vien_id, thang, nam)
    phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
    khau_tru = Luong.tinh_khau_tru(so_ngay_cong)

    luong = Luong.query.filter_by(nhan_vien_id=nhan_vien_id, thang=thang, nam=nam).first()

    if luong:
        luong.so_ngay_cong = so_ngay_cong
        luong.phu_cap = phu_cap
        luong.khau_tru = khau_tru
    else:
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

# Tạo hoặc cập nhật bảng lương cho tất cả nhân viên
def tao_hoac_cap_nhat_luong_cho_tat_ca_nhan_vien(thang: int, nam: int):
    nhan_viens = NhanVien.query.all()
    ket_qua = []

    for nv in nhan_viens:
        so_ngay_cong = Luong.tinh_so_ngay_cong(nv.id, thang, nam)
        phu_cap = Luong.tinh_phu_cap(so_ngay_cong)
        khau_tru = Luong.tinh_khau_tru(so_ngay_cong)

        luong = Luong.query.filter_by(nhan_vien_id=nv.id, thang=thang, nam=nam).first()

        if luong:
            luong.so_ngay_cong = so_ngay_cong
            luong.phu_cap = phu_cap
            luong.khau_tru = khau_tru
        else:
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
