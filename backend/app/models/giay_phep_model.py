from datetime import datetime
from sqlalchemy.orm import relationship
from app import db

class GiayPhep(db.Model):
    __tablename__ = "giay_phep"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False)
    cham_cong_id = db.Column(db.Integer, db.ForeignKey("cham_cong.id"), nullable=False)
    ngay_bat_dau = db.Column(db.Date, nullable=False)
    ngay_ket_thuc = db.Column(db.Date, nullable=False)
    loai_giay_phep = db.Column(db.String(100), nullable=False)  # VD: "Nghỉ ốm", "Nghỉ việc riêng", "Nghỉ thai sản"
    ly_do = db.Column(db.Text, nullable=True)
    so_gio = db.Column(db.Integer, nullable=False)  # Số giờ tăng ca

    trang_thai = db.Column(db.String(50), nullable=False, default="Đang chờ")  # VD: "Đang chờ", "Đã duyệt", "Từ chối"
    nguoi_duyet_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=True)
    ngay_duyet = db.Column(db.DateTime, nullable=True)
    ly_do_tu_choi = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    giayphep_nv = relationship("NhanVien", foreign_keys=[nhan_vien_id], back_populates="giayphep_nv", lazy=True)
    giayphep_nguoi_duyet = relationship("NhanVien", foreign_keys=[nguoi_duyet_id], lazy=True)
    giayphep_cc = relationship("ChamCong", back_populates="giayphep_cc", lazy=True)
    
    def __repr__(self):
        return f"<GiayPhep id={self.id} nv={self.nhan_vien_id} loai={self.loai_giay_phep}>"