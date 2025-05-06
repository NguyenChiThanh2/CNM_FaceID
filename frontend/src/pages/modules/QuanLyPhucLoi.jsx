import React, { useState, useEffect } from "react";
import {
  Container, Row, Col, Button, Table, Modal,
  Breadcrumb, Toast, ToastContainer
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PhucLoiForm from "../../components/phucloi/PhucLoiForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const QuanLyPhucLoi = () => {
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [selectedPhucLoi, setSelectedPhucLoi] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  const fetchPhucLoiList = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/get-all-phuc-loi");
      const data = await res.json();
      setPhucLoiList(data);
    } catch (err) {
      console.error("Lỗi khi tải phúc lợi:", err);
    }
  };

  useEffect(() => {
    fetchPhucLoiList();
  }, []);

  const filteredList = phucLoiList.filter((pl) =>
    pl.ten_phuc_loi.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    pl.mo_ta.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const currentItems = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        await fetch(`http://localhost:5000/api/delete-phuc-loi/${id}`, {
          method: "DELETE",
        });
        fetchPhucLoiList();
        setToastMessage("✅ Xóa phúc lợi thành công!");
        setShowToast(true);
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        setToastMessage("❌ Lỗi khi xóa phúc lợi!");
        setShowToast(true);
      }
    }
  };

  const handleFormSubmit = (message) => {
    fetchPhucLoiList();
    setShowModal(false);
    setToastMessage(message || "✅ Cập nhật thành công!");
    setShowToast(true);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
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
  };

  return (
    <Container fluid className="bg-light min-vh-100 py-4 px-5">
      <ToastContainer position="top-end" className="p-3">
        <Toast onClose={() => setShowToast(false)} show={showToast} bg="success" delay={3000} autohide>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      <Breadcrumb className="mt-3">
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item active>Quản lý phúc lợi</Breadcrumb.Item>
      </Breadcrumb>
      <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>


      <h2 className="text-center  mb-4">📋 Quản lý Phúc lợi</h2>

      <div className="shadow-sm bg-white p-4 rounded">
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
            <Button variant="outline-success" className="me-2" onClick={handleAdd}>➕ Thêm phúc lợi</Button>
            <Button variant="outline-primary" onClick={exportToExcel}>📤 Xuất Excel</Button>
          </Col>
        </Row>

        {currentItems.length === 0 ? (
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
                    <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleEdit(pl)}>✏️ Sửa</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(pl.id)}>🗑️ Xóa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
            <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>← Trước</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i} variant={i + 1 === currentPage ? "primary" : "outline-primary"} onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau →</Button>
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedPhucLoi ? "✏️ Cập nhật phúc lợi" : "➕ Thêm phúc lợi"}</Modal.Title>
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
    </Container>
  );
};

export default QuanLyPhucLoi;
