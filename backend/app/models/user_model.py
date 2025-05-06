from app import db  # dùng db từ app/__init__.py

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"))

    # Sửa lại tên mối quan hệ cho đúng
    role_users = db.relationship("Role", back_populates="role_users")

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role_id': self.role_id
        }
