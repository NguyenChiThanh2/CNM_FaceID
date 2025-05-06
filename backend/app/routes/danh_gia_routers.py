# app/routes/danh_gia_routers.py
from flask import Blueprint
from app.controllers.danh_gia_controller import *

danh_gia_bp = Blueprint('danh_gia_bp', __name__)

# Lấy tất cả đánh giá
@danh_gia_bp.route('/get-all-danh-gia', methods=['GET'])
def get_all_danh_gia_router():
    return get_all_danh_gia()

# Lấy đánh giá theo ID
@danh_gia_bp.route('/get-danh-gia-by-id/<int:id>', methods=['GET'])
def get_danh_gia_by_id_router(id):
    return get_danh_gia_by_id(id)

# Lấy tất cả đánh giá của một nhân viên theo ID nhân viên
@danh_gia_bp.route('/get-danh-gia-by-nhan-vien-id/nhan-vien/<int:nhan_vien_id>', methods=['GET'])
def get_danh_gia_by_nhan_vien_id_router(nhan_vien_id):
    return get_danh_gia_by_nhan_vien_id(nhan_vien_id)

# Tạo đánh giá mới
@danh_gia_bp.route('/add-danh-gia', methods=['POST'])
def create_danh_gia_router():
    return create_danh_gia()

# Cập nhật đánh giá theo ID
@danh_gia_bp.route('/eidt-danh-gia/<int:id>', methods=['PUT'])
def update_danh_gia_router(id):
    return update_danh_gia(id)

# Xóa đánh giá theo ID
@danh_gia_bp.route('/delete-danh-gia/<int:id>', methods=['DELETE'])
def delete_danh_gia_router(id):
    return delete_danh_gia(id)
