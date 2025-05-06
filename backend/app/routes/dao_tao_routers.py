from flask import Blueprint, jsonify, request
from app import db
from app.models.dao_tao_model import DaoTao
from app.models.dao_tao_nhan_vien_model import DaoTaoNhanVien
from app.models.nhan_vien_model import NhanVien
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError

dao_tao_bp = Blueprint('dao_tao', __name__)

# Lấy tất cả khóa đào tạo
@dao_tao_bp.route('/get-all-dao-tao', methods=['GET'])
def get_all_dao_tao_router():
    try:
        dao_taos = DaoTao.query.all()
        if dao_taos:
            return jsonify([dt.to_dict() for dt in dao_taos])
        else:
            return jsonify({'message': 'Không có dữ liệu đào tạo'}), 404
    except Exception as e:
        return jsonify({"message": f"Lỗi khi lấy danh sách khóa đào tạo: {str(e)}"}), 500

# Lấy khóa đào tạo theo ID
@dao_tao_bp.route('/get-dao-tao-by-id/<int:id>', methods=['GET'])
def get_dao_tao_by_id_router(id):
    try:
        dao_tao = DaoTao.query.get(id)
        if dao_tao:
            return jsonify(dao_tao.to_dict())
        else:
            return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404
    except Exception as e:
        return jsonify({"message": f"Lỗi khi lấy khóa đào tạo: {str(e)}"}), 500

# Lấy danh sách khóa đào tạo mà một nhân viên đã tham gia
@dao_tao_bp.route('/get-dao-tao-by-nhan-vien-id/<int:nhan_vien_id>', methods=['GET'])
def get_dao_tao_by_nhan_vien_id_router(nhan_vien_id):
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
        if result:
            return jsonify(result), 200
        else:
            return jsonify({"message": "Không tìm thấy khóa đào tạo nào cho nhân viên này"}), 404
    except Exception as e:
        return jsonify({"message": f"Lỗi khi lấy danh sách khóa đào tạo của nhân viên: {str(e)}"}), 500

# Tạo khóa đào tạo mới
@dao_tao_bp.route('/add-dao-tao', methods=['POST'])
def create_dao_tao_router():
    try:
        data = request.get_json()
        required_fields = ['khoa_dao_tao', 'ngay_bat_dau', 'ngay_ket_thuc']
        
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Thiếu thông tin'}), 400
        
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
    except Exception as e:
        return jsonify({"message": f"Không thể tạo khóa đào tạo: {str(e)}"}), 400

# Cập nhật khóa đào tạo
@dao_tao_bp.route('/edit-dao-tao/<int:id>', methods=['PUT'])
def update_dao_tao_router(id):
    try:
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
    except Exception as e:
        return jsonify({"message": f"Lỗi khi cập nhật khóa đào tạo: {str(e)}"}), 500

# Xóa khóa đào tạo
@dao_tao_bp.route('/delete-dao-tao/<int:id>', methods=['DELETE'])
def delete_dao_tao_router(id):
    try:
        dao_tao = DaoTao.query.get(id)
        if not dao_tao:
            return jsonify({'message': 'Không tìm thấy khóa đào tạo'}), 404
        
        # Xóa các liên kết nhân viên trước khi xóa khóa đào tạo
        DaoTaoNhanVien.query.filter_by(dao_tao_id=id).delete()
        db.session.delete(dao_tao)
        db.session.commit()
        return jsonify({'message': 'Xóa khóa đào tạo thành công'})
    except Exception as e:
        return jsonify({"message": f"Lỗi khi xóa khóa đào tạo: {str(e)}"}), 500

# Gán danh sách nhân viên vào một khóa đào tạo
@dao_tao_bp.route('/dao_taos/<int:id>/assign', methods=['POST'])
def assign_nhan_viens_to_dao_tao_router(id):
    try:
        data = request.get_json()
        nhan_viens = data.get('nhan_viens')

        if not nhan_viens or not isinstance(nhan_viens, list):
            return jsonify({'message': 'Danh sách nhân viên không hợp lệ'}), 400

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
    except Exception as e:
        return jsonify({"message": f"Lỗi khi gán nhân viên vào khóa đào tạo: {str(e)}"}), 500

# Lấy danh sách nhân viên trong một khóa đào tạo
@dao_tao_bp.route("/get-all-nhan-vien-by-dao-tao-id/<int:dao_tao_id>", methods=["GET"])
def get_nhan_vien_by_dao_tao(dao_tao_id):
    try:
        dao_tao = DaoTao.query.get(dao_tao_id)
        if not dao_tao:
            return jsonify({"message": "Khóa đào tạo không tồn tại"}), 404

        tham_gias = DaoTaoNhanVien.query.filter_by(dao_tao_id=dao_tao_id).all()
        if not tham_gias:
            return jsonify({"message": "Không có nhân viên tham gia khóa đào tạo này"}), 404
        
        result = []
        for tg in tham_gias:
            nv = tg.nhan_vien
            result.append({
                "id":nv.id,
                "ho_ten": nv.ho_ten,
                "email": nv.email,
                
                "ten_khoa_dao_tao": dao_tao.khoa_dao_tao,  # Lấy tên khóa đào tạo
                "ket_qua": tg.ket_qua
            })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"message": f"Lỗi server: {str(e)}"}), 500


@dao_tao_bp.route("/add-nhan-vien-to-dao-tao", methods=["POST"])
def add_nhan_vien_to_dao_tao():
    data = request.get_json()
    dao_tao_id = data.get("dao_tao_id")
    nhan_vien_ids = data.get("nhan_vien_ids", [])

    for nv_id in nhan_vien_ids:
        existing = db.session.query(DaoTaoNhanVien).filter_by(nhan_vien_id=nv_id, dao_tao_id=dao_tao_id).first()
        if not existing:
            new_entry = DaoTaoNhanVien(nhan_vien_id=nv_id, dao_tao_id=dao_tao_id)
            db.session.add(new_entry)

    db.session.commit()
    return jsonify({"message": "Đã thêm nhân viên vào khóa đào tạo."})

@dao_tao_bp.route('/remove-nhan-vien-from-dao-tao', methods=['POST'])
def remove_nhan_vien_from_dao_tao():
    data = request.json
    dao_tao_id = data.get('dao_tao_id')
    nhan_vien_id = data.get('nhan_vien_id')

    entry = DaoTaoNhanVien.query.filter_by(dao_tao_id=dao_tao_id, nhan_vien_id=nhan_vien_id).first()
    if entry:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({"message": "Xóa nhân viên khỏi khóa đào tạo thành công"}), 200
    else:
        return jsonify({"message": "Không tìm thấy nhân viên trong khóa đào tạo"}), 404

