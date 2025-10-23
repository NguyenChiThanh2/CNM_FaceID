# app/services/danh_gia_service.py
from datetime import date
from typing import Optional, List, Dict, Any, Tuple

from sqlalchemy.exc import IntegrityError

from app import db
from app.models.danh_gia_model import DanhGia
from app.models.nhan_vien_model import NhanVien  # giả định đã có


# ============== Helpers ==============
def _validate_scores(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """Điểm phải trong [0,10] nếu được cung cấp; tổng trọng số ~ 1 nếu truyền vào."""
    keys_scores = ["diem_chuyen_can", "diem_hieu_qua", "diem_ky_nang", "diem_thai_do", "diem_chu_dong"]
    keys_weights = ["w_chuyen_can", "w_hieu_qua", "w_ky_nang", "w_thai_do", "w_chu_dong"]

    # validate điểm
    for k in keys_scores:
        if k in payload and payload[k] is not None:
            try:
                v = float(payload[k])
            except (TypeError, ValueError):
                return False, f"{k} phải là số."
            if not (0.0 <= v <= 10.0):
                return False, f"{k} phải nằm trong khoảng 0–10."

    # validate tổng trọng số (nếu có truyền trọng số)
    if any(k in payload for k in keys_weights):
        s = 0.0
        for k in keys_weights:
            v = float(payload.get(k, 0.0))
            s += v
        if not (0.999 <= s <= 1.001):
            return False, f"Tổng trọng số phải xấp xỉ 1.0 (hiện tại = {s:.3f})."

    # validate kỳ
    if "ky_loai" in payload and payload["ky_loai"] not in ("MONTH", "QUARTER", "YEAR"):
        return False, "ky_loai phải là 'MONTH' / 'QUARTER' / 'YEAR'."

    return True, ""


def _apply_evidence_compat(obj: DanhGia, payload: Dict[str, Any]) -> None:
    """
    Map dữ liệu minh chứng từ payload vào 5 cột mc_*_ref.
    Hỗ trợ 2 dạng:
      1) Gửi trực tiếp: mc_chuyen_can_ref, mc_hieu_qua_ref, ...
      2) Gửi gộp: minh_chung = { chuyen_can, hieu_qua, ky_nang, thai_do, chu_dong }
    """
    # Dạng 1: set trực tiếp nếu có
    direct_keys = {
        "mc_chuyen_can_ref": "mc_chuyen_can_ref",
        "mc_hieu_qua_ref":   "mc_hieu_qua_ref",
        "mc_ky_nang_ref":    "mc_ky_nang_ref",
        "mc_thai_do_ref":    "mc_thai_do_ref",
        "mc_chu_dong_ref":   "mc_chu_dong_ref",
    }
    for k_attr, k_payload in direct_keys.items():
        if k_payload in payload:
            setattr(obj, k_attr, payload[k_payload])

    # Dạng 2: gộp theo object
    mc = payload.get("minh_chung")
    if isinstance(mc, dict):
        if "chuyen_can" in mc:
            obj.mc_chuyen_can_ref = mc.get("chuyen_can")
        if "hieu_qua" in mc:
            obj.mc_hieu_qua_ref = mc.get("hieu_qua")
        if "ky_nang" in mc:
            obj.mc_ky_nang_ref = mc.get("ky_nang")
        if "thai_do" in mc:
            obj.mc_thai_do_ref = mc.get("thai_do")
        if "chu_dong" in mc:
            obj.mc_chu_dong_ref = mc.get("chu_dong")


# ============== CRUD cơ bản ==============
def get_all_danh_gia_service() -> List[DanhGia]:
    return DanhGia.query.order_by(DanhGia.created_at.desc()).all()


def get_danh_gia_by_id_service(id: int) -> Optional[DanhGia]:
    return DanhGia.query.get(id)


def get_danh_gia_by_nhan_vien_id_service(nhan_vien_id: int) -> List[DanhGia]:
    return (
        DanhGia.query
        .filter(DanhGia.nhan_vien_id == nhan_vien_id)
        .order_by(DanhGia.ky_ngay.desc(), DanhGia.created_at.desc())
        .all()
    )


def list_danh_gia_service(
    ky_ngay: Optional[date] = None,
    ky_loai: Optional[str] = None,
    phong_ban_id: Optional[int] = None,
    reviewer_id: Optional[int] = None,
    nhan_vien_id: Optional[int] = None,
) -> List[DanhGia]:
    q = DanhGia.query.join(NhanVien, NhanVien.id == DanhGia.nhan_vien_id)
    if ky_ngay:
        q = q.filter(DanhGia.ky_ngay == ky_ngay)
    if ky_loai:
        q = q.filter(DanhGia.ky_loai == ky_loai)
    if phong_ban_id:
        q = q.filter(NhanVien.phong_ban_id == phong_ban_id)
    if reviewer_id:
        q = q.filter(DanhGia.nguoi_danh_gia_id == reviewer_id)
    if nhan_vien_id:
        q = q.filter(DanhGia.nhan_vien_id == nhan_vien_id)

    return q.order_by(DanhGia.updated_at.desc()).all()

from datetime import date

def _parse_date_like(v) -> date:
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        return date.fromisoformat(v)
    return None

def _quarter_of_month(m: int) -> int:
    # 1-3:Q1, 4-6:Q2, 7-9:Q3, 10-12:Q4
    return (m - 1) // 3 + 1

def _canonical_ky_ngay(d: date, ky_loai: str) -> date:
    """Đưa ky_ngay về mốc đầu kỳ theo ky_loai."""
    if ky_loai == "YEAR":
        return date(d.year, 1, 1)
    if ky_loai == "QUARTER":
        q = _quarter_of_month(d.month)
        first_month = (q - 1) * 3 + 1
        return date(d.year, first_month, 1)
    # mặc định MONTH
    return date(d.year, d.month, 1)

def _exists_same_period(nhan_vien_id: int, ky_ngay_canon: date, ky_loai: str) -> bool:
    return db.session.query(DanhGia.id).filter(
        DanhGia.nhan_vien_id == nhan_vien_id,
        DanhGia.ky_loai == ky_loai,
        DanhGia.ky_ngay == ky_ngay_canon  # vì ta đã canonicalize
    ).first() is not None

def create_danh_gia_service(payload: Dict[str, Any]) -> Tuple[Optional[DanhGia], Optional[str]]:
    """
    payload bắt buộc:
      - nhan_vien_id (int), nguoi_danh_gia_id (int)
    tùy chọn:
      - ky_ngay (ISO), ky_loai ("MONTH"/"QUARTER"/"YEAR")
      - điểm/trọng số, nhan_xet, phuong_thuc
      - minh_chung (object 5 tiêu chí) HOẶC mc_*_ref (5 cột)
    """
    ok, msg = _validate_scores(payload)
    if not ok:
        return None, msg

    try:
        # 1) Lấy kỳ + chuẩn hoá ngày về mốc đầu kỳ
        ky_loai_val = payload.get("ky_loai", "MONTH")
        ky_ngay_raw = _parse_date_like(payload.get("ky_ngay"))
        if not ky_ngay_raw:
            today = date.today()
            ky_ngay_raw = date(today.year, today.month, 1)
        ky_ngay_canon = _canonical_ky_ngay(ky_ngay_raw, ky_loai_val)

        # 2) Check trùng kỳ (cho message đẹp)
        nv_id = int(payload["nhan_vien_id"])
        if _exists_same_period(nv_id, ky_ngay_canon, ky_loai_val):
            return None, "Đã tồn tại đánh giá cho nhân viên này ở kỳ đã chọn."

        # 3) Tạo model (đặt ky_ngay = canonical)
        dg = DanhGia(
            nhan_vien_id=nv_id,
            nguoi_danh_gia_id=payload["nguoi_danh_gia_id"],
            ky_ngay=ky_ngay_canon,
            ky_loai=ky_loai_val,

            diem_chuyen_can=payload.get("diem_chuyen_can"),
            diem_hieu_qua=payload.get("diem_hieu_qua"),
            diem_ky_nang=payload.get("diem_ky_nang"),
            diem_thai_do=payload.get("diem_thai_do"),
            diem_chu_dong=payload.get("diem_chu_dong"),

            w_chuyen_can=payload.get("w_chuyen_can", DanhGia.w_chuyen_can.default.arg),
            w_hieu_qua=payload.get("w_hieu_qua", DanhGia.w_hieu_qua.default.arg),
            w_ky_nang=payload.get("w_ky_nang", DanhGia.w_ky_nang.default.arg),
            w_thai_do=payload.get("w_thai_do", DanhGia.w_thai_do.default.arg),
            w_chu_dong=payload.get("w_chu_dong", DanhGia.w_chu_dong.default.arg),

            nhan_xet=payload.get("nhan_xet"),
            phuong_thuc=payload.get("phuong_thuc", "MANAGER"),
        )

        # 4) Map minh chứng vào 5 cột (giữ backward-compat)
        _apply_evidence_compat(dg, payload)

        db.session.add(dg)
        db.session.commit()
        return dg, None

    except IntegrityError:
        db.session.rollback()
        # vẫn phòng khi DB ném Unique (ví dụ race-condition)
        return None, "Bản đánh giá cho nhân viên này ở kỳ đã tồn tại hoặc dữ liệu không hợp lệ."
    except KeyError as e:
        db.session.rollback()
        return None, f"Thiếu trường bắt buộc: {str(e)}"
    except Exception as e:
        db.session.rollback()
        return None, str(e)


def update_danh_gia_service(id: int, payload: Dict[str, Any]) -> Tuple[Optional[DanhGia], Optional[str]]:
    dg = DanhGia.query.get(id)
    if not dg:
        return None, "Không tìm thấy bản đánh giá."

    ok, msg = _validate_scores(payload)
    if not ok:
        return None, msg

    try:
        # Clone giá trị hiện tại
        ky_loai_new = payload.get("ky_loai", dg.ky_loai)
        ky_ngay_new = _parse_date_like(payload.get("ky_ngay")) or dg.ky_ngay
        ky_ngay_canon = _canonical_ky_ngay(ky_ngay_new, ky_loai_new)

        # Nếu kỳ thay đổi (hoặc ky_ngay không phải canonical), check trùng
        if ky_loai_new != dg.ky_loai or ky_ngay_canon != dg.ky_ngay or "nhan_vien_id" in payload:
            nv_id_new = int(payload.get("nhan_vien_id", dg.nhan_vien_id))
            exists = (db.session.query(DanhGia.id)
                      .filter(
                          DanhGia.id != dg.id,
                          DanhGia.nhan_vien_id == nv_id_new,
                          DanhGia.ky_loai == ky_loai_new,
                          DanhGia.ky_ngay == ky_ngay_canon
                      ).first() is not None)
            if exists:
                return None, "Đã tồn tại đánh giá cho nhân viên này ở kỳ đã chọn."

        # Gán dữ liệu
        for field in [
            "nhan_vien_id", "nguoi_danh_gia_id",
            "diem_chuyen_can", "diem_hieu_qua", "diem_ky_nang", "diem_thai_do", "diem_chu_dong",
            "w_chuyen_can", "w_hieu_qua", "w_ky_nang", "w_thai_do", "w_chu_dong",
            "nhan_xet", "phuong_thuc"
        ]:
            if field in payload:
                setattr(dg, field, payload[field])

        # set kỳ đã canonicalize
        dg.ky_loai = ky_loai_new
        dg.ky_ngay = ky_ngay_canon

        # Map minh chứng (nếu FE gửi)
        _apply_evidence_compat(dg, payload)

        db.session.commit()
        return dg, None

    except IntegrityError:
        db.session.rollback()
        return None, "Dữ liệu cập nhật vi phạm ràng buộc (có thể trùng kỳ)."
    except Exception as e:
        db.session.rollback()
        return None, str(e)



def delete_danh_gia_service(id: int) -> Tuple[bool, Optional[str]]:
    dg = DanhGia.query.get(id)
    if not dg:
        return False, "Không tìm thấy bản đánh giá."
    try:
        db.session.delete(dg)
        db.session.commit()
        return True, None
    except Exception as e:
        db.session.rollback()
        return False, str(e)


# ============== Trạng thái ==============
def change_status_service(id: int) -> Tuple[Optional[DanhGia], Optional[str]]:
   
    dg = DanhGia.query.get(id)
    if not dg:
        return None, "Không tìm thấy bản đánh giá."
    try:
        db.session.commit()
        return dg, None
    except Exception as e:
        db.session.rollback()
        return None, str(e)
