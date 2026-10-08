# app/routes/ngay_nghi_le_routers.py

from flask import Blueprint
from app.controllers.ngay_nghi_le_controller import *

from app.decorators.auth_decorators import require_module_permission

ngay_nghi_le_bp = Blueprint('ngay_nghi_le', __name__)


@ngay_nghi_le_bp.before_request
def _require_permission():
    return require_module_permission("ngay_nghi_le")()

# Lấy tất cả nghỉ phép
@ngay_nghi_le_bp.route('/get-all-ngay-nghi-le', methods=['GET'])
def get_all_ngay_nghi_les_router():
    return get_all_ngay_nghi_le()

# Lấy nghỉ phép theo ID
@ngay_nghi_le_bp.route('/get-ngay-nghi-le-by-id/<int:id>', methods=['GET'])
def get_ngay_nghi_le_by_id_router(id):
    return get_ngay_nghi_le_by_id(id)

# Tạo nghỉ phép mới
@ngay_nghi_le_bp.route('/add-ngay-nghi-le', methods=['POST'])
def create_ngay_nghi_le_router():
    return create_ngay_nghi_le()

# Cập nhật nghỉ phép theo ID
@ngay_nghi_le_bp.route('/edit-ngay-nghi-le/<int:id>', methods=['PUT'])
def update_ngay_nghi_le_router(id):
    return update_ngay_nghi_le(id)

# (Đã xóa 3 route approve/reject/cancle-ngay-nghi-le — copy-paste từ
# nghi_phep_routes.py nhưng NgayNghiLe chỉ là danh mục cấu hình ngày lễ, không
# có cột trang_thai/quy trình duyệt nào cả. Controller/service cũng chưa từng
# có hàm approve_ngay_nghi_le/reject_ngay_nghi_le/cancle_ngay_nghi_le — gọi
# vào là NameError -> 500 ngay lập tức, tính năng chưa từng chạy được.)

# Xóa nghỉ phép theo ID
@ngay_nghi_le_bp.route('/delete-ngay-nghi-le/<int:id>', methods=['DELETE'])
def delete_ngay_nghi_le_router(id):
    return delete_ngay_nghi_le(id)
