import face_recognition
import numpy as np
from app.models.nhan_vien_model import NhanVien
from app.models.cham_cong_model import ChamCong
from app.models.giay_phep_model import GiayPhep
from app import db
from datetime import datetime, time
from decimal import Decimal
import base64
import cv2
import io
import uuid
import pytz
from app.utils.file_utils import read_image_from_base64
import os
from sqlalchemy import extract, func
from datetime import timedelta, date
from typing import Optional

def get_all_cham_cong_service():
    return ChamCong.query.order_by(ChamCong.ngay.desc()).all()

def get_cham_cong_by_id_service(id):
    return ChamCong.query.get(id)

def get_cham_cong_by_nhan_vien_id_service(nhan_vien_id):
    return ChamCong.query.filter_by(nhan_vien_id=nhan_vien_id).all()


def update_cham_cong_service(id, thoi_gian_vao=None, thoi_gian_ra=None, ngay=None, hinh_anh=None):
    cham_cong = ChamCong.query.get(id)
    if not cham_cong:
        return None
    if thoi_gian_vao is not None:
        cham_cong.thoi_gian_vao = thoi_gian_vao
    if thoi_gian_ra is not None:
        cham_cong.thoi_gian_ra = thoi_gian_ra
    if ngay is not None:
        cham_cong.ngay = ngay
    if hinh_anh is not None:
        cham_cong.hinh_anh = hinh_anh
    db.session.commit()
    return cham_cong

def delete_cham_cong_service(id):
    cham_cong = ChamCong.query.get(id)
    if not cham_cong:
        return False
    db.session.delete(cham_cong)
    db.session.commit()
    return True
# def read_image_from_base64(base64_data):
#     image_data = base64.b64decode(base64_data.split(',')[-1])
#     nparr = np.frombuffer(image_data, np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#     return img

  # Đảm bảo bạn có hàm này

def create_cham_cong_from_face_service(base64_image):
    import os
    import numpy as np

    img = read_image_from_base64(base64_image)

    face_locations = face_recognition.face_locations(img)
    if len(face_locations) == 0:
        return {'message': 'Không phát hiện khuôn mặt nào'}, 400

    encodings = face_recognition.face_encodings(img, known_face_locations=face_locations)
    if not encodings:
        return {'message': 'Không thể mã hoá khuôn mặt'}, 400

    input_encoding = encodings[0]

    matched_nv = None
    min_distance = float('inf')
    threshold = 0.45

    all_nhan_vien = NhanVien.query.all()
    for nv in all_nhan_vien:
        if nv.face_encoding:
            known_encoding = np.array(nv.face_encoding)
            distance = np.linalg.norm(known_encoding - input_encoding)
            if distance < min_distance and distance <= threshold:
                min_distance = distance
                matched_nv = nv

    if matched_nv:
        vietnam_tz = pytz.timezone('Asia/Ho_Chi_Minh')
        now = datetime.now(vietnam_tz)
        today = now.date()

        cham_cong_today = ChamCong.query.filter_by(nhan_vien_id=matched_nv.id, ngay=today).first()

        filename = f"{uuid.uuid4()}.jpg"
        image_path = os.path.join("static", "checkin_images", filename)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        cv2.imwrite(image_path, img)

        time_str = now.strftime("%H:%M %d-%m")

        if not cham_cong_today:
            cham_cong = ChamCong(
                nhan_vien_id=matched_nv.id,
                thoi_gian_vao=now,
                ngay=today,
                hinh_anh_vao=filename
            )
            db.session.add(cham_cong)
            db.session.commit()
            return {
                'message': 'Chấm công <strong>vào</strong> thành công',
                'name': matched_nv.ho_ten,
                'time': time_str,
                'cham_cong': cham_cong.to_dict()
            }, 200

        elif cham_cong_today.thoi_gian_ra is None:
            cham_cong_today.thoi_gian_ra = now
            cham_cong_today.hinh_anh_ra = filename
            db.session.commit()
            return {
                'message': 'Chấm công <strong>ra</strong> thành công',
                'name': matched_nv.ho_ten,
                'time': time_str,
                'cham_cong': cham_cong_today.to_dict()
            }, 200

        else:
            return {
                'message': f'Đã chấm công đủ vào và ra cho hôm nay cho',
                'name': matched_nv.ho_ten,
            }, 400

    return {'message': 'Không khớp khuôn mặt với bất kỳ nhân viên nào'}, 404


def get_chamcong_1nhanvien_theothang_service(nhan_vien_id, thang, nam):
    return ChamCong.query.filter(
    ChamCong.nhan_vien_id == nhan_vien_id,
    extract('month', ChamCong.ngay) == thang,
    extract('year', ChamCong.ngay) == nam).all()
    
    
def tinh_so_cong_cho_1_ngay(check_in: Optional[datetime], check_out: Optional[datetime]) -> Decimal:
    if not check_in or not check_out:
        return Decimal("0")
# theo thời gian việt nam
    in_t = check_in.time()
    out_t = check_out.time()

    # tính giờ làm việc trong ngày
    total_hours = Decimal("0")
    # ca sáng 08:00-12:00
    a_start, a_end = time(8, 0), time(12, 0)
    # ca chiều 13:00-17:00
    b_start, b_end = time(13, 0), time(17, 0)


    def overlap_hours(s: time, e: time, ws: time, we: time) -> Decimal:
        start = max(datetime.combine(date.min, s), datetime.combine(date.min, ws))
        end = min(datetime.combine(date.min, e), datetime.combine(date.min, we))
        delta = (end - start).total_seconds() / 3600
        return Decimal(str(max(delta, 0)))


    total_hours += overlap_hours(in_t, out_t, a_start, a_end)
    total_hours += overlap_hours(in_t, out_t, b_start, b_end)


    # 8 hours -> 1 công; 4 hours -> 0.5 công; trễ 30 phút không tính công ca sáng; về sớm 30 phút không tính công ca chiều
    if total_hours >= Decimal("7.5"):
        return Decimal("1.00")
    if total_hours >= Decimal("3.5"):
        return Decimal("0.50")
    return Decimal("0.00")
    
        
def get_tinhsocong_1nhanvien_theothang_service(nhan_vien_id, thang, nam):
    dschamcong = ChamCong.query.filter(ChamCong.nhan_vien_id == nhan_vien_id,extract('month', ChamCong.ngay) == thang,extract('year', ChamCong.ngay) == nam).all()
    if not dschamcong:
        return None
    else:
        for cc in dschamcong:
            so_cong_moi = tinh_so_cong_cho_1_ngay(cc.thoi_gian_vao, cc.thoi_gian_ra)
            cc.so_cong = so_cong_moi  # cập nhật lại cột so_cong
        db.session.commit()
        return True
    
def get_tinhsocong_theogiayphep_service(id):
    cham_cong = ChamCong.query.get(id)
    giay_phep = GiayPhep.query.filter(GiayPhep.cham_cong_id == id, GiayPhep.trang_thai == "Đã duyệt").first()

    if not cham_cong or not giay_phep:
        return {"error": "Không tìm thấy bản ghi chấm công hoặc giấy phép"}, 404
    
    if giay_phep.so_gio == 8:
        cham_cong.so_cong = Decimal("1.0")
        message = "Cập nhật 1 ngày công"
    elif giay_phep.so_gio == 4:
        cham_cong.so_cong = Decimal("0.5")
        message = "Cập nhật nửa ngày công"
    else:
        return {"error": "Giấy phép không hợp lệ"}, 400

    try:
        db.session.commit()
        return {"success": message}, 200
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}, 500