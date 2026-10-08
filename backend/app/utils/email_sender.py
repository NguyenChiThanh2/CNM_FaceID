import os
import smtplib
from email.mime.text import MIMEText


class EmailSendError(Exception):
    """Gửi email thất bại — sai/thiếu cấu hình SMTP, mất mạng, hoặc bị SMTP
    server từ chối. Nơi gọi hàm send_email nên coi đây là tín hiệu để KHÔNG
    tiếp tục ghi thay đổi xuống DB (vd đổi mật khẩu) nếu thay đổi đó chỉ có
    ý nghĩa khi email đã tới tay người nhận."""


def send_email(to_address, subject, body):
    """Gửi 1 email dạng text thuần qua SMTP (dùng smtplib có sẵn trong Python,
    không cần cài thêm thư viện). Cấu hình đọc từ biến môi trường — xem .env
    (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM).

    Raise EmailSendError (không phải raise thẳng lỗi gốc của smtplib) để nơi
    gọi chỉ cần bắt đúng 1 loại exception, không cần biết chi tiết bên trong
    dùng thư viện gì."""
    host = os.environ.get("SMTP_HOST")
    port = int(os.environ.get("SMTP_PORT") or 587)
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    from_address = os.environ.get("SMTP_FROM") or user

    if not host or not user or not password:
        raise EmailSendError(
            "Chưa cấu hình SMTP đầy đủ (cần SMTP_HOST, SMTP_USER, SMTP_PASSWORD trong .env)"
        )

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = from_address
    msg["To"] = to_address

    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_address, [to_address], msg.as_string())
    except EmailSendError:
        raise
    except Exception as e:
        raise EmailSendError(f"Gửi email tới {to_address} thất bại: {e}") from e
