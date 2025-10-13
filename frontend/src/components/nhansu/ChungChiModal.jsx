// src/components/nhansu/ChungChiModal.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Modal, Button, Table, Row, Col, Spinner, Form, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { getChungChiByNhanVienId, createChungChi, deleteChungChi } from "../../services/chungChiApi";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = [ "application/pdf", "image/png", "image/jpeg" ];

const ChungChiModal = ({ show, onHide, nhanVien, onChanged }) => {
  const API_BASE = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api",
    []
  );
  const STATIC_BASE = useMemo(() => {
    const envStatic = import.meta.env.VITE_STATIC_BASE_URL;
    if (envStatic) return envStatic;
    return (API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE) + "/static";
  }, [API_BASE]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState(null);

  const aliveRef = useRef(true);

  const fmtDateVI = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

  const resetForm = useCallback(() => {
    setForm({
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
  }, []);

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

  // Validate cơ bản
  const isValidUrl = (u) => {
    if (!u) return true;
    try { new URL(u); return true; } catch { return false; }
  };
  const isFormValid = useMemo(() => {
    if (!form.ten.trim()) return false;
    if (!isValidUrl(form.credential_url)) return false;
    if (form.tep) {
      if (!ALLOWED_TYPES.includes(form.tep.type)) return false;
      if (form.tep.size > MAX_FILE_SIZE) return false;
    }
    return true;
  }, [form]);

  const loadData = useCallback(async () => {
    if (!nhanVien?.id) return;
    setLoading(true);
    try {
      const data = await getChungChiByNhanVienId(nhanVien.id);
      if (!aliveRef.current) return;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Không tải được danh sách chứng chỉ!");
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [nhanVien?.id]);

  useEffect(() => {
    if (!show) return;
    aliveRef.current = true;
    loadData();
    return () => { aliveRef.current = false; };
  }, [show, loadData]);

  const onInput = useCallback((e) => {
    const { name, value, files } = e.target;
    if (name === "tep") {
      const file = files?.[0] || null;
      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error("Định dạng tệp không hợp lệ (chỉ pdf/png/jpg/jpeg).");
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error("Dung lượng tệp vượt 8MB.");
          return;
        }
      }
      setForm((f) => ({ ...f, tep: file }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }
    if (!nhanVien?.id) return;

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
      await createChungChi(nhanVien.id, fd);
      toast.success("Đã thêm chứng chỉ!");
      resetForm();
      await loadData();
      onChanged && onChanged();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Lỗi lưu chứng chỉ!");
    } finally {
      setSaving(false);
    }
  }, [form, isFormValid, nhanVien?.id, loadData, onChanged, resetForm]);

  const onDelete = useCallback(async (ccId) => {
    if (!window.confirm("Xóa chứng chỉ này?")) return;
    try {
      await deleteChungChi(ccId);
      toast.success("Đã xóa!");
      await loadData();
      onChanged && onChanged();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Lỗi xóa chứng chỉ!");
    }
  }, [loadData, onChanged]);

  // Helper hiển thị ô nhãn/giá trị theo lưới 2 cột
  const DetailItem = ({ label, children }) => (
    <div className="mb-2">
      <div className="text-muted small">{label}</div>
      <div style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{children || "—"}</div>
    </div>
  );

  const renderLoaiBadge = (loai) => {
    const map = {
      certificate: "info",
      degree: "success",
      license: "secondary",
    };
    return <Badge bg={map[loai] || "primary"}>{loai || "—"}</Badge>;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chứng chỉ & Bằng cấp — {nhanVien?.ho_ten || "—"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <h6 className="mb-3">Thêm mới</h6>
        <Form onSubmit={onSubmit} className="border rounded p-3 mb-4">
          <Row className="g-2">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tên *</Form.Label>
                <Form.Control
                  name="ten"
                  value={form.ten}
                  onChange={onInput}
                  placeholder="VD: IELTS 7.0 / AWS CCP"
                  required
                />
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
                <Form.Control
                  name="credential_url"
                  value={form.credential_url}
                  onChange={onInput}
                  placeholder="https://..."
                  isInvalid={!!form.credential_url && !isValidUrl(form.credential_url)}
                />
                <Form.Control.Feedback type="invalid">
                  URL không hợp lệ.
                </Form.Control.Feedback>
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
                {form.tep && (
                  <div className="small text-muted mt-1">
                    Tệp: {form.tep.name} ({Math.round(form.tep.size / 1024)} KB)
                  </div>
                )}
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
            <Button type="submit" variant="primary" disabled={saving || !isFormValid}>
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
                  const opened = openId === cc.id;
                  return (
                    <React.Fragment key={cc.id}>
                      <tr className={isExpired ? "table-danger" : ""}>
                        <td>
                          <div className="fw-semibold">{cc.ten || "—"}</div>
                          {cc.credential_url && (
                            <a href={cc.credential_url} target="_blank" rel="noreferrer">Xác thực</a>
                          )}
                          {cc.xep_loai && <div className="text-muted">Xếp loại: {cc.xep_loai}</div>}
                          {cc.diem_so && <div className="text-muted">Điểm: {cc.diem_so}</div>}
                        </td>
                        <td>{renderLoaiBadge(cc.loai)}</td>
                        <td>{cc.to_chuc_cap || "—"}</td>
                        <td>{fmtDateVI(cc.ngay_cap)}</td>
                        <td>
                          {fmtDateVI(cc.ngay_het_han)}
                          {isExpired && <span className="ms-1 badge bg-danger">Hết hạn</span>}
                        </td>
                        <td>
                          {cc.tep_dinh_kem ? (
                            <a href={`${STATIC_BASE}/${cc.tep_dinh_kem}`} target="_blank" rel="noreferrer">Xem tệp</a>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant={opened ? "secondary" : "outline-secondary"}
                            className="me-2"
                            onClick={() => setOpenId(opened ? null : cc.id)}
                          >
                            {opened ? "Ẩn chi tiết" : "Chi tiết"}
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => onDelete(cc.id)}>Xóa</Button>
                        </td>
                      </tr>

                      {opened && (
                        <tr>
                          <td colSpan={7} className="bg-light">
                            {/* Card chi tiết – lưới 2 cột, auto xuống 1 cột ở màn nhỏ */}
                            <div style={{ overflowX: "auto" }}>
                              <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                  <Row className="g-3">
                                    <Col md={6}>
                                      <DetailItem label="Tên đầy đủ">{cc.ten}</DetailItem>
                                    </Col>
                                    <Col md={6}>
                                      <DetailItem label="Loại">{cc.loai}</DetailItem>
                                    </Col>

                                    <Col md={6}>
                                      <DetailItem label="Tổ chức cấp">{cc.to_chuc_cap}</DetailItem>
                                    </Col>
                                    <Col md={6}>
                                      <DetailItem label="Xếp loại">{cc.xep_loai}</DetailItem>
                                    </Col>

                                    <Col md={6}>
                                      <DetailItem label="Ngày cấp">{fmtDateVI(cc.ngay_cap)}</DetailItem>
                                    </Col>
                                    <Col md={6}>
                                      <DetailItem label="Ngày hết hạn">{fmtDateVI(cc.ngay_het_han)}</DetailItem>
                                    </Col>

                                    <Col md={6}>
                                      <DetailItem label="Điểm số">{cc.diem_so}</DetailItem>
                                    </Col>
                                    <Col md={6}>
                                      <DetailItem label="Mã xác thực">{cc.credential_id}</DetailItem>
                                    </Col>

                                    <Col md={12}>
                                      <DetailItem label="URL xác thực">
                                        {cc.credential_url ? (
                                          <a href={cc.credential_url} target="_blank" rel="noreferrer">
                                            {cc.credential_url}
                                          </a>
                                        ) : null}
                                      </DetailItem>
                                    </Col>

                                    <Col md={12}>
                                      <DetailItem label="Ghi chú">{cc.ghi_chu}</DetailItem>
                                    </Col>

                                    <Col md={12}>
                                      <DetailItem label="Tệp đính kèm">
                                        {cc.tep_dinh_kem ? (
                                          <a
                                            href={`${STATIC_BASE}/${cc.tep_dinh_kem}`}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            {cc.tep_dinh_kem}
                                          </a>
                                        ) : null}
                                      </DetailItem>
                                    </Col>
                                  </Row>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChungChiModal;
