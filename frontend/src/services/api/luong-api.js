// src/api/luongApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả lương
export const getAllLuong = async () => {
  try {
    const response = await api.get("/luong");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách lương:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy lương theo ID
export const getLuongById = async (id) => {
  try {
    const response = await api.get(`/luong/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy lương ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy lương theo nhân viên
export const getLuongByNhanVienId = async (nhanVienId) => {
  try {
    const response = await api.get(`/luong/nhan-vien/${nhanVienId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy lương của nhân viên ID ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Tạo lương mới
export const createLuong = async (data) => {
  try {
    const response = await api.post("/luong", data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo lương:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Cập nhật lương
export const updateLuong = async (id, data) => {
  try {
    const response = await api.put(`/luong/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật lương ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Xóa lương
export const deleteLuong = async (id) => {
  try {
    const response = await api.delete(`/luong/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa lương ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
