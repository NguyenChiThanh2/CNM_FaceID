# app/controllers/vai_tro_controller.py
from flask import request, jsonify

from app.services.vai_tro_service import (
    get_all_vai_tro_service,
    get_vai_tro_by_id_service,
    create_vai_tro_service,
    update_vai_tro_service,
    delete_vai_tro_service,
    set_quyen_cho_vai_tro_service,
    gan_vai_tro_cho_nhan_vien_service,
)
from app.services.quyen_service import get_all_quyen_service


def get_all_vai_tro_controller():
    ds = get_all_vai_tro_service()
    return jsonify([v.to_dict(with_quyen=True) for v in ds]), 200


def get_vai_tro_by_id_controller(vai_tro_id):
    vai_tro = get_vai_tro_by_id_service(vai_tro_id)
    if not vai_tro:
        return jsonify({"message": "Không tìm thấy vai trò"}), 404
    return jsonify(vai_tro.to_dict(with_quyen=True)), 200


def create_vai_tro_controller():
    data = request.get_json(silent=True) or {}
    ten_vai_tro = (data.get("ten_vai_tro") or "").strip()
    if not ten_vai_tro:
        return jsonify({"message": "Tên vai trò là bắt buộc"}), 400

    try:
        vai_tro = create_vai_tro_service(
            ten_vai_tro=ten_vai_tro,
            mo_ta=data.get("mo_ta"),
            ma_quyen_list=data.get("ma_quyen_list"),
        )
        return jsonify(vai_tro.to_dict(with_quyen=True)), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


def update_vai_tro_controller(vai_tro_id):
    data = request.get_json(silent=True) or {}
    try:
        vai_tro = update_vai_tro_service(
            vai_tro_id,
            ten_vai_tro=data.get("ten_vai_tro"),
            mo_ta=data.get("mo_ta"),
        )
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    if not vai_tro:
        return jsonify({"message": "Không tìm thấy vai trò"}), 404
    return jsonify(vai_tro.to_dict(with_quyen=True)), 200


def delete_vai_tro_controller(vai_tro_id):
    try:
        deleted = delete_vai_tro_service(vai_tro_id)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    if not deleted:
        return jsonify({"message": "Không tìm thấy vai trò"}), 404
    return jsonify({"message": "Đã xóa vai trò"}), 200


def set_quyen_cho_vai_tro_controller(vai_tro_id):
    data = request.get_json(silent=True) or {}
    ma_quyen_list = data.get("ma_quyen_list")
    if not isinstance(ma_quyen_list, list):
        return jsonify({"message": "ma_quyen_list phải là 1 danh sách"}), 400

    vai_tro = set_quyen_cho_vai_tro_service(vai_tro_id, ma_quyen_list)
    if not vai_tro:
        return jsonify({"message": "Không tìm thấy vai trò"}), 404
    return jsonify(vai_tro.to_dict(with_quyen=True)), 200


def get_all_quyen_controller():
    ds = get_all_quyen_service()
    return jsonify([q.to_dict() for q in ds]), 200


def gan_vai_tro_cho_nhan_vien_controller(nhan_vien_id):
    data = request.get_json(silent=True) or {}
    # vai_tro_id có thể là None -> gỡ vai trò khỏi nhân viên
    vai_tro_id = data.get("vai_tro_id")

    nv, error = gan_vai_tro_cho_nhan_vien_service(nhan_vien_id, vai_tro_id)
    if error:
        return jsonify({"message": error}), 404
    return jsonify(nv.to_dict()), 200
