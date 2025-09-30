from datetime import date, datetime
from app import db

class KhauTruNhanVien(db.Model):
    __tablename__ = 'khautru_nhanvien'

    id = db.Column(db.Integer, primary_key=True)
    khau_tru_id = db.Column(db.Integer, db.ForeignKey('khau_tru.id', ondelete='CASCADE'), nullable=False)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id', ondelete='CASCADE'), nullable=False)
    so_tien_thuc_te = db.Column(db.Numeric(15, 2), nullable=True)

    # Quan hệ ngược
    khau_tru = db.relationship('KhauTru', backref=db.backref('khautru_nhanvien_list', cascade="all, delete-orphan"))
    nhan_vien = db.relationship('NhanVien', backref=db.backref('khautru_nhanvien_list', cascade="all, delete-orphan"))

    def __repr__(self):
        return f"<KhauTruNhanVien NV:{self.nhan_vien_id} - KT:{self.khau_tru_id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'khau_tru_id': self.khau_tru_id,
            'nhan_vien_id': self.nhan_vien_id,
            'so_tien_thuc_te': float(self.so_tien_thuc_te) if self.so_tien_thuc_te else None
        }