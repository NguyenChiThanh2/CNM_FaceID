import React from "react";

const PhucLoiList = ({ list, setSelectedPhucLoi }) => {
  return (
    <div>
      <h4>Danh sách Phúc lợi</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Loại</th>
            <th>Giá trị</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {list.map((pl) => (
            <tr key={pl.id}>
              <td>{pl.ten_phuc_loi}</td>
              <td>{pl.loai}</td>
              <td>{pl.gia_tri}</td>
              <td>{pl.mo_ta}</td>
              <td>
                <button className="btn btn-sm btn-warning" onClick={() => setSelectedPhucLoi(pl)}>
                  Sửa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PhucLoiList;
