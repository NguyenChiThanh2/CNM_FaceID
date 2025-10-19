from datetime import datetime
from app import db
from sqlalchemy.sql import func

class NguoiPhuThuoc(db.Model):
    __tablename__ = "nguoi_phu_thuoc"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False)
    ho_ten = db.Column(db.String(255), nullable=False)
    quan_he = db.Column(db.String(100), nullable=False)
    ngay_bat_dau = db.Column(db.Date, nullable=False)
    ngay_ket_thuc = db.Column(db.Date, nullable=False)
    ghi_chu = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime,server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())
    NguoiPhuThuoc_nv = db.relationship("NhanVien", back_populates="NguoiPhuThuoc_nv", lazy=True)
    
    def __repr__(self):
        return f"<NguoiPhuThuoc id={self.id} nv={self.ho_ten} loai={self.quan_he}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'ho_ten': self.ho_ten,
            'quan_he': self.quan_he,
            'ngay_bat_dau': self.ngay_bat_dau.isoformat(),
            'ngay_ket_thuc': self.ngay_ket_thuc.isoformat(),
            'ghi_chu': self.ghi_chu,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }