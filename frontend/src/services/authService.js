// src/services/authService.js
import axiosInstance from "./axiosInstance";

export const loginApi = (emailOrPhone, password) => {
  // Nếu BE chỉ nhận email: đổi key thành { email: emailOrPhone }
  return axiosInstance.post("/login", {
    email: emailOrPhone, // hoặc so_dien_thoai: emailOrPhone nếu bạn login bằng SĐT
    password,
  });
};
