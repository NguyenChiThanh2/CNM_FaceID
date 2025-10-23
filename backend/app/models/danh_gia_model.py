# app/models/danh_gia_model.py
from app import db
from datetime import datetime, date
from sqlalchemy import UniqueConstraint, CheckConstraint, Enum as SAEnum, event
from sqlalchemy.ext.hybrid import hybrid_property
from urllib.parse import urlparse

# ===== Helpers =====
def _is_http_url(s: str) -> bool:
    if not s or not isinstance(s, str):
        return False
    try:
        p = urlparse(s.strip())
        return p.scheme in ("http", "https") and bool(p.netloc)
    except Exception:
        return False

def _has_ref(s: str) -> bool:
    """
    Hợp lệ nếu:
      - URL http/https, hoặc
      - là chuỗi không rỗng (coi như file path)
    """
    if not s:
        return False
    s = s.strip()
    return bool(s)  # cho phép cả URL và đường dẫn file nội bộ

# Gợi ý dùng hằng số trọng số mặc định
DEFAULT_WEIGHTS = {
    "chuyen_can": 0.20,  # 20%
    "hieu_qua":   0.30,  # 30%
    "ky_nang":    0.25,  # 25%
    "thai_do":    0.15,  # 15%
    "chu_dong":   0.10,  # 10%
}

class DanhGia(db.Model):
    __tablename__ = "danh_gia"

    id = db.Column(db.Integer, primary_key=True)

    # Liên kết nhân viên được đánh giá và người chấm
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False)
    nguoi_danh_gia_id = db.Column(db.Integer, db.ForeignKey("nhan_vien.id"), nullable=False)

    # Kỳ đánh giá
    ky_ngay = db.Column(db.Date, nullable=False, default=lambda: date(date.today().year, date.today().month, 1))
    ky_loai = db.Column(
        SAEnum("MONTH", "QUARTER", "YEAR", name="enum_ky_loai"),
        nullable=False,
        default="MONTH",
    )

    # 5 tiêu chí điểm (0–10)
    diem_chuyen_can = db.Column(db.Float)   # chuyên cần & kỷ luật
    diem_hieu_qua   = db.Column(db.Float)   # hiệu quả & chất lượng công việc
    diem_ky_nang    = db.Column(db.Float)   # năng lực/chuyên môn
    diem_thai_do    = db.Column(db.Float)   # thái độ & hợp tác
    diem_chu_dong   = db.Column(db.Float)   # chủ động & phát triển bản thân

    # Trọng số
    w_chuyen_can = db.Column(db.Float, nullable=False, default=DEFAULT_WEIGHTS["chuyen_can"])
    w_hieu_qua   = db.Column(db.Float, nullable=False, default=DEFAULT_WEIGHTS["hieu_qua"])
    w_ky_nang    = db.Column(db.Float, nullable=False, default=DEFAULT_WEIGHTS["ky_nang"])
    w_thai_do    = db.Column(db.Float, nullable=False, default=DEFAULT_WEIGHTS["thai_do"])
    w_chu_dong   = db.Column(db.Float, nullable=False, default=DEFAULT_WEIGHTS["chu_dong"])

    # Nhận xét
    nhan_xet = db.Column(db.Text)

    # ===== Minh chứng: 5 cột, mỗi cột là 1 đường dẫn (URL hoặc file path) =====
    mc_chuyen_can_ref = db.Column(db.String(512), nullable=True)
    mc_hieu_qua_ref   = db.Column(db.String(512), nullable=True)
    mc_ky_nang_ref    = db.Column(db.String(512), nullable=True)
    mc_thai_do_ref    = db.Column(db.String(512), nullable=True)
    mc_chu_dong_ref   = db.Column(db.String(512), nullable=True)

    # Phương thức & trạng thái (giữ nguyên theo file bạn đang dùng)
    phuong_thuc = db.Column(
        SAEnum("SELF", "MANAGER", "PEER", "_360", name="enum_phuong_thuc"),
        nullable=False,
        default="MANAGER",
    )
    # Dấu thời gian
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("nhan_vien_id", "ky_ngay", "ky_loai", name="uq_danhgia_nv_ky"),
        CheckConstraint(
            "(w_chuyen_can + w_hieu_qua + w_ky_nang + w_thai_do + w_chu_dong) BETWEEN 0.999 AND 1.001",
            name="ck_danhgia_weights_sum",
        ),
        CheckConstraint(
            "(diem_chuyen_can IS NULL OR (diem_chuyen_can BETWEEN 0 AND 10)) AND "
            "(diem_hieu_qua   IS NULL OR (diem_hieu_qua   BETWEEN 0 AND 10)) AND "
            "(diem_ky_nang    IS NULL OR (diem_ky_nang    BETWEEN 0 AND 10)) AND "
            "(diem_thai_do    IS NULL OR (diem_thai_do    BETWEEN 0 AND 10)) AND "
            "(diem_chu_dong   IS NULL OR (diem_chu_dong   BETWEEN 0 AND 10))",
            name="ck_danhgia_scores_range",
        ),
    )

    # Quan hệ
    nhan_vien = db.relationship("NhanVien", foreign_keys=[nhan_vien_id], back_populates="danh_gias_nhan")
    nguoi_danh_gia = db.relationship("NhanVien", foreign_keys=[nguoi_danh_gia_id], back_populates="danh_gias_danh")

    # Tổng điểm có trọng số
    @hybrid_property
    def tong_diem(self):
        def v(x):  # cho phép None => 0
            return float(x) if x is not None else 0.0
        return (
            v(self.diem_chuyen_can) * self.w_chuyen_can +
            v(self.diem_hieu_qua)   * self.w_hieu_qua +
            v(self.diem_ky_nang)    * self.w_ky_nang +
            v(self.diem_thai_do)    * self.w_thai_do +
            v(self.diem_chu_dong)   * self.w_chu_dong
        )

    @hybrid_property
    def xep_loai(self):
        d = self.tong_diem
        if d >= 9.0:   return "A"  # Xuất sắc
        if d >= 8.0:   return "B"  # Tốt
        if d >= 6.5:   return "C"  # Đạt
        return "D"               # Chưa đạt

    def __repr__(self):
        return f"<DanhGia id={self.id} nv={self.nhan_vien_id} ky={self.ky_loai}:{self.ky_ngay}>"

    def to_dict(self):
        return {
            "id": self.id,
            "nhan_vien_id": self.nhan_vien_id,
            "nhan_vien": {
                "id": self.nhan_vien.id,
                "ho_ten": getattr(self.nhan_vien, "ho_ten", None),
            } if self.nhan_vien else None,

            "nguoi_danh_gia_id": self.nguoi_danh_gia_id,
            "nguoi_danh_gia": {
                "id": self.nguoi_danh_gia.id,
                "ho_ten": getattr(self.nguoi_danh_gia, "ho_ten", None),
            } if self.nguoi_danh_gia else None,

            "ky_ngay": self.ky_ngay.isoformat() if self.ky_ngay else None,
            "ky_loai": self.ky_loai,

            "diem_chuyen_can": self.diem_chuyen_can,
            "diem_hieu_qua": self.diem_hieu_qua,
            "diem_ky_nang": self.diem_ky_nang,
            "diem_thai_do": self.diem_thai_do,
            "diem_chu_dong": self.diem_chu_dong,

            "w_chuyen_can": self.w_chuyen_can,
            "w_hieu_qua": self.w_hieu_qua,
            "w_ky_nang": self.w_ky_nang,
            "w_thai_do": self.w_thai_do,
            "w_chu_dong": self.w_chu_dong,

            "tong_diem": round(self.tong_diem, 2),
            "xep_loai": self.xep_loai,

            "nhan_xet": self.nhan_xet,

            # Minh chứng per-criteria (1 field / tiêu chí)
            "minh_chung": {
                "chuyen_can": self.mc_chuyen_can_ref,
                "hieu_qua":   self.mc_hieu_qua_ref,
                "ky_nang":    self.mc_ky_nang_ref,
                "thai_do":    self.mc_thai_do_ref,
                "chu_dong":   self.mc_chu_dong_ref,
            },

            "phuong_thuc": self.phuong_thuc,

            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    # ===== ALWAYS-ON VALIDATION: yêu cầu đủ 5 đường dẫn minh chứng =====
    @staticmethod
    def _validate_evidence(target: "DanhGia"):
        fields = {
            "chuyen_can": target.mc_chuyen_can_ref,
            "hieu_qua":   target.mc_hieu_qua_ref,
            "ky_nang":    target.mc_ky_nang_ref,
            "thai_do":    target.mc_thai_do_ref,
            "chu_dong":   target.mc_chu_dong_ref,
        }
        missing = [k for k, v in fields.items() if not _has_ref(v)]
        if missing:
            raise ValueError("Thiếu minh chứng cho các tiêu chí: " + ", ".join(missing) +
                             ". Mỗi tiêu chí cần 1 đường dẫn URL hoặc file path.")

# Gắn events để validate trước khi ghi DB
@event.listens_for(DanhGia, "before_insert")
def _danhgia_before_insert(mapper, connection, target):
    DanhGia._validate_evidence(target)

@event.listens_for(DanhGia, "before_update")
def _danhgia_before_update(mapper, connection, target):
    DanhGia._validate_evidence(target)
