// src/pages/modules/QuanLyNguoiDung.jsx
import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Breadcrumb, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserForm from "../../components/user/userForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";

const QuanLyNguoiDung = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/get-all-users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Lỗi khi tải người dùng:", err);
      toast.error("Không thể tải danh sách người dùng!");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      u.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (u.role?.ma_vai_tro || "").toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdd = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/delete-user/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        await fetchUsers();
        toast.success("Xóa người dùng thành công!");
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        toast.error("Lỗi khi xóa người dùng!");
      }
    }
  };

  const handleFormSubmit = (message) => {
    fetchUsers();
    setShowModal(false);
    toast.success(message || "Cập nhật người dùng thành công!");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    try {
      const exportData = users.map((u) => ({
        ID: u.id,
        Tên_đăng_nhập: u.username,
        Email: u.email,
        Vai_trò: u.role?.ma_vai_tro || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, "DanhSachNguoiDung.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch (e) {
      toast.error("❌ Xuất Excel thất bại!");
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý người dùng</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

          <h2 className="text-center mb-4">👥 Quản lý Người dùng</h2>

          <Row className="mb-3">
            <Col md={6}>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Tìm kiếm theo tên, email hoặc vai trò..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col md={6} className="text-end">
              <Button variant="outline-success" className="me-2" onClick={handleAdd}>
                ➕ Thêm người dùng
              </Button>
              <Button variant="outline-primary" onClick={exportToExcel}>
                📤 Xuất Excel
              </Button>
            </Col>
          </Row>

          {currentItems.length === 0 ? (
            <div className="text-center py-3">Không có dữ liệu phù hợp</div>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead className="table-dark text-center">
                <tr>
                  <th>ID</th>
                  <th>Tên đăng nhập</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.role?.ma_vai_tro}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(u)}
                      >
                        ✏️ Sửa
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(u.id)}
                      >
                        🗑️ Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

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
                {selectedUser ? "✏️ Cập nhật người dùng" : "➕ Thêm người dùng"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <UserForm
                selected={selectedUser}
                onAdded={handleFormSubmit}
                onClose={() => setShowModal(false)}
                fetchUsers={fetchUsers}
              />
            </Modal.Body>
          </Modal>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default QuanLyNguoiDung;
