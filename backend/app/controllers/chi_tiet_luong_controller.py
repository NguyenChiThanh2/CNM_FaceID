from flask import jsonify, request
from app.services.chi_tiet_luong_service import *

def get_chi_tiet_luong_controller(bang_luong_id):
    try:
        chi_tiet_luong = get_chi_tiet_luong_service(bang_luong_id)
        if chi_tiet_luong:
            return jsonify([ctl.to_dict() for ctl in chi_tiet_luong]),200
        else:
            return jsonify({'message': 'Không có dữ liệu chi tiết lương'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500