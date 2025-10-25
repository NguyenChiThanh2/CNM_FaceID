# app/controllers/danh_gia_controller.py
from flask import request, jsonify
from datetime import date

from app.services import danh_gia_service


# ============== LIST + FILTER ==============
def list_danh_gia_controller():
    try:
        ky_ngay = request.args.get("ky_ngay")
        ky_loai = request.args.get("ky_loai")
        phong_ban_id = request.args.get("phong_ban_id", type=int)
        reviewer_id = request.args.get("reviewer_id", type=int)
        nhan_vien_id = request.args.get("nhan_vien_id", type=int)

        ky_ngay_val = date.fromisoformat(ky_ngay) if ky_ngay else None

        rows = danh_gia_service.list_danh_gia_service(
            ky_ngay=ky_ngay_val,
            ky_loai=ky_loai,
            phong_ban_id=phong_ban_id,
            reviewer_id=reviewer_id,
            nhan_vien_id=nhan_vien_id
        )
        return jsonify([r.to_dict() for r in rows]), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400


# ============== GET ONE ==============
def get_danh_gia_controller(id: int):
    row = danh_gia_service.get_danh_gia_by_id_service(id)
    if not row:
        return jsonify({"message": "Không tìm thấy bản đánh giá"}), 404
    return jsonify(row.to_dict()), 200


# ============== CREATE ==============
def create_danh_gia_controller():
    payload = request.get_json(silent=True) or {}
    row, err = danh_gia_service.create_danh_gia_service(payload)
    if err:
        return jsonify({"message": err}), 400
    return jsonify(row.to_dict()), 201


# ============== UPDATE ==============
def update_danh_gia_controller(id: int):
    payload = request.get_json(silent=True) or {}
    row, err = danh_gia_service.update_danh_gia_service(id, payload)
    if err:
        if "Không tìm thấy" in err:
            return jsonify({"message": err}), 404
        return jsonify({"message": err}), 400
    return jsonify(row.to_dict()), 200


# ============== DELETE ==============
def delete_danh_gia_controller(id: int):
    ok, err = danh_gia_service.delete_danh_gia_service(id)
    if not ok:
        if err and "Không tìm thấy" in err:
            return jsonify({"message": err}), 404
        return jsonify({"message": err or "Xóa thất bại"}), 400
    return jsonify({"message": "Đã xóa đánh giá"}), 200

