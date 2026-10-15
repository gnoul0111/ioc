'use strict';
/* Kiểm thử theo "Quy tắc hiển thị chỉ tiêu dùng chung" (docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12) — chặn tái phát các lỗi đã sửa
   ở đợt 1, 2 (12/10/2026). Mỗi khối ghi mã quy tắc. Chạy: node tests/ctm/ctm-quy-tac.test.js
   Thêm phép kiểm khi sửa xong các đợt sau (đơn vị, số lẻ — H3, H4, H5; chiều tốt/xấu — H18). */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js', 'js/features/ubnd-overview.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: {} });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const S = run('CTM_SPECS'), XA = run('CTM_XA');
const ids = Object.keys(S);
const isQ = (s) => s.periods.some((p) => /^\d{4}Q\d$/.test(p.id));
const groupCards = (s) => [].concat(...(s.groups || []).map((g) => (g.rows || run('ctmAutoRows')(s, g)).map((r) => r.map((c) => ({ g: g, c: c })))).reduce((a, b) => a.concat(b), []));
const shown = (h) => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

console.log('== H22 · Màn ngoài: tab UBND đọc đúng dòng thẻ của cấu hình chi tiết');
ids.filter((id) => S[id].role === 'UBND' && (S[id].level || 'city') === 'city').forEach((id) => {
  const U = run('ubndOvData')(id), C = run('ctmOvLines')(S[id]);
  ok(U && JSON.stringify(U.lines.map((x) => [x.l, x.v, x.u])) === JSON.stringify(C.map((x) => [x.l, x.v, x.u])), id + ': tab UBND = tab "Tất cả" = cấu hình chi tiết');
});

console.log('== H9 · Mốc so sánh theo kiểu dữ liệu');
ids.forEach((id) => {
  const s = S[id];
  Object.keys(s.metrics).forEach((k) => {
    const m = s.metrics[k], b = run('ctmBase')(s, k);
    if (/lũy kế/i.test(m.l + ' ' + (m.short || '')) && isQ(s)) ok(m.ck || m.td, id + '.' + k + ': chỉ tiêu lũy kế theo quý phải so cùng kỳ (cờ k)');
    if (isQ(s) && !m.td && !m.plan) ok(b === 'ck', id + '.' + k + ': số phát sinh theo quý so cùng kỳ năm trước');
    if (m.plan) ok(b === 'none', id + '.' + k + ': kế hoạch không so kỳ');
  });
});

console.log('== H10 · Mọi mũi tên tăng/giảm ghi mốc so sánh');
let nArrow = 0, nLine = 0, nPlan = 0, nMk = 0;
ids.forEach((id) => {
  const s = S[id];
  (s.level === 'xa' ? ['Phường Việt Hưng'] : [null]).forEach((xa) => {
    setXa(xa);
    s.periods.forEach((p) => {
      run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period=' + JSON.stringify(p.id) + ';CTM_UI.xa.sel=null;');
      const screens = ['CTM_UI.screen="home"'].concat((s.groups || []).map((g) => 'CTM_UI.screen="group";CTM_UI.group=' + JSON.stringify(g.id)));
      screens.forEach((sc) => {
        const h = run(sc + ';ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
        const arrows = h.match(/<span class="stc-dl (?:up|down|flat)[^"]*"[^>]*>[^<]*(?:<span class="stc-ref">[^<]*<\/span>)?<\/span>/g) || [];
        nArrow += arrows.length;
        const noRef = arrows.filter((a) => a.indexOf('stc-ref') < 0);
        ok(!noRef.length, id + ' ' + p.id + ' ' + sc.replace(/CTM_UI\./g, '') + ': ' + noRef.length + ' mũi tên không ghi mốc');
      });
    });
  });
});
ok(nArrow > 2000, 'đã soát ' + nArrow + ' mũi tên (phép kiểm có tác dụng)');
setXa(null);

console.log('== H13 · Chọn biểu đồ: tỷ lệ theo thời gian vẽ đường; kế hoạch không là thanh, cột ngang hàng');
ids.forEach((id) => {
  const s = S[id];
  setXa(s.level === 'xa' ? 'Phường Việt Hưng' : null);
  run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period=' + JSON.stringify(s.periods[0].id) + ';');
  const n = run('ctmNP(CTM_SPECS[CTM_UI.id])');
  groupCards(s).forEach(({ g, c }) => {
    const h = run('ctmCardHtml')(s, c, n);
    if (h.indexOf('ctm-line') >= 0) nLine++; if (h.indexOf('ctm-plan') >= 0) nPlan++; if (h.indexOf('ctm-mk') >= 0) nMk++;
    if (c.type === 'cols' && !c.m2 && s.metrics[c.m] && s.metrics[c.m].u === '%') ok(!h || h.indexOf('ctm-line') >= 0, id + ' › ' + g.label + ' › ' + c.t + ': tỷ lệ qua các kỳ phải là biểu đồ đường');
    if (c.type === 'mbars' && c.u === '%') ok(h.indexOf('ctm-line') >= 0, id + ' › ' + c.t + ': tỷ lệ theo tháng/quý phải là biểu đồ đường');
    if (c.type === 'mbars' && /chỉ số/i.test(c.t)) ok(h.indexOf('mốc 100') >= 0 && !/\d%/.test(shown(h).replace(/[\d.,]+%\s*so/g, '')), id + ' › ' + c.t + ': chỉ số có mốc 100, không gắn %');
    if (c.type === 'mbars' && /kế hoạch/i.test(c.l2 || '')) ok(h.indexOf('ctm-plan') >= 0 && h.indexOf('sgd-b0') < 0, id + ' › ' + c.t + ': kế hoạch là vạch, không là cột thứ hai');
    if (c.type === 'cmp') (c.items || []).filter((k) => s.metrics[k] && s.metrics[k].plan).forEach((k) => ok(h.indexOf('<div class="stc-nm">' + escFn(s.metrics[k].short || s.metrics[k].l) + '</div>') < 0, id + ' › ' + c.t + ': kế hoạch "' + k + '" không thành thanh so sánh'));
    if (c.type === 'rates') (c.items || []).filter((k) => s.metrics[k] && s.metrics[k].plan).forEach((k) => ok(h.indexOf('ctm-mk') >= 0, id + ' › ' + c.t + ': chỉ tiêu giao "' + k + '" là vạch mốc'));
    if (c.type === 'parts') { const us = new Set([c.total].concat(c.parts).map((k) => (s.metrics[k] || {}).u)); ok(us.size === 1, id + ' › ' + c.t + ': thanh xếp chồng chỉ gộp các phần cùng đơn vị, không trùng người'); }
  });
});
setXa(null);

/* nPlan ≥ 1: từ 13/10/2026 ẩn kế hoạch không có trường trong eform (NN&MT rừng trồng…); còn kế hoạch thật của VHTT 08-CT */
ok(nLine >= 15 && nPlan >= 1 && nMk >= 1,'đã vẽ ' + nLine + ' biểu đồ đường, ' + nPlan + ' thẻ có vạch kế hoạch, ' + nMk + ' thẻ có vạch chỉ tiêu giao');

console.log('== H14, H15 · Không lặp số; cơ cấu tối đa 6 phần vẽ bằng thẻ cơ cấu');
ids.forEach((id) => {
  const s = S[id];
  (s.groups || []).forEach((g) => {
    if (g.rows) return;
    const cards = [].concat(...run('ctmAutoRows')(s, g));
    const cmp = cards.find((c) => c.type === 'cmp');
    cards.filter((c) => c.type === 'parts').forEach((p) => {
      if (cmp) ok(!(cmp.items.length >= 2 && cmp.items.every((k) => k === p.total || p.parts.indexOf(k) >= 0)), id + ' › ' + g.label + ': thẻ so sánh lặp đúng bộ số của thẻ cơ cấu');
      if (cmp && cmp.items.indexOf(p.total) >= 0) ok(cmp.noBig, id + ' › ' + g.label + ': tổng không lặp thành thanh cạnh các phần');
    });
    cards.filter((c) => c.type === 'table' && c.total).forEach((t) => ok(t.rows.filter((k) => k !== t.total).length > 6, id + ' › ' + g.label + ': bảng cơ cấu dưới 7 phần phải là thẻ cơ cấu'));
  });
});

console.log('== H16 · Bảng 126 xã: số tuyệt đối không xếp hạng tốt/kém');
ids.forEach((id) => {
  const s = S[id];
  if (!s.xa) return;
  setXa(s.level === 'xa' ? 'Phường Việt Hưng' : null);
  s.xa.inds.forEach((I) => {
    const abs = I.u !== '%' && !/trên [\d.]+ (dân|hộ)|bình quân|\//.test(I.l + ' ' + I.u);
    if (!abs) return;
    ok(run('ctmXaNoRank')(I), id + ' › ' + I.l + ': số tuyệt đối không xếp hạng');
    const h = run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period=' + JSON.stringify(s.periods[0].id) + ';CTM_UI.screen="xa";CTM_UI.xa.ind=' + JSON.stringify(I.id) + ';CTM_UI.xa.sel=null;CTM_UI.xa.q="";CTM_UI.xa.f="all";ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
    ok(/<span>Thứ tự<\/span>/.test(h) && !/Kém hơn mức Thành phố|>Hạng<\/span>/.test(h), id + ' › ' + I.l + ': cột "Thứ tự", không có "Kém hơn mức Thành phố"');
  });
  groupCards(s).filter(({ c }) => c.type === 'top').forEach(({ c }) => {
    const I = s.xa.inds.find((x) => x.id === c.ind);
    if (I && run('ctmXaNoRank')(I)) { const h = run('ctmCardHtml')(s, c, run('ctmNP(CTM_SPECS[' + JSON.stringify(id) + '])')); ok(h.indexOf('Thấp nhất') < 0, id + ' › thẻ ' + I.l + ': không gọi "Thấp nhất" với số tuyệt đối'); }
  });
});
setXa(null);

console.log('== H20 · Mức chung Thành phố của tỷ lệ ở bảng xã');
ids.forEach((id) => {
  const s = S[id];
  if (!s.xa || s.level === 'xa') return;
  const pid = s.periods[0].id, rows = run('ctmXaRows')(s, pid, { xa: null }), D = run('ctmD')(s, pid, { xa: null });
  s.xa.inds.filter((I) => I.u === '%').forEach((I) => {
    const tp = run('ctmXaTP')(s, I, rows, { D: D });
    if (I.tpm) ok(Math.abs(tp - D[I.tpm]) < 1e-9, id + ' › ' + I.l + ': mức chung = ô số ' + I.tpm);
    if (I.rate) {
      let a = 0, b = 0; rows.forEach((r) => { const v = r[I.id]; if (v != null) { a += v * r.u.ds; b += r.u.ds; } });
      ok(Math.abs(a / b - D[I.rate]) < 0.05, id + ' › ' + I.l + ': 126 xã gộp theo dân số = tỷ lệ Thành phố (' + (a / b).toFixed(2) + ' / ' + D[I.rate] + ')');
    }
    if (!I.tp && !(I.num && I.den)) {
      const vs = rows.map((r) => r[I.id]).filter((v) => v != null);
      const avg = vs.reduce((x, y) => x + y, 0) / vs.length;
      ok(vs.length < 2 || Math.abs(tp - avg) > 1e-9 || vs.every((v) => v === vs[0]), id + ' › ' + I.l + ': mức chung không phải trung bình cộng');
    }
  });
});

console.log('== H19 · Cùng xã, cùng chỉ tiêu: màn Trạm Y tế lấy số Sở Y tế (tháng cuối quý)');
['Phường Việt Hưng', 'Xã Ba Vì', 'Phường Hoàn Kiếm'].forEach((name) => {
  const u = XA.find((x) => x.name === name), su = run('SYT_UNITS').find((x) => x.ten === name);
  [['2026Q2', 5], ['2026Q1', 2]].forEach(([pid, m]) => {
    const D = run('ctmD')(S['ubndxa-yte'], pid, { xa: u });
    ok(Math.abs(D.bhyt - Math.round(su.bhyt[m] / su.dan * 10000) / 100) < 0.006, name + ' ' + pid + ': bảo hiểm y tế = số Sở Y tế tháng ' + (m + 1));
    ok(Math.abs(D.hsSk - Math.round(su.hssk[m] / su.dan * 1000) / 10) < 0.06, name + ' ' + pid + ': hồ sơ sức khỏe điện tử = số Sở Y tế tháng ' + (m + 1));
  });
});

console.log('== BA 23, 24 · Nông thôn mới theo bộ tiêu chí 2026–2030');
{
  const s = S['ubnd-nnmt'];
  run('CTM_UI.id="ubnd-nnmt";CTM_UI.period="ky";');
  const h = shown(run('CTM_UI.screen="group";CTM_UI.group="ntm";ctmScreenHtml(CTM_SPECS["ubnd-nnmt"])') + run('CTM_UI.screen="home";ctmScreenHtml(CTM_SPECS["ubnd-nnmt"])'));
  ok(!/kiểu mẫu|nâng cao/i.test(h.replace(/không còn các mức nâng cao, kiểu mẫu/g, '')), 'không còn mức nâng cao, kiểu mẫu trên giao diện');
  ok(/Chưa đạt chuẩn/.test(h) && /trên 10/.test(h), 'có mức Chưa đạt chuẩn và số tiêu chí trên 10');
  const N = run('NM_SUM.ntm');
  ok(N.muc26.reduce((a, b) => a + b, 0) === run('NM_NTM.length'), '3 mức cộng lại đủ số xã');
  ok(N.tc10.every((r) => r[0] >= 0 && r[0] <= 10), 'số tiêu chí trong khoảng 0–10');
}

console.log('== Đợt 3 · H3, III.3, BA 62–67, 85 · Một chỉ tiêu một đơn vị');
{
  const unitOf = (id, k) => S[id].metrics[k].u;
  ['tong', 'qt', 'nd', 't9'].forEach((k) => ok(unitOf('ubnd-dulich', k) === 'nghìn lượt', 'Du lịch › ' + k + ': lượt khách ghi nghìn lượt'));
  S['ubnd-dulich'].xa.inds.filter((I) => /^(lượt khách|khách)/i.test(I.l) && !/ trên /.test(I.l)).forEach((I) => ok(I.u === 'nghìn lượt', 'Du lịch › bảng xã › ' + I.l + ': nghìn lượt'));
  ok(unitOf('ubnd-xaydung', 'hk') === 'nghìn lượt' && unitOf('ubnd-xaydung', 'hh') === 'nghìn tấn', 'Sở Xây dựng: hành khách nghìn lượt, hàng hóa nghìn tấn');
  ['dt', 'cl', 'nsnn'].forEach((k) => ok(unitOf('ubnd-vhtt', k) === 'tỷ đồng', 'Văn hóa › ' + k + ': tiền ghi tỷ đồng'));
  ok(unitOf('ubnd-vhtt', 'xem') === 'nghìn lượt' && unitOf('ubnd-vhtt', 'giaVe') === 'nghìn đồng', 'Văn hóa: lượt xem nghìn lượt, giá vé nghìn đồng');
  const hl = S['ubnd-vpubnd'].metrics.hsHl;
  ok(hl.u === '%' && hl.d === 2 && !/điểm/i.test(hl.l + ' ' + (hl.short || '')), 'Văn phòng UBND: mức độ hài lòng ghi %, 2 số lẻ, không gọi "điểm … %"');
}

console.log('== Đợt 3 · H4, H5 · Số lẻ theo độ lớn; 2 số lẻ chỉ cho tỷ lệ hồ sơ, bảo hiểm y tế, cận nghèo, học sinh chính sách');
ids.forEach((id) => {
  const s = S[id], pid = s.periods[s.periods.length - 1].id;
  if (s.level === 'xa') setXa('Phường Việt Hưng'); else setXa(null);
  const D = run('ctmD')(s, pid, { xa: s.level === 'xa' ? XA.find((x) => x.name === 'Phường Việt Hưng') : null });
  Object.keys(s.metrics).forEach((k) => {
    const m = s.metrics[k], v = D[k], d = m.d || 0;
    if (typeof v !== 'number' || !isFinite(v)) return;
    if (m.u !== '%' && m.u !== 'điểm' && !/chỉ số|\/|trên|bình quân/i.test(m.u + ' ' + m.l) && Math.abs(v) >= 1000) ok(d === 0, id + '.' + k + ' (' + v + ' ' + m.u + '): từ 1.000 trở lên không số lẻ');
    if (m.u === '%' && d === 2) ok(/hồ sơ|đúng hạn|trễ hạn|hài lòng|bảo hiểm y tế|bao phủ|cận nghèo|chính sách/i.test(m.l + ' ' + (m.short || '')), id + '.' + k + ' (' + m.l + '): 2 số lẻ chỉ dành cho nhóm H5');
  });
});
setXa(null);

console.log('== Đợt 3 · H11 · Số riêng một tháng không vẽ thành cột so với số lũy kế');
ids.forEach((id) => {
  const s = S[id];
  Object.keys(s.metrics).filter((k) => s.metrics[k].month).forEach((k) => {
    run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period=' + JSON.stringify(s.periods[s.periods.length - 1].id) + ';CTM_UI.xa.sel=null;');
    const h = shown(['CTM_UI.screen="home"'].concat((s.groups || []).map((g) => 'CTM_UI.screen="group";CTM_UI.group=' + JSON.stringify(g.id))).map((sc) => run(sc + ';ctmScreenHtml(CTM_SPECS[CTM_UI.id])')).join(' '));
    ok(/số riêng một tháng/.test(h), id + '.' + k + ': số một tháng ghi chú riêng, không cộng vào số chính');
  });
});

console.log('== Đợt 4 · H18 · Kiến nghị, phản ánh, đơn thư tiếp nhận là trung tính (chốt 12/10/2026)');
{
  const NEU = /kiến nghị|phản ánh|đơn thư/i, KQ = /giải quyết|xử lý|quá hạn|đã thực hiện|đúng hạn|tỷ lệ|đánh giá|hài lòng|thu hồi/i;
  let nM = 0, nX = 0;
  ids.forEach((id) => {
    const s = S[id];
    Object.keys(s.metrics).forEach((k) => {
      const m = s.metrics[k], L = m.l + ' ' + (m.short || '');
      if (NEU.test(L) && !KQ.test(L) && m.u !== '%') { nM++; ok(!m.inv, id + '.' + k + ' (' + m.l + '): không để "giảm là tốt"'); }
    });
    ((s.xa && s.xa.inds) || []).forEach((I) => {
      if (NEU.test(I.l) && !KQ.test(I.l) && I.u !== '%') { nX++; ok(I.better !== 'low' && run('ctmXaNoRank')(I), id + ' › bảng xã › ' + I.l + ': chỉ sắp theo số, không xếp hạng tốt/kém'); }
    });
  });
  ok(nM >= 15 && nX >= 15, 'có đủ chỉ tiêu kiến nghị, phản ánh, đơn thư để kiểm (' + nM + ' ô số, ' + nX + ' cột bảng xã)');
  run('CTM_UI.id="hdnd-do-thi";CTM_UI.period=CTM_SPECS["hdnd-do-thi"].periods[0].id;CTM_UI.xa.sel=null;CTM_UI.xa.ind="ctpc";CTM_UI.xa.f="all";CTM_UI.xa.q="";');
  const h = shown(run('ctmScreenXa(CTM_SPECS["hdnd-do-thi"])'));
  ok(/Thứ tự/.test(h) && !/Kém hơn mức Thành phố/.test(h), 'bảng xã kiến nghị cử tri trên 100.000 dân: cột "Thứ tự", không đếm "kém hơn mức Thành phố"');
}

console.log('== Đợt 4 · BA 03, 04, 06 (VP UBND), 35–37 (NN&MT), 80, 82 (Thanh tra)');
{
  const grp = (id, g) => S[id].groups.find((x) => x.id === g);
  const card = (id, g, t) => grp(id, g).cards.find((c) => c.t === t);
  const kq = card('ubnd-vpubnd', 'cs52', 'Kết quả giải quyết');
  ok(kq.items().length === 2 && /Chưa có kết quả trong kỳ|kỳ trước/.test(run('ctmText')(kq.hint)), 'VP UBND: vòng kết quả 2 phần, phần chênh ở dòng phụ (BA 06)');
  ok(!/đang giải quyết/i.test(S['ubnd-vpubnd'].metrics.hsDang.l), 'VP UBND: không gọi phần chênh là "đang giải quyết" (BA 06)');
  ok(card('ubnd-vpubnd', 'cs1112', 'Mức độ đáp ứng').u === 'lượt đánh giá', 'VP UBND: mức độ đáp ứng đếm theo lượt đánh giá (BA 03)');
  const gb = run('VPUB_SUM').cs1112.loai.find((r) => r[0] === 'Hệ thống giao ban trực tuyến');
  ok(gb[1].reduce((a, b) => a + b, 0) !== run('VPUB_SUM').cs1112.tbXa, 'VP UBND: số hệ thống giao ban không lấy bằng số phòng (BA 04)');
  const nn = S['ubnd-nnmt'];
  ok(nn.metrics.nguoi.u === 'lượt người' && grp('ubnd-nnmt', 'hoTro').lines[0] === 'nguoi' && nn.card.indexOf('nguoi') >= 0, 'NN&MT: hỗ trợ lương thực tính theo lượt người (BA 35)');
  ok(grp('ubnd-nnmt', 'hoTro').cards.some((c) => c.type === 'mbars' && c.u === 'lượt người'), 'NN&MT: có biểu đồ lượt người theo tháng (BA 36)');
  ok(grp('ubnd-nnmt', 'hoTro').cards.some((c) => c.type === 'list' && /lượt người/i.test(c.t)), 'NN&MT: bảng địa bàn theo lượt người (BA 37)');
  ok(run('TTRA_CUOC').filter((c) => c.tt === 1 && c.quaHan === 0 && c.tienDo > 75 && c.tgDung <= 75).every((c) => c.cb !== 1), 'Thanh tra: tiến độ cao mà còn thời gian thì không cảnh báo Vàng (BA 80)');
  const sct = S['ubnd-congthuong'];
  ok(!/^chỉ số sản xuất công nghiệp/i.test(sct.metrics.iip.l) && /doanh nghiệp/.test(sct.metrics.iip.l) && grp('ubnd-congthuong', 'iip').cards.some((c) => c.type === 'mbars' && c.idx), 'Công Thương: không gọi số eform là chỉ số sản xuất công nghiệp; chỉ số tháng là đường mốc 100 (BA 40, 41)');
  const pl = card('ubnd-thanhtra', 'tcd', 'Kết quả phân loại, xử lý đơn'), T = run('TTRA_SUM').tcd;
  ok(pl && pl.items().reduce((a, r) => a + r[1], 0) === T.daXl && T.phaiXl === T.kyTruoc + T.donMoi && /Phải xử lý/.test(run('ctmText')(pl.hint)), 'Thanh tra: tổng vòng = đơn đã xử lý, "phải xử lý" ở dòng phụ (BA 82)');
}

console.log('== Phản hồi nhóm triển khai 13/10/2026 · chỉ hiện số tính được từ trường có trong eform');
{
  /* chỉ tiêu ẩn: không còn trong metrics, không còn ở dòng nhóm, ô số, thẻ màn ngoài */
  const AN = { 'ubnd-vhtt': ['dtKh', 'ctDh'], 'ubnd-nnmt': ['tmKh', 'tmR', 'nvKh', 'nvR', 'gvKh', 'gvR', 'ho'], 'ubnd-thanhtra': ['ktKh', 'ktR'] };
  Object.keys(AN).forEach((id) => {
    const s = S[id], used = [].concat(...s.groups.map((g) => g.lines || []), s.kpis.map((k) => k.m), s.card || []);
    AN[id].forEach((k) => ok(!s.metrics[k] && used.indexOf(k) < 0, id + '.' + k + ': số không có trường trong eform không hiện'));
  });
  const allCards = (id) => groupCards(S[id]).map((x) => x.c);
  /* VHTT 08-CT: không tách hoàn thành đúng hạn / chậm (eform không có ngày hoàn thành thực tế) */
  const rowsOf = (c) => { const f = c.items || c.rows; return typeof f === 'function' ? f() : []; };
  const vh = allCards('ubnd-vhtt').filter((c) => c.items || c.rows || c.head);
  ok(vh.every((c) => !/đúng hạn|chậm/i.test(JSON.stringify(c.head || []) + JSON.stringify(rowsOf(c)))),'VHTT 08-CT: không có nhóm "hoàn thành đúng hạn / chậm"');
  const ctSh = allCards('ubnd-vhtt').find((c) => c.t === 'Nhiệm vụ theo tiến độ');
  ok(ctSh && ctSh.items().reduce((a, r) => a + r[1], 0) === run('VHTT_SUM').ct08.tong, 'VHTT 08-CT: các nhóm tiến độ cộng lại = tổng số nhiệm vụ');
  /* NN&MT: không còn đường kế hoạch, không còn cột "Hộ"; biểu đồ theo tháng ghi rõ tháng báo cáo */
  const nn = allCards('ubnd-nnmt');
  ok(nn.every((c) => !/kế hoạch/i.test((c.t || '') + (c.l2 || ''))), 'NN&MT: không còn thẻ, đường kế hoạch tự đặt');
  ok(nn.every((c) => !(c.head || []).some((h) => /^Hộ$/.test(h))), 'NN&MT: không còn cột số hộ');
  const htT = nn.find((c) => c.t === 'Lượt người được hỗ trợ theo tháng');
  ok(htT && /tháng báo cáo/.test(run('ctmText')(htT.hint)) && !/bắt đầu đợt/.test(run('ctmText')(htT.hint).replace('ngày bắt đầu đợt', '')), 'NN&MT: lượt người theo tháng xếp theo tháng báo cáo');
  /* Xây dựng: số chính = diện tích hoàn thành; không có danh sách theo tuyến metro */
  const sx = run('SXD_SUM').nha;
  ok(Math.abs(sx.sanTong - sx.sanTT[2]) < 1 && S['ubnd-xaydung'].metrics.san && run('ctmOvLines')(S['ubnd-xaydung']).some((x) => /hoàn thành/.test(x.l) && Math.abs(Number(String(x.v).replace(/\./g, '').replace(',', '.')) - sx.sanTT[2]) < 1),
    'Xây dựng: "Diện tích sàn nhà ở hoàn thành" = đúng tình trạng Đã hoàn thành (không cộng 4 tình trạng)');
  ok(allCards('ubnd-xaydung').every((c) => (c.head || [])[0] !== 'Tuyến'), 'Xây dựng: không hiện số theo tuyến metro (eform không có trường «Tuyến»)');
  const ttCard = allCards('ubnd-xaydung').find((c) => c.t === 'Diện tích sàn theo tình trạng');
  ok(ttCard && ttCard.type === 'list' && /không cộng/.test(run('ctmText')(ttCard.hint)), 'Xây dựng: 4 tình trạng hiện riêng, ghi rõ không cộng');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
