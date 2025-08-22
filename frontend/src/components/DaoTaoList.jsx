import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DaoTaoList = () => {
  const [daoTaoList, setDaoTaoList] = useState([]);
  const [loading, setLoading] = useState(true); // State để quản lý trạng thái loading
  const [error, setError] = useState(null); // State để quản lý lỗi

  useEffect(() => {
    const fetchDaoTaoList = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/dao_taos');
        setDaoTaoList(response.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách khóa đào tạo:', error);
        setError('Không thể tải danh sách khóa đào tạo.');
      } finally {
        setLoading(false); // Khi tải xong hoặc có lỗi, đổi trạng thái loading
      }
    };
    fetchDaoTaoList();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/dao_taos/${id}`);
      // Cập nhật lại danh sách mà không cần gọi lại API
      setDaoTaoList(daoTaoList.filter(daoTao => daoTao.id !== id));
    } catch (error) {
      console.error('Lỗi khi xóa khóa đào tạo:', error);
      alert('Xóa khóa đào tạo không thành công.');
    }
  };

  if (loading) {
    return <div>Đang tải danh sách khóa đào tạo...</div>; // Hiển thị loading khi đang tải
  }

  return (
    <div>
      <h3>Danh sách Khóa Đào Tạo</h3>
      {error && <div className="alert alert-danger">{error}</div>} {/* Hiển thị lỗi nếu có */}
      <Link to="/dao_taos/create" className="btn btn-primary mb-3">Tạo Khóa Đào Tạo Mới</Link>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tên Khóa Đào Tạo</th>
            <th>Ngày Bắt Đầu</th>
            <th>Ngày Kết Thúc</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {daoTaoList.length > 0 ? (
            daoTaoList.map(daoTao => (
              <tr key={daoTao.id}>
                <td>{daoTao.id}</td>
                <td>{daoTao.khoa_dao_tao}</td>
                <td>{daoTao.ngay_bat_dau}</td>
                <td>{daoTao.ngay_ket_thuc}</td>
                <td>
                  <Link to={`/dao_taos/edit/${daoTao.id}`} className="btn btn-warning btn-sm">Sửa</Link>
                  <button onClick={() => handleDelete(daoTao.id)} className="btn btn-danger btn-sm ms-2">Xóa</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">Không có khóa đào tạo nào.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DaoTaoList;
