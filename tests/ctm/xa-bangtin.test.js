'use strict';
/* Kiểm thử bảng tin chỉ tiêu xã, phường (js/features/ctm-xa-bangtin.js — bố cục 2 lớp, tùy chỉnh màn ngoài, anh duyệt 12/11/2026).
   Theo quy ước (AGENTS.md mục 1, 11; docs/CHUNG/QUY_UOC… Phần VI): chỉ chọn được ô số, chỉ tiêu xã nhập (dòng số liệu), biểu đồ có trong
   bản đọc; bố cục mặc định hợp lệ ở cả 126 xã; không trùng số trên một màn (T1); mọi số có khóa mở Dữ liệu đã nhập (E4, T2);
   hình tròn / thanh 100% / ô diện tích chỉ khi eform có dòng "Tổng số" (G6); số cùng nhóm để so không trộn đơn vị tính; tự chia hàng đều.
   Chạy: node tests/ctm/xa-bangtin.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO_CFG.unshift('js/core/xa-dan-so.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js',
  'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js',
  'js/core/eform-khung.js', 'js/core/eform-mau.js', 'js/features/ctm-eform.js', 'js/features/ctm-truc-eform.js', 'js/features/ctm-so-eform.js', 'js/features/ctm-so-eform2.js', 'js/features/ctm-xa-eform.js',
  'js/features/ctm-xa-bangtin.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, Set, Map, Intl, esc: escFn, setTimeout: () => 0, document: { getElementById: () => null } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const names = run('wardNames()');
const setXa = (name) => run('currentXaId=' + JSON.stringify(String(names.indexOf(name))));
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const make = (ov) => run('(function(){ var s = xbtSpecs(null); return xbtMake(xbtData(s, CTM_SPECS[s[0]].periods[0].id), ' + JSON.stringify(ov || 'xa-4truc') + '); })()');

console.log('== Bố cục mặc định hợp lệ ở cả 126 xã, phường (chỉ số, biểu đồ có trong bản đọc; không trùng)');
{
  let bad = [], dup = [];
  names.forEach((nm) => {
    setXa(nm);
    const T = make().test, d = T.defFor();
    if (d.blocks.some((b) => b.bad) || !d.rings.length) bad.push(nm);
    T.setL(d);
    const seen = new Set();
    d.rings.forEach((r) => { const k = r[0] + ':' + r[1]; if (seen.has(k)) dup.push(nm + ' ' + k); seen.add(k); });
    d.blocks.forEach((b) => { (b.t === 'bd' ? [b.ef + '#' + b.c] : [b.ef + ':' + b.m].concat(b.s.map((x) => b.ef + ':' + x))).forEach((k) => { if (seen.has(k)) dup.push(nm + ' ' + k); seen.add(k); }); });
  });
  ok(bad.length === 0, 'mặc định có khối lỗi hoặc thiếu số nổi bật: ' + bad.slice(0, 5).join(', '));
  ok(dup.length === 0, 'mặc định có số trùng trên màn (T1): ' + dup.slice(0, 5).join(', '));
}

['Xã Sơn Đồng', 'Phường Việt Hưng', 'Xã Ba Vì'].forEach((nm) => {
  console.log('== ' + nm);
  setXa(nm);
  const inst = make(), T = inst.test, D = inst.DATA;
  ok(D.eforms.length === 12, '12 eform xã (' + D.eforms.length + ')');
  ok(D.periods.length === 5 && D.periods[4].id === D.cur, '5 kỳ, kỳ cuối là kỳ đang xem');
  /* chỉ chọn được số có trong bản đọc: ô số của đơn vị hoặc dòng số liệu của eform */
  const pool = T.ringPool(-1);
  ok(pool.length > 100, 'hộp chọn có ô số và chỉ tiêu xã nhập (' + pool.length + ')');
  ok(pool.every((x) => { const p = x.key.indexOf(':'), ef = x.key.slice(0, p), id = x.key.slice(p + 1); const e = inst.BY[ef]; return e && (id.indexOf('d:') === 0 ? !!e.dlBy[id.slice(2)] : e.kpis.some((k) => k.id === id)); }), 'mọi lựa chọn là ô số hoặc dòng số liệu có thật của eform');
  const specKpis = D.eforms.every((e) => { const s = run('CTM_SPECS[' + JSON.stringify(e.sid) + ']'); return e.kpis.length === s.kpis.length; });
  ok(specKpis, 'ô số mỗi eform đúng danh sách ô số của đơn vị (bản đọc)');
  /* T1: số đã dùng thì mờ */
  T.setL(T.defFor());
  const used = T.usedBy(-1, false), dis = pool.filter((x) => x.dis).map((x) => x.key);
  ok(dis.every((k) => used.has(k)) && T.L().rings.every((r) => dis.indexOf(r[0] + ':' + r[1]) >= 0), 'số đã có trên màn bị làm mờ trong hộp chọn (T1)');
  /* đọc cấu hình lạ: đánh dấu, không hiện số sai; tối đa 12 ô */
  const v = T.valid({ rings: Array.from({ length: 20 }, () => ['xa_hcc', 'tuyen']).concat([['xa_khong', 'x']]), blocks: [{ t: 'so', ef: 'xa_hcc', m: 'khong_co' }, { t: 'so', ef: 'xa_khong', m: 'x' }, { t: 'bd', ef: 'xa_hcc', c: 99 }] });
  ok(v.rings.length <= 12, 'số nổi bật tối đa 12 ô');
  ok(v.blocks.every((b) => b.bad), 'chỉ tiêu, eform, biểu đồ không còn trong bản đọc thì đánh dấu khối (không hiện số sai)');
  /* E4, T2: mọi số có khóa mở Dữ liệu đã nhập */
  const keysOk = D.eforms.every((e) => e.kpis.every((k) => typeof k.recs === 'string' && k.recs) && e.charts.every((c) => (c.items || []).every((x) => typeof x.recs === 'string' && x.recs)) && e.dl.every((d) => typeof d.recs === 'string' && d.recs));
  ok(keysOk, 'mọi ô số, phần biểu đồ, dòng số liệu có khóa mở Dữ liệu đã nhập');
  const xu = [].concat(...D.eforms.map((e) => e.charts.filter((c) => c.loai === 'xu').map((c) => c.items)));
  ok(xu.length > 0 && xu.every((items) => items.every((x, i) => x.recs.split('\u0001')[0] === D.periods[i].id)), 'cột qua các kỳ mở đúng bản ghi của kỳ đó');
  /* G6: hình phần của tổng chỉ khi eform có dòng "Tổng số" */
  const partsKinds = D.eforms.every((e) => e.charts.every((c, ci) => { const ks = T.vkinds(e, c, ci); const hasParts = ks.some((k) => ['tron', 'thanh100', 'treemap'].indexOf(k) >= 0); return !hasParts || e.ef === 'xa_gd'; }));
  ok(partsKinds, 'tròn, thanh 100%, ô diện tích chỉ ở biểu đồ có dòng "Tổng số" (Giáo dục)');
  /* số cùng nhóm để so: không trộn đơn vị tính */
  const dlMix = D.eforms.some((e) => e.dl.some((d) => { const sb = T.sibOf(e.ef, 'd:' + d.k); if (!sb) return false; const same = e.dl.filter((y) => y.u === d.u && y.vals[4] != null).map((y) => y.vals[4]); return sb.items.some((x) => same.indexOf(x.v) < 0); }));
  ok(!dlMix, 'thanh so sánh dưới chỉ tiêu xã nhập chỉ gồm các dòng cùng đơn vị tính');
});

console.log('== Tự chia hàng đều');
{
  setXa('Xã Sơn Đồng');
  const T = make().test;
  let okR = true, okB = true;
  for (let n = 1; n <= 12; n++) { const sp = T.ringSpans(n); let row = 0, cnt = 0; sp.forEach((x) => { row += x; cnt++; if (row === 12) { if (cnt > 4) okR = false; row = 0; cnt = 0; } }); if (row !== 0 || sp.length !== n) okR = false; }
  const Z = ['s', 'm', 'l'];
  for (let t = 0; t < 200; t++) { const bs = Array.from({ length: 1 + (t % 9) }, (_, i) => ({ z: Z[(t * 7 + i * 3) % 3] })); const sp = T.blockSpans(bs); let row = 0; sp.forEach((x) => { row += x; if (row > 12) okB = false; if (row === 12) row = 0; }); if (row !== 0) okB = false; }
  ok(okR, 'số nổi bật: mỗi hàng kín 12 cột, tối đa 4 ô/hàng, không ô lẻ hàng cuối');
  ok(okB, 'khối: mỗi hàng kín 12 cột dù thêm, bớt, đổi cỡ');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
