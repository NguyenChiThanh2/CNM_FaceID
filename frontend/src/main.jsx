import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { attachAuthToken, attachSessionExpiredRedirect } from './utils/auth'
import 'bootstrap/dist/css/bootstrap.min.css';

// Nhiều component vẫn gọi axios mặc định (import axios from "axios") thay vì
// axiosInstance dùng chung — gắn token ở đây để các request đó cũng có JWT
// thay vì âm thầm gửi không có Authorization và bị BE trả 401.
attachAuthToken(axios);
// 401 (hết phiên) ở các request này cũng phải tự đăng xuất + điều hướng,
// giống hệt hành vi của axiosInstance.
attachSessionExpiredRedirect(axios);


// StrictMode chỉ ảnh hưởng môi trường dev (không chạy trong bản build
// production) — cố tình gọi lại 2 lần các hàm như effect/render để lộ ra
// side-effect thiếu cleanup (vd không dừng camera/stream) ngay lúc dev thay
// vì để tới khi người dùng thật gặp rò rỉ.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);