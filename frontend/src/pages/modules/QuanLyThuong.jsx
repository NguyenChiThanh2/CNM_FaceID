// src/pages/modules/Thuong.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Table,
  Modal,
  Breadcrumb,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ThuongForm from "../../components/thuong/ThuongForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import Loading from "../../../src/components/Loading";

const Thuong = () => {
  // Lấy user từ localStorage để phân quyền
  const raw = localStorage.getItem("user");
  let currentUser = null;
  try {
    currentUser = raw ? JSON.parse(raw)?.nhan_vien : null;
  } catch (_) { }
  const HR_DEPARTMENT_ID = 2; // id phòng nhân sự
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  const [thuongList, setThuongList] = useState([]);
  const [selectedThuong, setSelectedThuong] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showNhanVienModal, setShowNhanVienModal] = useState(false);
  const [selectedNhanVien, setSelectedNhanVien] = useState([]);
  const [showAddNhanVienModal, setShowAddNhanVienModal] = useState(false);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [selectedNhanVienIds, setSelectedNhanVienIds] = useState([]);
  const [selectedThuongId, setSelectedThuongId] = useState(null);
  const [PhongBanList, setPhongBanList] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000";

  const fetchThuongList = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/get-all-thuong`;
      if (!isHR && currentUser?.id) {
        url = `${API_BASE}/api/get-thuong-by-nhan-vien-id/${currentUser.id}`;
      }
      const res = await fetch(url);

      if (res.status === 404) {
        // ✅ Xem như không có dữ liệu
        setThuongList([]);
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const data = await res.json();
      setThuongList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi khi tải thưởng:", err);
      toast.error(String(err?.message || "Không thể tải danh sách thưởng!"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThuongList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredList = thuongList.filter(
    (pl) =>
      (pl.ten_thuong || "").toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (pl.ngay_quyet_dinh || "").toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const currentItems = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAdd = () => {
    setSelectedThuong(null);
    setShowModal(true);
  };

  const handleEdit = (pl) => {
    setSelectedThuong(pl);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/delete-thuong/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        await fetchThuongList();
        toast.success("Xóa thưởng thành công!");
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        toast.error("❌ Lỗi khi xóa thưởng!");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = (message) => {
    fetchThuongList();
    setShowModal(false);
    toast.success(message || "Cập nhật thưởng thành công!");
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    try {
      const exportData = thuongList.map((item) => ({
        "Tên thưởng": item.ten_thuong,
        "Ngày quyết định": item.ngay_quyet_dinh,
        "Giá trị": item.so_tien,
        Loại: item.loai_thuong,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Thuong");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, "DanhSachThuong.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch (e) {
      toast.error("❌ Xuất Excel thất bại!", e);
    }
  };

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // 👉 Xem nhân viên (chỉ HR dùng)
  const handleViewNhanVien = async (thuongId) => {
    setLoading(true);
    try {
      const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axios.get(`${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`);
      setSelectedNhanVien(Array.isArray(res.data) ? res.data : []);
      setSelectedThuongId(thuongId);
    } catch (err) {
      toast.error("Lỗi kết nối !");
      console.error("Lỗi kết nối", err);
      setSelectedNhanVien([]);
    } finally {
      setShowNhanVienModal(true);
      setLoading(false);
    }
  };

  // 👉 Xóa nhân viên khỏi thưởng (chỉ HR)
  const handleDeleteNhanVienFromThuong = async (nhanVienId) => {
    if (!selectedThuongId) return;
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi thưởng?")) {
      setLoading(true);
      try {
        await axios.post(`${API_BASE}/api/remove-nhan-vien-from-thuong`, {
          thuong_id: selectedThuongId,
          nhan_vien_id: nhanVienId,
        });
        await handleViewNhanVien(selectedThuongId);
        toast.success("Đã xóa nhân viên khỏi thưởng.");
      } catch (err) {
        console.error("Lỗi khi xóa:", err);
        toast.error("Không thể xóa nhân viên.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 👉 Hiển thị modal thêm nhân viên (chỉ HR)
  const handleShowAddNhanVienModal = async (thuongId) => {
    setLoading(true);
    try {
      const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axios.get(`${API_BASE}/api/get-all-nhan-vien`);
      const resSelected = await axios.get(
        `${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`
      );

      if (Array.isArray(resSelected.data) && resSelected.data.length > 0) {
        const selectedIds = resSelected.data.map((nv) => nv.id);
        setSelectedNhanVienIds(selectedIds);
      } else {
        setSelectedNhanVienIds([]);
      }

      setNhanVienList(res.data);
      setSelectedThuongId(thuongId);
      setShowAddNhanVienModal(true);
    } catch (err) {
      toast.error("Lỗi kết nối !");
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNhanVien = (e, id) => {
    const newSet = new Set(selectedNhanVienIds);
    if (e.target.checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedNhanVienIds([...newSet]);
  };

  // 👉 Thêm nhân viên vào thưởng (chỉ HR)
  const handleAddNhanVienToThuong = async () => {
    if (!selectedThuongId) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/add-nhan-vien-to-thuong`, {
        thuong_id: selectedThuongId,
        nhan_vien_ids: selectedNhanVienIds,
      });
      toast.success("Đã thêm nhân viên vào thưởng.");
      setShowAddNhanVienModal(false);
      setSelectedNhanVienIds([]);
    } catch (err) {
      console.error("Lỗi thêm nhân viên:", err);
      toast.error("Không thể thêm nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

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
            <Breadcrumb.Item active>Quản lý thưởng</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>

          <h2 className="text-center mb-4">📋 Quản lý Thưởng</h2>

          <Row className="mb-3">
            <Col md={6}>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Tìm kiếm theo tên hoặc mô tả..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col md={6} className="text-end">
              {isHR && (
                <Button
                  variant="outline-success"
                  className="me-2"
                  onClick={handleAdd}
                >
                  ➕ Thêm thưởng
                </Button>
              )}
              <Button variant="outline-primary" onClick={exportToExcel}>
                📤 Xuất Excel
              </Button>
            </Col>
          </Row>

          <Table
            striped
            bordered
            hover
            responsive
            className="align-middle rounded text-nowrap"
            style={{ overflowX: "auto" }}
          >
            <thead className="table-dark text-center">
              <tr>
                <th>Tên</th>
                <th>Mục đích thưởng</th>
                <th>Giá trị</th>
                <th>Ngày quyết định</th>
                <th>Ghi chú</th>
                {isHR && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((pl) => (
                  <tr key={pl.id}>
                    <td>{pl.ten_thuong}</td>
                    <td>
                      {{
                        LE: "Thưởng Lễ",
                        TET: "Thưởng Tết",
                        THANG13: "Thưởng Tháng 13",
                        NONG: "Thưởng Nóng",
                        THANHTICH: "Thưởng Thành tích",
                        THUONGKHAC: "Thưởng Khác",
                      }[pl.loai_thuong] || "Không xác định"}
                    </td>
                    <td>{formatCurrency(pl.so_tien)}</td>
                    <td>{formatDate(pl.ngay_quyet_dinh)}</td>
                    <td>{pl.ghi_chu}</td>

                    {isHR && (
                      <td className="text-center">
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(pl)}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleDelete(pl.id)}
                        >
                          🗑️ Xóa
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewNhanVien(pl.id)}
                        >
                          Xem nhân viên
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowAddNhanVienModal(pl.id)}
                        >
                          Thêm nhân viên
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isHR ? 6 : 5} className="text-center text-muted">
                    Không có đơn thưởng nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap">
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i + 1 === currentPage ? "primary" : "outline-primary"}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau →
              </Button>
            </div>
          )}

          {/* Modal thêm/sửa thưởng (chỉ HR dùng, nhưng vẫn render khi isHR) */}
          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedThuong ? "✏️ Cập nhật thưởng" : "➕ Thêm thưởng"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ThuongForm
                selected={selectedThuong}
                onAdded={handleFormSubmit}
                onClose={() => setShowModal(false)}
                fetchThuongList={fetchThuongList}
              />
            </Modal.Body>
          </Modal>

          {/* Modal danh sách nhân viên (chỉ HR) */}
          <Modal
            show={showNhanVienModal}
            onHide={() => setShowNhanVienModal(false)}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Danh sách nhân viên có thưởng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedNhanVien.length === 0 ? (
                <p className="text-muted">Không có nhân viên nào được thưởng.</p>
              ) : (
                PhongBanList.map((pb) => {
                  const nvTrongPB = selectedNhanVien.filter(
                    (nv) => nv.phong_ban_id === pb.id
                  );
                  if (nvTrongPB.length === 0) return null;

                  return (
                    <div key={pb.id} className="mb-4">
                      <h5 className="fw-bold">{pb.ten_phong_ban}</h5>
                      <hr />
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nvTrongPB.map((nv) => (
                            <tr key={nv.id}>
                              <td>{nv.ho_ten}</td>
                              <td>{nv.email}</td>
                              <td className="text-center">
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteNhanVienFromThuong(nv.id)
                                  }
                                >
                                  Xóa
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowNhanVienModal(false)}
              >
                Đóng
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Modal thêm nhân viên (chỉ HR) */}
          <Modal
            show={showAddNhanVienModal}
            onHide={() => {
              setShowAddNhanVienModal(false);
              setSelectedNhanVienIds([]);
            }}
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Thêm nhân viên có thưởng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {nhanVienList.length === 0 ? (
                <p className="text-muted">Đang tải danh sách nhân viên...</p>
              ) : (
                <div
                  style={{
                    maxHeight: "500px",
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    padding: "10px",
                    borderRadius: "5px",
                  }}
                >
                  {/* Checkbox tổng */}
                  <div className="mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedNhanVienIds.length === nhanVienList.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNhanVienIds(nhanVienList.map((nv) => nv.id));
                        } else {
                          setSelectedNhanVienIds([]);
                        }
                      }}
                    />
                    <label className="form-check-label fw-bold ms-2">
                      Chọn tất cả nhân viên
                    </label>
                  </div>

                  {/* Lặp phòng ban */}
                  {PhongBanList.map((pb) => {
                    const nhanVienTrongPB = nhanVienList.filter(
                      (nv) => nv.phong_ban_id === pb.id
                    );
                    const allChecked = nhanVienTrongPB.every((nv) =>
                      selectedNhanVienIds.includes(nv.id)
                    );

                    return (
                      <div key={pb.id} className="mb-4 border p-2 rounded">
                        {/* Checkbox phòng ban */}
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={allChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedNhanVienIds((prev) => [
                                  ...new Set([
                                    ...prev,
                                    ...nhanVienTrongPB.map((nv) => nv.id),
                                  ]),
                                ]);
                              } else {
                                setSelectedNhanVienIds((prev) =>
                                  prev.filter(
                                    (id) =>
                                      !nhanVienTrongPB.some((nv) => nv.id === id)
                                  )
                                );
                              }
                            }}
                          />
                          <label className="form-check-label fw-bold ms-2">
                            {pb.ten_phong_ban}
                          </label>
                        </div>

                        {/* Danh sách nhân viên */}
                        {nhanVienTrongPB.map((nv) => (
                          <div key={nv.id} className="form-check ms-4">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              value={nv.id}
                              checked={selectedNhanVienIds.includes(nv.id)}
                              onChange={(e) => handleSelectNhanVien(e, nv.id)}
                            />
                            <label className="form-check-label">
                              {nv.ho_ten} - {nv.email}
                            </label>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddNhanVienModal(false);
                  setSelectedNhanVienIds([]);
                }}
              >
                Đóng
              </Button>
              <Button variant="primary" onClick={handleAddNhanVienToThuong}>
                Xác nhận
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Thuong;
