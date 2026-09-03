# app/routes/chung_chi_routes.py
from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import NhanVien
from app.models.bang_cap_chung_chi_model import BangCapChungChi
import os
from werkzeug.utils import secure_filename
from datetime import datetime

chung_chi_bp = Blueprint("chung_chi", __name__)

ALLOWED_CERT_EXTS = {"pdf", "png", "jpg", "jpeg"}

def allowed_cert(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CERT_EXTS

@chung_chi_bp.route("/nhan_vien/<int:nv_id>/chung_chi", methods=["POST"])
def create_chung_chi(nv_id):
    nv = NhanVien.query.filter_by(id=nv_id).first_or_404()

    # --- nhận file đính kèm (field tên "tep") ---
    f = request.files.get("tep")
    path = None
    if f and f.filename:
        if not allowed_cert(f.filename):
            return jsonify({"message": "File không hợp lệ (pdf/png/jpg/jpeg)"}), 400

        # Lưu vào <static>/certificates
        upload_dir = os.path.join(current_app.static_folder, "certificates")
        os.makedirs(upload_dir, exist_ok=True)

        fname = datetime.now().strftime("%Y%m%d%H%M%S_") + secure_filename(f.filename)
        abs_path = os.path.join(upload_dir, fname)
        try:
            f.save(abs_path)
        except Exception as e:
            current_app.logger.exception(f"Lỗi lưu file chứng chỉ: {e}")
            return jsonify({"message": "Lỗi lưu file chứng chỉ."}), 500

        # lưu tương đối để FE truy cập qua /static/<path>
        path = f"certificates/{fname}"

    # --- parse ngày linh hoạt ---
    def parse_date(s):
        if not s:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(s, fmt).date()
            except Exception:
                pass
        return None

    # --- tạo bản ghi ---
    ten = (request.form.get("ten") or "").strip()
    if not ten:
        return jsonify({"message": "Tên chứng chỉ/bằng cấp là bắt buộc"}), 400

    cc = BangCapChungChi(
        nhan_vien_id=nv.id,
        loai=request.form.get("loai", "certificate"),
        ten=ten,
        so_hieu=request.form.get("so_hieu"),
        to_chuc_cap=request.form.get("to_chuc_cap"),
        ngay_cap=parse_date(request.form.get("ngay_cap")),
        ngay_het_han=parse_date(request.form.get("ngay_het_han")),
        xep_loai=request.form.get("xep_loai"),
        diem_so=request.form.get("diem_so"),
        ghi_chu=request.form.get("ghi_chu"),
        tep_dinh_kem=path,
        credential_id=request.form.get("credential_id"),
        credential_url=request.form.get("credential_url"),
        trang_thai=request.form.get("trang_thai", "valid"),
    )

    db.session.add(cc)
    db.session.commit()
    return jsonify(cc.to_dict()), 201

@chung_chi_bp.route("/nhan_vien/<int:nv_id>/chung_chi", methods=["GET"])
def list_chung_chi(nv_id):
    data = [
        cc.to_dict()
        for cc in BangCapChungChi.query.filter_by(nhan_vien_id=nv_id)
        .order_by(BangCapChungChi.ngay_cap.desc())
        .all()
    ]
    return jsonify(data)

@chung_chi_bp.route("/chung_chi/<int:cc_id>", methods=["DELETE"])
def delete_chung_chi(cc_id):
    cc = BangCapChungChi.query.filter_by(id=cc_id).first_or_404()

    # Xóa file vật lý nếu có
    if cc.tep_dinh_kem:
        # ví dụ: "certificates/20251008_...pdf"
        rel_path = cc.tep_dinh_kem.lstrip("/\\")
        abs_path = os.path.abspath(os.path.join(current_app.static_folder, rel_path))

        # Chặn path traversal và chỉ xóa nếu thực sự nằm trong static/
        static_root = os.path.abspath(current_app.static_folder)
        if abs_path.startswith(static_root) and os.path.isfile(abs_path):
            try:
                os.remove(abs_path)
            except Exception as e:
                current_app.logger.exception(f"Không xóa được file {abs_path}: {e}")
                # (tuỳ bạn: có thể return 500 nếu muốn bắt buộc xóa file)

    cc.soft_delete()
    db.session.commit()
    return jsonify({"message": "Đã xóa chứng chỉ và (nếu có) file đính kèm."}), 200