from flask import Blueprint
from app.controllers.loai_nghi_phep_controller import (
    get_all_loai_nghi_phep, get_loai_nghi_phep_by_id,
    create_loai_nghi_phep, update_loai_nghi_phep,
    delete_loai_nghi_phep
)

loai_nghi_phep_bp = Blueprint('loai_nghi_phep', __name__, url_prefix='/api')

# Lấy tất cả loại nghỉ phép
@loai_nghi_phep_bp.route('/loai-nghi-phep', methods=['GET'])
def get_all_loai_nghi_phep_router():
    return get_all_loai_nghi_phep()

# Lấy loại nghỉ phép theo ID
@loai_nghi_phep_bp.route('/loai-nghi-phep/<int:id>', methods=['GET'])
def get_loai_nghi_phep_by_id_router(id):
    return get_loai_nghi_phep_by_id(id)

# Tạo loại nghỉ phép mới
@loai_nghi_phep_bp.route('/loai-nghi-phep', methods=['POST'])
def create_loai_nghi_phep_router():
    return create_loai_nghi_phep()

# Cập nhật loại nghỉ phép theo ID
@loai_nghi_phep_bp.route('/loai-nghi-phep/<int:id>', methods=['PUT'])
def update_loai_nghi_phep_router(id):
    return update_loai_nghi_phep(id)

# Xóa loại nghỉ phép theo ID
@loai_nghi_phep_bp.route('/loai-nghi-phep/<int:id>', methods=['DELETE'])
def delete_loai_nghi_phep_router(id):
    return delete_loai_nghi_phep(id)
