# 04 — DATABASE REVIEW (đánh giá kỹ sư dữ liệu)

| | |
|---|---|
| Document ID | DOC-00-04 |
| Version | 0.1 |
| Status | Draft |
| Phạm vi | 24 model SQLAlchemy trên nhánh hiện tại (`Thanh_pha`), đối chiếu trực tiếp với source code, không suy đoán |

---

## 1. CẤU TRÚC DATA HIỆN TẠI

### 1.1 Sơ đồ quan hệ (ASCII ERD)

```
NhanVien (bảng trung tâm — vừa là hồ sơ nhân sự, vừa là tài khoản đăng nhập)
 ├─ email, password, face_encoding (auth + biometric)
 ├─ N:1 → PhongBan
 ├─ N:1 → ChucVu
 ├─ 1:N → ChamCong (chấm công)
 │         └─ 1:N → GiayPhep (giấy phép, FK cả nhan_vien_id lẫn cham_cong_id)
 ├─ 1:N → NghiPhep ──N:1→ LoaiNghiPhep
 ├─ 1:N → Luong            (bảng lương — BẢN CŨ, tính bằng @property runtime)
 ├─ 1:N → BangLuong ─1:N→ ChiTietLuong   (bảng lương — BẢN MỚI, lưu snapshot)
 ├─ 1:N → BaoHiemDoanhNghiep (bảo hiểm phía DN đóng, tách riêng khỏi Luong/BangLuong)
 ├─ 1:N → HopDongLaoDong ──N:1→ QuyCheCongTy (hợp đồng, có copy riêng hệ số/phụ cấp)
 ├─ 1:N → GiayPhep (2 quan hệ: người xin + người duyệt)
 ├─ N:N → PhucLoi      qua NhanVienPhucLoi
 ├─ N:N → KhauTru       qua KhauTruNhanVien
 ├─ N:N → Thuong (tên bảng thật: nhanvien_thuong) qua ThuongNhanVien
 ├─ 1:N → NguoiPhuThuoc (người phụ thuộc, giảm trừ thuế)
 ├─ 1:N → BangCapChungChi (bằng cấp/chứng chỉ, cascade delete)
 ├─ 1:N → DanhGia (2 quan hệ: người được đánh giá + người đánh giá — có CheckConstraint)
 └─ (không liên kết) ThietBiChamCong — độc lập, không FK tới NhanVien (đúng ý đồ: xác thực thiết bị, không phải người)

PhongBan (1) ── (N) NhanVien
ChucVu   (1) ── (N) NhanVien
```

### 1.2 Bảng liệt kê đầy đủ (24 bảng)

| Nhóm | Bảng | Vai trò |
|---|---|---|
| Định danh & tổ chức | `nhan_vien`, `phong_ban`, `chuc_vu` | Nhân sự, phòng ban, chức vụ |
| Chấm công | `cham_cong`, `thiet_bi_cham_cong` | Chấm công vào/ra, thiết bị được phép chấm công |
| Nghỉ phép (2 hệ song song) | `nghi_phep`, `loai_nghi_phep`, `giay_phep` | Xem mục 2.2 — đây là vấn đề lớn nhất |
| Lương (2 hệ song song) | `luong`, `bang_luong`, `chi_tiet_luong`, `bh_dn` | Xem mục 2.1 |
| Hợp đồng & chính sách | `hopdong_laodong`, `quyche_congty` | Hợp đồng lao động, quy chế công ty |
| Thưởng/Khấu trừ/Phúc lợi | `thuong`+`nhanvien_thuong`, `khau_tru`+`khautru_nhanvien`, `phuc_loi`+`nhan_vien_phuc_loi` | 3 cặp catalog + bảng gán N:N, cùng 1 pattern |
| Hồ sơ mở rộng | `nguoi_phu_thuoc`, `bang_cap_chung_chi` | Người phụ thuộc (giảm trừ thuế), bằng cấp/chứng chỉ |
| Đánh giá | `danh_gia` | Đánh giá hiệu suất 5 tiêu chí có trọng số |
| Ngày nghỉ lễ | `ngay_nghi_le` | Danh mục ngày lễ |

---

## 2. ĐÁNH GIÁ DATA HIỆN TẠI

### Điểm làm tốt

- **`danh_gia`**: model tốt nhất trong toàn hệ thống — có `CheckConstraint` ràng buộc điểm 0-10, `CheckConstraint` tổng trọng số phải bằng 1, `UniqueConstraint` chống trùng kỳ đánh giá, dùng `Enum` cho `ky_loai`/`phuong_thuc`, có `hybrid_property` tính điểm tổng ngay ở tầng model. Đây là chuẩn nên áp dụng cho các bảng khác.
- **Pattern N:N nhất quán**: `phuc_loi`↔`nhan_vien_phuc_loi`, `khau_tru`↔`khautru_nhanvien`, `thuong`↔`nhanvien_thuong` đều theo đúng 1 khuôn "catalog + bảng gán", dễ hiểu, dễ mở rộng.
- `bh_dn` có đánh index tường minh (`nhan_vien_id`, `thang+nam`) — là bảng duy nhất làm đúng việc này.
- `NhanVien` gộp tài khoản đăng nhập vào hồ sơ nhân viên (thay vì bảng `User` tách rời như trước) — hướng đi đúng, đã ghi nhận ở tài liệu AS-IS trước.

### Vấn đề nghiêm trọng (ưu tiên cao)

**2.1 — Có 2 hệ thống bảng lương song song, không rõ cái nào là nguồn sự thật**

| | `Luong` (cũ) | `BangLuong` + `ChiTietLuong` (mới) |
|---|---|---|
| Cách tính | `@property` tính lại mỗi lần đọc (`tong_luong`, `bao_hiem`, `thue_thu_nhap_ca_nhan`) | Lưu sẵn (snapshot) các trường `tong_luong`, `bhxh`, `bhtn`, `bhyt`, `thue_tncn`, `thuc_nhan` |
| Bảo hiểm | Tính cứng `10.5%` trong code | Lưu số thực tế trong `bhxh`/`bhtn`/`bhyt` — lại còn có thêm bảng `bh_dn` riêng cho phần DN đóng |
| Rủi ro | Nếu công thức thuế/bảo hiểm đổi, số cũ trong `Luong` tự động đổi theo (vì tính runtime) — **không giữ được lịch sử lương đã trả thực tế** | Đúng nghiệp vụ hơn (payroll đã chốt không được đổi ngược), nhưng đang tồn tại song song với `Luong` |

→ Nguy cơ: 2 module FE khác nhau (`QuanLyLuong.jsx` cũ và mới) có thể đọc 2 nguồn khác nhau, hiển thị số liệu lương không khớp nhau cho cùng 1 nhân viên/tháng.

**2.2 — Có 2 hệ thống "nghỉ/vắng" chồng chéo nhau: `nghi_phep` và `giay_phep`**

| | `NghiPhep` | `GiayPhep` |
|---|---|---|
| Loại vắng | Qua bảng danh mục `LoaiNghiPhep` (có/không lương) | Chuỗi tự do: *"Nghỉ ốm", "Nghỉ việc riêng", "Nghỉ thai sản", "Tăng ca", "Quên chấm công"* (comment trong code) |
| Trạng thái duyệt | `"Chờ duyệt"` / `"Đã duyệt"` / `"Từ chối"` | `"Đang chờ"` / `"Đã duyệt"` / `"Từ chối"` |
| Trường thai sản | Có sẵn field riêng (`ngay_du_kien_sinh`, `so_con`, `phuong_phap_sinh`) ngay trong `NghiPhep` | `loai_giay_phep` cũng liệt kê "Nghỉ thai sản" là 1 giá trị hợp lệ |

→ **"Nghỉ thai sản" của cùng 1 nhân viên có thể bị ghi vào 1 trong 2 bảng tùy người nhập**, khiến báo cáo tổng số ngày nghỉ/tính lương (dựa trên đếm `ChamCong`/`NghiPhep`) bị sai lệch nếu dữ liệu nằm ở `GiayPhep` mà công thức tính lương không đọc bảng đó. Đây là rủi ro dữ liệu nghiêm trọng nhất trong toàn bộ schema.

**2.3 — Trùng lặp số liệu bảo hiểm ở 3 nơi khác nhau**

`Luong.bao_hiem` (property tính 10.5%) vs `BangLuong.bhxh/bhtn/bhyt` (lưu cứng) vs `bh_dn` (bảo hiểm phía doanh nghiệp đóng, tách bảng riêng). Không có bảng nào tham chiếu chéo để đảm bảo nhất quán — 3 nơi có thể cho 3 con số khác nhau cho cùng 1 nhân viên/tháng.

**2.4 — Trùng lặp cấu hình phụ cấp/hệ số ở 2 nơi: `QuyCheCongTy` và `HopDongLaoDong`**

Cả 2 bảng đều có đủ bộ field giống hệt nhau: `di_tre_phat`, `ve_som_phat`, `tang_ca_heso`, `luong_ngay_le_heso`, `luong_cuoi_tuan_heso`, `phu_cap_an_trua`, `phu_cap_xang_xe`, `phu_cap_doc_hai`, `phu_cap_trach_nhiem`, `phu_cap_chuc_vu`, `phu_cap_tham_nien`. `HopDongLaoDong` có FK `quyche_id` trỏ tới `QuyCheCongTy` nhưng **không có logic nào ràng buộc/đồng bộ 2 bên** — nếu HĐLĐ lưu giá trị khác quy chế, không rõ giá trị nào được dùng để tính lương thật.

**2.5 — Bug thật trong code (không phải giả thuyết)**

- `bh_dn.py::to_dict_with_nhan_vien()` gọi `self.nhan_vien.ma_nhan_vien` — field này **không tồn tại** trên `NhanVien` (sẽ ném `AttributeError` nếu hàm này được gọi).
- Cùng hàm đó gọi `self.nhan_vien.chuc_vu` — nhưng relationship thật tên là `chuc_vu_nv`, không phải `chuc_vu` → cũng sẽ lỗi.
- `NgayNghiLe.to_dict()`: `'den_ngay': self.den_ngay.isoformat() if self.tu_ngay else None` — điều kiện kiểm tra nhầm `self.tu_ngay` thay vì `self.den_ngay` (lỗi copy-paste, ít ảnh hưởng nhưng là bug thật).

**2.6 — Kiểu dữ liệu tiền tệ không nhất quán, dùng `Float` cho tiền là rủi ro tính toán**

`Float` dùng ở: `Luong`, `BangLuong`, `HopDongLaoDong`, `QuyCheCongTy`, `BaoHiemDoanhNghiep`. `Numeric(18,2)` dùng ở: `KhauTru`. `Numeric(15,2)` dùng ở: `KhauTruNhanVien.so_tien_thuc_te`, `ThuongNhanVien.so_tien_thuc_te`. `Numeric(18,1)` (chỉ 1 chữ số thập phân — bất thường cho tiền VNĐ) dùng ở `Thuong.so_tien`. Số thực dấu phẩy động (`Float`/`double`) có sai số làm tròn tích lũy qua nhiều phép cộng/trừ — với dữ liệu lương/thuế, sai lệch dù nhỏ cũng là vấn đề nghiêm trọng về mặt kế toán.

### Vấn đề mức trung bình

**2.7 — Thiếu ràng buộc `UNIQUE` chống trùng dữ liệu theo kỳ**

`Luong` và `BangLuong` đều không có `UniqueConstraint(nhan_vien_id, thang, nam)` — chỉ có `BaoHiemDoanhNghiep` và `DanhGia` làm đúng việc này. Nếu API tạo lương bị gọi 2 lần (double-submit, retry mạng), có thể sinh 2 dòng lương cho cùng 1 người/1 tháng mà DB không chặn được — phải tự query kiểm tra trong code (dễ có race condition).

**2.8 — Không có audit field (`created_by`/`updated_by`) ở bất kỳ bảng nào**

Một số bảng có `created_at`/`updated_at` (HopDongLaoDong, QuyCheCongTy, KhauTru, DanhGia, GiayPhep, NguoiPhuThuoc), phần lớn còn lại thì không (NhanVien, ChamCong, Luong, NghiPhep, PhucLoi, BangLuong, BaoHiemDoanhNghiep...). Không bảng nào ghi nhận **ai** đã tạo/sửa — với dữ liệu lương/nhân sự, đây là yêu cầu audit tối thiểu (ai duyệt nghỉ phép, ai chỉnh lương) mà hiện tại không truy vết được.

**2.9 — Không soft-delete, nhiều `cascade='all, delete-orphan'`**

Xóa 1 `NhanVien` sẽ **xóa cứng vĩnh viễn** toàn bộ: phúc lợi, bảo hiểm DN, bằng cấp/chứng chỉ đã gán (`cascade='all, delete-orphan'` khai báo tường minh ở 3 quan hệ này). Với nhân viên đã nghỉ việc, thông thường cần **giữ lại lịch sử** (đối chiếu thuế, kiểm toán, tranh chấp lao động) chứ không nên xóa cứng.

**2.10 — Enum vs chuỗi tự do không nhất quán**

Có nơi dùng `db.Enum` đúng cách (`ChiTietLuong.nhom`, `KhauTru.loai_khau_tru`, `DanhGia.ky_loai`/`phuong_thuc`), nhưng nhiều bảng khác dùng chuỗi tự do cho các giá trị vốn hữu hạn: `NhanVien.trang_thai`, `NghiPhep.trang_thai`, `GiayPhep.trang_thai`, `GiayPhep.loai_giay_phep`, `ThuongNhanVien.trang_thai`, `BangCapChungChi.trang_thai`/`loai`. Hệ quả thấy rõ nhất chính là mục 2.2: `"Chờ duyệt"` (NghiPhep) vs `"Đang chờ"` (GiayPhep) — 2 chuỗi khác nhau cho cùng 1 trạng thái nghiệp vụ.

**2.11 — Thiếu index trên khóa ngoại**

Ngoại trừ `bh_dn` và `bang_cap_chung_chi` (có `index=True`/`db.Index` tường minh), các FK còn lại (`cham_cong.nhan_vien_id`, `luong.nhan_vien_id`, `nghi_phep.nhan_vien_id`, `giay_phep.nhan_vien_id`, `danh_gia.nhan_vien_id`...) không có index tường minh. SQLite/SQLAlchemy **không tự động đánh index cho FK**, nên các truy vấn lọc/join theo nhân viên sẽ full table scan khi dữ liệu lớn dần.

**2.12 — Không bật ràng buộc khóa ngoại thật sự ở SQLite**

Chỉ `KhauTruNhanVien` khai báo `ondelete='CASCADE'` tường minh trên FK. Toàn bộ FK còn lại không khai báo `ondelete`. Quan trọng hơn: SQLite **mặc định KHÔNG bật enforcement khóa ngoại** trừ khi ứng dụng tự bật `PRAGMA foreign_keys=ON` — không thấy cấu hình này ở `app/__init__.py`. Nghĩa là về lý thuyết, DB hiện tại có thể chấp nhận ghi `nhan_vien_id` không tồn tại vào các bảng con mà không báo lỗi gì.

**2.13 — Không có công cụ migration (Alembic)**

Schema được sinh bằng `db.create_all()` — chỉ tạo bảng nếu chưa tồn tại, không tự cập nhật nếu đã tồn tại. Thêm/sửa cột sau này (ví dụ thêm audit field ở mục 2.8) sẽ cần thao tác tay hoặc xóa DB làm lại — rất rủi ro khi đã có dữ liệu thật.

### Vấn đề nhỏ

- `face_encoding` lưu bằng `db.PickleType` — pickle là format không an toàn để giải mã nếu dữ liệu từng bị chỉnh sửa ngoài ý muốn (dù ở đây nguồn ghi là nội bộ nên rủi ro thấp), và không portable/không query được. Nên đổi sang lưu mảng số dạng JSON hoặc bytes thô.
- `ChiTietLuong.loai` là chuỗi tự do dù `nhom` đã là enum — nửa vời, dễ lệch chính tả (`"DI_TRE"` vs `"DiTre"`).
- `QuyCheCongTy` không có cơ chế đảm bảo chỉ 1 bản ghi "đang active" và không lưu lịch sử thay đổi chính sách theo thời gian — nếu chính sách đổi, các hợp đồng cũ tham chiếu `quyche_id` sẽ đọc thấy giá trị chính sách mới bị sửa đè, không phải giá trị tại thời điểm ký hợp đồng.

---

## 3. ĐỀ XUẤT CẢI THIỆN (theo mức ưu tiên)

| # | Đề xuất | Giải quyết vấn đề | Mức độ |
|---|---|---|---|
| D1 | **Hợp nhất `NghiPhep` và `GiayPhep` thành 1 domain** — quyết định rõ: 1 bảng duy nhất cho mọi loại "vắng mặt có duyệt" (ốm, thai sản, việc riêng, tăng ca...) với 1 catalog loại thống nhất và 1 bộ trạng thái enum duy nhất | 2.2, 2.10 (phần trạng thái) | 🔴 Cao — sai lệch báo cáo/lương thật |
| D2 | **Chọn 1 nguồn sự thật cho bảng lương**: giữ `BangLuong`+`ChiTietLuong` (snapshot, đúng nghiệp vụ kế toán hơn), coi `Luong` là legacy cần migrate dữ liệu sang rồi loại bỏ | 2.1 | 🔴 Cao |
| D3 | **Gộp số liệu bảo hiểm về 1 nơi** — `bh_dn` (phía DN) giữ nguyên vì khác đối tượng chi trả, nhưng phần bảo hiểm nhân viên đóng chỉ nên lưu ở `BangLuong`, bỏ `@property bao_hiem` tính cứng 10.5% trong `Luong` sau khi làm D2 | 2.3 | 🔴 Cao |
| D4 | **Đổi toàn bộ cột tiền sang `Numeric(18,2)` nhất quán** (bỏ `Float`, bỏ `Numeric(18,1)`) | 2.6 | 🟠 Trung bình-cao |
| D5 | Thêm `UniqueConstraint(nhan_vien_id, thang, nam)` cho `Luong`/`BangLuong` (theo đúng model `BaoHiemDoanhNghiep` đã làm) | 2.7 | 🟠 Trung bình |
| D6 | Chuẩn hóa tất cả trạng thái dạng chuỗi tự do (`trang_thai`, `loai_*`) thành `db.Enum` theo đúng cách `DanhGia`/`ChiTietLuong` đã làm | 2.10 | 🟠 Trung bình |
| D7 | Thêm `created_by`/`updated_by` (FK tới `nhan_vien.id`) cho mọi bảng nghiệp vụ quan trọng (lương, nghỉ phép, khấu trừ, thưởng, đánh giá) | 2.8 | 🟠 Trung bình |
| D8 | Thêm `index=True` cho mọi cột FK còn thiếu; bật `PRAGMA foreign_keys=ON` khi kết nối SQLite | 2.11, 2.12 | 🟠 Trung bình |
| D9 | Đưa Alembic (Flask-Migrate) vào dự án ngay, trước khi làm D4-D8 — vì các thay đổi đó đều là ALTER TABLE cần migration an toàn | 2.13 | 🔴 Cao (làm trước D2-D8) |
| D10 | Sửa 2 bug thật đã tìm thấy (`bh_dn.to_dict_with_nhan_vien`, `NgayNghiLe.to_dict`) | 2.5 | 🟢 Thấp, dễ, làm ngay |
| D11 | Cân nhắc soft-delete (`deleted_at`) cho `NhanVien` và các bảng lịch sử quan trọng, bỏ `cascade delete-orphan` cứng | 2.9 | 🟡 Trung bình, cần quyết định nghiệp vụ trước |
| D12 | Thống nhất precedence rõ ràng giữa `QuyCheCongTy` và `HopDongLaoDong`: đề xuất `HopDongLaoDong` snapshot giá trị từ `QuyCheCongTy` tại thời điểm ký (không đổi ngược khi quy chế đổi), quy chế chỉ áp dụng làm **giá trị mặc định lúc tạo hợp đồng mới** | 2.4 | 🟡 Trung bình — cần chốt nghiệp vụ |
| D13 | Đổi `face_encoding` từ `PickleType` sang lưu bytes thô (`numpy.tobytes()`) hoặc JSON array | Mục nhỏ | 🟢 Thấp |
| D14 | Khi hạ tầng đủ lớn, di chuyển từ SQLite sang PostgreSQL (đã ghi trong AS-IS trước, nhắc lại ở đây vì ảnh hưởng trực tiếp tới D9) | — | 🟡 Về sau, không gấp |

**Thứ tự làm việc khuyến nghị:** D9 (Alembic) → D10 (sửa bug, nhanh) → D1 + D2 + D3 (giải quyết trùng lặp domain, ảnh hưởng lớn nhất tới tính đúng đắn số liệu) → D4 D5 D6 D7 D8 (chuẩn hóa) → D11 D12 (quyết định nghiệp vụ) → D13 D14 (khi cần).

## Change Log

| Version | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 2026-08-27 | Khởi tạo — đọc toàn bộ 24 model trên nhánh `Thanh_pha` |
