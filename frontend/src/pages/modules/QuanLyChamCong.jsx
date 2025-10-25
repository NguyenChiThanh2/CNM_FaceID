// src/pages/modules/QuanLyChamCong.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  Button, 
  Breadcrumb, 
  Spinner, 
  Card, 
  Row, 
  Col, 
  Form,
  Table,
  Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { 
  FaHome, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaClock,
  FaUserClock,
  FaImage,
  FaCalendarAlt
} from "react-icons/fa";

import {
  searchNhanVienByName,
  getAllChamCong,
  deleteChamCong as apiDeleteChamCong,
  getAllNhanVien,
} from "../../services/chamCongApi";
import axiosInstance from "../../services/axiosInstance";
import Loading from "../../../src/components/Loading";

const ITEMS_PER_PAGE = 10;

const QuanLyChamCong = () => {
  // Tìm kiếm gợi ý NV theo tên (ô trên)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Bảng chấm công
  const [chamCongList, setChamCongList] = useState([]);
  const [dsNhanVien, setDsNhanVien] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState(""); // filter trong bảng
  const [loadingTable, setLoadingTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  // Base URL cho ảnh (lấy từ axiosInstance để không bị lệch env)
  const API_BASE =
    (axiosInstance.defaults.baseURL || "").replace(/\/+$/, "") ||
    (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api");
  
  const getUserInfo = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return null;

      const parsed = JSON.parse(storedUser);
      const nv = parsed.nhan_vien || {};

      return {
        id: nv.id,
        ho_ten: nv.ho_ten,
        phong_ban_id: nv.phong_ban_id,
        ten_phong_ban: nv.ten_phong_ban || "",
        role: parsed.role?.ma_vai_tro || "user",
      };
    } catch {
      return null;
    }
  };
  
  const HR_DEPARTMENT_ID = 2;
  const userInfo = getUserInfo();

  // ====== Load dữ liệu ban đầu ======
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadingTable(true);
      try {
        const [chamCong, nhanVien] = await Promise.all([
          getAllChamCong(),
          getAllNhanVien(),
        ]);
        let list = Array.isArray(chamCong) ? chamCong : [];

        // Nếu không phải phòng nhân sự → chỉ hiển thị bản ghi của chính họ
        if (userInfo && userInfo.phong_ban_id !== HR_DEPARTMENT_ID) {
          list = list.filter(cc => cc.nhan_vien_id === userInfo.id);
        }

        setChamCongList(list);
        setDsNhanVien(Array.isArray(nhanVien) ? nhanVien : []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải dữ liệu chấm công/nhân viên!");
      } finally {
        setLoadingTable(false);
        setLoading(false);
      }
    })();
  }, []);

  // ====== Debounce search gợi ý NV theo tên ======
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        setLoadingSearch(true);
        const list = await searchNhanVienByName(query.trim());
        setResults(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Error searching:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // ====== Helpers ======
  const getTenNhanVien = (id) =>
    dsNhanVien.find((x) => x.id === id)?.ho_ten || "Không rõ";

  const formatDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? "-" : dt.toLocaleDateString("vi-VN");
  };

  const formatTime = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt)
      ? d
      : dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getImgUrl = (file) => (file ? `${API_BASE}/checkin_images/${file}` : "");

  const getStatusBadge = (chamCong) => {
    if (chamCong.trang_thai) {
      return (
        <Badge bg={
          chamCong.trang_thai === "Hoàn tất" ? "success" :
          chamCong.trang_thai === "Đi trễ" ? "warning" :
          chamCong.trang_thai === "Vắng mặt" ? "danger" : "secondary"
        }>
          {chamCong.trang_thai}
        </Badge>
      );
    }
    return (
      <Badge bg={chamCong.thoi_gian_ra ? "success" : "primary"}>
        {chamCong.thoi_gian_ra ? "Hoàn tất" : "Chưa ra"}
      </Badge>
    );
  };

  // --- Tìm kiếm theo ngày (chuỗi) hoặc tên NV
  const filteredList = chamCongList.filter((cc) => {
    const ngayStr = formatDate(cc.ngay);
    const tenNhanVien = getTenNhanVien(cc.nhan_vien_id).toLowerCase();
    const key = (searchKeyword || "").toLowerCase();
    return ngayStr.toLowerCase().includes(key) || tenNhanVien.includes(key);
  });

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const paginate = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa chấm công này không?")) return;
    try {
      await toast.promise(apiDeleteChamCong(id), {
        pending: "Đang xóa chấm công...",
        success: "Đã xóa chấm công!",
        error: "Xóa chấm công thất bại!",
      });
      // reload bảng
      setLoadingTable(true);
      const data = await getAllChamCong();
      setChamCongList(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Lỗi khi xóa chấm công:", error);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleRowClick = (chamCong) => navigate(`/cham-cong/${chamCong.id}`);
  const handleRowClick_tennv = (nv) => navigate(`/cham-cong-nhan-vien/${nv.id}`);

  // ====== Render ======
  if (loading)
        return (
          <div>
            <ToastContainer position="top-right" autoClose={2000} />
            <Loading />
          </div>
        );
  return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <div 
        className="rounded-4 mb-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "2rem",
          color: "white"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Breadcrumb className="mb-3">
              <Breadcrumb.Item active style={{ color: "white" }}>
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Quản lý chấm công
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">⏰ Quản lý Chấm công</h1>
            <p className="mb-0 opacity-90">
              Theo dõi và quản lý lịch sử chấm công của nhân viên
            </p>
          </div>
          <Button 
            variant="outline-light" 
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            <FaHome className="me-2" />
            Trang chủ
          </Button>
        </div>
      </div>

      {/* Search Employee for HR */}
      {userInfo?.phong_ban_id === HR_DEPARTMENT_ID && (
        <Card className="shadow-sm border-0 rounded-4 mb-4">
          <Card.Header 
            style={{
              background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
              color: "white",
              fontWeight: "600"
            }}
          >
            <FaSearch className="me-2" />
            Tìm kiếm Nhân viên
          </Card.Header>
          <Card.Body className="p-4">
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
              <Form.Control
                type="text"
                placeholder="Nhập tên nhân viên để tìm kiếm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
            
            {loadingSearch && (
              <div className="text-center mt-3">
                <Spinner animation="border" size="sm" variant="primary" />
                <span className="ms-2 text-muted">Đang tìm kiếm...</span>
              </div>
            )}
            
            {!loadingSearch && results.length > 0 && (
              <Card className="mt-3 border-0 shadow-sm">
                <Card.Body className="p-0">
                  <div className="list-group list-group-flush">
                    {results.map((nv) => (
                      <button
                        type="button"
                        className="list-group-item list-group-item-action d-flex align-items-center"
                        key={nv.id}
                        onClick={() => handleRowClick_tennv(nv)}
                      >
                        <FaUserClock className="text-primary me-3" />
                        <div>
                          <div className="fw-semibold">{nv.ho_ten}</div>
                          <small className="text-muted">Xem lịch sử chấm công</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Filter and Table Section */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaCalendarAlt className="me-2" />
          Lịch sử Chấm công
        </Card.Header>
        <Card.Body className="p-4">
          {/* Search Filter */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="🔍 Tìm theo ngày hoặc tên nhân viên..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </Col>
          </Row>

          {/* Table */}
          {loadingTable ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <div className="mt-3 fw-semibold">Đang tải dữ liệu chấm công...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table bordered hover className="mb-0">
                <thead
                  style={{ 
                    background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                    color: "white"
                  }}
                >
                  <tr>
                    <th style={{ padding: "12px", fontWeight: "600" }}>ID</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Nhân viên</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ngày</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Giờ vào</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Giờ ra</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ảnh vào</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Ảnh ra</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((cc) => (
                    <tr key={cc.id} style={{ transition: "all 0.3s ease" }}>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{cc.id}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        {getTenNhanVien(cc.nhan_vien_id)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <Badge bg="light" text="dark">
                          {formatDate(cc.ngay)}
                        </Badge>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-success me-2" />
                          {formatTime(cc.thoi_gian_vao)}
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex align-items-center">
                          <FaClock className="text-primary me-2" />
                          {formatTime(cc.thoi_gian_ra)}
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {cc.hinh_anh_vao ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_vao)}
                            alt="Ảnh vào"
                            width="50"
                            height="50"
                            style={{ 
                              objectFit: "cover", 
                              borderRadius: "8px",
                              border: "2px solid #dee2e6"
                            }}
                            className="shadow-sm"
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {cc.hinh_anh_ra ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_ra)}
                            alt="Ảnh ra"
                            width="50"
                            height="50"
                            style={{ 
                              objectFit: "cover", 
                              borderRadius: "8px",
                              border: "2px solid #dee2e6"
                            }}
                            className="shadow-sm"
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        {getStatusBadge(cc)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex gap-1 flex-wrap">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(cc);
                            }}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cc.id);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted py-4">
                        <FaClock className="fs-1 mb-2 opacity-50" />
                        <div>Không tìm thấy bản ghi chấm công phù hợp.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="shadow-sm border-0 rounded-4 mt-4">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-center align-items-center gap-3">
                  <Button
                    variant="outline-primary"
                    disabled={currentPage === 1}
                    onClick={() => paginate(currentPage - 1)}
                    style={{ borderColor: "#667eea", color: "#667eea" }}
                  >
                    ← Trang trước
                  </Button>
                  <span className="fw-semibold" style={{ color: "#4a5568" }}>
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    disabled={currentPage === totalPages}
                    onClick={() => paginate(currentPage + 1)}
                    style={{ borderColor: "#667eea", color: "#667eea" }}
                  >
                    Trang sau →
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default QuanLyChamCong;