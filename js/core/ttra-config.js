/* ============================== THANH TRA THÀNH PHỐ — BỘ CHỈ TIÊU THEO 3 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Thanh Tra TP"), 3 eform → 3 chỉ tiêu:
     1. "Eform Kiểm tra Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật" — bản ghi = 1 cuộc kiểm tra
     2. "Thanh tra" — bản ghi = 1 cuộc thanh tra, hoặc 1 kết luận đang theo dõi thực hiện ("Theo dõi sau thanh tra")
     3. "Tiếp công dân, giải quyết khiếu nại, tố cáo" — bản ghi "Tổng hợp" = số liệu 1 tháng của 1 phường/xã
   Khuôn hiển thị chung (catBoxHtml + Chart.js, xem dashboard-ttra.js) như các sở làm theo eform. Bộ cũ (STT 39, 40, 41) đã xóa.

   SỐ GIẢ LẬP, đặt theo bậc độ lớn số thật đã công bố (quy về 9 tháng năm 2026):
   - Thanh tra năm 2025 toàn Thành phố: 283 cuộc (152 cuộc kỳ trước chuyển sang), 251 kết luận với 288 đơn vị, vi phạm 10,45 tỷ
     đồng (kiến nghị thu hồi toàn bộ) và 119 m² đất; kiến nghị xử lý hành chính 31 tổ chức, 147 cá nhân; theo dõi, đôn đốc
     thực hiện 939 kết luận, mới hoàn thành 53 (Báo Thanh tra, tổng kết 2025).
   - Kế hoạch 2026: thanh tra trách nhiệm 15 người đứng đầu cấp xã về tiếp công dân, khiếu nại, tố cáo (KH 13/KH-UBND 9/1/2026).
   - Tiếp công dân năm 2024 của các cơ quan hành chính Thành phố: 35.086 lượt / 42.715 công dân, 21.150 vụ việc.
   Nạp TRƯỚC central-level.js (central-level.js dùng TTRA_ITEMS). Không dùng hàm nào của file khác. */

const TTRA_KY = '9 tháng năm 2026';
const TTRA_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function ttraN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function ttraSum(a) { return a.reduce((s, v) => s + v, 0); }
function ttraPct(a, b, d) { return ttraN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }
function ttraHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function ttraR(name, key) { return (ttraHash(name + '|' + key) % 10000) / 10000; }
/* ngày thứ n của năm 2026 → "dd/mm/2026" */
function ttraNgay(n) { const d = new Date(Date.UTC(2026, 0, n)); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/2026'; }
const TTRA_NGAY_CHOT = 273;   // 30/9/2026

/* ---------- 126 phường/xã — đúng danh mục «Địa bàn» của 3 eform ---------- */
const TTRA_DV = [
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
/* phường trung tâm: nhiều trụ sở sở, ngành (đơn vị được thanh tra) và nhiều đơn thư hơn */
const TTRA_TRUNG_TAM = ['Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Ba Đình', 'Phường Giảng Võ', 'Phường Ngọc Hà', 'Phường Đống Đa', 'Phường Hai Bà Trưng',
  'Phường Cầu Giấy', 'Phường Hà Đông', 'Phường Long Biên', 'Phường Thanh Xuân', 'Phường Hoàng Mai', 'Phường Tây Hồ', 'Phường Từ Liêm'];
/* xã ven đô có nhiều tranh chấp, khiếu nại về đất đai (thu hồi đất, giải phóng mặt bằng) */
const TTRA_DAT_DAI = ['Xã Đông Anh', 'Xã Gia Lâm', 'Xã Thanh Trì', 'Xã Hoài Đức', 'Xã Sóc Sơn', 'Xã Mê Linh', 'Phường Tây Mỗ', 'Phường Đại Mỗ', 'Phường Yên Nghĩa', 'Phường Dương Nội', 'Xã Thiên Lộc', 'Xã Phúc Thịnh'];
function ttraQuyMo(n) { return (TTRA_TRUNG_TAM.indexOf(n) >= 0 ? 1.7 : n.indexOf('Phường') === 0 ? 1.15 : 0.8) * (TTRA_DAT_DAI.indexOf(n) >= 0 ? 1.6 : 1) * (0.7 + 0.6 * ttraR(n, 'qm')); }

/* chia tổng cho các đơn vị theo trọng số, làm tròn theo phần dư lớn nhất nên cộng lại đúng bằng tổng */
function ttraSplit(total, w) {
  const ws = ttraSum(w) || 1, raw = w.map((x) => total * x / ws), base = raw.map(Math.floor);
  raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]).slice(0, total - ttraSum(base)).forEach((x) => base[x[1]]++);
  return base;
}

/* ================= 1. KIỂM TRA CHỦ TỊCH UBND XÃ, PHƯỜNG ================= */
/* «Trạng thái kiểm tra» đang là kiểu Chữ; IOC gom về 4 giá trị */
const TTRA_KT_TT = [['Đã ban hành kết luận', '#1baf7a'], ['Đã kết thúc, chờ kết luận', '#39d5ff'], ['Đang kiểm tra', '#2a78d6'], ['Chưa triển khai', '#8ba7c2']];
/* «Nội dung kiểm tra chính» đang là Chữ; IOC gom về 3 nhóm */
const TTRA_KT_ND = [['Tiếp công dân, khiếu nại, tố cáo', '#2a78d6'], ['Phòng, chống tham nhũng, tiêu cực', '#d33a44'], ['Cả hai nội dung', '#7086FD']];
const TTRA_KT_KE_HOACH = 15;   // số cuộc theo kế hoạch năm 2026
/* Eform kiểm tra không có trường kế hoạch số cuộc năm → ẩn "theo kế hoạch năm", "tiến độ so kế hoạch" (phản hồi nhóm triển khai
   13/10/2026); số 15 giữ lại, đặt true để hiện lại. */
const TTRA_SHOW_KE_HOACH_KT = false;
/* [địa bàn, trạng thái, nội dung, ngày QĐ (thứ tự ngày trong năm), số ngày kế hoạch, số ngày thực tế (null = chưa xong)] */
const TTRA_KT_DS = [
  ['Phường Hoàng Mai', 0, 0, 22, 30, 34], ['Xã Đông Anh', 0, 2, 35, 30, 38], ['Phường Thanh Xuân', 0, 0, 50, 25, 25], ['Xã Gia Lâm', 0, 1, 64, 30, 36],
  ['Phường Hà Đông', 0, 0, 92, 30, 31], ['Xã Sóc Sơn', 0, 2, 120, 35, 41], ['Phường Long Biên', 1, 0, 168, 30, 33], ['Xã Thanh Trì', 1, 1, 189, 30, 30],
  ['Phường Cầu Giấy', 2, 0, 224, 30, null], ['Xã Hoài Đức', 2, 2, 241, 35, null], ['Phường Tây Mỗ', 3, 0, 262, 30, null]
];
const TTRA_KT = TTRA_KT_DS.map((r, i) => {
  const R = (k) => ttraR('kt' + r[0], k), kl = r[1] === 0;
  const soKn = kl ? 5 + Math.round(8 * R('kn')) : 0;
  const da = kl ? Math.round(soKn * (0.35 + 0.45 * R('da')) * Math.min(1, (TTRA_NGAY_CHOT - r[3] - r[5]) / 150)) : 0;
  const qh = kl ? Math.min(soKn - da, Math.round(soKn * 0.15 * R('qh') * ((TTRA_NGAY_CHOT - r[3]) > 150 ? 1.6 : 0.4))) : 0;
  return {
    ma: 'KT-' + String(i + 1).padStart(2, '0') + '/2026', diaBan: r[0], tt: r[1], nd: r[2], ngayQd: r[3], ngayBd: r[3] + 3,
    ngayKh: r[4], ngayTt: r[5], soDv: 1 + Math.round(3 * R('dv')),
    kl: kl, ngayKl: kl ? r[3] + 3 + r[5] + 8 + Math.round(10 * R('nk')) : null,
    soKn: soKn, thuHoi: kl && R('th') < 0.45 ? Math.round(30 + 220 * R('th2')) : 0,
    da: da, qh: qh, dang: soKn - da - qh
  };
});

/* ================= 2. THANH TRA ================= */
const TTRA_NGUON = [['Kế hoạch năm', '#2a78d6'], ['Chuyên đề', '#7086FD'], ['Đột xuất', '#eda100'], ['Theo chỉ đạo', '#4a3aa7'], ['Theo phản ánh/kiến nghị', '#39d5ff']];
/* «Lĩnh vực thanh tra» (bỏ giá trị "tiêu cực" — nghi nhập lỗi, nên gộp vào "Phòng chống tham nhũng") */
const TTRA_LV = ['Quản lý đất đai', 'Trật tự xây dựng', 'Tài chính - ngân sách', 'Đầu tư công', 'Quản lý tài sản công', 'Mua sắm công/đấu thầu',
  'Hành chính công/TTHC', 'Tiếp công dân - đơn thư', 'Phòng chống tham nhũng', 'Khác'];
const TTRA_LV_W = [0.21, 0.17, 0.14, 0.12, 0.07, 0.06, 0.05, 0.07, 0.07, 0.04];
/* «Trạng thái cuộc thanh tra» (bỏ "Không phát sinh") */
const TTRA_TT = [['Chưa triển khai', '#8ba7c2'], ['Đang triển khai', '#2a78d6'], ['Đã kết thúc xác minh', '#39d5ff'], ['Đã ban hành kết luận', '#1baf7a'],
  ['Theo dõi thực hiện kết luận', '#6FD195'], ['Tạm dừng', '#eda100'], ['Hủy/không thực hiện', '#898781']];
const TTRA_CB = [['Xanh - bình thường', '#1baf7a'], ['Vàng - cần theo dõi', '#eda100'], ['Cam - cần bổ sung', '#FD9843'], ['Đỏ - quá hạn/chưa xác nhận', '#d33a44']];
const TTRA_TD = [['Đã hoàn thành', '#1baf7a'], ['Đang thực hiện', '#2a78d6'], ['Quá hạn', '#d33a44']];
/* số cuộc thanh tra theo trạng thái tại 30/9/2026 (thứ tự TTRA_TT); một phần là cuộc từ năm 2025 chuyển sang (cờ kyTruoc) */
const TTRA_TT_SO = [5, 49, 23, 82, 21, 4, 2];
/* true = cách cũ: Vàng khi tiến độ trên 75% (đã bỏ theo bản trả lời BA, mục 80) */
const TTRA_CB_THEO_TIEN_DO = false;
/* kết luận của các năm trước đang theo dõi, đôn đốc thực hiện trong 9 tháng (bản ghi "Theo dõi sau thanh tra") */
const TTRA_THEO_DOI = { tong: 884, hoanThanh: 214, quaHan: 96 };

const TTRA_CUOC = (function () {
  const out = [], tong = ttraSum(TTRA_TT_SO);
  const wDb = TTRA_DV.map((n) => (TTRA_TRUNG_TAM.indexOf(n) >= 0 ? 4 : 1) * (0.4 + ttraR(n, 'tt')));
  const dbCount = ttraSplit(tong, wDb), dbList = [];
  dbCount.forEach((c, i) => { for (let j = 0; j < c; j++) dbList.push(TTRA_DV[i]); });
  let idx = 0;
  TTRA_TT_SO.forEach((so, tt) => {
    for (let j = 0; j < so; j++, idx++) {
      const k = 'tt' + idx, R = (s) => ttraR(k, s);
      const diaBan = dbList[(idx * 37) % dbList.length];
      const rl = R('lv'); let lv = 0, acc = 0; for (; lv < TTRA_LV_W.length - 1; lv++) { acc += TTRA_LV_W[lv]; if (rl < acc) break; }
      const rn = R('ng'), nguon = rn < 0.55 ? 0 : rn < 0.63 ? 1 : rn < 0.78 ? 2 : rn < 0.9 ? 3 : 4;
      const kyTruoc = tt >= 3 ? R('kt') < 0.6 : tt === 2 ? R('kt') < 0.4 : tt === 1 ? R('kt') < 0.1 : false;
      const kl = tt === 3 || tt === 4;
      const ngayKh = 30 + Math.round(30 * R('kh'));
      /* ngày ra quyết định: cuộc chuyển từ 2025 → cuối 2025 (số âm); đang triển khai → phần lớn mới bắt đầu, khoảng 1/4 đã quá thời hạn;
         chưa triển khai → quyết định gần đây; còn lại rải trong 9 tháng */
      const ngayQd = kyTruoc ? -Math.round(10 + 80 * R('q')) : tt === 1 ? TTRA_NGAY_CHOT - 5 - Math.round(ngayKh * (0.3 + 0.95 * R('q')))
        : tt === 0 ? 245 + Math.round(25 * R('q')) : Math.round(5 + 230 * R('q'));
      const keoDai = kl || tt === 2 ? Math.round(ngayKh * (0.95 + 0.35 * R('kd'))) : null;
      /* «Quá hạn (ngày)» là tình trạng HIỆN TẠI: chỉ cuộc đang triển khai quá thời hạn, hoặc đã kết thúc xác minh mà chậm ban hành kết luận */
      const quaHan = tt === 1 ? Math.max(0, TTRA_NGAY_CHOT - (ngayQd + 5 + ngayKh)) : tt === 2 ? Math.max(0, keoDai - ngayKh) : 0;
      /* kiến nghị: chỉ cuộc đã có kết luận; tiền thu hồi chỉ ở các lĩnh vực có dòng tiền */
      const coTien = [0, 1, 2, 3, 4, 5].indexOf(lv) >= 0 && R('ct') < 0.55;
      const thuHoi = kl && coTien ? Math.round(lv === 0 || lv === 3 ? 60 + 380 * R('th') : 20 + 180 * R('th')) : 0;
      out.push({
        ma: 'TTr-' + String(idx + 1).padStart(3, '0'), diaBan: diaBan, tt: tt, lv: lv, nguon: nguon, kyTruoc: kyTruoc,
        soDv: 1 + Math.round(2.4 * R('dv')), kl: kl, ngayQd: ngayQd, ngayKh: ngayKh, keoDai: keoDai, quaHan: quaHan,
        soKn: kl ? 3 + Math.round(10 * R('kn')) : 0, thuHoi: thuHoi,
        daThu: thuHoi ? Math.round(thuHoi * (tt === 4 ? 0.55 + 0.45 * R('dt') : 0.15 + 0.5 * R('dt'))) : 0,
        hcToChuc: kl && R('htc') < 0.3 ? 1 + (R('htc2') < 0.12 ? 1 : 0) : 0,
        hcCaNhan: kl ? (R('hcn') < 0.5 ? 1 + Math.round(2.2 * R('hcn2')) : 0) : 0,
        cqdt: kl && (lv === 0 || lv === 3 || lv === 8) && R('dt3') < 0.08 ? 1 : 0,
        donDoc: tt === 4 ? Math.round(3 * R('dd')) : tt === 1 && quaHan > 0 ? 1 + Math.round(R('dd')) : 0,
        tienDo: tt === 0 ? 0 : tt === 1 ? Math.round(20 + 70 * R('td')) : tt === 2 ? 90 : 100
      });
    }
  });
  /* mức cảnh báo theo tình trạng hiện tại (tự tính, mức cao nhất thắng): đỏ = quá hạn trên 10 ngày; cam = quá hạn đến 10 ngày hoặc tạm dừng;
     vàng = đang triển khai, ĐÃ DÙNG TRÊN 75% THỜI GIAN kế hoạch mà chưa kết thúc (bản trả lời BA, mục 80 — tiến độ cao không phải dấu hiệu rủi ro),
     hoặc đang theo dõi thực hiện kết luận mà còn kiến nghị chưa thu hồi xong; xanh = còn lại.
     Thời gian đã dùng = (ngày chốt − ngày bắt đầu) ÷ (ngày kết thúc dự kiến − ngày bắt đầu); ngày bắt đầu = ngày quyết định + 5 (như «Quá hạn»). */
  out.forEach((c) => {
    c.tgDung = c.tt === 1 ? Math.max(0, Math.round((TTRA_NGAY_CHOT - (c.ngayQd + 5)) / c.ngayKh * 100)) : null;
    const vang = TTRA_CB_THEO_TIEN_DO ? c.tt === 1 && c.tienDo > 75 : c.tt === 1 && c.tgDung > 75;
    c.cb = c.quaHan > 10 ? 3 : c.quaHan > 0 || c.tt === 5 ? 2 : vang || (c.tt === 4 && c.daThu < c.thuHoi) ? 1 : 0;
  });
  return out;
})();

/* ================= 3. TIẾP CÔNG DÂN, GIẢI QUYẾT KHIẾU NẠI, TỐ CÁO ================= */
/* bậc độ lớn cấp xã, 9 tháng: ~60% số tiếp dân của các cơ quan hành chính Thành phố (năm 2024: 35.086 lượt) × 0,75 năm */
const TTRA_TCD_TONG = { luot: 15800, donMoi: 24600 };
const TTRA_MUA = [0.96, 0.82, 1.12, 1.08, 1.1, 1.04, 0.98, 0.94, 0.96];     // tháng Tết ít, quý II nhiều
const TTRA_LOAI_DON = [['Khiếu nại', '#d33a44'], ['Tố cáo', '#FD9843'], ['Kiến nghị, phản ánh', '#2a78d6'], ['Nhiều nội dung/khác', '#8ba7c2']];
const TTRA_KQ = [['Giải quyết đúng hạn', '#1baf7a'], ['Giải quyết quá hạn', '#eda100'], ['Đang xử lý trong hạn', '#2a78d6'], ['Đang xử lý quá hạn', '#d33a44'], ['Rút đơn/đình chỉ', '#898781']];

const TTRA_TCD = (function () {
  const w = TTRA_DV.map(ttraQuyMo);
  const luot = ttraSplit(TTRA_TCD_TONG.luot, w), don = ttraSplit(TTRA_TCD_TONG.donMoi, w.map((x, i) => x * (TTRA_DAT_DAI.indexOf(TTRA_DV[i]) >= 0 ? 1.3 : 1)));
  return TTRA_DV.map((ten, i) => {
    const R = (k) => ttraR('tcd' + ten, k), mua = TTRA_MUA.map((m, j) => m * (0.85 + 0.3 * R('m' + j)));
    const luotT = ttraSplit(luot[i], mua), donT = ttraSplit(don[i], mua);
    const nguoi = Math.round(luot[i] * (1.15 + 0.15 * R('ng')));
    const doan = Math.round(luot[i] * (0.008 + 0.006 * R('do')) * (TTRA_DAT_DAI.indexOf(ten) >= 0 ? 2 : 1));
    const vuTiepDan = Math.round(luot[i] * (0.5 + 0.12 * R('vt')));
    const kyTruoc = Math.round(don[i] * (0.08 + 0.06 * R('kt')));
    /* đơn phải xử lý = kỳ trước chuyển sang + đơn mới; đã xử lý (đã phân loại) = 93–98% số phải xử lý, phần còn lại chuyển kỳ sau (bản trả lời BA, mục 82) */
    const phaiXl = kyTruoc + don[i], xuLy = Math.round(phaiXl * (0.93 + 0.05 * R('xl'))), duDk = Math.round(xuLy * (0.66 + 0.1 * R('dk')));
    const tq = Math.round(duDk * (0.26 + 0.1 * R('tq'))), chuyen = Math.round((duDk - tq) * (0.48 + 0.12 * R('ch')));
    const kn = Math.round(don[i] * (0.12 + 0.05 * R('kn'))), tc = Math.round(don[i] * (0.05 + 0.03 * R('tc'))), khac = Math.round(don[i] * (0.05 + 0.04 * R('kh')));
    const thuLy = Math.round(tq * (0.2 + 0.08 * R('tl')));   // vụ việc khiếu nại, tố cáo thuộc thẩm quyền phải thụ lý
    const rut = Math.round(thuLy * 0.04 * R('rut') * 2), dangQh = Math.round(thuLy * (0.01 + 0.04 * R('dq'))), dangTh = Math.round(thuLy * (0.07 + 0.08 * R('dt')));
    const daGq = thuLy - rut - dangQh - dangTh, quaHan = Math.round(daGq * (0.03 + 0.07 * R('qh')));
    return {
      ten: ten, luotT: luotT, donT: donT, luot: luot[i], nguoi: nguoi, doan: doan, vuTiepDan: vuTiepDan,
      kyTruoc: kyTruoc, donMoi: don[i], phaiXl: phaiXl, daXl: xuLy, chuaXl: phaiXl - xuLy, duDk: duDk, khongDk: xuLy - duDk, tq: tq, chuyen: chuyen, huongDan: duDk - tq - chuyen,
      kn: kn, tc: tc, khac: khac, knpa: don[i] - kn - tc - khac,
      thuLy: thuLy, daGq: daGq, dungHan: daGq - quaHan, quaHan: quaHan, dangTh: dangTh, dangQh: dangQh, rut: rut,
      phucTap: Math.round(thuLy * 0.025 * R('pt') * (TTRA_DAT_DAI.indexOf(ten) >= 0 ? 3 : 1)), ton: dangTh + dangQh
    };
  });
})();

/* ---------- Số tổng hợp ---------- */
const TTRA_SUM = (function () {
  const K = TTRA_KT, C = TTRA_CUOC, U = TTRA_TCD, tong = (a, f) => ttraSum(a.map(f));
  const kt = { n: K.length, keHoach: TTRA_KT_KE_HOACH, kl: K.filter((r) => r.kl).length, soDv: tong(K, (r) => r.soDv), soKn: tong(K, (r) => r.soKn),
    da: tong(K, (r) => r.da), dang: tong(K, (r) => r.dang), qh: tong(K, (r) => r.qh), thuHoi: tong(K, (r) => r.thuHoi),
    tt: TTRA_KT_TT.map((_, i) => K.filter((r) => r.tt === i).length), nd: TTRA_KT_ND.map((_, i) => K.filter((r) => r.nd === i).length) };
  const lvSo = TTRA_LV.map((_, i) => C.filter((c) => c.lv === i).length);
  const tt = { n: C.length, kyTruoc: C.filter((c) => c.kyTruoc).length, kl: C.filter((c) => c.kl).length, soDv: tong(C, (c) => c.soDv),
    soDvKl: tong(C.filter((c) => c.kl), (c) => c.soDv), soKn: tong(C, (c) => c.soKn), thuHoi: tong(C, (c) => c.thuHoi), daThu: tong(C, (c) => c.daThu),
    hcToChuc: tong(C, (c) => c.hcToChuc), hcCaNhan: tong(C, (c) => c.hcCaNhan), cqdt: tong(C, (c) => c.cqdt), donDoc: tong(C, (c) => c.donDoc),
    tt: TTRA_TT.map((_, i) => C.filter((c) => c.tt === i).length), lv: lvSo, nguon: TTRA_NGUON.map((_, i) => C.filter((c) => c.nguon === i).length),
    cb: TTRA_CB.map((_, i) => C.filter((c) => c.cb === i).length),
    lvTien: TTRA_LV.map((_, i) => [tong(C.filter((c) => c.lv === i), (c) => c.thuHoi), tong(C.filter((c) => c.lv === i), (c) => c.daThu)]),
    theoDoi: [TTRA_THEO_DOI.hoanThanh, TTRA_THEO_DOI.tong - TTRA_THEO_DOI.hoanThanh - TTRA_THEO_DOI.quaHan, TTRA_THEO_DOI.quaHan] };
  const keys = ['luot', 'nguoi', 'doan', 'vuTiepDan', 'kyTruoc', 'donMoi', 'phaiXl', 'daXl', 'chuaXl', 'duDk', 'khongDk', 'tq', 'chuyen', 'huongDan', 'kn', 'tc', 'khac', 'knpa',
    'thuLy', 'daGq', 'dungHan', 'quaHan', 'dangTh', 'dangQh', 'rut', 'phucTap', 'ton'];
  const tcd = {}; keys.forEach((k) => { tcd[k] = tong(U, (u) => u[k]); });
  tcd.luotT = TTRA_MONTHS.map((_, m) => tong(U, (u) => u.luotT[m])); tcd.donT = TTRA_MONTHS.map((_, m) => tong(U, (u) => u.donT[m]));
  tcd.top = U.map((u) => [u.ten, u.daGq, u.ton, u.rut]).sort((a, b) => (b[1] + b[2] + b[3]) - (a[1] + a[2] + a[3])).slice(0, 15);
  return { kt: kt, tt: tt, tcd: tcd };
})();

/* ---------- Mô tả 3 chỉ tiêu (dùng cho tài liệu; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const TTRA_CT = [
  { key: 'kt', name: 'Kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật', eform: 'Eform Kiểm tra Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật', ky: TTRA_KY, freq: 'Tháng', soBanGhi: TTRA_KT.length },
  { key: 'tt', name: 'Thanh tra', eform: 'Thanh tra', ky: TTRA_KY, freq: 'Tháng', soBanGhi: TTRA_CUOC.length + TTRA_THEO_DOI.tong },
  { key: 'tcd', name: 'Tiếp công dân, giải quyết khiếu nại, tố cáo', eform: 'Tiếp công dân, giải quyết khiếu nại, tố cáo', ky: TTRA_KY, freq: 'Tháng', soBanGhi: TTRA_DV.length * 9 }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function ttraPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const TTRA_ITEMS = (function () {
  const S = TTRA_SUM, src = 'Eform Thanh tra Thành phố (giả lập)';
  const parts = {
    kt: [ttraPart('Kết quả', 'stat', [['Cuộc kiểm tra', S.kt.n], ['Đã ban hành kết luận', S.kt.kl], ['Kiến nghị xử lý', S.kt.soKn]])],
    tt: [ttraPart('Kết quả', 'stat', [['Cuộc thanh tra', S.tt.n], ['Đã ban hành kết luận', S.tt.kl], ['Kiến nghị xử lý', S.tt.soKn]])],
    tcd: [ttraPart('Kết quả', 'stat', [['Lượt tiếp công dân', S.tcd.luot], ['Đơn thư tiếp nhận', S.tcd.donMoi], ['Vụ việc đã giải quyết', S.tcd.daGq]])]
  };
  return TTRA_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
