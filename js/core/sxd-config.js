/* ============================== SỞ XÂY DỰNG — 4 CHỈ TIÊU THEO 4 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở Xây dựng"), 4 eform → 4 chỉ tiêu:
     1. Nhà ở (eform "Tổng hợp chỉ số thống kê qđ (chỉ số 20)") — bản ghi = 1 phường/xã × loại công trình × tình trạng × kỳ
     2. Vận tải hành khách cấp đơn vị vận tải (chỉ số 24) — bản ghi = 1 doanh nghiệp/hợp tác xã vận tải × kỳ
     3. Nguy cơ sạt lở, úng ngập (chỉ số 84) — bản ghi = 1 điểm nguy cơ trên tuyến đường (có tọa độ)
     4. Thu thập dữ liệu vận tải (chỉ số 68, 69) — bản ghi = 1 địa bàn × đối tượng (hành khách/hàng hóa) × loại hình vận tải × kỳ
   Số hiệu "chỉ số 20, 24, 84, 68, 69" chỉ ghi ở tài liệu, KHÔNG hiện trên giao diện. Khuôn hiển thị chung (xem dashboard-sxd.js).
   Bộ chỉ tiêu cũ (STT 20, 84) đã xóa.

   SỐ GIẢ LẬP đặt theo bậc độ lớn số thật đã công bố (quy về 9 tháng năm 2026):
   - Đường sắt đô thị quý I/2025: 4,78 triệu lượt (Cát Linh – Hà Đông 3,23 triệu; Nhổn – Ga Hà Nội 1,49 triệu), +13,3%.
   - Xe buýt: hơn 6,5 triệu lượt trong 9 ngày Tết 2025 (khoảng 0,7 triệu lượt/ngày).
   - Nhà ở xã hội: 69 dự án, 4,17 triệu m² sàn (73.300 căn); kế hoạch 2021-2025: 19,73 triệu m² nhà ở thương mại, 22,5 triệu m² nhà ở riêng lẻ.
   - Doanh thu vận tải 4 tháng 2025: 83,6 nghìn tỷ đồng (+18,7%). Khối lượng vận chuyển, luân chuyển của Hà Nội chưa tìm được số công bố —
     giả lập ~13% số cả nước (cả nước 2025: 3.027,7 triệu tấn hàng hóa, 612,3 tỷ tấn.km).
   Nạp TRƯỚC central-level.js (central-level.js dùng SXD_ITEMS). Không dùng hàm nào của file khác. */

const SXD_KY = '9 tháng năm 2026';
const SXD_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];
function sxdN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function sxdSum(a) { return a.reduce((s, v) => s + v, 0); }
function sxdHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function sxdR(name, key) { return (sxdHash(name + '|' + key) % 10000) / 10000; }
function sxdSplit(total, w) {
  const ws = sxdSum(w) || 1, raw = w.map((x) => total * x / ws), base = raw.map(Math.floor);
  raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, total - sxdSum(base)).forEach((x) => base[x[1]]++);
  return base;
}

/* ---------- 126 phường/xã ---------- */
const SXD_DV = [
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
/* khu vực đô thị hóa mạnh (nhiều dự án nhà ở) */
const SXD_PHAT_TRIEN = { 'Phường Tây Mỗ': 3, 'Phường Đại Mỗ': 2.6, 'Phường Xuân Phương': 2.4, 'Phường Dương Nội': 2.6, 'Phường Hoàng Liệt': 2.2, 'Phường Yên Sở': 2.2,
  'Phường Long Biên': 2.4, 'Phường Phúc Lợi': 2.4, 'Phường Thượng Cát': 2, 'Phường Tây Tựu': 2, 'Xã Gia Lâm': 2.6, 'Xã Đông Anh': 2.8, 'Xã Thiên Lộc': 1.8,
  'Xã Hoài Đức': 2.4, 'Xã An Khánh': 2.4, 'Xã Thanh Trì': 2.2, 'Xã Đại Thanh': 1.8, 'Phường Kiến Hưng': 2, 'Phường Yên Nghĩa': 2, 'Phường Phú Diễn': 1.8 };
const SXD_TT = ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình', 'Phường Đống Đa', 'Phường Hai Bà Trưng', 'Phường Cầu Giấy', 'Phường Thanh Xuân', 'Phường Hà Đông', 'Phường Giảng Võ'];

/* ================= 1. NHÀ Ở ================= */
const SXD_LCT = [['Nhà ở riêng lẻ', '#2a78d6'], ['Chung cư', '#7086FD'], ['Nhà ở xã hội', '#1baf7a'], ['Nhà ở công vụ', '#898781'], ['Nhà ở tái định cư', '#39d5ff'],
  ['Biệt thự', '#eda100'], ['Nhà liền kề', '#FD9843'], ['Khác', '#8ba7c2']];
const SXD_TTCT = [['Đã cấp phép', '#8ba7c2'], ['Đang thi công', '#2a78d6'], ['Đã hoàn thành', '#1baf7a'], ['Đưa vào sử dụng', '#6FD195']];
/* Mỗi bản ghi eform là số PHÁT SINH trong kỳ của một «Tình trạng công trình» (cấp phép mới, khởi công mới, hoàn thành mới, đưa vào sử dụng mới).
   Một công trình đi qua cả 4 tình trạng nên KHÔNG cộng các tình trạng với nhau (phản hồi nhóm triển khai 13/10/2026, BA mục 68 – 71):
   số chính, bảng 126 xã, biểu đồ theo loại, theo tháng chỉ lấy «Tình trạng công trình» = Đã hoàn thành.
   [số công trình hoàn thành 9 tháng, diện tích sàn hoàn thành 9 tháng (nghìn m²), số tầng bình quân, tỷ lệ diện tích xây dựng / diện tích sàn,
    diện tích của 4 tình trạng so với diện tích hoàn thành (hoàn thành = 1)] — năm 2020 riêng nhà ở thương mại hoàn thành ~6,57 triệu m² sàn. */
const SXD_NHA = [
  [11850, 3420, 4.6, 0.22, [1.12, 1.06, 1, 0.94]], [46, 2580, 27, 0.04, [1.2, 1.35, 1, 0.9]], [21, 760, 18, 0.06, [1.3, 1.45, 1, 0.85]],
  [2, 18, 9, 0.11, [0, 1, 1, 1]], [9, 210, 15, 0.07, [1.1, 1.25, 1, 0.92]], [640, 290, 3.6, 0.28, [1.08, 1.04, 1, 0.95]],
  [1980, 820, 4.8, 0.21, [1.1, 1.08, 1, 0.93]], [260, 95, 3.2, 0.31, [1.05, 1.02, 1, 0.96]]
];
const SXD_NHA_MUA = [1.05, 0.62, 1.0, 1.08, 1.1, 1.05, 1.02, 1.03, 1.05];
const SXD_NHA_CUNG_KY = 7620;                     // diện tích sàn hoàn thành 9 tháng 2025 (nghìn m²)

/* ================= 2. VẬN TẢI HÀNH KHÁCH — ĐƠN VỊ VẬN TẢI ================= */
const SXD_NGANH = ['Đường bộ', 'Đường sắt', 'Đường thủy nội địa', 'Hàng hải', 'Hàng không', 'Đường sắt đô thị (Metro)'];
const SXD_LH = ['Vận tải công cộng (xe buýt)', 'Tuyến cố định', 'Hợp đồng', 'Taxi', 'Khác'];
/* Eform nhập hành khách bằng lượt (HK), hàng hóa bằng tấn (chốt theo bản trả lời BA, mục 62 – 67); IOC chia 1.000,
   hiển thị nghìn lượt, nghìn tấn ở mọi chỗ — số trong cấu hình này đã là nghìn lượt, nghìn tấn. */
/* nhóm đơn vị: [tên hiển thị, ngành, loại hình, số đơn vị, lượt hành khách 9 tháng (nghìn), cự ly bình quân (km), màu] */
const SXD_VT = [
  ['Xe buýt', 0, 0, 14, 252400, 9.2, '#2a78d6'], ['Taxi', 0, 3, 96, 98300, 11.8, '#eda100'], ['Xe hợp đồng', 0, 2, 910, 64100, 86, '#7086FD'],
  ['Tuyến cố định (liên tỉnh)', 0, 1, 218, 41200, 142, '#4a3aa7'], ['Đường sắt đô thị', 5, 4, 1, 16120, 8.6, '#1baf7a'],
  ['Đường sắt quốc gia', 1, 4, 1, 2380, 168, '#898781'], ['Đường thủy nội địa', 2, 4, 12, 1210, 14, '#39d5ff']
];
const SXD_METRO = [['Cát Linh – Hà Đông', 10560], ['Nhổn – Ga Hà Nội', 5560]];   // nghìn lượt, 9 tháng
/* Eform chỉ số 24 KHÔNG có trường «Tuyến» → số theo tuyến không có nguồn: ẩn mọi chỗ hiện số theo tuyến (giữ số, đặt true để hiện lại). */
const SXD_SHOW_METRO_TUYEN = false;
const SXD_VT_CUNG_KY = 434600;                    // nghìn lượt hành khách 9 tháng 2025
const SXD_VT_MUA = [1.04, 0.86, 1.02, 1.02, 1.03, 0.98, 0.96, 0.98, 1.11];

/* ================= 3. NGUY CƠ SẠT LỞ, ÚNG NGẬP ================= */
const SXD_LNC = [['Sạt lở', '#eda100'], ['Úng ngập', '#2a78d6'], ['Sạt lở và úng ngập', '#d33a44'], ['Nguy cơ khác', '#898781']];
const SXD_MD = [['Thấp', '#8ba7c2'], ['Trung bình', '#eda100'], ['Cao', '#FD9843'], ['Rất cao', '#d33a44']];
const SXD_TTXL = [['Chưa xử lý', '#d33a44'], ['Đang xử lý', '#2a78d6'], ['Đã xử lý', '#1baf7a'], ['Theo dõi định kỳ', '#8ba7c2']];
/* điểm nguy cơ: [tuyến đường, địa bàn, loại, vĩ độ, kinh độ, cấp báo cáo (0 xã/phường, 1 sở)] — vị trí gần đúng, số liệu giả lập */
const SXD_DIEM_SPEC = [
  ['Nguyễn Trãi', 'Phường Thanh Xuân', 1, 20.9935, 105.8098, 1], ['Khuất Duy Tiến', 'Phường Thanh Xuân', 1, 20.9972, 105.7996, 1], ['Lê Văn Lương', 'Phường Yên Hòa', 1, 21.0052, 105.8051, 1],
  ['Trần Duy Hưng', 'Phường Yên Hòa', 1, 21.0108, 105.8006, 1], ['Phạm Văn Đồng', 'Phường Nghĩa Đô', 1, 21.0461, 105.7807, 1], ['Hoàng Quốc Việt', 'Phường Nghĩa Đô', 1, 21.0461, 105.7951, 1],
  ['Nguyễn Xiển', 'Phường Khương Đình', 1, 20.9871, 105.8086, 1], ['Giải Phóng', 'Phường Hoàng Liệt', 1, 20.9748, 105.8411, 1], ['Nguyễn Văn Cừ', 'Phường Bồ Đề', 1, 21.0458, 105.8732, 0],
  ['Đường Láng', 'Phường Láng', 1, 21.0155, 105.8079, 0], ['Phố Huế', 'Phường Hai Bà Trưng', 1, 21.0142, 105.8516, 0], ['Lý Thường Kiệt', 'Phường Cửa Nam', 1, 21.0251, 105.8467, 0],
  ['Đại lộ Thăng Long', 'Phường Tây Mỗ', 1, 21.0011, 105.7387, 1], ['Quang Trung', 'Phường Hà Đông', 1, 20.9682, 105.7748, 0], ['Phúc Diễn', 'Phường Phú Diễn', 1, 21.0423, 105.7586, 0],
  ['Nguyễn Hữu Thọ', 'Phường Hoàng Liệt', 1, 20.9719, 105.8285, 0], ['Tam Trinh', 'Phường Hoàng Mai', 1, 20.9913, 105.8649, 0], ['Phạm Hùng', 'Phường Từ Liêm', 1, 21.0306, 105.7814, 1],
  ['Hồ Tùng Mậu', 'Phường Phú Diễn', 1, 21.0385, 105.7719, 0], ['Minh Khai', 'Phường Vĩnh Tuy', 1, 20.9975, 105.8635, 0], ['Kim Giang', 'Phường Định Công', 1, 20.9781, 105.8188, 0],
  ['Lê Trọng Tấn', 'Phường Dương Nội', 1, 20.9781, 105.7569, 0], ['Nguyễn Xiển (dưới cầu cạn Vành đai 3)', 'Phường Thanh Liệt', 1, 20.9838, 105.8162, 1], ['Ngọc Hồi', 'Xã Ngọc Hồi', 1, 20.9286, 105.8424, 0],
  ['Quốc lộ 6', 'Phường Chương Mỹ', 1, 20.9184, 105.7178, 1], ['Quốc lộ 6', 'Xã Xuân Mai', 1, 20.8975, 105.5781, 1], ['Đường Hồ Chí Minh', 'Xã Trần Phú', 1, 20.8622, 105.5642, 1],
  ['Tỉnh lộ 419', 'Xã Quốc Oai', 1, 20.9921, 105.6407, 0], ['Đê La Thành', 'Phường Ô Chợ Dừa', 1, 21.0196, 105.8268, 0], ['Văn Cao', 'Phường Ngọc Hà', 1, 21.0388, 105.8166, 0],
  ['Nguyễn Khánh Toàn', 'Phường Cầu Giấy', 1, 21.0378, 105.8001, 0], ['Phan Văn Trường', 'Phường Cầu Giấy', 1, 21.0367, 105.7849, 0], ['Trường Chinh', 'Phường Kim Liên', 1, 20.9997, 105.8364, 0],
  ['Nguyễn Chí Thanh', 'Phường Láng', 1, 21.0187, 105.8105, 0],
  ['Tỉnh lộ 87', 'Xã Ba Vì', 0, 21.0778, 105.3786, 1], ['Tỉnh lộ 87', 'Xã Yên Bài', 0, 21.0436, 105.4192, 1], ['Đường Hồ Chí Minh', 'Xã Hòa Lạc', 0, 20.9822, 105.5303, 1],
  ['Tỉnh lộ 414', 'Xã Suối Hai', 0, 21.0681, 105.4167, 0], ['Đường lên Vườn quốc gia Ba Vì', 'Xã Ba Vì', 0, 21.0553, 105.3681, 1], ['Quốc lộ 21A', 'Xã Hòa Lạc', 0, 21.0236, 105.5292, 1],
  ['Đường đê Đà', 'Xã Bất Bạt', 0, 21.1611, 105.3542, 1], ['Đường ven sông Hồng', 'Xã Phúc Thọ', 0, 21.1186, 105.5625, 0], ['Đường ven sông Hồng', 'Xã Hát Môn', 0, 21.1306, 105.5911, 0],
  ['Đường đê tả Đáy', 'Xã Mỹ Đức', 0, 20.6908, 105.7314, 0], ['Đường vào chùa Hương', 'Xã Hương Sơn', 0, 20.6178, 105.7489, 1], ['Tỉnh lộ 424', 'Xã Hồng Sơn', 0, 20.6889, 105.7697, 0],
  ['Đường Sóc Sơn – Đền Sóc', 'Xã Sóc Sơn', 0, 21.2647, 105.8358, 0], ['Quốc lộ 2', 'Xã Kim Anh', 0, 21.2633, 105.7633, 1], ['Đường đê sông Hồng', 'Xã Chương Dương', 0, 20.8572, 105.8981, 0],
  ['Đường đê sông Hồng', 'Xã Thường Tín', 0, 20.8569, 105.8711, 0], ['Đường ven sông Đuống', 'Xã Phù Đổng', 0, 21.0739, 105.9472, 0], ['Đê Hữu Hồng', 'Xã Đan Phượng', 0, 21.1194, 105.6703, 0],
  ['Quốc lộ 6', 'Xã Trần Phú', 2, 20.8833, 105.5961, 1], ['Đường Hồ Chí Minh', 'Xã Xuân Mai', 2, 20.8953, 105.5764, 1], ['Tỉnh lộ 87', 'Xã Suối Hai', 2, 21.0794, 105.4064, 0],
  ['Đường đê tả Đáy', 'Phường Chương Mỹ', 2, 20.9236, 105.6956, 0], ['Tỉnh lộ 419', 'Xã Phú Cát', 2, 20.9686, 105.5925, 0], ['Đường ven sông Tích', 'Xã Quốc Oai', 2, 20.9853, 105.6217, 0],
  ['Cầu vượt Mai Dịch', 'Phường Từ Liêm', 3, 21.0381, 105.7778, 1], ['Hầm chui Kim Liên', 'Phường Kim Liên', 3, 21.0081, 105.8389, 1]
];
/* hạng của mỗi điểm trong loại của nó (0 – 1), dùng chia mức độ theo đúng tỷ lệ dự kiến */
const SXD_HANG = SXD_DIEM_SPEC.map((r, i) => { const cung = SXD_DIEM_SPEC.map((x, j) => [x[2], sxdR('nc' + j, 'm')]).filter((x) => x[0] === r[2]);
  return cung.filter((x) => x[1] < sxdR('nc' + i, 'm')).length / cung.length; });
const SXD_DIEM = SXD_DIEM_SPEC.map((r, i) => {
  const k = 'nc' + i, R = (s) => (s === 'm' ? SXD_HANG[i] : sxdR(k, s)), loai = r[2];
  /* mức độ nguy cơ: điểm vừa sạt lở vừa úng ngập luôn cao; sạt lở cao hơn úng ngập; phần lớn ở mức trung bình, thấp */
  const md = loai === 2 ? (R('m') < 0.4 ? 3 : 2) : loai === 0 ? (R('m') < 0.15 ? 3 : R('m') < 0.45 ? 2 : R('m') < 0.85 ? 1 : 0) : loai === 1 ? (R('m') < 0.08 ? 3 : R('m') < 0.3 ? 2 : R('m') < 0.75 ? 1 : 0) : 1;
  const tt = R('t') < 0.22 ? 0 : R('t') < 0.55 ? 1 : R('t') < 0.75 ? 2 : 3;
  return { duong: r[0], diaBan: r[1], loai: loai, lat: r[3], lon: r[4], cap: r[5], muc: md, tt: md === 3 && tt === 0 ? 1 : tt,
    dai: Math.round((loai === 1 ? 120 + 480 * R('d') : 40 + 260 * R('d')) / 10) * 10 };
});

/* ================= 4. THU THẬP DỮ LIỆU VẬN TẢI (theo địa bàn) ================= */
const SXD_LHVT = ['Đường bộ', 'Đường sắt', 'Đường thủy nội địa', 'Hàng hải', 'Hàng không', 'Đường sắt đô thị'];
/* hàng hóa 9 tháng: [khối lượng vận chuyển (nghìn tấn), cự ly bình quân (km)] theo loại hình (thứ tự SXD_LHVT).
   Cả nước năm 2025 vận chuyển 3.027,7 triệu tấn (+14,1%); Hà Nội chưa có số công bố → lấy khoảng 13% (tỷ trọng kinh tế) quy về 9 tháng 2026. */
const SXD_HH = [[290000, 62], [1600, 520], [36800, 118], [0, 0], [420, 2600], [0, 0]];
const SXD_HH_CUNG_KY = 299000;

/* ---------- Số của từng phường/xã ---------- */
const SXD_UNITS = (function () {
  const wNha = SXD_DV.map((n) => (SXD_PHAT_TRIEN[n] || (n.indexOf('Phường') === 0 ? 0.9 : 0.7)) * (0.6 + 0.8 * sxdR(n, 'nha')));
  const wVt = SXD_DV.map((n) => (SXD_TT.indexOf(n) >= 0 ? 4 : n.indexOf('Phường') === 0 ? 1.4 : 0.6) * (0.6 + 0.8 * sxdR(n, 'vt')));
  const wHh = SXD_DV.map((n) => ({ 'Xã Thiên Lộc': 4, 'Xã Quang Minh': 3, 'Xã Nội Bài': 3, 'Phường Long Biên': 3, 'Xã Gia Lâm': 3, 'Xã Thường Tín': 2, 'Xã Đông Anh': 2.5,
    'Phường Hoàng Mai': 2, 'Phường Yên Sở': 2, 'Phường Hà Đông': 2 }[n] || (n.indexOf('Phường') === 0 ? 0.8 : 0.7)) * (0.6 + 0.8 * sxdR(n, 'hh')));
  /* nhà ở: diện tích sàn (nghìn m²), số công trình theo loại; nhà ở xã hội, chung cư, tái định cư chỉ ở khu đô thị hóa */
  const nha = SXD_NHA.map((x, li) => {
    const w = SXD_DV.map((n, j) => (li >= 1 && li <= 4 ? (SXD_PHAT_TRIEN[n] ? wNha[j] : 0) : wNha[j]));
    return { san: sxdSplit(x[1] * 10, w).map((v) => v / 10), ct: sxdSplit(x[0], w) };
  });
  const hk = SXD_VT.map((x) => sxdSplit(x[4], x[2] === 0 ? SXD_DV.map((n, j) => wVt[j] + (SXD_TT.indexOf(n) >= 0 ? 0 : 0.5)) : wVt));
  const hh = SXD_HH.map((x) => sxdSplit(x[0], wHh));
  return SXD_DV.map((ten, j) => ({
    ten: ten, phuong: ten.indexOf('Phường') === 0,
    nhaSan: nha.map((x) => x.san[j]), nhaCt: nha.map((x) => x.ct[j]), hk: hk.map((x) => x[j]), hh: hh.map((x) => x[j]),
    diem: SXD_DIEM.filter((d) => d.diaBan === ten).length
  }));
})();

/* ---------- Số tổng hợp ---------- */
const SXD_SUM = (function () {
  const U = SXD_UNITS, t = (f) => sxdSum(U.map(f)), r1 = (v) => Math.round(v * 10) / 10;
  const top = (f, n) => U.map((u) => [u.ten, f(u)]).sort((a, b) => b[1] - a[1]).slice(0, n || 10);
  const san = SXD_NHA.map((_, i) => r1(t((u) => u.nhaSan[i]))), ct = SXD_NHA.map((_, i) => t((u) => u.nhaCt[i]));
  const sanTong = r1(sxdSum(san));                                        // = diện tích hoàn thành (không cộng các tình trạng)
  const sanTT = SXD_TTCT.map((_, s) => r1(sxdSum(SXD_NHA.map((x, i) => san[i] * x[4][s]))));   // 4 số riêng, không có ô tổng
  const hkNhom = SXD_VT.map((_, i) => t((u) => u.hk[i])), hkTong = sxdSum(hkNhom);
  const hkKm = SXD_VT.map((x, i) => hkNhom[i] * x[5]);                 // nghìn HK.km
  const hhTong = sxdSum(SXD_HH.map((x) => x[0])), hhKm = SXD_HH.map((x) => x[0] * x[1]);
  /* hành khách theo loại hình vận tải của eform 4 (gom các nhóm đơn vị vận tải theo ngành) */
  const hkLh = SXD_LHVT.map((_, i) => sxdSum(SXD_VT.filter((x) => x[1] === i).map((x) => hkNhom[SXD_VT.indexOf(x)])));
  const D = SXD_DIEM;
  return {
    nha: { san: san, ct: ct, sanTong: sanTong, ctTong: sxdSum(ct), sanTT: sanTT, ck: SXD_NHA_CUNG_KY, sanT: sxdSplit(Math.round(sanTong), SXD_NHA_MUA),
      tang: sxdSum(SXD_NHA.map((x, i) => x[2] * ct[i])) / sxdSum(ct), noxh: san[2], top: top((u) => r1(sxdSum(u.nhaSan))) },
    vt: { nhom: hkNhom, tong: hkTong, ck: SXD_VT_CUNG_KY, km: sxdSum(hkKm), kmNhom: hkKm, soDv: sxdSum(SXD_VT.map((x) => x[3])),
      cuLy: sxdSum(hkKm) / hkTong, hkT: sxdSplit(hkTong, SXD_VT_MUA), metro: SXD_METRO, top: top((u) => sxdSum(u.hk)) },
    nc: { n: D.length, loai: SXD_LNC.map((_, i) => D.filter((d) => d.loai === i).length), muc: SXD_LNC.map((_, i) => SXD_MD.map((_, m) => D.filter((d) => d.loai === i && d.muc === m).length)),
      tt: SXD_TTXL.map((_, i) => D.filter((d) => d.tt === i).length), dai: sxdSum(D.map((d) => d.dai)), caoTro: D.filter((d) => d.muc >= 2).length,
      chuaXl: D.filter((d) => d.tt === 0).length, cap: [D.filter((d) => d.cap === 0).length, D.filter((d) => d.cap === 1).length],
      top: top((u) => u.diem).filter((r) => r[1] > 0) },
    vtdl: { hk: hkTong, hh: hhTong, hhCk: SXD_HH_CUNG_KY, hkKm: sxdSum(hkKm), hhKm: sxdSum(hhKm), hkLh: hkLh, hhLh: SXD_HH.map((x) => x[0]), hhKmLh: hhKm,
      topHh: top((u) => sxdSum(u.hh)) }
  };
})();

/* ---------- Mô tả 4 chỉ tiêu (dùng cho tài liệu; số hiệu chỉ số chỉ ghi ở tài liệu) ---------- */
const SXD_CT = [
  { key: 'nha', name: 'Nhà ở', eform: 'Tổng hợp chỉ số thống kê qđ (chỉ số 20)', ky: SXD_KY, freq: 'Tháng', soBanGhi: 126 * 9 * 4 },
  { key: 'vt', name: 'Vận tải hành khách của các đơn vị vận tải', eform: 'Danh sách tổng hợp chỉ số vận tải hành khách - cấp đơn vị vận tải (doanh nghiệp/htx) (chỉ số 24)', ky: SXD_KY, freq: 'Tháng', soBanGhi: SXD_SUM.vt.soDv * 9 },
  { key: 'nc', name: 'Điểm nguy cơ sạt lở, úng ngập trên tuyến đường', eform: 'Danh sách Nguy cơ sạt lở úng ngập (chỉ số 84)', ky: 'Tháng 9/2026', freq: 'Tháng', soBanGhi: SXD_DIEM.length },
  { key: 'vtdl', name: 'Khối lượng vận chuyển, luân chuyển hành khách và hàng hóa', eform: 'Danh sách Thu thập dữ liệu vận tải (chỉ số 68, 69)', ky: SXD_KY, freq: 'Tháng', soBanGhi: 126 * 9 * 2 }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function sxdPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const SXD_ITEMS = (function () {
  const S = SXD_SUM, src = 'Eform Sở Xây dựng (giả lập)';
  const parts = {
    nha: [sxdPart('Diện tích sàn 9 tháng (nghìn m²)', 'bar', SXD_LCT.slice(0, 3).map((x, i) => [x[0], S.nha.san[i]]))],
    vt: [sxdPart('Lượt hành khách 9 tháng (nghìn)', 'bar', SXD_VT.slice(0, 5).map((x, i) => [x[0], S.vt.nhom[i]]))],
    nc: [sxdPart('Loại nguy cơ (điểm)', 'bar', SXD_LNC.map((x, i) => [x[0], S.nc.loai[i]]))],
    vtdl: [sxdPart('Khối lượng vận chuyển 9 tháng', 'stat', [['Hành khách (nghìn lượt)', S.vtdl.hk], ['Hàng hóa (nghìn tấn)', S.vtdl.hh]])]
  };
  return SXD_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
