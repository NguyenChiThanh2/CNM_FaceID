import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NghiPhepForm = ({ onAdded, editingNghiPhep, setEditingNghiPhep }) => {
  const [formData, setFormData] = useState({
    nhan_vien_id: "",
    loai_nghi_phep_id: "",
    tu_ngay: "",
    den_ngay: "",
    ly_do: "",
    trang_thai: "Chờ duyệt",
  });
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loaiNghiPhepList, setLoaiNghiPhepList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Lấy danh sách nhân viên
    axios
      .get("http://127.0.0.1:5000/api/get-all-nhan-vien")
      .then((response) => setNhanVienList(response.data))
      .catch((error) =>
        setErrorMessage("Lỗi khi lấy danh sách nhân viên: " + error.message)
      );

    // Lấy danh sách loại nghỉ phép
    axios
      .get("http://127.0.0.1:5000/api/loai-nghi-phep")
      .then((response) => setLoaiNghiPhepList(response.data))
      .catch((error) =>
        setErrorMessage("Lỗi khi lấy danh sách loại nghỉ phép: " + error.message)
      );

    if (editingNghiPhep) {
      // Chuyển đổi ngày tháng về định dạng yyyy-mm-dd
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split("T")[0]; // Chuyển thành yyyy-mm-dd
      };

      setFormData({
        nhan_vien_id: editingNghiPhep.nhan_vien_id,
        loai_nghi_phep_id: editingNghiPhep.loai_nghi_phep_id,
        tu_ngay: formatDate(editingNghiPhep.tu_ngay),
        den_ngay: formatDate(editingNghiPhep.den_ngay),
        ly_do: editingNghiPhep.ly_do,
        trang_thai: editingNghiPhep.trang_thai,
      });
    }
  }, [editingNghiPhep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date.toISOString().split("T")[0], // lưu dưới dạng yyyy-mm-dd
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNghiPhep) {
        // Cập nhật đơn nghỉ phép
        const response = await axios.put(
          `http://127.0.0.1:5000/api/edit-nghi-phep/${editingNghiPhep.id}`,
          formData
        );
        if (response.status === 200) {
          onAdded();
          setEditingNghiPhep(null);
          toast.success("Cập nhật đơn nghỉ phép thành công!");
        } else {
          setErrorMessage("Lỗi cập nhật nghỉ phép: " + response.data.error);
          toast.error("Cập nhật đơn nghỉ phép thất bại!");
        }
      } else {
        // Thêm mới đơn nghỉ phép
        const response = await axios.post(
          "http://127.0.0.1:5000/api/add-nghi-phep",
          formData
        );
        if (response.status === 201) {
          onAdded();
          setFormData({
            nhan_vien_id: "",
            loai_nghi_phep_id: "",
            tu_ngay: "",
            den_ngay: "",
            ly_do: "",
            trang_thai: "Chờ duyệt",
          });
          toast.success("Thêm đơn nghỉ phép thành công!");
        } else {
          setErrorMessage("Lỗi thêm mới nghỉ phép: " + response.data.error);
          toast.error("Thêm đơn nghỉ phép thất bại!");
        }
      }
    } catch (error) {
      const message = error.response?.data?.error || error.message;
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
          <label className="form-label">Nhân viên</label>
          <select
            className="form-select"
            name="nhan_vien_id"
            value={formData.nhan_vien_id}
            onChange={handleChange}
            required
          >
            <option value="">Chọn nhân viên</option>
            {nhanVienList.map((nv) => (
              <option key={nv.id} value={nv.id}>
                {nv.ho_ten}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Loại nghỉ phép</label>
          <select
            className="form-select"
            name="loai_nghi_phep_id"
            value={formData.loai_nghi_phep_id}
            onChange={handleChange}
            required
          >
            <option value="">Chọn loại nghỉ phép</option>
            {loaiNghiPhepList.map((loai) => (
              <option key={loai.id} value={loai.id}>
                {loai.ten}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Từ ngày</label>
          <DatePicker
            selected={formData.tu_ngay ? new Date(formData.tu_ngay) : null}
            onChange={(date) => handleDateChange(date, "tu_ngay")}
            className="form-control w-100"
            dateFormat="yyyy-MM-dd"
            placeholderText="Chọn ngày bắt đầu"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Đến ngày</label>
          <DatePicker
            selected={formData.den_ngay ? new Date(formData.den_ngay) : null}
            onChange={(date) => handleDateChange(date, "den_ngay")}
            className="form-control w-100"
            dateFormat="yyyy-MM-dd"
            placeholderText="Chọn ngày kết thúc"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Lý do</label>
          <textarea
            className="form-control"
            name="ly_do"
            value={formData.ly_do}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>

        

        <button type="submit" className="btn btn-primary">
          {editingNghiPhep ? "Cập nhật" : "Thêm"}
        </button>
      </form>
    </div>
  );
};

export default NghiPhepForm;