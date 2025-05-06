// src/api/daoTaoApi.js
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Lấy tất cả khóa đào tạo
export const getAllDaoTao = async () => {
  try {
    const response = await api.get("/dao-tao");
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách đào tạo:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 2. Lấy khóa đào tạo theo ID
export const getDaoTaoById = async (id) => {
  try {
    const response = await api.get(`/dao-tao/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy khóa đào tạo ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 3. Lấy danh sách đào tạo theo nhân viên
export const getDaoTaoByNhanVienId = async (nhanVienId) => {
  try {
    const response = await api.get(`/dao-tao/nhan-vien/${nhanVienId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy khóa đào tạo của nhân viên ${nhanVienId}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 4. Tạo khóa đào tạo mới
export const createDaoTao = async (data) => {
  try {
    const response = await api.post("/dao-tao", data);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo khóa đào tạo:", error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 5. Cập nhật khóa đào tạo
export const updateDaoTao = async (id, data) => {
  try {
    const response = await api.put(`/dao-tao/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật đào tạo ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 6. Xóa khóa đào tạo
export const deleteDaoTao = async (id) => {
  try {
    const response = await api.delete(`/dao-tao/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa đào tạo ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 7. Gán nhân viên vào khóa đào tạo
export const assignNhanViensToDaoTao = async (id, nhanViens) => {
  try {
    const response = await api.post(`/dao-tao/${id}/gan-nhan-vien`, { nhan_viens: nhanViens });
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi gán nhân viên vào khóa đào tạo ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

// 8. Lấy danh sách nhân viên trong một khóa đào tạo
export const getNhanViensInDaoTao = async (id) => {
  try {
    const response = await api.get(`/dao-tao/${id}/nhan-vien`);
    return response.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy nhân viên của khóa đào tạo ID ${id}:`, error);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};
