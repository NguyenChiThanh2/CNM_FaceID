# app/routes/vai_tro_routes.py
from flask import Blueprint
from flask_jwt_extended import verify_jwt_in_request

from app.decorators.auth_decorators import permission_required
from app.controllers.vai_tro_controller import (
    get_all_vai_tro_controller,
    get_vai_tro_by_id_controller,
    create_vai_tro_controller,
    update_vai_tro_controller,
    delete_vai_tro_controller,
    set_quyen_cho_vai_tro_controller,
    get_all_quyen_controller,
    gan_vai_tro_cho_nhan_vien_controller,
)

vai_tro_bp = Blueprint('vai_tro_bp', __name__, url_prefix='/api')


@vai_tro_bp.before_request
def _require_jwt():
    verify_jwt_in_request()


@vai_tro_bp.route('/vai-tro', methods=['GET'])
@permission_required("vai_tro.xem")
def get_all_vai_tro():
    return get_all_vai_tro_controller()


@vai_tro_bp.route('/vai-tro/<int:vai_tro_id>', methods=['GET'])
@permission_required("vai_tro.xem")
def get_vai_tro_by_id(vai_tro_id):
    return get_vai_tro_by_id_controller(vai_tro_id)


@vai_tro_bp.route('/vai-tro', methods=['POST'])
@permission_required("vai_tro.them")
def create_vai_tro():
    return create_vai_tro_controller()


@vai_tro_bp.route('/vai-tro/<int:vai_tro_id>', methods=['PUT'])
@permission_required("vai_tro.sua")
def update_vai_tro(vai_tro_id):
    return update_vai_tro_controller(vai_tro_id)


@vai_tro_bp.route('/vai-tro/<int:vai_tro_id>', methods=['DELETE'])
@permission_required("vai_tro.xoa")
def delete_vai_tro(vai_tro_id):
    return delete_vai_tro_controller(vai_tro_id)


@vai_tro_bp.route('/vai-tro/<int:vai_tro_id>/quyen', methods=['PUT'])
@permission_required("vai_tro.sua")
def set_quyen_cho_vai_tro(vai_tro_id):
    return set_quyen_cho_vai_tro_controller(vai_tro_id)


@vai_tro_bp.route('/quyen', methods=['GET'])
@permission_required("vai_tro.xem")
def get_all_quyen():
    return get_all_quyen_controller()


@vai_tro_bp.route('/nhan-vien/<int:nhan_vien_id>/vai-tro', methods=['PUT'])
@permission_required("vai_tro.sua")
def gan_vai_tro_cho_nhan_vien(nhan_vien_id):
    return gan_vai_tro_cho_nhan_vien_controller(nhan_vien_id)
