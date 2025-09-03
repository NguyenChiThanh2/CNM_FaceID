from flask import Blueprint
from app.controllers.tinh_luong_controller import *
from app.services.tinh_luong_service import *
from flask import request

tinhluong_bp = Blueprint('tinhluong_bp', __name__,)

# @tinhluong_bp.route('/get-tinh-luong-1nv/<int:nhan_vien_id>', methods=['GET'])
# def get_bang_luong_1nv_router(nhan_vien_id):
#     thang = request.args.get("thang",type=int)
#     nam = request.args.get("nam", type=int)
#     if not thang or not nam:
#         return jsonify({'message': 'Thiếu tham số tháng hoặc năm'}), 400
#     return tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam)

@tinhluong_bp.route('/get-tinh-luong-1nv', methods=['POST'])
def get_bang_luong_1nv_router(): 
    data = request.get_json()  # lấy body JSON
    nhan_vien_id = data.get("nhan_vien_id")
    thang = data.get("thang")
    nam = data.get("nam")
    if not all([nhan_vien_id, thang, nam]):
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
    return tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam)


     