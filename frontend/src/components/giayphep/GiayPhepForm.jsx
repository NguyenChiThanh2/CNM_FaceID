import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Modal,Spinner } from "react-bootstrap";
import axiosInstance from "../../services/axiosInstance";
import { toast } from "react-toastify";

const GiayPhepForm = ({ onAdded, editingGiayPhep, setEditingGiayPhep }) => {
  const [formData, setFormData] = useState({
    cham_cong_id: "",
    nhan_vien_id: "",
    ho_ten: "",
    ngay_bat_dau: "",
    ngay_ket_thuc: "",
    loai_giay_phep: "",
    ly_do: "",
    so_gio: "",
    trang_thai: "Chưa duyệt",
  });

  const [modalMessage, setModalMessage] = useState("");
  const [showModalTB, setShowModalTB] = useState(false);
  const [checking, setChecking] = useState(false);
  const [ErrorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingGiayPhep) {
      setFormData((prev) => ({ ...prev, ...editingGiayPhep }));
    }
  }, [editingGiayPhep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingGiayPhep) {
        const response = await axiosInstance.put(
          `/edit-giay-phep/${editingGiayPhep.id}`,
          formData
        );
        if (response.status === 200) {
          onAdded();
          setEditingGiayPhep(null);
          setLoading(false);
          toast.success("Cập nhật giấy phép thành công!");
        } else {
          setErrorMessage("Lỗi cập nhật nghỉ phép: " + response.data.error);
          toast.error("Cập nhật đơn nghỉ phép thất bại!");
        }
      } else {
        await axiosInstance.post(`/add-giay-phep`, formData);
        setLoading(false);
        toast.success("Thêm giấy phép thành công!");
      }
      onAdded();
    } catch (error) {
      setLoading(false);
      console.error("Lỗi khi lưu giấy phép:", error);
      toast.error("Có lỗi xảy ra khi lưu giấy phép!");
    }
  };

  const handleCheckChamCong = async () => {
    if (!formData.cham_cong_id.trim()) {
      setModalMessage("👉 Vui lòng nhập mã chấm công!");
      setShowModalTB(true);
      return;
    }
    setChecking(true);
    try {
      const res = await axiosInstance.get(
        `/get-cham-cong-by-id/${formData.cham_cong_id}`
      );
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          nhan_vien_id: res.data.nhan_vien_id || "",
          ho_ten: res.data.ho_ten || "",
          ngay_bat_dau: res.data.ngay || "",
          ngay_ket_thuc: res.data.ngay || "",
        }));
      } else {
        setModalMessage("❎ Không tìm thấy thông tin chấm công!");
        setShowModalTB(true);
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra chấm công:", error);
      setModalMessage("❎ Không tìm thấy thông tin chấm công");
      setShowModalTB(true);
    } finally {
      setChecking(false);
    }
  };
  if (loading) return (
      <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" role="status" />
      <span className="ms-2">⏳ Đang tải dữ liệu...</span>
    </div>
  ); 
  return (
    <div>
      <Form onSubmit={handleSubmit}>
        <Row>{ErrorMessage && <div className="alert alert-danger">{ErrorMessage}</div>}</Row>
        <Row>
          <Col md={12}>
            <Form.Group>
              <Form.Label>Mã chấm công</Form.Label>
              <div className="d-flex">
                <Col md={6}>
                  <Form.Control
                    type="text"
                    name="cham_cong_id"
                    value={formData.cham_cong_id || ""}
                    onChange={handleChange}
                    required
                  />
                </Col>
                <Col md={6}>
                  <Button
                    variant="info"
                    className="ms-2"
                    onClick={handleCheckChamCong}
                    disabled={checking}
                  >
                    {checking ? "Đang kiểm tra..." : "Kiểm tra"}
                  </Button>
                </Col>
              </div>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Nhân viên</Form.Label>
              <Form.Control
                type="hidden"
                name="nhan_vien_id"
                value={formData.nhan_vien_id || ""}
                readOnly
              />
              <Form.Control
                type="text"
                name="ho_ten"
                value={formData.ho_ten || ""}
                readOnly
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Loại giấy phép</Form.Label>
              <Form.Select
                name="loai_giay_phep"
                value={formData.loai_giay_phep || ""}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn loại giấy phép --</option>
                <option value="Quên chấm công">Quên chấm công</option>
                <option value="Tăng ca">Tăng ca</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Ngày bắt đầu</Form.Label>
              <Form.Control
                type="date"
                name="ngay_bat_dau"
                value={formData.ngay_bat_dau || ""}
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
                name="ngay_ket_thuc"
                value={formData.ngay_ket_thuc || "" }
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mt-3">
          <Form.Label>Lý do</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="ly_do"
            value={formData.ly_do || ""}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {formData.loai_giay_phep === "Quên chấm công" && (
          <Form.Group className="mt-3">
            <Form.Label>Công cho phép bù</Form.Label>
            <Form.Select
              name="so_gio"
              value={formData.so_gio || ""}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn công cho phép --</option>
              <option value="8">1 ngày công</option>
              <option value="4">Nửa ngày công</option>
            </Form.Select>
          </Form.Group>
        )}

        {formData.loai_giay_phep === "Tăng ca" && (
          <Form.Group className="mt-3">
            <Form.Label>Số giờ tăng ca</Form.Label>
            <Form.Control
              type="number"
              name="so_gio"
              value={formData.so_gio || ""}
              onChange={handleChange}
              min="1"
              required
            />
          </Form.Group>
        )}

        <Button type="submit" variant="primary" className="mt-4" disabled={loading}>
          {editingGiayPhep ? "Cập nhật" : "Thêm mới"}
        </Button>
      </Form>

      <Modal
        contentClassName="bg-danger text-white"
        show={showModalTB}
        onHide={() => setShowModalTB(false)}
        centered
      >
        <Modal.Body>
          <h4 className="text-lg font-semibold mb-4 mt-4 text-center">
            {modalMessage}
          </h4>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default GiayPhepForm;
