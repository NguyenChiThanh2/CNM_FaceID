import face_recognition
import numpy as np
import base64
import cv2
from app.models.nhan_vien_model import NhanVien

def recognize_face_from_image_base64(image_base64):
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Chuyển ảnh từ BGR (OpenCV) sang RGB (face_recognition)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Encode khuôn mặt từ ảnh
        unknown_face_encodings = face_recognition.face_encodings(rgb_img)

        if not unknown_face_encodings:
            return None  # Không tìm thấy khuôn mặt nào

        unknown_encoding = unknown_face_encodings[0]

        # Load tất cả nhân viên từ database
        all_nhan_vien = NhanVien.query.all()

        for nhan_vien in all_nhan_vien:
            if nhan_vien.face_encoding is None:
                continue

            known_encoding = np.frombuffer(base64.b64decode(nhan_vien.face_encoding))

            # So sánh khuôn mặt
            match = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance=0.6)

            if match[0]:
                return nhan_vien  # Trả về nhân viên khớp

        return None  # Không ai khớp

    except Exception as e:
        print('Lỗi trong recognize_face_from_image_base64:', str(e))
        return None
