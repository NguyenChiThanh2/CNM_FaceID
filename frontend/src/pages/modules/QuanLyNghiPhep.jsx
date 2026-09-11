// src/pages/modules/QuanLyNghiPhep.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import NghiPhepForm from "../../components/nghiphep/NghiPhepForm";
import { Modal, Button, Table, Breadcrumb, Card, Row, Col, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";
import { FaHome, FaSearch, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaFileAlt, FaBaby } from "react-icons/fa";

const HR_DEPARTMENT_ID = 2;

const getUserInfo = () => {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const nv = parsed.nhan_vien || {};
    return {
      id: nv.id,
      ho_ten: nv.ho_ten,
      phong_ban_id: nv.phong_ban_id,
      ten_phong_ban: nv.ten_phong_ban || "",
      role: parsed.role?.ma_vai_tro || "user",
    };
  } catch {
    return null;
  }
};

const QuanLyNghiPhep = () => {
  const [nghiPhepList, setNghiPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingNghiPhep, setEditingNghiPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loaiNghiPhepList, setLoaiNghiPhepList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchNghiPhep();
    fetchNhanVien();
    fetchLoaiNghiPhep();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterTrangThai]);

  const fetchNghiPhep = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get-all-nghi-phep`);
      let list = response.data || [];

      if (userInfo && !isHR) {
        list = list.filter((np) => np.nhan_vien_id === userInfo.id);
      }

      setNghiPhepList(list);
    } catch (error) {
      console.error("Lỗi khi gọi API nghỉ phép:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nghỉ phép!");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/get-all-nhan-vien`);
      setNhanVienList(response.data || []);
    } catch (error) {
      console.error("Lỗi khi gọi API nhân viên:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nhân viên!");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoaiNghiPhep = async () => {
    try {
      const response = await axiosInstance.get(`/loai-nghi-phep`);
      setLoaiNghiPhepList(response.data || []);
    } catch (error) {
      console.error("Lỗi khi gọi API loại nghỉ phép:", error);
    }
  };

  const handleAdd = () => {
    setEditingNghiPhep(null);
    setShowModal(true);
  };

  const handleEdit = (nghiPhep) => {
    setEditingNghiPhep(nghiPhep);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axiosInstance.delete(`/delete-nghi-phep/${id}`), {
        pending: "Đang hủy đơn...",
        success: "Đã hủy đơn nghỉ phép!",
        error: "Hủy đơn thất bại!",
      });
      fetchNghiPhep();
    } catch (error) {
      console.error("Lỗi khi hủy đơn nghỉ phép:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuyet = async (id) => {
    if (!window.confirm("Bạn có chắc muốn duyệt đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axiosInstance.put(`/approve-nghi-phep/${id}`), {
        pending: "Đang duyệt...",
        success: "Đã duyệt đơn nghỉ phép!",
        error: "Duyệt đơn thất bại!",
      });
      fetchNghiPhep();
      fetchNhanVien();
    } catch (error) {
      console.error("Lỗi khi duyệt đơn nghỉ phép:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTuChoi = async (id) => {
    if (!window.confirm("Bạn có chắc muốn từ chối đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axiosInstance.put(`/reject-nghi-phep/${id}`), {
        pending: "Đang từ chối...",
        success: "Đã từ chối đơn nghỉ phép!",
        error: "Từ chối đơn thất bại!",
      });
      fetchNghiPhep();
    } catch (error) {
      console.error("Lỗi khi từ chối đơn nghỉ phép:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNghiPhep(null);
  };

  const handleFormSubmit = () => {
    fetchNghiPhep();
    toast.success(
      editingNghiPhep
        ? "Cập nhật đơn nghỉ phép thành công!"
        : "Tạo đơn nghỉ phép thành công!"
    );
    handleModalClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  const nhanVienMap = nhanVienList.reduce((acc, nv) => {
    acc[nv.id] = (nv.ho_ten || "").toLowerCase();
    return acc;
  }, {});

  const filteredList = nghiPhepList.filter((np) => {
    const lyDo = (np.ly_do || "").toLowerCase();
    const searchKey = (searchKeyword || "").toLowerCase();
    const searchMatch =
      lyDo.includes(searchKey) ||
      (nhanVienMap[np.nhan_vien_id] &&
        nhanVienMap[np.nhan_vien_id].includes(searchKey));
    const statusMatch = filterTrangThai
      ? np.trang_thai === filterTrangThai
      : true;
    return searchMatch && statusMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const userInfo = getUserInfo();
  const isHR = !!userInfo && userInfo.phong_ban_id === HR_DEPARTMENT_ID;

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
              <Breadcrumb.Item 
                 active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Quản lý nghỉ phép
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">📋 Quản lý Đơn Nghỉ Phép</h1>
            <p className="mb-0 opacity-90">
              Quản lý và phê duyệt các đơn xin nghỉ phép của nhân viên
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
                  placeholder="Tìm theo tên nhân viên hoặc lý do..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </Col>
            <Col md={4}>
              <Form.Select
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Đã hủy">Đã hủy</option>
              </Form.Select>
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
                  Thêm đơn
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Regular Leave Table */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          📅 Đơn Nghỉ Phép Thông Thường
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "600px" }}>
            <Table bordered hover className="mb-2" style={{ minWidth: "1500px" }}>
              <thead
                style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                  color: "white"
                }}
              >
                <tr>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Nhân viên</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Từ ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Đến ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Loại nghỉ</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Số ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Lý do</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Trạng thái</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>File đính kèm</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((nghiPhep) =>
                    !nghiPhep.yeu_cau_thong_tin_sinh ? (
                      <tr key={nghiPhep.id} style={{ transition: "all 0.3s ease" }}>
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {nhanVienList.find((nv) => nv.id === nghiPhep.nhan_vien_id)?.ho_ten || "Không rõ"}
                        </td>
                        <td style={{ padding: "12px" }}>{formatDate(nghiPhep.tu_ngay)}</td>
                        <td style={{ padding: "12px" }}>{formatDate(nghiPhep.den_ngay)}</td>
                        <td style={{ padding: "12px" }}>{nghiPhep.loai_nghi_phep}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span className="badge bg-primary bg-opacity-10 text-primary">
                            {nghiPhep.so_ngay_nghi} ngày
                          </span>
                        </td>
                        <td style={{ padding: "12px", maxWidth: "200px" }}>
                          <div className="text-truncate" title={nghiPhep.ly_do}>
                            {nghiPhep.ly_do}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            className={`badge ${
                              nghiPhep.trang_thai === "Chờ duyệt"
                                ? "bg-warning text-dark"
                                : nghiPhep.trang_thai === "Đã duyệt"
                                ? "bg-success"
                                : nghiPhep.trang_thai === "Từ chối"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {nghiPhep.trang_thai}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {nghiPhep.can_cu_phap_ly_file ? (
                            <a
                              href={`${axiosInstance.defaults.baseURL}/can_cu_phap_ly_${nghiPhep.loai_nghi_phep_id === 1 ? 'phep_nam' : nghiPhep.loai_nghi_phep_id === 2 ? 'phep_kl' : 'thai_san'}/${nghiPhep.can_cu_phap_ly_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              {nghiPhep.can_cu_phap_ly_file}
                              
                            </a>
                          ) : (
                            <span className="text-muted">Không có</span>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex gap-1 flex-wrap">
                            {isHR && nghiPhep.trang_thai === "Chờ duyệt" && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleDuyet(nghiPhep.id)}
                                >
                                  <FaCheck />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleTuChoi(nghiPhep.id)}
                                >
                                  <FaTimes />
                                </Button>
                              </>
                            )}
                            {(isHR || (!isHR && nghiPhep.nhan_vien_id === userInfo?.id)) && 
                             nghiPhep.trang_thai === "Chờ duyệt" && (
                              <>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEdit(nghiPhep)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(nghiPhep.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null
                  )
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <FaFileAlt size={32} className="mb-2 opacity-50" /><br />
                      Không có đơn nghỉ phép thông thường nào
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Maternity Leave Table */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaBaby className="me-2" />
          Đơn Nghỉ Thai Sản
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "600px" }}>
            <Table bordered hover className="mb-2" style={{ minWidth: "1500px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Nhân viên</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Ngày dự sinh</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Từ ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Đến ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Số ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Số con</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Phương pháp</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>File đính kèm</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Lý do</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Trạng thái</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((nghiPhep) =>
                    nghiPhep.yeu_cau_thong_tin_sinh ? (
                      <tr key={nghiPhep.id} style={{ transition: "all 0.3s ease" }}>
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {nhanVienList.find((nv) => nv.id === nghiPhep.nhan_vien_id)?.ho_ten || "Không rõ"}
                        </td>
                        <td style={{ padding: "12px" }}>{nghiPhep.ngay_du_kien_sinh}</td>
                        <td style={{ padding: "12px" }}>{formatDate(nghiPhep.tu_ngay)}</td>
                        <td style={{ padding: "12px" }}>{formatDate(nghiPhep.den_ngay)}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span className="badge bg-primary bg-opacity-10 text-primary">
                            {nghiPhep.so_ngay_nghi} ngày
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span className="badge bg-info bg-opacity-10 text-info">
                            {nghiPhep.so_con}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{nghiPhep.phuong_phap_sinh}</td>
                        <td style={{ padding: "12px" }}>
                          {nghiPhep.can_cu_phap_ly_file ? (
                            <a
                              href={`${axiosInstance.defaults.baseURL}/can_cu_phap_ly_thai_san/${nghiPhep.can_cu_phap_ly_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              {nghiPhep.can_cu_phap_ly_file}
                            </a>
                          ) : (
                            <span className="text-muted">Không có</span>
                          )}
                          {nghiPhep.file_bo_sung ? (
                            <a
                              href={`${axiosInstance.defaults.baseURL}/can_cu_phap_ly_thai_san/${nghiPhep.file_bo_sung}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              {nghiPhep.file_bo_sung}
                            </a>
                          ) : (
                            <span className="text-muted"></span>
                          )}
                        </td>
                        <td style={{ padding: "12px", maxWidth: "150px" }}>
                          <div className="text-truncate" title={nghiPhep.ly_do}>
                            {nghiPhep.ly_do}
                          </div>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span
                            className={`badge ${
                              nghiPhep.trang_thai === "Chờ duyệt"
                                ? "bg-warning text-dark"
                                : nghiPhep.trang_thai === "Đã duyệt"
                                ? "bg-success"
                                : nghiPhep.trang_thai === "Từ chối"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {nghiPhep.trang_thai}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div className="d-flex gap-1 flex-wrap">
                            {isHR && nghiPhep.trang_thai === "Chờ duyệt" && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleDuyet(nghiPhep.id)}
                                >
                                  <FaCheck />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleTuChoi(nghiPhep.id)}
                                >
                                  <FaTimes />
                                </Button>
                              </>
                            )}
                            {isHR && nghiPhep.trang_thai === "Đã duyệt" && (
                              <>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleEdit(nghiPhep)}
                                >
                                  xin làm sớm
                                </Button>
                                
                              </>
                            )}
                            {(isHR || (!isHR && nghiPhep.nhan_vien_id === userInfo?.id)) && 
                             nghiPhep.trang_thai === "Chờ duyệt" && (
                              <>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEdit(nghiPhep)}
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(nghiPhep.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null
                  )
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted py-4">
                      <FaFileAlt size={32} className="mb-2 opacity-50" /><br />
                      Không có đơn nghỉ thai sản nào
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

      {/* Modal */}
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
            {editingNghiPhep ? "Chỉnh sửa đơn nghỉ phép" : "Thêm đơn nghỉ phép"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <NghiPhepForm
            onAdded={handleFormSubmit}
            editingNghiPhep={editingNghiPhep}
            setEditingNghiPhep={setEditingNghiPhep}
            nhanVienList={nhanVienList}
            loaiNghiPhepList={loaiNghiPhepList}
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

export default QuanLyNghiPhep;