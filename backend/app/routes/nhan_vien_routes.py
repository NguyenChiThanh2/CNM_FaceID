from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import NhanVien
from app.controllers.nhan_vien_controller import (
    get_all_nhan_vien_controller,
    get_nhan_vien_by_id_controller,
    create_nhan_vien_controller,
    update_nhan_vien_controller,
    delete_nhan_vien_controller,
    search_nhan_vien_theoten_controller
)

nhan_vien_bp = Blueprint('nhan_vien_bp', __name__)

@nhan_vien_bp.route('/get-all-nhan-vien', methods=['GET'])
def get_all_nhan_vien():
    return get_all_nhan_vien_controller()       

@nhan_vien_bp.route('/get-nhan-vien-by-id/<int:id>', methods=['GET'])
def get_nhan_vien_by_id(id):
    return get_nhan_vien_by_id_controller(id)

@nhan_vien_bp.route('/get-nhan-vien-by-trang-thai/<string:trang_thai>', methods=['GET'])
def get_nhan_vien_by_trang_thai(trang_thai):
    return get_nhan_vien_by_trang_thai(trang_thai)

@nhan_vien_bp.route('/add-nhan-vien', methods=['POST'])
def create_nhan_vien():
    return create_nhan_vien_controller()

@nhan_vien_bp.route('/edit-nhan-vien/<int:id>', methods=['PUT'])
def update_nhan_vien(id):
    return update_nhan_vien_controller(id)

@nhan_vien_bp.route('/delete-nhan-vien/<int:id>', methods=['DELETE'])
def delete_nhan_vien(id):
    return delete_nhan_vien_controller(id)

@nhan_vien_bp.route("/search_nhanvien_theoten", methods=["GET"])
def search_nhan_vien_theoten():
    from flask import request
    q = request.args.get("q", "")
    return search_nhan_vien_theoten_controller(q)

@nhan_vien_bp.route('/login', methods=['POST', 'OPTIONS'])
def login_nhan_vien():
    if request.method == 'OPTIONS':
        # Cho phép preflight CORS
        return ('', 204)

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Tìm nhân viên theo email
    nhan_vien = NhanVien.query.filter_by(email=email).first()

    if not nhan_vien or not check_password_hash(nhan_vien.password, password):
        return jsonify({"msg": "Email hoặc mật khẩu không chính xác"}), 401
    
    # Tạo token đăng nhập
    access_token = create_access_token(identity={
        "id": nhan_vien.id,
        "email": nhan_vien.email,
        "ho_ten": nhan_vien.ho_ten,
        "chuc_vu_id": nhan_vien.chuc_vu_id,
        "phong_ban_id": nhan_vien.phong_ban_id,
        "avatar": nhan_vien.avatar,
        "ten_phong_ban": nhan_vien.phong_ban.ten_phong_ban if nhan_vien.phong_ban else None,
        "ten_chuc_vu": nhan_vien.chuc_vu_nv.ten_chuc_vu if nhan_vien.chuc_vu_nv else None
    })
    return jsonify({
        "access_token": access_token,
        "nhan_vien": {
            "id": nhan_vien.id,
            "ho_ten": nhan_vien.ho_ten,
            "email": nhan_vien.email,
            "chuc_vu_id": nhan_vien.chuc_vu_id,
            "phong_ban_id": nhan_vien.phong_ban_id,
            "avatar": nhan_vien.avatar,
            "ten_phong_ban": nhan_vien.phong_ban.ten_phong_ban if nhan_vien.phong_ban else None,
            "ten_chuc_vu": nhan_vien.chuc_vu_nv.ten_chuc_vu if nhan_vien.chuc_vu_nv else None
        }
    }), 200


@nhan_vien_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout_nhan_vien():
    current_user = get_jwt_identity()
    return jsonify({"msg": f"Đăng xuất thành công cho {current_user['ho_ten']}"}), 200


# # app/routes/nhan_vien_routes.py
# from flask import Blueprint, request, jsonify
# from werkzeug.security import check_password_hash
# from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# from app.models.nhan_vien_model import NhanVien  # ✅ chốt import
# from app.controllers.nhan_vien_controller import (
#     get_all_nhan_vien_controller,
#     get_nhan_vien_by_id_controller,
#     create_nhan_vien_controller,
#     update_nhan_vien_controller,
#     delete_nhan_vien_controller,
#     search_nhan_vien_theoten_controller,
#     get_nhan_vien_by_trang_thai_controller,      # ✅ THÊM import controller
# )

# nhan_vien_bp = Blueprint('nhan_vien_bp', __name__)

# @nhan_vien_bp.route('/get-all-nhan-vien', methods=['GET'])
# def get_all_nhan_vien():
#     return get_all_nhan_vien_controller()

# @nhan_vien_bp.route('/get-nhan-vien-by-id/<int:id>', methods=['GET'])
# def get_nhan_vien_by_id(id):
#     return get_nhan_vien_by_id_controller(id)

# @nhan_vien_bp.route('/get-nhan-vien-by-trang-thai/<string:trang_thai>', methods=['GET'])
# def get_nhan_vien_by_trang_thai(trang_thai):
#     return get_nhan_vien_by_trang_thai_controller(trang_thai)  # ✅ gọi controller

# @nhan_vien_bp.route('/add-nhan-vien', methods=['POST'])
# def create_nhan_vien():
#     return create_nhan_vien_controller()

# @nhan_vien_bp.route('/edit-nhan-vien/<int:id>', methods=['PUT'])
# def update_nhan_vien(id):
#     return update_nhan_vien_controller(id)

# @nhan_vien_bp.route('/delete-nhan-vien/<int:id>', methods=['DELETE'])
# def delete_nhan_vien(id):
#     return delete_nhan_vien_controller(id)

# @nhan_vien_bp.route("/search_nhanvien_theoten", methods=["GET"])
# def search_nhan_vien_theoten():
#     q = request.args.get("q", "")
#     return search_nhan_vien_theoten_controller(q)

# @nhan_vien_bp.route('/login', methods=['POST', 'OPTIONS'])
# def login_nhan_vien():
#     if request.method == 'OPTIONS':
#         return ('', 204)

#     data = request.get_json(silent=True) or {}
#     email = data.get('email')
#     password = data.get('password')

#     nv = NhanVien.query.filter_by(email=email).first()
#     if not nv or not check_password_hash(nv.password, password):
#         return jsonify({"msg": "Email hoặc mật khẩu không chính xác"}), 401

#     access_token = create_access_token(identity={
#         "id": nv.id,
#         "email": nv.email,
#         "ho_ten": nv.ho_ten,
#         "chuc_vu_id": nv.chuc_vu_id,
#         "phong_ban_id": nv.phong_ban_id
#     })

#     return jsonify({
#         "access_token": access_token,
#         "nhan_vien": {
#             "id": nv.id,
#             "ho_ten": nv.ho_ten,
#             "email": nv.email,
#             "chuc_vu_id": nv.chuc_vu_id,
#             "phong_ban_id": nv.phong_ban_id
#         }
#     }), 200

# @nhan_vien_bp.route('/logout', methods=['POST'])
# @jwt_required()
# def logout_nhan_vien():
#     current_user = get_jwt_identity()
#     return jsonify({"msg": f"Đăng xuất thành công cho {current_user['ho_ten']}"}), 200
