/* ============================== SỞ DÂN TỘC VÀ TÔN GIÁO — BỘ CHỈ TIÊU THEO EFORM CTMTQG ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở DTTG"), 1 eform "Chương trình mục tiêu quốc gia phát triển kinh
   tế - xã hội vùng đồng bào dân tộc thiểu số và miền núi" (46 trường). Mỗi bản ghi = một dự án / tiểu dự án / công trình
   (hoặc một bản "Không phát sinh") của một Thôn/TDP thuộc một Địa bàn (126 phường/xã) trong một kỳ (tháng).
   Eform gộp nhiều nhóm thông tin nên IOC tách thành 4 chỉ tiêu cùng đọc chung eform: giải ngân vốn; tiến độ thực hiện;
   kết quả đối với vùng đồng bào DTTS; đối soát và chất lượng dữ liệu. Khuôn hiển thị chung (catBoxHtml + Chart.js, xem
   dashboard-dttg.js) như Sở VHTT, Văn phòng UBND, Ban Quản lý, Sở Du lịch. Bộ chỉ tiêu cũ của Sở (STT 77) đã xóa.
   Chưa có số thật: toàn bộ số dưới đây là SỐ GIẢ LẬP, sinh cố định theo tên (hàm băm); số toàn Thành phố = cộng các bản ghi.
   Tiền lưu ở TRIỆU ĐỒNG như eform. Kỳ xem: tháng 9/2026 (giải ngân lũy kế từ đầu năm).
   Nạp TRƯỚC central-level.js (central-level.js dùng DTTG_ITEMS). Không dùng hàm nào của file khác. */

const DTTG_KY = 'Tháng 9/2026';
const DTTG_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function dttgN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function dttgSum(a) { return a.reduce((s, v) => s + v, 0); }
function dttgPct(a, b, d) { return dttgN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function dttgHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function dttgR(name, key) { return (dttgHash(name + '|' + key) % 10000) / 10000; }
/* triệu đồng → tỷ đồng */
function dttgTy(trieu, d) { return dttgN(trieu / 1000, d == null ? 1 : d); }

/* ---------- Danh mục của eform (đúng tên hiển thị) ---------- */
/* «Dự án thành phần/Nội dung CTMTQG» (bỏ giá trị "Xác nhận không phát sinh", dùng riêng cho bản ghi không phát sinh) */
const DTTG_DATP = [
  ['Hạ tầng thiết yếu', '#2a78d6'], ['Hỗ trợ nước sinh hoạt', '#39d5ff'], ['Đào tạo nghề - việc làm', '#7086FD'],
  ['Giáo dục - nâng cao năng lực', '#4a3aa7'], ['Bảo tồn văn hóa dân tộc', '#FD9843'], ['Hỗ trợ sản xuất/sinh kế', '#1baf7a'], ['Kiểm tra giám sát', '#898781']
];
const DTTG_LOAI_BG = ['Dự án/Hoạt động phát sinh', 'Tiểu dự án/Hoạt động phát sinh', 'Công trình/hạng mục', 'Không phát sinh'];
const DTTG_NGUON = [['NSTW', '#2a78d6'], ['NSĐP', '#39d5ff'], ['Tín dụng', '#7086FD'], ['Doanh nghiệp', '#eda100'], ['Đóng góp người dân', '#1baf7a'], ['Nguồn khác', '#898781']];
/* «Trạng thái triển khai» (bỏ "Không phát sinh") */
const DTTG_TT = [['Hoàn thành', '#1baf7a'], ['Đang thực hiện', '#2a78d6'], ['Chưa triển khai', '#8ba7c2'], ['Đình trệ', '#d33a44'], ['Tạm dừng', '#eda100']];
const DTTG_DUNG_TD = ['Có', 'Không', 'Không áp dụng'];
/* «Trạng thái đối soát» (bỏ "Không phát sinh") */
const DTTG_DOI_SOAT = [['Đã đối soát cấp sở', '#1baf7a'], ['Đã đối soát cấp phường', '#39d5ff'], ['Chờ xác nhận', '#8ba7c2'], ['Cần giải trình', '#d33a44']];
const DTTG_CO = [['Đạt logic sơ bộ', '#1baf7a'], ['Cần giải trình', '#d33a44'], ['Thiếu minh chứng/xác nhận', '#eda100']];
const DTTG_NGUON_DL = ['Báo cáo UBND phường', 'Quyết định giao vốn', 'Kho bạc/Chứng từ giải ngân', 'Báo cáo kiểm tra giám sát', 'Danh sách hộ/đối tượng thụ hưởng', 'Hệ thống báo cáo số'];
/* tình trạng báo cáo của một phường/xã trong kỳ */
const DTTG_BC = [['Có dự án, hoạt động', '#2a78d6'], ['Xác nhận không phát sinh', '#8ba7c2'], ['Chưa báo cáo', '#d33a44']];

/* ---------- 126 phường/xã — đúng danh mục «Địa bàn» của eform ---------- */
const DTTG_DV = [
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

/* ---------- Địa bàn vùng đồng bào DTTS và miền núi có dự án ----------
   DANH SÁCH THẬT theo Quyết định 201/QĐ-UBND ngày 15/01/2026 của UBND Thành phố (giai đoạn 2026-2030): 5 xã khu vực I
   (Yên Xuân, Mỹ Đức, Ba Vì, Suối Hai, Yên Bài) và 6 thôn: thôn Đồng Ké (xã Trần Phú); thôn Đồng Vàng, Cổ Rùa, Đồng Âm,
   Trán Voi, Đồng Vỡ (xã Phú Cát). Với 2 xã chỉ có thôn trong danh sách, chỉ các thôn đó có dự án.
   Số hộ, số thôn của 5 xã khu vực I, số hộ nghèo và mọi số vốn là GIẢ LẬP (chưa có số công bố theo xã mới sau sắp xếp).
   Hộ nghèo: Hà Nội không còn hộ nghèo theo chuẩn nghèo đa chiều từ năm 2024; các xã miền núi huyện Ba Vì cũ đã xóa hết hộ
   nghèo — nên số hộ nghèo đặt bằng 0 hoặc rất nhỏ (coi như theo chuẩn riêng của Thành phố, cần Sở xác nhận).
   [xã, số hộ DTTS, số thôn có đồng bào DTTS, hệ số quy mô vốn, hộ nghèo đầu kỳ, tên thôn (chỉ với xã chỉ có thôn trong danh sách)] */
const DTTG_XA = [
  ['Xã Ba Vì', 2300, 18, 1.55, 0], ['Xã Yên Xuân', 2100, 16, 1.45, 6], ['Xã Yên Bài', 1500, 12, 1.2, 0], ['Xã Suối Hai', 1100, 10, 1.0, 0],
  ['Xã Mỹ Đức', 520, 5, 0.75, 4],
  ['Xã Phú Cát', 720, 5, 0.85, 3, ['Đồng Vàng', 'Cổ Rùa', 'Đồng Âm', 'Trán Voi', 'Đồng Vỡ']],
  ['Xã Trần Phú', 210, 1, 0.5, 1, ['Đồng Ké']]
];
/* mô tả ngắn vùng đồng bào DTTS (thẻ số, bảng phường/xã) */
const DTTG_VUNG_NGAN = DTTG_XA.filter((x) => !x[5]).length + ' xã khu vực I, ' + dttgSum(DTTG_XA.filter((x) => x[5]).map((x) => x[5].length)) + ' thôn ở ' + DTTG_XA.filter((x) => x[5]).length + ' xã';
/* số phường/xã chưa gửi báo cáo tháng 9 (chọn cố định theo hàm băm trong các đơn vị không có dự án) */
const DTTG_SO_CHUA_BC = 5;

/* Số bản ghi theo dự án thành phần cho xã có n thôn; khoảng vốn kế hoạch 1 bản ghi (triệu đồng); loại bản ghi; nguồn vốn có thể có;
   nguồn dữ liệu thường dùng (chỉ số trong DTTG_NGUON, DTTG_LOAI_BG, DTTG_NGUON_DL).
   Nguồn vốn: Hà Nội là địa phương tự cân đối ngân sách, phải tự bố trí ngân sách địa phương cho Chương trình (báo cáo Sở Tài
   chính 6/2026) → không có NSTW; NSĐP là chính, sinh kế có thêm tín dụng chính sách, doanh nghiệp, người dân đóng góp. */
const DTTG_MAU = [
  { soBg: (t) => Math.max(1, Math.round(t / 2)), von: [2500, 9000], loai: 2, nguon: [1], ndl: [0, 2], ten: 'Cứng hóa đường trục thôn, đường liên thôn' },
  { soBg: (t) => (t >= 5 ? 2 : 1), von: [1200, 4000], loai: 2, nguon: [1], ndl: [2, 0], ten: 'Công trình cấp nước sinh hoạt tập trung' },
  { soBg: () => 1, von: [300, 900], loai: 0, nguon: [1], ndl: [4, 5], ten: 'Đào tạo nghề, hỗ trợ việc làm cho lao động DTTS' },
  { soBg: () => 1, von: [400, 1200], loai: 0, nguon: [1], ndl: [1, 5], ten: 'Bồi dưỡng kiến thức dân tộc, nâng cao năng lực cán bộ cơ sở' },
  { soBg: (t) => (t >= 4 ? 1 : 0), von: [300, 1000], loai: 1, nguon: [1, 5], ndl: [0, 1], ten: 'Bảo tồn lễ hội, nhà văn hóa thôn' },
  { soBg: (t) => (t >= 6 ? 2 : 1), von: [600, 2500], loai: 1, nguon: [1, 1, 2, 3, 4], ndl: [4, 0], ten: 'Hỗ trợ phát triển sản xuất theo chuỗi giá trị' },
  { soBg: () => 1, von: [50, 150], loai: 0, nguon: [1], ndl: [3], ten: 'Kiểm tra, giám sát, đánh giá thực hiện Chương trình' }
];
/* tiến độ giải ngân lũy kế chuẩn theo tháng (tỷ lệ của giải ngân đến hết tháng 9) */
const DTTG_DUONG_GN = [0.03, 0.07, 0.14, 0.22, 0.33, 0.45, 0.6, 0.79, 1];

/* ---------- Bản ghi (dự án, tiểu dự án, công trình) của các xã có vùng DTTS ---------- */
const DTTG_REC = [];
DTTG_XA.forEach((x) => {
  const xa = x[0], soThon = x[2], qm = x[3];
  DTTG_MAU.forEach((m, d) => {
    for (let j = 0; j < m.soBg(soThon); j++) {
      const k = xa + '|' + d + '|' + j, R = (s) => dttgR(k, s);
      const kh = Math.round((m.von[0] + (m.von[1] - m.von[0]) * R('v')) * qm);
      const pb = Math.round(kh * (R('pb') < 0.45 ? 1 : 0.82 + 0.18 * R('pb2')));
      const rt = R('tt');
      const tt = d === 6 ? (rt < 0.6 ? 1 : 0) : rt < 0.26 ? 0 : rt < 0.79 ? 1 : rt < 0.87 ? 2 : rt < 0.94 ? 3 : 4;   // chỉ số DTTG_TT
      const tdKh = tt === 0 ? 100 : Math.round(62 + 26 * R('kh'));
      const tdTt = tt === 0 ? 100 : tt === 1 ? Math.max(5, Math.min(99, tdKh - 15 + Math.round(22 * R('tt2')))) : tt === 2 ? 0 : tt === 3 ? Math.round(10 + 30 * R('tt2')) : Math.round(20 + 30 * R('tt2'));
      const dungTd = tt === 4 ? 2 : tt === 0 ? (R('ht') < 0.82 ? 0 : 1) : tt === 1 ? (tdTt >= tdKh - 5 ? 0 : 1) : 1;      // chỉ số DTTG_DUNG_TD
      const gn9 = Math.round(tt === 0 ? pb * (0.86 + 0.14 * R('g')) : tt === 1 ? pb * tdTt / 100 * (0.78 + 0.2 * R('g')) : tt === 2 ? 0 : pb * (0.05 + 0.25 * R('g')));
      const luyKe = DTTG_DUONG_GN.map((c, mi) => Math.round(gn9 * Math.min(1, c * (0.85 + 0.3 * R('m' + mi)))));
      luyKe[8] = gn9;
      for (let mi = 1; mi < 9; mi++) luyKe[mi] = Math.max(luyKe[mi], luyKe[mi - 1]);       // lũy kế không giảm
      const dinhTre = tt === 3 ? Math.round((pb - gn9) * (0.6 + 0.4 * R('dt'))) : tt === 1 && R('dt2') < 0.1 ? Math.round((pb - gn9) * 0.2) : 0;
      DTTG_REC.push({
        xa: xa, thon: x[5] ? 'Thôn ' + x[5][dttgHash(k + 'thon') % x[5].length] : 'Thôn ' + (1 + (dttgHash(k + 'thon') % soThon)), ma: 'DT' + (d + 1) + '-' + (DTTG_DV.indexOf(xa) + 1) + '-' + (j + 1),
        ten: m.ten, datp: d, loai: m.loai, nguon: m.nguon[dttgHash(k + 'ng') % m.nguon.length],
        kh: kh, pb: pb, luyKe: luyKe, gn9: gn9, gnKy: gn9 - luyKe[7],
        tt: tt, tdKh: tdKh, tdTt: tdTt, dungTd: dungTd, dinhTre: dinhTre,
        viPham: tt === 3 ? 1 + (R('vp') < 0.4 ? 1 : 0) : R('vp') < 0.06 ? 1 : 0,
        ktgs: R('kt') < 0.86 ? 0 : 1, cnso: R('cn') < 0.72 ? 0 : 1,                                                    // 0 = Có, 1 = Không
        doiSoat: R('ds') < 0.56 ? 0 : R('ds') < 0.8 ? 1 : R('ds') < 0.92 ? 2 : 3,
        ndl: m.ndl[dttgHash(k + 'ndl') % m.ndl.length]
      });
    }
  });
});
DTTG_REC.forEach((r) => {
  const R = (s) => dttgR(r.ma, s);
  r.co = r.doiSoat === 3 || r.viPham > 1 ? 1 : R('co') < 0.08 ? 2 : 0;                                                // chỉ số DTTG_CO
});

/* ---------- Từng phường/xã ---------- */
const DTTG_CHUA_BC = DTTG_DV.filter((n) => !DTTG_XA.some((x) => x[0] === n)).map((n) => [n, dttgR(n, 'bc')]).sort((a, b) => a[1] - b[1]).slice(0, DTTG_SO_CHUA_BC).map((r) => r[0]);
const DTTG_UNITS = DTTG_DV.map((ten) => {
  const x = DTTG_XA.find((r) => r[0] === ten);
  if (!x) return { ten: ten, bc: DTTG_CHUA_BC.indexOf(ten) >= 0 ? 2 : 1, rec: [] };
  const R = (s) => dttgR(ten, s), soHo = x[1], soThon = x[2];
  const hoNgheoDau = x[4];
  const hsTuoi = Math.round(soHo * (0.58 + 0.1 * R('hs')));
  return {
    ten: ten, bc: 0, rec: DTTG_REC.filter((r) => r.xa === ten),
    /* 4 nhóm chỉ số kết quả của địa bàn, theo bản báo cáo tháng 9 */
    /* nước hợp vệ sinh, đường, học sinh: vùng DTTS Hà Nội đã gần như phủ kín (100% xã có đường nhựa/bê tông đến trung tâm) */
    soHo: soHo, hoNuoc: Math.round(soHo * (0.955 + 0.04 * R('nuoc'))),
    soDuong: soThon, soCungHoa: Math.min(soThon, Math.round(soThon * (0.88 + 0.13 * R('ch')))),
    hsTuoi: hsTuoi, hsDungCap: Math.round(hsTuoi * (0.972 + 0.025 * R('dc'))),
    hoNgheoDau: hoNgheoDau, hoNgheoCuoi: Math.floor(hoNgheoDau * (0.4 + 0.25 * R('hc')))
  };
});

/* ---------- Số tổng hợp ---------- */
const DTTG_SUM = (function () {
  const R = DTTG_REC, U = DTTG_UNITS, X = U.filter((u) => u.bc === 0), M = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const tong = (arr, f) => dttgSum(arr.map(f));
  const kh = tong(R, (r) => r.kh), pb = tong(R, (r) => r.pb), gn = tong(R, (r) => r.gn9);
  const luyKeT = M.map((m) => tong(R, (r) => r.luyKe[m]));
  const byDatp = DTTG_DATP.map((_, d) => { const a = R.filter((r) => r.datp === d); return [tong(a, (r) => r.kh), tong(a, (r) => r.pb), tong(a, (r) => r.gn9)]; });
  const byXa = X.map((u) => [u.ten, tong(u.rec, (r) => r.kh), tong(u.rec, (r) => r.gn9)]).sort((a, b) => b[1] - a[1]);
  const ttCnt = DTTG_TT.map((_, i) => R.filter((r) => r.tt === i).length);
  const ttDatp = DTTG_DATP.map((_, d) => DTTG_TT.map((_, i) => R.filter((r) => r.datp === d && r.tt === i).length));
  /* tiến độ bình quân có trọng số theo vốn phân bổ, chỉ dự án đã/đang triển khai (bỏ Chưa triển khai) */
  const tdDatp = DTTG_DATP.map((_, d) => { const a = R.filter((r) => r.datp === d && r.tt !== 2), w = tong(a, (r) => r.pb) || 1;
    return [tong(a, (r) => r.tdKh * r.pb) / w, tong(a, (r) => r.tdTt * r.pb) / w]; });
  const dung = DTTG_DUNG_TD.map((_, i) => R.filter((r) => r.dungTd === i).length);
  const kq = { soHo: tong(X, (u) => u.soHo), hoNuoc: tong(X, (u) => u.hoNuoc), soDuong: tong(X, (u) => u.soDuong), soCungHoa: tong(X, (u) => u.soCungHoa),
    hsTuoi: tong(X, (u) => u.hsTuoi), hsDungCap: tong(X, (u) => u.hsDungCap), hoNgheoDau: tong(X, (u) => u.hoNgheoDau), hoNgheoCuoi: tong(X, (u) => u.hoNgheoCuoi) };
  kq.tl = [kq.hoNuoc / kq.soHo * 100, kq.soCungHoa / kq.soDuong * 100, kq.hsDungCap / kq.hsTuoi * 100, (kq.hoNgheoDau - kq.hoNgheoCuoi) / kq.hoNgheoDau * 100];
  const bc = DTTG_BC.map((_, i) => U.filter((u) => u.bc === i).length);
  return {
    gn: { kh: kh, pb: pb, gn: gn, gnKy: tong(R, (r) => r.gnKy), luyKeT: luyKeT, kyT: M.map((m) => luyKeT[m] - (m ? luyKeT[m - 1] : 0)),
      dinhTre: tong(R, (r) => r.dinhTre), byDatp: byDatp, byXa: byXa,
      byNguon: DTTG_NGUON.map((_, i) => tong(R.filter((r) => r.nguon === i), (r) => r.kh)) },
    td: { n: R.length, tt: ttCnt, ttDatp: ttDatp, tdDatp: tdDatp, dung: dung, viPham: tong(R, (r) => r.viPham),
      ktgs: [R.filter((r) => r.ktgs === 0).length, R.filter((r) => r.ktgs === 1).length],
      loai: DTTG_LOAI_BG.slice(0, 3).map((_, i) => R.filter((r) => r.loai === i).length) },
    kq: kq,
    kqXa: X.map((u) => ({ ten: u.ten, soHo: u.soHo, hoNuoc: u.hoNuoc, hoNgheoDau: u.hoNgheoDau, hoNgheoCuoi: u.hoNgheoCuoi, soDuong: u.soDuong, soCungHoa: u.soCungHoa })),
    ds: { bc: bc, xaCo: X.length, doiSoat: DTTG_DOI_SOAT.map((_, i) => R.filter((r) => r.doiSoat === i).length),
      co: DTTG_CO.map((_, i) => R.filter((r) => r.co === i).length), ndl: DTTG_NGUON_DL.map((_, i) => R.filter((r) => r.ndl === i).length),
      cnso: [R.filter((r) => r.cnso === 0).length, R.filter((r) => r.cnso === 1).length],
      /* bản ghi tháng 9 = bản ghi dự án + 1 bản "Không phát sinh" mỗi phường/xã xác nhận không phát sinh */
      banGhi: R.length + bc[1] }
  };
})();

/* ---------- Mô tả 4 chỉ tiêu (dùng cho tài liệu; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const DTTG_EFORM = 'Chương trình mục tiêu quốc gia phát triển kinh tế - xã hội vùng đồng bào dân tộc thiểu số và miền núi';
const DTTG_CT = [
  { key: 'gn', name: 'Giải ngân vốn Chương trình mục tiêu quốc gia vùng đồng bào DTTS', ky: 'lũy kế đến tháng 9/2026', freq: 'Tháng', soBanGhi: DTTG_REC.length },
  { key: 'td', name: 'Tiến độ thực hiện dự án, công trình', ky: DTTG_KY, freq: 'Tháng', soBanGhi: DTTG_REC.length },
  { key: 'kq', name: 'Kết quả đối với vùng đồng bào dân tộc thiểu số', ky: DTTG_KY, freq: 'Tháng', soBanGhi: DTTG_SUM.ds.xaCo },
  { key: 'ds', name: 'Tình hình báo cáo và đối soát dữ liệu', ky: DTTG_KY, freq: 'Tháng', soBanGhi: DTTG_SUM.ds.banGhi }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function dttgPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const DTTG_ITEMS = (function () {
  const S = DTTG_SUM, src = 'Eform Sở Dân tộc và Tôn giáo (giả lập)';
  const parts = {
    gn: [dttgPart('Vốn năm 2026 (tỷ đồng)', 'stat', [['Kế hoạch', Math.round(S.gn.kh / 1000)], ['Đã phân bổ', Math.round(S.gn.pb / 1000)], ['Giải ngân lũy kế', Math.round(S.gn.gn / 1000)]])],
    td: [dttgPart('Trạng thái triển khai', 'bar', DTTG_TT.map((t, i) => [t[0], S.td.tt[i]]))],
    kq: [dttgPart('Hộ nghèo DTTS', 'bar', [['Đầu kỳ', S.kq.hoNgheoDau], ['Cuối kỳ', S.kq.hoNgheoCuoi]])],
    ds: [dttgPart('Tình trạng báo cáo (phường/xã)', 'bar', DTTG_BC.map((b, i) => [b[0], S.ds.bc[i]]))]
  };
  return DTTG_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
