# 06 — DATABASE REVIEW v2 (sau Bước 1-3)

| | |
|---|---|
| Document ID | DOC-00-06 |
| Version | 0.1 |
| Status | Draft |
| Phụ thuộc | `04-database-review.md` (bản gốc), `05-database-improvement-plan.md` (nhật ký các bước đã làm) |
| Phạm vi | Toàn bộ 24 bảng hiện tại, đối chiếu trực tiếp với source code |

Tài liệu này **không lặp lại toàn bộ nội dung** của `04-database-review.md` — chỉ nêu: (1) mục nào đã giải quyết, (2) mục nào vẫn còn nguyên, (3) phát hiện MỚI từ chính việc vừa sửa ở Bước 1-3, rồi gộp tất cả thành **1 danh sách ưu tiên duy nhất** để bạn dễ theo dõi tiếp.

---

## 1. Đã giải quyết từ lần review trước

| Vấn đề cũ | Trạng thái |
|---|---|
| Không có Alembic/migration tool (D9) | ✅ Đã thêm Flask-Migrate, có `migrations/` |
| 2 bug thật: `bh_dn.to_dict_with_nhan_vien()`, `NgayNghiLe.to_dict()` (D10) | ✅ Đã sửa, đã kiểm chứng bằng tái hiện lỗi |
| Quan hệ `NhanVien.nghi_phep` mơ hồ do 2 FK | ✅ Đã sửa (`foreign_keys=`) — bug phát sinh trong lúc mở rộng `NghiPhep`, không phải bug cũ |

## 2. Vẫn còn nguyên, CHƯA xử lý (từ `04-database-review.md`)

Liệt kê lại đúng mức độ ưu tiên gốc, không lặp chi tiết (xem file cũ để đọc đầy đủ lý do):

| # | Vấn đề | Mức độ |
|---|---|---|
| 1 | 2 hệ thống bảng lương song song (`Luong` tính runtime vs `BangLuong`+`ChiTietLuong` lưu snapshot) | 🔴 Cao |
| 2 | Bảo hiểm tính/lưu ở 3 nơi khác nhau (`Luong.bao_hiem`, `BangLuong.bhxh/bhtn/bhyt`, `bh_dn`) | 🔴 Cao |
| 3 | `NghiPhep`/`GiayPhep` — **tạm dừng có chủ đích** (xem mục 5.3 dưới, không phải "chưa làm" mà là "cố ý chờ xác nhận nghiệp vụ") | 🔴 Cao nhưng đang khóa lại |
| 4 | Trùng cấu hình phụ cấp/hệ số giữa `QuyCheCongTy` và `HopDongLaoDong`, không rõ bên nào là nguồn thật khi ký hợp đồng | 🟠 Trung bình-cao |
| 5 | Cột tiền dùng `Float` không nhất quán (`Luong`, `BangLuong`, `HopDongLaoDong`, `QuyCheCongTy`, `BaoHiemDoanhNghiep` dùng Float; `KhauTru`, `Thuong` dùng `Numeric` khác độ chính xác nhau) | 🟠 Trung bình-cao |
| 6 | Thiếu `UniqueConstraint(nhan_vien_id, thang, nam)` ở `Luong`/`BangLuong` — có thể tạo trùng lương 1 tháng | 🟠 Trung bình |
| 7 | Trạng thái dạng chuỗi tự do thay vì Enum ở nhiều bảng (`NhanVien.trang_thai`, `GiayPhep.trang_thai`, `ThuongNhanVien.trang_thai`, `BangCapChungChi.trang_thai/loai`) | 🟠 Trung bình |
| 8 | Không có `created_by`/`updated_by` ở hầu hết bảng nghiệp vụ | 🟠 Trung bình |
| 9 | Thiếu index trên hầu hết cột FK (trừ `bh_dn`, `bang_cap_chung_chi`) | 🟠 Trung bình |
| 10 | SQLite chưa bật `PRAGMA foreign_keys=ON` — DB không thực sự chặn FK sai | 🟠 Trung bình |
| 11 | Không soft-delete, nhiều `cascade='all, delete-orphan'` xóa cứng lịch sử nhân viên | 🟡 Cần quyết định nghiệp vụ trước |
| 12 | `face_encoding` lưu bằng `PickleType` (không an toàn khi deserialize) | 🟢 Thấp |
| 13 | SQLite vs PostgreSQL cho production | 🟡 Chưa gấp |

## 3. Lệch schema thật vẫn còn tồn tại — CHƯA XỬ LÝ (phát hiện từ Bước 1, vẫn lặp lại ở MỌI lần `flask db migrate`)

Đây là điều quan trọng cần nhắc lại rõ: mỗi lần chạy `flask db migrate` trong suốt Bước 1-3, Alembic đều báo lại đúng những dòng lệch này — tôi **luôn phải tay xóa chúng khỏi file migration** để tránh áp dụng nhầm. Chúng chưa từng được xử lý thật, chỉ đang bị "né" liên tục:

| Bảng | Lệch gì |
|---|---|
| `danh_gia` | DB thật vẫn có cột cũ (`thoi_gian`, `trang_thai`, `minh_chung`, `diem_hieu_suat`) không còn trong model — 29 dòng dữ liệu thật bị ảnh hưởng nếu sửa |
| `dao_tao`, `dao_tao_nhan_vien` | Bảng mồ côi, model đã xóa khỏi code từ lâu nhưng bảng vẫn còn (16/30 dòng dữ liệu cũ) |
| `giay_phep` | Model có `nullable=False` cho `cham_cong_id`/`so_gio`/`nhan_vien_id` nhưng DB thật cho phép NULL |
| `hopdong_laodong.thoi_gian_hop_dong` | Model khai `String(50)`, DB thật vẫn là `TEXT` |
| `nhan_vien.password` | Model khai `String(255)`, DB thật vẫn là `TEXT` |
| `quyche_congty.phu_cap_xang_xe` | Model khai `nullable=True`, DB thật đang `NOT NULL` |

**Vì sao phải sửa:** đây chính xác là "bẫy" mà Alembic được thêm vào để phát hiện (Bước 1) — nhưng phát hiện xong mà không xử lý thì vô nghĩa. Càng để lâu, càng khó biết dòng lệch nào sắp tới còn an toàn để bỏ qua hay không (nguy cơ 1 ngày nào đó `flask db upgrade` chạy nhầm phải đúng những dòng ALTER này).

## 4. Phát hiện MỚI — phát sinh từ chính việc vừa làm ở Bước 1-3

### 4.1 🔴 `ThietBiChamCong.token` lưu dạng plaintext, không hash

```python
token = db.Column(db.String(64), nullable=False, unique=True, index=True)
```
Đây là bí mật xác thực thiết bị (tương đương mật khẩu), nhưng lưu thẳng dạng đọc được trong DB — khác hẳn `NhanVien.password` đã biết dùng `generate_password_hash`/`check_password_hash` đúng cách. Nếu ai đó đọc được DB (backup rò rỉ, SQL injection giả định...), toàn bộ token thiết bị bị lộ ngay lập tức, không cần crack gì cả.

**Vì sao phải sửa:** một khi đã áp dụng đúng nguyên tắc hash mật khẩu ở 1 nơi trong hệ thống, để nơi khác lưu bí mật xác thực dạng plaintext là **mâu thuẫn về chuẩn bảo mật trong cùng 1 dự án** — kẻ tấn công sẽ nhắm vào chỗ yếu nhất, không quan tâm chỗ khác đã làm tốt.

### 4.2 🟠 `NghiPhep` đang "phình to" — gánh cả 3 thế hệ thiết kế khác nhau trong 1 bảng

Bảng này hiện có: field gốc (nghỉ phép cơ bản) + field thai sản (thêm sau) + field chuẩn bị hợp nhất `GiayPhep` (`cham_cong_id`, `so_gio`, `nguoi_duyet_id`...). Nhóm field thứ 3 **đang nằm im, không ai dùng** vì việc hợp nhất đã tạm dừng (mục 5.3).

**Vì sao đáng lưu ý (không phải lỗi, nhưng là rủi ro thiết kế):** đây là dấu hiệu "thêm cột trước, dùng sau" (vi phạm nguyên tắc "không thiết kế cho nhu cầu giả định chưa chốt") — nếu quyết định cuối cùng là **không** hợp nhất `GiayPhep` vào `NghiPhep`, 7 cột này sẽ trở thành cột chết vĩnh viễn, cần dọn lại.

### 4.3 🟢 Trùng tên biến `DonViTinh` Enum — không xung đột nhưng nên biết

`LoaiNghiPhep.don_vi_tinh` dùng `db.Enum(DonViTinh)` tự đặt tên constraint là `donvitinh` (chữ thường, do SQLAlchemy tự sinh) — khác quy ước đặt tên rõ ràng như `ChiTietLuong` (`name='enum_ky_loai'` tường minh ở `DanhGia`). Không gây lỗi, chỉ là thiếu nhất quán style đặt tên constraint.

## 5. DANH SÁCH ƯU TIÊN TỔNG HỢP — thứ tự nên làm tiếp theo

Gộp toàn bộ (mục 2+3+4) thành 1 thứ tự duy nhất, dựa trên: mức độ rủi ro × mức độ đang chặn các việc khác:

| Thứ tự | Việc | Lý do xếp vị trí này |
|---|---|---|
| **1** | Hash `ThietBiChamCong.token` (4.1) | Nhỏ, độc lập, không phụ thuộc gì, rủi ro bảo mật rõ ràng — nên dọn ngay trong lúc còn nhớ |
| **2** | Xử lý dứt điểm lệch schema `danh_gia`/`dao_tao`/`giay_phep`/`hopdong_laodong`/`nhan_vien`/`quyche_congty` (mục 3) | Đang bị né lặp lại ở mọi migration — càng để lâu càng khó phân biệt lệch cũ với lệch mới phát sinh sau này |
| **3** | Quyết định nghiệp vụ: `NghiPhep`↔`GiayPhep` có hợp nhất không (mục 5.3, ảnh hưởng cả 4.2) | Đang treo, cản trở quyết định có nên dọn 7 cột "chờ" trong `NghiPhep` hay không |
| **4** | Chuẩn hóa cột tiền về `Numeric(18,2)` (mục 2.5) | Rủi ro sai số kế toán, càng nhiều dữ liệu càng khó sửa sau |
| **5** | Gộp 2 hệ thống bảng lương `Luong` vs `BangLuong` (mục 2.1) | Cần làm sau khi tiền đã chuẩn Numeric (mục 4), tránh phải đổi kiểu dữ liệu 2 lần |
| **6** | Gộp số liệu bảo hiểm về 1 nguồn (mục 2.2) | Phụ thuộc mục 5 xong trước |
| **7** | Thêm `UniqueConstraint` kỳ lương (mục 2.6) | Làm cùng đợt với mục 5 |
| **8** | Enum hóa các cột trạng thái còn lại (mục 2.7) | Độc lập, có thể chen vào bất kỳ lúc nào rảnh |
| **9** | Audit field `created_by`/`updated_by` (mục 2.8) | Cần có JWT/auth thật trước mới biết "ai" — nên làm cùng lúc với việc dựng lại Authentication |
| **10** | Index FK + bật `PRAGMA foreign_keys=ON` (mục 2.9-2.10) | An toàn, ít rủi ro, làm lúc nào cũng được |
| **11** | Quyết định soft-delete (mục 2.11) | Cần hỏi ý kiến nghiệp vụ/pháp lý trước (thời gian lưu hồ sơ nhân viên nghỉ việc) |
| **12** | `face_encoding` đổi format lưu trữ (mục 2.12) | Thấp, không gấp |
| **13** | Cân nhắc PostgreSQL (mục 2.13) | Chỉ khi lên production thật |

### 5.3 Ghi chú riêng — trạng thái `NghiPhep`/`GiayPhep`

Vẫn đang **tạm dừng có chủ đích** vì `tinh_luong_service.py`/`cham_cong_service.py` đọc trực tiếp `GiayPhep` với quy tắc lương cụ thể (`so_gio==8/4`, lọc `"Tăng ca"`) chưa được xác nhận là có thể gộp an toàn. Việc này cần bạn (hoặc người hiểu ý đồ gốc) xác nhận trước khi mở lại — không tự ý quyết định thay.

## Change Log

| Version | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 2026-08-30 | Khởi tạo — review lại sau Bước 1-3, gộp phát hiện cũ+mới thành 1 danh sách ưu tiên |
