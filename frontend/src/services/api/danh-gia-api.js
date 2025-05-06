// src/api/danhGiaApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả đánh giá
export const getAllDanhGia = async () => {
  try {
    const response = await api.get("/get-all-danh-gia");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đánh giá:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy đánh giá theo ID
export const getDanhGiaById = async (id) => {
  try {
    const response = await api.get(`/get-danh-gia-by-id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy đánh giá ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy đánh giá theo nhân viên
export const getDanhGiaByNhanVienId = async (nhanVienId) => {
  try {
    const response = await api.get(`/get-danh-gia-by-id-nhan-vien/nhan-vien/${nhanVienId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy đánh giá nhân viên ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Tạo đánh giá mới
export const createDanhGia = async (data) => {
  try {
    const response = await api.post("/add-danh-gia", data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo đánh giá:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Cập nhật đánh giá
export const updateDanhGia = async (id, data) => {
  try {
    const response = await api.put(`/edit-danh-gia/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật đánh giá ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Xóa đánh giá
export const deleteDanhGia = async (id) => {
  try {
    const response = await api.delete(`/delete-danh-gia/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa đánh giá ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
