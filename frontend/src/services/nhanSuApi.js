import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

export const getAllNhanVien = () => unwrap(axiosInstance.get("/get-all-nhan-vien"));
export const deleteNhanVien = (id) => unwrap(axiosInstance.delete(`/delete-nhan-vien/${id}`));
export const getAllChucVu = () => unwrap(axiosInstance.get("/get-all-chuc-vu"));
export const getAllPhongBan = () => unwrap(axiosInstance.get("/get-all-phong-ban"));
// Nếu form cần axiosInstances
export const getNhanVienById = (id) => unwrap(axiosInstance.get(`/get-nhan-vien-by-id/${id}`));
export const createNhanVien = (formData) =>
    unwrap(
        axiosInstance.post("/add-nhan-vien", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
    );

// PUT multipart: sửa nhân viên
export const updateNhanVien = (id, formData) =>
    unwrap(
        axiosInstance.put(`/edit-nhan-vien/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
    );
