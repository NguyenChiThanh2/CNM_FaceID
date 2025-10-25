import React from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaArrowLeft, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem"
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
              <Card.Body className="text-center">
                {/* Icon */}
                <div 
                  className="rounded-circle mx-auto mb-4 d-flex align-items-center justify-content-center"
                  style={{
                    width: "110px",
                    height: "110px",
                    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                    color: "white"
                  }}
                >
                  <FaExclamationTriangle size={48} />
                </div>

                {/* Title */}
                <h1 
                  className="fw-bold mb-3"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  404 - Không Tìm Thấy Trang
                </h1>

                {/* Description */}
                <p className="text-muted fs-5">
                  Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
                </p>

                {/* Additional Info */}
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <Row className="g-3 text-start">
                      <Col xs={12} className="d-flex align-items-center">
                        <FaSearch className="text-primary me-3 fs-5" />
                        <div>
                          <h6 className="fw-semibold mb-1">Có thể bạn đã:</h6>
                          <ul className="mb-0 text-muted">
                            <li>Nhập sai địa chỉ URL</li>
                            <li>Theo một liên kết đã cũ</li>
                            <li>Truy cập trang đã bị xóa</li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Action Buttons */}
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/')}
                    className="d-flex align-items-center justify-content-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      padding: "12px 24px",
                      fontWeight: "600"
                    }}
                  >
                    <FaHome />
                    Về Trang Chủ
                  </Button>
                  
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate(-1)}
                    className="d-flex align-items-center justify-content-center gap-2"
                    style={{
                      borderColor: "#667eea",
                      color: "#667eea",
                      padding: "12px 24px",
                      fontWeight: "600"
                    }}
                  >
                    <FaArrowLeft />
                    Quay Lại
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Footer Note */}
            <div className="text-center mt-4">
              <p className="text-white mb-0 opacity-75">
                Nếu bạn nghĩ đây là lỗi, vui lòng liên hệ với{' '}
                <a 
                  href="mailto:lyanhkhoa789@gmail.com" 
                  className="text-white text-decoration-underline"
                >
                  bộ phận hỗ trợ
                </a>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default NotFound;