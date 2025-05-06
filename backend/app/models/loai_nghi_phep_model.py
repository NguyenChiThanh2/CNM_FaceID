from app import db

class LoaiNghiPhep(db.Model):
    __tablename__ = 'loai_nghi_phep'
    
    id = db.Column(db.Integer, primary_key=True)
    ten = db.Column(db.String(50), nullable=False, unique=True)
    mo_ta = db.Column(db.String(200))
    co_luong = db.Column(db.Boolean, default=True)
    
    nghi_phep = db.relationship('NghiPhep', back_populates='loai_nghi_phep', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ten': self.ten,
            'mo_ta': self.mo_ta,
            'co_luong': self.co_luong
        }