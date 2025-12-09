from flask import request, jsonify, send_file
from app.services.bh_dn_service import  *

    

def bao_hiem_dn_controller():
    try:
        data = get_all_bao_hiem_dn_service()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    # def get_all(self):
    #     """Lấy tất cả bảo hiểm doanh nghiệp"""
    #     try:
    #         # Lấy tham số filter từ query string
    #         nhan_vien_id = request.args.get('nhan_vien_id', type=int)
    #         year = request.args.get('year', type=int)
    #         month = request.args.get('month', type=int)
            
    #         # Gọi service
    #         result = self.service.get_all(
    #             nhan_vien_id=nhan_vien_id,
    #             year=year,
    #             month=month
    #         )
            
    #         return self.response_handler.success(
    #             data=result['data'],
    #             total=result['total'],
    #             message="Lấy dữ liệu bảo hiểm doanh nghiệp thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi lấy dữ liệu bảo hiểm doanh nghiệp",
    #             error=str(e)
    #         )
    
    # def get_by_year(self, year):
    #     """Lấy bảo hiểm doanh nghiệp theo năm"""
    #     try:
    #         # Validate input
    #         validation_result = self.validator.validate_year(year)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message']
    #             )
            
    #         # Gọi service
    #         result = self.service.get_by_year(year)
            
    #         return self.response_handler.success(
    #             data=result['data'],
    #             total=result['total'],
    #             message=f"Lấy dữ liệu bảo hiểm doanh nghiệp năm {year} thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message=f"Lỗi khi lấy dữ liệu bảo hiểm doanh nghiệp năm {year}",
    #             error=str(e)
    #         )
    
    # def get_by_nhan_vien_year(self, nhan_vien_id, year):
    #     """Lấy bảo hiểm doanh nghiệp của nhân viên theo năm"""
    #     try:
    #         # Validate input
    #         validation_result = self.validator.validate_nhan_vien_year(nhan_vien_id, year)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message']
    #             )
            
    #         # Gọi service
    #         result = self.service.get_by_nhan_vien_year(nhan_vien_id, year)
            
    #         return self.response_handler.success(
    #             data=result['data'],
    #             total=result['total'],
    #             message=f"Lấy dữ liệu bảo hiểm doanh nghiệp của nhân viên {nhan_vien_id} năm {year} thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message=f"Lỗi khi lấy dữ liệu bảo hiểm doanh nghiệp của nhân viên {nhan_vien_id}",
    #             error=str(e)
    #         )
    
    # def get_summary_by_year(self, year):
    #     """Lấy tổng kết bảo hiểm doanh nghiệp theo năm"""
    #     try:
    #         # Validate input
    #         validation_result = self.validator.validate_year(year)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message']
    #             )
            
    #         # Gọi service
    #         result = self.service.get_summary_by_year(year)
            
    #         return self.response_handler.success(
    #             data=result,
    #             message=f"Lấy tổng kết bảo hiểm doanh nghiệp năm {year} thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message=f"Lỗi khi lấy tổng kết bảo hiểm doanh nghiệp năm {year}",
    #             error=str(e)
    #         )
    
    # def get_summary_by_nhan_vien_year(self, year):
    #     """Lấy tổng kết bảo hiểm doanh nghiệp theo nhân viên"""
    #     try:
    #         # Validate input
    #         validation_result = self.validator.validate_year(year)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message']
    #             )
            
    #         # Gọi service
    #         result = self.service.get_summary_by_nhan_vien_year(year)
            
    #         return self.response_handler.success(
    #             data=result,
    #             message=f"Lấy tổng kết bảo hiểm doanh nghiệp theo nhân viên năm {year} thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message=f"Lỗi khi lấy tổng kết bảo hiểm doanh nghiệp theo nhân viên năm {year}",
    #             error=str(e)
    #         )
    
    # def get_available_years(self):
    #     """Lấy danh sách năm có dữ liệu"""
    #     try:
    #         # Gọi service
    #         result = self.service.get_available_years()
            
    #         return self.response_handler.success(
    #             data=result,
    #             message="Lấy danh sách năm có dữ liệu thành công"
    #         )
            
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi lấy danh sách năm có dữ liệu",
    #             error=str(e)
    #         )
    
    # def create(self):
    #     """Thêm mới bảo hiểm doanh nghiệp"""
    #     try:
    #         # Lấy dữ liệu từ request
    #         data = request.get_json()
            
    #         if not data:
    #             return self.response_handler.bad_request(
    #                 message="Không có dữ liệu gửi lên"
    #             )
            
    #         # Validate dữ liệu
    #         validation_result = self.validator.validate_bao_hiem_data(data)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message'],
    #                 errors=validation_result.get('errors', [])
    #             )
            
    #         # Gọi service để tạo mới
    #         result = self.service.create(data)
            
    #         if result['success']:
    #             return self.response_handler.success(
    #                 data=result['data'],
    #                 message="Thêm bảo hiểm doanh nghiệp thành công"
    #             )
    #         else:
    #             return self.response_handler.conflict(
    #                 message=result['message']
    #             )
                
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi thêm bảo hiểm doanh nghiệp",
    #             error=str(e)
    #         )
    
    # def update(self, id):
    #     """Cập nhật bảo hiểm doanh nghiệp"""
    #     try:
    #         # Lấy dữ liệu từ request
    #         data = request.get_json()
            
    #         if not data:
    #             return self.response_handler.bad_request(
    #                 message="Không có dữ liệu gửi lên"
    #             )
            
    #         # Validate dữ liệu
    #         validation_result = self.validator.validate_bao_hiem_update(data)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message'],
    #                 errors=validation_result.get('errors', [])
    #             )
            
    #         # Gọi service để cập nhật
    #         result = self.service.update(id, data)
            
    #         if result['success']:
    #             return self.response_handler.success(
    #                 data=result['data'],
    #                 message="Cập nhật bảo hiểm doanh nghiệp thành công"
    #             )
    #         else:
    #             return self.response_handler.not_found(
    #                 message=result['message']
    #             )
                
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi cập nhật bảo hiểm doanh nghiệp",
    #             error=str(e)
    #         )
    
    # def delete(self, id):
    #     """Xóa bảo hiểm doanh nghiệp"""
    #     try:
    #         # Gọi service để xóa
    #         result = self.service.delete(id)
            
    #         if result['success']:
    #             return self.response_handler.success(
    #                 message="Xóa bảo hiểm doanh nghiệp thành công"
    #             )
    #         else:
    #             return self.response_handler.not_found(
    #                 message=result['message']
    #             )
                
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi xóa bảo hiểm doanh nghiệp",
    #             error=str(e)
    #         )
    
    # def import_from_excel(self):
    #     """Import dữ liệu từ Excel"""
    #     try:
    #         # Kiểm tra file
    #         if 'file' not in request.files:
    #             return self.response_handler.bad_request(
    #                 message="Không tìm thấy file upload"
    #             )
            
    #         file = request.files['file']
            
    #         if file.filename == '':
    #             return self.response_handler.bad_request(
    #                 message="Không có file được chọn"
    #             )
            
    #         # Kiểm tra định dạng file
    #         if not file.filename.endswith(('.xlsx', '.xls')):
    #             return self.response_handler.bad_request(
    #                 message="Chỉ chấp nhận file Excel (.xlsx, .xls)"
    #             )
            
    #         # Gọi service để import
    #         result = self.service.import_from_excel(file)
            
    #         if result['success']:
    #             return self.response_handler.success(
    #                 data=result.get('data'),
    #                 message=result['message'],
    #                 imported_count=result.get('imported_count', 0),
    #                 skipped_count=result.get('skipped_count', 0)
    #             )
    #         else:
    #             return self.response_handler.bad_request(
    #                 message=result['message'],
    #                 errors=result.get('errors', [])
    #             )
                
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi import dữ liệu từ Excel",
    #             error=str(e)
    #         )
    
    # def export_to_excel(self, year):
    #     """Export dữ liệu ra Excel"""
    #     try:
    #         # Validate input
    #         validation_result = self.validator.validate_year(year)
    #         if not validation_result['valid']:
    #             return self.response_handler.bad_request(
    #                 message=validation_result['message']
    #             )
            
    #         # Gọi service để export
    #         result = self.service.export_to_excel(year)
            
    #         if result['success']:
    #             # Trả về file Excel
    #             return send_file(
    #                 io.BytesIO(result['excel_data']),
    #                 mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    #                 as_attachment=True,
    #                 download_name=f'bao_hiem_doanh_nghiep_{year}.xlsx'
    #             )
    #         else:
    #             return self.response_handler.not_found(
    #                 message=result['message']
    #             )
                
    #     except Exception as e:
    #         return self.response_handler.error(
    #             message="Lỗi khi export dữ liệu ra Excel",
    #             error=str(e)
    #         )

