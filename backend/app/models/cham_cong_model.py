from datetime import datetime
from app import db
from flask import url_for

class ChamCong(db.Model):
    __tablename__ = 'cham_cong'

    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    thoi_gian_vao = db.Column(db.DateTime, default=datetime.utcnow)  # Thời gian chấm công vào
    thoi_gian_ra = db.Column(db.DateTime)  # Thời gian chấm công ra
    ngay = db.Column(db.Date)  # Ngày chấm công
    hinh_anh_vao = db.Column(db.String(255), nullable=True)  # Hình ảnh chấm công vào
    hinh_anh_ra = db.Column(db.String(255), nullable=True)  # Hình ảnh chấm công ra

    cham_cong_nv = db.relationship('NhanVien', back_populates='cham_cong_nv', lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Nếu có thời gian vào, tự động thiết lập ngày từ thời gian vào
        if self.thoi_gian_vao:
            self.set_ngay_tu_thoi_gian_vao()

    def __repr__(self):
        return f"<ChamCong {self.id}>"

    from flask import url_for

    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'ho_ten': self.cham_cong_nv.ho_ten if self.cham_cong_nv else None,
            'thoi_gian_vao': self.thoi_gian_vao.strftime('%Y-%m-%d %H:%M:%S') if self.thoi_gian_vao else None,
            'thoi_gian_ra': self.thoi_gian_ra.strftime('%Y-%m-%d %H:%M:%S') if self.thoi_gian_ra else None,
            'ngay': self.ngay.strftime('%Y-%m-%d') if self.ngay else None,
            'hinh_anh_vao': self.hinh_anh_vao,
            'hinh_anh_ra': self.hinh_anh_ra,
        }


    def set_ngay_tu_thoi_gian_vao(self):
        """Tự động thiết lập ngày từ thời gian vào nếu chưa có ngày."""
        if self.thoi_gian_vao and not self.ngay:
            self.ngay = self.thoi_gian_vao.date()
