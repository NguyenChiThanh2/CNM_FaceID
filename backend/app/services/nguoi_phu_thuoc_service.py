from app.models.nguoi_phu_thuoc_model import NguoiPhuThuoc
from app import db
from datetime import datetime, date
from sqlalchemy import func

def get_so_nguoiphuthuoc_by_nhanvien_service(id):
    return NguoiPhuThuoc.query.filter_by(nhan_vien_id=id).count()

def kiemtra_nguoiphuthuoc(nhanvien_id: int, thang: int, nam: int):
    # Xác định ngày đầu tiên của tháng cần kiểm tra
    ngay_dau_thang = date(nam, thang, 1)
    query = (
        NguoiPhuThuoc.query.filter(
            NguoiPhuThuoc.nhan_vien_id == nhanvien_id,
            NguoiPhuThuoc.ngay_bat_dau <= ngay_dau_thang,
            NguoiPhuThuoc.ngay_ket_thuc.isnot(None),
            NguoiPhuThuoc.ngay_ket_thuc > ngay_dau_thang  # chỉ lấy những ngày kết thúc trước tháng này 
        )
    )
    return query.count()
