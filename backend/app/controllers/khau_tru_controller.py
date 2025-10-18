from flask import jsonify, request
from app.services.khau_tru_service import *
# Lấy tất cả khấu trừ
def get_all_khau_trus():
    khau_trus = get_all_khau_tru_service()
    if khau_trus:
        return jsonify([khau_tru.to_dict() for khau_tru in khau_trus]), 200
    else:
        return jsonify({'message': 'Không có khấu trừ nào'}), 404

# Lấy khấu trừ theo tên
def get_khau_tru_by_name(ten_khau_tru):
    khau_tru = get_khau_tru_by_name_service(ten_khau_tru)
    if khau_tru:
        return jsonify(khau_tru.to_dict()), 200
    else:
        return jsonify({'message': 'Không có khấu trừ bạn tìm'}), 404


# Lấy khấu trừ theo ID
def get_khau_tru_by_id(khau_tru_id):
    khau_tru = get_khau_tru_by_id_service(khau_tru_id)
    if khau_tru:
        return jsonify(khau_tru.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy khấu trừ'}), 404

# Lấy khấu trừ của một nhân viên theo ID
def get_khau_tru_by_nhan_vien_id(nhan_vien_id):
    try:
        khau_trus = get_khau_tru_by_nhan_vien_id_service(nhan_vien_id)
        # 👉 Trả về mảng rỗng thay vì 404
        return jsonify([kt.to_dict() for kt in khau_trus] if khau_trus else []), 200
    except Exception as e:
        return jsonify({'message': f'Lỗi khi lấy khấu trừ nhân viên: {str(e)}'}), 500


# Tạo mới khấu trừ
def create_khau_tru():
    try:
        data = request.form  # lấy dữ liệu text từ form
        file = request.files.get("file_dinh_kem")  # lấy file (nếu có)
        print(file)
        new_khau_tru = create_khau_tru_service(
            ten_khau_tru=data.get("ten_khau_tru"),
            loai_khau_tru=data.get("loai_khau_tru"),
            so_tien=data.get("so_tien"),
            ghi_chu=data.get("ghi_chu"),
            ngay_quyet_dinh=data.get("ngay_quyet_dinh"),
            file=file,
        )

        return jsonify(new_khau_tru.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Cập nhật khấu trừ
def update_khau_tru(khau_tru_id):
    try:
        data = request.form  # lấy dữ liệu text từ form
        file = request.files.get("file_dinh_kem")  # lấy file (nếu có)
        file_status = request.form.get("file_status")

        updated_khau_tru = update_khau_tru_service(
            id=khau_tru_id,
            ten_khau_tru=data.get("ten_khau_tru"),
            loai_khau_tru=data.get("loai_khau_tru"),
            so_tien=data.get("so_tien"),
            ghi_chu=data.get("ghi_chu"),
            ngay_quyet_dinh=data.get("ngay_quyet_dinh"),
            file=file,
            file_status=file_status,
        )
        return jsonify({"message": "Cập nhật thành công", "data": updated_khau_tru.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# Xóa khấu trừ
def delete_khau_tru(khau_tru_id):
    deleted = delete_khau_tru_service(khau_tru_id)
    if deleted:
        return jsonify({'message': 'Xóa khấu trừ thành công'}), 200
    else:
        return jsonify({'message': 'Không tìm thấy khấu trừ để xóa'}), 404



def add_nhan_vien_to_khau_tru_controller(data):
    try:
        payload = data.get("payload")
        khau_tru_id = payload["khautru_id"]
        nhan_vien_ids = payload.get("nhan_vien", [])
        # print(nhan_vien_ids)
        if not khau_tru_id or not isinstance(nhan_vien_ids, list):
            return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

        add_nhan_vien_to_khau_tru_service(khau_tru_id, nhan_vien_ids)

        return jsonify({"message": "Đã thêm nhân viên vào khấu trừ."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def get_nhan_vien_by_khau_tru_controller(khau_tru_id):
    try:
        result, error, status = get_nhan_vien_by_khau_tru_service(khau_tru_id)

        if error:
             jsonify({"message": error}), status

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": f"Lỗi server: {str(e)}"}), 500
    
def remove_nhan_vien_from_khau_tru_controller():
    try:
        data = request.json
        khau_tru_id = data.get("khautru_id")
        nhan_vien_id = data.get("nhan_vien_id")

        result, error, status = remove_nhan_vien_from_khau_tru_service(khau_tru_id, nhan_vien_id)

        if error:
            return jsonify({"message": error}), status

        return jsonify({"message": result}), 200

    except Exception as e:
        return jsonify({"message": f"Lỗi server: {str(e)}"}), 500
    
