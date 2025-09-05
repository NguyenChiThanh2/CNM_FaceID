from app.models.giay_phep_model import GiayPhep
from app import db
from datetime import datetime



def get_all_giay_phep_service():
    return GiayPhep.query.all()

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
        trang_thai="Chưa duyệt"
    )
    
    try:
        db.session.add(giay_phep)
        db.session.commit()
        return giay_phep
    except Exception as e:
        db.session.rollback()
        # chỉ return None hoặc raise
        raise Exception(str(e))
    
    