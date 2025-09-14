from datetime import datetime

from app import db


class QuyCheCongTy(db.Model):
    __tablename__ = "quyche_congty"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ten_quyche = db.Column(db.String(255), nullable=False, default="Quy chế công ty")

    # Chính sách tổng quát
    di_tre_phat = db.Column(db.Float, nullable=False, default=0.0)     # VNĐ/phút
    ve_som_phat = db.Column(db.Float, nullable=False, default=0.0)     # VNĐ/phút
    tang_ca_heso = db.Column(db.Float, nullable=False, default=1.5)    # OT mặc định
    luong_ngay_le_heso = db.Column(db.Float, nullable=False, default=2.0)
    luong_cuoi_tuan_heso = db.Column(db.Float, nullable=False, default=1.5)

    phu_cap_an_trua = db.Column(db.Float, nullable=False, default=0.0)
    phu_cap_xang_xe = db.Column(db.Float, nullable=True, default=0.0)
    
    phu_cap_doc_hai = db.Column(db.Float, nullable=False, default=0.0)
    phu_cap_trach_nhiem = db.Column(db.Float, nullable=False, default=0.0)
    phu_cap_chuc_vu = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_tham_nien = db.Column(db.Float, nullable=True, default=0.0)

    quy_dinh_khac = db.Column(db.JSON, nullable=True)  # lưu rule mở rộng
    trang_thai = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hopdong_quyche = db.relationship("HopDongLaoDong", back_populates="hopdong_quyche", lazy=True)
    def __repr__(self):
        return f"<QuyCheCongTy id={self.id} ten={self.ten_quyche}>"
