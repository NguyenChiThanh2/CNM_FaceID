from flask import jsonify, request
from app.services.tinh_luong_service import *

# def get_bang_luong_1nv():
#     bang_luongs = get_all_bang_luong_service()
#     if bang_luongs:
#         return jsonify([bl.to_dict() for bl in bang_luongs])
#     else:
#         return jsonify({'message': 'Không có dữ liệu bảng lương'}), 404