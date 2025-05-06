// src/api/phuc-loi-api.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Đặt URL cơ sở của API
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả phúc lợi
export const getAllPhucLoi = async () => {
  try {
    const response = await api.get("/get-all-phuc-loi");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách phúc lợi:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

export const getPhucLoiByNhanVienId = async (nhanVienId) => {
  try {
    const response = await api.get(`/get-phuc-loi-by-nhan-vien-id/${nhanVienId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phúc lợi của nhân viên ID ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
// 2. Lấy phúc lợi theo ID
export const getPhucLoiById = async (id) => {
  try {
    const response = await api.get(`/get-phuc-loi-by-id/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy phúc lợi theo tên
export const getPhucLoiByName = async (name) => {
  try {
    const response = await api.get(`/get-phuc-loi-by-name/${name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phúc lợi theo tên ${name}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Tạo mới phúc lợi
export const createPhucLoi = async (data) => {
  try {
    const response = await api.post("/add-phuc-loi", data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo phúc lợi:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Cập nhật phúc lợi
export const updatePhucLoi = async (id, data) => {
  try {
    const response = await api.put(`/edit-phuc-loi/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Xóa phúc lợi
export const deletePhucLoi = async (id) => {
  try {
    const response = await api.delete(`/delete-phuc-loi/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
