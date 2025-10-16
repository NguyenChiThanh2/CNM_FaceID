import React from "react";
import { fmtVND, fmtDate } from "../../utils/format";
import { computeEndDateFE } from "../../utils/contractDuration";

const nz = (v, d = "—") => (v === null || v === undefined ? d : v);

export default function ContractA4Paper({
  nhanSu, hopDong, chucVu, phongBan, phucLoiList, contractRef
}) {
  return (
    <div className="a4-paper" ref={contractRef}>
      {/* Header */}
      <div className="a4-header">
        <div>
          <div className="fw-bold">CÔNG TY …………………………</div>
          <div className="a4-meta">ĐC: ……………………………………………………</div>
          <div className="a4-meta">MST: …………………………………………………</div>
        </div>
        <div className="text-end a4-meta">Ngày {new Date().toLocaleDateString()}</div>
      </div>

      <div className="a4-title">HỢP ĐỒNG LAO ĐỘNG</div>

      {/* I. Thông tin các bên */}
      <div className="a4-section">
        <h4>I. THÔNG TIN CÁC BÊN</h4>
        <div className="a4-row">
          <div className="a4-kv">
            <b>Bên A (Người sử dụng lao động):</b><br />
            CÔNG TY ………………………………………<br />
            Đại diện: ………………………………………<br />
            Chức vụ: ………………………………………<br />
            Địa chỉ: ………………………………………<br />
            Điện thoại: ……………………………………
          </div>
          <div className="a4-kv">
            <b>Bên B (Người lao động):</b><br />
            Họ tên: {nz(nhanSu.ho_ten)}<br />
            Giới tính: {nz(nhanSu.gioi_tinh)}<br />
            Ngày sinh: {fmtDate(nhanSu.ngay_sinh)}<br />
            Điện thoại: {nz(nhanSu.so_dien_thoai)}<br />
            Địa chỉ: {nz(nhanSu.dia_chi)}
          </div>
        </div>
      </div>

      {/* II. Nội dung hợp đồng */}
      <div className="a4-section">
        <h4>II. NỘI DUNG HỢP ĐỒNG</h4>
        <div className="a4-kv"><b>Loại hợp đồng:</b> {nz(hopDong?.loai_hop_dong)}</div>
        <div className="a4-kv">
          <b>Chức vụ / Phòng ban:</b> {nz(chucVu, "—")} {chucVu && phongBan ? " - " : ""}{nz(phongBan, "—")}
        </div>
        <div className="a4-row" style={{ marginTop: 6 }}>
          <div className="a4-kv"><b>Ngày bắt đầu:</b> {fmtDate(hopDong?.ngay_bat_dau)}</div>
          <div className="a4-kv">
            <b>Ngày kết thúc:</b>{" "}
            {fmtDate(hopDong?.ngay_ket_thuc) ||
              fmtDate(
                computeEndDateFE(
                  hopDong?.ngay_bat_dau?.slice ? hopDong.ngay_bat_dau.slice(0, 10) : hopDong?.ngay_bat_dau,
                  hopDong?.thoi_gian_hop_dong
                )
              ) || "Không thời hạn"}
          </div>
        </div>
        <div className="a4-kv"><b>Thời hạn hợp đồng:</b> {nz(hopDong?.thoi_gian_hop_dong)}</div>
        <div className="a4-kv"><b>Phép năm:</b> {nz(hopDong?.phep_nam, 0)} ngày</div>

        <table className="a4-table">
          <thead>
            <tr>
              <th style={{ width: "55%" }}>Khoản mục</th>
              <th style={{ width: "45%" }}>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Lương cơ bản</td><td>{fmtVND(nz(hopDong?.muc_luong_co_ban, 0))}</td></tr>
            <tr><td>Phụ cấp ăn trưa</td><td>{fmtVND(nz(hopDong?.phu_cap_an_trua, 0))}</td></tr>
            <tr><td>Phụ cấp xăng xe</td><td>{fmtVND(nz(hopDong?.phu_cap_xang_xe, 0))}</td></tr>
            <tr><td>Phụ cấp độc hại</td><td>{fmtVND(nz(hopDong?.phu_cap_doc_hai, 0))}</td></tr>
            <tr><td>Phụ cấp trách nhiệm</td><td>{fmtVND(nz(hopDong?.phu_cap_trach_nhiem, 0))}</td></tr>
            <tr><td>Phụ cấp chức vụ</td><td>{fmtVND(nz(hopDong?.phu_cap_chuc_vu, 0))}</td></tr>
            <tr><td>Phụ cấp thâm niên</td><td>{fmtVND(nz(hopDong?.phu_cap_tham_nien, 0))}</td></tr>
            <tr><td>Phạt đi trễ (VNĐ/phút)</td><td>{nz(hopDong?.di_tre_phat, 0)}</td></tr>
            <tr><td>Phạt về sớm (VNĐ/phút)</td><td>{nz(hopDong?.ve_som_phat, 0)}</td></tr>
            <tr><td>Hệ số tăng ca</td><td>{nz(hopDong?.tang_ca_heso, 0)}</td></tr>
            <tr><td>Hệ số ngày lễ</td><td>{nz(hopDong?.luong_ngay_le_heso, 0)}</td></tr>
            <tr><td>Hệ số cuối tuần</td><td>{nz(hopDong?.luong_cuoi_tuan_heso, 0)}</td></tr>
          </tbody>
        </table>

        {Array.isArray(phucLoiList) && phucLoiList.length > 0 && (
          <>
            <div className="a4-kv" style={{ marginTop: 8 }}><b>Phúc lợi kèm theo:</b></div>
            <ul style={{ marginTop: 4, paddingLeft: 18, fontSize: 12 }}>
              {phucLoiList.map((pl, i) => (
                <li key={pl.id || i}>
                  {pl.ten_phuc_loi}: {pl.mo_ta ? `${pl.mo_ta} - ` : ""}{pl.gia_tri ?? "—"}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="a4-note">
          * Hai bên cam kết thực hiện đúng các điều khoản trên; điều khoản khác (nếu có) sẽ được lập
          tại phụ lục hợp đồng và là một phần không tách rời của hợp đồng này.
        </div>
      </div>

      {/* Chỗ ký */}
      <div className="a4-footer">
        <div>
          <div className="a4-sign-box"><b>ĐẠI DIỆN BÊN A</b><br />(Ký, ghi rõ họ tên & đóng dấu)</div>
        </div>
        <div>
          <div className="a4-sign-box"><b>NGƯỜI LAO ĐỘNG (BÊN B)</b><br />(Ký & ghi rõ họ tên)</div>
        </div>
      </div>
    </div>
  );
}
