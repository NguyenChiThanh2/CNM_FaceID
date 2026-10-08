# app/routes/danh_gia_routes.py
from flask import Blueprint
from app.controllers import danh_gia_controller

# Nên có prefix rõ ràng:
from app.decorators.auth_decorators import require_module_permission

danh_gia_bp = Blueprint("danh_gia", __name__)


@danh_gia_bp.before_request
def _require_permission():
    return require_module_permission("danh_gia")()

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

# (Đã xóa route PATCH /<id>/status "Đổi trạng thái DRAFT/SUBMITTED/..." — gọi
# vào change_status_controller vốn chưa từng được định nghĩa (NameError -> 500),
# và model DanhGia cũng không có cột trạng thái nào để đổi. change_status_service
# tương ứng cũng không làm gì (chỉ commit() suông). Nếu sau này cần luồng
# duyệt đánh giá thật, cần thêm cột trang_thai vào model trước.)
