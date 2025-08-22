import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NhanSuAddForm = ({ onAdded, editingNhanSu, setEditingNhanSu }) => {
  const [formData, setFormData] = useState({
    ho_ten: "",
    gioi_tinh: "Nam",
    ngay_sinh: "",
    email: "",
    so_dien_thoai: "",
    dia_chi: "",
    chuc_vu_id: "",
    phong_ban_id: "",
    trang_thai: "Đang làm việc",
    avatar: null,
    luong_co_ban: "",  // Thêm trường lương cơ bản
  });

  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsPhongBan, setDsPhongBan] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  useEffect(() => {
    if (editingNhanSu) {
      setFormData({
        ...editingNhanSu,
        avatar: null,
      });
    } else {
      resetForm();
    }
  }, [editingNhanSu]);

  useEffect(() => {
    fetchChucVu();
    fetchPhongBan();
  }, []);

  const fetchChucVu = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/get-all-chuc-vu");
      setDsChucVu(res.data);
    } catch (err) {
      console.error("Lỗi load chức vụ:", err);
    }
  };

  const fetchPhongBan = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/get-all-phong-ban");
      setDsPhongBan(res.data);
    } catch (err) {
      console.error("Lỗi load phòng ban:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      ho_ten: "",
      gioi_tinh: "Nam",
      ngay_sinh: "",
      email: "",
      so_dien_thoai: "",
      dia_chi: "",
      chuc_vu_id: "",
      phong_ban_id: "",
      trang_thai: "Đang làm việc",
      avatar: null,
      luong_co_ban: "",  // Reset trường lương cơ bản
    });
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = () => {
    if (!formData.ho_ten || !formData.email || !formData.so_dien_thoai || !formData.luong_co_ban) {
      setSuccessMessage("❌ Vui lòng điền đầy đủ thông tin.");
      setAlertType("danger");
      return false;
    }
    if (!validatePhoneNumber(formData.so_dien_thoai)) {
      setSuccessMessage("❌ Số điện thoại không hợp lệ.");
      setAlertType("danger");
      return false;
    }
    if (formData.luong_co_ban <= 0) {
      setSuccessMessage("❌ Lương cơ bản phải là số dương.");
      setAlertType("danger");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    // Kiểm tra tính hợp lệ của form
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const form = new FormData();
      for (const key in formData) {
        if (formData[key] !== null) {
          form.append(key, formData[key]);
        }
      }

      if (editingNhanSu) {
        await axios.put(`http://127.0.0.1:5000/api/edit-nhan-vien/${editingNhanSu.id}`, form);
        setSuccessMessage("✅ Cập nhật nhân sự thành công!");
        setAlertType("success");
      } else {
        await axios.post("http://127.0.0.1:5000/api/add-nhan-vien", form);
        toast.success("✅ Thêm mới nhân sự thành công!");
        setAlertType("success");
      }

      onAdded();
      resetForm();
      setEditingNhanSu(null);
    } catch (err) {
      console.error("Lỗi submit:", err);
      setSuccessMessage("❌ Đã xảy ra lỗi khi lưu dữ liệu.");
      setAlertType("danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-4 border rounded shadow-sm bg-white">
      {successMessage && (
        <div className={`alert alert-${alertType}`} role="alert">
          {successMessage}
        </div>
      )}

      <div className="row">
        <div className="col-md-6 mb-3">
          <label><strong>Họ tên</strong></label>
          <input
            type="text"
            name="ho_ten"
            className="form-control"
            value={formData.ho_ten}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Giới tính</strong></label>
          <select
            name="gioi_tinh"
            className="form-control"
            value={formData.gioi_tinh}
            onChange={handleChange}
            required
          >
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Ngày sinh</strong></label>
          <input
            type="date"
            name="ngay_sinh"
            className="form-control"
            value={formData.ngay_sinh}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Email</strong></label>
          <input
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Số điện thoại</strong></label>
          <input
            type="text"
            name="so_dien_thoai"
            className="form-control"
            value={formData.so_dien_thoai}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Địa chỉ</strong></label>
          <input
            type="text"
            name="dia_chi"
            className="form-control"
            value={formData.dia_chi}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Chức vụ</strong></label>
          <select
            name="chuc_vu_id"
            className="form-control"
            value={formData.chuc_vu_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn chức vụ --</option>
            {dsChucVu.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.ten_chuc_vu}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Phòng ban</strong></label>
          <select
            name="phong_ban_id"
            className="form-control"
            value={formData.phong_ban_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn phòng ban --</option>
            {dsPhongBan.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.ten_phong_ban}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Trạng thái</strong></label>
          <select
            name="trang_thai"
            className="form-control"
            value={formData.trang_thai}
            onChange={handleChange}
            required
          >
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Đã nghỉ việc">Đã nghỉ việc</option>
            <option value="Đang thử viênc">Đang thử việc</option>
          </select>
        </div>

        <div className="col-md-6 mb-3">
          <label><strong>Ảnh đại diện</strong></label>
          <input
            type="file"
            name="avatar"
            className="form-control"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        {/* Trường Lương Cơ Bản */}
        <div className="col-md-6 mb-3">
          <label><strong>Lương cơ bản</strong></label>
          <input
            type="number"
            name="luong_co_ban"
            className="form-control"
            value={formData.luong_co_ban}
            onChange={handleChange}
            required
          />
        </div>

      </div>

      <div className="mt-3">
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={isSubmitting}
        >
          {isSubmitting ? "⏳ Đang xử lý..." : (editingNhanSu ? "💾 Cập nhật nhân sự" : "➕ Thêm mới nhân sự")}
        </button>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </form>
  );
};

export default NhanSuAddForm;
