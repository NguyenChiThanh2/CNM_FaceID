// src/pages/modules/Thuong.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Table,
  Modal,
  Breadcrumb,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ThuongForm from "../../components/thuong/ThuongForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";

const Thuong = () => {
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

  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000";

  const fetchThuongList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/get-all-thuong`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThuongList(data);
    } catch (err) {
      console.error("Lỗi khi tải thưởng:", err);
      toast.error("Không thể tải danh sách thưởng!");
    }
  };

  useEffect(() => {
    fetchThuongList();
  }, []);

  const filteredList = thuongList.filter(
    (pl) =>
      (pl.ten_thuong || "")
        .toLowerCase()
        .includes(searchKeyword.toLowerCase()) ||
      (pl.ngay_quyet_dinh || "")
        .toLowerCase()
        .includes(searchKeyword.toLowerCase())
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

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(file, "DanhSachThuong.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch (e) {
      toast.error("❌ Xuất Excel thất bại!", e);
    }
  };

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // 👉 Xem nhân viên
  const handleViewNhanVien = async (thuongId) => {
    try {
      const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
      setPhongBanList(respb.data);

      const res = await axios.get(
        `${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`
      );
      // Kiểm tra nếu dữ liệu trả về là mảng và có phần tử thì setSelectedNhanVienIds
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSelectedNhanVien(res.data);
      } else {
        // Nếu không có dữ liệu thì reset danh sách selected
        setSelectedNhanVien([]);
      }
      setSelectedThuongId(thuongId);
      
    } catch (err) {
      console.error("Lỗi khi lấy nhân viên:", err);
      setSelectedNhanVien([]);
    } finally {
      setShowNhanVienModal(true);
    }
  };

  // 👉 Xóa nhân viên khỏi thưởng
  const handleDeleteNhanVienFromThuong = async (nhanVienId) => {
    if (!selectedThuongId) return;
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này khỏi thưởng?")) {
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
      }
    }
  };

  // 👉 Hiển thị modal thêm nhân viên
  const handleShowAddNhanVienModal = async (thuongId) => {
    try {
      const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
      setPhongBanList(respb.data);
      // const respb = await axios.get(`${API_BASE}/api/get-all-phong-ban`);
      const res = await axios.get(`${API_BASE}/api/get-all-nhan-vien`);
      // Lấy danh sách nhân viên đã có thưởng này
      const resSelected = await axios.get(
        `${API_BASE}/api/get-all-nhan-vien-by-thuong-id/${thuongId}`
      );
      // Kiểm tra nếu dữ liệu trả về là mảng và có phần tử thì setSelectedNhanVienIds
      if (Array.isArray(resSelected.data) && resSelected.data.length > 0) {
        const selectedIds = resSelected.data.map((nv) => nv.id);
        setSelectedNhanVienIds(selectedIds);
      } else {
        // Nếu không có dữ liệu thì reset danh sách selected
        setSelectedNhanVienIds([]);
      }
      setNhanVienList(res.data);
      setSelectedThuongId(thuongId);
      setShowAddNhanVienModal(true);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    }
  };

  const handleSelectNhanVien = (e, id) => {
    const newSet = new Set(selectedNhanVienIds);
    if (e.target.checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedNhanVienIds([...newSet]);
  };

  // 👉 Thêm nhân viên vào thưởng
  const handleAddNhanVienToThuong = async () => {
    if (!selectedThuongId) return;
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
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("vi-VN")
      : "Ngày không hợp lệ";
  };

  return (
    <div className="container min-vh-100">
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
              <Button
                variant="outline-success"
                className="me-2"
                onClick={handleAdd}
              >
                ➕ Thêm thưởng
              </Button>
              <Button variant="outline-primary" onClick={exportToExcel}>
                📤 Xuất Excel
              </Button>
            </Col>
          </Row>

          {currentItems.length === 0 ? (
            <div className="text-center py-3">Không có dữ liệu phù hợp</div>
          ) : (
            <Table striped bordered hover responsive className="align-middle rounded text-nowrap" style={{ overflowX: "auto" }}>
              <thead className="table-dark text-center">
                <tr>
                  <th>Tên</th>
                  <th>Mục đích thưởng</th>
                  <th>Giá trị</th>
                  <th>Ngày quyết định</th>
                  <th>Ghi chú</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((pl) => (
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
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

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
                  variant={
                    i + 1 === currentPage ? "primary" : "outline-primary"
                  }
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

          {/* Modal thêm/sửa thưởng */}
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
                        onClick={() => handleDeleteNhanVienFromThuong(nv.id)}
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


          {/* Modal thêm nhân viên */}
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
                      checked={
                        selectedNhanVienIds.length === nhanVienList.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNhanVienIds(
                            nhanVienList.map((nv) => nv.id)
                          );
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
                                      !nhanVienTrongPB.some(
                                        (nv) => nv.id === id
                                      )
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
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default Thuong;
