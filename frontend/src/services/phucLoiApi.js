import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => {
  throw e?.response?.data || { message: "Lỗi không xác định" };
});

export const getAllPhucLoi = () => unwrap(axiosInstance.get("/get-all-phuc-loi"));
export const getPhucLoiById = (id) => unwrap(axiosInstance.get(`/get-phuc-loi-by-id/${id}`));
export const getPhucLoiByNhanVienId = (nhanVienId) =>
  unwrap(axiosInstance.get(`/get-phuc-loi-by-nhan-vien-id/${nhanVienId}`));

// CHỐT endpoint đúng với BE thực tế:
export const createPhucLoi = (payload) => unwrap(axiosInstance.post("/create-phuc-loi", payload));
export const updatePhucLoi = (id, payload) => unwrap(axiosInstance.put(`/update-phuc-loi/${id}`, payload));
export const deletePhucLoi = (id) => unwrap(axiosInstance.delete(`/delete-phuc-loi/${id}`));
