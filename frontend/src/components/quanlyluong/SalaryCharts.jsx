// components/SalaryCharts.jsx
import React, { useMemo } from 'react';
import { Row, Col, Card, Alert } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line
} from 'recharts';
import { FaChartBar, FaLock } from 'react-icons/fa';

const SalaryCharts = ({ 
  luongList, 
  nhanVienList, 
  phongBanList, 
  selectedYear, 
  selectedMonthNumber, 
  isHR, 
  currentUser,
  formatCurrency 
}) => {
  // 1. Biểu đồ tổng quỹ lương theo năm - CHỈ HR ĐƯỢC XEM
  const yearlySalaryData = useMemo(() => {
    if (!isHR || !selectedYear) return [];
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: `Tháng ${i + 1}`,
      totalSalary: 0
    }));

    luongList.forEach(luong => {
      if (luong.nam === parseInt(selectedYear)) {
        const monthIndex = luong.thang - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].totalSalary += luong.thuc_nhan || 0;
        }
      }
    });

    return monthlyData;
  }, [luongList, selectedYear, isHR]);

  // 2. Biểu đồ top 5 lương cao nhất và thấp nhất - CHỈ HR ĐƯỢC XEM
  const salaryComparisonData = useMemo(() => {
    if (!isHR) return { top5Highest: [], top5Lowest: [] };
    
    let filteredLuong = luongList;
    
    // Lọc theo tháng/năm nếu có
    if (selectedMonthNumber && selectedYear) {
      filteredLuong = luongList.filter(
        luong => 
          luong.thang === parseInt(selectedMonthNumber) && 
          luong.nam === parseInt(selectedYear)
      );
    }

    // Ghép thông tin nhân viên
    const dataWithNames = filteredLuong.map(luong => {
      const nhanVien = nhanVienList.find(nv => nv.id === luong.nhan_vien_id);
      return {
        ...luong,
        employeeName: nhanVien?.ho_ten || 'Không rõ',
        thucNhan: luong.thuc_nhan || 0
      };
    });

    // Sắp xếp và lấy top 5
    const sortedBySalary = [...dataWithNames].sort((a, b) => b.thucNhan - a.thucNhan);
    const top5Highest = sortedBySalary.slice(0, 5);
    const top5Lowest = sortedBySalary.slice(-5).reverse();

    return { top5Highest, top5Lowest };
  }, [luongList, nhanVienList, selectedMonthNumber, selectedYear, isHR]);

  // 3. Biểu đồ tổng lương theo phòng ban - CHỈ HR ĐƯỢC XEM
  const departmentSalaryData = useMemo(() => {
    if (!isHR) return [];
    
    let filteredLuong = luongList;
    
    // Lọc theo tháng/năm nếu có
    if (selectedMonthNumber && selectedYear) {
      filteredLuong = luongList.filter(
        luong => 
          luong.thang === parseInt(selectedMonthNumber) && 
          luong.nam === parseInt(selectedYear)
      );
    }

    const departmentMap = {};
    
    filteredLuong.forEach(luong => {
      const nhanVien = nhanVienList.find(nv => nv.id === luong.nhan_vien_id);
      if (nhanVien) {
        const phongBanId = nhanVien.phong_ban_id;
        if (!departmentMap[phongBanId]) {
          const phongBan = phongBanList.find(pb => pb.id === phongBanId);
          departmentMap[phongBanId] = {
            name: phongBan?.ten_phong_ban || 'Không xác định',
            totalSalary: 0,
            count: 0
          };
        }
        departmentMap[phongBanId].totalSalary += luong.thuc_nhan || 0;
        departmentMap[phongBanId].count += 1;
      }
    });

    return Object.values(departmentMap).map(dept => ({
      ...dept,
      averageSalary: dept.count > 0 ? dept.totalSalary / dept.count : 0
    }));
  }, [luongList, nhanVienList, phongBanList, selectedMonthNumber, selectedYear, isHR]);

  // 4. Biểu đồ phân bổ các khoản cấu thành lương - TẤT CẢ ĐƯỢC XEM
  const salaryBreakdownData = useMemo(() => {
    // Nếu không phải HR, chỉ hiển thị cho current user
    let employeeIds = isHR ? nhanVienList.map(nv => nv.id) : [currentUser?.id];
    
    let filteredLuong = luongList.filter(luong => 
      employeeIds.includes(luong.nhan_vien_id)
    );
    
    // Lọc theo tháng/năm nếu có
    if (selectedMonthNumber && selectedYear) {
      filteredLuong = filteredLuong.filter(
        luong => 
          luong.thang === parseInt(selectedMonthNumber) && 
          luong.nam === parseInt(selectedYear)
      );
    }

    // Ghép thông tin nhân viên và tính toán breakdown
    return filteredLuong.map(luong => {
      const nhanVien = nhanVienList.find(nv => nv.id === luong.nhan_vien_id);
      const chiTiet = luong.chi_tiet_luong || [];
      
      // Tính các khoản phụ cấp
      const totalPhuCap = luong.tong_phu_cap || 0;
      const totalThuong = luong.tong_thuong || 0;
      const totalKhauTru = luong.tong_khau_tru || 0;
      const bhxh = luong.bhxh || 0;
      const bhyt = luong.bhyt || 0;
      const bhtn = luong.bhtn || 0;
      const thueTNCN = luong.thue_tncn || 0;
      const thucNhan = luong.thuc_nhan || 0;
      
      // Tính lương cơ bản (tổng lương - phụ cấp - thưởng + khấu trừ + bảo hiểm + thuế)
      const baseSalary = thucNhan + totalKhauTru + bhxh + bhyt + bhtn + thueTNCN - totalPhuCap - totalThuong;

      // Tạo displayName duy nhất bằng cách thêm tháng/năm
      const displayName = isHR 
        ? `${nhanVien?.ho_ten || 'Không rõ'} (${luong.thang}/${luong.nam})`
        : `Tháng ${luong.thang}/${luong.nam}`;

      return {
        id: luong.id, // Thêm ID để đảm bảo tính duy nhất
        employeeName: nhanVien?.ho_ten || 'Không rõ',
        displayName: displayName, // Tên hiển thị duy nhất
        baseSalary: Math.max(0, baseSalary),
        totalPhuCap,
        totalThuong,
        totalKhauTru,
        bhxh,
        bhyt,
        bhtn,
        thueTNCN,
        thucNhan,
        month: luong.thang,
        year: luong.nam
      };
    });
  }, [luongList, nhanVienList, selectedMonthNumber, selectedYear, isHR, currentUser]);

  // Custom Tooltip cho biểu đồ phân bổ với stacked bars
  const StackedBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Tìm data gốc từ payload
      const data = payload[0]?.payload;
      
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minWidth: '250px'
        }}>
          <p className="label fw-bold mb-2" style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            {data?.displayName || label}
          </p>
          
          <div className="breakdown-details">
            {/* Hiển thị tất cả các khoản từ payload */}
            {payload.map((entry, index) => (
              <div key={index} className="d-flex justify-content-between mb-1">
                <span style={{ color: entry.color, fontSize: '12px' }}>
                  {entry.name}:
                </span>
                <span className="fw-bold" style={{ fontSize: '12px' }}>
                  {formatCurrency(entry.value || 0)}
                </span>
              </div>
            ))}
            
            {/* Thêm tổng thực nhận */}
            <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: '2px solid #007bff' }}>
              <span className="fw-bold text-primary" style={{ fontSize: '13px' }}>Thực nhận:</span>
              <span className="fw-bold text-primary" style={{ fontSize: '13px' }}>
                {formatCurrency(data?.thucNhan || 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Component hiển thị khi không có quyền
  const RestrictedChart = ({ title }) => (
    <Card className="shadow-sm border-0 rounded-card h-100">
      <Card.Header className="bg-secondary text-white">
        <h6 className="mb-0">{title}</h6>
      </Card.Header>
      <Card.Body className="d-flex flex-column align-items-center justify-content-center text-muted">
        <FaLock size={48} className="mb-3 opacity-50" />
        <h6>Chức năng bị hạn chế</h6>
        <p className="text-center mb-0" style={{ fontSize: '0.9rem' }}>
          Chỉ nhân viên phòng nhân sự mới có quyền xem biểu đồ này
        </p>
      </Card.Body>
    </Card>
  );

  if (luongList.length === 0) {
    return (
      <Alert variant="info" className="text-center">
        <FaChartBar size={24} className="mb-2" />
        <br />
        Không có dữ liệu để hiển thị biểu đồ
      </Alert>
    );
  }

  return (
    <div className="salary-charts-container">
      <Row className="g-4">
        {/* Biểu đồ 1: Tổng quỹ lương theo năm - CHỈ HR */}
        {selectedYear && (
          <Col xl={6} lg={12}>
            {isHR ? (
              <Card className="shadow-sm border-0 rounded-card h-100">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">📊 Tổng Quỹ Lương Theo Năm {selectedYear}</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={yearlySalaryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar 
                        dataKey="totalSalary" 
                        name="Tổng lương" 
                        fill="#8884d8" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            ) : (
              <RestrictedChart title="📊 Tổng Quỹ Lương Theo Năm" />
            )}
          </Col>
        )}

        {/* Biểu đồ 2: So sánh lương nhân viên - CHỈ HR */}
        <Col xl={6} lg={12}>
          {isHR ? (
            <Card className="shadow-sm border-0 rounded-card h-100">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">🏆 Top 5 Lương Cao Nhất & Thấp Nhất</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={[...salaryComparisonData.top5Highest, ...salaryComparisonData.top5Lowest]}
                    margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <YAxis 
                      type="category" 
                      dataKey="employeeName" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    
                        <Bar 
                        dataKey="thucNhan" 
                        name="Lương thực nhận" 
                        fill="#82ca9d" 
                            />
                   
                    
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          ) : (
            <RestrictedChart title="🏆 So Sánh Lương Nhân Viên" />
          )}
        </Col>

        {/* Biểu đồ 3: Tổng lương theo phòng ban - CHỈ HR */}
        <Col xl={6} lg={12}>
          {isHR ? (
            <Card className="shadow-sm border-0 rounded-card h-100">
              <Card.Header className="bg-warning text-dark">
                <h6 className="mb-0">🏢 Tổng Lương Theo Phòng Ban</h6>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={departmentSalaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalSalary" name="Tổng lương" fill="#ffc658" />
                    <Bar dataKey="averageSalary" name="Lương trung bình" fill="#ff8042" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          ) : (
            <RestrictedChart title="🏢 Tổng Lương Theo Phòng Ban" />
          )}
        </Col>

        {/* Biểu đồ 4: Phân bổ các khoản cấu thành lương - TẤT CẢ ĐƯỢC XEM */}
        <Col xl={6} lg={12}>
          <Card className="shadow-sm border-0 rounded-card h-100">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">
                🧮 Phân Bổ Các Khoản Lương 
                {!isHR && " - Cá Nhân"}
              </h6>
            </Card.Header>
            <Card.Body>
              {salaryBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart
                    data={salaryBreakdownData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayName" // Sử dụng displayName thay vì employeeName
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    //   interval={0}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip content={<StackedBarTooltip />} />
                    <Legend 
                      wrapperStyle={{ 
                        paddingTop: '10px',
                        paddingBottom: '10px'
                      }}
                    />
                    {/* Stacked Bars như cũ */}
                    <Bar dataKey="baseSalary" name="Lương cơ bản" stackId="a" fill="#8884d8" />
                    <Bar dataKey="totalPhuCap" name="Phụ cấp" stackId="a" fill="#1aacacff" />
                    <Bar dataKey="totalThuong" name="Thưởng" stackId="a" fill="#ffc658" />
                    <Bar dataKey="totalKhauTru" name="Khấu trừ" stackId="a" fill="#ff8042" />
                    <Bar dataKey="bhxh" name="BHXH" stackId="a" fill="#1906c9ff" />
                    <Bar dataKey="bhyt" name="BHYT" stackId="a" fill="#2192eeff" />
                    <Bar dataKey="bhtn" name="BHTN" stackId="a" fill="#68dd8fff" />
                    <Bar dataKey="thueTNCN" name="Thuế TNCN" stackId="a" fill="#e42ed5ff" />
                    <Line 
                      type="monotone" 
                      dataKey="thucNhan" 
                      name="Thực nhận" 
                      stroke="#ff0000" 
                      strokeWidth={2}
                      dot={{ fill: '#ff0000', strokeWidth: 2, r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">
                  Không có dữ liệu phân bổ lương
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Thông báo cho nhân viên không phải HR */}
      {!isHR && (
        <Alert variant="warning" className="mt-3">
          <strong>Lưu ý:</strong> Bạn chỉ có thể xem thông tin lương cá nhân. 
          Để xem các thống kê tổng quan, vui lòng liên hệ phòng nhân sự.
        </Alert>
      )}
    </div>
  );
};

export default SalaryCharts;