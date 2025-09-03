from flask import jsonify, request
from app.services.giay_phep_service import *

def  get_giay_phep_quen_chamcong_controller(cham_cong_id):
    giayphep = get_giay_phep_quen_chamcong_service(cham_cong_id)
    if giayphep:
        return jsonify(giayphep.to_dict()),200
    else:
        return jsonify({'message': 'Không có dữ liệu giấy phép'}), 404