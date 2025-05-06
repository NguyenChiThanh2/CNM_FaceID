# app/routes/phong_ban_routers.py
from flask import Blueprint
from app.controllers.phong_ban_controller import *

phong_ban_bp = Blueprint('phong_ban', __name__)

# Lấy tất cả phòng ban
@phong_ban_bp.route('/get-all-phong-ban', methods=['GET'])
def get_all_phong_bans_router():
    return get_phong_ban()

# Lấy phòng ban theo tên
@phong_ban_bp.route('/get-phong-ban-by-name/<string:ten_phong_ban>', methods=['GET'])
def get_phong_ban_by_name_router(ten_phong_ban):
    return get_phong_ban_by_name(ten_phong_ban)

# Lấy phòng ban theo ID
@phong_ban_bp.route('/get-phong-ban-by-id/<int:id>', methods=['GET'])
def get_phong_ban_by_id_router(id):
    return get_phong_ban_by_id(id)

# Tạo phòng ban mới
@phong_ban_bp.route('/add-phong-ban', methods=['POST'])
def create_phong_ban_router():
    return create_phong_ban()

# Cập nhật phòng ban theo ID
@phong_ban_bp.route('/edit-phong-ban/<int:id>', methods=['PUT'])
def update_phong_ban_router(id):
    return update_phong_ban(id)

# Xóa phòng ban theo ID
@phong_ban_bp.route('/delete-phong-ban/<int:ma_phong_ban>', methods=['DELETE'])
def delete_phong_ban_router(ma_phong_ban):
    return delete_phong_ban(ma_phong_ban)
