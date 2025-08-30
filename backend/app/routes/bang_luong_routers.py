from flask import Blueprint
from app.controllers.bang_luong_controller import *
from app.services.bang_luong_service import *

bangluong_bp = Blueprint('bangluong_bp', __name__,)

@bangluong_bp.route('/get-bang-luong-1nv/<int:nhan_vien_id>', methods=['GET'])
def get_bang_luong_1nv_router(nhan_vien_id):
    return get_bang_luong_1nv(nhan_vien_id)