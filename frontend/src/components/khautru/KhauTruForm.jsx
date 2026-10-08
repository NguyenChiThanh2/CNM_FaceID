import React, { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KhauTruForm = ({ onAdded, editingKhauTru, setEditingKhauTru }) => {
  const [formData, setFormData] = useState({
    ten_khau_tru: "",
    loai_khau_tru: "",
    so_tien: "",
    ngay_quyet_dinh: "",
    ghi_chu: "",
    file_dinh_kem: null,
  });
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (editingKhauTru) {
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      setFormData({
        ten_khau_tru: editingKhauTru.ten_khau_tru,
        loai_khau_tru: editingKhauTru.loai_khau_tru,
        so_tien: editingKhauTru.so_tien,
        ngay_quyet_dinh: formatDate(editingKhauTru.ngay_quyet_dinh),
        ghi_chu: editingKhauTru.ghi_chu,
      });
      setFile(null);
    }
  }, [editingKhauTru]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const fd = new FormData();
      fd.append("ten_khau_tru", formData.ten_khau_tru);
      fd.append("loai_khau_tru", formData.loai_khau_tru);
      fd.append("so_tien", formData.so_tien);
      fd.append("ngay_quyet_dinh", formData.ngay_quyet_dinh);
      fd.append("ghi_chu", formData.ghi_chu);

      if (file) {
        fd.append("file_dinh_kem", file);
      } else {
        fd.append("file_status", "keep");
      }

      let response;
      if (editingKhauTru) {
        response = await axiosInstance.put(
          `/edit-khau-tru/${editingKhauTru.id}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        response = await axiosInstance.post(
          `/add-khau-tru`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      if (response.status === 200 || response.status === 201) {
        onAdded();
        setEditingKhauTru(null);
        toast.success(editingKhauTru ? "Cập nhật thành công!" : "Thêm thành công!");
        setFormData({
          ten_khau_tru: "",
          loai_khau_tru: "",
          so_tien: "",
          ngay_quyet_dinh: "",
          ghi_chu: "",
          file_dinh_kem: null,
        });
        setFile(null);
      }
    } catch (error) {
      // axiosInstance đã tự chuẩn hoá lỗi (xem normalizeError trong
      // services/axiosInstance.js) — error.message ở đây đã ưu tiên lấy
      // message/error từ response BE rồi, không còn error.response nữa.
      const message = error.message;
      console.error("Lỗi khi xử lý form:", message);
      setErrorMessage("Lỗi hệ thống: " + message);
      toast.error("Đã xảy ra lỗi: " + message);
    }
  };

  return (
    <div className="container mt-4">
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Tên khấu trừ</label>
          <input
            type="text"
            className="form-control"
            name="ten_khau_tru"
            value={formData.ten_khau_tru}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Mục đích khấu trừ</label>
          <select
            className="form-select"
            name="loai_khau_tru"
            value={formData.loai_khau_tru}
            onChange={handleChange}
            required
          >
            <option value="">Chọn mục đích</option>
            <option value="VI_PHAM">Trừ vi phạm</option>
            <option value="UNG_LUONG">Trừ ứng lương</option>
            <option value="TRU_KHAC">Khấu trừ khác</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Số tiền</label>
          <input
            type="number"
            className="form-control"
            name="so_tien"
            value={formData.so_tien}
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
            value={formData.ngay_quyet_dinh}
            onChange={handleChange}
            required
          />
        </div>


        <div className="mb-3">
          <label className="form-label">File đính kèm</label>
          <input
            type="file"
            className="form-control"
            onChange={handleFileChange}
          />
          {editingKhauTru && !file && (
            <small className="text-muted">
              File hiện tại: {editingKhauTru.file_dinh_kem}
            </small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Ghi chú</label>
          <textarea
            className="form-control"
            name="ghi_chu"
            value={formData.ghi_chu}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          {editingKhauTru ? "Cập nhật" : "Thêm"}
        </button>
      </form>
    </div>
  );
};

export default KhauTruForm;
