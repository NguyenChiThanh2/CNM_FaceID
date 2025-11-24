import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaUser, FaBirthdayCake, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, 
  FaRegCheckCircle, FaGift, FaHome, FaFileExport, FaFilePdf, 
  FaFileWord, FaFileExcel, FaPrint, FaPlus, FaEdit 
} from "react-icons/fa";
import { Button, Modal, Breadcrumb, Spinner, Alert, Card, Row, Col, Badge } from "react-bootstrap";
import {toast, ToastContainer } from "react-toastify";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { getChucVuById } from "../../services/chucVuApi";
import { getPhongBanById } from "../../services/phongBanApi";
import { getPhucLoiByNhanVienId } from "../../services/phucLoiApi";
import { getHopDongByNhanVienId, createHopDongForNhanVien, updateHopDong } from "../../services/hopDongLaoDongApi";
import { fmtVND, fmtDate } from "../../utils/format";
import { getNhanVienInfo } from "../../utils/auth";
import A4PreviewModal from "../../components/contracts/A4PreviewModal";
import HopDongFormModal from "../../components/contracts/HopDongFormModal";
import SalaryHistory from "../../components/contracts/SalaryHistory.jsx";
import Loading from "../../../src/components/Loading";

const BASE_URL = "http://127.0.0.1:5000";
const nz = (v, d = "—") => (v === null || v === undefined ? d : v);

export default function NhanSuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getNhanVienInfo();
  const HR_DEPARTMENT_ID = 2;
  const TRUONG_PHONG_ROLE_ID = 5;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;
  const canEditContract =
    currentUser?.phong_ban_id === HR_DEPARTMENT_ID &&
    Number(currentUser?.chuc_vu_id) === TRUONG_PHONG_ROLE_ID;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nhanSu, setNhanSu] = useState(null);
  const [chucVu, setChucVu] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [hopDong, setHopDong] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHDModal, setShowHDModal] = useState(null);
  const [savingHD, setSavingHD] = useState(false);
  const [showA4, setShowA4] = useState(false);

  const printRef = useRef(null);
  const contractRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleHopDongUpdated = async () => {
    const fresh = await getHopDongByNhanVienId(Number(id));
    setHopDong(fresh || null);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      setLoading(true); setError("");
      try {
        const { data } = await axios.get(`${BASE_URL}/api/get-nhan-vien-by-id/${id}`, { signal: abort.signal });
        setNhanSu(data);
        const [cv, pb, pl, hd] = await Promise.all([
          getChucVuById(data.chuc_vu_id),
          getPhongBanById(data.phong_ban_id),
          getPhucLoiByNhanVienId(id),
          getHopDongByNhanVienId(id),
        ]);
        setChucVu(cv?.ten_chuc_vu || "");
        setPhongBan(pb?.ten_phong_ban || "");
        setPhucLoiList(Array.isArray(pl) ? pl : []);
        setHopDong(hd || null);
      } catch (err) {
        if (err?.name !== "CanceledError") {
          console.error(err); setError("Không thể tải dữ liệu nhân sự. Vui lòng thử lại.");
        }
      } finally { setLoading(false); }
    })();
    return () => abort.abort();
  }, [id]);

  const openCreateHD = () => setShowHDModal("new");
  const openEditHD = async () => {
    try {
      const fresh = await getHopDongByNhanVienId(Number(id));
      setHopDong(fresh || null);
      setShowHDModal("edit");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitHD = async (payload) => {
    if (!canEditContract) {
      alert("Bạn không có quyền chỉnh sửa/ký hợp đồng. Yêu cầu Trưởng phòng Nhân sự.");
      return;
    }

    try {
      setSavingHD(true);
      if (showHDModal === "edit" && hopDong?.id) {
        await updateHopDong(hopDong.id, payload);
      } else {
        await createHopDongForNhanVien(Number(id), payload);
      }
      const fresh = await getHopDongByNhanVienId(Number(id));
      setHopDong(fresh || null);
      setShowHDModal(null);
    } catch (e) {
      console.error(e);
      alert(e?.userMessage || "Lưu hợp đồng thất bại.");
    } finally {
      setSavingHD(false);
    }
  };

  // Sửa lỗi 404 với ảnh avatar
  const avatarUrl = useMemo(() => {
    if (!nhanSu?.avatar) return "https://via.placeholder.com/120x120/667eea/ffffff?text=Avatar";
    
    // Kiểm tra xem avatar có phải là URL đầy đủ không
    if (nhanSu.avatar.startsWith('http')) {
      return nhanSu.avatar;
    }
    
    // Nếu là tên file, tạo URL đúng
    const avatarFile = nhanSu.avatar;
    return `${BASE_URL}/api/images/${avatarFile}`;
  }, [nhanSu]);

  // Hàm xử lý lỗi ảnh
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/120x120/667eea/ffffff?text=Avatar";
  };

  const exportToExcel = useCallback(() => {
    if (!nhanSu) return;
    setShowModal(false); setExporting(true);
    try {
      const phucLoiText = (Array.isArray(phucLoiList) ? phucLoiList : [])
        .map((i) => `${i.ten_phuc_loi}: ${i.gia_tri != null ? i.gia_tri : (i.mo_ta ?? "")}`).join(", ");
      
      const excelRow = [{
        "Tên": nz(nhanSu.ho_ten),
        "Chức vụ": nz(chucVu, "—"),
        "Phòng ban": nz(phongBan, "—"),
        "Giới tính": nz(nhanSu.gioi_tinh),
        "Ngày sinh": fmtDate(nhanSu.ngay_sinh),
        "Email": nz(nhanSu.email),
        "Điện thoại": nz(nhanSu.so_dien_thoai),
        "Địa chỉ": nz(nhanSu.dia_chi),
        "Trạng thái": nz(nhanSu.trang_thai),
        "Phúc lợi": phucLoiText,
        "Số ngày phép còn lại": nz(nhanSu.so_ngay_phep_con_lai, 0),
      }];

      const ws = XLSX.utils.json_to_sheet(excelRow);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NhanSu");
      XLSX.writeFile(wb, `NhanSu_${nz(nhanSu.ho_ten, "NoName")}.xlsx`);
    } catch (e) { 
      console.error(e); 
      alert("Xuất Excel thất bại."); 
    } finally { 
      setExporting(false); 
    }
  }, [nhanSu, chucVu, phongBan, phucLoiList]);

  const exportToWord = useCallback(async () => {
    if (!nhanSu) return;
    setShowModal(false); setExporting(true);
    try {
      const children = [
        new Paragraph(`Thông tin nhân sự: ${nz(nhanSu.ho_ten)}`),
        new Paragraph(`Chức vụ: ${nz(chucVu, "—")}`),
        new Paragraph(`Phòng ban: ${nz(phongBan, "—")}`),
        new Paragraph(`Giới tính: ${nz(nhanSu.gioi_tinh)}`),
        new Paragraph(`Ngày sinh: ${fmtDate(nhanSu.ngay_sinh)}`),
        new Paragraph(`Email: ${nz(nhanSu.email)}`),
        new Paragraph(`Điện thoại: ${nz(nhanSu.so_dien_thoai)}`),
        new Paragraph(`Địa chỉ: ${nz(nhanSu.dia_chi)}`),
        new Paragraph(`Trạng thái: ${nz(nhanSu.trang_thai)}`),
        new Paragraph(`Số ngày phép còn lại: ${nz(nhanSu.so_ngay_phep_con_lai, 0)}`),
        new Paragraph(`Phúc lợi:`),
        ...(phucLoiList || []).map((pl) => new Paragraph(`${pl.ten_phuc_loi}: ${pl.mo_ta ? `${pl.mo_ta} - ` : ""}${pl.gia_tri != null ? pl.gia_tri : ""}`)),
      ];
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `NhanSu_${nz(nhanSu.ho_ten, "NoName")}.docx`);
    } catch (e) { 
      console.error(e); 
      alert("Xuất Word thất bại."); 
    } finally { 
      setExporting(false); 
    }
  }, [nhanSu, chucVu, phongBan, phucLoiList]);

  const printA4 = () => {
    if (window.print) {
      window.print();
    } else {
      alert("Chức năng in không khả dụng trên trình duyệt này.");
    }
  };

  const exportA4ToPDF = async () => {
    const src = contractRef.current; 
    if (!src) {
      alert("Không tìm thấy nội dung hợp đồng để xuất PDF.");
      return;
    }
    
    setExporting(true);
    try {
      const paper = src.cloneNode(true);
      const cs = getComputedStyle(src);
      Object.assign(paper.style, {
        position: "fixed", 
        left: "0", 
        top: "0", 
        width: cs.width, 
        minHeight: cs.minHeight, 
        margin: "0",
        boxShadow: "none", 
        background: "#fff", 
        transform: "none", 
        zIndex: "2147483647"
      });
      document.body.appendChild(paper);
      
      const pdf = new jsPDF({ 
        unit: "pt", 
        format: "a4", 
        compress: true 
      });
      
      await pdf.html(paper, {
        x: 0, 
        y: 0, 
        margin: [0, 0, 0, 0], 
        autoPaging: "text",
        html2canvas: {
          scale: 2, 
          backgroundColor: "#ffffff", 
          useCORS: true, 
          allowTaint: true, 
          scrollX: 0, 
          scrollY: 0,
          windowWidth: paper.scrollWidth, 
          windowHeight: paper.scrollHeight
        },
        callback: () => {
          pdf.save(`HopDong_${nz(nhanSu?.ho_ten, "NhanSu")}.pdf`);
          document.body.removeChild(paper);
        }
      });
    } catch (err) { 
      console.error(err); 
      toast.danger("Xuất PDF lỗi. Bạn có thể dùng In → Save as PDF."); 
    } finally { 
      setExporting(false); 
    }
  };

   if (loading)
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );

  if (error) return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
      <Alert variant="danger" className="mb-3">{error}</Alert>
      <Button 
        onClick={() => navigate("/nhan-su")} 
        variant="outline-primary"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          color: "white"
        }}
      >
        ← Quay lại danh sách
      </Button>
    </div>
  );

  if (!nhanSu) return (
    <div className="p-4 ps-5" style={{ minHeight: "100vh" }}>
      <Alert variant="warning">Không tìm thấy nhân sự.</Alert>
      <Button 
        onClick={() => navigate("/nhan-su")} 
        variant="outline-primary"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          color: "white"
        }}
      >
        ← Quay lại danh sách
      </Button>
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
              <Breadcrumb.Item 
                active style={{ color: "white" }}
              >
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item 
                active style={{ color: "white" }}
              >
                Quản lý nhân sự
              </Breadcrumb.Item>
              <Breadcrumb.Item active style={{ color: "white" }}>
                Chi tiết nhân sự
              </Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">👤 Chi tiết Nhân sự</h1>
            <p className="mb-0 opacity-90">
              Thông tin chi tiết và hồ sơ nhân viên {nz(nhanSu.ho_ten)}
            </p>
          </div>
          <Button 
            variant="outline-light" 
            onClick={() => navigate("/nhan-su")}
            className="border-0"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)"
            }}
          >
            ← Quay lại
          </Button>
        </div>
      </div>

      {/* Main Information Card */}
      <Card className="shadow-sm border-0 rounded-4 mb-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}
        >
          📋 Thông tin Cá nhân
        </Card.Header>
        <Card.Body className="p-4">
          <Row>
            <Col lg={3} className="text-center">
              <img 
                src={avatarUrl} 
                className="rounded-circle mb-3 shadow" 
                alt="avatar"
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  objectFit: "cover",
                  border: "4px solid #f8f9fa"
                }}
                onError={handleImageError}
              />
              <h5 className="fw-bold mb-1">{nz(nhanSu.ho_ten)}</h5>
              <p className="text-muted mb-2">
                {nz(chucVu, "—")}{chucVu && phongBan ? " - " : ""}{nz(phongBan, "—")}
              </p>
              <Badge 
                bg={
                  nhanSu.trang_thai === "Đang làm việc" ? "success" :
                  nhanSu.trang_thai === "Nghỉ việc" ? "danger" : "warning"
                }
                className="fs-6"
              >
                {nz(nhanSu.trang_thai)}
              </Badge>
            </Col>
            <Col lg={9}>
              <Row className="g-3">
                <Col md={6}>
                  <div className="d-flex align-items-center mb-3 p-2 rounded-3 bg-light">
                    <FaUser className="text-primary me-3 fs-5" />
                    <div>
                      <small className="text-muted">Giới tính</small>
                      <div className="fw-semibold">{nz(nhanSu.gioi_tinh)}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-3 p-2 rounded-3 bg-light">
                    <FaBirthdayCake className="text-primary me-3 fs-5" />
                    <div>
                      <small className="text-muted">Ngày sinh</small>
                      <div className="fw-semibold">{fmtDate(nhanSu.ngay_sinh)}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-3 p-2 rounded-3 bg-light">
                    <FaEnvelope className="text-primary me-3 fs-5" />
                    <div>
                      <small className="text-muted">Email</small>
                      <div className="fw-semibold">{nz(nhanSu.email)}</div>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-3 p-2 rounded-3 bg-light">
                    <FaPhoneAlt className="text-primary me-3 fs-5" />
                    <div>
                      <small className="text-muted">Số điện thoại</small>
                      <div className="fw-semibold">{nz(nhanSu.so_dien_thoai)}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center mb-3 p-2 rounded-3 bg-light">
                    <FaMapMarkerAlt className="text-primary me-3 fs-5" />
                    <div>
                      <small className="text-muted">Địa chỉ</small>
                      <div className="fw-semibold">{nz(nhanSu.dia_chi)}</div>
                    </div>
                  </div>
              
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Phúc lợi */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Header 
              style={{
                background: "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                color: "white",
                fontWeight: "600"
              }}
            >
              <FaGift className="me-2" />
              Phúc lợi
            </Card.Header>
            <Card.Body>
              {Array.isArray(phucLoiList) && phucLoiList.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {phucLoiList.map((item, idx) => (
                    <div key={item?.id ?? `${item.ten_phuc_loi}-${idx}`} 
                         className="p-3 border rounded-3 bg-light">
                      <div className="fw-semibold text-primary">{item.ten_phuc_loi}</div>
                      {item.mo_ta && <div className="text-muted small">{item.mo_ta}</div>}
                      {item.gia_tri != null && (
                        <div className="fw-bold text-success mt-1">{item.gia_tri}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <FaGift className="fs-1 mb-2 opacity-50" />
                  <div>Chưa có phúc lợi</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Hợp đồng lao động */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Header 
              style={{
                background: "linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)",
                color: "white",
                fontWeight: "600"
              }}
            >
              📄 Hợp đồng lao động
            </Card.Header>
            <Card.Body>
              {canEditContract ? (
                <div className="d-flex gap-2 mb-3">
                  {hopDong ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline-warning" 
                        onClick={openEditHD}
                        disabled={exporting}
                      >
                        <FaEdit className="me-1" />
                        Sửa hợp đồng
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-success" 
                        onClick={openCreateHD}
                        disabled={exporting}
                      >
                        <FaPlus className="me-1" />
                        Hợp đồng mới
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline-success" 
                      onClick={openCreateHD}
                      disabled={exporting}
                    >
                      <FaPlus className="me-1" />
                      Thêm hợp đồng
                    </Button>
                  )}
                </div>
              ) : (
                <div className="alert alert-warning mb-3">
                  <small>🔒 Chỉ Trưởng phòng Nhân sự được phép chỉnh sửa hợp đồng.</small>
                </div>
              )}

              {hopDong ? (
                <div >
                  {/* <div className="row g-2 small">className="border rounded-3 p-3 bg-light"
                    <div className="col-6"><strong>Loại hợp đồng:</strong> {nz(hopDong.loai_hop_dong)}</div>
                    <div className="col-6"><strong>Ngày bắt đầu:</strong> {fmtDate(hopDong.ngay_bat_dau)}</div>
                    <div className="col-6"><strong>Ngày kết thúc:</strong> {fmtDate(hopDong.ngay_ket_thuc)}</div>
                    <div className="col-6"><strong>Lương cơ bản:</strong> {fmtVND(hopDong.luong_co_ban)}</div>
                    <div className="col-12"><strong>Vị trí công việc:</strong> {nz(hopDong.vi_tri_cong_viec)}</div>
                  </div> */}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <div className="fs-1 mb-2">📝</div>
                  <div>Chưa có hợp đồng lao động</div>
                </div>
              )}

              {hopDong && (
                <div className="d-flex gap-2 mt-3 flex-wrap">
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => setShowA4(true)}
                    disabled={exporting}
                  >
                    <FaFilePdf className="me-1" />
                    Xem hợp đồng
                  </Button>
                  {/* <Button 
                    variant="outline-success" 
                    size="sm" 
                    onClick={exportA4ToPDF}
                    disabled={exporting}
                  >
                    <FaFileExport className="me-1" />
                    Xuất PDF
                  </Button> */}
                  {/* <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={printA4}
                    disabled={exporting}
                  >
                    <FaPrint className="me-1" />
                    In
                  </Button> */}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Export Actions */}
      <Card className="shadow-sm border-0 rounded-4 mt-4">
        <Card.Header 
          style={{
            background: "linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)",
            color: "white",
            fontWeight: "600"
          }}
        >
          <FaFileExport className="me-2" />
          Xuất dữ liệu
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant="outline-success" 
              onClick={exportToExcel} 
              disabled={exporting}
            >
              <FaFileExcel className="me-2" />
              {exporting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={exportToWord} 
              disabled={exporting}
            >
              <FaFileWord className="me-2" />
              {exporting ? "Đang xuất..." : "Xuất Word"}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Lịch sử mức lương */}
      <div className="mt-4">
        <SalaryHistory nhanVienId={id} refreshKey={refreshKey} />
      </div>

      {/* Export Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="rounded-4">
        <Modal.Header 
          closeButton
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white"
          }}
        >
          <Modal.Title>Xuất dữ liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <div className="d-grid gap-2">
            <Button variant="outline-success" onClick={exportToExcel} disabled={exporting}>
              <FaFileExcel className="me-2" />
              Xuất Excel (tóm tắt)
            </Button>
            <Button variant="outline-primary" onClick={exportToWord} disabled={exporting}>
              <FaFileWord className="me-2" />
              Xuất Word (tóm tắt)
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal A4 Preview */}
      <A4PreviewModal
        show={showA4}
        onHide={() => setShowA4(false)}
        onPrint={printA4}
        onSavePDF={exportA4ToPDF}
        nhanSu={nhanSu}
        hopDong={hopDong}
        chucVu={chucVu}
        phongBan={phongBan}
        phucLoiList={phucLoiList}
        contractRef={contractRef}
      />

      {/* Modal form hợp đồng */}
      <HopDongFormModal
        show={!!showHDModal}
        onHide={() => setShowHDModal(null)}
        initial={showHDModal === "edit" ? hopDong : null}
        nhanVienId={Number(id)}
        onUpdated={handleHopDongUpdated}
      />
    </div>
  );
}