from flask import Blueprint, request
from app.controllers.thuong_controller import *

thuong_bp = Blueprint('thuong_bp', __name__)

# Lấy tất cả phúc lợi
@thuong_bp.route('/get-all-thuong', methods=['GET'])
def get_all_thuongs_router():
    return get_all_thuongs()

# Lấy phúc lợi theo tên
@thuong_bp.route('/get-thuong-by-name/<string:name>', methods=['GET'])
def get_thuong_by_name_router(name):
    return get_thuong_by_name(name)
# Lấy phúc lợi của một nhân viên theo ID
@thuong_bp.route('/get-thuong-by-nhan-vien-id/<int:nhan_vien_id>', methods=['GET'])
def get_thuong_by_nhan_vien_id_router(nhan_vien_id):
    return get_thuong_by_nhan_vien_id(nhan_vien_id)
# Lấy phúc lợi theo ID
@thuong_bp.route('/get-thuong-by-id/<int:thuong_id>', methods=['GET'])
def get_thuong_by_id_router(thuong_id):
    return get_thuong_by_id(thuong_id)

# Tạo mới phúc lợi
@thuong_bp.route('/add-thuong', methods=['POST'])
def create_thuong_router():
    return create_thuong()
    

# Cập nhật phúc lợi
@thuong_bp.route('/edit-thuong/<int:thuong_id>', methods=['PUT'])
def update_thuong_router(thuong_id):
    return update_thuong(thuong_id)

# Xoá phúc lợi
@thuong_bp.route('/delete-thuong/<int:thuong_id>', methods=['DELETE'])
def delete_thuong_router(thuong_id):
    return delete_thuong(thuong_id)


@thuong_bp.route("/add-nhan-vien-to-thuong", methods=["POST"])
def add_nhan_vien_to_thuong():
    data = request.get_json()
    return add_nhan_vien_to_thuong_controller(data)

@thuong_bp.route("/get-all-nhan-vien-by-thuong-id/<int:thuong_id>", methods=["GET"])
def get_nhan_vien_by_thuong(thuong_id):
    return get_nhan_vien_by_thuong_controller(thuong_id)

@thuong_bp.route("/remove-nhan-vien-from-thuong", methods=["POST"])
def remove_nhan_vien_from_thuong():
    return remove_nhan_vien_from_thuong_controller()

@thuong_bp.route("/get-thang-13-nhan-vien", methods=["POST"])
def get_thang13_nhan_vien_router():
    return get_thang13_nhan_vien_controller()
