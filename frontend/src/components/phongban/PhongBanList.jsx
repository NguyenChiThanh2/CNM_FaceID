import React from "react";
import { Card, Table, Button, Breadcrumb } from "react-bootstrap";

const PhongBanList = ({ list, onEdit, onDelete, onViewNhanVien }) => {
  return (


    <div className="table-responsive">
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Tên phòng ban</th>
            <th>Mô tả</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                Không có phòng ban nào.
              </td>
            </tr>
          ) : (
            list.map((phongBan, index) => (
              <tr key={phongBan.id}>
                <td>{index + 1}</td>
                <td>{phongBan.ten_phong_ban}</td>
                <td>{phongBan.mo_ta}</td>
                <td className="text-center">
                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(phongBan)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="me-2"
                    onClick={() => onDelete(phongBan.id)}
                  >
                    Xóa
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => onViewNhanVien(phongBan.id)}
                  >
                    Nhân viên
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default PhongBanList;
