import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then(r => r.data);

export const getAllPhongBan = () => unwrap(axiosInstance.get("/get-all-phong-ban"));
export const deletePhongBan = (id) => unwrap(axiosInstance.delete(`/delete-phong-ban/${id}`));
export const createPhongBan = (data) => unwrap(axiosInstance.post("/create-phong-ban", data));
export const updatePhongBan = (id, data) => unwrap(axiosInstance.put(`/update-phong-ban/${id}`, data));
export const getPhongBanById = (id) => unwrap(axiosInstance.get(`/get-phong-ban-by-id/${id}`));
