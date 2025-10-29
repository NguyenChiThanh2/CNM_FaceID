import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Modal,
  Button,
  Table,
  Row,
  Col,
  Spinner,
  Form,
  Badge,
  Card,
} from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getChungChiByNhanVienId,
  createChungChi,
  deleteChungChi,
} from "../../services/chungChiApi";
import { FaCertificate } from "react-icons/fa";
import { getNhanVienInfo } from "../../utils/auth";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const HR_DEPARTMENT_ID = 2; // giống logic trong QuanLyNhanSu

const ChungChiModal = ({ show, onHide, nhanVien, onChanged }) => {
  // ===== CURRENT USER & QUYỀN =====
  const currentUser = getNhanVienInfo();
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  // Nhân viên thường chỉ được xem chứng chỉ của CHÍNH HỌ
  // -> cho phép xem nếu là HR hoặc cùng ID
  const canViewCertificates =
    isHR || (currentUser && nhanVien && currentUser.id === nhanVien.id);

  // Quyền thêm / xóa chứng chỉ:
  // Theo yêu cầu: chỉ HR được thêm / xóa
  const canManageCertificates = isHR;

  // ====== BASE URLS ======
  const API_BASE = useMemo(
    () =>
      import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api",
    []
  );

  // STATIC_BASE: nơi trả file đính kèm
  const STATIC_BASE = useMemo(() => {
    const envStatic = import.meta.env.VITE_STATIC_BASE_URL;
    if (envStatic) return envStatic;
    return (
      (API_BASE.endsWith("/api")
        ? API_BASE.slice(0, -4)
        : API_BASE) + "/static"
    );
  }, [API_BASE]);

  // ====== STATE ======
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState(null);

  const aliveRef = useRef(true);

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

  // ====== HELPERS ======
  const fmtDateVI = (d) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "";

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

  const isValidUrl = (u) => {
    if (!u) return true;
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
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

  // Badge loại chứng chỉ
  const renderLoaiBadge = (loai) => {
    const map = {
      certificate: "info",
      degree: "success",
      license: "secondary",
    };
    return (
      <Badge bg={map[loai] || "primary"} className="text-uppercase">
        {loai || "—"}
      </Badge>
    );
  };

  // Row detail item (label/value)
  const DetailItem = ({ label, children }) => (
    <div className="mb-2">
      <div className="text-muted small">{label}</div>
      <div
        style={{
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }}
      >
        {children || "—"}
      </div>
    </div>
  );

  // ====== LOAD DATA ======
  const loadData = useCallback(async () => {
    if (!nhanVien?.id) return;
    // Nếu người dùng không có quyền xem => không gọi API
    if (!canViewCertificates) return;

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
  }, [nhanVien?.id, canViewCertificates]);

  useEffect(() => {
    if (!show) return;
    aliveRef.current = true;
    loadData();
    return () => {
      aliveRef.current = false;
    };
  }, [show, loadData]);

  // ====== FORM HANDLERS ======
  const onInput = useCallback(
    (e) => {
      const { name, value, files } = e.target;
      if (name === "tep") {
        const file = files?.[0] || null;
        if (file) {
          if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error(
              "Định dạng tệp không hợp lệ (chỉ pdf/png/jpg/jpeg)."
            );
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
    },
    []
  );

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isFormValid) {
        toast.error("Vui lòng kiểm tra lại thông tin nhập.");
        return;
      }
      if (!nhanVien?.id) return;
      // Chặn submit nếu không có quyền quản lý (non-HR)
      if (!canManageCertificates) {
        toast.error("Bạn không có quyền thêm chứng chỉ.");
        return;
      }

      setSaving(true);
      try {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            fd.append(k, v);
          }
        });

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
    },
    [
      form,
      isFormValid,
      nhanVien?.id,
      canManageCertificates,
      loadData,
      onChanged,
      resetForm,
    ]
  );

  const onDelete = useCallback(
    async (ccId) => {
      if (!canManageCertificates) {
        toast.error("Bạn không có quyền xóa chứng chỉ.");
        return;
      }
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
    },
    [canManageCertificates, loadData, onChanged]
  );

  // ====== RENDER ======

  // Nếu nhân viên không được xem (ví dụ: nhân viên A cố mở chứng chỉ nhân viên B và không phải HR)
  // => show modal vẫn mở nhưng nội dung sẽ báo không có quyền
  const noPermissionView =
    show && nhanVien && !canViewCertificates;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="rounded-4"
    >
      {/* Header gradient tím cho đồng bộ */}
      <Modal.Header
        closeButton
        style={{
          background:
            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <Modal.Title className="d-flex align-items-center">
          <FaCertificate className="me-2" />
          <span>
            Chứng chỉ & Bằng cấp —{" "}
            {nhanVien?.ho_ten || "—"}
          </span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {noPermissionView ? (
          <div className="text-center text-muted py-5">
            Bạn không có quyền xem chứng chỉ của nhân viên này.
          </div>
        ) : (
          <>
            {/* Chỉ HR mới được thêm chứng chỉ */}
            {canManageCertificates && (
              <Card className="shadow-sm border-0 rounded-4 mb-4">
                <Card.Header
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    fontWeight: "600",
                    fontSize: "1rem",
                  }}
                >
                  ➕ Thêm chứng chỉ / bằng cấp
                </Card.Header>
                <Card.Body className="p-3">
                  <Form onSubmit={onSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Tên *
                          </Form.Label>
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
                          <Form.Label className="fw-semibold">
                            Loại
                          </Form.Label>
                          <Form.Select
                            name="loai"
                            value={form.loai}
                            onChange={onInput}
                          >
                            <option value="certificate">
                              Chứng chỉ
                            </option>
                            <option value="degree">
                              Bằng cấp
                            </option>
                            <option value="license">
                              Giấy phép
                            </option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Tổ chức cấp
                          </Form.Label>
                          <Form.Control
                            name="to_chuc_cap"
                            value={form.to_chuc_cap}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Ngày cấp
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="ngay_cap"
                            value={form.ngay_cap}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Hết hạn
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="ngay_het_han"
                            value={form.ngay_het_han}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Xếp loại
                          </Form.Label>
                          <Form.Control
                            name="xep_loai"
                            value={form.xep_loai}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Điểm số
                          </Form.Label>
                          <Form.Control
                            name="diem_so"
                            value={form.diem_so}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            URL xác thực (nếu có)
                          </Form.Label>
                          <Form.Control
                            name="credential_url"
                            value={form.credential_url}
                            onChange={onInput}
                            placeholder="https://..."
                            isInvalid={
                              !!form.credential_url &&
                              !isValidUrl(
                                form.credential_url
                              )
                            }
                          />
                          <Form.Control.Feedback type="invalid">
                            URL không hợp lệ.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Mã xác thực (nếu có)
                          </Form.Label>
                          <Form.Control
                            name="credential_id"
                            value={form.credential_id}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            File (pdf/png/jpg/jpeg)
                          </Form.Label>
                          <Form.Control
                            type="file"
                            name="tep"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={onInput}
                          />
                          {form.tep && (
                            <div className="small text-muted mt-1">
                              Tệp: {form.tep.name} (
                              {Math.round(
                                form.tep.size / 1024
                              )}{" "}
                              KB)
                            </div>
                          )}
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-semibold">
                            Ghi chú
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={1}
                            name="ghi_chu"
                            value={form.ghi_chu}
                            onChange={onInput}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="mt-4 text-end">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving || !isFormValid}
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                        }}
                      >
                        {saving
                          ? "Đang thêm..."
                          : "Thêm chứng chỉ"}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            )}

            {/* Card Danh sách chứng chỉ */}
            <Card className="shadow-sm border-0 rounded-4">
              <Card.Header
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              >
                <FaCertificate className="me-2" />
                Danh sách chứng chỉ
              </Card.Header>

              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center my-4">
                    <Spinner animation="border" />
                    <div className="mt-2 text-muted">
                      Đang tải dữ liệu...
                    </div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    Chưa có chứng chỉ.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table
                      bordered
                      hover
                      className="mb-0 align-middle"
                    >
                      <thead
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #5a6fd8 100%)",
                          color: "white",
                        }}
                      >
                        <tr>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Tên
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Loại
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Tổ chức
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Ngày cấp
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Hết hạn
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Tệp
                          </th>
                          <th style={{ padding: "12px", fontWeight: "600" }}>
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((cc) => {
                          const isExpired =
                            cc.ngay_het_han &&
                            new Date(cc.ngay_het_han) < new Date();
                          const opened = openId === cc.id;

                          return (
                            <React.Fragment key={cc.id}>
                              <tr
                                className={
                                  isExpired ? "table-danger" : ""
                                }
                                style={{
                                  transition: "all 0.3s ease",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "12px",
                                    fontWeight: "500",
                                  }}
                                >
                                  <div className="fw-semibold">
                                    {cc.ten || "—"}
                                  </div>

                                  {cc.credential_url && (
                                    <div>
                                      <a
                                        href={cc.credential_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="small"
                                      >
                                        Xác thực
                                      </a>
                                    </div>
                                  )}

                                  {cc.xep_loai && (
                                    <div className="text-muted small">
                                      Xếp loại: {cc.xep_loai}
                                    </div>
                                  )}
                                  {cc.diem_so && (
                                    <div className="text-muted small">
                                      Điểm: {cc.diem_so}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: "12px" }}>
                                  {renderLoaiBadge(cc.loai)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                  {cc.to_chuc_cap || "—"}
                                </td>

                                <td style={{ padding: "12px" }}>
                                  {fmtDateVI(cc.ngay_cap)}
                                </td>

                                <td style={{ padding: "12px" }}>
                                  {fmtDateVI(cc.ngay_het_han)}
                                  {isExpired && (
                                    <span className="ms-1 badge bg-danger">
                                      Hết hạn
                                    </span>
                                  )}
                                </td>

                                <td style={{ padding: "12px" }}>
                                  {cc.tep_dinh_kem ? (
                                    <a
                                      href={`${STATIC_BASE}/${cc.tep_dinh_kem}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Xem tệp
                                    </a>
                                  ) : (
                                    <span className="text-muted">
                                      —
                                    </span>
                                  )}
                                </td>

                                <td
                                  className="text-end"
                                  style={{ padding: "12px" }}
                                >
                                  <div className="d-flex flex-wrap justify-content-end gap-2">
                                    <Button
                                      size="sm"
                                      variant={
                                        opened
                                          ? "secondary"
                                          : "outline-secondary"
                                      }
                                      onClick={() =>
                                        setOpenId(
                                          opened ? null : cc.id
                                        )
                                      }
                                    >
                                      {opened
                                        ? "Ẩn chi tiết"
                                        : "Chi tiết"}
                                    </Button>

                                    {canManageCertificates && (
                                      <Button
                                        size="sm"
                                        variant="outline-danger"
                                        onClick={() =>
                                          onDelete(cc.id)
                                        }
                                      >
                                        Xóa
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {opened && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="bg-light"
                                    style={{
                                      padding: "16px",
                                    }}
                                  >
                                    <Card className="border-0 shadow-sm rounded-4">
                                      <Card.Body>
                                        <Row className="g-3">
                                          <Col md={6}>
                                            <DetailItem label="Tên đầy đủ">
                                              {cc.ten}
                                            </DetailItem>
                                          </Col>
                                          <Col md={6}>
                                            <DetailItem label="Loại">
                                              {cc.loai}
                                            </DetailItem>
                                          </Col>

                                          <Col md={6}>
                                            <DetailItem label="Tổ chức cấp">
                                              {cc.to_chuc_cap}
                                            </DetailItem>
                                          </Col>
                                          <Col md={6}>
                                            <DetailItem label="Xếp loại">
                                              {cc.xep_loai}
                                            </DetailItem>
                                          </Col>

                                          <Col md={6}>
                                            <DetailItem label="Ngày cấp">
                                              {fmtDateVI(
                                                cc.ngay_cap
                                              )}
                                            </DetailItem>
                                          </Col>
                                          <Col md={6}>
                                            <DetailItem label="Ngày hết hạn">
                                              {fmtDateVI(
                                                cc.ngay_het_han
                                              )}
                                            </DetailItem>
                                          </Col>

                                          <Col md={6}>
                                            <DetailItem label="Điểm số">
                                              {cc.diem_so}
                                            </DetailItem>
                                          </Col>
                                          <Col md={6}>
                                            <DetailItem label="Mã xác thực">
                                              {cc.credential_id}
                                            </DetailItem>
                                          </Col>

                                          <Col md={12}>
                                            <DetailItem label="URL xác thực">
                                              {cc.credential_url ? (
                                                <a
                                                  href={
                                                    cc.credential_url
                                                  }
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  {
                                                    cc.credential_url
                                                  }
                                                </a>
                                              ) : (
                                                ""
                                              )}
                                            </DetailItem>
                                          </Col>

                                          <Col md={12}>
                                            <DetailItem label="Ghi chú">
                                              {cc.ghi_chu}
                                            </DetailItem>
                                          </Col>

                                          <Col md={12}>
                                            <DetailItem label="Tệp đính kèm">
                                              {cc.tep_dinh_kem ? (
                                                <a
                                                  href={`${STATIC_BASE}/${cc.tep_dinh_kem}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  {
                                                    cc.tep_dinh_kem
                                                  }
                                                </a>
                                              ) : (
                                                ""
                                              )}
                                            </DetailItem>
                                          </Col>
                                        </Row>
                                      </Card.Body>
                                    </Card>
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
              </Card.Body>
            </Card>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between flex-wrap gap-2">
        <div className="text-muted small">
          Nhân viên:{" "}
          <strong>{nhanVien?.ho_ten || "—"}</strong>{" "}
          (ID: {nhanVien?.id ?? "—"})
        </div>
        <Button
          variant="outline-secondary"
          onClick={onHide}
        >
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChungChiModal;
