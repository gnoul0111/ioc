/* Kiểm tra số giả lập Sở Nội vụ (2 eform → 4 chỉ tiêu): tử số ≤ mẫu số; tổng = cộng 126 phường/xã; bậc độ lớn sát số thật.
   Chạy: node tests/snv/snv.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/snv-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=SNV_SUM;this.CT=SNV_CT;this.IT=SNV_ITEMS;this.U=SNV_UNITS;this.DV=SNV_DV;this.VDV=VPUB_DV;', ctx);
const { S, CT, IT, U, DV, VDV } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const B = S.bh, L = S.ld, C = S.bc, D = S.cds, n = 126;

ok(IT.length === 4 && CT.length === 4, '4 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp SNV_CT'));
ok(DV.length === n && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
const ui = JSON.stringify(IT) + fs.readFileSync(path.join(root, 'js/features/dashboard-snv.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
ok(!/mã\s*(chỉ tiêu|\d)|QĐ\s*4795|ma_chi_tieu|_bhtn|_bhxh/i.test(ui), 'không hiện mã chỉ tiêu trên giao diện');
// từng đơn vị: tử số ≤ mẫu số
ok(U.every((u) => u.bh.thang.length === 9 && u.bh.thang.every((x) => x.bhtn <= x.bhxh && x.bhxh <= u.bh.llld && x.daThu <= x.phaiThu && x.daChi <= x.phaiChi)), 'bảo hiểm: tử số ≤ mẫu số từng tháng');
ok(U.every((u) => u.bh.quaTk <= u.bh.nguoiHuong), 'người nhận qua tài khoản ≤ người hưởng');
ok(U.every((u) => u.ld.daoTao <= u.ld.llld && u.ld.llld === u.bh.llld && u.ld.diNn.every((v) => v >= 0)), 'lao động: hợp lệ, lực lượng lao động khớp 2 eform');
ok(U.every((u) => u.bc.huongLuong <= u.bc.thucHien && u.bc.thucHien <= u.bc.giao), 'biên chế: hưởng lương ≤ thực hiện ≤ được giao');
ok(U.every((u) => u.cds.thang.every((x) => x.kns <= x.tong && x.cks <= x.tong && x.tong === u.bc.thucHien)), 'chuyển đổi số: tử số ≤ công chức, viên chức thực hiện');
// tổng = cộng phường/xã
ok(B.llld === sum(U.map((u) => u.bh.llld)) && B.bhxh === sum(U.map((u) => u.bh.thang[8].bhxh)) && B.daThu === sum(U.map((u) => sum(u.bh.thang.map((x) => x.daThu)))), 'bảo hiểm: tổng = cộng 126 phường/xã');
ok(C.giao === sum(U.map((u) => u.bc.giao)) && C.tuyen === sum(U.map((u) => sum(u.bc.tuyen))), 'biên chế: tổng = cộng 126 phường/xã');
ok(sum(B.nhom.map((g) => g[1])) === n && sum(C.nhom.map((g) => g[1])) === n, 'các nhóm phường/xã cộng lại = 126');
ok(D.tieuChi.every((r) => r[1] >= 0 && r[1] <= n), 'tiêu chí Có/Không trong 0 – 126');
ok([B.thap, L.dtThap, D.thap].every((a) => a.length === 10 && a.every((r, i) => !i || r[1] >= a[i - 1][1])), 'danh sách 10 thấp nhất xếp tăng');
ok([L.nnTop, C.thieu].every((a) => a.length === 10 && a.every((r, i) => !i || r[1] <= a[i - 1][1])), 'danh sách 10 cao nhất xếp giảm');
ok(B.xuHuong.concat(D.xuHuong).every((a) => a.length === 9 && a.every((v, i) => !i || v >= a[i - 1] - 0.3)), 'tỷ lệ theo tháng không giảm đột ngột');
// bậc độ lớn sát số thật
const p = (a, b) => a / b * 100;
ok(sum(U.map((u) => u.dan)) > 8.3e6 && sum(U.map((u) => u.dan)) < 9.1e6, 'dân số ~ 8,7 triệu');
ok(B.bhxh > 2.45e6 && B.bhxh < 2.8e6, 'tham gia BHXH 2,45 – 2,8 triệu (hết 2025: ~2,39 triệu bắt buộc + 136,5 nghìn tự nguyện)');
ok(p(B.bhxh, B.llld) > 50 && p(B.bhxh, B.llld) < 56 && p(B.bhtn, B.llld) > 44 && p(B.bhtn, B.llld) < 49, 'tỷ lệ BHXH 50 – 56%, BHTN 44 – 49% (chỉ tiêu 2025: 51%, 45%)');
ok(B.daThu / 1e6 > 55 && B.daThu / 1e6 < 68, 'thu 9 tháng 55 – 68 nghìn tỷ (cả năm 2025 ~78 – 80 nghìn tỷ)');
ok(B.daChi / 1e6 > 35 && B.daChi / 1e6 < 45, 'chi 9 tháng 35 – 45 nghìn tỷ (cả năm 2025 > 49 nghìn tỷ)');
ok(B.nguoiHuong > 570000 && B.nguoiHuong < 650000 && p(B.quaTk, B.nguoiHuong) > 98, 'người hưởng hằng tháng ~ 600 nghìn, > 98% qua tài khoản');
ok(C.giao > 9000 && C.giao < 10000, 'biên chế 126 phường/xã ~ 9.500 (bố trí 9.536 cán bộ, công chức)');
ok(L.nuocNgoai > 15000 && L.nuocNgoai < 30000, 'lao động nước ngoài 15 – 30 nghìn');
ok(p(D.cks, D.tong) > 97, 'chữ ký số công vụ > 97%');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
