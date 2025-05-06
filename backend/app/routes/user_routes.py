# app/routes/user_routes.py
from flask import Blueprint
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
