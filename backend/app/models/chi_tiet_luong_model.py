from app import db
from datetime import datetime
import enum

# Định nghĩa Enum cho nhóm (giúp code gọn, tránh sai chính tả)
class NhomChiTietLuong(enum.Enum):
    KHAU_TRU = "KHAU_TRU"
    PHU_CAP = "PHU_CAP"
    THUONG = "THUONG"

class ChiTietLuong(db.Model):
    __tablename__ = 'chi_tiet_luong'

    id = db.Column(db.Integer, primary_key=True)
    bang_luong_id = db.Column(db.Integer, db.ForeignKey("bang_luong.id"), nullable=False)
    nhom = db.Column(db.Enum(NhomChiTietLuong), nullable=False)
    loai = db.Column(db.String(100), nullable=False)  # VD: DI_TRE, XANG_XE, LE_TET
    so_tien = db.Column(db.Float, nullable=False)
    ghi_chu = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    chi_tiet_luong_bang_luong = db.relationship('BangLuong', back_populates='chi_tiet_luong_bang_luong', lazy=True)

    def __repr__(self):
        return f"<ChiTietLuong bang_luong_id={self.bang_luong_id} nhom={self.nhom.value} loai={self.loai} so_tien={self.so_tien}>"

    def to_dict(self):
        return {
            "id": self.id,
            "bang_luong_id": self.bang_luong_id,
            "nhom": self.nhom,
            "loai": self.loai,
            "so_tien": self.so_tien,
            "ghi_chu": self.ghi_chu,
            "created_at": self.created_at,
        }
    
