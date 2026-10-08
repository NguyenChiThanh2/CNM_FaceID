import axiosInstance from "./axiosInstance";

// axiosInstance đã tự chuẩn hoá lỗi thành {message, status, raw, data} (xem
// normalizeError trong axiosInstance.js) — ném lại NGUYÊN error đã chuẩn hoá
// (giống mọi service khác, vd chamCongApi.js/nhanSuApi.js), không tự bóc lại
// e.data — nơi gọi luôn nhận đúng {message, status, data, raw}.
const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

export const getAllPhucLoi = () => unwrap(axiosInstance.get("/get-all-phuc-loi"));
export const getPhucLoiById = (id) => unwrap(axiosInstance.get(`/get-phuc-loi-by-id/${id}`));
export const getPhucLoiByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/get-phuc-loi-by-nhan-vien-id/${nhanVienId}`));
export const deletePhucLoi = (id) => unwrap(axiosInstance.delete(`/delete-phuc-loi/${id}`));
