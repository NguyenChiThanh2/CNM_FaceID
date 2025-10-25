from flask import jsonify, request
from app.services.tinh_luong_service import *

# def tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam):
#     bang_luongs = tinh_luong_cho_1nv(nhan_vien_id,thang,nam)
#     if bang_luongs:
#         return bang_luongs
#     else:
#         return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404
def tinh_luong_cho_1nv_controller(nhan_vien_id, thang, nam):
    try:
        bang_luong = tinh_luong_cho_1nv(nhan_vien_id, thang, nam)
        if bang_luong:
            return bang_luong
        else:
            return jsonify({'error': f'Không tính được lương cho nhân viên ID={nhan_vien_id}'}), 400
    except Exception as e:
        return jsonify({'error': f'Lỗi: {str(e)}'}), 500


def tinh_luong_cho_tat_ca_nhan_vien_controller(thang,nam,phongbanid=None):
    
    bang_luongs = tinh_luong_cho_tat_ca_nhan_vien(thang,nam,phongbanid)
    if bang_luongs:
        return bang_luongs
    else:
        return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404