from app import db
from datetime import datetime

class NghiPhep(db.Model):
    __tablename__ = 'nghi_phep'
    
    id = db.Column(db.Integer, primary_key=True)
    nhan_vien_id = db.Column(db.Integer, db.ForeignKey('nhan_vien.id'), nullable=False)
    loai_nghi_phep_id = db.Column(db.Integer, db.ForeignKey('loai_nghi_phep.id'), nullable=False)
    tu_ngay = db.Column(db.DateTime, nullable=False)
    den_ngay = db.Column(db.DateTime, nullable=False)
    ly_do = db.Column(db.String(200))
    trang_thai = db.Column(db.String(20), default='Chờ duyệt')
    so_ngay_nghi = db.Column(db.Integer, nullable=False)  # Thêm trường này để lưu số ngày nghỉ
    
    nhan_vien = db.relationship('NhanVien', back_populates='nghi_phep', lazy=True)
    loai_nghi_phep = db.relationship('LoaiNghiPhep', back_populates='nghi_phep', lazy=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.so_ngay_nghi = self.calculate_so_ngay_nghi()

    def calculate_so_ngay_nghi(self):
        """Hàm tính số ngày nghỉ dựa trên tu_ngay và den_ngay"""
        delta = self.den_ngay - self.tu_ngay
        return delta.days + 1  # Cộng thêm 1 để bao gồm ngày đầu tiên

    def to_dict(self):
        return {
            'id': self.id,
            'nhan_vien_id': self.nhan_vien_id,
            'loai_nghi_phep_id': self.loai_nghi_phep_id,
            'loai_nghi_phep': self.loai_nghi_phep.ten if self.loai_nghi_phep else None,
            'tu_ngay': self.tu_ngay.isoformat(),
            'den_ngay': self.den_ngay.isoformat(),
            'ly_do': self.ly_do,
            'trang_thai': self.trang_thai,
            'so_ngay_nghi': self.so_ngay_nghi  # Thêm số ngày nghỉ vào dict
        }
    
    def update_nghi_phep(self, tu_ngay=None, den_ngay=None, ly_do=None, trang_thai=None):
        if tu_ngay:
            self.tu_ngay = tu_ngay
        if den_ngay:
            self.den_ngay = den_ngay
        if ly_do:
            self.ly_do = ly_do
        if trang_thai:
            self.trang_thai = trang_thai

        # Cập nhật lại số ngày nghỉ khi thay đổi ngày bắt đầu và kết thúc
        self.so_ngay_nghi = self.calculate_so_ngay_nghi()

        db.session.commit()
        return self

    @staticmethod
    def create_nghi_phep(nhan_vien_id, loai_nghi_phep_id, tu_ngay, den_ngay, ly_do, trang_thai):
        # Tính số ngày nghỉ khi tạo mới đơn nghỉ phép
        so_ngay_nghi = (den_ngay - tu_ngay).days + 1
        
        new_nghi_phep = NghiPhep(
            nhan_vien_id=nhan_vien_id,
            loai_nghi_phep_id=loai_nghi_phep_id,
            tu_ngay=tu_ngay,
            den_ngay=den_ngay,
            ly_do=ly_do,
            trang_thai=trang_thai,
            so_ngay_nghi=so_ngay_nghi
        )
        db.session.add(new_nghi_phep)
        db.session.commit()
        return new_nghi_phep

    def duyet(self):
        """Duyệt đơn nghỉ phép và cập nhật số ngày phép còn lại"""
        if self.trang_thai != "Đã duyệt":
            self.trang_thai = "Đã duyệt"
            # Cập nhật số ngày phép còn lại cho nhân viên
            nhan_vien = self.nhan_vien
            nhan_vien.so_ngay_phep_con_lai -= self.so_ngay_nghi
            db.session.commit()
            return True
        return False
