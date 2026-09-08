# app/controllers/chung_chi_controller.py
from flask import request, jsonify

from app.models import NhanVien
from app.services.chung_chi_service import (
    create_chung_chi_service,
    get_chung_chi_by_nhan_vien_service,
    delete_chung_chi_service,
    ChungChiFileError,
)


def create_chung_chi_controller(nv_id):
    nv = NhanVien.query.filter_by(id=nv_id).first()
    if not nv:
        return jsonify({"message": "Nhân viên không tồn tại"}), 404

    ten = (request.form.get("ten") or "").strip()
    if not ten:
        return jsonify({"message": "Tên chứng chỉ/bằng cấp là bắt buộc"}), 400

    try:
        cc = create_chung_chi_service(
            nv_id=nv.id,
            ten=ten,
            file=request.files.get("tep"),
            loai=request.form.get("loai", "certificate"),
            so_hieu=request.form.get("so_hieu"),
            to_chuc_cap=request.form.get("to_chuc_cap"),
            ngay_cap=request.form.get("ngay_cap"),
            ngay_het_han=request.form.get("ngay_het_han"),
            xep_loai=request.form.get("xep_loai"),
            diem_so=request.form.get("diem_so"),
            ghi_chu=request.form.get("ghi_chu"),
            credential_id=request.form.get("credential_id"),
            credential_url=request.form.get("credential_url"),
            trang_thai=request.form.get("trang_thai", "valid"),
        )
        return jsonify(cc.to_dict()), 201
    except ChungChiFileError as e:
        return jsonify({"message": str(e)}), 500
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


def get_chung_chi_by_nhan_vien_controller(nv_id):
    data = [cc.to_dict() for cc in get_chung_chi_by_nhan_vien_service(nv_id)]
    return jsonify(data)


def delete_chung_chi_controller(cc_id):
    deleted = delete_chung_chi_service(cc_id)
    if not deleted:
        return jsonify({"message": "Không tìm thấy chứng chỉ/bằng cấp"}), 404
    return jsonify({"message": "Đã xóa chứng chỉ và (nếu có) file đính kèm."}), 200
