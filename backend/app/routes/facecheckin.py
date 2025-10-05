from flask import Blueprint, jsonify
from app.utils.network_info import get_network_info, list_all_macs
from config import ALLOWED_MACS

facecheckin_bp = Blueprint("facecheckin", __name__, url_prefix="/api")

def _norm(mac: str) -> str:
    return (mac or "").upper().replace("-", "").replace(":", "").replace(".", "")

_allowed_set = set(_norm(m) for m in ALLOWED_MACS)

@facecheckin_bp.get("/network-info")
def api_network_info():
    return jsonify(get_network_info())

@facecheckin_bp.get("/allow-facecheckin")
def allow_facecheckin():
    """
    200: cho phép
    403: từ chối
    body: { allowed: bool, macs: [...], reason?: str }
    """
    macs = list_all_macs()
    ok = any(_norm(m) in _allowed_set for m in macs)
    if ok:
        return jsonify({"allowed": True, "macs": macs}), 200
    return jsonify({"allowed": False, "macs": macs, "reason": "MAC không được cấp quyền"}), 403
