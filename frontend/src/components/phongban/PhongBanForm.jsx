import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Form, Button, Row, Col } from "react-bootstrap";

const PhongBanForm = ({ onSaved, editingPhongBan }) => {
  const [maPhongBan, setMaPhongBan] = useState("");
  const [tenPhongBan, setTenPhongBan] = useState("");
  const [moTa, setMoTa] = useState("");

  useEffect(() => {
    if (editingPhongBan) {
      setMaPhongBan(editingPhongBan.ma_phong_ban);
      setTenPhongBan(editingPhongBan.ten_phong_ban);
      setMoTa(editingPhongBan.mo_ta || "");
    } else {
      setMaPhongBan("");
      setTenPhongBan("");
      setMoTa("");
    }
  }, [editingPhongBan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ma_phong_ban: maPhongBan,
      ten_phong_ban: tenPhongBan,
      mo_ta: moTa,
    };

    try {
      if (editingPhongBan) {
        await axios.put(`http://localhost:5000/api/edit-phong-ban/${editingPhongBan.id}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/add-phong-ban", payload);
      }
      onSaved();
    } catch (err) {
      console.error("Lỗi khi lưu phòng ban:", err);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5 className="mb-4 text-center text-primary">
          {editingPhongBan ? "Cập nhật phòng ban" : "Thêm mới phòng ban"}
        </h5>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="formMaPhongBan">
              <Form.Label>Mã phòng ban</Form.Label>
              <Form.Control
                type="number"
                value={maPhongBan}
                onChange={(e) => setMaPhongBan(e.target.value)}
                required
                placeholder="Nhập mã phòng ban"
              />
            </Form.Group>

            <Form.Group as={Col} controlId="formTenPhongBan">
              <Form.Label>Tên phòng ban</Form.Label>
              <Form.Control
                type="text"
                value={tenPhongBan}
                onChange={(e) => setTenPhongBan(e.target.value)}
                required
                placeholder="Nhập tên phòng ban"
              />
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="formMoTa">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="Nhập mô tả phòng ban (nếu có)"
            />
          </Form.Group>

          <div className="text-end">
            <Button type="submit" variant="primary">
              {editingPhongBan ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PhongBanForm;
