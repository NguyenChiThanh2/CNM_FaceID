from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from app.decorators.auth_decorators import require_module_permission
from app.models import NhanVien
from app import limiter
from app.controllers.nhan_vien_controller import (
    get_all_nhan_vien_controller,
    get_nhan_vien_by_id_controller,
    get_nhan_vien_by_trang_thai_controller,
    create_nhan_vien_controller,
    update_nhan_vien_controller,
    delete_nhan_vien_controller,
    search_nhan_vien_theoten_controller
)

nhan_vien_bp = Blueprint('nhan_vien_bp', __name__)


# /login là nơi lấy token, chưa thể yêu cầu quyền ở đây. /logout chỉ cần đang
# đăng nhập (đã có @jwt_required() riêng ở route đó), không cần quyền nghiệp vụ
# cụ thể nào — đăng xuất không phải hành động "sửa nhân viên". request.method
# == 'OPTIONS' phải bỏ qua vì đó là preflight CORS của trình duyệt.
_KHONG_CAN_QUYEN = {'nhan_vien_bp.login_nhan_vien', 'nhan_vien_bp.logout_nhan_vien'}


@nhan_vien_bp.before_request
def _require_permission():
    if request.endpoint in _KHONG_CAN_QUYEN or request.method == 'OPTIONS':
        return
    return require_module_permission("nhan_vien")()


@nhan_vien_bp.route('/get-all-nhan-vien', methods=['GET'])
def get_all_nhan_vien():
    return get_all_nhan_vien_controller()       

@nhan_vien_bp.route('/get-nhan-vien-by-id/<int:id>', methods=['GET'])
def get_nhan_vien_by_id(id):
    return get_nhan_vien_by_id_controller(id)

@nhan_vien_bp.route('/get-nhan-vien-by-trang-thai/<string:trang_thai>', methods=['GET'])
def get_nhan_vien_by_trang_thai(trang_thai):
    return get_nhan_vien_by_trang_thai_controller(trang_thai)

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
# Chặn brute-force dò mật khẩu: tối đa 5 lần thử/phút cho mỗi IP. Chỉ áp cho
# POST (methods=["POST"]) — không tính request OPTIONS (preflight CORS của
# trình duyệt) vào hạn mức này.
@limiter.limit("5 per minute", methods=["POST"])
def login_nhan_vien():
    if request.method == 'OPTIONS':
        # Cho phép preflight CORS
        return ('', 204)

    data = request.get_json(silent=True) or {}
    email = data.get('email')
    password = data.get('password')

    # Tìm nhân viên theo email
    nhan_vien = NhanVien.query.filter_by(email=email).first()

    if not nhan_vien or not check_password_hash(nhan_vien.password, password):
        return jsonify({"msg": "Email hoặc mật khẩu không chính xác"}), 401
    
    # Tạo token đăng nhập
    # "sub" (identity) phải là string theo chuẩn JWT — Flask-JWT-Extended chỉ
    # validate điều này lúc GIẢI MÃ (verify_jwt_in_request/jwt_required), không
    # phải lúc tạo token, nên trước đây nhét cả dict vào identity vẫn tạo được
    # token bình thường nhưng mọi lần xác thực sau đó đều crash 422 "Subject
    # must be a string". Thông tin còn lại đưa vào additional_claims.
    access_token = create_access_token(
        identity=str(nhan_vien.id),
        additional_claims={
            "email": nhan_vien.email,
            "ho_ten": nhan_vien.ho_ten,
            "chuc_vu_id": nhan_vien.chuc_vu_id,
            "phong_ban_id": nhan_vien.phong_ban_id,
            "avatar": nhan_vien.avatar,
            "ten_phong_ban": nhan_vien.phong_ban.ten_phong_ban if nhan_vien.phong_ban else None,
            "ten_chuc_vu": nhan_vien.chuc_vu_nv.ten_chuc_vu if nhan_vien.chuc_vu_nv else None,
        },
    )
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
    ho_ten = get_jwt().get("ho_ten")
    return jsonify({"msg": f"Đăng xuất thành công cho {ho_ten}"}), 200


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
