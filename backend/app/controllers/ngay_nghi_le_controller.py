from flask import Blueprint, request, jsonify
from app.services.ngay_nghi_le_service import *

ngay_nghi_le_bp = Blueprint('ngay_nghi_le', __name__)

# API: Get all Nghi Phep

def get_all_ngay_nghi_le():
    try:
        ngay_nghi_les = get_all_ngay_nghi_le_service()
        return jsonify([ngay_nghi_le.to_dict() for ngay_nghi_le in ngay_nghi_les]), 200
    except Exception as e:
        print(f"Lỗi khi lấy danh sách ngày nghỉ lễ: {e}")
        return jsonify({'error': 'Không thể lấy danh sách ngày nghỉ lễ, vui lòng thử lại sau'}), 400

# API: Get Nghi Phep by ID

def get_ngay_nghi_le_by_id(id):
    try:
        ngay_nghi_le = get_ngay_nghi_le_by_id_service(id)
        if not ngay_nghi_le:
            return jsonify({'error': 'Nghỉ phép không tồn tại'}), 404
        return jsonify(ngay_nghi_le.to_dict()), 200
    except Exception as e:
        print(f"Lỗi khi lấy ngày nghỉ lễ: {e}")
        return jsonify({'error': 'Không thể lấy dữ liệu ngày nghỉ lễ, vui lòng thử lại sau'}), 400

# API: Create Nghi Phep

def create_ngay_nghi_le():
    try:
        data = request.get_json() # lấy dữ liệu text từ form
        new_ngay_nghi_le = create_ngay_nghi_le_service(
            ten_ngay_le=data.get("ten_ngay"),
            ngay_bat_dau=data.get("tu_ngay"),
            ngay_ket_thuc=data.get("den_ngay"),
            ghi_chu=data.get("mo_ta"),
            ten_ngay_le_khac=data.get("ten_ngay_le_khac"),
        )
        return jsonify(new_ngay_nghi_le.to_dict()), 201
    except Exception as e:
        print(f"Lỗi khi tạo ngày nghỉ lễ: {e}")
        return jsonify({"error": "Không thể tạo ngày nghỉ lễ, vui lòng thử lại sau"}), 400

# API: Update Nghi Phep

def update_ngay_nghi_le(id):
    try:
        data = request.get_json() # lấy dữ liệu text từ form
        updated_ngay_nghi_le = update_ngay_nghi_le_service(
            id=id,
            ten_ngay_le=data.get("ten_ngay"),
            ngay_bat_dau=data.get("tu_ngay"),
            ngay_ket_thuc=data.get("den_ngay"),
            ghi_chu=data.get("mo_ta"),
            ten_ngay_le_khac=data.get("ten_ngay_le_khac"),
        )
        

        return jsonify({"message": "Cập nhật thành công", "data": updated_ngay_nghi_le.to_dict()}), 200
    except Exception as e:
        print(f"Lỗi khi sửa ngày nghỉ lễ: {e}")
        return jsonify({"error": "Không thể cập nhật ngày nghỉ lễ, vui lòng thử lại sau"}), 400



# Xóa nghỉ phép theo ID
def delete_ngay_nghi_le(id):
    existing = delete_ngay_nghi_le_service(id)
    if not existing:
        return jsonify({'message': 'Không tìm thấy nghỉ phép'}), 404
    return jsonify({"success": True, "message": f"Bảng lương {id} đã được xóa thành công"}), 200
