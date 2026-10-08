"""them yeu_cau_thong_tin_sinh vao loai_nghi_phep

Revision ID: 1b5038b58242
Revises: 3a7c7a16989a
Create Date: 2026-08-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '1b5038b58242'
down_revision = '3a7c7a16989a'
branch_labels = None
depends_on = None


def upgrade():
    # Chỉ giữ đúng thay đổi cố ý — bỏ toàn bộ lệch schema cũ (danh_gia, giay_phep,
    # hopdong_laodong, nhan_vien, quyche_congty) mà Alembic tự phát hiện thêm.
    with op.batch_alter_table('loai_nghi_phep', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'yeu_cau_thong_tin_sinh', sa.Boolean(),
            nullable=False, server_default=sa.text('0')
        ))

    # Backfill: đánh dấu đúng dòng "Nghỉ thai sản" đã có sẵn (không hardcode ID,
    # tìm theo tên để đúng ngay cả khi thứ tự ID khác nhau giữa các môi trường).
    op.execute("UPDATE loai_nghi_phep SET yeu_cau_thong_tin_sinh = 1 WHERE ten = 'Nghỉ thai sản'")


def downgrade():
    with op.batch_alter_table('loai_nghi_phep', schema=None) as batch_op:
        batch_op.drop_column('yeu_cau_thong_tin_sinh')
