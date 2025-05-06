from flask import jsonify, request
from app.services.phuc_loi_service import (
    get_all_phuc_loi_service,
    get_phuc_loi_by_name_service,
    get_phuc_loi_by_id_service,
    create_phuc_loi_service,
    update_phuc_loi_service,
    delete_phuc_loi_service,
    get_phuc_loi_by_nhan_vien_id_service
)

# Lấy tất cả phúc lợi
def get_all_phuc_lois():
    phuc_lois = get_all_phuc_loi_service()
    if phuc_lois:
        return jsonify([phuc_loi.to_dict() for phuc_loi in phuc_lois]), 200
    else:
        return jsonify({'message': 'Không có phúc lợi nào'}), 404

# Lấy phúc lợi theo tên
def get_phuc_loi_by_name(ten_phuc_loi):
    phuc_loi = get_phuc_loi_by_name_service(ten_phuc_loi)
    if phuc_loi:
        return jsonify(phuc_loi.to_dict()), 200
    else:
        return jsonify({'message': 'Không có phúc lợi bạn tìm'}), 404


# Lấy phúc lợi theo ID
def get_phuc_loi_by_id(phuc_loi_id):
    phuc_loi = get_phuc_loi_by_id_service(phuc_loi_id)
    if phuc_loi:
        return jsonify(phuc_loi.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy phúc lợi'}), 404

# Lấy phúc lợi của một nhân viên theo ID
def get_phuc_loi_by_nhan_vien_id(nhan_vien_id):
    try:
        phuc_lois = get_phuc_loi_by_nhan_vien_id_service(nhan_vien_id)
        if phuc_lois:
            return jsonify([phuc_loi.to_dict() for phuc_loi in phuc_lois]), 200
        else:
            return jsonify({'message': 'Không có phúc lợi cho nhân viên này'}), 404
    except Exception as e:  
        return jsonify({'message': f'Lỗi khi lấy phúc lợi nhân viên: {str(e)}'}), 500
# Tạo mới phúc lợi
def create_phuc_loi():
    data = request.get_json()
    try:
        new_phuc_loi = create_phuc_loi_service(data)
        return jsonify(new_phuc_loi.to_dict()), 201
    except Exception as e:
        return jsonify({'message': f'Lỗi khi tạo phúc lợi: {str(e)}'}), 500

# Cập nhật phúc lợi
def update_phuc_loi(phuc_loi_id):
    data = request.get_json()
    updated = update_phuc_loi_service(phuc_loi_id, data)
    if updated:
        return jsonify(updated.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy phúc lợi để cập nhật'}), 404

# Xóa phúc lợi
def delete_phuc_loi(phuc_loi_id):
    deleted = delete_phuc_loi_service(phuc_loi_id)
    if deleted:
        return jsonify({'message': 'Xóa phúc lợi thành công'}), 200
    else:
        return jsonify({'message': 'Không tìm thấy phúc lợi để xóa'}), 404
