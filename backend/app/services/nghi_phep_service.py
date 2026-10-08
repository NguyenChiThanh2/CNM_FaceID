from app import db
from app.models.nghi_phep_model import NghiPhep
from app.models.loai_nghi_phep_model import LoaiNghiPhep
from app.models.hopdong_laodong_model import HopDongLaoDong
from datetime import datetime
from sqlalchemy import extract, and_, or_, func
import os
from werkzeug.utils import secure_filename
from datetime import datetime, date, timedelta
from upload_paths import UPLOAD_FOLDER, UPLOAD_FOLDER_PHEPNAM, UPLOAD_FOLDER_PHEPKL
import shutil

FILE_EXTENSIONS_HOP_LE = {".pdf", ".jpg", ".jpeg", ".png"}


def _kiem_tra_duoi_file_hop_le(filename):
    """Chặn upload file thực thi được (.html, .svg, .js...) — nếu ai đó tải
    lên 1 file .html chứa <script>, sau này route phục vụ file lại trả đúng
    Content-Type text/html khiến trình duyệt CHẠY script đó (stored XSS)."""
    ext = os.path.splitext(filename)[1]
    if ext.lower() not in FILE_EXTENSIONS_HOP_LE:
        raise ValueError(f"Chỉ chấp nhận file PDF, JPG, PNG (nhận được: {ext or 'không có đuôi'})")
    return ext


def get_upload_folder_and_prefix(loai_nghi_phep_id):
    """Trả về (thư mục lưu file, tiền tố tên file) cho 1 loại nghỉ phép.
    Chỉ 2 loại có sẵn từ trước ("Phép năm"=1, "Phép có lương"=2) dùng thư mục
    riêng; MỌI loại khác (kể cả loại mới tự thêm sau này) dùng chung 1 thư mục
    mặc định — để loại mới không bị lỗi "không hợp lệ" như dict cứng cũ."""
    if str(loai_nghi_phep_id) == "1":
        return UPLOAD_FOLDER_PHEPNAM, "nghiphepnam"
    if str(loai_nghi_phep_id) == "2":
        return UPLOAD_FOLDER_PHEPKL, "nghiphepcoluong"
    return UPLOAD_FOLDER, "nghiphep"

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

ID_LOAI_PHEP_NAM = 1  # "Phép năm" — quỹ nghỉ có hạn mức (hopdong.phep_nam),
# tách biệt với "Phép có lương" (id=2) và các loại khác. ID này đã được dùng
# hardcode sẵn ở nhiều chỗ trong file (vd `if loai_nghi_phep_id == '1'`) nên
# giữ cùng quy ước thay vì tự chế thêm 1 cách nhận diện khác.


def _tong_ngay_phep_nam_da_duyet(nhan_vien_id, nam=None, tru_don_id=None, khop_ca_tu_va_den=False):
    """Nguồn tính DUY NHẤT cho 'đã dùng bao nhiêu ngày Phép năm trong 1 năm'.

    Trước đây có 3 chỗ tự tính lại giá trị này theo 3 cách khác nhau
    (create_nghi_phep_service, update_nghi_phep_service, get_tong_ngay_nghi_trong_nam),
    và 2 trong 3 chỗ (create/update) VÔ TÌNH cộng luôn cả ngày nghỉ loại
    "Phép có lương" (id=2) vào quỹ Phép năm khi kiểm tra vượt hạn mức — 2 quỹ
    nghỉ khác nhau bị gộp nhầm làm một. Chỉ lọc đúng loai_nghi_phep_id=1 để
    không lặp lại lỗi này, và để loại nghỉ mới thêm sau này (id khác) không
    vô tình bị tính vào đây.

    - nam: nếu có, chỉ tính đơn có tu_ngay (hoặc cả den_ngay nếu khop_ca_tu_va_den=True) rơi vào năm này.
    - tru_don_id: loại trừ 1 đơn theo id (dùng khi update để không tự cộng đơn đang sửa vào tổng).
    """
    q = NghiPhep.query.filter(
        NghiPhep.nhan_vien_id == nhan_vien_id,
        NghiPhep.trang_thai == "Đã duyệt",
        NghiPhep.loai_nghi_phep_id == ID_LOAI_PHEP_NAM,
    )
    if nam is not None:
        if khop_ca_tu_va_den:
            q = q.filter(or_(
                extract('year', NghiPhep.tu_ngay) == nam,
                extract('year', NghiPhep.den_ngay) == nam,
            ))
        else:
            q = q.filter(extract('year', NghiPhep.tu_ngay) == nam)
    if tru_don_id:
        q = q.filter(NghiPhep.id != tru_don_id)
    return q.with_entities(func.sum(NghiPhep.so_ngay_nghi)).scalar() or 0


def get_all_nghi_phep_service():
    return NghiPhep.query.order_by(NghiPhep.id.desc()).all()

def get_nghi_phep_by_id_service(id):
    return NghiPhep.query.filter_by(id=id).first()

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
    loai = LoaiNghiPhep.query.get(loai_nghi_phep_id)
    if not loai:
        raise ValueError("Loại nghỉ phép không tồn tại")

    tu_ngay = convert_to_datetime(tu_ngay)
    den_ngay = convert_to_datetime(den_ngay)
    validate_dates(tu_ngay, den_ngay)

    # Tính số ngày nghỉ mới
    so_ngay_nghi = (den_ngay - tu_ngay).days + 1
    nam = tu_ngay.year
    # ========== QUY ĐỊNH CHO LOẠI YÊU CẦU THÔNG TIN SINH (vd nghỉ thai sản) ==========
    # Đọc cờ từ danh mục LoaiNghiPhep thay vì hardcode ID — loại nào bật cờ này
    # (kể cả loại admin tự thêm sau này) đều áp dụng đúng quy định dưới đây.
    if loai.yeu_cau_thong_tin_sinh:
        if not ngay_du_kien_sinh:
            raise ValueError("Phải nhập ngày dự kiến sinh hoặc nhận nuôi")
        
        ngay_du_kien_sinh = convert_to_datetime(ngay_du_kien_sinh).date()

        # 1. Ngày dự kiến sinh phải trong tương lai
        if ngay_du_kien_sinh < date.today():
            raise ValueError("Ngày dự kiến sinh phải là ngày trong tương lai")

        # # 2. Thời gian nghỉ tối thiểu 6 tháng
        # min_nghi = timedelta(days=180)  # ~ 6 tháng
        # if (den_ngay - tu_ngay) < min_nghi:
        #     raise ValueError("Thời gian nghỉ thai sản tối thiểu phải từ 6 tháng trở lên")

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

    # Tính tổng số ngày Phép năm đã dùng trong năm (chỉ loại id=1 — xem
    # _tong_ngay_phep_nam_da_duyet để biết vì sao không đếm cả loại khác)
    tong_nghi_trong_nam = _tong_ngay_phep_nam_da_duyet(nhan_vien_id, nam=nam)

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
        ext = _kiem_tra_duoi_file_hop_le(filename)
        folder, prefix = get_upload_folder_and_prefix(loai_nghi_phep_id)
        ten_file_moi = f"{prefix}_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
        os.makedirs(folder, exist_ok=True)
        file.save(os.path.join(folder, ten_file_moi))
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
    nghi_phep = NghiPhep.query.filter_by(id=id).first()
    if not nghi_phep:
        raise ValueError("Không tìm thấy đơn nghỉ phép")
    lnp_bandau = nghi_phep.loai_nghi_phep_id
    loai = LoaiNghiPhep.query.get(loai_nghi_phep_id)
    if not loai:
        raise ValueError("Loại nghỉ phép không tồn tại")
    tu_ngay = parse_date(tu_ngay)
    den_ngay = parse_date(den_ngay)
    validate_dates(tu_ngay, den_ngay)
    # Tính số ngày nghỉ mới
    so_ngay_nghi = (den_ngay - tu_ngay).days + 1
    nam = tu_ngay.year

    # ========== QUY ĐỊNH CHO LOẠI YÊU CẦU THÔNG TIN SINH (đọc cờ, không hardcode ID) ==========
    if loai.yeu_cau_thong_tin_sinh:
        if not ngay_du_kien_sinh:
            raise ValueError("Phải nhập ngày dự kiến sinh hoặc nhận nuôi")
        
        ngay_du_kien_sinh = parse_date(ngay_du_kien_sinh).date()

        # # 1. Ngày dự kiến sinh phải trong tương lai
        # if ngay_du_kien_sinh < date.today():
        #     raise ValueError("Ngày dự kiến sinh phải là ngày trong tương lai")

        # # 2. Thời gian nghỉ tối thiểu 6 tháng
        # min_nghi = timedelta(days=180)  # ~ 6 tháng
        # if (den_ngay - tu_ngay) < min_nghi:
        #     raise ValueError("Thời gian nghỉ thai sản tối thiểu phải từ 6 tháng trở lên")

        # 3. Nghỉ trước sinh không vượt quá 2 tháng
        max_nghi_truoc = ngay_du_kien_sinh - timedelta(days=60)
        if tu_ngay.date() < max_nghi_truoc:
            raise ValueError("Thời gian nghỉ trước sinh không được vượt quá 2 tháng")

    # ============================================

    # Lấy hợp đồng lao động của nhân viên
    hopdong = HopDongLaoDong.query.filter_by(nhan_vien_id=nhan_vien_id).first()
    if not hopdong:
        raise ValueError("Không tìm thấy hợp đồng lao động cho nhân viên này")

    # Tính tổng số ngày Phép năm đã dùng trong năm — cùng 1 nguồn với
    # create_nghi_phep_service (xem _tong_ngay_phep_nam_da_duyet), loại trừ
    # chính đơn đang sửa để không tự cộng 2 lần khi sửa 1 đơn Phép năm đã duyệt
    tong_nghi_trong_nam = _tong_ngay_phep_nam_da_duyet(nhan_vien_id, nam=nam, tru_don_id=id)

    # Tổng số ngày sau khi cộng thêm đơn mới
    tong_nghi_du_kien = tong_nghi_trong_nam + so_ngay_nghi

    # NOTE: quy định "vượt quá quỹ phép năm" hiện chỉ áp dụng cho đúng loại
    # id=1 ("Phép năm") — đây là quy tắc nghiệp vụ riêng biệt (gắn với
    # hopdong.phep_nam), CHƯA tổng quát hóa theo cờ vì cần quyết định nghiệp vụ
    # thêm (loại mới nào thì tính vào quỹ phép năm?) trước khi sửa tiếp.
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

    if loai.yeu_cau_thong_tin_sinh:
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

    if loai.yeu_cau_thong_tin_sinh and trang_thai == "Đã duyệt":
        # Nếu là loại yêu cầu thông tin sinh và đã duyệt, đảm bảo dữ liệu không bị xóa
        if file:
            filename = secure_filename(file.filename)
            ext = _kiem_tra_duoi_file_hop_le(filename)
            ten_file_moi = f"xinlamlaisom_nghiphep_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            file.save(os.path.join(UPLOAD_FOLDER, ten_file_moi))
            nghi_phep.file_bo_sung = ten_file_moi
    else:
        if lnp_bandau != loai_nghi_phep_id and nghi_phep.can_cu_phap_ly_file:
            filename = nghi_phep.can_cu_phap_ly_file
            if not filename:
                return

            old_folder, _ = get_upload_folder_and_prefix(lnp_bandau)
            new_folder, prefix = get_upload_folder_and_prefix(loai_nghi_phep_id)
            os.makedirs(old_folder, exist_ok=True)
            os.makedirs(new_folder, exist_ok=True)

            old_path = os.path.join(old_folder, filename)
            new_path = os.path.join(new_folder, filename)

            # Nếu thay đổi loại nghỉ phép -> move file
            if old_folder != new_folder and os.path.exists(old_path):
                shutil.move(old_path, new_path)

            # Đổi tên file để rõ ràng hơn — CHỈ khi file thực sự có mặt ở
            # new_path. Trước đây gọi os.rename thẳng không kiểm tra: nếu file
            # gốc đã bị mất/xóa ngoài ý muốn (os.path.exists(old_path) ở trên
            # là False nên không move được), new_path không tồn tại, os.rename
            # ném FileNotFoundError khiến CẢ REQUEST sửa đơn nghỉ phép bị lỗi
            # 500 dù người dùng chỉ đổi loại nghỉ phép, không hề đụng tới file.
            if os.path.exists(new_path):
                ext = os.path.splitext(filename)[1]
                new_filename = f"{prefix}_nv{nhan_vien_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
                final_path = os.path.join(new_folder, new_filename)
                os.rename(new_path, final_path)
                nghi_phep.can_cu_phap_ly_file = new_filename
            # else: file vật lý không có mặt (đã mất từ trước) -> giữ nguyên
            # tên cũ trong DB, không rename/crash vì 1 file vốn không tồn tại
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
            ext = _kiem_tra_duoi_file_hop_le(filename)

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
        nghi_phep = NghiPhep.query.filter_by(id=id).first()
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")

        # Kiểm tra trạng thái của đơn nghỉ phép
        if nghi_phep.trang_thai != "Chờ duyệt":
            raise ValueError("Không thể duyệt đơn khi trạng thái không phải là 'Chờ duyệt'")

        # Duyệt đơn nghỉ phép và cập nhật trạng thái
        nghi_phep.trang_thai = "Đã duyệt"

        # Chỉ trừ ngày phép còn lại nếu loại nghỉ phép này có co_luong=True
        # (đọc từ danh mục LoaiNghiPhep, không hardcode tên loại)
        nhan_vien = nghi_phep.nhan_vien
        if nhan_vien and nghi_phep.loai_nghi_phep and nghi_phep.loai_nghi_phep.co_luong:
            nhan_vien.so_ngay_phep_con_lai -= nghi_phep.so_ngay_nghi

        db.session.commit()
        return nghi_phep
    except Exception as e:
        print(f"Error in approve_nghi_phep_service: {str(e)}")
        raise e  # Ném lại lỗi để có thể xử lý ở controller



def reject_nghi_phep_service(id):
    try:
        nghi_phep = NghiPhep.query.filter_by(id=id).first()
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
        nghi_phep = NghiPhep.query.filter_by(id=id).first()
        if not nghi_phep:
            raise ValueError("Nghỉ phép không tồn tại")
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER, nghi_phep.can_cu_phap_ly_file))
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPNAM, nghi_phep.can_cu_phap_ly_file))
        if nghi_phep.can_cu_phap_ly_file and os.path.exists(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file)):
            os.remove(os.path.join(UPLOAD_FOLDER_PHEPKL, nghi_phep.can_cu_phap_ly_file))
        # Xóa đơn nghỉ phép
        nghi_phep.soft_delete()
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error in reject_nghi_phep_service: {str(e)}")
        raise e


def cancle_nghi_phep_service(id):
    try:
        nghi_phep = NghiPhep.query.filter_by(id=id).first()
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


def get_tong_ngay_nghi_trong_nam(id):
    """Tổng số ngày Phép năm đã dùng trong năm hiện tại — dùng để tính
    so_ngay_phep_con_lai. Cùng 1 nguồn với create/update_nghi_phep_service
    (_tong_ngay_phep_nam_da_duyet); trước đây hàm này tự lọc riêng bằng
    != 3, != 2 (loại trừ theo danh sách biết trước) thay vì == 1 (chỉ định
    đúng loại cần đếm) — nếu sau này có thêm loại nghỉ phép mới (id 4, 5...),
    cách lọc trừ cũ sẽ vô tình đếm nhầm loại mới đó vào quỹ phép năm."""
    nam_hien_tai = datetime.now().year
    return _tong_ngay_phep_nam_da_duyet(id, nam=nam_hien_tai, khop_ca_tu_va_den=True)