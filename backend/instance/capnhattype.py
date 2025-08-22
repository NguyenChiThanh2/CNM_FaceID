from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///test_database1.db"
db = SQLAlchemy(app)

with app.app_context():
    # Ví dụ: đổi kiểu dữ liệu của cột 'du_lieu_khuon_mat' trong bảng 'nhanvien' thành LONGBLOB
    db.session.execute("""
        ALTER TABLE chamcong 
        MODIFY COLUMN du_lieu_khuon_mat LONGBLOB
    """)
    db.session.commit()
