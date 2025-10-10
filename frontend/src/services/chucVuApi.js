// src/services/chucVuApi.js
import axiosInstance from "./axiosInstance";

// Trả thẳng data, nếu lỗi sẽ ném ra normalizeError đã qua interceptor
const unwrap = (p) => p.then((r) => r.data);

// Lấy tất cả chức vụ (hỗ trợ query/pagination nếu BE có)
export const getAllChucVu = (params) =>
  unwrap(axiosInstance.get("/get-all-chuc-vu", { params }));

// Lấy chức vụ theo ID
export const getChucVuById = (id) =>
  unwrap(axiosInstance.get(`/get-chuc-vu-by-id/${id}`));

// Tạo mới chức vụ
export const createChucVu = (payload) =>
  unwrap(axiosInstance.post("/add-chuc-vu", payload));

// Cập nhật chức vụ theo ID
export const updateChucVu = (id, payload) =>
  unwrap(axiosInstance.put(`/edit-chuc-vu/${id}`, payload));

// Xóa chức vụ theo ID
export const deleteChucVu = (id) =>
  unwrap(axiosInstance.delete(`/delete-chuc-vu/${id}`));
