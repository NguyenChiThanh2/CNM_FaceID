// src/pages/PublicIPGuard.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

// Cho phép cấu hình qua .env (Vite) hoặc hard-code tạm
const ALLOWED_PUBLIC_ENTRIES = (import.meta.env.VITE_ALLOWED_PUBLIC_IPS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Các API để lấy public IP
const IP_APIS = [
  "https://api.ipify.org?format=json",
  "https://ifconfig.co/json",
  "https://ipinfo.io/json"
];

// Lấy public IP của client
async function getPublicIP() {
  for (const url of IP_APIS) {
    try {
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) continue;
      const data = await res.json().catch(() => ({}));
      const ip = data.ip || data.query || data.origin || "";
      if (ip) return ip;
    } catch {}
  }
  try {
    const res = await fetch("https://api.ipify.org");
    if (res.ok) return (await res.text()).trim();
  } catch {}
  return "";
}

// Resolve domain -> IP bằng Google DNS
async function resolveDomain(host) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${host}&type=A`, {
      headers: { accept: "application/dns-json" }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ip = data?.Answer?.find(a => a.type === 1)?.data || null; // type=1 = IPv4
    return ip;
  } catch {
    return null;
  }
}

export default function PublicIPGuard({ children }) {
  const [state, setState] = useState({ checking: true, allowed: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const myIP = await getPublicIP();
      let allowed = false;

      for (const entry of ALLOWED_PUBLIC_ENTRIES) {
        if (/^\d+\.\d+\.\d+\.\d+$/.test(entry)) {
          // entry là IP trực tiếp
          if (myIP === entry) {
            allowed = true;
            break;
          }
        } else {
          // entry là hostname (vd: nhansu.duckdns.org)
          const resolved = await resolveDomain(entry);
          if (resolved && myIP === resolved) {
            allowed = true;
            break;
          }
        }
      }

      if (!cancelled) setState({ checking: false, allowed });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.checking) return <div><Loading /></div>;
  if (!state.allowed) return <Navigate to="/404" replace />;
  return children;
}
