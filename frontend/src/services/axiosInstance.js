// src/services/axiosInstance.js
import axios from "axios";
import { attachAuthToken, attachSessionExpiredRedirect } from "../utils/auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

attachAuthToken(axiosInstance);
// Đăng ký TRƯỚC interceptor chuẩn hoá lỗi bên dưới để nhận được error gốc
// (còn error.response.status) — normalizeError phía sau xoá mất field này.
attachSessionExpiredRedirect(axiosInstance);

// (Tùy chọn) Gắn token động
export const setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.Authorization;
  }
};

// Chuẩn hóa lỗi
export const normalizeError = (error) => {
  // Ưu tiên message từ server -> axios -> fallback
  const serverData = error?.response?.data;
  const message =
    serverData?.message ||
    serverData?.error ||
    error?.message ||
    "Đã xảy ra lỗi không xác định";
  const status = error?.response?.status || 0;

  return { message, status, raw: error, data: serverData };
};

// Log và chuyển lỗi thống nhất
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const normalized = normalizeError(error);
    // Chỉ log ở môi trường dev (import.meta.env.DEV — Vite tự tắt khi build
    // production). Trước đây log nguyên object error (gồm error.config —
    // chứa payload request thật như lương, ảnh khuôn mặt base64) ra console
    // production không gate, không kiểm soát — chỉ log status+message ngắn
    // gọn, không log payload request/response đầy đủ.
    if (import.meta.env.DEV) {
      console.error(`Axios error [${normalized.status}]:`, normalized.message);
    }
    // Bạn có thể log thêm ở đây (Sentry, Datadog…)
    return Promise.reject(normalized);
  }
);

export default axiosInstance;
