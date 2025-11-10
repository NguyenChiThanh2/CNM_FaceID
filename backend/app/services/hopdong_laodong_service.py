from app.models.hopdong_laodong_model import HopDongLaoDong
from datetime import datetime, date
from sqlalchemy import extract, and_, or_, func
def get_phep_nam_hop_dong_hien_tai(id):
    nam_hien_tai = datetime.now().year

    phep_nam = (
        HopDongLaoDong.query.filter(
            HopDongLaoDong.nhan_vien_id == id,
            or_(
                extract('year', HopDongLaoDong.ngay_bat_dau) == nam_hien_tai,
                extract('year', HopDongLaoDong.ngay_ket_thuc) == nam_hien_tai
            )
        )
        .with_entities(HopDongLaoDong.phep_nam)
        .first()
    )

    return phep_nam.phep_nam if phep_nam else 0

def kiem_tra_hop_dong_con_han(nhanvien_id, thang, nam):
    """
    Kiểm tra hợp đồng lao động của nhân viên còn hạn tại thời điểm (tháng, năm) hay không.
    Trả về True nếu còn hiệu lực, False nếu đã hết hạn hoặc không có hợp đồng.
    """

    # 1️⃣ Lấy hợp đồng mới nhất của nhân viên (theo ngày bắt đầu)
    hop_dong = (
        HopDongLaoDong.query
        .filter(HopDongLaoDong.nhan_vien_id == nhanvien_id)
        .order_by(HopDongLaoDong.ngay_bat_dau.desc())
        .first()
    )

    if not hop_dong:
        return False  # Không có hợp đồng nào

    ngay_bd = hop_dong.ngay_bat_dau
    ngay_kt = hop_dong.ngay_ket_thuc

    # 2️⃣ Chuyển sang kiểu date (nếu là datetime)
    if isinstance(ngay_bd, datetime):
        ngay_bd = ngay_bd.date()
    if ngay_kt and isinstance(ngay_kt, datetime):
        ngay_kt = ngay_kt.date()

    # 3️⃣ Xác định ngày đầu tháng kiểm tra
    ngay_kiem_tra = date(nam, thang, 1)

    # 4️⃣ Kiểm tra còn hạn hay không
    # Nếu chưa hết hạn hoặc chưa có ngày kết thúc => còn hạn
    if not ngay_kt or ngay_kt >= ngay_kiem_tra:
        return True
    else:
        return False