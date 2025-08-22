import React, { useEffect, useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

const initialState = {
  username: "",
  email: "",
  password: "",
  role_id: "",
};

const UserForm = ({ selected, onAdded, onClose, fetchUsers }) => {
  const [formData, setFormData] = useState(initialState);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    // load roles list
    const fetchRoles = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/get-all-roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Lỗi lấy vai trò:", err);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selected) {
      setFormData({
        username: selected.username || "",
        email: selected.email || "",
        password: "", // keep empty for security
        role_id: selected.role_id || "",
      });
    } else setFormData(initialState);
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = selected ? "PUT" : "POST";
    const url = selected
      ? `http://localhost:5000/api/edit-user/${selected.id}`
      : "http://localhost:5000/api/add-user";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Request failed");
      fetchUsers();
      onAdded(selected ? "✅ Cập nhật người dùng thành công!" : "✅ Thêm người dùng thành công!");
    } catch (err) {
      console.error("Lỗi submit:", err);
      onAdded("❌ Lỗi khi lưu người dùng!");
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Tên đăng nhập</Form.Label>
            <Form.Control
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
      </Row>

      {!selected && (
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
          </Col>
        </Row>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Vai trò</Form.Label>
            <Form.Select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn vai trò --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.ma_vai_tro}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="text-end">
        <Button variant="secondary" className="me-2" onClick={onClose}>
          Hủy
        </Button>
        <Button variant="primary" type="submit">
          {selected ? "Lưu thay đổi" : "Thêm"}
        </Button>
      </div>
    </Form>
  );
};

export default UserForm;
