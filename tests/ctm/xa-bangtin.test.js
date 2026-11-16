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
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
/* dựng một môi trường chạy mã IOC; patch(f, mã) đổi mã một tệp trước khi chạy (vd. bật cờ để kiểm phần đang ẩn) */
const boot = (patch) => {
  const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, Set, Map, Intl, esc: escFn, setTimeout: () => 0,
    /* tối thiểu để dựng HTML của bảng tin (màu đọc từ CSS, phần tử đọc màu, hộp thoại) */
    getComputedStyle: () => ({ getPropertyValue: () => '#336699' }),
    document: { getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {} }), body: { appendChild() {} } } });
  vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
  FILES.forEach((f) => vm.runInContext(patch ? patch(f, read(f)) : read(f), ctx, { filename: f }));
  const r = (code) => vm.runInContext(code, ctx);
  r('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
  return r;
};
const run = boot();
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
    /* không còn hàng Số nổi bật (16/11/2026): 4 vòng tỷ lệ thành 2 khối «Vòng tỷ lệ» đầu màn */
    if (d.blocks.some((b) => b.bad) || d.rings.length || d.blocks.slice(0, 2).map((b) => b.ef + ':' + b.m + ':' + b.s.join() + ':' + b.h).join() !== 'xa_tcns:tlThu:tlChi:vong,xa_gpmb:tlTh:tlBg:vong') bad.push(nm);
    T.setL(d);
    const seen = new Set();
    d.rings.forEach((r) => { const k = r[0] + ':' + r[1]; if (seen.has(k)) dup.push(nm + ' ' + k); seen.add(k); });
    d.blocks.forEach((b) => { (b.t === 'bd' ? [b.ef + '#' + b.c] : [b.ef + ':' + b.m].concat(b.s.map((x) => b.ef + ':' + x))).forEach((k) => { if (seen.has(k)) dup.push(nm + ' ' + k); seen.add(k); }); });
  });
  ok(bad.length === 0, 'mặc định có khối lỗi, còn hàng Số nổi bật hoặc thiếu 2 khối vòng tỷ lệ đầu màn: ' + bad.slice(0, 5).join(', '));
  ok(dup.length === 0, 'mặc định có số trùng trên màn (T1): ' + dup.slice(0, 5).join(', '));
}

console.log('== Bố cục mặc định của tab «Tất cả» và tab từng trục (anh duyệt 16/11/2026) ở cả 126 xã, phường');
{
  const TRUC = { DANG: ['xa_dang'], HDND: ['xa_hdnd'], UBND: ['xa_hcc', 'xa_tcns', 'xa_qlvb', 'xa_gpmb', 'xa_gd', 'xa_yte', 'xa_vh', 'xa_nv', 'xa_ktxh'], MTTQ: ['xa_mttq'] };
  TRUC.ALL = [].concat(TRUC.DANG, TRUC.HDND, TRUC.UBND, TRUC.MTTQ);
  const NB = { DANG: 1, HDND: 3, UBND: 12, MTTQ: 6, ALL: 12 }, bad = [], t1 = [];
  names.forEach((nm) => {
    setXa(nm);
    Object.keys(TRUC).forEach((r) => {
      const inst = run('(function(){ return xbtMake(xbtData(xbtSpecs(' + (r === 'ALL' ? 'null' : JSON.stringify([r])) + ')), ' + JSON.stringify(r === 'ALL' ? 'xa-4truc' : 'xa-' + r) + '); })()'), T = inst.test, d = T.defFor();
      if (d.blocks.length !== NB[r] || d.blocks.some((b) => b.bad || TRUC[r].indexOf(b.ef) < 0) || d.rings.some((x) => TRUC[r].indexOf(x[0]) < 0) || d.rings.length !== 0) bad.push(nm + ' ' + r);
      /* T1: ô số trong khối không phải chính một phần của biểu đồ đặt cùng màn (cùng bản ghi, cùng số) */
      const parts = [];
      d.blocks.forEach((b) => { if (b.t !== 'bd') return; const e = inst.BY[b.ef], c = e.charts[b.c]; if (c.loai === 'xu') return; const mine = [];
        (c.items || []).forEach((x) => { if (x.v == null) return; const kk = b.ef + '|' + String(e.rid(x.recs)) + '|' + x.v; if (parts.indexOf(kk) >= 0) t1.push(nm + ' ' + r + ' biểu đồ ' + b.ef + '#' + b.c + ' lặp ' + x.l); mine.push(kk); }); parts.push.apply(parts, mine); });
      /* ô đếm «Dòng số liệu» và biểu đồ đếm dòng không đặt ở màn ngoài mặc định (16/11/2026) */
      d.blocks.forEach((b) => { const e = inst.BY[b.ef]; if ((b.t === 'so' && [b.m].concat(b.s).indexOf('dong') >= 0) || (b.t === 'bd' && /^Dòng số liệu theo/.test(e.charts[b.c].t))) t1.push(nm + ' ' + r + ' khối đếm dòng ' + b.ef); });
      d.blocks.forEach((b) => { if (b.t !== 'so') return; const e = inst.BY[b.ef]; [b.m].concat(b.s).forEach((id) => { const k = T.gm(b.ef, id), v = k.vals[k.vals.length - 1]; if (v != null && parts.indexOf(b.ef + '|' + String(e.rid(k.recs)) + '|' + v) >= 0) t1.push(nm + ' ' + r + ' ' + id); }); });
    });
  });
  ok(bad.length === 0, 'tab trục: mặc định đủ khối, chỉ eform của trục, không khối lỗi: ' + bad.slice(0, 5).join(', '));
  ok(t1.length === 0, 'tab trục: ô số không lặp lại phần của biểu đồ cùng màn (T1): ' + t1.slice(0, 5).join(', '));
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
  ok(v.rings.length === 0 && v.blocks.filter((b) => b.ef === 'xa_hcc' && b.m === 'tuyen').length === 1, 'số nổi bật đã lưu thành khối; lặp thì chỉ giữ một khối (T1)');
  const v2 = T.valid({ rings: [['xa_hcc', 'tuyen']], blocks: [{ t: 'so', ef: 'xa_hcc', m: 'tuyen', s: [] }, { t: 'bd', ef: 'xa_qlvb', c: 0 }, { t: 'bd', ef: 'xa_qlvb', c: 0 }, { t: 'so', ef: 'xa_hcc', m: 'tt', s: ['tuyen', 'tt', 'dh'] }] });
  ok(v2.blocks.length === 3 && v2.blocks[0].m === 'tuyen' && v2.blocks[0].z === 's' && v2.blocks[1].t === 'bd' && v2.blocks[2].m === 'tt' && v2.blocks[2].s.join() === 'dh', 'khối lặp số nổi bật, biểu đồ, số phụ đã có ở chỗ khác thì bỏ (T1)');
  ok(v.blocks.filter((b) => !(b.ef === 'xa_hcc' && b.m === 'tuyen')).every((b) => b.bad), 'chỉ tiêu, eform, biểu đồ không còn trong bản đọc thì đánh dấu khối (không hiện số sai)');
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
  ok(run('XBT.scrollTo') === run('(function(t){ return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim(); })(' + JSON.stringify(e.nhom[0].l) + ')'), 'mở màn nhóm: cuộn tới khung của nhóm đó');
  run('XBT.scrollTo = null');
  const nhCards = h.split('<section class="acard').filter((x) => e.nhom.some((g) => x.indexOf('<h3 class="st-t">' + g.l.replace(/&/g, '&amp;')) >= 0));
  ok(nhCards.length > 0 && nhCards.every((x) => !/class="dl-v"[^>]*>[^<]*%</.test(x)), 'khung nhóm Kinh tế xã hội không ghi % cho số «Ước thực hiện»');
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
  const h3 = it3.ef(it3.EFS.find((x) => x.ef === 'xa_ktxh')), row = (h3.match(/<(div|button)[^>]*title="Dòng thử không khóa[^"]*"[^>]*>/) || [''])[0];
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

console.log('== Kéo thả đổi chỗ (chế độ tùy chỉnh)');
{
  setXa('Xã Sơn Đồng');
  const it = make('xa-keo'), T = it.test, d = T.defFor();
  T.setL(JSON.parse(JSON.stringify(d)));
  const sig = (b) => b.t + '|' + b.ef + '|' + (b.t === 'bd' ? b.c : b.m) + '|' + b.z, B = d.blocks.map(sig), R = d.rings.map((r) => r.join(':'));
  const nowB = () => T.L().blocks.map(sig);
  const nowR = () => T.L().rings.map((r) => r.join(':'));
  T.moveTo('b', 0, 2);
  ok(JSON.stringify(nowB()) === JSON.stringify([B[1], B[0]].concat(B.slice(2))), 'khối đầu thả trước khối thứ ba: đứng thứ hai');
  T.setL(JSON.parse(JSON.stringify(d)));
  T.moveTo('b', 0, B.length);
  ok(JSON.stringify(nowB()) === JSON.stringify(B.slice(1).concat([B[0]])), 'thả vào «Thêm khối»: về cuối');
  T.setL(JSON.parse(JSON.stringify(d)));
  if (run('XBT_RINGS')) { T.moveTo('r', R.length - 1, 0); ok(JSON.stringify(nowR()) === JSON.stringify([R[R.length - 1]].concat(R.slice(0, -1))), 'số nổi bật cuối thả lên đầu'); }
  T.setL(JSON.parse(JSON.stringify(d)));
  ok(!T.moveTo('b', 1, 1) && !T.moveTo('b', 1, 2) && !T.moveTo('r', 0, 99), 'thả tại chỗ hoặc ngoài danh sách: không đổi');
  ok(JSON.stringify(nowB()) === JSON.stringify(B) && JSON.stringify(nowR()) === JSON.stringify(R), 'bố cục giữ nguyên khi thả không đổi chỗ');
  ok(it.home().indexOf('data-dg=') < 0, 'ngoài chế độ tùy chỉnh: không kéo được');
}

console.log('== Màn eform «Hiện hết» (14/11/2026)');
['Xã Sơn Đồng', 'Phường Việt Hưng', 'Xã Ba Vì'].forEach((nm) => {
  setXa(nm);
  const it = make('modal');
  let bad = [], dup = [], noCard = [], clicks = [];
  it.EFS.forEach((e) => {
    run('XBT.curEf = ' + JSON.stringify(e.sid));
    let h = '';
    try { h = it.ef(e); } catch (er) { bad.push(e.ef + ': ' + er.message); return; }
    if (/data-sel=|data-kind=|data-allk=/.test(h)) clicks.push(e.ef);
    const L = it.test.efLast(), seen = new Set();
    L.shown.forEach((k) => { if (seen.has(k)) dup.push(e.ef + ' ' + k); seen.add(k); });
    if (!L.cards && !/chưa có số/.test(h)) noCard.push(e.ef);
  });
  run('XBT.curEf = null');
  ok(!bad.length, nm + ': dựng được màn eform cả 12 eform ' + bad.slice(0, 3).join('; '));
  ok(!clicks.length, nm + ': không còn danh sách chọn, nút kiểu hình, nút «Xem đủ ô số» ' + clicks.join(','));
  ok(!dup.length, nm + ': một số (cùng bản ghi, cùng giá trị) chỉ hiện một chỗ trên màn eform (T1) ' + dup.slice(0, 3).join('; '));
  ok(!noCard.length, nm + ': eform có số thì có biểu đồ ' + noCard.join(','));
});
{
  setXa('Xã Sơn Đồng');
  const it = make('modal'), e = it.EFS.find((x) => x.ef === 'xa_tcns');
  run('XBT.curEf = ' + JSON.stringify(e.sid));
  const h = it.ef(e);
  run('XBT.curEf = null');
  ok(/class="v"[^>]*>[\d,]+ tỷ/.test(h) && !/class="v"[^>]*>\d{1,3}(\.\d{3}){3}/.test(h), 'ô số tiền lớn ghi gọn «… tỷ», không ghi đủ chữ số');
  ok(/title="[^"]*\d{1,3}(\.\d{3}){3}/.test(h), 'rê chuột vẫn thấy số đủ');
  ok(!/data-r="[^"]*"[^>]*class="stat"|class="stat"[^>]*data-r=/.test(h), 'ô số không bấm (T2)');
}

console.log('== Bỏ nút «Bố cục cũ» (14/11/2026)');
{
  setXa('Xã Sơn Đồng');
  const it = make();
  ok(it.home().indexOf('data-xbtold') < 0, 'màn ngoài không có nút «Bố cục cũ»');
  /* màn eform: nút nằm ở lớp bọc ctmScreenHtml, nên kiểm đúng chỗ đó */
  const sid = it.EFS[0].sid;
  let hm = '';
  try { hm = run('CTM_UI.id=' + JSON.stringify(sid) + ';CTM_UI.screen="home";CTM_UI.group=null;ctmScreenHtml(CTM_SPECS[' + JSON.stringify(sid) + '])'); } catch (er) { console.log('   ', er.message); }
  ok(hm.indexOf('xbt-modal') >= 0, 'màn eform dựng bằng bố cục mới (lớp bọc ctmScreenHtml)');
  ok(hm.indexOf('data-xbtold') < 0 && hm.indexOf('Bố cục cũ') < 0, 'màn eform (cả lớp bọc) không có nút «Bố cục cũ»');
  run('XBT.curEf = null');
  /* tài khoản đã chọn bố cục cũ trước 14/11: vẫn xem bố cục mới, lựa chọn cũ bị xóa */
  run('globalThis.__ls = { "ioc-xbt-mode:guest": "cu" }; globalThis.localStorage = { getItem: function (k) { return k in __ls ? __ls[k] : null; }, setItem: function (k, v) { __ls[k] = String(v); }, removeItem: function (k) { delete __ls[k]; } }');
  ok(run('xbtMode()') === 'moi', 'tài khoản đã lưu «bố cục cũ» vẫn xem bố cục mới');
  ok(run('"ioc-xbt-mode:guest" in __ls') === false, 'lựa chọn «bố cục cũ» đã lưu bị xóa (bật lại cờ cũng không tự quay về)');
  run('delete globalThis.localStorage; delete globalThis.__ls');
}

console.log('== Ẩn ô «Dòng số liệu» (16/11/2026)');
{
  setXa('Xã Sơn Đồng');
  const it = make(), T = it.test;
  ok(T.ringPool(-1).every((x) => !/:dong$/.test(x.key)), 'hộp chọn số của màn ngoài không có ô «Dòng số liệu»');
  ok(T.ringPool(-1).some((x) => x.ef === 'xa_yte' && x.dong), 'Y tế vẫn chọn được chỉ tiêu xã nhập');
  const dg = run('(function(){ return xbtMake(xbtData(xbtSpecs(["DANG"])), "xa-DANG"); })()');
  ['xa_dang', 'xa_hdnd'].forEach((ef) => { const e = it.BY[ef]; run('XBT.curEf = ' + JSON.stringify(e.sid)); const h = it.ef(e); run('XBT.curEf = null');
    ok(e.charts.some((c) => c.dem) && !/data-t="dong so lieu theo/.test(h), ef + ': màn eform không có biểu đồ đếm dòng «Dòng số liệu theo …»'); });
  ok(it.BY.xa_dang.charts.every((c, j) => !c.dem || T.valid({ rings: [], blocks: [{ t: 'bd', ef: 'xa_dang', c: j }] }).blocks[0].bad), 'biểu đồ đếm dòng không chọn được ở màn ngoài');
  ok(dg.home().indexOf('mũi tên') < 0, 'tab Đảng ủy chỉ có biểu đồ: không nhắc mũi tên so kỳ');
  ok(make().home().indexOf('mũi tên') >= 0, 'tab «Tất cả» có ô số: vẫn giải thích mũi tên');
  run('XBT.curEf = null');
  ['xa_yte', 'xa_dang', 'xa_gd', 'xa_hdnd', 'xa_vh', 'xa_nv'].forEach((ef) => {
    const e = it.BY[ef]; run('XBT.curEf = ' + JSON.stringify(e.sid)); const h = it.ef(e); run('XBT.curEf = null');
    ok(h.indexOf('>Dòng số liệu<') < 0, ef + ': màn eform không có ô «Dòng số liệu»');
    const nK = e.kpis.filter((k) => k.id !== 'dong').length;
    ok(nK ? h.indexOf('class="stats"') >= 0 && h.indexOf('mũi tên') >= 0 : h.indexOf('class="stats"') < 0 && h.indexOf('mũi tên') < 0, ef + ': ' + (nK ? 'còn ô số, còn lời giải thích mũi tên' : 'không còn ô số: không có hàng ô số, không nhắc mũi tên'));
    ok(h.indexOf('acard') >= 0, ef + ': vẫn đủ biểu đồ');
  });
}

console.log('== «Tùy chỉnh» ở tab từng trục (lỗi 16/11/2026: tab trục bấm không được)');
{
  setXa('Xã Sơn Đồng');
  ['DANG', 'HDND', 'UBND', 'MTTQ'].forEach((r) => {
    const it = run('(function(){ return xbtMake(xbtData(xbtSpecs([' + JSON.stringify(r) + '])), ' + JSON.stringify('xa-' + r) + '); })()'), T = it.test;
    T.setEdit(true); let h = '', er = '';
    try { h = it.home(); } catch (e) { er = e.message; }
    ok(!er && h.indexOf('data-ed="off"') >= 0 && h.indexOf('data-add') >= 0, r + ': bấm «Tùy chỉnh» mở được màn tùy chỉnh' + (er ? ' (' + er + ')' : ''));
    ok(T.ringPool(-1).length > 0 && T.ringPool(-1).every((x) => it.BY[x.ef]), r + ': hộp chọn số chỉ có eform của trục');
  });
}

console.log('== Bỏ hàng «Số nổi bật» (16/11/2026)');
{
  setXa('Xã Sơn Đồng');
  const it = make(), T = it.test;
  T.setL(T.defFor());
  ok(it.home().indexOf('class="rings"') < 0, 'màn ngoài không có hàng Số nổi bật');
  T.setEdit(true);
  const he = it.home();
  ok(he.indexOf('data-radd') < 0 && he.indexOf('Số nổi bật') < 0 && he.indexOf('data-add') >= 0, 'đang tùy chỉnh: không có «＋ Thêm số», vẫn có «＋ Thêm khối»');
  T.setEdit(false);
  ok(it.home().split('class="vcard').length - 1 === 12 && (it.home().match(/class="vch vring"/g) || []).length === 2, 'tab «Tất cả»: 12 khối, 2 khối vẽ vòng tỷ lệ');
  const hv = it.home(), c0 = hv.slice(hv.indexOf('class="vcard'), hv.indexOf('class="vcard', hv.indexOf('class="vcard') + 5));
  ok(c0.indexOf('vring') >= 0 && c0.indexOf('tc-num') < 0 && c0.indexOf('kchip') >= 0, 'khối Vòng tỷ lệ: số chỉ nằm giữa vòng, không in lại bên cạnh (T1)');
  /* bố cục đã lưu có 3 ô Số nổi bật: thành 3 khối cỡ Nhỏ ở đầu, giữ thứ tự, số % vẽ vòng */
  const v = T.valid({ rings: [['xa_gpmb', 'tlBg'], ['xa_hcc', 'tuyen'], ['xa_tcns', 'tlThu']], blocks: [{ t: 'bd', ef: 'xa_qlvb', c: 0, z: 'm' }] });
  ok(v.rings.length === 0 && v.blocks.length === 4 && v.blocks.slice(0, 3).map((b) => b.m + ':' + b.z + ':' + b.h).join() === 'tlBg:s:vong,tuyen:s:so,tlThu:s:vong' && v.blocks[3].t === 'bd', 'bố cục đã lưu: mỗi ô Số nổi bật thành khối Nhỏ đầu màn, không mất số');
  /* rà soát 16/11: ô chuyển thành khối không đẩy khối của người dùng ra ngoài giới hạn 30 khối */
  const many = Array.from({ length: 30 }, (_, i) => ({ t: 'so', ef: 'xa_khong' + i, m: 'x' }));
  const vm4 = T.valid({ rings: [['xa_tcns', 'tlThu'], ['xa_tcns', 'tlChi'], ['xa_gpmb', 'tlTh'], ['xa_gpmb', 'tlBg']], blocks: many });
  ok(vm4.blocks.length === 34 && vm4.blocks[33].ef === 'xa_khong29', 'bố cục đã lưu 4 ô + 30 khối: giữ đủ 30 khối của người dùng');
  ok(T.valid(JSON.parse(JSON.stringify(vm4))).blocks.length === 34, 'lưu lại rồi đọc lại: vẫn đủ khối');
  /* ô của eform tài khoản không xem được, chỉ tiêu không còn: bỏ lặng lẽ như hàng Số nổi bật cũ, không thành khối lỗi */
  const ivD = run('(function(){ return xbtMake(xbtData(xbtSpecs(["DANG"])), "xa-DANG"); })()');
  const vD = ivD.test.valid({ rings: [['xa_tcns', 'tlThu'], ['xa_gpmb', 'tlTh']], blocks: [{ t: 'bd', ef: 'xa_dang', c: 1, z: 'l' }] });
  ok(vD.blocks.length === 1 && !vD.blocks.some((b) => b.bad), 'tab Đảng ủy dán bố cục có ô eform khác: bỏ ô đó, không hiện khối lỗi');
  ok(T.valid({ rings: [['xa_hcc', 'khong_co']], blocks: [] }).blocks.length === 0, 'ô có chỉ tiêu không còn trong eform: bỏ');
  /* ô số không phải % giữ thanh nhỏ so số cùng nhóm như ô cũ */
  const vS = T.valid({ rings: [['xa_hcc', 'tuyen']], blocks: [] });
  ok(vS.blocks[0].sib === 1 && vS.blocks[0].h === 'so', 'ô số không phải % thành khối «Chỉ số kỳ đang xem» kèm so số cùng nhóm');
  T.setL(vS);
  ok(!T.sibOf('xa_hcc', 'tuyen') || it.home().indexOf('class="msib"') >= 0, 'khối đó vẽ thanh nhỏ so số cùng nhóm');
  ok(T.valid({ rings: [], blocks: [{ t: 'so', ef: 'xa_hcc', m: 'tuyen', s: [], h: 'so', z: 's' }] }).blocks[0].sib === undefined, 'khối người dùng tự thêm: không tự thêm thanh so');
  /* bố cục mặc định: gộp theo eform, mọi bộ số nổi bật mặc định đều chuyển được (không riêng 4 vòng tab «Tất cả») */
  const g = T.ringsToBlocks([['xa_tcns', 'tlThu'], ['xa_hcc', 'tuyen'], ['xa_tcns', 'tlChi']], true);
  ok(g.length === 2 && g[0].m === 'tlThu' && g[0].s.join() === 'tlChi' && g[0].h === 'vong' && g[0].z === 'm' && g[1].m === 'tuyen' && g[1].h === 'so', 'số nổi bật mặc định: số cùng eform, cùng kiểu gộp một khối Vừa');
  /* khối Vòng tỷ lệ: số có trong aria-label, title; không tải được thư viện vẽ thì hiện số (data-fb) */
  T.setL(T.defFor());
  const hR = it.home(), m0 = hR.match(/<div class="vch vring" data-fb="([^"]+)"[^>]*aria-label="([^"]+)"/);
  ok(m0 && /%$/.test(m0[1]) && m0[2].indexOf(m0[1]) > 0, 'khối Vòng tỷ lệ: aria-label có số, có số dự phòng khi không vẽ được vòng');
}

console.log('== Hàng «Số nổi bật» khi bật lại cờ XBT_RINGS (giữ trong code, kiểm để bật lại không lỗi)');
{
  const runR = boot((f, src) => (f === 'js/features/ctm-xa-bangtin.js' ? src.replace('const XBT_RINGS = false;', 'const XBT_RINGS = true;') : src));
  ok(runR('XBT_RINGS') === true, 'đã bật cờ trong môi trường kiểm thử riêng');
  runR('currentXaId=' + JSON.stringify(String(names.indexOf('Xã Sơn Đồng'))));
  const it = runR('(function(){ return xbtMake(xbtData(xbtSpecs(null)), "xa-4truc"); })()'), T = it.test, d = T.defFor();
  ok(d.rings.map((r) => r.join(':')).join() === 'xa_tcns:tlThu,xa_tcns:tlChi,xa_gpmb:tlTh,xa_gpmb:tlBg' && d.blocks[0].ef === 'xa_hcc', 'mặc định: 4 vòng tỷ lệ ở hàng Số nổi bật, khối giữ như cũ');
  const pool = T.ringPool(-1).map((x) => x.key.split(':'));
  const v = T.valid({ rings: Array.from({ length: 20 }, () => ['xa_hcc', 'tuyen']).concat(pool.slice(0, 20)), blocks: [] });
  ok(v.rings.length <= 12 && v.rings.filter((r) => r.join(':') === 'xa_hcc:tuyen').length === 1, 'số nổi bật tối đa 12 ô, lặp thì giữ một (T1)');
  T.setL(JSON.parse(JSON.stringify(d)));
  const R = d.rings.map((r) => r.join(':')), nowR = () => T.L().rings.map((r) => r.join(':'));
  T.moveTo('r', R.length - 1, 0);
  ok(JSON.stringify(nowR()) === JSON.stringify([R[R.length - 1]].concat(R.slice(0, -1))), 'số nổi bật cuối thả lên đầu');
  T.setL(JSON.parse(JSON.stringify(d)));
  runR('document.querySelector = function () { return null; }');
  T.setEdit(true); it.click({ target: { closest: (sel) => (sel === '[data-rmv]' ? { getAttribute: () => '0,1' } : null) } }); T.setEdit(false);
  ok(JSON.stringify(nowR()) === JSON.stringify([R[1], R[0]].concat(R.slice(2))), 'nút →: ô số đầu sang phải một ô');
  T.setL(JSON.parse(JSON.stringify(d)));
  ok(it.home().indexOf('class="rings"') >= 0, 'màn ngoài có hàng Số nổi bật');
  T.setEdit(true); ok(it.home().indexOf('data-radd') >= 0, 'đang tùy chỉnh: có «＋ Thêm số»'); T.setEdit(false);
}

console.log('== Kéo thả trên trình duyệt (phần tử giả lập)');
{
  setXa('Xã Sơn Đồng');
  run('globalThis.__t = []; globalThis.setTimeout = function (f) { __t.push(f); return 0; }; document.querySelector = function () { return null; }');
  const it = make('xa-keo2'), T = it.test, d = T.defFor();
  T.setL(JSON.parse(JSON.stringify(d)));
  const sig = (b) => b.t + '|' + b.ef + '|' + (b.t === 'bd' ? b.c : b.m), B = d.blocks.map(sig), nowB = () => T.L().blocks.map(sig);
  const outside = { closest: () => null };
  const root = { contains: (x) => x !== outside };
  const mk = (dg, rect, pw) => { const cls = new Set(), el = { cls, getAttribute: (n) => (n === 'data-dg' ? dg : null), classList: { add: (c) => cls.add(c), remove: (...c) => c.forEach((x) => cls.delete(x)) },
    getBoundingClientRect: () => rect, parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: pw, height: 2000 }) } };
    el.closest = (sel) => (sel === '[data-dg]' ? el : sel === '[id^="xbt-host-"]' ? root : null); return el; };
  const types = [];
  const ev = (type, target, x, y) => ({ type, target, clientX: x, clientY: y, prevented: false, preventDefault() { this.prevented = true; }, dataTransfer: { setData: (t) => types.push(t) } });
  /* vào chế độ tùy chỉnh */
  it.click({ target: { closest: (sel) => (sel === '[data-ed]' ? { getAttribute: () => 'on' } : null) } });
  ok(it.editing(), 'vào được chế độ tùy chỉnh');
  const A = mk('b,0', { left: 0, top: 0, width: 600, height: 200 }, 1212), Bk = mk('b,1', { left: 614, top: 0, width: 600, height: 200 }, 1212), W = mk('b,2', { left: 0, top: 220, width: 1212, height: 200 }, 1212);
  ok(it.drag(ev('dragstart', A, 10, 10)) === true, 'bắt đầu kéo khối');
  ok(types.length === 1 && types[0] !== 'text/plain', 'dữ liệu kéo không phải chữ thường (thả nhầm vào ô nhập chữ không dán «b0»)');
  const o1 = ev('dragover', Bk, 1100, 50); it.drag(o1);
  ok(o1.prevented && Bk.cls.has('dg-af') && !Bk.cls.has('dg-v'), 'ô nửa hàng: nửa phải là đặt sau, vạch ở mép phải');
  const o2 = ev('dragover', outside, 0, 0); it.drag(o2);
  ok(!o2.prevented && Bk.cls.size === 0, 'rê ra khe, ra ngoài: xóa vạch, không nhận thả');
  const o3 = ev('dragover', W, 1100, 240); it.drag(o3);
  ok(W.cls.has('dg-b4') && W.cls.has('dg-v'), 'ô hết bề ngang (màn hẹp, khối Rộng): xét trên/dưới, nửa trên là đặt trước dù con trỏ lệch phải');
  it.drag(ev('drop', W, 1100, 400));
  ok(JSON.stringify(nowB()) === JSON.stringify([B[1], B[2], B[0]].concat(B.slice(3))), 'thả nửa dưới ô hết bề ngang: đặt sau ô đó');
  it.drag(ev('dragend', A, 0, 0));
  run('__t.splice(0).forEach(function (f) { f(); })');
  ok(!A.cls.has('dg-src') && W.cls.size === 0, 'kéo xong: không còn ô mờ, không còn vạch (kể cả khi lệnh làm mờ chạy sau)');
  /* kéo bị hủy ngay (Esc): lệnh làm mờ chạy sau dragend thì không làm mờ */
  T.setL(JSON.parse(JSON.stringify(d)));
  const A2 = mk('b,0', { left: 0, top: 0, width: 600, height: 200 }, 1212);
  it.drag(ev('dragstart', A2, 10, 10)); it.drag(ev('dragend', A2, 0, 0)); run('__t.splice(0).forEach(function (f) { f(); })');
  ok(!A2.cls.has('dg-src'), 'kéo bị hủy ngay: ô không bị mờ kẹt');
  /* nút ↑ ↓ ← → dùng chung moveTo */
  const btn = (attr, v) => ({ target: { closest: (sel) => (sel === attr ? { getAttribute: () => v } : null) } });
  T.setL(JSON.parse(JSON.stringify(d)));
  it.click(btn('[data-mv]', '0,1'));
  ok(JSON.stringify(nowB()) === JSON.stringify([B[1], B[0]].concat(B.slice(2))), 'nút ↓: khối đầu xuống thứ hai');
  it.click(btn('[data-mv]', '1,-1'));
  ok(JSON.stringify(nowB()) === JSON.stringify(B), 'nút ↑: về chỗ cũ');
  const R = d.rings.map((r) => r.join(':'));
  if (run('XBT_RINGS')) { it.click(btn('[data-rmv]', '0,1')); ok(JSON.stringify(T.L().rings.map((r) => r.join(':'))) === JSON.stringify([R[1], R[0]].concat(R.slice(2))), 'nút →: ô số đầu sang phải một ô'); }
  it.click(btn('[data-mv]', '0,-1'));
  ok(JSON.stringify(nowB()) === JSON.stringify(B), 'nút ↑ ở khối đầu: không đổi');
  run('globalThis.setTimeout = function () { return 0; }; delete globalThis.__t');
}

console.log('== Kéo thả: khe giữa hai ô, dragenter, gợi ý một chỗ (14/11/2026)');
{
  setXa('Xã Sơn Đồng');
  run('globalThis.setTimeout = function () { return 0; }; document.querySelector = function () { return null; }');
  const it = make('xa-keo3'), T = it.test, d = T.defFor();
  T.setL(JSON.parse(JSON.stringify(d)));
  const sig = (b) => b.t + '|' + b.ef + '|' + (b.t === 'bd' ? b.c : b.m), B = d.blocks.map(sig), nowB = () => T.L().blocks.map(sig);
  const root = { contains: () => true };
  const cards = [];
  const grid = { querySelectorAll: () => cards };
  const mk = (dg, rect) => { const cls = new Set(), el = { cls, getAttribute: (n) => (n === 'data-dg' ? dg : null), classList: { add: (c) => cls.add(c), remove: (...c) => c.forEach((x) => cls.delete(x)) },
    getBoundingClientRect: () => rect, parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1214, height: 2000 }) } };
    el.closest = (sel) => (sel === '[data-dg]' ? el : sel === '[id^="xbt-host-"]' ? root : sel === '.bgrid' ? grid : null); return el; };
  const A = mk('b,0', { left: 0, top: 0, right: 600, bottom: 200, width: 600, height: 200 });
  const C = mk('b,2', { left: 614, top: 0, right: 1214, bottom: 200, width: 600, height: 200 });
  cards.push(A, C);
  /* khe 14px giữa hai ô: phần tử dưới con trỏ là chính lưới */
  const gap = { closest: (sel) => (sel === '.bgrid' ? grid : null) };
  const ev = (type, target, x, y) => ({ type, target, clientX: x, clientY: y, prevented: false, preventDefault() { this.prevented = true; }, dataTransfer: { setData: () => {} } });
  it.click({ target: { closest: (sel) => (sel === '[data-ed]' ? { getAttribute: () => 'on' } : null) } });
  const h = it.home();
  ok(h.indexOf('data-dg=') >= 0, 'chế độ tùy chỉnh: ô kéo được');
  ok(h.indexOf('Kéo thả để đổi chỗ') < 0 && h.indexOf('title="Kéo để đổi chỗ"') >= 0, 'gợi ý kéo chỉ ở tay nắm, không gắn cho cả ô');
  it.drag(ev('dragstart', A, 10, 10));
  const en = ev('dragenter', C, 1100, 50); it.drag(en);
  ok(en.prevented, 'dragenter trên ô đích được chặn mặc định (Safari nhận thả)');
  const g1 = ev('dragover', gap, 610, 100); it.drag(g1);
  ok(g1.prevented && C.cls.has('dg-b4'), 'rê vào khe trước ô thứ ba: vạch hiện ở mép trước ô đó, nhận thả');
  it.drag(ev('drop', gap, 610, 100));
  ok(JSON.stringify(nowB()) === JSON.stringify([B[1], B[0]].concat(B.slice(2))), 'thả vào khe trước ô thứ ba: khối đầu đứng ngay trước ô đó');
  T.setL(JSON.parse(JSON.stringify(d)));
  it.drag(ev('dragstart', A, 10, 10));
  const far = ev('dragover', gap, 607, 400); it.drag(far);
  ok(!far.prevented, 'xa mọi ô (quá 24px): không nhận thả');
  it.drag(ev('dragend', A, 0, 0));
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
