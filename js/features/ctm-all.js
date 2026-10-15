/* ============================== TAB "TẤT CẢ" CỦA TÀI KHOẢN THÀNH ỦY — MÀN NGOÀI KHUÔN MỚI ==============================
   Gộp 4 trục cấp Thành phố (Thành ủy, HĐND, UBND, MTTQ): 8 ô số then chốt (2 ô mỗi trục), 4 thẻ nhóm = 4 trục (bấm để lọc),
   thẻ từng đơn vị. Số của trục UBND lấy từ màn tổng quan UBND (ubnd-overview.js) vì các sở đang dùng form riêng; bấm thẻ
   vẫn mở đúng phần chi tiết của từng đơn vị. Nạp SAU ctm-dang.js, ctm-hdnd.js, ctm-mttq.js và ubnd-overview.js. */
ctmRegisterOverview({
  id: 'tu-all', roles: ['DANG', 'HDND', 'UBND', 'MTTQ'], level: 'city', unitWord: 'đơn vị',
  eyebrow: 'Tổng quan · 4 trục cấp Thành phố',
  title: (n) => 'Số liệu then chốt của ' + n + ' ban, sở, đơn vị',
  hint: 'Mỗi ô ghi rõ đơn vị cung cấp và kỳ số liệu · bấm ô để mở chi tiết · bấm một trục để lọc',
  groupTitle: 'Bốn trục · bấm một trục để lọc danh sách đơn vị bên dưới',
  short: {
    'dang-to-chuc': 'Ban Tổ chức Thành ủy', 'dang-ubkt': 'Ủy ban Kiểm tra Thành ủy', 'hdnd-vp-doan-dbqh': 'Văn phòng Đoàn ĐBQH - HĐND', 'hdnd-doan-dbqh': 'Đoàn ĐBQH',
    'ubnd-taichinh': 'Sở Tài chính', 'ubnd-hcc': 'TT Phục vụ hành chính công', 'mttq-quy': 'Ban Tuyên giáo và CTXH', 'mttq-lien-doan-lao-dong': 'Liên đoàn lao động'
  },
  kpis: [
    { cat: 'dang-to-chuc', m: 'dv', target: 'g:dv' }, { cat: 'dang-ubkt', m: 'ktDv', target: 'g:kt' },
    { cat: 'hdnd-vp-doan-dbqh', m: 'nq', target: 'g:kh' }, { cat: 'hdnd-doan-dbqh', m: 'kn', target: 'g:kn' },
    { cat: 'ubnd-taichinh', line: 0, l: 'Thu ngân sách nhà nước' }, { cat: 'ubnd-hcc', line: 1, l: 'Nộp hồ sơ trực tuyến' },
    { cat: 'mttq-quy', m: 'thu', target: 'g:quy' }, { cat: 'mttq-quy', m: 'cn', target: 'xa:cn' }
  ],
  groups: [
    { id: 'DANG', label: 'Thành ủy', role: 'DANG', ax: 'Thành ủy' },
    { id: 'HDND', label: 'HĐND Thành phố', role: 'HDND', ax: 'HĐND TP' },
    { id: 'UBND', label: 'UBND Thành phố', role: 'UBND', ax: 'UBND TP' },
    { id: 'MTTQ', label: 'Ủy ban MTTQ Thành phố', role: 'MTTQ', ax: 'MTTQ TP' }
  ]
});
