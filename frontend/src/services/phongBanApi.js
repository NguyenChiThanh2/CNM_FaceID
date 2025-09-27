import axiosInstance from "./axiosInstance";

export const getAllPhongBan = () => axiosInstance.get("/get-all-phong-ban");
export const deletePhongBan = (id) => axiosInstance.delete(`/delete-phong-ban/${id}`);
export const createPhongBan = (data) => axiosInstance.post("/create-phong-ban", data);
export const updatePhongBan = (id, data) => axiosInstance.put(`/update-phong-ban/${id}`, data);
export const getPhongBanById = (id) => axiosInstance.get(`/get-phong-ban-by-id/${id}`);
