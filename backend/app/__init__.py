from flask import Flask
from flask_cors import CORS
from .db import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3
import os

load_dotenv()

jwt = JWTManager()  #  KHỞI TẠO ĐÚNG Ở ĐÂY
migrate = Migrate()
# Rate limiter — dùng để chặn brute-force ở /login (xem app/routes/nhan_vien_routes.py).
# key_func=get_remote_address: đếm giới hạn theo IP của người gọi. Backend mặc
# định là in-memory (không cần Redis) — ĐỦ DÙNG cho 1 process, nhưng nếu chạy
# nhiều worker gunicorn thì mỗi worker đếm riêng (giới hạn thực tế = số lần
# cấu hình × số worker) — muốn chính xác tuyệt đối khi scale nhiều worker thì
# cần trỏ storage_uri sang Redis, không thuộc phạm vi sửa lần này.
limiter = Limiter(key_func=get_remote_address)


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
    limiter.init_app(app)
    # Cấu hình CORS DUY NHẤT ở đây — trước đây có 2 nơi gọi CORS(app) (chỗ này
    # và run.py), cùng áp lên 1 app instance. Toàn bộ route trong hệ thống đều
    # nằm dưới /api/* (kể cả các route không khai url_prefix ở register_routes
    # đều tự khai '/api' ngay trong Blueprint hoặc trong path — xem
    # app/routes/__init__.py), nên giữ đúng nguyên cấu hình đang chạy thật
    # (origins mở, cho phép gửi kèm credentials) nhưng chỉ khai 1 lần duy nhất.
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Alembic (flask db upgrade) là nguồn quản lý schema duy nhất kể từ khi
    # chuyển sang PostgreSQL — không còn dùng db.create_all() song song để
    # tránh 2 cơ chế tạo bảng xung đột nhau (đã gây sai lệch khi autogenerate
    # so sánh schema, vì create_all() luôn tự tạo bảng trước khi so sánh).

    return app
