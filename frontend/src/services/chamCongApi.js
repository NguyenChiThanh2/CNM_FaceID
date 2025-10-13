// src/services/chamCongApi.js
import axiosInstance from "./axiosInstance";

// helper unwrap để mọi hàm trả thẳng data
const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

// Tìm kiếm nhân viên theo tên
export const searchNhanVienByName = (q) =>
  unwrap(axiosInstance.get("/search_nhanvien_theoten", { params: { q } }));

// Lấy toàn bộ chấm công
export const getAllChamCong = () => unwrap(axiosInstance.get("/get-all-cham-cong"));

// Xóa chấm công
export const deleteChamCong = (id) => unwrap(axiosInstance.delete(`/delete-cham-cong/${id}`));

// Lấy danh sách nhân viên (nếu bạn đã có trong nhanSuApi thì có thể dùng lại)
export const getAllNhanVien = () => unwrap(axiosInstance.get("/get-all-nhan-vien"));
