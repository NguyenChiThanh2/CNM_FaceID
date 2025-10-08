// src/components/nhansu/ChungChiModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Table, Row, Col, Spinner, Form } from "react-bootstrap";
import { toast } from "react-toastify";

const ChungChiModal = ({ show, onHide, nhanVien, onChanged }) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";
  const STATIC_BASE =
    import.meta.env.VITE_STATIC_BASE_URL ||
    (API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE) + "/static";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ten: "",
    loai: "certificate",
    to_chuc_cap: "",
    ngay_cap: "",
    ngay_het_han: "",
    xep_loai: "",
    diem_so: "",
    ghi_chu: "",
    credential_id: "",
    credential_url: "",
    tep: null,
  });

  const loadData = useCallback(async () => {
    if (!nhanVien?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/nhan_vien/${nhanVien.id}/chung_chi`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được danh sách chứng chỉ!");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, nhanVien?.id]);

  useEffect(() => {
    if (show) loadData();
  }, [show, loadData]);

  const onInput = (e) => {
    const { name, value, files } = e.target;
    if (name === "tep") setForm((f) => ({ ...f, tep: files?.[0] || null }));
    else setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.ten.trim()) return toast.error("Tên chứng chỉ/bằng cấp là bắt buộc!");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
      const res = await fetch(`${API_BASE}/nhan_vien/${nhanVien.id}/chung_chi`, { method: "POST", body: fd });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message || "Tạo chứng chỉ thất bại!");
      }
      toast.success("Đã thêm chứng chỉ!");
      setForm({
        ten: "", loai: "certificate", to_chuc_cap: "", ngay_cap: "", ngay_het_han: "",
        xep_loai: "", diem_so: "", ghi_chu: "", credential_id: "", credential_url: "", tep: null,
      });
      await loadData();
      onChanged && onChanged();
    } catch (e) {
      toast.error(e.message || "Lỗi lưu chứng chỉ!");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (ccId) => {
    if (!window.confirm("Xóa chứng chỉ này?")) return;
    try {
      const res = await fetch(`${API_BASE}/chung_chi/${ccId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa chứng chỉ thất bại!");
      toast.success("Đã xóa!");
      await loadData();
      onChanged && onChanged();
    } catch (e) {
      toast.error(e.message || "Lỗi xóa chứng chỉ!");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chứng chỉ & Bằng cấp — {nhanVien?.ho_ten}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h6 className="mb-3">Thêm mới</h6>
        <Form onSubmit={onSubmit} className="border rounded p-3 mb-4">
          <Row className="g-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tên *</Form.Label>
                <Form.Control name="ten" value={form.ten} onChange={onInput} placeholder="VD: IELTS 7.0 / AWS CCP" />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Loại</Form.Label>
                <Form.Select name="loai" value={form.loai} onChange={onInput}>
                  <option value="certificate">Chứng chỉ</option>
                  <option value="degree">Bằng cấp</option>
                  <option value="license">Giấy phép</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tổ chức cấp</Form.Label>
                <Form.Control name="to_chuc_cap" value={form.to_chuc_cap} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Ngày cấp</Form.Label>
                <Form.Control type="date" name="ngay_cap" value={form.ngay_cap} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Hết hạn</Form.Label>
                <Form.Control type="date" name="ngay_het_han" value={form.ngay_het_han} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Xếp loại</Form.Label>
                <Form.Control name="xep_loai" value={form.xep_loai} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Điểm số</Form.Label>
                <Form.Control name="diem_so" value={form.diem_so} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>URL xác thực (nếu có)</Form.Label>
                <Form.Control name="credential_url" value={form.credential_url} onChange={onInput} placeholder="https://..." />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mã xác thực (nếu có)</Form.Label>
                <Form.Control name="credential_id" value={form.credential_id} onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>File (pdf/png/jpg/jpeg)</Form.Label>
                <Form.Control type="file" name="tep" accept=".pdf,.png,.jpg,.jpeg" onChange={onInput} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Ghi chú</Form.Label>
                <Form.Control as="textarea" rows={1} name="ghi_chu" value={form.ghi_chu} onChange={onInput} />
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-3 text-end">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu chứng chỉ"}
            </Button>
          </div>
        </Form>

        <h6 className="mb-2">Danh sách chứng chỉ</h6>
        {loading ? (
          <div className="text-center my-3"><Spinner animation="border" /></div>
        ) : items.length === 0 ? (
          <div className="text-muted">Chưa có chứng chỉ.</div>
        ) : (
          <div className="table-responsive">
            <Table bordered hover className="bg-white">
              <thead className="table-light">
                <tr>
                  <th>Tên</th>
                  <th>Loại</th>
                  <th>Tổ chức</th>
                  <th>Ngày cấp</th>
                  <th>Hết hạn</th>
                  <th>Tệp</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((cc) => {
                  const isExpired = cc.ngay_het_han && new Date(cc.ngay_het_han) < new Date();
                  return (
                    <tr key={cc.id} className={isExpired ? "table-danger" : ""}>
                      <td>
                        <div className="fw-semibold">{cc.ten}</div>
                        {cc.credential_url && (
                          <a href={cc.credential_url} target="_blank" rel="noreferrer">Xác thực</a>
                        )}
                        {cc.xep_loai && <div className="text-muted">Xếp loại: {cc.xep_loai}</div>}
                        {cc.diem_so && <div className="text-muted">Điểm: {cc.diem_so}</div>}
                      </td>
                      <td>{cc.loai}</td>
                      <td>{cc.to_chuc_cap || ""}</td>
                      <td>{cc.ngay_cap ? new Date(cc.ngay_cap).toLocaleDateString("vi-VN") : ""}</td>
                      <td>{cc.ngay_het_han ? new Date(cc.ngay_het_han).toLocaleDateString("vi-VN") : ""}</td>
                      <td>
                        {cc.tep_dinh_kem ? (
                          <a href={`${STATIC_BASE}/${cc.tep_dinh_kem}`} target="_blank" rel="noreferrer">Xem tệp</a>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-danger" onClick={() => onDelete(cc.id)}>Xóa</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" onClick={onHide}>Đóng</Button></Modal.Footer>
    </Modal>
  );
};

export default ChungChiModal;
