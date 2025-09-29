import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data).catch((e) => { throw e; });

// Lấy toàn bộ nhân viên (endpoint theo code hiện tại)
export const getAllNhanViens = () => unwrap(axiosInstance.get("/nhan_viens"));

// Lấy danh sách NV đã tham gia khóa
export const getAssignedNhanViens = (daoTaoId) =>
  unwrap(axiosInstance.get(`/dao_taos/${daoTaoId}/nhan_viens`));
export const assignNhanViensBulk = (daoTaoId, nhanVienIds) =>
  unwrap(axiosInstance.post(`/dao_taos/${daoTaoId}/assign`, {
    nhan_viens: nhanVienIds.map(id => ({ id }))
  }));
// Gán NV vào khóa (endpoint bạn đang dùng khác convention, giữ nguyên)
export const assignNhanVienToDaoTao = (daoTaoId, nhanVienId) =>
  unwrap(axiosInstance.post(`/dao_taos/${daoTaoId}/assign`, {
    nhan_viens: [{ id: nhanVienId }]
  }));


// Xóa NV khỏi khóa
export const removeNhanVienFromDaoTao = (daoTaoId, nhanVienId) =>
  unwrap(axiosInstance.delete(`/dao_taos/${daoTaoId}/nhan_viens/${nhanVienId}`));
