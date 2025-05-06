// src/api/nghiPhepApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả nghỉ phép
export const getAllNghiPhep = async () => {
  try {
    const res = await api.get("/get-all-nghi-phep");
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nghỉ phép:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy nghỉ phép theo ID
export const getNghiPhepById = async (id) => {
  try {
    const res = await api.get(`/get-all-nghi-phep-by-id/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nghỉ phép ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy nghỉ phép theo nhân viên
export const getNghiPhepByNhanVienId = async (nhanVienId) => {
  try {
    const res = await api.get(`/get-all-nghi-phep-by-nhan-vien-id/nhan-vien/${nhanVienId}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nghỉ phép nhân viên ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Tạo mới nghỉ phép
export const createNghiPhep = async (data) => {
  try {
    const res = await api.post("/add-nghi-phep", data);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nghỉ phép:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Cập nhật nghỉ phép
export const updateNghiPhep = async (id, data) => {
  try {
    const res = await api.put(`/edit-nghi-phep/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật nghỉ phép ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Xóa nghỉ phép
export const deleteNghiPhep = async (id) => {
  try {
    const res = await api.delete(`/delete-nghi-phep/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa nghỉ phép ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
