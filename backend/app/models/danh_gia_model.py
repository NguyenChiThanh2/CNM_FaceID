# app/models/danh_gia_model.py
from app import db
from datetime import date


class DanhGia(db.Model):
    __tablename__ = 'danh_gia'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    nguoi_danh_gia_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thoi_gian = db.Column(db.Date, default=date.today)

    diem_ky_nang = db.Column(db.Float)
    diem_thai_do = db.Column(db.Float)
    diem_hieu_suat = db.Column(db.Float)
    nhan_xet = db.Column(db.Text)

    # Không dùng backref, dùng back_populates
    nhan_vien = db.relationship('NhanVien', foreign_keys=[nhan_vien_id], back_populates='danh_gias_nhan')
    nguoi_danh_gia = db.relationship('NhanVien', foreign_keys=[nguoi_danh_gia_id], back_populates='danh_gias_danh')


    def __repr__(self):
        return f"<DanhGia {self.id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'nhan_vien': {
                'id': self.nhan_vien.id,
                'ho_ten': self.nhan_vien.ho_ten  # Giả sử model NhanVien có ho_ten
            } if self.nhan_vien else None,

            'nguoi_danh_gia_id': self.nguoi_danh_gia_id,
            'nguoi_danh_gia': {
                'id': self.nguoi_danh_gia.id,
                'ho_ten': self.nguoi_danh_gia.ho_ten
            } if self.nguoi_danh_gia else None,

            'thoi_gian': self.thoi_gian.isoformat(),
            'diem_ky_nang': self.diem_ky_nang,
            'diem_thai_do': self.diem_thai_do,
            'diem_hieu_suat': self.diem_hieu_suat,
            'nhan_xet': self.nhan_xet
        }

