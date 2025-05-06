# app/routes/luong_routers.py
from flask import Blueprint
from app.controllers.luong_controller import *
from app.services.luong_service import *

luong_bp = Blueprint('luong', __name__)

# Lấy tất cả lương
@luong_bp.route('/get-all-luong', methods=['GET'])
def get_all_luongs_router():
    return get_all_luong()

# Lấy lương theo ID
@luong_bp.route('/get-luong-by-id/<int:id>', methods=['GET'])
def get_luong_by_id_router(id):
    return get_luong_by_id(id)

# Lấy lương của nhân viên theo ID nhân viên
@luong_bp.route('/get-luong-by-nhan-vien-id/<int:nhan_vien_id>', methods=['GET'])
def get_luong_by_nhan_vien_id_router(nhan_vien_id):
    return get_luong_by_nhan_vien_id(nhan_vien_id)

# Tạo lương mới
@luong_bp.route('/add-luong', methods=['POST'])
def create_luong_router():
    return create_luong()

# Cập nhật lương theo ID
@luong_bp.route('/edit-luong/<int:id>', methods=['PUT'])
def update_luong_router(id):
    return update_luong(id)

# Xóa lương theo ID
@luong_bp.route('/delete-luong/<int:id>', methods=['DELETE'])
def delete_luong_router(id):
    return delete_luong(id)


@luong_bp.route('/tinh-luong', methods=['POST'])
def tinh_luong():
    print("tới đây chưa")   
    data = request.json
    nhan_vien_id = data.get('nhan_vien_id')
    thang = data.get('thang')  # dạng int: 1-12
    nam = data.get('nam')      # dạng int
    if not all([nhan_vien_id, thang, nam]):
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400

    luong_dict = tao_hoac_cap_nhat_luong(nhan_vien_id, thang, nam)
    return jsonify({'message': 'Lương đã được xử lý thành công', 'luong': luong_dict}), 200


@luong_bp.route('/tinh-luong-tat-ca', methods=['POST'])
def tinh_luong_tat_ca():
    print("Đang tính lương cho tất cả nhân viên...")
    data = request.json
    thang = data.get('thang')  # dạng int: 1-12
    nam = data.get('nam')      # dạng int

    if not all([thang, nam]):
        return jsonify({'error': 'Thiếu thông tin tháng hoặc năm'}), 400

    danh_sach_luong = tao_hoac_cap_nhat_luong_cho_tat_ca_nhan_vien(thang, nam)
    return jsonify({'message': 'Đã xử lý lương cho tất cả nhân viên', 'data': danh_sach_luong}), 200
