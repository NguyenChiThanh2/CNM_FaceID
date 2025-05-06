import React, { useState, useMemo } from 'react';

const NghiPhepList = ({ NghiPhep = [], onDelete, onEdit }) => {
  const [filterStatus, setFilterStatus] = useState('');

  // Lọc danh sách theo trạng thái
  const filteredList = useMemo(() => {
    if (!filterStatus) return NghiPhep;
    return NghiPhep.filter(don => don.trang_thai === filterStatus);
  }, [NghiPhep, filterStatus]);

  if (!Array.isArray(NghiPhep)) {
    console.error('Dữ liệu không phải là mảng!');
    return <p>Lỗi: Dữ liệu không hợp lệ.</p>;
  }

  const formatDate = dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const getNhanVienName = id => `Mã NV ${id}`; // TODO: replace with real name lookup

  return (
    <div className="mt-3">
      <h4>Danh sách đơn nghỉ phép</h4>

      {/* Filter theo trạng thái */}
      <div className="mb-3 row">
        <label className="col-sm-2 col-form-label">Lọc trạng thái:</label>
        <div className="col-sm-4">
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}>
            <option value="">-- Tất cả --</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <p>Không có đơn phù hợp.</p>
      ) : (
        <table className="table table-bordered table-hover shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Nhân viên</th>
              <th>Loại nghỉ phép</th>
              <th>Từ ngày</th>
              <th>Đến ngày</th>
              <th>Tổng ngày nghỉ</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map(don => (
              <tr key={don.id}>
                <td>{getNhanVienName(don.nhan_vien_id)}</td>
                <td>{don.loai_nghi_phep?.ten || `ID ${don.loai_nghi_phep_id}`}</td>
                <td>{formatDate(don.tu_ngay)}</td>
                <td>{formatDate(don.den_ngay)}</td>
                <td>{don.so_ngay_nghi}</td>
                <td>{don.ly_do}</td>
                <td>
                  <span
                    className={`badge ${
                      don.trang_thai === 'Chờ duyệt'
                        ? 'bg-warning text-dark'
                        : don.trang_thai === 'Đã duyệt'
                        ? 'bg-success'
                        : 'bg-danger'
                    }`}
                  >
                    {don.trang_thai}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => onEdit && onEdit(don)}
                  >
                    Sửa
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete && onDelete(don.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NghiPhepList;
