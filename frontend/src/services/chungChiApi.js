import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

// 📄 Lấy danh sách chứng chỉ của 1 nhân viên
export const getChungChiByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/nhan_vien/${nhanVienId}/chung_chi`));

// ➕ Thêm mới chứng chỉ (FormData)
export const createChungChi = (nhanVienId, formData) =>
  unwrap(axiosInstance.post(`/nhan_vien/${nhanVienId}/chung_chi`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }));

// ❌ Xóa chứng chỉ theo ID
export const deleteChungChi = (chungChiId) =>
  unwrap(axiosInstance.delete(`/chung_chi/${chungChiId}`));
