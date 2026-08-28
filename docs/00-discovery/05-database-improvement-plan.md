# 05 — KẾ HOẠCH CẢI THIỆN DATABASE (từng bước, có giải thích để học)

| | |
|---|---|
| Document ID | DOC-00-05 |
| Version | 0.1 |
| Status | Draft |
| Phụ thuộc | `04-database-review.md` (danh sách D1-D14 gốc) |
| Cách dùng | Mỗi bước là 1 buổi làm việc độc lập. Làm xong bước nào, kiểm tra xong mới sang bước sau — không nhảy cóc |

Mỗi bước có 5 phần: **Mục tiêu** (làm gì) · **Tại sao** (khái niệm nền, để bạn hiểu chứ không chỉ làm theo) · **Thay đổi cụ thể** (file/schema nào bị đụng) · **Việc bạn tự làm** (phần nên tự tay gõ để nhớ) · **Kiểm tra xong chưa** (Definition of Done).

---

## BƯỚC 1 (D9) — Đưa Alembic (Flask-Migrate) vào dự án

**Mục tiêu:** Có công cụ quản lý thay đổi schema thay vì `db.create_all()`.

**Tại sao (khái niệm nền):** `db.create_all()` chỉ làm 1 việc: "bảng nào chưa có thì tạo" — nó **không bao giờ sửa bảng đã tồn tại**. Nghĩa là nếu bạn thêm cột mới vào model Python, chạy lại app sẽ **không** tự thêm cột đó vào DB thật — code và DB lệch nhau âm thầm, lỗi phát sinh khó hiểu (kiểu "column not found" dù code trông đúng). Alembic giải quyết bằng khái niệm **migration**: mỗi thay đổi schema được ghi thành 1 file script có 2 chiều `upgrade()`/`downgrade()`, chạy tuần tự, có lịch sử, và **áp dụng được lên DB đã có dữ liệu thật** mà không mất dữ liệu. Đây là kỹ năng bắt buộc phải biết với bất kỳ ai làm backend có database — không riêng dự án này.

**Thay đổi cụ thể:**
- Cài `pip install flask-migrate`
- Trong `app/__init__.py`: thêm `from flask_migrate import Migrate` và `migrate = Migrate()`, gọi `migrate.init_app(app, db)` trong `create_app()`
- Chạy `flask db init` (tạo thư mục `migrations/`), `flask db migrate -m "baseline"` (chụp lại schema hiện tại làm mốc), `flask db upgrade` (áp dụng — với DB đã có sẵn thì bước này thực chất chỉ đánh dấu, không đổi gì)

**Việc bạn tự làm:** Tự gõ lệnh `flask db migrate` sau khi tự thêm 1 cột thử nghiệm (ví dụ thêm cột `ghi_chu` vào `ThietBiChamCong`) để thấy Alembic tự sinh ra file migration — đây là cách hiểu nhanh nhất cơ chế hoạt động.

**Kiểm tra xong chưa:** Thư mục `migrations/` tồn tại, `flask db current` chạy không lỗi, bạn tự thêm/xóa được 1 cột thử nghiệm qua migration rồi rollback (`flask db downgrade`) thành công.

---

## BƯỚC 2 (D10) — Sửa 2 bug thật đã tìm thấy

**Mục tiêu:** Sửa `bh_dn.py::to_dict_with_nhan_vien()` (gọi field không tồn tại) và `NgayNghiLe.to_dict()` (check nhầm biến).

**Tại sao:** Đây không phải bài học lý thuyết — là ví dụ thực tế của lỗi "gõ nhầm tên field/biến" rất phổ biến khi code nhanh. Làm trước vì nhỏ, an toàn, không phụ thuộc gì, và **phải làm qua migration (Bước 1) đã có sẵn thói quen trước khi động vào các bước lớn hơn**.

**Thay đổi cụ thể:**
- `bh_dn.py`: đổi `self.nhan_vien.ma_nhan_vien` → bỏ hẳn (field không tồn tại, không có field nào thay thế — cần hỏi lại nghiệp vụ có cần mã nhân viên riêng không, xem Bước 9); đổi `self.nhan_vien.chuc_vu` → `self.nhan_vien.chuc_vu_nv`
- `ngay_nghi_le_model.py`: đổi điều kiện `if self.tu_ngay else None` (dòng `den_ngay`) → `if self.den_ngay else None`

**Việc bạn tự làm:** Tự tìm lỗi bằng cách gọi thử 2 hàm này (viết 1 script test nhỏ `python -c "..."` load 1 bản ghi và gọi `to_dict_with_nhan_vien()`) để **tự mắt thấy** `AttributeError` trước khi sửa — thói quen "tái hiện lỗi trước khi sửa" là kỹ năng debug quan trọng nhất.

**Kiểm tra xong chưa:** Gọi lại 2 hàm, không còn exception.

---

## BƯỚC 3 (D1) — Hợp nhất `NghiPhep` và `GiayPhep`

**Mục tiêu:** Chỉ còn 1 domain duy nhất cho "vắng mặt có duyệt", không còn 2 bảng đại diện cùng 1 khái niệm nghiệp vụ.

**Tại sao (khái niệm nền):** Đây là lỗi thiết kế gọi là **domain duplication** — khi 2 bảng khác nhau đại diện cho cùng một khái niệm nghiệp vụ thực tế, hệ thống mất khả năng trả lời chính xác câu hỏi đơn giản như "nhân viên A nghỉ bao nhiêu ngày tháng này". Nguyên tắc cần nhớ: **1 khái niệm nghiệp vụ = 1 bảng** (single source of truth). Đây là bước **quan trọng nhất** trong toàn kế hoạch vì ảnh hưởng trực tiếp đến độ tin cậy số liệu dùng để tính lương.

**Thay đổi cụ thể (cần bạn quyết định nghiệp vụ trước khi tôi code):**
1. Liệt kê tất cả loại vắng mặt thực tế công ty cần (ốm, phép năm, thai sản, việc riêng, tăng ca xin phép, quên chấm công...)
2. Quyết định: "tăng ca"/"quên chấm công" có thực sự cùng bản chất với "nghỉ phép" không, hay nên tách thành 1 domain riêng ("điều chỉnh công") — đây là câu hỏi BA, không phải câu hỏi kỹ thuật
3. Sau khi chốt, gộp `GiayPhep` vào cấu trúc `NghiPhep`+`LoaiNghiPhep` (thêm các cột đặc thù của `GiayPhep` như `so_gio`, `cham_cong_id` vào bảng hợp nhất nếu cần), viết migration chuyển dữ liệu cũ, xóa bảng thừa
4. Cập nhật toàn bộ API/FE đang đọc `giay_phep` sang bảng mới

**Việc bạn tự làm:** Tự liệt kê danh sách loại vắng mặt thực tế (bước 1-2 ở trên) — đây là phần BA, chỉ bạn trả lời được, không phải tôi.

**Kiểm tra xong chưa:** Chỉ còn 1 bảng nghiệp vụ, 1 API duy nhất, dữ liệu cũ đã migrate đủ (đếm số dòng trước/sau khớp nhau).

---

## BƯỚC 4 (D2) — Chọn 1 nguồn sự thật cho bảng lương

**Mục tiêu:** Giữ `BangLuong`+`ChiTietLuong` (snapshot), loại bỏ dần `Luong` (tính runtime).

**Tại sao (khái niệm nền):** Đây là khái niệm **"tính toán tại thời điểm đọc" (computed on read) vs "chốt số liệu tại thời điểm ghi" (snapshot on write)**. Với dữ liệu tài chính/lương, luôn phải **snapshot** — vì nếu công thức thuế/bảo hiểm thay đổi sau này, phiếu lương tháng trước **không được phép** tự động đổi số theo công thức mới (sai kế toán, sai pháp lý). `Luong.tong_luong` hiện là `@property` tính lại mỗi lần đọc → vi phạm nguyên tắc này.

**Thay đổi cụ thể:**
- Viết script migrate: với mỗi dòng `Luong` cũ, tính ra số liệu bằng đúng công thức hiện tại, ghi thành 1 dòng `BangLuong`+`ChiTietLuong` tương ứng
- Sau khi xác nhận dữ liệu chuyển đủ, đánh dấu `Luong` là deprecated (không cho tạo mới), cuối cùng xóa bảng
- Sửa toàn bộ route/controller/FE đang dùng `/api/get-all-luong`... sang API của `BangLuong`

**Việc bạn tự làm:** Tự đối chiếu 3-5 dòng dữ liệu mẫu bằng tay (tính thủ công theo công thức) so với kết quả migrate ra — để chắc chắn hiểu đúng công thức trước khi tin tưởng migrate hàng loạt.

**Kiểm tra xong chưa:** Không còn nơi nào gọi tới bảng `Luong`; số liệu đối chiếu tay khớp.

---

## BƯỚC 5 (D3) — Gộp số liệu bảo hiểm về 1 nơi

**Mục tiêu:** Bảo hiểm phía nhân viên đóng chỉ lưu ở `BangLuong` (đã có sẵn `bhxh`/`bhtn`/`bhyt`); `bh_dn` giữ nguyên vì là *đối tượng chi trả khác* (doanh nghiệp, không phải nhân viên) nên **không phải trùng lặp thật**, chỉ cần đảm bảo không tính 2 lần ở đâu khác.

**Tại sao:** Sau Bước 4, `Luong.bao_hiem` (tính cứng 10.5%) đã biến mất cùng bảng `Luong` — bước này chỉ còn việc rà lại FE/report có chỗ nào tự tính lại bảo hiểm ngoài `BangLuong` không.

**Thay đổi cụ thể:** Grep toàn bộ code tìm chỗ nào tự nhân `0.105` hoặc tính bảo hiểm thủ công ngoài `BangLuong`, thay bằng đọc trực tiếp cột đã lưu.

**Việc bạn tự làm:** Tự chạy `grep -rn "0.105\|bao_hiem" backend/app` để tự tìm ra các chỗ cần sửa — luyện thói quen "tìm hết mọi chỗ dùng lại 1 logic" trước khi sửa.

**Kiểm tra xong chưa:** Chỉ 1 nơi trong code tính bảo hiểm nhân viên đóng.

---

## BƯỚC 6 (D4) — Chuẩn hóa cột tiền về `Numeric(18,2)`

**Mục tiêu:** Toàn bộ cột tiền dùng cùng 1 kiểu dữ liệu.

**Tại sao (khái niệm nền):** `Float` (dấu phẩy động nhị phân, IEEE-754) **không biểu diễn chính xác** hầu hết số thập phân — ví dụ `0.1 + 0.2` trong máy tính không ra đúng `0.3`. Với tiền tệ, sai số này tích lũy qua hàng nghìn phép cộng/trừ (lương × 12 tháng × hàng chục nhân viên) có thể lệch vài đồng đến vài nghìn đồng — nhỏ nhưng **sai lệch kế toán là không được phép có**, dù chỉ 1 đồng. `Numeric`/`Decimal` biểu diễn thập phân chính xác tuyệt đối, đó là lý do mọi hệ thống tài chính chuyên nghiệp bắt buộc dùng nó, không dùng `Float`.

**Thay đổi cụ thể:** Đổi `db.Float` → `db.Numeric(18, 2)` ở: `Luong` (nếu còn), `BangLuong`, `HopDongLaoDong`, `QuyCheCongTy`, `BaoHiemDoanhNghiep`; đổi `Thuong.so_tien` từ `Numeric(18,1)` → `Numeric(18,2)`. Mỗi thay đổi là 1 migration Alembic riêng (dùng kỹ năng học ở Bước 1).

**Việc bạn tự làm:** Tự viết đoạn Python nhỏ minh họa `0.1 + 0.2 != 0.3` bằng `float` rồi so với `Decimal('0.1') + Decimal('0.2')` để tự mắt thấy vấn đề trước khi tin lý do đổi kiểu dữ liệu.

**Kiểm tra xong chưa:** Không còn `db.Float` ở bất kỳ cột tiền nào; app chạy lại không lỗi kiểu dữ liệu (Python `Decimal` khác `float`, cần soát lại chỗ nào cộng trừ nhân chia trực tiếp).

---

## BƯỚC 7 (D5) — Thêm `UniqueConstraint` chống trùng dữ liệu theo kỳ

**Mục tiêu:** `BangLuong` (và `Luong` nếu vẫn còn tạm thời) không thể có 2 dòng cùng `nhan_vien_id + thang + nam`.

**Tại sao (khái niệm nền):** Đây là khái niệm **ràng buộc toàn vẹn dữ liệu ở tầng DB (database-level integrity constraint)** thay vì chỉ kiểm tra ở tầng code (application-level check). Kiểm tra ở code (`if not exists: create`) luôn có **race condition** — 2 request gửi cùng lúc đều thấy "chưa có" rồi cùng tạo mới, ra 2 dòng trùng. DB-level constraint là lớp phòng vệ cuối cùng không thể bị bỏ qua dù code có bug.

**Thay đổi cụ thể:** Thêm vào `__table_args__` của `BangLuong`: `UniqueConstraint('nhan_vien_id', 'thang', 'nam', name='uq_bangluong_nv_ky')` — giống hệt cách `BaoHiemDoanhNghiep`/`DanhGia` đã làm.

**Việc bạn tự làm:** Tự thử tạo 2 dòng trùng bằng tay (qua API hoặc Python shell) trước và sau khi thêm constraint để thấy sự khác biệt: trước thì tạo được, sau thì DB tự chặn và ném lỗi `IntegrityError`.

**Kiểm tra xong chưa:** Tạo trùng bị DB từ chối, không phải code tự check.

---

## BƯỚC 8 (D6) — Chuẩn hóa chuỗi tự do thành Enum

**Mục tiêu:** `trang_thai`, `loai_giay_phep` (nếu còn sau Bước 3), `NhanVien.trang_thai`... đổi từ `db.String` sang `db.Enum`.

**Tại sao:** `db.Enum` bắt lỗi **ngay tại tầng DB** nếu code lỡ ghi giá trị không nằm trong danh sách hợp lệ (ví dụ gõ nhầm `"Đả duyệt"` thay vì `"Đã duyệt"`) — với `String` tự do, lỗi này chỉ phát hiện được khi làm báo cáo và thấy thiếu số liệu (khó debug hơn nhiều vì không có lỗi ngay lúc ghi).

**Thay đổi cụ thể:** Định nghĩa `Enum` Python cho từng nhóm giá trị hữu hạn, đổi cột tương ứng, viết migration chuyển dữ liệu cũ (map chuỗi cũ sang giá trị enum mới, xử lý trường hợp chuỗi không khớp enum nào — chính là những chỗ có bug chính tả tiềm ẩn từ trước).

**Việc bạn tự làm:** Trước khi đổi, tự chạy `SELECT DISTINCT trang_thai FROM ...` trên từng bảng để tự liệt kê hết các giá trị thực tế đang tồn tại trong DB — thường sẽ lòi ra vài giá trị "rác"/gõ sai bạn chưa biết.

**Kiểm tra xong chưa:** Cột đã là Enum, migrate xong không mất dữ liệu, `SELECT DISTINCT` chỉ còn đúng các giá trị hợp lệ.

---

## BƯỚC 9 (D7) — Thêm audit field (`created_by`/`updated_by`)

**Mục tiêu:** Mọi bảng nghiệp vụ quan trọng biết được **ai** tạo/sửa, không chỉ **khi nào**.

**Tại sao (khái niệm nền):** Đây là khái niệm **audit trail** — yêu cầu tối thiểu cho bất kỳ hệ thống nào động vào tiền lương/nhân sự, vì luôn có lúc cần trả lời "ai đã duyệt cái này", "ai sửa số liệu này". Không có audit trail là rủi ro lớn khi có tranh chấp hoặc kiểm tra nội bộ.

**Thay đổi cụ thể:** Thêm `created_by_id`/`updated_by_id` (FK tới `nhan_vien.id`, `nullable=True` vì dữ liệu cũ không có ai gán) cho: `bang_luong`, `nghi_phep` (bảng hợp nhất sau Bước 3), `khau_tru`, `thuong`, `hopdong_laodong`. Việc lấy "ai đang thao tác" phụ thuộc vào việc có JWT xác thực đầy đủ (liên quan tới nhánh Authentication ở tài liệu roadmap kỹ thuật trước đó — 2 việc này nên làm gần nhau).

**Việc bạn tự làm:** Tự vẽ lại 1 luồng nghiệp vụ cụ thể (ví dụ duyệt đơn nghỉ phép) và tự chỉ ra chính xác dòng code nào là nơi cần ghi `updated_by_id` — luyện đọc luồng code để tìm đúng điểm chèn logic.

**Kiểm tra xong chưa:** Tạo/sửa 1 bản ghi qua API có JWT thật, kiểm tra `created_by_id` được ghi đúng người.

---

## BƯỚC 10 (D8) — Thêm index FK + bật ràng buộc khóa ngoại SQLite

**Mục tiêu:** Truy vấn theo `nhan_vien_id` nhanh hơn khi dữ liệu lớn; DB thực sự từ chối ghi `nhan_vien_id` không tồn tại.

**Tại sao (khái niệm nền):** **Index** giúp DB tìm dòng theo 1 cột nhanh (giống mục lục sách) thay vì phải đọc tuần tự toàn bộ bảng (full table scan) — quan trọng khi bảng có hàng chục nghìn dòng trở lên. **Foreign key enforcement** đảm bảo tính toàn vẹn tham chiếu (referential integrity) — không cho phép tồn tại 1 dòng `cham_cong` trỏ tới `nhan_vien_id` đã bị xóa hoặc chưa từng tồn tại.

**Thay đổi cụ thể:** Thêm `index=True` cho các cột FK còn thiếu (liệt kê ở review); trong `app/__init__.py` thêm event listener bật `PRAGMA foreign_keys=ON` mỗi khi mở kết nối SQLite (mẫu code chuẩn của SQLAlchemy cho việc này).

**Việc bạn tự làm:** Tự thử insert 1 dòng `cham_cong` với `nhan_vien_id=99999` (không tồn tại) trước và sau khi bật PRAGMA để tự thấy khác biệt.

**Kiểm tra xong chưa:** Insert dữ liệu tham chiếu sai bị DB từ chối.

---

## BƯỚC 11 (D11) — Quyết định & làm soft-delete

**Mục tiêu:** Xóa `NhanVien` không xóa cứng lịch sử liên quan.

**Tại sao (khái niệm nền):** **Soft delete** = thêm cột `deleted_at` (hoặc `is_deleted`), "xóa" chỉ là set cột này, dữ liệu vẫn còn trong DB nhưng bị lọc khỏi truy vấn thông thường. Đánh đổi: mọi query phải nhớ thêm điều kiện `WHERE deleted_at IS NULL` (dễ quên, dễ lộ dữ liệu đã xóa nếu quên) — đây là lý do cần cân nhắc kỹ, không phải cứ soft-delete là tốt hơn hard-delete trong mọi trường hợp.

**Thay đổi cụ thể (cần bạn quyết định trước):** Có bắt buộc giữ lịch sử nhân viên đã nghỉ việc không (theo luật lao động VN, hồ sơ lương thường cần lưu nhiều năm)? Nếu có → thêm `deleted_at` cho `NhanVien`, đổi toàn bộ `cascade='all, delete-orphan'` thành không cascade (giữ lại `BangCapChungChi`/`NhanVienPhucLoi`/`BaoHiemDoanhNghiep` của người đã nghỉ việc), và sửa toàn bộ query "lấy danh sách nhân viên" thêm điều kiện lọc.

**Việc bạn tự làm:** Tự tìm quy định thực tế công ty/luật lao động về thời gian phải lưu hồ sơ lương nhân viên đã nghỉ việc — đây là input bắt buộc phải có trước khi code, không phải quyết định kỹ thuật thuần túy.

**Kiểm tra xong chưa:** "Xóa" 1 nhân viên test, xác nhận dữ liệu liên quan vẫn còn trong DB nhưng không hiện trong danh sách thường.

---

## BƯỚC 12 (D12) — Rõ ràng hóa quan hệ `QuyCheCongTy` ↔ `HopDongLaoDong`

**Mục tiêu:** Khi tạo hợp đồng mới, các hệ số/phụ cấp được **copy (snapshot)** từ quy chế công ty tại thời điểm ký, không tham chiếu sống.

**Tại sao:** Cùng nguyên tắc snapshot-on-write đã học ở Bước 4 — nếu công ty đổi quy chế (ví dụ tăng hệ số tăng ca từ 1.5 lên 2.0), các hợp đồng **đã ký trước đó** không được tự động đổi theo, vì đó là điều khoản đã cam kết tại thời điểm ký.

**Thay đổi cụ thể:** Sửa API tạo `HopDongLaoDong`: khi tạo mới, đọc giá trị hiện tại từ `QuyCheCongTy` (theo `quyche_id` được chọn) rồi ghi thẳng vào các cột của `HopDongLaoDong` (đã có sẵn cấu trúc này, chỉ cần đảm bảo code làm đúng việc copy, không để trống rồi tính runtime).

**Việc bạn tự làm:** Tự đọc lại `hopdong_routes.py::create_hop_dong()` hiện tại, xác định nó đã copy giá trị từ quy chế hay đang để nhân viên tự nhập tay từng field — quyết định UX (tự nhập vs auto-fill rồi cho sửa) là điều bạn cần chốt.

**Kiểm tra xong chưa:** Đổi thử 1 giá trị trong `QuyCheCongTy`, xác nhận hợp đồng cũ không đổi theo, hợp đồng mới tạo sau đó dùng giá trị mới.

---

## BƯỚC 13 (D13) — Đổi cách lưu `face_encoding`

**Mục tiêu:** Không dùng `PickleType`.

**Tại sao (khái niệm nền):** `pickle` là cơ chế serialize object Python **thực thi code khi deserialize** — nếu 1 ngày nào đó dữ liệu trong cột này bị ai đó chèn dữ liệu độc hại (dù xác suất thấp ở dự án nội bộ), việc đọc lại có thể chạy code tùy ý trên server. Đây là bài học về **an toàn khi (de)serialize dữ liệu** — nguyên tắc chung: không dùng pickle cho dữ liệu có khả năng bị tác động từ bên ngoài dù nhỏ.

**Thay đổi cụ thể:** Đổi `db.PickleType` → `db.LargeBinary`, lưu bằng `numpy_array.tobytes()`, đọc lại bằng `np.frombuffer(data, dtype=np.float64)`.

**Việc bạn tự làm:** Tự viết đoạn script nhỏ convert 3-5 `face_encoding` hiện có từ pickle sang bytes, tự so sánh mảng số trước/sau để chắc chắn không mất dữ liệu.

**Kiểm tra xong chưa:** Chấm công bằng khuôn mặt vẫn nhận diện đúng sau khi đổi format lưu trữ.

---

## BƯỚC 14 (D14) — Cân nhắc chuyển sang PostgreSQL (khi cần, không gấp)

**Mục tiêu:** Chỉ làm khi hệ thống thật sự có nhiều người dùng đồng thời.

**Tại sao:** SQLite khóa ghi ở mức **toàn file DB** (chỉ 1 tiến trình ghi tại 1 thời điểm) — với vài chục người dùng chấm công/nhập liệu cùng lúc vẫn ổn, nhưng sẽ nghẽn khi tăng quy mô. PostgreSQL hỗ trợ ghi đồng thời tốt hơn nhiều (row-level locking), có kiểu `Enum`/`Numeric` mạnh hơn thực sự ở tầng DB (SQLite mô phỏng lỏng lẻo hơn).

**Thay đổi cụ thể:** Không làm ngay — chỉ cần biết `SQLALCHEMY_DATABASE_URI` đã được viết theo kiểu đọc từ biến môi trường (`app/__init__.py` đã làm đúng việc này rồi), nên khi cần chuyển chỉ phải đổi connection string + cài `psycopg2`, không phải sửa code model nếu các bước D1-D13 đã chuẩn hóa đúng kiểu dữ liệu ANSI SQL chuẩn.

---

## Bảng tổng hợp thứ tự

| Bước | Mã | Tên ngắn | Phụ thuộc bước trước |
|---|---|---|---|
| 1 | D9 | Alembic | — |
| 2 | D10 | Sửa 2 bug | 1 |
| 3 | D1 | Gộp NghiPhep/GiayPhep | 1, 2 |
| 4 | D2 | Chọn 1 nguồn lương | 1, 3 |
| 5 | D3 | Gộp số liệu bảo hiểm | 4 |
| 6 | D4 | Chuẩn hóa Numeric | 1 |
| 7 | D5 | UniqueConstraint kỳ | 4, 6 |
| 8 | D6 | Enum hóa trạng thái | 3 |
| 9 | D7 | Audit field | 1 |
| 10 | D8 | Index + FK enforcement | 1 |
| 11 | D11 | Soft-delete | quyết định nghiệp vụ |
| 12 | D12 | Precedence quy chế/hợp đồng | 4 |
| 13 | D13 | face_encoding format | — (độc lập, làm bất kỳ lúc nào) |
| 14 | D14 | PostgreSQL | tất cả các bước chuẩn hóa xong |

## Change Log

| Version | Ngày | Thay đổi |
|---|---|---|
| 0.1 | 2026-08-27 | Khởi tạo — chi tiết hóa 14 đề xuất từ 04-database-review.md thành từng bước có giải thích |
