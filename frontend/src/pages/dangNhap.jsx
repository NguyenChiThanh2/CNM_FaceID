// src/pages/dangNhap.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser, FaLock } from "react-icons/fa";
import { loginApi } from "../services/authService";

const DangNhap = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) navigate("/", { replace: true });
  }, [navigate]);

  const handleLogin = async () => {
    if (loading) return;

    if (!emailOrPhone.trim() || !password.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      // Nếu loginApi nhận 2 tham số (emailOrPhone, password)
      const res = await loginApi(emailOrPhone.trim(), password.trim());

      // Nếu loginApi nhận object, dùng:
      // const res = await loginApi({ email_or_phone: emailOrPhone.trim(), password: password.trim() });

      const { access_token, nhan_vien } = res.data || {};
      if (!access_token || !nhan_vien) {
        toast.error("Phản hồi đăng nhập không hợp lệ");
        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          token: access_token,
          nhan_vien: {
            id: nhan_vien.id,
            ho_ten: nhan_vien.ho_ten,
            email: nhan_vien.email,
            so_dien_thoai: nhan_vien.so_dien_thoai,
            chuc_vu_id: nhan_vien.chuc_vu_id,
            phong_ban_id: nhan_vien.phong_ban_id,
            avatar: nhan_vien.avatar,
          },
        })
      );

      navigate("/", { replace: true });
    } catch (error) {
      const msg =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        "Email/SĐT hoặc mật khẩu không đúng!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{ background: "linear-gradient(135deg, #1c1f24 0%, rgb(54,57,61) 100%)" }}
      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
    >
      <div className="shadow p-5 rounded-4" style={{ width: "100%", maxWidth: 400, backgroundColor: "#f8f9fa" }}>
        <h3 className="text-center mb-4 fw-bold text-dark">Đăng nhập hệ thống</h3>

        <div className="mb-3 input-group">
          <span className="input-group-text bg-white"><FaUser /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Email hoặc SĐT"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
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
          disabled={loading}
          style={{
            background: "linear-gradient(90deg, #343a40 0%, #212529 100%)",
            color: "#fff",
            transition: "background 0.3s ease",
            opacity: loading ? 0.8 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "linear-gradient(90deg, #495057 0%, #343a40 100%)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "linear-gradient(90deg, #343a40 0%, #212529 100%)")}
          onClick={handleLogin}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-center text-muted mt-3" style={{ fontSize: "0.9rem" }}>
          © 2025 Công ty TNHH TK
        </p>
      </div>
    </div>
  );
};

export default DangNhap;
