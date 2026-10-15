/* Kiểm tra số giả lập Sở VHTT luôn khớp: tổng = cộng các phân tổ. Chạy: node tests/vhtt/vhtt.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/vhtt-config.js'), 'utf8') + '\n;this.D=VHTT_DATA;this.S=VHTT_SUM;this.CT=VHTT_CT;this.IT=VHTT_ITEMS;', ctx);
const { D, S, CT, IT } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const sumCol = (rows, i) => sum(rows.map((r) => r[i]));

ok(IT.length === 6 && CT.length === 6, '6 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp VHTT_CT'));
CT.forEach((c) => c.f.forEach((x) => ok(x.so && x.truong && x.cach && x.kq && !/undefined|NaN/.test(x.kq), c.key + ': cách tính "' + x.so + '" đủ 4 ý')));
// 1. 08-CT
ok(S.ct08.tong === 48 && sum(S.ct08.st) === S.ct08.tong, '08-CT: tổng = cộng 5 nhóm');
ok(D.ct08.htLk[8] === S.ct08.ht, '08-CT: lũy kế tháng 9 = số đã hoàn thành');
ok(D.ct08.khLk[8] === S.ct08.ht + S.ct08.quaHan, '08-CT: đến hạn = đã hoàn thành + quá hạn');
ok(D.ct08.khLk.every((v, i) => v >= D.ct08.htLk[i]) && D.ct08.htLk.every((v, i) => !i || v >= D.ct08.htLk[i - 1]), '08-CT: lũy kế không giảm, thực tế ≤ kế hoạch');
// 2. Dự án
ok(sum(D.duan.td.map((r) => r[1])) === S.duan.da, 'Dự án: tiến độ cộng lại = số dự án');
ok(D.duan.nhom.every((r) => r[2] <= r[1] && r[4] <= r[3]), 'Dự án: đã bố trí ≤ theo NQ 80');
// 3. Người tham gia
ok(sum(D.ntg.thangHd) === S.ntg.hd && sum(D.ntg.thangNguoi) === S.ntg.nguoi, 'NTG: cộng các tháng = tổng');
['quyMo', 'cap', 'doiSoat'].forEach((k) => ok(sumCol(D.ntg[k], 1) === S.ntg.hd, 'NTG: ' + k + ' cộng lại = số hoạt động'));
// 4. Doanh thu
ok(sum(D.dt.thangDt) === S.dt.tong && sum(D.dt.thangCp) === S.dt.cp, 'DT: cộng các tháng = tổng doanh thu, chi phí');
ok(sumCol(D.dt.hachToan, 1) === S.dt.tong, 'DT: theo trạng thái hạch toán cộng lại = tổng');
ok(sum(S.dt.khoan) === S.dt.tong, 'DT: 4 khoản cộng lại = tổng');
ok(sumCol(D.dt.tinhChat, 1) === D.dt.soChuongTrinh, 'DT: tính chất cộng lại = số chương trình');
// 5. NT chuyên nghiệp
ok(S.ntcn.tong === 186 && sum(S.ntcn.thang) === S.ntcn.tong, 'NTCN: cộng các tháng = tổng');
['tinhChat', 'quyMo', 'ngheThuat', 'hinhThuc'].forEach((k) => ok(sumCol(D.ntcn[k], 1) === S.ntcn.tong, 'NTCN: ' + k + ' cộng lại = tổng'));
// 6. Báo chí
ok(sum(S.bc.nguonTong) === S.bc.tong && sum(D.bc.thangTong) === S.bc.tong, 'BC: theo nguồn, theo tháng = tổng');
ok(sum(D.bc.thangTc) === S.bc.cx[0] && sum(D.bc.thangTieuCuc) === S.bc.cx[2], 'BC: tháng tích cực/tiêu cực khớp');
ok(sumCol(D.bc.linhVuc, 1) === S.bc.tong && sumCol(D.bc.uuTien, 1) === S.bc.cx[2], 'BC: lĩnh vực = tổng; ưu tiên = số tiêu cực');
ok(D.bc.coDiaBan <= S.bc.tong, 'BC: tin có địa bàn ≤ tổng');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
