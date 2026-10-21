'use strict';
/* Kiểm thử bộ chỉ tiêu Trung tâm Phục vụ HCC bằng Node (không cần trình duyệt):
   1. Số giả lập: tổng các đơn vị khớp HCC_TARGETS; số con không vượt số cha; lĩnh vực khớp đơn vị; tồn nối tiếp giữa các quý.
   2. Giao diện: mọi màn, mọi chỉ tiêu, mọi kỳ dựng được HTML, thẻ div cân bằng, có nhãn giả lập.
   Chạy: node tests/hcc/hcc.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const edu = read('js/features/dashboard-education.js');
const m = edu.match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: {} });
vm.runInContext('const gdUnitData=[' + m[1] + '];', ctx);
['js/core/line-chart.js', 'js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/features/dashboard-hcc.js'].forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const balanced = (h) => (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length;

console.log('== Số giả lập');
const R = run('hccUnits()'), T = run('HCC_TARGETS'), PS = run('HCC_PERIODS.map(p=>p.id)');
const NSO = run('HCC_SO.length'), NU = NSO + 126;
ok(NSO === 15 && R.length === NU && R.filter((r) => r.kind === 'so').length === NSO, 'có ' + NSO + ' sở/ngành + 126 phường/xã (' + R.length + ')');
{
  const so = run('HCC_SO.map(s=>s[0])');
  ok(['Sở Văn hóa và Thể thao', 'Sở Du lịch', 'Sở Quy hoạch - Kiến trúc'].every((x) => so.indexOf(x) < 0), 'danh sách sở không còn 3 sở đã ngừng kích hoạt');
  ok(['Sở Văn hóa, Thể thao và Du lịch', 'Sở Ngoại vụ', 'Thanh tra Thành phố', 'Văn phòng UBND Thành phố'].every((x) => so.indexOf(x) >= 0), 'danh sách sở có các đơn vị mới');
}
PS.forEach((p, pi) => {
  const C = run('hccCity("' + p + '")');
  ok(C.hs === T.hs[pi] && C.tong === T.hs[pi], p + ': hồ sơ tiếp nhận các đơn vị = các lĩnh vực = ' + T.hs[pi]);
  ok(C.gq === C.ht, p + ': đã giải quyết các đơn vị (' + C.gq + ') = totalHT các lĩnh vực (' + C.ht + ')');
  ok(C.ton === T.tonEnd[pi], p + ': tồn cuối kỳ = ' + T.tonEnd[pi]);
  ok(C.ol + C.tti + C.bc === C.tong, p + ': trực tuyến + trực tiếp + BCCI = total');
  ok(Math.abs(C.tre / C.gq * 100 - T.treR[pi]) < 0.01 && Math.abs(C.sh / C.hs * 100 - T.shR[pi]) < 0.01 && Math.abs(C.good / C.dg * 100 - T.hlR[pi]) < 0.01, p + ': tỷ lệ trễ hạn, số hóa, hài lòng đúng mục tiêu');
  ok(C.ttC + C.mpC + C.cttC === C.tthcC, p + ': thủ tục toàn trình + một phần + chưa = tổng (nút gốc)');
  ['hs', 'gq', 'tre', 'sh', 'dxl', 'dxlt'].forEach((k) => ok(C[k + '@so'] + C[k + '@p'] + C[k + '@x'] === C[k], p + ': ' + k + ' ba khối cộng lại = Thành phố'));
  ok(C.dxl === C.ton && C.dxlt + C.dxlth === C.dxl, p + ': đang xử lý cuối kỳ = còn tồn (' + C.ton + '); trong hạn + quá hạn = đang xử lý');
  ok(Math.abs(C.dxlt / C.dxl * 100 - T.dxlTreR[pi]) < 0.01, p + ': tỷ lệ đang xử lý trễ hạn đúng mục tiêu ' + T.dxlTreR[pi] + '%');
  if (pi < PS.length - 1) {
    const older = run('hccCity("' + PS[pi + 1] + '")');
    ok(C.lv.every((x, i) => x.kt === older.lv[i].ton), p + ': tồn cuối quý trước = chuyển sang quý này, từng lĩnh vực');
  }
});
let viol = 0;
R.forEach((r) => PS.forEach((p) => {
  const o = r.v[p], bad = [];
  Object.keys(o).forEach((k) => { if (o[k] < 0 || !Number.isInteger(o[k])) bad.push(k + '<0'); });
  if (o.th + o.dh + o.tre !== o.gq) bad.push('gq');
  if (o.sh > o.hs) bad.push('sh'); if (o.ttt + o.tkh !== o.tp || o.tp > o.hs) bad.push('tp');
  if (o.dg > o.gq || o.rhl + o.hl + o.bt + o.khl + o.rkhl !== o.dg) bad.push('dg');
  if (o.tt + o.mp + o.ctt !== o.tthc) bad.push('tthc');
  if (o.dxlt > o.dxl || o.dxlt + o.dxlth !== o.dxl) bad.push('dxl');
  if (bad.length) { viol++; if (viol < 4) console.log('    ' + r.name + ' ' + p + ': ' + bad.join(',')); }
}));
ok(viol === 0, 'mọi đơn vị, mọi kỳ: số con không vượt số cha, các phần cộng đúng, số nguyên không âm (' + viol + ' vi phạm)');
const late = run('hccLateList(hccUnits()[20],"2026Q2",40)');
ok(late.length === Math.min(40, R[20].v['2026Q2'].tre) && late.every((x) => x.late > 0 && /\*\*\*/.test(x.applicant)), 'danh sách hồ sơ trễ hạn mẫu: đúng số dòng, tên người nộp đã che');
const oLate = run('hccOpenLateList(hccUnits()[20],"2026Q2",40)');
ok(oLate.length === Math.min(40, R[20].v['2026Q2'].dxlt) && oLate.every((x) => x.late > 0 && /\*\*\*/.test(x.applicant) && !x.done), 'danh sách hồ sơ đang xử lý trễ hạn mẫu: đúng số dòng, chưa có ngày trả, tên đã che');
ok(oLate.every((x, i) => i === 0 || oLate[i - 1].late >= x.late), 'danh sách đang xử lý trễ hạn xếp quá hạn nhiều nhất trước');
const proc = run('hccProcList(hccUnits()[0],"2026Q2")');
ok(proc.length > 0 && proc.some((x) => x.muc === 'Toàn trình'), 'danh sách thủ tục mẫu có đủ mức');

console.log('== Giao diện');
const screen = (s, extra) => run('HCC_UI.open=true;HCC_UI.screen=' + JSON.stringify(s) + ';' + (extra || '') + 'hccScreenHtml()');
const clean = (h) => !/NaN|undefined|Infinity|null/.test(h.replace(/aria-[a-z]+="[^"]*"/g, ''));
PS.forEach((p) => {
  run('HCC_UI.period="' + p + '";HCC_UI.pick=null;');
  const h = screen('home');
  ok(balanced(h) && clean(h), p + ' trang chủ: div cân bằng, không NaN/undefined');
  ok((h.match(/class="stc-kpi"/g) || []).length === 8, p + ' trang chủ: 8 ô KPI');
  ok(/Hồ sơ đang xử lý trễ hạn/.test(h) && /Hồ sơ giải quyết trễ hạn/.test(h), p + ' trang chủ: có ô đang xử lý trễ hạn, tách với giải quyết trễ hạn');
  ok((h.match(/class="stc-gcard/g) || []).length === 6, p + ' trang chủ: 5 thẻ nhóm + thẻ theo đơn vị');
  ok(/Số liệu giả lập/.test(h), p + ' trang chủ: có nhãn số liệu giả lập');
  ['tn', 'gq', 'dvc', 'sh', 'hl'].forEach((g) => {
    const gh = screen('group', 'HCC_UI.group="' + g + '";');
    ok(balanced(gh) && clean(gh), p + ' nhóm ' + g + ': dựng được, không NaN');
    ok(/hccXa\('/.test(gh), p + ' nhóm ' + g + ': tiêu đề thẻ mở màn theo đơn vị');
    if (g === 'gq') ok(/10 đơn vị nhiều hồ sơ đang xử lý trễ hạn nhất/.test(gh) && /hccXaOpen\('dangxltre'/.test(gh), p + ' nhóm gq: có thẻ đang xử lý trễ hạn + top 10 mở đúng chỉ tiêu');
  });
  run('HCC_TREE').forEach((t) => {
    const dh = screen('detail', 'HCC_UI.tree="' + t.id + '";HCC_UI.pick=null;');
    ok(balanced(dh) && clean(dh), p + ' chi tiết ' + t.id + ': dựng được, không NaN');
    if (p !== PS[PS.length - 1]) ok(/class="stc-wf"/.test(dh), p + ' chi tiết ' + t.id + ': có cầu nối tăng giảm');
    ok(/Xu hướng 6 quý/.test(dh) && /<svg/.test(dh), p + ' chi tiết ' + t.id + ': có xu hướng');
    const kid = t.kids[0].id;
    const ph = screen('detail', 'HCC_UI.tree="' + t.id + '";HCC_UI.pick="' + kid + '";');
    ok(balanced(ph) && /stc-oc-card sel/.test(ph), p + ' chi tiết ' + t.id + ': chọn thẻ con ' + kid);
  });
  run('HCC_XA_INDS').forEach((x) => {
    const xh = screen('xa', 'hccXaSetInd("' + x.id + '");HCC_UI.xa.q="";HCC_UI.xa.f="all";HCC_UI.xa.sel=null;');
    ok(balanced(xh) && clean(xh), p + ' theo đơn vị · ' + x.id + ': dựng được, không NaN');
    ok((xh.match(/class="sgd-xbtn"/g) || []).length === NU, p + ' theo đơn vị · ' + x.id + ': đủ ' + NU + ' dòng');
  });
  const src = screen('src');
  ok(balanced(src) && (src.match(/Chỉ có schema/g) || []).length === 9, p + ' màn nguồn dữ liệu: 9 endpoint');
});
run('HCC_UI.period="2026Q2";');
let xh = screen('xa', 'hccXaSetInd("dunghan");HCC_UI.xa.q="viet hung";');
ok((xh.match(/class="sgd-xbtn"/g) || []).length === 1 && /Phường Việt Hưng/.test(xh), 'tìm không dấu "viet hung" ra Phường Việt Hưng');
xh = screen('xa', 'HCC_UI.xa.q="";HCC_UI.xa.f="so";');
ok((xh.match(/class="sgd-xbtn"/g) || []).length === NSO, 'lọc chỉ sở, ngành: ' + NSO + ' dòng');
xh = screen('xa', 'HCC_UI.xa.f="all";HCC_UI.xa.sel="Sở Tư pháp";');
ok(balanced(xh) && /class="sgd-dw[" ]/.test(xh) && /Hồ sơ trễ hạn trong kỳ/.test(xh) && /hccXaStep\(/.test(xh), 'mở hồ sơ Sở Tư pháp: khung trượt có danh sách hồ sơ trễ hạn');
xh = screen('xa', 'hccXaSetInd("dangxltre");HCC_UI.xa.sel="Sở Tư pháp";');
ok(balanced(xh) && /Hồ sơ đang xử lý trễ hạn tại cuối kỳ/.test(xh) && /Quá hạn/.test(xh), 'chỉ tiêu đang xử lý trễ hạn: hồ sơ đơn vị có danh sách hồ sơ quá hạn chưa trả');
/* Ngưỡng xếp hạng (02/10/2026): đơn vị có mẫu số < HCC_XA_MIN_DEN không xếp hạng, không làm "tốt nhất", nằm cuối khi sắp theo giá trị */
{
  run('HCC_UI.xa.sel=null;HCC_UI.xa.f="all";HCC_UI.xa.q="";hccXaSetInd("dangxltre");');
  const K = run('hccXaCtx()');
  const out = K.all.filter((x) => !x.ok);
  ok(out.length > 0 && out.every((x) => x.rank == null && x.r.v[K.n.p].dxl < 30), 'đang xử lý trễ hạn: ' + out.length + ' đơn vị dưới 30 hồ sơ đang xử lý không xếp hạng');
  ok(K.byV.every((x, i) => x.rank === i + 1 && x.ok) && K.byV[0].r.v[K.n.p].dxl >= 30, 'hạng liên tục 1..' + K.byV.length + ', tốt nhất là đơn vị đủ ngưỡng (' + K.byV[0].r.name + ')');
  const h = screen('xa', '');
  const order = run('HCC_UI.xa.order'), lastOk = order.map((nm) => K.all.find((x) => x.r.name === nm).ok);
  ok(lastOk.indexOf(false) > 0 && lastOk.slice(lastOk.indexOf(false)).every((v) => !v), 'sắp theo giá trị: đơn vị không xếp hạng nằm cuối bảng');
  ok(/không được xếp hạng/.test(h) && !/Tốt nhất \(thấp nhất\)<\/div><div class="stc-v">0,00%/.test(h), 'màn theo đơn vị có chú thích ngưỡng, ô tốt nhất không còn là 0,00% của đơn vị nhỏ');
  const pr = screen('xa', 'HCC_UI.xa.sel="Sở Ngoại vụ";');
  ok(/Không xếp hạng theo/.test(pr) && balanced(pr) && !/NaN|undefined|Infinity/.test(pr), 'hồ sơ Sở Ngoại vụ: ghi "Không xếp hạng", không NaN');   // không dùng clean(): nút đóng khung có hccXaSel(null)
  run('hccXaSetInd("toantrinh");');
  ok(run('hccXaCtx()').byV.length === NU, 'chỉ tiêu thủ tục (danh mục) không áp ngưỡng: xếp hạng đủ ' + NU + ' đơn vị');
  run('hccXaSetInd("khonghl");');
  ok(run('hccXaCtx()').all.filter((x) => !x.ok).every((x) => x.r.v[K.n.p].dg < 50), 'tỷ lệ không hài lòng giữ ngưỡng 50 lượt');
  run('HCC_UI.xa.sel=null;');
}
xh = screen('xa', 'hccXaSetInd("toantrinh");HCC_UI.xa.sel="Phường Việt Hưng";');
ok(/Mức cung cấp trực tuyến/.test(xh) && /hcc-mu/.test(xh), 'chỉ tiêu toàn trình: hồ sơ đơn vị có danh sách thủ tục theo mức');
xh = screen('xa', 'HCC_UI.xa.sel=null;');
ok(!/class="sgd-dw[" ]/.test(xh), 'chưa bấm đơn vị nào thì không mở khung hồ sơ');
run('HCC_UI.xa.sel="Sở Tư pháp";hccRerender=function(){};hccXaStep(1);');
ok(run('HCC_UI.xa.order').indexOf(run('HCC_UI.xa.sel')) === run('HCC_UI.xa.order').indexOf('Sở Tư pháp') + 1, 'nút Sau › chuyển sang đơn vị kế tiếp');
const band = run('hccOverviewBandHtml({role:"UBND",id:"ubnd-hcc"},0)');
ok(balanced(band) && (band.match(/openCategoryDetail\('UBND','ubnd-hcc',/g) || []).length >= 14, 'băng Tổng quan ngoài lưới: 8 KPI + 6 thẻ mở đúng popup');
ok(run('HCC_ITEMS.length') === 7 && run('HCC_ITEMS[0].hccKey') === 'home' && run('HCC_ITEMS[6].hccKey') === 'xa', 'HCC_ITEMS: Tổng quan + 5 nhóm + theo đơn vị');

/* Anh yêu cầu 2026-09-29 (với Sở GD&ĐT, áp cho mọi bộ cùng khuôn): giao diện KHÔNG hiện mã kỹ thuật (tên API/endpoint,
   trường dữ liệu kiểu total_SH, totalTreHan, department_code…). Quét phần chữ nhìn thấy của mọi màn khi HCC_SHOW_TECH = false. */
{
  const visible = (h) => h.replace(/<[^>]*>/g, ' ');
  const BAD = /\b[A-Za-z]+_[A-Za-z0-9_*]+\b|\btotal[A-Z]\w*|\b(?:congDan|doanhNghiep|parentId|level\s*\d|hcc_tkpro|iceberg)\b|endpoint|schema|\bAPI\b|\bid\b/;
  const leaks = [];
  const chk = (name, h) => { const x = visible(h).match(BAD); if (x) leaks.push(name + ': ' + x[0]); };
  ok(run('HCC_SHOW_TECH') === false, 'mặc định ẩn thông tin kỹ thuật (HCC_SHOW_TECH = false)');
  PS.forEach((p) => {
    run('HCC_UI.period="' + p + '";HCC_UI.xa.sel=null;');
    chk(p + ' home', screen('home'));
    ['tn', 'gq', 'dvc', 'sh', 'hl'].forEach((g) => chk(p + ' nhóm ' + g, screen('group', 'HCC_UI.group="' + g + '";')));
    run('HCC_TREE').forEach((t) => { chk(p + ' chi tiết ' + t.id, screen('detail', 'HCC_UI.tree="' + t.id + '";HCC_UI.pick=null;')); chk(p + ' chi tiết chọn ' + t.id, screen('detail', 'HCC_UI.pick="' + t.kids[0].id + '";')); });
    run('HCC_XA_INDS').forEach((x) => chk(p + ' đơn vị ' + x.id, screen('xa', 'hccXaSetInd("' + x.id + '");HCC_UI.xa.q="";HCC_UI.xa.f="all";HCC_UI.xa.sel="Sở Tư pháp";')));
  });
  chk('băng Tổng quan', run('hccOverviewBandHtml({role:"UBND",id:"ubnd-hcc"},0)'));
  ok(leaks.length === 0, 'giao diện không hiện mã kỹ thuật' + (leaks.length ? ' — còn ' + leaks.length + ': ' + leaks.slice(0, 40).join(' | ') : ''));
  ok(!/Nguồn dữ liệu và giả định/.test(screen('home')), 'trang chủ không còn liên kết sang màn nguồn dữ liệu kỹ thuật');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
