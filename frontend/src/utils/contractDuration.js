// FE helpers cho thời hạn hợp đồng

export const nz = (v, d = "—") => (v === null || v === undefined ? d : v);

// YYYY-MM-DD -> Date
export const dFromYMD = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

// Date -> YYYY-MM-DD
export const toYMD = (dt) => {
    if (!dt) return "";
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

// parse "12", "12 tháng", "1 năm 6 tháng", "365 ngày", "P1Y2M10D", "Không thời hạn"
export const parseDurationFE = (label) => {
    if (!label) return { y: 0, m: 0, d: 0, indefinite: false, valid: false };
    const s = String(label).trim().toLowerCase();
    if (["không thời hạn", "khong thoi han", "indef", "indefinite", "permanent", "kth"].includes(s)) {
        return { y: 0, m: 0, d: 0, indefinite: true, valid: true };
    }
    const mIso = s.match(/^p(?:(\d+)y)?(?:(\d+)m)?(?:(\d+)d)?$/);
    if (mIso) {
        return { y: Number(mIso[1] || 0), m: Number(mIso[2] || 0), d: Number(mIso[3] || 0), indefinite: false, valid: true };
    }
    if (/^\d+$/.test(s)) return { y: 0, m: Number(s), d: 0, indefinite: false, valid: true };

    let y = 0, m = 0, d = 0;
    const tokens = [...s.matchAll(/(\d+)\s*(năm|nam|y|year|years|tháng|thang|m|month|months|ngày|ngay|d|day|days)/g)];
    for (const t of tokens) {
        const n = Number(t[1]); const u = t[2];
        if (["năm", "nam", "y", "year", "years"].includes(u)) y += n;
        else if (["tháng", "thang", "m", "month", "months"].includes(u)) m += n;
        else if (["ngày", "ngay", "d", "day", "days"].includes(u)) d += n;
    }
    const valid = y + m + d > 0;
    return { y, m, d, indefinite: false, valid };
};

// end = start + duration − 1 day
export const computeEndDateFE = (startYMD, durationLabel) => {
    const start = dFromYMD(startYMD);
    if (!start) return "";
    const { y, m, d, indefinite, valid } = parseDurationFE(durationLabel);
    if (!valid || indefinite) return "";
    const endExclusive = new Date(start.getFullYear() + y, start.getMonth() + m, start.getDate() + d);
    const end = new Date(endExclusive);
    end.setDate(endExclusive.getDate() - 1);
    return toYMD(end);
};
