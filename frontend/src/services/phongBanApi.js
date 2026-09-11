import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then(r => r.data);

export const getAllPhongBan = () => unwrap(axiosInstance.get("/get-all-phong-ban"));
export const deletePhongBan = (id) => unwrap(axiosInstance.delete(`/delete-phong-ban/${id}`));
export const getPhongBanById = (id) => unwrap(axiosInstance.get(`/get-phong-ban-by-id/${id}`));
