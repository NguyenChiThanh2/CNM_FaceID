"""doi face_encoding tu pickle sang raw bytes

Revision ID: f540461a011c
Revises: 0f7fabd675ef
Create Date: 2026-09-01 22:41:32.928628

Lý do cần migration tay: cột nhan_vien.face_encoding đổi từ db.PickleType
sang FaceEncodingType (TypeDecorator riêng, xem app/models/nhan_vien_model.py)
để tránh insecure deserialization (pickle.loads trên dữ liệu BLOB). Ở tầng
SQL cột vẫn là BLOB (LargeBinary) như cũ nên không cần đổi DDL — chỉ cần
chuyển đổi dữ liệu thật: unpickle giá trị cũ (list 128 float) rồi ghi lại
dưới dạng raw bytes float64.
"""
import pickle
import numpy as np
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f540461a011c'
down_revision = '0f7fabd675ef'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, face_encoding FROM nhan_vien WHERE face_encoding IS NOT NULL")
    ).fetchall()
    for row_id, blob in rows:
        old_list = pickle.loads(blob)
        new_blob = np.asarray(old_list, dtype=np.float64).tobytes()
        conn.execute(
            sa.text("UPDATE nhan_vien SET face_encoding = :blob WHERE id = :id"),
            {"blob": new_blob, "id": row_id},
        )


def downgrade():
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, face_encoding FROM nhan_vien WHERE face_encoding IS NOT NULL")
    ).fetchall()
    for row_id, blob in rows:
        arr = np.frombuffer(blob, dtype=np.float64).tolist()
        old_blob = pickle.dumps(arr)
        conn.execute(
            sa.text("UPDATE nhan_vien SET face_encoding = :blob WHERE id = :id"),
            {"blob": old_blob, "id": row_id},
        )
