import React, { useState, useEffect } from "react";
import axios from "axios";

const DaoTaoForm = ({ onAdded, editingDaoTao }) => {
    const [formData, setFormData] = useState({
        khoa_dao_tao: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: ""
    });

    useEffect(() => {
        if (editingDaoTao) {
            setFormData({
                khoa_dao_tao: editingDaoTao.khoa_dao_tao || "",
                ngay_bat_dau: editingDaoTao.ngay_bat_dau || "",
                ngay_ket_thuc: editingDaoTao.ngay_ket_thuc || ""
            });
        }
    }, [editingDaoTao]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDaoTao) {
                await axios.put(`http://127.0.0.1:5000/api/edit-dao-tao/${editingDaoTao.id}`, formData);
            } else {
                await axios.post("http://127.0.0.1:5000/api/add-dao-tao", formData);
            }
            onAdded();
        } catch (error) {
            console.error("Lỗi khi lưu:", error);
            alert("Đã xảy ra lỗi khi lưu dữ liệu.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Tên Khóa Đào Tạo</label>
                <input
                    type="text"
                    className="form-control"
                    name="khoa_dao_tao"
                    value={formData.khoa_dao_tao}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Ngày Bắt Đầu</label>
                <input
                    type="date"
                    className="form-control"
                    name="ngay_bat_dau"
                    value={formData.ngay_bat_dau}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Ngày Kết Thúc</label>
                <input
                    type="date"
                    className="form-control"
                    name="ngay_ket_thuc"
                    value={formData.ngay_ket_thuc}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary">
                {editingDaoTao ? "Lưu chỉnh sửa" : "Tạo mới"}
            </button>
        </form>
    );
};

export default DaoTaoForm;
