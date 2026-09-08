export const getCurrentUser = () => {
  const saved = localStorage.getItem("user");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const getNhanVienInfo = () => {
  const user = getCurrentUser();
  return user?.nhan_vien || null;
};

// Đọc 1 cookie theo tên. Dùng để lấy CSRF token do BE set (cookie
// "csrf_access_token") — cookie này KHÔNG httpOnly nên JS đọc được, đúng theo
// thiết kế "double-submit cookie" của flask-jwt-extended.
const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// JWT giờ nằm trong cookie httpOnly (set ở BE lúc /login) — JS không đọc được
// nữa nên không còn "gắn token" theo nghĩa cũ. Trình duyệt tự động đính kèm
// cookie ở mọi request cùng site, nên phải tự chống CSRF cho các request có
// thể đổi dữ liệu bằng cách gắn thêm CSRF token (đọc từ cookie đọc được) vào
// header — BE so khớp giá trị này với phần CSRF nhúng trong chính JWT.
export const attachAuthToken = (axiosInstance) => {
  axiosInstance.defaults.withCredentials = true;
  axiosInstance.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      const csrfToken = readCookie("csrf_access_token");
      if (csrfToken) {
        config.headers["X-CSRF-TOKEN"] = csrfToken;
      }
    }
    return config;
  });
};
