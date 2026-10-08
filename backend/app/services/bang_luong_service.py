from app.models.bang_luong_model import BangLuong
from app.models.chi_tiet_luong_model import ChiTietLuong, NhomChiTietLuong
from app import db
from sqlalchemy.orm import joinedload

def get_bang_luong_service(nhan_vien_id=None):
    """nhan_vien_id: lọc chỉ bảng lương của 1 nhân viên — dùng khi người gọi
    không phải HR, để tránh trả về lương của TOÀN BỘ công ty cho bất kỳ ai có
    quyền "bang_luong.xem" (vd nhân viên thường tự xem phiếu lương của mình)."""
    try:
        # BangLuong.to_dict() load thêm quan hệ chi_tiet_luong_bang_luong —
        # eager-load bằng joinedload để gộp vào 1 câu SQL, tránh mỗi dòng
        # bảng lương tự lazy-load riêng (N+1 query khi trả về danh sách).
        query = BangLuong.query.options(joinedload(BangLuong.chi_tiet_luong_bang_luong))
        if nhan_vien_id is not None:
            query = query.filter_by(nhan_vien_id=nhan_vien_id)
        bang_luong_list = query.all()
        return [bl.to_dict() for bl in bang_luong_list]
    except Exception as e:
        raise Exception(str(e))

# Xóa bảng lương theo ID
def delete_bangluong_service(id):
    bangLuong = BangLuong.query.filter_by(id=id).first()
    if bangLuong:
        try:
            bangLuong.soft_delete()
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error in cancle_nghi_phep_service: {str(e)}") 
            raise e
    return False