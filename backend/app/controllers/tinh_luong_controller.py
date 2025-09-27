from flask import jsonify, request
from app.services.tinh_luong_service import *

def tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam):
    bang_luongs = tinh_luong_cho_1nv(nhan_vien_id,thang,nam)
    if bang_luongs:
        return jsonify(bang_luongs.to_dict()),200
    else:
        return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404