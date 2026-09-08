from flask import jsonify, request
from app.services.thuong_service import *
# Lấy tất cả thưởng
def get_all_thuongs():
    thuongs = get_all_thuong_service()
    if thuongs:
        return jsonify([thuong.to_dict() for thuong in thuongs]), 200
    else:
        return jsonify({'message': 'Không có thưởng nào'}), 404

# Lấy thưởng theo tên
def get_thuong_by_name(ten_thuong):
    thuong = get_thuong_by_name_service(ten_thuong)
    if thuong:
        return jsonify(thuong.to_dict()), 200
    else:
        return jsonify({'message': 'Không có thưởng bạn tìm'}), 404


# Lấy thưởng theo ID
def get_thuong_by_id(thuong_id):
    thuong = get_thuong_by_id_service(thuong_id)
    if thuong:
        return jsonify(thuong.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy thưởng'}), 404

# Lấy thưởng của một nhân viên theo ID
def get_thuong_by_nhan_vien_id(nhan_vien_id):
    try:
        thuongs = get_thuong_by_nhan_vien_id_service(nhan_vien_id)
        return jsonify([t.to_dict() for t in thuongs] if thuongs else []), 200
    except Exception as e:
        return jsonify({'message': f'Lỗi khi lấy thưởng nhân viên: {str(e)}'}), 500
# Tạo mới thưởng
def create_thuong():
    
    data = request.get_json()
    try:
        new_thuong = create_thuong_service(data)
        return jsonify(new_thuong.to_dict()), 201
    except Exception as e:
        return jsonify({'message': f'Lỗi khi tạo thưởng: {str(e)}'}), 500

# Cập nhật thưởng
def update_thuong(thuong_id):
    data = request.get_json()
    updated = update_thuong_service(thuong_id, data)
    if updated:
        return jsonify(updated.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy thưởng để cập nhật'}), 404

# Xóa thưởng
def delete_thuong(thuong_id):
    try:
        deleted = delete_thuong_service(thuong_id)
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    if deleted:
        return jsonify({'message': 'Xóa thưởng thành công'}), 200
    else:
        return jsonify({'message': 'Không tìm thấy thưởng để xóa'}), 404



def add_nhan_vien_to_thuong_controller(data):
    try:
        payload = data.get("payload")
        thuong_id = payload["thuong_id"]
        nhan_vien_ids = payload.get("nhan_vien_ids", [])
        print(nhan_vien_ids)

        if not thuong_id or not isinstance(nhan_vien_ids, list):
            return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

        add_nhan_vien_to_thuong_service(thuong_id, nhan_vien_ids)

        return jsonify({"message": "Đã thêm nhân viên vào thưởng."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def get_nhan_vien_by_thuong_controller(thuong_id):
    try:
        result, error, status = get_nhan_vien_by_thuong_service(thuong_id)

        if error:
             jsonify({"message": error}), status

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": f"Lỗi server: {str(e)}"}), 500
    
def remove_nhan_vien_from_thuong_controller():
    try:
        data = request.json
        thuong_id = data.get("thuong_id")
        nhan_vien_id = data.get("nhan_vien_id")

        result, error, status = remove_nhan_vien_from_thuong_service(thuong_id, nhan_vien_id)

        if error:
            return jsonify({"message": error}), status

        return jsonify({"message": result}), 200

    except Exception as e:
        return jsonify({"message": f"Lỗi server: {str(e)}"}), 500
    
def get_thang13_nhan_vien_controller():
    try:
        data = request.json
        nhanvien_id = data.get("id")
        ngay_quyet_dinh = data.get("ngay_quyet_dinh")
        # print("Ngày quyết định nhận được ở controller:", ngay_quyet_dinh)
        result = get_thang13_nhan_vien_service(nhanvien_id, ngay_quyet_dinh)
        if result is None:
            return jsonify({"message": "Không tìm thấy nhân viên này"}), 404
        
        return jsonify({
            "nhanvien_id": nhanvien_id,
            "so_tien": result
        }), 200
    except Exception as e:
        print("Lỗi controller:", e)
        return jsonify({"error": str(e)}), 500