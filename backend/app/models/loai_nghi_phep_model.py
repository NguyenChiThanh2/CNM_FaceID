from app import db
import enum

class DonViTinh(enum.Enum):
    NGAY = "NGAY"  # loại tính theo ngày (nghỉ nhiều ngày: phép năm, ốm, thai sản...)
    GIO = "GIO"    # loại tính theo giờ, luôn gắn với 1 bản ghi chấm công cụ thể (tăng ca, quên chấm công...)

class LoaiNghiPhep(db.Model):
    __tablename__ = 'loai_nghi_phep'

    id = db.Column(db.Integer, primary_key=True)
    ten = db.Column(db.String(50), nullable=False, unique=True)
    mo_ta = db.Column(db.String(200))
    co_luong = db.Column(db.Boolean, default=True)
    don_vi_tinh = db.Column(db.Enum(DonViTinh, create_constraint=True), nullable=False, default=DonViTinh.NGAY)
    yeu_cau_cham_cong = db.Column(db.Boolean, nullable=False, default=False)
    yeu_cau_thong_tin_sinh = db.Column(db.Boolean, nullable=False, default=False)  # bật cho loại "nghỉ thai sản"

    nghi_phep = db.relationship('NghiPhep', back_populates='loai_nghi_phep', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'ten': self.ten,
            'mo_ta': self.mo_ta,
            'co_luong': self.co_luong,
            'don_vi_tinh': self.don_vi_tinh.value if self.don_vi_tinh else None,
            'yeu_cau_cham_cong': self.yeu_cau_cham_cong,
            'yeu_cau_thong_tin_sinh': self.yeu_cau_thong_tin_sinh,
        }
