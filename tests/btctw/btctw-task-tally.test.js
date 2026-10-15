'use strict';
/* Kiểm thử khối "Kiểm đếm nhiệm vụ – Ban Tổ chức Trung ương" bằng Node (DOM giả, không cần trình duyệt): số liệu khớp
   nhau, mọi màn (lớp 1, lớp 2 theo từng kiểu drill, popup chi tiết, xuất Excel) dựng được và không lẫn undefined/NaN.
   Chạy: node tests/btctw/btctw-task-tally.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

/* ---- DOM giả: phần tử đăng ký theo id, id trong innerHTML được đăng ký lại (đủ để getElementById sau khi dựng khung) ---- */
const reg = {};
let tmpN = 0;
function el(id, hidden) {
  const e = reg[id] || (reg[id] = {
    _id: id, get id() { return this._id; }, set id(v) { this._id = v; reg[v] = this; },
    hidden: !!hidden, value: '', textContent: '', className: '', style: {}, dataset: {}, _cls: new Set(), options: [],
    classList: null, addEventListener() {}, querySelectorAll: () => [], closest: () => null, setAttribute() {},
    set innerHTML(h) { this._h = h; (String(h).match(/<[^>]*\sid="[^"]+"[^>]*>/g) || []).forEach((t) => el(t.match(/\sid="([^"]+)"/)[1], /\shidden(\s|>|=)/.test(t))); },
    get innerHTML() { return this._h || ''; }
  });
  if (!e.classList) e.classList = { add: (...a) => a.forEach((x) => e._cls.add(x)), remove: (...a) => a.forEach((x) => e._cls.delete(x)), contains: (x) => e._cls.has(x), toggle: (x, f) => { (f === undefined ? !e._cls.has(x) : f) ? e._cls.add(x) : e._cls.delete(x); } };
  return e;
}
['btctwTaskTally', 'bttBody', 'roleScopeCards', 'modal', 'modalTitle', 'modalSub', 'modalBody'].forEach((i) => el(i));
reg.btctwTaskTally._cls.add('hidden');
const saved = { rows: [], sheets: [] };
class FakeSheet { constructor(n) { this.name = n; this.rows = []; saved.sheets.push(this); } addRow(r) { this.rows.push(r); return { font: {} }; } set columns(c) { this.cols = c; } }
const ctx = vm.createContext({
  console, setTimeout, clearTimeout, Blob, URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
  document: { getElementById: (i) => reg[i] || null, querySelectorAll: () => [], addEventListener() {}, createElement: () => Object.assign(el('__tmp' + (++tmpN)), { click() {}, remove() {} }), body: { appendChild() {} } },
  window: {}, currentRole: 'TW_DANG', currentOfficeId: null,
  openModal() { saved.modalOpen = true; }, closeModal() {}, toast(m) { saved.toast = m; },
  ExcelJS: { Workbook: class { addWorksheet(n) { return new FakeSheet(n); } get xlsx() { return { writeBuffer: async () => new ArrayBuffer(8) }; } } }
});
ctx.window.ResizeObserver = undefined;
const src = fs.readFileSync(path.join(root, 'js/features/btctw-task-tally.js'), 'utf8');
vm.runInContext(src.replace('  window.renderBtctwTaskTally = function () {',
  '  window.__t = { TASKS, S, rows, baseRows, groupsBy, tally, isSoon, days, drillTo, drillBack, renderL2, renderL2List, openDetail, openExportModal, exportXlsx, XF, capViewGroups, ITEMS };\n  window.renderBtctwTaskTally = function () {'), ctx, { filename: 'btctw-task-tally.js' });
const T = ctx.window.__t, W = ctx.window;
const sum = (a) => a.reduce((x, y) => x + y, 0);
const clean = (h, m) => ok(!/undefined|NaN|\[object/.test(h), m + ': không lẫn undefined / NaN / [object]');

/* ---- 1. Dữ liệu ---- */
console.log('== Dữ liệu');
ok(T.TASKS.length === 47 && new Set(T.TASKS.map((r) => r.ma)).size === 47, '47 nhiệm vụ, mã không trùng');
ok(T.TASKS.every((r) => r.s === 'routine' ? !r.due : (r.due && (r.s === 'late' ? T.days(r.due) < 0 : r.s === 'ontime' ? T.days(r.due) >= 0 : true))), 'trạng thái khớp với hạn: quá hạn < hôm nay, trong hạn ≥ hôm nay, thường xuyên không đặt hạn');
ok(T.TASKS.every((r) => r.cap && r.chuDe && r.vbg && r.phongBan && r.lanhDaoDonVi && r.nguoiThucHien && r.ketQua), 'mọi nhiệm vụ đủ cấp trình / chủ đề / văn bản giao / phòng / lãnh đạo / người thực hiện / kết quả');
ok(T.TASKS.filter((r) => r.s === 'late').every((r) => r.khoKhan && r.kienNghi), 'nhiệm vụ quá hạn đều có khó khăn và kiến nghị');
ok(T.TASKS.filter((r) => r.s === 'done').every((r) => r.tienDo === 100 && r.hoanThanh), 'nhiệm vụ hoàn thành: tiến độ 100% và có ngày hoàn thành');
const all = T.tally(T.TASKS);
ok(all.done + all.ontime + all.late + all.routine === all.total, 'bốn trạng thái cộng lại = tổng');
['u', 'cap', 'ld', 'da', 'chuDe', 'vbg'].forEach((k) => ok(sum(T.groupsBy(T.TASKS, (r) => r[k]).map((g) => g.total)) === 47, 'nhóm theo ' + k + ' cộng lại = 47'));
const cv = T.capViewGroups(T.TASKS, 'chuyenDoiSo');
ok(cv.tong === T.TASKS.filter((r) => r.kh).length && cv.items.length >= 3, 'chế độ chuyển đổi số: chỉ tính nhiệm vụ có kế hoạch');

/* ---- 2. Hiện / ẩn theo tài khoản ---- */
console.log('== Hiện theo tài khoản');
W.renderBtctwTaskTally();
ok(!reg.btctwTaskTally.classList.contains('hidden'), 'role TW_DANG (twdang): khối hiện');
ok(reg.roleScopeCards.classList.contains('btt-role-hidden'), 'role TW_DANG: khối Tổng quan điều hành (3 hình tròn) được ẩn');
ctx.currentRole = 'UBND'; W.renderBtctwTaskTally();
ok(reg.btctwTaskTally.classList.contains('hidden'), 'role khác: khối ẩn');
ok(!reg.roleScopeCards.classList.contains('btt-role-hidden'), 'role khác: khối Tổng quan điều hành hiện lại bình thường');
ctx.currentRole = 'TW_ALL'; ctx.currentOfficeId = null; W.renderBtctwTaskTally();
ok(!reg.btctwTaskTally.classList.contains('hidden') && reg.roleScopeCards.classList.contains('btt-role-hidden'), 'tài khoản tw (TW_ALL): khối hiện, Tổng quan điều hành ẩn');
ctx.currentRole = 'TW_QH'; W.renderBtctwTaskTally();
ok(reg.btctwTaskTally.classList.contains('hidden'), 'khối Trung ương khác (Quốc hội): khối ẩn');
ctx.currentRole = 'TW_DANG'; ctx.currentOfficeId = 'tw-dang-vucanbo'; W.renderBtctwTaskTally();
ok(reg.btctwTaskTally.classList.contains('hidden'), 'Vụ/phòng sâu trong BTC Trung ương: vẫn dùng màn cũ, khối ẩn');
ctx.currentOfficeId = 'tw-dang-btc'; W.renderBtctwTaskTally();
ok(!reg.btctwTaskTally.classList.contains('hidden'), 'tài khoản đơn vị ban-tw-dang-btc: khối hiện');

/* ---- 3. Lớp 1 ---- */
console.log('== Lớp 1');
const base = T.baseRows(), bt = T.tally(base);
ok(reg.bttKTotal.textContent === bt.total.toLocaleString('vi-VN'), 'thẻ Tổng = số nhiệm vụ trong bộ lọc (' + bt.total + ')');
ok(['done', 'ontime', 'late', 'routine'].every((k) => reg['bttK-' + k].textContent === String(bt[k])), 'bốn thẻ trạng thái khớp số tính lại');
ok(/%$/.test(reg['bttP-late'].textContent), 'thẻ có tỷ lệ phần trăm');
ok(reg.bttKSoon.textContent === String(base.filter(T.isSoon).length) && reg.bttKpiSoon.classList.contains('on'), 'thẻ Sắp tới hạn khớp và đang nhấp nháy khi > 0');
['bttCCap', 'bttCUnit', 'bttCLd', 'bttCTime'].forEach((i) => { ok(/<svg/.test(reg[i].innerHTML), i + ': có biểu đồ'); clean(reg[i].innerHTML, i); });
ok((reg.bttCUnit.innerHTML.match(/class="btt-hb-row"/g) || []).length === T.groupsBy(base, (r) => r.u).length, 'biểu đồ đơn vị chủ trì: mỗi đơn vị một thanh, bấm được');
ok((reg.bttCCap.innerHTML.match(/btt-pl-row/g) || []).length >= 4, 'hình tròn cấp trình có chú thích');

/* ---- 4. Lớp 2 theo từng kiểu drill ---- */
console.log('== Lớp 2');
const table = (n) => (reg.bttC2List.innerHTML.match(/<tr data-ma=/g) || []).length === n;
[['unit', 'Vụ Cán bộ', 'Vụ Cán bộ', 3], ['status', 'late', 'Đang thực hiện – Quá hạn', 2], ['status', 'done', 'Đã hoàn thành', 2],
  ['soon', 1, 'Sắp tới hạn (≤ 3 ngày)', 2], ['cap', 'Trình Bộ Chính trị', 'Trình Bộ Chính trị', 2], ['kh', 'Kế hoạch phát triển Sổ tay đảng viên điện tử', 'Kế hoạch phát triển Sổ tay đảng viên điện tử', 2]]
  .forEach(([dim, v, label, charts]) => {
    T.drillTo(dim, v, label);
    const n = T.rows().length;
    ok(n > 0, 'drill ' + dim + ' "' + label + '": có ' + n + ' nhiệm vụ');
    ok(table(n), 'drill ' + dim + ': bảng có đúng ' + n + ' dòng');
    ok(/<svg/.test(reg.bttC2a.innerHTML), 'drill ' + dim + ': biểu đồ A có');
    if (dim === 'unit') ok(/<svg/.test(reg.bttC2c.innerHTML) && !reg.bttG2c.hidden, 'drill unit: có khối thứ 3 (theo thời gian)');
    if (dim === 'status' || dim === 'soon') ok(/btt-pie/.test(reg.bttC2b.innerHTML) && !reg.bttL2CapScale.hidden, 'drill ' + dim + ': biểu đồ B là hình tròn cấp trình, có nút chuyển chế độ');
    if (dim === 'status' || dim === 'soon') ok(reg.bttL2fS.hidden === true, 'drill ' + dim + ': ẩn lọc trạng thái (đã chọn sẵn)');
    ok(/^Danh sách nhiệm vụ /.test(reg.bttL2listT.textContent), 'drill ' + dim + ': có tiêu đề danh sách "' + reg.bttL2listT.textContent + '"');
    ['bttC2a', 'bttC2b', 'bttC2List'].forEach((i) => clean(reg[i].innerHTML, 'drill ' + dim + ' ' + i));
    ok(sum(T.groupsBy(T.rows(), (r) => r.u).map((g) => g.total)) === n, 'drill ' + dim + ': biểu đồ đơn vị cộng lại = số dòng bảng');
    T.drillBack();
    ok(T.S.drill === null && /<svg/.test(reg.bttCUnit.innerHTML), 'quay lại lớp 1 dựng lại đủ biểu đồ');
  });
T.drillTo('soon', 1, 'x');
ok(T.rows().every((r) => r.s === 'ontime' && T.days(r.due) >= 0 && T.days(r.due) <= 3), 'sắp tới hạn: chỉ nhiệm vụ trong hạn còn 0–3 ngày (không lẫn nhiệm vụ đã quá hạn)');
T.drillBack();

/* ---- 5. Bộ lọc ---- */
console.log('== Bộ lọc');
T.S.ld = 'Đ/c Hà Minh Hải';
ok(T.baseRows().length > 0 && T.baseRows().every((r) => r.ld === 'Đ/c Hà Minh Hải'), 'lọc theo lãnh đạo');
T.S.ld = 'all';
T.S.chuDe.add('Công tác cán bộ');
ok(T.baseRows().length > 0 && T.baseRows().every((r) => r.chuDe === 'Công tác cán bộ'), 'lọc theo chủ đề (chọn một phần)');
T.S.chuDe.clear();
T.ITEMS.vbg.forEach((v) => T.S.vbg.add(v));
ok(T.baseRows().length === base.length, 'chọn tất cả văn bản giao = không lọc');
T.S.vbg.clear();
T.S.from = '2000-01-01'; T.S.to = '2000-12-31';
ok(T.baseRows().every((r) => !r.due), 'khoảng ngày trống: chỉ còn nhiệm vụ thường xuyên (không đặt hạn)');
T.S.from = ''; T.S.to = '';
ok(T.baseRows().length === 47, 'kỳ "Tất cả" = đủ 47 nhiệm vụ');

/* ---- 6. Popup chi tiết ---- */
console.log('== Popup chi tiết');
T.TASKS.forEach((r) => {
  if (reg.bttDlgB) reg.bttDlgB.innerHTML = '';
  T.openDetail(r);
  const h = reg.bttDlgB.innerHTML;
  if (!h.includes(r.ma) || /undefined|NaN|\[object/.test(h)) ok(false, 'chi tiết ' + r.ma);
});
ok(true, 'dựng chi tiết đủ 47 nhiệm vụ không lỗi');
T.openDetail(T.TASKS.find((r) => r.s === 'late'));
const dB = reg.bttDlgB.innerHTML, dF = reg.bttDlgF.innerHTML;
ok(reg.bttOv.hidden === false && reg.bttDlg.style.width === 'min(720px,100%)', 'chi tiết: hộp thoại riêng, rộng 720px như bản gốc');
ok(reg.bttDlgT.textContent === 'Chi tiết nhiệm vụ' && reg.bttDlgS.textContent === 'Thông tin và tình hình thực hiện', 'chi tiết: tiêu đề + phụ đề như bản gốc');
ok((dB.match(/class="btt-td-cell"/g) || []).length === 7, 'chi tiết: 6 ô trong lưới 3 cột + ô Đơn vị phối hợp');
ok(['Kết quả thực hiện', 'Khó khăn, vướng mắc', 'Đề xuất, kiến nghị', 'Người thực hiện'].every((s) => dB.includes(s)) && !/Tiến độ/.test(dB), 'chi tiết: đủ các khối của bản gốc, không thêm khối Tiến độ');
ok(/Quá hạn \d+ ngày/.test(dB), 'nhiệm vụ quá hạn: hiện số ngày quá hạn');
ok(/>Đóng<.*>Cập nhật nhiệm vụ<.*>Yêu cầu báo cáo</.test(dF), 'chi tiết: chân hộp thoại Đóng · Cập nhật nhiệm vụ · Yêu cầu báo cáo như bản gốc');
reg.bttTdUpd.onclick(); ok(/^Cập nhật nhiệm vụ .*bản demo không kết nối/.test(saved.toast || ''), 'nút Cập nhật nhiệm vụ: báo bản demo không kết nối (không gọi hệ thống ngoài)');
reg.bttTdCancel.onclick(); ok(reg.bttOv.hidden === true, 'nút Đóng đóng hộp thoại');

/* ---- 7. Xuất Excel ---- */
console.log('== Xuất Excel');
const XF_GOC = ['STT', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Cấp trình', 'Đề án', 'Đơn vị chủ trì', 'LĐ Ban phụ trách', 'Loại văn bản', 'Thời hạn hoàn thành', 'Trạng thái', 'Số ngày quá hạn', 'Ngày hoàn thành', 'Tiến độ'];
ok(JSON.stringify(T.XF.map((f) => f.l)) === JSON.stringify(XF_GOC), 'danh sách trường xuất đúng 13 trường, đúng thứ tự form gốc');
T.openExportModal();
ok(reg.bttDlg.style.width === 'min(760px,100%)' && reg.bttDlgT.textContent === 'Xuất Excel danh sách nhiệm vụ', 'form xuất: hộp thoại riêng rộng 760px như bản gốc');
ok(/Chọn trường dữ liệu/.test(reg.bttDlgB.innerHTML) && (reg.bttDlgB.innerHTML.match(/data-k=/g) || []).length === T.XF.length, 'form chọn trường có đủ ' + T.XF.length + ' trường');
ok(/>Hủy<.*>⤓ Xuất Excel</.test(reg.bttDlgF.innerHTML), 'form xuất: chân Hủy · Xuất Excel như bản gốc');
(async () => {
  saved.sheets.length = 0;
  await T.exportXlsx(T.XF, true);
  const main = saved.sheets[0];
  ok(saved.sheets.length === 5, 'xuất kèm bảng tổng hợp: 1 + 4 trang tính');
  ok(main.rows.length === 4 + T.rows().length, 'trang danh sách: 3 dòng đầu + tiêu đề cột + ' + T.rows().length + ' nhiệm vụ');
  ok(/MÔ PHỎNG/.test(main.rows[1][0]), 'có dòng cảnh báo số liệu mô phỏng');
  ok(main.rows.slice(4).every((r) => r.length === T.XF.length && !r.some((c) => c === undefined || (typeof c === 'number' && isNaN(c)))), 'mọi dòng đủ cột, không undefined / NaN');
  const s0 = saved.sheets[1], last = s0.rows[s0.rows.length - 1];
  ok(last[0] === 'Tổng cộng' && last[1] === T.rows().length && sum(s0.rows.slice(4, -1).map((r) => r[1])) === last[1], 'bảng tổng hợp: dòng Tổng cộng khớp cộng các dòng');
  saved.sheets.length = 0;
  await T.exportXlsx(T.XF.slice(0, 3), false);
  ok(saved.sheets.length === 1, 'bỏ chọn bảng tổng hợp: chỉ 1 trang tính');
  console.log(`${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})();
