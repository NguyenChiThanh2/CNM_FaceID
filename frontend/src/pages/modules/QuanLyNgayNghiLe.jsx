import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import NgayNghiLeForm from "../../components/ngaynghile/NgayNghiLeForm";
import { Modal, Button, Table, Breadcrumb, Card, Row, Col, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";
import { FaHome, FaSearch, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaCalendarDay } from "react-icons/fa";

const NgayNghiLe = () => {
  const [ngayNghiLeList, setNgayNghiLeList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingNgayNghiLe, setEditingNgayNghiLe] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchNgayNghiLe();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  const fetchNgayNghiLe = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get-all-ngay-nghi-le`);
      setNgayNghiLeList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API ngày nghỉ có lương:", error);
      toast.error("Không có ngày nghỉ có lương nào được tìm thấy!");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNgayNghiLe(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingNgayNghiLe(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa ngày nghỉ có lương này không?")) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/delete-ngay-nghi-le/${id}`);
        fetchNgayNghiLe();
        toast.success("Đã xóa ngày nghỉ có lương thành công!");
      } catch (error) {
        console.error("Lỗi khi xóa ngày nghỉ có lương:", error);
        toast.error("Có lỗi xảy ra khi xóa ngày nghỉ có lương!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNgayNghiLe(null);
  };

  const handleFormSubmit = () => {
    fetchNgayNghiLe();
    handleModalClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  const filteredList = ngayNghiLeList.filter((item) => {
    const ten = item.ten_ngay_le ? item.ten_ngay_le.toLowerCase() : "";
    const moTa = item.mo_ta ? item.mo_ta.toLowerCase() : "";
    const keyword = searchKeyword.toLowerCase();
    return ten.includes(keyword) || moTa.includes(keyword);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  if (loading)
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );

  return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <div 
        className="rounded-4 mb-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "2rem",
          color: "white"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Breadcrumb className="mb-3">
              <Breadcrumb.Item active style={{ color: "white" }}>
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Quản lý ngày nghỉ có lương
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">🎆 Quản lý Ngày Nghỉ Có Lương</h1>
            <p className="mb-0 opacity-90">
              Quản lý các ngày nghỉ lễ và ngày nghỉ có hưởng lương
            </p>
          </div>
          <Button 
            variant="outline-light" 
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            <FaHome className="me-2" />
            Trang chủ
          </Button>
        </div>
      </div>

      {/* Filter and Actions Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={8}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Tìm theo tên hoặc mô tả ngày nghỉ có lương..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </Col>
            <Col md={4}>
              <Button
                variant="primary"
                className="w-100"
                onClick={handleAdd}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none"
                }}
              >
                <FaPlus className="me-2" />
                Thêm ngày nghỉ
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table Card */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaCalendarAlt className="me-2" />
          Danh sách Ngày Nghỉ Có Lương
        </Card.Header>
        <Card.Body className="p-0">
          <div 
            className="table-responsive" 
            style={{ 
              overflowX: "auto", 
              overflowY: "auto", 
              maxHeight: "600px" 
            }}
          >
            <Table bordered hover className="mb-0" style={{ minWidth: "1500px" }}>
              <thead
                style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                  color: "white",
                  position: "sticky",
                  top: 0,
                  zIndex: 2
                }}
              >
                <tr>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "80px" }}>ID</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "200px" }}>Tên ngày nghỉ</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Từ ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Đến ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "300px" }}>Mô tả</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          #{item.id}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        <FaCalendarDay className="me-2 text-primary" />
                        {item.ten_ngay}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge bg-success bg-opacity-10 text-success">
                          {formatDate(item.tu_ngay)}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          {formatDate(item.den_ngay)}
                        </span>
                      </td>
                      <td style={{ padding: "12px", maxWidth: "300px" }}>
                        <div className="text-truncate" title={item.mo_ta}>
                          {item.mo_ta || "Không có mô tả"}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex gap-1 flex-wrap">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            title="Sửa ngày nghỉ"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Xóa ngày nghỉ"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      <FaCalendarAlt size={32} className="mb-2 opacity-50" />
                      <br />
                      Không có ngày nghỉ có lương nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="shadow-sm border-0 rounded-4 mt-4">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-center align-items-center gap-3">
              <Button
                variant="outline-primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{ borderColor: "#667eea", color: "#667eea" }}
              >
                ← Trang trước
              </Button>
              <span className="fw-semibold" style={{ color: "#4a5568" }}>
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline-primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{ borderColor: "#667eea", color: "#667eea" }}
              >
                Trang sau →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal thêm/sửa */}
      <Modal
        show={showModal}
        onHide={handleModalClose}
        size="lg"
        className="rounded-4"
      >
        <Modal.Header 
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Modal.Title>
            {editingNgayNghiLe ? "✏️ Chỉnh sửa ngày nghỉ có lương" : "➕ Thêm ngày nghỉ có lương"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <NgayNghiLeForm
            onAdded={handleFormSubmit}
            editingNgayNghiLe={editingNgayNghiLe}
            setEditingNgayNghiLe={setEditingNgayNghiLe}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NgayNghiLe;