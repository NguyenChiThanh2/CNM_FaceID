from app import db
from app.models.role_model import Role # Đảm bảo bạn import đúng nếu tách file

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)

    # Quan hệ với bảng Role, tên quan hệ nên là "role" (số ít)
    role = db.relationship("Role", back_populates="users")

    def __repr__(self):
        return f"<User {self.username}>"

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role_id': self.role_id,
            'role': self.role.to_dict() if self.role else None
        }
