from app import db

class DaoTaoNhanVien(db.Model):
    __tablename__ = 'dao_tao_nhan_vien'

    id = db.Column(db.Integer, primary_key=True)
    dao_tao_id = db.Column(db.Integer, db.ForeignKey('dao_tao.id'), nullable=False)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    ket_qua = db.Column(db.String(255))

    dao_tao = db.relationship('DaoTao', back_populates='nhan_viens')
    nhan_vien = db.relationship('NhanVien', back_populates='dao_taos')

    def to_dict(self):
        return {
            'id': self.id,
            'dao_tao_id': self.dao_tao_id,
            'nhan_vien_id': self.nhan_vien_id,
            'ket_qua': self.ket_qua,
           
        }

