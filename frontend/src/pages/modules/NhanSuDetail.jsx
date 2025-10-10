import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBirthdayCake,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaRegCheckCircle,
  FaGift,
} from "react-icons/fa";
import { getChucVuById } from "../../services/chucVuApi";
import { getPhongBanById } from "../../services/phongBanApi";
import { getPhucLoiByNhanVienId } from "../../services/phucLoiApi";
import { getHopDongByNhanVienId } from "../../services/hopDongLaoDongAPI";
import { Button, Modal, Breadcrumb, Spinner, Alert } from "react-bootstrap";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { fmtVND, fmtDate } from "../../utils/format";

const BASE_URL = "http://127.0.0.1:5000";

const NhanSuDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nhanSu, setNhanSu] = useState(null);
  const [chucVu, setChucVu] = useState("");
  const [phongBan, setPhongBan] = useState("");
  const [phucLoiList, setPhucLoiList] = useState([]);
  const [hopDong, setHopDong] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    let abort = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/get-nhan-vien-by-id/${id}`,
          { signal: abort.signal }
        );
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
          console.error("❌ Lỗi khi tải dữ liệu:", err);
          setError("Không thể tải dữ liệu nhân sự. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      abort.abort();
    };
  }, [id]);

  const avatarUrl = useMemo(() => {
    if (!nhanSu?.avatar) return "https://via.placeholder.com/120";
    return `${BASE_URL}/api/images/${nhanSu.avatar}`;
  }, [nhanSu]);

  const excelRow = useMemo(() => {
    if (!nhanSu) return null;
    return [
      {
        "Tên": nhanSu.ho_ten ?? "—",
        "Chức vụ": chucVu || "—",
        "Phòng ban": phongBan || "—",
        "Giới tính": nhanSu.gioi_tinh ?? "—",
        "Ngày sinh": fmtDate(nhanSu.ngay_sinh),
        "Email": nhanSu.email ?? "—",
        "Điện thoại": nhanSu.so_dien_thoai ?? "—",
        "Địa chỉ": nhanSu.dia_chi ?? "—",
        "Trạng thái": nhanSu.trang_thai ?? "—",
        "Phúc lợi": (phucLoiList || [])
          .map((i) => `${i.ten_phuc_loi}: ${i.gia_tri ?? i.mo_ta ?? ""}`)
          .join(", "),
        "Số ngày phép còn lại": nhanSu.so_ngay_phep_con_lai ?? 0,
      },
    ];
  }, [nhanSu, chucVu, phongBan, phucLoiList]);

  const exportToPDF = useCallback(async () => {
    if (!printRef.current || !nhanSu) return;
    setShowModal(false);
    setExporting(true);
    try {
      // Đợi DOM ổn định frame tiếp theo
      await new Promise((r) => requestAnimationFrame(r));

      const node = printRef.current;
      // Scale 2x để ảnh sắc nét hơn
      const scale = 2;
      const style = {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        width: `${node.offsetWidth}px`,
        height: `${node.offsetHeight}px`,
      };
      const param = {
        height: node.offsetHeight * scale,
        width: node.offsetWidth * scale,
        style,
        cacheBust: true,
        // Loại bỏ mọi node có data-noexport="true"
        filter: (node) => !(node?.dataset && node.dataset.noexport === "true"),
      };

      const dataUrl = await domtoimage.toPng(node, param);

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (imgProps.height * pdfW) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
      pdf.save(`NhanSu_${nhanSu.ho_ten}.pdf`);
    } catch (e) {
      console.error("Error generating PDF:", e);
      alert("Xuất PDF thất bại. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  }, [nhanSu]);

  const exportToExcel = useCallback(() => {
    if (!excelRow || !nhanSu) return;
    setShowModal(false);
    setExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(excelRow);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NhanSu");
      XLSX.writeFile(wb, `NhanSu_${nhanSu.ho_ten}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Xuất Excel thất bại.");
    } finally {
      setExporting(false);
    }
  }, [excelRow, nhanSu]);

  const exportToWord = useCallback(async () => {
    if (!nhanSu) return;
    setShowModal(false);
    setExporting(true);
    try {
      const children = [
        new Paragraph(`Thông tin nhân sự: ${nhanSu.ho_ten ?? "—"}`),
        new Paragraph(`Chức vụ: ${chucVu || "—"}`),
        new Paragraph(`Phòng ban: ${phongBan || "—"}`),
        new Paragraph(`Giới tính: ${nhanSu.gioi_tinh ?? "—"}`),
        new Paragraph(`Ngày sinh: ${fmtDate(nhanSu.ngay_sinh)}`),
        new Paragraph(`Email: ${nhanSu.email ?? "—"}`),
        new Paragraph(`Điện thoại: ${nhanSu.so_dien_thoai ?? "—"}`),
        new Paragraph(`Địa chỉ: ${nhanSu.dia_chi ?? "—"}`),
        new Paragraph(`Trạng thái: ${nhanSu.trang_thai ?? "—"}`),
        new Paragraph(`Số ngày phép còn lại: ${nhanSu.so_ngay_phep_con_lai ?? 0}`),
        new Paragraph(`Phúc lợi:`),
        ...(phucLoiList || []).map(
          (pl) =>
            new Paragraph(
              `${pl.ten_phuc_loi}: ${pl.mo_ta ? `${pl.mo_ta} - ` : ""}${pl.gia_tri ?? ""}`
            )
        ),
      ];

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `NhanSu_${nhanSu.ho_ten}.docx`);
    } catch (e) {
      console.error(e);
      alert("Xuất Word thất bại.");
    } finally {
      setExporting(false);
    }
  }, [nhanSu, chucVu, phongBan, phucLoiList, hopDong]);

  if (loading) {
    return (
      <div className="container my-5 text-center">
        <Spinner animation="border" role="status" className="me-2" />
        Đang tải dữ liệu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-5">
        <Alert variant="danger" className="mb-3">{error}</Alert>
        <Button onClick={() => navigate(-1)} variant="outline-primary">← Quay lại</Button>
      </div>
    );
  }

  if (!nhanSu) {
    return (
      <div className="container my-5">
        <Alert variant="warning">Không tìm thấy nhân sự.</Alert>
        <Button onClick={() => navigate(-1)} variant="outline-primary">← Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <button onClick={() => navigate(-1)} className="btn btn-outline-primary mb-4">
        ← Quay lại
      </button>

      <Breadcrumb className="mt-3">
        <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate("/nhan-su")}>Quản lý nhân sự</Breadcrumb.Item>
        <Breadcrumb.Item active>Chi tiết nhân sự</Breadcrumb.Item>
      </Breadcrumb>

      <div className="card border-0 shadow-sm p-4" ref={printRef}>
        <div className="row">
          <div className="col-lg-3 text-center">
            <img
              src={avatarUrl}
              className="rounded-circle mb-3"
              alt="avatar"
              style={{ width: 120, height: 120, objectFit: "cover" }}
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/120")}
            />
            <h5 className="mb-1">{nhanSu.ho_ten}</h5>
            <p className="text-muted mb-0">
              {chucVu || "—"}{chucVu && phongBan ? " - " : ""}{phongBan || "—"}
            </p>
          </div>

          <div className="col-lg-9">
            <h5>Thông tin chi tiết</h5>
            <div className="row">
              <div className="col-md-6">
                <p><FaUser /> Giới tính: {nhanSu.gioi_tinh ?? "—"}</p>
                <p><FaBirthdayCake /> Ngày sinh: {fmtDate(nhanSu.ngay_sinh)}</p>
                <p><FaEnvelope /> Email: {nhanSu.email ?? "—"}</p>
                <p><FaGift /> Số ngày phép còn lại: {nhanSu.so_ngay_phep_con_lai ?? 0} ngày</p>
              </div>
              <div className="col-md-6">
                <p><FaPhoneAlt /> SĐT: {nhanSu.so_dien_thoai ?? "—"}</p>
                <p><FaMapMarkerAlt /> Địa chỉ: {nhanSu.dia_chi ?? "—"}</p>
                <p><FaRegCheckCircle /> Trạng thái: {nhanSu.trang_thai ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h6><FaGift /> Phúc lợi</h6>
          {phucLoiList?.length > 0 ? (
            <ul className="list-group">
              {phucLoiList.map((item) => (
                <li key={item.id ?? `${item.ten_phuc_loi}-${item.gia_tri}`} className="list-group-item">
                  <strong>{item.ten_phuc_loi}:</strong>{" "}
                  {item.mo_ta ? `${item.mo_ta} - ` : ""}{item.gia_tri ?? "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Chưa có phúc lợi.</p>
          )}
        </div>

        <div className="mt-4" data-noexport="true">
          <h6>📄 Hợp đồng lao động</h6>
          {hopDong ? (
            <div className="card border-0 shadow-sm p-3">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Loại hợp đồng:</strong> {hopDong.loai_hop_dong ?? "—"}</p>
                  <p><strong>Ngày bắt đầu:</strong> {fmtDate(hopDong.ngay_bat_dau)}</p>
                  <p><strong>Ngày kết thúc:</strong> {fmtDate(hopDong.ngay_ket_thuc)}</p>
                  <p><strong>Trạng thái:</strong> {hopDong.trang_thai ? "Đang hiệu lực / Hiển thị" : "Ngừng hiệu lực"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Mức lương cơ bản:</strong> {fmtVND(hopDong.muc_luong_co_ban)}</p>
                  <p><strong>Phụ cấp ăn trưa:</strong> {fmtVND(hopDong.phu_cap_an_trua)}</p>
                  <p><strong>Phụ cấp xăng xe:</strong> {fmtVND(hopDong.phu_cap_xang_xe)}</p>
                  <p><strong>Phụ cấp chức vụ:</strong> {fmtVND(hopDong.phu_cap_chuc_vu)}</p>
                </div>
              </div>

              <hr />
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Phạt đi trễ (VNĐ/phút):</strong> {hopDong.di_tre_phat ?? "—"}</p>
                  <p><strong>Phạt về sớm (VNĐ/phút):</strong> {hopDong.ve_som_phat ?? "—"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Hệ số tăng ca:</strong> {hopDong.tang_ca_heso ?? "—"}</p>
                  <p><strong>Hệ số ngày lễ/cuối tuần:</strong> {(hopDong.luong_ngay_le_heso ?? "—") + " / " + (hopDong.luong_cuoi_tuan_heso ?? "—")}</p>
                </div>
              </div>
              {(Array.isArray(hopDong.dieu_khoan_khac) || (hopDong.dieu_khoan_khac && typeof hopDong.dieu_khoan_khac === "object")) && (
                <div data-noexport="true">
                  <hr />
                  <p className="mb-1"><strong>Điều khoản khác:</strong></p>
                  <pre className="bg-light p-2 rounded" style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(hopDong.dieu_khoan_khac, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p>Chưa có hợp đồng lao động.</p>
          )}
        </div>

        <div className="d-flex justify-content-end mt-4 gap-2"
          data-noexport="true">
          <Button
            variant="outline-primary"
            onClick={() => setShowModal(true)}
            disabled={exporting}
          >
            {exporting ? "Đang xuất..." : "Xuất dữ liệu"}
          </Button>
        </div>

        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Xuất dữ liệu</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button className="w-100 mb-2" onClick={exportToPDF} variant="outline-primary" disabled={exporting}>
              Xuất PDF
            </Button>
            <Button className="w-100 mb-2" onClick={exportToExcel} variant="outline-success" disabled={exporting}>
              Xuất Excel
            </Button>
            <Button className="w-100" onClick={exportToWord} variant="outline-danger" disabled={exporting}>
              Xuất Word
            </Button>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default NhanSuDetail;
