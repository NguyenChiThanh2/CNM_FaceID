from datetime import timedelta, date, datetime, time
import calendar
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
# from models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong
from app.models.hopdong_laodong_model import HopDongLaoDong
from app.models.quyche_congty_model import QuyCheCongTy
from app.models.bang_luong_model import BangLuong
from app.models.giay_phep_model import GiayPhep
from app import db

# class TinhLuongService:

# def __init__(self, db: Session):
#     self.db = db

def get_chinhsach(nhanvien_id: int, ngay: date):
    """Lấy chính sách áp dụng (quy chế công ty hoặc override bằng hợp đồng)"""
    hopdong = (
        HopDongLaoDong.query
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
        return QuyCheCongTy.query.first()  # chính sách mặc định

def tinh_ngay_cong(thang, nam):
    so_ngay = calendar.monthrange(nam, thang)[1]
    ngay_cong = 0
    for day in range(1, so_ngay + 1):
        d = date(nam, thang, day)
        if d.weekday() < 5:  # 0=Monday ... 4=Friday
            ngay_cong += 1
    return ngay_cong

def tinh_tre_som(thoigianvao: datetime, thoigianra: datetime):
    # Mốc giờ chuẩn
    gio_vao_chuan = time(8, 0)   # 08:01
    gio_ra_chuan = time(17, 0)   # 17:00

    # ---- TÍNH ĐI TRỄ ----
    tre_phut = 0
    if thoigianvao.time() > gio_vao_chuan:
        diff = datetime.combine(thoigianvao.date(), thoigianvao.time()) - \
               datetime.combine(thoigianvao.date(), gio_vao_chuan)
        tre_phut = int(diff.total_seconds() // 60)

    # ---- TÍNH VỀ SỚM ----
    som_phut = 0
    if thoigianra.time() < gio_ra_chuan:
        diff = datetime.combine(thoigianra.date(), gio_ra_chuan) - \
               datetime.combine(thoigianra.date(), thoigianra.time())
        som_phut = int(diff.total_seconds() // 60)

    return tre_phut, som_phut

# ======= TÍNH THUẾ TNCN =======
def tinh_thue_tncn(thu_nhap, so_nguoi_phu_thuoc=0):
    giam_tru_ban_than = 11000000
    giam_tru_phu_thuoc = so_nguoi_phu_thuoc * 4400000
    thu_nhap_chiu_thue = thu_nhap - giam_tru_ban_than - giam_tru_phu_thuoc

    if thu_nhap_chiu_thue <= 0:
        return 0

    thue = 0
    bac_thue = [
        (5000000, 0.05),
        (10000000, 0.10),
        (18000000, 0.15),
        (32000000, 0.20),
        (52000000, 0.25),
        (80000000, 0.30),
        (float("inf"), 0.35),
    ]

    prev_limit = 0
    for limit, rate in bac_thue:
        if thu_nhap_chiu_thue > limit:
            thue += (limit - prev_limit) * rate
            prev_limit = limit
        else:
            thue += (thu_nhap_chiu_thue - prev_limit) * rate
            break

    return thue

def tinh_luong_cho_1nv(nhanvien_id: int, thang: int, nam: int):
    """Tính lương cho 1 nhân viên trong 1 tháng"""
    # lấy toàn bộ chấm công trong tháng
    chamcongs = (
        ChamCong.query
        .filter(
            ChamCong.nhan_vien_id == nhanvien_id,
            extract('month', ChamCong.thoi_gian_vao) == thang,
            extract('year',  ChamCong.thoi_gian_vao) == nam,
        )
        .all()
    )

    tong_luong = 0.0
    tong_ngay_cong = 0.0
    tong_gio_tang_ca = 0.0
    khau_tru = 0.0
    phu_cap = 0.0

    for cc in chamcongs:
        policy = get_chinhsach(nhanvien_id, cc.thoi_gian_vao.date())

        # ======= NGÀY LỄ =======
        # is_holiday = False
        # if hasattr(policy, "ngay_le_quoc_gia") and cc.thoi_gian_vao.date() in policy.ngay_le_quoc_gia:
        #     is_holiday = True

        # ======= TÍNH CÔNG =======
        cong = cc.so_cong  # đã tính từ logic chấm công (0.5 hoặc 1)
        tong_ngay_cong += cong

        # ======= LƯƠNG NGÀY THƯỜNG =======
        so_cong_chuan_thang = tinh_ngay_cong(thang, nam)
        luong_ngay = policy.muc_luong_co_ban / so_cong_chuan_thang  
        tong_luong += cong * luong_ngay

        # ======= TĂNG CA =======
        tangca = (
            GiayPhep.query
            .filter(GiayPhep.cham_cong_id == cc.id, GiayPhep.trang_thai == "Đã duyệt", GiayPhep.loai_giay_phep == "Tăng ca")
            .first()
        )
        if tangca:
            # gio_tang_ca = (tangca.thoi_gian_ket_thuc - tangca.thoi_gian_bat_dau).seconds / 3600
            gio_tang_ca = tangca.so_gio
            tong_gio_tang_ca += gio_tang_ca
            # if is_holiday:
            #     tong_luong += gio_tang_ca * policy.he_so_luong_ngay_le * (luong_ngay / 8)
            # else:
            tong_luong += gio_tang_ca * policy.tang_ca_heso * (luong_ngay / 8)

        # ======= KHẤU TRỪ ĐI TRỄ =======
        ditre, vesom = tinh_tre_som(cc.thoi_gian_vao, cc.thoi_gian_ra)
        if ditre > 0:
            khau_tru += ditre * policy.di_tre_phat
        if vesom > 0:
            khau_tru += vesom * policy.ve_som_phat
        

        # ======= PHỤ CẤP NẾU CÓ =======
        if policy.phu_cap_an_trua:
            phu_cap += policy.phu_cap_an_trua
        if policy.phu_cap_doc_hai:
            phu_cap += policy.phu_cap_doc_hai
        if policy.phu_cap_trach_nhiem:
            phu_cap += policy.phu_cap_trach_nhiem

    # ======= TÍNH BẢO HIỂM =======
    tong_luong = tong_luong + phu_cap
    
    bao_hiem_xa_hoi = tong_luong * 0.08
    bao_hiem_y_te = tong_luong * 0.015
    bao_hiem_that_nghiep = tong_luong * 0.01
    tong_bao_hiem = bao_hiem_xa_hoi + bao_hiem_y_te + bao_hiem_that_nghiep

    # Lương sau khi trừ bảo hiểm
    luong_tinh_thue = tong_luong - tong_bao_hiem 
    # Tính thuế TNCN
    thue_tncn = tinh_thue_tncn(luong_tinh_thue, so_nguoi_phu_thuoc=0)
    
    # ======= LƯƠNG THỰC LĨNH =======
    luong_thuc_linh = tong_luong - tong_bao_hiem - thue_tncn - khau_tru 
    
    # Lưu vào bảng BangLuong
    bangluong = BangLuong(
        nhan_vien_id=nhanvien_id,
        thang=thang,
        nam=nam,
        ngay_cong_chuan = int(so_cong_chuan_thang),
        so_ngay_cong=tong_ngay_cong,
        tong_gio_tang_ca=tong_gio_tang_ca,
        tong_khau_tru=khau_tru,
        tong_phu_cap=phu_cap,
        bhxh=bao_hiem_xa_hoi,
        bhtn=bao_hiem_that_nghiep,
        bhyt=bao_hiem_y_te,
        thue_tncn=thue_tncn,
        tong_luong=tong_luong,
        thuc_nhan=luong_thuc_linh,
    )
    db.session.add(bangluong)
    db.session.commit()
    return bangluong
