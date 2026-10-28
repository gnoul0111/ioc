/* ============================== 4 TRỤC CẤP THÀNH PHỐ — CHỈ TIÊU THEO EFORM ==============================
   Dựng theo bản đọc eform đã chốt (docs/BAN_DOC_EFORM/TRUC_*_2026_10_28) và quy ước 28/10/2026 (AGENTS.md):
     · Trục Đảng ủy → 4 Ban (UBKT: eform 1; Ban Tổ chức: eform 2–6; Ban Tuyên giáo và Dân vận: eform 7; Ban Nội chính: eform 8);
     · Trục HĐND, trục MTTQ → mỗi eform một đơn vị (không qua cấp Ban);
     · Trục UBND → VP UBND Thành phố: 5 eform sheet VP UBND + 4 eform chỉ có ở sheet "Trục UBND".
   Đơn vị cũ không có eform: ẩn bằng cờ (js/core/central-level.js: TRUC_AN_DON_VI_CU), không xóa.
   Chỉ dùng trường của eform; số IOC tính ghi "IOC tính". Nạp SAU ctm-eform.js và các file ctm-dang/hdnd/mttq (ghi đè đơn vị trùng mã). */

const efL = (ef, c) => EFK[ef].F[c].l;
const efSai = (a, b, tol) => a != null && b != null && Math.abs(a - b) > (tol == null ? 0.5 : tol);
const efTyleSai = (tl, tu, mau) => efNum(tl) != null && efNum(tu) != null && efNum(mau) ? Math.abs(tl - tu / mau * 100) > 0.1 : false;
const efSauHan = (a, b) => efNgay(a) != null && efNgay(b) != null && efNgay(a) > efNgay(b);
const efCong = (R, cs) => cs.reduce((s, c) => s + (efNum(R[c]) || 0), 0);

/* ============================== TRỤC ĐẢNG ỦY ============================== */
const EF_DANG1 = {
  ef: 'dang1', ten: 'Kiểm tra giám sát tổng hợp', banGhi: 'một chỉ tiêu (hoặc một đoàn kiểm tra, giám sát) của một đơn vị, ở một cấp thực hiện, một địa bàn, trong một kỳ',
  khoa: ['nhom_du_lieu', 'ten_chi_tieu', 'cap_thuc_hien', 'dia_ban', 'ten_don_vi', 'lop_du_lieu'], cap: ['nhom_du_lieu', 'ten_chi_tieu', 'cap_thuc_hien'],
  chi: {
    th: { l: efL('dang1', 'gia_tri_thuc_hien'), loai: 'cong', c: 'gia_tri_thuc_hien' },
    ms: { l: efL('dang1', 'mau_so_ke_hoach'), loai: 'cong', c: 'mau_so_ke_hoach' },
    tl: { l: 'Tỷ lệ hoàn thành (IOC tính)', loai: 'tyle', tu: 'th', mau: 'ms' },
    tlN: { l: 'Tỷ lệ hoàn thành (%) đã nhập', loai: 'nhap', c: 'ty_le_hoan_thanh_phan_tram', u: '%' },
    cb: { l: efL('dang1', 'so_don_vi_cong_bo_trien_khai_qd'), loai: 'cong', c: 'so_don_vi_cong_bo_trien_khai_qd' },
    bc: { l: efL('dang1', 'so_don_vi_da_bao_cao'), loai: 'cong', c: 'so_don_vi_da_bao_cao' },
    kt: { l: efL('dang1', 'so_don_vi_duoc_kiem_tra_da_lam_viec'), loai: 'cong', c: 'so_don_vi_duoc_kiem_tra_da_lam_viec' },
    kk: { l: efL('dang1', 'so_kho_khan_kien_nghi'), loai: 'cong', c: 'so_kho_khan_kien_nghi' },
    doan: { l: 'Bản ghi Đoàn KTGS', loai: 'dembang', c: 'nhom_du_lieu', v: ['doan_ktgs'] },
    dtk: { l: 'Bản ghi đã triển khai/đạt', loai: 'dembang', c: 'trang_thai_trien_khai', v: ['da_trien_khai_dat'] },
    bg: { l: 'Số bản ghi', loai: 'dem' }
  },
  cot: ['th', 'ms', 'tl', 'tlN', 'cb', 'bc', 'kt', 'kk'], the: ['th', 'ms', 'tl', 'bg'],
  bieu: [{ loai: 'cot', t: 'Giá trị thực hiện theo cấp thực hiện', theo: 'cap_thuc_hien', m: 'th' }, { loai: 'chong', t: 'Bản ghi theo trạng thái triển khai', theo: 'trang_thai_trien_khai', m: 'bg' },
    { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'bg' }, { loai: 'cot', t: 'Bản ghi theo cờ dữ liệu', theo: 'co_du_lieu', m: 'bg' },
    { loai: 'xu', t: 'Giá trị thực hiện qua các kỳ', m: 'th' }],
  diaBan: 'dia_ban', cotDb: ['th', 'ms', 'tl', 'bg'],
  kt: [{ l: '«Tỷ lệ hoàn thành (%)» lệch «Giá trị thực hiện» ÷ «Mẫu số/Kế hoạch» × 100', c: ['ty_le_hoan_thanh_phan_tram'], f: (R) => efTyleSai(R.ty_le_hoan_thanh_phan_tram, R.gia_tri_thuc_hien, R.mau_so_ke_hoach) },
    { l: '«Cờ dữ liệu» khác OK', c: ['co_du_lieu'], f: (R) => R.co_du_lieu != null && R.co_du_lieu !== 'ok' }]
};
const EF_DANG2_MUC = ['so_hoan_thanh_xuat_sac_nhiem_vu', 'so_hoan_thanh_tot_nhiem_vu', 'so_hoan_thanh_nhiem_vu', 'so_khong_hoan_thanh_nhiem_vu', 'so_khong_danh_gia_xep_loai'];
const EF_DANG2 = {
  ef: 'dang2', ten: 'Đánh giá cán bộ', banGhi: 'kết quả đánh giá, xếp loại cán bộ của một «Đơn vị» trong một kỳ', khoa: ['don_vi'], cap: ['don_vi'],
  chi: {
    tong: { l: efL('dang2', 'tong_so_can_bo_duoc_danh_gia'), loai: 'cong', c: 'tong_so_can_bo_duoc_danh_gia' },
    xs: { l: efL('dang2', 'so_hoan_thanh_xuat_sac_nhiem_vu'), loai: 'cong', c: 'so_hoan_thanh_xuat_sac_nhiem_vu' },
    tot: { l: efL('dang2', 'so_hoan_thanh_tot_nhiem_vu'), loai: 'cong', c: 'so_hoan_thanh_tot_nhiem_vu' },
    ht: { l: efL('dang2', 'so_hoan_thanh_nhiem_vu'), loai: 'cong', c: 'so_hoan_thanh_nhiem_vu' },
    kht: { l: efL('dang2', 'so_khong_hoan_thanh_nhiem_vu'), loai: 'cong', c: 'so_khong_hoan_thanh_nhiem_vu' },
    kdg: { l: efL('dang2', 'so_khong_danh_gia_xep_loai'), loai: 'cong', c: 'so_khong_danh_gia_xep_loai' },
    c5: { l: 'Cộng 5 mức (IOC tính)', loai: 'cong', c: EF_DANG2_MUC },
    tlXs: { l: 'Tỷ lệ hoàn thành xuất sắc (IOC tính)', loai: 'tyle', tu: 'xs', mau: 'tong' },
    tlKht: { l: 'Tỷ lệ không hoàn thành (IOC tính)', loai: 'tyle', tu: 'kht', mau: 'tong' }
  },
  cot: ['tong', 'xs', 'tot', 'ht', 'kht', 'kdg', 'c5'], the: ['tong', 'xs', 'tlXs', 'kht'],
  bieu: [{ loai: 'phan', t: 'Cơ cấu 5 mức đánh giá', ms: ['xs', 'tot', 'ht', 'kht', 'kdg'] }, { loai: 'cot', t: 'Tổng số cán bộ được đánh giá theo đơn vị', theo: 'don_vi', m: 'tong' }],
  kt: [{ l: '«Tổng số cán bộ được đánh giá» khác cộng 5 mức', c: ['tong_so_can_bo_duoc_danh_gia'], f: (R) => efSai(efNum(R.tong_so_can_bo_duoc_danh_gia), efCong(R, EF_DANG2_MUC)) }]
};
const EF_DANG3 = {
  ef: 'dang3', ten: 'Công tác chính trị nội bộ', banGhi: 'một việc (hồ sơ) chính trị nội bộ đối với một người hoặc đối tượng',
  khoa: ['so_van_ban_quyet_dinh', 'ho_va_ten_doi_tuong', 'loai_cong_tac'], cap: ['loai_cong_tac', 'trang_thai_xu_ly_thuc_hien'],
  chi: {
    viec: { l: 'Số việc', loai: 'dem' },
    xong: { l: 'Hoàn thành', loai: 'dembang', c: 'trang_thai_xu_ly_thuc_hien', v: ['hoan_thanh'] },
    dang: { l: 'Đang xử lý/Đang xác minh', loai: 'dembang', c: 'trang_thai_xu_ly_thuc_hien', v: ['dang_xu_ly_dang_xac_minh'] },
    dung: { l: 'Tạm dừng, từ chối', loai: 'dembang', c: 'trang_thai_xu_ly_thuc_hien', v: ['tam_dung', 'tu_choi_khong_du_dieu_kien'] },
    tl: { l: 'Tỷ lệ hoàn thành (IOC tính)', loai: 'tyle', tu: 'xong', mau: 'viec' },
    dv: { l: 'Số đơn vị có việc', loai: 'demkhac', c: 'don_vi' }
  },
  cot: ['viec', 'xong', 'dang', 'dung', 'tl'], the: ['viec', 'xong', 'dang', 'tl'],
  bieu: [{ loai: 'chong', t: 'Việc theo trạng thái xử lý', theo: 'trang_thai_xu_ly_thuc_hien', m: 'viec' }, { loai: 'cot', t: 'Việc theo đơn vị', theo: 'don_vi', m: 'viec' }, { loai: 'xu', t: 'Số việc qua các kỳ', m: 'viec' }],
  kt: [{ l: '«Thời gian kết thúc» trước «Thời gian bắt đầu»', c: ['thoi_gian_ket_thuc'], f: (R) => efSauHan(R.thoi_gian_bat_dau, R.thoi_gian_ket_thuc) },
    { l: 'Hoàn thành mà thiếu «Thời gian kết thúc»', c: ['thoi_gian_ket_thuc'], f: (R) => R.trang_thai_xu_ly_thuc_hien === 'hoan_thanh' && !R.thoi_gian_ket_thuc }]
};
const EF_DANG4 = {
  ef: 'dang4', ten: 'Cơ cấu tổ chức Đảng', banGhi: 'một tổ chức đảng tại thời điểm cuối kỳ', khoa: ['ten_to_chuc_dang'], cap: ['loai_hinh', 'cap_quan_ly_truc_tiep'],
  chi: {
    tc: { l: 'Số tổ chức đảng', loai: 'demkhac', c: 'ten_to_chuc_dang' },
    dv: { l: efL('dang4', 'so_dang_vien_truc_thuoc'), loai: 'td', c: 'so_dang_vien_truc_thuoc' },
    cb: { l: efL('dang4', 'so_chi_bo_truc_thuoc'), loai: 'td', c: 'so_chi_bo_truc_thuoc' }
  },
  cot: ['tc', 'dv', 'cb'], the: ['tc', 'dv', 'cb'],
  bieu: [{ loai: 'chong', t: 'Tổ chức đảng theo loại hình', theo: 'loai_hinh', m: 'tc' }, { loai: 'cot', t: 'Đảng viên trực thuộc theo cấp quản lý', theo: 'cap_quan_ly_truc_tiep', m: 'dv' }, { loai: 'xu', t: 'Đảng viên trực thuộc qua các kỳ', m: 'dv' }],
  kt: [{ l: 'Trùng «Tên tổ chức Đảng» trong cùng kỳ', c: ['ten_to_chuc_dang'], f: (R, all) => all.some((x) => x !== R && x._kyId === R._kyId && x.ten_to_chuc_dang === R.ten_to_chuc_dang) }]
};
const EF_DANG5 = {
  ef: 'dang5', ten: 'Biến động Đảng viên', banGhi: 'số liệu đảng viên của một «Địa bàn» trong một kỳ', khoa: ['dia_ban'], cap: ['dia_ban'], xaTruong: 'dia_ban', xaChi: ['cuoi', 'kn', 'tlkn', 'di'],
  chi: {
    dau: { l: efL('dang5', 'tong_dang_vien_hien_co_dau_ky'), loai: 'dau', c: 'tong_dang_vien_hien_co_dau_ky' },
    kn: { l: efL('dang5', 'so_ket_nap_moi_trong_ky'), loai: 'cong', c: 'so_ket_nap_moi_trong_ky' },
    den: { l: efL('dang5', 'so_chuyen_den'), loai: 'cong', c: 'so_chuyen_den' },
    di: { l: efL('dang5', 'so_chuyen_di'), loai: 'cong', c: 'so_chuyen_di' },
    xoa: { l: efL('dang5', 'so_bi_xoa_ten_cho_ra_khoi_dang'), loai: 'cong', c: 'so_bi_xoa_ten_cho_ra_khoi_dang' },
    tt: { l: efL('dang5', 'so_tu_tran'), loai: 'cong', c: 'so_tu_tran' },
    cuoi: { l: efL('dang5', 'tong_dang_vien_hien_co_cuoi_ky'), loai: 'td', c: 'tong_dang_vien_hien_co_cuoi_ky' },
    ct: { l: efL('dang5', 'chi_tieu_ket_nap_duoc_giao'), loai: 'cong', c: 'chi_tieu_ket_nap_duoc_giao' },
    tlkn: { l: 'Kết nạp so chỉ tiêu được giao (IOC tính)', loai: 'tyle', tu: 'kn', mau: 'ct' }
  },
  cot: ['dau', 'kn', 'den', 'di', 'xoa', 'tt', 'cuoi', 'tlkn'], the: ['cuoi', 'kn', 'tlkn', 'di'],
  bieu: [{ loai: 'ds', t: 'Các khoản tăng, giảm trong kỳ', ms: ['kn', 'den', 'di', 'xoa', 'tt'] }, { loai: 'xu', t: 'Kết nạp mới qua các kỳ', m: 'kn' }],
  kt: [{ l: 'Đầu kỳ + kết nạp + chuyển đến − chuyển đi − xóa tên − từ trần khác cuối kỳ', c: ['tong_dang_vien_hien_co_cuoi_ky'],
    f: (R) => efSai(efNum(R.tong_dang_vien_hien_co_cuoi_ky), efCong(R, ['tong_dang_vien_hien_co_dau_ky', 'so_ket_nap_moi_trong_ky', 'so_chuyen_den']) - efCong(R, ['so_chuyen_di', 'so_bi_xoa_ten_cho_ra_khoi_dang', 'so_tu_tran'])) }]
};
const EF_DANG6 = {
  ef: 'dang6', ten: 'Biên chế & CBCCVC khối Đảng', banGhi: 'số biên chế, cán bộ của một «Đơn vị» khối Đảng, MTTQ tại thời điểm cuối kỳ', khoa: ['don_vi'], cap: ['don_vi'],
  chi: {
    cbccvc: { l: efL('dang6', 'so_cbccvc_khoi_dang_mttq'), loai: 'td', c: 'so_cbccvc_khoi_dang_mttq' },
    tccs: { l: efL('dang6', 'so_to_chuc_co_so_dang_truc_thuoc'), loai: 'td', c: 'so_to_chuc_co_so_dang_truc_thuoc' },
    giao: { l: efL('dang6', 'bien_che_duoc_giao'), loai: 'td', c: 'bien_che_duoc_giao' },
    co: { l: efL('dang6', 'bien_che_hien_co'), loai: 'td', c: 'bien_che_hien_co' },
    thieu: { l: 'Biên chế còn thiếu (IOC tính)', loai: 'hieu', a: 'giao', b: 'co' },
    tlbc: { l: 'Biên chế hiện có so được giao (IOC tính)', loai: 'tyle', tu: 'co', mau: 'giao' }
  },
  cot: ['cbccvc', 'tccs', 'giao', 'co', 'thieu', 'tlbc'], the: ['cbccvc', 'giao', 'co', 'thieu'],
  bieu: [{ loai: 'cot', t: 'Biên chế được giao theo đơn vị', theo: 'don_vi', m: 'giao' }, { loai: 'cot', t: 'Biên chế hiện có theo đơn vị', theo: 'don_vi', m: 'co' }],
  kt: [{ l: '«Biên chế hiện có» lớn hơn «Biên chế được giao»', c: ['bien_che_hien_co'], f: (R) => efNum(R.bien_che_hien_co) != null && efNum(R.bien_che_duoc_giao) != null && R.bien_che_hien_co > R.bien_che_duoc_giao }]
};
const EF_DANG7 = {
  ef: 'dang7', ten: 'Tuyên giáo và Dân vận', banGhi: 'một chỉ tiêu (tên do đơn vị gõ) của một đơn vị cung cấp, một địa bàn, một nhóm phân loại, trong một kỳ',
  khoa: ['ten_chi_tieu', 'dia_ban', 'don_vi_cung_cap', 'nhom_phan_loai', 'chi_tiet_phan_loai'], khoaRong: ['chi_tiet_phan_loai'], cap: ['nhom_phan_loai', 'ten_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  chi: {
    gt: { l: efL('dang7', 'gia_tri'), loai: 'cong', c: 'gia_tri', dvt: true },
    bg: { l: 'Số bản ghi', loai: 'dem' },
    tin: { l: 'Giá trị · đơn vị tính Tin/bài', kl: 'Tin/bài', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['tin_bai'] }, u: 'tin/bài' },
    db: { l: 'Giá trị · đơn vị tính Đại biểu', kl: 'Đại biểu', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['dai_bieu'] }, u: 'đại biểu' },
    dk: { l: 'Giá trị · đơn vị tính Lượt đăng ký', kl: 'Lượt đăng ký', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['luot_dang_ky'] }, u: 'lượt' },
    ds: { l: 'Đã đối soát', loai: 'dembang', c: 'trang_thai_doi_soat', v: ['da_doi_soat'] },
    cbs: { l: 'Cần bổ sung, chưa đối soát', loai: 'dembang', c: 'trang_thai_doi_soat', v: ['can_bo_sung', 'chua_doi_soat'] }
  },
  cot: ['gt', 'bg', 'ds', 'cbs'], the: ['bg', 'tin', 'db', 'dk'],
  bieu: [{ loai: 'cot', t: 'Bản ghi theo nhóm phân loại', theo: 'nhom_phan_loai', m: 'bg' }, { loai: 'cot', t: 'Bản ghi theo cấp báo cáo', theo: 'cap_bao_cao', m: 'bg' },
    { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'bg' }, { loai: 'xu', t: 'Số bản ghi qua các kỳ', m: 'bg' }],
  diaBan: 'dia_ban', cotDb: ['bg', 'ds', 'cbs'],
  kt: [{ l: '«Trạng thái đối soát» là Cần bổ sung hoặc Chưa đối soát', c: ['trang_thai_doi_soat'], f: (R) => R.trang_thai_doi_soat === 'can_bo_sung' || R.trang_thai_doi_soat === 'chua_doi_soat' }]
};
const EF_DANG8 = {
  ef: 'dang8', ten: 'Nội chính', banGhi: 'một chỉ tiêu (tên do đơn vị gõ) của một địa bàn, một nhóm phân loại, trong một kỳ',
  khoa: ['ten_chi_tieu', 'dia_ban', 'don_vi_cung_cap', 'nhom_phan_loai'], cap: ['nhom_phan_loai', 'ten_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  chi: {
    gt: { l: efL('dang8', 'gia_tri'), loai: 'cong', c: 'gia_tri', dvt: true },
    bg: { l: 'Số bản ghi', loai: 'dem' },
    ln: { l: 'Giá trị · đơn vị tính Lượt người', kl: 'Lượt người', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['luot_nguoi'] }, u: 'lượt người' },
    cuoc: { l: 'Giá trị · đơn vị tính Cuộc', kl: 'Cuộc', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['cuoc'] }, u: 'cuộc' },
    vb: { l: 'Giá trị · đơn vị tính Văn bản', kl: 'Văn bản', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['van_ban'] }, u: 'văn bản' },
    vv: { l: 'Giá trị · đơn vị tính Vụ việc', kl: 'Vụ việc', loai: 'cong', c: 'gia_tri', loc: { don_vi_tinh: ['vu_viec'] }, u: 'vụ việc' },
    cds: { l: 'Chưa đối soát xong', loai: 'demdk', mt: '«Trạng thái đối soát» khác Đã đối soát', f: (R) => R.trang_thai_doi_soat !== 'da_doi_soat' }
  },
  cot: ['gt', 'bg', 'cds'], the: ['ln', 'cuoc', 'vb', 'vv'],
  bieu: [{ loai: 'cot', t: 'Bản ghi theo nhóm phân loại', theo: 'nhom_phan_loai', m: 'bg' }, { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'bg' }, { loai: 'xu', t: 'Lượt người qua các kỳ', m: 'ln' }],
  diaBan: 'dia_ban', cotDb: ['bg', 'ln', 'vv'],
  kt: [{ l: '«Trạng thái đối soát» khác Đã đối soát', c: ['trang_thai_doi_soat'], f: (R) => R.trang_thai_doi_soat !== 'da_doi_soat' }]
};

ctmEformDonVi({ id: 'dang-ubkt', role: 'DANG', name: 'Ủy ban Kiểm tra Thành ủy', short: 'Ủy ban Kiểm tra', org: 'Thành ủy Hà Nội', eforms: [EF_DANG1],
  kpis: [{ ef: 'dang1', m: 'th' }, { ef: 'dang1', m: 'ms' }, { ef: 'dang1', m: 'tl' }, { ef: 'dang1', m: 'doan' }, { ef: 'dang1', m: 'bc' }, { ef: 'dang1', m: 'kk' }] });
ctmEformDonVi({ id: 'dang-to-chuc', role: 'DANG', name: 'Ban Tổ chức Thành ủy', short: 'Ban Tổ chức', org: 'Thành ủy Hà Nội', eforms: [EF_DANG2, EF_DANG3, EF_DANG4, EF_DANG5, EF_DANG6],
  kpis: [{ ef: 'dang5', m: 'cuoi' }, { ef: 'dang5', m: 'kn' }, { ef: 'dang4', m: 'tc' }, { ef: 'dang6', m: 'cbccvc' }, { ef: 'dang6', m: 'thieu' }, { ef: 'dang3', m: 'viec' }, { ef: 'dang2', m: 'tong' }, { ef: 'dang2', m: 'tlXs' }] });
ctmEformDonVi({ id: 'dang-tuyen-giao', role: 'DANG', name: 'Ban Tuyên giáo và Dân vận Thành ủy', short: 'Ban Tuyên giáo và Dân vận', org: 'Thành ủy Hà Nội', eforms: [EF_DANG7],
  kpis: [{ ef: 'dang7', m: 'bg' }, { ef: 'dang7', m: 'tin' }, { ef: 'dang7', m: 'db' }, { ef: 'dang7', m: 'dk' }, { ef: 'dang7', m: 'cbs' }] });
ctmEformDonVi({ id: 'dang-noi-chinh', role: 'DANG', name: 'Ban Nội chính Thành ủy', short: 'Ban Nội chính', org: 'Thành ủy Hà Nội', eforms: [EF_DANG8],
  kpis: [{ ef: 'dang8', m: 'ln' }, { ef: 'dang8', m: 'cuoc' }, { ef: 'dang8', m: 'vb' }, { ef: 'dang8', m: 'vv' }, { ef: 'dang8', m: 'cds' }] });

/* ============================== TRỤC HĐND ============================== */
const EF_HDND1 = {
  ef: 'hdnd1', ten: 'Tiếp xúc cử tri, kiến nghị cử tri', banGhi: 'một kiến nghị của cử tri, ghi kèm thông tin cuộc tiếp xúc cử tri nơi kiến nghị được nêu',
  khoa: ['ten_cuoc_txct', 'so_hieu_kien_nghi'], cap: ['linh_vuc_kien_nghi'],
  chi: {
    kn: { l: 'Số kiến nghị', loai: 'dem' },
    cuoc: { l: 'Số cuộc tiếp xúc cử tri', loai: 'demkhac', c: 'ten_cuoc_txct' },
    lc: { l: efL('hdnd1', 'so_luot_cu_tri_tham_gia'), loai: 'motlan', c: 'so_luot_cu_tri_tham_gia', theo: ['ten_cuoc_txct'] },
    cxl: { l: 'Đã chuyển xử lý', loai: 'dembang', c: 'da_chuyen_xu_ly', v: ['da_xu_ly'] },
    tl: { l: 'Đã trả lời', loai: 'dembang', c: 'da_tra_loi', v: ['da_tl'] },
    gq: { l: 'Đã giải quyết dứt điểm', loai: 'dembang', c: 'da_giai_quyet_dut_diem', v: ['da_gq'] },
    tlgq: { l: 'Tỷ lệ đã giải quyết dứt điểm (IOC tính)', loai: 'tyle', tu: 'gq', mau: 'kn' }
  },
  cot: ['kn', 'cxl', 'tl', 'gq', 'tlgq'], the: ['kn', 'cuoc', 'gq', 'tlgq'],
  bang: [{ t: 'Theo cuộc tiếp xúc cử tri', cap: ['ten_cuoc_txct'], cot: ['kn', 'lc', 'tl', 'gq'] }],
  bieu: [{ loai: 'ds', t: 'Các bước xử lý kiến nghị', ms: ['kn', 'cxl', 'tl', 'gq'] }, { loai: 'chong', t: 'Kiến nghị theo lĩnh vực', theo: 'linh_vuc_kien_nghi', m: 'kn' },
    { loai: 'xu', t: 'Số kiến nghị qua các kỳ', m: 'kn' }, { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'kn' }],
  kt: [{ l: 'Cùng cuộc tiếp xúc cử tri mà «Số lượt cử tri tham gia» khác nhau', c: ['so_luot_cu_tri_tham_gia'], f: (R, all) => all.some((x) => x.ten_cuoc_txct === R.ten_cuoc_txct && x.so_luot_cu_tri_tham_gia !== R.so_luot_cu_tri_tham_gia) },
    { l: 'Đã trả lời mà thiếu «Ngày cơ quan trả lời»', c: ['ngay_co_quan_tra_loi'], f: (R) => R.da_tra_loi === 'da_tl' && !R.ngay_co_quan_tra_loi },
    { l: 'Đã giải quyết dứt điểm mà thiếu «Ngày giải quyết dứt điểm»', c: ['ngay_giai_quyet_dut_diem'], f: (R) => R.da_giai_quyet_dut_diem === 'da_gq' && !R.ngay_giai_quyet_dut_diem },
    { l: 'Các ngày không theo thứ tự ghi nhận → chuyển → trả lời → giải quyết', c: ['ngay_chuyen_co_quan_xu_ly', 'ngay_co_quan_tra_loi', 'ngay_giai_quyet_dut_diem'],
      f: (R) => efSauHan(R.ngay_ghi_nhan_kien_nghi, R.ngay_chuyen_co_quan_xu_ly) || efSauHan(R.ngay_chuyen_co_quan_xu_ly, R.ngay_co_quan_tra_loi) || efSauHan(R.ngay_co_quan_tra_loi, R.ngay_giai_quyet_dut_diem) }]
};
const EF_HDND2 = {
  ef: 'hdnd2', ten: 'Theo dõi nhiệm vụ HĐND', banGhi: 'một nhiệm vụ được giao cho một đơn vị thực hiện', khoa: ['van_ban_giao', 'don_vi_thuc_hien'], cap: ['khoi', 'don_vi'],
  chi: {
    nv: { l: 'Số nhiệm vụ', loai: 'dem' },
    ht: { l: 'Hoàn thành', loai: 'dembang', c: 'tinh_trang_thuc_hien', v: ['hoan_thanh'] },
    dth: { l: 'Đang thực hiện', loai: 'dembang', c: 'tinh_trang_thuc_hien', v: ['dang_thuc_hien'] },
    cth: { l: 'Chưa thực hiện', loai: 'dembang', c: 'tinh_trang_thuc_hien', v: ['chua_thuc_hien'] },
    qh: { l: 'Quá hạn', loai: 'dembang', c: 'tinh_trang_thuc_hien', v: ['qua_han'] },
    nhan: { l: 'Đã nhận', loai: 'dembang', c: 'tinh_trang_nhan_nhiem_vu', v: ['da_nhan'] },
    cnhan: { l: 'Chưa nhận', loai: 'dembang', c: 'tinh_trang_nhan_nhiem_vu', v: ['chua_nhan'] },
    tlht: { l: 'Tỷ lệ hoàn thành (IOC tính)', loai: 'tyle', tu: 'ht', mau: 'nv' },
    cham: { l: 'Tổng ' + efL('hdnd2', 'so_ngay_cham_tien_do').toLowerCase(), loai: 'cong', c: 'so_ngay_cham_tien_do' }
  },
  cot: ['nv', 'nhan', 'ht', 'dth', 'cth', 'qh', 'tlht'], the: ['nv', 'ht', 'qh', 'tlht'],
  bieu: [{ loai: 'chong', t: 'Nhiệm vụ theo tình trạng thực hiện', theo: 'tinh_trang_thuc_hien', m: 'nv' }, { loai: 'cot', t: 'Nhiệm vụ theo tình trạng nhận', theo: 'tinh_trang_nhan_nhiem_vu', m: 'nv' },
    { loai: 'cot', t: 'Nhiệm vụ theo đơn vị', theo: 'don_vi', m: 'nv' }, { loai: 'xu', t: 'Số nhiệm vụ qua các kỳ', m: 'nv' }],
  kt: [{ l: 'Hoàn thành mà thiếu «Ngày hoàn thành thực tế»', c: ['ngay_hoan_thanh_thuc_te'], f: (R) => R.tinh_trang_thuc_hien === 'hoan_thanh' && !R.ngay_hoan_thanh_thuc_te },
    { l: '«Số ngày chậm tiến độ» lớn hơn 0 mà tình trạng không phải Quá hạn', c: ['so_ngay_cham_tien_do'], f: (R) => efNum(R.so_ngay_cham_tien_do) > 0 && R.tinh_trang_thuc_hien !== 'qua_han' }]
};
const EF_HDND3 = {
  ef: 'hdnd3', ten: 'Giám sát, chất vấn, giải trình', banGhi: 'một kiến nghị phát sinh từ một hoạt động giám sát, chất vấn, giải trình (thông tin hoạt động ghi kèm)',
  khoa: ['loai_hoat_dong', 'ten_chu_de_hoat_dong', 'so_hieu_kien_nghi'], cap: ['loai_hoat_dong', 'ten_chu_de_hoat_dong'],
  chi: {
    hd: { l: 'Số hoạt động', loai: 'demkhac', c: 'ten_chu_de_hoat_dong' },
    kn: { l: 'Số kiến nghị (bản ghi)', loai: 'dem' },
    knN: { l: efL('hdnd3', 'so_kien_nghi_sau_giam_sat') + ' (đã nhập)', loai: 'motlan', c: 'so_kien_nghi_sau_giam_sat', theo: ['loai_hoat_dong', 'ten_chu_de_hoat_dong'] },
    xong: { l: 'Đã hoàn thành', loai: 'dembang', c: 'trang_thai_xu_ly', v: ['da_hoan_thanh'] },
    dang: { l: 'Đang xử lý', loai: 'dembang', c: 'trang_thai_xu_ly', v: ['dang_xu_ly'] },
    qh: { l: 'Quá hạn', loai: 'dembang', c: 'trang_thai_xu_ly', v: ['qua_han'] },
    tl: { l: 'Tỷ lệ kiến nghị đã hoàn thành (IOC tính)', loai: 'tyle', tu: 'xong', mau: 'kn' },
    nl: { l: 'Kiến nghị nêu từ 2 kỳ trở lên', loai: 'demdk', mt: '«' + efL('hdnd3', 'so_ky_giam_sat_chat_van_da_neu') + '» từ 2 trở lên', f: (R) => efNum(R.so_ky_giam_sat_chat_van_da_neu) >= 2 }
  },
  cot: ['hd', 'kn', 'knN', 'xong', 'dang', 'qh', 'tl'], the: ['hd', 'kn', 'xong', 'tl'],
  bieu: [{ loai: 'chong', t: 'Kiến nghị theo trạng thái xử lý', theo: 'trang_thai_xu_ly', m: 'kn' }, { loai: 'cot', t: 'Hoạt động theo loại', theo: 'loai_hoat_dong', m: 'hd' }, { loai: 'xu', t: 'Số kiến nghị qua các kỳ', m: 'kn' }],
  kt: [{ l: '«Ngày hoàn thành xử lý» sau «Hạn xử lý theo quy định» mà trạng thái không phải Quá hạn', c: ['ngay_hoan_thanh_xu_ly'], f: (R) => efSauHan(R.ngay_hoan_thanh_xu_ly, R.han_xu_ly_theo_quy_dinh) && R.trang_thai_xu_ly !== 'qua_han' },
    { l: 'Đã hoàn thành mà thiếu «Ngày hoàn thành xử lý»', c: ['ngay_hoan_thanh_xu_ly'], f: (R) => R.trang_thai_xu_ly === 'da_hoan_thanh' && !R.ngay_hoan_thanh_xu_ly }]
};
const EF_HDND4 = {
  ef: 'hdnd4', ten: 'Hoạt động Thường trực, Ban, Tổ đại biểu', banGhi: 'một hoạt động của Thường trực, các Ban hoặc Tổ đại biểu HĐND, có thể kèm một kiến nghị',
  khoa: ['loai_hoat_dong', 'ten_chu_de_hoat_dong', 'don_vi_thuc_hien', 'ngay_to_chuc_ban_hanh'], cap: ['loai_hoat_dong', 'don_vi_thuc_hien'],
  chi: {
    hd: { l: 'Số hoạt động', loai: 'dem' },
    kn: { l: 'Số kiến nghị', loai: 'demdk', mt: '«' + efL('hdnd4', 'so_hieu_kien_nghi') + '»', f: (R) => R.so_hieu_kien_nghi != null && R.so_hieu_kien_nghi !== '' },
    tt: { l: 'Đã tiếp thu', loai: 'dembang', c: 'trang_thai_tiep_thu', v: ['da_tiep_thu'] },
    ctt: { l: 'Chưa tiếp thu', loai: 'dembang', c: 'trang_thai_tiep_thu', v: ['chua_tiep_thu'] },
    dxl: { l: 'Đang xử lý', loai: 'dembang', c: 'trang_thai_tiep_thu', v: ['dang_xu_ly'] }
  },
  cot: ['hd', 'kn', 'tt', 'ctt', 'dxl'], the: ['hd', 'kn', 'tt', 'ctt'],
  bieu: [{ loai: 'cot', t: 'Hoạt động theo đơn vị thực hiện', theo: 'don_vi_thuc_hien', m: 'hd' }, { loai: 'chong', t: 'Bản ghi theo trạng thái tiếp thu', theo: 'trang_thai_tiep_thu', m: 'hd' }, { loai: 'xu', t: 'Số hoạt động qua các kỳ', m: 'hd' }]
};
const EF_HDND5 = {
  ef: 'hdnd5', ten: 'Kỳ họp và Nghị quyết', banGhi: 'một nghị quyết được thông qua tại một kỳ họp (thông tin kỳ họp ghi kèm)', khoa: ['so_hieu_nghi_quyet'], cap: ['loai_ky_hop', 'ten_so_hieu_ky_hop'],
  chi: {
    kh: { l: 'Số kỳ họp', loai: 'demkhac', c: 'ten_so_hieu_ky_hop' },
    nq: { l: 'Số nghị quyết', loai: 'dem' },
    dh: { l: 'Ban hành đúng hạn (IOC tính)', loai: 'demdk', mt: '«Ngày ban hành chính thức» không sau «Hạn ban hành theo quy định»', f: (R) => efNgay(R.ngay_ban_hanh_chinh_thuc) != null && efNgay(R.han_ban_hanh_theo_quy_dinh) != null && !efSauHan(R.ngay_ban_hanh_chinh_thuc, R.han_ban_hanh_theo_quy_dinh) },
    qh: { l: 'Ban hành quá hạn (IOC tính)', loai: 'demdk', mt: '«Ngày ban hành chính thức» sau «Hạn ban hành theo quy định»', f: (R) => efSauHan(R.ngay_ban_hanh_chinh_thuc, R.han_ban_hanh_theo_quy_dinh) },
    tldh: { l: 'Tỷ lệ ban hành đúng hạn (IOC tính)', loai: 'tyle', tu: 'dh', mau: 'nq' }
  },
  cot: ['kh', 'nq', 'dh', 'qh', 'tldh'], the: ['kh', 'nq', 'dh', 'tldh'],
  bieu: [{ loai: 'cot', t: 'Nghị quyết theo lĩnh vực', theo: 'linh_vuc_nghi_quyet', m: 'nq' }, { loai: 'cot', t: 'Nghị quyết theo kỳ họp', theo: 'ten_so_hieu_ky_hop', m: 'nq' }, { loai: 'xu', t: 'Số nghị quyết qua các kỳ', m: 'nq' }],
  kt: [{ l: '«Ngày ban hành chính thức» trước «Ngày HĐND thông qua»', c: ['ngay_ban_hanh_chinh_thuc'], f: (R) => efSauHan(R.ngay_hdnd_thong_qua, R.ngay_ban_hanh_chinh_thuc) },
    { l: '«Ngày HĐND thông qua» ngoài khoảng khai mạc – bế mạc kỳ họp', c: ['ngay_hdnd_thong_qua'], f: (R) => efSauHan(R.ngay_khai_mac_ky_hop, R.ngay_hdnd_thong_qua) || efSauHan(R.ngay_hdnd_thong_qua, R.ngay_be_mac_ky_hop) }]
};
const EF_HDND6 = {
  ef: 'hdnd6', ten: 'Chỉ số tổng hợp, kế hoạch hoạt động', banGhi: 'một bản ghi điền một hoặc nhiều trong 4 phần: tiêu chí hiệu quả; đợt khảo sát hài lòng; một kiến nghị; kế hoạch năm — mỗi phần tổng hợp riêng',
  khoa: ['don_vi_hdnd_doan_dbqh', 'ten_tieu_chi_hieu_qua_dai_dien_dan_cu', 'dot_khao_sat_hai_long_cu_tri', 'noi_dung_kien_nghi', 'ke_hoach_nam_cua_hdnd'],
  khoaRong: ['ten_tieu_chi_hieu_qua_dai_dien_dan_cu', 'dot_khao_sat_hai_long_cu_tri', 'noi_dung_kien_nghi', 'ke_hoach_nam_cua_hdnd'], cap: ['don_vi_hdnd_doan_dbqh'],
  chi: {
    bg: { l: 'Số bản ghi', loai: 'dem' },
    tc: { l: 'Số tiêu chí', loai: 'demdk', mt: '«Loại tiêu chí» hoặc «Tên tiêu chí»', f: (R) => !!(R.loai_tieu_chi || R.ten_tieu_chi_hieu_qua_dai_dien_dan_cu) },
    gtc: { l: efL('hdnd6', 'gia_tri_tieu_chi') + ' đã nhập', loai: 'nhap', c: 'gia_tri_tieu_chi', u: '%' },
    cs: { l: efL('hdnd6', 'chi_so_hieu_qua_dai_dien_dan_cu') + ' đã nhập', loai: 'nhap', c: 'chi_so_hieu_qua_dai_dien_dan_cu' },
    dot: { l: 'Số đợt khảo sát', loai: 'demkhac', c: 'dot_khao_sat_hai_long_cu_tri' },
    ph: { l: efL('hdnd6', 'tong_so_phieu_phat_ra'), loai: 'motlan', c: 'tong_so_phieu_phat_ra', theo: ['dot_khao_sat_hai_long_cu_tri', 'ngay_khao_sat'] },
    tv: { l: efL('hdnd6', 'tong_so_phieu_thu_ve'), loai: 'motlan', c: 'tong_so_phieu_thu_ve', theo: ['dot_khao_sat_hai_long_cu_tri', 'ngay_khao_sat'] },
    hl: { l: efL('hdnd6', 'so_phieu_hai_long_rat_hai_long'), loai: 'motlan', c: 'so_phieu_hai_long_rat_hai_long', theo: ['dot_khao_sat_hai_long_cu_tri', 'ngay_khao_sat'] },
    tlhl: { l: 'Tỷ lệ hài lòng (IOC tính)', loai: 'tyle', tu: 'hl', mau: 'tv' },
    kn: { l: 'Số kiến nghị', loai: 'demdk', mt: '«Lĩnh vực kiến nghị» hoặc «Nội dung kiến nghị»', f: (R) => !!(R.linh_vuc_kien_nghi || R.noi_dung_kien_nghi) },
    kngq: { l: 'Kiến nghị đã giải quyết', loai: 'dembang', c: 'trang_thai_kien_nghi', v: ['da_giai_quyet_dung_han', 'da_giai_quyet_qua_han'] },
    knll: { l: 'Kiến nghị lặp lại hằng năm', loai: 'dembang', c: 'kien_nghi_lap_lai_hang_nam', v: ['co'] },
    kh: { l: 'Số kế hoạch năm', loai: 'demdk', mt: '«Kế hoạch năm của HĐND»', f: (R) => !!R.ke_hoach_nam_cua_hdnd },
    khht: { l: 'Kế hoạch năm đã hoàn thành', loai: 'dembang', c: 'trang_thai_ke_hoach_nam', v: ['hoan_thanh_dung_tien_do', 'hoan_thanh_cham_tien_do'] }
  },
  cot: ['bg', 'tc', 'dot', 'kn', 'kh'], the: ['tlhl', 'kn', 'kngq', 'kh'],
  bang: [{ t: 'Tiêu chí hiệu quả theo loại tiêu chí', cap: ['loai_tieu_chi', 'don_vi_hdnd_doan_dbqh'], cot: ['tc', 'gtc', 'cs'] },
    { t: 'Khảo sát hài lòng của cử tri theo đợt', cap: ['dot_khao_sat_hai_long_cu_tri'], cot: ['ph', 'tv', 'hl', 'tlhl'] },
    { t: 'Kiến nghị theo lĩnh vực, trạng thái', cap: ['linh_vuc_kien_nghi', 'trang_thai_kien_nghi'], cot: ['kn', 'knll'] },
    { t: 'Kế hoạch năm theo trạng thái', cap: ['trang_thai_ke_hoach_nam'], cot: ['kh'] }],
  bieu: [{ loai: 'xu', t: 'Tỷ lệ hài lòng qua các kỳ', m: 'tlhl' }, { loai: 'xu', t: 'Số kiến nghị qua các kỳ', m: 'kn' }],
  kt: [{ l: 'Số phiếu hài lòng lớn hơn phiếu thu về, hoặc phiếu thu về lớn hơn phiếu phát ra', c: ['so_phieu_hai_long_rat_hai_long', 'tong_so_phieu_thu_ve'],
    f: (R) => (efNum(R.so_phieu_hai_long_rat_hai_long) != null && efNum(R.tong_so_phieu_thu_ve) != null && R.so_phieu_hai_long_rat_hai_long > R.tong_so_phieu_thu_ve) || (efNum(R.tong_so_phieu_thu_ve) != null && efNum(R.tong_so_phieu_phat_ra) != null && R.tong_so_phieu_thu_ve > R.tong_so_phieu_phat_ra) }]
};
const EF_HDND_DV = [
  ['hdnd-ef1', 'Tiếp xúc cử tri và kiến nghị cử tri', EF_HDND1, ['kn', 'cuoc', 'lc', 'gq', 'tlgq']],
  ['hdnd-ef2', 'Theo dõi nhiệm vụ HĐND', EF_HDND2, ['nv', 'ht', 'qh', 'cnhan', 'tlht']],
  ['hdnd-ef3', 'Giám sát, chất vấn và giải trình', EF_HDND3, ['hd', 'kn', 'xong', 'qh', 'tl', 'nl']],
  ['hdnd-ef4', 'Hoạt động Thường trực, Ban và Tổ đại biểu', EF_HDND4, ['hd', 'kn', 'tt', 'ctt']],
  ['hdnd-ef5', 'Kỳ họp và Nghị quyết', EF_HDND5, ['kh', 'nq', 'dh', 'qh', 'tldh']],
  ['hdnd-ef6', 'Chỉ số tổng hợp và kế hoạch hoạt động', EF_HDND6, ['tc', 'dot', 'tlhl', 'kn', 'knll', 'kh']]
];
EF_HDND_DV.forEach(([id, name, cfg, ks]) => ctmEformDonVi({ id: id, role: 'HDND', name: name, short: name, org: 'HĐND Thành phố Hà Nội', eforms: [cfg], laEform: true, kpis: ks.map((m) => ({ ef: cfg.ef, m: m })) }));

/* ============================== TRỤC MTTQ ============================== */
const EF_MTTQ1 = {
  ef: 'mttq1', ten: 'Theo dõi nhiệm vụ MTTQ', banGhi: 'một nhiệm vụ được giao cho một đơn vị thực hiện', khoa: ['so_van_ban_giao', 'don_vi_thuc_hien', 'ngay_giao'], cap: ['khoi', 'trang_thai_thuc_hien'],
  chi: {
    nv: { l: 'Số nhiệm vụ', loai: 'dem' },
    giao: { l: 'Đã giao', loai: 'dembang', c: 'trang_thai_giao', v: ['da_giao'] },
    nhan: { l: 'Đã nhận', loai: 'dembang', c: 'trang_thai_nhan', v: ['da_nhan'] },
    ht: { l: 'Hoàn thành', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['hoan_thanh'] },
    dth: { l: 'Đang thực hiện', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['dang_thuc_hien'] },
    qh: { l: 'Quá hạn', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['qua_han'] },
    tl: { l: 'Tỷ lệ hoàn thành (IOC tính)', loai: 'tyle', tu: 'ht', mau: 'nv' }
  },
  cot: ['nv', 'giao', 'nhan', 'ht', 'dth', 'qh', 'tl'], the: ['nv', 'ht', 'qh', 'tl'],
  bieu: [{ loai: 'chong', t: 'Nhiệm vụ theo trạng thái thực hiện', theo: 'trang_thai_thuc_hien', m: 'nv' }, { loai: 'cot', t: 'Nhiệm vụ theo khối', theo: 'khoi', m: 'nv' }, { loai: 'xu', t: 'Số nhiệm vụ qua các kỳ', m: 'nv' }],
  kt: [{ l: 'Hoàn thành mà thiếu «Ngày hoàn thành»', c: ['ngay_hoan_thanh'], f: (R) => R.trang_thai_thuc_hien === 'hoan_thanh' && !R.ngay_hoan_thanh },
    { l: '«Ngày hoàn thành» sau «Hạn hoàn thành» mà không ghi Quá hạn', c: ['ngay_hoan_thanh'], f: (R) => efSauHan(R.ngay_hoan_thanh, R.han_hoan_thanh) && R.trang_thai_thuc_hien !== 'qua_han' }]
};
const EF_MTTQ2_DV = ['don_vi_bao_cao', '_kyId'];
const EF_MTTQ2 = {
  ef: 'mttq2', ten: 'Vận động Quỹ "Vì người nghèo"', banGhi: 'số tiền ủng hộ theo một «Hình thức ủng hộ» × «Nguồn ủng hộ» của một «Đơn vị báo cáo» trong kỳ; các trường cấp đơn vị ghi kèm',
  khoa: ['don_vi_bao_cao', 'hinh_thuc_ung_ho', 'nguon_ung_ho'], cap: ['cap_bao_cao', 'don_vi_bao_cao'],
  chi: {
    tien: { l: efL('mttq2', 'so_tien_ung_ho'), loai: 'cong', c: 'so_tien_ung_ho' },
    tc: { l: efL('mttq2', 'so_to_chuc_don_vi_ung_ho'), loai: 'cong', c: 'so_to_chuc_don_vi_ung_ho' },
    cn: { l: efL('mttq2', 'so_ca_nhan_nha_hao_tam_ung_ho'), loai: 'cong', c: 'so_ca_nhan_nha_hao_tam_ung_ho' },
    ct: { l: efL('mttq2', 'chi_tieu_van_dong_duoc_giao'), loai: 'motlan', c: 'chi_tieu_van_dong_duoc_giao', theo: EF_MTTQ2_DV },
    tong: { l: efL('mttq2', 'tong_so_tien_van_dong_duoc') + ' (đã nhập)', loai: 'motlan', c: 'tong_so_tien_van_dong_duoc', theo: EF_MTTQ2_DV },
    tlN: { l: efL('mttq2', 'ty_le_hoan_thanh_chi_tieu') + ' đã nhập', loai: 'nhap', c: 'ty_le_hoan_thanh_chi_tieu', theo: EF_MTTQ2_DV, u: '%' },
    tl: { l: 'Tỷ lệ hoàn thành chỉ tiêu (IOC tính)', loai: 'tyle', tu: 'tong', mau: 'ct' },
    qtp: { l: efL('mttq2', 'so_tien_quy_mttq_tp_ho_tro'), loai: 'motlan', c: 'so_tien_quy_mttq_tp_ho_tro', theo: EF_MTTQ2_DV },
    nha: { l: efL('mttq2', 'so_nha_dai_doan_ket_ho_tro_tu_mttq_tp'), loai: 'motlan', c: 'so_nha_dai_doan_ket_ho_tro_tu_mttq_tp', theo: EF_MTTQ2_DV },
    sk: { l: efL('mttq2', 'so_suat_ho_tro_sinh_ke_tu_mttq_tp'), loai: 'motlan', c: 'so_suat_ho_tro_sinh_ke_tu_mttq_tp', theo: EF_MTTQ2_DV },
    dpchi: { l: efL('mttq2', 'so_tien_quy_dia_phuong_da_chi'), loai: 'motlan', c: 'so_tien_quy_dia_phuong_da_chi', theo: EF_MTTQ2_DV },
    du: { l: efL('mttq2', 'so_du_quy_dia_phuong_cuoi_ky'), loai: 'motlan', c: 'so_du_quy_dia_phuong_cuoi_ky', theo: ['don_vi_bao_cao'] },
    dv: { l: 'Số đơn vị báo cáo', loai: 'demkhac', c: 'don_vi_bao_cao' }
  },
  cot: ['tien', 'ct', 'tong', 'tlN', 'tl', 'tc', 'cn'], the: ['tien', 'tong', 'tl', 'dv'],
  bang: [{ t: 'Quỹ MTTQ Thành phố hỗ trợ, quỹ địa phương theo đơn vị', cap: ['cap_bao_cao', 'don_vi_bao_cao'], cot: ['qtp', 'nha', 'sk', 'dpchi', 'du'] }],
  bieu: [{ loai: 'chong', t: 'Số tiền ủng hộ theo nguồn', theo: 'nguon_ung_ho', m: 'tien' }, { loai: 'chong', t: 'Số tiền ủng hộ theo hình thức', theo: 'hinh_thuc_ung_ho', m: 'tien' }, { loai: 'xu', t: 'Số tiền ủng hộ qua các kỳ', m: 'tien' }],
  kt: [{ l: '«Tổng số tiền vận động được» lệch cộng «Số tiền ủng hộ» của đơn vị trong kỳ', c: ['tong_so_tien_van_dong_duoc'],
    f: (R, all) => efSai(efNum(R.tong_so_tien_van_dong_duoc), all.filter((x) => !x._thay && x.don_vi_bao_cao === R.don_vi_bao_cao && x._kyId === R._kyId).reduce((s, x) => s + (efNum(x.so_tien_ung_ho) || 0), 0)) },
    { l: '«Tỷ lệ hoàn thành chỉ tiêu (%)» lệch tổng vận động ÷ chỉ tiêu', c: ['ty_le_hoan_thanh_chi_tieu'], f: (R) => efTyleSai(R.ty_le_hoan_thanh_chi_tieu, R.tong_so_tien_van_dong_duoc, R.chi_tieu_van_dong_duoc_giao) },
    { l: 'Cùng đơn vị, cùng kỳ mà các trường cấp đơn vị ghi khác nhau', c: ['chi_tieu_van_dong_duoc_giao', 'tong_so_tien_van_dong_duoc'],
      f: (R, all) => all.some((x) => x.don_vi_bao_cao === R.don_vi_bao_cao && x._kyId === R._kyId && (x.chi_tieu_van_dong_duoc_giao !== R.chi_tieu_van_dong_duoc_giao || x.tong_so_tien_van_dong_duoc !== R.tong_so_tien_van_dong_duoc)) }]
};
const EF_MTTQ3 = {
  ef: 'mttq3', ten: 'Ủng hộ Quỹ "Vì biển, đảo Việt Nam"', banGhi: 'số vận động, đã chuyển quỹ của một đơn vị trong một đợt vận động', khoa: ['dot_van_dong', 'ten_don_vi', 'dia_ban'], cap: ['dot_van_dong', 'cap_don_vi'],
  chi: {
    dv: { l: 'Số đơn vị', loai: 'dem' },
    vd: { l: efL('mttq3', 'so_tien_da_van_dong'), loai: 'cong', c: 'so_tien_da_van_dong' },
    ch: { l: efL('mttq3', 'so_tien_da_chuyen_ve_quy_thanh_pho'), loai: 'cong', c: 'so_tien_da_chuyen_ve_quy_thanh_pho' },
    con: { l: efL('mttq3', 'so_tien_con_phai_chuyen') + ' (đã nhập)', loai: 'cong', c: 'so_tien_con_phai_chuyen' },
    tl: { l: 'Tỷ lệ đã chuyển (IOC tính)', loai: 'tyle', tu: 'ch', mau: 'vd' },
    tlN: { l: efL('mttq3', 'ty_le_da_chuyen_phan_tram') + ' đã nhập', loai: 'nhap', c: 'ty_le_da_chuyen_phan_tram', u: '%' },
    du: { l: 'Đã chuyển đủ', loai: 'dembang', c: 'trang_thai_chuyen_quy', v: ['da_chuyen_du'] },
    mp: { l: 'Chuyển một phần', loai: 'dembang', c: 'trang_thai_chuyen_quy', v: ['chuyen_mot_phan'] },
    chua: { l: 'Chưa chuyển', loai: 'dembang', c: 'trang_thai_chuyen_quy', v: ['chua_chuyen'] }
  },
  cot: ['dv', 'vd', 'ch', 'con', 'tl', 'tlN'], the: ['vd', 'ch', 'tl', 'chua'],
  bieu: [{ loai: 'chong', t: 'Đơn vị theo trạng thái chuyển quỹ', theo: 'trang_thai_chuyen_quy', m: 'dv' }, { loai: 'cot', t: 'Số tiền đã vận động theo cấp đơn vị', theo: 'cap_don_vi', m: 'vd' },
    { loai: 'cot', t: 'Bản ghi theo cờ dữ liệu', theo: 'co_du_lieu', m: 'dv' }, { loai: 'xu', t: 'Số tiền đã vận động qua các kỳ', m: 'vd' }],
  diaBan: 'dia_ban', cotDb: ['vd', 'ch', 'tl'],
  kt: [{ l: '«Số tiền còn phải chuyển» khác đã vận động − đã chuyển', c: ['so_tien_con_phai_chuyen'], f: (R) => efSai(efNum(R.so_tien_con_phai_chuyen), efNum(R.so_tien_da_van_dong) != null && efNum(R.so_tien_da_chuyen_ve_quy_thanh_pho) != null ? R.so_tien_da_van_dong - R.so_tien_da_chuyen_ve_quy_thanh_pho : null) },
    { l: '«Tỷ lệ đã chuyển (%)» lệch đã chuyển ÷ đã vận động, hoặc lớn hơn 100', c: ['ty_le_da_chuyen_phan_tram'], f: (R) => efTyleSai(R.ty_le_da_chuyen_phan_tram, R.so_tien_da_chuyen_ve_quy_thanh_pho, R.so_tien_da_van_dong) || efNum(R.ty_le_da_chuyen_phan_tram) > 100 },
    { l: '«Cờ dữ liệu» khác OK', c: ['co_du_lieu'], f: (R) => R.co_du_lieu != null && R.co_du_lieu !== 'ok' }]
};
const EF_MTTQ4_THU = ['thu_ung_ho_cq_to_chuc_dn_trong_nuoc', 'thu_ung_ho_ca_nhan_trong_nuoc', 'thu_ung_ho_cbccvc_nld', 'thu_ung_ho_to_chuc_ca_nhan_nuoc_ngoai', 'thu_dieu_chuyen_tu_quy_cap_khac', 'thu_lai_tien_gui_ngan_hang', 'thu_khac'];
const EF_MTTQ4_CHI = ['chi_ho_tro_xay_moi_nha_ddk', 'chi_ho_tro_sua_chua_nha', 'chi_ho_tro_kham_chua_benh', 'chi_ho_tro_hssv_ngheo', 'chi_ho_tro_von_sx_sinh_ke', 'chi_ho_tro_dip_le_tet', 'chi_phi_quan_ly_quy', 'chi_khac'];
const EF_MTTQ4 = {
  ef: 'mttq4', ten: 'Thu chi Quỹ "Vì người nghèo" (QĐ4795)', banGhi: 'báo cáo thu, chi Quỹ "Vì người nghèo" của một địa bàn trong kỳ; «Loại bản ghi» cho biết phần Thu, Chi, Tồn đầu kỳ hay bản Tổng hợp',
  khoa: ['dia_ban', 'dot_van_dong', 'loai_ban_ghi'], cap: ['cap_bao_cao', 'dia_ban'], xaTruong: 'dia_ban', xaChi: ['thu', 'chi', 'cuoi', 'hn'], uuTien: { c: 'loai_ban_ghi', v: 'tong_hop', theo: ['dia_ban', 'dot_van_dong', '_kyId'] },
  chi: Object.assign({
    dau: { l: efL('mttq4', 'ton_quy_dau_ky'), loai: 'dau', c: 'ton_quy_dau_ky' },
    thu: { l: efL('mttq4', 'tong_thu_trong_ky') + ' (đã nhập)', kl: efL('mttq4', 'tong_thu_trong_ky'), loai: 'cong', c: 'tong_thu_trong_ky' },
    chi: { l: efL('mttq4', 'tong_chi_trong_ky') + ' (đã nhập)', kl: efL('mttq4', 'tong_chi_trong_ky'), loai: 'cong', c: 'tong_chi_trong_ky' },
    cuoi: { l: efL('mttq4', 'ton_quy_cuoi_ky'), loai: 'td', c: 'ton_quy_cuoi_ky' },
    hn: { l: efL('mttq4', 'so_ho_ngheo_can_ngheo_duoc_ho_tro'), loai: 'cong', c: 'so_ho_ngheo_can_ngheo_duoc_ho_tro' },
    nddk: { l: efL('mttq4', 'so_nha_ddk_xay_moi'), loai: 'cong', c: 'so_nha_ddk_xay_moi' },
    nsc: { l: efL('mttq4', 'so_nha_duoc_sua_chua'), loai: 'cong', c: 'so_nha_duoc_sua_chua' },
    hssv: { l: efL('mttq4', 'so_luot_hssv_duoc_ho_tro'), loai: 'cong', c: 'so_luot_hssv_duoc_ho_tro' },
    db: { l: 'Số địa bàn báo cáo', loai: 'demkhac', c: 'dia_ban' },
    duyet: { l: 'Đã duyệt cấp Thành phố', loai: 'dembang', c: 'tinh_trang_xu_ly_tong_hop', v: ['da_duyet_thanh_pho'] }
  }, ...EF_MTTQ4_THU.concat(EF_MTTQ4_CHI).map((c) => ({ [c]: { l: efL('mttq4', c), loai: 'cong', c: c } }))),
  cot: ['dau', 'thu', 'chi', 'cuoi', 'hn', 'nddk'], the: ['thu', 'chi', 'cuoi', 'hn'],
  bang: [{ t: 'Kết quả hỗ trợ theo địa bàn', cap: ['cap_bao_cao', 'dia_ban'], cot: ['hn', 'nddk', 'nsc', 'hssv'] }],
  bieu: [{ loai: 'phan', t: 'Cơ cấu thu (7 khoản)', ms: EF_MTTQ4_THU }, { loai: 'phan', t: 'Cơ cấu chi (8 khoản)', ms: EF_MTTQ4_CHI },
    { loai: 'ds', t: 'Tồn đầu kỳ, thu, chi, tồn cuối kỳ', ms: ['dau', 'thu', 'chi', 'cuoi'] }, { loai: 'cot', t: 'Địa bàn theo tình trạng xử lý tổng hợp', theo: 'tinh_trang_xu_ly_tong_hop', m: 'db' },
    { loai: 'xu', t: 'Tổng thu qua các kỳ', m: 'thu' }],
  kt: [{ l: '«Tổng thu trong kỳ» khác cộng 7 khoản thu', c: ['tong_thu_trong_ky'], f: (R) => R.loai_ban_ghi !== 'chi' && EF_MTTQ4_THU.some((c) => efNum(R[c]) != null) && efSai(efNum(R.tong_thu_trong_ky), efCong(R, EF_MTTQ4_THU)) },
    { l: '«Tổng chi trong kỳ» khác cộng 8 khoản chi', c: ['tong_chi_trong_ky'], f: (R) => R.loai_ban_ghi !== 'thu' && EF_MTTQ4_CHI.some((c) => efNum(R[c]) != null) && efSai(efNum(R.tong_chi_trong_ky), efCong(R, EF_MTTQ4_CHI)) },
    { l: 'Tồn đầu kỳ + tổng thu − tổng chi khác tồn cuối kỳ', c: ['ton_quy_cuoi_ky'], f: (R) => R.loai_ban_ghi === 'tong_hop' && efSai(efNum(R.ton_quy_cuoi_ky), efCong(R, ['ton_quy_dau_ky', 'tong_thu_trong_ky']) - efCong(R, ['tong_chi_trong_ky'])) }]
};
const efTetCfg = (ef, ten, banGhiNhom) => ({
  ef: ef, ten: ten, banGhi: 'một đối tượng / hồ sơ của một địa bàn, thuộc một ' + banGhiNhom + ', tại ngày chốt số liệu',
  khoa: ['dia_ban', 'thon_tdp', 'nhom_doi_tuong_nhom_du_lieu', 'ten_doi_tuong_he_thong_ho_so'], khoaRong: ['thon_tdp'], cap: ['nhom_doi_tuong_nhom_du_lieu', 'dat_dieu_kien'],
  chi: {
    dt: { l: 'Số đối tượng, hồ sơ', loai: 'dem' },
    dat: { l: 'Đạt', loai: 'dembang', c: 'dat_dieu_kien', v: ['dat'] },
    cdat: { l: 'Chưa đạt', loai: 'dembang', c: 'dat_dieu_kien', v: ['chua_dat'] },
    co: { l: '«' + efL(ef, 'chi_tieu_co_khong') + '» = Có', loai: 'dembang', c: 'chi_tieu_co_khong', v: ['co'] },
    kh: { l: efL(ef, 'ke_hoach_chuan_muc_tieu'), loai: 'cong', c: 'ke_hoach_chuan_muc_tieu' },
    tlN: { l: efL(ef, 'ty_le_tinh_chi_tieu') + ' đã nhập', loai: 'nhap', c: 'ty_le_tinh_chi_tieu' },
    tldat: { l: 'Tỷ lệ đạt (IOC tính)', loai: 'tyle', tu: 'dat', mau: 'dt' }
  },
  cot: ['dt', 'dat', 'cdat', 'co', 'kh', 'tlN'], the: ['dt', 'dat', 'tldat', 'kh'],
  bieu: [{ loai: 'chong', t: 'Đối tượng theo nhóm', theo: 'nhom_doi_tuong_nhom_du_lieu', m: 'dt' }, { loai: 'chong', t: 'Đối tượng theo đạt điều kiện', theo: 'dat_dieu_kien', m: 'dt' },
    { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'dt' }, { loai: 'xu', t: 'Số đối tượng qua các kỳ', m: 'dt' }],
  diaBan: 'dia_ban', cotDb: ['dt', 'dat', 'kh'],
  kt: [{ l: '«Nhóm đối tượng/nhóm dữ liệu» là Không phát sinh mà vẫn có số', c: ['nhom_doi_tuong_nhom_du_lieu'], f: (R) => R.nhom_doi_tuong_nhom_du_lieu === 'khong_phat_sinh' && (efNum(R.ke_hoach_chuan_muc_tieu) > 0 || efNum(R.ty_le_tinh_chi_tieu) > 0) }]
});
const EF_MTTQ5 = efTetCfg('mttq5', 'Quà Tết theo cấp', 'nhóm nguồn lực theo cấp (Thành phố, phường/xã, tổ dân phố, xã hội hóa)');
const EF_MTTQ6 = efTetCfg('mttq6', 'Quà Tết theo nguồn quỹ', 'nhóm nguồn quỹ (Vì người nghèo, Đền ơn đáp nghĩa, ngân sách, xã hội hóa)');
const EF_MTTQ_DV = [
  ['mttq-ef1', 'Theo dõi nhiệm vụ - Khối Mặt trận Tổ quốc', EF_MTTQ1, ['nv', 'giao', 'nhan', 'ht', 'qh', 'tl']],
  ['mttq-ef2', 'Vận động thu Quỹ "Vì người nghèo"', EF_MTTQ2, ['tien', 'ct', 'tong', 'tl', 'tc', 'cn', 'qtp', 'dpchi']],
  ['mttq-ef3', 'Ủng hộ Quỹ "Vì biển, đảo Việt Nam"', EF_MTTQ3, ['vd', 'ch', 'con', 'tl', 'du', 'chua']],
  ['mttq-ef4', 'Thu chi Quỹ "Vì người nghèo" (QĐ4795)', EF_MTTQ4, ['dau', 'thu', 'chi', 'cuoi', 'hn', 'nddk', 'hssv', 'duyet']],
  ['mttq-ef5', 'Quà Tết theo cấp', EF_MTTQ5, ['dt', 'dat', 'cdat', 'tldat', 'kh']],
  ['mttq-ef6', 'Quà Tết theo nguồn quỹ', EF_MTTQ6, ['dt', 'dat', 'cdat', 'tldat', 'kh']]
];
EF_MTTQ_DV.forEach(([id, name, cfg, ks]) => ctmEformDonVi({ id: id, role: 'MTTQ', name: name, short: name, org: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội', eforms: [cfg], laEform: true, kpis: ks.map((m) => ({ ef: cfg.ef, m: m })) }));

/* ============================== TRỤC UBND: VP UBND THÀNH PHỐ (9 eform) ============================== */
const efVbCfg = (ef, ten, cap) => ({
  ef: ef, ten: ten, banGhi: 'số văn bản, hồ sơ công việc của một đơn vị báo cáo trong kỳ', khoa: ['don_vi_bao_cao'], cap: cap, xaTruong: 'don_vi_bao_cao', xaChi: ['tl', 'tong'],
  chi: {
    tong: { l: efL(ef, 'tong_so_van_ban_ho_so_cong_viec'), loai: 'cong', c: 'tong_so_van_ban_ho_so_cong_viec' },
    xl: { l: efL(ef, 'so_van_ban_ho_so_xu_ly_tren_moi_truong_mang'), loai: 'cong', c: 'so_van_ban_ho_so_xu_ly_tren_moi_truong_mang' },
    tl: { l: 'Tỷ lệ xử lý trên môi trường mạng (IOC tính)', loai: 'tyle', tu: 'xl', mau: 'tong' },
    tlN: { l: efL(ef, 'ty_le_tu_tinh') + ' đã nhập', loai: 'nhap', c: 'ty_le_tu_tinh', theo: ['don_vi_bao_cao', '_kyId'], u: '%' },
    dv: { l: 'Số đơn vị báo cáo', loai: 'demkhac', c: 'don_vi_bao_cao' }
  },
  cot: ['tong', 'xl', 'tl', 'tlN'], the: ['tong', 'xl', 'tl', 'dv'],
  bieu: [{ loai: 'xu', t: 'Tỷ lệ xử lý trên môi trường mạng qua các kỳ', m: 'tl' }].concat(cap.length > 1 ? [{ loai: 'cot', t: 'Tổng văn bản, hồ sơ theo cấp báo cáo', theo: cap[0], m: 'tong' }] : []),
  kt: [{ l: '«Tỷ lệ (%) (tự tính)» lệch số xử lý trên môi trường mạng ÷ tổng × 100', c: ['ty_le_tu_tinh'], f: (R) => efTyleSai(R.ty_le_tu_tinh, R.so_van_ban_ho_so_xu_ly_tren_moi_truong_mang, R.tong_so_van_ban_ho_so_cong_viec) },
    { l: 'Số xử lý trên môi trường mạng lớn hơn tổng', c: ['so_van_ban_ho_so_xu_ly_tren_moi_truong_mang'], f: (R) => efNum(R.so_van_ban_ho_so_xu_ly_tren_moi_truong_mang) > efNum(R.tong_so_van_ban_ho_so_cong_viec) }]
});
const EF_VPUB1 = efVbCfg('vpub1', 'Chỉ số 27 · văn bản trên môi trường mạng', ['cap_bao_cao', 'don_vi_bao_cao']);
const EF_VPUB2 = {
  ef: 'vpub2', ten: 'Chỉ số 29 · trợ lý ảo', banGhi: 'một ứng dụng trợ lý ảo (hoặc tình trạng chưa triển khai) của một đơn vị báo cáo', khoa: ['don_vi_bao_cao', 'ten_ung_dung_tro_ly_ao'], khoaRong: ['ten_ung_dung_tro_ly_ao'], xaTruong: 'don_vi_bao_cao', xaChi: ['ud', 'bg'], cap: ['da_trien_khai_tro_ly_ao', 'doi_tuong_phuc_vu'],
  chi: {
    bg: { l: 'Số bản ghi', loai: 'dem' },
    dv: { l: 'Số đơn vị báo cáo', loai: 'demkhac', c: 'don_vi_bao_cao' },
    dvCo: { l: 'Đơn vị ghi «Đã triển khai trợ lý ảo» = Có', kl: 'Đơn vị đã triển khai trợ lý ảo', loai: 'demkhac', c: 'don_vi_bao_cao', loc: { da_trien_khai_tro_ly_ao: ['Có'] } },
    ud: { l: 'Số ứng dụng trợ lý ảo', loai: 'demkhac', c: 'ten_ung_dung_tro_ly_ao' }
  },
  cot: ['dv', 'ud', 'bg'], the: ['dv', 'dvCo', 'ud', 'bg'],
  bieu: [{ loai: 'cot', t: 'Đơn vị theo «Đã triển khai trợ lý ảo»', theo: 'da_trien_khai_tro_ly_ao', m: 'dv' }, { loai: 'cot', t: 'Bản ghi theo đối tượng phục vụ', theo: 'doi_tuong_phuc_vu', m: 'bg' }]
};
const EF_VPUB3 = {
  ef: 'vpub3', ten: 'Chỉ số 74 · nhiệm vụ Chính phủ giao', banGhi: 'một nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao', khoa: ['van_ban_giao_nhiem_vu', 'ten_nhiem_vu'], cap: ['trang_thai_thuc_hien', 'co_quan_giao'],
  chi: {
    nv: { l: 'Số nhiệm vụ', loai: 'dem' },
    ht: { l: 'Đã hoàn thành (đúng hạn + quá hạn)', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['hoan_thanh_dung_han', 'hoan_thanh_qua_han'] },
    dh: { l: 'Hoàn thành đúng hạn', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['hoan_thanh_dung_han'] },
    qhch: { l: 'Quá hạn chưa hoàn thành', loai: 'dembang', c: 'trang_thai_thuc_hien', v: ['qua_han_chua_hoan_thanh'] },
    tl: { l: 'Tỷ lệ nhiệm vụ đã hoàn thành (IOC tính)', loai: 'tyle', tu: 'ht', mau: 'nv' },
    tlN: { l: efL('vpub3', 'ty_le_hoan_thanh') + ' đã nhập', loai: 'nhap', c: 'ty_le_hoan_thanh', u: '%' }
  },
  cot: ['nv', 'ht', 'dh', 'qhch', 'tl', 'tlN'], the: ['nv', 'ht', 'qhch', 'tl'],
  bieu: [{ loai: 'chong', t: 'Nhiệm vụ theo trạng thái thực hiện', theo: 'trang_thai_thuc_hien', m: 'nv' }, { loai: 'cot', t: 'Nhiệm vụ theo cơ quan giao', theo: 'co_quan_giao', m: 'nv' }, { loai: 'xu', t: 'Số nhiệm vụ qua các kỳ', m: 'nv' }],
  diaBan: 'dia_ban', cotDb: ['nv', 'ht', 'tl'], xaChi: ['nv', 'tl'],
  kt: [{ l: 'Hoàn thành mà thiếu «Ngày hoàn thành»', c: ['ngay_hoan_thanh'], f: (R) => /^hoan_thanh/.test(R.trang_thai_thuc_hien || '') && !R.ngay_hoan_thanh },
    { l: '«Ngày hoàn thành» sau «Hạn hoàn thành» mà ghi Hoàn thành đúng hạn', c: ['ngay_hoan_thanh'], f: (R) => R.trang_thai_thuc_hien === 'hoan_thanh_dung_han' && efSauHan(R.ngay_hoan_thanh, R.han_hoan_thanh) }]
};
const EF_VPUB4 = {
  ef: 'vpub4', ten: 'Chỉ số 52 · hồ sơ thủ tục hành chính', banGhi: 'số hồ sơ thủ tục hành chính của một đơn vị báo cáo trong kỳ', khoa: ['don_vi_bao_cao'], cap: ['don_vi_bao_cao'], xaTruong: 'don_vi_bao_cao', xaChi: ['tn', 'tldh', 'tltt', 'tlsh'],
  chi: {
    tn: { l: efL('vpub4', 'tong_so_ho_so_tiep_nhan'), loai: 'cong', c: 'tong_so_ho_so_tiep_nhan' },
    dh: { l: efL('vpub4', 'ho_so_giai_quyet_dung_han'), loai: 'cong', c: 'ho_so_giai_quyet_dung_han' },
    qh: { l: efL('vpub4', 'ho_so_giai_quyet_qua_han'), loai: 'cong', c: 'ho_so_giai_quyet_qua_han' },
    tt: { l: efL('vpub4', 'ho_so_truc_tuyen'), loai: 'cong', c: 'ho_so_truc_tuyen' },
    ttt: { l: efL('vpub4', 'ho_so_thanh_toan_truc_tuyen'), loai: 'cong', c: 'ho_so_thanh_toan_truc_tuyen' },
    sh: { l: efL('vpub4', 'ho_so_da_so_hoa'), loai: 'cong', c: 'ho_so_da_so_hoa' },
    gq: { l: 'Hồ sơ đã giải quyết (đúng hạn + quá hạn, IOC tính)', loai: 'cong', c: ['ho_so_giai_quyet_dung_han', 'ho_so_giai_quyet_qua_han'] },
    tldh: { l: 'Tỷ lệ giải quyết đúng hạn (IOC tính)', loai: 'tyle', tu: 'dh', mau: 'gq' },
    tltt: { l: 'Tỷ lệ hồ sơ trực tuyến (IOC tính)', loai: 'tyle', tu: 'tt', mau: 'tn' },
    tlttt: { l: 'Tỷ lệ thanh toán trực tuyến (IOC tính)', loai: 'tyle', tu: 'ttt', mau: 'tn' },
    tlsh: { l: 'Tỷ lệ hồ sơ đã số hóa (IOC tính)', loai: 'tyle', tu: 'sh', mau: 'tn' },
    diem: { l: efL('vpub4', 'diem_hai_long') + ' đã nhập', loai: 'nhap', c: 'diem_hai_long', theo: ['don_vi_bao_cao', '_kyId'], u: '%' }
  },
  cot: ['tn', 'dh', 'qh', 'tt', 'ttt', 'sh', 'diem'], the: ['tn', 'tldh', 'tltt', 'tlsh'],
  bieu: [{ loai: 'ds', t: 'Các tỷ lệ (IOC tính)', ms: ['tldh', 'tltt', 'tlttt', 'tlsh'] }, { loai: 'xu', t: 'Hồ sơ tiếp nhận qua các kỳ', m: 'tn' }],
  kt: [{ l: 'Đúng hạn + quá hạn lớn hơn tổng tiếp nhận', c: ['ho_so_giai_quyet_dung_han', 'ho_so_giai_quyet_qua_han'], f: (R) => efNum(R.tong_so_ho_so_tiep_nhan) != null && efCong(R, ['ho_so_giai_quyet_dung_han', 'ho_so_giai_quyet_qua_han']) > R.tong_so_ho_so_tiep_nhan },
    { l: 'Hồ sơ trực tuyến, số hóa lớn hơn tổng tiếp nhận', c: ['ho_so_truc_tuyen', 'ho_so_da_so_hoa'], f: (R) => efNum(R.tong_so_ho_so_tiep_nhan) != null && (efNum(R.ho_so_truc_tuyen) > R.tong_so_ho_so_tiep_nhan || efNum(R.ho_so_da_so_hoa) > R.tong_so_ho_so_tiep_nhan) }]
};
const EF_VPUB5 = {
  ef: 'vpub5', ten: 'Chỉ số 11, 12 · hạ tầng CNTT', banGhi: 'số lượng một loại hạ tầng CNTT ở một tình trạng của một đơn vị báo cáo', khoa: ['don_vi_bao_cao', 'loai_ha_tang_cntt', 'tinh_trang_hoat_dong'],
  cap: ['loai_ha_tang_cntt', 'tinh_trang_hoat_dong'], dvt: 'loai_ha_tang_cntt', xaTruong: 'don_vi_bao_cao', xaChi: ['bg', 'tlgb'],
  chi: {
    sl: { l: efL('vpub5', 'so_luong'), loai: 'td', c: 'so_luong', dvt: true },
    hd: { l: 'Số lượng đang hoạt động', loai: 'td', c: 'so_luong', dvt: true, loc: { tinh_trang_hoat_dong: ['dang_hoat_dong'] } },
    bg: { l: 'Số bản ghi', loai: 'dem' },
    dv: { l: 'Số đơn vị báo cáo', loai: 'demkhac', c: 'don_vi_bao_cao' },
    ph: { l: efL('vpub5', 'tong_so_phong_hop_chi_ap_dung_ht07'), loai: 'td', c: 'tong_so_phong_hop_chi_ap_dung_ht07' },
    gb: { l: efL('vpub5', 'so_phong_duoc_trang_bi_he_thong_giao_ban_truc_tuyen_ht07'), loai: 'td', c: 'so_phong_duoc_trang_bi_he_thong_giao_ban_truc_tuyen_ht07' },
    tlgb: { l: 'Phòng họp có giao ban trực tuyến so tổng phòng họp (IOC tính)', loai: 'tyle', tu: 'gb', mau: 'ph' },
    du: { l: 'Bản ghi đáp ứng đầy đủ', loai: 'dembang', c: 'muc_do_dap_ung', v: ['day_du'] }
  },
  cot: ['sl', 'hd', 'bg', 'dv'], the: ['dv', 'ph', 'gb', 'tlgb'],
  bang: [{ t: 'Theo cấp báo cáo › đối tượng phục vụ', cap: ['cap_bao_cao', 'doi_tuong_phuc_vu'], cot: ['bg', 'dv', 'du'] }],
  bieu: [{ loai: 'chong', t: 'Bản ghi theo tình trạng hoạt động', theo: 'tinh_trang_hoat_dong', m: 'bg' }, { loai: 'cot', t: 'Bản ghi theo mức độ đáp ứng', theo: 'muc_do_dap_ung', m: 'bg' }]
};
const EF_UBND2 = efVbCfg('ubnd2', 'Tỷ lệ văn bản trên môi trường mạng', ['don_vi_bao_cao']);
const EF_UBND3 = {
  ef: 'ubnd3', ten: 'Cắt giảm quy định, chi phí tuân thủ', banGhi: 'số quy định rà soát, cắt giảm và chi phí tuân thủ của một đơn vị báo cáo trong kỳ', khoa: ['don_vi_bao_cao'],
  cap: ['don_vi_tinh_chi_phi_vnd_gio_cong', 'don_vi_bao_cao'], dvt: 'don_vi_tinh_chi_phi_vnd_gio_cong', xaTruong: 'don_vi_bao_cao', xaChi: ['tlcg', 'cg'],
  chi: {
    qd: { l: efL('ubnd3', 'tong_so_quy_dinh_can_ra_soat_cat_giam'), loai: 'cong', c: 'tong_so_quy_dinh_can_ra_soat_cat_giam' },
    cg: { l: efL('ubnd3', 'so_quy_dinh_da_duoc_cat_giam_don_gian_hoa'), loai: 'cong', c: 'so_quy_dinh_da_duoc_cat_giam_don_gian_hoa' },
    tlcg: { l: 'Tỷ lệ quy định đã cắt giảm (IOC tính)', loai: 'tyle', tu: 'cg', mau: 'qd' },
    tr: { l: efL('ubnd3', 'tong_chi_phi_tuan_thu_truoc_cai_cach'), loai: 'cong', c: 'tong_chi_phi_tuan_thu_truoc_cai_cach', dvt: true },
    sau: { l: efL('ubnd3', 'chi_phi_tuan_thu_sau_cai_cach'), loai: 'cong', c: 'chi_phi_tuan_thu_sau_cai_cach', dvt: true },
    giam: { l: 'Chi phí cắt giảm (IOC tính)', loai: 'hieu', a: 'tr', b: 'sau', dvt: true },
    trV: { l: 'Chi phí trước cải cách · VNĐ', loai: 'cong', c: 'tong_chi_phi_tuan_thu_truoc_cai_cach', loc: { don_vi_tinh_chi_phi_vnd_gio_cong: ['vnd'] }, u: 'VNĐ' },
    sauV: { l: 'Chi phí sau cải cách · VNĐ', loai: 'cong', c: 'chi_phi_tuan_thu_sau_cai_cach', loc: { don_vi_tinh_chi_phi_vnd_gio_cong: ['vnd'] }, u: 'VNĐ' },
    giamV: { l: 'Chi phí cắt giảm · VNĐ (IOC tính)', loai: 'hieu', a: 'trV', b: 'sauV', u: 'VNĐ' },
    trG: { l: 'Chi phí trước cải cách · giờ công', loai: 'cong', c: 'tong_chi_phi_tuan_thu_truoc_cai_cach', loc: { don_vi_tinh_chi_phi_vnd_gio_cong: ['gio_cong'] }, u: 'giờ công' },
    sauG: { l: 'Chi phí sau cải cách · giờ công', loai: 'cong', c: 'chi_phi_tuan_thu_sau_cai_cach', loc: { don_vi_tinh_chi_phi_vnd_gio_cong: ['gio_cong'] }, u: 'giờ công' },
    giamG: { l: 'Chi phí cắt giảm · giờ công (IOC tính)', loai: 'hieu', a: 'trG', b: 'sauG', u: 'giờ công' }
  },
  cot: ['qd', 'cg', 'tlcg', 'tr', 'sau', 'giam'], the: ['qd', 'cg', 'tlcg', 'giamV'],
  bieu: [{ loai: 'ds', t: 'Chi phí tuân thủ tính bằng VNĐ', ms: ['trV', 'sauV', 'giamV'] }, { loai: 'ds', t: 'Chi phí tuân thủ tính bằng giờ công', ms: ['trG', 'sauG', 'giamG'] }, { loai: 'xu', t: 'Quy định đã cắt giảm qua các kỳ', m: 'cg' }],
  kt: [{ l: 'Số đã cắt giảm lớn hơn tổng cần rà soát', c: ['so_quy_dinh_da_duoc_cat_giam_don_gian_hoa'], f: (R) => efNum(R.so_quy_dinh_da_duoc_cat_giam_don_gian_hoa) > efNum(R.tong_so_quy_dinh_can_ra_soat_cat_giam) },
    { l: 'Chi phí sau cải cách lớn hơn trước cải cách', c: ['chi_phi_tuan_thu_sau_cai_cach'], f: (R) => efNum(R.chi_phi_tuan_thu_sau_cai_cach) > efNum(R.tong_chi_phi_tuan_thu_truoc_cai_cach) }]
};
const efCksCfg = (ef, ten, dv, banGhiDv) => ({
  ef: ef, ten: ten, banGhi: 'số cán bộ thuộc diện và đã được cấp chữ ký số của một ' + banGhiDv + ' trong kỳ', khoa: [dv, 'cap_bao_cao'], cap: ['cap_bao_cao', dv], xaTruong: dv, xaChi: ['tl', 'cap'],
  chi: {
    td: { l: efL(ef, 'tong_so_cbccvc_thuoc_dien_duoc_cap_chu_ky_so'), loai: 'cong', c: 'tong_so_cbccvc_thuoc_dien_duoc_cap_chu_ky_so' },
    cap: { l: efL(ef, 'so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu'), loai: 'cong', c: 'so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu' },
    tl: { l: 'Tỷ lệ đã được cấp chữ ký số (IOC tính)', loai: 'tyle', tu: 'cap', mau: 'td' },
    dv: { l: 'Số ' + banGhiDv + ' báo cáo', loai: 'demkhac', c: dv }
  },
  cot: ['td', 'cap', 'tl'], the: ['td', 'cap', 'tl', 'dv'],
  bieu: [{ loai: 'cot', t: 'CBCCVC đã được cấp theo cấp báo cáo', theo: 'cap_bao_cao', m: 'cap' }],
  kt: [{ l: 'Số đã được cấp lớn hơn số thuộc diện', c: ['so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu'], f: (R) => efNum(R.so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu) > efNum(R.tong_so_cbccvc_thuoc_dien_duoc_cap_chu_ky_so) }]
});
const EF_UBND6 = efCksCfg('ubnd6', 'Cuộc họp không giấy tờ (trường là chữ ký số)', 'dia_ban', 'địa bàn');
const EF_UBND9 = efCksCfg('ubnd9', 'CBCCVC được cấp chữ ký số', 'don_vi_bao_cao', 'đơn vị');
ctmEformDonVi({ id: 'ubnd-vpubnd', role: 'UBND', name: 'Văn phòng UBND Thành phố', short: 'VP UBND Thành phố', org: 'UBND Thành phố Hà Nội',
  eforms: [EF_VPUB1, EF_VPUB2, EF_VPUB3, EF_VPUB4, EF_VPUB5, EF_UBND2, EF_UBND3, EF_UBND6, EF_UBND9],
  kpis: [{ ef: 'vpub1', m: 'tl' }, { ef: 'vpub4', m: 'tn' }, { ef: 'vpub4', m: 'tldh' }, { ef: 'vpub3', m: 'nv' }, { ef: 'vpub3', m: 'qhch' }, { ef: 'vpub2', m: 'dvCo' }, { ef: 'ubnd9', m: 'tl' }, { ef: 'ubnd3', m: 'tlcg' }],
  card: ['vpub1_tl', 'vpub4_tn', 'vpub3_nv'] });

/* ============================== MÀN NGOÀI CÁC TRỤC (thay màn cũ, màn cũ tắt bằng cờ enabled) ============================== */
CTM_OVERVIEWS.forEach((c) => { if (['dang-tp', 'hdnd-tp', 'mttq-tp', 'tu-all'].indexOf(c.id) >= 0 && (c.level || 'city') === 'city') c.enabled = false; });
const efOvK = (cat, ef, m, l) => ({ cat: cat, m: ef + '_' + m, target: 'g:' + ef, l: l });
ctmRegisterOverview({
  id: 'dang-tp-ef', roles: ['DANG'], level: 'city', ax: 'Thành ủy', unitWord: 'ban',
  eyebrow: 'Tổng quan · Thành ủy Hà Nội · số liệu theo eform', title: (n) => 'Số liệu then chốt của ' + n + ' ban có eform',
  hint: 'Mọi số lấy từ bản ghi eform · bấm ô để mở chi tiết, bấm số trong chi tiết để xem bản ghi',
  short: { 'dang-to-chuc': 'Ban Tổ chức', 'dang-ubkt': 'Ủy ban Kiểm tra', 'dang-noi-chinh': 'Ban Nội chính', 'dang-tuyen-giao': 'Ban Tuyên giáo và Dân vận' },
  kpis: [efOvK('dang-to-chuc', 'dang5', 'cuoi'), efOvK('dang-to-chuc', 'dang5', 'kn'), efOvK('dang-to-chuc', 'dang4', 'tc'), efOvK('dang-to-chuc', 'dang6', 'cbccvc'),
    efOvK('dang-ubkt', 'dang1', 'th'), efOvK('dang-ubkt', 'dang1', 'tl'), efOvK('dang-noi-chinh', 'dang8', 'ln', 'Lượt công dân (Ban Nội chính)'), efOvK('dang-tuyen-giao', 'dang7', 'tin', 'Tin/bài tuyên truyền')],
  groups: []
});
ctmRegisterOverview({
  id: 'hdnd-tp-ef', roles: ['HDND'], level: 'city', ax: 'HĐND TP', unitWord: 'eform',
  eyebrow: 'Tổng quan · HĐND Thành phố · số liệu theo eform', title: (n) => 'Số liệu then chốt của ' + n + ' eform',
  hint: 'Mỗi thẻ là một eform · bấm ô để mở chi tiết, bấm số trong chi tiết để xem bản ghi',
  kpis: [efOvK('hdnd-ef1', 'hdnd1', 'kn', 'Kiến nghị cử tri'), efOvK('hdnd-ef1', 'hdnd1', 'tlgq'), efOvK('hdnd-ef2', 'hdnd2', 'nv', 'Nhiệm vụ HĐND'), efOvK('hdnd-ef2', 'hdnd2', 'tlht'),
    efOvK('hdnd-ef3', 'hdnd3', 'hd', 'Hoạt động giám sát, chất vấn'), efOvK('hdnd-ef4', 'hdnd4', 'hd', 'Hoạt động Thường trực, Ban, Tổ'), efOvK('hdnd-ef5', 'hdnd5', 'nq'), efOvK('hdnd-ef6', 'hdnd6', 'tlhl')],
  groups: []
});
ctmRegisterOverview({
  id: 'mttq-tp-ef', roles: ['MTTQ'], level: 'city', ax: 'MTTQ TP', unitWord: 'eform',
  eyebrow: 'Tổng quan · Ủy ban MTTQ Thành phố · số liệu theo eform', title: (n) => 'Số liệu then chốt của ' + n + ' eform',
  hint: 'Mỗi thẻ là một eform · bấm ô để mở chi tiết, bấm số trong chi tiết để xem bản ghi',
  kpis: [efOvK('mttq-ef1', 'mttq1', 'nv', 'Nhiệm vụ MTTQ'), efOvK('mttq-ef2', 'mttq2', 'tien', 'Ủng hộ Quỹ Vì người nghèo'), efOvK('mttq-ef2', 'mttq2', 'tl'), efOvK('mttq-ef3', 'mttq3', 'vd', 'Vận động Quỹ biển, đảo'),
    efOvK('mttq-ef4', 'mttq4', 'thu', 'Thu Quỹ (QĐ4795)'), efOvK('mttq-ef4', 'mttq4', 'chi', 'Chi Quỹ (QĐ4795)'), efOvK('mttq-ef5', 'mttq5', 'dt', 'Đối tượng quà Tết theo cấp'), efOvK('mttq-ef6', 'mttq6', 'dt', 'Đối tượng quà Tết theo nguồn quỹ')],
  groups: []
});
ctmRegisterOverview({
  id: 'tu-all-ef', roles: ['DANG', 'HDND', 'UBND', 'MTTQ'], level: 'city', unitWord: 'đơn vị',
  eyebrow: 'Tổng quan · 4 trục cấp Thành phố', title: (n) => 'Số liệu then chốt của ' + n + ' ban, sở, đơn vị, eform',
  hint: 'Mỗi ô ghi rõ đơn vị cung cấp và kỳ số liệu · bấm ô để mở chi tiết · bấm một trục để lọc',
  groupTitle: 'Bốn trục · bấm một trục để lọc danh sách đơn vị bên dưới',
  short: { 'dang-to-chuc': 'Ban Tổ chức Thành ủy', 'dang-ubkt': 'Ủy ban Kiểm tra Thành ủy', 'ubnd-taichinh': 'Sở Tài chính', 'ubnd-hcc': 'TT Phục vụ hành chính công', 'ubnd-vpubnd': 'VP UBND Thành phố' },
  kpis: [efOvK('dang-to-chuc', 'dang5', 'cuoi'), efOvK('dang-ubkt', 'dang1', 'th', 'Giá trị thực hiện KTGS'), efOvK('hdnd-ef5', 'hdnd5', 'nq'), efOvK('hdnd-ef1', 'hdnd1', 'kn', 'Kiến nghị cử tri'),
    { cat: 'ubnd-taichinh', line: 0, l: 'Thu ngân sách nhà nước' }, efOvK('ubnd-vpubnd', 'vpub4', 'tn'), efOvK('mttq-ef4', 'mttq4', 'thu', 'Thu Quỹ Vì người nghèo'), efOvK('mttq-ef2', 'mttq2', 'tien', 'Ủng hộ Quỹ Vì người nghèo')],
  groups: [
    { id: 'DANG', label: 'Thành ủy', role: 'DANG', ax: 'Thành ủy' },
    { id: 'HDND', label: 'HĐND Thành phố', role: 'HDND', ax: 'HĐND TP' },
    { id: 'UBND', label: 'UBND Thành phố', role: 'UBND', ax: 'UBND TP' },
    { id: 'MTTQ', label: 'Ủy ban MTTQ Thành phố', role: 'MTTQ', ax: 'MTTQ TP' }
  ]
});
