from app import db
from app.models.phuc_loi_model import PhucLoi
from app.models.nhan_vien_model import NhanVien

class NhanVienPhucLoi(db.Model):
    __tablename__ = 'nhan_vien_phuc_loi'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'))
    phuc_loi_id = db.Column(db.Integer, db.ForeignKey('phuc_loi.id'))
    ngay_ap_dung = db.Column(db.Date)
    ghi_chu = db.Column(db.String(200))

    # Quan hệ ngược
    nhan_vien = db.relationship("NhanVien", back_populates="phuc_lois")
    phuc_loi = db.relationship("PhucLoi", back_populates="nhan_vien_phuc_lois")

    def __repr__(self):
        return f"<NhanVienPhucLoi {self.id}>"

    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'phuc_loi_id': self.phuc_loi_id,
            'ngay_ap_dung': self.ngay_ap_dung,
            'ghi_chu': self.ghi_chu,
            'nhan_vien': self.nhan_vien.to_dict() if self.nhan_vien else None,
            'phuc_loi': self.phuc_loi.to_dict() if self.phuc_loi else None
        }
