import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

export const getAllUsers = () => unwrap(axiosInstance.get("/get-all-users"));
export const getUserById = (id) => unwrap(axiosInstance.get(`/get-user-by-id/${id}`));

// Chốt endpoint đúng với BE của bạn:
export const createUser = (payload) => unwrap(axiosInstance.post("/create-user", payload));
export const updateUser = (id, payload) => unwrap(axiosInstance.put(`/update-user/${id}`, payload));
export const deleteUser = (id) => unwrap(axiosInstance.delete(`/delete-user/${id}`));
