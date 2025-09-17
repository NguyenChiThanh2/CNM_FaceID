from datetime import datetime
from sqlalchemy.orm import relationship
from app import db


class HopDongLaoDong(db.Model):
    __tablename__ = "hopdong_laodong"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False)
    quyche_id = db.Column(db.Integer, db.ForeignKey('quyche_congty.id'), nullable=True)

    ngay_bat_dau = db.Column(db.Date, nullable=False)
    ngay_ket_thuc = db.Column(db.Date, nullable=True)
    loai_hop_dong = db.Column(db.String(50), nullable=False)  # VD: "Xác định thời hạn", "Không xác định thời hạn"
    muc_luong_co_ban = db.Column(db.Float, nullable=False)

    # Nếu null → dùng quy định chung của công ty
    di_tre_phat = db.Column(db.Float, nullable=True)  # phạt VNĐ/phút
    ve_som_phat = db.Column(db.Float, nullable=True)  # phạt VNĐ/phút
    tang_ca_heso = db.Column(db.Float, nullable=True)  # hệ số trả lương OT mặc định (>= 1.5)
    luong_ngay_le_heso = db.Column(db.Float, nullable=True)  # hệ số trả lương ngày lễ
    luong_cuoi_tuan_heso = db.Column(db.Float, nullable=True)  # hệ số trả lương cuối tuần

    phu_cap_an_trua = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_xang_xe = db.Column(db.Float, nullable=True, default=0.0)
    
    phu_cap_doc_hai = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_trach_nhiem = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_chuc_vu = db.Column(db.Float, nullable=True, default=0.0)
    phu_cap_tham_nien = db.Column(db.Float, nullable=True, default=0.0)

    dieu_khoan_khac = db.Column(db.JSON, nullable=True)  # cho phép lưu rule đặc biệt (JSON)
    trang_thai = db.Column(db.Boolean, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hopdong_nv = db.relationship("NhanVien", back_populates="hopdong_nv", lazy=True)
    hopdong_quyche = db.relationship("QuyCheCongTy", back_populates="hopdong_quyche", lazy=True)

    def __repr__(self):
        return f"<HopDongLaoDong id={self.id} nv={self.nhanvien_id} luong={self.muc_luong_co_ban}>"
