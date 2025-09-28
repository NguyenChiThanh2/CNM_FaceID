import React, { useState, useEffect } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const initialState = {
  ten_thuong: "",
  loai_thuong: "",
  so_tien: "",
  ngay_quyet_dinh: "",
  ghi_chu: ""
};
const API_BASE = "http://localhost:5000";
const ThuongForm = ({ fetchThuongList, selected, onClose, onAdded }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (selected) {
      setForm(selected);
    } else {
      setForm(initialState);
    }
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm(initialState);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const method = form.id ? "PUT" : "POST";
    const url = form.id
      ? `${API_BASE}/api/edit-thuong/${form.id}`
      : `${API_BASE}/api/add-thuong`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lưu dữ liệu");
      }

      const message = form.id ? "Cập nhật thưởng thành công!" : "Thêm thưởng thành công!";
      await fetchThuongList();
      setSuccess(message);
      setShowToast(true);

      if (onAdded) onAdded(message);

      // Tự động đóng modal sau 1 giây
      setTimeout(() => {
        handleReset();
        if (onClose) onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Không thể lưu thưởng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-light">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-3">
          <label className="form-label">Tên thưởng</label>
          <input
            type="text"
            name="ten_thuong"
            className="form-control"
            value={form.ten_thuong}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mục đích</label>
          <select
            type="text"
            name="loai_thuong"
            className="form-control"
            value={form.loai_thuong}
            onChange={handleChange}
            required
          >
            <option value="">Chọn mục đích thưởng</option>
            <option value="LE">Thưởng Lễ</option>
            <option value="TET">Thưởng Tết</option>
            <option value="THANG13">Thưởng Tháng 13</option>
            <option value="NONG">Thưởng Nóng</option>
            <option value="THANHTICH">Thưởng Thành tích</option>
            <option value="THUONGKHAC">Thưởng Khác</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Số tiền</label>
          <input
            type="number"
            name="so_tien"
            className="form-control"
            value={form.so_tien}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ngày quyết định</label>
          <input
            type="date"
            name="ngay_quyet_dinh"
            className="form-control"
            value={form.ngay_quyet_dinh}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ghi chú</label>
          <textarea
            name="ghi_chu"
            className="form-control"
            value={form.ghi_chu}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Đang lưu..." : form.id ? "Cập nhật" : "Thêm mới"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Xoá form
          </button>
        </div>
      </form>

      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg="success" delay={3000} autohide>
          <Toast.Body className="text-white fw-bold fs-6">{success}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default ThuongForm;
