from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, ForeignKey


class AuditMixin:
    """Trộn vào 1 model để truy vết ai tạo/sửa dòng dữ liệu, khi nào.

    LƯU Ý QUAN TRỌNG: created_by/updated_by chỉ có giá trị thật khi tầng route
    thực sự xác thực JWT và truyền current_user_id xuống service. Hiện tại hệ
    thống CHƯA bắt buộc đăng nhập ở hầu hết API — 2 cột này sẽ là NULL cho tới
    khi Authentication được nối vào (xem roadmap Bước Auth). Cột đã sẵn sàng
    trong DB, chỉ cần nối JWT vào sau, không cần migration lại.

    Nếu model đã tự khai created_at/updated_at riêng (vài model cũ), khai báo
    trên chính model đó sẽ tự động ưu tiên hơn — không xung đột, không mất dữ
    liệu cũ."""

    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('nhan_vien.id'), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey('nhan_vien.id'), nullable=True)
