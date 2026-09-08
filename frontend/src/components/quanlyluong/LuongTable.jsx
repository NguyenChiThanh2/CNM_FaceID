// components/LuongTable.js
import React from 'react';
import { Table, OverlayTrigger, Tooltip, Popover, Button } from 'react-bootstrap';
import { FaTrash, FaInfoCircle } from 'react-icons/fa';

const LuongTable = ({ 
  data, 
  nhanVienList, 
  isHR, 
  loading, 
  onDelete,
  formatCurrency 
}) => {
  if (loading) {
    return (
      <tr>
        <td colSpan="42" className="text-center">
          Đang tải dữ liệu...
        </td>
      </tr>
    );
  }

  if (data.length === 0) {
    return (
      <tr>
        <td colSpan="42" className="text-center text-muted py-4">
          <FaInfoCircle size={32} className="mb-2 opacity-50" />
          <br />
          Không có bảng lương
        </td>
      </tr>
    );
  }

  return data.map((luong, rowIndex) => {
    const nv = nhanVienList.find(nv => nv.id === luong.nhan_vien_id);
    const chiTiet = luong.chi_tiet_luong || [];
    
    // Helper function to find chi tiết by type
    const findChiTiet = (loai) => chiTiet.find(ct => ct.loai === loai);
    const filterChiTiet = (loai) => chiTiet.filter(ct => ct.loai === loai);

    // Phụ cấp
    const anUong = findChiTiet("AN_UONG");
    const xangXe = findChiTiet("XANG_XE");
    const docHai = findChiTiet("DOC_HAI");
    const trachNhiem = findChiTiet("TRACH_NHIEM");
    const chucVu = findChiTiet("CHUC_VU");
    const thamNien = findChiTiet("THAM_NIEN");
    const phucapkhac = findChiTiet("PHU_CAP_KHAC");

    // Khấu trừ
    const diTreVeSom = findChiTiet("DI_TRE_VE_SOM");
    const nghiKhongPhep = findChiTiet("NGHI_KHONG_PHEP");
    const viPhamNoiQuy = findChiTiet("VI_PHAM");
    const tamUng = findChiTiet("UNG_LUONG");
    const truKhacList = filterChiTiet("TRU_KHAC");

    // Thưởng
    const thuongNong = findChiTiet("NONG");
    const thuongLe = findChiTiet("LE");
    const thuongKhacList = filterChiTiet("THUONG_KHAC");

    return (
      <tr key={luong.id} style={{ transition: "all 0.3s ease" }}>
        {/* Icon column */}
        <TableCellSticky 
          position="icon" 
          rowIndex={rowIndex}
          content={
            <OverlayTrigger
              placement="top"
              overlay={
                <Popover>
                  <Popover.Body>
                    <small>{luong?.ghi_chu || ""}</small>
                  </Popover.Body>
                </Popover>
              }
            >
              <span>{luong.ghi_chu === "Nghỉ thai sản" ? "🤰" : ""}</span>
            </OverlayTrigger>
          }
        />

        {/* Nhân viên column */}
        <TableCellSticky 
          position="name" 
          rowIndex={rowIndex}
          content={nv?.ho_ten || "Không rõ"}
        />

        {/* Tháng column */}
        <TableCellSticky 
          position="month" 
          rowIndex={rowIndex}
          content={`${luong.thang}/${luong.nam}`}
        />

        {/* Các columns chính */}
        <TableDataCell value={luong.ngay_cong_chuan} />
        <TableDataCell value={luong.so_ngay_cong} />
        <TableDataCell value={luong.nghi_phep > 0 ? luong.nghi_phep : " "} align="center" />
        
        <TableDataCell 
          value={nghiKhongPhep ? nghiKhongPhep.so_tien : 0} 
          formatCurrency 
          negative 
        />
        
        <TableDataCell value={luong.tong_ngay_lam_le} />
        <TableDataCell value={luong.tong_tien_lam_le} formatCurrency positive />
        <TableDataCell value={luong.tong_gio_tang_ca} />
        <TableDataCell value={luong.tong_tien_tang_ca} formatCurrency positive />
        <TableDataCell value={luong.tong_ngay_cuoi_tuan} />
        <TableDataCell value={luong.tong_tien_cuoi_tuan} formatCurrency positive />

        {/* Phụ cấp */}
        <TableDataCell value={anUong?.so_tien || 0} formatCurrency positive />
        <TableDataCell value={xangXe?.so_tien || 0} formatCurrency positive />
        <TableDataCell value={docHai?.so_tien || 0} formatCurrency positive />
        <TableDataCell value={trachNhiem?.so_tien || 0} formatCurrency positive />
        <TableDataCell value={chucVu?.so_tien || 0} formatCurrency positive />
        <TableDataCell value={thamNien?.so_tien || 0} formatCurrency positive />
        
        <TableDataCellWithTooltip
          value={phucapkhac?.so_tien || 0}
          tooltipTitle="Phụ cấp khác"
          tooltipContent={phucapkhac?.ghi_chu || "Không có ghi chú"}
          formatCurrency
          positive
        />

        <TableDataCell value={luong.tong_phu_cap} formatCurrency total />

        {/* Thưởng */}
        <TableDataCell value={thuongNong?.so_tien || 0} formatCurrency warning />
        <TableDataCell value={thuongLe?.so_tien || 0} formatCurrency warning />
        
        <TableDataCellWithTooltip
          value={thuongKhacList.reduce((sum, tk) => sum + (tk.so_tien || 0), 0)}
          tooltipTitle="Thưởng khác"
          tooltipContent={
            thuongKhacList.length > 0 ? (
              <ul className="mb-0 ps-3">
                {thuongKhacList.map((tk) => (
                  <li key={tk.id}>
                    <div><strong>{tk.ghi_chu || "Thưởng khác"}</strong></div>
                    <div>Số tiền: {formatCurrency(tk.so_tien)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <small>Không có thưởng khác</small>
            )
          }
          formatCurrency
          warning
        />

        <TableDataCell value={luong.tong_thuong} formatCurrency total warning />

        <TableDataCell value={luong.tong_luong} formatCurrency bold />

        {/* Khấu trừ */}
        <TableDataCell value={diTreVeSom?.so_tien || 0} formatCurrency negative />
        <TableDataCell value={viPhamNoiQuy?.so_tien || 0} formatCurrency negative />
        <TableDataCell value={tamUng?.so_tien || 0} formatCurrency negative />
        
        <TableDataCellWithTooltip
          value={truKhacList.reduce((sum, kt) => sum + (kt.so_tien || 0), 0)}
          tooltipTitle="Khấu trừ khác"
          tooltipContent={
            truKhacList.length > 0 ? (
              <ul className="mb-0 ps-3">
                {truKhacList.map((kt) => (
                  <li key={kt.id}>
                    <div><strong>{kt.ghi_chu || "Khấu trừ khác"}</strong></div>
                    <div>Số tiền: {formatCurrency(kt.so_tien)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <small>Không có khấu trừ</small>
            )
          }
          formatCurrency
          negative
        />

        <TableDataCell value={luong.tong_khau_tru} formatCurrency total negative />

        {/* Bảo hiểm và thuế */}
        <TableDataCell value={luong.bhxh} formatCurrency negative />
        <TableDataCell value={luong.bhtn} formatCurrency negative />
        <TableDataCell value={luong.bhyt} formatCurrency negative />
        <TableDataCell value={luong.thue_tncn} formatCurrency negative />
        
        <TableDataCell value={luong.thuc_nhan} formatCurrency total primary bold/>

        {/* Hành động */}
        {isHR && (
          <td>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Xoá dòng lương này</Tooltip>}
            >
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(luong.id)}
              >
                <FaTrash />
              </Button>
            </OverlayTrigger>
          </td>
        )}
      </tr>
    );
  });
};

// Helper components
const TableCellSticky = ({ position, rowIndex, content }) => {
  const positionStyles = {
    icon: {
      left: 0,
      width: "60px",
      className: "sticky-icon-column"
    },
    name: {
      left: "60px", 
      width: "200px",
      className: "sticky-name-column"
    },
    month: {
      left: "260px",
      width: "120px", 
      className: "sticky-month-column"
    }
  };

  const style = positionStyles[position];
  
  return (
    <td
      style={{
        position: "sticky",
        left: style.left,
        zIndex: 2,
        minWidth: style.width,
        width: style.width,
        background: rowIndex % 2 === 0 ? "#f8f9fa" : "#fff",
        borderRight: position === 'month' ? "2px solid #dee2e6" : "1px solid #dee2e6",
        textAlign: position === 'icon' ? 'center' : 'left',
        fontWeight: position === 'name' ? '500' : 'normal'
      }}
      className={style.className}
    >
      {content}
    </td>
  );
};

const TableDataCell = ({ value, formatCurrency, align = 'center', bold, positive, negative, warning, total, primary }) => {
  let className = '';
  if (positive) className = 'positive-amount';
  if (negative) className = 'negative-amount';
  if (total) className = 'total-amount';
  if (warning) className = 'bg-warning-subtle';
  if (primary) className = 'bg-primary bg-opacity-25';

  const content = formatCurrency 
    ? value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
    : value;

  return (
    <td 
      className={className}
      style={{ 
        textAlign: align,
        fontWeight: bold ? 'bold' : 'normal'
      }}
    >
      {content}
    </td>
  );
};

const TableDataCellWithTooltip = ({ value, tooltipTitle, tooltipContent, formatCurrency, ...props }) => (
  <OverlayTrigger
    placement="top"
    overlay={
      <Popover>
        <Popover.Header as="h5">{tooltipTitle}</Popover.Header>
        <Popover.Body>{tooltipContent}</Popover.Body>
      </Popover>
    }
  >
    <td className={props.positive ? 'positive-amount' : props.negative ? 'negative-amount' : 'bg-warning-subtle'}>
      <span style={{ cursor: "pointer" }}>
        {formatCurrency 
          ? value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
          : value
        }
      </span>
    </td>
  </OverlayTrigger>
);

export default LuongTable;