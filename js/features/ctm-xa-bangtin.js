/* ============================== BẢNG TIN CHỈ TIÊU XÃ, PHƯỜNG — BỐ CỤC 2 LỚP, TÙY CHỈNH MÀN NGOÀI ==============================
   Anh duyệt 12/11/2026 (demo docs/DEMO_CHI_TIEU_SON_DONG, bàn giao BAN_GIAO.md): áp cho cả 126 xã, phường; 4 trục, 12 sở giữ màn cũ.
   · Lớp 1 — màn ngoài của tài khoản xã (thay ctmOverviewHtml khi level 'xa'): Số nổi bật (tối đa 12 ô, tự chia hàng) + các khối
     (Số liệu / Một biểu đồ của eform), mỗi tài khoản tự tùy chỉnh, lưu trong trình duyệt theo tài khoản; có Sao chép / Dán bố cục.
   · Lớp 2 — màn eform trong hộp cửa sổ (thay ctmScreenHtml màn 'home' của đơn vị xã): ô số, một danh sách chọn (biểu đồ, rồi nhóm),
     một biểu đồ lớn đổi được kiểu; «Xem bản ghi đã nhập» và phần của biểu đồ mở màn Dữ liệu đã nhập có sẵn (ctmRec) — T2.
   · Mọi số lấy từ bộ tính chỉ tiêu (efPick, efVals, efRecsOf, ctmD…) đúng bản đọc XA_*; chỉ chọn được ô số, chỉ tiêu xã nhập (dòng
     số liệu), biểu đồ đã có trong bản đọc; không trùng số trên một màn (T1); hình tròn chỉ khi eform có dòng "Tổng số" (G6).
   · Màn cũ giữ nguyên: nút «Bố cục cũ» / «Xem bố cục mới» (nhớ theo tài khoản); tắt hẳn bằng cờ XBT_ENABLED = false.
   Nạp SAU ctm-xa-eform.js; cần lib/echarts/echarts.min.js và css/ctm-xa-bangtin.css. */
const XBT_ENABLED = true;
const XBT = { inst: {}, key: {}, charts: [], curEf: null, dlgH: null, seq: 0 };
const XBT_TRUC = { dangxa: 'Đảng ủy', hdndxa: 'HĐND', ubndxa: 'UBND', mttqxa: 'Ủy ban MTTQ' };
function xbtWho() { try { if (typeof currentAccount !== 'undefined' && currentAccount) return currentAccount.user || currentAccount.title || 'guest'; } catch (e) { /* chưa đăng nhập */ } return 'guest'; }
function xbtMode() { try { return localStorage.getItem('ioc-xbt-mode:' + xbtWho()) === 'cu' ? 'cu' : 'moi'; } catch (e) { return 'moi'; } }
function xbtSetMode(m) {
  try { localStorage.setItem('ioc-xbt-mode:' + xbtWho(), m === 'cu' ? 'cu' : 'moi'); } catch (e) { /* không lưu được: chỉ đổi lần này */ }
  if (typeof renderCategoryGridContent === 'function') renderCategoryGridContent();
  if (typeof CTM_UI !== 'undefined' && CTM_UI.open && typeof ctmRerender === 'function') ctmRerender(false);
}
/* phần tử đọc màu theo giao diện IOC (Tối / Sáng / Xanh lá) khi trang chưa có .xbt-root */
function xbtProbe() {
  let p = document.getElementById('xbt-probe');
  if (!p) { p = document.createElement('div'); p.id = 'xbt-probe'; p.className = 'stc-root xbt-root'; p.setAttribute('aria-hidden', 'true'); p.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'; document.body.appendChild(p); }
  return p;
}
function xbtDlg() {
  if (typeof document === 'undefined' || !document.createElement) return { hidden: true, innerHTML: '', querySelector: () => null, addEventListener: () => {} }; /* chạy kiểm thử không có trình duyệt */
  let d = document.getElementById('xbt-dlg');
  if (!d) {
    d = document.createElement('div'); d.id = 'xbt-dlg'; d.className = 'stc-root xbt-root'; d.hidden = true; document.body.appendChild(d);
    ['change', 'input', 'compositionend', 'click', 'keydown'].forEach((t) => d.addEventListener(t, (ev) => { if (XBT.dlgH && XBT.dlgH[t]) XBT.dlgH[t](ev); }));
  }
  return d;
}
function xbtSpecs(roles) { return Object.keys(CTM_SPECS).filter((k) => { const s = CTM_SPECS[k]; return s.level === 'xa' && s.efDonVi && s.enabled !== false && (!roles || roles.indexOf(s.role) >= 0); }); }
function xbtSidOfSlug(slug) { return xbtSpecs(null).find((k) => CTM_SPECS[k].kyDef.eforms[0].ef === 'xa_' + slug) || null; }
function xbtXaName() {
  try { if (typeof currentXaId !== 'undefined' && currentXaId != null && typeof wardNames === 'function') { const n = wardNames()[+currentXaId]; if (n) return n; } } catch (e) { /* không lấy được tên xã */ }
  return 'Xã, phường';
}

/* ---------- Số của các eform xã trong kỳ đang xem (cùng cấu trúc bản demo, lấy từ bộ tính chỉ tiêu) ----------
   per: 5 kỳ gần nhất tính đến kỳ cur (cũ trước); khóa bản ghi (efKey…) thay cho danh sách bản ghi. */
function xbtData(sids, cur) {
  const s0 = CTM_SPECS[sids[0]], plist = s0.periods, at = Math.max(0, plist.findIndex((p) => p.id === cur));
  const per = plist.slice(at, at + 5).reverse(), prev = ctmPrevId(s0, plist[at].id);
  const out = { xaName: xbtXaName(), periods: per.map((p) => ({ id: p.id, label: p.label, short: p.short })), cur: plist[at].id, prev: prev, eforms: [] };
  const r1 = (v) => (v == null || !isFinite(v) ? null : Math.round(v * 10) / 10);
  sids.forEach((sid) => {
    const s = CTM_SPECS[sid], cfg = s.kyDef.eforms[0], ef = EFK[cfg.ef];
    const used = efPick(cfg, out.cur).used, usedP = prev ? efPick(cfg, prev).used : [];
    const unit = (id) => efUnit(cfg, id), val = (rs, id) => (rs.length ? r1(efVals(cfg, rs)[id]) : null), kid = (k) => k.slice(cfg.ef.length + 1);
    const KM = (id) => efKeyM(cfg.ef, id);
    const kpis = s.kpis.map((k) => { const id = kid(k.m), m = s.metrics[k.m] || {}; return { id, l: k.l || m.l, u: m.u, how: efMoTa(cfg, id), vals: per.map((p) => val(efPick(cfg, p.id).used, id)), recs: KM(id) }; });
    const dongs = (rs) => { if (!cfg.dong) return []; const D = cfg.dong, by = {}, o = [];
      rs.forEach((R) => { const path = D.theo.map((c) => [c, R[c] == null ? null : R[c]]), k = cfg.ef + '_d' + xaEfHash(JSON.stringify(path));
        if (!by[k]) { const parts = []; D.theo.forEach((c) => { if (c === cfg.tach || c === cfg.dvt || R[c] == null || R[c] === '' || (D.boNhan || []).indexOf(R[c]) >= 0) return; const t = efLb(ef, c, R[c]); if (parts.indexOf(t) < 0) parts.push(t); });
          const u = cfg.dvt && R[cfg.dvt] != null ? xaEfU(efLb(ef, cfg.dvt, R[cfg.dvt])) : unit(D.m); o.push(by[k] = { k, path, l: parts.join(' · ') || '(trống)', u, rs: [], nh: cfg.tach ? R[cfg.tach] : null }); }
        by[k].rs.push(R); });
      return o; };
    const dKey = (d, m) => efKey(cfg.ef, { m: m, p: d.path });
    const dItem = (d, m) => ({ l: d.l, u: d.u, v: val(d.rs, m), recs: dKey(d, m), k: d.k });
    const charts = (cfg.bieu || []).filter((b) => !b.chiNhom).map((b) => {
      const c = { loai: b.loai, t: b.t };
      if (b.loai === 'ds' || b.loai === 'phan') c.items = b.ms.map((id) => ({ l: s.metrics[cfg.ef + '_' + id] ? s.metrics[cfg.ef + '_' + id].l : cfg.chi[id].l, u: unit(id), v: val(used, id), recs: KM(id) }));
      else if (b.loai === 'cot' || b.loai === 'chong') { c.m = cfg.chi[b.m].l; c.u = unit(b.m); c.theo = ef.F[b.theo].l; c.items = efGroup(used, b.theo).map((g) => ({ l: efLb(ef, b.theo, g[0]), v: val(g[1], b.m), recs: efKey(cfg.ef, { m: b.m, p: [[b.theo, g[0]]] }) })).filter((x) => x.v != null).sort((a, z) => z.v - a.v); }
      else if (b.loai === 'dong') { const m = b.m || cfg.dong.m; c.m = cfg.chi[m].l; c.items = dongs(used).map((d) => dItem(d, m)).filter((x) => x.v != null); c.tang = !!b.tang; }
      else if (b.loai === 'xu') { c.m = s.metrics[cfg.ef + '_' + b.m] ? s.metrics[cfg.ef + '_' + b.m].l : cfg.chi[b.m].l; c.u = unit(b.m); c.items = per.map((p) => ({ l: p.short, v: val(efPick(cfg, p.id).used, b.m), recs: p.id + '\u0001' + KM(b.m) })); }
      return c;
    });
    const n = { p: out.cur, pp: prev, D: ctmD(s, out.cur) || {}, P: prev ? ctmD(s, prev) : null };
    const nhom = (s.groups || []).filter((g) => g.id.indexOf(':') > 0).map((g) => {
      const v = g.id.split(':')[1], rs = used.filter((R) => R[cfg.tach] === v);
      const keys = ctmGLines(g, n), D = n.D, Pv = n.P || {}, dmap = {}; dongs(rs).forEach((d) => { dmap[d.k] = d; });
      const lines = keys.map((k) => { const m = s.metrics[k] || { l: k }, id = kid(k).split('@')[0];
        return { l: m.l, u: m.u, cur: r1(D[k]), prev: r1(Pv[k]), recs: dmap[k] ? dKey(dmap[k], cfg.dong.m) : cfg.chi[id] ? efKey(cfg.ef, { m: id, p: [[cfg.tach, v]] }) : '' }; });
      return { v, l: g.label, n: rs.length, lines, dongs: cfg.dong ? dongs(rs).map((d) => dItem(d, cfg.dong.m)).filter((x) => x.v != null) : [] };
    });
    const nhL = {}; if (cfg.tach) (ef.F[cfg.tach].dm || []).forEach((o) => { nhL[o.v] = o.l; });
    const dAll = {}, dl = [];
    if (cfg.dong) per.forEach((p, pi) => { dongs(efPick(cfg, p.id).used).forEach((d) => { let o = dAll[d.k]; if (!o) { o = dAll[d.k] = { k: d.k, l: d.l, u: d.u, nh: d.nh, nhL: d.nh != null ? (nhL[d.nh] || String(d.nh)) : '', vals: per.map(() => null), recs: dKey(d, cfg.dong.m) }; dl.push(o); } o.vals[pi] = val(d.rs, cfg.dong.m); }); });
    out.eforms.push({ sid, ef: cfg.ef, truc: XBT_TRUC[sid.split('-')[0]] || '', ten: ef.ten, banGhi: cfg.banGhi, luuY: cfg.luuY || '', tach: cfg.tach ? ef.F[cfg.tach].l : null, used: used.length, kpis, charts, nhom, dl });
  });
  return out;
}

/* ---------- Một bản bảng tin (bố cục demo) trên số của xã đang xem ---------- */
function xbtMake(DATA, OV) {
  'use strict';
  const IID = 'xbt' + (++XBT.seq);
  const FONT = '"Be Vietnam Pro", system-ui, sans-serif';
  const P = DATA.periods, CI = P.findIndex((p) => p.id === DATA.cur), PI = P.findIndex((p) => p.id === DATA.prev);
  const KY = P[CI].label, KYP = P[PI].label.toLowerCase();
  const EFS = DATA.eforms, BY = {}; EFS.forEach((e) => { BY[e.ef] = e; e.slug = e.ef.slice(3); e.dl = e.dl || []; e.dlBy = {}; e.dl.forEach((d) => { e.dlBy[d.k] = d; }); });
  const NF = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
  const NF1 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fv = (v, u) => (v == null ? '—' : NF.format(v) + (u === '%' ? '%' : ''));
  const fu = (v, u) => fv(v, u) + (v != null && u && u !== '%' ? ' ' + u : '');
  const unitSmall = (u) => (u && u !== '%' ? '<small>' + esc(u) + '</small>' : '');
  const pc = (v) => NF1.format(v) + '%';
  const delta = (a, b, u) => {
    if (a == null || b == null) return '<span class="delta">' + (b == null ? 'kỳ trước chưa có số' : '') + '</span>';
    if (a === b) return '<span class="delta">không đổi so với ' + KYP + '</span>';
    const up = a > b, txt = u === '%' ? NF1.format(Math.abs(a - b)) + ' điểm %' : b ? pc(Math.abs((a - b) / b * 100)) : NF.format(Math.abs(a - b));
    return '<span class="delta"><i aria-hidden="true">' + (up ? '▲' : '▼') + '</i>' + (up ? 'tăng ' : 'giảm ') + txt + ' so với ' + KYP + '</span>';
  };
  const ARR = '<svg style="flex:none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const BACK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  const CHEV = '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const kp = (ef, id) => BY[ef].kpis.find((k) => k.id === id);

  /* ---------- màu theo chủ đề ---------- */
  let C = {};
  const readC = () => { const s = getComputedStyle(xbtProbe()), o = {}; ['surface', 'surface-2', 'line', 'line-2', 'fg', 'fg-2', 'fg-3', 'accent', 's1', 's2', 's3', 's4', 's5'].forEach((k) => { o[k.replace('-', '')] = s.getPropertyValue('--' + k).trim(); }); return o; };
  const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
  const tipBase = () => ({ backgroundColor: C.surface, borderColor: C.line, borderWidth: 1, padding: [6, 10], confine: true, textStyle: { color: C.fg, fontFamily: FONT, fontSize: 12 }, extraCssText: 'box-shadow:0 4px 14px rgba(0,0,0,.14);border-radius:8px;max-width:320px;white-space:normal;' });
  const axisLbl = () => ({ color: C.fg3, fontFamily: FONT, fontSize: 11.5 });
  const HINT = () => '';

  /* ---------- biểu đồ ---------- */
  let PEND = [], seq = 0;
  const chart = (opt, click, h) => { const id = IID + 'c' + (++seq); PEND.push({ id, opt, click }); return '<div class="chart" id="' + id + '" style="height:' + (h || 260) + 'px"></div>'; };
  const mountCharts = () => { XBT.charts = XBT.charts.filter((c) => { if (c.isDisposed()) return false; if (!document.body.contains(c.getDom())) { c.dispose(); return false; } return true; }); PEND.forEach((p) => { const el = document.getElementById(p.id); if (!el || !window.echarts) return; const c = echarts.init(el); c.setOption(Object.assign({ animationDuration: 450, textStyle: { fontFamily: FONT } }, p.opt())); if (p.click) c.on('click', p.click); XBT.charts.push(c); }); PEND = []; };
  const LW = () => Math.round(Math.max(110, Math.min(250, window.innerWidth * 0.3)));

  const spark = (vals, u, kind) => () => ({
    grid: { left: 2, right: 2, top: 10, bottom: 2 },
    xAxis: { type: 'category', data: P.map((p) => p.label), show: false, boundaryGap: kind === 'bar' },
    yAxis: { type: 'value', show: false, scale: kind !== 'bar' },
    tooltip: Object.assign(tipBase(), { trigger: 'axis', axisPointer: { type: kind === 'bar' ? 'shadow' : 'line', lineStyle: { color: C.line2 }, shadowStyle: { color: rgba(C.fg3, .08) } }, formatter: (p) => p[0].name + '<br><b>' + fu(p[0].value, u) + '</b>' }),
    series: [kind === 'bar'
      ? { type: 'bar', barWidth: '56%', data: vals.map((v, i) => ({ value: v, itemStyle: { color: i === CI ? C.s1 : rgba(C.s1, .32), borderRadius: [3, 3, 0, 0] } })) }
      : { type: 'line', data: vals, smooth: .3, showSymbol: true, symbol: 'circle', symbolSize: (v, p) => (p.dataIndex === CI ? 9 : 5), lineStyle: { width: 2, color: C.s1 }, itemStyle: { color: C.s1, borderColor: C.surface, borderWidth: 2 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: rgba(C.s1, .28) }, { offset: 1, color: rgba(C.s1, 0) }]) } }]
  });
  const hbar = (items, wide, noHint) => () => ({
    grid: { left: 4, right: 70, top: 4, bottom: 4, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: { type: 'category', inverse: true, data: items.map((x) => x.l), axisLine: { show: false }, axisTick: { show: false }, axisLabel: Object.assign(axisLbl(), { color: C.fg2, width: wide ? Math.round(Math.max(130, Math.min(380, window.innerWidth * 0.34))) : LW(), overflow: 'break', lineHeight: 14 }) },
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => { const x = items[q.dataIndex]; return esc(x.full || x.l) + '<br><b>' + fu(x.v, x.u) + '</b>' + (noHint ? '' : HINT()); } }),
    series: [{ type: 'bar', barWidth: 14, data: items.map((x) => x.v), itemStyle: { color: C.s1, borderRadius: [0, 4, 4, 0] }, showBackground: true, backgroundStyle: { color: rgba(C.fg3, .08), borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', color: C.fg, fontWeight: 600, fontSize: 11.5, formatter: (q) => fu(items[q.dataIndex].v, items[q.dataIndex].u) } }]
  });
  const cols = (items, u) => () => ({
    grid: { left: 8, right: 8, top: 24, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: items.map((x) => x.l), axisLine: { lineStyle: { color: C.line2 } }, axisTick: { show: false }, axisLabel: axisLbl() },
    yAxis: { type: 'value', axisLabel: Object.assign(axisLbl(), { formatter: (v) => NF.format(v) }), splitLine: { lineStyle: { color: C.line, type: [3, 3] } } },
    tooltip: Object.assign(tipBase(), { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: rgba(C.fg3, .08) } }, formatter: (p) => P[p[0].dataIndex].label + '<br><b>' + fu(p[0].value, u) + '</b>' + HINT() }),
    series: [{ type: 'bar', barWidth: '50%', data: items.map((x, i) => ({ value: x.v, itemStyle: { color: i === CI ? C.s1 : rgba(C.s1, .34), borderRadius: [4, 4, 0, 0] } })),
      label: { show: true, position: 'top', color: C.fg, fontWeight: 600, fontSize: 11.5, formatter: (q) => (q.dataIndex === CI ? fv(q.value, u) : '') } }]
  });
  const hH = (n) => Math.max(90, n * 36 + 12);
  const clean = (l, nh) => { const seen = [], out = []; String(l).split(/ · | — /).forEach((p) => { const k = p.trim().toLowerCase(), n0 = String(nh || '').toLowerCase(); if (!k || k === n0 || k === n0.replace(/^\d+\.\s*/, '') || seen.indexOf(k) >= 0) return; seen.push(k); out.push(p.trim()); }); return out.join(' · ') || l; };
  const vw = (arr, unitIn) => Math.max(56, Math.max.apply(null, arr.map((x) => (unitIn ? fu(x.v, x.u) : fv(x.v, x.u)).length)) * 8 + 12);
  const dlRows = (e, top, t, unitIn, noClick) => { const mx = Math.max.apply(null, top.map((x) => Math.abs(x.v))) || 1; return top.map((x) => { const inner = '<span class="dl-l">' + esc(x.l) + '</span><span class="dl-b' + (top.length < 2 ? ' dl-0' : '') + '"><i style="width:' + (Math.abs(x.v) / mx * 100).toFixed(1) + '%"></i></span><span class="dl-v">' + (unitIn ? fu(x.v, x.u) : fv(x.v, x.u)) + '</span>';
    return noClick ? '<div class="dl-r dl-st" title="' + esc(x.full || x.l) + '">' + inner + '</div>' : '<button type="button" class="dl-r" title="' + esc(x.full || x.l) + '" data-r="' + recBtn(e, x.recs || [], (x.full || x.l) + ' · ' + KY, t) + '">' + inner + '</button>'; }).join(''); };
  const byUnit = (its) => { const by = {}, ord = []; its.forEach((x) => { const u = x.u || ''; if (!by[u]) { by[u] = []; ord.push(u); } by[u].push(x); }); return ord.map((u) => [u, by[u]]); };

  /* ---------- Dữ liệu đã nhập: mở màn có sẵn của IOC (ctmRec) — chỉ từ màn eform (T2) ----------
     khóa: khóa chỉ tiêu / dòng số liệu (efKey, efKeyM); 'kỳ\u0001khóa' cho cột qua các kỳ; 'ALL' = mọi bản ghi của kỳ */
  const openRec = (e, key) => {
    if (!key || OV !== 'modal' || XBT.curEf !== e.sid) return;
    if (key === 'ALL') { ctmRec(null); return; }
    const p = String(key).indexOf('\u0001');
    if (p > 0) ctmRecAt(key.slice(0, p), key.slice(p + 1)); else ctmRec(key);
  };
  const REC = {}; let recSeq = 0;
  const recBtn = (e, idx) => { const k = 'r' + (++recSeq); REC[k] = () => openRec(e, idx); return k; };

  /* ---------- dạng biểu đồ ---------- */
  const ring = (v) => () => ({
    series: [{ type: 'gauge', startAngle: 90, endAngle: -270, min: 0, max: 100, radius: '92%', pointer: { show: false }, progress: { show: true, roundCap: true, width: 13, itemStyle: { color: C.s1 } },
      axisLine: { lineStyle: { width: 13, color: [[1, rgba(C.fg3, .14)]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      data: [{ value: Math.min(100, v) }], detail: { offsetCenter: [0, 0], formatter: () => pc(v), color: C.fg, fontSize: 24, fontWeight: 700, fontFamily: FONT } }]
  });
  const area = (items, u, big) => () => ({
    grid: big ? { left: 8, right: 16, top: 30, bottom: 4, containLabel: true } : { left: 6, right: 6, top: 12, bottom: 2 },
    xAxis: { type: 'category', data: items.map((x) => x.l), show: !!big, boundaryGap: false, axisLine: { lineStyle: { color: C.line2 } }, axisTick: { show: false }, axisLabel: axisLbl() },
    yAxis: { type: 'value', show: !!big, scale: true, axisLabel: Object.assign(axisLbl(), { formatter: (v) => NF.format(v) }), splitLine: { lineStyle: { color: C.line, type: [3, 3] } } },
    tooltip: Object.assign(tipBase(), { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: C.line2 } }, formatter: (p) => P[p[0].dataIndex].label + '<br><b>' + fu(p[0].value, u) + '</b>' + (big ? HINT() : '') }),
    series: [{ type: 'line', data: items.map((x) => x.v), smooth: .3, symbol: 'circle', symbolSize: (v, p) => (p.dataIndex === CI ? 11 : 7), lineStyle: { width: 3, color: C.s1 }, itemStyle: { color: C.s1, borderColor: C.surface, borderWidth: 2 },
      label: { show: !!big, position: 'top', color: C.fg, fontWeight: 600, fontSize: 11.5, formatter: (q) => fv(q.value, u) },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: rgba(C.s1, .32) }, { offset: 1, color: rgba(C.s1, 0) }]) } }]
  });
  const vcols = (items, u, hi) => () => ({
    grid: { left: 8, right: 8, top: 26, bottom: 4, containLabel: true },
    xAxis: { type: 'category', data: items.map((x) => x.l), axisLine: { lineStyle: { color: C.line2 } }, axisTick: { show: false }, axisLabel: Object.assign(axisLbl(), { color: C.fg2, interval: 0, width: 110, overflow: 'break' }) },
    yAxis: { type: 'value', show: false },
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => esc(q.name) + '<br><b>' + fu(q.value, u) + '</b>' + HINT() }),
    series: [{ type: 'bar', barMaxWidth: 54, data: items.map((x, i) => ({ value: x.v, itemStyle: { color: hi == null || i === hi ? C.s1 : rgba(C.s1, .34), borderRadius: [6, 6, 0, 0] } })), label: { show: true, position: 'top', color: C.fg, fontWeight: 600, fontSize: 12, formatter: (q) => fv(q.value, u) } }]
  });
  const PAL = () => [C.s1, C.s2, C.s3, C.s4, C.s5];
  const donut = (items, u, total, totalL, small) => () => ({
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => esc(q.name) + '<br><b>' + fu(q.value, u) + '</b> (' + pc(q.percent) + ')' + (small ? '' : HINT()) }),
    title: { text: fv(total), subtext: small ? '' : totalL, left: 'center', top: small ? '40%' : '38%', textStyle: { color: C.fg, fontSize: small ? 20 : 26, fontWeight: 700, fontFamily: FONT }, subtextStyle: { color: C.fg3, fontSize: 11.5, fontFamily: FONT } },
    series: [{ type: 'pie', radius: small ? ['58%', '86%'] : ['50%', '72%'], center: ['50%', '50%'], padAngle: 2, itemStyle: { borderRadius: 5, borderColor: C.surface, borderWidth: 2 },
      label: small ? { show: false } : { show: true, color: C.fg2, fontFamily: FONT, fontSize: 12, formatter: (q) => q.name + '\n' + fv(q.value) + ' · ' + pc(q.percent), lineHeight: 16 }, labelLine: { lineStyle: { color: C.line2 } },
      data: items.map((x, i) => ({ name: x.l, value: x.v, itemStyle: { color: PAL()[i % 5] } })) }]
  });
  const funnel = (items) => () => ({
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => esc(q.name) + '<br><b>' + fv(q.value) + '</b>' + HINT() }),
    series: [{ type: 'funnel', sort: 'none', left: '4%', right: '4%', top: 6, bottom: 6, minSize: '18%', gap: 4, label: { show: true, position: 'inside', color: '#fff', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, formatter: (q) => q.name + ' · ' + fv(q.value), textBorderColor: 'rgba(0,0,0,.35)', textBorderWidth: 2 },
      itemStyle: { borderColor: C.surface, borderWidth: 2, borderRadius: 4 }, data: items.map((x, i) => ({ name: x.l, value: x.v, itemStyle: { color: rgba(C.s1, 1 - i * .12) } })) }]
  });
  const dshort = (a, b, u) => { if (a == null || b == null || a === b) return ''; const up = a > b, t = u === '%' ? NF1.format(Math.abs(a - b)) + ' điểm' : b ? pc(Math.abs((a - b) / b * 100)) : NF.format(Math.abs(a - b)); return '<span class="delta"><i aria-hidden="true">' + (up ? '▲' : '▼') + '</i>' + t + '</span>'; };
  const xuOf = (e, id) => { const k = kp(e.ef, id); return P.map((p, i) => ({ l: p.short, v: k.vals[i] })); };

  /* ---------- Lớp 1: bảng tin xã, tùy chỉnh được (lưu theo tài khoản trong trình duyệt) ---------- */
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (er) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (er) { /* trình duyệt chặn lưu: vẫn dùng được, không nhớ */ } };
  const LKEY = () => 'ioc-xbt-layout:' + xbtWho() + ':' + OV;
  const DEF = { rings: [['xa_tcns', 'tlThu'], ['xa_tcns', 'tlChi'], ['xa_gpmb', 'tlTh'], ['xa_gpmb', 'tlBg']], blocks: [
    { t: 'so', ef: 'xa_hcc', m: 'tuyen', s: ['tt', 'dh', 'dqh'], h: 'so', z: 'm' },
    { t: 'bd', ef: 'xa_qlvb', c: 0, k: 'lolli', z: 'm' },
    { t: 'bd', ef: 'xa_gd', c: 0, k: 'tron', z: 'm' },
    { t: 'bd', ef: 'xa_hdnd', c: 2, k: 'polar', z: 'm' },
    { t: 'bd', ef: 'xa_mttq', c: 0, k: 'lolli', z: 's' }, { t: 'bd', ef: 'xa_gd', c: 2, k: 'thanh100', z: 's' }, { t: 'bd', ef: 'xa_ktxh', c: 0, z: 's' },
    { t: 'bd', ef: 'xa_yte', c: 0, z: 's' }, { t: 'bd', ef: 'xa_nv', c: 2, k: 'polar', z: 's' }, { t: 'bd', ef: 'xa_vh', c: 0, k: 'lolli', z: 's' }] };
  /* bố cục mặc định chỉ giữ eform tài khoản được xem (màn ngoài từng trục) */
  const defFor = () => valid({ rings: DEF.rings.filter((r) => BY[r[0]]), blocks: DEF.blocks.filter((b) => BY[b.ef]) });
  const WARN = ['xa_hcc:qh', 'xa_hcc:dqh', 'xa_qlvb:chuaXl'];
  /* Số lớn ở màn ngoài: từ 1 triệu ghi gọn «54,8 tỷ» (H4: tổng hợp được đổi đơn vị cho dễ đọc, ghi rõ; Dữ liệu đã nhập giữ đúng số) */
  const big = (v, u) => { if (v == null) return '—'; if (u === '%') return fv(v, u); const a = Math.abs(v); return a >= 1e9 ? NF1.format(v / 1e9) + '<small class="mag">tỷ</small>' : a >= 1e6 ? NF1.format(v / 1e6) + '<small class="mag">triệu</small>' : fv(v, u); };
  /* Tự chia hàng: số nổi bật chia đều các hàng (tối đa 4 ô/hàng); khối giữ tỷ lệ cỡ đã chọn, hàng chưa đầy thì giãn cho kín (lưới 12 cột) */
  const ringSpans = (n) => { const rows = Math.ceil(n / 4), out = []; let left = n; for (let r = 0; r < rows; r++) { const k = Math.ceil(left / (rows - r)); for (let j = 0; j < k; j++) out.push(12 / k); left -= k; } return out; };
  const ZB = { s: 4, m: 6, l: 12 };
  const blockSpans = (bs) => { const out = [], row = []; let used = 0;
    const flush = () => { if (!row.length) return; const sum = row.reduce((a, i) => a + ZB[bs[i].z], 0); let acc = 0; row.forEach((i, j) => { const sp = j === row.length - 1 ? 12 - acc : Math.round(ZB[bs[i].z] * 12 / sum); acc += sp; out[i] = sp; }); row.length = 0; };
    bs.forEach((b, i) => { const w = ZB[b.z] || 6; if (used + w > 12) { flush(); used = 0; } row.push(i); used += w; }); flush(); return out; };
  let BSP = [];
  const RMAX = 12; /* số ô tối đa ở hàng Số nổi bật */
  const SZ = { s: 'Nhỏ', m: 'Vừa', l: 'Rộng' };
  const HK = { so: 'Chỉ số quý đang xem', vong: 'Vòng tỷ lệ', tiendo: 'Thanh tiến độ', doi: 'Cột quý này – quý trước', duong: 'Diễn biến 5 quý (đường)', cot: 'Diễn biến 5 quý (cột)' };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const chOK = (e, c) => !!(e.charts[c] && (e.charts[c].items || []).some((x) => x.v != null));
  const kindsOf = (k) => (k && k.u === '%' ? ['vong', 'tiendo', 'duong'] : ['so', 'duong', 'cot']);
  /* Một số của quý đang xem: thanh đậm là quý này, thanh nhạt là quý trước (dài ngắn theo số) */
  const cmpBars = (k) => { const a = k.vals[CI], b = k.vals[PI], mx = Math.max(Math.abs(a || 0), Math.abs(b || 0)) || 1;
    const row = (lab, v, on) => '<div class="cb-r' + (on ? ' on' : '') + '"><span class="cb-l">' + esc(lab) + '</span><span class="cb-b"><i style="width:' + (Math.abs(v || 0) / mx * 100).toFixed(1) + '%"></i></span><span class="cb-v">' + fu(v, k.u) + '</span></div>';
    return '<div class="cb" role="img" aria-label="' + esc(k.l) + ': ' + esc(P[CI].label) + ' ' + fu(a, k.u) + ', ' + esc(P[PI].label) + ' ' + fu(b, k.u) + '">' + row(P[CI].label, a, true) + row(P[PI].label, b, false) + '</div>'; };
  /* Một số trên màn ngoài: ô số của bản đọc (id) hoặc một dòng số liệu của eform ('d:' + khóa dòng) — đều là số đã có trong bản đọc */
  const gm = (ef, id) => { const e = BY[ef]; if (!e) return null; if (String(id).indexOf('d:') === 0) { const d = e.dlBy[String(id).slice(2)]; return d ? { id, l: (d.nhL ? d.nhL + ' · ' : '') + clean(d.l, d.nhL), u: d.u, vals: d.vals, recs: d.recs, dong: true } : null; } return kp(ef, id); };
  const dlLabel = (d) => clean(d.l, d.nhL);

  /* ---------- Kiểu hình của biểu đồ: mặc định hợp với dữ liệu, đổi được trong các kiểu hợp lệ ---------- */
  const KN = { lolli: 'Que tròn', polar: 'Thanh vòng', thanh: 'Thanh ngang', cot: 'Cột đứng', tron: 'Tròn', thanh100: 'Thanh 100%', treemap: 'Ô diện tích', duong: 'Đường', pheu: 'Phễu', nhiet: 'Bảng nhiệt', duongnho: 'Đường nhỏ từng dòng' };
  /* Biểu đồ là các phần của một tổng CÓ TRONG EFORM (dòng "Tổng số", bản đọc GD-1) — chỉ chỗ này được vẽ tròn, thanh 100%, ô diện tích (G6) */
  const PARTS = { xa_gd: { 0: 'hs', 1: 'hs', 2: 'hs', 3: 'hs' } };
  const isParts = (e, ci) => !!(PARTS[e.ef] && PARTS[e.ef][ci] != null);
  /* giá trị 5 quý của dòng, chỉ khi biểu đồ vẽ đúng số của dòng đó */
  const dlv = (e, x) => { const d = x && x.k && e.dlBy[x.k]; return d && d.vals && x.v != null && d.vals[CI] != null && Math.abs(d.vals[CI] - x.v) < 0.051 ? d.vals : null; };
  const vkinds = (e, c, ci) => {
    const its = (c.items || []).filter((x) => x.v != null);
    if (c.loai === 'xu') return ['duong', 'cot'];
    if (c.loai === 'dong') return its.length && its.every((x) => dlv(e, x)) ? ['duongnho', 'thanh', 'nhiet'] : ['thanh'];
    if (e.ef === 'xa_gpmb' && c.loai === 'ds' && ci === 0) return ['pheu', 'thanh'];
    if (isParts(e, ci)) return ['tron', 'thanh100', 'treemap', 'thanh', 'cot'];
    return its.length <= 5 ? ['thanh', 'lolli', 'polar', 'cot'] : its.length <= 8 ? ['thanh', 'lolli', 'cot'] : ['thanh', 'lolli'];
  };
  const VDEF = { 'xa_gd#1': 'thanh100', 'xa_gd#2': 'thanh100', 'xa_gd#3': 'treemap' };
  const vdef = (e, c, ci) => {
    const ks = vkinds(e, c, ci), d = VDEF[e.ef + '#' + ci];
    if (d && ks.indexOf(d) >= 0) return d;
    if (c.loai === 'dong') return ci < 0 && ks.indexOf('duongnho') >= 0 ? 'duongnho' : 'thanh';
    if (ks.indexOf('cot') >= 0 && !isParts(e, ci)) { const its = (c.items || []).filter((x) => x.v != null); if (its.length <= 5 && its.every((x) => x.l.length < 34)) return 'cot'; }
    return ks[0];
  };
  const svgSpark = (vals) => {
    const ok = vals.filter((v) => v != null); if (ok.length < 2) return '';
    const W = 120, H = 30, mn = Math.min.apply(null, ok), r = (Math.max.apply(null, ok) - mn) || 1;
    const pts = vals.map((v, i) => (v == null ? null : [(i / (vals.length - 1)) * (W - 8) + 4, H - 4 - ((v - mn) / r) * (H - 8)]));
    const d = pts.filter(Boolean).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), last = pts[CI];
    return '<svg class="spk" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + (last ? '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.2" fill="var(--s1)"/>' : '') + '</svg>';
  };
  const rowWrap = (e, x, t, click, cls, inner) => (click ? '<button type="button" class="' + cls + '" title="' + esc(x.full || x.l) + '" data-r="' + recBtn(e, x.recs || [], (x.full || x.l) + ' · ' + KY, t) + '">' + inner + '</button>' : '<div class="' + cls + '" title="' + esc(x.full || x.l) + '">' + inner + '</div>');
  const smallRows = (e, top, t, click) => '<div class="smr">' + top.map((x) => { const vals = dlv(e, x);
    return rowWrap(e, x, t, click, 'sm-r', '<span class="dl-l">' + esc(x.l) + '</span><span class="sm-c">' + (vals ? svgSpark(vals) : '') + '</span><span class="dl-v">' + fv(x.v, x.u) + '</span><span class="sm-d">' + (vals ? dshort(vals[CI], vals[PI], x.u) : '') + '</span>'); }).join('') + '</div>';
  const heat = (e, top, t, click) => {
    const rows = top.map((x) => ({ x, vals: dlv(e, x) || P.map((p, i) => (i === CI ? x.v : null)) })), all = [];
    rows.forEach((r) => r.vals.forEach((v) => { if (v != null) all.push(v); }));
    const mn = Math.min.apply(null, all), rg = (Math.max.apply(null, all) - mn) || 1;
    return '<div class="hm-wrap"><table class="hm"><thead><tr><th scope="col">Dòng số liệu</th>' + P.map((p, i) => '<th scope="col"' + (i === CI ? ' class="on"' : '') + '>' + esc(p.short) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r) => '<tr><th scope="row">' + (click ? '<button type="button" class="hm-b" title="' + esc(r.x.full || r.x.l) + '" data-r="' + recBtn(e, r.x.recs || [], (r.x.full || r.x.l) + ' · ' + KY, t) + '">' + esc(r.x.l) + '</button>' : esc(r.x.l)) + '</th>' +
        r.vals.map((v, i) => '<td' + (i === CI ? ' class="on"' : '') + ' style="background:' + (v == null ? 'transparent' : rgba(C.s1, (0.07 + 0.5 * (v - mn) / rg).toFixed(2))) + '">' + (v == null ? '—' : fv(v)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div><p class="hint" style="margin:6px 0 0;font-size:12px;color:var(--fg-3)">Ô càng đậm số càng lớn (so trong cùng đơn vị tính). Cột viền là ' + esc(KY.toLowerCase()) + '.</p>';
  };
  const s100 = (e, arr, tot, t, click, lab) => { const pal = PAL();
    return '<div class="s100" role="img" aria-label="' + esc(t) + '">' + arr.map((x, j) => '<i style="flex:' + x.v + ';background:' + pal[j % 5] + '" title="' + esc(x.l) + '"></i>').join('') + '</div><div class="s100l">' +
      arr.map((x, j) => rowWrap(e, Object.assign({}, x, { full: lab(x) }), t, click, 's1r', '<span class="sw" style="background:' + pal[j % 5] + '"></span><span class="s1l">' + esc(x.l) + '</span><b>' + fv(x.v, x.u) + '</b><span class="s1p">' + pc(x.v / tot * 100) + '</span>')).join('') + '</div>'; };
  const tmap = (arr, u, tot) => () => ({
    tooltip: Object.assign(tipBase(), { formatter: (q) => esc(q.name) + '<br><b>' + fu(q.value, u) + '</b> (' + pc(q.value / tot * 100) + ')' }),
    series: [{ type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false }, left: 0, right: 0, top: 0, bottom: 0, itemStyle: { borderColor: C.surface, borderWidth: 2, gapWidth: 2 },
      label: { show: true, color: '#fff', fontFamily: FONT, fontSize: 12.5, fontWeight: 600, lineHeight: 17, formatter: (q) => q.name + '\n' + fv(q.value) + ' · ' + pc(q.value / tot * 100), textBorderColor: 'rgba(0,0,0,.35)', textBorderWidth: 2 },
      data: arr.map((x, i) => ({ name: x.l, value: x.v, itemStyle: { color: PAL()[i % 5] } })) }]
  });
  const lolli = (items) => () => ({
    grid: { left: 4, right: 84, top: 6, bottom: 6, containLabel: true },
    xAxis: { type: 'value', show: false, min: 0 },
    yAxis: { type: 'category', inverse: true, data: items.map((x) => x.l), axisLine: { show: false }, axisTick: { show: false }, axisLabel: Object.assign(axisLbl(), { color: C.fg2, width: LW(), overflow: 'break', lineHeight: 14 }) },
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => { const x = items[q.dataIndex]; return esc(x.full || x.l) + '<br><b>' + fu(x.v, x.u) + '</b>'; } }),
    series: [{ type: 'bar', barWidth: 3, silent: true, data: items.map((x) => x.v), itemStyle: { color: rgba(C.s1, .4), borderRadius: 2 } },
      { type: 'scatter', symbolSize: 15, data: items.map((x, i) => [x.v, i]), itemStyle: { color: C.s1, borderColor: C.surface, borderWidth: 2 }, label: { show: true, position: 'right', distance: 8, color: C.fg, fontWeight: 600, fontSize: 12, formatter: (q) => fu(items[q.dataIndex].v, items[q.dataIndex].u) } }]
  });
  const polarBars = (items) => () => ({
    polar: { radius: ['22%', '92%'] }, angleAxis: { max: Math.max.apply(null, items.map((x) => x.v)) * 1.25 || 1, startAngle: 90, show: false },
    radiusAxis: { type: 'category', data: items.map((x) => x.l), show: false },
    tooltip: Object.assign(tipBase(), { trigger: 'item', formatter: (q) => { const x = items[q.dataIndex]; return esc(x.full || x.l) + '<br><b>' + fu(x.v, x.u) + '</b>'; } }),
    series: [{ type: 'bar', coordinateSystem: 'polar', roundCap: true, barWidth: '62%', data: items.map((x, i) => ({ value: x.v, itemStyle: { color: PAL()[i % 5] } })), showBackground: true, backgroundStyle: { color: rgba(C.fg3, .1) } }]
  });
  const sameU = (a, b) => String(a || '') === String(b || '');
  /* Chỉ tiêu xã nhập: các dòng cùng nhóm, cùng đơn vị tính; không có thì cùng chỉ tiêu ở các nhóm khác */
  const dlSib = (e, d) => {
    let arr = e.dl.filter((x) => x.nh === d.nh && sameU(x.u, d.u) && x.vals[CI] != null);
    if (arr.length > 1) return { t: d.nhL || 'cùng nhóm', items: arr.map((x) => ({ l: dlLabel(x), v: x.vals[CI], me: x.k === d.k })) };
    const name = fold(dlLabel(d));
    arr = e.dl.filter((x) => fold(dlLabel(x)) === name && sameU(x.u, d.u) && x.vals[CI] != null);
    if (arr.length > 1) return { t: dlLabel(d) + ' theo ' + String(e.tach || 'nhóm').toLowerCase(), items: arr.map((x) => ({ l: x.nhL || dlLabel(x), v: x.vals[CI], me: x.k === d.k })) };
    return null;
  };
  /* Các số cùng nhóm trong kỳ đang xem (đều đã có trong bản đọc) để vẽ thanh nhỏ dưới một số */
  const sibOf = (ef, id) => {
    const e = BY[ef]; if (!e) return null;
    if (String(id).indexOf('d:') === 0) { const d = e.dlBy[String(id).slice(2)]; return d ? dlSib(e, d) : null; }
    const k = kp(ef, id); if (!k || k.vals[CI] == null) return null;
    if (PARTS[ef]) { const ci = Object.keys(PARTS[ef]).find((c) => PARTS[ef][c] === id); if (ci != null) { const c = e.charts[+ci]; return { t: c.t, items: c.items.filter((x) => x.v != null).map((x) => ({ l: x.l, v: x.v })), parts: true }; } }
    const c = e.charts.find((x) => (x.loai === 'ds' || x.loai === 'phan') && (x.items || []).some((y) => y.l === k.l));
    if (c) { const arr = c.items.filter((x) => x.v != null).map((x) => ({ l: x.l, v: x.v, me: x.l === k.l })); if (arr.length > 1) return { t: c.t, items: arr }; }
    /* biểu đồ bản đọc chia đúng số này theo một danh mục (cùng trường, cộng các phần = chính số đó) */
    const c3 = e.charts.find((x) => (x.loai === 'cot' || x.loai === 'chong') && x.m === k.l && (x.items || []).length > 1 && Math.abs(x.items.reduce((s2, y) => s2 + (y.v || 0), 0) - k.vals[CI]) <= Math.max(0.5, Math.abs(k.vals[CI]) * 0.002));
    if (c3) return { t: c3.t, items: c3.items.filter((x) => x.v != null).map((x) => ({ l: x.l, v: x.v })), parts: true };
    const kp2 = k.l.split(' · '), kn = kp2[0], kg = kp2[1];
    if (kg) { const c2 = e.charts.find((x) => (x.loai === 'cot' || x.loai === 'chong') && x.m === kn && (x.items || []).some((y) => fold(y.l) === fold(kg)));
      if (c2) return { t: c2.t, items: c2.items.filter((x) => x.v != null).map((x) => ({ l: x.l, v: x.v, me: fold(x.l) === fold(kg) })) }; }
    const d = e.dl.find((x) => x.vals[CI] === k.vals[CI] && fold(k.l).indexOf(fold(dlLabel(x))) >= 0);
    if (d) { const r = dlSib(e, d); if (r) return r; }
    const same = e.kpis.filter((x) => x.id !== 'dong' && x.u && sameU(x.u, k.u) && x.vals[CI] != null);
    if (same.length > 1) return { t: 'các ô số cùng đơn vị (' + k.u + ') của ' + e.ten, items: same.map((x) => ({ l: x.l, v: x.vals[CI], me: x.id === k.id })) };
    return null;
  };
  const miniSib = (sb, n) => {
    let rows = sb.items.slice().sort((a, b) => b.v - a.v); const me = rows.find((x) => x.me);
    rows = rows.slice(0, n); if (me && rows.indexOf(me) < 0) rows[rows.length - 1] = me;
    const mx = Math.max.apply(null, rows.map((x) => Math.abs(x.v))) || 1;
    /* bỏ phần chữ giống nhau ở mọi dòng để thấy chỗ khác nhau (tên đầy đủ khi rê chuột) */
    const tk = rows.map((x) => clean(x.l).split(' · ')), common = (tk[0] || []).filter((t) => tk.every((r) => r.indexOf(t) >= 0));
    rows = rows.map((x, i) => Object.assign({}, x, { s: (tk[i].filter((t) => common.indexOf(t) < 0).join(' · ') || clean(x.l)).split(' · ').map((t) => (t.indexOf(' - ') > 0 ? t.slice(t.lastIndexOf(' - ') + 3) : t)).join(' · ') }));
    return '<div class="msib"><div class="msib-t">' + (sb.parts ? 'Gồm' : 'Trong') + ' «' + esc(sb.t) + '»</div>' + rows.map((x) => '<div class="ms-r' + (x.me ? ' me' : '') + '" title="' + esc(x.l) + ': ' + fv(x.v) + '"><span class="ms-l">' + esc(x.s) + '</span><span class="ms-b"><i style="width:' + (Math.abs(x.v) / mx * 100).toFixed(1) + '%"></i></span><span class="ms-v">' + fv(x.v) + '</span></div>').join('') + '</div>';
  };
  const legendOf = (arr) => '<div class="legend" style="margin-top:8px">' + arr.map((x, j) => '<span><i class="sw" style="background:' + PAL()[j % 5] + '"></i>' + esc(x.l) + ' <b style="color:var(--fg)">' + fv(x.v) + '</b></span>').join('') + '</div>';
  /* Vẽ một biểu đồ của bản đọc theo kiểu đã chọn. mini: khối ở màn ngoài (không mở bản ghi — T2) */
  const viz = (e, c, ci, kind, mini) => {
    const its0 = (c.items || []).filter((x) => x.v != null);
    if (!its0.length) return '<p class="hint" style="padding:24px 0">Kỳ này chưa có số.</p>';
    const click = !mini;
    const open = (arr, lab) => (click ? (q) => { const x = arr[q.dataIndex]; if (x && x.recs && x.recs.length) openRec(e, x.recs, lab(x), c.t); } : null);
    if (c.loai === 'xu') {
      const all = c.items, cl = click ? (q) => { const x = all[q.dataIndex]; if (x && x.recs && x.recs.length) openRec(e, x.recs, c.m + ' · ' + P[q.dataIndex].label, c.t); } : null;
      return (kind === 'cot' ? chart(vcols(all.map((x, i) => ({ l: P[i].short, v: x.v })), c.u, CI), cl, mini ? 170 : 320) : chart(area(all, c.u, !mini), cl, mini ? 160 : 320)) + '<p class="xnote">Diễn biến 5 quý gần nhất · đậm là ' + esc(KY.toLowerCase()) + '</p>';
    }
    if (c.loai === 'dong') {
      const src = (e.ef === 'xa_ktxh' ? its0.map((x) => Object.assign({}, x, { u: '%' })) : its0).map((x) => Object.assign({}, x, { full: x.l, l: clean(x.l, c.nh) }));
      let gs = byUnit(src); if (mini) gs = [gs.slice().sort((a, b) => b[1].length - a[1].length)[0]];
      const N = mini ? 4 : (c.all ? 999 : 10);
      return '<div class="dl" style="--vw:' + vw(src) + 'px">' + gs.map(([u, a0]) => { const arr = a0.slice().sort((a, b) => (c.tang ? a.v - b.v : b.v - a.v)), top = arr.slice(0, N);
        const hd = (gs.length > 1 || u ? 'Đơn vị tính: ' + esc(u || '(trống)') : '') + (arr.length > N && !mini ? (gs.length > 1 || u ? ' · ' : '') + N + ' dòng ' + (c.tang ? 'thấp' : 'lớn') + ' nhất trong ' + arr.length : '');
        const body = kind === 'nhiet' ? heat(e, top, c.t, click) : kind === 'duongnho' ? smallRows(e, top, c.t, click) : dlRows(e, top, c.t, false, !click);
        return (hd ? '<div class="dl-u">' + hd + '</div>' : '') + body; }).join('') + '</div>';
    }
    if (kind === 'pheu') return chart(funnel(its0), open(its0, (x) => x.l), mini ? 230 : 330);
    if (isParts(e, ci)) {
      const tk = kp(e.ef, PARTS[e.ef][ci]), tot = tk.vals[CI], arr = its0.map((x) => Object.assign({ u: c.u }, x)), lab = (x) => c.theo + ': ' + x.l;
      if (kind === 'tron') return chart(donut(arr, c.u, tot, mini ? '' : tk.l, mini), open(arr, lab), mini ? 170 : 330) + (mini ? legendOf(arr) : '');
      if (kind === 'thanh100') return s100(e, arr, tot, c.t, click, lab);
      if (kind === 'treemap') return chart(tmap(arr, c.u, tot), click ? (q) => { const x = arr.find((y) => y.l === q.name); if (x && x.recs && x.recs.length) openRec(e, x.recs, lab(x), c.t); } : null, mini ? 190 : 320);
    }
    const arr = c.loai === 'ds' || c.loai === 'phan' ? its0 : its0.map((x) => Object.assign({ u: c.u }, x));
    const lab = c.loai === 'ds' || c.loai === 'phan' ? (x) => x.l : (x) => c.m + ' · ' + c.theo + ': ' + x.l;
    if (kind === 'cot') return chart(vcols(arr, arr[0].u), open(arr, lab), mini ? 200 : 320);
    if (kind === 'lolli') { const t2 = (mini ? arr.slice().sort((a, b) => b.v - a.v).slice(0, 5) : arr).map((x) => Object.assign({}, x, { l: mini ? clean(x.l) : x.l })); return chart(lolli(t2), open(t2, lab), Math.max(120, t2.length * (mini ? 34 : 40) + 16)); }
    if (kind === 'polar') { const t2 = arr.map((x) => Object.assign({}, x, { l: mini ? clean(x.l) : x.l })); return '<div class="polw">' + chart(polarBars(t2), open(t2, lab), mini ? 190 : 300) + '<div class="s100l">' + t2.map((x, j) => rowWrap(e, Object.assign({}, x, { full: lab(x) }), c.t, click, 's1r', '<span class="sw" style="background:' + PAL()[j % 5] + '"></span><span class="s1l">' + esc(x.l) + '</span><b>' + fu(x.v, x.u) + '</b><span></span>')).join('') + '</div></div>'; }
    const top = mini ? arr.slice().sort((a, b) => b.v - a.v).slice(0, 4) : arr;
    return '<div class="dl" style="--vw:' + vw(top, true) + 'px">' + dlRows(e, top.map((x) => Object.assign({}, x, { full: lab(x), l: mini ? clean(x.l) : x.l })), c.t, true, !click) + '</div>';
  };
  /* Đọc cấu hình (từ trình duyệt hoặc mã dán vào): giữ đúng các trường đã biết; chỉ tiêu không còn trong eform thì đánh dấu, không hiện số sai */
  const valid = (o) => {
    if (!o || typeof o !== 'object' || !Array.isArray(o.blocks)) return null;
    const rings = (Array.isArray(o.rings) ? o.rings : []).filter((r) => Array.isArray(r) && BY[r[0]] && gm(r[0], r[1])).slice(0, RMAX);
    const blocks = o.blocks.slice(0, 30).map((b) => {
      const z = SZ[b && b.z] ? b.z : 'm', e = b && BY[b.ef];
      if (!e) return { t: 'so', ef: String(b && b.ef || ''), m: '', s: [], h: 'cot', z, bad: true };
      if (b.t === 'bd') return { t: 'bd', ef: b.ef, c: +b.c || 0, k: String(b.k || ''), z, bad: !chOK(e, +b.c || 0) };
      const k = gm(b.ef, b.m);
      return { t: 'so', ef: b.ef, m: String(b.m || ''), s: (Array.isArray(b.s) ? b.s : []).filter((id) => gm(b.ef, id) && id !== b.m).slice(0, 3), h: kindsOf(k).indexOf(b.h) >= 0 ? b.h : kindsOf(k)[0], z, bad: !k };
    });
    return { rings, blocks };
  };
  const load = () => { try { const raw = lsGet(LKEY()); if (raw) { const v = valid(JSON.parse(raw)); if (v) return v; } } catch (er) { /* cấu hình hỏng: dùng mặc định */ } return defFor(); };
  let L = load(), HIST = [], EDIT = false, DR = null;
  const strip = (o) => ({ rings: o.rings, blocks: o.blocks.map((b) => { const x = Object.assign({}, b); delete x.bad; return x; }) });
  const saveL = () => lsSet(LKEY(), JSON.stringify(strip(L)));
  const commit = (nl) => { HIST.push(JSON.stringify(L)); if (HIST.length > 50) HIST.shift(); L = nl; saveL(); render(true); };
  /* T1: số, biểu đồ đã dùng ở chỗ khác trên màn thì không chọn lại */
  const usedBy = (skipB, skipRings) => {
    const u = new Set();
    if (!skipRings) L.rings.forEach((r) => u.add(r[0] + ':' + r[1]));
    L.blocks.forEach((b, i) => { if (i === skipB || b.bad) return; if (b.t === 'bd') u.add(b.ef + '#' + b.c); else { u.add(b.ef + ':' + b.m); b.s.forEach((id) => u.add(b.ef + ':' + id)); } });
    return u;
  };

  const blockHtml = (b, i) => {
    const e = BY[b.ef], tag = EDIT ? 'div' : 'a', href = EDIT || !e ? '' : ' href="#' + e.slug + '"';
    const tools = EDIT ? '<div class="btools" role="group" aria-label="Sửa khối ' + (i + 1) + '"><button type="button" data-mv="' + i + ',-1" aria-label="Đưa khối lên trước"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-mv="' + i + ',1" aria-label="Đưa khối ra sau"' + (i === L.blocks.length - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" data-sz="' + i + '">Cỡ: ' + SZ[b.z] + '</button><button type="button" data-edit="' + i + '">Sửa</button><button type="button" data-del="' + i + '">Bỏ</button></div>' : '';
    const head = '<div class="vh"><span class="vt">' + esc(e ? e.ten : 'Eform không còn') + '</span>' + (EDIT ? '' : '<span class="tc-more">Xem' + ARR + '</span>') + '</div>';
    let body;
    if (b.bad) body = '<p class="hint" style="color:var(--fg-2)">Chỉ tiêu đã chọn không còn trong eform. Bấm «Sửa» để chọn lại.</p>';
    else if (b.t === 'bd') {
      const c = e.charts[b.c], ks = vkinds(e, c, b.c), kind = ks.indexOf(b.k) >= 0 ? b.k : vdef(e, c, b.c);
      /* hình trong khối giãn theo chiều cao hàng (biểu đồ lấy chiều cao tối thiểu, phần thừa thì giãn hoặc căn giữa) */
      body = '<div class="tc-label">' + esc(c.t.replace(/ \(.*\)$/, '')) + '</div><div class="vfill">' + viz(e, c, b.c, kind, true).replace(/class="chart" id="([^"]+)" style="height:/g, 'class="chart grow" id="$1" style="min-height:') + '</div>';
    } else {
      const k = gm(b.ef, b.m), v = k.vals[CI], id = 'bk' + i;
      let fig;
      const xuNote = b.h === 'duong' || b.h === 'cot' ? '<p class="xnote">Diễn biến 5 quý gần nhất · đậm là ' + esc(KY.toLowerCase()) + '</p>' : '';
      if (b.h === 'so') fig = '';
      else if (b.h === 'tiendo') fig = '<div class="pbig" role="img" aria-label="' + esc(k.l) + ': ' + pc(v) + '"><div class="pbar"><i style="width:' + Math.max(0, Math.min(100, v || 0)).toFixed(1) + '%"></i></div><span>0%</span><span>100%</span></div>';
      else {
        PEND.push({ id, opt: b.h === 'vong' ? ring(v) : b.h === 'duong' ? area(P.map((p, j) => ({ l: p.short, v: k.vals[j] })), k.u) : b.h === 'doi' ? vcols([{ l: P[PI].label, v: k.vals[PI] }, { l: P[CI].label, v }], k.u, 1) : spark(k.vals, k.u, 'bar') });
        fig = '<div class="vch' + (b.h === 'vong' ? ' vring' : '') + '" id="' + id + '" role="img" aria-label="' + esc(k.l) + '"></div>';
      }
      const chips = b.s.map((sid) => { const q = gm(b.ef, sid); if (!q) return ''; const w = WARN.indexOf(b.ef + ':' + sid) >= 0 && q.vals[CI] > 0; return '<span class="kchip">' + (w ? '<i class="dot" aria-hidden="true"></i>' : '') + esc(q.l) + ' <b>' + fv(q.vals[CI], q.u) + '</b></span>'; }).join('');
      if (b.h === 'so') {
        const grid = b.s.map((sid) => { const q = gm(b.ef, sid); if (!q) return ''; const w = WARN.indexOf(b.ef + ':' + sid) >= 0 && q.vals[CI] > 0; return '<div class="kg"><span>' + (w ? '<i class="dot" aria-hidden="true"></i> ' : '') + esc(q.l) + '</span><b>' + fv(q.vals[CI], q.u) + unitSmall(q.u) + '</b>' + dshort(q.vals[CI], q.vals[PI], q.u) + '</div>'; }).join('');
        body = '<div class="kso"><div class="tc-label">' + esc(k.l) + '</div><div class="kbig" title="' + esc(fu(v, k.u)) + '">' + big(v, k.u) + unitSmall(k.u) + '</div>' + dshort(v, k.vals[PI], k.u) + '</div>' + (grid ? '<div class="kgrid">' + grid + '</div>' : '');
      } else body = '<div class="vb"><div><div class="tc-label">' + esc(k.l) + '</div><div class="tc-num" title="' + esc(fu(v, k.u)) + '">' + big(v, k.u) + unitSmall(k.u) + '</div>' + dshort(v, k.vals[PI], k.u) + '</div>' + fig + '</div>' + xuNote + (chips ? '<div class="kchips">' + chips + '</div>' : '');
    }
    return '<' + tag + ' class="vcard z-' + b.z + (EDIT ? ' editing' : '') + '" style="--sp:' + (BSP[i] || 6) + '"' + href + '>' + tools + head + body + '</' + tag + '>';
  };

  const renderHome = () => {
    const acct = EDIT ? '' : '<button type="button" class="btn" data-xbtold="1" title="Quay về màn chỉ tiêu cũ (lưới thẻ)">Bố cục cũ</button>';
    const bar = EDIT ? '<div class="edbar"><button type="button" class="btn" data-undo="1"' + (HIST.length ? '' : ' disabled') + '>Hoàn tác</button><button type="button" class="btn" data-reset="1">Khôi phục mặc định</button><button type="button" class="btn" data-copy="1">Sao chép bố cục</button><button type="button" class="btn" data-paste="1">Dán bố cục</button><button type="button" class="btn pri" data-ed="off">Xong</button></div>'
      : '<button type="button" class="btn" data-ed="on">Tùy chỉnh</button>';
    let h = '<div class="page-h"><div><h1>' + esc(DATA.xaName) + '</h1><p>' + esc(KY) + ' · mũi tên ▲▼ là so với ' + esc(KYP) + (EDIT ? '' : ' · bấm vào hình nào để xem kỹ phần đó') + '</p></div><div class="ph-act">' + acct + bar + '</div></div>';
    if (EDIT) h += '<p class="ednote">Đang tùy chỉnh màn ngoài. Bố cục lưu riêng cho tài khoản <b>' + esc(xbtWho()) + '</b> trên trình duyệt này. Chỉ chọn được ô số, biểu đồ đã có trong bản đọc eform; số đã dùng ở chỗ khác trên màn thì không chọn lại.</p>';
    if (L.rings.length || EDIT) {
      h += (EDIT ? '<div class="sec-h" style="margin-top:0"><h2>Số nổi bật</h2><button type="button" class="btn" data-radd="1"' + (L.rings.length >= RMAX || !ringPool(-1).some((x) => !x.dis) ? ' disabled' : '') + '>＋ Thêm số</button><span>' + L.rings.length + '/' + RMAX + ' ô · tự chia hàng đều</span></div>' : '') + '<div class="rings">' + L.rings.map(([ef, id], i, all) => { const e = BY[ef], k = gm(ef, id), v = k.vals[CI], RS = ringSpans(all.length);
        if (k.u === '%') PEND.push({ id: 'rg' + i, opt: ring(v) });
        const tag = EDIT ? 'div' : 'a', href = EDIT ? '' : ' href="#' + e.slug + '"';
        return '<' + tag + ' class="ringc' + (EDIT ? ' editing' : '') + '" style="--sp:' + RS[i] + '"' + href + '>' + (EDIT ? '<div class="btools" style="align-self:flex-end"><button type="button" data-rmv="' + i + ',-1" aria-label="Đưa sang trái"' + (i === 0 ? ' disabled' : '') + '>←</button><button type="button" data-rmv="' + i + ',1" aria-label="Đưa sang phải"' + (i === L.rings.length - 1 ? ' disabled' : '') + '>→</button><button type="button" data-redit="' + i + '">Sửa</button><button type="button" data-rdel="' + i + '" aria-label="Bỏ ' + esc(k.l) + '">Bỏ</button></div>' : '') + '' + (k.u === '%' ? '<div class="rg" id="rg' + i + '" role="img" aria-label="' + esc(k.l) + ': ' + pc(v) + '"></div>' : (() => { const sb = sibOf(ef, id); return sb ? '<div class="rbox rbox2" role="img" aria-label="' + esc(k.l) + ': ' + fu(v, k.u) + '"><div class="rnum" title="' + esc(fu(v, k.u)) + '">' + big(v, k.u) + (k.u && k.u !== '%' ? '<small>' + esc(k.u) + '</small>' : '') + '</div>' + miniSib(sb, 4) + '</div>'
        : '<div class="rbox" role="img" aria-label="' + esc(k.l) + ': ' + fu(v, k.u) + '"><div class="rnum" title="' + esc(fu(v, k.u)) + '">' + big(v, k.u) + '</div>' + (k.u && k.u !== '%' ? '<div class="runit">' + esc(k.u) + '</div>' : '') + '<div class="rnone">' + esc(KY) + ' không có số cùng loại' + (k.u ? ' (' + esc(k.u) + ')' : '') + ' trong eform để so</div></div>'; })()) + '<div class="rt">' + esc(e.ten) + '</div><div class="rs">' + esc(k.l) + '</div>' + (dshort(v, k.vals[PI], k.u) || '<span class="delta" aria-hidden="true">&nbsp;</span>') + '</' + tag + '>'; }).join('') + (EDIT && !L.rings.length ? '<p class="hint">Chưa có số nổi bật nào.</p>' : '') + '</div>';
    }
    BSP = blockSpans(L.blocks);
    h += '<div class="bgrid">' + L.blocks.map(blockHtml).join('') + (EDIT ? '<button type="button" class="addc" data-add="1">＋ Thêm khối</button>' : '') + '</div>';
    if (!L.blocks.length && !EDIT) h += '<p class="hint">Màn ngoài đang trống. Bấm «Tùy chỉnh» để thêm khối, hoặc «Khôi phục mặc định».</p>';
    return h;
  };

  /* ---------- Hộp thoại: sửa khối, chọn vòng, sao chép, dán ---------- */
  const dlg = xbtDlg(); const DH = {}; const dlgOn = (t, f) => { DH[t] = f; };
  const dlgOpen = (html) => { XBT.dlgH = DH; dlg.innerHTML = '<div class="dlg-b" role="dialog" aria-modal="true" aria-labelledby="dlgT">' + html + '</div>'; dlg.hidden = false; const f = dlg.querySelector('select,textarea,input,button'); if (f) f.focus(); };
  const dlgClose = () => { dlg.hidden = true; dlg.innerHTML = ''; DR = null; };
  const opt = (v, l, sel, dis) => '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(l) + (dis ? ' (đã dùng)' : '') + '</option>';
  const firstFree = (ef, used) => { const e = BY[ef], k = e.kpis.find((x) => !used.has(ef + ':' + x.id)); if (k) return { t: 'so', ef, m: k.id, s: [], h: kindsOf(k)[0] }; const c = e.charts.findIndex((x, j) => chOK(e, j) && !used.has(ef + '#' + j)); return c >= 0 ? { t: 'bd', ef, c } : { t: 'so', ef, m: e.kpis[0].id, s: [], h: kindsOf(e.kpis[0])[0] }; };
  const drawEdit = () => {
    const b = DR.b, e = BY[b.ef], used = usedBy(DR.i, false);
    let h = '<h2 id="dlgT" class="st-t">' + (DR.i < 0 ? 'Thêm khối' : 'Sửa khối') + '</h2><p class="hint" style="margin:4px 0 14px">Chỉ chọn trong ô số, chỉ tiêu xã nhập, biểu đồ đã có trong bản đọc của eform.</p>';
    h += '<label class="fld"><span>Eform</span><select id="f-ef">' + ORDER.map((x) => opt(x, BY[x].truc + ' · ' + BY[x].ten, x === b.ef)).join('') + '</select></label>';
    h += '<fieldset class="fld"><legend>Loại khối</legend><label class="chk"><input type="radio" name="f-t" value="so"' + (b.t === 'so' ? ' checked' : '') + '> Số liệu (một số chính, tối đa 3 số phụ)</label><label class="chk"><input type="radio" name="f-t" value="bd"' + (b.t === 'bd' ? ' checked' : '') + '> Một biểu đồ của eform</label></fieldset>';
    if (b.t === 'so') {
      const k = gm(b.ef, b.m), dls = e.dl || [];
      h += '<label class="fld"><span>Số chính</span><select id="f-m"><optgroup label="Ô số">' + e.kpis.map((x) => opt(x.id, x.l + ' · ' + fu(x.vals[CI], x.u), x.id === b.m, used.has(b.ef + ':' + x.id))).join('') + '</optgroup>' +
        (dls.length ? '<optgroup label="Chỉ tiêu xã nhập (' + dls.length + ')">' + dls.map((d) => opt('d:' + d.k, (d.nhL ? d.nhL + ' · ' : '') + dlLabel(d) + ' · ' + fu(d.vals[CI], d.u), 'd:' + d.k === b.m, used.has(b.ef + ':d:' + d.k))).join('') + '</optgroup>' : '') + '</select></label>';
      const subBox = (id, l) => { const on = b.s.indexOf(id) >= 0, dis = !on && (used.has(b.ef + ':' + id) || b.s.length >= 3); return '<label class="chk' + (dis ? ' dis' : '') + '"><input type="checkbox" data-sub="' + esc(id) + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> ' + esc(l) + (used.has(b.ef + ':' + id) && !on ? ' (đã dùng)' : '') + '</label>'; };
      h += '<fieldset class="fld"><legend>Số phụ (tối đa 3, đã chọn ' + b.s.length + ')</legend>' + e.kpis.filter((x) => x.id !== b.m).map((x) => subBox(x.id, x.l)).join('') +
        (dls.length ? '<details class="dsub"' + (b.s.some((s) => s.indexOf('d:') === 0) ? ' open' : '') + '><summary>Chỉ tiêu xã nhập (' + dls.length + ')</summary>' + dls.filter((d) => 'd:' + d.k !== b.m).map((d) => subBox('d:' + d.k, (d.nhL ? d.nhL + ' · ' : '') + dlLabel(d))).join('') + '</details>' : '') + '</fieldset>';
      h += '<label class="fld"><span>Kiểu hình</span><select id="f-h">' + kindsOf(k).map((x) => opt(x, HK[x], x === b.h)).join('') + '</select></label>';
    } else {
      const c = e.charts[b.c], ks = c ? vkinds(e, c, b.c) : [], kind = ks.indexOf(b.k) >= 0 ? b.k : (c ? vdef(e, c, b.c) : '');
      h += '<label class="fld"><span>Biểu đồ</span><select id="f-c">' + e.charts.map((x, j) => (chOK(e, j) ? opt(String(j), x.t, j === b.c, used.has(b.ef + '#' + j)) : '')).join('') + '</select></label>';
      h += '<label class="fld"><span>Kiểu hình</span><select id="f-k">' + ks.map((x) => opt(x, KN[x], x === kind)).join('') + '</select></label>';
    }
    h += '<label class="fld"><span>Cỡ khối</span><select id="f-z">' + Object.keys(SZ).map((z) => opt(z, SZ[z], z === b.z)).join('') + '</select></label>';
    const dup = b.t === 'so' ? used.has(b.ef + ':' + b.m) : used.has(b.ef + '#' + b.c);
    h += (dup ? '<p class="hint" style="color:var(--s2)">Số hoặc biểu đồ này đã có ở chỗ khác trên màn. Chọn cái khác.</p>' : '') + '<div class="edbar" style="justify-content:flex-end"><button type="button" class="btn" data-dx="cancel">Huỷ</button><button type="button" class="btn pri" data-dx="save"' + (dup ? ' disabled' : '') + '>Lưu</button></div>';
    dlgOpen(h);
  };
  const openEdit = (i) => {
    const used = usedBy(-1, false);
    const b = i >= 0 && !L.blocks[i].bad ? clone(L.blocks[i]) : Object.assign(firstFree((ORDER.find((ef) => BY[ef].kpis.some((k) => !used.has(ef + ':' + k.id))) || ORDER[0]), used), { z: i >= 0 ? L.blocks[i].z : 'm' });
    if (b.t === 'so' && !b.s) b.s = [];
    DR = { i, b }; drawEdit();
  };
  /* Số nổi bật: chọn bất kỳ ô số hoặc dòng số liệu nào của 12 eform; số % vẽ vòng, số khác số lớn + cột 5 quý; đã dùng thì mờ (T1) */
  const ringPool = (skip) => { const used = new Set(); L.rings.forEach((r, j) => { if (j !== skip) used.add(r[0] + ':' + r[1]); }); usedBy(-1, true).forEach((x) => used.add(x));
    const out = []; ORDER.forEach((ef) => { BY[ef].kpis.forEach((k) => out.push({ key: ef + ':' + k.id, ef, l: k.l, v: fu(k.vals[CI], k.u), dis: used.has(ef + ':' + k.id) }));
      (BY[ef].dl || []).forEach((d) => out.push({ key: ef + ':d:' + d.k, ef, dong: true, l: (d.nhL ? d.nhL + ' · ' : '') + dlLabel(d), v: fu(d.vals[CI], d.u), dis: used.has(ef + ':d:' + d.k) })); }); return out; };
  /* Tìm không phân biệt dấu, hoa thường ("giao vien" khớp "Giáo viên") */
  const fold = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
  const drawRing = () => {
    const pool = ringPool(DR.ri), cur = DR.key, multi = DR.ri < 0, keys = DR.keys || [], room = RMAX - L.rings.length;
    const row = (x) => { const on = multi ? keys.indexOf(x.key) >= 0 : x.key === cur, dis = x.dis || (multi && !on && keys.length >= room);
      return '<label class="chk' + (dis ? ' dis' : '') + '" data-q="' + esc(fold(BY[x.ef].ten + ' ' + x.l)) + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + (multi ? 'f-ringm' : 'f-ring') + '" value="' + esc(x.key) + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '> ' + esc(x.l) + ' <b>' + esc(x.v) + '</b>' + (x.dis ? ' (đã dùng)' : '') + '</label>'; };
    let h = '<h2 id="dlgT" class="st-t">' + (multi ? 'Thêm số nổi bật' : 'Sửa số nổi bật') + '</h2><p class="hint" style="margin:4px 0 10px">' + (multi ? 'Tích chọn một hoặc nhiều ô số, chỉ tiêu xã nhập ở bất kỳ eform nào.' : 'Chọn một ô số hoặc chỉ tiêu xã nhập để thay cho ô này.') + ' Số tỷ lệ (%) vẽ thành vòng; số khác hiện số lớn kèm thanh các số cùng nhóm trong kỳ đang xem.</p>' +
      (multi ? '<p class="ednote" style="margin:0 0 10px" role="status">Đã chọn <b>' + keys.length + '</b> · còn trống <b>' + (room - keys.length) + '</b> ô (tối đa ' + RMAX + ' ô)</p>' : '') +
      '<label class="fld"><span>Tìm chỉ tiêu (gõ có dấu hoặc không dấu)</span><input type="search" id="f-q" value="' + esc(DR.q || '') + '" placeholder="VD: giáo viên, hiến máu, quá hạn" autocomplete="off"></label><div id="f-list">';
    ORDER.forEach((ef) => {
      const ps = pool.filter((x) => x.ef === ef); if (!ps.length) return;
      const ks = ps.filter((x) => !x.dong), ds = ps.filter((x) => x.dong), openD = ds.some((x) => (multi ? keys.indexOf(x.key) >= 0 : x.key === cur));
      h += '<fieldset class="fld" data-grp="1"><legend><b style="color:var(--fg)">' + esc(BY[ef].truc + ' · ' + BY[ef].ten) + '</b></legend>' + ks.map(row).join('') +
        (ds.length ? '<details class="dsub"' + (openD ? ' open' : '') + '><summary>Chỉ tiêu xã nhập (' + ds.length + ')</summary>' + ds.map(row).join('') + '</details>' : '') + '</fieldset>';
    });
    h += '</div><p class="hint" id="f-none" hidden>Không có chỉ tiêu nào khớp.</p>';
    const ok = multi ? keys.length > 0 : !!cur;
    dlgOpen(h + '<div class="edbar" style="justify-content:flex-end"><button type="button" class="btn" data-dx="cancel">Huỷ</button><button type="button" class="btn pri" data-dx="ring"' + (ok ? '' : ' disabled') + '>' + (multi && keys.length > 1 ? 'Thêm ' + keys.length + ' số' : 'Lưu') + '</button></div>');
    ringFilter();
  };
  /* Lọc tại chỗ (không vẽ lại hộp) để bộ gõ tiếng Việt không bị ngắt */
  const ringFilter = () => {
    const q = fold(DR && DR.q), list = dlg.querySelector('#f-list'); if (!list) return;
    let n = 0;
    list.querySelectorAll('fieldset[data-grp]').forEach((fs) => {
      let m = 0;
      fs.querySelectorAll('label[data-q]').forEach((lb) => { const ok = !q || lb.getAttribute('data-q').indexOf(q) >= 0; lb.hidden = !ok; if (ok) m++; });
      const dt = fs.querySelector('details'); if (dt) { const any = [].some.call(dt.querySelectorAll('label[data-q]'), (lb) => !lb.hidden); dt.hidden = !any; if (q && any) dt.open = true; }
      fs.hidden = !m; n += m;
    });
    const none = dlg.querySelector('#f-none'); if (none) none.hidden = n > 0;
  };
  const CODE = () => 'IOC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(strip(L)))));
  const openCopy = () => dlgOpen('<h2 id="dlgT" class="st-t">Sao chép bố cục</h2><p class="hint" style="margin:4px 0 10px">Gửi đoạn mã này cho người khác, hoặc giữ lại để dán khi đổi máy. Người nhận bấm «Tùy chỉnh» → «Dán bố cục».</p><label class="fld"><span>Mã bố cục</span><textarea id="f-code" rows="5" readonly>' + esc(CODE()) + '</textarea></label><p class="hint" id="f-msg" role="status"></p><div class="edbar" style="justify-content:flex-end"><button type="button" class="btn" data-dx="cancel">Đóng</button><button type="button" class="btn pri" data-dx="copy">Sao chép</button></div>');
  const openPaste = () => dlgOpen('<h2 id="dlgT" class="st-t">Dán bố cục</h2><p class="hint" style="margin:4px 0 10px">Dán mã bắt đầu bằng IOC1:. Bố cục hiện tại sẽ được thay; bấm «Hoàn tác» nếu muốn quay lại.</p><label class="fld"><span>Mã bố cục</span><textarea id="f-code" rows="5"></textarea></label><p class="hint" id="f-msg" role="status"></p><div class="edbar" style="justify-content:flex-end"><button type="button" class="btn" data-dx="cancel">Huỷ</button><button type="button" class="btn pri" data-dx="paste">Áp dụng</button></div>');

  dlgOn('change', (ev) => {
    const t = ev.target;
    if (DR && DR.b) {
      const b = DR.b, used = usedBy(DR.i, false);
      if (t.id === 'f-ef') { DR.b = Object.assign(firstFree(t.value, used), { z: b.z }); if (b.t === 'bd' && DR.b.t === 'so') { const c = BY[t.value].charts.findIndex((x, j) => chOK(BY[t.value], j) && !used.has(t.value + '#' + j)); if (c >= 0) DR.b = { t: 'bd', ef: t.value, c, z: b.z }; } }
      else if (t.name === 'f-t') { DR.b = t.value === 'bd' ? (() => { const e = BY[b.ef], c = e.charts.findIndex((x, j) => chOK(e, j) && !used.has(b.ef + '#' + j)); return { t: 'bd', ef: b.ef, c: c >= 0 ? c : 0, z: b.z }; })() : Object.assign(firstFree(b.ef, used), { t: 'so', z: b.z }); if (DR.b.t === 'bd' && t.value === 'so') DR.b = { t: 'so', ef: b.ef, m: BY[b.ef].kpis[0].id, s: [], h: kindsOf(BY[b.ef].kpis[0])[0], z: b.z }; }
      else if (t.id === 'f-m') { b.m = t.value; b.s = b.s.filter((x) => x !== t.value); b.h = kindsOf(gm(b.ef, t.value)).indexOf(b.h) >= 0 ? b.h : kindsOf(gm(b.ef, t.value))[0]; }
      else if (t.dataset.sub) { const id = t.dataset.sub; b.s = t.checked ? b.s.concat(id).slice(0, 3) : b.s.filter((x) => x !== id); }
      else if (t.id === 'f-h') b.h = t.value;
      else if (t.id === 'f-c') { b.c = +t.value; delete b.k; }
      else if (t.id === 'f-k') b.k = t.value;
      else if (t.id === 'f-z') b.z = t.value;
      const fid = t.id || (t.name ? null : null), keep = t.id ? '#' + t.id : t.dataset.sub ? '[data-sub="' + CSS.escape(t.dataset.sub) + '"]' : t.name ? 'input[name="' + t.name + '"][value="' + t.value + '"]' : null;
      drawEdit(); if (keep) { const n = dlg.querySelector(keep); if (n) n.focus(); }
      return fid;
    }
    if (DR && DR.ri != null && t.name === 'f-ringm') { const k = t.value; DR.keys = t.checked ? (DR.keys || []).concat(k) : (DR.keys || []).filter((x) => x !== k); const y = dlg.querySelector('.dlg-b').scrollTop; drawRing(); dlg.querySelector('.dlg-b').scrollTop = y; const n = dlg.querySelector('input[name="f-ringm"][value="' + CSS.escape(k) + '"]'); if (n) n.focus({ preventScroll: true }); return null; }
    if (DR && DR.ri != null && t.name === 'f-ring') { DR.key = t.value; drawRing(); const n = dlg.querySelector('input[name="f-ring"][value="' + CSS.escape(t.value) + '"]'); if (n) n.focus(); }
    return null;
  });
  dlgOn('input', (ev) => { if (ev.target.id === 'f-q' && DR && DR.ri != null) { DR.q = ev.target.value; ringFilter(); } });
  dlgOn('compositionend', (ev) => { if (ev.target.id === 'f-q' && DR && DR.ri != null) { DR.q = ev.target.value; ringFilter(); } });
  dlgOn('click', (ev) => {
    if (ev.target === dlg) { dlgClose(); return; }
    const x = ev.target.closest('[data-dx]'); if (!x) return;
    const a = x.getAttribute('data-dx'), msg = dlg.querySelector('#f-msg');
    if (a === 'cancel') dlgClose();
    else if (a === 'save') { const nl = clone(strip(L)), b = Object.assign({}, DR.b); if (DR.i < 0) nl.blocks.push(b); else nl.blocks[DR.i] = b; dlgClose(); commit(valid(nl)); }
    else if (a === 'ring') { const nl = clone(strip(L)), sp = (key) => { const p = key.indexOf(':'); return [key.slice(0, p), key.slice(p + 1)]; }; if (DR.ri < 0) (DR.keys || []).forEach((key) => nl.rings.push(sp(key))); else nl.rings[DR.ri] = sp(DR.key); dlgClose(); commit(valid(nl)); }
    else if (a === 'copy') { const ta = dlg.querySelector('#f-code'); const done = () => { msg.textContent = 'Đã sao chép mã bố cục.'; }; try { navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); msg.textContent = 'Trình duyệt không cho sao chép tự động: mã đã được bôi đen, bấm Ctrl+C (Cmd+C trên Mac).'; }); } catch (er) { ta.select(); msg.textContent = 'Mã đã được bôi đen, bấm Ctrl+C (Cmd+C trên Mac).'; } }
    else if (a === 'paste') {
      const raw = (dlg.querySelector('#f-code').value || '').trim();
      let v = null; try { if (raw.indexOf('IOC1:') === 0) v = valid(JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))))); } catch (er) { v = null; }
      if (!v) { msg.textContent = 'Mã không đúng. Hãy dán đủ đoạn mã bắt đầu bằng IOC1: nhận được từ nút «Sao chép bố cục».'; return; }
      dlgClose(); commit(v);
    }
  });
  dlgOn('keydown', (ev) => { if (ev.key === 'Escape') dlgClose(); });

  /* Bấm trên màn ngoài (chế độ tùy chỉnh); trả true nếu đã xử lý */
  const homeClick = (ev) => {
    const g = (s) => ev.target.closest(s);
    let n;
    if ((n = g('[data-ed]'))) { EDIT = n.getAttribute('data-ed') === 'on'; render(true); const f = document.querySelector(EDIT ? '[data-ed="off"]' : '[data-ed="on"]'); if (f) f.focus({ preventScroll: true }); return true; }
    if (!EDIT) return false;
    if ((n = g('[data-mv]'))) { const [i, d] = n.getAttribute('data-mv').split(',').map(Number), nl = clone(strip(L)), j = i + d; if (j < 0 || j >= nl.blocks.length) return true; const t = nl.blocks[i]; nl.blocks[i] = nl.blocks[j]; nl.blocks[j] = t; commit(valid(nl)); const f = document.querySelector('[data-mv="' + j + ',' + d + '"]') || document.querySelector('[data-mv="' + j + ',' + (-d) + '"]'); if (f) f.focus({ preventScroll: true }); return true; }
    if ((n = g('[data-sz]'))) { const i = +n.getAttribute('data-sz'), nl = clone(strip(L)), o = ['s', 'm', 'l']; nl.blocks[i].z = o[(o.indexOf(nl.blocks[i].z) + 1) % 3]; commit(valid(nl)); const f = document.querySelector('[data-sz="' + i + '"]'); if (f) f.focus({ preventScroll: true }); return true; }
    if ((n = g('[data-del]'))) { const nl = clone(strip(L)); nl.blocks.splice(+n.getAttribute('data-del'), 1); commit(valid(nl)); return true; }
    if ((n = g('[data-rdel]'))) { const nl = clone(strip(L)); nl.rings.splice(+n.getAttribute('data-rdel'), 1); commit(valid(nl)); return true; }
    if ((n = g('[data-edit]'))) { openEdit(+n.getAttribute('data-edit')); return true; }
    if (g('[data-add]')) { openEdit(-1); return true; }
    if ((n = g('[data-redit]'))) { const i = +n.getAttribute('data-redit'); DR = { ri: i, key: L.rings[i][0] + ':' + L.rings[i][1] }; drawRing(); return true; }
    if (g('[data-radd]')) { DR = { ri: -1, keys: [] }; drawRing(); return true; }
    if ((n = g('[data-rmv]'))) { const [i, d] = n.getAttribute('data-rmv').split(',').map(Number), nl = clone(strip(L)), j = i + d; if (j < 0 || j >= nl.rings.length) return true; const t = nl.rings[i]; nl.rings[i] = nl.rings[j]; nl.rings[j] = t; commit(valid(nl)); const fo = document.querySelector('[data-rmv="' + j + ',' + d + '"]') || document.querySelector('[data-rmv="' + j + ',' + (-d) + '"]'); if (fo) fo.focus({ preventScroll: true }); return true; }
    if (g('[data-undo]')) { if (HIST.length) { L = valid(JSON.parse(HIST.pop())); saveL(); render(true); } return true; }
    if (g('[data-reset]')) { commit(defFor()); return true; }
    if (g('[data-copy]')) { openCopy(); return true; }
    if (g('[data-paste]')) { openPaste(); return true; }
    return false;
  };

  /* ---------- Lớp 2: một eform, một màn ---------- */
  const ST = { sel: {}, allK: {}, kind: {} };
  const ORDER = ['xa_hcc', 'xa_tcns', 'xa_qlvb', 'xa_gpmb', 'xa_gd', 'xa_vh', 'xa_hdnd', 'xa_mttq', 'xa_nv', 'xa_dang', 'xa_yte', 'xa_ktxh'];
  const DONUT_OK = { xa_gd: [0, 1, 2, 3] };
  const stage = (e, c, ci) => {
    const ks = vkinds(e, c, ci), key = e.ef + '#' + ci, k0 = ST.kind[key], kind = ks.indexOf(k0) >= 0 ? k0 : vdef(e, c, ci);
    return (ks.length > 1 ? '<div class="kinds" role="group" aria-label="Kiểu hình">' + ks.map((k) => '<button type="button" class="kbtn" aria-pressed="' + (k === kind) + '" data-kind="' + esc(key + '|' + k) + '">' + KN[k] + '</button>').join('') + '</div>' : '') + viz(e, c, ci, kind, false);
  };
  const statBtn = (e, l, v, pv, u, recs, sub) => '<div class="stat"><div class="l">' + esc(l) + '</div><div class="v">' + fv(v, u) + (u && u !== '%' ? ' <small style="font-size:12.5px;font-weight:500;color:var(--fg-2)">' + esc(u) + '</small>' : '') + '</div>' + dshort(v, pv, u) + '</div>';

  const renderEf = (e) => {
    let h = '<a class="crumb" href="#xbt-close">' + BACK + esc(DATA.xaName) + '</a>';
    h += '<nav class="pillbar" aria-label="Chuyển eform">' + ORDER.map((ef) => { const x = BY[ef]; return '<a class="pill" href="#' + x.slug + '"' + (x === e ? ' aria-current="page"' : '') + '>' + esc(x.ten) + '</a>'; }).join('') + '</nav>';
    h += '<div class="page-h"><div><h1>' + esc(e.ten) + '</h1><p>' + esc(e.truc) + ' · ' + esc(KY) + ' · ▲▼ so với ' + esc(KYP) + '</p></div><button type="button" class="btn" style="margin-left:auto" data-r="' + recBtn(e, 'ALL') + '">Xem bản ghi đã nhập</button></div>';
    const ks = e.kpis.filter((k) => k.id !== 'dong' || e.kpis.length === 1), showK = ST.allK[e.ef] ? ks : ks.slice(0, 4);
    h += '<section class="stats" style="grid-template-columns:repeat(' + Math.max(3, Math.min(4, showK.length)) + ',minmax(0,1fr))" aria-label="Ô số">' + showK.map((k) => statBtn(e, k.l, k.vals[CI], k.vals[PI], k.u, k.recs, k.how)).join('') + '</section>' +
      (ks.length > 4 ? '<div class="more" style="margin:-4px 0 12px;justify-content:flex-start"><button type="button" class="btn" data-allk="' + e.ef + '">' + (ST.allK[e.ef] ? 'Thu gọn ô số' : 'Xem đủ ' + ks.length + ' ô số') + '</button></div>' : '');
    const cs = e.charts.filter((c) => (c.items || []).some((x) => x.v != null) && !(c.loai === 'cot' && c.items.length < 2 && e.ef === 'xa_qlvb'));
    cs.sort((x, y) => (x.m === 'Dòng số liệu' || x.m === 'Số chỉ tiêu' ? 1 : 0) - (y.m === 'Dòng số liệu' || y.m === 'Số chỉ tiêu' ? 1 : 0));
    const norm = (t) => String(t).trim().toLowerCase();
    const twin = (c) => e.nhom.find((x) => norm(x.l) === norm(c.t));
    const ns = e.nhom.filter((x) => !cs.some((c) => norm(c.t) === norm(x.l)));
    const nhItems = (g) => (g.dongs.length ? g.dongs : g.lines.map((l) => ({ l: l.l, u: l.u, v: l.cur, recs: l.recs })));
    let sel = ST.sel[e.ef] || 'c0';
    const g = sel[0] === 'n' ? ns.find((x) => 'n' + x.v === sel) : null;
    if (sel[0] === 'n' && !g) sel = 'c0';
    let title, body;
    if (g) { title = g.l; body = stage(e, { loai: 'dong', t: g.l, items: nhItems(g), nh: g.l }, -1); }
    else {
      const c = cs[Math.min(+sel.slice(1) || 0, cs.length - 1)], tw = twin(c);
      title = c.t; body = stage(e, c, e.charts.indexOf(c));
      if (tw && tw.dongs.length > (c.items || []).length) body = '<p class="ef-meta" style="margin:4px 0 2px">Đủ ' + tw.dongs.length + ' dòng số liệu của nhóm «' + esc(tw.l) + '», gồm cả các số của biểu đồ «' + esc(c.t) + '».</p>' + stage(e, { loai: 'dong', t: tw.l, items: tw.dongs, nh: tw.l, all: true }, -1);
    }
    const item = (key, label) => '<button type="button" class="citem" aria-pressed="' + (key === sel) + '" data-sel="' + esc(key) + '">' + esc(label) + '</button>';
    h += '<div class="efgrid"><nav class="cmenu" aria-label="Chọn biểu đồ"><div class="cm-t">Biểu đồ</div>' + cs.map((x, i) => item('c' + i, x.t.replace(/ \(.*\)$/, ''))).join('') +
      (ns.length ? '<div class="cm-t" style="margin-top:10px">Theo ' + esc((e.tach || 'nhóm').toLowerCase()) + '</div>' + ns.map((x) => item('n' + x.v, x.l)).join('') : '') + '</nav>' +
      '<section class="stage" aria-label="Biểu đồ"><h3 class="st-t">' + esc(title) + '</h3><div class="stage-b">' + body + '</div><p class="hint" style="margin:8px 0 0;font-size:12px;color:var(--fg-3)">Bấm vào hình để xem bản ghi của phần đó.</p></section></div>';
    return h;
  };

  /* ---------- Gắn vào IOC: màn ngoài (OV = mã màn ngoài) hoặc hộp cửa sổ màn eform (OV = 'modal') ---------- */
  const render = () => xbtRerender(OV);
  const reset = () => { C = readC(); PEND = []; seq = 0; recSeq = 0; Object.keys(REC).forEach((k) => delete REC[k]); };
  return {
    DATA, EFS, BY,
    home: () => { reset(); return renderHome(); },
    ef: (e) => { reset(); return renderEf(e); },
    byEf: (sid) => EFS.find((x) => x.sid === sid) || null,
    mount: () => { mountCharts(); },
    click: (ev) => {
    const cur = OV === 'modal' ? EFS.find((x) => x.sid === XBT.curEf) || null : null;
    if (!cur && homeClick(ev)) return;
    const sl = ev.target.closest('[data-sel]'); if (sl && cur) { ST.sel[cur.ef] = sl.getAttribute('data-sel'); render(true); const n = document.querySelector('[data-sel="' + CSS.escape(ST.sel[cur.ef]) + '"]'); if (n) n.focus({ preventScroll: true }); return; }
    const kd = ev.target.closest('[data-kind]'); if (kd && cur) { const v = kd.getAttribute('data-kind'), p = v.lastIndexOf('|'); ST.kind[v.slice(0, p)] = v.slice(p + 1); render(true); const n = document.querySelector('[data-kind="' + CSS.escape(v) + '"]'); if (n) n.focus({ preventScroll: true }); return; }
    const ak = ev.target.closest('[data-allk]'); if (ak && cur) { ST.allK[cur.ef] = !ST.allK[cur.ef]; render(true); return; }
    const r = ev.target.closest('[data-r]'); if (r && REC[r.getAttribute('data-r')]) REC[r.getAttribute('data-r')]();
  },
    editing: () => EDIT,
    test: { valid, usedBy, ringPool, ringSpans, blockSpans, sibOf, vkinds, defFor, gm, L: () => L, setL: (x) => { L = x; } }
  };
}

/* lấy (hoặc dựng lại khi đổi xã, đổi kỳ) bản bảng tin của một màn */
function xbtInst(ov, sids, cur) {
  const k = [typeof currentXaId !== 'undefined' ? currentXaId : '', cur, sids.join(','), typeof CTM_UI !== 'undefined' ? CTM_UI.gran || '' : ''].join('|');
  if (!XBT.inst[ov] || XBT.key[ov] !== k) { XBT.inst[ov] = xbtMake(xbtData(sids, cur), ov); XBT.key[ov] = k; }
  return XBT.inst[ov];
}
function xbtRerender(ov) {
  if (ov === 'modal') { if (typeof ctmRerender === 'function') ctmRerender(false); return; }
  const host = document.getElementById('xbt-host-' + ov), inst = XBT.inst[ov];
  if (!host || !inst) return;
  host.innerHTML = inst.home();
  inst.mount();
}
const XBT_OLDBAR = (lbl) => '<div class="stc-root" style="grid-column:1/-1;background:transparent;overflow:visible"><div class="xbt-oldbar"><button type="button" onclick="xbtSetMode(\'moi\')">' + lbl + '</button></div></div>';

/* ---------- Gắn vào IOC ---------- */
if (XBT_ENABLED && typeof ctmOverviewHtml === 'function' && typeof ctmScreenHtml === 'function') {
  /* Lớp 1: màn ngoài của tài khoản xã, phường */
  const ovOrig = ctmOverviewHtml;
  ctmOverviewHtml = function (cfg, cats) {
    if (!cfg || cfg.level !== 'xa') return ovOrig(cfg, cats);
    if (xbtMode() === 'cu') return XBT_OLDBAR('Xem bố cục mới') + ovOrig(cfg, cats);
    try {
      const sids = xbtSpecs(cfg.roles); if (!sids.length) return ovOrig(cfg, cats);
      const inst = xbtInst(cfg.id, sids, CTM_SPECS[sids[0]].periods[0].id);
      setTimeout(() => inst.mount(), 0);
      return '<div class="stc-root xbt-root xbt-ov" style="grid-column:1/-1;background:transparent;overflow:visible" id="xbt-host-' + cfg.id + '">' + inst.home() + '</div>';
    } catch (e) { if (typeof console !== 'undefined') console.error('[xbt]', e); return ovOrig(cfg, cats); }
  };
  /* Lớp 2: màn eform (Tổng quan của đơn vị xã) trong hộp cửa sổ */
  const scOrig = ctmScreenHtml;
  ctmScreenHtml = function (spec) {
    XBT.curEf = null;
    if (!spec || spec.level !== 'xa' || !spec.efDonVi) return scOrig(spec);
    if (CTM_UI.screen !== 'home' && CTM_UI.screen !== 'group') return scOrig(spec);
    if (xbtMode() === 'cu') return XBT_OLDBAR('Xem bố cục mới') + scOrig(spec);
    try {
      const roles = typeof allowedCategoryRoles === 'function' ? allowedCategoryRoles() : null;
      let sids = xbtSpecs(roles); if (sids.indexOf(spec.id) < 0) sids = sids.concat(spec.id);
      const inst = xbtInst('modal', sids, ctmCurPid(spec)), e = inst.byEf(spec.id);
      XBT.curEf = spec.id;
      return ctmHeader(spec, '') + '<div class="xbt-root xbt-modal"><div class="xbt-mode"><button type="button" class="btn" data-xbtold="1">Bố cục cũ</button></div>' + inst.ef(e) + '</div>';
    } catch (er) { if (typeof console !== 'undefined') console.error('[xbt]', er); return scOrig(spec); }
  };
  /* vẽ biểu đồ sau khi hộp cửa sổ đã dựng và đã hiện (lần đầu hộp còn ẩn nên vẽ lại kích thước sau) */
  const rrOrig = ctmRerender;
  ctmRerender = function (a, b) {
    rrOrig(a, b);
    if (XBT.curEf && XBT.inst.modal) { setTimeout(() => XBT.inst.modal.mount(), 0); setTimeout(() => XBT.charts.forEach((c) => { if (!c.isDisposed()) c.resize(); }), 320); }
  };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('click', (ev) => {
      const root = ev.target && ev.target.closest && ev.target.closest('.xbt-root');
      if (!root || root.id === 'xbt-dlg') return;
      if (ev.target.closest('[data-xbtold]')) { xbtSetMode('cu'); return; }
      const host = root.closest('[id^="xbt-host-"]'), inst = host ? XBT.inst[host.id.slice(9)] : XBT.curEf ? XBT.inst.modal : null;
      const a = ev.target.closest('a[href^="#"]');
      if (a) {
        ev.preventDefault();
        const h = a.getAttribute('href').slice(1);
        if (h === 'xbt-close') { if (typeof ctmClose === 'function') ctmClose(); return; }
        const sid = xbtSidOfSlug(h);
        if (sid && typeof openCategoryDetail === 'function') openCategoryDetail(CTM_SPECS[sid].role, sid);
        return;
      }
      if (inst) inst.click(ev);
    });
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => XBT.charts.forEach((c) => { if (!c.isDisposed()) c.resize(); }), 150); });
    /* đổi giao diện IOC (lớp theme-… trên html) thì vẽ lại cho đúng màu */
    if (typeof MutationObserver !== 'undefined') new MutationObserver(() => { Object.keys(XBT.inst).forEach((ov) => { if (ov !== 'modal') xbtRerender(ov); }); if (XBT.curEf) xbtRerender('modal'); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
}
