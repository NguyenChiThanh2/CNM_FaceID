# 03 — AS-IS UPDATE: nhánh `develop2` / `Thanh_pha`

| | |
|---|---|
| Document ID | DOC-00-03 |
| Version | 0.2 |
| Status | Draft |
| Phụ thuộc | `01-as-is-system-analysis.md` (viết dựa trên nhánh `main`) |
| Mục đích | `develop2`/`Thanh_pha` khác `main` rất nhiều (389 file, +28.825/-4.938 dòng so với main) — tài liệu này ghi lại phần **khác biệt** để không phải phân tích lại từ đầu |

⚠️ **Lưu ý về nhánh:** Repo đã bị chuyển nhánh cục bộ nhiều lần trong quá trình làm việc (`main` → `develop2` → `Thanh_pha`, thao tác cuối do người dùng tự chạy ở terminal riêng, không qua AI). Nội dung dưới đây được khảo sát trên `develop2` — cần xác nhận lại `Thanh_pha` có giống hệt hay có thêm khác biệt trước khi coi là tuyệt đối chính xác cho nhánh hiện tại.

## 1. Quy mô thay đổi so với `main`

Thêm khoảng 20 module nghiệp vụ mới: hợp đồng lao động (`hopdong`), bảo hiểm doanh nghiệp (`bh_dn`), khấu trừ (`khau_tru`), thưởng (`thuong`), ngày nghỉ lễ (`ngay_nghi_le`), người phụ thuộc (`nguoi_phu_thuoc`), chứng chỉ/bằng cấp (`chung_chi`, `bang_cap_chung_chi`), quy chế công ty (`quyche_congty`), tính lương chi tiết (`tinh_luong_service.py` ~1064 dòng), bảng lương (`bang_luong`, `chi_tiet_luong`).

## 2. Thay đổi kiến trúc quan trọng nhất: gộp `User` vào `NhanVien`

- Đã xóa hoàn toàn `backend/app/models/user_model.py`, `role_model.py`, `routes/user_routes.py`, `routes/role_routes.py`.
- `NhanVien` có `password`, `set_password()`, `check_password()` — nhân viên tự có tài khoản đăng nhập bằng **email**, không qua bảng `User` riêng.
- Login mới: `POST /api/login` ([nhan_vien_routes.py:46](../../backend/app/routes/nhan_vien_routes.py#L46)) — request `{email, password}`, response `{access_token, nhan_vien: {...}}`.
- **Đánh giá:** hướng đi ĐÚNG, giải quyết đúng lỗ hổng User/NhanVien tách rời của AS-IS bản `main`. Nên giữ hướng thiết kế này.
- **Vai trò/phân quyền (role) chưa được thiết kế lại tương ứng** — chỉ còn `chuc_vu_id`/`ten_chuc_vu` (chức vụ tổ chức), không phải permission model. Cần thiết kế lại có chủ đích ở Phase BA/Database (R3 trong roadmap kỹ thuật).

## 3. Bug hồi quy do refactor nửa vời — ĐÃ SỬA (R0, 2026-08-27)

| # | File | Vấn đề (đã đính chính sau khi đọc kỹ) | Trạng thái |
|---|---|---|---|
| ~~BUG-01~~ | `frontend/src/components/sidebar/sidebar.jsx` | **Đính chính:** không phải "menu admin bị ẩn sai" — thực tế không module nào trong danh sách còn khai báo `.roles`, nên điều kiện lọc theo role vốn là dead code (không lọc gì), không gây hại thực tế. Đã xóa field `role` chết và dòng lọc chết, hành vi không đổi | ✅ Đã dọn |
| BUG-02 | `frontend/src/services/api/user-api.js` | Gọi `/api/get-all-users` — route đã bị xóa ở BE, không ai import file này | ✅ Đã xóa file |
| BUG-03 | `frontend/src/services/api/role-api.js` | Gọi `/api/get-all-roles` — route đã bị xóa ở BE, không ai import file này | ✅ Đã xóa file |

## 4. MacGuard / PublicIPGuard — quyết định R0

- `MacGuard.jsx` **đang thực sự bọc route `/cham-cong-face`** trong `App.jsx`. Logic gọi `GET /api/network-info` ([facecheckin.py:12](../../backend/app/routes/facecheckin.py#L12) → [network_info.py](../../backend/app/utils/network_info.py)) chạy PowerShell **trên máy chủ backend**, trả MAC của server chứ không phải máy khách đang mở trình duyệt → không xác thực được thiết bị nào cả.
- **Vấn đề gốc rễ sâu hơn cả bug code:** trình duyệt web (JavaScript chạy trên client) **không có API nào để đọc địa chỉ MAC của chính máy đang chạy nó** — đây là giới hạn bảo mật cố ý của mọi trình duyệt hiện đại, không phải lỗi cấu hình. Nghĩa là dù sửa lại code cho "đúng", **cách tiếp cận check MAC từ một trang web thuần túy là không khả thi về nguyên tắc**, không chỉ là bug.
- `PublicIPGuard.jsx` không được import ở bất kỳ đâu — chưa từng được bật.
- **Quyết định (Decision Log):** Đã tạm gỡ `MacGuard` khỏi route `/cham-cong-face` trong `App.jsx` (R0, 2026-08-27). Đã xóa hẳn file `MacGuard.jsx` và `PublicIPGuard.jsx` (không còn nơi nào import). Cách kiểm soát thiết bị đúng cho trang chấm công kiosk sẽ được thiết kế lại ở Phase Architecture — xem mục 6.

## 5. Vẫn tồn tại y hệt AS-IS bản `main` (chưa cải thiện)

- Chỉ `/logout` có `@jwt_required()`; toàn bộ ~20 module mới vẫn public hoàn toàn, không xác thực.
- 2 nỗ lực chuẩn hóa dở dang, chưa áp dụng toàn hệ thống: `backend/app/utils/validator.py` (class `Validator`, mới dùng cho module bảo hiểm DN), `backend/app/utils/response_handler.py` (class `ResponseHandler`, format `{success, message, timestamp}`, chưa được gọi ở phần lớn controller cũ).
- `frontend/src/services/axiosInstance.js` — axios instance tập trung tốt, nhưng nhiều service file cũ vẫn tự tạo `axios`/`fetch` riêng.

## 6. Phương án đúng cho việc kiểm soát thiết bị chấm công (`/cham-cong-face`)

Vì trình duyệt không đọc được MAC, có 3 hướng khả thi thật sự — cần chọn 1 trước khi thiết kế lại:

| Hướng | Cách hoạt động | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. Whitelist theo IP nội bộ (server-side)** | BE kiểm tra IP nguồn của request (`request.remote_addr` hoặc header `X-Forwarded-For` nếu qua proxy) so với dải IP LAN văn phòng | Không cần cài thêm gì ở client, enforce thật ở server | Chỉ đúng nếu kiosk có IP tĩnh/dải IP cố định trong mạng nội bộ; không hoạt động nếu qua NAT chung với các máy khác |
| **B. Device token đăng ký trước** | Khi setup máy kiosk, sinh 1 token bí mật lưu vào `localStorage` của đúng trình duyệt đó; mọi request `/face-checkin` phải kèm token, BE kiểm tra token có trong danh sách thiết bị đã đăng ký | Không phụ thuộc mạng, hoạt động cả khi qua VPN/đổi mạng; enforce thật ở server | Cần cơ chế đăng ký/thu hồi token, nếu người dùng xóa localStorage phải đăng ký lại |
| **C. Ứng dụng desktop/agent riêng cho kiosk** | Thay vì web thuần, dùng app desktop (Electron/native) có quyền đọc MAC thật của máy, gửi kèm khi gọi API | Thực sự dùng được MAC như ý định ban đầu | Phải viết thêm 1 ứng dụng riêng, phức tạp hơn nhiều so với A/B |

**Khuyến nghị:** Hướng B (device token) là cân bằng tốt nhất giữa độ an toàn thật và độ phức tạp triển khai, không đòi hỏi kiosk phải cùng mạng LAN với server. Hướng A đơn giản hơn nếu chắc chắn kiosk luôn ở cùng mạng nội bộ cố định IP. Đây là quyết định kiến trúc cần bạn chọn trước khi tôi code.

## Change Log

| Version | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 2026-08-27 | Khởi tạo — dò khác biệt `main` vs `develop2` |
| 0.2 | 2026-08-27 | Cập nhật sau khi thực hiện R0: đính chính BUG-01, ghi nhận đã xóa user-api.js/role-api.js/MacGuard.jsx/PublicIPGuard.jsx, thêm phân tích 3 phương án kiểm soát thiết bị đúng cho /cham-cong-face; ghi chú rủi ro đổi nhánh ngoài tầm kiểm soát |
