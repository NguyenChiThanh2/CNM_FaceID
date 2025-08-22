import React, { useState } from "react";

const UploadForm = () => {
  const [hoTen, setHoTen] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    setPreview(URL.createObjectURL(file)); // hiển thị ảnh preview
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hoTen || !avatar) return alert("Điền tên và chọn ảnh");

    const formData = new FormData();
    formData.append("ho_ten", hoTen);
    formData.append("avatar", avatar);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/add-nhan-vien", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert(data.message);
      setHoTen("");
      setAvatar(null);
      setPreview(null);
    } catch (err) {
      console.error("Lỗi upload:", err);
      alert("Upload thất bại!");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Thêm nhân viên</h3>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="mb-3">
          <label>Họ tên</label>
          <input
            type="text"
            className="form-control"
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label>Chọn ảnh đại diện</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </div>

        {preview && (
          <div className="mb-3">
            <img src={preview} alt="Preview" width={150} className="rounded shadow" />
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100">
          Thêm
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
