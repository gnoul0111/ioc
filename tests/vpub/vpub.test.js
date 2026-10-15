/* Kiểm tra số giả lập Văn phòng UBND Thành phố luôn khớp: tổng = cộng các phân tổ. Chạy: node tests/vpub/vpub.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.D=VPUB_DATA;this.S=VPUB_SUM;this.CT=VPUB_CT;this.IT=VPUB_ITEMS;this.U=VPUB_UNITS;this.DV=VPUB_DV;this.NV=VPUB_NV_DIABAN;', ctx);
const { D, S, CT, IT, U, DV, NV } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);

ok(IT.length === 5 && CT.length === 5, '5 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp VPUB_CT'));
CT.forEach((c) => c.f.forEach((x) => ok(x.so && x.truong && x.cach && x.kq && !/undefined|NaN/.test(x.kq), c.key + ': cách tính "' + x.so + '" đủ 4 ý')));
// Đơn vị: đúng danh mục eform
ok(DV.length === 126 && new Set(DV).size === 126, '126 phường/xã, không trùng');
ok(DV.filter((n) => n.indexOf('Phường') === 0).length === 51, '51 phường, 75 xã');
// 1. Chỉ số 27
[0, 1, 2].forEach((q) => {
  ok(S.cs27.tong[q] === sum(U.map((u) => u.vbTong[q])) + D.cs27.soTong[q], 'CS27 quý ' + (q + 1) + ': tổng = phường/xã + sở');
  ok(S.cs27.mang[q] === sum(U.map((u) => u.vbMang[q])) + D.cs27.soMang[q], 'CS27 quý ' + (q + 1) + ': trên mạng = phường/xã + sở');
  ok(U.every((u) => u.vbMang[q] <= u.vbTong[q]) && D.cs27.soMang[q] <= D.cs27.soTong[q], 'CS27 quý ' + (q + 1) + ': trên mạng ≤ tổng');
});
ok(sum(S.cs27.nhom) === 126, 'CS27: 4 nhóm tỷ lệ cộng lại = 126');
ok(S.cs27.thapNhat.length === 10 && S.cs27.thapNhat.every((r, i) => !i || r[1] >= S.cs27.thapNhat[i - 1][1]), 'CS27: 10 đơn vị thấp nhất, xếp tăng dần');
// 2. Chỉ số 29
ok(sum(S.cs29.app) === S.cs29.tla && sum(S.cs29.dt) === S.cs29.tla, 'CS29: ứng dụng, đối tượng cộng lại = số đã triển khai');
ok(S.cs29.phuong[0] + S.cs29.xa[0] === S.cs29.tla && S.cs29.phuong[1] + S.cs29.xa[1] === 126, 'CS29: phường + xã khớp');
ok(U.every((u) => u.tla ? u.app >= 0 && u.doiTuong >= 0 : u.app === -1 && u.doiTuong === -1), 'CS29: chưa triển khai thì không có ứng dụng');
// 3. Chỉ số 74
ok(S.cs74.tong === 1286 && sum(S.cs74.st) === S.cs74.tong, 'CS74: tổng = cộng 6 trạng thái');
const g4 = D.cs74.nhom4.map((_, i) => sum(D.cs74.chuTri.map((r) => r[1][i])));
ok(g4[0] === S.cs74.st[0] + S.cs74.st[1] && g4[1] === S.cs74.st[2] + S.cs74.st[3] && g4[2] === S.cs74.st[4] && g4[3] === S.cs74.st[5], 'CS74: đơn vị chủ trì cộng lại khớp 4 nhóm trạng thái');
ok(sum(D.cs74.thangGiao) === S.cs74.tong && sum(D.cs74.thangHt) === S.cs74.ht, 'CS74: cộng theo tháng = tổng giao, tổng hoàn thành');
ok(S.cs74.lkHt.every((v, i) => v <= S.cs74.lkGiao[i]), 'CS74: lũy kế hoàn thành ≤ lũy kế giao');
ok(sum(NV) === D.cs74.coDiaBan && D.cs74.coDiaBan <= S.cs74.tong && NV.length === 126, 'CS74: nhiệm vụ có địa bàn chia đủ cho 126 đơn vị');
ok(D.cs74.sapDenHan <= S.cs74.st[2] + S.cs74.st[3], 'CS74: sắp đến hạn ≤ số chưa hoàn thành trong hạn');
// 4. Chỉ số 52
const h = S.cs52.hs;
['tn', 'dh', 'qh', 'tt', 'tttt', 'sh'].forEach((k) => {
  ok(h[k] === sum(S.cs52.quy.map((o) => o[k])), 'CS52 ' + k + ': cộng 3 quý = tổng');
  ok(h[k] === S.cs52.cap[0][k] + S.cs52.cap[1][k], 'CS52 ' + k + ': phường + xã = tổng');
});
ok(U.every((u) => u.hs.every((x) => x.dh + x.qh <= x.tn && x.tt <= x.tn && x.tttt <= x.tt && x.sh <= x.tn)), 'CS52: từng bản ghi hợp lệ (đúng + quá hạn ≤ tiếp nhận…)');
ok(h.dangGq === h.tn - h.dh - h.qh && h.dangGq >= 0, 'CS52: chưa có kết quả trong kỳ = tiếp nhận − đúng hạn − quá hạn');
ok(h.daGq === h.dh + h.qh && IT[3][4][0].items.length === 2, 'CS52: vòng kết quả chỉ 2 phần đúng hạn, quá hạn (BA 06)');
ok(h.hl >= 80 && h.hl <= 98, 'CS52: điểm hài lòng trong khoảng sinh số');
// 5. Chỉ số 11, 12
const s11 = S.cs1112;
ok(sum(s11.tt) === s11.tong && sum(s11.loaiTong) === s11.tong, 'CS11-12: tình trạng, loại hạ tầng cộng lại = tổng');
const gb = s11.loai.find((r) => r[0] === 'Hệ thống giao ban trực tuyến');
/* BA mục 04: «Số lượng» dòng giao ban là số hệ thống, không phải số phòng */
ok(sum(gb[1]) === sum(U.map((u) => u.htGb)) && sum(gb[2]) === D.cs1112.soHtGb, 'CS11-12: số hệ thống giao ban tính riêng, không lấy số phòng (BA 04)');
ok(U.every((u) => (u.phongTb > 0) === (u.htGb > 0)), 'CS11-12: có phòng được trang bị thì có hệ thống và ngược lại');
/* BA mục 03: mỗi cặp đơn vị × loại hạ tầng một lượt đánh giá */
ok(sum(D.cs1112.dapUngXa) <= 126 * D.cs1112.loai.length, 'CS11-12: lượt đánh giá đáp ứng cấp xã ≤ 126 đơn vị × số loại hạ tầng (BA 03)');
ok(gb[1].every((v) => v >= 0) && gb[2].every((v) => v >= 0), 'CS11-12: giao ban không âm');
ok(s11.tbXa === sum(U.map((u) => u.phongTb)) && s11.phXa === sum(U.map((u) => u.phongHop)) && U.every((u) => u.phongTb <= u.phongHop), 'CS11-12: phòng họp phường/xã khớp, trang bị ≤ tổng');
ok(s11.phong === s11.phXa + D.cs1112.soPhongHop && s11.phongTb === s11.tbXa + D.cs1112.soPhongTb, 'CS11-12: phòng họp 2 cấp cộng lại');
ok(sum(s11.dapUng) === CT[4].soBanGhi, 'CS11-12: số bản ghi = số lượt đánh giá đáp ứng');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
