import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Modal, Spinner } from "react-bootstrap";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";

const NgayNghiLeForm = ({ onAdded, editingNgayNghiLe, setEditingNgayNghiLe }) => {
  console.log("🧩 editingNgayNghiLe:", editingNgayNghiLe);
  const [formData, setFormData] = useState({
    ten_ngay: "",
    tu_ngay: "",
    den_ngay: "",
    mo_ta: "",
    ten_ngay_le_khac: null,
  });

  const [loading, setLoading] = useState(false);
  const [ErrorMessage, setErrorMessage] = useState("");

  useEffect(() => {
  if (editingNgayNghiLe) {
    const predefinedOptions = [
      "Tết Nguyên Đán",
      "Giỗ Tổ Hùng Vương (10/3)",
      "Tết Dương lịch (1/1)",
      "Ngày Giải phóng miền Nam và Quốc tế Lao động (30/4 - 1/5)",
      "Quốc khánh (2/9)",
    ];

    const tenNgay = editingNgayNghiLe.ten_ngay || "";
    const isCustom = tenNgay && !predefinedOptions.includes(tenNgay);

    setFormData({
      ten_ngay: isCustom ? "Khác" : tenNgay,
      ten_ngay_le_khac: isCustom ? tenNgay : "",
      tu_ngay: editingNgayNghiLe.tu_ngay || "",
      den_ngay: editingNgayNghiLe.den_ngay || "",
      mo_ta: editingNgayNghiLe.mo_ta || "",
    });
  }
}, [editingNgayNghiLe]);
  console.log("FormData sau khi set:", formData);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingNgayNghiLe) {
        const response = await axiosInstance.put(
          `/edit-ngay-nghi-le/${editingNgayNghiLe.id}`,
          formData
        );
        if (response.status === 200) {
          toast.success("✅ Cập nhật ngày nghỉ lễ thành công!");
          setEditingNgayNghiLe(null);
          onAdded();
        } else {
          setErrorMessage("❎ Lỗi khi cập nhật ngày nghỉ lễ.");
        }
      } else {
        const response = await axiosInstance.post(
          `/add-ngay-nghi-le`,
          formData
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("🎉 Thêm ngày nghỉ lễ thành công!");
          onAdded();
        }
      }
    } catch (error) {
      console.error("Lỗi khi lưu ngày nghỉ lễ:", error);
      // axiosInstance đã tự chuẩn hoá lỗi (xem normalizeError trong
      // services/axiosInstance.js), không còn error.response nữa.
      setErrorMessage("Thông báo: " + (error.message || "❎ Lỗi khi thêm ngày nghỉ lễ."));
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" role="status" />
        <span className="ms-2">⏳ Đang xử lý...</span>
      </div>
    );

  return (
    <div>
      <Form onSubmit={handleSubmit}>
        {ErrorMessage && (
          <div className="alert alert-danger">{ErrorMessage}</div>
        )}

        <Row>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Tên ngày nghỉ lễ</Form.Label>
              <Form.Select
                name="ten_ngay"
                value={formData.ten_ngay || ""}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn tên ngày nghỉ lễ --</option>
                <option value="Tết Nguyên Đán">Tết Nguyên Đán</option>
                <option value="Giỗ Tổ Hùng Vương (10/3)">Giỗ Tổ Hùng Vương Âl(10/3)</option>
                <option value="Tết Dương lịch (1/1)">
                  Tết Dương lịch (1/1)
                </option>
                <option value="Ngày Giải phóng miền Nam và Quốc tế Lao động (30/4 - 1/5)">
                  Ngày Giải phóng miền Nam và Quốc tế Lao động (30/4 - 1/5)
                </option>
                <option value="Quốc khánh (2/9)">Quốc khánh (2/9)</option>
                <option value="Khác">Khác</option>
              </Form.Select>
            </Form.Group>
            {formData.ten_ngay === "Khác" && (
              <Form.Group className="mt-3">
                <Form.Label>Nhập tên ngày lễ khác</Form.Label>
                <Form.Control
                  type="text"
                  name="ten_ngay_le_khac"
                  value={formData.ten_ngay_le_khac || ""}
                  onChange={handleChange}
                  placeholder="VD: Ngày Nhà giáo Việt Nam, Ngày Doanh nhân Việt Nam..."
                />
              </Form.Group>
            )}
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Ngày bắt đầu</Form.Label>
              <Form.Control
                type="date"
                name="tu_ngay"
                value={formData.tu_ngay || ""}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Ngày kết thúc</Form.Label>
              <Form.Control
                type="date"
                name="den_ngay"
                value={formData.den_ngay || ""}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mt-3">
          <Form.Label>Ghi chú</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="mo_ta"
            value={formData.mo_ta || ""}
            onChange={handleChange}
            placeholder="Nhập ghi chú nếu có (ví dụ: Nghỉ 3 ngày liên tiếp...)"
          />
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="mt-4"
          disabled={loading}
        >
          {editingNgayNghiLe ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>

      {/* <Modal
        contentClassName="bg-danger text-white"
        show={showModalTB}
        onHide={() => setShowModalTB(false)}
        centered
      >
        <Modal.Body>
          <h4 className="text-center mb-0">{modalMessage || ErrorMessage}</h4>
        </Modal.Body>
      </Modal> */}
    </div>
  );
};

export default NgayNghiLeForm;
