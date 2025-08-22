import React, { useState, useEffect } from 'react';
import chamCongService from '../../services/api/cham-cong-api';
const ChamCongList = () => {
  const [chamCongList, setChamCongList] = useState([]);

  useEffect(() => {
    const fetchChamCongList = async () => {
      try {
        const response = await chamCongService.getAllChamCong();
        setChamCongList(response.data);
      } catch (error) {
        console.error('Error fetching cham cong list:', error);
      }
    };
    
    fetchChamCongList();
  }, []);

  return (
    <div>
      <h3>Danh sách chấm công</h3>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nhân viên</th>
            <th>Thời gian vào</th>
            <th>Thời gian ra</th>
            <th>Ngày</th>
          </tr>
        </thead>
        <tbody>
          {chamCongList.map((chamCong) => (
            <tr key={chamCong.id}>
              <td>{chamCong.id}</td>
              <td>{chamCong.nhan_vien_id}</td>
              <td>{chamCong.thoi_gian_vao}</td>
              <td>{chamCong.thoi_gian_ra}</td>
              <td>{chamCong.ngay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChamCongList;
