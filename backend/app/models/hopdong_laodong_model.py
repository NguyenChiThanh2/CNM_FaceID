from datetime import datetime
from app import db
from app.models.soft_delete import SoftDeleteMixin
from app.models.audit import AuditMixin

class HopDongLaoDong(db.Model, SoftDeleteMixin, AuditMixin):
    __tablename__ = "hopdong_laodong"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False, index=True)
    quyche_id = db.Column(db.Integer, db.ForeignKey('quyche_congty.id'), nullable=True, index=True)

    ngay_bat_dau = db.Column(db.Date, nullable=False)
    ngay_ket_thuc = db.Column(db.Date, nullable=True)
    # 🆕 Thêm trường thời gian hợp đồng (ví dụ: 6 tháng, 12 tháng, Không thời hạn)
    thoi_gian_hop_dong = db.Column(db.String(50), nullable=True)

    loai_hop_dong = db.Column(db.String(50), nullable=False)
    muc_luong_co_ban = db.Column(db.Float, nullable=False)

    di_tre_phat = db.Column(db.Float, nullable=True)
    ve_som_phat = db.Column(db.Float, nullable=True)
    tang_ca_heso = db.Column(db.Float, nullable=True)
    luong_ngay_le_heso = db.Column(db.Float, nullable=True)
    luong_cuoi_tuan_heso = db.Column(db.Float, nullable=True)

    phu_cap_an_trua = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_xang_xe = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_doc_hai = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_trach_nhiem = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_chuc_vu = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_tham_nien = db.Column(db.Float, nullable=True, default=0.0)

    dieu_khoan_khac = db.Column(db.JSON, nullable=True)
    phep_nam = db.Column(db.Integer, nullable=True, default=0)
    trang_thai = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hopdong_nv = db.relationship("NhanVien", foreign_keys=[nhan_vien_id], back_populates="hopdong_nv", lazy=True)
    hopdong_quyche = db.relationship("QuyCheCongTy", back_populates="hopdong_quyche", lazy=True)

    def __repr__(self):
        return f"<HopDongLaoDong id={self.id} nv={self.nhan_vien_id} thoi_gian={self.thoi_gian_hop_dong}>"

    def to_dict(self):
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "quyche_id": self.quyche_id,
            "ngay_bat_dau": self.ngay_bat_dau.isoformat() if self.ngay_bat_dau else None,
            "ngay_ket_thuc": self.ngay_ket_thuc.isoformat() if self.ngay_ket_thuc else None,
            "thoi_gian_hop_dong": self.thoi_gian_hop_dong,  # 👈 thêm ở đây
            "loai_hop_dong": self.loai_hop_dong,
            "muc_luong_co_ban": self.muc_luong_co_ban,
            "di_tre_phat": self.di_tre_phat,
            "ve_som_phat": self.ve_som_phat,
            "tang_ca_heso": self.tang_ca_heso,
            "luong_ngay_le_heso": self.luong_ngay_le_heso,
            "luong_cuoi_tuan_heso": self.luong_cuoi_tuan_heso,
            "phu_cap_an_trua": self.phu_cap_an_trua,
            "phu_cap_xang_xe": self.phu_cap_xang_xe,
            "phu_cap_doc_hai": self.phu_cap_doc_hai,
            "phu_cap_trach_nhiem": self.phu_cap_trach_nhiem,
            "phu_cap_chuc_vu": self.phu_cap_chuc_vu,
            "phu_cap_tham_nien": self.phu_cap_tham_nien,
            "dieu_khoan_khac": self.dieu_khoan_khac,
            "phep_nam": self.phep_nam,
            "trang_thai": self.trang_thai,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
