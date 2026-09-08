import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { attachAuthToken } from './utils/auth'
import 'bootstrap/dist/css/bootstrap.min.css';

// Nhiều component vẫn gọi axios mặc định (import axios from "axios") thay vì
// axiosInstance dùng chung — gắn token ở đây để các request đó cũng có JWT
// thay vì âm thầm gửi không có Authorization và bị BE trả 401.
attachAuthToken(axios);


// createRoot(document.getElementById('root')).render(
//   <StrictMode> {/* sẽ chạy hai lần trong môi trường development. Cmt khi khi build dev */}
//     <App />
//   </StrictMode>,
// )
createRoot(document.getElementById('root')).render(<App />);