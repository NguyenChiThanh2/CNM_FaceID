from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token ,jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from app.models import User
from app.controllers.user_controller import *

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/get-all-users', methods=['GET'])
def get_all_users():
    return get_users()

@user_bp.route('/get-user-by-id/<int:user_id>', methods=['GET'])
def get_single_user(user_id):
    return get_user_by_id(user_id)

@user_bp.route('/add-user', methods=['POST'])
def create_new_user():
    return create_user()

@user_bp.route('/edit-user/<int:user_id>', methods=['PUT'])
def update_existing_user(user_id):
    return update_user(user_id)

@user_bp.route('/delete-user/<int:user_id>', methods=['DELETE'])
def delete_existing_user(user_id):
    return delete_user(user_id)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"msg": "Thông tin đăng nhập không chính xác"}), 401

    access_token = create_access_token(identity={
        "id": user.id,
        "username": user.username,
        "ma_vai_tro": user.role.ma_vai_tro   # Sử dụng role_id nếu bạn lưu vai trò ở đây
    })

    return jsonify({
    "access_token": access_token,
    "role": {
        "id": user.role.id,
        "ma_vai_tro": user.role.ma_vai_tro
    }
})



@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    current_user = get_jwt_identity()
    # Có thể ghi log ra user nào đã logout nếu cần
    return jsonify({"msg": f"Đăng xuất thành công cho user {current_user['username']}"}), 200