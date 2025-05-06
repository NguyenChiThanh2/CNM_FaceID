from flask import jsonify, request
from app.services.dao_tao_service import *

# Lấy tất cả khóa đào tạo
def get_all_dao_tao():
    dao_taos = get_all_dao_tao_service()
    if dao_taos:
        return jsonify([dt.to_dict() for dt in dao_taos])
    else:
        return jsonify({'message': 'Không có dữ liệu đào tạo'}), 404


# Lấy khóa đào tạo theo ID
def get_dao_tao_by_id(id):
    return DaoTao.query.get(id) 




# Lấy danh sách khóa đào tạo mà 1 nhân viên đã tham gia
from flask import jsonify

def get_dao_tao_by_nhan_vien_id(nhan_vien_id):
    try:
        dao_taos = get_dao_tao_by_nhan_vien_id_service(nhan_vien_id)

        result = []
        for dt_nv in dao_taos:
            dao_tao = dt_nv.dao_tao  # lấy thông tin khóa đào tạo
            if dao_tao:
                result.append({
                    "dao_tao_id": dao_tao.id,
                    "khoa_dao_tao": dao_tao.khoa_dao_tao,
                    "ngay_bat_dau": dao_tao.ngay_bat_dau.strftime('%Y-%m-%d') if dao_tao.ngay_bat_dau else None,
                    "ngay_ket_thuc": dao_tao.ngay_ket_thuc.strftime('%Y-%m-%d') if dao_tao.ngay_ket_thuc else None,
                    "ket_qua": dt_nv.ket_qua
                })

        return jsonify(result), 200

    except Exception as e:
        print("❌ Lỗi khi lấy đào tạo:", e)
        return jsonify({
            "message": f"Lỗi khi lấy danh sách khóa đào tạo của nhân viên: {str(e)}"
        }), 500




# Tạo khóa đào tạo mớidef create_dao_tao():
    data = request.get_json()
    required_fields = ['khoa_dao_tao', 'ngay_bat_dau', 'ngay_ket_thuc']
    
    # Kiểm tra các trường bắt buộc
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Thiếu thông tin'}), 400

    # Kiểm tra định dạng ngày tháng
    try:
        from datetime import datetime
        ngay_bat_dau = datetime.strptime(data['ngay_bat_dau'], '%Y-%m-%d')  # Định dạng yyyy-mm-dd
        ngay_ket_thuc = datetime.strptime(data['ngay_ket_thuc'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Định dạng ngày tháng không hợp lệ'}), 400

    dao_tao = create_dao_tao_service(
        khoa_dao_tao=data['khoa_dao_tao'],
        ngay_bat_dau=ngay_bat_dau,
        ngay_ket_thuc=ngay_ket_thuc
    )
    return jsonify(dao_tao.to_dict()), 201

# Cập nhật khóa đào tạo
def update_dao_tao(id):
    dao_tao = get_dao_tao_by_id_service(id)
    if not dao_tao:
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404

    data = request.get_json()
    dao_tao = update_dao_tao_service(
        id=id,
        khoa_dao_tao=data.get('khoa_dao_tao'),
        ngay_bat_dau=data.get('ngay_bat_dau'),
        ngay_ket_thuc=data.get('ngay_ket_thuc')
    )
    return jsonify(dao_tao.to_dict())

# Xóa khóa đào tạo
def delete_dao_tao(id):
    if not get_dao_tao_by_id_service(id):
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404

    delete_dao_tao_service(id)
    return jsonify({'message': 'Xóa khóa đào tạo thành công'})

# Gán danh sách nhân viên vào một khóa đào tạo
# Gán danh sách nhân viên vào một khóa đào tạo
def assign_nhan_viens_to_dao_tao_controller(id):
    data = request.get_json()
    nhan_viens = data.get('nhan_viens')

    if not nhan_viens or not isinstance(nhan_viens, list):
        return jsonify({'message': 'Danh sách nhân viên không hợp lệ'}), 400

    # Kiểm tra từng nhân viên trong danh sách
    for nhan_vien in nhan_viens:
        if not isinstance(nhan_vien, dict) or 'id' not in nhan_vien or 'ket_qua' not in nhan_vien:
            return jsonify({'message': 'Dữ liệu nhân viên không hợp lệ'}), 400

    assign_nhan_viens_to_dao_tao(id, nhan_viens)
    return jsonify({'message': 'Gán nhân viên thành công'})

# Lấy danh sách nhân viên trong một khóa đào tạo

