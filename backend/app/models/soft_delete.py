from datetime import datetime
from sqlalchemy import event, Column, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Session, with_loader_criteria

from app.utils.auth import get_current_user_id


class SoftDeleteMixin:
    """Trộn vào 1 model để có xóa mềm: bản ghi không bao giờ bị xóa cứng khỏi
    DB, chỉ đánh dấu deleted_at. Mọi Model.query... tự động loại bỏ các dòng
    đã bị đánh dấu xóa (xem event do_orm_execute bên dưới) — không cần tự nhớ
    thêm điều kiện lọc ở từng nơi gọi.

    Khai báo deleted_at NGAY TRÊN MIXIN (không phải None) — SQLAlchemy declarative
    tự động copy Column này cho từng model kế thừa, model cụ thể KHÔNG cần tự
    khai lại cột deleted_at nữa."""

    deleted_at = Column(DateTime, nullable=True, index=True)
    deleted_by = Column(Integer, ForeignKey('nhan_vien.id'), nullable=True)

    def soft_delete(self, by_user_id=None):
        """by_user_id: chỉ định tay khi cần (vd script hệ thống); mặc định tự
        lấy người đang đăng nhập — trước đây toàn bộ 15+ nơi gọi .soft_delete()
        trong codebase đều không truyền, khiến deleted_by luôn NULL."""
        self.deleted_at = datetime.utcnow()
        self.deleted_by = by_user_id if by_user_id is not None else get_current_user_id()

    def restore(self):
        self.deleted_at = None
        self.deleted_by = None

    @property
    def is_deleted(self):
        return self.deleted_at is not None


@event.listens_for(Session, "do_orm_execute")
def _exclude_soft_deleted_rows(execute_state):
    """Tự động thêm điều kiện deleted_at IS NULL cho mọi SELECT liên quan tới
    model có SoftDeleteMixin — áp dụng cả cho quan hệ (relationship) lazy-load,
    không chỉ query trực tiếp. Muốn xem cả dòng đã xóa (vd trang admin khôi
    phục), gọi kèm .execution_options(include_deleted=True)."""
    if (
        execute_state.is_select
        and not execute_state.is_column_load
        and not execute_state.is_relationship_load
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteMixin,
                lambda cls: cls.deleted_at.is_(None),
                include_aliases=True,
            )
        )
