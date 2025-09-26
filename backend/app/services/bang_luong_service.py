from app.models.bang_luong_model import BangLuong
from app.models.chi_tiet_luong_model import ChiTietLuong, NhomChiTietLuong
from app import db

def get_bang_luong_service():
    try:
        bang_luong_list = BangLuong.query.all()
        return [bl.to_dict() for bl in bang_luong_list]
    except Exception as e:
        raise Exception(str(e))

def get_bang_luong_1nv_service(nhan_vien_id):
    return BangLuong.query.filter_by(nhan_vien_id=nhan_vien_id).all()

# Xóa bảng lương theo ID
def delete_bangluong_service(id):
    bangLuong = BangLuong.query.get(id)
    if bangLuong:
        try:
            db.session.delete(bangLuong)
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error in cancle_nghi_phep_service: {str(e)}") 
            raise e
    return False