from flask import Blueprint, request
from app.controllers.bh_dn_controller import *

from app.decorators.auth_decorators import require_module_permission

bao_hiem_dn_bp = Blueprint('bao_hiem_dn_bp', __name__)


@bao_hiem_dn_bp.before_request
def _require_permission():
    return require_module_permission("bao_hiem_dn")()


@bao_hiem_dn_bp.route("/get-bao-hiem-doanh-nghiep", methods=["GET"])
def get_bao_hiem_doanh_nghiep():
    return bao_hiem_dn_controller()