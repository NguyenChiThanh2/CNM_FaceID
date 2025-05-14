// src/components/QuanLyLuong.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { OverlayTrigger, Tooltip , Breadcrumb } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    thang: "",
    nam: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
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
      const response = await axios.get(`${API_URL}/get-all-luong`);
      setLuongList(response.data);
    } catch (error) {
      toast.error("Không thể tải dữ liệu lương!");
    }
  };

  const fetchNhanVien = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách nhân viên!");
    }
  };

  const handleDeleteLuong = async (luongId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá dòng lương này?")) return;

    try {
      await axios.delete(`${API_URL}/delete-luong/${luongId}`);
      toast.success("Xoá lương thành công!");
      fetchLuong();
    } catch (error) {
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
        const response = await axios.post(`${API_URL}/tinh-luong`, {
          nhan_vien_id: parseInt(nhan_vien_id),
          thang: parseInt(thang),
          nam: parseInt(nam),
        });

        if (response.data.luong) {
          toast.success("Tính lương thành công!");
          setShowModal(false);
          fetchLuong();
        } else {
          toast.error("Không thể tính lương.");
        }
      } catch (error) {
        toast.error("Lỗi khi tính lương!");
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
          ? String(luong.thang) === `${selectedYear}-${selectedMonthNumber}`
          : true;
      return searchMatch && monthMatch;
    })
    .sort((a, b) => String(b.thang).localeCompare(String(a.thang)));

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
        "Tháng": luong.thang,
        "Số ngày công": luong.so_ngay_cong,
        "Lương cơ bản": luong.luong_co_ban,
        "Phụ cấp": luong.phu_cap,
        "Khấu trừ": luong.khau_tru,
        "Tổng lương": luong.tong_luong,
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

  return (
    <div className="container min-vh-100">
      <div className="row">
        <div className="col-12 mt-5">
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Quản lý lương</Breadcrumb.Item>
          </Breadcrumb>
          <Button variant="secondary" onClick={() => navigate("/")}>← Trang chủ</Button>


          <h2 className="mb-4 text-center">Quản lý lương</h2>

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
                  const month = String(i + 1).padStart(2, "0");
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
                overlay={<Tooltip>Tính lương cho 1 nhân viên </Tooltip>}
              >
                <Button
                  variant="outline-success"
                  className="w-100"
                  onClick={() => {
                    setShowModal(true);
                  }}
                >
                  Tính lương cho 1 nhân viên
                </Button>
              </OverlayTrigger>
            </div>
            <div className="col-md-4 mb-2">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Tính lương toàn bộ nhân viên </Tooltip>}
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
              <Button variant="outline-success" className="w-100 w-md-auto" onClick={exportToExcel}>
                Xuất Excel
              </Button>
            </div>

          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Nhân viên</th>
                  <th>Tháng</th>
                  <th>Số ngày công</th>
                  <th>Lương cơ bản</th>
                  <th>Phụ cấp</th>
                  <th>Khấu trừ</th>
                  <th>Tổng lương</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((luong) => {
                  const nv = nhanVienList.find((nv) => nv.id === luong.nhan_vien_id);
                  return (
                    <tr key={luong.id}>
                      <td>{nv?.ho_ten || "Không rõ"}</td>
                      <td>{luong.thang}</td>
                      <td>{luong.so_ngay_cong}</td>
                      <td>{formatCurrency(luong.luong_co_ban)}</td>
                      <td>{formatCurrency(luong.phu_cap)}</td>
                      <td>{formatCurrency(luong.khau_tru)}</td>
                      <td>{formatCurrency(luong.tong_luong)}</td>
                      <td>
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>Xoá dòng lương này</Tooltip>}
                        >
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteLuong(luong.id)}
                          >
                            Xoá
                          </button>
                        </OverlayTrigger>

                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav className="mt-3">
            <ul className="pagination justify-content-center">
              {[...Array(totalPages).keys()].map((i) => (
                <li
                  key={i}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  <button className="page-link">{i + 1}</button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Modal tính lương */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isTinhTatCa ? "Tính lương tất cả nhân viên" : "Tính lương nhân viên"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {!isTinhTatCa && (
                <div className="form-group mb-2">
                  <label>Nhân viên</label>
                  <select
                    className="form-control"
                    value={formData.nhan_vien_id}
                    onChange={(e) => setFormData({ ...formData, nhan_vien_id: e.target.value })}
                  >
                    <option value="">-- Chọn --</option>
                    {nhanVienList.map((nv) => (
                      <option key={nv.id} value={nv.id}>
                        {nv.ho_ten}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group mb-2">
                <label>Tháng</label>
                <select
                  className="form-control"
                  value={formData.thang}
                  onChange={(e) => setFormData({ ...formData, thang: e.target.value })}
                >
                  <option value="">-- Chọn tháng --</option>
                  {[...Array(12).keys()].map((i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-2">
                <label>Năm</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.nam}
                  onChange={(e) => setFormData({ ...formData, nam: e.target.value })}
                  placeholder="VD: 2025"
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Huỷ
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitLuong}
                disabled={!isTinhTatCa && !formData.nhan_vien_id}
              >
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
