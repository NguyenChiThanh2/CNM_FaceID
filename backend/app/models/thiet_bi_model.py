import hashlib
import secrets
from datetime import datetime
from app import db


class ThietBiChamCong(db.Model):
    __tablename__ = 'thiet_bi_cham_cong'

    id = db.Column(db.Integer, primary_key=True)
    ten_thiet_bi = db.Column(db.String(100), nullable=False)
    # Chỉ lưu HASH của token, không lưu token gốc — cùng nguyên tắc với
    # NhanVien.password (hash, không lưu bản rõ). SHA-256 là đủ ở đây (không cần
    # bcrypt/scrypt chậm như mật khẩu) vì token là chuỗi ngẫu nhiên 256-bit do
    # server tự sinh, không phải chuỗi người dùng tự đặt nên không có nguy cơ
    # bị đoán/brute-force theo từ điển.
    token_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)
    active = db.Column(db.Boolean, default=True, nullable=False)
    thoi_gian_tao = db.Column(db.DateTime, default=datetime.utcnow)
    lan_su_dung_cuoi = db.Column(db.DateTime, nullable=True)

    @staticmethod
    def generate_token():
        return secrets.token_hex(32)

    @staticmethod
    def hash_token(raw_token):
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    def to_dict(self):
        return {
            'id': self.id,
            'ten_thiet_bi': self.ten_thiet_bi,
            'active': self.active,
            'thoi_gian_tao': self.thoi_gian_tao.isoformat() if self.thoi_gian_tao else None,
            'lan_su_dung_cuoi': self.lan_su_dung_cuoi.isoformat() if self.lan_su_dung_cuoi else None,
        }
