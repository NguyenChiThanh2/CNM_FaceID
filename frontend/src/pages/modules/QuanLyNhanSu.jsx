import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal, Button, Card, Table, Container,
  Row, Col, Breadcrumb, Toast, ToastContainer,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NhanSuAddForm from "../../components/nhansu/NhanSuAddForm";
import { getAllChucVu } from "../../services/api/chuc-vu-api";
import { getAllPhongBan } from "../../services/api/phong-ban-api";
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const QuanLyNhanSu = () => {
  const [errors, setErrors] = useState({});
  const [nhanSuList, setNhanSuList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingNhanSu, setEditingNhanSu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [selectedTrangThai, setSelectedTrangThai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const itemsPerPage = 5;
  const [soDienThoai, setSoDienThoai] = useState(""); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchNhanSu();
    fetchChucVu();
    fetchPhongBan();
  }, []);

  const fetchNhanSu = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/get-all-nhan-vien");
      setNhanSuList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    }
  };

  const fetchChucVu = async () => {
    try {
      const data = await getAllChucVu();
      setDsChucVu(data);
    } catch (err) {
      console.error("Lỗi khi load chức vụ:", err);
    }
  };

  const fetchPhongBan = async () => {
    try {
      const data = await getAllPhongBan();
      setDsPhongBan(data);
    } catch (err) {
      console.error("Lỗi khi load phòng ban:", err);
    }
  };

  const handleAdd = () => {
    setEditingNhanSu(null);
    setShowModal(true);
  };

  const handleEdit = (nv) => {
    setEditingNhanSu(nv);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân sự này không?")) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/delete-nhan-vien/${id}`);
        fetchNhanSu();
        setToastMessage("✅ Xóa nhân sự thành công!");
        setShowToast(true);
      } catch (error) {
        console.error("Lỗi khi xóa nhân sự:", error.response || error.message);
        setToastMessage("❌ Đã xảy ra lỗi khi xóa nhân viên!");
        setShowToast(true);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNhanSu(null);
  };

  const handleFormSubmit = () => {
    fetchNhanSu();
    handleModalClose();
    setToastMessage("✅ Cập nhật hoặc thêm mới nhân sự thành công!");
    setShowToast(true);
  };

  const handleRowClick = (nv) => {
    navigate(`/nhan-su/${nv.id}`);
  };

  const getTenChucVu = (id) => dsChucVu.find((c) => c.id === id)?.ten_chuc_vu || "Không rõ";
  const getTenPhongBan = (id) => dsPhongBan.find((p) => p.id === id)?.ten_phong_ban || "Không rõ";

  const filteredList = nhanSuList.filter((nv) =>
    nv.ho_ten.toLowerCase().includes(searchKeyword.toLowerCase()) &&
    (selectedTrangThai ? nv.trang_thai === selectedTrangThai : true)
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const currentItems = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredList.map(nv => ({
      ID: nv.id,
      "Họ tên": nv.ho_ten,
      "Giới tính": nv.gioi_tinh,
      "Ngày sinh": nv.ngay_sinh,
      Email: nv.email,
      "Số điện thoại": nv.so_dien_thoai,
      "Chức vụ": getTenChucVu(nv.chuc_vu_id),
      "Phòng ban": getTenPhongBan(nv.phong_ban_id),
      "Địa chỉ": nv.dia_chi,
      "Lương cơ bản": nv.luong_co_ban,
      "Trạng thái": nv.trang_thai,
    }));
    const validateForm = () => {
      const newErrors = {};
      if (!hoTen.trim()) newErrors.hoTen = "Họ tên là bắt buộc";
      
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email.match(emailRegex)) newErrors.email = "Email không hợp lệ";
      
      const phoneRegex = /^(0[3|5|7|8|9][0-9]{8})$/;
      if (!soDienThoai.match(phoneRegex)) newErrors.soDienThoai = "SĐT không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 chữ số)";
      
      if (!chucVuId) newErrors.chucVuId = "Chức vụ là bắt buộc";
      if (!phongBanId) newErrors.phongBanId = "Phòng ban là bắt buộc";
      if (!trangThai) newErrors.trangThai = "Trạng thái là bắt buộc";
    
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      // nếu hợp lệ thì gửi dữ liệu lên server...
    };
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNhanSu");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `DanhSachNhanSu.xlsx`);
  };

  return (
    <Container fluid className="bg-light min-vh-90 py-4 px-5">
      <Breadcrumb className="mt-3">
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item active>Quản lý nhân sự</Breadcrumb.Item>
      </Breadcrumb>
      <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>


      <h2 className="text-center mb-4 ">Quản lý nhân sự</h2>
      <div className=" shadow-sm p-4">
        <Row className="mb-3 align-items-center">
          <Col md={5}>
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Tìm theo họ tên..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>
          <Col md={3}>
            <select
              className="form-select"
              value={selectedTrangThai}
              onChange={(e) => {
                setSelectedTrangThai(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Đang làm việc">Đang làm việc</option>
              <option value="Đã nghỉ việc">Đã nghỉ việc</option>
              <option value="Đang thử việc">Đang thử việc</option>
            </select>
          </Col>
          <Col md={4} className="text-end">
            <Button variant="outline-primary" className="me-2" onClick={handleAdd}>
              ➕ Thêm nhân sự
            </Button>
            <Button variant="outline-success" onClick={handleExportExcel}>
              ⬇️ Xuất Excel
            </Button>

          </Col>
        </Row>

        <div className="table-responsive ">
          <Table bordered hover className="bg-white shadow-sm">
            <thead className="table-dark text-center">
              <tr>
                <th>Ảnh</th>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Chức vụ</th>
                <th>Phòng ban</th>
                <th>Địa chỉ</th>
                <th>Lương</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((nv) => (
                <tr key={nv.id} onClick={() => handleRowClick(nv)} style={{ cursor: "pointer" }}>
                  <td className="text-center">
                    {nv.avatar ? (
                      <img
                        src={`http://127.0.0.1:5000/api/images/${nv.avatar}`}
                        alt="avatar"
                        width="40"
                        height="40"
                        style={{ objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        backgroundColor: "#ccc", display: "flex",
                        justifyContent: "center", alignItems: "center", fontSize: "12px"
                      }}>No Image</div>
                    )}
                  </td>
                  <td>{nv.id}</td>
                  <td>{nv.ho_ten}</td>
                  <td>{nv.gioi_tinh}</td>
                  <td>{nv.ngay_sinh ? new Date(nv.ngay_sinh).toLocaleDateString() : ""}</td>
                  <td>{nv.email}</td>
                  <td>{nv.so_dien_thoai}</td>
                  <td>{getTenChucVu(nv.chuc_vu_id)}</td>
                  <td>{getTenPhongBan(nv.phong_ban_id)}</td>
                  <td>{nv.dia_chi}</td>
                  <td>{nv.luong_co_ban}</td>
                  <td>{nv.trang_thai}</td>
                  <td className="text-nowrap">
                    <Button variant="outline-warning" size="sm" className="me-2"
                      onClick={(e) => { e.stopPropagation(); handleEdit(nv); }}>
                      ✏️ Sửa
                    </Button>
                    <Button variant="outline-danger" size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(nv.id); }}>
                      🗑️Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
          <Button variant="outline-secondary" disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}>
            ← Trang trước
          </Button>
          <span>Trang {currentPage} / {totalPages}</span>
          <Button variant="outline-secondary" disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}>
            Trang sau →
          </Button>
        </div>
      </div >
      <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100">
            {editingNhanSu ? "Cập nhật nhân sự" : "Thêm nhân sự"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NhanSuAddForm
            onAdded={handleFormSubmit}
            editingNhanSu={editingNhanSu}
            setEditingNhanSu={setEditingNhanSu}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg="success" delay={3000} autohide>
          <Toast.Body className="text-white fw-bold fs-6">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>

  );
};

export default QuanLyNhanSu;
