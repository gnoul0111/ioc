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
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, Set, Map, Intl, esc: escFn, setTimeout: () => 0,
  /* tối thiểu để dựng HTML của bảng tin (màu đọc từ CSS, phần tử đọc màu, hộp thoại) */
  getComputedStyle: () => ({ getPropertyValue: () => '#336699' }),
  document: { getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {} }), body: { appendChild() {} } } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const names = run('wardNames()');
const setXa = (name) => run('currentXaId=' + JSON.stringify(String(names.indexOf(name))));
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const make = (ov) => run('(function(){ var s = xbtSpecs(null); return xbtMake(xbtData(s), ' + JSON.stringify(ov || 'xa-4truc') + '); })()');

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
  ok(v.rings.length === 1, 'số nổi bật lặp trong cấu hình nạp vào chỉ giữ một ô (T1)');
  const v2 = T.valid({ rings: [['xa_hcc', 'tuyen']], blocks: [{ t: 'so', ef: 'xa_hcc', m: 'tuyen', s: [] }, { t: 'bd', ef: 'xa_qlvb', c: 0 }, { t: 'bd', ef: 'xa_qlvb', c: 0 }, { t: 'so', ef: 'xa_hcc', m: 'tt', s: ['tuyen', 'tt', 'dh'] }] });
  ok(v2.blocks.length === 2 && v2.blocks[0].t === 'bd' && v2.blocks[1].m === 'tt' && v2.blocks[1].s.join() === 'dh', 'khối lặp số nổi bật, biểu đồ, số phụ đã có ở chỗ khác thì bỏ (T1)');
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

console.log('== Đơn vị tính của dòng số liệu (X7)');
{
  setXa('Xã Sơn Đồng');
  const D = make().DATA, e = D.eforms.find((x) => x.ef === 'xa_ktxh');
  const dc = e.charts.find((c) => c.loai === 'dong');
  ok(dc && dc.items.length && dc.items.every((x) => x.u === '%'), 'Kinh tế xã hội: «Mức độ hoàn thành» là %');
  const nh = [].concat(...e.nhom.map((g) => g.dongs));
  ok(nh.length && nh.every((x) => x.u !== '%') && nh.some((x) => x.u === 'tỷ đồng'), 'Kinh tế xã hội: nhóm vẽ «Ước thực hiện» giữ đơn vị tính của dòng (không gán %)');
  const inst = make('modal'); run('XBT.curEf = ' + JSON.stringify(e.sid));
  inst.ef(inst.EFS.find((x) => x.ef === 'xa_ktxh')); /* dựng được */
  run('XBT.pendGroup = ' + JSON.stringify({ sid: e.sid, gid: e.nhom[0].id }));
  const h = inst.ef(inst.EFS.find((x) => x.ef === 'xa_ktxh'));
  ok(h.indexOf('aria-pressed="true" data-sel="n' + e.nhom[0].v + '"') >= 0, 'mở màn nhóm: chọn sẵn đúng nhóm trong danh sách');
  ok(!/class="dl-v">[^<]*%</.test(h.split('class="stage"')[1] || ''), 'màn nhóm Kinh tế xã hội không ghi % cho số «Ước thực hiện»');
}

console.log('== Kỳ xem');
{
  setXa('Xã Sơn Đồng');
  const sids = run('xbtSpecs(null)'), sid = sids.find((x) => run('CTM_SPECS[' + JSON.stringify(x) + '].kyDef.eforms[0].ef') === 'xa_hdnd');
  /* màn eform theo Kỳ xem của hộp: Lũy kế */
  run('CTM_UI.id = ' + JSON.stringify(sid) + '; CTM_UI.kyMode = "lk"; CTM_UI.gran = "thang"; CTM_UI.period = CTM_SPECS[' + JSON.stringify(sid) + '].periods[0].id;');
  const lk = run('CTM_UI.period'), D = run('xbtData(xbtSpecs(null), ' + JSON.stringify(sid) + ')');
  ok(/^LK:/.test(lk) && D.cur === lk && D.periods[D.periods.length - 1].id === lk, 'Lũy kế: số trên màn là của kỳ lũy kế đang xem (' + D.cur + ')');
  ok(D.eforms.every((e) => e.kpis.every((k) => k.pv === null || typeof k.pv === 'number')), 'kỳ so sánh ngoài các kỳ vẽ vẫn có số so (pv)');
  /* So nhiều kỳ: các kỳ vẽ là các kỳ đã chọn, không so tăng giảm */
  run('CTM_UI.kyMode = "nhieu"; CTM_UI.gran = "quy"; var b = CTM_SPECS[' + JSON.stringify(sid) + '].periods; CTM_UI.kyDs = [b[2].id, b[0].id]; CTM_UI.period = b[0].id;');
  const Dn = run('xbtData(xbtSpecs(null), ' + JSON.stringify(sid) + ')');
  ok(Dn.multi && Dn.periods.length === 2 && Dn.prev === null, 'So nhiều kỳ: vẽ đúng các kỳ đã chọn, không so tăng giảm');
  run('CTM_UI.kyMode = null; CTM_UI.kyDs = null; CTM_UI.id = null; CTM_UI.gran = "quy"; CTM_UI.period = null;');
  /* màn ngoài: chọn Tháng / Quý / Năm; kỳ cũ nhất không có kỳ trước vẫn dựng được */
  run('XBT.ky = { g: "thang", p: null }');
  const it = make(), html = it.home();
  ok(it.DATA.tu === 'tháng' && it.DATA.periods.length === 5 && html.indexOf('data-xky="g"') >= 0 && html.indexOf('data-xky="p"') >= 0, 'màn ngoài: chọn được Tháng / Quý / Năm và kỳ');
  ok(html.indexOf('quý') < 0 || html.indexOf('5 quý') < 0, 'xem theo tháng không ghi «5 quý»');
  run('XBT.ky = { g: "nam", p: null }');
  const ps = run('efKyDs("nam", efRange(CTM_SPECS[xbtSpecs(null)[0]].kyDef))');
  run('XBT.ky.p = ' + JSON.stringify(ps[ps.length - 1].id));
  let okOld = true, h2 = '', h3 = '';
  try { const it2 = make(); h2 = it2.home(); run('XBT.curEf = ' + JSON.stringify(it2.EFS[0].sid)); h3 = it2.ef(it2.EFS[0]); okOld = it2.DATA.prev === null; } catch (er) { okOld = false; console.log('   ', er.message); }
  ok(okOld && h2.indexOf('chưa có kỳ trước để so') >= 0 && h3.length > 0, 'kỳ cũ nhất (không có kỳ trước): màn ngoài, màn eform vẫn dựng, ghi chưa có kỳ trước');
  run('XBT.ky = { g: "quy", p: null }');
}

console.log('== Số trống, phần không có bản ghi');
{
  setXa('Xã Sơn Đồng');
  /* số % chưa có số: không vẽ 0% */
  const D = run('xbtData(xbtSpecs(null))'), e = D.eforms.find((x) => x.ef === 'xa_gpmb');
  e.kpis.forEach((k) => { if (k.u === '%') k.vals = k.vals.map(() => null); });
  const it = run('(function(D){ return xbtMake(D, "xa-thu"); })')(D);
  const pk = e.kpis.find((k) => k.u === '%');
  it.test.setL({ rings: [], blocks: [{ t: 'so', ef: 'xa_gpmb', m: pk.id, s: [], h: 'tiendo', z: 'm' }] });
  const h = it.home();
  ok(h.indexOf('0,0%') < 0 && h.indexOf('chưa có số') >= 0, 'thanh tiến độ không hiện 0% khi kỳ chưa có số');
  /* eform không có số nào: màn eform vẫn dựng, báo chưa có số */
  const D2 = run('xbtData(xbtSpecs(null))'), e2 = D2.eforms.find((x) => x.ef === 'xa_hcc');
  e2.charts.forEach((c) => (c.items || []).forEach((x) => { x.v = null; })); e2.nhom = [];
  const it2 = run('(function(D){ return xbtMake(D, "modal"); })')(D2);
  let h2 = ''; try { h2 = it2.ef(it2.EFS.find((x) => x.ef === 'xa_hcc')); } catch (er) { console.log('   ', er.message); }
  ok(h2.indexOf('chưa có số') >= 0, 'eform không có số ở kỳ nào: màn eform báo chưa có số (không lỗi)');
  /* dòng không có khóa bản ghi thì không là nút bấm */
  const D3 = run('xbtData(xbtSpecs(null))'), e3 = D3.eforms.find((x) => x.ef === 'xa_ktxh');
  e3.nhom.push({ id: 'xa_ktxh:THU', v: 'THU', l: 'Nhóm thử', n: 1, lines: [{ l: 'Dòng thử không khóa', u: '', cur: 5, prev: null, recs: '' }], dongs: [] });
  const it3 = run('(function(D){ return xbtMake(D, "modal"); })')(D3);
  run('XBT.curEf = ' + JSON.stringify(e3.sid) + '; XBT.pendGroup = ' + JSON.stringify({ sid: e3.sid, gid: 'xa_ktxh:THU' }));
  const h3 = it3.ef(it3.EFS.find((x) => x.ef === 'xa_ktxh')), row = (h3.match(/<(div|button)[^>]*title="Dòng thử không khóa"/) || [''])[0];
  ok(row.indexOf('<div') === 0 && row.indexOf('data-r') < 0, 'dòng không có khóa bản ghi là chữ thường, không mở màn bản ghi rỗng');
  run('XBT.curEf = null');
}

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
