// components/TableHeader.js
import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const TableHeader = ({ isHR }) => {
  const columns = [
    { name: "Ngày công chuẩn", width: "120px" },
    { name: "Số ngày công", width: "110px" },
    { name: "Ngày phép", width: "100px" },
    { name: "Trừ nghỉ không phép", width: "140px" },
    { name: "Ngày làm lễ", width: "110px" },
    { name: "Tiền làm lễ", width: "110px" },
    { name: "Giờ tăng ca", width: "110px" },
    { name: "Tiền tăng ca", width: "110px" },
    { name: "Ngày làm cuối tuần", width: "140px" },
    { name: "Tiền làm cuối tuần", width: "140px" },
    { name: "PC ăn trưa", width: "100px" },
    { name: "PC xăng xe", width: "100px" },
    { name: "PC độc hại", width: "100px" },
    { name: "PC trách nhiệm", width: "120px" },
    { name: "PC chức vụ", width: "100px" },
    { name: "PC thâm niên", width: "110px" },
    { name: "PC khác", width: "90px" },
    { name: "Tổng phụ cấp", width: "110px" },
    { name: "Thưởng nóng", width: "100px" },
    { name: "Thưởng lễ", width: "90px" },
    { name: "Thưởng khác", width: "100px" },
    { name: "Tổng thưởng", width: "100px" },
    { name: "Tổng lương", width: "110px" },
    { name: "Trừ đi trễ/về sớm", width: "130px" },
    { name: "Trừ vi phạm", width: "100px" },
    { name: "Trừ tạm ứng", width: "100px" },
    { name: "Trừ khác", width: "80px" },
    { name: "Tổng khấu trừ", width: "110px" },
    { name: "BHXH", width: "80px" },
    { name: "BHTN", width: "80px" },
    { name: "BHYT", width: "80px" },
    { name: "Thuế TNCN", width: "90px" },
    { name: "Thực nhận", width: "100px" },
  ];

  return (
    <thead className="sticky-header">
      <tr>
        <th className="sticky-icon-column">
          <FaInfoCircle size={14} />
        </th>
        <th className="sticky-name-column">Nhân viên</th>
        <th className="sticky-month-column">Tháng</th>
        {columns.map((column, index) => (
          <th
            key={index}
            className="table-column-header"
            style={{ minWidth: column.width, width: column.width }}
            title={column.name}
          >
            {column.name}
          </th>
        ))}
        {isHR && (
          <th className="table-column-header" style={{ minWidth: "120px", width: "120px" }}>
            Hành động
          </th>
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;