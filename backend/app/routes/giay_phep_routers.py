from flask import Blueprint
from app.controllers.giay_phep_controller import *
from app.services.giay_phep_service import *

giayphep_bp = Blueprint('giayphep_bp', __name__,)


# Lấy tất cả lương
@giayphep_bp.route('/get-all-giay-phep', methods=['GET'])
def get_all_giay_phep_router():
    return get_all_giay_phep_controller()


@giayphep_bp.route('/get_giay_phep_quen_chamcong/<int:cham_cong_id>', methods=['GET'])
def get_all_luong_router(cham_cong_id):
    if not cham_cong_id:
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
    return get_giay_phep_quen_chamcong_controller(cham_cong_id)



@giayphep_bp.route('/add-giay-phep', methods=['POST'])
def create_giay_phep_router():
    return create_giay_phep_controller()

@giayphep_bp.route('/edit-giay-phep/<int:id>', methods=['PUT'])
def update_giay_phep_router(id):
    return update_giay_phep_controller(id)


@giayphep_bp.route('/approve-giay-phep/<int:id>', methods=['PUT'])
def approve_giay_phep_router(id):
    return approve_giay_phep_controller(id) 

@giayphep_bp.route('/reject-giay-phep/<int:id>', methods=['PUT'])
def reject_giay_phep_router(id):
    return reject_giay_phep_controller(id) 

@giayphep_bp.route('/cancel-giay-phep/<int:id>', methods=['DELETE'])
def cancle_giay_phep_router(id):
    return cancle_giay_phep_controller(id) 

# @giayphep_bp.route('/delete-giay-phep/<int:id>', methods=['DELETE'])
# def delete_giay_phep_router(id):
#     return delete_giay_phep_controller(id)