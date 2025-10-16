from app import db
from app.models.nghi_phep_model import NghiPhep
from app.models.loai_nghi_phep_model import LoaiNghiPhep
from app.models.hopdong_laodong_model import HopDongLaoDong
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from datetime import datetime, date, timedelta
from config import UPLOAD_FOLDER, UPLOAD_FOLDER_PHEPNAM, UPLOAD_FOLDER_PHEPKL
import shutil

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
    return NghiPhep.query.order_by(NghiPhep.id.desc()).all()

def get_nghi_phep_by_id_service(id):
    return NghiPhep.query.get(id)

def get_nghi_phep_by_status_service(trang_thai):
    return NghiPhep.query.filter_by(trang_thai=trang_thai).all()

def get_nghi_phep_by_nhan_vien_id_service(nhan_vien_id):
    return NghiPhep.query.filter_by(nhan_vien_id=nhan_vien_id).all()


def create_nghi_phep_service(nhan_vien_id, loai_nghi_phep_id, tu_ngay, den_ngay, ly_do, trang_thai, 
                                                                                                    file=None,  # thêm file upload
                                                                                                    ngay_du_kien_sinh=None,
                                                                                                    so_con=None,
                                                                                                    phuong_phap_sinh=None):
    # Kiểm tra loại nghỉ phép
    if not LoaiNghiPhep.query.get(loai_nghi_phep_id):
        raise ValueError("Loại nghỉ phép không tồn tại")
    
    tu_ngay = convert_to_datetime(tu_ngay)
    den_ngay = convert_to_datetime(den_ngay)
    validate_dates(tu_ngay, den_ngay)

    # Tính số ngày nghỉ mới
    so_ngay_nghi = (den_ngay - tu_ngay).days + 1
    nam = tu_ngay.year
    # ========== QUY ĐỊNH NGHỈ THAI SẢN ==========
    if loai_nghi_phep_id == "3":  # ví dụ id=3 là nghỉ thai sản
        if not ngay_du_kien_sinh:
            raise ValueError("Phải nhập ngày dự kiến sinh hoặc nhận nuôi")
        
        ngay_du_kien_sinh = convert_to_datetime(ngay_du_kien_sinh).date()

        # 1. Ngày dự kiến sinh phải trong tương lai
        if ngay_du_kien_sinh < date.today():
            raise ValueError("Ngày dự kiến sinh phải là ngày trong tương lai")

        # 2. Thời gian nghỉ tối thiểu 6 tháng
        min_nghi = timedelta(days=180)  # ~ 6 tháng
        if (den_ngay - tu_ngay) < min_nghi:
            raise ValueError("Thời gian nghỉ thai sản tối thiểu phải từ 6 tháng trở lên")

        # 3. Nghỉ trước sinh không vượt quá 2 tháng
        max_nghi_truoc = ngay_du_kien_sinh - timedelta(days=60)
        if tu_ngay.date() < max_nghi_truoc:
            raise ValueError("Thời gian nghỉ trước sinh không được vượt quá 2 tháng")

        # 4. Sinh đa thai: cộng thêm 1 tháng cho mỗi bé từ bé thứ 2
        # if so_con and so_con > 1:
        #     extra_days = (so_con - 1) * 30
        #     den_ngay = den_ngay + timedelta(days=extra_days)
        #     so_ngay_nghi = (den_ngay - tu_ngay).days + 1

    # ============================================

    # Lấy hợp đồng lao động của nhân viên
    hopdong = HopDongLaoDong.query.filter_by(nhan_vien_id=nhan_vien_id).first()
    if not hopdong:
        raise ValueError("Không tìm thấy hợp đồng lao động cho nhân viên này")

    # Tính tổng số ngày nghỉ phép trong năm đã có
    tong_nghi_trong_nam = db.session.query(db.func.sum(NghiPhep.so_ngay_nghi)) \
        .filter(
            NghiPhep.nhan_vien_id == nhan_vien_id,
            NghiPhep.trang_thai == "Đã duyệt",
            NghiPhep.loai_nghi_phep_id != 3,
            db.extract('year', NghiPhep.tu_ngay) == nam
        ).scalar() or 0

    # Tổng số ngày sau khi cộng thêm đơn mới
    tong_nghi_du_kien = tong_nghi_trong_nam + so_ngay_nghi

    if loai_nghi_phep_id == '1' and tong_nghi_du_kien > hopdong.phep_nam:
        vuot_qua = tong_nghi_du_kien - hopdong.phep_nam
        raise ValueError(f"Số ngày nghỉ phép vượt quá {vuot_qua} ngày so với phép năm")

    # Xử lý file upload
    filename = None
    ten_file_moi = None 
    if file:
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        if loai_nghi_phep_id == "1":
            ten_file_moi = f"nghiphepnam_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER_PHEPNAM, ten_file_moi))
        elif loai_nghi_phep_id == "2":
            ten_file_moi = f"nghiphepcoluong_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER_PHEPKL, ten_file_moi))
        else:
            ten_file_moi = f"nghiphepthaisan_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER, ten_file_moi))
    # Tạo đơn nghỉ phép mới
    new_nghi_phep = NghiPhep(
        nhan_vien_id=nhan_vien_id,
        loai_nghi_phep_id=loai_nghi_phep_id,
        tu_ngay=tu_ngay,
        den_ngay=den_ngay,
        ly_do=ly_do,
        trang_thai=trang_thai,
        so_ngay_nghi=so_ngay_nghi,
        
        ngay_du_kien_sinh=ngay_du_kien_sinh,
        so_con=so_con,
        phuong_phap_sinh=phuong_phap_sinh,
        can_cu_phap_ly_file=ten_file_moi
    )
    db.session.add(new_nghi_phep)
    db.session.commit()
    return new_nghi_phep

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Trường hợp chỉ có yyyy-MM-dd
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        try:
            # Trường hợp có thêm T00:00:00
            return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            raise ValueError(f"Định dạng ngày không hợp lệ: {date_str}")


    
def update_nghi_phep_service(id, nhan_vien_id, loai_nghi_phep_id, tu_ngay, den_ngay, ly_do, trang_thai, 
                                                                                                file=None,  # thêm file upload
                                                                                                ngay_du_kien_sinh=None,
                                                                                                so_con=None,
                                                                                                phuong_phap_sinh=None,
                                                                                                file_status=None):
    nghi_phep = NghiPhep.query.get(id)
    if not nghi_phep:
        raise ValueError("Không tìm thấy đơn nghỉ phép")
    lnp_bandau = nghi_phep.loai_nghi_phep_id
    tu_ngay = parse_date(tu_ngay)
    den_ngay = parse_date(den_ngay)
    validate_dates(tu_ngay, den_ngay)
    # Tính số ngày nghỉ mới
    so_ngay_nghi = (den_ngay - tu_ngay).days + 1
    nam = tu_ngay.year
    
    # ========== QUY ĐỊNH NGHỈ THAI SẢN ==========
    if loai_nghi_phep_id == "3":  # ví dụ id=3 là nghỉ thai sản
        if not ngay_du_kien_sinh:
            raise ValueError("Phải nhập ngày dự kiến sinh hoặc nhận nuôi")
        
        ngay_du_kien_sinh = parse_date(ngay_du_kien_sinh).date()

        # 1. Ngày dự kiến sinh phải trong tương lai
        if ngay_du_kien_sinh < date.today():
            raise ValueError("Ngày dự kiến sinh phải là ngày trong tương lai")

        # 2. Thời gian nghỉ tối thiểu 6 tháng
        min_nghi = timedelta(days=180)  # ~ 6 tháng
        if (den_ngay - tu_ngay) < min_nghi:
            raise ValueError("Thời gian nghỉ thai sản tối thiểu phải từ 6 tháng trở lên")

        # 3. Nghỉ trước sinh không vượt quá 2 tháng
        max_nghi_truoc = ngay_du_kien_sinh - timedelta(days=60)
        if tu_ngay.date() < max_nghi_truoc:
            raise ValueError("Thời gian nghỉ trước sinh không được vượt quá 2 tháng")

    # ============================================

    # Lấy hợp đồng lao động của nhân viên
    hopdong = HopDongLaoDong.query.filter_by(nhan_vien_id=nhan_vien_id).first()
    if not hopdong:
        raise ValueError("Không tìm thấy hợp đồng lao động cho nhân viên này")

    # Tính tổng số ngày nghỉ phép trong năm đã có
    tong_nghi_trong_nam = db.session.query(db.func.sum(NghiPhep.so_ngay_nghi)) \
        .filter(
            NghiPhep.nhan_vien_id == nhan_vien_id,
            NghiPhep.trang_thai == "Đã duyệt",
            NghiPhep.loai_nghi_phep_id != 3,
            db.extract('year', NghiPhep.tu_ngay) == nam
        ).scalar() or 0

    # Tổng số ngày sau khi cộng thêm đơn mới
    tong_nghi_du_kien = tong_nghi_trong_nam + so_ngay_nghi

    if loai_nghi_phep_id == '1' and tong_nghi_du_kien > hopdong.phep_nam:
        vuot_qua = tong_nghi_du_kien - hopdong.phep_nam
        raise ValueError(f"Số ngày nghỉ phép vượt quá {vuot_qua} ngày so với phép năm")
    
    # Update các trường cơ bản
    nghi_phep.nhan_vien_id = nhan_vien_id
    nghi_phep.loai_nghi_phep_id = loai_nghi_phep_id
    nghi_phep.tu_ngay = tu_ngay
    nghi_phep.den_ngay = den_ngay
    nghi_phep.ly_do = ly_do
    nghi_phep.trang_thai = trang_thai
    nghi_phep.so_ngay_nghi = so_ngay_nghi
    
    if loai_nghi_phep_id == "3":
        if isinstance(ngay_du_kien_sinh, str):
            ngay_du_kien_sinh = parse_date(ngay_du_kien_sinh).date()
        elif isinstance(ngay_du_kien_sinh, datetime):
            ngay_du_kien_sinh = ngay_du_kien_sinh.date()
        elif isinstance(ngay_du_kien_sinh, date):
            pass  # đã đúng kiểu, giữ nguyên
    else:
        ngay_du_kien_sinh = None
        
    nghi_phep.ngay_du_kien_sinh = ngay_du_kien_sinh
    nghi_phep.so_con = so_con
    nghi_phep.phuong_phap_sinh = phuong_phap_sinh

    if lnp_bandau != loai_nghi_phep_id and nghi_phep.can_cu_phap_ly_file:
        filename = nghi_phep.can_cu_phap_ly_file
        if not filename:
            return
        LOAI_NGHI_PHEP_FOLDER = {
            "1": UPLOAD_FOLDER_PHEPNAM,
            "2": UPLOAD_FOLDER_PHEPKL,
            "3": UPLOAD_FOLDER,  # Thai sản
        }

        # Đảm bảo thư mục tồn tại
        for folder in LOAI_NGHI_PHEP_FOLDER.values():
            os.makedirs(folder, exist_ok=True)
            
        old_folder = LOAI_NGHI_PHEP_FOLDER.get(str(lnp_bandau))
        new_folder = LOAI_NGHI_PHEP_FOLDER.get(str(loai_nghi_phep_id))

        if not old_folder or not new_folder:
            print("❌ Loại nghỉ phép không hợp lệ")
            return

        old_path = os.path.join(old_folder, filename)
        new_path = os.path.join(new_folder, filename)

        # Nếu thay đổi loại nghỉ phép -> move file
        if old_folder != new_folder and os.path.exists(old_path):
            os.makedirs(new_folder, exist_ok=True)
            shutil.move(old_path, new_path)

        # Đổi tên file để rõ ràng hơn
        ext = os.path.splitext(filename)[1]
        prefix = "nghiphepnam" if loai_nghi_phep_id == "1" else \
                "nghiphepcoluong" if loai_nghi_phep_id == "2" else \
                "nghiphepthaisan"

        new_filename = f"{prefix}_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"

        final_path = os.path.join(new_folder, new_filename)
        os.rename(new_path, final_path)

        nghi_phep.can_cu_phap_ly_file = new_filename
    # Xử lý file
    if file:  # Nếu có file mới
        # Xoá file cũ
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file))
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file)) 
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file)) 

        # Lưu file mới
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        
        if loai_nghi_phep_id == "1":
            ten_file_moi = f"nghiphepnam_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER_PHEPNAM, ten_file_moi))
        elif loai_nghi_phep_id == "2":
            ten_file_moi = f"nghiphepkhongluong_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER_PHEPKL, ten_file_moi))
        else:
            ten_file_moi = f"nghiphepthaisan_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            file.save(os.path.join(UPLOAD_FOLDER, ten_file_moi))
            
        nghi_phep.can_cu_phap_ly_file=ten_file_moi

    elif file_status == "keep":
        pass  # giữ nguyên file cũ
    try:
        db.session.commit()
        return nghi_phep
    except Exception as e:
        print(f"Error in approve_nghi_phep_service: {str(e)}")
        raise e  # Ném lại lỗi để có thể xử lý ở controller

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
    try:
        nghi_phep = NghiPhep.query.get(id)
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file))
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file))
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file))
        # Xóa đơn nghỉ phép
        db.session.delete(nghi_phep)
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error in reject_nghi_phep_service: {str(e)}")
        raise e


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
