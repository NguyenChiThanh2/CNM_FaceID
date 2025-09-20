import  axiosInstance  from "./axiosInstance";

export const loginApi = (username, password) => {
  return axiosInstance.post("/login", { username, password });
};
