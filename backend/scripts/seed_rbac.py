# scripts/seed_rbac.py
"""Seed permission catalog + vai trò Admin + tài khoản Admin đầu tiên.

Chạy 1 lần sau khi áp migration RBAC (bảng vai_tro/quyen/vai_tro_quyen):

    python scripts/seed_rbac.py

An toàn để chạy lại nhiều lần (idempotent) — không tạo trùng permission/vai trò,
chỉ cập nhật nếu đã tồn tại.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.quyen_model import Quyen
from app.models.vai_tro_model import VaiTro
from app.models.nhan_vien_model import NhanVien

# Mỗi module nghiệp vụ tương ứng 1 blueprint route thật trong app/routes/ (trừ
# face_bp/facecheckin_bp dùng cơ chế xác thực riêng bằng thiết bị, không cần quyền).
MODULES = [
    "bang_luong", "bao_hiem_dn", "cham_cong", "chi_tiet_luong", "chuc_vu",
    "chung_chi", "danh_gia", "giay_phep", "hopdong", "khau_tru",
    "loai_nghi_phep", "ngay_nghi_le", "nghi_phep", "nguoi_phu_thuoc",
    "nhan_vien", "nhan_vien_phuc_loi", "phong_ban", "phuc_loi", "thuong",
    "tinh_luong", "vai_tro",
]
HANH_DONGS = ["xem", "them", "sua", "xoa"]

BOOTSTRAP_ADMIN_EMAIL = "admin123@gmail.com"
BOOTSTRAP_ADMIN_PASSWORD = "admin123"


def seed_quyen_catalog():
    created = 0
    for module in MODULES:
        for hanh_dong in HANH_DONGS:
            ma_quyen = f"{module}.{hanh_dong}"
            if Quyen.query.filter_by(ma_quyen=ma_quyen).first():
                continue
            db.session.add(Quyen(
                ma_quyen=ma_quyen,
                module=module,
                hanh_dong=hanh_dong,
                mo_ta=f"{hanh_dong} - {module}",
            ))
            created += 1
    db.session.commit()
    print(f"Quyen: đã tạo mới {created}, tổng cộng {Quyen.query.count()} quyền")


def seed_admin_role():
    admin_role = VaiTro.query.filter_by(ten_vai_tro="Admin").first()
    if not admin_role:
        admin_role = VaiTro(ten_vai_tro="Admin", mo_ta="Toàn quyền hệ thống")
        db.session.add(admin_role)

    # Admin luôn có TOÀN BỘ quyền hiện có trong catalog — kể cả quyền được thêm
    # sau này (chạy lại script này sau khi mở rộng MODULES sẽ tự đồng bộ).
    admin_role.quyen_list = Quyen.query.all()
    db.session.commit()
    print(f"VaiTro 'Admin': id={admin_role.id}, {len(admin_role.quyen_list)} quyền")
    return admin_role


def seed_bootstrap_admin(admin_role):
    nv = NhanVien.query.filter_by(email=BOOTSTRAP_ADMIN_EMAIL).first()
    if nv:
        nv.vai_tro_id = admin_role.id
        nv.password = generate_password_hash(BOOTSTRAP_ADMIN_PASSWORD)
        print(f"NhanVien '{BOOTSTRAP_ADMIN_EMAIL}' đã tồn tại (id={nv.id}) — cập nhật vai trò Admin + reset mật khẩu")
    else:
        nv = NhanVien(
            ho_ten="Admin",
            email=BOOTSTRAP_ADMIN_EMAIL,
            password=generate_password_hash(BOOTSTRAP_ADMIN_PASSWORD),
            vai_tro_id=admin_role.id,
            trang_thai="Đang làm việc",
        )
        db.session.add(nv)
        print(f"Đã tạo NhanVien Admin mới: {BOOTSTRAP_ADMIN_EMAIL}")
    db.session.commit()


def main():
    app = create_app()
    with app.app_context():
        seed_quyen_catalog()
        admin_role = seed_admin_role()
        seed_bootstrap_admin(admin_role)
    print("\nHoàn tất seed RBAC.")


if __name__ == "__main__":
    main()
