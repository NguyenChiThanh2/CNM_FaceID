from app import db
from app.models.ngay_nghi_le_model import NgayNghiLe
from datetime import datetime

def get_all_ngay_nghi_le_service():
    return NgayNghiLe.query.order_by(NgayNghiLe.id.desc()).all()

def get_ngay_nghi_le_by_id_service(id):
    return NgayNghiLe.query.get(id)

def get_ngay_nghi_le_by_status_service(trang_thai):
    return NgayNghiLe.query.filter_by(trang_thai=trang_thai).all()

def get_ngay_nghi_le_by_nhan_vien_id_service(nhan_vien_id):
    return NgayNghiLe.query.filter_by(nhan_vien_id=nhan_vien_id).all()

def create_ngay_nghi_le_service(ten_ngay_le,ngay_bat_dau,ngay_ket_thuc,ghi_chu,ten_ngay_le_khac=None):
    try:
        ngay_bat_dau_date = datetime.strptime(ngay_bat_dau, "%Y-%m-%d").date()
        ngay_ket_thuc_date = datetime.strptime(ngay_ket_thuc, "%Y-%m-%d").date()
        
        if ngay_bat_dau > ngay_ket_thuc:
            raise ValueError("Ngày bắt đầu không thể lớn hơn ngày kết thúc!")
        ten_ngay = ten_ngay_le_khac if ten_ngay_le == "Khác" and ten_ngay_le_khac else ten_ngay_le

        new_ngay_nghi_le = NgayNghiLe(
            ten_ngay=ten_ngay,
            tu_ngay=ngay_bat_dau_date,
            den_ngay=ngay_ket_thuc_date,
            mo_ta=ghi_chu
        )
        db.session.add(new_ngay_nghi_le)
        db.session.commit()
        return new_ngay_nghi_le
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))
def delete_ngay_nghi_le_service(ngay_nghi_le_id):
    try:
        ngay_nghi_le = NgayNghiLe.query.get(ngay_nghi_le_id)
        if not ngay_nghi_le:
            raise ValueError("Nghỉ lễ không tồn tại")
            
        db.session.delete(ngay_nghi_le)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))
def update_ngay_nghi_le_service(id,ten_ngay_le,ngay_bat_dau,ngay_ket_thuc,ghi_chu,ten_ngay_le_khac=None):
    try:
        ngay_bat_dau_date = datetime.strptime(ngay_bat_dau, "%Y-%m-%d").date()
        ngay_ket_thuc_date = datetime.strptime(ngay_ket_thuc, "%Y-%m-%d").date()
        
        if ngay_bat_dau > ngay_ket_thuc:
            raise ValueError("Ngày bắt đầu không thể lớn hơn ngày kết thúc!")
        ten_ngay = ten_ngay_le_khac if ten_ngay_le == "Khác" and ten_ngay_le_khac else ten_ngay_le
        ngay_nghi_le = get_ngay_nghi_le_by_id_service(id)
        if not ngay_nghi_le:
            raise ValueError("Nghỉ lễ không tồn tại")
        ngay_nghi_le.ten_ngay = ten_ngay
        ngay_nghi_le.tu_ngay = ngay_bat_dau_date
        ngay_nghi_le.den_ngay = ngay_ket_thuc_date
        ngay_nghi_le.mo_ta = ghi_chu
        db.session.commit()
        return ngay_nghi_le
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))
