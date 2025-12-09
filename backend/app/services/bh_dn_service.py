# services/bao_hiem_dn_service.py
from app.models.bh_dn import BaoHiemDoanhNghiep
from app.models.nhan_vien_model import NhanVien
from app import db
from sqlalchemy import and_, or_
# import pandas as pd
from io import BytesIO
import traceback
from datetime import datetime


def get_all_bao_hiem_dn_service():
    """
    Lấy toàn bộ dữ liệu bảo hiểm doanh nghiệp
    """
    data = BaoHiemDoanhNghiep.query.order_by(
        BaoHiemDoanhNghiep.nam.desc(),
        BaoHiemDoanhNghiep.thang.desc()
    ).all()
    return [item.to_dict() for item in data]
    
    # def get_all(self, nhan_vien_id=None, year=None, month=None, page=1, per_page=100):
    #     """Lấy tất cả bảo hiểm doanh nghiệp với filter"""
    #     try:
    #         # Xây dựng query
    #         query = BaoHiemDoanhNghiep.query
            
    #         # Áp dụng filters
    #         filters = []
            
    #         if nhan_vien_id:
    #             filters.append(BaoHiemDoanhNghiep.nhan_vien_id == nhan_vien_id)
            
    #         if year:
    #             filters.append(BaoHiemDoanhNghiep.nam == year)
            
    #         if month:
    #             filters.append(BaoHiemDoanhNghiep.thang == month)
            
    #         if filters:
    #             query = query.filter(and_(*filters))
            
    #         # Thực hiện query
    #         total = query.count()
    #         items = query.order_by(
    #             BaoHiemDoanhNghiep.nam.desc(),
    #             BaoHiemDoanhNghiep.thang.desc(),
    #             BaoHiemDoanhNghiep.nhan_vien_id
    #         ).all()
            
    #         # Format dữ liệu
    #         data = [self._format_item(item) for item in items]
            
    #         return {
    #             'success': True,
    #             'data': data,
    #             'total': total,
    #             'page': page,
    #             'per_page': per_page
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_all: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy dữ liệu: {str(e)}",
    #             'data': [],
    #             'total': 0
    #         }
    
    # def get_by_year(self, year):
    #     """Lấy bảo hiểm doanh nghiệp theo năm"""
    #     try:
    #         items = BaoHiemDoanhNghiep.get_by_year(year)
    #         data = [self._format_item_with_nhan_vien(item) for item in items]
            
    #         return {
    #             'success': True,
    #             'data': data,
    #             'total': len(data)
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_by_year: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy dữ liệu năm {year}: {str(e)}",
    #             'data': [],
    #             'total': 0
    #         }
    
    # def get_by_nhan_vien_year(self, nhan_vien_id, year):
    #     """Lấy bảo hiểm doanh nghiệp của nhân viên theo năm"""
    #     try:
    #         items = BaoHiemDoanhNghiep.get_by_nhan_vien_and_year(nhan_vien_id, year)
    #         data = [self._format_item(item) for item in items]
            
    #         return {
    #             'success': True,
    #             'data': data,
    #             'total': len(data)
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_by_nhan_vien_year: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy dữ liệu nhân viên {nhan_vien_id} năm {year}: {str(e)}",
    #             'data': [],
    #             'total': 0
    #         }
    
    # def get_summary_by_year(self, year):
    #     """Lấy tổng kết bảo hiểm doanh nghiệp theo năm"""
    #     try:
    #         summary = BaoHiemDoanhNghiep.get_summary_by_year(year)
            
    #         # Tính thêm các chỉ số khác
    #         summary['avg_per_month'] = summary['total_all'] / 12 if summary['total_all'] > 0 else 0
    #         summary['employee_count'] = db.session.query(
    #             BaoHiemDoanhNghiep.nhan_vien_id
    #         ).filter_by(nam=year).distinct().count()
            
    #         return {
    #             'success': True,
    #             'data': summary
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_summary_by_year: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy tổng kết năm {year}: {str(e)}"
    #         }
    
    # def get_summary_by_nhan_vien_year(self, year):
    #     """Lấy tổng kết bảo hiểm doanh nghiệp theo nhân viên"""
    #     try:
    #         items = BaoHiemDoanhNghiep.get_summary_by_nhan_vien_year(year)
            
    #         # Format dữ liệu
    #         data = []
    #         for item in items:
    #             data.append({
    #                 'nhan_vien_id': item['nhan_vien_id'],
    #                 'ho_ten': item['ho_ten'],
    #                 'total_bhxh_dn': float(item['total_bhxh_dn']),
    #                 'total_bhyt_dn': float(item['total_bhyt_dn']),
    #                 'total_bhtn_dn': float(item['total_bhtn_dn']),
    #                 'total_all': float(item['total_all']),
    #                 'month_count': item['month_count'],
    #                 'avg_per_month': float(item['total_all']) / item['month_count'] if item['month_count'] > 0 else 0
    #             })
            
    #         return {
    #             'success': True,
    #             'data': data,
    #             'total': len(data)
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_summary_by_nhan_vien_year: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy tổng kết theo nhân viên năm {year}: {str(e)}",
    #             'data': []
    #         }
    
    # def get_available_years(self):
    #     """Lấy danh sách năm có dữ liệu"""
    #     try:
    #         years = BaoHiemDoanhNghiep.get_years_available()
            
    #         # Format dữ liệu
    #         data = [{'year': year, 'label': f'Năm {year}'} for year in years]
            
    #         return {
    #             'success': True,
    #             'data': data,
    #             'total': len(data)
    #         }
            
    #     except Exception as e:
    #         print(f"Error in get_available_years: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi lấy danh sách năm: {str(e)}",
    #             'data': []
    #         }
    
    # def create(self, data):
    #     """Thêm mới bảo hiểm doanh nghiệp"""
    #     try:
    #         # Kiểm tra trùng lặp
    #         existing = BaoHiemDoanhNghiep.get_by_nhan_vien_month_year(
    #             data['nhan_vien_id'],
    #             data['thang'],
    #             data['nam']
    #         )
            
    #         if existing:
    #             return {
    #                 'success': False,
    #                 'message': 'Đã tồn tại bảo hiểm doanh nghiệp cho tháng/năm này'
    #             }
            
    #         # Kiểm tra nhân viên tồn tại
    #         nhan_vien = NhanVien.query.get(data['nhan_vien_id'])
    #         if not nhan_vien:
    #             return {
    #                 'success': False,
    #                 'message': 'Nhân viên không tồn tại'
    #             }
            
    #         # Tạo mới
    #         bao_hiem = BaoHiemDoanhNghiep(
    #             nhan_vien_id=data['nhan_vien_id'],
    #             thang=data['thang'],
    #             nam=data['nam'],
    #             bhxh_dn=data.get('bhxh_dn', 0),
    #             bhyt_dn=data.get('bhyt_dn', 0),
    #             bhtn_dn=data.get('bhtn_dn', 0),
    #             ghi_chu=data.get('ghi_chu')
    #         )
            
    #         db.session.add(bao_hiem)
    #         db.session.commit()
            
    #         return {
    #             'success': True,
    #             'message': 'Thêm bảo hiểm doanh nghiệp thành công',
    #             'data': self._format_item(bao_hiem)
    #         }
            
    #     except Exception as e:
    #         db.session.rollback()
    #         print(f"Error in create: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi thêm bảo hiểm doanh nghiệp: {str(e)}"
    #         }
    
    # def update(self, id, data):
    #     """Cập nhật bảo hiểm doanh nghiệp"""
    #     try:
    #         bao_hiem = BaoHiemDoanhNghiep.query.get(id)
            
    #         if not bao_hiem:
    #             return {
    #                 'success': False,
    #                 'message': 'Không tìm thấy bảo hiểm doanh nghiệp'
    #             }
            
    #         # Cập nhật các trường
    #         if 'bhxh_dn' in data:
    #             bao_hiem.bhxh_dn = data['bhxh_dn']
    #         if 'bhyt_dn' in data:
    #             bao_hiem.bhyt_dn = data['bhyt_dn']
    #         if 'bhtn_dn' in data:
    #             bao_hiem.bhtn_dn = data['bhtn_dn']
    #         if 'ghi_chu' in data:
    #             bao_hiem.ghi_chu = data['ghi_chu']
            
    #         # Cập nhật tổng
    #         bao_hiem.update_tong_bh_dn()
            
    #         db.session.commit()
            
    #         return {
    #             'success': True,
    #             'message': 'Cập nhật bảo hiểm doanh nghiệp thành công',
    #             'data': self._format_item(bao_hiem)
    #         }
            
    #     except Exception as e:
    #         db.session.rollback()
    #         print(f"Error in update: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi cập nhật bảo hiểm doanh nghiệp: {str(e)}"
    #         }
    
    # def delete(self, id):
    #     """Xóa bảo hiểm doanh nghiệp"""
    #     try:
    #         bao_hiem = BaoHiemDoanhNghiep.query.get(id)
            
    #         if not bao_hiem:
    #             return {
    #                 'success': False,
    #                 'message': 'Không tìm thấy bảo hiểm doanh nghiệp'
    #             }
            
    #         db.session.delete(bao_hiem)
    #         db.session.commit()
            
    #         return {
    #             'success': True,
    #             'message': 'Xóa bảo hiểm doanh nghiệp thành công'
    #         }
            
    #     except Exception as e:
    #         db.session.rollback()
    #         print(f"Error in delete: {str(e)}")
    #         return {
    #             'success': False,
    #             'message': f"Lỗi khi xóa bảo hiểm doanh nghiệp: {str(e)}"
    #         }
    
    # # def import_from_excel(self, file):
    # #     """Import dữ liệu từ Excel"""
    # #     try:
    # #         # Đọc file Excel
    # #         df = pd.read_excel(file)
            
    # #         # Kiểm tra cột bắt buộc
    # #         required_columns = ['nhan_vien_id', 'thang', 'nam', 'bhxh_dn', 'bhyt_dn', 'bhtn_dn']
    # #         missing_columns = [col for col in required_columns if col not in df.columns]
            
    # #         if missing_columns:
    # #             return {
    # #                 'success': False,
    # #                 'message': f'Thiếu các cột bắt buộc: {", ".join(missing_columns)}',
    # #                 'errors': [f'Missing column: {col}' for col in missing_columns]
    # #             }
            
    # #         imported_count = 0
    # #         skipped_count = 0
    # #         errors = []
            
    # #         # Import từng dòng
    # #         for index, row in df.iterrows():
    # #             try:
    # #                 # Kiểm tra trùng lặp
    # #                 existing = BaoHiemDoanhNghiep.get_by_nhan_vien_month_year(
    # #                     int(row['nhan_vien_id']),
    # #                     int(row['thang']),
    # #                     int(row['nam'])
    # #                 )
                    
    # #                 if existing:
    # #                     skipped_count += 1
    # #                     errors.append(f"Dòng {index + 2}: Đã tồn tại dữ liệu cho tháng {row['thang']}/{row['nam']}")
    # #                     continue
                    
    # #                 # Tạo mới
    # #                 bao_hiem = BaoHiemDoanhNghiep(
    # #                     nhan_vien_id=int(row['nhan_vien_id']),
    # #                     thang=int(row['thang']),
    # #                     nam=int(row['nam']),
    # #                     bhxh_dn=float(row['bhxh_dn']),
    # #                     bhyt_dn=float(row['bhyt_dn']),
    # #                     bhtn_dn=float(row['bhtn_dn']),
    # #                     ghi_chu=str(row.get('ghi_chu', '')) if pd.notna(row.get('ghi_chu')) else None
    # #                 )
                    
    # #                 db.session.add(bao_hiem)
    # #                 imported_count += 1
                    
    # #             except Exception as e:
    # #                 skipped_count += 1
    # #                 errors.append(f"Dòng {index + 2}: {str(e)}")
            
    # #         # Commit tất cả
    # #         db.session.commit()
            
    # #         return {
    # #             'success': True,
    # #             'message': f'Import thành công {imported_count} bản ghi, bỏ qua {skipped_count} bản ghi',
    # #             'imported_count': imported_count,
    # #             'skipped_count': skipped_count,
    # #             'errors': errors if errors else None
    # #         }
            
    # #     except Exception as e:
    # #         db.session.rollback()
    # #         print(f"Error in import_from_excel: {str(e)}")
    # #         return {
    # #             'success': False,
    # #             'message': f"Lỗi khi import từ Excel: {str(e)}"
    # #         }
    
    # # def export_to_excel(self, year):
    # #     """Export dữ liệu ra Excel"""
    # #     try:
    # #         # Lấy dữ liệu
    # #         items = BaoHiemDoanhNghiep.get_by_year(year)
            
    # #         if not items:
    # #             return {
    # #                 'success': False,
    # #                 'message': f'Không có dữ liệu bảo hiểm doanh nghiệp năm {year}'
    # #             }
            
    # #         # Tạo DataFrame
    # #         data = []
    # #         for item in items:
    # #             data.append({
    # #                 'ID': item.id,
    # #                 'Mã NV': item.nhan_vien.ma_nhan_vien if item.nhan_vien else '',
    # #                 'Họ tên': item.nhan_vien.ho_ten if item.nhan_vien else '',
    # #                 'Tháng': item.thang,
    # #                 'Năm': item.nam,
    # #                 'BHXH DN': float(item.bhxh_dn),
    # #                 'BHYT DN': float(item.bhyt_dn),
    # #                 'BHTN DN': float(item.bhtn_dn),
    # #                 'Tổng BH DN': float(item.tong_bh_dn),
    # #                 'Ghi chú': item.ghi_chu or ''
    # #             })
            
    # #         df = pd.DataFrame(data)
            
    # #         # Tạo file Excel
    # #         output = BytesIO()
    # #         with pd.ExcelWriter(output, engine='openpyxl') as writer:
    # #             df.to_excel(writer, sheet_name=f'BH_DN_{year}', index=False)
                
    # #             # Điều chỉnh độ rộng cột
    # #             worksheet = writer.sheets[f'BH_DN_{year}']
    # #             for column in df:
    # #                 column_length = max(df[column].astype(str).map(len).max(), len(column))
    # #                 column_letter = pd.io.excel.get_column_letter(df.columns.get_loc(column) + 1)
    # #                 worksheet.column_dimensions[column_letter].width = column_length + 2
            
    # #         output.seek(0)
            
    # #         return {
    # #             'success': True,
    # #             'excel_data': output.getvalue(),
    # #             'filename': f'bao_hiem_doanh_nghiep_{year}.xlsx'
    # #         }
            
    # #     except Exception as e:
    # #         print(f"Error in export_to_excel: {str(e)}")
    # #         return {
    # #             'success': False,
    # #             'message': f"Lỗi khi export ra Excel: {str(e)}"
    # #         }
    
    # # def _format_item(self, item):
    # #     """Format dữ liệu item"""
    # #     return {
    # #         'id': item.id,
    # #         'nhan_vien_id': item.nhan_vien_id,
    # #         'thang': item.thang,
    # #         'nam': item.nam,
    # #         'bhxh_dn': float(item.bhxh_dn),
    # #         'bhyt_dn': float(item.bhyt_dn),
    # #         'bhtn_dn': float(item.bhtn_dn),
    # #         'tong_bh_dn': float(item.tong_bh_dn),
    # #         'ghi_chu': item.ghi_chu,
    # #         'created_at': item.created_at.isoformat() if hasattr(item, 'created_at') and item.created_at else None,
    # #         'updated_at': item.updated_at.isoformat() if hasattr(item, 'updated_at') and item.updated_at else None
    # #     }
    
    # # def _format_item_with_nhan_vien(self, item):
    # #     """Format dữ liệu item kèm thông tin nhân viên"""
    # #     formatted = self._format_item(item)
        
    # #     if item.nhan_vien:
    # #         formatted['nhan_vien'] = {
    # #             'ma_nhan_vien': item.nhan_vien.ma_nhan_vien,
    # #             'ho_ten': item.nhan_vien.ho_ten,
    # #             'phong_ban': item.nhan_vien.phong_ban.ten_phong_ban if item.nhan_vien.phong_ban else None,
    # #             'chuc_vu': item.nhan_vien.chuc_vu.ten_chuc_vu if item.nhan_vien.chuc_vu else None
    # #         }
        
    # #     return formatted