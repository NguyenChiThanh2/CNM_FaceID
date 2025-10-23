from app import db
from sqlalchemy import extract, func

class BangLuong(db.Model):
    __tablename__ = 'bang_luong'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thang = db.Column(db.Integer, nullable=False)
    nam = db.Column(db.Integer, nullable=False)
    ngay_cong_chuan = db.Column(db.Integer, default=0)
    so_ngay_cong = db.Column(db.Integer, default=0)
    nghi_phep = db.Column(db.Integer, default=0)
    tong_ngay_lam_le = db.Column(db.Float, default=0.0)
    tong_tien_lam_le = db.Column(db.Float, default=0.0)
    tong_ngay_cuoi_tuan = db.Column(db.Float, default=0.0)
    tong_tien_cuoi_tuan = db.Column(db.Float, default=0.0)
    
    tong_gio_tang_ca = db.Column(db.Float, default=0.0)
    tong_tien_tang_ca = db.Column(db.Float, default=0.0)
    
    tong_khau_tru = db.Column(db.Float, default=0.0) 
    tong_phu_cap = db.Column(db.Float, default=0.0)
    tong_thuong = db.Column(db.Float, default=0.0)
    
    bhxh = db.Column(db.Float, default=0.0)
    bhtn = db.Column(db.Float, default=0.0) 
    bhyt = db.Column(db.Float, default=0.0)
    thue_tncn = db.Column(db.Float, default=0.0)
    tong_luong = db.Column(db.Float, default=0.0)
    thuc_nhan = db.Column(db.Float, default=0.0)
    ghi_chu = db.Column(db.String(255))

    bang_luong_nhan_vien = db.relationship('NhanVien', back_populates='bang_luong_nhan_vien', lazy=True)
    chi_tiet_luong_bang_luong = db.relationship('ChiTietLuong', back_populates='chi_tiet_luong_bang_luong', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "thang": self.thang,
            "nam": self.nam,
            "ngay_cong_chuan": self.ngay_cong_chuan,
            "so_ngay_cong": self.so_ngay_cong,
            "nghi_phep": self.nghi_phep,
            "tong_ngay_lam_le": self.tong_ngay_lam_le,
            "tong_tien_lam_le": self.tong_tien_lam_le,
            "tong_gio_tang_ca": self.tong_gio_tang_ca,
            "tong_tien_tang_ca": self.tong_tien_tang_ca,
            "tong_khau_tru": self.tong_khau_tru,
            "tong_phu_cap": self.tong_phu_cap,
            "tong_thuong": self.tong_thuong,
            "bhxh": self.bhxh,
            "bhtn": self.bhtn,
            "bhyt": self.bhyt,
            "thue_tncn": self.thue_tncn,
            "tong_luong": self.tong_luong,
            "thuc_nhan": self.thuc_nhan,
            "chi_tiet_luong": [ct.to_dict() for ct in self.chi_tiet_luong_bang_luong],
            "ghi_chu": self.ghi_chu,
            "tong_ngay_cuoi_tuan": self.tong_ngay_cuoi_tuan,
            "tong_tien_cuoi_tuan": self.tong_tien_cuoi_tuan,
        }
    
