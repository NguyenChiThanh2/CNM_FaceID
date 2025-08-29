from flask import Blueprint, request, jsonify
from app.controllers.cham_cong_controller import (
    get_all_cham_cong,
    get_cham_cong_by_id,
    update_cham_cong,
    delete_cham_cong
)
# Dùng service mới cho check-in
from app.services.cham_cong_service import (
    create_cham_cong_from_face_service_passive,
    create_cham_cong_from_face_service,  # giữ để tương thích nếu cần
)

cham_cong_bp = Blueprint('cham_cong_bp', __name__, url_prefix='/api')

# CRUD giữ nguyên
@cham_cong_bp.route('/get-all-cham-cong', methods=['GET'])
def get_all_cham_cong_router():
    return get_all_cham_cong()

@cham_cong_bp.route('/get-cham-cong-by-id/<int:id>', methods=['GET'])
def get_cham_cong_by_id_router(id):
    return get_cham_cong_by_id(id)

@cham_cong_bp.route('/edit-cham-cong/<int:id>', methods=['PUT'])
def update_cham_cong_router(id):
    return update_cham_cong(id)

@cham_cong_bp.route('/delete-cham-cong/<int:id>', methods=['DELETE'])
def delete_cham_cong_router(id):
    return delete_cham_cong(id)

# Check-in (passive liveness nếu có frames; fallback 1 ảnh)
@cham_cong_bp.route('/face-checkin', methods=['POST'])
def face_checkin_router():
    data = request.get_json(silent=True) or {}
    # Ưu tiên route mới: dùng preview_token + frames (hoặc image_base64)
    if data.get("preview_token"):
        res, code = create_cham_cong_from_face_service_passive(data)
        return jsonify(res), code

    # Fallback: API cũ chỉ có 1 ảnh (không token)
    base64_image = data.get('image_base64')
    if not base64_image:
        return jsonify({"ok": False, "message": "Thiếu ảnh base64"}), 400
    res, code = create_cham_cong_from_face_service(base64_image)
    return jsonify(res), code
