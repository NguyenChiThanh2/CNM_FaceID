import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import { FaEdit, FaTrash, FaUsers, FaBuilding, FaInfoCircle } from "react-icons/fa";

const PhongBanList = ({ list, onEdit, onDelete, onViewNhanVien, showActions = true }) => {
  return (
    <div className="table-responsive">
      <Table bordered hover className="mb-0">
        <thead
          style={{ 
            background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
            color: "white"
          }}
        >
          <tr>
            <th style={{ padding: "12px", fontWeight: "600", width: "80px" }}>#</th>
            <th style={{ padding: "12px", fontWeight: "600" }}>Tên phòng ban</th>
            <th style={{ padding: "12px", fontWeight: "600" }}>Mô tả</th>
            <th style={{ padding: "12px", fontWeight: "600", width: "200px", textAlign: "center" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                <FaBuilding className="fs-1 mb-2 opacity-50" />
                <div>Không có phòng ban nào</div>
              </td>
            </tr>
          ) : (
            list.map((phongBan, index) => (
              <tr key={phongBan.id} style={{ transition: "all 0.3s ease" }}>
                <td style={{ padding: "12px", fontWeight: "500", textAlign: "center" }}>
                  <Badge bg="light" text="dark" className="fs-6">
                    {index + 1}
                  </Badge>
                </td>
                <td style={{ padding: "12px", fontWeight: "500" }}>
                  <div className="d-flex align-items-center">
                    <FaBuilding className="text-primary me-2" />
                    {phongBan.ten_phong_ban}
                  </div>
                  {phongBan.so_luong_nhan_vien !== undefined && (
                    <small className="text-muted d-block mt-1">
                      <FaUsers className="me-1" />
                      {phongBan.so_luong_nhan_vien} nhân viên
                    </small>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <div className="d-flex align-items-start">
                    <FaInfoCircle className="text-secondary me-2 mt-1 flex-shrink-0" />
                    <span className={phongBan.mo_ta ? "" : "text-muted"}>
                      {phongBan.mo_ta || "Chưa có mô tả"}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <div className="d-flex gap-1 justify-content-center flex-wrap">
                    {/* Ẩn nút Sửa / Xóa nếu không có quyền */}
                    {showActions && (
                      <>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => onEdit?.(phongBan)}
                          title="Sửa phòng ban"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDelete?.(phongBan.id)}
                          title="Xóa phòng ban"
                        >
                          <FaTrash />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => onViewNhanVien?.(phongBan.id)}
                      title="Xem nhân viên"
                    >
                      <FaUsers />
                    </Button>
                  </div>
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