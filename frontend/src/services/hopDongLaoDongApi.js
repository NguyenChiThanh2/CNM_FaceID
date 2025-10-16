// src/services/hopDongLaoDongApi.js
import axiosInstance from "./axiosInstance";

const unwrap = async (p) => {
  try {
    const r = await p;
    return r.data;
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Request error";
    e.userMessage = msg;
    throw e;
  }
};

const toYMD = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

export const buildDuration = ({ years = 0, months = 0, days = 0 } = {}) => {
  const parts = [];
  if (years) parts.push(`${years} năm`);
  if (months) parts.push(`${months} tháng`);
  if (days) parts.push(`${days} ngày`);
  return parts.length ? parts.join(" ") : "0 ngày";
};

/** Lấy HĐ đang hiệu lực (hoặc mới nhất) của 1 nhân viên */
export const getHopDongByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/hop-dong/by-nhan-vien/${nhanVienId}`));

/** Lấy danh sách HĐ của 1 nhân viên (để vẽ lịch sử lương) */
export const getHopDongListByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/hop-dong/nhan-vien/${nhanVienId}`));

/** Tạo HĐ cho nhân viên (BE tự tính ngày kết thúc nếu có) */
export const createHopDongForNhanVien = (nhanVienId, payload = {}) => {
  const body = {
    ...payload,
    nhan_vien_id: nhanVienId,
    ngay_bat_dau: toYMD(payload.ngay_bat_dau),
  };
  delete body.ngay_ket_thuc;
  return unwrap(axiosInstance.post(`/hop-dong`, body));
};

/** Cập nhật HĐ theo id (BE tự tính lại ngày kết thúc nếu cần) */
export const updateHopDong = (id, payload = {}) => {
  const body = { ...payload };
  if ("ngay_bat_dau" in body) body.ngay_bat_dau = toYMD(body.ngay_bat_dau);
  if ("ngay_ket_thuc" in body) delete body.ngay_ket_thuc;
  return unwrap(axiosInstance.put(`/hop-dong/${id}`, body));
};

/** Lấy nhiều HĐ theo danh sách NV (nếu có dùng) */
export const getHopDongBatchByNhanVienIds = (ids) =>
  unwrap(axiosInstance.post(`/hop-dong/by-nhan-vien/batch`, { ids }));

/** (Tuỳ chọn) Xoá HĐ */
export const deleteHopDong = (id) =>
  unwrap(axiosInstance.delete(`/hop-dong/${id}`));
