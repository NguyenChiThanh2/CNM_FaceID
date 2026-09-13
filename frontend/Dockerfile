# ============================================================================
# Dockerfile cho frontend — kiểu MULTI-STAGE BUILD (build nhiều giai đoạn).
#
# Khái niệm mới so với Dockerfile của backend: 1 Dockerfile có thể có NHIỀU
# "FROM" — mỗi FROM mở ra 1 STAGE (giai đoạn) độc lập, có filesystem riêng.
# Stage sau có thể "COPY --from=<tên stage trước>" để lấy TỪNG PHẦN kết quả
# của stage trước, mà không mang theo TOÀN BỘ môi trường đã dùng để tạo ra nó.
#
# Tại sao cần kiểu này cho frontend: để BUILD ra file JS/CSS tĩnh, ta cần
# Node.js + npm + toàn bộ node_modules (rất nặng, có thể vài trăm MB). Nhưng
# để CHẠY (phục vụ) các file tĩnh đó cho trình duyệt tải về, ta hoàn toàn
# không cần Node/npm nữa — chỉ cần 1 web server tĩnh (ở đây dùng Nginx). Nếu
# gộp chung 1 stage, image cuối cùng sẽ "vác" theo cả đống Node/npm/
# node_modules không dùng tới lúc chạy thật — multi-stage giúp "vứt bỏ" hết
# phần đó, chỉ giữ lại đúng file tĩnh cần thiết.
# ============================================================================

# ---- STAGE 1: "build" — dùng Node để biên dịch code React ra file tĩnh ----
# alpine = bản Linux siêu nhẹ (khác "slim" của Debian bên backend) — phổ biến
# cho các image chỉ cần tồn tại tạm trong lúc build.
FROM node:20-alpine AS build

WORKDIR /app

# Copy đúng 2 file khai báo dependency trước (giống lý do COPY requirements.txt
# trước ở backend) — layer "npm install" chỉ build lại khi 2 file này đổi.
COPY package.json package-lock.json ./
RUN npm install

# Copy toàn bộ code còn lại rồi build ra thư mục dist/
COPY . .
RUN npm run build

# ---- STAGE 2: "serve" — dùng Nginx để phục vụ đúng file tĩnh vừa build ----
# Bắt đầu lại từ 1 image HOÀN TOÀN MỚI (không kế thừa gì từ stage "build" ở
# trên) — đây chính là chỗ "vứt bỏ" Node/npm/node_modules.
FROM nginx:alpine

# Lấy đúng thư mục dist/ (kết quả build) từ stage "build" — không lấy gì khác.
COPY --from=build /app/dist /usr/share/nginx/html

# Ghi đè cấu hình Nginx mặc định bằng cấu hình riêng — bắt buộc vì app dùng
# React Router kiểu "BrowserRouter" (đường dẫn thật như /nhan-su, /danh-gia),
# xem giải thích chi tiết trong nginx.conf cạnh file này.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Image nginx chính thức đã tự có sẵn CMD khởi động Nginx, không cần khai lại.
