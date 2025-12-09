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

    ngay_du_kien_sinh: "",
    so_con: "",
    phuong_phap_sinh: "",
    can_cu_phap_ly: null,
    file_bo_sung: null,
  });
  const [nhanVienList, setNhanVienList] = useState([]);
  const [loaiNghiPhepList, setLoaiNghiPhepList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  // const [isSubmitting, setIsSubmitting] = useState(false);

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
        setErrorMessage(
          "Lỗi khi lấy danh sách loại nghỉ phép: " + error.message
        )
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
        tu_ngay: editingNghiPhep.tu_ngay,
        den_ngay: editingNghiPhep.den_ngay,
        ly_do: editingNghiPhep.ly_do,
        trang_thai: editingNghiPhep.trang_thai,
        ngay_du_kien_sinh: formatDate(editingNghiPhep.ngay_du_kien_sinh),
        so_con: editingNghiPhep.so_con,
        phuong_phap_sinh: editingNghiPhep.phuong_phap_sinh,
      });
      setFile(null);
    }
  }, [editingNghiPhep]);
  // Hàm chọn file

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // nếu chọn file mới thì set lại
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleDateChange = (date, field) => {
    if (!date) return;

    const formattedDate = date.toISOString().split("T")[0];

    // Nếu là nghỉ thai sản và đổi TU_NGAY → tự set DEN_NGAY = +6 tháng
    if (field === "tu_ngay" && parseInt(formData.loai_nghi_phep_id) === 3) {
      const endDate = new Date(date);
      endDate.setMonth(endDate.getMonth() + 6);

      const formattedEndDate = endDate.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        tu_ngay: formattedDate,
        den_ngay: formattedEndDate,
      }));
    } else {
      // Trường hợp bình thường
      setFormData((prev) => ({
        ...prev,
        [field]: formattedDate,
      }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const fd = new FormData();
    fd.append("nhan_vien_id", formData.nhan_vien_id);
    fd.append("loai_nghi_phep_id", formData.loai_nghi_phep_id);
    fd.append("tu_ngay", formData.tu_ngay);
    fd.append("den_ngay", formData.den_ngay);
    fd.append("ly_do", formData.ly_do);
    fd.append("trang_thai", formData.trang_thai);

    if (formData.ngay_du_kien_sinh) {
      fd.append("ngay_du_kien_sinh", formData.ngay_du_kien_sinh);
    }
    if (formData.so_con) {
      fd.append("so_con", formData.so_con);
    }
    if (formData.phuong_phap_sinh) {
      fd.append("phuong_phap_sinh", formData.phuong_phap_sinh);
    }
    if (formData.can_cu_phap_ly) {
      fd.append("can_cu_phap_ly", formData.can_cu_phap_ly);
    }
    // Nếu có file mới thì append, còn không thì append giá trị "keep"
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("file_status", "keep"); // báo backend giữ file cũ
    }

    let response;
    if (editingNghiPhep) {
      response = await axios.put(
        `http://127.0.0.1:5000/api/edit-nghi-phep/${editingNghiPhep.id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    } else {
      response = await axios.post(
        "http://127.0.0.1:5000/api/add-nghi-phep",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    }

    if (response.status === 200 || response.status === 201) {
      onAdded();
      setEditingNghiPhep(null);
      toast.success(editingNghiPhep ? "Cập nhật thành công!" : "Thêm thành công!");
      setFormData({
        nhan_vien_id: "",
        loai_nghi_phep_id: "",
        tu_ngay: "",
        den_ngay: "",
        ly_do: "",
        trang_thai: "Chờ duyệt",
        ngay_du_kien_sinh: "",
        so_con: "",
        phuong_phap_sinh: "",
        can_cu_phap_ly: null,
      });
      setFile(null);
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
              <option key={nv.id} value={nv.id} disabled={formData.trang_thai === "Đã duyệt"}>
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
            disabled={formData.trang_thai === "Đã duyệt"}
          >
            <option value="">Chọn loại nghỉ phép</option>
            {loaiNghiPhepList.map((loai) => (
              <option key={loai.id} value={loai.id}>
                {loai.ten}
              </option>
            ))}
          </select>
        </div>

        {/* Trường bổ sung cho nghỉ thai sản */}
        {parseInt(formData.loai_nghi_phep_id) === 3 && (
          <>
            <div className="mb-3">
              <label className="form-label me-3">
                Ngày dự kiến sinh/nhận nuôi
              </label>
              <DatePicker
                selected={
                  formData.ngay_du_kien_sinh
                    ? new Date(formData.ngay_du_kien_sinh)
                    : null
                }
                onChange={(date) => handleDateChange(date, "ngay_du_kien_sinh")}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="Chọn ngày dự kiến sinh"
                disabled={formData.trang_thai === "Đã duyệt"}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Số con sinh/nhận nuôi</label>
              <input
                type="number"
                className="form-control"
                name="so_con"
                value={formData.so_con}
                onChange={handleChange}
                min="1"
                placeholder="Nhập số con"
                disabled={formData.trang_thai === "Đã duyệt"}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Phương pháp sinh</label>
              <select
                className="form-select"
                name="phuong_phap_sinh"
                value={formData.phuong_phap_sinh}
                onChange={handleChange}
                disabled={formData.trang_thai === "Đã duyệt"}
              >
                <option value="">Chọn phương pháp</option>
                <option value="Sinh thường">Sinh thường</option>
                <option value="Sinh mổ">Sinh mổ / Cần phẫu thuật</option>
              </select>
            </div>

            
          </>
        )}
        <div className="mb-3">
              <label className="form-label">
                Căn cứ pháp lý (đính kèm file)
              </label>
              <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
                {editingNghiPhep && !file && (
                  <small className="text-muted">File hiện tại: {editingNghiPhep.can_cu_phap_ly_file}</small>
                )}
            </div>
        <div className="row mb-3">
          <div className="col-md-2">
            <label className="form-label">Từ ngày</label>
          </div>
          <div className="col-md-10">
            <DatePicker
              selected={formData.tu_ngay ? new Date(formData.tu_ngay) : null}
              onChange={(date) => handleDateChange(date, "tu_ngay")}
              className="form-control w-100"
              dateFormat="yyyy-MM-dd"
              placeholderText="Chọn ngày bắt đầu"
              required
              disabled={formData.trang_thai === "Đã duyệt"}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-2">
            <label className="form-label">Đến hết ngày</label>
          </div>
          <div className="col-md-10">
            <DatePicker
              selected={formData.den_ngay ? new Date(formData.den_ngay) : null}
              onChange={(date) => handleDateChange(date, "den_ngay")}
              className="form-control w-100"
              dateFormat="yyyy-MM-dd"
              placeholderText="Chọn ngày kết thúc"
              required
              // disabled={formData.trang_thai === "Đã duyệt"}
            />

          </div>
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
            disabled={formData.trang_thai === "Đã duyệt"}
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
