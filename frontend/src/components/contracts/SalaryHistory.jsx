// src/components/contract/SalaryHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, Form, Row, Col } from "react-bootstrap";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { getHopDongListByNhanVienId } from "../../services/hopDongLaoDongApi";
import { fmtVND, fmtDate } from "../../utils/format";

const nz = (v, d = 0) => (v === null || v === undefined ? d : v);

const totalComp = (hd) =>
    nz(hd.muc_luong_co_ban) +
    nz(hd.phu_cap_an_trua) +
    nz(hd.phu_cap_xang_xe) +
    nz(hd.phu_cap_doc_hai) +
    nz(hd.phu_cap_trach_nhiem) +
    nz(hd.phu_cap_chuc_vu) +
    nz(hd.phu_cap_tham_nien);

export default function SalaryHistory({ nhanVienId, refreshKey }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Bộ lọc
    const [filterYear, setFilterYear] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        let stop = false;
        (async () => {
            setLoading(true);
            try {
                const rows = await getHopDongListByNhanVienId(nhanVienId);
                if (!stop) setList(rows || []);
            } finally {
                if (!stop) setLoading(false);
            }
        })();
        return () => {
            stop = true;
        };
    }, [nhanVienId, refreshKey]);

    // Danh sách năm có trong dữ liệu
    const years = useMemo(() => {
        const ys = new Set();
        list.forEach((hd) => {
            if (hd.ngay_bat_dau) ys.add(new Date(hd.ngay_bat_dau).getFullYear());
        });
        return Array.from(ys).sort((a, b) => b - a);
    }, [list]);

    // Áp dụng bộ lọc
    const filteredList = useMemo(() => {
        return list.filter((hd) => {
            const year = hd.ngay_bat_dau
                ? new Date(hd.ngay_bat_dau).getFullYear().toString()
                : null;

            const passYear = filterYear === "all" || filterYear === year;
            const passType =
                filterType === "all" ||
                (hd.loai_hop_dong || "").toLowerCase() ===
                filterType.toLowerCase();
            const passStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && hd.trang_thai) ||
                (filterStatus === "inactive" && !hd.trang_thai);

            return passYear && passType && passStatus;
        });
    }, [list, filterYear, filterType, filterStatus]);

    const rows = useMemo(() => {
        const sorted = [...filteredList].sort(
            (a, b) => new Date(a.ngay_bat_dau) - new Date(b.ngay_bat_dau)
        );
        return sorted.map((hd) => ({
            ...hd,
            tong_thu_nhap: totalComp(hd),
        }));
    }, [filteredList]);

    const chartData = useMemo(() => {
        return rows.map((r) => ({
            date: fmtDate(r.ngay_bat_dau),
            salary: r.tong_thu_nhap,
            base: nz(r.muc_luong_co_ban),
        }));
    }, [rows]);

    if (loading) return <p className="mt-3">Đang tải lịch sử lương…</p>;
    if (!rows.length)
        return (
            <p className="mt-3">Chưa có dữ liệu hợp đồng để hiển thị mức lương.</p>
        );

    return (
        <Card className="border-0 shadow-sm mt-4">
            <Card.Body>
                <h5 className="mb-3">📈 Lịch sử mức lương theo hợp đồng</h5>

                {/* Bộ lọc */}
                <Row className="mb-3 g-2">
                    <Col xs={12} md={4}>
                        <Form.Select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <option value="all">Tất cả năm</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>




                </Row>

                {/* Biểu đồ đường */}
                <div style={{ width: "100%", height: 280 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis
                                tickFormatter={(v) =>
                                    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}tr` : v
                                }
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    fmtVND(value),
                                    name === "salary" ? "Tổng cố định" : "Lương cơ bản",
                                ]}
                                labelFormatter={(label) => `Từ: ${label}`}
                            />
                            <Line
                                type="monotone"
                                dataKey="salary"
                                stroke="#007bff"
                                strokeWidth={2}
                                dot
                            />
                            <Line
                                type="monotone"
                                dataKey="base"
                                stroke="#28a745"
                                strokeWidth={2}
                                dot
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Bảng chi tiết */}
                <div className="table-responsive mt-3">
                    <table className="table table-sm table-hover align-middle">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Loại HĐ</th>
                                <th>Bắt đầu</th>
                                <th>Kết thúc</th>
                                <th>Lương cơ bản</th>
                                <th>Phụ cấp</th>
                                <th>Tổng cố định</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => {
                                const phuCap =
                                    nz(r.phu_cap_an_trua) +
                                    nz(r.phu_cap_xang_xe) +
                                    nz(r.phu_cap_doc_hai) +
                                    nz(r.phu_cap_trach_nhiem) +
                                    nz(r.phu_cap_chuc_vu) +
                                    nz(r.phu_cap_tham_nien);
                                return (
                                    <tr key={r.id ?? i}>
                                        <td>{i + 1}</td>
                                        <td>{r.loai_hop_dong || "—"}</td>
                                        <td>{fmtDate(r.ngay_bat_dau)}</td>
                                        <td>{fmtDate(r.ngay_ket_thuc) || "—"}</td>
                                        <td>{fmtVND(nz(r.muc_luong_co_ban))}</td>
                                        <td>{fmtVND(phuCap)}</td>
                                        <td className="fw-semibold">{fmtVND(r.tong_thu_nhap)}</td>
                                        <td>{r.trang_thai ? "Hiệu lực" : "Ngừng"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card.Body>
        </Card>
    );
}
