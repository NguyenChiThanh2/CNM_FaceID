import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./style.css";
const URL_HINH = 'http://127.0.0.1:5000/api'; 
const getUserInfo = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      const nv = parsed.nhan_vien || {};
      return {
        username: nv.ho_ten || parsed.username || "Người dùng",
        role: parsed.role?.ma_vai_tro || "user",
        phong_ban_id: nv.phong_ban_id,
        ten_phong_ban: nv.ten_phong_ban || "",
        avatar: nv.avatar || null,
        ten_chuc_vu: nv.ten_chuc_vu || "",
      };
    } catch {
      return { username: "Người dùng", role: "user", phong_ban_id: null };
    }
  }
  return { username: "Người dùng", role: "user", phong_ban_id: null };
};

const Sidebar = ({ isCollapsed = false, toggleSidebar = () => {}, isMobile = false, isOpen = true, expandSidebar = () => {} }) => {
  // console.log("Sidebar render:", { isMobile, isOpen, isCollapsed });
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = getUserInfo();

  // if not open (mobile closed), don't render anything
  if (isMobile && !isOpen) return null;

  const HR_DEPARTMENT_ID = 2;
  const restrictedPaths = ["/ngay-nghi-le"];

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep" },
    { title: "Giấy phép", icon: "📜", path: "/quan-ly-giay-phep" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong" },
    { title: "Thưởng", icon: "🎁", path: "/thuong" },
    { title: "Khấu trừ", icon: "❌", path: "/khau-tru" },
    { title: "Người phụ thuộc", icon: "👪", path: "/nguoi-phu-thuoc", color: "#f9c74f" },
    { title: "Phúc lợi", icon: "⚜️", path: "/phuc-loi" },
    { title: "QL nghỉ có lương", icon: "🎆", path: "/ngay-nghi-le" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban" },
  ];

  const visibleModules = modules.filter((module) => {
    if (module.roles && !module.roles.includes(userInfo.role)) return false;
    if (userInfo.phong_ban_id !== HR_DEPARTMENT_ID && restrictedPaths.includes(module.path))
      return false;
    return true;
  });

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    try {
      if (token) {
        await axios.post(
          "/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      // close overlay if mobile
      if (isMobile) toggleSidebar();
      navigate("/dang-nhap");
    }
  };

  const onNavigate = (path) => {
    navigate(path);
    if (isMobile) toggleSidebar();
  };

  // styles
  const width = isMobile ? "320px" : isCollapsed ? "110px" : "265px";
  const panelStyle = {
    width,
    minWidth: width,
    display: "block",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    fontSize: "16px",
    lineHeight: "1.6",
    overflowY: "auto",
    background: "linear-gradient(135deg, #2d3748 0%, #4a5568 100%)",
    color: "#fff",
    zIndex: 4000,
    padding: "20px 16px",
    transition: "width 0.25s ease, transform 0.25s ease, left 0.25s ease",
    boxShadow: isMobile ? "2px 0 12px rgba(0,0,0,0.3)" : "2px 0 8px rgba(0,0,0,0.1)",
    transform: "translateX(0)",
    visibility: "visible",
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 3000,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="sidebar"
        style={panelStyle}
        role="navigation"
        aria-label="Main sidebar"
        onClick={(e) => {
          e.stopPropagation();
          if (!isMobile && isCollapsed) {
            const interactive = e.target.closest(
              'button, a, input, textarea, select, label, [role="button"], .btn, .nav-item, .nav-link'
            );
            if (!interactive) {
              expandSidebar();
            }
          }
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 70,
              height: 70,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
            }}
          >
            <span style={{ color: "#fff", fontSize: "20px", fontWeight: "bold" }}>
              {userInfo.avatar != "default.jpg" ? (
                <img
                  src={`${URL_HINH}/images/${userInfo.avatar}`}
                  alt="avatar"
                  width="65"
                  height="65"
                  style={{ objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                userInfo.username.charAt(0).toUpperCase()
              )}              
            </span>
          </div>
          {!isCollapsed && (
            <>
              <h5 className="text-white mb-1 fw-bold">{userInfo.username}</h5>
              <p className="text-light mb-0" style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                {userInfo.ten_phong_ban || ""}
              </p>
              <p className="text-light mb-0" style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                {userInfo.ten_chuc_vu || "Nhân viên"}
              </p>
              
            </>
          )}
        </div>

        {/* Logout Button */}
        <div className="mb-4">
          <Button
            variant="outline-light"
            className="w-100 border-0"
            onClick={handleLogout}
            style={{
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "15px",
              padding: "10px",
              background: "rgba(136, 7, 7, 1)",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(239, 68, 68, 0.8)";
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(136, 7, 7, 1)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {!isCollapsed ? "Đăng xuất" : "🚪"}
          </Button>
        </div>

        {/* Navigation Menu */}
        <ul className="nav flex-column" style={{ paddingLeft: 0, gap: "8px" }}>
          {visibleModules.map((module, index) => {
            const isActive = location.pathname === module.path;
            return (
              <li className="nav-item" key={index}>
                <Button
                  variant="link"
                  className={`w-100 text-start p-3 fw-semibold border-0 ${
                    isActive ? "active-sidebar" : ""
                  }`}
                  onClick={() => onNavigate(module.path)}
                  style={{
                    background: isActive 
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      : "rgba(255, 255, 255, 0.05)",
                    color: isActive ? "#fff" : "#e2e8f0",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    fontWeight: isActive ? "600" : "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    backdropFilter: "blur(10px)",
                    border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <span 
                    style={{ 
                      width: 28, 
                      textAlign: "center",
                      fontSize: "18px",
                      filter: isActive ? "brightness(0) invert(1)" : "none"
                    }}
                  >
                    {module.icon}
                  </span>
                  {!isCollapsed && (
                    <span style={{ fontSize: "14px" }}>{module.title}</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        {!isCollapsed && (
          <div className="mt-auto pt-4 text-center">
            <p 
              className="text-light mb-0" 
              style={{ 
                fontSize: "0.75rem", 
                opacity: 0.6,
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "16px"
              }}
            >
              © 2025 Công ty TNHH TC
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;