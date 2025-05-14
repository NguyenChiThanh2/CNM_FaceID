import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const getUserRole = () => {
  return localStorage.getItem("userRole") || "user";
};

const TrangChu = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    setUserRole(getUserRole());
  }, []);

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#007bff", roles: ["admin", "nhansu"] },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#17a2b8", roles: ["admin", "nhansu", "nhanvien"] },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#ffc107", roles: ["admin", "nhansu", "nhanvien"] },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#28a745", roles: ["admin", "nhansu"] },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi", color: "#6610f2", roles: ["admin", "nhansu"] },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao", color: "#fd7e14", roles: ["admin", "nhansu"] },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#20c997", roles: ["admin", "nhansu", "nhanvien"] },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#6c757d", roles: ["admin"] },
    ...(userRole === "admin" ? [{ title: "Quản lý người dùng", icon: "👥", path: "/quan-ly-nguoi-dung", color: "#f39c12", roles: ["admin"] }] : []),
  ];

  return (
    <div className="main-content flex-grow-1 p-4" style={{ backgroundColor: "#343a40", color: "white", minHeight: "100vh" }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-light">🏢 Hệ thống Quản lý Nhân sự</h1>
        <div className="user-info">
          <span className="text-white">Xin chào, {userRole}</span>
        </div>
      </header>

      <Container fluid>
        <Row>
          {modules.map((module, index) => (
            <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card
                className="h-100 text-center shadow-sm border-0 rounded-4 bg-dark text-white"
                style={{ cursor: "pointer", transition: "transform 0.3s ease" }}
                onClick={() => navigate(module.path)}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                <Card.Body>
                  <div className="icon mb-3" style={{ fontSize: "3rem", color: module.color }}>
                    {module.icon}
                  </div>
                  <h5 className="fw-bold text-light">{module.title}</h5>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default TrangChu;
