from flask import Blueprint, request, jsonify
import os, jwt, hashlib, numpy as np
from datetime import datetime, timedelta
import face_recognition
from app.models.nhan_vien_model import NhanVien
from app.utils.file_utils import read_image_from_base64

face_bp = Blueprint("face_bp", __name__)

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


def best_match(input_encoding, all_nv, thresh=THRESH):
    matched, min_d = None, float("inf")
    for nv in all_nv:
        enc_list = []
        if hasattr(nv, "face_encodings") and nv.face_encodings:
            enc_list.extend(nv.face_encodings)
        elif getattr(nv, "face_encoding", None) is not None:
            enc_list.append(nv.face_encoding)

        for enc in enc_list:
            if enc is None:
                continue
            known = np.array(enc)
            d = np.linalg.norm(known - input_encoding)
            if d < min_d:
                min_d, matched = d, nv

    if min_d <= thresh:
        return matched, min_d
    return None, min_d


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

    # 5) match
    nv, dist = best_match(probe, NhanVien.query.all(), THRESH)
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
