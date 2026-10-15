'use strict';
/* Kiểm thử bộ chỉ tiêu Sở GD&ĐT bằng Node (không cần trình duyệt):
   1. Số giả lập: tổng 126 phường/xã khớp SGD_TARGETS; số con không vượt số cha; tổng các trường khớp số phường/xã.
   2. Giao diện: mọi màn, mọi chỉ tiêu, cả 2 năm học dựng được HTML, thẻ div cân bằng, có nhãn giả lập. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

/* gdUnitData lấy thẳng từ dashboard-education.js (file đó cần DOM nên không nạp cả file) */
const edu = read('js/features/dashboard-education.js');
const m = edu.match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: {} });
vm.runInContext('const gdUnitData=[' + m[1] + '];', ctx);
['js/core/sgd-config.js', 'js/features/sgd-data.js', 'js/features/dashboard-sgd.js'].forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const balanced = (h) => (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length;

console.log('== Số giả lập');
const R = run('sgdUnits()');
ok(R.length === 126, 'có 126 phường/xã (' + R.length + ')');
const T = run('SGD_TARGETS'), Y = run('SGD_YEARS');
Object.keys(T).forEach((k) => [0, 1].forEach((yi) => {
  if (T[k][yi] == null) return;
  const s = R.reduce((a, r) => a + r.v[Y[yi]][k], 0);
  ok(s === T[k][yi], 'tổng ' + k + ' năm ' + Y[yi] + ' = ' + T[k][yi] + ' (ra ' + s + ')');
}));
const lv = ['mn', 'th', 'cs', 'pt', 'tx'];
let viol = 0;
R.forEach((r) => Y.forEach((y) => {
  const o = r.v[y], tr = lv.reduce((a, c) => a + o['tr_' + c], 0), hs = o.hs_th + o.hs_cs;
  const bad = [];
  lv.forEach((c) => { if (o['cq_' + c] > o['tr_' + c]) bad.push('cq_' + c); });
  if (o.ncl > tr) bad.push('ncl'); if (o.qt > o.ncl) bad.push('qt');
  ['dien', 'nuoc', 'vs', 'mt', 'inet'].forEach((k) => { if (o[k] > tr) bad.push(k); });
  if (o.hb > o.tr_th) bad.push('hb');
  ['dcs', 'can', 'boi'].forEach((k) => { if (o[k + '_th'] > o.hs_th || o[k + '_cs'] > o.hs_cs) bad.push(k); });
  ['loan', 'vien', 'kho', 'lac', 'duc', 'thd', 'mk'].forEach((k) => { if (o[k] > hs) bad.push(k); });
  if (o.sp != null && o.sp > hs) bad.push('sp');
  if ([1, 2, 3, 4, 5].reduce((a, k) => a + o['hs_k' + k], 0) !== o.hs_th) bad.push('hs_khoi_th');
  if ([6, 7, 8, 9].reduce((a, k) => a + o['hs_k' + k], 0) !== o.hs_cs) bad.push('hs_khoi_cs');
  if ([1, 2, 3, 4, 5].reduce((a, k) => a + o['lop_k' + k], 0) !== o.lop_th) bad.push('lop_khoi');
  Object.keys(o).forEach((k) => { if (o[k] != null && (o[k] < 0 || !Number.isInteger(o[k]))) bad.push(k + '<0'); });
  if (o.tr_th < 1 || o.tr_cs < 1) bad.push('thieu_truong');
  if (bad.length) { viol++; if (viol < 4) console.log('    ' + r.name + ' ' + y + ': ' + bad.join(',')); }
}));
ok(viol === 0, 'mọi phường/xã: số con không vượt số cha, khối cộng đúng, số nguyên không âm (' + viol + ' vi phạm)');

let schoolBad = 0, schoolCnt = 0;
R.forEach((r) => {
  const S = run('sgdSchools(sgdUnits()[' + R.indexOf(r) + '])');
  schoolCnt += S.length;
  const o = r.v[Y[0]];
  ['hs_th', 'hs_cs', 'lop_th', 'gv_cs', 'can_th', 'boi_cs', 'kc_th', 'tm_cs', 'sp', 'ncl', 'cq_mn', 'dien', 'hs_k1', 'lop_k9'].forEach((k) => {
    const s = S.reduce((a, x) => a + (x.o[k] || 0), 0);
    if (s !== o[k]) { schoolBad++; if (schoolBad < 4) console.log('    ' + r.name + ' ' + k + ': trường ' + s + ' ≠ xã ' + o[k]); }
  });
  S.forEach((x) => { if (x.o.can_th > x.o.hs_th || x.o.boi_cs > x.o.hs_cs || x.o.sp > x.o.hs_th + x.o.hs_cs) schoolBad++; });
});
ok(schoolBad === 0, 'tổng các trường khớp số phường/xã và số con ≤ số cha ở từng trường (' + schoolBad + ' lỗi)');
ok(schoolCnt === T.tr_mn[0] + T.tr_th[0] + T.tr_cs[0] + T.tr_pt[0] + T.tr_tx[0], 'tổng số trường giả lập = 2.963 (' + schoolCnt + ')');
const C = run('sgdCity(2025)');
ok(Math.abs((C.can_th + C.can_cs) / (C.hs_th + C.hs_cs) * 100 - 24.87) < 0.05, 'tỷ lệ cận thị Thành phố ≈ 24,9%');
ok(run('sgdCity(2024)').sp === null, 'năm trước không có số phụ huynh smartphone (API chưa có kỳ so sánh)');

console.log('== Giao diện');
const screen = (s, extra) => run('SGD_UI.open=true;SGD_UI.screen=' + JSON.stringify(s) + ';' + (extra || '') + 'sgdScreenHtml()');
Y.forEach((y) => {
  run('SGD_UI.year=' + y + ';SGD_UI.pick=null;');
  const h = screen('home');
  ok(balanced(h), y + ' trang chủ: div cân bằng');
  ok((h.match(/class="stc-kpi"/g) || []).length === 7, y + ' trang chủ: 7 ô KPI');
  ok((h.match(/class="stc-gcard/g) || []).length === 6, y + ' trang chủ: 5 thẻ nhóm + thẻ 126 phường/xã');
  ok(/Số liệu giả lập/.test(h), y + ' trang chủ: có nhãn số liệu giả lập');
  ok(!/NaN|undefined|Infinity/.test(h), y + ' trang chủ: không có NaN/undefined');
  if (y === 2025) ok(/2\.963/.test(h) && /1,41/.test(h) && /63,0%/.test(h) && /94,4%/.test(h) && /24,9%/.test(h), 'trang chủ 2025: số khớp bản thiết kế (2.963 · 1,41 triệu · 63,0% · 94,4% · 24,9%)');
  ['ml', 'hs', 'vc', 'dn', 'sk'].forEach((g) => {
    const gh = screen('group', 'SGD_UI.group="' + g + '";');
    ok(balanced(gh), y + ' nhóm ' + g + ': div cân bằng');
    ok(!/NaN|undefined|Infinity/.test(gh), y + ' nhóm ' + g + ': không có NaN/undefined');
    ok(/sgdXa\('/.test(gh), y + ' nhóm ' + g + ': tiêu đề thẻ mở màn 126 phường/xã');
  });
  run('SGD_TREE').forEach((t) => {
    const dh = screen('detail', 'SGD_UI.tree="' + t.id + '";SGD_UI.pick=null;');
    ok(balanced(dh) && !/NaN|undefined|Infinity/.test(dh), y + ' chi tiết ' + t.id + ': dựng được, không NaN');
    if (y === 2025 && t.id !== 'mat') ok(/class="stc-wf"/.test(dh), 'chi tiết ' + t.id + ': có cầu nối tăng giảm');
    const kid = t.kids[0].id;
    const ph = screen('detail', 'SGD_UI.tree="' + t.id + '";SGD_UI.pick="' + kid + '";');
    ok(balanced(ph) && /stc-oc-card sel/.test(ph), y + ' chi tiết ' + t.id + ': chọn thẻ con ' + kid);
  });
  run('SGD_XA_INDS').forEach((x) => {
    const xh = screen('xa', 'sgdXaSetInd("' + x.id + '");SGD_UI.xa.q="";SGD_UI.xa.f="all";SGD_UI.xa.sel=null;');
    ok(balanced(xh), y + ' 126 phường/xã · ' + x.id + ': div cân bằng');
    ok(!/NaN|undefined|Infinity/.test(xh), y + ' 126 phường/xã · ' + x.id + ': không có NaN/undefined');
    ok((xh.match(/class="sgd-xbtn"/g) || []).length === 126, y + ' 126 phường/xã · ' + x.id + ': đủ 126 dòng');
  });
  const src = screen('src');
  ok(balanced(src) && /Chỉ có schema/.test(src), y + ' màn nguồn dữ liệu');
});
run('SGD_UI.year=2025;');
let xh = screen('xa', 'sgdXaSetInd("can");SGD_UI.xa.q="viet hung";');
ok((xh.match(/class="sgd-xbtn"/g) || []).length === 1 && /Phường Việt Hưng/.test(xh), 'tìm không dấu "viet hung" ra Phường Việt Hưng');
xh = screen('xa', 'SGD_UI.xa.q="";SGD_UI.xa.f="x";');
ok((xh.match(/class="sgd-xbtn"/g) || []).length === run('sgdUnits().filter(r=>r.isXa).length'), 'lọc chỉ xã');
xh = screen('xa', 'SGD_UI.xa.f="all";SGD_UI.xa.sk="name";SGD_UI.xa.sd=1;SGD_UI.xa.sel="Xã Minh Châu";');
ok(/Danh sách trường/.test(xh) && /Minh Châu/.test(xh), 'chọn Xã Minh Châu: có hồ sơ và danh sách trường');
ok(balanced(xh) && /class="sgd-dw[" ]/.test(xh) && /sgdXaStep\(/.test(xh), 'khung trượt: chọn 1 dòng thì hồ sơ nằm trong khung bên phải, có nút Trước/Sau');
xh = screen('xa', 'SGD_UI.xa.sel=null;');
ok(!/class="sgd-dw[" ]/.test(xh) && !/Danh sách trường/.test(xh), 'khung trượt: chưa bấm dòng nào thì không mở hồ sơ');
run('SGD_UI.xa.sel="Xã Minh Châu";sgdRerender=function(){};sgdXaStep(1);');
ok(run('SGD_UI.xa.sel') !== 'Xã Minh Châu' && run('SGD_UI.xa.order').indexOf(run('SGD_UI.xa.sel')) === run('SGD_UI.xa.order').indexOf('Xã Minh Châu') + 1, 'nút Sau › chuyển sang đơn vị kế tiếp theo thứ tự đang hiện');
const band = run('sgdOverviewBandHtml({role:"UBND",id:"ubnd-gddt"},0)');
ok(balanced(band) && (band.match(/openCategoryDetail\('UBND','ubnd-gddt',/g) || []).length >= 13, 'băng Tổng quan ngoài lưới: 7 KPI + 6 thẻ mở đúng popup');
ok(run('SGD_ITEMS.length') === 7 && run('SGD_ITEMS[0].sgdKey') === 'home' && run('SGD_ITEMS[6].sgdKey') === 'xa', 'SGD_ITEMS: Tổng quan + 5 nhóm + 126 phường/xã');

/* Anh yêu cầu 2026-09-29: giao diện KHÔNG hiện mã kỹ thuật (tên API/endpoint, trường dữ liệu MA_…, IS_…, HS_…). Quét phần chữ
   nhìn thấy của mọi màn, mọi chỉ tiêu, cả hồ sơ phường/xã và băng Tổng quan (khi SGD_SHOW_TECH = false). */
{
  const visible = (h) => h.replace(/<[^>]*>/g, ' ');
  const BAD = /\b[A-Z]{2,}(?:_[A-Z0-9*]+)+\b|\b(?:hoso|thongke|dm)_\w+|endpoint|schema|\bAPI\b/;
  const leaks = [];
  const chk = (name, h) => { const x = visible(h).match(BAD); if (x) leaks.push(name + ': ' + x[0]); };
  ok(run('SGD_SHOW_TECH') === false, 'mặc định ẩn thông tin kỹ thuật (SGD_SHOW_TECH = false)');
  Y.forEach((y) => {
    run('SGD_UI.year=' + y + ';SGD_UI.xa.sel=null;');
    chk(y + ' home', screen('home'));
    ['ml', 'hs', 'vc', 'dn', 'sk'].forEach((g) => chk(y + ' nhóm ' + g, screen('group', 'SGD_UI.group="' + g + '";')));
    run('SGD_TREE').forEach((t) => { chk(y + ' chi tiết ' + t.id, screen('detail', 'SGD_UI.tree="' + t.id + '";SGD_UI.pick=null;')); chk(y + ' chi tiết chọn ' + t.id, screen('detail', 'SGD_UI.pick="' + t.kids[0].id + '";')); });
    run('SGD_XA_INDS').forEach((x) => chk(y + ' xã ' + x.id, screen('xa', 'sgdXaSetInd("' + x.id + '");SGD_UI.xa.q="";SGD_UI.xa.f="all";SGD_UI.xa.sel="Phường Việt Hưng";')));
  });
  chk('băng Tổng quan', run('sgdOverviewBandHtml({role:"UBND",id:"ubnd-gddt"},0)'));
  ok(leaks.length === 0, 'giao diện không hiện mã kỹ thuật' + (leaks.length ? ' — còn: ' + leaks.slice(0, 5).join(' | ') : ''));
  ok(!/Nguồn dữ liệu và giả định/.test(screen('home')), 'trang chủ không còn liên kết sang màn nguồn dữ liệu kỹ thuật');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
