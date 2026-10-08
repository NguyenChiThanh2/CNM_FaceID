import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button, Breadcrumb, Spinner, Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaHome, FaPlus, FaBuilding, FaUsers } from "react-icons/fa";
import PhongBanForm from "../../components/phongban/PhongBanForm";
import PhongBanList from "../../components/phongban/PhongBanList";
import { getAllPhongBan, deletePhongBan, getPhongBanById } from "../../services/phongBanApi";
import Loading from "../../../src/components/Loading";
import { getNhanVienInfo, isHrOrAdmin } from "../../utils/auth";
const QuanLyPhongBan = () => {
  // ====== PHÂN QUYỀN ======
  const currentUser = getNhanVienInfo();
  const isHR = isHrOrAdmin(currentUser);

  // Cho phép thêm/sửa/xoá: HR hoặc Admin (isHR đã gộp cả 2 trường hợp)
  const canAdd = isHR;
  const canEditDelete = isHR;

  const [phongBanList, setPhongBanList] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPhongBan = async () => {
    setLoading(true);
    try {
      if (canAdd) {
        // HR/Admin thấy tất cả
        const data = await getAllPhongBan();
        setPhongBanList(Array.isArray(data) ? data : []);
      } else if (currentUser?.phong_ban_id) {
        // Nhân viên thường: chỉ phòng ban của mình
        try {
          const one = await getPhongBanById(currentUser.phong_ban_id);
          setPhongBanList(one ? [one] : []);
        } catch {
          setPhongBanList([]);
        }
      } else {
        setPhongBanList([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải phòng ban:", err);
      toast.error("Không thể tải danh sách phòng ban!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhongBan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    if (!canAdd) {
      toast.error("Bạn không có quyền thêm phòng ban.");
      return;
    }
    setSelectedPhongBan(null);
    setShowModal(true);
  };

  const handleEdit = (phongBan) => {
    if (!canEditDelete) {
      toast.error("Bạn không có quyền sửa phòng ban.");
      return;
    }
    setSelectedPhongBan(phongBan);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!canEditDelete) {
      toast.error("Bạn không có quyền xóa phòng ban.");
      return;
    }
    if (window.confirm("Bạn có chắc muốn xóa phòng ban này không?")) {
      try {
        await toast.promise(deletePhongBan(id), {
          pending: "Đang xóa phòng ban...",
          success: "Đã xóa phòng ban!",
          error: "Xóa phòng ban thất bại!, có thể phòng ban đang có nhân viên.",
        });
        fetchPhongBan();
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
      }
    }
  };

  const handleViewNhanVien = (phongBanId) => {
    // nhân viên thường chỉ được xem trang chi tiết phòng ban của chính mình
    if (!isHR && phongBanId !== currentUser?.phong_ban_id) {
      toast.error("Bạn không có quyền xem phòng ban này.");
      return;
    }
    navigate(`/get-phong-ban-by-id/${phongBanId}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPhongBan(null);
  };

  const handleFormSubmit = (message) => {
    fetchPhongBan();
    toast.success(
      message ||
      (selectedPhongBan
        ? "Cập nhật phòng ban thành công!"
        : "Thêm phòng ban thành công!")
    );
    handleModalClose();
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
              <Breadcrumb.Item  active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Quản lý phòng ban
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">🏢 Quản lý Phòng ban</h1>
            <p className="mb-0 opacity-90">
              Quản lý thông tin và cấu trúc tổ chức các phòng ban trong công ty
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

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-primary mb-2">
                <FaBuilding />
              </div>
              <h4 className="fw-bold">{phongBanList.length}</h4>
              <p className="text-muted mb-0">Tổng số phòng ban</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-success mb-2">
                <FaUsers />
              </div>
              <h4 className="fw-bold">
                {phongBanList.reduce((total, pb) => total + (pb.so_luong_nhan_vien || 0), 0)}
              </h4>
              <p className="text-muted mb-0">Tổng số nhân viên</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-warning mb-2">
                ⚙️
              </div>
              <h4 className="fw-bold">
                {canAdd ? "Toàn quyền" : canEditDelete ? "HR" : "Xem"}
              </h4>
              <p className="text-muted mb-0">Quyền truy cập</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Actions Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaBuilding className="me-2" />
          Danh sách Phòng ban
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col>
              <h6 className="mb-0 text-muted">
                Hiển thị {phongBanList.length} phòng ban
                {!canAdd && " (chỉ phòng ban của bạn)"}
              </h6>
            </Col>
            <Col xs="auto">
              {canAdd && (
                <Button
                  variant="primary"
                  onClick={handleAdd}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none"
                  }}
                >
                  <FaPlus className="me-2" />
                  Thêm phòng ban
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <div className="mt-3 fw-semibold">Đang tải dữ liệu phòng ban...</div>
            </div>
          ) : (
            <PhongBanList
              list={phongBanList}
              onEdit={canEditDelete ? handleEdit : undefined}
              onDelete={canEditDelete ? handleDelete : undefined}
              onViewNhanVien={handleViewNhanVien}
              showActions={canEditDelete}
            />
          )}
        </Card.Body>
      </Card>

      {/* Modal Form */}
      <Modal show={showModal} onHide={handleModalClose} size="lg" centered className="rounded-4">
        <Modal.Header 
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Modal.Title>
            <FaBuilding className="me-2" />
            {selectedPhongBan ? "Chỉnh sửa phòng ban" : "Thêm phòng ban"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <PhongBanForm
            editingPhongBan={selectedPhongBan}
            onSaved={handleFormSubmit}
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

export default QuanLyPhongBan;