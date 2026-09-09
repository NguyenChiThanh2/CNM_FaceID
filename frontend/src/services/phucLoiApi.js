import axiosInstance from "./axiosInstance";

// axiosInstance đã tự chuẩn hoá lỗi thành {message, status, raw, data} (xem
// normalizeError trong axiosInstance.js) — e.response không còn tồn tại,
// payload gốc từ BE nằm ở e.data.
const unwrap = (p) => p.then((r) => r.data).catch((e) => {
  throw e?.data || { message: e?.message || "Lỗi không xác định" };
});

export const getAllPhucLoi = () => unwrap(axiosInstance.get("/get-all-phuc-loi"));
export const getPhucLoiById = (id) => unwrap(axiosInstance.get(`/get-phuc-loi-by-id/${id}`));
export const getPhucLoiByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/get-phuc-loi-by-nhan-vien-id/${nhanVienId}`));

// CHỐT endpoint đúng với BE thực tế:
export const createPhucLoi = (payload) => unwrap(axiosInstance.post("/create-phuc-loi", payload));
export const updatePhucLoi = (id, payload) => unwrap(axiosInstance.put(`/update-phuc-loi/${id}`, payload));
export const deletePhucLoi = (id) => unwrap(axiosInstance.delete(`/delete-phuc-loi/${id}`));
