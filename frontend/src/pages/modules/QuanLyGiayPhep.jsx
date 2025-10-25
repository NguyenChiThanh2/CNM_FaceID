// src/pages/modules/QuanLyGiayPhep.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import GiayPhepForm from "../../components/giayphep/GiayPhepForm";
import { Modal, Button, Table, Breadcrumb, Card, Row, Col, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";
import "react-toastify/dist/ReactToastify.css";
import { getNhanVienInfo } from "../../utils/auth";
import { FaHome, FaSearch, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaFileAlt } from "react-icons/fa";

const API_URL = "http://127.0.0.1:5000/api";
const HR_DEPARTMENT_ID = 2;

const QuanLyGiayPhep = () => {
  const [giayPhepList, setGiayPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingGiayPhep, setEditingGiayPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hardLoading, setHardLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const [currentUser] = useState(() => getNhanVienInfo());
  const userId = currentUser?.id ?? null;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  useEffect(() => {
    if (userId == null) navigate("/dang-nhap", { replace: true });
  }, [userId, navigate]);

  const isOwner = useCallback((gp) => !!userId && gp?.nhan_vien_id === userId, [userId]);
  const canCreate = useCallback(() => !!currentUser, [currentUser]);
  const canEdit = useCallback(
    (gp) =>
      (isHR && gp.trang_thai === "Chưa duyệt") ||
      (!isHR && isOwner(gp) && gp.trang_thai === "Chưa duyệt"),
    [isHR, isOwner]
  );
  const canCancel = useCallback(
    (gp) =>
      (isHR && (gp.trang_thai === "Chưa duyệt" || gp.trang_thai === "Từ chối")) ||
      (!isHR && isOwner(gp) && (gp.trang_thai === "Chưa duyệt" || gp.trang_thai === "Từ chối")),
    [isHR, isOwner]
  );
  const canApproveReject = useCallback((gp) => isHR && gp.trang_thai === "Chưa duyệt", [isHR]);
  const deny = () => toast.error("Bạn không có quyền thực hiện thao tác này!");

  const fetchNhanVien = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(Array.isArray(resp.data) ? resp.data : []);
    } catch (error) {
      console.error("Lỗi khi gọi API nhân viên:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nhân viên!");
    }
  }, []);

  const fetchGiayPhep = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/get-all-giay-phep`);
      let list = resp.data || [];
      if (userId && !isHR) {
        list = list.filter((gp) => gp.nhan_vien_id === userId);
      }
      setGiayPhepList(list);
    } catch (e) {
      console.error("Lỗi khi gọi API giấy phép:", e);
      toast.error("Không có giấy phép nào được tìm thấy!");
    } finally {
      setLoading(false);
      setHardLoading(false);
    }
  }, [userId, isHR]);

  useEffect(() => {
    if (userId == null) return;
    (async () => {
      await Promise.all([fetchGiayPhep(), fetchNhanVien()]);
    })();
  }, [userId, isHR, fetchGiayPhep, fetchNhanVien]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterTrangThai]);

  const handleAdd = () => {
    if (!canCreate()) return deny();
    setEditingGiayPhep(null);
    setShowModal(true);
  };

  const handleEdit = (gp) => {
    if (!canEdit(gp)) return deny();
    setEditingGiayPhep(gp);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canCancel(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn hủy giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/cancel-giay-phep/${id}`);
      toast.success("Đã hủy giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi hủy giấy phép:", error);
      toast.error("Có lỗi xảy ra khi hủy giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleDuyet = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canApproveReject(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn duyệt giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.put(`${API_URL}/approve-giay-phep/${id}`);
      toast.success("Đã duyệt giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi duyệt giấy phép:", error);
      toast.error("Có lỗi xảy ra khi duyệt giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleTuChoi = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canApproveReject(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn từ chối giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.put(`${API_URL}/reject-giay-phep/${id}`);
      toast.success("Đã từ chối giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi từ chối giấy phép:", error);
      toast.error("Có lỗi xảy ra khi từ chối giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingGiayPhep(null);
  };

  const handleFormSubmit = () => {
    fetchGiayPhep();
    handleModalClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  const nhanVienMap = useMemo(
    () =>
      nhanVienList.reduce((acc, nv) => {
        acc[nv.id] = (nv.ho_ten || "").toLowerCase();
        return acc;
      }, {}),
    [nhanVienList]
  );

  const normalizedKeyword = (searchKeyword || "").toLowerCase();

  const filteredList = useMemo(() => {
    return (giayPhepList || []).filter((gp) => {
      const lyDo = (gp.ly_do || "").toLowerCase();
      const nhanVienName = nhanVienMap[gp.nhan_vien_id] || "";
      const searchMatch = lyDo.includes(normalizedKeyword) || nhanVienName.includes(normalizedKeyword);
      const statusMatch = filterTrangThai ? gp.trang_thai === filterTrangThai : true;
      return searchMatch && statusMatch;
    });
  }, [giayPhepList, nhanVienMap, normalizedKeyword, filterTrangThai]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  if (!currentUser) return null;

  if (hardLoading) {
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );
  }

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
                Quản lý giấy phép
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">📄 Quản lý Giấy Phép</h1>
            <p className="mb-0 opacity-90">
              Quản lý và phê duyệt các đơn xin giấy phép của nhân viên
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
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Đã hủy">Đã hủy</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              {canCreate() && (
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
          <FaFileAlt className="me-2" />
          Danh sách Giấy Phép
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
            <Table bordered hover className="mb-0" style={{ minWidth: "1200px" }}>
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
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "180px" }}>Nhân viên</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "120px" }}>Từ ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "120px" }}>Đến ngày</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "150px" }}>Loại giấy phép</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "180px" }}>Số giờ / Tính lại ngày công</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "200px" }}>Lý do</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "120px" }}>Trạng thái</th>
                  <th style={{ padding: "12px", fontWeight: "600", minWidth: "180px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((gp) => (
                    <tr key={gp.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{gp.id}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        {nhanVienList.find((nv) => nv.id === gp.nhan_vien_id)?.ho_ten || "Không rõ"}
                      </td>
                      <td style={{ padding: "12px" }}>{formatDate(gp.ngay_bat_dau)}</td>
                      <td style={{ padding: "12px" }}>{formatDate(gp.ngay_ket_thuc)}</td>
                      <td style={{ padding: "12px" }}>{gp.loai_giay_phep}</td>
                      <td style={{ padding: "12px" }}>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          {gp.so_gio === 4 ? "Nửa ngày công" : gp.so_gio === 8 ? "1 ngày công" : `${gp.so_gio} giờ`}
                        </span>
                      </td>
                      <td style={{ padding: "12px", maxWidth: "200px" }}>
                        <div className="text-truncate" title={gp.ly_do}>
                          {gp.ly_do}
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span
                          className={`badge ${
                            gp.trang_thai === "Chưa duyệt"
                              ? "bg-warning text-dark"
                              : gp.trang_thai === "Đã duyệt"
                                ? "bg-success"
                                : gp.trang_thai === "Từ chối"
                                  ? "bg-danger"
                                  : "bg-secondary"
                          }`}
                        >
                          {gp.trang_thai}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex gap-1 flex-wrap">
                          {canApproveReject(gp) && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleDuyet(gp.id)}
                                disabled={loading}
                                title="Duyệt giấy phép"
                              >
                                <FaCheck />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleTuChoi(gp.id)}
                                disabled={loading}
                                title="Từ chối giấy phép"
                              >
                                <FaTimes />
                              </Button>
                            </>
                          )}
                          {canCancel(gp) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(gp.id)}
                              disabled={loading}
                              title="Hủy giấy phép"
                            >
                              <FaTrash />
                            </Button>
                          )}
                          {canEdit(gp) && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleEdit(gp)}
                              disabled={loading}
                              title="Sửa giấy phép"
                            >
                              <FaEdit />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <FaFileAlt size={32} className="mb-2 opacity-50" />
                      <br />
                      Không có giấy phép nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <Card className="shadow-sm border-0 rounded-4 mt-4">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-center align-items-center gap-3">
              <Button
                variant="outline-primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
            {editingGiayPhep ? "Chỉnh sửa giấy phép" : "Thêm giấy phép"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <GiayPhepForm
            onAdded={handleFormSubmit}
            editingGiayPhep={editingGiayPhep}
            setEditingGiayPhep={setEditingGiayPhep}
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

export default QuanLyGiayPhep;