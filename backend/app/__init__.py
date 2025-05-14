from flask import Flask
from flask_cors import CORS
from .db import db
from flask_jwt_extended import JWTManager
import os

jwt = JWTManager()  # ✅ KHỞI TẠO ĐÚNG Ở ĐÂY

def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test_database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, '..', 'static', 'images', 'avatars')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

    # ✅ Cấu hình JWT bắt buộc
    app.config['JWT_SECRET_KEY'] = 'your_super_secret_jwt_key'

    # Khởi tạo các extension
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Khởi tạo database
    with app.app_context():
        db.create_all()



    return app
