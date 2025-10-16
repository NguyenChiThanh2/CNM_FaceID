from flask import jsonify, request
from app.services.tinh_luong_service import *

def tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam):
    bang_luongs = tinh_luong_cho_1nv(nhan_vien_id,thang,nam)
    if bang_luongs:
        return jsonify(bang_luongs.to_dict()),200
    else:
        return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404
    
def tinh_luong_cho_tat_ca_nhan_vien_controller(thang,nam):
    bang_luongs = tinh_luong_cho_tat_ca_nhan_vien(thang,nam)
    if bang_luongs:
        return bang_luongs
    else:
        return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404