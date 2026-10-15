/* ============================== VĂN PHÒNG UBND THÀNH PHỐ HÀ NỘI — BỘ CHỈ TIÊU MỚI THEO 5 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Văn phòng UBND Thành phố Hà Nội"), 5 eform: chỉ số 27, 29, 74, 52,
   11-12. Mỗi eform thành 1 chỉ tiêu trên IOC, hiển thị theo khuôn chung (khối catBoxHtml + biểu đồ Chart.js, xem
   dashboard-vpub.js) — giống Sở VHTT, KHÔNG theo khuôn HCC/SGD/STC vì Văn phòng chưa có API.
   Chưa có số thật: toàn bộ số dưới đây là SỐ GIẢ LẬP. Số của 126 phường/xã được sinh cố định theo tên đơn vị (hàm băm),
   số toàn Thành phố = cộng các phường/xã, nên bảng phường/xã và biểu đồ luôn khớp nhau.
   Nạp TRƯỚC central-level.js (central-level.js dùng VPUB_ITEMS). Không dùng hàm nào của file khác. */

const VPUB_KY = '9 tháng năm 2026';
const VPUB_QUY = ['Quý I', 'Quý II', 'Quý III'];
const VPUB_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function vpubN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function vpubSum(a) { return a.reduce((s, v) => s + v, 0); }
function vpubPct(a, b, d) { return vpubN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function vpubHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
/* số ngẫu nhiên CỐ ĐỊNH trong [0, 1) theo tên đơn vị + khóa */
function vpubR(name, key) { return (vpubHash(name + '|' + key) % 10000) / 10000; }

/* ---------- 126 phường/xã — đúng danh mục «Đơn vị báo cáo» trong eform (51 phường, 75 xã) ---------- */
const VPUB_DV = [
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
/* phường trung tâm: khối lượng văn bản, hồ sơ, phòng họp lớn hơn */
const VPUB_CENTER = ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình', 'Phường Văn Miếu - Quốc Tử Giám', 'Phường Ô Chợ Dừa', 'Phường Hai Bà Trưng',
  'Phường Tây Hồ', 'Phường Đống Đa', 'Phường Giảng Võ', 'Phường Ngọc Hà', 'Phường Cầu Giấy', 'Phường Láng', 'Phường Hà Đông', 'Phường Long Biên'];

/* ---------- Số giả lập theo từng chỉ tiêu ---------- */
const VPUB_DATA = {
  /* 1. Chỉ số 27 — văn bản, hồ sơ công việc xử lý trên môi trường mạng. Cấp Sở, ban, ngành: số cộng của 28 đơn vị theo quý */
  cs27: {
    soDv: 28,
    soTong: [412600, 438900, 461200],
    soMang: [389400, 418700, 444300],
    /* nhóm phường/xã theo tỷ lệ quý III: [nhãn, ngưỡng dưới (%), màu] */
    nhom: [['Từ 95% trở lên', 95, '#1baf7a'], ['Từ 90% đến dưới 95%', 90, '#2a78d6'], ['Từ 80% đến dưới 90%', 80, '#eda100'], ['Dưới 80%', 0, '#d33a44']]
  },
  /* 2. Chỉ số 29 — triển khai trợ lý ảo (báo cáo năm 2026) */
  cs29: {
    app: [['Trợ lý ảo dùng chung của Thành phố', '#2a78d6'], ['Trợ lý ảo đơn vị tự xây dựng', '#1baf7a'], ['Trợ lý ảo do doanh nghiệp cung cấp', '#eda100']],
    doiTuong: [['Cán bộ, công chức', '#39d5ff'], ['Người dân, doanh nghiệp', '#4a3aa7'], ['Cả hai nhóm', '#FD9843']]
  },
  /* 3. Chỉ số 74 — nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao trong 9 tháng năm 2026, trạng thái tại 30/9/2026 */
  cs74: {
    st: [
      { l: 'Hoàn thành đúng hạn', c: '#1baf7a' }, { l: 'Hoàn thành quá hạn', c: '#eda100' }, { l: 'Đang thực hiện', c: '#2a78d6' },
      { l: 'Chưa thực hiện', c: '#8ba7c2' }, { l: 'Quá hạn chưa hoàn thành', c: '#d33a44' }, { l: 'Tạm dừng', c: '#898781' }
    ],
    /* [cơ quan giao, số nhiệm vụ theo 6 trạng thái ở trên] */
    coQuan: [
      ['Chính phủ', [218, 24, 96, 14, 18, 4]],
      ['Thủ tướng Chính phủ', [402, 54, 168, 30, 34, 8]],
      ['Phó Thủ tướng Chính phủ', [122, 18, 54, 10, 10, 2]]
    ],
    /* 4 nhóm cho biểu đồ đơn vị chủ trì: [nhãn, màu] */
    nhom4: [['Đã hoàn thành', '#1baf7a'], ['Đang/chưa thực hiện, trong hạn', '#2a78d6'], ['Quá hạn chưa hoàn thành', '#d33a44'], ['Tạm dừng', '#898781']],
    /* [đơn vị chủ trì, số nhiệm vụ theo 4 nhóm ở trên] */
    chuTri: [
      ['Sở Tài chính', [164, 72, 12, 3]],
      ['Sở Xây dựng', [138, 66, 14, 2]],
      ['Sở Nông nghiệp và Môi trường', [112, 52, 9, 2]],
      ['Sở Y tế', [72, 30, 5, 1]],
      ['Sở Nội vụ', [64, 28, 4, 1]],
      ['Sở Giáo dục và Đào tạo', [58, 24, 3, 1]],
      ['Sở Khoa học và Công nghệ', [52, 26, 5, 1]],
      ['Các đơn vị khác', [178, 74, 10, 3]]
    ],
    thangGiao: [118, 104, 152, 141, 149, 138, 156, 162, 166],   // theo tháng của Ngày giao
    thangHt: [42, 68, 84, 92, 98, 104, 112, 118, 120],          // theo tháng của Ngày hoàn thành
    tienDoBq: 47.6,                                              // bình quân Tỷ lệ hoàn thành (%) của nhiệm vụ đang thực hiện
    sapDenHan: 41,                                               // Cảnh báo tiến độ = sắp đến hạn (còn ≤ 7 ngày)
    coDiaBan: 214                                                // nhiệm vụ có chọn Địa bàn phường/xã (bảng 126 đơn vị)
  },
  /* 4. Chỉ số 52 — hồ sơ thủ tục hành chính, dịch vụ công: toàn bộ số ở VPUB_UNITS (126 phường/xã × 3 quý) */
  cs52: {},
  /* 5. Chỉ số 11, 12 — hạ tầng CNTT, bản báo cáo quý III/2026 */
  cs1112: {
    tt: [['Đang hoạt động', '#1baf7a'], ['Tạm ngừng', '#eda100'], ['Đang nâng cấp', '#2a78d6'], ['Hỏng/Không hoạt động', '#d33a44']],
    /* [loại hạ tầng, số lượng cấp Xã/phường theo 4 tình trạng, số lượng cấp Sở/ngành theo 4 tình trạng].
       Dòng "Hệ thống giao ban trực tuyến" để null: tính từ số phòng được trang bị (xem VPUB_SUM). */
    loai: [
      ['Máy tính làm việc', [14820, 120, 0, 486], [18640, 96, 0, 412]],
      ['Máy chủ', [252, 6, 14, 8], [684, 12, 26, 9]],
      ['Thiết bị mạng', [1890, 22, 46, 38], [2460, 18, 52, 31]],
      ['Đường truyền Internet', [268, 0, 4, 2], [96, 0, 2, 0]],
      ['WiFi công cộng', [412, 18, 22, 26], [64, 2, 4, 3]],
      ['Trung tâm dữ liệu', [0, 0, 0, 0], [3, 0, 1, 0]],
      ['Hệ thống giao ban trực tuyến', null, null],
      ['Hệ thống hội nghị truyền hình', [118, 2, 4, 2], [32, 0, 2, 0]],
      ['Cổng dịch vụ công', [0, 0, 0, 0], [1, 0, 0, 0]],
      ['Hệ thống thông tin khác', [86, 2, 6, 1], [214, 4, 18, 3]]
    ],
    /* giao ban trực tuyến: tình trạng của các phòng KHÔNG đang hoạt động; phần còn lại là Đang hoạt động */
    gbXa: [3, 5, 4], gbSo: [2, 8, 4],
    soPhongHop: 236, soPhongTb: 198,                             // cấp Sở/ngành
    /* «Số lượng» của dòng Hệ thống giao ban trực tuyến là số HỆ THỐNG, không phải số phòng (bản trả lời BA, mục 04):
       phường, xã có phòng được trang bị thường có 1 hệ thống, phường trung tâm 2 (xem VPUB_UNITS.htGb); sở, ngành 92 hệ thống.
       gbHtXa, gbHtSo: số hệ thống KHÔNG đang hoạt động (tạm ngừng, đang nâng cấp, hỏng). */
    soHtGb: 92, gbHtXa: [2, 3, 2], gbHtSo: [1, 3, 1],
    dapUng: [['Đáp ứng đầy đủ', '#1baf7a'], ['Đáp ứng một phần', '#eda100'], ['Chưa đáp ứng', '#d33a44']],
    dapUngXa: [612, 318, 78], dapUngSo: [168, 54, 12]            // số lượt đánh giá (đơn vị × loại hạ tầng)
  }
};

/* true = cách cũ: số hệ thống giao ban trực tuyến coi bằng số phòng được trang bị (đã bỏ theo bản trả lời BA, mục 04) */
const VPUB_GB_THEO_PHONG = false;

/* ---------- Số của từng phường/xã (sinh cố định theo tên) ---------- */
const VPUB_UNITS = VPUB_DV.map((n) => {
  const R = (k) => vpubR(n, k), phuong = n.indexOf('Phường') === 0, center = VPUB_CENTER.indexOf(n) >= 0;
  const size = (center ? 1.7 : phuong ? 1.15 : 0.8) * (0.65 + 0.7 * R('sz'));
  /* chỉ số 27: 3 quý */
  const base27 = 0.74 + 0.22 * R('27r');
  const vbTong = [4800, 5150, 5420].map((b, q) => Math.round(size * b * (0.92 + 0.16 * R('27t' + q))));
  const vbMang = vbTong.map((t, q) => Math.round(t * Math.min(0.995, base27 + 0.015 * q)));
  /* chỉ số 29 */
  const tla = R('29d') < (phuong ? 0.8 : 0.55);
  const ra = R('29a'), ro = R('29o');
  /* chỉ số 52: 3 quý */
  const hs = [2050, 2310, 2480].map((b, q) => {
    const tn = Math.round(size * b * (0.9 + 0.2 * R('52t' + q)));
    const tt = Math.round(tn * (0.52 + 0.38 * R('52o')));
    return {
      tn: tn, dh: Math.round(tn * (0.88 + 0.08 * R('52d' + q))), qh: Math.round(tn * (0.004 + 0.02 * R('52q' + q))),
      tt: tt, tttt: Math.round(tt * (0.28 + 0.4 * R('52p'))), sh: Math.round(tn * (0.58 + 0.38 * R('52s'))),
      hl: Math.round((80 + 18 * R('52h' + q)) * 10) / 10
    };
  });
  /* chỉ số 11, 12: phòng họp */
  const ph = (center ? 5 : phuong ? 3 : 2) + Math.floor(3 * R('11p'));
  const tb = ph - (R('11t') < 0.35 ? 1 : 0) - (R('11u') < 0.1 ? 1 : 0);
  return {
    ten: n, phuong: phuong, vbTong: vbTong, vbMang: vbMang,
    tla: tla, app: tla ? (ra < 0.62 ? 0 : ra < 0.86 ? 1 : 2) : -1, doiTuong: tla ? (ro < 0.38 ? 0 : ro < 0.62 ? 1 : 2) : -1,
    hs: hs, phongHop: ph, phongTb: tb, htGb: tb > 0 ? (center ? 2 : 1) : 0
  };
});

/* chia tổng cho 126 đơn vị theo trọng số, làm tròn theo phần dư lớn nhất nên cộng lại đúng bằng tổng */
function vpubSplit(total, w) {
  const ws = vpubSum(w) || 1, raw = w.map((x) => total * x / ws), base = raw.map(Math.floor);
  const left = total - vpubSum(base);
  raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, left).forEach((x) => base[x[1]]++);
  return base;
}
/* nhiệm vụ chỉ số 74 có gắn địa bàn: dồn nhiều về phường trung tâm */
const VPUB_NV_DIABAN = vpubSplit(VPUB_DATA.cs74.coDiaBan, VPUB_DV.map((n) => Math.pow(0.3 + vpubR(n, '74') * 1.4, 2) * (VPUB_CENTER.indexOf(n) >= 0 ? 3 : 1)));

/* ---------- Số tổng hợp (tính từ VPUB_DATA + VPUB_UNITS, dùng chung cho thẻ, biểu đồ, bảng cách tính) ---------- */
const VPUB_SUM = (function () {
  const D = VPUB_DATA, U = VPUB_UNITS, Q3 = 2;
  /* 1. chỉ số 27 */
  const xaTong = [0, 1, 2].map((q) => vpubSum(U.map((u) => u.vbTong[q]))), xaMang = [0, 1, 2].map((q) => vpubSum(U.map((u) => u.vbMang[q])));
  const tong = xaTong.map((v, q) => v + D.cs27.soTong[q]), mang = xaMang.map((v, q) => v + D.cs27.soMang[q]);
  const tyLe = U.map((u) => (u.vbMang[Q3] / u.vbTong[Q3]) * 100);
  const nhom = D.cs27.nhom.map((g, i) => tyLe.filter((t) => t >= g[1] && (i === 0 || t < D.cs27.nhom[i - 1][1])).length);
  const thapNhat = U.map((u, i) => [u.ten, tyLe[i]]).sort((a, b) => a[1] - b[1]).slice(0, 10);
  /* 2. chỉ số 29 */
  const tla = U.filter((u) => u.tla);
  const app = D.cs29.app.map((_, i) => tla.filter((u) => u.app === i).length);
  const dt = D.cs29.doiTuong.map((_, i) => tla.filter((u) => u.doiTuong === i).length);
  const ph = U.filter((u) => u.phuong), xa = U.filter((u) => !u.phuong);
  /* 4. chỉ số 52: cộng 3 quý của 126 phường/xã */
  const k52 = ['tn', 'dh', 'qh', 'tt', 'tttt', 'sh'];
  const hsQuy = [0, 1, 2].map((q) => { const o = {}; k52.forEach((k) => { o[k] = vpubSum(U.map((u) => u.hs[q][k])); }); return o; });
  const hs = {}; k52.forEach((k) => { hs[k] = vpubSum(hsQuy.map((o) => o[k])); });
  /* điểm hài lòng bình quân có trọng số theo số hồ sơ tiếp nhận */
  hs.hl = vpubSum(U.map((u) => vpubSum(u.hs.map((h) => h.hl * h.tn)))) / hs.tn;
  /* "chưa có kết quả trong kỳ" = tiếp nhận − đúng hạn − quá hạn: chỉ là dòng phụ, không vẽ thành phần của vòng vì hồ sơ giải quyết
     trong kỳ có thể là hồ sơ kỳ trước chuyển sang mà eform không có trường này (bản trả lời BA, mục 06); âm thì ghi "có giải quyết hồ sơ kỳ trước" */
  hs.dangGq = hs.tn - hs.dh - hs.qh;
  hs.daGq = hs.dh + hs.qh;
  const hsCap = [ph, xa].map((g) => { const o = {}; k52.forEach((k) => { o[k] = vpubSum(g.map((u) => vpubSum(u.hs.map((h) => h[k])))); }); return o; });
  /* 5. chỉ số 11, 12 */
  const c = D.cs1112;
  const phXa = vpubSum(U.map((u) => u.phongHop)), tbXa = vpubSum(U.map((u) => u.phongTb));
  /* dòng giao ban trực tuyến: số hệ thống (BA mục 04); cách cũ coi số hệ thống = số phòng được trang bị — giữ, tắt bằng cờ */
  const htXa = vpubSum(U.map((u) => u.htGb));
  const gbXa = VPUB_GB_THEO_PHONG ? [tbXa - vpubSum(c.gbXa)].concat(c.gbXa) : [htXa - vpubSum(c.gbHtXa)].concat(c.gbHtXa);
  const gbSo = VPUB_GB_THEO_PHONG ? [c.soPhongTb - vpubSum(c.gbSo)].concat(c.gbSo) : [c.soHtGb - vpubSum(c.gbHtSo)].concat(c.gbHtSo);
  const loai = c.loai.map((r) => (r[1] ? [r[0], r[1], r[2]] : [r[0], gbXa, gbSo]));
  const loaiTong = loai.map((r) => vpubSum(r[1]) + vpubSum(r[2]));
  const ttTong = c.tt.map((_, i) => vpubSum(loai.map((r) => r[1][i] + r[2][i])));
  const tbTong = vpubSum(ttTong);
  return {
    cs27: { xaTong: xaTong, xaMang: xaMang, tong: tong, mang: mang, tyLeQ: tong.map((t, q) => (mang[q] / t) * 100),
      xaTyLe: (xaMang[Q3] / xaTong[Q3]) * 100, soTyLe: (D.cs27.soMang[Q3] / D.cs27.soTong[Q3]) * 100, tyLeDv: tyLe, nhom: nhom, thapNhat: thapNhat },
    cs29: { dv: U.length, tla: tla.length, app: app, dt: dt, phuong: [ph.filter((u) => u.tla).length, ph.length], xa: [xa.filter((u) => u.tla).length, xa.length] },
    cs74: (function () {
      const s = D.cs74.st.map((_, i) => vpubSum(D.cs74.coQuan.map((r) => r[1][i])));
      const t = vpubSum(s), ht = s[0] + s[1];
      return { st: s, tong: t, ht: ht, htTyLe: (ht / t) * 100, dungHanTyLe: (s[0] / ht) * 100, quaHan: s[4],
        lkGiao: D.cs74.thangGiao.reduce((a, v) => a.concat([(a.length ? a[a.length - 1] : 0) + v]), []),
        lkHt: D.cs74.thangHt.reduce((a, v) => a.concat([(a.length ? a[a.length - 1] : 0) + v]), []) };
    })(),
    cs52: { quy: hsQuy, hs: hs, cap: hsCap },
    cs1112: { loai: loai, loaiTong: loaiTong, tt: ttTong, tong: tbTong, phXa: phXa, tbXa: tbXa,
      phong: phXa + c.soPhongHop, phongTb: tbXa + c.soPhongTb, dapUng: c.dapUng.map((_, i) => c.dapUngXa[i] + c.dapUngSo[i]) }
  };
})();

/* ---------- Mô tả 5 chỉ tiêu + CÁCH TÍNH từng số trên giao diện ----------
   so: tên số liệu / biểu đồ trên IOC · truong: trường eform lấy dữ liệu (đúng tên hiển thị trong file mô tả eform)
   cach: cách tính · kq: kết quả với số giả lập hiện tại. Bảng này dùng cho khung "Cách tính" trong form. */
const VPUB_CT = (function () {
  const D = VPUB_DATA, S = VPUB_SUM, Q3 = 2;
  const s27 = S.cs27, s29 = S.cs29, s74 = S.cs74, h = S.cs52.hs, s11 = S.cs1112;
  return [
    {
      key: 'cs27', name: 'Tỷ lệ văn bản, hồ sơ công việc xử lý trên môi trường mạng (chỉ số 27)', eform: 'Chỉ số 27 theo Quyết định 5279',
      freq: 'Quý', ky: 'Quý III/2026', soBanGhi: D.cs27.soDv + VPUB_DV.length,
      banGhi: 'Mỗi bản ghi là số liệu một quý của một đơn vị (' + D.cs27.soDv + ' sở, ban, ngành và ' + VPUB_DV.length + ' phường/xã). IOC lấy các bản ghi của quý đang xem (chọn theo Kỳ báo cáo, Năm, Quý), không cộng các quý.',
      giaDinh: [
        'Danh mục «Cấp báo cáo» hiện chỉ có "Cấp Sở, ban, ngành"; IOC giả định có thêm "Xã/phường" như eform chỉ số 11, 12. Danh mục «Đơn vị báo cáo» hiện chỉ có 126 phường/xã, cần bổ sung các sở, ban, ngành.',
        'Không lấy trung bình trường «Tỷ lệ (%) (tự tính)» của các đơn vị, vì mỗi đơn vị có số văn bản khác nhau; IOC cộng số rồi mới chia.',
        'Ngưỡng nhóm phường/xã (95%, 90%, 80%) là ngưỡng IOC tự đặt để xem phân bố, cần Văn phòng xác nhận.'
      ],
      f: [
        { so: 'Tổng số văn bản, hồ sơ công việc', truong: 'Tổng số văn bản, hồ sơ công việc', cach: 'Cộng trường này của tất cả đơn vị trong quý.', kq: vpubN(s27.tong[Q3]) },
        { so: 'Số xử lý trên môi trường mạng', truong: 'Số văn bản, hồ sơ xử lý trên môi trường mạng', cach: 'Cộng trường này của tất cả đơn vị trong quý.', kq: vpubN(s27.mang[Q3]) },
        { so: 'Tỷ lệ toàn Thành phố', truong: '2 trường trên', cach: 'Số xử lý trên môi trường mạng ÷ Tổng số văn bản, hồ sơ × 100.', kq: vpubN(s27.mang[Q3]) + ' ÷ ' + vpubN(s27.tong[Q3]) + ' = ' + vpubPct(s27.mang[Q3], s27.tong[Q3]) },
        { so: 'Tỷ lệ theo cấp', truong: 'Cấp báo cáo, 2 trường số ở trên', cach: 'Nhóm theo Cấp báo cáo, cộng 2 trường trong từng nhóm rồi chia.', kq: 'Sở, ban, ngành ' + vpubN(s27.soTyLe, 1) + '% · Phường/xã ' + vpubN(s27.xaTyLe, 1) + '%' },
        { so: 'Biểu đồ "Tỷ lệ theo quý"', truong: 'Quý, Cấp báo cáo, 2 trường số', cach: 'Với mỗi quý: cột = tổng văn bản, hồ sơ của 2 cấp; đường = tỷ lệ toàn Thành phố của quý đó.', kq: VPUB_QUY.map((q, i) => q + ' ' + vpubN(s27.tyLeQ[i], 1) + '%').join(' · ') },
        { so: 'Biểu đồ tròn "Phường/xã theo mức tỷ lệ"', truong: 'Đơn vị báo cáo, 2 trường số', cach: 'Tính tỷ lệ của từng phường/xã (số xử lý trên mạng ÷ tổng × 100), xếp vào 4 nhóm, đếm số đơn vị.', kq: D.cs27.nhom.map((g, i) => g[0] + ' ' + s27.nhom[i]).join(' · ') },
        { so: 'Biểu đồ "10 phường/xã tỷ lệ thấp nhất"', truong: 'Đơn vị báo cáo, 2 trường số', cach: 'Tỷ lệ của từng phường/xã như trên, xếp từ thấp lên, lấy 10 đơn vị đầu.', kq: s27.thapNhat[0][0] + ' thấp nhất (' + vpubN(s27.thapNhat[0][1], 1) + '%)' },
        { so: 'Cột "Văn bản xử lý trên mạng" ở bảng 126 phường/xã', truong: 'Đơn vị báo cáo, 2 trường số', cach: 'Tỷ lệ quý III của từng phường/xã; dòng cộng = tỷ lệ chung của 126 phường/xã.', kq: vpubN(s27.xaTyLe, 1) + '%' }
      ]
    },
    {
      key: 'cs29', name: 'Triển khai trợ lý ảo (chỉ số 29)', eform: 'Thu thập dữ liệu chỉ tiêu: Triển khai trợ lý ảo (chỉ số 29)',
      freq: 'Năm', ky: 'Năm 2026', soBanGhi: s29.dv,
      banGhi: 'Mỗi bản ghi là một đơn vị báo cáo (phường/xã) trong năm. IOC lấy bản báo cáo mới nhất của mỗi đơn vị.',
      giaDinh: [
        '«Đã triển khai trợ lý ảo» chưa có kiểu nhập trong file mô tả; IOC giả định là Danh mục Có / Chưa.',
        '«Tên ứng dụng trợ lý ảo» và «Đối tượng phục vụ» đang là kiểu Chữ (gõ tự do); IOC tự gom tên gần giống nhau về 3 nhóm để vẽ biểu đồ. Đề nghị đổi 2 trường này sang Danh mục.'
      ],
      f: [
        { so: 'Số đơn vị báo cáo', truong: 'Đơn vị báo cáo', cach: 'Đếm số đơn vị đã gửi báo cáo của năm.', kq: vpubN(s29.dv) + ' đơn vị' },
        { so: 'Đã triển khai trợ lý ảo', truong: 'Đã triển khai trợ lý ảo', cach: 'Đếm đơn vị có Đã triển khai trợ lý ảo = Có.', kq: vpubN(s29.tla) + ' đơn vị' },
        { so: 'Tỷ lệ đã triển khai', truong: 'Đã triển khai trợ lý ảo', cach: 'Đã triển khai ÷ Số đơn vị báo cáo × 100.', kq: vpubN(s29.tla) + ' ÷ ' + vpubN(s29.dv) + ' = ' + vpubPct(s29.tla, s29.dv) },
        { so: 'Biểu đồ "Phường và xã"', truong: 'Đơn vị báo cáo, Đã triển khai trợ lý ảo', cach: 'Tách đơn vị theo tên (Phường / Xã), trong mỗi nhóm đếm Đã triển khai và Chưa triển khai.', kq: 'Phường ' + s29.phuong[0] + '/' + s29.phuong[1] + ' · Xã ' + s29.xa[0] + '/' + s29.xa[1] },
        { so: 'Biểu đồ tròn "Theo ứng dụng trợ lý ảo"', truong: 'Tên ứng dụng trợ lý ảo', cach: 'Chỉ lấy đơn vị đã triển khai, gom Tên ứng dụng về 3 nhóm, đếm số đơn vị.', kq: D.cs29.app.map((a, i) => a[0] + ' ' + s29.app[i]).join(' · ') },
        { so: 'Biểu đồ tròn "Theo đối tượng phục vụ"', truong: 'Đối tượng phục vụ', cach: 'Chỉ lấy đơn vị đã triển khai, đếm theo Đối tượng phục vụ.', kq: D.cs29.doiTuong.map((a, i) => a[0] + ' ' + s29.dt[i]).join(' · ') },
        { so: 'Cột "Trợ lý ảo" ở bảng 126 phường/xã', truong: 'Đã triển khai trợ lý ảo', cach: 'Có / Chưa theo báo cáo của từng phường/xã.', kq: vpubN(s29.tla) + ' đơn vị Có' }
      ]
    },
    {
      key: 'cs74', name: 'Theo dõi nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao (chỉ số 74)', eform: 'Theo dõi nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao (chỉ số 74)',
      freq: 'Quý', ky: VPUB_KY, soBanGhi: s74.tong,
      banGhi: 'Mỗi bản ghi là một nhiệm vụ («Mã nhiệm vụ»). IOC lấy các nhiệm vụ có «Ngày giao» từ 01/01 đến 30/9/2026, trạng thái theo bản cập nhật mới nhất; mỗi Mã nhiệm vụ chỉ đếm một lần.',
      giaDinh: [
        '«Cơ quan giao» và «Đơn vị chủ trì» đang là kiểu Chữ; IOC gom tên về danh sách cố định (Chính phủ / Thủ tướng Chính phủ / Phó Thủ tướng Chính phủ; các sở). Đề nghị đổi sang Danh mục.',
        '«Cảnh báo tiến độ» chưa có danh mục; IOC coi nhiệm vụ chưa hoàn thành còn ≤ 7 ngày đến «Hạn hoàn thành» là Sắp đến hạn.',
        'Bộ chỉ tiêu cũ (STT 74, ' + vpubN(4860) + ' nhiệm vụ lũy kế) đã thay bằng bộ này; số ở đây chỉ tính nhiệm vụ giao năm 2026.'
      ],
      f: [
        { so: 'Tổng số nhiệm vụ', truong: 'Mã nhiệm vụ, Ngày giao', cach: 'Đếm nhiệm vụ có Ngày giao trong kỳ.', kq: vpubN(s74.tong) + ' nhiệm vụ' },
        { so: 'Đã hoàn thành', truong: 'Trạng thái thực hiện', cach: 'Đếm nhiệm vụ có trạng thái Hoàn thành đúng hạn hoặc Hoàn thành quá hạn; tỷ lệ đúng hạn = Hoàn thành đúng hạn ÷ Đã hoàn thành × 100.', kq: vpubN(s74.ht) + ' nhiệm vụ, ' + vpubPct(s74.st[0], s74.ht) + ' đúng hạn' },
        { so: 'Tỷ lệ hoàn thành', truong: 'Trạng thái thực hiện', cach: 'Đã hoàn thành ÷ Tổng số nhiệm vụ × 100.', kq: vpubN(s74.ht) + ' ÷ ' + vpubN(s74.tong) + ' = ' + vpubPct(s74.ht, s74.tong) },
        { so: 'Quá hạn chưa hoàn thành', truong: 'Trạng thái thực hiện', cach: 'Đếm nhiệm vụ có trạng thái Quá hạn chưa hoàn thành.', kq: vpubN(s74.quaHan) + ' nhiệm vụ' },
        { so: 'Sắp đến hạn', truong: 'Cảnh báo tiến độ, Hạn hoàn thành', cach: 'Đếm nhiệm vụ chưa hoàn thành có cảnh báo sắp đến hạn.', kq: vpubN(D.cs74.sapDenHan) + ' nhiệm vụ' },
        { so: 'Tiến độ bình quân nhiệm vụ đang thực hiện', truong: 'Tỷ lệ hoàn thành (%), Trạng thái thực hiện', cach: 'Trung bình Tỷ lệ hoàn thành (%) của các nhiệm vụ Đang thực hiện.', kq: vpubN(D.cs74.tienDoBq, 1) + '%' },
        { so: 'Biểu đồ tròn "Theo trạng thái thực hiện"', truong: 'Trạng thái thực hiện', cach: 'Đếm nhiệm vụ theo 6 giá trị của danh mục.', kq: D.cs74.st.map((x, i) => x.l + ' ' + s74.st[i]).join(' · ') },
        { so: 'Biểu đồ cột "Theo cơ quan giao"', truong: 'Cơ quan giao, Trạng thái thực hiện', cach: 'Nhóm theo Cơ quan giao, trong mỗi nhóm đếm theo 6 trạng thái (cột xếp chồng).', kq: D.cs74.coQuan.map((r) => r[0] + ' ' + vpubSum(r[1])).join(' · ') },
        { so: 'Biểu đồ cột "Theo đơn vị chủ trì"', truong: 'Đơn vị chủ trì, Trạng thái thực hiện', cach: 'Nhóm theo Đơn vị chủ trì, đếm theo 4 nhóm: Đã hoàn thành (2 trạng thái hoàn thành), Đang/chưa thực hiện trong hạn, Quá hạn chưa hoàn thành, Tạm dừng. Đơn vị phối hợp không được đếm.', kq: D.cs74.chuTri.length + ' nhóm đơn vị chủ trì' },
        { so: 'Biểu đồ "Giao và hoàn thành lũy kế theo tháng"', truong: 'Ngày giao, Ngày hoàn thành', cach: 'Với mỗi tháng t: Đã giao = số nhiệm vụ có Ngày giao đến hết tháng t; Đã hoàn thành = số nhiệm vụ có Ngày hoàn thành đến hết tháng t.', kq: 'Tháng 9: giao ' + vpubN(s74.lkGiao[8]) + ', hoàn thành ' + vpubN(s74.lkHt[8]) },
        { so: 'Cột "Nhiệm vụ có địa bàn" ở bảng 126 phường/xã', truong: 'Địa bàn', cach: 'Đếm nhiệm vụ theo Địa bàn; nhiệm vụ chung của Thành phố (không chọn địa bàn) không vào bảng.', kq: vpubN(D.cs74.coDiaBan) + ' / ' + vpubN(s74.tong) + ' nhiệm vụ có địa bàn' }
      ]
    },
    {
      key: 'cs52', name: 'Hồ sơ thủ tục hành chính, dịch vụ công (chỉ số 52)', eform: 'Thống kê hồ sơ thủ tục hành chính/dịch vụ công (chỉ số 52)',
      freq: 'Quý', ky: VPUB_KY, soBanGhi: VPUB_DV.length * 3,
      banGhi: 'Mỗi bản ghi là số liệu một quý của một phường/xã. IOC cộng các quý I, II, III năm 2026.',
      giaDinh: [
        'Trung tâm Phục vụ hành chính công Thành phố đã có số hồ sơ lấy qua API. Số ở eform này để đối chiếu; khi hai nguồn lệch nhau cần thống nhất lấy nguồn nào.',
        'Tỷ lệ thanh toán trực tuyến tính trên số hồ sơ trực tuyến, vì eform không có trường số hồ sơ phải nộp phí.',
        'Kết quả giải quyết chỉ gồm 2 phần đúng hạn, quá hạn. Phần tiếp nhận − đúng hạn − quá hạn ghi ở dòng phụ "Chưa có kết quả trong kỳ" (âm thì ghi "Có giải quyết hồ sơ kỳ trước"), vì eform không có số hồ sơ kỳ trước chuyển sang (bản trả lời BA, mục 06).',
        'Dữ liệu mẫu của «Hồ sơ thanh toán trực tuyến» và «Hồ sơ đã số hóa» trong file mô tả lớn hơn Tổng số hồ sơ tiếp nhận, cần sửa lại.'
      ],
      f: [
        { so: 'Tổng số hồ sơ tiếp nhận', truong: 'Tổng số hồ sơ tiếp nhận', cach: 'Cộng trường này của 126 phường/xã, 3 quý.', kq: vpubN(h.tn) + ' hồ sơ' },
        { so: 'Tỷ lệ giải quyết đúng hạn', truong: 'Hồ sơ giải quyết đúng hạn, Hồ sơ giải quyết quá hạn', cach: 'Đúng hạn ÷ (Đúng hạn + Quá hạn) × 100.', kq: vpubN(h.dh) + ' ÷ ' + vpubN(h.dh + h.qh) + ' = ' + vpubPct(h.dh, h.dh + h.qh) },
        { so: 'Tỷ lệ hồ sơ trực tuyến', truong: 'Hồ sơ trực tuyến', cach: 'Hồ sơ trực tuyến ÷ Tổng số hồ sơ tiếp nhận × 100.', kq: vpubPct(h.tt, h.tn) },
        { so: 'Tỷ lệ thanh toán trực tuyến', truong: 'Hồ sơ thanh toán trực tuyến', cach: 'Hồ sơ thanh toán trực tuyến ÷ Hồ sơ trực tuyến × 100.', kq: vpubPct(h.tttt, h.tt) },
        { so: 'Tỷ lệ hồ sơ đã số hóa', truong: 'Hồ sơ đã số hóa', cach: 'Hồ sơ đã số hóa ÷ Tổng số hồ sơ tiếp nhận × 100.', kq: vpubPct(h.sh, h.tn) },
        { so: 'Điểm hài lòng', truong: 'Điểm hài lòng (%), Tổng số hồ sơ tiếp nhận', cach: 'Bình quân có trọng số: cộng (Điểm hài lòng × Tổng số hồ sơ tiếp nhận) của từng bản ghi ÷ cộng Tổng số hồ sơ tiếp nhận.', kq: vpubN(h.hl, 1) + '%' },
        { so: 'Biểu đồ "Kết quả giải quyết theo quý"', truong: 'Quý, Tổng số hồ sơ tiếp nhận, Hồ sơ giải quyết đúng hạn, Hồ sơ giải quyết quá hạn', cach: 'Với mỗi quý: cột = số hồ sơ tiếp nhận.', kq: VPUB_QUY.map((q, i) => q + ' ' + vpubN(S.cs52.quy[i].tn)).join(' · ') },
        { so: 'Biểu đồ tròn "Kết quả giải quyết"', truong: 'Hồ sơ giải quyết đúng hạn, Hồ sơ giải quyết quá hạn', cach: 'Cộng 3 quý: 2 phần đúng hạn, quá hạn; giữa vòng = số đã giải quyết. Dòng phụ: chưa có kết quả trong kỳ = tiếp nhận − đúng hạn − quá hạn.', kq: 'Đã giải quyết ' + vpubN(h.daGq) + ' · chưa có kết quả ' + vpubN(h.dangGq) },
        { so: 'Biểu đồ "Các tỷ lệ: phường và xã"', truong: 'Đơn vị báo cáo, các trường số', cach: 'Tách đơn vị theo tên (Phường / Xã), cộng từng trường trong mỗi nhóm rồi tính 4 tỷ lệ như trên.', kq: 'Trực tuyến: phường ' + vpubPct(S.cs52.cap[0].tt, S.cs52.cap[0].tn) + ' · xã ' + vpubPct(S.cs52.cap[1].tt, S.cs52.cap[1].tn) },
        { so: 'Cột "Hồ sơ tiếp nhận", "Đúng hạn" ở bảng 126 phường/xã', truong: 'Đơn vị báo cáo, các trường số', cach: 'Cộng 3 quý của từng phường/xã; tỷ lệ đúng hạn tính như trên.', kq: 'Tổng các phường/xã = ' + vpubN(h.tn) }
      ]
    },
    {
      key: 'cs1112', name: 'Hạ tầng công nghệ thông tin (chỉ số 11, 12)', eform: 'Quản lý hạ tầng CNTT (chỉ số 11, 12)',
      freq: 'Quý', ky: 'Quý III/2026', soBanGhi: vpubSum(S.cs1112.dapUng),
      banGhi: 'Mỗi bản ghi là một loại hạ tầng («Loại hạ tầng CNTT») của một đơn vị, kèm tình trạng và số lượng. Số lượng là số đang có, nên IOC chỉ lấy bản báo cáo quý mới nhất, không cộng các quý.',
      giaDinh: [
        'Một đơn vị có thể khai nhiều bản ghi cùng một loại hạ tầng, mỗi bản ghi một «Tình trạng hoạt động»; IOC cộng «Số lượng» theo từng tình trạng.',
        '«Số lượng» của Hệ thống giao ban trực tuyến là số hệ thống, không dùng thay số phòng. Hai trường phòng họp là số của cả đơn vị, mỗi đơn vị mỗi kỳ lấy một lần (bản trả lời BA, mục 04).',
        '«Đối tượng phục vụ» chưa dùng để vẽ biểu đồ, chỉ để xem chi tiết.'
      ],
      f: [
        { so: 'Tổng thiết bị, hệ thống', truong: 'Số lượng', cach: 'Cộng Số lượng của tất cả bản ghi (mọi loại, mọi tình trạng).', kq: vpubN(s11.tong) },
        { so: 'Tỷ lệ đang hoạt động', truong: 'Tình trạng hoạt động, Số lượng', cach: 'Cộng Số lượng có Tình trạng = Đang hoạt động ÷ Tổng × 100.', kq: vpubPct(s11.tt[0], s11.tong) },
        { so: 'Hỏng/Không hoạt động', truong: 'Tình trạng hoạt động, Số lượng', cach: 'Cộng Số lượng có Tình trạng = Hỏng/Không hoạt động.', kq: vpubN(s11.tt[3]) },
        { so: 'Tỷ lệ phòng họp có giao ban trực tuyến', truong: 'Tổng số phòng họp, Số phòng được trang bị hệ thống giao ban trực tuyến', cach: 'Cộng số phòng được trang bị ÷ cộng tổng số phòng họp × 100.', kq: vpubN(s11.phongTb) + ' ÷ ' + vpubN(s11.phong) + ' = ' + vpubPct(s11.phongTb, s11.phong) },
        { so: 'Biểu đồ "Số lượng theo loại hạ tầng"', truong: 'Loại hạ tầng CNTT, Cấp báo cáo, Số lượng', cach: 'Nhóm theo Loại hạ tầng, cộng Số lượng, tách 2 cấp (cột xếp chồng). Máy tính làm việc hiện ở ô số riêng, không vẽ vào biểu đồ vì số lớn hơn hẳn các loại khác.', kq: (s11.loai.length - 1) + ' loại trên biểu đồ; máy tính ' + vpubN(s11.loaiTong[0]) },
        { so: 'Biểu đồ tròn "Theo tình trạng hoạt động"', truong: 'Tình trạng hoạt động, Số lượng', cach: 'Cộng Số lượng theo 4 tình trạng.', kq: D.cs1112.tt.map((t, i) => t[0] + ' ' + vpubN(s11.tt[i])).join(' · ') },
        { so: 'Biểu đồ "Mức độ đáp ứng theo cấp"', truong: 'Mức độ đáp ứng, Cấp báo cáo', cach: 'Mỗi cặp đơn vị × loại hạ tầng đếm một lượt (nhiều dòng tình trạng thì lấy bản mới nhất, cùng lúc thì lấy mức thấp nhất), tách 2 cấp (bản trả lời BA, mục 03).', kq: D.cs1112.dapUng.map((t, i) => t[0] + ' ' + s11.dapUng[i]).join(' · ') },
        { so: 'Biểu đồ "Phòng họp có giao ban trực tuyến"', truong: 'Cấp báo cáo, 2 trường phòng họp', cach: 'Theo từng cấp: cột = tổng phòng họp và số phòng được trang bị.', kq: 'Phường/xã ' + vpubN(s11.tbXa) + '/' + vpubN(s11.phXa) + ' · Sở/ngành ' + vpubN(D.cs1112.soPhongTb) + '/' + vpubN(D.cs1112.soPhongHop) },
        { so: 'Cột "Phòng họp có giao ban" ở bảng 126 phường/xã', truong: 'Đơn vị báo cáo, 2 trường phòng họp', cach: 'Số phòng được trang bị / tổng số phòng họp của từng phường/xã.', kq: vpubN(s11.tbXa) + ' / ' + vpubN(s11.phXa) }
      ]
    }
  ];
})();

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ----------
   [tên, số bản ghi, tần suất, nguồn, phân tổ] — phân tổ (dạng P/S của central-level.js) dùng cho thẻ xem trước ở lưới
   chỉ tiêu; vkey nối dòng với khối hiển thị trong dashboard-vpub.js. */
function vpubPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const VPUB_ITEMS = (function () {
  const D = VPUB_DATA, S = VPUB_SUM, src = 'Eform Văn phòng UBND (giả lập)', Q3 = 2;
  const parts = {
    cs27: [vpubPart('Văn bản, hồ sơ quý III', 'stat', [['Tổng số', S.cs27.tong[Q3]], ['Xử lý trên môi trường mạng', S.cs27.mang[Q3]]])],
    cs29: [vpubPart('Trợ lý ảo', 'bar', [['Đã triển khai', S.cs29.tla], ['Chưa triển khai', S.cs29.dv - S.cs29.tla]])],
    cs74: [vpubPart('Trạng thái thực hiện', 'bar', D.cs74.st.map((x, i) => [x.l, S.cs74.st[i]]))],
    cs52: [vpubPart('Kết quả giải quyết', 'bar', [['Đúng hạn', S.cs52.hs.dh], ['Quá hạn', S.cs52.hs.qh]])],
    cs1112: [vpubPart('Tình trạng hoạt động', 'bar', D.cs1112.tt.map((t, i) => [t[0], S.cs1112.tt[i]]))]
  };
  return VPUB_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
