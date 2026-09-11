from app import db
from app.models.khau_tru_model import KhauTru
from app.models.khautru_nhanvien_model import KhauTruNhanVien
from datetime import datetime
from decimal import Decimal
import os
from werkzeug.utils import secure_filename
from upload_paths import UPLOAD_FOLDER_KHAUTRU

FILE_EXTENSIONS_HOP_LE = {".pdf", ".jpg", ".jpeg", ".png"}


def _kiem_tra_duoi_file_hop_le(filename):
    """Chặn upload file thực thi được (.html, .svg, .js...) — nếu ai đó tải
    lên 1 file .html chứa <script>, sau này route phục vụ file lại trả đúng
    Content-Type text/html khiến trình duyệt CHẠY script đó (stored XSS)."""
    ext = os.path.splitext(filename)[1]
    if ext.lower() not in FILE_EXTENSIONS_HOP_LE:
        raise ValueError(f"Chỉ chấp nhận file PDF, JPG, PNG (nhận được: {ext or 'không có đuôi'})")
    return ext


# Lấy tất cả khấu trừ
def get_all_khau_tru_service():
    return KhauTru.query.order_by(KhauTru.ngay_quyet_dinh.desc()).all()

# Lấy khấu trừ theo tên
def get_khau_tru_by_name_service(ten_khau_tru):
    return KhauTru.query.filter_by(ten_khau_tru=ten_khau_tru).first()

# Lấy khấu trừ theo ID
def get_khau_tru_by_id_service(khau_tru_id):
    return KhauTru.query.get(khau_tru_id)
def get_khau_tru_by_nhan_vien_id_service(nhan_vien_id):
    return (
        db.session.query(KhauTru)
        .join(KhauTruNhanVien, KhauTruNhanVien.khau_tru_id == KhauTru.id)
        .filter(KhauTruNhanVien.nhan_vien_id == nhan_vien_id)
        .all()
    )

# Thêm mới khấu trừ
def create_khau_tru_service(ten_khau_tru,loai_khau_tru,so_tien,ghi_chu,ngay_quyet_dinh,file=None):
    
    # Xử lý file upload
    filename = None
    ten_file_moi = None 
    if file:
        filename = secure_filename(file.filename)
        ext = _kiem_tra_duoi_file_hop_le(filename)
        ten_file_moi = f"khautru_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
        file.save(os.path.join(UPLOAD_FOLDER_KHAUTRU, ten_file_moi))
    # Ép kiểu an toàn
    # so_tien = Decimal(str(so_tien, 0))
    ngay_quyet_dinh = datetime.strptime(ngay_quyet_dinh, "%Y-%m-%d").date()

    addkhau_tru = KhauTru(
        ten_khau_tru=ten_khau_tru,
        loai_khau_tru=loai_khau_tru,
        so_tien=so_tien,
        ngay_quyet_dinh=ngay_quyet_dinh,
        ghi_chu=ghi_chu,
        file_dinh_kem=ten_file_moi,
    )
    try:
        db.session.add(addkhau_tru)
        db.session.commit()

        return addkhau_tru
       
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi khi tạo khấu trừ: {e}")
        return {"message": "Lỗi hệ thống, vui lòng thử lại sau"}, 500

# Cập nhật khấu trừ
def update_khau_tru_service(id,ten_khau_tru,loai_khau_tru,so_tien,ghi_chu,ngay_quyet_dinh,file=None,file_status=None):
    khau_tru = get_khau_tru_by_id_service(id)
    ngay_quyet_dinh = datetime.strptime(ngay_quyet_dinh, "%Y-%m-%d").date()
    
    khau_tru.ten_khau_tru = ten_khau_tru
    khau_tru.loai_khau_tru = loai_khau_tru
    khau_tru.so_tien = so_tien
    khau_tru.ngay_quyet_dinh = ngay_quyet_dinh
    khau_tru.ghi_chu = ghi_chu

    # Xử lý file
    if file:  # Nếu có file mới
        # Xoá file cũ
        if khau_tru.file_dinh_kem and os.path.exists(os.path.join(UPLOAD_FOLDER_KHAUTRU, khau_tru.file_dinh_kem)):
            os.remove(os.path.join(UPLOAD_FOLDER_KHAUTRU, khau_tru.file_dinh_kem))

        # Lưu file mới
        filename = secure_filename(file.filename)
        ext = _kiem_tra_duoi_file_hop_le(filename)
        ten_file_moi = f"khautru_{datetime.now().strftime('%Y%m%d')}_{datetime.now().strftime('%H%M%S')}{ext}"
        file.save(os.path.join(UPLOAD_FOLDER_KHAUTRU, ten_file_moi))
        khau_tru.file_dinh_kem=ten_file_moi

    elif file_status == "keep":
        pass  # giữ nguyên file cũ
    try:
        db.session.commit()
        return khau_tru
    except Exception as e:
        db.session.rollback()
        print(f"Lỗi khi sửa khấu trừ: {e}")
        return {"message": "Lỗi hệ thống, vui lòng thử lại sau"}, 500

# Xóa khấu trừ — xóa MỀM, và chặn hẳn nếu còn nhân viên đang gắn với khoản
# khấu trừ này. Trước đây xóa cứng (db.session.delete) trong khi
# KhauTruNhanVien.khau_tru_id có ondelete='CASCADE' ở tầng DB — xóa 1 KhauTru
# sẽ tự động xóa CỨNG theo toàn bộ lịch sử KhauTruNhanVien liên quan, mất
# luôn không khôi phục được, dù KhauTruNhanVien vốn thiết kế để xóa mềm.
# Không còn tự xóa file đính kèm ở đây nữa — xóa mềm nghĩa là bản ghi (và file
# minh chứng của nó) vẫn có thể khôi phục, xóa file vật lý ngay lúc này sẽ
# phá mất khả năng khôi phục đó.
def delete_khau_tru_service(khau_tru_id):
    khau_tru = KhauTru.query.get(khau_tru_id)
    if not khau_tru:
        raise ValueError("Khấu trừ không tồn tại")

    so_nhan_vien = KhauTruNhanVien.query.filter_by(khau_tru_id=khau_tru_id).count()
    if so_nhan_vien:
        raise ValueError(
            f"Không thể xóa vì còn {so_nhan_vien} nhân viên đang gắn với khoản khấu trừ này"
        )

    try:
        khau_tru.soft_delete()
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))


def add_nhan_vien_to_khau_tru_service(khau_tru_id, nhan_vien_ids):
    # Prefetch 1 lần toàn bộ bản ghi đã tồn tại cho các nhân viên trong danh
    # sách — trước đây query riêng KhauTruNhanVien cho TỪNG nhân viên trong
    # vòng lặp (N+1 query: N = số nhân viên được chọn thêm vào khấu trừ).
    ids = [item["id"] for item in nhan_vien_ids]
    existing_map = {
        e.nhan_vien_id: e
        for e in db.session.query(KhauTruNhanVien)
        .filter(KhauTruNhanVien.khau_tru_id == khau_tru_id, KhauTruNhanVien.nhan_vien_id.in_(ids))
        .all()
    } if ids else {}

    for nv_id in nhan_vien_ids:
        so_tien = nv_id.get("so_tien_thuc_te")  # có thể là None
        existing = existing_map.get(nv_id["id"])

        if not existing:
            new_entry = KhauTruNhanVien(
                nhan_vien_id=nv_id["id"],
                khau_tru_id=khau_tru_id,
                so_tien_thuc_te=so_tien
            )
            db.session.add(new_entry)
            # Ghi lại vào map — nếu nhan_vien_ids có id trùng lặp trong cùng 1
            # lần gọi, lần lặp sau vẫn nhận ra là "đã tồn tại" thay vì insert
            # trùng thêm 1 bản ghi nữa (giữ đúng hành vi như bản .first() cũ,
            # vì SQLAlchemy tự autoflush trước mỗi query nên bản cũ vẫn thấy
            # được insert chưa commit ở lần lặp trước).
            existing_map[nv_id["id"]] = new_entry
        else:
            # cập nhật lại nếu khác
            if existing.so_tien_thuc_te != so_tien:
                existing.so_tien_thuc_te = so_tien

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise Exception(str(e))

def get_nhan_vien_by_khau_tru_service(khau_tru_id):
    khau_tru = KhauTru.query.get(khau_tru_id)
    if not khau_tru:
        return None, "Thưởng không tồn tại", 404

    tham_gias = KhauTruNhanVien.query.filter_by(khau_tru_id=khau_tru_id).all()
    if not tham_gias:
        return None, "Không có nhân viên tham gia khấu trừ này", 404

    result = []
    for tg in tham_gias:
        nv = tg.nhan_vien
        result.append({
            "id": nv.id,
            "ho_ten": nv.ho_ten,
            "email": nv.email,
            "phong_ban_id": nv.phong_ban_id,
            "so_tien": float(tg.khau_tru.so_tien) if tg.khau_tru.so_tien else None,
            "so_tien_thuc_te": float(tg.so_tien_thuc_te) if tg.so_tien_thuc_te else None,
        })

    return result, None, 200


def remove_nhan_vien_from_khau_tru_service(khau_tru_id, nhan_vien_id):
    entry = KhauTruNhanVien.query.filter_by(
        khau_tru_id=khau_tru_id,
        nhan_vien_id=nhan_vien_id
    ).first()

    if entry:
        entry.soft_delete()
        db.session.commit()
        return "Xóa nhân viên khỏi khấu trừ thành công", None, 200
    else:
        return None, "Không tìm thấy nhân viên trong khấu trừ", 404