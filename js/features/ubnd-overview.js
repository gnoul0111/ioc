/* ============================== TỔNG QUAN CHỈ TIÊU — TÀI KHOẢN UBND THÀNH PHỐ ==============================
   Thay lưới thẻ sở ở mục "Nhóm chỉ tiêu theo lĩnh vực được phép xem" (trục UBND, cấp Thành phố) bằng màn tổng quan
   theo giao diện mới của Sở Tài chính / Sở GD&ĐT / TT Phục vụ HCC:
     1. 8 ô số then chốt của Thành phố (mỗi ô ghi sở cung cấp và kỳ số liệu),
     2. 4 thẻ nhóm lĩnh vực — bấm để lọc danh sách sở bên dưới,
     3. thẻ từng sở cùng một kiểu: nhãn – số – đơn vị – tăng/giảm, chân thẻ ghi kỳ và nguồn.
   CHỈ thay lớp ngoài: bấm ô số / thẻ sở vẫn gọi openCategoryDetail() như cũ, giao diện chi tiết của từng sở giữ nguyên.
   Số lấy thẳng từ cấu hình của từng sở (stc-/sgd-/hcc-data, *_ITEMS, *_KY ...), không ghi cứng ở đây.
   Đặt UBND_OVERVIEW_ENABLED = false để quay về lưới thẻ cũ (code cũ trong indicators.js giữ nguyên). */
const UBND_OVERVIEW_ENABLED = true;
/* Nhãn "SỐ GIẢ LẬP" / "DỮ LIỆU MẪU" ở chân thẻ và câu nhắc giả lập ở đầu băng tổng quan — anh yêu cầu ẩn (2026-10-06). */
const UBND_OV_SHOW_DEMO_FLAG = false;
/* Cột so sánh (▲▼ kỳ trước / cùng kỳ) và ghi chú phụ ("đạt chỉ tiêu…", "5 quá hạn"…) — anh yêu cầu bỏ ở màn tổng quan
   (2026-10-06): mỗi dòng chỉ còn tên – số – đơn vị, kẻ thẳng cột. Số liệu so sánh vẫn tính trong UBND_OV_SPECS, chỉ không hiện. */
const UBND_OV_SHOW_COMPARE = false;
/* true = sở đã có cấu hình chi tiết khuôn mới (ctm-so.js) thì thẻ, ô số ở đây ĐỌC THẲNG dòng thẻ ngoài của cấu hình đó (ctmOvLines),
   không tự tính lại — cùng số, cùng đơn vị, cùng nhãn với tab "Tất cả" và với màn chi tiết (quy tắc H22, 12/10/2026).
   false = quay về bảng tự tính UBND_OV_SPECS bên dưới (giữ nguyên, không xóa). */
const UBND_OV_FROM_CTM = true;
let UBND_OV_GROUP = 'all';

/* Sở Du lịch đã nhập vào Sở Văn hóa, Thể thao và Du lịch (cờ UBND_SAP_XEP_SO_2026, central-level.js): 'ubnd-dulich' vẫn để trong
   nhóm dưới đây nhưng không còn trong danh mục sở nên tự rơi khỏi nhóm; ô số khách du lịch đọc dòng "dlTong" của thẻ sở gộp. */
const UBND_OV_GOP_DL = typeof UBND_SAP_XEP_SO_2026 !== 'undefined' && UBND_SAP_XEP_SO_2026;
const UBND_OV_GROUPS = [
  { id: 'kt', label: 'Kinh tế – Tài chính', ids: ['ubnd-taichinh', 'ubnd-congthuong', 'ubnd-dulich', 'ubnd-bqlkcnc'] },
  { id: 'vx', label: 'Văn hóa – Xã hội', ids: ['ubnd-gddt', 'ubnd-yte', 'ubnd-vhtt', 'ubnd-noivu', 'ubnd-dantoc-tongiao'] },
  { id: 'hc', label: 'Hành chính – Chuyển đổi số', ids: ['ubnd-hcc', 'ubnd-vpubnd', 'ubnd-khcn', 'ubnd-thanhtra'] },
  { id: 'dt', label: 'Đô thị – Môi trường', ids: ['ubnd-xaydung', 'ubnd-nnmt'] }
];
/* 8 ô số then chốt: lấy dòng thứ `line` trong thẻ của sở `cat` (xem UBND_OV_SPECS). */
const UBND_OV_KPIS = [
  { cat: 'ubnd-taichinh', line: 0, label: 'Thu ngân sách nhà nước' },
  { cat: 'ubnd-hcc', line: 0, label: 'Hồ sơ thủ tục hành chính tiếp nhận mới', u: '' },
  { cat: 'ubnd-hcc', line: 1, label: 'Nộp hồ sơ trực tuyến' },
  { cat: 'ubnd-congthuong', line: 0, m: 'xk', label: 'Kim ngạch xuất khẩu' },
  { cat: 'ubnd-congthuong', line: 2, m: 'bl', label: 'Bán lẻ hàng hóa và dịch vụ tiêu dùng' },
  UBND_OV_GOP_DL ? { cat: 'ubnd-vhtt', line: 4, m: 'dlTong', label: 'Khách du lịch' } : { cat: 'ubnd-dulich', line: 0, m: 'tong', label: 'Khách du lịch' },
  { cat: 'ubnd-yte', line: 0, m: 'bhR', label: 'Bao phủ bảo hiểm y tế' },
  { cat: 'ubnd-vpubnd', line: 0, m: 'vpub1_tl', label: 'Văn bản xử lý trên môi trường mạng' }
];
/* Tên ngắn của sở ở ô số và thẻ nhóm. */
const UBND_OV_SHORT = {
  'ubnd-taichinh': 'Sở Tài chính', 'ubnd-congthuong': 'Sở Công Thương', 'ubnd-dulich': 'Sở Du lịch', 'ubnd-bqlkcnc': 'Ban Quản lý KCNC và KCN',
  'ubnd-gddt': 'Sở Giáo dục và Đào tạo', 'ubnd-yte': 'Sở Y tế', 'ubnd-vhtt': UBND_OV_GOP_DL ? 'Sở Văn hóa, Thể thao và Du lịch' : 'Sở Văn hóa và Thể thao', 'ubnd-noivu': 'Sở Nội vụ',
  'ubnd-dantoc-tongiao': 'Sở Dân tộc và Tôn giáo', 'ubnd-hcc': 'TT Phục vụ hành chính công', 'ubnd-vpubnd': 'Văn phòng UBND Thành phố',
  'ubnd-khcn': 'Sở Khoa học và Công nghệ', 'ubnd-thanhtra': 'Thanh tra Thành phố', 'ubnd-xaydung': 'Sở Xây dựng', 'ubnd-nnmt': 'Sở Nông nghiệp và Môi trường'
};

/* ---------- Tiện ích ---------- */
function uoE(s) { return typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function uoFmt(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 && Number(Math.abs(n).toFixed(d)) !== 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function uoPct(a, b) { return a == null || !b ? null : (a / b) * 100; }
/* Giá trị một thành phần phân tổ (theo nhãn) của chỉ tiêu thứ i trong *_ITEMS. */
function uoP(items, i, label) {
  const it = items && items[i];
  if (!it) return null;
  for (const p of (it[4] || [])) { const x = (p.items || []).find((y) => y.label === label); if (x) return Number(x.value); }
  return null;
}
/* Tổng các thành phần của phân tổ đầu tiên của chỉ tiêu thứ i. */
function uoSum(items, i) {
  const p = items && items[i] && (items[i][4] || [])[0];
  return p ? p.items.reduce((s, x) => s + (Number(x.value) || 0), 0) : null;
}
/* Mũi tên tăng/giảm — cùng lớp CSS với form STC/SGD/HCC. o.inv: giảm là tốt; o.neutral: màu trung tính; o.rate: chênh điểm %. */
function uoDl(now, prev, o) {
  o = o || {};
  if (now == null || prev == null) return '';
  const v = o.rate ? now - prev : (prev ? (now / prev - 1) * 100 : null);
  if (v == null) return '';
  const r = Math.round(v * 10) / 10;
  let cls = r > 0 ? 'up' : r < 0 ? 'down' : 'flat';
  if (cls !== 'flat') { if (o.inv) cls += r > 0 ? ' bad' : ' good'; else if (o.neutral) cls += ' n'; }
  const txt = cls === 'flat' ? 'Không đổi' : uoFmt(Math.abs(v), 1) + (o.rate ? ' điểm %' : '%');
  const tip = (o.ref ? 'So ' + o.ref + ': ' : '') + uoFmt(prev, o.d || 0) + ' → ' + uoFmt(now, o.d || 0) + '. ' +
    (o.inv ? 'Chỉ tiêu này giảm là tốt.' : o.neutral ? 'Tăng hay giảm không tự thân tốt/xấu nên để màu trung tính.' : 'Chỉ tiêu này tăng là tốt.');
  return '<span class="stc-dl ' + cls + '" title="' + uoE(tip) + '">' + txt + (o.ref ? ' <span class="stc-ref">' + uoE(o.ref) + '</span>' : '') + '</span>';
}
/* Ghi chú ngắn thay cho mũi tên khi sở chưa có số kỳ trước (tone: 'good' | 'bad' | ''). */
function uoNote(text, tone) { return '<span class="stc-dl na' + (tone ? ' uo-' + tone : '') + '">' + uoE(text) + '</span>'; }
function uoL(l, v, u, d) { return { l: l, v: v, u: u || '', d: d || '' }; }

/* ---------- Số của từng sở: { ky, src, flag, lines } ---------- */
const UBND_OV_SPECS = {
  'ubnd-taichinh': () => {
    if (typeof stcDefaultPeriod !== 'function' || typeof stcBuildPeriod !== 'function') return null;
    const p = stcDefaultPeriod(), res = p ? stcBuildPeriod(p.year, p.period) : null;
    if (!res) return { ky: '—', src: 'API', lines: [], none: 'Chưa có bản chụp số liệu.' };
    const lines = ['thu', 'chi', 'vdt', 'grdp'].map((id) => {
      const n = res.byId[id], root = res.rootOf ? res.rootOf[id] : null;
      if (!n || n.now == null || (root && root.state !== 'ok')) return null;
      const d = stcDeltaCq(n) != null ? stcDlOne(n, 'cq', true) : stcDeltaKq(n) != null ? stcDlOne(n, 'kq', true) : '';
      return uoL((typeof STC_SHORT !== 'undefined' && STC_SHORT[id]) || n.label, stcVal(n), n.unit, d);
    }).filter(Boolean);
    return { ky: 'Quý ' + p.period + '/' + p.year, src: 'API', flag: (typeof STC_DEMO_ON !== 'undefined' && STC_DEMO_ON) ? 'DỮ LIỆU MẪU' : '', lines: lines, none: 'Kỳ này chưa có số liệu.' };
  },
  'ubnd-gddt': () => {
    if (typeof sgdMetrics !== 'function') return null;
    const M = sgdMetrics(), o = { ref: 'năm trước' };
    return { ky: 'Năm học ' + sgdYearLabel(SGD_UI.year), src: 'API', lines: [
      uoL('Số trường', uoFmt(M.tr[0]), 'trường', sgdDl(M.tr[0], M.tr[1], o)),
      uoL('Trường đạt chuẩn quốc gia', uoFmt(M.cq[0]), 'trường', sgdDl(M.cq[0], M.cq[1], o)),
      uoL('Học sinh tiểu học, THCS', uoFmt(M.hs[0]), 'học sinh',sgdDl(M.hs[0], M.hs[1], o)),
      uoL('Giáo viên tiểu học, THCS', uoFmt(M.gv[0]), 'người', sgdDl(M.gv[0], M.gv[1], o))] };
  },
  'ubnd-hcc': () => {
    if (typeof hccMetrics !== 'function') return null;
    const M = hccMetrics();
    return { ky: hccPeriodLabel(HCC_UI.period), src: 'API', lines: [
      uoL('Hồ sơ tiếp nhận mới', uoFmt(M.hs[0]), 'hồ sơ', hccDl(M.hs[0], M.hs[1], { neutral: true, ref: 'kỳ trước' })),
      uoL('Nộp hồ sơ trực tuyến', uoFmt(M.olR[0], 1), '%', hccDl(M.olR[0], M.olR[1], { rate: true, ref: 'kỳ trước' })),
      uoL('Giải quyết đúng hạn', uoFmt(M.dungR[0], 2), '%', hccDl(M.dungR[0], M.dungR[1], { rate: true, d: 2, ref: 'kỳ trước' })),
      uoL('Hồ sơ giải quyết trễ hạn', uoFmt(M.tre[0]), 'hồ sơ', hccDl(M.tre[0], M.tre[1], { inv: true, ref: 'kỳ trước' }))] };
  },
  'ubnd-congthuong': () => {
    const X = SCT_XNK, B = SCT_BL, N = SCT_NL, o = (x) => Object.assign({ ref: 'cùng kỳ' }, x || {});
    return { ky: SCT_KY, src: 'Eform', lines: [
      uoL('Kim ngạch xuất khẩu', uoFmt(X.xk), 'triệu USD', uoDl(X.xk, X.xkCk, o())),
      uoL('Kim ngạch nhập khẩu', uoFmt(X.nk), 'triệu USD', uoDl(X.nk, X.nkCk, o({ neutral: true }))),
      uoL('Bán lẻ hàng hóa và dịch vụ tiêu dùng', uoFmt(B.banLe + B.dichVu), 'tỷ đồng', uoDl(B.banLe + B.dichVu, B.ckTong, o())),
      uoL('Điện năng tiêu thụ', uoFmt(N.dien), 'triệu kWh', uoDl(N.dien, N.dienCk, o({ neutral: true })))] };
  },
  'ubnd-dulich': () => {
    const I = DL_ITEMS, qt = uoP(I, 0, 'Quốc tế'), nd = uoP(I, 0, 'Nội địa');
    return { ky: DL_KY, src: 'Eform', lines: [
      uoL('Tổng lượt khách du lịch', uoFmt((qt + nd) / 1e6, 2), 'triệu lượt', ''),
      uoL('Khách quốc tế', uoFmt(qt / 1e6, 2), 'triệu lượt', uoNote(uoFmt(uoPct(qt, qt + nd), 1) + '% tổng lượt')),
      uoL('Tổng thu từ du lịch', uoFmt(uoSum(I, 1)), 'tỷ đồng', '')] };
  },
  'ubnd-bqlkcnc': () => {
    const I = BQL_ITEMS;
    return { ky: BQL_KY, src: 'Eform', lines: [
      uoL('Doanh nghiệp đang hoạt động', uoFmt(uoP(I, 0, 'Doanh nghiệp đang hoạt động')), 'doanh nghiệp', ''),
      uoL('Lao động đang làm việc', uoFmt(uoP(I, 0, 'Lao động đang làm việc')), 'người', ''),
      uoL('Vốn thu hút mới', uoFmt(uoP(I, 1, 'Vốn thu hút mới (tỷ đồng)')), 'tỷ đồng', uoNote(uoFmt(uoP(I, 1, 'Dự án mới')) + ' dự án mới'))] };
  },
  'ubnd-yte': () => {
    const I = SYT_ITEMS, bh = uoP(I, 1, 'Tỷ lệ có thẻ BHYT'), ct = uoP(I, 1, 'Chỉ tiêu năm 2026');
    return { ky: SYT_KY, src: 'Eform', lines: [
      uoL('Tỷ lệ bao phủ bảo hiểm y tế', uoFmt(bh, 2), '%', ct != null ? uoNote((bh >= ct ? 'đạt chỉ tiêu ' : 'chưa đạt ') + uoFmt(ct, 2) + '%', bh >= ct ? 'good' : 'bad') : ''),
      uoL('Người dân có hồ sơ sức khỏe điện tử', uoFmt(uoP(I, 3, 'Có hồ sơ sức khỏe điện tử'), 1), '%', ''),
      uoL('Ca mắc dịch bệnh nhóm A, B', uoFmt(uoSum(I, 2)), 'ca', ''),
      uoL('Ngộ độc thực phẩm', uoFmt(uoP(I, 0, 'Số vụ')), 'vụ', uoNote(uoFmt(uoP(I, 0, 'Người mắc, nhập viện')) + ' người mắc'))] };
  },
  'ubnd-vhtt': () => {
    const I = VHTT_ITEMS, qh = uoP(I, 0, 'Đang thực hiện, quá hạn'), tc = uoP(I, 5, 'Tiêu cực'), tin = uoSum(I, 5);
    return { ky: VHTT_KY, src: 'Eform', lines: [
      uoL('Nhiệm vụ Chương trình 08-CT', uoFmt(uoSum(I, 0)), 'nhiệm vụ', qh ? uoNote(uoFmt(qh) + ' quá hạn', 'bad') : ''),
      uoL('Dự án văn hóa, thể thao 2026–2030', uoFmt(uoP(I, 1, 'Dự án theo NQ 80')), 'dự án', uoNote(uoFmt(uoP(I, 1, 'Đã bố trí vốn')) + ' đã bố trí vốn')),
      uoL('Doanh thu đơn vị nghệ thuật', uoFmt(uoSum(I, 3)), 'triệu đồng', ''),
      uoL('Tin về Hà Nội trên báo chí, mạng xã hội', uoFmt(tin), 'tin', uoNote(uoFmt(uoPct(tc, tin), 1) + '% tiêu cực'))] };
  },
  'ubnd-noivu': () => {
    const I = SNV_ITEMS, giao = uoP(I, 2, 'Được giao'), th = uoP(I, 2, 'Thực hiện');
    return { ky: SNV_KY, src: 'Eform, file', lines: [
      uoL('Tham gia bảo hiểm xã hội', uoFmt(uoP(I, 0, 'Bảo hiểm xã hội'), 1), '%', ''),
      uoL('Tham gia bảo hiểm thất nghiệp', uoFmt(uoP(I, 0, 'Bảo hiểm thất nghiệp'), 1), '%', ''),
      uoL('Lao động qua đào tạo', uoFmt(uoP(I, 1, 'Lao động qua đào tạo (%)'), 1), '%', ''),
      uoL('Biên chế cấp xã thực hiện', uoFmt(th), 'người', uoNote(uoFmt(uoPct(th, giao), 1) + '% được giao'))] };
  },
  'ubnd-dantoc-tongiao': () => {
    const I = DTTG_ITEMS, kh = uoP(I, 0, 'Kế hoạch'), gn = uoP(I, 0, 'Giải ngân lũy kế'), dt = uoP(I, 1, 'Đình trệ');
    return { ky: DTTG_KY, src: 'Eform', lines: [
      uoL('Giải ngân vốn chương trình vùng DTTS', uoFmt(gn), 'tỷ đồng', uoNote(uoFmt(uoPct(gn, kh), 1) + '% kế hoạch')),
      uoL('Dự án, công trình hoàn thành', uoFmt(uoP(I, 1, 'Hoàn thành')), '/ ' + uoFmt(uoSum(I, 1)), dt ? uoNote(uoFmt(dt) + ' đình trệ', 'bad') : ''),
      uoL('Hộ nghèo dân tộc thiểu số', uoFmt(uoP(I, 2, 'Cuối kỳ')), 'hộ', uoDl(uoP(I, 2, 'Cuối kỳ'), uoP(I, 2, 'Đầu kỳ'), { inv: true, ref: 'đầu kỳ' })),
      uoL('Phường/xã chưa báo cáo', uoFmt(uoP(I, 3, 'Chưa báo cáo')), 'đơn vị', '')] };
  },
  'ubnd-vpubnd': () => {
    const I = VPUB_ITEMS, dh = uoP(I, 3, 'Đúng hạn'), qh = uoP(I, 3, 'Quá hạn'), nvqh = uoP(I, 2, 'Quá hạn chưa hoàn thành');
    return { ky: VPUB_KY, src: 'Eform', lines: [
      uoL('Văn bản xử lý trên môi trường mạng', uoFmt(uoPct(uoP(I, 0, 'Xử lý trên môi trường mạng'), uoP(I, 0, 'Tổng số')), 1), '%', ''),
      uoL('Hồ sơ thủ tục hành chính đúng hạn', uoFmt(uoPct(dh, dh + qh), 1), '%', ''),
      uoL('Nhiệm vụ Chính phủ, Thủ tướng giao', uoFmt(uoSum(I, 2)), 'nhiệm vụ', nvqh ? uoNote(uoFmt(nvqh) + ' quá hạn', 'bad') : ''),
      uoL('Phường/xã có trợ lý ảo', uoFmt(uoP(I, 1, 'Đã triển khai')), '/ ' + uoFmt(uoSum(I, 1)), '')] };
  },
  'ubnd-khcn': () => {
    const I = KHCN_ITEMS;
    return { ky: KHCN_KY, src: 'Eform', lines: [
      uoL('Hồ sơ trực tuyến toàn trình', uoFmt(uoP(I, 2, 'Hồ sơ trực tuyến toàn trình'), 1), '%', ''),
      uoL('Người dân có danh tính điện tử', uoFmt(uoP(I, 1, 'Có danh tính điện tử'), 1), '%', ''),
      uoL('Người dân có chữ ký số', uoFmt(uoP(I, 1, 'Có chữ ký số'), 1), '%', ''),
      uoL('Hộ có Internet cáp quang', uoFmt(uoP(I, 0, 'Hộ có Internet cáp quang'), 1), '%', '')] };
  },
  'ubnd-thanhtra': () => {
    const I = TTRA_ITEMS;
    return { ky: TTRA_KY, src: 'Eform', lines: [
      uoL('Cuộc thanh tra', uoFmt(uoP(I, 1, 'Cuộc thanh tra')), 'cuộc', uoNote(uoFmt(uoP(I, 1, 'Đã ban hành kết luận')) + ' đã kết luận')),
      uoL('Lượt tiếp công dân', uoFmt(uoP(I, 2, 'Lượt tiếp công dân')), 'lượt', ''),
      uoL('Đơn thư tiếp nhận', uoFmt(uoP(I, 2, 'Đơn thư tiếp nhận')), 'đơn', uoNote(uoFmt(uoP(I, 2, 'Vụ việc đã giải quyết')) + ' vụ đã giải quyết'))] };
  },
  'ubnd-xaydung': () => {
    const I = SXD_ITEMS, nha = uoSum(I, 0), vt = uoSum(I, 1), hh = uoP(I, 3, 'Hàng hóa (nghìn tấn)'), o = { ref: 'cùng kỳ' };
    return { ky: SXD_KY, src: 'Eform', lines: [
      uoL('Diện tích sàn nhà ở hoàn thành', uoFmt(nha), 'nghìn m²', uoDl(nha, SXD_NHA_CUNG_KY, o)),
      uoL('Hành khách vận tải', uoFmt(vt / 1000, 1), 'triệu lượt', uoDl(vt, SXD_VT_CUNG_KY, o)),
      uoL('Hàng hóa vận chuyển', uoFmt(hh / 1000, 1), 'triệu tấn', uoDl(hh, SXD_HH_CUNG_KY, o)),
      uoL('Điểm nguy cơ sạt lở, úng ngập', uoFmt(uoSum(I, 2)), 'điểm', '')] };
  },
  'ubnd-nnmt': () => {
    const I = NM_ITEMS, th = uoSum(I, 1), thCk = NM_TH_CUNG_KY.reduce((s, x) => s + x, 0);
    return { ky: NM_KY9, src: 'Eform, file', lines: [
      uoL('Xã đạt chuẩn nông thôn mới', uoFmt(uoSum(I, 0)), 'xã', uoNote(uoFmt(uoP(I, 0, 'Nông thôn mới kiểu mẫu')) + ' xã kiểu mẫu')),
      uoL('Diện tích rừng bị thiệt hại', uoFmt(th, 2), 'ha', uoDl(th, thCk, { inv: true, ref: 'cùng kỳ', d: 2 })),
      uoL('Rừng trồng mới tập trung', uoFmt(uoSum(I, 2), 1), 'ha', ''),
      uoL('Giải ngân chương trình nông thôn mới', uoFmt(uoSum(I, 3)), 'tỷ đồng', '')] };
  }
};
/* Số của một sở; lỗi (cấu hình đổi tên trường...) thì trả null để thẻ rơi về danh sách chỉ tiêu cũ, không làm vỡ cả màn. */
function ubndOvData(id) {
  const C = ubndOvFromCtm(id);
  if (C) return C;
  const f = UBND_OV_SPECS[id];
  if (!f) return null;
  try { return f(); } catch (e) { if (typeof console !== 'undefined') console.warn('[ubnd-overview] ' + id, e); return null; }
}

/* Dòng thẻ ngoài lấy từ cấu hình chi tiết khuôn mới của sở (ctm-so.js). Dòng mang khóa chỉ tiêu (k) để ô số then chốt chọn theo khóa. */
function ubndOvFromCtm(id) {
  if (!UBND_OV_FROM_CTM || typeof CTM_SPECS === 'undefined' || typeof ctmOvLines !== 'function') return null;
  const spec = CTM_SPECS[id];
  if (!spec || spec.enabled === false || (spec.level || 'city') !== 'city') return null;
  try {
    return { ky: ctmPLabel(spec, ctmCurPid(spec)), src: 'Eform', lines: ctmOvLines(spec).map((x) => ({ k: x.k, l: x.l, v: x.v, u: x.u, d: '' })) };
  } catch (e) { if (typeof console !== 'undefined') console.warn('[ubnd-overview] ' + id, e); return null; }
}

/* ---------- Dựng HTML ---------- */
function ubndOvLineHtml(x) {
  if (!UBND_OV_SHOW_COMPARE) return '<div class="uo-gl uo-col"><span class="uo-l">' + uoE(x.l) + '</span><span class="uo-v">' + x.v + '</span><span class="uo-u">' + uoE(x.u) + '</span></div>';
  return '<div class="uo-gl"><span class="uo-l">' + uoE(x.l) + '</span><span class="uo-v">' + x.v + (x.u ? '<small>' + uoE(x.u) + '</small>' : '') + '</span><span class="uo-d">' + (x.d || '') + '</span></div>';
}
function ubndOvKpiHtml(k, D, role, index) {
  const S = D[k.cat], L = S && S.lines, byKey = k.m && L ? L.find((y) => y.k === k.m) : null, x = byKey || (L && (k.m && L.some((y) => y.k) ? null : L[k.line]));
  const d = x && x.d ? x.d : '<span class="stc-dl na">Chưa có kỳ so sánh</span>';
  /* Số và đơn vị cùng một hàng (anh yêu cầu 2026-10-06); "%" dính liền vào số. k.u ghi đè đơn vị khi nhãn ô đã nói rõ. */
  const u = x ? (k.u != null ? k.u : x.u) : '';
  const val = x ? x.v + (u === '%' ? '<small class="uo-pct">%</small>' : u ? '<small>' + uoE(u) + '</small>' : '') : '—';
  return '<button type="button" class="stc-kpi uo-kpi" data-uv-item="ubnd-kpi-' + index + '" data-uv-label="' + uoE(k.label) + '" data-uv-icon="📊" data-uv-parent="ubndIndicatorOverview" onclick="openCategoryDetail(\'' + role + '\',\'' + k.cat + '\')">' +
    '<div class="stc-lb">' + uoE(k.label) + '</div><div class="stc-v">' + val + '</div>' + (x ? '' : '<div class="stc-u">Chưa có số liệu</div>') +
    (UBND_OV_SHOW_COMPARE ? '<div class="uo-kd">' + (x ? d : '') + '</div>' : '') + '<div class="uo-ksrc">' + uoE((UBND_OV_SHORT[k.cat] || k.cat) + (S && S.ky ? ' · ' + S.ky : '')) + '</div></button>';
}
function ubndOvGroupHtml(g, cats, D) {
  const list = g.ids.map((id) => cats.find((c) => c.id === id)).filter(Boolean);
  const nInd = list.reduce((s, c) => s + ((D[c.id] && D[c.id].lines.length) || (c.items || []).length), 0);
  const rows = list.map((c) => {
    const x = D[c.id] && D[c.id].lines[0];
    if (!UBND_OV_SHOW_COMPARE) return '<div class="uo-gl uo-grow uo-col"><span class="uo-l"><b>' + uoE(UBND_OV_SHORT[c.id] || c.name) + '</b><em>' + uoE(x ? x.l : '') + '</em></span><span class="uo-v">' + (x ? x.v : '—') + '</span><span class="uo-u">' + uoE(x ? x.u : '') + '</span></div>';
    return '<div class="uo-gl uo-grow"><span class="uo-l"><b>' + uoE(UBND_OV_SHORT[c.id] || c.name) + '</b><em>' + uoE(x ? x.l : '') + '</em></span><span class="uo-r"><span class="uo-v">' + (x ? x.v + (x.u ? '<small>' + uoE(x.u) + '</small>' : '') : '—') + '</span><span class="uo-d">' + (x && x.d ? x.d : '') + '</span></span></div>';
  }).join('');
  const on = UBND_OV_GROUP === g.id;
  return '<button type="button" class="stc-gcard uo-gcard' + (on ? ' on' : '') + '" data-uv-item="ubnd-group-' + g.id + '" data-uv-label="' + uoE(g.label) + '" data-uv-icon="🗂️" data-uv-parent="ubndIndicatorOverview" aria-pressed="' + on + '" onclick="ubndOvPick(\'' + g.id + '\')"><div class="stc-gh"><h3>' + uoE(g.label) + '</h3><span>' + list.length + ' sở, ngành · ' + nInd + ' chỉ tiêu</span></div>' + rows +
    '<div class="stc-gmore">' + (on ? 'Đang lọc · bấm lần nữa để bỏ lọc' : 'Lọc ' + list.length + ' sở, ngành ›') + '</div></button>';
}
function ubndOvGroupOf(id) { const g = UBND_OV_GROUPS.find((x) => x.ids.indexOf(id) >= 0); return g ? g.label : ''; }
function ubndOvCardHtml(c, D) {
  const S = D[c.id];
  let body, foot;
  if (c.noItems || !(c.items || []).length) {
    body = '<div class="uo-empty">' + uoE(c.desc || 'Đơn vị chưa có chỉ tiêu.') + '</div>';
    foot = '<span>Chưa có chỉ tiêu</span>';
  } else if (S) {
    body = S.lines.length ? S.lines.map(ubndOvLineHtml).join('') : '<div class="uo-empty">' + uoE(S.none || 'Chưa có số liệu.') + '</div>';
    const flag = !UBND_OV_SHOW_DEMO_FLAG ? '' : S.flag != null ? S.flag : 'SỐ GIẢ LẬP';
    foot = '<span>' + uoE((S.ky || '—') + ' · ' + (S.src || '')) + '</span>' + (flag ? '<b>' + uoE(flag) + '</b>' : '');
  } else {
    /* Sở chưa khai báo trong UBND_OV_SPECS (hoặc cấu hình lỗi): liệt kê tên chỉ tiêu như thẻ cũ. */
    body = (c.items || []).slice(0, 5).map((it) => '<div class="uo-gl"><span class="uo-l">' + uoE(it[0]) + '</span><span></span><span></span></div>').join('');
    foot = '<span>' + uoE((c.types || []).join(', ')) + '</span>';
  }
  const grp = ubndOvGroupOf(c.id);
  return '<button type="button" class="uo-card" onclick="openCategoryDetail(\'' + c.role + '\',\'' + c.id + '\')">' +
    '<div class="uo-meta"><span class="uo-ax">UBND TP</span><span class="uo-n">' + (c.items || []).length + ' chỉ tiêu</span>' + (grp ? '<span class="uo-grp">' + uoE(grp) + '</span>' : '') + '</div>' +
    '<h4>' + uoE(c.name) + '</h4><div class="uo-lines">' + body + '</div><div class="uo-foot">' + foot + '</div></button>';
}
/* cats: các lĩnh vực trục UBND sau khi lọc theo ô tìm kiếm (đã gắn role). */
function ubndOverviewHtml(cats) {
  const all = (typeof categorySeedForRole === 'function' ? categorySeedForRole('UBND') : cats).map((c) => Object.assign({}, c, { role: 'UBND' }));
  const D = {};
  all.forEach((c) => { if (!c.noItems) { const d = ubndOvData(c.id); if (d) D[c.id] = d; } });
  const nSo = all.filter((c) => D[c.id]).length;
  const g = UBND_OV_GROUPS.find((x) => x.id === UBND_OV_GROUP);
  if (!g) UBND_OV_GROUP = 'all';
  const shown = g ? cats.filter((c) => g.ids.indexOf(c.id) >= 0) : cats;

  let h = '<div class="stc-root uo-root">';
  h += '<section class="uo-band" id="uoOverviewBand"><div class="uo-head"><div><div class="stc-eyebrow">Tổng quan · UBND Thành phố</div><h2>Số liệu then chốt của ' + nSo + ' sở, ngành</h2></div>' +
    '<p class="uo-hint">Mỗi ô ghi rõ sở cung cấp và kỳ số liệu · bấm ô để mở chi tiết của sở' + (UBND_OV_SHOW_DEMO_FLAG ? ' · phần lớn số liệu là giả lập' : '') + '</p></div>';
  h += '<div class="uo-kscroll"><div class="uo-kpis">' + UBND_OV_KPIS.map((k, index) => ubndOvKpiHtml(k, D, 'UBND', index)).join('') + '</div></div>';
  h += '<div class="uo-secrow"><div class="stc-sec">Bốn nhóm lĩnh vực · bấm một nhóm để lọc danh sách sở bên dưới</div>' +
    '<button type="button" class="uo-all' + (g ? '' : ' on') + '" onclick="ubndOvPick(\'all\')">Tất cả ' + all.length + ' đơn vị</button></div>';
  h += '<div class="uo-groups">' + UBND_OV_GROUPS.map((x) => ubndOvGroupHtml(x, all, D)).join('') + '</div></section>';
  h += '<div class="uo-secrow uo-gridhead"><div class="stc-sec">' + (g ? uoE(g.label) + ' · ' + shown.length + ' sở, ngành' : shown.length + ' sở, ngành') + ' · bấm thẻ để xem chi tiết của sở</div>' +
    (UBND_OV_SHOW_COMPARE ? '<div class="uo-legend"><span class="stc-dl up">tốt lên</span><span class="stc-dl down">xấu đi</span><span class="stc-dl up n">chỉ để theo dõi</span></div>' : '') + '</div>';
  h += shown.length ? '<div class="uo-grid">' + shown.map((c) => ubndOvCardHtml(c, D)).join('') + '</div>' : '<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>';
  return h + '</div>';
}
/* Chỉ áp cho lưới trục UBND cấp Thành phố (tài khoản UBND, hoặc tab UBND của tài khoản Thành ủy). */
function ubndOverviewApplies(roles) {
  return UBND_OVERVIEW_ENABLED && (typeof currentXaId === 'undefined' || currentXaId == null) && roles && roles.length === 1 && roles[0] === 'UBND';
}
function ubndOvPick(id) {
  UBND_OV_GROUP = id === 'all' || UBND_OV_GROUP === id ? 'all' : id;
  if (typeof renderCategoryGrid === 'function') renderCategoryGrid();
}
