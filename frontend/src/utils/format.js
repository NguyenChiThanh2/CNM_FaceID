// utils/format.js
export const fmtVND = (v) =>
  typeof v === "number"
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)
    : v ?? "—";

export const fmtDate = (s) => (s ? new Date(s).toLocaleDateString("vi-VN") : "—");
