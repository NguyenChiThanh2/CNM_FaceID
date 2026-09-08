# app/decorators/auth_decorators.py
from functools import wraps

from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.models import NhanVien

_KHONG_CO_QUYEN = ({"message": "Bạn không có quyền thực hiện thao tác này"}, 403)

_METHOD_TO_HANH_DONG = {
    "GET": "xem",
    "POST": "them",
    "PUT": "sua",
    "PATCH": "sua",
    "DELETE": "xoa",
}


def get_current_nhan_vien():
    """Trả về NhanVien đang đăng nhập (dựa trên JWT identity = id dạng string)."""
    nv_id = get_jwt_identity()
    if nv_id is None:
        return None
    return NhanVien.query.get(int(nv_id))


# ID phòng ban Nhân sự — trùng với HR_DEPARTMENT_ID đã dùng ở FE (vd
# frontend/src/pages/modules/QuanLyGiayPhep.jsx) để ẩn/hiện nút duyệt. Đặt ở
# đây (thay vì thêm permission code riêng như "giay_phep.duyet") vì đây chỉ
# là 1 field có sẵn trên NhanVien, và BE trước đây hoàn toàn KHÔNG kiểm tra
# lại luật "chỉ HR mới được duyệt" này — chỉ có FE ẩn nút, ai gọi thẳng API
# vẫn duyệt được đơn của bất kỳ ai nếu vai trò của họ có quyền "sua" trên
# module đó (vd nhân viên thường cần quyền này để tự sửa đơn CỦA MÌNH).
PHONG_BAN_NHAN_SU_ID = 2


def is_hr(nhan_vien):
    """True nếu `nhan_vien` thuộc phòng Nhân sự — được coi là người có quyền
    duyệt/từ chối đơn của người khác (giấy phép, nghỉ phép...)."""
    return bool(nhan_vien) and nhan_vien.phong_ban_id == PHONG_BAN_NHAN_SU_ID


def permission_required(ma_quyen):
    """Chặn route nếu nhân viên hiện tại không có quyền `ma_quyen` (vd "luong.xem").

    Query CSDL để lấy quyền MỖI request (không đọc từ JWT) — vì quyền của 1 vai
    trò có thể bị admin thay đổi bất cứ lúc nào qua API quản lý vai trò, và thay
    đổi đó phải có tác dụng ngay, không đợi người dùng đăng nhập lại.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            nv = get_current_nhan_vien()
            if not nv or not nv.vai_tro:
                return jsonify(_KHONG_CO_QUYEN[0]), _KHONG_CO_QUYEN[1]
            ma_quyen_cua_nv = {q.ma_quyen for q in nv.vai_tro.quyen_list}
            if ma_quyen not in ma_quyen_cua_nv:
                return jsonify(_KHONG_CO_QUYEN[0]), _KHONG_CO_QUYEN[1]
            return f(*args, **kwargs)
        return wrapper
    return decorator


def require_module_permission(module):
    """Trả về 1 hàm before_request tự suy ra quyền cần thiết từ HTTP method của
    request hiện tại (GET->xem, POST->them, PUT/PATCH->sua, DELETE->xoa) ghép
    với `module` cố định của blueprint — dùng khi CẢ blueprint đi theo đúng quy
    ước "1 route = 1 hành động CRUD chuẩn theo method".

    Route nào trong blueprint có hành động không theo chuẩn (vd duyệt/từ chối
    dùng PUT nhưng không phải "sửa" theo nghĩa CRUD thông thường) vẫn được tính
    là "sua" theo method — chấp nhận đơn giản hóa này thay vì tách quyền riêng
    cho từng hành động nghiệp vụ đặc thù.
    """
    def _check():
        if request.method == "OPTIONS":
            return None
        verify_jwt_in_request()
        hanh_dong = _METHOD_TO_HANH_DONG.get(request.method, "xem")
        ma_quyen = f"{module}.{hanh_dong}"
        nv = get_current_nhan_vien()
        if not nv or not nv.vai_tro:
            return jsonify(_KHONG_CO_QUYEN[0]), _KHONG_CO_QUYEN[1]
        if ma_quyen not in {q.ma_quyen for q in nv.vai_tro.quyen_list}:
            return jsonify(_KHONG_CO_QUYEN[0]), _KHONG_CO_QUYEN[1]
        return None
    return _check
