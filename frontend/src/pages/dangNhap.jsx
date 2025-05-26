import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUser, FaLock } from "react-icons/fa";

const DangNhap = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
      });

      const { access_token, role } = response.data;

      localStorage.setItem("user", JSON.stringify({
        username,
        role,
        token: access_token
      }));

      toast.success(`Đăng nhập thành công với vai trò: ${role.ma_vai_tro}`);
      navigate("/");
    } catch (error) {
      toast.error("Tên đăng nhập hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: "linear-gradient(135deg, #1c1f24 0%,rgb(54, 57, 61) 100%)"
      }}
    >
      <div
        className="shadow p-5 rounded-4"
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3 className="text-center mb-4 fw-bold text-dark">
          Đăng nhập hệ thống
        </h3>

        <div className="mb-3 input-group">
          <span className="input-group-text bg-white"><FaUser /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-4 input-group">
          <span className="input-group-text bg-white"><FaLock /></span>
          <input
            type="password"
            className="form-control"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn w-100 fw-semibold py-2"
          style={{
            background: "linear-gradient(90deg, #343a40 0%, #212529 100%)",
            color: "#fff",
            transition: "background 0.3s ease"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(90deg, #495057 0%, #343a40 100%)"}
          onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(90deg, #343a40 0%, #212529 100%)"}
          onClick={handleLogin}
        >
          Đăng nhập
        </button>

        <p className="text-center text-muted mt-3" style={{ fontSize: "0.9rem" }}>
          © 2025 Công ty TNHH TK
        </p>
      </div>
    </div>
  );
};

export default DangNhap;
