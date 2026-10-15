/* ============================== HĐND THÀNH PHỐ HÀ NỘI — CHỈ TIÊU KHUÔN MỚI ==============================
   Khai báo cho ctm-engine.js: 10 đơn vị của trục HĐND cấp Thành phố + màn ngoài của trục.
   Kỳ báo cáo: năm 2021–2025 (khóa XVI); riêng HĐND xã, phường và Theo dõi nhiệm vụ theo quý.
   Số công bố: năm 2025 HĐND Thành phố tổ chức 1 kỳ họp thường lệ và 6 kỳ họp chuyên đề, ban hành 108 nghị quyết trước kỳ họp
   thường lệ cuối năm (kỳ họp thứ 28, 26–27/11/2025, dự kiến thông qua khoảng 50 nghị quyết) → cả năm 8 kỳ họp, khoảng 158 nghị quyết.
   Số còn lại là số ước tính theo quy mô hoạt động của HĐND Thành phố. */

/* ---------- HĐND · Theo dõi nhiệm vụ (số trạng thái nhiệm vụ như VPTU_DATA, vptu-tracking.js) ---------- */
ctmTaskSpec({ id: 'hdnd-nhiem-vu', role: 'HDND', name: 'HĐND · Theo dõi nhiệm vụ', short: 'Theo dõi nhiệm vụ', org: 'HĐND Thành phố Hà Nội', khoi: [{ id: 'hd', label: 'HĐND Thành phố', now: [2, 6, 0, 15, 2, 3] }] });

/* ---------- 5 Ban của HĐND Thành phố: cùng một khuôn ----------
   o: lv = [[lĩnh vực giám sát, số cuộc năm 2025]…] (tên lĩnh vực theo danh mục cũ của từng Ban), ks khảo sát, kng kiến nghị sau
   giám sát, knR % đã thực hiện, tt báo cáo thẩm tra, nq nghị quyết thuộc lĩnh vực (5 Ban cộng lại = số nghị quyết cả năm), ct kiến nghị
   cử tri thuộc lĩnh vực, ctR % đã giải quyết. Các năm trước suy ngược theo mức tăng hằng năm. */
const HDND_NQ_NAM = [158, 121, 104, 96, 88];   // nghị quyết HĐND Thành phố các năm 2025 → 2021 (2025: 108 + khoảng 50 ở kỳ họp cuối năm)
function hdndBan(id, name, short, o) {
  const m = {};
  o.lv.forEach((x, i) => { m['lv' + i] = [x[0], 'cuộc', 0, x[1], 7]; });
  m.gs = { l: 'Cuộc giám sát chuyên đề', short: 'Giám sát chuyên đề', u: 'cuộc', sum: o.lv.map((x, i) => 'lv' + i) };
  m.ks = ['Cuộc khảo sát', 'cuộc', 0, o.ks, 6, '', 'Khảo sát'];
  m.kng = ['Kiến nghị sau giám sát, khảo sát', 'kiến nghị', 0, o.kng, 5, 'n', 'Kiến nghị sau giám sát'];
  m.knR = ['Kiến nghị sau giám sát đã được thực hiện', '%', 1, o.knR, 1.2, '', 'Đã được thực hiện'];
  m.knTh = { l: 'Kiến nghị sau giám sát đã thực hiện', short: 'Đã thực hiện', u: 'kiến nghị', f: (D) => D.kng * D.knR / 100 };
  m.tt = ['Báo cáo thẩm tra trình kỳ họp', 'báo cáo', 0, o.tt, 8, '', 'Báo cáo thẩm tra'];
  m.nq = ['Nghị quyết thuộc lĩnh vực được thông qua', 'nghị quyết', 0, HDND_NQ_NAM.map((v) => Math.round(v * o.nqShare)), 0, '', 'Nghị quyết thuộc lĩnh vực'];
  m.ct = ['Kiến nghị cử tri thuộc lĩnh vực', 'kiến nghị', 0, o.ct, -1.5, 'n', 'Kiến nghị cử tri'];
  m.ctR = ['Kiến nghị cử tri đã giải quyết', '%', 1, o.ctR, 1.5, '', 'Đã giải quyết'];
  m.ctGq = { l: 'Kiến nghị cử tri đã giải quyết', short: 'Đã giải quyết', u: 'kiến nghị', f: (D) => D.ct * D.ctR / 100 };
  return ctmMake({
    id: id, role: 'HDND', per: 'nam', name: name, short: short, org: 'HĐND Thành phố Hà Nội', m: m,
    kpis: [['gs', 'trong năm'], ['ks', 'trong năm'], ['kng', 'sau giám sát, khảo sát'], ['knR', 'trên kiến nghị sau giám sát'], ['tt', 'trình kỳ họp HĐND'], ['nq', 'thuộc lĩnh vực của Ban'], ['ct', 'thuộc lĩnh vực'], ['ctR', 'trên kiến nghị cử tri']],
    card: ['gs', 'tt', 'nq', 'ctR'],
    groups: [
      { id: 'gs', label: 'Giám sát, khảo sát', note: 'Giám sát chuyên đề, khảo sát theo lĩnh vực của Ban', lines: ['gs', 'ks'], parts: ['gs', o.lv.map((x, i) => 'lv' + i), 'Giám sát chuyên đề theo lĩnh vực'] },
      { id: 'kn', label: 'Kiến nghị sau giám sát', note: 'Kiến nghị của Ban sau giám sát, khảo sát và kết quả thực hiện', lines: ['kng', 'knTh', 'knR'] },
      { id: 'tt', label: 'Thẩm tra', note: 'Thẩm tra tờ trình, dự thảo nghị quyết trình kỳ họp', lines: ['tt', 'nq'] },
      { id: 'ct', label: 'Kiến nghị cử tri', note: 'Kiến nghị cử tri thuộc lĩnh vực của Ban và kết quả giải quyết', lines: ['ct', 'ctGq', 'ctR'], top: 'ct' }
    ],
    xa: [
      /* kiến nghị cử tri: trung tính, không xếp tốt/kém (quy tắc H18, chốt 12/10/2026) */
      { id: 'ct', l: 'Kiến nghị cử tri thuộc lĩnh vực', u: 'kiến nghị', from: 'ct', w: 'pop', better: 'none' },
      { id: 'ctpc', l: 'Kiến nghị cử tri trên 100.000 dân', u: 'kiến nghị', d: 1, per: ['ct', 'ds', 100000], better: 'none' },
      { id: 'ctR', l: 'Kiến nghị cử tri đã giải quyết', u: '%', d: 1, rate: 'ctR', spread: 10 }
    ],
    note: 'kỳ báo cáo là năm, so với năm liền trước. Số kiến nghị tăng hay giảm để màu trung tính; tỷ lệ đã thực hiện, đã giải quyết tăng là màu xanh. Năm 2025 HĐND Thành phố họp 8 kỳ (2 kỳ thường lệ, 6 kỳ chuyên đề).'
  });
}
hdndBan('hdnd-do-thi', 'Ban Đô thị', 'Ban Đô thị', { lv: [['Quy hoạch xây dựng', 8], ['Hạ tầng kỹ thuật', 6], ['Trật tự xây dựng', 10]], ks: 11, kng: 86, knR: 78.4, tt: 18, nqShare: 0.215, ct: 412, ctR: 86.4 });
hdndBan('hdnd-khcn-mt', 'Ban Khoa học Công nghệ và Môi trường', 'Ban KHCN và Môi trường', { lv: [['Chuyển đổi số', 7], ['Bảo vệ môi trường', 9], ['Ứng dụng khoa học công nghệ', 5]], ks: 8, kng: 64, knR: 76.2, tt: 12, nqShare: 0.108, ct: 286, ctR: 84.7 });
hdndBan('hdnd-kt-ns', 'Ban Kinh tế - Ngân sách', 'Ban Kinh tế - Ngân sách', { lv: [['Đầu tư công', 9], ['Thu chi ngân sách', 7], ['Doanh nghiệp nhà nước', 4]], ks: 10, kng: 92, knR: 81.3, tt: 24, nqShare: 0.329, ct: 318, ctR: 88.1 });
hdndBan('hdnd-phap-che', 'Ban Pháp chế', 'Ban Pháp chế', { lv: [['Thi hành pháp luật', 8], ['Cải cách tư pháp', 5], ['Phòng, chống tham nhũng', 6]], ks: 7, kng: 58, knR: 79.6, tt: 14, nqShare: 0.152, ct: 264, ctR: 87.2 });
hdndBan('hdnd-vh-xh', 'Ban Văn hóa - Xã hội', 'Ban Văn hóa - Xã hội', { lv: [['Giáo dục - Đào tạo', 9], ['Y tế', 7], ['Lao động - Xã hội', 6], ['Văn hóa - Thể thao', 5]], ks: 12, kng: 104, knR: 77.9, tt: 16, nqShare: 0.196, ct: 486, ctR: 85.3 });

/* ---------- Văn phòng Đoàn ĐBQH và HĐND Thành phố: kỳ họp, nghị quyết, văn bản ---------- */
ctmMake({
  id: 'hdnd-vp-doan-dbqh', role: 'HDND', per: 'nam', name: 'Văn phòng Đoàn ĐBQH - HĐND Thành phố', short: 'Văn phòng Đoàn ĐBQH - HĐND', org: 'HĐND Thành phố Hà Nội',
  m: {
    khTl: ['Kỳ họp thường lệ', 'kỳ họp', 0, [2, 2, 2, 2, 2], 0, 'n'],
    khCd: ['Kỳ họp chuyên đề', 'kỳ họp', 0, [6, 4, 3, 3, 2], 0, 'n'],
    kh: { l: 'Kỳ họp HĐND Thành phố được phục vụ', short: 'Kỳ họp HĐND Thành phố', u: 'kỳ họp', neutral: true, sum: ['khTl', 'khCd'] },
    nq: ['Nghị quyết HĐND Thành phố ban hành', 'nghị quyết', 0, HDND_NQ_NAM, 0, 'n', 'Nghị quyết ban hành'],
    cv: ['Lượt chất vấn, giải trình tại kỳ họp', 'lượt', 0, [38, 34, 31, 29, 22], 0, '', 'Chất vấn, giải trình'],
    ph: ['Phiên họp Thường trực HĐND Thành phố', 'phiên họp', 0, [46, 41, 38, 36, 34], 0, 'n', 'Phiên họp Thường trực'],
    vbDen: ['Văn bản đến', 'văn bản', 0, 6480, 6, 'n'],
    vbDi: ['Văn bản đi', 'văn bản', 0, 4920, 6, 'n'],
    vbS: ['Văn bản xử lý trên môi trường mạng', '%', 1, 97.6, 2.5]
  },
  kpis: [['kh', 'thường lệ và chuyên đề'], ['khCd', 'trong năm'], ['nq', 'trong năm'], ['cv', 'tại các kỳ họp'], ['ph', 'trong năm'], ['vbDen', 'trong năm'], ['vbDi', 'trong năm'], ['vbS', 'trên văn bản đi, đến']],
  card: ['kh', 'nq', 'cv', 'vbS'],
  groups: [
    { id: 'kh', label: 'Kỳ họp HĐND Thành phố', note: 'Kỳ họp thường lệ, chuyên đề và nghị quyết ban hành', lines: ['kh', 'khTl', 'khCd', 'nq'], parts: ['kh', ['khTl', 'khCd'], 'Kỳ họp theo loại'], cols2: null,
      hint: () => 'Năm 2025: 2 kỳ họp thường lệ, 6 kỳ họp chuyên đề; 108 nghị quyết trước kỳ họp cuối năm.' },
    { id: 'tt', label: 'Thường trực, chất vấn', note: 'Phiên họp Thường trực HĐND; chất vấn, giải trình tại kỳ họp', lines: ['ph', 'cv'] },
    { id: 'vb', label: 'Văn bản', note: 'Văn bản đến, đi và xử lý trên môi trường mạng', lines: ['vbDen', 'vbDi', 'vbS'] }
  ],
  note: 'kỳ báo cáo là năm, so với năm liền trước. Số kỳ họp, nghị quyết, văn bản tăng hay giảm để màu trung tính.'
});

/* ---------- Đoàn Đại biểu Quốc hội Thành phố ---------- */
ctmMake({
  id: 'hdnd-doan-dbqh', role: 'HDND', per: 'nam', name: 'Đoàn Đại biểu Quốc hội Thành phố', short: 'Đoàn ĐBQH', org: 'Đoàn ĐBQH Thành phố Hà Nội',
  m: {
    txTr: ['Hội nghị tiếp xúc cử tri trước kỳ họp', 'hội nghị', 0, [26, 24, 22, 22, 24], 0, '', 'Trước kỳ họp Quốc hội'],
    txSau: ['Hội nghị tiếp xúc cử tri sau kỳ họp', 'hội nghị', 0, [24, 22, 22, 20, 22], 0, '', 'Sau kỳ họp Quốc hội'],
    txCd: ['Hội nghị tiếp xúc cử tri chuyên đề, theo nhóm', 'hội nghị', 0, [14, 12, 12, 12, 16], 0, '', 'Chuyên đề, theo nhóm'],
    tx: { l: 'Hội nghị tiếp xúc cử tri', short: 'Tiếp xúc cử tri', u: 'hội nghị', sum: ['txTr', 'txSau', 'txCd'] },
    kn: ['Ý kiến, kiến nghị cử tri tổng hợp gửi Quốc hội', 'kiến nghị', 0, [486, 452, 438, 421, 512], 0, 'n', 'Kiến nghị gửi Quốc hội'],
    knR: ['Kiến nghị đã có trả lời', '%', 1, [82.7, 88.5, 91.3, 93.1, 94.2]],
    knTl: { l: 'Kiến nghị đã có trả lời', short: 'Đã có trả lời', u: 'kiến nghị', f: (D) => D.kn * D.knR / 100 },
    gy: ['Ý kiến góp ý dự án luật', 'ý kiến', 0, [1260, 940, 880, 820, 760], 0, '', 'Góp ý dự án luật'],
    gs: ['Cuộc giám sát, khảo sát của Đoàn', 'cuộc', 0, [14, 12, 11, 10, 8], 0, '', 'Giám sát, khảo sát'],
    dt: ['Đơn thư công dân Đoàn tiếp nhận', 'đơn', 0, 2160, 3, 'n', 'Đơn thư tiếp nhận']
  },
  kpis: [['tx', 'trong năm'], ['txTr', 'trước các kỳ họp'], ['kn', 'trong năm'], ['knR', 'trên kiến nghị đã gửi'], ['gy', 'trong năm'], ['gs', 'trong năm'], ['dt', 'trong năm'], ['txSau', 'sau các kỳ họp']],
  card: ['tx', 'kn', 'knR', 'gy'],
  groups: [
    { id: 'tx', label: 'Tiếp xúc cử tri', note: 'Tiếp xúc cử tri trước, sau kỳ họp Quốc hội và theo chuyên đề', lines: ['tx', 'txTr', 'txSau', 'txCd'], parts: ['tx', ['txTr', 'txSau', 'txCd'], 'Hội nghị tiếp xúc cử tri theo hình thức'] },
    { id: 'kn', label: 'Kiến nghị cử tri', note: 'Ý kiến, kiến nghị cử tri tổng hợp gửi Quốc hội và kết quả trả lời', lines: ['kn', 'knTl', 'knR'], top: 'kn',
      hint: () => 'Kiến nghị của năm gần nhất còn đang được các cơ quan trả lời nên tỷ lệ thấp hơn các năm trước.' },
    { id: 'hd', label: 'Góp ý luật, giám sát', note: 'Góp ý dự án luật; giám sát, khảo sát; đơn thư công dân', lines: ['gy', 'gs', 'dt'] }
  ],
  xa: [
    { id: 'kn', l: 'Kiến nghị cử tri gửi Quốc hội', u: 'kiến nghị', from: 'kn', w: 'pop', better: 'none' },
    { id: 'knpc', l: 'Kiến nghị trên 100.000 dân', u: 'kiến nghị', d: 1, per: ['kn', 'ds', 100000], better: 'none' }
  ],
  note: 'kỳ báo cáo là năm, so với năm liền trước. Năm 2021 là năm bầu cử, nhiều hội nghị tiếp xúc cử tri và kiến nghị hơn các năm giữa nhiệm kỳ.'
});

/* ---------- HĐND xã, phường (cơ cấu 126 đơn vị từ 01/7/2025 nên theo quý, để trống 2 quý đầu năm 2025) ---------- */
ctmMake({
  id: 'hdnd-xa-phuong', role: 'HDND', per: 'quy', name: 'HĐND Xã, Phường', short: 'HĐND Xã, Phường', org: 'HĐND Thành phố Hà Nội',
  m: {
    hd: ['HĐND xã, phường', 'đơn vị', 0, [126, 126, 126, 126, null, null], 0, 'n'],
    kh: ['Kỳ họp HĐND cấp xã tổ chức', 'kỳ họp', 0, [148, 131, 262, 198, null, null], 0, 'n', 'Kỳ họp tổ chức'],
    khR: ['Kỳ họp tổ chức đúng kế hoạch', '%', 1, [96.8, 95.2, 93.7, 94.0, null, null]],
    nq: ['Nghị quyết HĐND cấp xã ban hành', 'nghị quyết', 0, [612, 540, 1380, 946, null, null], 0, 'n', 'Nghị quyết ban hành'],
    gs: ['Cuộc giám sát của HĐND cấp xã', 'cuộc', 0, [286, 214, 342, 168, null, null], 0, '', 'Cuộc giám sát'],
    ct: ['Kiến nghị cử tri tiếp nhận', 'kiến nghị', 0, [2740, 2210, 3460, 2980, null, null], 0, 'n', 'Kiến nghị cử tri'],
    ctR: ['Kiến nghị cử tri đã giải quyết', '%', 1, [84.6, 82.1, 79.8, 74.6, null, null]],
    ctGq: { l: 'Kiến nghị cử tri đã giải quyết', short: 'Đã giải quyết', u: 'kiến nghị', f: (D) => (D.ct == null ? null : D.ct * D.ctR / 100) }
  },
  kpis: [['hd', 'HĐND cấp xã'], ['kh', 'trong quý'], ['khR', 'trên kỳ họp theo kế hoạch'], ['nq', 'trong quý'], ['gs', 'trong quý'], ['ct', 'trong quý'], ['ctGq', 'trong quý'], ['ctR', 'trên kiến nghị tiếp nhận']],
  card: ['kh', 'nq', 'gs', 'ctR'],
  groups: [
    { id: 'kh', label: 'Kỳ họp, nghị quyết', note: 'Kỳ họp HĐND cấp xã và nghị quyết ban hành', lines: ['kh', 'nq', 'khR'], top: 'nq' },
    { id: 'gs', label: 'Giám sát', note: 'Giám sát của HĐND cấp xã', lines: ['gs'] },
    { id: 'ct', label: 'Kiến nghị cử tri', note: 'Kiến nghị cử tri tại xã, phường và kết quả giải quyết', lines: ['ct', 'ctGq', 'ctR'], top: 'ct' }
  ],
  xa: [
    { id: 'kh', l: 'Kỳ họp tổ chức', u: 'kỳ họp', from: 'kh', w: 'const' },
    { id: 'nq', l: 'Nghị quyết ban hành', u: 'nghị quyết', from: 'nq', w: 'pop' },
    { id: 'gs', l: 'Cuộc giám sát', u: 'cuộc', from: 'gs', w: 'const' },
    { id: 'ct', l: 'Kiến nghị cử tri tiếp nhận', u: 'kiến nghị', from: 'ct', w: 'pop', better: 'none' },
    { id: 'ctR', l: 'Kiến nghị cử tri đã giải quyết', u: '%', d: 1, rate: 'ctR', spread: 12 }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước. Chính quyền địa phương hai cấp vận hành từ 01/7/2025 nên chỉ có số từ Quý 3/2025.'
});

/* ---------- Tổ chuyên gia tư vấn thường trực HĐND Thành phố ---------- */
ctmMake({
  id: 'hdnd-to-tuvan', role: 'HDND', per: 'nam', name: 'Tổ chuyên gia tư vấn thường trực HĐND TP', short: 'Tổ chuyên gia tư vấn', org: 'HĐND Thành phố Hà Nội',
  m: {
    tv: ['Lượt tư vấn, góp ý dự thảo nghị quyết', 'lượt', 0, [86, 64, 58, 52, 40], 0, '', 'Tư vấn, góp ý dự thảo nghị quyết'],
    cd: ['Chuyên đề giám sát có chuyên gia tham gia', 'chuyên đề', 0, [14, 11, 10, 9, 7], 0, '', 'Chuyên đề giám sát tham gia'],
    bc: ['Báo cáo chuyên đề gửi Thường trực HĐND', 'báo cáo', 0, [22, 17, 15, 14, 10], 0, '', 'Báo cáo chuyên đề'],
    tiep: ['Ý kiến tư vấn được tiếp thu', '%', 1, [88.4, 86.9, 85.1, 84.0, 81.6]],
    cg: ['Chuyên gia trong Tổ', 'người', 0, [15, 15, 13, 13, 12], 0, 'n']
  },
  kpis: [['tv', 'trong năm'], ['cd', 'trong năm'], ['bc', 'trong năm'], ['tiep', 'trên ý kiến tư vấn'], ['cg', 'chuyên gia']],
  card: ['tv', 'cd', 'tiep'],
  groups: [
    { id: 'tv', label: 'Tư vấn dự thảo nghị quyết', note: 'Tư vấn, góp ý dự thảo nghị quyết và mức tiếp thu', lines: ['tv', 'tiep'] },
    { id: 'gs', label: 'Giám sát chuyên đề', note: 'Tham gia giám sát chuyên đề, báo cáo chuyên đề', lines: ['bc', 'cd'] }
  ],
  note: 'kỳ báo cáo là năm, so với năm liền trước.'
});

/* ---------- Màn ngoài trục HĐND cấp Thành phố ---------- */
ctmRegisterOverview({
  id: 'hdnd-tp', roles: ['HDND'], level: 'city', ax: 'HĐND TP', unitWord: 'đơn vị',
  eyebrow: 'Tổng quan · HĐND Thành phố Hà Nội',
  title: (n) => 'Số liệu then chốt của ' + n + ' ban, đơn vị',
  short: { 'hdnd-nhiem-vu': 'Theo dõi nhiệm vụ', 'hdnd-vp-doan-dbqh': 'Văn phòng Đoàn ĐBQH - HĐND', 'hdnd-to-tuvan': 'Tổ chuyên gia tư vấn', 'hdnd-doan-dbqh': 'Đoàn ĐBQH', 'hdnd-khcn-mt': 'Ban KHCN và Môi trường' },
  kpis: [
    { cat: 'hdnd-vp-doan-dbqh', m: 'kh', target: 'g:kh' }, { cat: 'hdnd-vp-doan-dbqh', m: 'nq', target: 'g:kh' },
    { cat: 'hdnd-kt-ns', m: 'tt', target: 'g:tt' }, { cat: 'hdnd-vh-xh', m: 'gs', target: 'g:gs' },
    { cat: 'hdnd-doan-dbqh', m: 'tx', target: 'g:tx' }, { cat: 'hdnd-doan-dbqh', m: 'kn', target: 'g:kn' },
    { cat: 'hdnd-xa-phuong', m: 'kh', target: 'g:kh' }, { cat: 'hdnd-xa-phuong', m: 'ctR', target: 'g:ct' }
  ],
  groups: [
    { id: 'ban', label: 'Các Ban của HĐND', ids: ['hdnd-do-thi', 'hdnd-khcn-mt', 'hdnd-kt-ns', 'hdnd-phap-che', 'hdnd-vh-xh'] },
    { id: 'dbqh', label: 'Đoàn ĐBQH, Văn phòng, Tổ tư vấn', ids: ['hdnd-doan-dbqh', 'hdnd-vp-doan-dbqh', 'hdnd-to-tuvan'] },
    { id: 'cs', label: 'Cơ sở và nhiệm vụ', ids: ['hdnd-xa-phuong', 'hdnd-nhiem-vu'] }
  ]
});

/* Kiểu dữ liệu (quy tắc H9): số tại thời điểm so với quý liền trước; còn lại là số phát sinh, so cùng kỳ năm trước */
ctmFlag('hdnd-xa-phuong', 'td', ['hd']);