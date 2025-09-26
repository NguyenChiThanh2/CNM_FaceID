from flask import jsonify, request
from app.services.cham_cong_service import (
    get_all_cham_cong_service,
    get_cham_cong_by_id_service,
    get_cham_cong_by_nhan_vien_id_service,
    update_cham_cong_service,
    delete_cham_cong_service,
    create_cham_cong_from_face_service,
    get_chamcong_1nhanvien_theothang_service,
    get_tinhsocong_1nhanvien_theothang_service,
    get_tinhsocong_theogiayphep_service
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

# Lấy chấm công theo ID theo tháng năm
def get_chamcong_1nhanvien_theothang_controller(id, thang, nam):
    cham_cong = get_chamcong_1nhanvien_theothang_service(id, thang, nam)
    if cham_cong:
        return jsonify([cham_cong.to_dict() for cham_cong in cham_cong]), 200
    else:
        return jsonify({'message': 'Không tìm thấy chấm công'}), 404
    
# Lấy chấm công theo ID theo tháng năm
def get_tinhsocong_1nhanvien_theothang_controller(id, thang, nam):
    tinh_so_cong =get_tinhsocong_1nhanvien_theothang_service(id, thang, nam)
    if tinh_so_cong:
        return jsonify({'message': 'Cập nhật thành công'}), 200
    else:
        return jsonify({'message': 'Cạp nhật thất bại'}), 404
    
    
def get_tinhsocong_theogiayphep_controller(id):
    data, status_code = get_tinhsocong_theogiayphep_service(id)
    if status_code == 200:
        return jsonify({
            'message': 'Cập nhật thành công',
            'body': data
        }), 200
    else:
        return jsonify({
            'message': 'Cập nhật thất bại',
            'body': data
        }), status_code
    # if tinh_so_cong:
    #     return jsonify({'message': 'Cập nhật thành công', 'body': tinh_so_cong}), 200
    # else:
    #     return jsonify({'message': 'Cập nhật thất bại', 'body': tinh_so_cong}), 404




