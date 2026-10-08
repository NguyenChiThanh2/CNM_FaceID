// utils/exportThueBaoHiem.js
import { exportJsonToExcel, exportMultiSheetToExcel } from './excelExport';

export const exportEmployeeTaxExcel = async (employeeData, year, currentUser) => {
  try {
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

    const colWidths = [8, 25, 15, 15, 15, 15, 15, 15, 10, 15];
    const fileName = `Thue_Bao_Hiem_Nhan_Vien_${currentUser?.ma_nhan_vien || 'NV'}_${year}.xlsx`;
    await exportJsonToExcel(worksheetData, `Thuế_BH_NV_${year}`, fileName, colWidths);

    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel nhân viên:', error);
    throw error;
  }
};

export const exportCompanyInsuranceExcel = async (companyData, year) => {
  try {
    const worksheetData = companyData.map(item => ({
      'Năm': item.year,
      'BHXH Doanh nghiệp': item.totalBHXH_DN,
      'BHYT Doanh nghiệp': item.totalBHYT_DN,
      'BHTN Doanh nghiệp': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
      'Trung bình/tháng': item.trungBinhThang || (item.totalAll / item.monthCount)
    }));

    const colWidths = [8, 20, 20, 20, 20, 10, 20];
    const fileName = `Bao_Hiem_Doanh_Nghiep_${year}.xlsx`;
    await exportJsonToExcel(worksheetData, `BH_DN_${year}`, fileName, colWidths);

    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel doanh nghiệp:', error);
    throw error;
  }
};

export const exportCompanyEmployeeDetailsExcel = async (employeeDetails, year) => {
  try {
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

    const colWidths = [5, 25, 20, 20, 20, 20, 10, 20];
    const fileName = `Chi_Tiet_Bao_Hiem_Nhan_Vien_${year}.xlsx`;
    await exportJsonToExcel(worksheetData, `Chi_Tiet_NV_${year}`, fileName, colWidths);

    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file Excel chi tiết nhân viên:', error);
    throw error;
  }
};

// Hàm xuất tất cả
export const exportAllTaxInsuranceData = async (employeeData, companyData, employeeDetails, year, currentUser) => {
  try {
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

    const companySheetData = companyData.map(item => ({
      'Năm': item.year,
      'BHXH DN': item.totalBHXH_DN,
      'BHYT DN': item.totalBHYT_DN,
      'BHTN DN': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
    }));

    const detailsSheetData = employeeDetails.map((item, index) => ({
      'STT': index + 1,
      'Nhân viên': item.employeeName,
      'BHXH DN': item.totalBHXH_DN,
      'BHYT DN': item.totalBHYT_DN,
      'BHTN DN': item.totalBHTN_DN,
      'Tổng cộng': item.totalAll,
      'Số tháng': item.monthCount,
    }));

    const fileName = `Bao_Cao_Thue_Bao_Hiem_${year}.xlsx`;
    await exportMultiSheetToExcel([
      { name: 'Thuế_BH_NV', data: employeeSheetData },
      { name: 'BH_Doanh_Nghiep', data: companySheetData },
      { name: 'Chi_Tiet_NV', data: detailsSheetData },
    ], fileName);

    return true;
  } catch (error) {
    console.error('Lỗi khi xuất file tổng hợp:', error);
    throw error;
  }
};
