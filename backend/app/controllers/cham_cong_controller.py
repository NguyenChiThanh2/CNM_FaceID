from flask import jsonify, request
from app.services.cham_cong_service import (
    get_all_cham_cong_service,
    get_cham_cong_by_id_service,
    get_cham_cong_by_nhan_vien_id_service,
    update_cham_cong_service,
    delete_cham_cong_service,
    create_cham_cong_from_face_service
)

# Lấy tất cả chấm công
def get_all_cham_cong():
    cham_cong_list = get_all_cham_cong_service()
    if not cham_cong_list:
        return jsonify({'message': 'Không có dữ liệu chấm công'}), 404
    return jsonify([cham_cong.to_dict() for cham_cong in cham_cong_list]), 200

# Lấy chấm công theo ID
def get_cham_cong_by_id(id):
    cham_cong = get_cham_cong_by_id_service(id)
    if cham_cong:
        return jsonify(cham_cong.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy chấm công'}), 404


# Cập nhật chấm công
def update_cham_cong(id):
    data = request.get_json()
    cham_cong = update_cham_cong_service(
        id,
        thoi_gian_vao=data.get('thoi_gian_vao'),
        thoi_gian_ra=data.get('thoi_gian_ra'),
        ngay=data.get('ngay'),
        hinh_anh=data.get('hinh_anh')
    )
    if cham_cong:
        return jsonify(cham_cong.to_dict()), 200
    else:
        return jsonify({'message': 'Không tìm thấy chấm công'}), 404

# Xóa chấm công
def delete_cham_cong(id):
    if delete_cham_cong_service(id):
        return jsonify({'message': 'Xóa chấm công thành công'}), 200
    else:
        return jsonify({'message': 'Không tìm thấy chấm công'}), 404

