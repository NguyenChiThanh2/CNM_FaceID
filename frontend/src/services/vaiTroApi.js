import axiosInstance from "./axiosInstance";

const unwrap = (p) => p.then((r) => r.data);

export const getAllVaiTro = () => unwrap(axiosInstance.get("/vai-tro"));

// Gán (hoặc gỡ, nếu vaiTroId = null) vai trò cho 1 nhân viên đã tồn tại —
// dùng chung 1 API có sẵn (PUT /nhan-vien/:id/vai-tro) cho cả lúc tạo mới
// (gọi thêm bước này ngay sau khi tạo xong) lẫn khi cần đổi vai trò sau này.
export const ganVaiTroChoNhanVien = (nhanVienId, vaiTroId) =>
  unwrap(
    axiosInstance.put(`/nhan-vien/${nhanVienId}/vai-tro`, {
      vai_tro_id: vaiTroId,
    })
  );
