# app/services/user_service.py
from app.models.user_model import User
from app import db

# Lấy tất cả người dùng
def get_all_users():
    return User.query.all()

# Lấy người dùng theo ID
def get_user_by_id(user_id):
    return User.query.get(user_id)

# Tạo người dùng mới
def create_new_user(username, password, email=None, role_id=None):
    new_user = User(username=username, password=password, email=email, role_id=role_id)
    db.session.add(new_user)
    db.session.commit()
    return new_user

# Cập nhật người dùng theo ID
def update_user(user, username=None, password=None, email=None, role_id=None):
    user.username = username or user.username
    user.password = password or user.password
    user.email = email or user.email
    user.role_id = role_id or user.role_id

    db.session.commit()
    return user

# Xóa người dùng theo ID
def delete_user(user):
    db.session.delete(user)
    db.session.commit()
