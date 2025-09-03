from flask import Blueprint
from app.controllers.giay_phep_controller import *
from app.services.giay_phep_service import *

giayphep_bp = Blueprint('giayphep_bp', __name__,)

@giayphep_bp.route('/get_giay_phep_quen_chamcong/<int:cham_cong_id>', methods=['GET'])
def get_all_luong_router(cham_cong_id):
    if not cham_cong_id:
        return jsonify({'error': 'Thiếu thông tin bắt buộc'}), 400
    return get_giay_phep_quen_chamcong_controller(cham_cong_id)