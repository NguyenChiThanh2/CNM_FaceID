from flask import Blueprint
from app.controllers.nhan_vien_controller import (
    get_all_nhan_vien_controller,
    get_nhan_vien_by_id_controller,
    create_nhan_vien_controller,
    update_nhan_vien_controller,
    delete_nhan_vien_controller
)

nhan_vien_bp = Blueprint('nhan_vien_bp', __name__)

@nhan_vien_bp.route('/get-all-nhan-vien', methods=['GET'])
def get_all_nhan_vien():
    return get_all_nhan_vien_controller()       

@nhan_vien_bp.route('/get-nhan-vien-by-id/<int:id>', methods=['GET'])
def get_nhan_vien_by_id(id):
    return get_nhan_vien_by_id_controller(id)

@nhan_vien_bp.route('/get-nhan-vien-by-trang-thai/<string:trang_thai>', methods=['GET'])
def get_nhan_vien_by_trang_thai(trang_thai):
    return get_nhan_vien_by_trang_thai(trang_thai)

@nhan_vien_bp.route('/add-nhan-vien', methods=['POST'])
def create_nhan_vien():
    return create_nhan_vien_controller()

@nhan_vien_bp.route('/edit-nhan-vien/<int:id>', methods=['PUT'])
def update_nhan_vien(id):
    return update_nhan_vien_controller(id)

@nhan_vien_bp.route('/delete-nhan-vien/<int:id>', methods=['DELETE'])
def delete_nhan_vien(id):
    return delete_nhan_vien_controller(id)
