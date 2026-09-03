# app/routers/nguoi_phu_thuoc_router.py
from flask import Blueprint, request, jsonify
from sqlalchemy import and_, or_
from datetime import datetime, date

from app import db
from app.models.nguoi_phu_thuoc_model import NguoiPhuThuoc
from app.models.nhan_vien_model import NhanVien

nguoi_phu_thuoc_bp = Blueprint("nguoi_phu_thuoc_bp", __name__)

# ---------- Utils ----------

def parse_date(value, field_name):
    """Parse date from YYYY-MM-DD or DD/MM/YYYY -> date()."""
    if value is None or value == "":
        raise ValueError(f"{field_name} is required")
    if isinstance(value, (datetime, date)):
        return value.date() if isinstance(value, datetime) else value
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"{field_name} must be in YYYY-MM-DD or DD/MM/YYYY format")


def validate_payload(payload, updating=False):
    errors = []
    nhan_vien_id = payload.get("nhan_vien_id")
    if not updating and not nhan_vien_id:
        errors.append("nhan_vien_id is required")

    ho_ten = payload.get("ho_ten")
    if not updating and not ho_ten:
        errors.append("ho_ten is required")

    quan_he = payload.get("quan_he")
    if not updating and not quan_he:
        errors.append("quan_he is required")

    # Dates
    ngay_bat_dau_raw = payload.get("ngay_bat_dau")
    ngay_ket_thuc_raw = payload.get("ngay_ket_thuc")
    try:
        ngay_bat_dau = parse_date(ngay_bat_dau_raw, "ngay_bat_dau") if (ngay_bat_dau_raw or not updating) else None
        ngay_ket_thuc = parse_date(ngay_ket_thuc_raw, "ngay_ket_thuc") if (ngay_ket_thuc_raw or not updating) else None
    except ValueError as e:
        errors.append(str(e))
        ngay_bat_dau = ngay_ket_thuc = None

    if ngay_bat_dau and ngay_ket_thuc and ngay_bat_dau > ngay_ket_thuc:
        errors.append("ngay_bat_dau must be <= ngay_ket_thuc")

    return errors, nhan_vien_id, ho_ten, quan_he, ngay_bat_dau, ngay_ket_thuc


def build_item_dict(item: NguoiPhuThuoc):
    """Chuẩn hóa output 1 record người phụ thuộc kèm tên nhân viên."""
    nv = NhanVien.query.filter_by(id=item.nhan_vien_id).first()
    ten_nhan_vien = nv.ho_ten if nv else None

    base = item.to_dict() if hasattr(item, "to_dict") else {}
    base["ten_nhan_vien"] = ten_nhan_vien
    return base


def check_duplicate_dependent(nhan_vien_id, ho_ten, quan_he, start_date, end_date, exclude_id=None):
    """
    Kiểm tra có người phụ thuộc trùng cho cùng nhân viên trong khoảng thời gian overlap không.
    exclude_id: dùng khi update để bỏ qua chính record đang sửa.
    """
    if not (nhan_vien_id and ho_ten and quan_he and start_date and end_date):
        # thiếu dữ liệu đầu vào thì thôi khỏi check
        return None

    q = NguoiPhuThuoc.query.filter(
        NguoiPhuThuoc.nhan_vien_id == nhan_vien_id,
        NguoiPhuThuoc.ho_ten.ilike(ho_ten.strip()),
        NguoiPhuThuoc.quan_he.ilike(quan_he.strip()),
        # overlap thời gian:
        # (existing.start <= new.end) AND (existing.end >= new.start)
        NguoiPhuThuoc.ngay_bat_dau <= end_date,
        NguoiPhuThuoc.ngay_ket_thuc >= start_date,
    )

    if exclude_id is not None:
        q = q.filter(NguoiPhuThuoc.id != exclude_id)

    dup = q.first()
    if dup:
        nv = NhanVien.query.filter_by(id=nhan_vien_id).first()
        return {
            "duplicate": True,
            "ten_nhan_vien": nv.ho_ten if nv else None
        }
    return None


# ---------- Routes ----------

@nguoi_phu_thuoc_bp.get("/")
def list_nguoi_phu_thuoc():
    """List dependents (no pagination)."""
    try:
        q = (request.args.get("q") or "").strip()
        nhan_vien_id = request.args.get("nhan_vien_id", type=int)
        active_on = request.args.get("active_on")

        query = NguoiPhuThuoc.query

        if nhan_vien_id:
            query = query.filter(NguoiPhuThuoc.nhan_vien_id == nhan_vien_id)

        if q:
            like = f"%{q}%"
            query = query.filter(or_(
                NguoiPhuThuoc.ho_ten.ilike(like),
                NguoiPhuThuoc.quan_he.ilike(like)
            ))

        if active_on:
            try:
                active_date = parse_date(active_on, "active_on")
                query = query.filter(
                    and_(
                        NguoiPhuThuoc.ngay_bat_dau <= active_date,
                        NguoiPhuThuoc.ngay_ket_thuc >= active_date
                    )
                )
            except ValueError as e:
                return jsonify({"message": str(e)}), 400

        items = query.order_by(NguoiPhuThuoc.created_at.desc()).all()

        # ✅ trả kèm tên nhân viên
        result = [build_item_dict(item) for item in items]

        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error listing dependents: {e}"}), 500


@nguoi_phu_thuoc_bp.get("/<int:dep_id>")
def get_nguoi_phu_thuoc(dep_id):
    item = NguoiPhuThuoc.query.filter_by(id=dep_id).first()
    if not item:
        return jsonify({"message": "Không tìm thấy người phụ thuộc"}), 404
    return jsonify(build_item_dict(item)), 200


@nguoi_phu_thuoc_bp.post("/")
def create_nguoi_phu_thuoc():
    try:
        payload = request.get_json(silent=True) or {}
        errors, nhan_vien_id, ho_ten, quan_he, ngay_bat_dau, ngay_ket_thuc = validate_payload(payload, updating=False)
        if errors:
            return jsonify({"message": "; ".join(errors)}), 400

        nv = NhanVien.query.filter_by(id=nhan_vien_id).first()
        if not nv:
            return jsonify({"message": "nhan_vien_id không tồn tại"}), 404

        # ✅ check duplicate
        dup_info = check_duplicate_dependent(
            nhan_vien_id=nhan_vien_id,
            ho_ten=ho_ten,
            quan_he=quan_he,
            start_date=ngay_bat_dau,
            end_date=ngay_ket_thuc,
            exclude_id=None,
        )
        if dup_info and dup_info.get("duplicate"):
            return jsonify({
                "message": "Người phụ thuộc này đã tồn tại cho nhân viên được chọn.",
                "ten_nhan_vien": dup_info.get("ten_nhan_vien", nv.ho_ten),
            }), 400

        item = NguoiPhuThuoc(
            nhan_vien_id=nhan_vien_id,
            ho_ten=ho_ten.strip(),
            quan_he=quan_he.strip(),
            ngay_bat_dau=ngay_bat_dau,
            ngay_ket_thuc=ngay_ket_thuc,
            ghi_chu=(payload.get("ghi_chu") or None)
        )
        db.session.add(item)
        db.session.commit()
        return jsonify({
            "message": "Tạo người phụ thuộc thành công",
            "data": build_item_dict(item)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error creating dependent: {e}"}), 500


@nguoi_phu_thuoc_bp.put("/<int:dep_id>")
@nguoi_phu_thuoc_bp.patch("/<int:dep_id>")
def update_nguoi_phu_thuoc(dep_id):
    try:
        item = NguoiPhuThuoc.query.filter_by(id=dep_id).first()
        if not item:
            return jsonify({"message": "Không tìm thấy người phụ thuộc"}), 404

        payload = request.get_json(silent=True) or {}
        errors, nhan_vien_id, ho_ten, quan_he, ngay_bat_dau, ngay_ket_thuc = validate_payload(payload, updating=True)
        if errors:
            return jsonify({"message": "; ".join(errors)}), 400

        # nếu client không gửi các field -> giữ nguyên bản cũ để check duplicate
        final_nhan_vien_id = nhan_vien_id if nhan_vien_id is not None else item.nhan_vien_id
        final_ho_ten = ho_ten if ho_ten is not None else item.ho_ten
        final_quan_he = quan_he if quan_he is not None else item.quan_he
        final_ngay_bat_dau = ngay_bat_dau if ngay_bat_dau is not None else item.ngay_bat_dau
        final_ngay_ket_thuc = ngay_ket_thuc if ngay_ket_thuc is not None else item.ngay_ket_thuc

        nv = NhanVien.query.filter_by(id=final_nhan_vien_id).first()
        if not nv:
            return jsonify({"message": "nhan_vien_id không tồn tại"}), 404

        # ✅ check duplicate (ngoại trừ chính nó)
        dup_info = check_duplicate_dependent(
            nhan_vien_id=final_nhan_vien_id,
            ho_ten=final_ho_ten,
            quan_he=final_quan_he,
            start_date=final_ngay_bat_dau,
            end_date=final_ngay_ket_thuc,
            exclude_id=item.id,
        )
        if dup_info and dup_info.get("duplicate"):
            return jsonify({
                "message": "Người phụ thuộc này đã tồn tại cho nhân viên được chọn.",
                "ten_nhan_vien": dup_info.get("ten_nhan_vien", nv.ho_ten),
            }), 400

        # --- update fields ---
        if nhan_vien_id is not None:
            item.nhan_vien_id = nhan_vien_id

        if ho_ten is not None:
            item.ho_ten = ho_ten.strip()
        if quan_he is not None:
            item.quan_he = quan_he.strip()
        if ngay_bat_dau is not None:
            item.ngay_bat_dau = ngay_bat_dau
        if ngay_ket_thuc is not None:
            item.ngay_ket_thuc = ngay_ket_thuc
        if "ghi_chu" in payload:
            item.ghi_chu = payload.get("ghi_chu") or None

        # validate lại khoảng thời gian sau update
        if (
            item.ngay_bat_dau
            and item.ngay_ket_thuc
            and item.ngay_bat_dau > item.ngay_ket_thuc
        ):
            return jsonify({"message": "ngay_bat_dau must be <= ngay_ket_thuc"}), 400

        db.session.commit()

        return jsonify({
            "message": "Cập nhật thành công",
            "data": build_item_dict(item)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error updating dependent: {e}"}), 500


@nguoi_phu_thuoc_bp.delete("/<int:dep_id>")
def delete_nguoi_phu_thuoc(dep_id):
    try:
        item = NguoiPhuThuoc.query.filter_by(id=dep_id).first()
        if not item:
            return jsonify({"message": "Không tìm thấy người phụ thuộc"}), 404
        item.soft_delete()
        db.session.commit()
        return jsonify({"message": "Xóa thành công"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error deleting dependent: {e}"}), 500
