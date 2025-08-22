import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Thay đổi theo URL thực tế

// Lấy tất cả chấm công
const getAllChamCong = () => {
  return axios.get(`${API_URL}/get-all-cham-cong`);
};

// Lấy chấm công theo ID
const getChamCongById = (id) => {
  return axios.get(`${API_URL}/get-cham-cong-by-id/${id}`);
};

// Lấy tất cả chấm công của một nhân viên
const getChamCongByNhanVienId = (nhan_vien_id) => {
  return axios.get(`${API_URL}/get-all-cham-cong-of-nhan-vien/${nhan_vien_id}`);
};

// Tạo chấm công mới
const createChamCong = (data) => {
  return axios.post(`${API_URL}/add-cham-cong`, data);
};

// Cập nhật chấm công theo ID
const updateChamCong = (id, data) => {
  return axios.put(`${API_URL}/edit-cham-cong/${id}`, data);
};

// Xóa chấm công theo ID
const deleteChamCong = (id) => {
  return axios.delete(`${API_URL}/delete-cham-cong/${id}`);
};

// Nhận diện khuôn mặt và tạo chấm công
const recognizeFaceAndAutoChamCong = (image) => {
  return axios.post(`${API_URL}/cham-cong-khuon-mat`, { image });
};

export default {
  getAllChamCong,
  getChamCongById,
  getChamCongByNhanVienId,
  createChamCong,
  updateChamCong,
  deleteChamCong,
  recognizeFaceAndAutoChamCong
};
