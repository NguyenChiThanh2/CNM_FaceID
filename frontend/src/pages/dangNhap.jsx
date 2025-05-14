import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

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

      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem("user", JSON.stringify({
        username,
        role: role.ma_vai_tro,
        ma_vai_tro: role.ma_vai_tro,
        token: access_token
      }));

      // Hiển thị thông báo thành công với tên vai trò
      toast.success(`Đăng nhập thành công với vai trò: ${role.ma_vai_tro}`);

      navigate("/");
    } catch (error) {
      toast.error("Tên đăng nhập hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card p-4 shadow" style={{ width: 400 }}>
        <h3 className="text-center mb-4">Đăng nhập</h3>
        <input
          className="form-control mb-3"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="form-control mb-3"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary w-100" onClick={handleLogin}>
          Đăng nhập
        </button>
      </div>
    </div>
  );
};

export default DangNhap;
