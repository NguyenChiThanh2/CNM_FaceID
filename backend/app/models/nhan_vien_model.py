from app import db
import face_recognition
import numpy as np
from sqlalchemy import Float
from sqlalchemy.types import TypeDecorator, LargeBinary
from app.models.bang_cap_chung_chi_model import BangCapChungChi
from app.models.soft_delete import SoftDeleteMixin
from app.models.audit import AuditMixin


class FaceEncodingType(TypeDecorator):
    """Lưu face_encoding dạng raw bytes (float64) thay vì pickle.

    PickleType gọi pickle.loads() khi đọc dữ liệu — pickle cho phép thực thi
    mã tùy ý nếu bytes trong cột từng bị thay đổi bởi ai đó có quyền ghi DB
    (insecure deserialization, CWE-502). Một mảng 128 số thực không cần cấu
    trúc Python phức tạp, nên lưu bytes thô là đủ và an toàn hơn.
    """
    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return np.asarray(value, dtype=np.float64).tobytes()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        # trả về list (không phải ndarray) để giữ nguyên hành vi cũ ở nơi gọi
        # (vd. `if not self.face_encoding` sẽ lỗi ValueError nếu là ndarray)
        return np.frombuffer(value, dtype=np.float64).tolist()


class NhanVien(db.Model, SoftDeleteMixin, AuditMixin):
    __tablename__ = 'nhan_vien'

    id = db.Column(db.Integer, primary_key=True)
    ho_ten = db.Column(db.String(100), nullable=False)
    ngay_sinh = db.Column(db.Date)
    gioi_tinh = db.Column(db.String(10))
    so_dien_thoai = db.Column(db.String(20), unique=True)
    email = db.Column(db.String(100), unique=True)
    dia_chi = db.Column(db.String(255))
    phong_ban_id = db.Column(db.Integer, db.ForeignKey('phong_ban.id'), index=True)
    chuc_vu_id = db.Column(db.Integer, db.ForeignKey('chuc_vu.id'), index=True)
    vai_tro_id = db.Column(db.Integer, db.ForeignKey('vai_tro.id'), index=True)
    avatar = db.Column(db.String(255), nullable=True)
    trang_thai = db.Column(
        db.Enum('Đang làm việc', 'Đã nghỉ việc', 'Tạm nghỉ', 'Thử việc', name='trang_thai_nhan_vien_enum', create_constraint=True)
    )
    so_ngay_phep_con_lai = db.Column(db.Integer, default=12)
    face_encoding = db.Column(FaceEncodingType, nullable=True)
    password = db.Column(db.String(255)) 
    # Relationships
    phong_ban = db.relationship('PhongBan', back_populates='phong_ban_nv', lazy=True)
    chuc_vu_nv = db.relationship('ChucVu', back_populates='chuc_vu_nv', lazy=True)
    vai_tro = db.relationship('VaiTro', back_populates='nhan_vien_list', lazy=True)
    cham_cong_nv = db.relationship('ChamCong', foreign_keys='ChamCong.nhan_vien_id', back_populates='cham_cong_nv', lazy=True)
    nghi_phep = db.relationship(
        'NghiPhep',
        foreign_keys='NghiPhep.nhan_vien_id',
        back_populates='nhan_vien',
        lazy=True
    )
    luong_nv = db.relationship('Luong', back_populates='luong_nv', lazy=True)
    phuc_lois = db.relationship('NhanVienPhucLoi', foreign_keys='NhanVienPhucLoi.nhan_vien_id', back_populates='nhan_vien', lazy=True)
    hopdong_nv = db.relationship("HopDongLaoDong", foreign_keys='HopDongLaoDong.nhan_vien_id', back_populates="hopdong_nv", lazy=True)
    bang_luong_nhan_vien = db.relationship('BangLuong', foreign_keys='BangLuong.nhan_vien_id', back_populates='bang_luong_nhan_vien', lazy=True)
    NguoiPhuThuoc_nv = db.relationship("NguoiPhuThuoc", foreign_keys='NguoiPhuThuoc.nhan_vien_id', back_populates="NguoiPhuThuoc_nv", lazy=True)
    thuong_nhanvien = db.relationship('ThuongNhanVien', foreign_keys='ThuongNhanVien.nhanvien_id', back_populates='nhanvien', lazy=True)
    chung_chi_list = db.relationship("BangCapChungChi", foreign_keys='BangCapChungChi.nhan_vien_id', back_populates="nhan_vien", lazy=True)
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
    giayphep_nv = db.relationship("GiayPhep", foreign_keys='GiayPhep.nhan_vien_id', back_populates="giayphep_nv", lazy=True)
    giayphep_nguoi_duyet = db.relationship("GiayPhep", foreign_keys='GiayPhep.nguoi_duyet_id',back_populates="nguoi_duyet", lazy=True)
    
    # khautru_list = db.relationship(
    #     'KhauTru',
    #     secondary='khautru_nhanvien',
    #     back_populates='nhan_viens'
    # )
    khautru_list = db.relationship(
        "KhauTru",
        secondary="khautru_nhanvien",
        primaryjoin="NhanVien.id == KhauTruNhanVien.nhan_vien_id",
        secondaryjoin="KhauTru.id == KhauTruNhanVien.khau_tru_id",
        back_populates="nhan_viens",
        overlaps="khautru_nhanvien_list,nhan_vien"
    )
    khautru_nhanvien_list = db.relationship(
        "KhauTruNhanVien",
        foreign_keys='KhauTruNhanVien.nhan_vien_id',
        back_populates="nhan_vien",
        overlaps="khautru_list,nhan_viens"
    )
    bao_hiem_doanh_nghiep = db.relationship('BaoHiemDoanhNghiep',
                                           foreign_keys='BaoHiemDoanhNghiep.nhan_vien_id',
                                           back_populates='nhan_vien',
                                           lazy=True)

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
            'ten_phong_ban': self.phong_ban.ten_phong_ban  if self.phong_ban else None,
            'chuc_vu_id': self.chuc_vu_id,
            'avatar': self.avatar,
            'trang_thai': self.trang_thai,
            'so_ngay_phep_con_lai': self.so_ngay_phep_con_lai,
            'chuc_vu': self.chuc_vu_nv.ten_chuc_vu if self.chuc_vu_nv else None,
            'vai_tro_id': self.vai_tro_id,
            'ten_vai_tro': self.vai_tro.ten_vai_tro if self.vai_tro else None,
            'face_encoding': None  # Không trả về dữ liệu nhạy cảm
        }

    def compare_face_encoding(self, face_encoding, tolerance=0.4):
        if not self.face_encoding:
            return False
        return face_recognition.compare_faces([self.face_encoding], face_encoding, tolerance=tolerance)[0]
    def set_password(self, raw_pw: str):
        self.password = generate_password_hash(raw_pw)

    def check_password(self, raw_pw: str) -> bool:
        return check_password_hash(self.password, raw_pw)