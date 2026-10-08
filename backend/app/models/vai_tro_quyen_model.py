# app/models/vai_tro_quyen_model.py
from app import db

# Bảng nối thuần túy (N-N) giữa VaiTro và Quyen — không cần thêm cột nghiệp vụ
# nào ngoài 2 khóa ngoại, nên khai báo bằng db.Table thay vì 1 model class riêng
# (tránh phải tạo model rỗng chỉ để làm bảng trung gian).
vai_tro_quyen = db.Table(
    'vai_tro_quyen',
    db.Column('vai_tro_id', db.Integer, db.ForeignKey('vai_tro.id'), primary_key=True),
    db.Column('quyen_id', db.Integer, db.ForeignKey('quyen.id'), primary_key=True),
)
