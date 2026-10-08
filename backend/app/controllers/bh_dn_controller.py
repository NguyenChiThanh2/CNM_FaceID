from flask import jsonify
from app.services.bh_dn_service import get_all_bao_hiem_dn_service


def bao_hiem_dn_controller():
    try:
        data = get_all_bao_hiem_dn_service()
        return jsonify(data), 200
    except Exception as e:
        print(f"Lỗi khi lấy bảo hiểm doanh nghiệp: {e}")
        return jsonify({"error": "Lỗi hệ thống, vui lòng thử lại sau"}), 500
