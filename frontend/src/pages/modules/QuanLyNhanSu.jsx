import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  Button,
  Table,
  Row,
  Col,
  Breadcrumb,
  Spinner,
  Card,
  Form,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import NhanSuAddForm from "../../components/nhansu/NhanSuAddForm";
import { getAllChucVu } from "../../services/chucVuApi";
import { getAllPhongBan } from "../../services/phongBanApi";
import { getAllVaiTro } from "../../services/vaiTroApi";
import axiosInstance from "../../services/axiosInstance";
import { exportJsonToExcel } from "../../utils/excelExport";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getNhanVienInfo, isHrOrAdmin } from "../../utils/auth";
import { getHopDongBatchByNhanVienIds } from "../../services/hopDongLaoDongApi";
import { getAllNhanVien, deleteNhanVien as apiDeleteNhanVien } from "../../services/nhanSuApi";
import ChungChiModal from "../../components/nhansu/ChungChiModal";
import {
  FaHome,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileExport,
  FaUser,
  FaIdCard,
  FaCertificate
} from "react-icons/fa";
import Loading from "../../../src/components/Loading";

const QuanLyNhanSu = () => {
  const [nhanSuList, setNhanSuList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingNhanSu, setEditingNhanSu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [dsVaiTro, setDsVaiTro] = useState([]);
  const [selectedTrangThai, setSelectedTrangThai] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const currentUser = getNhanVienInfo();
  const [showCCModal, setShowCCModal] = useState(false);
  const [selectedNV, setSelectedNV] = useState(null);
  const isHR = isHrOrAdmin(currentUser);
  const [contracts, setContracts] = useState({});

  const itemsPerPage = 10;
  const navigate = useNavigate();
  const API_BASE = axiosInstance.defaults.baseURL;

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
      // Tách riêng vai trò: chỉ tài khoản có quyền "vai_tro.xem" mới gọi được
      // API này — lỗi ở đây (vd 403 với tài khoản không phải Admin) không nên
      // chặn cả trang hay các danh mục còn lại, chỉ đơn giản là ô "Vai trò"
      // trong form thêm mới sẽ không có lựa chọn nào.
      try {
        const vt = await getAllVaiTro();
        setDsVaiTro(Array.isArray(vt) ? vt : []);
      } catch (err) {
        console.error("Không tải được danh sách vai trò (có thể do thiếu quyền):", err);
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

  const handleExportExcel = async () => {
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

    await exportJsonToExcel(
      exportData,
      "DanhSachNhanSu",
      `DanhSachNhanSu_${new Date().toLocaleDateString("vi-VN")}.xlsx`
    );
  };

  function getHopDongBadge(hd) {
    if (!hd) return null;
    if (!hd.ngay_ket_thuc) return null;
    const today = new Date();
    const end = new Date(hd.ngay_ket_thuc);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)
      return <span className="badge bg-danger ms-1">Hết hạn {Math.abs(daysLeft)} ngày</span>;
    if (daysLeft <= 30)
      return <span className="badge bg-warning text-dark ms-1">HĐ còn {daysLeft} ngày</span>;
    return null;
  }

  // Kích thước cột cố định
  const COL_W_IMG = 80;
  const COL_W_ID = 90;
  const COL_W_NAME = 240;
  const LEFT_ID = COL_W_IMG;
  const LEFT_NAME = COL_W_IMG + COL_W_ID;
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
                Quản lý nhân sự
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">👥 Quản lý Nhân Sự</h1>
            <p className="mb-0 opacity-90">
              Quản lý thông tin nhân viên toàn diện
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

      {/* Filter and Actions Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={5}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Nhập tên để tìm kiếm nhân sự..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select
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
              </Form.Select>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2">
                {isHR && (
                  <Button
                    variant="primary"
                    className="flex-grow-1"
                    onClick={handleAdd}
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none"
                    }}
                  >
                    <FaPlus className="me-2" />
                    Thêm nhân sự
                  </Button>
                )}
                <Button
                  variant="outline-primary"
                  onClick={handleExportExcel}
                  className="flex-grow-1"
                  style={{ borderColor: "#667eea", color: "#667eea" }}
                >
                  <FaFileExport className="me-2" />
                  Xuất Excel
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table Card */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Header
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          <FaUser className="me-2" />
          Danh sách Nhân Viên
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <div
              className="table-responsive"
              style={{
                overflowX: "auto",
                overflowY: "auto",
                maxHeight: "900px"
              }}
            >
              <style>{`
                .table-freeze thead th,
                .table-freeze tbody td {
                  white-space: nowrap;
                }
                .table-freeze .sticky-col {
                  position: sticky;
                  left: 0;
                  z-index: 2;
                  background: #fff;
                }
                .table-freeze thead .sticky-col {
                  z-index: 3;
                }
                .sticky-col.col-1 {
                  left: 0px;
                  min-width: ${COL_W_IMG}px;
                  width: ${COL_W_IMG}px;
                }
                .sticky-col.col-2 {
                  left: ${LEFT_ID}px;
                  min-width: ${COL_W_ID}px;
                  width: ${COL_W_ID}px;
                }
                .sticky-col.col-3 {
                  left: ${LEFT_NAME}px;
                  min-width: ${COL_W_NAME}px;
                  width: ${COL_W_NAME}px;
                }
                .sticky-col {
                  box-shadow: 1px 0 0 rgba(0,0,0,0.06);
                }
              `}</style>

              <Table bordered hover className="mb-2 table-freeze" style={{ minWidth: "1400px" }}>
                <thead
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                    color: "white",
                    position: "sticky",
                    top: 0,
                    zIndex: 2
                  }}
                >
                  <tr>
                    <th className="sticky-col col-1 text-center">Ảnh</th>
                    <th className="sticky-col col-2">ID</th>
                    <th className="sticky-col col-3">Họ tên</th>
                    <th style={{ minWidth: "100px" }}>Giới tính</th>
                    <th style={{ minWidth: "120px" }}>Ngày sinh</th>
                    <th style={{ minWidth: "200px" }}>Email</th>
                    <th style={{ minWidth: "120px" }}>SĐT</th>
                    <th style={{ minWidth: "150px" }}>Chức vụ</th>
                    <th style={{ minWidth: "150px" }}>Phòng ban</th>
                    <th style={{ minWidth: "200px" }}>Địa chỉ</th>
                    <th style={{ minWidth: "120px" }}>Trạng thái</th>
                    {isHR && <th style={{ minWidth: "180px" }}>Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((nv) => (
                    <tr key={nv.id} onClick={() => handleRowClick(nv)} style={{ cursor: "pointer", transition: "all 0.3s ease" }}>
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
                            className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#e9ecef",
                              fontSize: "12px",
                              color: "#6c757d"
                            }}
                          >
                            <FaUser />
                          </div>
                        )}
                      </td>
                      <td className="sticky-col col-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          #{nv.id}
                        </span>
                      </td>
                      <td className="sticky-col col-3" style={{ fontWeight: "500" }}>
                        <div className="d-flex align-items-center">
                          <FaIdCard className="me-2 text-primary" />
                          {nv.ho_ten}
                          {getHopDongBadge(contracts[nv.id])}
                        </div>
                      </td>
                      <td>{nv.gioi_tinh}</td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info">
                          {nv.ngay_sinh ? new Date(nv.ngay_sinh).toLocaleDateString("vi-VN") : ""}
                        </span>
                      </td>
                      <td>{nv.email}</td>
                      <td>{nv.so_dien_thoai}</td>
                      <td>
                        <span className="badge bg-warning bg-opacity-10 text-warning">
                          {getTenChucVu(nv.chuc_vu_id)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success">
                          {getTenPhongBan(nv.phong_ban_id)}
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <div className="text-truncate" title={nv.dia_chi}>
                          {nv.dia_chi}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${nv.trang_thai === "Đang làm việc" ? "bg-success" :
                            nv.trang_thai === "Đã nghỉ việc" ? "bg-danger" :
                              "bg-warning text-dark"
                          }`}>
                          {nv.trang_thai}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex gap-1 flex-wrap">
                          {/* Nút chứng chỉ — ai cũng thấy */}
                          <OverlayTrigger placement="top" overlay={<Tooltip>Chứng chỉ</Tooltip>}>
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => openChungChi(nv)}
                            >
                              <FaCertificate />
                            </Button>
                          </OverlayTrigger>

                          {/* Các nút Sửa/Xóa — chỉ HR mới thấy */}
                          {isHR && (
                            <>
                              <OverlayTrigger placement="top" overlay={<Tooltip>Sửa</Tooltip>}>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEdit(nv)}
                                >
                                  <FaEdit />
                                </Button>
                              </OverlayTrigger>

                              <OverlayTrigger placement="top" overlay={<Tooltip>Xóa</Tooltip>}>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(nv.id)}
                                >
                                  <FaTrash />
                                </Button>
                              </OverlayTrigger>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {currentItems.length === 0 && !loading && (
            <div className="text-center text-muted py-5">
              <FaUser size={48} className="mb-3 opacity-50" />
              <br />
              Không có nhân sự nào phù hợp
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <Card className="shadow-sm border-0 rounded-4 mt-4">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-center align-items-center gap-3">
              <Button
                variant="outline-primary"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ borderColor: "#667eea", color: "#667eea" }}
              >
                Trang sau →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal thêm/sửa nhân sự */}
      <Modal
        show={showModal}
        onHide={handleModalClose}
        size="lg"
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Modal.Title>
            {editingNhanSu ? "✏️ Cập nhật nhân sự" : "➕ Thêm nhân sự"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <NhanSuAddForm
            onAdded={handleFormSubmit}
            editingNhanSu={editingNhanSu}
            setEditingNhanSu={setEditingNhanSu}
            dsChucVu={dsChucVu}
            dsPhongBan={dsPhongBan}
            dsVaiTro={dsVaiTro}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal chứng chỉ */}
      {showCCModal && selectedNV && (
        <ChungChiModal
          show={showCCModal}
          onHide={closeChungChi}
          nhanVien={selectedNV}
          onChanged={fetchNhanSu}
        />
      )}
    </div>
  );
};

export default QuanLyNhanSu;