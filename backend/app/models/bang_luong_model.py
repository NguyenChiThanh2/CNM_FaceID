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
    tong_gio_tang_ca = db.Column(db.Float, default=0.0)
    tong_khau_tru = db.Column(db.Float, default=0.0) 
    tong_phu_cap = db.Column(db.Float, default=0.0)
    
    bhxh = db.Column(db.Float, default=0.0)
    bhtn = db.Column(db.Float, default=0.0) 
    bhyt = db.Column(db.Float, default=0.0)
    thue_tncn = db.Column(db.Float, default=0.0)
    tong_luong = db.Column(db.Float, default=0.0)
    thuc_nhan = db.Column(db.Float, default=0.0)

    bang_luong_nhan_vien = db.relationship('NhanVien', back_populates='bang_luong_nhan_vien', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "thang": self.thang,
            "nam": self.nam,
            "ngay_cong_chuan": self.ngay_cong_chuan,
            "so_ngay_cong": self.so_ngay_cong,
            "tong_gio_tang_ca": self.tong_gio_tang_ca,
            "tong_khau_tru": self.tong_khau_tru,
            "tong_phu_cap": self.tong_phu_cap,
            "bhxh": self.bhxh,
            "bhtn": self.bhtn,
            "bhyt": self.bhyt,
            "thue_tncn": self.thue_tncn,
            "tong_luong": self.tong_luong,
            "thuc_nhan": self.thuc_nhan,
        }
    
