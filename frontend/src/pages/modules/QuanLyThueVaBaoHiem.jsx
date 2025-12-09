// pages/QuanLyThueVaBaoHiem.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Form,
  Table,
  Button,
  Breadcrumb,
  Alert,
  Tabs,
  Tab,
  Badge,
  Dropdown,
  ButtonGroup
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import {
  FaHome,
  FaChartPie,
  FaFileInvoiceDollar,
  FaBuilding,
  FaUser,
  FaDownload,
  FaFilter,
  FaCalculator,
  FaShieldAlt,
  FaMoneyBillWave,
  FaFileExcel,
  FaFileCsv
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import Loading from '../../components/Loading';
import { getNhanVienInfo } from '../../utils/auth';
import { exportEmployeeTaxExcel, exportCompanyInsuranceExcel } from "../../utils/exportThueBaoHiem";
import '../../css/QuanLyThueVaBaoHiem.css';

const API_URL = "http://127.0.0.1:5000/api";
const HR_DEPARTMENT_ID = 2;

const QuanLyThueVaBaoHiem = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' hoặc 'company'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [luongList, setLuongList] = useState([]);
  const [baoHiemDoanhNghiepList, setBaoHiemDoanhNghiepList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  
  const currentUser = getNhanVienInfo();
  const isHR = currentUser?.phong_ban_id === HR_DEPARTMENT_ID;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy danh sách lương
      const luongResponse = await axios.get(`${API_URL}/get-all-bang-luong`);
      setLuongList(luongResponse.data || []);

      // Lấy danh sách nhân viên
      const nhanVienResponse = await axios.get(`${API_URL}/get-all-nhan-vien`);
      setNhanVienList(nhanVienResponse.data || []);

      // Nếu là HR, lấy thông tin bảo hiểm doanh nghiệp
      if (isHR) {
        try {
          const baoHiemResponse = await axios.get(`${API_URL}/get-bao-hiem-doanh-nghiep`);
          setBaoHiemDoanhNghiepList(baoHiemResponse.data || []);
          console.log(baoHiemResponse);
        } catch (error) {
          console.warn('Không thể lấy thông tin bảo hiểm doanh nghiệp:', error);
          toast.warning('Không thể tải dữ liệu bảo hiểm doanh nghiệp');
        }
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu!');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format tiền tệ
  const formatCurrency = (amount) =>
    amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  // Tính tổng các khoản cho nhân viên
  const employeeTaxInsuranceData = useMemo(() => {
    const currentUserId = currentUser?.id;
    if (!currentUserId) return [];

    // Lọc lương của nhân viên hiện tại
    const userLuongList = luongList.filter(luong => luong.nhan_vien_id === currentUserId);
    
    // Nhóm theo năm
    const yearlyData = {};
    
    userLuongList.forEach(luong => {
      const year = luong.nam;
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          totalThueTNCN: 0,
          totalBHXH: 0,
          totalBHYT: 0,
          totalBHTN: 0,
          totalAll: 0,
          monthCount: 0,
          // Thêm thông tin nhân viên
          employeeName: currentUser?.ho_ten || 'Không rõ',
          maNhanVien: currentUser?.ma_nhan_vien || 'N/A'
        };
      }
      
      yearlyData[year].totalThueTNCN += luong.thue_tncn || 0;
      yearlyData[year].totalBHXH += luong.bhxh || 0;
      yearlyData[year].totalBHYT += luong.bhyt || 0;
      yearlyData[year].totalBHTN += luong.bhtn || 0;
      yearlyData[year].totalAll += (luong.thue_tncn || 0) + (luong.bhxh || 0) + (luong.bhyt || 0) + (luong.bhtn || 0);
      yearlyData[year].monthCount += 1;
    });

    return Object.values(yearlyData).sort((a, b) => b.year - a.year);
  }, [luongList, currentUser]);

  // Dữ liệu cho biểu đồ nhân viên
  const employeeChartData = useMemo(() => {
    const yearData = employeeTaxInsuranceData.find(item => item.year === parseInt(selectedYear));
    if (!yearData) return [];

    return [
      { name: 'Thuế TNCN', value: yearData.totalThueTNCN, color: '#8884d8' },
      { name: 'BHXH', value: yearData.totalBHXH, color: '#82ca9d' },
      { name: 'BHYT', value: yearData.totalBHYT, color: '#ffc658' },
      { name: 'BHTN', value: yearData.totalBHTN, color: '#ff8042' }
    ];
  }, [employeeTaxInsuranceData, selectedYear]);

  // Dữ liệu cho biểu đồ doanh nghiệp (HR only)
  const companyInsuranceData = useMemo(() => {
    if (!isHR) return { yearlyData: [], chartData: [], totalByEmployee: [] };

    // Nhóm theo năm
    const yearlyData = {};
    
    baoHiemDoanhNghiepList.forEach(item => {
      const year = item.nam;
      const month = item.thang; // giả sử item có trường `thang`
      if (!yearlyData[year]) {
        yearlyData[year] = {
          year,
          totalBHXH_DN: 0,
          totalBHYT_DN: 0,
          totalBHTN_DN: 0,
          totalAll: 0,
          monthSet: new Set()
        };
      }

      yearlyData[year].totalBHXH_DN += item.bhxh_dn || 0;
      yearlyData[year].totalBHYT_DN += item.bhyt_dn || 0;
      yearlyData[year].totalBHTN_DN += item.bhtn_dn || 0;
      yearlyData[year].totalAll += (item.bhxh_dn || 0) + (item.bhyt_dn || 0) + (item.bhtn_dn || 0);

      if (month !== undefined && month !== null) {
        yearlyData[year].monthSet.add(month);
      }
    });

    // Chuyển monthSet -> monthCount và tạo mảng sorted
    const yearlyArray = Object.values(yearlyData).map(y => ({
      year: y.year,
      totalBHXH_DN: y.totalBHXH_DN,
      totalBHYT_DN: y.totalBHYT_DN,
      totalBHTN_DN: y.totalBHTN_DN,
      totalAll: y.totalAll,
      monthCount: y.monthSet.size
    })).sort((a, b) => b.year - a.year);

    // Dữ liệu cho biểu đồ năm được chọn
    const selectedYearData = yearlyArray.find(item => item.year === parseInt(selectedYear));
    const chartData = selectedYearData ? [
      { name: 'BHXH DN', value: selectedYearData.totalBHXH_DN, color: '#8884d8' },
      { name: 'BHYT DN', value: selectedYearData.totalBHYT_DN, color: '#82ca9d' },
      { name: 'BHTN DN', value: selectedYearData.totalBHTN_DN, color: '#ffc658' }
    ] : [];

    // Tính tổng theo nhân viên cho năm được chọn
    const employeeMap = {};
    baoHiemDoanhNghiepList
      .filter(item => item.nam === parseInt(selectedYear))
      .forEach(item => {
        const nhanVienId = item.nhan_vien_id;
        if (!employeeMap[nhanVienId]) {
          const nhanVien = nhanVienList.find(nv => nv.id === nhanVienId);
          employeeMap[nhanVienId] = {
            nhanVienId,
            employeeName: nhanVien?.ho_ten || 'Không rõ',
            totalBHXH_DN: 0,
            totalBHYT_DN: 0,
            totalBHTN_DN: 0,
            totalAll: 0,
            monthCount: 0
          };
        }
        
        employeeMap[nhanVienId].totalBHXH_DN += item.bhxh_dn || 0;
        employeeMap[nhanVienId].totalBHYT_DN += item.bhyt_dn || 0;
        employeeMap[nhanVienId].totalBHTN_DN += item.bhtn_dn || 0;
        employeeMap[nhanVienId].totalAll += (item.bhxh_dn || 0) + (item.bhyt_dn || 0) + (item.bhtn_dn || 0);
        employeeMap[nhanVienId].monthCount += 1;
      });

    const totalByEmployee = Object.values(employeeMap).sort((a, b) => b.totalAll - a.totalAll);

    return { yearlyData: yearlyArray, chartData, totalByEmployee };
  }, [baoHiemDoanhNghiepList, nhanVienList, selectedYear, isHR]);

  // Tổng hợp thống kê
  const summaryStats = useMemo(() => {
    if (!isHR) return null;

    const currentYearData = companyInsuranceData.yearlyData.find(item => item.year === parseInt(selectedYear));
    
    return {
      totalCompanyInsurance: currentYearData?.totalAll || 0,
      totalEmployeeTax: employeeTaxInsuranceData
        .filter(item => item.year === parseInt(selectedYear))
        .reduce((sum, item) => sum + item.totalAll, 0),
      employeeCount: new Set(
        baoHiemDoanhNghiepList
          .filter(item => item.nam === parseInt(selectedYear))
          .map(item => item.nhan_vien_id)
      ).size
    };
  }, [companyInsuranceData, employeeTaxInsuranceData, selectedYear, baoHiemDoanhNghiepList, isHR]);

  // Hàm xuất file Excel cho nhân viên
  const handleExportEmployeeExcel = () => {
    try {
      if (employeeTaxInsuranceData.length === 0) {
        toast.warning('Không có dữ liệu để xuất file!');
        return;
      }
      
      // Chuẩn bị dữ liệu cho export
      const exportData = employeeTaxInsuranceData.map(item => ({
        ...item,
        trungBinhThang: item.totalAll / item.monthCount
      }));
      
      exportEmployeeTaxExcel(exportData, selectedYear, currentUser);
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất file:', error);
      toast.error('Có lỗi khi xuất file!');
    }
  };

  // Hàm xuất file Excel cho doanh nghiệp
  const handleExportCompanyExcel = () => {
    try {
      if (companyInsuranceData.yearlyData.length === 0) {
        toast.warning('Không có dữ liệu bảo hiểm doanh nghiệp để xuất!');
        return;
      }
      
      // Chuẩn bị dữ liệu cho export
      const exportData = companyInsuranceData.yearlyData.map(item => ({
        ...item,
        trungBinhThang: item.totalAll / item.monthCount
      }));
      
      exportCompanyInsuranceExcel(exportData, selectedYear);
      toast.success('Xuất file Excel bảo hiểm doanh nghiệp thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất file:', error);
      toast.error('Có lỗi khi xuất file bảo hiểm doanh nghiệp!');
    }
  };

  // Hàm xuất chi tiết theo nhân viên
  const handleExportEmployeeDetailsExcel = () => {
    try {
      if (companyInsuranceData.totalByEmployee.length === 0) {
        toast.warning('Không có dữ liệu chi tiết nhân viên để xuất!');
        return;
      }
      
      // Tạo workbook cho chi tiết nhân viên
      exportCompanyEmployeeDetailsExcel(companyInsuranceData.totalByEmployee, selectedYear);
      toast.success('Xuất file Excel chi tiết nhân viên thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất file chi tiết:', error);
      toast.error('Có lỗi khi xuất file chi tiết nhân viên!');
    }
  };

  if (loading) {
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-4 ps-5 tax-insurance-container">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <div className="tax-insurance-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <Breadcrumb className="mb-3">
              <Breadcrumb.Item active>
                <FaHome className="me-2" />
                Trang chủ
              </Breadcrumb.Item>
              <Breadcrumb.Item active>Quản lý thuế và bảo hiểm</Breadcrumb.Item>
            </Breadcrumb>
            <h1 className="fw-bold mb-2">
              <FaShieldAlt className="me-3" />
              Quản Lý Thuế & Bảo Hiểm
            </h1>
            <p className="mb-0 opacity-90">
              Theo dõi và thống kê các khoản thuế, bảo hiểm bắt buộc
            </p>
          </div>
          <Button
            variant="outline-light"
            onClick={() => navigate("/")}
            className="glass-button border-0"
          >
            <FaHome className="me-2" />
            Trang chủ
          </Button>
        </div>
      </div>

      {/* Year Selector */}
      <Card className="shadow-sm border-0 rounded-card mb-4">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col md={3}>
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Chọn năm thống kê
              </h6>
            </Col>
            <Col md={3}>
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {[...Array(5).keys()].map((i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      Năm {year}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={6} className="text-end">
              <Badge bg="info" className="me-2 p-2">
                <FaCalculator className="me-1" />
                Đang xem: Năm {selectedYear}
              </Badge>
              {isHR && summaryStats && (
                <Badge bg="success" className="p-2">
                  <FaBuilding className="me-1" />
                  Tổng bảo hiểm DN: {formatCurrency(summaryStats.totalCompanyInsurance)}
                </Badge>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Export Buttons */}
      <Card className="shadow-sm border-0 rounded-card mb-4">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-0">
                <FaFileExcel className="me-2 text-success" />
                Xuất dữ liệu ra file
              </h6>
            </Col>
            <Col md={6} className="text-end">
              <Dropdown as={ButtonGroup}>
                <Button 
                  variant="outline-success" 
                  onClick={handleExportEmployeeExcel}
                  disabled={employeeTaxInsuranceData.length === 0}
                >
                  <FaDownload className="me-2" />
                  Xuất Excel cá nhân
                </Button>
                
                {isHR && (
                  <>
                    <Dropdown.Toggle split variant="outline-success" />
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={handleExportCompanyExcel}>
                        <FaFileExcel className="me-2 text-success" />
                        Xuất Excel BH doanh nghiệp
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleExportEmployeeDetailsExcel}>
                        <FaFileCsv className="me-2 text-primary" />
                        Xuất Excel chi tiết nhân viên
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item disabled>
                        <small className="text-muted">Tổng số bản ghi: {employeeTaxInsuranceData.length}</small>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </>
                )}
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tab Navigation */}
      <Card className="shadow-sm border-0 rounded-card mb-4">
        <Card.Body className="p-3">
          <Tabs
            activeKey={activeTab}
            onSelect={(tab) => setActiveTab(tab)}
            className="custom-tabs"
          >
            {/* Tab cá nhân - Luôn hiển thị */}
            <Tab
              eventKey="employee"
              title={
                <span>
                  <FaUser className="me-2" />
                  Thông Tin Cá Nhân
                  {employeeTaxInsuranceData.length > 0 && (
                    <Badge bg="info" className="ms-2">
                      {employeeTaxInsuranceData.length} năm
                    </Badge>
                  )}
                </span>
              }
            >
              <EmployeeTaxInsuranceSection
                data={employeeTaxInsuranceData}
                chartData={employeeChartData}
                selectedYear={selectedYear}
                formatCurrency={formatCurrency}
                currentUser={currentUser}
              />
            </Tab>

            {/* Tab doanh nghiệp - Chỉ hiển thị cho HR */}
            {isHR && (
              <Tab
                eventKey="company"
                title={
                  <span>
                    <FaBuilding className="me-2" />
                    Bảo Hiểm Doanh Nghiệp
                    {companyInsuranceData.yearlyData.length > 0 && (
                      <Badge bg="success" className="ms-2">
                        {companyInsuranceData.yearlyData.length} năm
                      </Badge>
                    )}
                  </span>
                }
              >
                <CompanyInsuranceSection
                  yearlyData={companyInsuranceData.yearlyData}
                  chartData={companyInsuranceData.chartData}
                  totalByEmployee={companyInsuranceData.totalByEmployee}
                  selectedYear={selectedYear}
                  formatCurrency={formatCurrency}
                  summaryStats={summaryStats}
                />
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>

      {/* Summary Stats for HR */}
      {isHR && summaryStats && (
        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-card h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">
                  <FaMoneyBillWave className="me-2" />
                  Tổng bảo hiểm DN
                </h6>
                <h3 className="text-primary fw-bold">
                  {formatCurrency(summaryStats.totalCompanyInsurance)}
                </h3>
                <small className="text-muted">Năm {selectedYear}</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-card h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">
                  <FaFileInvoiceDollar className="me-2" />
                  Tổng thuế nhân viên
                </h6>
                <h3 className="text-warning fw-bold">
                  {formatCurrency(summaryStats.totalEmployeeTax)}
                </h3>
                <small className="text-muted">Năm {selectedYear}</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 rounded-card h-100">
              <Card.Body className="text-center">
                <h6 className="text-muted mb-2">
                  <FaUser className="me-2" />
                  Số nhân viên đóng BH
                </h6>
                <h3 className="text-success fw-bold">
                  {summaryStats.employeeCount}
                </h3>
                <small className="text-muted">Năm {selectedYear}</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

// Component cho phần thông tin cá nhân
const EmployeeTaxInsuranceSection = ({ data, chartData, selectedYear, formatCurrency, currentUser }) => {
  const selectedYearData = data.find(item => item.year === parseInt(selectedYear));

  return (
    <div>
      {/* Thông tin nhân viên */}
      <Card className="shadow-sm border-0 rounded-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="text-primary mb-2">
                <FaUser className="me-2" />
                {currentUser?.ho_ten || 'Nhân viên'}
              </h5>
              <div className="d-flex flex-wrap gap-3">
                <span>
                  <strong>Mã NV:</strong> {currentUser?.id || 'N/A'}
                </span>
                <span>
                  <strong>Phòng ban:</strong> {currentUser?.ten_phong_ban || 'N/A'}
                </span>
                <span>
                  <strong>Chức vụ:</strong> {currentUser?.ten_chuc_vu || 'N/A'}
                </span>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Badge bg="primary" className="p-2 fs-6">
                Tổng đã đóng: {formatCurrency(data.reduce((sum, item) => sum + item.totalAll, 0))}
              </Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Biểu đồ tròn */}
        <Col xl={5} lg={12}>
          <Card className="shadow-sm border-0 rounded-card h-100">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <FaChartPie className="me-2" />
                Phân Bổ Các Khoản Đóng {selectedYear}
              </h6>
            </Card.Header>
            <Card.Body>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">
                  Không có dữ liệu đóng góp năm {selectedYear}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Bảng thống kê theo năm */}
        <Col xl={7} lg={12}>
          <Card className="shadow-sm border-0 rounded-card h-100">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">
                <FaFileInvoiceDollar className="me-2" />
                Tổng Hợp Theo Năm
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Năm</th>
                      <th>Thuế TNCN</th>
                      <th>BHXH</th>
                      <th>BHYT</th>
                      <th>BHTN</th>
                      <th>Tổng cộng</th>
                      <th>Số tháng</th>
                      <th>TB/tháng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.year} className={item.year === parseInt(selectedYear) ? 'table-active' : ''}>
                          <td className="fw-bold">{item.year}</td>
                          <td className="text-danger">{formatCurrency(item.totalThueTNCN)}</td>
                          <td className="text-primary">{formatCurrency(item.totalBHXH)}</td>
                          <td className="text-success">{formatCurrency(item.totalBHYT)}</td>
                          <td className="text-warning">{formatCurrency(item.totalBHTN)}</td>
                          <td className="fw-bold text-dark">{formatCurrency(item.totalAll)}</td>
                          <td className="text-center">
                            <Badge bg="secondary">{item.monthCount}</Badge>
                          </td>
                          <td className="text-info">{formatCurrency(item.totalAll / item.monthCount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">
                          Không có dữ liệu đóng góp
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {data.length > 0 && (
                    <tfoot className="table-light">
                      <tr>
                        <th className="text-end">Tổng:</th>
                        <th className="text-danger">{formatCurrency(data.reduce((sum, item) => sum + item.totalThueTNCN, 0))}</th>
                        <th className="text-primary">{formatCurrency(data.reduce((sum, item) => sum + item.totalBHXH, 0))}</th>
                        <th className="text-success">{formatCurrency(data.reduce((sum, item) => sum + item.totalBHYT, 0))}</th>
                        <th className="text-warning">{formatCurrency(data.reduce((sum, item) => sum + item.totalBHTN, 0))}</th>
                        <th className="fw-bold text-dark">{formatCurrency(data.reduce((sum, item) => sum + item.totalAll, 0))}</th>
                        <th className="text-center">
                          <Badge bg="info">{data.reduce((sum, item) => sum + item.monthCount, 0)}</Badge>
                        </th>
                        <th className="text-info">
                          {formatCurrency(data.reduce((sum, item) => sum + item.totalAll, 0) / data.reduce((sum, item) => sum + item.monthCount, 0))}
                        </th>
                      </tr>
                    </tfoot>
                  )}
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Chi tiết năm được chọn */}
      {selectedYearData && (
        <Card className="shadow-sm border-0 rounded-card mt-4">
          <Card.Header className="bg-success text-white">
            <h6 className="mb-0">
              <FaCalculator className="me-2" />
              Chi Tiết Năm {selectedYear}
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3} className="text-center">
                <div className="p-3 bg-light rounded">
                  <h6 className="text-muted">Thuế TNCN</h6>
                  <h4 className="text-danger fw-bold">
                    {formatCurrency(selectedYearData.totalThueTNCN)}
                  </h4>
                  <small>Trung bình: {formatCurrency(selectedYearData.totalThueTNCN / selectedYearData.monthCount)}/tháng</small>
                </div>
              </Col>
              <Col md={3} className="text-center">
                <div className="p-3 bg-light rounded">
                  <h6 className="text-muted">BHXH</h6>
                  <h4 className="text-primary fw-bold">
                    {formatCurrency(selectedYearData.totalBHXH)}
                  </h4>
                  <small>Trung bình: {formatCurrency(selectedYearData.totalBHXH / selectedYearData.monthCount)}/tháng</small>
                </div>
              </Col>
              <Col md={3} className="text-center">
                <div className="p-3 bg-light rounded">
                  <h6 className="text-muted">BHYT</h6>
                  <h4 className="text-success fw-bold">
                    {formatCurrency(selectedYearData.totalBHYT)}
                  </h4>
                  <small>Trung bình: {formatCurrency(selectedYearData.totalBHYT / selectedYearData.monthCount)}/tháng</small>
                </div>
              </Col>
              <Col md={3} className="text-center">
                <div className="p-3 bg-light rounded">
                  <h6 className="text-muted">BHTN</h6>
                  <h4 className="text-warning fw-bold">
                    {formatCurrency(selectedYearData.totalBHTN)}
                  </h4>
                  <small>Trung bình: {formatCurrency(selectedYearData.totalBHTN / selectedYearData.monthCount)}/tháng</small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

// Component cho phần bảo hiểm doanh nghiệp (HR only)
const CompanyInsuranceSection = ({ yearlyData, chartData, totalByEmployee, selectedYear, formatCurrency, summaryStats }) => {
  const selectedYearData = yearlyData.find(item => item.year === parseInt(selectedYear));

  return (
    <div>
      <Row className="g-4">
        {/* Biểu đồ cột */}
        <Col xl={6} lg={12}>
          <Card className="shadow-sm border-0 rounded-card h-100">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0">
                <FaChartPie className="me-2" />
                Bảo Hiểm Doanh Nghiệp Năm {selectedYear}
              </h6>
            </Card.Header>
            <Card.Body>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="value" name="Số tiền" fill={(entry) => entry.color} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">
                  Không có dữ liệu bảo hiểm doanh nghiệp năm {selectedYear}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Biểu đồ đường theo năm */}
        <Col xl={6} lg={12}>
          <Card className="shadow-sm border-0 rounded-card h-100">
            <Card.Header className="bg-secondary text-white">
              <h6 className="mb-0">
                <FaChartPie className="me-2" />
                Xu Hướng Theo Năm
              </h6>
            </Card.Header>
            <Card.Body>
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="totalAll" name="Tổng bảo hiểm DN" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalBHXH_DN" name="BHXH DN" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalBHYT_DN" name="BHYT DN" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-4">
                  Không có dữ liệu xu hướng
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Bảng thống kê theo năm */}
      <Card className="shadow-sm border-0 rounded-card mt-4">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <FaBuilding className="me-2" />
            Tổng Hợp Bảo Hiểm Doanh Nghiệp Theo Năm
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table bordered hover className="mb-0">
              <thead>
                <tr>
                  <th>Năm</th>
                  <th>BHXH DN</th>
                  <th>BHYT DN</th>
                  <th>BHTN DN</th>
                  <th>Tổng cộng</th>
                  <th>Số tháng</th>
                  <th>Trung bình/tháng</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.length > 0 ? (
                  yearlyData.map((item) => (
                    <tr key={item.year} className={item.year === parseInt(selectedYear) ? 'table-active' : ''}>
                      <td className="fw-bold">{item.year}</td>
                      <td className="text-primary">{formatCurrency(item.totalBHXH_DN)}</td>
                      <td className="text-success">{formatCurrency(item.totalBHYT_DN)}</td>
                      <td className="text-warning">{formatCurrency(item.totalBHTN_DN)}</td>
                      <td className="fw-bold text-dark">{formatCurrency(item.totalAll)}</td>
                      <td className="text-center">
                        <Badge bg="secondary">{item.monthCount}</Badge>
                      </td>
                      <td className="text-info">{formatCurrency(item.totalAll / item.monthCount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      Không có dữ liệu bảo hiểm doanh nghiệp
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Bảng theo nhân viên cho năm được chọn */}
      {selectedYearData && (
        <Card className="shadow-sm border-0 rounded-card mt-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">
              <FaUser className="me-2" />
              Chi Tiết Theo Nhân Viên Năm {selectedYear}
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table bordered hover className="mb-0">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Nhân viên</th>
                    <th>BHXH DN</th>
                    <th>BHYT DN</th>
                    <th>BHTN DN</th>
                    <th>Tổng cộng</th>
                    <th>Số tháng</th>
                    <th>Trung bình/tháng</th>
                  </tr>
                </thead>
                <tbody>
                  {totalByEmployee.length > 0 ? (
                    totalByEmployee.map((item, index) => (
                      <tr key={item.nhanVienId}>
                        <td>{index + 1}</td>
                        <td className="fw-bold">{item.employeeName}</td>
                        <td className="text-primary">{formatCurrency(item.totalBHXH_DN)}</td>
                        <td className="text-success">{formatCurrency(item.totalBHYT_DN)}</td>
                        <td className="text-warning">{formatCurrency(item.totalBHTN_DN)}</td>
                        <td className="fw-bold text-dark">{formatCurrency(item.totalAll)}</td>
                        <td className="text-center">
                          <Badge bg="secondary">{item.monthCount}</Badge>
                        </td>
                        <td className="text-info">{formatCurrency(item.totalAll / item.monthCount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        Không có dữ liệu nhân viên năm {selectedYear}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Thống kê tổng quan */}
      {summaryStats && (
        <Alert variant="info" className="mt-4">
          <h6 className="fw-bold">
            <FaCalculator className="me-2" />
            Thống Kê Tổng Quan Năm {selectedYear}
          </h6>
          <div className="mt-2">
            <Row>
              <Col md={4}>
                <strong>Tổng bảo hiểm doanh nghiệp:</strong>{' '}
                <span className="text-primary">{formatCurrency(summaryStats.totalCompanyInsurance)}</span>
              </Col>
              <Col md={4}>
                <strong>Tổng thuế nhân viên:</strong>{' '}
                <span className="text-warning">{formatCurrency(summaryStats.totalEmployeeTax)}</span>
              </Col>
              <Col md={4}>
                <strong>Số nhân viên đóng BH:</strong>{' '}
                <span className="text-success">{summaryStats.employeeCount}</span>
              </Col>
            </Row>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default QuanLyThueVaBaoHiem;