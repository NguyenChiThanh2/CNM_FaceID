from app.models.giay_phep_model import GiayPhep
from app import db

def get_giay_phep_quen_chamcong_service(cham_cong_id):
    return GiayPhep.query.filter(GiayPhep.cham_cong_id == cham_cong_id, GiayPhep.loai_giay_phep == "Quên chấm công").first()