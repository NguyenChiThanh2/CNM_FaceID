# ============================================================================
# Dockerfile — "công thức" để Docker tự động dựng (build) một Docker IMAGE
# cho backend. Image là 1 bản đóng gói bất biến (immutable) gồm: hệ điều hành
# tối giản + Python + toàn bộ thư viện trong requirements.txt + code của bạn.
# Từ 1 image, Docker chạy ra được nhiều CONTAINER — mỗi container là 1 tiến
# trình đang chạy thực sự từ image đó (giống như "class" và "object" trong
# lập trình hướng đối tượng: image là class, container là object/instance).
# ============================================================================

# ---- BASE IMAGE ----
# Mọi Dockerfile phải bắt đầu từ 1 image có sẵn để "kế thừa" lên trên (giống
# extends 1 class cha). Ở đây dùng image Python chính thức, bản "slim" —
# slim = bản Debian Linux đã cắt bớt các gói không cần thiết, nhẹ hơn nhiều
# so với image Python đầy đủ (full) nhưng vẫn đủ để cài thư viện qua pip.
# Ban đầu thử 3.12 (version đang chạy trong venv faceid_env_new trên máy
# này) nhưng build THẬT bị lỗi: mediapipe==0.10.11 (đúng version app đang
# dùng) chỉ có bản build sẵn (wheel) cho Python 3.8–3.11 trên PyPI, KHÔNG có
# cho 3.12 — pip không tự biên dịch mediapipe từ mã nguồn được (quá phức
# tạp), nên báo lỗi "no matching distribution". Đây là ví dụ thực tế khác của
# đúng vấn đề "máy này chạy máy khác không chạy": venv cũ trên máy chạy được
# 3.12 vì mediapipe khi đó có thể đã được cài qua kênh khác (conda) chứ
# không qua đúng pip+PyPI. Chọn 3.11 — đủ mới, có wheel cho mọi thư viện
# trong requirements.txt (đã kiểm tra: mediapipe 0.10.11 có wheel cho 3.11;
# numpy 2.5.2 yêu cầu tối thiểu Python 3.9 nên 3.11 vẫn thoả).
FROM python:3.11-slim

# ---- SYSTEM DEPENDENCIES ----
# Một số thư viện Python trong requirements.txt (dlib, opencv, mediapipe)
# không phải thuần Python — chúng có phần lõi viết bằng C/C++ cần được BIÊN
# DỊCH (compile) ra mã máy lúc cài đặt, hoặc cần sẵn vài thư viện hệ thống
# (.so) lúc chạy. Image "slim" không có sẵn các thứ này nên phải tự cài:
#   - build-essential: bộ công cụ biên dịch C/C++ (gcc, g++, make...) — dlib
#     cần cái này để tự build từ mã nguồn.
#   - cmake: công cụ điều phối quá trình build C/C++ mà dlib dùng.
#   - libgl1, libglib2.0-0: 2 thư viện hệ thống mà opencv (cv2) cần có sẵn
#     lúc CHẠY (runtime), dù server không có màn hình/GUI gì cả — thiếu 2 cái
#     này sẽ bị lỗi "ImportError: libGL.so.1: cannot open shared object file"
#     ngay khi "import cv2".
# apt-get update: tải danh sách gói mới nhất trước khi cài (giống mở lại danh
# mục cửa hàng trước khi mua).
# --no-install-recommends: chỉ cài đúng gói cần, không cài kèm gói "gợi ý"
# không bắt buộc — giữ image nhỏ hơn.
# rm -rf /var/lib/apt/lists/*: xoá cache danh sách gói sau khi cài xong —
# cache này không cần nữa và làm image nặng thêm vô ích nếu để lại.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ---- WORKDIR ----
# Đặt "thư mục làm việc hiện tại" bên TRONG container là /app — mọi lệnh COPY/
# RUN phía sau đều tính từ đây. Giống lệnh "cd /app" nhưng Docker tự tạo luôn
# thư mục này nếu chưa có.
WORKDIR /app

# ---- CÀI THƯ VIỆN PYTHON TRƯỚC, COPY CODE SAU (rất quan trọng, xem giải
# thích LAYER CACHE bên dưới) ----
# Docker build 1 image theo từng bước tuần tự, mỗi lệnh (FROM/RUN/COPY...) tạo
# ra 1 LAYER (lớp) riêng và được CACHE (lưu lại) lại. Lần build sau, nếu 1
# layer có input giống hệt lần trước, Docker dùng lại cache thay vì làm lại từ
# đầu — tiết kiệm rất nhiều thời gian (build lại dlib/opencv từ đầu mỗi lần
# sửa code sẽ mất hàng chục phút, không ai chịu nổi).
# Vì vậy: COPY đúng mỗi requirements.txt trước rồi pip install — layer "cài
# thư viện" chỉ bị build lại khi ĐÚNG file requirements.txt đổi nội dung. Nếu
# ta COPY toàn bộ code (". .") trước rồi mới pip install, thì chỉ cần sửa 1
# dòng code bất kỳ, Docker cũng nghĩ layer sau nó (pip install) "có thể đã bị
# ảnh hưởng" và build lại từ đầu — dù thực ra requirements.txt không hề đổi.
COPY requirements.txt .

# --no-cache-dir: pip không lưu cache gói đã tải (.whl) trong image — cache đó
# chỉ có ích khi cài lại nhiều lần trên máy dev, còn trong image production
# thì không cần, chỉ tổ làm image nặng thêm.
# Cảnh báo quan trọng: dlib KHÔNG có sẵn bản build sẵn (wheel) cho mọi nền
# tảng trên PyPI, nên bước này sẽ tự BIÊN DỊCH dlib từ mã nguồn C++ ngay
# trong lúc build — có thể mất 10-20 PHÚT tuỳ máy, đây là điều bình thường,
# không phải bị treo.
#
# Cài dlib RIÊNG thành 1 layer độc lập, tách khỏi phần còn lại của
# requirements.txt — lý do thực tế: trong lúc build image này, mạng bị đứt
# giữa chừng ("Connection broken: IncompleteRead") vài lần khi đang tải các
# gói NẶNG khác (opencv, mediapipe), buộc phải build lại từ đầu — mà build lại
# nghĩa là BIÊN DỊCH LẠI dlib từ đầu (chục phút) dù dlib chẳng liên quan gì
# tới lỗi mạng đó. Tách riêng thành 1 layer để layer "đã cài xong dlib" được
# CACHE lại — lần build lại sau (do lỗi mạng ở bước sau) sẽ dùng cache này,
# không phải build dlib lại từ đầu.
# --retries/--timeout: tăng số lần pip tự thử lại và thời gian chờ mỗi lần
# tải, để bền hơn trước mạng chập chờn (mặc định của pip khá thấp, dễ bị coi
# là lỗi khi tải file nặng qua mạng không ổn định).
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --retries 10 --timeout 120 dlib==19.24.6

# --extra-index-url .../whl/cpu: mediapipe (mà app THẬT SỰ cần, để nhận diện
# khuôn mặt) tự khai báo phụ thuộc "torch" (PyTorch) không giới hạn version —
# dù code backend không hề dùng PyTorch cho việc gì. Vì không chỉ định gì
# thêm, pip mặc định chọn bản PyTorch có hỗ trợ GPU, kéo theo TOÀN BỘ CUDA
# runtime của Nvidia (hàng GB) dù server này không có GPU. Trỏ thêm 1 "kho gói
# phụ" (extra index) chính thức của PyTorch chỉ chứa bản CPU-only — pip sẽ ưu
# tiên bản đó, không tải theo CUDA nữa.
RUN pip install --no-cache-dir --retries 10 --timeout 120 \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r requirements.txt

# ---- COPY CODE ----
# Copy toàn bộ code backend (trừ những gì đã liệt kê trong .dockerignore) vào
# /app bên trong container.
COPY . .

# ---- EXPOSE ----
# Chỉ mang tính KHAI BÁO/tài liệu — báo cho người đọc Dockerfile (và 1 số
# công cụ) biết container này dự định lắng nghe ở cổng 5000. Dòng này KHÔNG
# tự mở cổng ra ngoài — việc thực sự "mở cổng ra máy host" nằm ở lúc chạy
# container (xem "ports" trong docker-compose.yml, hoặc cờ -p khi docker run).
EXPOSE 5000

# ---- CMD ----
# Lệnh sẽ chạy khi container KHỞI ĐỘNG (khác với RUN — RUN chạy lúc BUILD
# image, CMD chỉ định nghĩa lệnh sẽ chạy lúc container thực sự start lên).
# Dùng gunicorn (production WSGI server, giống Procfile đã có sẵn cho
# Heroku: "web: gunicorn run:app") thay vì "python run.py" — server dev tích
# hợp sẵn trong Flask (app.run()) không đủ mạnh, không nên dùng cho production
# thật (Flask tự cảnh báo điều này mỗi khi chạy debug server).
# "run:app" nghĩa là: import module run.py, lấy biến tên "app" trong đó
# (chính là Flask app đã register_routes() đầy đủ) để phục vụ request.
# --bind 0.0.0.0:5000: lắng nghe trên MỌI địa chỉ mạng trong container, không
# chỉ 127.0.0.1 — bắt buộc phải vậy thì cổng mới "lộ" ra ngoài container được
# (nếu chỉ bind 127.0.0.1, request từ ngoài container gửi vào sẽ không tới
# được, dù đã "ports" đúng).
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "run:app"]
