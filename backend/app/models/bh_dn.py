from app import db
from sqlalchemy import extract, func

class BaoHiemDoanhNghiep(db.Model):
    __tablename__ = 'bh_dn'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thang = db.Column(db.Integer, nullable=False)
    nam = db.Column(db.Integer, nullable=False)
    bhxh_dn = db.Column(db.Float, default=0.0)
    bhyt_dn = db.Column(db.Float, default=0.0)
    bhtn_dn = db.Column(db.Float, default=0.0)
    tong_bh_dn = db.Column(db.Float, default=0.0)
    ghi_chu = db.Column(db.String(255))
    
    # Foreign key relationships
    nhan_vien = db.relationship('NhanVien', back_populates='bao_hiem_doanh_nghiep', lazy=True)
    
    # Indexes for better performance
    __table_args__ = (
        db.Index('idx_bh_dn_nhan_vien', 'nhan_vien_id'),
        db.Index('idx_bh_dn_thang_nam', 'thang', 'nam'),
        db.Index('idx_bh_dn_nam', 'nam'),
    )
    
    def __init__(self, nhan_vien_id=None, thang=None, nam=None, 
                 bhxh_dn=0.0, bhyt_dn=0.0, bhtn_dn=0.0, ghi_chu=None):
        self.nhan_vien_id = nhan_vien_id
        self.thang = thang
        self.nam = nam
        self.bhxh_dn = bhxh_dn
        self.bhyt_dn = bhyt_dn
        self.bhtn_dn = bhtn_dn
        self.tong_bh_dn = bhxh_dn + bhyt_dn + bhtn_dn
        self.ghi_chu = ghi_chu
    
    def to_dict_with_nhan_vien(self):
        """Chuyển đổi object thành dictionary kèm thông tin nhân viên"""
        nhan_vien_info = {}
        if self.nhan_vien:
            nhan_vien_info = {
                "ho_ten": self.nhan_vien.ho_ten,
                "ma_nhan_vien": self.nhan_vien.ma_nhan_vien,
                "phong_ban": self.nhan_vien.phong_ban.ten_phong_ban if self.nhan_vien.phong_ban else None,
                "chuc_vu": self.nhan_vien.chuc_vu.ten_chuc_vu if self.nhan_vien.chuc_vu else None
            }
        
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "thang": self.thang,
            "nam": self.nam,
            "bhxh_dn": self.bhxh_dn,
            "bhyt_dn": self.bhyt_dn,
            "bhtn_dn": self.bhtn_dn,
            "tong_bh_dn": self.tong_bh_dn,
            "ghi_chu": self.ghi_chu,
            "nhan_vien": nhan_vien_info
        }
    
    
    def __repr__(self):
        return f'<BaoHiemDoanhNghiep {self.id}: NV{self.nhan_vien_id} - {self.thang}/{self.nam}>'

        
    def to_dict(self):
        """Chuyển đổi object thành dictionary"""
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "thang": self.thang,
            "nam": self.nam,
            "bhxh_dn": self.bhxh_dn,
            "bhyt_dn": self.bhyt_dn,
            "bhtn_dn": self.bhtn_dn,
            "tong_bh_dn": self.tong_bh_dn,
            "ghi_chu": self.ghi_chu
        }