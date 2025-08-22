# routes/face_routes.py
from flask import Blueprint, request, jsonify
import os, jwt, hashlib, numpy as np, pytz
from datetime import datetime, timedelta
import face_recognition
from app.models.nhan_vien_model import NhanVien
from app.utils.file_utils import read_image_from_base64

face_bp = Blueprint("face_bp", __name__)
SECRET = os.getenv("FACE_JWT_SECRET", "dev-secret")
THRESH = 0.5

def best_match(input_encoding, all_nv, thresh=THRESH):
    matched, min_d = None, float("inf")
    for nv in all_nv:
        if nv.face_encoding:
            known = np.array(nv.face_encoding)
            d = np.linalg.norm(known - input_encoding)
            if d < min_d and d <= thresh:
                min_d, matched = d, nv
    return matched, min_d

@face_bp.route("/api/face/recognize", methods=["POST"])
def recognize():
    data = request.get_json(silent=True) or {}
    b64 = data.get("image_base64")
    if not b64:
        return jsonify(ok=False, message="Thiếu ảnh"), 400

    img = read_image_from_base64(b64)
    locs = face_recognition.face_locations(img)
    if not locs:
        return jsonify(ok=False, message="Không thấy khuôn mặt"), 400

    encs = face_recognition.face_encodings(img, known_face_locations=locs)
    if not encs:
        return jsonify(ok=False, message="Không mã hoá được khuôn mặt"), 400

    nv, dist = best_match(encs[0], NhanVien.query.all(), THRESH)
    if not nv:
        return jsonify(ok=False, message="Không khớp nhân viên nào"), 404

    enc_sha = hashlib.sha256(encs[0].tobytes()).hexdigest()
    token = jwt.encode(
        {"sub":"preview","nv_id":nv.id,"enc_sha":enc_sha,"exp": datetime.utcnow()+timedelta(seconds=10)},
        SECRET, algorithm="HS256"
    )
    return jsonify(ok=True, nhan_vien={"id": nv.id, "ho_ten": nv.ho_ten}, preview_token=token, distance=dist), 200
