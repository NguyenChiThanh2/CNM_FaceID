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
import { getHopDongByNhanVienId, createHopDongForNhanVien, updateHopDong } from "../../services/hopDongLaoDongAPI";
import { Button, Modal, Breadcrumb, Spinner, Alert } from "react-bootstrap";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph } from "docx";
import { saveAs } from "file-saver";
import { fmtVND, fmtDate } from "../../utils/format";
import { getNhanVienInfo } from "../../utils/auth";

const BASE_URL = "http://127.0.0.1:5000";

const NhanSuDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getNhanVienInfo();
  const HR_DEPARTMENT_ID = 2; // ID thật trong DB (bạn có thể sửa)
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

  const printRef = useRef(null);
  const [showHDModal, setShowHDModal] = useState(null); // null | "edit" | "new"

  const [savingHD, setSavingHD] = useState(false);
  const isEditingHD = !!hopDong; // có HĐ -> sửa; chưa có -> thêm mới

  const openCreateHD = () => setShowHDModal("new");   // thêm mới
  const openEditHD = () => setShowHDModal("edit");    // sửa hợp đồng hiện tại
  const closeHD = () => setShowHDModal(null);


  const handleSubmitHD = async (payload) => {
    try {
      setSavingHD(true);
      if (showHDModal === "edit" && hopDong?.id) {
        await updateHopDong(hopDong.id, payload); // sửa hợp đồng hiện tại
      } else {
        await createHopDongForNhanVien(Number(id), payload); // ký mới
      }
      const fresh = await getHopDongByNhanVienId(Number(id));
      setHopDong(fresh || null);
      setShowHDModal(null);
    } catch (e) {
      console.error(e);
      alert("Lưu hợp đồng thất bại.");
    } finally {
      setSavingHD(false);
    }
  };


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
          <div className="d-flex gap-2" data-noexport="true">
            {isHR ? (
              hopDong ? (
                <>
                  <Button size="sm" variant="outline-warning" onClick={openEditHD}>
                    ✏️ Sửa hợp đồng hiện tại
                  </Button>
                  <Button size="sm" variant="outline-success" onClick={() => setShowHDModal("new")}>
                    📝 Ký hợp đồng mới
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline-success" onClick={() => openCreateHD("new")}>
                  ➕ Thêm hợp đồng
                </Button>
              )
            ) : (
              <p className="text-muted fst-italic">🔒 Chỉ phòng nhân sự được phép chỉnh sửa hợp đồng.</p>
            )}
          </div>


          {hopDong ? (
            <div className="card border-0 shadow-sm p-3">
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Loại hợp đồng:</strong> {hopDong.loai_hop_dong ?? "—"}</p>
                  <p><strong>Ngày bắt đầu:</strong> {fmtDate(hopDong.ngay_bat_dau)}</p>
                  <p><strong>Ngày kết thúc:</strong> {fmtDate(hopDong.ngay_ket_thuc)}</p>
                  <p><strong>Phép năm:</strong> {hopDong.phep_nam ?? 0} ngày</p>
                  <p><strong>Trạng thái:</strong> {hopDong.trang_thai ? "Đang hiệu lực / Hiển thị" : "Ngừng hiệu lực"}</p>
                </div>
                <div className="col-md-6">
                  <p><strong>Mức lương cơ bản:</strong> {fmtVND(hopDong.muc_luong_co_ban)}</p>
                  <p><strong>Phụ cấp ăn trưa:</strong> {fmtVND(hopDong.phu_cap_an_trua)}</p>
                  <p><strong>Phụ cấp xăng xe:</strong> {fmtVND(hopDong.phu_cap_xang_xe)}</p>
                  <p><strong>Phụ cấp độc hại:</strong> {fmtVND(hopDong.phu_cap_doc_hai)}</p>
                  <p><strong>Phụ cấp trách nhiệm:</strong> {fmtVND(hopDong.phu_cap_trach_nhiem)}</p>
                  <p><strong>Phụ cấp chức vụ:</strong> {fmtVND(hopDong.phu_cap_chuc_vu)}</p>
                  <p><strong>Phụ cấp thâm niên:</strong> {fmtVND(hopDong.phu_cap_tham_nien)}</p>
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
                  <p><strong>Hệ số ngày lễ:</strong> {hopDong.luong_ngay_le_heso ?? "—"}</p>
                  <p><strong>Hệ số cuối tuần:</strong> {hopDong.luong_cuoi_tuan_heso ?? "—"}</p>
                </div>
              </div>

              <hr />
              {/* <div className="row">
                  <div className="col-md-6">
                    <p><strong>Ngày tạo:</strong> {fmtDate(hopDong.created_at)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Cập nhật gần nhất:</strong> {fmtDate(hopDong.updated_at)}</p>
                  </div>
                </div> */}

              {/* 
        🔒 Tạm ẩn phần điều khoản khác, giữ lại để dùng sau:
        {(Array.isArray(hopDong.dieu_khoan_khac) ||
          (hopDong.dieu_khoan_khac && typeof hopDong.dieu_khoan_khac === "object")) && (
          <div data-noexport="true">
            <hr />
            <p className="mb-1"><strong>Điều khoản khác:</strong></p>
            <pre
              className="bg-light p-2 rounded"
              style={{ whiteSpace: "pre-wrap", maxHeight: "300px", overflowY: "auto" }}
            >
              {JSON.stringify(hopDong.dieu_khoan_khac, null, 2)}
            </pre>
          </div>
        )}
        */}
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
        <HopDongFormModal
          show={!!showHDModal}
          mode={showHDModal} // "edit" hoặc "new"
          onHide={() => setShowHDModal(null)}
          initial={showHDModal === "edit" ? hopDong : null}
          onSubmit={handleSubmitHD}
          disabled={savingHD}
        />


      </div>
    </div>
  );
};
function HopDongFormModal({ show, onHide, initial, onSubmit, disabled }) {
  useEffect(() => {
    setForm({
      loai_hop_dong: initial?.loai_hop_dong || "",
      ngay_bat_dau: initial?.ngay_bat_dau?.slice(0, 10) || "",
      ngay_ket_thuc: initial?.ngay_ket_thuc?.slice(0, 10) || "",
      muc_luong_co_ban: initial?.muc_luong_co_ban ?? "",
      di_tre_phat: initial?.di_tre_phat ?? "",
      ve_som_phat: initial?.ve_som_phat ?? "",
      tang_ca_heso: initial?.tang_ca_heso ?? "",
      luong_ngay_le_heso: initial?.luong_ngay_le_heso ?? "",
      luong_cuoi_tuan_heso: initial?.luong_cuoi_tuan_heso ?? "",
      phu_cap_an_trua: initial?.phu_cap_an_trua ?? "",
      phu_cap_xang_xe: initial?.phu_cap_xang_xe ?? "",
      phu_cap_doc_hai: initial?.phu_cap_doc_hai ?? "",
      phu_cap_trach_nhiem: initial?.phu_cap_trach_nhiem ?? "",
      phu_cap_chuc_vu: initial?.phu_cap_chuc_vu ?? "",
      phu_cap_tham_nien: initial?.phu_cap_tham_nien ?? "",
      phep_nam: initial?.phep_nam ?? 0,
      trang_thai: initial?.trang_thai ?? true,
    });
  }, [initial, show]);

  const [form, setForm] = useState(() => ({
    loai_hop_dong: initial?.loai_hop_dong || "",
    ngay_bat_dau: initial?.ngay_bat_dau || "",
    ngay_ket_thuc: initial?.ngay_ket_thuc || "",
    muc_luong_co_ban: initial?.muc_luong_co_ban ?? "",
    di_tre_phat: initial?.di_tre_phat ?? "",
    ve_som_phat: initial?.ve_som_phat ?? "",
    tang_ca_heso: initial?.tang_ca_heso ?? "",
    luong_ngay_le_heso: initial?.luong_ngay_le_heso ?? "",
    luong_cuoi_tuan_heso: initial?.luong_cuoi_tuan_heso ?? "",
    phu_cap_an_trua: initial?.phu_cap_an_trua ?? "",
    phu_cap_xang_xe: initial?.phu_cap_xang_xe ?? "",
    phu_cap_doc_hai: initial?.phu_cap_doc_hai ?? "",
    phu_cap_trach_nhiem: initial?.phu_cap_trach_nhiem ?? "",
    phu_cap_chuc_vu: initial?.phu_cap_chuc_vu ?? "",
    phu_cap_tham_nien: initial?.phu_cap_tham_nien ?? "",
    phep_nam: initial?.phep_nam ?? 0,
    trang_thai: initial?.trang_thai ?? true,
    dieu_khoan_khac_text: initial?.dieu_khoan_khac
      ? JSON.stringify(initial.dieu_khoan_khac, null, 2)
      : "",
  }));

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submit = (e) => {
    e.preventDefault();

    // biến đổi kiểu dữ liệu hợp lý
    const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
    if (!form.loai_hop_dong || !form.ngay_bat_dau || !form.muc_luong_co_ban) {
      alert("Vui lòng nhập Loại HĐ, Ngày bắt đầu và Lương cơ bản.");
      return;
    }

    const payload = {
      loai_hop_dong: form.loai_hop_dong,
      ngay_bat_dau: form.ngay_bat_dau,
      ngay_ket_thuc: form.ngay_ket_thuc || null,
      muc_luong_co_ban: Number(form.muc_luong_co_ban),
      di_tre_phat: toNum(form.di_tre_phat),
      ve_som_phat: toNum(form.ve_som_phat),
      tang_ca_heso: toNum(form.tang_ca_heso),
      luong_ngay_le_heso: toNum(form.luong_ngay_le_heso),
      luong_cuoi_tuan_heso: toNum(form.luong_cuoi_tuan_heso),
      phu_cap_an_trua: toNum(form.phu_cap_an_trua),
      phu_cap_xang_xe: toNum(form.phu_cap_xang_xe),
      phu_cap_doc_hai: toNum(form.phu_cap_doc_hai),
      phu_cap_trach_nhiem: toNum(form.phu_cap_trach_nhiem),
      phu_cap_chuc_vu: toNum(form.phu_cap_chuc_vu),
      phu_cap_tham_nien: toNum(form.phu_cap_tham_nien),
      phep_nam: Number(form.phep_nam || 0),
      trang_thai: !!form.trang_thai,
    };

    onSubmit?.(payload);
  };

  return (
    <Modal show={show} onHide={onHide} centered data-noexport="true">
      <Modal.Header closeButton>
        <Modal.Title>{initial ? "Cập nhật HĐ lao động" : "Thêm HĐ lao động mới"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={submit}>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label>Loại hợp đồng</label>
              <input name="loai_hop_dong" className="form-control"
                value={form.loai_hop_dong} onChange={onChange} required />
            </div>
            <div className="col-md-6 mb-2">
              <label>Lương cơ bản</label>
              <input type="number" name="muc_luong_co_ban" className="form-control"
                value={form.muc_luong_co_ban} onChange={onChange} min="0" step="1000" required />
            </div>
            <div className="col-md-6 mb-2">
              <label>Ngày bắt đầu</label>
              <input type="date" name="ngay_bat_dau" className="form-control"
                value={form.ngay_bat_dau} onChange={onChange} required />
            </div>
            <div className="col-md-6 mb-2">
              <label>Ngày kết thúc</label>
              <input type="date" name="ngay_ket_thuc" className="form-control"
                value={form.ngay_ket_thuc} onChange={onChange} />
            </div>

            <div className="col-md-6 mb-2">
              <label>Phép năm</label>
              <input type="number" name="phep_nam" className="form-control"
                value={form.phep_nam} onChange={onChange} min="0" />
            </div>
            <div className="col-md-6 mb-2 d-flex align-items-end">
              <div className="form-check">
                <input className="form-check-input" type="checkbox"
                  name="trang_thai" id="hd-trang-thai"
                  checked={form.trang_thai} onChange={onChange} />
                <label className="form-check-label" htmlFor="hd-trang-thai">
                  Đang hiệu lực / hiển thị
                </label>
              </div>
            </div>

            {/* Hệ số & phạt */}
            <div className="col-md-6 mb-2">
              <label>Phạt đi trễ (VNĐ/phút)</label>
              <input type="number" name="di_tre_phat" className="form-control"
                value={form.di_tre_phat} onChange={onChange} step="1000" />
            </div>
            <div className="col-md-6 mb-2">
              <label>Phạt về sớm (VNĐ/phút)</label>
              <input type="number" name="ve_som_phat" className="form-control"
                value={form.ve_som_phat} onChange={onChange} step="1000" />
            </div>
            <div className="col-md-4 mb-2">
              <label>HS tăng ca</label>
              <input type="number" name="tang_ca_heso" className="form-control"
                value={form.tang_ca_heso} onChange={onChange} step="0.1" />
            </div>
            <div className="col-md-4 mb-2">
              <label>HS ngày lễ</label>
              <input type="number" name="luong_ngay_le_heso" className="form-control"
                value={form.luong_ngay_le_heso} onChange={onChange} step="0.1" />
            </div>
            <div className="col-md-4 mb-2">
              <label>HS cuối tuần</label>
              <input type="number" name="luong_cuoi_tuan_heso" className="form-control"
                value={form.luong_cuoi_tuan_heso} onChange={onChange} step="0.1" />
            </div>

            {/* Phụ cấp */}
            {[
              ["phu_cap_an_trua", "Ăn trưa"],
              ["phu_cap_xang_xe", "Xăng xe"],
              ["phu_cap_doc_hai", "Độc hại"],
              ["phu_cap_trach_nhiem", "Trách nhiệm"],
              ["phu_cap_chuc_vu", "Chức vụ"],
              ["phu_cap_tham_nien", "Thâm niên"],
            ].map(([name, label]) => (
              <div className="col-md-4 mb-2" key={name}>
                <label>{`Phụ cấp ${label}`}</label>
                <input type="number" name={name} className="form-control"
                  value={form[name]} onChange={onChange} step="1000" />
              </div>
            ))}

            {/* Điều khoản khác (JSON) */}
            {/* <div className="col-12 mb-2">
              <label>Điều khoản khác (JSON)</label>
              <textarea name="dieu_khoan_khac_text" className="form-control"
                value={form.dieu_khoan_khac_text} onChange={onChange}
                placeholder='Ví dụ: {"ghi_chu":"...","phu_luc":[...]}'
                rows={4} />
            </div> */}
          </div>

          <div className="d-flex gap-2 mt-3">
            <Button type="submit" variant="success" disabled={disabled}>
              {disabled ? "Đang lưu..." : (initial ? "Cập nhật" : "Thêm mới")}
            </Button>
            <Button variant="outline-secondary" onClick={onHide} disabled={disabled}>
              Hủy
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  );
}

export default NhanSuDetail;
