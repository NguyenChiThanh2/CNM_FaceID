# utils/response_handler.py
from flask import jsonify
from datetime import datetime

class ResponseHandler:
    def __init__(self):
        pass
    
    def success(self, data=None, message="Thành công", **kwargs):
        """Trả về response thành công"""
        response = {
            'success': True,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if data is not None:
            response['data'] = data
        
        # Thêm các field bổ sung
        for key, value in kwargs.items():
            response[key] = value
        
        return jsonify(response), 200
    
    def error(self, message="Lỗi máy chủ", error=None, status_code=500):
        """Trả về response lỗi"""
        response = {
            'success': False,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if error:
            response['error'] = str(error)
        
        return jsonify(response), status_code
    
    def bad_request(self, message="Yêu cầu không hợp lệ", errors=None):
        """Trả về response bad request"""
        response = {
            'success': False,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        
        if errors:
            response['errors'] = errors
        
        return jsonify(response), 400
    
    def not_found(self, message="Không tìm thấy"):
        """Trả về response not found"""
        return self.error(message=message, status_code=404)
    
    def conflict(self, message="Xung đột dữ liệu"):
        """Trả về response conflict"""
        return self.error(message=message, status_code=409)
    
    def unauthorized(self, message="Không được phép"):
        """Trả về response unauthorized"""
        return self.error(message=message, status_code=401)