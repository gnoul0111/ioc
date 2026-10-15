/* ============================== SỞ TÀI CHÍNH — FORM CHỈ TIÊU MỚI ==============================
   Form riêng cho Sở Tài chính, hiển thị trong popup chuẩn của IOC (#modal), 6 màn hình: Trang chủ, 4 màn nhóm, Chi tiết theo cấp bậc (kiểu A).
   Dữ liệu: stc-data.js (bản chụp API). Không có số nào gõ cứng ở đây: mọi con số đến từ bản chụp (hoặc dữ liệu thử ?stcdemo=1).
   Mọi lớp CSS có tiền tố stc- (css/stc.css). Cần: esc() từ helpers.js. */

const STC_UI = { open: false, screen: 'home', group: 'ns', ind: 'chi', pick: null, focus: null, dd: null, zoom: null, role: null, year: null, period: null, loading: false, error: false };
const STC_PAL = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
const STC_ICON_INFO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>';
const STC_ICON_WARN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>';
const STC_ICON_DB = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>';
const STC_ICON_REFRESH = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>';
const STC_ICON_DL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>';
const STC_ICON_ZOOMIN = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const STC_ICON_ZOOMOUT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

/* ---------- Tiện ích hiển thị ---------- */
function stcE(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s); }
function stcRes() { return (STC_UI.year && STC_UI.period) ? stcBuildPeriod(STC_UI.year, STC_UI.period) : null; }
function stcQ(y, p) { return 'Q' + p + '/' + y; }
function stcInd(res, id) { return res.byId[id]; }
function stcShare(n, parent) { return (parent && parent.kind === 'add' && parent.now > 0 && n.now != null) ? (n.now / parent.now) * 100 : null; }
function stcVal(n) {
  if (n.now == null) return '—';
  if (n.kind === 'pct') return stcFmt(n.now) + '%';
  if (n.kind === 'idx') return stcFmt(n.now, 1);
  return stcFmt(n.now);
}
/* Chú thích khi rê chuột vào một mũi tên tăng/giảm. which: 'kq' = so kỳ trước (quý liền trước), 'cq' = so cùng kỳ năm trước. */
function stcDlTip(n, which, v) {
  const isK = which === 'kq', u = stcDeltaUnit(n, which), base = isK ? n.kq : n.cq, lbl = isK ? n.kqLbl : n.cqLbl;
  const L = [(isK ? 'So kỳ trước' : 'So cùng kỳ') + ': so với ' + (isK ? 'quý liền trước' : 'cùng quý năm trước') + (lbl ? ' (' + lbl + ')' : '') + '.'];
  if (v == null) {
    L.push(isK ? (n.kind === 'idx' && n.now > 0 ? 'Chưa có số của quý liền trước nên chưa so được.' : 'Chưa có số liệu của quý liền trước nên chưa so được.') : 'Nguồn số liệu chưa có số cùng kỳ năm trước cho mục này.');
    return L.join('\n');
  }
  const fv = (x) => (n.kind === 'pct' ? stcFmt(x) + '%' : stcFmt(x, n.kind === 'idx' ? 1 : Math.round(x) === x ? 0 : 1));
  const other = isK ? 'quý trước' : 'cùng kỳ';
  if (n.kind === 'idx' && !isK) L.push('Chỉ số đã lấy cùng kỳ năm trước làm mốc 100, nên mức tăng = ' + stcFmt(n.now, 1) + ' − 100 = ' + stcSgn(v, 1) + '%.');
  else if (u === '%' && base != null) L.push('Cách tính: (kỳ này ÷ ' + other + ' − 1) × 100 = (' + fv(n.now) + ' ÷ ' + fv(base) + ' − 1) × 100 = ' + stcSgn(v, 1) + '%.');
  else if (u === '%') L.push('Lấy theo chỉ số so cùng kỳ của nguồn số liệu: ' + stcFmt(n.ck, 1) + ' − 100 = ' + stcSgn(v, 1) + '%.');
  else L.push('Đơn vị "' + u + '": lấy kỳ này TRỪ thẳng ' + other + ' = ' + fv(n.now) + ' − ' + fv(base) + ' = ' + stcSgn(v, 1) + ' ' + u + '.' + (u === 'điểm %' ? ' Không phải tăng ' + stcFmt(Math.abs(v), 1) + '%.' : ''));
  if (!isK && n.cqSrc === 'ck') L.push('Số cùng kỳ được suy ra từ chỉ số so cùng kỳ (giả định chỉ số lấy 100 làm mốc).');
  L.push(n.neutral ? 'Tăng hay giảm không tự thân tốt/xấu nên tô màu trung tính.' : 'Tăng tô xanh, giảm tô đỏ.');
  return L.join('\n');
}
/* Một mũi tên tăng/giảm. withRef: ghi kèm chữ "so kỳ trước"/"so cùng kỳ". Không tính được thì hiện "—" (vẫn có chú thích). */
function stcDlOne(n, which, withRef) {
  const v = which === 'kq' ? stcDeltaKq(n) : stcDeltaCq(n);
  const ref = withRef ? ' <span class="stc-ref">' + (which === 'kq' ? 'so kỳ trước' : 'so cùng kỳ') + '</span>' : '';
  const tip = ' title="' + stcE(stcDlTip(n, which, v)) + '"';
  if (v == null) return '<span class="stc-dl na"' + tip + '>—' + ref + '</span>';
  const cls = v > 0.0499 ? 'up' : v < -0.0499 ? 'down' : 'flat';
  const neutral = n.neutral && cls !== 'flat' ? ' n' : '';
  const u = stcDeltaUnit(n, which);
  const txt = cls === 'flat' ? 'Không đổi' : stcFmt(Math.abs(v), 1) + (u === '%' ? '%' : ' ' + u);
  return '<span class="stc-dl ' + cls + neutral + '"' + tip + '>' + txt + ref + '</span>';
}
/* Mũi tên tăng/giảm: hiện CẢ HAI cách so (kỳ trước và cùng kỳ), xếp chồng. Xanh/đỏ chỉ khi chỉ tiêu có "chiều tốt";
   chi, nhập khẩu, giá dùng màu trung tính. Không cách nào tính được thì trả ''. */
function stcDl(n, withRef) {
  if (stcDeltaKq(n) == null && stcDeltaCq(n) == null) return '';
  return '<span class="stc-dlp">' + stcDlOne(n, 'kq', true) + stcDlOne(n, 'cq', true) + '</span>';
}
/* Có cột so sánh nào tính được trong danh sách mục không */
function stcHasCmp(list) { return list.some((k) => stcDeltaKq(k) != null || stcDeltaCq(k) != null); }
function stcBtnLnk(label, act) { return '<button type="button" class="stc-lnk" onclick="' + act + '">' + stcE(label) + '</button>'; }
function stcEmptyBox(title, text) { return '<div class="stc-empty">' + STC_ICON_DB + '<b>' + stcE(title) + '</b><span style="font-size:12px;max-width:360px">' + stcE(text) + '</span></div>'; }
function stcNote(html) { return '<div class="stc-note">' + STC_ICON_INFO + '<div>' + html + '</div></div>'; }

/* Bản "khung" của chỉ tiêu chưa có số: giữ nguyên cấu trúc (nhãn, đơn vị, phân cấp), mọi giá trị = null để hiện "—".
   Chỉ dùng để vẽ khung thiết kế; không bao giờ điền số thay thế. */
function stcBlank(n) {
  return Object.assign({}, n, { now: null, prev: null, ck: null, cmp: null, kq: null, cq: null, cqSrc: null, derivedCk: false, state: 'blank', kids: (n.kids || []).map(stcBlank) });
}
function stcNodataNote(res) {
  return '<div class="stc-nodata">' + STC_ICON_DB + '<div><b>Chưa có số liệu từ Sở Tài chính.</b> API trả toàn bộ giá trị bằng 0 cho ' + stcQ(res.year, res.period) + ' nên các ô hiển thị "—"; form không điền số thay thế. Khi có số, khung này tự hiện biểu đồ.</div></div>';
}
function stcStateBody(ind, res) {
  if (ind.state === 'nodata') return stcEmptyBox('Chưa có số liệu từ Sở Tài chính', 'API trả toàn bộ giá trị bằng 0 cho ' + stcQ(res.year, res.period) + ', nên form không vẽ biểu đồ rỗng.');
  if (ind.state === 'missing') return stcEmptyBox('Không nhận diện được dữ liệu', 'Bản chụp không có dòng nào khớp với chỉ tiêu này (API ' + ind.apis.join(', ') + ').');
  return '';
}

/* ---------- Đầu form: chip trạng thái, bộ chọn kỳ ---------- */
function stcYears() {
  const set = {};
  stcPeriods().forEach((p) => { set[p.year] = true; });
  const cy = new Date().getFullYear();
  set[cy] = true; set[cy - 1] = true;
  return Object.keys(set).map(Number).sort((a, b) => b - a);
}
/* Hộp chọn tự dựng (thay <select> gốc của trình duyệt để danh sách sổ xuống đúng giao diện IOC, cả 3 theme). */
function stcDd(id, label, cur, opts, handler) {
  const open = STC_UI.dd === id;
  const cv = opts.find((o) => String(o.v) === String(cur));
  const list = open ? '<div class="stc-ddl" role="listbox" aria-label="' + stcE(label) + '">' + opts.map((o) => {
    const on = String(o.v) === String(cur);
    return '<button type="button" role="option" aria-selected="' + on + '" class="stc-ddo' + (on ? ' on' : '') + (o.off ? ' off' : '') + '"' + (o.off ? ' disabled' : ' onclick="' + handler + '(' + o.v + ')"') + '><span>' + stcE(o.text) + '</span>' + (o.off ? '<em>chưa có</em>' : on ? '<i>✓</i>' : '') + '</button>';
  }).join('') + '</div>' : '';
  return '<div class="stc-dd' + (open ? ' open' : '') + '"><button type="button" class="stc-ddb" aria-haspopup="listbox" aria-expanded="' + open + '" onclick="stcDdToggle(\'' + id + '\')"><small>' + stcE(label) + '</small><b>' + stcE(cv ? cv.text : '—') + '</b><span class="stc-ddc"></span></button>' + list + '</div>';
}
function stcPeriodControls() {
  const yOpts = stcYears().map((y) => ({ v: y, text: String(y) }));
  const qOpts = [1, 2, 3, 4].map((q) => ({ v: q, text: 'Quý ' + q, off: !stcHasPeriod(STC_UI.year, q) }));
  return stcDd('year', 'Năm', STC_UI.year, yOpts, 'stcSetYear') + stcDd('period', 'Kỳ', STC_UI.period, qOpts, 'stcSetPeriod');
}
function stcDdToggle(id) { STC_UI.dd = STC_UI.dd === id ? null : id; stcRerender(false); }
function stcChips(res) {
  let h = STC_DEMO_ON ? '<span class="stc-chip"><i></i>Nguồn: số mẫu tự đặt (không phải API)</span>' : '<span class="stc-chip"><i></i>Nguồn: Sở Tài chính Hà Nội (bản chụp API)</span>';
  h += '<span class="stc-chip">Kỳ báo cáo: ' + stcE(res ? 'Quý ' + res.period + '/' + res.year : (STC_UI.year ? 'Quý ' + STC_UI.period + '/' + STC_UI.year : '—')) + '</span>';
  if (res) h += '<span class="stc-chip">Số liệu chụp lúc ' + stcE(stcStampText(res.importedAt)) + '</span>';
  else h += '<span class="stc-chip demo"><i></i>Chưa có bản chụp cho kỳ này</span>';
  if (STC_DEMO_ON) h += '<span class="stc-chip demo"><i></i>DỮ LIỆU MẪU – không phải số liệu thật</span>';
  return h;
}
function stcHeader(res, o) {
  const back = o.back === 'home' ? stcBtnLnk('← Tổng quan', "stcGo('home')") : o.back && o.back.group ? stcBtnLnk('← ' + o.back.label, "stcGo('group','" + o.back.group + "')") : '';
  const chips = STC_SHOW_CHIPS ? '<div class="stc-chips">' + stcChips(res) + '</div>' : '';
  return '<div class="stc-toolbar"><div class="stc-tl">' + back + chips + '</div>' +
    '<div class="stc-ctrls">' + stcPeriodControls() + '<button type="button" class="stc-btn" onclick="stcReload()" title="Tải lại nguồn số liệu (bản chụp API)">' + STC_ICON_REFRESH + 'Tải lại</button><button type="button" class="stc-btn' + (STC_DEMO_ON ? ' demoon' : '') + '" onclick="stcToggleDemo()" title="Bật/tắt dữ liệu mẫu để xem thiết kế; số mẫu không phải số liệu thật">' + (STC_DEMO_ON ? 'Tắt dữ liệu mẫu' : 'Xem dữ liệu mẫu') + '</button>' + (typeof indicatorEntryBtnHtml === 'function' ? indicatorEntryBtnHtml() : '') + '<button type="button" class="stc-btn primary" onclick="stcExport()"' + (res ? '' : ' disabled') + '>' + STC_ICON_DL + 'Xuất Excel</button></div></div>';
}function stcFoot(res) {
  return '<div class="stc-foot"><span>' + stcE(STC_ASSUME.unitNote) + '</span><span>' + (STC_DEMO_ON ? 'Nguồn: số mẫu tự đặt, không phải số liệu của Sở Tài chính' : 'Nguồn: API Sở Tài chính Hà Nội') + (res ? ' · ' + stcQ(res.year, res.period) : '') + '</span></div>';
}
function stcNoPeriodScreen(o) {
  const latest = stcLatestPeriod();
  return stcHeader(null, o) + '<div class="stc-card">' + stcEmptyBox('Chưa có bản chụp số liệu cho Quý ' + STC_UI.period + '/' + STC_UI.year,
    latest ? 'Bản chụp gần nhất là Quý ' + latest.period + '/' + latest.year + '. Chọn kỳ đó ở bộ chọn phía trên, hoặc nạp thêm kỳ mới bằng "node stc-tool.js import" (xem STC_HUONG_DAN.md).' : 'Chưa nạp kỳ nào. Dùng "node stc-tool.js import" để nạp thư mục 14 file JSON của API (xem STC_HUONG_DAN.md).') + '</div>' + stcFoot(null);
}

/* ---------- Thẻ chỉ tiêu (khung chung) ---------- */
function stcWarnBadge(ind) { return ind.warns.length ? '<span class="stc-bd warn" title="' + stcE(ind.warns.join(' | ')) + '">Cần đối soát</span>' : ''; }
/* Nút phóng to/thu nhỏ một thẻ biểu đồ ra toàn màn hình popup (xem stcToggleZoom/stcApplyZoom). */
function stcZoomBtn(id) {
  const on = STC_UI.zoom === id;
  return '<button type="button" class="stc-zoombtn" onclick="event.stopPropagation();stcToggleZoom(\'' + id + '\')" title="' + (on ? 'Thu nhỏ' : 'Phóng to toàn màn hình') + '" aria-label="' + (on ? 'Thu nhỏ' : 'Phóng to toàn màn hình') + '" aria-pressed="' + on + '">' + (on ? STC_ICON_ZOOMOUT : STC_ICON_ZOOMIN) + '</button>';
}
function stcCard(ind, res, sub, body, extraCls) {
  const link = stcBtnLnk('Chi tiết ›', "stcDetail('" + ind.id + "')");
  const real = (ind.state === 'ok' && !res.demo) ? '<span class="stc-bd real">Số liệu thật từ API</span>' : '';
  const warnNote = (ind.state === 'ok' && ind.warns.length) ? '<div class="stc-warnbox stc-note" style="color:var(--warn)">' + STC_ICON_WARN + '<div><b>Cần đối soát:</b> ' + ind.warns.map(stcE).join('; ') + '</div></div>' : '';
  return '<div id="stc-ind-' + ind.id + '" class="stc-card' + (STC_UI.focus === ind.id ? ' stc-focus' : '') + (STC_UI.zoom === ind.id ? ' stc-zoomed' : '') + (extraCls ? ' ' + extraCls : '') + '"><div class="stc-ch"><div><h3 class="stc-ct">' + stcE(ind.label) + '</h3><div class="stc-cs">' + stcE(sub) + '</div></div>' +
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + real + (ind.state === 'nodata' ? '<span class="stc-bd">Chưa có số liệu</span>' : '') + stcWarnBadge(ind) + link + stcZoomBtn(ind.id) + '<span class="stc-bd">' + stcE(ind.apis.join(' · ')) + '</span></div></div>' +
    (ind.state === 'missing' ? stcStateBody(ind, res) : (ind.state === 'nodata' ? stcNodataNote(res) + '<div class="stc-blank">' + body + '</div>' : body)) + warnNote + '</div>';
}
function stcSubText(ind, res, withPrev) {
  const cur = stcQ(res.year, res.period);
  const pq = stcPrevQ(res.year, res.period);
  return (withPrev ? 'Kỳ này (' + cur + ') so với kỳ trước (' + stcQ(pq.year, pq.period) + ') và cùng kỳ (' + stcQ(res.year - 1, res.period) + ') · ' : '') + ind.unit + (withPrev ? '' : ' · ' + cur);
}
/* true = hiện mũi tên so kỳ trước/so cùng kỳ cạnh số tổng ở đầu thẻ chỉ tiêu (màn nhóm). Anh yêu cầu 2026-10-02 bỏ vì
   bảng/thanh thành phần bên dưới đã có 2 cột so sánh → mặc định false (ẩn bằng cờ, code giữ nguyên). */
const STC_BIGROW_DL = false;
function stcBigRow(n, hint) {
  return '<div class="stc-bigrow"><div class="stc-big">' + stcVal(n) + '<small>' + stcE(n.unit) + '</small></div>' + (STC_BIGROW_DL ? stcDl(n, true) : '') + '</div>' + (hint ? '<div class="stc-hint">' + stcE(hint) + '</div>' : '');
}

/* ---------- Các kiểu thẻ ---------- */
function stcDonutSvg(items, total, center, unit, label) {
  const C = 2 * Math.PI * 54;
  let cum = 0, segs = '';
  items.forEach((it) => {
    if (!(it.v > 0) || !(total > 0)) return;
    const len = (it.v / total) * C, dash = Math.max(0.6, len - 2.5);
    segs += '<circle class="stc-seg" cx="80" cy="80" r="54" stroke="' + it.c + '" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="' + (-cum).toFixed(1) + '"/>';
    cum += len;
  });
  const fs = center.length > 8 ? 14 : center.length > 6 ? 17 : 21;
  return '<svg viewBox="0 0 160 160" role="img" aria-label="' + stcE(label) + '"><circle class="stc-trk" cx="80" cy="80" r="54"/><g transform="rotate(-90 80 80)">' + segs + '</g>' +
    '<text class="stc-tv" x="80" y="80" text-anchor="middle" style="font-size:' + fs + 'px">' + stcE(center) + '</text><text class="stc-tu" x="80" y="96" text-anchor="middle">' + stcE(unit) + '</text></svg>';
}
function stcKidColor(k, i) { return k.color || STC_PAL[i % STC_PAL.length]; }
/* Tiêu đề 2 cột so sánh trong bảng (rỗng nếu không mục nào so được) */
function stcCmpHeads(kids) { return stcHasCmp(kids) ? '<th>So kỳ trước</th><th>So cùng kỳ</th>' : ''; }
function stcCmpCells(k) { return '<td>' + stcDlOne(k, 'kq', false) + '</td><td>' + stcDlOne(k, 'cq', false) + '</td>'; }

function stcViewBarsCompare(ind, res) {
  const kids = ind.kids;
  const mx = Math.max(1, ...kids.map((k) => Math.max(k.now || 0, k.prev || 0)));
  let h = stcBigRow(ind, 'Tổng của ' + kids.length + ' nguồn do API cung cấp.');
  h += '<div class="stc-lg"><span><i style="background:var(--s1)"></i>Kỳ này</span><span><i style="background:var(--prev)"></i>Cùng kỳ năm trước</span></div>';
  kids.forEach((k, i) => {
    const w = (v) => (v > 0 ? Math.max(0.2, (v / mx) * 100) : 0);
    h += '<div class="stc-cmp"' + (i === 0 ? ' style="margin-top:8px"' : '') + '><div class="stc-nm">' + stcE(k.label) + '</div><div class="stc-bars">' +
      '<div class="stc-br"><div class="stc-tr"><div class="stc-b" style="width:' + w(k.now).toFixed(2) + '%"></div></div><div class="stc-val">' + stcFmt(k.now) + '</div></div>' +
      (k.prev != null ? '<div class="stc-br"><div class="stc-tr"><div class="stc-b p" style="width:' + w(k.prev).toFixed(2) + '%"></div></div><div class="stc-val p">' + stcFmt(k.prev) + '</div></div>' : '') +
      '</div>' + (stcDl(k, false) || '<span class="stc-dl flat">—</span>') + '</div>';
  });
  return h;
}
function stcViewDonutTable(ind, res) {
  const kids = ind.kids;
  const extra = ind.id === 'grdp';
  const cmpH = stcCmpHeads(kids);
  const items = kids.map((k, i) => ({ v: k.now, c: stcKidColor(k, i) }));
  const center = stcFmt(ind.now);
  let h = stcBigRow(ind, ind.id === 'grdp' ? 'Tổng của 4 khu vực theo giá hiện hành.' : ind.id === 'chi' ? 'Lấy đúng dòng "Tổng chi NS ĐP" của API; các khoản chi bên dưới cộng lại phải khớp tổng.' : 'Tổng của ' + kids.length + ' thành phần.');
  h += '<div class="stc-dn" style="margin-top:14px">' + stcDonutSvg(items, ind.now, center, ind.unit, 'Cơ cấu ' + ind.label) + '<table class="stc-tbl"><thead><tr><th>Thành phần</th><th>Giá trị</th><th>Tỷ trọng</th>' +
    cmpH + (extra ? '<th>Giá so sánh cùng kỳ năm trước</th>' : '') + '</tr></thead><tbody>';
  kids.forEach((k, i) => {
    const sh = stcShare(k, ind);
    h += '<tr><td><i class="stc-sw" style="background:' + stcKidColor(k, i) + '"></i>' + stcE(k.label) + '</td><td>' + stcFmt(k.now) + '</td><td>' + (sh == null ? '—' : stcFmt(sh, 1) + '%') + '</td>' +
      (cmpH ? stcCmpCells(k) : '') + (extra ? '<td>' + stcFmt(k.cmp) + '</td>' : '') + '</tr>';
  });
  if (extra) h += '<tr class="tot"><td>Tổng</td><td>' + stcFmt(ind.now) + '</td><td>100,0%</td>' + (cmpH ? stcCmpCells(ind) : '') + '<td>' + stcFmt(kids.every((k) => k.cmp != null) ? kids.reduce((a, k) => a + k.cmp, 0) : null) + '</td></tr>';
  h += '</tbody></table></div>';
  if (extra) h += '<div class="stc-note" style="margin-top:16px"><span class="stc-bd warn" style="flex:0 0 auto">Chờ xác nhận</span><div>Chưa rõ cột "giá so sánh cùng kỳ năm trước" là giá trị (tỷ đồng) hay tốc độ tăng (%). Form hiện <b>nguyên số API trả về</b> và chưa tính tăng trưởng GRDP.</div></div>';
  return h;
}
function stcViewStackTable(ind, res) {
  const kids = ind.kids;
  const cmpH = stcCmpHeads(kids);
  let h = stcBigRow(ind, ind.id === 'ble' ? 'Là một phần của bán ra; hai chỉ tiêu đặt cạnh nhau, không cộng gộp.' : 'Tổng của ' + kids.length + ' thành phần.' + (cmpH ? '' : ' Nguồn số liệu chưa có kỳ so sánh nên chưa hiện tăng giảm.'));
  h += '<div class="stc-stack" style="height:20px;margin:16px 0 12px">' + kids.map((k, i) => '<i style="flex:' + Math.max(0, k.now || 0) + ';background:' + stcKidColor(k, i) + '"></i>').join('') + '</div>';
  h += '<table class="stc-tbl"><thead><tr><th>Thành phần</th><th>Giá trị</th><th>Tỷ trọng</th>' + cmpH + '</tr></thead><tbody>';
  kids.forEach((k, i) => { const sh = stcShare(k, ind); h += '<tr><td><i class="stc-sw" style="background:' + stcKidColor(k, i) + '"></i>' + stcE(k.label) + '</td><td>' + stcFmt(k.now) + '</td><td>' + (sh == null ? '—' : stcFmt(sh, 1) + '%') + '</td>' + (cmpH ? stcCmpCells(k) : '') + '</tr>'; });
  h += '</tbody></table>';
  if (ind.id === 'nsnn') h += '<div style="margin-top:14px">' + stcNote('API chỉ có giá trị đã thực hiện, chưa có kế hoạch vốn, nên form <b>không tính tỷ lệ giải ngân</b>.') + '</div>';
  return h;
}
function stcViewProgress(ind, res) {
  const kids = ind.kids.slice().sort((a, b) => (b.now || 0) - (a.now || 0));
  let h = '';
  kids.forEach((k) => { h += '<div class="stc-pg"><div class="stc-row"><span class="stc-nm">' + stcE(k.label) + '</span><span class="stc-pv">' + stcFmt(k.now) + '%</span></div><div class="stc-trk"><div class="stc-fill" style="width:' + Math.max(0, Math.min(100, k.now || 0)) + '%"></div></div></div>'; });
  h += '<div style="margin-top:8px">' + stcNote('API chưa có mốc kế hoạch, nên form chỉ hiển thị tỷ lệ hoàn thành và <b>không gắn nhãn "chậm" hay "đúng tiến độ"</b>. Năm nhóm không cùng loại nên cũng không tính tiến độ trung bình.') + '</div>';
  return h;
}
function stcViewIdxAxis(ind, res) {
  const items = [ind].concat(ind.kids).filter((n) => n.now > 0);
  const vals = items.map((n) => n.now).concat([100]);
  const lo = Math.floor(Math.min(...vals) - 3), hi = Math.ceil(Math.max(...vals) + 3), span = hi - lo;
  const zero = ((100 - lo) / span) * 100;
  let h = '<div class="stc-lg" style="margin:0 0 6px"><span><i style="background:var(--s1)"></i>Cao hơn cùng kỳ</span><span><i style="background:var(--dn)"></i>Thấp hơn cùng kỳ</span></div>';
  [ind].concat(ind.kids).forEach((n) => {
    if (!(n.now > 0)) { h += '<div class="stc-iip"><div class="stc-nm">' + stcE(n.label) + '</div><div class="stc-axis"></div><div class="stc-rt"><b>—</b></div></div>'; return; }
    const left = n.now >= 100 ? zero : ((n.now - lo) / span) * 100, width = (Math.abs(n.now - 100) / span) * 100;
    h += '<div class="stc-iip"><div class="stc-nm">' + stcE(n.label) + '</div><div class="stc-axis"><div class="stc-zero" style="left:' + zero.toFixed(2) + '%"></div><div class="stc-bar ' + (n.now >= 100 ? 'up' : 'dn') + '" style="left:' + left.toFixed(2) + '%;width:' + width.toFixed(2) + '%"></div></div>' +
      '<div class="stc-rt"><b>' + stcFmt(n.now, 1) + '</b>' + stcDl(n, false) + '</div></div>';
  });
  return h;
}
function stcViewBarsDelta(ind, res) {
  const kids = ind.kids;
  const mx = Math.max(1, ...kids.map((k) => k.now || 0));
  let h = stcBigRow(ind, 'Tổng ' + kids.length + ' nhóm dịch vụ; mức tăng chung tính từ các nhóm (giả định chỉ số lấy 100 làm mốc).');
  kids.forEach((k) => {
    h += '<div class="stc-cmp" style="grid-template-columns:150px minmax(0,1fr) 150px"><div class="stc-nm">' + stcE(k.label) + '</div><div class="stc-bars"><div class="stc-br"><div class="stc-tr"><div class="stc-b" style="width:' + (k.now > 0 ? Math.max(0.2, (k.now / mx) * 100).toFixed(2) : 0) + '%"></div></div><div class="stc-val">' + stcFmt(k.now) + '</div></div></div>' + (stcDl(k, false) || '<span class="stc-dl flat">—</span>') + '</div>';
  });
  return h;
}
function stcViewXnk(ind, res) {
  const xk = ind.kids[0], nk = ind.kids[1];
  const col = (n, title) => {
    let c = '<div><div class="stc-hint" style="font-weight:600;color:var(--ink2)">' + stcE(title) + '</div><div class="stc-bigrow" style="margin-top:4px"><div class="stc-big" style="font-size:26px">' + stcVal(n) + '<small>' + stcE(n.unit) + '</small></div>' + (STC_BIGROW_DL ? stcDl(n, false) : '') + '</div>';
    c += '<div class="stc-stack">' + n.kids.map((k, i) => '<i style="flex:' + Math.max(0, k.now || 0) + ';background:' + stcKidColor(k, i) + '"></i>').join('') + '</div><table class="stc-tbl"><thead><tr><th>Khu vực</th><th>Giá trị</th><th>So kỳ trước</th><th>So cùng kỳ</th></tr></thead><tbody>';
    n.kids.forEach((k, i) => { c += '<tr><td><i class="stc-sw" style="background:' + stcKidColor(k, i) + '"></i>' + stcE(k.label) + '</td><td>' + stcFmt(k.now) + '</td>' + stcCmpCells(k) + '</tr>'; });
    return c + '</tbody></table></div>';
  };
  let h = '<div class="stc-g2" style="gap:24px">' + col(xk, 'Xuất khẩu') + col(nk, 'Nhập khẩu') + '</div>';
  if (xk.now != null && nk.now != null) {
    const bal = xk.now - nk.now, mx = Math.max(xk.now, nk.now, 1);
    h += '<div class="stc-note" style="margin-top:18px;align-items:center;justify-content:space-between;gap:24px"><div style="flex:1;min-width:0"><div class="stc-hint" style="margin-bottom:2px">Cán cân thương mại (xuất khẩu trừ nhập khẩu)</div><div style="font-size:18px;font-weight:700;color:var(--ink)">' + (bal < 0 ? 'Nhập siêu ' : bal > 0 ? 'Xuất siêu ' : 'Cân bằng ') + stcFmt(Math.abs(bal)) + ' ' + stcE(ind.unit) + '</div></div>' +
      '<div style="width:210px;display:grid;gap:6px;flex:0 0 auto"><div style="display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:center;font-size:11px"><span>XK</span><div style="height:8px;border-radius:0 4px 4px 0;background:var(--s1);width:' + ((xk.now / mx) * 100).toFixed(1) + '%"></div></div><div style="display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:center;font-size:11px"><span>NK</span><div style="height:8px;border-radius:0 4px 4px 0;background:var(--prev);width:' + ((nk.now / mx) * 100).toFixed(1) + '%"></div></div></div></div>';
  }
  return h;
}
function stcViewScales(ind, res) {
  let h = '<div class="stc-g3">';
  ind.kids.forEach((k) => {
    const v = k.now, lo = Math.min(80, Math.floor((v || 0) / 10) * 10 - 10), hi = Math.max(120, Math.ceil(((v || 0) + 10) / 20) * 20), span = hi - lo;
    h += '<div id="stc-ind-' + k.id + '" class="stc-card' + (STC_UI.zoom === k.id ? ' stc-zoomed' : '') + '"><div class="stc-ch"><div><h3 class="stc-ct">' + stcE(k.label) + '</h3><div class="stc-cs">' + stcE(ind.unit) + '</div></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + stcZoomBtn(k.id) + '<span class="stc-bd">' + stcE(ind.apis[0]) + '</span></div></div>';
    if (!(v > 0)) h += '<div class="stc-bigrow"><div class="stc-big">—</div></div><div class="stc-hint">Chưa có số liệu</div>';
    else h += '<div class="stc-bigrow"><div class="stc-big">' + stcFmt(v, 1) + '</div>' + stcDl(k, true) + '</div><div class="stc-scale"><div class="stc-tick" style="left:' + (((100 - lo) / span) * 100).toFixed(2) + '%"></div><div class="stc-dot" style="left:' + (((v - lo) / span) * 100).toFixed(2) + '%"></div></div><div class="stc-scale-cap"><span>' + lo + '</span><span>Vạch đứng: mốc 100</span><span>' + hi + '</span></div>';
    h += '</div>';
  });
  return h + '</div>';
}

const STC_VIEWS = { barsCompare: stcViewBarsCompare, donutTable: stcViewDonutTable, stackTable: stcViewStackTable, progress: stcViewProgress, idxAxis: stcViewIdxAxis, barsDelta: stcViewBarsDelta, xnk: stcViewXnk, scales: stcViewScales };
const STC_VIEW_SUB = { barsCompare: (i, r) => stcSubText(i, r, true), donutTable: (i, r) => stcSubText(i, r, i.kids.some((k) => k.prev > 0)), stackTable: (i, r) => stcSubText(i, r, false), progress: (i, r) => 'Tỷ lệ hoàn thành (%) · ' + stcQ(r.year, r.period) + ' · xếp từ cao xuống thấp', idxAxis: (i, r) => 'So với cùng kỳ năm trước · vạch đứng là mốc 100 (bằng cùng kỳ)', barsDelta: (i, r) => 'Ước tính quý · ' + i.unit, xnk: (i, r) => 'Ước tính quý · ' + i.unit + ' · so với cùng kỳ', scales: (i, r) => 'So với cùng kỳ năm trước (100 = bằng cùng kỳ)' };

function stcIndCard(id, res) {
  const ind = res.byId[id];
  if (!ind) return '';
  if (ind.view === 'scales') {
    /* Chỉ số giá: 3 thẻ riêng, mỗi thẻ một thang riêng (vàng 187 và CPI 103 không đặt chung một biểu đồ) */
    const secT = '<div class="stc-sec">Chỉ số giá · so với cùng kỳ năm trước (100 = bằng cùng kỳ)</div>';
    const fc = '<div id="stc-ind-gia"' + (STC_UI.focus === 'gia' ? ' class="stc-focus"' : '') + '>';
    if (ind.state === 'ok') return fc + secT + stcViewScales(ind, res) + '</div>';
    if (ind.state === 'nodata') return fc + secT + stcNodataNote(res) + '<div class="stc-blank" style="margin-top:12px">' + stcViewScales(stcBlank(ind), res) + '</div></div>';
    return stcCard(ind, res, STC_VIEW_SUB.scales(ind, res), '');
  }
  const v = ind.state === 'nodata' ? stcBlank(ind) : ind;
  return stcCard(ind, res, STC_VIEW_SUB[ind.view](v, res), STC_VIEWS[ind.view](v, res));
}

/* ---------- Màn: Trang chủ ---------- */
/* onclick tuỳ chỗ dùng: mặc định (trong popup) chuyển màn bằng stcGo; ngoài lưới (stcOverviewBandHtml) mở thẳng
   popup đúng nhóm bằng openCategoryDetail vì popup chưa mở. */
function stcKpiTile(k, res, onclick) {
  const n = res.byId[k.ind], root = res.rootOf[k.ind];
  const has = root && root.state === 'ok' && n && n.now != null;
  let v = '—', u = 'Chưa có số liệu', d = '';
  if (has) {
    if (k.fmt === 'nghinTy') { v = stcFmt(n.now / 1000, 1); u = 'nghìn tỷ đồng'; }
    else if (k.fmt === 'trieuLuot') { v = stcFmt(n.now / 1000, 2); u = 'triệu lượt'; }
    else { v = stcFmt(n.now, 1); u = '% so với cùng kỳ'; }
    /* 2 cột: so kỳ trước | so cùng kỳ (không tính được thì "—", rê chuột xem lý do) */
    d = '<div class="stc-kdl"><div><small>So kỳ trước</small>' + stcDlOne(n, 'kq', false) + '</div><div><small>So cùng kỳ</small>' + stcDlOne(n, 'cq', false) + '</div></div>';
  }
  return '<button type="button" class="stc-kpi" onclick="' + (onclick || ("stcGo('group','" + k.target + "')")) + '"><div class="stc-lb">' + stcE(k.label) + '</div><div class="stc-v">' + v + '</div><div class="stc-u">' + stcE(u) + '</div><div class="stc-dlw" style="min-height:18px">' + d + '</div></button>';
}
/* Một dòng trong thẻ nhóm: nhãn, giá trị + đơn vị, tăng giảm */
function stcLine(label, n, root, unitOverride, valOverride) {
  const ok = root.state === 'ok' && (valOverride != null || (n && n.now != null));
  const val = !ok ? '—' : (valOverride != null ? valOverride : stcVal(n));
  const unit = ok ? (unitOverride != null ? unitOverride : (n.kind === 'idx' ? '%' : n.unit)) : '';
  const cmp = ok && n && valOverride == null;
  return '<div class="stc-gl stc-glc"><span>' + stcE(label) + '</span><span class="stc-v">' + val + (unit ? '<small>' + stcE(unit) + '</small>' : '') + '</span>' +
    '<span class="stc-dlw">' + (cmp ? stcDlOne(n, 'kq', false) : '') + '</span><span class="stc-dlw">' + (cmp ? stcDlOne(n, 'cq', false) : '') + '</span></div>';
}
/* onclick tuỳ chỗ dùng: mặc định (trong popup) chuyển màn bằng stcGo; ngoài lưới (stcOverviewBandHtml) mở thẳng
   popup đúng nhóm bằng openCategoryDetail vì popup chưa mở (giống stcKpiTile). */
function stcGroupCardHome(g, gi, res, onclick) {
  const lines = [];
  g.inds.forEach((ind) => {
    if (ind.id === 'gia') { ind.kids.forEach((k) => lines.push(stcLine(k.label, k, ind))); return; }
    if (ind.id === 'da') { lines.push(stcLine(ind.label, ind, ind, 'nhóm' + (res.demo ? '' : ' · số thật'), ind.kids.length + '')); return; }
    if (ind.id === 'xnk') {
      const xk = ind.kids[0], nk = ind.kids[1], ok = ind.state === 'ok' && xk.now != null && nk.now != null;
      lines.push(stcLine('Kim ngạch xuất nhập khẩu (cán cân)', null, ind, ind.unit, ok ? stcSgn(xk.now - nk.now, 0) : null));
      return;
    }
    lines.push(stcLine(ind.label, ind, ind));
  });
  return '<button type="button" class="stc-gcard" onclick="' + (onclick || ("stcGo('group','" + g.id + "')")) + '"><div class="stc-gh"><h3>' + stcE(g.label) + '</h3><span>' + g.inds.length + ' chỉ tiêu</span></div>' +
    '<div class="stc-gl stc-glc stc-glh"><span></span><span></span><span>So kỳ trước</span><span>So cùng kỳ</span></div>' + lines.join('') + '<div class="stc-gmore">Xem nhóm ' + stcE(g.label) + ' ›</div></button>';
}
/* Ghi chú "x/y chỉ tiêu có số liệu" ở cuối màn Trang chủ — dùng chung cho cả trong popup và băng ngoài lưới. */
function stcHomeQualityNote(res) {
  const withData = res.inds.filter((i) => i.state === 'ok').length;
  if (withData >= res.inds.length) return '';
  return '<div style="margin-top:16px">' + stcNote('<b>' + withData + '/' + res.inds.length + ' chỉ tiêu có số liệu</b> trong bản chụp này. Các chỉ tiêu còn lại hiện "—" vì API của Sở Tài chính đang trả giá trị 0 cho kỳ này (chưa cập nhật số quyết toán); form không điền số thay thế.') + '</div>';
}
function stcScreenHome(res) {
  const o = { eyebrow: 'Sở Tài chính · Chỉ tiêu kinh tế – tài chính', title: 'Bộ chỉ tiêu kinh tế – tài chính Thủ đô', sub: 'Số liệu tổng hợp cấp Thành phố từ API của Sở Tài chính Hà Nội.', back: 'close' };
  if (!res) return stcNoPeriodScreen(o);
  let h = stcHeader(res, o);
  h += '<div class="stc-kpis">' + STC_KPIS.map((k) => stcKpiTile(k, res)).join('') + '</div>';
  h += '<div class="stc-secrow"><div class="stc-sec">Bốn nhóm chỉ tiêu · mỗi nhóm một màn hình</div>' + stcBtnLnk('Xem chi tiết theo cấp bậc ›', "stcDetail('" + STC_UI.ind + "')") + '</div>';
  h += '<div class="stc-g2">' + res.groups.map((g, i) => stcGroupCardHome(g, i, res)).join('') + '</div>';
  return h + stcHomeQualityNote(res) + stcFoot(res);
}

/* ---------- Màn: 4 nhóm ---------- */
const STC_LAYOUT = {
  ns: [{ k: 'g2', c: ['thu', 'chi'] }],
  dt: [{ k: 'g2', c: ['vdt', 'nsnn'] }, { k: 'full', c: ['da'] }],
  sx: [{ k: 'g21', c: ['iip', 'vt'] }, { k: 'g2', c: ['bra', 'ble'] }, { k: 'g21', c: ['xnk', 'dl'] }],
  vm: [{ k: 'full', c: ['grdp'] }, { k: 'full', c: ['gia'] }]
};
function stcBackToGroup() {
  const g = STC_GROUPS.find((x) => x.inds.indexOf(STC_UI.ind) >= 0);
  return g ? { group: g.id, label: g.label } : null;
}
function stcScreenGroup(res) {
  const gi = STC_GROUPS.findIndex((g) => g.id === STC_UI.group);
  const g = STC_GROUPS[gi < 0 ? 0 : gi];
  const o = { eyebrow: 'Sở Tài chính · Nhóm ' + (gi + 1) + '/' + STC_GROUPS.length, title: g.label, sub: g.inds.length + ' chỉ tiêu · Kỳ báo cáo Quý ' + STC_UI.period + '/' + STC_UI.year, back: 'home' };
  if (!res) return stcNoPeriodScreen(o);
  let h = stcHeader(res, o);
  STC_LAYOUT[g.id].forEach((row, ri) => {
    const cards = row.c.map((id) => stcIndCard(id, res)).join('');
    h += row.k === 'full' ? '<div' + (ri ? ' style="margin-top:16px"' : '') + '>' + cards + '</div>' : '<div class="stc-' + row.k + (ri ? ' stc-mt' : '') + '">' + cards + '</div>';
  });
  if (g.id === 'ns') h += '<div class="stc-mt">' + stcNote('<b>Cách đọc:</b> thu NSNN là thu trên địa bàn, còn chi là chi của ngân sách địa phương. Hai chỉ tiêu khác phạm vi nên form không tính "thu trừ chi". Chi tăng được hiển thị màu trung tính vì tăng chi chưa hẳn là tốt hay xấu; chỉ thu và các chỉ số tăng trưởng mới dùng màu xanh.') + '</div>';
  if (g.id === 'sx') h += '<div class="stc-mt">' + stcNote(stcE(STC_ASSUME.ckNote)) + '</div>';
  if (g.id === 'vm' && res.byId.gia.state === 'ok') h += '<div class="stc-mt">' + stcNote('Ba chỉ số có mức chênh rất khác nhau nên mỗi thẻ dùng <b>thang riêng</b> thay vì vẽ chung một biểu đồ cột. Chỉ có dữ liệu một kỳ nên form chưa vẽ đường xu hướng.') + '</div>';
  const n = STC_GROUPS.length, prev = STC_GROUPS[(gi + n - 1) % n], next = STC_GROUPS[(gi + 1) % n];
  h += '<div class="stc-pn"><span>' + stcBtnLnk('‹ ' + prev.label, "stcGo('group','" + prev.id + "')") + '</span>' + stcBtnLnk('Tổng quan', "stcGo('home')") + '<span>' + stcBtnLnk(next.label + ' ›', "stcGo('group','" + next.id + "')") + '</span></div>';
  return h + stcFoot(res);
}

/* ---------- Màn: Chi tiết theo cấp bậc (kiểu A) ---------- */
function stcOcCard(n, parent, idx, level) {
  const yv = stcYoy(n), sh = stcShare(n, parent), pct = n.kind === 'pct';
  let sub = '';
  if (sh != null) sub = stcFmt(sh, 1) + '% ' + (level === 1 ? 'của tổng' : 'của ' + parent.label.toLowerCase());
  else if (pct) sub = 'hoàn thành';
  else if (n.kind === 'idx') sub = 'chỉ số, 100 = bằng cùng kỳ';
  const hasBar = sh != null || pct;
  const barW = pct ? n.now : Math.max(sh || 0, 0.5);
  const sel = STC_UI.pick === n.id ? ' sel' : '';
  return '<button type="button" class="stc-oc-card' + sel + '" style="--cc:' + stcKidColor(n, idx) + '" onclick="stcPick(\'' + n.id + '\')"><div class="stc-nm">' + stcE(n.label) + '</div><div class="stc-v">' + stcVal(n) + '</div><div class="stc-sh">' + stcE(sub) + '</div>' +
    (hasBar ? '<div class="stc-bar"><i style="width:' + Math.max(0, Math.min(100, barW)).toFixed(2) + '%"></i></div>' : '') + stcDl(n, true) + '</button>';
}
function stcPosOf(i, n) { return n === 1 ? 'first last' : i === 0 ? 'first' : i === n - 1 ? 'last' : ''; }
function stcOcDiagram(ind) {
  const kids = ind.kids;
  const hasTotal = ind.now != null || (ind.state === 'blank' && ind.kind !== 'container');
  let h = '<div class="stc-oc"><div class="stc-oc-root"><div class="stc-k">' + stcE(ind.label) + '</div><div class="stc-v"><span>' + (hasTotal ? stcVal(ind) : kids.length + ' thành phần') + '</span>' + (hasTotal ? '<small>' + stcE(ind.unit) + '</small>' : '') + '</div>' + (ind.now != null ? stcDl(ind, true) : '') + '</div><div class="stc-oc-stem"></div><div class="stc-oc-row">';
  kids.forEach((k, i) => {
    const sub = k.kids || [];
    h += '<div class="stc-oc-c ' + stcPosOf(i, kids.length) + '" style="flex:' + Math.max(1, sub.length) + '">' + stcOcCard(k, ind, i, 1);
    if (sub.length) h += '<div class="stc-oc-stem"></div><div class="stc-oc-row">' + sub.map((g, j) => '<div class="stc-oc-c ' + stcPosOf(j, sub.length) + '">' + stcOcCard(g, k, j, 2) + '</div>').join('') + '</div>';
    h += '</div>';
  });
  return h + '</div></div>';
}

function stcNiceStep(range) {
  const p = Math.pow(10, Math.floor(Math.log10(range / 5)));
  let step = 10 * p;
  [1, 2, 5, 10].some((m) => { if (range / (m * p) <= 5) { step = m * p; return true; } return false; });
  return step;
}
function stcWaterfall(ind, node, res) {
  let base = ind;
  if (node && node !== ind) base = (node.kids && node.kids.length) ? node : (res.byId[stcParentId(res, node)] || ind);
  const sub = base.label;
  if (base.kind === 'container' && base.id === 'xnk') return { ok: false, sub: sub, msg: 'Xuất nhập khẩu gồm hai tổng riêng. Bấm thẻ Xuất khẩu hoặc Nhập khẩu ở sơ đồ để xem cầu nối của từng khối.' };
  const kp = (base.kids || []).map(stcPrev);
  if (base.kind !== 'add' || !base.kids || !base.kids.length || !kp.every((v) => v != null)) {
    return { ok: false, sub: sub, msg: base.kind === 'add' ? 'API chưa có kỳ so sánh cho chỉ tiêu này nên chưa vẽ được cầu nối.' : 'Chỉ tiêu dạng chỉ số hoặc tỷ lệ không cộng dồn được nên không có cầu nối.' };
  }
  const prevTotal = kp.reduce((a, b) => a + b, 0), nowTotal = base.kids.reduce((a, k) => a + (k.now || 0), 0);
  const G = nowTotal - prevTotal;
  /* Trục dọc phải bao cả các bậc trung gian: thành phần tăng/giảm bù trừ nhau có thể vượt xa tổng hai kỳ */
  const pts = [prevTotal, nowTotal]; let c0 = prevTotal;
  base.kids.forEach((k, i) => { c0 += (k.now || 0) - kp[i]; pts.push(c0); });
  const lo0 = Math.min(...pts), hi0 = Math.max(...pts), span = Math.max(hi0 - lo0, Math.abs(G)) || 1;
  const half = Math.pow(10, Math.floor(Math.log10(span))) / 2;
  let floor = Math.floor((lo0 - 0.5 * span) / half) * half;
  if (floor < 0) floor = 0;
  const ceil = Math.ceil((hi0 + 0.15 * span) / half) * half;
  const range = ceil - floor || 1, step = stcNiceStep(range);
  const H = 220, W = 1000, sc = (v) => ((v - floor) / range) * H;
  const n = base.kids.length + 2, colW = W / n, barW = Math.min(70, colW * 0.56);
  const fI = (v) => stcFmt(Math.round(v)), sI = (v) => stcSgn(Math.round(v), 0);
  const steps = [{ id: '', label: 'Cùng kỳ năm trước', from: floor, to: prevTotal, color: 'var(--prev)', val: fI(prevTotal) }];
  let cum = prevTotal;
  base.kids.forEach((k, i) => { const inc = (k.now || 0) - kp[i]; steps.push({ id: k.id, label: k.label, from: cum, to: cum + inc, color: stcKidColor(k, i), val: sI(inc) }); cum += inc; });
  steps.push({ id: '', label: 'Kỳ này', from: floor, to: nowTotal, color: 'var(--ink2)', val: fI(nowTotal) });
  let bars = '', labels = '', grid = '';
  steps.forEach((s, i) => {
    const left = i * colW + (colW - barW) / 2, lo = Math.min(s.from, s.to), h = Math.max(2, Math.abs(sc(s.to) - sc(s.from)));
    bars += '<div class="stc-bar2' + (s.id && s.id === STC_UI.pick ? ' sel' : '') + '" style="left:' + left.toFixed(1) + 'px;bottom:' + sc(lo).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px;background:' + s.color + '"></div>' +
      '<div class="stc-vl2" style="left:' + left.toFixed(1) + 'px;bottom:' + (sc(lo) + h + 6).toFixed(1) + 'px;width:' + barW.toFixed(1) + 'px">' + stcE(s.val) + '</div>' +
      (i < steps.length - 1 ? '<div class="stc-cn" style="left:' + (left + barW).toFixed(1) + 'px;bottom:' + sc(s.to).toFixed(1) + 'px;width:' + (colW - barW).toFixed(1) + 'px"></div>' : '');
    labels += '<span style="width:' + colW.toFixed(1) + 'px">' + stcE(s.label) + '</span>';
  });
  for (let v = Math.ceil(floor / step) * step; v <= ceil; v += step) grid += '<div class="stc-gl2" style="bottom:' + sc(v).toFixed(1) + 'px"></div><div class="stc-gt" style="bottom:' + sc(v).toFixed(1) + 'px">' + stcFmt(Math.round(v)) + '</div>';
  const derived = base.kids.some((k) => k.cqSrc === 'ck');
  const note = 'Cột xám xanh là tổng hai kỳ; cột màu là phần tăng thêm của từng thành phần, cộng lại đúng bằng mức thay đổi chung (' + sI(G) + ').' + (floor > 0 ? ' Trục dọc cắt từ ' + fI(floor) + ' để thấy rõ các bậc.' : '') + (derived ? ' Số cùng kỳ của từng thành phần được suy ra từ chỉ số so cùng kỳ (giả định chỉ số lấy 100 làm mốc).' : '');
  return { ok: true, sub: sub + ' · ' + (base.unit || (res.rootOf[base.id] && res.rootOf[base.id].unit) || '') + ' · từ cùng kỳ năm trước (' + stcQ(res.year - 1, res.period) + ') sang kỳ này', grid: grid, bars: bars, labels: labels, note: note };
}
function stcParentId(res, node) {
  let pid = null;
  stcWalk(res.rootOf[node.id], (n) => { if ((n.kids || []).some((k) => k.id === node.id)) pid = n.id; });
  return pid;
}
/* Xu hướng: 5 ô quý kết thúc ở kỳ đang chọn; chỉ vẽ điểm khi bản chụp có số, KHÔNG nội suy */
function stcTrend(node, res) {
  const y = res.year, p = res.period;
  const slots = [];
  for (let i = 0; i < 5; i++) {
    const qi = p + i;
    let yy = y - 1, qq = qi;
    if (qi > 4) { yy = y; qq = qi - 4; }
    if (i === 4) { yy = y; qq = p; }
    let v = null;
    if (i === 0) v = stcPrev(node);
    else if (i === 4) v = node.now;
    else { const r = stcBuildPeriod(yy, qq); const nn = r && r.byId[node.id]; v = nn && r.rootOf[node.id].state === 'ok' && nn.now != null ? nn.now : null; }
    slots.push({ label: stcQ(yy, qq), v: v });
  }
  const pts = slots.map((s, i) => ({ i: i, v: s.v })).filter((s) => s.v != null);
  if (pts.length < 2) return null;
  const vs = pts.map((s) => s.v), mn = Math.min(...vs), mx = Math.max(...vs);
  const span = (mx - mn) || Math.max(mx, 1) * 0.2, lo = Math.max(0, mn - span * 0.8), hi = mx + span * 0.5;
  const yOf = (v) => 30 + (1 - (v - lo) / (hi - lo)) * 160, xOf = (i) => 70 + i * 105;
  const mid = (lo + hi) / 2, dd = hi < 30 ? 1 : 0;
  let s = '<svg viewBox="0 0 560 250" style="width:100%;height:auto;display:block" role="img" aria-label="Xu hướng theo quý"><g stroke="var(--line)" stroke-width="1">';
  [hi, mid, lo].forEach((v) => { s += '<line x1="70" y1="' + yOf(v).toFixed(1) + '" x2="530" y2="' + yOf(v).toFixed(1) + '"/>'; });
  s += '</g>';
  [hi, mid, lo].forEach((v) => { s += '<text class="stc-ax" x="60" y="' + (yOf(v) + 4).toFixed(1) + '" text-anchor="end">' + stcFmt(v, dd) + '</text>'; });
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1], adjacent = b.i - a.i === 1;
    s += '<line x1="' + xOf(a.i) + '" y1="' + yOf(a.v).toFixed(1) + '" x2="' + xOf(b.i) + '" y2="' + yOf(b.v).toFixed(1) + '" stroke="var(--ink2)" stroke-width="2" ' + (adjacent ? '' : 'stroke-dasharray="5 5" ') + 'stroke-linecap="round"/>';
  }
  slots.forEach((sl, i) => { if (sl.v == null) s += '<circle cx="' + xOf(i) + '" cy="190" r="3.5" fill="none" stroke="var(--mute)" stroke-width="1.5"/>'; });
  pts.forEach((pt) => {
    s += '<circle cx="' + xOf(pt.i) + '" cy="' + yOf(pt.v).toFixed(1) + '" r="7" fill="' + (pt.i === 4 ? 'var(--s1)' : 'var(--prev)') + '" stroke="var(--card)" stroke-width="2"/><text class="stc-vl" x="' + (pt.i === 0 ? xOf(pt.i) + 12 : xOf(pt.i)) + '" y="' + (yOf(pt.v) - 14).toFixed(1) + '" text-anchor="' + (pt.i === 0 ? 'start' : 'middle') + '">' + stcFmt(Math.round(pt.v)) + '</text>';
  });
  slots.forEach((sl, i) => { s += '<text class="stc-ax" x="' + xOf(i) + '" y="214" text-anchor="middle">' + stcE(sl.label) + '</text>'; });
  return { svg: s + '</svg>', gaps: pts.length < 5 };
}
function stcCollectRows(node) {
  const seen = [], out = [];
  stcWalk(node, (n) => { (n.rows || []).forEach((r) => { if (seen.indexOf(r) < 0) { seen.push(r); out.push(r); } }); });
  return out;
}
function stcFormulas(ind, node, res) {
  const F = ['Nguồn: API ' + ind.apis.join(' + ') + '.'];
  const parentId = node.id === ind.id ? null : stcParentId(res, node);
  const par = parentId ? res.byId[parentId] : null;
  if (node.kids && node.kids.length && node.kind === 'add' && node.now != null && node.kids.every((k) => k.now != null)) {
    const s = node.kids.reduce((a, k) => a + k.now, 0);
    F.push('Tổng = ' + node.kids.map((k) => stcFmt(k.now)).join(' + ') + ' = ' + stcFmt(s) + (s === node.now ? ' (khớp số của API).' : ' (lệch ' + stcFmt(s - node.now) + ' so với số của API, cần đối soát).'));
  }
  const pv = stcPrev(node);
  const dk = stcDeltaKq(node);
  if (dk != null) {
    const uk = stcDeltaUnit(node, 'kq');
    F.push('So với kỳ trước (quý liền trước, ' + node.kqLbl + ') = ' + (uk === '%' ? stcFmt(node.now) + ' ÷ ' + stcFmt(node.kq) + ' − 1 = ' + stcSgn(dk, 1) + '%.' : stcFmt(node.now, 1) + ' − ' + stcFmt(node.kq, 1) + ' = ' + stcSgn(dk, 1) + ' ' + uk + '.'));
  } else if (node.now != null) F.push('So với kỳ trước (quý liền trước, ' + node.kqLbl + '): chưa có số liệu của quý đó nên chưa tính.');
  if (node.kind === 'pct' && node.now != null && node.cq != null) F.push('So với cùng kỳ năm trước (' + node.cqLbl + ') = ' + stcFmt(node.now, 1) + ' − ' + stcFmt(node.cq, 1) + ' = ' + stcSgn(stcDeltaCq(node), 1) + ' điểm %.');
  else if (node.now != null && pv != null && node.kind !== 'idx') {
    if (node.cqSrc !== 'ck') F.push('So với cùng kỳ năm trước (' + node.cqLbl + ') = ' + stcFmt(node.now) + ' ÷ ' + stcFmt(pv) + ' − 1 = ' + stcSgn(stcDeltaCq(node), 1) + '%.');
    else F.push('So với cùng kỳ = chỉ số ' + stcFmt(node.ck, 1) + ' − 100 = ' + stcSgn(node.ck - 100, 1) + '%' + (node.derivedCk ? ' (suy từ các thành phần)' : '') + ' (giả định chỉ số lấy 100 làm mốc).');
  } else if (node.kind === 'idx' && node.now > 0) F.push('So với cùng kỳ = chỉ số ' + stcFmt(node.now, 1) + ' − 100 = ' + stcSgn(node.now - 100, 1) + '% (giả định chỉ số lấy 100 làm mốc).');
  if (par && par.kind === 'add' && node.now != null && par.now > 0) {
    F.push('Tỷ trọng = ' + stcFmt(node.now) + ' ÷ ' + stcFmt(par.now) + ' = ' + stcFmt((node.now / par.now) * 100, 1) + '%.');
    const pp = par.kids.every((k) => stcPrev(k) != null) ? par.kids.reduce((a, k) => a + stcPrev(k), 0) : null;
    if (pv != null && pp) F.push('Đóng góp vào mức tăng = (' + stcFmt(Math.round(node.now)) + ' − ' + stcFmt(Math.round(pv)) + ') ÷ ' + stcFmt(Math.round(pp)) + ' = ' + stcFmt(((node.now - pv) / pp) * 100, 1) + ' điểm %.');
  }
  if (node.kind === 'pct') F.push('Tỷ lệ hoàn thành lấy nguyên số của API. Năm nhóm không cùng loại và chưa có mốc kế hoạch nên không tính trung bình, không gắn nhãn chậm hay đúng tiến độ.');
  if (F.length === 1) F.push('Mục này chỉ để nhóm các thành phần, không có công thức riêng.');
  return F;
}
function stcScreenDetail(res) {
  const o = { eyebrow: 'Sở Tài chính · Chi tiết theo cấp bậc', title: 'Chi tiết chỉ tiêu', sub: 'Sơ đồ cho thấy tổng và các thành phần; bấm vào một thẻ để xem cầu nối, xu hướng, số liệu gốc và cách tính của thẻ đó. Dùng nút Trước / Sau để chuyển chỉ tiêu.', back: stcBackToGroup() };
  if (!res) return stcNoPeriodScreen(o);
  const ind = res.byId[STC_UI.ind] && res.rootOf[STC_UI.ind] === res.byId[STC_UI.ind] ? res.byId[STC_UI.ind] : res.byId.chi;
  const pn = STC_UI.pick && res.byId[STC_UI.pick] && res.rootOf[STC_UI.pick] === ind ? res.byId[STC_UI.pick] : null;
  const node = pn || ind;
  const grp = STC_GROUPS.find((g) => g.inds.indexOf(ind.id) >= 0);
  const at = STC_INDICATORS.findIndex((i) => i.id === ind.id);
  const prevI = STC_INDICATORS[(at - 1 + STC_INDICATORS.length) % STC_INDICATORS.length], nextI = STC_INDICATORS[(at + 1) % STC_INDICATORS.length];
  let h = stcHeader(res, o);
  h += '<div style="display:grid;gap:16px;min-width:0">';

  /* 1. Sơ đồ thẻ số */
  h += '<div class="stc-card"><div class="stc-crumbs"><span>Sở Tài chính › ' + stcE(grp ? grp.label : '') + ' › ' + stcE(ind.label) + '</span></div>' +
    '<div class="stc-ch" style="margin-bottom:6px"><div><h3 class="stc-ct" style="font-size:17px">' + stcE(ind.label) + '</h3><div class="stc-cs">' + stcE(ind.unit + ' · ' + stcQ(res.year, res.period)) + '</div></div>' +
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end"><span class="stc-hint">' + (at + 1) + ' / ' + STC_INDICATORS.length + '</span><button type="button" class="stc-btn" onclick="stcStep(-1)" aria-label="Chỉ tiêu trước" style="height:32px;padding:0 12px;font-size:12.5px">‹ Trước</button><button type="button" class="stc-btn" onclick="stcStep(1)" aria-label="Chỉ tiêu sau" style="height:32px;padding:0 12px;font-size:12.5px">Sau ›</button>' + stcWarnBadge(ind) + '<span class="stc-bd">' + stcE(ind.apis.join(' · ')) + '</span></div></div>';
  if (ind.state === 'ok') h += '<div class="stc-hint" style="margin-bottom:6px">Bấm một thẻ để chọn, bấm lại để bỏ chọn. Chỉ tiêu 3 cấp mọc thêm hàng thẻ ngay dưới thẻ cha.</div>' + stcOcDiagram(ind);
  else if (ind.state === 'nodata') h += stcNodataNote(res) + '<div class="stc-blank" style="margin-top:12px">' + stcOcDiagram(stcBlank(ind)) + '</div>';
  else h += stcStateBody(ind, res);
  if (ind.state === 'ok' && ind.warns.length) h += '<div class="stc-warnbox stc-note" style="color:var(--warn)">' + STC_ICON_WARN + '<div><b>Cần đối soát:</b> ' + ind.warns.map(stcE).join('; ') + '</div></div>';
  h += '</div>';

  const live = ind.state === 'ok';
  if (ind.state !== 'missing') {
    /* 2. Cầu nối */
    const wf = live ? stcWaterfall(ind, node, res) : { ok: false, sub: node.label, msg: 'Chưa có số liệu nên chưa vẽ được cầu nối tăng giảm. Khi có số cho cả hai kỳ, cầu nối sẽ hiện ở đây.' };
    h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cầu nối tăng giảm</h3><div class="stc-cs">' + stcE(wf.sub) + '</div></div></div>';
    h += wf.ok ? '<div class="stc-wf">' + wf.grid + wf.bars + '</div><div class="stc-wfl">' + wf.labels + '</div><div class="stc-hint" style="margin-top:12px">' + stcE(wf.note) + '</div>' : stcEmptyBox('Chưa vẽ được cầu nối', wf.msg);
    h += '</div>';
    /* 3. Xu hướng | Số liệu gốc */
    const tr = live ? stcTrend(node, res) : null;
    h += '<div class="stc-g2"><div class="stc-card"><div class="stc-ch" style="margin-bottom:8px"><div><h3 class="stc-ct">Xu hướng theo quý</h3><div class="stc-cs">' + stcE(node.label) + '</div></div></div>' +
      (tr ? tr.svg + '<div class="stc-hint" style="margin-top:6px">Chỉ vẽ điểm khi bản chụp có số của quý đó. Quý chưa có để trống và <b>không nội suy</b>; nét đứt chỉ nối các điểm cách nhau. Nạp thêm kỳ thì điểm tự vẽ thêm.</div>' : stcEmptyBox('Chưa vẽ được xu hướng', live ? 'Cần ít nhất hai kỳ có số. Mục này chưa có giá trị cùng kỳ năm trước hoặc chưa có bản chụp của các quý khác.' : 'Chưa có số liệu để vẽ xu hướng. Khi có số, các quý có bản chụp sẽ hiện thành điểm.')) + '</div>';
  } else h += '<div>';
  const rows = stcCollectRows(node);
  h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Số liệu gốc từ API</h3><div class="stc-cs">' + stcE(node.label) + '</div></div></div><div class="stc-rawh"><span>chiTieu</span><span>loai</span><span>giaTri</span><span>quy</span></div>';
  h += rows.length ? rows.map((r) => '<div class="stc-rawrow"><span>' + stcE(r.chiTieu) + '</span><span>' + stcE(r.loai) + '</span><span>' + stcE(stcFmt(r.giaTri, Math.round(r.giaTri) === r.giaTri ? 0 : 1)) + '</span><span>' + stcE(r.quy) + '</span></div>').join('') : '<div class="stc-hint" style="padding:10px 6px">Mục này không có dòng API riêng: form cộng từ các mục bên dưới.</div>';
  h += '<div class="stc-hint" style="margin-top:12px">Đúng như API trả về trong bản chụp (' + stcE(stcStampText(res.importedAt)) + ').</div></div></div>';

  /* 4. Cách tính */
  /* Khối Cách tính ẨN theo cờ chung SHOW_FORMULA_BOX (dashboard-vhtt.js): cách tính để trong tài liệu mô tả, không hiện trên giao diện */
  if (typeof SHOW_FORMULA_BOX === 'undefined' || SHOW_FORMULA_BOX) h += '<div class="stc-card"><div class="stc-ch" style="margin-bottom:10px"><div><h3 class="stc-ct">Cách tính · ' + stcE(node.label) + '</h3><div class="stc-cs">Công thức tính từ số API, không có số nào tự đặt</div></div></div><div class="stc-fl">' +
    (live ? stcFormulas(ind, node, res) : ['Nguồn: API ' + ind.apis.join(' + ') + '.', 'API trả toàn bộ giá trị bằng 0 nên chưa tính được tổng, mức tăng giảm, tỷ trọng và đóng góp. Công thức sẽ hiện ở đây khi có số.']).map((t) => '<div class="stc-note" style="padding:9px 12px;font-size:12.5px">' + stcE(t) + '</div>').join('') + '</div></div>';
  h += '</div>';
  h += '<div class="stc-pn"><button type="button" class="stc-btn" onclick="stcStep(-1)"><span>‹</span><span>' + stcE(prevI.label) + '</span></button><button type="button" class="stc-btn" onclick="stcStep(1)"><span>' + stcE(nextI.label) + '</span><span>›</span></button></div>';
  return h + stcFoot(res);
}

/* ---------- Dựng màn hình + điều khiển ---------- */
/* Khung chờ khi đang nạp nguồn số liệu */
function stcSkeleton() {
  const card = '<div class="stc-card"><div class="stc-skel" style="width:38%;height:16px"></div><div class="stc-skel" style="width:22%;height:30px;margin-top:14px"></div><div class="stc-skel" style="width:70%;height:10px;margin-top:14px"></div><div class="stc-skel" style="width:100%;height:10px;margin-top:22px"></div><div class="stc-skel" style="width:100%;height:10px;margin-top:10px"></div><div class="stc-skel" style="width:86%;height:10px;margin-top:10px"></div></div>';
  return '<div role="status" aria-live="polite" aria-label="Đang tải số liệu">' + '<div class="stc-toolbar"><div class="stc-tl"><div class="stc-chips"><span class="stc-chip"><i></i>Đang tải số liệu…</span></div></div></div>' + '<div class="stc-g2">' + card + card + '</div></div>';
}
/* Không nạp được nguồn số liệu (không tải được tệp bản chụp) */
function stcErrorScreen() {
  return '<div class="stc-toolbar"><div class="stc-tl"><div class="stc-chips"><span class="stc-chip demo"><i></i>Không tải được số liệu</span></div></div></div>' +
    '<div class="stc-card"><div class="stc-empty stc-err" style="min-height:260px">' + STC_ICON_WARN + '<b>Không tải được số liệu của Sở Tài chính</b><span style="font-size:12px;max-width:420px">Tệp bản chụp số liệu (' + (STC_DEMO_ON ? 'js/features/stc-demo-data.js' : 'js/data/stc-snapshot.js') + ') không tải được. Kiểm tra kết nối mạng hoặc tệp đã được đưa lên máy chủ, rồi thử lại. Form không hiển thị số nào khi chưa tải được dữ liệu.</span><button type="button" class="stc-btn primary" style="margin-top:10px" onclick="stcReload()">' + STC_ICON_REFRESH + 'Thử lại</button></div></div>';
}
function stcScreenHtml() {
  if (STC_UI.loading) return stcSkeleton();
  if (STC_UI.error) return stcErrorScreen();
  const res = stcRes();
  if (STC_UI.screen === 'group') return stcScreenGroup(res);
  if (STC_UI.screen === 'detail') return stcScreenDetail(res);
  return stcScreenHome(res);
}
/* Tiêu đề popup (đặt vào phần đầu của #modal của IOC) */
function stcScreenMeta() {
  if (STC_UI.screen === 'group') {
    const gi = STC_GROUPS.findIndex((g) => g.id === STC_UI.group), g = STC_GROUPS[gi < 0 ? 0 : gi];
    return { title: 'Sở Tài chính — ' + g.label, sub: 'Nhóm ' + (gi + 1) + '/' + STC_GROUPS.length + ' · ' + g.inds.length + ' chỉ tiêu' };
  }
  if (STC_UI.screen === 'detail') {
    const it = STC_INDICATORS.find((i) => i.id === STC_UI.ind);
    return { title: 'Sở Tài chính — Chi tiết chỉ tiêu', sub: it ? it.label : '' };
  }
  return { title: 'Sở Tài chính — Bộ chỉ tiêu kinh tế – tài chính Thủ đô', sub: 'Số liệu tổng hợp cấp Thành phố từ API của Sở Tài chính Hà Nội' };
}
/* Form dùng đúng popup chuẩn của IOC (#modal): cùng khung, nền, nút đóng ×, nền mờ, cách cuộn và giao diện sáng/tối/xanh. */
/* Khối "Nhiệm vụ đã giao" dùng chung của IOC (giống các lĩnh vực khác), gắn với lĩnh vực Sở Tài chính; nằm dưới các chỉ tiêu. */
function stcTasksHtml() {
  if (typeof fieldScenarioSummary !== 'function' || STC_UI.loading || STC_UI.error) return '';
  try { return '<div class="stc-tasks" style="margin-top:18px">' + fieldScenarioSummary('cat::' + (STC_UI.role || (typeof currentRole !== 'undefined' ? currentRole : 'UBND')) + '::ubnd-taichinh') + '</div>'; } catch (e) { return ''; }
}
function stcRerender(resetScroll) {
  const body = document.getElementById('modalBody'), title = document.getElementById('modalTitle'), sub = document.getElementById('modalSub');
  if (!body || !STC_UI.open) return;
  const top = body.scrollTop, meta = stcScreenMeta();
  if (title) title.textContent = meta.title;
  if (sub) sub.textContent = (STC_DEMO_ON ? 'DỮ LIỆU MẪU · ' : '') + meta.sub;
  body.innerHTML = '<div class="stc-root stc-wrap">' + stcScreenHtml() + '</div>' + stcTasksHtml();
  body.scrollTop = resetScroll ? 0 : top;
  if (resetScroll && STC_UI.focus && STC_UI.screen === 'group') {
    const el = body.querySelector('#stc-ind-' + STC_UI.focus);
    if (el) body.scrollTop = Math.max(0, el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 12);
  }
  stcApplyZoom(body);
}
/* Phóng to 1 thẻ biểu đồ ra toàn màn hình: tách hẳn thẻ đó ra khỏi #modalBody (chỗ nào khỏi bị #modal/#modalBody
   cắt bớt do có transform/overflow riêng) và đặt vào 1 lớp phủ cố định phủ kín popup; đóng lại thì render bình
   thường sẽ tự đặt thẻ về đúng chỗ cũ trong lưới. Lớp phủ mang class "stc-root" để thừa hưởng đúng theme đang chọn. */
function stcToggleZoom(id) { STC_UI.zoom = STC_UI.zoom === id ? null : id; stcRerender(false); }
function stcZoomLayer() {
  let el = document.getElementById('stcZoomLayer');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'stcZoomLayer';
  el.className = 'stc-zoom-layer stc-root';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.addEventListener('click', (e) => { if (e.target === el) { STC_UI.zoom = null; stcRerender(false); } });
  document.body.appendChild(el);
  return el;
}
function stcRemoveZoomLayer() {
  const el = document.getElementById('stcZoomLayer');
  if (el && el.parentNode) el.parentNode.removeChild(el);
}
function stcApplyZoom(body) {
  if (!STC_UI.zoom) { stcRemoveZoomLayer(); return; }
  const card = body.querySelector('#stc-ind-' + STC_UI.zoom);
  if (!card) { STC_UI.zoom = null; stcRemoveZoomLayer(); return; }        // chỉ tiêu này không có ở màn hiện tại (vd. vừa đổi kỳ/nhóm)
  const layer = stcZoomLayer();
  layer.innerHTML = '';
  card.style.removeProperty('--stc-zoom');                                // đo ở tỉ lệ 1x trước, tính độ phóng sau
  layer.appendChild(card);
  /* Lấp vừa khung, không chừa khoảng trống thừa phía dưới: đo chiều cao nội dung thật ở tỉ lệ 1x rồi phóng theo
     chiều cao cho khít khung sẵn có (không tràn ngang); nội dung sẵn cao hơn khung thì giữ nguyên 1x, tự cuộn. */
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      if (STC_UI.zoom == null || !layer.contains(card)) return;           // đã đóng/đổi thẻ trong lúc chờ đo
      const availW = layer.clientWidth - 32, availH = layer.clientHeight - 32;
      const natW = card.scrollWidth, natH = card.scrollHeight;
      if (natW > 0 && natH > 0 && availW > 0 && availH > 0) {
        const scale = Math.max(1, Math.min(availH / natH, availW / natW, 2.6));
        card.style.setProperty('--stc-zoom', scale.toFixed(3));
      }
    });
  }
}
function stcOpenForm(itemIndex, role) {
  if (role) STC_UI.role = role;
  /* itemIndex tra theo STC_ITEMS (thẻ 0 = Tổng quan, thẻ 1–4 = 4 nhóm), không dùng chỉ số thô để không lệch khi đổi thứ tự thẻ.
     Không chỉ định thẻ nào (vd. quay về từ luồng giao nhiệm vụ) → giữ nhóm đang xem gần nhất, không phải Tổng quan. */
  const it = typeof itemIndex === 'number' ? STC_ITEMS[itemIndex] : null;
  STC_UI.focus = null; STC_UI.dd = null; STC_UI.zoom = null;
  if (it && it.stcKey === 'home') {
    STC_UI.screen = 'home'; STC_UI.pick = null;
  } else {
    const key = it ? it.stcKey : STC_UI.group;
    const g = STC_GROUPS.find((x) => x.id === key) || STC_GROUPS[0];
    STC_UI.screen = 'group'; STC_UI.group = g.id; STC_UI.pick = null;
  }
  if (typeof SGD_UI !== 'undefined') SGD_UI.open = false;          // popup đang thuộc về form Sở Tài chính
  if (typeof HCC_UI !== 'undefined') HCC_UI.open = false;
  STC_UI.open = true; STC_UI.loading = true; STC_UI.error = false;
  stcRerender(true);                                  // mở popup ngay với khung chờ
  if (typeof openModal === 'function') openModal();
  stcEnsureReady().then(() => { stcSettleSource(true); });
}
/* Sau khi nạp nguồn xong: bỏ khung chờ, báo lỗi nếu không có dữ liệu, chọn lại kỳ hợp lệ rồi vẽ. */
function stcSettleSource(resetScroll) {
  STC_UI.loading = false;
  STC_UI.error = !!STC_LOAD_ERR || !stcSnapshotObj();
  if (!STC_UI.error) {
    const latest = stcDefaultPeriod();
    if (!STC_UI.year || !stcHasPeriod(STC_UI.year, STC_UI.period)) { STC_UI.year = latest ? latest.year : new Date().getFullYear(); STC_UI.period = latest ? latest.period : 1; }
  }
  stcRerender(resetScroll);
  try { if (typeof renderIndicators === 'function') renderIndicators(); } catch (e) { /* lưới chỉ tiêu vẽ lại khi mở lần sau */ }
}
/* Nút "Tải lại" / "Thử lại": nạp lại tệp số liệu; giữ khung chờ tối thiểu 400 ms để không nhấp nháy. */
function stcReload() {
  if (STC_UI.loading) return;
  STC_UI.loading = true; STC_UI.error = false; STC_UI.dd = null;
  stcRerender(false);
  Promise.all([stcReloadSource(), new Promise((r) => setTimeout(r, 400))]).then(() => { stcSettleSource(false); });
}/* Nút "Xem dữ liệu mẫu": chuyển giữa số thật (bản chụp API) và số mẫu tự đặt; kỳ tự chọn lại theo nguồn. */
function stcToggleDemo() {
  stcSetDemo(!STC_DEMO_ON).then(() => {
    const list = stcPeriods();
    const pick = STC_DEMO_ON ? list.slice().reverse()[0] : list[0];
    if (pick) { STC_UI.year = pick.year; STC_UI.period = pick.period; }
    STC_UI.pick = null;
    stcRerender(false);
    try { if (typeof renderIndicators === 'function') renderIndicators(); } catch (e) { /* lưới chỉ tiêu vẽ lại khi mở lần sau */ }
  });
}
function stcClose() {
  STC_UI.open = false;
  STC_UI.zoom = null;
  stcRemoveZoomLayer();
  if (typeof closeModal === 'function') closeModal();
}
/* Esc đóng popup (IOC chưa có sẵn) — chỉ khi popup đang chứa form STC */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !STC_UI.open) return;
    const m = document.getElementById('modal');
    if (!(m && m.classList.contains('open') && m.querySelector('.stc-root'))) return;
    if (STC_UI.zoom) { STC_UI.zoom = null; stcRerender(false); return; }   // Esc đầu tiên chỉ thu nhỏ thẻ đang phóng to
    if (STC_UI.dd) { STC_UI.dd = null; stcRerender(false); return; }       // rồi mới đến đóng danh sách đang sổ
    stcClose();
  });
  /* bấm ra ngoài hộp chọn thì thu danh sách lại */
  document.addEventListener('click', (e) => {
    if (!STC_UI.dd || !STC_UI.open) return;
    if (e.target && e.target.closest && e.target.closest('.stc-dd')) return;
    STC_UI.dd = null;
    stcRerender(false);
  });
}function stcGo(screen, arg) {
  STC_UI.focus = null; STC_UI.dd = null; STC_UI.zoom = null;
  STC_UI.screen = screen;
  if (screen === 'group' && arg) STC_UI.group = arg;
  STC_UI.pick = null;
  stcRerender(true);
}
function stcDetail(indId) { STC_UI.focus = null; STC_UI.dd = null; STC_UI.zoom = null; STC_UI.screen = 'detail'; if (indId) STC_UI.ind = (stcRes() && stcRes().rootOf[indId] ? stcRes().rootOf[indId].id : indId); STC_UI.pick = null; stcRerender(true); }
function stcPick(id) { STC_UI.pick = STC_UI.pick === id ? null : id; stcRerender(false); }
function stcStep(d) {
  const at = STC_INDICATORS.findIndex((i) => i.id === STC_UI.ind);
  STC_UI.ind = STC_INDICATORS[(at + d + STC_INDICATORS.length) % STC_INDICATORS.length].id;
  STC_UI.pick = null;
  stcRerender(true);
}
function stcSetYear(v) {
  STC_UI.dd = null;
  STC_UI.year = Number(v);
  const same = stcHasPeriod(STC_UI.year, STC_UI.period);
  if (!same) { const p = [1, 2, 3, 4].filter((q) => stcHasPeriod(STC_UI.year, q)).pop(); if (p) STC_UI.period = p; }
  STC_UI.pick = null;
  stcRerender(false);
}
function stcSetPeriod(v) { STC_UI.dd = null; STC_UI.period = Number(v); STC_UI.pick = null; stcRerender(false); }

/* ---------- Xuất Excel ---------- */
async function stcExport() {
  const res = stcRes();
  if (!res) { if (typeof toast === 'function') toast('Chưa có bản chụp cho kỳ này để xuất.'); return; }
  if (typeof ExcelJS === 'undefined') { if (typeof toast === 'function') toast('Thư viện xuất Excel chưa tải xong, thử lại sau giây lát.'); return; }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Chỉ tiêu');
  const note = 'Sở Tài chính Hà Nội · ' + stcQ(res.year, res.period) + ' · số liệu chụp lúc ' + stcStampText(res.importedAt) + (res.demo ? ' · DỮ LIỆU MẪU, KHÔNG PHẢI SỐ LIỆU THẬT' : '');
  ws.addRow([note]).font = { italic: true };
  ws.addRow([STC_ASSUME.unitNote]).font = { italic: true };
  ws.addRow([]);
  const pq = stcPrevQ(res.year, res.period);
  ws.addRow(['Nhóm', 'Chỉ tiêu', 'Thành phần', 'Kỳ này (' + stcQ(res.year, res.period) + ')', 'Kỳ trước (' + stcQ(pq.year, pq.period) + ')', 'So kỳ trước', 'Cùng kỳ năm trước (' + stcQ(res.year - 1, res.period) + ')', 'So cùng kỳ', 'Đơn vị', 'Trạng thái', 'Mã API']).font = { bold: true };
  const num = (v) => (v == null ? null : v);
  /* Mức thay đổi ghi kèm đơn vị: "%" hoặc "điểm %" / "điểm" để không nhầm */
  const dv = (n, which) => { const v = which === 'kq' ? stcDeltaKq(n) : stcDeltaCq(n); if (v == null) return null; const u = stcDeltaUnit(n, which); return stcSgn(v, 1) + (u === '%' ? '%' : ' ' + u); };
  const row = (g, ind, label, n, st, api) => {
    const ok = ind.state === 'ok';
    ws.addRow([g.label, ind.label, label, ok ? num(n.now) : null, ok ? num(n.kq) : null, ok ? dv(n, 'kq') : null, ok && n.kind !== 'idx' ? num(stcPrev(n)) : null, ok ? dv(n, 'cq') : null, ind.unit, st, api]);
  };
  res.groups.forEach((g) => g.inds.forEach((ind) => {
    const st = ind.state === 'ok' ? 'Có số' : ind.state === 'nodata' ? 'Chưa có số liệu' : 'Không nhận diện được';
    row(g, ind, '(tổng)', ind, st, ind.apis.join(' + '));
    const add = (n, depth) => (n.kids || []).forEach((k) => {
      row(g, ind, '   '.repeat(depth) + k.label, k, st, k.api || ind.apis[0]);
      add(k, depth + 1);
    });
    add(ind, 1);
  }));
  ws.columns = [{ width: 26 }, { width: 46 }, { width: 46 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 22 }, { width: 30 }];
  const raw = wb.addWorksheet('Số liệu gốc API');
  raw.addRow(['Mã API', 'chiTieu', 'loai', 'giaTri', 'quy']).font = { bold: true };
  const snap = stcSnapshotObj().periods[res.year + '-' + res.period].data;
  Object.keys(snap).forEach((code) => snap[code].forEach((r) => raw.addRow([code, r.chiTieu, r.loai, r.giaTri, r.quy])));
  raw.columns = [{ width: 28 }, { width: 60 }, { width: 44 }, { width: 14 }, { width: 12 }];
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'so-tai-chinh-Q' + res.period + '-' + res.year + (res.demo ? '-DU-LIEU-MAU' : '') + '.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Thẻ xem trước ở lưới chỉ tiêu (indicators.js gọi qua catItemPreviewBody) ----------
   Mỗi thẻ = một NHÓM (một popup): liệt kê gọn các chỉ tiêu của nhóm với số chính và mức tăng giảm. */
function stcDefaultPeriod() { return STC_DEMO_ON ? stcPeriods().slice().reverse()[0] : stcLatestPeriod(); }
/* Biểu đồ nhỏ dưới mỗi dòng ở thẻ xem trước (thẻ nằm ngoài .stc-root nên dùng màu trực tiếp, không dùng biến CSS). */
const STC_MINI_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];
const STC_MINI_TRACK = 'rgba(127,150,180,.30)';
function stcMiniViz(ind) {
  if (ind.state !== 'ok') return '';
  const h = 'height:4px;border-radius:3px;margin:3px 0 1px;';
  const seg = (w, c, gap) => '<i style="display:block;flex:' + Math.max(w, 0.5) + ' 1 0;background:' + c + ';border-radius:3px;' + (gap ? 'margin-left:2px' : '') + '"></i>';
  if (ind.id === 'da') {   // mỗi nhóm dự án một thanh nhỏ, độ đầy = % hoàn thành của chính nhóm đó (không tính trung bình)
    return '<div style="display:flex;gap:3px;margin:3px 0 1px">' + ind.kids.map((k) => '<span style="flex:1 1 0;height:4px;border-radius:3px;background:' + STC_MINI_TRACK + ';overflow:hidden"><i style="display:block;height:100%;width:' + Math.max(0, Math.min(100, k.now || 0)) + '%;background:#3987e5"></i></span>').join('') + '</div>';
  }
  if (ind.id === 'xnk') {
    const x = ind.kids[0].now, n = ind.kids[1].now, m = Math.max(x, n, 1);
    const bar = (v, c) => '<span style="display:block;height:3px;border-radius:3px;background:' + STC_MINI_TRACK + ';margin:2px 0"><i style="display:block;height:100%;width:' + (v / m * 100) + '%;background:' + c + ';border-radius:3px"></i></span>';
    return '<div style="margin:3px 0 1px">' + bar(x, '#3987e5') + bar(n, '#d95926') + '</div>';
  }
  if (ind.kind === 'idx' || ind.id === 'gia') {   // thang 0–200, vạch mốc 100
    const v = ind.id === 'gia' ? ind.kids[0].now : ind.now;
    if (v == null) return '';
    const p = Math.max(0, Math.min(100, v / 200 * 100));
    return '<div style="position:relative;' + h + 'background:' + STC_MINI_TRACK + '"><i style="position:absolute;left:50%;top:-2px;width:1px;height:8px;background:rgba(127,150,180,.9)"></i><i style="position:absolute;left:calc(' + p + '% - 4px);top:-2px;width:8px;height:8px;border-radius:50%;background:#3987e5"></i></div>';
  }
  const kids = ind.kids.filter((k) => k.now > 0);
  if (kids.length >= 2) return '<div style="display:flex;' + h + '">' + kids.map((k, i) => seg(k.now, STC_MINI_COLORS[i % 5], i)).join('') + '</div>';
  return '';
}
function stcPreviewLine(ind) {
  const nm = STC_SHORT[ind.id] || ind.label;
  let val = '—', dl = '';
  if (ind.state === 'ok') {
    if (ind.id === 'da') val = ind.kids.length + ' nhóm';
    else if (ind.id === 'xnk') { const b = ind.kids[0].now - ind.kids[1].now; val = stcSgn(b, 0) + ' <span style="opacity:.7;font-weight:500;font-size:10.5px">triệu USD</span>'; }
    else if (ind.id === 'gia') val = stcFmt(ind.kids[0].now, 1) + ' <span style="opacity:.7;font-weight:500;font-size:10.5px">%</span>';
    else val = stcVal(ind) + ' <span style="opacity:.7;font-weight:500;font-size:10.5px">' + stcE(ind.kind === 'idx' ? '%' : ind.unit) + '</span>';
    /* Hai dòng nhỏ: so kỳ trước, so cùng kỳ (có chú thích khi rê chuột) */
    const one = (which, ref) => {
      const y = which === 'kq' ? stcDeltaKq(ind) : stcDeltaCq(ind), u = stcDeltaUnit(ind, which);
      const t = y == null ? '—' : (y > 0.0499 ? '▲ ' : y < -0.0499 ? '▼ ' : '') + stcFmt(Math.abs(y), 1) + (u === '%' ? '%' : ' ' + u);
      return '<span style="display:block;cursor:help" title="' + stcE(stcDlTip(ind, which, y)) + '">' + t + ' <span style="opacity:.65;font-size:10px">' + ref + '</span></span>';
    };
    if (['da', 'xnk', 'gia'].indexOf(ind.id) < 0 && (stcDeltaKq(ind) != null || stcDeltaCq(ind) != null)) dl = one('kq', 'kỳ trước') + one('cq', 'cùng kỳ');
  }
  return '<div style="font-size:12px;padding:4px 0 3px;border-top:1px solid rgba(87,178,255,.14)"><div style="display:grid;grid-template-columns:minmax(0,1fr) auto 104px;gap:8px;align-items:baseline"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9">' + stcE(nm) + '</span><b style="font-variant-numeric:tabular-nums;white-space:nowrap">' + val + '</b><span style="text-align:right;opacity:.85;font-size:11px;white-space:nowrap">' + dl + '</span></div>' + stcMiniViz(ind) + '</div>';
}
/* Thẻ xem trước riêng cho thẻ "Tổng quan" ở lưới chỉ tiêu: vài số nổi bật của cả 4 nhóm, không phải của riêng một nhóm. */
function stcOverviewPreviewBody() {
  const latest = stcDefaultPeriod();
  const res = latest ? stcBuildPeriod(latest.year, latest.period) : null;
  const label = 'Tổng quan';
  if (!res) return { label: label, bodyHtml: '<p class="cpi-legend">Chưa có bản chụp số liệu.</p>' };
  const rows = ['thu', 'chi', 'grdp', 'iip'].map((id) => res.byId[id]).filter(Boolean).map(stcPreviewLine).join('');
  const total = STC_INDICATORS.length, withData = STC_INDICATORS.filter((s) => res.byId[s.id] && res.byId[s.id].state === 'ok').length;
  const foot = '<p class="cpi-legend" style="margin:8px 0 0;font-size:11px;line-height:1.3;display:flex;justify-content:space-between;gap:8px"><span>' + stcQ(res.year, res.period) + ' · ' + STC_GROUPS.length + ' nhóm · ' + total + ' chỉ tiêu' + (withData < total ? ' · ' + (total - withData) + ' chưa có số' : '') + '</span>' + (STC_DEMO_ON ? '<span style="color:#f2b636;font-weight:700;font-size:10.5px;letter-spacing:.3px">DỮ LIỆU MẪU</span>' : '') + '</p>';
  return { label: label, bodyHtml: '<div style="margin-top:4px">' + rows + '</div>' + foot };
}
/* Băng "Tổng quan" đưa ra NGOÀI popup, nằm ngay trong lưới chỉ tiêu của IOC (thay cho thẻ xem trước rút gọn ở trên):
   7 ô KPI y hệt màn Trang chủ – tổng quan trong popup, rộng hết cả hàng lưới. Bấm 1 ô KPI mở thẳng popup đúng
   nhóm chứa chỉ tiêu đó (chưa mở popup nên dùng openCategoryDetail, không dùng stcGo); bấm "Xem tổng quan đầy đủ ›"
   mở popup ở màn Trang chủ (7 ô KPI + 4 thẻ nhóm + ghi chú). Không dùng <button> bọc ngoài vì bên trong đã có các
   nút KPI riêng — button lồng button là HTML không hợp lệ. */
function stcOverviewBandHtml(cat, idx) {
  const latest = stcDefaultPeriod();
  const res = latest ? stcBuildPeriod(latest.year, latest.period) : null;
  const openArgs = (i) => "'" + cat.role + "','" + cat.id + "'," + i;
  const groupIdx = (target) => { const i = STC_ITEMS.findIndex((x) => x.stcKey === target); return i < 0 ? idx : i; };
  let body;
  if (!res) {
    body = '<p class="cpi-legend">Chưa có bản chụp số liệu.</p>';
  } else {
    body = '<div class="stc-kpis">' + STC_KPIS.map((k) => stcKpiTile(k, res, 'openCategoryDetail(' + openArgs(groupIdx(k.target)) + ')')).join('') + '</div>';
    body += '<div class="stc-sec" style="margin:4px 0 12px">Bốn nhóm chỉ tiêu · mỗi nhóm một màn hình</div>';
    body += '<div class="stc-g2">' + res.groups.map((g, i) => stcGroupCardHome(g, i, res, 'openCategoryDetail(' + openArgs(groupIdx(g.id)) + ')')).join('') + '</div>';
    body += stcHomeQualityNote(res);
  }
  const foot = res ? '<p class="cpi-legend" style="margin:10px 0 0;font-size:11px;display:flex;justify-content:space-between;gap:8px"><span>' + stcQ(res.year, res.period) + ' · 4 nhóm · ' + STC_INDICATORS.length + ' chỉ tiêu</span>' + (STC_DEMO_ON ? '<span style="color:#f2b636;font-weight:700;font-size:10.5px;letter-spacing:.3px">DỮ LIỆU MẪU</span>' : '') + '</p>' : '';
  return '<div class="field-category-card so-item-card stc-overview-band" style="grid-column:1/-1"><div class="stc-root" style="background:transparent;overflow:visible">' +
    '<div class="stc-gh" style="margin-bottom:12px"><h4 style="margin:0">Tổng quan</h4><button type="button" class="stc-gmore" style="background:none;border:0;cursor:pointer;padding:0;font:inherit" onclick="openCategoryDetail(' + openArgs(idx) + ')">Xem tổng quan đầy đủ ›</button></div>' +
    body + foot + '</div></div>';
}
function stcPreviewBody(it) {
  if (it.stcKey === 'home') return stcOverviewPreviewBody();
  const g = STC_GROUPS.find((x) => x.id === it.stcKey);
  const label = g ? g.label : it[0];
  const latest = stcDefaultPeriod();
  const res = latest ? stcBuildPeriod(latest.year, latest.period) : null;
  if (!g || !res) return { label: label, bodyHtml: '<p class="cpi-legend">Chưa có bản chụp số liệu.</p>' };
  const rows = g.inds.map((id) => res.byId[id]).filter(Boolean).map(stcPreviewLine).join('');
  const withData = g.inds.filter((id) => res.byId[id] && res.byId[id].state === 'ok').length;
  const foot = '<p class="cpi-legend" style="margin:8px 0 0;font-size:11px;line-height:1.3;display:flex;justify-content:space-between;gap:8px"><span>' + stcQ(res.year, res.period) + ' · ' + g.inds.length + ' chỉ tiêu' + (withData < g.inds.length ? ' · ' + (g.inds.length - withData) + ' chưa có số' : '') + '</span>' + (STC_DEMO_ON ? '<span style="color:#f2b636;font-weight:700;font-size:10.5px;letter-spacing:.3px">DỮ LIỆU MẪU</span>' : '') + '</p>';
  return { label: label, bodyHtml: '<div style="margin-top:4px">' + rows + '</div>' + foot };
}