// src/components/thuong/ThuongTable.jsx
import React from "react";
import { Table, Button } from "react-bootstrap";

// Hàm định dạng tiền
const formatCurrency = (amount) =>
  amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const ThuongTable = ({
  items,
  currentPage,
  totalPages,
  handlePageChange,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      {items.length === 0 ? (
        <div className="text-center py-3">Không có dữ liệu phù hợp</div>
      ) : (
        <Table striped bordered hover responsive className="align-middle">
          <thead className="table-dark text-center">
            <tr>
              <th>Tên</th>
              <th>Loại</th>
              <th>Giá trị</th>
              <th>Ngày quyết định</th>
              <th>Ghi chú</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.ten_thuong}</td>
                <td>{t.loai_thuong}</td>
                <td>{formatCurrency(t.so_tien)}</td>
                <td>{t.ngay_quyet_dinh}</td>
                <td>{t.ghi_chu}</td>
                <td className="text-center">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(t)}
                  >
                    ✏️ Sửa
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(t.id)}
                  >
                    🗑️ Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
          <Button
            variant="outline-secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Trước
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              variant={i + 1 === currentPage ? "primary" : "outline-primary"}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline-secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau →
          </Button>
        </div>
      )}
    </>
  );
};

export default ThuongTable;
