# app/models/luong_model.py
from app import db
from sqlalchemy import extract, func
from app.models.cham_cong_model import ChamCong 
class Luong(db.Model):
    __tablename__ = 'luong'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thang = db.Column(db.Integer, nullable=False)
    nam = db.Column(db.Integer, nullable=False)
    so_ngay_cong = db.Column(db.Integer, default=0)
    phu_cap = db.Column(db.Float, default=0.0)
    khau_tru = db.Column(db.Float, default=0.0)

    luong_nv = db.relationship('NhanVien', back_populates='luong_nv')

    @staticmethod
    def tinh_so_ngay_cong(nhan_vien_id, thang: int, nam: int):
        so_ngay_cong = (
            db.session.query(func.count(func.distinct(ChamCong.ngay)))
            .filter(
                ChamCong.nhan_vien_id == nhan_vien_id,
                extract('month', ChamCong.ngay) == thang,
                extract('year', ChamCong.ngay) == nam,
                ChamCong.thoi_gian_vao.isnot(None)
            )
            .scalar()
        )
        return so_ngay_cong or 0
    @staticmethod
    def tinh_phu_cap(so_ngay_cong: int):
        return 25000 * so_ngay_cong
    @staticmethod
    def tinh_khau_tru(so_ngay_cong):
        return 100000 if so_ngay_cong < 20 else 0 
    @property
    def tong_luong(self):
        base = self.luong_nv.luong_co_ban if self.luong_nv else 0
        daily_salary = base / 26 if base else 0
        phu_cap = self.tinh_phu_cap(self.so_ngay_cong)
        khau_tru = self.tinh_khau_tru(self.so_ngay_cong)
        tong = daily_salary * self.so_ngay_cong + phu_cap + (self.phu_cap or 0) - (self.khau_tru or 0)
        return round(tong, 2)



    def __repr__(self):
        return f"<Luong {self.id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'thang': self.thang if self.thang else None,
            'luong_co_ban': self.luong_nv.luong_co_ban if self.luong_nv else None,
            'so_ngay_cong': self.so_ngay_cong,
            'phu_cap': self.phu_cap,
            'khau_tru': self.khau_tru,
            'tong_luong': self.tong_luong,
            'nhan_vien_id': self.nhan_vien_id,
            'ten_nhan_vien': self.luong_nv.ho_ten if self.luong_nv else None,
        }
