import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, Button, Table, Row, Col, Breadcrumb, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NhanSuAddForm from "../../components/nhansu/NhanSuAddForm";
import { getAllChucVu } from "../../services/chucVuApi";
import { getAllPhongBan } from "../../services/phongBanApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getNhanVienInfo } from "../../utils/auth";
import { getHopDongBatchByNhanVienIds } from "../../services/hopDongLaoDongApi";
import { getAllNhanVien, deleteNhanVien as apiDeleteNhanVien } from "../../services/nhanSuApi";
import ChungChiModal from "../../components/nhansu/ChungChiModal";

const QuanLyNhanSu = () => {
  const [nhanSuList, setNhanSuList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingNhanSu, setEditingNhanSu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [selectedTrangThai, setSelectedTrangThai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const currentUser = getNhanVienInfo();
  const [showCCModal, setShowCCModal] = useState(false);
  const [selectedNV, setSelectedNV] = useState(null);
  const HR_DEPARTMENT_ID = 2; // thay bằng ID thật trong DB
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;
  const [contracts, setContracts] = useState({});

  const itemsPerPage = 10;
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

  const fetchNhanSu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllNhanVien();
      setNhanSuList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
      toast.error(error?.message || "Không thể tải danh sách nhân sự!");
    } finally {
      setLoading(false);
    }
  }, []);

  const openChungChi = (nv) => {
    setSelectedNV(nv);
    setShowCCModal(true);
  };
  const closeChungChi = () => {
    setShowCCModal(false);
    setSelectedNV(null);
  };

  useEffect(() => {
    fetchNhanSu();
    (async () => {
      try {
        const [cv, pb] = await Promise.all([getAllChucVu(), getAllPhongBan()]);
        setDsChucVu(Array.isArray(cv) ? cv : []);
        setDsPhongBan(Array.isArray(pb) ? pb : []);
      } catch (err) {
        console.error("Lỗi tải danh mục:", err);
        toast.error("Không thể tải danh sách chức vụ/phòng ban!");
      }
    })();
  }, [fetchNhanSu]);

  useEffect(() => {
    if (nhanSuList.length > 0) {
      (async () => {
        try {
          const ids = nhanSuList.map((nv) => nv.id);
          const batch = await getHopDongBatchByNhanVienIds(ids);
          setContracts(batch || {});
        } catch (err) {
          console.error("Lỗi tải hợp đồng batch:", err);
        }
      })();
    }
  }, [nhanSuList]);

  const handleAdd = () => {
    setEditingNhanSu(null);
    setShowModal(true);
  };

  const handleEdit = (nv) => {
    setEditingNhanSu(nv);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân sự này không?")) return;
    try {
      await toast.promise(apiDeleteNhanVien(id), {
        pending: "Đang xóa nhân sự...",
        success: "Đã xóa nhân sự!",
        error: "Xóa nhân sự thất bại!",
      });
      setNhanSuList((prev) => prev.filter((x) => x.id !== id));
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleModalClose = () => {
    if (window.confirm("Bạn có chắc chắn muốn đóng mà không lưu thay đổi?")) {
      setShowModal(false);
      setEditingNhanSu(null);
    }
  };

  const handleFormSubmit = async (ok, err) => {
    if (ok) {
      await fetchNhanSu();
      setShowModal(false);
      setEditingNhanSu(null);
      toast.success("Cập nhật / thêm mới nhân sự thành công!");
      setCurrentPage(1);
    } else if (err) {
      toast.error(err?.message || "Lưu nhân sự thất bại!");
    } else {
      toast.error("Vui lòng kiểm tra lại thông tin!");
    }
  };

  const handleRowClick = (nv) => {
    navigate(`/nhan-su/${nv.id}`);
  };

  const getTenChucVu = (id) => dsChucVu.find((c) => c.id === id)?.ten_chuc_vu || "Không rõ";
  const getTenPhongBan = (id) => dsPhongBan.find((p) => p.id === id)?.ten_phong_ban || "Không rõ";

  const normalizedKeyword = (searchKeyword || "").toLowerCase();

  const filteredList = useMemo(() => {
    let list = nhanSuList;
    if (!isHR && currentUser) {
      list = list.filter((nv) => nv.id === currentUser.id);
    }
    return list.filter((nv) => {
      const matchName = (nv.ho_ten || "").toLowerCase().includes(normalizedKeyword);
      const matchStatus = selectedTrangThai ? nv.trang_thai === selectedTrangThai : true;
      return matchName && matchStatus;
    });
  }, [nhanSuList, normalizedKeyword, selectedTrangThai, isHR, currentUser]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const handleExportExcel = () => {
    const exportData = filteredList.map((nv) => ({
      ID: nv.id,
      "Họ tên": nv.ho_ten,
      "Giới tính": nv.gioi_tinh,
      "Ngày sinh": nv.ngay_sinh,
      Email: nv.email,
      "Số điện thoại": nv.so_dien_thoai,
      "Chức vụ": getTenChucVu(nv.chuc_vu_id),
      "Phòng ban": getTenPhongBan(nv.phong_ban_id),
      "Địa chỉ": nv.dia_chi,
      "Trạng thái": nv.trang_thai,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachNhanSu");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `DanhSachNhanSu_${new Date().toLocaleDateString("vi-VN")}.xlsx`);
  };

  function getHopDongBadge(hd) {
    if (!hd) return null;
    if (!hd.ngay_ket_thuc) return null; // HĐ vô thời hạn
    const today = new Date();
    const end = new Date(hd.ngay_ket_thuc);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)
      return <span className="badge bg-danger ms-1">Hết hạn {Math.abs(daysLeft)} ngày</span>;
    if (daysLeft <= 30)
      return <span className="badge bg-warning text-dark ms-1">HĐ còn {daysLeft} ngày</span>;
    return null;
  }

  // ===== KÍCH THƯỚC CỘT CỐ ĐỊNH (khớp left của sticky) =====
  const COL_W_IMG = 80;  // px
  const COL_W_ID = 90;   // px
  const COL_W_NAME = 240; // px
  const LEFT_ID = COL_W_IMG;
  const LEFT_NAME = COL_W_IMG + COL_W_ID;

  return (
    <div className="container min-vh-100">
      {/* CSS nội tuyến cho sticky và scroll ngang */}
      <style>{`
        .hr-table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .table-freeze thead th,
        .table-freeze tbody td {
          white-space: nowrap;
        }
        .table-freeze .sticky-col {
          position: sticky;
          left: 0;
          z-index: 2; /* nằm trên các cột thường */
          background: #fff; /* tránh trong suốt khi trượt */
        }
        .table-freeze thead .sticky-col {
          z-index: 3; /* header trên body */
          background: #212529; /* đồng màu header bootstrap */
          color: #fff;
        }
        /* Cột 1: Ảnh */
        .sticky-col.col-1 {
          left: 0px;
          min-width: ${COL_W_IMG}px;
          width: ${COL_W_IMG}px;
          max-width: ${COL_W_IMG}px;
        }
        /* Cột 2: ID */
        .sticky-col.col-2 {
          left: ${LEFT_ID}px;
          min-width: ${COL_W_ID}px;
          width: ${COL_W_ID}px;
          max-width: ${COL_W_ID}px;
        }
        /* Cột 3: Họ tên */
        .sticky-col.col-3 {
          left: ${LEFT_NAME}px;
          min-width: ${COL_W_NAME}px;
          width: ${COL_W_NAME}px;
          max-width: ${COL_W_NAME}px;
        }
        /* Thêm viền phải nhẹ cho cột sticky để tách bạch */
        .sticky-col {
          box-shadow: 1px 0 0 rgba(0,0,0,0.06);
        }
      `}</style>

      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý nhân sự</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>

          <h2 className="text-center mb-4">Quản lý nhân sự</h2>

          <Row className="mb-3 align-items-center">
            <Col md={5}>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Nhập tên để tìm kiếm nhân sự.."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>
            <Col md={3}>
              <select
                className="form-select"
                value={selectedTrangThai}
                onChange={(e) => {
                  setSelectedTrangThai(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                <option value="Đang thử việc">Đang thử việc</option>
              </select>
            </Col>
            <Col md={4} className="text-end">
              {isHR && (
                <>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Thêm mới nhân sự</Tooltip>}>
                    <Button variant="outline-primary" className="me-2" onClick={handleAdd}>
                      Thêm nhân sự
                    </Button>
                  </OverlayTrigger>

                  <Button variant="outline-success" onClick={handleExportExcel}>
                    Xuất Excel
                  </Button>
                </>
              )}
            </Col>
          </Row>

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
              <div className="mt-2">Đang tải dữ liệu...</div>
            </div>
          ) : (
            // Bọc bảng trong wrapper có overflow-x để trượt ngang
            <div className="table-responsive hr-table-wrap">
              <Table bordered hover className="bg-white shadow-sm table-hover table-freeze">
                <thead className="table-dark text-center">
                  <tr>
                    <th className="sticky-col col-1" style={{ textAlign: "center" }}>Ảnh</th>
                    <th className="sticky-col col-2">ID</th>
                    <th className="sticky-col col-3">Họ tên</th>
                    <th>Giới tính</th>
                    <th>Ngày sinh</th>
                    <th>Email</th>
                    <th>SĐT</th>
                    <th>Chức vụ</th>
                    <th>Phòng ban</th>
                    <th>Địa chỉ</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((nv) => (
                    <tr key={nv.id} onClick={() => handleRowClick(nv)} style={{ cursor: "pointer" }}>
                      <td className="text-center sticky-col col-1">
                        {nv.avatar ? (
                          <img
                            src={`${API_BASE}/images/${nv.avatar}`}
                            alt="avatar"
                            width="40"
                            height="40"
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              backgroundColor: "#ccc",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "12px",
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="sticky-col col-2">{nv.id}</td>
                      <td className="sticky-col col-3">
                        {nv.ho_ten}
                        {getHopDongBadge(contracts[nv.id])}
                      </td>

                      <td>{nv.gioi_tinh}</td>
                      <td>{nv.ngay_sinh ? new Date(nv.ngay_sinh).toLocaleDateString("vi-VN") : ""}</td>
                      <td>{nv.email}</td>
                      <td>{nv.so_dien_thoai}</td>
                      <td>{getTenChucVu(nv.chuc_vu_id)}</td>
                      <td>{getTenPhongBan(nv.phong_ban_id)}</td>
                      <td>{nv.dia_chi}</td>
                      <td>{nv.trang_thai}</td>
                      {isHR && (
                        <td className="text-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-2"
                            onClick={() => openChungChi(nv)}
                          >
                            Chứng chỉ
                          </Button>
                          <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleEdit(nv)}>Sửa</Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(nv.id)}>Xóa</Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="d-flex justify-content-center align-items-center mt-4 gap-3">
              <Button
                variant="outline-secondary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ← Trang trước
              </Button>
              <span>Trang {currentPage} / {totalPages}</span>
              <Button
                variant="outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Trang sau →
              </Button>
            </div>
          )}

          <Modal show={showModal} onHide={handleModalClose} size="lg" centered>
            <Modal.Header closeButton>
              <Modal.Title className="text-center w-100">
                {editingNhanSu ? "Cập nhật nhân sự" : "Thêm nhân sự"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <NhanSuAddForm
                onAdded={handleFormSubmit}
                editingNhanSu={editingNhanSu}
                setEditingNhanSu={setEditingNhanSu}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleModalClose}>Đóng</Button>
            </Modal.Footer>
          </Modal>

          {showCCModal && selectedNV && (
            <ChungChiModal
              show={showCCModal}
              onHide={closeChungChi}
              nhanVien={selectedNV}
              onChanged={fetchNhanSu}
            />
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default QuanLyNhanSu;
