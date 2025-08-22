# app/routes/role_routes.py
from flask import Blueprint
from app.controllers.role_controller import *

role_bp = Blueprint('role_bp', __name__)

@role_bp.route('/get-all-roles', methods=['GET'])
def get_all_roles():
    return get_roles()

@role_bp.route('/get-role-by-name/<string:name>', methods=['GET'])
def get_role_by_name_route(name):
    return get_role_by_name(name) 
