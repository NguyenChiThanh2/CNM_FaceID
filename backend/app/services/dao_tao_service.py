from flask import jsonify, request
from app import db
from app.models.dao_tao_model import DaoTao
from app.models.dao_tao_nhan_vien_model import DaoTaoNhanVien
from app.models.nhan_vien_model import NhanVien
from datetime import datetime


# Lấy tất cả khóa đào tạo
def get_all_dao_tao():
    dao_taos = DaoTao.query.all()
    if dao_taos:
        return jsonify([dt.to_dict() for dt in dao_taos])
    else:
        return jsonify({'message': 'Không có dữ liệu đào tạo'}), 404


# Lấy khóa đào tạo theo ID
def get_dao_tao_by_id(id):
    dao_tao = DaoTao.query.get(id)
    if dao_tao:
        return jsonify(dao_tao.to_dict())
    else:
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404


# Lấy danh sách khóa đào tạo mà một nhân viên đã tham gia
def get_dao_tao_by_nhan_vien_id(nhan_vien_id):
    try:
        dao_taos = DaoTaoNhanVien.query.filter_by(nhan_vien_id=nhan_vien_id).all()

        result = []
        for dt_nv in dao_taos:
            dao_tao = dt_nv.dao_tao
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


# Tạo khóa đào tạo mới
def create_dao_tao():
    data = request.get_json()
    required_fields = ['khoa_dao_tao', 'ngay_bat_dau', 'ngay_ket_thuc']
    
    # Kiểm tra các trường bắt buộc
    if not all(field in data for field in required_fields):
        return jsonify({'message': 'Thiếu thông tin'}), 400

    # Kiểm tra định dạng ngày tháng
    try:
        ngay_bat_dau = datetime.strptime(data['ngay_bat_dau'], '%Y-%m-%d')
        ngay_ket_thuc = datetime.strptime(data['ngay_ket_thuc'], '%Y-%m-%d')
    except ValueError:
        return jsonify({'message': 'Định dạng ngày tháng không hợp lệ'}), 400

    dao_tao = DaoTao(
        khoa_dao_tao=data['khoa_dao_tao'],
        ngay_bat_dau=ngay_bat_dau,
        ngay_ket_thuc=ngay_ket_thuc
    )
    db.session.add(dao_tao)
    db.session.commit()
    return jsonify(dao_tao.to_dict()), 201


# Cập nhật khóa đào tạo
def update_dao_tao(id):
    dao_tao = DaoTao.query.get(id)
    if not dao_tao:
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404

    data = request.get_json()
    if 'khoa_dao_tao' in data:
        dao_tao.khoa_dao_tao = data['khoa_dao_tao']
    if 'ngay_bat_dau' in data:
        dao_tao.ngay_bat_dau = datetime.strptime(data['ngay_bat_dau'], '%Y-%m-%d')
    if 'ngay_ket_thuc' in data:
        dao_tao.ngay_ket_thuc = datetime.strptime(data['ngay_ket_thuc'], '%Y-%m-%d')

    db.session.commit()
    return jsonify(dao_tao.to_dict())


# Xóa khóa đào tạo
def delete_dao_tao(id):
    dao_tao = DaoTao.query.get(id)
    if not dao_tao:
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404

    # Xóa các liên kết nhân viên trước khi xóa khóa đào tạo
    DaoTaoNhanVien.query.filter_by(dao_tao_id=id).delete()
    db.session.delete(dao_tao)
    db.session.commit()
    return jsonify({'message': 'Xóa khóa đào tạo thành công'})


# Gán danh sách nhân viên vào một khóa đào tạo
def assign_nhan_viens_to_dao_tao(id):
    data = request.get_json()
    nhan_viens = data.get('nhan_viens')

    if not nhan_viens or not isinstance(nhan_viens, list):
        return jsonify({'message': 'Danh sách nhân viên không hợp lệ'}), 400

    # Kiểm tra từng nhân viên trong danh sách
    for nhan_vien in nhan_viens:
        if not isinstance(nhan_vien, dict) or 'id' not in nhan_vien or 'ket_qua' not in nhan_vien:
            return jsonify({'message': 'Dữ liệu nhân viên không hợp lệ'}), 400

    # Xóa phân công cũ
    DaoTaoNhanVien.query.filter_by(dao_tao_id=id).delete()

    for nhan_vien in nhan_viens:
        new_entry = DaoTaoNhanVien(
            dao_tao_id=id,
            nhan_vien_id=nhan_vien["id"],
            ket_qua=nhan_vien.get("ket_qua", "")
        )
        db.session.add(new_entry)

    db.session.commit()
    return jsonify({'message': 'Gán nhân viên thành công'})


# Lấy danh sách nhân viên trong một khóa đào tạo
def get_all_nhan_vien_in_dao_tao(dao_tao_id):
    dao_tao = DaoTao.query.get(dao_tao_id)
    if not dao_tao:
        return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404

    nhan_viens = DaoTaoNhanVien.query.filter_by(dao_tao_id=dao_tao_id).all()
    result = []
    for nhan_vien in nhan_viens:
        result.append({
            'nhan_vien_id': nhan_vien.nhan_vien.id,
            'ho_ten': nhan_vien.nhan_vien.ho_ten,
            'ket_qua': nhan_vien.ket_qua
        })

    return jsonify(result), 200
