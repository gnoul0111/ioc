'use strict';
/* Kiểm thử lớp dữ liệu STC bằng Node: nạp cấu hình + bản chụp thật + dữ liệu thử vào một context giả trình duyệt. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p.replace(/\\\\/g, '/')), 'utf8');

function makeCtx(demo) {
  const win = {};
  const ctx = vm.createContext({ window: win, location: { search: demo ? '?stcdemo=1' : '' }, console, setInterval, clearInterval, Promise, document: {} });
  vm.runInContext(read('js\\core\\stc-config.js').replace('const STC_DEMO_DEFAULT = true;', 'const STC_DEMO_DEFAULT = false;'), ctx, { filename: 'stc-config.js' });
  vm.runInContext(read('js\\data\\stc-snapshot.js'), ctx, { filename: 'stc-snapshot.js' });
  if (demo) vm.runInContext(read('js\\features\\stc-demo-data.js'), ctx, { filename: 'stc-demo-data.js' });
  vm.runInContext(read('js\\features\\stc-data.js'), ctx, { filename: 'stc-data.js' });
  return ctx;
}
let pass = 0, failn = 0;
function ok(cond, msg) { if (cond) { pass++; } else { failn++; console.log('  ✗ ' + msg); } }
function near(a, b, eps) { return a != null && Math.abs(a - b) <= (eps || 0.06); }
const run = (ctx, code) => vm.runInContext(code, ctx);

/* ===== 1. Bản chụp THẬT Q1/2026 ===== */
console.log('== Bản chụp thật Q1/2026');
let c = makeCtx(false);
ok(run(c, 'stcPeriods().length') === 1, 'có đúng 1 kỳ');
ok(run(c, 'stcLatestPeriod().key') === '2026-1', 'kỳ mới nhất là 2026-1');
const real = run(c, 'stcBuildPeriod(2026,1)');
ok(!!real, 'dựng được kỳ 2026-1');
const st = {}; real.inds.forEach((i) => { st[i.id] = i.state; });
console.log('  trạng thái:', JSON.stringify(st));
ok(st.da === 'ok', 'Dự án trọng điểm có số');
ok(Object.keys(st).filter((k) => k !== 'da').every((k) => st[k] === 'nodata'), '12 chỉ tiêu còn lại: nodata');
ok(real.inds.every((i) => i.unmatched.length === 0), 'mọi dòng API đều nhận diện được (không có dòng lạc)');
const da = real.byId;
ok(da.da_1.now === 50 && da.da_2.now === 45 && da.da_3.now === 30 && da.da_4.now === 20 && da.da_5.now === 10, 'đúng 5 số thật 50/45/30/20/10 theo tên nhóm');
ok(real.inds.every((i) => i.warns.length === 0), 'không có cảnh báo chất lượng');
ok(real.byId.thu.now === 0 && real.byId.thu.prev === 0, 'thu: tổng 0 (giữ nguyên số API)');
ok(run(c, 'stcBuildPeriod(2026,2)') === null, 'kỳ chưa có trả về null');

/* ===== 2. Dữ liệu THỬ ===== */
console.log('== Dữ liệu thử');
c = makeCtx(true);
const d = run(c, 'stcBuildPeriod(2026,1)');
const B = d.byId;
ok(d.inds.every((i) => i.state === 'ok'), 'kỳ 2026-1 thử: 13 chỉ tiêu đều có số');
ok(d.inds.every((i) => i.unmatched.length === 0), 'thử: không có dòng lạc');
ok(d.inds.every((i) => i.warns.length === 0), 'thử: không cảnh báo (' + d.inds.map((i) => i.warns.join('|')).filter(Boolean).join(' ; ') + ')');
ok(B.thu.now === 72320 && B.thu.prev === 63995, 'thu = 72.320 / 63.995 (Kỳ trước lấy theo loai dù quy sai)');
ok(near(run(c, 'stcYoy(stcBuildPeriod(2026,1).byId.thu)'), 13.0), 'thu tăng 13,0%');
ok(B.chi.now === 28600 && B.chi.prev === 24100, 'chi = 28.600 / 24.100 (lấy đúng dòng Tổng chi NS ĐP)');
ok(near(run(c, 'stcYoy(stcBuildPeriod(2026,1).byId.chi)'), 18.7), 'chi tăng 18,7%');
ok(B.chi_tx.now === 15900 && B.chi_tx.apiLabel === 'Chi phát triển thường xuyên', 'chi_tx khớp nhãn API "Chi phát triển thường xuyên"');
ok(B.vdt.now === 53600, 'vốn ĐTPT = Σ 3 nguồn = 53.600');
ok(B.nsnn.now === 13000, 'vốn NSNN = 13.000');
ok(B.iip.now === 108.4 && B.iip_3.now === 106.1, 'IIP toàn ngành + phân ngành điện (nhãn "điều hoà")');
ok(B.bra.now === 1155000 && B.ble.now === 320000, 'bán ra/bán lẻ tổng đúng');
ok(B.vt_1.ck === 112.3 && B.vt_1.now === 12400, 'vận tải hành khách: ước tính + cùng kỳ');
ok(near(B.vt.ck, 112.5, 0.06) && B.vt.derivedCk, 'vận tải: mức tăng chung suy từ 4 nhóm ≈ 112,5');
ok(near(B.dl.ck, 113.7, 0.06), 'du lịch: tăng chung ≈ 113,7');
ok(B.xk.now === 4550 && B.nk.now === 4950, 'XK 4.550, NK 4.950 (2 API riêng)');
ok(near(B.xk.ck, 109.8) && near(B.nk.ck, 105.1), 'XK/NK: tăng chung ≈ 109,8 / 105,1');
ok(B.grdp.now === 255000 && B.grdp_1.cmp === 5900, 'GRDP = 255.000; giá so sánh nông nghiệp = 5.900');
ok(B.gia_1.now === 103.4 && B.gia_2.now === 187.2 && B.gia_3.now === 101.9, 'CPI/vàng/USD');
ok(B.da_1.now === 50, 'dự án trọng điểm (thử) kỳ 1 = số thật');
const d2 = run(c, 'stcBuildPeriod(2026,2)');
ok(d2.byId.dl.state === 'nodata', 'kỳ 2 thử: khách du lịch toàn 0 -> nodata');
ok(d2.byId.thu.state === 'ok', 'kỳ 2 thử: thu có số');
ok(run(c, 'stcPeriods().length') === 2, 'thử có 2 kỳ');

/* ===== 2b. Hai cách so sánh: kỳ trước (quý liền trước) và cùng kỳ năm trước ===== */
console.log('== So kỳ trước / so cùng kỳ');
const D1 = run(c, 'stcBuildPeriod(2026,1)').byId, D2 = d2.byId;
ok(D1.thu.kq == null && run(c, 'stcDeltaKq(stcBuildPeriod(2026,1).byId.thu)') == null, 'Q1/2026: chưa có Q4/2025 nên không so kỳ trước');
ok(D1.thu.cq === 63995 && D1.thu.cqSrc === 'api', 'Q1/2026: cùng kỳ = dòng "Kỳ trước" của API (mang quy Q1/2025)');
ok(D2.thu.now === 77382 && D2.thu.kq === 72320, 'Q2/2026: kỳ trước = kỳ này của bản chụp Q1/2026');
ok(near(run(c, 'stcDeltaKq(stcBuildPeriod(2026,2).byId.thu)'), 7.0), 'thu so kỳ trước +7,0%');
ok(near(run(c, 'stcDeltaCq(stcBuildPeriod(2026,2).byId.thu)'), 20.9), 'thu so cùng kỳ +20,9%');
ok(near(run(c, 'stcDeltaKq(stcBuildPeriod(2026,2).byId.iip)'), 1.2) && run(c, 'stcDeltaUnit(stcBuildPeriod(2026,2).byId.iip,"kq")') === 'điểm', 'IIP so kỳ trước = chênh lệch chỉ số +1,2 điểm');
ok(near(run(c, 'stcDeltaCq(stcBuildPeriod(2026,2).byId.iip)'), 9.6) && run(c, 'stcDeltaUnit(stcBuildPeriod(2026,2).byId.iip,"cq")') === '%', 'IIP so cùng kỳ = chỉ số − 100 = +9,6%');
ok(near(run(c, 'stcDeltaKq(stcBuildPeriod(2026,2).byId.da_1)'), 5) && run(c, 'stcDeltaUnit(stcBuildPeriod(2026,2).byId.da_1,"kq")') === 'điểm %', 'tiến độ dự án so kỳ trước +5 điểm %');
ok(D2.vt_1.cqSrc === 'ck' && near(run(c, 'stcDeltaCq(stcBuildPeriod(2026,2).byId.vt_1)'), 13.5), 'vận tải: cùng kỳ suy từ chỉ số so cùng kỳ (+13,5%)');
ok(near(run(c, 'stcDeltaKq(stcBuildPeriod(2026,2).byId.vt_1)'), 7.0), 'vận tải so kỳ trước +7,0%');
ok(D2.thu.kqLbl === 'Q1/2026' && D2.thu.cqLbl === 'Q2/2025', 'nhãn kỳ so sánh đúng');

/* ===== 3. Định dạng và biên ===== */
console.log('== Định dạng');
ok(run(c, 'stcFmt(1155000)') === '1.155.000', 'stcFmt nghìn');
ok(run(c, 'stcFmt(103.4,1)') === '103,4', 'stcFmt thập phân');
ok(run(c, 'stcSgn(-3.8,1)') === '−3,8' && run(c, 'stcSgn(8.4,1)') === '+8,4', 'stcSgn');
ok(run(c, 'stcSgn(0.02,1)') === '0,0', 'stcSgn làm tròn về 0 không kèm dấu');
ok(run(c, 'stcFmt(null)') === '—', 'null -> —');

/* ===== 4. Cảnh báo chất lượng (dữ liệu hỏng có chủ đích) ===== */
console.log('== Kiểm tra chất lượng');
c = makeCtx(true);
run(c, `(function(){
  const p = window.STC_DEMO_SNAPSHOT.periods['2026-1'].data;
  p.CHI_NGAN_SACH_DIA_PHUONG.find(r=>r.chiTieu==='Chi trả nợ lãi' && r.loai==='Kỳ này').giaTri = 700; // lệch 80 so với dòng tổng
  p.CHI_SO_SXCN.find(r=>r.chichiTieu===undefined && r.chiTieu==='Khai khoáng').giaTri = 8.4;          // ngoài khoảng chỉ số
  p.TONG_HANG_BAN_LE.forEach(r=>r.giaTri=r.giaTri*10);                                                  // bán lẻ > bán ra
  p.DA_TRONG_DIEM.push({chiTieu:'Dòng lạ',giaTri:5,loai:'Nhóm không có trong cấu hình',quy:'Q1/2026'}); // dòng không nhận diện
})()`);
const w = run(c, 'stcBuildPeriod(2026,1)');
ok(w.byId.chi.warns.some((x) => /lệch 80/.test(x)), 'cảnh báo tổng chi lệch 80: ' + JSON.stringify(w.byId.chi.warns));
ok(w.byId.iip.warns.some((x) => /Khai khoáng/.test(x)), 'cảnh báo IIP ngoài khoảng: ' + JSON.stringify(w.byId.iip.warns));
ok(w.byId.ble.warns.some((x) => /lớn hơn/.test(x)), 'cảnh báo bán lẻ > bán ra: ' + JSON.stringify(w.byId.ble.warns));
ok(w.byId.da.unmatched.length === 1 && w.byId.da.warns.some((x) => /không nhận diện/.test(x)), 'cảnh báo dòng lạ: ' + JSON.stringify(w.byId.da.warns));

console.log('\nKết quả: ' + pass + ' đạt, ' + failn + ' lỗi');
process.exit(failn ? 1 : 0);
