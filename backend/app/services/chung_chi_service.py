# app/services/chung_chi_service.py
import os
from datetime import datetime

from flask import current_app
from werkzeug.utils import secure_filename

from app import db
from app.models.bang_cap_chung_chi_model import BangCapChungChi

ALLOWED_CERT_EXTS = {"pdf", "png", "jpg", "jpeg"}


class ChungChiFileError(Exception):
    """File chứng chỉ không lưu được xuống đĩa."""


def allowed_cert(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CERT_EXTS


def _parse_date(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def _save_cert_file(file):
    upload_dir = os.path.join(current_app.static_folder, "certificates")
    os.makedirs(upload_dir, exist_ok=True)

    fname = datetime.now().strftime("%Y%m%d%H%M%S_") + secure_filename(file.filename)
    abs_path = os.path.join(upload_dir, fname)
    try:
        file.save(abs_path)
    except Exception as e:
        current_app.logger.exception(f"Lỗi lưu file chứng chỉ: {e}")
        raise ChungChiFileError("Lỗi lưu file chứng chỉ.") from e

    # lưu tương đối để FE truy cập qua /static/<path>
    return f"certificates/{fname}"


def create_chung_chi_service(nv_id, ten, file=None, loai="certificate", so_hieu=None,
                              to_chuc_cap=None, ngay_cap=None, ngay_het_han=None,
                              xep_loai=None, diem_so=None, ghi_chu=None,
                              credential_id=None, credential_url=None, trang_thai="valid"):
    path = None
    if file and file.filename:
        if not allowed_cert(file.filename):
            raise ValueError("File không hợp lệ (pdf/png/jpg/jpeg)")
        path = _save_cert_file(file)

    cc = BangCapChungChi(
        nhan_vien_id=nv_id,
        loai=loai,
        ten=ten,
        so_hieu=so_hieu,
        to_chuc_cap=to_chuc_cap,
        ngay_cap=_parse_date(ngay_cap),
        ngay_het_han=_parse_date(ngay_het_han),
        xep_loai=xep_loai,
        diem_so=diem_so,
        ghi_chu=ghi_chu,
        tep_dinh_kem=path,
        credential_id=credential_id,
        credential_url=credential_url,
        trang_thai=trang_thai,
    )
    db.session.add(cc)
    db.session.commit()
    return cc


def get_chung_chi_by_nhan_vien_service(nv_id):
    return (
        BangCapChungChi.query.filter_by(nhan_vien_id=nv_id)
        .order_by(BangCapChungChi.ngay_cap.desc())
        .all()
    )


def _nam_trong_thu_muc(duong_dan, thu_muc_goc):
    """True nếu `duong_dan` thực sự nằm trong (hoặc chính là) `thu_muc_goc`.

    Dùng os.path.commonpath thay vì abs_path.startswith(thu_muc_goc) — kiểm
    tra bằng startswith là so sánh CHUỖI thô: "/static_evil".startswith("/static")
    vẫn ra True dù static_evil là 1 thư mục HOÀN TOÀN khác nằm ngoài phạm vi
    cho phép (thiếu dấu phân cách sau prefix). Đây là dạng lỗi cùng họ với
    path traversal — chưa khai thác được ở nơi gọi hiện tại (tep_dinh_kem chỉ
    do server tự sinh qua secure_filename) nhưng vẫn nên sửa đúng ngay từ đầu."""
    try:
        return os.path.commonpath([duong_dan, thu_muc_goc]) == thu_muc_goc
    except ValueError:
        # khác ổ đĩa (Windows) -> chắc chắn không nằm trong thu_muc_goc
        return False


def delete_chung_chi_service(cc_id):
    cc = BangCapChungChi.query.filter_by(id=cc_id).first()
    if not cc:
        return False

    if cc.tep_dinh_kem:
        static_root = os.path.abspath(current_app.static_folder)
        rel_path = cc.tep_dinh_kem.lstrip("/\\")
        abs_path = os.path.abspath(os.path.join(static_root, rel_path))

        # Chặn path traversal và chỉ xóa nếu thực sự nằm trong static/
        if _nam_trong_thu_muc(abs_path, static_root) and os.path.isfile(abs_path):
            try:
                os.remove(abs_path)
            except Exception as e:
                current_app.logger.exception(f"Không xóa được file {abs_path}: {e}")

    cc.soft_delete()
    db.session.commit()
    return True
