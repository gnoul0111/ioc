/* ===== "Kiểm đếm nhiệm vụ – Ban Tổ chức Trung ương" (#btctwTaskTally) =====
   Viết lại vào code của mình từ khối task-tally của bộ btctw/ (chỉ tham chiếu thiết kế, không nhúng). Bản demo:
   toàn bộ số liệu là NHIỆM VỤ MÔ PHỎNG dựng tại chỗ (không gọi API), hạn hoàn thành tính theo NGÀY HÔM NAY nên
   luôn có nhiệm vụ trong hạn / quá hạn / sắp tới hạn dù mở vào ngày nào.
   Chỉ hiện với tài khoản 'tw' (role TW_ALL), tài khoản trục 'twdang' và tài khoản đơn vị 'ban-tw-dang-btc' (cùng role
   TW_DANG); các Vụ/phòng sâu hơn trong BTC Trung ương vẫn dùng màn cũ. Đặt BTCTW_TASK_TALLY = false để ẩn khối này (code giữ nguyên).
   Luồng: 6 thẻ số + 4 biểu đồ (lớp 1) → bấm thẻ/cột/hình tròn → dashboard lớp 2 (biểu đồ + danh sách) → bấm 1 dòng
   mở chi tiết nhiệm vụ. Xuất Excel chọn trường bằng ExcelJS (đã nạp sẵn ở demo_ioc.html). */
const BTCTW_TASK_TALLY = true;

(function () {
  'use strict';

  const OFFICE_IDS = [null, 'tw-dang-btc'];
  const $ = (id) => document.getElementById(id);
  const F = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* yyyy-mm-dd theo giờ ĐỊA PHƯƠNG — không dùng toISOString() (quy sang UTC, ở UTC+7 sẽ lùi 1 ngày trước 7h sáng) */
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dmy = (s) => (s ? s.split('-').reverse().join('/') : '');
  const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const days = (s) => Math.round((new Date(s + 'T00:00:00') - TODAY) / 86400000);
  const deVN = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

  /* ---------------------------------------------------------------- danh mục */
  const ST = [
    { k: 'done', l: 'Đã hoàn thành', c: 'var(--btt-done)' },
    { k: 'ontime', l: 'Đang thực hiện – trong hạn', c: 'var(--btt-ontime)' },
    { k: 'late', l: 'Đang thực hiện – quá hạn', c: 'var(--btt-late)' },
    { k: 'routine', l: 'Nhiệm vụ thường xuyên', c: 'var(--btt-routine)' }
  ];
  const S_LB = { done: 'Hoàn thành', ontime: 'Trong hạn', late: 'Quá hạn', routine: 'Thường xuyên' };
  const S_CLS = { done: 'btt-st-done', ontime: 'btt-st-ontime', late: 'btt-st-late', routine: 'btt-st-routine' };
  const STATUS_LB = {
    done: 'Đã hoàn thành', ontime: 'Đang thực hiện – Trong hạn',
    late: 'Đang thực hiện – Quá hạn', routine: 'Nhiệm vụ thường xuyên'
  };
  /* cấp trình suy từ mã nhiệm vụ — xét BTCTW trước vì chuỗi này chứa cả "TW" */
  const CAP = [
    { k: 'BTCTW', l: 'Trình Ban Tổ chức Trung ương' },
    { k: 'BCT', l: 'Trình Bộ Chính trị' },
    { k: 'BBT', l: 'Trình Ban Bí thư' },
    { k: 'TX', l: 'Nhiệm vụ thường xuyên' },
    { k: 'TW', l: 'Trình Trung ương' }
  ];
  const capTrinh = (ma) => { const m = String(ma || '').toUpperCase(); const hit = CAP.find((c) => m.includes(c.k)); return hit ? hit.l : 'Chưa xác định'; };
  const LD_ORDER = ['Đ/c Nguyễn Duy Ngọc', 'Đ/c Hà Minh Hải', 'Đ/c Bùi Thị Quỳnh Vân', 'Đ/c Nguyễn Thanh Bình', 'Đ/c Nguyễn Thành Tâm', 'Đ/c Trịnh Mạnh Linh'];

  /* kế hoạch chuyển đổi số — chế độ xem thứ 2 của khối "Theo cấp trình đề án" */
  const KH_CSDL = 'Kế hoạch triển khai Cơ sở dữ liệu quốc gia về công tác xây dựng Đảng';
  const KH_SOTAY = 'Kế hoạch phát triển Sổ tay đảng viên điện tử';
  const KH_ATTT = 'Kế hoạch bảo đảm an toàn thông tin hệ thống dùng chung';
  const KH_NOIBO = 'Kế hoạch chuyển đổi số nội bộ của Ban';
  const KH_BY_NO = { 1: KH_CSDL, 2: KH_SOTAY, 3: KH_ATTT, 8: KH_NOIBO, 9: KH_SOTAY, 10: KH_CSDL, 13: KH_SOTAY, 16: KH_CSDL, 17: KH_CSDL, 22: KH_CSDL, 27: KH_CSDL, 35: KH_NOIBO };

  /* phòng / lãnh đạo / cán bộ của từng đơn vị chủ trì (tên người là tên giả lập) */
  const STAFF = ['Trần Minh Đức', 'Nguyễn Thị Hải Yến', 'Lê Văn Cường', 'Đào Thu Trang', 'Phan Quang Vinh', 'Hồ Thị Ngọc Ánh', 'Mai Xuân Trường', 'Lưu Thị Bích Hạnh', 'Đinh Công Sơn', 'Tạ Thị Phương Thảo', 'Cao Văn Lợi', 'Kiều Thị Hồng Nhung'];
  const UNITS = {
    'Văn phòng Ban': { rooms: ['Phòng Tổng hợp', 'Phòng Hành chính - Quản trị', 'Phòng Công nghệ thông tin'], lead: ['Đ/c Phạm Quốc Bảo', 'Đ/c Ngô Thị Thanh Loan'] },
    'Vụ Cơ sở đảng, đảng viên': { rooms: ['Phòng Cơ sở đảng khối cơ quan', 'Phòng Quản lý đảng viên', 'Phòng Tổng hợp'], lead: ['Đ/c Vũ Thị Mai Hương', 'Đ/c Đặng Minh Tuấn'] },
    'Vụ Cán bộ': { rooms: ['Phòng Quản lý cán bộ I', 'Phòng Quản lý cán bộ II', 'Phòng Tổng hợp'], lead: ['Đ/c Hoàng Anh Dũng', 'Đ/c Bùi Văn Hiếu'] },
    'Vụ Tổ chức - Điều lệ': { rooms: ['Phòng Tổ chức bộ máy', 'Phòng Điều lệ và Hướng dẫn', 'Phòng Tổng hợp'], lead: ['Đ/c Đỗ Thị Lan Phương', 'Đ/c Trương Công Thành'] },
    'Cục Bảo vệ chính trị nội bộ': { rooms: ['Phòng Thẩm tra, xác minh', 'Phòng Nghiệp vụ', 'Phòng Tổng hợp'], lead: ['Đ/c Phạm Quốc Bảo', 'Đ/c Vũ Thị Mai Hương'] },
    'Cục Đào tạo, bồi dưỡng cán bộ': { rooms: ['Phòng Kế hoạch - Chương trình', 'Phòng Quản lý học viên', 'Phòng Tổng hợp'], lead: ['Đ/c Đặng Minh Tuấn', 'Đ/c Ngô Thị Thanh Loan'] },
    'Vụ Địa phương I': { rooms: ['Phòng Theo dõi địa bàn phía Bắc', 'Phòng Tổng hợp'], lead: ['Đ/c Hoàng Anh Dũng', 'Đ/c Đỗ Thị Lan Phương'] },
    'Vụ Địa phương II': { rooms: ['Phòng Theo dõi địa bàn miền Trung', 'Phòng Tổng hợp'], lead: ['Đ/c Bùi Văn Hiếu', 'Đ/c Trương Công Thành'] },
    'Vụ Địa phương III': { rooms: ['Phòng Theo dõi địa bàn phía Nam', 'Phòng Tổng hợp'], lead: ['Đ/c Phạm Quốc Bảo', 'Đ/c Đặng Minh Tuấn'] },
    'Vụ Nghiên cứu khoa học tổ chức, cán bộ': { rooms: ['Phòng Nghiên cứu lý luận', 'Phòng Tổng kết thực tiễn'], lead: ['Đ/c Vũ Thị Mai Hương', 'Đ/c Hoàng Anh Dũng'] },
    'Vụ Chính sách cán bộ': { rooms: ['Phòng Chế độ, chính sách', 'Phòng Tổng hợp'], lead: ['Đ/c Ngô Thị Thanh Loan', 'Đ/c Bùi Văn Hiếu'] }
  };
  const UNIT_NAMES = Object.keys(UNITS);

  /* chủ đề / văn bản giao suy từ đề án và đơn vị chủ trì */
  function chuDeOf(da, u) {
    if (/Chuyển đổi số|Cơ sở dữ liệu/.test(da)) return 'Chuyển đổi số, cơ sở dữ liệu';
    if (/Đại hội/.test(da)) return 'Đại hội đảng bộ các cấp';
    if (/Kiện toàn|Vị trí việc làm/.test(da)) return 'Tổ chức bộ máy, biên chế';
    if (/Đào tạo/.test(da)) return 'Đào tạo, bồi dưỡng cán bộ';
    if (/Cải cách thủ tục/.test(da)) return 'Cải cách thủ tục hành chính trong Đảng';
    if (/Quy hoạch|Chính sách cán bộ/.test(da)) return 'Công tác cán bộ';
    if (/Nghiên cứu/.test(da)) return 'Nghiên cứu khoa học tổ chức';
    if (/cơ sở đảng/i.test(da)) return 'Xây dựng cơ sở đảng, đảng viên';
    if (u === 'Cục Bảo vệ chính trị nội bộ') return 'Bảo vệ chính trị nội bộ';
    if (u === 'Vụ Cán bộ' || u === 'Vụ Chính sách cán bộ') return 'Công tác cán bộ';
    if (u === 'Vụ Tổ chức - Điều lệ') return 'Tổ chức bộ máy, biên chế';
    if (u === 'Vụ Cơ sở đảng, đảng viên') return 'Xây dựng cơ sở đảng, đảng viên';
    return 'Công tác chung của Ban';
  }
  /* văn bản giao ghi theo số ký hiệu như hệ thống gốc (vd "200-QĐ/TW") */
  function vbgOf(da, t) {
    if (/Chuyển đổi số|Cơ sở dữ liệu/.test(da)) return '57-NQ/TW';
    if (/Đại hội/.test(da)) return '35-CT/TW';
    if (/Kiện toàn/.test(da)) return '126-KL/TW';
    if (/Cải cách thủ tục/.test(da)) return '338-QĐ/TW';
    if (/Điều lệ/.test(t) || /cơ sở đảng/i.test(da)) return '24-QĐ/TW';
    return 'Chương trình công tác năm 2026';
  }

  /* ------------------------------------------------------------ nhiệm vụ mô phỏng
     [mã, tên, đơn vị chủ trì, đề án, LĐ Ban phụ trách, loại văn bản, hạn (mốc 12/08/2026), trạng thái]
     Hạn được DỊCH theo ngày hôm nay (cùng khoảng cách so với mốc) để trạng thái luôn khớp với hạn. */
  const BASE_DAY = Date.UTC(2026, 7, 12);
  const DA_CDS = 'Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng';
  const DA_CSDL_DV = 'Đề án Cơ sở dữ liệu tổ chức đảng, đảng viên';
  const DA_CSDL_CB = 'Đề án Cơ sở dữ liệu cán bộ';
  const DA_CCTTHC = 'Đề án Cải cách thủ tục hành chính trong Đảng';
  const DA_KT = 'Đề án Kiện toàn tổ chức bộ máy';
  const DA_VTVL = 'Đề án Vị trí việc làm';
  const DA_DH = 'Đề án Đại hội đảng bộ các cấp';
  const DA_TX = 'Công tác thường xuyên';
  const LD_NGOC = 'Đ/c Nguyễn Duy Ngọc', LD_HAI = 'Đ/c Hà Minh Hải', LD_VAN = 'Đ/c Bùi Thị Quỳnh Vân',
    LD_BINH = 'Đ/c Nguyễn Thanh Bình', LD_TAM = 'Đ/c Nguyễn Thành Tâm', LD_LINH = 'Đ/c Trịnh Mạnh Linh';
  const VPB = 'Văn phòng Ban', CSD = 'Vụ Cơ sở đảng, đảng viên', CB = 'Vụ Cán bộ', TCDL = 'Vụ Tổ chức - Điều lệ',
    BVCT = 'Cục Bảo vệ chính trị nội bộ', DT = 'Cục Đào tạo, bồi dưỡng cán bộ', DP1 = 'Vụ Địa phương I',
    DP2 = 'Vụ Địa phương II', DP3 = 'Vụ Địa phương III', NCKH = 'Vụ Nghiên cứu khoa học tổ chức, cán bộ', CSCB = 'Vụ Chính sách cán bộ';
  const RAW = [
    ['2026/BCT-001', 'Tham mưu ban hành Quyết định Danh mục dữ liệu và từ điển dữ liệu HTTT lĩnh vực TCXDĐ', VPB, DA_CDS, LD_HAI, 'Kế hoạch', '2026-08-31', 'ontime'],
    ['2026/BTCTW-002', 'Phối hợp phát triển, mở rộng tính năng ứng dụng Sổ tay đảng viên điện tử', VPB, DA_CDS, LD_HAI, 'Kế hoạch', '2026-08-14', 'ontime'],
    ['2026/BBT-003', 'Xây dựng phương án bảo đảm an toàn thông tin hệ thống dùng chung của Ban', VPB, DA_CDS, LD_HAI, 'Công văn', '2026-06-30', 'late'],
    ['2026/TW-004', 'Tổng hợp, xây dựng báo cáo công tác tổ chức xây dựng Đảng 6 tháng đầu năm', VPB, DA_TX, LD_NGOC, 'Báo cáo', '2026-08-13', 'ontime'],
    ['2026/TX-005', 'Rà soát chế độ báo cáo định kỳ của các đơn vị thuộc Ban', VPB, DA_TX, LD_HAI, 'Công văn', '', 'routine'],
    ['2026/BCT-006', 'Hoàn thiện quy chế làm việc của Ban nhiệm kỳ mới', VPB, DA_KT, LD_NGOC, 'Quyết định', '2026-07-20', 'late'],
    ['2026/BTCTW-007', 'Chuẩn bị nội dung phục vụ hội nghị giao ban quý III', VPB, DA_TX, LD_NGOC, 'Kế hoạch', '2026-08-15', 'ontime'],
    ['2026/BTCTW-008', 'Nghiệm thu phần mềm quản lý văn bản điều hành nội bộ', VPB, DA_CDS, LD_HAI, 'Quyết định', '2026-05-30', 'done'],

    ['2026/TW-009', 'Phối hợp hoàn thiện dữ liệu Sổ tay đảng viên điện tử tại các đảng bộ trực thuộc', CSD, DA_CSDL_DV, LD_VAN, 'Kế hoạch', '2026-11-30', 'ontime'],
    ['2026/BCT-010', 'Tổ chức làm sạch, chuẩn hóa, đối soát dữ liệu tổ chức đảng, đảng viên', CSD, DA_CSDL_DV, LD_VAN, 'Kế hoạch', '2026-09-10', 'ontime'],
    ['2026/BTCTW-011', 'Rà soát, tái cấu trúc thủ tục hành chính của Đảng theo Quy định 338-QĐ/TW', CSD, DA_CCTTHC, LD_VAN, 'Kế hoạch', '2026-09-30', 'ontime'],
    ['2026/TW-012', 'Báo cáo kết quả cập nhật dữ liệu đảng viên phục vụ đại hội đảng bộ các cấp', CSD, DA_DH, LD_NGOC, 'Báo cáo', '2026-07-15', 'late'],
    ['2026/BTCTW-013', 'Hướng dẫn nghiệp vụ chuyển sinh hoạt đảng trên môi trường điện tử', CSD, DA_CCTTHC, LD_VAN, 'Hướng dẫn', '2026-08-16', 'ontime'],
    ['2026/TX-014', 'Theo dõi tình hình phát triển đảng viên tại các đảng bộ trực thuộc', CSD, DA_TX, LD_VAN, 'Hướng dẫn', '', 'routine'],
    ['2026/BCT-015', 'Sơ kết thực hiện Kết luận về nâng cao chất lượng sinh hoạt chi bộ', CSD, 'Đề án Nâng cao chất lượng tổ chức cơ sở đảng', LD_NGOC, 'Báo cáo', '2026-06-10', 'late'],

    ['2026/BTCTW-016', 'Phối hợp triển khai phân hệ cơ sở dữ liệu cán bộ', CB, DA_CSDL_CB, LD_BINH, 'Kế hoạch', '2026-09-15', 'ontime'],
    ['2026/TW-017', 'Hoàn thiện quy trình tiếp nhận, thẩm định hồ sơ cán bộ diện Trung ương quản lý', CB, DA_CSDL_CB, LD_BINH, 'Quyết định', '2026-07-31', 'late'],
    ['2026/TX-018', 'Cập nhật, duy trì dữ liệu cán bộ diện Trung ương quản lý trên hệ thống', CB, DA_TX, LD_BINH, 'Hướng dẫn', '', 'routine'],
    ['2026/BCT-019', 'Xây dựng khung năng lực vị trí việc làm khối cơ quan tham mưu', CB, DA_VTVL, LD_NGOC, 'Kế hoạch', '2026-08-15', 'ontime'],
    ['2026/BTCTW-020', 'Tổng hợp kết quả đánh giá cán bộ năm 2025', CB, DA_TX, LD_BINH, 'Báo cáo', '2026-04-30', 'done'],
    ['2026/BCT-021', 'Rà soát quy hoạch cán bộ cấp chiến lược nhiệm kỳ tới', CB, 'Đề án Quy hoạch cán bộ cấp chiến lược', LD_NGOC, 'Kế hoạch', '2026-07-05', 'late'],

    ['2026/BTCTW-022', 'Phối hợp triển khai phân hệ cơ sở dữ liệu tổ chức bộ máy, biên chế', TCDL, DA_KT, LD_HAI, 'Kế hoạch', '2026-09-15', 'ontime'],
    ['2026/BBT-023', 'Rà soát, hoàn thiện đề án vị trí việc làm của các đơn vị thuộc Ban', TCDL, DA_VTVL, LD_NGOC, 'Quyết định', '2026-06-20', 'done'],
    ['2026/TW-024', 'Hướng dẫn thực hiện Điều lệ Đảng đối với tổ chức đảng trong doanh nghiệp', TCDL, DA_TX, LD_HAI, 'Hướng dẫn', '2026-08-14', 'ontime'],
    ['2026/TX-025', 'Tổng hợp vướng mắc thi hành Điều lệ Đảng của các tỉnh ủy, thành ủy', TCDL, DA_TX, LD_HAI, 'Báo cáo', '', 'routine'],
    ['2026/BCT-026', 'Xây dựng phương án sắp xếp tổ chức bộ máy khối cơ quan đảng địa phương', TCDL, DA_KT, LD_NGOC, 'Kế hoạch', '2026-07-10', 'late'],

    ['2026/BTCTW-027', 'Phối hợp triển khai phân hệ cơ sở dữ liệu bảo vệ chính trị nội bộ', BVCT, DA_CDS, LD_TAM, 'Kế hoạch', '2026-09-15', 'ontime'],
    ['2026/BTCTW-028', 'Thẩm định tiêu chuẩn chính trị phục vụ công tác nhân sự đại hội', BVCT, DA_DH, LD_NGOC, 'Công văn', '2026-08-15', 'ontime'],
    ['2026/TX-029', 'Rà soát hồ sơ chính trị cán bộ diện Trung ương quản lý', BVCT, DA_TX, LD_TAM, 'Hướng dẫn', '', 'routine'],
    ['2026/BCT-030', 'Báo cáo chuyên đề công tác bảo vệ chính trị nội bộ quý II', BVCT, DA_TX, LD_TAM, 'Báo cáo', '2026-07-08', 'late'],
    ['2026/BTCTW-031', 'Hoàn thiện quy trình phối hợp thẩm tra, xác minh với địa phương', BVCT, DA_CCTTHC, LD_TAM, 'Quyết định', '2026-06-25', 'late'],

    ['2026/TW-032', 'Xây dựng kế hoạch bồi dưỡng cán bộ làm công tác tổ chức năm 2026', DT, 'Đề án Đào tạo, bồi dưỡng cán bộ', LD_BINH, 'Kế hoạch', '2026-08-16', 'ontime'],
    ['2026/BTCTW-033', 'Tổ chức lớp bồi dưỡng nghiệp vụ cho cán bộ tổ chức cấp huyện', DT, 'Đề án Đào tạo, bồi dưỡng cán bộ', LD_BINH, 'Kế hoạch', '2026-10-15', 'ontime'],
    ['2026/BBT-034', 'Báo cáo kết quả đào tạo, bồi dưỡng 6 tháng đầu năm', DT, DA_TX, LD_BINH, 'Báo cáo', '2026-07-12', 'late'],
    ['2026/TX-035', 'Theo dõi, cập nhật dữ liệu học viên trên hệ thống đào tạo', DT, DA_TX, LD_BINH, 'Hướng dẫn', '', 'routine'],

    ['2026/TX-036', 'Tổng hợp tình hình tổ chức bộ máy, biên chế của các tỉnh ủy, thành ủy', DP1, DA_KT, LD_LINH, 'Hướng dẫn', '', 'routine'],
    ['2026/TW-037', 'Theo dõi công tác chuẩn bị đại hội đảng bộ các tỉnh khu vực phía Bắc', DP1, DA_DH, LD_NGOC, 'Kế hoạch', '2026-08-14', 'ontime'],
    ['2026/BTCTW-038', 'Báo cáo tình hình nhân sự cấp ủy các tỉnh khu vực miền Trung', DP2, DA_DH, LD_NGOC, 'Báo cáo', '2026-09-20', 'ontime'],
    ['2026/BCT-039', 'Kiểm tra công tác tổ chức xây dựng Đảng tại 03 tỉnh khu vực miền Trung', DP2, DA_TX, LD_LINH, 'Kế hoạch', '2026-07-25', 'late'],
    ['2026/TX-040', 'Theo dõi công tác cán bộ các tỉnh khu vực phía Nam', DP3, DA_TX, LD_LINH, 'Hướng dẫn', '', 'routine'],
    ['2026/BCT-041', 'Tổng hợp kiến nghị của địa phương về công tác tổ chức cán bộ', DP3, DA_TX, LD_LINH, 'Báo cáo', '2026-08-16', 'ontime'],

    ['2026/BTCTW-042', 'Nghiên cứu mô hình tổ chức bộ máy của một số nước', NCKH, 'Đề án Nghiên cứu khoa học tổ chức', LD_HAI, 'Kế hoạch', '2026-11-15', 'ontime'],
    ['2026/BBT-043', 'Hoàn thiện báo cáo tổng kết đề tài cấp ban về đánh giá cán bộ', NCKH, 'Đề án Nghiên cứu khoa học tổ chức', LD_HAI, 'Báo cáo', '2026-07-18', 'late'],
    ['2026/TW-044', 'Xây dựng chính sách hỗ trợ cán bộ sau sắp xếp tổ chức bộ máy', CSCB, DA_KT, LD_BINH, 'Kế hoạch', '2026-08-15', 'ontime'],
    ['2026/TX-045', 'Tổng hợp vướng mắc thực hiện chính sách tinh giản biên chế', CSCB, DA_TX, LD_BINH, 'Báo cáo', '', 'routine'],
    ['2026/BCT-046', 'Hướng dẫn thực hiện chế độ, chính sách đối với cán bộ nghỉ hưu trước tuổi', CSCB, DA_TX, LD_BINH, 'Hướng dẫn', '2026-09-05', 'ontime'],
    ['2026/BTCTW-047', 'Rà soát chế độ phụ cấp đối với cán bộ chuyên trách công tác đảng', CSCB, 'Đề án Chính sách cán bộ', LD_NGOC, 'Công văn', '2026-06-28', 'late']
  ];
  const KQ = {
    done: ['Hoàn thành đúng tiến độ, đã báo cáo lãnh đạo Ban và lưu hồ sơ.', 'Đã hoàn thành, được lãnh đạo Ban thông qua.'],
    ontime: ['Đang triển khai theo kế hoạch, đã hoàn thành khoảng 60% khối lượng công việc.', 'Đã xây dựng dự thảo, đang lấy ý kiến các đơn vị liên quan.', 'Đã họp thống nhất đề cương, đang tổng hợp số liệu.'],
    late: ['Đã có dự thảo nhưng chưa hoàn thiện, đang tiếp thu ý kiến góp ý.', 'Đã hoàn thành phần lớn nội dung, còn chờ số liệu từ địa phương.'],
    routine: ['Thực hiện thường xuyên theo kế hoạch công tác năm.', 'Duy trì cập nhật hằng tháng, chưa phát sinh vướng mắc.']
  };
  const KK = ['Số liệu từ một số đảng bộ gửi về chậm.', 'Cần thêm thời gian lấy ý kiến các đơn vị phối hợp.', 'Nội dung liên quan đến quy định mới ban hành, phải chờ hướng dẫn.'];
  const KN = ['Đề nghị lãnh đạo Ban cho gia hạn thời gian hoàn thành.', 'Đề nghị các đơn vị phối hợp gửi ý kiến đúng thời hạn mới.'];

  const unitCount = {};
  const TASKS = RAW.map((r, i) => {
    const [ma, t, u, da, ld, lo, srcDue, s] = r;
    const no = Number((ma.match(/-(\d+)$/) || [])[1]);
    const cfg = UNITS[u], uc = (unitCount[u] = (unitCount[u] || 0) + 1) - 1, ui = UNIT_NAMES.indexOf(u);
    const due = srcDue ? iso(addDays(TODAY, Math.round((Date.parse(srcDue + 'T00:00:00Z') - BASE_DAY) / 86400000))) : '';
    const nPeople = 1 + (i % 3);
    const people = Array.from({ length: nPeople }, (_, k) => STAFF[(ui * 3 + uc + k) % STAFF.length]).join(', ');
    const phoiHop = s === 'routine' || i % 3 === 0 ? '' : [UNIT_NAMES[(ui + 3) % UNIT_NAMES.length]].concat(i % 2 ? [VPB] : []).filter((x, k, a) => x !== u && a.indexOf(x) === k).join('; ');
    return {
      ma, t, u, da, ld, lo, due, s,
      cap: capTrinh(ma), kh: KH_BY_NO[no] || '', chuDe: chuDeOf(da, u), vbg: vbgOf(da, t),
      phongBan: cfg.rooms[uc % cfg.rooms.length], lanhDaoDonVi: cfg.lead[uc % cfg.lead.length],
      nguoiThucHien: people, donViPhoiHop: phoiHop,
      ketQua: KQ[s][i % KQ[s].length],
      khoKhan: s === 'late' ? KK[i % KK.length] : '',
      kienNghi: s === 'late' ? KN[i % KN.length] : '',
      tienDo: s === 'done' ? 100 : s === 'routine' ? null : (s === 'late' ? 50 : 25) + (i * 7) % 40,
      hoanThanh: s === 'done' && due ? iso(addDays(new Date(due + 'T00:00:00'), -(2 + i % 8))) : ''
    };
  });
  const ITEMS = {
    chuDe: [...new Set(TASKS.map((r) => r.chuDe))].sort((a, b) => a.localeCompare(b, 'vi')),
    vbg: [...new Set(TASKS.map((r) => r.vbg))].sort((a, b) => a.localeCompare(b, 'vi')),
    ld: LD_ORDER.filter((x) => TASKS.some((r) => r.ld === x))
  };

  /* --------------------------------------------------------------- trạng thái */
  const S = {
    ky: 'year', all: false, from: '', to: '', ld: 'all', chuDe: new Set(), vbg: new Set(),
    capView: 'deAn', l2CapView: 'deAn', tScale: 'month', drill: null, bound: false, lastW: 0
  };
  const msOk = (sel, all, v) => !sel.size || sel.size >= all.length || sel.has(v);
  const inRange = (r) => {
    if (!r.due) return true;                       /* nhiệm vụ thường xuyên luôn hiển thị */
    return (!S.from || r.due >= S.from) && (!S.to || r.due <= S.to);
  };
  const isSoon = (r) => r.s === 'ontime' && r.due && days(r.due) >= 0 && days(r.due) <= 3;
  function matchDrill(r) {
    const d = S.drill;
    if (!d) return true;
    if (d.dim === 'unit') return r.u === d.v;
    if (d.dim === 'cap') return r.cap === d.v;
    if (d.dim === 'kh') return r.kh === d.v;
    if (d.dim === 'status') return r.s === d.v;
    if (d.dim === 'soon') return isSoon(r);
    return true;
  }
  const baseRows = () => TASKS.filter((r) => inRange(r) && (S.ld === 'all' || r.ld === S.ld)
    && msOk(S.chuDe, ITEMS.chuDe, r.chuDe) && msOk(S.vbg, ITEMS.vbg, r.vbg));
  const rows = () => baseRows().filter(matchDrill);

  function tally(list) {
    const t = { total: list.length, done: 0, ontime: 0, late: 0, routine: 0 };
    list.forEach((r) => { t[r.s]++; });
    return t;
  }
  function groupsBy(list, keyFn) {
    const m = new Map();
    list.forEach((r) => { const k = keyFn(r); if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
    return [...m.entries()].map(([n, l]) => Object.assign({ n }, tally(l))).sort((a, b) => b.total - a.total || a.n.localeCompare(b.n, 'vi'));
  }
  /* khối "Theo cấp trình đề án": 2 chế độ xem — theo cấp trình / theo kế hoạch chuyển đổi số */
  function capViewGroups(list, view) {
    const items = view === 'chuyenDoiSo'
      ? groupsBy(list.filter((r) => r.kh), (r) => r.kh)
      : groupsBy(list, (r) => r.cap);
    return { items: items.map((g) => ({ n: g.n, total: g.total })), tong: items.reduce((a, g) => a + g.total, 0) };
  }

  /* ----------------------------------------------------------------- biểu đồ */
  const CAP_C = ['#39d5ff', '#2fb174', '#8b5cf6', '#d8a50c', '#6f93b3'];
  const topRound = (x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h));
    return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
  };
  const rightRound = (x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w, h / 2));
    return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
  };
  function donut(box, data, onClick, total) {
    const el = $(box);
    const tot = total != null ? total : data.reduce((a, b) => a + b.total, 0);
    const safeTot = tot || 1;
    const R = 52, C = 2 * Math.PI * R; let acc = 0;
    const segs = data.map((d, i) => {
      const len = d.total / safeTot * C;
      const s = `<circle ${onClick ? `class="btt-seg-c" data-n="${esc(d.n)}"` : ''} cx="70" cy="70" r="${R}" fill="none" stroke="${CAP_C[i % CAP_C.length]}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${esc(d.n)}: ${F(d.total)}</title></circle>`;
      acc += len; return s;
    }).join('');
    const lg = data.map((d, i) => `<div class="btt-pl-row${onClick ? ' btt-pl-click' : ''}" ${onClick ? `data-n="${esc(d.n)}"` : ''}>
      <i style="background:${CAP_C[i % CAP_C.length]}"></i><span class="btt-pl-n" title="${esc(d.n)}">${esc(d.n)}</span>
      <b>${F(d.total)}</b><span class="btt-pl-p">${(d.total / safeTot * 100).toFixed(1).replace('.', ',')}%</span></div>`).join('');
    el.innerHTML = data.length
      ? `<div class="btt-pie"><div class="btt-pie-lg">${lg}</div><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--btt-line-soft)" stroke-width="22"/>${segs}<text x="70" y="66" text-anchor="middle" class="btt-d-num">${F(tot)}</text><text x="70" y="84" text-anchor="middle" class="btt-d-lab">nhiệm vụ</text></svg></div>`
      : '<div class="btt-empty">Không có dữ liệu.</div>';
    if (onClick) el.querySelectorAll('[data-n]').forEach((n) => n.addEventListener('click', () => onClick(n.dataset.n)));
  }
  function hBars(box, data, maxRows, opt) {
    opt = opt || {};
    const el = $(box);
    if (!data.length) { el.innerHTML = '<div class="btt-empty">Không có dữ liệu.</div>'; return; }
    const rs = maxRows ? data.slice(0, maxRows) : data;
    const W = el.clientWidth || 500;
    const containerH = Math.max(el.clientHeight || 260, 180);
    const minRh = Math.max(34, (opt.bh || 13) + 22);
    const naturalH = minRh * rs.length + 8;
    const overflowing = naturalH > containerH;
    const H = overflowing ? naturalH : containerH;
    const padL = 6, padR = 10, padT = 4, padB = 4;
    const rh = (H - padT - padB) / rs.length;
    const bh = Math.min(opt.bh || 13, rh * .42);
    const max = Math.max(...rs.map((d) => d.total));
    const longest = Math.max(...rs.map((d) => d.n.length));
    const bx = Math.min(opt.label || 230, W * .46, longest * 7.1 + 18);
    const bw0 = W - padR - bx - 42;
    const lim = Math.max(8, Math.floor((bx - padL - 12) / 7.1));
    el.innerHTML = `<svg class="btt-chart" viewBox="0 0 ${W} ${H}" ${overflowing ? `style="height:${H}px"` : ''} preserveAspectRatio="xMidYMid meet">${rs.map((d, i) => {
      const cy = padT + rh * i + rh / 2; let acc = 0;
      const segs = ST.map((st) => {
        const v = d[st.k]; if (!v) return '';
        const w = v / max * bw0, x = bx + acc; acc += w;
        return `<rect x="${x}" y="${cy - bh / 2}" width="${w}" height="${bh}" fill="${st.c}"><title>${esc(d.n)} — ${st.l}: ${F(v)}</title></rect>`;
      }).join('');
      const clip = `bttclip-${box}-${i}`;
      const nm = d.n.length > lim ? d.n.slice(0, lim - 1) + '…' : d.n;
      return `<g${opt.click ? ` class="btt-hb-row" data-n="${esc(d.n)}"` : ''}><text class="btt-bar-lb" x="${padL}" y="${cy + 4}" ${opt.bold ? 'style="font-weight:600"' : ''}>${esc(nm)}<title>${esc(d.n)}</title></text>
        <path d="${rightRound(bx, cy - bh / 2, bw0, bh, bh / 3)}" fill="var(--btt-line-soft)"/>
        <clipPath id="${clip}"><path d="${rightRound(bx, cy - bh / 2, acc || 0.01, bh, bh / 3)}"/></clipPath>
        <g clip-path="url(#${clip})">${segs}</g><text class="btt-bar-tt" x="${bx + bw0 + 10}" y="${cy + 4.5}">${F(d.total)}</text></g>`;
    }).join('')}</svg>`;
    if (opt.click) el.querySelectorAll('.btt-hb-row').forEach((g) => g.addEventListener('click', () => opt.click(g.dataset.n)));
  }
  function weekNo(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { w: Math.ceil(((t - y0) / 86400000 + 1) / 7), y: t.getUTCFullYear() };
  }
  function bucket(due, multiYear) {
    const d = new Date(due + 'T00:00:00'), y = d.getFullYear(), m = d.getMonth(), yy = String(y).slice(2);
    const ts = S.tScale;
    if (ts === 'day') return { k: `${d.getDate()}/${m + 1}/${y}`, l: `${d.getDate()}/${m + 1}`, o: y * 10000 + m * 100 + d.getDate() };
    if (ts === 'year') return { k: `${y}`, l: `${y}`, o: y * 100 };
    if (ts === 'quarter') return { k: `Q${~~(m / 3) + 1}/${y}`, l: `Q${~~(m / 3) + 1}/${yy}`, o: y * 100 + ~~(m / 3) };
    if (ts === 'month') return { k: `T${m + 1}/${y}`, l: multiYear ? `T${m + 1}/${yy}` : `T${m + 1}`, o: y * 100 + m };
    const w = weekNo(d); return { k: `Tuần ${w.w}/${w.y}`, l: multiYear ? `T${w.w}/${String(w.y).slice(2)}` : `T${w.w}`, o: w.y * 100 + w.w };
  }
  function timeChart(box, list) {
    const el = $(box);
    const dated = list.filter((r) => r.due);
    const multiYear = new Set(dated.map((r) => r.due.slice(0, 4))).size > 1;
    const m = new Map();
    dated.forEach((r) => {
      const b = bucket(r.due, multiYear);
      if (!m.has(b.k)) m.set(b.k, { n: b.k, l: b.l, o: b.o, total: 0, done: 0, ontime: 0, late: 0, routine: 0 });
      const g = m.get(b.k); g.total++; g[r.s]++;
    });
    const data = [...m.values()].sort((a, b) => a.o - b.o);
    if (!data.length) { el.innerHTML = '<div class="btt-empty">Không có nhiệm vụ đặt hạn trong khoảng đã chọn.</div>'; return; }
    const W = el.clientWidth || 900, H = Math.max(el.clientHeight || 220, 170);
    const padL = 32, padR = 10, padT = 18, padB = 30, iw = W - padL - padR, ih = H - padT - padB;
    const max = Math.max(...data.map((d) => d.total)), step = Math.ceil(max / 4) || 1, top = step * 4;
    const gap = iw / data.length, bw = Math.min(46, gap * .58);
    const grid = [0, 1, 2, 3, 4].map((i) => {
      const y = padT + ih - (i * step / top) * ih;
      return `<line class="btt-grid-l" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/><text class="btt-axis" x="${padL - 7}" y="${y + 3.5}" text-anchor="end">${i * step}</text>`;
    }).join('');
    const r = Math.min(5, bw / 5);
    const bars = data.map((d, i) => {
      const x = padL + gap * i + (gap - bw) / 2; let acc = 0;
      const segs = ST.map((st) => {
        const v = d[st.k]; if (!v) return '';
        const h = v / top * ih, y = padT + ih - acc - h; acc += h;
        return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${st.c}"><title>${esc(d.n)} — ${st.l}: ${F(v)}</title></rect>`;
      }).join('');
      const clip = `btttclip-${box}-${i}`;
      return `<g><text class="btt-bar-tt" x="${x + bw / 2}" y="${padT + ih - acc - 6}" text-anchor="middle">${F(d.total)}</text>
        <clipPath id="${clip}"><path d="${topRound(x, padT + ih - acc, bw, acc || 0.01, r)}"/></clipPath><g clip-path="url(#${clip})">${segs}</g>
        <text class="btt-axis" x="${x + bw / 2}" y="${padT + ih + 16}" text-anchor="middle">${esc(d.l)}</text></g>`;
    }).join('');
    el.innerHTML = `<svg class="btt-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}<line class="btt-grid-l" x1="${padL}" y1="${padT + ih}" x2="${W - padR}" y2="${padT + ih}"/>${bars}</svg>`;
  }

  /* -------------------------------------------------------------- KPI + lớp 1 */
  function renderKPI() {
    const list = baseRows(), t = tally(list), soon = list.filter(isSoon).length;
    const num = (id, v) => { $(id).textContent = F(v); };
    const pct = (id, v) => { $(id).textContent = t.total ? (v / t.total * 100).toFixed(1).replace('.', ',') + '%' : '–'; };
    num('bttKTotal', t.total);
    ST.forEach((st) => { num('bttK-' + st.k, t[st.k]); pct('bttP-' + st.k, t[st.k]); });
    num('bttKSoon', soon);
    $('bttKpiSoon').classList.toggle('on', soon > 0);
  }
  function capClick() {
    return (n) => drillTo(S.capView === 'chuyenDoiSo' ? 'kh' : 'cap', n, n);
  }
  function renderCapChart() {
    const cv = capViewGroups(baseRows(), S.capView);
    donut('bttCCap', cv.items, capClick(), cv.tong);
  }
  function renderAll() {
    if (!$('bttBody') || $('btctwTaskTally').classList.contains('hidden')) return;
    if (S.drill) { renderL2(); return; }
    const list = baseRows();
    renderKPI();
    hBars('bttCUnit', groupsBy(list, (r) => r.u), 20, { bh: 12, label: 200, bold: true, click: (n) => drillTo('unit', n, n) });
    renderCapChart();
    hBars('bttCLd', groupsBy(list, (r) => r.ld), null, { bh: 16, label: 210 });
    timeChart('bttCTime', list);
  }

  /* --------------------------------------------------------------- lớp 2 */
  const hanCell = (r) => {
    if (!r.due) return '<span class="btt-mut">Không đặt hạn</span>';
    const d = days(r.due);
    const note = r.s === 'done' ? '' : d < 0 ? ` <span class="btt-late-v">(quá ${-d} ngày)</span>` : d <= 3 ? ` <span class="btt-warn-v">(còn ${d} ngày)</span>` : '';
    return dmy(r.due) + note;
  };
  const hanText = (r) => (r.s === 'done' ? 'Đã hoàn thành' : !r.due ? 'Không đặt hạn' : days(r.due) < 0 ? `Quá hạn ${-days(r.due)} ngày` : `Còn ${days(r.due)} ngày`);
  const stCell = (r) => `<span class="btt-st-pill ${S_CLS[r.s]}">${S_LB[r.s]}</span>`;
  const L2_VERB = S_LB;

  function renderL2() {
    const d = S.drill, unit = d.dim === 'unit', list = rows();
    $('bttL2').classList.toggle('cols3', unit);
    $('bttG2c').hidden = !unit;
    $('bttL2CapScale').hidden = true;
    const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
    if (unit) {
      $('bttL2aT').textContent = 'Theo phòng thuộc đơn vị';
      hBars('bttC2a', groupsBy(list, (r) => r.phongBan), 20, { bh: 12, label: 200, bold: true });
      $('bttL2bT').textContent = 'Theo lãnh đạo cục, vụ phụ trách';
      hBars('bttC2b', groupsBy(list, (r) => r.lanhDaoDonVi), null, { bh: 16, label: 210 });
      $('bttL2cT').textContent = 'Theo thời gian';
      timeChart('bttC2c', list);
      $('bttL2listT').textContent = 'Danh sách nhiệm vụ ' + lowerFirst(d.label);
    } else {
      const verb = d.dim === 'status' ? L2_VERB[d.v] : d.dim === 'soon' ? 'Sắp tới hạn' : d.label;
      $('bttL2aT').textContent = verb + ' theo đơn vị chủ trì';
      hBars('bttC2a', groupsBy(list, (r) => r.u), 20, { bh: 12, label: 200, bold: true });
      if (d.dim === 'cap' || d.dim === 'kh') {
        $('bttL2bT').textContent = verb + ' theo lãnh đạo phụ trách';
        hBars('bttC2b', groupsBy(list, (r) => r.ld), null, { bh: 16, label: 210 });
      } else {
        $('bttL2bT').textContent = verb + ' theo cấp trình';
        $('bttL2CapScale').hidden = false;
        const cv = capViewGroups(list, S.l2CapView);
        donut('bttC2b', cv.items, undefined, cv.tong);
      }
      $('bttL2listT').textContent = 'Danh sách nhiệm vụ ' + lowerFirst(verb);
    }
    /* drill xuất phát từ thẻ trạng thái / sắp tới hạn đã chọn sẵn 1 tiêu chí → ẩn lọc trạng thái cho đỡ dư */
    $('bttL2fS').hidden = d.dim === 'status' || d.dim === 'soon';
    renderL2List();
  }
  function fillSel(id, values, allLabel) {
    const el = $(id), cur = el.value || 'all';
    el.innerHTML = `<option value="all">${allLabel}</option>` + values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    el.value = values.includes(cur) ? cur : 'all';
  }
  function renderL2List() {
    const base = rows();
    fillSel('bttL2fU', [...new Set(base.map((r) => r.u))].sort((a, b) => a.localeCompare(b, 'vi')), 'Tất cả đơn vị');
    fillSel('bttL2fC', [...new Set(base.map((r) => r.cap))].sort((a, b) => a.localeCompare(b, 'vi')), 'Tất cả cấp trình');
    const stSel = $('bttL2fS');
    if (!stSel.hidden) {
      const cur = stSel.value || 'all', sts = [...new Set(base.map((r) => r.s))];
      stSel.innerHTML = '<option value="all">Tất cả trạng thái</option>' + ST.map((x) => x.k).filter((k) => sts.includes(k)).map((k) => `<option value="${k}">${S_LB[k]}</option>`).join('');
      stSel.value = [...stSel.options].some((o) => o.value === cur) ? cur : 'all';
    }
    const q = deVN($('bttL2q').value.trim());
    const fU = $('bttL2fU').value || 'all', fC = $('bttL2fC').value || 'all', fS = $('bttL2fS').value || 'all';
    const list = base.filter((r) => (fU === 'all' || r.u === fU) && (fC === 'all' || r.cap === fC) && (fS === 'all' || r.s === fS)
      && (!q || deVN(`${r.ma} ${r.t} ${r.u} ${r.vbg} ${r.ld} ${r.nguoiThucHien}`).includes(q)));
    $('bttL2Count').textContent = list.length === base.length ? `${F(base.length)} nhiệm vụ` : `${F(list.length)} / ${F(base.length)} nhiệm vụ`;
    $('bttC2List').innerHTML = !list.length ? '<div class="btt-empty">Không có nhiệm vụ nào khớp.</div>' : `<table>
      <tr><th style="width:34px">STT</th><th class="l">Mã nhiệm vụ</th><th class="l">Tên nhiệm vụ</th><th class="l">Văn bản giao</th><th class="l">Cấp trình</th>
      <th class="l">Đơn vị chủ trì</th><th class="l">LĐ phụ trách</th><th class="l">Người thực hiện</th><th class="l">Hạn hoàn thành</th><th>Trạng thái</th></tr>
      ${list.map((r, i) => `<tr data-ma="${esc(r.ma)}"><td style="text-align:center;color:var(--btt-muted)">${i + 1}</td>
        <td class="l nw n5">${esc(r.ma)}</td><td class="l n4">${esc(r.t)}</td><td class="l nw">${esc(r.vbg)}</td><td class="l nw">${esc(r.cap)}</td>
        <td class="l n4">${esc(r.u)}</td><td class="l nw n4">${esc(r.ld)}</td><td class="l n4">${esc(r.nguoiThucHien)}</td>
        <td class="l nw n4">${hanCell(r)}</td><td style="text-align:center">${stCell(r)}</td></tr>`).join('')}</table>`;
  }
  function drillTo(dim, v, label) {
    if (S.drill) return;
    S.drill = { dim, v, label };
    $('bttL2q').value = '';
    ['bttL2fU', 'bttL2fC', 'bttL2fS'].forEach((id) => { $(id).value = 'all'; });
    S.l2CapView = 'deAn';
    document.querySelectorAll('#bttL2CapScale button').forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.v === 'deAn')));
    syncDrillUI(); renderAll();
  }
  function drillBack() { S.drill = null; syncDrillUI(); renderAll(); }
  function syncDrillUI() {
    const d = S.drill, on = !!d;
    $('bttH2').hidden = !on;
    if (on) {
      $('bttH2Name').textContent = d.dim === 'unit' ? d.label
        : d.dim === 'status' ? `Nhiệm vụ ${L2_VERB[d.v].toLowerCase()}`
          : d.dim === 'soon' ? 'Nhiệm vụ sắp tới hạn (≤ 3 ngày)'
            : `Nhiệm vụ ${d.label.charAt(0).toLowerCase()}${d.label.slice(1)}`;
    }
    $('bttKpis').hidden = on; $('bttL1').hidden = on; $('bttL2').hidden = !on;
    $('btctwTaskTally').classList.toggle('btt-drilled', on);
  }

  /* ------------------------------------------- hộp thoại riêng (như .ov/.dlg của bản gốc) */
  function ensureDlg() {
    if ($('bttOv')) return;
    const ov = document.createElement('div');
    ov.className = 'btt-ov'; ov.id = 'bttOv'; ov.hidden = true;
    ov.innerHTML = `<div class="btt-dlg" id="bttDlg" role="dialog" aria-modal="true" aria-labelledby="bttDlgT">
      <div class="btt-dlg-h"><div><div id="bttDlgT"></div><div class="btt-dlg-sub" id="bttDlgS"></div></div><button class="btt-dlg-x" id="bttDlgX" aria-label="Đóng">✕</button></div>
      <div class="btt-dlg-b" id="bttDlgB"></div><div class="btt-dlg-f" id="bttDlgF"></div></div>`;
    document.body.appendChild(ov);
    $('bttDlgX').onclick = closeDlg;
    ov.addEventListener('click', (e) => { if (e.target === ov) closeDlg(); });
  }
  function openDlg(o) {
    ensureDlg();
    $('bttDlg').style.width = `min(${o.width}px,100%)`;
    $('bttDlgT').textContent = o.title;
    $('bttDlgS').textContent = o.sub || '';
    $('bttDlgS').hidden = !o.sub;
    $('bttDlgB').className = 'btt-dlg-b' + (o.scroll ? ' scroll' : '');
    $('bttDlgB').innerHTML = o.body;
    $('bttDlgF').innerHTML = o.foot;
    $('bttOv').hidden = false;
  }
  function closeDlg() { if ($('bttOv')) $('bttOv').hidden = true; }

  /* ------------------------------------------------- chi tiết nhiệm vụ (popup) */
  const cell = (label, value) => `<div class="btt-td-cell"><div class="btt-td-lb">${label}</div><div>${value ? esc(value) : '—'}</div></div>`;
  const box = (color, label, value) => `<div class="btt-td-box" style="border-left-color:${color}"><div class="btt-td-lb" style="color:${color}">${label}</div><div>${value ? esc(value) : '—'}</div></div>`;
  function openDetail(r) {
    const people = r.nguoiThucHien.split(',').map((s) => s.trim()).filter(Boolean);
    openDlg({
      title: 'Chi tiết nhiệm vụ', sub: 'Thông tin và tình hình thực hiện', width: 720, scroll: true,
      body: `<div class="btt-td-top"><span class="btt-td-ma">${esc(r.ma)}</span>${stCell(r)}</div>
        <div class="btt-td-name">${esc(r.t)}</div>
        <div class="btt-td-grid">
          ${cell('Văn bản giao', r.vbg)}${cell('Thời hạn hoàn thành', r.due ? dmy(r.due) : 'Không đặt hạn')}${cell('Chủ đề', r.chuDe || 'Chưa phân loại')}
          ${cell('Đơn vị chủ trì', [r.u, r.phongBan].filter(Boolean).join(' — '))}${cell('Lãnh đạo Ban phụ trách', [r.ld, r.lanhDaoDonVi].filter(Boolean).join(' · '))}
          ${cell('Ngày còn hạn / quá hạn', hanText(r))}
        </div>
        ${cell('Đơn vị phối hợp', r.donViPhoiHop || 'Không có')}
        <div><div class="btt-td-lb" style="margin-bottom:6px">Người thực hiện</div>${people.length ? people.map((p) => `<span class="btt-chip">${esc(p)}</span>`).join('') : '<span class="btt-mut">Không có</span>'}</div>
        ${box('var(--btt-done)', 'Kết quả thực hiện', r.ketQua)}${box('var(--btt-late)', 'Khó khăn, vướng mắc', r.khoKhan)}${box('var(--btt-warn)', 'Đề xuất, kiến nghị', r.kienNghi)}`,
      foot: '<button class="btt-btn-cancel" id="bttTdCancel">Đóng</button><button class="btt-btn-send" id="bttTdUpd">Cập nhật nhiệm vụ</button><button class="btt-btn-send" id="bttTdRep">Yêu cầu báo cáo</button>'
    });
    const note = (what) => () => toast(what + ' được thực hiện trên hệ thống Theo dõi nhiệm vụ — bản demo không kết nối hệ thống này.');
    $('bttTdCancel').onclick = closeDlg;
    $('bttTdUpd').onclick = note('Cập nhật nhiệm vụ');
    $('bttTdRep').onclick = note('Yêu cầu báo cáo');
  }

  /* -------------------------------------------------------------- xuất Excel */
  /* đúng 13 trường, đúng thứ tự của form gốc */
  const XF = [
    { k: 'stt', l: 'STT', g: (r, i) => i + 1 },
    { k: 'ma', l: 'Mã nhiệm vụ', g: (r) => r.ma },
    { k: 't', l: 'Tên nhiệm vụ', g: (r) => r.t },
    { k: 'cap', l: 'Cấp trình', g: (r) => r.cap },
    { k: 'da', l: 'Đề án', g: (r) => r.da },
    { k: 'u', l: 'Đơn vị chủ trì', g: (r) => r.u },
    { k: 'ld', l: 'LĐ Ban phụ trách', g: (r) => r.ld },
    { k: 'lo', l: 'Loại văn bản', g: (r) => r.lo },
    { k: 'due', l: 'Thời hạn hoàn thành', g: (r) => (r.due ? dmy(r.due) : 'Không đặt hạn') },
    { k: 'st', l: 'Trạng thái', g: (r) => S_LB[r.s] },
    { k: 'qh', l: 'Số ngày quá hạn', g: (r) => (r.s === 'late' && r.due ? -days(r.due) : '') },
    { k: 'dht', l: 'Ngày hoàn thành', g: (r) => (r.hoanThanh ? dmy(r.hoanThanh) : '') },
    { k: 'td', l: 'Tiến độ', g: (r) => (r.tienDo == null ? '—' : r.tienDo + '%') }
  ];
  const xSel = new Set(XF.map((f) => f.k));
  const SUMMARY = [
    { name: 'Theo đơn vị chủ trì', head: 'Đơn vị chủ trì', fn: (r) => r.u },
    { name: 'Theo cấp trình', head: 'Cấp trình', fn: (r) => r.cap },
    { name: 'Theo lãnh đạo phụ trách', head: 'Lãnh đạo Ban phụ trách', fn: (r) => r.ld },
    { name: 'Theo đề án', head: 'Đề án', fn: (r) => r.da }
  ];
  function openExportModal() {
    const list = rows();
    openDlg({
      title: 'Xuất Excel danh sách nhiệm vụ', width: 760,
      body: `<div class="btt-x-scope"><span>Phạm vi xuất theo bộ lọc hiện tại${S.drill ? ` — <b>${esc(S.drill.label)}</b>` : ''}: <b>${F(list.length)}</b> nhiệm vụ</span></div>
        <div class="btt-x-tools"><span class="btt-f-lb">Chọn trường dữ liệu <em>*</em></span><button class="btt-link" id="bttXAll">Chọn tất cả</button><span style="color:var(--btt-line)">|</span><button class="btt-link" id="bttXNone">Bỏ chọn tất cả</button><span class="btt-x-err" id="bttXErr" hidden>Chọn ít nhất một trường.</span></div>
        <div class="btt-x-grid" id="bttXFields">${XF.map((f) => `<label class="btt-x-item${xSel.has(f.k) ? ' on' : ''}"><input type="checkbox" data-k="${f.k}" ${xSel.has(f.k) ? 'checked' : ''}>${f.l}</label>`).join('')}</div>
        <label class="btt-x-sum"><input type="checkbox" id="bttXSum" checked>Kèm các bảng tổng hợp (theo đơn vị chủ trì, cấp trình, lãnh đạo phụ trách, đề án)</label>`,
      foot: '<button class="btt-btn-cancel" id="bttXCancel">Hủy</button><button class="btt-btn-send" id="bttXGo">⤓ Xuất Excel</button>'
    });
    const checks = () => $('bttXFields').querySelectorAll('input');
    const sync = () => { $('bttXErr').hidden = xSel.size > 0; };
    checks().forEach((c) => c.addEventListener('change', () => {
      c.checked ? xSel.add(c.dataset.k) : xSel.delete(c.dataset.k);
      c.closest('.btt-x-item').classList.toggle('on', c.checked); sync();
    }));
    const setAll = (v) => { XF.forEach((f) => (v ? xSel.add(f.k) : xSel.delete(f.k))); checks().forEach((c) => { c.checked = v; c.closest('.btt-x-item').classList.toggle('on', v); }); sync(); };
    $('bttXAll').onclick = () => setAll(true);
    $('bttXNone').onclick = () => setAll(false);
    $('bttXCancel').onclick = closeDlg;
    $('bttXGo').onclick = async () => {
      if (!xSel.size) { $('bttXErr').hidden = false; return; }
      try { await exportXlsx(XF.filter((f) => xSel.has(f.k)), $('bttXSum').checked); closeDlg(); }
      catch (e) { $('bttXErr').textContent = 'Lỗi khi xuất: ' + e.message; $('bttXErr').hidden = false; }
    };
  }
  async function exportXlsx(fields, withSummary) {
    if (typeof ExcelJS === 'undefined') throw new Error('chưa tải được thư viện Excel — kiểm tra kết nối mạng.');
    const list = rows(), t = tally(list);
    const wb = new ExcelJS.Workbook();
    const head = (ws, title) => {
      ws.addRow([title]).font = { bold: true, size: 13 };
      ws.addRow(['SỐ LIỆU MÔ PHỎNG (BẢN DEMO) — KHÔNG PHẢI SỐ LIỆU THẬT']).font = { italic: true, color: { argb: 'FFC00000' } };
      ws.addRow([]);
    };
    const ws = wb.addWorksheet('Danh sách nhiệm vụ');
    head(ws, 'Danh sách nhiệm vụ' + (S.drill ? ' — ' + S.drill.label : '') + ' · Ban Tổ chức Trung ương');
    ws.addRow(fields.map((f) => f.l)).font = { bold: true };
    list.forEach((r, i) => ws.addRow(fields.map((f) => f.g(r, i))));
    ws.columns = fields.map((f) => ({ width: f.k === 't' ? 70 : f.k === 'stt' ? 6 : 24 }));
    if (withSummary) {
      SUMMARY.forEach((sm) => {
        const s2 = wb.addWorksheet(sm.name);
        head(s2, 'Kiểm đếm nhiệm vụ ' + sm.name.toLowerCase());
        s2.addRow([sm.head, 'Tổng', 'Đã hoàn thành', 'Đang thực hiện - trong hạn', 'Đang thực hiện - quá hạn', 'Nhiệm vụ thường xuyên']).font = { bold: true };
        groupsBy(list, sm.fn).forEach((g) => s2.addRow([g.n, g.total, g.done, g.ontime, g.late, g.routine]));
        s2.addRow(['Tổng cộng', t.total, t.done, t.ontime, t.late, t.routine]).font = { bold: true };
        s2.columns = [{ width: 52 }, { width: 10 }, { width: 18 }, { width: 28 }, { width: 26 }, { width: 24 }];
      });
    }
    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = 'kiem-dem-nhiem-vu-BTCTW_' + iso(new Date()) + '-DU-LIEU-MO-PHONG.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ----------------------------------------------------------- bộ lọc / kỳ */
  const FINER = { week: 'day', month: 'week', quarter: 'month', year: 'month' };
  function setKy(p) {
    if (p === 'all') {
      S.all = true; S.from = ''; S.to = ''; S.tScale = 'month';
      $('bttFrom').value = ''; $('bttTo').value = '';
    } else {
      S.all = false;
      const d = new Date(TODAY), y = d.getFullYear();
      let from, to;
      if (p === 'week') { const wd = (d.getDay() + 6) % 7; from = new Date(y, d.getMonth(), d.getDate() - wd); to = new Date(y, d.getMonth(), d.getDate() - wd + 6); }
      else if (p === 'month') { from = new Date(y, d.getMonth(), 1); to = new Date(y, d.getMonth() + 1, 0); }
      else if (p === 'quarter') { const q = ~~(d.getMonth() / 3); from = new Date(y, q * 3, 1); to = new Date(y, q * 3 + 3, 0); }
      else { from = new Date(y, 0, 1); to = new Date(y, 11, 31); }
      S.from = iso(from); S.to = iso(to); S.tScale = FINER[p];
      $('bttFrom').value = S.from; $('bttTo').value = S.to;
    }
    S.ky = p;
    document.querySelectorAll('#bttScale button').forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.p === p)));
    renderAll();
  }
  /* chọn tay khoảng ngày: tự chọn độ mịn trục thời gian, bỏ đánh dấu nút kỳ */
  function autoScale() {
    S.all = false; S.from = $('bttFrom').value; S.to = $('bttTo').value;
    const sp = (new Date(S.to) - new Date(S.from)) / 86400000;
    S.tScale = sp <= 31 ? 'day' : sp <= 120 ? 'week' : sp <= 400 ? 'month' : 'year';
    document.querySelectorAll('#bttScale button').forEach((o) => o.setAttribute('aria-pressed', 'false'));
    renderAll();
  }
  function closeMsels() {
    document.querySelectorAll('#btctwTaskTally .btt-msel-panel').forEach((p) => { p.hidden = true; });
    document.querySelectorAll('#btctwTaskTally .btt-msel-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }
  function initMsel(key, label, idBase, items) {
    const sel = S[key], btn = $(idBase + 'Btn'), panel = $(idBase + 'Panel'), list = $(idBase + 'List');
    const upd = () => {
      /* nhãn nút như bản gốc: chưa chọn = Tất cả, 1 mục = tên mục, nhiều mục (kể cả "Chọn tất cả") = "n đã chọn" */
      btn.textContent = sel.size === 0 ? `${label}: Tất cả`
        : sel.size === 1 ? `${label}: ${[...sel][0]}` : `${label}: ${sel.size} đã chọn`;
    };
    list.innerHTML = items.map((v) => `<label><input type="checkbox" value="${esc(v)}">${esc(v)}</label>`).join('');
    list.addEventListener('change', (e) => { const cb = e.target; cb.checked ? sel.add(cb.value) : sel.delete(cb.value); upd(); renderAll(); });
    panel.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => {
      if (b.dataset.act === 'all') items.forEach((v) => sel.add(v)); else sel.clear();
      list.querySelectorAll('input').forEach((c) => { c.checked = sel.has(c.value); });
      upd(); renderAll();
    }; });
    btn.onclick = () => { const willOpen = panel.hidden; closeMsels(); panel.hidden = !willOpen; btn.setAttribute('aria-expanded', String(willOpen)); };
    upd();
  }

  /* --------------------------------------------------------------- khởi tạo */
  function buildMarkup() {
    const msel = (id, label) => `<div class="btt-msel"><button type="button" class="btt-ctrl btt-msel-btn" id="${id}Btn" aria-haspopup="listbox" aria-expanded="false">${label}: Tất cả</button>
      <div class="btt-msel-panel" id="${id}Panel" hidden><div class="btt-msel-tools"><button type="button" class="btt-link" data-act="all">Chọn tất cả</button><button type="button" class="btt-link" data-act="none">Bỏ chọn</button></div><div class="btt-msel-list" id="${id}List"></div></div></div>`;
    const kpi = (cls, id, label, drill, extra) => `<article class="btt-kpi ${cls}" ${drill ? `data-drill="${drill}"` : ''} ${extra || ''}><div class="btt-k-top">${label}</div><div class="btt-k-row"><span class="btt-k-val" id="${id}">–</span></div></article>`;
    const kpiSt = (st, drill, label) => `<article class="btt-kpi" data-drill="${drill}" style="--c:var(--btt-${st});--bgc:var(--btt-${st}-bg);--bdc:var(--btt-${st}-bd)"><div class="btt-k-top">${label}</div><div class="btt-k-row"><span class="btt-k-val" id="bttK-${st}">–</span><span class="btt-k-pct" id="bttP-${st}">–</span></div></article>`;
    const card = (cls, titleHtml, bodyId, tools) => `<div class="btt-card ${cls}"><div class="btt-card-head">${titleHtml}${tools || ''}</div><div class="btt-card-body btt-chart-box" id="${bodyId}"></div></div>`;
    const seg = (id, aria, a, b) => `<div class="btt-seg small" id="${id}" role="group" aria-label="${aria}" style="margin-left:auto"><button data-v="deAn" aria-pressed="true">${a}</button><button data-v="chuyenDoiSo" aria-pressed="false">${b}</button></div>`;
    $('bttBody').innerHTML = `
      <div class="btt-bar">
        <div class="btt-h2" id="bttH2" hidden><button class="btt-back" id="bttBack" title="Quay lại tổng quan" aria-label="Quay lại tổng quan"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg></button><span class="btt-h2-name" id="bttH2Name"></span></div>
        <div class="btt-right">
          <div class="btt-seg small" id="bttScale" role="group" aria-label="Kỳ báo cáo"><button data-p="week" aria-pressed="false">Tuần</button><button data-p="month" aria-pressed="false">Tháng</button><button data-p="quarter" aria-pressed="false">Quý</button><button data-p="year" aria-pressed="true">Năm</button><button data-p="all" aria-pressed="false">Tất cả</button></div>
          <div class="btt-fgrp"><span class="btt-lbl">Từ</span><input class="btt-ctrl" type="date" id="bttFrom"><span class="btt-lbl">đến</span><input class="btt-ctrl" type="date" id="bttTo"></div>
          <div class="btt-fgrp"><span class="btt-lbl">LĐ phụ trách</span><select class="btt-ctrl" id="bttLd" aria-label="Lọc theo lãnh đạo phụ trách"></select></div>
          ${msel('bttChuDe', 'Chủ đề')}${msel('bttVbg', 'Văn bản giao')}
          <button class="btt-btn btt-primary" id="bttXlsx">⤓ Xuất Excel</button><button class="btt-btn" id="bttSync">⟳ Đồng bộ</button>
        </div>
      </div>
      <section class="btt-kpis" id="bttKpis">
        ${kpi('total', 'bttKTotal', 'Tổng nhiệm vụ theo dõi', 'reset', 'title="Quay lại tổng quan"')}
        ${kpiSt('done', 'status:done', 'Đã hoàn thành')}${kpiSt('ontime', 'status:ontime', 'Đang thực hiện – Trong hạn')}
        ${kpiSt('late', 'status:late', 'Đang thực hiện – Quá hạn')}${kpiSt('routine', 'status:routine', 'Nhiệm vụ thường xuyên')}
        <article class="btt-kpi alert" id="bttKpiSoon" data-drill="soon:1" style="--c:var(--btt-warn)"><div class="btt-k-top">Sắp tới hạn <svg class="btt-ico-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.4l3.4 2"/></svg></div><div class="btt-k-row"><span class="btt-k-val" id="bttKSoon">–</span><span class="btt-k-pct">cần nhắc việc</span></div></article>
      </section>
      <div class="btt-grid" id="bttL1">
        ${card('', '<div class="btt-card-title">Theo cấp trình đề án</div>', 'bttCCap', seg('bttCapScale', 'Xem theo', 'Theo đề án', 'Nhiệm vụ chuyển đổi số'))}
        ${card('', '<div class="btt-card-title">Theo đơn vị chủ trì</div>', 'bttCUnit', '<div class="btt-legend">' + ST.map((s) => `<span class="btt-lg"><i style="background:${s.c}"></i>${S_LB[s.k]}</span>`).join('') + '</div>')}
        ${card('', '<div class="btt-card-title">Theo lãnh đạo Ban phụ trách</div>', 'bttCLd')}
        ${card('', '<div class="btt-card-title">Theo thời gian</div>', 'bttCTime')}
      </div>
      <div class="btt-grid2" id="bttL2" hidden>
        ${card('g2a', '<div class="btt-card-title" id="bttL2aT"></div>', 'bttC2a')}
        ${card('g2b', '<div class="btt-card-title" id="bttL2bT"></div>', 'bttC2b', seg('bttL2CapScale', 'Xem theo', 'Theo đề án', 'Nhiệm vụ chuyển đổi số').replace('style="margin-left:auto"', 'style="margin-left:auto" hidden'))}
        <div class="btt-card g2c" id="bttG2c" hidden><div class="btt-card-head"><div class="btt-card-title" id="bttL2cT"></div></div><div class="btt-card-body btt-chart-box" id="bttC2c"></div></div>
        <div class="btt-card g2list">
          <div class="btt-card-head"><div class="btt-card-title" id="bttL2listT"></div>
            <div class="btt-l2-tools"><input class="btt-ctrl" id="bttL2q" type="search" placeholder="Tìm mã, tên nhiệm vụ, văn bản giao, người thực hiện..."><select class="btt-ctrl" id="bttL2fU" aria-label="Lọc theo đơn vị"></select><select class="btt-ctrl" id="bttL2fC" aria-label="Lọc theo cấp trình"></select><select class="btt-ctrl" id="bttL2fS" aria-label="Lọc theo trạng thái"></select></div>
            <span class="btt-l2-count" id="bttL2Count"></span></div>
          <div class="btt-card-body btt-list" id="bttC2List"></div>
        </div>
      </div>`;
  }
  function bind() {
    buildMarkup();
    $('bttLd').innerHTML = '<option value="all">Tất cả lãnh đạo</option>' + ITEMS.ld.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    $('bttLd').onchange = (e) => { S.ld = e.target.value; renderAll(); };
    $('bttFrom').onchange = autoScale; $('bttTo').onchange = autoScale;
    document.querySelectorAll('#bttScale button').forEach((b) => { b.onclick = () => setKy(b.dataset.p); });
    document.querySelectorAll('#bttCapScale button').forEach((b) => { b.onclick = () => {
      document.querySelectorAll('#bttCapScale button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      S.capView = b.dataset.v; if (!S.drill) renderCapChart();
    }; });
    document.querySelectorAll('#bttL2CapScale button').forEach((b) => { b.onclick = () => {
      document.querySelectorAll('#bttL2CapScale button').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      S.l2CapView = b.dataset.v; renderL2();
    }; });
    initMsel('chuDe', 'Chủ đề', 'bttChuDe', ITEMS.chuDe);
    initMsel('vbg', 'Văn bản giao', 'bttVbg', ITEMS.vbg);
    document.addEventListener('click', (e) => { if (!e.target.closest('#btctwTaskTally .btt-msel')) closeMsels(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMsels(); closeDlg(); } });
    $('bttXlsx').onclick = openExportModal;
    $('bttSync').onclick = () => {
      const b = $('bttSync'), old = b.textContent;
      b.disabled = true; b.textContent = '⟳ Đang đồng bộ…';
      setTimeout(() => { b.disabled = false; b.textContent = old; toast('Đã cập nhật dữ liệu mới nhất (số liệu mô phỏng – bản demo).'); renderAll(); }, 700);
    };
    $('bttBack').onclick = drillBack;
    document.querySelectorAll('#bttKpis .btt-kpi[data-drill]').forEach((k) => k.addEventListener('click', () => {
      const [dim, v] = k.dataset.drill.split(':');
      if (dim === 'reset') return drillBack();
      if (S.drill) return;
      if (dim === 'status') return drillTo('status', v, STATUS_LB[v]);
      if (dim === 'soon') return drillTo('soon', 1, 'Sắp tới hạn (≤ 3 ngày)');
    }));
    $('bttL2q').addEventListener('input', renderL2List);
    ['bttL2fU', 'bttL2fC', 'bttL2fS'].forEach((id) => $(id).addEventListener('change', renderL2List));
    $('bttC2List').addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-ma]'); if (!tr) return;
      const item = TASKS.find((x) => x.ma === tr.dataset.ma); if (item) openDetail(item);
    });
    /* biểu đồ SVG đo theo bề ngang khung: vẽ lại khi khung đổi kích thước (mở/thu gọn khối, đổi cỡ cửa sổ) */
    const body = $('bttBody');
    if (window.ResizeObserver) {
      let t; new ResizeObserver(() => {
        const w = body.clientWidth; if (!w || w === S.lastW) return;
        S.lastW = w; clearTimeout(t); t = setTimeout(renderAll, 120);
      }).observe(body);
    }
    setKy('year');
  }

  /* tài khoản 'tw' (role TW_ALL, tổng hợp cả 5 khối Trung ương) + 'twdang' / 'ban-tw-dang-btc' (role TW_DANG) */
  const wanted = () => BTCTW_TASK_TALLY && typeof currentRole !== 'undefined'
    && (currentRole === 'TW_ALL' || (currentRole === 'TW_DANG' && OFFICE_IDS.indexOf(currentOfficeId || null) >= 0));

  /* Gọi từ renderAll() (render-all.js): bật/tắt khối theo tài khoản; số liệu và trạng thái lọc giữ nguyên giữa các lần gọi */
  window.renderBtctwTaskTally = function () {
    const w = $('btctwTaskTally'); if (!w) return;
    const show = wanted();
    w.classList.toggle('hidden', !show);
    /* Giống bộ btctw gốc: với tài khoản BTC, khối "Tổng quan điều hành" (3 hình tròn văn bản/nhiệm vụ) nhường chỗ cho
       Kiểm đếm nhiệm vụ. Chỉ ẩn bằng class riêng (không đụng .hidden của cơ chế ẩn/hiện khác), code render giữ nguyên. */
    const overview = $('roleScopeCards');
    if (overview) overview.classList.toggle('btt-role-hidden', show);
    if (!show) return;
    if (!S.bound) { S.bound = true; bind(); } else { renderAll(); }
  };
})();
