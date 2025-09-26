
from flask import Blueprint, request, jsonify
import os, jwt, hashlib, numpy as np
from datetime import datetime, timedelta
import face_recognition
from app.models.nhan_vien_model import NhanVien
from app.utils.file_utils import read_image_from_base64

face_bp = Blueprint("face_bp", __name__)

# ===== Config =====
SECRET        = os.getenv("FACE_JWT_SECRET", "dev-secret")
THRESH        = float(os.getenv("FACE_MATCH_THRESH", "0.38"))  # khuyến nghị nới ~0.5 cho kính
DET_MODEL     = os.getenv("FACE_DET_MODEL", "hog")            # "hog" | "cnn"
UPSAMPLE      = int(os.getenv("FACE_UPSAMPLE", "1"))          # 0|1|2
ENC_JITTERS   = int(os.getenv("FACE_ENC_JITTERS", "2"))       # 0..10 (2-5 là hợp lý)
ENC_MODEL     = os.getenv("FACE_ENC_MODEL", "large")          # "small" | "large"
MIN_FACE_PX   = int(os.getenv("MIN_FACE_PX", "120"))          # cạnh ngắn tối thiểu của bbox
# Nếu read_image_from_base64 trả về BGR (OpenCV), đặt READ_IS_BGR=1 để chuyển sang RGB
READ_IS_BGR   = os.getenv("READ_IS_BGR", "0") == "1"

def _ensure_rgb(img):
    # face_recognition yêu cầu RGB
    if READ_IS_BGR:
        return img[:, :, ::-1]
    return img

def _bbox_size(loc):
    top, right, bottom, left = loc
    return (bottom - top) * (right - left)

def best_match(input_encoding, all_nv, thresh=THRESH):
    """
    Hỗ trợ:
      - nv.face_encodings: list các encoding (có kính/không kính, điều kiện ánh sáng khác nhau)
      - nv.face_encoding : 1 encoding duy nhất (tương thích cũ)
    Chọn NV có khoảng cách NHỎ NHẤT; chấp nhận nếu <= thresh.
    """
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

    img = read_image_from_base64(b64)      # có thể là BGR hoặc RGB tuỳ util
    img = _ensure_rgb(img)                 # đảm bảo RGB cho face_recognition

    # 1) Tìm khuôn mặt với detector + upsample (giúp mặt nhỏ/đeo kính)
    locs = face_recognition.face_locations(
        img,
        number_of_times_to_upsample=UPSAMPLE,
        model=DET_MODEL
    )
    if not locs:
        return jsonify(ok=False, message="Không thấy khuôn mặt"), 400

    # 2) Chọn mặt lớn nhất
    locs.sort(key=_bbox_size, reverse=True)
    top, right, bottom, left = locs[0]

    # 3) Chặn nếu mặt quá nhỏ (xa camera → dễ sai khi đeo kính)
    if min(bottom - top, right - left) < MIN_FACE_PX:
        return jsonify(ok=False, message="Khuôn mặt quá nhỏ, vui lòng tiến gần hơn"), 400

    # 4) Encode robust hơn với jitters + model='large'
    encs = face_recognition.face_encodings(
        img,
        known_face_locations=[(top, right, bottom, left)],
        num_jitters=ENC_JITTERS,
        model=ENC_MODEL
    )
    if not encs:
        return jsonify(ok=False, message="Không mã hoá được khuôn mặt"), 400

    probe = encs[0]

    # 5) So khớp với nhiều encoding (nếu có), chọn min distance
    nv, dist = best_match(probe, NhanVien.query.all(), THRESH)
    if not nv:
        return jsonify(ok=False, message="Không khớp nhân viên nào"), 404

    # 6) Trả về preview_token (giữ nguyên như bạn đang dùng)
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
    ), 200
