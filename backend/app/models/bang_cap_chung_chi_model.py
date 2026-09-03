# app/models/bang_cap_chung_chi_model.py
from app import db
from datetime import date
from app.models.soft_delete import SoftDeleteMixin
from app.models.audit import AuditMixin

class BangCapChungChi(db.Model, SoftDeleteMixin, AuditMixin):
    __tablename__ = "bang_cap_chung_chi"

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False, index=True)

    # thông tin cốt lõi
    loai = db.Column(
        db.Enum('certificate', 'degree', 'license', name='loai_chung_chi_enum', create_constraint=True),
        nullable=False
    )
    ten = db.Column(db.String(255), nullable=False)  # "ĐH CNTT", "AWS CCP", "IELTS 7.0" ...
    so_hieu = db.Column(db.String(100))              # mã/serial nếu có
    to_chuc_cap = db.Column(db.String(255))          # trường/đơn vị cấp
    ngay_cap = db.Column(db.Date)
    ngay_het_han = db.Column(db.Date)                # với chứng chỉ có hạn
    xep_loai = db.Column(db.String(50))              # Giỏi/Khá/Distinction...
    diem_so = db.Column(db.String(50))               # 8.5/7.0/…
    ghi_chu = db.Column(db.Text)

    # file đính kèm (lưu path hoặc URL)
    tep_dinh_kem = db.Column(db.String(255))         # ví dụ: 'uploads/certificates/abc.pdf'
    credential_id = db.Column(db.String(120))        # ID tra cứu (nếu có)
    credential_url = db.Column(db.String(255))       # URL verify (nếu có)

    # trạng thái
    trang_thai = db.Column(
        db.Enum('valid', 'expired', 'revoked', name='trang_thai_chung_chi_enum', create_constraint=True),
        default="valid"
    )

    # quan hệ ngược lên NhanVien
    nhan_vien = db.relationship("NhanVien", foreign_keys=[nhan_vien_id], back_populates="chung_chi_list", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "loai": self.loai,
            "ten": self.ten,
            "so_hieu": self.so_hieu,
            "to_chuc_cap": self.to_chuc_cap,
            "ngay_cap": self.ngay_cap.isoformat() if self.ngay_cap else None,
            "ngay_het_han": self.ngay_het_han.isoformat() if self.ngay_het_han else None,
            "xep_loai": self.xep_loai,
            "diem_so": self.diem_so,
            "ghi_chu": self.ghi_chu,
            "tep_dinh_kem": self.tep_dinh_kem,
            "credential_id": self.credential_id,
            "credential_url": self.credential_url,
            "trang_thai": self.trang_thai,
        }
