from app import db
from datetime import datetime

class NgayNghiLe(db.Model):
    __tablename__ = "ngay_nghi_le"
    
    id = db.Column(db.Integer, primary_key=True)
    ten_ngay = db.Column(db.String(100), nullable=False)  # Mã loại: TET_AM, TET_DUONG, QUOC_KHANH...
    tu_ngay = db.Column(db.Date, nullable=False)          # Ngày bắt đầu nghỉ
    den_ngay = db.Column(db.Date, nullable=False)         # Ngày kết thúc nghỉ       
    mo_ta = db.Column(db.String(255), nullable=True)  
    
    def __repr__(self):
        return f"<NgayNghiLe ten_ngay={self.ten_ngay} tu_ngay={self.tu_ngay} den_ngay={self.den_ngay}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'ten_ngay': self.ten_ngay,
            'tu_ngay': self.tu_ngay.isoformat() if self.tu_ngay else None,
            'den_ngay': self.den_ngay.isoformat() if self.den_ngay else None,
            'mo_ta': self.mo_ta 
        }