# routes/hopdong_routes.py
from flask import Blueprint, jsonify
from datetime import date
from app.models.hopdong_laodong_model import HopDongLaoDong
from app import db

hopdong_bp = Blueprint("hopdong_bp", __name__)

@hopdong_bp.route("/hop-dong/by-nhan-vien/<int:nv_id>", methods=["GET"])
def get_active_contract_by_nhan_vien(nv_id):
    today = date.today()

    # Ưu tiên hợp đồng đang hiệu lực theo ngày:
    active = (HopDongLaoDong.query
              .filter(HopDongLaoDong.nhan_vien_id == nv_id,
                      HopDongLaoDong.trang_thai == True,
                      HopDongLaoDong.ngay_bat_dau <= today,
                      (HopDongLaoDong.ngay_ket_thuc == None) | (HopDongLaoDong.ngay_ket_thuc >= today))
              .order_by(HopDongLaoDong.ngay_bat_dau.desc())
              .first())

    if active:
        return jsonify(active.to_dict()), 200

    # Nếu không có hợp đồng “đang hiệu lực”, trả hợp đồng mới nhất theo ngày bắt đầu:
    latest = (HopDongLaoDong.query
              .filter(HopDongLaoDong.nhan_vien_id == nv_id, HopDongLaoDong.trang_thai == True)
              .order_by(HopDongLaoDong.ngay_bat_dau.desc())
              .first())
    if latest:
        return jsonify(latest.to_dict()), 200

    return jsonify(None), 200  # FE sẽ hiểu là chưa có HĐ
