from app.models.bang_luong_model import BangLuong
from app import db

def get_bang_luong_1nv_service(nhan_vien_id):
    return BangLuong.query.filter_by(nhan_vien_id=nhan_vien_id).all()