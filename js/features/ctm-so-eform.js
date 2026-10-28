/* ============================== 12 SỞ, NGÀNH THEO EFORM — ĐỢT 1: THANH TRA, CÔNG THƯƠNG, NỘI VỤ, NN&MT ==============================
   Dựng theo bản đọc eform đã duyệt 28/10/2026 (docs/BAN_DOC_EFORM/SO_THANH_TRA, SO_CONG_THUONG, SO_NOI_VU, SO_NNMT; anh trả lời
   "theo đề xuất") và quy ước 28/10/2026 (AGENTS.md): mỗi sở là một đơn vị, mỗi eform một thẻ; chỉ dùng trường của eform; số IOC tính
   ghi "IOC tính". Khai báo đè mã đơn vị cũ (ubnd-thanhtra, ubnd-congthuong, ubnd-noivu, ubnd-nnmt) của js/features/ctm-so.js — khai báo
   cũ giữ nguyên; đặt SO_EFORM_DOT1 = false (js/core/central-level.js) là về như cũ, kể cả các chỉ tiêu nguồn File của Nội vụ, NN&MT.
   Nạp SAU ctm-eform.js, ctm-truc-eform.js (dùng efL, efSai, efTyleSai, efSauHan, efCong) và ctm-so.js. */
const SO_EF_BAT = typeof SO_EFORM_DOT1 === 'undefined' ? true : SO_EFORM_DOT1;
/* Mã danh mục theo tên hiển thị (không gõ tay mã) */
const efMa = (ef, c, l) => { const o = (EFK[ef].F[c].dm || []).find((x) => x.l === l); return o ? o.v : l; };
const efDong = (a, b) => efNum(a) != null && efNum(b) != null && a > b;

/* ============================== THANH TRA THÀNH PHỐ ============================== */
const EF_TTRA1 = {
  ef: 'ttra1', ten: 'Kiểm tra Chủ tịch UBND xã, phường', banGhi: 'một cuộc kiểm tra (theo «Căn cứ/Quyết định kiểm tra số») đối với một xã, phường, ghi kèm kết luận và kiến nghị của cuộc',
  khoa: ['can_cu_quyet_dinh_kiem_tra_so', 'dia_ban'], cap: ['trang_thai_kiem_tra', 'ten_cuoc_kiem_tra_noi_dung'], xaTruong: 'dia_ban', xaChi: ['cuoc', 'kn', 'tl'],
  bo: { loai_ban_ghi: [efMa('ttra1', 'loai_ban_ghi', 'Không phát sinh')] },
  chi: {
    cuoc: { l: 'Số cuộc kiểm tra', loai: 'demkhac', c: 'can_cu_quyet_dinh_kiem_tra_so' },
    xa: { l: 'Số xã, phường được kiểm tra', loai: 'demkhac', c: 'dia_ban' },
    dv: { l: efL('ttra1', 'so_don_vi_duoc_kiem_tra'), loai: 'td', c: 'so_don_vi_duoc_kiem_tra' },
    kl: { l: 'Đã ban hành kết luận', loai: 'dembang', c: 'da_ban_hanh_ket_luan', v: [efMa('ttra1', 'da_ban_hanh_ket_luan', 'Có')] },
    kn: { l: efL('ttra1', 'so_kien_nghi_xu_ly'), loai: 'td', c: 'so_kien_nghi_xu_ly' },
    gt: { l: efL('ttra1', 'gia_tri_kien_nghi_thu_hoi_giam_tru_trieu_dong'), loai: 'td', c: 'gia_tri_kien_nghi_thu_hoi_giam_tru_trieu_dong' },
    da: { l: efL('ttra1', 'da_thuc_hien_kien_nghi'), loai: 'td', c: 'da_thuc_hien_kien_nghi' },
    dang: { l: efL('ttra1', 'dang_thuc_hien_kien_nghi'), loai: 'td', c: 'dang_thuc_hien_kien_nghi' },
    qh: { l: efL('ttra1', 'qua_han_thuc_hien_kien_nghi'), loai: 'td', c: 'qua_han_thuc_hien_kien_nghi' },
    tl: { l: 'Tỷ lệ thực hiện kiến nghị (IOC tính)', loai: 'tyle', tu: 'da', mau: 'kn' },
    tlN: { l: efL('ttra1', 'ty_le_thuc_hien_kien_nghi') + ' đã nhập', loai: 'nhap', c: 'ty_le_thuc_hien_kien_nghi', u: '%', theo: ['can_cu_quyet_dinh_kiem_tra_so', 'dia_ban'] }
  },
  cot: ['cuoc', 'dv', 'kl', 'kn', 'da', 'dang', 'qh', 'tl', 'tlN'], the: ['cuoc', 'kn', 'da', 'tl'],
  bieu: [{ loai: 'chong', t: 'Bản ghi theo trạng thái kiểm tra', theo: 'trang_thai_kiem_tra', m: 'cuoc' }, { loai: 'ds', t: 'Tình trạng thực hiện kiến nghị', ms: ['kn', 'da', 'dang', 'qh'] },
    { loai: 'cot', t: 'Cuộc kiểm tra theo tình trạng quá hạn', theo: 'tinh_trang_qua_han', m: 'cuoc' }, { loai: 'cot', t: 'Cuộc kiểm tra theo cơ quan chủ trì kiểm tra', theo: 'co_quan_chu_tri_kiem_tra', m: 'cuoc' },
    { loai: 'xu', t: 'Số cuộc kiểm tra qua các kỳ', m: 'cuoc' }],
  kt: [{ l: '«Tỷ lệ thực hiện kiến nghị» lệch «Đã thực hiện kiến nghị» ÷ «Số kiến nghị xử lý» × 100', c: ['ty_le_thuc_hien_kien_nghi'], f: (R) => efTyleSai(R.ty_le_thuc_hien_kien_nghi, R.da_thuc_hien_kien_nghi, R.so_kien_nghi_xu_ly) },
    { l: 'Đã + đang + quá hạn thực hiện kiến nghị lớn hơn «Số kiến nghị xử lý»', c: ['so_kien_nghi_xu_ly'], f: (R) => efNum(R.so_kien_nghi_xu_ly) != null && efCong(R, ['da_thuc_hien_kien_nghi', 'dang_thuc_hien_kien_nghi', 'qua_han_thuc_hien_kien_nghi']) > R.so_kien_nghi_xu_ly },
    { l: 'Đã ban hành kết luận mà thiếu ngày hoặc số kết luận', c: ['ngay_ban_hanh_ket_luan', 'so_ket_luan'], f: (R) => R.da_ban_hanh_ket_luan === 'co' && (!R.ngay_ban_hanh_ket_luan || !R.so_ket_luan) },
    { l: '«Có kiến nghị xử lý» = Không mà «Số kiến nghị xử lý» > 0', c: ['co_kien_nghi_xu_ly'], f: (R) => R.co_kien_nghi_xu_ly === 'khong' && efNum(R.so_kien_nghi_xu_ly) > 0 },
    { l: '«Thời gian kết thúc thực tế» trước «Thời gian bắt đầu»', c: ['thoi_gian_ket_thuc_thuc_te'], f: (R) => efSauHan(R.thoi_gian_bat_dau, R.thoi_gian_ket_thuc_thuc_te) }]
};
const EF_TTRA2_CUOC = ['so_qd_thanh_tra', 'dia_ban'];
const EF_TTRA2 = {
  ef: 'ttra2', ten: 'Thanh tra', banGhi: 'một cuộc thanh tra (theo «Số QĐ thanh tra») tại một xã, phường, hoặc một lần theo dõi sau thanh tra của cuộc đó',
  khoa: ['so_qd_thanh_tra', 'dia_ban', 'loai_ban_ghi'], cap: ['linh_vuc_thanh_tra', 'ten_cuoc_thanh_tra_noi_dung'], xaTruong: 'dia_ban', xaChi: ['cuoc', 'gtkn', 'tlth'],
  bo: { loai_ban_ghi: [efMa('ttra2', 'loai_ban_ghi', 'Không phát sinh')] },
  luuY: 'Số của cuộc (đơn vị, kiến nghị, giá trị thu hồi) mỗi cuộc lấy bản gửi sau cùng trong kỳ xem (cuộc thanh tra hoặc theo dõi sau thanh tra), không cộng các kỳ với nhau.',
  chi: {
    cuoc: { l: 'Số cuộc thanh tra', loai: 'demkhac', c: 'so_qd_thanh_tra' },
    kl: { l: 'Cuộc đã ban hành kết luận', loai: 'demkhac', c: 'so_qd_thanh_tra', loc: { da_ban_hanh_ket_luan: [efMa('ttra2', 'da_ban_hanh_ket_luan', 'Có')] } },
    doCb: { l: 'Cuộc mức cảnh báo Đỏ', loai: 'demkhac', c: 'so_qd_thanh_tra', loc: { muc_canh_bao: [efMa('ttra2', 'muc_canh_bao', 'Đỏ - quá hạn/chưa xác nhận')] } },
    dv: { l: efL('ttra2', 'so_don_vi_duoc_thanh_tra'), loai: 'motlan', c: 'so_don_vi_duoc_thanh_tra', theo: EF_TTRA2_CUOC },
    kn: { l: efL('ttra2', 'so_kien_nghi_xu_ly'), loai: 'motlan', c: 'so_kien_nghi_xu_ly', theo: EF_TTRA2_CUOC },
    gtkn: { l: efL('ttra2', 'gia_tri_kien_nghi_thu_hoi_trieu_dong'), loai: 'motlan', c: 'gia_tri_kien_nghi_thu_hoi_trieu_dong', theo: EF_TTRA2_CUOC },
    gtth: { l: efL('ttra2', 'gia_tri_da_thu_hoi_trieu_dong'), loai: 'motlan', c: 'gia_tri_da_thu_hoi_trieu_dong', theo: EF_TTRA2_CUOC },
    hc: { l: efL('ttra2', 'so_ca_nhan_to_chuc_kien_nghi_xu_ly_hc'), loai: 'motlan', c: 'so_ca_nhan_to_chuc_kien_nghi_xu_ly_hc', theo: EF_TTRA2_CUOC },
    cqdt: { l: efL('ttra2', 'so_vu_viec_chuyen_cq_dieu_tra'), loai: 'motlan', c: 'so_vu_viec_chuyen_cq_dieu_tra', theo: EF_TTRA2_CUOC },
    vb: { l: efL('ttra2', 'so_van_ban_don_doc_nhac'), loai: 'motlan', c: 'so_van_ban_don_doc_nhac', theo: EF_TTRA2_CUOC },
    tlth: { l: 'Tỷ lệ thu hồi (IOC tính)', loai: 'tyle', tu: 'gtth', mau: 'gtkn' },
    tlthN: { l: efL('ttra2', 'ty_le_thu_hoi') + ' đã nhập', loai: 'nhap', c: 'ty_le_thu_hoi', u: '%', theo: EF_TTRA2_CUOC },
    tdN: { l: efL('ttra2', 'tien_do_phan_tram') + ' đã nhập', loai: 'nhap', c: 'tien_do_phan_tram', u: '%', theo: EF_TTRA2_CUOC }
  },
  cot: ['cuoc', 'dv', 'kn', 'gtkn', 'gtth', 'tlth', 'tlthN', 'tdN'], the: ['cuoc', 'gtkn', 'gtth', 'tlth'],
  bieu: [{ loai: 'cot', t: 'Cuộc thanh tra theo lĩnh vực', theo: 'linh_vuc_thanh_tra', m: 'cuoc' }, { loai: 'chong', t: 'Cuộc thanh tra theo trạng thái', theo: 'trang_thai_cuoc_thanh_tra', m: 'cuoc' },
    { loai: 'cot', t: 'Cuộc thanh tra theo nguồn kế hoạch', theo: 'nguon_ke_hoach', m: 'cuoc' }, { loai: 'chong', t: 'Cuộc thanh tra theo mức cảnh báo', theo: 'muc_canh_bao', m: 'cuoc' },
    { loai: 'ds', t: 'Giá trị kiến nghị thu hồi và đã thu hồi', ms: ['gtkn', 'gtth'] }, { loai: 'xu', t: 'Giá trị đã thu hồi qua các kỳ', m: 'gtth' }],
  kt: [{ l: '«Tỷ lệ thu hồi» lệch «Giá trị đã thu hồi» ÷ «Giá trị kiến nghị thu hồi» × 100', c: ['ty_le_thu_hoi'], f: (R) => efTyleSai(R.ty_le_thu_hoi, R.gia_tri_da_thu_hoi_trieu_dong, R.gia_tri_kien_nghi_thu_hoi_trieu_dong) },
    { l: '«Giá trị đã thu hồi» lớn hơn «Giá trị kiến nghị thu hồi»', c: ['gia_tri_da_thu_hoi_trieu_dong'], f: (R) => efDong(R.gia_tri_da_thu_hoi_trieu_dong, R.gia_tri_kien_nghi_thu_hoi_trieu_dong) },
    { l: 'Đã ban hành kết luận mà thiếu số hoặc ngày kết luận', c: ['so_kl_thanh_tra', 'ngay_kl_thanh_tra'], f: (R) => R.da_ban_hanh_ket_luan === 'co' && (!R.so_kl_thanh_tra || !R.ngay_kl_thanh_tra) },
    { l: '«Kiến nghị xử lý» = Không mà «Số kiến nghị xử lý» > 0', c: ['kien_nghi_xu_ly'], f: (R) => R.kien_nghi_xu_ly === 'khong' && efNum(R.so_kien_nghi_xu_ly) > 0 },
    { l: '«Ngày kết thúc thực tế» trước «Ngày bắt đầu»', c: ['ngay_ket_thuc_thuc_te'], f: (R) => efSauHan(R.ngay_bat_dau, R.ngay_ket_thuc_thuc_te) },
    { l: '«Quá hạn (ngày)» > 0 mà mức cảnh báo Xanh', c: ['muc_canh_bao'], f: (R) => efNum(R.qua_han_ngay) > 0 && R.muc_canh_bao === 'xanh' }]
};
const EF_TTRA3_DON = ['so_don_khieu_nai', 'so_don_to_cao', 'so_don_kien_nghi_phan_anh', 'so_don_nhieu_noi_dung_khac'];
const efCongTt = (id, c) => ({ l: efL('ttra3', c), loai: 'cong', c: c });
const EF_TTRA3 = {
  ef: 'ttra3', ten: 'Tiếp công dân, khiếu nại, tố cáo', banGhi: 'số liệu tiếp công dân, xử lý đơn thư, giải quyết vụ việc của một xã, phường (có thể đến thôn/TDP) trong một kỳ',
  khoa: ['dia_ban', 'thon_tdp', 'loai_ban_ghi'], khoaRong: ['thon_tdp'], cap: ['tinh_trang_xu_ly_tong_hop', 'dia_ban'], xaTruong: 'dia_ban', xaChi: ['luot', 'don', 'tlgq', 'ton'],
  uuTien: { c: 'loai_ban_ghi', v: efMa('ttra3', 'loai_ban_ghi', 'Tổng hợp tiếp công dân/đơn thư'), theo: ['dia_ban', '_kyId'] }, bo: { loai_ban_ghi: [efMa('ttra3', 'loai_ban_ghi', 'Không phát sinh')] },
  luuY: 'Cùng xã, phường, cùng kỳ có bản Tổng hợp thì chỉ dùng bản Tổng hợp, không có thì cộng các bản chi tiết. Bản kỳ «Đột xuất» xếp vào tháng của «Ngày báo cáo».',
  chi: {
    cuoc: efCongTt('cuoc', 'so_cuoc_tiep_cong_dan'), luot: efCongTt('luot', 'so_luot_cong_dan'), doan: efCongTt('doan', 'so_doan_dong_nguoi'), vvtd: efCongTt('vvtd', 'so_vu_viec_tiep_nhan_qua_tiep_dan'),
    don: efCongTt('don', 'tong_don_thu_tiep_nhan'), dau: { l: efL('ttra3', 'don_ky_truoc_chuyen_sang'), loai: 'dau', c: 'don_ky_truoc_chuyen_sang' }, moi: efCongTt('moi', 'don_moi_trong_ky'),
    ddk: efCongTt('ddk', 'don_du_dieu_kien_xu_ly'), kdk: efCongTt('kdk', 'don_khong_du_dieu_kien_luu'), tq: efCongTt('tq', 'don_thuoc_tham_quyen'),
    chuyen: efCongTt('chuyen', 'don_khong_thuoc_tham_quyen_da_chuyen'), hd: efCongTt('hd', 'don_khong_thuoc_tham_quyen_da_huong_dan'),
    kn: efCongTt('kn', 'so_don_khieu_nai'), tc: efCongTt('tc', 'so_don_to_cao'), pa: efCongTt('pa', 'so_don_kien_nghi_phan_anh'), khac: efCongTt('khac', 'so_don_nhieu_noi_dung_khac'),
    thuly: efCongTt('thuly', 'so_vu_viec_thu_ly'), dgq: efCongTt('dgq', 'so_vu_viec_da_giai_quyet'), dh: efCongTt('dh', 'so_vu_giai_quyet_dung_han'), qh: efCongTt('qh', 'so_vu_giai_quyet_qua_han'),
    dxtr: { l: efL('ttra3', 'so_vu_dang_xu_ly_trong_han'), loai: 'td', c: 'so_vu_dang_xu_ly_trong_han' }, dxqh: { l: efL('ttra3', 'so_vu_dang_xu_ly_qua_han'), loai: 'td', c: 'so_vu_dang_xu_ly_qua_han' },
    rut: efCongTt('rut', 'so_vu_rut_don_dinh_chi'), pt: { l: efL('ttra3', 'so_vu_phuc_tap_keo_dai'), loai: 'td', c: 'so_vu_phuc_tap_keo_dai' },
    ton: { l: efL('ttra3', 'ton_cuoi_ky'), loai: 'td', c: 'ton_cuoi_ky' },
    tlgq: { l: 'Tỷ lệ giải quyết vụ việc (IOC tính)', loai: 'tyle', tu: 'dgq', mau: 'thuly' }, tldh: { l: 'Tỷ lệ giải quyết đúng hạn (IOC tính)', loai: 'tyle', tu: 'dh', mau: 'dgq' },
    tlgqN: { l: efL('ttra3', 'ty_le_giai_quyet_vu_viec') + ' đã nhập', loai: 'nhap', c: 'ty_le_giai_quyet_vu_viec', u: '%' },
    bg: { l: 'Số bản ghi', loai: 'dem' }
  },
  cot: ['luot', 'cuoc', 'don', 'thuly', 'dgq', 'tlgq', 'tldh', 'ton'], the: ['luot', 'don', 'tlgq', 'ton'],
  bang: [{ t: 'Đơn thư theo xã, phường', cap: ['dia_ban'], cot: ['dau', 'moi', 'don', 'ddk', 'tq', 'chuyen', 'hd'] }],
  bieu: [{ loai: 'phan', t: 'Cơ cấu 4 loại đơn', ms: ['kn', 'tc', 'pa', 'khac'] }, { loai: 'ds', t: 'Các bước xử lý đơn', ms: ['don', 'ddk', 'tq', 'chuyen', 'hd'] },
    { loai: 'ds', t: 'Giải quyết vụ việc', ms: ['thuly', 'dgq', 'dh', 'qh', 'dxtr', 'dxqh', 'rut'] }, { loai: 'cot', t: 'Lượt công dân theo loại tiếp công dân chính', theo: 'loai_tiep_cong_dan_chinh', m: 'luot' },
    { loai: 'cot', t: 'Bản ghi theo tình trạng xử lý tổng hợp', theo: 'tinh_trang_xu_ly_tong_hop', m: 'bg' }, { loai: 'xu', t: 'Lượt công dân qua các kỳ', m: 'luot' }],
  kt: [{ l: '«Tỷ lệ giải quyết vụ việc» lệch «Số vụ việc đã giải quyết» ÷ «Số vụ việc thụ lý» × 100', c: ['ty_le_giai_quyet_vu_viec'], f: (R) => efTyleSai(R.ty_le_giai_quyet_vu_viec, R.so_vu_viec_da_giai_quyet, R.so_vu_viec_thu_ly) },
    { l: '«Tỷ lệ giải quyết đúng hạn» lệch «Số vụ giải quyết đúng hạn» ÷ «Số vụ việc đã giải quyết» × 100', c: ['ty_le_giai_quyet_dung_han'], f: (R) => efTyleSai(R.ty_le_giai_quyet_dung_han, R.so_vu_giai_quyet_dung_han, R.so_vu_viec_da_giai_quyet) },
    { l: 'Đúng hạn + quá hạn khác «Số vụ việc đã giải quyết»', c: ['so_vu_viec_da_giai_quyet'], f: (R) => efSai(efNum(R.so_vu_viec_da_giai_quyet), efCong(R, ['so_vu_giai_quyet_dung_han', 'so_vu_giai_quyet_qua_han'])) },
    { l: '«Tổng đơn thư tiếp nhận» khác đơn kỳ trước chuyển sang + đơn mới trong kỳ', c: ['tong_don_thu_tiep_nhan'], f: (R) => efSai(efNum(R.tong_don_thu_tiep_nhan), efCong(R, ['don_ky_truoc_chuyen_sang', 'don_moi_trong_ky'])) },
    { l: '«Tổng đơn thư tiếp nhận» khác đủ điều kiện + không đủ điều kiện', c: ['don_du_dieu_kien_xu_ly'], f: (R) => efSai(efNum(R.tong_don_thu_tiep_nhan), efCong(R, ['don_du_dieu_kien_xu_ly', 'don_khong_du_dieu_kien_luu'])) },
    { l: '«Đơn đủ điều kiện xử lý» khác thuộc thẩm quyền + đã chuyển + đã hướng dẫn', c: ['don_thuoc_tham_quyen'], f: (R) => efSai(efNum(R.don_du_dieu_kien_xu_ly), efCong(R, ['don_thuoc_tham_quyen', 'don_khong_thuoc_tham_quyen_da_chuyen', 'don_khong_thuoc_tham_quyen_da_huong_dan'])) },
    { l: '4 loại đơn cộng lại khác «Tổng đơn thư tiếp nhận»', c: EF_TTRA3_DON, f: (R) => efSai(efNum(R.tong_don_thu_tiep_nhan), efCong(R, EF_TTRA3_DON)) },
    { l: '«Số vụ việc thụ lý» khác đã giải quyết + đang xử lý (trong hạn, quá hạn) + rút đơn/đình chỉ', c: ['so_vu_viec_thu_ly'], f: (R) => efSai(efNum(R.so_vu_viec_thu_ly), efCong(R, ['so_vu_viec_da_giai_quyet', 'so_vu_dang_xu_ly_trong_han', 'so_vu_dang_xu_ly_qua_han', 'so_vu_rut_don_dinh_chi'])) }]
};

/* ============================== SỞ CÔNG THƯƠNG ============================== */
const EF_SCT1 = {
  ef: 'sct1', ten: 'Xuất khẩu, nhập khẩu', banGhi: 'kim ngạch xuất, nhập khẩu của một doanh nghiệp/đơn vị tại một xã, phường trong một kỳ', khoa: ['ten_doanh_nghiep', 'dia_ban'],
  cap: ['loai_hinh_hoat_dong', 'ten_doanh_nghiep'], xaTruong: 'dia_ban', xaChi: ['xk', 'nk', 'dn'],
  chi: {
    xk: { l: efL('sct1', 'kim_ngach_xuat_khau_usd'), loai: 'cong', c: 'kim_ngach_xuat_khau_usd', u: 'USD' },
    nk: { l: efL('sct1', 'kim_ngach_nhap_khau_usd'), loai: 'cong', c: 'kim_ngach_nhap_khau_usd', u: 'USD' },
    tong: { l: efL('sct1', 'tong_kim_ngach_xnk_usd'), loai: 'cong', c: 'tong_kim_ngach_xnk_usd', u: 'USD' },
    cc: { l: 'Cán cân xuất nhập khẩu (IOC tính)', loai: 'hieu', a: 'xk', b: 'nk', u: 'USD' },
    dn: { l: 'Số doanh nghiệp', loai: 'demkhac', c: 'ten_doanh_nghiep' }
  },
  cot: ['xk', 'nk', 'tong', 'cc', 'dn'], the: ['xk', 'nk', 'cc', 'dn'],
  bieu: [{ loai: 'cot', t: 'Kim ngạch xuất khẩu theo ngành hàng', theo: 'nganh_hang_mat_hang_chinh', m: 'xk' }, { loai: 'cot', t: 'Kim ngạch xuất khẩu theo thị trường chính', theo: 'thi_truong_chinh', m: 'xk' },
    { loai: 'chong', t: 'Doanh nghiệp theo loại hình hoạt động', theo: 'loai_hinh_hoat_dong', m: 'dn' }, { loai: 'xu', t: 'Kim ngạch xuất khẩu qua các kỳ', m: 'xk' }],
  kt: [{ l: '«Tổng kim ngạch XNK» khác xuất khẩu + nhập khẩu', c: ['tong_kim_ngach_xnk_usd'], f: (R) => efSai(efNum(R.tong_kim_ngach_xnk_usd), efCong(R, ['kim_ngach_xuat_khau_usd', 'kim_ngach_nhap_khau_usd'])) },
    { l: 'Loại hình hoạt động chỉ xuất (hoặc chỉ nhập) mà có kim ngạch chiều kia', c: ['loai_hinh_hoat_dong'], f: (R) => (R.loai_hinh_hoat_dong === 'xuat_khau' && efNum(R.kim_ngach_nhap_khau_usd) > 0) || (R.loai_hinh_hoat_dong === 'nhap_khau' && efNum(R.kim_ngach_xuat_khau_usd) > 0) }]
};
const EF_SCT2 = {
  ef: 'sct2', ten: 'Bán lẻ hàng hóa, dịch vụ tiêu dùng', banGhi: 'doanh thu của một cơ sở/doanh nghiệp kinh doanh tại một xã, phường trong một kỳ', khoa: ['ten_co_so_doanh_nghiep', 'dia_ban'],
  cap: ['loai_hinh_kinh_doanh', 'ten_co_so_doanh_nghiep'], xaTruong: 'dia_ban', xaChi: ['tm', 'cs'],
  chi: {
    tm: { l: efL('sct2', 'tong_muc_ban_le_dv_tieu_dung_dong'), loai: 'cong', c: 'tong_muc_ban_le_dv_tieu_dung_dong' },
    bl: { l: efL('sct2', 'doanh_thu_ban_le_hang_hoa_dong'), loai: 'cong', c: 'doanh_thu_ban_le_hang_hoa_dong' },
    dv: { l: efL('sct2', 'doanh_thu_dich_vu_dong'), loai: 'cong', c: 'doanh_thu_dich_vu_dong' },
    kt: { l: efL('sct2', 'doanh_thu_ky_truoc_lien_ke_dong'), loai: 'cong', c: 'doanh_thu_ky_truoc_lien_ke_dong' },
    tang: { l: 'Tốc độ tăng so với kỳ trước (IOC tính)', loai: 'tang', tu: 'tm', mau: 'kt' },
    tangN: { l: efL('sct2', 'toc_do_tang_ky_truoc_phan_tram') + ' đã nhập', loai: 'nhap', c: 'toc_do_tang_ky_truoc_phan_tram', u: '%' },
    cs: { l: 'Số cơ sở', loai: 'demkhac', c: 'ten_co_so_doanh_nghiep' }
  },
  cot: ['tm', 'bl', 'dv', 'kt', 'tang', 'tangN'], the: ['tm', 'bl', 'dv', 'tang'],
  bieu: [{ loai: 'phan', t: 'Cơ cấu tổng mức: bán lẻ hàng hóa – dịch vụ', ms: ['bl', 'dv'] }, { loai: 'cot', t: 'Tổng mức theo loại hình kinh doanh', theo: 'loai_hinh_kinh_doanh', m: 'tm' },
    { loai: 'cot', t: 'Tổng mức theo ngành hàng/lĩnh vực dịch vụ', theo: 'nganh_hang_linh_vuc_dich_vu_chinh', m: 'tm' }, { loai: 'xu', t: 'Tổng mức qua các kỳ', m: 'tm' }],
  kt: [{ l: '«Tổng mức bán lẻ & DV tiêu dùng» khác bán lẻ + dịch vụ', c: ['tong_muc_ban_le_dv_tieu_dung_dong'], f: (R) => efSai(efNum(R.tong_muc_ban_le_dv_tieu_dung_dong), efCong(R, ['doanh_thu_ban_le_hang_hoa_dong', 'doanh_thu_dich_vu_dong'])) },
    { l: '«Tốc độ tăng so với kỳ trước» lệch tổng mức ÷ doanh thu kỳ trước × 100 − 100', c: ['toc_do_tang_ky_truoc_phan_tram'],
      f: (R) => efNum(R.toc_do_tang_ky_truoc_phan_tram) != null && efNum(R.doanh_thu_ky_truoc_lien_ke_dong) ? Math.abs(R.toc_do_tang_ky_truoc_phan_tram - (R.tong_muc_ban_le_dv_tieu_dung_dong / R.doanh_thu_ky_truoc_lien_ke_dong * 100 - 100)) > 0.1 : false }]
};
const EF_SCT3 = {
  ef: 'sct3', ten: 'Thương mại điện tử', banGhi: 'một chỉ tiêu chuyển đổi số («Mã chỉ tiêu con (CĐS)») theo một nhóm đối tượng tại một xã, phường trong một kỳ',
  khoa: ['dia_ban', 'ma_chi_tieu_con_cds', 'doi_tuong_thong_ke'], cap: ['ma_chi_tieu_con_cds', 'doi_tuong_thong_ke'], xaTruong: 'dia_ban', xaChi: ['tl'],
  luuY: 'Danh mục «Mã chỉ tiêu con (CĐS)» chỉ có số (34–39), chưa có tên chỉ số; số đối tượng, số đạt là số tại thời điểm (xem quý, năm lấy kỳ cuối).',
  chi: {
    tong: { l: efL('sct3', 'tong_so_doi_tuong'), loai: 'td', c: 'tong_so_doi_tuong' },
    dat: { l: efL('sct3', 'so_doi_tuong_dat'), loai: 'td', c: 'so_doi_tuong_dat' },
    tl: { l: 'Tỷ lệ đạt (IOC tính)', loai: 'tyle', tu: 'dat', mau: 'tong' },
    tlN: { l: efL('sct3', 'ty_le_dat_phan_tram') + ' đã nhập', loai: 'nhap', c: 'ty_le_dat_phan_tram' },
    xa: { l: 'Số xã, phường báo cáo', loai: 'demkhac', c: 'dia_ban' }
  },
  cot: ['tong', 'dat', 'tl', 'tlN'], the: ['tong', 'dat', 'tl', 'xa'],
  bieu: [{ loai: 'cot', t: 'Tỷ lệ đạt theo mã chỉ tiêu', theo: 'ma_chi_tieu_con_cds', m: 'tl' }, { loai: 'cot', t: 'Tỷ lệ đạt theo đối tượng thống kê', theo: 'doi_tuong_thong_ke', m: 'tl' }, { loai: 'xu', t: 'Tỷ lệ đạt qua các kỳ', m: 'tl' }],
  kt: [{ l: '«Số đối tượng đạt» lớn hơn «Tổng số đối tượng»', c: ['so_doi_tuong_dat'], f: (R) => efDong(R.so_doi_tuong_dat, R.tong_so_doi_tuong) },
    { l: '«Tỷ lệ đạt (%)» lệch «Số đối tượng đạt» ÷ «Tổng số đối tượng» × 100', c: ['ty_le_dat_phan_tram'], f: (R) => efTyleSai(R.ty_le_dat_phan_tram, R.so_doi_tuong_dat, R.tong_so_doi_tuong) }]
};
const SCT4_DVT = { dien_nang: ['kWh'], xang_dau: [efMa('sct4', 'don_vi_tinh', 'Lít'), efMa('sct4', 'don_vi_tinh', 'M3')], than: [efMa('sct4', 'don_vi_tinh', 'Tấn')] };
const efSl4 = (l, kl, mh, dvt, u) => ({ l: l, kl: kl, loai: 'cong', c: 'san_luong_trong_ky', loc: { loai_mat_hang: [mh], don_vi_tinh: [dvt] }, u: u });
const EF_SCT4 = {
  ef: 'sct4', ten: 'Điện năng, xăng dầu, than', banGhi: 'sản lượng một mặt hàng của một đơn vị cung ứng/kinh doanh tại một xã, phường trong một kỳ',
  khoa: ['dia_ban', 'ten_don_vi_cung_ung', 'loai_mat_hang'], cap: ['loai_mat_hang', 'don_vi_tinh', 'loai_hinh_don_vi'], dvt: 'don_vi_tinh', xaTruong: 'dia_ban', xaChi: ['dien', 'dv'],
  chi: {
    sl: { l: efL('sct4', 'san_luong_trong_ky'), loai: 'cong', c: 'san_luong_trong_ky', dvt: true },
    dien: efSl4('Sản lượng điện năng (kWh)', 'Điện năng', 'dien_nang', 'kWh', 'kWh'),
    xdL: efSl4('Sản lượng xăng dầu (lít)', 'Xăng dầu (lít)', 'xang_dau', efMa('sct4', 'don_vi_tinh', 'Lít'), 'lít'),
    xdM: efSl4('Sản lượng xăng dầu (m³)', 'Xăng dầu (m³)', 'xang_dau', efMa('sct4', 'don_vi_tinh', 'M3'), 'm³'),
    than: efSl4('Sản lượng than (tấn)', 'Than', 'than', efMa('sct4', 'don_vi_tinh', 'Tấn'), 'tấn'),
    dv: { l: 'Số đơn vị cung ứng', loai: 'demkhac', c: 'ten_don_vi_cung_ung' }
  },
  cot: ['sl', 'dv'], the: ['dien', 'xdL', 'than', 'dv'],
  bieu: [{ loai: 'cot', t: 'Sản lượng điện năng theo loại hình đơn vị', theo: 'loai_hinh_don_vi', m: 'dien' }, { loai: 'cot', t: 'Sản lượng xăng dầu (lít) theo loại hình đơn vị', theo: 'loai_hinh_don_vi', m: 'xdL' },
    { loai: 'xu', t: 'Sản lượng điện năng qua các kỳ', m: 'dien' }],
  kt: [{ l: '«Đơn vị tính» không hợp «Loại mặt hàng»', c: ['don_vi_tinh'], f: (R) => !!(SCT4_DVT[R.loai_mat_hang] && R.don_vi_tinh && SCT4_DVT[R.loai_mat_hang].indexOf(R.don_vi_tinh) < 0) }]
};
const EF_SCT5 = {
  ef: 'sct5', ten: 'Sản xuất công nghiệp', banGhi: 'giá trị sản xuất công nghiệp của một doanh nghiệp/cơ sở tại một xã, phường trong một kỳ', khoa: ['ten_doanh_nghiep_co_so', 'dia_ban'],
  cap: ['nganh_cong_nghiep_vsic', 'ten_doanh_nghiep_co_so'], xaTruong: 'dia_ban', xaChi: ['kn', 'dn'],
  luuY: 'IOC không tự tính chỉ số IIP gộp (cần quyền số ngành): «Chỉ số IIP» hiện đúng số đã nhập của từng doanh nghiệp; số gộp là giá trị sản xuất kỳ này so kỳ trước (IOC tính).',
  chi: {
    kn: { l: efL('sct5', 'gia_tri_sx_ky_nay_dong'), kl: 'Giá trị sản xuất công nghiệp', loai: 'cong', c: 'gia_tri_sx_ky_nay_dong' },
    kt: { l: efL('sct5', 'gia_tri_sx_ky_truoc_dong'), loai: 'cong', c: 'gia_tri_sx_ky_truoc_dong' },
    ss: { l: 'Giá trị sản xuất kỳ này so kỳ trước (IOC tính)', loai: 'tyle', tu: 'kn', mau: 'kt' },
    iip: { l: efL('sct5', 'chi_so_iip_ky_truoc_phan_tram') + ' đã nhập', loai: 'nhap', c: 'chi_so_iip_ky_truoc_phan_tram', u: '%' },
    dn: { l: 'Số doanh nghiệp', loai: 'demkhac', c: 'ten_doanh_nghiep_co_so' }
  },
  cot: ['kn', 'kt', 'ss', 'iip', 'dn'], the: ['kn', 'kt', 'ss', 'dn'],
  bieu: [{ loai: 'cot', t: 'Giá trị sản xuất kỳ này theo ngành công nghiệp', theo: 'nganh_cong_nghiep_vsic', m: 'kn' }, { loai: 'xu', t: 'Giá trị sản xuất qua các kỳ', m: 'kn' }],
  kt: [{ l: '«Chỉ số IIP» lệch giá trị kỳ này ÷ kỳ trước × 100', c: ['chi_so_iip_ky_truoc_phan_tram'], f: (R) => efTyleSai(R.chi_so_iip_ky_truoc_phan_tram, R.gia_tri_sx_ky_nay_dong, R.gia_tri_sx_ky_truoc_dong) }]
};

/* ============================== SỞ NỘI VỤ ============================== */
const SNV1_MA = (n) => efVs('snv1', 'ma_chi_tieu_qd4795').find((v) => v.indexOf(String(n)) === 0);
const efSnv1 = (l, loai, c, n, ext) => Object.assign({ l: l, loai: loai, c: c, loc: { ma_chi_tieu_qd4795: [SNV1_MA(n)] } }, ext || {});
const EF_SNV1 = {
  ef: 'snv1', ten: 'Bảo hiểm xã hội, y tế, thất nghiệp', banGhi: 'một chỉ tiêu QĐ4795 (27–31) của một xã, phường (có thể đến thôn/TDP) trong một kỳ',
  khoa: ['dia_ban', 'thon_tdp', 'ma_chi_tieu_qd4795', 'doi_tuong_noi_dung'], khoaRong: ['thon_tdp', 'doi_tuong_noi_dung'], cap: ['ma_chi_tieu_qd4795', 'don_vi_tinh', 'doi_tuong_noi_dung'], dvt: 'don_vi_tinh',
  xaTruong: 'dia_ban', xaChi: ['tl27', 'tl28'],
  luuY: 'Mã 27, 28 (tỷ lệ tham gia) là số tại thời điểm: xem quý, năm lấy kỳ cuối. Mã 29, 30, 31 (người hưởng, thu, chi) nhập ở «Tổng số đối tượng» kèm «Đơn vị tính», cộng theo từng đơn vị tính (bảng phụ).',
  chi: {
    tg: { l: efL('snv1', 'tong_so_doi_tuong') + ' (kỳ cuối)', loai: 'td', c: 'tong_so_doi_tuong', dvt: true },
    dat: { l: efL('snv1', 'so_doi_tuong_dat') + ' (kỳ cuối)', loai: 'td', c: 'so_doi_tuong_dat', dvt: true },
    tlN: { l: efL('snv1', 'ty_le_phan_tram') + ' đã nhập', loai: 'nhap', c: 'ty_le_phan_tram', u: '%' },
    tgC: { l: efL('snv1', 'tong_so_doi_tuong') + ' (cộng)', loai: 'cong', c: 'tong_so_doi_tuong', dvt: true },
    t27: efSnv1('Tham gia BHTN · tổng số đối tượng', 'td', 'tong_so_doi_tuong', 27), d27: efSnv1('Tham gia BHTN · số đạt', 'td', 'so_doi_tuong_dat', 27),
    tl27: { l: 'Tỷ lệ tham gia BHTN (IOC tính)', loai: 'tyle', tu: 'd27', mau: 't27' },
    t28: efSnv1('Tham gia BHXH · tổng số đối tượng', 'td', 'tong_so_doi_tuong', 28), d28: efSnv1('Tham gia BHXH · số đạt', 'td', 'so_doi_tuong_dat', 28),
    tl28: { l: 'Tỷ lệ tham gia BHXH (IOC tính)', loai: 'tyle', tu: 'd28', mau: 't28' },
    bg: { l: 'Số bản ghi', loai: 'dem' }
  },
  cot: ['tg', 'dat', 'tlN', 'bg'], the: ['tl28', 'tl27', 't28', 'bg'],
  bang: [{ t: 'Mã 29, 30, 31 (người hưởng, thu, chi) cộng theo đơn vị tính', cap: ['ma_chi_tieu_qd4795', 'don_vi_tinh'], cot: ['tgC', 'bg'], loc: { ma_chi_tieu_qd4795: [29, 30, 31].map(SNV1_MA) } }],
  bieu: [{ loai: 'ds', t: 'Tỷ lệ tham gia BHTN, BHXH (IOC tính)', ms: ['tl27', 'tl28'] }, { loai: 'xu', t: 'Tỷ lệ tham gia BHXH qua các kỳ', m: 'tl28' }],
  kt: [{ l: '«Số đối tượng đạt» lớn hơn «Tổng số đối tượng» (mã 27, 28)', c: ['so_doi_tuong_dat'], f: (R) => [SNV1_MA(27), SNV1_MA(28)].indexOf(R.ma_chi_tieu_qd4795) >= 0 && efDong(R.so_doi_tuong_dat, R.tong_so_doi_tuong) },
    { l: '«Tỷ lệ (%)» lệch số đạt ÷ tổng (cả cách nhập 50 và 0,5)', c: ['ty_le_phan_tram'],
      f: (R) => efNum(R.ty_le_phan_tram) != null && efNum(R.so_doi_tuong_dat) != null && efNum(R.tong_so_doi_tuong) ? Math.abs(R.ty_le_phan_tram - R.so_doi_tuong_dat / R.tong_so_doi_tuong * 100) > 0.1 && Math.abs(R.ty_le_phan_tram - R.so_doi_tuong_dat / R.tong_so_doi_tuong) > 0.001 : false }]
};
const efTd2 = (c, l) => ({ l: l || efL('snv2', c), loai: 'td', c: c });
const efCong2 = (c, l) => ({ l: l || efL('snv2', c), loai: 'cong', c: c });
const EF_SNV2 = {
  ef: 'snv2', ten: 'Lao động, công chức, viên chức', banGhi: 'số liệu lao động, công chức, viên chức của một xã, phường trong một kỳ', khoa: ['dia_ban'], cap: ['dia_ban'], xaTruong: 'dia_ban', xaChi: ['ld', 'tlck', 'bcth'],
  luuY: 'Lực lượng lao động, đơn vị có chuyên trách, số được bồi dưỡng, được cấp chữ ký số, biên chế là số tại thời điểm (xem quý, năm lấy kỳ cuối); tuyển mới, nghỉ hưu, thôi việc, chuyển công tác, lao động đi nước ngoài là số phát sinh (cộng).',
  chi: {
    ld: efTd2('tong_luc_luong_lao_dong'), lddat: efTd2('so_lao_dong_dat'), tlld: { l: 'Lao động đạt so tổng lực lượng lao động (IOC tính)', loai: 'tyle', tu: 'lddat', mau: 'ld' },
    cds: efTd2('don_vi_co_cbccvc_chuyen_trach_cds'), antt: efTd2('don_vi_co_cbccvc_chuyen_trach_antt_mang'),
    ksT: efTd2('tong_cbccvc_boi_duong_ky_nang_so'), ksD: efTd2('so_cbccvc_boi_duong_ky_nang_so_dat'), tlks: { l: 'Tỷ lệ CBCCVC bồi dưỡng kỹ năng số đạt (IOC tính)', loai: 'tyle', tu: 'ksD', mau: 'ksT' },
    ckT: efTd2('tong_cbccvc_cap_chu_ky_so'), ckD: efTd2('so_cbccvc_cap_chu_ky_so_dat'), tlck: { l: 'Tỷ lệ CBCCVC được cấp chữ ký số đạt (IOC tính)', loai: 'tyle', tu: 'ckD', mau: 'ckT' },
    xkld: efCong2('lao_dong_viet_nam_di_nuoc_ngoai'), nn: efTd2('lao_dong_nuoc_ngoai'),
    bchl: efTd2('bien_che_huong_luong'), bcg: efTd2('bien_che_duoc_giao'), bcth: efTd2('bien_che_thuc_hien'), thieu: { l: 'Biên chế còn thiếu (IOC tính)', loai: 'hieu', a: 'bcg', b: 'bcth' },
    tm: efCong2('so_tuyen_moi'), nh: efCong2('so_nghi_huu'), tv: efCong2('thoi_viec'), ct: efCong2('chuyen_cong_tac')
  },
  cot: ['ld', 'tlld', 'tlks', 'tlck', 'bcg', 'bcth', 'thieu', 'tm'], the: ['ld', 'tlck', 'bcth', 'tm'],
  bieu: [{ loai: 'ds', t: 'Ba tỷ lệ (IOC tính)', ms: ['tlld', 'tlks', 'tlck'] }, { loai: 'ds', t: 'Biến động công chức, viên chức', ms: ['tm', 'nh', 'tv', 'ct'] },
    { loai: 'ds', t: 'Biên chế', ms: ['bcg', 'bcth', 'bchl'] }, { loai: 'ds', t: 'Lao động đi nước ngoài, lao động nước ngoài; đơn vị có chuyên trách', ms: ['xkld', 'nn', 'cds', 'antt'] }, { loai: 'xu', t: 'Lực lượng lao động qua các kỳ', m: 'ld' }],
  kt: [{ l: 'Số "đạt" lớn hơn số "tổng" tương ứng', c: ['so_lao_dong_dat', 'so_cbccvc_boi_duong_ky_nang_so_dat', 'so_cbccvc_cap_chu_ky_so_dat'],
    f: (R) => efDong(R.so_lao_dong_dat, R.tong_luc_luong_lao_dong) || efDong(R.so_cbccvc_boi_duong_ky_nang_so_dat, R.tong_cbccvc_boi_duong_ky_nang_so) || efDong(R.so_cbccvc_cap_chu_ky_so_dat, R.tong_cbccvc_cap_chu_ky_so) },
    { l: '«Biên chế thực hiện» lớn hơn «Biên chế được giao»', c: ['bien_che_thuc_hien'], f: (R) => efDong(R.bien_che_thuc_hien, R.bien_che_duoc_giao) }]
};

/* ============================== SỞ NN&MT: 10 eform cùng một mẫu 18 trường ============================== */
const NNMT_TEN = { nnmt1: 'Xã đạt chuẩn nông thôn mới', nnmt2: 'Rừng bị thiệt hại', nnmt3: 'Rừng trồng mới tập trung', nnmt4: 'CTMTQG xây dựng nông thôn mới', nnmt5: 'CTMTQG giảm nghèo bền vững',
  nnmt6: 'Khí tượng thủy văn', nnmt7: 'Công trình phòng chống thiên tai', nnmt8: 'Hỗ trợ lương thực', nnmt9: 'Gạo hỗ trợ', nnmt10: 'Bản đồ, ảnh viễn thám' };
function efNnCfg(ef) {
  const F = EFK[ef].F, c9 = F.ten_noi_dung_du_an_su_kien ? 'ten_noi_dung_du_an_su_kien' : 'ten_noi_dung_du_an_s', ten = NNMT_TEN[ef], kps = (c) => (F[c].dm || []).filter((o) => o.l === 'Không phát sinh').map((o) => o.v);
  const bo = {}; ['phan_to_loai_du_lieu', 'trang_thai_trien_khai'].forEach((c) => { if (kps(c).length) bo[c] = kps(c); });
  return {
    ef: ef, ten: ten, banGhi: 'một nội dung/dự án/sự kiện theo một «Phân tổ/loại dữ liệu» tại một xã, phường (có thể đến thôn/TDP) trong một kỳ',
    khoa: ['dia_ban', 'thon_tdp', 'phan_to_loai_du_lieu', c9], khoaRong: ['thon_tdp', c9], cap: ['phan_to_loai_du_lieu', c9], xaTruong: 'dia_ban', xaChi: ['kn', 'cham'], bo: bo,
    luuY: 'Eform không có trường đơn vị tính nên giá trị hiện đúng như đã nhập, chưa ghi đơn vị (chờ Sở xác nhận). «Tỷ lệ/tiến độ», «Cùng kỳ/chuẩn so sánh», «Chênh lệch» là số đơn vị tự nhập.',
    chi: {
      kn: { l: efL(ef, 'gia_tri_ky_nay'), loai: 'cong', c: 'gia_tri_ky_nay', u: '' },
      lk: { l: efL(ef, 'gia_tri_luy_ke'), loai: 'td', c: 'gia_tri_luy_ke', u: '' },
      ck: { l: efL(ef, 'cung_ky_chuan_so_sanh'), loai: 'cong', c: 'cung_ky_chuan_so_sanh', u: '' },
      cl: { l: efL(ef, 'chenh_lech_ky_nay_cung_ky'), loai: 'cong', c: 'chenh_lech_ky_nay_cung_ky', u: '' },
      nd: { l: 'Số nội dung', loai: 'dem' },
      ht: { l: 'Hoàn thành', loai: 'dembang', c: 'trang_thai_trien_khai', v: ['hoan_thanh'] },
      cham: { l: 'Chậm tiến độ, đình trệ, cần xử lý', loai: 'dembang', c: 'trang_thai_trien_khai', v: ['cham_tien_do', 'dinh_tre', 'can_xu_ly'] },
      tlN: { l: efL(ef, 'ty_le_tien_do_tu_tinh') + ' đã nhập', loai: 'nhap', c: 'ty_le_tien_do_tu_tinh', u: '' }
    },
    cot: ['kn', 'lk', 'ck', 'cl', 'nd', 'cham', 'tlN'], the: ['kn', 'lk', 'nd', 'cham'],
    bieu: [{ loai: 'cot', t: 'Giá trị kỳ này theo ' + F.phan_to_loai_du_lieu.l.toLowerCase(), theo: 'phan_to_loai_du_lieu', m: 'kn' }, { loai: 'chong', t: 'Nội dung theo trạng thái triển khai', theo: 'trang_thai_trien_khai', m: 'nd' },
      { loai: 'xu', t: 'Giá trị kỳ này qua các kỳ', m: 'kn' }],
    kt: [{ l: '«Chênh lệch kỳ này-cùng kỳ» khác «Giá trị kỳ này» − «Cùng kỳ/chuẩn so sánh»', c: ['chenh_lech_ky_nay_cung_ky'],
      f: (R) => efNum(R.gia_tri_ky_nay) != null && efNum(R.cung_ky_chuan_so_sanh) != null && efSai(efNum(R.chenh_lech_ky_nay_cung_ky), R.gia_tri_ky_nay - R.cung_ky_chuan_so_sanh, 0.01) },
      { l: '«Giá trị lũy kế» nhỏ hơn «Giá trị kỳ này»', c: ['gia_tri_luy_ke'], f: (R) => efDong(R.gia_tri_ky_nay, R.gia_tri_luy_ke) },
      { l: 'Chậm tiến độ, đình trệ, cần xử lý mà để trống «Vướng mắc/Nguyên nhân»', c: ['vuong_mac_nguyen_nhan'], f: (R) => ['cham_tien_do', 'dinh_tre', 'can_xu_ly'].indexOf(R.trang_thai_trien_khai) >= 0 && !R.vuong_mac_nguyen_nhan }]
  };
}
const EF_NNMT = Object.keys(NNMT_TEN).map(efNnCfg);

if (SO_EF_BAT) {
  ctmEformDonVi({ id: 'ubnd-thanhtra', role: 'UBND', name: 'Thanh tra Thành phố', short: 'Thanh tra Thành phố', org: 'UBND Thành phố Hà Nội', eforms: [EF_TTRA1, EF_TTRA2, EF_TTRA3],
    kpis: [{ ef: 'ttra2', m: 'cuoc' }, { ef: 'ttra2', m: 'gtth' }, { ef: 'ttra2', m: 'tlth' }, { ef: 'ttra1', m: 'cuoc' }, { ef: 'ttra1', m: 'tl' }, { ef: 'ttra3', m: 'luot' }, { ef: 'ttra3', m: 'don' }, { ef: 'ttra3', m: 'tlgq' }],
    card: ['ttra2_cuoc', 'ttra3_luot', 'ttra3_tlgq'] });
  ctmEformDonVi({ id: 'ubnd-congthuong', role: 'UBND', name: 'Sở Công Thương', short: 'Sở Công Thương', org: 'UBND Thành phố Hà Nội', eforms: [EF_SCT1, EF_SCT2, EF_SCT3, EF_SCT4, EF_SCT5],
    kpis: [{ ef: 'sct1', m: 'xk' }, { ef: 'sct1', m: 'nk' }, { ef: 'sct2', m: 'tm' }, { ef: 'sct2', m: 'tang' }, { ef: 'sct3', m: 'tl' }, { ef: 'sct4', m: 'dien' }, { ef: 'sct5', m: 'kn' }, { ef: 'sct5', m: 'ss' }],
    card: ['sct1_xk', 'sct2_tm', 'sct5_kn'] });
  ctmEformDonVi({ id: 'ubnd-noivu', role: 'UBND', name: 'Sở Nội vụ', short: 'Sở Nội vụ', org: 'UBND Thành phố Hà Nội', eforms: [EF_SNV1, EF_SNV2],
    kpis: [{ ef: 'snv1', m: 'tl28' }, { ef: 'snv1', m: 'tl27' }, { ef: 'snv2', m: 'ld' }, { ef: 'snv2', m: 'tlck' }, { ef: 'snv2', m: 'bcth' }, { ef: 'snv2', m: 'tm' }],
    card: ['snv1_tl28', 'snv2_ld', 'snv2_bcth'] });
  ctmEformDonVi({ id: 'ubnd-nnmt', role: 'UBND', name: 'Sở Nông nghiệp và Môi trường', short: 'Sở NN&MT', org: 'UBND Thành phố Hà Nội', eforms: EF_NNMT,
    kpis: ['nnmt1', 'nnmt2', 'nnmt3', 'nnmt4', 'nnmt8', 'nnmt9'].map((e) => ({ ef: e, m: 'kn', l: NNMT_TEN[e] + ' · giá trị kỳ này' })).concat([{ ef: 'nnmt7', m: 'cham', l: 'Công trình phòng chống thiên tai chậm, đình trệ' }]),
    /* thẻ ngoài (màn tổng quan UBND) ghi rõ eform của từng dòng; trong popup dòng đã nằm dưới thẻ eform nên giữ tên ngắn */
    card: ['nnmt3_kn', 'nnmt2_kn', 'nnmt9_kn'], cardL: { nnmt3_kn: 'Rừng trồng mới tập trung · giá trị kỳ này', nnmt2_kn: 'Rừng bị thiệt hại · giá trị kỳ này', nnmt9_kn: 'Gạo hỗ trợ · giá trị kỳ này' } });
  /* màn tổng quan UBND: 2 ô số Công Thương đọc khóa chỉ tiêu mới (ubnd-overview.js chọn dòng thẻ theo khóa) */
  if (typeof UBND_OV_KPIS !== 'undefined') UBND_OV_KPIS.forEach((k) => { if (k.cat === 'ubnd-congthuong') k.m = { xk: 'sct1_xk', bl: 'sct2_tm' }[k.m] || k.m; });
}
