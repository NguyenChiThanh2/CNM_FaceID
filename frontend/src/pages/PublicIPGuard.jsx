// src/pages/PublicIPGuard.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from '../../src/components/Loading';

// Cho phép cấu hình qua .env (Vite) hoặc hard-code tạm
const ALLOWED_PUBLIC_IPS = (import.meta.env.VITE_ALLOWED_PUBLIC_IPS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// fallback: có thể hard-code tạm nếu chưa set env
// const ALLOWED_PUBLIC_IPS = ["113.23.45.67"];

const IP_APIS = [
  "https://api.ipify.org?format=json",
  "https://ifconfig.co/json",
  "https://ipinfo.io/json"
];

async function getPublicIP() {
  for (const url of IP_APIS) {
    try {
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      // Chuẩn hóa key ip
      const ip = data.ip || data.query || data.origin || "";
      if (ip) return ip;
    } catch {}
  }
  // Thử ipify dạng text (backup)
  try {
    const res = await fetch("https://api.ipify.org");
    if (res.ok) return (await res.text()).trim();
  } catch {}
  return "";
}

export default function PublicIPGuard({ children }) {
  const [state, setState] = useState({ checking: true, allowed: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ip = await getPublicIP();
      const allowed = ALLOWED_PUBLIC_IPS.includes(ip);
      if (!cancelled) setState({ checking: false, allowed });
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.checking) return <div><Loading /></div>;
  if (!state.allowed) return <Navigate to="/404" replace />;
  return children;
}
