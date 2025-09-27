// src/pages/GeoLocationGuard.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ALLOWED_LAT = parseFloat(import.meta.env.VITE_ALLOWED_LAT || "10.0232481");
const ALLOWED_LNG = parseFloat(import.meta.env.VITE_ALLOWED_LNG || "106.6360097");
const ALLOWED_RADIUS_M = parseFloat(import.meta.env.VITE_ALLOWED_RADIUS_M || "500");

function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function GeoLocationGuard({ children }) {
  const [state, setState] = useState({ checking: true, allowed: false, reason: "" });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({ checking: false, allowed: false, reason: "Trình duyệt không hỗ trợ định vị." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        const d = distanceMeters(latitude, longitude, ALLOWED_LAT, ALLOWED_LNG);
        const ok = (d - (accuracy || 0)) <= ALLOWED_RADIUS_M;
        const note = accuracy && accuracy > 200
          ? " (độ chính xác kém, hãy bật GPS/đến nơi thoáng)"
          : "";

        setState({
          checking: false,
          allowed: ok,
          reason: ok ? "" :
            `Ngoài vùng cho phép: ~${Math.round(d)} m (ngưỡng ${ALLOWED_RADIUS_M} m, accuracy≈${Math.round(accuracy||0)} m${note})`
        });
      },
      err => {
        setState({ checking: false, allowed: false, reason: "Không thể lấy vị trí: " + err.message });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  if (state.checking) return <div style={{ padding: 24 }}>Đang kiểm tra vị trí…</div>;
  if (!state.allowed) return <Navigate to="/404" replace />;
  return children;
}
