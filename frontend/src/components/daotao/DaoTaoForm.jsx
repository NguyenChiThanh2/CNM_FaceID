import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

// services
import { getAllNhanVien } from "../../services/nhanSuApi";
import {
    getDaoTaoById,
    createDaoTao,
    updateDaoTao,
    assignNhanVienToDaoTao,
    assignNhanViensBulk

} from "../../services/daoTaoApi";

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const DaoTaoForm = ({ editingDaoTao, setEditingDaoTao, onAdded }) => {
    const [formData, setFormData] = useState({
        khoa_dao_tao: "",
        ngay_bat_dau: "",
        ngay_ket_thuc: "",
    });
    const [nhanVienList, setNhanVienList] = useState([]);
    const [selectedNhanViens, setSelectedNhanViens] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState("");

    const navigate = useNavigate();
    const { id } = useParams(); // chỉ có khi form chạy theo route riêng

    // Load danh sách nhân viên dùng cho checkbox
    useEffect(() => {
        (async () => {
            try {
                const nv = await getAllNhanVien();
                setNhanVienList(Array.isArray(nv) ? nv : []);
            } catch (e) {
                console.error("Lỗi khi lấy danh sách nhân viên:", e);
            }
        })();
    }, []);

    // Prefill dữ liệu:
    // - Trường hợp mở theo route: có id trên URL -> fetch by id
    // - Trường hợp mở trong modal: có editingDaoTao -> dùng editingDaoTao hoặc fetch thêm nếu thiếu
    useEffect(() => {
        const fillFrom = (data) => {
            setFormData({
                khoa_dao_tao: data.khoa_dao_tao || "",
                ngay_bat_dau: toDateInput(data.ngay_bat_dau),
                ngay_ket_thuc: toDateInput(data.ngay_ket_thuc),
            });
            if (Array.isArray(data.nhan_viens)) {
                setSelectedNhanViens(data.nhan_viens.map((nv) => Number(nv.id)));
            } else {
                setSelectedNhanViens([]);
            }
        };

        (async () => {
            try {
                // 1) Có id trên URL -> chắc chắn fetch
                if (id && id !== "create") {
                    const data = await getDaoTaoById(id);
                    fillFrom(data);
                    return;
                }

                // 2) Không có id URL (mở modal)
                if (editingDaoTao?.id) {
                    // Nếu prop có ít field (không có nhan_viens), fetch chi tiết
                    if (!editingDaoTao.nhan_viens) {
                        const data = await getDaoTaoById(editingDaoTao.id);
                        fillFrom(data);
                    } else {
                        fillFrom(editingDaoTao);
                    }
                    return;
                }

                // 3) Trạng thái tạo mới
                setFormData({ khoa_dao_tao: "", ngay_bat_dau: "", ngay_ket_thuc: "" });
                setSelectedNhanViens([]);
            } catch (e) {
                console.error("Lỗi prefill form:", e);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, editingDaoTao?.id]); // theo dõi thay đổi id hoặc switching item khi edit

    const handleChange = (e) => {
        setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
    };

    const handleSelectNhanVien = (nhanVienId) => {
        const idNum = Number(nhanVienId);
        setSelectedNhanViens((prev) =>
            prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let daoTaoId = id;

            // nếu có id URL -> edit theo URL
            // nếu mở modal -> dùng editingDaoTao?.id để quyết định edit hay create
            const isEditing = (id && id !== "create") || editingDaoTao?.id;

            if (isEditing) {
                const targetId = id && id !== "create" ? id : editingDaoTao.id;
                const res = await updateDaoTao(targetId, formData);
                daoTaoId = res?.id || targetId;
            } else {
                const res = await createDaoTao(formData);
                daoTaoId = res?.id;
            }

            // gán nhân viên (endpoint gán từng người)
            if (daoTaoId && Array.isArray(selectedNhanViens)) {
                await assignNhanViensBulk(daoTaoId, selectedNhanViens);

            }

            // nếu form dùng trong modal
            if (onAdded) onAdded();

            // nếu form chạy theo route riêng
            if (!onAdded) navigate("/dao-tao");
        } catch (error) {
            console.error("Lỗi khi thêm/sửa khóa đào tạo:", error);
        }
    };

    const filteredNhanVienList = useMemo(
        () =>
            nhanVienList.filter((nv) =>
                (nv.ho_ten || "").toLowerCase().includes((searchKeyword || "").toLowerCase())
            ),
        [nhanVienList, searchKeyword]
    );

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Khóa đào tạo</label>
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
                <label className="form-label">Ngày bắt đầu</label>
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
                <label className="form-label">Ngày kết thúc</label>
                <input
                    type="date"
                    className="form-control"
                    name="ngay_ket_thuc"
                    value={formData.ngay_ket_thuc}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label fw-bold">Chọn nhân viên</label>

                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="🔍 Tìm kiếm nhân viên..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                />

                <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
                    <span>
                        Hiển thị {filteredNhanVienList.length}/{nhanVienList.length}
                    </span>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                                setSelectedNhanViens(filteredNhanVienList.map((nv) => Number(nv.id)))
                            }
                        >
                            ✅ Chọn tất cả
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setSelectedNhanViens([])}
                        >
                            ❌ Bỏ chọn
                        </button>
                    </div>
                </div>

                <div
                    className="border rounded p-2 shadow-sm"
                    style={{ maxHeight: "320px", overflowY: "auto", background: "#fafafa" }}
                >
                    {filteredNhanVienList.length > 0 ? (
                        filteredNhanVienList.map((nv, idx) => (
                            <div
                                key={nv.id}
                                className={`form-check py-1 ${idx % 2 === 0 ? "bg-light" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id={`nv-${nv.id}`}
                                    checked={selectedNhanViens.includes(Number(nv.id))}
                                    onChange={() => handleSelectNhanVien(nv.id)}
                                />
                                <label className="form-check-label" htmlFor={`nv-${nv.id}`} style={{ cursor: "pointer" }}>
                                    {nv.ho_ten}
                                </label>
                            </div>
                        ))
                    ) : (
                        <p className="mb-0 text-muted text-center">Không tìm thấy nhân viên nào.</p>
                    )}
                </div>
            </div>

            <button type="submit" className="btn btn-primary">
                {(id && id !== "create") || editingDaoTao?.id ? "Cập nhật" : "Thêm mới"}
            </button>
        </form>
    );
};

export default DaoTaoForm;
