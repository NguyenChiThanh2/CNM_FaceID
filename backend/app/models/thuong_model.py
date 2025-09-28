from datetime import date, datetime
from app import db

class Thuong(db.Model):
    __tablename__ = "thuong"

    id = db.Column(db.Integer, primary_key=True)
    ten_thuong = db.Column(db.String(255), nullable=False)
    loai_thuong = db.Column(db.String(100))
    so_tien = db.Column(db.Numeric(18, 1), nullable=False)
    ngay_quyet_dinh = db.Column(db.Date, nullable=False)
    ghi_chu = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Quan hệ (nếu muốn truy xuất nhân viên)
    thuong_nhanvien = db.relationship('ThuongNhanVien', back_populates='thuong')

    def __repr__(self):
        return f"<Thuong id={self.id}, loai={self.loai_thuong}, so_tien={self.so_tien}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "ten_thuong": self.ten_thuong,
            "loai_thuong": self.loai_thuong,
            "so_tien": float(self.so_tien),
            "ngay_quyet_dinh": self.ngay_quyet_dinh.isoformat() if self.ngay_quyet_dinh else None,
            "ghi_chu": self.ghi_chu,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }