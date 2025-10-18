# app/routes/hopdong_routes.py (BE — full, fixed)
from flask import Blueprint, jsonify, request
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
import re
from app import db
from app.models.hopdong_laodong_model import HopDongLaoDong

# Đảm bảo blueprint gắn với /api để khớp FE gọi /api/hop-dong
hopdong_bp = Blueprint("hopdong_bp", __name__, url_prefix="/api")

# ---------------- Helpers an toàn kiểu dữ liệu ----------------
def noneish(v):
    if v is None:
        return True
    if isinstance(v, str) and v.strip().lower() in ("", "null", "none"):
        return True
    return False

def to_float(v, default=None):
    if noneish(v):
        return default
    try:
        return float(v)
    except Exception:
        raise ValueError(f"Giá trị phải là số: {v}")

def to_int(v, default=None):
    if noneish(v):
        return default
    try:
        return int(v)
    except Exception:
        raise ValueError(f"Giá trị phải là số nguyên: {v}")

# ---------------- Helpers thời gian ----------------
def parse_yyyy_mm_dd(s):
    if noneish(s):
        return None
    return datetime.strptime(str(s), "%Y-%m-%d").date()

def normalize_label(s: str) -> str:
    return s.strip().capitalize() if s else None

def parse_duration(label: str):
    """
    Chuyển 'thoi_gian_hop_dong' thành (relativedelta|None, normalized_label).
    Hỗ trợ: '12', '12m', '12 tháng', '1 năm', '1 năm 6 tháng', '365 ngày',
            'P1Y2M10D', 'không thời hạn' (kể cả không dấu/viết tắt)
    """
    if not label:
        return None, None

    s = label.strip().lower()
    if s in [
        "không thời hạn", "khong thoi han", "kth", "indef", "indefinite", "permanent"
    ]:
        return None, "Không thời hạn"

    # ISO-8601: PnYnMnD
    m_iso = re.fullmatch(r"p(?:(\d+)y)?(?:(\d+)m)?(?:(\d+)d)?", s)
    if m_iso:
        y = int(m_iso.group(1) or 0)
        mo = int(m_iso.group(2) or 0)
        d = int(m_iso.group(3) or 0)
        rd = relativedelta(years=y, months=mo, days=d)
        parts = []
        if y: parts.append(f"{y} năm")
        if mo: parts.append(f"{mo} tháng")
        if d: parts.append(f"{d} ngày")
        return rd, (" ".join(parts) if parts else "0 ngày")

    # Chỉ số -> mặc định tháng
    if re.fullmatch(r"\d+", s):
        mo = int(s)
        return relativedelta(months=mo), f"{mo} tháng"

    # Gom nhiều cặp số + đơn vị
    years = months = days = 0
    tokens = re.findall(r"(\d+)\s*(năm|nam|y|year|years|tháng|thang|m|month|months|ngày|ngay|d|day|days)", s)
    for num, unit in tokens:
        n = int(num)
        if unit in ["năm", "nam", "y", "year", "years"]:
            years += n
        elif unit in ["tháng", "thang", "m", "month", "months"]:
            months += n
        elif unit in ["ngày", "ngay", "d", "day", "days"]:
            days += n

    if years == months == days == 0:
        # Không nhận diện được
        return None, normalize_label(label)

    rd = relativedelta(years=years, months=months, days=days)
    parts = []
    if years: parts.append(f"{years} năm")
    if months: parts.append(f"{months} tháng")
    if days: parts.append(f"{days} ngày")
    return rd, " ".join(parts)

def compute_end_date(start_date, duration_rd):
    if not start_date or not duration_rd:
        return None
    end_exclusive = start_date + duration_rd
    return end_exclusive - timedelta(days=1)

# ---------------- Routes ----------------
@hopdong_bp.route("/hop-dong/by-nhan-vien/<int:nv_id>", methods=["GET"])
def get_active_contract_by_nhan_vien(nv_id):
    today = date.today()
    active = (
        HopDongLaoDong.query
        .filter(
            HopDongLaoDong.nhan_vien_id == nv_id,
            HopDongLaoDong.trang_thai.is_(True),
            HopDongLaoDong.ngay_bat_dau <= today,
            (HopDongLaoDong.ngay_ket_thuc.is_(None) | (HopDongLaoDong.ngay_ket_thuc >= today))
        )
        .order_by(HopDongLaoDong.ngay_bat_dau.desc())
        .first()
    )
    if active:
        return jsonify(active.to_dict()), 200

    latest = (
        HopDongLaoDong.query
        .filter(HopDongLaoDong.nhan_vien_id == nv_id)
        .order_by(HopDongLaoDong.ngay_bat_dau.desc())
        .first()
    )
    return jsonify(latest.to_dict() if latest else None), 200

@hopdong_bp.route("/hop-dong", methods=["POST"])
def create_hop_dong():
    # Chỉ nhận JSON từ FE
    data = request.get_json(silent=True) or {}

    # Validate bắt buộc
    if noneish(data.get("nhan_vien_id")):
        return jsonify({"message": "Thiếu nhan_vien_id"}), 400
    if noneish(data.get("loai_hop_dong")):
        return jsonify({"message": "Thiếu loai_hop_dong"}), 400

    try:
        nhan_vien_id = to_int(data.get("nhan_vien_id"))
        ngay_bat_dau = parse_yyyy_mm_dd(data.get("ngay_bat_dau"))
        if not ngay_bat_dau:
            return jsonify({"message": "ngay_bat_dau là bắt buộc, định dạng YYYY-MM-DD"}), 400

        rd, normalized_label = parse_duration(data.get("thoi_gian_hop_dong"))
        if rd is None:
            if not (normalized_label and normalized_label.lower() == "không thời hạn"):
                return jsonify({"message": "thoi_gian_hop_dong không hợp lệ"}), 400
            ngay_ket_thuc = None
        else:
            ngay_ket_thuc = compute_end_date(ngay_bat_dau, rd)

        hopdong = HopDongLaoDong(
            nhan_vien_id=nhan_vien_id,
            quyche_id=to_int(data.get("quyche_id")),
            ngay_bat_dau=ngay_bat_dau,
            ngay_ket_thuc=ngay_ket_thuc,
            loai_hop_dong=data["loai_hop_dong"],

            muc_luong_co_ban=to_float(data.get("muc_luong_co_ban"), 0.0),
            di_tre_phat=to_float(data.get("di_tre_phat")),
            ve_som_phat=to_float(data.get("ve_som_phat")),
            tang_ca_heso=to_float(data.get("tang_ca_heso")),
            luong_ngay_le_heso=to_float(data.get("luong_ngay_le_heso")),
            luong_cuoi_tuan_heso=to_float(data.get("luong_cuoi_tuan_heso")),

            phu_cap_an_trua=to_float(data.get("phu_cap_an_trua"), 0.0),
            phu_cap_xang_xe=to_float(data.get("phu_cap_xang_xe"), 0.0),
            phu_cap_doc_hai=to_float(data.get("phu_cap_doc_hai"), 0.0),
            phu_cap_trach_nhiem=to_float(data.get("phu_cap_trach_nhiem"), 0.0),
            phu_cap_chuc_vu=to_float(data.get("phu_cap_chuc_vu"), 0.0),
            phu_cap_tham_nien=to_float(data.get("phu_cap_tham_nien"), 0.0),

            dieu_khoan_khac=data.get("dieu_khoan_khac"),
            phep_nam=to_int(data.get("phep_nam"), 0),
            trang_thai=bool(data.get("trang_thai", True)),
            thoi_gian_hop_dong=normalized_label,
        )
        db.session.add(hopdong)
        db.session.commit()
        return jsonify(hopdong.to_dict()), 201
    except ValueError as ve:
        db.session.rollback()
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        print("❌ Lỗi tạo hợp đồng:", e)
        return jsonify({"message": "Tạo hợp đồng thất bại", "error": str(e)}), 500

@hopdong_bp.route("/hop-dong/<int:id>", methods=["PUT"])
def update_hop_dong(id):
    hopdong = HopDongLaoDong.query.get(id)
    if not hopdong:
        return jsonify({"message": "Không tìm thấy hợp đồng"}), 404

    data = request.get_json(silent=True) or {}
    try:
        # Cập nhật ngày bắt đầu
        if "ngay_bat_dau" in data:
            hopdong.ngay_bat_dau = parse_yyyy_mm_dd(data.get("ngay_bat_dau"))

        # Cập nhật thời hạn (tính lại end)
        recompute_end = False
        if "thoi_gian_hop_dong" in data:
            rd, normalized_label = parse_duration(data.get("thoi_gian_hop_dong"))
            if rd is None and (normalized_label and normalized_label.lower() != "không thời hạn"):
                return jsonify({"message": "thoi_gian_hop_dong không hợp lệ"}), 400
            hopdong.thoi_gian_hop_dong = normalized_label
            recompute_end = True
            if normalized_label and normalized_label.lower() == "không thời hạn":
                hopdong.ngay_ket_thuc = None
            else:
                hopdong.ngay_ket_thuc = compute_end_date(hopdong.ngay_bat_dau, rd)

        if ("ngay_bat_dau" in data) and not recompute_end:
            if hopdong.thoi_gian_hop_dong and hopdong.thoi_gian_hop_dong.lower() != "không thời hạn":
                rd, _ = parse_duration(hopdong.thoi_gian_hop_dong)
                hopdong.ngay_ket_thuc = compute_end_date(hopdong.ngay_bat_dau, rd)

        # Các field đơn giản
        for field in [
            "nhan_vien_id", "quyche_id", "loai_hop_dong", "dieu_khoan_khac", "trang_thai"
        ]:
            if field in data:
                if field in ("nhan_vien_id", "quyche_id"):
                    setattr(hopdong, field, to_int(data.get(field)))
                elif field == "trang_thai":
                    setattr(hopdong, field, bool(data.get(field)))
                else:
                    setattr(hopdong, field, data.get(field))

        # Nhóm số/float an toàn
        for f in [
            "muc_luong_co_ban", "di_tre_phat", "ve_som_phat", "tang_ca_heso",
            "luong_ngay_le_heso", "luong_cuoi_tuan_heso",
            "phu_cap_an_trua", "phu_cap_xang_xe", "phu_cap_doc_hai",
            "phu_cap_trach_nhiem", "phu_cap_chuc_vu", "phu_cap_tham_nien"
        ]:
            if f in data:
                setattr(hopdong, f, to_float(data.get(f), getattr(hopdong, f)))

        if "phep_nam" in data and not noneish(data.get("phep_nam")):
            hopdong.phep_nam = to_int(data.get("phep_nam"), hopdong.phep_nam)

        db.session.commit()
        return jsonify(hopdong.to_dict()), 200
    except ValueError as ve:
        db.session.rollback()
        return jsonify({"message": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        print("❌ Lỗi cập nhật hợp đồng:", e)
        return jsonify({"message": "Cập nhật hợp đồng thất bại", "error": str(e)}), 500

@hopdong_bp.route("/hop-dong/by-nhan-vien/batch", methods=["POST"])
def get_contracts_batch():
    data = request.get_json(silent=True) or {}
    ids = data.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Danh sách id không hợp lệ"}), 400

    today = date.today()
    results = {}

    all_hd = (
        HopDongLaoDong.query
        .filter(HopDongLaoDong.nhan_vien_id.in_(ids))
        .order_by(HopDongLaoDong.nhan_vien_id, HopDongLaoDong.ngay_bat_dau.desc())
        .all()
    )

    for hd in all_hd:
        nv_id = hd.nhan_vien_id
        if nv_id not in results:
            if hd.trang_thai and (
                hd.ngay_bat_dau <= today and
                (hd.ngay_ket_thuc is None or hd.ngay_ket_thuc >= today)
            ):
                results[nv_id] = hd.to_dict()
            else:
                results.setdefault(nv_id, hd.to_dict())

    return jsonify(results), 200

@hopdong_bp.route("/hop-dong/nhan-vien/<int:nv_id>", methods=["GET"])
def get_all_contracts_by_nhan_vien(nv_id):
    hopdongs = (
        HopDongLaoDong.query
        .filter(HopDongLaoDong.nhan_vien_id == nv_id)
        .order_by(HopDongLaoDong.ngay_bat_dau.asc())
        .all()
    )
    data = [hd.to_dict() for hd in hopdongs]
    return jsonify(data), 200
