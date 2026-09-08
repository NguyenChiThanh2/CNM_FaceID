from app import db
from app.models.soft_delete import SoftDeleteMixin

class PhucLoi(db.Model, SoftDeleteMixin):
    __tablename__ = 'phuc_loi'

    id = db.Column(db.Integer, primary_key=True)
    ten_phuc_loi = db.Column(db.String(255), nullable=False)
    mo_ta = db.Column(db.Text)
    gia_tri = db.Column(db.Float)
    loai = db.Column(db.String(50))

    # Quan hệ với bảng trung gian — trước đây có cascade='all, delete-orphan'
    # khiến xóa 1 PhucLoi tự động XÓA CỨNG toàn bộ lịch sử NhanVienPhucLoi liên
    # quan (không thể khôi phục). Bỏ cascade: giờ PhucLoi chỉ được xóa MỀM
    # (xem delete_phuc_loi_service), và bị chặn hẳn nếu còn nhân viên đang gắn.
    nhan_vien_phuc_lois = db.relationship(
        "NhanVienPhucLoi",
        back_populates="phuc_loi",
        lazy=True
    )

    def __repr__(self):
        return f"<PhucLoi {self.ten_phuc_loi}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ten_phuc_loi': self.ten_phuc_loi,
            'mo_ta': self.mo_ta,
            'gia_tri': self.gia_tri,
            'loai': self.loai
        }
