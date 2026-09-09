// File: src/services/nguoiPhuThuocApi.js
import axiosInstance from "./axiosInstance";

/** Unwrap chuẩn hoá lỗi (đưa msg rõ ràng vào e.userMessage để toast.promise dùng được).
 * axiosInstance đã tự chuẩn hoá lỗi thành {message, status, raw, data} (xem
 * normalizeError trong axiosInstance.js) — e.response không còn tồn tại, và
 * e.message đã ưu tiên lấy message/error từ payload BE rồi nên không cần tự
 * đọc lại e.data.message/e.data.error ở đây nữa. */
const unwrap = async (p) => {
    try {
        const r = await p;
        return r.data;
    } catch (e) {
        e.userMessage = e?.message || "Lỗi kết nối đến máy chủ. Vui lòng thử lại.";
        throw e;
    }
};

/** Chuẩn hoá định dạng YYYY-MM-DD (BE cũng chấp nhận DD/MM/YYYY; nhưng ta gửi Y-M-D cho chắc) */
const toYMD = (d) => {
    if (!d) return null;
    if (typeof d === "string") return d; // đã đúng định dạng thì giữ nguyên
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const dt = new Date(d);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

/** Build payload gửi BE (lọc field rỗng, chuẩn hoá ngày) */
const buildPayload = (payload = {}) => {
    const body = {
        nhan_vien_id: payload.nhan_vien_id != null ? Number(payload.nhan_vien_id) : undefined,
        ho_ten: payload.ho_ten?.trim(),
        quan_he: payload.quan_he?.trim(),
        ngay_bat_dau: toYMD(payload.ngay_bat_dau),
        ngay_ket_thuc: toYMD(payload.ngay_ket_thuc),
        ghi_chu: payload.ghi_chu?.trim(),
    };
    // loại các key undefined để không ghi đè vô tình
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    return body;
};

/** ========== API ========== */

/** List (không phân trang) – hỗ trợ q / nhan_vien_id / active_on */
export const listNguoiPhuThuoc = (params = {}) =>
    unwrap(
        axiosInstance.get("/nguoi-phu-thuoc/", {
            params: {
                q: params.q || undefined,
                nhan_vien_id:
                    params.nhan_vien_id != null && params.nhan_vien_id !== ""
                        ? Number(params.nhan_vien_id)
                        : undefined,
                active_on: params.active_on || undefined, // 'YYYY-MM-DD'
            },
        })
    );

/** Lấy chi tiết */
export const getNguoiPhuThuocById = (id) =>
    unwrap(axiosInstance.get(`/nguoi-phu-thuoc/${id}`));

/** Tạo mới */
export const createNguoiPhuThuoc = (payload) =>
    unwrap(axiosInstance.post("/nguoi-phu-thuoc/", buildPayload(payload)));

/** Cập nhật (partial) */
export const updateNguoiPhuThuoc = (id, payload) =>
    unwrap(axiosInstance.patch(`/nguoi-phu-thuoc/${id}`, buildPayload(payload)));

/** Xoá */
export const deleteNguoiPhuThuoc = (id) =>
    unwrap(axiosInstance.delete(`/nguoi-phu-thuoc/${id}`));
