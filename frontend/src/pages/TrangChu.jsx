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
      avatar: nv.avatar,
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
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su", color: "#667eea" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong", color: "#764ba2" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep", color: "#6B73FF" },
    { title: "Giấy phép", icon: "📜", path: "/quan-ly-giay-phep", color: "#8B5FBF" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong", color: "#667eea" },
    { title: "Thưởng", icon: "🎁", path: "/thuong", color: "#764ba2" },
    { title: "Khấu trừ", icon: "❌", path: "/khau-tru", color: "#6B73FF" },
    { title: "Người phụ thuộc", icon: "👪", path: "/nguoi-phu-thuoc", color: "#8B5FBF" },
    { title: "Phúc lợi", icon: "⚜️", path: "/phuc-loi", color: "#667eea" },
    { title: "QL nghỉ có lương", icon: "🎆", path: "/ngay-nghi-le", color: "#764ba2" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia", color: "#6B73FF" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", color: "#8B5FBF" },
  ];

  // 👇 Tuỳ chính sách: ẩn bớt module với non-HR (ví dụ lương & phòng ban)
  const restrictedPaths = [];

  const visibleModules = modules.filter((m) => {
    if (userInfo.phong_ban_id === HR_DEPARTMENT_ID) return true; // HR thấy hết
    return !restrictedPaths.includes(m.path); // người khác bị ẩn 1 vài mục
  });

  return (
    <div
      className="main-content flex-grow-1 p-4 ps-5"
      style={{ 
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
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
            <h1 className="fw-bold mb-2" style={{ fontSize: "2.2rem" }}>
              🏢 Hệ thống Quản lý Nhân sự
            </h1>
            <p className="mb-0 opacity-90" style={{ fontSize: "1.1rem" }}>
              Quản lý toàn diện nhân sự và các hoạt động liên quan
            </p>
          </div>
          <div className="text-end">
            <div className="d-flex align-items-center gap-3">
              {/* <div 
                className="rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{
                  width: 60,
                  height: 60,
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  border: "2px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <span className="fw-bold text-white" style={{ fontSize: "1.2rem" }}>
                  {userInfo.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <span className="fw-semibold d-block" style={{ fontSize: "1.1rem" }}>
                  {userInfo.displayName}
                </span>
                <small className="opacity-90">
                  {userInfo.ten_phong_ban || "Nhân viên"}
                </small>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <Container fluid>
        <Row className="g-4">
          {visibleModules.map((module, idx) => (
            <Col key={idx} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card
                className="h-100 text-center shadow-sm border-0 rounded-4"
                style={{ 
                  cursor: "pointer", 
                  transition: "all 0.3s ease",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  overflow: "hidden"
                }}
                onClick={() => navigate(module.path)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 12px 25px rgba(102, 126, 234, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
                }}
              >
                <Card.Body className="d-flex flex-column justify-content-center p-4">
                  <div 
                    className="icon mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center"
                    style={{ 
                      width: 80, 
                      height: 80,
                      background: `linear-gradient(135deg, ${module.color}99 0%, ${module.color}66 100%)`,
                      fontSize: "2.5rem",
                      transition: "all 0.3s ease"
                    }}
                  >
                    {module.icon}
                  </div>
                  <h5 
                    className="fw-bold mb-0"
                    style={{ 
                      color: "#2d3748",
                      fontSize: "1rem"
                    }}
                  >
                    {module.title}
                  </h5>
                </Card.Body>
                
                {/* Hover effect line */}
                <div 
                  style={{
                    height: "4px",
                    background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}99 100%)`,
                    transform: "scaleX(0)",
                    transition: "transform 0.3s ease",
                    transformOrigin: "left"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scaleX(1)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scaleX(0)"}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Footer */}
      {/* <div className="text-center mt-5 pt-4">
        <p 
          className="text-muted mb-0" 
          style={{ 
            fontSize: "0.9rem",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "1.5rem"
          }}
        >
          © 2025 Lý Anh Khoa - Nguyễn Chí Thanh.
        </p>
      </div> */}
    </div>
  );
};

export default TrangChu;