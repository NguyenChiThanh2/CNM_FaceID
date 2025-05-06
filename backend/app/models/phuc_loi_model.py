from app import db

class PhucLoi(db.Model):
    __tablename__ = 'phuc_loi'

    id = db.Column(db.Integer, primary_key=True)
    ten_phuc_loi = db.Column(db.String(255), nullable=False)
    mo_ta = db.Column(db.Text)
    gia_tri = db.Column(db.Float)
    loai = db.Column(db.String(50))

    # Quan hệ với bảng trung gian
    nhan_vien_phuc_lois = db.relationship(
        "NhanVienPhucLoi",
        back_populates="phuc_loi",
        cascade='all, delete-orphan',
        lazy=True
    )

    def __repr__(self):
        return f"<PhucLoi {self.ten_phuc_loi}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ten_phuc_loi': self.ten_phuc_loi,
            'mo_ta': self.mo_ta,
            'gia_tri': self.gia_tri,
            'loai': self.loai
        }
