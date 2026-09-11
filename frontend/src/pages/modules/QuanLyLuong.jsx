
import React, { useState } from "react";
import {
  Button,
  Modal,
  OverlayTrigger,
  Tooltip,
  Breadcrumb,
  Row,
  Col,
  Card,
  Form,
  Table,
  Tabs,
  Tab // THÊM Tabs và Tab vào import
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { exportBangLuongToExcel } from "../../utils/exportToExcel";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../../../src/components/Loading";
import {
  FaSearch,
  FaCalculator,
  FaFileExport,
  FaHome,
  FaChartBar,
  FaTable
} from "react-icons/fa";

import { useQuanLyLuong } from "../../hooks/useQuanLyLuong";
import LuongTable from "../../components/quanlyluong/LuongTable";
import TableHeader from "../../components/quanlyluong/TableHeader";
import Pagination from "../../components/quanlyluong/Pagination";
import CalculationModal from "../../components/quanlyluong/CalculationModal";
import SalaryCharts from "../../components/quanlyluong/SalaryCharts";
import "../../css/QuanLyLuong.css";

const QuanLyLuong = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("table"); // "table" hoặc "charts"
  
  const {
    paginatedList,
    nhanVienList,
    phongBanList,
    luongList,
    loading,
    searchKeyword,
    selectedMonthNumber,
    selectedYear,
    selectedPhongBan,
    currentPage,
    totalPages,
    showModal,
    isTinhTatCa,
    formData,
    isHR,
    setSearchKeyword,
    setSelectedMonthNumber,
    setSelectedYear,
    setSelectedPhongBan,
    setCurrentPage,
    setShowModal,
    setIsTinhTatCa,
    setFormData,
    handleDeleteLuong,
    handleSubmitLuong,
  } = useQuanLyLuong();

  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  if (loading) {
    return (
      <div>
        <ToastContainer position="top-right" autoClose={2000} />
        <Loading />
      </div>
    );
  }

  return (
    <div className="p-4 ps-5 quan-ly-luong-container">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header Section */}
      <HeaderSection navigate={navigate} />

      {/* Filter and Actions Card */}
      <FilterSection
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        setCurrentPage={setCurrentPage}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonthNumber={selectedMonthNumber}
        setSelectedMonthNumber={setSelectedMonthNumber}
        filteredList={paginatedList}
        nhanVienList={nhanVienList}
        isHR={isHR}
        setShowModal={setShowModal}
        setIsTinhTatCa={setIsTinhTatCa}
      />

      {/* Tab Navigation */}
      <Card className="shadow-sm border-0 rounded-card mb-4">
        <Card.Body className="p-3">
          <Tabs
            activeKey={activeTab}
            onSelect={(tab) => setActiveTab(tab)}
            className="custom-tabs"
          >
            <Tab
              eventKey="table"
              title={
                <span>
                  <FaTable className="me-2" />
                  Bảng Dữ Liệu
                </span>
              }
            >
              {/* Table Section */}
              <TableSection
                data={paginatedList}
                nhanVienList={nhanVienList}
                isHR={isHR}
                loading={loading}
                onDelete={handleDeleteLuong}
                formatCurrency={formatCurrency}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </Tab>
            <Tab
              eventKey="charts"
              title={
                <span>
                  <FaChartBar className="me-2" />
                  Biểu Đồ Thống Kê
                </span>
              }
            >
              {/* Charts Section */}
              <SalaryCharts
                luongList={luongList}
                nhanVienList={nhanVienList}
                phongBanList={phongBanList}
                selectedYear={selectedYear}
                selectedMonthNumber={selectedMonthNumber}
                isHR={isHR}
                currentUser={isHR ? null : { id: formData.nhan_vien_id }}
                formatCurrency={formatCurrency}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Calculation Modal */}
      <CalculationModal
        show={showModal}
        onHide={() => setShowModal(false)}
        isTinhTatCa={isTinhTatCa}
        isHR={isHR}
        formData={formData}
        setFormData={setFormData}
        selectedPhongBan={selectedPhongBan}
        setSelectedPhongBan={setSelectedPhongBan}
        phongBanList={phongBanList}
        nhanVienList={nhanVienList}
        onSubmit={handleSubmitLuong}
      />
    </div>
  );
};

// Sub-components
const HeaderSection = ({ navigate }) => (
  <div className="quan-ly-luong-header mb-4 shadow-sm">
    <div className="d-flex justify-content-between align-items-center">
      <div>
        <Breadcrumb className="mb-3">
          <Breadcrumb.Item active>
            <FaHome className="me-2" />
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item active>Quản lý lương</Breadcrumb.Item>
        </Breadcrumb>
        <h1 className="fw-bold mb-2">💰 Quản lý Lương</h1>
        <p className="mb-0 opacity-90">Quản lý và tính toán lương nhân viên</p>
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
);

const FilterSection = ({
  searchKeyword,
  setSearchKeyword,
  setCurrentPage,
  selectedYear,
  setSelectedYear,
  selectedMonthNumber,
  setSelectedMonthNumber,
  filteredList,
  nhanVienList,
  isHR,
  setShowModal,
  setIsTinhTatCa,
}) => (
  <Card className="shadow-sm border-0 rounded-card mb-4">
    <Card.Body className="p-4">
      <Row className="g-3">
        <Col md={4}>
          <div className="position-relative">
            <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
            <Form.Control
              type="text"
              placeholder="Tìm theo tên nhân viên..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Chọn năm</option>
            {[...Array(5).keys()].map((i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={selectedMonthNumber}
            onChange={(e) => {
              setSelectedMonthNumber(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Chọn tháng</option>
            {[...Array(12).keys()].map((i) => {
              const month = i + 1;
              return (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              );
            })}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            variant="outline-success"
            className="w-100"
            onClick={() => exportBangLuongToExcel(filteredList, nhanVienList)}
          >
            <FaFileExport className="me-2" />
            Xuất Excel
          </Button>
        </Col>
      </Row>

      <Row className="g-3 mt-2">
        <Col md={6}>
          {isHR && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Tính lương cho 1 nhân viên</Tooltip>}
          >
            <Button
              variant="outline-primary"
              className="w-100 hover-gradient-primary"
              onClick={() => {
                setIsTinhTatCa(false);
                setShowModal(true);
              }}
            >
              <FaCalculator className="me-2" />
              Tính lương 1 nhân viên
            </Button>
          </OverlayTrigger>
          )}
        </Col>
        <Col md={6}>
          {isHR && (
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Tính lương toàn bộ nhân viên</Tooltip>}
            >
              <Button
                variant="outline-warning"
                className="w-100 hover-gradient-warning"
                onClick={() => {
                  setIsTinhTatCa(true);
                  setShowModal(true);
                }}
              >
                <FaCalculator className="me-2" />
                Tính lương tất cả
              </Button>
            </OverlayTrigger>
          )}
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

const TableSection = ({ data, nhanVienList, isHR, loading, onDelete, formatCurrency }) => (
  <Card className="shadow-sm border-0 rounded-card">
    <Card.Body className="p-0">
      <div className="table-container">
        <Table bordered hover className="mb-0" style={{ minWidth: "1800px" }}>
          <TableHeader isHR={isHR} />
          <tbody>
            <LuongTable
              data={data}
              nhanVienList={nhanVienList}
              isHR={isHR}
              loading={loading}
              onDelete={onDelete}
              formatCurrency={formatCurrency}
            />
          </tbody>
        </Table>
      </div>
    </Card.Body>
  </Card>
);

export default QuanLyLuong;
