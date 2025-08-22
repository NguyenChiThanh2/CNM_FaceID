from flask import Blueprint, request
from app.controllers.phuc_loi_controller import (
    get_all_phuc_lois,
    get_phuc_loi_by_name,
    get_phuc_loi_by_id,
    create_phuc_loi,
    update_phuc_loi,
    delete_phuc_loi,
    get_phuc_loi_by_nhan_vien_id
)

phuc_loi_bp = Blueprint('phuc_loi_bp', __name__ , url_prefix='/api')

# Lấy tất cả phúc lợi
@phuc_loi_bp.route('/get-all-phuc-loi', methods=['GET'])
def get_all_phuc_lois_router():
    return get_all_phuc_lois()

# Lấy phúc lợi theo tên
@phuc_loi_bp.route('/get-phuc-loi-by-name/<string:name>', methods=['GET'])
def get_phuc_loi_by_name_router(name):
    return get_phuc_loi_by_name(name)
# Lấy phúc lợi của một nhân viên theo ID
@phuc_loi_bp.route('/get-phuc-loi-by-nhan-vien-id/<int:nhan_vien_id>', methods=['GET'])
def get_phuc_loi_by_nhan_vien_id_router(nhan_vien_id):
    return get_phuc_loi_by_nhan_vien_id(nhan_vien_id)
# Lấy phúc lợi theo ID
@phuc_loi_bp.route('/get-phuc-loi-by-id/<int:phuc_loi_id>', methods=['GET'])
def get_phuc_loi_by_id_router(phuc_loi_id):
    return get_phuc_loi_by_id(phuc_loi_id)

# Tạo mới phúc lợi
@phuc_loi_bp.route('/add-phuc-loi', methods=['POST'])
def create_phuc_loi_router():
    return create_phuc_loi()

# Cập nhật phúc lợi
@phuc_loi_bp.route('/edit-phuc-loi/<int:phuc_loi_id>', methods=['PUT'])
def update_phuc_loi_router(phuc_loi_id):
    return update_phuc_loi(phuc_loi_id)

# Xoá phúc lợi
@phuc_loi_bp.route('/delete-phuc-loi/<int:phuc_loi_id>', methods=['DELETE'])
def delete_phuc_loi_router(phuc_loi_id):
    return delete_phuc_loi(phuc_loi_id)
