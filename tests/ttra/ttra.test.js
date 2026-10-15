/* Kiểm tra số giả lập Thanh tra Thành phố luôn khớp: tổng = cộng bản ghi; từng bản ghi hợp lệ; bậc độ lớn sát số thật.
   Chạy: node tests/ttra/ttra.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/ttra-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=TTRA_SUM;this.CT=TTRA_CT;this.IT=TTRA_ITEMS;this.K=TTRA_KT;this.C=TTRA_CUOC;this.U=TTRA_TCD;this.DV=TTRA_DV;this.VDV=VPUB_DV;this.TD=TTRA_THEO_DOI;this.LV=TTRA_LV;', ctx);
const { S, CT, IT, K, C, U, DV, VDV, TD, LV } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);

ok(IT.length === 3 && CT.length === 3, '3 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp TTRA_CT'));
ok(DV.length === 126 && DV.every((n, i) => n === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
// 1. Kiểm tra
ok(K.every((r) => DV.indexOf(r.diaBan) >= 0) && new Set(K.map((r) => r.diaBan)).size === K.length, 'cuộc kiểm tra: địa bàn hợp lệ, không trùng');
ok(K.every((r) => r.da + r.dang + r.qh === r.soKn && r.da >= 0 && r.dang >= 0 && r.qh >= 0), 'kiến nghị: đã + đang + quá hạn = số kiến nghị');
ok(K.every((r) => r.kl === (r.tt === 0) && (r.kl || (r.soKn === 0 && r.thuHoi === 0))), 'chỉ cuộc đã có kết luận mới có kiến nghị');
ok(K.every((r) => r.ngayTt == null || r.ngayBd + r.ngayTt <= 273), 'cuộc đã kết thúc: kết thúc trước 30/9');
ok(sum(S.kt.tt) === S.kt.n && sum(S.kt.nd) === S.kt.n && S.kt.n <= S.kt.keHoach, 'trạng thái, nội dung cộng lại = số cuộc ≤ kế hoạch');
ok(S.kt.da + S.kt.dang + S.kt.qh === S.kt.soKn, 'tổng kiến nghị khớp');
// 2. Thanh tra
ok(sum(S.tt.tt) === S.tt.n && sum(S.tt.lv) === S.tt.n && sum(S.tt.nguon) === S.tt.n && sum(S.tt.cb) === S.tt.n, 'trạng thái, lĩnh vực, nguồn, cảnh báo cộng lại = số cuộc');
ok(C.every((c) => c.daThu <= c.thuHoi && (c.kl || (c.soKn === 0 && c.thuHoi === 0 && c.hcCaNhan === 0 && c.hcToChuc === 0 && c.cqdt === 0))), 'chỉ cuộc đã kết luận mới có kiến nghị, đã thu ≤ kiến nghị thu');
ok(sum(S.tt.lvTien.map((r) => r[0])) === S.tt.thuHoi && sum(S.tt.lvTien.map((r) => r[1])) === S.tt.daThu, 'thu hồi theo lĩnh vực cộng lại = tổng');
ok(C.every((c) => (c.cb === 3) === (c.quaHan > 10)), 'cảnh báo đỏ đúng cuộc quá hạn trên 10 ngày');
ok(C.every((c) => c.quaHan === 0 || c.tt === 1 || c.tt === 2), 'chỉ cuộc đang triển khai / chờ kết luận mới tính quá hạn');
ok(sum(S.tt.theoDoi) === TD.tong, 'theo dõi kết luận: đã hoàn thành + đang + quá hạn = tổng');
ok(C.every((c) => DV.indexOf(c.diaBan) >= 0 && c.lv < LV.length), 'cuộc thanh tra: địa bàn, lĩnh vực hợp lệ');
// bậc độ lớn sát số thật (năm 2025: 283 cuộc, 251 kết luận, 10,45 tỷ, 31 tổ chức + 147 cá nhân) quy về 9 tháng
ok(S.tt.n > 150 && S.tt.n < 230 && S.tt.kl > 80 && S.tt.kl < 190, 'số cuộc, kết luận 9 tháng hợp lý');
ok(S.tt.thuHoi / 1000 > 5 && S.tt.thuHoi / 1000 < 12, 'kiến nghị thu hồi 5 – 12 tỷ đồng');
ok(S.tt.hcToChuc > 12 && S.tt.hcToChuc < 32 && S.tt.hcCaNhan > 70 && S.tt.hcCaNhan < 150, 'xử lý hành chính hợp lý');
// 3. Tiếp công dân, khiếu nại, tố cáo
ok(U.every((u) => sum(u.luotT) === u.luot && sum(u.donT) === u.donMoi), 'từng phường/xã: cộng các tháng = 9 tháng');
ok(U.every((u) => u.luot <= u.nguoi && u.doan <= u.luot), 'lượt ≤ người, đoàn ≤ lượt');
/* BA mục 82: phải xử lý = kỳ trước + đơn mới; đã xử lý = cộng 4 phần đã phân loại; chưa xử lý = phải − đã, không âm */
ok(U.every((u) => u.phaiXl === u.kyTruoc + u.donMoi && u.duDk + u.khongDk === u.daXl && u.chuaXl === u.phaiXl - u.daXl && u.chuaXl >= 0 && u.tq + u.chuyen + u.huongDan === u.duDk && u.huongDan >= 0), 'phân loại đơn khớp: 4 phần = đơn đã xử lý ≤ đơn phải xử lý (BA 82)');
/* BA mục 80: Vàng của cuộc đang triển khai theo thời gian đã dùng, không theo tiến độ */
ok(C.filter((c) => c.tt === 1 && c.quaHan === 0).every((c) => (c.cb === 1) === (c.tgDung > 75)), 'cảnh báo Vàng = đã dùng trên 75% thời gian kế hoạch, chưa quá hạn (BA 80)');
ok(U.every((u) => u.kn + u.tc + u.knpa + u.khac === u.donMoi && u.knpa >= 0), 'loại đơn cộng lại = đơn mới');
ok(U.every((u) => u.daGq + u.dangTh + u.dangQh + u.rut === u.thuLy && u.dungHan + u.quaHan === u.daGq && u.daGq >= 0 && u.thuLy <= u.tq), 'vụ việc: kết quả giải quyết cộng lại = thụ lý ≤ thuộc thẩm quyền');
ok(U.every((u) => u.ton === u.dangTh + u.dangQh && u.phucTap <= u.thuLy), 'tồn = đang xử lý; phức tạp ≤ thụ lý');
const T = S.tcd;
ok(T.luot === sum(U.map((u) => u.luot)) && sum(T.luotT) === T.luot && sum(T.donT) === T.donMoi, 'tổng tiếp công dân khớp');
ok(T.luot > 12000 && T.luot < 22000, 'lượt tiếp công dân 9 tháng cấp xã hợp lý (năm 2024 toàn TP 35.086 lượt)');
ok(T.daGq / T.thuLy > 0.75 && T.daGq / T.thuLy < 0.95, 'tỷ lệ giải quyết 75 – 95%');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
