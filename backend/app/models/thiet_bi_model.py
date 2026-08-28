import secrets
from datetime import datetime
from app import db


class ThietBiChamCong(db.Model):
    __tablename__ = 'thiet_bi_cham_cong'

    id = db.Column(db.Integer, primary_key=True)
    ten_thiet_bi = db.Column(db.String(100), nullable=False)
    token = db.Column(db.String(64), nullable=False, unique=True, index=True)
    active = db.Column(db.Boolean, default=True, nullable=False)
    thoi_gian_tao = db.Column(db.DateTime, default=datetime.utcnow)
    lan_su_dung_cuoi = db.Column(db.DateTime, nullable=True)

    @staticmethod
    def generate_token():
        return secrets.token_hex(32)

    def to_dict(self, include_token=False):
        data = {
            'id': self.id,
            'ten_thiet_bi': self.ten_thiet_bi,
            'active': self.active,
            'thoi_gian_tao': self.thoi_gian_tao.isoformat() if self.thoi_gian_tao else None,
            'lan_su_dung_cuoi': self.lan_su_dung_cuoi.isoformat() if self.lan_su_dung_cuoi else None,
        }
        if include_token:
            data['token'] = self.token
        return data
