/* Kiểm tra số giả lập Sở Y tế (4 eform → 4 chỉ tiêu): tử số ≤ mẫu số; tổng = cộng 126 phường/xã; bậc độ lớn sát số thật.
   Chạy: node tests/syt/syt.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/xa-dan-so.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/syt-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=SYT_SUM;this.CT=SYT_CT;this.IT=SYT_ITEMS;this.U=SYT_UNITS;this.DV=SYT_DV;this.VDV=VPUB_DV;this.D=SYT_DICH;this.B=SYT_BENH;this.N=SYT_NGO_DOC;this.XA_DAN_SO_T=XA_DAN_SO;', ctx);
const { S, CT, IT, U, DV, VDV, D, B, N } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const n = 126, p = (a, b) => a / b * 100;

ok(IT.length === 4 && CT.length === 4, '4 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp SYT_CT'));
ok(DV.length === n && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
/* mẫu số tỷ lệ = dân số thật (js/core/xa-dan-so.js), khớp cột Dân số của bảng 126 xã, phường (20/10/2026) */
ok(U.every((u) => u.dan === ctx.XA_DAN_SO_T[u.ten]), 'dân số eform từng phường/xã = dân số thật');
ok(S.bh.dan === 8818383 && S.hs.dan === 8818383, 'tổng dân số = 8.818.383 (126 phường/xã)');
// 1. ngộ độc
ok(N.every((v) => DV.indexOf(v[1]) >= 0 && v[5] <= v[4] && v[6] <= v[5] && v[2] >= 1 && v[2] <= 9), 'ngộ độc: địa bàn đúng danh mục, tử vong ≤ nặng ≤ mắc, trong 9 tháng');
ok(S.nd.mac === sum(N.map((v) => v[4])) && sum(S.nd.thangMac) === S.nd.mac && sum(S.nd.nguyenNhan.map((r) => r[1])) === S.nd.mac, 'ngộ độc: tổng theo tháng, theo nguyên nhân = tổng người mắc');
// 2, 4. tỷ lệ
ok(U.every((u) => u.bhyt.every((v) => v <= u.dan) && u.hssk.every((v) => v <= u.dan)), 'BHYT, hồ sơ sức khỏe: số người ≤ dân số');
ok(S.bh.bhyt === sum(U.map((u) => u.bhyt[8])) && S.hs.hssk === sum(U.map((u) => u.hssk[8])), 'tổng = cộng 126 phường/xã');
ok(S.bh.xuHuong.every((v, i) => !i || v >= S.bh.xuHuong[i - 1]) && S.hs.xuHuong.every((v, i) => !i || v >= S.hs.xuHuong[i - 1]), 'tỷ lệ theo tháng không giảm');
ok(sum(S.bh.nhom.map((g) => g[1])) === n && sum(S.hs.nhom.map((g) => g[1])) === n, 'các nhóm phường/xã cộng lại = 126');
// 3. dịch bệnh
ok(B.every((b, i) => D.ca[i].every((t, m) => sum(t) === b[2][m])), 'dịch bệnh: chia về phường/xã cộng lại đúng tổng từng tháng');
ok(B.every((b, i) => D.caDv[i].every((v, j) => D.nang[i][j] <= v && D.tuVong[i][j] <= D.nang[i][j])), 'dịch bệnh: tử vong ≤ nặng ≤ mắc từng phường/xã');
ok(S.dich.ca === sum(B.map((b) => sum(b[2]))) && S.dich.nhomA === 0, 'tổng ca = cộng các bệnh; nhóm A không có ca');
ok([S.bh.thap, S.hs.thap].every((a) => a.length === 10 && a.every((r, i) => !i || r[1] >= a[i - 1][1])) && S.dich.sxhTop.every((r, i) => !i || r[1] <= S.dich.sxhTop[i - 1][1]), 'danh sách 10 xếp đúng chiều');
// bậc độ lớn sát số thật
ok(S.bh.dan > 8.6e6 && S.bh.dan < 9.2e6, 'dân số (gồm tạm trú) ~ 8,9 triệu');
ok(p(S.bh.bhyt, S.bh.dan) > 96.25 && p(S.bh.bhyt, S.bh.dan) < 96.8 && S.bh.bhyt > 8.4e6 && S.bh.bhyt < 8.8e6, 'BHYT 96,25 – 96,8%, ~8,6 triệu người (7/2026: 96,33%)');
ok(p(S.hs.hssk, S.hs.dan) > 98.8 && p(S.hs.hssk, S.hs.dan) < 100 && S.hs.xuHuong[5] > 98, 'hồ sơ sức khỏe điện tử gần 99% từ cuối quý II');
const ca7 = (i) => sum(B[i][2].slice(0, 7)), ca8 = (i) => sum(B[i][2].slice(0, 8));
ok(ca7(0) > 3000 && ca7(0) < 4200, 'tay chân miệng đến tháng 7 ~ 3.951 ca');
ok(ca8(1) > 600 && ca8(1) < 1000 && S.dich.sxhDv >= 100 && S.dich.sxhDv <= 120, 'sốt xuất huyết đến tháng 8 ~ 871 ca, ~111 phường/xã');
ok(sum(B[3][2]) > 300 && sum(B[3][2]) < 400 && sum(B[4][2]) < 15, 'sởi ~ 350 ca, ho gà vài ca');
ok(S.nd.vu <= 10 && S.nd.mac < 300, 'ngộ độc: vài vụ, dưới 300 người mắc (cả nước 2025: 84 vụ)');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
