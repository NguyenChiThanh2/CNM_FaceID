import React, { useState, useEffect } from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const initialState = {
  ten_phuc_loi: "",
  mo_ta: "",
  gia_tri: "",
  loai: "",
};

const PhucLoiForm = ({ fetchPhucLoiList, selected, onClose, onAdded }) => {
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
      ? `http://localhost:5000/api/edit-phuc-loi/${form.id}`
      : "http://localhost:5000/api/add-phuc-loi";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi lưu dữ liệu");
      }

      const message = form.id ? "Cập nhật thành công!" : "Thêm mới thành công!";
      await fetchPhucLoiList();
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
      setError("Không thể lưu phúc lợi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-light">
        <h5>{form.id ? "Cập nhật Phúc lợi" : "Thêm mới Phúc lợi"}</h5>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="mb-3">
          <label className="form-label">Tên phúc lợi</label>
          <input
            type="text"
            name="ten_phuc_loi"
            className="form-control"
            value={form.ten_phuc_loi}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Loại</label>
          <input
            type="text"
            name="loai"
            className="form-control"
            value={form.loai}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Giá trị</label>
          <input
            type="number"
            name="gia_tri"
            className="form-control"
            value={form.gia_tri}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mô tả</label>
          <textarea
            name="mo_ta"
            className="form-control"
            value={form.mo_ta}
            onChange={handleChange}
            rows={3}
            required
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

export default PhucLoiForm;
