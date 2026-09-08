// src/pages/modules/Thuong.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Table,
  Modal,
  Breadcrumb,
  Card,
  Form,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ThuongForm from "../../components/thuong/ThuongForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import axiosInstance from "../../services/axiosInstance";
import Loading from "../../../src/components/Loading";
import {
  FaHome,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaUserPlus,
  FaFileExport,
  FaGift,
} from "react-icons/fa";

const Thuong = () => {
  // Lấy user từ localStorage để phân quyền
  const raw = localStorage.getItem("user");
  let currentUser = null;
  try {
    currentUser = raw ? JSON.parse(raw)?.nhan_vien : null;
  } catch (_) {}
  const HR_DEPARTMENT_ID = 2; // id phòng nhân sự
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  const [thuongList, setThuongList] = useState([]);
  const [selectedThuong, setSelectedThuong] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showNhanVienModal, setShowNhanVienModal] = useState(false);
  const [selectedNhanVien, setSelectedNhanVien] = useState([]);
  const [showAddNhanVienModal, setShowAddNhanVienModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [selectedNhanVienIds, setSelectedNhanVienIds] = useState([]);
  const [selectedThuongId, setSelectedThuongId] = useState(null);
  const [PhongBanList, setPhongBanList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [soTienThucTe, setSoTienThucTe] = useState({});
  const [selectedLoaiThuong, setSelectedLoaiThuong] = useState("");
  const [ngayquyetdinh, setngayquyetdinh] = useState(null);

  const navigate = useNavigate();

  const fetchThuongList = async () => {
    setLoading(true);
    try {
      let url = `/get-all-thuong`;
      if (!isHR && currentUser?.id) {
        url = `/get-thuong-by-nhan-vien-id/${currentUser.id}`;
      }
      const res = await axiosInstance.get(url);
      setThuongList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err?.status === 404) {
        setThuongList([]);
      } else {
        console.error("Lỗi khi tải thưởng:", err);
        toast.error(String(err?.message || "Không thể tải danh sách thưởng!"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThuongList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredList = thuongList.filter(
    (pl) =>
      (pl.ten_thuong || "")
        .toLowerCase()
        .includes(searchKeyword.toLowerCase()) ||
      (pl.ngay_quyet_dinh || "")
        .toLowerCase()
        .includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentItems = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAdd = () => {
    setSelectedThuong(null);
    setShowModal(true);
  };

  const handleEdit = (pl) => {
    setSelectedThuong(pl);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/delete-thuong/${id}`);
        await fetchThuongList();
        toast.success("Xóa thưởng thành công!");
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        toast.error("❌ Lỗi khi xóa thưởng!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = (message) => {
    fetchThuongList();
    setShowModal(false);
    toast.success(message || "Cập nhật thưởng thành công!");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    try {
      const exportData = thuongList.map((item) => ({
        "Tên thưởng": item.ten_thuong,
        "Ngày quyết định": item.ngay_quyet_dinh,
        "Giá trị": item.so_tien,
        Loại: item.loai_thuong,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Thuong");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(file, "DanhSachThuong.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch (e) {
      toast.error("❌ Xuất Excel thất bại!", e);
    }
  };

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const handleViewNhanVien = async (thuongId) => {
    setLoading(true);
    try {
      const respb = await axiosInstance.get(`/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axiosInstance.get(
        `/get-all-nhan-vien-by-thuong-id/${thuongId}`
      );
      setSelectedNhanVien(Array.isArray(res.data) ? res.data : []);
      setSelectedThuongId(thuongId);
    } catch (err) {
      toast.error("Lỗi kết nối !");
      console.error("Lỗi kết nối", err);
      setSelectedNhanVien([]);
    } finally {
      setShowNhanVienModal(true);
      setLoading(false);
    }
  };

  const handleDeleteNhanVienFromThuong = async (nhanVienId) => {
    if (!selectedThuongId) return;
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi thưởng?")) {
      setLoading(true);
      try {
        await axiosInstance.post(`/remove-nhan-vien-from-thuong`, {
          thuong_id: selectedThuongId,
          nhan_vien_id: nhanVienId,
        });
        await handleViewNhanVien(selectedThuongId);
        toast.success("Đã xóa nhân viên khỏi thưởng.");
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        toast.error("Không thể xóa nhân viên.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShowAddNhanVienModal = async (thuongId, ngay_quyet_dinh) => {
    setLoading(true);
    try {
      const respb = await axiosInstance.get(`/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axiosInstance.get(`/get-all-nhan-vien`);
      const resSelected = await axiosInstance.get(
        `/get-all-nhan-vien-by-thuong-id/${thuongId}`
      );
      const thuongObj = thuongList.find((t) => t.id === thuongId);
      const loaiThuong = thuongObj?.loai_thuong || "";
      setSelectedThuongId(thuongId);
      setSelectedLoaiThuong(loaiThuong);

      if (Array.isArray(resSelected.data) && resSelected.data.length > 0) {
        const selectedIds = resSelected.data.map((nv) => nv.id);
        const soTienMap = {};
        resSelected.data.forEach((nv) => {
          // console.log(resSelected.data);
          if (nv.so_tien_thuc_te) {
            soTienMap[nv.id] = nv.so_tien_thuc_te;
          }
        });
        setSelectedNhanVienIds(selectedIds);
        setSoTienThucTe(soTienMap);
      } else {
        setSelectedNhanVienIds([]);
      }

      setNhanVienList(res.data);
      setSelectedThuongId(thuongId);
      setngayquyetdinh(ngay_quyet_dinh);
      setShowAddNhanVienModal(true);
    } catch (err) {
      toast.error("Lỗi kết nối !");
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNhanVien = (e, id) => {
    const newSet = new Set(selectedNhanVienIds);
    if (e.target.checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedNhanVienIds([...newSet]);
  };
  const handleChangeSoTien = (nhanVienId, value) => {
    setSoTienThucTe((prev) => ({
      ...prev,
      [nhanVienId]: value,
    }));
  };

  const handleAddNhanVienToThuong = async () => {
    if (!selectedThuongId) return;
    setLoading(true);
    try {
      const payload = {
        thuong_id: selectedThuongId,
        nhan_vien_ids: selectedNhanVienIds.map((id) => {
          const soTien = soTienThucTe[id];
          return soTien ? { id, so_tien_thuc_te: parseFloat(soTien) } : { id };
        }),
      };
      await axiosInstance.post(`/add-nhan-vien-to-thuong`, {
        payload,
      });
      toast.success("Đã thêm nhân viên vào thưởng.");
      setShowAddNhanVienModal(false);
      setSelectedNhanVienIds([]);
      setSoTienThucTe({});
    } catch (err) {
      console.error("Lỗi thêm nhân viên:", err);
      toast.error("Không thể thêm nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

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
          color: "white",
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
                Quản lý thưởng
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">🎁 Quản lý Thưởng</h1>
            <p className="mb-0 opacity-90">
              Quản lý và phân phối các khoản thưởng cho nhân viên
            </p>
          </div>
          <Button
            variant="outline-light"
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
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
            <Col md={6}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </Col>
            <Col md={4}>
              <Button
                variant="outline-primary"
                onClick={exportToExcel}
                className="w-100"
                style={{ borderColor: "#667eea", color: "#667eea" }}
              >
                <FaFileExport className="me-2" />
                Xuất Excel
              </Button>
            </Col>
            <Col md={2}>
              {isHR && (
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={handleAdd}
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  <FaPlus className="me-2" />
                  Thêm thưởng
                </Button>
              )}
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
            fontSize: "1.1rem",
          }}
        >
          <FaGift className="me-2" />
          Danh sách Thưởng
        </Card.Header>
        <Card.Body className="p-0">
          <div
            className="table-responsive"
            style={{ overflowX: "auto", overflowY: "auto", maxHeight: "600px" }}
          >
            <Table
              bordered
              hover
              className="mb-2"
              style={{ minWidth: "1500px" }}
            >
              <thead
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                  color: "white",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                      minWidth: "200px",
                    }}
                  >
                    Tên thưởng
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                      minWidth: "180px",
                    }}
                  >
                    Mục đích thưởng
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                      minWidth: "150px",
                    }}
                  >
                    Giá trị
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                      minWidth: "150px",
                    }}
                  >
                    Ngày quyết định
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                      minWidth: "200px",
                    }}
                  >
                    Ghi chú
                  </th>
                  {isHR && (
                    <th
                      style={{
                        padding: "12px",
                        fontWeight: "600",
                        minWidth: "250px",
                      }}
                    >
                      Hành động
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((pl) => (
                    <tr key={pl.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        {pl.ten_thuong}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {{
                            LE: "Thưởng Lễ",
                            TET: "Thưởng Tết",
                            THANG13: "Thưởng Tháng 13",
                            NONG: "Thưởng Nóng",
                            THANHTICH: "Thưởng Thành tích",
                            THUONGKHAC: "Thưởng Khác",
                          }[pl.loai_thuong] || "Không xác định"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: "600",
                          color: "#28a745",
                        }}
                      >
                        {formatCurrency(pl.so_tien)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {formatDate(pl.ngay_quyet_dinh)}
                      </td>
                      <td style={{ padding: "12px", maxWidth: "auto" }}>
                        <div className="text-truncate" title={pl.ghi_chu}>
                          {pl.ghi_chu || "Không có ghi chú"}
                        </div>
                      </td>
                      {isHR && (
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEdit(pl)}
                              title="Sửa thưởng"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(pl.id)}
                              title="Xóa thưởng"
                            >
                              <FaTrash />
                            </Button>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => handleViewNhanVien(pl.id)}
                              title="Xem nhân viên"
                            >
                              <FaUsers />
                            </Button>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleShowAddNhanVienModal(pl.id, pl.ngay_quyet_dinh)}
                              title="Thêm nhân viên"
                            >
                              <FaUserPlus />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isHR ? 6 : 5}
                      className="text-center text-muted py-4"
                    >
                      <FaGift size={32} className="mb-2 opacity-50" />
                      <br />
                      Không có đơn thưởng nào phù hợp
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ borderColor: "#667eea", color: "#667eea" }}
              >
                Trang sau →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal thêm/sửa thưởng */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Modal.Title>
            {selectedThuong ? "✏️ Cập nhật thưởng" : "➕ Thêm thưởng"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <ThuongForm
            selected={selectedThuong}
            onAdded={handleFormSubmit}
            onClose={() => setShowModal(false)}
            fetchThuongList={fetchThuongList}
          />
        </Modal.Body>
      </Modal>

      {/* Modal danh sách nhân viên */}
      <Modal
        show={showNhanVienModal}
        onHide={() => setShowNhanVienModal(false)}
        size="lg"
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Modal.Title>
            <FaUsers className="me-2" />
            Danh sách nhân viên có thưởng
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNhanVien.length === 0 ? (
            <div className="text-center text-muted py-4">
              <FaUsers size={48} className="mb-3 opacity-50" />
              <p>Không có nhân viên nào được thưởng.</p>
            </div>
          ) : (
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {PhongBanList.map((pb) => {
                const nvTrongPB = selectedNhanVien.filter(
                  (nv) => nv.phong_ban_id === pb.id
                );
                if (nvTrongPB.length === 0) return null;

                return (
                  <Card key={pb.id} className="mb-3 border-0 shadow-sm">
                    <Card.Header
                      style={{
                        background:
                          "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                        fontWeight: "600",
                      }}
                    >
                      {pb.ten_phong_ban}
                    </Card.Header>
                    <Card.Body className="p-0">
                      <Table bordered hover className="mb-0">
                        <thead style={{ background: "#f8f9fa" }}>
                          <tr>
                            <th style={{ padding: "10px" }}>Họ tên</th>
                            <th style={{ padding: "10px" }}>Email</th>
                            <th style={{ padding: "10px", width: "100px" }}>
                              Hành động
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {nvTrongPB.map((nv) => (
                            <tr key={nv.id}>
                              <td style={{ padding: "10px" }}>{nv.ho_ten}</td>
                              <td style={{ padding: "10px" }}>{nv.email}</td>
                              <td
                                style={{ padding: "10px", textAlign: "center" }}
                              >
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteNhanVienFromThuong(nv.id)
                                  }
                                  title="Xóa khỏi thưởng"
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowNhanVienModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal thêm nhân viên */}
      <Modal
        show={showAddNhanVienModal}
        onHide={() => {
          setShowAddNhanVienModal(false);
          setSelectedNhanVienIds([]);
        }}
        size="lg"
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Modal.Title>
            <FaUserPlus className="me-2" />
            Thêm nhân viên có thưởng
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {nhanVienList.length === 0 ? (
            <div className="text-center text-muted py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              Đang tải danh sách nhân viên...
            </div>
          ) : (
            <div
              style={{
                maxHeight: "500px",
                overflowY: "auto",
                border: "1px solid #dee2e6",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              {/* Checkbox tổng */}
              <div className="mb-3 p-2 bg-light rounded">
                <Form.Check
                  type="checkbox"
                  label="Chọn tất cả nhân viên"
                  checked={selectedNhanVienIds.length === nhanVienList.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNhanVienIds(nhanVienList.map((nv) => nv.id));
                    } else {
                      setSelectedNhanVienIds([]);
                    }
                  }}
                />
              </div>

              {/* Lặp phòng ban */}
              {PhongBanList.map((pb) => {
                const nhanVienTrongPB = nhanVienList.filter(
                  (nv) => nv.phong_ban_id === pb.id
                );

                const allChecked = nhanVienTrongPB.every((nv) =>
                  selectedNhanVienIds.includes(nv.id)
                );

                return (
                  <Card key={pb.id} className="mb-3 border-0 shadow-sm">
                    <Card.Header
                      style={{
                        background:
                          "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                        padding: "10px 15px",
                      }}
                    >
                      <Form.Check
                        type="checkbox"
                        label={pb.ten_phong_ban}
                        checked={allChecked}
                        onChange={async (e) => {
                          if (e.target.checked) {
                            // ✅ Khi chọn tất cả nhân viên trong phòng
                            const ids = nhanVienTrongPB.map((nv) => nv.id);
                            setSelectedNhanVienIds((prev) => [
                              ...new Set([...prev, ...ids]),
                            ]);

                            // Nếu loại thưởng là tháng 13 → gọi API cho từng nhân viên
                            if (selectedLoaiThuong === "THANG13") {
                              setLoading(true);
                              for (const nvId of ids) {
                                try {
                                  const res = await axiosInstance.post(
                                    `/get-thang-13-nhan-vien`, {
                                        id: nvId,
                                        ngay_quyet_dinh: ngayquyetdinh,
                                      });
                                  const tienThang13 = res.data?.so_tien || 0;
                                  setSoTienThucTe((prev) => ({
                                    ...prev,
                                    [nvId]: tienThang13,
                                  }));
                                } catch (err) {
                                  setLoading(false);
                                  console.error(
                                    "Lỗi khi lấy tiền tháng 13:",
                                    err
                                  );
                                }
                              }
                              setLoading(false);
                              toast.success(
                                "Đã tự động lấy tiền tháng 13 cho toàn bộ nhân viên trong phòng."
                              );
                            }
                          } else {
                            // ❌ Bỏ chọn → xóa các nhân viên và số tiền tương ứng
                            const ids = nhanVienTrongPB.map((nv) => nv.id);
                            setSelectedNhanVienIds((prev) =>
                              prev.filter((id) => !ids.includes(id))
                            );
                            setSoTienThucTe((prev) => {
                              const newData = { ...prev };
                              ids.forEach((id) => delete newData[id]);
                              return newData;
                            });
                          }
                        }}
                      />
                    </Card.Header>

                    <Card.Body>
                      {nhanVienTrongPB.map((nv) => (
                        <div key={nv.id} className="ms-3 mb-3">
                          <div className="row align-items-center">
                            <div className="col-md-8 col-12">
                              <Form.Check
                                type="checkbox"
                                label={`${nv.ho_ten} - ${nv.email}`}
                                checked={selectedNhanVienIds.includes(nv.id)}
                                onChange={async (e) => {
                                  const checked = e.target.checked;

                                  if (checked) {
                                    setSelectedNhanVienIds((prev) => [
                                      ...new Set([...prev, nv.id]),
                                    ]);

                                    // ✅ Nếu là loại thưởng tháng 13 thì tự động gọi API
                                    if (selectedLoaiThuong === "THANG13") {
                                      try {
                                        
                                        const res = await axiosInstance.post(
                                          `/get-thang-13-nhan-vien`, {
                                              id: nv.id,
                                              ngay_quyet_dinh: ngayquyetdinh,
                                            });
                                        const tienThang13 =
                                          res.data?.so_tien || 0;

                                        setSoTienThucTe((prev) => ({
                                          ...prev,
                                          [nv.id]: tienThang13,
                                        }));

                                        toast.success(
                                          `Đã lấy tiền tháng 13 cho ${nv.ho_ten}`
                                        );
                                      } catch (err) {
                                        console.error(
                                          "Lỗi khi lấy tiền tháng 13:",
                                          err
                                        );
                                        toast.error(
                                          `Không thể lấy tiền tháng 13 cho ${nv.ho_ten}`
                                        );
                                      }
                                    }
                                  } else {
                                    // ❌ Bỏ chọn nhân viên → xóa khỏi danh sách
                                    setSelectedNhanVienIds((prev) =>
                                      prev.filter((id) => id !== nv.id)
                                    );
                                    setSoTienThucTe((prev) => {
                                      const newData = { ...prev };
                                      delete newData[nv.id];
                                      return newData;
                                    });
                                  }
                                }}
                              />
                            </div>

                            {selectedLoaiThuong === "THANG13" &&
                              selectedNhanVienIds.includes(nv.id) && (
                                <div className="col-md-4 col-12 mt-2 mt-md-0">
                                  <Form.Control
                                    type="number"
                                    className="form-control"
                                    placeholder="Nhập số tiền"
                                    value={soTienThucTe[nv.id] || ""}
                                    onChange={(e) =>
                                      handleChangeSoTien(nv.id, e.target.value)
                                    }
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddNhanVienModal(false);
              setSelectedNhanVienIds([]);
            }}
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleAddNhanVienToThuong}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Thuong;

// src/pages/modules/Thuong.jsx
// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Button,
//   Table,
//   Modal,
//   Breadcrumb,
// } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import ThuongForm from "../../components/thuong/ThuongForm";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import { ToastContainer, toast } from "react-toastify";
// import axios from "axios";
// import Loading from "../../../src/components/Loading";

// const Thuong = () => {
//   // Lấy user từ localStorage để phân quyền
//   const raw = localStorage.getItem("user");
//   let currentUser = null;
//   try {
//     currentUser = raw ? JSON.parse(raw)?.nhan_vien : null;
//   } catch (_) { }
//   const HR_DEPARTMENT_ID = 2; // id phòng nhân sự
//   const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

//   const [thuongList, setThuongList] = useState([]);
//   const [selectedThuong, setSelectedThuong] = useState(null);
//   const [searchKeyword, setSearchKeyword] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const [showNhanVienModal, setShowNhanVienModal] = useState(false);
//   const [selectedNhanVien, setSelectedNhanVien] = useState([]);
//   const [showAddNhanVienModal, setShowAddNhanVienModal] = useState(false);
//   const [nhanVienList, setNhanVienList] = useState([]);
//   const [selectedNhanVienIds, setSelectedNhanVienIds] = useState([]);
//   const [selectedThuongId, setSelectedThuongId] = useState(null);
//   const [PhongBanList, setPhongBanList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const API_BASE = "http://localhost:5000";

//   const fetchThuongList = async () => {
//     setLoading(true);
//     try {
//       let url = `${API_BASE}/api/get-all-thuong`;
//       if (!isHR && currentUser?.id) {
//         url = `${API_BASE}/api/get-thuong-by-nhan-vien-id/${currentUser.id}`;
//       }
//       const res = await fetch(url);

//       if (res.status === 404) {
//         // ✅ Xem như không có dữ liệu
//         setThuongList([]);
//         return;
//       }
//       if (!res.ok) {
//         const txt = await res.text();
//         throw new Error(`HTTP ${res.status}: ${txt}`);
//       }

//       const data = await res.json();
//       setThuongList(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Lỗi khi tải thưởng:", err);
//       toast.error(String(err?.message || "Không thể tải danh sách thưởng!"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchThuongList();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const filteredList = thuongList.filter(
//     (pl) =>
//       (pl.ten_thuong || "").toLowerCase().includes(searchKeyword.toLowerCase()) ||
//       (pl.ngay_quyet_dinh || "").toLowerCase().includes(searchKeyword.toLowerCase())
//   );

//   const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
//   const currentItems = filteredList.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) setCurrentPage(page);
//   };

//   const handleAdd = () => {
//     setSelectedThuong(null);
//     setShowModal(true);
//   };

//   const handleEdit = (pl) => {
//     setSelectedThuong(pl);
//     setShowModal(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
//       setLoading(true);
//       try {
//         const res = await fetch(`${API_BASE}/api/delete-thuong/${id}`, {
//           method: "DELETE",
//         });
//         if (!res.ok) throw new Error();
//         await fetchThuongList();
//         toast.success("Xóa thưởng thành công!");
//         setCurrentPage(1);
//       } catch (err) {
//         console.error("Lỗi xóa:", err);
//         toast.error("❌ Lỗi khi xóa thưởng!");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handleFormSubmit = (message) => {
//     fetchThuongList();
//     setShowModal(false);
//     toast.success(message || "Cập nhật thưởng thành công!");
//     setCurrentPage(1);
//   };

//   const exportToExcel = () => {
//     try {
//       const exportData = thuongList.map((item) => ({
//         "Tên thưởng": item.ten_thuong,
//         "Ngày quyết định": item.ngay_quyet_dinh,
//         "Giá trị": item.so_tien,
//         Loại: item.loai_thuong,
//       }));

//       const worksheet = XLSX.utils.json_to_sheet(exportData);
//       const workbook = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(workbook, worksheet, "Thuong");

//       const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//       const file = new Blob([excelBuffer], { type: "application/octet-stream" });
//       saveAs(file, "DanhSachThuong.xlsx");
//       toast.success("📤 Đã xuất Excel!");
//     } catch (e) {
//       toast.error("❌ Xuất Excel thất bại!", e);
//     }
//   };

//   const formatCurrency = (amount) =>
//     amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

//   // 👉 Xem nhân viên (chỉ HR dùng)
//   const handleViewNhanVien = async (thuongId) => {
//     setLoading(true);
//     try {
//       const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
//       setPhongBanList(respb.data);

//       const res = await axios.get(`${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`);
//       setSelectedNhanVien(Array.isArray(res.data) ? res.data : []);
//       setSelectedThuongId(thuongId);
//     } catch (err) {
//       toast.error("Lỗi kết nối !");
//       console.error("Lỗi kết nối", err);
//       setSelectedNhanVien([]);
//     } finally {
//       setShowNhanVienModal(true);
//       setLoading(false);
//     }
//   };

//   // 👉 Xóa nhân viên khỏi thưởng (chỉ HR)
//   const handleDeleteNhanVienFromThuong = async (nhanVienId) => {
//     if (!selectedThuongId) return;
//     if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi thưởng?")) {
//       setLoading(true);
//       try {
//         await axios.post(`${API_BASE}/api/remove-nhan-vien-from-thuong`, {
//           thuong_id: selectedThuongId,
//           nhan_vien_id: nhanVienId,
//         });
//         await handleViewNhanVien(selectedThuongId);
//         toast.success("Đã xóa nhân viên khỏi thưởng.");
//       } catch (err) {
//         console.error("Lỗi khi xóa:", err);
//         toast.error("Không thể xóa nhân viên.");
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   // 👉 Hiển thị modal thêm nhân viên (chỉ HR)
//   const handleShowAddNhanVienModal = async (thuongId) => {
//     setLoading(true);
//     try {
//       const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
//       setPhongBanList(respb.data);

//       const res = await axios.get(`${API_BASE}/api/get-all-nhan-vien`);
//       const resSelected = await axios.get(
//         `${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`
//       );

//       if (Array.isArray(resSelected.data) && resSelected.data.length > 0) {
//         const selectedIds = resSelected.data.map((nv) => nv.id);
//         setSelectedNhanVienIds(selectedIds);
//       } else {
//         setSelectedNhanVienIds([]);
//       }

//       setNhanVienList(res.data);
//       setSelectedThuongId(thuongId);
//       setShowAddNhanVienModal(true);
//     } catch (err) {
//       toast.error("Lỗi kết nối !");
//       console.error("Lỗi khi tải danh sách nhân viên:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSelectNhanVien = (e, id) => {
//     const newSet = new Set(selectedNhanVienIds);
//     if (e.target.checked) newSet.add(id);
//     else newSet.delete(id);
//     setSelectedNhanVienIds([...newSet]);
//   };

//   // 👉 Thêm nhân viên vào thưởng (chỉ HR)
//   const handleAddNhanVienToThuong = async () => {
//     if (!selectedThuongId) return;
//     setLoading(true);
//     try {
//       await axios.post(`${API_BASE}/api/add-nhan-vien-to-thuong`, {
//         thuong_id: selectedThuongId,
//         nhan_vien_ids: selectedNhanVienIds,
//       });
//       toast.success("Đã thêm nhân viên vào thưởng.");
//       setShowAddNhanVienModal(false);
//       setSelectedNhanVienIds([]);
//     } catch (err) {
//       console.error("Lỗi thêm nhân viên:", err);
//       toast.error("Không thể thêm nhân viên.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date instanceof Date && !isNaN(date)
//       ? date.toLocaleDateString("vi-VN")
//       : "Ngày không hợp lệ";
//   };

//   if (loading)
//     return (
//       <div>
//         <ToastContainer position="top-right" autoClose={2000} />
//         <Loading />
//       </div>
//     );

//   return (
//     <div className="container min-vh-100">
//       <ToastContainer position="top-right" autoClose={2000} />
//       <div className="row">
//         <div className="col-12 mt-5">
//           <Breadcrumb className="mt-3">
//             <Breadcrumb.Item onClick={() => navigate("/")}>
//               Trang chủ
//             </Breadcrumb.Item>
//             <Breadcrumb.Item active>Quản lý thưởng</Breadcrumb.Item>
//           </Breadcrumb>
//           <Button variant="secondary" onClick={() => navigate("/")}>
//             ← Trang chủ
//           </Button>

//           <h2 className="text-center mb-4">📋 Quản lý Thưởng</h2>

//           <Row className="mb-3">
//             <Col md={6}>
//               <input
//                 type="text"
//                 className="form-control"
//                 placeholder="🔍 Tìm kiếm theo tên hoặc mô tả..."
//                 value={searchKeyword}
//                 onChange={(e) => {
//                   setSearchKeyword(e.target.value);
//                   setCurrentPage(1);
//                 }}
//               />
//             </Col>
//             <Col md={6} className="text-end">
//               {isHR && (
//                 <Button
//                   variant="outline-success"
//                   className="me-2"
//                   onClick={handleAdd}
//                 >
//                   ➕ Thêm thưởng
//                 </Button>
//               )}
//               <Button variant="outline-primary" onClick={exportToExcel}>
//                 📤 Xuất Excel
//               </Button>
//             </Col>
//           </Row>

//           <Table
//             striped
//             bordered
//             hover
//             responsive
//             className="align-middle rounded text-nowrap"
//             style={{ overflowX: "auto" }}
//           >
//             <thead className="table-dark text-center">
//               <tr>
//                 <th>Tên</th>
//                 <th>Mục đích thưởng</th>
//                 <th>Giá trị</th>
//                 <th>Ngày quyết định</th>
//                 <th>Ghi chú</th>
//                 {isHR && <th>Hành động</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {currentItems.length > 0 ? (
//                 currentItems.map((pl) => (
//                   <tr key={pl.id}>
//                     <td>{pl.ten_thuong}</td>
//                     <td>
//                       {{
//                         LE: "Thưởng Lễ",
//                         TET: "Thưởng Tết",
//                         THANG13: "Thưởng Tháng 13",
//                         NONG: "Thưởng Nóng",
//                         THANHTICH: "Thưởng Thành tích",
//                         THUONGKHAC: "Thưởng Khác",
//                       }[pl.loai_thuong] || "Không xác định"}
//                     </td>
//                     <td>{formatCurrency(pl.so_tien)}</td>
//                     <td>{formatDate(pl.ngay_quyet_dinh)}</td>
//                     <td>{pl.ghi_chu}</td>

//                     {isHR && (
//                       <td className="text-center">
//                         <Button
//                           variant="outline-warning"
//                           size="sm"
//                           className="me-2"
//                           onClick={() => handleEdit(pl)}
//                         >
//                           ✏️ Sửa
//                         </Button>
//                         <Button
//                           variant="outline-danger"
//                           size="sm"
//                           className="me-2"
//                           onClick={() => handleDelete(pl.id)}
//                         >
//                           🗑️ Xóa
//                         </Button>
//                         <Button
//                           variant="outline-info"
//                           size="sm"
//                           className="me-2"
//                           onClick={() => handleViewNhanVien(pl.id)}
//                         >
//                           Xem nhân viên
//                         </Button>
//                         <Button
//                           variant="outline-primary"
//                           size="sm"
//                           onClick={() => handleShowAddNhanVienModal(pl.id)}
//                         >
//                           Thêm nhân viên
//                         </Button>
//                       </td>
//                     )}
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan={isHR ? 6 : 5} className="text-center text-muted">
//                     Không có đơn thưởng nào phù hợp
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </Table>

//           {totalPages > 1 && (
//             <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
//               <Button
//                 variant="outline-secondary"
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 ← Trước
//               </Button>
//               {Array.from({ length: totalPages }, (_, i) => (
//                 <Button
//                   key={i}
//                   variant={i + 1 === currentPage ? "primary" : "outline-primary"}
//                   onClick={() => setCurrentPage(i + 1)}
//                 >
//                   {i + 1}
//                 </Button>
//               ))}
//               <Button
//                 variant="outline-secondary"
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//               >
//                 Sau →
//               </Button>
//             </div>
//           )}

//           {/* Modal thêm/sửa thưởng (chỉ HR dùng, nhưng vẫn render khi isHR) */}
//           <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
//             <Modal.Header closeButton>
//               <Modal.Title>
//                 {selectedThuong ? "✏️ Cập nhật thưởng" : "➕ Thêm thưởng"}
//               </Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//               <ThuongForm
//                 selected={selectedThuong}
//                 onAdded={handleFormSubmit}
//                 onClose={() => setShowModal(false)}
//                 fetchThuongList={fetchThuongList}
//               />
//             </Modal.Body>
//           </Modal>

//           {/* Modal danh sách nhân viên (chỉ HR) */}
//           <Modal
//             show={showNhanVienModal}
//             onHide={() => setShowNhanVienModal(false)}
//             size="lg"
//           >
//             <Modal.Header closeButton>
//               <Modal.Title>Danh sách nhân viên có thưởng</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//               {selectedNhanVien.length === 0 ? (
//                 <p className="text-muted">Không có nhân viên nào được thưởng.</p>
//               ) : (
//                 PhongBanList.map((pb) => {
//                   const nvTrongPB = selectedNhanVien.filter(
//                     (nv) => nv.phong_ban_id === pb.id
//                   );
//                   if (nvTrongPB.length === 0) return null;

//                   return (
//                     <div key={pb.id} className="mb-4">
//                       <h5 className="fw-bold">{pb.ten_phong_ban}</h5>
//                       <hr />
//                       <table className="table table-bordered table-hover">
//                         <thead className="table-light">
//                           <tr>
//                             <th>Họ tên</th>
//                             <th>Email</th>
//                             <th>Hành động</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {nvTrongPB.map((nv) => (
//                             <tr key={nv.id}>
//                               <td>{nv.ho_ten}</td>
//                               <td>{nv.email}</td>
//                               <td className="text-center">
//                                 <Button
//                                   variant="danger"
//                                   size="sm"
//                                   onClick={() =>
//                                     handleDeleteNhanVienFromThuong(nv.id)
//                                   }
//                                 >
//                                   Xóa
//                                 </Button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   );
//                 })
//               )}
//             </Modal.Body>
//             <Modal.Footer>
//               <Button
//                 variant="secondary"
//                 onClick={() => setShowNhanVienModal(false)}
//               >
//                 Đóng
//               </Button>
//             </Modal.Footer>
//           </Modal>

//           {/* Modal thêm nhân viên (chỉ HR) */}
//           <Modal
//             show={showAddNhanVienModal}
//             onHide={() => {
//               setShowAddNhanVienModal(false);
//               setSelectedNhanVienIds([]);
//             }}
//             size="lg"
//           >
//             <Modal.Header closeButton>
//               <Modal.Title>Thêm nhân viên có thưởng</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//               {nhanVienList.length === 0 ? (
//                 <p className="text-muted">Đang tải danh sách nhân viên...</p>
//               ) : (
//                 <div
//                   style={{
//                     maxHeight: "500px",
//                     overflowY: "auto",
//                     border: "1px solid #ddd",
//                     padding: "10px",
//                     borderRadius: "5px",
//                   }}
//                 >
//                   {/* Checkbox tổng */}
//                   <div className="mb-3">
//                     <input
//                       type="checkbox"
//                       className="form-check-input"
//                       checked={selectedNhanVienIds.length === nhanVienList.length}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setSelectedNhanVienIds(nhanVienList.map((nv) => nv.id));
//                         } else {
//                           setSelectedNhanVienIds([]);
//                         }
//                       }}
//                     />
//                     <label className="form-check-label fw-bold ms-2">
//                       Chọn tất cả nhân viên
//                     </label>
//                   </div>

//                   {/* Lặp phòng ban */}
//                   {PhongBanList.map((pb) => {
//                     const nhanVienTrongPB = nhanVienList.filter(
//                       (nv) => nv.phong_ban_id === pb.id
//                     );
//                     const allChecked = nhanVienTrongPB.every((nv) =>
//                       selectedNhanVienIds.includes(nv.id)
//                     );

//                     return (
//                       <div key={pb.id} className="mb-4 border p-2 rounded">
//                         {/* Checkbox phòng ban */}
//                         <div className="form-check mb-2">
//                           <input
//                             type="checkbox"
//                             className="form-check-input"
//                             checked={allChecked}
//                             onChange={(e) => {
//                               if (e.target.checked) {
//                                 setSelectedNhanVienIds((prev) => [
//                                   ...new Set([
//                                     ...prev,
//                                     ...nhanVienTrongPB.map((nv) => nv.id),
//                                   ]),
//                                 ]);
//                               } else {
//                                 setSelectedNhanVienIds((prev) =>
//                                   prev.filter(
//                                     (id) =>
//                                       !nhanVienTrongPB.some((nv) => nv.id === id)
//                                   )
//                                 );
//                               }
//                             }}
//                           />
//                           <label className="form-check-label fw-bold ms-2">
//                             {pb.ten_phong_ban}
//                           </label>
//                         </div>

//                         {/* Danh sách nhân viên */}
//                         {nhanVienTrongPB.map((nv) => (
//                           <div key={nv.id} className="form-check ms-4">
//                             <input
//                               className="form-check-input"
//                               type="checkbox"
//                               value={nv.id}
//                               checked={selectedNhanVienIds.includes(nv.id)}
//                               onChange={(e) => handleSelectNhanVien(e, nv.id)}
//                             />
//                             <label className="form-check-label">
//                               {nv.ho_ten} - {nv.email}
//                             </label>
//                           </div>
//                         ))}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </Modal.Body>
//             <Modal.Footer>
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   setShowAddNhanVienModal(false);
//                   setSelectedNhanVienIds([]);
//                 }}
//               >
//                 Đóng
//               </Button>
//               <Button variant="primary" onClick={handleAddNhanVienToThuong}>
//                 Xác nhận
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Thuong;
