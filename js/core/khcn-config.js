/* ============================== SỞ KHOA HỌC VÀ CÔNG NGHỆ — CHỈ SỐ CHUYỂN ĐỔI SỐ CẤP XÃ THEO 3 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở KHCN"), 3 eform "Danh sách KHCN - …" → 3 chỉ tiêu:
     1. Hạ tầng và thiết bị số            2. Con người và cộng đồng số            3. Văn bản, quy trình và dịch vụ công
   Mỗi bản ghi = số liệu một kỳ (tháng) của một «Địa bàn» (126 phường/xã). Tên trường có "(mã n)" là mã chỉ số chuyển đổi số;
   trên giao diện chỉ ghi tên chỉ số bằng lời, không hiện mã (xem quy tắc không hiện mã kỹ thuật trên UI).
   Khuôn hiển thị chung (catBoxHtml + Chart.js, xem dashboard-khcn.js). Trước đây Sở được ghi "không có chỉ tiêu" — nay thêm mới.

   SỐ GIẢ LẬP, đặt theo bậc độ lớn số thật đã công bố của Hà Nội:
   - Internet băng rộng cáp quang phủ 91,4% hộ gia đình; 97% dân số trưởng thành có điện thoại thông minh.
   - Mục tiêu 2025: 80% hồ sơ thủ tục hành chính xử lý trực tuyến; 40% dân số trưởng thành dùng dịch vụ công trực tuyến;
     xã, phường tiếp nhận tối thiểu 60% hồ sơ trực tuyến; từ 30/6/2025 toàn bộ cán bộ xử lý hồ sơ trên môi trường mạng và ký số.
   - Gần 5.000 Tổ công nghệ số cộng đồng, hơn 30.000 thành viên; chữ ký số cho người dân mới triển khai (ký số trên VNeID).
   Nạp TRƯỚC central-level.js (central-level.js dùng KHCN_ITEMS). Không dùng hàm nào của file khác. */

const KHCN_KY = 'Tháng 9/2026';
const KHCN_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function khcnN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function khcnSum(a) { return a.reduce((s, v) => s + v, 0); }
function khcnPct(a, b, d) { return khcnN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function khcnHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function khcnR(name, key) { return (khcnHash(name + '|' + key) % 10000) / 10000; }

/* ---------- 126 phường/xã — đúng danh mục «Địa bàn» của 3 eform ---------- */
const KHCN_DV = [
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
/* xã miền núi, xa trung tâm: hạ tầng và kỹ năng số thấp hơn mặt bằng */
const KHCN_XA_XA = ['Xã Ba Vì', 'Xã Yên Bài', 'Xã Suối Hai', 'Xã Bất Bạt', 'Xã Yên Xuân', 'Xã Mỹ Đức', 'Xã Hương Sơn', 'Xã Phú Cát', 'Xã Trần Phú',
  'Xã Minh Châu', 'Xã Cổ Đô', 'Xã Hồng Sơn', 'Xã Phúc Sơn', 'Xã Đại Xuyên', 'Xã Chuyên Mỹ'];
/* dân số giả lập: Hà Nội ~ 8,7 triệu người / 126 đơn vị; phường đông hơn xã */
function khcnDanSo(n) { return Math.round((n.indexOf('Phường') === 0 ? 82000 : 58000) * (0.6 + 0.8 * khcnR(n, 'ds')) / 100) * 100; }
/* "hạng" số hóa của đơn vị trong [0, 1]: phường trung tâm cao, xã xa thấp */
function khcnHang(n) { return Math.max(0, Math.min(1, (n.indexOf('Phường') === 0 ? 0.68 : 0.42) + 0.3 * khcnR(n, 'hg') - (KHCN_XA_XA.indexOf(n) >= 0 ? 0.25 : 0))); }
const KHCN_CO_KHONG = ['Có', 'Không'];

/* diễn biến cả Thành phố T1 → T9 (tỷ lệ chuẩn, mỗi đơn vị lệch quanh mức này theo "hạng") */
const KHCN_XU_HUONG = {
  toanTrinh: [0.68, 0.69, 0.71, 0.72, 0.74, 0.75, 0.77, 0.78, 0.8],
  ttoan: [0.56, 0.57, 0.59, 0.61, 0.62, 0.64, 0.66, 0.67, 0.69],
  mang: [0.965, 0.968, 0.97, 0.973, 0.975, 0.978, 0.98, 0.982, 0.984],
  kySo: [0.94, 0.945, 0.95, 0.955, 0.96, 0.964, 0.968, 0.972, 0.975]
};

const KHCN_UNITS = KHCN_DV.map((ten) => {
  const R = (k) => khcnR(ten, k), h = khcnHang(ten), ph = ten.indexOf('Phường') === 0, dan = khcnDanSo(ten);
  const ho = Math.round(dan / 3.1), ds15 = Math.round(dan * 0.79), ds14 = Math.round(dan * 0.8), dsTt = Math.round(dan * 0.77);
  const cb = Math.round((ph ? 110 : 85) + 70 * R('cb'));
  /* ---- 1. hạ tầng (tháng 9) ---- */
  const ht = {
    ho: ho, hoCq: Math.round(ho * Math.min(0.995, 0.8 + 0.17 * h + 0.03 * R('cq'))),
    ds15: ds15, sm: Math.round(ds15 * Math.min(0.99, 0.9 + 0.08 * h + 0.01 * R('sm'))),
    cqTruSo: 0, giaoBan: R('gb') < (h > 0.3 ? 0.99 : 0.85) ? 0 : 1, wifi: R('wf') < 0.35 + 0.7 * h ? 0 : 1, dvc: R('dv') < 0.985 ? 0 : 1
  };
  /* ---- 2. con người (tháng 9) ---- */
  const cn = {
    dan: dan, dvctt: Math.round(dan * (0.3 + 0.28 * h + 0.04 * R('dc'))),
    ds14: ds14, dtdt: Math.round(ds14 * (0.82 + 0.13 * h + 0.03 * R('dt'))),
    dsTt: dsTt, cks: Math.round(dsTt * (0.12 + 0.24 * h + 0.06 * R('ck'))),
    kns: Math.round(dan * (0.5 + 0.32 * h + 0.06 * R('kn'))),
    toCds: 0, doiPu: R('pu') < 0.94 ? 0 : 1, moHinh: R('mh') < 0.4 + 0.55 * h ? 0 : 1,
    cb: cb, attt: Math.round(cb * (0.58 + 0.35 * h + 0.05 * R('at')))
  };
  /* ---- 3. văn bản, dịch vụ công: số liệu từng tháng ---- */
  const lech = (k) => (h - 0.55) * 0.32 + 0.1 * (R(k) - 0.5);
  const hsGoc = Math.round(dan / 30 * (0.85 + 0.3 * R('hs')));
  const thang = KHCN_MONTHS.map((_, m) => {
    const RM = (k) => R(k + m), hs = Math.round(hsGoc * (m === 1 ? 0.75 : 0.92 + 0.16 * RM('hm')));
    const nvtc = Math.round(hs * (0.32 + 0.1 * R('nv')));
    const vbNb = Math.round(dan / 45 * (0.9 + 0.2 * RM('vn'))), vbCq = Math.round(dan / 60 * (0.9 + 0.2 * RM('vc')));
    const cl = (v) => Math.max(0, Math.min(1, v));
    return {
      hs: hs, toanTrinh: Math.round(cl(KHCN_XU_HUONG.toanTrinh[m] + lech('tt')) * 1000) / 10,
      nvtc: nvtc, tttt: Math.round(nvtc * cl(KHCN_XU_HUONG.ttoan[m] + lech('tq') * 1.2)),
      vbNb: vbNb, vbMang: Math.round(vbNb * cl(KHCN_XU_HUONG.mang[m] + lech('vm') * 0.12)),
      vbCq: vbCq, vbKySo: Math.round(vbCq * cl(KHCN_XU_HUONG.kySo[m] + lech('ks') * 0.15)),
      hoiNghi: Math.round((ph ? 6 : 4) + 4 * RM('hn'))
    };
  });
  const vb = { thang: thang, troLy: R('tl') < 0.3 + 0.6 * h ? 0 : 1, ktm: R('km') < 0.9 + 0.1 * h ? 0 : 1 };
  return { ten: ten, phuong: ph, hang: h, ht: ht, cn: cn, vb: vb };
});

/* ---------- Số tổng hợp ---------- */
const KHCN_SUM = (function () {
  const U = KHCN_UNITS, t = (f) => khcnSum(U.map(f)), cnt = (f) => U.filter(f).length, M = [0, 1, 2, 3, 4, 5, 6, 7, 8], Q9 = 8;
  const nhom = (f) => [U.filter((u) => u.phuong), U.filter((u) => !u.phuong)].map((g) => f(g));
  const tl = (g, a, b) => khcnSum(g.map(a)) / khcnSum(g.map(b)) * 100;
  const ht = {
    ho: t((u) => u.ht.ho), hoCq: t((u) => u.ht.hoCq), ds15: t((u) => u.ht.ds15), sm: t((u) => u.ht.sm),
    tieuChi: [['Trụ sở có kết nối Internet cáp quang', 'cqTruSo'], ['Đáp ứng hạ tầng công nghệ thông tin họp trực tuyến', 'giaoBan'],
      ['Có wifi công cộng miễn phí', 'wifi'], ['Có điểm phục vụ dịch vụ công trực tuyến', 'dvc']].map((x) => [x[0], cnt((u) => u.ht[x[1]] === 0)]),
    cap: nhom((g) => [tl(g, (u) => u.ht.hoCq, (u) => u.ht.ho), tl(g, (u) => u.ht.sm, (u) => u.ht.ds15)]),
    cqThap: U.map((u) => [u.ten, u.ht.hoCq / u.ht.ho * 100]).sort((a, b) => a[1] - b[1]).slice(0, 10)
  };
  const cn = {
    dan: t((u) => u.cn.dan), dvctt: t((u) => u.cn.dvctt), ds14: t((u) => u.cn.ds14), dtdt: t((u) => u.cn.dtdt), dsTt: t((u) => u.cn.dsTt), cks: t((u) => u.cn.cks),
    kns: t((u) => u.cn.kns), cb: t((u) => u.cn.cb), attt: t((u) => u.cn.attt),
    tieuChi: [['Có Tổ chuyển đổi số cộng đồng', 'toCds'], ['Có Đội hỗ trợ chuyển đổi số phản ứng nhanh', 'doiPu'], ['Có mô hình khuyến khích dùng dịch vụ công trực tuyến', 'moHinh']]
      .map((x) => [x[0], cnt((u) => u.cn[x[1]] === 0)]),
    cap: nhom((g) => [tl(g, (u) => u.cn.dvctt, (u) => u.cn.dan), tl(g, (u) => u.cn.dtdt, (u) => u.cn.ds14), tl(g, (u) => u.cn.cks, (u) => u.cn.dsTt), tl(g, (u) => u.cn.kns, (u) => u.cn.dan)]),
    dvcThap: U.map((u) => [u.ten, u.cn.dvctt / u.cn.dan * 100]).sort((a, b) => a[1] - b[1]).slice(0, 10)
  };
  const th = (f) => M.map((m) => t((u) => f(u.vb.thang[m])));
  const hsT = th((x) => x.hs), nvT = th((x) => x.nvtc), ttT = th((x) => x.tttt), nbT = th((x) => x.vbNb), mgT = th((x) => x.vbMang), cqT = th((x) => x.vbCq), ksT = th((x) => x.vbKySo);
  /* tỷ lệ toàn trình chỉ có trường %, không có số hồ sơ toàn trình → bình quân có trọng số theo «Tổng hồ sơ TTHC tiếp nhận» */
  const ttrT = M.map((m) => t((u) => u.vb.thang[m].toanTrinh * u.vb.thang[m].hs) / hsT[m]);
  const ttr9 = U.map((u) => [u.ten, u.vb.thang[Q9].toanTrinh]);
  const vb = {
    hs: hsT[Q9], toanTrinh: ttrT[Q9], nvtc: nvT[Q9], tttt: ttT[Q9], vbNb: nbT[Q9], vbMang: mgT[Q9], vbCq: cqT[Q9], vbKySo: ksT[Q9],
    hoiNghi: t((u) => u.vb.thang[Q9].hoiNghi), troLy: cnt((u) => u.vb.troLy === 0), ktm: cnt((u) => u.vb.ktm === 0),
    xuHuong: [ttrT, M.map((m) => ttT[m] / nvT[m] * 100), M.map((m) => mgT[m] / nbT[m] * 100), M.map((m) => ksT[m] / cqT[m] * 100)],
    hsT: hsT,
    /* nhóm phường/xã theo tỷ lệ toàn trình tháng 9 (yêu cầu tối thiểu 60% hồ sơ trực tuyến) */
    nhom: [['Từ 80% trở lên', 80, '#1baf7a'], ['Từ 60% đến dưới 80%', 60, '#2a78d6'], ['Dưới 60%', 0, '#d33a44']]
      .map((g, i, a) => [g[0], ttr9.filter((r) => r[1] >= g[1] && (i === 0 || r[1] < a[i - 1][1])).length, g[2]]),
    thap: ttr9.slice().sort((a, b) => a[1] - b[1]).slice(0, 10)
  };
  return { ht: ht, cn: cn, vb: vb };
})();

/* ---------- Mô tả 3 chỉ tiêu (dùng cho tài liệu; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const KHCN_CT = [
  { key: 'ht', name: 'Hạ tầng và thiết bị số', eform: 'Danh sách KHCN - Hạ tầng và thiết bị số', ky: KHCN_KY, freq: 'Tháng', soBanGhi: KHCN_DV.length },
  { key: 'cn', name: 'Con người và cộng đồng số', eform: 'Danh sách KHCN - Con người và cộng đồng số', ky: KHCN_KY, freq: 'Tháng', soBanGhi: KHCN_DV.length },
  { key: 'vb', name: 'Văn bản, quy trình và dịch vụ công', eform: 'Danh sách KHCN - Văn bản, quy trình và dịch vụ công', ky: KHCN_KY, freq: 'Tháng', soBanGhi: KHCN_DV.length * 9 }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function khcnPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const KHCN_ITEMS = (function () {
  const S = KHCN_SUM, src = 'Eform Sở Khoa học và Công nghệ (giả lập)', r1 = (v) => Math.round(v * 10) / 10;
  const parts = {
    ht: [khcnPart('Tỷ lệ (%)', 'stat', [['Hộ có Internet cáp quang', r1(S.ht.hoCq / S.ht.ho * 100)], ['Người dùng điện thoại thông minh', r1(S.ht.sm / S.ht.ds15 * 100)]])],
    cn: [khcnPart('Tỷ lệ (%)', 'stat', [['Dùng dịch vụ công trực tuyến', r1(S.cn.dvctt / S.cn.dan * 100)], ['Có danh tính điện tử', r1(S.cn.dtdt / S.cn.ds14 * 100)], ['Có chữ ký số', r1(S.cn.cks / S.cn.dsTt * 100)]])],
    vb: [khcnPart('Tỷ lệ tháng 9 (%)', 'stat', [['Hồ sơ trực tuyến toàn trình', r1(S.vb.toanTrinh)], ['Thanh toán trực tuyến', r1(S.vb.tttt / S.vb.nvtc * 100)], ['Văn bản ký số', r1(S.vb.vbKySo / S.vb.vbCq * 100)]])]
  };
  return KHCN_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
