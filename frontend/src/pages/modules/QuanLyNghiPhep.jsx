// src/pages/modules/QuanLyNghiPhep.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import NghiPhepForm from "../../components/nghiphep/NghiPhepForm";
import { Modal, Button, Table, Breadcrumb } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../../src/components/Loading";

const API_URL = "http://127.0.0.1:5000/api";
const HR_DEPARTMENT_ID = 2; // 👈 ĐỔI thành ID thật của phòng Nhân sự

const getUserInfo = () => {
  try {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
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

const QuanLyNghiPhep = () => {
  const [nghiPhepList, setNghiPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingNghiPhep, setEditingNghiPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  // const [loadingT, setLoadingT] = useState(true);

  useEffect(() => {
    fetchNghiPhep();
    fetchNhanVien();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // reset page khi tìm kiếm hoặc lọc
  }, [searchKeyword, filterTrangThai]);

  const fetchNghiPhep = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-all-nghi-phep`);
      let list = response.data || [];

      // 👇 Nếu KHÔNG phải HR → chỉ giữ lại đơn của chính người dùng
      if (userInfo && !isHR) {
        list = list.filter((np) => np.nhan_vien_id === userInfo.id);
      }

      setNghiPhepList(list);
    } catch (error) {
      console.error("Lỗi khi gọi API nghỉ phép:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nghỉ phép!");
    } finally {
      setLoading(false);
    }
  };


  const fetchNhanVien = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(response.data || []);
    } catch (error) {
      console.error("Lỗi khi gọi API nhân viên:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nhân viên!");
    }finally{
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNghiPhep(null);
    setShowModal(true);
  };

  const handleEdit = (nghiPhep) => {
    setEditingNghiPhep(nghiPhep);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axios.delete(`${API_URL}/delete-nghi-phep/${id}`), {
        pending: "Đang hủy đơn...",
        success: "Đã hủy đơn nghỉ phép!",
        error: "Hủy đơn thất bại!",
      });
      fetchNghiPhep();
    } catch (error) {
      console.error("Lỗi khi hủy đơn nghỉ phép:", error);
    }finally{
      setLoading(false);
    }
  };

  const handleDuyet = async (id) => {
    if (!window.confirm("Bạn có chắc muốn duyệt đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axios.put(`${API_URL}/approve-nghi-phep/${id}`), {
        pending: "Đang duyệt...",
        success: "Đã duyệt đơn nghỉ phép!",
        error: "Duyệt đơn thất bại!",
      });
      fetchNghiPhep();
      fetchNhanVien();
    } catch (error) {
      console.error("Lỗi khi duyệt đơn nghỉ phép:", error);
    }finally{
      setLoading(false);
    }
  };

  const handleTuChoi = async (id) => {
    if (!window.confirm("Bạn có chắc muốn từ chối đơn nghỉ phép này không?"))
      return;
    setLoading(true);
    try {
      await toast.promise(axios.put(`${API_URL}/reject-nghi-phep/${id}`), {
        pending: "Đang từ chối...",
        success: "Đã từ chối đơn nghỉ phép!",
        error: "Từ chối đơn thất bại!",
      });
      fetchNghiPhep();
    } catch (error) {
      console.error("Lỗi khi từ chối đơn nghỉ phép:", error);
    }finally{
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNghiPhep(null);
  };

  const handleFormSubmit = () => {
    fetchNghiPhep();
    toast.success(
      editingNghiPhep
        ? "Cập nhật đơn nghỉ phép thành công!"
        : "Tạo đơn nghỉ phép thành công!"
    );
    handleModalClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  // map tên NV (lowercase) để search; null-safe
  const nhanVienMap = nhanVienList.reduce((acc, nv) => {
    acc[nv.id] = (nv.ho_ten || "").toLowerCase();
    return acc;
  }, {});

  const filteredList = nghiPhepList.filter((np) => {
    const lyDo = (np.ly_do || "").toLowerCase();
    const searchKey = (searchKeyword || "").toLowerCase();
    const searchMatch =
      lyDo.includes(searchKey) ||
      (nhanVienMap[np.nhan_vien_id] &&
        nhanVienMap[np.nhan_vien_id].includes(searchKey));
    const statusMatch = filterTrangThai
      ? np.trang_thai === filterTrangThai
      : true;
    return searchMatch && statusMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const userInfo = getUserInfo();
  const isHR = !!userInfo && userInfo.phong_ban_id === HR_DEPARTMENT_ID;

  if (loading)
      return (
        <div>
          <ToastContainer position="top-right" autoClose={2000} />
          <Loading />
        </div>
  );
  return (
    <div className="container min-vh-100">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý nghỉ phép</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-center flex-grow-1">Quản lý đơn nghỉ phép</h2>
          </div>

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
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
          </div>

          {isHR && (
            <div className="d-flex justify-content-end mb-3">
              <button
              className="btn btn-outline-success px-4"
              onClick={handleAdd}
            >
                + Thêm đơn nghỉ phép
              </button>
            </div>
          )}


          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <Table bordered hover striped className="rounded  text-nowrap">
              <thead className="table-dark text-center">
                <tr>
                  <th>Nhân viên</th>
                  <th>Từ ngày</th>
                  <th>Đến hết ngày</th>
                  <th>Loại nghỉ phép</th>
                  <th>Tổng ngày nghỉ</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>File giấy tờ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((nghiPhep) =>
                    nghiPhep.loai_nghi_phep_id != 3 ?  (
                        <tr key={nghiPhep.id}>
                          <td>
                          {nhanVienList.find(
                            (nv) => nv.id === nghiPhep.nhan_vien_id
                          )?.ho_ten || "Không rõ"}
                        </td>
                          <td>{formatDate(nghiPhep.tu_ngay)}</td>
                          <td>{formatDate(nghiPhep.den_ngay)}</td>
                          <td>{nghiPhep.loai_nghi_phep}</td>
                          <td>{nghiPhep.so_ngay_nghi}</td>
                          <td>{nghiPhep.ly_do}</td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                              nghiPhep.trang_thai === "Chờ duyệt"
                                  ? "bg-warning text-dark"
                                  : nghiPhep.trang_thai === "Đã duyệt"
                                  ? "bg-success"
                                  : nghiPhep.trang_thai === "Từ chối"
                                  ? "bg-danger"
                                  : "bg-secondary"
                              }`}
                            >
                              {nghiPhep.trang_thai}
                            </span>
                          </td>
                          <td>
                          {nghiPhep.can_cu_phap_ly_file ? (
                            nghiPhep.loai_nghi_phep_id === 1 ? (
                              <a
                                href={`${API_URL}/can_cu_phap_ly_phep_nam/${nghiPhep.can_cu_phap_ly_file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                                style={{
                                  textDecoration: "none",
                                  color: "#0d6efd",
                                  fontWeight: 500,
                                }}
                              >
                                📎 {nghiPhep.can_cu_phap_ly_file}
                              </a>
                            ) : nghiPhep.loai_nghi_phep_id === 2 ? (
                              <a
                                href={`${API_URL}/can_cu_phap_ly_phep_kl/${nghiPhep.can_cu_phap_ly_file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                                style={{
                                  textDecoration: "none",
                                  color: "#0d6efd",
                                  fontWeight: 500,
                                }}
                              >
                                📎 {nghiPhep.can_cu_phap_ly_file}
                              </a>
                            ) : (
                              <span className="text-muted">Không có</span>
                            )
                          ) : (
                            <span className="text-muted">Không có</span>
                          )}
                        </td>
                        <td>
                            {isHR && nghiPhep.trang_thai === "Chờ duyệt" && (
                              <>
                                <button
                                className="btn btn-sm btn-outline-success me-1"
                                onClick={() => handleDuyet(nghiPhep.id)}
                              >
                                ✔ Duyệt
                              </button>
                                <button
                                className="btn btn-sm btn-outline-danger me-1"
                                onClick={() => handleTuChoi(nghiPhep.id)}
                              >
                                ✖ Từ chối
                              </button>
                                <button
                                className="btn btn-sm btn-outline-danger me-1"
                                onClick={() => handleDelete(nghiPhep.id)}
                              >
                                🗑 Hủy
                              </button>
                              </>
                            )}

                            {!isHR && nghiPhep.nhan_vien_id === userInfo?.id && 
                            nghiPhep.trang_thai
                           === "Chờ duyệt" && (
                            <>
                                <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => handleEdit(nghiPhep)}
                            >
                              ✏️ Sửa
                            </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(nghiPhep.id)}>🗑 Hủy</button>
                            </>
                            )}
                          </td>

                        </tr>
                    ) : (
                      ""
                    )
                   )
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-muted">
                      Không có đơn nghỉ phép nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <h3 className="text-center mb-3 mt-3">Nghỉ thai sản</h3>
            <Table bordered hover striped className="rounded text-nowrap">
              <thead className="table-dark text-center">
                <tr>
                  <th>Nhân viên</th>
                  <th>Ngày dự kiến sinh</th>
                  <th>Từ ngày</th>
                  <th>Đến hết ngày</th>
                  <th>Loại nghỉ phép</th>
                  <th>Tổng ngày nghỉ</th>
                  <th>Số con</th>
                  <th>Phương pháp sinh</th>
                  <th>File giấy tờ</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((nghiPhep) =>
                    nghiPhep.loai_nghi_phep_id == 3 ? (
                      <tr key={nghiPhep.id}>
                        <td>
                          {nhanVienList.find(
                            (nv) => nv.id === nghiPhep.nhan_vien_id
                          )?.ho_ten || "Không rõ"}
                        </td>
                        <td>{nghiPhep.ngay_du_kien_sinh}</td>
                        <td>{formatDate(nghiPhep.tu_ngay)}</td>
                        <td>{formatDate(nghiPhep.den_ngay)}</td>
                        <td>{nghiPhep.loai_nghi_phep}</td>
                        <td>{nghiPhep.so_ngay_nghi}</td>
                        <td>{nghiPhep.so_con}</td>
                        <td>{nghiPhep.phuong_phap_sinh}</td>
                        <td>
                          {nghiPhep.can_cu_phap_ly_file ? (
                            <a
                              href={`${API_URL}/can_cu_phap_ly_thai_san/${nghiPhep.can_cu_phap_ly_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link"
                              style={{
                                textDecoration: "none",
                                color: "#0d6efd",
                                fontWeight: 500,
                              }}
                            >
                              📎{nghiPhep.can_cu_phap_ly_file}
                            </a>
                          ) : (
                            <span className="text-muted">Không có</span>
                          )}
                        </td>
                        <td>{nghiPhep.ly_do}</td>
                        <td className="text-center">
                          <span
                            className={`badge ${
                              nghiPhep.trang_thai === "Chờ duyệt"
                                ? "bg-warning text-dark"
                                : nghiPhep.trang_thai === "Đã duyệt"
                                ? "bg-success"
                                : nghiPhep.trang_thai === "Từ chối"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {nghiPhep.trang_thai}
                          </span>
                        </td>
                        <td>
                          {/* HR: được duyệt / từ chối / hủy khi Chờ duyệt */}
                          {isHR && nghiPhep.trang_thai === "Chờ duyệt" && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-success me-1"
                                onClick={() => handleDuyet(nghiPhep.id)}
                              >
                                ✔ Duyệt
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger me-1"
                                onClick={() => handleTuChoi(nghiPhep.id)}
                              >
                                ✖ Từ chối
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger me-1"
                                onClick={() => handleDelete(nghiPhep.id)}
                              >
                                🗑 Hủy
                              </button>
                            </>
                          )}

                          {/* Non-HR: chỉ được Sửa/Hủy đơn của CHÍNH MÌNH khi Chờ duyệt */}
                          {!isHR && nghiPhep.nhan_vien_id === userInfo?.id && 
                            nghiPhep.trang_thai
                           === "Chờ duyệt" && (
                            <>
                              <button
                              className="btn btn-sm btn-outline-warning me-1"
                              onClick={() => handleEdit(nghiPhep)}
                            >
                              ✏️ Sửa
                            </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(nghiPhep.id)}>🗑 Hủy</button>
                            </>
                          )}
                        </td>

                      </tr>
                    ) : (
                      ""
                    )
                  )
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center text-muted">
                      Không có đơn nghỉ phép nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
              <Button
                variant="outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← Trang Trước
              </Button>
              <span>
                Trang {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Trang Sau →
              </Button>
            </div>
          )}

          {/* Modal thêm/sửa */}
          <Modal show={showModal} onHide={handleModalClose} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {editingNghiPhep
                  ? "Chỉnh sửa đơn nghỉ phép"
                  : "Thêm đơn nghỉ phép"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <NghiPhepForm
                onAdded={handleFormSubmit}
                editingNghiPhep={editingNghiPhep}
                setEditingNghiPhep={setEditingNghiPhep}
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

export default QuanLyNghiPhep;
