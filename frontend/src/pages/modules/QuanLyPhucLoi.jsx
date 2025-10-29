import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Button,
  Table,
  Modal,
  Breadcrumb,
  Card,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PhucLoiForm from "../../components/phucloi/PhucLoiForm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  getAllPhucLoi,
  deletePhucLoi as apiDeletePhucLoi,
} from "../../services/phucLoiApi";

import {
  FaHome,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileExcel,
  FaGift,
} from "react-icons/fa";

import Loading from "../../components/Loading";

const ITEMS_PER_PAGE = 5;

const QuanLyPhucLoi = () => {
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [selectedPhucLoi, setSelectedPhucLoi] = useState(null);

  const [searchKeyword, setSearchKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Tải danh sách phúc lợi
  const fetchPhucLoiList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPhucLoi();
      setPhucLoiList(data || []);
    } catch (err) {
      console.error("Lỗi khi tải phúc lợi:", err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách phúc lợi!"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhucLoiList();
  }, [fetchPhucLoiList]);

  // Chuẩn hóa keyword tìm kiếm
  const normalizedKeyword = searchKeyword.trim().toLowerCase();

  // Danh sách đã lọc
  const filteredList = useMemo(() => {
    if (!normalizedKeyword) return phucLoiList;
    return phucLoiList.filter((pl) => {
      const ten = (pl.ten_phuc_loi || "").toLowerCase();
      const moTa = (pl.mo_ta || "").toLowerCase();
      return ten.includes(normalizedKeyword) || moTa.includes(normalizedKeyword);
    });
  }, [phucLoiList, normalizedKeyword]);

  const totalPages = useMemo(
    () =>
      Math.max(
        1,
        Math.ceil(filteredList.length / ITEMS_PER_PAGE)
      ),
    [filteredList.length]
  );

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Thêm mới
  const handleAdd = () => {
    setSelectedPhucLoi(null);
    setShowModal(true);
  };

  // Sửa
  const handleEdit = (pl) => {
    setSelectedPhucLoi(pl);
    setShowModal(true);
  };

  // Xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      try {
        await toast.promise(apiDeletePhucLoi(id), {
          pending: "Đang xóa phúc lợi...",
          success: "Xóa phúc lợi thành công!",
          error: "❌ Lỗi khi xóa phúc lợi!",
        });

        // Xóa trong state cho mượt
        setPhucLoiList((prev) => prev.filter((x) => x.id !== id));
        setCurrentPage(1);
      } catch (err) {
        console.error("Lỗi xóa:", err);
        toast.error(
          err?.response?.data?.message ||
          "Không thể xóa phúc lợi!"
        );
      }
    }
  };

  // Submit form (thêm/sửa)
  const handleFormSubmit = (message) => {
    fetchPhucLoiList();
    setShowModal(false);
    toast.success(message || "Cập nhật phúc lợi thành công!");
    setCurrentPage(1);
  };

  // Xuất Excel
  const exportToExcel = () => {
    try {
      const exportData = phucLoiList.map((item) => ({
        "Tên phúc lợi": item.ten_phuc_loi,
        "Mô tả": item.mo_ta,
        "Giá trị": item.gia_tri,
        "Loại": item.loai,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PhucLoi");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(file, "DanhSachPhucLoi.xlsx");
      toast.success("📤 Đã xuất Excel!");
    } catch {
      toast.error("❌ Xuất Excel thất bại!");
    }
  };

  return (
    <div
      className="p-4 ps-5"
      style={{
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* ToastContainer luôn active */}
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Overlay loading mờ toàn trang giống các màn hình dashboard */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontSize: "1rem",
            fontWeight: "500",
            color: "#4a5568",
          }}
        >
          <Loading />
          <div className="mt-2">Đang tải dữ liệu...</div>
        </div>
      )}

      {/* Header gradient tím bo góc giống các trang khác */}
      <div
        className="rounded-4 mb-4 shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "2rem",
          color: "white",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Breadcrumb className="mb-3">
              <Breadcrumb.Item
                active
                style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item
                active
                style={{ color: "white" }}
              >
                Quản lý phúc lợi
              </Breadcrumb.Item>
            </Breadcrumb>

            <h1 className="fw-bold mb-2">
              <FaGift className="me-2" />
              Quản lý Phúc lợi
            </h1>

            <p className="mb-0 opacity-90">
              Danh sách chế độ phúc lợi và quyền lợi dành cho
              nhân viên
            </p>
          </div>

          <Button
            variant="outline-light"
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background:
                "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <FaHome className="me-2" />
            Trang chủ
          </Button>
        </div>
      </div>

      {/* Card: Bộ lọc & Hành động */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header
          style={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem",
          }}
        >
          <FaSearch className="me-2" />
          Tìm kiếm & Hành động
        </Card.Header>

        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            {/* Ô tìm kiếm */}
            <Col md={6}>
              <div className="fw-semibold mb-2">
                Tìm kiếm phúc lợi
              </div>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Nhập tên hoặc mô tả phúc lợi..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(
                      e.target.value
                    );
                    setCurrentPage(1);
                  }}
                  style={{
                    paddingLeft: "2.5rem",
                  }}
                />
              </div>
            </Col>

            <Col
              md={6}
              className="d-flex flex-wrap justify-content-end gap-2"
            >
              <Button
                variant="outline-primary"
                onClick={exportToExcel}
                style={{
                  borderColor: "#667eea",
                  color: "#667eea",
                }}
              >
                <FaFileExcel className="me-2" />
                Xuất Excel
              </Button>

              <Button
                variant="primary"
                onClick={handleAdd}
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                <FaPlus className="me-2" />
                Thêm phúc lợi
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Card: Danh sách phúc lợi */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header
          style={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem",
          }}
        >
          <FaGift className="me-2" />
          Danh sách Phúc lợi
        </Card.Header>

        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table bordered hover className="mb-0 align-middle">
              <thead
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                  color: "white",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Tên phúc lợi
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Mô tả
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Giá trị
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Loại
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      fontWeight: "600",
                    }}
                  >
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-muted py-4"
                    >
                      <FaGift className="fs-1 mb-2 opacity-50" />
                      <div>
                        Không có dữ liệu phù hợp
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((pl) => (
                    <tr
                      key={pl.id}
                      style={{
                        transition:
                          "all 0.3s ease",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {pl.ten_phuc_loi}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {pl.mo_ta}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {pl.gia_tri}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {pl.loai}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div className="d-flex gap-1 flex-wrap justify-content-center">
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() =>
                              handleEdit(pl)
                            }
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() =>
                              handleDelete(
                                pl.id
                              )
                            }
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination card */}
      {totalPages > 1 && (
        <Card className="shadow-sm border-0 rounded-4 mt-4">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
              <Button
                variant="outline-primary"
                onClick={() =>
                  handlePageChange(currentPage - 1)
                }
                disabled={currentPage === 1}
                style={{
                  borderColor: "#667eea",
                  color: "#667eea",
                }}
              >
                ← Trước
              </Button>

              {Array.from(
                { length: totalPages },
                (_, i) => (
                  <Button
                    key={i}
                    variant={
                      i + 1 === currentPage
                        ? "primary"
                        : "outline-primary"
                    }
                    onClick={() =>
                      setCurrentPage(i + 1)
                    }
                    style={
                      i + 1 === currentPage
                        ? {
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }
                        : {
                          borderColor:
                            "#667eea",
                          color: "#667eea",
                        }
                    }
                  >
                    {i + 1}
                  </Button>
                )
              )}

              <Button
                variant="outline-primary"
                onClick={() =>
                  handlePageChange(currentPage + 1)
                }
                disabled={currentPage === totalPages}
                style={{
                  borderColor: "#667eea",
                  color: "#667eea",
                }}
              >
                Sau →
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal thêm/sửa với header gradient tím */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Modal.Title>
            {selectedPhucLoi
              ? "✏️ Cập nhật phúc lợi"
              : "➕ Thêm phúc lợi"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <PhucLoiForm
            selected={selectedPhucLoi}
            onAdded={handleFormSubmit}
            onClose={() => setShowModal(false)}
            fetchPhucLoiList={fetchPhucLoiList}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default QuanLyPhucLoi;
