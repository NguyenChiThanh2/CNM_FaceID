import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// Hàm lấy thông tin người dùng từ localStorage
const getUserInfo = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    return {
      username: parsedUser.username,
      role: parsedUser.role?.ma_vai_tro || "user"
    };
  }
  return null;  // trả về null nếu chưa đăng nhập
};

const TrangChu = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const info = getUserInfo();
    if (!info) {
      // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
      navigate("/dang-nhap");
    } else {
      setUserInfo(info);
    }
  }, [navigate]);

  if (!userInfo) {
    // Có thể trả về null hoặc một loading indicator trong lúc redirect
    return null;
  }

  // Danh sách các module trong hệ thống
  const allModules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#007bff" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#17a2b8" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#ffc107" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#28a745" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi", color: "#6610f2" },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao", color: "#fd7e14" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#20c997" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#6c757d" },
    { title: "Quản lý người dùng", icon: "👥", path: "/quan-ly-nguoi-dung", color: "#f39c12", roles: ["admin"] },
  ];

  const visibleModules = allModules.filter((module) => {
    if (module.roles) {
      return module.roles.includes(userInfo.role);
    }
    return true;
  });

  return (
    <div className="main-content flex-grow-1 p-4" style={{ backgroundColor: "#343a40", color: "white", minHeight: "100vh" }}>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-light">🏢 Hệ thống Quản lý Nhân sự</h1>
        <div className="user-info">
          <span className="text-white">Xin chào, {userInfo.username}</span>
        </div>
      </header>

      <Container fluid>
        <Row>
          {visibleModules.map((module, index) => (
            <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-4">
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
