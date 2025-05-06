// src/api/role-api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Đặt URL cơ sở của API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả roles
export const getAllRoles = async () => {
  try {
    const response = await api.get("/get-all-roles");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách roles:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy role theo tên
export const getRoleByName = async (name) => {
  try {
    const response = await api.get(`/get-role-by-name/${name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy role theo tên ${name}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
