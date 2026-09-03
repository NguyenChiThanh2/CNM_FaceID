"""them audit field (created_by, updated_by, deleted_by) cho 14 bang

Revision ID: 97b7a4de6f28
Revises: 3ce34f81dc76
Create Date: 2026-08-30 23:35:26.230751

"""
from alembic import op
import sqlalchemy as sa


revision = '97b7a4de6f28'
down_revision = '3ce34f81dc76'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('bang_cap_chung_chi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_bang_cap_chung_chi_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_bang_cap_chung_chi_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_bang_cap_chung_chi_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('bang_luong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_bang_luong_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_bang_luong_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_bang_luong_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('bh_dn', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_bh_dn_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_bh_dn_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_bh_dn_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('cham_cong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_cham_cong_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_cham_cong_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_cham_cong_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('khautru_nhanvien', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_khautru_nhanvien_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_khautru_nhanvien_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_khautru_nhanvien_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('nghi_phep', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_nghi_phep_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_nghi_phep_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_nghi_phep_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('nhan_vien', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_nhan_vien_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_nhan_vien_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_nhan_vien_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('nhan_vien_phuc_loi', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_nhan_vien_phuc_loi_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_nhan_vien_phuc_loi_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_nhan_vien_phuc_loi_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('nhanvien_thuong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_nhanvien_thuong_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_nhanvien_thuong_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_nhanvien_thuong_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('chi_tiet_luong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_chi_tiet_luong_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_chi_tiet_luong_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_chi_tiet_luong_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('danh_gia', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_danh_gia_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_danh_gia_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_danh_gia_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('giay_phep', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_giay_phep_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_giay_phep_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_giay_phep_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('hopdong_laodong', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_hopdong_laodong_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_hopdong_laodong_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_hopdong_laodong_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])

    with op.batch_alter_table('nguoi_phu_thuoc', schema=None) as batch_op:
        batch_op.add_column(sa.Column('deleted_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('updated_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_nguoi_phu_thuoc_created_by', 'nhan_vien', ['created_by'], ['id'])
        batch_op.create_foreign_key('fk_nguoi_phu_thuoc_updated_by', 'nhan_vien', ['updated_by'], ['id'])
        batch_op.create_foreign_key('fk_nguoi_phu_thuoc_deleted_by', 'nhan_vien', ['deleted_by'], ['id'])


def downgrade():
    with op.batch_alter_table('nguoi_phu_thuoc', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nguoi_phu_thuoc_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nguoi_phu_thuoc_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nguoi_phu_thuoc_created_by', type_='foreignkey')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('hopdong_laodong', schema=None) as batch_op:
        batch_op.drop_constraint('fk_hopdong_laodong_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_hopdong_laodong_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_hopdong_laodong_created_by', type_='foreignkey')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('giay_phep', schema=None) as batch_op:
        batch_op.drop_constraint('fk_giay_phep_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_giay_phep_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_giay_phep_created_by', type_='foreignkey')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('danh_gia', schema=None) as batch_op:
        batch_op.drop_constraint('fk_danh_gia_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_danh_gia_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_danh_gia_created_by', type_='foreignkey')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('chi_tiet_luong', schema=None) as batch_op:
        batch_op.drop_constraint('fk_chi_tiet_luong_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_chi_tiet_luong_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_chi_tiet_luong_created_by', type_='foreignkey')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('nhanvien_thuong', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nhanvien_thuong_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhanvien_thuong_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhanvien_thuong_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('nhan_vien_phuc_loi', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nhan_vien_phuc_loi_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhan_vien_phuc_loi_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhan_vien_phuc_loi_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('nhan_vien', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nhan_vien_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhan_vien_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nhan_vien_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('nghi_phep', schema=None) as batch_op:
        batch_op.drop_constraint('fk_nghi_phep_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nghi_phep_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_nghi_phep_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('khautru_nhanvien', schema=None) as batch_op:
        batch_op.drop_constraint('fk_khautru_nhanvien_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_khautru_nhanvien_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_khautru_nhanvien_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('cham_cong', schema=None) as batch_op:
        batch_op.drop_constraint('fk_cham_cong_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_cham_cong_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_cham_cong_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('bh_dn', schema=None) as batch_op:
        batch_op.drop_constraint('fk_bh_dn_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bh_dn_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bh_dn_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('bang_luong', schema=None) as batch_op:
        batch_op.drop_constraint('fk_bang_luong_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bang_luong_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bang_luong_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')

    with op.batch_alter_table('bang_cap_chung_chi', schema=None) as batch_op:
        batch_op.drop_constraint('fk_bang_cap_chung_chi_deleted_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bang_cap_chung_chi_updated_by', type_='foreignkey')
        batch_op.drop_constraint('fk_bang_cap_chung_chi_created_by', type_='foreignkey')
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('updated_by')
        batch_op.drop_column('created_by')
        batch_op.drop_column('deleted_by')
