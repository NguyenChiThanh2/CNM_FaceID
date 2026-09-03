// src/services/loaiNghiPhepApi.js
import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data);

export const getAllLoaiNghiPhep = () => unwrap(axiosInstance.get("/loai-nghi-phep"));

export const getLoaiNghiPhepById = (id) =>
  unwrap(axiosInstance.get(`/loai-nghi-phep/${id}`));

export const createLoaiNghiPhep = (payload) =>
  unwrap(axiosInstance.post("/loai-nghi-phep", payload));

export const updateLoaiNghiPhep = (id, payload) =>
  unwrap(axiosInstance.put(`/loai-nghi-phep/${id}`, payload));

export const deleteLoaiNghiPhep = (id) =>
  unwrap(axiosInstance.delete(`/loai-nghi-phep/${id}`));
