"""don sach lech schema: danh_gia, dao_tao, giay_phep, hopdong, nhan_vien, quyche_congty, chi_tiet_luong

Revision ID: 9a8f73c1f8b8
Revises: 1634833a910e
Create Date: 2026-08-30 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '9a8f73c1f8b8'
down_revision = '1634833a910e'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ============================================================
    # 1) dao_tao / dao_tao_nhan_vien — ĐÃ XÓA THẬT ở lần chạy trước (lệnh DROP
    #    TABLE của SQLite commit ngay, không nằm trong cùng giao dịch với phần
    #    batch_alter_table phía sau nên không bị rollback cùng lỗi lần trước).
    #    Không lặp lại thao tác này nữa.
    # ============================================================

    # ============================================================
    # 2) danh_gia — backfill dữ liệu cũ TRƯỚC khi ép NOT NULL/Enum,
    #    tránh mất/làm sai lệch 29 dòng dữ liệu thật đang có.
    # ============================================================

    # 2a. ky_ngay đang NULL ở 26/29 dòng — lấy lại từ cột cũ "thoi_gian"
    # (đã xác nhận thoi_gian luôn có giá trị ở đúng các dòng này).
    conn.execute(sa.text(
        "UPDATE danh_gia SET ky_ngay = thoi_gian WHERE ky_ngay IS NULL"
    ))

    # 2b. phuong_thuc đang NULL ở 26/29 dòng — model mặc định là MANAGER,
    # áp lại đúng giá trị mặc định đó cho dữ liệu cũ.
    conn.execute(sa.text(
        "UPDATE danh_gia SET phuong_thuc = 'MANAGER' WHERE phuong_thuc IS NULL"
    ))

    # 2c. diem_hieu_suat (điểm tổng kiểu cũ, cả 29 dòng đều có giá trị) sắp bị
    # xóa vì model mới không còn cột này (thay bằng tong_diem tính từ 5 tiêu
    # chí có trọng số). Không có cột nào để ánh xạ 1-1 sang model mới, nên lưu
    # lại thành ghi chú trong nhan_xet để không mất dấu vết dữ liệu lịch sử.
    conn.execute(sa.text(
        "UPDATE danh_gia SET nhan_xet = COALESCE(nhan_xet, '') || "
        "' [Điểm tổng kiểu cũ trước khi đổi hệ đánh giá: ' || diem_hieu_suat || ']' "
        "WHERE diem_hieu_suat IS NOT NULL"
    ))

    with op.batch_alter_table('danh_gia', schema=None) as batch_op:
        batch_op.alter_column('ky_ngay', existing_type=sa.DATE(), nullable=False)
        batch_op.alter_column(
            'ky_loai', existing_type=sa.TEXT(),
            type_=sa.Enum('MONTH', 'QUARTER', 'YEAR', name='enum_ky_loai'),
            nullable=False, existing_server_default=sa.text("'MONTH'"),
        )
        batch_op.alter_column('w_chuyen_can', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.2)'))
        batch_op.alter_column('w_hieu_qua', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.3)'))
        batch_op.alter_column('w_ky_nang', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.25)'))
        batch_op.alter_column('w_thai_do', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.15)'))
        batch_op.alter_column('w_chu_dong', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.1)'))
        batch_op.alter_column(
            'phuong_thuc', existing_type=sa.TEXT(),
            type_=sa.Enum('SELF', 'MANAGER', 'PEER', '_360', name='enum_phuong_thuc'),
            nullable=False,
        )
        batch_op.alter_column('created_at', existing_type=sa.DATETIME(), nullable=False)
        batch_op.alter_column('updated_at', existing_type=sa.DATETIME(), nullable=False)
        batch_op.create_unique_constraint('uq_danhgia_nv_ky', ['nhan_vien_id', 'ky_ngay', 'ky_loai'])
        batch_op.create_check_constraint(
            'ck_danhgia_scores_range',
            '(diem_chuyen_can IS NULL OR (diem_chuyen_can BETWEEN 0 AND 10)) AND '
            '(diem_hieu_qua   IS NULL OR (diem_hieu_qua   BETWEEN 0 AND 10)) AND '
            '(diem_ky_nang    IS NULL OR (diem_ky_nang    BETWEEN 0 AND 10)) AND '
            '(diem_thai_do    IS NULL OR (diem_thai_do    BETWEEN 0 AND 10)) AND '
            '(diem_chu_dong   IS NULL OR (diem_chu_dong   BETWEEN 0 AND 10))',
        )
        batch_op.create_check_constraint(
            'ck_danhgia_weights_sum',
            '(w_chuyen_can + w_hieu_qua + w_ky_nang + w_thai_do + w_chu_dong) BETWEEN 0.999 AND 1.001',
        )
        batch_op.drop_column('diem_hieu_suat')
        batch_op.drop_column('thoi_gian')
        batch_op.drop_column('trang_thai')
        batch_op.drop_column('minh_chung')

    # ============================================================
    # 3) giay_phep — 2 dòng dữ liệu thật đã xác nhận đủ giá trị non-null
    #    cho cả 3 cột này, ép NOT NULL an toàn.
    # ============================================================
    with op.batch_alter_table('giay_phep', schema=None) as batch_op:
        batch_op.alter_column('nhan_vien_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('cham_cong_id', existing_type=sa.INTEGER(), nullable=False)
        batch_op.alter_column('so_gio', existing_type=sa.INTEGER(), nullable=False)

    # ============================================================
    # 4) Đổi kiểu cột đơn thuần — không rủi ro dữ liệu
    # ============================================================
    with op.batch_alter_table('hopdong_laodong', schema=None) as batch_op:
        batch_op.alter_column('thoi_gian_hop_dong', existing_type=sa.TEXT(),
                               type_=sa.String(length=50), existing_nullable=True)

    with op.batch_alter_table('nhan_vien', schema=None) as batch_op:
        batch_op.alter_column('password', existing_type=sa.TEXT(),
                               type_=sa.String(length=255), existing_nullable=True)

    with op.batch_alter_table('quyche_congty', schema=None) as batch_op:
        batch_op.alter_column('phu_cap_xang_xe', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.0)'))

    # NOTE: chi_tiet_luong.bang_luong_id trong DB thật vốn ĐÃ có ON DELETE CASCADE
    # từ trước — model chỉ vừa được sửa cho khớp thực tế (thêm ondelete='CASCADE'
    # vào khai báo Python), không cần thay đổi gì ở DB nên không có bước migration
    # nào ở đây cho bảng này.


def downgrade():
    # Downgrade khôi phục lại schema cũ nhưng KHÔNG khôi phục được dữ liệu đã
    # backfill/hợp nhất (ky_ngay lấy từ thoi_gian, diem_hieu_suat gộp vào
    # nhan_xet, dao_tao/dao_tao_nhan_vien đã xóa hẳn) — đây là thay đổi một
    # chiều có chủ đích, không phải migration có thể rollback dữ liệu 100%.
    with op.batch_alter_table('quyche_congty', schema=None) as batch_op:
        batch_op.alter_column('phu_cap_xang_xe', existing_type=sa.FLOAT(), nullable=False,
                               existing_server_default=sa.text('(0.0)'))

    with op.batch_alter_table('nhan_vien', schema=None) as batch_op:
        batch_op.alter_column('password', existing_type=sa.String(length=255),
                               type_=sa.TEXT(), existing_nullable=True)

    with op.batch_alter_table('hopdong_laodong', schema=None) as batch_op:
        batch_op.alter_column('thoi_gian_hop_dong', existing_type=sa.String(length=50),
                               type_=sa.TEXT(), existing_nullable=True)

    with op.batch_alter_table('giay_phep', schema=None) as batch_op:
        batch_op.alter_column('so_gio', existing_type=sa.INTEGER(), nullable=True)
        batch_op.alter_column('cham_cong_id', existing_type=sa.INTEGER(), nullable=True)
        batch_op.alter_column('nhan_vien_id', existing_type=sa.INTEGER(), nullable=True)

    with op.batch_alter_table('danh_gia', schema=None) as batch_op:
        batch_op.add_column(sa.Column('minh_chung', sa.TEXT(), nullable=True))
        batch_op.add_column(sa.Column('trang_thai', sa.TEXT(), nullable=True))
        batch_op.add_column(sa.Column('thoi_gian', sa.DATE(), nullable=True))
        batch_op.add_column(sa.Column('diem_hieu_suat', sa.FLOAT(), nullable=True))
        batch_op.drop_constraint('ck_danhgia_weights_sum', type_='check')
        batch_op.drop_constraint('ck_danhgia_scores_range', type_='check')
        batch_op.drop_constraint('uq_danhgia_nv_ky', type_='unique')
        batch_op.alter_column('updated_at', existing_type=sa.DATETIME(), nullable=True)
        batch_op.alter_column('created_at', existing_type=sa.DATETIME(), nullable=True)
        batch_op.alter_column('phuong_thuc',
                               existing_type=sa.Enum('SELF', 'MANAGER', 'PEER', '_360', name='enum_phuong_thuc'),
                               type_=sa.TEXT(), nullable=True)
        batch_op.alter_column('w_chu_dong', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.1)'))
        batch_op.alter_column('w_thai_do', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.15)'))
        batch_op.alter_column('w_ky_nang', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.25)'))
        batch_op.alter_column('w_hieu_qua', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.3)'))
        batch_op.alter_column('w_chuyen_can', existing_type=sa.FLOAT(), nullable=True,
                               existing_server_default=sa.text('(0.2)'))
        batch_op.alter_column('ky_loai',
                               existing_type=sa.Enum('MONTH', 'QUARTER', 'YEAR', name='enum_ky_loai'),
                               type_=sa.TEXT(), nullable=True, existing_server_default=sa.text("'MONTH'"))
        batch_op.alter_column('ky_ngay', existing_type=sa.DATE(), nullable=True)

    op.create_table(
        'dao_tao',
        sa.Column('id', sa.INTEGER(), nullable=False),
        sa.Column('khoa_dao_tao', sa.VARCHAR(length=255), nullable=True),
        sa.Column('ngay_bat_dau', sa.DATE(), nullable=True),
        sa.Column('ngay_ket_thuc', sa.DATE(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'dao_tao_nhan_vien',
        sa.Column('id', sa.INTEGER(), nullable=False),
        sa.Column('dao_tao_id', sa.INTEGER(), nullable=False),
        sa.Column('nhan_vien_id', sa.INTEGER(), nullable=False),
        sa.Column('ket_qua', sa.VARCHAR(length=255), nullable=True),
        sa.ForeignKeyConstraint(['dao_tao_id'], ['dao_tao.id']),
        sa.ForeignKeyConstraint(['nhan_vien_id'], ['nhan_vien.id']),
        sa.PrimaryKeyConstraint('id'),
    )
