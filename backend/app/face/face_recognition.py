import os
import cv2
import face_recognition
import numpy as np
from datetime import datetime
from app import db
from app.models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong

# Thư mục chứa ảnh nhân viên đã biết (ảnh chân dung dùng để nhận diện)
KNOWN_FACE_DIR = 'app/face/known_faces'

# Load known faces và encode
known_face_encodings = []
known_face_ids = []

def load_known_faces():
    known_face_encodings.clear()
    known_face_ids.clear()

    for filename in os.listdir(KNOWN_FACE_DIR):
        if filename.endswith('.jpg') or filename.endswith('.png'):
            nhan_vien_id = int(filename.split('_')[0])  # ví dụ: 1_nguyenvanA.jpg
            image_path = os.path.join(KNOWN_FACE_DIR, filename)
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)

            if encodings:
                known_face_encodings.append(encodings[0])
                known_face_ids.append(nhan_vien_id)

load_known_faces()

def recognize_and_log_attendance(image_np):
    # Resize để tăng tốc
    small_image = cv2.resize(image_np, (0, 0), fx=0.25, fy=0.25)
    rgb_small_image = cv2.cvtColor(small_image, cv2.COLOR_BGR2RGB)

    # Phát hiện khuôn mặt và mã hóa
    face_locations = face_recognition.face_locations(rgb_small_image)
    face_encodings = face_recognition.face_encodings(rgb_small_image, face_locations)

    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)

        best_match_index = np.argmin(face_distances)
        if matches[best_match_index]:
            nhan_vien_id = known_face_ids[best_match_index]
            now = datetime.now()

            # Kiểm tra đã chấm công trong ngày chưa
            today = now.date()
            cham_cong = ChamCong.query.filter_by(nhan_vien_id=nhan_vien_id, ngay=today).first()

            if not cham_cong:
                cham_cong = ChamCong(
                    nhan_vien_id=nhan_vien_id,
                    thoi_gian_vao=now,
                    ngay=today,
                    hinh_anh="captured_placeholder.jpg"  # có thể lưu nếu muốn
                )
            else:
                cham_cong.thoi_gian_ra = now

            db.session.add(cham_cong)
            db.session.commit()

            return {
                'success': True,
                'message': 'Chấm công thành công',
                'nhan_vien_id': nhan_vien_id,
                'thoi_gian': now.isoformat()
            }

    return {
        'success': False,
        'message': 'Không tìm thấy khuôn mặt phù hợp'
    }
