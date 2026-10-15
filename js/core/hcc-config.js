/* ============================== TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG — CẤU HÌNH BỘ CHỈ TIÊU MỚI ==============================
   Cùng khuôn với bộ chỉ tiêu Sở Tài chính (stc-*) và Sở GD&ĐT (sgd-*).
   Nguồn dự kiến: 9 API "hcc_tkpro" (thư mục api/API_HCC, hiện CHỈ CÓ SCHEMA, chưa có bản ghi thật). Các endpoint thống kê
   trả số theo cây đơn vị (id, parentId, level): Thành phố → khối → từng sở/ngành và 126 phường/xã. Trong lúc chưa có số
   thật, form dùng SỐ LIỆU GIẢ LẬP (js/features/hcc-data.js), luôn gắn nhãn "DỮ LIỆU GIẢ LẬP".
   Nạp TRƯỚC central-level.js vì central-level.js dùng HCC_ITEMS / HCC_ENABLED. */

/* false = ẩn hẳn lĩnh vực "Trung tâm Phục vụ hành chính công" khỏi danh sách sở/ngành (code giữ nguyên). */
const HCC_ENABLED = true;

/* true = hiện thêm các thẻ nhóm rút gọn NGOÀI lưới chỉ tiêu, bên dưới băng Tổng quan (giống cờ của STC/SGD, đang tắt). */
const HCC_SHOW_OUTER_GROUP_CARDS = false;

/* Kỳ báo cáo = quý (giả định: API chưa có tham số kỳ trong schema). Mới nhất đứng đầu và là kỳ mặc định.
   Quý 3/2026 chưa kết thúc nên chưa đưa vào. */
const HCC_PERIODS = [
  { id: '2026Q2', y: 2026, q: 2 }, { id: '2026Q1', y: 2026, q: 1 }, { id: '2025Q4', y: 2025, q: 4 },
  { id: '2025Q3', y: 2025, q: 3 }, { id: '2025Q2', y: 2025, q: 2 }, { id: '2025Q1', y: 2025, q: 1 }
];
function hccPeriodLabel(id) { const p = HCC_PERIODS.find((x) => x.id === id); return p ? 'Quý ' + p.q + '/' + p.y : String(id || '—'); }
function hccPeriodShort(id) { const p = HCC_PERIODS.find((x) => x.id === id); return p ? 'Q' + p.q + '/' + String(p.y).slice(2) : '—'; }

const HCC_GROUPS = [
  { id: 'tn', label: 'Tiếp nhận hồ sơ', src: 'thong_ke_theo_linh_vuc · thong_ke_tai_khoan', note: 'Theo lĩnh vực và kênh nộp' },
  { id: 'gq', label: 'Giải quyết hồ sơ', src: 'ttgqhs · ttgqhs_detail · thong_ke_theo_linh_vuc', note: 'Trước hạn, đúng hạn, trễ hạn' },
  { id: 'dvc', label: 'Dịch vụ công trực tuyến', src: 'tthc_truc_tuyen · tthc_truc_tuyen_detail · thanh_toan_truc_tuyen', note: 'Mức độ cung cấp và thanh toán trực tuyến' },
  { id: 'sh', label: 'Số hóa hồ sơ', src: 'so_hoa_ho_so', note: 'Hồ sơ được số hóa khi tiếp nhận' },
  { id: 'hl', label: 'Mức độ hài lòng', src: 'muc_do_hai_long', note: 'Đánh giá của người dân, doanh nghiệp' }
];

/* Các GIẢ ĐỊNH chưa được Trung tâm Phục vụ HCC xác nhận — sửa ở đây khi có thông tin thật (hiện ở màn "Nguồn dữ liệu"). */
const HCC_ASSUME = [
  'Kỳ báo cáo là quý; schema chưa có tham số từ ngày – đến ngày nên chưa rõ API trả theo tháng, quý hay lũy kế.',
  'thong_ke_theo_linh_vuc: total = hồ sơ tiếp nhận mới trong kỳ = totalTrucTuyen + totalTrucTiep + totalBCCI; totalKyTruoc = hồ sơ kỳ trước chuyển sang; totalHT = hồ sơ đã giải quyết xong.',
  'Hồ sơ còn tồn cuối kỳ = totalKyTruoc + total − totalHT (form tự tính, API không trả).',
  'Hồ sơ đang xử lý cuối kỳ = hồ sơ còn tồn cuối kỳ của từng đơn vị; hồ sơ đang xử lý trễ hạn = hồ sơ chưa trả kết quả mà hạn xử lý đã qua tại ngày cuối kỳ. Với API Dịch vụ công mới: hồ sơ có ngày tiếp nhận, chưa có ngày hoàn thành và date_of_expiration trước ngày cuối kỳ.',
  'Danh sách sở, ngành theo file Mã định danh (chỉ đơn vị cấp sở đang kích hoạt); số của sở = số của mã sở cộng các đơn vị trực thuộc (cùng tiền tố mã).',
  'ttgqhs: totalTruocHan + totalDungHan + totalTreHan = hồ sơ đã giải quyết trong kỳ của đơn vị; tỷ lệ đúng hạn = (trước hạn + đúng hạn) ÷ tổng.',
  'tthc_truc_tuyen: total_TT = thủ tục trực tuyến toàn trình, total_1Phan = trực tuyến một phần, total_ChuaTT = chưa trực tuyến; ba số cộng lại bằng total.',
  'Số thủ tục cấp Thành phố lấy từ nút gốc (level 1) của cây đơn vị, không cộng các đơn vị con, vì một thủ tục áp dụng cho nhiều đơn vị.',
  'so_hoa_ho_so: total_SH ≤ total; thanh_toan_truc_tuyen: total_TT + total_Other = total (hồ sơ có phí, lệ phí).',
  'muc_do_hai_long: rat_Hai_Long + hai_Long + binh_Thuong + khong_Hai_Long + rat_Khong_Hai_Long = total (lượt đánh giá); tỷ lệ hài lòng = (rất hài lòng + hài lòng) ÷ total.',
  'thong_ke_tai_khoan là số tài khoản lũy kế đến cuối kỳ, không phải số đăng ký mới trong kỳ.'
];

/* Sở, ngành có thủ tục hành chính trên hệ thống (khối Sở/ngành). [tên, trọng số hồ sơ, số TTHC, lĩnh vực chính]
   Cập nhật 02/10/2026 theo file "Mã định danh.xlsx" (HCC_NEW) và lần quét thật API Dịch vụ công Hà Nội: chỉ giữ đơn vị
   cấp sở đang KÍCH HOẠT. Trọng số = số hồ sơ thật từ 07/2025, ĐÃ CỘNG đơn vị trực thuộc (số của mã cha không gồm mã con,
   vd Sở NN&MT H26.103 có 5.303 nhưng Văn phòng Đăng ký đất đai + 28 chi nhánh có 981.529). Sở VH,TT&DL (H26.231) cộng
   thêm lịch sử của hai mã cũ đã ngừng H26.17 + H26.3. Sở Ngoại vụ thực tế chưa có hồ sơ: để trọng số rất nhỏ cho bảng
   không trống. Không đưa H26.101 (Trung tâm Phục vụ HCC) vào vì mã này chỉ chứa dữ liệu test. Trọng số chỉ dùng để chia
   số giả lập; số thủ tục (cột 3) vẫn là số ước lượng. */
const HCC_SO = [
  ['Sở Nông nghiệp và Môi trường', 986832, 214, ['datdai', 'khac']], ['Sở Y tế', 46064, 176, ['yte']], ['Sở Nội vụ', 20010, 168, ['laodong', 'btxh', 'ncc']],
  ['Sở Công Thương', 9927, 132, ['congthuong']], ['Sở Văn hóa, Thể thao và Du lịch', 7924, 134, ['khac']], ['Sở Xây dựng', 7154, 142, ['xaydung', 'gtvt']],
  ['Sở Tài chính', 5891, 186, ['dkkd', 'khac']], ['Sở Giáo dục và Đào tạo', 5400, 98, ['giaoduc']], ['Sở Tư pháp', 5369, 154, ['lltp', 'hotich', 'chungthuc']],
  ['Sở Khoa học và Công nghệ', 3598, 118, ['khac']], ['Ban Quản lý Khu công nghệ cao và khu công nghiệp', 2533, 86, ['dkkd', 'laodong']],
  ['Văn phòng UBND Thành phố', 401, 18, ['khac']], ['Sở Dân tộc và Tôn giáo', 121, 42, ['khac']], ['Thanh tra Thành phố', 21, 12, ['khac']],
  ['Sở Ngoại vụ', 5, 24, ['khac']]
];
/* Danh sách 14 sở/ngành CŨ (trước 02/10/2026), giữ lại để tham khảo, KHÔNG dùng. Sở VH&TT, Sở Du lịch, Sở QH-KT đã ngừng kích hoạt. */
const HCC_SO_CU = [
  ['Sở Tài chính', 16, 186, ['dkkd', 'khac']], ['Sở Tư pháp', 18, 154, ['lltp', 'hotich', 'chungthuc']], ['Sở Xây dựng', 9, 142, ['xaydung', 'gtvt']],
  ['Sở Nông nghiệp và Môi trường', 8, 214, ['datdai', 'khac']], ['Sở Y tế', 7, 176, ['yte']], ['Sở Nội vụ', 6, 168, ['laodong', 'btxh', 'ncc']],
  ['Sở Công Thương', 6, 132, ['congthuong']], ['Sở Giáo dục và Đào tạo', 3, 98, ['giaoduc']], ['Sở Khoa học và Công nghệ', 3, 118, ['khac']],
  ['Sở Văn hóa và Thể thao', 2, 96, ['khac']], ['Sở Quy hoạch - Kiến trúc', 2, 24, ['xaydung']], ['Sở Du lịch', 1, 38, ['khac']],
  ['Sở Dân tộc và Tôn giáo', 1, 42, ['khac']], ['Ban Quản lý Khu công nghệ cao và khu công nghiệp', 2, 86, ['dkkd', 'laodong']]
];

/* Lĩnh vực của thong_ke_theo_linh_vuc: [mã, tên, trọng số hồ sơ, độ lệch tỷ lệ nộp trực tuyến so với bình quân (điểm %)] */
const HCC_LV = [
  ['hotich', 'Hộ tịch', 24, 8], ['chungthuc', 'Chứng thực', 19, -20], ['datdai', 'Đất đai', 12, -10], ['dkkd', 'Đăng ký kinh doanh', 8, 18],
  ['lltp', 'Lý lịch tư pháp', 5, 12], ['xaydung', 'Xây dựng', 5, -2], ['btxh', 'Bảo trợ xã hội', 5, -6], ['laodong', 'Lao động, việc làm', 4, 6],
  ['yte', 'Y tế', 4, 2], ['giaoduc', 'Giáo dục và Đào tạo', 3, 4], ['gtvt', 'Giao thông vận tải', 3, 10], ['ncc', 'Người có công', 2, -8],
  ['congthuong', 'Công thương', 2, 8], ['khac', 'Lĩnh vực khác', 4, 0]
];
/* Tên thủ tục mẫu theo lĩnh vực — chỉ để minh họa danh sách hồ sơ / thủ tục trong hồ sơ đơn vị (ttgqhs_detail, tthc_truc_tuyen_detail). */
const HCC_TTHC_MAU = {
  hotich: ['Đăng ký khai sinh', 'Đăng ký kết hôn', 'Đăng ký khai tử', 'Cấp bản sao trích lục hộ tịch', 'Cấp giấy xác nhận tình trạng hôn nhân'],
  chungthuc: ['Chứng thực bản sao từ bản chính', 'Chứng thực chữ ký', 'Chứng thực hợp đồng, giao dịch'],
  datdai: ['Đăng ký biến động quyền sử dụng đất', 'Cấp Giấy chứng nhận quyền sử dụng đất lần đầu', 'Chuyển mục đích sử dụng đất', 'Tách thửa, hợp thửa đất'],
  dkkd: ['Đăng ký thành lập doanh nghiệp', 'Đăng ký thay đổi nội dung đăng ký doanh nghiệp', 'Đăng ký hộ kinh doanh'],
  lltp: ['Cấp Phiếu lý lịch tư pháp cho công dân Việt Nam', 'Cấp Phiếu lý lịch tư pháp cho người nước ngoài'],
  xaydung: ['Cấp giấy phép xây dựng nhà ở riêng lẻ', 'Cấp giấy phép xây dựng công trình', 'Điều chỉnh giấy phép xây dựng'],
  btxh: ['Trợ cấp xã hội hằng tháng', 'Hỗ trợ chi phí mai táng', 'Xác định mức độ khuyết tật'],
  laodong: ['Cấp giấy phép lao động cho người nước ngoài', 'Đăng ký nội quy lao động', 'Giải quyết trợ cấp thất nghiệp'],
  yte: ['Cấp chứng chỉ hành nghề khám bệnh, chữa bệnh', 'Cấp giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm'],
  giaoduc: ['Cấp bản sao văn bằng, chứng chỉ', 'Chuyển trường cho học sinh trung học'],
  gtvt: ['Cấp phép thi công trên đường bộ đang khai thác', 'Cấp giấy phép vận tải'],
  ncc: ['Giải quyết chế độ trợ cấp người có công', 'Cấp đổi Bằng Tổ quốc ghi công'],
  congthuong: ['Cấp giấy phép bán lẻ rượu', 'Cấp giấy chứng nhận đủ điều kiện kinh doanh xăng dầu'],
  khac: ['Cấp giấy phép tổ chức lễ hội', 'Cấp giấy phép hoạt động khoa học và công nghệ', 'Công nhận điểm du lịch']
};
/* Lĩnh vực mà cấp phường/xã giải quyết */
const HCC_XA_LV = ['hotich', 'chungthuc', 'datdai', 'btxh', 'ncc', 'dkkd', 'xaydung'];

/* Số của từng kỳ để SINH SỐ GIẢ LẬP, xếp đúng thứ tự HCC_PERIODS (mới nhất trước). Tỷ lệ tính bằng %.
   hcc-data.js chia các tổng này cho các sở/ngành (HCC_SO) và 126 phường/xã, nên số mọi cấp cộng lại luôn khớp.
   Khi có API thật thì bỏ bảng này: số lấy thẳng từ các endpoint. */
const HCC_TARGETS = {
  hs: [1186400, 1042300, 1238700, 1154200, 1098600, 968400],      // hồ sơ tiếp nhận mới trong kỳ
  tonEnd: [96400, 101800, 88600, 93200, 90100, 86900],            // hồ sơ còn tồn cuối kỳ (để suy ra số đã giải quyết)
  ktFirst: 84200,                                                  // tồn đầu kỳ của kỳ cũ nhất
  soShare: 29,                                                     // % hồ sơ thuộc khối sở/ngành (quét thật 02/10/2026: 1,10 / 3,85 triệu ≈ 28,6%)
  treR: [0.92, 1.08, 1.37, 1.61, 1.94, 2.31],                     // % trễ hạn trên số đã giải quyết
  dxlTreR: [6.4, 7.1, 8.3, 9.2, 10.6, 12.1],                      // % hồ sơ đang xử lý cuối kỳ đã quá hạn xử lý
  thR: [62.4, 60.8, 58.1, 55.9, 53.2, 50.6],                      // % trước hạn trên số đã giải quyết
  shR: [88.6, 86.9, 84.1, 81.7, 78.2, 74.5],                      // % hồ sơ được số hóa
  tpR: [37.8, 38.1, 37.2, 37.6, 38.4, 37.9],                      // % hồ sơ có phí, lệ phí
  tttR: [58.4, 55.1, 51.9, 47.6, 44.2, 40.3],                     // % hồ sơ có phí được thanh toán trực tuyến
  dgR: [44.6, 42.1, 39.8, 36.2, 33.5, 30.9],                      // % hồ sơ đã giải quyết có đánh giá
  hlR: [97.8, 97.5, 97.1, 96.6, 96.2, 95.7],                      // % rất hài lòng + hài lòng
  rhlShare: [71.2, 70.4, 69.1, 68.3, 67.0, 65.8],                 // % rất hài lòng trong nhóm hài lòng
  badR: [0.52, 0.61, 0.78, 0.93, 1.12, 1.34],                     // % không hài lòng + rất không hài lòng
  olR: [76.2, 74.0, 71.3, 68.5, 65.1, 61.8],                      // % nộp trực tuyến
  bcR: [2.1, 2.0, 1.9, 1.9, 1.8, 1.7],                            // % nộp qua bưu chính công ích (BCCI)
  ttUnitR: [62.1, 60.2, 57.4, 54.3, 51.0, 47.8],                  // % thủ tục toàn trình của một đơn vị (bình quân)
  mpUnitR: [30.2, 31.4, 33.1, 35.0, 36.8, 38.4],                  // % thủ tục một phần của một đơn vị (bình quân)
  tthcCity: [1968, 1962, 1957, 1951, 1944, 1938],                 // số thủ tục cấp Thành phố (nút gốc)
  ttCity: [1146, 1108, 1057, 1002, 946, 893],
  mpCity: [612, 634, 662, 694, 727, 752],
  tkCd: [4862300, 4612800, 4356100, 4104700, 3866200, 3612500],   // tài khoản công dân (lũy kế)
  tkDn: [218400, 209600, 201300, 193100, 186000, 178200]          // tài khoản doanh nghiệp (lũy kế)
};

/* Lưới chỉ tiêu của IOC: 1 thẻ TỔNG QUAN (băng rộng cả hàng) + 5 thẻ NHÓM + 1 thẻ "Theo đơn vị", dạng
   [tên, số bản ghi, tần suất, nguồn] cho categorySeed (central-level.js). Số bản ghi = 0 để hệ thống demo KHÔNG sinh
   bản ghi giả; hccKey nối thẻ với màn tương ứng trong form mới (dashboard-hcc.js). */
function hccItem(label, key) { const it = [label, 0, 'Quý', 'API Trung tâm Phục vụ HCC (giả lập)']; it.hccKey = key; return it; }
const HCC_ITEMS = [hccItem('Tổng quan', 'home')]
  .concat(HCC_GROUPS.map((g) => hccItem(g.label, g.id)))
  .concat([hccItem('Chỉ tiêu theo sở, ngành và 126 phường/xã', 'xa')]);
