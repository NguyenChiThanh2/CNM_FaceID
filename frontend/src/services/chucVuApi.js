// src/api/chucVuApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Lấy tất cả chức vụ
export const getAllChucVu = async () => {
  try {
    const response = await api.get("/get-all-chuc-vu");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách chức vụ:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// Lấy chức vụ theo ID
export const getChucVuById = async (id) => {
  try {
    const response = await api.get(`/get-chuc-vu-by-id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy chức vụ ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// Tạo mới chức vụ
export const createChucVu = async (data) => {
  try {
    const response = await api.post("/add-chuc-vu", data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo chức vụ:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// Cập nhật chức vụ theo ID
export const updateChucVu = async (id, data) => {
  try {
    const response = await api.put(`/edit-chuc-vu/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật chức vụ ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// Xóa chức vụ theo ID
export const deleteChucVu = async (id) => {
  try {
    const response = await api.delete(`/delete-chuc-vu/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa chức vụ ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
