# app/controllers/danh_gia_controller.py
from flask import request, jsonify
from datetime import date

from app.services import danh_gia_service
from app.decorators.auth_decorators import get_current_nhan_vien, is_hr


# Bản đánh giá liên quan tới 2 người: người được đánh giá (nhan_vien_id) và
# người đánh giá (nguoi_danh_gia_id). Cả 2 được XEM (nhân viên có quyền biết
# đánh giá của chính mình, người đánh giá cần xem lại đánh giá mình đã làm),
# nhưng chỉ HR hoặc ĐÚNG người đánh giá mới được SỬA/XÓA — không cho người bị
# đánh giá tự sửa/xóa điểm của chính mình dù có quyền "danh_gia.sua/xoa"
# (quyền này cần thiết để trưởng phòng sửa đánh giá do họ tạo).
def _duoc_xem(row, nv):
    return bool(nv) and (is_hr(nv) or nv.id in (row.nhan_vien_id, row.nguoi_danh_gia_id))


def _duoc_sua_xoa(row, nv):
    return bool(nv) and (is_hr(nv) or nv.id == row.nguoi_danh_gia_id)


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
        print(f"Lỗi khi lấy danh sách đánh giá: {e}")
        return jsonify({"message": "Không thể lấy danh sách đánh giá, vui lòng thử lại sau"}), 400


# ============== GET ONE ==============
def get_danh_gia_controller(id: int):
    row = danh_gia_service.get_danh_gia_by_id_service(id)
    if not row:
        return jsonify({"message": "Không tìm thấy bản đánh giá"}), 404
    if not _duoc_xem(row, get_current_nhan_vien()):
        return jsonify({"message": "Bạn không có quyền xem bản đánh giá này"}), 403
    return jsonify(row.to_dict()), 200


# ============== CREATE ==============
def create_danh_gia_controller():
    payload = dict(request.get_json(silent=True) or {})
    nv = get_current_nhan_vien()
    if not nv:
        return jsonify({"message": "Chưa đăng nhập"}), 401
    # Người đánh giá LUÔN là người đang đăng nhập — không tin nguoi_danh_gia_id
    # client tự gửi lên. Trước đây payload["nguoi_danh_gia_id"] lấy thẳng từ
    # JSON client, ai có quyền "danh_gia.them" có thể giả mạo là người khác
    # đánh giá, hoặc tự tạo đánh giá cho chính mình với điểm tối đa. Chỉ HR
    # mới được chỉ định người đánh giá khác (nhập liệu thay người vắng mặt).
    if not is_hr(nv):
        payload["nguoi_danh_gia_id"] = nv.id

    row, err = danh_gia_service.create_danh_gia_service(payload)
    if err:
        return jsonify({"message": err}), 400
    return jsonify(row.to_dict()), 201


# ============== UPDATE ==============
def update_danh_gia_controller(id: int):
    existing = danh_gia_service.get_danh_gia_by_id_service(id)
    if not existing:
        return jsonify({"message": "Không tìm thấy bản đánh giá"}), 404
    nv = get_current_nhan_vien()
    if not _duoc_sua_xoa(existing, nv):
        return jsonify({"message": "Bạn không có quyền sửa bản đánh giá này"}), 403

    payload = dict(request.get_json(silent=True) or {})
    if not is_hr(nv):
        # Không cho người đánh giá tự đổi "người đánh giá" của bản ghi (tức tự
        # chuyển quyền tác giả đánh giá sang người khác) — chỉ HR mới được sửa
        # trường này.
        payload.pop("nguoi_danh_gia_id", None)

    row, err = danh_gia_service.update_danh_gia_service(id, payload)
    if err:
        if "Không tìm thấy" in err:
            return jsonify({"message": err}), 404
        return jsonify({"message": err}), 400
    return jsonify(row.to_dict()), 200


# ============== DELETE ==============
def delete_danh_gia_controller(id: int):
    existing = danh_gia_service.get_danh_gia_by_id_service(id)
    if not existing:
        return jsonify({"message": "Không tìm thấy bản đánh giá"}), 404
    if not _duoc_sua_xoa(existing, get_current_nhan_vien()):
        return jsonify({"message": "Bạn không có quyền xóa bản đánh giá này"}), 403

    ok, err = danh_gia_service.delete_danh_gia_service(id)
    if not ok:
        if err and "Không tìm thấy" in err:
            return jsonify({"message": err}), 404
        return jsonify({"message": err or "Xóa thất bại"}), 400
    return jsonify({"message": "Đã xóa đánh giá"}), 200

