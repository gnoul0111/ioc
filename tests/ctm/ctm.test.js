'use strict';
/* Kiểm thử bộ chỉ tiêu khuôn mới dùng chung (ctm-) bằng Node, không cần trình duyệt:
   1. Số nền 126 xã, phường: đủ 51 phường + 75 xã, tổng dân số, diện tích, tên khớp danh mục eform.
   2. Từng đơn vị đã khai báo: mọi kỳ có số; mọi màn (Tổng quan, từng nhóm, theo 126 xã/phường với từng chỉ tiêu, khung hồ sơ)
      dựng được HTML, thẻ div cân bằng, không có "undefined"/"NaN", không lộ mã kỹ thuật trên chữ nhìn thấy.
   3. Riêng từng đơn vị: số các phần cộng lại khớp tổng, số 126 xã/phường cộng lại khớp số Thành phố.
   4. Màn ngoài của từng trục dựng được.
   Chạy: node tests/ctm/ctm.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: {} });
/* Số hồ sơ theo xã, phường của TT Phục vụ HCC cần danh sách 126 đơn vị (gdUnitData của dashboard-education.js, file đó cần DOM nên chỉ lấy mảng) */
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
/* Xã, phường đang xem: như login.js (currentXaId = số thứ tự trong wardNames()) */
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));
const XA_TEST = ['Phường Việt Hưng', 'Xã Ba Vì'];

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const balanced = (h) => (h.match(/<div\b/g) || []).length === (h.match(/<\/div>/g) || []).length;
const visible = (h) => h.replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
/* Mã kỹ thuật không được hiện trên giao diện: tên API/endpoint, MA_/IS_/HS_…, tên biến kiểu snake_case */
const TECH = /\b(API|endpoint|[A-Z]{2,}_[A-Z0-9_]+|[a-z]+_[a-z_]+)\b/;
const near = (a, b, eps) => Math.abs(a - b) <= (eps == null ? 1e-6 : eps);

console.log('== Số nền 126 xã, phường');
{
  const X = run('CTM_XA');
  ok(X.length === 126, '126 đơn vị (' + X.length + ')');
  ok(X.filter((u) => u.k === 'P').length === 51 && X.filter((u) => u.k === 'X').length === 75, '51 phường + 75 xã');
  ok(new Set(X.map((u) => u.name)).size === 126, 'tên không trùng');
  ok(run('CTM_POP') === 8818383, 'tổng dân số 8.818.383 (' + run('CTM_POP') + ')');
  ok(near(X.reduce((s, u) => s + u.dt, 0), 3350.16, 0.01), 'tổng diện tích 3.350,16 km²');
  ok(X.every((u) => u.ds > 0 && u.dt > 0 && u.ho > 0), 'dân số, diện tích, số hộ dương');
  const m = read('js/core/dl-config.js').match(/const DL_DV = \[([\s\S]*?)\];/);
  const dv = vm.runInNewContext('[' + m[1] + ']');
  ok(dv.length === 126 && dv.every((n) => X.some((u) => u.name === n)), 'tên khớp danh mục 126 đơn vị của eform (DL_DV)');
  const s = run('ctmShareInt(1000,[1,2,3,4,5,6,7])');
  ok(s.reduce((a, b) => a + b, 0) === 1000, 'ctmShareInt: tổng đúng bằng tổng cần chia');
  ok(run('ctmRng("a")()') === run('ctmRng("a")()'), 'ctmRng: cùng hạt giống ra cùng số');
}

console.log('== Từng đơn vị: mọi kỳ, mọi màn');
const IDS = run('Object.keys(CTM_SPECS)');
ok(IDS.length > 0, 'có đơn vị đã khai báo (' + IDS.join(', ') + ')');
IDS.forEach((id) => {
  const spec = run('CTM_SPECS[' + JSON.stringify(id) + ']');
  ok(spec.periods.length >= (spec.role === 'UBND' && spec.level === 'city' ? 1 : 2), id + ': đủ số kỳ báo cáo (' + spec.periods.length + ')');
  ok(spec.kpis.length >= 4 && spec.kpis.length <= 8, id + ': 4–8 ô số chính (' + spec.kpis.length + ')');
  const keys = new Set(spec.kpis.map((k) => k.m).concat(...(spec.groups || []).map((g) => g.lines || [])));
  ok([...keys].every((k) => spec.metrics[k]), id + ': mọi chỉ tiêu dùng trong ô số / thẻ nhóm đều có khai báo');
  (spec.level === 'xa' ? XA_TEST : [null]).forEach((xaName) => {
  setXa(xaName);
  const id0 = id;
  { const id = id0 + (xaName ? ' [' + xaName + ']' : '');
  spec.periods.forEach((p) => {
    run('CTM_UI.id=' + JSON.stringify(id0) + ';CTM_UI.period=' + JSON.stringify(p.id) + ';CTM_UI.xa.sel=null;CTM_UI.xa.q="";CTM_UI.xa.f="all";');
    ok(run('ctmD(CTM_SPECS[CTM_UI.id],CTM_UI.period)') != null, id + ' ' + p.id + ': có số liệu');
    const screens = [['home', 'CTM_UI.screen="home"']].concat((spec.groups || []).map((g) => ['group ' + g.id, 'CTM_UI.screen="group";CTM_UI.group=' + JSON.stringify(g.id)]));
    if (spec.xa) spec.xa.inds.forEach((I) => screens.push(['xa ' + I.id, 'CTM_UI.screen="xa";CTM_UI.xa.ind=' + JSON.stringify(I.id)]));
    screens.forEach(([nm, setup]) => {
      const h = run(setup + ';ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      const v = visible(h);
      ok(h.length > 500 && balanced(h), id + ' ' + p.id + ' ' + nm + ': dựng được, div cân bằng');
      ok(!/undefined|NaN/.test(h), id + ' ' + p.id + ' ' + nm + ': không có undefined/NaN');
      const t = v.match(TECH);
      ok(!t, id + ' ' + p.id + ' ' + nm + ': không lộ mã kỹ thuật' + (t ? ' (' + t[0] + ')' : ''));
    });
    if (spec.xa) {
      const first = run('ctmXaRows(CTM_SPECS[CTM_UI.id],CTM_UI.period)[0].u.name');
      const h = run('CTM_UI.screen="xa";CTM_UI.xa.sel=' + JSON.stringify(first) + ';ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      ok(h.indexOf('sgd-dw') > 0 && balanced(h) && !/undefined|NaN/.test(h), id + ' ' + p.id + ': khung hồ sơ xã, phường dựng được');
      const rows = run('ctmXaRows(CTM_SPECS[CTM_UI.id],CTM_UI.period)');
      ok(rows.length === 126, id + ' ' + p.id + ': bảng đủ 126 xã, phường');
      const hq = run('CTM_UI.xa.sel=null;CTM_UI.xa.q="viet hung";ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      ok((hq.match(/class="sgd-xt-row ctm-xr/g) || []).length === 1, id + ' ' + p.id + ': tìm "viet hung" (không dấu) ra đúng 1 dòng');
      const hp = run('CTM_UI.xa.q="";CTM_UI.xa.f="X";ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      ok((hp.match(/class="sgd-xt-row ctm-xr/g) || []).length === 75, id + ' ' + p.id + ': lọc "xã" ra 75 dòng');
    }
  });
  }
  });
  setXa(null);
});

console.log('== Mọi đơn vị: số không âm, 126 xã/phường cộng lại khớp Thành phố');
IDS.forEach((id) => {
  const spec = run('CTM_SPECS[' + JSON.stringify(id) + ']');
  setXa(spec.level === 'xa' ? XA_TEST[1] : null);
  let neg = [];
  spec.periods.forEach((p) => {
    const D = run('ctmD(CTM_SPECS[' + JSON.stringify(id) + '],' + JSON.stringify(p.id) + ')');
    Object.keys(D).forEach((k) => { if (typeof D[k] === 'number' && D[k] < 0 && k !== 'bd') neg.push(p.id + '.' + k); });
    Object.keys(spec.metrics).forEach((k) => { if (spec.metrics[k].u === '%' && D[k] != null && D[k] > 100.0001) neg.push(p.id + '.' + k + '>100'); });
  });
  ok(!neg.length, id + ': không có số âm, tỷ lệ không quá 100%' + (neg.length ? ' (' + neg.slice(0, 4).join(', ') + ')' : ''));
  if (spec.xa && spec.xa.inds.some((I) => I.from)) {
    let bad = [];
    spec.periods.forEach((p) => {
      const D = run('ctmD(CTM_SPECS[' + JSON.stringify(id) + '],' + JSON.stringify(p.id) + ')');
      const R = run('ctmXaRows(CTM_SPECS[' + JSON.stringify(id) + '],' + JSON.stringify(p.id) + ')');
      spec.xa.inds.filter((I) => I.from).forEach((I) => {
        if (D[I.from] == null) return;
        const want = D[I.from] * (I.k == null ? 1 : I.k), got = R.reduce((s, r) => s + r[I.id], 0);
        if (Math.abs(got - ((I.d || 0) === 0 ? Math.round(want) : want)) > 1e-6) bad.push(p.id + '.' + I.id);
        if (R.some((r) => r[I.id] < 0)) bad.push(p.id + '.' + I.id + '<0');
      });
    });
    ok(!bad.length, id + ': 126 xã, phường cộng lại = số Thành phố được chia' + (bad.length ? ' (' + bad.slice(0, 4).join(', ') + ')' : ''));
  }
});

setXa(null);

console.log('== Đơn vị cấp xã: số khớp đơn vị cấp Thành phố, tên đổi theo phường / xã');
{
  const XS = run('Object.keys(CTM_SPECS).filter(function(k){return CTM_SPECS[k].level==="xa"})');
  ok(XS.length === 19, '19 đơn vị cấp xã (' + XS.length + ')');
  const seedXa = (read('js/core/central-level.js').match(/\{id:'((?:dang|hdnd|ubnd|mttq)xa-[a-z]+)'/g) || []).map((s) => s.slice(5, -1));
  ok(seedXa.length === 19 && seedXa.every((x) => XS.indexOf(x) >= 0), 'đủ mọi đơn vị trong danh mục cấp xã của IOC');
  /* tổng 126 xã, phường của đơn vị cấp xã = số đơn vị cấp Thành phố đã chia */
  const sumXa = (spec, key, pid) => run('CTM_XA.reduce(function(s,u){var D=ctmD(CTM_SPECS[' + JSON.stringify(spec) + '],' + JSON.stringify(pid) + ',{xa:u});return s+(D&&D[' + JSON.stringify(key) + ']||0)},0)');
  ['2026Q2', '2025Q3'].forEach((p) => {
    const dvXa = run('ctmD(CTM_SPECS["dang-to-chuc"],' + JSON.stringify(p) + ',{xa:null}).dvXa');
    ok(sumXa('dangxa-tochuc', 'dv', p) === Math.round(dvXa), p + ': đảng viên 126 đảng bộ xã, phường cộng lại = số của Ban Tổ chức (' + Math.round(dvXa) + ')');
    ok(sumXa('ubndxa-anninh', 'chay', p) === run('ctmD(CTM_SPECS["dang-noi-chinh"],' + JSON.stringify(p) + ',{xa:null}).chay'), p + ': vụ cháy 126 xã, phường cộng lại = số của Ban Nội chính');
    ok(sumXa('hdndxa-giamsat', 'gs', p) === run('ctmD(CTM_SPECS["hdnd-xa-phuong"],' + JSON.stringify(p) + ',{xa:null}).gs'), p + ': cuộc giám sát HĐND cấp xã cộng lại = số HĐND Xã, Phường');
  });
  ok(near(sumXa('mttqxa-quyvi', 'quy', '2025Q4'), 92.8, 0.2), 'Quý 4/2025: quỹ “Vì người nghèo” 126 xã, phường cộng lại ≈ 92,8 tỷ đồng (' + sumXa('mttqxa-quyvi', 'quy', '2025Q4').toFixed(2) + ')');
  ok(sumXa('mttqxa-quyvi', 'tet', '2026Q1') === 5280, 'Tết Bính Ngọ 2026: suất quà từ Quỹ Thành phố cộng lại = 5.280 (số công bố)');
  ok(sumXa('ubndxa-vhxh', 'cn', '2025Q4') === 9570, 'hộ cận nghèo 126 xã, phường cộng lại = 9.570');
  const vh = run('ctmXaByName("Phường Việt Hưng")');
  const hccVH = run('hccUnits().find(function(r){return r.name==="Phường Việt Hưng"}).v["2026Q2"].hs');
  ok(run('ctmD(CTM_SPECS["ubndxa-mocua"],"2026Q2",{xa:CTM_XA.find(function(u){return u.name==="Phường Việt Hưng"})}).hs') === hccVH, 'Một cửa phường Việt Hưng: hồ sơ tiếp nhận = số của TT Phục vụ HCC (' + hccVH + ')');
  ok(vh.ds === 83188 && vh.dt === 12.91, 'phường Việt Hưng: dân số 83.188, diện tích 12,91 km²');
  setXa('Xã Ba Vì');
  ok(run('ctmName(CTM_SPECS["ubndxa-yte"])') === 'Trạm Y tế xã' && run('ctmOrg(CTM_SPECS["ubndxa-yte"])') === 'Trạm Y tế xã Ba Vì', 'xã Ba Vì: tên đơn vị ghi "xã" (Trạm Y tế xã · Trạm Y tế xã Ba Vì)');
  ok(run('ctmHandles("ubndxa-yte")') === true && run('ctmHandles("dang-to-chuc")') === false, 'ctmHandles: ở xã chỉ nhận đơn vị cấp xã');
  ok(run('ctmOverviewFor(["DANG","HDND","UBND","MTTQ"]).id') === 'xa-4truc' && run('ctmOverviewFor(["UBND"]).id') === 'xa-UBND', 'ctmOverviewFor: tài khoản xã dùng màn ngoài cấp xã');
  setXa('Phường Việt Hưng');
  ok(run('ctmName(CTM_SPECS["ubndxa-yte"])') === 'Trạm Y tế phường', 'phường Việt Hưng: tên đơn vị ghi "phường"');
  ok(run('ctmHandles("dang-to-chuc")') === false, 'ở phường không mở nhầm đơn vị cấp Thành phố');
  setXa(null);
}

console.log('== 12 sở theo eform: mọi chỉ tiêu có số, khớp cấu hình của sở');
{
  const SO = ['ubnd-vhtt', 'ubnd-vpubnd', 'ubnd-bqlkcnc', 'ubnd-dulich', 'ubnd-dantoc-tongiao', 'ubnd-thanhtra', 'ubnd-khcn', 'ubnd-nnmt', 'ubnd-congthuong', 'ubnd-xaydung', 'ubnd-noivu', 'ubnd-yte'];
  SO.forEach((id) => {
    const has = run('!!CTM_SPECS[' + JSON.stringify(id) + ']');
    ok(has, id + ': đã khai báo khuôn mới');
    if (!has) return;
    const D = run('ctmD(CTM_SPECS[' + JSON.stringify(id) + '],"ky",{xa:null})');
    const miss = run('Object.keys(CTM_SPECS[' + JSON.stringify(id) + '].metrics)').filter((k) => D[k] == null);
    ok(!miss.length, id + ': mọi chỉ tiêu có số ở kỳ báo cáo' + (miss.length ? ' (thiếu: ' + miss.join(', ') + ')' : ''));
    const sp = run('CTM_SPECS[' + JSON.stringify(id) + ']');
    if (sp.xa) {
      const R = run('ctmXaRows(CTM_SPECS[' + JSON.stringify(id) + '],"ky",{xa:null})');
      sp.xa.inds.forEach((I) => ok(R.some((r) => r[I.id] != null), id + ' theo xã, phường: chỉ tiêu "' + I.l + '" có số'));
    }
    /* mỗi thẻ riêng của nhóm dựng ra có nội dung (không phải ô trống vì sai tên trường) */
    (sp.groups || []).forEach((g) => {
      const h = run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period="ky";CTM_UI.screen="group";CTM_UI.group=' + JSON.stringify(g.id) + ';ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      const nCards = (h.match(/class="stc-card"/g) || []).length, want = g.rows.reduce((s, r) => s + r.length, 0);
      ok(nCards === want, id + ' nhóm ' + g.id + ': dựng đủ ' + want + ' thẻ (' + nCards + ')');
      ok(!/<tbody><\/tbody>|<div class="sgd-cc"><\/div>/.test(h), id + ' nhóm ' + g.id + ': không có bảng, biểu đồ rỗng');
    });
  });
  const vh = run('ctmD(CTM_SPECS["ubnd-vhtt"],"ky",{xa:null})');
  /* doanh thu hiển thị tỷ đồng từ 12/10/2026 (quy tắc H4): vẫn đúng số đã chốt 32.240 triệu đồng = 32,24 tỷ đồng */
  ok(vh.ctTong === 48 && vh.da === 36 && Math.abs(vh.dt - 32.24) < 1e-9 && vh.bc === 24860, 'VHTT: giữ đúng số đã chốt (48 nhiệm vụ, 36 dự án, 32.240 triệu đồng = 32,24 tỷ đồng, 24.860 tin bài)');
  const sc = run('ctmD(CTM_SPECS["ubnd-congthuong"],"ck",{xa:null})');
  ok(sc.xk === 15290 && sc.nk === 34720 && sc.bl === 695100 && sc.blH == null, 'Công Thương cùng kỳ: chỉ các chỉ tiêu có số cùng kỳ (xuất khẩu 15.290, nhập khẩu 34.720, bán lẻ 695.100)');
  const nv = run('ctmD(CTM_SPECS["ubnd-noivu"],"ky",{xa:null})');
  ok(nv.tdDn === 64 && nv.tdNc === 443 && nv.tdHs === 652 && nv.ccvc === 136343 && Math.abs(nv.ncc - 228.987) < 0.01, 'Nội vụ: giữ 5 chỉ tiêu số thật (64 doanh nghiệp, 443 nhu cầu, 652 hồ sơ, 136.343 CCVC, 228,99 tỷ đồng)');
  ok(run('ctmHandles("ubnd-vhtt")') === true && run('ctmHandles("ubnd-hcc")') === false && run('ctmHandles("ubnd-taichinh")') === false, 'ctmHandles: sở eform dùng khuôn mới, không đụng Sở Tài chính, TT HCC');
}

console.log('== Ban Tuyên giáo và CTXH (MTTQ): số khớp');
if (IDS.indexOf('mttq-quy') >= 0) {
  const P = run('MTQ_QUY_PERIODS.map(p=>p.id)');
  let prevTon = null;
  P.slice().reverse().forEach((p) => {
    const D = run('mtqQuyData(' + JSON.stringify(p) + ')');
    ok(near(D.tonDau + D.thu - D.chi, D.ton, 0.06), p + ': tồn đầu + vận động − chi = tồn cuối');
    if (prevTon != null) ok(near(D.tonDau, prevTon), p + ': tồn đầu năm = tồn cuối năm trước');
    prevTon = D.ton;
    ok(near(D.tp + D.xa, D.thu, 0.05), p + ': quỹ cấp Thành phố + cấp xã = vận động các cấp');
    ok(near(D.cTet + D.cAs + D.cSk + D.cHt + D.cKcb + D.cxm + D.csc, D.chi, 0.06), p + ': các nội dung chi cộng lại = tổng chi');
    ok(near(D.bdCq + D.bdMt + D.bdDn + D.bdCn, D.bd, 0.06), p + ': người ủng hộ Quỹ biển, đảo cộng lại = tổng tiếp nhận');
    ok(D.bdLe <= D.bd && D.kpTP < D.kpAll && D.suatTP + D.suatNCT <= D.suatAll, p + ': số con không vượt số tổng');
    const R = run('mtqQuyXaRows(' + JSON.stringify(p) + ')');
    ok(near(R.reduce((s, r) => s + r.q, 0), D.xa * 1000, 1e-3), p + ': quỹ 126 xã, phường cộng lại = quỹ cấp xã');
    ok(R.reduce((s, r) => s + r.nha, 0) === D.nhaN, p + ': nhà Đại đoàn kết 126 xã, phường cộng lại = Thành phố');
    if (D.cn != null) {
      ok(R.reduce((s, r) => s + r.cn, 0) === D.cn, p + ': hộ cận nghèo 126 xã, phường cộng lại = ' + D.cn);
      ok(R.filter((r) => r.cn === 0).length === D.cn0, p + ': số xã, phường không còn hộ cận nghèo = ' + D.cn0);
      ok(R.every((r) => r.cn >= 0 && r.cn <= r.u.ho), p + ': hộ cận nghèo không âm, không vượt số hộ');
    } else ok(R.every((r) => r.cn == null), p + ': kỳ chưa áp chuẩn cận nghèo thì để trống, không tự đặt số');
  });
  const D25 = run('mtqQuyData("2025")');
  ok(D25.cn === 9570 && D25.cn0 === 43 && D25.suatTP === 5280 && D25.suatNCT === 300 && near(D25.kpTP, 5.43) && D25.ct === 93 && D25.bdLe === 40, '2025: giữ đúng các số công bố');
  ok(run('mtqQuyData("2024")').cn === 9928, '2024: 9.928 hộ cận nghèo (số công bố)');
}

console.log('== Màn ngoài');
{
  /* categorySeedForRole giả: mọi đơn vị đã khai báo (theo trục) + mọi id ghi trong nhóm của các màn ngoài + vài sở UBND chưa khai báo */
  run('var __cats={};function __add(r,id){__cats[r]=__cats[r]||[];if(!__cats[r].some(function(x){return x.id===id}))__cats[r].push({id:id,name:"Đơn vị "+id,items:[["Chỉ tiêu cũ",1]],types:["Excel"]})}' +
    'Object.keys(CTM_SPECS).forEach(function(id){__add(CTM_SPECS[id].role,id)});' +
    'CTM_OVERVIEWS.forEach(function(c){(c.groups||[]).forEach(function(g){(g.ids||[]).forEach(function(id){__add(c.roles[0],id)})})});' +
    '["ubnd-taichinh","ubnd-hcc","ubnd-xaydung"].forEach(function(id){__add("UBND",id)});' +
    'function categorySeedForRole(r){return __cats[r]||[]}' +
    'function __ovCats(c){var a=[];c.roles.forEach(function(r){categorySeedForRole(r).forEach(function(x){a.push(Object.assign({},x,{role:r}))})});return a}');
  const OV = run('CTM_OVERVIEWS.map(c=>c.id)');
  OV.forEach((id) => {
    const sel = 'var c=CTM_OVERVIEWS.find(x=>x.id===' + JSON.stringify(id) + ');';
    const h = run(sel + 'ctmOverviewHtml(c,__ovCats(c))');
    ok(h.length > 1000 && balanced(h) && !/undefined|NaN/.test(h), id + ': màn ngoài dựng được, div cân bằng');
    ok(!TECH.test(visible(h).replace(/Đơn vị [a-z-]+/g, '')), id + ': màn ngoài không lộ mã kỹ thuật');
    ok((h.match(/class="uo-card"/g) || []).length === run(sel + '__ovCats(c).length'), id + ': đủ thẻ mọi đơn vị');
    const nk = run(sel + 'c.kpis.filter(function(k){return CTM_SPECS[k.cat]}).length');
    ok((h.match(/class="stc-kpi uo-kpi"/g) || []).length === nk, id + ': đủ ' + nk + ' ô số của các đơn vị đã khai báo');
    const groups = run(sel + 'c.groups');
    groups.forEach((g) => {
      const hg = run('CTM_OV_PICK[' + JSON.stringify(id) + ']=' + JSON.stringify(g.id) + ';' + sel + 'ctmOverviewHtml(c,__ovCats(c))');
      const want = g.ids ? g.ids.length : run(sel + '__ovCats(c).filter(function(x){return x.role===' + JSON.stringify(g.role) + '}).length');
      ok((hg.match(/class="uo-card"/g) || []).length === want, id + ' lọc nhóm ' + g.id + ': đúng ' + want + ' thẻ');
    });
    run('CTM_OV_PICK[' + JSON.stringify(id) + ']="all"');
  });
  ok(run('ctmOverviewFor(["DANG","HDND","UBND","MTTQ"])').id === 'tu-all' && run('ctmOverviewFor(["DANG"])').id === 'dang-tp' && run('ctmOverviewFor(["HDND"])').id === 'hdnd-tp', 'ctmOverviewFor: đúng cấu hình cho tab Tất cả, Thành ủy, HĐND');
  const want = ['dang-vptu', 'dang-to-chuc', 'dang-ubkt', 'dang-noi-chinh', 'dang-tuyen-giao', 'hdnd-nhiem-vu', 'hdnd-do-thi', 'hdnd-khcn-mt', 'hdnd-kt-ns', 'hdnd-phap-che', 'hdnd-vh-xh', 'hdnd-doan-dbqh', 'hdnd-xa-phuong', 'hdnd-to-tuvan', 'hdnd-vp-doan-dbqh',
    'mttq-nhiem-vu', 'mttq-quy', 'mttq-danchu-giamsat', 'mttq-dantoc-tongiao', 'mttq-cong-tac-phu-nu', 'mttq-cong-tac-cong-doan', 'mttq-cuu-chien-binh', 'mttq-doan-thanh-thieu-nhi', 'mttq-cong-tac-nong-dan', 'mttq-thuong-truc', 'mttq-to-chuc-kiem-tra',
    'mttq-hoi-lhpn', 'mttq-hoi-nong-dan-tp', 'mttq-lien-doan-lao-dong', 'mttq-xa-phuong', 'mttq-thanh-doan', 'mttq-vp-co-quan'];
  const miss = want.filter((x) => IDS.indexOf(x) < 0);
  ok(!miss.length, 'đủ ' + want.length + ' đơn vị Thành ủy, HĐND, MTTQ cấp Thành phố' + (miss.length ? ' (thiếu ' + miss.join(', ') + ')' : ''));
  const seedIds = (read('js/core/central-level.js').match(/\{id:'([a-z0-9-]+)'/g) || []).map((s) => s.slice(5, -1));
  const orphan = IDS.filter((x) => seedIds.indexOf(x) < 0);
  ok(!orphan.length, 'mọi đơn vị khai báo đều có lĩnh vực tương ứng trong danh mục IOC' + (orphan.length ? ' (không có: ' + orphan.join(', ') + ')' : ''));
  ok(run('ctmOverviewFor(["MTTQ"])') != null && run('ctmOverviewFor(["UBND"])') == null, 'ctmOverviewFor: có cấu hình MTTQ, không đụng trục UBND');
  ok(run('ctmHandles("mttq-quy")') === true && run('ctmHandles("ubnd-hcc")') === false, 'ctmHandles: chỉ nhận đơn vị đã khai báo');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
