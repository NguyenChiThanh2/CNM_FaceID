import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const addSimpleSheet = (workbook, name, data, columnWidths) => {
  const worksheet = workbook.addWorksheet(name);
  if (data && data.length > 0) {
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map((h, i) => ({
      header: h,
      key: h,
      width: columnWidths?.[i] ?? Math.max(12, h.length + 2),
    }));
    worksheet.addRows(data);
    worksheet.getRow(1).font = { bold: true };
  }
  return worksheet;
};

// Xuất 1 mảng object -> 1 sheet Excel đơn giản, tự tải file về máy. Thay cho
// pattern lặp lại nhiều nơi: XLSX.utils.json_to_sheet + book_new +
// book_append_sheet + write + Blob + saveAs. `columnWidths` (mảng số, theo
// đúng thứ tự cột) là tùy chọn — không truyền thì tự tính theo độ dài tiêu đề.
export const exportJsonToExcel = async (data, sheetName, fileName, columnWidths) => {
  const workbook = new ExcelJS.Workbook();
  addSimpleSheet(workbook, sheetName, data, columnWidths);
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: XLSX_MIME }), fileName);
};

// Xuất nhiều sheet trong cùng 1 file — dùng cho các báo cáo gộp (vd thuế +
// bảo hiểm doanh nghiệp + chi tiết nhân viên trong 1 file).
export const exportMultiSheetToExcel = async (sheets, fileName) => {
  const workbook = new ExcelJS.Workbook();
  for (const { name, data } of sheets) {
    addSimpleSheet(workbook, name, data);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: XLSX_MIME }), fileName);
};
