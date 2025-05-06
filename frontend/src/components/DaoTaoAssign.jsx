// src/components/DaoTaoAssign.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DaoTaoAssign = ({ daoTaoId }) => {
  const [nhanViens, setNhanViens] = useState([]);
  const [selectedNhanVien, setSelectedNhanVien] = useState('');
  const [assignedNhanViens, setAssignedNhanViens] = useState([]);

  useEffect(() => {
    const fetchNhanViens = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/nhan_viens');
        setNhanViens(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error);
      }
    };
    fetchNhanViens();

    const fetchAssignedNhanViens = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/dao_taos/${daoTaoId}/nhan_viens`);
        setAssignedNhanViens(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên tham gia khóa đào tạo:', error);
      }
    };
    fetchAssignedNhanViens();
  }, [daoTaoId]);

  const handleAssign = async () => {
    if (!selectedNhanVien) return;

    try {
      await axios.post(`http://127.0.0.1:5000/api/get-dao-tao-by-id/${daoTaoId}/assign`, {
        nhan_vien_id: selectedNhanVien
      });
      setAssignedNhanViens([...assignedNhanViens, nhanViens.find(nv => nv.id === selectedNhanVien)]);
      setSelectedNhanVien('');
    } catch (error) {
      console.error('Lỗi khi gán nhân viên vào khóa đào tạo:', error);
    }
  };

  const handleRemove = async (nhanVienId) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/dao_taos/${daoTaoId}/nhan_viens/${nhanVienId}`);
      setAssignedNhanViens(assignedNhanViens.filter(nv => nv.id !== nhanVienId));
    } catch (error) {
      console.error('Lỗi khi xóa nhân viên khỏi khóa đào tạo:', error);
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
          {nhanViens.map(nv => (
            <option key={nv.id} value={nv.id}>
              {nv.ho_ten}
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-primary" onClick={handleAssign}>Gán Nhân Viên</button>

      <h4 className="mt-4">Danh Sách Nhân Viên Tham Gia</h4>
      <ul className="list-group">
        {assignedNhanViens.map(nv => (
          <li key={nv.id} className="list-group-item d-flex justify-content-between">
            {nv.ho_ten}
            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(nv.id)}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DaoTaoAssign;
