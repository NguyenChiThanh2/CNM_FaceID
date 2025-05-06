# app/controllers/phong_ban_controller.py
from flask import jsonify, request
from app.services.phong_ban_service import *

# Lấy tất cả phòng ban
def get_phong_ban():
    phong_ban_list = get_all_phong_ban_service()
    if phong_ban_list:
        return jsonify([pb.to_dict() for pb in phong_ban_list])
    else:
        return jsonify({'message': 'Không có dữ liệu phù hợp'}), 404

# Lấy phòng ban theo ID
def get_phong_ban_by_id(id):
    phong_ban = get_phong_ban_by_ma_service(id)
    if phong_ban:
        return jsonify(phong_ban.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy phòng ban'}), 404

# Tạo phòng ban mới
def create_phong_ban():
    data = request.get_json()
    if not data or 'ma_phong_ban' not in data or 'ten_phong_ban' not in data:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    new_pb = create_phong_ban_service(data)
    return jsonify(new_pb.to_dict()), 201

# Cập nhật phòng ban theo ID
def update_phong_ban(id):
    data = request.get_json()
    phong_ban = update_phong_ban_service(id, data)
    if not phong_ban:
        return jsonify({'message': 'Không tìm thấy phòng ban'}), 404
    return jsonify(phong_ban.to_dict())

# Xóa phòng ban theo ID
def delete_phong_ban(id):
    phong_ban = delete_phong_ban_service(id)
    if not phong_ban:
        return jsonify({'message': 'Không tìm thấy phòng ban'}), 404
    return jsonify({'message': 'Xóa phòng ban thành công'})

