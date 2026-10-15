/* Kiểm tra số giả lập Ban Quản lý các Khu công nghệ cao và Khu công nghiệp luôn khớp: tổng = cộng các địa bàn / các quý.
   Chạy: node tests/bql/bql.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/bql-config.js'), 'utf8') +
  '\n;this.S=BQL_SUM;this.CT=BQL_CT;this.IT=BQL_ITEMS;this.U=BQL_UNITS;this.DB=BQL_DB;this.HT=BQL_HT;this.MT=BQL_MT;this.DT=BQL_DOI_TAC;', ctx);
const { S, CT, IT, U, DB, HT, MT, DT } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);

ok(IT.length === 3 && CT.length === 3, '3 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp BQL_CT'));
CT.forEach((c) => c.f.forEach((x) => ok(x.so && x.truong && x.cach && x.kq && !/undefined|NaN/.test(x.kq), c.key + ': cách tính "' + x.so + '" đủ 4 ý')));
// Địa bàn: phải nằm trong danh mục 126 phường/xã của eform
const VPUB_SRC = fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8');
const dm = vm.runInNewContext(VPUB_SRC.slice(VPUB_SRC.indexOf('const VPUB_DV'), VPUB_SRC.indexOf('];', VPUB_SRC.indexOf('const VPUB_DV')) + 2).replace('const VPUB_DV =', '') );
ok(dm.length === 126, 'danh mục 126 phường/xã đọc được');
ok(DB.every((r) => dm.indexOf(r[0]) >= 0), 'mọi địa bàn có trong danh mục Địa bàn của eform');
ok(new Set(DB.map((r) => r[0])).size === DB.length && S.db === DB.length, 'địa bàn không trùng');
ok(U.every((u) => u.ht >= 0 && u.ht < HT.length && u.mt >= 0 && u.mt < MT.length), 'hạ tầng, môi trường đúng danh mục');
// 1. Doanh nghiệp, vốn, lao động: số thời điểm
['dn', 'von', 'ld'].forEach((k) => {
  [0, 1, 2].forEach((q) => ok(S.dn[k + 'Q'][q] === sum(U.map((u) => u[k][q])), k + ' quý ' + (q + 1) + ' = cộng địa bàn'));
  ok(S.dn[k] === S.dn[k + 'Q'][2], k + ': số hiển thị = quý III (không cộng quý)');
  ok(U.every((u) => u[k][0] <= u[k][1] && u[k][1] <= u[k][2] && u[k][0] >= 0), k + ': không giảm qua các quý, không âm');
});
ok(U.every((u, i) => u.dn[2] === DB[i][1] && u.von[2] === DB[i][2] && u.ld[2] === DB[i][3]), 'quý III đúng số khai báo BQL_DB');
ok(S.dn.xepDn.length === U.length && sum(S.dn.xepDn.map((r) => r[1])) === S.dn.dn, 'biểu đồ DN theo địa bàn cộng lại = tổng');
ok(sum(S.dn.xepVon.map((r) => r[1])) === S.dn.von, 'biểu đồ vốn theo địa bàn cộng lại = tổng');
ok(S.dn.doiTac.every((v) => v >= 0 && v <= U.length) && S.dn.doiTac.length === DT.length, 'nhà đầu tư chính: số địa bàn hợp lệ');
ok(U.every((u) => DT.some((g) => u.doiTac.toLowerCase().indexOf(g[0].toLowerCase()) >= 0)), 'mỗi địa bàn có ít nhất 1 nhóm nhà đầu tư được nhận ra');
// 2. Thu hút đầu tư: số trong kỳ, cộng 3 quý
[['tl', 'tlQ'], ['da', 'daQ'], ['vm', 'vmQ']].forEach(([k, kq]) => {
  [0, 1, 2].forEach((q) => ok(S.thuHut[kq][q] === sum(U.map((u) => u[k][q])), k + ' quý ' + (q + 1) + ' = cộng địa bàn'));
  ok(S.thuHut[k] === sum(S.thuHut[kq]), k + ': 9 tháng = cộng 3 quý');
});
ok(U.every((u) => u.da.every((d, q) => d <= u.tl[q] && (d > 0 || u.vm[q] === 0))), 'dự án mới ≤ lượt thành lập, điều chỉnh; không dự án thì không vốn');
ok(sum(S.thuHut.xepVm.map((r) => r[1])) === S.thuHut.vm && sum(S.thuHut.xepDa.map((r) => r[1])) === S.thuHut.da, 'biểu đồ theo địa bàn cộng lại = tổng');
ok(Math.abs(S.thuHut.vmBq - S.thuHut.vm / S.thuHut.da) < 1e-9, 'vốn bình quân = vốn ÷ dự án');
ok(S.thuHut.ganNhat.length === 6 && S.thuHut.ganNhat.every((u, i) => !i || u.vm[2] <= S.thuHut.ganNhat[i - 1].vm[2]) && S.thuHut.ganNhat.every((u) => u.ndGanNhat), '6 nội dung gần nhất, xếp giảm theo vốn quý III');
// 3. Hạ tầng, sản xuất kinh doanh, môi trường
[['dt', 'dtQ'], ['vh', 'vhQ']].forEach(([k, kq]) => {
  [0, 1, 2].forEach((q) => ok(S.sxkd[kq][q] === sum(U.map((u) => u[k][q])), k + ' quý ' + (q + 1) + ' = cộng địa bàn'));
  ok(S.sxkd[k] === sum(S.sxkd[kq]), k + ': 9 tháng = cộng 3 quý');
});
ok(sum(S.sxkd.xepDt.map((r) => r[1])) === S.sxkd.dt, 'biểu đồ doanh thu theo địa bàn cộng lại = tổng');
ok(sum(S.sxkd.ht) === U.length && sum(S.sxkd.mt) === U.length, 'hạ tầng, môi trường: cộng lại = số địa bàn');
ok(Math.abs(S.sxkd.dtLd - S.sxkd.dt * 1000 / S.dn.ld) < 1e-9, 'doanh thu bình quân = doanh thu × 1.000 ÷ lao động quý III');
ok(U.every((u) => u.ht !== 2 || sum(u.vh) < 30), 'hạ tầng chưa triển khai thì vốn hạ tầng nhỏ');
// Biểu đồ gộp theo địa bàn: 2 số mỗi hàng khớp số của địa bàn, xếp giảm theo số chính, cộng lại = tổng
const byTen = {}; U.forEach((u) => { byTen[u.ten] = u; });
[['dn', S.dn.hang, (u) => u.dn[2], (u) => u.von[2], S.dn.dn, S.dn.von],
 ['thuHut', S.thuHut.hang, (u) => sum(u.vm), (u) => sum(u.da), S.thuHut.vm, S.thuHut.da],
 ['sxkd', S.sxkd.hang, (u) => sum(u.dt), (u) => sum(u.vh), S.sxkd.dt, S.sxkd.vh]].forEach(([k, H, fa, fb, ta, tb]) => {
  ok(H.every((r) => r[1] === fa(byTen[r[0]]) && r[2] === fb(byTen[r[0]])), k + ' gộp: 2 số mỗi hàng đúng của địa bàn');
  ok(H.every((r, i) => !i || r[1] <= H[i - 1][1]), k + ' gộp: xếp giảm theo số chính');
  ok(sum(H.map((r) => r[1])) === ta && sum(H.map((r) => r[2])) === tb, k + ' gộp: cộng các hàng = tổng');
});
ok(S.thuHut.hang.every((r) => r[2] > 0) && S.thuHut.hang.length === S.thuHut.xepDa.length, 'thuHut gộp: chỉ địa bàn có dự án mới');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
