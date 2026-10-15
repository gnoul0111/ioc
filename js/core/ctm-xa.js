/* ============================== 126 XÃ, PHƯỜNG — SỐ NỀN THẬT DÙNG CHUNG CHO BỘ CHỈ TIÊU KHUÔN MỚI ==============================
   Tên, loại (phường/xã), diện tích (km²) và dân số (người) của 126 đơn vị hành chính cấp xã Hà Nội sau sắp xếp năm 2025
   (51 phường, 75 xã). Nguồn: phương án sắp xếp đơn vị hành chính cấp xã của Thành phố, tổng hợp ở trang "Danh sách đơn vị
   hành chính thuộc thành phố Hà Nội" (Wikipedia tiếng Việt), lấy ngày 08/10/2026; bản gốc ở tools/xa126-dan-so-dien-tich.tsv.
   Kiểm tra: tổng 8.818.383 người, 3.350,16 km²; tên trùng khớp danh mục 126 đơn vị của các eform (DL_DV...).
   Số chỉ tiêu của từng xã, phường (khi chưa có số thật) được CHIA từ tổng Thành phố theo quy mô dân số bằng ctmShare /
   ctmShareInt, hạt giống ngẫu nhiên cố định theo tên (ctmRng) nên mỗi lần mở đều ra cùng một số và tổng luôn khớp. */
const CTM_XA_RAW = [
  ['P', 'Ba Đình', 2.97, 65023], ['P', 'Bạch Mai', 2.95, 129571], ['P', 'Bồ Đề', 12.94, 120028], ['P', 'Cầu Giấy', 3.74, 74516],
  ['P', 'Chương Mỹ', 38.92, 87913], ['P', 'Cửa Nam', 1.68, 52751], ['P', 'Dương Nội', 7.9, 56091], ['P', 'Đại Mỗ', 8.1, 80462],
  ['P', 'Định Công', 5.34, 85502], ['P', 'Đông Ngạc', 8.85, 83544], ['P', 'Đống Đa', 2.07, 81358], ['P', 'Giảng Võ', 2.6, 97034],
  ['P', 'Hai Bà Trưng', 2.65, 87801], ['P', 'Hà Đông', 9, 185205], ['P', 'Hoàn Kiếm', 1.91, 105301], ['P', 'Hoàng Liệt', 4.04, 55820],
  ['P', 'Hoàng Mai', 9.04, 98502], ['P', 'Hồng Hà', 15.09, 123282], ['P', 'Khương Đình', 3.1, 86286], ['P', 'Kiến Hưng', 6.65, 70833],
  ['P', 'Kim Liên', 2.45, 109107], ['P', 'Láng', 1.88, 61135], ['P', 'Lĩnh Nam', 10.86, 20706], ['P', 'Long Biên', 19.04, 62887],
  ['P', 'Nghĩa Đô', 4.34, 125568], ['P', 'Ngọc Hà', 2.67, 93536], ['P', 'Ô Chợ Dừa', 1.89, 71293], ['P', 'Phú Diễn', 6.29, 74603],
  ['P', 'Phú Lương', 9.4, 52024], ['P', 'Phú Thượng', 7.2, 39322], ['P', 'Phúc Lợi', 10.41, 66790], ['P', 'Phương Liệt', 3.2, 81977],
  ['P', 'Sơn Tây', 23.08, 71301], ['P', 'Tây Hồ', 10.72, 100122], ['P', 'Tây Mỗ', 5.56, 46894], ['P', 'Tây Tựu', 7.54, 39436],
  ['P', 'Thanh Liệt', 6.44, 76238], ['P', 'Thanh Xuân', 3.24, 106316], ['P', 'Thượng Cát', 14.77, 24692], ['P', 'Tùng Thiện', 32.34, 42052],
  ['P', 'Tương Mai', 3.56, 136292], ['P', 'Từ Liêm', 10.18, 119997], ['P', 'Văn Miếu - Quốc Tử Giám', 1.92, 105604], ['P', 'Việt Hưng', 12.91, 83188],
  ['P', 'Vĩnh Hưng', 4.47, 67561], ['P', 'Vĩnh Tuy', 2.33, 90583], ['P', 'Xuân Đỉnh', 5.46, 48658], ['P', 'Xuân Phương', 10.81, 104947],
  ['P', 'Yên Hòa', 4.1, 77029], ['P', 'Yên Nghĩa', 13.18, 49643], ['P', 'Yên Sở', 5.61, 40913],
  ['X', 'An Khánh', 28.69, 102136], ['X', 'Ba Vì', 81.27, 26651], ['X', 'Bát Tràng', 20.67, 48987], ['X', 'Bất Bạt', 56.43, 40066],
  ['X', 'Bình Minh', 29.86, 80066], ['X', 'Chuyên Mỹ', 35.54, 44859], ['X', 'Chương Dương', 28.89, 59973], ['X', 'Cổ Đô', 53.26, 70706],
  ['X', 'Dân Hòa', 38.44, 62755], ['X', 'Dương Hòa', 17.41, 58830], ['X', 'Đa Phúc', 55.32, 83649], ['X', 'Đan Phượng', 15.3, 47629],
  ['X', 'Đại Thanh', 18.92, 92557], ['X', 'Đại Xuyên', 51.66, 74906], ['X', 'Đoài Phương', 57.1, 39828], ['X', 'Đông Anh', 48.68, 118183],
  ['X', 'Gia Lâm', 25.72, 90498], ['X', 'Hát Môn', 37.67, 72227], ['X', 'Hạ Bằng', 32.14, 38721], ['X', 'Hoài Đức', 16.73, 69239],
  ['X', 'Hòa Lạc', 35.37, 20815], ['X', 'Hòa Phú', 29.88, 49948], ['X', 'Hòa Xá', 40.42, 69428], ['X', 'Hồng Sơn', 54.39, 63130],
  ['X', 'Hồng Vân', 24.53, 58685], ['X', 'Hưng Đạo', 24.9, 49357], ['X', 'Hương Sơn', 69.11, 52634], ['X', 'Kiều Phú', 34.54, 60885],
  ['X', 'Kim Anh', 52.8, 48564], ['X', 'Liên Minh', 23.57, 47769], ['X', 'Mê Linh', 24.07, 69107], ['X', 'Minh Châu', 10.35, 6646],
  ['X', 'Mỹ Đức', 52.73, 53640], ['X', 'Nam Phù', 13.74, 42772], ['X', 'Ngọc Hồi', 13.34, 43864], ['X', 'Nội Bài', 51.64, 70469],
  ['X', 'Ô Diên', 32.06, 97506], ['X', 'Phú Cát', 51.21, 43339], ['X', 'Phú Nghĩa', 40.24, 71048], ['X', 'Phú Xuyên', 60.02, 96635],
  ['X', 'Phúc Lộc', 41.15, 61457], ['X', 'Phúc Sơn', 49.31, 54084], ['X', 'Phúc Thịnh', 42.63, 95951], ['X', 'Phúc Thọ', 39.66, 75425],
  ['X', 'Phù Đổng', 41.62, 111484], ['X', 'Phượng Dực', 44.69, 60281], ['X', 'Quang Minh', 32.17, 69623], ['X', 'Quảng Bị', 37.14, 62968],
  ['X', 'Quảng Oai', 49.26, 59001], ['X', 'Quốc Oai', 24, 63344], ['X', 'Sóc Sơn', 68.24, 117876], ['X', 'Sơn Đồng', 21.57, 63267],
  ['X', 'Suối Hai', 52.55, 35201], ['X', 'Tam Hưng', 29.45, 39087], ['X', 'Tây Phương', 31.06, 99874], ['X', 'Thanh Oai', 26.86, 54475],
  ['X', 'Thanh Trì', 10.15, 55378], ['X', 'Thạch Thất', 31.93, 57645], ['X', 'Thiên Lộc', 27.96, 74597], ['X', 'Thuận An', 29.67, 68292],
  ['X', 'Thư Lâm', 43.84, 102580], ['X', 'Thường Tín', 28.29, 70739], ['X', 'Thượng Phúc', 28.91, 45464], ['X', 'Tiến Thắng', 36.34, 64246],
  ['X', 'Trần Phú', 44.36, 47528], ['X', 'Trung Giã', 77.52, 61315], ['X', 'Ứng Hòa', 67.81, 63750], ['X', 'Ứng Thiên', 38.41, 53962],
  ['X', 'Vân Đình', 41.6, 60828], ['X', 'Vật Lại', 51.76, 58579], ['X', 'Vĩnh Thanh', 22.52, 64698], ['X', 'Xuân Mai', 50.72, 67310],
  ['X', 'Yên Bài', 68.19, 21416], ['X', 'Yên Lãng', 44.81, 71339], ['X', 'Yên Xuân', 78.01, 29375]
];
/* Số người bình quân một hộ dùng để ước số hộ khi chưa có số hộ thật của từng xã, phường. */
const CTM_NGUOI_MOT_HO = 3.05;

/* Danh sách 126 đơn vị: { k: 'P'|'X', short, name ('Phường …' / 'Xã …'), dt, ds, ho (ước tính), den (người/km²) } */
const CTM_XA = CTM_XA_RAW.map((r) => ({ k: r[0], short: r[1], name: (r[0] === 'P' ? 'Phường ' : 'Xã ') + r[1], dt: r[2], ds: r[3], ho: Math.round(r[3] / CTM_NGUOI_MOT_HO), den: r[3] / r[2] }));
const CTM_POP = CTM_XA.reduce((s, u) => s + u.ds, 0);
const CTM_HO = CTM_XA.reduce((s, u) => s + u.ho, 0);
function ctmXaByName(name) { return CTM_XA.find((u) => u.name === name || u.short === name) || null; }

/* Số ngẫu nhiên cố định theo chuỗi hạt giống (FNV-1a + mulberry32). */
function ctmRng(seed) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* Chia `total` theo trọng số (số thực). */
function ctmShare(total, w) { const s = w.reduce((a, b) => a + b, 0) || 1; return w.map((x) => (x / s) * total); }
/* Chia `total` (số nguyên không âm) theo trọng số thành số nguyên không âm, tổng luôn đúng bằng total: làm tròn xuống rồi chia
   phần còn lại cho các phần có phần lẻ lớn nhất (cách chia phần dư lớn nhất). Phần có trọng số 0 luôn nhận 0. */
function ctmShareInt(total, w) {
  const v = ctmShare(total, w), r = v.map(Math.floor);
  let d = total - r.reduce((a, b) => a + b, 0);
  const ord = v.map((x, i) => [x - Math.floor(x), i]).filter((x) => w[x[1]] > 0).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; d > 0 && ord.length; k = (k + 1) % ord.length, d--) r[ord[k][1]]++;
  return r;
}
