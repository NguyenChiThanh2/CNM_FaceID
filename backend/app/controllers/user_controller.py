# app/controllers/user_controller.py
from flask import jsonify, request
from app.services.user_service import (
    get_all_users,
    get_user_by_id as get_user_by_id_service,
    create_new_user,
    update_user as update_user_service,
    delete_user as delete_user_service
)

# Lấy tất cả người dùng
def get_users():
    users = get_all_users()
    if users:
        return jsonify([user.to_dict() for user in users])
    else:
        return jsonify({'message': 'Không có dữ liệu phù hợp'}), 404

# Lấy người dùng theo ID
def get_user_by_id(user_id):
    user = get_user_by_id_service(user_id)
    if user:
        return jsonify(user.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy người dùng'}), 404

# Tạo người dùng mới
def create_user():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    new_user = create_new_user(
        username=data['username'],
        password=data['password'],
        email=data.get('email'),
        role_id=data.get('role_id')
    )
    return jsonify(new_user.to_dict()), 201

# Cập nhật người dùng theo ID
def update_user(user_id):
    user = get_user_by_id_service(user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy người dùng'}), 404

    data = request.get_json()
    updated_user = update_user_service(
        user,
        username=data.get('username'),
        password=data.get('password'),
        email=data.get('email'),
        role_id=data.get('role_id')
    )
    return jsonify(updated_user.to_dict())

# Xóa người dùng theo ID
def delete_user(user_id):
    user = get_user_by_id_service(user_id)
    if not user:
        return jsonify({'message': 'Không tìm thấy người dùng'}), 404

    delete_user_service(user)
    return jsonify({'message': 'Xóa người dùng thành công'})
