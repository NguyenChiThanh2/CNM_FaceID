import uuid

def generate_unique_filename(filename):
    ext = filename.rsplit('.', 1)[1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    return unique_filename

import base64
import cv2
import numpy as np

def read_image_from_base64(base64_str):
    # Nếu base64 có header như "data:image/jpeg;base64,...", thì loại bỏ phần đó
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]

    # Giải mã base64 và chuyển sang mảng numpy
    image_data = base64.b64decode(base64_str)
    np_array = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    return img  # Trả về ảnh định dạng BGR (OpenCV)