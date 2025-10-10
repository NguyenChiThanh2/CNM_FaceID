// src/services/api/hopDongLaoDongAPI.js
import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

/**
 * Lấy hợp đồng lao động đang hiệu lực (hoặc mới nhất) của 1 nhân viên
 * @param {number|string} nhanVienId
 * @returns {Promise<Object|null>}
 */
export const getHopDongByNhanVienId = (nhanVienId) =>
    unwrap(axiosInstance.get(`/hop-dong/by-nhan-vien/${nhanVienId}`));

/* (Tuỳ chọn) Nếu sau này bạn cần thêm CRUD cho hợp đồng:
export const getHopDongListByNhanVien = (nhanVienId) =>
  unwrap(axiosInstance.get(`/hop-dong/list-by-nhan-vien/${nhanVienId}`));

export const createHopDong = (payload) =>
  unwrap(axiosInstance.post(`/hop-dong`, payload));

export const updateHopDong = (id, payload) =>
  unwrap(axiosInstance.put(`/hop-dong/${id}`, payload));

export const deleteHopDong = (id) =>
  unwrap(axiosInstance.delete(`/hop-dong/${id}`));
*/
