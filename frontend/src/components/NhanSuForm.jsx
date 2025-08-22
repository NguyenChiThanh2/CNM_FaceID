import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NghiPhepForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    tu_ngay: '',
    den_ngay: '',
    ly_do: '',
    nhan_vien_id: '',
  });

  const [nhanViens, setNhanViens] = useState([]);

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
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 border rounded p-4 shadow-sm bg-light">
      <div className="mb-3">
        <label className="form-label">Nhân viên</label>
        <select
          className="form-select"
          name="nhan_vien_id"
          value={formData.nhan_vien_id}
          onChange={handleChange}
        >
          <option value="">-- Chọn nhân viên --</option>
          {nhanViens.map((nv) => (
            <option key={nv.id} value={nv.id}>
              {nv.ho_ten}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Từ ngày</label>
          <input
            type="date"
            className="form-control"
            name="tu_ngay"
            value={formData.tu_ngay}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Đến ngày</label>
          <input
            type="date"
            className="form-control"
            name="den_ngay"
            value={formData.den_ngay}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Lý do</label>
        <textarea
          className="form-control"
          name="ly_do"
          rows="3"
          value={formData.ly_do}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary me-2">
          Lưu
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Hủy
        </button>
      </div>
    </form>
  );
};

export default NghiPhepForm;
