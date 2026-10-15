/* ============================== SỞ VĂN HÓA VÀ THỂ THAO — BỘ CHỈ TIÊU MỚI THEO 6 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở VHTT"), 6 eform / 152 trường nhập. Mỗi eform thành 1 chỉ tiêu
   trên IOC, hiển thị theo khuôn chung của các sở (khối catBoxHtml + biểu đồ Chart.js, xem dashboard-vhtt.js).
   Chưa có số thật: toàn bộ số dưới đây là SỐ GIẢ LẬP, đã cộng kiểm cho khớp (tổng = cộng các phân tổ).
   Kỳ hiển thị mặc định: lũy kế 9 tháng năm 2026 (tháng 1 – 9); riêng chỉ tiêu 1 và 2 lấy bản báo cáo mới nhất (tháng 9 /
   quý III) vì số đã là số tích lũy.
   Nạp TRƯỚC central-level.js (central-level.js dùng VHTT_ITEMS). Không dùng hàm nào của file khác. */

const VHTT_KY = '9 tháng năm 2026';
const VHTT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function vhttN(n, d) {
  if (n == null || !isFinite(n)) return '—';
  d = d || 0;
  const p = Math.abs(n).toFixed(d).split('.');
  return (n < 0 ? '−' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (p[1] ? ',' + p[1] : '');
}
function vhttSum(a) { return a.reduce((s, v) => s + v, 0); }
function vhttPct(a, b, d) { return vhttN(b ? (a / b) * 100 : null, d == null ? 1 : d) + '%'; }

/* ---------- Cờ theo phản hồi nhóm triển khai 13/10/2026: chỉ hiện số tính được từ trường có trong eform ----------
   VHTT_SHOW_KE_HOACH_DT: eform doanh thu không có trường kế hoạch → ẩn "so kế hoạch năm", đường kế hoạch lũy kế (số 42,8 tỷ giữ lại).
   VHTT_TACH_DUNG_HAN: eform 08-CT không có ngày hoàn thành thực tế («Ngày cập nhật tiến độ» là ngày cập nhật) → không tách
   hoàn thành đúng hạn / chậm, gộp thành "Hoàn thành"; ẩn tỷ lệ đúng hạn. Đặt true để hiện lại. */
const VHTT_SHOW_KE_HOACH_DT = false;
const VHTT_TACH_DUNG_HAN = false;
/* 5 nhóm tiến độ → nhóm hiển thị (gộp 2 nhóm hoàn thành khi không tách đúng hạn) */
function vhttCt08Nhom(st, vals) {
  if (VHTT_TACH_DUNG_HAN) return st.map((s, i) => [s, vals[i]]);
  return [[{ l: 'Hoàn thành', c: st[0].c }, vals[0] + vals[1]]].concat(st.slice(2).map((s, i) => [s, vals[i + 2]]));
}

/* ---------- Số giả lập theo từng chỉ tiêu ---------- */
const VHTT_DATA = {
  /* 1. Báo cáo tiến độ triển khai Chương trình hành động số 08-CT — bản báo cáo tháng 9/2026 */
  ct08: {
    st: [
      { l: 'Hoàn thành đúng hạn', c: '#1baf7a' }, { l: 'Hoàn thành chậm', c: '#eda100' },
      { l: 'Đang thực hiện, trong hạn', c: '#2a78d6' }, { l: 'Đang thực hiện, quá hạn', c: '#d33a44' },
      { l: 'Chưa triển khai', c: '#898781' }
    ],
    /* [đơn vị chủ trì, số nhiệm vụ theo 5 trạng thái ở trên] */
    dv: [
      ['Văn phòng Sở', [4, 0, 2, 1, 0]],
      ['Phòng Kế hoạch - Tài chính', [3, 1, 2, 1, 0]],
      ['Phòng Quản lý Văn hóa', [5, 1, 3, 1, 1]],
      ['Phòng Quản lý Thể dục thể thao', [4, 1, 3, 1, 0]],
      ['Phòng Quản lý Di sản văn hóa', [3, 1, 3, 1, 1]],
      ['Phòng Xây dựng nếp sống văn hóa và Gia đình', [3, 0, 2, 0, 0]]
    ],
    /* Lũy kế theo tháng: số nhiệm vụ đến hạn theo kế hoạch / số nhiệm vụ đã hoàn thành */
    khLk: [4, 7, 10, 14, 17, 21, 24, 27, 31],
    htLk: [3, 5, 8, 11, 14, 17, 20, 23, 26]
  },
  /* 2. Cơ cấu dự án Thành phố đầu tư, hỗ trợ đầu tư giai đoạn 2026-2030 — bản báo cáo quý III/2026 */
  duan: {
    /* [nhóm công trình, số dự án theo NQ 80, số dự án đã bố trí vốn, vốn theo NQ 80 (tỷ đồng), vốn đã bố trí (tỷ đồng)] */
    nhom: [
      ['Tu bổ, tôn tạo di tích', 14, 10, 3260, 2140],
      ['Thiết chế văn hóa cấp Thành phố', 6, 4, 4850, 3020],
      ['Công trình thể dục thể thao', 5, 3, 2640, 1480],
      ['Thiết chế văn hóa, thể thao cơ sở', 8, 6, 1230, 910],
      ['Số hóa, bảo tồn di sản', 3, 1, 500, 315]
    ],
    /* số dự án theo tiến độ thực hiện */
    td: [['Chuẩn bị đầu tư', 15, '#eda100'], ['Đang thực hiện', 17, '#2a78d6'], ['Đã hoàn thành', 4, '#1baf7a']]
  },
  /* 3. Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý — lũy kế 9 tháng */
  ntg: {
    /* [loại hoạt động, số hoạt động, số người tham gia] */
    loai: [['Biểu diễn', 186, 312400], ['Triển lãm', 64, 148600], ['Liên hoan/Hội diễn', 52, 96800], ['Sự kiện', 88, 486200], ['Khác', 22, 18400]],
    quyMo: [['Nhỏ', 238, '#39d5ff'], ['Vừa', 131, '#2a78d6'], ['Lớn', 43, '#4a3aa7']],
    cap: [['Phường/Xã', 214], ['Thành phố', 96], ['Đơn vị', 64], ['Quận/Huyện', 38]],
    doiSoat: [['Đã đối soát', 338], ['Đang đối soát', 42], ['Chưa đối soát', 24], ['Cần bổ sung', 8]],
    buoi: 968,
    thangHd: [58, 36, 42, 40, 44, 38, 46, 52, 56],
    thangNguoi: [186200, 72400, 98600, 128400, 104800, 86200, 92600, 118400, 174800]
  },
  /* 4. Doanh thu của các đơn vị nghệ thuật Thành phố quản lý — lũy kế 9 tháng, triệu đồng */
  dt: {
    keHoach: 42800,                                   // kế hoạch doanh thu năm 2026 (số của bộ chỉ tiêu cũ, chờ Sở xác nhận)
    khoan: [['Bán vé', '#2a78d6'], ['Hợp đồng/đặt hàng', '#1baf7a'], ['Tài trợ/quảng cáo', '#eda100'], ['Dịch vụ khác', '#4a3aa7']],
    /* [đơn vị nghệ thuật, [bán vé, hợp đồng, tài trợ, dịch vụ khác], chi phí trực tiếp, NSNN hỗ trợ, lượt khán giả] */
    dv: [
      ['Nhà hát Chèo Hà Nội', [2860, 1940, 620, 180], 5120, 3200, 48600],
      ['Nhà hát Cải lương Hà Nội', [2140, 1560, 410, 130], 4380, 2900, 36200],
      ['Nhà hát Kịch Hà Nội', [3920, 1280, 760, 240], 5460, 2400, 41800],
      ['Nhà hát Múa rối Thăng Long', [7860, 980, 520, 1140], 7240, 1200, 162400],
      ['Nhà hát Ca múa nhạc Thăng Long', [2480, 2160, 840, 220], 5180, 2600, 52000]
    ],
    soVe: 214000,
    soChuongTrinh: 268,
    tinhChat: [['Có thu', 214], ['Phục vụ chính trị', 42], ['Không thu', 12]],
    /* tổng doanh thu theo trạng thái hạch toán (triệu đồng) */
    hachToan: [['Đã đối soát với Sở VHTT', 22180, '#1baf7a'], ['Đã hạch toán', 5140, '#2a78d6'], ['Đã xuất hóa đơn/chứng từ', 2260, '#39d5ff'], ['Tạm tính', 1720, '#eda100'], ['Chờ đối soát', 940, '#898781']],
    thangDt: [4860, 3120, 3280, 3540, 3360, 3020, 3460, 3680, 3920],
    thangCp: [4020, 2760, 2880, 3020, 2900, 2680, 3000, 3000, 3120]
  },
  /* 5. Số hoạt động nghệ thuật chuyên nghiệp — lũy kế 9 tháng, chỉ hoạt động đã diễn ra */
  ntcn: {
    loaiHinh: [['Liên hoan', '#2a78d6'], ['Hội diễn', '#1baf7a'], ['Hội thi', '#eda100']],
    /* số hoạt động đã diễn ra theo tháng, tách theo 3 loại hình chuẩn */
    thang: [[10, 3, 6, 7, 7, 5, 7, 8, 9], [14, 6, 7, 9, 8, 7, 7, 9, 11], [7, 3, 5, 6, 5, 4, 5, 5, 6]],
    ngoaiQd: 6,                                       // "Khác/ngoài QĐ4795 - cần giải trình": không cộng vào phân tổ chuẩn
    tinhChat: [['Phục vụ chính trị', 82, '#d33a44'], ['Có thu', 74, '#2a78d6'], ['Kết hợp có thu và phục vụ chính trị', 30, '#eda100']],
    quyMo: [['Thành phố', 151, '#2a78d6'], ['Quốc gia', 35, '#eda100']],
    ngheThuat: [['Ca múa nhạc', 46], ['Sân khấu', 32], ['Chèo', 28], ['Nghệ thuật tổng hợp', 26], ['Cải lương', 18], ['Múa', 14], ['Xiếc', 10], ['Tuồng', 6], ['Khác', 6]],
    hinhThuc: [['Trực tiếp', 158], ['Kết hợp trực tiếp - trực tuyến', 22], ['Trực tuyến', 6]],
    chuaDienRa: [['Đang chuẩn bị', 14], ['Tạm hoãn', 5], ['Hủy', 3]],
    buoi: 624, ngheSi: 9840, khanGia: 486300,
    /* kinh phí, triệu đồng (trường gốc tính bằng đồng) */
    kinhPhi: [['Doanh thu vé/dịch vụ', 14620, '#2a78d6'], ['Kinh phí NSNN hỗ trợ', 21400, '#d33a44'], ['Nguồn kinh phí khác', 6850, '#1baf7a']]
  },
  /* 6. Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội — lũy kế 9 tháng */
  bc: {
    cx: [['Tích cực', '#1baf7a'], ['Trung tính', '#8ba7c2'], ['Tiêu cực', '#d33a44']],
    /* [loại nguồn, [tích cực, trung tính, tiêu cực]] */
    nguon: [
      ['Báo điện tử', [6420, 2980, 410]], ['Mạng xã hội', [4860, 3640, 1180]], ['Trang tin điện tử', [1520, 860, 140]],
      ['Báo in', [980, 340, 40]], ['Truyền hình', [620, 180, 30]], ['Phát thanh', [340, 120, 10]], ['Khác', [110, 70, 10]]
    ],
    thangTc: [1820, 1420, 1540, 1560, 1600, 1530, 1720, 1770, 1890],
    thangTong: [2960, 2420, 2580, 2640, 2720, 2580, 2860, 2940, 3160],
    thangTieuCuc: [240, 170, 190, 210, 230, 180, 190, 200, 210],
    linhVuc: [['Văn hóa, lễ hội', 5240], ['Du lịch', 4180], ['Thể thao', 3620], ['Đô thị, giao thông', 3460], ['Kinh tế', 2860], ['Giáo dục', 1940], ['Y tế', 1320], ['Khác', 2240]],
    /* tin tiêu cực theo mức độ ưu tiên xử lý */
    uuTien: [['Khẩn cấp', 36, '#d33a44'], ['Cao', 212, '#FD9843'], ['Trung bình', 784, '#eda100'], ['Thấp', 788, '#898781']],
    xem: 186.4, chiaSe: 4.82, binhLuan: 3.16, thich: 21.7, reach: 142.6,   // triệu lượt
    coDiaBan: 15620                                    // tin bài có gắn địa bàn phường/xã (bảng 126 đơn vị)
  }
};

/* ---------- Số tổng hợp (tính từ VHTT_DATA, dùng chung cho thẻ, biểu đồ, bảng cách tính) ---------- */
const VHTT_SUM = (function () {
  const D = VHTT_DATA;
  const ct08St = D.ct08.st.map((_, i) => vhttSum(D.ct08.dv.map((r) => r[1][i])));
  const ct08Tong = vhttSum(ct08St), ct08Ht = ct08St[0] + ct08St[1];
  const da = D.duan.nhom;
  const ntgHd = vhttSum(D.ntg.loai.map((r) => r[1])), ntgNguoi = vhttSum(D.ntg.loai.map((r) => r[2]));
  const dtDv = D.dt.dv.map((r) => vhttSum(r[1]));
  const dtKhoan = D.dt.khoan.map((_, i) => vhttSum(D.dt.dv.map((r) => r[1][i])));
  const dtTong = vhttSum(dtDv), dtCp = vhttSum(D.dt.dv.map((r) => r[2]));
  const ntcnLoai = D.ntcn.thang.map(vhttSum), ntcnThang = VHTT_MONTHS.map((_, m) => vhttSum(D.ntcn.thang.map((s) => s[m])));
  const bcCx = D.bc.cx.map((_, i) => vhttSum(D.bc.nguon.map((r) => r[1][i])));
  return {
    ct08: { st: ct08St, tong: ct08Tong, ht: ct08Ht, quaHan: ct08St[3], htTyLe: (ct08Ht / ct08Tong) * 100, dungHanTyLe: (ct08St[0] / ct08Ht) * 100 },
    duan: { da: vhttSum(da.map((r) => r[1])), daBt: vhttSum(da.map((r) => r[2])), von: vhttSum(da.map((r) => r[3])), vonBt: vhttSum(da.map((r) => r[4])) },
    ntg: { hd: ntgHd, nguoi: ntgNguoi, bq: ntgNguoi / ntgHd, daDoiSoat: D.ntg.doiSoat[0][1] },
    dt: { dv: dtDv, khoan: dtKhoan, tong: dtTong, cp: dtCp, cl: dtTong - dtCp, nsnn: vhttSum(D.dt.dv.map((r) => r[3])), khan: vhttSum(D.dt.dv.map((r) => r[4])), giaVe: (dtKhoan[0] * 1e6) / D.dt.soVe,
      lk: D.dt.thangDt.reduce((a, v) => a.concat([(a.length ? a[a.length - 1] : 0) + v]), []), khLk: VHTT_MONTHS.map((_, m) => Math.round((D.dt.keHoach / 12) * (m + 1))) },
    ntcn: { loai: ntcnLoai, tong: vhttSum(ntcnLoai), thang: ntcnThang },
    bc: { cx: bcCx, tong: vhttSum(bcCx), nguonTong: D.bc.nguon.map((r) => vhttSum(r[1])), canXuLy: D.bc.uuTien[0][1] + D.bc.uuTien[1][1] }
  };
})();

/* ---------- Mô tả 6 chỉ tiêu + CÁCH TÍNH từng số trên giao diện ----------
   so: tên số liệu / biểu đồ trên IOC · truong: trường eform lấy dữ liệu (đúng tên hiển thị trong file mô tả eform)
   cach: cách tính · kq: kết quả với số giả lập hiện tại. Bảng này dùng cho khung "Cách tính" trong form và cho tài liệu
   docs/VHTT_SoVanHoaTheThao/VHTT_MO_TA_CHI_TIEU.md (tools/vhtt-build-doc.js) — sửa ở đây thì cả hai cùng đổi. */
const VHTT_CT = (function () {
  const D = VHTT_DATA, S = VHTT_SUM;
  return [
    {
      key: 'ct08', name: 'Tiến độ triển khai Chương trình hành động số 08-CT', eform: 'Báo cáo tiến độ triển khai Chương trình hành động số 08-CT',
      freq: 'Tháng', ky: 'Tháng 9/2026', soBanGhi: S.ct08.tong,
      banGhi: 'Mỗi bản ghi là một nhiệm vụ của Chương trình. Mỗi tháng Sở gửi lại cả danh sách với tiến độ mới nhất, nên IOC chỉ lấy bản báo cáo của kỳ đang xem (chọn theo các trường Kỳ báo cáo, Năm và Tháng), không cộng dồn các tháng.',
      giaDinh: [
        '«Tiến độ thực hiện» đang là kiểu Chữ; IOC giả định chỉ nhận 3 giá trị Hoàn thành / Đang thực hiện / Chưa thực hiện. Đề nghị đổi trường này sang Danh mục.',
        '«Thời gian hoàn thành theo Kế hoạch» đang là kiểu Chữ nhưng nội dung là ngày; IOC đọc như ngày tháng. Đề nghị đổi sang kiểu Ngày tháng.',
        'Eform không có ngày hoàn thành thực tế; «Ngày cập nhật tiến độ» là ngày cập nhật, không phải ngày hoàn thành. Vì vậy IOC không tách hoàn thành đúng hạn / chậm và không tính tỷ lệ đúng hạn (phản hồi nhóm triển khai 13/10/2026).'
      ],
      f: [
        { so: 'Tổng số nhiệm vụ', truong: 'Chỉ tiêu / Nhiệm vụ', cach: 'Đếm số nhiệm vụ trong bản báo cáo của kỳ.', kq: vhttN(S.ct08.tong) + ' nhiệm vụ' },
        { so: 'Đã hoàn thành', truong: 'Tiến độ thực hiện', cach: 'Đếm nhiệm vụ có Tiến độ thực hiện = Hoàn thành.', kq: vhttN(S.ct08.ht) + ' nhiệm vụ' },
        { so: 'Tỷ lệ hoàn thành', truong: 'Tiến độ thực hiện', cach: 'Đã hoàn thành ÷ Tổng số nhiệm vụ × 100.', kq: vhttN(S.ct08.ht) + ' ÷ ' + vhttN(S.ct08.tong) + ' = ' + vhttPct(S.ct08.ht, S.ct08.tong) },
        { so: 'Quá hạn chưa hoàn thành', truong: 'Tiến độ thực hiện, Thời gian hoàn thành theo Kế hoạch', cach: 'Đếm nhiệm vụ chưa Hoàn thành mà Thời gian hoàn thành theo Kế hoạch đã trước ngày cuối kỳ.', kq: vhttN(S.ct08.quaHan) + ' nhiệm vụ' },
        { so: 'Biểu đồ tròn "Nhiệm vụ theo tiến độ"', truong: 'Tiến độ thực hiện, Thời gian hoàn thành theo Kế hoạch', cach: 'Xếp mỗi nhiệm vụ vào 1 trong 4 nhóm: Hoàn thành, Đang thực hiện trong hạn, Đang thực hiện quá hạn (hạn kế hoạch < ngày cuối kỳ), Chưa triển khai; đếm từng nhóm.', kq: vhttCt08Nhom(D.ct08.st, S.ct08.st).map((r) => r[0].l + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ cột "Theo đơn vị chủ trì"', truong: 'Đơn vị chủ trì, Tiến độ thực hiện, Thời gian hoàn thành theo Kế hoạch', cach: 'Nhóm nhiệm vụ theo Đơn vị chủ trì, trong mỗi đơn vị đếm theo 4 nhóm tiến độ như trên (cột xếp chồng).', kq: D.ct08.dv.length + ' đơn vị chủ trì' },
        { so: 'Biểu đồ đường "Kế hoạch và thực tế lũy kế"', truong: 'Thời gian hoàn thành theo Kế hoạch, Tiến độ thực hiện, Tháng', cach: 'Với mỗi tháng t: Kế hoạch = số nhiệm vụ có hạn kế hoạch đến hết tháng t; Thực tế = số nhiệm vụ đã Hoàn thành trong bản báo cáo tháng t.', kq: 'Tháng 9: kế hoạch ' + D.ct08.khLk[8] + ', thực tế ' + D.ct08.htLk[8] }
      ]
    },
    {
      key: 'duan', name: 'Dự án Thành phố đầu tư, hỗ trợ đầu tư lĩnh vực văn hóa, thể thao giai đoạn 2026-2030', eform: 'Cơ cấu dự án Thành phố đầu tư, hỗ trợ đầu tư giai đoạn 2026-2030',
      freq: 'Quý', ky: 'Quý III/2026', soBanGhi: S.duan.da,
      banGhi: 'Mỗi bản ghi là một nhóm công trình («Tên công trình») trên một «Địa bàn». Số liệu là số tích lũy của cả giai đoạn 2026-2030, nên IOC chỉ lấy bản báo cáo mới nhất, không cộng các kỳ.',
      giaDinh: [
        '«Tổng giai đoạn 2026-2030 theo NQ 80» và «KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí» nhập bằng triệu đồng (đã chốt theo bản trả lời BA, mục 85); IOC chia 1.000, hiển thị tỷ đồng.',
        '«Tiến độ thực hiện» đang là kiểu Chữ; IOC giả định 3 giá trị Chuẩn bị đầu tư / Đang thực hiện / Đã hoàn thành.'
      ],
      f: [
        { so: 'Số dự án theo NQ 80', truong: 'Số dự án theo NQ 80', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.duan.da) + ' dự án' },
        { so: 'Số dự án đã bố trí vốn', truong: 'Số dự án Thành phố đã bố trí vốn KH 2026-2030', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.duan.daBt) + ' dự án' },
        { so: 'Tỷ lệ dự án đã bố trí vốn', truong: '2 trường trên', cach: 'Số dự án đã bố trí vốn ÷ Số dự án theo NQ 80 × 100.', kq: vhttPct(S.duan.daBt, S.duan.da) },
        { so: 'Tổng vốn theo NQ 80', truong: 'Tổng giai đoạn 2026-2030 theo NQ 80', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.duan.von) + ' tỷ đồng' },
        { so: 'Vốn đã bố trí', truong: 'KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí', cach: 'Cộng trường này của tất cả bản ghi; tỷ lệ = Vốn đã bố trí ÷ Tổng vốn theo NQ 80 × 100.', kq: vhttN(S.duan.vonBt) + ' tỷ đồng = ' + vhttPct(S.duan.vonBt, S.duan.von) },
        { so: 'Biểu đồ cột "Vốn theo nhóm công trình"', truong: 'Tên công trình, 2 trường vốn ở trên', cach: 'Nhóm theo Tên công trình, cộng 2 trường vốn trong từng nhóm.', kq: D.duan.nhom.length + ' nhóm công trình' },
        { so: 'Biểu đồ tròn "Dự án theo tiến độ"', truong: 'Tiến độ thực hiện, Số dự án theo NQ 80', cach: 'Nhóm theo Tiến độ thực hiện, cộng Số dự án theo NQ 80 trong từng nhóm.', kq: D.duan.td.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Cột "Dự án" ở bảng 126 phường/xã', truong: 'Địa bàn, Số dự án theo NQ 80', cach: 'Nhóm theo Địa bàn, cộng Số dự án theo NQ 80.', kq: 'Tổng các phường/xã = ' + vhttN(S.duan.da) }
      ]
    },
    {
      key: 'ntg', name: 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý', eform: 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý',
      freq: 'Tháng', ky: VHTT_KY, soBanGhi: S.ntg.hd,
      banGhi: 'Mỗi bản ghi là một hoạt động / chương trình. IOC cộng các bản báo cáo tháng 1 – 9/2026; mỗi «Mã bản ghi» chỉ đếm một lần (nếu một hoạt động được sửa ở tháng sau thì lấy bản mới nhất).',
      giaDinh: ['Hai trường «Hoạt động/ Nghệ thuật» và «Loại hoạt động» có danh mục gần trùng nhau; IOC dùng «Loại hoạt động» để phân tổ. Đề nghị Sở bỏ bớt một trường.'],
      f: [
        { so: 'Số hoạt động', truong: 'Mã bản ghi', cach: 'Đếm số bản ghi trong kỳ.', kq: vhttN(S.ntg.hd) + ' hoạt động' },
        { so: 'Lượt người tham gia', truong: 'Số người tham gia', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.ntg.nguoi) + ' lượt' },
        { so: 'Số buổi / đêm diễn', truong: 'Số buổi/đêm diễn', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(D.ntg.buoi) + ' buổi' },
        { so: 'Bình quân người tham gia một hoạt động', truong: 'Số người tham gia', cach: 'Lượt người tham gia ÷ Số hoạt động.', kq: vhttN(S.ntg.nguoi) + ' ÷ ' + vhttN(S.ntg.hd) + ' = ' + vhttN(S.ntg.bq) },
        { so: 'Tỷ lệ đã đối soát', truong: 'Trạng thái đối soát', cach: 'Đếm bản ghi có Trạng thái đối soát = Đã đối soát ÷ Số hoạt động × 100.', kq: vhttPct(S.ntg.daDoiSoat, S.ntg.hd) },
        { so: 'Biểu đồ "Theo loại hoạt động"', truong: 'Loại hoạt động, Số người tham gia', cach: 'Nhóm theo Loại hoạt động: cột = đếm số hoạt động, đường = cộng Số người tham gia (nghìn lượt).', kq: D.ntg.loai.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ tròn "Theo quy mô"', truong: 'Quy mô IOC', cach: 'Đếm số hoạt động theo Quy mô IOC (Nhỏ / Vừa / Lớn).', kq: D.ntg.quyMo.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ cột "Theo cấp tổ chức"', truong: 'Cấp tổ chức thực tế', cach: 'Đếm số hoạt động theo Cấp tổ chức thực tế.', kq: D.ntg.cap.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ "Diễn biến theo tháng"', truong: 'Ngày bắt đầu, Số người tham gia', cach: 'Nhóm theo tháng của Ngày bắt đầu (ngày diễn ra hoạt động): cột = đếm số hoạt động, đường = cộng Số người tham gia.', kq: '9 tháng, cộng lại = ' + vhttN(S.ntg.hd) + ' hoạt động' },
        { so: 'Cột "Hoạt động", "Người tham gia" ở bảng 126 phường/xã', truong: 'Địa bàn, Số người tham gia', cach: 'Nhóm theo Địa bàn: đếm số hoạt động, cộng Số người tham gia.', kq: 'Tổng các phường/xã = số toàn Thành phố' }
      ]
    },
    {
      key: 'dt', name: 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý', eform: 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý',
      freq: 'Tháng', ky: VHTT_KY, soBanGhi: D.dt.soChuongTrinh,
      banGhi: 'Mỗi bản ghi là một chương trình của một đơn vị nghệ thuật. IOC cộng các bản báo cáo tháng 1 – 9/2026, bỏ các bản ghi có Tính chất = Không phát sinh. Tiền tính bằng triệu đồng.',
      giaDinh: [
        'Eform không có trường kế hoạch doanh thu, nên IOC không hiện tỷ lệ so kế hoạch năm và đường kế hoạch lũy kế (phản hồi nhóm triển khai 13/10/2026).',
        'Trong file mô tả, dữ liệu mẫu của «Doanh thu dịch vụ khác (triệu đồng)» và «Tổng doanh thu (tỷ đồng)» đang là ngày tháng, cần sửa lại thành số.',
        'Nếu «Tổng doanh thu (triệu đồng)» khác tổng 4 khoản doanh thu, IOC lấy tổng 4 khoản và đánh dấu bản ghi cần kiểm tra.'
      ],
      f: [
        { so: 'Tổng doanh thu', truong: 'Tổng doanh thu (triệu đồng)', cach: 'Cộng trường này của tất cả bản ghi (= cộng 4 khoản doanh thu).', kq: vhttN(S.dt.tong) + ' triệu đồng' },
        { so: 'Chênh lệch thu – chi', truong: 'Chênh lệch thu-chi (triệu đồng)', cach: 'Cộng trường này (= Tổng doanh thu − Chi phí trực tiếp).', kq: vhttN(S.dt.tong) + ' − ' + vhttN(S.dt.cp) + ' = ' + vhttN(S.dt.cl) + ' triệu đồng' },
        { so: 'Kinh phí NSNN hỗ trợ', truong: 'Kinh phí NSNN hỗ trợ (triệu đồng)', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.dt.nsnn) + ' triệu đồng' },
        { so: 'Lượt khán giả', truong: 'Lượt khán giả', cach: 'Cộng trường này của tất cả bản ghi.', kq: vhttN(S.dt.khan) + ' lượt' },
        { so: 'Giá vé bình quân', truong: 'Doanh thu bán vé (triệu đồng), Số vé bán', cach: 'Cộng Doanh thu bán vé × 1.000.000 ÷ cộng Số vé bán. Không lấy trung bình trường Giá vé bình quân vì mỗi chương trình bán số vé khác nhau.', kq: vhttN(S.dt.khoan[0]) + ' triệu ÷ ' + vhttN(D.dt.soVe) + ' vé = ' + vhttN(S.dt.giaVe) + ' đồng' },
        { so: 'Biểu đồ tròn "Cơ cấu nguồn thu"', truong: 'Doanh thu bán vé, Doanh thu hợp đồng/đặt hàng, Doanh thu tài trợ/quảng cáo, Doanh thu dịch vụ khác', cach: 'Cộng riêng từng trường; tỷ trọng = khoản ÷ Tổng doanh thu × 100.', kq: D.dt.khoan.map((k, i) => k[0] + ' ' + vhttPct(S.dt.khoan[i], S.dt.tong)).join(' · ') },
        { so: 'Biểu đồ cột "Theo đơn vị nghệ thuật"', truong: 'Đơn vị nghệ thuật TP quản lý, 4 trường doanh thu', cach: 'Nhóm theo đơn vị, cộng 4 khoản doanh thu (cột xếp chồng); ô chi tiết có thêm chi phí và chênh lệch.', kq: D.dt.dv.length + ' đơn vị' },
        { so: 'Biểu đồ "Doanh thu, chi phí theo tháng"', truong: 'Ngày bắt đầu, Tổng doanh thu (triệu đồng), Chi phí trực tiếp (triệu đồng)', cach: 'Cột = cộng doanh thu và chi phí của từng tháng (theo Ngày bắt đầu của chương trình); đường = doanh thu cộng dồn từ tháng 1.', kq: 'Lũy kế tháng 9 ' + vhttN(S.dt.lk[8]) },
        { so: 'Biểu đồ tròn "Theo trạng thái hạch toán"', truong: 'Trạng thái hạch toán, Tổng doanh thu (triệu đồng)', cach: 'Nhóm theo Trạng thái hạch toán, cộng Tổng doanh thu.', kq: 'Đã đối soát với Sở ' + vhttPct(D.dt.hachToan[0][1], S.dt.tong) },
        { so: 'Cột "Doanh thu" ở bảng 126 phường/xã', truong: 'Địa bàn, Tổng doanh thu (triệu đồng)', cach: 'Nhóm theo Địa bàn nơi tổ chức, cộng Tổng doanh thu.', kq: 'Tổng các phường/xã = ' + vhttN(S.dt.tong) }
      ]
    },
    {
      key: 'ntcn', name: 'Số hoạt động nghệ thuật chuyên nghiệp', eform: 'Eform Số hoạt động nghệ thuật chuyên nghiệp',
      freq: 'Tháng', ky: VHTT_KY, soBanGhi: S.ntcn.tong,
      banGhi: 'Mỗi bản ghi là một hoạt động nghệ thuật. IOC cộng các bản báo cáo tháng 1 – 9/2026 và chỉ đếm hoạt động có Trạng thái hoạt động = Đã diễn ra. Phân tổ chuẩn theo QĐ 4795 chỉ gồm Liên hoan, Hội diễn, Hội thi; hoạt động "Khác/ngoài QĐ4795" hiện riêng, không cộng vào.',
      giaDinh: ['Hoạt động có Tính chất "Kết hợp có thu và phục vụ chính trị" được tách riêng một nhóm, không cộng vào cả hai nhóm Có thu và Phục vụ chính trị.', 'Tiền trong eform tính bằng đồng; IOC đổi sang triệu đồng (÷ 1.000.000).'],
      f: [
        { so: 'Số hoạt động nghệ thuật chuyên nghiệp', truong: 'Mã hoạt động, Trạng thái hoạt động, Loại hình theo', cach: 'Đếm hoạt động Đã diễn ra có Loại hình theo là Liên hoan, Hội diễn hoặc Hội thi.', kq: vhttN(S.ntcn.tong) + ' hoạt động (ngoài ra ' + D.ntcn.ngoaiQd + ' hoạt động ngoài QĐ 4795)' },
        { so: 'Số buổi / đêm diễn, lượt nghệ sĩ, lượt khán giả', truong: 'Số buổi/đêm diễn, Số lượt nghệ sĩ/diễn viên, Số lượt khán giả', cach: 'Cộng từng trường của các hoạt động đã đếm ở trên.', kq: vhttN(D.ntcn.buoi) + ' buổi · ' + vhttN(D.ntcn.ngheSi) + ' nghệ sĩ · ' + vhttN(D.ntcn.khanGia) + ' khán giả' },
        { so: 'Biểu đồ cột "Theo tháng và loại hình"', truong: 'Ngày bắt đầu, Loại hình theo', cach: 'Nhóm theo tháng của Ngày bắt đầu, trong mỗi tháng đếm theo Loại hình theo (cột xếp chồng).', kq: D.ntcn.loaiHinh.map((l, i) => l[0] + ' ' + S.ntcn.loai[i]).join(' · ') },
        { so: 'Biểu đồ tròn "Theo tính chất"', truong: 'Tính chất theo', cach: 'Đếm theo Tính chất theo.', kq: D.ntcn.tinhChat.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ tròn "Theo quy mô"', truong: 'Quy mô theo', cach: 'Đếm theo Quy mô theo; chỉ cộng Quốc gia và Thành phố (giá trị "Khác cấp địa bàn" chỉ để xem chi tiết).', kq: D.ntcn.quyMo.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Biểu đồ cột "Theo loại hình nghệ thuật"', truong: 'Loại hình nghệ thuật', cach: 'Đếm theo Loại hình nghệ thuật, xếp từ nhiều đến ít.', kq: D.ntcn.ngheThuat.length + ' loại hình' },
        { so: 'Biểu đồ tròn "Nguồn kinh phí"', truong: 'Doanh thu vé/dịch vụ (đồng), Kinh phí NSNN hỗ trợ (đồng), Nguồn kinh phí khác (đồng)', cach: 'Cộng từng trường rồi ÷ 1.000.000 ra triệu đồng.', kq: D.ntcn.kinhPhi.map((r) => r[0] + ' ' + vhttN(r[1])).join(' · ') + ' triệu đồng' },
        { so: 'Ô "Chưa diễn ra"', truong: 'Trạng thái hoạt động', cach: 'Đếm hoạt động có trạng thái Đang chuẩn bị, Tạm hoãn, Hủy (không cộng vào số hoạt động).', kq: D.ntcn.chuaDienRa.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Cột "Hoạt động chuyên nghiệp" ở bảng 126 phường/xã', truong: 'Đơn vị báo cáo', cach: 'Nhóm theo Đơn vị báo cáo, đếm như trên.', kq: 'Tổng các phường/xã = ' + vhttN(S.ntcn.tong) }
      ]
    },
    {
      key: 'bc', name: 'Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội', eform: 'Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội',
      freq: 'Tháng', ky: VHTT_KY, soBanGhi: S.bc.tong,
      banGhi: 'Mỗi bản ghi là một tin / bài. IOC cộng các bản báo cáo tháng 1 – 9/2026 theo «Ngày đăng»; tin có cùng «Link bài viết» chỉ đếm một lần.',
      giaDinh: ['Lượt xem, chia sẻ, bình luận, thích, tiếp cận là số tại «Thời gian cập nhật» gần nhất của tin; IOC lấy số mới nhất, không cộng các lần cập nhật.'],
      f: [
        { so: 'Tổng tin bài', truong: 'Mã bản ghi, Link bài viết', cach: 'Đếm số tin bài trong kỳ.', kq: vhttN(S.bc.tong) + ' tin bài' },
        { so: 'Tỷ lệ tích cực / tiêu cực', truong: 'Mức độ cảm xúc', cach: 'Đếm tin Tích cực (hoặc Tiêu cực) ÷ Tổng tin bài × 100.', kq: 'Tích cực ' + vhttPct(S.bc.cx[0], S.bc.tong) + ' · Tiêu cực ' + vhttPct(S.bc.cx[2], S.bc.tong) },
        { so: 'Tin tiêu cực cần xử lý gấp', truong: 'Mức độ cảm xúc, Mức độ ưu tiên xử lý', cach: 'Đếm tin Tiêu cực có Mức độ ưu tiên xử lý = Khẩn cấp hoặc Cao.', kq: vhttN(S.bc.canXuLy) + ' tin' },
        { so: 'Lượt xem, chia sẻ, bình luận, thích, tiếp cận', truong: 'Lượt xem, Lượt chia sẻ, Lượt bình luận, Lượt thích, Lượt tiếp cận (Reach)', cach: 'Cộng từng trường của tất cả tin bài (số mới nhất của mỗi tin).', kq: 'Lượt xem ' + vhttN(D.bc.xem, 1) + ' triệu' },
        { so: 'Biểu đồ cột "Theo loại nguồn và cảm xúc"', truong: 'Loại nguồn, Mức độ cảm xúc', cach: 'Nhóm theo Loại nguồn, trong mỗi nguồn đếm theo Mức độ cảm xúc (cột xếp chồng).', kq: D.bc.nguon.length + ' loại nguồn' },
        { so: 'Biểu đồ "Diễn biến theo tháng"', truong: 'Ngày đăng, Mức độ cảm xúc', cach: 'Nhóm theo tháng của Ngày đăng: cột = tổng tin bài; đường = số tin Tích cực và Tiêu cực.', kq: 'Tháng 9: ' + vhttN(D.bc.thangTong[8]) + ' tin, ' + D.bc.thangTieuCuc[8] + ' tiêu cực' },
        { so: 'Biểu đồ cột "Theo lĩnh vực"', truong: 'Lĩnh vực', cach: 'Đếm tin bài theo Lĩnh vực, xếp từ nhiều đến ít.', kq: D.bc.linhVuc[0][0] + ' nhiều nhất (' + vhttN(D.bc.linhVuc[0][1]) + ')' },
        { so: 'Biểu đồ tròn "Tin tiêu cực theo mức ưu tiên"', truong: 'Mức độ cảm xúc, Mức độ ưu tiên xử lý', cach: 'Chỉ lấy tin Tiêu cực, đếm theo Mức độ ưu tiên xử lý.', kq: D.bc.uuTien.map((r) => r[0] + ' ' + r[1]).join(' · ') },
        { so: 'Cột "Tin bài" ở bảng 126 phường/xã', truong: 'Địa bàn', cach: 'Đếm tin bài theo Địa bàn; tin nói về Thành phố chung (không gắn phường/xã) không vào bảng.', kq: vhttN(D.bc.coDiaBan) + ' / ' + vhttN(S.bc.tong) + ' tin có gắn địa bàn' }
      ]
    }
  ];
})();

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ----------
   [tên, số bản ghi, tần suất, nguồn, phân tổ] — phân tổ (dạng P/S của central-level.js) dùng cho thẻ xem trước ở lưới
   chỉ tiêu; vkey nối dòng với khối hiển thị trong dashboard-vhtt.js. */
function vhttPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const VHTT_ITEMS = (function () {
  const D = VHTT_DATA, S = VHTT_SUM, src = 'Eform Sở VHTT (giả lập)';
  const parts = {
    ct08: [vhttPart('Tiến độ', 'bar', D.ct08.st.map((s, i) => [s.l, S.ct08.st[i]]))],
    duan: [vhttPart('Dự án', 'stat', [['Dự án theo NQ 80', S.duan.da], ['Đã bố trí vốn', S.duan.daBt], ['Vốn đã bố trí (tỷ đồng)', S.duan.vonBt]])],
    ntg: [vhttPart('Quy mô', 'bar', D.ntg.quyMo.map((r) => [r[0], r[1]]))],
    dt: [vhttPart('Nguồn thu (triệu đồng)', 'bar', D.dt.khoan.map((k, i) => [k[0], S.dt.khoan[i]]))],
    ntcn: [vhttPart('Loại hình', 'bar', D.ntcn.loaiHinh.map((l, i) => [l[0], S.ntcn.loai[i]]))],
    bc: [vhttPart('Mức độ cảm xúc', 'bar', D.bc.cx.map((c, i) => [c[0], S.bc.cx[i]]))]
  };
  return VHTT_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
