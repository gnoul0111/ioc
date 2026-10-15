/* ============================== SỞ Y TẾ — 4 CHỈ TIÊU THEO 4 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở Y tế"), 4 eform → 4 chỉ tiêu (1 eform = 1 chỉ tiêu):
     1. Số vụ ngộ độc thực phẩm và mức độ thiệt hại — bản ghi = 1 vụ việc («Mã bản ghi», «Tên vụ việc», «Ngày phát hiện»…)
     2. Tỷ lệ bao phủ bảo hiểm y tế — bản ghi = 1 «Thôn/TDP» × tháng («Tổng dân số thôn», «Số người có thẻ BHYT»)
     3. Dịch bệnh nhóm A, B theo Luật Phòng, chống bệnh truyền nhiễm — bản ghi = 1 bệnh tại 1 «Thôn/TDP» phát hiện trong kỳ
     4. Tỷ lệ người dân có hồ sơ sức khỏe điện tử — bản ghi = 1 «Thôn/TDP» × tháng («Tổng dân số thôn», «Số người có hồ sơ SKĐT»)
   Bộ chỉ tiêu cũ STT 36, 37, 46 đã xóa (central-level.js).

   SỐ GIẢ LẬP, đặt theo số thật đã công bố của Hà Nội:
   - BHYT: chỉ tiêu 2026 Hà Nội 96,25%; hết 7/2026 đạt 96,33% dân số, gần 8,6 triệu người tham gia; năm 2025 đạt 95,95%.
   - Hồ sơ sức khỏe điện tử: hết quý II/2026 gần 99% dân số; mục tiêu 100% người dân có Sổ sức khỏe điện tử trên VNeID từ 15/10/2026.
   - Dịch bệnh (CDC Hà Nội, cộng dồn 2026): tay chân miệng 3.951 ca đến tháng 7 (cùng kỳ 2025: 3.100); sốt xuất huyết 871 ca
     tại 111 phường/xã (đỉnh dịch tháng 9 – 11); sởi 331 – 354 ca tại 108 – 109 phường/xã, giảm so với 2025; ho gà 7 ca;
     không tử vong; COVID-19 ~185 ca/tuần (tháng 8); 8 ổ dịch dại trên chó; có ca liên cầu lợn ở Ba Vì.
   - Ngộ độc thực phẩm: cả nước năm 2025 84 vụ, 2.301 người mắc; quý I/2026 36 vụ. Số riêng của Hà Nội chưa thấy công bố
     → GIẢ ĐỊNH 6 vụ trong 9 tháng (bếp ăn tập thể, trường học, cỗ, thức ăn đường phố, nấm rừng, rượu).
   Nạp TRƯỚC central-level.js (central-level.js dùng SYT_ITEMS). Không dùng hàm nào của file khác. */

const SYT_KY = 'Tháng 9/2026';
const SYT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
const SYT_M = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function sytSum(a) { return a.reduce((s, v) => s + v, 0); }
function sytHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function sytR(name, key) { return (sytHash(name + '|' + key) % 10000) / 10000; }
/* chia một tổng cho các đơn vị theo trọng số, làm tròn theo phần dư lớn nhất → cộng lại đúng bằng tổng */
function sytSplit(total, w) {
  const sw = sytSum(w) || 1, raw = w.map((x) => total * x / sw), fl = raw.map(Math.floor);
  let du = total - sytSum(fl);
  raw.map((x, i) => [x - fl[i], i]).sort((a, b) => b[0] - a[0]).forEach((x) => { if (du > 0) { fl[x[1]]++; du--; } });
  return fl;
}

/* ---------- 126 phường/xã — đúng danh mục «Địa bàn» của 4 eform ---------- */
const SYT_DV = [
  'Phường Ba Đình', 'Phường Bạch Mai', 'Phường Bồ Đề', 'Phường Chương Mỹ', 'Phường Cầu Giấy', 'Phường Cửa Nam', 'Phường Dương Nội',
  'Phường Giảng Võ', 'Phường Hai Bà Trưng', 'Phường Hoàn Kiếm', 'Phường Hoàng Liệt', 'Phường Hoàng Mai', 'Phường Hà Đông', 'Phường Hồng Hà',
  'Phường Khương Đình', 'Phường Kim Liên', 'Phường Kiến Hưng', 'Phường Long Biên', 'Phường Láng', 'Phường Lĩnh Nam', 'Phường Nghĩa Đô',
  'Phường Ngọc Hà', 'Phường Phú Diễn', 'Phường Phú Lương', 'Phường Phú Thượng', 'Phường Phúc Lợi', 'Phường Phương Liệt', 'Phường Sơn Tây',
  'Phường Thanh Liệt', 'Phường Thanh Xuân', 'Phường Thượng Cát', 'Phường Tây Hồ', 'Phường Tây Mỗ', 'Phường Tây Tựu', 'Phường Tùng Thiện',
  'Phường Tương Mai', 'Phường Từ Liêm', 'Phường Việt Hưng', 'Phường Văn Miếu - Quốc Tử Giám', 'Phường Vĩnh Hưng', 'Phường Vĩnh Tuy',
  'Phường Xuân Phương', 'Phường Xuân Đỉnh', 'Phường Yên Hòa', 'Phường Yên Nghĩa', 'Phường Yên Sở', 'Phường Ô Chợ Dừa', 'Phường Đông Ngạc',
  'Phường Đại Mỗ', 'Phường Định Công', 'Phường Đống Đa',
  'Xã An Khánh', 'Xã Ba Vì', 'Xã Bát Tràng', 'Xã Bình Minh', 'Xã Bất Bạt', 'Xã Chuyên Mỹ', 'Xã Chương Dương', 'Xã Cổ Đô', 'Xã Dân Hòa',
  'Xã Dương Hòa', 'Xã Gia Lâm', 'Xã Hoài Đức', 'Xã Hát Môn', 'Xã Hòa Lạc', 'Xã Hòa Phú', 'Xã Hòa Xá', 'Xã Hưng Đạo', 'Xã Hương Sơn',
  'Xã Hạ Bằng', 'Xã Hồng Sơn', 'Xã Hồng Vân', 'Xã Kim Anh', 'Xã Kiều Phú', 'Xã Liên Minh', 'Xã Minh Châu', 'Xã Mê Linh', 'Xã Mỹ Đức',
  'Xã Nam Phù', 'Xã Ngọc Hồi', 'Xã Nội Bài', 'Xã Phù Đổng', 'Xã Phú Cát', 'Xã Phú Nghĩa', 'Xã Phú Xuyên', 'Xã Phúc Lộc', 'Xã Phúc Sơn',
  'Xã Phúc Thịnh', 'Xã Phúc Thọ', 'Xã Phượng Dực', 'Xã Quang Minh', 'Xã Quảng Bị', 'Xã Quảng Oai', 'Xã Quốc Oai', 'Xã Suối Hai',
  'Xã Sóc Sơn', 'Xã Sơn Đồng', 'Xã Tam Hưng', 'Xã Thanh Oai', 'Xã Thanh Trì', 'Xã Thiên Lộc', 'Xã Thuận An', 'Xã Thư Lâm', 'Xã Thường Tín',
  'Xã Thượng Phúc', 'Xã Thạch Thất', 'Xã Tiến Thắng', 'Xã Trung Giã', 'Xã Trần Phú', 'Xã Tây Phương', 'Xã Vân Đình', 'Xã Vĩnh Thanh',
  'Xã Vật Lại', 'Xã Xuân Mai', 'Xã Yên Bài', 'Xã Yên Lãng', 'Xã Yên Xuân', 'Xã Ô Diên', 'Xã Đa Phúc', 'Xã Đan Phượng', 'Xã Đoài Phương',
  'Xã Đông Anh', 'Xã Đại Thanh', 'Xã Đại Xuyên', 'Xã Ứng Hòa', 'Xã Ứng Thiên'
];
/* xã miền núi, vùng đồng bào dân tộc thiểu số: BHYT cao (ngân sách hỗ trợ), hồ sơ sức khỏe điện tử chậm hơn */
const SYT_XA_XA = ['Xã Ba Vì', 'Xã Yên Bài', 'Xã Suối Hai', 'Xã Bất Bạt', 'Xã Yên Xuân', 'Xã Mỹ Đức', 'Xã Hương Sơn', 'Xã Phú Cát', 'Xã Trần Phú',
  'Xã Minh Châu', 'Xã Cổ Đô', 'Xã Hồng Sơn', 'Xã Phúc Sơn', 'Xã Đại Xuyên', 'Xã Chuyên Mỹ'];
/* phường nội đô đông dân, nhiều ổ sốt xuất huyết các năm gần đây */
const SYT_SXH = ['Phường Hoàng Mai', 'Phường Định Công', 'Phường Hoàng Liệt', 'Phường Đống Đa', 'Phường Kim Liên', 'Phường Hà Đông', 'Phường Thanh Xuân',
  'Phường Khương Đình', 'Phường Phương Liệt', 'Phường Bạch Mai', 'Phường Tương Mai', 'Phường Láng', 'Phường Ô Chợ Dừa', 'Phường Dương Nội', 'Phường Kiến Hưng', 'Phường Đại Mỗ', 'Phường Tây Mỗ'];

/* ---------- Dân số và số thôn/TDP từng phường/xã (dân số gồm cả người tạm trú, ~8,9 triệu) ---------- */
const SYT_UNITS = SYT_DV.map((ten) => {
  const R = (k) => sytR(ten, k), ph = ten.indexOf('Phường') === 0, xa = SYT_XA_XA.indexOf(ten) >= 0;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  /* cùng khóa băm với khcn/snv-config.js để dân số và số thôn khớp giữa các sở (nhân hệ số gồm người tạm trú) */
  const dan = Math.round((ph ? 82000 : 58000) * (0.6 + 0.8 * R('ds')) / 100) * 100;
  const danTT = Math.round(dan * (ph ? 1.04 : 1.015));
  const soThon = Math.round((ph ? 22 : 30) + 18 * R('th'));
  /* 2. BHYT: phường thấp hơn (lao động tự do, người tạm trú), xã miền núi cao (ngân sách hỗ trợ) */
  const bhyt9 = cl((ph ? 0.957 : 0.968) + 0.016 * (R('bh') - 0.5) + (xa ? 0.018 : 0), 0.93, 0.995);
  const bhyt = SYT_M.map((m) => Math.round(danTT * cl(bhyt9 - 0.0045 * (8 - m) / 8 * (0.7 + 0.6 * R('bt')), 0.9, 0.998)));
  /* 4. hồ sơ sức khỏe điện tử: tăng nhanh đầu năm, gần 99% cuối quý II, đạt ~99,4% tháng 9 */
  const lechHs = (ph ? 0.003 : -0.002) - (xa ? 0.012 : 0) + 0.008 * (R('hs') - 0.5);
  const XH = [0.935, 0.946, 0.956, 0.965, 0.974, 0.985, 0.989, 0.992, 0.994];
  const hssk = SYT_M.map((m) => Math.round(danTT * cl(XH[m] + lechHs * (1 + (8 - m) / 8), 0.85, 1)));
  return { ten: ten, phuong: ph, dan: danTT, soThon: soThon, bhyt: bhyt, hssk: hssk };
});

/* ---------- 3. Dịch bệnh nhóm A, B: tổng Thành phố theo tháng, chia về phường/xã theo trọng số ---------- */
/* [tên bệnh, nhóm, số ca T1 – T9, tỷ lệ ca nặng, số tử vong, màu, kiểu phân bố] */
const SYT_BENH = [
  ['Tay chân miệng', 'B', [160, 120, 210, 380, 600, 820, 1100, 980, 1150], 0.025, 0, '#2a78d6', 'deu'],
  ['Sốt xuất huyết', 'B', [40, 25, 20, 18, 25, 40, 120, 450, 1100], 0.02, 0, '#d33a44', 'sxh'],
  ['COVID-19', 'B', [20, 15, 10, 15, 40, 120, 380, 650, 780], 0.01, 0, '#7086FD', 'pho'],
  ['Sởi', 'B', [60, 55, 60, 55, 40, 30, 25, 15, 12], 0.04, 0, '#eda100', 'deu'],
  ['Ho gà', 'B', [1, 1, 1, 0, 2, 1, 1, 0, 1], 0.25, 0, '#1baf7a', 'xa'],
  ['Liên cầu lợn', 'B', [0, 0, 0, 1, 0, 1, 1, 0, 0], 1, 1, '#898781', 'xa'],
  ['Dại', 'B', [0, 0, 1, 0, 0, 1, 0, 0, 0], 1, 2, '#4a3aa7', 'xa']
];
const SYT_DICH = (function () {
  const U = SYT_UNITS;
  const wt = (u, kieu, b) => u.dan * (kieu === 'sxh' ? (SYT_SXH.indexOf(u.ten) >= 0 ? 6 : u.phuong ? 1.4 : sytR(u.ten, 'sx') < 0.25 ? 0 : 0.35) : kieu === 'pho' ? (u.phuong ? 1.5 : 0.7) : kieu === 'xa' ? (u.phuong ? 0.2 : 1.2) : 1)
    * (0.4 + 1.2 * sytR(u.ten, 'd' + b));
  /* ca[benh][thang][donVi] */
  const ca = SYT_BENH.map((b, bi) => SYT_M.map((m) => sytSplit(b[2][m], U.map((u) => wt(u, b[6], bi) * (0.6 + 0.8 * sytR(u.ten, 'dm' + bi + '_' + m))))));
  /* ca nặng, tử vong: chia theo số ca của từng đơn vị trong cả kỳ */
  const caDv = ca.map((b) => U.map((_, i) => sytSum(b.map((t) => t[i]))));
  const nang = SYT_BENH.map((b, bi) => sytSplit(Math.round(sytSum(b[2]) * b[3]), caDv[bi]));
  const tuVong = SYT_BENH.map((b, bi) => sytSplit(b[4], caDv[bi].map((v, i) => v ? v * (1 + sytR(U[i].ten, 'tv' + bi)) : 0)));
  /* số bản ghi: mỗi bệnh có ca tại một phường/xã trong tháng → số thôn/TDP có ca (ước tính theo số ca) */
  let banGhi = 0;
  ca.forEach((b) => b.forEach((t) => t.forEach((v, i) => { if (v) banGhi += Math.min(v, Math.max(1, Math.round(U[i].soThon * 0.35))); })));
  return { ca: ca, caDv: caDv, nang: nang, tuVong: tuVong, banGhi: banGhi };
})();

/* ---------- 1. Ngộ độc thực phẩm: danh sách vụ việc 9 tháng 2026 (GIẢ ĐỊNH) ---------- */
/* [tên vụ việc, «Địa bàn», tháng (1 – 12), ngày, người mắc/nhập viện, ca nặng, tử vong, nguyên nhân nghi ngờ, nhóm nguyên nhân] */
const SYT_NGO_DOC = [
  ['Bếp ăn tập thể công ty may trong khu công nghiệp', 'Xã Quang Minh', 3, 12, 46, 3, 0, 'Vi sinh vật (thức ăn chế biến sẵn để lâu)', 'Vi sinh vật'],
  ['Cỗ đám cưới tại nhà văn hóa thôn', 'Xã Ba Vì', 4, 6, 38, 4, 0, 'Vi sinh vật (món nộm, thịt luộc)', 'Vi sinh vật'],
  ['Bữa ăn bán trú trường tiểu học', 'Phường Hoàng Mai', 5, 21, 52, 2, 0, 'Vi sinh vật', 'Vi sinh vật'],
  ['Quán bánh mì ven đường', 'Phường Hà Đông', 6, 18, 29, 3, 0, 'Vi sinh vật (pate, chả)', 'Vi sinh vật'],
  ['Gia đình ăn nấm rừng tự hái', 'Xã Yên Xuân', 8, 3, 4, 2, 0, 'Độc tố tự nhiên (nấm độc)', 'Độc tố tự nhiên'],
  ['Uống rượu không rõ nguồn gốc', 'Xã Sóc Sơn', 9, 14, 3, 3, 1, 'Hóa chất (methanol)', 'Hóa chất']
];

/* ---------- Số tổng hợp ---------- */
const SYT_SUM = (function () {
  const U = SYT_UNITS, D = SYT_DICH, Q9 = 8, t = (f) => sytSum(U.map(f));
  const top = (rows, n, asc) => rows.slice().sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, n || 10);
  const xep = (rows, g) => g.map((x, i) => [x[0], rows.filter((r) => r[1] >= x[1] && (i === 0 || r[1] < g[i - 1][1])).length, x[2]]);
  const nhomPx = (f) => [U.filter((u) => u.phuong), U.filter((u) => !u.phuong)].map((g) => sytSum(g.map((u) => f(u))) / sytSum(g.map((u) => u.dan)) * 100);
  /* 1. ngộ độc */
  const N = SYT_NGO_DOC, nhNg = ['Vi sinh vật', 'Độc tố tự nhiên', 'Hóa chất', 'Chưa rõ'];
  const nd = {
    vu: N.length, mac: sytSum(N.map((v) => v[4])), nang: sytSum(N.map((v) => v[5])), tuVong: sytSum(N.map((v) => v[6])),
    vuLon: N.filter((v) => v[4] >= 30).length,
    thangVu: SYT_M.map((m) => N.filter((v) => v[2] === m + 1).length), thangMac: SYT_M.map((m) => sytSum(N.filter((v) => v[2] === m + 1).map((v) => v[4]))),
    nguyenNhan: nhNg.map((g, i) => [g, sytSum(N.filter((v) => v[8] === g).map((v) => v[4])), ['#2a78d6', '#1baf7a', '#d33a44', '#898781'][i]]).filter((r) => r[1] > 0),
    dsVu: N.map((v) => [v[0] + ' — ' + v[1], v[4], v[5], v[6]])
  };
  /* 2. BHYT */
  const bhT = SYT_M.map((m) => t((u) => u.bhyt[m])), dan = t((u) => u.dan);
  const tlBh = U.map((u) => [u.ten, u.bhyt[Q9] / u.dan * 100]);
  const bh = {
    dan: dan, bhyt: bhT[Q9], xuHuong: bhT.map((v) => v / dan * 100), chiTieu: 96.25, cap: nhomPx((u) => u.bhyt[Q9]),
    nhom: xep(tlBh, [['Từ 97% trở lên', 97, '#1baf7a'], ['Từ 95% đến dưới 97%', 95, '#2a78d6'], ['Dưới 95%', 0, '#eda100']]),
    datCt: tlBh.filter((r) => r[1] >= 96.25).length, thap: top(tlBh, 10, true), chua: dan - bhT[Q9]
  };
  /* 3. dịch bệnh */
  const caBenh = SYT_BENH.map((b) => sytSum(b[2]));
  const caTong = U.map((_, i) => sytSum(D.caDv.map((b) => b[i])));
  const dich = {
    ca: sytSum(caBenh), nang: sytSum(D.nang.map(sytSum)), tuVong: sytSum(D.tuVong.map(sytSum)), nhomA: 0,
    benh: SYT_BENH.map((b, i) => [b[0], caBenh[i], b[5], sytSum(D.nang[i]), sytSum(D.tuVong[i])]),
    thang: SYT_BENH.map((b) => b[2]), caT9: sytSum(SYT_BENH.map((b) => b[2][Q9])),
    dvCo: caTong.filter((v) => v > 0).length, sxhDv: D.caDv[1].filter((v) => v > 0).length,
    sxhTop: top(U.map((u, i) => [u.ten, D.caDv[1][i]]), 10), tcmTop: top(U.map((u, i) => [u.ten, D.caDv[0][i]]), 10),
    banGhi: D.banGhi
  };
  /* 4. hồ sơ sức khỏe điện tử */
  const hsT = SYT_M.map((m) => t((u) => u.hssk[m]));
  const tlHs = U.map((u) => [u.ten, u.hssk[Q9] / u.dan * 100]);
  const hs = {
    dan: dan, hssk: hsT[Q9], xuHuong: hsT.map((v) => v / dan * 100), cap: nhomPx((u) => u.hssk[Q9]),
    nhom: xep(tlHs, [['Từ 99,5% trở lên', 99.5, '#1baf7a'], ['Từ 98% đến dưới 99,5%', 98, '#2a78d6'], ['Dưới 98%', 0, '#eda100']]),
    thap: top(tlHs, 10, true), chua: dan - hsT[Q9]
  };
  return { nd: nd, bh: bh, dich: dich, hs: hs, soThon: t((u) => u.soThon) };
})();

/* ---------- Mô tả 4 chỉ tiêu (dùng cho tài liệu; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const SYT_CT = [
  { key: 'nd', name: 'Ngộ độc thực phẩm và mức độ thiệt hại', eform: 'Số vụ ngộ độc thực phẩm và mức độ thiệt hại', ky: SYT_KY + ' (cộng 9 tháng)', freq: 'Tháng', soBanGhi: SYT_NGO_DOC.length },
  { key: 'bh', name: 'Tỷ lệ bao phủ bảo hiểm y tế', eform: 'Tỷ lệ bao phủ bảo hiểm y tế', ky: SYT_KY, freq: 'Tháng', soBanGhi: SYT_SUM.soThon },
  { key: 'dich', name: 'Dịch bệnh nhóm A, B', eform: 'Dịch bệnh nhóm A, B theo Luật Phòng chống bệnh truyền nhiễm', ky: SYT_KY + ' (cộng 9 tháng)', freq: 'Tháng', soBanGhi: SYT_DICH.banGhi },
  { key: 'hs', name: 'Người dân có hồ sơ sức khỏe điện tử', eform: 'Tỷ lệ người dân có hồ sơ sức khỏe điện tử', ky: SYT_KY, freq: 'Tháng', soBanGhi: SYT_SUM.soThon }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function sytPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const SYT_ITEMS = (function () {
  const S = SYT_SUM, src = 'Eform Sở Y tế (giả lập)', r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;
  const parts = {
    nd: [sytPart('Mức độ thiệt hại, 9 tháng', 'stat', [['Số vụ', S.nd.vu], ['Người mắc, nhập viện', S.nd.mac], ['Ca nặng', S.nd.nang], ['Tử vong', S.nd.tuVong]])],
    bh: [sytPart('Bao phủ (%)', 'stat', [['Tỷ lệ có thẻ BHYT', r2(S.bh.bhyt / S.bh.dan * 100)], ['Chỉ tiêu năm 2026', S.bh.chiTieu]])],
    dich: [sytPart('Số ca mắc 9 tháng', 'bar', S.dich.benh.filter((b) => b[1] >= 100).map((b) => [b[0], b[1]]))],
    hs: [sytPart('Tỷ lệ (%)', 'stat', [['Có hồ sơ sức khỏe điện tử', r1(S.hs.hssk / S.hs.dan * 100)]])]
  };
  return SYT_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
