// src/api/nhanVienPhucLoiApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả nhân viên phúc lợi
export const getAllNhanVienPhucLoi = async () => {
  try {
    const res = await api.get("/get-all-nhan-vien-phuc-loi");
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách nhân viên phúc lợi:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy nhân viên phúc lợi theo ID
export const getNhanVienPhucLoiById = async (id) => {
  try {
    const res = await api.get(`/get-nhan-vien-phuc-loi-by-id/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nhân viên phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy phúc lợi của nhân viên theo nhân viên ID
export const getPhucLoiByNhanVienId = async (nhanVienId) => {
  try {
    const res = await api.get(`/get-phuc-loi-by-nhan-vien-id/nhan_vien/${nhanVienId}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phúc lợi nhân viên ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Lấy nhân viên theo phúc lợi ID
export const getNhanVienByPhucLoiId = async (phucLoiId) => {
  try {
    const res = await api.get(`/get-nhan-vien-by-phuc-loi-id/phuc-loi/${phucLoiId}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nhân viên theo phúc lợi ID ${phucLoiId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Tạo mới nhân viên phúc lợi
export const createNhanVienPhucLoi = async (data) => {
  try {
    const res = await api.post("/add-nhan-vien-phuc-loi", data);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhân viên phúc lợi:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Cập nhật nhân viên phúc lợi
export const updateNhanVienPhucLoi = async (id, data) => {
  try {
    const res = await api.put(`/edit-nhan-vien-phuc-loi/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật nhân viên phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 7. Xóa nhân viên phúc lợi
export const deleteNhanVienPhucLoi = async (id) => {
  try {
    const res = await api.delete(`/delete-nhan-vien-phuc-loi/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa nhân viên phúc lợi ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
