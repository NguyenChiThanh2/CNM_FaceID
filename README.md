# CNM_FaceID

Hệ thống quản lý nhân sự / chấm công bằng nhận diện khuôn mặt / tính lương. Backend Flask + PostgreSQL, frontend React (Vite).

## Yêu cầu môi trường

- **Python 3.12** (đã test với 3.12.10 — bản khác 3.12.x có thể không tìm được wheel `dlib` phù hợp, xem lưu ý bên dưới)
- **Node.js** (khuyến nghị bản LTS mới nhất) + npm
- **Docker Desktop** — chạy PostgreSQL cho database, xem thêm ở mục Database bên dưới
- Windows: **không cần** cài Visual Studio Build Tools nếu dùng đúng wheel `dlib` prebuilt nêu bên dưới

## 1. Cài đặt lần đầu

### 1.1. Clone & vào thư mục backend

```bash
git clone <repo-url> CNM_FaceID
cd CNM_FaceID/backend
```

### 1.2. Tạo virtual environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
```

### 1.3. Cài `dlib` (bắt buộc làm trước `pip install -r requirements.txt`)

`dlib` (thư viện lõi mà `face_recognition` phụ thuộc) không có sẵn wheel cho Windows trên PyPI — build từ source cần Visual Studio Build Tools (nặng, lâu). Cách nhanh hơn: dùng wheel dựng sẵn.

1. Vào repo **z-mahmud22/Dlib_Windows_Python3.x** trên GitHub, tải file `.whl` đúng với bản Python đang dùng (vd. Python 3.12 → file tên có `cp312`).
2. Cài trực tiếp từ file vừa tải:
   ```bash
   pip install "đường-dẫn-tới-file/dlib-19.24.99-cp312-cp312-win_amd64.whl"
   ```
3. Cài thêm (bắt buộc, nếu không `face_recognition_models` sẽ báo lỗi thiếu `pkg_resources`):
   ```bash
   pip install "setuptools<81"
   ```

### 1.4. Cài các package còn lại

```bash
pip install -r requirements.txt
```

### 1.5. Tạo file `.env`

File `.env` **không nằm trong git** (chứa secret) — tự tạo `backend/.env`:

```env
DEVICE_SETUP_KEY=<tự đặt 1 chuỗi bí mật bất kỳ, dùng để đăng ký thiết bị chấm công>
DATABASE_URL=postgresql://faceid_app:faceid_dev_pw@localhost:5432/cnm_faceid
JWT_SECRET_KEY=<random 64 ký tự hex, dùng để ký JWT xác thực đăng nhập>
```

`JWT_SECRET_KEY` tự sinh bằng lệnh:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Thiếu 1 trong 3 key trên, app sẽ báo lỗi ngay lúc khởi động thay vì chạy với giá trị mặc định không an toàn.

### 1.6. Khởi động PostgreSQL (Docker)

`docker-compose.yml` đọc user/password/tên database từ file `.env` **ở thư mục gốc** (khác với `backend/.env` ở bước 1.5 — file này riêng cho Docker Compose). Copy từ file mẫu rồi chỉnh lại nếu muốn:

```bash
cd ..                      # ve thu muc goc CNM_FaceID
cp .env.example .env
```

Sau đó khởi động:

```bash
docker compose up -d
```

> Cần mở **Docker Desktop** trước (icon con cá voi) — lệnh trên chỉ chạy được khi Docker Desktop đã khởi động xong. Kiểm tra bằng `docker ps`.

### 1.7. Tạo schema database

Từ thư mục `backend`:

```bash
set FLASK_APP=app        # Windows cmd
$env:FLASK_APP="app"     # PowerShell
export FLASK_APP=app     # Linux/Mac/Git Bash

flask db upgrade
```

Lệnh này tạo toàn bộ bảng/enum/constraint từ migration hiện có — không cần chạy `db.create_all()` hay import dữ liệu mẫu nào khác.

### 1.8. Khởi tạo phân quyền (RBAC) — bắt buộc, làm ngay sau bước 1.7

Sau khi `flask db upgrade`, mọi nhân viên hiện có (kể cả chưa có ai) đều **chưa có vai trò nào** (`vai_tro_id = NULL`). Vì mọi API nghiệp vụ đều yêu cầu đúng quyền tương ứng, nếu bỏ qua bước này mà chạy backend luôn, **không ai đăng nhập vào làm được gì cả** — kể cả người tạo ra hệ thống, vì chính API gán vai trò cũng đòi hỏi quyền `vai_tro.sua` mà chưa ai có.

Từ thư mục `backend`:

```bash
python scripts/seed_rbac.py
```

Script này (chạy lại nhiều lần vẫn an toàn với phần quyền/vai trò):
1. Seed đầy đủ danh mục quyền (mỗi module nghiệp vụ × 4 hành động xem/thêm/sửa/xóa).
2. Tạo vai trò **Admin** có toàn bộ quyền.
3. Tạo (hoặc cập nhật vai trò cho) 1 tài khoản Admin đầu tiên — email/mật khẩu đang được đặt cứng trong hằng số `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` ở đầu file `scripts/seed_rbac.py`, đổi lại giá trị đó trước khi chạy nếu cần. **Lưu ý**: chạy lại script sẽ reset mật khẩu tài khoản này về đúng giá trị hằng số đó — không dùng làm mật khẩu vận hành lâu dài, chỉ để đăng nhập lần đầu rồi tự đổi/tạo tài khoản khác.

Đăng nhập bằng tài khoản Admin vừa tạo, vào gán vai trò cho các nhân viên còn lại (`PUT /api/nhan-vien/<id>/vai-tro`) **trước khi** để người dùng thật truy cập hệ thống.

### 1.9. Cài frontend

```bash
cd ../frontend
npm install
```

## 2. Chạy hàng ngày (sau khi đã cài lần đầu)

Cần 3 thứ chạy song song:

```bash
# 1. Database (nếu chưa chạy)
docker compose up -d          # chạy ở thư mục gốc CNM_FaceID

# 2. Backend (port 5000)
cd backend
venv\Scripts\activate
python run.py

# 3. Frontend (port 5173)
cd frontend
npm run dev
```

Mở trình duyệt: `http://localhost:5173`

## 3. Thiết lập thiết bị chấm công (device token)

Trang chấm công bằng khuôn mặt (`/cham-cong-face`) yêu cầu mỗi máy phải được đăng ký trước bằng `DEVICE_SETUP_KEY` trong `.env`:

```bash
curl -X POST http://127.0.0.1:5000/api/devices/register \
  -H "X-Setup-Key: <giá trị DEVICE_SETUP_KEY trong backend/.env>" \
  -H "Content-Type: application/json" \
  -d "{\"ten_thiet_bi\": \"Ten may cham cong\"}"
```

Copy `token` trong response, dán vào form trên trang `/cham-cong-face` (chỉ hiện đúng 1 lần lúc tạo, DB chỉ lưu bản hash — mất thì phải đăng ký thiết bị mới).

## 4. Migration database (khi models thay đổi)

```bash
cd backend
flask db migrate -m "mô tả thay đổi"   # tự sinh migration từ diff models
flask db upgrade                        # áp dụng vào database
```

File migration được đặt tên tự động dạng `YYYYMMDD_HHMM_<revision>_<mô-tả>.py` để dễ theo dõi theo thời gian.

Nếu thay đổi thêm 1 module nghiệp vụ mới (blueprint route mới) cần được phân quyền, nhớ thêm tên module đó vào danh sách `MODULES` trong `scripts/seed_rbac.py` rồi chạy lại `python scripts/seed_rbac.py` — script tự động seed thêm quyền còn thiếu vào catalog và gán luôn cho vai trò Admin, không đụng tới các vai trò khác đã có.

## 5. Cấu trúc thư mục

```
CNM_FaceID/
├── docker-compose.yml     # cấu hình PostgreSQL local
├── backend/
│   ├── app/                # models, routes, services, controllers (Flask)
│   ├── migrations/         # Alembic migrations
│   ├── scripts/            # script vận hành (seed_rbac.py, ...)
│   ├── requirements.txt
│   └── run.py              # entry point backend
└── frontend/
    ├── src/
    └── package.json
```
