// src/pages/modules/QuanLyGiayPhep.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import GiayPhepForm from "../../components/giayphep/GiayPhepForm";
import { Modal, Button, Table, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";
import "react-toastify/dist/ReactToastify.css";
import { getNhanVienInfo } from "../../utils/auth";

const API_URL = "http://127.0.0.1:5000/api";
// ⚠️ Đổi ID này thành ID thật của phòng Nhân sự trong DB
const HR_DEPARTMENT_ID = 2;

const QuanLyGiayPhep = () => {
  const [giayPhepList, setGiayPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingGiayPhep, setEditingGiayPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hardLoading, setHardLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  // 🔒 currentUser ổn định, tránh loop render
  const [currentUser] = useState(() => getNhanVienInfo());
  const userId = currentUser?.id ?? null;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  // 🚧 Route guard
  useEffect(() => {
    if (userId == null) navigate("/dang-nhap", { replace: true });
  }, [userId, navigate]);

  // ===== Helpers quyền hạn =====
  const isOwner = useCallback((gp) => !!userId && gp?.nhan_vien_id === userId, [userId]);

  const canCreate = useCallback(() => !!currentUser, [currentUser]);

  const canEdit = useCallback(
    (gp) =>
      (isHR && gp.trang_thai === "Chưa duyệt") ||
      (!isHR && isOwner(gp) && gp.trang_thai === "Chưa duyệt"),
    [isHR, isOwner]
  );

  const canCancel = useCallback(
    (gp) =>
      (isHR && (gp.trang_thai === "Chưa duyệt" || gp.trang_thai === "Từ chối")) ||
      (!isHR && isOwner(gp) && (gp.trang_thai === "Chưa duyệt" || gp.trang_thai === "Từ chối")),
    [isHR, isOwner]
  );

  const canApproveReject = useCallback((gp) => isHR && gp.trang_thai === "Chưa duyệt", [isHR]);

  const deny = () => toast.error("Bạn không có quyền thực hiện thao tác này!");

  // ===== API =====
  const fetchNhanVien = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(Array.isArray(resp.data) ? resp.data : []);
    } catch (error) {
      console.error("Lỗi khi gọi API nhân viên:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nhân viên!");
    }
  }, []);

  const fetchGiayPhep = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_URL}/get-all-giay-phep`);
      let list = resp.data || [];
      if (userId && !isHR) {
        list = list.filter((gp) => gp.nhan_vien_id === userId);
      }
      setGiayPhepList(list);
    } catch (e) {
      console.error("Lỗi khi gọi API giấy phép:", e);
      toast.error("Không có giấy phép nào được tìm thấy!");
    } finally {
      setLoading(false);
      setHardLoading(false);
    }
  }, [userId, isHR]);

  // ✅ Chỉ 1 effect fetch theo userId (tránh fetch 2 lần)
  useEffect(() => {
    if (userId == null) return;
    (async () => {
      await Promise.all([fetchGiayPhep(), fetchNhanVien()]);
    })();
  }, [userId, isHR, fetchGiayPhep, fetchNhanVien]);

  // Reset trang khi filter/search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterTrangThai]);

  // ===== Handlers =====
  const handleAdd = () => {
    if (!canCreate()) return deny();
    setEditingGiayPhep(null);
    setShowModal(true);
  };

  const handleEdit = (gp) => {
    if (!canEdit(gp)) return deny();
    setEditingGiayPhep(gp);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canCancel(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn hủy giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.delete(`${API_URL}/cancel-giay-phep/${id}`);
      toast.success("Đã hủy giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi hủy giấy phép:", error);
      toast.error("Có lỗi xảy ra khi hủy giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleDuyet = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canApproveReject(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn duyệt giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.put(`${API_URL}/approve-giay-phep/${id}`);
      toast.success("Đã duyệt giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi duyệt giấy phép:", error);
      toast.error("Có lỗi xảy ra khi duyệt giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleTuChoi = async (id) => {
    const gp = giayPhepList.find((x) => x.id === id);
    if (!gp || !canApproveReject(gp)) return deny();
    if (!window.confirm("Bạn có chắc muốn từ chối giấy phép này không?")) return;

    setLoading(true);
    try {
      await axios.put(`${API_URL}/reject-giay-phep/${id}`);
      toast.success("Đã từ chối giấy phép thành công!");
      fetchGiayPhep();
    } catch (error) {
      console.error("Lỗi khi từ chối giấy phép:", error);
      toast.error("Có lỗi xảy ra khi từ chối giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingGiayPhep(null);
  };

  const handleFormSubmit = () => {
    fetchGiayPhep();
    handleModalClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  // Map nhanh ID → tên NV (lowercase để search)
  const nhanVienMap = useMemo(
    () =>
      nhanVienList.reduce((acc, nv) => {
        acc[nv.id] = (nv.ho_ten || "").toLowerCase();
        return acc;
      }, {}),
    [nhanVienList]
  );

  const normalizedKeyword = (searchKeyword || "").toLowerCase();

  const filteredList = useMemo(() => {
    return (giayPhepList || []).filter((gp) => {
      const lyDo = (gp.ly_do || "").toLowerCase();
      const nhanVienName = nhanVienMap[gp.nhan_vien_id] || "";
      const searchMatch = lyDo.includes(normalizedKeyword) || nhanVienName.includes(normalizedKeyword);
      const statusMatch = filterTrangThai ? gp.trang_thai === filterTrangThai : true;
      return searchMatch && statusMatch;
    });
  }, [giayPhepList, nhanVienMap, normalizedKeyword, filterTrangThai]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  // ===== Render =====
  if (!currentUser) return null; // đang redirect

  if (hardLoading) {
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );
  }

  return (
    <div className="container min-vh-100">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý giấy phép</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-center flex-grow-1">Quản lý giấy phép</h2>
          </div>

          {/* Bộ lọc */}
          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Tìm theo tên nhân viên hoặc lý do..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="col-md-6 mb-2">
              <select
                className="form-select rounded-pill"
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Nút thêm mới (theo quyền) */}
          {canCreate() && (
            <div className="d-flex justify-content-end mb-3">
              <button className="btn btn-outline-success px-4" onClick={handleAdd}>
                + Thêm giấy phép
              </button>
            </div>
          )}

          {/* Bảng */}
          <div className="table-responsive">
            <Table bordered hover striped className="rounded">
              <thead className="table-dark text-center">
                <tr>
                  <th>ID</th>
                  <th>Nhân viên</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Loại giấy phép</th>
                  <th>Số giờ / Tính lại ngày công</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((gp) => (
                    <tr key={gp.id}>
                      <td>{gp.id}</td>
                      <td>{nhanVienList.find((nv) => nv.id === gp.nhan_vien_id)?.ho_ten || "Không rõ"}</td>
                      <td>{formatDate(gp.ngay_bat_dau)}</td>
                      <td>{formatDate(gp.ngay_ket_thuc)}</td>
                      <td>{gp.loai_giay_phep}</td>
                      <td>{gp.so_gio === 4 ? "Nửa ngày công" : gp.so_gio === 8 ? "1 ngày công" : `${gp.so_gio} giờ`}</td>
                      <td>{gp.ly_do}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${gp.trang_thai === "Chưa duyệt"
                              ? "bg-warning text-dark"
                              : gp.trang_thai === "Đã duyệt"
                                ? "bg-success"
                                : gp.trang_thai === "Từ chối"
                                  ? "bg-danger"
                                  : "bg-secondary"
                            }`}
                        >
                          {gp.trang_thai}
                        </span>
                      </td>

                      {/* Hành động theo quyền */}
                      <td className="text-nowrap">
                        {canApproveReject(gp) && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              disabled={loading}
                              onClick={() => handleDuyet(gp.id)}
                            >
                              ✔ Duyệt
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger me-1"
                              disabled={loading}
                              onClick={() => handleTuChoi(gp.id)}
                            >
                              ✖ Từ chối
                            </button>
                          </>
                        )}

                        {canCancel(gp) && (
                          <button
                            className="btn btn-sm btn-outline-danger me-1"
                            disabled={loading}
                            onClick={() => handleDelete(gp.id)}
                          >
                            🗑 Hủy
                          </button>
                        )}

                        {canEdit(gp) && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            disabled={loading}
                            onClick={() => handleEdit(gp)}
                          >
                            ✏️ Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      Không có giấy phép nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && !loading && (
            <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
              <Button
                variant="outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ← Trang Trước
              </Button>
              <span>
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Trang Sau →
              </Button>
            </div>
          )}

          {/* Modal thêm/sửa */}
          <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title>{editingGiayPhep ? "Chỉnh sửa giấy phép" : "Thêm giấy phép"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <GiayPhepForm
                onAdded={handleFormSubmit}
                editingGiayPhep={editingGiayPhep}
                setEditingGiayPhep={setEditingGiayPhep}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>
                Đóng
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default QuanLyGiayPhep;
