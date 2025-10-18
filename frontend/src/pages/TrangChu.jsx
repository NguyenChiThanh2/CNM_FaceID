// src/pages/TrangChu.jsx
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const HR_DEPARTMENT_ID = 2; // 👈 đổi ID thật

const getUserInfo = () => {
  const saved = localStorage.getItem("user");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    const nv = parsed.nhan_vien || {};
    return {
      displayName: nv.ho_ten || nv.email || "Người dùng",
      phong_ban_id: nv.phong_ban_id,
      ten_phong_ban: nv.ten_phong_ban || "",
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
    if (!info) navigate("/dang-nhap", { replace: true });
    else setUserInfo(info);
  }, [navigate]);

  if (!userInfo) return null;

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#6ea8fe" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#a3cfbb" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#ffd8a8" },
    { title: "Giấy phép", icon: "📜", path: "/quan-ly-giay-phep", color: "#ffe69c" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#f1aeb5" },
    { title: "Thưởng", icon: "🎁", path: "/thuong", color: "#c29ffa" },
    { title: "Khấu trừ", icon: "❌", path: "/khau-tru", color: "#f8d7da" },
    { title: "Người phụ thuộc", icon: "👪", path: "/nguoi-phu-thuoc", color: "#f9c74f" },
    { title: "Phúc lợi", icon: "⚜️", path: "/phuc-loi", color: "#d1e7dd" },
    { title: "QL nghỉ có lương", icon: "🎆", path: "/ngay-nghi-le", color: "#b6effb" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#bcd0ff" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#e2e3e5" },

  ];

  // 👇 Tuỳ chính sách: ẩn bớt module với non-HR (ví dụ lương & phòng ban)
  const restrictedPaths = [];

  const visibleModules = modules.filter((m) => {
    if (userInfo.phong_ban_id === HR_DEPARTMENT_ID) return true; // HR thấy hết
    return !restrictedPaths.includes(m.path); // người khác bị ẩn 1 vài mục
  });

  return (
    <div
      className="main-content flex-grow-1 p-4"
      style={{ backgroundColor: "#343a40", color: "white", minHeight: "100vh" }}
    >
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-light">🏢 Hệ thống Quản lý Nhân sự</h1>
        <div className="user-info">
          <span className="text-white">
            <b>Xin chào, {userInfo.displayName}</b>
          </span>
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
