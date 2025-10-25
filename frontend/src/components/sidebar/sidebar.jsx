import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./style.css";

// ...existing code...
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
      };
    } catch {
      return { username: "Người dùng", role: "user", phong_ban_id: null };
    }
  }
  return { username: "Người dùng", role: "user", phong_ban_id: null };
};

const Sidebar = ({ isCollapsed = false, toggleSidebar = () => {}, isMobile = false, isOpen = true, expandSidebar = () => {} }) => {
  console.log("Sidebar render:", { isMobile, isOpen, isCollapsed });
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
    backgroundColor: "#343a40",
    color: "#fff",
    zIndex: 4000, // ensure above backdrop and other UI
    padding: "16px",
    transition: "width 0.25s ease, transform 0.25s ease, left 0.25s ease",
    boxShadow: isMobile ? "2px 0 12px rgba(0,0,0,0.3)" : undefined,
    // Force visible / on-screen even if external CSS sets transform
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
            zIndex: 3000, // below sidebar
          }}
          aria-hidden="true"
        />
      )}

      {/* <div
        className="sidebar"
        style={panelStyle}
        role="navigation"
        aria-label="Main sidebar"
        onClick={(e) => {
          e.stopPropagation();
          // on desktop, if collapsed then clicking inside expands sidebar
          if (!isMobile && isCollapsed) {
            expandSidebar();
          }
        }}
      > */}
      <div
        className="sidebar"
        style={panelStyle}
        role="navigation"
        aria-label="Main sidebar"
        onClick={(e) => {
          // prevent the click from bubbling to the page container (which collapses / closes)
          e.stopPropagation();

          // On desktop when collapsed, only expand if user clicked a NON-interactive area
          if (!isMobile && isCollapsed) {
            // If the click target or any ancestor up to the sidebar is an interactive element,
            // do NOT expand. This prevents buttons/links inside sidebar from triggering expand.
            const interactive = e.target.closest(
              'button, a, input, textarea, select, label, [role="button"], .btn, .nav-item, .nav-link'
            );
            if (!interactive) {
              expandSidebar();
            }
          }
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4
            className="text-light mb-0 fw-bold"
            style={{ fontSize: isCollapsed ? 14 : 18 }}
          >
            {!isCollapsed ? "Quản lý Nhân sự" : ""}
          </h4>

          {/* collapse/expand button removed per request */}
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <Button
            variant="danger"
            className="w-100"
            onClick={handleLogout}
            style={{
              borderRadius: "10px",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            {!isCollapsed ? "Đăng xuất" : "🚪"}
          </Button>
        </div>

        <ul className="nav flex-column" style={{ paddingLeft: 0 }}>
          {visibleModules.map((module, index) => {
            const isActive = location.pathname === module.path;
            return (
              <li className="nav-item mb-2" key={index}>
                <Button
                  variant="link"
                  className={`text-white w-100 text-start p-3 fw-semibold ${
                    isActive ? "active-sidebar" : ""
                  }`}
                  onClick={() => onNavigate(module.path)}
                  style={{
                    backgroundColor: isActive ? "#a39d9dce" : "#495057",
                    color: isActive ? "#000" : "#e2e6ea",
                    borderRadius: "8px",
                    textDecoration: "none",
                    transition: "all 0.3s",
                    fontWeight: isActive ? "700" : "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ width: 28, textAlign: "center" }}>{module.icon}</span>
                  {!isCollapsed && <span>{module.title}</span>}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
// ...existing code...