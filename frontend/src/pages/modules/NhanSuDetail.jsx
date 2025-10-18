import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaUser, FaBirthdayCake, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaRegCheckCircle, FaGift } from "react-icons/fa";
import { Button, Modal, Breadcrumb, Spinner, Alert } from "react-bootstrap";
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

const BASE_URL = "http://127.0.0.1:5000";
const nz = (v, d = "—") => (v === null || v === undefined ? d : v);

export default function NhanSuDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getNhanVienInfo();
  const HR_DEPARTMENT_ID = 2;
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nhanSu, setNhanSu] = useState(null);
  const [chucVu, setChucVu] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [hopDong, setHopDong] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showHDModal, setShowHDModal] = useState(null); // null | "edit" | "new"
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
  const openEdit = (hd) => {
    setEditingHopDong({ ...hd }); // clone để tránh reference cũ
    setShowModal(true);
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
    try {
      setSavingHD(true);
      if (showHDModal === "edit" && hopDong?.id) await updateHopDong(hopDong.id, payload);
      else await createHopDongForNhanVien(Number(id), payload);
      const fresh = await getHopDongByNhanVienId(Number(id));
      setHopDong(fresh || null);
      setShowHDModal(null);
    } catch (e) {
      console.error(e); alert(e?.userMessage || "Lưu hợp đồng thất bại.");
    } finally { setSavingHD(false); }
  };

  const avatarUrl = useMemo(() => nhanSu?.avatar ? `${BASE_URL}/api/images/${nhanSu.avatar}` : "https://via.placeholder.com/120", [nhanSu]);

  const excelRow = useMemo(() => {
    if (!nhanSu) return null;
    const phucLoiText = (Array.isArray(phucLoiList) ? phucLoiList : [])
      .map((i) => `${i.ten_phuc_loi}: ${i.gia_tri != null ? i.gia_tri : (i.mo_ta ?? "")}`).join(", ");
    return [{
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
  }, [nhanSu, chucVu, phongBan, phucLoiList]);

  const exportToExcel = useCallback(() => {
    if (!excelRow || !nhanSu) return;
    setShowModal(false); setExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(excelRow);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NhanSu");
      XLSX.writeFile(wb, `NhanSu_${nz(nhanSu.ho_ten, "NoName")}.xlsx`);
    } catch (e) { console.error(e); alert("Xuất Excel thất bại."); }
    finally { setExporting(false); }
  }, [excelRow, nhanSu]);

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
    } catch (e) { console.error(e); alert("Xuất Word thất bại."); }
    finally { setExporting(false); }
  }, [nhanSu, chucVu, phongBan, phucLoiList]);

  // In và PDF
  const printA4 = () => window.print();
  const exportA4ToPDF = async () => {
    const src = contractRef.current; if (!src) return;
    const paper = src.cloneNode(true);
    const cs = getComputedStyle(src);
    Object.assign(paper.style, {
      position: "fixed", left: "0", top: "0", width: cs.width, minHeight: cs.minHeight, margin: "0",
      boxShadow: "none", background: "#fff", transform: "none", zIndex: "2147483647"
    });
    document.body.appendChild(paper);
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      await pdf.html(paper, {
        x: 0, y: 0, margin: [0, 0, 0, 0], autoPaging: "text",
        html2canvas: {
          scale: 2, backgroundColor: "#ffffff", useCORS: true, allowTaint: true, scrollX: 0, scrollY: 0,
          windowWidth: paper.scrollWidth, windowHeight: paper.scrollHeight
        },
        callback: () => pdf.save(`HopDong_${nz(nhanSu?.ho_ten, "NhanSu")}.pdf`)
      });
    } catch (err) { console.error(err); alert("Xuất PDF lỗi. Bạn có thể dùng In → Save as PDF."); }
    finally { document.body.removeChild(paper); }
  };

  if (loading) return (<div className="container my-5 text-center"><Spinner animation="border" role="status" className="me-2" />Đang tải dữ liệu...</div>);
  if (error) return (<div className="container my-5"><Alert variant="danger" className="mb-3">{error}</Alert><Button onClick={() => navigate(-1)} variant="outline-primary">← Quay lại</Button></div>);
  if (!nhanSu) return (<div className="container my-5"><Alert variant="warning">Không tìm thấy nhân sự.</Alert><Button onClick={() => navigate(-1)} variant="outline-primary">← Quay lại</Button></div>);

  return (
    <div className="container my-5">
      <button onClick={() => navigate(-1)} className="btn btn-outline-primary mb-4">← Quay lại</button>

      <Breadcrumb className="mt-3">
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/nhan-su")}>Quản lý nhân sự</Breadcrumb.Item>
        <Breadcrumb.Item active>Chi tiết nhân sự</Breadcrumb.Item>
      </Breadcrumb>

      {/* Thông tin nhân sự */}
      <div className="card border-0 shadow-sm p-4" ref={printRef}>
        <div className="row">
          <div className="col-lg-3 text-center">
            <img src={avatarUrl} className="rounded-circle mb-3" alt="avatar"
              style={{ width: 120, height: 120, objectFit: "cover" }}
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/120")} />
            <h5 className="mb-1">{nz(nhanSu.ho_ten)}</h5>
            <p className="text-muted mb-0">
              {nz(chucVu, "—")}{chucVu && phongBan ? " - " : ""}{nz(phongBan, "—")}
            </p>
          </div>
          <div className="col-lg-9">
            <h5>Thông tin chi tiết</h5>
            <div className="row">
              <div className="col-md-6">
                <p><FaUser /> Giới tính: {nz(nhanSu.gioi_tinh)}</p>
                <p><FaBirthdayCake /> Ngày sinh: {fmtDate(nhanSu.ngay_sinh)}</p>
                <p><FaEnvelope /> Email: {nz(nhanSu.email)}</p>
                <p><FaGift /> Số ngày phép còn lại: {nz(nhanSu.so_ngay_phep_con_lai, 0)} ngày</p>
              </div>
              <div className="col-md-6">
                <p><FaPhoneAlt /> SĐT: {nz(nhanSu.so_dien_thoai)}</p>
                <p><FaMapMarkerAlt /> Địa chỉ: {nz(nhanSu.dia_chi)}</p>
                <p><FaRegCheckCircle /> Trạng thái: {nz(nhanSu.trang_thai)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phúc lợi */}
        <div className="mt-4">
          <h6><FaGift /> Phúc lợi</h6>
          {Array.isArray(phucLoiList) && phucLoiList.length > 0 ? (
            <ul className="list-group">
              {phucLoiList.map((item, idx) => (
                <li key={item?.id ?? `${item.ten_phuc_loi}-${idx}`} className="list-group-item">
                  <strong>{item.ten_phuc_loi}:</strong> {item.mo_ta ? `${item.mo_ta} - ` : ""}{item.gia_tri != null ? item.gia_tri : "—"}
                </li>
              ))}
            </ul>
          ) : <p>Chưa có phúc lợi.</p>}
        </div>

        {/* Hợp đồng */}
        <div className="mt-4" data-noexport="true">
          <h6>📄 Hợp đồng lao động</h6>
          <div className="d-flex gap-2">
            {isHR ? (
              hopDong ? (
                <>
                  <Button size="sm" variant="outline-warning" onClick={openEditHD}>
                    ✏️ Sửa hợp đồng hiện tại
                  </Button>
                  <Button size="sm" variant="outline-success" onClick={openCreateHD}>
                    📝 Ký hợp đồng mới
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline-success" onClick={openCreateHD}>
                  ➕ Thêm hợp đồng
                </Button>
              )
            ) : (
              <p className="text-muted fst-italic">🔒 Chỉ phòng nhân sự được phép chỉnh sửa hợp đồng.</p>
            )}

          </div>

          {hopDong ? (
            <div className="card border-0 shadow-sm p-3">
              {/* … các field hiển thị hopDong như trước … */}
              {/* (giữ nguyên block chi tiết hợp đồng hiện tại của bạn) */}
            </div>
          ) : <p>Chưa có hợp đồng lao động.</p>}
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end mt-4 gap-2" data-noexport="true">
          <Button variant="outline-secondary" onClick={() => setShowA4(true)}>Xem hợp đồng (A4)</Button>
          <Button variant="outline-success" onClick={exportA4ToPDF}>Lưu PDF (A4)</Button>
          {/* <Button variant="outline-primary" onClick={() => setShowModal(true)} disabled={exporting}>
            {exporting ? "Đang xuất..." : "Xuất Excel/Word"}
          </Button> */}
        </div>

        {/* Modal xuất Excel/Word */}
        {/* <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Xuất dữ liệu</Modal.Title></Modal.Header>
          <Modal.Body>
            <Button className="w-100 mb-2" onClick={exportToExcel} variant="outline-success" disabled={exporting}>Xuất Excel (tóm tắt)</Button>
            <Button className="w-100" onClick={exportToWord} variant="outline-danger" disabled={exporting}>Xuất Word (tóm tắt)</Button>
          </Modal.Body>
        </Modal> */}
      </div>

      {/* Modal A4 tách riêng */}
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
      {/* Lịch sử mức lương */}
      <SalaryHistory nhanVienId={id} refreshKey={refreshKey} />
      {/* Modal form hợp đồng */}
      <HopDongFormModal
        show={!!showHDModal}
        onHide={() => setShowHDModal(null)}
        initial={showHDModal === "edit" ? hopDong : null}
        nhanVienId={Number(id)}                 //  TRUYỀN ID NHÂN VIÊN
        onUpdated={handleHopDongUpdated}
      />

    </div>
  );
}
