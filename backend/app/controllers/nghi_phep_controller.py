from flask import Blueprint, request, jsonify
from app.services.nghi_phep_service import (
    create_nghi_phep_service,
    update_nghi_phep_service,
    approve_nghi_phep_service,
    reject_nghi_phep_service,
    delete_nghi_phep_service,
    cancle_nghi_phep_service,
    get_all_nghi_phep_service,
    get_nghi_phep_by_id_service,
    get_nghi_phep_by_nhan_vien_id_service,
)
from werkzeug.utils import secure_filename
from app.decorators.auth_decorators import get_current_nhan_vien, is_hr

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

# API: Get Nghi Phep theo nhân viên — route đã gọi tên này từ trước nhưng
# controller chưa từng định nghĩa hàm, khiến GET luôn 500 (NameError)
def get_nghi_phep_by_nhan_vien_id(nhan_vien_id):
    try:
        nghi_pheps = get_nghi_phep_by_nhan_vien_id_service(nhan_vien_id)
        return jsonify([nghi_phep.to_dict() for nghi_phep in nghi_pheps]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# API: Create Nghi Phep

def create_nghi_phep():
    try:
        data = request.form  # lấy dữ liệu text từ form
        file = request.files.get("file")  # lấy file (nếu có)
        new_nghi_phep = create_nghi_phep_service(
            nhan_vien_id=data.get("nhan_vien_id"),
            loai_nghi_phep_id=data.get("loai_nghi_phep_id"),
            tu_ngay=data.get("tu_ngay"),
            den_ngay=data.get("den_ngay"),
            ly_do=data.get("ly_do"),
            trang_thai=data.get("trang_thai", "Chờ duyệt"),
            file=file,
            ngay_du_kien_sinh=data.get("ngay_du_kien_sinh"),
            so_con=data.get("so_con"),
            phuong_phap_sinh=data.get("phuong_phap_sinh"),
        )
        return jsonify(new_nghi_phep.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# API: Update Nghi Phep

def update_nghi_phep(id):
    # Chỉ HR hoặc đúng chủ đơn mới được sửa — trước đây BE không kiểm tra,
    # ai có quyền "nghi_phep.sua" (cần cho nhân viên tự sửa đơn của họ) sửa
    # được đơn của bất kỳ ai.
    nghi_phep = get_nghi_phep_by_id_service(id)
    if not nghi_phep:
        return jsonify({'error': 'Nghỉ phép không tồn tại'}), 404
    nv = get_current_nhan_vien()
    if not (is_hr(nv) or (nv and nghi_phep.nhan_vien_id == nv.id)):
        return jsonify({'error': 'Bạn không có quyền sửa đơn nghỉ phép này'}), 403
    try:
        data = request.form  # lấy dữ liệu text từ form
        file = request.files.get("file")  # lấy file (nếu có)
        file_status = request.form.get("file_status")

        updated_nghi_phep = update_nghi_phep_service(
            id=id,
            nhan_vien_id=data.get("nhan_vien_id"),
            loai_nghi_phep_id=data.get("loai_nghi_phep_id"),
            tu_ngay=data.get("tu_ngay"),
            den_ngay=data.get("den_ngay"),
            ly_do=data.get("ly_do"),
            trang_thai=data.get("trang_thai", "Chờ duyệt"),
            file=file,
            ngay_du_kien_sinh=data.get("ngay_du_kien_sinh"),
            so_con=data.get("so_con"),
            phuong_phap_sinh=data.get("phuong_phap_sinh"),
            file_status=file_status,
        )
        

        return jsonify({"message": "Cập nhật thành công", "data": updated_nghi_phep.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


def approve_nghi_phep(id):
    # Chỉ HR mới được duyệt — trước đây không kiểm tra, ai có quyền
    # "nghi_phep.sua" cũng duyệt được đơn của bất kỳ ai qua thẳng API.
    if not is_hr(get_current_nhan_vien()):
        return jsonify({"message": "Chỉ nhân sự (HR) mới được duyệt đơn nghỉ phép"}), 403
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
    # Chỉ HR mới được từ chối — cùng lý do như approve_nghi_phep.
    if not is_hr(get_current_nhan_vien()):
        return jsonify({"message": "Chỉ nhân sự (HR) mới được từ chối đơn nghỉ phép"}), 403
    try:
        rejected_nghi_phep = reject_nghi_phep_service(id)
        return jsonify(rejected_nghi_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def cancle_nghi_phep(id):
    # Chỉ HR hoặc đúng chủ đơn mới được hủy — trước đây không kiểm tra.
    nghi_phep = get_nghi_phep_by_id_service(id)
    if not nghi_phep:
        return jsonify({'message': 'Nghỉ phép không tồn tại'}), 404
    nv = get_current_nhan_vien()
    if not (is_hr(nv) or (nv and nghi_phep.nhan_vien_id == nv.id)):
        return jsonify({'message': 'Bạn không có quyền hủy đơn nghỉ phép này'}), 403
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
    existing = delete_nghi_phep_service(id)
    if not existing:
        return jsonify({'message': 'Không tìm thấy nghỉ phép'}), 404
    return jsonify({"success": True, "message": f"Bảng lương {id} đã được xóa thành công"}), 200
