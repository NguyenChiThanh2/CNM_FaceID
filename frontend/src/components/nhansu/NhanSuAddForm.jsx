import React, { useState, useEffect } from "react";

// dùng service
import {
  createNhanVien,
  updateNhanVien,
} from "../../services/nhanSuApi";
import { ganVaiTroChoNhanVien } from "../../services/vaiTroApi";

// dsChucVu/dsPhongBan/dsVaiTro nhận qua props từ QuanLyNhanSu.jsx (trang cha
// đã fetch sẵn 1 lần cho bảng danh sách) — trước đây form tự fetch lại các
// API này mỗi lần modal "Thêm/Sửa nhân sự" mở, dù dữ liệu đã có sẵn ở trang cha.
const NhanSuAddForm = ({ onAdded, editingNhanSu, setEditingNhanSu, dsChucVu = [], dsPhongBan = [], dsVaiTro = [] }) => {
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
    // Chỉ dùng lúc TẠO MỚI (xem handleSubmit) — không gửi kèm trong form data
    // của add-nhan-vien/edit-nhan-vien (BE cố tình không cho sửa vai_tro_id
    // qua 2 API đó, tránh 1 nhân viên tự sửa hồ sơ của mình tự nâng quyền).
    // Sau khi tạo xong, gọi riêng API PUT /nhan-vien/:id/vai-tro để gán.
    vai_tro_id: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingNhanSu) {
      setFormData({
        ...editingNhanSu,
        avatar: null, // tránh gửi lại file cũ
        chuc_vu_id: editingNhanSu.chuc_vu_id ? String(editingNhanSu.chuc_vu_id) : "",
        phong_ban_id: editingNhanSu.phong_ban_id ? String(editingNhanSu.phong_ban_id) : "",
      });
    } else {
      resetForm();
    }
  }, [editingNhanSu]);

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
      vai_tro_id: "",
    });
  };

  const validatePhoneNumber = (phone) => /^(03|05|07|08|09)\d{8}$/.test(phone);

  const validateForm = () => {
    if (!formData.ho_ten || !formData.email || !formData.so_dien_thoai) {
      return { ok: false, msg: "Vui lòng điền đầy đủ thông tin." };
    }
    if (!validatePhoneNumber(formData.so_dien_thoai)) {
      return { ok: false, msg: "Số điện thoại không hợp lệ." };
    }
    const luong = Number(formData.luong_co_ban);
    return { ok: true };
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") setFormData((s) => ({ ...s, [name]: files?.[0] || null }));
    else setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const v = validateForm();
    if (!v.ok) {
      // báo cho cha biết để hiển thị toast
      await onAdded?.(false, new Error(v.msg));
      setIsSubmitting(false);
      return;
    }

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        // vai_tro_id không gửi qua đây — BE cố tình không nhận field này ở
        // add-nhan-vien/edit-nhan-vien, gán riêng ở dưới bằng API khác.
        if (k === "vai_tro_id") return;
        if (v !== null && v !== undefined) form.append(k, v);
      });

      if (editingNhanSu?.id) {
        await updateNhanVien(editingNhanSu.id, form);
      } else {
        const created = await createNhanVien(form);
        if (formData.vai_tro_id) {
          await ganVaiTroChoNhanVien(created.id, Number(formData.vai_tro_id));
        }
      }

      await onAdded?.(true);
      resetForm();
      setEditingNhanSu?.(null);
    } catch (err) {
      console.error("Lỗi submit:", err);
      await onAdded?.(false, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="p-4 border rounded shadow-sm bg-white"
    >
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
            type="tel"
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
              <option key={cv.id} value={String(cv.id)}>
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

        {!editingNhanSu && (
          <div className="col-md-6 mb-3">
            <label><strong>Vai trò</strong></label>
            <select
              name="vai_tro_id"
              className="form-control"
              value={formData.vai_tro_id}
              onChange={handleChange}
            >
              <option value="">-- Không gán vai trò --</option>
              {dsVaiTro.map((vt) => (
                <option key={vt.id} value={String(vt.id)}>
                  {vt.ten_vai_tro}
                </option>
              ))}
            </select>
            <small className="text-muted">
              Quyết định nhân viên này được thao tác gì trong hệ thống. Có thể để trống, gán sau.
            </small>
          </div>
        )}

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
            <option value="Đang thử việc">Đang thử việc</option>
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
      </div>

      <div className="mt-3">
        <button type="submit" className="btn btn-success w-100" disabled={isSubmitting}>
          {isSubmitting ? "⏳ Đang xử lý..." : editingNhanSu ? "💾 Cập nhật nhân sự" : "➕ Thêm mới nhân sự"}
        </button>
      </div>
    </form>
  );
};

export default NhanSuAddForm;
