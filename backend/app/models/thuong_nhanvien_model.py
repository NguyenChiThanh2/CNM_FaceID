
from app import db
from app.models.soft_delete import SoftDeleteMixin
from app.models.audit import AuditMixin

class ThuongNhanVien(db.Model, SoftDeleteMixin, AuditMixin):
    __tablename__ = 'nhanvien_thuong'
    id = db.Column(db.Integer, primary_key=True)
    nhanvien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False, index=True)
    thuong_id = db.Column(db.Integer, db.ForeignKey('thuong.id', ondelete="CASCADE"), nullable=False, index=True)
    trang_thai = db.Column(db.String(50), default="Chưa chi trả")
    so_tien_thuc_te = db.Column(db.Numeric(15, 2), nullable=True)

    thuong = db.relationship('Thuong', back_populates='thuong_nhanvien', lazy=True)
    nhanvien = db.relationship('NhanVien', foreign_keys=[nhanvien_id], back_populates='thuong_nhanvien', lazy=True)

    def __repr__(self):
        return f"<ThuongNhanVien loai={self.thuong.loai_thuong}, so_tien={self.thuong.so_tien}, ten_thuong={self.thuong.ten_thuong}, so_tien_thuc_te={self.so_tien_thuc_te} >"

    def to_dict(self):
        return {
            "id": self.id,
            "nhanvien_id": self.nhanvien_id,
            "ho_ten": self.nhanvien.ho_ten if self.nhanvien else None,
            "thuong_id": self.thuong_id,
            "ten_thuong": self.thuong.ten_thuong if self.thuong else None,
            "trang_thai": self.trang_thai,
            'so_tien_thuc_te': float(self.so_tien_thuc_te) if self.so_tien_thuc_te is not None else None,
            "thuong": self.thuong.to_dict() if self.thuong else None
        }

