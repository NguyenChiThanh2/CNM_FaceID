from flask import Blueprint, request
from app.controllers.khau_tru_controller import *

from app.decorators.auth_decorators import require_module_permission, permission_required

khau_tru_bp = Blueprint('khau_tru_bp', __name__)


# remove-nhan-vien-from-khau-tru dùng POST nhưng là hành động XÓA, không phải
# "tạo mới" theo suy luận method mặc định -> loại trừ, gắn thẳng đúng quyền.
_LOAI_TRU_SUY_QUYEN_THEO_METHOD = {
    'khau_tru_bp.remove_nhan_vien_from_khau_tru',
}


@khau_tru_bp.before_request
def _require_permission():
    if request.endpoint in _LOAI_TRU_SUY_QUYEN_THEO_METHOD:
        return
    return require_module_permission("khau_tru")()

# Lấy tất cả khấu trừ
@khau_tru_bp.route('/get-all-khau-tru', methods=['GET'])
def get_all_khau_trus_router():
    return get_all_khau_trus()

# Lấy khấu trừ theo tên
@khau_tru_bp.route('/get-khau-tru-by-name/<string:name>', methods=['GET'])
def get_khau_tru_by_name_router(name):
    return get_khau_tru_by_name(name)
# Lấy khấu trừ của một nhân viên theo ID
@khau_tru_bp.route('/get-khau-tru-by-nhan-vien-id/<int:nhan_vien_id>', methods=['GET'])
def get_khau_tru_by_nhan_vien_id_router(nhan_vien_id):
    return get_khau_tru_by_nhan_vien_id(nhan_vien_id)
# Lấy khấu trừ theo ID
@khau_tru_bp.route('/get-khau-tru-by-id/<int:khau_tru_id>', methods=['GET'])
def get_khau_tru_by_id_router(khau_tru_id):
    return get_khau_tru_by_id(khau_tru_id)

# Tạo mới khấu trừ
@khau_tru_bp.route('/add-khau-tru', methods=['POST'])
def create_khau_tru_router():
    return create_khau_tru()
    

# Cập nhật khấu trừ
@khau_tru_bp.route('/edit-khau-tru/<int:khau_tru_id>', methods=['PUT'])
def update_khau_tru_router(khau_tru_id):
    return update_khau_tru(khau_tru_id)

# Xoá khấu trừ
@khau_tru_bp.route('/delete-khau-tru/<int:khau_tru_id>', methods=['DELETE'])
def delete_khau_tru_router(khau_tru_id):
    return delete_khau_tru(khau_tru_id)


@khau_tru_bp.route("/add-nhan-vien-to-khau-tru", methods=["POST"])
def add_nhan_vien_to_khau_tru():
    data = request.get_json()
    return add_nhan_vien_to_khau_tru_controller(data)

@khau_tru_bp.route("/get-all-nhan-vien-by-khau-tru-id/<int:khau_tru_id>", methods=["GET"])
def get_nhan_vien_by_khau_tru(khau_tru_id):
    return get_nhan_vien_by_khau_tru_controller(khau_tru_id)

@khau_tru_bp.route("/remove-nhan-vien-from-khau-tru", methods=["POST"])
@permission_required("khau_tru.xoa")
def remove_nhan_vien_from_khau_tru():
    return remove_nhan_vien_from_khau_tru_controller()

