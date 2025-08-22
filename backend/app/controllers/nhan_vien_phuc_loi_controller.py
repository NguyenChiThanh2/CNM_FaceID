from flask import request, jsonify
from app.services.nhan_vien_phuc_loi_service import *

# Lấy tất cả bản ghi
def get_all_nhan_vien_phuc_loi_controller():
    records = get_all_nhan_vien_phuc_loi_service()
    if not records:
        return jsonify({'message': 'Không có dữ liệu'}), 404
    return jsonify([r.to_dict() for r in records]), 200

# Lấy theo ID
def get_nhan_vien_phuc_loi_by_id_controller(id):
    record = get_nhan_vien_phuc_loi_by_id_service(id)
    if not record:
        return jsonify({'message': 'Không tìm thấy bản ghi'}), 404
    return jsonify(record.to_dict()), 200

# Lấy theo nhân viên ID
def get_phuc_loi_by_nhan_vien_id_controller(nhan_vien_id):
    records = get_phuc_loi_by_nhan_vien_id_service(nhan_vien_id)
    return jsonify([r.to_dict() for r in records]), 200

# Lấy theo phúc lợi ID
def get_nhan_vien_by_phuc_loi_id_controller(phuc_loi_id):
    records = get_nhan_vien_by_phuc_loi_id_service(phuc_loi_id)
    return jsonify([r.to_dict() for r in records]), 200

# Tạo mới
def create_nhan_vien_phuc_loi_controller():
    data = request.get_json()
    new_record = create_nhan_vien_phuc_loi_service(
        nhan_vien_id=data['nhan_vien_id'],
        phuc_loi_id=data['phuc_loi_id'],
        ngay_ap_dung=data['ngay_ap_dung'],
        ghi_chu=data.get('ghi_chu')
    )
    return jsonify(new_record.to_dict()), 201

# Cập nhật
def update_nhan_vien_phuc_loi_controller(id):
    data = request.get_json()
    updated_record = update_nhan_vien_phuc_loi_service(
        id,
        ngay_ap_dung=data.get('ngay_ap_dung'),
        ghi_chu=data.get('ghi_chu')
    )
    if not updated_record:
        return jsonify({'message': 'Không tìm thấy bản ghi để cập nhật'}), 404
    return jsonify(updated_record.to_dict()), 200

# Xoá
def delete_nhan_vien_phuc_loi_controller(id):
    success = delete_nhan_vien_phuc_loi_service(id)
    if not success:
        return jsonify({'message': 'Không tìm thấy bản ghi để xoá'}), 404
    return jsonify({'message': 'Xoá thành công'}), 200
