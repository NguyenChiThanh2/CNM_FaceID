import React, { useState, useEffect } from "react";
import axios from "axios";
import NgayNghiLeForm from "../../components/ngaynghile/NgayNghiLeForm";
import { Modal, Button, Table, Breadcrumb } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";

const API_URL = "http://127.0.0.1:5000/api";

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
      const response = await axios.get(`${API_URL}/get-all-ngay-nghi-le`);
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
        await axios.delete(`${API_URL}/delete-ngay-nghi-le/${id}`);
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
    <div className="container min-vh-100">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý ngày nghỉ có lương</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-center flex-grow-1">Quản lý ngày nghỉ có lương</h2>
          </div>

          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Tìm theo tên hoặc mô tả ngày nghỉ có lương..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mb-3">
            <button
              className="btn btn-outline-success px-4"
              onClick={handleAdd}
            >
              + Thêm ngày nghỉ có lương
            </button>
          </div>

          <div className="table-responsive">
            <Table bordered hover striped className="rounded">
              <thead className="table-dark text-center">
                <tr>
                  <th>ID</th>
                  <th>Ngày nghỉ</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Mô tả</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.ten_ngay}</td>
                      <td>{formatDate(item.tu_ngay)}</td>
                      <td>{formatDate(item.den_ngay)}</td>
                      <td>{item.mo_ta || "Không có mô tả"}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => handleEdit(item)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          🗑 Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      Không có ngày nghỉ có lương nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
              <Button
                variant="outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← Trang Trước
              </Button>
              <span>
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Trang Sau →
              </Button>
            </div>
          )}

          {/* Modal thêm/sửa */}
          <Modal show={showModal} onHide={handleModalClose} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {editingNgayNghiLe ? "Chỉnh sửa ngày nghỉ có lương" : "Thêm ngày nghỉ có lương"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <NgayNghiLeForm
                onAdded={handleFormSubmit}
                editingNgayNghiLe={editingNgayNghiLe}
                setEditingNgayNghiLe={setEditingNgayNghiLe}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>
                Đóng
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default NgayNghiLe;
