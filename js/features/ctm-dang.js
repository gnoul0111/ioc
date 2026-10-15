/* ============================== THÀNH ỦY HÀ NỘI — CHỈ TIÊU KHUÔN MỚI ==============================
   Khai báo cho ctm-engine.js: 5 đơn vị của trục Thành ủy cấp Thành phố + màn ngoài của trục.
   Kỳ báo cáo: quý (Quý 1/2025 – Quý 2/2026). Số công bố công khai được giữ đúng và ghi chú "số công bố"; số còn lại là
   số ước tính theo quy mô Đảng bộ Thành phố, chờ thay bằng số do các ban cung cấp.
   Lưu ý sắp xếp đơn vị hành chính từ 01/7/2025: các chỉ tiêu về cơ cấu tổ chức đảng (đảng bộ trực thuộc, đảng bộ xã/phường,
   tổ chức cơ sở đảng) để trống ở Quý 1, Quý 2/2025 vì không so sánh được với cơ cấu mới. */

/* ---------- Văn phòng Thành ủy · Theo dõi nhiệm vụ: số trạng thái nhiệm vụ của 4 khối (như VPTU_DATA, vptu-tracking.js) ---------- */
ctmTaskSpec({
  id: 'dang-vptu', role: 'DANG', name: 'Văn phòng Thành ủy · Theo dõi nhiệm vụ', short: 'VPTU · Theo dõi nhiệm vụ', org: 'Thành ủy Hà Nội',
  khoi: [
    { id: 'tw', label: 'Trung ương giao Thành ủy', now: [36, 144, 2, 175, 40, 6] },
    { id: 'ub', label: 'UBND Thành phố', now: [53, 214, 0, 548, 78, 88] },
    { id: 'hd', label: 'HĐND Thành phố', now: [2, 6, 0, 15, 2, 3] },
    { id: 'mt', label: 'Ủy ban MTTQ Việt Nam Thành phố', now: [4, 15, 0, 5, 3, 3] }
  ]
});

/* ---------- Ban Tổ chức Thành ủy ----------
   Số công bố (Đại hội XVIII, 10/2025): 136 đảng bộ trực thuộc Thành ủy; khoảng 2.130 tổ chức cơ sở đảng; gần 50 vạn đảng viên;
   chỉ tiêu nhiệm kỳ 2025–2030: kết nạp tối thiểu 11.000 đảng viên mỗi năm, trên 90% đảng viên, tổ chức đảng hoàn thành tốt nhiệm vụ. */
ctmMake({
  id: 'dang-to-chuc', role: 'DANG', per: 'quy', name: 'Ban Tổ chức Thành ủy', short: 'Ban Tổ chức', org: 'Thành ủy Hà Nội',
  m: {
    dv: ['Tổng số đảng viên', 'đảng viên', 0, 498600, 0.35, '', 'Tổng số đảng viên'],
    dvDb: ['Đảng viên dự bị', 'đảng viên', 0, 21400, 1.2, 'n', 'Dự bị'],
    dvCt: { l: 'Đảng viên chính thức', short: 'Chính thức', u: 'đảng viên', f: (D) => D.dv - D.dvDb },
    dvNu: ['Đảng viên nữ', '%', 1, 40.6, 0.1],
    dvTre: ['Đảng viên dưới 35 tuổi', '%', 1, 18.4, 0.15],
    dvDh: ['Đảng viên có trình độ đại học trở lên', '%', 1, 72.8, 0.3, '', 'Trình độ đại học trở lên'],
    dbtt: ['Đảng bộ trực thuộc Thành ủy', 'đảng bộ', 0, [136, 136, 136, 136, null, null], 0, 'n'],
    dbXa: ['Đảng bộ xã, phường', 'đảng bộ', 0, [126, 126, 126, 126, null, null], 0, 'n'],
    tcco: ['Tổ chức cơ sở đảng', 'tổ chức', 0, [2124, 2127, 2130, 2138, null, null], 0, 'n'],
    dbcs: ['Đảng bộ cơ sở', 'tổ chức', 0, [1041, 1043, 1046, 1050, null, null], 0, 'n'],
    cbcs: { l: 'Chi bộ cơ sở', u: 'tổ chức', neutral: true, f: (D) => (D.tcco == null ? null : D.tcco - D.dbcs) },
    cbtt: ['Chi bộ trực thuộc đảng ủy cơ sở', 'chi bộ', 0, 21600, 0.2, 'n'],
    knm: ['Kết nạp đảng viên mới', 'đảng viên', 0, [2960, 2140, 3380, 2710, 2890, 2050], 0, '', 'Kết nạp mới'],
    den: ['Chuyển sinh hoạt đảng đến', 'đảng viên', 0, 1940, 2, 'n', 'Chuyển đến'],
    di: ['Chuyển sinh hoạt đảng đi', 'đảng viên', 0, 1760, 2, 'n', 'Chuyển đi'],
    tt: ['Từ trần, xóa tên, khai trừ', 'đảng viên', 0, 1210, 1, 'n', 'Từ trần, xóa tên, khai trừ'],
    bd: { l: 'Biến động thuần trong quý', short: 'Tăng thuần', u: 'đảng viên', neutral: true, f: (D) => D.knm + D.den - D.di - D.tt },
    ht: ['Đảng viên hoàn thành tốt nhiệm vụ trở lên (kỳ đánh giá gần nhất)', '%', 1, [92.4, 92.4, 91.6, 91.6, 91.6, 91.6], 0, '', 'Đảng viên hoàn thành tốt trở lên'],
    tcHt: ['Tổ chức đảng hoàn thành tốt nhiệm vụ trở lên', '%', 1, [90.8, 90.8, 89.9, 89.9, 89.9, 89.9], 0, '', 'Tổ chức đảng hoàn thành tốt trở lên'],
    xs: ['Đảng viên hoàn thành xuất sắc nhiệm vụ', '%', 1, [18.6, 18.6, 17.9, 17.9, 17.9, 17.9]],
    khong: ['Đảng viên không hoàn thành nhiệm vụ', '%', 1, [0.4, 0.4, 0.5, 0.5, 0.5, 0.5], 0, 'i'],
    cb: ['Cán bộ, công chức, viên chức khối Đảng, MTTQ', 'người', 0, 4505, 0.3, 'n', 'Cán bộ, công chức khối Đảng, MTTQ'],
    cbBtv: ['Cán bộ diện Ban Thường vụ Thành ủy quản lý', 'người', 0, 680, 0.5, 'n', 'Diện Ban Thường vụ quản lý'],
    qh: ['Cán bộ trong quy hoạch', 'người', 0, 1240, 0.8, '', 'Trong quy hoạch'],
    dvXa: { l: 'Đảng viên sinh hoạt tại 126 đảng bộ xã, phường', u: 'đảng viên', f: (D) => D.dv * 0.61 },
    knmXa: { l: 'Kết nạp mới tại đảng bộ xã, phường', u: 'đảng viên', f: (D) => D.knm * 0.52 }
  },
  kpis: [['dv', 'đảng viên, cuối quý'], ['knm', 'đảng viên trong quý'], ['bd', 'kết nạp + chuyển đến − chuyển đi − từ trần'], ['dbtt', '126 đảng bộ xã, phường'], ['tcco', 'đảng bộ cơ sở và chi bộ cơ sở'], ['dvTre', 'trên tổng số đảng viên'], ['ht', 'kỳ đánh giá gần nhất'], ['cbBtv', 'cán bộ']],
  card: ['dv', 'knm', 'tcco', 'ht'],
  groups: [
    { id: 'dv', label: 'Đảng viên', note: 'Số lượng, cơ cấu đảng viên cuối quý', lines: ['dv', 'dvCt', 'dvDb', 'dvNu', 'dvTre', 'dvDh'], parts: ['dv', ['dvCt', 'dvDb'], 'Đảng viên chính thức, dự bị'] },
    { id: 'tc', label: 'Tổ chức đảng', note: 'Đảng bộ trực thuộc, tổ chức cơ sở đảng (cơ cấu mới từ 01/7/2025)', lines: ['dbtt', 'dbXa', 'tcco', 'cbtt'], cols: 'tcco', parts: ['tcco', ['dbcs', 'cbcs'], 'Tổ chức cơ sở đảng theo loại hình'] },
    { id: 'bd', label: 'Kết nạp và biến động', note: 'Kết nạp đảng viên mới, chuyển sinh hoạt, từ trần, xóa tên trong quý', lines: ['knm', 'den', 'di', 'tt', 'bd'], table: [null, ['knm', 'den', 'di', 'tt'], 'Biến động đảng viên trong quý', 'Nội dung'], top: 'knm',
      hint: () => 'Chỉ tiêu nhiệm kỳ 2025–2030: kết nạp tối thiểu 11.000 đảng viên mỗi năm.' },
    { id: 'dg', label: 'Đánh giá, xếp loại', note: 'Kết quả đánh giá chất lượng kỳ gần nhất', lines: ['ht', 'tcHt', 'xs', 'khong'], hint: () => 'Chỉ tiêu nhiệm kỳ 2025–2030: trên 90% đảng viên, tổ chức đảng hoàn thành tốt nhiệm vụ trở lên mỗi năm.' },
    { id: 'cb', label: 'Cán bộ', note: 'Cán bộ, công chức, viên chức khối Đảng, MTTQ', lines: ['cb', 'cbBtv', 'qh'] }
  ],
  xa: [
    { id: 'dv', l: 'Đảng viên sinh hoạt tại đảng bộ xã, phường', u: 'đảng viên', from: 'dvXa', w: 'pop' },
    { id: 'dvpc', l: 'Đảng viên trên 1.000 dân', u: 'đảng viên', d: 1, per: ['dv', 'ds', 1000] },
    { id: 'knm', l: 'Kết nạp đảng viên mới', u: 'đảng viên', from: 'knmXa', w: 'pop' },
    { id: 'ht', l: 'Đảng viên hoàn thành tốt nhiệm vụ trở lên', u: '%', d: 1, rate: 'ht', spread: 5 }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước; số đảng viên, tổ chức đảng là số cuối quý. Đánh giá, xếp loại là kết quả kỳ đánh giá năm gần nhất. Cơ cấu tổ chức đảng thay đổi từ 01/7/2025 (126 đảng bộ xã, phường) nên không so với các quý trước đó.'
});

/* ---------- Ủy ban Kiểm tra Thành ủy ----------
   Số công bố 6 tháng đầu năm 2025 (Quý 1 + Quý 2/2025): cấp ủy kiểm tra 296 lượt tổ chức đảng, 284 đảng viên; giám sát 162 lượt tổ chức
   đảng, 148 đảng viên; ủy ban kiểm tra các cấp kiểm tra khi có dấu hiệu vi phạm 15 tổ chức đảng, 53 đảng viên. Các quý khác: ước tính. */
ctmMake({
  id: 'dang-ubkt', role: 'DANG', per: 'quy', name: 'Ủy ban Kiểm tra Thành ủy', short: 'Ủy ban Kiểm tra', org: 'Thành ủy Hà Nội',
  m: {
    ktDv: ['Đảng viên được cấp ủy kiểm tra', 'đảng viên', 0, [170, 129, 203, 176, 163, 121], 0, '', 'Cấp ủy kiểm tra'],
    ktTc: ['Lượt tổ chức đảng được cấp ủy kiểm tra', 'lượt tổ chức', 0, [176, 136, 214, 182, 168, 128], 0, '', 'Tổ chức đảng được kiểm tra'],
    gsDv: ['Đảng viên được giám sát', 'đảng viên', 0, [88, 70, 107, 92, 84, 64], 0, '', 'Được giám sát'],
    gsTc: ['Lượt tổ chức đảng được giám sát', 'lượt tổ chức', 0, [97, 76, 118, 101, 92, 70], 0, '', 'Tổ chức đảng được giám sát'],
    dhDv: ['Đảng viên được kiểm tra khi có dấu hiệu vi phạm', 'đảng viên', 0, [30, 24, 34, 29, 31, 22], 0, 'n', 'Kiểm tra khi có dấu hiệu vi phạm'],
    dhTc: ['Tổ chức đảng được kiểm tra khi có dấu hiệu vi phạm', 'tổ chức', 0, [9, 7, 10, 8, 9, 6], 0, 'n', 'Tổ chức đảng có dấu hiệu vi phạm'],
    vpDv: ['Đảng viên kết luận có vi phạm', 'đảng viên', 0, [24, 19, 27, 23, 25, 17], 0, 'i', 'Kết luận có vi phạm'],
    klKt: ['Khiển trách', 'đảng viên', 0, [19, 15, 26, 23, 20, 16], 0, 'i'],
    klCc: ['Cảnh cáo', 'đảng viên', 0, [12, 10, 17, 14, 13, 10], 0, 'i'],
    klCh: ['Cách chức', 'đảng viên', 0, [3, 2, 4, 3, 3, 2], 0, 'i'],
    klKtr: ['Khai trừ', 'đảng viên', 0, [4, 3, 5, 4, 4, 3], 0, 'i'],
    klDv: { l: 'Đảng viên bị thi hành kỷ luật', short: 'Đảng viên bị kỷ luật', u: 'đảng viên', inv: true, sum: ['klKt', 'klCc', 'klCh', 'klKtr'] },
    klTc: ['Tổ chức đảng bị thi hành kỷ luật', 'tổ chức', 0, [2, 1, 4, 3, 2, 1], 0, 'i'],
    tcd: ['Tổ chức đảng được kiểm tra tài chính đảng', 'tổ chức', 0, [64, 48, 82, 70, 66, 51], 0, '', 'Kiểm tra tài chính đảng'],
    dp: ['Đảng phí thu nộp', 'tỷ đồng', 1, [58.4, 56.9, 61.2, 57.8, 56.1, 54.7], 0, 'n'],
    ktgsXa: { l: 'Đảng viên được kiểm tra, giám sát tại đảng bộ xã, phường', u: 'đảng viên', f: (D) => (D.ktDv + D.gsDv) * 0.58 },
    klXa: { l: 'Đảng viên bị kỷ luật tại đảng bộ xã, phường', u: 'đảng viên', f: (D) => D.klDv * 0.6 }
  },
  kpis: [['ktTc', 'cấp ủy kiểm tra trong quý'], ['ktDv', 'cấp ủy kiểm tra trong quý'], ['gsTc', 'giám sát trong quý'], ['gsDv', 'giám sát trong quý'], ['dhDv', 'ủy ban kiểm tra các cấp'], ['vpDv', 'qua kiểm tra trong quý'], ['klDv', 'khiển trách, cảnh cáo, cách chức, khai trừ'], ['klTc', 'trong quý']],
  card: ['ktDv', 'gsDv', 'dhDv', 'klDv'],
  groups: [
    { id: 'kt', label: 'Kiểm tra', note: 'Kiểm tra của cấp ủy và ủy ban kiểm tra các cấp', lines: ['ktDv', 'dhDv', 'vpDv', 'ktTc', 'dhTc'], top: 'kt',
      hint: () => '6 tháng đầu năm 2025: cấp ủy các cấp kiểm tra 296 lượt tổ chức đảng, 284 đảng viên; ủy ban kiểm tra các cấp kiểm tra khi có dấu hiệu vi phạm 15 tổ chức đảng, 53 đảng viên.' },
    { id: 'gs', label: 'Giám sát', note: 'Giám sát thường xuyên và chuyên đề', lines: ['gsDv', 'gsTc'], hint: () => '6 tháng đầu năm 2025: giám sát 162 lượt tổ chức đảng, 148 đảng viên.' },
    { id: 'kl', label: 'Thi hành kỷ luật', note: 'Kỷ luật đảng viên, tổ chức đảng theo hình thức', lines: ['klDv', 'klTc', 'klKt', 'klCc'], parts: ['klDv', ['klKt', 'klCc', 'klCh', 'klKtr'], 'Đảng viên bị kỷ luật theo hình thức'] },
    { id: 'tc', label: 'Tài chính đảng', note: 'Kiểm tra tài chính đảng, thu nộp đảng phí', lines: ['tcd', 'dp'] }
  ],
  xa: [
    { id: 'kt', l: 'Đảng viên được kiểm tra, giám sát', u: 'đảng viên', from: 'ktgsXa', w: 'pop' },
    { id: 'kl', l: 'Đảng viên bị thi hành kỷ luật', u: 'đảng viên', from: 'klXa', w: 'pop', better: 'low' },
    { id: 'klpc', l: 'Đảng viên bị kỷ luật trên 100.000 dân', u: 'đảng viên', d: 1, per: ['kl', 'ds', 100000], better: 'low' }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước. Số kiểm tra, giám sát là số trong quý; đảng viên kết luận có vi phạm, bị kỷ luật tăng là màu đỏ. Số kiểm tra khi có dấu hiệu vi phạm để màu trung tính.'
});

/* ---------- Ban Nội chính Thành ủy ---------- */
ctmMake({
  id: 'dang-noi-chinh', role: 'DANG', per: 'quy', name: 'Ban Nội chính Thành ủy', short: 'Ban Nội chính', org: 'Thành ủy Hà Nội',
  m: {
    tcd: ['Lượt công dân được tiếp', 'lượt', 0, 3860, 1.5, 'n', 'Lượt công dân được tiếp'],
    tcdKn: ['Lượt công dân khiếu nại, tố cáo đông người', 'lượt', 0, 696, -3, 'i', 'Khiếu nại, tố cáo đông người'],
    tcdDn: ['Đoàn đông người', 'đoàn', 0, 112, -2, 'i'],
    tcLd: ['Buổi tiếp công dân định kỳ của Bí thư Thành ủy, Chủ tịch UBND', 'buổi', 0, [6, 6, 6, 6, 6, 6], 0, 'n', 'Tiếp định kỳ của lãnh đạo Thành phố'],
    dtTn: ['Đơn thư tiếp nhận', 'đơn', 0, 5420, 1, 'n'],
    dtR: ['Đơn thư đã xử lý, chuyển', '%', 1, 94.3, 0.6],
    dtXl: { l: 'Đơn đã xử lý, chuyển cơ quan có thẩm quyền', short: 'Đã xử lý, chuyển', u: 'đơn', f: (D) => D.dtTn * D.dtR / 100 },
    vbTm: ['Văn bản tham mưu', 'văn bản', 0, [34, 27, 41, 36, 33, 26]],
    vaTd: ['Vụ án, vụ việc tham nhũng, kinh tế được theo dõi, chỉ đạo', 'vụ', 0, 48, 3, 'n', 'Vụ án, vụ việc theo dõi'],
    vaXx: ['Vụ án đã đưa ra xét xử', 'vụ', 0, [11, 8, 14, 10, 9, 7]],
    chay: ['Vụ cháy trên địa bàn', 'vụ', 0, [262, 341, 398, 287, 246, 372], 0, 'i'],
    chayNg: ['Người tử vong do cháy', 'người', 0, [6, 9, 11, 7, 5, 10], 0, 'i'],
    ccKt: ['Cơ sở được kiểm tra an toàn phòng cháy', 'cơ sở', 0, 18400, 1.5, '', 'Cơ sở được kiểm tra phòng cháy']
  },
  kpis: [['tcd', 'trong quý'], ['tcdDn', 'trong quý'], ['dtTn', 'trong quý'], ['dtR', 'trên đơn thư tiếp nhận'], ['vbTm', 'trong quý'], ['vaTd', 'đang theo dõi'], ['chay', 'trong quý'], ['chayNg', 'trong quý']],
  card: ['tcd', 'dtTn', 'vaTd', 'chay'],
  groups: [
    { id: 'tcd', label: 'Tiếp công dân', note: 'Tiếp công dân, đoàn đông người', lines: ['tcd', 'tcdKn', 'tcdDn', 'tcLd'] },
    { id: 'dt', label: 'Đơn thư', note: 'Tiếp nhận, xử lý đơn thư khiếu nại, tố cáo, kiến nghị', lines: ['dtTn', 'dtXl', 'dtR'], top: 'dt' },
    { id: 'va', label: 'Phòng, chống tham nhũng', note: 'Vụ án, vụ việc được theo dõi, chỉ đạo; văn bản tham mưu', lines: ['vaTd', 'vaXx', 'vbTm'] },
    { id: 'pccc', label: 'An toàn cháy nổ', note: 'Tình hình cháy nổ, kiểm tra phòng cháy', lines: ['chay', 'chayNg', 'ccKt'], top: 'chay' }
  ],
  xa: [
    /* đơn thư: trung tính, không xếp tốt/kém (quy tắc H18, chốt 12/10/2026) */
    { id: 'dt', l: 'Đơn thư tiếp nhận', u: 'đơn', from: 'dtTn', k: 0.64, w: 'pop', better: 'none' },
    { id: 'chay', l: 'Vụ cháy', u: 'vụ', from: 'chay', w: 'pho', better: 'low' },
    { id: 'chaypc', l: 'Vụ cháy trên 100.000 dân', u: 'vụ', d: 1, per: ['chay', 'ds', 100000], better: 'low' }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước. Số lượt tiếp công dân, đơn thư tăng hay giảm để màu trung tính; đoàn đông người, vụ cháy, người tử vong tăng là màu đỏ.'
});

/* ---------- Ban Tuyên giáo và Dân vận Thành ủy ---------- */
ctmMake({
  id: 'dang-tuyen-giao', role: 'DANG', per: 'quy', name: 'Ban Tuyên giáo và Dân vận Thành ủy', short: 'Ban Tuyên giáo và Dân vận', org: 'Thành ủy Hà Nội',
  m: {
    mh: ['Mô hình “Dân vận khéo” đăng ký', 'mô hình', 0, 10972, 1.4, '', 'Mô hình đăng ký'],
    mhBd: ['Mô hình được biểu dương, khen thưởng', 'mô hình', 0, 1460, 2, '', 'Được biểu dương, khen thưởng'],
    hnLuot: ['Lượt cán bộ, đảng viên học tập, quán triệt nghị quyết', 'lượt', 0, [412000, 338000, 226000, 486000, 402000, 296000], 0, '', 'Lượt học tập, quán triệt'],
    hn: ['Hội nghị học tập, quán triệt nghị quyết, chỉ thị', 'hội nghị', 0, [1260, 980, 640, 1420, 1180, 860], 0, '', 'Hội nghị học tập, quán triệt'],
    hnR: ['Đảng viên tham gia học tập', '%', 1, 94.6, 0.2],
    dl: ['Ý kiến dư luận xã hội thu thập', 'ý kiến', 0, 31330, 2, 'n', 'Ý kiến thu thập'],
    dlBc: ['Báo cáo nhanh dư luận xã hội', 'báo cáo', 0, [26, 24, 28, 26, 25, 23], 0, 'n'],
    dlDt: ['Đồng tình với chủ trương, chính sách', '%', 1, 87.4, 0.4],
    tb: ['Tin, bài tuyên truyền trên báo chí, mạng xã hội', 'tin bài', 0, 18640, 3, '', 'Tin, bài tuyên truyền'],
    tbXau: ['Thông tin xấu, độc được phát hiện, xử lý', 'tin', 0, [214, 236, 251, 268, 282, 297], 0, 'i', 'Thông tin xấu, độc được xử lý']
  },
  kpis: [['mh', 'lũy kế đến cuối quý'], ['mhBd', 'lũy kế'], ['hn', 'trong quý'], ['hnLuot', 'trong quý'], ['hnR', 'trên tổng số đảng viên'], ['dl', 'trong quý'], ['dlDt', 'trên ý kiến thu thập'], ['tbXau', 'trong quý']],
  card: ['mh', 'hnLuot', 'dl', 'dlDt'],
  groups: [
    { id: 'dv', label: 'Dân vận khéo', note: 'Mô hình “Dân vận khéo” đăng ký, được biểu dương', lines: ['mh', 'mhBd'], top: 'mh' },
    { id: 'hn', label: 'Học tập nghị quyết', note: 'Học tập, quán triệt nghị quyết, chỉ thị của Đảng', lines: ['hnLuot', 'hn', 'hnR'] },
    { id: 'dl', label: 'Dư luận xã hội', note: 'Nắm bắt, tổng hợp dư luận xã hội', lines: ['dl', 'dlBc', 'dlDt'] },
    { id: 'tt', label: 'Tuyên truyền', note: 'Tuyên truyền trên báo chí, mạng xã hội; xử lý thông tin xấu, độc', lines: ['tb', 'tbXau'] }
  ],
  xa: [
    { id: 'mh', l: 'Mô hình “Dân vận khéo”', u: 'mô hình', from: 'mh', k: 0.7, w: 'xa' },
    { id: 'mhpc', l: 'Mô hình trên 10.000 dân', u: 'mô hình', d: 1, per: ['mh', 'ds', 10000] },
    { id: 'dt', l: 'Đồng tình với chủ trương, chính sách', u: '%', d: 1, rate: 'dlDt', spread: 7 }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước. Mô hình “Dân vận khéo” là số lũy kế; học tập nghị quyết, dư luận xã hội, tin bài là số trong quý.'
});

/* ---------- Màn ngoài trục Thành ủy cấp Thành phố (5 đơn vị, không chia nhóm) ---------- */
ctmRegisterOverview({
  id: 'dang-tp', roles: ['DANG'], level: 'city', ax: 'Thành ủy', unitWord: 'đơn vị',
  eyebrow: 'Tổng quan · Thành ủy Hà Nội',
  title: (n) => 'Số liệu then chốt của ' + n + ' ban, đơn vị',
  short: { 'dang-vptu': 'Văn phòng Thành ủy', 'dang-to-chuc': 'Ban Tổ chức', 'dang-ubkt': 'Ủy ban Kiểm tra', 'dang-noi-chinh': 'Ban Nội chính', 'dang-tuyen-giao': 'Ban Tuyên giáo và Dân vận' },
  kpis: [
    { cat: 'dang-to-chuc', m: 'dv', target: 'g:dv' }, { cat: 'dang-to-chuc', m: 'knm', target: 'g:bd' },
    { cat: 'dang-ubkt', m: 'ktDv', target: 'g:kt' }, { cat: 'dang-ubkt', m: 'klDv', target: 'g:kl' },
    { cat: 'dang-noi-chinh', m: 'tcd', target: 'g:tcd' }, { cat: 'dang-tuyen-giao', m: 'mh', target: 'g:dv' },
    { cat: 'dang-vptu', m: 'all_tong', target: 'g:all' }, { cat: 'dang-vptu', m: 'all_htR', target: 'g:all' }
  ],
  groups: []
});

/* Kiểu dữ liệu (quy tắc H9): số tại thời điểm so với quý liền trước; còn lại là số phát sinh, so cùng kỳ năm trước */
ctmFlag('dang-to-chuc', 'td', ['dv', 'dvDb', 'dvCt', 'dvNu', 'dvTre', 'dvDh', 'dbtt', 'dbXa', 'tcco', 'dbcs', 'cbcs', 'cbtt', 'ht', 'tcHt', 'xs', 'khong', 'cb', 'cbBtv', 'qh', 'dvXa']);