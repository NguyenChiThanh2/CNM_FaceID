import React, { useState, useEffect } from "react";
import axios from "axios";
import GiayPhepForm from "../../components/giayphep/GiayPhepForm";
import { Modal, Button, Table, Breadcrumb } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_URL = "http://127.0.0.1:5000/api";

const QuanLyGiayPhep = () => {
  const [giayPhepList, setGiayPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingGiayPhep, setEditingGiayPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchGiayPhep();
    fetchNhanVien();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, filterTrangThai]);

  const fetchGiayPhep = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-all-giay-phep`);
      setGiayPhepList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API giấy phép:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách giấy phép!");
    } finally {
      setLoading(false);
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API nhân viên:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nhân viên!");
    }
  };

  const handleAdd = () => {
    setEditingGiayPhep(null);
    setShowModal(true);
  };

  const handleEdit = (gp) => {
    setEditingGiayPhep(gp);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy giấy phép này không?")) {
      try {
        await axios.put(`${API_URL}/cancel-giay-phep/${id}`);
        fetchGiayPhep();
        toast.success("Đã hủy giấy phép thành công!");
      } catch (error) {
        console.error("Lỗi khi hủy giấy phép:", error);
        toast.error("Có lỗi xảy ra khi hủy giấy phép!");
      }
    }
  };

  const handleDuyet = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt giấy phép này không?")) {
      try {
        await axios.put(`${API_URL}/approve-giay-phep/${id}`);
        fetchGiayPhep();
        toast.success("Đã duyệt giấy phép thành công!");
      } catch (error) {
        console.error("Lỗi khi duyệt giấy phép:", error);
        toast.error("Có lỗi xảy ra khi duyệt giấy phép!");
      }
    }
  };

  const handleTuChoi = async (id) => {
    if (window.confirm("Bạn có chắc muốn từ chối giấy phép này không?")) {
      try {
        await axios.put(`${API_URL}/reject-giay-phep/${id}`);
        fetchGiayPhep();
        toast.success("Đã từ chối giấy phép thành công!");
      } catch (error) {
        console.error("Lỗi khi từ chối giấy phép:", error);
        toast.error("Có lỗi xảy ra khi từ chối giấy phép!");
      }
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
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  const nhanVienMap = nhanVienList.reduce((acc, nv) => {
    acc[nv.id] = nv.ho_ten.toLowerCase();
    return acc;
  }, {});

  const filteredList = giayPhepList.filter((np) => {
    const lyDo = np.ly_do ? np.ly_do.toLowerCase() : "";
    const nhanVienName = nhanVienMap[np.nhan_vien_id] || "";

    const searchMatch =
      lyDo.includes(searchKeyword.toLowerCase()) ||
      nhanVienName.includes(searchKeyword.toLowerCase());

    const statusMatch = filterTrangThai
      ? np.trang_thai === filterTrangThai
      : true;

    return searchMatch && statusMatch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý giấy phép</Breadcrumb.Item>
          </Breadcrumb>

          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-center flex-grow-1">Quản lý giấy phép</h2>
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
                <option value="Chưa duyệt">Chưa duyệt</option>
                <option value="Đã duyệt">Đã duyệt</option>
                <option value="Từ chối">Từ chối</option>
                <option value="Đã hủy">Đã hủy</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end mb-3">
            <button
              className="btn btn-outline-success px-4"
              onClick={handleAdd}
            >
              + Thêm giấy phép
            </button>
          </div>

          <div className="table-responsive">
            <Table bordered hover striped className="rounded">
              <thead className="table-dark text-center">
                <tr>
                  <th>ID</th>
                  <th>Nhân viên</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Loại giấy phép</th>
                  <th>Số giờ / Ngày công</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((gp) => (
                    <tr key={gp.id}>
                        <td>{gp.id}</td>
                      <td>
                        {nhanVienList.find((nv) => nv.id === gp.nhan_vien_id)
                          ?.ho_ten || "Không rõ"}
                      </td>
                      <td>{formatDate(gp.ngay_bat_dau)}</td>
                      <td>{formatDate(gp.ngay_ket_thuc)}</td>
                      <td>{gp.loai_giay_phep}</td>
                      <td>{gp.so_gio === 4 ? "Nửa ngày công" : gp.so_gio === 8 ? "1 ngày công" : `${gp.so_gio} giờ`}</td>
                      <td>{gp.ly_do}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            gp.trang_thai === "Chưa duyệt"
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
                      <td>
                        {gp.trang_thai === "Chưa duyệt" && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success me-1"
                              onClick={() => handleDuyet(gp.id)}
                            >
                              ✔ Duyệt
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger me-1"
                              onClick={() => handleTuChoi(gp.id)}
                            >
                              ✖ Từ chối
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger me-1"
                              onClick={() => handleDelete(gp.id)}
                            >
                              🗑 Hủy
                            </button>
                          </>
                        )}
                        {["Chưa duyệt", "Từ chối"].includes(gp.trang_thai) && (
                          <button
                            className="btn btn-sm btn-outline-warning"
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
                    <td colSpan="7" className="text-center text-muted">
                      Không có giấy phép nào phù hợp
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
                {editingGiayPhep ? "Chỉnh sửa giấy phép" : "Thêm giấy phép"}
              </Modal.Title>
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
