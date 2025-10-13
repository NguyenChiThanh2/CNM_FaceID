import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Row, Col, Button, Table, Modal, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PhucLoiForm from "../../components/phucloi/PhucLoiForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import { getAllPhucLoi, deletePhucLoi as apiDeletePhucLoi } from "../../services/phucLoiApi";

const ITEMS_PER_PAGE = 5;

const QuanLyPhucLoi = () => {
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [selectedPhucLoi, setSelectedPhucLoi] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchPhucLoiList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPhucLoi();
      setPhucLoiList(data || []);
    } catch (err) {
      console.error("Lỗi khi tải phúc lợi:", err);
      toast.error(err?.message || "Không thể tải danh sách phúc lợi!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhucLoiList();
  }, [fetchPhucLoiList]);

  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  // Tối ưu lọc bằng useMemo (tránh tính lại mỗi render)
  const filteredList = useMemo(() => {
    if (!normalizedKeyword) return phucLoiList;
    return phucLoiList.filter((pl) => {
      const ten = (pl.ten_phuc_loi || "").toLowerCase();
      const moTa = (pl.mo_ta || "").toLowerCase();
      return ten.includes(normalizedKeyword) || moTa.includes(normalizedKeyword);
    });
  }, [phucLoiList, normalizedKeyword]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE)),
    [filteredList.length]
  );

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAdd = () => {
    setSelectedPhucLoi(null);
    setShowModal(true);
  };

  const handleEdit = (pl) => {
    setSelectedPhucLoi(pl);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      try {
        await toast.promise(apiDeletePhucLoi(id), {
          pending: "Đang xóa phúc lợi...",
          success: "Xóa phúc lợi thành công!",
          error: "❌ Lỗi khi xóa phúc lợi!",
        });
        // Optimistic: xoá ngay trong state cho mượt
        setPhucLoiList((prev) => prev.filter((x) => x.id !== id));
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
      }
    }
  };

  const handleFormSubmit = (message) => {
    // Reload sau khi thêm/sửa
    fetchPhucLoiList();
    setShowModal(false);
    toast.success(message || "Cập nhật phúc lợi thành công!");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    try {
      const exportData = phucLoiList.map((item) => ({
        "Tên phúc lợi": item.ten_phuc_loi,
        "Mô tả": item.mo_ta,
        "Giá trị": item.gia_tri,
        "Loại": item.loai,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PhucLoi");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, "DanhSachPhucLoi.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch {
      toast.error("❌ Xuất Excel thất bại!");
    }
  };

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý phúc lợi</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

          <h2 className="text-center mb-4">📋 Quản lý Phúc lợi</h2>

          <Row className="mb-3">
            <Col md={6}>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Tìm kiếm theo tên hoặc mô tả..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col md={6} className="text-end">
              <Button variant="outline-success" className="me-2" onClick={handleAdd}>
                ➕ Thêm phúc lợi
              </Button>
              <Button variant="outline-primary" onClick={exportToExcel}>
                📤 Xuất Excel
              </Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
              <div className="mt-2">Đang tải dữ liệu...</div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-3">Không có dữ liệu phù hợp</div>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead className="table-dark text-center">
                <tr>
                  <th>Tên</th>
                  <th>Mô tả</th>
                  <th>Giá trị</th>
                  <th>Loại</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((pl) => (
                  <tr key={pl.id}>
                    <td>{pl.ten_phuc_loi}</td>
                    <td>{pl.mo_ta}</td>
                    <td>{pl.gia_tri}</td>
                    <td>{pl.loai}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(pl)}
                      >
                        ✏️ Sửa
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(pl.id)}
                      >
                        🗑️ Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {totalPages > 1 && !loading && (
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
                  onClick={() => setCurrentPage(i + 1)}
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

          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedPhucLoi ? "✏️ Cập nhật phúc lợi" : "➕ Thêm phúc lợi"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <PhucLoiForm
                selected={selectedPhucLoi}
                onAdded={handleFormSubmit}
                onClose={() => setShowModal(false)}
                fetchPhucLoiList={fetchPhucLoiList}
              />
            </Modal.Body>
          </Modal>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default QuanLyPhucLoi;
