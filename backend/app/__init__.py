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

    # JWT lưu trong cookie httpOnly thay vì trả access_token trong JSON body để
    # FE cất vào localStorage — localStorage đọc được bằng JS nên 1 lỗ XSS bất
    # kỳ ở FE là đủ để đánh cắp token; cookie httpOnly thì JS (kể cả script độc)
    # không đọc được. Cookie tự động được trình duyệt đính kèm ở mọi request
    # nên phải bật CSRF protection đi kèm (JWT_COOKIE_CSRF_PROTECT) để chặn
    # CSRF — nếu không, 1 trang web độc bất kỳ cũng có thể khiến trình duyệt
    # nạn nhân tự gửi cookie hợp lệ kèm request giả mạo.
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_COOKIE_CSRF_PROTECT'] = True
    app.config['JWT_COOKIE_SECURE'] = os.environ.get('COOKIE_SECURE', 'false').lower() == 'true'
    app.config['JWT_COOKIE_SAMESITE'] = os.environ.get('COOKIE_SAMESITE', 'Lax')

    # Khởi tạo các extension
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    # Cấu hình CORS DUY NHẤT ở đây — trước đây có 2 nơi gọi CORS(app) (chỗ này
    # và run.py), cùng áp lên 1 app instance. Toàn bộ route trong hệ thống đều
    # nằm dưới /api/* (kể cả các route không khai url_prefix ở register_routes
    # đều tự khai '/api' ngay trong Blueprint hoặc trong path — xem
    # app/routes/__init__.py).
    # origins KHÔNG còn để "*" — trình duyệt tự chặn mọi response CORS có
    # Access-Control-Allow-Credentials: true kèm Allow-Origin là "*" (wildcard
    # + credentials bị cấm theo spec), nên từ khi FE gửi cookie kèm request
    # (withCredentials/supports_credentials) BẮT BUỘC phải khai đúng origin cụ
    # thể của FE, đọc từ .env để môi trường prod đổi domain không cần sửa code.
    frontend_origin = os.environ.get('FRONTEND_ORIGIN', 'http://localhost:5173')
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}}, supports_credentials=True)

    # Alembic (flask db upgrade) là nguồn quản lý schema duy nhất kể từ khi
    # chuyển sang PostgreSQL — không còn dùng db.create_all() song song để
    # tránh 2 cơ chế tạo bảng xung đột nhau (đã gây sai lệch khi autogenerate
    # so sánh schema, vì create_all() luôn tự tạo bảng trước khi so sánh).

    return app
