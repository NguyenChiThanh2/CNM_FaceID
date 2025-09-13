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
    

def update_giay_phep_controller(id):
    try:
        data = request.json
        updated_giay_phep = update_giay_phep_service(
            id,
            cham_cong_id =data.get('cham_cong_id'),
            nhan_vien_id=data.get('nhan_vien_id'),
            ngay_bat_dau=data.get('ngay_bat_dau'),
            ngay_ket_thuc=data.get('ngay_ket_thuc'),
            loai_giay_phep=data.get('loai_giay_phep'),
            ly_do=data.get('ly_do'),
            so_gio=data.get('so_gio'),
            trang_thai=data.get('trang_thai')
        )
        return jsonify(updated_giay_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def approve_giay_phep_controller(id):
    try:
        giay_phep = approve_giay_phep_service(id)
        return jsonify({"message": "Đơn nghỉ phép đã được duyệt và số ngày phép còn lại của nhân viên đã được cập nhật!"}), 200
    except ValueError as e:
        # Nếu có lỗi xảy ra, trả về lỗi tương ứng
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        # Lỗi chung
        print(e)
        return jsonify({"message": "Lỗi khi duyệt đơn nghỉ phép!"}), 500


def reject_giay_phep_controller(id):
    try:
        rejected_giay_phep = reject_giay_phep_service(id)
        return jsonify(rejected_giay_phep.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400


def cancle_giay_phep_controller(id):
    try:
        cancled_giay_phep = cancle_giay_phep_service(id)
        if cancled_giay_phep:
            return jsonify({'message': 'Xóa giấy phép thành công'}), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': str(e)}), 500


# def delete_giay_phep_controller(id):
#     existing = delete_giay_phep_service(id)
#     if not existing:
#         return jsonify({'message': 'Không tìm thấy nghỉ phép'}), 404
#     return jsonify({'message': 'Xóa nghỉ phép thành công'}), 200

    
    

