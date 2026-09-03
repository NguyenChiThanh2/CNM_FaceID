from flask import Flask
from flask_cors import CORS
from .db import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3
import os

load_dotenv()

jwt = JWTManager()  #  KHỞI TẠO ĐÚNG Ở ĐÂY
migrate = Migrate()


# SQLite mặc định KHÔNG enforce ràng buộc khóa ngoại trừ khi bật PRAGMA này cho
# từng kết nối — nếu không, DB có thể chấp nhận ghi nhan_vien_id không tồn tại
# vào các bảng con mà không báo lỗi gì. Chỉ áp dụng khi kết nối thật sự là
# SQLite (isinstance check) để không ảnh hưởng khi sau này đổi sang PostgreSQL.
@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_database2.db'
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///test_database2.db'
    ).replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, '..', 'static', 'images', 'avatars')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

    # Cấu hình JWT bắt buộc — đọc từ .env, không hardcode (JWT_SECRET_KEY dùng
    # để ký token xác thực, lộ ra source code là có thể giả mạo token bất kỳ user nào)
    app.config['JWT_SECRET_KEY'] = os.environ['JWT_SECRET_KEY']

    # Khởi tạo các extension
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Alembic (flask db upgrade) là nguồn quản lý schema duy nhất kể từ khi
    # chuyển sang PostgreSQL — không còn dùng db.create_all() song song để
    # tránh 2 cơ chế tạo bảng xung đột nhau (đã gây sai lệch khi autogenerate
    # so sánh schema, vì create_all() luôn tự tạo bảng trước khi so sánh).

    return app
