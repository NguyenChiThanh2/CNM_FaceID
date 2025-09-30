// src/pages/TrangChu.jsx
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const getUserInfo = () => {
  const saved = localStorage.getItem("user");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    const nv = parsed.nhan_vien || {};
    return {
      displayName: nv.ho_ten || nv.email || "Người dùng",
      role: nv.role?.ma_vai_tro || "user", // nếu sau này bạn thêm role vào token
    };
  } catch {
    return null;
  }
};

const TrangChu = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const info = getUserInfo();
    if (!info) {
      navigate("/dang-nhap", { replace: true });
    } else {
      setUserInfo(info);
    }
  }, [navigate]);

  if (!userInfo) return null;

  const allModules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#007bff" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#17a2b8" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#ffc107" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#28a745" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi", color: "#6610f2" },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao", color: "#fd7e14" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#20c997" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#6c757d" },
  ];

  const visibleModules = allModules.filter((m) => {
    if (m.roles) return m.roles.includes(userInfo.role);
    return true;
  });

  return (
    <div className="main-content flex-grow-1 p-4" style={{ backgroundColor: "#343a40", color: "white", minHeight: "100vh" }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-light">🏢 Hệ thống Quản lý Nhân sự</h1>
        <div className="user-info">
          <span className="text-white"><b>Xin chào, {userInfo.displayName}</b></span>
        </div>
      </header>

      <Container fluid>
        <Row>
          {visibleModules.map((module, idx) => (
            <Col key={idx} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card
                className="h-100 text-center shadow-sm border-0 rounded-4 bg-dark text-white"
                style={{ cursor: "pointer", transition: "transform 0.3s ease" }}
                onClick={() => navigate(module.path)}
                onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
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
