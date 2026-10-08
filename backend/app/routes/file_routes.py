# app/routes/file_routes.py
"""
Route phục vụ file tĩnh (avatar, ảnh chấm công, file căn cứ pháp lý...).

Trước đây 6 route này đăng ký thẳng trên `app` trong run.py — không nằm
trong blueprint nào nên thoát hoàn toàn khỏi lưới JWT/RBAC, và tự ghép
`os.path.join(UPLOAD_FOLDER, filename) + send_file(...)` mà không chặn
path traversal (dấu ".." trong tên file trên Windows đọc được file ngoài
thư mục cho phép, kể cả ".env" chứa JWT_SECRET_KEY). Dồn về 1 blueprint để được quét quyền
như mọi route khác, và dùng send_from_directory (tự chặn traversal).
"""
from flask import Blueprint, send_from_directory, current_app
from app.decorators.auth_decorators import permission_required
from upload_paths import UPLOAD_FOLDER, UPLOAD_FOLDER_KHAUTRU, UPLOAD_FOLDER_PHEPKL, UPLOAD_FOLDER_PHEPNAM

file_bp = Blueprint("file_bp", __name__, url_prefix="/api")


@file_bp.route("/images/<path:filename>")
@permission_required("nhan_vien.xem")
def get_image(filename):
    avatar_dir = current_app.root_path + "/../static/images/avatars"
    return send_from_directory(avatar_dir, filename)


@file_bp.route("/checkin_images/<path:filename>")
@permission_required("cham_cong.xem")
def get_checkin_image(filename):
    checkin_dir = current_app.root_path + "/../static/checkin_images"
    return send_from_directory(checkin_dir, filename)


@file_bp.route("/can_cu_phap_ly_thai_san/<path:filename>")
@permission_required("nghi_phep.xem")
def get_can_cu_phap_ly_thai_san(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@file_bp.route("/can_cu_phap_ly_phep_nam/<path:filename>")
@permission_required("nghi_phep.xem")
def get_can_cu_phap_ly_phep_nam(filename):
    return send_from_directory(UPLOAD_FOLDER_PHEPNAM, filename)


@file_bp.route("/can_cu_phap_ly_phep_kl/<path:filename>")
@permission_required("nghi_phep.xem")
def get_can_cu_phap_ly_phep_kl(filename):
    return send_from_directory(UPLOAD_FOLDER_PHEPKL, filename)


@file_bp.route("/file_dinh_kem_khau_tru/<path:filename>")
@permission_required("khau_tru.xem")
def get_file_dinh_kem_khau_tru(filename):
    return send_from_directory(UPLOAD_FOLDER_KHAUTRU, filename)
