from flask import jsonify, request
from app.services.giay_phep_service import *


# Lấy tất cả lương
def get_all_giay_phep_controller():
    giayphep = get_all_giay_phep_service()
    if giayphep:
        return jsonify([giayphep.to_dict() for giayphep in giayphep]),200
    else:
        return jsonify({'message': 'Không có dữ liệu lương'}), 404

def  get_giay_phep_quen_chamcong_controller(cham_cong_id):
    giayphep = get_giay_phep_quen_chamcong_service(cham_cong_id)
    if giayphep:
        return jsonify(giayphep.to_dict()),200
    else:
        return jsonify({'message': 'Không có dữ liệu giấy phép'}), 404
    
def create_giay_phep_controller():
  
    try:
        data = request.json
        giayphep = create_giay_phep_service(
            data['cham_cong_id'],
            data['nhan_vien_id'],
            data['ngay_bat_dau'],   # đúng với JSON gửi lên
            data['ngay_ket_thuc'],  # đúng với JSON gửi lên
            data['loai_giay_phep'],
            data['ly_do'],
            data['so_gio']
        )
        return jsonify(giayphep.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400