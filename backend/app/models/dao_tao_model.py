from app import db
from app.models.dao_tao_nhan_vien_model import DaoTaoNhanVien  # nhớ import bảng trung gian

class DaoTao(db.Model):
    __tablename__ = 'dao_tao'

    id = db.Column(db.Integer, primary_key=True)
    khoa_dao_tao = db.Column(db.String(255))
    ngay_bat_dau = db.Column(db.Date)
    ngay_ket_thuc = db.Column(db.Date)

    # Quan hệ với bảng trung gian DaoTaoNhanVien
    nhan_viens = db.relationship('DaoTaoNhanVien', back_populates='dao_tao', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<DaoTao {self.id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'khoa_dao_tao': self.khoa_dao_tao,
            'ngay_bat_dau': self.ngay_bat_dau.strftime('%Y-%m-%d') if self.ngay_bat_dau else None,
            'ngay_ket_thuc': self.ngay_ket_thuc.strftime('%Y-%m-%d') if self.ngay_ket_thuc else None,
            'nhan_viens': [
                {
                    'id': dv.nhan_vien_id,
                    'ten_nhan_vien': dv.nhan_vien.ho_ten,  # Trả về tên nhân viên chi tiết
                    'ket_qua': dv.ket_qua
                } for dv in self.nhan_viens
            ]
        }
