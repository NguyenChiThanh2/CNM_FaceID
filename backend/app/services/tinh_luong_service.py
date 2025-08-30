from datetime import timedelta, date
import calendar
from typing import Optional
from sqlalchemy.orm import Session
from models.nhan_vien_model import NhanVien
from models.cham_cong_model import ChamCong
from models.hopdong_laodong_model import HopDongLaoDong
from models.quyche_congty_model import QuyCheCongTy
from models.bang_luong_model import BangLuong
from models.giay_phep_model import PheDuyetTangCa
from app import db

# class TinhLuongService:

#     def __init__(self, db: Session):
#         self.db = db

def get_chinhsach(self, nhanvien_id: int, ngay: date):
    """Lấy chính sách áp dụng (quy chế công ty hoặc override bằng hợp đồng)"""
    hopdong = (
        self.db.query(HopDongLaoDong)
        .filter(
            HopDongLaoDong.nhan_vien_id == nhanvien_id,
            HopDongLaoDong.ngay_bat_dau <= ngay,
            (HopDongLaoDong.ngay_ket_thuc == None) | (HopDongLaoDong.ngay_ket_thuc >= ngay),
        )
        .first()
    )

    if hopdong:
        return hopdong
    else:
        return self.db.query(QuyCheCongTy).first()  # chính sách mặc định

def tinh_ngay_cong(thang, nam):
    so_ngay = calendar.monthrange(nam, thang)[1]
    ngay_cong = 0
    for day in range(1, so_ngay + 1):
        d = date(nam, thang, day)
        if d.weekday() < 5:  # 0=Monday ... 4=Friday
            ngay_cong += 1
    return ngay_cong

def tinh_luong_cho_1nv(self, nhanvien_id: int, thang: int, nam: int):
    """Tính lương cho 1 nhân viên trong 1 tháng"""
    # lấy toàn bộ chấm công trong tháng
    chamcongs = (
        self.db.query(ChamCong)
        .filter(
            ChamCong.nhan_vien_id == nhanvien_id,
            ChamCong.thoi_gian_vao.month == thang,
            ChamCong.thoi_gian_vao.year == nam,
        )
        .all()
    )

    tong_luong = 0.0
    tong_ngay_cong = 0.0
    tong_gio_tang_ca = 0.0
    khau_tru = 0.0
    phu_cap = 0.0

    for cc in chamcongs:
        policy = self.get_chinhsach(nhanvien_id, cc.thoi_gian_vao.date())

        # ======= NGÀY LỄ =======
        is_holiday = False
        if hasattr(policy, "ngay_le_quoc_gia") and cc.thoi_gian_vao.date() in policy.ngay_le_quoc_gia:
            is_holiday = True

        # ======= TÍNH CÔNG =======
        cong = cc.so_cong  # đã tính từ logic chấm công (0.5 hoặc 1)
        tong_ngay_cong += cong

        # ======= LƯƠNG NGÀY THƯỜNG =======
        so_cong_chuan_thang = tinh_ngay_cong(thang, nam)
        luong_ngay = policy.muc_luong_co_ban / so_cong_chuan_thang  # giả sử 26 công/tháng
        tong_luong += cong * luong_ngay

        # ======= TĂNG CA =======
        # tangca = (
        #     self.db.query(PheDuyetTangCa)
        #     .filter(PheDuyetTangCa.chamcong_id == cc.id, PheDuyetTangCa.duoc_phe_duyet == True)
        #     .first()
        # )
        # if tangca:
        #     gio_tang_ca = (tangca.thoi_gian_ket_thuc - tangca.thoi_gian_bat_dau).seconds / 3600
        #     tong_gio_tang_ca += gio_tang_ca
        #     if is_holiday:
        #         tong_luong += gio_tang_ca * policy.he_so_luong_ngay_le * (luong_ngay / 8)
        #     else:
        #         tong_luong += gio_tang_ca * policy.he_so_luong_tang_ca * (luong_ngay / 8)

        # ======= KHẤU TRỪ ĐI TRỄ =======
        if cc.so_phut_di_tre > 0:
            khau_tru += (cc.so_phut_di_tre / 60) * (luong_ngay / 8) * policy.he_so_phat_di_tre

        # ======= PHỤ CẤP NẾU CÓ =======
        if policy.phu_cap_an_trua:
            phu_cap += policy.phu_cap_an_trua

    tong_luong = tong_luong - khau_tru + phu_cap

    # Lưu vào bảng BangLuong
    bangluong = BangLuong(
        nhanvien_id=nhanvien_id,
        thang=thang,
        nam=nam,
        tong_ngay_cong=tong_ngay_cong,
        tong_gio_tang_ca=tong_gio_tang_ca,
        tong_khau_tru=khau_tru,
        tong_phu_cap=phu_cap,
        tong_luong=tong_luong,
    )
    self.db.add(bangluong)
    self.db.commit()
    return bangluong
