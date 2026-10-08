from app import create_app
from datetime import date, datetime, timedelta
from app.db import db
from app.models import (
    Role, User,
    PhongBan, ChucVu, NhanVien,
    ChamCong, Luong, DaoTao, DanhGia, NghiPhep,
    PhucLoi, NhanVienPhucLoi, DaoTaoNhanVien, LoaiNghiPhep
)
from werkzeug.security import generate_password_hash
from faker import Faker
import random

fake = Faker("vi_VN")
app = create_app()

with app.app_context():

    # Phòng ban & chức vụ
    phong_bans = [
        PhongBan(ma_phong_ban=101, ten_phong_ban="Phòng Kỹ Thuật", mo_ta="Phòng kỹ thuật chính"),
        PhongBan(ma_phong_ban=102, ten_phong_ban="Phòng Nhân Sự", mo_ta="Quản lý nhân sự"),
        PhongBan(ma_phong_ban=103, ten_phong_ban="Phòng Kế Toán", mo_ta="Tài chính và kế toán"),
        PhongBan(ma_phong_ban=104, ten_phong_ban="Phòng Kinh Doanh", mo_ta="Bán hàng"),
        PhongBan(ma_phong_ban=105, ten_phong_ban="Phòng Marketing", mo_ta="Truyền thông"),
        PhongBan(ma_phong_ban=106, ten_phong_ban="Phòng IT", mo_ta="Công nghệ thông tin"),
        PhongBan(ma_phong_ban=107, ten_phong_ban="Phòng CSKH", mo_ta="Chăm sóc khách hàng"),
        PhongBan(ma_phong_ban=108, ten_phong_ban="Phòng Hành Chính", mo_ta="Hành chính nội bộ")
    ]
    chuc_vus = [
        ChucVu(ma_chuc_vu=1, ten_chuc_vu="Nhân viên", mo_ta="Nhân viên chuyên môn"),
        ChucVu(ma_chuc_vu=2, ten_chuc_vu="Kỹ Sư", mo_ta="Kỹ thuật chuyên ngành"),
        ChucVu(ma_chuc_vu=3, ten_chuc_vu="Chuyên viên", mo_ta="Phân tích nghiệp vụ"),
        ChucVu(ma_chuc_vu=4, ten_chuc_vu="Quản lý", mo_ta="Quản lý nhóm"),
        ChucVu(ma_chuc_vu=5, ten_chuc_vu="Trưởng phòng", mo_ta="Phụ trách phòng ban"),
        ChucVu(ma_chuc_vu=6, ten_chuc_vu="Giám đốc", mo_ta="Quản lý cấp cao")
    ]
    db.session.add_all(phong_bans + chuc_vus)
    db.session.commit()

    # Loại nghỉ phép
    loai_nghi_pheps = [
        LoaiNghiPhep(ten="Phép công", mo_ta="Nghỉ có lương", co_luong=True),
        LoaiNghiPhep(ten="Phép không lương", mo_ta="Nghỉ không lương", co_luong=False)
    ]
    db.session.add_all(loai_nghi_pheps)
    db.session.commit()

    # Nhân viên
    nhan_viens = []
    for i in range(1, 30):
        nv = NhanVien(
            ho_ten=fake.name(),
            ngay_sinh=fake.date_of_birth(minimum_age=22, maximum_age=45),
            luong_co_ban=random.randint(10, 30) * 1_000_000,
            gioi_tinh=random.choice(["Nam", "Nữ"]),
            so_dien_thoai=fake.phone_number(),
            email=f"nv{i}@example.com",
            dia_chi=fake.address(),
            phong_ban_id=random.choice([pb.id for pb in phong_bans]),
            chuc_vu_id=random.choice([cv.id for cv in chuc_vus]),
            avatar="default.jpg",
            trang_thai="Đang làm việc",
            so_ngay_phep_con_lai=random.randint(5, 15)
        )
        nhan_viens.append(nv)
    db.session.add_all(nhan_viens)
    db.session.commit()

    # Khóa đào tạo
    dao_taos = [
        DaoTao(khoa_dao_tao=ten, ngay_bat_dau=nbd, ngay_ket_thuc=nkt)
        for ten, nbd, nkt in [
            ("Kỹ năng giao tiếp", date(2025, 1, 5), date(2025, 1, 10)),
            ("Tin học văn phòng", date(2025, 2, 1), date(2025, 2, 8)),
            ("Kỹ năng bán hàng", date(2025, 3, 1), date(2025, 3, 5)),
            ("Lãnh đạo cấp trung", date(2025, 3, 15), date(2025, 3, 25)),
            ("An toàn lao động", date(2025, 4, 1), date(2025, 4, 2)),
            ("Quản lý thời gian", date(2025, 4, 10), date(2025, 4, 12)),
            ("Tư duy phản biện", date(2025, 4, 15), date(2025, 4, 20)),
            ("Scrum & Agile", date(2025, 5, 1), date(2025, 5, 7)),
            ("Thuyết trình", date(2025, 5, 10), date(2025, 5, 12)),
            ("Đào tạo nội bộ", date(2025, 5, 15), date(2025, 5, 18)),
            ("Excel nâng cao", date(2025, 6, 1), date(2025, 6, 5)),
            ("Quản trị dự án", date(2025, 6, 10), date(2025, 6, 20)),
            ("Thuyết phục & Đàm phán", date(2025, 6, 25), date(2025, 6, 30)),
            ("CSKH chuyên nghiệp", date(2025, 7, 5), date(2025, 7, 10)),
            ("Hội nhập công ty", date(2025, 7, 15), date(2025, 7, 20))
        ]
    ]
    db.session.add_all(dao_taos)
    db.session.commit()

    # Phúc lợi
    phuc_lois = [
        PhucLoi(ten_phuc_loi="Trợ cấp ăn trưa", mo_ta="Tiền ăn mỗi tháng", gia_tri=1_000_000, loai="Trợ cấp"),
        PhucLoi(ten_phuc_loi="Trợ cấp đi lại", mo_ta="Hỗ trợ công tác", gia_tri=1_500_000, loai="Trợ cấp"),
        PhucLoi(ten_phuc_loi="Khám sức khỏe", mo_ta="Khám tổng quát", gia_tri=2_000_000, loai="Y tế"),
        PhucLoi(ten_phuc_loi="Bảo hiểm tai nạn", mo_ta="Rủi ro lao động", gia_tri=2_500_000, loai="Bảo hiểm"),
        PhucLoi(ten_phuc_loi="Du lịch công ty", mo_ta="Hàng năm", gia_tri=3_000_000, loai="Phúc lợi"),
        PhucLoi(ten_phuc_loi="Thưởng hiệu suất", mo_ta="Cuối năm", gia_tri=4_000_000, loai="Thưởng"),
        PhucLoi(ten_phuc_loi="Gói gym", mo_ta="Gói thể hình", gia_tri=1_200_000, loai="Sức khỏe"),
        PhucLoi(ten_phuc_loi="Hỗ trợ học tập", mo_ta="Khóa học", gia_tri=2_000_000, loai="Giáo dục"),
        PhucLoi(ten_phuc_loi="Nuôi con nhỏ", mo_ta="Có con nhỏ", gia_tri=2_500_000, loai="Gia đình"),
        PhucLoi(ten_phuc_loi="Ngày nghỉ sinh nhật", mo_ta="Nghỉ phép đặc biệt", gia_tri=0, loai="Phúc lợi")
    ]
    db.session.add_all(phuc_lois)
    db.session.commit()

    # Dữ liệu chấm công, lương, đánh giá, nghỉ phép, đào tạo, phúc lợi
    for nv in nhan_viens:
        # Chấm công
        for d in range(1, 21):
            db.session.add(ChamCong(
                nhan_vien_id=nv.id,
                ngay=date(2025, 4, d),
                thoi_gian_vao=datetime(2025, 4, d, 8, 0),
                thoi_gian_ra=datetime(2025, 4, d, 17, 0),
                hinh_anh_vao="vao.jpg",
                hinh_anh_ra="ra.jpg"
            ))

        # Lương
        db.session.add(Luong(
            nhan_vien_id=nv.id,
            thang=4,
            nam=2025,
            so_ngay_cong=20,
            phu_cap=random.randint(1, 3) * 1_000_000,
            khau_tru=random.randint(0, 2) * 1_000_000
        ))

        # Đánh giá
        nguoi_dg = random.choice(nhan_viens)
        db.session.add(DanhGia(
            nhan_vien_id=nv.id,
            nguoi_danh_gia_id=nguoi_dg.id,
            thoi_gian=date(2025, 4, random.randint(1, 28)),
            diem_ky_nang=round(random.uniform(6, 10), 1),
            diem_thai_do=round(random.uniform(6, 10), 1),
            diem_hieu_suat=round(random.uniform(6, 10), 1),
            nhan_xet="Tự động đánh giá hệ thống"
        ))

        # Nghỉ phép (ngẫu nhiên)
        if random.random() < 0.7:
            tu_ngay = datetime(2025, 4, random.randint(1, 25))
            den_ngay = tu_ngay + timedelta(days=2)
            db.session.add(NghiPhep(
                nhan_vien_id=nv.id,
                loai_nghi_phep_id=random.choice(loai_nghi_pheps).id,
                tu_ngay=tu_ngay,
                den_ngay=den_ngay,
                ly_do="Cá nhân",
                trang_thai="Đã duyệt"
            ))

        # Gán khóa đào tạo
        dao_tao = random.choice(dao_taos)
        db.session.add(DaoTaoNhanVien(
            nhan_vien_id=nv.id,
            dao_tao_id=dao_tao.id,
            ket_qua="Hoàn thành"
        ))

        # Gán phúc lợi
        phuc_loi = random.choice(phuc_lois)
        db.session.add(NhanVienPhucLoi(
            nhan_vien_id=nv.id,
            phuc_loi_id=phuc_loi.id
        ))

    db.session.commit()
    print("✅ Đã sinh dữ liệu mẫu mở rộng hoàn tất!")
