/* ============================== SỞ DU LỊCH — BỘ CHỈ TIÊU THEO 2 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở Du lịch"), 2 eform:
     1. "Khách du lịch nội địa & quốc tế"  — bản ghi = Đơn vị báo cáo (126 phường/xã) × Loại điểm du lịch × kỳ (tháng)
     2. "Doanh thu dịch vụ du lịch"        — bản ghi = Đơn vị báo cáo × Loại điểm du lịch × Loại doanh thu × kỳ (tháng)
   Mỗi eform thành 1 chỉ tiêu trên IOC, hiển thị theo khuôn chung (khối catBoxHtml + Chart.js, xem dashboard-dl.js) —
   giống Sở VHTT, Văn phòng UBND, Ban Quản lý KCNC & KCN. Bộ chỉ tiêu cũ của Sở (STT 22, 23, 65) đã xóa.
   Chưa có số thật: toàn bộ số dưới đây là SỐ GIẢ LẬP, sinh cố định theo tên đơn vị (hàm băm); số toàn Thành phố = cộng
   các bản ghi, nên bảng phường/xã và biểu đồ luôn khớp nhau. Doanh thu lưu ở đơn vị TRIỆU ĐỒNG (eform nhập VND).
   Nạp TRƯỚC central-level.js (central-level.js dùng DL_ITEMS). Không dùng hàm nào của file khác. */

const DL_KY = '9 tháng năm 2026';
const DL_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function dlN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function dlSum(a) { return a.reduce((s, v) => s + v, 0); }
function dlPct(a, b, d) { return dlN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function dlHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
/* số ngẫu nhiên CỐ ĐỊNH trong [0, 1) theo tên đơn vị + khóa */
function dlR(name, key) { return (dlHash(name + '|' + key) % 10000) / 10000; }
/* "1.234.567" lượt → "1,23 triệu" / "456,7 nghìn" (cho thẻ số) */
function dlLuot(v) { return v >= 1e6 ? dlN(v / 1e6, 2) + ' triệu' : dlN(v / 1e3, 1) + ' nghìn'; }
/* triệu đồng → tỷ đồng (1 chữ số thập phân) */
function dlTy(trieu, d) { return dlN(trieu / 1000, d == null ? 1 : d); }

/* ---------- Danh mục của eform ---------- */
/* «Loại điểm du lịch» (DL01–DL08) */
const DL_LOAI = [
  ['Khu du lịch', '#2a78d6'], ['Điểm du lịch', '#39d5ff'], ['Di tích lịch sử', '#7086FD'], ['Danh lam thắng cảnh', '#1baf7a'],
  ['Bảo tàng', '#4a3aa7'], ['Làng nghề', '#eda100'], ['Cơ sở lưu trú', '#FD9843'], ['Khác', '#898781']
];
/* «Loại doanh thu» (DT01–DT03). DT03 là TỔNG thu, đã gồm DT01, DT02 — IOC không cộng 3 loại với nhau */
const DL_LDT = ['Doanh thu dịch vụ lưu trú và ăn uống', 'Doanh thu dịch vụ du lịch lữ hành', 'Tổng thu từ khách du lịch'];
/* cơ cấu tổng thu trên biểu đồ: 2 loại có trong eform + phần còn lại (= DT03 − DT01 − DT02) */
const DL_CO_CAU = [['Lưu trú và ăn uống', '#2a78d6'], ['Lữ hành', '#1baf7a'], ['Dịch vụ khác (mua sắm, vận chuyển, vui chơi…)', '#8ba7c2']];

/* ---------- 126 phường/xã — đúng danh mục «Đơn vị báo cáo» của 2 eform (trùng danh mục của Văn phòng UBND) ---------- */
const DL_DV = [
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

/* ---------- Quy mô giả lập của từng đơn vị ----------
   Trọng số cơ cấu theo 8 loại điểm (thứ tự DL_LOAI), tỷ lệ khách quốc tế, hệ số quy mô và mùa vụ. */
const DL_TRUNG_TAM = ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình', 'Phường Văn Miếu - Quốc Tử Giám', 'Phường Tây Hồ', 'Phường Hai Bà Trưng',
  'Phường Ngọc Hà', 'Phường Giảng Võ', 'Phường Ô Chợ Dừa', 'Phường Đống Đa'];
const DL_MAU = {
  trungTam: { w: [0, 0.25, 0.3, 0.05, 0.2, 0, 0.15, 0.05], qt: [0.32, 0.45], quyMo: [7, 12] },
  phuong:   { w: [0, 0.3, 0.35, 0, 0, 0, 0.2, 0.15], qt: [0.06, 0.16], quyMo: [0.9, 2.2] },
  xa:       { w: [0, 0.2, 0.45, 0, 0, 0.15, 0, 0.2], qt: [0.02, 0.08], quyMo: [0.25, 0.9] }
};
/* địa bàn có điểm đến lớn: [mẫu cơ cấu, tỷ lệ khách quốc tế, hệ số quy mô, mùa vụ riêng (null = chung)] */
const DL_DIEM_DEN = {
  'Phường Hoàn Kiếm': [DL_MAU.trungTam.w, 0.5, 17, null],
  'Phường Cửa Nam':   [DL_MAU.trungTam.w, 0.42, 12.5, null],
  'Xã Hương Sơn':  [[0.1, 0, 0.3, 0.6, 0, 0, 0, 0], 0.03, 9, [1.0, 3.2, 2.6, 0.8, 0.4, 0.3, 0.3, 0.3, 0.4]],
  'Xã Bát Tràng':  [[0, 0.2, 0, 0, 0, 0.8, 0, 0], 0.24, 5, null],
  'Xã Ba Vì':      [[0.4, 0, 0, 0.4, 0, 0, 0.2, 0], 0.05, 5, [0.9, 1.0, 1.0, 1.2, 1.3, 1.4, 1.5, 1.3, 0.9]],
  'Xã Yên Bài':    [[0.5, 0, 0, 0.3, 0, 0, 0.2, 0], 0.04, 2.5, [0.9, 1.0, 1.0, 1.2, 1.3, 1.4, 1.5, 1.3, 0.9]],
  'Phường Sơn Tây':[[0, 0.2, 0.6, 0, 0, 0.2, 0, 0], 0.18, 3, null],
  'Phường Tùng Thiện': [[0, 0.2, 0.5, 0, 0, 0.3, 0, 0], 0.15, 2, null],
  'Xã Đông Anh':   [[0, 0.2, 0.7, 0, 0, 0, 0, 0.1], 0.06, 2.5, null],
  'Xã Phù Đổng':   [[0, 0.1, 0.8, 0, 0, 0, 0, 0.1], 0.03, 1.6, [1.0, 1.1, 1.0, 1.6, 1.2, 0.8, 0.8, 0.8, 0.8]],
  'Xã Sóc Sơn':    [[0, 0.2, 0.6, 0.2, 0, 0, 0, 0], 0.03, 1.8, [1.2, 2.0, 1.4, 0.9, 0.8, 0.7, 0.7, 0.7, 0.7]],
  'Xã Bình Minh':  [[0, 0.2, 0.3, 0, 0, 0.5, 0, 0], 0.05, 1.3, null],
  'Xã Đan Phượng': [[0, 0.3, 0.4, 0, 0, 0.3, 0, 0], 0.04, 1.2, null]
};
/* mùa vụ chung T1–T9: nội địa đông dịp Tết, lễ hội đầu năm, nghỉ lễ 30/4 và hè; quốc tế đông T1, T3, thấp giữa năm */
const DL_MUA_ND = [1.22, 1.35, 1.12, 0.98, 1.02, 0.88, 1.05, 1.0, 0.95];
const DL_MUA_QT = [1.08, 0.96, 1.12, 1.02, 0.86, 0.8, 0.86, 0.92, 1.02];
/* lượt khách 1 tháng ứng với hệ số quy mô 1 (lượt); chi tiêu bình quân 1 lượt (triệu đồng) */
const DL_LUOT_GOC = 9800;
const DL_CHI_QT = 11.2, DL_CHI_ND = 3.0;
/* hệ số chi tiêu theo loại điểm; tỷ trọng lưu trú – ăn uống, lữ hành trong tổng thu theo loại điểm */
const DL_HS_CHI = [1.2, 0.8, 0.6, 0.8, 0.5, 0.9, 1.7, 0.7];
const DL_TT_LTAU = [0.42, 0.36, 0.3, 0.38, 0.22, 0.28, 0.72, 0.34];
const DL_TT_LH = [0.16, 0.12, 0.1, 0.14, 0.08, 0.08, 0.1, 0.1];

/* ---------- Bản ghi của từng đơn vị (sinh cố định theo tên) ----------
   loai[k] = null nếu đơn vị không có loại điểm k; ngược lại { qt[9], nd[9], tong[9], ltau[9], lh[9] } theo tháng.
   qt, nd: eform 1 (lượt) · tong, ltau, lh: eform 2, lần lượt DT03, DT01, DT02 (triệu đồng). */
const DL_UNITS = DL_DV.map((ten) => {
  const R = (k) => dlR(ten, k), dd = DL_DIEM_DEN[ten];
  const mau = DL_TRUNG_TAM.indexOf(ten) >= 0 ? DL_MAU.trungTam : ten.indexOf('Phường') === 0 ? DL_MAU.phuong : DL_MAU.xa;
  const w = dd ? dd[0] : mau.w;
  const tyQt = dd ? dd[1] : mau.qt[0] + (mau.qt[1] - mau.qt[0]) * R('qt');
  const quyMo = dd ? dd[2] * (0.9 + 0.2 * R('qm')) : mau.quyMo[0] + (mau.quyMo[1] - mau.quyMo[0]) * R('qm');
  const muaNd = dd && dd[3] ? dd[3] : DL_MUA_ND;
  const loai = w.map((wk, k) => {
    if (!wk) return null;
    const ww = wk * (0.75 + 0.5 * R('w' + k));
    const qt = [], nd = [], tong = [], ltau = [], lh = [];
    for (let m = 0; m < 9; m++) {
      const base = DL_LUOT_GOC * quyMo * ww * (0.92 + 0.16 * R('m' + k + '|' + m));
      qt.push(Math.round(base * tyQt * DL_MUA_QT[m]));
      nd.push(Math.round(base * (1 - tyQt) * muaNd[m]));
      const t = Math.round((qt[m] * DL_CHI_QT + nd[m] * DL_CHI_ND) * DL_HS_CHI[k] * (0.9 + 0.2 * R('c' + k + '|' + m)));
      tong.push(t);
      ltau.push(Math.round(t * DL_TT_LTAU[k] * (0.9 + 0.2 * R('a' + k))));
      lh.push(Math.round(t * DL_TT_LH[k] * (0.85 + 0.3 * R('h' + k))));
    }
    return { qt: qt, nd: nd, tong: tong, ltau: ltau, lh: lh };
  });
  const cong = (f) => dlSum(loai.filter(Boolean).map((x) => dlSum(x[f])));
  return { ten: ten, phuong: ten.indexOf('Phường') === 0, loai: loai,
    qt: cong('qt'), nd: cong('nd'), tong: cong('tong'), ltau: cong('ltau'), lh: cong('lh') };
});

/* ---------- Số tổng hợp (tính từ DL_UNITS, dùng chung cho thẻ, biểu đồ, tài liệu) ---------- */
const DL_SUM = (function () {
  const U = DL_UNITS, M = [0, 1, 2, 3, 4, 5, 6, 7, 8], K = DL_LOAI.map((_, k) => k);
  const theoThang = (f) => M.map((m) => dlSum(U.map((u) => dlSum(u.loai.filter(Boolean).map((x) => x[f][m])))));
  const theoLoai = (f) => K.map((k) => dlSum(U.map((u) => (u.loai[k] ? dlSum(u.loai[k][f]) : 0))));
  const qtT = theoThang('qt'), ndT = theoThang('nd'), tongT = theoThang('tong'), ltauT = theoThang('ltau'), lhT = theoThang('lh');
  const qt = dlSum(qtT), nd = dlSum(ndT), tong = dlSum(tongT), ltau = dlSum(ltauT), lh = dlSum(lhT);
  const khT = M.map((m) => qtT[m] + ndT[m]);
  const banGhi1 = dlSum(U.map((u) => u.loai.filter(Boolean).length)) * 9;
  const xep = (f, n) => U.map((u) => [u.ten, f(u)]).sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    khach: { qtT: qtT, ndT: ndT, khT: khT, qt: qt, nd: nd, tong: qt + nd, tyQt: (qt / (qt + nd)) * 100,
      t9: khT[8], t8: khT[7], qtLoai: theoLoai('qt'), ndLoai: theoLoai('nd'), banGhi: banGhi1,
      dvCoKhach: U.filter((u) => u.qt + u.nd > 0).length,
      /* 15 phường/xã đông khách nhất: [tên, quốc tế, nội địa] */
      top: U.map((u) => [u.ten, u.qt, u.nd]).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2])).slice(0, 15) },
    doanhThu: { tongT: tongT, ltauT: ltauT, lhT: lhT, khacT: M.map((m) => tongT[m] - ltauT[m] - lhT[m]),
      tong: tong, ltau: ltau, lh: lh, khac: tong - ltau - lh, tongLoai: theoLoai('tong'), banGhi: banGhi1 * 3,
      /* chi tiêu bình quân 1 lượt khách (nghìn đồng) = tổng thu ÷ lượt khách (eform 1) */
      chiBq: (tong * 1000) / (qt + nd),
      top: xep((u) => u.tong, 15) }
  };
})();

/* ---------- Mô tả 2 chỉ tiêu (dùng cho tài liệu mô tả; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const DL_CT = [
  { key: 'khach', name: 'Khách du lịch nội địa và quốc tế', eform: 'Khách du lịch nội địa & quốc tế', freq: 'Tháng', ky: DL_KY, soBanGhi: DL_SUM.khach.banGhi },
  { key: 'doanhThu', name: 'Doanh thu dịch vụ du lịch', eform: 'Doanh thu dịch vụ du lịch', freq: 'Tháng', ky: DL_KY, soBanGhi: DL_SUM.doanhThu.banGhi }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ----------
   [tên, số bản ghi, tần suất, nguồn, phân tổ] — phân tổ (dạng P/S của central-level.js) dùng cho thẻ xem trước ở lưới
   chỉ tiêu; vkey nối dòng với khối hiển thị trong dashboard-dl.js. */
function dlPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const DL_ITEMS = (function () {
  const S = DL_SUM, src = 'Eform Sở Du lịch (giả lập)';
  const parts = {
    khach: [dlPart('Lượt khách 9 tháng', 'bar', [['Quốc tế', S.khach.qt], ['Nội địa', S.khach.nd]])],
    doanhThu: [dlPart('Tổng thu 9 tháng (tỷ đồng)', 'bar', [['Lưu trú và ăn uống', Math.round(S.doanhThu.ltau / 1000)], ['Lữ hành', Math.round(S.doanhThu.lh / 1000)], ['Dịch vụ khác', Math.round(S.doanhThu.khac / 1000)]])]
  };
  return DL_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
