import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import TrangChu from "./pages/TrangChu";
import QuanLyNhanSu from "./pages/modules/QuanLyNhanSu";
import QuanlyNghiPhep from "./pages/modules/QuanLyNghiPhep";
import QuanLyDaoTao from "./pages/modules/QuanLyDaoTao";
import QuanLyPhucLoi from "./pages/modules/QuanLyPhucLoi";
import QuanLyPhongBan from "./pages/modules/QuanLyPhongBan";
import NhanSuDetail from "./pages/modules/NhanSuDetail";
import ChamCong from "./pages/modules/ChamCong";
import QuanLyLuong from "./pages/modules/QuanLyLuong";
import ChamCongList from "./pages/modules/ChamCongList";
import ChamCongFaceRecognition from "./components/chamcong/ChamCongFaceRecognition";
import ChamCongForm from './components/chamcong/ChamCongForm';
import FaceRecognition from './components/chamcong/FaceRecognition';
import FaceCheckIn from "./components/chamcong/FaceCheckIn";
import DanhSachNhanVien from "./components/phongban/DanhSachNhanVien";
import QuanLyDanhGia from "./pages/modules/QuanLyDanhGia";
import DangNhap from "./pages/dangNhap";
import PrivateRoute from "./pages/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './App.css';
import Sidebar from "./components/sidebar/sidebar";

const AppLayout = () => {
  const location = useLocation();
  const hideNavbarPaths = ["/dang-nhap"];
  const isNavbarVisible = !hideNavbarPaths.includes(location.pathname);

  return (
    <div style={{ display: "flex" }}>
      {isNavbarVisible && <Sidebar />} {/* Chỉ hiển thị Sidebar khi cần */}

      <div style={{ marginLeft: isNavbarVisible ? "250px" : "0", width: "100%" }}>
        <Routes>
          <Route path="/dang-nhap" element={<DangNhap />} />
          <Route path="/" element={<PrivateRoute><TrangChu /></PrivateRoute>} />
          <Route path="/nhan-su" element={<PrivateRoute><QuanLyNhanSu /></PrivateRoute>} />
          <Route path="/nghi-phep" element={<PrivateRoute><QuanlyNghiPhep /></PrivateRoute>} />
          <Route path="/dao-tao" element={<PrivateRoute><QuanLyDaoTao /></PrivateRoute>} />
          <Route path="/phuc-loi" element={<PrivateRoute><QuanLyPhucLoi /></PrivateRoute>} />
          <Route path="/cham-cong" element={<PrivateRoute><ChamCong /></PrivateRoute>} />
          <Route path="/phong-ban" element={<PrivateRoute><QuanLyPhongBan /></PrivateRoute>} />
          <Route path="/danh-gia" element={<PrivateRoute><QuanLyDanhGia /></PrivateRoute>} />
          <Route path="/nhan-su/:id" element={<PrivateRoute><NhanSuDetail /></PrivateRoute>} />
          <Route path="/quan-ly-cham-cong" element={<PrivateRoute><ChamCongList /></PrivateRoute>} />
          <Route path="/cham-cong/recognize" element={<PrivateRoute><ChamCongFaceRecognition /></PrivateRoute>} />
          <Route path="/cham-cong-face" element={<PrivateRoute><FaceCheckIn /></PrivateRoute>} />
          <Route path="/tinh-luong" element={<PrivateRoute><QuanLyLuong /></PrivateRoute>} />
          <Route path="/phong-ban/:id/nhan-vien" element={<PrivateRoute><DanhSachNhanVien /></PrivateRoute>} />
          <Route path="/cham-cong-list" element={<PrivateRoute><ChamCongList /></PrivateRoute>} />
          <Route path="/cham-cong-form" element={<PrivateRoute><ChamCongForm /></PrivateRoute>} />
          <Route path="/face-recognition" element={<PrivateRoute><FaceRecognition /></PrivateRoute>} />
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
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default App;
