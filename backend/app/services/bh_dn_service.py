# services/bao_hiem_dn_service.py
from app.models.bh_dn import BaoHiemDoanhNghiep


def get_all_bao_hiem_dn_service():
    """
    Lấy toàn bộ dữ liệu bảo hiểm doanh nghiệp
    """
    data = BaoHiemDoanhNghiep.query.order_by(
        BaoHiemDoanhNghiep.nam.desc(),
        BaoHiemDoanhNghiep.thang.desc()
    ).all()
    return [item.to_dict() for item in data]
