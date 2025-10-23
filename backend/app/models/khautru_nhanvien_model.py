# models/khautru_nhanvien.py
from app import db

class KhauTruNhanVien(db.Model):
    __tablename__ = 'khautru_nhanvien'

    id = db.Column(db.Integer, primary_key=True)
    khau_tru_id = db.Column(db.Integer, db.ForeignKey('khau_tru.id', ondelete='CASCADE'), nullable=False)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id', ondelete='CASCADE'), nullable=False)
    so_tien_thuc_te = db.Column(db.Numeric(15, 2), nullable=True)

    # khau_tru = db.relationship('KhauTru', backref=db.backref('khautru_nhanvien_list', cascade="all, delete-orphan"))
    # nhan_vien = db.relationship('NhanVien', backref=db.backref('khautru_nhanvien_list', cascade="all, delete-orphan"))
    nhan_vien = db.relationship(
        "NhanVien",
        back_populates="khautru_nhanvien_list",
        overlaps="khautru_list,nhan_viens"
    )
    khau_tru = db.relationship(
        "KhauTru",
        back_populates="khautru_nhanvien_list",
        overlaps="khautru_list,nhan_viens"
    )

    def __repr__(self):
        return f"<KhauTruNhanVien loai={self.khau_tru.loai_khau_tru}, so_tien={self.khau_tru.so_tien}, ten_khau_tru={self.khau_tru.ten_khau_tru}, so_tien_thuc_te={self.so_tien_thuc_te} >"

    def to_dict(self):
        return {
            'id': self.id,
            'khau_tru_id': self.khau_tru_id,
            'nhan_vien_id': self.nhan_vien_id,
            'so_tien_thuc_te': float(self.so_tien_thuc_te) if self.so_tien_thuc_te is not None else None,
            # các field dưới để FE render list khấu trừ:
            'so_tien': float(self.khau_tru.so_tien) if self.khau_tru and self.khau_tru.so_tien is not None else 0.0,
            'loai_khau_tru': str(self.khau_tru.loai_khau_tru) if self.khau_tru else None,
            'ten_khau_tru': self.khau_tru.ten_khau_tru if self.khau_tru else None,
            'ghi_chu': self.khau_tru.ghi_chu if self.khau_tru else None,
            'ngay_quyet_dinh': self.khau_tru.ngay_quyet_dinh.strftime('%Y-%m-%d') if (self.khau_tru and self.khau_tru.ngay_quyet_dinh) else None,
            'file_dinh_kem': self.khau_tru.file_dinh_kem if self.khau_tru else None,
        }
