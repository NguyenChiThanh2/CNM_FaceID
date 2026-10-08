from flask import jsonify, request
from app.services.bang_luong_service import *
from app.decorators.auth_decorators import get_current_nhan_vien, is_hr

def get_all_luong():
    # Chỉ HR mới được xem bảng lương của TOÀN BỘ công ty — trước đây BE
    # không lọc, ai có quyền "bang_luong.xem" (kể cả cấp cho nhân viên
    # thường để họ tự xem phiếu lương của mình) đều lấy được lương của mọi
    # nhân viên khác trong 1 request.
    nv = get_current_nhan_vien()
    nhan_vien_id = None if is_hr(nv) else (nv.id if nv else None)
    luongs = get_bang_luong_service(nhan_vien_id=nhan_vien_id)
    if luongs and len(luongs) > 0:
        return jsonify(luongs), 200
    else:
        return jsonify({'message': 'Không có dữ liệu lương'}), 404
    
# Xóa lương theo ID
def delete_bangluong(id):
    result = delete_bangluong_service(id)
    if result:
        return jsonify({'message': 'Xóa lương thành công'})
    else:
        return jsonify({'message': 'Không tìm thấy lương'}), 404