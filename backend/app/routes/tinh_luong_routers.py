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

# @tinhluong_bp.route('/get-tinh-luong-1nv', methods=['POST'])
# def get_bang_luong_1nv_router(): 
#     data = request.get_json()  # lấy body JSON
#     nhan_vien_id = data.get("nhan_vien_id")
#     thang = data.get("thang")
#     nam = data.get("nam")
#     if not all([nhan_vien_id, thang, nam]):
#         return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
#     return tinh_luong_cho_1nv_controller(nhan_vien_id,thang,nam)
@tinhluong_bp.route('/get-tinh-luong-1nv', methods=['POST'])
def get_bang_luong_1nv_router(): 
    data = request.get_json()
    nhan_vien_id = data.get("nhan_vien_id")
    thang = data.get("thang")
    nam = data.get("nam")

    if not all([nhan_vien_id, thang, nam]):
        return jsonify({'success': False, 'message': 'Thiếu thông tin bắt buộc'}), 400

    try:
        result = tinh_luong_cho_1nv(nhan_vien_id, thang, nam)

        # Nếu service trả về dict có success=False
        if isinstance(result, dict) and result.get("success") is False:
            return jsonify(result), 400

        # Nếu kết quả là object BangLuong -> chuyển về dict
        if hasattr(result, "to_dict"):
            result = result.to_dict()

        return jsonify({
            "success": True,
            "message": "Tính lương thành công!",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


@tinhluong_bp.route('/get-tinh-luong-tat-ca', methods=['POST'])
def get_tinh_luong_tat_ca_router():
    print("Đang tính lương cho tất cả nhân viên...")
    data = request.json
    thang = data.get('thang')  # dạng int: 1-12
    nam = data.get('nam')      # dạng int
    phongbanid = data.get('phong_ban_id')  # dạng int hoặc None
     # Kiểm tra tham số bắt buộc

    if not all([thang, nam]):
        return jsonify({'error': 'Thiếu thông tin tháng hoặc năm'}), 400

    danh_sach_luong = tinh_luong_cho_tat_ca_nhan_vien_controller(thang, nam, phongbanid)
    return jsonify({'message': 'Đã xử lý lương cho tất cả nhân viên', 'data': danh_sach_luong}), 200


     