/* ============================== SỞ TÀI CHÍNH — CẤU HÌNH BỘ CHỈ TIÊU MỚI ==============================
   Toàn bộ danh mục chỉ tiêu, phân cấp, ánh xạ dòng API -> nút, đơn vị và các giả định gom ở đây (sửa 1 chỗ).
   Nạp TRƯỚC central-level.js vì central-level.js dùng STC_ITEMS / TC_SHOW_LEGACY.
   Nguồn số liệu: 14 API Sở Tài chính Hà Nội, dữ liệu thô {chiTieu, giaTri, loai, quy} trong js/data/stc-snapshot.js. */

/* true = hiện lại bộ chỉ tiêu CŨ của Sở Tài chính (ẩn bằng cờ, code cũ vẫn giữ nguyên trong central-level.js). */
const TC_SHOW_LEGACY = false;

/* true = hiện lại 4 thẻ nhóm rút gọn (Ngân sách, Đầu tư & dự án, Sản xuất..., Kinh tế vĩ mô) NGOÀI lưới chỉ tiêu,
   bên dưới băng Tổng quan. Đang tắt vì băng Tổng quan (7 ô KPI, bấm mở thẳng đúng nhóm) đã thay thế được — 4 thẻ
   đó giờ chỉ còn xem trong popup (mục "Bốn nhóm chỉ tiêu" ở màn Trang chủ, hoặc bấm 1 ô KPI/"Xem tổng quan đầy
   đủ"). Ẩn bằng cờ, hàm dựng thẻ (soItemCardHtml) vẫn giữ nguyên, không xoá. */
const STC_SHOW_OUTER_GROUP_CARDS = false;

/* true = hiện lại hàng chip trạng thái ở đầu popup (Nguồn: ..., Kỳ báo cáo: ..., Số liệu chụp lúc ..., DỮ LIỆU MẪU).
   Đang tắt vì các thông tin này đã có ở nơi khác trong popup (phụ đề đầu popup ghi "DỮ LIỆU MẪU · ...", chân màn
   ghi lại nguồn + kỳ), nên hàng chip bị coi là thừa/rối. Ẩn bằng cờ, hàm dựng chip (stcChips) vẫn giữ nguyên. */
const STC_SHOW_CHIPS = false;

/* true = mở form với DỮ LIỆU MẪU ngay từ đầu (đang BẬT theo yêu cầu, để xem thiết kế đầy đủ). Luôn có banner vàng "DỮ LIỆU MẪU",
   thẻ xem trước ở lưới chỉ tiêu cũng có nhãn mẫu, file Excel có hậu tố -DU-LIEU-MAU. Trong popup có nút "Tắt dữ liệu mẫu" để xem số thật
   (bản chụp API); tải lại trang thì về giá trị này. Khi đưa vào vận hành thật: đặt false để mặc định là số thật. */
const STC_DEMO_DEFAULT = true;

/* Các GIẢ ĐỊNH chưa được Sở Tài chính xác nhận — sửa ở đây khi có thông tin thật. */
const STC_ASSUME = {
  /* A2: "So với cùng kỳ" là chỉ số lấy 100 làm mốc (125 = tăng 25%). Ngoài khoảng này thì cảnh báo "kiểm tra ý nghĩa". */
  ckRange: [30, 300],
  /* A1: đơn vị hiển thị (API không trả đơn vị) */
  unitNote: 'Đơn vị hiển thị theo giả định (tỷ đồng, triệu USD, nghìn lượt), chờ Sở Tài chính xác nhận.',
  ckNote: 'Mức tăng của "So với cùng kỳ" tính theo giả định đó là chỉ số lấy 100 làm mốc (125 nghĩa là tăng 25%).',
  /* Quý 1–4 <-> tham số {thang_hoac_quy} của API (chưa xác minh); chỉ dùng để ghi chú. */
  periodLabel: (y, p) => 'Quý ' + p + '/' + y
};

const STC_GROUPS = [
  { id: 'ns', label: 'Ngân sách', inds: ['thu', 'chi'] },
  { id: 'dt', label: 'Đầu tư & dự án', inds: ['vdt', 'nsnn', 'da'] },
  { id: 'sx', label: 'Sản xuất – Thương mại – Dịch vụ', inds: ['iip', 'bra', 'ble', 'vt', 'dl', 'xnk'] },
  { id: 'vm', label: 'Kinh tế vĩ mô', inds: ['grdp', 'gia'] }
];

/* Cách đọc dòng API -> nút:
   api      mã API (nút con kế thừa từ nút cha)
   match    trường của dòng dùng để nhận diện nút: 'loai' | 'chiTieu'
   measure  ý nghĩa giá trị: 'plain' (giá trị) | 'period' (loai = "Kỳ này"/"Kỳ trước") | 'ck' (chiTieu chứa "so với cùng kỳ")
            | 'cmp' (chiTieu chứa "giá so sánh")
   keys     các nhãn API khớp với nút (so khớp sau khi chuẩn hoá chữ thường/khoảng trắng)
   totalKeys  nhãn của dòng "tổng" do API cung cấp (nếu không có thì cộng các nút con)
   kind     'add' cộng gộp được | 'idx' chỉ số lấy 100 làm mốc | 'pct' tỷ lệ % | 'container' chỉ để nhóm
   view     kiểu thẻ ở màn nhóm */
const STC_INDICATORS = [
  { id: 'thu', group: 'ns', label: 'Thu ngân sách nhà nước trên địa bàn', unit: 'tỷ đồng', kind: 'add', view: 'barsCompare',
    api: 'THU_NGAN_SACH', match: 'chiTieu', measure: 'period',
    kids: [
      { id: 'thu_nd', label: 'Thu nội địa', keys: ['Thu nội địa'] },
      { id: 'thu_xnk', label: 'Thu từ hoạt động xuất nhập khẩu', keys: ['Thu từ hoạt động xuất nhập khẩu'] },
      { id: 'thu_vt', label: 'Thu viện trợ', keys: ['Thu viện trợ'] },
      { id: 'thu_dt', label: 'Thu từ dầu thô', keys: ['Thu từ dầu thô'] }
    ] },
  { id: 'chi', group: 'ns', label: 'Chi ngân sách địa phương', unit: 'tỷ đồng', kind: 'add', view: 'donutTable', neutral: true,
    api: 'CHI_NGAN_SACH_DIA_PHUONG', match: 'chiTieu', measure: 'period', totalKeys: ['Tổng chi NS ĐP'],
    kids: [
      { id: 'chi_dt', label: 'Chi đầu tư phát triển', keys: ['Chi đầu tư phát triển'] },
      { id: 'chi_tx', label: 'Chi thường xuyên', keys: ['Chi phát triển thường xuyên'] },
      { id: 'chi_nl', label: 'Chi trả nợ lãi', keys: ['Chi trả nợ lãi'] },
      { id: 'chi_qd', label: 'Chi bổ sung quỹ dự trữ tài chính', keys: ['Chi bổ sung quỹ dự trữ tài chính'] },
      { id: 'chi_kh', label: 'Các nhiệm vụ chi khác', keys: ['Các nhiệm vụ chi khác'] }
    ] },

  { id: 'vdt', group: 'dt', label: 'Vốn đầu tư phát triển toàn xã hội', unit: 'tỷ đồng', kind: 'add', view: 'donutTable',
    api: 'VON_DAU_TU', match: 'loai', measure: 'plain',
    kids: [
      { id: 'vdt_nn', label: 'Vốn nhà nước', keys: ['Vốn nhà nước'] },
      { id: 'vdt_ngn', label: 'Vốn ngoài nhà nước', keys: ['Vốn ngoài nhà nước'] },
      { id: 'vdt_fdi', label: 'Vốn đầu tư trực tiếp nước ngoài', keys: ['Vốn đầu tư trực tiếp nước ngoài'] }
    ] },
  { id: 'nsnn', group: 'dt', label: 'Vốn đầu tư từ nguồn NSNN do địa phương quản lý', unit: 'tỷ đồng', kind: 'add', view: 'stackTable',
    api: 'VON_NSNN_DIA_PHUONG', match: 'chiTieu', measure: 'plain',
    kids: [
      { id: 'nsnn_tp', label: 'Ngân sách Nhà nước cấp Thành phố', keys: ['Vốn ngân sách Nhà nước cấp thành phố'], color: 'var(--s1)' },
      { id: 'nsnn_xa', label: 'Ngân sách Nhà nước cấp xã', keys: ['Vốn ngân sách Nhà nước cấp xã'], color: 'var(--s5)' }
    ] },
  { id: 'da', group: 'dt', label: 'Tiến độ dự án, công trình trọng điểm', unit: '% hoàn thành', kind: 'pct', view: 'progress',
    api: 'DA_TRONG_DIEM', match: 'loai', measure: 'plain',
    kids: [
      { id: 'da_1', label: 'Xử lý các dự án ngoài ngân sách chậm triển khai', keys: ['Xử lý các dự án ngoài ngân sách chậm triển khai'] },
      { id: 'da_2', label: 'Quy hoạch và Thể chế phát triển Thủ đô', keys: ['Quy hoạch và Thể chế phát triển Thủ đô'] },
      { id: 'da_3', label: 'Dự án 07 cầu vượt sông Hồng', keys: ['Dự án 07 cầu vượt sông Hồng'] },
      { id: 'da_4', label: 'Nhóm 10 dự án, công trình', keys: ['Nhóm 10 dự án, công trình'] },
      { id: 'da_5', label: 'Các tuyến đường Vành đai và Giao thông trọng điểm', keys: ['Các tuyến đường Vành đai và Giao thông trọng điểm'] }
    ] },

  { id: 'iip', group: 'sx', label: 'Chỉ số sản xuất công nghiệp (IIP)', unit: '% so cùng kỳ', kind: 'idx', view: 'idxAxis',
    api: 'CHI_SO_SXCN', match: 'loai', measure: 'plain', totalKeys: ['Toàn ngành công nghiệp'],
    kids: [
      { id: 'iip_1', label: 'Khai khoáng', keys: ['Khai khoáng'] },
      { id: 'iip_2', label: 'Công nghiệp chế biến, chế tạo', keys: ['Công nghiệp chế biến, chế tạo'] },
      { id: 'iip_3', label: 'Sản xuất và phân phối điện, khí đốt, hơi nước, điều hòa không khí', keys: ['Sản xuất và phân phối điện, khí đốt, hơi nước và điều hoà không khí', 'Sản xuất và phân phối điện, khí đốt, hơi nước và điều hòa không khí'] },
      { id: 'iip_4', label: 'Cung cấp nước, quản lý và xử lý rác thải, nước thải', keys: ['Cung cấp nước, hoạt động quản lý và xử lý rác thải, nước thải'] }
    ] },
  { id: 'bra', group: 'sx', label: 'Tổng mức bán ra và doanh thu dịch vụ', unit: 'tỷ đồng', kind: 'add', view: 'stackTable',
    api: 'TONG_HANG_BAN_RA', match: 'loai', measure: 'plain',
    kids: [
      { id: 'bra_1', label: 'Nhà nước', keys: ['Nhà nước'], color: 'var(--s1)' },
      { id: 'bra_2', label: 'Ngoài nhà nước', keys: ['Ngoài nhà nước'], color: 'var(--s2)' },
      { id: 'bra_3', label: 'Khu vực có vốn đầu tư nước ngoài', keys: ['Khu vực có vốn đầu tư nước ngoài'], color: 'var(--s3)' }
    ] },
  { id: 'ble', group: 'sx', label: 'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng', unit: 'tỷ đồng', kind: 'add', view: 'stackTable',
    api: 'TONG_HANG_BAN_LE', match: 'loai', measure: 'plain',
    kids: [
      { id: 'ble_1', label: 'Nhà nước', keys: ['Nhà nước'], color: 'var(--s1)' },
      { id: 'ble_2', label: 'Ngoài nhà nước', keys: ['Ngoài nhà nước'], color: 'var(--s2)' },
      { id: 'ble_3', label: 'Khu vực có vốn đầu tư nước ngoài', keys: ['Khu vực có vốn đầu tư nước ngoài'], color: 'var(--s3)' }
    ] },
  { id: 'vt', group: 'sx', label: 'Doanh thu vận tải, kho bãi, bưu chính', unit: 'tỷ đồng', kind: 'add', view: 'barsDelta',
    api: 'DOANH_THU_VAN_TAI', match: 'loai', measure: 'ck',
    kids: [
      { id: 'vt_1', label: 'Vận tải hành khách', keys: ['Vận tải hành khách'] },
      { id: 'vt_2', label: 'Vận tải hàng hóa', keys: ['Vận tải hàng hóa'] },
      { id: 'vt_3', label: 'Dịch vụ kho bãi và hỗ trợ vận tải', keys: ['Dịch vụ kho bãi và hỗ trợ vận tải'] },
      { id: 'vt_4', label: 'Bưu chính, chuyển phát', keys: ['Bưu chính, chuyển phát'] }
    ] },
  { id: 'dl', group: 'sx', label: 'Khách du lịch đến Hà Nội', unit: 'nghìn lượt', kind: 'add', view: 'donutTable',
    api: 'KHACH_DU_LICH_HN', match: 'loai', measure: 'ck',
    kids: [
      { id: 'dl_1', label: 'Khách nội địa', keys: ['Khách nội địa'] },
      { id: 'dl_2', label: 'Khách quốc tế', keys: ['Khách quốc tế'] }
    ] },
  { id: 'xnk', group: 'sx', label: 'Kim ngạch xuất nhập khẩu hàng hóa', unit: 'triệu USD', kind: 'container', view: 'xnk',
    match: 'loai', measure: 'ck',
    kids: [
      { id: 'xk', label: 'Xuất khẩu', api: 'KIM_NGACH_XK', kind: 'add', color: 'var(--s1)',
        kids: [
          { id: 'xk_1', label: 'Khu vực kinh tế trong nước', keys: ['Khu vực kinh tế trong nước'], color: 'var(--s1)' },
          { id: 'xk_2', label: 'Khu vực có vốn đầu tư nước ngoài', keys: ['Khu vực có vốn đầu tư nước ngoài'], color: 'var(--s3)' }
        ] },
      { id: 'nk', label: 'Nhập khẩu', api: 'KIM_NGACH_NK', kind: 'add', neutral: true, color: 'var(--s2)',
        kids: [
          { id: 'nk_1', label: 'Khu vực kinh tế trong nước', keys: ['Khu vực kinh tế trong nước'], color: 'var(--s1)' },
          { id: 'nk_2', label: 'Khu vực có vốn đầu tư nước ngoài', keys: ['Khu vực có vốn đầu tư nước ngoài'], color: 'var(--s3)' }
        ] }
    ] },

  { id: 'grdp', group: 'vm', label: 'Tổng sản phẩm trên địa bàn (GRDP)', unit: 'tỷ đồng', kind: 'add', view: 'donutTable',
    api: 'SP_DIA_BAN', match: 'loai', measure: 'cmp',
    kids: [
      { id: 'grdp_1', label: 'Nông, lâm nghiệp và thủy sản', keys: ['Nông, lâm nghiệp và thủy sản'] },
      { id: 'grdp_2', label: 'Công nghiệp và xây dựng', keys: ['Công nghiệp và xây dựng'] },
      { id: 'grdp_3', label: 'Dịch vụ', keys: ['Dịch vụ'] },
      { id: 'grdp_4', label: 'Thuế sản phẩm trừ trợ cấp sản phẩm', keys: ['Thuế sản phẩm trừ trợ cấp sản phẩm'] }
    ] },
  { id: 'gia', group: 'vm', label: 'Chỉ số giá', unit: '% so cùng kỳ', kind: 'container', view: 'scales', neutral: true,
    api: 'CHI_SO_KINH_TE', match: 'loai', measure: 'plain',
    kids: [
      { id: 'gia_1', label: 'Chỉ số giá tiêu dùng (CPI)', kind: 'idx', keys: ['Chỉ số giá tiêu dùng'] },
      { id: 'gia_2', label: 'Chỉ số giá vàng', kind: 'idx', keys: ['Chỉ số giá vàng'] },
      { id: 'gia_3', label: 'Chỉ số giá đô la Mỹ', kind: 'idx', keys: ['Chỉ số giá đô la Mỹ'] }
    ] }
];

/* 7 thẻ KPI ở trang chủ. fmt: 'nghinTy' (giá trị tỷ đồng -> nghìn tỷ), 'trieuLuot' (nghìn lượt -> triệu), 'idx' (chỉ số), 'pct' */
const STC_KPIS = [
  { ind: 'thu', label: 'Tổng thu NSNN trên địa bàn', fmt: 'nghinTy', target: 'ns' },
  { ind: 'chi', label: 'Tổng chi ngân sách địa phương', fmt: 'nghinTy', target: 'ns' },
  { ind: 'vdt', label: 'Vốn đầu tư phát triển toàn xã hội', fmt: 'nghinTy', target: 'dt' },
  { ind: 'grdp', label: 'Tổng sản phẩm trên địa bàn (GRDP)', fmt: 'nghinTy', target: 'vm' },
  { ind: 'iip', label: 'Chỉ số sản xuất công nghiệp (IIP)', fmt: 'idx', target: 'sx' },
  { ind: 'dl', label: 'Khách du lịch đến Hà Nội', fmt: 'trieuLuot', target: 'sx' },
  { ind: 'gia_1', label: 'Chỉ số giá tiêu dùng (CPI)', fmt: 'idx', target: 'vm' }
];

/* Tên ngắn dùng trong thẻ xem trước ở lưới chỉ tiêu (mỗi thẻ = một nhóm, một popup). */
const STC_SHORT = {
  thu: 'Thu NSNN', chi: 'Chi ngân sách địa phương', vdt: 'Vốn đầu tư toàn xã hội', nsnn: 'Vốn NSNN địa phương', da: 'Dự án trọng điểm',
  iip: 'Chỉ số sản xuất công nghiệp', bra: 'Tổng mức bán ra', ble: 'Tổng mức bán lẻ', vt: 'Vận tải, kho bãi, bưu chính', dl: 'Khách du lịch',
  xnk: 'Xuất nhập khẩu (cán cân)', grdp: 'GRDP', gia: 'Chỉ số giá tiêu dùng (CPI)'
};

/* Lưới chỉ tiêu của IOC hiện 5 thẻ: 1 thẻ TỔNG QUAN (đứng đầu, mở màn Trang chủ – tổng quan) + 4 thẻ NHÓM (mỗi nhóm mở
   thẳng popup của nhóm đó), dạng [tên, số bản ghi, tần suất, nguồn] cho categorySeed (central-level.js). Số bản ghi = 0
   để hệ thống demo KHÔNG sinh bản ghi giả; stcKey = 'home' cho thẻ tổng quan, hoặc nối với id nhóm trong form mới. */
const STC_ITEM_OVERVIEW = ['Tổng quan', 0, 'Quý', 'API Sở Tài chính (bản chụp)'];
STC_ITEM_OVERVIEW.stcKey = 'home';
const STC_ITEMS = [STC_ITEM_OVERVIEW].concat(STC_GROUPS.map(g => {
  const it = [g.label, 0, 'Quý', 'API Sở Tài chính (bản chụp)'];
  it.stcKey = g.id;
  return it;
}));