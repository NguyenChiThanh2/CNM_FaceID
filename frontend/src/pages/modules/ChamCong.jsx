// src/pages/ChamCong.jsx
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { 
  Card, 
  Button, 
  Breadcrumb, 
  Spinner, 
  Alert, 
  Row, 
  Col,
  Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaCamera, 
  FaUserCheck, 
  FaUserTimes, 
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";

const ChamCong = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const captureAndSend = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCapturedImage(imageSrc);
    setLoading(true);
    setResult(null);

    // Đảm bảo URL đúng với backend
    fetch("http://localhost:5000/cham-cong-khuon-mat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageSrc }), // Gửi ảnh dưới dạng base64
    })
      .then(response => response.json())
      .then(data => {
        console.log("Kết quả nhận diện:", data);
        setResult(data);
      })
      .catch(error => {
        console.error("Lỗi:", error);
        setResult({ 
          success: false, 
          message: "Lỗi kết nối server. Vui lòng thử lại." 
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setResult(null);
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
              <Breadcrumb.Item 
                onClick={() => navigate("/")} 
                style={{ color: "white", cursor: "pointer" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Chấm công khuôn mặt
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">📸 Chấm công bằng Nhận diện Khuôn mặt</h1>
            <p className="mb-0 opacity-90">
              Sử dụng camera để chấm công nhanh chóng và bảo mật
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

      <Row className="g-4 justify-content-center">
        {/* Webcam Section */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Header 
              style={{
                background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                color: "white",
                fontWeight: "600"
              }}
            >
              <FaCamera className="me-2" />
              Camera nhận diện
            </Card.Header>
            <Card.Body className="p-4 text-center">
              <div className="position-relative">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="rounded-4 shadow-lg"
                  width="100%"
                  height="300"
                  style={{ 
                    maxWidth: "500px",
                    border: "3px solid #e2e8f0"
                  }}
                />
                {loading && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-4"
                    style={{
                      background: "rgba(0, 0, 0, 0.7)",
                      zIndex: 10
                    }}
                  >
                    <div className="text-center text-white">
                      <Spinner animation="border" variant="light" />
                      <div className="mt-2 fw-semibold">Đang nhận diện...</div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                className="mt-4 px-4 py-2 fw-bold"
                onClick={captureAndSend}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  minWidth: "200px"
                }}
              >
                <FaCamera className="me-2" />
                {loading ? "Đang xử lý..." : "Chụp & Nhận diện"}
              </Button>

              {capturedImage && !loading && (
                <div className="mt-3">
                  <Button
                    variant="outline-secondary"
                    onClick={handleRetry}
                    size="sm"
                  >
                    Chụp lại
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Results Section */}
        <Col lg={6}>
          {/* Captured Image */}
          {capturedImage && (
            <Card className="shadow-sm border-0 rounded-4 mb-4">
              <Card.Header 
                style={{
                  background: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                <FaCamera className="me-2" />
                Ảnh đã chụp
              </Card.Header>
              <Card.Body className="text-center p-4">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="rounded-4 shadow"
                  style={{ 
                    maxWidth: "100%", 
                    height: "auto",
                    maxHeight: "300px",
                    border: "2px solid #e2e8f0"
                  }} 
                />
              </Card.Body>
            </Card>
          )}

          {/* Recognition Result */}
          {result && (
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Header 
                style={{
                  background: result.success 
                    ? "linear-gradient(135deg, #48bb78 0%, #38a169 100%)"
                    : "linear-gradient(135deg, #f56565 0%, #e53e3e 100%)",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                {result.success ? (
                  <FaUserCheck className="me-2" />
                ) : (
                  <FaUserTimes className="me-2" />
                )}
                Kết quả nhận diện
              </Card.Header>
              <Card.Body className="text-center p-4">
                {result.success ? (
                  <div>
                    <div className="mb-3">
                      <FaCheckCircle className="text-success mb-3" size={48} />
                      <h4 className="fw-bold text-dark mb-2">{result.name}</h4>
                      <Badge bg="success" className="fs-6">
                        <FaClock className="me-1" />
                        Chấm công thành công
                      </Badge>
                    </div>
                    
                    {result.image && (
                      <div className="mt-3">
                        <img 
                          src={result.image} 
                          alt="Result" 
                          className="rounded-4 shadow"
                          style={{ 
                            maxWidth: "200px",
                            border: "2px solid #48bb78"
                          }} 
                        />
                      </div>
                    )}

                    {result.time && (
                      <div className="mt-3 p-3 bg-light rounded-3">
                        <small className="text-muted">Thời gian:</small>
                        <div className="fw-semibold">{result.time}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <FaExclamationTriangle className="text-warning mb-3" size={48} />
                    <h5 className="text-danger mb-3">{result.message}</h5>
                    <Alert variant="warning" className="text-start">
                      <strong>Gợi ý:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Đảm bảo khuôn mặt rõ ràng và đủ sáng</li>
                        <li>Thử lại ở vị trí có ánh sáng tốt hơn</li>
                        <li>Đứng cách camera khoảng 1-2 mét</li>
                      </ul>
                    </Alert>
                    <Button
                      variant="outline-primary"
                      onClick={handleRetry}
                      className="mt-2"
                    >
                      <FaCamera className="me-2" />
                      Thử lại
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Instructions when no result */}
          {!capturedImage && !result && (
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Header 
                style={{
                  background: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)",
                  color: "white",
                  fontWeight: "600"
                }}
              >
                <FaCheckCircle className="me-2" />
                Hướng dẫn sử dụng
              </Card.Header>
              <Card.Body>
                <div className="text-start">
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-primary rounded-circle p-2 me-3">
                      <FaCamera className="text-white" />
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">Bước 1: Định vị camera</h6>
                      <p className="text-muted mb-0">Đứng trước camera với khuôn mặt rõ ràng</p>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-success rounded-circle p-2 me-3">
                      <FaUserCheck className="text-white" />
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">Bước 2: Nhấn chụp ảnh</h6>
                      <p className="text-muted mb-0">Nhấn nút "Chụp & Nhận diện" để chấm công</p>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start">
                    <div className="bg-info rounded-circle p-2 me-3">
                      <FaClock className="text-white" />
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-1">Bước 3: Xác nhận kết quả</h6>
                      <p className="text-muted mb-0">Hệ thống sẽ hiển thị kết quả nhận diện</p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ChamCong;