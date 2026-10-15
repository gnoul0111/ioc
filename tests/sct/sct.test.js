/* Kiểm tra số giả lập Sở Công Thương (5 eform): tổng = cộng phường/xã = cộng tháng = cộng phân tổ; bậc độ lớn sát số thật.
   Chạy: node tests/sct/sct.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/sct-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=SCT_SUM;this.CT=SCT_CT;this.IT=SCT_ITEMS;this.U=SCT_UNITS;this.DV=SCT_DV;this.VDV=VPUB_DV;this.TM=SCT_TMDT;this.NG=SCT_NGANH;', ctx);
const { S, CT, IT, U, DV, VDV, TM, NG } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const near = (a, b, e) => Math.abs(a - b) < (e || 0.05);

ok(IT.length === 5 && CT.length === 5, '5 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp SCT_CT'));
ok(DV.length === 126 && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
ok(IT.every((it) => it[4].every((p) => p.items.every((x) => !/QĐ\s*4795|CĐS\)|mã\s*\d/i.test(x.label)))), 'không hiện mã chỉ tiêu trên giao diện');
// 1. Xuất nhập khẩu
const X = S.xnk;
ok(X.xk === sum(U.map((u) => u.xk)) && X.nk === sum(U.map((u) => u.nk)), 'xuất, nhập khẩu = cộng phường/xã');
ok(sum(X.xkT) === X.xk && sum(X.nkT) === X.nk && sum(X.ttXk) === X.xk && sum(X.ttNk) === X.nk && sum(X.nganh) === X.xk, 'theo tháng, thị trường, ngành cộng lại = tổng');
ok(X.xk / 1000 > 14 && X.xk / 1000 < 19 && X.nk / 1000 > 33 && X.nk / 1000 < 43 && X.nk > X.xk, 'bậc độ lớn 9 tháng sát số 2025 (20,65 / 47,12 tỷ USD cả năm), nhập siêu');
// 2. Bán lẻ
const B = S.bl;
ok(B.tong === B.banLe + B.dichVu && sum(B.blT) === B.banLe && sum(B.dvT) === B.dichVu && sum(B.tongT) === B.tong, 'bán lẻ: cộng tháng khớp');
ok(Math.abs(sum(B.lh) - B.tong) <= 7, 'bán lẻ: theo loại hình cộng lại ≈ tổng (làm tròn)');
ok(B.tong / B.ck > 1.08 && B.tong / B.ck < 1.15, 'tăng 8 – 15% so cùng kỳ (2025: +12,6%)');
ok(B.top[0][0] === 'Phường Hoàn Kiếm', 'Hoàn Kiếm doanh thu bán lẻ lớn nhất');
// 3. Thương mại điện tử
ok(S.tmdt.tong.every((v, i) => v === TM[i][1]) && U.every((u) => u.tmdtDat.every((v, i) => v <= u.tmdtTong[i] && v >= 0)), 'TMĐT: tổng đối tượng khớp, đạt ≤ tổng');
ok(S.tmdt.tl.every((v) => v > 30 && v < 99) && S.tmdt.tlPX.every((r) => r[0] > r[1]), 'TMĐT: tỷ lệ hợp lý, phường cao hơn xã');
// 4. Năng lượng
const N = S.nl;
ok(sum(N.dienT) === N.dien && sum(N.xdT) === Math.round(N.xangDau), 'năng lượng: cộng tháng khớp');
ok(N.dien / 273 > 60 && N.dien / 273 < 80, 'điện bình quân 60 – 80 triệu kWh/ngày (2025: >67)');
ok(N.xangDau / 9 > 130 && N.xangDau / 9 < 165, 'xăng dầu ~146.500 m³/tháng');
ok(N.lhdv.every((r) => near(sum(r), 1, 1e-9)), 'tỷ trọng loại hình đơn vị cộng = 100%');
// 5. Sản xuất công nghiệp
const I = S.iip;
ok(I.gtsx === sum(U.map((u) => u.gtsx)) && I.gtsx === sum(I.nganhGt), 'giá trị sản xuất: cộng phường/xã, cộng ngành khớp');
ok(near(sum(NG.map((x) => x[1])), 1, 1e-9) && I.chung > 104 && I.chung < 111, 'IIP chung 104 – 111% (2025: +6,9%), tỷ trọng ngành = 100%');
ok(I.thang[1] < 90 && I.thang.length === 9, 'IIP tháng 2 thấp do Tết');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
