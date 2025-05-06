from app import create_app
from datetime import date, datetime
from app.db import db
from app.models import (
    Role, User,
    PhongBan, ChucVu, NhanVien,
    ChamCong, Luong, DaoTao, DanhGia, NghiPhep,
    PhucLoi, NhanVienPhucLoi, DaoTaoNhanVien, LoaiNghiPhep  # Đã thêm LoaiNghiPhep
)

app = create_app()
with app.app_context():
    # Roles
    admin_role = Role(ma_vai_tro="admin", ten_role="Admin", mo_ta="Quản trị hệ thống")
    user_role = Role(ma_vai_tro="user", ten_role="User", mo_ta="Người dùng thông thường")
    db.session.add_all([admin_role, user_role])
    db.session.commit()

    # Users
    users = [
        User(username="admin", password="hashed_pw1", email="admin@example.com", role_id=admin_role.id),
        User(username="user1", password="hashed_pw2", email="user1@example.com", role_id=user_role.id),
        User(username="user2", password="hashed_pw3", email="user2@example.com", role_id=user_role.id)
    ]
    db.session.add_all(users)
    db.session.commit()

    # Phòng ban & chức vụ
    pb_ky_thuat = PhongBan(ma_phong_ban=101, ten_phong_ban="Phòng Kỹ Thuật", mo_ta="Phòng kỹ thuật chính")
    pb_nhan_su = PhongBan(ma_phong_ban=102, ten_phong_ban="Phòng Nhân Sự", mo_ta="Quản lý nhân sự")
    cv_ky_su = ChucVu(ma_chuc_vu=1, ten_chuc_vu="Kỹ Sư", mo_ta="Làm kỹ thuật")
    cv_quan_ly = ChucVu(ma_chuc_vu=2, ten_chuc_vu="Quản lý", mo_ta="Quản lý team")
    db.session.add_all([pb_ky_thuat, pb_nhan_su, cv_ky_su, cv_quan_ly])
    db.session.commit()

    # Nhân viên
    nhan_viens = [
        NhanVien(ho_ten="Nguyễn Chí Thanh", ngay_sinh=date(2003, 7, 25), luong_co_ban=50000000, gioi_tinh="Nam",
                 so_dien_thoai="0328362054", email="thanhnc250723@gmail.com", dia_chi="60/18 HKA",
                 phong_ban_id=pb_ky_thuat.id, chuc_vu_id=cv_ky_su.id, avatar="ChiThanh.jpg", trang_thai="Đang làm việc", so_ngay_phep_con_lai=12),
        NhanVien(ho_ten="Trần Thị B", ngay_sinh=date(1990, 8, 12), luong_co_ban=50000000, gioi_tinh="Nữ",
                 so_dien_thoai="0987654321", email="tranb@example.com", dia_chi="456 DEF",
                 phong_ban_id=pb_nhan_su.id, chuc_vu_id=cv_quan_ly.id, avatar="avatar2.jpg", trang_thai="Đang làm việc", so_ngay_phep_con_lai=12),
        NhanVien(ho_ten="Nguyễn Văn A", ngay_sinh=date(1995, 5, 20), luong_co_ban=50000000, gioi_tinh="Nam",
                 so_dien_thoai="0123456789", email="vana@example.com", dia_chi="123 ABC",
                 phong_ban_id=pb_ky_thuat.id, chuc_vu_id=cv_ky_su.id, avatar="avatar1.jpg", trang_thai="Đang làm việc", so_ngay_phep_con_lai=12)
    ]
    db.session.add_all(nhan_viens)
    db.session.commit()

    # Loại nghỉ phép
    lp_phep_cong = LoaiNghiPhep(ten="Phép công", mo_ta="Nghỉ phép hưởng lương", co_luong=True)
    lp_phep_khong_luong = LoaiNghiPhep(ten="Phép không lương", mo_ta="Nghỉ phép không hưởng lương", co_luong=False)
    db.session.add_all([lp_phep_cong, lp_phep_khong_luong])
    db.session.commit()

    # Đào tạo và bảng trung gian DaoTaoNhanVien
    dao_tao_1 = DaoTao(khoa_dao_tao="Khóa Python nâng cao", ngay_bat_dau=date(2025, 3, 1), ngay_ket_thuc=date(2025, 3, 10))
    dao_tao_2 = DaoTao(khoa_dao_tao="Quản lý nhân sự", ngay_bat_dau=date(2025, 2, 15), ngay_ket_thuc=date(2025, 3, 1))
    db.session.add_all([dao_tao_1, dao_tao_2])
    db.session.commit()

    # Thêm dữ liệu vào bảng DaoTaoNhanVien (bảng trung gian)
    dao_tao_nhan_vien_1 = DaoTaoNhanVien(dao_tao_id=dao_tao_1.id, nhan_vien_id=nhan_viens[0].id, ket_qua="Đạt")
    dao_tao_nhan_vien_2 = DaoTaoNhanVien(dao_tao_id=dao_tao_2.id, nhan_vien_id=nhan_viens[1].id, ket_qua="Đạt")
    db.session.add_all([dao_tao_nhan_vien_1, dao_tao_nhan_vien_2])
    db.session.commit()

    # Chấm công
    cham_congs = [
        ChamCong(nhan_vien_id=nv.id, thoi_gian_vao=datetime(2025, 4, 18, 8, 0),
                 thoi_gian_ra=datetime(2025, 4, 18, 17, 0), ngay=date(2025, 4, 18),
                 hinh_anh_vao="chamcong1_vao.jpg", hinh_anh_ra="chamcong1_ra.jpg")
        for nv in nhan_viens
    ]
    db.session.add_all(cham_congs)

    # Lương
    luongs = []
    for nv in nhan_viens:
            thang = 4
            nam = 2025
            so_ngay_cong = Luong.tinh_so_ngay_cong(nv.id, thang, nam)

            luong = Luong(
                nhan_vien_id=nv.id,
                thang=date(nam, thang, 1),       # ngày đầu tháng
                nam=date(nam, 1, 1),             # bạn đang dùng trường 'nam' là Date — mặc dù chỉ cần int là đủ
                so_ngay_cong=so_ngay_cong,
                phu_cap=2_000_000,
                khau_tru=1_000_000
    )
    luongs.append(luong)

    db.session.add_all(luongs)
    db.session.commit()

    # Đánh giá
    danh_gias = [
    DanhGia(
        nhan_vien_id=nhan_viens[0].id,
        nguoi_danh_gia_id=nhan_viens[1].id,
        thoi_gian=date(2025, 4, 1),
        diem_ky_nang=8.5,
        diem_thai_do=8.0,
        diem_hieu_suat=9.0,
        nhan_xet="Làm việc tốt, có tinh thần học hỏi"
    ),
    DanhGia(
        nhan_vien_id=nhan_viens[1].id,
        nguoi_danh_gia_id=nhan_viens[2].id,
        thoi_gian=date(2025, 4, 15),
        diem_ky_nang=7.0,
        diem_thai_do=6.5,
        diem_hieu_suat=7.5,
        nhan_xet="Cần cải thiện trong kỹ năng giao tiếp"
    ),
    DanhGia(
        nhan_vien_id=nhan_viens[2].id,
        nguoi_danh_gia_id=nhan_viens[0].id,
        thoi_gian=date(2025, 5, 1),
        diem_ky_nang=9.0,
        diem_thai_do=9.0,
        diem_hieu_suat=8.5,
        nhan_xet="Hiệu suất làm việc xuất sắc, hỗ trợ tốt đồng đội"
    )
    ]
    db.session.add_all(danh_gias)
    db.session.commit()
    # Nghỉ phép
    nghi_pheps = [
        NghiPhep(nhan_vien_id=nhan_viens[1].id, loai_nghi_phep_id=lp_phep_cong.id,
                 tu_ngay=datetime(2025, 4, 10), den_ngay=datetime(2025, 4, 12), ly_do="Việc gia đình", trang_thai="Đã duyệt"),
        NghiPhep(nhan_vien_id=nhan_viens[2].id, loai_nghi_phep_id=lp_phep_khong_luong.id,
                 tu_ngay=datetime(2025, 4, 5), den_ngay=datetime(2025, 4, 7), ly_do="Nghỉ bệnh", trang_thai="Chờ duyệt")
    ]
    db.session.add_all(nghi_pheps)

    # Phúc lợi
    phuc_lois = [
        PhucLoi(ten_phuc_loi="Bảo hiểm sức khỏe", mo_ta="BH sức khỏe cao cấp", gia_tri=3_000_000, loai="Bảo hiểm"),
        PhucLoi(ten_phuc_loi="Thưởng tháng 13", mo_ta="Thưởng Tết", gia_tri=5_000_000, loai="Thưởng")
    ]
    db.session.add_all(phuc_lois)
    db.session.commit()

    # Gán phúc lợi
    nv_phuc_lois = [
        NhanVienPhucLoi(nhan_vien_id=nhan_viens[0].id, phuc_loi_id=phuc_lois[0].id,
                        ngay_ap_dung=date(2025, 4, 1), ghi_chu="Áp dụng từ T4"),
        NhanVienPhucLoi(nhan_vien_id=nhan_viens[1].id, phuc_loi_id=phuc_lois[1].id,
                        ngay_ap_dung=date(2025, 4, 1), ghi_chu="Thưởng năm")
    ]
    db.session.add_all(nv_phuc_lois)
    db.session.commit()

    print("✅ Đã thêm dữ liệu mẫu hoàn chỉnh!")
