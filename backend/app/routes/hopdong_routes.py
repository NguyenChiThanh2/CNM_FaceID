# routes/hopdong_routes.py
from flask import Blueprint, jsonify, request
from datetime import date, datetime
from app.models.hopdong_laodong_model import HopDongLaoDong
from app import db

hopdong_bp = Blueprint("hopdong_bp", __name__)

# =====================
# 🔹 Lấy hợp đồng hiện tại theo nhân viên
# =====================
@hopdong_bp.route("/hop-dong/by-nhan-vien/<int:nv_id>", methods=["GET"])
def get_active_contract_by_nhan_vien(nv_id):
    today = date.today()

    active = (
        HopDongLaoDong.query
        .filter(
            HopDongLaoDong.nhan_vien_id == nv_id,
            HopDongLaoDong.trang_thai == True,
            HopDongLaoDong.ngay_bat_dau <= today,
            (HopDongLaoDong.ngay_ket_thuc == None) | (HopDongLaoDong.ngay_ket_thuc >= today)
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


# =====================
# 🔹 Tạo mới hợp đồng lao động
# =====================
@hopdong_bp.route("/api/hop-dong", methods=["POST"])
def create_hop_dong():
    data = request.get_json()
    if not data or "nhan_vien_id" not in data:
        return jsonify({"message": "Thiếu nhan_vien_id"}), 400

    try:
        hopdong = HopDongLaoDong(
            nhan_vien_id=data["nhan_vien_id"],
            quyche_id=data.get("quyche_id"),
            ngay_bat_dau=datetime.strptime(data["ngay_bat_dau"], "%Y-%m-%d").date(),
            ngay_ket_thuc=datetime.strptime(data["ngay_ket_thuc"], "%Y-%m-%d").date()
                if data.get("ngay_ket_thuc") else None,
            loai_hop_dong=data["loai_hop_dong"],
            muc_luong_co_ban=float(data["muc_luong_co_ban"]),
            di_tre_phat=data.get("di_tre_phat"),
            ve_som_phat=data.get("ve_som_phat"),
            tang_ca_heso=data.get("tang_ca_heso"),
            luong_ngay_le_heso=data.get("luong_ngay_le_heso"),
            luong_cuoi_tuan_heso=data.get("luong_cuoi_tuan_heso"),
            phu_cap_an_trua=data.get("phu_cap_an_trua", 0.0),
            phu_cap_xang_xe=data.get("phu_cap_xang_xe", 0.0),
            phu_cap_doc_hai=data.get("phu_cap_doc_hai", 0.0),
            phu_cap_trach_nhiem=data.get("phu_cap_trach_nhiem", 0.0),
            phu_cap_chuc_vu=data.get("phu_cap_chuc_vu", 0.0),
            phu_cap_tham_nien=data.get("phu_cap_tham_nien", 0.0),
            dieu_khoan_khac=data.get("dieu_khoan_khac"),
            phep_nam=data.get("phep_nam", 0),
            trang_thai=bool(data.get("trang_thai", True))
        )
        db.session.add(hopdong)
        db.session.commit()
        return jsonify(hopdong.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print("❌ Lỗi tạo hợp đồng:", e)
        return jsonify({"message": "Tạo hợp đồng thất bại", "error": str(e)}), 500


# =====================
# 🔹 Cập nhật hợp đồng lao động
# =====================
@hopdong_bp.route("/api/hop-dong/<int:id>", methods=["PUT"])
def update_hop_dong(id):
    hopdong = HopDongLaoDong.query.get(id)
    if not hopdong:
        return jsonify({"message": "Không tìm thấy hợp đồng"}), 404

    data = request.get_json()
    try:
        # Cập nhật từng trường (nếu có)
        for field in [
            "nhan_vien_id", "quyche_id", "loai_hop_dong", "muc_luong_co_ban",
            "di_tre_phat", "ve_som_phat", "tang_ca_heso", "luong_ngay_le_heso",
            "luong_cuoi_tuan_heso", "phu_cap_an_trua", "phu_cap_xang_xe",
            "phu_cap_doc_hai", "phu_cap_trach_nhiem", "phu_cap_chuc_vu",
            "phu_cap_tham_nien", "phep_nam", "dieu_khoan_khac", "trang_thai"
        ]:
            if field in data:
                setattr(hopdong, field, data[field])

        # parse ngày
        if "ngay_bat_dau" in data:
            hopdong.ngay_bat_dau = datetime.strptime(data["ngay_bat_dau"], "%Y-%m-%d").date()
        if "ngay_ket_thuc" in data:
            hopdong.ngay_ket_thuc = (
                datetime.strptime(data["ngay_ket_thuc"], "%Y-%m-%d").date()
                if data["ngay_ket_thuc"] else None
            )

        db.session.commit()
        return jsonify(hopdong.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        print("❌ Lỗi cập nhật hợp đồng:", e)
        return jsonify({"message": "Cập nhật hợp đồng thất bại", "error": str(e)}), 500
@hopdong_bp.route("/hop-dong/by-nhan-vien/batch", methods=["POST"])
def get_contracts_batch():
    """
    Nhận danh sách ID nhân viên và trả về hợp đồng mới nhất của từng người
    Body: {"ids": [1, 2, 3, ...]}
    """
    data = request.get_json() or {}
    ids = data.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return jsonify({"error": "Danh sách id không hợp lệ"}), 400

    today = date.today()
    results = {}

    # Lấy tất cả hợp đồng thuộc các NV
    all_hd = (HopDongLaoDong.query
              .filter(HopDongLaoDong.nhan_vien_id.in_(ids))
              .order_by(HopDongLaoDong.nhan_vien_id, HopDongLaoDong.ngay_bat_dau.desc())
              .all())

    # gom hợp đồng mới nhất cho mỗi NV
    for hd in all_hd:
        nv_id = hd.nhan_vien_id
        if nv_id not in results:
            # Ưu tiên hợp đồng đang hiệu lực
            if hd.trang_thai and (
                hd.ngay_bat_dau <= today and
                (hd.ngay_ket_thuc is None or hd.ngay_ket_thuc >= today)
            ):
                results[nv_id] = hd.to_dict()
            else:
                # Nếu chưa có hợp đồng nào thì lấy mới nhất theo ngày
                results.setdefault(nv_id, hd.to_dict())

    return jsonify(results), 200