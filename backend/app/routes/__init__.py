from .user_routes import user_bp
from .role_routes import role_bp
from .phuc_loi_routes import phuc_loi_bp
from .phong_ban_routers import phong_ban_bp
from .nghi_phep_routers import nghi_phep_bp
from .luong_routers import luong_bp
from .danh_gia_routers import danh_gia_bp
from .chuc_vu_routers import chuc_vu_bp
from app.routes.cham_cong_routers import cham_cong_bp
from .nhan_vien_phuc_loi_routes import nhan_vien_phuc_loi_bp
from .nhan_vien_routes import nhan_vien_bp
from .dao_tao_routers import dao_tao_bp
from .loai_nghi_phep import loai_nghi_phep_bp

def register_routes(app):
    
    app.register_blueprint(user_bp, url_prefix='/api')  
    app.register_blueprint(role_bp, url_prefix='/api')  
    app.register_blueprint(phuc_loi_bp, url_prefix='/api')
    app.register_blueprint(phong_ban_bp, url_prefix='/api')
    app.register_blueprint(nghi_phep_bp, url_prefix='/api')
    app.register_blueprint(luong_bp, url_prefix='/api')
    app.register_blueprint(danh_gia_bp, url_prefix='/api')
    app.register_blueprint(chuc_vu_bp, url_prefix='/api')
    app.register_blueprint(cham_cong_bp)
    app.register_blueprint(nhan_vien_phuc_loi_bp, url_prefix='/api')
    app.register_blueprint(nhan_vien_bp, url_prefix='/api')
    app.register_blueprint(dao_tao_bp, url_prefix='/api')
    app.register_blueprint(loai_nghi_phep_bp, url_prefix='/api')

