# app/controllers/danh_gia_controller.py
from flask import jsonify, request
from app.services.danh_gia_service import *
from app import db

# Lấy tất cả đánh giá
def get_all_danh_gia():
    danh_gia_list = get_all_danh_gia_service()
    if not danh_gia_list:
        return jsonify({'message': 'Không có dữ liệu đánh giá'}), 404
    return jsonify([dg.to_dict() for dg in danh_gia_list]), 200

# Lấy đánh giá theo ID
def get_danh_gia_by_id(id):
    danh_gia = get_danh_gia_by_id_service(id)
    if not danh_gia:
        return jsonify({'message': 'Không tìm thấy đánh giá'}), 404
    return jsonify(danh_gia.to_dict()), 200

# Lấy tất cả đánh giá của nhân viên theo ID
def get_danh_gia_by_nhan_vien_id(nhan_vien_id):
    danh_gia_list = get_danh_gia_by_nhan_vien_id_service(nhan_vien_id)
    if not danh_gia_list:
        return jsonify({'message': 'Không có đánh giá nào cho nhân viên này'}), 404
    return jsonify([dg.to_dict() for dg in danh_gia_list]), 200

# Tạo đánh giá mới
def create_danh_gia():
    data = request.get_json()
    if not data or 'nhan_vien_id' not in data or 'thoi_gian' not in data or 'diem_so' not in data:
        return jsonify({'message': 'Thiếu thông tin'}), 400
    
    danh_gia = create_danh_gia_service(
        nhan_vien_id=data['nhan_vien_id'],
        thoi_gian=data['thoi_gian'],
        diem_so=data['diem_so'],
        nhan_xet=data.get('nhan_xet', None)
    )
    return jsonify(danh_gia.to_dict()), 201

# Cập nhật đánh giá
def update_danh_gia(id):
    data = request.get_json()
    danh_gia = update_danh_gia_service(
        id,
        thoi_gian=data.get('thoi_gian'),
        diem_so=data.get('diem_so'),
        nhan_xet=data.get('nhan_xet')
    )
    if not danh_gia:
        return jsonify({'message': 'Không tìm thấy đánh giá'}), 404
    return jsonify(danh_gia.to_dict()), 200

# Xóa đánh giá
def delete_danh_gia(id):
    success = delete_danh_gia_service(id)
    if not success:
        return jsonify({'message': 'Không tìm thấy đánh giá'}), 404
    return jsonify({'message': 'Xóa đánh giá thành công'}), 200
