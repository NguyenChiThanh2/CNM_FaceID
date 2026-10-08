from app.models.giay_phep_model import GiayPhep
from .cham_cong_service import ( get_cham_cong_by_id_service )
from .nhan_vien_service import ( get_nhan_vien_by_id_service )
from app import db
from datetime import datetime



def get_all_giay_phep_service():
    return GiayPhep.query.all()

def get_giay_phep_by_id_service(id):
    return GiayPhep.query.filter_by(id=id).first()

def get_giay_phep_quen_chamcong_service(cham_cong_id):
    return GiayPhep.query.filter(GiayPhep.cham_cong_id == cham_cong_id, GiayPhep.loai_giay_phep == "Quên chấm công").first()

def create_giay_phep_service(cham_cong_id, nhan_vien_id, ngay_bat_dau, ngay_ket_thuc, loai_giay_phep, ly_do, so_gio):
    tu_ngay_date = datetime.strptime(ngay_bat_dau, "%Y-%m-%d").date()
    den_ngay_date = datetime.strptime(ngay_ket_thuc, "%Y-%m-%d").date()
    giay_phep = GiayPhep(
        cham_cong_id=cham_cong_id,
        nhan_vien_id=nhan_vien_id,
        ngay_bat_dau=tu_ngay_date,
        ngay_ket_thuc=den_ngay_date,
        loai_giay_phep=loai_giay_phep,
        ly_do=ly_do,
        so_gio=so_gio,
        trang_thai="Đang chờ"
    )
    
    try:
        db.session.add(giay_phep)
        db.session.commit()
        return giay_phep
    except Exception as e:
        db.session.rollback()
        # chỉ return None hoặc raise
        raise Exception(str(e))
    
def update_giay_phep_service(id, cham_cong_id=None, nhan_vien_id=None, ngay_bat_dau=None, ngay_ket_thuc=None, loai_giay_phep=None, ly_do=None, so_gio=None, trang_thai=None):
    try:
        giay_phep = GiayPhep.query.filter_by(id=id).first()
        if not giay_phep:
            raise ValueError("Giấy phép không tồn tại")
        
        # Gán vào INSTANCE (giay_phep.x), không phải CLASS (GiayPhep.x) — gán
        # vào class sẽ ghi đè luôn Column dùng chung của mọi instance, hỏng
        # mapper cho toàn bộ nhân viên khác tới khi restart server. Đồng thời
        # sửa lại điều kiện bị phủ định ngược (dòng cũ gán nhan_vien_id khi
        # KHÔNG tìm thấy nhân viên — ngược với ý đồ) và thêm truthy-check để
        # không vô tình xóa giá trị cũ khi client không gửi tham số này.
        if cham_cong_id and get_cham_cong_by_id_service(cham_cong_id):
            giay_phep.cham_cong_id = cham_cong_id

        if nhan_vien_id and get_nhan_vien_by_id_service(nhan_vien_id):
            giay_phep.nhan_vien_id = nhan_vien_id
        
        if ngay_bat_dau:
            tu_ngay_date = datetime.strptime(ngay_bat_dau, "%Y-%m-%d").date()
            giay_phep.ngay_bat_dau = tu_ngay_date
            
        if ngay_ket_thuc:
            den_ngay_date = datetime.strptime(ngay_ket_thuc, "%Y-%m-%d").date()
            giay_phep.ngay_ket_thuc = den_ngay_date
        
        if tu_ngay_date > den_ngay_date:
            raise ValueError("Ngày bắt đầu phải trước ngày kết thúc")
        
        if ly_do:
            giay_phep.ly_do = ly_do
        
        if loai_giay_phep in ["Quên chấm công", "Tăng ca"]:
            giay_phep.loai_giay_phep = loai_giay_phep
        
        if loai_giay_phep == "Tăng ca" and so_gio is not None and so_gio >= 0:
            giay_phep.so_gio = so_gio
        elif loai_giay_phep == "Quên chấm công" and so_gio in ['4' , '8']:
            giay_phep.so_gio = so_gio
        else:
            raise ValueError("Số giờ phải là số dương và khác None")
        
        if trang_thai:
            if giay_phep.trang_thai != "Đang chờ":
                raise ValueError("Không thể cập nhật trạng thái khi đơn không ở trạng thái 'Đang chờ'")
            giay_phep.trang_thai = trang_thai
        
        db.session.commit()
        return giay_phep
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_giay_phep_service: {str(e)}")
        raise e

def approve_giay_phep_service(id):
    try:
        # Lấy đơn Giấy phép theo id
        giay_phep = GiayPhep.query.filter_by(id=id).first()
        if not giay_phep:
            raise ValueError("Giấy phép không tồn tại")

        # Kiểm tra trạng thái của đơn Giấy phép
        if giay_phep.trang_thai != "Đang chờ":
            raise ValueError("Không thể duyệt đơn khi trạng thái không phải là 'Đang chờ'")

        # Duyệt đơn Giấy phép và cập nhật trạng thái
        giay_phep.trang_thai = "Đã duyệt"
        
        # Cập nhật số ngày Giấy phép còn lại của nhân viên
        # nhan_vien = giay_phep.nhan_vien  # Giả sử có quan hệ với bảng `NhanVien`
        # if nhan_vien:
        #     nhan_vien.so_ngay_phep_con_lai -= giay_phep.so_ngay_nghi  # Trừ số ngày nghỉ đã duyệt
        db.session.commit()

        # Lưu lại trạng thái và trả về đơn Giấy phép đã duyệt
        db.session.commit()
        return giay_phep
    except Exception as e:
        print(f"Error in approve_giay_phep_service: {str(e)}")
        raise e



def reject_giay_phep_service(id):
    try:
        giay_phep = GiayPhep.query.filter_by(id=id).first()
        if not giay_phep:
            raise ValueError("Giấy phép không tồn tại")

        if giay_phep.trang_thai != "Đang chờ":
            raise ValueError("Không thể từ chối khi trạng thái không phải là 'Đang chờ'")

        giay_phep.trang_thai = "Từ chối"
        db.session.commit()
        return giay_phep
    except Exception as e:
        print(f"Error in reject_giay_phep_service: {str(e)}")
        raise e

def delete_giay_phep_service(id):
    giay_phep = GiayPhep.query.filter_by(id=id).first()
    if not giay_phep:
        raise ValueError("Giấy phép không tồn tại")
    
    # Xóa đơn Giấy phép
    giay_phep.soft_delete()
    db.session.commit()
    return giay_phep


def cancle_giay_phep_service(id):
    try:
        giay_phep = GiayPhep.query.filter_by(id=id).first()
        if not giay_phep:
            raise ValueError("Giấy phép không tồn tại")

        if giay_phep.trang_thai not in ["Đang chờ", "Từ chối"]:
            raise ValueError("Không thể hủy giấy phép đã được duyệt hoặc đã xử lý")

        giay_phep.soft_delete()
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e)) 
    
