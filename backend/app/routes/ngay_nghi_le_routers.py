# app/routes/ngay_nghi_le_routers.py

from flask import Blueprint
from app.controllers.ngay_nghi_le_controller import *

ngay_nghi_le_bp = Blueprint('ngay_nghi_le', __name__)

# Lấy tất cả nghỉ phép
@ngay_nghi_le_bp.route('/get-all-ngay-nghi-le', methods=['GET'])
def get_all_ngay_nghi_les_router():
    return get_all_ngay_nghi_le()

# Lấy nghỉ phép theo ID
@ngay_nghi_le_bp.route('/get-ngay-nghi-le-by-id/<int:id>', methods=['GET'])
def get_ngay_nghi_le_by_id_router(id):
    return get_ngay_nghi_le_by_id(id)

# Tạo nghỉ phép mới
@ngay_nghi_le_bp.route('/add-ngay-nghi-le', methods=['POST'])
def create_ngay_nghi_le_router():
    return create_ngay_nghi_le()

# Cập nhật nghỉ phép theo ID
@ngay_nghi_le_bp.route('/edit-ngay-nghi-le/<int:id>', methods=['PUT'])
def update_ngay_nghi_le_router(id):
    return update_ngay_nghi_le(id)
# Duyệt nghỉ phép
@ngay_nghi_le_bp.route('/approve-ngay-nghi-le/<int:id>', methods=['PUT'])
def approve_ngay_nghi_le_router(id):
    return approve_ngay_nghi_le(id) 

@ngay_nghi_le_bp.route('/reject-ngay-nghi-le/<int:id>', methods=['PUT'])
def reject_ngay_nghi_le_router(id):
    return reject_ngay_nghi_le(id) 

@ngay_nghi_le_bp.route('/cancle-ngay-nghi-le/<int:id>', methods=['PUT'])
def cancle_ngay_nghi_le_router(id):
    return cancle_ngay_nghi_le(id) 


# Xóa nghỉ phép theo ID
@ngay_nghi_le_bp.route('/delete-ngay-nghi-le/<int:id>', methods=['DELETE'])
def delete_ngay_nghi_le_router(id):
    return delete_ngay_nghi_le(id)
