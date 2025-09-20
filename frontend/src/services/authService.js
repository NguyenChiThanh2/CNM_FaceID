import axiosInstance from "./axiosInstance";


export const loginApi = async (username, password) => {
    return axiosInstance.post(`${API_BASE}/login`, { username, password });
};
