import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import axiosInstance from "../services/axiosInstance";

const DEVICE_TOKEN_KEY = "device_token";

export function getDeviceToken() {
  return localStorage.getItem(DEVICE_TOKEN_KEY) || "";
}

function setDeviceToken(token) {
  localStorage.setItem(DEVICE_TOKEN_KEY, token.trim());
}

/**
 * Bảo vệ trang chấm công theo THIẾT BỊ (không phải theo người dùng):
 * mỗi máy kiosk chỉ cần nhập token 1 lần lúc setup, token lưu vĩnh viễn
 * trong localStorage của trình duyệt đó và được BE xác thực lại mỗi lần
 * gọi /face-checkin.
 */
export default function DeviceGuard({ children }) {
  const [state, setState] = useState({ checking: true, allowed: false, reason: "" });
  const [inputToken, setInputToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkToken = async (token) => {
    setState({ checking: true, allowed: false, reason: "" });
    try {
      const res = await axiosInstance.get("/allow-facecheckin", {
        headers: { "X-Device-Token": token },
      });
      setState({ checking: false, allowed: !!res.data?.allowed, reason: "" });
    } catch (err) {
      const reason = err?.data?.reason || err?.message || "Thiết bị chưa được cấp quyền";
      setState({ checking: false, allowed: false, reason });
    }
  };

  useEffect(() => {
    const existing = getDeviceToken();
    if (existing) {
      checkToken(existing);
    } else {
      setState({ checking: false, allowed: false, reason: "" });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setSubmitting(true);
    setDeviceToken(inputToken);
    await checkToken(inputToken.trim());
    setSubmitting(false);
  };

  if (state.checking) return <Loading message="Đang kiểm tra thiết bị" />;

  if (state.allowed) return <>{children}</>;

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="p-4 rounded shadow-sm bg-white" style={{ maxWidth: 420, width: "100%" }}>
        <h5 className="mb-3">Thiết bị chưa được cấp quyền chấm công</h5>
        <p className="text-muted small">
          Nhập mã thiết bị (device token) đã được cấp lúc setup máy này. Mã sẽ được lưu lại,
          chỉ cần nhập 1 lần duy nhất trên máy này.
        </p>
        {state.reason && <p className="text-danger small">{state.reason}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Dán device token vào đây"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? "Đang kiểm tra..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
}
