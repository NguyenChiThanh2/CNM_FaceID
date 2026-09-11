from flask import Blueprint, request, jsonify
from app.decorators.auth_decorators import require_module_permission, permission_required
from app import limiter
from app.controllers.cham_cong_controller import (
    get_all_cham_cong,
    get_cham_cong_by_id,
    update_cham_cong,
    delete_cham_cong,
    get_chamcong_1nhanvien_theothang_controller,
    get_tinhsocong_1nhanvien_theothang_controller,
    get_tinhsocong_theogiayphep_controller
)
# Dùng service mới cho check-in
from app.services.cham_cong_service import (
    create_cham_cong_from_face_service_passive,
    create_cham_cong_from_face_service,  # giữ để tương thích nếu cần
)
from app.routes.facecheckin_routes import find_active_device, get_device_token_from_request

cham_cong_bp = Blueprint('cham_cong_bp', __name__, url_prefix='/api')


# /face-checkin dùng kiosk thiết bị (X-Device-Token riêng, xem facecheckin_routes.py),
# không phải nhân viên đăng nhập -> không thể yêu cầu quyền ở endpoint đó.
#
# /tinh-so-cong/<id> tuy là GET nhưng thực chất GHI ĐÈ so_cong vào DB (xem
# get_tinhsocong_1nhanvien_theothang_service) — nếu để suy quyền theo method
# như bình thường thì vai trò chỉ có "xem" vẫn ghi được dữ liệu. Loại trừ khỏi
# luật chung, gắn thẳng đúng quyền "sua" bằng permission_required bên dưới.
_LOAI_TRU_SUY_QUYEN_THEO_METHOD = {
    'cham_cong_bp.face_checkin_router',
    'cham_cong_bp.get_tinhsocong_1nhanvien_theothang',
}


@cham_cong_bp.before_request
def _require_permission():
    if request.endpoint in _LOAI_TRU_SUY_QUYEN_THEO_METHOD:
        return
    return require_module_permission("cham_cong")()


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
# Rate limit theo IP thiết bị — mỗi request chạy face_recognition (nặng CPU) và
# không yêu cầu JWT (chỉ cần X-Device-Token), nên không có hạn mức nào chặn
# trước đó; không giới hạn thì 1 request lặp lại liên tục (script hoặc thiết
# bị hỏng) có thể làm cạn CPU server (DoS). 20/phút đủ rộng cho giờ cao điểm
# nhân viên xếp hàng chấm công thật tại 1 kiosk.
@cham_cong_bp.route('/face-checkin', methods=['POST'])
@limiter.limit("20 per minute")
def face_checkin_router():
    device = find_active_device(get_device_token_from_request())
    if not device:
        return jsonify({"ok": False, "message": "Thiết bị chưa được cấp quyền chấm công"}), 403

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

# ------------------------------------------------------------------------
# Route: GET by ID theo tháng năm
@cham_cong_bp.route('/chamcong_1nhanvien_theothang/<int:id>', methods=['GET'])
def get_chamcong_1nhanvien_theothang(id):
    
    thang = request.args.get("thang",type=int)
    nam = request.args.get("nam", type=int)
    if not thang or not nam:
        return jsonify({'message': 'Thiếu tham số tháng hoặc năm'}), 400
    return get_chamcong_1nhanvien_theothang_controller(id, thang, nam)

# Route: GET by ID theo tháng năm — GHI ĐÈ so_cong vào DB dù là GET (xem
# _LOAI_TRU_SUY_QUYEN_THEO_METHOD ở trên), nên cần đúng quyền "sua".
@cham_cong_bp.route('/tinh-so-cong/<int:id>', methods=['GET'])
@permission_required("cham_cong.sua")
def get_tinhsocong_1nhanvien_theothang(id):
    thang = request.args.get("thang",type=int)
    nam = request.args.get("nam", type=int)
    if not thang or not nam:
        return jsonify({'message': 'Thiếu tham số tháng hoặc năm'}), 400
    return get_tinhsocong_1nhanvien_theothang_controller(id, thang, nam)

@cham_cong_bp.route('/tinhsocong_theogiayphep', methods=['PUT'])
def get_tinhsocong_theogiayphep_router(): 
    data = request.get_json(silent=True) or {}  # body sai định dạng -> {} thay vì crash 500
    cham_cong_id = data.get("cham_cong_id")
    if not cham_cong_id:
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
    return get_tinhsocong_theogiayphep_controller(cham_cong_id)