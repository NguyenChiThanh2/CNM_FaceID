from flask import Blueprint
from app.controllers.bang_luong_controller import *
from app.services.bang_luong_service import *

from app.decorators.auth_decorators import require_module_permission

bangluong_bp = Blueprint('bangluong_bp', __name__,)


@bangluong_bp.before_request
def _require_permission():
    return require_module_permission("bang_luong")()

@bangluong_bp.route('/get-all-bang-luong', methods=['GET'])
def get_all_luong_router():
    return get_all_luong()

# Xóa lương theo ID
@bangluong_bp.route('/delete-bangluong/<int:id>', methods=['DELETE'])
def delete_bangluong_router(id):
    return delete_bangluong(id)