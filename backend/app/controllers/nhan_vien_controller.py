# app/controllers/nhan_vien_controller.py

from flask import request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services import nhan_vien_service
from datetime import datetime
import os
import logging
from app.utils.file_utils import generate_unique_filename
import face_recognition
import numpy as np
import cv2

from PIL import Image, UnidentifiedImageError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ========================== GET ALL ==========================
def get_all_nhan_vien_controller():
    nhan_vien_list = nhan_vien_service.get_all_nhan_vien_service()
    if not nhan_vien_list:
        return jsonify({'message': 'Không có dữ liệu nhân viên'}), 404
    return jsonify([nv.to_dict() for nv in nhan_vien_list]), 200

# ========================== GET BY ID ==========================
def get_nhan_vien_by_id_controller(id):
    nhan_vien = nhan_vien_service.get_nhan_vien_by_id_service(id)
    if not nhan_vien:
        return jsonify({'message': 'Không tìm thấy nhân viên'}), 404
    return jsonify(nhan_vien.to_dict()), 200

# ========================== GET BY TRẠNG THÁI ==========================
def get_nhan_vien_by_trang_thai_controller(trang_thai):
    nhan_vien_list = nhan_vien_service.get_nhan_vien_by_trang_thai_service(trang_thai)
    if not nhan_vien_list:
        return jsonify({'message': 'Không tìm thấy nhân viên'}), 404
    return jsonify([nv.to_dict() for nv in nhan_vien_list]), 200

# ========================== CREATE ==========================
# ========================== CREATE ==========================
def create_nhan_vien_controller():
    data = request.form.to_dict()
    file = request.files.get('avatar')
    logger.info(f"Dữ liệu nhận được khi tạo mới: {data}, File: {file}")

    if 'ho_ten' not in data or not data['ho_ten']:
        return jsonify({'message': 'Họ tên là bắt buộc'}), 400

    if 'ngay_sinh' in data and data['ngay_sinh']:
        try:
            data['ngay_sinh'] = datetime.strptime(data['ngay_sinh'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Ngày sinh không hợp lệ, định dạng phải là YYYY-MM-DD'}), 400

    if file and file.filename:
        if not allowed_file(file.filename):
            return jsonify({'message': 'File không hợp lệ. Chỉ chấp nhận jpg, jpeg, png.'}), 400
        try:
            upload_folder = current_app.config.get('UPLOAD_FOLDER')
            if not upload_folder or not os.path.exists(upload_folder):
                return jsonify({'message': 'Thư mục upload không tồn tại hoặc chưa cấu hình'}), 500

            filename = generate_unique_filename(file.filename)
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            data['avatar'] = filename

            # Xử lý ảnh
            face_encoding, error_message = handle_uploaded_image(file_path)
            if error_message:
                return jsonify({'message': error_message}), 400

            data['face_encoding'] = face_encoding
        except Exception as e:
            logger.error(f"Lỗi khi xử lý ảnh: {str(e)}")
            return jsonify({'message': f'Lỗi khi xử lý ảnh: {str(e)}'}), 500
    else:
        data['avatar'] = None
        data['face_encoding'] = None

    nhan_vien = nhan_vien_service.create_nhan_vien_service(**data)
    if isinstance(nhan_vien, dict) and 'error' in nhan_vien:
        return jsonify({'message': nhan_vien['error']}), 400

    return jsonify(nhan_vien.to_dict()), 201


def update_nhan_vien_controller(nhan_vien_id):
    try:
        # Nhận dữ liệu từ form và file
        data = request.form.to_dict()
        file = request.files.get('avatar')
        logger.info(f"Dữ liệu cập nhật cho nhân viên ID {nhan_vien_id}: {data}, File: {file}")

        # Xóa ID khỏi data nếu có
        if 'id' in data:
            del data['id']

        # Kiểm tra và chuyển đổi ngày sinh nếu có
        if 'ngay_sinh' in data and data['ngay_sinh']:
            try:
                data['ngay_sinh'] = datetime.strptime(data['ngay_sinh'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Ngày sinh không hợp lệ, định dạng phải là YYYY-MM-DD'}), 400

        # Lấy nhân viên cũ từ ID
        nhan_vien_cu = nhan_vien_service.get_nhan_vien_by_id_service(nhan_vien_id)
        if not nhan_vien_cu:
            return jsonify({'message': 'Không tìm thấy nhân viên'}), 404

        # Xử lý ảnh nếu có file mới
        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not upload_folder or not os.path.exists(upload_folder):
            return jsonify({'message': 'Thư mục upload không tồn tại hoặc chưa cấu hình'}), 500

        if file and file.filename:
            if not allowed_file(file.filename):
                return jsonify({'message': 'File không hợp lệ. Chỉ chấp nhận jpg, jpeg, png.'}), 400
            try:
                filename = generate_unique_filename(file.filename)
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)

                face_encoding, error_message = handle_uploaded_image(file_path)
                if error_message:
                    return jsonify({'message': error_message}), 400

                data['face_encoding'] = face_encoding

                # Xóa ảnh cũ nếu có
                if nhan_vien_cu.avatar:
                    old_avatar_path = os.path.join(upload_folder, nhan_vien_cu.avatar)
                    if os.path.exists(old_avatar_path):
                        os.remove(old_avatar_path)

                data['avatar'] = filename
            except Exception as e:
                logger.error(f"Lỗi khi lưu file ảnh mới: {str(e)}")
                return jsonify({'message': f'Lỗi khi lưu file ảnh mới: {str(e)}'}), 500

        # Cập nhật nhân viên
        nhan_vien = nhan_vien_service.update_nhan_vien_service(nhan_vien_id, **data)
        if isinstance(nhan_vien, dict) and 'error' in nhan_vien:
            return jsonify({'message': nhan_vien['error']}), 400

        return jsonify(nhan_vien.to_dict()), 200

    except Exception as e:
        logger.error(f"Lỗi hệ thống khi cập nhật nhân viên: {str(e)}")
        return jsonify({'message': f'Lỗi hệ thống: {str(e)}'}), 500






# ========================== DELETE ==========================
def delete_nhan_vien_controller(id):
    result = nhan_vien_service.delete_nhan_vien_service(id)
    if isinstance(result, dict) and 'error' in result:
        return jsonify({'message': result['error']}), 400
    return jsonify({'message': 'Xóa nhân viên thành công'}), 200


# ========================== HANDLE IMAGE ==========================
def handle_uploaded_image(file_path):
    try:
        # Đọc ảnh bằng OpenCV
        image_bgr = cv2.imread(file_path)
        if image_bgr is None:
            return None, "Không thể đọc ảnh bằng OpenCV"

        # Chuyển từ BGR (OpenCV) sang RGB (face_recognition dùng)
        rgb_image = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        logger.info(f"Hình dạng ảnh (OpenCV): {rgb_image.shape}, dtype: {rgb_image.dtype}")

        # Kiểm tra ảnh có 3 kênh màu và kiểu dữ liệu uint8
        if rgb_image.ndim != 3 or rgb_image.shape[2] != 3 or rgb_image.dtype != np.uint8:
            return None, "Ảnh phải có định dạng RGB 8-bit (uint8)"

        # Encode khuôn mặt
        face_encodings = face_recognition.face_encodings(rgb_image)
        if len(face_encodings) != 1:
            return None, "Ảnh phải chứa đúng một khuôn mặt"

        return face_encodings[0].tolist(), None

    except Exception as e:
        logger.error(f"Lỗi khi xử lý ảnh: {str(e)}")
        return None, f"Lỗi khi xử lý ảnh: {str(e)}"

