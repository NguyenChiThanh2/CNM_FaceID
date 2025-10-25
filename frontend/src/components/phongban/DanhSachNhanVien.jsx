import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Spinner, Button, Breadcrumb, Card, Row, Col, Badge } from "react-bootstrap";
import { FaHome, FaBuilding, FaUsers, FaEnvelope, FaUserTie, FaRegCheckCircle, FaArrowLeft } from "react-icons/fa";

const DanhSachNhanVien = () => {
  const { id } = useParams(); // id phòng ban
  const [nhanVienList, setNhanVienList] = useState([]);
  const [phongBanInfo, setPhongBanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nvRes, pbRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/nhan-vien-by-phong-ban/${id}`),
          axios.get(`http://localhost:5000/api/get-phong-ban-by-id/${id}`)
        ]);
        setNhanVienList(nvRes.data);
        setPhongBanInfo(pbRes.data);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Đang làm việc': { bg: 'success', icon: FaRegCheckCircle },
      'Nghỉ việc': { bg: 'danger', icon: FaRegCheckCircle },
      'Tạm nghỉ': { bg: 'warning', icon: FaRegCheckCircle },
      'Thử việc': { bg: 'info', icon: FaRegCheckCircle }
    };
    
    const config = statusConfig[status] || { bg: 'secondary', icon: FaRegCheckCircle };
    const IconComponent = config.icon;
    
    return (
      <Badge bg={config.bg} className="d-flex align-items-center gap-1">
        <IconComponent />
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
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
              <Breadcrumb.Item active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}
              >
                Quản lý phòng ban
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Danh sách nhân viên
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">👥 Danh sách Nhân viên</h1>
            <p className="mb-0 opacity-90">
              {phongBanInfo ? `Nhân viên thuộc phòng ban ${phongBanInfo.ten_phong_ban}` : 'Đang tải thông tin...'}
            </p>
          </div>
          <Button 
            variant="outline-light" 
            onClick={() => navigate("/phong-ban")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            <FaArrowLeft className="me-2" />
            Quay lại
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-primary mb-2">
                <FaBuilding />
              </div>
              <h4 className="fw-bold">{phongBanInfo?.ten_phong_ban || '...'}</h4>
              <p className="text-muted mb-0">Tên phòng ban</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-success mb-2">
                <FaUsers />
              </div>
              <h4 className="fw-bold">{nhanVienList.length}</h4>
              <p className="text-muted mb-0">Tổng số nhân viên</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="text-center p-4">
              <div className="fs-2 text-info mb-2">
                <FaRegCheckCircle />
              </div>
              <h4 className="fw-bold">
                {nhanVienList.filter(nv => nv.trang_thai === 'Đang làm việc').length}
              </h4>
              <p className="text-muted mb-0">Đang làm việc</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Employee Table Card */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaUsers className="me-2" />
          Danh sách Nhân viên
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <div className="mt-3 fw-semibold">Đang tải danh sách nhân viên...</div>
            </div>
          ) : nhanVienList.length === 0 ? (
            <div className="text-center py-5">
              <FaUsers className="fs-1 mb-3 text-muted opacity-50" />
              <h5 className="text-muted">Không có nhân viên nào</h5>
              <p className="text-muted">Phòng ban này hiện chưa có nhân viên</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover className="mb-0">
                <thead
                  style={{ 
                    background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                    color: "white"
                  }}
                >
                  <tr>
                    <th style={{ padding: "12px", fontWeight: "600", width: "80px" }}>#</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Họ tên</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Email</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Chức vụ</th>
                    <th style={{ padding: "12px", fontWeight: "600", width: "150px" }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {nhanVienList.map((nv, idx) => (
                    <tr key={nv.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: "500" }}>
                        <Badge bg="light" text="dark" className="fs-6">
                          {idx + 1}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        <div className="d-flex align-items-center">
                          <FaUserTie className="text-primary me-2" />
                          {nv.ho_ten}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center">
                          <FaEnvelope className="text-secondary me-2" />
                          {nv.email}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {nv.chuc_vu || <span className="text-muted">Chưa có</span>}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {getStatusBadge(nv.trang_thai)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Back Button */}
      <div className="text-center mt-4">
        <Button 
          variant="outline-dark"
          onClick={() => navigate("/phong-ban")}
          style={{ borderColor: "#667eea", color: "#667eea" }}
        >
          <FaArrowLeft className="me-2" />
          Quay lại Quản lý Phòng ban
        </Button>
      </div>
    </div>
  );
};

export default DanhSachNhanVien;