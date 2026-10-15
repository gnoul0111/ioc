/* ============================== SỞ NÔNG NGHIỆP VÀ MÔI TRƯỜNG — 10 CHỈ TIÊU THEO 10 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở NNMT"), 10 eform → 10 chỉ tiêu (1 eform = 1 chỉ tiêu).
   Cả 10 eform DÙNG CHUNG MỘT KHUÔN 18 trường: kỳ, «Địa bàn», «Thôn/TDP», «Phân tổ/loại dữ liệu», «Tên nội dung/dự án/sự kiện»,
   «Đơn vị chủ trì/phối hợp», «Kế hoạch/chuẩn tham chiếu» (Chữ), «Giá trị kỳ này», «Giá trị lũy kế», «Cùng kỳ/chuẩn so sánh»,
   «Tỷ lệ/tiến độ tự tính», «Chênh lệch kỳ này-cùng kỳ», «Trạng thái triển khai», «Vướng mắc/Nguyên nhân».
   Eform KHÔNG có trường đơn vị tính → ý nghĩa, đơn vị của "Giá trị" do IOC quy ước theo từng eform (NM_CT[].donVi), cần Sở xác nhận.
   Hai chỉ tiêu cũ có số liệu thật lấy từ hệ thống (Tổng hợp dữ liệu GPMB, Thống kê sử dụng đất đai — dashboard-nong-nghiep.js)
   KHÔNG có eform mới nên giữ nguyên; 10 chỉ tiêu cũ (STT 17-19, 75, 76, 78, 79, 81-83) đã xóa.

   SỐ GIẢ LẬP đặt theo bậc độ lớn số thật đã công bố (quy về 9 tháng / tháng 9 năm 2026):
   - Nông thôn mới: 382/382 xã (trước sắp xếp) đạt chuẩn, 229 xã nâng cao (60%), 84+ xã kiểu mẫu; 2021-2025 huy động ~86.800 tỷ đồng.
   - Rừng: 18.342 ha rừng (tự nhiên 7.593 ha, trồng 10.749 ha; QĐ 1083/QĐ-UBND 27/02/2025), tập trung ở Ba Vì 7.574 ha, Mỹ Đức 4.401 ha,
     Sóc Sơn 3.314 ha, Thạch Thất 2.104 ha, Quốc Oai 861 ha, Sơn Tây 588 ha, Chương Mỹ 521 ha (huyện cũ).
   - Phòng chống thiên tai: trên 626 km đê, 89 hồ chứa, hàng chục điểm úng ngập; Hà Nội không có thủy điện.
   - Giảm nghèo: từ 1/7/2025, 126/126 xã, phường không còn hộ nghèo; còn 9.928 hộ cận nghèo theo chuẩn Thành phố, 43 đơn vị hết cả cận nghèo.
   - Hà Nội tự cân đối ngân sách → vốn chương trình mục tiêu quốc gia chủ yếu là ngân sách địa phương, không có NSTW.
   Nạp TRƯỚC central-level.js (central-level.js dùng NM_ITEMS). Không dùng hàm nào của file khác. */

const NM_KY9 = '9 tháng năm 2026', NM_KYT9 = 'Tháng 9/2026';
const NM_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
function nmN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function nmSum(a) { return a.reduce((s, v) => s + v, 0); }
function nmHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function nmR(name, key) { return (nmHash(name + '|' + key) % 10000) / 10000; }
function nmSplit(total, w) {
  const ws = nmSum(w) || 1, raw = w.map((x) => total * x / ws), base = raw.map(Math.floor);
  raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, total - nmSum(base)).forEach((x) => base[x[1]]++);
  return base;
}
const nm2 = (v) => Math.round(v * 100) / 100;

/* ---------- 126 phường/xã ---------- */
const NM_DV = [
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
const NM_XA = NM_DV.filter((n) => n.indexOf('Xã') === 0);
/* Cờ theo phản hồi nhóm triển khai 13/10/2026 — chỉ hiện số tính được từ trường có trong eform:
   NNMT_SHOW_KE_HOACH: «Kế hoạch/chuẩn tham chiếu» là trường Chữ, eform không có kế hoạch dạng số → ẩn kế hoạch trồng rừng,
     kế hoạch vốn nông thôn mới, giảm nghèo và các tỷ lệ so kế hoạch (số kế hoạch giả lập vẫn giữ trong cấu hình).
   NNMT_SHOW_SO_HO: eform hỗ trợ lương thực chỉ có một trường giá trị (số người), không có «Số hộ» → ẩn số hộ.
   Đặt true để hiện lại. */
const NNMT_SHOW_KE_HOACH = false;
const NNMT_SHOW_SO_HO = false;
const NM_TT = [['Hoàn thành', '#1baf7a'], ['Đang thực hiện', '#2a78d6'], ['Chưa triển khai', '#8ba7c2'], ['Chậm tiến độ', '#eda100'], ['Đình trệ', '#d33a44'], ['Cần xử lý', '#FD9843']];
/* xã có rừng, trọng số theo diện tích rừng của huyện cũ (QĐ 1083/QĐ-UBND) */
const NM_RUNG = [['Xã Ba Vì', 3.2], ['Xã Yên Bài', 1.9], ['Xã Suối Hai', 1.4], ['Xã Bất Bạt', 1.0], ['Xã Mỹ Đức', 1.2], ['Xã Hương Sơn', 1.6], ['Xã Hồng Sơn', 0.8],
  ['Xã Phúc Sơn', 0.8], ['Xã Sóc Sơn', 1.2], ['Xã Nội Bài', 0.6], ['Xã Kim Anh', 0.5], ['Xã Trung Giã', 0.5], ['Xã Đa Phúc', 0.5], ['Xã Yên Xuân', 1.3],
  ['Xã Hòa Lạc', 0.8], ['Xã Phú Cát', 0.5], ['Xã Quốc Oai', 0.35], ['Xã Trần Phú', 0.3], ['Xã Xuân Mai', 0.2], ['Phường Tùng Thiện', 0.6]];
/* chọn địa bàn theo trọng số (cố định theo khóa) */
function nmChon(list, key) { const t = nmSum(list.map((x) => x[1])); let r = nmR('chon', key) * t; for (const x of list) { r -= x[1]; if (r < 0) return x[0]; } return list[list.length - 1][0]; }

/* ================= 1. NÔNG THÔN MỚI — xã đạt chuẩn ================= */
const NM_MUC = [['Nông thôn mới', '#39d5ff'], ['Nông thôn mới nâng cao', '#2a78d6'], ['Nông thôn mới kiểu mẫu', '#1baf7a']];
const NM_VEN_DO = ['Xã Đông Anh', 'Xã Gia Lâm', 'Xã Thanh Trì', 'Xã Hoài Đức', 'Xã Thanh Oai', 'Xã Bát Tràng', 'Xã Thiên Lộc', 'Xã Phúc Thịnh', 'Xã Phù Đổng',
  'Xã Đại Thanh', 'Xã Ngọc Hồi', 'Xã Sơn Đồng', 'Xã An Khánh', 'Xã Dương Hòa', 'Xã Đan Phượng', 'Xã Ô Diên', 'Xã Thư Lâm', 'Xã Mê Linh', 'Xã Quang Minh'];
const NM_NTM = (function () {
  const xep = NM_XA.map((x) => [x, nmR(x, 'ntm') + (NM_VEN_DO.indexOf(x) >= 0 ? 0.6 : 0)]).sort((a, b) => b[1] - a[1]).map((r) => r[0]);
  return NM_XA.map((x) => {
    const i = xep.indexOf(x), muc = i < 14 ? 2 : i < 47 ? 1 : 0, R = (k) => nmR(x, k);
    const tc = muc ? 19 : 13 + Math.round(5 * R('tc'));          // số tiêu chí NTM nâng cao đã đạt (bộ 19 tiêu chí)
    /* Bộ tiêu chí 2026–2030 (QĐ 51/2025/QĐ-TTg, hiệu lực 15/02/2026; 10 tiêu chí): đến Quý III/2026 chưa xã nào được công nhận theo bộ mới;
       3 xã đủ 10/10 tiêu chí đang hoàn thiện hồ sơ (Hà Nội dự kiến công nhận 3 xã trong năm 2026 — Báo Đại biểu Nhân dân 28/8/2026).
       tc10 = số tiêu chí của bộ mới đã đạt; muc26: 0 đạt chuẩn, 1 nông thôn mới hiện đại, 2 chưa đạt chuẩn. */
    const tc10 = i < 3 ? 10 : muc === 2 ? 9 : muc === 1 ? (R('t10') < 0.55 ? 9 : 8) : (R('t10') < 0.3 ? 8 : R('t10') < 0.75 ? 7 : 6);
    return { diaBan: x, muc: muc, tieuChi: tc, cungKy: Math.max(10, tc - Math.round(2 * R('ck'))), tt: muc ? 0 : tc >= 16 ? 1 : 3, tc10: tc10, muc26: 2, hoSo: i < 3 };
  });
})();
/* Mức đạt chuẩn theo bộ tiêu chí 2026–2030 (BA mục 23) */
const NM_MUC26 = [['Đạt chuẩn nông thôn mới (2026–2030)', '#39d5ff'], ['Nông thôn mới hiện đại', '#1baf7a'], ['Chưa đạt chuẩn', '#8ba7c2']];
const NM_SO_TC = 10;

/* ================= 2. RỪNG BỊ THIỆT HẠI ================= */
const NM_TH = [['Bị cháy', '#d33a44'], ['Bị chặt phá', '#eda100'], ['Nguyên nhân khác', '#8ba7c2']];
const NM_TH_CUNG_KY = [3.62, 1.14, 1.38];                       // ha, 9 tháng năm 2025 theo nguyên nhân
const NM_RUNG_TH = (function () {
  const out = [], spec = [[0, 6, [0.2, 1.0], [0.25, 0.3, 0.25, 0.12, 0.02, 0, 0.02, 0.02, 0.02]], [1, 5, [0.05, 0.3], null], [2, 3, [0.15, 0.5], [0, 0, 0, 0, 0.05, 0.1, 0.35, 0.4, 0.1]]];
  spec.forEach(([nn, so, ha, mua]) => {
    for (let j = 0; j < so; j++) {
      const k = 'th' + nn + j, R = (s) => nmR(k, s);
      let thang = Math.floor(9 * R('m'));
      if (mua) { let r = R('m2'), m = 0; for (; m < 8; m++) { r -= mua[m]; if (r < 0) break; } thang = m; }
      out.push({ diaBan: nmChon(NM_RUNG, k), nn: nn, thang: thang, ha: nm2(ha[0] + (ha[1] - ha[0]) * R('ha')), tt: thang < 7 ? 0 : R('tt') < 0.6 ? 1 : 5 });
    }
  });
  return out;
})();

/* ================= 3. RỪNG TRỒNG MỚI TẬP TRUNG ================= */
const NM_LOAI_RUNG = [['Rừng phòng hộ', '#2a78d6'], ['Rừng sản xuất', '#1baf7a'], ['Rừng đặc dụng', '#7086FD']];
const NM_TM_KH = [60, 75, 25];                                   // ha, kế hoạch năm 2026 theo loại rừng
const NM_TM_MUA = [0.05, 0.22, 0.24, 0.12, 0.03, 0.02, 0.1, 0.14, 0.08];   // vụ xuân (T2–T4), vụ thu (T7–T9)
const NM_CAY_PT = { keHoach: 450000, luyKe: 0 };                 // cây phân tán (cây) — đơn vị khác, tính riêng
const NM_RUNG_TM = (function () {
  const out = [], noi = [[['Xã Sóc Sơn', 1], ['Xã Ba Vì', 0.8], ['Xã Yên Xuân', 0.6], ['Xã Hương Sơn', 0.5], ['Xã Nội Bài', 0.4]],
    [['Xã Ba Vì', 1], ['Xã Yên Bài', 0.9], ['Xã Mỹ Đức', 0.8], ['Xã Yên Xuân', 0.7], ['Xã Suối Hai', 0.6], ['Xã Phúc Sơn', 0.5], ['Xã Hòa Lạc', 0.4]],
    [['Xã Ba Vì', 1], ['Xã Hương Sơn', 0.7]]];
  NM_TM_KH.forEach((kh, loai) => {
    const ds = noi[loai], khDb = nmSplit(kh * 10, ds.map((x) => x[1]));                 // phân kế hoạch (0,1 ha) cho địa bàn
    ds.forEach((x, j) => {
      const k = 'tm' + loai + j, R = (s) => nmR(k, s), khHa = khDb[j] / 10, dat = 0.55 + 0.42 * R('d');
      const thang = NM_TM_MUA.map((w, m) => nm2(khHa * dat * w * (0.8 + 0.4 * R('m' + m))));
      const lk = nm2(nmSum(thang));
      out.push({ diaBan: x[0], loai: loai, keHoach: khHa, thang: thang, luyKe: lk, cungKy: nm2(lk * (0.8 + 0.3 * R('ck'))),
        tt: lk >= khHa * 0.95 ? 0 : lk < khHa * 0.6 ? 3 : 1 });
    });
  });
  NM_CAY_PT.luyKe = Math.round(NM_CAY_PT.keHoach * 0.82);
  return out;
})();

/* ================= 4, 5. CHƯƠNG TRÌNH MỤC TIÊU QUỐC GIA (vốn, triệu đồng) ================= */
const NM_NGUON = [['NSTW', '#8ba7c2'], ['NSĐP', '#2a78d6'], ['Tín dụng', '#7086FD'], ['Doanh nghiệp', '#eda100'], ['Đóng góp người dân', '#1baf7a'], ['Nguồn khác', '#898781']];
const NM_GN_ND = [['Hỗ trợ nhà ở', '#2a78d6'], ['Hỗ trợ sinh kế, phát triển sản xuất', '#1baf7a'], ['Đào tạo nghề, giải quyết việc làm', '#7086FD'],
  ['Hỗ trợ y tế, bảo hiểm y tế', '#39d5ff'], ['Truyền thông, giảm nghèo về thông tin', '#eda100'], ['Nâng cao năng lực, giám sát', '#898781']];
const NM_DUONG = [0.04, 0.09, 0.16, 0.25, 0.35, 0.47, 0.6, 0.78, 1];                  // tiến độ giải ngân lũy kế chuẩn (phần của T9)
/* sinh dự án: [số dự án mỗi địa bàn], tổng kế hoạch (triệu), danh sách nhóm phân tổ (chỉ số + trọng số), danh sách địa bàn */
function nmDuAn(key, tongKh, nhom, dsDb, soDa) {
  const out = [], w = [];
  dsDb.forEach((db) => { for (let j = 0; j < soDa(db); j++) w.push([db, j, 0.3 + nmR(db + key, 'w' + j) * 1.4 * (NM_VEN_DO.indexOf(db) >= 0 ? 1.4 : 1)]); });
  const kh = nmSplit(Math.round(tongKh / 10), w.map((x) => x[2])).map((v) => v * 10);
  const tongW = nmSum(nhom.map((g) => g[1]));
  w.forEach((x, i) => {
    const k = key + x[0] + x[1], R = (s) => nmR(k, s);
    let r = R('n') * tongW, g = 0; for (; g < nhom.length - 1; g++) { r -= nhom[g][1]; if (r < 0) break; }
    const rt = R('tt'), tt = rt < 0.15 ? 0 : rt < 0.75 ? 1 : rt < 0.83 ? 2 : rt < 0.93 ? 3 : rt < 0.96 ? 4 : 5;
    const tl = tt === 0 ? 0.95 + 0.05 * R('t') : tt === 1 ? 0.4 + 0.4 * R('t') : tt === 2 ? 0 : tt === 3 ? 0.15 + 0.25 * R('t') : tt === 4 ? 0.05 + 0.15 * R('t') : 0.2 + 0.3 * R('t');
    const gn9 = Math.round(kh[i] * tl), lk = NM_DUONG.map((c, m) => Math.round(gn9 * Math.min(1, c * (0.85 + 0.3 * R('m' + m)))));
    lk[8] = gn9; for (let m = 1; m < 9; m++) lk[m] = Math.max(lk[m], lk[m - 1]);
    out.push({ diaBan: x[0], phanTo: nhom[g][0], keHoach: kh[i], luyKe: lk, gn9: gn9, gnKy: gn9 - lk[7], cungKy: Math.round(gn9 * (0.82 + 0.15 * R('ck'))), tt: tt });
  });
  return out;
}
/* 4. Nông thôn mới: kế hoạch năm 2026 ~8.600 tỷ đồng, chủ yếu ngân sách địa phương (không có NSTW) */
const NM_NTM_VON = nmDuAn('ntmv', 8600000, [[1, 0.82], [2, 0.06], [3, 0.05], [4, 0.05], [5, 0.02]], NM_XA, (db) => 3 + Math.floor(5 * nmR(db, 'sda')));
/* 5. Giảm nghèo: ~182 tỷ đồng; chỉ các phường/xã còn hộ cận nghèo (43/126 đơn vị đã hết cả hộ cận nghèo) */
const NM_GN_DB = NM_DV.filter((n) => nmR(n, 'cn') > 43 / 126);
const NM_GN_VON = nmDuAn('gnv', 182000, [[0, 0.3], [1, 0.25], [2, 0.18], [3, 0.12], [4, 0.08], [5, 0.07]], NM_GN_DB, (db) => 1 + Math.floor(2.4 * nmR(db, 'gda')));

/* ================= 6. KHÍ TƯỢNG THỦY VĂN (số bản tin, lượt số liệu theo tháng, cả Thành phố) ================= */
const NM_KTTV_LOAI = [['Số liệu quan trắc', '#8ba7c2'], ['Bản tin dự báo', '#2a78d6'], ['Cảnh báo thiên tai', '#d33a44']];
const NM_KTTV = {
  thang: [[1820, 1650, 1830, 1770, 1840, 1780, 1850, 1860, 1790], [93, 84, 93, 90, 93, 90, 96, 99, 92], [2, 1, 3, 6, 9, 11, 16, 18, 12]],
  cungKy: [[1800, 1640, 1820, 1760, 1830, 1770, 1840, 1850, 1780], [93, 84, 93, 90, 93, 90, 98, 104, 96], [2, 1, 2, 5, 8, 10, 19, 22, 15]]
};

/* ================= 7. CÔNG TRÌNH PHÒNG CHỐNG THIÊN TAI ================= */
const NM_PCTT_LOAI = [['Hồ chứa thủy lợi', '#2a78d6', 'hồ'], ['Thủy điện', '#7086FD', 'công trình'], ['Đê điều', '#1baf7a', 'km'], ['Sạt lở bờ sông/bờ biển', '#eda100', 'điểm'], ['Điểm úng ngập', '#d33a44', 'điểm']];
/* [loại, số công trình theo trạng thái (thứ tự NM_TT), địa bàn có thể có] */
const NM_PCTT_SPEC = [
  [0, [78, 8, 0, 0, 0, 3], NM_RUNG.concat([['Xã Quốc Oai', 1], ['Xã Thạch Thất', 1], ['Xã Xuân Mai', 1]])],
  [2, [31, 5, 0, 0, 0, 1], [['Xã Đông Anh', 1], ['Xã Gia Lâm', 1], ['Xã Thanh Trì', 1], ['Phường Long Biên', 1], ['Phường Tây Hồ', 1], ['Xã Phúc Thọ', 1], ['Xã Hát Môn', 1], ['Phường Sơn Tây', 1],
    ['Xã Mê Linh', 1], ['Xã Thường Tín', 1], ['Xã Phú Xuyên', 1], ['Xã Chương Dương', 1], ['Xã Đan Phượng', 1], ['Xã Bất Bạt', 1], ['Xã Mỹ Đức', 1], ['Xã Ứng Hòa', 1]]],
  [3, [17, 14, 0, 4, 0, 11], [['Xã Bất Bạt', 1.5], ['Xã Ba Vì', 1], ['Xã Phúc Thọ', 1.2], ['Xã Hát Môn', 1], ['Phường Sơn Tây', 0.8], ['Xã Mê Linh', 1], ['Xã Đông Anh', 0.8],
    ['Xã Thường Tín', 1], ['Xã Phú Xuyên', 1], ['Xã Chương Dương', 1.2], ['Xã Đan Phượng', 0.8], ['Phường Hồng Hà', 0.6], ['Xã Mỹ Đức', 0.7]]],
  [4, [9, 12, 0, 0, 0, 11], [['Phường Thanh Xuân', 1.4], ['Phường Đống Đa', 1.2], ['Phường Cầu Giấy', 1.2], ['Phường Hoàng Mai', 1], ['Phường Hà Đông', 1.3], ['Phường Nghĩa Đô', 0.8],
    ['Phường Ba Đình', 0.6], ['Phường Kim Liên', 0.7], ['Phường Láng', 0.8], ['Phường Từ Liêm', 0.9], ['Phường Dương Nội', 0.8], ['Phường Chương Mỹ', 1]]]
];
const NM_DE_KM = 626.4;
const NM_PCTT = (function () {
  const out = [];
  NM_PCTT_SPEC.forEach(([loai, soTt, dsDb]) => {
    const n = nmSum(soTt), kmDe = loai === 2 ? nmSplit(Math.round(NM_DE_KM * 10), Array.from({ length: n }, (_, j) => 0.4 + nmR('de' + j, 'km'))) : null;
    let j = 0;
    soTt.forEach((so, tt) => { for (let s = 0; s < so; s++, j++) out.push({ loai: loai, diaBan: nmChon(dsDb, 'pc' + loai + j), tt: tt, giaTri: loai === 2 ? kmDe[j] / 10 : 1 }); });
  });
  return out;
})();

/* ================= 8, 9. HỖ TRỢ LƯƠNG THỰC (hộ) VÀ GẠO (tấn) ================= */
const NM_LD = [['Thiên tai', '#2a78d6'], ['Hỏa hoạn', '#d33a44'], ['Giáp hạt', '#eda100'], ['Bất khả kháng khác', '#898781'], ['Dự trữ/khẩn cấp', '#7086FD']];
/* cùng kỳ 9 tháng 2025: 142 hộ, khoảng 3,6 người/hộ → 511 lượt người */
const NM_HT_CUNG_KY = { ho: 142, nguoi: 511, gaoTan: 16.8 };
/* sự kiện: [lý do, số sự kiện, tháng có thể (null = bất kỳ), địa bàn, số hộ mỗi sự kiện, số tháng được hỗ trợ] — Hà Nội không còn giáp hạt */
const NM_HT_SPEC = [
  [0, 6, [6, 7], [['Phường Chương Mỹ', 1.4], ['Xã Trần Phú', 1], ['Xã Xuân Mai', 1], ['Xã Quốc Oai', 0.8], ['Xã Mỹ Đức', 0.7], ['Xã Phú Cát', 0.6]], [12, 32], 2],
  [1, 14, null, NM_DV.map((n) => [n, n.indexOf('Phường') === 0 ? 1.2 : 1]), [1, 5], 1],
  [3, 5, null, [['Xã Bất Bạt', 1], ['Xã Phúc Thọ', 1], ['Xã Chương Dương', 1], ['Xã Ba Vì', 1]], [2, 6], 1]
];
const NM_HO_TRO = (function () {
  const out = [];
  NM_HT_SPEC.forEach(([ld, so, thangs, dsDb, hoK, soThang]) => {
    for (let j = 0; j < so; j++) {
      const k = 'ht' + ld + j, R = (s) => nmR(k, s);
      const ho = hoK[0] + Math.round((hoK[1] - hoK[0]) * R('ho')), nguoi = Math.round(ho * (3.2 + 0.9 * R('ng')));
      out.push({ ld: ld, diaBan: nmChon(dsDb, k), thang: thangs ? thangs[Math.floor(R('t') * thangs.length)] : Math.floor(9 * R('t')),
        ho: ho, nguoi: nguoi, gaoKg: nguoi * 15 * soThang, tt: R('x') < 0.92 ? 0 : 1 });
    }
  });
  return out;
})();

/* ================= 10. BẢN ĐỒ VÀ ẢNH VIỄN THÁM (số sản phẩm) ================= */
const NM_BD_LOAI = [['Bản đồ rủi ro thiên tai', '#d33a44'], ['Bản đồ sạt lở', '#eda100'], ['Bản đồ ngập lụt', '#2a78d6'], ['Ảnh vệ tinh/viễn thám', '#7086FD'], ['Lớp GIS khác', '#1baf7a']];
const NM_BD_SO = [26, 14, 22, 36, 18], NM_BD_CUNG_KY = 98;
const NM_BAN_DO = (function () {
  const out = [], vung = NM_PCTT_SPEC[2][2].concat(NM_PCTT_SPEC[3][2], NM_RUNG.slice(0, 6));
  NM_BD_SO.forEach((so, loai) => {
    for (let j = 0; j < so; j++) {
      const k = 'bd' + loai + j, R = (s) => nmR(k, s);
      /* bản đồ theo xã ở vùng ven sông, ngập, đồi núi; ảnh vệ tinh, lớp GIS là sản phẩm toàn Thành phố, ghi ở địa bàn trụ sở Sở (Phường Láng) */
      out.push({ loai: loai, diaBan: loai >= 3 ? 'Phường Láng' : nmChon(vung, k), thang: Math.floor(9 * R('t')), tt: R('tt') < 0.78 ? 0 : R('tt') < 0.95 ? 1 : 2 });
    }
  });
  return out;
})();

/* ---------- Số tổng hợp ---------- */
const NM_SUM = (function () {
  const t = (a, f) => nmSum(a.map(f)), M = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const top = (a, f, n) => { const g = {}; a.forEach((r) => { g[r.diaBan] = (g[r.diaBan] || 0) + f(r); }); return Object.keys(g).map((k) => [k, g[k]]).sort((x, y) => y[1] - x[1]).slice(0, n || 10); };
  const von = (R) => ({ n: R.length, kh: t(R, (r) => r.keHoach), gn: t(R, (r) => r.gn9), gnKy: t(R, (r) => r.gnKy), cungKy: t(R, (r) => r.cungKy),
    luyKeT: M.map((m) => t(R, (r) => r.luyKe[m])), tt: NM_TT.map((_, i) => R.filter((r) => r.tt === i).length), top: top(R, (r) => r.gn9) });
  const ntm = { n: NM_NTM.length, muc: NM_MUC.map((_, i) => NM_NTM.filter((r) => r.muc === i).length),
    tieuChi: [13, 14, 15, 16, 17, 18].map((v) => [v, NM_NTM.filter((r) => r.muc === 0 && r.tieuChi === v).length]),
    tt: NM_TT.map((_, i) => NM_NTM.filter((r) => r.tt === i).length),
    /* bộ tiêu chí 2026–2030 */
    muc26: NM_MUC26.map((_, i) => NM_NTM.filter((r) => r.muc26 === i).length),
    tc10: [6, 7, 8, 9, 10].map((v) => [v, NM_NTM.filter((r) => r.muc26 === 2 && r.tc10 === v).length]),
    hoSo: NM_NTM.filter((r) => r.hoSo).length,
    tcTb: NM_NTM.reduce((s, r) => s + r.tc10, 0) / NM_NTM.length };
  const th = NM_RUNG_TH, tm = NM_RUNG_TM;
  const ntmVon = von(NM_NTM_VON);
  ntmVon.nguon = NM_NGUON.map((_, i) => t(NM_NTM_VON.filter((r) => r.phanTo === i), (r) => r.gn9));
  ntmVon.nguonKh = NM_NGUON.map((_, i) => t(NM_NTM_VON.filter((r) => r.phanTo === i), (r) => r.keHoach));
  ntmVon.cungKyT = M.map((m) => Math.round(ntmVon.luyKeT[m] * ntmVon.cungKy / ntmVon.gn));
  const gnVon = von(NM_GN_VON);
  gnVon.nd = NM_GN_ND.map((_, i) => t(NM_GN_VON.filter((r) => r.phanTo === i), (r) => r.gn9));
  gnVon.ndKh = NM_GN_ND.map((_, i) => t(NM_GN_VON.filter((r) => r.phanTo === i), (r) => r.keHoach));
  gnVon.db = NM_GN_DB.length;
  const kt = NM_KTTV;
  return {
    ntm: ntm,
    rungTh: { n: th.length, ha: nm2(t(th, (r) => r.ha)), cungKy: nm2(nmSum(NM_TH_CUNG_KY)), nnHa: NM_TH.map((_, i) => nm2(t(th.filter((r) => r.nn === i), (r) => r.ha))),
      nnVu: NM_TH.map((_, i) => th.filter((r) => r.nn === i).length), thangHa: NM_TH.map((_, i) => M.map((m) => nm2(t(th.filter((r) => r.nn === i && r.thang === m), (r) => r.ha)))),
      top: top(th, (r) => r.ha).map((r) => [r[0], nm2(r[1])]), canXuLy: th.filter((r) => r.tt !== 0).length },
    rungTm: { kh: nmSum(NM_TM_KH), ha: nm2(t(tm, (r) => r.luyKe)), cungKy: nm2(t(tm, (r) => r.cungKy)), loaiHa: NM_LOAI_RUNG.map((_, i) => nm2(t(tm.filter((r) => r.loai === i), (r) => r.luyKe))),
      lkT: M.map((m) => nm2(t(tm, (r) => nmSum(r.thang.slice(0, m + 1))))), khT: M.map((m) => nm2(nmSum(NM_TM_KH) * nmSum(NM_TM_MUA.slice(0, m + 1)) / nmSum(NM_TM_MUA) * 0.9)),
      top: top(tm, (r) => r.luyKe).map((r) => [r[0], nm2(r[1])]), cham: tm.filter((r) => r.tt === 3).length, cayPt: NM_CAY_PT },
    ntmVon: ntmVon, gnVon: gnVon,
    kttv: { tong: kt.thang.map((a) => nmSum(a)), cungKy: kt.cungKy.map((a) => nmSum(a)) },
    pctt: { loai: NM_PCTT_LOAI.map((_, i) => NM_PCTT.filter((r) => r.loai === i).length), tt: NM_PCTT_LOAI.map((_, i) => NM_TT.map((_, s) => NM_PCTT.filter((r) => r.loai === i && r.tt === s).length)),
      km: nm2(t(NM_PCTT.filter((r) => r.loai === 2), (r) => r.giaTri)), canXuLy: NM_PCTT.filter((r) => r.tt === 5).length,
      topDiem: top(NM_PCTT.filter((r) => r.loai >= 3), () => 1) },
    hoTro: { ho: t(NM_HO_TRO, (r) => r.ho), nguoi: t(NM_HO_TRO, (r) => r.nguoi), gaoTan: nm2(t(NM_HO_TRO, (r) => r.gaoKg) / 1000), n: NM_HO_TRO.length,
      ldHo: NM_LD.map((_, i) => t(NM_HO_TRO.filter((r) => r.ld === i), (r) => r.ho)), ldGao: NM_LD.map((_, i) => nm2(t(NM_HO_TRO.filter((r) => r.ld === i), (r) => r.gaoKg) / 1000)),
      thangHo: M.map((m) => t(NM_HO_TRO.filter((r) => r.thang === m), (r) => r.ho)), thangGao: M.map((m) => nm2(t(NM_HO_TRO.filter((r) => r.thang === m), (r) => r.gaoKg) / 1000)),
      top: top(NM_HO_TRO, (r) => r.ho), cungKy: NM_HT_CUNG_KY,
      /* đơn vị chính là LƯỢT NGƯỜI (bản trả lời BA, mục 35 – 37): định mức hỗ trợ tính theo người; cộng số phát sinh của các đợt,
         đợt hỗ trợ nhiều tháng tính vào tháng bắt đầu đợt; một người nhận nhiều đợt tính nhiều lượt */
      ldNguoi: NM_LD.map((_, i) => t(NM_HO_TRO.filter((r) => r.ld === i), (r) => r.nguoi)),
      thangNguoi: M.map((m) => t(NM_HO_TRO.filter((r) => r.thang === m), (r) => r.nguoi)),
      topNguoi: top(NM_HO_TRO, (r) => r.nguoi).map((r) => [r[0], r[1], t(NM_HO_TRO.filter((x) => x.diaBan === r[0]), (x) => x.ho)]) },
    banDo: { n: NM_BAN_DO.length, loai: NM_BD_LOAI.map((_, i) => NM_BAN_DO.filter((r) => r.loai === i).length), tt: NM_TT.map((_, i) => NM_BAN_DO.filter((r) => r.tt === i).length),
      thang: M.map((m) => NM_BAN_DO.filter((r) => r.thang === m).length), cungKy: NM_BD_CUNG_KY }
  };
})();

/* ---------- Mô tả 10 chỉ tiêu (đơn vị của "Giá trị" theo quy ước IOC; dùng cho thẻ, tài liệu) ---------- */
const NM_CT = [
  { key: 'ntm', name: 'Tỷ lệ xã được công nhận đạt chuẩn nông thôn mới', eform: 'Eform Tỷ lệ xã được công nhận đạt chuẩn nông thôn mới', ky: 'Quý III/2026', freq: 'Quý', donVi: 'số tiêu chí nông thôn mới đã đạt (trên 10, bộ tiêu chí 2026–2030)', soBanGhi: NM_DV.length },
  { key: 'rungTh', name: 'Diện tích rừng bị thiệt hại', eform: 'Eform Diện tích rừng bị thiệt hại (bị chặt phá, bị cháy…)', ky: NM_KY9, freq: 'Tháng', donVi: 'ha', soBanGhi: NM_RUNG_TH.length },
  { key: 'rungTm', name: 'Diện tích rừng trồng mới tập trung', eform: 'Eform Diện tích rừng trồng mới tập trung', ky: NM_KY9, freq: 'Tháng', donVi: 'ha (cây phân tán: cây)', soBanGhi: NM_RUNG_TM.length * 9 },
  { key: 'ntmVon', name: 'Chương trình mục tiêu quốc gia xây dựng nông thôn mới', eform: 'Eform Chương trình mục tiêu quốc gia về xây dựng nông thôn mới', ky: 'Lũy kế đến tháng 9/2026', freq: 'Tháng', donVi: 'triệu đồng', soBanGhi: NM_NTM_VON.length },
  { key: 'gnVon', name: 'Chương trình mục tiêu quốc gia giảm nghèo bền vững', eform: 'Eform Chương trình mục tiêu quốc gia giảm nghèo bền vững', ky: 'Lũy kế đến tháng 9/2026', freq: 'Tháng', donVi: 'triệu đồng', soBanGhi: NM_GN_VON.length },
  { key: 'kttv', name: 'Thông tin khí tượng thủy văn', eform: 'Eform Các thông tin về khí tượng thủy văn', ky: NM_KY9, freq: 'Tháng', donVi: 'bản tin, lượt số liệu', soBanGhi: 27 },
  { key: 'pctt', name: 'Công trình phòng chống thiên tai', eform: 'Eform Các thông tin về công trình phòng chống thiên tai', ky: NM_KYT9, freq: 'Tháng', donVi: 'công trình, điểm (đê điều: km)', soBanGhi: NM_PCTT.length },
  /* «Giá trị» là số người (nhân khẩu) được hỗ trợ, tính theo lượt nhận (bản trả lời BA, mục 35 – 37) */
  { key: 'hoTro', name: 'Lượt người được hỗ trợ lương thực do thiên tai, hỏa hoạn, giáp hạt và lý do bất khả kháng', eform: 'Eform Số hộ/người được hỗ trợ lương thực do thiên tai, hỏa hoạn, giáp hạt hoặc lý do bất khả kháng khác', ky: NM_KY9, freq: 'Tháng', donVi: 'lượt người', soBanGhi: NM_HO_TRO.length },
  /* «Giá trị» nhập bằng kg (chốt theo bản trả lời BA, mục 38 – 39); IOC chia 1.000, hiển thị tấn — số trong cấu hình đã là tấn */
  { key: 'gao', name: 'Tổng số gạo hỗ trợ', eform: 'Eform Tổng số gạo hỗ trợ', ky: NM_KY9, freq: 'Tháng', donVi: 'tấn', soBanGhi: NM_HO_TRO.length },
  { key: 'banDo', name: 'Dữ liệu bản đồ và ảnh viễn thám', eform: 'Eform Các dữ liệu về bản đồ và ảnh viễn thám', ky: NM_KY9, freq: 'Tháng', donVi: 'sản phẩm (bản đồ, cảnh ảnh, lớp dữ liệu)', soBanGhi: NM_BAN_DO.length }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function nmPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const NM_ITEMS = (function () {
  const S = NM_SUM, src = 'Eform Sở Nông nghiệp và Môi trường (giả lập)', ty = (v) => Math.round(v / 1000);
  const parts = {
    ntm: [nmPart('Mức đạt chuẩn theo bộ tiêu chí 2026–2030 (xã)', 'bar', NM_MUC26.map((m, i) => [m[0], S.ntm.muc26[i]]))],
    rungTh: [nmPart('Nguyên nhân (ha)', 'bar', NM_TH.map((m, i) => [m[0], S.rungTh.nnHa[i]]))],
    rungTm: [nmPart('Loại rừng (ha)', 'bar', NM_LOAI_RUNG.map((m, i) => [m[0], S.rungTm.loaiHa[i]]))],
    ntmVon: [nmPart('Giải ngân theo nguồn (tỷ đồng)', 'bar', NM_NGUON.slice(1).map((m, i) => [m[0], ty(S.ntmVon.nguon[i + 1])]))],
    gnVon: [nmPart('Giải ngân theo nội dung (tỷ đồng)', 'bar', NM_GN_ND.map((m, i) => [m[0], ty(S.gnVon.nd[i])]))],
    kttv: [nmPart('9 tháng', 'stat', NM_KTTV_LOAI.map((m, i) => [m[0], S.kttv.tong[i]]))],
    pctt: [nmPart('Loại công trình', 'bar', NM_PCTT_LOAI.map((m, i) => [m[0], S.pctt.loai[i]]))],
    hoTro: [nmPart('Lý do (lượt người)', 'bar', NM_LD.slice(0, 4).map((m, i) => [m[0], S.hoTro.ldNguoi[i]]))],
    gao: [nmPart('Lý do (tấn)', 'bar', NM_LD.slice(0, 4).map((m, i) => [m[0], S.hoTro.ldGao[i]]))],
    banDo: [nmPart('Loại sản phẩm', 'bar', NM_BD_LOAI.map((m, i) => [m[0], S.banDo.loai[i]]))]
  };
  return NM_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
