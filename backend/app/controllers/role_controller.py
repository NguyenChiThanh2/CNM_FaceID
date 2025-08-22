# app/controllers/role_controller.py
from flask import jsonify, request
from app.services.role_service import (
    get_all_roles,
    get_role_by_name as get_role_by_name_service
)

def get_roles():
    roles = get_all_roles()
    if roles:
        return jsonify([role.to_dict() for role in roles]), 200
    else:
        return jsonify({'message': 'Không có dữ liệu phù hợp'}), 404

def get_role_by_name(ten_role):
    role = get_role_by_name_service(ten_role)
    if role:
        return jsonify(role.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy vai trò phù hợp'}), 404
