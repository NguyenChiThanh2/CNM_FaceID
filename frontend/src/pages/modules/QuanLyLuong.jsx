import React, { useEffect, useState, useMemo  } from "react";
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
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
import { exportBangLuongToExcel } from "../../utils/exportToExcel";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../src/components/Loading";
import { getNhanVienInfo } from "../../utils/auth"; // ✅ thêm
const API_URL = "http://127.0.0.1:5000/api";
const HR_DEPARTMENT_ID = 2; // ❗ đổi lại ID thật phòng Nhân sự trong DB

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

    // ✅ lấy user hiện tại & cờ phân quyền
  const currentUser = getNhanVienInfo(); // {id, ho_ten, phong_ban_id, ...}
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  useEffect(() => {
    return () => {
      // Khi component unmount, xóa modal backdrop còn sót
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((bd) => bd.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = ""; // khôi phục scroll
    };
  }, []);

  useEffect(() => {
    // if (hasFetched.current) return; // Nếu đã gọi rồi -> bỏ qua
    // hasFetched.current = true;
    fetchLuong();
    fetchNhanVien();
    fetchPhongBan();
  }, []);

   useEffect(() => {
    if (!showModal) {
      const today = new Date();
      setFormData({
        nhan_vien_id: isHR ? "" : currentUser?.id || "", // 🟢 non-HR mặc định là chính mình
        thang: today.getMonth() + 1,
        nam: today.getFullYear(),
      });
      setIsTinhTatCa(false); // 🟢 non-HR không được bật tính tất cả
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
    if (!isHR) return; // 🚫 chặn non-HR
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
    // 🛡️ non-HR không được tính tất cả và chỉ được tính cho chính họ
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
        // if (response.data.data) {
        //   toast.success("Đã tính lương cho tất cả nhân viên.");
        //   setShowModal(false);
        //   fetchLuong();
        // }
        const { data, errors } = response.data.data;
        if (errors && errors.length > 0) {
          errors.forEach((msg, i) =>
            toast.warning(msg, { autoClose: 2500, delay: i * 500 })
          ); // hiển thị cảnh báo từng nhân viên
        }
        if (data && data.length > 0) {
          toast.success("Đã tính lương cho tất cả nhân viên.");
        }
        setShowModal(false);
        fetchLuong();
      } catch (error) {
        toast.error("Lỗi khi tính lương cho tất cả nhân viên.", error);
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

  // const nhanVienMap = nhanVienList.reduce((acc, nv) => {
  //   acc[nv.id] = nv.ho_ten.toLowerCase();
  //   return acc;
  // }, {});
  // Map tên NV (đủ cho HR; non-HR chỉ cần chính họ)
  const nhanVienMap = useMemo(() => {
    return nhanVienList.reduce((acc, nv) => {
      acc[nv.id] = (nv.ho_ten || "").toLowerCase();
      return acc;
    }, {});
  }, [nhanVienList]);
   // 🧹 Lọc theo quyền + keyword + tháng-năm
  const filteredList = useMemo(() => {
    return luongList
      .filter((luong) => {
        // 1) PHÂN QUYỀN: non-HR chỉ xem được lương của chính mình
        if (!isHR && currentUser?.id && luong.nhan_vien_id !== currentUser.id) {
          return false;
        }
        // 2) Tìm theo tên (trên toàn dsNV)
        const hoTen = nhanVienMap[luong.nhan_vien_id] || "";
        const searchMatch = hoTen.includes((searchKeyword || "").toLowerCase());
        // 3) Lọc theo tháng-năm
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
  // const filteredList = luongList
  //   .filter((luong) => {
  //     const hoTen = nhanVienMap[luong.nhan_vien_id] || "";
  //     const searchMatch = hoTen.includes(searchKeyword.toLowerCase());
  //     const monthMatch =
  //       selectedMonthNumber && selectedYear
  //         ? luong.thang === parseInt(selectedMonthNumber) &&
  //           luong.nam === parseInt(selectedYear)
  //         : true;
  //     return searchMatch && monthMatch;
  //   })
  //   .sort((a, b) => b.id - a.id);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // const exportToExcel = () => {
  //   if (filteredList.length === 0) {
  //     toast.warning("Không có dữ liệu để xuất!");
  //     return;
  //   }

  //   const dataToExport = filteredList.map((luong, index) => {
  //     const nv = nhanVienList.find((nv) => nv.id === luong.nhan_vien_id);
  //     return {
  //       STT: index + 1,
  //       "Ghi chú": luong.ghi_chu || "",
  //       "Nhân viên": nv?.ho_ten || "Không rõ",
  //       Tháng: `${luong.thang}/${luong.nam}`,

  //       "Ngày công chuẩn": luong.ngay_cong_chuan,
  //       "Số ngày công": luong.so_ngay_cong,
  //       "Ngày phép": luong?.ngay_phep || 0,
  //       "Trừ nghỉ không phép": luong?.tru_nghi_khong_phep || 0,
  //       "Ngày làm lễ": luong?.ngay_lam_le || 0,
  //       "Tiền làm lễ": luong?.tien_lam_le || 0,

  //       "Phụ cấp ăn trưa": luong?.phu_cap_an_trua || 0,
  //       "Phụ cấp xăng, xe": luong?.phu_cap_xang_xe || 0,
  //       "Phụ cấp độc hại": luong?.phu_cap_doc_hai || 0,
  //       "Phụ cấp trách nhiệm": luong?.phu_cap_trach_nhiem || 0,
  //       "Phụ cấp chức vụ": luong?.phu_cap_chuc_vu || 0,
  //       "Phụ cấp thâm niên": luong?.phu_cap_tham_nien || 0,
  //       "Phụ cấp khác": luong?.phu_cap_khac || 0,
  //       "Tổng phụ cấp": luong.tong_phu_cap,

  //       "Thưởng nóng": luong?.thuong_nong || 0,
  //       "Thưởng lễ": luong?.thuong_le || 0,
  //       "Thưởng khác": luong?.thuong_khac || 0,
  //       "Tổng thưởng": luong.tong_thuong,

  //       "Tổng lương": luong.tong_luong,

  //       "Trừ đi trễ, về sớm": luong?.tru_di_tre_ve_som || 0,
  //       "Trừ vi phạm": luong?.tru_vi_pham || 0,
  //       "Trừ tạm ứng": luong?.tru_tam_ung || 0,
  //       "Trừ khác": luong?.tru_khac || 0,
  //       "Tổng khấu trừ": luong.tong_khau_tru,

  //       BHXH: luong.bhxh,
  //       BHTN: luong.bhtn,
  //       BHYT: luong.bhyt,
  //       "Thuế TNCN": luong.thue_tncn,

  //       "Thực nhận": luong.thuc_nhan,
  //     };
  //   });

  //   const worksheet = XLSX.utils.json_to_sheet(dataToExport, { origin: "A3" });

  //   // Thêm tiêu đề chính
  //   const title = [["BẢNG LƯƠNG NHÂN VIÊN"]];
  //   const subTitle = [
  //     [`Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`],
  //   ];
  //   XLSX.utils.sheet_add_aoa(worksheet, title, { origin: "A1" });
  //   XLSX.utils.sheet_add_aoa(worksheet, subTitle, { origin: "A2" });

  //   // Merge tiêu đề
  //   const totalCols = Object.keys(dataToExport[0]).length;
  //   worksheet["!merges"] = [
  //     { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
  //     { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
  //   ];

  //   // Tự điều chỉnh độ rộng cột
  //   worksheet["!cols"] = Object.keys(dataToExport[0]).map((key) => ({
  //     wch: Math.max(
  //       key.length + 2,
  //       ...dataToExport.map((r) => (r[key] ? r[key].toString().length + 2 : 10))
  //     ),
  //   }));

  //   // Tạo workbook và style
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng Lương");

  //   // Style (cần plugin xlsx-style hoặc sheetjs Pro để áp dụng hoàn toàn)
  //   const titleCell = worksheet["A1"];
  //   if (titleCell) {
  //     titleCell.s = {
  //       font: { bold: true, sz: 16, color: { rgb: "1F497D" } },
  //       alignment: { horizontal: "center", vertical: "center" },
  //     };
  //   }

  //   const headerRowIndex = 2;
  //   for (let c = 0; c < totalCols; c++) {
  //     const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
  //     const cell = worksheet[cellAddress];
  //     if (cell) {
  //       cell.s = {
  //         font: { bold: true, color: { rgb: "FFFFFF" } },
  //         fill: { fgColor: { rgb: "4F81BD" } },
  //         alignment: { horizontal: "center", vertical: "center" },
  //         border: {
  //           top: { style: "thin", color: { rgb: "999999" } },
  //           bottom: { style: "thin", color: { rgb: "999999" } },
  //           left: { style: "thin", color: { rgb: "999999" } },
  //           right: { style: "thin", color: { rgb: "999999" } },
  //         },
  //       };
  //     }
  //   }

  //   const excelBuffer = XLSX.write(workbook, {
  //     bookType: "xlsx",
  //     type: "array",
  //     cellStyles: true,
  //   });

  //   const blob = new Blob([excelBuffer], {
  //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   });

  //   saveAs(
  //     blob,
  //     `BangLuong_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`
  //   );
  //   toast.success("Xuất file Excel thành công!");
  // };

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
                onClick={() =>
                  exportBangLuongToExcel(filteredList, nhanVienList)
                }
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
                  <th>Ngày làm cuối tuần</th>
                  <th>Tiền làm cuối tuần</th>

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
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : paginatedList.length > 0 ? (
                  paginatedList.map((luong) => {
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
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center text-muted">
                      Không có bảng lương
                    </td>
                  </tr>
                )}
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
          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            backdrop="static"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {isTinhTatCa
                  ? "Tính lương cho tất cả nhân viên"
                  : "Tính lương cho 1 nhân viên"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label className="form-label">Tháng</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.thang}
                  onChange={(e) =>
                    setFormData({ ...formData, thang: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Năm</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.nam}
                  onChange={(e) =>
                    setFormData({ ...formData, nam: e.target.value })
                  }
                />
              </div>

              {/* Nếu là tính lương tất cả → hiển thị select phòng ban */}
              {isTinhTatCa && (
                <div className="mb-3">
                  <label className="form-label">
                    Chọn phòng ban (tuỳ chọn)
                  </label>
                  <select
                    className="form-control"
                    value={selectedPhongBan}
                    onChange={(e) => setSelectedPhongBan(e.target.value)}
                  >
                    <option value="">Tất cả phòng ban</option>
                    {phongBanList.map((pb) => (
                      <option key={pb.id} value={pb.id}>
                        {pb.ten_phong_ban}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nếu là tính 1 nhân viên */}
              {!isTinhTatCa && (
                <div className="mb-3">
                  <label className="form-label">Chọn nhân viên</label>
                  <select
                    className="form-control"
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
                  </select>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Đóng
              </Button>
              <Button variant="primary" onClick={handleSubmitLuong}>
                Xác nhận
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default QuanLyLuong;
