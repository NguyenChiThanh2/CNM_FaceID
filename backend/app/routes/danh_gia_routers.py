# app/routes/danh_gia_routes.py
from flask import Blueprint
from app.controllers import danh_gia_controller

# Nên có prefix rõ ràng:
danh_gia_bp = Blueprint("danh_gia", __name__)

# Danh sách + lọc
@danh_gia_bp.route("", methods=["GET"])
def list_danh_gia():
    return danh_gia_controller.list_danh_gia_controller()

# Lấy 1 bản ghi
@danh_gia_bp.route("/<int:id>", methods=["GET"])
def get_danh_gia(id):
    return danh_gia_controller.get_danh_gia_controller(id)

# Tạo mới
@danh_gia_bp.route("", methods=["POST"])
def create_danh_gia():
    return danh_gia_controller.create_danh_gia_controller()

# Cập nhật
@danh_gia_bp.route("/<int:id>", methods=["PUT", "PATCH"])
def update_danh_gia(id):
    return danh_gia_controller.update_danh_gia_controller(id)

# Xóa
@danh_gia_bp.route("/<int:id>", methods=["DELETE"])
def delete_danh_gia(id):
    return danh_gia_controller.delete_danh_gia_controller(id)

# Đổi trạng thái (DRAFT/SUBMITTED/APPROVED/REJECTED)
@danh_gia_bp.route("/<int:id>/status", methods=["PATCH"])
def change_status(id):
    return danh_gia_controller.change_status_controller(id)
