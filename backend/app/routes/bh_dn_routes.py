from flask import Blueprint, request
from app.controllers.bh_dn_controller import *

from app.decorators.auth_decorators import require_module_permission

bao_hiem_dn_bp = Blueprint('bao_hiem_dn_bp', __name__)


@bao_hiem_dn_bp.before_request
def _require_permission():
    return require_module_permission("bao_hiem_dn")()
# Khởi tạo controller
# controller = BaoHiemDoanhNghiepController()


# @bhdn_bp.route('/get-bao-hiem-doanh-nghiep', methods=['GET'])
# def get_bhdn_router():
#     return get_bhdn_controller()

# Định nghĩa routes
@bao_hiem_dn_bp.route("/get-bao-hiem-doanh-nghiep", methods=["GET"])
def get_bao_hiem_doanh_nghiep():
    return bao_hiem_dn_controller()

# @bao_hiem_dn_bp.route('/get-bao-hiem-doanh-nghiep', methods=['GET'])
# def get_all_bao_hiem_doanh_nghiep():
#     """Lấy tất cả bảo hiểm doanh nghiệp"""
#     return controller.get_all()

# @bao_hiem_dn_bp.route('/api/get-bao-hiem-doanh-nghiep/<int:year>', methods=['GET'])
# def get_bao_hiem_doanh_nghiep_by_year(year):
#     """Lấy bảo hiểm doanh nghiệp theo năm"""
#     return controller.get_by_year(year)

# @bao_hiem_dn_bp.route('/api/get-bao-hiem-doanh-nghiep-nv/<int:nhan_vien_id>/<int:year>', methods=['GET'])
# def get_bao_hiem_doanh_nghiep_by_nhan_vien_year(nhan_vien_id, year):
#     """Lấy bảo hiểm doanh nghiệp của nhân viên theo năm"""
#     return controller.get_by_nhan_vien_year(nhan_vien_id, year)

# @bao_hiem_dn_bp.route('/api/get-tong-ket-bao-hiem-dn/<int:year>', methods=['GET'])
# def get_tong_ket_bao_hiem_dn(year):
#     """Lấy tổng kết bảo hiểm doanh nghiệp theo năm"""
#     return controller.get_summary_by_year(year)

# @bao_hiem_dn_bp.route('/api/get-tong-ket-bao-hiem-dn-nhan-vien/<int:year>', methods=['GET'])
# def get_tong_ket_bao_hiem_dn_nhan_vien(year):
#     """Lấy tổng kết bảo hiểm doanh nghiệp theo nhân viên"""
#     return controller.get_summary_by_nhan_vien_year(year)

# @bao_hiem_dn_bp.route('/api/get-years-bao-hiem-dn', methods=['GET'])
# def get_years_bao_hiem_dn():
#     """Lấy danh sách năm có dữ liệu"""
#     return controller.get_available_years()

# @bao_hiem_dn_bp.route('/api/add-bao-hiem-doanh-nghiep', methods=['POST'])
# def add_bao_hiem_doanh_nghiep():
#     """Thêm mới bảo hiểm doanh nghiệp"""
#     return controller.create()

# @bao_hiem_dn_bp.route('/api/update-bao-hiem-doanh-nghiep/<int:id>', methods=['PUT'])
# def update_bao_hiem_doanh_nghiep(id):
#     """Cập nhật bảo hiểm doanh nghiệp"""
#     return controller.update(id)

# @bao_hiem_dn_bp.route('/api/delete-bao-hiem-doanh-nghiep/<int:id>', methods=['DELETE'])
# def delete_bao_hiem_doanh_nghiep(id):
#     """Xóa bảo hiểm doanh nghiệp"""
#     return controller.delete(id)

# @bao_hiem_dn_bp.route('/api/import-bao-hiem-doanh-nghiep', methods=['POST'])
# def import_bao_hiem_doanh_nghiep():
#     """Import dữ liệu bảo hiểm doanh nghiệp từ Excel"""
#     return controller.import_from_excel()

# @bao_hiem_dn_bp.route('/api/export-bao-hiem-doanh-nghiep/<int:year>', methods=['GET'])
# def export_bao_hiem_doanh_nghiep(year):
#     """Export dữ liệu bảo hiểm doanh nghiệp ra Excel"""
#     return controller.export_to_excel(year)