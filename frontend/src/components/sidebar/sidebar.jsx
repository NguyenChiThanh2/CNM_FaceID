import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  // Các module được định nghĩa sẵn trong Sidebar
  const modules = [
    { title: "Quản lý nhân sự", icon: "👤", path: "/nhan-su" },
    { title: "Quản lý chấm công", icon: "📷", path: "/quan-ly-cham-cong" },
    { title: "Nghỉ phép", icon: "📆", path: "/nghi-phep" },
    { title: "Tính lương", icon: "💰", path: "/tinh-luong" },
    { title: "Phúc lợi", icon: "🎁", path: "/phuc-loi" },
    { title: "Đào tạo", icon: "📚", path: "/dao-tao" },
    { title: "Đánh giá", icon: "📈", path: "/danh-gia" },
    { title: "Phòng ban", icon: "🏢", path: "/phong-ban" },
    { title: "Quản lý người dùng", icon: "👥", path: "/quan-ly-nguoi-dung" },
  ];

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

      {/* Nút đăng xuất */}
      <Button variant="danger" className="w-100 mb-4">
        Đăng xuất
      </Button>

      <ul className="nav flex-column">
        {modules && Array.isArray(modules) && modules.length > 0 ? (
          modules.map((module, index) => (
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
          ))
        ) : (
          <li className="nav-item mb-2">Không có module</li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
