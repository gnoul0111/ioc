/* ============================== 126 XÃ, PHƯỜNG — CHỈ TIÊU KHUÔN MỚI CỦA TỪNG ĐƠN VỊ TRONG XÃ ==============================
   Khai báo cho ctm-engine.js: 19 đơn vị của 4 trục trong mỗi xã/phường (DANG_XA_CATEGORIES, HDND_XA_CATEGORIES,
   UBND_XA_CATEGORIES, MTTQ_XA_CATEGORIES ở central-level.js) + màn ngoài của tài khoản xã/phường (tab Tất cả và từng trục).
   SỐ LIỆU của một xã, phường:
     · lấy thẳng từ số theo 126 xã, phường của đơn vị cấp Thành phố khi đã có (đảng viên, kết nạp — Ban Tổ chức; kiểm tra,
       kỷ luật — UBKT; vụ cháy — Ban Nội chính; kỳ họp, kiến nghị cử tri — HĐND xã, phường; hồ sơ một cửa — TT Phục vụ HCC;
       quỹ "Vì người nghèo", hộ cận nghèo, nhà Đại đoàn kết — Ban Tuyên giáo và CTXH; hội viên — các đoàn thể) nên hai nơi khớp nhau;
     · còn lại tính theo dân số, diện tích thật của xã, phường (ctm-xa.js), phân biệt phường / xã, nhiễu cố định theo tên.
   Kỳ báo cáo: 4 quý từ Quý 3/2025 (chính quyền địa phương hai cấp vận hành từ 01/7/2025).
   Đặt CTM_XA_ALL_TAB = false để bỏ tab "Tất cả" của tài khoản xã, phường (indicators.js, login.js, sidebar-org.js). */
const CTM_XA_ALL_TAB = true;
/* Tài khoản xã, phường chỉ xem số của chính mình — không xem bảng, hạng của 126 xã, phường (chốt 27/10/2026).
   Đặt true để hiện lại thẻ "So với 126 xã, phường" (khai báo cmp của từng đơn vị vẫn giữ nguyên bên dưới). */
const CTM_XA_SO_SANH = false;
const CTM_PER_XA = [['2026', 2], ['2026', 1], ['2025', 4], ['2025', 3]].map((x) => ({ id: x[0] + 'Q' + x[1], label: 'Quý ' + x[1] + '/' + x[0], short: 'Q' + x[1] + '/' + x[0].slice(2) }));

/* Xã, phường đang xem (currentXaId là số thứ tự trong wardNames(), login.js) */
function ctmCurrentXaUnit() {
  if (typeof currentXaId === 'undefined' || currentXaId == null) return null;
  const names = typeof wardNames === 'function' ? wardNames() : null;
  const nm = names ? names[Number(currentXaId)] : null;
  return nm ? ctmXaByName(nm) : null;
}
function ctmXaWord(ctx) { return ctx && ctx.xa && ctx.xa.k === 'X' ? 'xã' : 'phường'; }
/* Tên đơn vị trong danh mục ghi "phường" cho mọi nơi — đổi thành "xã" khi đang xem một xã */
function ctmXaLoc(s, ctx) { const w = ctmXaWord(ctx); return String(s == null ? '' : s).replace(/phường/g, w).replace(/Phường/g, w === 'xã' ? 'Xã' : 'Phường'); }
function ctmXaOf(u) { return (u.k === 'P' ? 'phường ' : 'xã ') + u.short; }

/* ---------- Bộ sinh số ---------- */
function ctmXr(id, k, u, pid) { return ctmRng(id + '|' + k + '|' + u.name + (pid ? '|' + pid : ''))(); }
const CX = {
  /* số theo xã, phường của một đơn vị cấp Thành phố (bảng "Theo 126 xã, phường" của đơn vị đó), cùng kỳ */
  city: (specId, ind, fixPid) => (u, pid) => {
    const s = CTM_SPECS[specId];
    if (!s) return null;
    const r = ctmXaRows(s, fixPid || pid, { xa: null }).find((x) => x.u.name === u.name);
    return r ? r[ind] : null;
  },
  /* theo quy mô: base mỗi kỳ trên 1.000 dân (by 'ds'), trên 1.000 hộ ('ho'), trên km² ('dt') hoặc mỗi đơn vị ('const');
     o.kx = [hệ số phường, hệ số xã]; o.s = độ lệch giữa các nơi; o.g = % tăng mỗi kỳ; o.q = hệ số mùa theo quý {1..4} */
  per: (base, o) => (u, pid, i, id, k) => {
    o = o || {};
    const by = o.by || 'ds', basis = by === 'const' ? 1 : by === 'dt' ? u.dt : (by === 'ho' ? u.ho : u.ds) / 1000;
    const kx = o.kx ? (u.k === 'P' ? o.kx[0] : o.kx[1]) : 1, s = o.s == null ? 0.25 : o.s, q = o.q ? o.q[pid.slice(-1)] || 1 : 1;
    return base * basis * kx * q * (1 + (ctmXr(id, k, u) - 0.5) * 2 * s) / Math.pow(1 + (o.g || 0) / 100, i) * (1 + (ctmXr(id, k, u, pid) - 0.5) * 0.06);
  },
  /* tỷ lệ %: base ± o.s điểm giữa các nơi, o.kx = [cộng thêm ở phường, ở xã], o.g = điểm tăng mỗi kỳ */
  rate: (base, o) => (u, pid, i, id, k) => {
    o = o || {};
    const kx = o.kx ? (u.k === 'P' ? o.kx[0] : o.kx[1]) : 0;
    const v = base + kx + (ctmXr(id, k, u) - 0.5) * 2 * (o.s == null ? 3 : o.s) - (o.g || 0) * i + (ctmXr(id, k, u, pid) - 0.5) * 0.6;
    return Math.max(o.min || 0, Math.min(o.max || 100, v));
  },
  /* số của Trung tâm Phục vụ HCC cho đúng xã, phường (hcc-data.js: hccUnits, cùng mã kỳ '2026Q2'…); chưa nạp HCC thì dùng `fb` */
  hcc: (f, fb) => (u, pid, i, id, k) => {
    if (typeof hccUnits === 'function') {
      const r = hccUnits().find((x) => x.name === u.name), o = r && r.v[pid];
      if (o) { const v = f(o); if (v != null && isFinite(v)) return v; }
    }
    return fb ? fb(u, pid, i, id, k) : null;
  },
  fix: (arr) => (u, pid, i) => arr[i],
  /* tỷ lệ % theo số từng xã, phường của Sở Y tế (syt-config.js: SYT_UNITS, theo tháng năm 2026) — nguồn chính đã chốt 12/10/2026:
     quý 2026 lấy tháng cuối quý (Quý 1 → tháng 3, Quý 2 → tháng 6); quý 2025 chưa có số tháng nên suy theo xu hướng tháng 1–6/2026 của chính xã đó */
  syt: (field) => (u, pid) => {
    if (typeof SYT_UNITS === 'undefined') return null;
    const s = SYT_UNITS.find((x) => x.ten === u.name);
    if (!s || !s.dan || !s[field]) return null;
    const r = (m) => s[field][m] / s.dan * 100, sl = (r(5) - r(0)) / 5;
    return { '2026Q2': r(5), '2026Q1': r(2), '2025Q4': r(0) - sl, '2025Q3': r(0) - 4 * sl }[pid];
  }
};

/* ---------- Khai báo một đơn vị cấp xã ----------
   ctmXaUnit({ id, role, name, org, m: { khóa: [nhãn, đơn vị, số lẻ, bộ sinh số, 'cờ', nhãn ngắn] | { l, u, d, f: (D, u, pid, i) => số } },
               kpis, groups (như ctmMake), cmp: [khóa | { m, tot, better, l }] — chỉ tiêu so với 126 xã, phường, card, note }) */
function ctmXaUnit(def) {
  const periods = def.periods || CTM_PER_XA, metrics = {}, gens = {}, comp = [];
  Object.keys(def.m).forEach((k) => {
    const x = def.m[k];
    if (Array.isArray(x)) {
      const fl = x[4] || '';
      metrics[k] = { l: x[0], u: x[1], d: x[2] || 0, short: x[5], inv: fl.indexOf('i') >= 0, neutral: fl.indexOf('n') >= 0, ck: fl.indexOf('k') >= 0, td: fl.indexOf('t') >= 0, plan: fl.indexOf('p') >= 0 };
      gens[k] = x[3];
    } else {
      metrics[k] = { l: x.l, u: x.u, d: x.d || 0, short: x.short, inv: !!x.inv, neutral: !!x.neutral, ck: !!x.ck, td: !!x.td, plan: !!x.plan };
      comp.push([k, x]);
    }
  });
  const data = (pid, ctx) => {
    const u = ctx && ctx.xa, i = periods.findIndex((p) => p.id === pid);
    if (!u || i < 0) return null;
    const D = {};
    Object.keys(gens).forEach((k) => {
      const g = gens[k];
      let v = null;
      try { v = typeof g === 'function' ? g(u, pid, i, def.id, k) : Array.isArray(g) ? g[i] : g; } catch (e) { v = null; }
      D[k] = v == null || !isFinite(v) ? null : ctmRound(v, metrics[k].d);
    });
    comp.forEach(([k, x]) => {
      let v = null;
      try { v = x.sum ? x.sum.reduce((s, p) => (s == null || D[p] == null ? null : s + D[p]), 0) : x.f(D, u, pid, i); } catch (e) { v = null; }
      D[k] = v == null || !isFinite(v) ? null : ctmRound(v, x.d || 0);
    });
    return D;
  };
  const grpOf = (k) => (def.groups || []).find((g) => (g.lines || []).indexOf(k) >= 0);
  const cmp = (CTM_XA_SO_SANH ? def.cmp || [] : []).map((c) => (typeof c === 'string' ? { m: c } : c));
  const kpis = (def.kpis || []).map((k) => {
    const o = Array.isArray(k) ? { m: k[0], sub: k[1] } : typeof k === 'string' ? { m: k } : Object.assign({}, k);
    if (typeof o.sub === 'string') { const s = o.sub; o.sub = () => s; }
    if (!o.target) { const g = grpOf(o.m); o.target = g ? 'g:' + g.id : cmp.some((c) => c.m === o.m) ? 'xa:' + o.m : ''; }
    return o;
  });
  const spec = {
    id: def.id, role: def.role, level: 'xa',
    name: (ctx) => ctmXaLoc(def.name, ctx),
    org: (ctx) => (ctx && ctx.xa ? ctmXaLoc(def.org, ctx) + ' ' + ctmXaOf(ctx.xa) : ''),
    periods: periods, kind: 'quý', cmpRef: 'quý trước', data: data, metrics: metrics, kpis: kpis, groups: def.groups || [], card: def.card,
    note: def.note || 'kỳ báo cáo là quý; số phát sinh, số lũy kế so cùng kỳ năm trước, số tại thời điểm so quý liền trước. Chính quyền địa phương hai cấp vận hành từ 01/7/2025 nên có số từ Quý 3/2025 và chưa có số cùng kỳ năm trước.' + (CTM_XA_SO_SANH ? ' Bấm "So với 126 xã, phường" để xem vị trí của đơn vị trong toàn Thành phố.' : '')
  };
  if (cmp.length) {
    spec.xa = {
      label: 'So với 126 xã, phường',
      cardRows: ['Vị trí của đơn vị trong 126 xã, phường theo từng chỉ tiêu', 'Mức chung Thành phố, nơi cao nhất, thấp nhất', 'Hồ sơ từng xã, phường: dân số, diện tích, các chỉ tiêu và hạng', 'Lọc phường / xã, tìm theo tên'],
      inds: cmp.map((c) => {
        const m = metrics[c.m] || {};
        return { id: c.m, l: c.l || m.l, u: m.u, d: m.d, better: c.better || (m.inv ? 'low' : m.neutral ? 'none' : 'high'), tot: !!c.tot, w: c.w, minW: c.minW, rank: c.rank, v: (r) => r[c.m] };
      }),
      rows: (pid) => CTM_XA.map((u) => Object.assign({ u: u }, ctmD(spec, pid, { xa: u }) || {})),
      note: def.xaNote || 'Tên, loại (phường hay xã), dân số và diện tích của 126 xã, phường là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025. Mỗi xã, phường tính cùng một cách nên so sánh được với nhau.'
    };
  }
  return ctmRegister(spec);
}

/* Loại "Theo dõi nhiệm vụ" của xã, phường: 6 trạng thái, số lũy kế theo quy mô dân số. base = số của một xã, phường cỡ trung bình (70.000 dân) ở Quý 2/2026 */
function ctmXaTask(def) {
  const m = {};
  CTM_TASK_ST.forEach((s, si) => {
    const g = si === 3 || si === 4 ? 22 : si === 5 ? 10 : 6;
    m[s[0]] = [s[1], 'nhiệm vụ', 0, (u, pid, i, id, k) => def.base[si] * Math.sqrt(u.ds / 70000) * (0.75 + 0.5 * ctmXr(id, k, u)) / Math.pow(1 + g / 100, i), si === 5 ? 'i' : 'n', s[1]];
  });
  m.tong = { l: 'Tổng nhiệm vụ đang theo dõi', short: 'Tổng nhiệm vụ', u: 'nhiệm vụ', sum: CTM_TASK_ST.map((s) => s[0]) };
  m.xong = { l: 'Đã hoàn thành, kết thúc', short: 'Hoàn thành, kết thúc', u: 'nhiệm vụ', sum: ['ht', 'kt'] };
  m.dang = { l: 'Đang xử lý (mới tạo, chờ phê duyệt, xin gia hạn)', short: 'Đang xử lý', u: 'nhiệm vụ', neutral: true, sum: ['moi', 'cho', 'gh'] };
  m.htR = { l: 'Tỷ lệ hoàn thành', short: 'Tỷ lệ hoàn thành, kết thúc', u: '%', d: 1, f: (D) => (D.tong ? (D.ht + D.kt) / D.tong * 100 : null) };
  m.thR = { l: 'Tỷ lệ thu hồi', u: '%', d: 1, inv: true, f: (D) => (D.tong ? D.th / D.tong * 100 : null) };
  return ctmTd(ctmXaUnit({
    id: def.id, role: def.role, name: def.name, org: def.org, m: m,
    kpis: [['tong', 'nhiệm vụ đang theo dõi'], ['xong', 'hoàn thành, kết thúc'], ['htR', 'trên tổng nhiệm vụ'], ['moi', 'mới tạo'], ['cho', 'chờ phê duyệt'], ['gh', 'xin gia hạn'], ['th', 'nhiệm vụ bị thu hồi'], ['thR', 'trên tổng nhiệm vụ']],
    card: ['tong', 'xong', 'htR', 'cho'],
    groups: [{ id: 'nv', label: 'Nhiệm vụ', note: 'Nhiệm vụ theo 6 trạng thái của hệ thống theo dõi nhiệm vụ', lines: ['tong', 'xong', 'dang', 'th'], parts: ['tong', CTM_TASK_ST.map((s) => s[0]), 'Nhiệm vụ theo trạng thái'], rates: [['htR', 'thR'], 'Tỷ lệ hoàn thành, thu hồi'] }],
    cmp: [{ m: 'htR', w: 'tong' }, { m: 'tong', tot: true }],
    note: 'kỳ báo cáo là quý, số nhiệm vụ lũy kế đến cuối quý theo hệ thống theo dõi nhiệm vụ (số tại thời điểm), so với quý liền trước.'
  }));
}

/* ============================== ĐẢNG ỦY XÃ, PHƯỜNG ============================== */
ctmXaTask({ id: 'dangxa-vpdu', role: 'DANG', name: 'Văn phòng Đảng ủy phường', org: 'Đảng ủy', base: [3, 7, 1, 41, 9, 2] });
ctmXaUnit({
  id: 'dangxa-tochuc', role: 'DANG', name: 'Công tác tổ chức xây dựng Đảng', org: 'Đảng ủy',
  m: {
    dv: ['Tổng số đảng viên', 'đảng viên', 0, CX.city('dang-to-chuc', 'dv'), '', 'Tổng số đảng viên'],
    dvDb: { l: 'Đảng viên dự bị', short: 'Dự bị', u: 'đảng viên', neutral: true, f: (D, u) => D.dv * (0.034 + 0.016 * ctmXr('dangxa-tochuc', 'db', u)) },
    dvCt: { l: 'Đảng viên chính thức', short: 'Chính thức', u: 'đảng viên', f: (D) => D.dv - D.dvDb },
    dvNu: ['Đảng viên nữ', '%', 1, CX.rate(41, { s: 3 })],
    dvTre: ['Đảng viên dưới 35 tuổi', '%', 1, CX.rate(14.6, { s: 4, kx: [1.2, -1.2], g: 0.1 })],
    cb: { l: 'Chi bộ trực thuộc', u: 'chi bộ', neutral: true, f: (D, u) => D.dv / (34 + 8 * ctmXr('dangxa-tochuc', 'cb', u)) },
    cbKdc: { l: 'Chi bộ khu dân cư, thôn, tổ dân phố', short: 'Khu dân cư, thôn, tổ dân phố', u: 'chi bộ', f: (D, u) => D.cb * (u.k === 'P' ? 0.64 : 0.72) },
    cbTh: { l: 'Chi bộ trường học, trạm y tế', short: 'Trường học, trạm y tế', u: 'chi bộ', f: (D) => D.cb * 0.19 },
    cbKhac: { l: 'Chi bộ cơ quan, doanh nghiệp, công an, quân sự', short: 'Cơ quan, doanh nghiệp, công an, quân sự', u: 'chi bộ', f: (D) => D.cb - D.cbKdc - D.cbTh },
    knm: ['Kết nạp đảng viên mới', 'đảng viên', 0, CX.city('dang-to-chuc', 'knm'), '', 'Kết nạp mới'],
    den: { l: 'Chuyển sinh hoạt đảng đến', short: 'Chuyển đến', u: 'đảng viên', neutral: true, f: (D, u, pid) => D.dv * (0.0028 + 0.002 * ctmXr('dangxa-tochuc', 'den', u, pid)) },
    di: { l: 'Chuyển sinh hoạt đảng đi', short: 'Chuyển đi', u: 'đảng viên', neutral: true, f: (D, u, pid) => D.dv * (0.0026 + 0.002 * ctmXr('dangxa-tochuc', 'di', u, pid)) },
    tt: { l: 'Từ trần, xóa tên, khai trừ', short: 'Từ trần, xóa tên, khai trừ', u: 'đảng viên', neutral: true, f: (D, u, pid) => D.dv * (0.0018 + 0.0012 * ctmXr('dangxa-tochuc', 'tt', u, pid)) },
    bd: { l: 'Biến động thuần trong quý', short: 'Tăng thuần', u: 'đảng viên', neutral: true, f: (D) => D.knm + D.den - D.di - D.tt },
    ht: ['Đảng viên hoàn thành tốt nhiệm vụ trở lên (kỳ đánh giá gần nhất)', '%', 1, CX.city('dang-to-chuc', 'ht'), '', 'Đảng viên hoàn thành tốt trở lên'],
    xs: ['Đảng viên hoàn thành xuất sắc nhiệm vụ', '%', 1, CX.rate(18, { s: 4 })],
    khong: ['Đảng viên không hoàn thành nhiệm vụ', '%', 1, CX.rate(0.5, { s: 0.4 }), 'i'],
    dvpc: { l: 'Đảng viên trên 1.000 dân', u: 'đảng viên', d: 1, f: (D, u) => D.dv / u.ds * 1000 }
  },
  kpis: [['dv', 'đảng viên, cuối quý'], ['dvDb', 'đảng viên dự bị'], ['cb', 'chi bộ trực thuộc'], ['knm', 'đảng viên trong quý'], ['bd', 'kết nạp + chuyển đến − chuyển đi − từ trần'], ['dvTre', 'trên tổng số đảng viên'], ['ht', 'kỳ đánh giá gần nhất'], ['dvpc', 'mức chung Thành phố khoảng 34']],
  card: ['dv', 'cb', 'knm', 'ht'],
  groups: [
    { id: 'dv', label: 'Đảng viên', note: 'Số lượng, cơ cấu đảng viên cuối quý', lines: ['dv', 'dvCt', 'dvDb', 'dvNu', 'dvTre'], parts: ['dv', ['dvCt', 'dvDb'], 'Đảng viên chính thức, dự bị'] },
    { id: 'tc', label: 'Chi bộ trực thuộc', note: 'Chi bộ trực thuộc Đảng ủy theo loại hình', lines: ['cb', 'cbKdc', 'cbTh', 'cbKhac'], parts: ['cb', ['cbKdc', 'cbTh', 'cbKhac'], 'Chi bộ theo loại hình'] },
    { id: 'bd', label: 'Kết nạp và biến động', note: 'Kết nạp đảng viên mới, chuyển sinh hoạt, từ trần, xóa tên trong quý', lines: ['knm', 'den', 'di', 'tt', 'bd'], table: [null, ['knm', 'den', 'di', 'tt'], 'Biến động đảng viên trong quý', 'Nội dung'] },
    { id: 'dg', label: 'Đánh giá, xếp loại', note: 'Kết quả đánh giá chất lượng đảng viên kỳ gần nhất', lines: ['ht', 'xs', 'khong'] }
  ],
  cmp: ['dvpc', { m: 'dv', tot: true }, { m: 'knm', tot: true }, { m: 'ht', w: 'dv' }, { m: 'dvTre', w: 'dv' }]
});
ctmXaUnit({
  id: 'dangxa-kiemtra', role: 'DANG', name: 'Công tác kiểm tra, giám sát', org: 'Ủy ban Kiểm tra Đảng ủy',
  m: {
    /* kiểm tra, giám sát của Đảng ủy, Ủy ban Kiểm tra: cùng số với UBKT Thành ủy (số công bố cả Thành phố nhỏ nên mỗi xã chỉ vài
       trường hợp mỗi quý); giám sát thường xuyên của chi bộ đối với đảng viên diễn ra hằng tháng nên nhiều hơn hẳn */
    dv: ['Tổng số đảng viên', 'đảng viên', 0, CX.city('dang-to-chuc', 'dv'), 'n'],
    gsCb: { l: 'Đảng viên được chi bộ giám sát thường xuyên', short: 'Chi bộ giám sát thường xuyên', u: 'đảng viên', f: (D, u, pid) => D.dv * (0.05 + 0.03 * ctmXr('dangxa-kiemtra', 'gscb', u, pid)) },
    gsR: { l: 'Đảng viên được giám sát trong quý', u: '%', d: 1, f: (D) => (D.dv ? D.gsCb / D.dv * 100 : null) },
    cbKt: { l: 'Chi bộ được Đảng ủy kiểm tra, giám sát', short: 'Chi bộ được kiểm tra, giám sát', u: 'chi bộ', f: (D, u, pid) => D.dv / 38 * (0.12 + 0.08 * ctmXr('dangxa-kiemtra', 'cbkt', u, pid)) },
    kt: ['Đảng viên được Đảng ủy, Ủy ban Kiểm tra kiểm tra, giám sát', 'đảng viên', 0, CX.city('dang-ubkt', 'kt'), '', 'Đảng ủy, Ủy ban Kiểm tra kiểm tra'],
    cuoc: { l: 'Cuộc kiểm tra, giám sát', short: 'Cuộc kiểm tra, giám sát', u: 'cuộc', f: (D) => Math.max(1, D.kt / 5.5) },
    dh: { l: 'Đảng viên được kiểm tra khi có dấu hiệu vi phạm', short: 'Kiểm tra khi có dấu hiệu vi phạm', u: 'đảng viên', neutral: true, f: (D, u, pid) => D.kt * (0.08 + 0.08 * ctmXr('dangxa-kiemtra', 'dh', u, pid)) },
    vp: { l: 'Đảng viên kết luận có vi phạm', short: 'Kết luận có vi phạm', u: 'đảng viên', inv: true, f: (D, u, pid) => D.dh * (0.6 + 0.3 * ctmXr('dangxa-kiemtra', 'vp', u, pid)) },
    kl: ['Đảng viên bị thi hành kỷ luật', 'đảng viên', 0, CX.city('dang-ubkt', 'kl'), 'i', 'Bị thi hành kỷ luật'],
    tcd: ['Chi bộ được kiểm tra tài chính đảng', 'chi bộ', 0, CX.per(0.045, { s: 0.3 })],
    /* tiền ghi tỷ đồng như cấp Thành phố; giá trị một xã dưới 1 tỷ nên 2 số lẻ (quy tắc H4) */
    dp: ['Đảng phí thu nộp', 'tỷ đồng', 2, (u, pid, i, id, k) => CX.per(4.0, { s: 0.2, kx: [1.15, 0.85] })(u, pid, i, id, k) / 1000, 'n'],
    ktpc: { l: 'Đảng viên được kiểm tra, giám sát trên 10.000 dân', u: 'đảng viên', d: 1, f: (D, u) => D.kt / u.ds * 10000 }
  },
  kpis: [['gsCb', 'trong quý'], ['gsR', 'trên tổng số đảng viên'], ['cbKt', 'trong quý'], ['kt', 'trong quý'], ['dh', 'trong quý'], ['kl', 'trong quý'], ['dp', 'trong quý'], ['tcd', 'trong quý']],
  card: ['gsCb', 'cbKt', 'kt', 'kl'],
  groups: [
    { id: 'gs', label: 'Giám sát của chi bộ', note: 'Chi bộ giám sát thường xuyên đảng viên', lines: ['gsCb', 'gsR'] },
    { id: 'kt', label: 'Kiểm tra, giám sát của Đảng ủy', note: 'Kiểm tra, giám sát của Đảng ủy và Ủy ban Kiểm tra (cùng số với Ủy ban Kiểm tra Thành ủy)', lines: ['kt', 'dh', 'vp', 'cbKt', 'cuoc'] },
    { id: 'kl', label: 'Thi hành kỷ luật', note: 'Đảng viên bị thi hành kỷ luật', lines: ['kl'] },
    { id: 'tc', label: 'Tài chính đảng', note: 'Kiểm tra tài chính đảng, thu nộp đảng phí', lines: ['dp', 'tcd'] }
  ],
  cmp: [{ m: 'gsR', w: 'dv' }, 'ktpc', { m: 'kt', tot: true }, { m: 'kl', tot: true, better: 'low' }]
});
ctmXaUnit({
  id: 'dangxa-tuyengiao', role: 'DANG', name: 'Tuyên giáo và Dân vận phường', org: 'Ban Tuyên giáo và Dân vận Đảng ủy',
  m: {
    mh: ['Mô hình “Dân vận khéo” đăng ký', 'mô hình', 0, CX.city('dang-tuyen-giao', 'mh'), '', 'Mô hình đăng ký'],
    mhBd: { l: 'Mô hình được biểu dương, khen thưởng', short: 'Được biểu dương', u: 'mô hình', f: (D, u) => D.mh * (0.1 + 0.08 * ctmXr('dangxa-tuyengiao', 'bd', u)) },
    hn: ['Buổi học tập, quán triệt nghị quyết, chỉ thị', 'buổi', 0, CX.per(0.1, { s: 0.3, by: 'ds', q: { 1: 0.8, 2: 1, 3: 1.2, 4: 0.6 } }), '', 'Buổi học tập, quán triệt'],
    hnR: ['Đảng viên tham gia học tập', '%', 1, CX.rate(94.5, { s: 2.5, max: 99.6 })],
    dl: ['Ý kiến dư luận xã hội thu thập', 'ý kiến', 0, CX.per(2.2, { s: 0.3, g: 2 }), 'n', 'Ý kiến thu thập'],
    dt: ['Đồng tình với chủ trương, chính sách', '%', 1, CX.city('dang-tuyen-giao', 'dt')],
    tb: ['Tin, bài trên trang thông tin của Đảng ủy', 'tin bài', 0, CX.per(0.8, { s: 0.35, g: 3 }), '', 'Tin, bài tuyên truyền'],
    mhpc: { l: 'Mô hình “Dân vận khéo” trên 10.000 dân', u: 'mô hình', d: 1, f: (D, u) => D.mh / u.ds * 10000 }
  },
  kpis: [['mh', 'lũy kế đến cuối quý'], ['mhBd', 'lũy kế'], ['hn', 'trong quý'], ['hnR', 'trên tổng số đảng viên'], ['dl', 'trong quý'], ['dt', 'trên ý kiến thu thập'], ['tb', 'trong quý'], ['mhpc', 'lũy kế']],
  card: ['mh', 'hn', 'dt'],
  groups: [
    { id: 'dv', label: 'Dân vận khéo', note: 'Mô hình “Dân vận khéo” đăng ký, được biểu dương', lines: ['mh', 'mhBd'] },
    { id: 'hn', label: 'Học tập nghị quyết', note: 'Học tập, quán triệt nghị quyết, chỉ thị', lines: ['hn', 'hnR'] },
    { id: 'dl', label: 'Dư luận, tuyên truyền', note: 'Nắm bắt dư luận xã hội; tin, bài tuyên truyền', lines: ['dl', 'tb', 'dt'] }
  ],
  cmp: ['mhpc', 'dt', { m: 'mh', tot: true }]
});

/* ============================== HĐND XÃ, PHƯỜNG ============================== */
ctmXaTask({ id: 'hdndxa-nhiemvu', role: 'HDND', name: 'HĐND phường · Theo dõi nhiệm vụ', org: 'HĐND', base: [1, 3, 0, 14, 3, 1] });
ctmXaUnit({
  id: 'hdndxa-tiepxuc', role: 'HDND', name: 'Tiếp xúc cử tri', org: 'HĐND',
  m: {
    hn: ['Hội nghị tiếp xúc cử tri', 'hội nghị', 0, CX.per(2.4, { by: 'const', kx: [1, 1.2], s: 0.3, q: { 1: 0.4, 2: 1.4, 3: 1, 4: 1.3 } }), '', 'Hội nghị tiếp xúc cử tri'],
    ct: ['Ý kiến, kiến nghị cử tri tiếp nhận', 'kiến nghị', 0, CX.city('hdnd-xa-phuong', 'ct'), 'n', 'Kiến nghị tiếp nhận'],
    ctR: ['Kiến nghị cử tri đã giải quyết', '%', 1, CX.city('hdnd-xa-phuong', 'ctR')],
    ctGq: { l: 'Kiến nghị cử tri đã giải quyết', short: 'Đã giải quyết', u: 'kiến nghị', f: (D) => D.ct * D.ctR / 100 },
    ctDang: { l: 'Kiến nghị đang giải quyết', short: 'Đang giải quyết', u: 'kiến nghị', neutral: true, f: (D) => D.ct - D.ctGq },
    /* kiến nghị cử tri: nhiều hay ít không tự thân tốt/xấu — trung tính (quy tắc H18, chốt 12/10/2026) */
    ctpc: { l: 'Kiến nghị cử tri trên 100.000 dân', u: 'kiến nghị', d: 1, neutral: true, f: (D, u) => D.ct / u.ds * 100000 }
  },
  kpis: [['hn', 'trong quý'], ['ct', 'trong quý'], ['ctGq', 'trong quý'], ['ctR', 'trên kiến nghị tiếp nhận'], ['ctDang', 'chuyển sang quý sau'], ['ctpc', 'trong quý']],
  card: ['hn', 'ct', 'ctR'],
  groups: [
    { id: 'hn', label: 'Hội nghị tiếp xúc', note: 'Hội nghị tiếp xúc cử tri của đại biểu HĐND', lines: ['hn'] },
    { id: 'ct', label: 'Kiến nghị cử tri', note: 'Ý kiến, kiến nghị cử tri và kết quả giải quyết', lines: ['ct', 'ctGq', 'ctDang', 'ctR'], parts: ['ct', ['ctGq', 'ctDang'], 'Kết quả giải quyết'] }
  ],
  cmp: [{ m: 'ctR', w: 'ct', minW: 10 }, 'ctpc', { m: 'ct', tot: true, better: 'none' }]
});
ctmXaUnit({
  id: 'hdndxa-giamsat', role: 'HDND', name: 'Giám sát chuyên đề', org: 'HĐND',
  m: {
    gs: ['Cuộc giám sát của HĐND', 'cuộc', 0, CX.city('hdnd-xa-phuong', 'gs'), '', 'Cuộc giám sát'],
    kh: ['Kỳ họp HĐND tổ chức', 'kỳ họp', 0, CX.city('hdnd-xa-phuong', 'kh'), 'n', 'Kỳ họp'],
    nq: ['Nghị quyết HĐND ban hành', 'nghị quyết', 0, CX.city('hdnd-xa-phuong', 'nq'), 'n', 'Nghị quyết ban hành'],
    kn: { l: 'Kiến nghị sau giám sát', short: 'Kiến nghị sau giám sát', u: 'kiến nghị', neutral: true, f: (D, u, pid) => D.gs * (2.8 + 1.4 * ctmXr('hdndxa-giamsat', 'kn', u, pid)) },
    knR: ['Kiến nghị sau giám sát đã thực hiện', '%', 1, CX.rate(78, { s: 8, g: -0.8 }), '', 'Đã thực hiện']
  },
  kpis: [['gs', 'trong quý'], ['kn', 'trong quý'], ['knR', 'trên kiến nghị sau giám sát'], ['kh', 'trong quý'], ['nq', 'trong quý']],
  card: ['gs', 'kh', 'nq'],
  groups: [
    { id: 'gs', label: 'Giám sát', note: 'Giám sát chuyên đề và kiến nghị sau giám sát', lines: ['gs', 'kn', 'knR'] },
    { id: 'kh', label: 'Kỳ họp, nghị quyết', note: 'Kỳ họp HĐND và nghị quyết ban hành', lines: ['nq', 'kh'] }
  ],
  cmp: [{ m: 'gs', tot: true }, { m: 'nq', tot: true }, { m: 'knR', w: 'kn', minW: 5 }]
});
ctmXaUnit({
  id: 'hdndxa-ngansach', role: 'HDND', name: 'Thẩm tra ngân sách phường', org: 'Ban Kinh tế - Ngân sách HĐND',
  m: {
    /* dự toán chi: 6 tháng cuối năm 2025 (từ 01/7/2025) và cả năm 2026, khoảng 2,2 triệu đồng/người/năm */
    dt: ['Dự toán chi ngân sách', 'tỷ đồng', 1, (u, pid, i, id, k) => u.ds * (pid.indexOf('2026') === 0 ? 2.2e-3 : 1.05e-3) * (u.k === 'P' ? 1.05 : 0.95) * (0.85 + 0.3 * ctmXr(id, k, u)), 'n'],
    thR: ['Thực hiện chi lũy kế so dự toán', '%', 1, (u, pid, i, id, k) => ({ '2026Q2': 43, '2026Q1': 18, '2025Q4': 96, '2025Q3': 41 }[pid]) + (ctmXr(id, k, u, pid) - 0.5) * 8, 'k', 'Thực hiện so dự toán'],
    th: { l: 'Chi ngân sách thực hiện lũy kế', short: 'Thực hiện lũy kế', u: 'tỷ đồng', d: 1, neutral: true, ck: true, f: (D) => D.dt * D.thR / 100 },
    bc: ['Báo cáo, tờ trình ngân sách được thẩm tra', 'báo cáo', 0, CX.per(3, { by: 'const', s: 0.3, q: { 1: 0.5, 2: 1, 3: 0.8, 4: 2.2 } }), '', 'Báo cáo được thẩm tra'],
    dtpc: { l: 'Dự toán chi bình quân đầu người', u: 'nghìn đồng/người', d: 0, f: (D, u) => D.dt * 1e6 / u.ds }
  },
  kpis: [['dt', 'năm 2026 (Quý 3, 4/2025: 6 tháng cuối năm)'], ['th', 'lũy kế từ đầu năm'], ['thR', 'so dự toán'], ['bc', 'trong quý'], ['dtpc', 'theo dự toán']],
  card: ['dt', 'thR', 'bc'],
  groups: [
    { id: 'ns', label: 'Dự toán, thực hiện chi', note: 'Dự toán chi ngân sách và thực hiện lũy kế từ đầu năm', lines: ['dt', 'th', 'thR'], hint: () => 'Quý 3, Quý 4/2025 là ngân sách 6 tháng cuối năm 2025 của đơn vị hành chính mới.' },
    { id: 'tt', label: 'Thẩm tra', note: 'Báo cáo, tờ trình ngân sách được Ban thẩm tra', lines: ['bc'] }
  ],
  cmp: ['dtpc', { m: 'thR', w: 'dt' }, { m: 'dt', tot: true }]
});

/* ============================== UBND XÃ, PHƯỜNG ============================== */
ctmXaTask({ id: 'ubndxa-vp', role: 'UBND', name: 'Văn phòng UBND phường', org: 'UBND', base: [6, 12, 1, 58, 14, 3] });
ctmXaUnit({
  id: 'ubndxa-diachinh', role: 'UBND', name: 'Địa chính - Xây dựng - Đô thị - Môi trường', org: 'UBND',
  m: {
    gcn: ['Hồ sơ cấp giấy chứng nhận quyền sử dụng đất', 'hồ sơ', 0, CX.per(0.9, { kx: [0.75, 1.35] }), '', 'Cấp giấy chứng nhận'],
    bdd: ['Hồ sơ đăng ký biến động đất đai', 'hồ sơ', 0, CX.per(3.4, { kx: [1.2, 0.85] }), 'n', 'Đăng ký biến động'],
    vp: ['Vụ vi phạm trật tự xây dựng', 'vụ', 0, CX.per(0.16, { kx: [1.3, 0.7], s: 0.4 }), 'i', 'Vi phạm trật tự xây dựng'],
    vpR: ['Vụ vi phạm đã xử lý dứt điểm', '%', 1, CX.rate(86, { s: 7, g: -0.6 }), '', 'Đã xử lý dứt điểm'],
    /* phản ánh của người dân: trung tính — nhiều phản ánh có thể là người dân dùng kênh nhiều hơn (quy tắc H18, chốt 12/10/2026) */
    paNg: ['Phản ánh úng ngập', 'phản ánh', 0, CX.per(0.35, { kx: [1.3, 0.6], s: 0.5, q: { 1: 0.2, 2: 0.9, 3: 2.6, 4: 0.6 } }), 'n', 'Úng ngập'],
    paTd: ['Phản ánh tắc đường', 'phản ánh', 0, CX.per(0.55, { kx: [1.5, 0.4], s: 0.4 }), 'n', 'Tắc đường'],
    paMt: ['Phản ánh vệ sinh môi trường', 'phản ánh', 0, CX.per(0.9, { kx: [1.1, 0.9], s: 0.35 }), 'n', 'Vệ sinh môi trường'],
    paDt: ['Phản ánh trật tự đô thị', 'phản ánh', 0, CX.per(0.75, { kx: [1.4, 0.5], s: 0.35 }), 'n', 'Trật tự đô thị'],
    pa: { l: 'Phản ánh đô thị, môi trường, úng ngập, tắc đường', short: 'Phản ánh đô thị, môi trường', u: 'phản ánh', neutral: true, sum: ['paNg', 'paTd', 'paMt', 'paDt'] },
    papc: { l: 'Phản ánh trên 10.000 dân', u: 'phản ánh', d: 1, neutral: true, f: (D, u) => D.pa / u.ds * 10000 },
    vppc: { l: 'Vi phạm trật tự xây dựng trên 100.000 dân', short: 'Vi phạm xây dựng trên 100.000 dân', u: 'vụ', d: 1, inv: true, f: (D, u) => D.vp / u.ds * 100000 }
  },
  kpis: [['gcn', 'trong quý'], ['bdd', 'trong quý'], ['vp', 'phát hiện trong quý'], ['vpR', 'trên vụ phát hiện'], ['pa', 'trong quý'], ['paNg', 'trong quý'], ['papc', 'trong quý'], ['vppc', 'trong quý']],
  card: ['gcn', 'vp', 'pa'],
  groups: [
    { id: 'dd', label: 'Đất đai', note: 'Cấp giấy chứng nhận, đăng ký biến động đất đai', lines: ['bdd', 'gcn'] },
    { id: 'xd', label: 'Trật tự xây dựng', note: 'Vi phạm trật tự xây dựng và kết quả xử lý', lines: ['vp', 'vpR'] },
    { id: 'pa', label: 'Phản ánh đô thị, môi trường', note: 'Phản ánh của người dân về úng ngập, tắc đường, môi trường, trật tự đô thị', lines: ['pa', 'paNg', 'paTd', 'paMt', 'paDt'], parts: ['pa', ['paNg', 'paTd', 'paMt', 'paDt'], 'Phản ánh theo loại'], hint: () => 'Phản ánh úng ngập tăng mạnh vào mùa mưa (Quý 3).' }
  ],
  cmp: ['papc', 'vppc', { m: 'vpR', w: 'vp', minW: 5 }, { m: 'gcn', tot: true }]
});
ctmXaUnit({
  id: 'ubndxa-tuphap', role: 'UBND', name: 'Tư pháp - Hộ tịch', org: 'UBND',
  m: {
    ks: ['Đăng ký khai sinh', 'hồ sơ', 0, CX.per(3.3, { kx: [0.95, 1.08], s: 0.12 }), 'n'],
    kh: ['Đăng ký kết hôn', 'hồ sơ', 0, CX.per(1.6, { s: 0.15, q: { 1: 1.25, 2: 0.8, 3: 0.75, 4: 1.2 } }), 'n'],
    kt: ['Đăng ký khai tử', 'hồ sơ', 0, CX.per(1.45, { kx: [0.95, 1.1], s: 0.12, q: { 1: 1.15, 2: 0.95, 3: 0.9, 4: 1 } }), 'n'],
    ct: ['Chứng thực bản sao, chữ ký, hợp đồng', 'việc', 0, CX.per(46, { kx: [1.2, 0.85], s: 0.25, g: -2 }), 'n', 'Chứng thực'],
    ctTt: ['Chứng thực bản sao điện tử từ bản chính', '%', 1, CX.rate(38, { s: 8, g: 3, kx: [4, -4] }), '', 'Chứng thực điện tử'],
    kspc: { l: 'Khai sinh trên 1.000 dân (năm)', u: 'hồ sơ', d: 1, neutral: true, f: (D, u) => D.ks / u.ds * 4000 }
  },
  kpis: [['ks', 'trong quý'], ['kh', 'trong quý'], ['kt', 'trong quý'], ['ct', 'trong quý'], ['ctTt', 'trên việc chứng thực bản sao'], ['kspc', 'quy năm']],
  card: ['ks', 'kh', 'ct'],
  groups: [
    { id: 'ht', label: 'Hộ tịch', note: 'Đăng ký khai sinh, kết hôn, khai tử', lines: ['ks', 'kh', 'kt'], table: [null, ['ks', 'kh', 'kt'], 'Đăng ký hộ tịch trong quý', 'Loại việc'] },
    { id: 'ct', label: 'Chứng thực', note: 'Chứng thực bản sao, chữ ký, hợp đồng', lines: ['ct', 'ctTt'] }
  ],
  cmp: ['kspc', { m: 'ctTt', w: 'ct' }, { m: 'ct', tot: true }]
});
/* Bộ phận Một cửa: số của Trung tâm Phục vụ HCC cho đúng xã, phường này (cùng kỳ) */
const CTM_HCC_FB = (base, o) => CX.per(base, o);
ctmXaUnit({
  id: 'ubndxa-mocua', role: 'UBND', name: 'Bộ phận Một cửa - TTHC', org: 'Bộ phận Một cửa',
  m: {
    hs: ['Hồ sơ thủ tục hành chính tiếp nhận', 'hồ sơ', 0, CX.hcc((o) => o.hs, CTM_HCC_FB(95, { g: 3 })), 'n', 'Hồ sơ tiếp nhận'],
    gq: ['Hồ sơ đã giải quyết', 'hồ sơ', 0, CX.hcc((o) => o.gq, CTM_HCC_FB(92, { g: 3 })), 'n', 'Đã giải quyết'],
    tre: ['Hồ sơ giải quyết trễ hạn', 'hồ sơ', 0, CX.hcc((o) => o.tre, CTM_HCC_FB(0.9, { s: 0.6, g: -15 })), 'i', 'Giải quyết trễ hạn'],
    dhR: { l: 'Tỷ lệ giải quyết đúng hạn', short: 'Đúng hạn', u: '%', d: 2, f: (D) => (D.gq ? (D.gq - D.tre) / D.gq * 100 : null) },
    dxlt: ['Hồ sơ đang xử lý trễ hạn', 'hồ sơ', 0, CX.hcc((o) => o.dxlt, CTM_HCC_FB(0.5, { s: 0.6, g: -8 })), 'i', 'Đang xử lý trễ hạn'],
    shR: ['Tỷ lệ số hóa hồ sơ', '%', 1, CX.hcc((o) => (o.hs ? o.sh / o.hs * 100 : null), CX.rate(86, { s: 5, g: 2 })), '', 'Số hóa hồ sơ'],
    hlR: ['Tỷ lệ hài lòng', '%', 2, CX.hcc((o) => (o.dg ? (o.rhl + o.hl) / o.dg * 100 : null), CX.rate(97.5, { s: 1.5, max: 99.9 })), '', 'Hài lòng'],
    hspc: { l: 'Hồ sơ trên 1.000 dân', u: 'hồ sơ', d: 1, neutral: true, f: (D, u) => D.hs / u.ds * 1000 }
  },
  kpis: [['hs', 'trong quý'], ['gq', 'trong quý'], ['dhR', 'trên hồ sơ đã giải quyết'], ['tre', 'trong quý'], ['dxlt', 'cuối quý'], ['shR', 'hồ sơ số hóa khi tiếp nhận'], ['hlR', 'trên lượt đánh giá'], ['hspc', 'trong quý']],
  card: ['hs', 'dhR', 'shR', 'hlR'],
  groups: [
    { id: 'tn', label: 'Tiếp nhận, giải quyết', note: 'Hồ sơ tiếp nhận, giải quyết, trễ hạn — cùng số với Trung tâm Phục vụ hành chính công', lines: ['hs', 'gq', 'tre', 'dxlt', 'dhR'] },
    { id: 'cl', label: 'Số hóa, hài lòng', note: 'Số hóa hồ sơ khi tiếp nhận, mức độ hài lòng', lines: ['shR', 'hlR'] }
  ],
  cmp: [{ m: 'dhR', w: 'gq' }, { m: 'shR', w: 'hs' }, { m: 'hlR', w: 'hs' }, 'hspc', { m: 'hs', tot: true, better: 'high' }],
  xaNote: 'Số hồ sơ của từng xã, phường là số của Trung tâm Phục vụ hành chính công (cùng kỳ). Dân số, diện tích là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025.'
});
ctmXaUnit({
  id: 'ubndxa-vhxh', role: 'UBND', name: 'Văn hóa - Xã hội', org: 'UBND',
  m: {
    /* hộ cận nghèo: kết quả rà soát cuối năm 2025, cùng số với Ban Tuyên giáo và CTXH (MTTQ Thành phố); 126/126 xã, phường không còn hộ nghèo (số công bố) */
    cn: ['Hộ cận nghèo (rà soát cuối năm 2025)', 'hộ', 0, CX.city('mttq-quy', 'cn', '2025'), 'i', 'Hộ cận nghèo'],
    hn: ['Hộ nghèo', 'hộ', 0, CX.fix([0, 0, 0, 0]), 'i'],
    ncc: ['Người có công, thân nhân hưởng trợ cấp hằng tháng', 'người', 0, CX.per(15, { s: 0.2, g: -0.4 }), 'n', 'Người có công, thân nhân'],
    btxh: ['Đối tượng bảo trợ xã hội hưởng trợ cấp hằng tháng', 'người', 0, CX.per(21, { s: 0.2, kx: [0.85, 1.25], g: 0.5 }), 'n', 'Đối tượng bảo trợ xã hội'],
    kp: { l: 'Kinh phí chi trả trợ cấp trong quý', short: 'Kinh phí chi trả trợ cấp', u: 'tỷ đồng', d: 1, neutral: true, f: (D) => (D.ncc * 2.9 + D.btxh * 1.3) * 3 / 1000 },
    cnR: { l: 'Tỷ lệ hộ cận nghèo', u: '%', d: 2, inv: true, f: (D, u) => D.cn / u.ho * 100 },
    btpc: { l: 'Đối tượng bảo trợ xã hội trên 1.000 dân', u: 'người', d: 1, neutral: true, f: (D, u) => D.btxh / u.ds * 1000 }
  },
  kpis: [['cn', 'rà soát cuối năm 2025'], ['cnR', 'trên số hộ'], ['hn', '126/126 xã, phường không còn hộ nghèo'], ['ncc', 'cuối quý'], ['btxh', 'cuối quý'], ['kp', 'trong quý']],
  card: ['cn', 'ncc', 'btxh'],
  groups: [
    { id: 'gn', label: 'Giảm nghèo', note: 'Hộ nghèo, hộ cận nghèo theo kết quả rà soát', lines: ['cn', 'hn', 'cnR'] },
    { id: 'cs', label: 'Chính sách, an sinh', note: 'Người có công, đối tượng bảo trợ xã hội và kinh phí chi trả', lines: ['ncc', 'btxh', 'kp'] }
  ],
  cmp: [{ m: 'cn', tot: true, better: 'low' }, { m: 'cnR', w: (r) => r.u.ho }, 'btpc']
});
ctmXaUnit({
  id: 'ubndxa-yte', role: 'UBND', name: 'Trạm Y tế phường', org: 'Trạm Y tế',
  m: {
    kcb: ['Lượt khám, chữa bệnh', 'lượt', 0, CX.per(82, { kx: [0.9, 1.12], s: 0.2, q: { 1: 1.08, 2: 0.98, 3: 1.06, 4: 0.96 }, g: 1 }), 'n', 'Lượt khám, chữa bệnh'],
    tc: ['Trẻ dưới 1 tuổi tiêm chủng đầy đủ', '%', 1, CX.rate(97.8, { s: 1.2, max: 99.9 }), '', 'Tiêm chủng đầy đủ'],
    /* bảo hiểm y tế, hồ sơ sức khỏe điện tử: số của Sở Y tế cho đúng xã, phường (quy tắc H19); bảo hiểm y tế 2 số lẻ như Sở Y tế (H5) */
    bhyt: ['Người dân có thẻ bảo hiểm y tế', '%', 2, CX.syt('bhyt'), '', 'Bao phủ bảo hiểm y tế'],
    sxh: ['Ca mắc sốt xuất huyết', 'ca', 0, CX.per(0.14, { kx: [1.4, 0.6], s: 0.5, q: { 1: 0.15, 2: 0.35, 3: 2.2, 4: 1.3 } }), 'i', 'Sốt xuất huyết'],
    hsSk: ['Người dân có hồ sơ sức khỏe điện tử', '%', 1, CX.syt('hssk'), '', 'Hồ sơ sức khỏe điện tử'],
    kcbpc: { l: 'Lượt khám, chữa bệnh trên 1.000 dân', u: 'lượt', d: 1, neutral: true, f: (D, u) => D.kcb / u.ds * 1000 }
  },
  kpis: [['kcb', 'trong quý'], ['tc', 'trên trẻ trong độ tuổi'], ['bhyt', 'trên dân số'], ['sxh', 'trong quý'], ['hsSk', 'trên dân số'], ['kcbpc', 'trong quý']],
  card: ['kcb', 'tc', 'bhyt'],
  groups: [
    { id: 'kcb', label: 'Khám, chữa bệnh', note: 'Khám, chữa bệnh ban đầu tại Trạm Y tế', lines: ['kcb'] },
    { id: 'dp', label: 'Y tế dự phòng', note: 'Tiêm chủng, phòng chống dịch bệnh', lines: ['sxh', 'tc'], hint: () => 'Sốt xuất huyết tăng mạnh vào mùa mưa (Quý 3, Quý 4).' },
    { id: 'bh', label: 'Bảo hiểm, hồ sơ sức khỏe', note: 'Bao phủ bảo hiểm y tế, hồ sơ sức khỏe điện tử: số của Sở Y tế cho đúng xã, phường này, lấy tháng cuối quý (Quý 1 là tháng 3, Quý 2 là tháng 6)', lines: ['bhyt', 'hsSk'] }
  ],
  cmp: ['kcbpc', 'tc', 'bhyt', 'hsSk', { m: 'sxh', tot: true, better: 'low' }]
});
ctmXaUnit({
  id: 'ubndxa-anninh', role: 'UBND', name: 'Công an phường - An ninh trật tự', org: 'Công an',
  m: {
    antt: ['Vụ việc an ninh trật tự', 'vụ', 0, CX.per(0.28, { kx: [1.3, 0.75], s: 0.35, g: -1.5 }), 'i', 'Vụ việc an ninh trật tự'],
    pd: ['Vụ phạm pháp hình sự được điều tra làm rõ', '%', 1, CX.rate(86, { s: 6, g: 0.4 }), '', 'Điều tra làm rõ'],
    chay: ['Vụ cháy', 'vụ', 0, CX.city('dang-noi-chinh', 'chay'), 'i'],
    tngt: ['Vụ tai nạn giao thông', 'vụ', 0, CX.per(0.05, { kx: [0.8, 1.4], s: 0.5 }), 'i', 'Tai nạn giao thông'],
    mt: ['Vụ tệ nạn ma túy phát hiện', 'vụ', 0, CX.per(0.04, { kx: [1.2, 0.8], s: 0.5 }), 'n', 'Ma túy phát hiện'],
    kt: ['Cơ sở kinh doanh có điều kiện được kiểm tra', 'cơ sở', 0, CX.per(0.9, { kx: [1.4, 0.6], s: 0.3 }), '', 'Cơ sở được kiểm tra'],
    anpc: { l: 'Vụ việc an ninh trật tự trên 100.000 dân', u: 'vụ', d: 1, inv: true, f: (D, u) => D.antt / u.ds * 100000 }
  },
  kpis: [['antt', 'trong quý'], ['pd', 'trên vụ phạm pháp hình sự'], ['chay', 'trong quý'], ['tngt', 'trong quý'], ['mt', 'trong quý'], ['kt', 'trong quý'], ['anpc', 'trong quý']],
  card: ['antt', 'chay', 'tngt'],
  groups: [
    { id: 'an', label: 'An ninh trật tự', note: 'Vụ việc an ninh trật tự, phạm pháp hình sự, ma túy', lines: ['antt', 'mt', 'pd'] },
    { id: 'pc', label: 'Phòng cháy, giao thông', note: 'Cháy, tai nạn giao thông, kiểm tra cơ sở kinh doanh có điều kiện', lines: ['chay', 'tngt', 'kt'] }
  ],
  cmp: ['anpc', { m: 'pd', w: 'antt', minW: 5 }, { m: 'chay', tot: true, better: 'low' }]
});

/* ============================== ỦY BAN MTTQ XÃ, PHƯỜNG ============================== */
ctmXaTask({ id: 'mttqxa-nhiemvu', role: 'MTTQ', name: 'MTTQ phường · Theo dõi nhiệm vụ', org: 'Ủy ban MTTQ', base: [1, 2, 0, 11, 2, 1] });
/* Quỹ "Vì người nghèo" vận động tại cơ sở, lũy kế năm: số Thành phố theo quý (MTTQ Xã, Phường) × phần của xã, phường này trong
   92,8 tỷ đồng cả năm 2025 (Ban Tuyên giáo và CTXH) — Quý 4/2025 đúng bằng số cả năm 2025 của xã, phường đó. */
const CTM_QUY_TP_QUY = { '2026Q2': 38.6, '2026Q1': 14.2, '2025Q4': 92.8, '2025Q3': 61.4 };
const CTM_NHA_TP_QUY = { '2026Q2': 0.41, '2026Q1': 0.18, '2025Q4': 1, '2025Q3': 0.62 };
let CTM_TET_SHARE = null;
function ctmTetShare(u, tot) {
  if (!CTM_TET_SHARE) {
    const cn = CTM_XA.map((x) => CX.city('mttq-quy', 'cn', '2025')(x) || 0);
    CTM_TET_SHARE = { 5280: ctmShareInt(5280, CTM_XA.map((x, i) => cn[i] + x.ho * 0.002)), 5410: ctmShareInt(5410, CTM_XA.map((x, i) => cn[i] * 1.04 + x.ho * 0.002)) };
  }
  return CTM_TET_SHARE[tot][CTM_XA.indexOf(u)];
}
ctmXaUnit({
  id: 'mttqxa-quyvi', role: 'MTTQ', name: 'Vận động Quỹ vì người nghèo', org: 'Ủy ban MTTQ',
  m: {
    quy: ['Quỹ “Vì người nghèo” vận động (lũy kế năm)', 'tỷ đồng', 2, (u, pid) => { const q = CX.city('mttq-quy', 'q', '2025')(u); return q == null ? null : CTM_QUY_TP_QUY[pid] * q / 92800; }, 'k', 'Vận động lũy kế năm'],
    nha: ['Nhà Đại đoàn kết xây mới, sửa chữa (lũy kế năm)', 'căn', 0, (u, pid) => { const n = CX.city('mttq-quy', 'nha', '2025')(u); return n == null ? null : Math.round(n * CTM_NHA_TP_QUY[pid] * (pid.indexOf('2026') === 0 ? 1.05 : 1)); }, 'k', 'Nhà Đại đoàn kết'],
    tet: ['Suất quà Tết từ Quỹ Thành phố', 'suất', 0, (u, pid) => ctmTetShare(u, pid.indexOf('2026') === 0 ? 5280 : 5410), 'n', 'Suất quà Tết từ Quỹ Thành phố'],
    ho: { l: 'Hộ được hỗ trợ từ Quỹ (lũy kế năm)', short: 'Hộ được hỗ trợ', u: 'hộ', ck: true, f: (D) => D.quy * 1000 / 3.8 },
    qpc: { l: 'Vận động bình quân đầu người (lũy kế năm)', short: 'Bình quân đầu người', u: 'nghìn đồng/người', d: 0, ck: true, f: (D, u) => D.quy * 1e6 / u.ds }
  },
  kpis: [['quy', 'lũy kế từ đầu năm'], ['nha', 'lũy kế từ đầu năm'], ['tet', 'Tết Bính Ngọ 2026 (Quý 3, 4/2025: Tết Ất Tỵ 2025)'], ['ho', 'lũy kế từ đầu năm'], ['qpc', 'lũy kế từ đầu năm']],
  card: ['quy', 'nha', 'tet'],
  groups: [
    { id: 'quy', label: 'Vận động Quỹ', note: 'Quỹ “Vì người nghèo” vận động tại xã, phường, lũy kế từ đầu năm', lines: ['quy', 'qpc'], hint: () => 'Quý 4/2025 là số cả năm 2025, cùng số với bảng 126 xã, phường của Ban Tuyên giáo và Công tác Xã hội.' },
    { id: 'ht', label: 'Hỗ trợ', note: 'Nhà Đại đoàn kết, hộ được hỗ trợ, quà Tết', lines: ['nha', 'ho', 'tet'] }
  ],
  cmp: ['qpc', { m: 'quy', tot: true }, { m: 'nha', tot: true }, { m: 'tet', tot: true }],
  note: 'kỳ báo cáo là quý; quỹ vận động, nhà Đại đoàn kết, hộ được hỗ trợ là số lũy kế từ đầu năm nên Quý 1 thấp hơn Quý 4 năm trước. Suất quà Tết Bính Ngọ 2026 từ Quỹ Thành phố là 5.280 suất cho 126 xã, phường.'
});
ctmXaUnit({
  id: 'mttqxa-giamsat', role: 'MTTQ', name: 'Giám sát - Phản biện xã hội', org: 'Ủy ban MTTQ',
  m: {
    gs: ['Cuộc giám sát', 'cuộc', 0, CX.city('mttq-xa-phuong', 'gs'), '', 'Cuộc giám sát'],
    pb: ['Hội nghị phản biện xã hội', 'hội nghị', 0, CX.city('mttq-xa-phuong', 'pb'), '', 'Hội nghị phản biện'],
    kn: { l: 'Kiến nghị sau giám sát', short: 'Kiến nghị sau giám sát', u: 'kiến nghị', neutral: true, f: (D, u, pid) => D.gs * (3.4 + 1.6 * ctmXr('mttqxa-giamsat', 'kn', u, pid)) },
    tt: ['Kiến nghị sau giám sát được tiếp thu, giải quyết', '%', 1, CX.rate(84, { s: 8, g: -0.6 }), '', 'Được tiếp thu, giải quyết'],
    ban: ['Ban công tác Mặt trận ở khu dân cư', 'ban', 0, CX.city('mttq-xa-phuong', 'ban'), 'n', 'Ban công tác Mặt trận']
  },
  kpis: [['gs', 'trong quý'], ['kn', 'trong quý'], ['tt', 'trên kiến nghị sau giám sát'], ['pb', 'trong quý'], ['ban', 'khu dân cư']],
  card: ['gs', 'pb', 'tt'],
  groups: [
    { id: 'gs', label: 'Giám sát', note: 'Giám sát của Mặt trận và kết quả tiếp thu kiến nghị', lines: ['gs', 'kn', 'tt'] },
    { id: 'pb', label: 'Phản biện, tổ chức', note: 'Hội nghị phản biện xã hội; Ban công tác Mặt trận ở khu dân cư', lines: ['pb', 'ban'] }
  ],
  cmp: [{ m: 'gs', tot: true }, { m: 'pb', tot: true }, { m: 'tt', w: 'kn', minW: 5 }]
});
ctmXaUnit({
  id: 'mttqxa-doanthe', role: 'MTTQ', name: 'Đoàn thể chính trị - xã hội phường', org: 'Ủy ban MTTQ',
  m: {
    /* hội viên, đoàn viên: số cuối năm 2025, cùng số với bảng 126 xã, phường của từng đoàn thể Thành phố */
    pn: ['Hội viên phụ nữ', 'hội viên', 0, CX.city('mttq-hoi-lhpn', 'hv', '2025'), 'n'],
    ccb: ['Hội viên Cựu chiến binh', 'hội viên', 0, CX.city('mttq-cuu-chien-binh', 'hv', '2025'), 'n'],
    nd: ['Hội viên nông dân', 'hội viên', 0, CX.city('mttq-hoi-nong-dan-tp', 'hv', '2025'), 'n'],
    dv: ['Đoàn viên thanh niên', 'đoàn viên', 0, CX.city('mttq-thanh-doan', 'dv', '2025'), 'n'],
    /* cộng số hội viên, đoàn viên của 4 đoàn thể: một người có thể ở nhiều đoàn thể nên đây là lượt, không phải số người */
    hvT: { l: 'Lượt hội viên, đoàn viên (cộng 4 đoàn thể)', short: 'Lượt hội viên, đoàn viên', u: 'lượt', sum: ['pn', 'ccb', 'nd', 'dv'] },
    hd: ['Hoạt động, phong trào của đoàn thể', 'hoạt động', 0, CX.per(0.55, { s: 0.3, q: { 1: 1.2, 2: 0.9, 3: 1.1, 4: 0.8 } }), '', 'Hoạt động, phong trào'],
    hvpc: { l: 'Lượt hội viên, đoàn viên trên 1.000 dân', u: 'lượt', d: 1, f: (D, u) => D.hvT / u.ds * 1000 },
    hdpc: { l: 'Hoạt động trên 10.000 dân', u: 'hoạt động', d: 1, f: (D, u) => D.hd / u.ds * 10000 }
  },
  kpis: [['hvT', 'cuối năm 2025'], ['pn', 'cuối năm 2025'], ['ccb', 'cuối năm 2025'], ['nd', 'cuối năm 2025'], ['dv', 'cuối năm 2025'], ['hd', 'trong quý']],
  card: ['hvT', 'pn', 'hd'],
  groups: [
    /* không vẽ thanh xếp chồng, không chia tỷ trọng: một người có thể là hội viên nhiều đoàn thể (quy tắc H13) */
    { id: 'hv', label: 'Hội viên, đoàn viên', note: 'Hội viên, đoàn viên các đoàn thể chính trị – xã hội (số cuối năm 2025). Một người có thể thuộc nhiều đoàn thể nên không cộng tỷ trọng.', lines: ['hvT', 'pn', 'ccb', 'nd', 'dv'], table: [null, ['pn', 'ccb', 'nd', 'dv'], 'Theo đoàn thể', 'Đoàn thể'] },
    { id: 'hd', label: 'Hoạt động, phong trào', note: 'Hoạt động, phong trào của các đoàn thể trong quý', lines: ['hd'] }
  ],
  cmp: ['hvpc', 'hdpc', { m: 'hvT', tot: true }]
});

/* ============================== MÀN NGOÀI TÀI KHOẢN XÃ, PHƯỜNG ============================== */
const CTM_XA_SHORT = {
  'dangxa-vpdu': 'Văn phòng Đảng ủy', 'dangxa-tochuc': 'Tổ chức xây dựng Đảng', 'dangxa-kiemtra': 'Kiểm tra, giám sát', 'dangxa-tuyengiao': 'Tuyên giáo và Dân vận',
  'hdndxa-nhiemvu': 'HĐND · Theo dõi nhiệm vụ', 'hdndxa-tiepxuc': 'Tiếp xúc cử tri', 'hdndxa-giamsat': 'Giám sát chuyên đề', 'hdndxa-ngansach': 'Thẩm tra ngân sách',
  'ubndxa-vp': 'Văn phòng UBND', 'ubndxa-diachinh': 'Địa chính - Đô thị - Môi trường', 'ubndxa-tuphap': 'Tư pháp - Hộ tịch', 'ubndxa-mocua': 'Bộ phận Một cửa', 'ubndxa-vhxh': 'Văn hóa - Xã hội', 'ubndxa-yte': 'Trạm Y tế', 'ubndxa-anninh': 'Công an',
  'mttqxa-nhiemvu': 'MTTQ · Theo dõi nhiệm vụ', 'mttqxa-quyvi': 'Quỹ “Vì người nghèo”', 'mttqxa-giamsat': 'Giám sát - Phản biện', 'mttqxa-doanthe': 'Đoàn thể'
};
const CTM_XA_EYE = (ctx) => 'Tổng quan · ' + (ctx && ctx.xa ? ctx.xa.name : 'xã, phường');
const CTM_XA_HINT = (ctx) => (ctx && ctx.xa ? 'Diện tích ' + ctmF(ctx.xa.dt, 2) + ' km² · dân số ' + ctmF(ctx.xa.ds) + ' người · mật độ ' + ctmF(ctx.xa.den) + ' người/km² · bấm ô để mở chi tiết' : '');
const CTM_XA_AXES = [{ id: 'DANG', label: 'Đảng ủy phường', ax: 'Đảng ủy' }, { id: 'HDND', label: 'HĐND phường', ax: 'HĐND' }, { id: 'UBND', label: 'UBND phường', ax: 'UBND' }, { id: 'MTTQ', label: 'Ủy ban MTTQ phường', ax: 'MTTQ' }];
ctmRegisterOverview({
  id: 'xa-4truc', roles: ['DANG', 'HDND', 'UBND', 'MTTQ'], level: 'xa', unitWord: 'đơn vị', rename: ctmXaLoc, short: CTM_XA_SHORT,
  eyebrow: CTM_XA_EYE, hint: CTM_XA_HINT,
  title: (n, ctx) => 'Số liệu then chốt của 4 trục, ' + n + ' đơn vị',
  groupTitle: 'Bốn trục · bấm một trục để lọc danh sách đơn vị bên dưới',
  kpis: [
    { cat: 'dangxa-tochuc', m: 'dv', target: 'g:dv' }, { cat: 'ubndxa-mocua', m: 'hs', target: 'g:tn' }, { cat: 'ubndxa-mocua', m: 'dhR', target: 'g:tn' },
    { cat: 'ubndxa-diachinh', m: 'pa', target: 'g:pa' }, { cat: 'ubndxa-yte', m: 'kcb', target: 'g:kcb' }, { cat: 'hdndxa-tiepxuc', m: 'ct', target: 'g:ct' },
    { cat: 'mttqxa-quyvi', m: 'quy', target: 'g:quy' }, { cat: 'ubndxa-anninh', m: 'antt', target: 'g:an' }
  ],
  groups: CTM_XA_AXES.map((a) => ({ id: a.id, label: a.label, role: a.id, ax: a.ax }))
});
/* Từng tab trục của tài khoản xã, phường: cùng màn ngoài, không chia nhóm */
[
  ['DANG', [['dangxa-tochuc', 'dv'], ['dangxa-tochuc', 'knm'], ['dangxa-tochuc', 'cb'], ['dangxa-kiemtra', 'kt'], ['dangxa-kiemtra', 'kl'], ['dangxa-tuyengiao', 'mh'], ['dangxa-vpdu', 'tong'], ['dangxa-vpdu', 'htR']]],
  ['HDND', [['hdndxa-tiepxuc', 'hn'], ['hdndxa-tiepxuc', 'ct'], ['hdndxa-tiepxuc', 'ctR'], ['hdndxa-giamsat', 'gs'], ['hdndxa-giamsat', 'nq'], ['hdndxa-ngansach', 'dt'], ['hdndxa-ngansach', 'thR'], ['hdndxa-nhiemvu', 'tong']]],
  ['UBND', [['ubndxa-mocua', 'hs'], ['ubndxa-mocua', 'dhR'], ['ubndxa-diachinh', 'pa'], ['ubndxa-tuphap', 'ks'], ['ubndxa-yte', 'kcb'], ['ubndxa-vhxh', 'cn'], ['ubndxa-anninh', 'antt'], ['ubndxa-vp', 'tong']]],
  ['MTTQ', [['mttqxa-quyvi', 'quy'], ['mttqxa-quyvi', 'nha'], ['mttqxa-quyvi', 'tet'], ['mttqxa-giamsat', 'gs'], ['mttqxa-giamsat', 'pb'], ['mttqxa-doanthe', 'hvT'], ['mttqxa-doanthe', 'hd'], ['mttqxa-nhiemvu', 'tong']]]
].forEach(([role, ks]) => {
  const A = CTM_XA_AXES.find((a) => a.id === role);
  ctmRegisterOverview({
    id: 'xa-' + role, roles: [role], level: 'xa', unitWord: 'đơn vị', rename: ctmXaLoc, short: CTM_XA_SHORT, ax: A.ax,
    eyebrow: (ctx) => CTM_XA_EYE(ctx) + ' · ' + ctmXaLoc(A.label, ctx), hint: CTM_XA_HINT,
    title: (n) => 'Số liệu then chốt của ' + n + ' đơn vị',
    kpis: ks.map((k) => ({ cat: k[0], m: k[1] })), groups: []
  });
});

/* ============================== KIỂU DỮ LIỆU (quy tắc H9) ==============================
   Số tại thời điểm (td) so với quý liền trước; kế hoạch, dự toán (plan) không so; còn lại là số phát sinh, so cùng kỳ năm trước
   — cấp xã chưa có số cùng kỳ (đơn vị hành chính mới từ 01/7/2025) nên ghi "Chưa có số cùng kỳ". */
ctmFlag('dangxa-tochuc', 'td', ['dv', 'dvDb', 'dvCt', 'dvNu', 'dvTre', 'cb', 'cbKdc', 'cbTh', 'cbKhac', 'ht', 'xs', 'khong', 'dvpc']);
ctmFlag('dangxa-kiemtra', 'td', ['dv']);
ctmFlag('hdndxa-tiepxuc', 'td', ['ctDang']);
ctmFlag('hdndxa-ngansach', 'plan', ['dt', 'dtpc']);
ctmFlag('ubndxa-mocua', 'td', ['dxlt']);
ctmFlag('ubndxa-vhxh', 'td', ['cn', 'hn', 'ncc', 'btxh', 'cnR', 'btpc']);
ctmFlag('ubndxa-yte', 'td', ['bhyt', 'hsSk']);
ctmFlag('mttqxa-giamsat', 'td', ['ban']);
ctmFlag('mttqxa-doanthe', 'td', ['pn', 'ccb', 'nd', 'dv', 'hvT', 'hvpc']);