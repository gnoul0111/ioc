/* ============================== SỞ CÔNG THƯƠNG — 5 CHỈ TIÊU THEO 5 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở Công thương"), 5 eform → 5 chỉ tiêu:
     1. Xuất khẩu, nhập khẩu (bản ghi = 1 doanh nghiệp × 1 kỳ)       2. Bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng (1 cơ sở × 1 kỳ)
     3. Thương mại điện tử (1 phường/xã × 1 nhóm đối tượng × 1 kỳ)   4. Điện năng, xăng dầu, than (1 đơn vị cung ứng × 1 mặt hàng × 1 kỳ)
     5. Chỉ số sản xuất công nghiệp (1 doanh nghiệp × 1 kỳ)
   Hai trường «Mã chỉ tiêu con (CĐS)», «Mã chỉ tiêu QĐ4795» là mã kỹ thuật — KHÔNG hiện trên giao diện, chỉ dùng tên bằng lời.
   Khuôn hiển thị chung (catBoxHtml + Chart.js, xem dashboard-sct.js). Bộ chỉ tiêu cũ (STT 15, 16, 25) đã xóa.

   SỐ GIẢ LẬP đặt theo bậc độ lớn số thật đã công bố của Hà Nội, quy về 9 tháng năm 2026 (năm 2026 Thành phố đặt mục tiêu tăng GRDP 11%):
   - Năm 2025: xuất khẩu 20,65 tỷ USD (+7,8%), nhập khẩu 47,12 tỷ USD (+12,7%).
   - Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng 8 tháng 2025: 615,7 nghìn tỷ đồng (+12,6%).
   - Chỉ số sản xuất công nghiệp 10 tháng 2025 tăng 6,9%.
   - Điện: bình quân hơn 67 triệu kWh/ngày; xăng dầu khoảng 146.500 m³/tháng (xăng 97.500 m³, dầu 48.750 m³).
   - Thương mại điện tử: mục tiêu doanh số B2C chiếm 13% tổng mức bán lẻ; 55% người dân mua sắm trực tuyến.
   Than: chưa tìm được số công bố của Hà Nội — số giả lập, cần Sở cung cấp.
   Nạp TRƯỚC central-level.js (central-level.js dùng SCT_ITEMS). Không dùng hàm nào của file khác. */

const SCT_KY = '9 tháng năm 2026';
const SCT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
function sctN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function sctSum(a) { return a.reduce((s, v) => s + v, 0); }
function sctHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function sctR(name, key) { return (sctHash(name + '|' + key) % 10000) / 10000; }
function sctSplit(total, w) {
  const ws = sctSum(w) || 1, raw = w.map((x) => total * x / ws), base = raw.map(Math.floor);
  raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, total - sctSum(base)).forEach((x) => base[x[1]]++);
  return base;
}

/* ---------- 126 phường/xã ---------- */
const SCT_DV = [
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
/* trọng số: phường trung tâm (thương mại, trụ sở doanh nghiệp), xã có khu công nghiệp (sản xuất, xuất nhập khẩu) */
const SCT_TT = ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình', 'Phường Đống Đa', 'Phường Hai Bà Trưng', 'Phường Cầu Giấy', 'Phường Thanh Xuân',
  'Phường Hà Đông', 'Phường Long Biên', 'Phường Hoàng Mai', 'Phường Tây Hồ', 'Phường Từ Liêm', 'Phường Giảng Võ', 'Phường Ô Chợ Dừa', 'Phường Yên Hòa'];
const SCT_KCN = { 'Xã Thiên Lộc': 6, 'Xã Quang Minh': 4, 'Xã Nội Bài': 3.5, 'Xã Đông Anh': 3, 'Xã Hòa Lạc': 2.5, 'Phường Thượng Cát': 2, 'Xã Phú Nghĩa': 2.2,
  'Xã Thạch Thất': 1.6, 'Xã Quốc Oai': 1.4, 'Phường Phúc Lợi': 1.5, 'Phường Long Biên': 1.6, 'Xã Mê Linh': 1.5, 'Xã Sóc Sơn': 1.2, 'Xã Phú Xuyên': 1.3, 'Xã Thường Tín': 1.2 };
function sctW(n, loai) {
  const r = 0.5 + sctR(n, 'w' + loai), ph = n.indexOf('Phường') === 0, tt = SCT_TT.indexOf(n) >= 0, kcn = SCT_KCN[n] || 0;
  if (loai === 'tm') return r * (tt ? 6 : ph ? 1.6 : 0.6) * (n === 'Phường Hoàn Kiếm' ? 2.2 : n === 'Phường Cửa Nam' || n === 'Phường Đống Đa' ? 1.5 : 1);   // thương mại, bán lẻ
  if (loai === 'cn') return r * (kcn ? 4 * kcn : ph ? 0.5 : 0.7);           // sản xuất công nghiệp
  if (loai === 'xnk') return r * (kcn ? 5 * kcn : tt ? 2.5 : ph ? 0.5 : 0.2); // xuất nhập khẩu (FDI ở khu công nghiệp, thương mại ở trung tâm)
  return r * (tt ? 2.4 : ph ? 1.4 : 0.8) + kcn * 0.6;                       // điện năng, xăng dầu (dân cư + sản xuất)
}
const SCT_MUA = [1.06, 0.82, 1.0, 1.0, 1.02, 1.03, 1.0, 1.02, 1.05];      // Tết làm tháng 2 thấp

/* ================= 1. XUẤT KHẨU, NHẬP KHẨU (triệu USD) ================= */
/* «Thị trường chính», «Ngành hàng/Mặt hàng» là Chữ; IOC gom về các nhóm dưới đây */
const SCT_THI_TRUONG = [['Trung Quốc', 0.17, 0.42], ['Hoa Kỳ', 0.22, 0.05], ['Nhật Bản', 0.14, 0.1], ['Hàn Quốc', 0.09, 0.14], ['EU', 0.13, 0.06], ['ASEAN', 0.12, 0.13], ['Thị trường khác', 0.13, 0.1]];
const SCT_NGANH_XK = [['Điện tử, linh kiện', 0.31], ['Máy móc, thiết bị, phụ tùng', 0.2], ['Dệt may, da giày', 0.14], ['Nông sản, thực phẩm', 0.12], ['Thủ công mỹ nghệ, đồ gỗ', 0.06], ['Hàng hóa khác', 0.17]];
const SCT_XNK = { xk: 16710, nk: 38870, xkCk: 15290, nkCk: 34720, soDn: 640 };   // 9 tháng 2026 và cùng kỳ 2025 (triệu USD); số doanh nghiệp báo cáo
const SCT_HD = [['Xuất khẩu', '#1baf7a'], ['Nhập khẩu', '#2a78d6'], ['Cả hai (Xuất khẩu và Nhập khẩu)', '#7086FD']];

/* ================= 2. BÁN LẺ HÀNG HÓA, DOANH THU DỊCH VỤ TIÊU DÙNG (tỷ đồng) ================= */
const SCT_BL = { banLe: 478600, dichVu: 293900, ckTong: 695100, soCs: 2860 };     // 9 tháng 2026; cùng kỳ 2025 (tỷ đồng); số cơ sở báo cáo
/* «Loại hình kinh doanh» là Chữ; IOC gom về các nhóm [tên, tỷ trọng bán lẻ, tỷ trọng dịch vụ] */
const SCT_LH = [['Siêu thị, trung tâm thương mại', 0.27, 0], ['Cửa hàng tiện lợi, chuyên doanh', 0.38, 0], ['Chợ, hộ kinh doanh', 0.24, 0], ['Bán hàng qua mạng', 0.11, 0],
  ['Lưu trú, ăn uống', 0, 0.33], ['Du lịch lữ hành', 0, 0.04], ['Dịch vụ khác', 0, 0.63]];

/* ================= 3. THƯƠNG MẠI ĐIỆN TỬ (tháng 9) ================= */
/* «Đối tượng thống kê»: [tên, tổng số đối tượng toàn Thành phố, tỷ lệ đạt chuẩn chung] */
const SCT_TMDT = [
  ['Doanh nghiệp nhỏ và vừa', 182000, 0.71], ['Doanh nghiệp', 21500, 0.62], ['Hộ kinh doanh cá thể', 286000, 0.41],
  ['Tổ chức doanh nghiệp cung cấp dịch vụ thiết yếu', 14800, 0.93], ['Sản phẩm chủ lực, đặc trưng, OCOP', 3650, 0.78], ['Người dân, đơn vị vận tải/logistics', 9600, 0.56]
];
const SCT_TMDT_ND = ['Ứng dụng nền tảng số trong kinh doanh', 'Có website hoặc gian hàng trên sàn thương mại điện tử', 'Bán hàng trực tuyến',
  'Chấp nhận thanh toán không dùng tiền mặt', 'Được đưa lên sàn thương mại điện tử', 'Sử dụng nền tảng giao nhận, logistics số'];

/* ================= 4. ĐIỆN NĂNG, XĂNG DẦU, THAN ================= */
const SCT_MH = [['Điện năng', 'triệu kWh', '#eda100'], ['Xăng dầu', 'nghìn m³', '#2a78d6'], ['Than', 'nghìn tấn', '#898781']];
const SCT_NL = { dien: 19240, xangDau: 1358, than: 186, dienCk: 18310, xangDauCk: 1322, thanCk: 197 };   // 9 tháng 2026, cùng kỳ 2025
const SCT_LHDV = [['Đơn vị nhà nước', '#8ba7c2'], ['Doanh nghiệp nhà nước/cổ phần', '#2a78d6'], ['Doanh nghiệp tư nhân', '#1baf7a'], ['Hộ kinh doanh cá thể', '#eda100']];
const SCT_DIEN_MUA = [0.92, 0.78, 0.9, 1.0, 1.15, 1.22, 1.24, 1.18, 1.08];   // nắng nóng tháng 5 – 8 tiêu thụ điện cao
/* tỷ trọng sản lượng theo loại hình đơn vị: điện do EVNHANOI (DN nhà nước) cung ứng; xăng dầu phần lớn Petrolimex, PVOIL… */
const SCT_LHDV_TT = { 0: [0, 1, 0, 0], 1: [0, 0.71, 0.27, 0.02], 2: [0.04, 0.38, 0.5, 0.08] };

/* ================= 5. CHỈ SỐ SẢN XUẤT CÔNG NGHIỆP ================= */
/* «Ngành công nghiệp (VSIC)»: [tên, tỷ trọng giá trị sản xuất, IIP 9 tháng so cùng kỳ (%), IIP tháng 9 so tháng 8 (%)] */
const SCT_NGANH = [['Dệt may', 0.12, 104.2, 101.8], ['Cơ khí, chế tạo', 0.31, 109.8, 102.6], ['Chế biến thực phẩm', 0.22, 106.1, 101.2],
  ['Sản xuất đồ gỗ, nội thất', 0.06, 103.5, 99.4], ['Khác', 0.29, 108.3, 102.1]];
const SCT_IIP = { gtsx: 512400, soDn: 1180, thang: [96.8, 82.4, 121.6, 101.6, 102.1, 101.8, 100.9, 101.7, 102.0] };   // giá trị sản xuất 9 tháng (tỷ đồng); IIP từng tháng so tháng trước

/* ---------- Số của từng phường/xã ---------- */
const SCT_UNITS = (function () {
  const w = (loai) => SCT_DV.map((n) => sctW(n, loai));
  const xk = sctSplit(SCT_XNK.xk, w('xnk')), nk = sctSplit(SCT_XNK.nk, SCT_DV.map((n) => sctW(n, 'xnk') * (SCT_TT.indexOf(n) >= 0 ? 1.8 : 1)));
  const dnXnk = sctSplit(SCT_XNK.soDn, w('xnk'));
  const bl = sctSplit(SCT_BL.banLe, w('tm')), dv = sctSplit(SCT_BL.dichVu, SCT_DV.map((n) => sctW(n, 'tm') * (0.7 + 0.6 * sctR(n, 'dv'))));
  const cs = sctSplit(SCT_BL.soCs, w('tm'));
  const dien = sctSplit(SCT_NL.dien, w('nl')), xd = sctSplit(SCT_NL.xangDau * 10, w('nl')).map((v) => v / 10);
  const than = sctSplit(SCT_NL.than * 10, SCT_DV.map((n) => SCT_KCN[n] ? SCT_KCN[n] : 0.05)).map((v) => v / 10);
  const gt = sctSplit(SCT_IIP.gtsx, w('cn')), dnCn = sctSplit(SCT_IIP.soDn, w('cn'));
  const ph = SCT_DV.map((n) => n.indexOf('Phường') === 0);
  /* thương mại điện tử: phân tổng đối tượng theo trọng số thương mại; tỷ lệ đạt lệch quanh mức chung (phường cao hơn xã) */
  const tmdt = SCT_TMDT.map((d, i) => {
    const tong = sctSplit(d[1], SCT_DV.map((n) => sctW(n, i === 4 ? 'cn' : 'tm') + (i === 4 && !ph[SCT_DV.indexOf(n)] ? 1.5 : 0)));
    return tong.map((t, j) => Math.round(t * Math.max(0.05, Math.min(0.995, d[2] + (ph[j] ? 0.06 : -0.08) + 0.12 * (sctR(SCT_DV[j], 'td' + i) - 0.5)))));
  });
  const tmdtTong = SCT_TMDT.map((d) => sctSplit(d[1], SCT_DV.map((n, j) => sctW(n, SCT_TMDT.indexOf(d) === 4 ? 'cn' : 'tm') + (SCT_TMDT.indexOf(d) === 4 && !ph[j] ? 1.5 : 0))));
  return SCT_DV.map((ten, j) => ({
    ten: ten, phuong: ph[j], xk: xk[j], nk: nk[j], dnXnk: dnXnk[j], banLe: bl[j], dichVu: dv[j], soCs: cs[j],
    dien: dien[j], xangDau: xd[j], than: than[j], gtsx: gt[j], dnCn: dnCn[j],
    tmdtTong: tmdtTong.map((a) => a[j]), tmdtDat: tmdt.map((a) => Math.min(a[j], tmdtTong[SCT_TMDT.indexOf(SCT_TMDT[tmdt.indexOf(a)])][j]))
  }));
})();

/* ---------- Số tổng hợp ---------- */
const SCT_SUM = (function () {
  const U = SCT_UNITS, t = (f) => sctSum(U.map(f)), mua = (total, m) => sctSplit(total, m || SCT_MUA);
  const top = (f, n) => U.map((u) => [u.ten, f(u)]).sort((a, b) => b[1] - a[1]).slice(0, n || 10);
  const xk = t((u) => u.xk), nk = t((u) => u.nk), bl = t((u) => u.banLe), dv = t((u) => u.dichVu);
  const blT = mua(bl), dvT = mua(dv), tongT = blT.map((v, m) => v + dvT[m]);
  const tmTong = SCT_TMDT.map((_, i) => t((u) => u.tmdtTong[i])), tmDat = SCT_TMDT.map((_, i) => t((u) => u.tmdtDat[i]));
  const tlPX = SCT_TMDT.map((_, i) => [true, false].map((p) => { const g = U.filter((u) => u.phuong === p); return sctSum(g.map((u) => u.tmdtDat[i])) / sctSum(g.map((u) => u.tmdtTong[i])) * 100; }));
  return {
    xnk: { xk: xk, nk: nk, xkCk: SCT_XNK.xkCk, nkCk: SCT_XNK.nkCk, soDn: t((u) => u.dnXnk), xkT: mua(xk), nkT: mua(nk),
      ttXk: sctSplit(xk, SCT_THI_TRUONG.map((x) => x[1])), ttNk: sctSplit(nk, SCT_THI_TRUONG.map((x) => x[2])), nganh: sctSplit(xk, SCT_NGANH_XK.map((x) => x[1])),
      hd: sctSplit(t((u) => u.dnXnk), [0.36, 0.29, 0.35]), top: top((u) => u.xk + u.nk) },
    bl: { banLe: bl, dichVu: dv, tong: bl + dv, ck: SCT_BL.ckTong, soCs: t((u) => u.soCs), blT: blT, dvT: dvT, tongT: tongT,
      lh: SCT_LH.map((x) => Math.round(bl * x[1] + dv * x[2])), top: top((u) => u.banLe + u.dichVu),
      tmdtB2c: Math.round(bl * SCT_LH[3][1]) },
    tmdt: { tong: tmTong, dat: tmDat, tl: tmTong.map((v, i) => tmDat[i] / v * 100), tlPX: tlPX,
      hkdThap: U.map((u) => [u.ten, u.tmdtDat[2] / u.tmdtTong[2] * 100]).sort((a, b) => a[1] - b[1]).slice(0, 10) },
    nl: { dien: t((u) => u.dien), xangDau: Math.round(t((u) => u.xangDau) * 10) / 10, than: Math.round(t((u) => u.than) * 10) / 10,
      dienCk: SCT_NL.dienCk, xangDauCk: SCT_NL.xangDauCk, thanCk: SCT_NL.thanCk,
      dienT: sctSplit(t((u) => u.dien), SCT_DIEN_MUA), xdT: sctSplit(Math.round(t((u) => u.xangDau)), SCT_MUA),
      lhdv: [1, 2].map((mh) => SCT_LHDV.map((_, i) => SCT_LHDV_TT[mh][i])), topDien: top((u) => u.dien) },
    iip: { gtsx: t((u) => u.gtsx), soDn: t((u) => u.dnCn), nganhGt: sctSplit(t((u) => u.gtsx), SCT_NGANH.map((x) => x[1])),
      /* IIP chung = bình quân các ngành có trọng số theo giá trị sản xuất */
      chung: sctSum(SCT_NGANH.map((x) => x[1] * x[2])) / sctSum(SCT_NGANH.map((x) => x[1])),
      thang9: sctSum(SCT_NGANH.map((x) => x[1] * x[3])) / sctSum(SCT_NGANH.map((x) => x[1])), thang: SCT_IIP.thang, top: top((u) => u.gtsx) }
  };
})();

/* ---------- Mô tả 5 chỉ tiêu (dùng cho tài liệu) ---------- */
const SCT_CT = [
  { key: 'xnk', name: 'Xuất khẩu, nhập khẩu', eform: 'Eform Xuất khẩu Nhập khẩu', ky: SCT_KY, freq: 'Tháng', soBanGhi: SCT_SUM.xnk.soDn * 9 },
  { key: 'bl', name: 'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng', eform: 'Eform Bán lẻ hàng hóa và Doanh thu dịch vụ tiêu dùng', ky: SCT_KY, freq: 'Tháng', soBanGhi: SCT_SUM.bl.soCs * 9 },
  { key: 'tmdt', name: 'Thương mại điện tử', eform: 'Eform Thương mại điện tử', ky: 'Tháng 9/2026', freq: 'Tháng', soBanGhi: SCT_DV.length * SCT_TMDT.length },
  { key: 'nl', name: 'Điện năng, xăng dầu, than', eform: 'Eform Điện năng, Xăng dầu, Than', ky: SCT_KY, freq: 'Tháng', soBanGhi: 1260 },
  { key: 'iip', name: 'Chỉ số sản xuất công nghiệp', eform: 'Eform Chỉ số sản xuất công nghiệp (IIP)', ky: SCT_KY, freq: 'Tháng', soBanGhi: SCT_SUM.iip.soDn * 9 }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function sctPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const SCT_ITEMS = (function () {
  const S = SCT_SUM, src = 'Eform Sở Công Thương (giả lập)', r1 = (v) => Math.round(v * 10) / 10;
  const parts = {
    xnk: [sctPart('9 tháng (triệu USD)', 'stat', [['Xuất khẩu', S.xnk.xk], ['Nhập khẩu', S.xnk.nk]])],
    bl: [sctPart('9 tháng (tỷ đồng)', 'stat', [['Bán lẻ hàng hóa', S.bl.banLe], ['Doanh thu dịch vụ', S.bl.dichVu]])],
    tmdt: [sctPart('Tỷ lệ đạt (%)', 'bar', SCT_TMDT.map((d, i) => [d[0], r1(S.tmdt.tl[i])]))],
    nl: [sctPart('9 tháng', 'stat', [['Điện năng (triệu kWh)', S.nl.dien], ['Xăng dầu (nghìn m³)', S.nl.xangDau], ['Than (nghìn tấn)', S.nl.than]])],
    iip: [sctPart('Chỉ số so cùng kỳ (%)', 'bar', SCT_NGANH.map((x) => [x[0], x[2]]))]
  };
  return SCT_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
