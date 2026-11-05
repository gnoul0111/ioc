/* ============================== DỮ LIỆU ĐÃ CHỐT — LỊCH CÁC MỐC XUẤT BÁO CÁO (dựng giao diện thử 05/11/2026, task TU-274) ==============================
   Mỗi lần «Xuất báo cáo» (hộp js/features/ioc-xuat.js), IOC chốt lại dữ liệu đúng lúc bấm xuất = một MỐC.
   Bấm ô đồng hồ ở thanh đầu → bảng «Dữ liệu đã chốt»:
     trái  — lịch theo tháng; ngày có chốt sáng lên, bấm được (chốt nhiều lần thì ghi số lần);
     phải  — các lần chốt của ngày đang chọn; mỗi lần có 2 cách xem: «Xem trên IOC» (cả IOC hiện số liệu đã chốt) và «Tải PDF».
   Đang xem một mốc: đồng hồ dừng ở giờ của mốc (màu giữ nguyên), dải báo ở đầu trang, «Về hiện tại» trong bảng và ở dải báo.
   BẢN DỰNG GIAO DIỆN: các mốc là bản ghi mẫu sinh theo tài khoản; «Xem trên IOC» chỉ dừng đồng hồ + hiện dải báo, CHƯA nạp dữ liệu đã chốt;
   «Tải PDF» chưa có file thật. Mọi lớp CSS có tiền tố mc- (css/ioc-moc.css). */

const MC = { open: false, y: 0, m: 0, day: null, list: null, acct: null, xem: null };
const mcE = (s) => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const mcP2 = (n) => String(n).padStart(2, '0');
const MC_THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const mcIso = (d) => d.getFullYear() + '-' + mcP2(d.getMonth() + 1) + '-' + mcP2(d.getDate());
const mcGio = (d) => mcP2(d.getHours()) + ':' + mcP2(d.getMinutes()) + ':' + mcP2(d.getSeconds());
const mcNgay = (d) => MC_THU[d.getDay()] + ', ' + mcP2(d.getDate()) + '/' + mcP2(d.getMonth() + 1) + '/' + d.getFullYear();
const mcAcctKey = () => (typeof currentAccount !== 'undefined' && currentAccount ? (currentAccount.user || currentAccount.title || '') + '|' + (typeof currentRole !== 'undefined' ? currentRole : '') : '');
const mcAcctTen = () => ((document.getElementById('currentRoleName') || {}).textContent || '').trim() || 'Tài khoản';

/* ---------- Bản ghi mẫu: các mốc từ 01/08/2026 đến hôm nay, sinh cố định theo tài khoản ---------- */
function mcHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mcKhoiTen() {
  try { if (typeof ixBuild === 'function') { ixBuild(); if (IX.cay.length) return IX.cay.map((k) => k.ten); } } catch (e) { /* không có hộp xuất thì dùng danh sách mặc định */ }
  return ['Tổng quan điều hành', 'Bản đồ GIS và điểm nghẽn', 'Notify IOC/CAD cần xử lý', 'Chỉ tiêu theo lĩnh vực'];
}
function mcMau() {
  const key = mcAcctKey(), ten = mcAcctTen(), khoi = mcKhoiTen(), out = [], now = new Date();
  const d = new Date(2026, 7, 1);
  while (d <= now) {
    const h = mcHash(key + mcIso(d)), r = h % 100, wk = d.getDay();
    let n = wk === 0 ? 0 : r < 22 ? 1 : r < 31 ? 2 : r < 35 ? 3 : 0;
    if (mcIso(d) === '2026-10-29') n = Math.max(n, 2);
    const gios = [];
    for (let i = 0; i < n; i++) { const hh = mcHash(h + ':' + i); gios.push(7 * 3600 + 30 * 60 + (hh % (10 * 3600))); }
    if (mcIso(d) === '2026-10-29') gios[0] = 15 * 3600 + 18 * 60 + 3; /* mốc ví dụ trong task: 15:18:03, Thứ 5, 29/10/2026 */
    gios.sort((a, b) => a - b).forEach((s, i) => {
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60);
      if (t > now) return;
      const hh = mcHash(key + t.getTime());
      const so = 1 + (hh % Math.min(4, khoi.length));
      const nd = khoi.filter((_, j) => ((hh >> j) & 1) || j < 1).slice(0, so);
      out.push({ id: 'm' + t.getTime(), t: t, nguoi: ten, kieu: hh % 3 === 0 ? 'ct' : 'tq', noiDung: nd, mau: true });
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function mcList() {
  const k = mcAcctKey();
  if (!MC.list || MC.acct !== k) { MC.acct = k; MC.list = mcMau(); }
  return MC.list;
}
const mcTheoNgay = (iso) => mcList().filter((x) => mcIso(x.t) === iso).sort((a, b) => b.t - a.t);
const mcTim = (id) => mcList().find((x) => x.id === id);

/* Hộp «Xuất báo cáo» gọi sau khi bấm tải: thêm một mốc lúc bấm (bản dựng: chỉ thêm vào danh sách trên máy) */
function mcThem(o) {
  const t = new Date(); t.setMilliseconds(0);
  const m = { id: 'm' + t.getTime(), t: t, nguoi: mcAcctTen(), kieu: o && o.kieu === 'ct' ? 'ct' : 'tq', noiDung: (o && o.noiDung) || [], mau: false };
  mcList().push(m);
  return m;
}

/* ---------- Đồng hồ ---------- */
/* login.js → updateClock() hỏi hàm này: đang xem mốc thì không chạy giờ */
function mcClockFrozen() { return !!MC.xem; }
function mcVeDongHo() {
  const m = MC.xem && mcTim(MC.xem);
  const c = document.getElementById('clock'), dt = document.getElementById('dateText');
  if (m) { if (c) c.textContent = mcGio(m.t); if (dt) dt.textContent = mcNgay(m.t); }
  else if (typeof updateClock === 'function') updateClock();
  const card = document.getElementById('clockCard');
  if (card) card.title = m ? 'Đang xem dữ liệu đã chốt — bấm để chọn mốc khác hoặc về hiện tại' : 'Xem dữ liệu đã chốt';
}

/* ---------- Mở, đóng ---------- */
function mcOpen() {
  if (MC.open) return mcClose();
  if (typeof toggleAccountMenu === 'function') toggleAccountMenu(false);
  const list = mcList(), now = new Date();
  /* mở ở ngày đang xem, không thì ngày chốt gần nhất, không thì hôm nay */
  const ref = (MC.xem && mcTim(MC.xem)) || list.slice().sort((a, b) => b.t - a.t)[0];
  const d = ref ? ref.t : now;
  MC.y = d.getFullYear(); MC.m = d.getMonth(); MC.day = mcIso(d);
  let ov = document.getElementById('mcOv');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'mcOv'; ov.className = 'mc-ov';
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) mcClose(); });
    ov.addEventListener('click', mcClick);
    document.body.appendChild(ov);
    document.addEventListener('keydown', (e) => { if (MC.open && e.key === 'Escape') { e.preventDefault(); mcClose(); } });
    window.addEventListener('resize', () => { if (MC.open) mcDat(); });
  }
  MC.open = true; ov.hidden = false;
  const card = document.getElementById('clockCard'); if (card) card.setAttribute('aria-expanded', 'true');
  mcRender();
  const f = ov.querySelector('.mc-d.sel') || ov.querySelector('.mc-x'); if (f) f.focus({ preventScroll: true });
}
function mcClose() {
  MC.open = false;
  const ov = document.getElementById('mcOv'); if (ov) ov.hidden = true;
  const card = document.getElementById('clockCard'); if (card) { card.setAttribute('aria-expanded', 'false'); }
}
/* Đặt bảng ngay dưới ô đồng hồ, canh mép phải theo ô (màn hẹp: CSS cho kín ngang) */
function mcDat() {
  const p = document.querySelector('#mcOv .mc-pop'), card = document.getElementById('clockCard');
  if (!p || !card || window.innerWidth <= 640) { if (p) { p.style.top = ''; p.style.left = ''; } return; }
  const r = card.getBoundingClientRect(), w = p.offsetWidth;
  p.style.top = Math.round(r.bottom + 8) + 'px';
  p.style.left = Math.round(Math.max(16, Math.min(r.right - w, window.innerWidth - w - 16))) + 'px';
}

/* ---------- Vẽ ---------- */
function mcRender() {
  const ov = document.getElementById('mcOv');
  if (!ov || !MC.open) return;
  const xem = MC.xem && mcTim(MC.xem);
  ov.innerHTML = '<div class="mc-pop" role="dialog" aria-modal="true" aria-labelledby="mcT">' +
    '<div class="mc-head"><span class="mc-hic"><i class="ti ti-history"></i></span><div class="mc-ht"><b id="mcT">Dữ liệu đã chốt</b><small>Mỗi lần xuất báo cáo, IOC chốt lại dữ liệu đúng lúc bấm xuất. Ngày sáng màu là ngày có chốt, bấm vào để xem.</small></div>' +
    '<button type="button" class="mc-x" data-mc="close" aria-label="Đóng"><i class="ti ti-x"></i></button></div>' +
    (xem ? '<div class="mc-now"><i class="ti ti-eye"></i><span>Đang xem dữ liệu chốt lúc <b>' + mcE(mcGio(xem.t)) + ', ' + mcE(mcNgay(xem.t)) + '</b></span><button type="button" class="mc-btn primary" data-mc="ve"><i class="ti ti-arrow-back-up"></i>Về hiện tại</button></div>' : '') +
    '<div class="mc-body"><div class="mc-cal">' + mcLich() + '</div><div class="mc-day">' + mcNgayHtml() + '</div></div>' +
    '<div class="mc-foot"><i class="ti ti-info-circle"></i><span>Các lần chốt ở đây đang là <b>bản ghi mẫu</b> (bản dựng giao diện).</span></div></div>';
  mcDat();
}
function mcLich() {
  const now = new Date(), homNay = mcIso(now), y = MC.y, m = MC.m;
  const dau = new Date(y, m, 1), soNgay = new Date(y, m + 1, 0).getDate(), lech = (dau.getDay() + 6) % 7; /* tuần bắt đầu Thứ 2 */
  const dem = {}; mcList().forEach((x) => { if (x.t.getFullYear() === y && x.t.getMonth() === m) { const k = mcIso(x.t); dem[k] = (dem[k] || 0) + 1; } });
  const tong = Object.values(dem).reduce((s, n) => s + n, 0), soNgayCo = Object.keys(dem).length;
  const toi = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
  const xemIso = MC.xem && mcTim(MC.xem) ? mcIso(mcTim(MC.xem).t) : null;
  let o = '<div class="mc-nav"><button type="button" class="mc-nb" data-mc="prev" aria-label="Tháng trước"><i class="ti ti-chevron-left"></i></button><b>Tháng ' + (m + 1) + '/' + y + '</b>' +
    '<button type="button" class="mc-nb" data-mc="next" aria-label="Tháng sau"' + (toi ? ' disabled' : '') + '><i class="ti ti-chevron-right"></i></button></div>' +
    '<div class="mc-grid" role="grid"><span class="mc-wd">T2</span><span class="mc-wd">T3</span><span class="mc-wd">T4</span><span class="mc-wd">T5</span><span class="mc-wd">T6</span><span class="mc-wd">T7</span><span class="mc-wd">CN</span>';
  for (let i = 0; i < lech; i++) o += '<span class="mc-d0"></span>';
  for (let d = 1; d <= soNgay; d++) {
    const iso = y + '-' + mcP2(m + 1) + '-' + mcP2(d), n = dem[iso] || 0, tl = iso > homNay;
    const cls = 'mc-d' + (n ? ' co' : '') + (iso === MC.day ? ' sel' : '') + (iso === homNay ? ' today' : '') + (iso === xemIso ? ' xem' : '');
    const nhan = d + '/' + (m + 1) + (n ? ': ' + n + ' lần chốt' : ': không có chốt');
    o += n ? '<button type="button" class="' + cls + '" data-mc="day" data-d="' + iso + '" aria-label="' + nhan + '" aria-pressed="' + (iso === MC.day) + '"><span>' + d + '</span>' + (n > 1 ? '<em>' + n + '</em>' : '') + '</button>'
      : '<span class="' + cls + (tl ? ' tl' : '') + '" aria-label="' + nhan + '"><span>' + d + '</span></span>';
  }
  o += '</div><div class="mc-leg"><span><i class="mc-dot co"></i>Có chốt dữ liệu</span><span><i class="mc-dot today"></i>Hôm nay</span></div>' +
    '<div class="mc-msum">' + (tong ? 'Tháng ' + (m + 1) + ' có <b>' + tong + ' lần chốt</b> trong ' + soNgayCo + ' ngày' : 'Tháng ' + (m + 1) + ' chưa có lần chốt nào') + '</div>' +
    (toi ? '' : '<button type="button" class="mc-lnk" data-mc="thisMonth"><i class="ti ti-calendar-event"></i>Về tháng này</button>');
  return o;
}
function mcNgayHtml() {
  const d = MC.day ? new Date(MC.day + 'T00:00:00') : new Date();
  const ds = MC.day ? mcTheoNgay(MC.day) : [];
  let o = '<div class="mc-dh"><b>' + mcE(mcNgay(d)) + '</b><small>' + (ds.length ? ds.length + ' lần chốt' : 'Không có lần chốt nào') + '</small></div>';
  if (!ds.length) return o + '<div class="mc-empty"><i class="ti ti-calendar-off"></i><p>Ngày này không xuất báo cáo nên không có dữ liệu chốt.<br>Chọn một ngày <b>sáng màu</b> ở lịch bên trái.</p></div>';
  return o + '<div class="mc-list">' + ds.map((x) => {
    const on = x.id === MC.xem;
    return '<div class="mc-it' + (on ? ' on' : '') + '"><div class="mc-ith"><span class="mc-time"><i class="ti ti-clock"></i>' + mcE(mcGio(x.t)) + '</span>' +
      '<span class="mc-tag ' + x.kieu + '">' + (x.kieu === 'ct' ? 'Báo cáo chi tiết' : 'Báo cáo tổng quan') + '</span>' + (on ? '<span class="mc-tag xem"><i class="ti ti-eye"></i>Đang xem</span>' : '') + '</div>' +
      '<dl class="mc-kv"><dt>Người xuất</dt><dd>' + mcE(x.nguoi) + '</dd><dt>Nội dung</dt><dd>' + mcE(x.noiDung.join(', ') || '—') + '</dd></dl>' +
      '<div class="mc-ita">' + (on ? '<button type="button" class="mc-btn" data-mc="ve"><i class="ti ti-arrow-back-up"></i>Về hiện tại</button>'
        : '<button type="button" class="mc-btn primary" data-mc="xem" data-id="' + x.id + '"><i class="ti ti-eye"></i>Xem trên IOC</button>') +
      '<button type="button" class="mc-btn" data-mc="pdf" data-id="' + x.id + '"><i class="ti ti-file-download"></i>Tải PDF</button></div></div>';
  }).join('') + '</div>';
}

/* ---------- Thao tác ---------- */
function mcClick(e) {
  const b = e.target.closest('[data-mc]');
  if (!b || b.disabled) return;
  const a = b.dataset.mc;
  if (a === 'close') return mcClose();
  if (a === 'prev' || a === 'next') { const d = new Date(MC.y, MC.m + (a === 'prev' ? -1 : 1), 1); MC.y = d.getFullYear(); MC.m = d.getMonth(); return mcRender(); }
  if (a === 'thisMonth') { const d = new Date(); MC.y = d.getFullYear(); MC.m = d.getMonth(); return mcRender(); }
  if (a === 'day') { MC.day = b.dataset.d; mcRender(); const f = document.querySelector('#mcOv .mc-d.sel'); if (f) f.focus({ preventScroll: true }); return; }
  if (a === 'xem') return mcXem(b.dataset.id);
  if (a === 've') return mcVeHienTai();
  if (a === 'pdf') return mcPdf(b.dataset.id);
}
/* Xem một mốc trên IOC: đóng bảng, dừng đồng hồ ở giờ của mốc, hiện dải báo. Bản dựng: số liệu trên màn hình CHƯA đổi. */
function mcXem(id) {
  const m = mcTim(id); if (!m) return;
  MC.xem = id;
  mcClose(); mcVeDongHo(); mcBanner();
  if (typeof toast === 'function') toast('Bản dựng giao diện: đồng hồ đã dừng ở ' + mcGio(m.t) + ' ' + mcNgay(m.t) + ', số liệu trên màn hình chưa đổi theo mốc.');
}
function mcVeHienTai() {
  MC.xem = null;
  mcClose(); mcVeDongHo(); mcBanner();
  if (typeof toast === 'function') toast('Đã về số liệu hiện tại.');
}
function mcPdf(id) {
  const m = mcTim(id); if (!m) return;
  const t = m.t, ten = 'BaoCao_IOC_' + t.getFullYear() + mcP2(t.getMonth() + 1) + mcP2(t.getDate()) + '_' + mcGio(t).replace(/:/g, '') + '.pdf';
  if (typeof toast === 'function') toast('Bản dựng giao diện: chưa có file PDF thật (' + ten + ').');
}
/* Dải báo ở đầu trang khi đang xem mốc (dùng kiểu dải «Đang xem theo cơ cấu tổ chức») */
function mcBanner() {
  let el = document.getElementById('mcBanner');
  const m = MC.xem && mcTim(MC.xem);
  if (!m) { if (el) el.classList.add('hidden'); return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'mcBanner'; el.className = 'view-as-banner mc-banner hidden';
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-mc]'); if (!b) return; if (b.dataset.mc === 've') mcVeHienTai(); else mcOpen(); });
    const anchor = document.getElementById('roleScopeCards');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor); else return;
  }
  el.innerHTML = '<span><i class="ti ti-history"></i> Đang xem <b>dữ liệu đã chốt lúc ' + mcE(mcGio(m.t)) + ', ' + mcE(mcNgay(m.t)) + '</b>. Chỉ xem: không thêm, sửa, giao nhiệm vụ, nhập chỉ tiêu được.</span>' +
    '<span class="mc-bact"><button class="ghost" data-mc="lich">Chọn mốc khác</button><button class="ghost" data-mc="ve">← Về hiện tại</button></span>';
  el.classList.remove('hidden');
}
/* Đăng xuất / đổi tài khoản: bỏ trạng thái xem mốc */
function mcReset() { MC.xem = null; MC.list = null; mcClose(); mcBanner(); }
