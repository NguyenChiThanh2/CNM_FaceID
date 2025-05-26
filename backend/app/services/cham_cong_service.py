import face_recognition
import numpy as np
from app.models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong
from app import db
from datetime import datetime
import base64
import cv2
import io
import uuid
import pytz
from app.utils.file_utils import read_image_from_base64
import os

def get_all_cham_cong_service():
    return ChamCong.query.all()

def get_cham_cong_by_id_service(id):
    return ChamCong.query.get(id)

def get_cham_cong_by_nhan_vien_id_service(nhan_vien_id):
    return ChamCong.query.filter_by(nhan_vien_id=nhan_vien_id).all()


def update_cham_cong_service(id, thoi_gian_vao=None, thoi_gian_ra=None, ngay=None, hinh_anh=None):
    cham_cong = ChamCong.query.get(id)
    if not cham_cong:
        return None
    if thoi_gian_vao is not None:
        cham_cong.thoi_gian_vao = thoi_gian_vao
    if thoi_gian_ra is not None:
        cham_cong.thoi_gian_ra = thoi_gian_ra
    if ngay is not None:
        cham_cong.ngay = ngay
    if hinh_anh is not None:
        cham_cong.hinh_anh = hinh_anh
    db.session.commit()
    return cham_cong

def delete_cham_cong_service(id):
    cham_cong = ChamCong.query.get(id)
    if not cham_cong:
        return False
    db.session.delete(cham_cong)
    db.session.commit()
    return True
# def read_image_from_base64(base64_data):
#     image_data = base64.b64decode(base64_data.split(',')[-1])
#     nparr = np.frombuffer(image_data, np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#     return img

  # Đảm bảo bạn có hàm này

def create_cham_cong_from_face_service(base64_image):
    import os
    import numpy as np

    img = read_image_from_base64(base64_image)

    face_locations = face_recognition.face_locations(img)
    if len(face_locations) == 0:
        return {'message': 'Không phát hiện khuôn mặt nào'}, 400

    encodings = face_recognition.face_encodings(img, known_face_locations=face_locations)
    if not encodings:
        return {'message': 'Không thể mã hoá khuôn mặt'}, 400

    input_encoding = encodings[0]

    matched_nv = None
    min_distance = float('inf')
    threshold = 0.5

    all_nhan_vien = NhanVien.query.all()
    for nv in all_nhan_vien:
        if nv.face_encoding:
            known_encoding = np.array(nv.face_encoding)
            distance = np.linalg.norm(known_encoding - input_encoding)
            if distance < min_distance and distance <= threshold:
                min_distance = distance
                matched_nv = nv

    if matched_nv:
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vietnam_tz)
        today = now.date()

        cham_cong_today = ChamCong.query.filter_by(nhan_vien_id=matched_nv.id, ngay=today).first()

        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join("static", "checkin_images", filename)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        cv2.imwrite(image_path, img)

        time_str = now.strftime("%H:%M %d-%m")

        if not cham_cong_today:
            cham_cong = ChamCong(
                nhan_vien_id=matched_nv.id,
                thoi_gian_vao=now,
                ngay=today,
                hinh_anh_vao=filename
            )
            db.session.add(cham_cong)
            db.session.commit()
            return {
                'message': 'Chấm công <strong>vào</strong> thành công',
                'name': matched_nv.ho_ten,
                'time': time_str,
                'cham_cong': cham_cong.to_dict()
            }, 200

        elif cham_cong_today.thoi_gian_ra is None:
            cham_cong_today.thoi_gian_ra = now
            cham_cong_today.hinh_anh_ra = filename
            db.session.commit()
            return {
                'message': 'Chấm công <strong>ra</strong> thành công',
                'name': matched_nv.ho_ten,
                'time': time_str,
                'cham_cong': cham_cong_today.to_dict()
            }, 200

        else:
            return {
                'message': f'Đã chấm công đủ vào và ra cho hôm nay cho',
                'name': matched_nv.ho_ten,
            }, 400

    return {'message': 'Không khớp khuôn mặt với bất kỳ nhân viên nào'}, 404



