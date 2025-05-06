import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const DanhGiaForm = ({ initialData = {}, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nhan_vien_id: '',
    nguoi_danh_gia_id: '',
    thoi_gian: '',
    diem_ky_nang: '',
    diem_thai_do: '',
    diem_hieu_suat: '',
    nhan_xet: '',
    ...initialData,
  });

  const [nhanViens, setNhanViens] = useState([]);

  useEffect(() => {
    fetchNhanViens();
  }, []);

  const fetchNhanViens = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/get-all-nhan-vien'); // Cập nhật URL nếu khác
      setNhanViens(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group controlId="nhan_vien_id">
            <Form.Label>Nhân viên</Form.Label>
            <Form.Select
              name="nhan_vien_id"
              value={formData.nhan_vien_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn nhân viên --</option>
              {nhanViens.map((nv) => (
                <option key={nv.id} value={nv.id}>
                  {nv.ho_ten}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group controlId="nguoi_danh_gia_id">
            <Form.Label>Người đánh giá</Form.Label>
            <Form.Select
              name="nguoi_danh_gia_id"
              value={formData.nguoi_danh_gia_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn người đánh giá --</option>
              {nhanViens.map((nv) => (
                <option key={nv.id} value={nv.id}>
                  {nv.ho_ten}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group controlId="thoi_gian" className="mb-3">
        <Form.Label>Thời gian đánh giá</Form.Label>
        <Form.Control
          type="date"
          name="thoi_gian"
          value={formData.thoi_gian}
          onChange={handleChange}
        />
      </Form.Group>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Group controlId="diem_ky_nang">
            <Form.Label>Điểm kỹ năng</Form.Label>
            <Form.Control
              type="number"
              name="diem_ky_nang"
              value={formData.diem_ky_nang}
              onChange={handleChange}
              min="0"
              max="10"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_thai_do">
            <Form.Label>Điểm thái độ</Form.Label>
            <Form.Control
              type="number"
              name="diem_thai_do"
              value={formData.diem_thai_do}
              onChange={handleChange}
              min="0"
              max="10"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group controlId="diem_hieu_suat">
            <Form.Label>Điểm hiệu suất</Form.Label>
            <Form.Control
              type="number"
              name="diem_hieu_suat"
              value={formData.diem_hieu_suat}
              onChange={handleChange}
              min="0"
              max="10"
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
          value={formData.nhan_xet}
          onChange={handleChange}
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
