/* ============================== XUẤT BÁO CÁO PDF (task TU-274, 05/11/2026) ==============================
   Dựng file PDF từ lựa chọn ở hộp «Xuất báo cáo» (js/features/ioc-xuat.js). Hai kiểu:
     Tổng quan — ảnh chụp đúng các ô đang hiện trên màn hình (html2canvas), chỉ tiêu thì thêm bảng số liệu của từng đơn vị đã chọn.
     Chi tiết  — như Tổng quan, thêm danh sách bên trong từng ô, đúng các cột của màn «Xem chi tiết»: văn bản, nhiệm vụ, điểm nghẽn,
                 báo cáo người dùng, sự cố CAD, thông báo Notify; chỉ tiêu thêm dữ liệu gốc đơn vị đã nhập (eform).
   Số liệu chỉ tiêu lấy bằng CHÍNH hàm «Xuất Excel» sẵn có của từng đơn vị (ctmExport, stcExport, sgdExport, hccExport,
   exportCategoryToExcel) chạy ở chế độ chỉ lấy bảng (ipBangDonVi): không tải file Excel, chỉ đọc các trang (sheet) rồi in vào PDF —
   nên số trong PDF trùng với file Excel và màn hình, không thêm trường hay số nào ngoài các bảng đó.
   Thư viện: jsPDF + jspdf-autotable (cdnjs, nạp khi bấm xuất lần đầu), font Be Vietnam Pro (lib/fonts, giấy phép OFL) để có dấu tiếng Việt.
   Mọi hàm có tiền tố ip. */

const IP = { libs: null, font: null };
const IP_LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];
const IP_FONTS = { normal: 'lib/fonts/BeVietnamPro-Regular.ttf', bold: 'lib/fonts/BeVietnamPro-Bold.ttf' };
const IP_PAGE = { W: 297, H: 210, M: 12, FOOT: 9 };
const IP_THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const ipP2 = (n) => String(n).padStart(2, '0');
const ipGio = (d) => ipP2(d.getHours()) + ':' + ipP2(d.getMinutes()) + ':' + ipP2(d.getSeconds());
const ipNgay = (d) => IP_THU[d.getDay()] + ', ' + ipP2(d.getDate()) + '/' + ipP2(d.getMonth() + 1) + '/' + d.getFullYear();
const ipWait = (ms) => new Promise((r) => setTimeout(r, ms));
const ipFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

/* ---------- Nạp thư viện, font ---------- */
function ipScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res; s.onerror = () => rej(new Error('Không tải được thư viện PDF (' + src.split('/').slice(-2).join('/') + ')'));
    document.head.appendChild(s);
  });
}
function ipLibs() {
  if (!IP.libs) {
    IP.libs = (async () => {
      if (!(window.jspdf && window.jspdf.jsPDF)) await ipScript(IP_LIBS[0]);
      if (!window.jspdf.jsPDF.API.autoTable) await ipScript(IP_LIBS[1]);
    })().catch((e) => { IP.libs = null; throw e; });
  }
  return IP.libs;
}
function ipB64(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
function ipFont() {
  if (!IP.font) {
    IP.font = Promise.all(['normal', 'bold'].map((k) => fetch(IP_FONTS[k]).then((r) => { if (!r.ok) throw new Error('font ' + r.status); return r.arrayBuffer(); }).then(ipB64)))
      .then(([n, b]) => ({ normal: n, bold: b }))
      .catch(() => null); /* không đọc được font (VD mở file:// trực tiếp) → dùng font mặc định, mất dấu tiếng Việt */
  }
  return IP.font;
}

/* ---------- Khung tài liệu: con trỏ dòng, tiêu đề, đoạn chữ, ảnh, bảng ---------- */
function ipDoc(font) {
  const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  let F = 'helvetica';
  if (font) {
    doc.addFileToVFS('BVP-R.ttf', font.normal); doc.addFont('BVP-R.ttf', 'BVP', 'normal');
    doc.addFileToVFS('BVP-B.ttf', font.bold); doc.addFont('BVP-B.ttf', 'BVP', 'bold');
    F = 'BVP';
  }
  const P = IP_PAGE, X = { doc: doc, F: F, y: P.M };
  const bottom = () => P.H - P.M - P.FOOT;
  X.newPage = () => { doc.addPage(); X.y = P.M; };
  X.ensure = (h) => { if (X.y + h > bottom()) X.newPage(); };
  X.text = (s, o) => {
    o = o || {};
    doc.setFont(F, o.bold ? 'bold' : 'normal'); doc.setFontSize(o.size || 9.5); doc.setTextColor.apply(doc, o.color || [33, 41, 54]);
    const lines = doc.splitTextToSize(String(s == null ? '' : s), o.w || (P.W - 2 * P.M - (o.x || 0)));
    const lh = (o.size || 9.5) * 0.42;
    X.flush(lh * Math.min(lines.length, 3) + 8);
    lines.forEach((ln) => { X.ensure(lh); doc.text(ln, P.M + (o.x || 0), X.y + lh * 0.8); X.y += lh; });
    X.y += o.after == null ? 1.5 : o.after;
  };
  X.h1 = (s) => { X.ensure(14); doc.setFillColor(22, 58, 99); doc.rect(P.M, X.y, P.W - 2 * P.M, 9, 'F'); doc.setFont(F, 'bold'); doc.setFontSize(12); doc.setTextColor(255, 255, 255); doc.text(String(s), P.M + 3, X.y + 6.2); X.y += 12; };
  /* Tiêu đề phần: chờ tới khi có nội dung đầu tiên rồi mới vẽ, để tiêu đề không nằm lẻ cuối trang còn nội dung sang trang sau */
  X.dau = null;
  X.h2 = (s) => { X.dau = String(s); };
  X.flush = (need) => {
    if (!X.dau) return;
    X.ensure(10.5 + Math.min(need || 0, bottom() - P.M - 10.5));
    doc.setDrawColor(44, 125, 210); doc.setLineWidth(0.6); doc.line(P.M, X.y + 6.5, P.M + 2.5, X.y + 6.5);
    doc.setFont(F, 'bold'); doc.setFontSize(10.5); doc.setTextColor(22, 58, 99); doc.text(X.dau, P.M + 4, X.y + 7.6);
    X.y += 10.5; X.dau = null;
  };
  X.note = (s) => X.text(s, { size: 8, color: [96, 108, 124], after: 2 });
  /* Ảnh: rộng theo bề rộng thật của ô trên màn hình (tối đa khổ ngang); ảnh cao hơn trang thì cắt thành nhiều trang */
  X.img = (cv) => {
    if (!cv || !cv.width || !cv.height) return;
    const wMax = P.W - 2 * P.M, w = Math.min(wMax, (cv.__cssW || cv.width) * 0.2646 * 1.1), k = w / cv.width;
    X.flush(cv.height * k + 2);
    const room = bottom() - P.M;
    if (cv.height * k <= room) {
      X.ensure(cv.height * k + 2);
      doc.addImage(cv.toDataURL('image/jpeg', 0.86), 'JPEG', P.M, X.y, w, cv.height * k);
      X.y += cv.height * k + 4; return;
    }
    let sy = 0; const sliceH = Math.floor(room / k);
    while (sy < cv.height) {
      const h = Math.min(sliceH, cv.height - sy), part = document.createElement('canvas');
      part.width = cv.width; part.height = h; part.getContext('2d').drawImage(cv, 0, sy, cv.width, h, 0, 0, cv.width, h);
      if (X.y + h * k > bottom()) X.newPage();
      doc.addImage(part.toDataURL('image/jpeg', 0.86), 'JPEG', P.M, X.y, w, h * k);
      X.y += h * k + 3; sy += h;
    }
    X.y += 1;
  };
  /* Bảng: head mảng tên cột, rows mảng dòng; nhiều cột thì tự ngắt sang trang ngang */
  X.table = (head, rows, o) => {
    o = o || {};
    if (!rows.length) { X.note(o.empty || 'Không có bản ghi.'); return; }
    X.flush(28);
    doc.autoTable({
      head: [head], body: rows, startY: X.y, margin: { left: P.M, right: P.M, top: P.M, bottom: P.M + P.FOOT },
      theme: 'grid', tableWidth: 'auto', rowPageBreak: 'avoid',
      horizontalPageBreak: head.length > (o.maxCols || 14), horizontalPageBreakRepeat: o.repeatCol == null ? 0 : o.repeatCol,
      styles: { font: F, fontStyle: 'normal', fontSize: o.size || 7.2, cellPadding: 1.2, overflow: 'linebreak', valign: 'top', lineColor: [214, 222, 232], lineWidth: 0.15, textColor: [33, 41, 54] },
      headStyles: { font: F, fontStyle: 'bold', fillColor: [22, 58, 99], textColor: 255, valign: 'middle' },
      alternateRowStyles: { fillColor: [246, 249, 252] },
      columnStyles: o.cols || {}
    });
    X.y = doc.lastAutoTable.finalY + 6;
  };
  return X;
}
/* Chân trang: ghi thời điểm chốt và số trang trên mọi trang */
function ipFooter(X, meta) {
  const doc = X.doc, P = IP_PAGE, n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(214, 222, 232); doc.setLineWidth(0.2); doc.line(P.M, P.H - P.M - 4, P.W - P.M, P.H - P.M - 4);
    doc.setFont(X.F, 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 122, 138);
    doc.text('IOC/CAD · ' + meta.donVi + ' · Dữ liệu chốt lúc ' + ipGio(meta.t) + ', ' + ipNgay(meta.t), P.M, P.H - P.M);
    doc.text('Trang ' + i + '/' + n, P.W - P.M, P.H - P.M, { align: 'right' });
  }
}

/* ---------- Chụp ảnh một ô trên màn hình ---------- */
function ipBg() {
  const c = getComputedStyle(document.body).backgroundColor;
  return !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent' ? '#06172b' : c;
}
async function ipChup(sel) {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  if (!el || !el.offsetWidth || !el.offsetHeight || typeof html2canvas !== 'function') return null;
  try {
    const cv = await html2canvas(el, { backgroundColor: ipBg(), scale: Math.min(2, Math.max(1.25, 1600 / Math.max(el.offsetWidth, 1))), useCORS: true, logging: false, imageTimeout: 4000 });
    cv.__cssW = el.offsetWidth;
    return cv;
  } catch (e) { console.warn('ipChup', sel, e); return null; }
}

/* ---------- Danh sách bên trong các ô (đúng cột màn «Xem chi tiết») ---------- */
const ipS = (v) => (v == null ? '' : String(v));
function ipRecordRows(metricList, axisSel) {
  let rs = records.filter((r) => metricList.includes(r.metric) && canSeeRole(r.role));
  if (axisSel) rs = rs.filter((r) => r.role === axisSel);
  return rs;
}
function ipBangVanBan(X) {
  const rs = ipRecordRows(['docIn', 'docOut']);
  X.note(rs.length.toLocaleString('vi-VN') + ' văn bản (như màn «Xem chi tiết» của ô Văn bản).');
  X.table(['STT', 'Số ký hiệu', 'Loại', 'Trục', 'Trích yếu văn bản', 'Đơn vị', 'Người/Đơn vị phối hợp', 'Nhóm lĩnh vực', 'Ngày bắt đầu', 'Hạn xử lý', 'Trạng thái xử lý'],
    rs.map((r, i) => [i + 1, r.id, metricMeta[r.metric].short, roleMeta(r.role).name, r.title, ipS(r.unit), ipS(r.coop), ipS(r.field), ipS(r.created), ipS(r.due), statusMeta(r.status).label]),
    { size: 6.8, cols: { 0: { cellWidth: 10 }, 1: { cellWidth: 35 }, 2: { cellWidth: 13 }, 3: { cellWidth: 14 }, 4: { cellWidth: 50 }, 5: { cellWidth: 36 }, 6: { cellWidth: 36 }, 7: { cellWidth: 19 }, 8: { cellWidth: 17.5 }, 9: { cellWidth: 17.5 } } });
}
function ipBangNhiemVu(X, metric) {
  const sel = (window.__overviewAxisSel || {})[metric] || '';
  const rs = ipRecordRows([metric], sel);
  X.note(rs.length.toLocaleString('vi-VN') + ' nhiệm vụ' + (sel ? ' · trục ' + roleMeta(sel).name + ' (đang chọn ở ô)' : '') + ' (như màn «Xem chi tiết»).');
  X.table(['STT', 'Số ký hiệu', 'Trục', 'Tiêu đề nhiệm vụ', metric === 'assigned' ? 'Đơn vị chủ trì' : 'Đơn vị giao', 'Người/Đơn vị phối hợp', 'Nhóm lĩnh vực', 'Ngày bắt đầu', 'Hạn xử lý', 'Trạng thái xử lý', 'Kết quả xử lý'],
    rs.map((r, i) => [i + 1, r.id, roleMeta(r.role).name, r.title, ipS(r.unit), ipS(r.coop), ipS(r.field), ipS(r.created), ipS(r.due), statusMeta(r.status).label, taskResultBucketMeta(taskResultBucket(r)).label]),
    { size: 6.8, cols: { 0: { cellWidth: 10 }, 1: { cellWidth: 35 }, 2: { cellWidth: 14 }, 3: { cellWidth: 52 }, 4: { cellWidth: 38 }, 5: { cellWidth: 38 }, 6: { cellWidth: 19 }, 7: { cellWidth: 17.5 }, 8: { cellWidth: 17.5 } } });
}
function ipNgayGio(v) { if (!v) return ''; const d = new Date(v); return isNaN(d) ? ipS(v) : ipP2(d.getDate()) + '/' + ipP2(d.getMonth() + 1) + '/' + d.getFullYear(); }
function ipBangDiemNghen(X) {
  const rs = (typeof gisEformData !== 'undefined' ? gisEformData : []).filter((r) => r.source_type !== 'user_report');
  X.table(['STT', 'Mã', 'Nhóm', 'Tên điểm nghẽn', 'Địa điểm', 'Mức độ', 'Trạng thái', 'Số phản ánh', 'Hạn xử lý'],
    rs.map((r, i) => { const b = gisBottleneckMeta(r.bottleneck_code) || {}; return [i + 1, r.id, ipS(b.name), ipS(r.title || r.name), ipS(r.location_text), gisDangerLabel(Number(r.danger_level) || 0), ipS(gisStatusLabel[r.status] || r.status), r.reportCount || 1, ipS(r.due_at)]; }),
    { cols: { 0: { cellWidth: 9 }, 3: { cellWidth: 60 }, 4: { cellWidth: 60 } } });
}
function ipBangBaoCaoND(X) {
  const act = (typeof gisEformData !== 'undefined' ? gisEformData : []).filter((r) => r.source_type === 'user_report').map((r) => [r, 'Đang hiển thị']);
  const his = (typeof gisEformHistory !== 'undefined' ? gisEformHistory : []).map((r) => [r, 'Đã xử lý']);
  X.table(['STT', 'Nội dung', 'Nhóm', 'Số phản ánh', 'Mức độ', 'Tình trạng'],
    act.concat(his).map(([r, t], i) => { const b = gisBottleneckMeta(r.bottleneck_code) || {}; return [i + 1, ipS(r.title), ipS(b.name), r.reportCount || 1, gisDangerLabel(Number(r.danger_level) || 0), t]; }),
    { empty: 'Chưa có báo cáo nào của người dùng.' });
}
const IP_CAD_ST = { open: 'Chưa điều phối', doing: 'Đang xử lý', done: 'Hoàn thành' };
function ipBangCad(X) {
  if (typeof CAD === 'undefined' || typeof cadIncStatus !== 'function') { X.note('Không có dữ liệu điều phối CAD.'); return; }
  const rs = Object.values(CAD.inc || {});
  X.table(['STT', 'Mã', 'Sự cố', 'Địa điểm', 'Số phản ánh', 'Lực lượng điều động', 'Trạng thái'],
    rs.map((inc, i) => [i + 1, inc.id, ipS(inc.title), ipS(inc.loc), inc.reportCount || 1, (inc.forces || []).filter((f) => f.on).length, IP_CAD_ST[cadIncStatus(inc)] || cadIncStatus(inc)]),
    { cols: { 0: { cellWidth: 9 }, 2: { cellWidth: 70 }, 3: { cellWidth: 70 } }, empty: 'Chưa có sự cố nào đang điều phối.' });
}
/* Notify: chuyển sang tab cần xuất, đọc đủ các dòng của tab (window.__notiAllRows) rồi trả lại tab cũ */
async function ipNotifyTab(tab, fn) {
  const old = window.__notiActiveTab, oldSt = window.__notiActiveStatuses, inp = document.getElementById('myTaskSearchInput'), oldQ = inp ? inp.value : '';
  window.__notiActiveTab = tab; window.__notiActiveStatuses = []; if (inp) inp.value = '';
  try { if (typeof renderMyTasksNotify === 'function') renderMyTasksNotify(); await ipFrame(); return await fn(); }
  finally { window.__notiActiveTab = old; window.__notiActiveStatuses = oldSt; if (inp) inp.value = oldQ; if (typeof renderMyTasksNotify === 'function') renderMyTasksNotify(); }
}
function ipNotifyRows() {
  const div = document.createElement('div');
  return (window.__notiAllRows || []).map((h, i) => {
    div.innerHTML = typeof h === 'string' ? h : (h && h.html) || '';
    const b = div.querySelector('b'), sm = div.querySelector('small');
    const tags = [...div.querySelectorAll('.badge, span[class*="badge"], .pill')].map((x) => x.textContent.trim()).filter(Boolean);
    return [i + 1, b ? b.textContent.trim() : div.textContent.trim(), sm ? sm.textContent.trim() : '', [...new Set(tags)].join(' · ')];
  });
}

/* ---------- Chỉ tiêu: chạy hàm «Xuất Excel» của đơn vị ở chế độ chỉ lấy bảng ---------- */
function ipCellText(v) {
  if (v == null) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('vi-VN') : v.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  if (v instanceof Date) return ipNgayGio(v.getTime());
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((x) => x.text).join('');
    if ('result' in v) return ipCellText(v.result);
    if (v.text != null) return String(v.text);
    return '';
  }
  return String(v);
}
/* Đọc một trang Excel: các dòng đầu có ≤ 1 ô là ghi chú; dòng tiếp theo là tên cột; còn lại là thân bảng */
function ipSheet(ws) {
  const all = [];
  ws.eachRow({ includeEmpty: true }, (row) => { const v = (row.values || []).slice(1).map(ipCellText); all.push(v); });
  const notes = []; let i = 0;
  while (i < all.length && all[i].filter((c) => c !== '').length <= 1) { const t = all[i].join('').trim(); if (t) notes.push(t); i++; }
  const head = all[i] || [];
  const w = Math.max(head.length, ...all.slice(i + 1).map((r) => r.length), 0);
  const pad = (r) => { const o = r.slice(0, w); while (o.length < w) o.push(''); return o; };
  return { name: ws.name, notes: notes, head: pad(head), rows: all.slice(i + 1).filter((r) => r.some((c) => c !== '')).map(pad) };
}
function ipLoaiTrang(name) { return /xã|phường|tỉnh thành/i.test(name) ? 'xa' : /gốc|bản ghi|eform|dữ liệu|api/i.test(name) ? 'dl' : 'so'; }
async function ipBangDonVi(role, id) {
  if (typeof ExcelJS === 'undefined') return { loi: 'Chưa tải được thư viện bảng tính.' };
  const RealWB = ExcelJS.Workbook, realClick = HTMLAnchorElement.prototype.click, realToast = window.toast;
  const oldId = typeof CTM_UI !== 'undefined' ? CTM_UI.id : null, oldPer = typeof CTM_UI !== 'undefined' ? CTM_UI.period : null;
  let wb = null;
  ExcelJS.Workbook = function () { wb = new RealWB(); return wb; };
  HTMLAnchorElement.prototype.click = function () { if (this.download && /\.xlsx$/i.test(this.download)) return; return realClick.call(this); };
  window.toast = function () {};
  try {
    if (typeof CTM_SPECS !== 'undefined' && CTM_SPECS[id] && typeof ctmExport === 'function') {
      if (CTM_UI.id !== id) { CTM_UI.id = id; CTM_UI.period = null; }
      await ctmExport();
    } else if (id === 'ubnd-taichinh' && typeof stcExport === 'function') await stcExport();
    else if (id === 'ubnd-gddt' && typeof sgdExport === 'function') await sgdExport();
    else if (id === 'ubnd-hcc' && typeof hccExport === 'function') await hccExport();
    else if (typeof exportCategoryToExcel === 'function') await exportCategoryToExcel(role, id);
  } catch (e) { console.warn('ipBangDonVi', id, e); }
  finally {
    ExcelJS.Workbook = RealWB; HTMLAnchorElement.prototype.click = realClick; window.toast = realToast;
    if (typeof CTM_UI !== 'undefined') { CTM_UI.id = oldId; CTM_UI.period = oldPer; }
  }
  if (!wb || !wb.worksheets.length) return { loi: 'Đơn vị này chưa có số liệu để xuất.' };
  return { sheets: wb.worksheets.map(ipSheet) };
}
function ipInTrang(X, sh) {
  X.text(sh.name, { bold: true, size: 9, after: 1 });
  sh.notes.forEach((t) => X.note(t));
  X.table(sh.head, sh.rows, { size: sh.head.length > 10 ? 6.4 : 7.2, maxCols: 12, repeatCol: 0, empty: 'Trang này chưa có dòng số liệu.' });
}

/* ---------- Dựng báo cáo ----------
   o: { t: Date (thời điểm chốt), kieu: 'tq'|'ct', phan: [{ key: 'khoi.muc', khoi, ten }], donVi: [{ role, id, ten }],
        nguoi, user, phamVi, donViTen, onStep(i, n, ten) } → Blob PDF */
async function ipTaoBaoCao(o) {
  await ipLibs();
  const font = await ipFont();
  const X = ipDoc(font), ct = o.kieu === 'ct', meta = { t: o.t, donVi: o.donViTen };
  /* Trang bìa */
  X.y = 26;
  X.text(ct ? 'BÁO CÁO CHI TIẾT' : 'BÁO CÁO TỔNG QUAN', { bold: true, size: 20, color: [22, 58, 99], after: 1 });
  X.text('TRUNG TÂM ĐIỀU HÀNH IOC/CAD · ' + String(o.donViTen || '').toUpperCase(), { bold: true, size: 11, color: [44, 125, 210], after: 8 });
  const nd = [];
  o.phan.forEach((p) => { const k = nd.find((x) => x.khoi === p.khoi); if (k) k.muc.push(p.ten); else nd.push({ khoi: p.khoi, muc: [p.ten] }); });
  X.doc.autoTable({
    startY: X.y, margin: { left: IP_PAGE.M, right: IP_PAGE.M }, theme: 'plain', tableWidth: 200,
    styles: { font: X.F, fontSize: 10, cellPadding: { top: 1.6, bottom: 1.6, left: 0, right: 4 }, textColor: [33, 41, 54] },
    columnStyles: { 0: { cellWidth: 52, textColor: [96, 108, 124] }, 1: { fontStyle: 'bold' } },
    body: [
      ['Thời điểm chốt dữ liệu', ipGio(o.t) + ', ' + ipNgay(o.t)],
      ['Người xuất', o.nguoi + (o.user ? ' (' + o.user + ')' : '')],
      ['Đơn vị', o.donViTen || ''],
      ['Phạm vi quyền', o.phamVi || ''],
      ['Kiểu báo cáo', ct ? 'Chi tiết — các ô và danh sách bên trong' : 'Tổng quan — các ô số, biểu đồ như trên màn hình'],
      ['Nội dung', nd.map((x) => x.khoi + ': ' + x.muc.join('; ')).join('\n')]
    ].concat(o.donVi && o.donVi.length ? [['Đơn vị chỉ tiêu', o.donViTatCa ? 'Tất cả đơn vị chỉ tiêu tài khoản được xem' : o.donVi.slice(0, 12).map((d) => d.ten).join(', ') + (o.donVi.length > 12 ? ' và ' + (o.donVi.length - 12) + ' đơn vị khác' : '')]] : [])
  });
  X.y = X.doc.lastAutoTable.finalY + 8;
  X.note('Số liệu trong báo cáo là dữ liệu IOC đã chốt lúc xuất báo cáo, lấy như đang hiển thị trên màn hình và chỉ gồm phần tài khoản được xem. Dữ liệu chốt được giữ nguyên kể cả khi dữ liệu gốc thay đổi sau đó. Xem lại trên IOC: bấm ô đồng hồ ở thanh đầu trang, chọn ngày và giờ chốt.');

  /* Các phần */
  const n = o.phan.length;
  let khoiTruoc = null;
  for (let i = 0; i < n; i++) {
    const p = o.phan[i];
    if (o.onStep) o.onStep(i, n, p.ten);
    await ipFrame();
    if (p.khoi !== khoiTruoc) { X.newPage(); X.h1(p.khoi); khoiTruoc = p.khoi; }
    else X.y += 2;
    X.h2(p.ten);
    await ipPhan(X, p, ct, o);
    X.flush(0);
  }
  if (o.onStep) o.onStep(n, n, 'Hoàn tất');
  ipFooter(X, meta);
  return X.doc.output('blob');
}
const IP_ANH = {
  'overview.vb': '#overview-documents', 'overview.giao': '#overview-assigned', 'overview.nhan': '#overview-received',
  'taskTally.bang': '#btctwTaskTally', 'natMap.dv': '#btctwMapWidget', 'natMap.vb': '#btctwMapWidget',
  'gis.diem': '#gisBottleneckSection', 'gis.tt': '#gisStatusSection', 'gis.bc': '#gisUserReportsSection', 'gis.cad': '#gisCadBlock',
  'indicators.uo': '#uoOverviewBand'
};
async function ipPhan(X, p, ct, o) {
  const k = p.key;
  if (k.indexOf('notify.') === 0) {
    const tab = k.slice(7);
    await ipNotifyTab(tab, async () => {
      X.note((window.__notiAllRows || []).length.toLocaleString('vi-VN') + ' thông báo ở tab này.');
      X.img(await ipChup('#notificationsWidget'));
      if (ct) X.table(['STT', 'Nội dung', 'Đơn vị', 'Tình trạng'], ipNotifyRows(), { cols: { 0: { cellWidth: 9 }, 1: { cellWidth: 130 } }, empty: 'Không có thông báo.' });
    });
    return;
  }
  if (k === 'gis.diem') X.img(await ipChup('#gisMap'));
  if (IP_ANH[k]) { const cv = await ipChup(IP_ANH[k]); if (cv) X.img(cv); else X.note('Ô này không hiện trên màn hình lúc xuất nên không chụp được.'); }
  if (ct) {
    if (k === 'overview.vb') ipBangVanBan(X);
    else if (k === 'overview.giao') ipBangNhiemVu(X, 'assigned');
    else if (k === 'overview.nhan') ipBangNhiemVu(X, 'received');
    else if (k === 'gis.diem') ipBangDiemNghen(X);
    else if (k === 'gis.bc') ipBangBaoCaoND(X);
    else if (k === 'gis.cad') ipBangCad(X);
  }
  if (k === 'indicators.so' || k === 'indicators.dl' || k === 'indicators.xa') {
    const loai = k.slice(11), ds = o.donVi || [];
    if (loai === 'so' && !ct) X.img(await ipChup('#indicatorsWidget'));
    if (!ds.length) { X.note('Chưa chọn đơn vị chỉ tiêu.'); return; }
    o.cacheDV = o.cacheDV || {};
    let co = false;
    for (let j = 0; j < ds.length; j++) {
      const d = ds[j];
      if (o.onStep) o.onStep(o.phan.indexOf(p), o.phan.length, p.ten + ' · ' + d.ten + ' (' + (j + 1) + '/' + ds.length + ')');
      if (!o.cacheDV[d.id]) { o.cacheDV[d.id] = await ipBangDonVi(d.role, d.id); await ipFrame(); }
      const R = o.cacheDV[d.id];
      const trang = R.sheets ? R.sheets.filter((s) => ipLoaiTrang(s.name) === loai) : [];
      if (!trang.length && loai !== 'so') continue; /* đơn vị không có dữ liệu gốc / số theo xã thì bỏ qua */
      co = true;
      X.ensure(30); X.text(d.ten, { bold: true, size: 10, color: [22, 58, 99], after: 1.5 });
      if (R.loi) { X.note(R.loi); continue; }
      if (!trang.length) { X.note('Đơn vị này không có bảng số liệu.'); continue; }
      trang.forEach((sh) => ipInTrang(X, sh));
    }
    /* không ghi số đếm đơn vị (quy ước chỉ tiêu theo eform: không thêm số ngoài eform) */
    if (loai !== 'so' && !co) X.note('Các đơn vị đã chọn không có ' + (loai === 'dl' ? 'dữ liệu gốc đơn vị đã nhập' : 'số liệu theo xã, phường') + '.');
  }
}
