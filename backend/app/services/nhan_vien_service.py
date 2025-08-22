from app.models import  NhanVien
from sqlalchemy.exc import SQLAlchemyError
from app import db

def get_all_nhan_vien_service():
    return NhanVien.query.all()

def get_nhan_vien_by_id_service(id):
    return NhanVien.query.get(id)
def get_nhan_vien_by_trang_thai_service(trang_thai):
    return NhanVien.query.filter_by(trang_thai=trang_thai).all()

def create_nhan_vien_service(**data):
    try:
        nhan_vien = NhanVien(**data)
        db.session.add(nhan_vien)
        db.session.commit()
        return nhan_vien
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Lỗi khi tạo nhân viên: {str(e)}")
        return {'error': 'Không thể tạo nhân viên, vui lòng thử lại sau'}


def update_nhan_vien_service(id, **data):
    nhan_vien = get_nhan_vien_by_id_service(id)
    if not nhan_vien:
        return {'error': 'Không tìm thấy nhân viên'}

    try:
        for key, value in data.items():
            if hasattr(nhan_vien, key):
                setattr(nhan_vien, key, value)
        db.session.commit()
        return nhan_vien
    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Lỗi khi cập nhật nhân viên: {str(e)}")
        return {'error': 'Không thể cập nhật nhân viên, vui lòng thử lại sau'}


def delete_nhan_vien_service(id):
    nhan_vien = get_nhan_vien_by_id_service(id)
    if not nhan_vien:
        return {'error': 'Không tìm thấy nhân viên'}

    try:
        db.session.delete(nhan_vien)
        db.session.commit()
        return {'message': 'Xóa nhân viên thành công'}
    except SQLAlchemyError as e:
        db.session.rollback()
        return {'error': str(e)}
