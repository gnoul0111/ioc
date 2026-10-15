/* Kiểm tra số giả lập Sở Dân tộc và Tôn giáo luôn khớp: tổng = cộng bản ghi = cộng các nhóm; từng bản ghi hợp lệ.
   Chạy: node tests/dttg/dttg.test.js (từ thư mục gốc ioc) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/dttg-config.js'), 'utf8') + fs.readFileSync(path.join(root, 'js/core/vpub-config.js'), 'utf8') +
  '\n;this.S=DTTG_SUM;this.CT=DTTG_CT;this.IT=DTTG_ITEMS;this.U=DTTG_UNITS;this.R=DTTG_REC;this.DV=DTTG_DV;this.X=DTTG_XA;this.VDV=VPUB_DV;this.DATP=DTTG_DATP;this.TT=DTTG_TT;', ctx);
const { S, CT, IT, U, R, DV, X, VDV, DATP, TT } = ctx;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('✗ ' + m); } };
const sum = (a) => a.reduce((x, y) => x + y, 0);
const G = S.gn, T = S.td, K = S.kq, D = S.ds;

ok(IT.length === 4 && CT.length === 4, '4 chỉ tiêu');
IT.forEach((it, i) => ok(it.vkey === CT[i].key && it[1] === CT[i].soBanGhi, 'dòng chỉ tiêu ' + (i + 1) + ' khớp DTTG_CT'));
ok(DV.length === 126 && DV.every((n, i) => n === VDV[i]), '126 phường/xã, đúng danh mục Địa bàn');
ok(X.every((x) => DV.indexOf(x[0]) >= 0), 'xã có dự án nằm trong danh mục');
ok(new Set(R.map((r) => r.ma)).size === R.length, 'mã dự án không trùng');
// từng bản ghi hợp lệ
ok(R.every((r) => r.pb <= r.kh && r.gn9 <= r.pb && r.gn9 >= 0), 'giải ngân ≤ phân bổ ≤ kế hoạch');
ok(R.every((r) => r.luyKe.every((v, m) => !m || v >= r.luyKe[m - 1]) && r.luyKe[8] === r.gn9 && r.gnKy === r.gn9 - r.luyKe[7]), 'lũy kế không giảm, kỳ này = lũy kế T9 − T8');
ok(R.every((r) => r.tt !== 2 || (r.gn9 === 0 && r.tdTt === 0)), 'chưa triển khai: chưa giải ngân, tiến độ 0');
ok(R.every((r) => r.tt !== 0 || r.tdTt === 100), 'hoàn thành: tiến độ thực tế 100%');
ok(R.every((r) => r.tt !== 4 || r.dungTd === 2), 'tạm dừng: đúng tiến độ = Không áp dụng');
ok(R.every((r) => r.dinhTre <= r.pb - r.gn9), 'vốn đình trệ ≤ vốn phân bổ chưa giải ngân');
// 1. Giải ngân
ok(G.kh === sum(R.map((r) => r.kh)) && G.pb === sum(R.map((r) => r.pb)) && G.gn === sum(R.map((r) => r.gn9)), 'giải ngân: tổng = cộng bản ghi');
ok(G.luyKeT[8] === G.gn && sum(G.kyT) === G.gn && G.kyT[8] === G.gnKy, 'giải ngân theo tháng cộng lại = lũy kế T9');
ok([0, 1, 2].every((i) => sum(G.byDatp.map((r) => r[i])) === [G.kh, G.pb, G.gn][i]), 'theo dự án thành phần cộng lại = tổng');
ok(sum(G.byNguon) === G.kh, 'theo nguồn vốn cộng lại = kế hoạch');
ok(sum(G.byXa.map((r) => r[1])) === G.kh && sum(G.byXa.map((r) => r[2])) === G.gn && G.byXa.length === X.length, 'theo xã cộng lại = tổng');
// 2. Tiến độ
ok(sum(T.tt) === T.n && T.n === R.length, 'trạng thái cộng lại = số dự án');
ok(T.ttDatp.every((row, d) => sum(row) === R.filter((r) => r.datp === d).length) && sum(T.ttDatp.map(sum)) === T.n, 'trạng thái theo dự án thành phần khớp');
ok(sum(T.dung) === T.n && sum(T.ktgs) === T.n && sum(T.loai) === T.n, 'đúng tiến độ, KTGS, loại bản ghi cộng lại = số dự án');
ok(T.tdDatp.every((r) => r[0] > 0 && r[0] <= 100 && r[1] >= 0 && r[1] <= 100), 'tiến độ bình quân trong 0 – 100%');
// 3. Kết quả
ok(K.hoNuoc <= K.soHo && K.soCungHoa <= K.soDuong && K.hsDungCap <= K.hsTuoi && K.hoNgheoCuoi <= K.hoNgheoDau, 'chỉ số kết quả: tử số ≤ mẫu số');
ok(K.soHo === sum(X.map((x) => x[1])) && S.kqXa.length === X.length, 'hộ DTTS = cộng các xã');
ok(K.tl.every((v) => v >= 0 && v <= 100), '4 tỷ lệ kết quả trong 0 – 100%');
// 4. Báo cáo, đối soát
ok(sum(D.bc) === 126 && D.bc[0] === X.length && D.bc[2] === 5, 'tình trạng báo cáo: 9 có dự án + không phát sinh + 5 chưa báo cáo = 126');
ok(U.every((u) => (u.bc === 0) === X.some((x) => x[0] === u.ten)), 'chỉ xã có dự án mới có bản ghi dự án');
ok(sum(D.doiSoat) === T.n && sum(D.co) === T.n && sum(D.ndl) === T.n && sum(D.cnso) === T.n, 'đối soát, cờ, nguồn dữ liệu, công nghệ số cộng lại = số dự án');
ok(R.every((r) => r.doiSoat !== 3 || r.co === 1), 'bản ghi cần giải trình khi đối soát thì cờ dữ liệu cũng là Cần giải trình');
ok(D.banGhi === R.length + D.bc[1], 'bản ghi tháng 9 = bản ghi dự án + bản không phát sinh');
// khoảng hợp lý
ok(G.kh / 1000 > 100 && G.kh / 1000 < 400 && G.gn / G.kh > 0.35 && G.gn / G.kh < 0.75, 'vốn, tỷ lệ giải ngân trong khoảng hợp lý');
console.log(`${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
