import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { getNhanVienInfo } from "../../utils/auth";
import { ToastContainer, toast } from "react-toastify";

const clamp0to10 = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return Math.max(0, Math.min(10, n));
};

const firstDayOfMonthISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

// nhanViens nhận qua props từ QuanLyDanhGia.jsx (trang cha đã fetch sẵn 1
// lần) — trước đây form tự fetch lại toàn bộ danh sách nhân viên mỗi lần
// modal "Thêm/Sửa đánh giá" mở, dù dữ liệu đã có sẵn ở trang cha.
const DanhGiaForm = ({ initialData = {}, onSubmit, onClose, nhanViens = [] }) => {
  const currentUser = useMemo(() => getNhanVienInfo(), []);

  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    nguoi_danh_gia_id: currentUser?.id || "",
    ky_loai: "MONTH",
    ky_ngay: firstDayOfMonthISO(),

    diem_chuyen_can: "",
    diem_hieu_qua: "",
    diem_ky_nang: "",
    diem_thai_do: "",
    diem_chu_dong: "",

    phuong_thuc: "MANAGER",
    nhan_xet: "",

    // 5 minh chứng (URL hoặc file path) – bắt buộc
    mc_chuyen_can_ref: "",
    mc_hieu_qua_ref: "",
    mc_ky_nang_ref: "",
    mc_thai_do_ref: "",
    mc_chu_dong_ref: "",
  });

  const isEditing = Boolean(initialData && initialData.id);

  // ==== Effects ====

  // Prefill khi edit
  useEffect(() => {
    if (!initialData) return;
    const mc = initialData.minh_chung || {}; // {chuyen_can,hieu_qua,...} nếu BE trả kèm
    setFormData((prev) => ({
      ...prev,
      nhan_vien_id: initialData.nhan_vien_id ?? initialData.nhan_vien?.id ?? "",
      nguoi_danh_gia_id: currentUser?.id || prev.nguoi_danh_gia_id,
      ky_loai: initialData.ky_loai ?? "MONTH",
      ky_ngay: initialData.ky_ngay ?? firstDayOfMonthISO(),

      diem_chuyen_can: initialData.diem_chuyen_can ?? "",
      diem_hieu_qua: initialData.diem_hieu_qua ?? "",
      diem_ky_nang: initialData.diem_ky_nang ?? "",
      diem_thai_do: initialData.diem_thai_do ?? "",
      diem_chu_dong: initialData.diem_chu_dong ?? "",

      phuong_thuc: "MANAGER",
      nhan_xet: initialData.nhan_xet ?? "",

      mc_chuyen_can_ref: mc.chuyen_can ?? initialData.mc_chuyen_can_ref ?? "",
      mc_hieu_qua_ref: mc.hieu_qua ?? initialData.mc_hieu_qua_ref ?? "",
      mc_ky_nang_ref: mc.ky_nang ?? initialData.mc_ky_nang_ref ?? "",
      mc_thai_do_ref: mc.thai_do ?? initialData.mc_thai_do_ref ?? "",
      mc_chu_dong_ref: mc.chu_dong ?? initialData.mc_chu_dong_ref ?? "",
    }));
  }, [initialData, currentUser]);

  // Chỉ hiển thị NV cùng phòng ban
  const nhanViensCungPhong = useMemo(() => {
    if (!currentUser?.phong_ban_id) return nhanViens;
    return nhanViens.filter((nv) => nv.phong_ban_id === currentUser.phong_ban_id);
  }, [nhanViens, currentUser]);

  // Không cho sửa record khác phòng
  useEffect(() => {
    if (isEditing && initialData?.nhan_vien?.phong_ban_id && currentUser?.phong_ban_id) {
      if (initialData.nhan_vien.phong_ban_id !== currentUser.phong_ban_id) {
        toast.warning("Bạn chỉ được đánh giá nhân viên trong cùng phòng ban.");
        onClose?.();
      }
    }
  }, [isEditing, initialData, currentUser, onClose]);

  // ==== Handlers ====
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (["diem_chuyen_can", "diem_hieu_qua", "diem_ky_nang", "diem_thai_do", "diem_chu_dong"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : clamp0to10(value) }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleTrim = useCallback((e) => {
    const { name, value } = e.target;
    if (!name) return;
    const trimmed = typeof value === "string" ? value.trim() : value;
    setFormData((prev) => ({ ...prev, [name]: trimmed }));
  }, []);

  const validateEvidence = () => {
    const need = [
      "mc_chuyen_can_ref",
      "mc_hieu_qua_ref",
      "mc_ky_nang_ref",
      "mc_thai_do_ref",
      "mc_chu_dong_ref",
    ];
    const missing = need.filter((k) => !String(formData[k] || "").trim());
    if (missing.length) {
      toast.warning("Vui lòng nhập đủ 5 minh chứng (URL hoặc đường dẫn file). Thiếu: " + missing.join(", "));
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
    const s = (v) => (v == null ? "" : String(v).trim());

    return {
      nhan_vien_id: Number(formData.nhan_vien_id),
      nguoi_danh_gia_id: Number(currentUser.id),

      ky_loai: formData.ky_loai,
      ky_ngay: formData.ky_ngay,

      diem_chuyen_can: num(formData.diem_chuyen_can),
      diem_hieu_qua: num(formData.diem_hieu_qua),
      diem_ky_nang: num(formData.diem_ky_nang),
      diem_thai_do: num(formData.diem_thai_do),
      diem_chu_dong: num(formData.diem_chu_dong),

      phuong_thuc: "MANAGER",
      nhan_xet: formData.nhan_xet?.trim() || null,

      mc_chuyen_can_ref: s(formData.mc_chuyen_can_ref),
      mc_hieu_qua_ref: s(formData.mc_hieu_qua_ref),
      mc_ky_nang_ref: s(formData.mc_ky_nang_ref),
      mc_thai_do_ref: s(formData.mc_thai_do_ref),
      mc_chu_dong_ref: s(formData.mc_chu_dong_ref),
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser?.id) {
      toast.error("Không xác định được người đánh giá. Vui lòng đăng nhập lại.");
      return;
    }
    if (!formData.nhan_vien_id) {
      toast.warning("Vui lòng chọn nhân viên được đánh giá.");
      return;
    }
    if (!validateEvidence()) return;

    onSubmit?.(buildPayload());
  };

  const evaluatorName = useMemo(() => currentUser?.ho_ten || "—", [currentUser]);

  // ==== Render ====
  return (
    <Form onSubmit={handleSubmit} noValidate>
      {/* Người được đánh giá */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="nhan_vien_id">
            <Form.Label>Nhân viên</Form.Label>
            <Form.Select
              name="nhan_vien_id"
              value={formData.nhan_vien_id || ""}
              onChange={handleChange}
              required
              style={{ maxHeight: 220, overflowY: "auto" }}
            >
              <option value="">-- Chọn nhân viên --</option>
              {nhanViensCungPhong.map((nv) => (
                <option key={nv.id} value={nv.id}>
                  {nv.ho_ten}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>

        {/* Người đánh giá = user đăng nhập */}
        <Col md={6}>
          <Form.Group controlId="nguoi_danh_gia_display">
            <Form.Label>Người đánh giá</Form.Label>
            <Form.Control type="text" value={evaluatorName} readOnly />
            <input type="hidden" name="nguoi_danh_gia_id" value={currentUser?.id || ""} />
          </Form.Group>
        </Col>
      </Row>

      {/* Kỳ đánh giá */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="ky_loai">
            <Form.Label>Kỳ đánh giá</Form.Label>
            <Form.Select name="ky_loai" value={formData.ky_loai} onChange={handleChange} required>
              <option value="MONTH">Theo tháng</option>
              <option value="QUARTER">Theo quý</option>
              <option value="YEAR">Theo năm</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="ky_ngay">
            <Form.Label>Ngày đại diện kỳ</Form.Label>
            <Form.Control
              type="date"
              name="ky_ngay"
              value={formData.ky_ngay || ""}
              onChange={handleChange}
              required
            />
            <Form.Text className="text-muted">
              Gợi ý: chọn ngày đầu kỳ (vd 2025-10-01 cho Tháng 10/2025).
            </Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* 5 tiêu chí */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group controlId="diem_chuyen_can">
            <Form.Label>Chuyên cần (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_chuyen_can"
              value={formData.diem_chuyen_can}
              onChange={handleChange}
              onBlur={handleTrim}
              min="0" max="10" step="0.1" required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_hieu_qua">
            <Form.Label>Hiệu quả (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_hieu_qua"
              value={formData.diem_hieu_qua}
              onChange={handleChange}
              onBlur={handleTrim}
              min="0" max="10" step="0.1" required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_ky_nang">
            <Form.Label>Kỹ năng (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_ky_nang"
              value={formData.diem_ky_nang}
              onChange={handleChange}
              onBlur={handleTrim}
              min="0" max="10" step="0.1" required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="diem_thai_do">
            <Form.Label>Thái độ (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_thai_do"
              value={formData.diem_thai_do}
              onChange={handleChange}
              onBlur={handleTrim}
              min="0" max="10" step="0.1" required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="diem_chu_dong">
            <Form.Label>Chủ động (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_chu_dong"
              value={formData.diem_chu_dong}
              onChange={handleChange}
              onBlur={handleTrim}
              min="0" max="10" step="0.1" required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* 5 minh chứng */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="mc_chuyen_can_ref">
            <Form.Label>Minh chứng - Chuyên cần (URL/file)</Form.Label>
            <Form.Control
              type="text"
              name="mc_chuyen_can_ref"
              value={formData.mc_chuyen_can_ref}
              onChange={handleChange}
              onBlur={handleTrim}
              placeholder="https://... hoặc uploads/..."
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="mc_hieu_qua_ref">
            <Form.Label>Minh chứng - Hiệu quả (URL/file)</Form.Label>
            <Form.Control
              type="text"
              name="mc_hieu_qua_ref"
              value={formData.mc_hieu_qua_ref}
              onChange={handleChange}
              onBlur={handleTrim}
              placeholder="https://... hoặc uploads/..."
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="mc_ky_nang_ref">
            <Form.Label>Minh chứng - Kỹ năng (URL/file)</Form.Label>
            <Form.Control
              type="text"
              name="mc_ky_nang_ref"
              value={formData.mc_ky_nang_ref}
              onChange={handleChange}
              onBlur={handleTrim}
              placeholder="https://... hoặc uploads/..."
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="mc_thai_do_ref">
            <Form.Label>Minh chứng - Thái độ (URL/file)</Form.Label>
            <Form.Control
              type="text"
              name="mc_thai_do_ref"
              value={formData.mc_thai_do_ref}
              onChange={handleChange}
              onBlur={handleTrim}
              placeholder="https://... hoặc uploads/..."
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="mc_chu_dong_ref">
            <Form.Label>Minh chứng - Chủ động (URL/file)</Form.Label>
            <Form.Control
              type="text"
              name="mc_chu_dong_ref"
              value={formData.mc_chu_dong_ref}
              onChange={handleChange}
              onBlur={handleTrim}
              placeholder="https://... hoặc uploads/..."
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Phương thức (cố định MANAGER) */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="phuong_thuc">
            <Form.Label>Phương thức đánh giá</Form.Label>
            <Form.Select name="phuong_thuc" value={formData.phuong_thuc} onChange={handleChange} disabled>
              <option value="MANAGER">Quản lý đánh giá</option>
            </Form.Select>
            <Form.Text className="text-muted">Hệ thống đang cố định phương thức “MANAGER”.</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      {/* Nhận xét */}
      <Form.Group controlId="nhan_xet" className="mb-3">
        <Form.Label>Nhận xét</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="nhan_xet"
          value={formData.nhan_xet || ""}
          onChange={handleChange}
          onBlur={handleTrim}
          placeholder="Nhập nhận xét…"
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onClose} className="me-2">Hủy</Button>
        <Button variant="primary" type="submit">{isEditing ? "Cập nhật" : "Lưu"}</Button>
      </div>
    </Form>
  );
};

export default DanhGiaForm;
