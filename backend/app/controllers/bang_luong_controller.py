from flask import jsonify, request
from app.services.bang_luong_service import *

# def get_bang_luong_1nv(nhan_vien_id):
#     bang_luongs = get_bang_luong_1nv_service(nhan_vien_id)
#     if bang_luongs:
#         return jsonify([bl.to_dict() for bl in bang_luongs]),200
#     else:
#         return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404
def get_all_luong():
    luongs = get_bang_luong_service()
    if luongs and len(luongs) > 0:
        return jsonify(luongs), 200
    else:
        return jsonify({'message': 'Không có dữ liệu lương'}), 404