# CNM_FaceID

Hệ thống quản lý nhân sự / chấm công bằng nhận diện khuôn mặt / tính lương. Backend Flask + PostgreSQL, frontend React (Vite).

## Yêu cầu môi trường

- **Docker Desktop** — luôn cần (chạy PostgreSQL cho database dù chọn cách nào; nếu chạy backend/frontend theo **Cách A** bên dưới thì Docker Desktop lo luôn, không cần cài Python/Node)
- **Python 3.12** — chỉ cần nếu chạy backend theo **Cách B** (đã test với 3.12.10 — bản khác 3.12.x có thể không tìm được wheel `dlib` phù hợp, xem lưu ý ở mục 1.3)
- **Node.js** (khuyến nghị bản LTS mới nhất) + npm — chỉ cần nếu chạy frontend theo **Cách B** (`npm run dev`); Cách A (Docker) tự cài Node bên trong image, không cần cài trên máy
- Windows + Cách B: **không cần** cài Visual Studio Build Tools nếu dùng đúng wheel `dlib` prebuilt nêu ở mục 1.3

## 1. Cài đặt lần đầu

Có 2 cách chạy **backend**: **Cách A (Docker)** — nhanh nhất, không cần tự cài Python/`dlib` gì cả, chỉ cần Docker Desktop; hoặc **Cách B (cài trực tiếp bằng venv)** — xem mục 1.1-1.9 bên dưới. Cả 2 cách đều dùng chung 1 database Postgres và chung `frontend/` — **chỉ chọn 1 trong 2** cho phần backend.

### Cách A — Chạy backend bằng Docker (khuyến nghị)

**Yêu cầu:** chỉ cần cài **Docker Desktop**, không cần cài Python, không cần lo tìm wheel `dlib` cho đúng hệ điều hành như Cách B.

**A.1. Clone & vào thư mục gốc:**
```bash
git clone <repo-url> CNM_FaceID
cd CNM_FaceID
```

**A.2. Tạo file `.env` ở thư mục gốc** (Docker Compose đọc file này để biết user/mật khẩu Postgres):
```bash
cp .env.example .env
```

**A.3. Tạo file `backend/.env`** (chứa secret riêng cho Flask) từ file mẫu:
```bash
cp backend/.env.example backend/.env
```
Mở `backend/.env` vừa tạo, điền `DEVICE_SETUP_KEY` và `JWT_SECRET_KEY` (lệnh sinh JWT_SECRET_KEY xem ngay dưới đây). Các dòng còn lại (`FRONTEND_ORIGIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, `SMTP_*`) giữ nguyên giá trị mặc định trong file mẫu là chạy được ngay cho môi trường dev.

Lưu ý: dòng `DATABASE_URL` có sẵn trong file mẫu **không cần sửa** cho Cách A — `docker-compose.yml` tự ghép đúng chuỗi kết nối tới container Postgres (dùng hostname **`postgres`**, đúng tên service khai trong `docker-compose.yml`, thay vì `localhost`) từ chính `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` bạn đặt ở file `.env` bước A.2, rồi tự động **ghi đè** lên giá trị này. (Chỉ Cách B — chạy `python run.py` trực tiếp, không qua Docker — mới cần sửa lại đúng `DATABASE_URL` với `localhost`, xem mục 1.5 bên dưới.)

`JWT_SECRET_KEY` tự sinh bằng lệnh (chạy tạm bằng Python bất kỳ máy nào có sẵn Python, hoặc dùng công cụ sinh chuỗi ngẫu nhiên bất kỳ):
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**A.4. Mở Docker Desktop trước** (icon con cá voi) — mọi lệnh `docker` bên dưới chỉ chạy được khi nó đã khởi động xong. Kiểm tra bằng `docker ps`.

**A.5. Build image backend:**
```bash
docker compose build backend
```
Lần build **đầu tiên** sẽ mất **10-20 phút** — vì `dlib` (thư viện lõi cho nhận diện khuôn mặt) phải tự biên dịch từ mã nguồn C++ ngay trong lúc build, không có sẵn bản dựng sẵn cho mọi nền tảng. Đây là bình thường, không phải bị treo — cứ để nó chạy. Các lần build sau (khi không sửa gì trong `backend/requirements.txt`/`Dockerfile`) sẽ nhanh hơn nhiều nhờ cache.

**A.6. Khởi động Postgres + backend:**
```bash
docker compose up -d
```

**A.7. Khởi tạo schema database** (chỉ cần làm 1 lần, hoặc mỗi khi có migration mới — xem mục 4):
```bash
docker compose exec backend flask db upgrade
```

**A.8. Khởi tạo phân quyền (RBAC) — bắt buộc, làm ngay sau A.7:**
```bash
docker compose exec backend python scripts/seed_rbac.py
```
Xem giải thích chi tiết vì sao bước này bắt buộc ở mục 1.8 bên dưới (Cách B) — lý do giống hệt nhau, chỉ khác là chạy lệnh bên trong container thay vì trong venv.

**A.9. Kiểm tra backend đã sống:**
```bash
curl.exe -i http://localhost:5000/api/vai-tro
```
(Nếu dùng Git Bash/Linux/Mac, bỏ `.exe`: `curl -i ...`) Kỳ vọng thấy `HTTP/1.1 401 UNAUTHORIZED` kèm `{"msg":"Missing cookie \"access_token_cookie\""}` — đây là phản hồi **đúng** (route yêu cầu đăng nhập), chứng tỏ backend đã chạy hoàn chỉnh.

**A.10. Cài & chạy frontend** — xem mục 1.9 và mục 2 bên dưới (không đổi gì, Docker ở đây chỉ áp dụng cho backend).

> **Lệnh dùng hàng ngày sau khi đã cài xong (Cách A):**
> ```bash
> docker compose up -d backend      # khởi động lại (không cần build lại)
> docker compose stop backend       # dừng khi không dùng
> docker compose logs -f backend    # xem log real-time
> ```
> Chỉ cần chạy lại `docker compose build backend` khi bạn **sửa code trong `backend/`** hoặc đổi `requirements.txt`.

---

### Cách B — Cài trực tiếp bằng venv (native, không dùng Docker cho backend)

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

File `.env` **không nằm trong git** (chứa secret) — tạo từ file mẫu (đang đứng trong thư mục `backend`):

```bash
cp .env.example .env
```

Mở `.env` vừa tạo, điền `DEVICE_SETUP_KEY` và `JWT_SECRET_KEY` (sinh bằng lệnh dưới đây); giữ nguyên `DATABASE_URL` mặc định (`...@localhost:5432/...`) nếu bạn dùng đúng user/mật khẩu/tên DB như file mẫu, hoặc sửa lại cho khớp với những gì bạn đặt ở file `.env` gốc (bước 1.6):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Thiếu `DEVICE_SETUP_KEY`, `DATABASE_URL`, hoặc `JWT_SECRET_KEY`, app sẽ báo lỗi ngay lúc khởi động thay vì chạy với giá trị mặc định không an toàn.

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

Cũng có 2 cách, độc lập với cách bạn đã chọn cho backend ở trên — có thể chạy backend Cách A + frontend Cách B hoặc ngược lại, tuỳ ý.

**Cách A — Chạy frontend bằng Docker (production build thật, phục vụ qua Nginx):**

```bash
cd frontend
docker compose build frontend
docker compose up -d frontend
```

`docker compose build frontend` chạy `npm install` + `npm run build` ngay trong image (dùng Node 20 tạm thời ở giai đoạn build), rồi đóng gói kết quả tĩnh (HTML/CSS/JS) vào 1 image Nginx gọn nhẹ để phục vụ — không cần cài Node trên máy, không cần `npm install` thủ công. Truy cập `http://localhost:5173`. Muốn build lại sau khi sửa code: chạy lại đúng 2 lệnh trên.

**Cách B — `npm run dev` (dev server, hot reload):**

```bash
cd frontend
npm install
npm run dev
```

Phù hợp khi đang sửa code frontend liên tục — có hot reload, không cần build lại thủ công. Lưu ý: không chạy đồng thời Cách A và Cách B (cả 2 đều dùng cổng 5173).

## 2. Chạy hàng ngày (sau khi đã cài lần đầu)

Cần 3 thứ chạy song song — **Database**, **Backend**, **Frontend** — mỗi thứ chọn 1 trong 2 cách tuỳ bạn đã cài ở mục 1 (độc lập với nhau):

```bash
# 1. Database (nếu chưa chạy) — chạy ở thư mục gốc CNM_FaceID
docker compose up -d postgres

# 2. Backend (port 5000)
# Cách A (Docker):
docker compose up -d backend      # chạy ở thư mục gốc CNM_FaceID
# Cách B (venv):
cd backend
venv\Scripts\activate
python run.py

# 3. Frontend (port 5173)
# Cách A (Docker):
docker compose up -d frontend     # chạy ở thư mục gốc CNM_FaceID — chỉ dùng bản đã build sẵn, sửa code phải build lại (xem mục 1.9)
# Cách B (npm run dev):
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

**Cách B (venv):**
```bash
cd backend
flask db migrate -m "mô tả thay đổi"   # tự sinh migration từ diff models
flask db upgrade                        # áp dụng vào database
```

**Cách A (Docker)** — chạy cùng lệnh nhưng qua container (đứng ở thư mục gốc `CNM_FaceID`):
```bash
docker compose exec backend flask db migrate -m "mô tả thay đổi"
docker compose exec backend flask db upgrade
```

File migration được đặt tên tự động dạng `YYYYMMDD_HHMM_<revision>_<mô-tả>.py` để dễ theo dõi theo thời gian.

Nếu thay đổi thêm 1 module nghiệp vụ mới (blueprint route mới) cần được phân quyền, nhớ thêm tên module đó vào danh sách `MODULES` trong `scripts/seed_rbac.py` rồi chạy lại `python scripts/seed_rbac.py` (Cách B) hoặc `docker compose exec backend python scripts/seed_rbac.py` (Cách A) — script tự động seed thêm quyền còn thiếu vào catalog và gán luôn cho vai trò Admin, không đụng tới các vai trò khác đã có.

## 5. Cấu trúc thư mục

```
CNM_FaceID/
├── docker-compose.yml     # cấu hình Postgres + backend + frontend (Cách A)
├── .env.example           # mẫu .env cho docker-compose (Postgres)
├── backend/
│   ├── app/                # models, routes, services, controllers (Flask)
│   ├── migrations/         # Alembic migrations
│   ├── scripts/            # script vận hành (seed_rbac.py, ...)
│   ├── Dockerfile          # công thức build image backend (Cách A)
│   ├── .dockerignore
│   ├── requirements.txt
│   └── run.py              # entry point backend
└── frontend/
    ├── src/
    ├── Dockerfile          # multi-stage: build bằng Node, phục vụ bằng Nginx (Cách A)
    ├── nginx.conf          # cấu hình Nginx (SPA fallback cho React Router)
    ├── .dockerignore
    └── package.json
```

## 6. Cấu trúc thư mục đầy đủ

Bản chi tiết hơn mục 5 — mỗi thư mục/file kèm 1 dòng giải thích, để người mới vào code biết nên tìm gì ở đâu:

```
CNM_FaceID/
├── docker-compose.yml       # Cấu hình Postgres + backend + frontend cho Cách A (Docker)
├── .env.example             # Mẫu .env cho docker-compose (POSTGRES_USER/PASSWORD/DB)
├── README.md                # Tài liệu này
│
├── backend/                  # API Flask (Python)
│   ├── run.py                  # Entry point — `python run.py` hoặc gunicorn chạy từ đây
│   ├── requirements.txt        # Danh sách package Python cần cài
│   ├── Dockerfile              # Công thức build image backend (Cách A)
│   ├── .dockerignore           # File/thư mục KHÔNG copy vào image khi build
│   ├── .env.example            # Mẫu file .env riêng cho Flask (secret) — copy thành .env, không commit .env
│   │
│   ├── app/                    # Toàn bộ mã nguồn ứng dụng Flask
│   │   ├── __init__.py           # App factory — tạo Flask app, đăng ký blueprint/extension (JWT, CORS, limiter...)
│   │   ├── db.py                 # Khởi tạo SQLAlchemy, cấu hình kết nối database
│   │   ├── models/                # Định nghĩa bảng database (SQLAlchemy ORM) — 1 file/1 bảng
│   │   ├── routes/                # Khai báo endpoint (URL) — map URL → hàm controller tương ứng
│   │   ├── controllers/           # Nhận request, validate input, gọi service, trả response JSON
│   │   ├── services/              # Logic nghiệp vụ chính (tính lương, chấm công, đánh giá...)
│   │   ├── decorators/            # Decorator dùng chung, vd. @require_module_permission (kiểm tra quyền)
│   │   ├── utils/                  # Hàm tiện ích dùng chung (format, validate, xử lý ảnh khuôn mặt...)
│   │   └── static/                 # File tĩnh app tự sinh/quản lý (ảnh chứng chỉ, avatar mặc định...)
│   │
│   ├── migrations/              # Lịch sử thay đổi schema database (Alembic — tự sinh bằng `flask db migrate`, không tự sửa tay)
│   ├── scripts/                  # Script vận hành, chạy tay khi cần (vd. seed_rbac.py — khởi tạo phân quyền)
│   ├── static/                    # File do NGƯỜI DÙNG tải lên lúc chạy thật (ảnh checkin, avatar) — mount volume ở Cách A để không mất khi build lại container
│   └── uploads/                    # File đính kèm người dùng tải lên (hợp đồng, chứng chỉ...) — cũng mount volume ở Cách A
│
└── frontend/                  # Giao diện React (Vite)
    ├── index.html               # HTML gốc — nơi React "gắn" vào (thẻ `<div id="root">`)
    ├── package.json             # Danh sách package npm + script (dev/build/lint)
    ├── vite.config.js           # Cấu hình Vite (dev server, cách build)
    ├── Dockerfile                # Multi-stage: build bằng Node, phục vụ bằng Nginx (Cách A)
    ├── nginx.conf                # Cấu hình Nginx — SPA fallback cho React Router
    ├── .dockerignore
    ├── public/                    # File tĩnh copy nguyên vẹn vào bản build (favicon, ...)
    ├── context/                   # React Context dùng toàn app (AuthContext.jsx — lưu thông tin user đăng nhập)
    │
    └── src/                       # Toàn bộ mã nguồn React
        ├── main.jsx                 # Entry point — render <App /> vào #root
        ├── App.jsx                  # Component gốc — khai báo toàn bộ route (react-router-dom)
        ├── App.css, css/, styles/   # CSS toàn cục và CSS riêng theo trang/module
        ├── pages/                   # Từng trang trong app (gần như map 1-1 với route)
        │   └── modules/               # Các trang nghiệp vụ chính (nhân sự, chấm công, lương, đánh giá...)
        ├── components/              # Component tái dùng, chia theo nghiệp vụ (nhansu/, chamcong/, thuong/, khautru/...)
        ├── services/                # Hàm gọi API backend bằng axios — 1 file cho mỗi nhóm nghiệp vụ (nhanVienApi.js...)
        ├── hooks/                   # Custom React hook dùng chung
        ├── lib/                     # Cấu hình/khởi tạo thư viện bên thứ ba
        ├── utils/                   # Hàm tiện ích thuần JS (format ngày, export Excel/PDF...)
        └── assets/                  # Ảnh/icon tĩnh import trực tiếp trong code
```

**Không liệt kê ở trên vì tự sinh ra, không commit lên Git** (đã khai trong `.gitignore`/`.dockerignore`): `backend/faceid_env*/` (virtual env cũ), `**/__pycache__/`, `backend/instance/` (file `.db` tạm lúc dev), `frontend/node_modules/`, `frontend/dist/` (kết quả `npm run build`), `.env` các loại (secret thật), `.git/`, `.idea/`.
