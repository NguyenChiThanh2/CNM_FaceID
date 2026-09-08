// src/services/axiosInstance.js
import axios from "axios";
import { attachAuthToken } from "../utils/auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

attachAuthToken(axiosInstance);

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
    // Bạn có thể log thêm ở đây (Sentry, Datadog…)
    console.error("Axios error:", error);
    return Promise.reject(normalizeError(error));
  }
);

export default axiosInstance;
