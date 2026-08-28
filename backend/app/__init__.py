from flask import Flask
from flask_cors import CORS
from .db import db
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

load_dotenv()

jwt = JWTManager()  #  KHỞI TẠO ĐÚNG Ở ĐÂY
migrate = Migrate()

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

    # Cấu hình JWT bắt buộc
    app.config['JWT_SECRET_KEY'] = 'your_super_secret_jwt_key'

    # Khởi tạo các extension
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # ⚠️ TẠM GIỮ db.create_all() cho lần chạy baseline (Bước 1 — D9).
    # Sau khi `flask db migrate`/`upgrade` chạy ổn định, dòng này sẽ được xóa
    # để Alembic là nguồn quản lý schema duy nhất (không dùng song song 2 cơ chế).
    with app.app_context():
        db.create_all()

    return app
