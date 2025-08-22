from app import db
from app.models.nghi_phep_model import NghiPhep
from app.models.loai_nghi_phep_model import LoaiNghiPhep
from datetime import datetime

# Utility function to convert date string to datetime object
def convert_to_datetime(date_string):
    try:
        return datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError:
        return datetime.strptime(date_string, '%Y-%m-%d')

# Utility function to check if start date is before end date
def validate_dates(tu_ngay, den_ngay):
    if tu_ngay > den_ngay:
        raise ValueError("Ngày bắt đầu phải trước ngày kết thúc")

def get_all_nghi_phep_service():
    return NghiPhep.query.all()

def get_nghi_phep_by_id_service(id):
    return NghiPhep.query.get(id)

def get_nghi_phep_by_status_service(trang_thai):
    return NghiPhep.query.filter_by(trang_thai=trang_thai).all()

def get_nghi_phep_by_nhan_vien_id_service(nhan_vien_id):
    return NghiPhep.query.filter_by(nhan_vien_id=nhan_vien_id).all()

def create_nghi_phep_service(nhan_vien_id, loai_nghi_phep_id, tu_ngay, den_ngay, ly_do, trang_thai):
    if not LoaiNghiPhep.query.get(loai_nghi_phep_id):
        raise ValueError("Loại nghỉ phép không tồn tại")
    
    tu_ngay = convert_to_datetime(tu_ngay)
    den_ngay = convert_to_datetime(den_ngay)
    validate_dates(tu_ngay, den_ngay)
    
    # Tính số ngày nghỉ
    so_ngay_nghi = (den_ngay - tu_ngay).days + 1

    new_nghi_phep = NghiPhep(
        nhan_vien_id=nhan_vien_id,
        loai_nghi_phep_id=loai_nghi_phep_id,
        tu_ngay=tu_ngay,
        den_ngay=den_ngay,
        ly_do=ly_do,
        trang_thai=trang_thai,
        so_ngay_nghi=so_ngay_nghi
    )
    db.session.add(new_nghi_phep)
    db.session.commit()
    return new_nghi_phep

def update_nghi_phep_service(id, loai_nghi_phep_id=None, tu_ngay=None, den_ngay=None, ly_do=None, trang_thai=None):
    nghi_phep = NghiPhep.query.get(id)
    if not nghi_phep:
        raise ValueError("Nghỉ phép không tồn tại")
    
    if loai_nghi_phep_id and not LoaiNghiPhep.query.get(loai_nghi_phep_id):
        raise ValueError("Loại nghỉ phép không tồn tại")
    
    if loai_nghi_phep_id:
        nghi_phep.loai_nghi_phep_id = loai_nghi_phep_id
    
    if tu_ngay:
        tu_ngay = convert_to_datetime(tu_ngay)
        nghi_phep.tu_ngay = tu_ngay
        
    if den_ngay:
        den_ngay = convert_to_datetime(den_ngay)
        nghi_phep.den_ngay = den_ngay
    
    if tu_ngay and den_ngay:
        validate_dates(tu_ngay, den_ngay)
    
    if ly_do:
        nghi_phep.ly_do = ly_do
    
    if trang_thai:
        if nghi_phep.trang_thai != "Chờ duyệt":
            raise ValueError("Không thể cập nhật trạng thái khi đơn không ở trạng thái 'Chờ duyệt'")
        nghi_phep.trang_thai = trang_thai
    
    # Cập nhật lại số ngày nghỉ
    nghi_phep.so_ngay_nghi = (nghi_phep.den_ngay - nghi_phep.tu_ngay).days + 1
    
    db.session.commit()
    return nghi_phep

def approve_nghi_phep_service(id):
    try:
        # Lấy đơn nghỉ phép theo id
        nghi_phep = NghiPhep.query.get(id)
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")

        # Kiểm tra trạng thái của đơn nghỉ phép
        if nghi_phep.trang_thai != "Chờ duyệt":
            raise ValueError("Không thể duyệt đơn khi trạng thái không phải là 'Chờ duyệt'")

        # Duyệt đơn nghỉ phép và cập nhật trạng thái
        nghi_phep.trang_thai = "Đã duyệt"
        
        # Cập nhật số ngày nghỉ phép còn lại của nhân viên
        nhan_vien = nghi_phep.nhan_vien  # Giả sử có quan hệ với bảng `NhanVien`
        if nhan_vien:
            nhan_vien.so_ngay_phep_con_lai -= nghi_phep.so_ngay_nghi  # Trừ số ngày nghỉ đã duyệt
            db.session.commit()

        # Lưu lại trạng thái và trả về đơn nghỉ phép đã duyệt
        db.session.commit()
        return nghi_phep
    except Exception as e:
        print(f"Error in approve_nghi_phep_service: {str(e)}")
        raise e  # Ném lại lỗi để có thể xử lý ở controller



def reject_nghi_phep_service(id):
    try:
        nghi_phep = NghiPhep.query.get(id)
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")

        if nghi_phep.trang_thai != "Chờ duyệt":
            raise ValueError("Không thể từ chối khi trạng thái không phải là 'Chờ duyệt'")

        nghi_phep.trang_thai = "Từ chối"
        db.session.commit()
        return nghi_phep
    except Exception as e:
        print(f"Error in reject_nghi_phep_service: {str(e)}")
        raise e

def delete_nghi_phep_service(id):
    nghi_phep = NghiPhep.query.get(id)
    if not nghi_phep:
        raise ValueError("Nghỉ phép không tồn tại")
    
    # Xóa đơn nghỉ phép
    db.session.delete(nghi_phep)
    db.session.commit()
    return nghi_phep


def cancle_nghi_phep_service(id):
    try:
        nghi_phep = NghiPhep.query.get(id)
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")

        if nghi_phep.trang_thai != "Chờ duyệt":
            raise ValueError("Không thể Hủy khi trạng thái không phải là 'Chờ duyệt'")

        nghi_phep.trang_thai = "Từ chối"
        db.session.commit()
        return nghi_phep
    except Exception as e:
        print(f"Error in cancle_nghi_phep_service: {str(e)}") 
        raise e
