from flask import Blueprint
from app.controllers.chi_tiet_luong_controller import * 

from app.decorators.auth_decorators import require_module_permission

chitietluong_bp = Blueprint('chitietluong_bp', __name__,)


@chitietluong_bp.before_request
def _require_permission():
    return require_module_permission("chi_tiet_luong")()

@chitietluong_bp.route('/get-chi-tiet-luong/<int:bang_luong_id>', methods=['GET'])
def get_chi_tiet_luong_router(bang_luong_id):
    return get_chi_tiet_luong_controller(bang_luong_id)


















