import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

export const getAllNhanVien = () => unwrap(axiosInstance.get("/get-all-nhan-vien"));
export const deleteNhanVien = (id) => unwrap(axiosInstance.delete(`/delete-nhan-vien/${id}`));

// Nếu form cần axiosInstances
export const getNhanVienById = (id) => unwrap(axiosInstance.get(`/get-nhan-vien-by-id/${id}`));
export const createNhanVien = (payload) => unwrap(axiosInstance.post("/add-nhan-vien", payload));
export const updateNhanVien = (id, payload) => unwrap(axiosInstance.put(`/edit-nhan-vien/${id}`, payload));
