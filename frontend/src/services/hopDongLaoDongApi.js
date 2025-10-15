// src/services/hopDongLaoDongAPI.js
import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

/** Lấy HĐ đang hiệu lực (hoặc mới nhất) của 1 nhân viên */
export const getHopDongByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/hop-dong/by-nhan-vien/${nhanVienId}`));
// ^ khớp BE: GET /hop-dong/by-nhan-vien/<nv_id>

/** Tạo HĐ cho nhân viên (payload phải có nhan_vien_id) */
export const createHopDongForNhanVien = (nhanVienId, payload) =>
  unwrap(axiosInstance.post(`/api/hop-dong`, { ...payload, nhan_vien_id: nhanVienId }));
// ^ khớp BE: POST /api/hop-dong

/** Cập nhật HĐ theo id */
export const updateHopDong = (id, payload) =>
  unwrap(axiosInstance.put(`/api/hop-dong/${id}`, payload));
// ^ khớp BE: PUT /api/hop-dong/<id>
/** Lấy nhiều HĐ mới nhất theo danh sách nhân viên */
export const getHopDongBatchByNhanVienIds = (ids) =>
  unwrap(axiosInstance.post(`/hop-dong/by-nhan-vien/batch`, { ids }));

/** (tuỳ chọn, nếu có route) */
// export const getHopDongListByNhanVien = (nhanVienId) =>
//   unwrap(axiosInstance.get(`/hop-dong/list-by-nhan-vien/${nhanVienId}`));

// export const deleteHopDong = (id) =>
//   unwrap(axiosInstance.delete(`/api/hop-dong/${id}`));
