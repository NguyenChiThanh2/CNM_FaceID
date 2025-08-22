from flask import Blueprint, request, jsonify
from app.services.nghi_phep_service import (
    create_nghi_phep_service,
    update_nghi_phep_service,
    approve_nghi_phep_service,
    reject_nghi_phep_service,
    delete_nghi_phep_service,
    get_all_nghi_phep_service,
    get_nghi_phep_by_id_service
)

nghi_phep_bp = Blueprint('nghi_phep', __name__)

# API: Get all Nghi Phep

def get_all_nghi_phep():
    try:
        nghi_pheps = get_all_nghi_phep_service()
        return jsonify([nghi_phep.to_dict() for nghi_phep in nghi_pheps]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# API: Get Nghi Phep by ID

def get_nghi_phep_by_id(id):
    try:
        nghi_phep = get_nghi_phep_by_id_service(id)
        if not nghi_phep:
            return jsonify({'error': 'Nghỉ phép không tồn tại'}), 404
        return jsonify(nghi_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# API: Create Nghi Phep

def create_nghi_phep():
    try:
        data = request.json
        new_nghi_phep = create_nghi_phep_service(
            data['nhan_vien_id'],
            data['loai_nghi_phep_id'],
            data['tu_ngay'],
            data['den_ngay'],
            data['ly_do'],
            data['trang_thai']
        )
        return jsonify(new_nghi_phep.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# API: Update Nghi Phep

def update_nghi_phep(id):
    try:
        data = request.json
        updated_nghi_phep = update_nghi_phep_service(
            id,
            loai_nghi_phep_id=data.get('loai_nghi_phep_id'),
            tu_ngay=data.get('tu_ngay'),
            den_ngay=data.get('den_ngay'),
            ly_do=data.get('ly_do'),
            trang_thai=data.get('trang_thai')
        )
        return jsonify(updated_nghi_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def approve_nghi_phep(id):
    try:
        # Gọi service approve_nghi_phep_service để duyệt đơn nghỉ phép
        nghi_phep = approve_nghi_phep_service(id)
        
        # Nếu duyệt thành công, trả về thông báo
        return jsonify({"message": "Đơn nghỉ phép đã được duyệt và số ngày phép còn lại của nhân viên đã được cập nhật!"}), 200
    except ValueError as e:
        # Nếu có lỗi xảy ra, trả về lỗi tương ứng
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        # Lỗi chung
        print(e)
        return jsonify({"message": "Lỗi khi duyệt đơn nghỉ phép!"}), 500

# API: Reject Nghi Phep

def reject_nghi_phep(id):
    try:
        rejected_nghi_phep = reject_nghi_phep_service(id)
        return jsonify(rejected_nghi_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def cancle_nghi_phep(id):
    try:
        # Gọi service duyệt nghỉ phépcancle
        cancled_nghi_phep = cancle_nghi_phep_service(id)
        if cancled_nghi_phep:
            # Trả về thông tin nghỉ phép sau khi duyệt
            return jsonify(cancled_nghi_phep.to_dict()), 200
        return jsonify({'message': 'Không tìm thấy nghỉ phép để duyệt'}), 404
    except ValueError as e:
        # Trả về lỗi nếu có exception ValueError (ví dụ trạng thái không phải là "Chờ duyệt")
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        # Xử lý các lỗi khác
        return jsonify({'message': str(e)}), 500


# Xóa nghỉ phép theo ID
def delete_nghi_phep(id):
    existing = get_nghi_phep_by_id_service(id)
    if not existing:
        return jsonify({'message': 'Không tìm thấy nghỉ phép'}), 404

    delete_nghi_phep_service(id)
    return jsonify({'message': 'Xóa nghỉ phép thành công'}), 200
