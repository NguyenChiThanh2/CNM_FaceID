import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { computeEndDateFE } from "../../utils/contractDuration";
import {
    createHopDongForNhanVien,
    updateHopDong,
} from "../../services/hopDongLaoDongApi";
import { toast } from "react-toastify";

export default function HopDongFormModal({
    show,
    onHide,
    initial,
    nhanVienId,
    onUpdated, // ✅ callback để reload biểu đồ
}) {
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (!show) setForm({});
    }, [show]);
    // 🧩 Khi modal mở lại => set lại form theo "initial"
    useEffect(() => {
        setForm({
            loai_hop_dong: initial?.loai_hop_dong || "",
            ngay_bat_dau: initial?.ngay_bat_dau
                ? (initial.ngay_bat_dau.slice
                    ? initial.ngay_bat_dau.slice(0, 10)
                    : initial.ngay_bat_dau)
                : "",
            thoi_gian_hop_dong: initial?.thoi_gian_hop_dong || "",
            muc_luong_co_ban: initial?.muc_luong_co_ban ?? "",
            di_tre_phat: initial?.di_tre_phat ?? "",
            ve_som_phat: initial?.ve_som_phat ?? "",
            tang_ca_heso: initial?.tang_ca_heso ?? "",
            luong_ngay_le_heso: initial?.luong_ngay_le_heso ?? "",
            luong_cuoi_tuan_heso: initial?.luong_cuoi_tuan_heso ?? "",
            phu_cap_an_trua: initial?.phu_cap_an_trua ?? "",
            phu_cap_xang_xe: initial?.phu_cap_xang_xe ?? "",
            phu_cap_doc_hai: initial?.phu_cap_doc_hai ?? "",
            phu_cap_trach_nhiem: initial?.phu_cap_trach_nhiem ?? "",
            phu_cap_chuc_vu: initial?.phu_cap_chuc_vu ?? "",
            phu_cap_tham_nien: initial?.phu_cap_tham_nien ?? "",
            phep_nam: initial?.phep_nam ?? 0,
            trang_thai:
                typeof initial?.trang_thai !== "undefined" ? initial.trang_thai : true,
        });
    }, [initial, show]);
    // Format số để hiển thị
    const formatCurrency = (num) => {
        if (num === null || num === undefined || num === "") return "";
        return num.toLocaleString("vi-VN");
    };

    const parseCurrency = (str) => {
        if (!str) return "";
        const raw = str.replace(/[^0-9]/g, ""); // chỉ giữ số
        return raw === "" ? "" : Number(raw);
    };


    // 🧩 Thay đổi input
    const onChange = (e) => {
        const { name, type, value, checked } = e.target;
        setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
    };

    // 🧩 Tính ngày kết thúc tạm xem trước
    const previewEnd = useMemo(() => {
        if (!form.ngay_bat_dau || !form.thoi_gian_hop_dong) return "";
        return computeEndDateFE(form.ngay_bat_dau, form.thoi_gian_hop_dong);
    }, [form.ngay_bat_dau, form.thoi_gian_hop_dong]);

    // 🧩 Xử lý lưu hợp đồng
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nhanVienId && nhanVienId !== 0) {
            console.error("❌ nhanVienId is missing in props");
            toast.error("Thiếu nhanVienId. Vui lòng mở form từ trang chi tiết nhân sự hoặc truyền đúng prop.");
            return;
        }
        const toNum = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

        if (!form.loai_hop_dong || !form.ngay_bat_dau || (!form.muc_luong_co_ban && form.muc_luong_co_ban !== 0)) {
            toast.warning("Vui lòng nhập Loại HĐ, Ngày bắt đầu và Lương cơ bản.");
            return;
        }
        if (!form.thoi_gian_hop_dong) {
            toast.warning('Vui lòng nhập Thời hạn hợp đồng (VD: "12 tháng", "1 năm", "Không thời hạn").');
            return;
        }

        const payload = {
            loai_hop_dong: form.loai_hop_dong,
            ngay_bat_dau: form.ngay_bat_dau,
            thoi_gian_hop_dong: form.thoi_gian_hop_dong,
            muc_luong_co_ban: Number(form.muc_luong_co_ban),
            di_tre_phat: toNum(form.di_tre_phat),
            ve_som_phat: toNum(form.ve_som_phat),
            tang_ca_heso: toNum(form.tang_ca_heso),
            luong_ngay_le_heso: toNum(form.luong_ngay_le_heso),
            luong_cuoi_tuan_heso: toNum(form.luong_cuoi_tuan_heso),
            phu_cap_an_trua: toNum(form.phu_cap_an_trua),
            phu_cap_xang_xe: toNum(form.phu_cap_xang_xe),
            phu_cap_doc_hai: toNum(form.phu_cap_doc_hai),
            phu_cap_trach_nhiem: toNum(form.phu_cap_trach_nhiem),
            phu_cap_chuc_vu: toNum(form.phu_cap_chuc_vu),
            phu_cap_tham_nien: toNum(form.phu_cap_tham_nien),
            phep_nam: Number(form.phep_nam || 0),
            trang_thai: !!form.trang_thai,
        };

        setLoading(true);
        try {
            await toast.promise(
                initial?.id
                    ? updateHopDong(initial.id, payload)
                    : createHopDongForNhanVien(nhanVienId, payload),
                {
                    pending: initial?.id ? "Đang cập nhật hợp đồng..." : "Đang thêm hợp đồng...",
                    success: initial?.id ? "Cập nhật hợp đồng thành công!" : "Thêm hợp đồng mới thành công!",
                    error: {
                        render({ data }) {
                            // data là error object bị throw trong services (có .userMessage)
                            return data?.userMessage || "Có lỗi khi lưu hợp đồng!";
                        },
                    },
                }
            );

            onUpdated?.();   // cập nhật biểu đồ
            onHide();        // đóng modal (nếu muốn giữ modal mở, bỏ dòng này)
        } catch (err) {
            // lỗi đã được toast.promise hiển thị, không cần toast lần nữa
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal show={show} onHide={onHide} centered size="lg" data-noexport="true">
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">
                    {initial ? "Cập nhật HĐ lao động" : "Thêm HĐ lao động mới"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <form onSubmit={handleSubmit} className="px-1">

                    {/* --- THÔNG TIN HỢP ĐỒNG --- */}
                    <fieldset className="border rounded p-3 mb-3">
                        <legend className="float-none w-auto px-2 fs-6 fw-semibold">
                            Thông tin hợp đồng
                        </legend>

                        <div className="row g-3">

                            <div className="col-md-6">
                                <label className="form-label">Loại hợp đồng</label>
                                <input
                                    name="loai_hop_dong"
                                    className="form-control"
                                    value={form.loai_hop_dong}
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Lương cơ bản</label>
                                <input
                                    type="text"
                                    name="muc_luong_co_ban"
                                    className="form-control"
                                    value={formatCurrency(form.muc_luong_co_ban)}
                                    onChange={(e) => {
                                        let num = parseCurrency(e.target.value);
                                        if (num < 0) num = 0;
                                        setForm(s => ({ ...s, muc_luong_co_ban: num }));
                                    }}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    name="ngay_bat_dau"
                                    className="form-control"
                                    value={form.ngay_bat_dau}
                                    onChange={onChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Thời hạn hợp đồng</label>
                                <input
                                    name="thoi_gian_hop_dong"
                                    className="form-control"
                                    placeholder='12 tháng / 1 năm 6 tháng / Không thời hạn'
                                    value={form.thoi_gian_hop_dong}
                                    onChange={onChange}
                                    required
                                />
                                {!previewEnd && form.thoi_gian_hop_dong?.trim() && (
                                    <small className="text-danger">
                                        Không tính được ngày kết thúc từ thời hạn đã nhập.
                                    </small>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">Ngày kết thúc (tự tính)</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={previewEnd || ""}
                                    readOnly
                                />
                                {previewEnd === "" && form.thoi_gian_hop_dong?.trim() && (
                                    <small className="text-muted">
                                        Không thời hạn hoặc chưa xác định ngày kết thúc.
                                    </small>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    {/* --- PHỤ CẤP & HỆ SỐ --- */}
                    <fieldset className="border rounded p-3 mb-3">
                        <legend className="float-none w-auto px-2 fs-6 fw-semibold">
                            Hệ số & phụ cấp
                        </legend>

                        <div className="row g-3">

                            {/* --- HỆ SỐ: dùng text + parse thủ công, không cho nhập âm --- */}
                            {/* --- HỆ SỐ: nhập thập phân thoải mái mà không bị reset --- */}
                            {[
                                ["tang_ca_heso", "HS tăng ca"],
                                ["luong_ngay_le_heso", "HS ngày lễ"],
                                ["luong_cuoi_tuan_heso", "HS cuối tuần"],
                            ].map(([name, label]) => (
                                <div className="col-md-4" key={name}>
                                    <label className="form-label">{label}</label>

                                    <input
                                        type="text"
                                        name={name}
                                        className="form-control"
                                        value={form[name]}
                                        onChange={(e) => {
                                            let v = e.target.value;

                                            // chỉ cho số, dấu chấm, và tối đa 1 dấu chấm
                                            if (!/^\d*\.?\d*$/.test(v)) return;

                                            // không cho nhập âm
                                            if (v.startsWith("-")) return;

                                            setForm((s) => ({ ...s, [name]: v }));
                                        }}
                                        onBlur={() => {
                                            let num = parseFloat(form[name]);
                                            if (isNaN(num) || num < 0) num = 0;
                                            setForm((s) => ({ ...s, [name]: num.toString() }));
                                        }}
                                    />
                                </div>
                            ))}


                            {/* --- PHỤ CẤP: format như lương cơ bản --- */}
                            {[
                                ["phu_cap_an_trua", "Ăn trưa"],
                                ["phu_cap_xang_xe", "Xăng xe"],
                                ["phu_cap_doc_hai", "Độc hại"],
                                ["phu_cap_trach_nhiem", "Trách nhiệm"],
                                ["phu_cap_chuc_vu", "Chức vụ"],
                                ["phu_cap_tham_nien", "Thâm niên"],
                            ].map(([name, label]) => (
                                <div className="col-md-4" key={name}>
                                    <label className="form-label">Phụ cấp {label}</label>
                                    <input
                                        type="text"
                                        name={name}
                                        className="form-control"
                                        value={formatCurrency(form[name])}
                                        onChange={(e) => {
                                            let num = parseCurrency(e.target.value);
                                            if (num < 0) num = 0;
                                            setForm((s) => ({ ...s, [name]: num }));
                                        }}
                                    />
                                </div>
                            ))}

                        </div>
                    </fieldset>


                    {/* --- PHẠT & PHÉP --- */}
                    <fieldset className="border rounded p-3 mb-3">
                        <legend className="float-none w-auto px-2 fs-6 fw-semibold">
                            Phạt – Phép năm – Trạng thái
                        </legend>

                        <div className="row g-3">

                            {/* Các input phạt cũng chuyển sang text + formatCurrency */}
                            <div className="col-md-4">
                                <label className="form-label">Phạt đi trễ (VNĐ)</label>
                                <input
                                    type="text"
                                    name="di_tre_phat"
                                    className="form-control"
                                    value={formatCurrency(form.di_tre_phat)}
                                    onChange={(e) => {
                                        let num = parseCurrency(e.target.value);
                                        if (num < 0) num = 0;
                                        setForm(s => ({ ...s, di_tre_phat: num }));
                                    }}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Phạt về sớm (VNĐ)</label>
                                <input
                                    type="text"
                                    name="ve_som_phat"
                                    className="form-control"
                                    value={formatCurrency(form.ve_som_phat)}
                                    onChange={(e) => {
                                        let num = parseCurrency(e.target.value);
                                        if (num < 0) num = 0;
                                        setForm(s => ({ ...s, ve_som_phat: num }));
                                    }}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Phép năm</label>
                                <input
                                    type="number"
                                    name="phep_nam"
                                    className="form-control"
                                    value={form.phep_nam}
                                    onChange={onChange}
                                    min="0"
                                />
                            </div>

                            <div className="col-md-12 d-flex align-items-center pt-2">
                                <div className="form-check ms-1">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="trang_thai"
                                        id="hd-trang-thai"
                                        checked={form.trang_thai}
                                        onChange={onChange}
                                    />
                                    <label className="form-check-label ms-1" htmlFor="hd-trang-thai">
                                        Đang hiệu lực / hiển thị
                                    </label>
                                </div>
                            </div>

                        </div>
                    </fieldset>

                    {/* --- BUTTONS --- */}
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <Button type="submit" variant="success" disabled={loading}>
                            {loading ? "Đang lưu..." : initial ? "Cập nhật" : "Thêm mới"}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={onHide}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                    </div>

                </form>
            </Modal.Body>
        </Modal>


    );
}
