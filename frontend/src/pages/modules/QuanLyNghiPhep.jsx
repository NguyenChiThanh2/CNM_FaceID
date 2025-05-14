import React, { useState, useEffect } from "react";
import axios from "axios";
import NghiPhepForm from "../../components/nghiphep/NghiPhepForm";
import {
  Modal,
  Button,

  Table,
  Breadcrumb,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const API_URL = "http://127.0.0.1:5000/api";

const QuanLyNghiPhep = () => {
  const [nghiPhepList, setNghiPhepList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [editingNghiPhep, setEditingNghiPhep] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNghiPhep();
    fetchNhanVien();
  }, []);

  const fetchNghiPhep = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-all-nghi-phep`);
      setNghiPhepList(response.data);
    } catch (error) {
      console.error("Lỗi khi gọi API nghỉ phép:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách nghỉ phép!");
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
    setEditingNghiPhep(null);
    setShowModal(true);
  };

  const handleEdit = (nghiPhep) => {
    setEditingNghiPhep(nghiPhep);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn hủy đơn nghỉ phép này không?")) {
      try {
        await axios.put(`${API_URL}/cancle-nghi-phep/${id}`);
        fetchNghiPhep();
        toast.success("Đã hủy đơn nghỉ phép thành công!");
      } catch (error) {
        console.error("Lỗi khi hủy đơn nghỉ phép:", error);
        toast.error("Có lỗi xảy ra khi hủy đơn nghỉ phép!");
      }
    }
  };

  const handleDuyet = async (id) => {
    if (window.confirm("Bạn có chắc muốn duyệt đơn nghỉ phép này không?")) {
      try {
        await axios.put(`${API_URL}/approve-nghi-phep/${id}`);
        fetchNghiPhep();
        fetchNhanVien();
        toast.success("Đã duyệt đơn nghỉ phép thành công!");
      } catch (error) {
        console.error("Lỗi khi duyệt đơn nghỉ phép:", error);
        toast.error("Có lỗi xảy ra khi duyệt đơn nghỉ phép!");
      }
    }
  };

  const handleTuChoi = async (id) => {
    if (window.confirm("Bạn có chắc muốn từ chối đơn nghỉ phép này không?")) {
      try {
        await axios.put(`${API_URL}/reject-nghi-phep/${id}`);
        fetchNghiPhep();
        toast.success("Đã từ chối đơn nghỉ phép thành công!");
      } catch (error) {
        console.error("Lỗi khi từ chối đơn nghỉ phép:", error);
        toast.error("Có lỗi xảy ra khi từ chối đơn nghỉ phép!");
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingNghiPhep(null);
  };

  const handleFormSubmit = () => {
    fetchNghiPhep();
    handleModalClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString("vi-VN") : "Ngày không hợp lệ";
  };

  const nhanVienMap = nhanVienList.reduce((acc, nv) => {
    acc[nv.id] = nv.ho_ten.toLowerCase();
    return acc;
  }, {});

  const filteredList = nghiPhepList.filter((np) => {
    const searchMatch =
      np.ly_do.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (nhanVienMap[np.nhan_vien_id] && nhanVienMap[np.nhan_vien_id].includes(searchKeyword.toLowerCase()));
    const statusMatch = filterTrangThai ? np.trang_thai === filterTrangThai : true;
    return searchMatch && statusMatch;
  });

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý nghỉ phép</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-center flex-grow-1">Quản lý đơn nghỉ phép</h2>
          </div>


          <div className="row mb-3">
            <div className="col-md-6 mb-2">
              <input
                type="text"
                className="form-control "
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

          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-outline-success px-4" onClick={handleAdd}>
              + Thêm đơn nghỉ phép
            </button>
          </div>

          <div className="table-responsive">
            <Table bordered hover striped className="rounded">
              <thead className="table-dark text-center">
                <tr>
                  <th>Nhân viên</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                  <th>Tổng ngày nghỉ</th>
                  <th>Lý do</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredList.length > 0 ? (
                  filteredList.map((nghiPhep) => (
                    <tr key={nghiPhep.id}>
                      <td>{nhanVienList.find((nv) => nv.id === nghiPhep.nhan_vien_id)?.ho_ten || "Không rõ"}</td>
                      <td>{formatDate(nghiPhep.tu_ngay)}</td>
                      <td>{formatDate(nghiPhep.den_ngay)}</td>
                      <td>{nghiPhep.so_ngay_nghi}</td>
                      <td>{nghiPhep.ly_do}</td>
                      <td className="text-center">
                        <span className={`badge ${nghiPhep.trang_thai === "Chờ duyệt"
                          ? "bg-warning text-dark"
                          : nghiPhep.trang_thai === "Đã duyệt"
                            ? "bg-success"
                            : nghiPhep.trang_thai === "Từ chối"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}>
                          {nghiPhep.trang_thai}
                        </span>
                      </td>
                      <td>
                        {nghiPhep.trang_thai === "Chờ duyệt" && (
                          <>
                            <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleDuyet(nghiPhep.id)}>
                              ✔ Duyệt
                            </button>
                            <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleTuChoi(nghiPhep.id)}>
                              ✖ Từ chối
                            </button>
                            <button className="btn btn-sm btn-outline-danger me-1" onClick={() => handleDelete(nghiPhep.id)}>
                              🗑 Hủy
                            </button>
                          </>
                        )}
                        {["Chờ duyệt", "Từ chối"].includes(nghiPhep.trang_thai) && (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(nghiPhep)}>
                            ✏️ Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      Không có đơn nghỉ phép nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>


          {/* Modal thêm/sửa đơn nghỉ phép */}
          <Modal show={showModal} onHide={handleModalClose} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {editingNghiPhep ? "Chỉnh sửa đơn nghỉ phép" : "Thêm đơn nghỉ phép"}
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
        </div></div></div>

  );
};

export default QuanLyNghiPhep;
