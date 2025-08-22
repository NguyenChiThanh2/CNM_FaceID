# app/routes/chuc_vu_routers.py
from flask import Blueprint
from app.controllers.chuc_vu_controller import *

chuc_vu_bp = Blueprint('chuc_vu', __name__)

# Lấy tất cả chức vụ
@chuc_vu_bp.route('/get-all-chuc-vu', methods=['GET'])
def get_all_chuc_vus_router():
    return get_all_chuc_vu()

# Lấy chức vụ theo ID
@chuc_vu_bp.route('/get-chuc-vu-by-id/<int:id>', methods=['GET'])
def get_chuc_vu_by_id_router(id):
    return get_chuc_vu_by_id(id)

# Tạo chức vụ mới
@chuc_vu_bp.route('/add-chuc-vu', methods=['POST'])
def create_chuc_vu_router():
    return create_chuc_vu()

# Cập nhật chức vụ theo ID
@chuc_vu_bp.route('/eidt-chuc-vu/<int:id>', methods=['PUT'])
def update_chuc_vu_router(id):
    return update_chuc_vu(id)

# Xóa chức vụ theo ID
@chuc_vu_bp.route('/delete-chuc-vu/<int:id>', methods=['DELETE'])
def delete_chuc_vu_router(id):
    return delete_chuc_vu(id)
