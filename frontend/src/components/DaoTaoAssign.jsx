import React, { useState, useEffect } from "react";
import {
  getAllNhanViens,
  getAssignedNhanViens,
  assignNhanVienToDaoTao,
  removeNhanVienFromDaoTao,
} from "../services/daoTaoAssign";

const DaoTaoAssign = ({ daoTaoId }) => {
  const [nhanViens, setNhanViens] = useState([]);
  const [selectedNhanVien, setSelectedNhanVien] = useState("");
  const [assignedNhanViens, setAssignedNhanViens] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const [allNV, assignedNV] = await Promise.all([
          getAllNhanViens(),
          getAssignedNhanViens(daoTaoId),
        ]);
        setNhanViens(Array.isArray(allNV) ? allNV : []);
        setAssignedNhanViens(Array.isArray(assignedNV) ? assignedNV : []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    };
    run();
  }, [daoTaoId]);

  const handleAssign = async () => {
    if (!selectedNhanVien) return;
    const nhanVienId = Number(selectedNhanVien);
    try {
      await assignNhanVienToDaoTao(daoTaoId, nhanVienId);

      const nv = nhanViens.find((n) => Number(n.id) === nhanVienId);
      if (nv && !assignedNhanViens.some((x) => Number(x.id) === nhanVienId)) {
        setAssignedNhanViens((prev) => [...prev, nv]); // optimistic update
      }
      setSelectedNhanVien("");
    } catch (error) {
      console.error("Lỗi khi gán nhân viên vào khóa đào tạo:", error);
    }
  };

  const handleRemove = async (nhanVienId) => {
    try {
      await removeNhanVienFromDaoTao(daoTaoId, nhanVienId);
      setAssignedNhanViens((prev) => prev.filter((nv) => Number(nv.id) !== Number(nhanVienId)));
    } catch (error) {
      console.error("Lỗi khi xóa nhân viên khỏi khóa đào tạo:", error);
    }
  };

  return (
    <div>
      <h3>Gán Nhân Viên vào Khóa Đào Tạo</h3>

      <div className="mb-3">
        <label className="form-label">Chọn Nhân Viên</label>
        <select
          className="form-select"
          value={selectedNhanVien}
          onChange={(e) => setSelectedNhanVien(e.target.value)}
        >
          <option value="">-- Chọn nhân viên --</option>
          {nhanViens.map((nv) => (
            <option key={nv.id} value={nv.id}>
              {nv.ho_ten}
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary" onClick={handleAssign}>
        Gán Nhân Viên
      </button>

      <h4 className="mt-4">Danh Sách Nhân Viên Tham Gia</h4>
      <ul className="list-group">
        {assignedNhanViens.map((nv) => (
          <li key={nv.id} className="list-group-item d-flex justify-content-between">
            {nv.ho_ten}
            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(nv.id)}>
              Xóa
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DaoTaoAssign;
