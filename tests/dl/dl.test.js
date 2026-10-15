/* Kiểm tra số giả lập Sở Du lịch luôn khớp: tổng = cộng các phường/xã = cộng các tháng = cộng các loại điểm.
   Chạy: node tests/dl/dl.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/dl-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=DL_SUM;this.CT=DL_CT;this.IT=DL_ITEMS;this.U=DL_UNITS;this.DV=DL_DV;this.L=DL_LOAI;this.VDV=VPUB_DV;', ctx);
const { S, CT, IT, U, DV, L, VDV } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const K = S.khach, T = S.doanhThu;

ok(IT.length === 2 && CT.length === 2, '2 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp DL_CT'));
// Đơn vị: đúng danh mục eform (trùng danh mục Văn phòng UBND)
ok(DV.length === 126 && new Set(DV).size === 126 && DV.every((n, i) => n === VDV[i]), '126 phường/xã, đúng danh mục eform');
ok(L.length === 8, '8 loại điểm du lịch (DL01–DL08)');
ok(U.every((u) => u.loai.length === 8 && u.loai.some(Boolean)), 'mỗi đơn vị có ít nhất 1 loại điểm');
ok(U.every((u) => u.loai.every((x) => !x || ['qt', 'nd', 'tong', 'ltau', 'lh'].every((f) => x[f].length === 9 && x[f].every((v) => Number.isInteger(v) && v >= 0)))), 'mọi bản ghi: 9 tháng, số nguyên không âm');
// 1. Khách
ok(K.qt === sum(K.qtT) && K.nd === sum(K.ndT) && K.tong === K.qt + K.nd, 'khách: 9 tháng = cộng các tháng');
ok(K.khT.every((v, m) => v === K.qtT[m] + K.ndT[m]), 'khách theo tháng = quốc tế + nội địa');
ok(K.qt === sum(U.map((u) => u.qt)) && K.nd === sum(U.map((u) => u.nd)), 'khách: tổng = cộng 126 phường/xã');
ok(sum(K.qtLoai) === K.qt && sum(K.ndLoai) === K.nd, 'khách: cộng 8 loại điểm = tổng');
ok(K.top.length === 15 && K.top.every((r, i) => !i || r[1] + r[2] <= K.top[i - 1][1] + K.top[i - 1][2]), '15 đơn vị đông khách nhất, xếp giảm');
ok(K.banGhi === sum(U.map((u) => u.loai.filter(Boolean).length)) * 9, 'số bản ghi eform 1 = đơn vị × loại điểm × 9 tháng');
ok(K.t9 === K.khT[8] && K.t8 === K.khT[7], 'thẻ tháng 9, tháng 8');
// 2. Doanh thu
ok(T.tong === sum(T.tongT) && T.ltau === sum(T.ltauT) && T.lh === sum(T.lhT), 'doanh thu: 9 tháng = cộng các tháng');
ok(T.tong === sum(U.map((u) => u.tong)) && T.ltau === sum(U.map((u) => u.ltau)) && T.lh === sum(U.map((u) => u.lh)), 'doanh thu: tổng = cộng 126 phường/xã');
ok(sum(T.tongLoai) === T.tong, 'tổng thu: cộng 8 loại điểm = tổng');
ok(U.every((u) => u.loai.every((x) => !x || x.tong.every((t, m) => x.ltau[m] + x.lh[m] <= t))), 'từng bản ghi: lưu trú, ăn uống + lữ hành ≤ tổng thu (DT03 là tổng)');
ok(T.khac === T.tong - T.ltau - T.lh && T.khacT.every((v, m) => v === T.tongT[m] - T.ltauT[m] - T.lhT[m] && v >= 0), 'dịch vụ khác = tổng thu − lưu trú, ăn uống − lữ hành, không âm');
ok(T.banGhi === K.banGhi * 3, 'số bản ghi eform 2 = eform 1 × 3 loại doanh thu');
ok(Math.abs(T.chiBq - T.tong * 1000 / K.tong) < 1e-9, 'chi tiêu bình quân = tổng thu ÷ lượt khách');
ok(T.top.length === 15 && T.top.every((r, i) => !i || r[1] <= T.top[i - 1][1]), '15 đơn vị tổng thu lớn nhất, xếp giảm');
// Số giả lập trong khoảng hợp lý (Hà Nội 9 tháng)
ok(K.tong > 15e6 && K.tong < 30e6 && K.tyQt > 15 && K.tyQt < 30, 'lượt khách, tỷ lệ quốc tế trong khoảng hợp lý');
ok(T.tong / 1000 > 60000 && T.tong / 1000 < 110000, 'tổng thu (tỷ đồng) trong khoảng hợp lý');
ok(K.top[0][0] === 'Phường Hoàn Kiếm', 'Hoàn Kiếm đông khách nhất');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
