/* ============================== BỘ CHỈ TIÊU KHUÔN MỚI DÙNG CHUNG (ctm-) ==============================
   Một bộ khung cho mọi đơn vị chưa có form riêng (Thành ủy, HĐND, MTTQ Thành phố, các sở theo eform, 126 xã/phường),
   cùng giao diện với Sở GD&ĐT và Trung tâm Phục vụ HCC (lớp stc-/sgd- trong css/stc.css, css/sgd.css; bổ sung ctm- trong
   css/ctm.css). Mỗi đơn vị chỉ KHAI BÁO cấu hình (ctmRegister) ở file riêng (ctm-mttq.js, …); file này lo phần dựng:
     · Phần chi tiết (popup #modal): Tổng quan (ô số + thẻ nhóm) → từng nhóm (các thẻ biểu đồ, bảng) → Theo 126 xã, phường
       (xếp hạng, lọc phường/xã, tìm tên, khung hồ sơ từng đơn vị); chọn kỳ, so kỳ liền trước, xuất Excel.
     · Màn ngoài (lưới "Nhóm chỉ tiêu theo lĩnh vực"): ô số then chốt, thẻ nhóm bấm để lọc, thẻ từng đơn vị — cùng kiểu
       màn tổng quan UBND (ubnd-overview.js, lớp uo-).
   Gắn vào IOC ở 2 chỗ: openCategoryDetail (subtasks.js) gọi ctmOpenForm khi ctmHandles(catId); renderCategoryGrid
   (indicators.js) gọi ctmOverviewHtml khi ctmOverviewFor(roles) có cấu hình. Tắt CTM_ENABLED (hoặc CTM_OVERVIEW_ENABLED)
   là quay về giao diện cũ — code cũ giữ nguyên, không xóa.

   KHAI BÁO MỘT ĐƠN VỊ — ctmRegister({
     id: 'mttq-quy',                 // trùng id lĩnh vực trong categorySeed (central-level.js)
     role: 'MTTQ', level: 'city',    // 'city' = cấp Thành phố, 'xa' = đơn vị trong một xã/phường
     name, org,                      // tiêu đề popup, dòng phụ
     periods: [{ id, label }],       // mới nhất trước; mỗi kỳ so với kỳ liền sau trong danh sách
     cmpRef: 'năm trước',            // chữ "so …" ở mũi tên tăng/giảm
     data(pid, ctx) → { khóa: số },  // số của một kỳ (ctx.xa = đơn vị xã/phường đang xem, null ở cấp Thành phố)
     metrics: { khóa: { l, u, d, inv, neutral, rate, v(D) } },   // v mặc định = D[khóa]; u '%' thì số kèm %
     kpis: [{ m, sub(D, P), target: 'g:nhóm' | 'xa', na }],
     groups: [{ id, label, note, lines: [khóa…], rows: [[thẻ, thẻ], [thẻ]] }],
       thẻ: { type: 'cmp'|'cols'|'table'|'parts'|'top'|'html', t, s, … } — xem ctmCardHtml
     xa: { label, note, inds: [{ id, l, u, d, better: 'high'|'low'|'none' (trung tính: chỉ sắp theo số), tot, v(row) }], rows(pid, ctx) → [{ u: đơn vị CTM_XA, … }] },
     card: [khóa…],                  // dòng số trên thẻ ngoài (mặc định = 4 ô số đầu)
     note, foot,                     // ghi chú "Cách đọc" ở Tổng quan, chân trang
     rec: { label, card(n), screen(spec), sheet(spec, n) → { head, rows } }   // màn "Dữ liệu đã nhập" (đơn vị theo eform cấp xã)
   })
   Nhóm có số dòng thay đổi theo bản ghi: g.lines = (n) → [khóa…], g.count = (n) → chữ đếm trên thẻ nhóm. */
const CTM_ENABLED = true;
const CTM_OVERVIEW_ENABLED = true;
const CTM_SPECS = {};
const CTM_OVERVIEWS = [];
const CTM_UI = { open: false, id: null, role: null, screen: 'home', group: null, period: null, dd: null, focusQ: false,
  xa: { ind: null, f: 'all', q: '', sel: null, anim: false, order: [] }, rec: { f: 'all', q: '', key: null } };
const CTM_OV_PICK = {};
const CTM_CACHE = {};
/* số lớn đã hiện trong màn đang dựng ("số|đơn vị") — thẻ sau không ghi lại tổng trùng (quy tắc H14); đặt lại mỗi lần dựng màn nhóm */
let CTM_SHOWN = {};
const CTM_PAL = ['var(--s1)', 'var(--s3)', 'var(--s4)', 'var(--s2)', 'var(--s5)', 'var(--prev)'];

function ctmRegister(spec) { if (spec && spec.id) { CTM_SPECS[spec.id] = spec; Object.keys(CTM_CACHE).forEach((k) => { if (k.indexOf(spec.id + '|') === 0) delete CTM_CACHE[k]; }); } return spec; }
function ctmRegisterOverview(cfg) { CTM_OVERVIEWS.push(cfg); return cfg; }

/* ---------- Tiện ích ---------- */
function ctmE(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function ctmJs(s) { return ctmE(JSON.stringify(s)); }
function ctmF(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 && Number(Math.abs(n).toFixed(d)) !== 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function ctmLnk(label, act) { return '<button type="button" class="stc-lnk" onclick="' + act + '">' + ctmE(label) + '</button>'; }
function ctmNote(html) { return '<div class="stc-note"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><div>' + html + '</div></div>'; }
function ctmEmpty(title, text) { return '<div class="stc-empty"><b>' + ctmE(title) + '</b><span style="font-size:12px;max-width:420px">' + ctmE(text) + '</span></div>'; }
const CTM_ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';

/* Mũi tên tăng/giảm — cùng quy ước Sở GD&ĐT / Trung tâm HCC: inv = giảm là tốt; neutral = màu trung tính; rate = chênh điểm %.
   Chênh điểm % ghi cùng số lẻ với tỷ lệ (o.d, tối thiểu 1 — quy tắc H5), để chênh dưới 0,05 điểm không hiện thành "Không đổi";
   o.eq: chữ khi bằng nhau (so với mức Thành phố là "Bằng mức TP", không phải "Không đổi"). */
function ctmDl(now, prev, o) {
  o = o || {};
  if (now == null || prev == null || !isFinite(now) || !isFinite(prev) || (!o.rate && !prev)) return '<span class="stc-dl na">' + ctmE(o.na || 'Chưa có kỳ so sánh') + '</span>';
  const dd = o.rate ? Math.max(1, o.d || 1) : 1, k = Math.pow(10, dd);
  const v = o.rate ? now - prev : (now / prev - 1) * 100, r = Math.round(v * k) / k;
  let c = r > 0 ? 'up' : r < 0 ? 'down' : 'flat';
  if (c !== 'flat') { if (o.inv) c += r > 0 ? ' bad' : ' good'; else if (o.neutral) c += ' n'; }
  const txt = c === 'flat' ? (o.eq || 'Không đổi') : ctmF(Math.abs(v), dd) + (o.rate ? ' điểm %' : '%');
  const tip = (o.ref ? o.ref.charAt(0).toUpperCase() + o.ref.slice(1) + ': ' : '') + ctmF(prev, o.d || 0) + ' → ' + ctmF(now, o.d || 0) + '. ' + (o.inv ? 'Chỉ tiêu này giảm là tốt.' : o.neutral ? 'Tăng hay giảm không tự thân tốt/xấu nên để màu trung tính.' : 'Chỉ tiêu này tăng là tốt.');
  return '<span class="stc-dl ' + c + '" title="' + ctmE(tip) + '">' + txt + (o.ref ? ' <span class="stc-ref">' + ctmE(o.ref) + '</span>' : '') + '</span>';
}

/* ---------- Số liệu ---------- */
function ctmSpec(id) { return CTM_SPECS[id || CTM_UI.id] || null; }
/* Tên, cơ quan của đơn vị: chuỗi hoặc hàm (ctx) — đơn vị cấp xã đổi theo xã, phường đang xem. */
function ctmName(spec) { const v = typeof spec.name === 'function' ? spec.name(ctmCtx()) : spec.name; return v || ''; }
function ctmOrg(spec) { const v = typeof spec.org === 'function' ? spec.org(ctmCtx()) : spec.org; return v || ''; }
function ctmCtx() {
  let xa = null;
  if (typeof currentXaId !== 'undefined' && currentXaId != null && typeof ctmCurrentXaUnit === 'function') xa = ctmCurrentXaUnit();
  return { xa: xa };
}
function ctmCtxKey(ctx) { return ctx && ctx.xa ? ctx.xa.name : 'TP'; }
function ctmD(spec, pid, ctx) {
  if (pid == null) return null;
  ctx = ctx || ctmCtx();
  const k = spec.id + '|' + pid + '|' + ctmCtxKey(ctx);
  if (!(k in CTM_CACHE)) { try { CTM_CACHE[k] = spec.data(pid, ctx) || null; } catch (e) { if (typeof console !== 'undefined') console.warn('[ctm] ' + spec.id + ' ' + pid, e); CTM_CACHE[k] = null; } }
  return CTM_CACHE[k];
}
function ctmXaRows(spec, pid, ctx) {
  if (!spec.xa || pid == null) return [];
  ctx = ctx || ctmCtx();
  const k = spec.id + '|xa|' + pid + '|' + ctmCtxKey(ctx);
  if (!(k in CTM_CACHE)) { try { CTM_CACHE[k] = spec.xa.rows(pid, ctx) || []; } catch (e) { if (typeof console !== 'undefined') console.warn('[ctm] xa ' + spec.id, e); CTM_CACHE[k] = []; } }
  return CTM_CACHE[k];
}
function ctmPeriodIdx(spec, pid) { return Math.max(0, spec.periods.findIndex((p) => p.id === pid)); }
function ctmPrevId(spec, pid) { const i = ctmPeriodIdx(spec, pid); return spec.periods[i + 1] ? spec.periods[i + 1].id : null; }
function ctmPLabel(spec, pid) { const p = spec.periods.find((x) => x.id === pid); return p ? p.label : '—'; }
function ctmCurPid(spec) { return CTM_UI.id === spec.id && CTM_UI.period && spec.periods.some((p) => p.id === CTM_UI.period) ? CTM_UI.period : spec.periods[0].id; }
/* Bộ số đang xem: kỳ này, kỳ trước */
function ctmNP(spec) {
  const p = ctmCurPid(spec), pp = ctmPrevId(spec, p);
  return { p: p, pp: pp, D: ctmD(spec, p) || {}, P: pp != null ? ctmD(spec, pp) : null };
}
function ctmM(spec, key) { return (spec.metrics && spec.metrics[key]) || { l: key }; }
function ctmV(spec, key, D) {
  if (!D) return null;
  const m = ctmM(spec, key);
  try { const v = m.v ? m.v(D) : D[key]; return v == null || !isFinite(v) ? null : Number(v); } catch (e) { return null; }
}
function ctmFmtM(spec, key, v) { const m = ctmM(spec, key); return ctmF(v, m.d) + (m.u === '%' ? '%' : ''); }
function ctmUnit(spec, key) { const u = ctmM(spec, key).u; return u === '%' ? '' : (u || ''); }
/* ---------- Mốc so sánh theo kiểu dữ liệu (quy tắc H9, H10) ----------
   m.plan (kế hoạch, chỉ tiêu giao): không so · m.ck (lũy kế từ đầu năm): cùng kỳ năm trước · m.td (số tại thời điểm): kỳ liền trước ·
   còn lại (số phát sinh trong kỳ): đơn vị báo cáo theo quý thì so CÙNG KỲ năm trước (tránh lẫn mùa vụ), theo năm thì năm trước. */
function ctmQuarterly(spec) { return spec.periods.some((p) => /^\d{4}Q\d$/.test(p.id)); }
function ctmBase(spec, key) {
  const m = ctmM(spec, key);
  if (m.plan) return 'none';
  if (m.ck) return 'ck';
  if (m.td) return 'prev';
  return ctmQuarterly(spec) ? 'ck' : 'prev';
}
/* Kỳ dùng để so của một chỉ tiêu ở kỳ đang xem: { pid, ref (chữ ghi cạnh mũi tên), na (chữ khi chưa có số) } */
function ctmCmpOf(spec, key, n) {
  const b = ctmBase(spec, key), xa = spec.level === 'xa';
  if (b === 'none') return { pid: null, ref: '', na: '', none: true };
  if (b === 'ck') {
    const cid = ctmCkId(spec, n.p);
    return { pid: cid, ref: 'so cùng kỳ', na: xa && ctmQuarterly(spec) ? 'Chưa có số cùng kỳ (đơn vị mới từ 01/7/2025)' : 'Chưa có số cùng kỳ' };
  }
  const word = spec.cmpRef || 'kỳ trước';
  return { pid: n.pp, ref: 'so ' + word, na: spec.periods.length === 1 || word === 'cùng kỳ' ? 'Chưa có số cùng kỳ' : 'Chưa có số ' + word };
}
/* big = true: ô số, số lớn đầu thẻ — chưa có số so sánh thì ghi đủ chữ; các dòng khác chỉ ghi "—" (chữ đầy đủ khi rê chuột),
   đơn vị chỉ có một kỳ báo cáo thì các dòng không ghi gì (đã ghi ở ô số và số lớn) */
function ctmDlM(spec, key, n, big) {
  const m = ctmM(spec, key), c = ctmCmpOf(spec, key, n);
  if (c.none) return '';
  const P = c.pid != null ? ctmD(spec, c.pid) : null;
  const pv = P ? ctmV(spec, key, P) : null;
  if (pv == null && big !== true) return spec.periods.length === 1 ? '' : '<span class="stc-dl na" title="' + ctmE(m.na || c.na) + '">—</span>';
  return ctmDl(ctmV(spec, key, n.D), pv, { inv: m.inv, neutral: m.neutral, rate: m.rate || m.u === '%', d: m.d, ref: pv != null ? c.ref : '', na: m.na || c.na });
}
/* Kỳ cùng kỳ năm trước: kỳ quý '2026Q2' → '2025Q2' nếu có trong danh sách; kỳ năm → năm liền trước */
function ctmCkId(spec, pid) {
  const q = String(pid).match(/^(\d{4})Q(\d)$/);
  const id = q ? (Number(q[1]) - 1) + 'Q' + q[2] : /^\d{4}$/.test(String(pid)) ? String(Number(pid) - 1) : null;
  return id && spec.periods.some((p) => p.id === id) && ctmD(spec, id) ? id : null;
}
/* Số dùng để so của một chỉ tiêu trong thẻ so sánh, bảng (theo mốc của chính chỉ tiêu đó) */
function ctmPrevV(spec, key, n) {
  const c = ctmCmpOf(spec, key, n);
  return c.pid != null ? ctmV(spec, key, ctmD(spec, c.pid)) : null;
}
/* Kỳ so sánh chung của một nhóm chỉ tiêu (thẻ so sánh, bảng): cùng một kỳ thì trả kỳ đó, khác nhau thì 'mix', không có thì null */
function ctmCmpPid(spec, keys, n) {
  const ids = [...new Set(keys.map((k) => (ctmPrevV(spec, k, n) != null ? ctmCmpOf(spec, k, n).pid : null)).filter((x) => x != null))];
  return ids.length === 1 ? ids[0] : ids.length ? 'mix' : null;
}
function ctmCmpLabel(spec, pid, n) { return pid === 'mix' ? 'Kỳ so sánh' : ctmPLabel(spec, pid) + (pid !== n.pp ? ' (cùng kỳ)' : ''); }
/* Đánh dấu kiểu dữ liệu cho nhiều chỉ tiêu của một đơn vị đã khai báo: ctmFlag('dang-to-chuc', 'td', ['dv', …]) */
function ctmFlag(id, flag, keys) {
  const s = CTM_SPECS[id];
  if (!s) return;
  (keys === '*' ? Object.keys(s.metrics) : keys).forEach((k) => { if (s.metrics[k]) s.metrics[k][flag] = true; });
  Object.keys(CTM_CACHE).forEach((k) => { if (k.indexOf(id + '|') === 0) delete CTM_CACHE[k]; });
}

/* ---------- Thành phần giao diện ---------- */
function ctmDd(id, label, cur, opts, handler) {
  const open = CTM_UI.dd === id, cv = opts.find((o) => String(o.v) === String(cur));
  const list = open ? '<div class="stc-ddl" role="listbox" aria-label="' + ctmE(label) + '">' + opts.map((o) => {
    const on = String(o.v) === String(cur);
    return '<button type="button" role="option" aria-selected="' + on + '" class="stc-ddo' + (on ? ' on' : '') + '" onclick="' + handler + '(' + ctmJs(o.v) + ')"><span>' + ctmE(o.text) + '</span>' + (on ? '<i>✓</i>' : '') + '</button>';
  }).join('') + '</div>' : '';
  return '<div class="stc-dd' + (open ? ' open' : '') + '"><button type="button" class="stc-ddb" aria-haspopup="listbox" aria-expanded="' + open + '" onclick="ctmDdToggle(\'' + id + '\')"><small>' + ctmE(label) + '</small><b>' + ctmE(cv ? cv.text : '—') + '</b><span class="stc-ddc"></span></button>' + list + '</div>';
}
function ctmHeader(spec, back) {
  const b = back === 'home' ? ctmLnk('← Tổng quan', "ctmGo('home')") : '';
  const opts = spec.periods.map((p) => ({ v: p.id, text: p.label }));
  /* spec.grans: đơn vị cho chọn xem theo Tháng / Quý / Năm (chỉ tiêu theo eform cấp Thành phố, ctm-eform.js) */
  const gran = spec.grans ? ctmDd('gran', 'Xem theo', CTM_UI.gran || 'quy', spec.grans.map((g) => ({ v: g[0], text: g[1] })), 'ctmSetGran') : '';
  return '<div class="stc-toolbar"><div class="stc-tl">' + b + '</div><div class="stc-ctrls">' + gran + ctmDd('period', 'Kỳ báo cáo', ctmCurPid(spec), opts, 'ctmSetPeriod') + (typeof indicatorEntryBtnHtml === 'function' ? indicatorEntryBtnHtml() : '') +
    '<button type="button" class="stc-btn primary" onclick="ctmExport()">' + CTM_ICON_DL + 'Xuất Excel</button></div></div>';
}
function ctmFoot(spec, n) {
  const how = ctmQuarterly(spec) ? ', số phát sinh và số lũy kế so cùng kỳ năm trước, số tại thời điểm so quý liền trước' : n.pp != null ? ', so với ' + ctmPLabel(spec, n.pp) : '';
  return '<div class="stc-foot"><span>' + ctmE(spec.foot || ('Kỳ báo cáo ' + (spec.kind || 'năm') + how + '.')) + '</span><span>' + ctmE(ctmPLabel(spec, n.p)) + '</span></div>';
}
function ctmSub(spec, n, unit, keys) {
  const pid = keys ? ctmCmpPid(spec, keys, n) : n.pp;
  return ctmPLabel(spec, n.p) + (pid === 'mix' ? ' so với kỳ so sánh của từng chỉ tiêu' : pid != null ? ' so với ' + ctmCmpLabel(spec, pid, n) : '') + (unit ? ' · ' + unit : '');
}
function ctmTarget(t) { return !t ? '' : t === 'xa' ? 'ctmXa()' : t.indexOf('xa:') === 0 ? 'ctmXa(' + ctmJs(t.slice(3)) + ')' : t.indexOf('g:') === 0 ? "ctmGo('group','" + t.slice(2) + "')" : t === 'rec' ? 'ctmRec(null)' : t.indexOf('rec:') === 0 ? 'ctmRec(' + ctmJs(t.slice(4)) + ')' : ''; }
function ctmKpiTile(spec, k, n, onclick) {
  const v = ctmV(spec, k.m, n.D), m = ctmM(spec, k.m);
  let sub = '';
  try { sub = k.sub ? k.sub(n.D, n.P, n) : ctmUnit(spec, k.m); } catch (e) { sub = ''; }
  const d = k.na && !n.P ? '<span class="stc-dl na">' + ctmE(k.na) + '</span>' : ctmDlM(spec, k.m, n, true);
  const act = onclick || ctmTarget(k.target);
  return '<button type="button" class="stc-kpi"' + (act ? ' onclick="' + act + '"' : '') + '><div class="stc-lb">' + ctmE(k.l || m.l) + '</div><div class="stc-v"' + (ctmF(v, m.d).length > 9 ? ' style="font-size:' + (ctmF(v, m.d).length > 13 ? 16 : 20) + 'px"' : '') + '>' + ctmFmtM(spec, k.m, v) + '</div><div class="stc-u">' + ctmE(sub) + '</div><div style="margin-top:10px;min-height:18px">' + d + '</div></button>';
}
function ctmGl(spec, key, n) {
  const m = ctmM(spec, key), v = ctmV(spec, key, n.D);
  return '<div class="stc-gl"><span>' + ctmE(m.short || m.l) + '</span><span class="stc-v">' + ctmF(v, m.d) + (m.u ? '<small>' + ctmE(m.u === '%' ? '%' : m.u) + '</small>' : '') + '</span><span>' + ctmDlM(spec, key, n) + '</span></div>';
}
function ctmGLines(g, n) { try { return (typeof g.lines === 'function' ? g.lines(n) : g.lines) || []; } catch (e) { return []; } }
function ctmGroupCard(spec, g, n, onclick) {
  const L = ctmGLines(g, n).map((k) => ctmGl(spec, k, n));
  const cnt = typeof g.count === 'function' ? ctmText(g.count, n) : L.length + ' chỉ tiêu';
  return '<button type="button" class="stc-gcard" onclick="' + (onclick || ("ctmGo('group','" + g.id + "')")) + '"><div class="stc-gh"><h3>' + ctmE(g.label) + '</h3><span>' + ctmE(cnt) + '</span></div>' + L.join('') + '<div class="stc-gmore">Xem nhóm ' + ctmE(g.label) + ' ›</div></button>';
}
/* Thẻ "Dữ liệu đã nhập" ở Tổng quan (đơn vị có spec.rec) */
function ctmRecCard(spec, n, onclick) {
  return '<button type="button" class="stc-gcard sgd-alt" onclick="' + (onclick || 'ctmRec(null)') + '"><div class="stc-gh"><h3>' + ctmE(spec.rec.label) + '</h3><span>đủ mọi trường</span></div>' + ctmText(spec.rec.card, n) + '<div class="stc-gmore">Xem ' + ctmE(spec.rec.label.toLowerCase()) + ' ›</div></button>';
}
function ctmXaLabel(spec) { return (spec.xa && spec.xa.label) || 'Theo 126 xã, phường'; }
function ctmXaCard(spec, onclick) {
  const rows = (spec.xa.cardRows || ['Bảng 126 xã, phường: ' + spec.xa.inds.map((x) => x.l.toLowerCase()).slice(0, 3).join(', '), 'Hạng, tốt nhất / kém nhất, số đơn vị kém hơn mức Thành phố', 'Hồ sơ từng xã, phường: dân số, diện tích, các chỉ tiêu và hạng', 'Lọc phường / xã, tìm theo tên'])
    .map((t) => '<div class="stc-gl"><span>' + ctmE(t) + '</span><span></span><span></span></div>').join('');
  return '<button type="button" class="stc-gcard sgd-alt" onclick="' + (onclick || 'ctmXa()') + '"><div class="stc-gh"><h3>' + ctmE(ctmXaLabel(spec)) + '</h3><span>' + spec.xa.inds.length + ' chỉ tiêu</span></div>' + rows + '<div class="stc-gmore">Xem ' + ctmE(ctmXaLabel(spec).replace(/^Theo /, 'theo ')) + ' ›</div></button>';
}
function ctmCard(o) {
  const title = o.xa ? '<button type="button" class="sgd-ctl" onclick="ctmXa(' + ctmJs(o.xa) + ')" title="Xem theo 126 xã, phường">' + ctmE(o.t) + '</button>' : '<h3 class="stc-ct">' + ctmE(o.t) + '</h3>';
  return '<div class="stc-card' + (o.cls ? ' ' + o.cls : '') + '"><div class="stc-ch"><div>' + title + '<div class="stc-cs">' + ctmE(o.s || '') + '</div></div>' + (o.r || '') + '</div>' + o.b + '</div>';
}
function ctmBig(v, unit, dl) { return '<div class="stc-bigrow"><div class="stc-big">' + v + (unit ? '<small>' + ctmE(unit) + '</small>' : '') + '</div>' + (dl || '') + '</div>'; }
function ctmLegend(spec, n) { return '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + ctmE(ctmPLabel(spec, n.p)) + '</span>' + (n.pp != null ? '<span><i style="background:var(--prev)"></i>' + ctmE(ctmPLabel(spec, n.pp)) + '</span>' : '') + '</div>'; }
function ctmCmpRow(label, now, prev, mx, d, dl, first) {
  const w = (v) => (v == null ? 0 : Math.max(1, (v / (mx || 1)) * 100)).toFixed(1);
  return '<div class="stc-cmp"' + (first ? ' style="border-top:0"' : '') + '><div class="stc-nm">' + ctmE(label) + '</div><div class="stc-bars"><div class="stc-br"><div class="stc-tr"><div class="stc-b" style="width:' + w(now) + '%"></div></div><span class="stc-val">' + ctmF(now, d) + '</span></div>' +
    (prev != null ? '<div class="stc-br"><div class="stc-tr"><div class="stc-b p" style="width:' + w(prev) + '%"></div></div><span class="stc-val p">' + ctmF(prev, d) + '</span></div>' : '') + '</div>' + dl + '</div>';
}
function ctmPg(label, small, pct, color, val, dl) {
  return '<div class="stc-pg"><div class="stc-row"><span class="stc-nm">' + ctmE(label) + (small ? '<small>' + ctmE(small) + '</small>' : '') + '</span><span class="stc-pv">' + (val != null ? val : ctmF(pct, 1) + '%') + (dl ? ' <span class="ctm-pgdl">' + dl + '</span>' : '') + '</span></div><div class="stc-trk"><div class="stc-fill" style="width:' + Math.max(pct > 0 ? 1 : 0, Math.min(100, pct || 0)).toFixed(1) + '%;background:' + (color || 'var(--s1)') + '"></div></div></div>';
}
/* Biểu đồ đường (quy tắc H13): tỷ lệ, bình quân, chỉ số, số ít thay đổi — trục KHÔNG bắt đầu từ 0, ghi mức đầu trục; điểm "on" tô đậm.
   Vẽ bằng bộ dùng chung js/core/line-chart.js (trục chia số tròn, nhãn số tránh đường, vẽ lại theo bề rộng thật của thẻ).
   pts: [{ l: nhãn trục, v: số | null, on }], o: { d, pct, ref: số mốc (VD 100 cho chỉ số), refL: chữ của mốc } */
function ctmLineSvg(pts, o) {
  o = o || {};
  const ok = pts.filter((p) => p.v != null && isFinite(p.v));
  if (ok.length < 2) return '<div class="stc-hint">Chưa đủ số liệu để vẽ xu hướng.</div>';
  const d = o.d == null ? 1 : o.d;
  const R = lcBox(pts, { fmt: (v) => ctmF(v, d) + (o.pct ? '%' : ''), pct: !!o.pct, ref: o.ref == null ? null : o.ref, cls: 'ctm-line' });
  return R.html + '<div class="stc-hint">Trục dọc bắt đầu từ ' + ctmE(R.fa(R.A.lo)) + ', không từ 0, để thấy rõ thay đổi.' +
    (o.ref != null ? ' Đường nét đứt là ' + ctmE(o.refL || ('mốc ' + ctmF(o.ref, 0))) + '.' : '') + (o.hint ? ' ' + o.hint : '') + '</div>';
}
/* Sau khi dựng màn: vẽ lại mọi biểu đồ đường theo bề rộng thật của khung */
function ctmFitLines(root) { if (typeof lcFit === 'function') lcFit(root); }
/* Chỉ tiêu nên vẽ đường thay cho cột: tỷ lệ, bình quân, chỉ số, hoặc số tại thời điểm thay đổi dưới 5% qua các kỳ */
function ctmLineFor(m, vals) {
  if (m.u === '%' || /trên [\d.]+ (dân|hộ)|bình quân|chỉ số/i.test(String(m.l || '') + ' ' + String(m.short || '')) || /\//.test(m.u || '')) return true;
  const vs = vals.filter((v) => v != null && isFinite(v));
  if (!m.td || vs.length < 2) return false;
  const mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
  return mx > 0 && (mx - mn) / mx < 0.05;
}
/* Nhãn danh mục: chuỗi, [tên, màu…] hoặc { l } */
function ctmLb(x) { return Array.isArray(x) ? x[0] : x && typeof x === 'object' ? (x.l || x.label || '') : x; }
function ctmText(f, a, b, c) { try { return typeof f === 'function' ? f(a, b, c) || '' : f || ''; } catch (e) { return ''; } }

/* Các dòng tỷ lệ (thanh 0–100%); chỉ tiêu giao (m.plan) là vạch mốc trên thanh thực hiện đứng trước nó (quy tắc H13) */
function ctmRateRows(spec, keys, n) {
  const all = keys || [], shown = all.filter((k) => !ctmM(spec, k).plan);
  const markOf = (k) => { const j = all.indexOf(k), nx = all[j + 1]; return nx && ctmM(spec, nx).plan ? nx : null; };
  return shown.map((k, i) => {
    const m = ctmM(spec, k), v = ctmV(spec, k, n.D), mk = markOf(k), mv = mk ? ctmV(spec, mk, n.D) : null, mm = mk ? ctmM(spec, mk) : null;
    const mark = mv != null ? '<b class="ctm-mk" style="left:' + Math.max(0, Math.min(100, mv)).toFixed(2) + '%" title="' + ctmE((mm.short || mm.l) + ': ' + ctmF(mv, mm.d == null ? 1 : mm.d) + '%') + '"></b>' : '';
    const note = mv != null ? '<small class="ctm-mkl">' + ctmE((mm.short || mm.l) + ' ' + ctmF(mv, mm.d == null ? 1 : mm.d) + '%' + (v != null ? (v >= mv ? ' · đạt' : ' · chưa đạt') : '')) + '</small>' : '';
    /* thanh từ 0 đến 100: tỷ lệ ghi %, điểm (thang 100) ghi "điểm" */
    const suf = m.u === '%' || !m.u ? '%' : ' ' + m.u;
    return '<div class="sgd-rt"' + (i ? '' : ' style="border-top:0"') + '><span class="sgd-nm">' + ctmE(m.short || m.l) + note + '</span><span class="sgd-tk ctm-tkm"><i style="width:' + Math.max(0, Math.min(100, v || 0)).toFixed(1) + '%;background:' + (m.inv ? 'var(--s2)' : 'var(--s1)') + '"></i>' + mark + '</span><span class="sgd-r">' + ctmF(v, m.d == null ? 1 : m.d) + ctmE(suf) + '</span>' + ctmDlM(spec, k, n) + '</div>';
  }).join('');
}
/* Thẻ trong màn nhóm */
function ctmCardHtml(spec, c, n) {
  const sub = c.s != null ? ctmText(c.s, n.D, n.P, n) : null;
  if (c.type === 'cmp') {
    /* kế hoạch, chỉ tiêu giao không vẽ thành thanh ngang hàng với số thực hiện (quy tắc H13) */
    /* số một tháng (m.month) đặt cạnh số nhiều tháng là trộn khung thời gian: chỉ ghi ở dòng phụ (quy tắc H11) */
    const monthK = (c.items || []).filter((k) => ctmM(spec, k).month);
    const items = (c.items || [c.big]).filter((k) => !ctmM(spec, k).plan && !ctmM(spec, k).month);
    /* số lớn đầu thẻ là số thực hiện, không phải kế hoạch */
    const big = c.big && !ctmM(spec, c.big).plan ? c.big : items[0], mb = ctmM(spec, big);
    const mx = Math.max.apply(null, items.map((k) => Math.max(ctmV(spec, k, n.D) || 0, ctmPrevV(spec, k, n) || 0)));
    let b = ctmBig(ctmFmtM(spec, big, ctmV(spec, big, n.D)), ctmUnit(spec, big), ctmDlM(spec, big, n, true));
    const hint = ctmText(c.hint, n.D, n.P, n);
    if (hint) b += '<div class="stc-hint">' + hint + '</div>';
    /* thanh thứ hai là kỳ so sánh của chính các chỉ tiêu trong thẻ (cùng kỳ năm trước hoặc kỳ liền trước) */
    let rowKeys = c.noBig ? items.filter((k) => k !== big) : items;
    /* các phần đã có ở thẻ cơ cấu của nhóm (c.dupWith) thì không vẽ lại thành thanh cạnh tổng (quy tắc H13, H14): chỉ giữ số lớn */
    if (c.dupWith && c.dupWith.length && !c.noBig) {
      const seen = {};
      c.dupWith.forEach((x) => { let r = []; try { r = (x.items || x.rows)(n.D) || []; } catch (e) { r = []; } r.forEach((y) => { seen[ctmF(Number(y[1]), x.d || 0)] = 1; }); });
      const rest = rowKeys.filter((k) => k !== big), dup = rest.filter((k) => seen[ctmFmtM(spec, k, ctmV(spec, k, n.D))]);
      if (rest.length && dup.length * 2 >= rest.length) rowKeys = [big];
    }
    const cid = ctmCmpPid(spec, rowKeys, n);
    /* chỉ một chỉ tiêu và đó chính là số lớn: không vẽ thêm thanh nhắc lại số (quy tắc H14) — thẻ gọn, ghi số kỳ so sánh bằng chữ */
    const compact = rowKeys.length === 1 && rowKeys[0] === big;
    if (compact) {
      const pv = ctmPrevV(spec, big, n);
      if (pv != null && cid != null) b += '<div class="ctm-cmpline">' + ctmE(ctmCmpLabel(spec, cid, n)) + ': <b>' + ctmFmtM(spec, big, pv) + '</b>' + (ctmUnit(spec, big) ? ' ' + ctmE(ctmUnit(spec, big)) : '') + '</div>';
    } else {
      const lg = '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + ctmE(ctmPLabel(spec, n.p)) + '</span>' + (cid != null ? '<span><i style="background:var(--prev)"></i>' + ctmE(ctmCmpLabel(spec, cid, n)) + '</span>' : '') + '</div>';
      b += lg + rowKeys.map((k, i) => { const m = ctmM(spec, k); return ctmCmpRow(m.short || m.l, ctmV(spec, k, n.D), ctmPrevV(spec, k, n), mx, m.d, ctmDlM(spec, k, n), i === 0); }).join('');
    }
    CTM_SHOWN[ctmFmtM(spec, big, ctmV(spec, big, n.D)) + '|' + ctmUnit(spec, big)] = 1;
    /* một tỷ lệ của nhóm ghi ngay trong thẻ (thay cho thẻ Tỷ lệ riêng chỉ có một thanh) */
    if (c.rates && c.rates.length) b += '<div class="ctm-cmprates">' + ctmRateRows(spec, c.rates, n) + '</div>';
    if (monthK.length) b += '<div class="stc-hint" style="margin-top:10px">' + monthK.map((k) => { const m = ctmM(spec, k); return ctmE((m.short || m.l) + ': ' + ctmFmtM(spec, k, ctmV(spec, k, n.D)) + (ctmUnit(spec, k) ? ' ' + ctmUnit(spec, k) : '')); }).join(' · ') + ' (số riêng một tháng, không cộng vào số trên).</div>';
    const unit = mb.u === '%' ? '%' : mb.u;
    const sAll = ctmSub(spec, n, unit, rowKeys) + (rowKeys.some((k) => ctmM(spec, k).ck) && cid == null ? ' · lũy kế từ đầu năm' : '');
    return ctmCard({ t: c.t, s: sub != null ? sub : sAll, xa: c.xa, b: b, cls: compact ? 'ctm-compact' : '' });
  }
  if (c.type === 'cols') {
    const per = spec.periods.slice().reverse(), m1 = ctmM(spec, c.m), m2 = c.m2 ? ctmM(spec, c.m2) : null;
    const vals = per.map((p) => { const D = ctmD(spec, p.id); return [ctmV(spec, c.m, D), m2 ? ctmV(spec, c.m2, D) : null]; });
    /* mọi kỳ bằng nhau (nguồn chỉ có số năm): bỏ biểu đồ — quy tắc H13 */
    const v1 = vals.map((v) => v[0]).filter((v) => v != null);
    if (!m2 && v1.length > 1 && v1.every((v) => v === v1[0])) return '';
    if (!m2 && ctmLineFor(m1, vals.map((v) => v[0]))) {
      const hint = ctmText(c.hint, n.D, n.P, n);
      return ctmCard({ t: c.t, s: sub != null ? sub : per.length + ' kỳ gần nhất · ' + (m1.u === '%' ? '%' : (m1.u || '')), xa: c.xa,
        b: ctmLineSvg(per.map((p, i) => ({ l: p.short || p.label, v: vals[i][0], on: p.id === n.p })), { d: m1.d == null ? 1 : Math.min(m1.d, 2), pct: m1.u === '%', hint: 'Điểm tô đậm là kỳ đang xem.' + (hint ? ' ' + hint : '') }) });
    }
    const top = Math.max.apply(null, vals.map((v) => Math.max(v[0] || 0, v[1] || 0))) || 1;
    /* số lũy kế từ đầu năm: tô cột theo năm để cột Quý 1 (tính lại từ đầu năm) không bị đọc là giảm */
    const yr = (p) => String(p.id).slice(0, 4), lastY = yr(per[per.length - 1]);
    const cols = '<div class="sgd-cc">' + per.map((p, i) => {
      const on = p.id === n.p, a = vals[i][0], b2 = vals[i][1];
      const bg = m1.ck && yr(p) !== lastY ? 'background:var(--s3);' : '';
      return '<div class="sgd-col"><span class="sgd-cv">' + (a == null ? '—' : ctmF(a, c.d != null ? c.d : (m1.d > 1 ? 1 : m1.d))) + '</span><div class="sgd-pair"><div class="sgd-b1 ctm-cb" style="height:' + ((a || 0) / top * 150).toFixed(0) + 'px;' + bg + (on ? '' : 'opacity:.5') + '"></div>' +
        (m2 ? '<div class="sgd-b0" style="height:' + ((b2 || 0) / top * 150).toFixed(0) + 'px"></div>' : '') + '</div></div>';
    }).join('') + '</div><div class="sgd-ccl">' + per.map((p) => '<span>' + ctmE(p.short || p.label) + '</span>').join('') + '</div>';
    const hint = ctmText(c.hint, n.D, n.P, n);
    const b = cols + '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + ctmE(m1.short || m1.l) + (m1.u ? ' (' + ctmE(m1.u) + ', số trên cột)' : '') + '</span>' + (m2 ? '<span><i style="background:var(--prev)"></i>' + ctmE(m2.short || m2.l) + '</span>' : '') + '</div>' +
      '<div class="stc-hint">Cột đậm là kỳ đang xem.' + (m1.ck ? ' Số lũy kế từ đầu năm: hai màu là hai năm khác nhau; sang Quý 1 số tính lại từ đầu năm, không phải giảm.' : '') + (hint ? ' ' + hint : '') + '</div>';
    return ctmCard({ t: c.t + (m1.ck && !/lũy kế/i.test(c.t) ? ' (lũy kế từ đầu năm)' : ''), s: sub != null ? sub : per.length + ' kỳ gần nhất · ' + (m1.u || ''), xa: c.xa, b: b });
  }
  if (c.type === 'table') {
    const tot = c.total ? ctmV(spec, c.total, n.D) : null;
    const rows = c.rows.map((k) => ({ k: k, m: ctmM(spec, k), v: ctmV(spec, k, n.D), pv: ctmPrevV(spec, k, n) }));
    if (c.sort !== false) rows.sort((a, b) => (b.v || 0) - (a.v || 0));
    const cid = ctmCmpPid(spec, c.rows.concat(c.total ? [c.total] : []), n), hasP = cid != null;
    const head = '<tr><th>' + ctmE(c.head || 'Nội dung') + '</th><th>' + ctmE(ctmPLabel(spec, n.p)) + '</th>' + (tot != null ? '<th>Tỷ trọng</th>' : '') + (hasP ? '<th>' + ctmE(ctmCmpLabel(spec, cid, n)) + '</th><th>Thay đổi</th>' : '') + '</tr>';
    const body = rows.map((r) => '<tr><td>' + ctmE(r.m.short || r.m.l) + '</td><td>' + ctmFmtM(spec, r.k, r.v) + '</td>' + (tot != null ? '<td>' + (tot ? ctmF((r.v || 0) / tot * 100, 1) + '%' : '—') + '</td>' : '') + (hasP ? '<td>' + ctmFmtM(spec, r.k, r.pv) + '</td><td>' + ctmDlM(spec, r.k, n) + '</td>' : '') + '</tr>').join('') +
      (c.total ? '<tr class="tot"><td>' + ctmE(ctmM(spec, c.total).short || ctmM(spec, c.total).l) + '</td><td>' + ctmFmtM(spec, c.total, tot) + '</td><td>100%</td>' + (hasP ? '<td>' + ctmFmtM(spec, c.total, ctmPrevV(spec, c.total, n)) + '</td><td>' + ctmDlM(spec, c.total, n) + '</td>' : '') + '</tr>' : '');
    const hint = ctmText(c.hint, n.D, n.P, n);
    return ctmCard({ t: c.t, s: sub != null ? sub : rows.length + ' nội dung · ' + ctmPLabel(spec, n.p) + (c.unit ? ' · ' + c.unit : ''), xa: c.xa, b: '<div class="ctm-scroll"><table class="stc-tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' + (hint ? '<div class="stc-hint" style="margin-top:10px">' + hint + '</div>' : '') });
  }
  if (c.type === 'parts') {
    const tot = ctmV(spec, c.total, n.D), mt = ctmM(spec, c.total);
    const parts = c.parts.map((k, i) => ({ k: k, m: ctmM(spec, k), v: ctmV(spec, k, n.D) || 0, c: CTM_PAL[i % CTM_PAL.length] }));
    /* tổng đã là số lớn của thẻ trước trong cùng màn thì không ghi lại (quy tắc H14) */
    const kT = ctmFmtM(spec, c.total, tot) + '|' + ctmUnit(spec, c.total);
    let b = CTM_SHOWN[kT] ? '' : ctmBig(ctmFmtM(spec, c.total, tot), ctmUnit(spec, c.total), ctmDlM(spec, c.total, n, true));
    CTM_SHOWN[kT] = 1;
    b += '<div class="stc-stack">' + parts.map((p) => '<i style="flex:' + Math.max(0, p.v) + ';background:' + p.c + '" title="' + ctmE(p.m.short || p.m.l) + '"></i>').join('') + '</div>';
    /* thẻ cơ cấu chuẩn: mỗi phần có tỷ trọng và mức thay đổi so với kỳ so sánh (thay cho bảng — quy tắc H15) */
    b += parts.map((p) => ctmPg(p.m.short || p.m.l, ctmFmtM(spec, p.k, p.v) + (p.m.u && p.m.u !== '%' ? ' ' + p.m.u : ''), tot ? p.v / tot * 100 : 0, p.c, null, ctmDlM(spec, p.k, n))).join('');
    const hint = ctmText(c.hint, n.D, n.P, n);
    if (hint) b += '<div class="stc-hint" style="margin-top:10px">' + hint + '</div>';
    return ctmCard({ t: c.t, s: sub != null ? sub : ctmPLabel(spec, n.p) + ' · ' + (mt.u || ''), xa: c.xa, b: b });
  }
  if (c.type === 'top') {
    const I = spec.xa && spec.xa.inds.find((x) => x.id === c.ind);
    if (!I) return '';
    const rows = ctmXaRows(spec, n.p).filter((r) => ctmXaVal(I, r) != null && !ctmXaSmall(I, r));
    const noRank = ctmXaNoRank(I), low = !noRank && I.better === 'low';
    rows.sort((a, b) => (low ? ctmXaVal(I, a) - ctmXaVal(I, b) : ctmXaVal(I, b) - ctmXaVal(I, a)));
    const top = rows.slice(0, c.n || 10), mx = Math.max.apply(null, top.map((r) => Math.abs(ctmXaVal(I, r)))) || 1;
    const b = top.map((r, i) => ctmPg((i + 1) + '. ' + r.u.name, '', Math.abs(ctmXaVal(I, r)) / mx * 100, 'var(--s1)', ctmF(ctmXaVal(I, r), I.d) + (I.u === '%' ? '%' : ''))).join('') +
      '<div class="stc-hint" style="margin-top:10px">' + (noRank ? (I.better === 'none' && !I.tot && /trên [\d.]+ (dân|hộ)|bình quân|\//.test(String(I.l || '') + ' ' + String(I.u || '')) ? 'Nhiều hay ít không tự thân là tốt hay xấu nên chỉ để biết nơi nhiều nhất, không phải xếp hạng tốt/kém. ' : 'Số tuyệt đối, phụ thuộc quy mô dân số nên chỉ để biết nơi nhiều nhất, không phải xếp hạng tốt/kém. ') : '') + ctmLnk('Xem đủ 126 xã, phường ›', 'ctmXa(' + ctmJs(I.id) + ')') + '</div>';
    return ctmCard({ t: (noRank ? (c.t && !/thấp nhất/i.test(c.t) ? c.t : 'Nhiều nhất: ' + I.l) : c.t || (low ? 'Thấp nhất: ' : 'Cao nhất: ') + I.l), s: sub != null ? sub : (c.n || 10) + ' xã, phường · ' + ctmPLabel(spec, n.p) + (I.u ? ' · ' + I.u : ''), xa: I.id, b: b });
  }
  if (c.type === 'rates') {
    const shown = (c.items || []).filter((k) => !ctmM(spec, k).plan);
    const b = ctmRateRows(spec, c.items, n);
    const hint = ctmText(c.hint, n.D, n.P, n);
    return ctmCard({ t: c.t, s: sub != null ? sub : ctmSub(spec, n, '%', shown), xa: c.xa, b: b + (hint ? '<div class="stc-hint" style="margin-top:10px">' + hint + '</div>' : '') });
  }
  if (c.type === 'html') return ctmCard({ t: c.t, s: sub || '', xa: c.xa, b: ctmText(c.html, n.D, n.P, n) });
  /* Thẻ đọc thẳng mảng số của đơn vị (sở theo eform): chỉ có ở kỳ đang báo cáo (D._ky) */
  if (c.type === 'mbars' || c.type === 'shares' || c.type === 'list') {
    if (n.D && n.D._ky === false) return ctmCard({ t: c.t, s: ctmPLabel(spec, n.p), b: '<div class="stc-hint">Kỳ này chỉ có số tổng hợp, chưa có số chi tiết để vẽ thẻ này.</div>' });
    let rows;
    try { rows = (c.type === 'mbars' ? c.vals : c.items || c.rows)(n.D) || []; } catch (e) { rows = []; }
    const hint = ctmText(c.hint, n.D, n.P, n);
    const hintH = hint ? '<div class="stc-hint" style="margin-top:10px">' + hint + '</div>' : '';
    if (c.type === 'mbars') {
      const labels = typeof c.labels === 'function' ? c.labels(n.D) : c.labels, top = Math.max.apply(null, rows.map((v) => Math.abs(v || 0))) || 1;
      /* tỷ lệ, chỉ số theo tháng/quý: biểu đồ đường; chỉ số có đường mốc 100 và không gắn % (quy tắc H4, H13) */
      const isIdx = /chỉ số/i.test(c.t || '') || c.idx;
      if (c.u === '%' || isIdx) {
        return ctmCard({ t: c.t, s: sub != null ? sub : ctmPLabel(spec, n.p) + (isIdx ? ' · kỳ gốc = 100' : ' · %'), xa: c.xa,
          b: ctmLineSvg(rows.map((v, i) => ({ l: (labels || [])[i] || '', v: v, on: i === rows.length - 1 })), { d: c.d == null ? 1 : c.d, pct: !isIdx, ref: isIdx ? 100 : null, refL: isIdx ? 'mốc 100' : '' }) + hintH });
      }
      let v2 = null;
      try { v2 = c.vals2 ? c.vals2(n.D) : null; } catch (e) { v2 = null; }
      /* dãy thứ hai là kế hoạch: vẽ vạch kế hoạch trên cột, không vẽ thành cột thứ hai (quy tắc H13) */
      const plan = v2 && (c.plan || /kế hoạch/i.test(c.l2 || ''));
      const top2 = v2 ? Math.max(top, Math.max.apply(null, v2.map((v) => Math.abs(v || 0)))) : top;
      const b = '<div class="sgd-cc">' + rows.map((v, i) => '<div class="sgd-col"><span class="sgd-cv">' + ctmF(v, c.d || 0) + '</span><div class="sgd-pair' + (plan ? ' ctm-planwrap" style="height:' + Math.max(Math.abs(v || 0) / top2 * 150, Math.abs(v2[i] || 0) / top2 * 150 + 10).toFixed(0) + 'px' : '') + '"><div class="sgd-b1 ctm-cb" style="height:' + (Math.abs(v || 0) / top2 * 150).toFixed(0) + 'px;' + (i === rows.length - 1 ? '' : 'opacity:.6') + '"></div>' +
        (v2 && plan ? '<div class="ctm-plan" style="bottom:' + (Math.abs(v2[i] || 0) / top2 * 150).toFixed(0) + 'px" title="' + ctmE((c.l2 || 'Kế hoạch') + ': ' + ctmF(v2[i], c.d || 0)) + '"></div>' : v2 ? '<div class="sgd-b0" style="height:' + (Math.abs(v2[i] || 0) / top2 * 150).toFixed(0) + 'px"></div>' : '') + '</div></div>').join('') + '</div><div class="sgd-ccl">' + (labels || []).map((l) => '<span>' + ctmE(l) + '</span>').join('') + '</div>' +
        '<div class="stc-lg"><span><i style="background:var(--s1)"></i>' + ctmE(c.l1 || c.t) + (c.u ? ' (' + ctmE(c.u) + ', số trên cột)' : '') + '</span>' + (v2 ? (plan ? '<span><i class="ctm-plani"></i>' + ctmE(c.l2 || 'Kế hoạch') + ' (vạch)</span>' : '<span><i style="background:var(--prev)"></i>' + ctmE(c.l2 || '') + '</span>') : '') + '</div>';
      return ctmCard({ t: c.t, s: sub != null ? sub : ctmPLabel(spec, n.p) + (c.u ? ' · ' + c.u : ''), xa: c.xa, b: b + hintH });
    }
    if (c.type === 'shares') {
      const tot = rows.reduce((s, r) => s + (Number(r[1]) || 0), 0), pct = c.u === '%';
      /* c.semantic: phần tử mang màu riêng ở ô thứ 3 (mức cảnh báo Xanh/Vàng/Cam/Đỏ…) — màu phải khớp tên, không lấy theo thứ tự */
      const col = (r, i) => (c.semantic && r[2]) || CTM_PAL[i % CTM_PAL.length];
      const tTxt = ctmF(c.total != null ? ctmText(c.total, n.D) : tot, c.d || 0), kT = tTxt + '|' + (c.u || '');
      /* tổng trùng số lớn đã hiện ở thẻ trước trong cùng màn: không ghi lại (quy tắc H14) */
      let b = c.noTotal || CTM_SHOWN[kT] ? '' : ctmBig(tTxt, c.u || '');
      CTM_SHOWN[kT] = 1;
      if (!pct) b += '<div class="stc-stack">' + rows.map((r, i) => '<i style="flex:' + Math.max(0, Number(r[1]) || 0) + ';background:' + col(r, i) + '" title="' + ctmE(ctmLb(r[0])) + '"></i>').join('') + '</div>';
      b += rows.map((r, i) => ctmPg(ctmLb(r[0]), pct ? '' : ctmF(r[1], c.d || 0) + (c.u ? ' ' + c.u : ''), pct ? Number(r[1]) : (tot ? (Number(r[1]) || 0) / tot * 100 : 0), col(r, i), pct ? ctmF(r[1], c.d == null ? 1 : c.d) + '%' : null)).join('');
      return ctmCard({ t: c.t, s: sub != null ? sub : ctmPLabel(spec, n.p) + (c.u && !pct ? ' · ' + c.u : ''), xa: c.xa, b: b + hintH });
    }
    const head = '<tr>' + (c.head || []).map((h) => '<th>' + ctmE(ctmLb(h)) + '</th>').join('') + '</tr>';
    const ds = c.d || [];
    const body = rows.slice(0, c.max || 50).map((r) => '<tr>' + r.map((v, j) => '<td>' + (j === 0 ? ctmE(ctmLb(v)) : typeof v === 'number' ? ctmF(v, ds[j - 1] || 0) : ctmE(v == null ? '—' : v)) + '</td>').join('') + '</tr>').join('');
    return ctmCard({ t: c.t, s: sub != null ? sub : ctmPLabel(spec, n.p), xa: c.xa, b: '<div class="ctm-scroll"><table class="stc-tbl"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' + hintH });
  }
  return '';
}
/* Bố cục mặc định của một nhóm khi cấu hình không ghi rows: hàng 1 = so sánh kỳ này/kỳ trước (các chỉ tiêu cùng đơn vị
   với chỉ tiêu đầu) + cột qua các kỳ; các hàng sau = cơ cấu (parts), bảng (table), tỷ lệ (rates), xã/phường đứng đầu (top). */
function ctmAutoRows(spec, g) {
  const L = ctmGLines(g, ctmNP(spec)), u0 = ctmM(spec, L[0]).u, rows = [], extra = [];
  const pct = L.filter((k) => ctmM(spec, k).u === '%');
  const colsKey = g.cols || (u0 === '%' ? L.find((k) => ctmM(spec, k).u !== '%') || L[0] : L[0]);
  /* thẻ cơ cấu của nhóm: g.parts, và bảng có tổng tối đa 6 phần cũng vẽ bằng thẻ cơ cấu chuẩn (quy tắc H15) */
  const comps = [];
  if (g.parts) comps.push({ type: 'parts', t: g.parts[2] || 'Cơ cấu', total: g.parts[0], parts: g.parts[1], hint: g.parts[3] });
  let table = null;
  if (g.table) {
    const tp = (g.table[1] || []).filter((k) => k !== g.table[0]);
    if (g.table[0] && tp.length <= 6) comps.push({ type: 'parts', t: g.table[2] || 'Cơ cấu', total: g.table[0], parts: tp });
    else table = { type: 'table', t: g.table[2] || 'Chi tiết', total: g.table[0] || null, rows: g.table[1], head: g.table[3], wide: true };
  }
  const r1 = [];
  let cmp = null;
  if (u0 === '%') r1.push({ type: 'rates', t: g.label, items: pct, xa: g.xa, hint: g.hint });
  else {
    cmp = { type: 'cmp', t: g.cmpT || g.label, big: L[0], items: L.filter((k) => ctmM(spec, k).u === u0 && !ctmM(spec, k).plan).slice(0, 4), xa: g.xa, hint: g.hint };
    /* không lặp số (quy tắc H14): mọi số của thẻ so sánh đã có trong một thẻ cơ cấu thì bỏ thẻ so sánh, đưa thẻ cơ cấu lên hàng đầu */
    const dup = comps.find((p) => cmp.items.every((k) => k === p.total || p.parts.indexOf(k) >= 0));
    if (dup && cmp.items.length >= 2) { comps.splice(comps.indexOf(dup), 1); dup.xa = g.xa; dup.hint = dup.hint || g.hint; r1.push(dup); cmp = null; }
    else {
      /* tổng là số lớn đầu thẻ, không lặp lại thành một thanh cạnh các phần của chính nó (quy tắc H13) */
      if (comps.some((p) => p.total === L[0])) cmp.noBig = true;
      r1.push(cmp);
    }
  }
  /* bảng không có tổng mà toàn bộ dòng đã nằm trong thẻ so sánh: bỏ bảng (quy tắc H14) */
  if (table && !table.total && cmp && table.rows.every((k) => cmp.items.indexOf(k) >= 0)) table = null;
  const mc = ctmM(spec, colsKey);
  r1.push({ type: 'cols', t: g.colsT || ((mc.short || mc.l) + ' qua ' + spec.periods.length + ' kỳ'), m: colsKey, m2: g.cols2 });
  rows.push(r1);
  comps.forEach((p) => extra.push(p));
  if (table) extra.push(table);
  if (g.rates || (u0 !== '%' && pct.length)) {
    const rItems = (g.rates && g.rates[0]) || pct;
    /* chỉ một tỷ lệ: ghi ngay trong thẻ so sánh, không tách thẻ "Tỷ lệ" một dòng đứng cạnh thẻ dài (bỏ trống gần hết thẻ) */
    if (cmp && rItems.filter((k) => !ctmM(spec, k).plan).length === 1) cmp.rates = rItems;
    else extra.push({ type: 'rates', t: (g.rates && g.rates[1]) || 'Tỷ lệ', items: rItems });
  }
  if (g.top && spec.xa) extra.push({ type: 'top', ind: g.top, n: 10 });
  for (let i = 0; i < extra.length; i += 2) {
    const pair = extra.slice(i, i + 2);
    if (pair.length === 2 && pair[1].type === 'table') pair.reverse();
    if (pair[0].type !== 'table') pair.forEach((x) => { x.wide = false; });
    rows.push(pair);
  }
  return rows;
}

/* ---------- Màn: Tổng quan ---------- */
function ctmScreenHome(spec) {
  const n = ctmNP(spec);
  let h = ctmHeader(spec, null);
  h += '<div class="stc-kpis" style="--ctm-k:' + Math.min(8, spec.kpis.length) + '">' + spec.kpis.map((k) => ctmKpiTile(spec, k, n)).join('') + '</div>';
  const G = spec.groups || [];
  h += '<div class="stc-secrow"><div class="stc-sec">' + ctmCountWord(G.length) + ' nhóm chỉ tiêu · mỗi nhóm một màn hình</div><div style="display:flex;gap:18px;flex-wrap:wrap">' + (spec.xa ? ctmLnk(ctmXaLabel(spec) + ' ›', 'ctmXa()') : '') + (spec.rec ? ctmLnk(spec.rec.label + ' ›', 'ctmRec(null)') : '') + '</div></div>';
  h += '<div class="sgd-g3">' + (spec.rec ? ctmRecCard(spec, n) : '') + G.map((g) => ctmGroupCard(spec, g, n)).join('') + (spec.xa ? ctmXaCard(spec) : '') + '</div>';
  if (spec.note) h += '<div class="stc-mt">' + ctmNote('<b>Cách đọc:</b> ' + ctmText(spec.note, n.D, n.P, n)) + '</div>';
  return h + ctmFoot(spec, n);
}
function ctmCountWord(k) { return ['Không', 'Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'][k] || String(k); }

/* ---------- Màn: một nhóm ---------- */
function ctmScreenGroup(spec) {
  const G = spec.groups || [], gi = Math.max(0, G.findIndex((g) => g.id === CTM_UI.group)), g = G[gi];
  const n = ctmNP(spec);
  CTM_SHOWN = {};
  let h = ctmHeader(spec, 'home');
  if (g.note) h += '<div style="margin:-4px 0 14px" class="stc-hint">' + ctmE(ctmText(g.note, n.D, n.P, n)) + '</div>';
  let ri = 0;
  (g.rows || ctmAutoRows(spec, g)).forEach((row) => {
    /* thẻ không có gì để vẽ (VD biểu đồ mọi kỳ bằng nhau) thì bỏ, hàng còn lại tự giãn */
    const cards = row.map((c) => ({ c: c, h: ctmCardHtml(spec, c, n) })).filter((x) => x.h);
    if (!cards.length) return;
    /* thẻ gọn (một chỉ tiêu) đứng cạnh biểu đồ theo tỷ lệ 1:2 thay vì chia đôi, để thẻ không bỏ trống nửa dưới */
    const cls = cards.length === 1 ? '' : cards.length === 3 ? 'stc-g3' : cards.length === 2 && cards[0].h.indexOf('ctm-compact') >= 0 ? 'ctm-g12' : (cards[0].c && cards[0].c.wide ? 'stc-g21' : 'stc-g2');
    const inner = cards.map((x) => x.h).join('');
    h += cls ? '<div class="' + cls + (ri ? ' stc-mt' : '') + '">' + inner + '</div>' : '<div' + (ri ? ' class="stc-mt"' : '') + '>' + inner + '</div>';
    ri++;
  });
  if (G.length > 1) {
    const N = G.length, prev = G[(gi + N - 1) % N], next = G[(gi + 1) % N];
    h += '<div class="stc-pn"><span>' + ctmLnk('‹ ' + prev.label, "ctmGo('group','" + prev.id + "')") + '</span>' + ctmLnk('Tổng quan', "ctmGo('home')") + '<span>' + ctmLnk(next.label + ' ›', "ctmGo('group','" + next.id + "')") + '</span></div>';
  }
  return h + ctmFoot(spec, n);
}

/* ---------- Màn: theo 126 xã, phường ---------- */
function ctmXaVal(I, r) { try { const v = I.v(r); return v == null || !isFinite(v) ? null : Number(v); } catch (e) { return null; } }
/* Trọng số của một xã, phường khi gộp tỷ lệ, bình quân lên Thành phố: I.w = khóa số trong dòng | hàm (dòng) | mặc định dân số */
function ctmXaWt(I, r) {
  if (typeof I.w === 'function') { try { return Number(I.w(r)) || 0; } catch (e) { return 0; } }
  if (typeof I.w === 'string') return Number(r[I.w]) || 0;
  return r.u ? r.u.ds || 0 : 0;
}
/* Số tuyệt đối (tổng, số đếm…): không xếp hạng tốt/kém — chỉ sắp thứ tự từ lớn đến nhỏ (quy tắc H16) */
function ctmXaNoRank(I) {
  if (I.rank === false) return true;
  /* chỉ tiêu trung tính (kiến nghị, phản ánh, đơn thư…: nhiều hay ít không tự thân tốt/xấu — quy tắc H18): chỉ sắp theo số */
  if (I.better === 'none') return true;
  if (I.rank === true) return false;
  return !!I.tot || (I.u !== '%' && !/trên [\d.]+ (dân|hộ)|bình quân|\//.test(String(I.l || '') + ' ' + String(I.u || '')));
}
/* Mẫu nhỏ: tỷ lệ tính trên mẫu số dưới ngưỡng thì vẫn hiện số nhưng không xếp hạng */
function ctmXaSmall(I, r) { return !!I.minW && ctmXaWt(I, r) < I.minW; }
function ctmXaTP(spec, I, rows, n) {
  if (I.tp) { try { const v = I.tp(n.D, rows); return v == null || !isFinite(v) ? null : v; } catch (e) { return null; } }
  if (I.tot) { const vs = rows.map((r) => ctmXaVal(I, r)).filter((v) => v != null); return vs.length ? vs.reduce((a, b) => a + b, 0) : null; }
  if (I.num && I.den) { const a = rows.reduce((s, r) => s + (I.num(r) || 0), 0), b = rows.reduce((s, r) => s + (I.den(r) || 0), 0); return b ? a / b * (I.mul || 100) : null; }
  /* tỷ lệ, bình quân: gộp theo trọng số (tổng tử số ÷ tổng mẫu số), không lấy trung bình cộng các xã (quy tắc H20) */
  let a = 0, b = 0;
  rows.forEach((r) => { const v = ctmXaVal(I, r), w = ctmXaWt(I, r); if (v != null && w > 0) { a += v * w; b += w; } });
  return b ? a / b : null;
}
function ctmXaRank(I, rows, r) {
  const v = ctmXaVal(I, r);
  if (v == null || ctmXaSmall(I, r)) return null;
  const low = !ctmXaNoRank(I) && I.better === 'low';
  let b = 0;
  rows.forEach((x) => { const w = ctmXaVal(I, x); if (w != null && !ctmXaSmall(I, x) && (low ? w < v - 1e-9 : w > v + 1e-9)) b++; });
  return b + 1;
}
function ctmNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); }
function ctmXaInd(spec) { const X = CTM_UI.xa; return spec.xa.inds.find((x) => x.id === X.ind) || spec.xa.inds[0]; }
function ctmScreenXa(spec) {
  const n = ctmNP(spec), X = CTM_UI.xa, I = ctmXaInd(spec), ctx = ctmCtx();
  const rows = ctmXaRows(spec, n.p), tp = ctmXaTP(spec, I, rows, n), here = ctx.xa ? rows.find((r) => r.u.name === ctx.xa.name) : null;
  const noRank = ctmXaNoRank(I), low = !noRank && I.better === 'low';
  const valid = rows.filter((r) => ctmXaVal(I, r) != null && !ctmXaSmall(I, r)), small = rows.filter((r) => ctmXaVal(I, r) != null && ctmXaSmall(I, r));
  const sorted = valid.slice().sort((a, b) => (low ? ctmXaVal(I, a) - ctmXaVal(I, b) : ctmXaVal(I, b) - ctmXaVal(I, a)));
  const best = sorted[0], worst = sorted[sorted.length - 1], pct = I.u === '%' ? '%' : '';
  const nav = '<div class="stc-card sgd-nav ctm-nav" style="padding:12px 8px"><div class="stc-nvh">Chỉ tiêu</div>' + spec.xa.inds.map((x) => '<button type="button" class="stc-nvi' + (x.id === I.id ? ' on' : '') + '" onclick="ctmXaPick(' + ctmJs(x.id) + ')">' + ctmE(x.l) + '</button>').join('') + '</div>';
  const mchip = (k, v, hint) => '<div class="stc-mchip"><div class="stc-k">' + ctmE(k) + '</div><div class="stc-v">' + v + '</div>' + (hint ? '<div class="stc-hint">' + ctmE(hint) + '</div>' : '') + '</div>';
  let chips = mchip(I.tot ? 'Tổng 126 xã, phường' : (I.tpL || 'Mức chung Thành phố'), ctmF(tp, I.d) + pct, I.u === '%' ? '' : I.u);
  /* số tuyệt đối: "nhiều nhất / ít nhất", không gọi là tốt nhất / kém nhất */
  if (best) chips += mchip(noRank ? 'Nhiều nhất' : low ? 'Thấp nhất' : 'Cao nhất', ctmF(ctmXaVal(I, best), I.d) + pct, best.u.name);
  if (worst) chips += mchip(noRank ? 'Ít nhất' : low ? 'Cao nhất' : 'Thấp nhất', ctmF(ctmXaVal(I, worst), I.d) + pct, worst.u.name);
  if (here) chips += mchip(here.u.name, ctmF(ctmXaVal(I, here), I.d) + pct, ctmXaSmall(I, here) ? 'Mẫu nhỏ, không xếp hạng' : (noRank ? 'Thứ tự ' : 'Hạng ') + (ctmXaRank(I, rows, here) || '—') + '/' + valid.length);
  else if (I.tot) { const z = valid.filter((r) => ctmXaVal(I, r) === 0).length; chips += mchip(I.zeroLabel || 'Đơn vị bằng 0', ctmF(z), 'trên 126 xã, phường'); }
  else if (tp != null && !noRank) { const w = valid.filter((r) => (low ? ctmXaVal(I, r) > tp + 1e-9 : ctmXaVal(I, r) < tp - 1e-9)).length; chips += mchip('Kém hơn mức Thành phố', ctmF(w), 'trên ' + valid.length + ' xã, phường' + (small.length ? ' (không tính ' + small.length + ' nơi mẫu nhỏ)' : '')); }
  const q = ctmNorm(X.q);
  const list = sorted.concat(small, rows.filter((r) => ctmXaVal(I, r) == null)).filter((r) => (X.f === 'all' || r.u.k === X.f) && (!q || ctmNorm(r.u.name).indexOf(q) >= 0));
  X.order = list.map((r) => r.u.name);
  const lastH = I.tot ? 'Tỷ trọng' : 'So mức TP';
  /* spec.xa.cot: cột thứ 3 thay cho Dân số (chỉ tiêu theo eform không dùng dân số — VD số bản ghi của xã) */
  const C3 = spec.xa.cot || { l: 'Dân số', v: (I0, r) => r.u.ds };
  const head = '<div class="sgd-xt-row sgd-xt-head ctm-xr"><span>' + (noRank ? 'Thứ tự' : 'Hạng') + '</span><span>Xã, phường</span><span class="sgd-num">' + ctmE(C3.l) + '</span><span class="sgd-num">' + ctmE(I.u === '%' ? 'Tỷ lệ' : 'Giá trị') + '</span><span class="sgd-num">' + lastH + '</span></div>';
  const body = list.map((r) => {
    const v = ctmXaVal(I, r), rk = ctmXaRank(I, rows, r);
    const last = v == null ? '—' : ctmXaSmall(I, r) ? '<span class="stc-dl na">Mẫu nhỏ</span>' : I.tot ? (tp ? ctmF(v / tp * 100, 1) + '%' : '—') : ctmDl(v, tp, { rate: I.u === '%', inv: low, neutral: noRank, d: I.d, eq: 'Bằng mức TP' });
    const on = (here && r === here) || X.sel === r.u.name;
    return '<div class="sgd-xt-row ctm-xr' + (on ? ' on' : '') + '"><span class="sgd-no">' + (rk || '—') + '</span><button type="button" class="sgd-xbtn" onclick="ctmXaSel(' + ctmJs(r.u.name) + ')"><i class="ctm-pk ' + (r.u.k === 'P' ? 'p' : 'x') + '">' + (r.u.k === 'P' ? 'P' : 'X') + '</i>' + ctmE(r.u.short) + '</button><span class="sgd-num sgd-mute">' + ctmF(C3.v(I, r)) + '</span><span class="sgd-num sgd-strong">' + ctmF(v, I.d) + '</span><span class="sgd-num">' + last + '</span></div>';
  }).join('') || '<div class="sgd-xt-row"><span class="sgd-mute">Không có xã, phường phù hợp bộ lọc.</span></div>';
  const nP = rows.filter((r) => r.u.k === 'P').length, nX = rows.length - nP;
  const tools = '<div class="ctm-tools"><div class="sgd-pills">' + [['all', 'Tất cả ' + rows.length], ['P', nP + ' phường'], ['X', nX + ' xã']].map((p) => '<button type="button" class="sgd-pill' + (X.f === p[0] ? ' on' : '') + '" onclick="ctmXaF(\'' + p[0] + '\')">' + p[1] + '</button>').join('') + '</div>' +
    '<label class="sgd-search"><small>Tìm</small><input id="ctmQ" value="' + ctmE(X.q) + '" placeholder="Tên xã, phường" oninput="ctmXaQ(this.value)" aria-label="Tìm xã, phường"></label></div>';
  const right = '<div style="min-width:0"><div class="stc-mchips">' + chips + '</div><div class="stc-card" style="padding:14px 14px 12px"><div class="stc-ch" style="margin-bottom:0"><div><h3 class="stc-ct">' + ctmE(I.l) + '</h3><div class="stc-cs">' + ctmE((I.u ? I.u + ' · ' : '') + ctmPLabel(spec, n.p) + (here ? ' · dòng đánh dấu là ' + here.u.name : '') + ' · bấm tên để xem hồ sơ') + '</div></div></div>' + tools + '<div class="sgd-xt-box">' + head + body + '</div></div></div>';
  let h = ctmHeader(spec, 'home') + '<div class="stc-explore">' + nav + right + '</div>';
  const note = ctmText(spec.xa.note, n.D, n.P, n);
  if (note) h += '<div class="stc-mt">' + ctmNote(note) + '</div>';
  if (X.sel) h += ctmXaDrawer(spec, rows, X.sel, n);
  return h + ctmFoot(spec, n);
}
function ctmXaDrawer(spec, rows, name, n) {
  const r = rows.find((x) => x.u.name === name);
  if (!r) return '';
  const X = CTM_UI.xa, at = X.order.indexOf(name), anim = X.anim ? ' sgd-dw-anim' : '';
  const chips = spec.xa.inds.map((I) => {
    const v = ctmXaVal(I, r), rk = ctmXaRank(I, rows, r), nn = rows.filter((x) => ctmXaVal(I, x) != null && !ctmXaSmall(I, x)).length;
    const pos = v == null ? 'Chưa có số' : ctmXaSmall(I, r) ? 'Mẫu nhỏ, không xếp hạng' : (ctmXaNoRank(I) ? 'Thứ tự ' : 'Hạng ') + rk + '/' + nn;
    return '<div class="stc-mchip"><div class="stc-k">' + ctmE(I.l) + '</div><div class="stc-v">' + ctmF(v, I.d) + (I.u === '%' ? '%' : '') + '</div><div class="stc-hint">' + ctmE(pos + (I.u && I.u !== '%' ? ' · ' + I.u : '')) + '</div></div>';
  }).join('');
  const extra = ctmText(spec.xa.profile, r, n);
  return '<div class="sgd-dw-bg' + anim + '" onclick="ctmXaSel(null)"></div><aside class="sgd-dw' + anim + '" role="dialog" aria-label="Hồ sơ ' + ctmE(r.u.name) + '"><div class="sgd-dw-top">' +
    '<button type="button" class="sgd-dw-nav" onclick="ctmXaStep(-1)"' + (at > 0 ? '' : ' disabled') + '>‹ Trước</button><span class="sgd-dw-pos">' + (at >= 0 ? (at + 1) + '/' + X.order.length : '') + '</span><button type="button" class="sgd-dw-nav" onclick="ctmXaStep(1)"' + (at >= 0 && at < X.order.length - 1 ? '' : ' disabled') + '>Sau ›</button>' +
    '<button type="button" class="sgd-dw-x" onclick="ctmXaSel(null)" aria-label="Đóng">×</button></div><div class="sgd-dw-body">' +
    '<h3 style="font-size:17px;font-weight:700;margin:0 0 4px">' + ctmE(r.u.name) + '</h3><div class="stc-hint" style="margin-bottom:12px">' + (spec.xa.noDs ? '' : 'Diện tích ' + ctmF(r.u.dt, 2) + ' km² · dân số ' + ctmF(r.u.ds) + ' người · mật độ ' + ctmF(r.u.den) + ' người/km² · ') + ctmE(ctmPLabel(spec, n.p)) + '</div>' +
    '<div class="stc-mchips">' + chips + '</div>' + (extra || '') + '</div></aside>';
}

/* ---------- Dựng popup + điều khiển ---------- */
function ctmScreenHtml(spec) {
  if (CTM_UI.screen === 'group' && (spec.groups || []).length) return ctmScreenGroup(spec);
  if (CTM_UI.screen === 'xa' && spec.xa) return ctmScreenXa(spec);
  if (CTM_UI.screen === 'rec' && spec.rec) return spec.rec.screen(spec);
  return ctmScreenHome(spec);
}
function ctmScreenMeta(spec) {
  const base = ctmName(spec), org = ctmOrg(spec), pl = ctmPLabel(spec, ctmCurPid(spec));
  if (CTM_UI.screen === 'group') { const G = spec.groups || [], gi = Math.max(0, G.findIndex((g) => g.id === CTM_UI.group)); return { title: base + ' — ' + (G[gi] ? G[gi].label : ''), sub: (org ? org + ' · ' : '') + 'Nhóm ' + (gi + 1) + '/' + G.length + ' · ' + pl }; }
  if (CTM_UI.screen === 'xa' && spec.xa) return { title: base + ' — ' + ctmXaLabel(spec), sub: (org ? org + ' · ' : '') + ctmXaInd(spec).l + ' · ' + pl };
  if (CTM_UI.screen === 'rec' && spec.rec) return { title: base + ' — ' + spec.rec.label, sub: (org ? org + ' · ' : '') + pl };
  return { title: base, sub: (org ? org + ' · ' : '') + spec.kpis.length + ' chỉ tiêu chính · ' + (spec.groups || []).length + ' nhóm · ' + pl };
}
function ctmTasksHtml(spec) {
  if (typeof fieldScenarioSummary !== 'function') return '';
  try { return '<div class="stc-tasks" style="margin-top:18px">' + fieldScenarioSummary('cat::' + (CTM_UI.role || spec.role) + '::' + spec.id) + '</div>'; } catch (e) { return ''; }
}
function ctmIsShown() { return typeof document !== 'undefined' && !!document.querySelector && !!document.querySelector('#modalBody .ctm-root'); }
function ctmRerender(resetScroll, force) {
  if (typeof document === 'undefined') return;
  const body = document.getElementById('modalBody'), title = document.getElementById('modalTitle'), sub = document.getElementById('modalSub');
  const spec = ctmSpec();
  if (!body || !CTM_UI.open || !spec || (!force && !ctmIsShown())) return;
  const top = body.scrollTop, meta = ctmScreenMeta(spec);
  if (title) title.textContent = meta.title;
  if (sub) sub.textContent = meta.sub;
  let html;
  try { html = ctmScreenHtml(spec); } catch (e) { if (typeof console !== 'undefined') console.error(e); html = ctmEmpty('Không dựng được màn hình', 'Có lỗi khi tính số liệu: ' + (e && e.message ? e.message : e)); }
  body.innerHTML = '<div class="stc-root sgd-root ctm-root stc-wrap">' + html + '</div>' + ctmTasksHtml(spec);
  ctmFitLines(body);
  body.scrollTop = resetScroll ? 0 : top;
  CTM_UI.xa.anim = false;
  if (CTM_UI.focusQ) {
    const inp = body.querySelector('#ctmQ');
    if (inp) { inp.focus(); const L = inp.value.length; try { inp.setSelectionRange(L, L); } catch (e) { /* bỏ qua */ } }
    CTM_UI.focusQ = false;
  }
}
/* Có dùng khuôn mới cho lĩnh vực này không (cấp Thành phố hay cấp xã đúng với cấu hình). */
function ctmHandles(catId) {
  if (!CTM_ENABLED) return false;
  const s = CTM_SPECS[catId];
  if (!s || s.enabled === false) return false;
  const atXa = typeof currentXaId !== 'undefined' && currentXaId != null;
  return (s.level || 'city') === (atXa ? 'xa' : 'city');
}
/* itemIndex: số (thẻ chỉ tiêu cũ, mở Tổng quan) | 'g:<nhóm>' | 'xa' | 'xa:<chỉ tiêu>' */
function ctmOpenForm(catId, itemIndex, role) {
  const spec = CTM_SPECS[catId];
  if (!spec) return;
  if (CTM_UI.id !== catId) { CTM_UI.period = spec.periods[0].id; CTM_UI.xa.ind = spec.xa ? spec.xa.inds[0].id : null; CTM_UI.xa.f = 'all'; CTM_UI.xa.q = ''; CTM_UI.rec = { f: 'all', q: '', key: null }; }
  CTM_UI.id = catId; CTM_UI.role = role || spec.role; CTM_UI.dd = null; CTM_UI.xa.sel = null;
  const t = typeof itemIndex === 'string' ? itemIndex : '';
  if (t.indexOf('g:') === 0 && (spec.groups || []).some((g) => g.id === t.slice(2))) { CTM_UI.screen = 'group'; CTM_UI.group = t.slice(2); }
  else if (t.indexOf('xa') === 0 && spec.xa) { CTM_UI.screen = 'xa'; if (t.length > 3) CTM_UI.xa.ind = t.slice(3); }
  else if (t.indexOf('rec') === 0 && spec.rec) { CTM_UI.screen = 'rec'; CTM_UI.rec = { f: 'all', q: '', key: t.length > 4 ? t.slice(4) : null }; }
  else CTM_UI.screen = 'home';
  if (typeof STC_UI !== 'undefined') STC_UI.open = false;
  if (typeof SGD_UI !== 'undefined') SGD_UI.open = false;
  if (typeof HCC_UI !== 'undefined') HCC_UI.open = false;
  CTM_UI.open = true;
  ctmRerender(true, true);
  if (typeof openModal === 'function') openModal();
  /* lần dựng đầu popup còn ẩn nên chưa đo được bề rộng: vẽ lại biểu đồ đường khi popup đã hiện */
  ctmFitLines(document.getElementById('modalBody'));
}
function ctmClose() { CTM_UI.open = false; if (typeof closeModal === 'function') closeModal(); }
function ctmGo(screen, arg) { CTM_UI.dd = null; CTM_UI.xa.sel = null; CTM_UI.screen = screen; if (screen === 'group' && arg) CTM_UI.group = arg; ctmRerender(true); }
function ctmXa(ind) { CTM_UI.dd = null; CTM_UI.screen = 'xa'; CTM_UI.xa.sel = null; if (ind) CTM_UI.xa.ind = ind; ctmRerender(true); }
function ctmXaPick(ind) { CTM_UI.xa.ind = ind; ctmRerender(false); }
function ctmXaF(f) { CTM_UI.xa.f = f; ctmRerender(false); }
function ctmXaQ(v) { CTM_UI.xa.q = v; CTM_UI.focusQ = true; ctmRerender(false); }
function ctmXaSel(name) { const X = CTM_UI.xa; X.anim = !!name && !X.sel; X.sel = name || null; ctmRerender(false); }
function ctmXaStep(d) { const X = CTM_UI.xa, at = X.order.indexOf(X.sel); if (at < 0 || !X.order[at + d]) return; X.sel = X.order[at + d]; ctmRerender(false); }
/* Màn Dữ liệu đã nhập: key = dòng số liệu hoặc ô số (chỉ hiện các bản ghi tạo ra số đó), null = mọi bản ghi của kỳ */
function ctmRec(key) { CTM_UI.dd = null; CTM_UI.screen = 'rec'; CTM_UI.rec = { f: 'all', q: '', key: key || null, ef: CTM_UI.rec.ef }; ctmRerender(true); }
function ctmSetGran(g) { CTM_UI.dd = null; CTM_UI.gran = String(g); CTM_UI.period = null; ctmRerender(false); }
function ctmRecF(f) { CTM_UI.rec.f = f; ctmRerender(false); }
function ctmRecQ(v) { CTM_UI.rec.q = v; CTM_UI.focusQ = true; ctmRerender(false); }
function ctmDdToggle(id) { CTM_UI.dd = CTM_UI.dd === id ? null : id; ctmRerender(false); }
function ctmSetPeriod(p) { CTM_UI.dd = null; CTM_UI.period = String(p); ctmRerender(false); }
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !CTM_UI.open || !ctmIsShown()) return;
    const m = document.getElementById('modal');
    if (!(m && m.classList.contains('open'))) return;
    if (CTM_UI.dd) { CTM_UI.dd = null; ctmRerender(false); return; }
    if (CTM_UI.screen === 'xa' && CTM_UI.xa.sel) { ctmXaSel(null); return; }
    ctmClose();
  });
  document.addEventListener('click', (e) => {
    if (!CTM_UI.dd || !CTM_UI.open || !ctmIsShown()) return;
    if (e.target && e.target.closest && e.target.closest('.ctm-root .stc-dd')) return;
    CTM_UI.dd = null;
    ctmRerender(false);
  });
}

/* ---------- Xuất Excel ---------- */
async function ctmExport() {
  const spec = ctmSpec();
  if (!spec) return;
  if (typeof ExcelJS === 'undefined') { if (typeof toast === 'function') toast('Thư viện xuất Excel chưa tải xong, thử lại sau giây lát.'); return; }
  const n = ctmNP(spec), wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Chỉ tiêu');
  ws.addRow([ctmName(spec) + (ctmOrg(spec) ? ' · ' + ctmOrg(spec) : '') + ' · ' + ctmPLabel(spec, n.p)]).font = { bold: true };
  ws.addRow([]);
  ws.addRow(['Nhóm', 'Chỉ tiêu', ctmPLabel(spec, n.p), n.pp != null ? ctmPLabel(spec, n.pp) : 'Kỳ trước', 'So kỳ trước (%)', 'Đơn vị']).font = { bold: true };
  const add = (grp, k) => {
    const m = ctmM(spec, k), a = ctmV(spec, k, n.D), b = n.P ? ctmV(spec, k, n.P) : null;
    const d = a == null || b == null ? null : (m.rate || m.u === '%') ? Math.round((a - b) * 100) / 100 : b ? Math.round((a / b - 1) * 1000) / 10 : null;
    ws.addRow([grp, m.l, a, b, d, m.u === '%' ? '%' + ((m.rate || m.u === '%') ? ' (chênh điểm %)' : '') : m.u || '']);
  };
  spec.kpis.forEach((k) => add('Chỉ tiêu chính', k.m));
  (spec.groups || []).forEach((g) => ctmGLines(g, n).forEach((k) => add(g.label, k)));
  ws.columns = [{ width: 28 }, { width: 44 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 22 }];
  if (spec.rec && spec.rec.sheet) {
    const R = spec.rec.sheet(spec, n), wr = wb.addWorksheet(spec.rec.label);
    wr.addRow(R.head).font = { bold: true };
    R.rows.forEach((r) => wr.addRow(r));
    wr.columns = R.head.map((h, i) => ({ width: i ? Math.min(40, Math.max(12, String(h).length + 4)) : 6 }));
  }
  if (spec.xa) {
    const wx = wb.addWorksheet('Theo xã, phường');
    const nd = !!spec.xa.noDs;
    wx.addRow(['Xã, phường', 'Loại'].concat(nd ? [] : ['Dân số', 'Diện tích (km²)'], spec.xa.inds.map((I) => I.l + ' (' + I.u + ')'))).font = { bold: true };
    ctmXaRows(spec, n.p).forEach((r) => wx.addRow([r.u.name, r.u.k === 'P' ? 'Phường' : 'Xã'].concat(nd ? [] : [r.u.ds, r.u.dt], spec.xa.inds.map((I) => { const v = ctmXaVal(I, r); return v == null ? null : Math.round(v * 100) / 100; }))));
    wx.columns = [{ width: 32 }, { width: 10 }].concat(nd ? [] : [{ width: 12 }, { width: 14 }], spec.xa.inds.map(() => ({ width: 22 })));
  }
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chi-tieu-' + spec.id + '-' + n.p + '.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ============================== MÀN NGOÀI (lưới "Nhóm chỉ tiêu theo lĩnh vực") ==============================
   ctmRegisterOverview({
     id, roles: ['MTTQ'], level: 'city' | 'xa',
     eyebrow, title(nUnits, ctx), hint(ctx), ax: 'MTTQ TP' (nhãn trục trên thẻ), unitWord: 'đơn vị',
     kpis: [{ cat, m, l, target }],           // ô số then chốt: chỉ tiêu m của đơn vị cat
     groups: [{ id, label, ids: [catId…], ax? }]
   })
   Thẻ đơn vị lấy số từ cấu hình của đơn vị (spec.card hoặc 4 ô số đầu); đơn vị chưa có cấu hình thì liệt kê tên chỉ tiêu cũ. */
function ctmOverviewFor(roles) {
  if (!CTM_ENABLED || !CTM_OVERVIEW_ENABLED || !roles || !roles.length) return null;
  const atXa = typeof currentXaId !== 'undefined' && currentXaId != null;
  const key = roles.slice().sort().join(',');
  return CTM_OVERVIEWS.find((c) => c.enabled !== false && (c.level || 'city') === (atXa ? 'xa' : 'city') && c.roles.slice().sort().join(',') === key) || null;
}
/* Dòng số trên thẻ ngoài: spec.card (khóa chỉ tiêu) — nhãn lấy spec.cardL[khóa] nếu có (nhãn đủ nghĩa khi đứng một mình ở màn ngoài),
   không thì nhãn ngắn. Mọi màn ngoài (tab UBND, tab Tất cả, băng tổng quan) dùng chung hàm này — quy tắc H22. */
function ctmOvLines(spec) {
  const n = ctmNP(spec);
  return (spec.card || spec.kpis.slice(0, 4).map((k) => k.m)).map((k) => { const m = ctmM(spec, k); return { k: k, l: (spec.cardL && spec.cardL[k]) || m.short || m.l, v: ctmF(ctmV(spec, k, n.D), m.d), u: m.u || '' }; });
}
function ctmOvLineHtml(x) { return '<div class="uo-gl uo-col"><span class="uo-l">' + ctmE(x.l) + '</span><span class="uo-v"' + (String(x.v).length > 11 ? ' style="font-size:12px"' : '') + '>' + x.v + '</span><span class="uo-u">' + ctmE(x.u) + '</span></div>'; }
/* cfg.rename(chuỗi, ctx): đổi nhãn theo đơn vị đang xem (VD 'phường' → 'xã' ở tài khoản xã). */
function ctmOvRn(cfg, s) { return cfg.rename ? cfg.rename(String(s == null ? '' : s), ctmCtx()) : String(s == null ? '' : s); }
function ctmOvShort(c, cfg) { return ctmOvRn(cfg, (cfg.short && cfg.short[c.id]) || c.short || c.name); }
/* Nhóm của màn ngoài: ghi ids (danh sách lĩnh vực) hoặc role (mọi lĩnh vực của một trục — dùng cho tab Tất cả). */
function ctmOvIds(g, catsAll) { return g.ids || catsAll.filter((c) => c.role === g.role).map((c) => c.id); }
function ctmOvGroupOf(cfg, c) { return (cfg.groups || []).find((g) => (g.ids ? g.ids.indexOf(c.id) >= 0 : g.role === c.role)) || null; }
/* Dòng số của một đơn vị CHƯA khai báo khuôn mới nhưng có số ở màn tổng quan UBND (ubnd-overview.js: ubndOvData) */
function ctmOvUbndLines(id) {
  if (typeof ubndOvData !== 'function') return null;
  const d = ubndOvData(id);
  return d && d.lines && d.lines.length ? { ky: d.ky, lines: d.lines.map((x) => ({ l: x.l, v: x.v, u: x.u })) } : null;
}
function ctmOvKpi(cfg, k, catsAll) {
  const spec = CTM_SPECS[k.cat], c = catsAll.find((x) => x.id === k.cat);
  if (!spec && c) {
    const U = ctmOvUbndLines(k.cat), x = U && U.lines[k.line || 0];
    if (!x) return '';
    const val = x.v + (x.u === '%' ? '<small class="uo-pct">%</small>' : x.u ? '<small>' + ctmE(x.u) + '</small>' : '');
    return '<button type="button" class="stc-kpi uo-kpi" onclick="openCategoryDetail(\'' + c.role + '\',\'' + c.id + '\')"><div class="stc-lb">' + ctmE(k.l || x.l) + '</div><div class="stc-v">' + val + '</div><div class="uo-ksrc">' + ctmE(ctmOvShort(c, cfg) + ' · ' + (U.ky || '')) + '</div></button>';
  }
  if (!spec || !c) return '';
  const n = ctmNP(spec), m = ctmM(spec, k.m), v = ctmV(spec, k.m, n.D), u = k.u != null ? k.u : m.u, txt = ctmF(v, m.d);
  const val = txt + (u === '%' ? '<small class="uo-pct">%</small>' : u ? '<small>' + ctmE(u) + '</small>' : '');
  /* số dài (VD số tiền tính bằng đồng) thu nhỏ chữ cho vừa ô */
  return '<button type="button" class="stc-kpi uo-kpi" onclick="openCategoryDetail(\'' + c.role + '\',\'' + c.id + '\',' + ctmJs(k.target || 'home') + ')"><div class="stc-lb">' + ctmE(k.l || m.l) + '</div><div class="stc-v"' + (txt.length > 9 ? ' style="font-size:' + (txt.length > 13 ? 15 : 18) + 'px"' : '') + '>' + val + '</div><div class="uo-ksrc">' + ctmE(ctmOvShort(c, cfg) + ' · ' + ctmPLabel(spec, n.p)) + '</div></button>';
}
function ctmOvGroup(cfg, g, catsAll) {
  const list = ctmOvIds(g, catsAll).map((id) => catsAll.find((c) => c.id === id)).filter(Boolean), on = CTM_OV_PICK[cfg.id] === g.id, w = cfg.unitWord || 'đơn vị';
  const nInd = list.reduce((s, c) => s + (CTM_SPECS[c.id] ? CTM_SPECS[c.id].kpis.length : (c.items || []).length), 0);
  const rows = list.slice(0, 6).map((c) => {
    const U = CTM_SPECS[c.id] ? null : ctmOvUbndLines(c.id);
    const x = CTM_SPECS[c.id] ? ctmOvLines(CTM_SPECS[c.id])[0] : U ? U.lines[0] : null;
    return '<div class="uo-gl uo-grow uo-col"><span class="uo-l"><b>' + ctmE(ctmOvShort(c, cfg)) + '</b><em>' + ctmE(x ? x.l : ((c.items || [])[0] || [''])[0]) + '</em></span><span class="uo-v">' + (x ? x.v : '—') + '</span><span class="uo-u">' + ctmE(x ? x.u : '') + '</span></div>';
  }).join('') + (list.length > 6 ? '<div class="uo-gl"><span class="uo-l">và ' + (list.length - 6) + ' ' + w + ' khác</span><span></span><span></span></div>' : '');
  return '<button type="button" class="stc-gcard uo-gcard' + (on ? ' on' : '') + '" aria-pressed="' + on + '" onclick="ctmOvPick(' + ctmJs(cfg.id) + ',' + ctmJs(g.id) + ')"><div class="stc-gh"><h3>' + ctmE(ctmOvRn(cfg, g.label)) + '</h3><span>' + list.length + ' ' + w + ' · ' + nInd + ' chỉ tiêu</span></div>' + rows +
    '<div class="stc-gmore">' + (on ? 'Đang lọc · bấm lần nữa để bỏ lọc' : 'Lọc ' + list.length + ' ' + w + ' ›') + '</div></button>';
}
function ctmOvCard(cfg, c) {
  const spec = CTM_SPECS[c.id], g = ctmOvGroupOf(cfg, c);
  let body, foot, nInd;
  if (c.noItems || (!spec && !(c.items || []).length)) { body = '<div class="uo-empty">' + ctmE(c.desc || 'Đơn vị chưa có chỉ tiêu.') + '</div>'; foot = 'Chưa có chỉ tiêu'; nInd = 0; }
  else if (spec) { body = ctmOvLines(spec).map(ctmOvLineHtml).join(''); foot = ctmPLabel(spec, ctmCurPid(spec)); nInd = spec.kpis.length; }
  else if (ctmOvUbndLines(c.id)) { const U = ctmOvUbndLines(c.id); body = U.lines.map(ctmOvLineHtml).join(''); foot = U.ky || ''; nInd = (c.items || []).length; }
  else { body = (c.items || []).slice(0, 5).map((it) => '<div class="uo-gl"><span class="uo-l">' + ctmE(it[0]) + '</span><span></span><span></span></div>').join(''); foot = (c.types || []).join(', '); nInd = (c.items || []).length; }
  const ax = ctmOvRn(cfg, (g && g.ax) || cfg.ax || '');
  return '<button type="button" class="uo-card" onclick="openCategoryDetail(\'' + c.role + '\',\'' + c.id + '\')"><div class="uo-meta">' + (ax ? '<span class="uo-ax">' + ctmE(ax) + '</span>' : '') + '<span class="uo-n">' + nInd + ' chỉ tiêu</span>' + (g ? '<span class="uo-grp">' + ctmE(ctmOvRn(cfg, g.label)) + '</span>' : '') + '</div>' +
    '<h4>' + ctmE(ctmOvRn(cfg, c.name)) + '</h4><div class="uo-lines">' + body + '</div><div class="uo-foot"><span>' + ctmE(foot) + '</span></div></button>';
}
/* cats: các lĩnh vực sau khi lọc theo ô tìm kiếm (đã gắn role) */
function ctmOverviewHtml(cfg, cats) {
  const ctx = ctmCtx();
  const catsAll = [];
  cfg.roles.forEach((r) => (typeof categorySeedForRole === 'function' ? categorySeedForRole(r) : []).forEach((c) => catsAll.push(Object.assign({}, c, { role: r }))));
  const pick = CTM_OV_PICK[cfg.id], g = (cfg.groups || []).find((x) => x.id === pick);
  if (!g) CTM_OV_PICK[cfg.id] = 'all';
  const gIds = g ? ctmOvIds(g, catsAll) : null;
  const shown = g ? cats.filter((c) => gIds.indexOf(c.id) >= 0 && (!g.role || c.role === g.role)) : cats, w = cfg.unitWord || 'đơn vị';
  const kpis = (cfg.kpis || []).map((k) => ctmOvKpi(cfg, k, catsAll)).filter(Boolean);
  const G = cfg.groups || [];
  let h = '<div class="stc-root uo-root ctm-ov"><section class="uo-band"><div class="uo-head"><div><div class="stc-eyebrow">' + ctmE(ctmText(cfg.eyebrow, ctx)) + '</div><h2>' + ctmE(ctmText(cfg.title, catsAll.length, ctx)) + '</h2></div><p class="uo-hint">' + ctmE(ctmText(cfg.hint, ctx) || 'Mỗi ô ghi rõ đơn vị cung cấp và kỳ số liệu · bấm ô để mở chi tiết') + '</p></div>';
  if (kpis.length) h += '<div class="uo-kscroll"><div class="uo-kpis" style="grid-template-columns:repeat(' + kpis.length + ',minmax(118px,1fr))">' + kpis.join('') + '</div></div>';
  if (G.length) {
    h += '<div class="uo-secrow"><div class="stc-sec">' + ctmE(cfg.groupTitle || (ctmCountWord(G.length) + ' nhóm ' + w + ' · bấm một nhóm để lọc danh sách bên dưới')) + '</div><button type="button" class="uo-all' + (g ? '' : ' on') + '" onclick="ctmOvPick(' + ctmJs(cfg.id) + ',\'all\')">Tất cả ' + catsAll.length + ' ' + w + '</button></div>';
    h += '<div class="uo-groups ctm-g' + G.length + '">' + G.map((x) => ctmOvGroup(cfg, x, catsAll)).join('') + '</div>';
  }
  h += '</section><div class="uo-secrow uo-gridhead"><div class="stc-sec">' + (g ? ctmE(ctmOvRn(cfg, g.label)) + ' · ' : '') + shown.length + ' ' + w + ' · bấm thẻ để xem chi tiết</div></div>';
  h += shown.length ? '<div class="uo-grid">' + shown.map((c) => ctmOvCard(cfg, c)).join('') + '</div>' : '<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>';
  return h + '</div>';
}
/* Băng tổng quan cho tài khoản đăng nhập riêng MỘT đơn vị (lưới chỉ có 1 lĩnh vực — tài khoản ban của xã/phường, tài khoản sở):
   ô số chính + thẻ nhóm + thẻ xã/phường, rộng cả hàng lưới, bấm mở thẳng đúng màn của phần chi tiết (như băng của TT Phục vụ HCC). */
function ctmBandHtml(cat) {
  const spec = CTM_SPECS[cat.id];
  if (!spec) return '';
  const n = ctmNP(spec), open = (t) => "openCategoryDetail('" + cat.role + "','" + cat.id + "'," + ctmJs(t || 'home') + ')';
  let h = '<div class="field-category-card so-item-card stc-overview-band" style="grid-column:1/-1"><div class="stc-root sgd-root ctm-root" style="background:transparent;overflow:visible">';
  h += '<div class="stc-gh" style="margin-bottom:12px"><h4 style="margin:0">Tổng quan · ' + ctmE(ctmName(spec)) + '</h4><button type="button" class="stc-gmore" style="background:none;border:0;cursor:pointer;padding:0;font:inherit" onclick="' + open('home') + '">Xem tổng quan đầy đủ ›</button></div>';
  h += '<div class="stc-kpis" style="--ctm-k:' + Math.min(8, spec.kpis.length) + '">' + spec.kpis.map((k) => ctmKpiTile(spec, k, n, open(k.target))).join('') + '</div>';
  const G = spec.groups || [];
  h += '<div class="stc-sec" style="margin:4px 0 12px">' + ctmCountWord(G.length) + ' nhóm chỉ tiêu · mỗi nhóm một màn hình</div>';
  h += '<div class="sgd-g3">' + (spec.rec ? ctmRecCard(spec, n, open('rec')) : '') + G.map((g) => ctmGroupCard(spec, g, n, open('g:' + g.id))).join('') + (spec.xa ? ctmXaCard(spec, open('xa')) : '') + '</div>';
  h += '<p class="cpi-legend" style="margin:10px 0 0;font-size:11px">' + ctmE(ctmPLabel(spec, n.p) + (ctmOrg(spec) ? ' · ' + ctmOrg(spec) : '')) + '</p>';
  return h + '</div></div>';
}

/* ============================== KHAI BÁO GỌN: ctmMake ==============================
   Dùng cho đa số đơn vị (số ước tính theo quy mô): mỗi chỉ tiêu một dòng, phần màn nhóm và bảng xã/phường tự dựng.
   ctmMake({
     id, role, name, org, short, per: 'nam' (5 năm 2021–2025) | 'quy' (6 quý 1/2025–2/2026),
     m: {
       khóa: [nhãn, đơn vị, số lẻ, SỐ KỲ MỚI NHẤT, mức đổi mỗi kỳ, 'cờ', nhãn ngắn],   // mức đổi: % (đơn vị '%' thì là điểm %);
                                                                                 // cờ: i = giảm là tốt, n = trung tính
       khóa: [nhãn, đơn vị, số lẻ, [số từng kỳ, mới nhất trước], 0, 'cờ', nhãn ngắn],   // số thật / số đã chốt từng kỳ
       khóa: { l, u, d, sum: [khóa…] } | { l, u, d, f: (D) => số }                    // tính từ chỉ tiêu khác
     },
     kpis: [khóa | [khóa, 'dòng phụ' | (D, P) => chuỗi]],   // tự trỏ tới nhóm có chỉ tiêu đó
     groups: [{ id, label, note, lines: [khóa…], parts: [tổng, [phần…], tiêu đề], table: [tổng|null, [dòng…], tiêu đề, cột đầu],
                rates: [[khóa %…], tiêu đề], cols: khóa, cols2: khóa, top: chỉ tiêu xã, hint }],
     xa: [{ id, l, u, d, better, from: khóa (chia số Thành phố), k: hệ số phần thuộc cấp xã, w: 'pop'|'xa'|'pho'|'ho'|'dt' }
          | { id, …, per: [chỉ tiêu xã, 'ds'|'ho', nhân] } | { id, …, pct: [tử, mẫu] } | { id, …, rate: khóa %, spread: điểm }],
     card, note, xaNote
   }) */
const CTM_PER = {
  nam: ['2025', '2024', '2023', '2022', '2021'].map((y) => ({ id: y, label: 'Năm ' + y, short: y })),
  quy: [['2026', 2], ['2026', 1], ['2025', 4], ['2025', 3], ['2025', 2], ['2025', 1]].map((x) => ({ id: x[0] + 'Q' + x[1], label: 'Quý ' + x[1] + '/' + x[0], short: 'Q' + x[1] + '/' + x[0].slice(2) }))
};
function ctmRound(v, d) { if (v == null || !isFinite(v)) return null; const p = Math.pow(10, d || 0); return Math.round(v * p) / p; }
/* Chuỗi số các kỳ (mới nhất trước) từ số kỳ mới nhất và mức đổi mỗi kỳ, nhiễu nhỏ cố định theo hạt giống. */
function ctmSeries(seed, now, g, n, d, isPct) {
  const out = [now];
  for (let i = 1; i < n; i++) {
    const r = ctmRng(seed + '|' + i)() - 0.5;
    let v = isPct ? now - g * i + r * Math.max(0.3, Math.abs(g)) * 0.8 : now / Math.pow(1 + g / 100, i) * (1 + r * 0.03);
    if (isPct) v = Math.max(0, Math.min(100, v));
    out.push(ctmRound(v, d));
  }
  return out;
}
function ctmXaW(u, w) {
  if (w === 'xa') return u.ds * (u.k === 'X' ? 1.4 : 0.75);
  if (w === 'pho') return u.ds * (u.k === 'P' ? 1.4 : 0.75);
  if (w === 'ho') return u.ho;
  if (w === 'dt') return u.dt;
  if (w === 'const') return 1;
  return u.ds;
}
function ctmMake(def) {
  const periods = def.periods || CTM_PER[def.per || 'nam'], N = periods.length;
  const metrics = {}, base = {}, comp = [];
  Object.keys(def.m).forEach((k) => {
    const x = def.m[k];
    if (Array.isArray(x)) {
      const fl = x[5] || '';
      metrics[k] = { l: x[0], u: x[1], d: x[2] || 0, short: x[6], inv: fl.indexOf('i') >= 0, neutral: fl.indexOf('n') >= 0, ck: fl.indexOf('k') >= 0, td: fl.indexOf('t') >= 0, plan: fl.indexOf('p') >= 0 };
      base[k] = Array.isArray(x[3]) ? x[3] : ctmSeries(def.id + '|' + k, x[3], x[4] || 0, N, x[2] || 0, x[1] === '%');
    } else {
      metrics[k] = { l: x.l, u: x.u, d: x.d || 0, short: x.short, inv: !!x.inv, neutral: !!x.neutral, ck: !!x.ck, td: !!x.td, plan: !!x.plan };
      comp.push([k, x]);
    }
  });
  const data = (pid) => {
    const i = periods.findIndex((p) => p.id === pid);
    if (i < 0) return null;
    const D = {};
    Object.keys(base).forEach((k) => { D[k] = base[k][i] == null ? null : base[k][i]; });
    comp.forEach(([k, x]) => {
      let v = null;
      try { v = x.sum ? x.sum.reduce((s, p) => (s == null || D[p] == null ? null : s + D[p]), 0) : x.f(D, i); } catch (e) { v = null; }
      D[k] = ctmRound(v, x.d || 0);
    });
    return D;
  };
  const grpOf = (k) => (def.groups || []).find((g) => (g.lines || []).indexOf(k) >= 0);
  const xaOf = (k) => (def.xa || []).find((I) => I.from === k);
  const kpis = (def.kpis || []).map((k) => {
    const o = Array.isArray(k) ? { m: k[0], sub: k[1] } : typeof k === 'string' ? { m: k } : Object.assign({}, k);
    if (typeof o.sub === 'string') { const s = o.sub; o.sub = () => s; }
    if (!o.target) { const g = grpOf(o.m), I = xaOf(o.m); o.target = g ? 'g:' + g.id : I ? 'xa:' + I.id : ''; }
    return o;
  });
  let xa = null;
  if (def.xa && def.xa.length) {
    const inds = def.xa.map((I) => {
      const o = Object.assign({ d: 0, better: 'high' }, I);
      o.v = (r) => r[I.id];
      if (I.from) o.tot = true;
      if (I.rate) o.tp = (D) => D[I.rate];
      if (I.per) o.tp = (D, rows) => { const a = rows.reduce((s, r) => s + (r[I.per[0]] || 0), 0), b = rows.reduce((s, r) => s + r.u[I.per[1]], 0); return b ? a / b * I.per[2] : null; };
      if (I.pct) o.tp = (D, rows) => { const a = rows.reduce((s, r) => s + (r[I.pct[0]] || 0), 0), b = rows.reduce((s, r) => s + (r[I.pct[1]] || 0), 0); return b ? a / b * 100 : null; };
      return o;
    });
    xa = {
      label: def.xaLabel || 'Theo 126 xã, phường', inds: inds, note: def.xaNote || 'Tên, loại (phường hay xã), dân số và diện tích của 126 xã, phường là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025; số chỉ tiêu của từng nơi được chia từ số toàn Thành phố theo quy mô dân số.',
      rows: (pid) => {
        const D = data(pid);
        if (!D) return [];
        const rows = CTM_XA.map((u) => ({ u: u }));
        def.xa.forEach((I) => {
          if (I.from) {
            const tot = D[I.from] == null ? null : D[I.from] * (I.k == null ? 1 : I.k);
            if (tot == null) { rows.forEach((r) => { r[I.id] = null; }); return; }
            const w = rows.map((r) => ctmXaW(r.u, I.w) * (0.7 + 0.6 * ctmRng(def.id + '|' + I.id + '|' + r.u.name)()) * (0.95 + 0.1 * ctmRng(def.id + '|' + I.id + '|' + r.u.name + '|' + pid)()));
            const v = (I.d || 0) === 0 ? ctmShareInt(Math.round(tot), w) : ctmShare(tot, w);
            rows.forEach((r, i) => { r[I.id] = v[i]; });
          } else if (I.rate) {
            rows.forEach((r) => { const x = D[I.rate]; r[I.id] = x == null ? null : Math.max(0, Math.min(100, x + (ctmRng(def.id + '|' + I.id + '|' + r.u.name)() - 0.5) * (I.spread || 6) + (ctmRng(def.id + '|' + I.id + '|' + r.u.name + '|' + pid)() - 0.5) * 1.5)); });
            /* chỉnh để 126 xã gộp lại theo dân số đúng bằng tỷ lệ Thành phố (quy tắc H20) */
            const x = D[I.rate];
            if (x != null) {
              for (let it = 0; it < 3; it++) {
                let a = 0, b = 0;
                rows.forEach((r) => { if (r[I.id] != null) { a += r[I.id] * r.u.ds; b += r.u.ds; } });
                const sh = b ? x - a / b : 0;
                if (Math.abs(sh) < 1e-6) break;
                rows.forEach((r) => { if (r[I.id] != null) r[I.id] = Math.max(0, Math.min(100, r[I.id] + sh)); });
              }
            }
          } else if (I.per) {
            rows.forEach((r) => { const a = r[I.per[0]]; r[I.id] = a == null ? null : a / r.u[I.per[1]] * I.per[2]; });
          } else if (I.pct) {
            rows.forEach((r) => { const a = r[I.pct[0]], b = r[I.pct[1]]; r[I.id] = a == null || !b ? null : a / b * 100; });
          }
        });
        return rows;
      }
    };
  }
  return ctmRegister({
    id: def.id, role: def.role, level: def.level || 'city', name: def.name, org: def.org, short: def.short,
    periods: periods, kind: def.per === 'quy' ? 'quý' : 'năm', cmpRef: def.per === 'quy' ? 'quý trước' : 'năm trước',
    data: data, metrics: metrics, kpis: kpis, groups: def.groups || [], xa: xa, card: def.card, cardL: def.cardL, note: def.note, foot: def.foot
  });
}

/* Loại "Theo dõi nhiệm vụ" (VPTU, HĐND, MTTQ): số nhiệm vụ theo 6 trạng thái của hệ thống theo dõi nhiệm vụ, theo khối.
   khoi: [{ id, label, now: [mới tạo, chờ phê duyệt, xin gia hạn, hoàn thành, kết thúc, thu hồi] }] — số kỳ mới nhất (Quý 2/2026). */
const CTM_TASK_ST = [['moi', 'Mới tạo'], ['cho', 'Chờ phê duyệt'], ['gh', 'Xin gia hạn'], ['ht', 'Hoàn thành'], ['kt', 'Kết thúc'], ['th', 'Thu hồi']];
function ctmTaskSpec(def) {
  const m = {}, multi = def.khoi.length > 1, groups = [];
  def.khoi.forEach((K, ki) => {
    const p = K.id + '_';
    CTM_TASK_ST.forEach((s, si) => { m[p + s[0]] = [s[1], 'nhiệm vụ', 0, K.now[si], si === 3 || si === 4 ? 9 : si === 5 ? 4 : 2, si === 5 ? 'i' : 'n', s[1]]; });
    m[p + 'tong'] = { l: multi ? K.label + ' · tổng nhiệm vụ' : 'Tổng nhiệm vụ đang theo dõi', short: multi ? K.label : 'Tổng nhiệm vụ', u: 'nhiệm vụ', sum: CTM_TASK_ST.map((s) => p + s[0]) };
    m[p + 'xong'] = { l: 'Đã hoàn thành, kết thúc', short: 'Hoàn thành, kết thúc', u: 'nhiệm vụ', sum: [p + 'ht', p + 'kt'] };
    m[p + 'dang'] = { l: 'Đang xử lý (mới tạo, chờ phê duyệt, xin gia hạn)', short: 'Đang xử lý', u: 'nhiệm vụ', neutral: true, sum: [p + 'moi', p + 'cho', p + 'gh'] };
    m[p + 'htR'] = { l: 'Tỷ lệ hoàn thành', short: 'Tỷ lệ hoàn thành, kết thúc', u: '%', d: 1, f: (D) => (D[p + 'tong'] ? (D[p + 'ht'] + D[p + 'kt']) / D[p + 'tong'] * 100 : null) };
    m[p + 'thR'] = { l: 'Tỷ lệ thu hồi', u: '%', d: 1, inv: true, f: (D) => (D[p + 'tong'] ? D[p + 'th'] / D[p + 'tong'] * 100 : null) };
    groups.push({ id: K.id, label: K.label, note: 'Nhiệm vụ theo 6 trạng thái của hệ thống theo dõi nhiệm vụ', lines: [p + 'tong', p + 'xong', p + 'dang', p + 'th'],
      parts: [p + 'tong', CTM_TASK_ST.map((s) => p + s[0]), 'Nhiệm vụ theo trạng thái'], rates: [[p + 'htR', p + 'thR'], 'Tỷ lệ hoàn thành, thu hồi'] });
  });
  if (multi) {
    CTM_TASK_ST.forEach((s) => { m['all_' + s[0]] = { l: s[1], short: s[1], u: 'nhiệm vụ', inv: s[0] === 'th', neutral: s[0] !== 'th', sum: def.khoi.map((K) => K.id + '_' + s[0]) }; });
    m.all_tong = { l: 'Tổng nhiệm vụ đang theo dõi', short: 'Tổng nhiệm vụ', u: 'nhiệm vụ', sum: CTM_TASK_ST.map((s) => 'all_' + s[0]) };
    m.all_xong = { l: 'Đã hoàn thành, kết thúc', u: 'nhiệm vụ', sum: ['all_ht', 'all_kt'] };
    m.all_htR = { l: 'Tỷ lệ hoàn thành', u: '%', d: 1, f: (D) => (D.all_tong ? (D.all_ht + D.all_kt) / D.all_tong * 100 : null) };
    groups.unshift({ id: 'all', label: 'Tổng hợp các khối', note: 'Cộng ' + def.khoi.length + ' khối', lines: ['all_tong', 'all_xong', 'all_cho', 'all_th'],
      parts: ['all_tong', def.khoi.map((K) => K.id + '_tong'), 'Nhiệm vụ theo khối'], table: ['all_tong', CTM_TASK_ST.map((s) => 'all_' + s[0]), 'Nhiệm vụ theo trạng thái', 'Trạng thái'] });
  }
  const P = multi ? 'all_' : def.khoi[0].id + '_';
  const kpis = multi
    ? [['all_tong', 'nhiệm vụ đang theo dõi'], ['all_xong', 'hoàn thành, kết thúc'], ['all_htR', 'trên tổng nhiệm vụ'], ['all_cho', 'chờ phê duyệt'], ['all_gh', 'xin gia hạn'], ['all_th', 'nhiệm vụ bị thu hồi']].concat(def.khoi.slice(0, 2).map((K) => [K.id + '_tong', K.label]))
    : [[P + 'tong', 'nhiệm vụ đang theo dõi'], [P + 'xong', 'hoàn thành, kết thúc'], [P + 'htR', 'trên tổng nhiệm vụ'], [P + 'moi', 'mới tạo'], [P + 'cho', 'chờ phê duyệt'], [P + 'gh', 'xin gia hạn'], [P + 'th', 'nhiệm vụ bị thu hồi'], [P + 'thR', 'trên tổng nhiệm vụ']];
  /* số nhiệm vụ lũy kế đến cuối quý là số tại thời điểm (trạng thái cuối quý): so với quý liền trước */
  return ctmTd(ctmMake({ id: def.id, role: def.role, name: def.name, org: def.org, short: def.short, per: 'quy', m: m, kpis: kpis, groups: groups,
    card: multi ? ['all_tong', 'all_xong', 'all_htR', 'all_cho'] : [P + 'tong', P + 'xong', P + 'htR', P + 'cho'],
    note: 'kỳ báo cáo là quý, số nhiệm vụ lũy kế đến cuối quý theo hệ thống theo dõi nhiệm vụ (số tại thời điểm), so với quý liền trước. Số nhiệm vụ mới, chờ, gia hạn tăng hay giảm để màu trung tính; thu hồi tăng là màu đỏ.' }));
}
function ctmTd(spec) { if (spec) Object.keys(spec.metrics).forEach((k) => { spec.metrics[k].td = true; }); return spec; }

function ctmOvPick(cfgId, gid) {
  CTM_OV_PICK[cfgId] = gid === 'all' || CTM_OV_PICK[cfgId] === gid ? 'all' : gid;
  if (typeof renderCategoryGrid === 'function') renderCategoryGrid();
}
