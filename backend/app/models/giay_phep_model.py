from datetime import datetime
from sqlalchemy.orm import relationship
from app import db
from sqlalchemy.sql import func
from app.models.soft_delete import SoftDeleteMixin
from app.models.audit import AuditMixin

class GiayPhep(db.Model, SoftDeleteMixin, AuditMixin):
    __tablename__ = "giay_phep"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False, index=True)
    cham_cong_id = db.Column(db.Integer, db.ForeignKey("cham_cong.id"), nullable=False, index=True)
    ngay_bat_dau = db.Column(db.Date, nullable=False)
    ngay_ket_thuc = db.Column(db.Date, nullable=False)
    loai_giay_phep = db.Column(db.String(100), nullable=False)  # VD: "Nghỉ ốm", "Nghỉ việc riêng", "Nghỉ thai sản", "Tăng ca", "Quên chấm công"
    ly_do = db.Column(db.Text, nullable=True)
    so_gio = db.Column(db.Integer, nullable=False)  # Số giờ tăng ca

    trang_thai = db.Column(
        db.Enum('Đang chờ', 'Đã duyệt', 'Từ chối', name='trang_thai_giay_phep_enum', create_constraint=True),
        nullable=False, default="Đang chờ"
    )
    nguoi_duyet_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=True, index=True)
    ngay_duyet = db.Column(db.DateTime, nullable=True)
    ly_do_tu_choi = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime,server_default=func.now())
    updated_at = db.Column(db.DateTime, server_default=func.now(), onupdate=func.now())

    giayphep_nv = relationship("NhanVien", foreign_keys=[nhan_vien_id], back_populates="giayphep_nv")
    nguoi_duyet = relationship("NhanVien", foreign_keys=[nguoi_duyet_id],back_populates="giayphep_nguoi_duyet")
    giayphep_cc = relationship("ChamCong", back_populates="giayphep_cc", lazy=True)
    
    def __repr__(self):
        return f"<GiayPhep id={self.id} nv={self.nhan_vien_id} loai={self.loai_giay_phep}>"
    
    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'ho_ten': self.giayphep_nv.ho_ten if self.giayphep_nv else None,
            'cham_cong_id': self.cham_cong_id,
            'ngay_bat_dau': self.ngay_bat_dau.isoformat(),
            'ngay_ket_thuc': self.ngay_ket_thuc.isoformat(),
            'loai_giay_phep': self.loai_giay_phep if self.loai_giay_phep else None,
            'ly_do': self.ly_do,
            'so_gio': self.so_gio,
            'trang_thai': self.trang_thai,
            'nguoi_duyet_id': self.nguoi_duyet_id,
            'ngay_duyet': self.ngay_duyet,
            'ly_do_tu_choi': self.ly_do_tu_choi,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }