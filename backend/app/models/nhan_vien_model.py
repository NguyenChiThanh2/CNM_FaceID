from app import db
import face_recognition
from sqlalchemy import Float

class NhanVien(db.Model):
    __tablename__ = 'nhan_vien'

    id = db.Column(db.Integer, primary_key=True)
    ho_ten = db.Column(db.String(100), nullable=False)
    ngay_sinh = db.Column(db.Date)
    gioi_tinh = db.Column(db.String(10))
    so_dien_thoai = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(100), unique=True)
    dia_chi = db.Column(db.String(255))
    phong_ban_id = db.Column(db.Integer, db.ForeignKey('phong_ban.id'))
    chuc_vu_id = db.Column(db.Integer, db.ForeignKey('chuc_vu.id'))
    luong_co_ban = db.Column(Float, nullable=True)
    avatar = db.Column(db.String(255), nullable=True)
    trang_thai = db.Column(db.String(50))
    so_ngay_phep_con_lai = db.Column(db.Integer, default=12)
    face_encoding = db.Column(db.PickleType, nullable=True)

    # Relationships
    phong_ban = db.relationship('PhongBan', back_populates='phong_ban_nv', lazy=True)
    chuc_vu_nv = db.relationship('ChucVu', back_populates='chuc_vu_nv', lazy=True)
    cham_cong_nv = db.relationship('ChamCong', back_populates='cham_cong_nv', lazy=True)
    nghi_phep = db.relationship('NghiPhep', back_populates='nhan_vien', lazy=True)
    luong_nv = db.relationship('Luong', back_populates='luong_nv', lazy=True)
    dao_taos = db.relationship('DaoTaoNhanVien', back_populates='nhan_vien', lazy=True)
    phuc_lois = db.relationship('NhanVienPhucLoi', back_populates='nhan_vien', lazy=True)

    # Các đánh giá nhận và tạo (2 quan hệ khác nhau đến cùng một bảng)
    danh_gias_nhan = db.relationship(
        'DanhGia',
        foreign_keys='DanhGia.nhan_vien_id',
        back_populates='nhan_vien',
        lazy=True
    )

    danh_gias_danh = db.relationship(
        'DanhGia',
        foreign_keys='DanhGia.nguoi_danh_gia_id',
        back_populates='nguoi_danh_gia',
        lazy=True
    )

    def __repr__(self):
        return f"<NhanVien {self.ho_ten}>"

    def to_dict(self):
        return {
            'id': self.id,
            'ho_ten': self.ho_ten,
            'ngay_sinh': self.ngay_sinh.strftime('%Y-%m-%d') if self.ngay_sinh else None,
            'gioi_tinh': self.gioi_tinh,
            'so_dien_thoai': self.so_dien_thoai,
            'email': self.email,
            'dia_chi': self.dia_chi,
            'phong_ban_id': self.phong_ban_id,
            'chuc_vu_id': self.chuc_vu_id,
            'luong_co_ban': self.luong_co_ban,
            'avatar': self.avatar,
            'trang_thai': self.trang_thai,
            'so_ngay_phep_con_lai': self.so_ngay_phep_con_lai,
            'chuc_vu': self.chuc_vu_nv.ten_chuc_vu if self.chuc_vu_nv else None,
            'face_encoding': None  # Không trả về dữ liệu nhạy cảm
        }

    def compare_face_encoding(self, face_encoding, tolerance=0.6):
        if not self.face_encoding:
            return False
        return face_recognition.compare_faces([self.face_encoding], face_encoding, tolerance=tolerance)[0]
