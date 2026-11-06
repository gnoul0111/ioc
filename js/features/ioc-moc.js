/* ============================== DỮ LIỆU ĐÃ CHỐT — MỐC XUẤT BÁO CÁO (task TU-274, 05/11/2026) ==============================
   Mỗi lần «Xuất báo cáo» (hộp js/features/ioc-xuat.js), IOC CHỐT dữ liệu đúng lúc bấm = một MỐC, lưu:
     thời điểm (đến giây), người xuất, đơn vị, phạm vi quyền, kiểu báo cáo, nội dung; bản chụp dữ liệu gốc của dashboard; file PDF đã xuất.
   Bấm ô đồng hồ ở thanh đầu → bảng «Dữ liệu đã chốt»: trái lịch tháng (ngày có chốt sáng lên), phải các lần chốt của ngày;
   mỗi lần chốt: «Xem trên IOC» hoặc «Tải PDF».
   Xem trên IOC: thay các kho dữ liệu của dashboard bằng bản chụp của mốc rồi vẽ lại TOÀN BỘ IOC bằng chính các hàm vẽ sẵn có — mọi ô,
   «Xem chi tiết», danh sách bên trong đều là dữ liệu của mốc; giờ của IOC (Date) đặt về thời điểm mốc để các phép tính theo ngày
   (quá hạn, sắp hạn, kỳ Tháng/Quý/Năm) ra đúng như lúc chốt; đồng hồ dừng ở giờ của mốc. Chỉ xem: thao tác thêm, sửa, giao nhiệm vụ,
   nhập chỉ tiêu bị khóa (guardAction, mcChiXem). Ẩn/hiện ô («Sửa màn hình») giữ nguyên của người dùng — không nằm trong bản chụp.
   «Về hiện tại»: trả lại đúng các kho dữ liệu đang dùng trước khi xem mốc.
   Lưu ở trình duyệt (IndexedDB «ioc-moc»): kho meta (danh sách mốc theo tài khoản) và kho data (bản chụp nén gzip + file PDF).
   Bản demo: mốc chỉ nằm trên máy, trình duyệt đã xuất; hệ thống thật lưu mốc, file PDF và nhật ký ở máy chủ.
   Nhật ký: xuất báo cáo, xem mốc, tải PDF đều ghi vào nhật ký thao tác (audit-log.js, loại 'moc'). Mọi lớp CSS tiền tố mc- (css/ioc-moc.css). */

const MC = { open: false, y: 0, m: 0, day: null, list: null, acct: null, xem: null, live: null, busy: false, db: null };
const MC_RealDate = Date;
const mcE = (s) => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
const mcP2 = (n) => String(n).padStart(2, '0');
const MC_THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const mcD = (t) => new MC_RealDate(t);
const mcIso = (d) => d.getFullYear() + '-' + mcP2(d.getMonth() + 1) + '-' + mcP2(d.getDate());
const mcGio = (d) => mcP2(d.getHours()) + ':' + mcP2(d.getMinutes()) + ':' + mcP2(d.getSeconds());
const mcNgay = (d) => MC_THU[d.getDay()] + ', ' + mcP2(d.getDate()) + '/' + mcP2(d.getMonth() + 1) + '/' + d.getFullYear();
const mcLuc = (m) => mcGio(mcD(m.t)) + ', ' + mcNgay(mcD(m.t));
/* Mốc theo tài khoản đăng nhập (tài khoản thấy gì thì xuất và xem lại đúng phần đó) */
const mcAcctKey = () => (typeof currentAccount !== 'undefined' && currentAccount ? String(currentAccount.user || currentAccount.title || '') : '');
const mcToast = (s) => { if (typeof toast === 'function') toast(s); };

/* ---------- Kho dữ liệu của dashboard được chụp ----------
   get: đọc kho đang dùng; set: thay bằng giá trị khác (kho khai báo const thì thay ruột, giữ nguyên đối tượng).
   Cấu hình tĩnh, dữ liệu sinh cố định theo hàm (eform mẫu, bản đồ ranh giới…) và số liệu API đọc từ tệp không cần chụp. */
function mcThayRuot(target, src) { Object.keys(target).forEach((k) => { if (!(k in src)) delete target[k]; }); Object.assign(target, src); }
const MC_CAD_KEYS = ['seq', 'inc', 'tickets', 'log', 'notify', 'extraHist'];
const MC_KHO = [
  { k: 'records', get: () => records, set: (v) => { records = v; } },
  { k: 'indicatorRecords', get: () => indicatorRecords, set: (v) => { indicatorRecords = v; } },
  { k: 'segmentTemplate', get: () => segmentTemplate, set: (v) => mcThayRuot(segmentTemplate, v), ruot: true },
  { k: 'categorySeed', get: () => categorySeed, set: (v) => mcThayRuot(categorySeed, v), ruot: true },
  { k: 'gisEformData', get: () => gisEformData, set: (v) => { gisEformData = v; } },
  { k: 'gisEformHistory', get: () => gisEformHistory, set: (v) => { gisEformHistory = v; } },
  { k: 'gisUserReportSeq', get: () => gisUserReportSeq, set: (v) => { gisUserReportSeq = v; } },
  { k: 'cad', on: () => typeof CAD !== 'undefined', get: () => { const o = {}; MC_CAD_KEYS.forEach((x) => { o[x] = CAD[x]; }); return o; }, set: (v) => Object.assign(CAD, v) },
  { k: 'notiFeed', get: () => window.__notiFeed || [], set: (v) => { window.__notiFeed = v; } },
  { k: 'myTaskStatusLog', get: () => window.__myTaskStatusLog || [], set: (v) => { window.__myTaskStatusLog = v; } },
  { k: 'calendarEvents', get: () => window.__calendarEvents || null, set: (v) => { window.__calendarEvents = v; } },
  { k: 'vptuSubtasks', get: () => window.__vptuSubtasks || {}, set: (v) => { window.__vptuSubtasks = v; } },
  { k: 'cameraAlertLinks', get: () => window.__cameraAlertLinks || {}, set: (v) => { window.__cameraAlertLinks = v; } }
];
const mcKhoOn = (x) => !x.on || x.on();
/* Chụp: JSON của mọi kho → nén gzip (bản chụp ~40 MB còn ~2 MB) */
async function mcChup() {
  const kho = {};
  MC_KHO.filter(mcKhoOn).forEach((x) => { kho[x.k] = x.get(); });
  const json = JSON.stringify({ v: 1, kho: kho });
  if (typeof CompressionStream === 'function') {
    const blob = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).blob();
    return { gz: true, blob: blob };
  }
  return { gz: false, blob: new Blob([json], { type: 'application/json' }) };
}
async function mcMo(snap) {
  const stream = snap.gz ? snap.blob.stream().pipeThrough(new DecompressionStream('gzip')) : snap.blob.stream();
  return JSON.parse(await new Response(stream).text());
}
/* Giữ tham chiếu các kho đang dùng (để «Về hiện tại» trả lại đúng như cũ) */
function mcGiuHienTai() {
  const o = {};
  MC_KHO.filter(mcKhoOn).forEach((x) => { const v = x.get(); o[x.k] = x.ruot && v && typeof v === 'object' ? Object.assign({}, v) : v; });
  return o;
}
function mcDatKho(kho) { MC_KHO.filter(mcKhoOn).forEach((x) => { if (x.k in kho) x.set(kho[x.k]); }); mcXoaBoNho(); }
/* Bộ nhớ tạm tính từ dữ liệu: xóa để vẽ lại theo kho mới */
function mcXoaBoNho() {
  if (typeof CTM_CACHE !== 'undefined') Object.keys(CTM_CACHE).forEach((k) => delete CTM_CACHE[k]);
  window.__notiAllRows = null; window.__noticeCameraCache = null;
}

/* ---------- Giờ của IOC khi xem mốc ----------
   Date (không đối số) và Date.now() trả về thời điểm mốc + thời gian đã trôi kể từ lúc bấm xem: mọi phép tính theo ngày ra như lúc
   chốt, đồng hồ hoạt ảnh của biểu đồ vẫn chạy bình thường. Date có đối số giữ nguyên. Nhật ký luôn ghi giờ thật (MC_RealDate). */
function mcDatGio(t) {
  const off = t - MC_RealDate.now();
  function D(...a) {
    if (!new.target) return new MC_RealDate(MC_RealDate.now() + off).toString();
    return a.length ? new MC_RealDate(...a) : new MC_RealDate(MC_RealDate.now() + off);
  }
  D.prototype = MC_RealDate.prototype;
  D.now = () => MC_RealDate.now() + off;
  D.parse = MC_RealDate.parse; D.UTC = MC_RealDate.UTC;
  window.Date = D;
}
function mcTraGio() { window.Date = MC_RealDate; }
function mcGioThat(fn) { const cur = window.Date; window.Date = MC_RealDate; try { return fn(); } finally { window.Date = cur; } }

/* ---------- Lưu trữ IndexedDB ---------- */
function mcDb() {
  if (!MC.db) {
    MC.db = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('Trình duyệt không hỗ trợ lưu dữ liệu chốt.'));
      const r = indexedDB.open('ioc-moc', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' }).createIndex('acct', 'acct');
        if (!db.objectStoreNames.contains('data')) db.createObjectStore('data', { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error('Không mở được kho dữ liệu chốt.'));
    }).catch((e) => { MC.db = null; throw e; });
  }
  return MC.db;
}
const mcReq = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function mcStore(name, mode) { const db = await mcDb(); return db.transaction(name, mode).objectStore(name); }
/* Danh sách mốc của tài khoản đang đăng nhập (chỉ phần mô tả, không nạp bản chụp) */
async function mcNapDs() {
  const k = mcAcctKey();
  if (MC.list && MC.acct === k) return MC.list;
  let ds = [];
  try { ds = await mcReq((await mcStore('meta', 'readonly')).index('acct').getAll(k)); } catch (e) { console.warn('mcNapDs', e); }
  MC.acct = k; MC.list = ds;
  return ds;
}
/* Lưu một mốc: meta (mô tả) + data (bản chụp, PDF, dấu số liệu để đối chiếu) */
async function mcLuu(meta, snap, pdf, dau) {
  const db = await mcDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(['meta', 'data'], 'readwrite');
    tx.objectStore('meta').put(meta);
    tx.objectStore('data').put({ id: meta.id, gz: snap.gz, snap: snap.blob, pdf: pdf, dau: dau });
    tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Bộ nhớ trình duyệt không đủ để lưu dữ liệu chốt.'));
  });
  if (MC.list && MC.acct === meta.acct) MC.list.push(meta);
  return meta;
}
async function mcLayData(id) { return mcReq((await mcStore('data', 'readonly')).get(id)); }
const mcTim = (id) => (MC.list || []).find((x) => x.id === id);
const mcTheoNgay = (iso) => (MC.list || []).filter((x) => mcIso(mcD(x.t)) === iso).sort((a, b) => b.t - a.t);

/* ---------- Dấu số liệu: chữ của các ô chính lúc chốt — để đối chiếu khi xem lại (chỉ ghi ra console) ---------- */
const MC_DAU_SEL = ['#roleScopeCards', '#gisStatusSection', '#gisBottleneckSection', '#gisUserReportsSection'];
function mcDau() { const o = {}; MC_DAU_SEL.forEach((s) => { const el = document.querySelector(s); if (el && el.offsetParent !== null) o[s] = el.innerText.replace(/\s+/g, ' ').trim(); }); return o; }
function mcDoiChieu(dau) {
  if (!dau) return null;
  const now = mcDau(), lech = Object.keys(dau).filter((s) => s in now && now[s] !== dau[s]);
  window.__mcDoiChieu = { khop: !lech.length, lech: lech };
  if (lech.length) console.warn('[Dữ liệu đã chốt] Số trên màn hình khác lúc chốt ở:', lech); else console.info('[Dữ liệu đã chốt] Số trên màn hình khớp lúc chốt.');
  return window.__mcDoiChieu;
}

/* ---------- Nhật ký ---------- */
function mcLog(thaoTac, m) {
  if (typeof pushActionLog !== 'function') return;
  mcGioThat(() => pushActionLog({
    category: 'moc', icon: '', title: (currentAccount ? currentAccount.title : '—') + ' · ' + thaoTac,
    sub: 'Dữ liệu chốt lúc ' + mcLuc(m),
    detail: 'Tài khoản: ' + (currentAccount ? (currentAccount.user || currentAccount.title) : '—') + ' · Thời điểm: ' + mcGio(new MC_RealDate()) + ', ' + mcNgay(new MC_RealDate()) + ' · Mốc: ' + mcLuc(m) + ' · Thao tác: ' + thaoTac
  }));
}

/* ---------- Đồng hồ ---------- */
/* login.js → updateClock() hỏi hàm này: đang xem mốc thì không chạy giờ */
function mcClockFrozen() { return !!MC.xem; }
function mcVeDongHo() {
  const m = MC.xem && mcTim(MC.xem);
  const c = document.getElementById('clock'), dt = document.getElementById('dateText');
  if (m) { if (c) c.textContent = mcGio(mcD(m.t)); if (dt) dt.textContent = mcNgay(mcD(m.t)); }
  else if (typeof updateClock === 'function') updateClock();
  const card = document.getElementById('clockCard');
  if (card) card.title = m ? 'Đang xem dữ liệu đã chốt — bấm để chọn mốc khác hoặc về hiện tại' : 'Xem dữ liệu đã chốt';
}
/* Đang xem mốc thì chặn thao tác thay đổi dữ liệu (gọi từ guardAction, nhập chỉ tiêu, xuất báo cáo) */
function mcChiXem(label) {
  if (!MC.xem) return false;
  const m = mcTim(MC.xem);
  mcToast('Đang xem dữ liệu đã chốt' + (m ? ' lúc ' + mcLuc(m) : '') + ' — chỉ xem, không ' + (label || 'thao tác') + ' được. Bấm «Về hiện tại» để làm việc với số liệu hiện tại.');
  return true;
}

/* ---------- Mở, đóng bảng ---------- */
async function mcOpen() {
  if (MC.open) return mcClose();
  if (typeof toggleAccountMenu === 'function') toggleAccountMenu(false);
  const list = await mcNapDs(), now = new MC_RealDate();
  const ref = (MC.xem && mcTim(MC.xem)) || null;
  const d = ref ? mcD(ref.t) : now;
  MC.y = d.getFullYear(); MC.m = d.getMonth();
  /* ngày chọn sẵn: ngày đang xem, không thì hôm nay nếu có chốt, không thì ngày chốt gần nhất trong tháng này */
  const homNay = mcIso(now), trongThang = list.filter((x) => { const t = mcD(x.t); return t.getFullYear() === MC.y && t.getMonth() === MC.m; }).sort((a, b) => b.t - a.t);
  MC.day = ref ? mcIso(d) : (trongThang.some((x) => mcIso(mcD(x.t)) === homNay) || !trongThang.length ? homNay : mcIso(mcD(trongThang[0].t)));
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
  const card = document.getElementById('clockCard'); if (card) card.setAttribute('aria-expanded', 'false');
}
/* Đặt bảng ngay dưới ô đồng hồ, canh mép phải theo ô (màn hẹp: CSS cho kín ngang) */
function mcDat() {
  const p = document.querySelector('#mcOv .mc-pop'), card = document.getElementById('clockCard');
  if (!p || !card || window.innerWidth <= 640) { if (p) { p.style.top = ''; p.style.left = ''; } return; }
  const r = card.getBoundingClientRect(), w = p.offsetWidth;
  p.style.top = Math.round(r.bottom + 8) + 'px';
  p.style.left = Math.round(Math.max(16, Math.min(r.right - w, window.innerWidth - w - 16))) + 'px';
}

/* ---------- Vẽ bảng ---------- */
function mcRender() {
  const ov = document.getElementById('mcOv');
  if (!ov || !MC.open) return;
  const xem = MC.xem && mcTim(MC.xem);
  ov.innerHTML = '<div class="mc-pop" role="dialog" aria-modal="true" aria-labelledby="mcT">' +
    '<div class="mc-head"><span class="mc-hic"><i class="ti ti-history"></i></span><div class="mc-ht"><b id="mcT">Dữ liệu đã chốt</b><small>Mỗi lần xuất báo cáo, IOC chốt lại dữ liệu đúng lúc bấm xuất. Ngày sáng màu là ngày có chốt, bấm vào để xem.</small></div>' +
    '<button type="button" class="mc-x" data-mc="close" aria-label="Đóng"><i class="ti ti-x"></i></button></div>' +
    (xem ? '<div class="mc-now"><i class="ti ti-eye"></i><span>Đang xem dữ liệu chốt lúc <b>' + mcE(mcLuc(xem)) + '</b></span><button type="button" class="mc-btn primary" data-mc="ve"><i class="ti ti-arrow-back-up"></i>Về hiện tại</button></div>' : '') +
    '<div class="mc-body"><div class="mc-cal">' + mcLich() + '</div><div class="mc-day">' + mcNgayHtml() + '</div></div>' +
    '<div class="mc-foot"><i class="ti ti-info-circle"></i><span>Dữ liệu chốt lưu trên trình duyệt của máy này' + (MC.list && MC.list.length ? '' : '. Chưa có lần chốt nào: bấm <b>«Xuất báo cáo»</b> để chốt dữ liệu lần đầu') + '.</span></div></div>';
  mcDat();
}
function mcLich() {
  const now = new MC_RealDate(), homNay = mcIso(now), y = MC.y, m = MC.m;
  const dau = new MC_RealDate(y, m, 1), soNgay = new MC_RealDate(y, m + 1, 0).getDate(), lech = (dau.getDay() + 6) % 7; /* tuần bắt đầu Thứ 2 */
  const dem = {}; (MC.list || []).forEach((x) => { const t = mcD(x.t); if (t.getFullYear() === y && t.getMonth() === m) { const k = mcIso(t); dem[k] = (dem[k] || 0) + 1; } });
  const tong = Object.values(dem).reduce((s, n) => s + n, 0), soNgayCo = Object.keys(dem).length;
  const toi = y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth());
  const xemM = MC.xem && mcTim(MC.xem), xemIso = xemM ? mcIso(mcD(xemM.t)) : null;
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
const MC_KIEU = { tq: 'Báo cáo tổng quan', ct: 'Báo cáo chi tiết' };
function mcNgayHtml() {
  const d = MC.day ? new MC_RealDate(MC.day + 'T00:00:00') : new MC_RealDate();
  const ds = MC.day ? mcTheoNgay(MC.day) : [];
  let o = '<div class="mc-dh"><b>' + mcE(mcNgay(d)) + '</b><small>' + (ds.length ? ds.length + ' lần chốt' : 'Không có lần chốt nào') + '</small></div>';
  if (!ds.length) return o + '<div class="mc-empty"><i class="ti ti-calendar-off"></i><p>' + (MC.list && MC.list.length ? 'Ngày này không xuất báo cáo nên không có dữ liệu chốt.<br>Chọn một ngày <b>sáng màu</b> ở lịch bên trái.' : 'Chưa có lần chốt nào.<br>Bấm <b>«Xuất báo cáo»</b> ở thanh đầu trang để chốt dữ liệu lần đầu.') + '</p></div>';
  return o + '<div class="mc-list">' + ds.map((x) => {
    const on = x.id === MC.xem, t = mcD(x.t);
    return '<div class="mc-it' + (on ? ' on' : '') + '"><div class="mc-ith"><span class="mc-time"><i class="ti ti-clock"></i>' + mcE(mcGio(t)) + '</span>' +
      '<span class="mc-tag ' + x.kieu + '">' + (MC_KIEU[x.kieu] || '') + '</span>' + (on ? '<span class="mc-tag xem"><i class="ti ti-eye"></i>Đang xem</span>' : '') + '</div>' +
      '<dl class="mc-kv"><dt>Người xuất</dt><dd>' + mcE(x.nguoi) + '</dd>' + (x.donVi ? '<dt>Đơn vị</dt><dd>' + mcE(x.donVi) + '</dd>' : '') + '<dt>Nội dung</dt><dd>' + mcE((x.noiDung || []).join(', ') || '—') + '</dd></dl>' +
      '<div class="mc-ita">' + (on ? '<button type="button" class="mc-btn" data-mc="ve"><i class="ti ti-arrow-back-up"></i>Về hiện tại</button>'
        : '<button type="button" class="mc-btn primary" data-mc="xem" data-id="' + x.id + '"' + (MC.busy ? ' disabled' : '') + '><i class="ti ti-eye"></i>Xem trên IOC</button>') +
      '<button type="button" class="mc-btn" data-mc="pdf" data-id="' + x.id + '"><i class="ti ti-file-download"></i>Tải PDF</button></div></div>';
  }).join('') + '</div>';
}

/* ---------- Thao tác ---------- */
function mcClick(e) {
  const b = e.target.closest('[data-mc]');
  if (!b || b.disabled) return;
  const a = b.dataset.mc;
  if (a === 'close') return mcClose();
  if (a === 'prev' || a === 'next') { const d = new MC_RealDate(MC.y, MC.m + (a === 'prev' ? -1 : 1), 1); MC.y = d.getFullYear(); MC.m = d.getMonth(); return mcRender(); }
  if (a === 'thisMonth') { const d = new MC_RealDate(); MC.y = d.getFullYear(); MC.m = d.getMonth(); return mcRender(); }
  if (a === 'day') { MC.day = b.dataset.d; mcRender(); const f = document.querySelector('#mcOv .mc-d.sel'); if (f) f.focus({ preventScroll: true }); return; }
  if (a === 'xem') return mcXem(b.dataset.id);
  if (a === 've') return mcVeHienTai();
  if (a === 'pdf') return mcPdf(b.dataset.id);
}
/* Vẽ lại toàn bộ IOC theo kho đang đặt (dùng cả khi vào mốc và khi về hiện tại) */
function mcVeLai() {
  if (typeof closePanels === 'function') closePanels();
  if (typeof closeModal === 'function') try { closeModal(); } catch (e) { /* không có hộp đang mở */ }
  if (typeof renderAll === 'function' && typeof currentAccount !== 'undefined' && currentAccount) renderAll();
  mcVeLaiBanDo();
}
/* Bản đồ GIS: vẽ lại điểm theo gisEformData đang đặt (không sinh lại dữ liệu như refreshGisScope) */
function mcVeLaiBanDo() {
  if (typeof GM === 'undefined' || !GM.map || typeof createGisGroups !== 'function') return;
  try {
    [...GIS_BOTTLENECKS.map((b) => b.code), ...GIS_EMERGENCY_TYPES.map((e) => e.code), 'zones'].forEach((k) => { if (GM.groups[k]) { GM.map.removeLayer(GM.groups[k]); if (typeof GM.groups[k].clearLayers === 'function') GM.groups[k].clearLayers(); } });
    GM.markerRefs.clear();
    createGisGroups();
  } catch (e) { console.warn('mcVeLaiBanDo', e); }
}
/* Xem một mốc trên IOC */
async function mcXem(id) {
  const m = mcTim(id);
  if (!m || MC.busy) return;
  MC.busy = true; mcRender();
  mcToast('Đang nạp dữ liệu chốt lúc ' + mcLuc(m) + '…');
  try {
    const d = await mcLayData(id);
    if (!d || !d.snap) throw new Error('Không tìm thấy bản chụp dữ liệu của mốc này.');
    const snap = await mcMo({ gz: d.gz, blob: d.snap });
    if (!MC.live) MC.live = mcGiuHienTai(); /* đang xem mốc khác thì giữ nguyên dữ liệu hiện tại đã giữ từ trước */
    mcDatKho(snap.kho);
    MC.xem = id;
    mcDatGio(m.t);
    mcClose();
    mcVeLai(); mcVeDongHo(); mcBanner();
    mcLog('Xem dữ liệu đã chốt trên IOC', m);
    setTimeout(() => mcDoiChieu(d.dau), 900);
    mcToast('Đang xem dữ liệu chốt lúc ' + mcLuc(m) + '. Chỉ xem, không thêm, sửa được.');
  } catch (e) {
    console.error(e);
    mcToast('Không mở được dữ liệu đã chốt: ' + (e && e.message ? e.message : e));
  } finally { MC.busy = false; if (MC.open) mcRender(); }
}
/* Về số liệu hiện tại. ve=false: chỉ trả dữ liệu, không vẽ (dùng khi đăng xuất) */
function mcVeHienTai(ve) {
  if (!MC.xem) { mcClose(); return; }
  mcTraGio();
  if (MC.live) mcDatKho(MC.live);
  MC.live = null; MC.xem = null;
  mcClose();
  if (ve !== false) { mcVeLai(); mcVeDongHo(); mcBanner(); mcToast('Đã về số liệu hiện tại.'); }
  else mcBanner();
}
async function mcPdf(id) {
  const m = mcTim(id); if (!m) return;
  try {
    const d = await mcLayData(id);
    if (!d || !d.pdf) throw new Error('Không tìm thấy file PDF của mốc này.');
    mcTai(d.pdf, m.pdfName || 'BaoCao_IOC.pdf');
    mcLog('Tải file PDF dữ liệu đã chốt', m);
  } catch (e) { mcToast('Không tải được file PDF: ' + (e && e.message ? e.message : e)); }
}
function mcTai(blob, ten) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = ten;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
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
  el.innerHTML = '<span><i class="ti ti-history"></i> Đang xem <b>dữ liệu đã chốt lúc ' + mcE(mcLuc(m)) + '</b>. Chỉ xem: không thêm, sửa, giao nhiệm vụ, nhập chỉ tiêu được.</span>' +
    '<span class="mc-bact"><button class="ghost" data-mc="lich">Chọn mốc khác</button><button class="ghost" data-mc="ve">← Về hiện tại</button></span>';
  el.classList.remove('hidden');
}
/* Đăng xuất / đổi tài khoản: trả dữ liệu hiện tại, bỏ trạng thái xem mốc, quên danh sách của tài khoản cũ */
function mcReset() { if (MC.xem) mcVeHienTai(false); MC.list = null; MC.acct = null; mcClose(); }
