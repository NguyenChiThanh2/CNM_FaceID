import React, { useState } from 'react';
import chamCongService from '../../services/api/cham-cong-api';

const ChamCongForm = () => {
  const [nhanVienId, setNhanVienId] = useState('');
  const [thoiGianVao, setThoiGianVao] = useState('');
  const [thoiGianRa, setThoiGianRa] = useState('');
  const [ngay, setNgay] = useState('');
  const [hinhAnh, setHinhAnh] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const chamCongData = {
      nhan_vien_id: nhanVienId,
      thoi_gian_vao: thoiGianVao,
      thoi_gian_ra: thoiGianRa,
      ngay: ngay,
      hinh_anh: hinhAnh
    };

    try {
      const response = await chamCongService.createChamCong(chamCongData);
      console.log('Chấm công tạo thành công:', response.data);
    } catch (error) {
      console.error('Error creating cham cong:', error);
    }
  };

  return (
    <div>
      <h3>Tạo mới chấm công</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nhân viên ID</label>
          <input
            type="text"
            className="form-control"
            value={nhanVienId}
            onChange={(e) => setNhanVienId(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Thời gian vào</label>
          <input
            type="datetime-local"
            className="form-control"
            value={thoiGianVao}
            onChange={(e) => setThoiGianVao(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Thời gian ra</label>
          <input
            type="datetime-local"
            className="form-control"
            value={thoiGianRa}
            onChange={(e) => setThoiGianRa(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Ngày</label>
          <input
            type="date"
            className="form-control"
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Hình ảnh (nếu có)</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setHinhAnh(e.target.files[0])}
          />
        </div>
        <button type="submit" className="btn btn-primary">Tạo mới</button>
      </form>
    </div>
  );
};

export default ChamCongForm;
