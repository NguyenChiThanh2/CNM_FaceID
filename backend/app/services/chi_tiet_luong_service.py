from app.models.chi_tiet_luong_model import ChiTietLuong
from app import db

def get_chi_tiet_luong_service(bang_luong_id):
    try:
        chi_tiet_list = ChiTietLuong.query.filter_by(bang_luong_id=bang_luong_id).all()
        return chi_tiet_list
    except Exception as e:
        raise Exception(str(e))