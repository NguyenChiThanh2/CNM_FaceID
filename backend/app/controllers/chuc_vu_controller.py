# app/controllers/chuc_vu_controller.py
from flask import jsonify, request
from app.services.chuc_vu_service import *

# Lấy tất cả chức vụ
def get_all_chuc_vu():
    chuc_vus = get_all_chuc_vu_service()
    if not chuc_vus:
        return jsonify({'message': 'không có dữ liệu chức vụ'})
    return jsonify([chuc_vu.to_dict() for chuc_vu in chuc_vus]), 200

# Lấy chức vụ theo ID
def get_chuc_vu_by_id(id):
    chuc_vu = get_chuc_vu_by_id_service(id)
    if chuc_vu:
        return jsonify(chuc_vu.to_dict()), 200
    return jsonify({'message': 'Không tìm thấy chức vụ'}), 404

# Tạo chức vụ mới
def create_chuc_vu():
    data = request.get_json()
    if not data or 'ma_chuc_vu' not in data or 'ten_chuc_vu' not in data or 'mo_ta' not in data:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    new_chuc_vu = create_chuc_vu_service(
        ma_chuc_vu=data['ma_chuc_vu'],
        ten_chuc_vu=data['ten_chuc_vu'],
        mo_ta=data['mo_ta']
    )
    return jsonify(new_chuc_vu.to_dict()), 201

# Cập nhật chức vụ theo ID
def update_chuc_vu(id):
    chuc_vu = get_chuc_vu_by_id_service(id)
    if not chuc_vu:
        return jsonify({'message': 'Không tìm thấy chức vụ'}), 404

    data = request.get_json()
    updated_chuc_vu = update_chuc_vu_service(
        id,
        ma_chuc_vu=data.get('ma_chuc_vu'),
        ten_chuc_vu=data.get('ten_chuc_vu'),
        mo_ta=data.get('mo_ta')
    )
    return jsonify(updated_chuc_vu.to_dict()), 200

# Xóa chức vụ theo ID
def delete_chuc_vu(id):
    chuc_vu = get_chuc_vu_by_id_service(id)
    if not chuc_vu:
        return jsonify({'message': 'Không tìm thấy chức vụ'}), 404

    delete_chuc_vu_service(id)
    return jsonify({'message': 'Xóa chức vụ thành công'}), 200
