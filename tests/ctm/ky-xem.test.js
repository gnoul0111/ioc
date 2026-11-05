'use strict';
/* Kiểm thử chọn kỳ xem của chỉ tiêu theo eform (ctm-eform.js, 03/11/2026): Tháng · Quý · Năm · Lũy kế · Khoảng · So nhiều kỳ.
   Chặn tái phát:
     1. danh sách kỳ viết cứng (không theo bản ghi);
     2. lũy kế, khoảng tính khác kỳ Năm, Quý (cùng bản ghi phải ra cùng số);
     3. bản ghi quý, năm vắt qua mép khoảng bị tính vào khoảng;
     4. Khoảng, So nhiều kỳ còn thẻ so sánh kỳ trước; So nhiều kỳ cộng các kỳ;
     5. màn nào đó không dựng được ở kiểu kỳ mới.
   Chạy: node tests/ctm/ky-xem.test.js */
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
  'js/core/eform-khung.js', 'js/core/eform-mau.js', 'js/features/ctm-eform.js', 'js/features/ctm-truc-eform.js', 'js/features/ctm-so-eform.js', 'js/features/ctm-so-eform2.js', 'js/features/ctm-xa-eform.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, Set, esc: escFn, document: { getElementById: () => null } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const S = run('CTM_SPECS'), CFG = run('EF_CFG');
const TP = Object.keys(S).filter((k) => S[k].efDonVi && S[k].level !== 'xa'), XS = Object.keys(S).filter((k) => S[k].efDonVi && S[k].level === 'xa');
const J = JSON.stringify;
const ui = (o) => run(Object.keys(o).map((k) => 'CTM_UI.' + k + '=' + J(o[k])).join(';'));
const D = (id, p) => run('ctmD(CTM_SPECS[' + J(id) + '],' + J(p) + ')') || {};
const same = (a, b) => { const ks = Object.keys(a).concat(Object.keys(b)).filter((k, i, x) => x.indexOf(k) === i && k.indexOf('_d') < 0); return ks.every((k) => (a[k] == null ? null : a[k]) === (b[k] == null ? null : b[k])); };
const scr = (id, sc, g) => run('CTM_UI.id=' + J(id) + ';CTM_UI.screen=' + J(sc) + ';CTM_UI.group=' + J(g || null) + ';CTM_UI.xa.sel=null;CTM_UI.rec={f:"all",q:"",key:null,ef:null};ctmScreenHtml(CTM_SPECS[' + J(id) + '])');
const screens = (id) => ['home', 'rec'].concat(S[id].xa ? ['xa'] : []).map((sc) => [sc, null]).concat((S[id].groups || []).map((g) => ['group', g.id]));
const loi = (h) => /Không dựng được màn hình/.test(h);

const check = (id, tag) => {
  const s = S[id];
  ui({ id: id, kyMode: null, gran: 'quy', period: null, screen: 'home', dd: null });
  /* 1. kỳ sinh từ bản ghi: kỳ mới nhất không quá tháng có bản ghi cuối cùng */
  const rng = run('efRange')(s.kyDef);
  ok(rng.lo <= rng.hi, tag + ': khoảng tháng có bản ghi hợp lệ');
  ['thang', 'quy', 'nam'].forEach((g) => { ui({ gran: g }); ok(s.periods.length > 0 && s.periods.every((p) => run('efKySpan')(p.id)), tag + ': danh sách kỳ ' + g + ' sinh được'); });
  ui({ gran: 'quy' });
  const Y = s.kyDef.kyTu ? 2026 : 2025;
  /* 2. Lũy kế đến T12 = Năm; lũy kế đến T3 = Quý 1; khoảng Q1–Q4 = Năm (cùng bản ghi, cùng cách lấy) */
  ui({ kyMode: null, gran: 'nam' }); const dN = D(id, String(Y));
  ui({ kyMode: 'lk', gran: 'thang' }); const dL = D(id, 'LK:' + Y + '-12'), dL3 = D(id, 'LK:2026-03');
  ok(same(dN, dL), tag + ': Lũy kế T1–T12/' + Y + ' bằng Năm ' + Y);
  ui({ kyMode: null, gran: 'quy' }); const dQ1 = D(id, '2026Q1');
  ok(same(dL3, dQ1), tag + ': Lũy kế T1–T3/2026 bằng Quý 1/2026');
  ui({ kyMode: 'khoang', gran: 'quy', period: 'K:' + Y + 'Q1~' + Y + 'Q4' }); const dK = D(id, 'K:' + Y + 'Q1~' + Y + 'Q4');
  ok(same(dN, dK), tag + ': Khoảng Q1–Q4/' + Y + ' bằng Năm ' + Y);
  ui({ kyMode: null, gran: 'quy' }); const QS = s.periods.map((p) => p.id), kq = 'K:' + QS[Math.min(3, QS.length - 1)] + '~' + QS[0];
  ui({ kyMode: 'khoang', gran: 'quy', period: kq });
  ok(s.periods[0].id === kq && run('ctmCurPid(CTM_SPECS[' + J(id) + '])') === kq, tag + ': Khoảng đang xem có trong danh sách kỳ (' + kq + ')');
  /* 3. bản ghi vắt qua mép khoảng không tính: khoảng T2–T4 không lấy bản quý, bản năm */
  ui({ kyMode: 'khoang', gran: 'thang', period: 'K:2026-02~2026-04' });
  s.kyDef.eforms.forEach((c) => { const P = run('efPick')(c, 'K:2026-02~2026-04'); ok(P.cand.every((R) => R._ky && R._ky.loai === 'thang' && R._ky.y === 2026 && R._ky.m >= 2 && R._ky.m <= 4) || run('efKhongKy')(c.ef), tag + ' ' + c.ef + ': khoảng T2–T4/2026 chỉ lấy bản tháng 2–4'); });
  /* 4. Khoảng: không có kỳ so sánh, không có mũi tên so sánh */
  const n = run('ctmNP(CTM_SPECS[' + J(id) + '])');
  ok(n.pp == null, tag + ': Khoảng không có kỳ so sánh');
  const hk = scr(id, 'home');
  ok(!/so (tháng|quý|năm) trước|so cùng kỳ/.test(hk), tag + ': Khoảng: màn tổng quan không ghi so kỳ trước');
  /* Lũy kế: so cùng kỳ năm trước */
  ui({ kyMode: 'lk', gran: 'thang', period: null });
  const lk = s.periods[0].id, lkT = 'LK:' + (Number(lk.slice(3, 7)) - 1) + lk.slice(7);
  ui({ period: lk });
  const nl = run('ctmNP(CTM_SPECS[' + J(id) + '])');
  ok(nl.p === lk && (nl.pp === lkT || (nl.pp == null && !s.periods.some((p) => p.id === lkT))), tag + ': ' + lk + ' so cùng kỳ năm trước ' + lkT);
  /* So nhiều kỳ: các kỳ đặt cạnh nhau, số mỗi cột là số của chính kỳ đó, không so sánh */
  const pick = [QS[0], QS[QS.length - 1], QS[Math.floor(QS.length / 2)]].filter((x, i, a) => a.indexOf(x) === i);
  ui({ kyMode: 'nhieu', gran: 'quy', kyDs: pick, period: null });
  const ds = run('CTM_SPECS[' + J(id) + '].multiPids()');
  ok(J(ds) === J(pick.slice().sort()), tag + ': So nhiều kỳ sắp kỳ tăng dần (' + J(ds) + ')');
  ok(run('CTM_UI.period') === QS[0], tag + ': kỳ xem chi tiết mặc định là kỳ sau cùng');
  ok(run('ctmNP(CTM_SPECS[' + J(id) + '])').pp == null, tag + ': So nhiều kỳ không có kỳ so sánh');
  const hm = scr(id, 'home');
  ok(/ctm-multi/.test(hm), tag + ': So nhiều kỳ: tổng quan có bảng các kỳ đặt cạnh nhau');
  const k0 = s.kpis[0];
  if (k0) {
    const v = run('ctmV(CTM_SPECS[' + J(id) + '],' + J(k0.m) + ',ctmD(CTM_SPECS[' + J(id) + '],' + J(ds[0]) + '))');
    ok(v == null || hm.indexOf(run('ctmFmtM(CTM_SPECS[' + J(id) + '],' + J(k0.m) + ',' + v + ')')) >= 0, tag + ': cột ' + ds[0] + ' là số của chính kỳ đó');
  }
  /* 5. mọi màn dựng được ở mọi kiểu kỳ */
  [{ kyMode: null, gran: 'thang', period: null }, { kyMode: 'lk', gran: 'thang', period: 'LK:2026-06' }, { kyMode: 'khoang', gran: 'thang', period: 'K:2026-04~2026-08' }, { kyMode: 'khoang', gran: 'nam', period: 'K:' + Y + '~2026' },
    { kyMode: 'nhieu', gran: 'thang', kyDs: ['2025-09', '2026-09'], period: null }, { kyMode: 'nhieu', gran: 'nam', kyDs: ['2025', '2026'], period: null }].forEach((st) => {
    ui(st);
    screens(id).forEach((x) => { const h = scr(id, x[0], x[1]); ok(!loi(h), tag + ' ' + J(st) + ' ' + x[0] + (x[1] ? ':' + x[1] : '') + ': dựng được màn'); });
    if (st.kyMode === 'nhieu') screens(id).filter((x) => x[0] === 'group').forEach((x) => { const h = scr(id, 'group', x[1]); ok(!/stc-legend|ctm-cmpline/.test(h) || /ctm-multi/.test(h), tag + ' ' + x[1] + ': So nhiều kỳ không còn thẻ so sánh kỳ này/kỳ trước'); });
  });
  /* bảng chọn kỳ dựng được ở cả 6 thẻ */
  ui({ kyMode: null, gran: 'quy', period: null, screen: 'home' });
  run('CTM_UI.kyNap=null');
  ['thang', 'quy', 'nam', 'lk', 'khoang', 'nhieu'].forEach((t) => { run('CTM_UI.dd="ky";CTM_UI.kyTab=' + J(t) + ';CTM_UI.kyNap={g:"quy",tu:"2026Q1",den:"2026Q3",ds:["2025Q3","2026Q3"]}'); const h = scr(id, 'home'); ok(/class="ctm-ky"/.test(h) && !loi(h), tag + ': bảng chọn kỳ, thẻ ' + t); });
  ui({ dd: null, kyMode: null, gran: 'quy', period: null });
};

console.log('== Cấp Thành phố: ' + TP.length + ' đơn vị theo eform');
TP.forEach((id) => check(id, id));
console.log('== Xã, phường');
['Phường Việt Hưng'].forEach((xa) => { setXa(xa); XS.forEach((id) => check(id, id + ' [' + xa + ']')); });
setXa(null);

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
if (fail) process.exitCode = 1;
