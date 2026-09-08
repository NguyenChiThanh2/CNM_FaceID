
from .phuc_loi_routes import phuc_loi_bp
from .phong_ban_routes import phong_ban_bp
from .nghi_phep_routes import nghi_phep_bp
from .luong_routes import luong_bp
from .danh_gia_routes import danh_gia_bp
from .chuc_vu_routes import chuc_vu_bp
from app.routes.cham_cong_routes import cham_cong_bp
from .nhan_vien_phuc_loi_routes import nhan_vien_phuc_loi_bp
from .nhan_vien_routes import nhan_vien_bp
from .loai_nghi_phep_routes import loai_nghi_phep_bp
from .face_routes import face_bp
from .bang_luong_routes import bangluong_bp
from .tinh_luong_routes import tinhluong_bp
from .giay_phep_routes import giayphep_bp
from .chi_tiet_luong_routes import chitietluong_bp
from .thuong_routes import thuong_bp
from .khau_tru_routes import khau_tru_bp
from .ngay_nghi_le_routes import ngay_nghi_le_bp
from .facecheckin_routes import facecheckin_bp
from .chung_chi_routes import chung_chi_bp
from .hopdong_routes import hopdong_bp
from .nguoi_phu_thuoc_routes import nguoi_phu_thuoc_bp
from .bh_dn_routes import bao_hiem_dn_bp
from .vai_tro_routes import vai_tro_bp
from .file_routes import file_bp
def register_routes(app):
    app.register_blueprint(vai_tro_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(bao_hiem_dn_bp, url_prefix='/api')
    app.register_blueprint(ngay_nghi_le_bp, url_prefix='/api')
    app.register_blueprint(khau_tru_bp, url_prefix='/api')
    app.register_blueprint(thuong_bp, url_prefix='/api')
    app.register_blueprint(facecheckin_bp)
    app.register_blueprint(chitietluong_bp, url_prefix='/api')
    app.register_blueprint(giayphep_bp, url_prefix='/api')
    app.register_blueprint(tinhluong_bp, url_prefix='/api')
    app.register_blueprint(bangluong_bp, url_prefix='/api') 
    app.register_blueprint(phuc_loi_bp, url_prefix='/api')
    app.register_blueprint(phong_ban_bp, url_prefix='/api')
    app.register_blueprint(nghi_phep_bp, url_prefix='/api')
    app.register_blueprint(luong_bp, url_prefix='/api')
    app.register_blueprint(danh_gia_bp, url_prefix='/api/danhgia')
    app.register_blueprint(chuc_vu_bp, url_prefix='/api')
    app.register_blueprint(cham_cong_bp)
    app.register_blueprint(face_bp)
    app.register_blueprint(nhan_vien_phuc_loi_bp, url_prefix='/api')
    app.register_blueprint(nhan_vien_bp, url_prefix='/api')
    app.register_blueprint(loai_nghi_phep_bp, url_prefix='/api')
    app.register_blueprint(chung_chi_bp, url_prefix='/api')
    app.register_blueprint(hopdong_bp, url_prefix='/api')
    app.register_blueprint(nguoi_phu_thuoc_bp, url_prefix="/api/nguoi-phu-thuoc")