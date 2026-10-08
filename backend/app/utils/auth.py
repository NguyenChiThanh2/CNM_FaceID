from flask_jwt_extended import get_jwt_identity


def get_current_user_id():
    """Id nhân viên đang đăng nhập, lấy từ JWT identity (được set là string ở
    lúc login — xem create_access_token trong nhan_vien_routes.py).

    Trả về None (không raise lỗi) khi không có JWT hợp lệ trong request hiện
    tại, hoặc khi gọi ngoài request context (script seed dữ liệu, job nền...)
    — để các nơi dùng hàm này (vd audit trail tự động trong AuditMixin/
    SoftDeleteMixin) không làm sập những luồng không có người dùng đăng nhập."""
    try:
        uid = get_jwt_identity()
        return int(uid) if uid is not None else None
    except Exception:
        return None
