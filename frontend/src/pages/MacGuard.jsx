import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Đọc danh sách MAC cho phép từ .env (Vite):
 * VITE_ALLOWED_MACS="42-A8-0F-B9-B9-95, 00-11-22-33-44-55"
 * hoặc "42:A8:0F:B9:B9:95" đều được.
 */
const allowedFromEnv = (import.meta.env.VITE_ALLOWED_MACS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function norm(mac = "") {
  // chuẩn hoá: uppercase + bỏ : - .
  return mac.toUpperCase().replace(/[^A-F0-9]/g, "");
}

export default function MacGuard({ children }) {
  const [state, setState] = useState({ loading: true, allowed: false, reason: "" });
  const location = useLocation();

  useEffect(() => {
    const allowedSet = new Set(allowedFromEnv.map(norm));

    async function check() {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/network-info", { credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // adapters có thể là object hoặc array → ép về array
        const adapters = Array.isArray(data.adapters) ? data.adapters : (data.adapters ? [data.adapters] : []);

        // gom TẤT CẢ MAC đang IPEnabled
        const macs = adapters
          .map(a => a.MACAddress)
          .filter(Boolean);

        // cho qua nếu BẤT KỲ MAC nào match whitelist
        const ok = macs.some(m => allowedSet.has(norm(m)));

        setState({
          loading: false,
          allowed: ok,
          reason: ok ? "" : `Thiết bị này không có MAC hợp lệ. Thấy: ${macs.join(", ") || "không có"}`
        });
      } catch (e) {
        setState({ loading: false, allowed: false, reason: `Không đọc được thông tin MAC (${e.message})` });
      }
    }

    check();
  }, [location.key]);

  if (state.loading) return <div className="p-6">Đang kiểm tra thiết bị…</div>;
  if (!state.allowed) {
    // Điều hướng về 404 (hoặc trang thông báo riêng)
    return <Navigate to="/404" state={{ reason: state.reason }} replace />;
  }
  return <>{children}</>;
}
