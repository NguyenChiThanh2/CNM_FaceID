// src/components/danhgia/DanhGiaForm.jsx
import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
// dùng service chuẩn hoá (qua axiosInstance)
import { getAllNhanVien } from "../../services/nhanSuApi";

const clamp0to10 = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return Math.max(0, Math.min(10, n));
};

const DanhGiaForm = ({ initialData = {}, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    nguoi_danh_gia_id: "",
    thoi_gian: "",
    diem_ky_nang: "",
    diem_thai_do: "",
    diem_hieu_suat: "",
    nhan_xet: "",
    ...initialData,
  });

  const [nhanViens, setNhanViens] = useState([]);
  const [loadingNV, setLoadingNV] = useState(false);

  // Đồng bộ lại form khi initialData thay đổi (trường hợp edit)
  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  // Load danh sách nhân viên từ service
  useEffect(() => {
    (async () => {
      setLoadingNV(true);
      try {
        const list = await getAllNhanVien();
        setNhanViens(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Lỗi khi tải danh sách nhân viên:", err);
        setNhanViens([]);
      } finally {
        setLoadingNV(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // 3 field điểm: clamp 0–10
    if (["diem_ky_nang", "diem_thai_do", "diem_hieu_suat"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: clamp0to10(value) }));
      return;
    }

    // date / select / text
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ép kiểu số trước khi gửi
    const payload = {
      ...formData,
      diem_ky_nang: formData.diem_ky_nang === "" ? null : Number(formData.diem_ky_nang),
      diem_thai_do: formData.diem_thai_do === "" ? null : Number(formData.diem_thai_do),
      diem_hieu_suat: formData.diem_hieu_suat === "" ? null : Number(formData.diem_hieu_suat),
    };

    onSubmit?.(payload);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="nhan_vien_id">
            <Form.Label>Nhân viên</Form.Label>
            <Form.Select
              name="nhan_vien_id"
              value={formData.nhan_vien_id || ""}
              onChange={handleChange}
              required
              style={{ maxHeight: 220, overflowY: "auto" }} // khung cuộn
            >
              <option value="">-- Chọn nhân viên --</option>
              {loadingNV ? (
                <option disabled>Đang tải...</option>
              ) : (
                nhanViens.map((nv) => (
                  <option key={nv.id} value={nv.id}>
                    {nv.ho_ten}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group controlId="nguoi_danh_gia_id">
            <Form.Label>Người đánh giá</Form.Label>
            <Form.Select
              name="nguoi_danh_gia_id"
              value={formData.nguoi_danh_gia_id || ""}
              onChange={handleChange}
              required
              style={{ maxHeight: 220, overflowY: "auto" }}
            >
              <option value="">-- Chọn người đánh giá --</option>
              {loadingNV ? (
                <option disabled>Đang tải...</option>
              ) : (
                nhanViens.map((nv) => (
                  <option key={nv.id} value={nv.id}>
                    {nv.ho_ten}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="thoi_gian" className="mb-3">
        <Form.Label>Thời gian đánh giá</Form.Label>
        <Form.Control
          type="date"
          name="thoi_gian"
          value={formData.thoi_gian || ""}
          onChange={handleChange}
        />
      </Form.Group>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group controlId="diem_ky_nang">
            <Form.Label>Điểm kỹ năng (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_ky_nang"
              value={formData.diem_ky_nang}
              onChange={handleChange}
              min="0"
              max="10"
              step="1"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_thai_do">
            <Form.Label>Điểm thái độ (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_thai_do"
              value={formData.diem_thai_do}
              onChange={handleChange}
              min="0"
              max="10"
              step="1"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_hieu_suat">
            <Form.Label>Điểm hiệu suất (0–10)</Form.Label>
            <Form.Control
              type="number"
              name="diem_hieu_suat"
              value={formData.diem_hieu_suat}
              onChange={handleChange}
              min="0"
              max="10"
              step="1"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="nhan_xet" className="mb-3">
        <Form.Label>Nhận xét</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="nhan_xet"
          value={formData.nhan_xet || ""}
          onChange={handleChange}
          placeholder="Nhập nhận xét ngắn gọn…"
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" onClick={onClose} className="me-2">
          Hủy
        </Button>
        <Button variant="primary" type="submit">
          Lưu
        </Button>
      </div>
    </Form>
  );
};

export default DanhGiaForm;
