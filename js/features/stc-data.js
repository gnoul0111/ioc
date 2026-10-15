/* ============================== SỞ TÀI CHÍNH — LỚP DỮ LIỆU ==============================
   Đọc bản chụp API (window.STC_SNAPSHOT, sinh bởi stc-tool.js) và dựng cây chỉ tiêu theo STC_INDICATORS (stc-config.js).
   - Mỗi API có cách đọc dòng riêng (match/measure trong cấu hình); nhận diện theo nhãn chuẩn hoá, KHÔNG dựa vào `quy`
     (API THU_NGAN_SACH có dòng "Kỳ trước" mang quy = Q1/2026 — dữ liệu sai phía nguồn).
   - Số tính thêm (tổng, % tăng giảm, tỷ trọng, đóng góp) chỉ tính từ số API; không bao giờ tự điền số.
   - Chế độ dữ liệu thử ?stcdemo=1: nạp js/features/stc-demo-data.js (dữ liệu tự đặt, luôn có banner). Mặc định TẮT. */

let STC_DEMO_ON = ((typeof location !== 'undefined') && /[?&]stcdemo=1(&|$)/.test(location.search || '')) || (typeof STC_DEMO_DEFAULT !== 'undefined' && STC_DEMO_DEFAULT === true);
let STC_DEMO_LOADING = false;
let STC_LOAD_ERR = false;   // true khi lần nạp nguồn số liệu gần nhất thất bại (không tải được tệp)
const STC_CACHE = {};

/* ---------- Định dạng (vi-VN: dấu chấm nghìn, dấu phẩy thập phân) ---------- */
function stcFmt(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  const g = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 && Number(Math.abs(n).toFixed(d)) !== 0 ? '−' : '') + g + (p[1] ? ',' + p[1] : '');
}
function stcSgn(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d == null ? 1 : d;
  const r = Number(Math.abs(n).toFixed(d));
  return (r === 0 ? '' : n > 0 ? '+' : '−') + stcFmt(Math.abs(n), d);
}
function stcNorm(s) { return String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }

/* ---------- Bản chụp và kỳ ---------- */
function stcSnapshotObj() {
  if (STC_DEMO_ON) return (typeof window !== 'undefined' && window.STC_DEMO_SNAPSHOT) || null;
  return (typeof window !== 'undefined' && window.STC_SNAPSHOT) || null;
}
/* Trả về Promise: khi ở chế độ thử thì đợi nạp file dữ liệu thử; ngược lại xong ngay. */
function stcEnsureReady() {
  if (!STC_DEMO_ON || (typeof window !== 'undefined' && window.STC_DEMO_SNAPSHOT)) return Promise.resolve();
  return new Promise((resolve) => {
    if (STC_DEMO_LOADING) { const t = setInterval(() => { if (window.STC_DEMO_SNAPSHOT) { clearInterval(t); resolve(); } }, 50); return; }
    STC_DEMO_LOADING = true;
    const s = document.createElement('script');
    s.src = 'js/features/stc-demo-data.js';
    s.onload = () => { STC_LOAD_ERR = false; Object.keys(STC_CACHE).forEach((k) => delete STC_CACHE[k]); resolve(); };
    s.onerror = () => { STC_LOAD_ERR = true; resolve(); };
    document.head.appendChild(s);
  });
}
/* Bật/tắt dữ liệu mẫu trong lúc đang chạy (nút trong popup). Trả về Promise; tải lại trang thì về mặc định. */
function stcSetDemo(on) {
  STC_DEMO_ON = !!on;
  Object.keys(STC_CACHE).forEach((k) => delete STC_CACHE[k]);
  return stcEnsureReady();
}
/* Nạp lại nguồn số liệu (bản chụp thật hoặc dữ liệu mẫu, tuỳ chế độ) bằng cách tải lại tệp; dùng cho nút "Tải lại"/"Thử lại".
   Trả về Promise, luôn resolve; kết quả xem stcSnapshotObj() và STC_LOAD_ERR. */
function stcReloadSource() {
  Object.keys(STC_CACHE).forEach((k) => delete STC_CACHE[k]);
  if (typeof document === 'undefined') return Promise.resolve();
  const file = STC_DEMO_ON ? 'js/features/stc-demo-data.js' : 'js/data/stc-snapshot.js';
  return new Promise((resolve) => {
    Array.prototype.slice.call(document.querySelectorAll('script[src]')).forEach((s) => { if ((s.getAttribute('src') || '').split('?')[0] === file) s.parentNode.removeChild(s); });
    const s = document.createElement('script');
    s.src = file + '?t=' + Date.now();
    s.onload = () => { STC_LOAD_ERR = false; resolve(); };
    s.onerror = () => { STC_LOAD_ERR = true; resolve(); };
    document.head.appendChild(s);
  });
}
function stcPeriods() {
  const snap = stcSnapshotObj();
  if (!snap || !snap.periods) return [];
  return Object.keys(snap.periods).map((k) => {
    const p = snap.periods[k];
    return { key: k, year: p.year, period: p.period, importedAt: p.importedAt, source: p.source };
  }).sort((a, b) => (b.year - a.year) || (b.period - a.period));
}
function stcLatestPeriod() { const l = stcPeriods(); return l.length ? l[0] : null; }
function stcHasPeriod(y, p) { return stcPeriods().some((x) => x.year === y && x.period === p); }

/* ---------- Dựng cây chỉ tiêu ---------- */
function stcApplyRows(n, keys, api, match, measure, ctx) {
  const set = {};
  keys.forEach((k) => { set[stcNorm(k)] = true; });
  (ctx.data[api] || []).forEach((r, i) => {
    const field = match === 'chiTieu' ? r.chiTieu : r.loai;
    if (!set[stcNorm(field)]) return;
    (ctx.used[api] = ctx.used[api] || {})[i] = true;
    ctx.matched++;
    n.rows.push(r);
    const v = Number(r.giaTri);
    if (measure === 'period') {
      const l = stcNorm(r.loai);
      if (l === 'kỳ này') n.now = v; else if (l === 'kỳ trước') n.prev = v;
      else { ctx.odd.push(r.chiTieu + ' / ' + r.loai); }
    } else if (measure === 'ck') {
      if (/so với cùng kỳ/.test(stcNorm(r.chiTieu))) n.ck = v; else n.now = v;
    } else if (measure === 'cmp') {
      if (/giá so sánh/.test(stcNorm(r.chiTieu))) n.cmp = v; else n.now = v;
    } else n.now = v;
  });
}

function stcBuildNode(spec, inh, ctx) {
  const api = spec.api || inh.api, match = spec.match || inh.match, measure = spec.measure || inh.measure;
  const kind = spec.kind || ((inh.kind === 'idx' || inh.kind === 'pct') ? inh.kind : 'leaf');
  const n = {
    id: spec.id, label: spec.label, unit: spec.unit || inh.unit, kind: kind,
    neutral: spec.neutral != null ? spec.neutral : !!inh.neutral,
    color: spec.color, api: api,
    apiLabel: (spec.keys && spec.keys[0]) || (spec.totalKeys && spec.totalKeys[0]) || spec.label,
    now: null, prev: null, ck: null, cmp: null, derivedCk: false, rows: [], kids: []
  };
  const own = spec.totalKeys || spec.keys;
  if (own) stcApplyRows(n, own, api, match, measure, ctx);
  (spec.kids || []).forEach((k) => {
    n.kids.push(stcBuildNode(k, { api: api, match: match, measure: measure, unit: n.unit, neutral: n.neutral, kind: n.kind }, ctx));
  });
  if (n.kids.length && n.kind === 'add') {
    if (n.now == null && n.kids.every((k) => k.now != null)) n.now = n.kids.reduce((a, k) => a + k.now, 0);
    if (n.prev == null && n.kids.every((k) => k.prev != null)) n.prev = n.kids.reduce((a, k) => a + k.prev, 0);
    /* Tổng của các thành phần chỉ có chỉ số cùng kỳ: suy ra mức tăng chung từ các thành phần (giả định chỉ số lấy 100 làm mốc) */
    if (n.prev == null && n.ck == null && n.now != null && n.kids.every((k) => k.ck > 0 && k.now != null)) {
      const pd = n.kids.reduce((a, k) => a + k.now / (k.ck / 100), 0);
      if (pd > 0) { n.ck = (n.now / pd) * 100; n.derivedCk = true; }
    }
  }
  return n;
}

function stcWalk(n, fn) { fn(n); (n.kids || []).forEach((k) => stcWalk(k, fn)); }
function stcCollectApis(spec, out) {
  if (spec.api) out[spec.api] = true;
  (spec.kids || []).forEach((k) => stcCollectApis(k, out));
  return out;
}

function stcBuildIndicator(spec, data) {
  const ctx = { data: data, used: {}, matched: 0, odd: [] };
  const root = stcBuildNode(spec, {}, ctx);
  root.group = spec.group; root.view = spec.view;
  const apis = Object.keys(stcCollectApis(spec, {}));
  root.apis = apis;
  const unmatched = ctx.odd.slice();
  apis.forEach((api) => {
    if (!Array.isArray(data[api])) { unmatched.push('thiếu API ' + api); return; }
    data[api].forEach((r, i) => { if (!(ctx.used[api] && ctx.used[api][i])) unmatched.push(r.chiTieu + ' / ' + r.loai); });
  });
  root.unmatched = unmatched;
  const vals = [];
  stcWalk(root, (n) => { ['now', 'prev', 'ck', 'cmp'].forEach((f) => { if (n[f] != null && !n.derivedCk) vals.push(n[f]); }); });
  root.state = ctx.matched === 0 ? 'missing' : (vals.every((v) => v === 0) ? 'nodata' : 'ok');
  root.warns = [];
  return root;
}

/* ---------- Phép tính từ số API ---------- */
/* Hai cách so sánh (từ 2026-10-02 hiện cả hai):
   - SO KỲ TRƯỚC = so với quý liền trước (Q3/2026 so Q2/2026). API không có cột này → lấy "kỳ này" trong bản chụp của quý
     liền trước (n.kq). Chưa nạp bản chụp quý đó thì để trống.
   - SO CÙNG KỲ = so với cùng quý năm trước (Q3/2026 so Q3/2025). Lấy theo thứ tự: dòng "Kỳ trước" của API (n.prev — bản chụp
     thật cho thấy dòng này mang quy = cùng quý năm trước, ví dụ Q1/2026 ↔ Q1/2025, nên thực chất là cùng kỳ); bản chụp cùng
     quý năm trước; hoặc suy từ chỉ số so cùng kỳ của API (n.ck, giả định lấy 100 làm mốc).
   Chỉ tiêu dạng chỉ số (idx: 100 = bằng cùng kỳ) thì so cùng kỳ = chỉ số − 100; so kỳ trước = chênh lệch chỉ số (điểm).
   Chỉ tiêu dạng tỷ lệ % (pct: tiến độ dự án) thì cả hai cách so đều là chênh lệch điểm %. */
function stcIsIdx(n, parent) { return n.kind === 'idx' || !!(parent && parent.kind === 'idx'); }
function stcPrevQ(y, p) { return p > 1 ? { year: y, period: p - 1 } : { year: y - 1, period: 4 }; }
/* Giá trị cùng kỳ năm trước (dùng cho cầu nối, xu hướng, đóng góp). */
function stcPrev(n) {
  if (n.cq != null) return n.cq;
  if (n.prev != null) return n.prev;
  if (n.ck > 0 && n.now != null) return n.now / (n.ck / 100);
  return null;
}
/* Mức thay đổi so với quý liền trước. null nếu không tính được. */
function stcDeltaKq(n) {
  if (n.now == null || n.kq == null) return null;
  if (n.kind === 'pct' || n.kind === 'idx') return n.now - n.kq;
  return n.kq > 0 ? (n.now / n.kq - 1) * 100 : null;
}
/* Mức thay đổi so với cùng kỳ năm trước. null nếu không tính được. */
function stcDeltaCq(n) {
  if (n.kind === 'idx') return n.now > 0 ? n.now - 100 : null;
  if (n.kind === 'pct') return n.now != null && n.cq != null ? n.now - n.cq : null;
  if (n.now != null && n.cq > 0) return (n.now / n.cq - 1) * 100;
  if (n.ck > 0) return n.ck - 100;
  return null;
}
/* Đơn vị của mức thay đổi: '%' (tăng/giảm tương đối), 'điểm %' (chênh lệch tỷ lệ), 'điểm' (chênh lệch chỉ số). */
function stcDeltaUnit(n, which) {
  if (n.kind === 'pct') return 'điểm %';
  if (n.kind === 'idx') return which === 'kq' ? 'điểm' : '%';
  return '%';
}
/* Giữ tên cũ: % so cùng kỳ (xu hướng, xuất Excel, thẻ xem trước dùng). */
function stcYoy(n) { return stcDeltaCq(n); }
function stcRefText() { return 'so cùng kỳ'; }

/* Gắn số so sánh cho mọi mục của một kỳ: kq = kỳ này của quý liền trước, cq = cùng kỳ năm trước (xem chú thích phía trên). */
function stcAttachCompare(res) {
  const pq = stcPrevQ(res.year, res.period);
  const rK = stcBuildPeriod(pq.year, pq.period), rC = stcBuildPeriod(res.year - 1, res.period);
  const valIn = (r, id) => { const x = r && r.byId[id]; return x && r.rootOf[id].state === 'ok' && x.now != null ? x.now : null; };
  const kqLbl = 'Q' + pq.period + '/' + pq.year, cqLbl = 'Q' + res.period + '/' + (res.year - 1);
  res.inds.forEach((ind) => stcWalk(ind, (n) => {
    n.kqLbl = kqLbl; n.cqLbl = cqLbl;
    n.kq = valIn(rK, n.id);
    n.cq = null; n.cqSrc = null;
    if (n.prev != null) { n.cq = n.prev; n.cqSrc = 'api'; }
    else if (valIn(rC, n.id) != null) { n.cq = valIn(rC, n.id); n.cqSrc = 'snap'; }
    else if (n.kind !== 'idx' && n.ck > 0 && n.now != null) { n.cq = n.now / (n.ck / 100); n.cqSrc = 'ck'; }
  }));
}

/* ---------- Kiểm tra chất lượng số liệu ---------- */
function stcCheckQuality(res) {
  const ck = STC_ASSUME.ckRange;
  res.inds.forEach((ind) => {
    if (ind.unmatched.length) ind.warns.push(ind.unmatched.length + ' dòng API không nhận diện được (' + ind.unmatched.slice(0, 2).join('; ') + (ind.unmatched.length > 2 ? '…' : '') + ')');
    if (ind.state !== 'ok') return;
    /* Dòng "Tổng" của API phải bằng tổng các khoản */
    if (ind.kind === 'add' && ind.kids.length && ind.now != null && ind.kids.every((k) => k.now != null)) {
      const s = ind.kids.reduce((a, k) => a + k.now, 0);
      if (Math.abs(s - ind.now) > 0.5) ind.warns.push('Tổng ' + ind.kids.length + ' khoản (' + stcFmt(s) + ') lệch ' + stcFmt(s - ind.now) + ' so với dòng tổng của API (' + stcFmt(ind.now) + ')');
    }
    /* Chỉ số nằm ngoài khoảng giả định */
    stcWalk(ind, (n) => {
      const list = [];
      if (n.kind === 'idx' && n.now > 0) list.push(n.now);
      if (n.ck > 0 && !n.derivedCk) list.push(n.ck);
      list.forEach((v) => { if (v < ck[0] || v > ck[1]) ind.warns.push('"' + n.label + '": giá trị ' + stcFmt(v, 1) + ' ngoài khoảng dự kiến ' + ck[0] + '–' + ck[1] + ' của chỉ số lấy 100 làm mốc; API có thể đang trả % tăng, cần xác nhận với Sở Tài chính'); });
    });
  });
  /* Bán lẻ là một phần của bán ra */
  const bra = res.byId.bra, ble = res.byId.ble;
  if (bra && ble && bra.state === 'ok' && ble.state === 'ok' && bra.now != null && ble.now != null && ble.now > bra.now) {
    ble.warns.push('Tổng mức bán lẻ (' + stcFmt(ble.now) + ') lớn hơn tổng mức bán ra (' + stcFmt(bra.now) + '), trong khi bán lẻ là một phần của bán ra');
  }
}

/* ---------- Dựng toàn bộ một kỳ ---------- */
function stcBuildPeriod(year, period) {
  const key = (STC_DEMO_ON ? 'demo:' : '') + year + '-' + period;
  if (STC_CACHE[key]) return STC_CACHE[key];
  const snap = stcSnapshotObj();
  const pd = snap && snap.periods && snap.periods[year + '-' + period];
  if (!pd) return null;
  const res = { year: year, period: period, importedAt: pd.importedAt, source: pd.source, demo: STC_DEMO_ON, inds: [], byId: {}, rootOf: {}, groups: [] };
  STC_INDICATORS.forEach((spec) => {
    const ind = stcBuildIndicator(spec, pd.data || {});
    res.inds.push(ind);
    stcWalk(ind, (n) => { res.byId[n.id] = n; res.rootOf[n.id] = ind; });
  });
  STC_GROUPS.forEach((g) => { res.groups.push({ id: g.id, label: g.label, inds: g.inds.map((id) => res.byId[id]).filter(Boolean) }); });
  stcCheckQuality(res);
  STC_CACHE[key] = res;      // đặt cache TRƯỚC khi gắn số so sánh: stcAttachCompare chỉ dựng các kỳ cũ hơn nên không lặp vòng
  stcAttachCompare(res);
  return res;
}

/* Chuỗi hiển thị thời điểm chụp: "21/09/2026 15:22" */
function stcStampText(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const p2 = (x) => (x < 10 ? '0' : '') + x;
  return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
}

/* Chế độ thử: nạp sớm dữ liệu thử, xong thì vẽ lại lưới chỉ tiêu (thẻ xem trước dùng bản chụp). */
if (STC_DEMO_ON && typeof document !== 'undefined') {
  stcEnsureReady().then(() => { try { if (typeof renderIndicators === 'function') renderIndicators(); } catch (e) { /* bỏ qua */ } });
}