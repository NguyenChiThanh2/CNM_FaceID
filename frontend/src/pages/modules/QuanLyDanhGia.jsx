// src/pages/danhgia/QuanLyDanhGia.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../../services/axiosInstance";
import {
    Container, Row, Col, Button, Table, Modal, Breadcrumb, OverlayTrigger, Tooltip,
    Card, Form, Badge
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
    FaHome,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaFileExcel,
    FaFilePdf,
    FaChartBar,
    FaUser,
    FaBuilding,
    FaStar,
    FaLink
} from "react-icons/fa";

import DanhGiaForm from "../../components/danhgia/DanhGiaForm";
import DanhGiaCharts from "../../components/danhgia/DanhGiaCharts";
import { getNhanVienInfo } from "../../utils/auth";
import { getAllPhongBan } from "../../services/phongBanApi";
import { getAllNhanVien } from "../../services/nhanSuApi";
import AppDialog from "../../components/common/AppDialog";
import useDialog from "../../hooks/useDialog";
import Loading from "../../components/Loading";

// Toast
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DANHGIA_PATH = "/danhgia";
const ALLOWED_ROLE_IDS = [4, 5]; // 4=Quản lý, 5=Trưởng phòng

const QuanLyDanhGia = () => {
    // ===== State =====
    const [danhGias, setDanhGias] = useState([]);
    const [selectedDG, setSelectedDG] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const openRef = useCallback(
        (ref) => {
            if (!ref) return;
            if (/^https?:\/\//i.test(ref)) {
                window.open(ref, "_blank", "noopener,noreferrer");
            } else {
                alert(`Đường dẫn file: ${ref}`, "Thông tin");
            }
        },
        [alert]
    );

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
                (pbs || []).forEach((pb) => {
                    map[pb.id] = pb.ten_phong_ban;
                });
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

            // xác định phong_ban_id cuối cùng
            let phong_ban_id =
                nv.phong_ban_id ?? dg?.nhan_vien_phong_ban_id ?? dg?.phong_ban_id ?? null;

            if (!phong_ban_id && nv?.id && nvDeptMapArg[nv.id]) {
                phong_ban_id = nvDeptMapArg[nv.id];
            }

            // xác định tên phòng ban cuối cùng
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
        setLoading(true);
        try {
            const res = await axiosInstance.get(DANHGIA_PATH);
            const raw = Array.isArray(res.data) ? res.data : [];
            setDanhGias(enrichDanhGiasWithDept(raw, pbMap, nvDeptMap, nvDeptNameMap));
        } catch (error) {
            console.error("❌ Lỗi khi tải đánh giá:", error);
            toast.error("Không thể tải danh sách đánh giá!");
        } finally {
            setLoading(false);
        }
    }, [pbMap, nvDeptMap, nvDeptNameMap]);

    useEffect(() => {
        fetchDanhGias();
    }, [fetchDanhGias]);

    // enrich lại khi map sẵn sàng / thay đổi
    useEffect(() => {
        if (danhGias.length) {
            setDanhGias((prev) => enrichDanhGiasWithDept(prev, pbMap, nvDeptMap, nvDeptNameMap));
        }
    }, [pbMap, nvDeptMap, nvDeptNameMap]);

    // Reset trang khi đổi filter
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedDeptId]);

    // ===== Row helpers =====
    const getNVPhongBanIdFromDG = (dg) =>
        dg?.nhan_vien?.phong_ban_id ?? dg?.nhan_vien_phong_ban_id ?? dg?.phong_ban_id ?? null;

    const getRatingBadge = (score) => {
        if (score >= 9) return <Badge bg="success">{score}</Badge>;
        if (score >= 8) return <Badge bg="info">{score}</Badge>;
        if (score >= 6.5) return <Badge bg="warning" text="dark">{score}</Badge>;
        return <Badge bg="danger">{score}</Badge>;
    };
    const getRecommendation = (dg) => {
        const score = dg.tong_diem ?? 0;

        if (score >= 8.5) {
            return <Badge bg="success">Ký tiếp hợp đồng</Badge>;
        } else if (score >= 7) {
            return <Badge bg="warning" text="dark">Xem xét</Badge>;
        } else {
            return <Badge bg="danger">Không ký tiếp hợp đồng</Badge>;
        }
    };


    // ===== CRUD =====
    const canUserCreateOrEdit = () => canReviewUser();

    const handleCreate = () => {
        if (!canUserCreateOrEdit()) return toast.error("Bạn không có quyền tạo đánh giá.");
        setSelectedDG(null);
        setShowModal(true);
    };

    const handleEdit = (dg) => {
        if (!canUserCreateOrEdit()) return toast.error("Bạn không có quyền sửa đánh giá.");
        const nvPhongBanId = getNVPhongBanIdFromDG(dg);
        if (!nvPhongBanId) return toast.error("Không xác định được phòng ban của nhân viên. Không thể sửa.");
        if (!sameDept(nvPhongBanId)) return toast.error("Chỉ được đánh giá nhân viên trong cùng phòng ban.");
        setSelectedDG(dg);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (!canUserCreateOrEdit()) return toast.error("Bạn không có quyền xóa đánh giá.");
        confirm(
            "Bạn có chắc muốn xóa đánh giá này không?",
            async () => {
                try {
                    await toast.promise(
                        axiosInstance.delete(`${DANHGIA_PATH}/${id}`),
                        {
                            pending: "Đang xóa đánh giá...",
                            success: "Đã xóa đánh giá!",
                            error: "Xóa đánh giá thất bại!",
                        }
                    );
                    fetchDanhGias();
                } catch (err) {
                    // axiosInstance đã tự chuẩn hoá lỗi, không còn err.response nữa.
                    const msg = err?.message || "Xóa thất bại.";
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
                    axiosInstance.put(`${DANHGIA_PATH}/${selectedDG.id}`, data),
                    {
                        pending: "Đang cập nhật đánh giá...",
                        success: "Cập nhật đánh giá thành công!",
                        error: "Cập nhật đánh giá thất bại!",
                    }
                );
            } else {
                await toast.promise(
                    axiosInstance.post(DANHGIA_PATH, data),
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
            // axiosInstance đã tự chuẩn hoá lỗi, không còn err.response nữa.
            const msg = err?.message || "Lỗi khi lưu đánh giá.";
            toast.error(msg);
        }
    };

    // ===== Filter / Pagination / Export =====
    const filteredDanhGias = useMemo(() => {
        return danhGias.filter((dg) => {
            const nameOk = (dg.nhan_vien?.ho_ten || "")
                .toLowerCase()
                .includes(search.toLowerCase());

            const deptId = getNVPhongBanIdFromDG(dg);
            const deptOk = selectedDeptId
                ? deptId === Number(selectedDeptId)
                : true;

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

    const deptOptions = useMemo(
        () =>
            Object.entries(pbMap)
                .map(([id, name]) => ({ id: Number(id), name }))
                .sort((a, b) => a.name.localeCompare(b.name, "vi")),
        [pbMap]
    );

    // ===== Render =====
    return (
        <div
            className="p-4 ps-5"
            style={{ minHeight: "100vh", position: "relative" }}
        >
            {/* Toast luôn luôn mounted */}
            <ToastContainer position="top-right" autoClose={2000} />

            {/* Loading overlay (khi loading = true) */}
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
                                Quản lý đánh giá
                            </Breadcrumb.Item>
                        </Breadcrumb>
                        <h1 className="fw-bold mb-2">
                            ⭐ Quản lý Đánh giá Nhân sự
                        </h1>
                        <p className="mb-0 opacity-90">
                            Đánh giá và theo dõi hiệu suất làm việc của nhân viên
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
                    Tìm kiếm & Bộ lọc
                </Card.Header>
                <Card.Body className="p-4">
                    <Row className="g-3 align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">
                                    Tìm theo tên nhân viên
                                </Form.Label>
                                <div className="position-relative">
                                    <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập tên nhân viên..."
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        style={{ paddingLeft: "2.5rem" }}
                                    />
                                </div>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">
                                    Phòng ban
                                </Form.Label>
                                <Form.Select
                                    value={selectedDeptId}
                                    onChange={(e) =>
                                        setSelectedDeptId(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Tất cả phòng ban
                                    </option>
                                    {deptOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={4}>
                            <div className="d-flex gap-2 flex-wrap justify-content-end">
                                <Button
                                    variant="outline-success"
                                    onClick={handleExportExcel}
                                >
                                    <FaFileExcel className="me-2" />
                                    Excel
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    onClick={handleExportPDF}
                                >
                                    <FaFilePdf className="me-2" />
                                    PDF
                                </Button>
                                {canUserCreateOrEdit() && (
                                    <Button
                                        variant="primary"
                                        onClick={handleCreate}
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                            border: "none",
                                        }}
                                    >
                                        <FaPlus className="me-2" />
                                        Thêm đánh giá
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Data Table Card */}
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
                    <FaChartBar className="me-2" />
                    Danh sách Đánh giá
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                                    color: "white",
                                }}
                            >
                                <tr>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>ID</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Nhân viên</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Phòng ban</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Người đánh giá</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Chuyên cần</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Hiệu quả</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Kỹ năng</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Thái độ</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Chủ động</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Tổng điểm</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Xếp loại</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Kỳ đánh giá</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Minh chứng</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Khuyến nghị</th>

                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="14"
                                            className="text-center text-muted py-4"
                                        >
                                            <FaChartBar className="fs-1 mb-2 opacity-50" />
                                            <div>
                                                Không có dữ liệu đánh giá
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((dg) => {
                                        const nvPhongBanId = getNVPhongBanIdFromDG(dg);
                                        const allowRowActions =
                                            canUserCreateOrEdit() &&
                                            nvPhongBanId &&
                                            sameDept(nvPhongBanId);

                                        const tenNV =
                                            dg.nhan_vien?.ho_ten || "";
                                        const tenPBFull =
                                            dg.nhan_vien?.ten_phong_ban ||
                                            (dg.nhan_vien?.phong_ban_id
                                                ? `PB #${dg.nhan_vien.phong_ban_id}`
                                                : "");
                                        const nguoiDG =
                                            dg.nguoi_danh_gia?.ho_ten || "";

                                        const mc = dg.minh_chung || {};
                                        const mcRefs = {
                                            chuyen_can:
                                                mc.chuyen_can ??
                                                dg.mc_chuyen_can_ref,
                                            hieu_qua:
                                                mc.hieu_qua ??
                                                dg.mc_hieu_qua_ref,
                                            ky_nang:
                                                mc.ky_nang ??
                                                dg.mc_ky_nang_ref,
                                            thai_do:
                                                mc.thai_do ??
                                                dg.mc_thai_do_ref,
                                            chu_dong:
                                                mc.chu_dong ??
                                                dg.mc_chu_dong_ref,
                                        };

                                        return (
                                            <tr
                                                key={dg.id}
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
                                                    {dg.id}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <FaUser className="text-primary me-2" />
                                                        {tenNV}
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <FaBuilding className="text-secondary me-2" />
                                                        {tenPBFull
                                                            ? tenPBFull
                                                                .split("(")[0]
                                                                .trim()
                                                            : ""}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {nguoiDG}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {getRatingBadge(
                                                        dg.diem_chuyen_can
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {getRatingBadge(
                                                        dg.diem_hieu_qua
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {getRatingBadge(
                                                        dg.diem_ky_nang
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {getRatingBadge(
                                                        dg.diem_thai_do
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {getRatingBadge(
                                                        dg.diem_chu_dong
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <Badge
                                                        bg="primary"
                                                        className="fs-6"
                                                    >
                                                        {(
                                                            dg.tong_diem ??
                                                            0
                                                        ).toFixed(2)}
                                                    </Badge>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <Badge
                                                        bg={
                                                            dg.xep_loai ===
                                                                "Xuất sắc"
                                                                ? "success"
                                                                : dg.xep_loai ===
                                                                    "Tốt"
                                                                    ? "info"
                                                                    : dg.xep_loai ===
                                                                        "Khá"
                                                                        ? "warning"
                                                                        : "danger"
                                                        }
                                                    >
                                                        {dg.xep_loai}
                                                    </Badge>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                    }}
                                                >
                                                    <small>
                                                        <div>
                                                            <strong>
                                                                {dg.ky_loai}
                                                            </strong>
                                                        </div>
                                                        <div className="text-muted">
                                                            {dg.ky_ngay}
                                                        </div>
                                                    </small>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                    }}
                                                >
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        {renderChip(
                                                            "CC",
                                                            mcRefs.chuyen_can,
                                                            "chip-cc"
                                                        )}
                                                        {renderChip(
                                                            "HQ",
                                                            mcRefs.hieu_qua,
                                                            "chip-hq"
                                                        )}
                                                        {renderChip(
                                                            "KN",
                                                            mcRefs.ky_nang,
                                                            "chip-kn"
                                                        )}
                                                        {renderChip(
                                                            "TĐ",
                                                            mcRefs.thai_do,
                                                            "chip-td"
                                                        )}
                                                        {renderChip(
                                                            "CĐ",
                                                            mcRefs.chu_dong,
                                                            "chip-cd"
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                    }}
                                                >
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        {allowRowActions ? (
                                                            <>
                                                                <Button
                                                                    variant="outline-warning"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEdit(
                                                                            dg
                                                                        )
                                                                    }
                                                                >
                                                                    <FaEdit />
                                                                </Button>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            dg.id
                                                                        )
                                                                    }
                                                                >
                                                                    <FaTrash />
                                                                </Button>
                                                            </>
                                                        ) : canUserCreateOrEdit() &&
                                                            !nvPhongBanId ? (
                                                            <small className="text-muted">
                                                                Thiếu dữ liệu
                                                            </small>
                                                        ) : (
                                                            <small className="text-muted">
                                                                Không có quyền
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "12px", textAlign: "center" }}>
                                                    {getRecommendation(dg)}
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <Card className="shadow-sm border-0 rounded-4 mt-4">
                    <Card.Body className="py-3">
                        <div className="d-flex justify-content-center align-items-center gap-3">
                            <Button
                                variant="outline-primary"
                                disabled={currentPage === 1}
                                onClick={() =>
                                    setCurrentPage(currentPage - 1)
                                }
                                style={{
                                    borderColor: "#667eea",
                                    color: "#667eea",
                                }}
                            >
                                ← Trang trước
                            </Button>
                            <span
                                className="fw-semibold"
                                style={{ color: "#4a5568" }}
                            >
                                Trang {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline-primary"
                                disabled={
                                    currentPage === totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(currentPage + 1)
                                }
                                style={{
                                    borderColor: "#667eea",
                                    color: "#667eea",
                                }}
                            >
                                Trang sau →
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Charts Section */}
            <Card className="shadow-sm border-0 rounded-4 mt-4">
                <Card.Header
                    style={{
                        background:
                            "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                        color: "white",
                        fontWeight: "600",
                    }}
                >
                    <FaChartBar className="me-2" />
                    Thống kê & Biểu đồ
                </Card.Header>
                <Card.Body>
                    <DanhGiaCharts data={filteredDanhGias} />
                </Card.Body>
            </Card>

            {/* Modal Form */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
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
                        <FaStar className="me-2" />
                        {selectedDG
                            ? "Cập nhật đánh giá"
                            : "Thêm đánh giá mới"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <DanhGiaForm
                        initialData={selectedDG}
                        onSubmit={async (data) =>
                            await handleFormSubmit(data)
                        }
                        onClose={() => setShowModal(false)}
                    />
                </Modal.Body>
            </Modal>

            {/* Dialog */}
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
        </div>
    );
};

export default QuanLyDanhGia;
