from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class NhanVien(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ho_ten = db.Column(db.String(100))
    avatar = db.Column(db.String(200))  # Đường dẫn ảnh
