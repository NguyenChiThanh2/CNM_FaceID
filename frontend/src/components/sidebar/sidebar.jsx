import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const getUserInfo = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    console.log("🔍 Full user object từ localStorage:", parsedUser);

    const nv = parsedUser.nhan_vien || {};
    return {
      username: nv.ho_ten || parsedUser.username || "Người dùng",
      role: parsedUser.role?.ma_vai_tro || "user",
      phong_ban_id: nv.phong_ban_id,
      ten_phong_ban: nv.ten_phong_ban || "",
    };
  }
  return { username: "Người dùng", role: "user", phong_ban_id: null };
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 lấy route hiện tại
  const userInfo = getUserInfo();

  const HR_DEPARTMENT_ID = 2;
  const restrictedPaths = ["/tinh-luong", "/phuc-loi", "/dao-tao"];

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep" },
    { title: "Giấy phép", icon: "📜", path: "/quan-ly-giay-phep" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban" },
  ];

  const visibleModules = modules.filter((module) => {
    if (module.roles && !module.roles.includes(userInfo.role)) return false;
    if (userInfo.phong_ban_id !== HR_DEPARTMENT_ID && restrictedPaths.includes(module.path)) return false;
    return true;
  });

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");
    try {
      if (token) {
        await axios.post("/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      navigate("/dang-nhap");
    }
  };

  return (
    <div
      className="sidebar bg-dark text-white p-4"
      style={{
        width: "280px",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        fontSize: "16px",
        lineHeight: "1.6",
        overflowY: "auto",
      }}
    >
      <h4 className="text-center text-light mb-4 fw-bold">Quản lý Nhân sự</h4>

      <Button variant="danger" className="w-100 mb-4" onClick={handleLogout}>
        Đăng xuất
      </Button>

      <ul className="nav flex-column">
        {visibleModules.map((module, index) => {
          const isActive = location.pathname === module.path; // 👈 kiểm tra active
          return (
            <li className="nav-item mb-2" key={index}>
              <Button
                variant="link"
                className={`text-white w-100 text-start p-3 fw-semibold ${
                  isActive ? "active-sidebar" : ""
                }`}
                onClick={() => navigate(module.path)}
                style={{
                  backgroundColor: isActive ? "#275191ff" : "#495057",
                  borderRadius: "8px",
                  textDecoration: "none",
                  transition: "background-color 0.3s",
                }}
                onMouseOver={(e) =>
                  !isActive &&
                  (e.currentTarget.style.backgroundColor = "#6c757d")
                }
                onMouseOut={(e) =>
                  !isActive &&
                  (e.currentTarget.style.backgroundColor = "#495057")
                }
              >
                {module.icon} {module.title}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;
