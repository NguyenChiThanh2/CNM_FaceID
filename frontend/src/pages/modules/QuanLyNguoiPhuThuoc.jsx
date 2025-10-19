// src/pages/modules/QuanLyNguoiPhuThuoc.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, Breadcrumb, Button, Modal, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Loading from "../../components/Loading";
import {
    listNguoiPhuThuoc,
    createNguoiPhuThuoc,
    updateNguoiPhuThuoc,
    deleteNguoiPhuThuoc,
} from "../../services/nguoiPhuThuocApi";

const ITEMS_PER_PAGE = 10;
const HR_DEPARTMENT_ID = 2; // 👈 chỉnh theo ID phòng Nhân sự thực tế

const initForm = {
    nhan_vien_id: "",
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
            role: parsed.role?.ma_vai_tro || "user",
        };
    } catch {
        return null;
    }
};

const QuanLyNguoiPhuThuoc = () => {
    const navigate = useNavigate();

    // user & quyền
    const userInfo = getUserInfo();
    const isHR = !!userInfo && userInfo.phong_ban_id === HR_DEPARTMENT_ID;

    // state chính
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const modalTitle = useMemo(
        () => (editingId ? "Chỉnh sửa người phụ thuộc" : "Thêm người phụ thuộc"),
        [editingId]
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {};
            if (q) params.q = q;
            if (nhanVienId) params.nhan_vien_id = Number(nhanVienId);
            if (activeOn) params.active_on = activeOn;

            let data = await listNguoiPhuThuoc(params);
            data = Array.isArray(data) ? data : [];

            // 🔐 Non-HR chỉ xem của chính mình
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
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, []);

    // filter theo q (họ tên/quan hệ)
    const filtered = useMemo(() => {
        const kw = (q || "").toLowerCase();
        return (list || []).filter((it) => {
            const ten = (it.ho_ten || "").toLowerCase();
            const quanhe = (it.quan_he || "").toLowerCase();
            return !kw || ten.includes(kw) || quanhe.includes(kw);
        });
    }, [list, q]);

    // phân trang FE
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const currentItems = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const openCreate = () => {
        setEditingId(null);
        // 🔐 Non-HR: auto bind nhân viên ID & khóa field
        setForm({
            ...initForm,
            nhan_vien_id: isHR ? "" : userInfo?.id || "",
        });
        setShowModal(true);
    };

    const openEdit = (row) => {
        // 🔐 chặn non-HR sửa item không phải của họ
        if (!isHR && row.nhan_vien_id !== userInfo?.id) {
            return toast.error("Bạn không có quyền sửa mục này");
        }
        setEditingId(row.id);
        setForm({
            nhan_vien_id: row.nhan_vien_id ?? "",
            ho_ten: row.ho_ten ?? "",
            quan_he: row.quan_he ?? "",
            ngay_bat_dau: (row.ngay_bat_dau || "").slice(0, 10),
            ngay_ket_thuc: (row.ngay_ket_thuc || "").slice(0, 10),
            ghi_chu: row.ghi_chu ?? "",
        });
        setShowModal(true);
    };

    const validateForm = () => {
        if (!String(form.nhan_vien_id).trim()) return "Vui lòng nhập Nhân viên ID";
        if (!form.ho_ten.trim()) return "Vui lòng nhập họ tên";
        if (!form.quan_he.trim()) return "Vui lòng nhập quan hệ";
        if (!form.ngay_bat_dau) return "Vui lòng chọn ngày bắt đầu";
        if (!form.ngay_ket_thuc) return "Vui lòng chọn ngày kết thúc";
        if (form.ngay_bat_dau > form.ngay_ket_thuc)
            return "Ngày bắt đầu phải <= ngày kết thúc";
        return "";
    };

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

        // 🔐 Non-HR luôn ép nhan_vien_id = user đang đăng nhập
        const payload = isHR
            ? { ...payloadBase, nhan_vien_id: Number(form.nhan_vien_id) }
            : { ...payloadBase, nhan_vien_id: Number(userInfo?.id) };

        setSaving(true);
        try {
            if (editingId) {
                // 🔐 chặn non-HR update item không phải của họ (double-check FE)
                const row = list.find((x) => x.id === editingId);
                if (!row) throw new Error("Không tìm thấy bản ghi");
                if (!isHR && row.nhan_vien_id !== userInfo?.id) {
                    throw new Error("Bạn không có quyền cập nhật mục này");
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
            toast.error(
                err?.data?.errors?.join("; ") ||
                err.userMessage ||
                err.message ||
                "Lỗi lưu dữ liệu"
            );
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (row) => {
        // 🔐 chặn non-HR xoá item không phải của họ
        if (!isHR && row.nhan_vien_id !== userInfo?.id) {
            return toast.error("Bạn không có quyền xóa mục này");
        }
        if (!window.confirm("Bạn có chắc muốn xóa người phụ thuộc này?")) return;
        setLoading(true);
        try {
            await deleteNguoiPhuThuoc(row.id);
            toast.success("Đã xóa!");
            fetchData();
        } catch (err) {
            toast.error(err.userMessage || err.message || "Xóa thất bại");
            setLoading(false);
        }
    };

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
                        <Breadcrumb.Item active>Quản lý người phụ thuộc</Breadcrumb.Item>
                    </Breadcrumb>

                    <Button variant="secondary" onClick={() => navigate("/")}>
                        ← Trang chủ
                    </Button>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="text-center flex-grow-1">Quản lý người phụ thuộc</h2>
                    </div>

                    {/* Bộ lọc: Non-HR có thể lọc thêm theo ngày, nhưng thường không cần lọc theo nhân viên */}
                    <div className="row mb-3">
                        <div className="col-md-4 mb-2">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="🔍 Tìm theo họ tên hoặc quan hệ..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <div className="col-md-4 mb-2">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Nhân viên ID"
                                value={nhanVienId}
                                onChange={(e) => setNhanVienId(e.target.value)}
                                disabled={!isHR} // 🔐 chỉ HR mới lọc theo nhân viên
                            />
                        </div>

                        <div className="col-md-4 mb-2">
                            <input
                                type="date"
                                className="form-control"
                                placeholder="Hiệu lực tại ngày"
                                value={activeOn}
                                onChange={(e) => setActiveOn(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mb-3 gap-2">
                        <button className="btn btn-outline-primary px-4" onClick={fetchData}>
                            Lọc
                        </button>
                        <button
                            className="btn btn-outline-secondary px-4"
                            onClick={() => {
                                setQ("");
                                setNhanVienId("");
                                setActiveOn("");
                                setTimeout(fetchData, 0);
                            }}
                        >
                            Xóa lọc
                        </button>

                        {/* 🔐 Non-HR vẫn được thêm nhưng sẽ tự gán nhan_vien_id = chính họ */}
                        <button className="btn btn-outline-success px-4" onClick={openCreate}>
                            + Thêm người phụ thuộc
                        </button>
                    </div>

                    <div className="table-responsive" style={{ overflowX: "auto" }}>
                        <Table bordered hover striped className="rounded text-nowrap">
                            <thead className="table-dark text-center">
                                <tr>
                                    <th>#</th>
                                    <th>Nhân viên ID</th>
                                    <th>Họ tên</th>
                                    <th>Quan hệ</th>
                                    <th>Bắt đầu</th>
                                    <th>Kết thúc</th>
                                    <th>Ghi chú</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((r, i) => {
                                        const canEditOrDelete =
                                            isHR || r.nhan_vien_id === userInfo?.id;
                                        return (
                                            <tr key={r.id}>
                                                <td>{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                                                <td>{r.nhan_vien_id}</td>
                                                <td>{r.ho_ten}</td>
                                                <td>{r.quan_he}</td>
                                                <td>{(r.ngay_bat_dau || "").slice(0, 10)}</td>
                                                <td>{(r.ngay_ket_thuc || "").slice(0, 10)}</td>
                                                <td>{r.ghi_chu || ""}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning me-1"
                                                        onClick={() => openEdit(r)}
                                                        disabled={!canEditOrDelete}
                                                        title={
                                                            canEditOrDelete
                                                                ? "Sửa"
                                                                : "Bạn không có quyền sửa mục này"
                                                        }
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => onDelete(r)}
                                                        disabled={!canEditOrDelete}
                                                        title={
                                                            canEditOrDelete
                                                                ? "Xóa"
                                                                : "Bạn không có quyền xóa mục này"
                                                        }
                                                    >
                                                        🗑 Xóa
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted">
                                            Không có người phụ thuộc nào phù hợp
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                            <Button
                                variant="outline-secondary"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                ← Trang Trước
                            </Button>
                            <span>
                                Trang {currentPage}/{totalPages}
                            </span>
                            <Button
                                variant="outline-secondary"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                Trang Sau →
                            </Button>
                        </div>
                    )}

                    {/* Modal thêm/sửa */}
                    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                        <Modal.Header closeButton>
                            <Modal.Title>{modalTitle}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={submitForm}>
                                <div className="row g-2">
                                    <div className="col-md-6">
                                        <Form.Group className="mb-2">
                                            <Form.Label>Nhân viên ID *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={form.nhan_vien_id}
                                                onChange={(e) =>
                                                    setForm({ ...form, nhan_vien_id: e.target.value })
                                                }
                                                disabled={!isHR} // 🔐 non-HR không sửa được ID
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Group className="mb-2">
                                            <Form.Label>Quan hệ *</Form.Label>
                                            <Form.Control
                                                value={form.quan_he}
                                                onChange={(e) =>
                                                    setForm({ ...form, quan_he: e.target.value })
                                                }
                                                placeholder="Mẹ, Bố, Con,..."
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-12">
                                        <Form.Group className="mb-2">
                                            <Form.Label>Họ tên *</Form.Label>
                                            <Form.Control
                                                value={form.ho_ten}
                                                onChange={(e) =>
                                                    setForm({ ...form, ho_ten: e.target.value })
                                                }
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Group className="mb-2">
                                            <Form.Label>Ngày bắt đầu *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={form.ngay_bat_dau}
                                                onChange={(e) =>
                                                    setForm({ ...form, ngay_bat_dau: e.target.value })
                                                }
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-6">
                                        <Form.Group className="mb-2">
                                            <Form.Label>Ngày kết thúc *</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={form.ngay_ket_thuc}
                                                onChange={(e) =>
                                                    setForm({ ...form, ngay_ket_thuc: e.target.value })
                                                }
                                            />
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-12">
                                        <Form.Group>
                                            <Form.Label>Ghi chú</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={form.ghi_chu}
                                                onChange={(e) =>
                                                    setForm({ ...form, ghi_chu: e.target.value })
                                                }
                                            />
                                        </Form.Group>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-end gap-2 mt-3">
                                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                                        Đóng
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={saving}>
                                        {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                                    </Button>
                                </div>
                            </Form>
                        </Modal.Body>
                    </Modal>
                </div>
            </div>
        </div>
    );
};

export default QuanLyNguoiPhuThuoc;
