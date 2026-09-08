# app/routes/chung_chi_routes.py
from flask import Blueprint

from app.decorators.auth_decorators import require_module_permission
from app.controllers.chung_chi_controller import (
    create_chung_chi_controller,
    get_chung_chi_by_nhan_vien_controller,
    delete_chung_chi_controller,
)

chung_chi_bp = Blueprint("chung_chi", __name__)


@chung_chi_bp.before_request
def _require_permission():
    return require_module_permission("chung_chi")()


@chung_chi_bp.route("/nhan_vien/<int:nv_id>/chung_chi", methods=["POST"])
def create_chung_chi(nv_id):
    return create_chung_chi_controller(nv_id)


@chung_chi_bp.route("/nhan_vien/<int:nv_id>/chung_chi", methods=["GET"])
def list_chung_chi(nv_id):
    return get_chung_chi_by_nhan_vien_controller(nv_id)


@chung_chi_bp.route("/chung_chi/<int:cc_id>", methods=["DELETE"])
def delete_chung_chi(cc_id):
    return delete_chung_chi_controller(cc_id)
