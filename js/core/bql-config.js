/* ============================== BAN QUẢN LÝ CÁC KHU CÔNG NGHỆ CAO VÀ KHU CÔNG NGHIỆP THÀNH PHỐ — BỘ CHỈ TIÊU MỚI THEO EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố"), 1 eform
   "Khu công nghiệp, khu chế xuất, khu kinh tế và Khu Công nghệ cao" (14 trường, mỗi bản ghi = 1 Địa bàn × 1 kỳ báo cáo).
   Eform gộp nhiều nhóm thông tin nên IOC tách thành 3 chỉ tiêu (doanh nghiệp – vốn – lao động; thu hút đầu tư; hạ tầng – sản xuất
   kinh doanh – môi trường), cùng đọc một eform. Hiển thị theo khuôn chung (khối catBoxHtml + Chart.js, xem dashboard-bql.js) —
   giống Sở VHTT và Văn phòng UBND, KHÔNG theo khuôn HCC/SGD/STC vì Ban chưa có API.
   Chưa có số thật: toàn bộ số dưới đây là SỐ GIẢ LẬP. Số của từng địa bàn được sinh cố định theo tên (hàm băm), số toàn Thành
   phố = cộng các địa bàn, nên bảng địa bàn và biểu đồ luôn khớp nhau.
   Nạp TRƯỚC central-level.js (central-level.js dùng BQL_ITEMS). Không dùng hàm nào của file khác. */

const BQL_KY = '9 tháng năm 2026';
const BQL_QUY = ['Quý I', 'Quý II', 'Quý III'];

function bqlN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function bqlSum(a) { return a.reduce((s, v) => s + v, 0); }
function bqlPct(a, b, d) { return bqlN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function bqlHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
/* số ngẫu nhiên CỐ ĐỊNH trong [0, 1) theo tên địa bàn + khóa */
function bqlR(name, key) { return (bqlHash(name + '|' + key) % 10000) / 10000; }

/* ---------- Danh mục của eform ---------- */
/* «Tình hình đầu tư kết cấu hạ tầng» và «Đạt chuẩn môi trường» đang là kiểu Chữ; IOC giả định gom về các nhóm dưới đây */
const BQL_HT = [['Đã hoàn thành', '#1baf7a'], ['Đang triển khai', '#2a78d6'], ['Chưa triển khai', '#898781']];
const BQL_MT = [['Đạt chuẩn', '#1baf7a'], ['Đang khắc phục', '#eda100'], ['Chưa đạt', '#d33a44']];
/* «Đối tác/nhà đầu tư chính» là kiểu Chữ; IOC đếm số địa bàn có nhắc tới từng nhóm nhà đầu tư */
const BQL_DOI_TAC = [['Trong nước', '#2a78d6'], ['Nhật Bản', '#d33a44'], ['Hàn Quốc', '#7086FD'], ['Đài Loan', '#1baf7a'], ['Trung Quốc', '#eda100'], ['Singapore', '#39d5ff']];

/* ---------- Địa bàn có báo cáo (giả lập): trong 126 phường/xã của danh mục «Địa bàn», chỉ nơi có khu mới báo cáo ----------
   [địa bàn, số doanh nghiệp đang hoạt động, tổng vốn đầu tư đăng ký (tỷ đồng), số lao động — 3 số tại 30/9/2026,
    tình hình hạ tầng (chỉ số BQL_HT), đạt chuẩn môi trường (chỉ số BQL_MT), đối tác/nhà đầu tư chính] */
const BQL_DB = [
  ['Xã Hòa Lạc', 96, 112600, 18400, 1, 0, 'Nhà đầu tư trong nước, Hàn Quốc, Nhật Bản'],
  ['Xã Thạch Thất', 58, 6840, 9200, 0, 0, 'Nhà đầu tư trong nước'],
  ['Xã Quốc Oai', 41, 5120, 7600, 0, 2, 'Nhà đầu tư trong nước, Trung Quốc'],
  ['Xã Thiên Lộc', 92, 38400, 61800, 0, 0, 'Nhà đầu tư Nhật Bản'],
  ['Xã Đông Anh', 64, 21600, 24300, 0, 0, 'Nhà đầu tư Nhật Bản, Hàn Quốc'],
  ['Xã Phúc Thịnh', 38, 9800, 11200, 1, 0, 'Nhà đầu tư trong nước, Singapore'],
  ['Xã Quang Minh', 118, 24800, 32600, 0, 1, 'Nhà đầu tư Hàn Quốc, Đài Loan'],
  ['Xã Mê Linh', 46, 8200, 9700, 1, 0, 'Nhà đầu tư trong nước'],
  ['Xã Nội Bài', 52, 16800, 21400, 0, 0, 'Nhà đầu tư Hàn Quốc, Nhật Bản'],
  ['Xã Sóc Sơn', 27, 6400, 5800, 1, 2, 'Nhà đầu tư trong nước'],
  ['Phường Thượng Cát', 74, 9600, 12800, 0, 0, 'Nhà đầu tư trong nước, Nhật Bản'],
  ['Phường Phúc Lợi', 31, 4200, 6100, 0, 0, 'Nhà đầu tư Hàn Quốc'],
  ['Phường Long Biên', 22, 7600, 4900, 0, 0, 'Nhà đầu tư Đài Loan, Trung Quốc'],
  ['Xã Phú Nghĩa', 84, 7800, 14600, 0, 1, 'Nhà đầu tư trong nước, Trung Quốc'],
  ['Xã Phú Xuyên', 12, 18200, 1400, 1, 0, 'Nhà đầu tư trong nước, Singapore'],
  ['Xã Thanh Oai', 4, 9600, 300, 2, 0, 'Nhà đầu tư trong nước']
];
/* Mẫu câu giả lập cho 2 trường kiểu Chữ chỉ dùng để xem chi tiết */
const BQL_ND_MAU = [
  'Cấp mới Giấy chứng nhận đăng ký đầu tư dự án sản xuất linh kiện điện tử',
  'Điều chỉnh tăng vốn đầu tư dự án sản xuất cơ khí chính xác',
  'Cấp mới dự án kho vận, logistics',
  'Điều chỉnh tiến độ thực hiện dự án',
  'Cấp mới dự án sản xuất thiết bị y tế',
  'Điều chỉnh mục tiêu dự án sản xuất bao bì',
  'Thành lập doanh nghiệp chế xuất sản xuất hàng may mặc'
];
const BQL_ND_CNC = 'Cấp mới dự án nghiên cứu, phát triển và sản xuất sản phẩm công nghệ cao';
const BQL_BVMT_MAU = [
  'Trạm xử lý nước thải tập trung vận hành ổn định, quan trắc tự động truyền số liệu liên tục',
  'Đang nâng công suất trạm xử lý nước thải tập trung',
  'Trạm xử lý nước thải tập trung chưa hoàn chỉnh, đang khắc phục theo kết luận kiểm tra'
];

/* ---------- Số của từng địa bàn (sinh cố định theo tên) ---------- */
const BQL_UNITS = BQL_DB.map((r) => {
  const ten = r[0], R = (k) => bqlR(ten, k), cnc = ten === 'Xã Hòa Lạc';
  /* 3 trường thời điểm: số quý III lấy từ BQL_DB, quý I, II lùi lại theo mức tăng giả lập */
  const lui = (v, k, rate) => { const d3 = Math.round(v * rate * (0.4 + R(k + '3'))), d2 = Math.round(v * rate * (0.4 + R(k + '2'))); return [v - d3 - d2, v - d3, v]; };
  const dn = lui(r[1], 'dn', 0.02), von = lui(r[2], 'von', 0.025), ld = lui(r[3], 'ld', 0.015);
  /* các trường "trong kỳ": sinh theo từng quý */
  const size = Math.max(0.3, r[1] / 12);
  const tl = [0, 1, 2].map((q) => Math.round(size * (0.6 + 0.9 * R('tl' + q))));
  const da = tl.map((t, q) => Math.min(t, Math.round(t * (0.35 + 0.35 * R('da' + q)))));
  const vm = da.map((d, q) => Math.round(d * (cnc ? 900 : 120) * (0.5 + R('vm' + q))));
  const vh = [0, 1, 2].map((q) => Math.round(r[4] === 0 ? 4 + 30 * R('vh' + q) : r[4] === 1 ? 90 + 380 * R('vh' + q) : 8 * R('vh' + q)));
  const dt = ld.map((l, q) => Math.round(l * 0.24 * (0.85 + 0.3 * R('dt' + q))));
  return {
    ten: ten, phuong: ten.indexOf('Phường') === 0, dn: dn, von: von, ld: ld, tl: tl, da: da, vm: vm, vh: vh, dt: dt,
    ht: r[4], mt: r[5], doiTac: r[6],
    ndGanNhat: cnc ? BQL_ND_CNC : BQL_ND_MAU[bqlHash(ten + '|nd') % BQL_ND_MAU.length], bvmt: BQL_BVMT_MAU[r[5]]
  };
});

/* ---------- Số tổng hợp (tính từ BQL_UNITS, dùng chung cho thẻ, biểu đồ, bảng cách tính) ---------- */
const BQL_SUM = (function () {
  const U = BQL_UNITS, Q3 = 2, Q = [0, 1, 2];
  const quy = (k) => Q.map((q) => bqlSum(U.map((u) => u[k][q])));
  const tong9 = (k) => bqlSum(quy(k));
  const dnQ = quy('dn'), vonQ = quy('von'), ldQ = quy('ld');
  const xep = (f) => U.map((u) => [u.ten, f(u)]).sort((a, b) => b[1] - a[1]);
  const tl = tong9('tl'), da = tong9('da'), vm = tong9('vm'), vh = tong9('vh'), dt = tong9('dt');
  /* hàng của biểu đồ gộp theo địa bàn: [địa bàn, số chính (xếp theo số này, giảm dần), số phụ] */
  const hang = (fa, fb, loc) => U.filter((u) => !loc || loc(u)).map((u) => [u.ten, fa(u), fb(u)]).sort((a, b) => b[1] - a[1] || b[2] - a[2]);
  return {
    db: U.length,
    dn: { dnQ: dnQ, vonQ: vonQ, ldQ: ldQ, dn: dnQ[Q3], von: vonQ[Q3], ld: ldQ[Q3], ldBq: ldQ[Q3] / dnQ[Q3],
      xepDn: xep((u) => u.dn[Q3]), xepVon: xep((u) => u.von[Q3]),
      hang: hang((u) => u.dn[Q3], (u) => u.von[Q3]),
      doiTac: BQL_DOI_TAC.map((g) => U.filter((u) => u.doiTac.toLowerCase().indexOf(g[0].toLowerCase()) >= 0).length) },
    thuHut: { tlQ: quy('tl'), daQ: quy('da'), vmQ: quy('vm'), tl: tl, da: da, vm: vm, vmBq: da ? vm / da : 0,
      xepVm: xep((u) => bqlSum(u.vm)).filter((r) => r[1] > 0), xepDa: xep((u) => bqlSum(u.da)).filter((r) => r[1] > 0),
      hang: hang((u) => bqlSum(u.vm), (u) => bqlSum(u.da), (u) => bqlSum(u.da) > 0 || bqlSum(u.vm) > 0),
      /* 6 địa bàn có vốn thu hút mới quý III lớn nhất, dùng cho khối «Nội dung thành lập, điều chỉnh gần nhất» */
      ganNhat: U.slice().sort((a, b) => b.vm[Q3] - a.vm[Q3]).slice(0, 6) },
    sxkd: { dtQ: quy('dt'), vhQ: quy('vh'), dt: dt, vh: vh, dtLd: (dt * 1000) / ldQ[Q3],
      xepDt: xep((u) => bqlSum(u.dt)),
      hang: hang((u) => bqlSum(u.dt), (u) => bqlSum(u.vh)),
      ht: BQL_HT.map((_, i) => U.filter((u) => u.ht === i).length), mt: BQL_MT.map((_, i) => U.filter((u) => u.mt === i).length) }
  };
})();

/* ---------- Mô tả 3 chỉ tiêu + CÁCH TÍNH từng số trên giao diện ----------
   so: tên số liệu / biểu đồ trên IOC · truong: trường eform lấy dữ liệu (đúng tên hiển thị trong file mô tả eform)
   cach: cách tính · kq: kết quả với số giả lập hiện tại. Bảng này dùng cho khung "Cách tính" trong form. */
const BQL_EFORM = 'Khu công nghiệp, khu chế xuất, khu kinh tế và Khu Công nghệ cao';
const BQL_CT = (function () {
  const S = BQL_SUM, s1 = S.dn, s2 = S.thuHut, s3 = S.sxkd, Q3 = 2, nDb = S.db;
  const giaDinhChung = [
    'Eform không có trường tên khu hoặc loại khu, nên IOC không tách được khu công nghiệp với khu công nghệ cao (bộ chỉ tiêu cũ tách 2 dòng). Đề nghị bổ sung trường «Tên khu» kiểu Danh mục.',
    'Danh mục «Địa bàn» có 126 phường/xã; chỉ địa bàn có khu mới báo cáo (hiện giả lập ' + nDb + ' địa bàn). Một địa bàn có nhiều khu thì cộng chung vào một bản ghi.'
  ];
  return [
    {
      key: 'dn', name: 'Doanh nghiệp, vốn đầu tư đăng ký và lao động trong các khu', eform: BQL_EFORM,
      freq: 'Quý', ky: 'Quý III/2026', soBanGhi: nDb,
      banGhi: 'Mỗi bản ghi là số liệu một kỳ của một địa bàn. 3 trường ở chỉ tiêu này là số tại thời điểm báo cáo, nên IOC lấy bản ghi của quý đang xem (chọn theo Kỳ báo cáo, Năm, Quý), không cộng các quý.',
      giaDinh: giaDinhChung.concat([
        'Nếu địa bàn báo cáo theo tháng, IOC lấy bản ghi của tháng cuối quý cho 3 trường thời điểm này.',
        '«Đối tác/nhà đầu tư chính» là kiểu Chữ; IOC dò tên nhóm nhà đầu tư (trong nước, Nhật Bản, Hàn Quốc…) trong nội dung để đếm. Đề nghị đổi sang Danh mục chọn nhiều.'
      ]),
      f: [
        { so: 'Doanh nghiệp đang hoạt động', truong: 'Số doanh nghiệp đang hoạt động', cach: 'Cộng trường này của tất cả địa bàn trong quý III.', kq: bqlN(s1.dn) + ' doanh nghiệp' },
        { so: 'Tổng vốn đầu tư đăng ký', truong: 'Tổng vốn đầu tư đăng ký (tỷ đồng)', cach: 'Cộng trường này của tất cả địa bàn trong quý III.', kq: bqlN(s1.von) + ' tỷ đồng' },
        { so: 'Lao động đang làm việc', truong: 'Số lao động đang làm việc', cach: 'Cộng trường này của tất cả địa bàn trong quý III.', kq: bqlN(s1.ld) + ' người' },
        { so: 'Lao động bình quân một doanh nghiệp', truong: '2 trường trên', cach: 'Số lao động ÷ Số doanh nghiệp đang hoạt động.', kq: bqlN(s1.ld) + ' ÷ ' + bqlN(s1.dn) + ' = ' + bqlN(s1.ldBq) + ' người' },
        { so: 'Biểu đồ "Doanh nghiệp và lao động theo quý"', truong: 'Quý, Số doanh nghiệp đang hoạt động, Số lao động đang làm việc', cach: 'Với mỗi quý: cột = tổng số doanh nghiệp, đường = tổng số lao động của các địa bàn trong quý đó.', kq: BQL_QUY.map((q, i) => q + ' ' + bqlN(s1.dnQ[i]) + ' DN').join(' · ') },
        { so: 'Biểu đồ "Doanh nghiệp và vốn đầu tư đăng ký theo địa bàn"', truong: 'Địa bàn, Số doanh nghiệp đang hoạt động, Tổng vốn đầu tư đăng ký (tỷ đồng)', cach: 'Mỗi hàng là một địa bàn, xếp theo số doanh nghiệp quý III từ lớn xuống. Hai cột cạnh nhau, mỗi cột một thang đo riêng: trái = số doanh nghiệp, phải = tổng vốn đăng ký quý III.', kq: s1.xepDn[0][0] + ' nhiều doanh nghiệp nhất (' + bqlN(s1.xepDn[0][1]) + ') · ' + s1.xepVon[0][0] + ' vốn lớn nhất (' + bqlN(s1.xepVon[0][1]) + ' tỷ đồng, ' + bqlPct(s1.xepVon[0][1], s1.von) + ')' },
        { so: 'Biểu đồ "Nhà đầu tư chính"', truong: 'Đối tác/nhà đầu tư chính', cach: 'Đếm số địa bàn có nêu từng nhóm nhà đầu tư; một địa bàn nêu nhiều nhóm thì được đếm ở mỗi nhóm.', kq: BQL_DOI_TAC.map((g, i) => g[0] + ' ' + s1.doiTac[i]).join(' · ') },
        { so: 'Cột "Doanh nghiệp", "Vốn đăng ký", "Lao động" ở bảng địa bàn', truong: 'Địa bàn, 3 trường số ở trên', cach: 'Số quý III của từng địa bàn; dòng đầu = cộng các địa bàn.', kq: bqlN(s1.dn) + ' DN · ' + bqlN(s1.von) + ' tỷ đồng · ' + bqlN(s1.ld) + ' người' }
      ]
    },
    {
      key: 'thuHut', name: 'Thu hút đầu tư, thành lập và điều chỉnh trong các khu', eform: BQL_EFORM,
      freq: 'Quý', ky: BQL_KY, soBanGhi: nDb * 3,
      banGhi: 'Mỗi bản ghi là số liệu một kỳ của một địa bàn. Các trường ở chỉ tiêu này là số phát sinh trong kỳ, nên IOC cộng các quý I, II, III năm 2026 (báo cáo tháng thì cộng các tháng).',
      giaDinh: giaDinhChung.concat([
        'Chưa rõ «Số lượng thành lập, điều chỉnh trong kỳ» đếm dự án hay doanh nghiệp, và có gồm dự án mới hay không; IOC hiện coi là số lượt cấp mới và điều chỉnh, tách riêng với «Số dự án thu hút đầu tư mới trong kỳ». Cần Ban xác nhận.',
        '«Nội dung thành lập/điều chỉnh gần nhất» là kiểu Chữ, chỉ để xem chi tiết, không cộng.'
      ]),
      f: [
        { so: 'Lượt thành lập, điều chỉnh', truong: 'Số lượng thành lập, điều chỉnh trong kỳ', cach: 'Cộng trường này của tất cả địa bàn, 3 quý.', kq: bqlN(s2.tl) + ' lượt' },
        { so: 'Dự án thu hút đầu tư mới', truong: 'Số dự án thu hút đầu tư mới trong kỳ', cach: 'Cộng trường này của tất cả địa bàn, 3 quý.', kq: bqlN(s2.da) + ' dự án' },
        { so: 'Vốn thu hút đầu tư mới', truong: 'Tổng vốn thu hút đầu tư mới (tỷ đồng)', cach: 'Cộng trường này của tất cả địa bàn, 3 quý.', kq: bqlN(s2.vm) + ' tỷ đồng' },
        { so: 'Vốn bình quân một dự án mới', truong: '2 trường trên', cach: 'Vốn thu hút đầu tư mới ÷ Số dự án thu hút đầu tư mới.', kq: bqlN(s2.vm) + ' ÷ ' + bqlN(s2.da) + ' = ' + bqlN(s2.vmBq, 1) + ' tỷ đồng' },
        { so: 'Biểu đồ "Thu hút đầu tư theo quý"', truong: 'Quý, 3 trường số ở trên', cach: 'Với mỗi quý: 2 cột = lượt thành lập, điều chỉnh và số dự án mới; đường = vốn thu hút mới.', kq: BQL_QUY.map((q, i) => q + ' ' + bqlN(s2.daQ[i]) + ' dự án, ' + bqlN(s2.vmQ[i]) + ' tỷ').join(' · ') },
        { so: 'Biểu đồ "Vốn thu hút mới và dự án mới theo địa bàn"', truong: 'Địa bàn, Tổng vốn thu hút đầu tư mới (tỷ đồng), Số dự án thu hút đầu tư mới trong kỳ', cach: 'Cộng 3 quý của từng địa bàn. Mỗi hàng là một địa bàn, xếp theo vốn thu hút mới từ lớn xuống; địa bàn không có dự án mới thì không vẽ. Hai cột cạnh nhau, mỗi cột một thang đo riêng: trái = vốn thu hút mới, phải = số dự án mới.', kq: s2.hang.length + ' địa bàn · ' + s2.xepVm[0][0] + ' lớn nhất (' + bqlN(s2.xepVm[0][1]) + ' tỷ đồng)' },
        { so: 'Khối "Nội dung thành lập, điều chỉnh gần nhất"', truong: 'Địa bàn, Nội dung thành lập/điều chỉnh gần nhất, Tổng vốn thu hút đầu tư mới (tỷ đồng)', cach: 'Lấy bản ghi quý III, chọn 6 địa bàn có vốn thu hút mới lớn nhất, hiện nguyên nội dung đã nhập.', kq: s2.ganNhat.map((u) => u.ten).join(', ') },
        { so: 'Cột "Dự án mới", "Vốn thu hút mới" ở bảng địa bàn', truong: 'Địa bàn, 2 trường số', cach: 'Cộng 3 quý của từng địa bàn; dòng đầu = cộng các địa bàn.', kq: bqlN(s2.da) + ' dự án · ' + bqlN(s2.vm) + ' tỷ đồng' }
      ]
    },
    {
      key: 'sxkd', name: 'Đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường trong các khu', eform: BQL_EFORM,
      freq: 'Quý', ky: BQL_KY, soBanGhi: nDb * 3,
      banGhi: 'Mỗi bản ghi là số liệu một kỳ của một địa bàn. Vốn đầu tư hạ tầng và doanh thu là số trong kỳ nên IOC cộng 3 quý; tình hình hạ tầng và môi trường lấy theo bản ghi quý III.',
      giaDinh: giaDinhChung.concat([
        '«Tình hình đầu tư kết cấu hạ tầng» là kiểu Chữ (dữ liệu mẫu "Chưa triển khai"); IOC giả định chỉ nhận 3 giá trị Đã hoàn thành / Đang triển khai / Chưa triển khai. Đề nghị đổi sang Danh mục.',
        '«Đạt chuẩn môi trường» là kiểu Chữ; IOC giả định 3 giá trị Đạt chuẩn / Đang khắc phục / Chưa đạt. Đề nghị đổi sang Danh mục.',
        '«Tình hình bảo vệ môi trường» và «Ghi chú» là kiểu Chữ, chỉ để xem chi tiết, không cộng.',
        'Doanh thu bình quân một lao động tính trên số lao động quý III (số tại thời điểm), không phải lao động bình quân cả kỳ.'
      ]),
      f: [
        { so: 'Doanh thu sản xuất kinh doanh', truong: 'Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng)', cach: 'Cộng trường này của tất cả địa bàn, 3 quý.', kq: bqlN(s3.dt) + ' tỷ đồng' },
        { so: 'Doanh thu bình quân một lao động', truong: 'Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng), Số lao động đang làm việc', cach: 'Doanh thu 9 tháng × 1.000 ÷ Số lao động quý III (ra triệu đồng/người).', kq: bqlN(s3.dt) + ' × 1.000 ÷ ' + bqlN(s1.ld) + ' = ' + bqlN(s3.dtLd, 1) + ' triệu đồng' },
        { so: 'Vốn đầu tư hạ tầng', truong: 'Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)', cach: 'Cộng trường này của tất cả địa bàn, 3 quý.', kq: bqlN(s3.vh) + ' tỷ đồng' },
        { so: 'Địa bàn đạt chuẩn môi trường', truong: 'Đạt chuẩn môi trường', cach: 'Đếm địa bàn có giá trị Đạt chuẩn ở bản ghi quý III ÷ số địa bàn báo cáo × 100.', kq: s3.mt[0] + '/' + nDb + ' = ' + bqlPct(s3.mt[0], nDb) },
        { so: 'Biểu đồ "Doanh thu và vốn hạ tầng theo quý"', truong: 'Quý, Doanh thu sản xuất kinh doanh trong kỳ, Vốn đầu tư hạ tầng trong kỳ', cach: 'Với mỗi quý: cột = tổng doanh thu, đường = tổng vốn đầu tư hạ tầng của các địa bàn.', kq: BQL_QUY.map((q, i) => q + ' ' + bqlN(s3.dtQ[i]) + ' tỷ').join(' · ') },
        { so: 'Biểu đồ "Doanh thu và vốn đầu tư hạ tầng theo địa bàn"', truong: 'Địa bàn, Doanh thu sản xuất kinh doanh trong kỳ (tỷ đồng), Vốn đầu tư hạ tầng trong kỳ (tỷ đồng)', cach: 'Cộng 3 quý của từng địa bàn. Mỗi hàng là một địa bàn, xếp theo doanh thu từ lớn xuống. Hai cột cạnh nhau, mỗi cột một thang đo riêng: trái = doanh thu, phải = vốn đầu tư hạ tầng.', kq: s3.xepDt[0][0] + ' doanh thu lớn nhất (' + bqlN(s3.xepDt[0][1]) + ' tỷ đồng)' },
        { so: 'Biểu đồ tròn "Tình hình đầu tư kết cấu hạ tầng"', truong: 'Tình hình đầu tư kết cấu hạ tầng', cach: 'Đếm địa bàn theo 3 giá trị, bản ghi quý III.', kq: BQL_HT.map((g, i) => g[0] + ' ' + s3.ht[i]).join(' · ') },
        { so: 'Biểu đồ tròn "Đạt chuẩn môi trường"', truong: 'Đạt chuẩn môi trường', cach: 'Đếm địa bàn theo 3 giá trị, bản ghi quý III.', kq: BQL_MT.map((g, i) => g[0] + ' ' + s3.mt[i]).join(' · ') },
        { so: 'Cột "Doanh thu", "Hạ tầng", "Môi trường" ở bảng địa bàn', truong: 'Địa bàn, các trường trên', cach: 'Doanh thu cộng 3 quý; hạ tầng và môi trường theo bản ghi quý III.', kq: bqlN(s3.dt) + ' tỷ đồng · ' + s3.mt[0] + ' địa bàn đạt chuẩn' }
      ]
    }
  ];
})();

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ----------
   [tên, số bản ghi, tần suất, nguồn, phân tổ] — phân tổ (dạng P/S của central-level.js) dùng cho thẻ xem trước ở lưới
   chỉ tiêu; vkey nối dòng với khối hiển thị trong dashboard-bql.js. */
function bqlPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const BQL_ITEMS = (function () {
  const S = BQL_SUM, src = 'Eform Ban Quản lý (giả lập)';
  const parts = {
    dn: [bqlPart('Tại 30/9/2026', 'stat', [['Doanh nghiệp đang hoạt động', S.dn.dn], ['Lao động đang làm việc', S.dn.ld], ['Vốn đăng ký (tỷ đồng)', S.dn.von]])],
    thuHut: [bqlPart('9 tháng năm 2026', 'stat', [['Lượt thành lập, điều chỉnh', S.thuHut.tl], ['Dự án mới', S.thuHut.da], ['Vốn thu hút mới (tỷ đồng)', S.thuHut.vm]])],
    sxkd: [bqlPart('Tình hình đầu tư hạ tầng (địa bàn)', 'bar', BQL_HT.map((g, i) => [g[0], S.sxkd.ht[i]]))]
  };
  return BQL_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
