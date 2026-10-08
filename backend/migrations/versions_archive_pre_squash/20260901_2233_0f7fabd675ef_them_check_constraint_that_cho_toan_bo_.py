"""them CHECK constraint that cho toan bo cot Enum

Revision ID: 0f7fabd675ef
Revises: 4777b1a70f31
Create Date: 2026-09-01 22:33:34.942714

Lý do cần migration tay: SQLAlchemy `Enum(..., create_constraint=True)` không tự
sinh ra thay đổi mà Alembic autogenerate phát hiện được (đã kiểm chứng: chạy
`flask db migrate` báo "No changes in schema detected" dù model đã đổi) — nên
phải tự viết CHECK CONSTRAINT cho từng cột.

Áp dụng cho 10 cột: 5 cột enum mới thêm (nghi_phep, giay_phep,
bang_cap_chung_chi x2, nhan_vien) + 4 cột enum có sẵn từ trước nhưng cùng lỗi
thiếu constraint (khau_tru, chi_tiet_luong, loai_nghi_phep, danh_gia x2).
"""
from alembic import op
import sqlalchemy as sa


revision = '0f7fabd675ef'
down_revision = '4777b1a70f31'
branch_labels = None
depends_on = None


CHECKS = [
    ("nghi_phep", "trang_thai_nghi_phep_enum",
     "trang_thai IN ('Chờ duyệt', 'Đã duyệt', 'Từ chối')"),
    ("giay_phep", "trang_thai_giay_phep_enum",
     "trang_thai IN ('Đang chờ', 'Đã duyệt', 'Từ chối')"),
    ("bang_cap_chung_chi", "loai_chung_chi_enum",
     "loai IN ('certificate', 'degree', 'license')"),
    ("bang_cap_chung_chi", "trang_thai_chung_chi_enum",
     "trang_thai IN ('valid', 'expired', 'revoked')"),
    ("nhan_vien", "trang_thai_nhan_vien_enum",
     "trang_thai IN ('Đang làm việc', 'Đã nghỉ việc', 'Tạm nghỉ', 'Thử việc')"),
    ("khau_tru", "loai_khau_tru_enum",
     "loai_khau_tru IN ('UNG_LUONG', 'VI_PHAM', 'TRU_KHAC')"),
    ("chi_tiet_luong", "ck_chitietluong_nhom_enum",
     "nhom IN ('KHAU_TRU', 'PHU_CAP', 'THUONG')"),
    ("loai_nghi_phep", "ck_loainghip_donvitinh_enum",
     "don_vi_tinh IN ('NGAY', 'GIO')"),
    ("danh_gia", "enum_ky_loai",
     "ky_loai IN ('MONTH', 'QUARTER', 'YEAR')"),
    ("danh_gia", "enum_phuong_thuc",
     "phuong_thuc IN ('SELF', 'MANAGER', 'PEER', '_360')"),
]


def upgrade():
    for table, name, condition in CHECKS:
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.create_check_constraint(name, condition)


def downgrade():
    for table, name, condition in reversed(CHECKS):
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_constraint(name, type_='check')
