// src/api/phong-ban-api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Lấy tất cả phòng ban
export const getAllPhongBan = async () => {
  try {
    const res = await api.get('/get-all-phong-ban');
    return res.data;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách phòng ban:', error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};

// 2. Lấy phòng ban theo tên
export const getPhongBanByName = async (tenPhongBan) => {
  try {
    const res = await api.get(`/get-phong-ban-by-name/${tenPhongBan}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phòng ban với tên ${tenPhongBan}:`, error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};

// 3. Lấy phòng ban theo ID
export const getPhongBanById = async (id) => {
  try {
    const res = await api.get(`/get-phong-ban-by-id/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi lấy phòng ban ID ${id}:`, error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};

// 4. Tạo mới phòng ban
export const createPhongBan = async (data) => {
  try {
    const res = await api.post('/add-phong-ban', data);
    return res.data;
  } catch (error) {
    console.error('❌ Lỗi khi tạo phòng ban:', error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};

// 5. Cập nhật phòng ban
export const updatePhongBan = async (id, data) => {
  try {
    const res = await api.put(`/edit-phong-ban/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật phòng ban ID ${id}:`, error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};

// 6. Xóa phòng ban
export const deletePhongBan = async (id) => {
  try {
    const res = await api.delete(`/delete-phong-ban/${id}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi khi xóa phòng ban ID ${id}:`, error);
    throw error.response?.data || { message: 'Lỗi không xác định' };
  }
};
