import React, { useEffect, useState } from "react";
import { 
  Button, 
  Modal, 
  OverlayTrigger, 
  Tooltip, 
  Form, 
  Spinner, 
  Row, 
  Col,
  Card,
  Breadcrumb,
  Badge,
  Table
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { 
  FaHome, 
  FaUser, 
  FaEnvelope, 
  FaUserTie, 
  FaCalendarAlt,
  FaClock,
  FaCalculator,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaImage
} from "react-icons/fa";
import Loading from '../../../src/components/Loading';

const ChamCongNhanVien = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // lấy tháng, năm hiện tại
  const now = new Date();
  const [thang, setThang] = useState(now.getMonth() + 1);
  const [nam, setNam] = useState(now.getFullYear());

  const [chamCong, setChamCong] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nhanVien, setNhanVien] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState([]);
  const [showModalTB, setShowModalTB] = useState(false);

  useEffect(() => {
    fetchChamCong(thang, nam);
  }, [id, thang, nam]);

  useEffect(() => {
    axiosInstance
      .get(`/get-nhan-vien-by-id/${id}`)
      .then((res) => setNhanVien(res.data));
  }, [id]);

  const fetchChamCong = async (thang, nam) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/chamcong_1nhanvien_theothang/${id}?thang=${thang}&nam=${nam}`
      );
      setChamCong(response.data);
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu chấm công:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const laygiaypheptheochamcong = async (cc) => {
    setLoading(true);
    setFormData([]);
    setShowModal(true);
     
    try {
      const laygiayphep = await axiosInstance.get(
        `/get_giay_phep_quen_chamcong/${cc}`
      );
      setFormData(laygiayphep.data);
    } catch (error) {
      console.error("Lỗi khi cập nhật giấy phép:", error);
      setModalMessage("❌ Có lỗi khi cập nhật giấy phép");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };
 
  const tinhSoCong = async (thang, nam) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/tinh-so-cong/${id}?thang=${thang}&nam=${nam}`
      );
      setModalMessage("✅ " + res.data.message);
      setShowModalTB(true);

      const chamCongRes = await axiosInstance.get(
        `/chamcong_1nhanvien_theothang/${id}?thang=${thang}&nam=${nam}`
      );
      setChamCong(chamCongRes.data);
    } catch (error) {
      console.error("Lỗi khi tính số ngày công:", error);
      setModalMessage("❌ Có lỗi khi tính số ngày công");
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const tinhsocong_theogiayphep = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put(
        `/tinhsocong_theogiayphep`, formData
      );
      if (response.status === 200) {
        setModalMessage("✅ Cập nhật giấy phép và số công thành công!");
        setShowModalTB(true);
        setShowModal(false);
        fetchChamCong(thang, nam);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      // axiosInstance đã tự chuẩn hoá lỗi (xem normalizeError trong
      // services/axiosInstance.js) — payload gốc từ BE giờ nằm ở error.data,
      // không còn error.response nữa.
      setModalMessage("❌" + (error.data?.body?.error || error.message));
      setShowModalTB(true);
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

  const getStatusBadge = (status) => {
    return (
      <Badge bg={status === "Đã duyệt" ? "success" : "warning"}>
        {status}
      </Badge>
    );
  };

  if (!nhanVien) return <Loading />;
  if (loading) return <Loading />;

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
              <Breadcrumb.Item 
                active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item 
               active style={{ color: "white" }}
              >
                Quản lý chấm công
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Chi tiết chấm công
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">⏰ Chi tiết Chấm công</h1>
            <p className="mb-0 opacity-90">
              Lịch sử chấm công chi tiết của nhân viên {nhanVien.ho_ten}
            </p>
          </div>
          <Button 
            variant="outline-light" 
            onClick={() => navigate("/quan-ly-cham-cong")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            ← Quay lại
          </Button>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
            color: "white",
            fontWeight: "600"
          }}
        >
          <FaUser className="me-2" />
          Thông tin Nhân viên
        </Card.Header>
        <Card.Body className="p-4">
          <Row>
            <Col md={4}>
              <div className="d-flex align-items-center mb-3">
                <FaUser className="text-primary me-3 fs-5" />
                <div>
                  <small className="text-muted">Họ tên</small>
                  <div className="fw-semibold">{nhanVien.ho_ten}</div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center mb-3">
                <FaEnvelope className="text-primary me-3 fs-5" />
                <div>
                  <small className="text-muted">Email</small>
                  <div className="fw-semibold">{nhanVien.email}</div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex align-items-center mb-3">
                <FaUserTie className="text-primary me-3 fs-5" />
                <div>
                  <small className="text-muted">Chức vụ</small>
                  <div className="fw-semibold">{nhanVien.chuc_vu}</div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Filter and Actions Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
            color: "white",
            fontWeight: "600"
          }}
        >
          <FaCalendarAlt className="me-2" />
          Bộ lọc Thời gian
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3 align-items-center">
            <Col md={3}>
              <Form.Select
                value={thang}
                onChange={(e) => setThang(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={nam}
                onChange={(e) => setNam(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => 2022 + i).map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Button
                onClick={() => tinhSoCong(thang, nam)}
                disabled={loading}
                className="w-100"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none"
                }}
              >
                <FaCalculator className="me-2" />
                {loading ? "Đang tính..." : "Tính số ngày công"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Attendance Table */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaClock className="me-2" />
          Lịch sử Chấm công
        </Card.Header>
        <Card.Body className="p-0">
          {!Array.isArray(chamCong) || chamCong.length === 0 ? (
            <div className="text-center py-5">
              <FaClock className="fs-1 mb-3 text-muted opacity-50" />
              <h5 className="text-muted">Không có dữ liệu chấm công</h5>
              <p className="text-muted">Vui lòng chọn tháng/năm khác</p>
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
                    <th style={{ padding: "12px", fontWeight: "600" }}>ID</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ngày</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Giờ vào</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Giờ ra</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ảnh vào</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ảnh ra</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Số công</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {chamCong.map((cc) => (
                    <tr key={cc.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{cc.id}</td>
                      <td style={{ padding: "12px" }}>
                        <Badge bg="light" text="dark">
                          {formatDate(cc.ngay)}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-success me-2" />
                          {cc.thoi_gian_vao || "-"}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-primary me-2" />
                          {cc.thoi_gian_ra || "-"}
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {cc.hinh_anh_vao ? (
                          <img
                            src={`${axiosInstance.defaults.baseURL}/checkin_images/${cc.hinh_anh_vao}`}
                            alt="Ảnh vào"
                            width="50"
                            height="50"
                            style={{ 
                              objectFit: "cover", 
                              borderRadius: "8px",
                              border: "2px solid #dee2e6"
                            }}
                            className="shadow-sm"
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {cc.hinh_anh_ra ? (
                          <img
                            src={`${axiosInstance.defaults.baseURL}/checkin_images/${cc.hinh_anh_ra}`}
                            alt="Ảnh ra"
                            width="50"
                            height="50"
                            style={{ 
                              objectFit: "cover", 
                              borderRadius: "8px",
                              border: "2px solid #dee2e6"
                            }}
                            className="shadow-sm"
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <Badge 
                          bg={cc.so_cong > 0 ? "success" : "secondary"}
                          className="fs-6"
                        >
                          {cc.so_cong}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {!cc.thoi_gian_vao || !cc.thoi_gian_ra ? (
                          <OverlayTrigger 
                            placement="top" 
                            overlay={<Tooltip>Cập nhật giấy phép</Tooltip>}
                          >
                            <Button 
                              variant="outline-success" 
                              size="sm"
                              onClick={() => laygiaypheptheochamcong(cc.id)}
                            >
                              <FaFileAlt />
                            </Button>
                          </OverlayTrigger>
                        ) : (
                          <Badge bg="success" className="fs-6">
                            <FaCheckCircle className="me-1" />
                            Đã chấm đủ
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Giấy phép Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="rounded-4">
        <Modal.Header 
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Modal.Title>
            <FaFileAlt className="me-2" />
            Cập nhật Giấy phép Quên chấm công
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {formData && formData.id ? (
            <Form onSubmit={tinhsocong_theogiayphep}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Mã giấy phép</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.id}
                      disabled
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Loại giấy phép</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.loai_giay_phep}
                      disabled
                      readOnly
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                    <div className="mt-2">
                      {getStatusBadge(formData.trang_thai)}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Ngày duyệt</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.ngay_duyet || "Chưa duyệt"}
                      disabled
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              {formData.trang_thai === "Đã duyệt" ? (
                <div className="text-center mt-4">
                  <Button 
                    type="submit" 
                    variant="primary"
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none"
                    }}
                    disabled={loading}
                  >
                    <FaCheckCircle className="me-2" />
                    {loading ? "Đang xử lý..." : "Áp dụng Giấy phép"}
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning text-center mt-3">
                  <FaTimesCircle className="me-2" />
                  Giấy phép chưa được duyệt không thể áp dụng
                </div>
              )}
            </Form>
          ) : (
            <div className="text-center py-4">
              <FaTimesCircle className="fs-1 text-danger mb-3" />
              <h5 className="text-danger">Giấy phép không tồn tại</h5>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Thông báo Modal */}
      <Modal show={showModalTB} onHide={() => setShowModalTB(false)} centered className="rounded-4">
        <Modal.Body className="text-center p-5">
          <div className={`mb-3 ${modalMessage.includes("✅") ? "text-success" : "text-danger"}`}>
            {modalMessage.includes("✅") ? (
              <FaCheckCircle className="fs-1" />
            ) : (
              <FaTimesCircle className="fs-1" />
            )}
          </div>
          <h5 className="mb-3">{modalMessage}</h5>
          <Button 
            variant="primary"
            onClick={() => setShowModalTB(false)}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none"
            }}
          >
            Đóng
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ChamCongNhanVien;