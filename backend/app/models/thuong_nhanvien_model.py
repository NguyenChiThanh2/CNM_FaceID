
from app import db

class ThuongNhanVien(db.Model):
    __tablename__ = 'nhanvien_thuong'
    id = db.Column(db.Integer, primary_key=True)
    nhanvien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thuong_id = db.Column(db.Integer, db.ForeignKey('thuong.id', ondelete="CASCADE"), nullable=False)
    trang_thai = db.Column(db.String(50), default="Chưa chi trả")
    ngay_chi = db.Column(db.Date)

    thuong = db.relationship('Thuong', back_populates='thuong_nhanvien', lazy=True)
    nhanvien = db.relationship('NhanVien', back_populates='thuong_nhanvien', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nhanvien_id": self.nhanvien_id,
            "ho_ten": self.nhanvien.ho_ten if self.nhanvien else None,
            "thuong_id": self.thuong_id,
            "ten_thuong": self.thuong.ten_thuong if self.thuong else None,
            "trang_thai": self.trang_thai,
            "ngay_chi": self.ngay_chi.isoformat() if self.ngay_chi else None,
            "thuong": self.thuong.to_dict() if self.thuong else None
        }

