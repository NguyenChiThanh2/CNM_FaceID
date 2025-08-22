from app import db

class ChucVu(db.Model):
    __tablename__ = 'chuc_vu'

    id = db.Column(db.Integer, primary_key=True)
    ma_chuc_vu = db.Column(db.Integer, unique=True)
    ten_chuc_vu = db.Column(db.String(255), nullable=False)
    mo_ta = db.Column(db.String(255), nullable=False)

    # Quan hệ với bảng NhanVien
    chuc_vu_nv = db.relationship('NhanVien', back_populates='chuc_vu_nv', lazy=True)

    def __repr__(self):
        return f"<ChucVu {self.ten_chuc_vu}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ma_chuc_vu': self.ma_chuc_vu,
            'ten_chuc_vu': self.ten_chuc_vu,
            'mo_ta': self.mo_ta
        }
