from flask import Blueprint
from app.controllers.nhan_vien_phuc_loi_controller import *

nhan_vien_phuc_loi_bp = Blueprint('nhan_vien_phuc_loi', __name__)

# GET tất cả
@nhan_vien_phuc_loi_bp.route('/get-all-nhan-vien-phuc-loi', methods=['GET'])
def get_all_nhan_vien_phuc_loi_route():
    return get_all_nhan_vien_phuc_loi_controller()

# GET theo ID
@nhan_vien_phuc_loi_bp.route('/get-nhan-vien-phuc-loi-by-id/<int:id>', methods=['GET'])
def get_nhan_vien_phuc_loi_by_id_route(id):
    return get_nhan_vien_phuc_loi_by_id_controller(id)

# GET theo ID nhân viên
@nhan_vien_phuc_loi_bp.route('/get-phuc-loi-by-nhan-vien-id/nhan_vien/<int:nhan_vien_id>', methods=['GET'])
def get_phuc_loi_by_nhan_vien_id_route(nhan_vien_id):
    return get_phuc_loi_by_nhan_vien_id_controller(nhan_vien_id)

# GET theo ID phúc lợi
@nhan_vien_phuc_loi_bp.route('/get-nhan-vien-by-phuc-loi-id/phuc-loi/<int:phuc_loi_id>', methods=['GET'])
def get_nhan_vien_by_phuc_loi_id_route(phuc_loi_id):
    return get_nhan_vien_by_phuc_loi_id_controller(phuc_loi_id)

# POST
@nhan_vien_phuc_loi_bp.route('/add-nhan-vien-phuc-loi', methods=['POST'])
def create_nhan_vien_phuc_loi_route():
    return create_nhan_vien_phuc_loi_controller()

# PUT
@nhan_vien_phuc_loi_bp.route('/edit-nhan-vien-phuc-loi/<int:id>', methods=['PUT'])
def update_nhan_vien_phuc_loi_route(id):
    return update_nhan_vien_phuc_loi_controller(id)

# DELETE
@nhan_vien_phuc_loi_bp.route('/delete-nhan-vien-phuc-loi/<int:id>', methods=['DELETE'])
def delete_nhan_vien_phuc_loi_route(id):
    return delete_nhan_vien_phuc_loi_controller(id)
