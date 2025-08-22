import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const getUserInfo = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    console.log("🔍 Full user object từ localStorage:", parsedUser);

    const { username, role } = parsedUser;

    return {
      username,
      role: role?.ma_vai_tro || "user" // admin, nhansu, nhanvien, ...
    };
  }
  console.warn("⚠️ Không tìm thấy user trong localStorage.");
  return { username: "Người dùng", role: "user" };
};

const Sidebar = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();

  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi" },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban", roles: ["admin"] },
    { title: "Quản lý người dùng", icon: "👥", path: "/quan-ly-nguoi-dung", roles: ["admin"] },
  ];

  const visibleModules = modules.filter((module) => {
    if (module.roles) {
      return module.roles.includes(userInfo.role);
    }
    return true;
  });

  const handleLogout = async () => {
    const token = localStorage.getItem("access_token");

    try {
      if (token) {
        await axios.post(
          "/api/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Xóa tất cả thông tin liên quan đến người dùng
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // Điều hướng đến trang đăng nhập
      navigate("/dang-nhap");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);

      // Vẫn xóa dữ liệu trong mọi trường hợp
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
        overflowY: "auto"
      }}
    >
      <h4 className="text-center text-light mb-4 fw-bold">Quản lý Nhân sự</h4>

      <Button variant="danger" className="w-100 mb-4" onClick={handleLogout}>
        Đăng xuất
      </Button>

      <ul className="nav flex-column">
        {visibleModules.map((module, index) => (
          <li className="nav-item mb-2" key={index}>
            <Button
              variant="link"
              className="text-white w-100 text-start p-3 fw-semibold"
              onClick={() => navigate(module.path)}
              style={{
                backgroundColor: "#495057",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "background-color 0.3s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#6c757d"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#495057"}
            >
              {module.icon} {module.title}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
