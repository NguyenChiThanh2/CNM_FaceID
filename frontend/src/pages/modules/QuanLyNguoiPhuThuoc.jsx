// src/pages/modules/QuanLyNguoiPhuThuoc.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    Table,
    Breadcrumb,
    Button,
    Modal,
    Form,
    Card,
    Row,
    Col,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Loading from "../../components/Loading";

import {
    listNguoiPhuThuoc,
    createNguoiPhuThuoc,
    updateNguoiPhuThuoc,
    deleteNguoiPhuThuoc,
} from "../../services/nguoiPhuThuocApi";

import { getAllNhanVien } from "../../services/nhanSuApi";
import { isHrOrAdmin } from "../../utils/auth";

import {
    FaHome,
    FaSearch,
    FaPlus,
    FaEdit,
    FaTrash,
    FaUserFriends,
    FaUser,
} from "react-icons/fa";

const ITEMS_PER_PAGE = 10;

const initForm = {
    nhan_vien_id: "",
    ten_nhan_vien: "",
    ho_ten: "",
    quan_he: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    ghi_chu: "",
};

const getUserInfo = () => {
    try {
        const saved = localStorage.getItem("user");
        if (!saved) return null;
        const parsed = JSON.parse(saved);
        const nv = parsed.nhan_vien || {};
        return {
            id: nv.id,
            ho_ten: nv.ho_ten,
            phong_ban_id: nv.phong_ban_id,
            ten_vai_tro: nv.ten_vai_tro,
            role: parsed.role?.ma_vai_tro || "user",
        };
    } catch {
        return null;
    }
};

const QuanLyNguoiPhuThuoc = () => {
    const navigate = useNavigate();

    // ===== user & quyền =====
    const userInfo = getUserInfo();
    const isHR = isHrOrAdmin(userInfo);

    // ===== state chính =====
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    // filter
    const [q, setQ] = useState("");
    const [nhanVienId, setNhanVienId] = useState("");
    const [activeOn, setActiveOn] = useState("");

    // phân trang FE
    const [currentPage, setCurrentPage] = useState(1);

    // modal + form
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(initForm);

    // Danh sách nhân viên cho HR chọn
    const [nhanVienOptions, setNhanVienOptions] = useState([]);

    // ===== tiêu đề modal =====
    const modalTitle = useMemo(
        () => (editingId ? "Cập nhật người phụ thuộc" : "Thêm người phụ thuộc"),
        [editingId]
    );

    // ===== load list người phụ thuộc =====
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (q) params.q = q;
            if (nhanVienId) params.nhan_vien_id = Number(nhanVienId);
            if (activeOn) params.active_on = activeOn;

            let data = await listNguoiPhuThuoc(params);
            data = Array.isArray(data) ? data : [];

            // Non-HR chỉ xem của chính mình
            if (!isHR && userInfo?.id) {
                data = data.filter((d) => d.nhan_vien_id === userInfo.id);
            }

            setList(data);
            setCurrentPage(1);
        } catch (err) {
            toast.error(err.userMessage || err.message || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [q, nhanVienId, activeOn, isHR, userInfo]);

    // ===== load danh sách nhân viên để dùng cho select =====
    const fetchNhanVienList = useCallback(async () => {
        try {
            const allNV = await getAllNhanVien();
            const mapped = Array.isArray(allNV)
                ? allNV.map((nv) => ({
                    id: nv.id,
                    ho_ten:
                        nv.ho_ten ||
                        nv.ten_nhan_vien ||
                        nv.tenNhanVien ||
                        `NV #${nv.id}`,
                }))
                : [];
            setNhanVienOptions(mapped);
        } catch (err) {
            console.error("Lỗi tải danh sách nhân viên:", err);
            setNhanVienOptions([]);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchNhanVienList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== filter table theo q (tên người phụ thuộc / quan hệ) =====
    const filtered = useMemo(() => {
        const kw = (q || "").toLowerCase();
        return (list || []).filter((it) => {
            const tenNPT = (it.ho_ten || "").toLowerCase();
            const quanhe = (it.quan_he || "").toLowerCase();
            return !kw || tenNPT.includes(kw) || quanhe.includes(kw);
        });
    }, [list, q]);

    // ===== phân trang FE =====
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const currentItems = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ===== mở modal thêm =====
    const openCreate = () => {
        setEditingId(null);

        if (isHR) {
            // HR: form rỗng để chọn
            setForm({
                ...initForm,
                nhan_vien_id: "",
                ten_nhan_vien: "",
            });
        } else {
            // Non-HR: khóa về chính họ
            setForm({
                ...initForm,
                nhan_vien_id: userInfo?.id || "",
                ten_nhan_vien: userInfo?.ho_ten || "",
            });
        }

        setShowModal(true);
    };

    // ===== mở modal sửa =====
    const openEdit = (row) => {
        if (!isHR && row.nhan_vien_id !== userInfo?.id) {
            return toast.error("Bạn không có quyền sửa mục này");
        }

        setEditingId(row.id);

        setForm({
            nhan_vien_id: row.nhan_vien_id ?? "",
            ten_nhan_vien:
                row.ten_nhan_vien ||
                row.tenNhanVien ||
                row.nhan_vien_ho_ten ||
                row.nhan_vien_ten ||
                userInfo?.ho_ten ||
                "",
            ho_ten: row.ho_ten ?? "",
            quan_he: row.quan_he ?? "",
            ngay_bat_dau: (row.ngay_bat_dau || "").slice(0, 10),
            ngay_ket_thuc: (row.ngay_ket_thuc || "").slice(0, 10),
            ghi_chu: row.ghi_chu ?? "",
        });

        setShowModal(true);
    };

    // ===== validate form =====
    const validateForm = () => {
        if (!String(form.nhan_vien_id).trim())
            return "Vui lòng chọn nhân viên";
        if (!form.ho_ten.trim())
            return "Vui lòng nhập họ tên người phụ thuộc";
        if (!form.quan_he.trim()) return "Vui lòng nhập quan hệ";
        if (!form.ngay_bat_dau) return "Vui lòng chọn ngày bắt đầu";
        if (!form.ngay_ket_thuc) return "Vui lòng chọn ngày kết thúc";
        if (form.ngay_bat_dau > form.ngay_ket_thuc)
            return "Ngày bắt đầu phải <= ngày kết thúc";
        return "";
    };

    // ===== submit create / update =====
    const submitForm = async (e) => {
        e.preventDefault();
        const msg = validateForm();
        if (msg) return toast.error(msg);

        const payloadBase = {
            ho_ten: form.ho_ten.trim(),
            quan_he: form.quan_he.trim(),
            ngay_bat_dau: form.ngay_bat_dau,
            ngay_ket_thuc: form.ngay_ket_thuc,
            ghi_chu: form.ghi_chu?.trim() || undefined,
        };

        const payload = isHR
            ? { ...payloadBase, nhan_vien_id: Number(form.nhan_vien_id) }
            : { ...payloadBase, nhan_vien_id: Number(userInfo?.id) };

        setSaving(true);
        try {
            if (editingId) {
                const row = list.find((x) => x.id === editingId);
                if (!row) throw new Error("Không tìm thấy bản ghi");
                if (!isHR && row.nhan_vien_id !== userInfo?.id) {
                    throw new Error(
                        "Bạn không có quyền cập nhật mục này"
                    );
                }

                await updateNguoiPhuThuoc(editingId, payload);
                toast.success("Cập nhật người phụ thuộc thành công!");
            } else {
                await createNguoiPhuThuoc(payload);
                toast.success("Thêm người phụ thuộc thành công!");
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            const msg =
                err?.data?.errors?.join("; ") ||
                err.userMessage ||
                err.message ||
                "Lỗi lưu dữ liệu";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    // ===== xóa bản ghi =====
    const onDelete = async (row) => {
        if (!isHR && row.nhan_vien_id !== userInfo?.id) {
            return toast.error("Bạn không có quyền xóa mục này");
        }
        if (!window.confirm("Bạn có chắc muốn xóa người phụ thuộc này?"))
            return;
        setLoading(true);
        try {
            await deleteNguoiPhuThuoc(row.id);
            toast.success("Đã xóa!");
            fetchData();
        } catch (err) {
            toast.error(
                err.userMessage ||
                err.message ||
                "Xóa thất bại"
            );
            setLoading(false);
        }
    };

    // ===== hiển thị tên nhân viên trong table =====
    const renderTenNhanVien = (row) => {
        const directName =
            row.ten_nhan_vien ||
            row.tenNhanVien ||
            row.nhan_vien_ho_ten ||
            row.nhan_vien_ten;

        if (directName && directName.trim() !== "") {
            return directName;
        }

        // fallback final
        return row.nhan_vien_id ? `NV #${row.nhan_vien_id}` : "(Không rõ)";
    };

    // ===== handler khi HR chọn nhân viên trong select =====
    const handleChangeNhanVienSelect = (e) => {
        const selectedId = e.target.value;
        const found = nhanVienOptions.find(
            (nv) => String(nv.id) === String(selectedId)
        );

        setForm((prev) => ({
            ...prev,
            nhan_vien_id: selectedId || "",
            ten_nhan_vien: found ? found.ho_ten : "",
        }));
    };

    // ===== Render =====
    return (
        <div
            className="p-4 ps-5"
            style={{
                minHeight: "100vh",
                position: "relative",
            }}
        >
            {/* Toast luôn mounted */}
            <ToastContainer position="top-right" autoClose={2000} />

            {/* Overlay loading kiểu QuanLyDanhGia */}
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

            {/* Header gradient giống danhgia */}
            <div
                className="rounded-4 mb-4 shadow-sm"
                style={{
                    background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                                Quản lý người phụ thuộc
                            </Breadcrumb.Item>
                        </Breadcrumb>
                        <h1 className="fw-bold mb-2">
                            <FaUserFriends className="me-2" />
                            Quản lý Người phụ thuộc
                        </h1>
                        <p className="mb-0 opacity-90">
                            Theo dõi và quản lý người phụ thuộc theo từng
                            nhân viên
                        </p>
                    </div>

                    <Button
                        variant="outline-light"
                        onClick={() => navigate("/")}
                        className="border-0"
                        style={{
                            background:
                                "rgba(255, 255, 255, 0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <FaHome className="me-2" />
                        Trang chủ
                    </Button>
                </div>
            </div>

            {/* Card: Bộ lọc + hành động (giống Filter and Actions Card ở đánh giá) */}
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
                        {/* Tìm theo họ tên người phụ thuộc / quan hệ */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">
                                    Từ khóa
                                </Form.Label>
                                <div className="position-relative">
                                    <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                                    <Form.Control
                                        type="text"
                                        placeholder="Nhập họ tên người phụ thuộc hoặc quan hệ..."
                                        value={q}
                                        onChange={(e) =>
                                            setQ(e.target.value)
                                        }
                                        style={{
                                            paddingLeft: "2.5rem",
                                        }}
                                    />
                                </div>
                            </Form.Group>
                        </Col>

                        {/* Lọc theo ID nhân viên (chỉ HR) */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">
                                    ID Nhân viên
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Nhập ID nhân viên..."
                                    value={nhanVienId}
                                    onChange={(e) =>
                                        setNhanVienId(e.target.value)
                                    }
                                    disabled={!isHR}
                                />
                                {!isHR && (
                                    <Form.Text className="text-muted">
                                        Chỉ phòng nhân sự mới lọc
                                        theo nhân viên khác
                                    </Form.Text>
                                )}
                            </Form.Group>
                        </Col>

                        {/* Lọc theo ngày hiệu lực */}
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">
                                    Hiệu lực tại ngày
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={activeOn}
                                    onChange={(e) =>
                                        setActiveOn(e.target.value)
                                    }
                                />
                            </Form.Group>
                        </Col>

                        <Col
                            md={12}
                            className="d-flex flex-wrap justify-content-end gap-2"
                        >
                            <Button
                                variant="outline-primary"
                                onClick={fetchData}
                                style={{
                                    borderColor: "#667eea",
                                    color: "#667eea",
                                }}
                            >
                                Lọc
                            </Button>

                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setQ("");
                                    setNhanVienId("");
                                    setActiveOn("");
                                    setTimeout(fetchData, 0);
                                }}
                            >
                                Xóa lọc
                            </Button>

                            <Button
                                variant="primary"
                                onClick={openCreate}
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    border: "none",
                                }}
                            >
                                <FaPlus className="me-2" />
                                Thêm người phụ thuộc
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Card: Bảng dữ liệu */}
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
                    <FaUser className="me-2" />
                    Danh sách Người phụ thuộc
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
                                    <th style={{ padding: "12px", fontWeight: "600" }}>#</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Nhân viên ID</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Tên nhân viên</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Người phụ thuộc</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Quan hệ</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Bắt đầu</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Kết thúc</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Ghi chú</th>
                                    <th style={{ padding: "12px", fontWeight: "600" }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="text-center text-muted py-4"
                                        >
                                            <FaUserFriends className="fs-1 mb-2 opacity-50" />
                                            <div>
                                                Không có người phụ thuộc phù
                                                hợp
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((r, i) => {
                                        const canEditOrDelete =
                                            isHR ||
                                            r.nhan_vien_id ===
                                            userInfo?.id;

                                        return (
                                            <tr
                                                key={r.id}
                                                style={{
                                                    transition:
                                                        "all 0.3s ease",
                                                }}
                                            >
                                                <td style={{ padding: "12px" }}>
                                                    {(currentPage - 1) *
                                                        ITEMS_PER_PAGE +
                                                        i +
                                                        1}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {r.nhan_vien_id}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {renderTenNhanVien(r)}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {r.ho_ten}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {r.quan_he}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {(r.ngay_bat_dau || "")
                                                        .slice(0, 10)}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {(r.ngay_ket_thuc || "")
                                                        .slice(0, 10)}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    {r.ghi_chu || ""}
                                                </td>
                                                <td style={{ padding: "12px" }}>
                                                    <div className="d-flex gap-1 flex-wrap">
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEdit(r)
                                                            }
                                                            disabled={
                                                                !canEditOrDelete
                                                            }
                                                            title={
                                                                canEditOrDelete
                                                                    ? "Sửa"
                                                                    : "Bạn không có quyền sửa mục này"
                                                            }
                                                        >
                                                            <FaEdit />
                                                        </Button>

                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() =>
                                                                onDelete(r)
                                                            }
                                                            disabled={
                                                                !canEditOrDelete
                                                            }
                                                            title={
                                                                canEditOrDelete
                                                                    ? "Xóa"
                                                                    : "Bạn không có quyền xóa mục này"
                                                            }
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
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

            {/* Pagination card kiểu danhgia */}
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

            {/* Modal thêm/sửa (style header gradient giống Quản lý đánh giá) */}
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                centered
                size="lg"
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
                        {editingId
                            ? "Cập nhật người phụ thuộc"
                            : "Thêm người phụ thuộc"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={submitForm}>
                        <div className="row g-3">
                            {/* Nhân viên */}
                            <div className="col-md-6">
                                <Form.Group className="mb-2">
                                    <Form.Label className="fw-semibold">
                                        Nhân viên *
                                    </Form.Label>

                                    {isHR ? (
                                        <Form.Select
                                            value={
                                                form.nhan_vien_id || ""
                                            }
                                            onChange={
                                                handleChangeNhanVienSelect
                                            }
                                        >
                                            <option value="">
                                                -- Chọn nhân viên --
                                            </option>
                                            {nhanVienOptions.map((nv) => (
                                                <option
                                                    key={nv.id}
                                                    value={nv.id}
                                                >
                                                    {nv.ho_ten} (ID{" "}
                                                    {nv.id})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    ) : (
                                        <>
                                            <Form.Control
                                                type="text"
                                                value={
                                                    userInfo?.ho_ten ||
                                                    form.ten_nhan_vien
                                                }
                                                disabled
                                            />
                                            <small className="text-muted">
                                                ID: {userInfo?.id}
                                            </small>
                                        </>
                                    )}
                                </Form.Group>
                            </div>

                            {/* Quan hệ */}
                            <div className="col-md-6">
                                <Form.Group className="mb-2">
                                    <Form.Label className="fw-semibold">
                                        Quan hệ *
                                    </Form.Label>
                                    <Form.Control
                                        value={form.quan_he}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                quan_he:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="Mẹ, Bố, Con,..."
                                    />
                                </Form.Group>
                            </div>

                            {/* Họ tên người phụ thuộc */}
                            <div className="col-md-6">
                                <Form.Group className="mb-2">
                                    <Form.Label className="fw-semibold">
                                        Họ tên người phụ thuộc *
                                    </Form.Label>
                                    <Form.Control
                                        value={form.ho_ten}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ho_ten:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="VD: Nguyễn Thị B"
                                    />
                                </Form.Group>
                            </div>

                            {/* Ngày bắt đầu */}
                            <div className="col-md-3">
                                <Form.Group className="mb-2">
                                    <Form.Label className="fw-semibold">
                                        Ngày bắt đầu *
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={
                                            form.ngay_bat_dau
                                        }
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ngay_bat_dau:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                            </div>

                            {/* Ngày kết thúc */}
                            <div className="col-md-3">
                                <Form.Group className="mb-2">
                                    <Form.Label className="fw-semibold">
                                        Ngày kết thúc *
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={
                                            form.ngay_ket_thuc
                                        }
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ngay_ket_thuc:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                            </div>

                            {/* Ghi chú */}
                            <div className="col-md-12">
                                <Form.Group>
                                    <Form.Label className="fw-semibold">
                                        Ghi chú
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={form.ghi_chu}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                ghi_chu:
                                                    e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    setShowModal(false)
                                }
                            >
                                Đóng
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                                style={{
                                    background:
                                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    border: "none",
                                }}
                            >
                                {saving
                                    ? "Đang lưu..."
                                    : editingId
                                        ? "Cập nhật"
                                        : "Tạo mới"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default QuanLyNguoiPhuThuoc;
