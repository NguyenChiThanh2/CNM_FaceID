from app.models import  NhanVien
from sqlalchemy.exc import SQLAlchemyError
from app import db
from sqlalchemy import func ,and_
TRUONG_PHONG_ROLE_ID = 5
def get_all_nhan_vien_service():
    return NhanVien.query.all()

def get_nhan_vien_by_id_service(id):
    return NhanVien.query.get(id)
def get_nhan_vien_by_trang_thai_service(trang_thai):
    return NhanVien.query.filter_by(trang_thai=trang_thai).all()

def create_nhan_vien_service(**data):
    try:
        phong_ban_id = data.get("phong_ban_id")
        chuc_vu_id = data.get("chuc_vu_id")

        #  Rule: mỗi phòng ban chỉ có 1 trưởng phòng
        if chuc_vu_id and int(chuc_vu_id) == TRUONG_PHONG_ROLE_ID:
            if da_co_truong_phong(phong_ban_id):
                return {
                    'error': 'Phòng ban này đã có Trưởng phòng. Không thể thêm thêm 1 Trưởng phòng nữa.'
                }

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
        # Lấy giá trị sắp cập nhật (ưu tiên data gửi lên; fallback về giá trị cũ nếu FE không gửi)
        phong_ban_id_moi = data.get("phong_ban_id", nhan_vien.phong_ban_id)
        chuc_vu_id_moi = data.get("chuc_vu_id", nhan_vien.chuc_vu_id)

        #  Rule trưởng phòng 1 người / phòng ban
        if chuc_vu_id_moi and int(chuc_vu_id_moi) == TRUONG_PHONG_ROLE_ID:
            if da_co_truong_phong(phong_ban_id_moi, exclude_id=id):
                return {
                    'error': 'Phòng ban này đã có Trưởng phòng. Không thể đặt thêm 1 Trưởng phòng nữa.'
                }

        # Nếu pass rule thì mới set field
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
    
def search_nhan_vien_theoten_service(q):
    return NhanVien.query.filter(
    func.lower(NhanVien.ho_ten).like(f"%{q.lower()}%")).all()
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