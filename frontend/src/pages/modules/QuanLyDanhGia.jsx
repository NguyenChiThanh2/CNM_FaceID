// src/pages/danhgia/QuanLyDanhGia.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
    Container, Row, Col, Button, Table, Modal, Breadcrumb, OverlayTrigger, Tooltip,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

import DanhGiaForm from "../../components/danhgia/DanhGiaForm";
import DanhGiaCharts from "../../components/danhgia/DanhGiaCharts";
import { getNhanVienInfo } from "../../utils/auth";
import { getAllPhongBan } from "../../services/phongBanApi";
import { getAllNhanVien } from "../../services/nhanSuApi";
import AppDialog from "../../components/common/AppDialog";
import useDialog from "../../hooks/useDialog";

// 🆕 Toast giống QuanLyNhanSu
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://127.0.0.1:5000/api/danhgia";
const ALLOWED_ROLE_IDS = [4, 5]; // 4=Quản lý, 5=Trưởng phòng

const QuanLyDanhGia = () => {
    // ===== State =====
    const [danhGias, setDanhGias] = useState([]);
    const [selectedDG, setSelectedDG] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [search, setSearch] = useState("");
    const [selectedDeptId, setSelectedDeptId] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // maps
    const [pbMap, setPbMap] = useState({});
    const [nvDeptMap, setNvDeptMap] = useState({});
    const [nvDeptNameMap, setNvDeptNameMap] = useState({});

    const navigate = useNavigate();
    const currentUser = getNhanVienInfo();

    // dialog
    const { dlg, hide, alert, confirm } = useDialog();

    // ===== Permissions / helpers =====
    const canReviewUser = () => ALLOWED_ROLE_IDS.includes(currentUser?.chuc_vu_id);
    const sameDept = (nvPhongBanId) =>
        !!(currentUser?.phong_ban_id && nvPhongBanId && nvPhongBanId === currentUser.phong_ban_id);

    const openRef = useCallback((ref) => {
        if (!ref) return;
        if (/^https?:\/\//i.test(ref)) {
            window.open(ref, "_blank", "noopener,noreferrer");
        } else {
            // Giữ nguyên alert đẹp; có thể thay bằng toast.info nếu muốn
            alert(`Đường dẫn file: ${ref}`, "Thông tin");
        }
    }, [alert]);

    const renderChip = (label, refVal, colorClass = "") => {
        const disabled = !refVal || !String(refVal).trim();
        const tip = <Tooltip>{disabled ? "Chưa có minh chứng" : String(refVal)}</Tooltip>;
        return (
            <OverlayTrigger placement="top" overlay={tip} key={label}>
                <button
                    type="button"
                    className={`btn evidence-chip ${colorClass}`}
                    disabled={disabled}
                    onClick={() => !disabled && openRef(refVal)}
                    aria-label={`Minh chứng ${label}`}
                >
                    {label}
                </button>
            </OverlayTrigger>
        );
    };

    // ===== Load PB & NV =====
    useEffect(() => {
        (async () => {
            try {
                const pbs = await getAllPhongBan();
                const map = {};
                (pbs || []).forEach((pb) => { map[pb.id] = pb.ten_phong_ban; });
                setPbMap(map);
            } catch (err) {
                console.error("Lỗi khi tải phòng ban:", err);
                toast.error("Không thể tải danh sách phòng ban!");
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const nvs = await getAllNhanVien();
                const mapIdToDept = {};
                const mapIdToDeptName = {};
                (nvs || []).forEach((nv) => {
                    if (nv?.id != null) {
                        if (nv?.phong_ban_id != null) mapIdToDept[nv.id] = nv.phong_ban_id;
                        if (nv?.ten_phong_ban) mapIdToDeptName[nv.id] = nv.ten_phong_ban;
                    }
                });
                setNvDeptMap(mapIdToDept);
                setNvDeptNameMap(mapIdToDeptName);
            } catch (err) {
                console.error("Lỗi khi tải nhân viên:", err);
                toast.error("Không thể tải danh sách nhân viên!");
            }
        })();
    }, []);

    // ===== Fetch đánh giá =====
    const enrichDanhGiasWithDept = (list, pbMapArg, nvDeptMapArg, nvDeptNameMapArg) =>
        (list || []).map((dg) => {
            const nv = dg?.nhan_vien || {};
            let phong_ban_id =
                nv.phong_ban_id ?? dg?.nhan_vien_phong_ban_id ?? dg?.phong_ban_id ?? null;

            if (!phong_ban_id && nv?.id && nvDeptMapArg[nv.id]) {
                phong_ban_id = nvDeptMapArg[nv.id];
            }

            let ten_phong_ban =
                nv.ten_phong_ban ||
                (nv?.id && nvDeptNameMapArg[nv.id]) ||
                (phong_ban_id != null ? pbMapArg[phong_ban_id] : undefined);

            return {
                ...dg,
                nhan_vien: {
                    ...nv,
                    ...(phong_ban_id != null ? { phong_ban_id } : {}),
                    ...(ten_phong_ban ? { ten_phong_ban } : {}),
                },
            };
        });

    const fetchDanhGias = useCallback(async () => {
        try {
            const res = await axios.get(API_URL);
            const raw = Array.isArray(res.data) ? res.data : [];
            setDanhGias(enrichDanhGiasWithDept(raw, pbMap, nvDeptMap, nvDeptNameMap));
        } catch (error) {
            console.error("❌ Lỗi khi tải đánh giá:", error);
            toast.error("Không thể tải danh sách đánh giá!");
        }
    }, [pbMap, nvDeptMap, nvDeptNameMap]);

    useEffect(() => { fetchDanhGias(); }, [fetchDanhGias]);

    // enrich lại khi map sẵn sàng
    useEffect(() => {
        if (danhGias.length) {
            setDanhGias((prev) => enrichDanhGiasWithDept(prev, pbMap, nvDeptMap, nvDeptNameMap));
        }
    }, [pbMap, nvDeptMap, nvDeptNameMap]); // eslint-disable-line

    // Reset trang khi đổi filter
    useEffect(() => { setCurrentPage(1); }, [search, selectedDeptId]);

    // ===== Row helpers =====
    const getNVPhongBanIdFromDG = (dg) =>
        dg?.nhan_vien?.phong_ban_id ?? dg?.nhan_vien_phong_ban_id ?? dg?.phong_ban_id ?? null;

    const getRowClass = (dg) => {
        const avg = dg.tong_diem ?? 0;
        if (avg >= 9) return "table-primary";
        if (avg >= 8) return "table-success";
        if (avg >= 6.5) return "table-warning";
        return "table-danger";
    };

    // ===== CRUD =====
    const handleCreate = () => {
        if (!canReviewUser()) return toast.error("Bạn không có quyền tạo đánh giá.");
        setSelectedDG(null);
        setShowModal(true);
    };

    const handleEdit = (dg) => {
        if (!canReviewUser()) return toast.error("Bạn không có quyền sửa đánh giá.");
        const nvPhongBanId = getNVPhongBanIdFromDG(dg);
        if (!nvPhongBanId) return toast.error("Không xác định được phòng ban của nhân viên. Không thể sửa.");
        if (!sameDept(nvPhongBanId)) return toast.error("Chỉ được đánh giá nhân viên trong cùng phòng ban.");
        setSelectedDG(dg);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (!canReviewUser()) return toast.error("Bạn không có quyền xóa đánh giá.");
        confirm(
            "Bạn có chắc muốn xóa đánh giá này không?",
            async () => {
                try {
                    await toast.promise(
                        axios.delete(`${API_URL}/${id}`),
                        {
                            pending: "Đang xóa đánh giá...",
                            success: "Đã xóa đánh giá!",
                            error: "Xóa đánh giá thất bại!",
                        }
                    );
                    fetchDanhGias();
                } catch (err) {
                    const msg = err?.response?.data?.message || "Xóa thất bại.";
                    toast.error(msg);
                }
            },
            { title: "Xác nhận xóa", okText: "Xóa" }
        );
    };

    const handleFormSubmit = async (data) => {
        try {
            if (selectedDG) {
                await toast.promise(
                    axios.put(`${API_URL}/${selectedDG.id}`, data),
                    {
                        pending: "Đang cập nhật đánh giá...",
                        success: "Cập nhật đánh giá thành công!",
                        error: "Cập nhật đánh giá thất bại!",
                    }
                );
            } else {
                await toast.promise(
                    axios.post(API_URL, data),
                    {
                        pending: "Đang tạo đánh giá...",
                        success: "Thêm đánh giá thành công!",
                        error: "Thêm đánh giá thất bại!",
                    }
                );
            }
            setShowModal(false);
            setSelectedDG(null);
            fetchDanhGias();
        } catch (err) {
            const msg = err?.response?.data?.message || "Lỗi khi lưu đánh giá.";
            toast.error(msg);
        }
    };

    // ===== Filter / Pagination / Export =====
    const filteredDanhGias = useMemo(() => {
        return danhGias.filter((dg) => {
            const nameOk = (dg.nhan_vien?.ho_ten || "").toLowerCase().includes(search.toLowerCase());
            const deptId = getNVPhongBanIdFromDG(dg);
            const deptOk = selectedDeptId ? deptId === Number(selectedDeptId) : true;
            return nameOk && deptOk;
        });
    }, [danhGias, search, selectedDeptId]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDanhGias.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDanhGias.length / itemsPerPage) || 1;

    const handleExportExcel = () => {
        const exportData = filteredDanhGias.map((dg) => ({
            ID: dg.id,
            "Nhân viên": dg.nhan_vien?.ho_ten,
            "Phòng ban":
                dg.nhan_vien?.ten_phong_ban ||
                (dg.nhan_vien?.phong_ban_id ? `PB #${dg.nhan_vien.phong_ban_id}` : ""),
            "Người đánh giá": dg.nguoi_danh_gia?.ho_ten,
            "Chuyên cần": dg.diem_chuyen_can,
            "Hiệu quả": dg.diem_hieu_qua,
            "Kỹ năng": dg.diem_ky_nang,
            "Thái độ": dg.diem_thai_do,
            "Chủ động": dg.diem_chu_dong,
            "Tổng điểm": (dg.tong_diem ?? 0).toFixed(2),
            "Xếp loại": dg.xep_loai,
            "Kỳ đánh giá": `${dg.ky_loai} - ${dg.ky_ngay}`,
            "MC Chuyên cần": dg.minh_chung?.chuyen_can ?? dg.mc_chuyen_can_ref ?? "",
            "MC Hiệu quả": dg.minh_chung?.hieu_qua ?? dg.mc_hieu_qua_ref ?? "",
            "MC Kỹ năng": dg.minh_chung?.ky_nang ?? dg.mc_ky_nang_ref ?? "",
            "MC Thái độ": dg.minh_chung?.thai_do ?? dg.mc_thai_do_ref ?? "",
            "MC Chủ động": dg.minh_chung?.chu_dong ?? dg.mc_chu_dong_ref ?? "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "DanhGia");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "danh_gia.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("BÁO CÁO ĐÁNH GIÁ NHÂN VIÊN", 14, 10);

        const tableData = filteredDanhGias.map((dg) => [
            dg.id,
            dg.nhan_vien?.ho_ten || "",
            dg.nhan_vien?.ten_phong_ban ||
            (dg.nhan_vien?.phong_ban_id ? `PB #${dg.nhan_vien.phong_ban_id}` : ""),
            dg.nguoi_danh_gia?.ho_ten || "",
            dg.diem_chuyen_can ?? "",
            dg.diem_hieu_qua ?? "",
            dg.diem_ky_nang ?? "",
            dg.diem_thai_do ?? "",
            dg.diem_chu_dong ?? "",
            (dg.tong_diem ?? 0).toFixed(2),
            dg.xep_loai,
            dg.ky_loai,
            dg.ky_ngay,
        ]);

        doc.autoTable({
            head: [[
                "ID", "Nhân viên", "Phòng ban", "Người đánh giá",
                "Chuyên cần", "Hiệu quả", "Kỹ năng", "Thái độ", "Chủ động",
                "Tổng điểm", "Xếp loại", "Kỳ", "Ngày"
            ]],
            body: tableData,
            startY: 20,
        });

        doc.save("bao_cao_danh_gia.pdf");
    };

    const deptOptions = useMemo(() =>
        Object.entries(pbMap)
            .map(([id, name]) => ({ id: Number(id), name }))
            .sort((a, b) => a.name.localeCompare(b.name, "vi"))
        , [pbMap]);

    // ===== Render =====

    // Kích thước & offset cho 3 cột sticky (ID, Nhân viên, Phòng ban)
    const COL_W_ID = 80;       // px
    const COL_W_NAME = 220;    // px
    const COL_W_DEPT = 230;    // px
    const LEFT_NAME = COL_W_ID;
    const LEFT_DEPT = COL_W_ID + COL_W_NAME;

    const colWidths = [
        COL_W_ID, COL_W_NAME, COL_W_DEPT,
        200, 90, 90, 90, 90, 90, 110, 90, 140, 180, 140,
    ];

    return (
        <Container className="min-vh-100">
            {/* CSS trượt ngang + sticky 3 cột đầu */}
            <style>{`
        .dg-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .dg-freeze thead th, .dg-freeze tbody td { white-space: nowrap; }
        .dg-freeze .sticky-col { position: sticky; left: 0; z-index: 2; background: #fff; box-shadow: 1px 0 0 rgba(0,0,0,0.06); }
        .dg-freeze thead .sticky-col { z-index: 3; background: #212529; color: #fff; }
        .sticky-col.col-id   { left: 0px; min-width: ${COL_W_ID}px;   width: ${COL_W_ID}px;   max-width: ${COL_W_ID}px; }
        .sticky-col.col-name { left: ${LEFT_NAME}px; min-width: ${COL_W_NAME}px; width: ${COL_W_NAME}px; max-width: ${COL_W_NAME}px; }
        .sticky-col.col-dept { left: ${LEFT_DEPT}px; min-width: ${COL_W_DEPT}px; width: ${COL_W_DEPT}px; max-width: ${COL_W_DEPT}px; }
        /*  Căn trái riêng cho 2 cột Nhân viên & Phòng ban (ghi đè text-center của table) */
  .dg-freeze th.col-name,
  .dg-freeze th.col-dept,
  .dg-freeze td.col-name,
  .dg-freeze td.col-dept {
    text-align: left !important;
    padding-left: 12px; /* nhìn thoáng hơn */
  }

  /* đảm bảo phần tử ellipsis chiếm full bề rộng để canh trái đúng */
  .td-ellipsis, .td-ellipsis-lg { display: block; max-width: 100%; }
      
      `}</style>

            <Breadcrumb className="mt-3">
                <Breadcrumb.Item onClick={() => navigate("/")}>Trang chủ</Breadcrumb.Item>
                <Breadcrumb.Item active>Quản lý đánh giá</Breadcrumb.Item>
            </Breadcrumb>

            <Row className="mb-3 mt-4">
                <Col><h3 className="text-center fw-bold">QUẢN LÝ ĐÁNH GIÁ NHÂN SỰ</h3></Col>
            </Row>

            <Row className="mb-3 g-2 align-items-end">
                <Col md={4}>
                    <label className="form-label fw-semibold">Tìm theo tên</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Tìm theo tên nhân viên..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Col>

                <Col md={3}>
                    <label className="form-label fw-semibold">Phòng ban</label>
                    <select
                        className="form-select"
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                    >
                        <option value="">Tất cả phòng ban</option>
                        {deptOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                </Col>

                <Col md className="text-end">
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button variant="outline-success" onClick={handleExportExcel}>Xuất Excel</Button>
                        <Button variant="outline-dark" onClick={handleExportPDF}>Xuất PDF</Button>
                        {canReviewUser() && (
                            <Button variant="outline-primary" onClick={handleCreate}>+ Thêm đánh giá</Button>
                        )}
                    </div>
                </Col>
            </Row>

            {/* Bọc bảng trong wrapper để trượt ngang */}
            <div className="table-responsive dg-table-wrap">
                <Table bordered hover className="bg-white shadow-sm text-center align-middle table-nowrap table-compact dg-freeze">
                    <colgroup>
                        {colWidths.map((w, i) => (<col key={i} style={{ width: w }} />))}
                    </colgroup>

                    <thead className="table-dark">
                        <tr>
                            <th className="sticky-col col-id">ID</th>
                            <th className="sticky-col col-name">Nhân viên</th>
                            <th className="sticky-col col-dept">Phòng ban</th>
                            <th>Người đánh giá</th>
                            <th>Chuyên cần</th>
                            <th>Hiệu quả</th>
                            <th>Kỹ năng</th>
                            <th>Thái độ</th>
                            <th>Chủ động</th>
                            <th>Tổng điểm</th>
                            <th>Xếp loại</th>
                            <th>Kỳ — Ngày</th>
                            <th>Minh chứng</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="14" className="text-center">Không có dữ liệu đánh giá</td></tr>
                        ) : (
                            currentItems.map((dg) => {
                                const nvPhongBanId = getNVPhongBanIdFromDG(dg);
                                const allowRowActions = canReviewUser() && nvPhongBanId && sameDept(nvPhongBanId);

                                const tenNV = dg.nhan_vien?.ho_ten || "";
                                const tenPBFull =
                                    dg.nhan_vien?.ten_phong_ban ||
                                    (dg.nhan_vien?.phong_ban_id ? `PB #${dg.nhan_vien.phong_ban_id}` : "");
                                const nguoiDG = dg.nguoi_danh_gia?.ho_ten || "";

                                const mc = dg.minh_chung || {};
                                const mcRefs = {
                                    chuyen_can: mc.chuyen_can ?? dg.mc_chuyen_can_ref,
                                    hieu_qua: mc.hieu_qua ?? dg.mc_hieu_qua_ref,
                                    ky_nang: mc.ky_nang ?? dg.mc_ky_nang_ref,
                                    thai_do: mc.thai_do ?? dg.mc_thai_do_ref,
                                    chu_dong: mc.chu_dong ?? dg.mc_chu_dong_ref,
                                };

                                return (
                                    <tr key={dg.id} className={getRowClass(dg)}>
                                        <td className="sticky-col col-id">{dg.id}</td>

                                        <td className="sticky-col col-name" title={tenNV}>
                                            <span className="d-inline-block td-ellipsis">{tenNV}</span>
                                        </td>

                                        <td className="sticky-col col-dept" title={tenPBFull}>
                                            <span className="d-inline-block td-ellipsis td-ellipsis-lg">
                                                {tenPBFull ? tenPBFull.split("(")[0].trim() : ""}
                                            </span>
                                        </td>

                                        <td title={nguoiDG}><span className="d-inline-block td-ellipsis">{nguoiDG}</span></td>

                                        <td>{dg.diem_chuyen_can}</td>
                                        <td>{dg.diem_hieu_qua}</td>
                                        <td>{dg.diem_ky_nang}</td>
                                        <td>{dg.diem_thai_do}</td>
                                        <td>{dg.diem_chu_dong}</td>
                                        <td><strong>{(dg.tong_diem ?? 0).toFixed(2)}</strong></td>
                                        <td>{dg.xep_loai}</td>
                                        <td>{dg.ky_loai} — {dg.ky_ngay}</td>

                                        {/* Minh chứng */}
                                        <td>
                                            <div className="evidence-cell">
                                                {renderChip("CC", mcRefs.chuyen_can, "chip-cc")}
                                                {renderChip("HQ", mcRefs.hieu_qua, "chip-hq")}
                                                {renderChip("KN", mcRefs.ky_nang, "chip-kn")}
                                                {renderChip("TĐ", mcRefs.thai_do, "chip-td")}
                                                {renderChip("CĐ", mcRefs.chu_dong, "chip-cd")}
                                            </div>
                                        </td>

                                        <td className="text-nowrap">
                                            {allowRowActions ? (
                                                <>
                                                    <Button variant="outline-warning" size="sm" onClick={() => setSelectedDG(dg) || setShowModal(true)}>Sửa</Button>{" "}
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(dg.id)}>Xóa</Button>
                                                </>
                                            ) : canReviewUser() && !nvPhongBanId ? (
                                                <small className="text-muted">Thiếu dữ liệu phòng ban</small>
                                            ) : (
                                                <small className="text-muted">Không có quyền</small>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Phân trang */}
            <Row className="justify-content-center mt-3">
                <Col xs="auto" className="text-center">
                    <div className="d-flex align-items-center gap-3">
                        <Button
                            variant="outline-secondary"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        >
                            ← Trước
                        </Button>
                        <span className="fw-semibold">
                            Trang {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline-secondary"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Sau →
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Charts */}
            <Row className="mb-3">
                <Col><DanhGiaCharts data={filteredDanhGias} /></Col>
            </Row>

            {/* Modal Form */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedDG ? "Cập nhật đánh giá" : "Thêm đánh giá mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <DanhGiaForm
                        initialData={selectedDG}
                        onSubmit={async (data) => await handleFormSubmit(data)}
                        onClose={() => setShowModal(false)}
                    />
                </Modal.Body>
            </Modal>

            {/* Dialog đẹp thay alert/confirm */}
            <AppDialog
                show={dlg.show}
                onHide={hide}
                title={dlg.title}
                message={dlg.message}
                variant={dlg.variant}
                okText={dlg.okText}
                cancelText={dlg.cancelText}
                onOk={dlg.onOk}
            />

            {/* 🆕 ToastContainer giống QuanLyNhanSu */}
            <ToastContainer position="top-right" autoClose={2000} />
        </Container>
    );
};

export default QuanLyDanhGia;
