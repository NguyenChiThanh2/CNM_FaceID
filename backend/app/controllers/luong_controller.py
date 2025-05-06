# app/controllers/luong_controller.py
from flask import jsonify, request
from app.services.luong_service import *

# Lấy tất cả lương
def get_all_luong():
    luongs = get_all_luong_service()
    if luongs:
        return jsonify([luong.to_dict() for luong in luongs])
    else:
        return jsonify({'message': 'Không có dữ liệu lương'}), 404

# Lấy lương theo ID
def get_luong_by_id(id):
    luong = get_luong_by_id_service(id)
    if luong:
        return jsonify(luong.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy lương'}), 404

# Lấy lương của nhân viên theo ID nhân viên
def get_luong_by_nhan_vien_id(nhan_vien_id):
    luongs = get_luong_by_nhan_vien_id_service(nhan_vien_id)
    if luongs:
        return jsonify([luong.to_dict() for luong in luongs])
    else:
        return jsonify({'message': 'Không tìm thấy lương cho nhân viên này'}), 404

# Tạo lương mới
def create_luong():
    data = request.get_json()
    if not data or 'nhan_vien_id' not in data or 'thang' not in data or 'luong_co_ban' not in data or 'phu_cap' not in data or 'khau_tru' not in data:
        return jsonify({'message': 'Thiếu thông tin'}), 400

    new_luong = create_luong_service(
        nhan_vien_id=data['nhan_vien_id'],
        thang=data['thang'],
        luong_co_ban=data['luong_co_ban'],
        phu_cap=data['phu_cap'],
        khau_tru=data['khau_tru']
    )
    return jsonify(new_luong.to_dict()), 201

# Cập nhật lương theo ID
def update_luong(id):
    data = request.get_json()
    updated_luong = update_luong_service(
        id,
        luong_co_ban=data.get('luong_co_ban'),
        phu_cap=data.get('phu_cap'),
        khau_tru=data.get('khau_tru')
    )
    if updated_luong:
        return jsonify(updated_luong.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy lương'}), 404

# Xóa lương theo ID
def delete_luong(id):
    result = delete_luong_service(id)
    if result:
        return jsonify({'message': 'Xóa lương thành công'})
    else:
        return jsonify({'message': 'Không tìm thấy lương'}), 404

