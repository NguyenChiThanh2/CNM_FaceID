from flask import Blueprint, request, jsonify
import os, jwt, hashlib
from datetime import datetime, timedelta
import face_recognition
from app.utils.file_utils import read_image_from_base64
from app.services.cham_cong_service import tim_nhan_vien_khop_nhat
from app.routes.facecheckin_routes import find_active_device, get_device_token_from_request

face_bp = Blueprint("face_bp", __name__)


# /api/face/recognize là bước nhận diện "đây là ai" chạy TRƯỚC khi có JWT nhân
# viên (kiosk chấm công gọi trước /face-checkin, xem FaceCheckIn.jsx) — không
# thể gắn @jwt_required() ở đây vì lúc này chưa ai đăng nhập cả. Trước đây bị
# bỏ sót hoàn toàn khỏi đợt quét JWT, khiến bất kỳ ai cũng POST ảnh lên để dò
# xem 1 khuôn mặt có phải nhân viên công ty không. Áp cùng cơ chế token thiết
# bị mà /face-checkin đang dùng, để chỉ kiosk đã được cấp quyền mới gọi được.
@face_bp.before_request
def _require_device():
    if not find_active_device(get_device_token_from_request()):
        return jsonify(ok=False, message="Thiết bị chưa được cấp quyền chấm công"), 403

# ===== Config =====
SECRET        = os.getenv("FACE_JWT_SECRET", "dev-secret")
# nới nhẹ để nhận mặt xa / sáng xấu / hơi lệch
THRESH        = float(os.getenv("FACE_MATCH_THRESH", "0.39"))
DET_MODEL     = os.getenv("FACE_DET_MODEL", "hog")      # "hog" | "cnn"
UPSAMPLE      = int(os.getenv("FACE_UPSAMPLE", "1"))    # 0|1|2
ENC_JITTERS   = int(os.getenv("FACE_ENC_JITTERS", "2")) # 0..10
ENC_MODEL     = os.getenv("FACE_ENC_MODEL", "large")    # "small" | "large"
# em muốn nhận xa nên để mặc định 50
MIN_FACE_PX   = int(os.getenv("MIN_FACE_PX", "50"))
READ_IS_BGR   = os.getenv("READ_IS_BGR", "0") == "1"


def _ensure_rgb(img):
    if READ_IS_BGR:
        return img[:, :, ::-1]
    return img


def _bbox_size(loc):
    top, right, bottom, left = loc
    return (bottom - top) * (right - left)


@face_bp.route("/api/face/recognize", methods=["POST"])
def recognize():
    data = request.get_json(silent=True) or {}
    b64 = data.get("image_base64")
    if not b64:
        return jsonify(ok=False, message="Thiếu ảnh"), 400

    img = read_image_from_base64(b64)
    if img is None:
        return jsonify(ok=False, message="Ảnh không hợp lệ"), 400

    img = _ensure_rgb(img)

    # 1) detect
    locs = face_recognition.face_locations(
        img,
        number_of_times_to_upsample=UPSAMPLE,
        model=DET_MODEL
    )
    if not locs:
        return jsonify(ok=False, message="Không thấy khuôn mặt"), 400

    # 2) pick biggest
    locs.sort(key=_bbox_size, reverse=True)
    top, right, bottom, left = locs[0]

    face_w = right - left
    face_h = bottom - top
    face_min = min(face_w, face_h)

    # 3) mặt quá nhỏ -> báo rõ để FE đừng reset
    if face_min < MIN_FACE_PX:
        return jsonify(
            ok=False,
            message="Khuôn mặt quá nhỏ, vui lòng tiến gần hơn",
            face_min=face_min,
            required=MIN_FACE_PX,
            reason="face_too_small"
        ), 400

    # 4) encode
    encs = face_recognition.face_encodings(
        img,
        known_face_locations=[(top, right, bottom, left)],
        num_jitters=ENC_JITTERS,
        model=ENC_MODEL
    )
    if not encs:
        return jsonify(ok=False, message="Không mã hoá được khuôn mặt"), 400

    probe = encs[0]

    # 5) match — query đã lọc sẵn "chỉ nhân viên có face_encoding" bên trong
    # tim_nhan_vien_khop_nhat, không cần tự NhanVien.query.all() ở đây nữa.
    nv, dist = tim_nhan_vien_khop_nhat(probe, THRESH)
    if not nv:
        return jsonify(
            ok=False,
            message="Không khớp nhân viên nào",
            distance=float(dist),
            face_min=face_min,
            reason="no_employee"
        ), 404

    # 6) token
    enc_sha = hashlib.sha256(probe.tobytes()).hexdigest()
    token = jwt.encode(
        {
            "sub": "preview",
            "nv_id": nv.id,
            "enc_sha": enc_sha,
            "typ": "preview",
            "exp": datetime.utcnow() + timedelta(seconds=20),
        },
        SECRET,
        algorithm="HS256",
    )

    return jsonify(
        ok=True,
        nhan_vien={"id": nv.id, "ho_ten": nv.ho_ten},
        preview_token=token,
        distance=float(dist),
        face_min=face_min,
    ), 200
