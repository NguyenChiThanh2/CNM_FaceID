// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const RequireAuth = () => {
  const token = localStorage.getItem("access_token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return <Outlet />; // Cho phép truy cập nếu đã đăng nhập
};

export default RequireAuth;
