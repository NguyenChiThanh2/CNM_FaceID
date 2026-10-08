# app/models/vai_tro_model.py
from app import db
from app.models.vai_tro_quyen_model import vai_tro_quyen


class VaiTro(db.Model):
    __tablename__ = 'vai_tro'

    id = db.Column(db.Integer, primary_key=True)
    ten_vai_tro = db.Column(db.String(100), nullable=False, unique=True)
    mo_ta = db.Column(db.String(255))

    quyen_list = db.relationship(
        'Quyen', secondary=vai_tro_quyen, back_populates='vai_tro_list', lazy=True
    )
    nhan_vien_list = db.relationship('NhanVien', back_populates='vai_tro', lazy=True)

    def to_dict(self, with_quyen=False):
        data = {
            'id': self.id,
            'ten_vai_tro': self.ten_vai_tro,
            'mo_ta': self.mo_ta,
        }
        if with_quyen:
            data['ma_quyen_list'] = [q.ma_quyen for q in self.quyen_list]
        return data
