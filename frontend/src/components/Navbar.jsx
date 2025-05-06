import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Nhân sự", path: "/nhan-su" },
    { label: "Nghỉ phép", path: "/nghi-phep" },
    { label: "Lương", path: "/luong" },
    { label: "Phúc lợi", path: "/phuc-loi" },
    { label: "Tuyển dụng", path: "/tuyen-dung" },
    { label: "Đào tạo", path: "/dao-tao" },
    { label: "Đánh giá", path: "/danh-gia" },
    { label: "Phòng ban", path: "/phong-ban" },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
      <Link className="navbar-brand d-flex align-items-center fw-bold fs-4" to="/">
        <span className="me-2">🧑‍💼</span> HR FaceID
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon" />
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
          {navItems.map((item, idx) => (
            <li className="nav-item" key={idx}>
              <Link
                className={`nav-link text-white px-3 ${
                  location.pathname === item.path ? "fw-bold border-bottom border-light" : ""
                }`}
                to={item.path}
                style={{
                  textTransform: "capitalize",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
