from flask import jsonify, request
from app.services.giay_phep_service import *
from app.decorators.auth_decorators import get_current_nhan_vien, is_hr


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
        print(f"Lỗi khi tạo giấy phép: {e}")
        return jsonify({'error': 'Không thể tạo giấy phép, vui lòng thử lại sau'}), 400


def update_giay_phep_controller(id):
    # Trước đây chỉ có FE ẩn nút "Sửa" — BE cho phép bất kỳ ai có quyền
    # "giay_phep.sua" (cần cho chính nhân viên tự sửa đơn của họ) sửa được
    # giấy phép của BẤT KỲ nhân viên nào. Giờ chặn lại: chỉ HR hoặc đúng chủ
    # đơn mới được sửa.
    giay_phep = get_giay_phep_by_id_service(id)
    if not giay_phep:
        return jsonify({'error': 'Giấy phép không tồn tại'}), 404
    nv = get_current_nhan_vien()
    if not (is_hr(nv) or (nv and giay_phep.nhan_vien_id == nv.id)):
        return jsonify({'error': 'Bạn không có quyền sửa giấy phép này'}), 403
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
        print(f"Lỗi khi sửa giấy phép: {e}")
        return jsonify({'error': 'Không thể cập nhật giấy phép, vui lòng thử lại sau'}), 400


def approve_giay_phep_controller(id):
    # Chỉ HR mới được duyệt — trước đây không kiểm tra, ai có quyền
    # "giay_phep.sua" (kể cả nhân viên thường, để họ tự sửa đơn của mình)
    # cũng duyệt được đơn của bất kỳ ai qua thẳng API.
    if not is_hr(get_current_nhan_vien()):
        return jsonify({"message": "Chỉ nhân sự (HR) mới được duyệt giấy phép"}), 403
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
    # Chỉ HR mới được từ chối — cùng lý do như approve_giay_phep_controller.
    if not is_hr(get_current_nhan_vien()):
        return jsonify({"message": "Chỉ nhân sự (HR) mới được từ chối giấy phép"}), 403
    try:
        rejected_giay_phep = reject_giay_phep_service(id)
        return jsonify(rejected_giay_phep.to_dict()), 200
    except Exception as e:
        print(f"Lỗi khi từ chối giấy phép: {e}")
        return jsonify({'error': 'Không thể từ chối giấy phép, vui lòng thử lại sau'}), 400


def cancle_giay_phep_controller(id):
    # Chỉ HR hoặc đúng chủ đơn mới được hủy — trước đây không kiểm tra.
    giay_phep = get_giay_phep_by_id_service(id)
    if not giay_phep:
        return jsonify({'message': 'Giấy phép không tồn tại'}), 404
    nv = get_current_nhan_vien()
    if not (is_hr(nv) or (nv and giay_phep.nhan_vien_id == nv.id)):
        return jsonify({'message': 'Bạn không có quyền hủy giấy phép này'}), 403
    try:
        cancled_giay_phep = cancle_giay_phep_service(id)
        if cancled_giay_phep:
            return jsonify({'message': 'Xóa giấy phép thành công'}), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        print(f"Lỗi khi hủy giấy phép: {e}")
        return jsonify({'message': 'Không thể hủy giấy phép, vui lòng thử lại sau'}), 500


# def delete_giay_phep_controller(id):
#     existing = delete_giay_phep_service(id)
#     if not existing:
#         return jsonify({'message': 'Không tìm thấy nghỉ phép'}), 404
#     return jsonify({'message': 'Xóa nghỉ phép thành công'}), 200

    
    

