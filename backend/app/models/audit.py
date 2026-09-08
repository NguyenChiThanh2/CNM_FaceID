from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, ForeignKey, event
from sqlalchemy.orm import Session

from app.utils.auth import get_current_user_id


class AuditMixin:
    """Trộn vào 1 model để truy vết ai tạo/sửa dòng dữ liệu, khi nào.

    created_by/updated_by được TỰ ĐỘNG điền bởi event listener before_flush
    bên dưới — không cần mỗi service tự lấy current_user_id rồi gán tay
    (từng có 15+ nơi gọi .soft_delete()/tạo/sửa model mà không chỗ nào nối 2
    cột này cả, khiến chúng luôn NULL dù đã có JWT bắt buộc đăng nhập). Chỉ
    NULL khi thao tác chạy ngoài request context có đăng nhập (vd script seed
    dữ liệu, job nền) — get_current_user_id() trả None an toàn trong trường
    hợp đó thay vì raise lỗi.

    Nếu model đã tự khai created_at/updated_at riêng (vài model cũ), khai báo
    trên chính model đó sẽ tự động ưu tiên hơn — không xung đột, không mất dữ
    liệu cũ."""

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('nhan_vien.id'), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey('nhan_vien.id'), nullable=True)


@event.listens_for(Session, "before_flush")
def _stamp_audit_columns(session, flush_context, instances):
    """Tự động gán created_by (khi tạo mới) và updated_by (khi có cột thực sự
    đổi giá trị) cho MỌI model có AuditMixin, ngay trước khi SQLAlchemy ghi
    xuống DB — 1 chỗ duy nhất, áp dụng cho toàn bộ model có mixin này, không
    phải sửa từng service. Không ghi đè created_by nếu nơi gọi đã tự set sẵn
    (vd script import dữ liệu cũ muốn giữ đúng người tạo gốc)."""
    uid = get_current_user_id()
    for obj in session.new:
        if isinstance(obj, AuditMixin):
            if obj.created_by is None:
                obj.created_by = uid
            if obj.updated_by is None:
                obj.updated_by = uid
    for obj in session.dirty:
        if isinstance(obj, AuditMixin) and session.is_modified(obj, include_collections=False):
            obj.updated_by = uid
