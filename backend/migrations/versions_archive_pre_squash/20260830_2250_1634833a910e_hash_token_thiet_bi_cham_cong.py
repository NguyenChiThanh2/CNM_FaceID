"""hash token thiet bi cham cong

Revision ID: 1634833a910e
Revises: 1b5038b58242
Create Date: 2026-08-30 22:50:44.156496

"""
import hashlib
from alembic import op
import sqlalchemy as sa


revision = '1634833a910e'
down_revision = '1b5038b58242'
branch_labels = None
depends_on = None


def upgrade():
    # Chỉ giữ đúng thay đổi cho thiet_bi_cham_cong — bỏ toàn bộ lệch schema cũ
    # (danh_gia, dao_tao, giay_phep, hopdong_laodong, nhan_vien, quyche_congty)
    # mà Alembic tự phát hiện thêm.

    # Bước 1: thêm cột mới, TẠM để nullable vì cần backfill dữ liệu cũ trước
    with op.batch_alter_table('thiet_bi_cham_cong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('token_hash', sa.String(length=64), nullable=True))

    # Bước 2: hash token thô hiện có (dữ liệu thật) thành token_hash
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, token FROM thiet_bi_cham_cong")).fetchall()
    for row in rows:
        token_hash = hashlib.sha256(row.token.encode("utf-8")).hexdigest()
        conn.execute(
            sa.text("UPDATE thiet_bi_cham_cong SET token_hash = :h WHERE id = :i"),
            {"h": token_hash, "i": row.id},
        )

    # Bước 3: bắt buộc NOT NULL + đổi index + xóa cột token thô
    with op.batch_alter_table('thiet_bi_cham_cong', schema=None) as batch_op:
        batch_op.alter_column('token_hash', existing_type=sa.String(length=64), nullable=False)
        batch_op.drop_index(batch_op.f('ix_thiet_bi_cham_cong_token'))
        batch_op.create_index(batch_op.f('ix_thiet_bi_cham_cong_token_hash'), ['token_hash'], unique=True)
        batch_op.drop_column('token')


def downgrade():
    # Downgrade không phục hồi được token thô (đã hash một chiều, không thể đảo
    # ngược) — chỉ đưa lại cột token rỗng để không phá schema, thiết bị cũ sẽ
    # cần đăng ký lại token mới nếu thực sự phải downgrade.
    with op.batch_alter_table('thiet_bi_cham_cong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('token', sa.String(length=64), nullable=True))
        batch_op.drop_index(batch_op.f('ix_thiet_bi_cham_cong_token_hash'))
        batch_op.drop_column('token_hash')
