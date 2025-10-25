// src/pages/dangNhap.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser, FaLock } from "react-icons/fa";
import { loginApi } from "../services/authService";
import { Tent } from "lucide-react";

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
      const res = await loginApi(emailOrPhone.trim(), password.trim());

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
            ten_phong_ban: nhan_vien.ten_phong_ban || "",
            ten_chuc_vu: nhan_vien.ten_chuc_vu || "",
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
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        minHeight: "100vh",
        width: "100vw",
        margin: 0,
        padding: 0,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden"
      }}
      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />

      {/* Login Card */}
      <div
        className="shadow-lg p-4 rounded-4 border-0 position-relative"
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          zIndex: 1
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="mb-3">
            <div
              className="rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: 60,
                height: 60,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
              }}
            >
              <FaUser className="text-white" size={24} />
            </div>
          </div>
          <h3 className="fw-bold mb-2" style={{ color: "#2d3748" }}>
            Đăng nhập hệ thống
          </h3>
          <p className="text-muted" style={{ fontSize: "0.9rem" }}>
            Chào mừng bạn trở lại
          </p>
        </div>

        {/* Form */}
        <div className="mb-3">
          <label
            className="form-label fw-semibold"
            style={{ color: "#4a5568", fontSize: "0.9rem" }}
          >
            Tên đăng nhập
          </label>
          <div className="input-group">
            <span
              className="input-group-text border-end-0"
              style={{
                backgroundColor: "#f8f9fa",
                borderColor: "#e2e8f0",
                transition: "all 0.3s ease"
              }}
            >
              <FaUser className="text-secondary" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Email hoặc số điện thoại"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              style={{
                borderColor: "#e2e8f0",
                backgroundColor: "#fff",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 2px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <label
              className="form-label fw-semibold"
              style={{ color: "#4a5568", fontSize: "0.9rem" }}
            >
              Mật khẩu
            </label>
            <a
              href="#"
              className="text-decoration-none"
              style={{
                fontSize: "0.85rem",
                color: "#667eea",
                transition: "color 0.3s ease"
              }}
              onMouseEnter={(e) => (e.target.style.color = "#764ba2")}
              onMouseLeave={(e) => (e.target.style.color = "#667eea")}
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="input-group">
            <span
              className="input-group-text border-end-0"
              style={{
                backgroundColor: "#f8f9fa",
                borderColor: "#e2e8f0",
                transition: "all 0.3s ease"
              }}
            >
              <FaLock className="text-secondary" />
            </span>
            <input
              type="password"
              className="form-control border-start-0"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                borderColor: "#e2e8f0",
                backgroundColor: "#fff",
                transition: "all 0.3s ease"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#667eea";
                e.target.style.boxShadow = "0 0 0 2px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          className="btn w-100 fw-semibold py-2 mb-3 border-0"
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            fontSize: "1rem",
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: "8px",
            boxShadow: "0 4px 15px 0 rgba(102, 126, 234, 0.3)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px 0 rgba(102, 126, 234, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px 0 rgba(102, 126, 234, 0.3)";
            }
          }}
          onClick={handleLogin}
        >
          {loading ? (
            <div className="d-flex align-items-center justify-content-center">
              <div
                className="spinner-border spinner-border-sm me-2"
                style={{ width: "1rem", height: "1rem", borderWidth: "2px" }}
              />
              <span>Đang đăng nhập...</span>
            </div>
          ) : (
            "Đăng nhập"
          )}
        </button>

        {/* Footer */}
        <div
          className="text-center mt-4 pt-3"
          style={{ borderTop: "1px solid #e2e8f0" }}
        >
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            © 2025 Công ty TNHH TC. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DangNhap;