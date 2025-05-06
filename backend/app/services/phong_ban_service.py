# app/services/phong_ban_service.py
from app import db
from app.models.phong_ban_model import PhongBan

# Lấy tất cả phòng ban
def get_all_phong_ban_service():
    return PhongBan.query.all()

# Lấy phòng ban theo tên
def get_phong_ban_by_name_service(ten_phong_ban):
    return PhongBan.query.filter_by(ten_phong_ban=ten_phong_ban).first()

# Lấy phòng ban theo mã (ID)
def get_phong_ban_by_ma_service(ma_phong_ban):
    return PhongBan.query.get(ma_phong_ban)

# Tạo mới phòng ban
def create_phong_ban_service(data):
    new_pb = PhongBan(
        ma_phong_ban=data.get("ma_phong_ban"),
        ten_phong_ban=data.get("ten_phong_ban"),
        mo_ta=data.get("mo_ta")
    )
    db.session.add(new_pb)
    db.session.commit()
    return new_pb

# Cập nhật phòng ban
def update_phong_ban_service(id, data):
    pb = PhongBan.query.get(id)
    if not pb:
        return None
    
    pb.ma_phong_ban = data.get("ma_phong_ban", pb.ma_phong_ban)
    pb.ten_phong_ban = data.get("ten_phong_ban", pb.ten_phong_ban)
    pb.mo_ta = data.get("mo_ta", pb.mo_ta)

    db.session.commit()
    return pb

# Xoá phòng ban
def delete_phong_ban_service(ma_phong_ban):
    pb = PhongBan.query.get(ma_phong_ban)
    if not pb:
        return None

    db.session.delete(pb)
    db.session.commit()
    return pb
