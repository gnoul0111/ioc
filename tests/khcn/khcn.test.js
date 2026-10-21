/* Kiểm tra số giả lập Sở Khoa học và Công nghệ (chuyển đổi số cấp xã): tử số ≤ mẫu số; tổng = cộng 126 phường/xã; bậc độ lớn sát số thật.
   Chạy: node tests/khcn/khcn.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/xa-dan-so.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/khcn-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=KHCN_SUM;this.CT=KHCN_CT;this.IT=KHCN_ITEMS;this.U=KHCN_UNITS;this.DV=KHCN_DV;this.VDV=VPUB_DV;', ctx);
const { S, CT, IT, U, DV, VDV } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const H = S.ht, C = S.cn, V = S.vb, n = 126;

ok(IT.length === 3 && CT.length === 3, '3 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp KHCN_CT'));
ok(DV.length === n && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
ok(IT.every((it) => it[4].every((p) => !/mã\s*\d/i.test(p.dim) && p.items.every((x) => !/mã\s*\d/i.test(x.label)))), 'không hiện mã chỉ số trên giao diện');
// từng đơn vị: tử số ≤ mẫu số
ok(U.every((u) => u.ht.hoCq <= u.ht.ho && u.ht.sm <= u.ht.ds15), 'hạ tầng: tử số ≤ mẫu số');
ok(U.every((u) => u.cn.dvctt <= u.cn.dan && u.cn.dtdt <= u.cn.ds14 && u.cn.cks <= u.cn.dsTt && u.cn.kns <= u.cn.dan && u.cn.attt <= u.cn.cb), 'con người: tử số ≤ mẫu số');
ok(U.every((u) => u.vb.thang.length === 9 && u.vb.thang.every((x) => x.tttt <= x.nvtc && x.nvtc <= x.hs && x.vbMang <= x.vbNb && x.vbKySo <= x.vbCq && x.toanTrinh >= 0 && x.toanTrinh <= 100)), 'văn bản, dịch vụ công: hợp lệ từng tháng');
// tổng = cộng phường/xã
ok(H.ho === sum(U.map((u) => u.ht.ho)) && H.hoCq === sum(U.map((u) => u.ht.hoCq)) && C.dan === sum(U.map((u) => u.cn.dan)), 'tổng = cộng 126 phường/xã');
ok(H.tieuChi.every((r) => r[1] >= 0 && r[1] <= n) && C.tieuChi.every((r) => r[1] >= 0 && r[1] <= n), 'tiêu chí Có/Không trong 0 – 126');
ok(sum(V.nhom.map((g) => g[1])) === n, 'nhóm tỷ lệ toàn trình cộng lại = 126');
ok(V.thap.length === 10 && V.thap.every((r, i) => !i || r[1] >= V.thap[i - 1][1]), '10 đơn vị toàn trình thấp nhất, xếp tăng');
ok(V.xuHuong.every((a) => a.length === 9 && a.every((v, i) => !i || v >= a[i - 1] - 0.5)), 'diễn biến tỷ lệ theo tháng không giảm đột ngột');
ok(Math.abs(V.toanTrinh - sum(U.map((u) => u.vb.thang[8].toanTrinh * u.vb.thang[8].hs)) / V.hs) < 1e-9, 'toàn trình = bình quân có trọng số theo hồ sơ');
// bậc độ lớn sát số thật (cáp quang 91,4% hộ; 97% người trưởng thành có smartphone; mục tiêu 80% hồ sơ trực tuyến; ~8,7 triệu dân)
const p = (a, b) => a / b * 100;
ok(C.dan > 8.2e6 && C.dan < 9.2e6, 'dân số ~ 8,7 triệu');
ok(p(H.hoCq, H.ho) > 89 && p(H.hoCq, H.ho) < 96, 'hộ có cáp quang 89 – 96%');
ok(p(H.sm, H.ds15) > 92 && p(H.sm, H.ds15) < 99, 'người dùng smartphone 92 – 99%');
ok(V.toanTrinh > 75 && V.toanTrinh < 90 && V.nhom[2][1] <= 5, 'toàn trình 75 – 90%, gần như không đơn vị dưới 60%');
ok(p(C.cks, C.dsTt) < p(C.dtdt, C.ds14), 'chữ ký số người dân thấp hơn danh tính điện tử');
ok(C.tieuChi[0][1] === n, '100% phường/xã có Tổ chuyển đổi số cộng đồng');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
