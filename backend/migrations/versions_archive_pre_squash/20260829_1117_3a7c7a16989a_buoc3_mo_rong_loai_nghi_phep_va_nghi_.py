"""buoc3 - mo rong loai_nghi_phep va nghi_phep de hop nhat giay_phep

Revision ID: 3a7c7a16989a
Revises: 69e14ffde857
Create Date: 2026-08-29 11:17:17.401208

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3a7c7a16989a'
down_revision = '69e14ffde857'
branch_labels = None
depends_on = None


def upgrade():
    # Đã BIÊN TẬP LẠI thủ công: chỉ giữ 2 bảng liên quan tới Bước 3 (D1 — hợp nhất
    # NghiPhep/GiayPhep). Toàn bộ phần Alembic tự phát hiện thêm (danh_gia, dao_tao,
    # giay_phep, hopdong_laodong, nhan_vien, quyche_congty...) là lệch schema có sẵn
    # từ trước, chưa rà soát, không áp dụng lẫn vào đây.
    with op.batch_alter_table('loai_nghi_phep', schema=None) as batch_op:
        # NOT NULL cần server_default vì bảng đã có 3 dòng dữ liệu thật —
        # nếu không có default, SQLite không biết điền gì cho dòng cũ khi ALTER.
        batch_op.add_column(sa.Column(
            'don_vi_tinh', sa.Enum('NGAY', 'GIO', name='donvitinh'),
            nullable=False, server_default='NGAY'
        ))
        batch_op.add_column(sa.Column(
            'yeu_cau_cham_cong', sa.Boolean(),
            nullable=False, server_default=sa.text('0')
        ))

    with op.batch_alter_table('nghi_phep', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cham_cong_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('so_gio', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('nguoi_duyet_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('ngay_duyet', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('ly_do_tu_choi', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True))
        batch_op.create_foreign_key('fk_nghiphep_chamcong', 'cham_cong', ['cham_cong_id'], ['id'])
        batch_op.create_foreign_key('fk_nghiphep_nguoiduyet', 'nhan_vien', ['nguoi_duyet_id'], ['id'])


def downgrade():
    with op.batch_alter_table('nghi_phep', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nghiphep_nguoiduyet', type_='foreignkey')
        batch_op.drop_constraint('fk_nghiphep_chamcong', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('ly_do_tu_choi')
        batch_op.drop_column('ngay_duyet')
        batch_op.drop_column('nguoi_duyet_id')
        batch_op.drop_column('so_gio')
        batch_op.drop_column('cham_cong_id')

    with op.batch_alter_table('loai_nghi_phep', schema=None) as batch_op:
        batch_op.drop_column('yeu_cau_cham_cong')
        batch_op.drop_column('don_vi_tinh')
