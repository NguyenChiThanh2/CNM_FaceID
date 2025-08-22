# app/routes/nghi_phep_routers.py

from flask import Blueprint
from app.controllers.nghi_phep_controller import *

nghi_phep_bp = Blueprint('nghi_phep', __name__)

# Lấy tất cả nghỉ phép
@nghi_phep_bp.route('/get-all-nghi-phep', methods=['GET'])
def get_all_nghi_pheps_router():
    return get_all_nghi_phep()

# Lấy nghỉ phép theo ID
@nghi_phep_bp.route('/get-nghi-phep-by-id/<int:id>', methods=['GET'])
def get_nghi_phep_by_id_router(id):
    return get_nghi_phep_by_id(id)

# Lấy nghỉ phép của nhân viên theo ID nhân viên
@nghi_phep_bp.route('/get-nghi-phep-by-id-nhan-vien/nhan-vien/<int:nhan_vien_id>', methods=['GET'])
def get_nghi_phep_by_nhan_vien_id_router(nhan_vien_id):
    return get_nghi_phep_by_nhan_vien_id(nhan_vien_id)



# Tạo nghỉ phép mới
@nghi_phep_bp.route('/add-nghi-phep', methods=['POST'])
def create_nghi_phep_router():
    return create_nghi_phep()

# Cập nhật nghỉ phép theo ID
@nghi_phep_bp.route('/edit-nghi-phep/<int:id>', methods=['PUT'])
def update_nghi_phep_router(id):
    return update_nghi_phep(id)
# Duyệt nghỉ phép
@nghi_phep_bp.route('/approve-nghi-phep/<int:id>', methods=['PUT'])
def approve_nghi_phep_router(id):
    return approve_nghi_phep(id) 

@nghi_phep_bp.route('/reject-nghi-phep/<int:id>', methods=['PUT'])
def reject_nghi_phep_router(id):
    return reject_nghi_phep(id) 

@nghi_phep_bp.route('/cancle-nghi-phep/<int:id>', methods=['PUT'])
def cancle_nghi_phep_router(id):
    return cancle_nghi_phep(id) 


# Xóa nghỉ phép theo ID
@nghi_phep_bp.route('/delete-nghi-phep/<int:id>', methods=['DELETE'])
def delete_nghi_phep_router(id):
    return delete_nghi_phep(id)
