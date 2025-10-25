import React, { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Area, Line, Brush, ReferenceLine
} from "recharts";
import { Row, Col, Form, Card, Badge } from "react-bootstrap";

// ====== BẢNG MÀU ======
const PALETTE = {
    blue: "#4e79a7",
    orange: "#f28e2b",
    red: "#e15759",
    teal: "#76b7b2",
    green: "#59a14f",
    yellow: "#edc948",
    purple: "#b07aa1",
    pink: "#ff9da7",
    gray: "#9ea3a8",
};
const CRITERIA_COLORS = [PALETTE.blue, PALETTE.orange, PALETTE.green, PALETTE.purple, PALETTE.teal];
const GRADE_COLORS = { A: "#2ecc71", B: "#3498db", C: "#f1c40f", D: "#e74c3c" }; // cố định A/B/C/D
const SCORE_MIN = 0, SCORE_MAX = 10;
const THRESH_GOOD = 8.0, THRESH_WARN = 6.5;

// ====== UTILS ======
function toMonthKey(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
}
function toYearKey(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.getFullYear().toString();
}
function getGrade(tongDiem) {
    const s = Number(tongDiem || 0);
    if (s >= 9) return "A";
    if (s >= 8) return "B";
    if (s >= 6.5) return "C";
    return "D";
}
function avg(nums) {
    const arr = nums.filter((x) => x != null && !Number.isNaN(Number(x))).map(Number);
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function median(nums) {
    const arr = nums.filter((x) => x != null && !Number.isNaN(Number(x))).map(Number).sort((a, b) => a - b);
    if (!arr.length) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}
function fmt2(x) {
    const n = Number(x || 0);
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
}
function getDeptName(dg) {
    return dg?.nhan_vien?.ten_phong_ban
        || dg?.nhan_vien?.phong_ban?.ten_phong_ban
        || (dg?.nhan_vien?.phong_ban_id != null ? `PB #${dg.nhan_vien.phong_ban_id}` : "Khác/Không rõ");
}
// màu theo điểm (Top5)
function colorByScore(score) {
    const s = Math.max(SCORE_MIN, Math.min(SCORE_MAX, Number(score || 0)));
    if (s < THRESH_WARN) return "#e57373";
    if (s < THRESH_GOOD) return "#ffb74d";
    if (s < 9) return "#ffd54f";
    return "#81c784";
}

// ====== TOOLTIP TÙY BIẾN ======
const NiceTooltip = ({ active, label, payload, unit }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div style={{
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            borderRadius: 10, padding: "10px 12px", border: "1px solid #eee", minWidth: 160,
        }}>
            {label && <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>}
            {payload.map((p, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
                    <span style={{
                        display: "inline-block", width: 10, height: 10, borderRadius: 3, background: p.color
                    }} />
                    <span style={{ flex: 1, color: "#555" }}>{p.name}</span>
                    <span style={{ fontWeight: 600 }}>{p.value}{unit || ""}</span>
                </div>
            ))}
        </div>
    );
};

// ====== MAIN COMPONENT ======
const DanhGiaCharts = ({ data = [] }) => {
    // ====== BỘ LỌC ======
    const yearOptions = useMemo(() => {
        const set = new Set();
        data.forEach((d) => {
            const y = toYearKey(d.ky_ngay);
            if (y) set.add(y);
        });
        return Array.from(set).sort((a, b) => Number(b) - Number(a));
    }, [data]);

    const deptOptions = useMemo(() => {
        const map = new Map();
        data.forEach((d) => {
            const label = getDeptName(d);
            if (!map.has(label)) map.set(label, label);
        });
        return Array.from(map.values());
    }, [data]);

    const [selectedYear, setSelectedYear] = useState(yearOptions[0] || "");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedNVId, setSelectedNVId] = useState("");

    // bật/tắt tiêu chí trong chart cột
    const [criteriaEnabled, setCriteriaEnabled] = useState({
        cc: true, hq: true, kn: true, td: true, cd: true
    });

    const filteredData = useMemo(() => {
        return data.filter((d) => {
            const y = toYearKey(d.ky_ngay);
            const m = toMonthKey(d.ky_ngay).slice(5); // "MM"
            const dept = getDeptName(d);
            const okYear = selectedYear ? y === selectedYear : true;
            const okMonth = selectedMonth ? m === selectedMonth : true;
            const okDept = selectedDept ? dept === selectedDept : true;
            return okYear && okMonth && okDept;
        });
    }, [data, selectedYear, selectedMonth, selectedDept]);

    // ====== KPI ======
    const kpi = useMemo(() => {
        const total = filteredData.length;
        const scores = filteredData.map((d) => Number(d.tong_diem || 0));
        const avgScore = avg(scores);
        const medScore = median(scores);
        const aRate = total ? (filteredData.filter((d) => (d.xep_loai || getGrade(d.tong_diem)) === "A").length * 100) / total : 0;
        return {
            total,
            avgScore: Number(avgScore.toFixed(2)),
            medScore: Number(medScore.toFixed(2)),
            aRate: Number(aRate.toFixed(1)),
        };
    }, [filteredData]);

    // ====== 1) CỘT: Điểm TB theo tiêu chí ======
    const baseCriteria = useMemo(() => ([
        { key: "cc", name: "Chuyên cần", color: CRITERIA_COLORS[0], v: filteredData.map(d => d.diem_chuyen_can) },
        { key: "hq", name: "Hiệu quả", color: CRITERIA_COLORS[1], v: filteredData.map(d => d.diem_hieu_qua) },
        { key: "kn", name: "Kỹ năng", color: CRITERIA_COLORS[2], v: filteredData.map(d => d.diem_ky_nang) },
        { key: "td", name: "Thái độ", color: CRITERIA_COLORS[3], v: filteredData.map(d => d.diem_thai_do) },
        { key: "cd", name: "Chủ động", color: CRITERIA_COLORS[4], v: filteredData.map(d => d.diem_chu_dong) },
    ]), [filteredData]);

    const avgCriteria = useMemo(() => {
        return baseCriteria
            .filter(c => criteriaEnabled[c.key])
            .map((c) => ({ name: c.name, value: Number(avg(c.v).toFixed(2)), color: c.color }));
    }, [baseCriteria, criteriaEnabled]);

    // ====== 2) XU HƯỚNG THEO THÁNG ======
    const monthlyTrend = useMemo(() => {
        const m = new Map();
        filteredData.forEach((d) => {
            const key = toMonthKey(d.ky_ngay);
            if (!key) return;
            const y = key.slice(0, 4);
            if (selectedYear && y !== selectedYear) return;
            const s = Number(d.tong_diem || 0);
            if (!m.has(key)) m.set(key, { month: key, sum: 0, count: 0 });
            const o = m.get(key);
            o.sum += s;
            o.count += 1;
        });
        return Array.from(m, ([k, v]) => ({
            month: k,
            avg: Number((v.sum / (v.count || 1)).toFixed(2)),
        })).sort((a, b) => (a.month > b.month ? 1 : -1));
    }, [filteredData, selectedYear]);

    // ====== 3) PIE: Tỷ lệ xếp loại ======
    const gradePie = useMemo(() => {
        const c = { A: 0, B: 0, C: 0, D: 0 };
        filteredData.forEach((d) => {
            const g = d.xep_loai || getGrade(d.tong_diem);
            if (c[g] != null) c[g] += 1;
        });
        return ["A", "B", "C", "D"].map((g) => ({ name: g, value: c[g], color: GRADE_COLORS[g] }));
    }, [filteredData]);

    // ====== 4) STACKED: Xếp loại theo tháng ======
    const stackedByMonth = useMemo(() => {
        const m = new Map();
        filteredData.forEach((d) => {
            const key = toMonthKey(d.ky_ngay);
            if (!key) return;
            const y = key.slice(0, 4);
            if (selectedYear && y !== selectedYear) return;
            if (!m.has(key)) m.set(key, { month: key, A: 0, B: 0, C: 0, D: 0 });
            const g = d.xep_loai || getGrade(d.tong_diem);
            const obj = m.get(key);
            obj[g] = (obj[g] || 0) + 1;
        });
        return Array.from(m.values()).sort((a, b) => (a.month > b.month ? 1 : -1));
    }, [filteredData, selectedYear]);

    // ====== 5) RADAR: theo NV (mới nhất) ======
    const nhanVienOptions = useMemo(() => {
        const map = new Map();
        filteredData.forEach((d) => {
            const nv = d.nhan_vien;
            if (nv?.id && !map.has(nv.id)) map.set(nv.id, nv.ho_ten || `NV #${nv.id}`);
        });
        return Array.from(map, ([id, ho_ten]) => ({ id, ho_ten }));
    }, [filteredData]);

    const radarData = useMemo(() => {
        if (!selectedNVId) return null;
        const items = filteredData.filter((d) => d.nhan_vien?.id === Number(selectedNVId));
        if (!items.length) return null;
        items.sort((a, b) => new Date(b.ky_ngay) - new Date(a.ky_ngay));
        const latest = items[0];
        return [
            { subject: "Chuyên cần", A: Number(latest.diem_chuyen_can || 0), fullMark: 10 },
            { subject: "Hiệu quả", A: Number(latest.diem_hieu_qua || 0), fullMark: 10 },
            { subject: "Kỹ năng", A: Number(latest.diem_ky_nang || 0), fullMark: 10 },
            { subject: "Thái độ", A: Number(latest.diem_thai_do || 0), fullMark: 10 },
            { subject: "Chủ động", A: Number(latest.diem_chu_dong || 0), fullMark: 10 },
        ];
    }, [selectedNVId, filteredData]);

    // ====== 6) TOP 5 theo điểm (mới nhất) ======
    const top5 = useMemo(() => {
        const latestByNV = new Map();
        filteredData.forEach((d) => {
            const id = d.nhan_vien?.id;
            if (!id) return;
            const old = latestByNV.get(id);
            if (!old || new Date(d.ky_ngay) > new Date(old.ky_ngay)) {
                latestByNV.set(id, d);
            }
        });
        const arr = Array.from(latestByNV.values()).map((d) => ({
            name: d.nhan_vien?.ho_ten || `NV #${d.nhan_vien?.id || ""}`,
            score: Number(d.tong_diem || 0),
        }));
        arr.sort((a, b) => b.score - a.score);
        return arr.slice(0, 5);
    }, [filteredData]);

    // ====== EMPTY STATE ======
    const isEmpty = filteredData.length === 0;

    return (
        <>
            {/* ====== FILTER ====== */}
            <Card className="mb-3 mt-2">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col sm={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Năm</Form.Label>
                                <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    {yearOptions.length === 0 && <option value="">—</option>}
                                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col sm={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Tháng</Form.Label>
                                <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                                    <option value="">Cả năm</option>
                                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                                        <option key={m} value={m}>Tháng {m}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col sm={3}>
                            <Form.Group>
                                <Form.Label className="fw-semibold">Phòng ban</Form.Label>
                                <Form.Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                                    <option value="">Tất cả phòng ban</option>
                                    {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col sm={3}>
                            <div className="small text-muted">Ngưỡng: <Badge bg="success">Tốt ≥ {THRESH_GOOD}</Badge>{" "}
                                <Badge bg="warning" text="dark">Cảnh báo ≥ {THRESH_WARN}</Badge></div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* ====== KPI ====== */}
            <Row className="g-3 mb-2">
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="text-muted">Số lượt đánh giá</div>
                            <div className="fs-3 fw-bold">{kpi.total}</div>
                            <Badge bg="secondary">{selectedDept || "Tất cả phòng ban"}</Badge>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="text-muted">Điểm TB</div>
                            <div
                                className="fs-3 fw-bold"
                                style={{
                                    color:
                                        kpi.avgScore >= THRESH_GOOD ? PALETTE.green :
                                            (kpi.avgScore >= THRESH_WARN ? PALETTE.yellow : PALETTE.red)
                                }}
                            >
                                {fmt2(kpi.avgScore)}
                            </div>
                            <div className="small text-muted">Median: {fmt2(kpi.medScore)}</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="text-muted">% Xếp loại A</div>
                            <div className="fs-3 fw-bold" style={{ color: PALETTE.blue }}>{kpi.aRate}%</div>
                            <div className="small text-muted">Trong phạm vi lọc</div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="text-muted">Khoảng thời gian</div>
                            <div className="fw-semibold">
                                {selectedMonth ? `Tháng ${selectedMonth}/${selectedYear}` : `Năm ${selectedYear}`}
                            </div>
                            <div className="small text-muted">Tổng quan kết quả</div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ====== HÀNG 1: Cột + Xu hướng ====== */}
            <Row className="g-3">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="fw-semibold d-flex justify-content-between align-items-center">
                            <span>Điểm trung bình theo tiêu chí</span>
                            {/* Toggle tiêu chí */}
                            <div className="d-flex gap-2">
                                {[
                                    { key: "cc", label: "CC" },
                                    { key: "hq", label: "HQ" },
                                    { key: "kn", label: "KN" },
                                    { key: "td", label: "TD" },
                                    { key: "cd", label: "CD" },
                                ].map((c, idx) => (
                                    <Form.Check
                                        key={c.key}
                                        type="switch"
                                        id={`sw-${c.key}`}
                                        label={c.label}
                                        checked={criteriaEnabled[c.key]}
                                        onChange={() => setCriteriaEnabled(s => ({ ...s, [c.key]: !s[c.key] }))}
                                        style={{ color: CRITERIA_COLORS[idx] }}
                                    />
                                ))}
                            </div>
                        </Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            {isEmpty || avgCriteria.length === 0 ? (
                                <div className="text-center text-muted pt-5">Không có dữ liệu phù hợp bộ lọc</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={avgCriteria}>
                                        <defs>
                                            {avgCriteria.map((c, i) => (
                                                <linearGradient key={i} id={`grad-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={c.color} stopOpacity={0.95} />
                                                    <stop offset="100%" stopColor={c.color} stopOpacity={0.65} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[SCORE_MIN, SCORE_MAX]} />
                                        <Tooltip content={<NiceTooltip unit="" />} />
                                        <Legend />
                                        <ReferenceLine y={THRESH_GOOD} stroke={PALETTE.green} strokeDasharray="4 3" label="Tốt" />
                                        <ReferenceLine y={THRESH_WARN} stroke={PALETTE.yellow} strokeDasharray="4 3" label="Cảnh báo" />
                                        <Bar dataKey="value" name="Điểm TB">
                                            {avgCriteria.map((_, i) => (
                                                <Cell key={i} fill={`url(#grad-bar-${i})`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>


                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="fw-semibold">Tỷ lệ xếp loại</Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            {isEmpty ? (
                                <div className="text-center text-muted pt-5">Không có dữ liệu phù hợp bộ lọc</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={gradePie}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            label={(e) => `${e.name}: ${e.value}`}
                                        >
                                            {gradePie.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<NiceTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ====== HÀNG 2: Pie + Stacked ====== */}
            <Row className="g-3 mt-1">
                {/* <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="fw-semibold">Xu hướng điểm trung bình theo tháng</Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            {isEmpty ? (
                                <div className="text-center text-muted pt-5">Không có dữ liệu phù hợp bộ lọc</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={monthlyTrend}>
                                        <defs>
                                            <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={PALETTE.blue} stopOpacity={0.35} />
                                                <stop offset="100%" stopColor={PALETTE.blue} stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis domain={[SCORE_MIN, SCORE_MAX]} />
                                        <Tooltip content={<NiceTooltip unit="" />} />
                                        <Legend />
                                        <ReferenceLine y={THRESH_GOOD} stroke={PALETTE.green} strokeDasharray="4 3" />
                                        <ReferenceLine y={THRESH_WARN} stroke={PALETTE.yellow} strokeDasharray="4 3" />
                                        <Area type="monotone" dataKey="avg" name="TB (area)" fill="url(#grad-area)" stroke={PALETTE.blue} />
                                        <Line type="monotone" dataKey="avg" name="TB (line)" stroke={PALETTE.orange} dot />
                                        <Brush dataKey="month" height={18} stroke={PALETTE.gray} travellerWidth={10} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col> */}

                <Col md={6}>
                    {/* <Card className="h-100">
                        <Card.Header className="fw-semibold">Phân bố xếp loại theo tháng</Card.Header>
                        <Card.Body style={{ height: 320 }}>
                            {isEmpty ? (
                                <div className="text-center text-muted pt-5">Không có dữ liệu phù hợp bộ lọc</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stackedByMonth}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip content={<NiceTooltip />} />
                                        <Legend />
                                        <Bar dataKey="A" stackId="x" name="A" fill={GRADE_COLORS.A} />
                                        <Bar dataKey="B" stackId="x" name="B" fill={GRADE_COLORS.B} />
                                        <Bar dataKey="C" stackId="x" name="C" fill={GRADE_COLORS.C} />
                                        <Bar dataKey="D" stackId="x" name="D" fill={GRADE_COLORS.D} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card> */}
                </Col>
            </Row>

            {/* ====== HÀNG 3: Radar + Top5 ====== */}
            <Row className="g-3 mt-1">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">Radar điểm theo nhân viên (bản mới nhất)</span>
                            <Form.Select
                                size="sm"
                                style={{ width: 280 }}
                                value={selectedNVId}
                                onChange={(e) => setSelectedNVId(e.target.value)}
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {nhanVienOptions.map((nv) => (
                                    <option key={nv.id} value={nv.id}>{nv.ho_ten}</option>
                                ))}
                            </Form.Select>
                        </Card.Header>
                        <Card.Body style={{ height: 340 }}>
                            {!radarData ? (
                                <div className="text-center text-muted pt-5">Chọn nhân viên để hiển thị radar</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis domain={[SCORE_MIN, SCORE_MAX]} />
                                        <Radar name="Điểm" dataKey="A" stroke={PALETTE.purple} fill={PALETTE.purple} fillOpacity={0.55} />
                                        <Legend />
                                        <Tooltip content={<NiceTooltip />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="h-100">
                        <Card.Header className="fw-semibold">Top 5 nhân viên (bản mới nhất trong phạm vi lọc)</Card.Header>
                        <Card.Body style={{ height: 340 }}>
                            {isEmpty || top5.length === 0 ? (
                                <div className="text-center text-muted pt-5">Chưa có dữ liệu xếp hạng</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={top5} layout="vertical" margin={{ }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[SCORE_MIN, SCORE_MAX]} />
                                        <YAxis type="category" dataKey="name" width={"90%"} />
                                        <Tooltip content={<NiceTooltip />} />
                                        <Legend />
                                        <Bar dataKey="score" name="Điểm">
                                            {top5.map((d, i) => (
                                                <Cell key={i} fill={colorByScore(d.score)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default DanhGiaCharts;
