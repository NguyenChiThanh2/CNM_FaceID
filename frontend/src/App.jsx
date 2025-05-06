import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import './App.css';
import ChamCongList from "./pages/modules/ChamCongList";
import ChamCongFaceRecognition from "./components/chamcong/ChamCongFaceRecognition";
import ChamCongForm from './components/chamcong/ChamCongForm';
import FaceRecognition from './components/chamcong/FaceRecognition';
import FaceCheckIn from "./components/chamcong/FaceCheckIn";
import DanhSachNhanVien from "./components/phongban/DanhSachNhanVien";
import QuanLyDanhGia from "./pages/modules/QuanLyDanhGia";
function App() {
  return (
    <div style={{ width: "100vw", overflowX: "hidden", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<TrangChu />} />
          <Route path="/nhan-su" element={<QuanLyNhanSu />} />
          <Route path="/nghi-phep" element={<QuanlyNghiPhep />} />
          <Route path="/dao-tao" element={<QuanLyDaoTao />} />
          <Route path="/phuc-loi" element={<QuanLyPhucLoi />} />
          <Route path="/cham-cong" element={<ChamCong />} />
          <Route path="/phong-ban" element={<QuanLyPhongBan />} />
          <Route path="/danh-gia" element={<QuanLyDanhGia />} />
          <Route path="/nhan-su/:id" element={<NhanSuDetail />} />
          <Route path="/quan-ly-cham-cong" element={<ChamCongList />} />
          <Route path="/cham-cong/recognize" element={<ChamCongFaceRecognition />} />
          <Route path="/cham-cong-face" element={<FaceCheckIn />} />
          <Route path="/tinh-luong" element={<QuanLyLuong />} />
          <Route path="/phong-ban/:id/nhan-vien" element={<DanhSachNhanVien />} />

          {/* Thêm các route cho các component mới */}
          <Route path="/cham-cong-list" element={<ChamCongList />} />
          <Route path="/cham-cong-form" element={<ChamCongForm />} />
          <Route path="/face-recognition" element={<FaceRecognition />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
