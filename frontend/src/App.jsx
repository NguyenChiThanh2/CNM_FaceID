import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import TrangChu from "./pages/TrangChu";
import QuanLyNhanSu from "./pages/modules/QuanLyNhanSu";
import QuanlyNghiPhep from "./pages/modules/QuanLyNghiPhep";
import QuanLyDaoTao from "./pages/modules/QuanLyDaoTao";
import QuanLyPhucLoi from "./pages/modules/QuanLyPhucLoi";
import QuanLyPhongBan from "./pages/modules/QuanLyPhongBan";
import NhanSuDetail from "./pages/modules/NhanSuDetail";
import ChamCong from "./pages/modules/ChamCong";
import QuanLyLuong from "./pages/modules/QuanLyLuong";
import QuanLyChamCong from "./pages/modules/QuanLyChamCong";
import ChamCongForm from './components/chamcong/ChamCongForm';
import FaceCheckIn from "./pages/modules/FaceCheckIn";
import DanhSachNhanVien from "./components/phongban/DanhSachNhanVien";
import QuanLyNguoiDung from "./pages/modules/QuanLyNguoiDung";
import QuanLyDanhGia from "./pages/modules/QuanLyDanhGia";
import DangNhap from "./pages/dangNhap";
import PrivateRoute from "./pages/PrivateRoute";
import { ToastContainer } from "react-toastify";
import './App.css';
import Sidebar from "./components/sidebar/sidebar";
import NotFound from "./pages/NotFound";
import ChamCongNhanVien from "./pages/modules/ChamCongNhanVien";
import QuanLyGiayPhep from "./pages/modules/QuanLyGiayPhep";
import MacGuard from "./pages/MacGuard";
const AppLayout = () => {
  const location = useLocation();
  const hideNavbarPaths = ["/dang-nhap", "/404", "/cham-cong-face"];
  const isNavbarVisible = !hideNavbarPaths.includes(location.pathname);

  return (
    <div style={{ display: "flex" }}>
      {isNavbarVisible && <Sidebar />}

      <div style={{ marginLeft: isNavbarVisible ? "250px" : "0", width: "100%" }}>
        <Routes>
          <Route path="/dang-nhap" element={<DangNhap />} />
          {/* chặn truy cập vào trang chamcong khi ở khác mạng công ty */}
          <Route
            path="/cham-cong-face"
            element={
              <MacGuard>
                <FaceCheckIn />
              </MacGuard>

            }
          />

          <Route path="/" element={<PrivateRoute><TrangChu /></PrivateRoute>} />
          <Route path="/nhan-su" element={<PrivateRoute><QuanLyNhanSu /></PrivateRoute>} />
          <Route path="/nghi-phep" element={<PrivateRoute><QuanlyNghiPhep /></PrivateRoute>} />
          {/* <Route path="/dao-tao" element={<PrivateRoute><QuanLyDaoTao /></PrivateRoute>} /> */}
          <Route path="/phuc-loi" element={<PrivateRoute><QuanLyPhucLoi /></PrivateRoute>} />
          <Route path="/cham-cong" element={<PrivateRoute><ChamCong /></PrivateRoute>} />
          <Route path="/phong-ban" element={<PrivateRoute><QuanLyPhongBan /></PrivateRoute>} />
          <Route path="/danh-gia" element={<PrivateRoute><QuanLyDanhGia /></PrivateRoute>} />
          <Route path="/nhan-su/:id" element={<PrivateRoute><NhanSuDetail /></PrivateRoute>} />
          <Route path="/quan-ly-cham-cong" element={<PrivateRoute><QuanLyChamCong /></PrivateRoute>} />
          <Route path="/tinh-luong" element={<PrivateRoute><QuanLyLuong /></PrivateRoute>} />
          <Route path="/get-phong-ban-by-id/:id" element={<PrivateRoute><DanhSachNhanVien /></PrivateRoute>} />
          {/* <Route path="/cham-cong-list" element={<PrivateRoute><ChamCongList /></PrivateRoute>} /> */}
          <Route path="/cham-cong-form" element={<PrivateRoute><ChamCongForm /></PrivateRoute>} />
          <Route path="/quan-ly-nguoi-dung" element={<PrivateRoute><QuanLyNguoiDung /></PrivateRoute>} />
          <Route path="/cham-cong-nhan-vien/:id" element={<PrivateRoute><ChamCongNhanVien /></PrivateRoute>} />
          <Route path="/quan-ly-giay-phep" element={<PrivateRoute><QuanLyGiayPhep /></PrivateRoute>} />

          {/* Trang 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </div>
    </div>
  );
};


function App() {
  return (
    <div style={{ width: "100vw", overflowX: "hidden", minHeight: "100vh" }}>
      <Router>
        <AppLayout />
      </Router>
      {/* <ToastContainer
        position="top-right"
        autoClose={2000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover
        draggable
        containerStyle={{ zIndex: 999999 }}  
      /> */}
    </div>
  );
}

export default App; 
