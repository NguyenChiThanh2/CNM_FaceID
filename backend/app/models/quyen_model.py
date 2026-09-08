# app/models/quyen_model.py
from app import db
from app.models.vai_tro_quyen_model import vai_tro_quyen


class Quyen(db.Model):
    __tablename__ = 'quyen'

    id = db.Column(db.Integer, primary_key=True)
    # ma_quyen dạng "<module>.<hanh_dong>", vd "luong.xem" — đây là "khóa" thật
    # sự được code dùng để kiểm tra (permission_required("luong.xem")), còn
    # module/hanh_dong tách riêng chỉ để FE nhóm hiển thị checklist theo module.
    ma_quyen = db.Column(db.String(100), nullable=False, unique=True)
    module = db.Column(db.String(50), nullable=False)
    hanh_dong = db.Column(
        db.Enum('xem', 'them', 'sua', 'xoa', name='hanh_dong_quyen_enum', create_constraint=True),
        nullable=False,
    )
    mo_ta = db.Column(db.String(255))

    vai_tro_list = db.relationship(
        'VaiTro', secondary=vai_tro_quyen, back_populates='quyen_list', lazy=True
    )

    def to_dict(self):
        return {
            'id': self.id,
            'ma_quyen': self.ma_quyen,
            'module': self.module,
            'hanh_dong': self.hanh_dong,
            'mo_ta': self.mo_ta,
        }
