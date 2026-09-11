import os
from datetime import datetime
from flask import Blueprint, jsonify, request
from app import db, limiter
from app.models.thiet_bi_model import ThietBiChamCong

facecheckin_bp = Blueprint("facecheckin", __name__, url_prefix="/api")

# Khóa bí mật dùng để tạo thiết bị mới lúc setup kiosk — KHÔNG lộ ra frontend,
# chỉ kỹ thuật viên setup máy mới biết (đặt trong .env, không hardcode).
DEVICE_SETUP_KEY = os.getenv("DEVICE_SETUP_KEY", "")


def get_device_token_from_request():
    return request.headers.get("X-Device-Token", "")


def find_active_device(token):
    if not token:
        return None
    token_hash = ThietBiChamCong.hash_token(token)
    return ThietBiChamCong.query.filter_by(token_hash=token_hash, active=True).first()


@facecheckin_bp.get("/allow-facecheckin")
def allow_facecheckin():
    """
    200: cho phép, kèm tên thiết bị
    403: từ chối (thiếu token hoặc token không hợp lệ/không còn active)
    """
    token = get_device_token_from_request()
    device = find_active_device(token)
    if device:
        device.lan_su_dung_cuoi = datetime.utcnow()
        db.session.commit()
        return jsonify({"allowed": True, "ten_thiet_bi": device.ten_thiet_bi}), 200
    return jsonify({"allowed": False, "reason": "Thiết bị chưa được cấp quyền chấm công"}), 403


@facecheckin_bp.post("/devices/register")
# Chặn brute-force dò DEVICE_SETUP_KEY: tối đa 5 lần thử/phút mỗi IP — cùng
# hạn mức và lý do như /login (xem nhan_vien_routes.py).
@limiter.limit("5 per minute")
def register_device():
    """
    Tạo thiết bị mới + sinh token. Chỉ dùng 1 lần lúc setup máy kiosk.
    Yêu cầu header X-Setup-Key khớp DEVICE_SETUP_KEY trong .env của server.
    """
    setup_key = request.headers.get("X-Setup-Key", "")
    if not DEVICE_SETUP_KEY or setup_key != DEVICE_SETUP_KEY:
        return jsonify({"message": "Không có quyền tạo thiết bị"}), 401

    data = request.get_json(silent=True) or {}
    ten_thiet_bi = (data.get("ten_thiet_bi") or "").strip()
    if not ten_thiet_bi:
        return jsonify({"message": "Thiếu ten_thiet_bi"}), 400

    raw_token = ThietBiChamCong.generate_token()
    device = ThietBiChamCong(
        ten_thiet_bi=ten_thiet_bi,
        token_hash=ThietBiChamCong.hash_token(raw_token),
        active=True,
    )
    db.session.add(device)
    db.session.commit()
    # Trả token bản rõ đúng 1 lần duy nhất lúc tạo (DB chỉ lưu hash, không thể
    # lấy lại bản rõ sau này) — kỹ thuật viên copy vào trình duyệt kiosk ngay.
    response = device.to_dict()
    response["token"] = raw_token
    return jsonify(response), 201


def _require_setup_key():
    setup_key = request.headers.get("X-Setup-Key", "")
    return bool(DEVICE_SETUP_KEY) and setup_key == DEVICE_SETUP_KEY


@facecheckin_bp.get("/devices")
def list_devices():
    if not _require_setup_key():
        return jsonify({"message": "Không có quyền xem danh sách thiết bị"}), 401
    devices = ThietBiChamCong.query.order_by(ThietBiChamCong.thoi_gian_tao.desc()).all()
    return jsonify([d.to_dict() for d in devices]), 200


@facecheckin_bp.put("/devices/<int:device_id>/revoke")
def revoke_device(device_id):
    if not _require_setup_key():
        return jsonify({"message": "Không có quyền thu hồi thiết bị"}), 401
    device = ThietBiChamCong.query.get(device_id)
    if not device:
        return jsonify({"message": "Không tìm thấy thiết bị"}), 404
    device.active = False
    db.session.commit()
    return jsonify({"message": "Đã thu hồi quyền thiết bị"}), 200
