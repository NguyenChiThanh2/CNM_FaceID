// src/pages/modules/KhauTru.jsx
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
  Spinner 
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import KhauTruForm from "../../components/khautru/KhauTruForm";
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
  FaFileDownload,
  FaMoneyBillWave 
} from "react-icons/fa";

const KhauTru = () => {
  // Lấy user từ localStorage
  const raw = localStorage.getItem("user");
  let currentUser = null;
  try {
    currentUser = raw ? JSON.parse(raw)?.nhan_vien : null;
  } catch {
    currentUser = null;
  }

  // Phân quyền: HR = phòng ban 2
  const HR_DEPARTMENT_ID = 2;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  const [khautruList, setKhauTruList] = useState([]);
  const [selectedKhauTru, setSelectedKhauTru] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showNhanVienModal, setShowNhanVienModal] = useState(false);
  const [selectedNhanVien, setSelectedNhanVien] = useState([]);
  const [showAddNhanVienModal, setShowAddNhanVienModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [selectedNhanVienIds, setSelectedNhanVienIds] = useState([]);
  const [selectedKhauTruId, setSelectedKhauTruId] = useState(null);
  const [PhongBanList, setPhongBanList] = useState([]);
  const [soTienThucTe, setSoTienThucTe] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Format helpers
  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d instanceof Date && !isNaN(d) ? d.toLocaleDateString("vi-VN") : "Ngày không hợp lệ";
  };

  // Fetch theo quyền
  const fetchKhauTruList = async () => {
    setLoading(true);
    try {
      if (!isHR && !currentUser?.id) {
        setKhauTruList([]);
        toast.error("Không xác định được người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      let url = `/get-all-khau-tru`;
      if (!isHR) {
        url = `/get-khau-tru-by-nhan-vien-id/${currentUser.id}`;
      }

      const res = await axiosInstance.get(url);
      setKhauTruList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi khi tải khấu trừ:", err);
      toast.error(String(err?.message || "Không thể tải danh sách khấu trừ!"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhauTruList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHR, currentUser?.id]);

  // Tìm kiếm an toàn
  const filteredList = khautruList.filter((pl) => {
    const kw = (searchKeyword || "").toLowerCase();
    const name = (pl.ten_khau_tru || "").toLowerCase();
    const dateStr = String(pl.ngay_quyet_dinh || "").toLowerCase();
    return name.includes(kw) || dateStr.includes(kw);
  });

  // Phân trang
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Handlers (có chặn non-HR)
  const handleAdd = () => {
    if (!isHR) return;
    setSelectedKhauTru(null);
    setShowModal(true);
  };

  const handleEdit = (pl) => {
    if (!isHR) return;
    setSelectedKhauTru(pl);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!isHR) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      setLoading(true);
      try {
        await axiosInstance.delete(`/delete-khau-tru/${id}`);
        await fetchKhauTruList();
        toast.success("Xóa khấu trừ thành công!");
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        toast.error("❌ Lỗi khi xóa khấu trừ!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = (message) => {
    fetchKhauTruList();
    setShowModal(false);
    toast.success(message || "Cập nhật khấu trừ thành công!");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredList.map((item) => ({
        "Tên khấu trừ": item.ten_khau_tru,
        "Ngày quyết định": item.ngay_quyet_dinh,
        "Giá trị": item.so_tien,
        Loại: item.loai_khau_tru,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "KhauTru");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, "DanhSachKhauTru.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch (e) {
      toast.error("❌ Xuất Excel thất bại!", e);
    }
  };

  // 👉 Xem nhân viên (HR-only)
  const handleViewNhanVien = async (khautruId) => {
    if (!isHR) return;
    setLoading(true);
    try {
      const respb = await axiosInstance.get(`/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axiosInstance.get(`/get-all-nhan-vien-by-khau-tru-id/${khautruId}`);
      setSelectedNhanVien(Array.isArray(res.data) ? res.data : []);
      setSelectedKhauTruId(khautruId);
    } catch (err) {
      toast.error("Lỗi kết nối !");
      console.error("Lỗi khi lấy nhân viên:", err);
      setSelectedNhanVien([]);
    } finally {
      setShowNhanVienModal(true);
      setLoading(false);
    }
  };

  // 👉 Xóa NV khỏi khấu trừ (HR-only)
  const handleDeleteNhanVienFromKhauTru = async (nhanVienId) => {
    if (!isHR || !selectedKhauTruId) return;
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi khấu trừ?")) {
      setLoading(true);
      try {
        await axiosInstance.post(`/remove-nhan-vien-from-khau-tru`, {
          khautru_id: selectedKhauTruId,
          nhan_vien_id: nhanVienId,
        });
        await handleViewNhanVien(selectedKhauTruId);
        toast.success("Đã xóa nhân viên khỏi khấu trừ.");
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        toast.error("Không thể xóa nhân viên.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 👉 Mở modal thêm NV (HR-only)
  const handleShowAddNhanVienModal = async (khautruId) => {
    if (!isHR) return;
    setLoading(true);
    try {
      const respb = await axiosInstance.get(`/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axiosInstance.get(`/get-all-nhan-vien`);
      const resSelected = await axiosInstance.get(`/get-all-nhan-vien-by-khau-tru-id/${khautruId}`);

      if (Array.isArray(resSelected.data) && resSelected.data.length > 0) {
        const selectedIds = resSelected.data.map((nv) => nv.id);
        const soTienMap = {};
        resSelected.data.forEach((nv) => {
          if (nv.so_tien_thuc_te) {
            soTienMap[nv.id] = nv.so_tien_thuc_te;
          }
        });
        setSelectedNhanVienIds(selectedIds);
        setSoTienThucTe(soTienMap);
      } else {
        setSelectedNhanVienIds([]);
        setSoTienThucTe({});
      }

      setNhanVienList(res.data);
      setSelectedKhauTruId(khautruId);
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

  const handleChangeSoTien = (id, value) => {
    setSoTienThucTe((prev) => ({ ...prev, [id]: value }));
  };

  // 👉 Thêm NV vào khấu trừ (HR-only)
  const handleAddNhanVienToKhauTru = async () => {
    if (!isHR || !selectedKhauTruId) return;
    setLoading(true);
    try {
      const payload = {
        khautru_id: selectedKhauTruId,
        nhan_vien: selectedNhanVienIds.map((id) => {
          const soTien = soTienThucTe[id];
          return soTien ? { id, so_tien_thuc_te: parseFloat(soTien) } : { id };
        }),
      };
      await axiosInstance.post(`/add-nhan-vien-to-khau-tru`, { payload });
      toast.success("Đã thêm nhân viên vào khấu trừ.");
      setShowAddNhanVienModal(false);
      setSelectedNhanVienIds([]);
    } catch (err) {
      console.error("Lỗi thêm nhân viên:", err);
      toast.error("Không thể thêm nhân viên.");
    } finally {
      setLoading(false);
    }
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
                Quản lý khấu trừ
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">💰 Quản lý Khấu Trừ</h1>
            <p className="mb-0 opacity-90">
              Quản lý các khoản khấu trừ lương và phúc lợi của nhân viên
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
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none"
                  }}
                >
                  <FaPlus className="me-2" />
                  Thêm mới
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
            fontSize: "1.1rem"
          }}
        >
          <FaMoneyBillWave className="me-2" />
          Danh sách Khấu Trừ
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
            <Table bordered hover className="mb-2" style={{ minWidth: "1200px" }}>
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
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "200px" }}>Tên khấu trừ</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "180px" }}>Mục đích khấu trừ</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Số tiền</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Ngày quyết định</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "200px" }}>Ghi chú</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>File giấy tờ</th>
                  {isHR && <th style={{ padding: "12px", fontWeight: "600", minWidth: "250px" }}>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((pl) => (
                    <tr key={pl.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{pl.ten_khau_tru}</td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge bg-danger bg-opacity-10 text-danger">
                          {{
                            VI_PHAM: "Trừ vi phạm",
                            UNG_LUONG: "Trừ ứng lương",
                            TRU_KHAC: "Khấu trừ khác",
                          }[pl.loai_khau_tru] || "Không xác định"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#dc3545" }}>
                        {formatCurrency(pl.so_tien)}
                      </td>
                      <td style={{ padding: "12px" }}>{formatDate(pl.ngay_quyet_dinh)}</td>
                      <td style={{ padding: "12px", maxWidth: "200px" }}>
                        <div className="text-truncate" title={pl.ghi_chu}>
                          {pl.ghi_chu || "Không có ghi chú"}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {pl.file_dinh_kem ? (
                          <a
                            href={`${axiosInstance.defaults.baseURL}/file_dinh_kem_khau_tru/${pl.file_dinh_kem}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            {pl.file_dinh_kem}
                          </a>
                        ) : (
                          <span className="text-muted">Không có</span>
                        )}
                      </td>
                      {isHR && (
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex gap-1 flex-wrap">
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEdit(pl)}
                              title="Sửa khấu trừ"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(pl.id)}
                              title="Xóa khấu trừ"
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
                              onClick={() => handleShowAddNhanVienModal(pl.id)}
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
                    <td colSpan={isHR ? 7 : 6} className="text-center text-muted py-4">
                      <FaMoneyBillWave size={32} className="mb-2 opacity-50" />
                      <br />
                      Không có đơn khấu trừ nào phù hợp
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

      {/* Modal thêm/sửa khấu trừ */}
      {isHR && (
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
              color: "white"
            }}
          >
            <Modal.Title>
              {selectedKhauTru ? "✏️ Cập nhật khấu trừ" : "➕ Thêm khấu trừ"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <KhauTruForm
              selected={selectedKhauTru}
              onAdded={handleFormSubmit}
              onClose={() => setShowModal(false)}
              fetchKhauTruList={fetchKhauTruList}
              editingKhauTru={selectedKhauTru}
              setEditingKhauTru={setSelectedKhauTru}
            />
          </Modal.Body>
        </Modal>
      )}

      {/* Modal danh sách nhân viên */}
      {isHR && (
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
              color: "white"
            }}
          >
            <Modal.Title>
              <FaUsers className="me-2" />
              Danh sách nhân viên bị khấu trừ
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedNhanVien.length === 0 ? (
              <div className="text-center text-muted py-4">
                <FaUsers size={48} className="mb-3 opacity-50" />
                <p>Không có nhân viên nào bị khấu trừ.</p>
              </div>
            ) : (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {PhongBanList.map((pb) => {
                  const nvTrongPB = selectedNhanVien.filter((nv) => nv.phong_ban_id === pb.id);
                  if (nvTrongPB.length === 0) return null;

                  return (
                    <Card key={pb.id} className="mb-3 border-0 shadow-sm">
                      <Card.Header 
                        style={{
                          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          fontWeight: "600"
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
                              <th style={{ padding: "10px", minWidth: "180px" }}>Số tiền thực tế</th>
                              <th style={{ padding: "10px", width: "100px" }}>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nvTrongPB.map((nv) => (
                              <tr key={nv.id}>
                                <td style={{ padding: "10px" }}>{nv.ho_ten}</td>
                                <td style={{ padding: "10px" }}>{nv.email}</td>
                                <td style={{ padding: "10px", fontWeight: "500", color: "#dc3545" }}>
                                  {nv.so_tien_thuc_te ? formatCurrency(nv.so_tien_thuc_te) : formatCurrency(0)}
                                </td>
                                <td style={{ padding: "10px", textAlign: "center" }}>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteNhanVienFromKhauTru(nv.id)}
                                    title="Xóa khỏi khấu trừ"
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
            <Button variant="outline-secondary" onClick={() => setShowNhanVienModal(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Modal thêm nhân viên */}
      {isHR && (
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
              color: "white"
            }}
          >
            <Modal.Title>
              <FaUserPlus className="me-2" />
              Thêm nhân viên bị khấu trừ
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
                  const nhanVienTrongPB = nhanVienList.filter((nv) => nv.phong_ban_id === pb.id);
                  const allChecked = nhanVienTrongPB.every((nv) => selectedNhanVienIds.includes(nv.id));

                  return (
                    <Card key={pb.id} className="mb-3 border-0 shadow-sm">
                      <Card.Header 
                        style={{
                          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                          padding: "10px 15px"
                        }}
                      >
                        <Form.Check
                          type="checkbox"
                          label={pb.ten_phong_ban}
                          checked={allChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNhanVienIds((prev) => [
                                ...new Set([...prev, ...nhanVienTrongPB.map((nv) => nv.id)]),
                              ]);
                            } else {
                              setSelectedNhanVienIds((prev) =>
                                prev.filter((id) => !nhanVienTrongPB.some((nv) => nv.id === id))
                              );
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
                                  onChange={(e) => handleSelectNhanVien(e, nv.id)}
                                />
                              </div>
                              {khautruList.find((kt) => kt.id === selectedKhauTruId)?.loai_khau_tru ===
                                "UNG_LUONG" &&
                                selectedNhanVienIds.includes(nv.id) && (
                                  <div className="col-md-4 col-12 mt-2 mt-md-0">
                                    <Form.Control
                                      type="number"
                                      placeholder="Số tiền thực tế"
                                      value={soTienThucTe[nv.id] || ""}
                                      onChange={(e) => handleChangeSoTien(nv.id, e.target.value)}
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
              onClick={handleAddNhanVienToKhauTru}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none"
              }}
            >
              Xác nhận
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default KhauTru;