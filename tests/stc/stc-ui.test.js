'use strict';
/* Kiểm thử dựng HTML của form STC bằng Node: mọi màn hình, cả bản chụp thật lẫn dữ liệu thử, không ném lỗi và chứa nội dung đúng. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p.replace(/\\\\/g, '/')), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function makeCtx(demo) {
  const win = {};
  const ctx = vm.createContext({ window: win, location: { search: demo ? '?stcdemo=1' : '' }, console, setInterval, clearInterval, Promise, document: {}, esc: escFn, Date, Math, Number, String, Object, Array, JSON, isFinite });
  vm.runInContext(read('js\\core\\stc-config.js').replace('const STC_DEMO_DEFAULT = true;', 'const STC_DEMO_DEFAULT = false;'), ctx, { filename: 'stc-config.js' });
  vm.runInContext(read('js\\data\\stc-snapshot.js'), ctx, { filename: 'stc-snapshot.js' });
  if (demo) vm.runInContext(read('js\\features\\stc-demo-data.js'), ctx, { filename: 'demo' });
  ['js\\core\\line-chart.js', 'js\\features\\stc-data.js', 'js\\features\\dashboard-stc.js'].forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
  return ctx;
}
let pass = 0, failn = 0;
const ok = (c, m) => { if (c) pass++; else { failn++; console.log('  ✗ ' + m); } };
const run = (c, code) => vm.runInContext(code, c);
function html(c, screen, extra) {
  run(c, 'STC_UI.screen=' + JSON.stringify(screen) + ';' + (extra || ''));
  return run(c, 'stcScreenHtml()');
}
function balanced(h) {
  const open = (h.match(/<div\b/g) || []).length, close = (h.match(/<\/div>/g) || []).length;
  return open === close;
}

/* ===== Bản chụp thật ===== */
console.log('== Bản chụp thật Q1/2026');
let c = makeCtx(false);
run(c, 'STC_UI.year=2026;STC_UI.period=1;');
let h = html(c, 'home');
ok(/Bộ chỉ tiêu kinh tế/.test(run(c, 'stcScreenMeta().title')), 'popup: tiêu đề của IOC modal là Bộ chỉ tiêu kinh tế – tài chính');
ok(!/<h1>/.test(h), 'nội dung không lặp lại tiêu đề lớn (tiêu đề nằm ở đầu popup)');
ok(/1\/13 chỉ tiêu có số liệu/.test(h), 'trang chủ báo 1/13 chỉ tiêu có số liệu');
ok((h.match(/class="stc-kpi"/g) || []).length === 7, '7 thẻ KPI');
ok(!/DỮ LIỆU MẪU/.test(h), 'không có banner dữ liệu mẫu ở bản thật');
/* Hàng chip trạng thái (nguồn/kỳ/thời điểm chụp/nhãn mẫu) đã ẩn theo cờ STC_SHOW_CHIPS (stc-config.js) vì thông
   tin đã có sẵn ở phụ đề đầu popup và chân màn — kiểm tra hàm dựng chip (stcChips) vẫn còn, chỉ không được gọi. */
ok(run(c, 'STC_SHOW_CHIPS') === false, 'mặc định ẩn hàng chip trạng thái (STC_SHOW_CHIPS=false)');
ok(!/class="stc-chips"/.test(h), 'không còn hàng chip trạng thái trong nội dung màn (đã ẩn theo cờ)');
ok(/Số liệu chụp lúc/.test(run(c, 'stcChips(stcBuildPeriod(2026,1))')), 'hàm dựng chip (ẩn) vẫn còn nguyên, có thể bật lại bằng cờ STC_SHOW_CHIPS');
ok(balanced(h), 'trang chủ: thẻ div cân bằng');
['ns', 'dt', 'sx', 'vm'].forEach((g) => {
  const gh = html(c, 'group', 'STC_UI.group=' + JSON.stringify(g));
  ok(balanced(gh), 'nhóm ' + g + ': div cân bằng');
  ok(/Chưa có số liệu từ Sở Tài chính|Số liệu thật/.test(gh), 'nhóm ' + g + ': có trạng thái/nhãn dữ liệu');
  ok(!/API|stc-tool.js/.test(gh), 'nhóm ' + g + ': không hiện chữ API, lệnh kỹ thuật');
});
const dt = html(c, 'group', 'STC_UI.group="dt"');
ok(/Số liệu thật</.test(dt) && !/từ API/.test(dt), 'nhóm Đầu tư: dự án trọng điểm có nhãn "Số liệu thật" (không ghi API)');
ok(/50%/.test(dt) && /45%/.test(dt) && /30%/.test(dt) && /20%/.test(dt) && /10%/.test(dt), 'dự án trọng điểm hiện 50/45/30/20/10 %');
ok(!/chậm tiến độ|đúng tiến độ"/.test(dt.replace(/không gắn nhãn[^.]*\./, '')), 'không gắn nhãn chậm/đúng tiến độ');
const ns = html(c, 'group', 'STC_UI.group="ns"');
ok((ns.match(/Chưa có số liệu từ Sở Tài chính/g) || []).length === 2, 'nhóm Ngân sách: 2 khối "Chưa có số liệu"');
ok(!/class="stc-donut|<circle class="stc-seg"/.test(ns), 'không vẽ biểu đồ rỗng khi chưa có số');
for (let i = 0; i < 13; i++) {
  const d = html(c, 'detail', 'STC_UI.ind=STC_INDICATORS[' + i + '].id;STC_UI.pick=null;');
  ok(balanced(d), 'chi tiết #' + i + ': div cân bằng');
  ok(/Số liệu (gốc từ API|thành phần)/.test(d) && !/Cách tính ·/.test(d), 'chi tiết #' + i + ': có số liệu thành phần, không hiện khối Cách tính (cách tính để trong tài liệu)');
  ok(!/<span>chiTieu<\/span>|<span>giaTri<\/span>/.test(d), 'chi tiết #' + i + ': không hiện tên trường kỹ thuật');
  ok(!/API|[A-Z]{3,}_[A-Z_]{3,}/.test(d), 'chi tiết #' + i + ': không hiện chữ API, mã kỹ thuật' + ((d.match(/.{0,60}API.{0,40}/) || [''])[0] ? ' — ' + d.match(/.{0,60}API.{0,40}/)[0] : ''));
}
const dda = html(c, 'detail', 'STC_UI.ind="da";STC_UI.pick=null;');
ok(/stc-oc-card/.test(dda) && /Xu hướng theo quý/.test(dda), 'chi tiết dự án trọng điểm: có sơ đồ thẻ');
const dnp = html(c, 'detail', 'STC_UI.ind="chi";STC_UI.pick=null;');
ok(/Chưa có số liệu từ Sở Tài chính/.test(dnp) && /Giá trị/.test(dnp), 'chi tiết chi NS (toàn 0): báo chưa có số, vẫn hiện bảng số liệu thành phần');
run(c, 'STC_UI.period=3;');
h = html(c, 'home');
ok(/Chưa có bản chụp số liệu cho Quý 3\/2026/.test(h), 'kỳ chưa có bản chụp: hiện thông báo rõ');
run(c, 'STC_UI.period=1;');
ok(run(c, 'STC_ITEMS.length') === 5, 'lưới chỉ tiêu có 5 thẻ = 1 thẻ Tổng quan (đứng đầu) + 4 nhóm');
const pv0 = run(c, 'stcPreviewBody(STC_ITEMS[0])');
ok(run(c, 'STC_ITEMS[0].stcKey') === 'home' && pv0.label === 'Tổng quan' && /4 nhóm/.test(pv0.bodyHtml) && /13 chỉ tiêu/.test(pv0.bodyHtml), 'thẻ đầu là Tổng quan (stcKey home), xem trước ghi 4 nhóm · 13 chỉ tiêu');
const pv = run(c, 'stcPreviewBody(STC_ITEMS[1])');
ok(pv.label === 'Ngân sách' && /2 chỉ tiêu/.test(pv.bodyHtml) && /2 chưa có số/.test(pv.bodyHtml), 'thẻ xem trước nhóm Ngân sách: 2 chỉ tiêu, cả 2 chưa có số');
const pv2 = run(c, 'stcPreviewBody(STC_ITEMS[2])');
ok(/5 nhóm/.test(pv2.bodyHtml) && /3 chỉ tiêu/.test(pv2.bodyHtml) && /2 chưa có số/.test(pv2.bodyHtml), 'thẻ xem trước nhóm Đầu tư: dự án trọng điểm có 5 nhóm, 2 chỉ tiêu chưa có số');

/* Băng "Tổng quan" đưa ra ngoài lưới (soItemCardHtml trong indicators.js gọi hàm này thay cho stcPreviewBody khi
   stcKey='home'; indicators.js không nạp trong harness này nên kiểm trực tiếp HTML mà hàm dựng ra). */
const band = run(c, "stcOverviewBandHtml({role:'UBND',id:'ubnd-taichinh'},0)");
ok(!/<button[^>]*class="field-category-card/.test(band) && /^<div class="field-category-card so-item-card stc-overview-band"/.test(band), 'băng Tổng quan là <div>, không phải <button> (tránh lồng button trong button)');
ok((band.match(/class="stc-kpi"/g) || []).length === 7, 'băng Tổng quan có đủ 7 ô KPI');
ok(/grid-column:1\/-1/.test(band) && />Tổng quan</.test(band) && />Xem tổng quan đầy đủ ›</.test(band), 'băng trải hết hàng, có tiêu đề và liên kết mở đầy đủ Trang chủ');
ok(/openCategoryDetail\('UBND','ubnd-taichinh',1\)/.test(band), 'ô "Tổng thu NSNN" (nhóm Ngân sách) trỏ đúng chỉ số thẻ 1 trong STC_ITEMS');
ok(/openCategoryDetail\('UBND','ubnd-taichinh',3\)/.test(band), 'ô "Khách du lịch" (nhóm Sản xuất) trỏ đúng chỉ số thẻ 3 trong STC_ITEMS');
ok(/openCategoryDetail\('UBND','ubnd-taichinh',0\)/.test(band), 'liên kết "Xem tổng quan đầy đủ" trỏ về đúng chỉ số thẻ Tổng quan (0)');

/* ===== Dữ liệu thử ===== */
console.log('== Dữ liệu thử');
c = makeCtx(true);
run(c, 'STC_UI.year=2026;STC_UI.period=1;');
h = html(c, 'home');
ok(!/class="stc-chips"/.test(h) && /Xem dữ liệu mẫu|Tắt dữ liệu mẫu/.test(h), 'trang chủ thử: không còn hàng chip (đã ẩn), nhãn nút bật/tắt vẫn còn');
ok(/13\/13/.test(h) === false, 'không hiện ghi chú thiếu số khi đủ số');
ok(/72,3/.test(h) && /28,6/.test(h) && /255,0/.test(h) && /108,4/.test(h) && /6,57/.test(h) && /103,4/.test(h), 'KPI: 72,3 / 28,6 / 255,0 / 108,4 / 6,57 / 103,4');
ok(/−400/.test(h), 'thẻ nhóm: cán cân XNK −400');
['ns', 'dt', 'sx', 'vm'].forEach((g) => {
  const gh = html(c, 'group', 'STC_UI.group=' + JSON.stringify(g));
  ok(balanced(gh), 'thử nhóm ' + g + ': div cân bằng');
  ok(!/Chưa có số liệu từ Sở Tài chính/.test(gh), 'thử nhóm ' + g + ': không có khối rỗng');
});
ns.length;
const ns2 = html(c, 'group', 'STC_UI.group="ns"');
ok(/72\.320/.test(ns2) && /62\.400/.test(ns2) && /28\.600/.test(ns2) && /<circle class="stc-seg"/.test(ns2), 'Ngân sách: số đúng + donut');
/* Từ 2026-10-02 mũi tên cạnh số tổng ở đầu thẻ bị ẩn (STC_BIGROW_DL = false); mức tăng chỉ còn ở phần thành phần */
ok(/13,0%/.test(ns2) && !/18,7%/.test(ns2) && /31,8%/.test(ns2), 'Ngân sách: thu nội địa +13,0%, chi ĐTPT +31,8%; tổng chi +18,7% không hiện cạnh số tổng');
ok(/<th>So kỳ trước<\/th><th>So cùng kỳ<\/th>/.test(ns2), 'Ngân sách: bảng chi có 2 cột so sánh');
const sx = html(c, 'group', 'STC_UI.group="sx"');
ok(/Nhập siêu 400/.test(sx) && /12,3%/.test(sx), 'SX-TM-DV: nhập siêu 400; vận tải hành khách +12,3% ở dòng thành phần');
ok(![ns2, sx].some((g) => /<\/small><\/div><span class="stc-dlp"/.test(g)), 'màn nhóm: cạnh số tổng ở đầu thẻ không còn mũi tên tăng giảm');
const vm2 = html(c, 'group', 'STC_UI.group="vm"');
ok(/Chờ xác nhận/.test(vm2) && /5\.900/.test(vm2), 'Vĩ mô: GRDP hiện giá so sánh nguyên số + nhãn chờ xác nhận');
ok((vm2.match(/class="stc-scale"/g) || []).length === 3, 'Vĩ mô: 3 thẻ chỉ số giá có thang riêng');
for (let i = 0; i < 13; i++) {
  const d = html(c, 'detail', 'STC_UI.ind=STC_INDICATORS[' + i + '].id;STC_UI.pick=null;');
  ok(balanced(d), 'thử chi tiết #' + i + ': div cân bằng');
  ok(/stc-oc-card/.test(d), 'thử chi tiết #' + i + ': có thẻ số');
}
let dc = html(c, 'detail', 'STC_UI.ind="chi";STC_UI.pick=null;');
ok(/stc-wf/.test(dc) && /\+2\.700/.test(dc) && /\+1\.300/.test(dc) && /\+418/.test(dc), 'chi: cầu nối có các bậc +2.700 / +1.300 / +418');
ok(/24\.100/.test(dc) && /28\.600/.test(dc), 'chi: cầu nối có 2 tổng');
/* công thức chỉ để trong tài liệu: bật tạm khối Cách tính để kiểm công thức, kiểm xong tắt */
dc = html(c, 'detail', 'var SHOW_FORMULA_BOX=true;STC_UI.ind="chi";STC_UI.pick="chi_dt";');
ok(/Đóng góp vào mức tăng = \(11\.200 − 8\.500\) ÷ 24\.100 = 11,2 điểm %/.test(dc), 'chi_dt: đóng góp 11,2 điểm %');
ok(/Tỷ trọng = 11\.200 ÷ 28\.600 = 39,2%/.test(dc), 'chi_dt: tỷ trọng 39,2%');
vm.runInContext('SHOW_FORMULA_BOX = false;', c);
ok(/sel/.test(dc), 'chi_dt: thẻ được chọn có viền');
dc = html(c, 'detail', 'STC_UI.ind="xnk";STC_UI.pick=null;');
ok(/Bấm thẻ Xuất khẩu hoặc Nhập khẩu/.test(dc), 'XNK: chưa chọn thì cầu nối nhắc chọn XK/NK');
ok((dc.match(/stc-oc-row/g) || []).length === 3, 'XNK: sơ đồ có 3 hàng (gốc + XK/NK + 2 hàng con)');
dc = html(c, 'detail', 'STC_UI.ind="xnk";STC_UI.pick="xk";');
ok(/stc-wf/.test(dc) && /\+/.test(dc), 'XNK chọn XK: vẽ được cầu nối của XK');
dc = html(c, 'detail', 'STC_UI.ind="vdt";STC_UI.pick=null;');
ok(/Chưa vẽ được cầu nối/.test(dc) && /chưa có kỳ so sánh/.test(dc), 'vốn ĐTPT: chưa có kỳ trước nên báo không vẽ cầu nối');
dc = html(c, 'detail', 'STC_UI.ind="iip";STC_UI.pick=null;');
ok(/không cộng dồn/.test(dc), 'IIP: không có cầu nối vì là chỉ số');
/* kỳ 2 thử: khách du lịch toàn 0 */
run(c, 'STC_UI.period=2;');
const g2 = html(c, 'group', 'STC_UI.group="sx"');
ok(/Chưa có số liệu từ Sở Tài chính/.test(g2), 'kỳ 2 thử: khách du lịch hiện "Chưa có số liệu"');
/* xu hướng có thêm điểm khi có kỳ 2 */
dc = html(c, 'detail', 'STC_UI.ind="chi";STC_UI.pick=null;STC_UI.period=2;');
ok(/Q2\/2026/.test(dc) && /stc-vl/.test(dc), 'kỳ 2: xu hướng có nhãn Q2/2026');
run(c, 'STC_UI.period=1;');
dc = html(c, 'detail', 'STC_UI.ind="chi";STC_UI.pick=null;');
const trendDots = (dc.match(/class="stc-vl"/g) || []).length;
ok(trendDots === 2, 'kỳ 1: xu hướng có 2 điểm có số (Q1/2025 và Q1/2026), các quý giữa để trống (đếm: ' + trendDots + ')');
/* thử: chọn năm khác */
run(c, 'STC_UI.year=2025;');
h = html(c, 'home');
ok(/Chưa có bản chụp số liệu cho Quý 1\/2025/.test(h), 'năm 2025 chưa có: thông báo rõ');

/* ===== Mỗi chỉ tiêu có kiểu biểu đồ riêng; bấm chỉ tiêu ở lưới thì mở đúng biểu đồ của nó ===== */
console.log('== Kiểu biểu đồ riêng cho từng chỉ tiêu');
c = makeCtx(true);
run(c, 'STC_UI.year=2026;STC_UI.period=1;');
const MARK = { thu: 'stc-cmp"', chi: 'stc-seg', vdt: 'stc-seg', nsnn: 'stc-stack', da: 'stc-pg', iip: 'stc-axis', bra: 'stc-stack', ble: 'stc-stack', vt: 'grid-template-columns:150px', dl: 'stc-seg', xnk: 'gap:24px', grdp: 'Giá so sánh cùng kỳ năm trước', gia: 'stc-scale' };
const GROUP = { thu: 'ns', chi: 'ns', vdt: 'dt', nsnn: 'dt', da: 'dt', iip: 'sx', bra: 'sx', ble: 'sx', vt: 'sx', dl: 'sx', xnk: 'sx', grdp: 'vm', gia: 'vm' };
Object.keys(MARK).forEach((id) => {
  const gh = html(c, 'group', 'STC_UI.group=' + JSON.stringify(GROUP[id]) + ';STC_UI.focus=' + JSON.stringify(id));
  ok(gh.indexOf('id="stc-ind-' + id + '"') >= 0, id + ': có neo #stc-ind-' + id);
  ok(gh.indexOf('stc-focus') >= 0, id + ': được tô viền khi bấm từ lưới chỉ tiêu');
  ok(gh.indexOf(MARK[id]) >= 0, id + ': có biểu đồ đặc trưng (' + MARK[id] + ')');
});
const kinds = {};
Object.keys(MARK).forEach((id) => { const view = run(c, 'STC_INDICATORS.find(i=>i.id==="' + id + '").view'); kinds[view] = true; });
ok(Object.keys(kinds).length === 8, 'có đủ 8 kiểu biểu đồ khác nhau (' + Object.keys(kinds).join(', ') + ')');
/* ===== An toàn nội dung ===== */
console.log('== An toàn');
c = makeCtx(true);
run(c, 'window.STC_DEMO_SNAPSHOT.periods["2026-1"].data.CHI_SO_KINH_TE[0].loai="<img src=x onerror=alert(1)>";STC_UI.year=2026;STC_UI.period=1;');
const inj = html(c, 'detail', 'STC_UI.ind="gia";STC_UI.pick=null;');
ok(!/<img src=x/.test(inj), 'nhãn lạ từ dữ liệu được escape, không chèn được HTML');

console.log('\nKết quả: ' + pass + ' đạt, ' + failn + ' lỗi');
process.exit(failn ? 1 : 0);
