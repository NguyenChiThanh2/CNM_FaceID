from app import db  # dùng db từ app/__init__.py

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    ma_vai_tro = db.Column(db.String(50), nullable=False ,unique=True)
    ten_role = db.Column(db.String(50), nullable=False)
    mo_ta = db.Column(db.String(50), nullable=False)

    # Quan hệ ngược lại, tên rõ nghĩa hơn
    users = db.relationship("User", back_populates="role", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Role {self.ten_role}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ma_vai_tro': self.ma_vai_tro,
            'ten_role': self.ten_role,
            'mo_ta': self.mo_ta
        }

