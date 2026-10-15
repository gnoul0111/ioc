/* Kiểm tra số giả lập Sở Xây dựng (4 eform): tổng = cộng phường/xã = cộng phân tổ; điểm nguy cơ hợp lệ; bậc độ lớn sát số thật.
   Chạy: node tests/sxd/sxd.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/sxd-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=SXD_SUM;this.CT=SXD_CT;this.IT=SXD_ITEMS;this.U=SXD_UNITS;this.DV=SXD_DV;this.VDV=VPUB_DV;this.D=SXD_DIEM;this.NHA=SXD_NHA;this.VT=SXD_VT;this.HH=SXD_HH;', ctx);
const { S, CT, IT, U, DV, VDV, D, NHA, VT, HH } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const near = (a, b, e) => Math.abs(a - b) < (e || 0.6);

ok(IT.length === 4 && CT.length === 4, '4 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp SXD_CT'));
ok(DV.length === 126 && DV.every((x, i) => x === VDV[i]), '126 phường/xã, đúng danh mục');
ok(IT.every((it) => !/chỉ số\s*\d/i.test(it[0]) && it[4].every((p) => !/chỉ số\s*\d/i.test(p.dim))), 'không hiện số hiệu chỉ số trên giao diện');
// 1. Nhà ở
ok(NHA.every((x, i) => near(S.nha.san[i], x[1]) && S.nha.ct[i] === x[0]), 'nhà ở: diện tích sàn, số công trình theo loại khớp khai báo');
/* số chính = diện tích "Đã hoàn thành", không cộng các tình trạng (phản hồi nhóm triển khai 13/10/2026, BA 68 – 71) */
ok(near(S.nha.sanTT[2], S.nha.sanTong, 2) && Math.abs(sum(S.nha.sanT) - Math.round(S.nha.sanTong)) <= 1, 'nhà ở: số chính = tình trạng Đã hoàn thành; theo tháng cộng lại = số chính');
ok(sum(S.nha.sanTT) > S.nha.sanTong * 3, 'nhà ở: 4 tình trạng là 4 số phát sinh riêng (không phải các phần của số chính)');
ok(NHA.every((x) => x[4][2] === 1 && x[4].every((v) => v >= 0 && v < 2)), 'tình trạng mỗi loại so với diện tích hoàn thành (hoàn thành = 1)');
ok(S.nha.sanTong / 1000 > 5 && S.nha.sanTong / 1000 < 10, 'diện tích sàn nhà ở hoàn thành 9 tháng 5 – 10 triệu m² (2020: nhà ở thương mại hoàn thành ~6,57 triệu m²)');
ok(U.every((u) => [1, 2, 3, 4].every((i) => u.nhaSan[i] === 0 || u.nhaCt[i] >= 0)), 'nhà ở: số liệu phường/xã không âm');
// 2. Vận tải hành khách
ok(S.vt.tong === sum(U.map((u) => sum(u.hk))) && S.vt.nhom.every((v, i) => v === VT[i][4]) && sum(S.vt.hkT) === S.vt.tong, 'vận tải: tổng = cộng phường/xã = cộng tháng');
ok(near(sum(S.vt.metro.map((r) => r[1])), S.vt.nhom[4], 1) && S.vt.nhom[4] / 1000 > 12 && S.vt.nhom[4] / 1000 < 22, 'đường sắt đô thị: 2 tuyến khớp, ~16 triệu lượt 9 tháng (quý I/2025: 4,78 triệu)');
ok(vm.runInContext('SXD_SHOW_METRO_TUYEN', ctx) === false,'số theo tuyến metro ẩn (eform không có trường «Tuyến»)');
ok(S.vt.tong / S.vt.ck > 1 && S.vt.tong / S.vt.ck < 1.2, 'vận tải tăng 0 – 20% so cùng kỳ');
// 3. Điểm nguy cơ
ok(D.every((d) => DV.indexOf(d.diaBan) >= 0 && d.lat > 20.5 && d.lat < 21.4 && d.lon > 105.2 && d.lon < 106.1), 'mọi điểm có địa bàn hợp lệ, tọa độ trong Hà Nội');
ok(sum(S.nc.loai) === S.nc.n && sum(S.nc.tt) === S.nc.n && sum(S.nc.muc.map(sum)) === S.nc.n && sum(S.nc.cap) === S.nc.n, 'điểm nguy cơ: các phân tổ cộng lại khớp');
ok(D.every((d) => !(d.muc === 3 && d.tt === 0)), 'điểm mức rất cao không để "Chưa xử lý"');
ok(S.nc.caoTro / S.nc.n > 0.3 && S.nc.caoTro / S.nc.n < 0.55, 'tỷ lệ điểm mức cao trở lên 30 – 55%');
// 4. Khối lượng vận chuyển
ok(S.vtdl.hk === S.vt.tong && sum(S.vtdl.hkLh) === S.vtdl.hk, 'hành khách eform 4 khớp eform 2, cộng loại hình = tổng');
ok(S.vtdl.hh === sum(HH.map((x) => x[0])) && S.vtdl.hh === sum(U.map((u) => sum(u.hh))), 'hàng hóa: cộng loại hình, cộng phường/xã khớp');
ok(S.vtdl.hh / 1000 > 180 && S.vtdl.hh / 1000 < 450 && S.vtdl.hh / S.vtdl.hhCk > 1 && S.vtdl.hh / S.vtdl.hhCk < 1.2, 'hàng hóa 9 tháng 8 – 20% số cả nước (cả nước 2025: 3.027,7 triệu tấn/năm), tăng 0 – 20%');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
