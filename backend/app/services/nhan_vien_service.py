from app.models import  NhanVien
from .nghi_phep_service import get_tong_ngay_nghi_trong_nam
from .hopdong_laodong_service import get_phep_nam_hop_dong_hien_tai
from sqlalchemy.exc import SQLAlchemyError
from app import db
from sqlalchemy import func ,and_
TRUONG_PHONG_ROLE_ID = 5
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
    thongtin = NhanVien.query.filter_by(id=id).first()
    phep_nam = get_phep_nam_hop_dong_hien_tai(id)
    tong_ngay_nghi = get_tong_ngay_nghi_trong_nam(id)
    so_ngay_nghi_con_lai = phep_nam - tong_ngay_nghi
    thongtin.so_ngay_phep_con_lai = so_ngay_nghi_con_lai
    # print(thongtin.__dict__)
    return thongtin
def get_nhan_vien_by_trang_thai_service(trang_thai):
    return NhanVien.query.filter_by(trang_thai=trang_thai).all()

def create_nhan_vien_service(**data):
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

        # Áp dữ liệu mới vào model
        for key, value in data.items():
            if hasattr(nhan_vien, key):
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
