import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000';

// Lấy tất cả người dùng
export const getUserList = async () => {
  try {
    const response = await axios.get(`${API_URL}/get-all-users`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error);
    throw error;
  }
};

// Lấy người dùng theo ID
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/get-user-by-id/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    throw error;
  }
};

// Tạo người dùng mới
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/add-user`, userData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error);
    throw error;
  }
};

// Cập nhật người dùng
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/edit-user/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error);
    throw error;
  }
};

// Xoá người dùng
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/delete-user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xoá người dùng:', error);
    throw error;
  }
};
