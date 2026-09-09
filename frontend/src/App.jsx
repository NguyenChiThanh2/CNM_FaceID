import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import TrangChu from "./pages/TrangChu";
import QuanLyNhanSu from "./pages/modules/QuanLyNhanSu";
import QuanlyNghiPhep from "./pages/modules/QuanLyNghiPhep";
import QuanLyLoaiNghiPhep from "./pages/modules/QuanLyLoaiNghiPhep";
import QuanLyPhucLoi from "./pages/modules/QuanLyPhucLoi";
import QuanLyPhongBan from "./pages/modules/QuanLyPhongBan";
import NhanSuDetail from "./pages/modules/NhanSuDetail";
import QuanLyLuong from "./pages/modules/QuanLyLuong";
import QuanLyChamCong from "./pages/modules/QuanLyChamCong";
import FaceCheckIn from "./pages/modules/FaceCheckIn";
import DanhSachNhanVien from "./components/phongban/DanhSachNhanVien";
import QuanLyDanhGia from "./pages/modules/QuanLyDanhGia";
import DangNhap from "./pages/dangNhap";
import PrivateRoute from "./pages/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "./App.css";
import Sidebar from "./components/sidebar/sidebar";
import NotFound from "./pages/NotFound";
import ChamCongNhanVien from "./pages/modules/ChamCongNhanVien";
import QuanLyGiayPhep from "./pages/modules/QuanLyGiayPhep";
import Thuong from "./pages/modules/QuanLyThuong";
import KhauTru from "./pages/modules/QuanLyKhauTru";
import NgayNghiLe from "./pages/modules/QuanLyNgayNghiLe";
import NguoiPhuThuocPage from "./pages/modules/QuanLyNguoiPhuThuoc";
import DeviceGuard from "./pages/DeviceGuard";
import QuanLyThueVaBaoHiem from "./pages/modules/QuanLyThueVaBaoHiem";
import "./styles/danhgia.css";
import { LayoutGrid } from "lucide-react";

const AppLayout = () => {
  const location = useLocation();
  const hideNavbarPaths = ["/dang-nhap", "/404", "/cham-cong-face"];
  const isNavbarVisible = !hideNavbarPaths.includes(location.pathname);

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 992);
  const [showOverlaySidebar, setShowOverlaySidebar] = React.useState(false);

  const toggleSidebar = () => {
    if (isMobile) setShowOverlaySidebar((v) => !v);
    else setIsCollapsed((c) => !c);
  };

  const expandSidebar = () => {
    if (isMobile) setShowOverlaySidebar(true);
    else setIsCollapsed(false);
  };

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setShowOverlaySidebar(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => setShowOverlaySidebar(false), [location.pathname]);

  const shouldShowSidebar = isNavbarVisible && (!isMobile || showOverlaySidebar);

  return (
    <div
      className="d-flex flex-column flex-lg-row vh-100 vw-100 overflow-hidden"
      style={{ 
        transition: "all 0.3s ease",
        background: isNavbarVisible ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)" : "transparent"
      }}
    >
      {/* SIDEBAR */}
      {shouldShowSidebar && (
        <Sidebar
          isCollapsed={!isMobile ? isCollapsed : false}
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          isOpen={(!isMobile && !isCollapsed) || showOverlaySidebar}
          expandSidebar={expandSidebar}
        />
      )}

      {/* MAIN CONTENT */}
      <div
        className="flex-grow-1 d-flex flex-column"
        onClick={() => {
          if (isMobile && showOverlaySidebar) setShowOverlaySidebar(false);
          else if (!isMobile) setIsCollapsed(true);
        }}
        style={{
          transition: "margin-left 0.3s ease",
          marginLeft:
            isNavbarVisible && !isMobile ? (isCollapsed ? "80px" : "260px") : 0,
          overflowX: "hidden",
          minHeight: "100vh",
          width: "100%"
        }}
      >
        {/* HEADER MOBILE */}
        {isMobile && isNavbarVisible && (
          <header
            className="d-flex align-items-center justify-content-between px-3 py-2 sticky-top shadow-sm"
            style={{ 
              zIndex: 1030,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white"
            }}
          >
            <button
              className="btn btn-outline-light d-flex align-items-center border-0"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              aria-expanded={showOverlaySidebar}
              aria-label="Toggle sidebar"
            >
              <LayoutGrid size={22} />
            </button>
            <h6 className="m-0 fw-semibold text-truncate">
              Hệ thống quản lý
            </h6>
          </header>
        )}

        {/* MAIN CONTENT WRAPPER */}
        <main 
          className="flex-grow-1"
          style={{
            overflowX: "auto",
            transition: "all 0.3s ease",
            padding: 0,
            margin: 0,
            width: "100%"
          }}
        >
          <Routes>
            <Route path="/dang-nhap" element={<DangNhap />} />
            <Route
              path="/cham-cong-face"
              element={
                <DeviceGuard>
                  <FaceCheckIn />
                </DeviceGuard>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <TrangChu />
                </PrivateRoute>
              }
            />
            <Route
              path="/nhan-su"
              element={
                <PrivateRoute>
                  <QuanLyNhanSu />
                </PrivateRoute>
              }
            />
            <Route
              path="/nghi-phep"
              element={
                <PrivateRoute>
                  <QuanlyNghiPhep />
                </PrivateRoute>
              }
            />
            <Route
              path="/loai-nghi-phep"
              element={
                <PrivateRoute>
                  <QuanLyLoaiNghiPhep />
                </PrivateRoute>
              }
            />
            <Route
              path="/ql-thue-bh"
              element={
                <PrivateRoute>
                  <QuanLyThueVaBaoHiem />
                </PrivateRoute>
              }
            />
            <Route
              path="/phuc-loi"
              element={
                <PrivateRoute>
                  <QuanLyPhucLoi />
                </PrivateRoute>
              }
            />
            <Route
              path="/phong-ban"
              element={
                <PrivateRoute>
                  <QuanLyPhongBan />
                </PrivateRoute>
              }
            />
            <Route
              path="/danh-gia"
              element={
                <PrivateRoute>
                  <QuanLyDanhGia />
                </PrivateRoute>
              }
            />
            <Route
              path="/nhan-su/:id"
              element={
                <PrivateRoute>
                  <NhanSuDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/quan-ly-cham-cong"
              element={
                <PrivateRoute>
                  <QuanLyChamCong />
                </PrivateRoute>
              }
            />
            <Route
              path="/tinh-luong"
              element={
                <PrivateRoute>
                  <QuanLyLuong />
                </PrivateRoute>
              }
            />
            <Route
              path="/get-phong-ban-by-id/:id"
              element={
                <PrivateRoute>
                  <DanhSachNhanVien />
                </PrivateRoute>
              }
            />
            <Route
              path="/thuong"
              element={
                <PrivateRoute>
                  <Thuong />
                </PrivateRoute>
              }
            />
            <Route
              path="/khau-tru"
              element={
                <PrivateRoute>
                  <KhauTru />
                </PrivateRoute>
              }
            />
            <Route
              path="/cham-cong-nhan-vien/:id"
              element={
                <PrivateRoute>
                  <ChamCongNhanVien />
                </PrivateRoute>
              }
            />
            <Route
              path="/quan-ly-giay-phep"
              element={
                <PrivateRoute>
                  <QuanLyGiayPhep />
                </PrivateRoute>
              }
            />
            <Route
              path="/ngay-nghi-le"
              element={
                <PrivateRoute>
                  <NgayNghiLe />
                </PrivateRoute>
              }
            />
            <Route
              path="/nguoi-phu-thuoc"
              element={
                <PrivateRoute>
                  <NguoiPhuThuocPage />
                </PrivateRoute>
              }
            />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>

          <div className="text-center pt-4">
            <p 
              className="text-muted mb-4" 
              style={{ 
                fontSize: "0.9rem",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "1.5rem"
              }}
            >
              © 2025 Lý Anh Khoa - Nguyễn Chí Thanh.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <div 
      className="w-100 overflow-hidden min-vh-100"
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        background: "transparent"
      }}
    >
      <ToastContainer position="top-right" autoClose={2500} newestOnTop />
      <Router>
        <AppLayout />
      </Router>
    </div>
  );
}

export default App;