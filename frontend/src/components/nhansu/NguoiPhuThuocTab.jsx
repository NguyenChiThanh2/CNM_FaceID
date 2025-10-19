// =============================================
// File: src/components/nhansu/NguoiPhuThuocTab.jsx
// Tab nhúng vào trang chi tiết nhân sự: nhận nhanVienId, CRUD theo nhân viên đó
// =============================================
import React, { useEffect, useState } from "react";
import { Button, Table, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
    listNguoiPhuThuoc,
    createNguoiPhuThuoc,
    updateNguoiPhuThuoc,
    deleteNguoiPhuThuoc,
} from "../../services/nguoiPhuThuocApi";

const initItem = { ho_ten: "", quan_he: "", ngay_bat_dau: "", ngay_ket_thuc: "", ghi_chu: "" };

export function NguoiPhuThuocTab({ nhanVienId }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [item, setItem] = useState(initItem);

    const load = async () => {
        if (!nhanVienId) return;
        try {
            setLoading(true);
            const data = await listNguoiPhuThuoc({ nhan_vien_id: nhanVienId });
            setRows(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.userMessage || err.message || "Lỗi tải người phụ thuộc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [nhanVienId]);

    const openCreate = () => {
        setEditingId(null);
        setItem(initItem);
        setShow(true);
    };

    const openEdit = (r) => {
        setEditingId(r.id);
        setItem({
            ho_ten: r.ho_ten || "",
            quan_he: r.quan_he || "",
            ngay_bat_dau: (r.ngay_bat_dau || "").slice(0, 10),
            ngay_ket_thuc: (r.ngay_ket_thuc || "").slice(0, 10),
            ghi_chu: r.ghi_chu || "",
        });
        setShow(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!item.ho_ten.trim()) return toast.error("Vui lòng nhập họ tên");
        if (!item.quan_he.trim()) return toast.error("Vui lòng nhập quan hệ");
        if (!item.ngay_bat_dau) return toast.error("Vui lòng chọn ngày bắt đầu");
        if (!item.ngay_ket_thuc) return toast.error("Vui lòng chọn ngày kết thúc");
        if (item.ngay_bat_dau > item.ngay_ket_thuc) return toast.error("Ngày bắt đầu phải <= ngày kết thúc");

        try {
            setSaving(true);
            if (editingId) {
                await updateNguoiPhuThuoc(editingId, { ...item, nhan_vien_id: nhanVienId });
                toast.success("Cập nhật thành công");
            } else {
                await createNguoiPhuThuoc({ ...item, nhan_vien_id: nhanVienId });
                toast.success("Tạo mới thành công");
            }
            setShow(false);
            load();
        } catch (err) {
            const msg = err?.data?.errors?.join("; ") || err.userMessage || err.message || "Lỗi lưu dữ liệu";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const onDelete = async (id) => {
        if (!window.confirm("Xóa người phụ thuộc này?")) return;
        try {
            await deleteNguoiPhuThuoc(id);
            toast.success("Đã xóa");
            load();
        } catch (err) {
            toast.error(err.userMessage || err.message || "Xóa thất bại");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Người phụ thuộc</strong>
                <Button size="sm" onClick={openCreate}>Thêm</Button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-4"><Spinner animation="border" /></div>
            ) : (
                <Table size="sm" bordered hover responsive>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Họ tên</th>
                            <th>Quan hệ</th>
                            <th>Bắt đầu</th>
                            <th>Kết thúc</th>
                            <th>Ghi chú</th>
                            <th style={{ width: 120 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7} className="text-center">Chưa có người phụ thuộc</td></tr>
                        ) : (
                            rows.map((r, i) => (
                                <tr key={r.id}>
                                    <td>{i + 1}</td>
                                    <td>{r.ho_ten}</td>
                                    <td>{r.quan_he}</td>
                                    <td>{(r.ngay_bat_dau || "").slice(0, 10)}</td>
                                    <td>{(r.ngay_ket_thuc || "").slice(0, 10)}</td>
                                    <td>{r.ghi_chu || ""}</td>
                                    <td className="d-flex gap-1">
                                        <Button size="sm" variant="warning" onClick={() => openEdit(r)}>Sửa</Button>
                                        <Button size="sm" variant="danger" onClick={() => onDelete(r.id)}>Xóa</Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            )}

            <Modal show={show} onHide={() => setShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? "Cập nhật" : "Thêm mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={submit}>
                        <Form.Group className="mb-2">
                            <Form.Label>Họ tên *</Form.Label>
                            <Form.Control value={item.ho_ten} onChange={(e) => setItem({ ...item, ho_ten: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Quan hệ *</Form.Label>
                            <Form.Control value={item.quan_he} onChange={(e) => setItem({ ...item, quan_he: e.target.value })} placeholder="Mẹ, Bố, Con,..." />
                        </Form.Group>
                        <div className="d-flex gap-2">
                            <Form.Group className="mb-2 flex-fill">
                                <Form.Label>Bắt đầu *</Form.Label>
                                <Form.Control type="date" value={item.ngay_bat_dau} onChange={(e) => setItem({ ...item, ngay_bat_dau: e.target.value })} />
                            </Form.Group>
                            <Form.Group className="mb-2 flex-fill">
                                <Form.Label>Kết thúc *</Form.Label>
                                <Form.Control type="date" value={item.ngay_ket_thuc} onChange={(e) => setItem({ ...item, ngay_ket_thuc: e.target.value })} />
                            </Form.Group>
                        </div>
                        <Form.Group>
                            <Form.Label>Ghi chú</Form.Label>
                            <Form.Control as="textarea" rows={3} value={item.ghi_chu} onChange={(e) => setItem({ ...item, ghi_chu: e.target.value })} />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="secondary" onClick={() => setShow(false)}>Hủy</Button>
                            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}</Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
