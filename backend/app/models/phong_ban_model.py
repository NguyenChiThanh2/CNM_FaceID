from app import db
from app.models.nhan_vien_model import NhanVien  # Đảm bảo rằng đường dẫn này chính xác

class PhongBan(db.Model):
    __tablename__ = 'phong_ban'

    id = db.Column(db.Integer, primary_key=True)
    ma_phong_ban = db.Column(db.Integer, nullable=False, unique=True)
    ten_phong_ban = db.Column(db.String(255), nullable=False)
    mo_ta = db.Column(db.Text)

    # Quan hệ với bảng NhanVien
    phong_ban_nv = db.relationship('NhanVien', back_populates='phong_ban')

    def __repr__(self):
        return f"<PhongBan {self.ten_phong_ban}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ma_phong_ban': self.ma_phong_ban,
            'ten_phong_ban': self.ten_phong_ban,
            'mo_ta': self.mo_ta
        }
