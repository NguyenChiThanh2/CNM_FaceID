from datetime import date, datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Thuong(db.Model):
    __tablename__ = "thuong"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    loai_thuong = db.Column(db.Enum('LE', 'TET', 'THANG13', 'KHAC'), nullable=False)
    so_tien = db.Column(db.Float, default=0.0)
    ngay_thuong = db.Column(db.Date, nullable=False)
    ghi_chu = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Quan hệ (nếu muốn truy xuất nhân viên)
    thuong_nv = db.relationship("NhanVien", backref=db.backref("thuong_nv", lazy=True))

    def __repr__(self):
        return f"<Thuong id={self.id}, nhan_vien_id={self.nhan_vien_id}, loai={self.loai_thuong}, so_tien={self.so_tien}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'loai_thuong': self.loai_thuong,
            'so_tien': self.den_ngay.isoformat() if self.tu_ngay else None,
            'ngay_thuong': self.ngay_thuong,
            'ghi_chu': self.ghi_chu,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }