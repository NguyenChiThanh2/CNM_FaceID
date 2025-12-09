# utils/validator.py
from datetime import datetime
class Validator:
    def __init__(self):
        pass
    
    def validate_year(self, year):
        """Validate năm"""
        try:
            year_int = int(year)
            current_year = datetime.now().year
            
            if year_int < 2000 or year_int > current_year + 5:
                return {
                    'valid': False,
                    'message': f'Năm phải từ 2000 đến {current_year + 5}'
                }
            
            return {'valid': True}
            
        except ValueError:
            return {
                'valid': False,
                'message': 'Năm không hợp lệ'
            }
    
    def validate_nhan_vien_year(self, nhan_vien_id, year):
        """Validate nhân viên và năm"""
        try:
            # Validate năm
            year_result = self.validate_year(year)
            if not year_result['valid']:
                return year_result
            
            # Validate nhân viên ID
            try:
                nhan_vien_id_int = int(nhan_vien_id)
                if nhan_vien_id_int <= 0:
                    return {
                        'valid': False,
                        'message': 'ID nhân viên không hợp lệ'
                    }
            except ValueError:
                return {
                    'valid': False,
                    'message': 'ID nhân viên không hợp lệ'
                }
            
            return {'valid': True}
            
        except Exception as e:
            return {
                'valid': False,
                'message': f'Lỗi validate: {str(e)}'
            }
    
    def validate_bao_hiem_data(self, data):
        """Validate dữ liệu bảo hiểm doanh nghiệp"""
        try:
            errors = []
            required_fields = ['nhan_vien_id', 'thang', 'nam']
            
            # Kiểm tra trường bắt buộc
            for field in required_fields:
                if field not in data:
                    errors.append(f'Thiếu trường bắt buộc: {field}')
            
            if errors:
                return {
                    'valid': False,
                    'message': 'Dữ liệu không hợp lệ',
                    'errors': errors
                }
            
            # Validate từng trường
            # nhan_vien_id
            try:
                nhan_vien_id = int(data['nhan_vien_id'])
                if nhan_vien_id <= 0:
                    errors.append('ID nhân viên phải lớn hơn 0')
            except (ValueError, TypeError):
                errors.append('ID nhân viên không hợp lệ')
            
            # thang
            try:
                thang = int(data['thang'])
                if thang < 1 or thang > 12:
                    errors.append('Tháng phải từ 1 đến 12')
            except (ValueError, TypeError):
                errors.append('Tháng không hợp lệ')
            
            # nam
            year_result = self.validate_year(data['nam'])
            if not year_result['valid']:
                errors.append(year_result['message'])
            
            # Các trường số
            number_fields = ['bhxh_dn', 'bhyt_dn', 'bhtn_dn']
            for field in number_fields:
                if field in data:
                    try:
                        value = float(data[field])
                        if value < 0:
                            errors.append(f'{field} không được âm')
                    except (ValueError, TypeError):
                        errors.append(f'{field} không hợp lệ')
            
            if errors:
                return {
                    'valid': False,
                    'message': 'Dữ liệu không hợp lệ',
                    'errors': errors
                }
            
            return {'valid': True}
            
        except Exception as e:
            return {
                'valid': False,
                'message': f'Lỗi validate: {str(e)}'
            }
    
    def validate_bao_hiem_update(self, data):
        """Validate dữ liệu cập nhật bảo hiểm doanh nghiệp"""
        try:
            errors = []
            
            # Chỉ validate các trường có trong data
            if 'bhxh_dn' in data:
                try:
                    value = float(data['bhxh_dn'])
                    if value < 0:
                        errors.append('bhxh_dn không được âm')
                except (ValueError, TypeError):
                    errors.append('bhxh_dn không hợp lệ')
            
            if 'bhyt_dn' in data:
                try:
                    value = float(data['bhyt_dn'])
                    if value < 0:
                        errors.append('bhyt_dn không được âm')
                except (ValueError, TypeError):
                    errors.append('bhyt_dn không hợp lệ')
            
            if 'bhtn_dn' in data:
                try:
                    value = float(data['bhtn_dn'])
                    if value < 0:
                        errors.append('bhtn_dn không được âm')
                except (ValueError, TypeError):
                    errors.append('bhtn_dn không hợp lệ')
            
            if errors:
                return {
                    'valid': False,
                    'message': 'Dữ liệu cập nhật không hợp lệ',
                    'errors': errors
                }
            
            return {'valid': True}
            
        except Exception as e:
            return {
                'valid': False,
                'message': f'Lỗi validate: {str(e)}'
            }