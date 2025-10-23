import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

const formatCurrency = (amount) =>
  amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export const exportBangLuongToExcel = (filteredList, nhanVienList) => {
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

  // Chuyển JSON -> sheet
  const worksheet = XLSX.utils.json_to_sheet(data, { origin: "A3" });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bảng lương");

  // Thêm tiêu đề lớn
  const title = [["BẢNG LƯƠNG NHÂN VIÊN"]];
  XLSX.utils.sheet_add_aoa(worksheet, title, { origin: "A1" });

  // Merge ô tiêu đề lớn
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Object.keys(data[0]).length - 1 } },
  ];

  // Style tiêu đề chính
  worksheet["A1"].s = {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    fill: { fgColor: { rgb: "4F81BD" } },
  };

  // Style header hàng thứ 3
  const headerKeys = Object.keys(data[0]);
  headerKeys.forEach((key, i) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 2, c: i });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "1F4E78" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  });

  // Thêm border và style cho từng dòng
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  for (let R = 3; R <= range.e.r; ++R) {
    for (let C = 0; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell) {
        cell.s = {
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
          alignment: {
            horizontal:
              typeof cell.v === "number" || cell.v?.includes("₫")
                ? "right"
                : "left",
            vertical: "center",
          },
        };

        // Dòng xen kẽ màu nền nhạt
        if (R % 2 === 0)
          cell.s.fill = { fgColor: { rgb: "F2F2F2" } };
      }
    }
  }

  // Căn chỉnh độ rộng cột tự động
  worksheet["!cols"] = headerKeys.map((key) => ({
    wch: Math.max(15, key.length + 2),
  }));

  // Lưu file
  const thangDau = filteredList[0]?.thang;
  const namDau = filteredList[0]?.nam;

  // Kiểm tra xem tất cả dữ liệu có cùng tháng và năm không
  const allSameMonthYear = filteredList.every(
    (item) => item.thang === thangDau && item.nam === namDau
  );

  // Nếu tất cả cùng tháng/năm → xuất đúng tháng, năm
  // Nếu không → xuất file "Tat_ca_bang_luong_[nam]"
  let fileName;
  if (allSameMonthYear) {
    fileName = `Bang_Luong_${thangDau}_${namDau}.xlsx`;
  } else {
    const nam = namDau || new Date().getFullYear();
    fileName = `Tat_ca_bang_luong_${nam}.xlsx`;
  }

  // Ghi file Excel
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(file, fileName);
  toast.success(`🎉 Xuất file thành công: ${fileName}`);
};
