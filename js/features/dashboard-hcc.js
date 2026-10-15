/* ============================== TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG — FORM CHỈ TIÊU MỚI ==============================
   Form riêng của Trung tâm Phục vụ HCC Thành phố, cùng khuôn với form Sở Tài chính (dashboard-stc.js) và Sở GD&ĐT
   (dashboard-sgd.js), hiển thị trong popup chuẩn của IOC (#modal). 9 màn: Trang chủ, 5 màn nhóm, Chi tiết theo cấp bậc
   (sơ đồ cây thẻ số + cầu nối + xu hướng 6 quý), Chỉ tiêu theo đơn vị (các sở/ngành trong HCC_SO + 126 phường/xã, khung hồ sơ trượt),
   Nguồn dữ liệu và giả định.
   Số liệu: hcc-data.js (SỐ GIẢ LẬP theo schema API hcc_tkpro; API chưa có số thật). Giao diện dùng lớp stc- (css/stc.css),
   các thành phần sgd- (css/sgd.css) và lớp hcc- (css/hcc.css), gốc là .stc-root.hcc-root. Cần: esc() (helpers.js),
   openModal/closeModal. */

const HCC_UI = { open: false, screen: 'home', group: 'tn', tree: 'tiepnhan', pick: null, period: HCC_PERIODS[0].id, dd: null, role: null,
  xa: { ind: 'dunghan', q: '', f: 'all', sk: 'v', sd: -1, sel: null, order: [], anim: false }, focusQ: false };
/* false = KHÔNG hiện mã kỹ thuật trên giao diện (tên endpoint, trường dữ liệu kiểu total_SH, totalTreHan, màn "Nguồn dữ liệu",
   bảng "Số liệu gốc từ API") — anh yêu cầu 2026-09-29, cùng quy tắc với SGD_SHOW_TECH. Ẩn bằng cờ, code giữ nguyên;
   true = hiện lại (dùng khi đối chiếu với bên cung cấp API). */
const HCC_SHOW_TECH = false;
const HCC_PAL =['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
const HCC_ICON_INFO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>';
const HCC_ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
const HCC_ICON_DB = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';
const HCC_KHOI_COLOR = { so: 'var(--s4)', p: 'var(--s1)', x: 'var(--s3)' };

/* ---------- Tiện ích ---------- */
function hccE(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function hccFmt(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 && Math.abs(n) >= Math.pow(10, -d) / 2 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function hccSgn(n, d) { return n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + hccFmt(Math.abs(n), d); }
function hccDiv(a, b, m) { return a == null || b == null || !b ? null : (a / b) * (m == null ? 100 : m); }
function hccLnk(label, act) { return '<button type="button" class="stc-lnk" onclick="' + act + '">' + hccE(label) + '</button>'; }
function hccNote(html) { return '<div class="stc-note">' + HCC_ICON_INFO + '<div>' + html + '</div></div>'; }
function hccEmpty(title, text) { return '<div class="stc-empty">' + HCC_ICON_DB + '<b>' + hccE(title) + '</b><span style="font-size:12px;max-width:420px">' + hccE(text) + '</span></div>'; }
function hccJs(s) { return hccE(JSON.stringify(s)); }
let HCC_CITY = {};
function hccCityP(p) { if (p == null) return null; if (!HCC_CITY[p]) HCC_CITY[p] = hccCity(p); return HCC_CITY[p]; }
function hccNP() { const p = HCC_UI.period, pp = hccPrevPeriod(p); return { p: p, pp: pp, C: hccCityP(p), P: pp != null ? hccCityP(pp) : null }; }
function hccShortName(s) { return String(s).replace(/^(Phường|Xã|Sở) /, ''); }
function hccKindLabel(k) { return k === 'so' ? 'sở, ngành' : k === 'x' ? 'xã' : 'phường'; }

/* Chú thích khi rê chuột vào mũi tên tăng/giảm (thuộc tính title) — cùng quy ước với sgdDlTip. kind: 'rate' = điểm %,
   'abs' = chênh lệch số thường, 'rel' = % so với chính nó. better: 'high' / 'low' / 'none'. cmpTP: so với mức Thành phố. */
function hccDlTip(kind, better, now, prev, d, cmpTP) {
  const L = [];
  const fm = (x) => (kind === 'rate' ? hccFmt(x, 1) + '%' : hccFmt(x, kind === 'abs' ? d : Number.isInteger(x) ? 0 : 1));
  const was = cmpTP ? 'Mức Thành phố' : 'Kỳ trước', is = cmpTP ? 'đơn vị này' : 'kỳ này';
  if (kind === 'rate') L.push('Đơn vị "điểm %" (điểm phần trăm): lấy tỷ lệ ' + is + ' TRỪ thẳng ' + (cmpTP ? 'tỷ lệ của Thành phố' : 'tỷ lệ kỳ trước') + '.');
  else if (kind === 'abs') L.push('Chênh lệch trực tiếp: số ' + is + ' trừ ' + (cmpTP ? 'mức Thành phố' : 'số kỳ trước') + '.');
  else L.push('Tăng/giảm bao nhiêu % so với chính nó kỳ trước: (kỳ này ÷ kỳ trước − 1) × 100.');
  if (now != null && prev != null) {
    const v = kind === 'rel' ? (prev ? (now / prev - 1) * 100 : null) : now - prev;
    if (v != null) {
      const dd = kind === 'abs' ? d : 1, unit = kind === 'rate' ? ' điểm %' : kind === 'rel' ? '%' : '';
      const r = Math.round(v * Math.pow(10, dd)) / Math.pow(10, dd);
      L.push(was + ' ' + fm(prev) + ' → ' + is + ' ' + fm(now) + ': ' + (r === 0 ? 'không đổi' : (r > 0 ? (cmpTP ? 'cao hơn ' : 'tăng ') : (cmpTP ? 'thấp hơn ' : 'giảm ')) + hccFmt(Math.abs(v), dd) + unit) + '.');
    }
  }
  if (kind === 'rate') L.push('Ví dụ: 92,1% lên 92,9% là tăng 0,8 điểm %, không phải tăng 0,8%.');
  if (!cmpTP) L.push(better === 'low' ? 'Chỉ tiêu này giảm là tốt: tăng tô đỏ, giảm tô xanh.' : better === 'none' ? 'Tăng hay giảm không tự thân tốt/xấu nên tô màu trung tính.' : 'Chỉ tiêu này tăng là tốt: tăng tô xanh, giảm tô đỏ.');
  return L.join('\n');
}
/* Mũi tên tăng/giảm — cùng quy ước với form Sở GD&ĐT. o.rate: chênh lệch điểm %, o.abs: chênh lệch số thường,
   o.inv: giảm là tốt, o.neutral: màu trung tính. */
function hccDl(now, prev, o) {
  o = o || {};
  if (now == null || prev == null) return '';
  const v = o.rate || o.abs ? now - prev : (prev ? (now / prev - 1) * 100 : null);
  if (v == null) return '';
  const d = o.d != null ? o.d : 1;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  let cls = r > 0 ? 'up' : r < 0 ? 'down' : 'flat';
  if (cls !== 'flat') { if (o.inv) cls += r > 0 ? ' bad' : ' good'; else if (o.neutral) cls += ' n'; }
  const txt = cls === 'flat' ? 'Không đổi' : hccFmt(Math.abs(v), d) + (o.abs ? '' : o.rate ? ' điểm %' : '%');
  const tip = hccDlTip(o.rate ? 'rate' : o.abs ? 'abs' : 'rel', o.inv ? 'low' : o.neutral ? 'none' : 'high', now, prev, d);
  return '<span class="stc-dl ' + cls + '" title="' + hccE(tip) + '" style="cursor:help">' + txt + (o.ref ? ' <span class="stc-ref">' + hccE(o.ref) + '</span>' : '') + '</span>';
}
function hccLegend(p, pp) {
  return '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + hccPeriodLabel(p) + '</span>' + (pp != null ? '<span><i style="background:var(--prev)"></i>' + hccPeriodLabel(pp) + '</span>' : '') + '</div>';
}
function hccBig(v, unit, dl) { return '<div class="stc-bigrow"><div class="stc-big">' + v + (unit ? '<small>' + hccE(unit) + '</small>' : '') + '</div>' + (dl || '') + '</div>'; }
function hccCmp(label, now, prev, mx, dl, first) {
  const w = (v) => (v > 0 ? Math.max(0.2, (v / (mx || 1)) * 100) : 0);
  return '<div class="stc-cmp"' + (first ? ' style="margin-top:8px"' : '') + '><div class="stc-nm">' + hccE(label) + '</div><div class="stc-bars">' +
    '<div class="stc-br"><div class="stc-tr"><div class="stc-b" style="width:' + w(now).toFixed(2) + '%"></div></div><div class="stc-val">' + hccFmt(now) + '</div></div>' +
    (prev != null ? '<div class="stc-br"><div class="stc-tr"><div class="stc-b p" style="width:' + w(prev).toFixed(2) + '%"></div></div><div class="stc-val p">' + hccFmt(prev) + '</div></div>' : '') +
    '</div>' + (dl || '<span class="stc-dl flat">—</span>') + '</div>';
}
function hccPg(label, small, pct, mark, color, d) {
  const w = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return '<div class="stc-pg"><div class="stc-row"><span class="stc-nm">' + hccE(label) + (small ? '<small>' + hccE(small) + '</small>' : '') + '</span><span class="stc-pv">' + (pct == null ? '—' : hccFmt(pct, d == null ? 1 : d) + '%') + '</span></div><div class="stc-trk"><div class="stc-fill" style="width:' + w.toFixed(2) + '%' + (color ? ';background:' + color : '') + '"></div>' + (mark != null ? '<i class="sgd-mark" style="left:' + Math.max(0, Math.min(100, mark)).toFixed(2) + '%"></i>' : '') + '</div></div>';
}
function hccDonut(items, total, center, unit, label) {
  const C = 2 * Math.PI * 54;
  let cum = 0, segs = '';
  items.forEach((it) => {
    if (!(it.v > 0) || !(total > 0)) return;
    const len = (it.v / total) * C;
    segs += '<circle class="stc-seg" cx="80" cy="80" r="54" stroke="' + it.c + '" stroke-dasharray="' + Math.max(0.6, len - 2.5).toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="' + (-cum).toFixed(1) + '"/>';
    cum += len;
  });
  const fs = center.length > 8 ? 14 : center.length > 6 ? 17 : 21;
  return '<svg viewBox="0 0 160 160" role="img" aria-label="' + hccE(label) + '"><circle class="stc-trk" cx="80" cy="80" r="54"/><g transform="rotate(-90 80 80)">' + segs + '</g><text class="stc-tv" x="80" y="80" text-anchor="middle" style="font-size:' + fs + 'px">' + hccE(center) + '</text><text class="stc-tu" x="80" y="96" text-anchor="middle">' + hccE(unit) + '</text></svg>';
}
function hccStack(items) { return '<div class="stc-stack" style="margin-top:14px">' + items.map((it) => '<i style="flex:' + Math.max(0, it.v) + ';background:' + it.c + '" title="' + hccE(it.l || '') + '"></i>').join('') + '</div>'; }
/* Biểu đồ cột theo 6 quý (cũ → mới), cột của kỳ đang chọn tô đậm. vals: số theo HCC_PERIODS (mới → cũ). */
function hccCols(vals, show, unitTxt) {
  const ids = HCC_PERIODS.map((p) => p.id).slice().reverse(), vs = vals.slice().reverse();
  const mx = Math.max.apply(null, vs.filter((v) => v != null).concat([1]));
  const cols = ids.map((id, i) => {
    const v = vs[i], on = id === HCC_UI.period;
    return '<div class="sgd-col"><span class="sgd-cv">' + (v == null ? '—' : show(v)) + '</span><div class="sgd-pair"><div class="' + (on ? 'sgd-b1' : 'sgd-b0') + ' hcc-cb" style="height:' + Math.round(((v || 0) / mx) * 150) + 'px" title="' + hccE(hccPeriodLabel(id) + ': ' + (v == null ? '—' : show(v))) + '"></div></div></div>';
  }).join('');
  return '<div class="sgd-cc">' + cols + '</div><div class="sgd-ccl">' + ids.map((id) => '<span' + (id === HCC_UI.period ? ' style="color:var(--ink);font-weight:700"' : '') + '>' + hccPeriodShort(id) + '</span>').join('') + '</div>' + (unitTxt ? '<div class="stc-hint" style="margin-top:8px">' + hccE(unitTxt) + '</div>' : '');
}
function hccSeries(f) { return HCC_PERIODS.map((p) => { const C = hccCityP(p.id); return C ? f(C) : null; }); }

/* ---------- Khung chung: đầu màn, thẻ, chân màn ---------- */
function hccDd(id, label, cur, opts, handler) {
  const open = HCC_UI.dd === id;
  const cv = opts.find((o) => String(o.v) === String(cur));
  const list = open ? '<div class="stc-ddl" role="listbox" aria-label="' + hccE(label) + '">' + opts.map((o) => {
    const on = String(o.v) === String(cur);
    return '<button type="button" role="option" aria-selected="' + on + '" class="stc-ddo' + (on ? ' on' : '') + '" onclick="' + handler + '(' + hccJs(o.v) + ')"><span>' + hccE(o.text) + '</span>' + (on ? '<i>✓</i>' : '') + '</button>';
  }).join('') + '</div>' : '';
  return '<div class="stc-dd' + (open ? ' open' : '') + '"><button type="button" class="stc-ddb" aria-haspopup="listbox" aria-expanded="' + open + '" onclick="hccDdToggle(\'' + id + '\')"><small>' + hccE(label) + '</small><b>' + hccE(cv ? cv.text : '—') + '</b><span class="stc-ddc"></span></button>' + list + '</div>';
}
function hccHeader(back) {
  const b = back === 'home' ? hccLnk('← Tổng quan', "hccGo('home')") : back && back.group ? hccLnk('← ' + back.label, "hccGo('group','" + back.group + "')") : '';
  const pOpts = HCC_PERIODS.map((p) => ({ v: p.id, text: hccPeriodLabel(p.id) }));
  return '<div class="stc-toolbar"><div class="stc-tl">' + b + '<span class="sgd-demo"><i></i>Số liệu giả lập · chưa có số liệu thật từ Trung tâm Phục vụ HCC</span></div>' +
    '<div class="stc-ctrls">' + hccDd('period', 'Kỳ báo cáo', HCC_UI.period, pOpts, 'hccSetPeriod') + (typeof indicatorEntryBtnHtml === 'function' ? indicatorEntryBtnHtml() : '') + '<button type="button" class="stc-btn primary" onclick="hccExport()">' + HCC_ICON_DL + 'Xuất Excel</button></div></div>';
}
function hccFoot() {
  return '<div class="stc-foot"><span>Kỳ báo cáo (quý) và cách tính một số chỉ tiêu đang theo giả định, chờ Trung tâm Phục vụ HCC xác nhận.</span><span>Số liệu giả lập · ' + hccPeriodLabel(HCC_UI.period) + '</span></div>';
}
/* Thẻ chỉ tiêu: tiêu đề bấm được → xem theo đơn vị (o.xa); "Chi tiết ›" → sơ đồ cây (o.tree) */
function hccCard(o) {
  const title = o.xa ? '<button type="button" class="sgd-ctl" onclick="hccXa(\'' + o.xa + '\')" title="Xem theo sở, ngành và 126 phường/xã">' + hccE(o.title) + '</button>' : '<h3 class="stc-ct">' + hccE(o.title) + '</h3>';
  const right = (o.tree ? hccLnk('Chi tiết ›', "hccDetail('" + o.tree + "')") : '') + (o.src && (HCC_SHOW_TECH || o.warn) ? '<span class="stc-bd' + (o.warn ? ' warn' : '') + '">' + hccE(o.src) + '</span>' : '');
  return '<div class="stc-card"><div class="stc-ch"><div>' + title + '<div class="stc-cs">' + hccE(o.sub || '') + '</div></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + right + '</div></div>' + o.body + '</div>';
}
function hccSubP(unit) { const n = hccNP(); return hccPeriodLabel(n.p) + (n.pp != null ? ' so với ' + hccPeriodLabel(n.pp) : '') + (unit ? ' · ' + unit : ''); }

/* ---------- Số tổng hợp dùng chung (trang chủ, băng tổng quan) ---------- */
function hccMetrics() {
  const { C, P } = hccNP();
  const M = { C: C, P: P };
  const pair = (f) => [C ? f(C) : null, P ? f(P) : null];
  M.hs = pair((o) => o.hs); M.gq = pair((o) => o.gq); M.tre = pair((o) => o.tre); M.ton = pair((o) => o.ton); M.kt = pair((o) => o.kt);
  M.dxl = pair((o) => o.dxl); M.dxlt = pair((o) => o.dxlt); M.dxltR = pair((o) => hccDiv(o.dxlt, o.dxl));
  M.olR = pair((o) => hccDiv(o.ol, o.tong)); M.dungR = pair((o) => hccDiv(o.dung, o.gq)); M.treR = pair((o) => hccDiv(o.tre, o.gq));
  M.ttR = pair((o) => hccDiv(o.ttC, o.tthcC)); M.dvcR = pair((o) => hccDiv(o.ttC + o.mpC, o.tthcC)); M.tttR = pair((o) => hccDiv(o.ttt, o.tp));
  M.shR = pair((o) => hccDiv(o.sh, o.hs)); M.sh = pair((o) => o.sh);
  M.hlR = pair((o) => hccDiv(o.good, o.dg)); M.badR = pair((o) => hccDiv(o.bad, o.dg)); M.dg = pair((o) => o.dg); M.dgR = pair((o) => hccDiv(o.dg, o.gq));
  M.tk = pair((o) => o.cd + o.dn);
  M.shK = (k) => pair((o) => hccDiv(o['sh@' + k], o['hs@' + k]));
  return M;
}
const HCC_KPIS = [
  { label: 'Hồ sơ tiếp nhận mới', target: 'tn', v: (M) => hccFmt(M.hs[0]), u: () => 'hồ sơ trong quý', dl: (M) => hccDl(M.hs[0], M.hs[1], { neutral: true, ref: 'so kỳ trước' }) },
  { label: 'Tỷ lệ nộp trực tuyến', target: 'tn', v: (M) => hccFmt(M.olR[0], 1) + '%', u: () => 'trên hồ sơ tiếp nhận', dl: (M) => hccDl(M.olR[0], M.olR[1], { rate: true }) },
  { label: 'Tỷ lệ giải quyết đúng hạn', target: 'gq', v: (M) => hccFmt(M.dungR[0], 2) + '%', u: (M) => hccFmt(M.gq[0]) + ' hồ sơ đã giải quyết', dl: (M) => hccDl(M.dungR[0], M.dungR[1], { rate: true, d: 2 }) },
  { label: 'Hồ sơ giải quyết trễ hạn', target: 'gq', v: (M) => hccFmt(M.tre[0]), u: (M) => hccFmt(M.treR[0], 2) + '% số đã giải quyết', dl: (M) => hccDl(M.tre[0], M.tre[1], { inv: true }) },
  { label: 'Hồ sơ đang xử lý trễ hạn', target: 'gq', v: (M) => hccFmt(M.dxlt[0]), u: (M) => hccFmt(M.dxltR[0], 1) + '% số đang xử lý cuối kỳ', dl: (M) => hccDl(M.dxlt[0], M.dxlt[1], { inv: true }) },
  { label: 'Thủ tục trực tuyến toàn trình', target: 'dvc', v: (M) => hccFmt(M.ttR[0], 1) + '%', u: (M) => hccFmt(M.C.ttC) + ' / ' + hccFmt(M.C.tthcC) + ' thủ tục', dl: (M) => hccDl(M.ttR[0], M.ttR[1], { rate: true }) },
  { label: 'Tỷ lệ số hóa hồ sơ', target: 'sh', v: (M) => hccFmt(M.shR[0], 1) + '%', u: () => 'hồ sơ số hóa khi tiếp nhận', dl: (M) => hccDl(M.shR[0], M.shR[1], { rate: true }) },
  { label: 'Tỷ lệ hài lòng', target: 'hl', v: (M) => hccFmt(M.hlR[0], 1) + '%', u: (M) => hccFmt(M.dg[0]) + ' lượt đánh giá', dl: (M) => hccDl(M.hlR[0], M.hlR[1], { rate: true }) }
];
function hccKpiTile(k, M, onclick) {
  const d = k.dl(M) || '<span class="stc-dl flat"><span class="stc-ref">Chưa có kỳ so sánh</span></span>';
  return '<button type="button" class="stc-kpi" onclick="' + (onclick || ("hccGo('group','" + k.target + "')")) + '"><div class="stc-lb">' + hccE(k.label) + '</div><div class="stc-v">' + k.v(M) + '</div><div class="stc-u">' + hccE(k.u(M)) + '</div><div style="margin-top:10px;min-height:18px">' + d + '</div></button>';
}
function hccGl(label, val, unit, dl) {
  return '<div class="stc-gl"><span>' + hccE(label) + '</span><span class="stc-v">' + val + (unit ? '<small>' + hccE(unit) + '</small>' : '') + '</span><span>' + (dl || '') + '</span></div>';
}
function hccGroupLines(id, M) {
  const L = [];
  if (id === 'tn') {
    L.push(hccGl('Hồ sơ tiếp nhận mới', hccFmt(M.hs[0]), '', hccDl(M.hs[0], M.hs[1], { neutral: true })));
    L.push(hccGl('Nộp trực tuyến', hccFmt(M.olR[0], 1), '%', hccDl(M.olR[0], M.olR[1], { rate: true })));
    L.push(hccGl('Kỳ trước chuyển sang', hccFmt(M.kt[0]), '', hccDl(M.kt[0], M.kt[1], { inv: true })));
    L.push(hccGl('Tài khoản Cổng DVC', hccFmt(M.tk[0] / 1e6, 2), 'triệu', hccDl(M.tk[0], M.tk[1])));
  } else if (id === 'gq') {
    L.push(hccGl('Đã giải quyết', hccFmt(M.gq[0]), '', hccDl(M.gq[0], M.gq[1], { neutral: true })));
    L.push(hccGl('Đúng hạn', hccFmt(M.dungR[0], 2), '%', hccDl(M.dungR[0], M.dungR[1], { rate: true, d: 2 })));
    L.push(hccGl('Giải quyết trễ hạn', hccFmt(M.tre[0]), 'hồ sơ', hccDl(M.tre[0], M.tre[1], { inv: true })));
    L.push(hccGl('Còn tồn cuối kỳ', hccFmt(M.ton[0]), '', hccDl(M.ton[0], M.ton[1], { inv: true })));
    L.push(hccGl('Đang xử lý trễ hạn', hccFmt(M.dxlt[0]), 'hồ sơ', hccDl(M.dxlt[0], M.dxlt[1], { inv: true })));
  } else if (id === 'dvc') {
    L.push(hccGl('Thủ tục toàn trình', hccFmt(M.ttR[0], 1), '%', hccDl(M.ttR[0], M.ttR[1], { rate: true })));
    L.push(hccGl('Thủ tục có DVC trực tuyến', hccFmt(M.dvcR[0], 1), '%', hccDl(M.dvcR[0], M.dvcR[1], { rate: true })));
    L.push(hccGl('Thanh toán trực tuyến', hccFmt(M.tttR[0], 1), '%', hccDl(M.tttR[0], M.tttR[1], { rate: true })));
  } else if (id === 'sh') {
    L.push(hccGl('Tỷ lệ số hóa', hccFmt(M.shR[0], 1), '%', hccDl(M.shR[0], M.shR[1], { rate: true })));
    L.push(hccGl('Hồ sơ đã số hóa', hccFmt(M.sh[0]), '', hccDl(M.sh[0], M.sh[1], { neutral: true })));
    const so = M.shK('so'), wx = [hccDiv(M.C['sh@p'] + M.C['sh@x'], M.C['hs@p'] + M.C['hs@x']), M.P ? hccDiv(M.P['sh@p'] + M.P['sh@x'], M.P['hs@p'] + M.P['hs@x']) : null];
    L.push(hccGl('Khối sở, ngành', hccFmt(so[0], 1), '%', hccDl(so[0], so[1], { rate: true })));
    L.push(hccGl('Khối phường, xã', hccFmt(wx[0], 1), '%', hccDl(wx[0], wx[1], { rate: true })));
  } else if (id === 'hl') {
    L.push(hccGl('Tỷ lệ hài lòng', hccFmt(M.hlR[0], 1), '%', hccDl(M.hlR[0], M.hlR[1], { rate: true })));
    L.push(hccGl('Không hài lòng', hccFmt(M.badR[0], 2), '%', hccDl(M.badR[0], M.badR[1], { rate: true, inv: true, d: 2 })));
    L.push(hccGl('Lượt đánh giá', hccFmt(M.dg[0]), '', hccDl(M.dg[0], M.dg[1], { neutral: true })));
    L.push(hccGl('Hồ sơ được đánh giá', hccFmt(M.dgR[0], 1), '%', hccDl(M.dgR[0], M.dgR[1], { rate: true })));
  }
  return L;
}
function hccGroupCard(g, M, onclick) {
  const L = hccGroupLines(g.id, M);
  return '<button type="button" class="stc-gcard" onclick="' + (onclick || ("hccGo('group','" + g.id + "')")) + '"><div class="stc-gh"><h3>' + hccE(g.label) + '</h3><span>' + L.length + ' chỉ tiêu</span></div>' + L.join('') + '<div class="stc-gmore">Xem nhóm ' + hccE(g.label) + ' ›</div></button>';
}
function hccXaCard(onclick) {
  const nSo = HCC_SO.length;
  const rows = ['Bảng ' + (nSo + 126) + ' đơn vị: ' + nSo + ' sở, ngành và 126 phường/xã', 'Hạng, tốt nhất / kém nhất, số đơn vị kém hơn mức Thành phố', 'Hồ sơ đơn vị: hồ sơ trễ hạn, đang xử lý trễ hạn, thủ tục chưa toàn trình', 'Lọc sở / phường / xã, tìm theo tên, sắp xếp theo cột'];
  return '<button type="button" class="stc-gcard sgd-alt" onclick="' + (onclick || 'hccXa()') + '"><div class="stc-gh"><h3>Theo đơn vị</h3><span>' + HCC_XA_INDS.length + ' chỉ tiêu</span></div>' + rows.map((t) => '<div class="stc-gl"><span>' + t + '</span><span></span><span></span></div>').join('') + '<div class="stc-gmore">Xem theo đơn vị ›</div></button>';
}

/* ---------- Màn: Trang chủ ---------- */
function hccScreenHome() {
  const M = hccMetrics();
  let h = hccHeader(null);
  h += '<div class="stc-kpis">' + HCC_KPIS.map((k) => hccKpiTile(k, M)).join('') + '</div>';
  h += '<div class="stc-secrow"><div class="stc-sec">Năm nhóm chỉ tiêu · mỗi nhóm một màn hình</div><div style="display:flex;gap:18px;flex-wrap:wrap">' + hccLnk('Theo đơn vị ›', 'hccXa()') + hccLnk('Xem chi tiết theo cấp bậc ›', "hccDetail('" + HCC_UI.tree + "')") + (HCC_SHOW_TECH ? hccLnk('Nguồn dữ liệu và giả định ›', "hccGo('src')") : '') + '</div></div>';
  h += '<div class="sgd-g3">' + HCC_GROUPS.map((g) => hccGroupCard(g, M)).join('') + hccXaCard() + '</div>';
  h += '<div class="stc-mt">' + hccNote('<b>Cách đọc:</b> kỳ báo cáo là quý, so với quý liền trước. Số của Thành phố là tổng của các sở, ngành và 126 phường/xã; riêng số thủ tục là số của toàn Thành phố, không cộng các đơn vị vì một thủ tục áp dụng cho nhiều đơn vị. Trễ hạn, tồn, không hài lòng tăng hiển thị màu đỏ; số hồ sơ tiếp nhận tăng hay giảm để màu trung tính. Bấm tên một thẻ chỉ tiêu (có dấu ›) để xem theo từng đơn vị.') + '</div>';
  return h + hccFoot();
}

/* ---------- Màn: 5 nhóm ---------- */
function hccScreenGroup() {
  const gi = Math.max(0, HCC_GROUPS.findIndex((g) => g.id === HCC_UI.group)), g = HCC_GROUPS[gi];
  const n = hccNP();
  let h = hccHeader('home');
  h += '<div style="margin:-4px 0 14px" class="stc-hint">' + hccE(g.note + (HCC_SHOW_TECH ? ' · Nguồn: ' + g.src : '')) + '</div>';
  h += ({ tn: hccGroupTn, gq: hccGroupGq, dvc: hccGroupDvc, sh: hccGroupSh, hl: hccGroupHl })[g.id](n);
  const N = HCC_GROUPS.length, prev = HCC_GROUPS[(gi + N - 1) % N], next = HCC_GROUPS[(gi + 1) % N];
  h += '<div class="stc-pn"><span>' + hccLnk('‹ ' + prev.label, "hccGo('group','" + prev.id + "')") + '</span>' + hccLnk('Tổng quan', "hccGo('home')") + '<span>' + hccLnk(next.label + ' ›', "hccGo('group','" + next.id + "')") + '</span></div>';
  return h + hccFoot();
}
/* Tỷ lệ theo khối (sở/ngành, phường, xã) — thanh tiến độ, vạch đen = mức chung */
function hccKhoiPg(C, num, den, all, d, color) {
  return HCC_KHOI.map((k) => hccPg(k[1], hccFmt(C[num + '@' + k[0]]) + ' / ' + hccFmt(C[den + '@' + k[0]]), hccDiv(C[num + '@' + k[0]], C[den + '@' + k[0]]), all, color || HCC_KHOI_COLOR[k[0]], d)).join('');
}
function hccTopUnits(n, f, list, max) {
  return hccUnits().map((r) => ({ r: r, v: f(r.v[n.p]), o: r.v[n.p] })).filter((x) => x.v != null).sort((a, b) => b.v - a.v).slice(0, max || 10);
}
function hccGroupTn(n) {
  const { C, P, p, pp } = n;
  const ch = [['Nộp trực tuyến', 'ol', 'var(--s1)'], ['Nộp trực tiếp', 'tti', 'var(--s4)'], ['Qua bưu chính công ích', 'bc', 'var(--s3)']];
  const mx = Math.max.apply(null, ch.map((c) => Math.max(C[c[1]], P ? P[c[1]] : 0)));
  let a = hccBig(hccFmt(C.tong), 'hồ sơ', hccDl(C.tong, P ? P.tong : null, { neutral: true, ref: pp != null ? 'so kỳ trước (' + hccFmt(P.tong) + ')' : '' })) +
    '<div class="stc-hint">Trực tuyến + trực tiếp + bưu chính = tổng hồ sơ tiếp nhận (khớp). Tỷ lệ nộp trực tuyến ' + hccFmt(hccDiv(C.ol, C.tong), 1) + '%.</div>' + hccLegend(p, pp);
  ch.forEach((c, i) => { a += hccCmp(c[0], C[c[1]], P ? P[c[1]] : null, mx, hccDl(C[c[1]], P ? P[c[1]] : null, { neutral: c[1] !== 'ol' }), i === 0); });
  const b = hccCols(hccSeries((o) => o.tong), (v) => hccFmt(v / 1000, 0), 'Nghìn hồ sơ tiếp nhận mới mỗi quý. Quý 4 thường cao nhất do dồn hồ sơ cuối năm.') +
    '<table class="stc-tbl" style="margin-top:14px"><thead><tr><th>Quý</th>' + HCC_PERIODS.slice().reverse().map((x) => '<th>' + hccPeriodShort(x.id) + '</th>').join('') + '</tr></thead><tbody><tr><td>Nộp trực tuyến</td>' +
    hccSeries((o) => hccDiv(o.ol, o.tong)).reverse().map((v) => '<td>' + hccFmt(v, 1) + '%</td>').join('') + '</tr></tbody></table>';
  const lv = C.lv, lvP = P ? P.lv : null;
  const c = '<table class="stc-tbl"><thead><tr><th>Lĩnh vực</th><th>Tiếp nhận</th><th>Tỷ trọng</th><th>Nộp trực tuyến</th><th>So kỳ trước</th></tr></thead><tbody>' +
    lv.slice().sort((x, y) => y.tong - x.tong).map((x) => { const q = lvP ? lvP.find((z) => z.id === x.id) : null; return '<tr><td>' + hccE(x.name) + '</td><td>' + hccFmt(x.tong) + '</td><td>' + hccFmt(hccDiv(x.tong, C.tong), 1) + '%</td><td>' + hccFmt(hccDiv(x.ol, x.tong), 1) + '%</td><td>' + (hccDl(x.tong, q ? q.tong : null, { neutral: true }) || '—') + '</td></tr>'; }).join('') +
    '<tr class="tot"><td>Tổng</td><td>' + hccFmt(C.tong) + '</td><td>100%</td><td>' + hccFmt(hccDiv(C.ol, C.tong), 1) + '%</td><td>' + (hccDl(C.tong, P ? P.tong : null, { neutral: true }) || '—') + '</td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:10px">Số theo lĩnh vực chỉ có ở cấp toàn Thành phố, không tách theo đơn vị.</div>';
  const tk = C.cd + C.dn, tkP = P ? P.cd + P.dn : null;
  const d = hccBig(hccFmt(tk / 1e6, 2), 'triệu tài khoản', hccDl(tk, tkP, { ref: 'so kỳ trước' })) + hccLegend(p, pp) +
    hccCmp('Công dân', C.cd, P ? P.cd : null, Math.max(C.cd, P ? P.cd : 0), hccDl(C.cd, P ? P.cd : null), true) +
    hccCmp('Doanh nghiệp', C.dn, P ? P.dn : null, Math.max(C.cd, P ? P.cd : 0), hccDl(C.dn, P ? P.dn : null)) +
    '<div class="stc-hint" style="margin-top:10px">Số lũy kế đến cuối kỳ (giả định). Tăng thêm trong kỳ: ' + (tkP != null ? hccFmt(tk - tkP) : '—') + ' tài khoản.</div>';
  return '<div class="stc-g2">' +
    hccCard({ title: 'Hồ sơ tiếp nhận theo kênh nộp', sub: hccSubP('hồ sơ'), xa: 'hoso', tree: 'tiepnhan', src: 'totalTrucTuyen · TrucTiep · BCCI', body: a }) +
    hccCard({ title: 'Hồ sơ tiếp nhận qua 6 quý', sub: 'Toàn Thành phố · cột đậm là kỳ đang xem', xa: 'hoso', tree: 'tiepnhan', src: 'thong_ke_theo_linh_vuc', body: b }) +
    '</div><div class="stc-g21 stc-mt">' +
    hccCard({ title: 'Hồ sơ tiếp nhận theo lĩnh vực', sub: HCC_LV.length + ' lĩnh vực · ' + hccPeriodLabel(p), tree: 'linhvuc', src: 'thong_ke_theo_linh_vuc', body: c }) +
    hccCard({ title: 'Tài khoản trên Cổng dịch vụ công', sub: 'Công dân và doanh nghiệp', tree: 'taikhoan', src: 'thong_ke_tai_khoan', body: d }) + '</div>';
}
function hccGroupGq(n) {
  const { C, P, pp } = n;
  const lv = [['Trước hạn', 'th', 'var(--s1)', { neutral: false }], ['Đúng hạn', 'dh', 'var(--s3)', { neutral: true }], ['Trễ hạn', 'tre', 'var(--s2)', { inv: true }]];
  const a = hccBig(hccFmt(C.gq), 'hồ sơ', hccDl(C.gq, P ? P.gq : null, { neutral: true, ref: pp != null ? 'so kỳ trước (' + hccFmt(P.gq) + ')' : '' })) +
    hccStack(lv.map((l) => ({ v: C[l[1]], c: l[2], l: l[0] }))) +
    '<div class="stc-hint" style="margin-bottom:12px">Trước hạn + đúng hạn + trễ hạn = hồ sơ đã giải quyết (khớp số đã giải quyết theo lĩnh vực).</div>' +
    '<table class="stc-tbl"><thead><tr><th>Kết quả</th><th>' + hccE(hccPeriodShort(n.p)) + '</th><th>Tỷ trọng</th><th>So kỳ trước</th></tr></thead><tbody>' +
    lv.map((l) => '<tr><td><i class="stc-sw" style="background:' + l[2] + '"></i>' + l[0] + '</td><td>' + hccFmt(C[l[1]]) + '</td><td>' + hccFmt(hccDiv(C[l[1]], C.gq), 2) + '%</td><td>' + (hccDl(C[l[1]], P ? P[l[1]] : null, l[3]) || '—') + '</td></tr>').join('') + '</tbody></table>';
  const dAll = hccDiv(C.dung, C.gq), dAllP = P ? hccDiv(P.dung, P.gq) : null;
  const under = hccUnits().filter((r) => r.v[n.p].gq >= HCC_XA_MIN_DEN && hccDiv(r.v[n.p].th + r.v[n.p].dh, r.v[n.p].gq) < 98).length;   // chỉ xét đơn vị đủ ngưỡng mẫu số
  const b = hccBig(hccFmt(dAll, 2), '%', hccDl(dAll, dAllP, { rate: true, d: 2, ref: P ? 'so kỳ trước (' + hccFmt(dAllP, 2) + '%)' : '' })) +
    HCC_KHOI.map((k) => hccPg(k[1], hccFmt(C['dung@' + k[0]]) + ' / ' + hccFmt(C['gq@' + k[0]]), hccDiv(C['dung@' + k[0]], C['gq@' + k[0]]), null, HCC_KHOI_COLOR[k[0]], 2)).join('') +
    '<div class="stc-hint" style="margin-top:10px">Thang 0–100%, các khối đều sát 100% nên nhìn số là chính. ' + under + ' đơn vị dưới 98% (bấm tiêu đề thẻ để xem).</div>';
  const lvRows = C.lv.slice().sort((x, y) => y.ton - x.ton);
  const c = '<table class="stc-tbl"><thead><tr><th>Lĩnh vực</th><th>Kỳ trước chuyển sang</th><th>Tiếp nhận</th><th>Đã giải quyết</th><th>Còn tồn</th><th>Tỷ lệ giải quyết</th></tr></thead><tbody>' +
    lvRows.map((x) => '<tr><td>' + hccE(x.name) + '</td><td>' + hccFmt(x.kt) + '</td><td>' + hccFmt(x.tong) + '</td><td>' + hccFmt(x.ht) + '</td><td><b>' + hccFmt(x.ton) + '</b></td><td>' + hccFmt(hccDiv(x.ht, x.kt + x.tong), 1) + '%</td></tr>').join('') +
    '<tr class="tot"><td>Tổng</td><td>' + hccFmt(C.kt) + '</td><td>' + hccFmt(C.tong) + '</td><td>' + hccFmt(C.ht) + '</td><td>' + hccFmt(C.ton) + '</td><td>' + hccFmt(hccDiv(C.ht, C.kt + C.tong), 1) + '%</td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:10px">Còn tồn = kỳ trước chuyển sang + tiếp nhận − đã giải quyết (form tự tính). Tồn cuối quý này chính là số chuyển sang đầu quý sau. Tỷ lệ giải quyết = đã giải quyết ÷ (chuyển sang + tiếp nhận).</div>';
  const top = hccTopUnits(n, (o) => o.tre, null, 10);
  const mxT = top.length ? top[0].v : 1;
  const d = top.map((x) => '<div class="sgd-rt"><div class="sgd-nm"><button type="button" class="sgd-xbtn" onclick="hccXaOpen(\'trehan\',' + hccJs(x.r.name) + ')">' + hccE(x.r.name) + '</button><small>' + hccE(hccKindLabel(x.r.kind)) + ' · ' + hccFmt(x.o.gq) + ' hồ sơ đã giải quyết</small></div><div class="sgd-tk"><i style="width:' + ((x.v / mxT) * 100).toFixed(1) + '%;background:var(--s2)"></i></div><div class="sgd-r">' + hccFmt(x.v) + '</div><span class="stc-hint" style="justify-self:end">' + hccFmt(hccDiv(x.v, x.o.gq), 2) + '%</span></div>').join('') +
    '<div class="stc-hint" style="margin-top:8px">Số hồ sơ trễ hạn nhiều thường do quy mô lớn; xem thêm tỷ lệ trễ hạn (cột phải). Bấm tên để mở hồ sơ đơn vị và danh sách hồ sơ trễ.</div>';
  /* Hồ sơ đang xử lý cuối kỳ: còn trong hạn / đã quá hạn (đang xử lý trễ hạn), theo khối */
  const xR = hccDiv(C.dxlt, C.dxl), xRP = P ? hccDiv(P.dxlt, P.dxl) : null;
  const e = hccBig(hccFmt(C.dxlt), 'hồ sơ', hccDl(C.dxlt, P ? P.dxlt : null, { inv: true, ref: pp != null ? 'so kỳ trước (' + hccFmt(P.dxlt) + ')' : '' })) +
    '<div class="stc-hint" style="margin-bottom:8px">Đang xử lý trễ hạn = hồ sơ chưa trả kết quả mà đã quá hạn xử lý tại ngày cuối kỳ. Chiếm ' + hccFmt(xR, 1) + '% trong ' + hccFmt(C.dxl) + ' hồ sơ đang xử lý' + (xRP != null ? ' (kỳ trước ' + hccFmt(xRP, 1) + '%)' : '') + '.</div>' +
    hccStack([{ v: C.dxlth, c: 'var(--s3)', l: 'Còn trong hạn' }, { v: C.dxlt, c: 'var(--s2)', l: 'Đã quá hạn' }]) +
    '<table class="stc-tbl" style="margin-top:12px"><thead><tr><th>Khối</th><th>Đang xử lý</th><th>Đã quá hạn</th><th>Tỷ lệ quá hạn</th><th>So kỳ trước</th></tr></thead><tbody>' +
    HCC_KHOI.map((k) => { const s = '@' + k[0], r = hccDiv(C['dxlt' + s], C['dxl' + s]), rp = P ? hccDiv(P['dxlt' + s], P['dxl' + s]) : null; return '<tr><td><i class="stc-sw" style="background:' + HCC_KHOI_COLOR[k[0]] + '"></i>' + k[1] + '</td><td>' + hccFmt(C['dxl' + s]) + '</td><td>' + hccFmt(C['dxlt' + s]) + '</td><td>' + hccFmt(r, 1) + '%</td><td>' + (hccDl(r, rp, { rate: true, inv: true }) || '—') + '</td></tr>'; }).join('') +
    '<tr class="tot"><td>Toàn Thành phố</td><td>' + hccFmt(C.dxl) + '</td><td>' + hccFmt(C.dxlt) + '</td><td>' + hccFmt(xR, 1) + '%</td><td>' + (hccDl(xR, xRP, { rate: true, inv: true }) || '—') + '</td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:10px">Số hồ sơ đang xử lý cuối kỳ bằng số còn tồn cuối kỳ. Khác với hồ sơ giải quyết trễ hạn (đã trả kết quả nhưng muộn), đây là hồ sơ còn đang chậm, cần đôn đốc ngay.</div>';
  const topX = hccTopUnits(n, (o) => o.dxlt, null, 10);
  const mxX = topX.length && topX[0].v ? topX[0].v : 1;
  const f = topX.map((x) => '<div class="sgd-rt"><div class="sgd-nm"><button type="button" class="sgd-xbtn" onclick="hccXaOpen(\'dangxltre\',' + hccJs(x.r.name) + ')">' + hccE(x.r.name) + '</button><small>' + hccE(hccKindLabel(x.r.kind)) + ' · ' + hccFmt(x.o.dxl) + ' hồ sơ đang xử lý</small></div><div class="sgd-tk"><i style="width:' + ((x.v / mxX) * 100).toFixed(1) + '%;background:var(--s2)"></i></div><div class="sgd-r">' + hccFmt(x.v) + '</div><span class="stc-hint" style="justify-self:end">' + hccFmt(hccDiv(x.v, x.o.dxl), 1) + '%</span></div>').join('') +
    '<div class="stc-hint" style="margin-top:8px">Cột phải là tỷ lệ quá hạn trên số đang xử lý của đơn vị. Bấm tên để mở hồ sơ đơn vị và danh sách hồ sơ đang xử lý trễ hạn.</div>';
  return '<div class="stc-g2">' +
    hccCard({ title: 'Kết quả giải quyết hồ sơ', sub: hccSubP('hồ sơ'), xa: 'giaiquyet', tree: 'giaiquyet', src: 'ttgqhs', body: a }) +
    hccCard({ title: 'Tỷ lệ giải quyết đúng hạn theo khối', sub: '(Trước hạn + đúng hạn) ÷ đã giải quyết', xa: 'dunghan', tree: 'giaiquyet', src: 'totalTruocHan · totalDungHan', body: b }) +
    '</div><div class="stc-g21 stc-mt">' +
    hccCard({ title: 'Tiếp nhận, giải quyết và tồn theo lĩnh vực', sub: 'Hồ sơ · ' + hccPeriodLabel(n.p) + ' · xếp theo số còn tồn', src: 'totalKyTruoc · total · totalHT', body: c }) +
    hccCard({ title: '10 đơn vị nhiều hồ sơ trễ hạn nhất', sub: 'Số hồ sơ trễ hạn · tỷ lệ trên số đã giải quyết', xa: 'trehan', src: 'totalTreHan', body: d }) + '</div>' +
    '<div class="stc-g2 stc-mt">' +
    hccCard({ title: 'Hồ sơ đang xử lý trễ hạn', sub: 'Tại ngày cuối ' + hccPeriodLabel(n.p).toLowerCase() + ' · theo khối', xa: 'dangxltre', tree: 'dangxl', src: 'date_of_expiration · date_of_completion', body: e }) +
    hccCard({ title: '10 đơn vị nhiều hồ sơ đang xử lý trễ hạn nhất', sub: 'Số hồ sơ quá hạn chưa trả kết quả · tỷ lệ trên số đang xử lý', xa: 'dangxltre', src: 'date_of_expiration', body: f }) + '</div>';
}
function hccGroupDvc(n) {
  const { C, P, pp } = n;
  const mu = [['Trực tuyến toàn trình', 'ttC', 'var(--s1)', {}], ['Trực tuyến một phần', 'mpC', 'var(--s4)', { neutral: true }], ['Chưa trực tuyến', 'cttC', 'var(--s2)', { inv: true }]];
  const a = '<div class="stc-dn" style="margin-top:8px">' + hccDonut(mu.map((m) => ({ v: C[m[1]], c: m[2] })), C.tthcC, hccFmt(C.tthcC), 'thủ tục', 'Mức độ cung cấp trực tuyến') +
    '<table class="stc-tbl"><thead><tr><th>Mức</th><th>Số thủ tục</th><th>Tỷ lệ</th><th>So kỳ trước</th></tr></thead><tbody>' +
    mu.map((m) => '<tr><td><i class="stc-sw" style="background:' + m[2] + '"></i>' + m[0] + '</td><td>' + hccFmt(C[m[1]]) + '</td><td>' + hccFmt(hccDiv(C[m[1]], C.tthcC), 1) + '%</td><td>' + (hccDl(C[m[1]], P ? P[m[1]] : null, m[3]) || '—') + '</td></tr>').join('') + '</tbody></table></div>' +
    '<div class="stc-hint" style="margin-top:12px">Số thủ tục của toàn Thành phố, không cộng các đơn vị vì một thủ tục áp dụng ở nhiều đơn vị.</div>';
  const unitAll = hccDiv(C.tt, C.tthc);
  const lowN = hccUnits().filter((r) => hccDiv(r.v[n.p].tt, r.v[n.p].tthc) < 50).length;
  const b = hccBig(hccFmt(unitAll, 1), '%', hccDl(unitAll, P ? hccDiv(P.tt, P.tthc) : null, { rate: true, ref: 'so kỳ trước' })) +
    '<div class="stc-hint" style="margin-bottom:8px">Bình quân gia quyền theo số thủ tục của từng đơn vị (tổng thủ tục toàn trình ÷ tổng số thủ tục của các đơn vị).</div>' +
    hccKhoiPg(C, 'tt', 'tthc', unitAll) +
    '<div class="stc-hint" style="margin-top:10px">Vạch đen = mức chung ' + hccFmt(unitAll, 1) + '%. ' + lowN + ' đơn vị có dưới 50% thủ tục toàn trình.</div>';
  const pAll = hccDiv(C.ttt, C.tp), pAllP = P ? hccDiv(P.ttt, P.tp) : null;
  const c = hccBig(hccFmt(pAll, 1), '%', hccDl(pAll, pAllP, { rate: true, ref: P ? 'so kỳ trước (' + hccFmt(pAllP, 1) + '%)' : '' })) +
    '<div class="stc-hint" style="margin-bottom:8px">' + hccFmt(C.ttt) + ' / ' + hccFmt(C.tp) + ' hồ sơ có phí, lệ phí được thanh toán trực tuyến; ' + hccFmt(C.tkh) + ' hồ sơ thanh toán hình thức khác.</div>' +
    hccKhoiPg(C, 'ttt', 'tp', pAll);
  const rows = HCC_PERIODS.slice().reverse().map((x) => { const o = hccCityP(x.id); return '<tr' + (x.id === n.p ? ' class="tot"' : '') + '><td>' + hccPeriodLabel(x.id) + '</td><td>' + hccFmt(hccDiv(o.ttC, o.tthcC), 1) + '%</td><td>' + hccFmt(hccDiv(o.ttC + o.mpC, o.tthcC), 1) + '%</td><td>' + hccFmt(hccDiv(o.ttt, o.tp), 1) + '%</td></tr>'; }).join('');
  const d = '<table class="stc-tbl"><thead><tr><th>Kỳ</th><th>Toàn trình</th><th>Có DVC trực tuyến</th><th>Thanh toán trực tuyến</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<div class="stc-hint" style="margin-top:10px">Có DVC trực tuyến = toàn trình + một phần. Dòng in đậm là kỳ đang xem.</div>';
  return '<div class="stc-g2">' +
    hccCard({ title: 'Mức độ cung cấp thủ tục trực tuyến', sub: 'Toàn Thành phố · ' + hccSubP('thủ tục'), xa: 'toantrinh', tree: 'tthc', src: 'tthc_truc_tuyen', body: a }) +
    hccCard({ title: 'Tỷ lệ thủ tục toàn trình theo khối', sub: 'Thủ tục toàn trình ÷ số thủ tục · vạch đen = mức chung', xa: 'toantrinh', tree: 'tthc', src: 'total_TT', body: b }) +
    '</div><div class="stc-g2 stc-mt">' +
    hccCard({ title: 'Thanh toán trực tuyến', sub: 'Hồ sơ có phí, lệ phí · ' + hccPeriodLabel(n.p), xa: 'thanhtoan', tree: 'thanhtoan', src: 'thanh_toan_truc_tuyen', body: c }) +
    hccCard({ title: 'Diễn biến qua 6 quý', sub: 'Tỷ lệ % toàn Thành phố', src: 'tthc_truc_tuyen · thanh_toan_truc_tuyen', body: d }) + '</div>';
}
function hccGroupSh(n) {
  const { C, P, pp } = n;
  const all = hccDiv(C.sh, C.hs), allP = P ? hccDiv(P.sh, P.hs) : null;
  const a = hccBig(hccFmt(all, 1), '%', hccDl(all, allP, { rate: true, ref: pp != null ? 'so kỳ trước (' + hccFmt(allP, 1) + '%)' : '' })) +
    '<div class="stc-hint" style="margin-bottom:8px">' + hccFmt(C.sh) + ' / ' + hccFmt(C.hs) + ' hồ sơ được số hóa khi tiếp nhận; còn ' + hccFmt(C.csh) + ' hồ sơ chưa số hóa.</div>' +
    hccKhoiPg(C, 'sh', 'hs', all) + '<div class="stc-hint" style="margin-top:10px">Vạch đen = mức chung ' + hccFmt(all, 1) + '%.</div>';
  const bk = [[0, 70, '< 70%'], [70, 80, '70 – 80%'], [80, 90, '80 – 90%'], [90, 95, '90 – 95%'], [95, 101, '≥ 95%']];
  const U = hccUnits().filter((r) => r.v[n.p].hs >= HCC_XA_MIN_DEN), rs = U.map((r) => hccDiv(r.v[n.p].sh, r.v[n.p].hs));   // bỏ đơn vị dưới ngưỡng mẫu số
  const mxB = Math.max.apply(null, bk.map((b) => rs.filter((v) => v >= b[0] && v < b[1]).length).concat([1]));
  const b = bk.map((b, i) => { const c = rs.filter((v) => v >= b[0] && v < b[1]).length; return '<div class="sgd-rt"><div class="sgd-nm">' + b[2] + '<small>' + (i < 2 ? 'cần đôn đốc' : i === 4 ? 'đạt mức cao' : '') + '</small></div><div class="sgd-tk"><i style="width:' + ((c / mxB) * 100).toFixed(1) + '%;background:' + (i < 2 ? 'var(--s2)' : i < 3 ? 'var(--s4)' : 'var(--s1)') + '"></i></div><div class="sgd-r">' + c + '</div><span class="stc-hint" style="justify-self:end">đơn vị</span></div>'; }).join('') +
    '<div class="stc-hint" style="margin-top:8px">' + U.length + ' / ' + (HCC_SO.length + 126) + ' đơn vị có từ ' + HCC_XA_MIN_DEN + ' hồ sơ tiếp nhận trở lên' + (U.length < HCC_SO.length + 126 ? ' (đơn vị nhỏ hơn không xét vì tỷ lệ dễ lệch)' : '') + '. Bấm tiêu đề thẻ để xem đơn vị nào thấp nhất.</div>';
  const c = hccCols(hccSeries((o) => hccDiv(o.sh, o.hs)), (v) => hccFmt(v, 1), 'Tỷ lệ số hóa hồ sơ toàn Thành phố mỗi quý (%).');
  return '<div class="stc-g2">' +
    hccCard({ title: 'Tỷ lệ số hóa hồ sơ theo khối', sub: hccSubP('%'), xa: 'sohoa', tree: 'sohoa', src: 'so_hoa_ho_so', body: a }) +
    hccCard({ title: 'Phân bố đơn vị theo tỷ lệ số hóa', sub: 'Số đơn vị theo khoảng tỷ lệ · ' + hccPeriodLabel(n.p), xa: 'sohoa', src: 'total_SH ÷ total', body: b }) +
    '</div><div class="stc-mt">' + hccCard({ title: 'Tỷ lệ số hóa qua 6 quý', sub: 'Toàn Thành phố · cột đậm là kỳ đang xem', xa: 'sohoa', tree: 'sohoa', src: 'so_hoa_ho_so', body: c }) + '</div>';
}
function hccGroupHl(n) {
  const { C, P, pp } = n;
  const lv = [['Rất hài lòng', 'rhl', 'var(--s1)', {}], ['Hài lòng', 'hl', 'var(--s3)', {}], ['Bình thường', 'bt', 'var(--prev)', { neutral: true }], ['Không hài lòng', 'khl', 'var(--s4)', { inv: true }], ['Rất không hài lòng', 'rkhl', 'var(--s2)', { inv: true }]];
  const rr = (o, k) => (o ? hccDiv(o[k], o.dg) : null);
  const a = hccBig(hccFmt(C.dg), 'lượt đánh giá', hccDl(C.dg, P ? P.dg : null, { neutral: true, ref: pp != null ? 'so kỳ trước' : '' })) + hccStack(lv.map((l) => ({ v: C[l[1]], c: l[2], l: l[0] }))) +
    '<div class="stc-hint" style="margin-bottom:12px">Năm mức cộng lại = tổng lượt đánh giá (khớp).</div>' +
    '<table class="stc-tbl"><thead><tr><th>Mức</th><th>Lượt</th><th>Tỷ lệ</th><th>So kỳ trước</th></tr></thead><tbody>' +
    lv.map((l) => '<tr><td><i class="stc-sw" style="background:' + l[2] + '"></i>' + l[0] + '</td><td>' + hccFmt(C[l[1]]) + '</td><td>' + hccFmt(rr(C, l[1]), 2) + '%</td><td>' + (hccDl(rr(C, l[1]), rr(P, l[1]), Object.assign({ rate: true, d: 2 }, l[3])) || '—') + '</td></tr>').join('') + '</tbody></table>';
  const hAll = hccDiv(C.good, C.dg), hAllP = P ? hccDiv(P.good, P.dg) : null;
  const b = hccBig(hccFmt(hAll, 2), '%', hccDl(hAll, hAllP, { rate: true, d: 2, ref: 'so kỳ trước' })) +
    HCC_KHOI.map((k) => { const g = C['rhl@' + k[0]] + C['hl@' + k[0]]; return hccPg(k[1], hccFmt(g) + ' / ' + hccFmt(C['dg@' + k[0]]), hccDiv(g, C['dg@' + k[0]]), null, HCC_KHOI_COLOR[k[0]], 2); }).join('') +
    '<div class="stc-hint" style="margin-top:10px">Tỷ lệ hài lòng = (rất hài lòng + hài lòng) ÷ lượt đánh giá.</div>';
  const top = hccTopUnits(n, (o) => (o.dg >= 50 ? hccDiv(o.khl + o.rkhl, o.dg) : null), null, 8);
  const mxT = top.length ? top[0].v : 1;
  const c = top.map((x) => '<div class="sgd-rt"><div class="sgd-nm"><button type="button" class="sgd-xbtn" onclick="hccXaOpen(\'khonghl\',' + hccJs(x.r.name) + ')">' + hccE(x.r.name) + '</button><small>' + hccFmt(x.o.khl + x.o.rkhl) + ' / ' + hccFmt(x.o.dg) + ' lượt</small></div><div class="sgd-tk"><i style="width:' + ((x.v / mxT) * 100).toFixed(1) + '%;background:var(--s2)"></i></div><div class="sgd-r">' + hccFmt(x.v, 2) + '%</div><span></span></div>').join('') +
    '<div class="stc-hint" style="margin-top:8px">Chỉ xét đơn vị có từ 50 lượt đánh giá trở lên. Mức chung ' + hccFmt(hccDiv(C.bad, C.dg), 2) + '%.</div>';
  const dAll = hccDiv(C.dg, C.gq), dAllP = P ? hccDiv(P.dg, P.gq) : null;
  const d = hccBig(hccFmt(dAll, 1), '%', hccDl(dAll, dAllP, { rate: true, ref: 'so kỳ trước' })) + '<div class="stc-hint" style="margin-bottom:8px">' + hccFmt(C.dg) + ' lượt đánh giá ÷ ' + hccFmt(C.gq) + ' hồ sơ đã giải quyết.</div>' +
    hccKhoiPg(C, 'dg', 'gq', dAll) + '<div class="stc-hint" style="margin-top:10px">Tỷ lệ thấp thì tỷ lệ hài lòng kém tin cậy; giả định mỗi hồ sơ được đánh giá tối đa một lần.</div>';
  return '<div class="stc-g2">' +
    hccCard({ title: 'Mức độ hài lòng', sub: hccSubP('lượt đánh giá'), xa: 'hailong', tree: 'danhgia', src: 'muc_do_hai_long', body: a }) +
    hccCard({ title: 'Tỷ lệ hài lòng theo khối', sub: hccPeriodLabel(n.p), xa: 'hailong', tree: 'danhgia', src: 'rat_Hai_Long + hai_Long', body: b }) +
    '</div><div class="stc-g2 stc-mt">' +
    hccCard({ title: 'Đơn vị có tỷ lệ không hài lòng cao nhất', sub: '(Không hài lòng + rất không hài lòng) ÷ lượt đánh giá', xa: 'khonghl', src: 'khong_Hai_Long · rat_Khong_Hai_Long', body: c }) +
    hccCard({ title: 'Tỷ lệ hồ sơ được đánh giá', sub: 'Lượt đánh giá ÷ hồ sơ đã giải quyết · vạch đen = mức chung', xa: 'danhgia', src: 'Giả định', warn: true, body: d }) + '</div>';
}

/* ---------- Màn: Chi tiết theo cấp bậc (sơ đồ cây thẻ số) ---------- */
function hccTreeCtx() {
  const n = hccNP();
  const spec = HCC_TREE.find((t) => t.id === HCC_UI.tree) || HCC_TREE[0];
  const ind = hccEvalTree(spec, n.C, n.P);
  const byId = {}, parentOf = {};
  const walk = (x, p) => { byId[x.id] = x; if (p) parentOf[x.id] = p; (x.kids || []).forEach((k) => walk(k, x)); };
  walk(ind, null);
  return { n: n, spec: spec, ind: ind, byId: byId, parentOf: parentOf };
}
function hccNodeDl(x, withRef) { return hccDl(x.now, x.prev, { inv: x.inv, neutral: x.neutral, ref: withRef ? 'so kỳ trước' : '' }); }
function hccOcCard(x, parent, idx, level) {
  const sh = parent && parent.now > 0 && x.now != null ? (x.now / parent.now) * 100 : null;
  let sub = '', barW = 0, hasBar = false;
  if (x.den) { const r = hccDiv(x.now, x.den); sub = hccFmt(r, 1) + '% ' + x.denTxt; barW = r; hasBar = true; }
  else if (sh != null) { sub = hccFmt(sh, 1) + '% ' + (level === 1 ? 'của tổng' : 'của ' + parent.label.toLowerCase()); barW = Math.max(sh, 0.5); hasBar = true; }
  return '<button type="button" class="stc-oc-card' + (HCC_UI.pick === x.id ? ' sel' : '') + '" style="--cc:' + (x.color || HCC_PAL[idx % 5]) + '" onclick="hccPick(\'' + x.id + '\')"><div class="stc-nm">' + hccE(x.label) + '</div><div class="stc-v">' + hccFmt(x.now) + '</div><div class="stc-sh">' + hccE(sub) + '</div>' +
    (hasBar ? '<div class="stc-bar"><i style="width:' + Math.max(0, Math.min(100, barW)).toFixed(2) + '%"></i></div>' : '') + hccNodeDl(x, true) + '</button>';
}
function hccPos(i, n) { return n === 1 ? 'first last' : i === 0 ? 'first' : i === n - 1 ? 'last' : ''; }
function hccOcDiagram(ind) {
  const kids = ind.kids;
  let h = '<div class="stc-oc"><div class="stc-oc-root"><div class="stc-k">' + hccE(ind.label) + '</div><div class="stc-v"><span>' + hccFmt(ind.now) + '</span><small>' + hccE(ind.unit) + '</small></div>' + hccNodeDl(ind, true) + '</div><div class="stc-oc-stem"></div><div class="stc-oc-row">';
  kids.forEach((k, i) => {
    const sub = k.kids || [];
    h += '<div class="stc-oc-c ' + hccPos(i, kids.length) + '" style="flex:' + Math.max(1, sub.length) + '">' + hccOcCard(k, ind, i, 1);
    if (sub.length) h += '<div class="stc-oc-stem"></div><div class="stc-oc-row">' + sub.map((g, j) => '<div class="stc-oc-c ' + hccPos(j, sub.length) + '">' + hccOcCard(g, k, j, 2) + '</div>').join('') + '</div>';
    h += '</div>';
  });
  return h + '</div></div>';
}
function hccNiceStep(range) {
  const p = Math.pow(10, Math.floor(Math.log10(range / 5)));
  let step = 10 * p;
  [1, 2, 5, 10].some((m) => { if (range / (m * p) <= 5) { step = m * p; return true; } return false; });
  return step;
}
function hccWaterfall(T, node) {
  const ind = T.ind;
  let base = ind;
  if (node && node !== ind) base = (node.kids && node.kids.length) ? node : (T.parentOf[node.id] || ind);
  if (!base.kids || !base.kids.length) return { ok: false, sub: base.label, msg: 'Mục này chưa có thành phần con để vẽ cầu nối.' };
  if (!base.kids.every((k) => k.prev != null && k.now != null)) return { ok: false, sub: base.label, msg: 'Chưa có số của kỳ trước nên chưa vẽ được cầu nối. Chọn kỳ mới hơn ở bộ chọn phía trên.' };
  const prevTotal = base.kids.reduce((a, k) => a + k.prev, 0), nowTotal = base.kids.reduce((a, k) => a + k.now, 0);
  const G = nowTotal - prevTotal;
  /* Trục dọc phải bao cả các bậc trung gian: thành phần tăng/giảm bù trừ nhau có thể vượt xa tổng hai kỳ */
  const pts = [prevTotal, nowTotal]; let c0 = prevTotal;
  base.kids.forEach((k) => { c0 += k.now - k.prev; pts.push(c0); });
  const lo0 = Math.min(...pts), hi0 = Math.max(...pts), span = Math.max(hi0 - lo0, Math.abs(G)) || 1;
  const half = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  let floor = Math.floor((lo0 - 0.5 * span) / half) * half;
  if (floor < 0) floor = 0;
  const ceil = Math.ceil((hi0 + 0.15 * span) / half) * half;
  const range = ceil - floor || 1, step = hccNiceStep(range);
  const H = 220, W = 1000, sc = (v) => ((v - floor) / range) * H;
  const n = base.kids.length + 2, colW = W / n, barW = Math.min(70, colW * 0.56);
  const fI = (v) => hccFmt(Math.round(v)), sI = (v) => hccSgn(Math.round(v), 0);
  const steps = [{ id: '', label: 'Kỳ trước', from: floor, to: prevTotal, color: 'var(--prev)', val: fI(prevTotal) }];
  let cum = prevTotal;
  base.kids.forEach((k, i) => { const inc = k.now - k.prev; steps.push({ id: k.id, label: k.label, from: cum, to: cum + inc, color: k.color || HCC_PAL[i % 5], val: sI(inc) }); cum += inc; });
  steps.push({ id: '', label: 'Kỳ này', from: floor, to: nowTotal, color: 'var(--ink2)', val: fI(nowTotal) });
  let bars = '', labels = '', grid = '';
  steps.forEach((s, i) => {
    const left = i * colW + (colW - barW) / 2, lo = Math.min(s.from, s.to), h = Math.max(2, Math.abs(sc(s.to) - sc(s.from)));
    bars += '<div class="stc-bar2' + (s.id && s.id === HCC_UI.pick ? ' sel' : '') + '" style="left:' + left.toFixed(1) + 'px;bottom:' + sc(lo).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;background:' + s.color + '"></div>' +
      '<div class="stc-vl2" style="left:' + left.toFixed(1) + 'px;bottom:' + (sc(lo) + h + 6).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px">' + hccE(s.val) + '</div>' +
      (i < steps.length - 1 ? '<div class="stc-cn" style="left:' + (left + barW).toFixed(1) + 'px;bottom:' + sc(s.to).toFixed(1) + 'px;width:' + (colW - barW).toFixed(1) + 'px"></div>' : '');
    labels += '<span style="width:' + colW.toFixed(1) + 'px">' + hccE(s.label) + '</span>';
  });
  for (let v = Math.ceil(floor / step) * step; v <= ceil; v += step) grid += '<div class="stc-gl2" style="bottom:' + sc(v).toFixed(1) + 'px"></div><div class="stc-gt" style="bottom:' + sc(v).toFixed(1) + 'px">' + hccFmt(Math.round(v)) + '</div>';
  return { ok: true, sub: base.label + ' · ' + (base.unit || ind.unit) + ' · từ ' + hccPeriodLabel(T.n.pp) + ' sang ' + hccPeriodLabel(T.n.p), grid: grid, bars: bars, labels: labels,
    note: 'Cột xám xanh là tổng hai kỳ; cột màu là phần tăng (giảm) của từng thành phần, cộng lại đúng bằng mức thay đổi chung (' + sI(G) + ').' + (floor > 0 ? ' Trục dọc cắt từ ' + fI(floor) + ' để thấy rõ các bậc.' : '') };
}
/* Xu hướng 6 quý của một thẻ: tính lại cây cho từng kỳ (số thật của từng kỳ, không nội suy). */
function hccTrend(T, node) {
  const pts = HCC_PERIODS.slice().reverse().map((per, i) => {
    const C = hccCityP(per.id); let v = null;
    if (C) { const t = hccEvalTree(T.spec, C, null); const f = (x) => (x.id === node.id ? x : (x.kids || []).reduce((a, k) => a || f(k), null)); const m = f(t); v = m ? m.now : null; }
    return { i: i, id: per.id, v: v };
  });
  const has = pts.filter((p) => p.v != null);
  if (has.length < 2) return null;
  const vs = has.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs);
  const span = (mx - mn) || Math.max(mx, 1) * 0.2, lo = Math.max(0, mn - span * 0.8), hi = mx + span * 0.5;
  const yOf = (v) => 30 + (1 - (v - lo) / (hi - lo)) * 160, xOf = (i) => 64 + i * 92;
  const short = (v) => (Math.abs(v) >= 1e6 ? hccFmt(v / 1e6, 2) + ' tr' : Math.abs(v) >= 1e4 ? hccFmt(v / 1000, 1) + ' N' : hccFmt(v));
  let s = '<svg viewBox="0 0 560 250" style="width:100%;height:auto;display:block" role="img" aria-label="Xu hướng 6 quý"><g stroke="var(--line)" stroke-width="1">';
  [hi, (lo + hi) / 2, lo].forEach((v) => { s += '<line x1="64" y1="' + yOf(v).toFixed(1) + '" x2="534" y2="' + yOf(v).toFixed(1) + '"/>'; });
  s += '</g>';
  [hi, (lo + hi) / 2, lo].forEach((v) => { s += '<text class="stc-ax" x="56" y="' + (yOf(v) + 4).toFixed(1) + '" text-anchor="end">' + short(v) + '</text>'; });
  for (let k = 0; k < has.length - 1; k++) s += '<line x1="' + xOf(has[k].i) + '" y1="' + yOf(has[k].v).toFixed(1) + '" x2="' + xOf(has[k + 1].i) + '" y2="' + yOf(has[k + 1].v).toFixed(1) + '" stroke="var(--ink2)" stroke-width="2" stroke-linecap="round"/>';
  pts.forEach((p) => {
    const on = p.id === HCC_UI.period;
    if (p.v != null) s += '<circle cx="' + xOf(p.i) + '" cy="' + yOf(p.v).toFixed(1) + '" r="' + (on ? 7 : 5) + '" fill="' + (on ? 'var(--s1)' : 'var(--prev)') + '" stroke="var(--card)" stroke-width="2"/><text class="stc-vl" x="' + xOf(p.i) + '" y="' + (yOf(p.v) - 13).toFixed(1) + '" text-anchor="middle">' + short(p.v) + '</text>';
    s += '<text class="stc-ax" x="' + xOf(p.i) + '" y="214" text-anchor="middle">' + hccPeriodShort(p.id) + '</text>';
  });
  return s + '</svg>';
}
function hccInherit(T, x, key) { let m = x; while (m) { if (m[key]) return m[key]; m = T.parentOf[m.id]; } return ''; }
function hccRawOf(T, x) {
  const src = hccInherit(T, x, 'src'), parts = src.split(' · ');
  const field = x.field || hccInherit(T, x, 'field') || parts[1] || '';
  const kh = x.f && x.f.length === 1 && x.f[0].indexOf('@') > 0 ? x.f[0].split('@')[1] : null;
  const filt = x.filt || (kh ? 'khối ' + (HCC_KHOI.find((k) => k[0] === kh) || ['', ''])[1].toLowerCase() + ' (level 3)' : T.spec.cityOnly ? 'nút gốc (level 1)' : 'cộng các đơn vị');
  return { ep: parts[0], field: field, filt: filt + ' · ' + hccPeriodShort(T.n.p), val: hccFmt(x.now) };
}
function hccFormulas(T, x) {
  const par = T.parentOf[x.id] || null;
  const F = HCC_SHOW_TECH
    ? ['Nguồn: ' + hccInherit(T, x, 'src') + (x.field ? ' · ' + x.field : '') + '.', T.spec.cityOnly ? 'Lấy số của nút gốc (level 1), kỳ ' + hccPeriodLabel(T.n.p) + '.' : 'Cộng dồn số của các đơn vị lá (sở, ngành và phường/xã), kỳ ' + hccPeriodLabel(T.n.p) + ' (kỳ theo giả định là quý).']
    : [T.spec.cityOnly ? 'Số của toàn Thành phố, ' + hccPeriodLabel(T.n.p) + '.' : 'Cộng dồn số của các sở, ngành và phường/xã, ' + hccPeriodLabel(T.n.p) + '.'];
  if (x.kids && x.kids.length && x.now != null) F.push('Tổng = ' + x.kids.map((k) => hccFmt(k.now)).join(' + ') + ' = ' + hccFmt(x.kids.reduce((a, k) => a + k.now, 0)) + ' (khớp).');
  if (x.now != null && x.prev != null && x.prev) F.push('So với kỳ trước = ' + hccFmt(x.now) + ' ÷ ' + hccFmt(x.prev) + ' − 1 = ' + hccSgn((x.now / x.prev - 1) * 100, 1) + '%.');
  if (x.den) F.push('Tỷ lệ = ' + hccFmt(x.now) + ' ÷ ' + hccFmt(x.den) + ' ' + x.denTxt + ' = ' + hccFmt(hccDiv(x.now, x.den), 2) + '%.' + (x.denPrev ? ' Kỳ trước ' + hccFmt(hccDiv(x.prev, x.denPrev), 2) + '%.' : ''));
  if (par && x.now != null && par.now > 0) {
    F.push('Tỷ trọng = ' + hccFmt(x.now) + ' ÷ ' + hccFmt(par.now) + ' = ' + hccFmt((x.now / par.now) * 100, 2) + '%.');
    if (x.prev != null && par.prev) F.push('Đóng góp vào mức thay đổi = (' + hccFmt(x.now) + ' − ' + hccFmt(x.prev) + ') ÷ ' + hccFmt(par.prev) + ' = ' + hccSgn(((x.now - x.prev) / par.prev) * 100, 2) + ' điểm %.');
  }
  if (x.inv) F.push('Chỉ tiêu này giảm là tốt nên tăng tô đỏ, giảm tô xanh.');
  if (x.neutral) F.push('Tăng hay giảm không tự thân là tốt hay xấu nên để màu trung tính.');
  return F;
}
function hccScreenDetail() {
  const T = hccTreeCtx(), ind = T.ind;
  const node = HCC_UI.pick && T.byId[HCC_UI.pick] ? T.byId[HCC_UI.pick] : ind;
  const g = HCC_GROUPS.find((x) => x.id === T.spec.group);
  const at = HCC_TREE.findIndex((t) => t.id === T.spec.id), N = HCC_TREE.length, prevI = HCC_TREE[(at - 1 + N) % N], nextI = HCC_TREE[(at + 1) % N];
  let h = hccHeader(g ? { group: g.id, label: g.label } : 'home');
  h += '<div style="display:grid;gap:16px;min-width:0">';
  h += '<div class="stc-card"><div class="stc-crumbs"><span>Trung tâm Phục vụ HCC › ' + hccE(g ? g.label : '') + ' › ' + hccE(ind.label) + '</span></div>' +
    '<div class="stc-ch" style="margin-bottom:6px"><div><h3 class="stc-ct" style="font-size:17px">' + hccE(ind.label) + '</h3><div class="stc-cs">' + hccE(ind.unit + ' · ' + hccPeriodLabel(T.n.p) + (T.spec.cityOnly ? ' · số toàn Thành phố (nút gốc)' : ' · cộng dồn các đơn vị')) + '</div></div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end"><span class="stc-hint">' + (at + 1) + ' / ' + N + '</span><button type="button" class="stc-btn" onclick="hccStep(-1)" style="height:32px;padding:0 12px;font-size:12.5px">‹ Trước</button><button type="button" class="stc-btn" onclick="hccStep(1)" style="height:32px;padding:0 12px;font-size:12.5px">Sau ›</button>' + (T.spec.xa ? hccLnk('Theo đơn vị ›', "hccXa('" + T.spec.xa + "')") : '') + (HCC_SHOW_TECH ? '<span class="stc-bd">' + hccE(T.spec.src) + '</span>' : '') + '</div></div>' +
    '<div class="stc-hint" style="margin-bottom:6px">Bấm một thẻ để chọn, bấm lại để bỏ chọn. Chỉ tiêu 3 cấp (ví dụ đã giải quyết → trước/đúng/trễ hạn → khối) mọc thêm hàng thẻ ngay dưới thẻ cha.</div>' + hccOcDiagram(ind) + '</div>';
  const wf = hccWaterfall(T, node);
  h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cầu nối tăng giảm</h3><div class="stc-cs">' + hccE(wf.sub) + '</div></div></div>' +
    (wf.ok ? '<div class="stc-wf">' + wf.grid + wf.bars + '</div><div class="stc-wfl">' + wf.labels + '</div><div class="stc-hint" style="margin-top:12px">' + hccE(wf.note) + '</div>' : hccEmpty('Chưa vẽ được cầu nối', wf.msg)) + '</div>';
  const tr = hccTrend(T, node);
  h += '<div class="stc-g2"><div class="stc-card"><div class="stc-ch" style="margin-bottom:8px"><div><h3 class="stc-ct">Xu hướng 6 quý</h3><div class="stc-cs">' + hccE(node.label) + '</div></div></div>' +
    (tr ? tr + '<div class="stc-hint" style="margin-top:6px">Điểm xanh là kỳ đang xem. Mỗi điểm là số của đúng quý đó, <b>không nội suy</b>; nạp thêm quý thì điểm tự vẽ thêm.</div>' : hccEmpty('Chưa vẽ được xu hướng', 'Cần ít nhất hai kỳ có số.')) + '</div>';
  const rows = node.kids && node.kids.length ? node.kids.map((k) => hccRawOf(T, k)) : [hccRawOf(T, node)];
  /* Bản không kỹ thuật (mặc định): chỉ tên thành phần, giá trị, kỳ trước — không có endpoint/trường dữ liệu */
  const plain = (node.kids && node.kids.length ? node.kids : [node]);
  if (!HCC_SHOW_TECH) h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Số liệu thành phần</h3><div class="stc-cs">' + hccE(node.label + ' · ' + hccPeriodLabel(T.n.p)) + '</div></div></div>' +
    '<table class="stc-tbl"><thead><tr><th>Thành phần</th><th>Kỳ này</th><th>Kỳ trước</th><th>So kỳ trước</th></tr></thead><tbody>' +
    plain.map((k) => '<tr><td>' + hccE(k.label) + '</td><td>' + hccFmt(k.now) + '</td><td>' + hccFmt(k.prev) + '</td><td>' + (hccNodeDl(k) || '—') + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="stc-hint" style="margin-top:12px">' + (T.spec.cityOnly ? 'Số của toàn Thành phố, không cộng các đơn vị.' : 'Mỗi dòng là tổng cộng từ các sở, ngành và phường/xã. Bấm "Theo đơn vị" để xem từng đơn vị.') + '</div></div></div>';
  else h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Số liệu gốc từ API</h3><div class="stc-cs">' + hccE(node.label) + '</div></div></div><div class="sgd-rawh"><span>Endpoint</span><span>Trường dữ liệu</span><span>Lọc</span><span>Giá trị</span></div>' +
    rows.map((r) => '<div class="sgd-raw"><span class="sgd-mono">' + hccE(r.ep) + '</span><span class="sgd-mono">' + hccE(r.field) + '</span><span>' + hccE(r.filt) + '</span><span>' + r.val + '</span></div>').join('') +
    '<div class="stc-hint" style="margin-top:12px">' + (T.spec.cityOnly ? 'Số của nút gốc, không cộng các đơn vị con (số giả lập).' : 'Mỗi dòng là tổng cộng từ các đơn vị lá (số giả lập). Bấm "Theo đơn vị" để xem từng đơn vị.') + '</div></div></div>';
  /* Khối Cách tính ẨN theo cờ chung SHOW_FORMULA_BOX (dashboard-vhtt.js): cách tính để trong tài liệu mô tả, không hiện trên giao diện */
  if (typeof SHOW_FORMULA_BOX === 'undefined' || SHOW_FORMULA_BOX) h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cách tính · ' + hccE(node.label) + '</h3><div class="stc-cs">Công thức tính từ số liệu gốc, không có số nào tự đặt</div></div></div><div class="stc-fl">' +
    hccFormulas(T, node).map((t) => '<div class="stc-note" style="padding:9px 12px;font-size:12.5px">' + hccE(t) + '</div>').join('') + '</div></div>';
  h += '</div><div class="stc-pn"><button type="button" class="stc-btn" onclick="hccStep(-1)">‹ ' + hccE(prevI.label) + '</button><button type="button" class="stc-btn" onclick="hccStep(1)">' + hccE(nextI.label) + ' ›</button></div>';
  return h + hccFoot();
}

/* ---------- Màn: Chỉ tiêu theo đơn vị (các sở/ngành trong HCC_SO + 126 phường/xã) ---------- */
function hccNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }
function hccXaCtx() {
  const X = HCC_UI.xa, n = hccNP();
  const ind = HCC_XA_INDS.find((x) => x.id === X.ind) || HCC_XA_INDS[2];
  const isC = ind.type === 'count', cols = isC ? ind.parts : ind.cols;
  const val = (o) => (!o ? null : isC ? (ind.parts.every((c) => c.f(o) != null) ? ind.parts.reduce((a, c) => a + c.f(o), 0) : null) : hccDiv(ind.num(o), ind.den(o), ind.m));
  const showV = (v) => (v == null ? '—' : hccFmt(v, isC ? 0 : ind.d) + (ind.pct ? '%' : ''));
  const showC = (c, o) => { const v = o ? c.f(o) : null; return v == null ? '—' : hccFmt(v, c.d) + (c.pct ? '%' : ''); };
  const TPn = val(n.C), TPp = n.P ? val(n.P) : null;
  const deltaOf = (v, p) => (v == null || p == null ? null : isC ? (p ? (v / p - 1) * 100 : null) : v - p);
  const clsOf = (x) => {
    if (x == null) return '';
    if (Math.abs(x) < 0.005) return 'stc-dl flat';
    const up = x > 0;
    if (ind.better === 'high') return up ? 'stc-dl up' : 'stc-dl down';
    if (ind.better === 'low') return up ? 'stc-dl up bad' : 'stc-dl down good';
    return up ? 'stc-dl up n' : 'stc-dl down n';
  };
  const dTxt = (x) => (x == null ? '—' : hccFmt(Math.abs(x), isC ? 1 : ind.d) + (isC ? '%' : ind.pct ? ' điểm %' : ''));
  const dKind = isC ? 'rel' : ind.pct ? 'rate' : 'abs';
  /* tp = true: cột so với mức Thành phố (chỉ tiêu số đếm thì cột này là tỷ trọng trong tổng Thành phố) */
  const dTip = (v, p, tp) => ' title="' + hccE(tp && isC ? 'Tỷ trọng: phần của đơn vị này trong tổng toàn Thành phố = số của đơn vị ÷ tổng Thành phố × 100.' : hccDlTip(dKind, ind.better, v, p, ind.d, tp)) + '" style="cursor:help"';
  const all = hccUnits().map((r) => ({ r: r, v: val(r.v[n.p]), p: n.pp != null ? val(r.v[n.pp]) : null, ok: r.v[n.p] && hccXaOk(ind, r.v[n.p]) && val(r.v[n.p]) != null }));
  /* Chỉ xếp hạng đơn vị đủ ngưỡng mẫu số (hccXaOk); đơn vị quá nhỏ: rank = null, hiện "—" */
  const byV = all.filter((x) => x.ok).sort((a, b) => (ind.better === 'low' ? a.v - b.v : b.v - a.v));
  byV.forEach((x, i) => { x.rank = i + 1; });
  all.forEach((x) => { if (!x.ok) x.rank = null; });
  const minD = hccXaMin(ind), nOut = all.length - byV.length;
  return { X: X, n: n, ind: ind, isC: isC, cols: cols, val: val, showV: showV, showC: showC, TPn: TPn, TPp: TPp, deltaOf: deltaOf, clsOf: clsOf, dTxt: dTxt, dTip: dTip, all: all, byV: byV, minD: minD, nOut: nOut };
}
function hccScreenXa() {
  const K = hccXaCtx(), { X, n, ind, isC, cols, showV, showC, TPn, TPp, deltaOf, clsOf, dTxt, dTip, all, byV, minD, nOut } = K;
  const q = hccNorm(X.q);
  const list = all.filter((x) => (X.f === 'all' || x.r.kind === X.f) && (!q || hccNorm(x.r.name).indexOf(q) >= 0));
  const keyOf = (x) => {
    if (X.sk === 'name') return x.r.name;
    if (X.sk === 'd') { const d = deltaOf(x.v, x.p); return d == null ? -1e9 : d; }
    if (X.sk === 's') return x.v == null ? -1e9 : x.v;
    if (X.sk.charAt(0) === 'c') { const v = cols[+X.sk.slice(1)].f(x.r.v[n.p]); return v == null ? -1e9 : v; }
    return x.v == null ? -1e9 : x.v;
  };
  /* Sắp theo giá trị / so kỳ trước / so Thành phố: đơn vị không xếp hạng (dưới ngưỡng mẫu số) luôn nằm cuối bảng */
  const tailOut = X.sk === 'v' || X.sk === 's' || X.sk === 'd';
  list.sort((a, b) => { if (tailOut && a.ok !== b.ok) return a.ok ? -1 : 1; const ka = keyOf(a), kb = keyOf(b); return (typeof ka === 'string' ? ka.localeCompare(kb, 'vi') : ka - kb) * X.sd; });
  X.order = list.map((x) => x.r.name);
  const selName = X.sel && all.some((x) => x.r.name === X.sel) ? X.sel : null;
  const arrow = (k) => (X.sk === k ? (X.sd > 0 ? ' ↑' : ' ↓') : '');
  const heads = [{ l: 'Đơn vị', k: 'name' }].concat(cols.map((c, i) => ({ l: c.label, k: 'c' + i }))).concat([{ l: ind.vh, k: 'v' }, { l: 'So kỳ trước', k: 'd' }, { l: isC ? 'Tỷ trọng TP' : 'So với TP', k: 's' }]);
  const grid = '40px minmax(160px,1.8fr) ' + cols.map(() => 'minmax(0,1fr)').join(' ') + ' minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';

  let nav = '<div class="stc-card hcc-nav" style="padding:12px 8px 14px"><div class="hcc-nav-in"><div class="stc-nvh">Chỉ tiêu</div>';
  HCC_GROUPS.forEach((g) => {
    nav += '<div class="stc-nvg">' + hccE(g.label) + '</div>' + HCC_XA_INDS.filter((x) => x.g === g.id).map((x) => '<button type="button" class="stc-nvi' + (x.id === ind.id ? ' on' : '') + '" onclick="hccXaInd(\'' + x.id + '\')">' + hccE(x.label) + '</button>').join('');
  });
  nav += '</div></div>';

  const best = byV[0], worst = byV[byV.length - 1], dTP = deltaOf(TPn, TPp);
  const chips = [{ k: 'Toàn Thành phố', v: showV(TPn), s: dTP == null ? 'Chưa có kỳ so sánh' : Math.abs(dTP) < 0.005 ? 'Không đổi so kỳ trước' : (dTP > 0 ? '▲ ' : '▼ ') + dTxt(dTP) + ' so kỳ trước' }];
  if (isC) chips.push({ k: 'Bình quân mỗi đơn vị', v: hccFmt(TPn / all.length), s: ind.unit || '' });
  chips.push({ k: ind.better === 'low' ? 'Tốt nhất (thấp nhất)' : 'Cao nhất', v: showV(best.v), s: hccShortName(best.r.name) });
  chips.push({ k: ind.better === 'low' ? 'Kém nhất (cao nhất)' : 'Thấp nhất', v: showV(worst.v), s: hccShortName(worst.r.name) });
  if (!isC) chips.push({ k: ind.better === 'none' ? 'Dưới mức Thành phố' : 'Kém hơn mức Thành phố', v: byV.filter((x) => ind.better === 'low' ? x.v > TPn : x.v < TPn).length + ' / ' + byV.length, s: nOut ? 'đơn vị được xếp hạng' : 'đơn vị' });
  const desc = (isC ? 'Số của từng đơn vị lá trong cây đơn vị' : 'Tính = ' + ind.numL + ' ÷ ' + ind.denL + (ind.pct ? ' × 100' : '') + '; mức Thành phố là bình quân gia quyền') + ' · ' + hccPeriodLabel(n.p);
  let right = '<div class="stc-card"><div class="stc-crumbs"><span>Trung tâm Phục vụ HCC › ' + hccE((HCC_GROUPS.find((g) => g.id === ind.g) || {}).label || '') + ' › ' + hccE(ind.label) + ' › theo đơn vị</span></div>' +
    '<div class="stc-ch" style="margin-bottom:12px"><div><h3 class="stc-ct" style="font-size:17px">' + hccE(ind.label) + '</h3><div class="stc-cs">' + hccE(desc) + '</div></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + (ind.tree ? hccLnk('Chi tiết theo cấp bậc ›', "hccDetail('" + ind.tree + "')") : '') + (HCC_SHOW_TECH ? '<span class="stc-bd">' + hccE(ind.src) + '</span>' : '') + '</div></div>' +
    '<div class="stc-mchips" style="margin-bottom:0">' + chips.map((c) => '<div class="stc-mchip"><div class="stc-k">' + hccE(c.k) + '</div><div class="stc-v">' + c.v + '</div><div class="stc-hint">' + hccE(c.s) + '</div></div>').join('') + '</div></div>';

  const cnt = (k) => all.filter((x) => x.r.kind === k).length;
  right += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px;align-items:center"><div class="sgd-pills">' +
    [['all', 'Tất cả · ' + all.length], ['so', 'Sở, ngành · ' + cnt('so')], ['p', 'Phường · ' + cnt('p')], ['x', 'Xã · ' + cnt('x')]].map((f) => '<button type="button" class="sgd-pill' + (X.f === f[0] ? ' on' : '') + '" onclick="hccXaF(\'' + f[0] + '\')">' + f[1] + '</button>').join('') +
    '</div><label class="sgd-search"><small>Tìm</small><input id="hccQ" type="text" value="' + hccE(X.q) + '" oninput="hccXaQ(this.value)" placeholder="Tên đơn vị, gõ không dấu" aria-label="Tìm đơn vị"></label></div>' +
    '<div class="sgd-xt-box"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + grid + '"><span>Hạng</span>' +
    heads.map((hd, i) => '<button type="button" class="sgd-hbtn' + (i === 0 ? ' left' : '') + '" onclick="hccXaSort(\'' + hd.k + '\')">' + hccE(hd.l) + '<span>' + arrow(hd.k) + '</span></button>').join('') + '</div>' +
    list.map((x) => {
      const d = deltaOf(x.v, x.p), s = x.v == null ? null : isC ? (x.v / TPn) * 100 : x.v - TPn;
      return '<div class="sgd-xt-row' + (x.r.name === selName ? ' on' : '') + '" style="grid-template-columns:' + grid + '"><span class="sgd-no"' + (x.rank == null ? ' title="' + hccE('Không xếp hạng: ' + ind.denL.toLowerCase() + ' dưới ' + minD + '') + '" style="cursor:help"' : '') + '>' + (x.rank == null ? '—' : x.rank) + '</span><button type="button" class="sgd-xbtn" onclick="hccXaSel(' + hccJs(x.r.name) + ')" title="' + hccE(x.r.name) + '">' + (x.r.kind === 'so' ? '<i class="hcc-tag">Sở</i>' : '') + hccE(x.r.name) + '</button>' +
        cols.map((c) => '<span class="sgd-num">' + showC(c, x.r.v[n.p]) + '</span>').join('') +
        '<span class="sgd-num sgd-strong">' + showV(x.v) + '</span><span class="sgd-num"><span class="' + clsOf(d) + '"' + (d == null ? '' : dTip(x.v, x.p)) + '>' + dTxt(d) + '</span></span>' +
        '<span class="sgd-num"><span class="' + (isC ? '' : clsOf(s)) + '"' + (s == null ? '' : dTip(x.v, TPn, true)) + '>' + (s == null ? '—' : isC ? hccFmt(s, 2) + '%' : hccFmt(Math.abs(s), ind.d) + (ind.pct ? ' điểm %' : '')) + '</span></span></div>';
    }).join('') + '</div>' +
    '<div class="stc-hint" style="margin-top:10px">Đang hiện ' + list.length + ' / ' + all.length + ' đơn vị. ' + (ind.better === 'none' ? 'Chỉ tiêu này không xếp tốt/xấu, hạng theo giá trị từ cao xuống thấp.' : ind.better === 'low' ? 'Chỉ tiêu càng thấp càng tốt: hạng 1 là thấp nhất.' : 'Chỉ tiêu càng cao càng tốt: hạng 1 là cao nhất.') +
    (nOut ? ' ' + nOut + ' đơn vị có ' + ind.denL.toLowerCase() + ' dưới ' + minD + ' không được xếp hạng (cột Hạng để "—", nằm cuối bảng khi sắp theo giá trị) vì tỷ lệ trên quá ít hồ sơ dễ lệch, nhưng vẫn được cộng vào mức Thành phố.' : '') + ' Bấm tên đơn vị để mở hồ sơ.</div></div>';

  let h = hccHeader('home');
  h += '<div class="stc-explore">' + nav + '<div style="display:grid;gap:16px;min-width:0">' + right + '</div></div>';
  h += '<div class="stc-mt">' + hccNote('<b>Cách tạo số giả lập:</b> tổng Thành phố chia cho ' + HCC_SO.length + ' sở, ngành và 126 phường/xã theo quy mô (phường/xã theo số học sinh trong file "SỐ LIỆU TRƯỜNG HỌC" 07/2026 thay cho dân số), có nhiễu ngẫu nhiên cố định. Mỗi đơn vị có một mức chất lượng cố định nên đơn vị tốt ở quý này thường vẫn tốt ở quý sau. Số cộng lại khớp tổng, số con không vượt số cha. Khi có số liệu thật chỉ thay nguồn, giữ nguyên cách hiển thị.' + (HCC_SHOW_TECH ? ' Ghép đơn vị qua id/parentId của cây đơn vị; ttgqhs ghép qua department_code (cần bảng đối chiếu mã).' : '')) + '</div>';
  if (selName) h += hccXaDrawerHtml(K, selName);
  return h + hccFoot();
}
function hccXaDrawerHtml(K, selName) {
  const X = K.X, at = X.order.indexOf(selName), N = X.order.length;
  const nav = (d, label) => { const ok = at >= 0 && at + d >= 0 && at + d < N; return '<button type="button" class="sgd-dw-nav"' + (ok ? ' onclick="hccXaStep(' + d + ')"' : ' disabled') + '>' + label + '</button>'; };
  const anim = X.anim ? ' sgd-dw-anim' : '';
  X.anim = false;
  return '<div class="sgd-dw-bg' + anim + '" onclick="hccXaSel(null)"></div>' +
    '<aside class="sgd-dw' + anim + '" role="dialog" aria-label="Hồ sơ ' + hccE(selName) + '">' +
    '<div class="sgd-dw-top">' + nav(-1, '‹ Trước') + nav(1, 'Sau ›') + '<span class="sgd-dw-pos">' + (at >= 0 ? (at + 1) + ' / ' + N : '') + '</span>' +
    '<button type="button" class="sgd-dw-x" onclick="hccXaSel(null)" title="Đóng (Esc)" aria-label="Đóng">×</button></div>' +
    '<div class="sgd-dw-body">' + hccXaProfileHtml(K, selName) + '</div></aside>';
}
function hccXaProfileHtml(K, selName) {
  const { n, ind, isC, showV, showC, TPn, deltaOf, clsOf, dTxt, dTip, all, byV, minD } = K;
  const sx = all.find((x) => x.r.name === selName), sr = sx.r, oN = sr.v[n.p], oP = n.pp != null ? sr.v[n.pp] : null;
  const sd = deltaOf(sx.v, sx.p), sdiff = sx.v == null || isC ? null : sx.v - TPn;
  const parts = isC
    ? ind.parts.map((c) => ({ l: c.label, v: showC(c, oN), p: showC(c, oP), tp: hccFmt(c.f(n.C)) }))
    : [{ l: ind.numL, v: hccFmt(ind.num(oN)), p: oP ? hccFmt(ind.num(oP)) : '—', tp: hccFmt(ind.num(n.C)) }, { l: ind.denL, v: hccFmt(ind.den(oN)), p: oP ? hccFmt(ind.den(oP)) : '—', tp: hccFmt(ind.den(n.C)) }, { l: ind.label, v: showV(sx.v), p: showV(sx.p), tp: showV(TPn) }]
      .concat(ind.cols.filter((c) => c.pct).map((c) => ({ l: c.label, v: showC(c, oN), p: showC(c, oP), tp: showC(c, n.C) })));
  const pg = 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';
  const chips = [['Hồ sơ tiếp nhận', hccFmt(oN.hs)], ['Đã giải quyết', hccFmt(oN.gq)], ['Đúng hạn', hccFmt(hccDiv(oN.th + oN.dh, oN.gq), 2) + '%'], ['Toàn trình', hccFmt(hccDiv(oN.tt, oN.tthc), 1) + '%'], ['Số hóa', hccFmt(hccDiv(oN.sh, oN.hs), 1) + '%'], ['Hài lòng', hccFmt(hccDiv(oN.rhl + oN.hl, oN.dg), 1) + '%']];
  let h = '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct" style="font-size:17px">' + hccE(sr.name) + '</h3><div class="stc-cs">' + (sx.rank == null ? 'Không xếp hạng theo ' + hccE(ind.label.toLowerCase()) + ' (' + hccE(ind.denL.toLowerCase()) + ' dưới ' + minD + ')' : 'Hạng ' + sx.rank + ' / ' + byV.length + ' theo ' + hccE(ind.label.toLowerCase())) + ' · ' + hccKindLabel(sr.kind) + ' · ' + hccPeriodLabel(n.p) + '</div></div>' + (HCC_SHOW_TECH ? '<span class="stc-bd">id · parentId</span>' : '') + '</div>' +
    hccBig(showV(sx.v) + (isC && ind.unit ? ' <small>' + hccE(ind.unit) + '</small>' : ''), '', isC ? (sd == null ? '' : '<span class="' + clsOf(sd) + '"' + dTip(sx.v, sx.p) + '>' + dTxt(sd) + ' <span class="stc-ref">so kỳ trước · chiếm ' + hccFmt((sx.v / TPn) * 100, 2) + '% Thành phố</span></span>') : (sdiff == null ? '' : '<span class="' + clsOf(sdiff) + '"' + dTip(sx.v, TPn, true) + '>' + hccFmt(Math.abs(sdiff), ind.d) + (ind.pct ? ' điểm %' : '') + ' <span class="stc-ref">so mức Thành phố (' + showV(TPn) + ')</span></span>')) +
    '<div class="stc-mchips" style="margin-top:14px">' + chips.map((c) => '<div class="stc-mchip"><div class="stc-k">' + c[0] + '</div><div class="stc-v">' + c[1] + '</div></div>').join('') + '</div>' +
    '<div class="stc-sec" style="margin:6px 0 8px">Thành phần của chỉ tiêu</div>' +
    '<div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + pg + '"><span>Thành phần</span><span class="sgd-num">' + hccE(hccShortName(sr.name)) + '</span><span class="sgd-num">Kỳ trước</span><span class="sgd-num">Toàn Thành phố</span></div>' +
    parts.map((p) => '<div class="sgd-xt-row" style="grid-template-columns:' + pg + '"><span>' + hccE(p.l) + '</span><span class="sgd-num"><b>' + p.v + '</b></span><span class="sgd-num">' + p.p + '</span><span class="sgd-num">' + p.tp + '</span></div>').join('');
  if (ind.procs) {
    const L = hccProcList(sr, n.p);
    const cls = { 'Toàn trình': 'hcc-mu ok', 'Một phần': 'hcc-mu mid', 'Chưa trực tuyến': 'hcc-mu no' };
    h += '<div class="stc-sec" style="margin:22px 0 8px">Mức cung cấp trực tuyến · ví dụ ' + L.length + ' / ' + hccFmt(oN.tthc) + ' thủ tục (' + (HCC_SHOW_TECH ? 'tthc_truc_tuyen_detail, ' : '') + 'tên thủ tục là tên mẫu)</div>' +
      '<div class="sgd-xt-box" style="max-height:420px"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:minmax(0,3fr) minmax(0,1fr)"><span>Thủ tục</span><span>Mức</span></div>' +
      L.map((x) => '<div class="sgd-xt-row" style="grid-template-columns:minmax(0,3fr) minmax(0,1fr)"><span>' + hccE(x.name) + '</span><span><i class="' + cls[x.muc] + '">' + hccE(x.muc) + '</i></span></div>').join('') + '</div>' +
      '<div class="stc-hint" style="margin-top:10px">Đơn vị có ' + hccFmt(oN.tt) + ' thủ tục toàn trình, ' + hccFmt(oN.mp) + ' một phần, ' + hccFmt(oN.ctt) + ' chưa trực tuyến. Danh sách ví dụ chia ba mức theo đúng tỷ lệ đó.</div>';
  } else if (ind.openLate) {
    const L = hccOpenLateList(sr, n.p, 40);
    const lg = 'minmax(0,1.25fr) minmax(0,1.9fr) minmax(0,1fr) minmax(0,.8fr) minmax(0,1.1fr) 64px';
    h += '<div class="stc-sec" style="margin:22px 0 8px">Hồ sơ đang xử lý trễ hạn tại cuối kỳ · ' + (L.length < oN.dxlt ? 'hiện ' + L.length + ' / ' : '') + hccFmt(oN.dxlt) + ' hồ sơ (số liệu mẫu)</div>' +
      (L.length ? '<div class="sgd-xt-box" style="max-height:420px"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + lg + '"><span>Mã hồ sơ</span><span>Thủ tục</span><span>Người nộp</span><span>Hạn xử lý</span><span>Trạng thái</span><span class="sgd-num">Quá hạn</span></div>' +
        L.map((x) => '<div class="sgd-xt-row" style="grid-template-columns:' + lg + '"><span class="sgd-mono">' + hccE(x.code) + '</span><span>' + hccE(x.tthc) + '</span><span>' + hccE(x.applicant) + '</span><span>' + x.exp + '</span><span>' + hccE(x.status) + '</span><span class="sgd-num"><b style="color:var(--bad)">' + x.late + ' ngày</b></span></div>').join('') + '</div>' +
        '<div class="stc-hint" style="margin-top:10px">Hồ sơ chưa trả kết quả, đã quá hạn xử lý tính đến ngày cuối kỳ; xếp quá hạn nhiều nhất trước. Tên người nộp đã che bớt; mã hồ sơ, tên thủ tục và ngày tháng là số liệu mẫu.</div>'
        : hccEmpty('Không có hồ sơ đang xử lý trễ hạn', 'Đơn vị không có hồ sơ quá hạn chưa trả kết quả tại cuối kỳ này.'));
  } else {
    const L = hccLateList(sr, n.p, 40);
    const lg = 'minmax(0,1.25fr) minmax(0,1.9fr) minmax(0,1fr) minmax(0,.8fr) minmax(0,.8fr) 56px';
    h += '<div class="stc-sec" style="margin:22px 0 8px">Hồ sơ trễ hạn trong kỳ · ' + (L.length < oN.tre ? 'hiện ' + L.length + ' / ' : '') + hccFmt(oN.tre) + ' hồ sơ (' + (HCC_SHOW_TECH ? 'ttgqhs_detail, ' : '') + 'số liệu mẫu)</div>' +
      (L.length ? '<div class="sgd-xt-box" style="max-height:420px"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + lg + '"><span>Mã hồ sơ</span><span>Thủ tục</span><span>Người nộp</span><span>Hạn trả</span><span>Đã trả</span><span class="sgd-num">Trễ</span></div>' +
        L.map((x) => '<div class="sgd-xt-row" style="grid-template-columns:' + lg + '"><span class="sgd-mono">' + hccE(x.code) + '</span><span>' + hccE(x.tthc) + '</span><span>' + hccE(x.applicant) + '</span><span>' + x.exp + '</span><span>' + x.done + '</span><span class="sgd-num"><b style="color:var(--bad)">' + x.late + ' ngày</b></span></div>').join('') + '</div>' +
        '<div class="stc-hint" style="margin-top:10px">Xếp theo số ngày trễ, nhiều nhất trước. Tên người nộp đã che bớt; mã hồ sơ, tên thủ tục và ngày tháng là số liệu mẫu.</div>'
        : hccEmpty('Không có hồ sơ trễ hạn', 'Đơn vị không có hồ sơ trễ hạn trong kỳ này.'));
  }
  return h + '</div>';
}

/* ---------- Màn: Nguồn dữ liệu, giả định, quy tắc trình bày ---------- */
function hccScreenSrc() {
  const eps = [
    ['thong_ke_theo_linh_vuc', 'name, total, totalTrucTuyen, totalTrucTiep, totalBCCI, totalKyTruoc, totalHT', 'Hồ sơ tiếp nhận, kênh nộp, tồn, đã giải quyết theo lĩnh vực'],
    ['ttgqhs', 'department_code, department_name, totalTruocHan, totalDungHan, totalTreHan', 'Kết quả giải quyết, tỷ lệ đúng hạn, trễ hạn theo đơn vị'],
    ['ttgqhs_detail', 'code, applicant_name, formalities_name, date_of_reception, date_of_expiration, date_of_completion, status', 'Danh sách hồ sơ trễ hạn trong hồ sơ đơn vị'],
    ['tthc_truc_tuyen', 'id, parentId, level, total, total_TT, total_1Phan, total_ChuaTT', 'Mức độ cung cấp thủ tục trực tuyến'],
    ['tthc_truc_tuyen_detail', 'formalitiesCode, formalitiesName, unit_id', 'Danh mục thủ tục theo đơn vị'],
    ['thanh_toan_truc_tuyen', 'id, parentId, level, total, total_TT, total_Other', 'Thanh toán trực tuyến'],
    ['so_hoa_ho_so', 'id, parentId, level, total, total_SH', 'Số hóa hồ sơ, số hồ sơ tiếp nhận theo đơn vị'],
    ['muc_do_hai_long', 'id, parentId, level, total, rat_Hai_Long … rat_Khong_Hai_Long', 'Mức độ hài lòng'],
    ['thong_ke_tai_khoan', 'congDan, doanhNghiep', 'Tài khoản trên Cổng dịch vụ công']];
  let h = hccHeader('home');
  h += '<div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Endpoint và chỉ tiêu sử dụng</h3><div class="stc-cs">9 endpoint nguồn hcc_tkpro (bảng iceberg.bronze.hcc_tkpro__*) · 5 endpoint thống kê trả theo cây đơn vị (id, code, name, level, sortOrder, parentId)</div></div></div>' +
    '<table class="stc-tbl sgd-tbl-l"><thead><tr><th>Endpoint</th><th>Trường dữ liệu chính</th><th>Dùng cho chỉ tiêu</th><th>Trạng thái</th></tr></thead><tbody>' +
    eps.map((e) => '<tr><td class="sgd-mono">' + hccE(e[0]) + '</td><td class="sgd-mono">' + hccE(e[1]) + '</td><td>' + hccE(e[2]) + '</td><td><span class="stc-bd warn">Chỉ có schema</span></td></tr>').join('') + '</tbody></table></div>';
  h += '<div class="stc-g2 stc-mt"><div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Giả định đang dùng</h3><div class="stc-cs">Cần Trung tâm Phục vụ HCC xác nhận · sửa ở js/core/hcc-config.js</div></div><span class="stc-bd warn">' + HCC_ASSUME.length + ' giả định</span></div><ol class="sgd-rules">' + HCC_ASSUME.map((a) => '<li>' + hccE(a) + '</li>').join('') + '</ol></div>' +
    '<div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Quy tắc trình bày</h3><div class="stc-cs">Giữ đúng các quy tắc đã chốt với bộ chỉ tiêu Sở Tài chính và Sở GD&amp;ĐT</div></div></div><ol class="sgd-rules">' +
    ['Không có tab: trang chủ có 5 thẻ nhóm, mỗi nhóm một màn; thêm màn Chi tiết theo cấp bậc và màn Theo đơn vị.', 'Sơ đồ cây thẻ số cho chỉ tiêu cộng được; chỉ tiêu 3 cấp (trước/đúng/trễ hạn → khối) mọc thêm hàng thẻ.', 'Cầu nối tăng giảm so kỳ này với kỳ trước (quý liền trước).', 'Tỷ lệ (đúng hạn, số hóa, hài lòng) không cộng lại; mức Thành phố luôn là bình quân gia quyền (tổng tử ÷ tổng mẫu).', 'Trễ hạn, tồn, chưa trực tuyến, không hài lòng tăng là đỏ; số hồ sơ tiếp nhận, đánh giá để màu trung tính.', 'Số thủ tục cấp Thành phố lấy ở nút gốc, không cộng các đơn vị.', 'Không nội suy kỳ thiếu số; không tự đặt số mục tiêu khi chưa có chỉ tiêu kế hoạch.'].map((t) => '<li>' + hccE(t) + '</li>').join('') + '</ol></div></div>';
  h += '<div class="stc-mt">' + hccNote('<b>Cần xin Trung tâm Phục vụ HCC:</b> (1) bản ghi thật của 9 endpoint cho ít nhất hai kỳ; (2) tham số kỳ (từ ngày – đến ngày, tháng hay quý, có lũy kế không); (3) cây đơn vị: level nào là Thành phố / khối / đơn vị, đã theo 126 phường/xã mới chưa; (4) department_code của ttgqhs ghép với id/code của cây đơn vị thế nào; (5) ý nghĩa totalKyTruoc, totalHT, total_Other và mã status của ttgqhs_detail; (6) thong_ke_tai_khoan là lũy kế hay trong kỳ.') + '</div>';
  return h + hccFoot();
}

/* ---------- Dựng màn + điều khiển ---------- */
function hccScreenHtml() {
  if (HCC_UI.screen === 'group') return hccScreenGroup();
  if (HCC_UI.screen === 'detail') return hccScreenDetail();
  if (HCC_UI.screen === 'xa') return hccScreenXa();
  if (HCC_UI.screen === 'src') return hccScreenSrc();
  return hccScreenHome();
}
function hccScreenMeta() {
  const base = 'Trung tâm Phục vụ hành chính công';
  if (HCC_UI.screen === 'group') { const gi = Math.max(0, HCC_GROUPS.findIndex((g) => g.id === HCC_UI.group)); return { title: base + ' — ' + HCC_GROUPS[gi].label, sub: 'Nhóm ' + (gi + 1) + '/' + HCC_GROUPS.length + ' · ' + hccPeriodLabel(HCC_UI.period) }; }
  if (HCC_UI.screen === 'detail') { const t = HCC_TREE.find((x) => x.id === HCC_UI.tree); return { title: base + ' — Chi tiết chỉ tiêu', sub: t ? t.label : '' }; }
  if (HCC_UI.screen === 'xa') { const t = HCC_XA_INDS.find((x) => x.id === HCC_UI.xa.ind); return { title: base + ' — Chỉ tiêu theo đơn vị', sub: (t ? t.label + ' · ' : '') + hccPeriodLabel(HCC_UI.period) }; }
  if (HCC_UI.screen === 'src') return { title: base + ' — Nguồn dữ liệu và giả định', sub: '9 API hcc_tkpro (hiện chỉ có schema)' };
  return { title: base + ' — Bộ chỉ tiêu hành chính công Thủ đô', sub: 'Tổng hợp từ ' + HCC_SO.length + ' sở, ngành và 126 phường/xã' };
}
function hccTasksHtml() {
  if (typeof fieldScenarioSummary !== 'function') return '';
  try { return '<div class="stc-tasks" style="margin-top:18px">' + fieldScenarioSummary('cat::' + (HCC_UI.role || (typeof currentRole !== 'undefined' ? currentRole : 'UBND')) + '::ubnd-hcc') + '</div>'; } catch (e) { return ''; }
}
function hccRerender(resetScroll) {
  const body = document.getElementById('modalBody'), title = document.getElementById('modalTitle'), sub = document.getElementById('modalSub');
  if (!body || !HCC_UI.open) return;
  const top = body.scrollTop, meta = hccScreenMeta();
  if (title) title.textContent = meta.title;
  if (sub) sub.textContent = 'DỮ LIỆU GIẢ LẬP · ' + meta.sub;
  let html;
  try { html = hccScreenHtml(); } catch (e) { console.error(e); html = hccEmpty('Không dựng được màn hình', 'Có lỗi khi tính số liệu giả lập: ' + (e && e.message ? e.message : e)); }
  body.innerHTML = '<div class="stc-root hcc-root stc-wrap">' + html + '</div>' + hccTasksHtml();
  body.scrollTop = resetScroll ? 0 : top;
  if (HCC_UI.focusQ) {
    const inp = body.querySelector('#hccQ');
    if (inp) { inp.focus(); const L = inp.value.length; try { inp.setSelectionRange(L, L); } catch (e) { /* bỏ qua */ } }
    HCC_UI.focusQ = false;
  }
}
function hccOpenForm(itemIndex, role) {
  if (role) HCC_UI.role = role;
  const it = typeof itemIndex === 'number' ? HCC_ITEMS[itemIndex] : null;
  const key = it ? it.hccKey : 'home';
  HCC_UI.dd = null; HCC_UI.pick = null; HCC_UI.xa.sel = null;
  if (key === 'xa') HCC_UI.screen = 'xa';
  else if (HCC_GROUPS.some((g) => g.id === key)) { HCC_UI.screen = 'group'; HCC_UI.group = key; }
  else HCC_UI.screen = 'home';
  if (typeof STC_UI !== 'undefined') STC_UI.open = false;          // popup đang thuộc về form Trung tâm Phục vụ HCC
  if (typeof SGD_UI !== 'undefined') SGD_UI.open = false;
  HCC_UI.open = true;
  hccRerender(true);
  if (typeof openModal === 'function') openModal();
}
function hccClose() { HCC_UI.open = false; if (typeof closeModal === 'function') closeModal(); }
function hccGo(screen, arg) { HCC_UI.dd = null; HCC_UI.pick = null; HCC_UI.screen = screen; if (screen === 'group' && arg) HCC_UI.group = arg; hccRerender(true); }
function hccDetail(id) { HCC_UI.dd = null; HCC_UI.pick = null; HCC_UI.screen = 'detail'; if (id) HCC_UI.tree = id; hccRerender(true); }
function hccPick(id) { HCC_UI.pick = HCC_UI.pick === id ? null : id; hccRerender(false); }
function hccStep(d) { const at = HCC_TREE.findIndex((t) => t.id === HCC_UI.tree); HCC_UI.tree = HCC_TREE[(at + d + HCC_TREE.length) % HCC_TREE.length].id; HCC_UI.pick = null; hccRerender(true); }
function hccXa(ind) { HCC_UI.dd = null; HCC_UI.screen = 'xa'; HCC_UI.xa.sel = null; if (ind) hccXaSetInd(ind); hccRerender(true); }
function hccXaOpen(ind, name) { HCC_UI.dd = null; HCC_UI.screen = 'xa'; hccXaSetInd(ind); HCC_UI.xa.f = 'all'; HCC_UI.xa.q = ''; HCC_UI.xa.sel = name; HCC_UI.xa.anim = true; hccRerender(true); }
function hccXaSetInd(ind) { const x = HCC_XA_INDS.find((i) => i.id === ind); if (!x) return; HCC_UI.xa.ind = ind; HCC_UI.xa.sk = 'v'; HCC_UI.xa.sd = x.better === 'low' ? 1 : -1; }
function hccXaInd(ind) { hccXaSetInd(ind); hccRerender(false); }
function hccXaF(f) { HCC_UI.xa.f = f; hccRerender(false); }
function hccXaQ(v) { HCC_UI.xa.q = v; HCC_UI.focusQ = true; hccRerender(false); }
function hccXaSel(name) { const X = HCC_UI.xa; X.anim = !!name && !X.sel; X.sel = name || null; hccRerender(false); }
function hccXaStep(d) { const X = HCC_UI.xa, at = X.order.indexOf(X.sel); if (at < 0 || !X.order[at + d]) return; X.sel = X.order[at + d]; hccRerender(false); }
function hccXaSort(k) { const X = HCC_UI.xa; X.sd = X.sk === k ? -X.sd : (k === 'name' ? 1 : -1); X.sk = k; hccRerender(false); }
function hccDdToggle(id) { HCC_UI.dd = HCC_UI.dd === id ? null : id; hccRerender(false); }
function hccSetPeriod(p) { HCC_UI.dd = null; HCC_UI.period = String(p); HCC_UI.pick = null; hccRerender(false); }
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !HCC_UI.open) return;
    const m = document.getElementById('modal');
    if (!(m && m.classList.contains('open') && m.querySelector('.hcc-root'))) return;
    if (HCC_UI.dd) { HCC_UI.dd = null; hccRerender(false); return; }
    if (HCC_UI.screen === 'xa' && HCC_UI.xa.sel) { hccXaSel(null); return; }   // Esc đóng khung hồ sơ trước
    hccClose();
  });
  document.addEventListener('click', (e) => {
    if (!HCC_UI.dd || !HCC_UI.open) return;
    if (e.target && e.target.closest && e.target.closest('.hcc-root .stc-dd')) return;
    HCC_UI.dd = null;
    hccRerender(false);
  });
}

/* ---------- Xuất Excel ---------- */
async function hccExport() {
  if (typeof ExcelJS === 'undefined') { if (typeof toast === 'function') toast('Thư viện xuất Excel chưa tải xong, thử lại sau giây lát.'); return; }
  const n = hccNP();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Chỉ tiêu Thành phố');
  ws.addRow(['Trung tâm Phục vụ hành chính công Hà Nội · ' + hccPeriodLabel(n.p) + ' · DỮ LIỆU GIẢ LẬP, KHÔNG PHẢI SỐ LIỆU THẬT']).font = { italic: true };
  ws.addRow([]);
  ws.addRow(['Nhóm', 'Chỉ tiêu', 'Thành phần', hccPeriodLabel(n.p), n.pp != null ? hccPeriodLabel(n.pp) : 'Kỳ trước', 'So kỳ trước', 'Đơn vị']).font = { bold: true };
  HCC_TREE.forEach((spec) => {
    const g = HCC_GROUPS.find((x) => x.id === spec.group), T = hccEvalTree(spec, n.C, n.P);
    const add = (x, depth) => {
      const d = x.now == null || x.prev == null || !x.prev ? null : Math.round((x.now / x.prev - 1) * 1000) / 10;
      ws.addRow([g ? g.label : '', spec.label, depth ? '   '.repeat(depth - 1) + x.label : '(tổng)', x.now, x.prev, d == null ? null : d + '%', spec.unit]);
      (x.kids || []).forEach((k) => add(k, depth + 1));
    };
    add(T, 0);
  });
  ws.columns = [{ width: 26 }, { width: 34 }, { width: 30 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 12 }];
  const wx = wb.addWorksheet('Theo đơn vị');
  wx.addRow(['Đơn vị', 'Khối'].concat(HCC_XA_INDS.map((x) => x.label + (x.pct ? ' (%)' : '')))).font = { bold: true };
  hccUnits().forEach((r) => {
    const o = r.v[n.p];
    wx.addRow([r.name, hccKindLabel(r.kind)].concat(HCC_XA_INDS.map((x) => {
      const v = x.type === 'count' ? x.parts.reduce((a, c) => a + (c.f(o) || 0), 0) : hccDiv(x.num(o), x.den(o), x.m);
      return v == null ? null : Math.round(v * 100) / 100;
    })));
  });
  wx.columns = [{ width: 40 }, { width: 10 }].concat(HCC_XA_INDS.map(() => ({ width: 16 })));
  const wl = wb.addWorksheet('Theo lĩnh vực');
  wl.addRow(['Lĩnh vực', 'Kỳ trước chuyển sang', 'Tiếp nhận', 'Trực tuyến', 'Trực tiếp', 'Bưu chính', 'Đã giải quyết', 'Còn tồn']).font = { bold: true };
  n.C.lv.forEach((x) => wl.addRow([x.name, x.kt, x.tong, x.ol, x.tti, x.bc, x.ht, x.ton]));
  wl.columns = [{ width: 26 }].concat([1, 2, 3, 4, 5, 6, 7].map(() => ({ width: 16 })));
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tt-phuc-vu-hcc-' + n.p + '-DU-LIEU-GIA-LAP.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Lưới chỉ tiêu của IOC (indicators.js gọi) ---------- */
/* Băng "Tổng quan" rộng cả hàng lưới: các ô KPI (HCC_KPIS) + 5 thẻ nhóm + thẻ Theo đơn vị. Bấm mở thẳng popup đúng màn. */
function hccOverviewBandHtml(cat, idx) {
  const M = hccMetrics();
  const openArgs = (i) => "'" + cat.role + "','" + cat.id + "'," + i;
  const itemIdx = (key) => { const i = HCC_ITEMS.findIndex((x) => x.hccKey === key); return i < 0 ? idx : i; };
  let body = '<div class="stc-kpis">' + HCC_KPIS.map((k) => hccKpiTile(k, M, 'openCategoryDetail(' + openArgs(itemIdx(k.target)) + ')')).join('') + '</div>';
  body += '<div class="stc-sec" style="margin:4px 0 12px">Năm nhóm chỉ tiêu · mỗi nhóm một màn hình</div>';
  body += '<div class="sgd-g3">' + HCC_GROUPS.map((g) => hccGroupCard(g, M, 'openCategoryDetail(' + openArgs(itemIdx(g.id)) + ')')).join('') + hccXaCard('openCategoryDetail(' + openArgs(itemIdx('xa')) + ')') + '</div>';
  const foot = '<p class="cpi-legend" style="margin:10px 0 0;font-size:11px;display:flex;justify-content:space-between;gap:8px"><span>' + hccPeriodLabel(HCC_UI.period) + ' · 5 nhóm · ' + HCC_XA_INDS.length + ' chỉ tiêu theo ' + (HCC_SO.length + 126) + ' đơn vị</span><span style="color:#f2b636;font-weight:700;font-size:10.5px;letter-spacing:.3px">DỮ LIỆU GIẢ LẬP</span></p>';
  return '<div class="field-category-card so-item-card stc-overview-band" style="grid-column:1/-1"><div class="stc-root hcc-root" style="background:transparent;overflow:visible">' +
    '<div class="stc-gh" style="margin-bottom:12px"><h4 style="margin:0">Tổng quan · Trung tâm Phục vụ hành chính công</h4><button type="button" class="stc-gmore" style="background:none;border:0;cursor:pointer;padding:0;font:inherit" onclick="openCategoryDetail(' + openArgs(idx) + ')">Xem tổng quan đầy đủ ›</button></div>' +
    body + foot + '</div></div>';
}
/* Thẻ xem trước một nhóm (dùng ở bản xem trước gộp nhiều lĩnh vực, hoặc khi bật HCC_SHOW_OUTER_GROUP_CARDS). */
function hccPreviewBody(it) {
  const M = hccMetrics();
  if (it.hccKey === 'home') return { label: 'Tổng quan', bodyHtml: '<p class="cpi-legend">' + HCC_KPIS.length + ' chỉ số chính · 5 nhóm · dữ liệu giả lập</p>' };
  if (it.hccKey === 'xa') return { label: it[0], bodyHtml: '<p class="cpi-legend">' + HCC_XA_INDS.length + ' chỉ tiêu · ' + (HCC_SO.length + 126) + ' đơn vị · hồ sơ trễ hạn</p>' };
  const rows = hccGroupLines(it.hccKey, M).map((l) => l.replace('class="stc-gl"', 'style="display:grid;grid-template-columns:minmax(0,1fr) auto 58px;gap:8px;font-size:12px;padding:4px 0 3px;border-top:1px solid rgba(87,178,255,.14)"').replace(/<small>/g, '<small style="margin-left:3px;opacity:.7;font-size:10.5px">')).join('');
  return { label: it[0], bodyHtml: '<div class="stc-root" style="background:transparent;overflow:visible">' + rows + '</div>' };
}
