import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

const formatCurrency = (amount) =>
  amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const THIN_BLACK = { style: "thin", color: { argb: "FF000000" } };
const THIN_GRAY = { style: "thin", color: { argb: "FFCCCCCC" } };

export const exportBangLuongToExcel = async (filteredList, nhanVienList) => {
  if (!filteredList || filteredList.length === 0) {
    toast.warning("Không có dữ liệu để xuất Excel!");
    return;
  }

  // Chuẩn bị dữ liệu
  const data = filteredList.map((luong) => {
    const nv = nhanVienList.find((nv) => nv.id === luong.nhan_vien_id);

    const findLoai = (loai) =>
      luong.chi_tiet_luong?.find((ct) => ct.loai === loai)?.so_tien || 0;
    const sumLoai = (loai) =>
      luong.chi_tiet_luong
        ?.filter((ct) => ct.loai === loai)
        .reduce((s, ct) => s + (ct.so_tien || 0), 0) || 0;

    const formatMoney = (v) =>
      typeof v === "number" ? formatCurrency(v) : v || 0;

    return {
      "Nhân viên": nv?.ho_ten || "Không rõ",
      "Tháng/Năm": `${luong.thang}/${luong.nam}`,
      "Ngày công chuẩn": luong.ngay_cong_chuan,
      "Số ngày công": luong.so_ngay_cong,
      "Ngày phép": luong.nghi_phep,
      "Trừ nghỉ không phép": formatMoney(findLoai("NGHI_KHONG_PHEP")),
      "Ngày làm lễ": luong.tong_ngay_lam_le,
      "Tiền làm lễ": formatMoney(luong.tong_tien_lam_le),
      "Giờ tăng ca": luong.tong_gio_tang_ca,
      "Tiền tăng ca": formatMoney(luong.tong_tien_tang_ca),
      "Ngày làm cuối tuần": luong.tong_ngay_cuoi_tuan,
      "Tiền làm cuối tuần": formatMoney(luong.tong_tien_cuoi_tuan),
      "Phụ cấp ăn trưa": formatMoney(findLoai("AN_UONG")),
      "Phụ cấp xăng xe": formatMoney(findLoai("XANG_XE")),
      "Phụ cấp độc hại": formatMoney(findLoai("DOC_HAI")),
      "Phụ cấp trách nhiệm": formatMoney(findLoai("TRACH_NHIEM")),
      "Phụ cấp chức vụ": formatMoney(findLoai("CHUC_VU")),
      "Phụ cấp thâm niên": formatMoney(findLoai("THAM_NIEN")),
      "Phụ cấp khác": formatMoney(findLoai("PHU_CAP_KHAC")),
      "Tổng phụ cấp": formatMoney(luong.tong_phu_cap),
      "Thưởng nóng": formatMoney(findLoai("NONG")),
      "Thưởng lễ": formatMoney(findLoai("LE")),
      "Thưởng khác": formatMoney(sumLoai("THUONG_KHAC")),
      "Tổng thưởng": formatMoney(luong.tong_thuong),
      "Tổng lương": formatMoney(luong.tong_luong),
      "Trừ đi trễ/về sớm": formatMoney(findLoai("DI_TRE_VE_SOM")),
      "Trừ vi phạm": formatMoney(findLoai("VI_PHAM")),
      "Trừ tạm ứng": formatMoney(findLoai("UNG_LUONG")),
      "Trừ khác": formatMoney(sumLoai("TRU_KHAC")),
      "Tổng khấu trừ": formatMoney(luong.tong_khau_tru),
      "BHXH": formatMoney(luong.bhxh),
      "BHTN": formatMoney(luong.bhtn),
      "BHYT": formatMoney(luong.bhyt),
      "Thuế TNCN": formatMoney(luong.thue_tncn),
      "Thực nhận": formatCurrency(luong.thuc_nhan),
      "Ghi chú": luong.ghi_chu || "",
    };
  });

  const headerKeys = Object.keys(data[0]);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Bảng lương");

  // Hàng 1: tiêu đề lớn, merge hết chiều ngang bảng
  worksheet.mergeCells(1, 1, 1, headerKeys.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = "BẢNG LƯƠNG NHÂN VIÊN";
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };

  // Hàng 2 để trống (khoảng cách) — hàng 3 mới là header, giống bản gốc dùng
  // origin "A3" cho json_to_sheet.
  const headerRow = worksheet.getRow(3);
  headerKeys.forEach((key, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = key;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    cell.border = { top: THIN_BLACK, bottom: THIN_BLACK, left: THIN_BLACK, right: THIN_BLACK };
  });

  // Dữ liệu từ hàng 4 trở đi — border nhạt, căn phải cho số/tiền, căn trái cho
  // chữ, dòng xen kẽ tô nền nhạt (zebra stripe). R giữ đúng biến 0-based như
  // bản gốc để không lệch quy luật chẵn/lẻ zebra.
  data.forEach((rowObj, idx) => {
    const R = 3 + idx;
    const row = worksheet.getRow(R + 1);
    headerKeys.forEach((key, C) => {
      const cell = row.getCell(C + 1);
      const val = rowObj[key];
      cell.value = val;
      const isNumeric = typeof val === "number" || (typeof val === "string" && val.includes("₫"));
      cell.border = { top: THIN_GRAY, bottom: THIN_GRAY, left: THIN_GRAY, right: THIN_GRAY };
      cell.alignment = { horizontal: isNumeric ? "right" : "left", vertical: "middle" };
      if (R % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
      }
    });
  });

  // Căn chỉnh độ rộng cột
  headerKeys.forEach((key, i) => {
    worksheet.getColumn(i + 1).width = Math.max(15, key.length + 2);
  });

  // Đặt tên file
  const thangDau = filteredList[0]?.thang;
  const namDau = filteredList[0]?.nam;
  const allSameMonthYear = filteredList.every(
    (item) => item.thang === thangDau && item.nam === namDau
  );

  let fileName;
  if (allSameMonthYear) {
    fileName = `Bang_Luong_${thangDau}_${namDau}.xlsx`;
  } else {
    const nam = namDau || new Date().getFullYear();
    fileName = `Tat_ca_bang_luong_${nam}.xlsx`;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const file = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, fileName);
  toast.success(`🎉 Xuất file thành công: ${fileName}`);
};
