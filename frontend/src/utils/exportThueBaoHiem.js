// utils/exportThueBaoHiem.js
import * as XLSX from 'xlsx';

export const exportEmployeeTaxExcel = (employeeData, year, currentUser) => {
  try {
    // Tạo worksheet từ dữ liệu
    const worksheetData = employeeData.map(item => ({
      'Năm': item.year,
      'Nhân viên': item.employeeName || currentUser?.ho_ten || 'Không rõ',
      'Mã NV': item.maNhanVien || currentUser?.ma_nhan_vien || 'N/A',
      'Thuế TNCN': item.totalThueTNCN,
      'BHXH': item.totalBHXH,
      'BHYT': item.totalBHYT,
      'BHTN': item.totalBHTN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
      'Trung bình/tháng': item.trungBinhThang || (item.totalAll / item.monthCount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Tùy chỉnh độ rộng cột
    const colWidths = [
      { wch: 8 },  // Năm
      { wch: 25 }, // Nhân viên
      { wch: 15 }, // Mã NV
      { wch: 15 }, // Thuế TNCN
      { wch: 15 }, // BHXH
      { wch: 15 }, // BHYT
      { wch: 15 }, // BHTN
      { wch: 15 }, // Tổng cộng
      { wch: 10 }, // Số tháng
      { wch: 15 }, // TB/tháng
    ];
    worksheet['!cols'] = colWidths;

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Thuế_BH_NV_${year}`);

    // Xuất file
    const fileName = `Thue_Bao_Hiem_Nhan_Vien_${currentUser?.ma_nhan_vien || 'NV'}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel nhân viên:', error);
    throw error;
  }
};

export const exportCompanyInsuranceExcel = (companyData, year) => {
  try {
    // Tạo worksheet từ dữ liệu
    const worksheetData = companyData.map(item => ({
      'Năm': item.year,
      'BHXH Doanh nghiệp': item.totalBHXH_DN,
      'BHYT Doanh nghiệp': item.totalBHYT_DN,
      'BHTN Doanh nghiệp': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
      'Trung bình/tháng': item.trungBinhThang || (item.totalAll / item.monthCount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Tùy chỉnh độ rộng cột
    const colWidths = [
      { wch: 8 },  // Năm
      { wch: 20 }, // BHXH DN
      { wch: 20 }, // BHYT DN
      { wch: 20 }, // BHTN DN
      { wch: 20 }, // Tổng cộng
      { wch: 10 }, // Số tháng
      { wch: 20 }, // TB/tháng
    ];
    worksheet['!cols'] = colWidths;

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `BH_DN_${year}`);

    // Xuất file
    const fileName = `Bao_Hiem_Doanh_Nghiep_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel doanh nghiệp:', error);
    throw error;
  }
};

export const exportCompanyEmployeeDetailsExcel = (employeeDetails, year) => {
  try {
    // Tạo worksheet từ dữ liệu
    const worksheetData = employeeDetails.map((item, index) => ({
      'STT': index + 1,
      'Nhân viên': item.employeeName,
      'BHXH Doanh nghiệp': item.totalBHXH_DN,
      'BHYT Doanh nghiệp': item.totalBHYT_DN,
      'BHTN Doanh nghiệp': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
      'Trung bình/tháng': item.totalAll / item.monthCount
    }));

    // Thêm dòng tổng cộng
    const totalRow = {
      'STT': 'TỔNG',
      'Nhân viên': '',
      'BHXH Doanh nghiệp': employeeDetails.reduce((sum, item) => sum + item.totalBHXH_DN, 0),
      'BHYT Doanh nghiệp': employeeDetails.reduce((sum, item) => sum + item.totalBHYT_DN, 0),
      'BHTN Doanh nghiệp': employeeDetails.reduce((sum, item) => sum + item.totalBHTN_DN, 0),
      'Tổng cộng': employeeDetails.reduce((sum, item) => sum + item.totalAll, 0),
      'Số tháng': employeeDetails.reduce((sum, item) => sum + item.monthCount, 0),
      'Trung bình/tháng': employeeDetails.reduce((sum, item) => sum + item.totalAll, 0) / 
                         employeeDetails.reduce((sum, item) => sum + item.monthCount, 0)
    };
    
    worksheetData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Tùy chỉnh độ rộng cột
    const colWidths = [
      { wch: 5 },   // STT
      { wch: 25 },  // Nhân viên
      { wch: 20 },  // BHXH DN
      { wch: 20 },  // BHYT DN
      { wch: 20 },  // BHTN DN
      { wch: 20 },  // Tổng cộng
      { wch: 10 },  // Số tháng
      { wch: 20 },  // TB/tháng
    ];
    worksheet['!cols'] = colWidths;

    // Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Chi_Tiet_NV_${year}`);

    // Xuất file
    const fileName = `Chi_Tiet_Bao_Hiem_Nhan_Vien_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel chi tiết nhân viên:', error);
    throw error;
  }
};

// Hàm xuất tất cả
export const exportAllTaxInsuranceData = (employeeData, companyData, employeeDetails, year, currentUser) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Thuế & BH nhân viên
    const employeeSheetData = employeeData.map(item => ({
      'Năm': item.year,
      'Nhân viên': item.employeeName || currentUser?.ho_ten || 'Không rõ',
      'Thuế TNCN': item.totalThueTNCN,
      'BHXH': item.totalBHXH,
      'BHYT': item.totalBHYT,
      'BHTN': item.totalBHTN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
    }));
    
    const employeeWorksheet = XLSX.utils.json_to_sheet(employeeSheetData);
    XLSX.utils.book_append_sheet(workbook, employeeWorksheet, 'Thuế_BH_NV');
    
    // Sheet 2: BH doanh nghiệp
    const companySheetData = companyData.map(item => ({
      'Năm': item.year,
      'BHXH DN': item.totalBHXH_DN,
      'BHYT DN': item.totalBHYT_DN,
      'BHTN DN': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
    }));
    
    const companyWorksheet = XLSX.utils.json_to_sheet(companySheetData);
    XLSX.utils.book_append_sheet(workbook, companyWorksheet, 'BH_Doanh_Nghiep');
    
    // Sheet 3: Chi tiết nhân viên
    const detailsSheetData = employeeDetails.map((item, index) => ({
      'STT': index + 1,
      'Nhân viên': item.employeeName,
      'BHXH DN': item.totalBHXH_DN,
      'BHYT DN': item.totalBHYT_DN,
      'BHTN DN': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
    }));
    
    const detailsWorksheet = XLSX.utils.json_to_sheet(detailsSheetData);
    XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Chi_Tiet_NV');
    
    // Xuất file
    const fileName = `Bao_Cao_Thue_Bao_Hiem_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file tổng hợp:', error);
    throw error;
  }
};