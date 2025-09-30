import React, { useEffect, useState, useRef } from "react";
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
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../src/components/Loading";

const API_URL = "http://127.0.0.1:5000/api";

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
  // const hasFetched = useRef(false);

  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    thang: "",
    nam: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    // if (hasFetched.current) return; // Nếu đã gọi rồi -> bỏ qua
    // hasFetched.current = true;
    fetchLuong();
    fetchNhanVien();
  }, []);

  useEffect(() => {
    if (!showModal) {
      const today = new Date();
      setFormData({
        nhan_vien_id: "",
        thang: today.getMonth() + 1,
        nam: today.getFullYear(),
      });
      setIsTinhTatCa(false);
    }
  }, [showModal]);

  const fetchLuong = async () => {
    try {
      setLoading(true);
      // const response = await axios.get(`${API_URL}/get-all-luong`);
      const response = await axios.get(`${API_URL}/get-all-bang-luong`);
      setLuongList(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Không thể tải dữ liệu lương!");
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(response.data);
    } catch (error) {
      setLoading(false);
      toast.error("Không thể tải danh sách nhân viên!");
    }
  };

  const handleDeleteLuong = async (luongId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá dòng lương này?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/delete-bangluong/${luongId}`);
      toast.success("Xoá lương thành công!");
      fetchLuong();
    } catch (error) {
      setLoading(false);
      toast.error("Không thể xoá lương.");
    }
  };

  const handleSubmitLuong = async () => {
    const { nhan_vien_id, thang, nam } = formData;

    if (!thang || !nam) {
      toast.warning("Vui lòng điền đầy đủ tháng và năm.");
      return;
    }

    if (isTinhTatCa) {
      try {
        const response = await axios.post(`${API_URL}/tinh-luong-tat-ca`, {
          thang: parseInt(thang),
          nam: parseInt(nam),
        });
        if (response.data.data) {
          toast.success("Đã tính lương cho tất cả nhân viên.");
          setShowModal(false);
          fetchLuong();
        } else {
          toast.error("Không thể tính lương.");
        }
      } catch (error) {
        toast.error("Lỗi khi tính lương cho tất cả nhân viên.");
      }
    } else {
      if (!nhan_vien_id) {
        toast.warning("Vui lòng chọn nhân viên.");
        return;
      }

      try {
        setLoading(true);
        // const response = await axios.post(`${API_URL}/tinh-luong`, {
        //   nhan_vien_id: parseInt(nhan_vien_id),
        //   thang: parseInt(thang),
        //   nam: parseInt(nam),
        // });
        const response = await axios.post(`${API_URL}/get-tinh-luong-1nv`, {
          nhan_vien_id: parseInt(nhan_vien_id),
          thang: parseInt(thang),
          nam: parseInt(nam),
        });
        setLoading(false);
        if (response.data) {
          toast.success("Tính lương thành công!");
          setShowModal(false);
          fetchLuong();
        } else {
          toast.error("Không thể tính lương.");
          setLoading(false);
        }
      } catch (error) {
        toast.error("Lỗi khi tính lương!");
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const nhanVienMap = nhanVienList.reduce((acc, nv) => {
    acc[nv.id] = nv.ho_ten.toLowerCase();
    return acc;
  }, {});

  const filteredList = luongList
    .filter((luong) => {
      const hoTen = nhanVienMap[luong.nhan_vien_id] || "";
      const searchMatch = hoTen.includes(searchKeyword.toLowerCase());
      const monthMatch =
        selectedMonthNumber && selectedYear
          ? luong.thang === parseInt(selectedMonthNumber) &&
            luong.nam === parseInt(selectedYear)
          : true;
      return searchMatch && monthMatch;
    })
    .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToExcel = () => {
    const dataToExport = filteredList.map((luong) => {
      const nv = nhanVienList.find((nv) => nv.id === luong.nhan_vien_id);
      return {
        "Nhân viên": nv?.ho_ten || "Không rõ",
        Tháng: `${luong.thang}/${luong.nam}`,
        "Ngày công chuẩn": luong.ngay_cong_chuan,
        "Số ngày công": luong.so_ngay_cong,
        "Giờ tăng ca": luong.tong_gio_tang_ca,
        "Phụ cấp": luong.tong_phu_cap,
        "Khấu trừ": luong.tong_khau_tru,
        "Bảo hiểm xã hội": luong.bhxh,
        "Bảo hiểm thất nghiệp": luong.bhtn,
        "Bảo hiểm y tế": luong.bhyt,
        "Thuế thu nhập cá nhân": luong.thue_tncn,
        "Tổng lương": luong.tong_luong,
        "Thực nhận": luong.thuc_nhan,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng Lương");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "bang_luong.xlsx");
    toast.success("Xuất file Excel thành công!");
  };

  if (loading)
    return (
      <div>
        <ToastContainer />
        <Loading />
      </div>
    );

  return (
    <div className="container min-vh-100">
      {/* {loading && (
        <div>
          <ToastContainer />
          <Loading />
        </div>
      )} */}
      <ToastContainer />
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý lương</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>
            ← Trang chủ
          </Button>
          <h2 className="mb-4 text-center">Quản lý lương</h2>
          {/* Bộ lọc */}
          <div className="row mb-4">
            <div className="col-md-4 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo tên nhân viên..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-md-4 mb-2">
              <select
                className="form-control"
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
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <select
                className="form-control"
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
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Tính lương cho 1 nhân viên</Tooltip>}
              >
                <Button
                  variant="outline-success"
                  className="w-100"
                  onClick={() => setShowModal(true)}
                >
                  Tính lương cho 1 nhân viên
                </Button>
              </OverlayTrigger>
            </div>
            <div className="col-md-4 mb-2">
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
                >
                  Tính lương tất cả nhân viên
                </Button>
              </OverlayTrigger>
            </div>
            <div className="col-md-2 mb-2 d-flex justify-content-md-end justify-content-center">
              <Button
                variant="outline-success"
                className="w-100 w-md-auto"
                onClick={exportToExcel}
              >
                Xuất Excel
              </Button>
            </div>
          </div>
          {/* Bảng lương */}

          <div
            style={{
              maxHeight: "75vh",
              overflowX: "auto",
              overflowY: "auto",
              whiteSpace: "nowrap",
              position: "relative", // Để các cột sticky hoạt động đúng
            }}
          >
            <Table striped bordered hover responsive className="align-middle">
              <thead
                className="table-dark"
                style={{ position: "sticky", top: 0, zIndex: 3 }}
              >
                <tr>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 4,
                      minWidth: "50px", // icon
                      background: "#212529", // cùng màu header
                    }}
                  ></th>
                  <th
                    style={{
                      position: "sticky",
                      left: "49px",
                      zIndex: 4,
                      minWidth: "180px", // tên NV
                      background: "#212529",
                    }}
                  >
                    Nhân viên
                  </th>
                  <th
                    style={{
                      position: "sticky",
                      left: "228px", // = 50px + 180px
                      zIndex: 4,
                      minWidth: "120px",
                      background: "#212529",
                    }}
                  >
                    Tháng
                  </th>
                  <th>Ngày công chuẩn</th>
                  <th>Số ngày công</th>
                  <th>Ngày phép</th>
                  <th>Trừ nghỉ không phép</th>
                  <th>Ngày làm lễ</th>
                  <th>Tiền làm lễ</th>
                  <th>Giờ tăng ca</th>
                  <th>Tiền tăng ca</th>

                  <th>Phụ cấp ăn trưa</th>
                  <th>Phụ cấp xăng, xe</th>
                  <th>Phụ cấp độc hại</th>
                  <th>Phụ cấp trách nhiệm</th>
                  <th>Phụ cấp chức vụ</th>
                  <th>Phụ cấp thâm niên</th>
                  <th>Phụ cấp khác</th>
                  <th>Tổng phụ cấp</th>

                  <th>Thưởng nóng</th>
                  <th>Thưởng lễ</th>
                  <th>Thưởng khác</th>
                  <th>Tổng Thưởng</th>

                  <th>Tổng lương</th>

                  <th>Trừ đi trễ, về sớm</th>

                  <th>Trừ vi phạm</th>
                  <th>Trừ tạm ứng</th>
                  <th>Trừ khác</th>
                  <th>Tổng khấu trừ</th>

                  <th>BHXH</th>
                  <th>BHTN</th>
                  <th>BHYT</th>
                  <th>Thuế TNCN</th>
                  <th>Thực nhận</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((luong) => {
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
                    (ct) => ct.loai === "VI_PHAM_NOI_QUY"
                  );
                  const tamUng = luong.chi_tiet_luong?.find(
                    (ct) => ct.loai === "TAM_UNG"
                  );
                  const truKhac = luong.chi_tiet_luong?.find(
                    (ct) => ct.loai === "TRU_KHAC"
                  );

                  const thuongNong = luong.chi_tiet_luong?.find(
                    (ct) => ct.loai === "NONG"
                  );
                  const thuongLe = luong.chi_tiet_luong?.find(
                    (ct) => ct.loai === "LE"
                  );
                  // const thuongKhac = luong.chi_tiet_luong?.find(
                  //   (ct) => ct.loai === "THUONGKHAC"
                  // );
                  const thuongKhacList = luong.chi_tiet_luong?.filter(
                    (ct) => ct.loai === "THUONGKHAC"
                  ) || [];

                  return (
                    <tr key={luong.id}>
                      <td
                        style={{
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          minWidth: "50px",
                          background: "#fff",
                          textAlign: "center",
                        }}
                      >
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Popover className="bg-primary-subtle text-white">
                              <Popover.Body as="h5">
                                <small>{luong?.ghi_chu || ""}</small>
                              </Popover.Body>
                            </Popover>
                          }
                        >
                          <h3>
                            {luong.ghi_chu === "Nghỉ thai sản" ? "🤰" : ""}
                          </h3>
                        </OverlayTrigger>
                      </td>

                      <td
                        style={{
                          position: "sticky",
                          left: "49px",
                          zIndex: 2,
                          minWidth: "180px",
                          background: "#fff",
                          fontWeight: 500,
                        }}
                      >
                        {nv?.ho_ten || "Không rõ"}
                      </td>
                      <td
                        style={{
                          position: "sticky",
                          left: "228px", // 50px + 180px
                          zIndex: 2,
                          minWidth: "120px",
                          background: "#fff",
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
                                      <div><strong>{tk.ghi_chu || "Thưởng khác"}</strong></div>
                                      <div>Số tiền: {formatCurrency(tk.so_tien)}</div>
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
                                  thuongKhacList.reduce((sum, tk) => sum + (tk.so_tien || 0), 0)
                                )
                              : formatCurrency(0)
                            }
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

                      <OverlayTrigger
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
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Xoá dòng lương này</Tooltip>}
                        >
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteLuong(luong.id)}
                          >
                            Xoá
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {/* Phân trang giữ nguyên kiểu cũ */}
          <Row className="justify-content-center mt-3">
            <Col xs="auto" className="text-center">
              <div className="d-flex align-items-center gap-3">
                <Button
                  variant="outline-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← Trước
                </Button>
                <span className="fw-semibold">
                  Trang {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline-secondary"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Sau →
                </Button>
              </div>
            </Col>
          </Row>
          {/* Modal tính lương */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
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
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default QuanLyLuong;
