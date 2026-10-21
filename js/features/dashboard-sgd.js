/* ============================== SỞ GD&ĐT — FORM CHỈ TIÊU MỚI ==============================
   Form riêng của Sở Giáo dục và Đào tạo, cùng khuôn với form Sở Tài chính (dashboard-stc.js), hiển thị trong popup chuẩn
   của IOC (#modal). 8 màn: Trang chủ, 5 màn nhóm, Chi tiết theo cấp bậc (sơ đồ cây thẻ số + cầu nối), Chỉ tiêu theo 126
   phường/xã (bảng đơn vị + hồ sơ phường/xã + danh sách trường).
   Số liệu: sgd-data.js (SỐ GIẢ LẬP theo schema API Sở GD&ĐT; API chưa có số thật). Giao diện dùng lớp stc- (css/stc.css)
   cộng lớp sgd- (css/sgd.css), gốc là .stc-root.sgd-root. Cần: esc() (helpers.js), openModal/closeModal. */

const SGD_UI = { open: false, screen: 'home', group: 'ml', tree: 'hocsinh', pick: null, year: SGD_YEARS[0], dd: null, role: null,
  xa: { ind: 'hocsinh', q: '', f: 'all', sk: 'v', sd: -1, sel: null, order: [], anim: false }, focusQ: false };
/* Màn 126 phường/xã: true = bấm 1 dòng thì hồ sơ phường/xã mở trong KHUNG TRƯỢT bên phải (mặc định, từ 2026-09-26);
   false = kiểu cũ, hồ sơ luôn hiện nối dưới bảng (giữ lại, không xoá). */
const SGD_XA_DRAWER = true;
/* true = hiện các thông tin kỹ thuật trên giao diện (tên API/endpoint, tên trường dữ liệu dạng MA_…, IS_…, HS_…, khối "Số liệu
   gốc từ API", màn "Nguồn dữ liệu và giả định"). Anh yêu cầu 2026-09-29: UI KHÔNG được hiện các mã này → mặc định false
   (ẩn bằng cờ, code giữ nguyên). Các câu chú thích đã viết lại bằng lời thường. */
const SGD_SHOW_TECH = false;
const SGD_PAL = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
const SGD_ICON_INFO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>';
const SGD_ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
const SGD_ICON_DB = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';

/* ---------- Tiện ích ---------- */
function sgdE(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function sgdFmt(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 && Math.abs(n) >= Math.pow(10, -d) / 2 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function sgdSgn(n, d) { return n == null ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + sgdFmt(Math.abs(n), d); }
function sgdDiv(a, b, m) { return a == null || b == null || !b ? null : (a / b) * (m == null ? 100 : m); }
function sgdLnk(label, act) { return '<button type="button" class="stc-lnk" onclick="' + act + '">' + sgdE(label) + '</button>'; }
function sgdNote(html) { return '<div class="stc-note">' + SGD_ICON_INFO + '<div>' + html + '</div></div>'; }
function sgdEmpty(title, text) { return '<div class="stc-empty">' + SGD_ICON_DB + '<b>' + sgdE(title) + '</b><span style="font-size:12px;max-width:420px">' + sgdE(text) + '</span></div>'; }
let SGD_CITY = {};
function sgdCityY(y) { if (y == null) return null; if (!SGD_CITY[y]) SGD_CITY[y] = sgdCity(y); return SGD_CITY[y]; }
function sgdNP() { const y = SGD_UI.year, py = sgdPrevYear(y); return { y: y, py: py, C: sgdCityY(y), P: py != null ? sgdCityY(py) : null }; }

/* Chú thích khi rê chuột vào mũi tên tăng/giảm (thuộc tính title). kind: 'rate' = điểm %, 'abs' = chênh lệch số thường,
   'rel' = % so với chính nó. better: 'high' tăng là tốt, 'low' giảm là tốt, 'none' trung tính. now/prev/d (tuỳ chọn): ghi kèm ví dụ số. */
function sgdDlTip(kind, better, now, prev, d, cmpTP) {
  const L = [];
  const fm = (x) => (kind === 'rate' ? sgdFmt(x, 1) + '%' : sgdFmt(x, kind === 'abs' ? d : Number.isInteger(x) ? 0 : 1));
  const was = cmpTP ? 'Mức Thành phố' : 'Năm học trước', is = cmpTP ? 'đơn vị này' : 'năm nay';
  if (kind === 'rate') L.push('Đơn vị "điểm %" (điểm phần trăm): lấy tỷ lệ ' + is + ' TRỪ thẳng ' + (cmpTP ? 'tỷ lệ của Thành phố' : 'tỷ lệ năm học trước') + '.');
  else if (kind === 'abs') L.push('Chênh lệch trực tiếp: số ' + is + ' trừ ' + (cmpTP ? 'mức Thành phố' : 'số năm học trước') + '.');
  else L.push('Tăng/giảm bao nhiêu % so với chính nó năm học trước: (năm nay ÷ năm trước − 1) × 100.');
  if (now != null && prev != null) {
    const v = kind === 'rel' ? (prev ? (now / prev - 1) * 100 : null) : now - prev;
    if (v != null) {
      const dd = kind === 'abs' ? d : 1, unit = kind === 'rate' ? ' điểm %' : kind === 'rel' ? '%' : '';
      const r = Math.round(v * Math.pow(10, dd)) / Math.pow(10, dd);
      L.push(was + ' ' + fm(prev) + ' → ' + is + ' ' + fm(now) + ': ' + (r === 0 ? 'không đổi' : (r > 0 ? (cmpTP ? 'cao hơn ' : 'tăng ') : (cmpTP ? 'thấp hơn ' : 'giảm ')) + sgdFmt(Math.abs(v), dd) + unit) + '.');
    }
  }
  if (kind === 'rate') L.push('Ví dụ: 24,1% lên 24,9% là tăng 0,8 điểm %, không phải tăng 0,8%.');
  if (!cmpTP) L.push(better === 'low' ? 'Chỉ tiêu này giảm là tốt: tăng tô đỏ, giảm tô xanh.' : better === 'none' ? 'Tăng hay giảm không tự thân tốt/xấu nên tô màu trung tính.' : 'Chỉ tiêu này tăng là tốt: tăng tô xanh, giảm tô đỏ.');
  return L.join('\n');
}
/* Mũi tên tăng/giảm. o.rate: chênh lệch tuyệt đối (điểm %), o.abs: chênh lệch số thường (không ghi "điểm"),
   o.inv: giảm là tốt, o.neutral: tăng/giảm không tự thân tốt/xấu (màu trung tính). */
function sgdDl(now, prev, o) {
  o = o || {};
  if (now == null || prev == null) return '';
  const v = o.rate || o.abs ? now - prev : (prev ? (now / prev - 1) * 100 : null);
  if (v == null) return '';
  const d = o.d != null ? o.d : 1;
  const r = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  let cls = r > 0 ? 'up' : r < 0 ? 'down' : 'flat';
  if (cls !== 'flat') { if (o.inv) cls += r > 0 ? ' bad' : ' good'; else if (o.neutral) cls += ' n'; }
  const txt = cls === 'flat' ? 'Không đổi' : sgdFmt(Math.abs(v), d) + (o.abs ? '' : o.rate ? ' điểm %' : '%');
  const tip = sgdDlTip(o.rate ? 'rate' : o.abs ? 'abs' : 'rel', o.inv ? 'low' : o.neutral ? 'none' : 'high', now, prev, d);
  return '<span class="stc-dl ' + cls + '" title="' + sgdE(tip) + '" style="cursor:help">' + txt + (o.ref ? ' <span class="stc-ref">' + sgdE(o.ref) + '</span>' : '') + '</span>';
}
function sgdLegend(y, py) {
  return '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + sgdYearLabel(y) + '</span>' + (py != null ? '<span><i style="background:var(--prev)"></i>' + sgdYearLabel(py) + '</span>' : '') + '</div>';
}
function sgdBig(v, unit, dl) { return '<div class="stc-bigrow"><div class="stc-big">' + v + (unit ? '<small>' + sgdE(unit) + '</small>' : '') + '</div>' + (dl || '') + '</div>'; }
function sgdCmp(label, now, prev, mx, dl, first) {
  const w = (v) => (v > 0 ? Math.max(0.2, (v / (mx || 1)) * 100) : 0);
  return '<div class="stc-cmp"' + (first ? ' style="margin-top:8px"' : '') + '><div class="stc-nm">' + sgdE(label) + '</div><div class="stc-bars">' +
    '<div class="stc-br"><div class="stc-tr"><div class="stc-b" style="width:' + w(now).toFixed(2) + '%"></div></div><div class="stc-val">' + sgdFmt(now) + '</div></div>' +
    (prev != null ? '<div class="stc-br"><div class="stc-tr"><div class="stc-b p" style="width:' + w(prev).toFixed(2) + '%"></div></div><div class="stc-val p">' + sgdFmt(prev) + '</div></div>' : '') +
    '</div>' + (dl || '<span class="stc-dl flat">—</span>') + '</div>';
}
function sgdPg(label, small, pct, mark, color) {
  const w = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return '<div class="stc-pg"><div class="stc-row"><span class="stc-nm">' + sgdE(label) + (small ? '<small>' + sgdE(small) + '</small>' : '') + '</span><span class="stc-pv">' + (pct == null ? '—' : sgdFmt(pct, 1) + '%') + '</span></div><div class="stc-trk"><div class="stc-fill" style="width:' + w.toFixed(2) + '%' + (color ? ';background:' + color : '') + '"></div>' + (mark != null ? '<i class="sgd-mark" style="left:' + Math.max(0, Math.min(100, mark)).toFixed(2) + '%"></i>' : '') + '</div></div>';
}
function sgdDonut(items, total, center, unit, label) {
  const C = 2 * Math.PI * 54;
  let cum = 0, segs = '';
  items.forEach((it) => {
    if (!(it.v > 0) || !(total > 0)) return;
    const len = (it.v / total) * C;
    segs += '<circle class="stc-seg" cx="80" cy="80" r="54" stroke="' + it.c + '" stroke-dasharray="' + Math.max(0.6, len - 2.5).toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="' + (-cum).toFixed(1) + '"/>';
    cum += len;
  });
  const fs = center.length > 8 ? 14 : center.length > 6 ? 17 : 21;
  return '<svg viewBox="0 0 160 160" role="img" aria-label="' + sgdE(label) + '"><circle class="stc-trk" cx="80" cy="80" r="54"/><g transform="rotate(-90 80 80)">' + segs + '</g><text class="stc-tv" x="80" y="80" text-anchor="middle" style="font-size:' + fs + 'px">' + sgdE(center) + '</text><text class="stc-tu" x="80" y="96" text-anchor="middle">' + sgdE(unit) + '</text></svg>';
}

/* ---------- Khung chung: đầu màn, thẻ, chân màn ---------- */
function sgdDd(id, label, cur, opts, handler) {
  const open = SGD_UI.dd === id;
  const cv = opts.find((o) => String(o.v) === String(cur));
  const list = open ? '<div class="stc-ddl" role="listbox" aria-label="' + sgdE(label) + '">' + opts.map((o) => {
    const on = String(o.v) === String(cur);
    return '<button type="button" role="option" aria-selected="' + on + '" class="stc-ddo' + (on ? ' on' : '') + '" onclick="' + handler + '(' + o.v + ')"><span>' + sgdE(o.text) + '</span>' + (on ? '<i>✓</i>' : '') + '</button>';
  }).join('') + '</div>' : '';
  return '<div class="stc-dd' + (open ? ' open' : '') + '"><button type="button" class="stc-ddb" aria-haspopup="listbox" aria-expanded="' + open + '" onclick="sgdDdToggle(\'' + id + '\')"><small>' + sgdE(label) + '</small><b>' + sgdE(cv ? cv.text : '—') + '</b><span class="stc-ddc"></span></button>' + list + '</div>';
}
function sgdHeader(back) {
  const b = back === 'home' ? sgdLnk('← Tổng quan', "sgdGo('home')") : back && back.group ? sgdLnk('← ' + back.label, "sgdGo('group','" + back.group + "')") : '';
  const yOpts = SGD_YEARS.map((y) => ({ v: y, text: sgdYearLabel(y) }));
  return '<div class="stc-toolbar"><div class="stc-tl">' + b + '<span class="sgd-demo"><i></i>Số liệu giả lập · chưa có số liệu thật từ Sở GD&amp;ĐT</span></div>' +
    '<div class="stc-ctrls">' + sgdDd('year', 'Năm học', SGD_UI.year, yOpts, 'sgdSetYear') + (typeof indicatorEntryBtnHtml === 'function' ? indicatorEntryBtnHtml() : '') + '<button type="button" class="stc-btn primary" onclick="sgdExport()">' + SGD_ICON_DL + 'Xuất Excel</button></div></div>';
}
function sgdFoot() {
  return '<div class="stc-foot"><span>Một số danh mục (giai đoạn, loại hình, mức đạt chuẩn, khối lớp) đang theo giả định, chờ Sở GD&amp;ĐT xác nhận.</span><span>Số liệu giả lập · năm học ' + sgdYearLabel(SGD_UI.year) + '</span></div>';
}
/* Thẻ chỉ tiêu: tiêu đề bấm được → xem theo 126 phường/xã (o.xa); "Chi tiết ›" → sơ đồ cây (o.tree) */
function sgdCard(o) {
  const title = o.xa ? '<button type="button" class="sgd-ctl" onclick="sgdXa(\'' + o.xa + '\')" title="Xem theo 126 phường/xã">' + sgdE(o.title) + '</button>' : '<h3 class="stc-ct">' + sgdE(o.title) + '</h3>';
  const right = (o.tree ? sgdLnk('Chi tiết ›', "sgdDetail('" + o.tree + "')") : '') + (o.src && (SGD_SHOW_TECH || o.warn) ? '<span class="stc-bd' + (o.warn ? ' warn' : '') + '">' + sgdE(o.src) + '</span>' : '');
  return '<div class="stc-card"><div class="stc-ch"><div>' + title + '<div class="stc-cs">' + sgdE(o.sub || '') + '</div></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + right + '</div></div>' + o.body + '</div>';
}
function sgdSubY(unit) { const n = sgdNP(); return 'Năm học ' + sgdYearLabel(n.y) + (n.py != null ? ' so với ' + sgdYearLabel(n.py) : '') + (unit ? ' · ' + unit : ''); }

/* ---------- Số tổng hợp dùng chung (trang chủ, băng tổng quan) ---------- */
function sgdMetrics() {
  const { C, P } = sgdNP();
  const S = sgdSum;
  const tr = (o) => S(o, SGD_TRK), cq = (o) => S(o, SGD_CQK), hs = (o) => S(o, SGD_HSK), lop = (o) => S(o, SGD_LOPK), ph = (o) => S(o, SGD_PHK);
  const kc = (o) => S(o, ['kc_th', 'kc_cs']), tm = (o) => S(o, ['tm_th', 'tm_cs']), gv = (o) => S(o, ['gv_th', 'gv_cs']);
  const ns = (o) => S(o, ['ql_th', 'ql_cs', 'gv_th', 'gv_cs', 'nv_th', 'nv_cs']), can = (o) => S(o, ['can_th', 'can_cs']), boi = (o) => S(o, ['boi_th', 'boi_cs']);
  const M = { C: C, P: P };
  const pair = (f) => [f(C), P ? f(P) : null];
  M.tr = pair(tr); M.cq = pair(cq); M.hs = pair(hs); M.lop = pair(lop); M.ph = pair(ph); M.tm = pair(tm); M.gv = pair(gv); M.ns = pair(ns);
  M.ncl = pair((o) => o.ncl);
  M.cqR = pair((o) => sgdDiv(cq(o), tr(o)));
  M.kcR = pair((o) => sgdDiv(kc(o), ph(o)));
  M.siso = pair((o) => sgdDiv(hs(o), lop(o), 1));
  M.hsgv = pair((o) => sgdDiv(hs(o), gv(o), 1));
  M.dcs = pair((o) => S(o, ['dcs_th', 'dcs_cs']));
  M.canR = pair((o) => sgdDiv(can(o), hs(o)));
  M.boiR = pair((o) => sgdDiv(boi(o), hs(o)));
  M.inetR = pair((o) => sgdDiv(o.inet, tr(o)));
  M.spR = pair((o) => sgdDiv(o.sp, hs(o)));
  M.pcR = pair((o) => sgdDiv(o.pc, hs(o)));
  return M;
}
const SGD_KPIS = [
  { label: 'Số trường (5 cấp học)', target: 'ml', v: (M) => sgdFmt(M.tr[0]), u: () => 'trường', dl: (M) => sgdDl(M.tr[0], M.tr[1], { ref: 'so năm trước' }) },
  { label: 'Học sinh Tiểu học và THCS', target: 'hs', v: (M) => sgdFmt(M.hs[0] / 1e6, 2), u: () => 'triệu học sinh', dl: (M) => sgdDl(M.hs[0], M.hs[1], { ref: 'so năm trước' }) },
  { label: 'Giáo viên Tiểu học và THCS', target: 'dn', v: (M) => sgdFmt(M.gv[0] / 1000, 1), u: () => 'nghìn người', dl: (M) => sgdDl(M.gv[0], M.gv[1], { ref: 'so năm trước' }) },
  { label: 'Tỷ lệ trường đạt chuẩn quốc gia', target: 'ml', v: (M) => sgdFmt(M.cqR[0], 1) + '%', u: (M) => sgdFmt(M.cq[0]) + ' / ' + sgdFmt(M.tr[0]) + ' trường', dl: (M) => sgdDl(M.cqR[0], M.cqR[1], { rate: true, ref: '' }) },
  { label: 'Tỷ lệ phòng học kiên cố', target: 'vc', v: (M) => sgdFmt(M.kcR[0], 1) + '%', u: () => 'Tiểu học và THCS', dl: (M) => sgdDl(M.kcR[0], M.kcR[1], { rate: true }) },
  { label: 'Sĩ số bình quân', target: 'hs', v: (M) => sgdFmt(M.siso[0], 1), u: () => 'học sinh / lớp', dl: (M) => sgdDl(M.siso[0], M.siso[1], { abs: true, neutral: true, ref: 'học sinh' }) },
  { label: 'Tỷ lệ học sinh cận thị', target: 'sk', v: (M) => sgdFmt(M.canR[0], 1) + '%', u: () => 'Tiểu học và THCS', dl: (M) => sgdDl(M.canR[0], M.canR[1], { rate: true, inv: true }) }
];
function sgdKpiTile(k, M, onclick) {
  const d = k.dl(M) || '<span class="stc-dl flat"><span class="stc-ref">Chưa có năm học so sánh</span></span>';
  return '<button type="button" class="stc-kpi" onclick="' + (onclick || ("sgdGo('group','" + k.target + "')")) + '"><div class="stc-lb">' + sgdE(k.label) + '</div><div class="stc-v">' + k.v(M) + '</div><div class="stc-u">' + sgdE(k.u(M)) + '</div><div style="margin-top:10px;min-height:18px">' + d + '</div></button>';
}
function sgdGl(label, val, unit, dl) {
  return '<div class="stc-gl"><span>' + sgdE(label) + '</span><span class="stc-v">' + val + (unit ? '<small>' + sgdE(unit) + '</small>' : '') + '</span><span>' + (dl || '') + '</span></div>';
}
function sgdGroupLines(id, M) {
  const L = [];
  if (id === 'ml') {
    L.push(sgdGl('Số trường', sgdFmt(M.tr[0]), 'trường', sgdDl(M.tr[0], M.tr[1])));
    L.push(sgdGl('Trường đạt chuẩn quốc gia', sgdFmt(M.cq[0]), 'trường', sgdDl(M.cq[0], M.cq[1])));
    L.push(sgdGl('Trường ngoài công lập', sgdFmt(M.ncl[0]), 'trường', sgdDl(M.ncl[0], M.ncl[1], { neutral: true })));
    L.push(sgdGl('Khai thác Internet dạy học', sgdFmt(M.inetR[0], 1), '%', sgdDl(M.inetR[0], M.inetR[1], { rate: true })));
  } else if (id === 'hs') {
    L.push(sgdGl('Học sinh', sgdFmt(M.hs[0]), '', sgdDl(M.hs[0], M.hs[1])));
    L.push(sgdGl('Lớp học', sgdFmt(M.lop[0]), 'lớp', sgdDl(M.lop[0], M.lop[1])));
    L.push(sgdGl('Sĩ số bình quân', sgdFmt(M.siso[0], 1), 'HS/lớp', sgdDl(M.siso[0], M.siso[1], { abs: true, neutral: true })));
    L.push(sgdGl('Học sinh diện chính sách', sgdFmt(M.dcs[0]), '', sgdDl(M.dcs[0], M.dcs[1], { neutral: true })));
  } else if (id === 'vc') {
    L.push(sgdGl('Phòng học', sgdFmt(M.ph[0]), 'phòng', sgdDl(M.ph[0], M.ph[1])));
    L.push(sgdGl('Tỷ lệ phòng học kiên cố', sgdFmt(M.kcR[0], 1), '%', sgdDl(M.kcR[0], M.kcR[1], { rate: true })));
    L.push(sgdGl('Phòng học tạm', sgdFmt(M.tm[0]), 'phòng', sgdDl(M.tm[0], M.tm[1], { inv: true })));
  } else if (id === 'dn') {
    L.push(sgdGl('Tổng nhân sự', sgdFmt(M.ns[0]), 'người', sgdDl(M.ns[0], M.ns[1])));
    L.push(sgdGl('Giáo viên', sgdFmt(M.gv[0]), 'người', sgdDl(M.gv[0], M.gv[1])));
    L.push(sgdGl('Học sinh bình quân / giáo viên', sgdFmt(M.hsgv[0], 1), '', sgdDl(M.hsgv[0], M.hsgv[1], { abs: true, neutral: true })));
  } else if (id === 'sk') {
    L.push(sgdGl('Tỷ lệ cận thị', sgdFmt(M.canR[0], 1), '%', sgdDl(M.canR[0], M.canR[1], { rate: true, inv: true })));
    L.push(sgdGl('Tỷ lệ biết bơi', sgdFmt(M.boiR[0], 1), '%', sgdDl(M.boiR[0], M.boiR[1], { rate: true })));
    L.push(sgdGl('Phụ huynh dùng điện thoại thông minh', sgdFmt(M.spR[0], 1), '%', ''));
    L.push(sgdGl('Phụ huynh có máy tính kết nối Internet', sgdFmt(M.pcR[0], 1), '%', ''));
  }
  return L;
}
function sgdGroupCard(g, M, onclick) {
  const L = sgdGroupLines(g.id, M);
  return '<button type="button" class="stc-gcard" onclick="' + (onclick || ("sgdGo('group','" + g.id + "')")) + '"><div class="stc-gh"><h3>' + sgdE(g.label) + '</h3><span>' + L.length + ' chỉ tiêu</span></div>' + L.join('') + '<div class="stc-gmore">Xem nhóm ' + sgdE(g.label) + ' ›</div></button>';
}
function sgdXaCard(onclick) {
  const rows = ['Bảng 126 đơn vị: thành phần, so năm trước, so Thành phố', 'Hạng, tốt nhất / kém nhất, số đơn vị dưới mức Thành phố', 'Hồ sơ phường/xã và danh sách trường', 'Lọc phường / xã, tìm theo tên, sắp xếp theo cột'];
  return '<button type="button" class="stc-gcard sgd-alt" onclick="' + (onclick || "sgdXa()") + '"><div class="stc-gh"><h3>Theo 126 phường/xã</h3><span>' + SGD_XA_INDS.length + ' chỉ tiêu</span></div>' + rows.map((t) => '<div class="stc-gl"><span>' + t + '</span><span></span><span></span></div>').join('') + '<div class="stc-gmore">Xem theo phường/xã ›</div></button>';
}

/* ---------- Màn: Trang chủ ---------- */
function sgdScreenHome() {
  const M = sgdMetrics();
  let h = sgdHeader(null);
  h += '<div class="stc-kpis">' + SGD_KPIS.map((k) => sgdKpiTile(k, M)).join('') + '</div>';
  h += '<div class="stc-secrow"><div class="stc-sec">Năm nhóm chỉ tiêu · mỗi nhóm một màn hình</div><div style="display:flex;gap:18px">' + sgdLnk('Theo 126 phường/xã ›', 'sgdXa()') + sgdLnk('Xem chi tiết theo cấp bậc ›', "sgdDetail('" + SGD_UI.tree + "')") + (SGD_SHOW_TECH ? sgdLnk('Nguồn dữ liệu và giả định ›', "sgdGo('src')") : '') + '</div></div>';
  h += '<div class="sgd-g3">' + SGD_GROUPS.map((g) => sgdGroupCard(g, M)).join('') + sgdXaCard() + '</div>';
  h += '<div class="stc-mt">' + sgdNote('<b>Cách đọc:</b> số liệu được tổng hợp từ từng trường, cộng dồn lên phường/xã và Thành phố. Kỳ so sánh là năm học trước. Tăng cận thị, tăng phòng học tạm hiển thị màu đỏ; các tỷ lệ không cộng lại với nhau. Bấm tên một thẻ chỉ tiêu (có dấu ›) để xem theo 126 phường/xã.') + '</div>';
  return h + sgdFoot();
}

/* ---------- Màn: 5 nhóm ---------- */
function sgdScreenGroup() {
  const gi = Math.max(0, SGD_GROUPS.findIndex((g) => g.id === SGD_UI.group)), g = SGD_GROUPS[gi];
  const n = sgdNP();
  let h = sgdHeader('home');
  h += '<div style="margin:-4px 0 14px" class="stc-hint">' + sgdE(g.note + (SGD_SHOW_TECH ? ' · Nguồn: ' + g.src : '')) + '</div>';
  h += ({ ml: sgdGroupMl, hs: sgdGroupHs, vc: sgdGroupVc, dn: sgdGroupDn, sk: sgdGroupSk })[g.id](n);
  const N = SGD_GROUPS.length, prev = SGD_GROUPS[(gi + N - 1) % N], next = SGD_GROUPS[(gi + 1) % N];
  h += '<div class="stc-pn"><span>' + sgdLnk('‹ ' + prev.label, "sgdGo('group','" + prev.id + "')") + '</span>' + sgdLnk('Tổng quan', "sgdGo('home')") + '<span>' + sgdLnk(next.label + ' ›', "sgdGo('group','" + next.id + "')") + '</span></div>';
  return h + sgdFoot();
}
function sgdGroupMl(n) {
  const { C, P, y, py } = n;
  const trC = sgdSum(C, SGD_TRK), trP = sgdSum(P, SGD_TRK);
  const mx = Math.max(...SGD_CAPS.map((c) => Math.max(C['tr_' + c[0]], P ? P['tr_' + c[0]] : 0)));
  let a = sgdBig(sgdFmt(trC), 'trường', sgdDl(trC, trP, { ref: py != null ? 'so năm trước (' + sgdFmt(trP) + ')' : '' })) + '<div class="stc-hint">Chỉ đếm trường đang hoạt động, không tính trường đã giải thể.</div>' + sgdLegend(y, py);
  SGD_CAPS.forEach((c, i) => { const k = 'tr_' + c[0]; a += sgdCmp(c[1], C[k], P ? P[k] : null, mx, sgdDl(C[k], P ? P[k] : null), i === 0); });
  const cl = trC - C.ncl;
  let b = '<div class="stc-dn" style="margin-top:8px">' + sgdDonut([{ v: cl, c: 'var(--s1)' }, { v: C.ncl, c: 'var(--s2)' }], trC, sgdFmt(trC), 'trường', 'Cơ cấu loại hình trường') +
    '<table class="stc-tbl"><thead><tr><th>Loại hình</th><th>Số trường</th><th>Tỷ trọng</th></tr></thead><tbody>' +
    '<tr><td><i class="stc-sw" style="background:var(--s1)"></i>Công lập</td><td>' + sgdFmt(cl) + '</td><td>' + sgdFmt(sgdDiv(cl, trC), 1) + '%</td></tr>' +
    '<tr><td><i class="stc-sw" style="background:var(--s2)"></i>Ngoài công lập</td><td>' + sgdFmt(C.ncl) + '</td><td>' + sgdFmt(sgdDiv(C.ncl, trC), 1) + '%</td></tr>' +
    '<tr><td style="padding-left:17px;color:var(--mute)">trong đó trường quốc tế</td><td>' + sgdFmt(C.qt) + '</td><td>' + sgdFmt(sgdDiv(C.qt, trC), 1) + '%</td></tr></tbody></table></div>' +
    '<div class="stc-hint" style="margin-top:14px">Trường quốc tế là một phần của khối ngoài công lập nên không cộng thêm vào tổng.</div>';
  const cqAll = sgdDiv(sgdSum(C, SGD_CQK), trC);
  let c = '';
  SGD_CAPS.forEach((cp) => { c += sgdPg(cp[1], sgdFmt(C['cq_' + cp[0]]) + ' / ' + sgdFmt(C['tr_' + cp[0]]), sgdDiv(C['cq_' + cp[0]], C['tr_' + cp[0]]), cqAll); });
  if (P) c += '<div class="stc-hint" style="margin-top:8px">Năm trước: ' + sgdFmt(sgdSum(P, SGD_CQK)) + ' / ' + sgdFmt(trP) + ' trường (' + sgdFmt(sgdDiv(sgdSum(P, SGD_CQK), trP), 1) + '%) → ' + (sgdDl(cqAll, sgdDiv(sgdSum(P, SGD_CQK), trP), { rate: true }) || 'không đổi') + '.</div>';
  const dk = [['Có điện lưới', 'IS_DIEN_LUOI', 'dien'], ['Có nguồn nước sạch', 'IS_NGUON_NUOC_SACH', 'nuoc'], ['Có công trình vệ sinh', 'IS_CONG_TRINH_VE_SINH', 'vs'], ['Dùng máy tính trong dạy học', 'IS_SU_DUNG_MAY_TINH_DAY_HOC', 'mt'], ['Khai thác Internet trong dạy học', 'IS_KHAI_THAC_INTERNET_DAY_HOC', 'inet']];
  let d = dk.map((x) => sgdPg(x[0], SGD_SHOW_TECH ? x[1] : sgdFmt(C[x[2]]) + ' / ' + sgdFmt(trC), sgdDiv(C[x[2]], trC))).join('') + sgdPg('Tiểu học học 2 buổi/ngày', (SGD_SHOW_TECH ? 'IS_2_BUOI_NGAY · ' : '') + sgdFmt(C.hb) + ' / ' + sgdFmt(C.tr_th), sgdDiv(C.hb, C.tr_th));
  return '<div class="stc-g2">' +
    sgdCard({ title: 'Số trường theo cấp học', sub: sgdSubY('trường'), xa: 'truong', tree: 'truong', src: 'hoso_truong_*', body: a }) +
    sgdCard({ title: 'Loại hình trường', sub: 'Cơ cấu theo loại hình · trường', xa: 'ncl', src: 'Theo giả định', warn: true, body: b }) +
    sgdCard({ title: 'Trường đạt chuẩn quốc gia theo cấp học', sub: 'Số trường đạt chuẩn ÷ số trường của cấp · vạch đen = tỷ lệ chung ' + sgdFmt(cqAll, 1) + '%', xa: 'cqg', tree: 'cqg', src: 'MA_DAT_CHUAN_DANH_GIA_CLGD', body: c }) +
    sgdCard({ title: 'Điều kiện cơ bản của trường', sub: 'Tỷ lệ trường đáp ứng từng điều kiện · 5 cấp học', xa: 'inet', src: 'IS_*', body: d }) +
    '</div><div class="stc-mt">' + sgdNote('<b>Chưa hiển thị:</b> kiểm định chất lượng và mức đạt chuẩn chi tiết vì chưa có danh mục các mức. Có danh mục thì thêm thẻ "Trường đạt kiểm định theo mức 1–4".') + '</div>';
}
function sgdGroupHs(n) {
  const { C, P, y, py } = n;
  const hsC = sgdSum(C, SGD_HSK), hsP = sgdSum(P, SGD_HSK), lopC = sgdSum(C, SGD_LOPK), lopP = sgdSum(P, SGD_LOPK);
  const mx = Math.max(C.hs_th, C.hs_cs, P ? P.hs_th : 0, P ? P.hs_cs : 0);
  let a = sgdBig(sgdFmt(hsC), 'học sinh', sgdDl(hsC, hsP, { ref: py != null ? 'so năm trước (' + sgdFmt(hsP) + ')' : '' })) + '<div class="stc-hint">Cộng số học sinh của mọi trường, mọi khối lớp.</div>' + sgdLegend(y, py) +
    sgdCmp('Tiểu học', C.hs_th, P ? P.hs_th : null, mx, sgdDl(C.hs_th, P ? P.hs_th : null), true) + sgdCmp('THCS', C.hs_cs, P ? P.hs_cs : null, mx, sgdDl(C.hs_cs, P ? P.hs_cs : null)) +
    '<div class="stc-cmp"><div class="stc-nm" style="color:var(--mute)">Mầm non, THPT, GDTX</div><div class="stc-hint" style="grid-column:2 / 4">Chưa có số liệu học sinh của ba cấp học này.</div></div>';
  const row = (lbl, lop, lopp, hs, max) => '<tr><td>' + lbl + '</td><td>' + sgdFmt(lop) + '</td><td>' + (sgdDl(lop, lopp) || '—') + '</td><td><b>' + sgdFmt(sgdDiv(hs, lop, 1), 1) + '</b></td><td>' + (max || '') + '</td></tr>';
  let b = sgdBig(sgdFmt(lopC), 'lớp', sgdDl(lopC, lopP, { ref: py != null ? 'so năm trước (' + sgdFmt(lopP) + ')' : '' })) +
    '<div class="stc-hint" style="margin-bottom:10px">Sĩ số bình quân chung ' + sgdFmt(sgdDiv(hsC, lopC, 1), 1) + ' học sinh/lớp' + (P ? ' (năm trước ' + sgdFmt(sgdDiv(hsP, lopP, 1), 1) + ')' : '') + '.</div>' +
    '<table class="stc-tbl"><thead><tr><th>Cấp học</th><th>Số lớp</th><th>So năm trước</th><th>Sĩ số BQ</th><th>Mức tối đa*</th></tr></thead><tbody>' +
    row('Tiểu học', C.lop_th, P ? P.lop_th : null, C.hs_th, SGD_NORMS.sisoMax.th) + row('THCS', C.lop_cs, P ? P.lop_cs : null, C.hs_cs, SGD_NORMS.sisoMax.cs) +
    '<tr class="tot"><td>Tổng</td><td>' + sgdFmt(lopC) + '</td><td>' + (sgdDl(lopC, lopP) || '—') + '</td><td>' + sgdFmt(sgdDiv(hsC, lopC, 1), 1) + '</td><td></td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:12px">* Mức tối đa theo điều lệ trường, chỉ để tham chiếu, cần Sở xác nhận. Bấm tiêu đề thẻ để xem phường/xã nào sĩ số cao nhất.</div>';
  let cols = '', labels = '';
  for (let k = 1; k <= 9; k++) {
    if (k === 6) { cols += '<div class="sgd-sepc"></div>'; labels += '<span class="sgd-sepc"></span>'; }
    const v = C['hs_k' + k], pv = P ? P['hs_k' + k] : null;
    cols += '<div class="sgd-col"><span class="sgd-cv">' + sgdFmt(v / 1000, 1) + '</span><div class="sgd-pair"><div class="sgd-b1" style="height:' + Math.round((v / 170000) * 150) + 'px" title="' + sgdFmt(v) + '"></div>' + (pv != null ? '<div class="sgd-b0" style="height:' + Math.round((pv / 170000) * 150) + 'px" title="' + sgdFmt(pv) + '"></div>' : '') + '</div></div>';
    labels += '<span>Lớp ' + k + '</span>';
  }
  const c = sgdLegend(y, py).replace('stc-lg"', 'stc-lg" style="margin-top:0"') + '<div class="sgd-cc">' + cols + '</div><div class="sgd-ccl">' + labels + '</div><div class="stc-hint" style="margin-top:10px">Khối lớp 1 so với khối lớp 5 cho biết xu hướng tuyển sinh đầu cấp.</div>';
  const dC = C.dcs_th + C.dcs_cs, dP = P ? P.dcs_th + P.dcs_cs : null;
  const rt = (lbl, cnt, den, cntP, denP) => { const r = sgdDiv(cnt, den), rp = sgdDiv(cntP, denP); return '<div class="sgd-rt"><div class="sgd-nm">' + lbl + '<small>' + sgdFmt(cnt) + ' học sinh</small></div><div class="sgd-tk"><i style="width:' + Math.min(100, (r || 0) * 10).toFixed(1) + '%"></i></div><div class="sgd-r">' + sgdFmt(r, 2) + '%</div>' + (sgdDl(r, rp, { rate: true, neutral: true, d: 2 }) || '<span></span>') + '</div>'; };
  const d = sgdBig(sgdFmt(dC), 'học sinh', sgdDl(dC, dP, { neutral: true, ref: 'so năm trước' })) + '<div class="stc-hint" style="margin-bottom:10px">Chiếm ' + sgdFmt(sgdDiv(dC, hsC), 2) + '% học sinh Tiểu học và THCS.</div>' +
    '<div>' + rt('Tiểu học', C.dcs_th, C.hs_th, P ? P.dcs_th : null, P ? P.hs_th : null) + rt('THCS', C.dcs_cs, C.hs_cs, P ? P.dcs_cs : null, P ? P.hs_cs : null) + '</div>' +
    '<div class="stc-hint" style="margin-top:8px">Thanh đo trên thang 0–10%. Tăng hay giảm đều để màu trung tính vì không tự thân là tốt hay xấu.</div>';
  return '<div class="stc-g2">' +
    sgdCard({ title: 'Học sinh theo cấp học', sub: sgdSubY('học sinh'), xa: 'hocsinh', tree: 'hocsinh', src: 'HS_TONG_SO', body: a }) +
    sgdCard({ title: 'Lớp học và sĩ số bình quân', sub: 'Số lớp · học sinh ÷ số lớp', xa: 'siso', tree: 'lop', src: 'SO_LOP', body: b }) +
    '</div><div class="stc-g21 stc-mt">' +
    sgdCard({ title: 'Học sinh theo khối lớp', sub: 'Nghìn học sinh · lớp 1–5 Tiểu học, lớp 6–9 THCS', xa: 'hocsinh', tree: 'hocsinh', src: 'MA_KHOI', body: c }) +
    sgdCard({ title: 'Học sinh diện chính sách', sub: 'Số học sinh và tỷ lệ trên tổng học sinh', xa: 'dcs', tree: 'dcs', src: 'HS_DIEN_CHINH_SACH', body: d }) + '</div>';
}
function sgdGroupVc(n) {
  const { C, P, py } = n;
  const tot = (o, k) => (o ? o[k + '_th'] + o[k + '_cs'] : null);
  const phC = sgdSum(C, SGD_PHK), phP = sgdSum(P, SGD_PHK);
  const lv = [['kc', 'Kiên cố', 'var(--s1)', false], ['bk', 'Bán kiên cố', 'var(--s4)', true], ['tm', 'Phòng học tạm', 'var(--s2)', true]];
  let a = sgdBig(sgdFmt(phC), 'phòng', sgdDl(phC, phP, { ref: py != null ? 'so năm trước (' + sgdFmt(phP) + ')' : '' })) +
    '<div class="stc-stack" style="margin-top:14px">' + lv.map((l) => '<i style="flex:' + tot(C, l[0]) + ';background:' + l[2] + '"></i>').join('') + '</div>' +
    '<div class="stc-hint" style="margin-bottom:12px">Kiên cố + bán kiên cố + tạm = tổng phòng học.</div>' +
    '<table class="stc-tbl"><thead><tr><th>Mức</th><th>' + sgdYearLabel(n.y) + '</th><th>Tỷ trọng</th><th>So năm trước</th></tr></thead><tbody>' +
    lv.map((l) => '<tr><td><i class="stc-sw" style="background:' + l[2] + '"></i>' + l[1] + '</td><td>' + sgdFmt(tot(C, l[0])) + '</td><td>' + sgdFmt(sgdDiv(tot(C, l[0]), phC), 1) + '%</td><td>' + (sgdDl(tot(C, l[0]), tot(P, l[0]), { inv: l[3] }) || '—') + '</td></tr>').join('') +
    '</tbody></table><div class="stc-hint" style="margin-top:12px">Bán kiên cố và phòng tạm giảm là tốt nên tô xanh.</div>';
  const kR = (o, lvl) => (o ? sgdDiv(o['kc_' + lvl], o['kc_' + lvl] + o['bk_' + lvl] + o['tm_' + lvl]) : null);
  const kAll = sgdDiv(tot(C, 'kc'), phC), kAllP = P ? sgdDiv(tot(P, 'kc'), phP) : null;
  const b = sgdBig(sgdFmt(kAll, 1), '%', sgdDl(kAll, kAllP, { rate: true, ref: P ? 'so năm trước (' + sgdFmt(kAllP, 1) + '%)' : '' })) +
    sgdPg('Tiểu học', sgdFmt(C.kc_th) + ' / ' + sgdFmt(C.kc_th + C.bk_th + C.tm_th), kR(C, 'th'), kR(P, 'th')) +
    sgdPg('THCS', sgdFmt(C.kc_cs) + ' / ' + sgdFmt(C.kc_cs + C.bk_cs + C.tm_cs), kR(C, 'cs'), kR(P, 'cs')) +
    (P ? '<div class="stc-hint" style="margin-top:10px">Vạch đen là năm trước: Tiểu học ' + sgdFmt(kR(P, 'th'), 1) + '%, THCS ' + sgdFmt(kR(P, 'cs'), 1) + '%.</div>' : '') +
    '<div style="margin-top:16px">' + sgdNote('Bấm tiêu đề thẻ để xem <b>phường/xã và trường còn phòng học tạm</b>.') + '</div>';
  const phL = (o, lvl) => (o ? o['kc_' + lvl] + o['bk_' + lvl] + o['tm_' + lvl] : null);
  const r = (lbl, lvl) => { const l = C['lop_' + lvl], p = phL(C, lvl); return '<tr><td>' + lbl + '</td><td>' + sgdFmt(l) + '</td><td>' + sgdFmt(p) + '</td><td><b>' + sgdFmt(sgdDiv(l, p, 1), 2) + '</b></td><td>' + (P ? sgdFmt(sgdDiv(P['lop_' + lvl], phL(P, lvl), 1), 2) : '—') + '</td><td>' + sgdFmt(Math.max(0, l - p)) + '</td></tr>'; };
  const lopC = sgdSum(C, SGD_LOPK);
  const c = '<table class="stc-tbl"><thead><tr><th>Cấp học</th><th>Số lớp</th><th>Số phòng học</th><th>Lớp / phòng</th><th>Năm trước</th><th>Thiếu phòng (ước tính)</th></tr></thead><tbody>' + r('Tiểu học', 'th') + r('THCS', 'cs') +
    '<tr class="tot"><td>Tổng</td><td>' + sgdFmt(lopC) + '</td><td>' + sgdFmt(phC) + '</td><td>' + sgdFmt(sgdDiv(lopC, phC, 1), 2) + '</td><td>' + (P ? sgdFmt(sgdDiv(sgdSum(P, SGD_LOPK), phP, 1), 2) : '—') + '</td><td>' + sgdFmt(Math.max(0, C.lop_th - phL(C, 'th')) + Math.max(0, C.lop_cs - phL(C, 'cs'))) + '</td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:12px">Thiếu phòng = số lớp − số phòng học, chỉ là ước tính thô (giả định mỗi lớp cần một phòng riêng); cần Sở xác nhận cách tính có tính phòng học hai ca hay không.</div>';
  return '<div class="stc-g2">' +
    sgdCard({ title: 'Phòng học theo mức kiên cố', sub: sgdSubY('phòng'), xa: 'phong', tree: 'phong', src: 'SO_PHONG_HOC', body: a }) +
    sgdCard({ title: 'Tỷ lệ phòng học kiên cố theo cấp', sub: 'Phòng kiên cố ÷ tổng phòng học · vạch đen = năm trước', xa: 'kienco', tree: 'phong', src: 'SO_PHONG_HOC_KIEN_CO', body: b }) +
    '</div><div class="stc-mt">' + sgdCard({ title: 'Số lớp trên một phòng học', sub: 'Số lớp ÷ số phòng học · lớn hơn 1 nghĩa là thiếu phòng, phải học ca hoặc mượn phòng chức năng', xa: 'lopphong', src: 'SO_LOP ÷ SO_PHONG_HOC', body: c }) + '</div>';
}
function sgdGroupDn(n) {
  const { C, P, py } = n;
  const t = (o, k) => (o ? o[k + '_th'] + o[k + '_cs'] : null);
  const nsC = t(C, 'ql') + t(C, 'gv') + t(C, 'nv'), nsP = P ? t(P, 'ql') + t(P, 'gv') + t(P, 'nv') : null;
  const pos = [['ql', 'Cán bộ quản lý', 'var(--s4)', true], ['gv', 'Giáo viên', 'var(--s1)', false], ['nv', 'Nhân viên', 'var(--s3)', true]];
  const a = sgdBig(sgdFmt(nsC), 'người', sgdDl(nsC, nsP, { ref: py != null ? 'so năm trước (' + sgdFmt(nsP) + ')' : '' })) + '<div class="stc-hint" style="margin-bottom:14px">Cán bộ quản lý + giáo viên + nhân viên = tổng nhân sự.</div>' +
    '<div class="stc-dn">' + sgdDonut(pos.map((p) => ({ v: t(C, p[0]), c: p[2] })), nsC, sgdFmt(nsC), 'người', 'Cơ cấu nhân sự theo vị trí') +
    '<table class="stc-tbl"><thead><tr><th>Vị trí</th><th>Số người</th><th>Tỷ trọng</th><th>So năm trước</th></tr></thead><tbody>' +
    pos.map((p) => '<tr><td><i class="stc-sw" style="background:' + p[2] + '"></i>' + p[1] + '</td><td>' + sgdFmt(t(C, p[0])) + '</td><td>' + sgdFmt(sgdDiv(t(C, p[0]), nsC), 1) + '%</td><td>' + (sgdDl(t(C, p[0]), t(P, p[0]), { neutral: p[3] }) || '—') + '</td></tr>').join('') + '</tbody></table></div>';
  const lvT = (o, l) => (o ? o['ql_' + l] + o['gv_' + l] + o['nv_' + l] : null);
  const row = (lbl, l) => '<tr><td>' + lbl + '</td><td>' + sgdFmt(lvT(C, l)) + '</td><td>' + sgdFmt(C['ql_' + l]) + '</td><td>' + sgdFmt(C['gv_' + l]) + '</td><td>' + sgdFmt(C['nv_' + l]) + '</td><td>' + (sgdDl(lvT(C, l), lvT(P, l)) || '—') + '</td></tr>';
  const stack = (l) => '<div class="stc-stack" style="margin-top:4px">' + pos.map((p) => '<i style="flex:' + C[p[0] + '_' + l] + ';background:' + p[2] + '"></i>').join('') + '</div>';
  const b = '<table class="stc-tbl"><thead><tr><th>Cấp học</th><th>Tổng</th><th>CBQL</th><th>Giáo viên</th><th>Nhân viên</th><th>So năm trước</th></tr></thead><tbody>' + row('Tiểu học', 'th') + row('THCS', 'cs') +
    '<tr class="tot"><td>Tổng</td><td>' + sgdFmt(nsC) + '</td><td>' + sgdFmt(t(C, 'ql')) + '</td><td>' + sgdFmt(t(C, 'gv')) + '</td><td>' + sgdFmt(t(C, 'nv')) + '</td><td>' + (sgdDl(nsC, nsP) || '—') + '</td></tr></tbody></table>' +
    '<div class="stc-lg" style="margin-top:18px">' + pos.map((p) => '<span><i style="background:' + p[2] + '"></i>' + p[1] + '</span>').join('') + '</div><div class="stc-hint" style="margin-top:6px">Tiểu học</div>' + stack('th') + '<div class="stc-hint" style="margin-top:10px">THCS</div>' + stack('cs');
  const nr = (lbl, l) => { const need = C['lop_' + l] * SGD_NORMS.gvPerLop[l], diff = C['gv_' + l] - need; return '<tr><td>' + lbl + '</td><td>' + sgdFmt(sgdDiv(C['hs_' + l], C['gv_' + l], 1), 1) + '</td><td><b>' + sgdFmt(sgdDiv(C['gv_' + l], C['lop_' + l], 1), 2) + '</b></td><td>' + sgdFmt(SGD_NORMS.gvPerLop[l], 2) + '</td><td>' + sgdFmt(need) + '</td><td><span class="stc-dl ' + (diff >= 0 ? 'up' : 'down') + '">' + sgdFmt(Math.abs(diff)) + '</span></td></tr>'; };
  const needAll = C.lop_th * SGD_NORMS.gvPerLop.th + C.lop_cs * SGD_NORMS.gvPerLop.cs, gvAll = t(C, 'gv');
  const c = '<table class="stc-tbl"><thead><tr><th>Cấp học</th><th>Học sinh / GV</th><th>GV / lớp</th><th>Định mức GV / lớp*</th><th>GV cần theo định mức</th><th>Chênh lệch</th></tr></thead><tbody>' + nr('Tiểu học', 'th') + nr('THCS', 'cs') +
    '<tr class="tot"><td>Chung</td><td>' + sgdFmt(sgdDiv(sgdSum(C, SGD_HSK), gvAll, 1), 1) + '</td><td>' + sgdFmt(sgdDiv(gvAll, sgdSum(C, SGD_LOPK), 1), 2) + '</td><td></td><td>' + sgdFmt(needAll) + '</td><td><span class="stc-dl ' + (gvAll >= needAll ? 'up' : 'down') + '">' + sgdFmt(Math.abs(gvAll - needAll)) + '</span></td></tr></tbody></table>' +
    '<div class="stc-hint" style="margin-top:12px">* Định mức tham chiếu cho trường học 2 buổi/ngày, cần Sở xác nhận. GV cần = số lớp × định mức; chênh dương là đủ giáo viên ở cấp Thành phố, nhưng từng phường/xã vẫn có thể thiếu (bấm tiêu đề thẻ để xem).</div>';
  return '<div class="stc-g2">' +
    sgdCard({ title: 'Nhân sự theo vị trí', sub: 'Cơ cấu và so với năm học trước · người', xa: 'nhansu', tree: 'nhansu', src: 'TONG_SO', body: a }) +
    sgdCard({ title: 'Nhân sự theo cấp học', sub: 'Người · năm học ' + sgdYearLabel(n.y), xa: 'nhansu', tree: 'nhansu', src: 'MA_CAP_HOC', body: b }) +
    '</div><div class="stc-mt">' + sgdCard({ title: 'Học sinh trên giáo viên và giáo viên trên lớp', sub: 'So với định mức giáo viên/lớp để thấy thừa hay thiếu giáo viên', xa: 'hsgv', src: 'GIAO_VIEN · HS_TONG_SO · SO_LOP', body: c }) + '</div>';
}
function sgdGroupSk(n) {
  const { C, P } = n;
  const hsC = sgdSum(C, SGD_HSK), hsP = sgdSum(P, SGD_HSK);
  const eyes = [['Cận thị', ['can_th', 'can_cs']], ['Loạn thị', ['loan']], ['Viễn thị', ['vien']], ['Bệnh về mắt khác', ['mk']], ['Bệnh khô mắt', ['kho']], ['Lác (lé)', ['lac']], ['Đục thủy tinh thể', ['duc']], ['Thoái hóa điểm vàng', ['thd']]];
  const rtRow = (e) => {
    const cnt = sgdSum(C, e[1]), r = sgdDiv(cnt, hsC), rp = P ? sgdDiv(sgdSum(P, e[1]), hsP) : null;
    return '<div class="sgd-rt"><div class="sgd-nm">' + e[0] + '<small>' + sgdFmt(cnt) + ' học sinh</small></div><div class="sgd-tk"><i style="width:' + Math.min(100, ((r || 0) / 40) * 100).toFixed(2) + '%;background:var(--s2)"></i></div><div class="sgd-r">' + (r != null && r < 0.01 ? '&lt;0,01%' : sgdFmt(r, r != null && r < 0.1 ? 2 : 1) + '%') + '</div>' + (sgdDl(r, rp, { rate: true, inv: true }) || '<span></span>') + '</div>';
  };
  const a = '<div class="stc-g2" style="gap:0 36px"><div>' + eyes.slice(0, 4).map(rtRow).join('') + '</div><div>' + eyes.slice(4).map(rtRow).join('') + '</div></div>' +
    '<div class="stc-note" style="margin-top:12px">' + SGD_ICON_INFO + '<div><b>Không cộng các dòng lại:</b> một học sinh có thể vừa cận vừa loạn thị, nên tổng các bệnh lớn hơn số học sinh có bệnh về mắt. Nhóm này hiển thị tỷ lệ riêng từng bệnh, không vẽ sơ đồ cây và không có cầu nối tăng giảm. Tăng là xấu nên tô đỏ.</div></div>';
  const lvR = (o, k, l) => (o ? sgdDiv(o[k + '_' + l], o['hs_' + l]) : null);
  const canAll = sgdDiv(C.can_th + C.can_cs, hsC), canAllP = P ? sgdDiv(P.can_th + P.can_cs, hsP) : null;
  const b = sgdBig(sgdFmt(canAll, 1), '%', sgdDl(canAll, canAllP, { rate: true, inv: true })) +
    sgdPg('Tiểu học', sgdFmt(C.can_th) + ' HS', lvR(C, 'can', 'th'), lvR(P, 'can', 'th'), 'var(--s2)') + sgdPg('THCS', sgdFmt(C.can_cs) + ' HS', lvR(C, 'can', 'cs'), lvR(P, 'can', 'cs'), 'var(--s2)') +
    (P ? '<div class="stc-hint" style="margin-top:8px">Năm trước: Tiểu học ' + sgdFmt(lvR(P, 'can', 'th'), 1) + '%, THCS ' + sgdFmt(lvR(P, 'can', 'cs'), 1) + '%.</div>' : '');
  const boiAll = sgdDiv(C.boi_th + C.boi_cs, hsC), boiAllP = P ? sgdDiv(P.boi_th + P.boi_cs, hsP) : null;
  const c = sgdBig(sgdFmt(boiAll, 1), '%', sgdDl(boiAll, boiAllP, { rate: true })) + '<div class="stc-hint">' + sgdFmt(C.boi_th + C.boi_cs) + ' học sinh' + (P ? ' (năm trước ' + sgdFmt(P.boi_th + P.boi_cs) + ' · ' + sgdFmt(boiAllP, 1) + '%)' : '') + '.</div>' +
    sgdPg('Tiểu học', sgdFmt(C.boi_th) + ' HS', lvR(C, 'boi', 'th'), lvR(P, 'boi', 'th')) + sgdPg('THCS', sgdFmt(C.boi_cs) + ' HS', lvR(C, 'boi', 'cs'), lvR(P, 'boi', 'cs'));
  const d = sgdPg('Dùng điện thoại thông minh', sgdFmt(C.sp), sgdDiv(C.sp, hsC), null, 'var(--s3)') + sgdPg('Có máy tính kết nối Internet', sgdFmt(C.pc), sgdDiv(C.pc, hsC), null, 'var(--s3)') +
    '<div class="stc-hint" style="margin-top:8px">Tỷ lệ tính trên tổng số học sinh. Cần Sở xác nhận số liệu này là số phụ huynh hay số học sinh có phụ huynh như vậy.</div>';
  return sgdCard({ title: 'Tật khúc xạ và bệnh về mắt', sub: 'Số học sinh mắc ÷ tổng học sinh · ' + sgdFmt(hsC) + ' học sinh · thang 0–40%', xa: 'can', tree: 'mat', src: 'HS_BI_*', body: a }) +
    '<div class="stc-g3 stc-mt">' +
    sgdCard({ title: 'Cận thị theo cấp học', sub: 'Vạch đen = năm trước', xa: 'can', body: b }) +
    sgdCard({ title: 'Học sinh biết bơi', sub: 'Số học sinh biết bơi ÷ tổng học sinh', xa: 'boi', tree: 'boi', body: c }) +
    sgdCard({ title: 'Điều kiện học tại nhà', sub: 'Theo số liệu phụ huynh học sinh', xa: 'sp', src: 'Giả định', warn: true, body: d }) + '</div>';
}

/* ---------- Màn: Chi tiết theo cấp bậc (sơ đồ cây thẻ số) ---------- */
function sgdTreeCtx() {
  const n = sgdNP();
  const spec = SGD_TREE.find((t) => t.id === SGD_UI.tree) || SGD_TREE[2];
  const ind = sgdEvalTree(spec, n.C, n.P);
  const byId = {}, parentOf = {};
  const walk = (x, p) => { byId[x.id] = x; if (p) parentOf[x.id] = p; (x.kids || []).forEach((k) => walk(k, x)); };
  walk(ind, null);
  return { n: n, spec: spec, ind: ind, byId: byId, parentOf: parentOf };
}
function sgdIsRate(x) { return x.kind === 'rate' || x.kind === 'rateKid'; }
function sgdNodeDl(x, withRef) {
  return sgdDl(x.now, x.prev, { rate: sgdIsRate(x), inv: x.inv, neutral: x.neutral, ref: withRef ? 'so năm trước' : '' });
}
function sgdNodeVal(x) { return sgdIsRate(x) ? sgdFmt(x.now, 1) + '%' : sgdFmt(x.now); }
function sgdOcCard(x, parent, idx, level) {
  const rate = sgdIsRate(x);
  const sh = !rate && parent && parent.kind === 'add' && parent.now > 0 && x.now != null ? (x.now / parent.now) * 100 : null;
  let sub = '', barW = 0, hasBar = false;
  if (x.den) { const r = sgdDiv(x.now, x.den); sub = sgdFmt(r, 1) + '% ' + x.denTxt; barW = r; hasBar = true; }
  else if (sh != null) { sub = sgdFmt(sh, 1) + '% ' + (level === 1 ? 'của tổng' : 'của ' + (/^[A-ZĐ]+$/.test(parent.label) ? parent.label : parent.label.toLowerCase())); barW = Math.max(sh, 0.5); hasBar = true; }
  else if (rate) { sub = sgdFmt(x.cnt) + ' học sinh'; barW = Math.min(100, ((x.now || 0) / 40) * 100); hasBar = true; }
  const dl = sgdNodeDl(x, true);
  return '<button type="button" class="stc-oc-card' + (SGD_UI.pick === x.id ? ' sel' : '') + '" style="--cc:' + (x.color || SGD_PAL[idx % 5]) + '" onclick="sgdPick(\'' + x.id + '\')"><div class="stc-nm">' + sgdE(x.label) + '</div><div class="stc-v">' + sgdNodeVal(x) + '</div><div class="stc-sh">' + sgdE(sub) + '</div>' +
    (hasBar ? '<div class="stc-bar"><i style="width:' + Math.max(0, Math.min(100, barW)).toFixed(2) + '%"></i></div>' : '') + dl + '</button>';
}
function sgdPos(i, n) { return n === 1 ? 'first last' : i === 0 ? 'first' : i === n - 1 ? 'last' : ''; }
function sgdOcDiagram(ind) {
  const kids = ind.kids;
  const has = ind.now != null;
  let h = '<div class="stc-oc"><div class="stc-oc-root"><div class="stc-k">' + sgdE(ind.label) + '</div><div class="stc-v"><span>' + (has ? sgdFmt(ind.now) : kids.length + ' tỷ lệ riêng') + '</span>' + (has ? '<small>' + sgdE(ind.unit) + '</small>' : '') + '</div>' + (has ? sgdNodeDl(ind, true) : '') + '</div><div class="stc-oc-stem"></div><div class="stc-oc-row">';
  kids.forEach((k, i) => {
    const sub = k.kids || [];
    h += '<div class="stc-oc-c ' + sgdPos(i, kids.length) + '" style="flex:' + Math.max(1, sub.length) + '">' + sgdOcCard(k, ind, i, 1);
    if (sub.length) h += '<div class="stc-oc-stem"></div><div class="stc-oc-row">' + sub.map((g, j) => '<div class="stc-oc-c ' + sgdPos(j, sub.length) + '">' + sgdOcCard(g, k, j, 2) + '</div>').join('') + '</div>';
    h += '</div>';
  });
  return h + '</div></div>';
}
function sgdNiceStep(range) {
  const p = Math.pow(10, Math.floor(Math.log10(range / 5)));
  let step = 10 * p;
  [1, 2, 5, 10].some((m) => { if (range / (m * p) <= 5) { step = m * p; return true; } return false; });
  return step;
}
function sgdWaterfall(T, node) {
  const ind = T.ind;
  let base = ind;
  if (node && node !== ind) base = (node.kids && node.kids.length) ? node : (T.parentOf[node.id] || ind);
  if (sgdIsRate(base)) return { ok: false, sub: base.label, msg: 'Các tỷ lệ bệnh về mắt không cộng dồn được (một học sinh có thể mắc nhiều bệnh) nên không có cầu nối. Xem mức thay đổi điểm % trên từng thẻ.' };
  if (!base.kids || !base.kids.length) return { ok: false, sub: base.label, msg: 'Mục này chưa có thành phần con để vẽ cầu nối.' };
  if (!base.kids.every((k) => k.prev != null && k.now != null)) return { ok: false, sub: base.label, msg: 'Chưa có số của năm học trước nên chưa vẽ được cầu nối. Chọn năm học mới hơn ở bộ chọn phía trên.' };
  const prevTotal = base.kids.reduce((a, k) => a + k.prev, 0), nowTotal = base.kids.reduce((a, k) => a + k.now, 0);
  const G = nowTotal - prevTotal;
  /* Trục dọc phải bao cả các bậc trung gian: thành phần tăng/giảm bù trừ nhau có thể vượt xa tổng hai năm */
  const pts = [prevTotal, nowTotal]; let c0 = prevTotal;
  base.kids.forEach((k) => { c0 += k.now - k.prev; pts.push(c0); });
  const lo0 = Math.min(...pts), hi0 = Math.max(...pts), span = Math.max(hi0 - lo0, Math.abs(G)) || 1;
  const half = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  let floor = Math.floor((lo0 - 0.5 * span) / half) * half;
  if (floor < 0) floor = 0;
  const ceil = Math.ceil((hi0 + 0.15 * span) / half) * half;
  const range = ceil - floor || 1, step = sgdNiceStep(range);
  const H = 220, W = 1000, sc = (v) => ((v - floor) / range) * H;
  const n = base.kids.length + 2, colW = W / n, barW = Math.min(70, colW * 0.56);
  const fI = (v) => sgdFmt(Math.round(v)), sI = (v) => sgdSgn(Math.round(v), 0);
  const steps = [{ id: '', label: 'Năm trước', from: floor, to: prevTotal, color: 'var(--prev)', val: fI(prevTotal) }];
  let cum = prevTotal;
  base.kids.forEach((k, i) => { const inc = k.now - k.prev; steps.push({ id: k.id, label: k.label, from: cum, to: cum + inc, color: k.color || SGD_PAL[i % 5], val: sI(inc) }); cum += inc; });
  steps.push({ id: '', label: 'Năm nay', from: floor, to: nowTotal, color: 'var(--ink2)', val: fI(nowTotal) });
  let bars = '', labels = '', grid = '';
  steps.forEach((s, i) => {
    const left = i * colW + (colW - barW) / 2, lo = Math.min(s.from, s.to), h = Math.max(2, Math.abs(sc(s.to) - sc(s.from)));
    bars += '<div class="stc-bar2' + (s.id && s.id === SGD_UI.pick ? ' sel' : '') + '" style="left:' + left.toFixed(1) + 'px;bottom:' + sc(lo).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;background:' + s.color + '"></div>' +
      '<div class="stc-vl2" style="left:' + left.toFixed(1) + 'px;bottom:' + (sc(lo) + h + 6).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px">' + sgdE(s.val) + '</div>' +
      (i < steps.length - 1 ? '<div class="stc-cn" style="left:' + (left + barW).toFixed(1) + 'px;bottom:' + sc(s.to).toFixed(1) + 'px;width:' + (colW - barW).toFixed(1) + 'px"></div>' : '');
    labels += '<span style="width:' + colW.toFixed(1) + 'px">' + sgdE(s.label) + '</span>';
  });
  for (let v = Math.ceil(floor / step) * step; v <= ceil; v += step) grid += '<div class="stc-gl2" style="bottom:' + sc(v).toFixed(1) + 'px"></div><div class="stc-gt" style="bottom:' + sc(v).toFixed(1) + 'px">' + sgdFmt(Math.round(v)) + '</div>';
  return { ok: true, sub: base.label + ' · ' + (base.unit || ind.unit) + ' · từ năm học ' + sgdYearLabel(T.n.py) + ' sang ' + sgdYearLabel(T.n.y), grid: grid, bars: bars, labels: labels,
    note: 'Cột xám xanh là tổng hai năm học; cột màu là phần tăng (giảm) của từng thành phần, cộng lại đúng bằng mức thay đổi chung (' + sI(G) + ').' + (floor > 0 ? ' Trục dọc cắt từ ' + fI(floor) + ' để thấy rõ các bậc.' : '') };
}
function sgdTrend(T, node) {
  if (node.now == null) return null;
  const y = T.n.y, rate = sgdIsRate(node), dd = rate ? 1 : 0, pts = [];
  for (let i = 0; i < 5; i++) {
    const yy = y - 4 + i;
    pts.push({ l: yy + '–' + String(yy + 1).slice(2), v: yy === y ? node.now : yy === T.n.py ? node.prev : null, on: yy === y });
  }
  if (pts.filter((p) => p.v != null).length < 2) return null;
  /* biểu đồ đường dùng chung (js/core/line-chart.js); năm học chưa có số: vòng rỗng ở đáy, không nội suy */
  return lcBox(pts, { fmt: (v) => sgdFmt(v, dd) + (rate ? '%' : ''), fmtAx: (v, A) => sgdFmt(v, A.dec) + (rate ? '%' : ''), pct: rate, zero: true, ghost: true, gap: true, line: 'var(--ink2)', dot: 'var(--prev)', dotOn: 'var(--s1)' }).html;
}
function sgdInherit(T, x, key) { let m = x; while (m) { if (m[key]) return m[key]; m = T.parentOf[m.id]; } return ''; }
function sgdRawOf(T, x) {
  const src = sgdInherit(T, x, 'src'), parts = src.split(' · ');
  let field = x.field || sgdInherit(T, x, 'field') || parts[1] || '';
  for (let m = x; !field && m; m = T.parentOf[m.id]) { const p = String(m.src || '').split(' · '); if (p[1]) field = p[1]; }
  return { ep: parts[0], field: field, filt: x.filt || 'MA_NAM_HOC = ' + T.n.y, val: sgdIsRate(x) ? sgdFmt(x.cnt) : sgdFmt(x.now) };
}
function sgdFormulas(T, x) {
  const par = T.parentOf[x.id] || null;
  const F = SGD_SHOW_TECH
    ? ['Nguồn: ' + sgdInherit(T, x, 'src') + (x.field ? ' · ' + x.field : '') + '.', 'Cộng dồn dữ liệu của từng trường, lọc MA_NAM_HOC = ' + T.n.y + ' và MA_GIAI_DOAN = đầu năm học (mã giai đoạn theo giả định).']
    : ['Cộng dồn số liệu của các trường, năm học ' + sgdYearLabel(T.n.y) + ', số liệu đầu năm học.'];
  if (x.kids && x.kids.length && x.kind === 'add' && x.now != null) F.push('Tổng = ' + x.kids.map((k) => sgdFmt(k.now)).join(' + ') + ' = ' + sgdFmt(x.kids.reduce((a, k) => a + k.now, 0)) + ' (khớp).');
  if (sgdIsRate(x) && x.now != null) F.push('Tỷ lệ = ' + sgdFmt(x.cnt) + ' ÷ ' + sgdFmt(sgdSum(T.n.C, SGD_HSK)) + ' học sinh = ' + sgdFmt(x.now, 1) + '%.' + (x.prev != null ? ' So năm trước = ' + sgdFmt(x.now, 1) + ' − ' + sgdFmt(x.prev, 1) + ' = ' + sgdSgn(x.now - x.prev, 1) + ' điểm %.' : ''));
  else if (x.now != null && x.prev != null && x.prev) F.push('So với năm trước = ' + sgdFmt(x.now) + ' ÷ ' + sgdFmt(x.prev) + ' − 1 = ' + sgdSgn((x.now / x.prev - 1) * 100, 1) + '%.');
  if (x.den) F.push('Tỷ lệ = ' + sgdFmt(x.now) + ' ÷ ' + sgdFmt(x.den) + ' ' + x.denTxt + ' = ' + sgdFmt(sgdDiv(x.now, x.den), 1) + '%.');
  if (par && par.kind === 'add' && x.now != null && par.now > 0 && !sgdIsRate(x)) {
    F.push('Tỷ trọng = ' + sgdFmt(x.now) + ' ÷ ' + sgdFmt(par.now) + ' = ' + sgdFmt((x.now / par.now) * 100, 1) + '%.');
    if (x.prev != null && par.prev) F.push('Đóng góp vào mức thay đổi = (' + sgdFmt(x.now) + ' − ' + sgdFmt(x.prev) + ') ÷ ' + sgdFmt(par.prev) + ' = ' + sgdSgn(((x.now - x.prev) / par.prev) * 100, 2) + ' điểm %.');
  }
  if (x.inv) F.push('Chỉ tiêu này giảm là tốt nên tăng tô đỏ, giảm tô xanh.');
  if (x.kind === 'rate') F.push('Mục này chỉ để nhóm các tỷ lệ, không có tổng vì các bệnh chồng lên nhau.');
  return F;
}
function sgdScreenDetail() {
  const T = sgdTreeCtx(), ind = T.ind;
  const node = SGD_UI.pick && T.byId[SGD_UI.pick] ? T.byId[SGD_UI.pick] : ind;
  const g = SGD_GROUPS.find((x) => x.id === T.spec.group);
  const at = SGD_TREE.findIndex((t) => t.id === T.spec.id), N = SGD_TREE.length, prevI = SGD_TREE[(at - 1 + N) % N], nextI = SGD_TREE[(at + 1) % N];
  let h = sgdHeader(g ? { group: g.id, label: g.label } : 'home');
  h += '<div style="display:grid;gap:16px;min-width:0">';
  h += '<div class="stc-card"><div class="stc-crumbs"><span>Sở GD&amp;ĐT › ' + sgdE(g ? g.label : '') + ' › ' + sgdE(ind.label) + '</span></div>' +
    '<div class="stc-ch" style="margin-bottom:6px"><div><h3 class="stc-ct" style="font-size:17px">' + sgdE(ind.label) + '</h3><div class="stc-cs">' + sgdE(ind.unit + ' · năm học ' + sgdYearLabel(T.n.y) + (ind.den ? ' · ' + sgdFmt(sgdDiv(ind.now, ind.den), 1) + '% ' + ind.denTxt : '')) + '</div></div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end"><span class="stc-hint">' + (at + 1) + ' / ' + N + '</span><button type="button" class="stc-btn" onclick="sgdStep(-1)" style="height:32px;padding:0 12px;font-size:12.5px">‹ Trước</button><button type="button" class="stc-btn" onclick="sgdStep(1)" style="height:32px;padding:0 12px;font-size:12.5px">Sau ›</button>' + sgdLnk('Theo 126 phường/xã ›', "sgdXa('" + T.spec.xa + "')") + (SGD_SHOW_TECH ? '<span class="stc-bd">' + sgdE(T.spec.src) + '</span>' : '') + '</div></div>' +
    '<div class="stc-hint" style="margin-bottom:6px">Bấm một thẻ để chọn, bấm lại để bỏ chọn. Chỉ tiêu 3 cấp (ví dụ học sinh → cấp học → khối lớp) mọc thêm hàng thẻ ngay dưới thẻ cha.</div>' + sgdOcDiagram(ind) + '</div>';
  const wf = sgdWaterfall(T, node);
  h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cầu nối tăng giảm</h3><div class="stc-cs">' + sgdE(wf.sub) + '</div></div></div>' +
    (wf.ok ? '<div class="stc-wf">' + wf.grid + wf.bars + '</div><div class="stc-wfl">' + wf.labels + '</div><div class="stc-hint" style="margin-top:12px">' + sgdE(wf.note) + '</div>' : sgdEmpty('Chưa vẽ được cầu nối', wf.msg)) + '</div>';
  const tr = sgdTrend(T, node);
  h += '<div class="stc-g2"><div class="stc-card"><div class="stc-ch" style="margin-bottom:8px"><div><h3 class="stc-ct">Xu hướng theo năm học</h3><div class="stc-cs">' + sgdE(node.label) + '</div></div></div>' +
    (tr ? tr + '<div class="stc-hint" style="margin-top:6px">Chỉ vẽ điểm khi có số của năm học đó. Năm học chưa có để trống và <b>không nội suy</b>; có thêm năm học thì điểm tự vẽ thêm.</div>' : sgdEmpty('Chưa vẽ được xu hướng', node.now == null ? 'Mục này chỉ để nhóm các tỷ lệ, không có số chung. Bấm một thẻ để xem xu hướng của thẻ đó.' : 'Cần ít nhất hai năm học có số.')) + '</div>';
  const rows = node.kids && node.kids.length ? node.kids.map((k) => sgdRawOf(T, k)) : [sgdRawOf(T, node)];
  /* Bản không kỹ thuật (mặc định): chỉ tên thành phần và giá trị, không có endpoint/trường dữ liệu */
  const plain = (node.kids && node.kids.length ? node.kids : [node]).map((k) => ({ l: k.label, v: sgdIsRate(k) ? sgdFmt(k.cnt) + ' học sinh · ' + sgdFmt(k.now, 1) + '%' : sgdFmt(k.now) }));
  if (!SGD_SHOW_TECH) h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Số liệu thành phần</h3><div class="stc-cs">' + sgdE(node.label) + ' · năm học ' + sgdYearLabel(T.n.y) + '</div></div></div>' +
    '<table class="stc-tbl"><thead><tr><th>Thành phần</th><th>Giá trị</th></tr></thead><tbody>' + plain.map((r) => '<tr><td>' + sgdE(r.l) + '</td><td>' + r.v + '</td></tr>').join('') + '</tbody></table>' +
    '<div class="stc-hint" style="margin-top:12px">' + (node.kind === 'rate' ? 'Mỗi dòng là tổng số học sinh mắc bệnh, cộng từ các trường.' : 'Mỗi dòng là tổng cộng từ các trường. Bấm "Theo 126 phường/xã" để xem theo từng đơn vị.') + '</div></div></div>';
  else h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Số liệu gốc từ API</h3><div class="stc-cs">' + sgdE(node.label) + '</div></div></div><div class="sgd-rawh"><span>Endpoint</span><span>Trường dữ liệu</span><span>Lọc</span><span>Giá trị</span></div>' +
    rows.map((r) => '<div class="sgd-raw"><span class="sgd-mono">' + sgdE(r.ep) + '</span><span class="sgd-mono">' + sgdE(r.field) + '</span><span>' + sgdE(r.filt) + '</span><span>' + r.val + '</span></div>').join('') +
    '<div class="stc-hint" style="margin-top:12px">' + (node.kind === 'rate' ? 'Mỗi dòng là tổng số học sinh mắc bệnh, cộng từ các trường; tỷ lệ tính ở form.' : 'Mỗi dòng là tổng cộng từ bản ghi các trường (số giả lập). Bấm "Theo 126 phường/xã" để xem theo từng đơn vị.') + '</div></div></div>';
  /* Khối Cách tính ẨN theo cờ chung SHOW_FORMULA_BOX (dashboard-vhtt.js): cách tính để trong tài liệu mô tả, không hiện trên giao diện.
     Không có cờ (trang độc lập không nạp dashboard-vhtt.js) cũng ẩn — chỉ hiện khi SHOW_FORMULA_BOX = true */
  if (typeof SHOW_FORMULA_BOX !== 'undefined' && SHOW_FORMULA_BOX) h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cách tính · ' + sgdE(node.label) + '</h3><div class="stc-cs">Công thức tính từ số liệu của các trường, không có số nào tự đặt</div></div></div><div class="stc-fl">' +
    sgdFormulas(T, node).map((t) => '<div class="stc-note" style="padding:9px 12px;font-size:12.5px">' + sgdE(t) + '</div>').join('') + '</div></div>';
  h += '</div><div class="stc-pn"><button type="button" class="stc-btn" onclick="sgdStep(-1)">‹ ' + sgdE(prevI.label) + '</button><button type="button" class="stc-btn" onclick="sgdStep(1)">' + sgdE(nextI.label) + ' ›</button></div>';
  return h + sgdFoot();
}

/* ---------- Màn: Chỉ tiêu theo 126 phường/xã ---------- */
function sgdNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }
function sgdXaCtx() {
  const X = SGD_UI.xa, n = sgdNP();
  const ind = SGD_XA_INDS.find((x) => x.id === X.ind) || SGD_XA_INDS[4];
  const isC = ind.type === 'count', cols = isC ? ind.parts : ind.cols;
  const val = (o) => (!o ? null : isC ? (ind.parts.every((c) => c.f(o) != null) ? ind.parts.reduce((a, c) => a + c.f(o), 0) : null) : sgdDiv(ind.num(o), ind.den(o), ind.m));
  const showV = (v) => (v == null ? '—' : sgdFmt(v, isC ? 0 : ind.d) + (ind.pct ? '%' : ''));
  const showC = (c, o) => { const v = o ? c.f(o) : null; return v == null ? '—' : sgdFmt(v, c.d) + (c.pct ? '%' : ''); };
  const TPn = isC ? val(n.C) : sgdDiv(ind.num(n.C), ind.den(n.C), ind.m);
  const TPp = n.P ? (isC ? val(n.P) : sgdDiv(ind.num(n.P), ind.den(n.P), ind.m)) : null;
  const deltaOf = (v, p) => (v == null || p == null ? null : isC ? (p ? (v / p - 1) * 100 : null) : v - p);
  const clsOf = (x) => {
    if (x == null) return '';
    if (Math.abs(x) < 0.05) return 'stc-dl flat';
    const up = x > 0;
    if (ind.better === 'high') return up ? 'stc-dl up' : 'stc-dl down';
    if (ind.better === 'low') return up ? 'stc-dl up bad' : 'stc-dl down good';
    return up ? 'stc-dl up n' : 'stc-dl down n';
  };
  const dTxt = (x) => (x == null ? '—' : sgdFmt(Math.abs(x), isC ? 1 : ind.pct ? 1 : ind.d) + (isC ? '%' : ind.pct ? ' điểm %' : ''));
  const dKind = isC ? 'rel' : ind.pct ? 'rate' : 'abs';
  /* tp = true: cột so với mức Thành phố (chỉ tiêu số đếm thì cột này là tỷ trọng trong tổng Thành phố) */
  const dTip = (v, p, tp) => ' title="' + sgdE(tp && isC ? 'Tỷ trọng: phần của đơn vị này trong tổng toàn Thành phố = số của đơn vị ÷ tổng Thành phố × 100.' : sgdDlTip(dKind, ind.better, v, p, ind.d, tp)) + '" style="cursor:help"';
  const all = sgdUnits().map((r) => ({ r: r, v: val(r.v[n.y]), p: n.py != null ? val(r.v[n.py]) : null }));
  const byV = all.slice().sort((a, b) => (ind.better === 'low' ? a.v - b.v : b.v - a.v));
  byV.forEach((x, i) => { x.rank = i + 1; });
  return { X: X, n: n, ind: ind, isC: isC, cols: cols, val: val, showV: showV, showC: showC, TPn: TPn, TPp: TPp, deltaOf: deltaOf, clsOf: clsOf, dTxt: dTxt, dTip: dTip, all: all, byV: byV };
}
function sgdScreenXa() {
  const K = sgdXaCtx(), { X, n, ind, isC, cols, showV, showC, TPn, TPp, deltaOf, clsOf, dTxt, dTip, all, byV } = K;
  const q = sgdNorm(X.q);
  const list = all.filter((x) => (X.f === 'all' || (X.f === 'x' ? x.r.isXa : !x.r.isXa)) && (!q || sgdNorm(x.r.name).indexOf(q) >= 0));
  const keyOf = (x) => {
    if (X.sk === 'name') return x.r.name;
    if (X.sk === 'd') { const d = deltaOf(x.v, x.p); return d == null ? -1e9 : d; }
    if (X.sk.charAt(0) === 'c') { const v = cols[+X.sk.slice(1)].f(x.r.v[n.y]); return v == null ? -1e9 : v; }
    return x.v == null ? -1e9 : x.v;
  };
  list.sort((a, b) => { const ka = keyOf(a), kb = keyOf(b); return (typeof ka === 'string' ? ka.localeCompare(kb, 'vi') : ka - kb) * X.sd; });
  X.order = list.map((x) => x.r.name);   // thứ tự đang hiện — cho nút ‹ Trước / Sau › trong khung hồ sơ
  const selValid = X.sel && all.some((x) => x.r.name === X.sel);
  /* Kiểu khung trượt: chỉ có hồ sơ khi người dùng BẤM một dòng. Kiểu cũ: luôn có hồ sơ, mặc định dòng đầu. */
  const selName = selValid ? X.sel : SGD_XA_DRAWER ? null : (list[0] ? list[0].r.name : all[0].r.name);
  const arrow = (k) => (X.sk === k ? (X.sd > 0 ? ' ↑' : ' ↓') : '');
  const heads = [{ l: 'Phường/xã', k: 'name' }].concat(cols.map((c, i) => ({ l: c.label, k: 'c' + i }))).concat([{ l: ind.vh, k: 'v' }, { l: 'So năm trước', k: 'd' }, { l: isC ? 'Tỷ trọng TP' : 'So với TP', k: 's' }]);
  const grid = '40px minmax(150px,1.7fr) ' + cols.map(() => 'minmax(0,1fr)').join(' ') + ' minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';
  const shortN = (s) => s.replace(/^(Phường|Xã) /, '');

  /* Cột trái: danh sách chỉ tiêu */
  let nav = '<div class="stc-card sgd-nav" style="padding:12px 8px 14px"><div class="stc-nvh">Chỉ tiêu</div>';
  SGD_GROUPS.forEach((g) => {
    nav += '<div class="stc-nvg">' + sgdE(g.label) + '</div>' + SGD_XA_INDS.filter((x) => x.g === g.id).map((x) => '<button type="button" class="stc-nvi' + (x.id === ind.id ? ' on' : '') + '" onclick="sgdXaInd(\'' + x.id + '\')">' + sgdE(x.label) + '</button>').join('');
  });
  nav += '</div>';

  /* Thẻ tổng hợp */
  const best = byV[0], worst = byV[byV.length - 1], dTP = deltaOf(TPn, TPp);
  const chips = [{ k: 'Toàn Thành phố', v: showV(TPn), s: dTP == null ? 'Chưa có năm học so sánh' : Math.abs(dTP) < 0.05 ? 'Không đổi so năm trước' : (dTP > 0 ? '▲ ' : '▼ ') + dTxt(dTP) + ' so năm trước' }];
  if (isC) chips.push({ k: 'Bình quân mỗi đơn vị', v: sgdFmt(TPn / all.length), s: ind.unit || '' });
  chips.push({ k: ind.better === 'low' ? 'Tốt nhất (thấp nhất)' : 'Cao nhất', v: showV(best.v), s: shortN(best.r.name) });
  chips.push({ k: ind.better === 'low' ? 'Kém nhất (cao nhất)' : 'Thấp nhất', v: showV(worst.v), s: shortN(worst.r.name) });
  if (!isC) chips.push({ k: ind.better === 'none' ? 'Dưới mức Thành phố' : 'Kém hơn mức Thành phố', v: all.filter((x) => x.v != null && (ind.better === 'low' ? x.v > TPn : x.v < TPn)).length + ' / ' + all.length, s: 'đơn vị' });
  const desc = (isC ? 'Cộng dồn từ các trường của từng phường/xã' : 'Tính = ' + ind.numL + ' ÷ ' + ind.denL + (ind.pct ? ' × 100' : '') + '; mức Thành phố là bình quân gia quyền') + ' · năm học ' + sgdYearLabel(n.y);
  let right = '<div class="stc-card"><div class="stc-crumbs"><span>Sở GD&amp;ĐT › ' + sgdE((SGD_GROUPS.find((g) => g.id === ind.g) || {}).label || '') + ' › ' + sgdE(ind.label) + ' › 126 phường/xã</span></div>' +
    '<div class="stc-ch" style="margin-bottom:12px"><div><h3 class="stc-ct" style="font-size:17px">' + sgdE(ind.label) + '</h3><div class="stc-cs">' + sgdE(desc) + '</div></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + (ind.tree ? sgdLnk('Chi tiết theo cấp bậc ›', "sgdDetail('" + ind.tree + "')") : '') + (SGD_SHOW_TECH ? '<span class="stc-bd">' + sgdE(ind.src) + '</span>' : '') + '</div></div>' +
    '<div class="stc-mchips" style="margin-bottom:0">' + chips.map((c) => '<div class="stc-mchip"><div class="stc-k">' + sgdE(c.k) + '</div><div class="stc-v">' + c.v + '</div><div class="stc-hint">' + sgdE(c.s) + '</div></div>').join('') + '</div></div>';

  /* Bảng 126 đơn vị */
  const nP = all.filter((x) => !x.r.isXa).length, nX = all.length - nP;
  right += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px;align-items:center"><div class="sgd-pills">' +
    [['all', 'Tất cả · ' + all.length], ['p', 'Phường · ' + nP], ['x', 'Xã · ' + nX]].map((f) => '<button type="button" class="sgd-pill' + (X.f === f[0] ? ' on' : '') + '" onclick="sgdXaF(\'' + f[0] + '\')">' + f[1] + '</button>').join('') +
    '</div><label class="sgd-search"><small>Tìm</small><input id="sgdQ" type="text" value="' + sgdE(X.q) + '" oninput="sgdXaQ(this.value)" placeholder="Tên phường/xã, gõ không dấu" aria-label="Tìm phường/xã"></label></div>' +
    '<div class="sgd-xt-box"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + grid + '"><span>Hạng</span>' +
    heads.map((hd, i) => '<button type="button" class="sgd-hbtn' + (i === 0 ? ' left' : '') + '" onclick="sgdXaSort(\'' + hd.k + '\')">' + sgdE(hd.l) + '<span>' + arrow(hd.k) + '</span></button>').join('') + '</div>' +
    list.map((x) => {
      const d = deltaOf(x.v, x.p), s = x.v == null ? null : isC ? (x.v / TPn) * 100 : x.v - TPn;
      return '<div class="sgd-xt-row' + (x.r.name === selName ? ' on' : '') + '" style="grid-template-columns:' + grid + '"><span class="sgd-no">' + x.rank + '</span><button type="button" class="sgd-xbtn" onclick="sgdXaSel(' + sgdE(JSON.stringify(x.r.name)) + ')" title="' + sgdE(x.r.name) + '">' + sgdE(x.r.name) + '</button>' +
        cols.map((c) => '<span class="sgd-num">' + showC(c, x.r.v[n.y]) + '</span>').join('') +
        '<span class="sgd-num sgd-strong">' + showV(x.v) + '</span><span class="sgd-num"><span class="' + clsOf(d) + '"' + (d == null ? '' : dTip(x.v, x.p)) + '>' + dTxt(d) + '</span></span>' +
        '<span class="sgd-num"><span class="' + (isC ? '' : clsOf(s)) + '"' + (s == null ? '' : dTip(x.v, TPn, true)) + '>' + (s == null ? '—' : isC ? sgdFmt(s, 2) + '%' : sgdFmt(Math.abs(s), ind.d) + (ind.pct ? ' điểm %' : '')) + '</span></span></div>';
    }).join('') + '</div>' +
    '<div class="stc-hint" style="margin-top:10px">Đang hiện ' + list.length + ' / ' + all.length + ' đơn vị. ' + (ind.better === 'none' ? 'Chỉ tiêu này không xếp tốt/xấu, hạng theo giá trị từ cao xuống thấp.' : ind.better === 'low' ? 'Chỉ tiêu càng thấp càng tốt: hạng 1 là thấp nhất.' : 'Chỉ tiêu càng cao càng tốt: hạng 1 là cao nhất.') + '</div></div>';

  let h = sgdHeader('home');
  h += '<div class="stc-explore">' + nav + '<div style="display:grid;gap:16px;min-width:0">' + right + (selName && !SGD_XA_DRAWER ? sgdXaProfileHtml(K, selName) : '') + '</div></div>';
  h += '<div class="stc-mt">' + sgdNote('<b>Cách tạo số giả lập:</b> tổng Thành phố chia cho 126 phường/xã theo quy mô trong file "SỐ LIỆU TRƯỜNG HỌC" 07/2026, có nhiễu ngẫu nhiên cố định (lần nào mở cũng ra cùng số). Số cộng lại khớp tổng, số con không vượt số cha. Khi có số liệu thật chỉ thay nguồn, giữ nguyên cách hiển thị.' + (SGD_SHOW_TECH ? ' Gộp theo MA_XA của hồ sơ trường; bảng thống kê ghép qua MA_TRUONG.' : '')) + '</div>';
  if (selName && SGD_XA_DRAWER) h += sgdXaDrawerHtml(K, selName);
  return h + sgdFoot();
}
/* Khung hồ sơ trượt từ bên phải (thay cho kiểu cũ hiện hồ sơ nối dưới bảng — anh góp ý 2026-09-26 là bấm xong
   phải cuộn xuống mới thấy, không hợp lý). Bảng phía sau giữ nguyên vị trí; đóng bằng ×, bấm nền mờ hoặc Esc. */
function sgdXaDrawerHtml(K, selName) {
  const X = K.X, at = X.order.indexOf(selName), N = X.order.length;
  const nav = (d, label) => { const ok = at >= 0 && at + d >= 0 && at + d < N; return '<button type="button" class="sgd-dw-nav"' + (ok ? ' onclick="sgdXaStep(' + d + ')"' : ' disabled') + '>' + label + '</button>'; };
  const anim = X.anim ? ' sgd-dw-anim' : '';
  X.anim = false;
  return '<div class="sgd-dw-bg' + anim + '" onclick="sgdXaSel(null)"></div>' +
    '<aside class="sgd-dw' + anim + '" role="dialog" aria-label="Hồ sơ ' + sgdE(selName) + '">' +
    '<div class="sgd-dw-top">' + nav(-1, '‹ Trước') + nav(1, 'Sau ›') + '<span class="sgd-dw-pos">' + (at >= 0 ? (at + 1) + ' / ' + N : '') + '</span>' +
    '<button type="button" class="sgd-dw-x" onclick="sgdXaSel(null)" title="Đóng (Esc)" aria-label="Đóng">×</button></div>' +
    '<div class="sgd-dw-body">' + sgdXaProfileHtml(K, selName) + '</div></aside>';
}
/* Hồ sơ phường/xã đang chọn — dùng chung cho khung trượt (mặc định) và kiểu cũ (SGD_XA_DRAWER = false) */
function sgdXaProfileHtml(K, selName) {
  const { n, ind, isC, showV, showC, TPn, deltaOf, clsOf, dTxt, dTip, all } = K;
  const shortN = (s) => s.replace(/^(Phường|Xã) /, '');
  const sx = all.find((x) => x.r.name === selName), sr = sx.r, oN = sr.v[n.y], oP = n.py != null ? sr.v[n.py] : null;
  const sd = deltaOf(sx.v, sx.p), sdiff = sx.v == null || isC ? null : sx.v - TPn;
  const parts = isC
    ? ind.parts.map((c) => ({ l: c.label, v: showC(c, oN), p: showC(c, oP), tp: sgdFmt(c.f(n.C)) }))
    : [{ l: ind.numL, v: sgdFmt(ind.num(oN)), p: oP ? sgdFmt(ind.num(oP)) : '—', tp: sgdFmt(ind.num(n.C)) }, { l: ind.denL, v: sgdFmt(ind.den(oN)), p: oP ? sgdFmt(ind.den(oP)) : '—', tp: sgdFmt(ind.den(n.C)) }, { l: ind.label, v: showV(sx.v), p: showV(sx.p), tp: showV(TPn) }]
      .concat(ind.cols.filter((c) => c.pct || c.d).map((c) => ({ l: ind.label + ' · ' + c.label, v: showC(c, oN), p: showC(c, oP), tp: showC(c, n.C) })));
  const pg = 'minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)';
  const isCur = n.y === SGD_YEARS[0];
  const sch = sgdSchools(sr).filter((s) => ind.scope === 'all' || s.cap === 'th' || s.cap === 'cs');
  const hasVal = ind.scope !== 'all';
  const sgrid = hasVal ? 'minmax(0,2fr) minmax(0,.9fr) minmax(0,1fr) minmax(0,.7fr) minmax(0,.9fr)' : 'minmax(0,2fr) minmax(0,.9fr) minmax(0,1fr) minmax(0,.7fr)';
  const schRows = sch.map((s) => ({ s: s, v: hasVal ? K.val(s.o) : null })).sort((a, b) => (hasVal ? (b.v == null ? -1 : b.v) - (a.v == null ? -1 : a.v) : 0));
  const tot = (keys) => keys.reduce((a, k) => a + oN[k], 0);
  return '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct" style="font-size:17px">' + sgdE(sr.name) + '</h3><div class="stc-cs">Hạng ' + sx.rank + ' / ' + all.length + ' theo ' + sgdE(ind.label.toLowerCase()) + ' · ' + (sr.isXa ? 'xã' : 'phường') + '</div></div>' + (SGD_SHOW_TECH ? '<span class="stc-bd">MA_XA</span>' : '') + '</div>' +
    sgdBig(showV(sx.v) + (isC && ind.unit ? ' <small>' + sgdE(ind.unit) + '</small>' : ''), '', isC ? (sd == null ? '' : '<span class="' + clsOf(sd) + '"' + dTip(sx.v, sx.p) + '>' + dTxt(sd) + ' <span class="stc-ref">so năm trước · chiếm ' + sgdFmt((sx.v / TPn) * 100, 2) + '% Thành phố</span></span>') : (sdiff == null ? '' : '<span class="' + clsOf(sdiff) + '"' + dTip(sx.v, TPn, true) + '>' + sgdFmt(Math.abs(sdiff), ind.d) + (ind.pct ? ' điểm %' : '') + ' <span class="stc-ref">so mức Thành phố (' + showV(TPn) + ')</span></span>')) +
    '<div class="stc-mchips" style="margin-top:14px">' + [['Số trường', tot(SGD_TRK)], ['Trường chuẩn QG', tot(SGD_CQK)], ['Học sinh TH + THCS', tot(SGD_HSK)], ['Lớp học', tot(SGD_LOPK)], ['Phòng học', tot(SGD_PHK)], ['Giáo viên', oN.gv_th + oN.gv_cs]].map((c) => '<div class="stc-mchip"><div class="stc-k">' + c[0] + '</div><div class="stc-v">' + sgdFmt(c[1]) + '</div></div>').join('') + '</div>' +
    '<div class="stc-sec" style="margin:6px 0 8px">Thành phần của chỉ tiêu</div>' +
    '<div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + pg + '"><span>Thành phần</span><span class="sgd-num">' + sgdE(shortN(sr.name)) + '</span><span class="sgd-num">Năm trước</span><span class="sgd-num">Toàn Thành phố</span></div>' +
    parts.map((p) => '<div class="sgd-xt-row" style="grid-template-columns:' + pg + '"><span>' + sgdE(p.l) + '</span><span class="sgd-num"><b>' + p.v + '</b></span><span class="sgd-num">' + p.p + '</span><span class="sgd-num">' + p.tp + '</span></div>').join('') +
    '<div class="stc-sec" style="margin:22px 0 8px">Danh sách trường · ' + sch.length + ' trường (tên trường là tên mẫu' + (isCur ? '' : ', số của năm học ' + sgdYearLabel(SGD_YEARS[0])) + ')</div>' +
    '<div class="sgd-xt-box" style="max-height:420px"><div class="sgd-xt-row sgd-xt-head" style="grid-template-columns:' + sgrid + '"><span>Trường</span><span>Cấp học</span><span>Loại hình</span><span>Chuẩn QG</span>' + (hasVal ? '<span class="sgd-num">' + sgdE(ind.label) + '</span>' : '') + '</div>' +
    schRows.map((x) => '<div class="sgd-xt-row" style="grid-template-columns:' + sgrid + '"><span>' + sgdE(x.s.name) + '</span><span>' + sgdE(x.s.capLabel) + '</span><span>' + (x.s.o.ncl ? (x.s.o.qt ? 'Quốc tế' : 'Ngoài công lập') : 'Công lập') + '</span><span class="' + (x.s.o['cq_' + x.s.cap] ? 'sgd-ok' : 'sgd-mute') + '">' + (x.s.o['cq_' + x.s.cap] ? 'Đạt' : '—') + '</span>' + (hasVal ? '<span class="sgd-num"><b>' + showV(x.v) + '</b></span>' : '') + '</div>').join('') + '</div>' +
    '<div class="stc-hint" style="margin-top:10px">' + (ind.scope === 'all' ? 'Hiện đủ 5 cấp học từ hồ sơ trường.' : 'Chỉ hiện trường Tiểu học và THCS vì hiện chỉ có số liệu của hai cấp này. Số của các trường cộng lại đúng bằng số của phường/xã.') + '</div></div>';
}

/* ---------- Màn: Nguồn dữ liệu, giả định, quy tắc trình bày ---------- */
function sgdScreenSrc() {
  const eps = [['dm_cap_hoc', 'MA, TEN', 'Tên cấp học'], ['hoso_truong_mn · _c1 · _c2 · _c3 · _gdtx', 'MA, MA_XA, MA_LOAI_HINH_TRUONG, MA_DAT_CHUAN_DANH_GIA_CLGD, IS_*', 'Số trường, loại hình, chuẩn quốc gia, điều kiện cơ bản, gộp theo phường/xã'], ['thongke_hocsinh_c1 · _c2', 'HS_TONG_SO, MA_KHOI', 'Học sinh theo cấp và khối'], ['thongke_lophoc_c1 · _c2', 'SO_LOP, LOP_1 … LOP_9', 'Lớp học, sĩ số, lớp/phòng'], ['thongke_phonghoc_c1 · _c2', 'SO_PHONG_HOC, _KIEN_CO, _BAN_KIEN_CO, _TAM', 'Phòng học, tỷ lệ kiên cố'], ['thongke_nhansu_c1 · _c2', 'TONG_SO, CBQL, GIAO_VIEN, NHAN_VIEN', 'Nhân sự, HS/GV, GV/lớp'], ['thongke_hocsinhdienchinhsach_c1 · _c2', 'HS_DIEN_CHINH_SACH', 'Học sinh diện chính sách'], ['thongke_hocsinhsuckhoe_c1 · _c2', 'HS_BI_*, HS_BIET_BOI, SO_PH_*', 'Bệnh về mắt, biết bơi, điều kiện học tại nhà']];
  let h = sgdHeader('home');
  h += '<div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Endpoint và chỉ tiêu sử dụng</h3><div class="stc-cs">Mỗi endpoint trả bản ghi theo từng trường (MA_TRUONG), năm học (MA_NAM_HOC) và giai đoạn (MA_GIAI_DOAN)</div></div></div>' +
    '<table class="stc-tbl sgd-tbl-l"><thead><tr><th>Endpoint</th><th>Trường dữ liệu chính</th><th>Dùng cho chỉ tiêu</th><th>Trạng thái</th></tr></thead><tbody>' +
    eps.map((e) => '<tr><td class="sgd-mono">' + sgdE(e[0]) + '</td><td class="sgd-mono">' + sgdE(e[1]) + '</td><td>' + sgdE(e[2]) + '</td><td><span class="stc-bd warn">Chỉ có schema</span></td></tr>').join('') +
    '<tr><td>Thống kê Mầm non, THPT, GDTX</td><td>—</td><td>Học sinh, lớp, phòng, nhân sự của ba cấp này</td><td><span class="stc-bd" style="color:var(--bad);border-color:currentColor">Chưa có endpoint</span></td></tr></tbody></table></div>';
  h += '<div class="stc-g2 stc-mt"><div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Giả định đang dùng</h3><div class="stc-cs">Cần Sở GD&amp;ĐT xác nhận · sửa ở js/core/sgd-config.js</div></div><span class="stc-bd warn">' + SGD_ASSUME.length + ' giả định</span></div><ol class="sgd-rules">' + SGD_ASSUME.map((a) => '<li>' + sgdE(a) + '</li>').join('') + '</ol></div>' +
    '<div class="stc-card"><div class="stc-ch"><div><h3 class="stc-ct">Quy tắc trình bày</h3><div class="stc-cs">Giữ đúng các quy tắc đã chốt với bộ chỉ tiêu Sở Tài chính</div></div></div><ol class="sgd-rules">' +
    ['Không có tab: trang chủ có 5 thẻ nhóm, mỗi nhóm một màn; thêm màn Chi tiết theo cấp bậc và màn Theo 126 phường/xã.', 'Sơ đồ cây thẻ số cho chỉ tiêu cộng được; chỉ tiêu 3 cấp mọc thêm hàng thẻ.', 'Cầu nối tăng giảm so năm học này với năm học trước.', 'Tỷ lệ (bệnh về mắt, tỷ lệ chuẩn, tỷ lệ kiên cố) không cộng lại, không vẽ cây, không cầu nối.', 'Cận thị, phòng tạm, bán kiên cố tăng là đỏ; diện chính sách, CBQL, nhân viên để màu trung tính.', 'Trung bình Thành phố luôn là bình quân gia quyền (tổng tử ÷ tổng mẫu).', 'Không nội suy năm học thiếu số; không tự đặt số mục tiêu khi chưa có chỉ tiêu kế hoạch.'].map((t) => '<li>' + sgdE(t) + '</li>').join('') + '</ol></div></div>';
  h += '<div class="stc-mt">' + sgdNote('<b>Cần xin Sở GD&amp;ĐT:</b> (1) bản ghi thật của 18 endpoint cho ít nhất hai năm học; (2) danh mục mã giai đoạn, loại hình, đạt chuẩn, kiểm định, khối; (3) ý nghĩa SO_PH_*; (4) có hay không endpoint thống kê cho Mầm non, THPT, GDTX; (5) MA_XA là mã phường/xã mới (126 đơn vị) hay mã cũ — nếu mã cũ cần bảng đối chiếu.') + '</div>';
  return h + sgdFoot();
}

/* ---------- Dựng màn + điều khiển ---------- */
function sgdScreenHtml() {
  if (SGD_UI.screen === 'group') return sgdScreenGroup();
  if (SGD_UI.screen === 'detail') return sgdScreenDetail();
  if (SGD_UI.screen === 'xa') return sgdScreenXa();
  if (SGD_UI.screen === 'src') return sgdScreenSrc();
  return sgdScreenHome();
}
function sgdScreenMeta() {
  const base = 'Sở Giáo dục và Đào tạo';
  if (SGD_UI.screen === 'group') { const gi = Math.max(0, SGD_GROUPS.findIndex((g) => g.id === SGD_UI.group)); return { title: base + ' — ' + SGD_GROUPS[gi].label, sub: 'Nhóm ' + (gi + 1) + '/' + SGD_GROUPS.length + ' · năm học ' + sgdYearLabel(SGD_UI.year) }; }
  if (SGD_UI.screen === 'detail') { const t = SGD_TREE.find((x) => x.id === SGD_UI.tree); return { title: base + ' — Chi tiết chỉ tiêu', sub: t ? t.label : '' }; }
  if (SGD_UI.screen === 'xa') { const t = SGD_XA_INDS.find((x) => x.id === SGD_UI.xa.ind); return { title: base + ' — Chỉ tiêu theo 126 phường/xã', sub: (t ? t.label + ' · ' : '') + 'năm học ' + sgdYearLabel(SGD_UI.year) }; }
  if (SGD_UI.screen === 'src') return { title: base + ' — Nguồn dữ liệu và giả định', sub: '18 API Sở GD&ĐT (hiện chỉ có schema)' };
  return { title: base + ' — Bộ chỉ tiêu giáo dục Thủ đô', sub: 'Tổng hợp từ dữ liệu từng trường, cộng dồn lên 126 phường/xã và toàn Thành phố' };
}
function sgdTasksHtml() {
  if (typeof fieldScenarioSummary !== 'function') return '';
  try { return '<div class="stc-tasks" style="margin-top:18px">' + fieldScenarioSummary('cat::' + (SGD_UI.role || (typeof currentRole !== 'undefined' ? currentRole : 'UBND')) + '::ubnd-gddt') + '</div>'; } catch (e) { return ''; }
}
function sgdRerender(resetScroll) {
  const body = document.getElementById('modalBody'), title = document.getElementById('modalTitle'), sub = document.getElementById('modalSub');
  if (!body || !SGD_UI.open) return;
  const top = body.scrollTop, meta = sgdScreenMeta();
  if (title) title.textContent = meta.title;
  if (sub) sub.textContent = 'DỮ LIỆU GIẢ LẬP · ' + meta.sub;
  let html;
  try { html = sgdScreenHtml(); } catch (e) { console.error(e); html = sgdEmpty('Không dựng được màn hình', 'Có lỗi khi tính số liệu giả lập: ' + (e && e.message ? e.message : e)); }
  body.innerHTML = '<div class="stc-root sgd-root stc-wrap">' + html + '</div>' + sgdTasksHtml();
  if (typeof lcFit === 'function') lcFit(body);
  body.scrollTop = resetScroll ? 0 : top;
  if (SGD_UI.focusQ) {
    const inp = body.querySelector('#sgdQ');
    if (inp) { inp.focus(); const L = inp.value.length; try { inp.setSelectionRange(L, L); } catch (e) { /* bỏ qua */ } }
    SGD_UI.focusQ = false;
  }
}
function sgdOpenForm(itemIndex, role) {
  if (role) SGD_UI.role = role;
  const it = typeof itemIndex === 'number' ? SGD_ITEMS[itemIndex] : null;
  const key = it ? it.sgdKey : 'home';
  SGD_UI.dd = null; SGD_UI.pick = null; SGD_UI.xa.sel = null;
  if (key === 'xa') SGD_UI.screen = 'xa';
  else if (SGD_GROUPS.some((g) => g.id === key)) { SGD_UI.screen = 'group'; SGD_UI.group = key; }
  else SGD_UI.screen = 'home';
  if (typeof STC_UI !== 'undefined') STC_UI.open = false;          // popup đang thuộc về form Sở GD&ĐT
  if (typeof HCC_UI !== 'undefined') HCC_UI.open = false;
  SGD_UI.open = true;
  sgdRerender(true);
  if (typeof openModal === 'function') openModal();
  /* lần dựng đầu popup còn ẩn: vẽ lại biểu đồ đường khi popup đã hiện */
  if (typeof lcFit === 'function') lcFit(document.getElementById('modalBody'));
}
function sgdClose() { SGD_UI.open = false; if (typeof closeModal === 'function') closeModal(); }
function sgdGo(screen, arg) { SGD_UI.dd = null; SGD_UI.pick = null; SGD_UI.screen = screen; if (screen === 'group' && arg) SGD_UI.group = arg; sgdRerender(true); }
function sgdDetail(id) { SGD_UI.dd = null; SGD_UI.pick = null; SGD_UI.screen = 'detail'; if (id) SGD_UI.tree = id; sgdRerender(true); }
function sgdPick(id) { SGD_UI.pick = SGD_UI.pick === id ? null : id; sgdRerender(false); }
function sgdStep(d) { const at = SGD_TREE.findIndex((t) => t.id === SGD_UI.tree); SGD_UI.tree = SGD_TREE[(at + d + SGD_TREE.length) % SGD_TREE.length].id; SGD_UI.pick = null; sgdRerender(true); }
function sgdXa(ind) { SGD_UI.dd = null; SGD_UI.screen = 'xa'; SGD_UI.xa.sel = null; if (ind) sgdXaSetInd(ind); sgdRerender(true); }
function sgdXaSetInd(ind) { const x = SGD_XA_INDS.find((i) => i.id === ind); if (!x) return; SGD_UI.xa.ind = ind; SGD_UI.xa.sk = 'v'; SGD_UI.xa.sd = x.better === 'low' ? 1 : -1; }
function sgdXaInd(ind) { sgdXaSetInd(ind); sgdRerender(false); }
function sgdXaF(f) { SGD_UI.xa.f = f; sgdRerender(false); }
function sgdXaQ(v) { SGD_UI.xa.q = v; SGD_UI.focusQ = true; sgdRerender(false); }
function sgdXaSel(name) { const X = SGD_UI.xa; X.anim = !!name && !X.sel; X.sel = name || null; sgdRerender(false); }
function sgdXaStep(d) { const X = SGD_UI.xa, at = X.order.indexOf(X.sel); if (at < 0 || !X.order[at + d]) return; X.sel = X.order[at + d]; sgdRerender(false); }
function sgdXaSort(k) { const X = SGD_UI.xa; X.sd = X.sk === k ? -X.sd : (k === 'name' ? 1 : -1); X.sk = k; sgdRerender(false); }
function sgdDdToggle(id) { SGD_UI.dd = SGD_UI.dd === id ? null : id; sgdRerender(false); }
function sgdSetYear(y) { SGD_UI.dd = null; SGD_UI.year = Number(y); SGD_UI.pick = null; sgdRerender(false); }
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !SGD_UI.open) return;
    const m = document.getElementById('modal');
    if (!(m && m.classList.contains('open') && m.querySelector('.sgd-root'))) return;
    if (SGD_UI.dd) { SGD_UI.dd = null; sgdRerender(false); return; }
    if (SGD_XA_DRAWER && SGD_UI.screen === 'xa' && SGD_UI.xa.sel) { sgdXaSel(null); return; }   // Esc đóng khung hồ sơ trước
    sgdClose();
  });
  document.addEventListener('click', (e) => {
    if (!SGD_UI.dd || !SGD_UI.open) return;
    if (e.target && e.target.closest && e.target.closest('.sgd-root .stc-dd')) return;
    SGD_UI.dd = null;
    sgdRerender(false);
  });
}

/* ---------- Xuất Excel ---------- */
async function sgdExport() {
  if (typeof ExcelJS === 'undefined') { if (typeof toast === 'function') toast('Thư viện xuất Excel chưa tải xong, thử lại sau giây lát.'); return; }
  const n = sgdNP();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Chỉ tiêu Thành phố');
  ws.addRow(['Sở Giáo dục và Đào tạo Hà Nội · năm học ' + sgdYearLabel(n.y) + ' · DỮ LIỆU GIẢ LẬP, KHÔNG PHẢI SỐ LIỆU THẬT']).font = { italic: true };
  ws.addRow([]);
  ws.addRow(['Nhóm', 'Chỉ tiêu', 'Thành phần', 'Năm học ' + sgdYearLabel(n.y), n.py != null ? 'Năm học ' + sgdYearLabel(n.py) : 'Năm trước', 'So năm trước', 'Đơn vị']).font = { bold: true };
  SGD_TREE.forEach((spec) => {
    const g = SGD_GROUPS.find((x) => x.id === spec.group), T = sgdEvalTree(spec, n.C, n.P);
    const add = (x, depth) => {
      const rate = sgdIsRate(x);
      const d = x.now == null || x.prev == null ? null : rate ? Math.round((x.now - x.prev) * 10) / 10 : (x.prev ? Math.round((x.now / x.prev - 1) * 1000) / 10 : null);
      ws.addRow([g ? g.label : '', spec.label, depth ? '   '.repeat(depth - 1) + x.label : '(tổng)', x.now == null ? null : rate ? Math.round(x.now * 10) / 10 : x.now, x.prev == null ? null : rate ? Math.round(x.prev * 10) / 10 : x.prev, d == null ? null : d + (rate ? ' điểm %' : '%'), rate ? '%' : spec.unit]);
      (x.kids || []).forEach((k) => add(k, depth + 1));
    };
    add(T, 0);
  });
  ws.columns = [{ width: 26 }, { width: 32 }, { width: 30 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 12 }];
  const wx = wb.addWorksheet('126 phường-xã');
  wx.addRow(['Phường/xã', 'Loại'].concat(SGD_XA_INDS.map((x) => x.label + (x.pct ? ' (%)' : '')))).font = { bold: true };
  sgdUnits().forEach((r) => {
    const o = r.v[n.y];
    wx.addRow([r.name, r.isXa ? 'Xã' : 'Phường'].concat(SGD_XA_INDS.map((x) => {
      const v = x.type === 'count' ? x.parts.reduce((a, c) => a + (c.f(o) || 0), 0) : sgdDiv(x.num(o), x.den(o), x.m);
      return v == null ? null : Math.round(v * 100) / 100;
    })));
  });
  wx.columns = [{ width: 32 }, { width: 8 }].concat(SGD_XA_INDS.map(() => ({ width: 16 })));
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'so-gddt-nam-hoc-' + n.y + '-' + (n.y + 1) + '-DU-LIEU-GIA-LAP.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Lưới chỉ tiêu của IOC (indicators.js gọi) ---------- */
/* Băng "Tổng quan" rộng cả hàng lưới: 7 ô KPI + 5 thẻ nhóm + thẻ 126 phường/xã. Bấm mở thẳng popup đúng màn
   (popup chưa mở nên dùng openCategoryDetail với chỉ số thẻ trong SGD_ITEMS). */
function sgdOverviewBandHtml(cat, idx) {
  const M = sgdMetrics();
  const openArgs = (i) => "'" + cat.role + "','" + cat.id + "'," + i;
  const itemIdx = (key) => { const i = SGD_ITEMS.findIndex((x) => x.sgdKey === key); return i < 0 ? idx : i; };
  let body = '<div class="stc-kpis">' + SGD_KPIS.map((k) => sgdKpiTile(k, M, 'openCategoryDetail(' + openArgs(itemIdx(k.target)) + ')')).join('') + '</div>';
  body += '<div class="stc-sec" style="margin:4px 0 12px">Năm nhóm chỉ tiêu · mỗi nhóm một màn hình</div>';
  body += '<div class="sgd-g3">' + SGD_GROUPS.map((g) => sgdGroupCard(g, M, 'openCategoryDetail(' + openArgs(itemIdx(g.id)) + ')')).join('') + sgdXaCard('openCategoryDetail(' + openArgs(itemIdx('xa')) + ')') + '</div>';
  const foot = '<p class="cpi-legend" style="margin:10px 0 0;font-size:11px;display:flex;justify-content:space-between;gap:8px"><span>Năm học ' + sgdYearLabel(SGD_UI.year) + ' · 5 nhóm · ' + SGD_XA_INDS.length + ' chỉ tiêu theo 126 phường/xã</span><span style="color:#f2b636;font-weight:700;font-size:10.5px;letter-spacing:.3px">DỮ LIỆU GIẢ LẬP</span></p>';
  return '<div class="field-category-card so-item-card stc-overview-band" style="grid-column:1/-1"><div class="stc-root sgd-root" style="background:transparent;overflow:visible">' +
    '<div class="stc-gh" style="margin-bottom:12px"><h4 style="margin:0">Tổng quan · Sở Giáo dục và Đào tạo</h4><button type="button" class="stc-gmore" style="background:none;border:0;cursor:pointer;padding:0;font:inherit" onclick="openCategoryDetail(' + openArgs(idx) + ')">Xem tổng quan đầy đủ ›</button></div>' +
    body + foot + '</div></div>';
}
/* Thẻ xem trước một nhóm (chỉ dùng khi bật SGD_SHOW_OUTER_GROUP_CARDS). Thẻ nằm ngoài .stc-root nên dùng màu trực tiếp. */
function sgdPreviewBody(it) {
  const M = sgdMetrics();
  if (it.sgdKey === 'home') return { label: 'Tổng quan', bodyHtml: '<p class="cpi-legend">7 chỉ số chính · 5 nhóm · dữ liệu giả lập</p>' };
  if (it.sgdKey === 'xa') return { label: it[0], bodyHtml: '<p class="cpi-legend">' + SGD_XA_INDS.length + ' chỉ tiêu · bảng 126 phường/xã · hồ sơ trường</p>' };
  const rows = sgdGroupLines(it.sgdKey, M).map((l) => l.replace('class="stc-gl"', 'style="display:grid;grid-template-columns:minmax(0,1fr) auto 58px;gap:8px;font-size:12px;padding:4px 0 3px;border-top:1px solid rgba(87,178,255,.14)"').replace(/<small>/g, '<small style="margin-left:3px;opacity:.7;font-size:10.5px">')).join('');
  return { label: it[0], bodyHtml: '<div class="stc-root" style="background:transparent;overflow:visible">' + rows + '</div>' };
}
