from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.models.test_nv import NhanVien, db
import os

UPLOAD_FOLDER = 'static/images'
nhan_vien_bp = Blueprint('nhan_vien', __name__)

@nhan_vien_bp.route('/api/add-nhan-vien', methods=['POST'])
def add_nhan_vien():
    try:
        ho_ten = request.form.get("ho_ten")
        file = request.files.get("avatar")

        if not ho_ten or not file:
            return jsonify({"error": "Thiếu họ tên hoặc file ảnh"}), 400

        # Lưu file ảnh
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # Lưu vào database
        nhan_vien = NhanVien(ho_ten=ho_ten, avatar=filename)
        db.session.add(nhan_vien)
        db.session.commit()

        return jsonify({"message": "Tạo nhân viên thành công!"}), 200

    except Exception as e:
        print("🔥 Lỗi server:", str(e))
        return jsonify({"error": "Lỗi server", "detail": str(e)}), 500
