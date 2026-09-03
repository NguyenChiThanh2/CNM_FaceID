from datetime import timedelta, date, datetime, time
from calendar import monthrange, calendar
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract, func, or_
from decimal import Decimal
from typing import Optional
from app.models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong
from app.models.hopdong_laodong_model import HopDongLaoDong
from .hopdong_laodong_service import kiem_tra_hop_dong_con_han
# from app.models.quyche_congty_model import QuyCheCongTy
from app.models.bang_luong_model import BangLuong
from app.models.giay_phep_model import GiayPhep
from .nguoi_phu_thuoc_service import kiemtra_nguoiphuthuoc
from app.models.chi_tiet_luong_model import ChiTietLuong, NhomChiTietLuong
from app.models.nghi_phep_model import NghiPhep
from app.models.ngay_nghi_le_model import NgayNghiLe
from app.models.thuong_model import Thuong
from app.models.thuong_nhanvien_model import ThuongNhanVien
from app.models.khau_tru_model import KhauTru
from app.models.khautru_nhanvien_model import KhauTruNhanVien
from app.models.bh_dn import BaoHiemDoanhNghiep
from app import db

# class TinhLuongService:

# def __init__(self, db: Session):
#     self.db = db

def lay_ngay_le_trong_thang(thang: int, nam: int):
    ngay_dau = date(nam, thang, 1)
    ngay_cuoi = date(nam, thang, monthrange(nam, thang)[1])

    ds_ngay_le = []
    ngay_nghi_le = NgayNghiLe.query.filter(
        NgayNghiLe.den_ngay >= ngay_dau,
        NgayNghiLe.tu_ngay <= ngay_cuoi
    ).all()

    for n in ngay_nghi_le:
        start = max(n.tu_ngay, ngay_dau)
        end = min(n.den_ngay, ngay_cuoi)
        current = start
        while current <= end:
            ds_ngay_le.append(current.day)
            current += timedelta(days=1)

    return ds_ngay_le

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
        ho_ten = NhanVien.query.filter_by(id=nhanvien_id).first().ho_ten
        return f"Hợp đồng lao động hết hiệu lực ID= {nhanvien_id}, Tên= {ho_ten}"
    

    
def tinh_ngay_cong(thang, nam):
    so_ngay = monthrange(nam, thang)[1]
    ngay_cong = 0
    ngay_le_list = lay_ngay_le_trong_thang(thang, nam)
    for day in range(1, so_ngay + 1):
        d = date(nam, thang, day)
        if d.weekday() < 5 and (d.day not in ngay_le_list):  # 0=Monday ... 4=Friday
            ngay_cong += 1
    return ngay_cong

def lay_cac_ngay_cuoi_tuan(thang, nam):
    so_ngay = monthrange(nam, thang)[1]  # Số ngày trong tháng
    ngay_cuoi_tuan = []

    for day in range(1, so_ngay + 1):
        d = date(nam, thang, day)
        # weekday() → 0 = Thứ 2, ..., 5 = Thứ 7, 6 = Chủ nhật
        if d.weekday() >= 5:
            ngay_cuoi_tuan.append(d.day)

    return ngay_cuoi_tuan

def tinh_tre_som(thoigianvao: datetime, thoigianra: datetime):
    if not thoigianvao or not thoigianra:
        return 0, 0

    # ---- Các mốc giờ chuẩn ----
    gio_vao_sang = time(8, 0)
    gio_ra_sang = time(11, 0)
    gio_vao_chieu = time(13, 0)
    gio_ra_chieu = time(17, 0)
    gio_vao_chieu_som = time(12, 0)  # cho phép vào sớm ca chiều từ 12:00
    gio_ra_sang_tre = time(13, 0)    # cho phép ra trễ ca sáng đến 12:00

    tre_phut = 0
    som_phut = 0

    try:
        gio_vao = thoigianvao.time()
        gio_ra = thoigianra.time()

        # ---- CA SÁNG ----
        # Là ca sáng nếu vào và ra đều <= 12:00
        if gio_ra <= gio_ra_sang_tre:
            if gio_vao > gio_vao_sang:
                tre_phut = int(
                    (datetime.combine(thoigianvao.date(), gio_vao) -
                     datetime.combine(thoigianvao.date(), gio_vao_sang)).total_seconds() // 60
                )

            if gio_ra < gio_ra_sang:
                som_phut = int(
                    (datetime.combine(thoigianra.date(), gio_ra_sang) -
                     datetime.combine(thoigianra.date(), gio_ra)).total_seconds() // 60
                )

        # ---- CA CHIỀU ----
        elif gio_vao >= gio_vao_chieu_som:
            if gio_vao > gio_vao_chieu:
                tre_phut = int(
                    (datetime.combine(thoigianvao.date(), gio_vao) -
                     datetime.combine(thoigianvao.date(), gio_vao_chieu)).total_seconds() // 60
                )

            if gio_ra < gio_ra_chieu:
                som_phut = int(
                    (datetime.combine(thoigianra.date(), gio_ra_chieu) -
                     datetime.combine(thoigianra.date(), gio_ra)).total_seconds() // 60
                )

        # ---- LÀM CẢ NGÀY ----
        else:
            if gio_vao > gio_vao_sang:
                tre_phut = int(
                    (datetime.combine(thoigianvao.date(), gio_vao) -
                     datetime.combine(thoigianvao.date(), gio_vao_sang)).total_seconds() // 60
                )

            if gio_ra < gio_ra_chieu:
                som_phut = int(
                    (datetime.combine(thoigianra.date(), gio_ra_chieu) -
                     datetime.combine(thoigianra.date(), gio_ra)).total_seconds() // 60
                )

    except Exception as e:
        print(f"Lỗi tính đi trễ/về sớm: {e}")

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

# ======= TÍNH NGÀY NGHỈ PHÉP NĂM =======
def tinh_ngay_nghi_phep_nam(nhanvien_id: int,thang: int, nam: int):
    # Xác định ngày đầu & cuối tháng
    ngay_dau_thang = date(nam, thang, 1)
    ngay_cuoi_thang = date(nam, thang, monthrange(nam, thang)[1])

    # Query lấy tất cả nghỉ phép có giao với tháng
    ngaynghiphep = NghiPhep.query.filter(
        NghiPhep.nhan_vien_id == nhanvien_id,
        NghiPhep.trang_thai == "Đã duyệt",
        NghiPhep.loai_nghi_phep_id != 3,
        # Điều kiện có giao khoảng thời gian
        or_(
            # bắt đầu trong tháng
            (NghiPhep.tu_ngay <= ngay_cuoi_thang) & (NghiPhep.den_ngay >= ngay_dau_thang)
        )
    ).all()

    # tong_so_ngay_nghi = 0
    danh_sach_ngay = []

    for np in ngaynghiphep:
        # Xác định khoảng giao với tháng
        # start = max(np.tu_ngay, ngay_dau_thang)
        # end = min(np.den_ngay, ngay_cuoi_thang)
        start = max(np.tu_ngay.date(), ngay_dau_thang)  # ép về date
        end = min(np.den_ngay.date(), ngay_cuoi_thang)  
        # if start <= end:
        #     so_ngay = (end - start).days + 1
        #     tong_so_ngay_nghi += so_ngay
        # Duyệt từng ngày trong khoảng và thêm vào danh sách
        current = start
        while current <= end:
            danh_sach_ngay.append(current.day)  # chỉ lấy số ngày (1..31)
            current += timedelta(days=1)
     # Loại bỏ trùng lặp (nếu có) và sắp xếp tăng dần
    danh_sach_ngay = sorted(list(set(danh_sach_ngay)))
            
    return danh_sach_ngay
    # hopdong = (
    #     HopDongLaoDong.query
    #     .filter(
    #         HopDongLaoDong.nhan_vien_id == nhanvien_id,
    #         extract('year', HopDongLaoDong.ngay_bat_dau) <= nam,
    #         (HopDongLaoDong.ngay_ket_thuc == None) | (extract('year', HopDongLaoDong.ngay_ket_thuc) >= nam),
    #     )
    #     .first()
    # )

    # if hopdong and hopdong.ngay_nghi_phep_nam is not None:
    #     return hopdong.ngay_nghi_phep_nam
    # else:
    #     quyche = QuyCheCongTy.query.first()
    #     return quyche.ngay_nghi_phep_nam if quyche and quyche.ngay_nghi_phep_nam is not None else 12  # mặc định 12 ngày

def kiemtra_nghithaisan(nhanvien_id: int,thang: int, nam: int):
    ngay_dau_thang = date(nam, thang, 1)
    ngay_cuoi_thang = date(nam, thang, monthrange(nam, thang)[1])
    ngaynghiphep = NghiPhep.query.filter(
        NghiPhep.nhan_vien_id == nhanvien_id,
        NghiPhep.trang_thai == "Đã duyệt",
        NghiPhep.loai_nghi_phep_id == 3,
        # Điều kiện có giao khoảng thời gian
        or_(
            # bắt đầu trong tháng
            (NghiPhep.tu_ngay <= ngay_cuoi_thang) & (NghiPhep.den_ngay >= ngay_dau_thang)
        )
    ).all()
    danh_sach_ngay = []
    for np in ngaynghiphep:
        start = max(np.tu_ngay.date(), ngay_dau_thang)  # ép về date
        end = min(np.den_ngay.date(), ngay_cuoi_thang)  
        current = start
        while current <= end:
            danh_sach_ngay.append(current.day)  # chỉ lấy số ngày (1..31)
            current += timedelta(days=1)
     # Loại bỏ trùng lặp (nếu có) và sắp xếp tăng dần
    danh_sach_ngay = sorted(list(set(danh_sach_ngay)))
            
    return danh_sach_ngay

def thuong_theo_thang(nhanvien_id: int, thang: int, nam: int):
    return db.session.query(Thuong).join(ThuongNhanVien).filter(
                            ThuongNhanVien.nhanvien_id == nhanvien_id,
                            extract('month', Thuong.ngay_quyet_dinh) == thang,
                            extract('year', Thuong.ngay_quyet_dinh) == nam,
                        ).all()
def khautru_theo_thang(nhanvien_id: int, thang: int, nam: int):
    return db.session.query(KhauTruNhanVien).join(KhauTru).filter(
                            KhauTruNhanVien.nhan_vien_id == nhanvien_id,
                            extract('month', KhauTru.ngay_quyet_dinh) == thang,
                            extract('year', KhauTru.ngay_quyet_dinh) == nam,
                        ).all()
        
# TÍNH LƯƠNG------------------------------------------------------------------------------------------------
def tinh_luong_cho_1nv(nhanvien_id: int, thang: int, nam: int):
    kthopdong = kiem_tra_hop_dong_con_han(nhanvien_id, thang, nam)
    if kthopdong is False:
        return {
            "success": False,
            "message": f"Nhân viên ID {nhanvien_id} đã hết hạn hợp đồng",
            "data": None
        }
    else:
        tong_luong = 0.0
        kt = True
        ktct = True
        temp_tnc = 0.0
        temp_nct = 0.0
        tong_ngay_cong_thuc = 0.0
        
        
        luong_cuoi_tuan = 0.0
        so_ngay_lam_cuoi_tuan = 0.0
        tong_luong_cuoi_tuan = 0.0
        tien_luong_cuoi_tuan_mien_thue = 0.0
        tien_luong_cuoi_tuan_tinh_thue = 0.0
        
        tong_gio_tang_ca = 0.0
        tong_tien_tang_ca = 0.0
        tien_tang_ca_tinh_thue = 0.0
        tien_tang_ca_mien_thue = 0.0
        
        luong_le = 0.0
        tong_luong_le = 0.0
        so_ngay_lam_le = 0.0
        tien_luong_le_mien_thue = 0.0
        tien_luong_le_tinh_thue = 0.0
        
        vi_pham=0.0    
        tam_ung = 0.0
        tru_khac=0.0
        ds_khautru_khac = []
        khau_tru = 0.0
        ditre_vesom = 0.0
        nghi_khong_phep = 0.0
        
        phu_cap = 0.0
        phucap_an_trua = 0.0
        phucap_xang_xe = 0.0
        
        phucap_doc_hai = 0.0
        phucap_trach_nhiem = 0.0
        phucap_chuc_vu = 0.0
        phucap_tham_nien = 0.0
        
        thuong_le=0.0    
        thuong_nong = 0.0
        thuong_khac=0.0
        ds_thuong_khac = []
        tong_thuong = 0.0
        
        
        
        luongcoban = 0.0
        cong = 0.0
        tong_ngay_cong = 0.0
        
        kiemtrathaisan = kiemtra_nghithaisan(nhanvien_id, thang, nam)
        if kiemtrathaisan and len(kiemtrathaisan) > 0:
            try:
                bangluong = BangLuong.query.filter_by(nhan_vien_id=nhanvien_id, thang=thang, nam=nam).first()
                if bangluong:
                    # Cập nhật lại thông tin lương
                    bangluong.ngay_cong_chuan = 0
                    bangluong.so_ngay_cong = 0
                    bangluong.nghi_phep = 0
                    bangluong.tong_ngay_lam_le = 0
                    bangluong.tong_tien_lam_le = 0
                    bangluong.tong_gio_tang_ca = 0
                    bangluong.tong_tien_tang_ca = 0
                    bangluong.tong_khau_tru = 0
                    bangluong.tong_phu_cap = 0
                    bangluong.tong_thuong = 0
                    bangluong.bhxh = 0
                    bangluong.bhtn = 0
                    bangluong.bhyt = 0
                    bangluong.thue_tncn = 0
                    bangluong.tong_luong = 0
                    bangluong.thuc_nhan = 0
                    bangluong.ghi_chu = "Nghỉ thai sản"
                    # Xóa chi tiết lương cũ trước khi thêm mới
                    ChiTietLuong.query.filter_by(bang_luong_id=bangluong.id).delete()
                    db.session.commit()
                else:
                    # Lưu vào bảng BangLuong
                    bangluong = BangLuong(
                        nhan_vien_id=nhanvien_id,
                        thang=thang,
                        nam=nam,
                        ghi_chu = "Nghỉ thai sản"
                    )
                    db.session.add(bangluong)
                    db.session.commit()
                # return bangluong
                return {
                        "success": True,
                        "message": f"Tính lương thành công cho nhân viên ID={nhanvien_id}",
                        "data": bangluong.to_dict()
                    }
            except Exception as e:
                db.session.rollback()
                raise Exception(f"Lỗi khi thêm bảng lương: {str(e)}")
        else:
            ds_ngay_nghi_phep = tinh_ngay_nghi_phep_nam(nhanvien_id, thang, nam)
            so_cong_chuan_thang = tinh_ngay_cong(thang, nam)
            ds_ngay_cuoi_tuan = lay_cac_ngay_cuoi_tuan(thang, nam)
            ds_ngay_le = lay_ngay_le_trong_thang(thang, nam)
            ds_ngay_nghi_phep = [ngay for ngay in ds_ngay_nghi_phep if ngay not in ds_ngay_cuoi_tuan]
            ds_ngay_nghi_phep = [ngay for ngay in ds_ngay_nghi_phep if ngay not in ds_ngay_le]
            # print("Công chuẩn:", so_cong_chuan_thang)
            # print("Ngày:", ds_ngay_le)
            """Tính số công cho 1 nhân viên trong 1 tháng"""
            try:
                tinh_so_cong = get_tinhsocong_1nhanvien_theothang_service(nhanvien_id, thang, nam)
            except Exception as e:
                print(f"Lỗi tính số công: {e}")
                tinh_so_cong = False
            """Tính lương cho 1 nhân viên trong 1 tháng"""
            # lấy toàn bộ chấm công trong tháng
            if tinh_so_cong or ds_ngay_nghi_phep:
                chamcongs = (
                    ChamCong.query
                    .filter(
                        ChamCong.nhan_vien_id == nhanvien_id,
                        extract('month', ChamCong.thoi_gian_vao) == thang,
                        extract('year',  ChamCong.thoi_gian_vao) == nam,
                    )
                    .all()
                )
                
                
                
                # print("Ngày cuối tuần trong tháng:", [d.day for d in ds_ngay_cuoi_tuan])
                # cong = 0.0
                # tong_ngay_cong = 0.0
                if ds_ngay_nghi_phep and len(ds_ngay_nghi_phep) > 0:
                    # cong = len(ds_ngay_nghi_phep)  # cộng trước số ngày nghỉ phép
                    tong_ngay_cong = len(ds_ngay_nghi_phep)
                if chamcongs:
                    for cc in chamcongs:
                        if cc.thoi_gian_vao.date().day in ds_ngay_nghi_phep:
                            if temp_tnc == tong_ngay_cong:
                                tong_ngay_cong_thuc = tong_ngay_cong - 1
                            kt = False
                            tong_ngay_cong -= 1  # trừ lại ngày công đã cộng ở trên
                            temp_tnc = tong_ngay_cong
                            ds_ngay_nghi_phep.remove(cc.thoi_gian_vao.date().day)
                        if kt:
                            tong_ngay_cong_thuc += cc.so_cong
                            # print("1", tong_ngay_cong_thuc)
                            kt = True
                        if kt is False:
                            tong_ngay_cong_thuc += cc.so_cong 
                            
                        if cc.thoi_gian_vao.date().day in ds_ngay_cuoi_tuan:
                            tong_ngay_cong_thuc -= 1
                            tong_ngay_cong -= 1 
                        if cc.thoi_gian_vao.date().day in ds_ngay_le:
                            tong_ngay_cong_thuc -= cc.so_cong
                            tong_ngay_cong -= cc.so_cong 
                        
                        
                        policy = get_chinhsach(nhanvien_id, cc.thoi_gian_vao.date())
                        
                        # ======= NGÀY LỄ =======
                        is_holiday = False
                        if ds_ngay_le and cc.thoi_gian_vao.date().day in ds_ngay_le:
                            is_holiday = True
                        # ======= NGÀY CUỐI TUẦN =======
                        
                        is_weekend = False
                        if ds_ngay_cuoi_tuan and cc.thoi_gian_vao.date().day in ds_ngay_cuoi_tuan:
                            is_weekend = True
                        
                        # ======= TÍNH CÔNG =======
                        
                        cong = cc.so_cong  # đã tính từ logic chấm công (0.5 hoặc 1)
                        tong_ngay_cong += cong
                        
                        # tong_ngay_cong_thuc += cong
                        # print("Công tính:", tong_ngay_cong, "Công thực", tong_ngay_cong_thuc, "cong", cong, "Ngày", cc.thoi_gian_vao.date(), "ngày nghỉ phép", ds_ngay_nghi_phep)
                        # print("Ngày lễ trong tháng:", ds_ngay_le)
                        # ======= LƯƠNG NGÀY THƯỜNG =======
                        # so_cong_chuan_thang = tinh_ngay_cong(thang, nam)
                        luongcoban = policy.muc_luong_co_ban
                        luong_ngay = policy.muc_luong_co_ban / so_cong_chuan_thang  
                        if is_holiday:
                            so_ngay_lam_le += cong
                            luong_le = policy.luong_ngay_le_heso * luong_ngay
                            tong_luong_le += cong * luong_le
                        if is_weekend:
                            so_ngay_lam_cuoi_tuan += cong
                            luong_cuoi_tuan = policy.luong_cuoi_tuan_heso * luong_ngay
                            tong_luong_cuoi_tuan += cong * luong_cuoi_tuan
                        
                        tong_luong += cong * luong_ngay
                        # print(tong_luong)
                        # ======= TĂNG CA =======
                        tangca = (
                            GiayPhep.query
                            .filter(GiayPhep.cham_cong_id == cc.id, GiayPhep.trang_thai == "Đã duyệt", GiayPhep.loai_giay_phep == "Tăng ca")
                            .first()
                        )
                        if tangca:
                            gio_tang_ca = tangca.so_gio
                            tong_gio_tang_ca += gio_tang_ca
                            if is_holiday:
                                tien_tang_ca = policy.luong_ngay_le_heso * (luong_ngay / 8)
                                tong_tien_tang_ca += gio_tang_ca * tien_tang_ca
                                tong_luong += gio_tang_ca * (luong_ngay / 8)
                            else:
                                tien_tang_ca = policy.tang_ca_heso * (luong_ngay / 8)
                                tong_tien_tang_ca += gio_tang_ca * tien_tang_ca
                                tong_luong += gio_tang_ca * (luong_ngay / 8)
                        
                        # if is_holiday and holiday is False:
                        #     tien_tang_ca = policy.luong_ngay_le_heso * (luong_ngay / 8)
                        #     tong_tien_tang_ca += gio_tang_ca * tien_tang_ca

                        # ======= KHẤU TRỪ ĐI TRỄ =======
                        ditre, vesom = tinh_tre_som(cc.thoi_gian_vao, cc.thoi_gian_ra)
                        # print(f"Nhân viên ID {nhanvien_id} - Ngày {cc.thoi_gian_vao.date()}: Đi trễ {ditre} phút, Về sớm {vesom} phút")
                        if ditre > 0:
                            # khau_tru += ditre * policy.di_tre_phat
                            ditre_vesom += ditre * policy.di_tre_phat
                        if vesom > 0:
                            # khau_tru += vesom * policy.ve_som_phat
                            ditre_vesom += vesom * policy.ve_som_phat
                        
                        # print(f"Ngày {cc.thoi_gian_vao.date()}: Đi trễ {ditre} phút, Về sớm {vesom} phút")
                        # ======= PHỤ CẤP NẾU CÓ =======
                        if policy.phu_cap_an_trua:
                            phucap_an_trua += policy.phu_cap_an_trua
                        if policy.phu_cap_xang_xe:
                            phucap_xang_xe += policy.phu_cap_xang_xe    
                            
                        # Phụ cấp tính bảo hiểm    
                        if policy.phu_cap_doc_hai:
                            phucap_doc_hai = policy.phu_cap_doc_hai
                        if policy.phu_cap_trach_nhiem:
                            phucap_trach_nhiem = policy.phu_cap_trach_nhiem
                        if policy.phu_cap_chuc_vu:
                            phucap_chuc_vu = policy.phu_cap_chuc_vu
                        if policy.phu_cap_tham_nien:
                            phucap_tham_nien = policy.phu_cap_tham_nien
                    # print(ds_ngay_nghi_phep)
                    if ds_ngay_nghi_phep and len(ds_ngay_nghi_phep) > 0:
                        for ngayphep in ds_ngay_nghi_phep:
                            ngay_kiem_tra = date(nam, thang, ngayphep)
                            policy = get_chinhsach(nhanvien_id, ngay_kiem_tra)    
                            luongcoban = policy.muc_luong_co_ban
                            luong_ngay = policy.muc_luong_co_ban / so_cong_chuan_thang  
                            
                            tong_luong += luong_ngay
                            # print(tong_luong)   
                            
                else:
                    # ======= TÍNH CÔNG =======
                    ngay_kiem_tra = date(nam, thang, 1)
                    policy = get_chinhsach(nhanvien_id, ngay_kiem_tra)    
                    if so_cong_chuan_thang >= len(ds_ngay_nghi_phep):
                        tong_ngay_cong = abs(so_cong_chuan_thang - len(ds_ngay_nghi_phep))
                    else:
                        tong_ngay_cong = so_cong_chuan_thang
                    luongcoban = policy.muc_luong_co_ban
                    luong_ngay = policy.muc_luong_co_ban / so_cong_chuan_thang  
                    
                    tong_luong = tong_ngay_cong * luong_ngay
                    # ======= PHỤ CẤP NẾU CÓ =======
                    if policy.phu_cap_an_trua:
                        phucap_an_trua += policy.phu_cap_an_trua
                    if policy.phu_cap_xang_xe:
                        phucap_xang_xe += policy.phu_cap_xang_xe    
                        
                    # Phụ cấp tính bảo hiểm    
                    if policy.phu_cap_doc_hai:
                        phucap_doc_hai = policy.phu_cap_doc_hai
                    if policy.phu_cap_trach_nhiem:
                        phucap_trach_nhiem = policy.phu_cap_trach_nhiem
                    if policy.phu_cap_chuc_vu:
                        phucap_chuc_vu = policy.phu_cap_chuc_vu
                    if policy.phu_cap_tham_nien:
                        phucap_tham_nien = policy.phu_cap_tham_nien
                    
                    
                dsthuong = thuong_theo_thang(nhanvien_id, thang, nam)
                
                if dsthuong and len(dsthuong):
                    for thuong in dsthuong:
                        tong_thuong += float(thuong.so_tien)
                        if thuong.loai_thuong == "NONG":
                            thuong_nong += float(thuong.so_tien)
                        if thuong.loai_thuong == "LE":
                            thuong_le += float(thuong.so_tien)
                        if thuong.loai_thuong not in ["NONG", "LE"]:
                            if thuong.loai_thuong == "THANG13":
                                ds_bangluong = BangLuong.query.filter_by(nhan_vien_id=nhanvien_id).all()
                                sothang = len(ds_bangluong)+1
                                if sothang >= 12:
                                    thuong_khac += luongcoban
                                    ds_thuong_khac.append({'ten_thuong': thuong.ten_thuong, 'so_tien': luongcoban})
                                else: 
                                    l13 = (sothang/12) * luongcoban
                                    thuong_khac += l13
                                    ds_thuong_khac.append({'ten_thuong': thuong.ten_thuong, 'so_tien': l13})
                            else:    
                                thuong_khac += float(thuong.so_tien)
                                ds_thuong_khac.append({'ten_thuong': thuong.ten_thuong, 'so_tien': float(thuong.so_tien)})
                                
                dskhautru = khautru_theo_thang(nhanvien_id, thang, nam)
                # print(dskhautru)
                if dskhautru and len(dskhautru):
                    for kt in dskhautru:
                        if kt.so_tien_thuc_te:
                            khau_tru += float(kt.so_tien_thuc_te)
                        else: 
                            khau_tru += float(kt.khau_tru.so_tien)
                        if kt.khau_tru.loai_khau_tru == "VI_PHAM":
                            vi_pham += float(kt.khau_tru.so_tien)
                        if kt.khau_tru.loai_khau_tru == "UNG_LUONG":
                            if kt.so_tien_thuc_te:
                                tam_ung += float(kt.so_tien_thuc_te)
                            else:
                                tam_ung += float(kt.khau_tru.so_tien)
                        if kt.khau_tru.loai_khau_tru not in ["VI_PHAM", "UNG_LUONG"]:
                            tru_khac += float(kt.khau_tru.so_tien)
                            ds_khautru_khac.append({'ten_khau_tru': kt.khau_tru.ten_khau_tru, 'so_tien': float(kt.khau_tru.so_tien)})
                

                # ======= TĂNG CA TÍNH THUẾ =======
                if locals().get("tien_tang_ca") and tien_tang_ca > 0:
                    luong_gio = luong_ngay / 8
                    tang_ca_mien_thue = tien_tang_ca - luong_gio
                    tien_tang_ca_mien_thue = tang_ca_mien_thue * tong_gio_tang_ca
                    tien_tang_ca_tinh_thue = luong_gio * tong_gio_tang_ca
                
                if luong_le > 0 and tong_luong_le > 0:
                    # tong_luong -= tong_luong_le  # trừ lại lương lễ đã cộng vào tổng lương
                    luong_le_mien_thue = luong_le - luong_ngay
                    tien_luong_le_mien_thue = so_ngay_lam_le * luong_le_mien_thue
                    tien_luong_le_tinh_thue = so_ngay_lam_le * luong_ngay
                    
                if luong_cuoi_tuan > 0 and tong_luong_cuoi_tuan > 0:
                    # tong_luong -= tong_luong_le  # trừ lại lương lễ đã cộng vào tổng lương
                    luong_cuoi_tuan_mien_thue = luong_cuoi_tuan - luong_ngay
                    tien_luong_cuoi_tuan_mien_thue = so_ngay_lam_cuoi_tuan * luong_cuoi_tuan_mien_thue
                    tien_luong_cuoi_tuan_tinh_thue = so_ngay_lam_cuoi_tuan * luong_ngay
                
                # ======= TÍNH BẢO HIỂM =======
                phu_cap = phucap_doc_hai + phucap_trach_nhiem + phucap_chuc_vu + phucap_tham_nien + phucap_an_trua + phucap_xang_xe
                
                # Lương trước khi trừ bảo hiểm cộng các khoản phụ cấp tính bảo hiểm
                tong_luong += phucap_doc_hai + phucap_trach_nhiem + phucap_chuc_vu + phucap_tham_nien 
                if luong_le > 0 and tong_luong_le > 0:
                    tong_luong -= tien_luong_le_tinh_thue  # trừ lại phần lương lễ không đóng bảo hiểm đã cộng vào tổng lương
                if luong_cuoi_tuan > 0 and tong_luong_cuoi_tuan > 0:
                    tong_luong -= tien_luong_cuoi_tuan_tinh_thue  # trừ lại phần lương cuối tuần không đóng bảo hiểm đã cộng vào tổng lương
                if locals().get("tien_tang_ca") and tien_tang_ca > 0:
                    tong_luong -= tien_tang_ca_tinh_thue  # trừ lại phần tăng ca không đóng bảo hiểm đã cộng vào tổng lương
                
                bao_hiem_xa_hoi = tong_luong * 0.08
                bao_hiem_y_te = tong_luong * 0.015
                bao_hiem_that_nghiep = tong_luong * 0.01
                tong_bao_hiem = bao_hiem_xa_hoi + bao_hiem_y_te + bao_hiem_that_nghiep
                
                bao_hiem_xa_hoi_dn = tong_luong * 0.175
                bao_hiem_y_te_dn = tong_luong * 0.03
                bao_hiem_that_nghiep_dn = tong_luong * 0.01
                tong_bao_hiem_dn = bao_hiem_xa_hoi_dn + bao_hiem_y_te_dn + bao_hiem_that_nghiep_dn

                # Lương sau khi trừ bảo hiểm + tăng ca tính thuế + phụ cấp không đóng bảo hiểm + lương lễ tính thuế
                if luong_le > 0 and tong_luong_le > 0:
                    tong_luong += tien_luong_le_tinh_thue  # cộng lại phần lương lễ tính thuế đã trừ ở trên
                if luong_cuoi_tuan > 0 and tong_luong_cuoi_tuan > 0:
                    tong_luong += tien_luong_cuoi_tuan_tinh_thue
                if locals().get("tien_tang_ca") and tien_tang_ca > 0:
                    tong_luong += tien_tang_ca_tinh_thue  # cộng lại phần tăng ca tính thuế đã trừ ở trên
                    
                tong_luong += tong_thuong
                luong_tinh_thue = tong_luong - tong_bao_hiem + (phucap_an_trua + phucap_xang_xe) 
                
                # Số người phụ thuộc
                so_nguoi_phu_thuoc = kiemtra_nguoiphuthuoc(nhanvien_id, thang, nam)
                
                # Tính thuế TNCN
                thue_tncn = tinh_thue_tncn(luong_tinh_thue, so_nguoi_phu_thuoc)
                
                # ======= KHẤU TRỪ KHÁC =======
                khau_tru += ditre_vesom
                if tong_ngay_cong < so_cong_chuan_thang:
                    ngaynghi = so_cong_chuan_thang - tong_ngay_cong
                    nghi_khong_phep += ngaynghi * luong_ngay
                
                # ======= LƯƠNG THỰC LĨNH =======
                luong_thuc_linh = tong_luong - tong_bao_hiem - thue_tncn - khau_tru + tien_tang_ca_mien_thue + tien_luong_le_mien_thue + tien_luong_cuoi_tuan_mien_thue
                try:
                    bangluong = BangLuong.query.filter_by(nhan_vien_id=nhanvien_id, thang=thang, nam=nam).first()
                    
                    if bangluong:
                        bhdn = BaoHiemDoanhNghiep.query.filter_by(nhan_vien_id=nhanvien_id, thang=thang, nam=nam).first()
                        if bhdn:
                            bhdn.bhxh_dn = bao_hiem_xa_hoi_dn
                            bhdn.bhtn_dn = bao_hiem_that_nghiep_dn
                            bhdn.bhyt_dn = bao_hiem_y_te_dn
                            bhdn.tong_bh_dn = tong_bao_hiem_dn
                        # Cập nhật lại thông tin lương
                        bangluong.ngay_cong_chuan = int(so_cong_chuan_thang)
                        bangluong.so_ngay_cong = tong_ngay_cong_thuc
                        bangluong.nghi_phep = len(ds_ngay_nghi_phep)
                        bangluong.tong_ngay_lam_le = so_ngay_lam_le
                        bangluong.tong_tien_lam_le = tong_luong_le
                        bangluong.tong_gio_tang_ca = tong_gio_tang_ca
                        bangluong.tong_tien_tang_ca = tong_tien_tang_ca
                        bangluong.tong_khau_tru = khau_tru
                        bangluong.tong_phu_cap = phu_cap
                        bangluong.tong_thuong = tong_thuong
                        bangluong.bhxh = bao_hiem_xa_hoi
                        bangluong.bhtn = bao_hiem_that_nghiep
                        bangluong.bhyt = bao_hiem_y_te
                        bangluong.thue_tncn = thue_tncn
                        bangluong.tong_luong = tong_luong
                        bangluong.thuc_nhan = luong_thuc_linh
                        bangluong.tong_ngay_cuoi_tuan = so_ngay_lam_cuoi_tuan
                        bangluong.tong_tien_cuoi_tuan = tong_luong_cuoi_tuan
                        bangluong.ghi_chu = None
                    
                        # Xóa chi tiết lương cũ trước khi thêm mới
                        ChiTietLuong.query.filter_by(bang_luong_id=bangluong.id).delete()
                        db.session.commit()
                    else:
                        # Lưu vào bảng BangLuong
                        bangluong = BangLuong(
                            nhan_vien_id=nhanvien_id,
                            thang=thang,
                            nam=nam,
                            ngay_cong_chuan = int(so_cong_chuan_thang),
                            so_ngay_cong=tong_ngay_cong_thuc,
                            nghi_phep=len(ds_ngay_nghi_phep),
                            tong_ngay_lam_le= so_ngay_lam_le,
                            tong_tien_lam_le= tong_luong_le,
                            tong_gio_tang_ca=tong_gio_tang_ca,
                            tong_tien_tang_ca=tong_tien_tang_ca,
                            tong_khau_tru=khau_tru,
                            tong_phu_cap=phu_cap,
                            tong_thuong = tong_thuong,
                            bhxh=bao_hiem_xa_hoi,
                            bhtn=bao_hiem_that_nghiep,
                            bhyt=bao_hiem_y_te,
                            thue_tncn=thue_tncn,
                            tong_luong=tong_luong,
                            thuc_nhan=luong_thuc_linh,
                            tong_ngay_cuoi_tuan= so_ngay_lam_cuoi_tuan,
                            tong_tien_cuoi_tuan= tong_luong_cuoi_tuan,
                        )
                        
                        bhdn = BaoHiemDoanhNghiep(
                            nhan_vien_id=nhanvien_id,
                            thang=thang,
                            nam=nam,
                            bhxh_dn = bao_hiem_xa_hoi_dn,
                            bhtn_dn = bao_hiem_that_nghiep_dn,
                            bhyt_dn = bao_hiem_y_te_dn,
                            # tong_bh_dn = tong_bao_hiem_dn,
                        )
                        
                        db.session.add(bangluong)
                        db.session.add(bhdn)
                        db.session.commit()
                        
                    # 2️⃣ Tạo list chi tiết lương (chỉ thêm nếu có dữ liệu)
                    chi_tiet_list = []

                    # ======= KHẤU TRỪ  =======
                    if ditre_vesom and ditre_vesom > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.KHAU_TRU,
                                loai="DI_TRE_VE_SOM",
                                so_tien=ditre_vesom
                            )
                        )
                    if nghi_khong_phep and nghi_khong_phep > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.KHAU_TRU,
                                loai="NGHI_KHONG_PHEP",
                                so_tien=nghi_khong_phep
                            )
                        )
                    if vi_pham and vi_pham > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.KHAU_TRU,
                                loai="VI_PHAM",
                                so_tien=vi_pham
                            )
                        )
                    if tam_ung and tam_ung > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.KHAU_TRU,
                                loai="UNG_LUONG",
                                so_tien=tam_ung
                            )
                        )
                    if tru_khac and tru_khac > 0:
                        for kt in ds_khautru_khac:
                            chi_tiet_list.append(
                                ChiTietLuong(
                                    bang_luong_id=bangluong.id,
                                    nhom=NhomChiTietLuong.KHAU_TRU,
                                    loai="TRU_KHAC",
                                    so_tien=kt['so_tien'],
                                    ghi_chu=kt['ten_khau_tru']
                                )
                            )

                    
                    # ======= PHỤ CẤP  =======
                    if phucap_an_trua and phucap_an_trua > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="AN_UONG",
                                so_tien=phucap_an_trua
                            )
                        )
                    if phucap_xang_xe and phucap_xang_xe > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="XANG_XE",
                                so_tien=phucap_xang_xe
                            )
                        )

                    if phucap_doc_hai and phucap_doc_hai > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="DOC_HAI",
                                so_tien=phucap_doc_hai
                            )
                        )
                    if phucap_trach_nhiem and phucap_trach_nhiem > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="TRACH_NHIEM",
                                so_tien=phucap_trach_nhiem
                            )
                        )
                    if phucap_chuc_vu and phucap_chuc_vu > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="CHUC_VU",
                                so_tien=phucap_chuc_vu
                            )
                        )
                    if phucap_tham_nien and phucap_tham_nien > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.PHU_CAP,
                                loai="THAM_NIEN",
                                so_tien=phucap_tham_nien
                            )
                        )

                    # if phucap_tham_nien and phucap_tham_nien > 0: PHỤ CẤP KHÁC
                    #     chi_tiet_list.append(
                    #         ChiTietLuong(
                    #             bang_luong_id=bangluong.id,
                    #             nhom=NhomChiTietLuong.PHU_CAP,
                    #             loai="THAM_NIEN",
                    #             so_tien=phucap_tham_nien
                    #         )
                    #     )
                    
                    # ======= THƯỞNG  =======
                    if thuong_le and thuong_le > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.THUONG,
                                loai="LE",
                                so_tien=thuong_le
                            )
                        )
                    if thuong_nong and thuong_nong > 0:
                        chi_tiet_list.append(
                            ChiTietLuong(
                                bang_luong_id=bangluong.id,
                                nhom=NhomChiTietLuong.THUONG,
                                loai="NONG",
                                so_tien=thuong_nong
                            )
                        )
                    if thuong_khac and thuong_khac > 0:
                        for tk in ds_thuong_khac:
                            chi_tiet_list.append(
                                ChiTietLuong(
                                    bang_luong_id=bangluong.id,
                                    nhom=NhomChiTietLuong.THUONG,
                                    loai="THUONG_KHAC",
                                    so_tien=tk['so_tien'],
                                    ghi_chu=tk['ten_thuong']
                                )
                            )

                    # 3️⃣ Lưu tất cả chi tiết nếu có
                    if chi_tiet_list:
                        db.session.add_all(chi_tiet_list)
                        db.session.commit()
                    
                    all_bangluong = BangLuong.query.filter_by(nhan_vien_id=nhanvien_id).all()
                    if len(all_bangluong) <= 12:
                        hdld = HopDongLaoDong.query.filter_by(nhan_vien_id=nhanvien_id).first()
                        if hdld:
                            hdld.phep_nam = len(all_bangluong)
                            db.session.commit()
                    return {
                        "success": True,
                        "message": f"Tính lương thành công cho nhân viên ID={nhanvien_id}",
                        "data": bangluong.to_dict()
                    }

                
                except Exception as e:
                    db.session.rollback()
                    raise Exception(f"Lỗi khi thêm bảng lương: {str(e)}")
            else:
                return {
                    "success": False,
                    "message": f"Chưa có chấm công cho nhân viên ID {nhanvien_id} trong tháng {thang}/{nam}",
                    "data": None
                }
              
# -----------------------------------------------------------------------------------------------------------------
def tinh_so_cong_cho_1_ngay(id, check_in: Optional[datetime], check_out: Optional[datetime]) -> Decimal:
    if not check_in or not check_out:
        # Nếu không có chấm công -> kiểm tra xem có giấy phép không
        soconggiayphep = get_tinhsocong_theogiayphep_service(id)
        return soconggiayphep

    in_t = check_in.time()
    out_t = check_out.time()

    # Định nghĩa ca làm việc
    a_start, a_end = time(8, 0), time(12, 0)   # Ca sáng
    b_start, b_end = time(13, 0), time(17, 0)  # Ca chiều

    def overlap_hours(s: time, e: time, ws: time, we: time) -> Decimal:
        start = max(datetime.combine(date.min, s), datetime.combine(date.min, ws))
        end = min(datetime.combine(date.min, e), datetime.combine(date.min, we))
        delta = (end - start).total_seconds() / 3600
        return Decimal(str(max(delta, 0)))

    # Tổng số giờ làm thực tế
    total_hours = overlap_hours(in_t, out_t, a_start, a_end) + overlap_hours(in_t, out_t, b_start, b_end)

    # ---- PHÂN LOẠI CA ----
    # Nếu nhân viên chỉ làm sáng hoặc chỉ làm chiều
    if out_t <= a_end:
        # Chỉ làm ca sáng
        if total_hours >= Decimal("3.5"):
            return Decimal("0.5")  # Đủ 4 tiếng coi như 0.5 công
        elif total_hours >= Decimal("2.5"):
            return Decimal("0.25")  # Làm ~3 tiếng vẫn được 0.25 công
        else:
            return Decimal("0.00")

    elif in_t >= b_start:
        # Chỉ làm ca chiều
        if total_hours >= Decimal("3.5"):
            return Decimal("0.5")
        elif total_hours >= Decimal("2.5"):
            return Decimal("0.25")
        else:
            return Decimal("0.00")

    else:
        # Làm cả ngày (có qua trưa)
        if total_hours >= Decimal("7.5"):
            return Decimal("1.00")
        elif total_hours >= Decimal("3.5"):
            return Decimal("0.50")
        else:
            return Decimal("0.00")
        
def get_tinhsocong_1nhanvien_theothang_service(nhan_vien_id, thang, nam):
    dschamcong = ChamCong.query.filter(ChamCong.nhan_vien_id == nhan_vien_id,extract('month', ChamCong.ngay) == thang,extract('year', ChamCong.ngay) == nam).all()
    if not dschamcong:
        return None
    else:
        for cc in dschamcong:
            so_cong_moi = tinh_so_cong_cho_1_ngay(cc.id, cc.thoi_gian_vao, cc.thoi_gian_ra)
            cc.so_cong = so_cong_moi  # cập nhật lại cột so_cong
        db.session.commit()
        return True
    
def get_tinhsocong_theogiayphep_service(id):
    cham_cong = ChamCong.query.filter_by(id=id).first()
    giay_phep = GiayPhep.query.filter(GiayPhep.cham_cong_id == id, GiayPhep.trang_thai == "Đã duyệt").first()

    if not cham_cong or not giay_phep:
        return Decimal("0.00")
    if giay_phep.so_gio == 8:
        return  Decimal("1.00")
    elif giay_phep.so_gio == 4:
        return Decimal("0.50")
    
# def tinh_luong_cho_tat_ca_nhan_vien(thang,nam):
#     nhan_viens = NhanVien.query.all()
#     ket_qua = []
#     for nv in nhan_viens:
#         try: 
#             bangluong_1nv = tinh_luong_cho_1nv(nv.id,thang,nam)
#             if bangluong_1nv is None:
#                 print(f"⚠️ Không tính được lương cho nhân viên ID={nv.id}, họ tên={nv.ho_ten}")
#                 continue
#             ket_qua.append(bangluong_1nv.to_dict())
#         except Exception as e:
#                 raise Exception({str(e)})
#     return ket_qua
def tinh_luong_cho_tat_ca_nhan_vien(thang, nam, phongbanid=None):

    # print(f"Tháng: {thang}, Năm: {nam}, Phòng ban ID: {phongbanid}")
    if phongbanid:
        nhan_viens = NhanVien.query.filter_by(phong_ban_id=phongbanid).all()
    else:
        nhan_viens = NhanVien.query.all()
    ket_qua = []
    loi_list = []  # Danh sách lỗi để trả về cho frontend

    for nv in nhan_viens:
        try:
            kthopdong = kiem_tra_hop_dong_con_han(nv.id, thang, nam)
            if kthopdong is False:
                continue
            else:
                bangluong_1nv = tinh_luong_cho_1nv(nv.id, thang, nam)
                # Kiểm tra nếu không tính được lương cho nhân viên
                # print(bangluong_1nv)
                if bangluong_1nv['success'] is False:
                    # msg = f"Không tính được lương cho nhân viên ID={nv.id}, họ tên={nv.ho_ten}"
                    loi_list.append(bangluong_1nv['message'])
                    continue
                ket_qua.append(bangluong_1nv['data'])

        except Exception as e:
            
            msg = f"Lỗi khi tính lương cho nhân viên ID={nv.id}, họ tên={nv.ho_ten}: {str(e)}"
            loi_list.append(msg)

    # ✅ Trả về cả danh sách lương và lỗi
    # print(ket_qua)
    return {
        "success": True,
        "data": ket_qua,
        "errors": loi_list
    }