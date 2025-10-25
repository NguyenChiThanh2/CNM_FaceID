from datetime import date, datetime
from app import db

class KhauTru(db.Model):
    __tablename__ = 'khau_tru'

    id = db.Column(db.Integer, primary_key=True)
    ten_khau_tru = db.Column(db.String(255), nullable=False)
    loai_khau_tru = db.Column(
        db.Enum('UNG_LUONG', 'VI_PHAM', 'TRU_KHAC', name='loai_khau_tru_enum'),
        nullable=False
    )
    so_tien = db.Column(db.Numeric(18, 2), nullable=False)
    ghi_chu = db.Column(db.String(255))
    ngay_quyet_dinh = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    file_dinh_kem = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Quan hệ N-N với nhân viên thông qua bảng trung gian
    # nhan_viens = db.relationship(
    #     'NhanVien',
    #     secondary='khautru_nhanvien',
    #     back_populates='khautru_list'
    # )
    nhan_viens = db.relationship(
        "NhanVien",
        secondary="khautru_nhanvien",
        back_populates="khautru_list",
        overlaps="khautru_nhanvien_list,nhan_vien"
    )
    khautru_nhanvien_list = db.relationship(
        "KhauTruNhanVien",
        back_populates="khau_tru",
        overlaps="khautru_list,nhan_viens"
    )
    # def __repr__(self):
    #     return f"<KhauTru loai={self.loai_khau_tru}, so_tien={self.so_tien}, ten_khau_tru={self.ten_khau_tru}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ten_khau_tru': self.ten_khau_tru,
            'loai_khau_tru': self.loai_khau_tru,
            'so_tien': float(self.so_tien),
            'ghi_chu': self.ghi_chu,
            'ngay_quyet_dinh': self.ngay_quyet_dinh.strftime('%Y-%m-%d') if self.ngay_quyet_dinh else None,
            'file_dinh_kem': self.file_dinh_kem,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }