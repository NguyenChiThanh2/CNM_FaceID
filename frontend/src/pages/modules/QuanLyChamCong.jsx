// src/pages/modules/QuanLyChamCong.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Button, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import {
  searchNhanVienByName,
  getAllChamCong,
  deleteChamCong as apiDeleteChamCong,
  getAllNhanVien,
} from "../../services/chamCongApi";
import axiosInstance from "../../services/axiosInstance";

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
  const HR_DEPARTMENT_ID = 2; // 👈 chỉnh đúng ID phòng nhân sự
  const userInfo = getUserInfo();
  // ====== Load dữ liệu ban đầu ======
  useEffect(() => {
    (async () => {
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
    // nếu backend trả chuỗi custom -> giữ nguyên
    return isNaN(dt)
      ? d
      : dt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const getImgUrl = (file) => (file ? `${API_BASE}/checkin_images/${file}` : "");

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Bạn có chắc muốn xóa chấm công này không?")) return;
  //   try {
  //     await toast.promise(
  //       axios.delete(`http://127.0.0.1:5000/api/delete-cham-cong/${id}`),
  //       {
  //         pending: "Đang xóa chấm công...",
  //         success: "Đã xóa chấm công!",
  //         error: "Xóa chấm công thất bại!",
  //       }
  //     );
  //     // làm mới dữ liệu & về trang 1 để tránh trang trống
  //     await fetchChamCong();
  //     setCurrentPage(1);
  //   } catch (error) {
  //     // lỗi đã được toast.promise hiển thị
  //     console.error("Lỗi khi xóa chấm công:", error);
  //   }
  // };

  // const handleRowClick = (chamCong) => {
  //   navigate(`/cham-cong/${chamCong.id}`);
  // };

  // --- Tìm kiếm theo ngày (chuỗi) hoặc tên NV
  const filteredList = chamCongList.filter((cc) => {
    const ngayStr = formatDate(cc.ngay);
    const tenNhanVien = getTenNhanVien(cc.nhan_vien_id).toLowerCase();
    const key = (searchKeyword || "").toLowerCase();
    return ngayStr.toLowerCase().includes(key) || tenNhanVien.includes(key);
  });
  // ====== Lọc & phân trang tối ưu ======
  // const filteredList = useMemo(() => {
  //   const key = (searchKeyword || "").toLowerCase();
  //   return chamCongList.filter((cc) => {
  //     const ngayStr = formatDate(cc.ngay).toLowerCase();
  //     const tenNhanVien = getTenNhanVien(cc.nhan_vien_id).toLowerCase();
  //     return ngayStr.includes(key) || tenNhanVien.includes(key);
  //   });
  // }, [chamCongList, dsNhanVien, searchKeyword]);


  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const paginate = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  // const handleRowClick_tennv = (nv) => {
  //   navigate(`/cham-cong-nhan-vien/${nv.id}`); 
  // };



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
  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý chấm công</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <h2 className="mb-4 text-center">Quản lý chấm công</h2>

          {/* Search gợi ý nhân viên */}
          {userInfo?.phong_ban_id === HR_DEPARTMENT_ID && (
            <div className="mb-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên nhân viên..."
                className="form-control"
              />
              <div className="list-group w-auto mb-4">
                {loadingSearch && (
                  <div className="px-3 py-2 text-muted small">Đang tìm...</div>
                )}
                {!loadingSearch &&
                  results.map((nv) => (
                    <button
                      type="button"
                      className="list-group-item list-group-item-action"
                      key={nv.id}
                      onClick={() => handleRowClick_tennv(nv)}
                    >
                      {nv.ho_ten}
                    </button>
                  ))}
              </div>
            </div>
          )}


          {/* Search lọc trong bảng */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Tìm theo ngày hoặc tên nhân viên..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {loadingTable ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover w-100">
                <thead className="table-dark text-center">
                  <tr>
                    <th>ID</th>
                    <th>Nhân viên</th>
                    <th>Ngày</th>
                    <th>Giờ vào</th>
                    <th>Giờ ra</th>
                    <th>Ảnh vào</th>
                    <th>Ảnh ra</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {currentItems.map((cc) => (
                    <tr key={cc.id}>
                      <td>{cc.id}</td>
                      <td>{getTenNhanVien(cc.nhan_vien_id)}</td>
                      <td>{formatDate(cc.ngay)}</td>
                      <td>{formatTime(cc.thoi_gian_vao)}</td>
                      <td>{formatTime(cc.thoi_gian_ra)}</td>
                      <td className="text-center">
                        {cc.hinh_anh_vao ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_vao)}
                            alt="Ảnh vào"
                            width="50"
                            height="50"
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-center">
                        {cc.hinh_anh_ra ? (
                          <img
                            src={getImgUrl(cc.hinh_anh_ra)}
                            alt="Ảnh ra"
                            width="50"
                            height="50"
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{cc.trang_thai || (cc.thoi_gian_ra ? "Hoàn tất" : "Chưa ra")}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(cc);
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cc.id);
                          }}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}

                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
                        Không có bản ghi phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex justify-content-center mt-4 align-items-center gap-3">
            <Button
              variant="outline-secondary"
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
            >
              ← Trang trước
            </Button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
            >
              Trang sau →
            </Button>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default QuanLyChamCong;
