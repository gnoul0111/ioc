/* ============================== SỞ GIÁO DỤC VÀ ĐÀO TẠO — CẤU HÌNH BỘ CHỈ TIÊU MỚI ==============================
   Theo bản dựng thiết kế đã duyệt (canvas "Chỉ tiêu Sở GD&ĐT - bản dựng"), cùng khuôn với bộ chỉ tiêu Sở Tài chính.
   Nguồn dự kiến: 18 API Sở GD&ĐT (thư mục api/API_SGDDT, hiện CHỈ CÓ SCHEMA, chưa có bản ghi thật), dữ liệu theo từng
   trường, gộp lên 126 phường/xã (MA_XA) và toàn Thành phố. Trong lúc chưa có số thật, form dùng SỐ LIỆU GIẢ LẬP
   (js/features/sgd-data.js), luôn gắn nhãn "DỮ LIỆU GIẢ LẬP".
   Nạp TRƯỚC central-level.js vì central-level.js dùng SGD_ITEMS / SGD_SHOW_LEGACY. */

/* true = hiện lại bộ chỉ tiêu CŨ của Sở GD&ĐT (3 chỉ tiêu + dashboard-education.js). Ẩn bằng cờ, code cũ giữ nguyên. */
const SGD_SHOW_LEGACY = false;

/* true = hiện thêm 6 thẻ nhóm rút gọn NGOÀI lưới chỉ tiêu, bên dưới băng Tổng quan. Đang tắt vì băng Tổng quan
   (7 ô KPI + thẻ nhóm, bấm mở thẳng đúng màn) đã thay thế — giống cờ STC_SHOW_OUTER_GROUP_CARDS của Sở Tài chính. */
const SGD_SHOW_OUTER_GROUP_CARDS = false;

/* Năm học có số liệu (MA_NAM_HOC = năm bắt đầu năm học). Năm đầu danh sách là năm mặc định. */
const SGD_YEARS = [2025, 2024];
function sgdYearLabel(y) { return y + '–' + (y + 1); }

const SGD_GROUPS = [
  { id: 'ml', label: 'Mạng lưới trường học', src: 'hoso_truong_mn · _c1 · _c2 · _c3 · _gdtx', note: 'Đủ 5 cấp học' },
  { id: 'hs', label: 'Học sinh và lớp học', src: 'thongke_hocsinh · thongke_lophoc · thongke_hocsinhdienchinhsach', note: 'Tiểu học và THCS' },
  { id: 'vc', label: 'Cơ sở vật chất', src: 'thongke_phonghoc_c1 · _c2', note: 'Tiểu học và THCS' },
  { id: 'dn', label: 'Đội ngũ', src: 'thongke_nhansu_c1 · _c2', note: 'Tiểu học và THCS' },
  { id: 'sk', label: 'Sức khỏe và điều kiện học', src: 'thongke_hocsinhsuckhoe_c1 · _c2', note: 'Tiểu học và THCS' }
];

/* Các GIẢ ĐỊNH chưa được Sở GD&ĐT xác nhận — sửa ở đây khi có thông tin thật (hiện ở màn "Nguồn dữ liệu"). */
const SGD_ASSUME = [
  'MA_NAM_HOC là năm bắt đầu năm học: 2025 = năm học 2025–2026.',
  'MA_GIAI_DOAN có hai giá trị: đầu năm học và cuối năm học; form lấy đầu năm học.',
  'MA_KHOI là 1–9 tương ứng lớp 1–9.',
  'MA_LOAI_HINH_TRUONG chia công lập / ngoài công lập (chưa có danh mục mã).',
  'MA_DAT_CHUAN_DANH_GIA_CLGD khác rỗng là trường đạt chuẩn quốc gia (chưa rõ các mức).',
  'SO_PH_* là số học sinh có phụ huynh đáp ứng điều kiện, nên chia cho HS_TONG_SO.',
  'Trường có IS_GIAI_THE hoặc TRANG_THAI ngừng hoạt động bị loại khỏi mọi phép đếm.'
];
const SGD_NORMS = {
  sisoMax: { th: 35, cs: 45 },          // sĩ số tối đa theo điều lệ trường (tham chiếu, cần Sở xác nhận)
  gvPerLop: { th: 1.5, cs: 1.9 }        // định mức giáo viên/lớp, trường 2 buổi/ngày (tham chiếu, cần Sở xác nhận)
};

/* Tổng toàn Thành phố [năm học 2025–2026, năm học 2024–2025] dùng để SINH SỐ GIẢ LẬP (sgd-data.js chia các tổng này cho
   126 phường/xã và từng trường, nên số mọi cấp cộng lại luôn khớp). null = API chưa có kỳ so sánh. Khi có API thật thì bỏ
   bảng này: số Thành phố sẽ là tổng cộng dồn từ bản ghi từng trường. */
const SGD_TARGETS = {
  tr_mn: [1180, 1170], tr_th: [812, 810], tr_cs: [640, 636], tr_pt: [245, 241], tr_tx: [86, 84],
  cq_mn: [640, 610], cq_th: [560, 552], cq_cs: [470, 460], cq_pt: [170, 160], cq_tx: [28, 24],
  ncl: [1058, 1041], qt: [42, 40],
  dien: [2960, 2936], nuoc: [2951, 2925], vs: [2957, 2932], mt: [2880, 2840], inet: [2859, 2815], hb: [806, 802],
  hs_th: [756790, 748200], hs_cs: [652108, 631400],
  hs_k1: [148900, 146500], hs_k2: [152300, 150800], hs_k3: [155600, 151900], hs_k4: [150100, 149400], hs_k5: [149890, 149600],
  hs_k6: [168200, 163100], hs_k7: [165400, 160900], hs_k8: [161300, 156200], hs_k9: [157208, 151200],
  lop_th: [21620, 21300], lop_cs: [15310, 14920],
  lop_k1: [4260, 4190], lop_k2: [4380, 4300], lop_k3: [4470, 4330], lop_k4: [4280, 4250], lop_k5: [4230, 4230],
  lop_k6: [3960, 3860], lop_k7: [3880, 3780], lop_k8: [3780, 3690], lop_k9: [3690, 3590],
  dcs_th: [21480, 21900], dcs_cs: [18930, 19300],
  kc_th: [18650, 18050], kc_cs: [12610, 12230], bk_th: [1080, 1230], bk_cs: [590, 680], tm_th: [110, 140], tm_cs: [60, 70],
  ql_th: [2180, 2170], ql_cs: [1740, 1730], gv_th: [32888, 32300], gv_cs: [30691, 30050], nv_th: [6452, 6430], nv_cs: [5029, 4940],
  can_th: [128650, 124200], can_cs: [221720, 208500],
  loan: [41260, 38630], vien: [6810, 6900], kho: [3150, 3100], lac: [2460, 2420], duc: [120, 118], thd: [40, 40], mk: [5380, 5362],
  boi_th: [302720, 290500], boi_cs: [339100, 315000],
  sp: [1296190, null], pc: [1028500, null]
};

/* Lưới chỉ tiêu của IOC: 1 thẻ TỔNG QUAN (băng rộng cả hàng) + 5 thẻ NHÓM + 1 thẻ "Theo 126 phường/xã", dạng
   [tên, số bản ghi, tần suất, nguồn] cho categorySeed (central-level.js). Số bản ghi = 0 để hệ thống demo KHÔNG sinh
   bản ghi giả; sgdKey nối thẻ với màn tương ứng trong form mới (dashboard-sgd.js). */
function sgdItem(label, key) { const it = [label, 0, 'Năm học', 'API Sở GD&ĐT (giả lập)']; it.sgdKey = key; return it; }
const SGD_ITEMS = [sgdItem('Tổng quan', 'home')]
  .concat(SGD_GROUPS.map((g) => sgdItem(g.label, g.id)))
  .concat([sgdItem('Chỉ tiêu theo 126 phường/xã', 'xa')]);
