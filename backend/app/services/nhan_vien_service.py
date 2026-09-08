from app.models import  NhanVien
from .nghi_phep_service import get_tong_ngay_nghi_trong_nam
from .hopdong_laodong_service import get_phep_nam_hop_dong_hien_tai
from sqlalchemy.exc import SQLAlchemyError
from app import db
from sqlalchemy import func ,and_
TRUONG_PHONG_ROLE_ID = 5

# Allowlist — CHỈ những trường này được phép client tự set qua API tạo/sửa
# nhân viên thông thường. vai_tro_id, trang_thai, so_ngay_phep_con_lai và các
# cột audit/soft-delete (deleted_at, created_by...) PHẢI đi qua endpoint riêng
# có quyền riêng (vd vai_tro.sua) — không bao giờ được set qua đây, nếu không
# 1 nhân viên chỉ có quyền "sửa hồ sơ của mình" (nhan_vien.sua) có thể tự gửi
# thêm field vai_tro_id trong form để tự nâng quyền thành admin.
TRUONG_DUOC_SUA = {
    "ho_ten", "ngay_sinh", "gioi_tinh", "so_dien_thoai", "email", "dia_chi",
    "phong_ban_id", "chuc_vu_id", "avatar", "face_encoding", "password",
}


def _loc_truong_hop_le(data: dict) -> dict:
    return {key: value for key, value in data.items() if key in TRUONG_DUOC_SUA}

def email_da_ton_tai(email, exclude_id=None):
    if not email:
        return False
    q = NhanVien.query.filter(func.lower(NhanVien.email) == email.lower())
    if exclude_id:
        q = q.filter(NhanVien.id != exclude_id)
    return db.session.query(q.exists()).scalar()

def sdt_da_ton_tai(so_dien_thoai, exclude_id=None):
    if not so_dien_thoai:
        return False
    q = NhanVien.query.filter(NhanVien.so_dien_thoai == so_dien_thoai)
    if exclude_id:
        q = q.filter(NhanVien.id != exclude_id)
    return db.session.query(q.exists()).scalar()
def da_co_truong_phong(phong_ban_id, exclude_id=None):
    """
    Trả về True nếu phòng ban này đã có 1 trưởng phòng (chuc_vu_id = TRUONG_PHONG_ROLE_ID)
    - exclude_id: bỏ qua nhân viên đang update (để không tự đụng chính mình)
    """
    if not phong_ban_id:
        return False

    q = NhanVien.query.filter(
        and_(
            NhanVien.phong_ban_id == phong_ban_id,
            NhanVien.chuc_vu_id == TRUONG_PHONG_ROLE_ID
        )
    )

    if exclude_id:
        q = q.filter(NhanVien.id != exclude_id)

    return db.session.query(q.exists()).scalar()
def get_all_nhan_vien_service():
    return NhanVien.query.all()

def get_nhan_vien_by_id_service(id):
    """Đọc THUẦN TÚY — không mutate/commit gì cả. Trước đây hàm "get" này tự ý
    tính lại so_ngay_phep_con_lai rồi ghi vào entity đang được session quản
    lý; vì update/delete cũng gọi hàm này trước khi commit, chỉ cần XEM hồ sơ
    nhân viên (không hề "sửa" gì) là con số so_ngay_phep_con_lai đã âm thầm bị
    ghi đè vào DB — vi phạm nguyên tắc CQS (query không được có side-effect).
    Muốn số ngày phép còn lại đã tính mới nhất, gọi tinh_so_ngay_phep_con_lai_service
    riêng (không đụng vào DB)."""
    return NhanVien.query.filter_by(id=id).first()


def tinh_so_ngay_phep_con_lai_service(nhan_vien_id):
    """Tính THUẦN TÚY (không ghi DB) — dùng khi cần hiển thị số ngày phép còn
    lại chính xác nhất tại thời điểm xem, không phải giá trị đã lưu sẵn (có
    thể lỗi thời) trong cột so_ngay_phep_con_lai."""
    phep_nam = get_phep_nam_hop_dong_hien_tai(nhan_vien_id)
    tong_ngay_nghi = get_tong_ngay_nghi_trong_nam(nhan_vien_id)
    return max(0, phep_nam - tong_ngay_nghi)
def get_nhan_vien_by_trang_thai_service(trang_thai):
    return NhanVien.query.filter_by(trang_thai=trang_thai).all()

def create_nhan_vien_service(**data):
    data = _loc_truong_hop_le(data)
    try:
        phong_ban_id = data.get("phong_ban_id")
        chuc_vu_id = data.get("chuc_vu_id")
        email = data.get("email")
        so_dien_thoai = data.get("so_dien_thoai")

        # Rule: email không được trùng
        if email_da_ton_tai(email):
            return (
                {'error': 'Email đã tồn tại trong hệ thống'}, 
                409
            )

        # Rule: số điện thoại không được trùng
        if sdt_da_ton_tai(so_dien_thoai):
            return (
                {'error': 'Số điện thoại đã được sử dụng'}, 
                409
            )

        # Rule: mỗi phòng ban chỉ có 1 trưởng phòng
        if chuc_vu_id and int(chuc_vu_id) == TRUONG_PHONG_ROLE_ID:
            if da_co_truong_phong(phong_ban_id):
                return (
                    {'error': 'Phòng ban này đã có Trưởng phòng. Không thể thêm thêm 1 Trưởng phòng nữa.'},
                    400
                )

        nhan_vien = NhanVien(**data)
        db.session.add(nhan_vien)
        db.session.commit()
        return (nhan_vien, 201)

    except SQLAlchemyError as e:
        db.session.rollback()
        # logger.error(...) -> logger đang ở controller, nên ở đây không gọi logger nếu chưa import.
        return (
            {'error': 'Không thể tạo nhân viên, vui lòng thử lại sau'},
            500
        )

# ====== Update ======

def update_nhan_vien_service(id, **data):
    nhan_vien = get_nhan_vien_by_id_service(id)
    if not nhan_vien:
        return ({'error': 'Không tìm thấy nhân viên'}, 404)

    data = _loc_truong_hop_le(data)
    try:
        # Lấy giá trị sau update (ưu tiên data mới, fallback giá trị cũ)
        phong_ban_id_moi = data.get("phong_ban_id", nhan_vien.phong_ban_id)
        chuc_vu_id_moi = data.get("chuc_vu_id", nhan_vien.chuc_vu_id)

        email_moi = data.get("email", nhan_vien.email)
        sdt_moi = data.get("so_dien_thoai", nhan_vien.so_dien_thoai)

        # Kiểm tra trùng email (ngoại trừ chính mình)
        if email_moi and email_da_ton_tai(email_moi, exclude_id=id):
            return (
                {'error': 'Email này đã được sử dụng bởi nhân viên khác'}, 
                409
            )

        # Kiểm tra trùng SĐT (ngoại trừ chính mình)
        if sdt_moi and sdt_da_ton_tai(sdt_moi, exclude_id=id):
            return (
                {'error': 'Số điện thoại này đã được sử dụng'}, 
                409
            )

        # Rule trưởng phòng: 1 người/phòng ban
        if chuc_vu_id_moi and int(chuc_vu_id_moi) == TRUONG_PHONG_ROLE_ID:
            if da_co_truong_phong(phong_ban_id_moi, exclude_id=id):
                return (
                    {'error': 'Phòng ban này đã có Trưởng phòng. Không thể đặt thêm 1 Trưởng phòng nữa.'},
                    400
                )

        # Áp dữ liệu mới vào model — data đã được _loc_truong_hop_le() lọc qua
        # allowlist ở trên, không dùng hasattr() nữa (hasattr trả True cho MỌI
        # cột của model, không phải allowlist — đó chính là lỗ hổng cũ).
        for key, value in data.items():
            setattr(nhan_vien, key, value)

        db.session.commit()
        return (nhan_vien, 200)

    except SQLAlchemyError as e:
        db.session.rollback()
        return (
            {'error': 'Không thể cập nhật nhân viên, vui lòng thử lại sau'},
            500
        )

def delete_nhan_vien_service(id):
    nhan_vien = get_nhan_vien_by_id_service(id)
    if not nhan_vien:
        return {'error': 'Không tìm thấy nhân viên'}

    try:
        nhan_vien.soft_delete()  # xóa mềm — giữ lại lịch sử lương/chứng chỉ/bảo hiểm
        db.session.commit()
        return {'message': 'Xóa nhân viên thành công'}
    except SQLAlchemyError as e:
        db.session.rollback()
        return {'error': str(e)}
    
def search_nhan_vien_theoten_service(q):
    return NhanVien.query.filter(
    func.lower(NhanVien.ho_ten).like(f"%{q.lower()}%")).all()
