import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  Row,
  Col,
  Popover,
  Spinner,
  Card,
  Form,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { exportBangLuongToExcel } from "../../utils/exportToExcel";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../src/components/Loading";
import { getNhanVienInfo } from "../../utils/auth";
import {
  FaSearch,
  FaCalculator,
  FaFileExport,
  FaHome,
  FaTrash,
  FaInfoCircle,
} from "react-icons/fa";

const API_URL = "http://127.0.0.1:5000/api";
const HR_DEPARTMENT_ID = 2;

const QuanLyLuong = () => {
  const [luongList, setLuongList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedMonthNumber, setSelectedMonthNumber] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isTinhTatCa, setIsTinhTatCa] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [phongBanList, setPhongBanList] = useState([]);
  const [selectedPhongBan, setSelectedPhongBan] = useState("");

  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    thang: "",
    nam: "",
  });

  const navigate = useNavigate();
  const currentUser = getNhanVienInfo();
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  useEffect(() => {
    return () => {
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((bd) => bd.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetchLuong();
    fetchNhanVien();
    fetchPhongBan();
  }, []);

  useEffect(() => {
    if (!showModal) {
      const today = new Date();
      setFormData({
        nhan_vien_id: isHR ? "" : currentUser?.id || "",
        thang: today.getMonth() + 1,
        nam: today.getFullYear(),
      });
      setIsTinhTatCa(false);
    }
  }, [showModal, isHR, currentUser?.id]);

  const fetchPhongBan = async () => {
    try {
      const res = await axios.get(`${API_URL}/get-all-phong-ban`);
      setPhongBanList(res.data);
    } catch (error) {
      toast.error("Không thể tải danh sách phòng ban!", error);
    }
  };

  const fetchLuong = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/get-all-bang-luong`);
      setLuongList(response.data);
    } catch (error) {
      toast.error("Không thể tải dữ liệu lương!", error);
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
      toast.error("Không thể tải danh sách nhân viên!", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLuong = async (luongId) => {
    if (!isHR) return;
    if (!window.confirm("Bạn có chắc chắn muốn xoá dòng lương này?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/delete-bangluong/${luongId}`);
      toast.success("Xoá lương thành công!");
      fetchLuong();
    } catch (error) {
      toast.error("Không thể xoá lương.", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLuong = async () => {
    const { nhan_vien_id, thang, nam } = formData;

    if (!thang || !nam) {
      toast.warning("Vui lòng điền đầy đủ tháng và năm.");
      return;
    }

    if (!isHR) {
      let nhan_vien_id = currentUser?.id;
      if (!nhan_vien_id) {
        toast.error("Không xác định được nhân viên hiện tại!");
        return;
      }
    }

    if (isTinhTatCa && isHR) {
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/get-tinh-luong-tat-ca`, {
          thang: parseInt(thang),
          nam: parseInt(nam),
          phong_ban_id: selectedPhongBan ? parseInt(selectedPhongBan) : null,
        });
        const { data, errors } = response.data.data;
        if (errors && errors.length > 0) {
          errors.forEach((msg, i) =>
            toast.warning(msg, { autoClose: 2500, delay: i * 500 })
          );
        }
        if (data && data.length > 0) {
          toast.success("Đã tính lương cho tất cả nhân viên.");
        }
        setShowModal(false);
        fetchLuong();
      } catch (error) {
        const msg = error.response?.data?.message || "Lỗi hệ thống!";
        toast.error(msg);
        // toast.error("Lỗi khi tính lương cho tất cả nhân viên.", error);
      } finally {
        setLoading(false);
      }
    } else {
      if (!nhan_vien_id) {
        toast.warning("Vui lòng chọn nhân viên.");
        return;
      }
      setLoading(true);
      try {
        const response = await axios.post(`${API_URL}/get-tinh-luong-1nv`, {
          nhan_vien_id: parseInt(nhan_vien_id),
          thang: parseInt(thang),
          nam: parseInt(nam),
        });
        // console.log(response);
        if (response.data.success) {
          toast.success(response.data.message || "Tính lương thành công!");
          setShowModal(false);
          fetchLuong();
        } else {
          toast.error(response.data.message || "Không thể tính lương!");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Lỗi hệ thống!";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const nhanVienMap = useMemo(() => {
    return nhanVienList.reduce((acc, nv) => {
      acc[nv.id] = (nv.ho_ten || "").toLowerCase();
      return acc;
    }, {});
  }, [nhanVienList]);

  const filteredList = useMemo(() => {
    return luongList
      .filter((luong) => {
        if (!isHR && currentUser?.id && luong.nhan_vien_id !== currentUser.id) {
          return false;
        }
        const hoTen = nhanVienMap[luong.nhan_vien_id] || "";
        const searchMatch = hoTen.includes((searchKeyword || "").toLowerCase());
        const monthMatch =
          selectedMonthNumber && selectedYear
            ? luong.thang === parseInt(selectedMonthNumber) &&
              luong.nam === parseInt(selectedYear)
            : true;

        return searchMatch && monthMatch;
      })
      .sort((a, b) => b.id - a.id);
  }, [
    luongList,
    isHR,
    currentUser?.id,
    nhanVienMap,
    searchKeyword,
    selectedMonthNumber,
    selectedYear,
  ]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          color: "white",
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
                Quản lý lương
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">💰 Quản lý Lương</h1>
            <p className="mb-0 opacity-90">
              Quản lý và tính toán lương nhân viên
            </p>
          </div>
          <Button
            variant="outline-light"
            onClick={() => navigate("/")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
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
            <Col md={4}>
              <div className="position-relative">
                <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                <Form.Control
                  type="text"
                  placeholder="Tìm theo tên nhân viên..."
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
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn năm</option>
                {[...Array(5).keys()].map((i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={selectedMonthNumber}
                onChange={(e) => {
                  setSelectedMonthNumber(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Chọn tháng</option>
                {[...Array(12).keys()].map((i) => {
                  const month = i + 1;
                  return (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-success"
                className="w-100"
                onClick={() =>
                  exportBangLuongToExcel(filteredList, nhanVienList)
                }
              >
                <FaFileExport className="me-2" />
                Xuất Excel
              </Button>
            </Col>
          </Row>

          <Row className="g-3 mt-2">
            <Col md={6}>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Tính lương cho 1 nhân viên</Tooltip>}
              >
                <Button
                  variant="outline-primary"
                  className="w-100"
                  onClick={() => {
                    setIsTinhTatCa(false);
                    setShowModal(true);
                  }}
                  style={{
                    borderColor: "#667eea",
                    color: "#667eea",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#667eea";
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = "#667eea";
                  }}
                >
                  <FaCalculator className="me-2" />
                  Tính lương 1 nhân viên
                </Button>
              </OverlayTrigger>
            </Col>
            <Col md={6}>
              {isHR && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Tính lương toàn bộ nhân viên</Tooltip>}
                >
                  <Button
                    variant="outline-warning"
                    className="w-100"
                    onClick={() => {
                      setIsTinhTatCa(true);
                      setShowModal(true);
                    }}
                    style={{
                      borderColor: "#f59e0b",
                      color: "#f59e0b",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#f59e0b";
                      e.target.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "transparent";
                      e.target.style.color = "#f59e0b";
                    }}
                  >
                    <FaCalculator className="me-2" />
                    Tính lương tất cả
                  </Button>
                </OverlayTrigger>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm border-0 rounded-4">
        <Card.Body className="p-0">
          <div
            className="table-responsive"
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "80vh",
            }}
          >
            <Table
              bordered
              hover
              className="mb-0"
              style={{ minWidth: "1800px" }}
            >
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                }}
              >
                <tr>
                  {/* Icon column */}
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                      minWidth: "60px",
                      width: "60px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      textAlign: "center",
                      borderRight: "1px solid rgba(255,255,255,0.3)",
                      padding: "12px 4px",
                    }}
                  >
                    <FaInfoCircle size={14} />
                  </th>

                  {/* Nhân viên column */}
                  <th
                    style={{
                      position: "sticky",
                      left: "60px",
                      zIndex: 5,
                      minWidth: "200px",
                      width: "200px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      borderRight: "1px solid rgba(255,255,255,0.3)",
                      padding: "12px 8px",
                      textAlign: "center",
                    }}
                  >
                    Nhân viên
                  </th>

                  {/* Tháng column */}
                  <th
                    style={{
                      position: "sticky",
                      left: "260px",
                      zIndex: 5,
                      minWidth: "120px",
                      width: "120px",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                      color: "white",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      borderRight: "2px solid rgba(255,255,255,0.4)",
                      padding: "12px 8px",
                      textAlign: "center",
                    }}
                  >
                    Tháng
                  </th>

                  {/* Các columns thông thường với width cố định */}
                  {[
                    { name: "Ngày công chuẩn", width: "120px" },
                    { name: "Số ngày công", width: "110px" },
                    { name: "Ngày phép", width: "100px" },
                    { name: "Trừ nghỉ không phép", width: "140px" },
                    { name: "Ngày làm lễ", width: "110px" },
                    { name: "Tiền làm lễ", width: "110px" },
                    { name: "Giờ tăng ca", width: "110px" },
                    { name: "Tiền tăng ca", width: "110px" },
                    { name: "Ngày làm cuối tuần", width: "140px" },
                    { name: "Tiền làm cuối tuần", width: "140px" },

                    { name: "PC ăn trưa", width: "100px" },
                    { name: "PC xăng xe", width: "100px" },
                    { name: "PC độc hại", width: "100px" },
                    { name: "PC trách nhiệm", width: "120px" },
                    { name: "PC chức vụ", width: "100px" },
                    { name: "PC thâm niên", width: "110px" },
                    { name: "PC khác", width: "90px" },
                    { name: "Tổng phụ cấp", width: "110px" },

                    { name: "Thưởng nóng", width: "100px" },
                    { name: "Thưởng lễ", width: "90px" },
                    { name: "Thưởng khác", width: "100px" },
                    { name: "Tổng thưởng", width: "100px" },

                    { name: "Tổng lương", width: "110px" },

                    { name: "Trừ đi trễ/về sớm", width: "130px" },
                    { name: "Trừ vi phạm", width: "100px" },
                    { name: "Trừ tạm ứng", width: "100px" },
                    { name: "Trừ khác", width: "80px" },
                    { name: "Tổng khấu trừ", width: "110px" },

                    { name: "BHXH", width: "80px" },
                    { name: "BHTN", width: "80px" },
                    { name: "BHYT", width: "80px" },
                    { name: "Thuế TNCN", width: "90px" },
                    { name: "Thực nhận", width: "100px" },
                  ].map((column, index) => (
                    <th
                      key={index}
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                        minWidth: column.width,
                        width: column.width,
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRight: "1px solid rgba(255,255,255,0.2)",
                        padding: "12px 4px",
                        textAlign: "center",
                        whiteSpace: "normal",
                        lineHeight: "1.2",
                      }}
                      title={column.name}
                    >
                      {column.name}
                    </th>
                  ))}

                  {/* Hành động column */}
                  {isHR && (
                    <th
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        minWidth: "120px",
                        width: "120px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        padding: "12px 8px",
                        textAlign: "center",
                      }}
                    >
                      Hành động
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedList.length > 0 ? (
                  paginatedList.map((luong, rowIndex) => {
                    const nv = nhanVienList.find(
                      (nv) => nv.id === luong.nhan_vien_id
                    );
                    const anUong = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "AN_UONG"
                    );
                    const xangXe = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "XANG_XE"
                    );
                    const docHai = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "DOC_HAI"
                    );
                    const trachNhiem = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "TRACH_NHIEM"
                    );
                    const chucVu = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "CHUC_VU"
                    );
                    const thamNien = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "THAM_NIEN"
                    );
                    const phucapkhac = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "PHU_CAP_KHAC"
                    );

                    const diTreVeSom = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "DI_TRE_VE_SOM"
                    );
                    const nghiKhongPhep = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "NGHI_KHONG_PHEP"
                    );
                    const viPhamNoiQuy = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "VI_PHAM"
                    );
                    const tamUng = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "UNG_LUONG"
                    );
                    const truKhacList =
                      luong.chi_tiet_luong?.filter(
                        (ct) => ct.loai === "TRU_KHAC"
                      ) || [];

                    const thuongNong = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "NONG"
                    );
                    const thuongLe = luong.chi_tiet_luong?.find(
                      (ct) => ct.loai === "LE"
                    );
                    const thuongKhacList =
                      luong.chi_tiet_luong?.filter(
                        (ct) => ct.loai === "THUONG_KHAC"
                      ) || [];

                    return (
                      <tr
                        key={luong.id}
                        style={{ transition: "all 0.3s ease" }}
                      >
                        <td
                          style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                            minWidth: "60px",
                            width: "60px",
                            background: rowIndex % 2 === 0 ? "#f8f9fa" : "#fff",
                            textAlign: "center",
                            borderRight: "1px solid #dee2e6",
                          }}
                        >
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Popover>
                                <Popover.Body>
                                  <small>{luong?.ghi_chu || ""}</small>
                                </Popover.Body>
                              </Popover>
                            }
                          >
                            <span>
                              {luong.ghi_chu === "Nghỉ thai sản" ? "🤰" : ""}
                            </span>
                          </OverlayTrigger>
                        </td>
                        <td
                          style={{
                            position: "sticky",
                            left: "60px",
                            zIndex: 2,
                            minWidth: "200px",
                            width: "200px",
                            background: rowIndex % 2 === 0 ? "#f8f9fa" : "#fff",
                            fontWeight: "500",
                            borderRight: "1px solid #dee2e6",
                          }}
                        >
                          {nv?.ho_ten || "Không rõ"}
                        </td>
                        <td
                          style={{
                            position: "sticky",
                            left: "260px",
                            zIndex: 2,
                            minWidth: "120px",
                            width: "120px",
                            background: rowIndex % 2 === 0 ? "#f8f9fa" : "#fff",
                            borderRight: "2px solid #dee2e6",
                          }}
                        >
                          {`${luong.thang}/${luong.nam}`}
                        </td>

                        <td>{luong.ngay_cong_chuan}</td>
                        <td>{luong.so_ngay_cong}</td>
                        <td align="center">
                          {luong.nghi_phep > 0 ? luong.nghi_phep : " "}
                        </td>
                        <td className="text-danger bg-danger-subtle">
                          {nghiKhongPhep
                            ? formatCurrency(nghiKhongPhep.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td>{luong.tong_ngay_lam_le}</td>
                        <td className="text-success bg-success-subtle">
                          {formatCurrency(luong.tong_tien_lam_le)}
                        </td>
                        <td>{luong.tong_gio_tang_ca}</td>
                        <td className="text-success bg-success-subtle">
                          {formatCurrency(luong.tong_tien_tang_ca)}
                        </td>
                        <td>{luong.tong_ngay_cuoi_tuan}</td>
                        <td className="text-success bg-success-subtle">
                          {formatCurrency(luong.tong_tien_cuoi_tuan)}
                        </td>

                        <td className="text-success bg-success-subtle">
                          {anUong
                            ? formatCurrency(anUong.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-success bg-success-subtle">
                          {xangXe
                            ? formatCurrency(xangXe.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-success bg-success-subtle">
                          {docHai
                            ? formatCurrency(docHai.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-success bg-success-subtle">
                          {trachNhiem
                            ? formatCurrency(trachNhiem.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-success bg-success-subtle">
                          {chucVu
                            ? formatCurrency(chucVu.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-success bg-success-subtle">
                          {thamNien
                            ? formatCurrency(thamNien.so_tien)
                            : formatCurrency(0)}
                        </td>

                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover>
                              <Popover.Header as="h5">
                                Phụ cấp khác
                              </Popover.Header>
                              <Popover.Body>
                                <small>
                                  {phucapkhac?.ghi_chu || "Không có ghi chú"}
                                </small>
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <td className="text-success bg-success-subtle">
                            <span style={{ cursor: "pointer" }}>
                              {phucapkhac
                                ? formatCurrency(phucapkhac.so_tien)
                                : formatCurrency(0)}
                            </span>
                          </td>
                        </OverlayTrigger>

                        <td className="text-success bg-success bg-opacity-50">
                          <b>{formatCurrency(luong.tong_phu_cap)}</b>
                        </td>

                        <td className="bg-warning-subtle">
                          {thuongNong
                            ? formatCurrency(thuongNong.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="bg-warning-subtle">
                          {thuongLe
                            ? formatCurrency(thuongLe.so_tien)
                            : formatCurrency(0)}
                        </td>

                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover>
                              <Popover.Header as="h5">
                                Thưởng khác
                              </Popover.Header>
                              <Popover.Body>
                                {thuongKhacList.length > 0 ? (
                                  <ul className="mb-0 ps-3">
                                    {thuongKhacList.map((tk, index) => (
                                      <li key={index}>
                                        <div>
                                          <strong>
                                            {tk.ghi_chu || "Thưởng khác"}
                                          </strong>
                                        </div>
                                        <div>
                                          Số tiền: {formatCurrency(tk.so_tien)}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <small>Không có thưởng khác</small>
                                )}
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <td className="bg-warning-subtle">
                            <span style={{ cursor: "pointer" }}>
                              {thuongKhacList.length > 0
                                ? formatCurrency(
                                    thuongKhacList.reduce(
                                      (sum, tk) => sum + (tk.so_tien || 0),
                                      0
                                    )
                                  )
                                : formatCurrency(0)}
                            </span>
                          </td>
                        </OverlayTrigger>

                        <td className="bg-warning bg-opacity-50">
                          <b>{formatCurrency(luong.tong_thuong)}</b>
                        </td>

                        <td>
                          <b>{formatCurrency(luong.tong_luong)}</b>
                        </td>
                        <td className="text-danger bg-danger-subtle">
                          {diTreVeSom
                            ? formatCurrency(diTreVeSom.so_tien)
                            : formatCurrency(0)}
                        </td>

                        <td className="text-danger bg-danger-subtle">
                          {viPhamNoiQuy
                            ? formatCurrency(viPhamNoiQuy.so_tien)
                            : formatCurrency(0)}
                        </td>
                        <td className="text-danger bg-danger-subtle">
                          {tamUng
                            ? formatCurrency(tamUng.so_tien)
                            : formatCurrency(0)}
                        </td>

                        {/* <OverlayTrigger
                        placement="top"
                        overlay={
                          <Popover>
                            <Popover.Header as="h5">Trừ khác</Popover.Header>
                            <Popover.Body>
                              <small>
                                {truKhac?.ghi_chu || "Không có ghi chú"}
                              </small>
                            </Popover.Body>
                          </Popover>
                        }
                      >
                        <td className="text-danger bg-danger-subtle">
                          <span style={{ cursor: "pointer" }}>
                            {truKhac
                              ? formatCurrency(truKhac.so_tien)
                              : formatCurrency(0)}
                          </span>
                        </td>
                      </OverlayTrigger> */}
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover>
                              <Popover.Header as="h5">
                                Khấu trừ khác
                              </Popover.Header>
                              <Popover.Body>
                                {truKhacList.length > 0 ? (
                                  <ul className="mb-0 ps-3">
                                    {truKhacList.map((kt, index) => (
                                      <li key={index}>
                                        <div>
                                          <strong>
                                            {kt.ghi_chu || "Khấu trừ khác"}
                                          </strong>
                                        </div>
                                        <div>
                                          Số tiền: {formatCurrency(kt.so_tien)}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <small>Không có khấu trừ</small>
                                )}
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <td className="text-danger bg-danger-subtle">
                            <span style={{ cursor: "pointer" }}>
                              {truKhacList.length > 0
                                ? formatCurrency(
                                    truKhacList.reduce(
                                      (sum, kt) => sum + (kt.so_tien || 0),
                                      0
                                    )
                                  )
                                : formatCurrency(0)}
                            </span>
                          </td>
                        </OverlayTrigger>

                        <td className="text-danger bg-danger bg-opacity-50 ">
                          <b>{formatCurrency(luong.tong_khau_tru)}</b>
                        </td>
                        <td className="text-danger">
                          {formatCurrency(luong.bhxh)}
                        </td>
                        <td className="text-danger">
                          {formatCurrency(luong.bhtn)}
                        </td>
                        <td className="text-danger">
                          {formatCurrency(luong.bhyt)}
                        </td>
                        <td className="text-danger">
                          {formatCurrency(luong.thue_tncn)}
                        </td>
                        <td className="bg-primary bg-opacity-25">
                          <b>{formatCurrency(luong.thuc_nhan)}</b>
                        </td>
                        {isHR && (
                          <td>
                            <OverlayTrigger
                              placement="top"
                              overlay={<Tooltip>Xoá dòng lương này</Tooltip>}
                            >
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteLuong(luong.id)}
                              >
                                <FaTrash />
                              </Button>
                            </OverlayTrigger>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="42" className="text-center text-muted py-4">
                      <FaInfoCircle size={32} className="mb-2 opacity-50" />
                      <br />
                      Không có bảng lương
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      {/* Phân trang giữ nguyên kiểu cũ */}
      {totalPages > 1 && (
        <Card className="shadow-sm border-0 rounded-4 mt-4">
          <Card.Body className="py-3">
            <Row className="justify-content-center">
              <Col xs="auto">
                <div className="d-flex align-items-center gap-3">
                  <Button
                    variant="outline-primary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    style={{ borderColor: "#667eea", color: "#667eea" }}
                  >
                    ← Trước
                  </Button>
                  <span className="fw-semibold" style={{ color: "#4a5568" }}>
                    Trang {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline-primary"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    style={{ borderColor: "#667eea", color: "#667eea" }}
                  >
                    Sau →
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      {/* Modal tính lương */}
      {/* <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Tính lương</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {!isTinhTatCa && (
                <select
                  className="form-control mb-3"
                  value={formData.nhan_vien_id}
                  onChange={(e) =>
                    setFormData({ ...formData, nhan_vien_id: e.target.value })
                  }
                >
                  <option value="">Chọn nhân viên</option>
                  {nhanVienList.map((nv) => (
                    <option key={nv.id} value={nv.id}>
                      {nv.ho_ten}
                    </option>
                  ))}
                </select>
              )}
              <div className="d-flex gap-2">
                <input
                  type="number"
                  placeholder="Tháng"
                  className="form-control"
                  value={formData.thang}
                  onChange={(e) =>
                    setFormData({ ...formData, thang: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Năm"
                  className="form-control"
                  value={formData.nam}
                  onChange={(e) =>
                    setFormData({ ...formData, nam: e.target.value })
                  }
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Đóng
              </Button>
              <Button variant="primary" onClick={handleSubmitLuong}>
                Tính lương
              </Button>
            </Modal.Footer>
          </Modal> */}
      {/* Modal tính lương */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        backdrop="static"
        centered
        className="rounded-4"
      >
        <Modal.Header
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
          }}
        >
          <Modal.Title>
            {isTinhTatCa
              ? "Tính lương cho tất cả nhân viên"
              : "Tính lương cho 1 nhân viên"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tháng</Form.Label>
              <Form.Control
                type="number"
                value={formData.thang}
                onChange={(e) =>
                  setFormData({ ...formData, thang: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Năm</Form.Label>
              <Form.Control
                type="number"
                value={formData.nam}
                onChange={(e) =>
                  setFormData({ ...formData, nam: e.target.value })
                }
              />
            </Form.Group>

            {isTinhTatCa && (
              <Form.Group className="mb-3">
                <Form.Label>Chọn phòng ban (tuỳ chọn)</Form.Label>
                <Form.Select
                  value={selectedPhongBan}
                  onChange={(e) => setSelectedPhongBan(e.target.value)}
                >
                  <option value="">Tất cả phòng ban</option>
                  {phongBanList.map((pb) => (
                    <option key={pb.id} value={pb.id}>
                      {pb.ten_phong_ban}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {!isTinhTatCa && (
              <Form.Group className="mb-3">
                <Form.Label>Chọn nhân viên</Form.Label>
                <Form.Select
                  value={formData.nhan_vien_id}
                  onChange={(e) =>
                    setFormData({ ...formData, nhan_vien_id: e.target.value })
                  }
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {nhanVienList.map((nv) => (
                    <option key={nv.id} value={nv.id}>
                      {nv.ho_ten}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
          >
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitLuong}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
            }}
          >
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default QuanLyLuong;
