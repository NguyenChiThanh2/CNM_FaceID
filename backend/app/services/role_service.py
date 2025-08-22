# app/services/role_service.py
from app.models.role_model import Role

def get_all_roles():
    return Role.query.all()

def get_role_by_name(ten_role):
    return Role.query.filter_by(ten_role=ten_role).first()
