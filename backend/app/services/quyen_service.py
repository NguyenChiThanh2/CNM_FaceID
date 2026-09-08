# app/services/quyen_service.py
from app.models.quyen_model import Quyen


def get_all_quyen_service():
    """Toàn bộ catalog quyền có sẵn trong hệ thống — FE dùng để vẽ checklist gán
    quyền cho vai trò. Danh sách này do backend seed sẵn, không tạo mới qua API."""
    return Quyen.query.order_by(Quyen.module, Quyen.hanh_dong).all()
