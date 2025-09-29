import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then(r => r.data).catch(e => { throw e; });

// Khoá đào tạo
export const getAllDaoTao = () => unwrap(axiosInstance.get("/get-all-dao-tao"));
export const getDaoTaoById = (id) => unwrap(axiosInstance.get(`/get-dao-tao-by-id/${id}`));

// Chốt endpoint theo BE của bạn (nếu đang là /add-/edit-/delete- thì đổi lại cho khớp)
export const deleteDaoTao = (id) => unwrap(axiosInstance.delete(`/delete-dao-tao/${id}`));
export const createDaoTao = (payload) => unwrap(axiosInstance.post("/add-dao-tao", payload));   // đổi endpoint nếu BE khác
export const updateDaoTao = (id, payload) => unwrap(axiosInstance.put(`/edit-dao-tao/${id}`, payload));

// Gán nhân viên (theo endpoint bạn đang dùng trong code hiện tại)
export const assignNhanVienToDaoTao = (daoTaoId, nhanVienId) =>
  unwrap(axiosInstance.post(`/dao_taos/${daoTaoId}/assign`, {
    nhan_viens: [{ id: nhanVienId }]
  }));
export const assignNhanViensBulk = (daoTaoId, nhanVienIds) =>
  unwrap(axiosInstance.post(`/dao_taos/${daoTaoId}/assign`, {
    nhan_viens: nhanVienIds.map(id => ({ id }))
  }));
// Nhân viên trong khoá đào tạo
export const getNhanVienByDaoTaoId = (daoTaoId) =>
  unwrap(axiosInstance.get(`/get-all-nhan-vien-by-dao-tao-id/${daoTaoId}`));

export const addNhanVienToDaoTao = (daoTaoId, nhanVienIds) =>
  unwrap(axiosInstance.post("/add-nhan-vien-to-dao-tao", {
    dao_tao_id: daoTaoId,
    nhan_vien_ids: nhanVienIds,
  }));

export const removeNhanVienFromDaoTao = (daoTaoId, nhanVienId) =>
  unwrap(axiosInstance.post("/remove-nhan-vien-from-dao-tao", {
    dao_tao_id: daoTaoId,
    nhan_vien_id: nhanVienId,
  }));

// (nếu cần) lấy toàn bộ nhân viên để chọn
export const getAllNhanVien = () => unwrap(axiosInstance.get("/get-all-nhan-vien"));
