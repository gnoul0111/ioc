/* ============================== 126 XÃ, PHƯỜNG — CHỈ TIÊU THEO 12 EFORM (KHUNG CHUNG ctm-eform.js) ==============================
   Khai báo theo bản đọc docs/BAN_DOC_EFORM/XA_00_TONG_HOP … XA_12_MTTQ (duyệt 30/10/2026, "theo đề xuất"). Mỗi đơn vị là một eform của
   sheet "XãPhường" (khung js/core/xa-eform.js, sinh bằng tools/xa_eform_schema.py); bản ghi của xã, phường đang xem (XA_EF_NGUON).
   Chia cấp: xã, phường → trục → eform → «Tất cả nhóm» và từng nhóm (cfg.tach) → dòng số liệu (cfg.dong) → bản ghi.
   Kỳ xem Tháng / Quý / Năm từ tháng 7/2025; mọi ô số, dòng, cột, thanh bấm được ra bản ghi (G7). Không tự cộng thành tổng mới (G6);
   tỷ lệ "IOC tính" chỉ khi eform có tử số, mẫu số. Mã đơn vị giữ như cũ (danh mục central-level.js: xaEformCat). */
const XL = (ef, c) => EFK['xa_' + ef].F[c].l;
const XDM = (ef, c, v) => xaEfLb(EFK['xa_' + ef].F[c], v) || v;
/* Ngày tháng của trường c nằm ngoài kỳ báo cáo của bản ghi (sau: số tháng được trễ sau cuối kỳ, VD «Ngày báo cáo» nộp đầu tháng sau) */
function xaNgoaiKy(R, c, sau) {
  const d = efNgay(R[c]);
  if (d == null || !R._ky) return false;
  const t = new Date((d - 25569) * 864e5), m = t.getUTCFullYear() * 12 + t.getUTCMonth(), k = R._ky;
  const a = k.loai === 'thang' ? k.y * 12 + k.m - 1 : k.loai === 'quy' ? k.y * 12 + (k.q - 1) * 3 : k.y * 12, b = k.loai === 'thang' ? a : k.loai === 'quy' ? a + 2 : a + 11;
  return m < a || m > b + (sau || 0);
}
/* Bản ghi cùng kỳ của cùng xã (all = mọi bản ghi của eform đang xét) khớp điều kiện f, bỏ bản đã bị bản sau thay */
const xaCung = (all, R, f) => all.filter((x) => x !== R && !x._thay && x._kyId === R._kyId && f(x));
const xaCong = (rs, c) => rs.reduce((s, x) => s + (efNum(x[c]) || 0), 0);
const xaLech = (a, b) => a != null && b != null && Math.abs(a - b) > 0.1;
const XA_KT_NBC = (c, sau) => ({ l: '«' + (c === 'den_ngay' ? 'Đến ngày' : c === 'ngay_cap_nhat' ? 'Ngày cập nhật' : 'Ngày báo cáo') + '» ngoài kỳ báo cáo', c: [c], f: (R) => xaNgoaiKy(R, c, sau) });
const XA_KT_DVT = (so) => ({ l: 'Có số nhưng «Đơn vị tính» trống', c: ['don_vi_tinh'], f: (R) => efNum(R[so]) != null && (R.don_vi_tinh == null || R.don_vi_tinh === '') });

/* ---------- 1. Đảng ủy (XA_01) ---------- */
const XA_DANG_TD = ['tongsocbccvc', 'biendongdangvien', 'cocautochuc'];
const XA_EF_DANG = {
  ef: 'xa_dang', ten: 'Đảng ủy', banGhi: 'một chỉ tiêu (tên do xã gõ) thuộc một «Nhóm mục», một «Đối tượng thống kê», một «Phân loại/Kết quả» trong một kỳ',
  khoa: ['dia_ban', 'nhom_muc', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'don_vi_tinh'], khoaRong: ['phan_loai_ket_qua'],
  tach: 'nhom_muc', cap: ['nhom_muc', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['nhom_muc', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'don_vi_tinh'] },
  chi: {
    gt: { motDong: true, l: XL('dang', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { nhom_muc: XA_DANG_TD }, dvt: true },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' }
  },
  cot: ['gt', 'dong'],
  bieu: [{ loai: 'cot', t: 'Dòng số liệu theo nhóm mục', theo: 'nhom_muc', m: 'dong' }, { loai: 'dong', t: 'Giá trị từng dòng số liệu', m: 'gt' }],
  kt: [{ l: 'Có «Giá trị» nhưng «Đơn vị tính» hoặc «Tên chỉ tiêu» trống', c: ['don_vi_tinh', 'ten_chi_tieu'], f: (R) => efNum(R.gia_tri) != null && (!R.don_vi_tinh || !R.ten_chi_tieu) }],
  luuY: '«Giá trị» của 3 nhóm mục Tổng số CBCCVC khối Đảng, Biến động Đảng viên theo thời gian, Cơ cấu tổ chức Đảng trực thuộc là số tại thời điểm (xem quý, năm lấy bản cuối kỳ); các nhóm mục khác cộng các tháng.'
};

/* ---------- 2. HĐND (XA_02) ---------- */
const XA_HDND_NQ = ['1_nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026', '2_nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030', '3_nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030', '4_nghi_quyet_quy_che_tiep_cong_dan'];
const XA_EF_HDND = {
  ef: 'xa_hdnd', ten: 'HĐND', banGhi: 'một chỉ tiêu (tên do xã gõ) của một «Chủ đề / Nhóm», một «Đối tượng thống kê», một «Phân loại/Kết quả» trong một kỳ; có thể kèm dự án đầu tư công, thu NSNN, chi NSĐP',
  khoa: ['dia_ban', 'chu_de_nhom', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'du_an_dau_tu_cong', 'don_vi_tinh'], khoaRong: ['doi_tuong_thong_ke', 'phan_loai_ket_qua', 'du_an_dau_tu_cong'],
  tach: 'chu_de_nhom', cap: ['chu_de_nhom', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['chu_de_nhom', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'du_an_dau_tu_cong', 'don_vi_tinh'] },
  chi: {
    gt: { motDong: true, l: XL('hdnd', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { chu_de_nhom: XA_HDND_NQ }, dvt: true },
    thu: { l: XL('hdnd', 'thu_nsnn'), loai: 'cong', c: 'thu_nsnn', u: '' }, chi: { l: XL('hdnd', 'chi_nsdp'), loai: 'cong', c: 'chi_nsdp', u: '' },
    gs: { l: 'Cuộc giám sát đã thực hiện', loai: 'cong', c: 'gia_tri', loc: { chu_de_nhom: ['hoat_dong_giam_sat'], doi_tuong_thong_ke: ['cuoc_giam_sat'], phan_loai_ket_qua: ['da_thuc_hien'], don_vi_tinh: ['cuoc'] }, u: 'cuộc' },
    kh: { l: 'Kỳ họp HĐND xã', loai: 'cong', c: 'gia_tri', loc: { chu_de_nhom: ['ky_hop_hdnd'], doi_tuong_thong_ke: ['ky_hop_hdnd_xa'], phan_loai_ket_qua: ['so_luong'], don_vi_tinh: ['ky_hop'] }, u: 'kỳ họp' },
    tx: { l: 'Cuộc tiếp xúc cử tri', loai: 'cong', c: 'gia_tri', loc: { chu_de_nhom: ['tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa'], doi_tuong_thong_ke: ['cuoc_tiep_xuc_cu_tri'], phan_loai_ket_qua: ['so_luong'], don_vi_tinh: ['cuoc_tiep_xuc'] }, u: 'cuộc' },
    gsTt: { l: 'Cuộc giám sát theo tình trạng', loai: 'cong', c: 'gia_tri', loc: { chu_de_nhom: ['hoat_dong_giam_sat'], doi_tuong_thong_ke: ['cuoc_giam_sat'], phan_loai_ket_qua: ['da_thuc_hien', 'dang_thuc_hien', 'chua_thuc_hien'], don_vi_tinh: ['cuoc'] }, u: 'cuộc' },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' }
  },
  cot: ['gt', 'thu', 'chi', 'dong'],
  bieu: [{ loai: 'cot', t: 'Dòng số liệu theo chủ đề / nhóm', theo: 'chu_de_nhom', m: 'dong' },
    { loai: 'cot', t: 'Cuộc giám sát theo phân loại/kết quả (thanh riêng từng tình trạng)', theo: 'phan_loai_ket_qua', m: 'gsTt', nhom: ['hoat_dong_giam_sat'] },
    { loai: 'ds', t: 'Giám sát, kỳ họp, tiếp xúc cử tri', ms: ['gs', 'kh', 'tx'], nhom: [] }, { loai: 'xu', t: 'Cuộc giám sát đã thực hiện qua các kỳ', m: 'gs', nhom: [] },
    { loai: 'dong', t: 'Giá trị từng dòng số liệu', m: 'gt' }],
  kt: [{ l: '«Đơn vị tính» % hoặc %/năm mà «Giá trị» lớn hơn 1000 (nghi nhập nhầm đơn vị)', c: ['gia_tri'], f: (R) => /^phan_tram/.test(R.don_vi_tinh || '') && efNum(R.gia_tri) > 1000 }],
  luuY: 'Ở 4 nghị quyết «Giá trị» là số chỉ tiêu của nghị quyết: lấy bản cuối kỳ, không cộng; tỷ lệ, tốc độ (%) không cộng. «Thu NSNN», «Chi NSDP» chỉ hiện ở bảng (eform không ghi đơn vị).'
};

/* ---------- 3. Hành chính công (XA_03) ---------- */
const XA_HCC_NHOM = { so_ho_so_nhan_giai_quyet: ['so_ky_truoc_chuyen_qua', 'tiep_nhan_truc_tiep', 'tiep_nhan_truc_tuyen', 'tiep_nhan_bcci'], ket_qua_giai_quyet: ['dung_va_truoc_han', 'da_giai_quyet_qua_han'],
  ho_so_dang_giai_quyet: ['chua_den_han', 'dang_giai_quyet_qua_han'], tiep_nhan_ho_so: ['ho_so_tthc_cho_tiep_nhan', 'ho_so_khong_duoc_tiep_nhan'] };
const XA_HCC_TD = ['chua_den_han', 'dang_giai_quyet_qua_han', 'ho_so_tthc_cho_tiep_nhan'];
const xaHccChi = (id, v) => ({ l: XDM('hcc', 'chi_tieu', v), loai: v === 'so_ky_truoc_chuyen_qua' ? 'dau' : XA_HCC_TD.indexOf(v) >= 0 ? 'td' : 'cong', c: 'gia_tri', loc: { chi_tieu: [v] }, u: 'hồ sơ' });
const XA_EF_HCC = {
  ef: 'xa_hcc', ten: 'Hành chính công', banGhi: 'số hồ sơ của một «Chỉ tiêu» thuộc một «Nhóm chỉ tiêu», của một «Đơn vị», trong một kỳ',
  khoa: ['dia_ban', 'don_vi', 'nhom_chi_tieu', 'chi_tieu'], khoaRong: ['don_vi'], tach: 'nhom_chi_tieu', cap: ['nhom_chi_tieu', 'chi_tieu', 'don_vi'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['nhom_chi_tieu', 'chi_tieu', 'don_vi_tinh'] },
  chi: Object.assign({ gt: { motDong: true, l: XL('hcc', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { chi_tieu: XA_HCC_TD }, dau: { chi_tieu: ['so_ky_truoc_chuyen_qua'] }, u: 'hồ sơ' } },
    { kt: xaHccChi('kt', 'so_ky_truoc_chuyen_qua'), tt: xaHccChi('tt', 'tiep_nhan_truc_tiep'), tuyen: xaHccChi('tuyen', 'tiep_nhan_truc_tuyen'), bcci: xaHccChi('bcci', 'tiep_nhan_bcci'),
      dh: xaHccChi('dh', 'dung_va_truoc_han'), qh: xaHccChi('qh', 'da_giai_quyet_qua_han'), cdh: xaHccChi('cdh', 'chua_den_han'), dqh: xaHccChi('dqh', 'dang_giai_quyet_qua_han'),
      cho: xaHccChi('cho', 'ho_so_tthc_cho_tiep_nhan'), ktn: xaHccChi('ktn', 'ho_so_khong_duoc_tiep_nhan') }),
  cot: ['gt'],
  bieu: [{ loai: 'ds', t: 'Số hồ sơ nhận giải quyết', ms: ['kt', 'tt', 'tuyen', 'bcci'], nhom: ['so_ho_so_nhan_giai_quyet'] }, { loai: 'ds', t: 'Kết quả giải quyết', ms: ['dh', 'qh'], nhom: ['ket_qua_giai_quyet'] },
    { loai: 'ds', t: 'Hồ sơ đang giải quyết', ms: ['cdh', 'dqh'], nhom: ['ho_so_dang_giai_quyet'] }, { loai: 'ds', t: 'Tiếp nhận hồ sơ', ms: ['cho', 'ktn'], nhom: ['tiep_nhan_ho_so'] },
    { loai: 'xu', t: 'Tiếp nhận trực tuyến qua các kỳ', m: 'tuyen', nhom: [] }],
  kt: [{ l: '«Chỉ tiêu» không thuộc «Nhóm chỉ tiêu» (bản đọc HCC-1)', c: ['chi_tieu'], f: (R) => !!R.nhom_chi_tieu && !!R.chi_tieu && !!XA_HCC_NHOM[R.nhom_chi_tieu] && XA_HCC_NHOM[R.nhom_chi_tieu].indexOf(R.chi_tieu) < 0 },
    { l: '«Từ ngày» sau «Đến ngày»', c: ['tu_ngay'], f: (R) => efNgay(R.tu_ngay) != null && efNgay(R.den_ngay) != null && efNgay(R.tu_ngay) > efNgay(R.den_ngay) }, XA_KT_NBC('den_ngay')],
  luuY: 'Không cộng các chỉ tiêu khác nhau thành "tổng hồ sơ": eform không có trường tổng (bản đọc HCC-3). Số kỳ trước chuyển qua lấy bản đầu kỳ; chưa đến hạn, đang giải quyết quá hạn, chờ tiếp nhận lấy bản cuối kỳ; còn lại cộng các tháng.'
};

/* ---------- 4. Tài chính - Ngân sách (XA_04) ---------- */
const XA_TCNS_MOTA = ['muc_tieu_dau_tu', 'dia_diem', 'thoi_gian_thuc_hien', 'tong_von_dau_tu_va_nguon_von', 'cong_tac_giai_phong_mat_bang', 'tien_do_trien_khai_thi_cong', 'tien_do_giai_ngan',
  'nguon_cung_vat_lieu_xay_dung', 'vuong_mac_kien_nghi', 'theo_phan_nganh_kinh_te_chinh_vsic', 'theo_phan_nganh_kinh_te_vsic', 'chi_tiet_khoan_thu', 'muc_dich_ho_tro'];
const XA_TCNS_TP = { tong_thu_ngan_sach_nha_nuoc: ['thu_noi_dia', 'thu_dau_tho', 'thu_can_doi_tu_hoat_dong_xuat_nhap_khau', 'thu_vien_tro'], tong_chi_ngan_sach_nha_nuoc: ['chi_dau_tu_phat_trien', 'chi_thuong_xuyen', 'chi_tra_no_lai', 'chi_khac'] };
const xaTcLk = (v) => ({ l: XDM('tcns', 'tieu_chi_tieu', v), loai: 'td', c: 'gia_tri_luy_ke', loc: { tieu_chi_tieu: [v] }, ck: true });
/* Số lượng doanh nghiệp, HTX đang hoạt động: số tại thời điểm, lấy bản cuối kỳ (bản đọc, câu bổ sung 02/11/2026) */
const XA_TCNS_TD = ['so_luong_doanh_nghiep_dang_hoat_dong', 'so_luong_htx_dang_hoat_dong'];
const xaTcSl = (v, loai) => ({ l: XDM('tcns', 'tieu_chi_tieu', v), loai: loai, c: 'gia_tri_ky_bao_cao', loc: { tieu_chi_tieu: [v] } });
const XA_EF_TCNS = {
  ef: 'xa_tcns', ten: 'Tài chính - Ngân sách', banGhi: 'một «Tiểu chỉ tiêu» dưới một «Tên chỉ tiêu» (xã gõ), số tiền hoặc số lượng, trong một kỳ: giá trị kỳ báo cáo, lũy kế, dự toán/KH năm',
  khoa: ['dia_ban', 'ten_chi_tieu', 'tieu_chi_tieu', 'loai_gia_tri_sl_st', 'don_vi_tinh'], tach: 'loai_gia_tri_sl_st', cap: ['loai_gia_tri_sl_st', 'ten_chi_tieu', 'tieu_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  bo: { tieu_chi_tieu: XA_TCNS_MOTA },
  dong: { m: 'kbc', theo: ['loai_gia_tri_sl_st', 'ten_chi_tieu', 'tieu_chi_tieu', 'don_vi_tinh'] },
  chi: {
    kbc: { motDong: true, l: XL('tcns', 'gia_tri_ky_bao_cao'), loai: 'tuy', c: 'gia_tri_ky_bao_cao', td: { tieu_chi_tieu: XA_TCNS_TD }, dvt: true }, lk: { motDong: true, l: XL('tcns', 'gia_tri_luy_ke'), loai: 'td', c: 'gia_tri_luy_ke', dvt: true, ck: true },
    dt: { motDong: true, l: XL('tcns', 'du_toan_kh_nam'), loai: 'td', c: 'du_toan_kh_nam', dvt: true, plan: true },
    tl: { motDong: true, l: 'Lũy kế so với dự toán (IOC tính)', loai: 'tyle', tu: 'lk', mau: 'dt', dvt: true, vuot: true, ck: true },
    thu: xaTcLk('tong_thu_ngan_sach_nha_nuoc'), chi: xaTcLk('tong_chi_ngan_sach_nha_nuoc'),
    dtThu: { l: 'Dự toán thu NSNN', loai: 'td', c: 'du_toan_kh_nam', loc: { tieu_chi_tieu: ['tong_thu_ngan_sach_nha_nuoc'] }, plan: true },
    dtChi: { l: 'Dự toán chi NSNN', loai: 'td', c: 'du_toan_kh_nam', loc: { tieu_chi_tieu: ['tong_chi_ngan_sach_nha_nuoc'] }, plan: true },
    tlThu: { l: 'Tổng thu NSNN lũy kế so với dự toán (IOC tính)', loai: 'tyle', tu: 'thu', mau: 'dtThu', nhom: ['st'], vuot: true, ck: true }, tlChi: { l: 'Tổng chi NSNN lũy kế so với dự toán (IOC tính)', loai: 'tyle', tu: 'chi', mau: 'dtChi', nhom: ['st'], vuot: true, ck: true },
    thuKbc: { l: 'Tổng thu NSNN · giá trị kỳ báo cáo', loai: 'cong', c: 'gia_tri_ky_bao_cao', loc: { tieu_chi_tieu: ['tong_thu_ngan_sach_nha_nuoc'] } },
    gtgt: xaTcLk('thue_gtgt'), tndn: xaTcLk('thue_tndn'), tncn: xaTcLk('thue_tncn'), phi: xaTcLk('phi_le_phi'), lephi: xaTcLk('le_phi'), thukhac: xaTcLk('khoan_thu_khac'),
    dtpt: xaTcLk('chi_dau_tu_phat_trien'), tx: xaTcLk('chi_thuong_xuyen'), trano: xaTcLk('chi_tra_no_lai'), chikhac: xaTcLk('chi_khac'),
    dn: xaTcSl('so_luong_doanh_nghiep_dang_hoat_dong', 'td'), htx: xaTcSl('so_luong_htx_dang_hoat_dong', 'td'), htxMoi: xaTcSl('so_htx_thanh_lap_moi', 'cong'), htxGt: xaTcSl('so_htx_giai_the', 'cong')
  },
  cot: ['kbc', 'lk', 'dt', 'tl'], cotChu: ['ty_le_so_voi_du_toan_kh'],
  bieu: [{ loai: 'ds', t: 'Lũy kế các khoản thu', ms: ['gtgt', 'tndn', 'tncn', 'phi', 'lephi', 'thukhac'], nhom: ['st'] }, { loai: 'ds', t: 'Lũy kế các khoản chi', ms: ['dtpt', 'tx', 'trano', 'chikhac'], nhom: ['st'] },
    { loai: 'ds', t: 'Doanh nghiệp, hợp tác xã', ms: ['dn', 'htx', 'htxMoi', 'htxGt'], nhom: ['sl'] }, { loai: 'xu', t: 'Tổng thu NSNN (giá trị kỳ báo cáo) qua các kỳ', m: 'thuKbc', nhom: [] }],
  kt: [{ l: '«Giá trị lũy kế» nhỏ hơn «Giá trị kỳ báo cáo»', c: ['gia_tri_luy_ke'], f: (R) => efNum(R.gia_tri_luy_ke) != null && efNum(R.gia_tri_ky_bao_cao) != null && R.gia_tri_luy_ke < R.gia_tri_ky_bao_cao },
    { l: 'Lệch tổng các khoản thành phần cùng kỳ (IOC tính, bản đọc TCNS-1)', c: ['gia_tri_luy_ke'], f: (R, all) => {
      const tp = XA_TCNS_TP[R.tieu_chi_tieu];
      if (!tp) return false;
      const cs = xaCung(all, R, (x) => tp.indexOf(x.tieu_chi_tieu) >= 0 && x.don_vi_tinh === R.don_vi_tinh);
      return cs.length > 0 && ['gia_tri_ky_bao_cao', 'gia_tri_luy_ke'].some((c) => xaLech(efNum(R[c]), Math.round(xaCong(cs, c) * 10) / 10));
    } }, XA_KT_NBC('ngay_bao_cao', 1)],
  luuY: 'Tiểu chỉ tiêu dạng mô tả (Mục tiêu đầu tư, Địa điểm, Vướng mắc, kiến nghị…) không vào số, xem ở Dữ liệu đã nhập. «Tỷ lệ so với dự toán/KH» là chữ, ghi đúng như nhập cạnh tỷ lệ IOC tính ở bảng. Số lượng doanh nghiệp, HTX đang hoạt động lấy bản cuối kỳ; số lũy kế so cùng kỳ năm trước. Dự toán/KH năm là số kế hoạch, không so tăng giảm.'
};

/* ---------- 5. Quản lý văn bản (XA_05) ---------- */
const XA_QLVB_DEN = ['tong_so_van_ban_den', 'van_ban_den_chua_luu', 'van_ban_den_cho_duyet', 'van_ban_den_da_chuyen_thuc_hien'], XA_QLVB_DI = ['tong_so_van_ban_di', 'van_ban_lien_thong', 'van_ban_noi_bo'];
const XA_QLVB_TD = ['chua_xu_ly', 'dang_xu_ly', 'van_ban_den_chua_luu', 'van_ban_den_cho_duyet'];
/* một mã «Nhóm chỉ tiêu» với một «Phân loại» (pl: null = bản ghi không chia trong hạn / quá hạn) — không cộng các phân loại khác nhau (X7) */
const XA_QLVB_PL = { trong_han: 'Trong hạn', qua_han: 'Quá hạn' };
const xaVb = (v, pl) => ({ l: XDM('qlvb', 'nhom_chi_tieu', v) + (pl ? ' · ' + XA_QLVB_PL[pl] : ''), loai: XA_QLVB_TD.indexOf(v) >= 0 ? 'td' : 'cong', c: 'gia_tri', loc: { nhom_chi_tieu: [v], phan_loai: [pl || null] }, u: 'văn bản' });
const xaVbDen = (v) => { const m = xaVb(v); m.l += ' · Văn bản đến'; m.loc.loai_van_ban = ['van_ban_den']; return m; };
const XA_EF_QLVB = {
  ef: 'xa_qlvb', ten: 'Quản lý văn bản', banGhi: 'số văn bản của một «Nhóm chỉ tiêu», một «Loại văn bản», một «Phân loại» (trong hạn/quá hạn), của một cán bộ hoặc phòng, trong một kỳ',
  khoa: ['dia_ban', 'ten_can_bo_phong', 'loai_van_ban', 'nhom_chi_tieu', 'phan_loai'], khoaRong: ['ten_can_bo_phong', 'phan_loai'], tach: 'loai_van_ban', cap: ['loai_van_ban', 'nhom_chi_tieu', 'phan_loai'],
  /* QLVB-3: cùng chỉ tiêu có bản để trống «Tên Cán bộ/Phòng» thì đó là số của xã, không cộng chồng số từng phòng */
  uuTien: { c: 'ten_can_bo_phong', v: null, theo: ['loai_van_ban', 'nhom_chi_tieu', 'phan_loai'], l: 'để trống «Tên Cán bộ/Phòng» (số của cả xã)' },
  dong: { m: 'gt', theo: ['loai_van_ban', 'nhom_chi_tieu', 'phan_loai'] },
  chi: {
    gt: { motDong: true, l: XL('qlvb', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { nhom_chi_tieu: XA_QLVB_TD }, u: 'văn bản' },
    den: xaVb('tong_so_van_ban_den'), chuaLuu: xaVb('van_ban_den_chua_luu'), choDuyet: xaVb('van_ban_den_cho_duyet'), daChuyen: xaVb('van_ban_den_da_chuyen_thuc_hien'),
    di: xaVb('tong_so_van_ban_di'), lienThong: xaVb('van_ban_lien_thong'), noiBo: xaVb('van_ban_noi_bo'),
    /* ô số tình trạng xử lý: văn bản đến (không cộng văn bản đến với văn bản đi — X7) */
    chuaXl: xaVbDen('chua_xu_ly'), dangXl: xaVbDen('dang_xu_ly'), hoanTat: xaVbDen('da_hoan_tat'),
    chuaXlN: xaVb('chua_xu_ly'), dangXlN: xaVb('dang_xu_ly'), hoanTatN: xaVb('da_hoan_tat'),
    chuaXlTh: xaVb('chua_xu_ly', 'trong_han'), chuaXlQh: xaVb('chua_xu_ly', 'qua_han'), dangXlTh: xaVb('dang_xu_ly', 'trong_han'), dangXlQh: xaVb('dang_xu_ly', 'qua_han'),
    hoanTatTh: xaVb('da_hoan_tat', 'trong_han'), hoanTatQh: xaVb('da_hoan_tat', 'qua_han'),
    denPh: { l: 'Tổng số văn bản đến', loai: 'cong', c: 'gia_tri', loc: { nhom_chi_tieu: ['tong_so_van_ban_den'] }, u: 'văn bản' },
    qh: { l: 'Văn bản quá hạn', loai: 'tuy', c: 'gia_tri', td: { nhom_chi_tieu: XA_QLVB_TD }, loc: { phan_loai: ['qua_han'] }, u: 'văn bản' }
  },
  cot: ['gt'],
  bieu: [{ loai: 'ds', t: 'Văn bản đến', ms: ['den', 'chuaLuu', 'choDuyet', 'daChuyen'], nhom: ['van_ban_den'] }, { loai: 'ds', t: 'Văn bản đi', ms: ['di', 'lienThong', 'noiBo'], nhom: ['van_ban_di'] },
    { loai: 'ds', t: 'Tình trạng xử lý, tách trong hạn / quá hạn (thanh riêng, không cộng)', ms: ['chuaXlN', 'chuaXlTh', 'chuaXlQh', 'dangXlN', 'dangXlTh', 'dangXlQh', 'hoanTatN', 'hoanTatTh', 'hoanTatQh'], chiNhom: true },
    { loai: 'cot', t: 'Văn bản quá hạn theo nhóm chỉ tiêu', theo: 'nhom_chi_tieu', m: 'qh', chiNhom: true }, { loai: 'cot', t: 'Tổng số văn bản đến theo cán bộ/phòng (số từng phòng đã nhập)', theo: 'ten_can_bo_phong', m: 'denPh', tatCa: true, boTrong: true, nhom: ['van_ban_den'] },
    { loai: 'xu', t: 'Tổng số văn bản đến qua các kỳ', m: 'den', nhom: [] }],
  bang: [{ t: 'Theo cán bộ/phòng (số từng phòng đã nhập)', cap: ['ten_can_bo_phong', 'nhom_chi_tieu'], cot: ['gt'], tatCa: true }],
  kt: [{ l: '«Nhóm chỉ tiêu» không hợp «Loại văn bản»', c: ['nhom_chi_tieu'], f: (R) => (R.loai_van_ban === 'van_ban_den' && XA_QLVB_DI.indexOf(R.nhom_chi_tieu) >= 0) || (R.loai_van_ban === 'van_ban_di' && XA_QLVB_DEN.indexOf(R.nhom_chi_tieu) >= 0) },
    XA_KT_NBC('ngay_bao_cao', 1)],
  luuY: 'Chưa kiểm tổng văn bản đến, đi (chưa rõ thành phần — bản đọc QLVB-1). Chưa xử lý, đang xử lý, đến chưa lưu, đến chờ duyệt lấy bản cuối kỳ; còn lại cộng các tháng.'
};

/* ---------- 6. GPMB (XA_06) ---------- */
const XA_DA = { loai_dong: ['du_an'] };
const xaGp = (c, l) => ({ l: l || XL('gpmb', c), loai: 'cong', c: c, loc: XA_DA });
const XA_EF_GPMB = {
  ef: 'xa_gpmb', ten: 'GPMB', banGhi: 'tình hình GPMB của một dự án («Loại dòng» = Dự án) hoặc một khu vực con của dự án trong một kỳ',
  khoa: ['dia_ban', 'ma_du_an', 'loai_dong', 'ten_du_an_khu_vuc_GPMB'], tach: 'nhom_trang_thai', cap: ['nhom_trang_thai', 'ma_du_an', 'ten_du_an_khu_vuc_GPMB'], kyCuoi: true,
  dong: { m: 'dtd', theo: ['ma_du_an', 'ten_du_an_khu_vuc_GPMB', 'loai_dong'] },
  chi: {
    da: { l: 'Số dự án', loai: 'dem', loc: XA_DA, u: 'dự án' },
    phai: xaGp('tong_dien_tich_phai_thu_hoi'), dt: xaGp('dien_tich_da_thu_hoi'), dtd: { l: XL('gpmb', 'dien_tich_da_thu_hoi'), loai: 'cong', c: 'dien_tich_da_thu_hoi' },
    tlTh: { l: 'Tỷ lệ thu hồi (IOC tính)', loai: 'tyle', tu: 'dt', mau: 'phai' },
    ho: xaGp('tong_so_doi_tuong_gpmb'), tb: xaGp('da_thong_bao_thu_hoi_dat'), kd: xaGp('da_kiem_dem'), pd: xaGp('da_phe_duyet_phuong_an_boi_thuong'), ct: xaGp('da_chi_tra_nhan_tien'), bg: xaGp('da_ban_giao_mat_bang'),
    tlBg: { l: 'Tỷ lệ bàn giao (IOC tính, theo số hộ)', loai: 'tyle', tu: 'bg', mau: 'ho' },
    kpDk: xaGp('kinh_phi_boi_thuong_ho_tro_du_kien'), kpCt: xaGp('kinh_phi_da_chi_tra'),
    tienDo: { l: XL('gpmb', 'tien_do_thuc_te'), loai: 'nhap', c: 'tien_do_thuc_te', u: '%' }, tlThN: { l: XL('gpmb', 'ty_le_thu_hoi'), loai: 'nhap', c: 'ty_le_thu_hoi', u: '%' }
  },
  cot: ['phai', 'dt', 'tlTh', 'tlThN', 'ho', 'bg', 'kpCt'], the: ['dt', 'phai', 'tlTh', 'da'],
  bieu: [{ loai: 'ds', t: 'Các bước GPMB (số hộ, dòng Dự án)', ms: ['ho', 'tb', 'kd', 'pd', 'ct', 'bg'] }, { loai: 'cot', t: 'Dự án theo trạng thái tiến độ', theo: 'trang_thai_tien_do', m: 'da' },
    { loai: 'cot', t: 'Dự án theo nhóm dự án', theo: 'nhom_du_an', m: 'da' }, { loai: 'cot', t: 'Dự án theo chủ đầu tư/đơn vị phụ trách', theo: 'chu_dau_tu_don_vi_phu_trach', m: 'da' },
    { loai: 'dong', t: 'Tỷ lệ thu hồi đã nhập từng dự án, khu vực', m: 'tlThN' }, { loai: 'xu', t: 'Diện tích đã thu hồi qua các kỳ', m: 'dt', nhom: [] }, { loai: 'xu', t: 'Số hộ đã bàn giao mặt bằng qua các kỳ', m: 'bg', nhom: [] }],
  kt: [{ l: '«Diện tích đã thu hồi» lớn hơn «Tổng diện tích phải thu hồi»', c: ['dien_tich_da_thu_hoi'], f: (R) => efNum(R.dien_tich_da_thu_hoi) > efNum(R.tong_dien_tich_phai_thu_hoi) },
    { l: '«Tỷ lệ thu hồi(%)» lệch IOC tính quá 0,1 điểm', c: ['ty_le_thu_hoi'], f: (R) => efNum(R.tong_dien_tich_phai_thu_hoi) > 0 && xaLech(efNum(R.ty_le_thu_hoi), Math.round(R.dien_tich_da_thu_hoi / R.tong_dien_tich_phai_thu_hoi * 1000) / 10) },
    { l: '«Tỷ lệ bàn giao(%)» lệch IOC tính quá 0,1 điểm', c: ['ty_le_ban_giao'], f: (R) => efNum(R.tong_so_doi_tuong_gpmb) > 0 && xaLech(efNum(R.ty_le_ban_giao), Math.round(R.da_ban_giao_mat_bang / R.tong_so_doi_tuong_gpmb * 1000) / 10) },
    { l: 'Khu vực con không có dòng Dự án cùng «Mã dự án»', c: ['ma_du_an'], f: (R, all) => R.loai_dong === 'khu_vuc_con_cua_du_an' && !xaCung(all, R, (x) => x.loai_dong === 'du_an' && x.ma_du_an === R.ma_du_an).length },
    { l: 'Dòng Dự án lệch tổng các khu vực con (bản đọc GPMB-1)', c: ['tong_dien_tich_phai_thu_hoi'], f: (R, all) => {
      if (R.loai_dong !== 'du_an') return false;
      const cs = xaCung(all, R, (x) => x.loai_dong === 'khu_vuc_con_cua_du_an' && x.ma_du_an === R.ma_du_an);
      return cs.length > 0 && ['tong_dien_tich_phai_thu_hoi', 'tong_so_doi_tuong_gpmb'].some((c) => xaLech(efNum(R[c]), xaCong(cs, c)));
    } }],
  luuY: 'Số liệu GPMB là lũy kế đến kỳ: xem quý, năm lấy bản cuối kỳ. Số tổng chỉ lấy dòng «Dự án», không cộng chồng khu vực con.'
};

/* ---------- 7. Giáo dục (XA_07) ---------- */
const XA_GD_KA = ['tong_so', 'khong_ap_dung'];
const xaHs = (dt, them) => Object.assign({ nhom_doi_tuong: [dt], phan_loai_ket_qua: ['tong_so'], loai_co_so: ['tong_so'], gioi_tinh: XA_GD_KA, dan_toc: XA_GD_KA }, them || {});
const XA_EF_GD = {
  ef: 'xa_gd', ten: 'Giáo dục', banGhi: 'một số liệu (tên chỉ tiêu do xã gõ) theo một tổ hợp bậc học, loại cơ sở, giới tính, dân tộc, trình độ chuyên môn, nhóm đối tượng, phân loại/kết quả trong một kỳ',
  khoa: ['dia_ban', 'nhom_chi_tieu', 'ten_chi_tieu', 'bac_hoc_loai_hinh_giao_duc', 'loai_co_so', 'gioi_tinh', 'dan_toc', 'trinh_do_chuyen_mon', 'nhom_doi_tuong', 'phan_loai_ket_qua', 'don_vi_tinh'],
  khoaRong: ['ten_chi_tieu', 'bac_hoc_loai_hinh_giao_duc', 'loai_co_so', 'gioi_tinh', 'dan_toc', 'trinh_do_chuyen_mon', 'nhom_doi_tuong', 'phan_loai_ket_qua'],
  tach: 'nhom_chi_tieu', cap: ['nhom_chi_tieu', 'bac_hoc_loai_hinh_giao_duc', 'nhom_doi_tuong', 'phan_loai_ket_qua'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['nhom_chi_tieu', 'ten_chi_tieu', 'bac_hoc_loai_hinh_giao_duc', 'loai_co_so', 'gioi_tinh', 'dan_toc', 'trinh_do_chuyen_mon', 'nhom_doi_tuong', 'phan_loai_ket_qua', 'don_vi_tinh'], boNhan: XA_GD_KA },
  chi: {
    gt: { motDong: true, l: XL('gd', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { phan_loai_ket_qua: ['tong_so'] }, dvt: true },
    hs: { l: 'Số học sinh (Tổng số)', loai: 'td', c: 'gia_tri', loc: xaHs('hoc_sinh'), u: 'học sinh' }, gv: { l: 'Số giáo viên (Tổng số)', loai: 'td', c: 'gia_tri', loc: xaHs('giao_vien'), u: 'giáo viên' },
    hsCs: { l: 'Học sinh theo loại cơ sở', loai: 'td', c: 'gia_tri', loc: xaHs('hoc_sinh', { loai_co_so: ['cong_lap', 'ngoai_cong_lap'] }), u: 'học sinh' },
    hsGt: { l: 'Học sinh theo giới tính', loai: 'td', c: 'gia_tri', loc: xaHs('hoc_sinh', { gioi_tinh: ['nam', 'nu'] }), u: 'học sinh' },
    hsDt: { l: 'Học sinh theo dân tộc', loai: 'td', c: 'gia_tri', loc: xaHs('hoc_sinh', { dan_toc: ['kinh', 'dan_toc_thieu_so'] }), u: 'học sinh' },
    cs: { l: 'Số cơ sở (Tổng số)', loai: 'td', c: 'gia_tri', loc: xaHs('co_so'), u: 'cơ sở' },
    /* tuyển mới, tốt nghiệp: học sinh và học viên tách riêng (khác đơn vị tính); chỉ dòng "Tổng số"/"Không áp dụng" ở các chiều khác (G5) */
    tmHs: { l: 'Học sinh tuyển mới', loai: 'cong', c: 'gia_tri', loc: xaHs('hoc_sinh', { phan_loai_ket_qua: ['tuyen_moi'] }), u: 'học sinh' },
    tnHs: { l: 'Học sinh tốt nghiệp', loai: 'cong', c: 'gia_tri', loc: xaHs('hoc_sinh', { phan_loai_ket_qua: ['tot_nghiep'] }), u: 'học sinh' },
    tmHv: { l: 'Học viên tuyển mới', loai: 'cong', c: 'gia_tri', loc: xaHs('hoc_vien', { phan_loai_ket_qua: ['tuyen_moi'] }), u: 'học viên' },
    tnHv: { l: 'Học viên tốt nghiệp', loai: 'cong', c: 'gia_tri', loc: xaHs('hoc_vien', { phan_loai_ket_qua: ['tot_nghiep'] }), u: 'học viên' },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' }
  },
  cot: ['gt'],
  bieu: [{ loai: 'cot', t: 'Số học sinh theo bậc học', theo: 'bac_hoc_loai_hinh_giao_duc', m: 'hs', nhom: ['giao_duc_va_dao_tao'] }, { loai: 'cot', t: 'Học sinh theo loại cơ sở', theo: 'loai_co_so', m: 'hsCs', nhom: ['giao_duc_va_dao_tao'] },
    { loai: 'cot', t: 'Học sinh theo giới tính', theo: 'gioi_tinh', m: 'hsGt', nhom: ['giao_duc_va_dao_tao'] }, { loai: 'cot', t: 'Học sinh theo dân tộc', theo: 'dan_toc', m: 'hsDt', nhom: ['giao_duc_va_dao_tao'] },
    { loai: 'cot', t: 'Số giáo viên theo bậc học', theo: 'bac_hoc_loai_hinh_giao_duc', m: 'gv', nhom: ['giao_duc_va_dao_tao'] }, { loai: 'cot', t: 'Số cơ sở theo bậc học', theo: 'bac_hoc_loai_hinh_giao_duc', m: 'cs', nhom: ['giao_duc_va_dao_tao', 'giao_duc_nghe_nghiep_cho_nguoi_khuyet_tat'] },
    { loai: 'cot', t: 'Học viên tuyển mới theo trình độ chuyên môn', theo: 'trinh_do_chuyen_mon', m: 'tmHv', nhom: ['giao_duc_nghe_nghiep'] }, { loai: 'cot', t: 'Học viên tốt nghiệp theo trình độ chuyên môn', theo: 'trinh_do_chuyen_mon', m: 'tnHv', nhom: ['giao_duc_nghe_nghiep'] },
    { loai: 'cot', t: 'Học sinh tuyển mới theo bậc học', theo: 'bac_hoc_loai_hinh_giao_duc', m: 'tmHs', nhom: ['giao_duc_va_dao_tao'] }, { loai: 'cot', t: 'Học sinh tốt nghiệp theo bậc học', theo: 'bac_hoc_loai_hinh_giao_duc', m: 'tnHs', nhom: ['giao_duc_va_dao_tao'] },
    { loai: 'xu', t: 'Số học sinh qua các kỳ', m: 'hs', nhom: [] },
    { loai: 'dong', t: 'Giá trị từng dòng số liệu', m: 'gt' }],
  kt: [{ l: 'Dòng "Tổng số" lệch tổng các dòng thành phần cùng kỳ (IOC tính, bản đọc GD-1)', c: ['gia_tri'], f: (R, all) => ['loai_co_so', 'gioi_tinh', 'dan_toc'].some((c) => {
      if (R[c] !== 'tong_so') return false;
      const tp = { loai_co_so: ['cong_lap', 'ngoai_cong_lap'], gioi_tinh: ['nam', 'nu'], dan_toc: ['kinh', 'dan_toc_thieu_so'] }[c];
      const cs = xaCung(all, R, (x) => tp.indexOf(x[c]) >= 0 && efKhoa({ khoa: XA_EF_GD.khoa.filter((k) => k !== c && k !== 'ten_chi_tieu') }, x) === efKhoa({ khoa: XA_EF_GD.khoa.filter((k) => k !== c && k !== 'ten_chi_tieu') }, R));
      return cs.length > 0 && xaLech(efNum(R.gia_tri), xaCong(cs, 'gia_tri'));
    }) },
    { l: '«Đơn vị tính» không hợp «Nhóm đối tượng»', c: ['don_vi_tinh'], f: (R) => !!R.nhom_doi_tuong && !!R.don_vi_tinh && ({ hoc_sinh: 'hoc_sinh', giao_vien: 'giao_vien', hoc_vien: 'hoc_vien', co_so: 'co_so', nguoi_khuyet_tat: 'hoc_vien' }[R.nhom_doi_tuong] || R.don_vi_tinh) !== R.don_vi_tinh }],
  luuY: 'Dòng "Tổng số" không cộng chồng với dòng thành phần; biểu đồ tổng lấy dòng "Tổng số", biểu đồ chia lấy dòng thành phần. «Phân loại/Kết quả» = Tổng số là số hiện có (bản cuối kỳ); tuyển mới, tốt nghiệp cộng các kỳ.'
};

/* ---------- 8. Y tế (XA_08; sửa 02/11/2026: không cộng các chỉ tiêu khác nhau — thanh từng chỉ tiêu, mỗi đơn vị tính một khối) ---------- */
const XA_EF_YTE = {
  ef: 'xa_yte', ten: 'Y tế', banGhi: 'một số liệu (tên chỉ tiêu, tiểu chỉ tiêu do xã gõ) thuộc một «Nhóm chỉ tiêu» trong một kỳ',
  khoa: ['dia_ban', 'nhom_chi_tieu', 'ten_chi_tieu', 'tieu_chi_tieu', 'don_vi_tinh'], khoaRong: ['tieu_chi_tieu'], tach: 'nhom_chi_tieu', cap: ['nhom_chi_tieu', 'ten_chi_tieu', 'tieu_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['nhom_chi_tieu', 'ten_chi_tieu', 'tieu_chi_tieu', 'don_vi_tinh'] },
  chi: {
    gt: { motDong: true, l: XL('yte', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { nhom_chi_tieu: ['BAO_TRO_XA_HOI'] }, dvt: true },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' }
  },
  cot: ['gt'],
  bieu: [{ loai: 'dong', t: 'Giá trị từng chỉ tiêu (mỗi đơn vị tính một khối)', m: 'gt' }],
  kt: [{ l: '«Đơn vị tính» Vụ ở nhóm Bảo trợ xã hội (nghi nhầm)', c: ['don_vi_tinh'], f: (R) => R.nhom_chi_tieu === 'BAO_TRO_XA_HOI' && R.don_vi_tinh === 'VU' },
    { l: 'Nhiều bản tần suất Tuần trong cùng kỳ: chỉ lấy bản gửi sau, không cộng các tuần (bản đọc YTE-2)', c: ['tan_suat'], f: (R, all) => R.tan_suat === 'tuan' && all.some((x) => x !== R && x.tan_suat === 'tuan' && x._kyId === R._kyId && efKhoa(XA_EF_YTE, x) === efKhoa(XA_EF_YTE, R)) },
    { l: '«Ngày cập nhật» trước ngày đầu kỳ báo cáo', c: ['ngay_cap_nhat'], f: (R) => { const d = efNgay(R.ngay_cap_nhat), k = R._ky; if (d == null || !k) return false; const m0 = k.loai === 'thang' ? k.m : k.loai === 'quy' ? (k.q - 1) * 3 + 1 : 1; return d < Date.UTC(k.y, m0 - 1, 1) / 864e5 + 25569; } }],
  luuY: 'Không cộng các chỉ tiêu khác nhau thành một số: mỗi chỉ tiêu (tên, tiểu chỉ tiêu, đơn vị tính) một dòng. Bảo trợ xã hội là số người, hộ đang hưởng (bản cuối kỳ); ngộ độc thực phẩm, dịch bệnh cộng các tháng.'
};

/* ---------- 9. Văn hóa (XA_09) ---------- */
const XA_VH_TD = ['don_vi_nghe_thuat', 'di_tich', 'di_san_van_hoa_phi_vat_the', 'nghe_nhan', 'thiet_che', 'clb'], XA_VH_TT = ['bao_chi', 'trang_tin', 'mang_xa_hoi'];
const XA_EF_VH = {
  ef: 'xa_vh', ten: 'Văn hóa', banGhi: 'một số liệu văn hóa (tên chỉ tiêu do xã gõ) theo nhóm chỉ tiêu, đối tượng, loại hình, tính chất, quy mô trong một kỳ; ba số: số lượng, kinh phí/doanh thu, số người tham gia',
  khoa: ['dia_ban', 'nhom_chi_tieu', 'ten_chi_tieu', 'doi_tuong_thong_ke', 'loai_hinh', 'tinh_chat', 'quy_mo', 'nguon_kenh', 'nhom_noi_dung', 'don_vi_tinh'],
  khoaRong: ['ten_chi_tieu', 'doi_tuong_thong_ke', 'loai_hinh', 'tinh_chat', 'quy_mo', 'nguon_kenh', 'nhom_noi_dung'], tach: 'nhom_chi_tieu', cap: ['nhom_chi_tieu', 'doi_tuong_thong_ke', 'loai_hinh', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'sl', theo: ['nhom_chi_tieu', 'ten_chi_tieu', 'doi_tuong_thong_ke', 'loai_hinh', 'tinh_chat', 'quy_mo', 'nguon_kenh', 'nhom_noi_dung', 'don_vi_tinh'] },
  chi: {
    sl: { motDong: true, l: XL('vh', 'so_luong'), loai: 'tuy', c: 'so_luong', td: { doi_tuong_thong_ke: XA_VH_TD }, dvt: true },
    kp: { l: XL('vh', 'kinh_phi_doanh_thu'), loai: 'cong', c: 'kinh_phi_doanh_thu' }, ng: { l: XL('vh', 'so_nguoi_tham_gia'), loai: 'cong', c: 'so_nguoi_tham_gia', u: 'người' },
    tin: { l: 'Số tin/bài truyền thông', loai: 'cong', c: 'so_luong', loc: { doi_tuong_thong_ke: XA_VH_TT, don_vi_tinh: ['tin_bai'] }, u: 'tin/bài' },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' }
  },
  cot: ['sl', 'kp', 'ng'],
  bieu: [{ loai: 'cot', t: 'Số người tham gia theo nhóm chỉ tiêu', theo: 'nhom_chi_tieu', m: 'ng' }, { loai: 'cot', t: 'Kinh phí/doanh thu theo nhóm chỉ tiêu', theo: 'nhom_chi_tieu', m: 'kp' },
    { loai: 'dong', t: 'Số lượng từng dòng số liệu', m: 'sl' }, { loai: 'cot', t: 'Số người tham gia theo quy mô', theo: 'quy_mo', m: 'ng' }, { loai: 'cot', t: 'Số người tham gia theo tính chất', theo: 'tinh_chat', m: 'ng' },
    { loai: 'cot', t: 'Tin/bài theo mức độ lan tỏa', theo: 'muc_do_lan_toa', m: 'tin', nhom: ['truyen_thong_bao_chi_mang_xa_hoi'] }, { loai: 'cot', t: 'Tin/bài theo mức độ quan tâm', theo: 'muc_do_quan_tam', m: 'tin', nhom: ['truyen_thong_bao_chi_mang_xa_hoi'] },
    { loai: 'xu', t: 'Số người tham gia qua các kỳ', m: 'ng', nhom: [] }],
  kt: [XA_KT_DVT('so_luong')],
  luuY: '«Số lượng» của di tích, di sản, nghệ nhân, thiết chế, CLB, đơn vị nghệ thuật là số hiện có (bản cuối kỳ); còn lại cộng các kỳ. «Kinh phí/Doanh thu» hiện đúng tên trường, cộng theo dòng (bản đọc VH-2).'
};

/* ---------- 10. Nội vụ (XA_10) ---------- */
const xaNv = (pl, l, loai, nguoi) => ({ l: l, loai: loai, c: 'gia_tri', loc: Object.assign({ phan_loai_ket_qua: pl }, nguoi ? { don_vi_tinh: ['nguoi'] } : {}) });
const XA_EF_NV = {
  ef: 'xa_nv', ten: 'Nội vụ', banGhi: 'một số liệu nội vụ, lao động (tên chỉ tiêu do xã gõ) theo một «Đối tượng thống kê» và một «Phân loại/Kết quả» trong một kỳ',
  khoa: ['dia_ban', 'doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'don_vi_tinh'], tach: 'doi_tuong_thong_ke', cap: ['doi_tuong_thong_ke', 'phan_loai_ket_qua', 'ten_chi_tieu', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['doi_tuong_thong_ke', 'ten_chi_tieu', 'phan_loai_ket_qua', 'don_vi_tinh'] },
  chi: {
    gt: { motDong: true, l: XL('nv', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { phan_loai_ket_qua: ['tong_so', 'ke_hoach_giao'] }, dvt: true },
    bc: { l: 'Biên chế · Tổng số (người)', loai: 'td', c: 'gia_tri', loc: { doi_tuong_thong_ke: ['bien_che'], phan_loai_ket_qua: ['tong_so'], don_vi_tinh: ['nguoi'] }, u: 'người' },
    dong: { l: 'Dòng số liệu', loai: 'demkhoa', u: 'dòng' },
    tongSo: xaNv(['tong_so'], 'Tổng số (người)', 'td', true), trongKy: xaNv(['trong_ky'], 'Trong kỳ (người)', 'cong', true),
    phien: xaNv(['so_phien_giao_dich'], 'Số phiên giao dịch', 'cong'), luot: xaNv(['so_luot_nguoi_tham_gia'], 'Số lượt người tham gia', 'cong'),
    khg: Object.assign(xaNv(['ke_hoach_giao'], 'Kế hoạch giao', 'td'), { plan: true }), th: xaNv(['thuc_hien'], 'Thực hiện', 'cong'),
    tlTh: { l: 'Thực hiện so với kế hoạch giao (IOC tính)', loai: 'tyle', tu: 'th', mau: 'khg', vuot: true },
    phaiTra: xaNv(['so_phai_tra'], 'Số phải trả', 'cong'), daTra: xaNv(['so_da_tra'], 'Số đã trả', 'cong'), tlTra: { l: 'Đã trả so với phải trả (IOC tính)', loai: 'tyle', tu: 'daTra', mau: 'phaiTra' }
  },
  cot: ['gt'],
  bieu: [{ loai: 'cot', t: 'Tổng số (người) theo đối tượng thống kê', theo: 'doi_tuong_thong_ke', m: 'tongSo' }, { loai: 'cot', t: 'Biến động trong kỳ (người) theo đối tượng thống kê (thanh riêng, không cộng)', theo: 'doi_tuong_thong_ke', m: 'trongKy' },
    { loai: 'ds', t: 'Giao dịch việc làm', ms: ['phien', 'luot'], nhom: ['giao_dich_viec_lam'] }, { loai: 'dong', t: 'Giá trị từng dòng số liệu', m: 'gt' },
    { loai: 'xu', t: 'Biên chế (Tổng số) qua các kỳ', m: 'bc', nhom: [] }],
  kt: [{ l: 'Số đã trả lớn hơn số phải trả cùng kỳ', c: ['gia_tri'], f: (R, all) => R.phan_loai_ket_qua === 'so_da_tra' && xaCung(all, R, (x) => x.phan_loai_ket_qua === 'so_phai_tra' && x.doi_tuong_thong_ke === R.doi_tuong_thong_ke && x.ten_chi_tieu === R.ten_chi_tieu && x.don_vi_tinh === R.don_vi_tinh).some((x) => efNum(R.gia_tri) > efNum(x.gia_tri)) },
    XA_KT_NBC('ngay_thang', 1)],
  luuY: '«Phân loại/Kết quả» Tổng số lấy bản cuối kỳ; Kế hoạch giao là số kế hoạch (không so tăng giảm); còn lại cộng các tháng.'
};

/* ---------- 11. Kinh tế xã hội (XA_11) ---------- */
const XA_EF_KTXH = {
  ef: 'xa_ktxh', ten: 'Kinh tế xã hội', banGhi: 'một chỉ tiêu kinh tế – xã hội (tên do xã gõ) của một «Nhóm chỉ tiêu», «Phân nhóm», «Đơn vị chủ trì báo cáo» trong một kỳ',
  khoa: ['dia_ban', 'nhom_chi_tieu', 'phan_nhom', 'chi_tieu', 'don_vi_chu_tri_bao_cao', 'don_vi_tinh'], khoaRong: ['phan_nhom'], tach: 'nhom_chi_tieu', cap: ['nhom_chi_tieu', 'phan_nhom', 'chi_tieu'], dvt: 'don_vi_tinh', kyCuoi: true, chonDong: true,
  dong: { m: 'uoc', theo: ['nhom_chi_tieu', 'phan_nhom', 'chi_tieu', 'don_vi_chu_tri_bao_cao', 'don_vi_tinh'] },
  chi: {
    tpg: { motDong: true, l: XL('ktxh', 'thanh_pho_giao'), loai: 'td', c: 'thanh_pho_giao', dvt: true, plan: true }, kh: { motDong: true, l: XL('ktxh', 'kh_nam'), loai: 'td', c: 'kh_nam', dvt: true, plan: true },
    uoc: { motDong: true, l: XL('ktxh', 'uoc_thuc_hien_den_nay'), loai: 'td', c: 'uoc_thuc_hien_den_nay', dvt: true, ck: true },
    ht: { l: XL('ktxh', 'danh_gia_muc_do_hoan_thanh'), loai: 'nhap', c: 'danh_gia_muc_do_hoan_thanh', theo: ['chi_tieu', 'phan_nhom', 'don_vi_chu_tri_bao_cao', 'don_vi_tinh'], u: '%', vuot: true },
    htIoc: { motDong: true, l: 'Mức hoàn thành so với KH năm (IOC tính)', loai: 'tyle', tu: 'uoc', mau: 'kh', dvt: true, vuot: true, ck: true },
    n: { l: 'Số chỉ tiêu', loai: 'demkhoa', u: 'chỉ tiêu' }
  },
  cot: ['tpg', 'kh', 'uoc', 'ht', 'htIoc'],
  bieu: [{ loai: 'dong', t: 'Mức độ hoàn thành đã nhập từng chỉ tiêu (thấp đến cao)', m: 'ht', tang: true }, { loai: 'cot', t: 'Số chỉ tiêu theo nhóm', theo: 'nhom_chi_tieu', m: 'n' }],
  kt: [{ l: '«Đánh giá mức độ hoàn thành (%)» lệch IOC tính quá 0,1 điểm (bản đọc KTXH-1)', c: ['danh_gia_muc_do_hoan_thanh'], f: (R) => efNum(R.kh_nam) > 0 && xaLech(efNum(R.danh_gia_muc_do_hoan_thanh), Math.round(R.uoc_thuc_hien_den_nay / R.kh_nam * 1000) / 10) }],
  luuY: '«Thành phố Giao», «Kế hoạch năm» là số kế hoạch của eform: chỉ hiện, không so tăng giảm, không làm mốc chấm điểm. «Ước thực hiện đến nay» là lũy kế: xem quý, năm lấy bản cuối kỳ, so cùng kỳ năm trước.'
};

/* ---------- 12. MTTQ (XA_12) ---------- */
const XA_MT_TD = ['doanvien', 'socbcc', 'bienchetc', 'tonquy'];
/* ô số của Ủy ban MTTQ: một mã chỉ tiêu của nhóm «MẶT TRẬN TỔ QUỐC», bản ghi để trống «Phân loại/ Kết quả» — không cộng các tổ chức (Đoàn, Hội…),
   các phân loại, kết quả khác nhau (X7, rà soát 02/11/2026); số từng đoàn thể xem ở màn nhóm của đoàn thể. Cộng các «Đơn vị/Đoàn/Loại hình» theo bản đọc */
/* số của một mã chỉ tiêu ở từng tổ chức (biểu đồ theo «Nhóm tổ chức»: mỗi cột một tổ chức; màn từng tổ chức) — không có ở màn Tất cả nhóm */
const xaMtTc = (v) => ({ l: XDM('mttq', 'ten_chi_tieu', v), loai: XA_MT_TD.indexOf(v) >= 0 ? 'td' : 'cong', c: 'gia_tri', loc: { ten_chi_tieu: [v], phan_loai_ket_qua: [null] } });
const xaMt = (v) => ({ l: XDM('mttq', 'ten_chi_tieu', v) + ' · Mặt trận Tổ quốc', loai: XA_MT_TD.indexOf(v) >= 0 ? 'td' : 'cong', c: 'gia_tri', loc: { nhom_to_chuc: ['mttq'], ten_chi_tieu: [v], phan_loai_ket_qua: [null] } });
const XA_EF_MTTQ = {
  ef: 'xa_mttq', ten: 'Ủy ban MTTQ', banGhi: 'một chỉ tiêu của một «Nhóm tổ chức», có thể chi tiết «Đơn vị/Đoàn/Loại hình» và «Phân loại/ Kết quả», trong một kỳ',
  khoa: ['dia_ban', 'nhom_to_chuc', 'ten_chi_tieu', 'don_vi_doan_loai_hinh', 'phan_loai_ket_qua', 'don_vi_tinh'], khoaRong: ['don_vi_doan_loai_hinh', 'phan_loai_ket_qua'],
  tach: 'nhom_to_chuc', cap: ['nhom_to_chuc', 'ten_chi_tieu', 'don_vi_doan_loai_hinh', 'don_vi_tinh'], dvt: 'don_vi_tinh',
  dong: { m: 'gt', theo: ['nhom_to_chuc', 'ten_chi_tieu', 'don_vi_doan_loai_hinh', 'phan_loai_ket_qua', 'don_vi_tinh'] },
  chi: Object.assign({ gt: { motDong: true, l: XL('mttq', 'gia_tri'), loai: 'tuy', c: 'gia_tri', td: { ten_chi_tieu: XA_MT_TD }, dvt: true } },
    { doanvien: xaMt('doanvien'), giamsat: xaMt('giamsat'), phanbien: xaMt('phanbienxahoi'), hienmau: xaMt('hienmau'), mohinh: xaMt('mohinh'), tongthu: xaMt('tongthu'), tongchi: xaMt('tongchi'), tonquy: xaMt('tonquy') },
    { dvTc: xaMtTc('doanvien'), gsTc: xaMtTc('giamsat'), hmTc: xaMtTc('hienmau'), thuTc: xaMtTc('tongthu'), chiTc: xaMtTc('tongchi'), quyTc: xaMtTc('tonquy') }),
  cot: ['gt'],
  bieu: [{ loai: 'cot', t: 'Đoàn viên theo nhóm tổ chức (mỗi cột một tổ chức)', theo: 'nhom_to_chuc', m: 'dvTc' }, { loai: 'ds', t: 'Tổng thu, tổng chi, tồn quỹ', ms: ['thuTc', 'chiTc', 'quyTc'], chiNhom: true },
    { loai: 'cot', t: 'Giám sát theo nhóm tổ chức (mỗi cột một tổ chức)', theo: 'nhom_to_chuc', m: 'gsTc' }, { loai: 'cot', t: 'Hiến máu tình nguyện theo nhóm tổ chức (mỗi cột một tổ chức)', theo: 'nhom_to_chuc', m: 'hmTc' },
    { loai: 'dong', t: 'Giá trị từng dòng số liệu', m: 'gt' }, { loai: 'xu', t: 'Đoàn viên · Mặt trận Tổ quốc qua các kỳ', m: 'doanvien', nhom: [] }],
  kt: [XA_KT_DVT('gia_tri')],
  luuY: 'Đoàn viên, số CBCC, biên chế tổ chức, tồn quỹ lấy bản cuối kỳ; còn lại cộng các kỳ. Không tự tính tồn quỹ từ thu − chi (eform không có tồn đầu kỳ).'
};

/* ============================== 12 ĐƠN VỊ ============================== */
const xaDonVi = (id, role, ten, org, cfg, kpis, card) => ctmEformDonVi({
  id: id, role: role, level: 'xa', kyTu: '2025-07', kpiRec: true, laEform: true, eforms: [cfg],
  name: (ctx) => ctmXaLoc(ten, ctx), org: (ctx) => (ctx && ctx.xa ? 'Eform «' + EFK[cfg.ef].ten + '» · ' + ctmXaLoc(org, ctx) + ' ' + ctmXaOf(ctx.xa) : ''),
  kpis: kpis.map((m) => ({ ef: cfg.ef, m: m })), card: (card || kpis.slice(0, 3)).map((m) => cfg.ef + '_' + m)
});
xaDonVi('dangxa-eform', 'DANG', 'Đảng ủy phường', 'Đảng ủy', XA_EF_DANG, ['dong']);
xaDonVi('hdndxa-eform', 'HDND', 'Hội đồng nhân dân phường', 'HĐND', XA_EF_HDND, ['gs', 'kh', 'tx', 'dong']);
xaDonVi('ubndxa-hcc', 'UBND', 'Hành chính công', 'UBND', XA_EF_HCC, ['tuyen', 'tt', 'bcci', 'dh', 'qh', 'cdh', 'dqh', 'ktn'], ['tuyen', 'dh', 'dqh']);
xaDonVi('ubndxa-tcns', 'UBND', 'Tài chính - Ngân sách', 'UBND', XA_EF_TCNS, ['thu', 'chi', 'tlThu', 'tlChi', 'dn', 'htx']);
xaDonVi('ubndxa-qlvb', 'UBND', 'Quản lý văn bản', 'UBND', XA_EF_QLVB, ['den', 'di', 'chuaXl', 'dangXl', 'hoanTat']);
xaDonVi('ubndxa-gpmb', 'UBND', 'Giải phóng mặt bằng', 'UBND', XA_EF_GPMB, ['da', 'phai', 'dt', 'tlTh', 'ho', 'bg', 'tlBg', 'kpCt'], ['dt', 'tlTh', 'bg']);
xaDonVi('ubndxa-gd', 'UBND', 'Giáo dục', 'UBND', XA_EF_GD, ['hs', 'dong']);
xaDonVi('ubndxa-yte', 'UBND', 'Y tế', 'UBND', XA_EF_YTE, ['dong']);
xaDonVi('ubndxa-vh', 'UBND', 'Văn hóa', 'UBND', XA_EF_VH, ['ng', 'kp', 'dong']);
xaDonVi('ubndxa-nv', 'UBND', 'Nội vụ', 'UBND', XA_EF_NV, ['dong', 'tlTh', 'tlTra', 'phien', 'luot']);
xaDonVi('ubndxa-ktxh', 'UBND', 'Kinh tế xã hội', 'UBND', XA_EF_KTXH, ['n']);
xaDonVi('mttqxa-eform', 'MTTQ', 'Mặt trận Tổ quốc phường', 'Ủy ban MTTQ', XA_EF_MTTQ, ['doanvien', 'giamsat', 'phanbien', 'hienmau', 'mohinh', 'tongthu', 'tongchi', 'tonquy']);

/* ============================== MÀN NGOÀI TÀI KHOẢN XÃ, PHƯỜNG (bản đọc, câu CHUNG-3) ============================== */
const CTM_XA_SHORT = {
  'dangxa-eform': 'Đảng ủy', 'hdndxa-eform': 'HĐND', 'mttqxa-eform': 'Ủy ban MTTQ',
  'ubndxa-hcc': 'Hành chính công', 'ubndxa-tcns': 'Tài chính - Ngân sách', 'ubndxa-qlvb': 'Quản lý văn bản', 'ubndxa-gpmb': 'GPMB',
  'ubndxa-gd': 'Giáo dục', 'ubndxa-yte': 'Y tế', 'ubndxa-vh': 'Văn hóa', 'ubndxa-nv': 'Nội vụ', 'ubndxa-ktxh': 'Kinh tế xã hội'
};
const CTM_XA_EYE = (ctx) => 'Tổng quan · ' + (ctx && ctx.xa ? ctx.xa.name : 'xã, phường');
const CTM_XA_HINT = (ctx) => (ctx && ctx.xa ? 'Số liệu lấy từ 12 eform của ' + ctx.xa.name + (XA_EF_LA_MAU ? ' (đang là bản ghi mẫu)' : '') + ' · bấm ô để xem các bản ghi tạo ra số' : '');
const CTM_XA_AXES = [{ id: 'DANG', label: 'Đảng ủy phường', ax: 'Đảng ủy' }, { id: 'HDND', label: 'HĐND phường', ax: 'HĐND' }, { id: 'UBND', label: 'UBND phường', ax: 'UBND' }, { id: 'MTTQ', label: 'Ủy ban MTTQ phường', ax: 'MTTQ' }];
const XA_EF_OF = { 'dangxa-eform': 'xa_dang', 'hdndxa-eform': 'xa_hdnd', 'mttqxa-eform': 'xa_mttq', 'ubndxa-hcc': 'xa_hcc', 'ubndxa-tcns': 'xa_tcns', 'ubndxa-qlvb': 'xa_qlvb', 'ubndxa-gpmb': 'xa_gpmb',
  'ubndxa-gd': 'xa_gd', 'ubndxa-yte': 'xa_yte', 'ubndxa-vh': 'xa_vh', 'ubndxa-nv': 'xa_nv', 'ubndxa-ktxh': 'xa_ktxh' };
const xaOvK = (cat, m, l) => ({ cat: cat, m: XA_EF_OF[cat] + '_' + m, target: 'rec:' + efKeyM(XA_EF_OF[cat], m), l: l });
/* Ô số màn ngoài: đúng danh sách câu CHUNG-3 của bản đọc (duyệt 30/10/2026), không thêm, không bớt */
const XA_OV = {
  DANG: [xaOvK('dangxa-eform', 'dong', 'Đảng ủy · dòng số liệu đã nhập')],
  HDND: [xaOvK('hdndxa-eform', 'dong', 'HĐND · dòng số liệu đã nhập')],
  UBND: [xaOvK('ubndxa-hcc', 'tuyen'), xaOvK('ubndxa-hcc', 'dh'), xaOvK('ubndxa-hcc', 'dqh'), xaOvK('ubndxa-qlvb', 'den'), xaOvK('ubndxa-qlvb', 'di'),
    xaOvK('ubndxa-gpmb', 'dt'), xaOvK('ubndxa-gpmb', 'bg'), xaOvK('ubndxa-tcns', 'thu', 'Tổng thu NSNN (lũy kế)'), xaOvK('ubndxa-tcns', 'chi', 'Tổng chi NSNN (lũy kế)'),
    xaOvK('ubndxa-gd', 'dong', 'Giáo dục · dòng số liệu đã nhập'), xaOvK('ubndxa-yte', 'dong', 'Y tế · dòng số liệu đã nhập'), xaOvK('ubndxa-vh', 'dong', 'Văn hóa · dòng số liệu đã nhập'),
    xaOvK('ubndxa-nv', 'dong', 'Nội vụ · dòng số liệu đã nhập'), xaOvK('ubndxa-ktxh', 'n', 'Kinh tế xã hội · dòng số liệu đã nhập')],
  MTTQ: [xaOvK('mttqxa-eform', 'doanvien', 'Đoàn viên · Mặt trận Tổ quốc')]
};
ctmRegisterOverview({
  id: 'xa-4truc', roles: ['DANG', 'HDND', 'UBND', 'MTTQ'], level: 'xa', unitWord: 'eform', rename: ctmXaLoc, short: CTM_XA_SHORT,
  eyebrow: CTM_XA_EYE, hint: CTM_XA_HINT,
  title: (n) => 'Số liệu then chốt của 4 trục, ' + n + ' eform',
  groupTitle: 'Bốn trục · bấm một trục để lọc danh sách eform bên dưới',
  kpis: XA_OV.UBND.concat(XA_OV.MTTQ, XA_OV.DANG, XA_OV.HDND),
  groups: CTM_XA_AXES.map((a) => ({ id: a.id, label: a.label, role: a.id, ax: a.ax }))
});
/* Từng tab trục của tài khoản xã, phường: cùng màn ngoài, không chia nhóm */
CTM_XA_AXES.forEach((A) => {
  ctmRegisterOverview({
    id: 'xa-' + A.id, roles: [A.id], level: 'xa', unitWord: 'eform', rename: ctmXaLoc, short: CTM_XA_SHORT, ax: A.ax,
    eyebrow: (ctx) => CTM_XA_EYE(ctx) + ' · ' + ctmXaLoc(A.label, ctx), hint: CTM_XA_HINT,
    title: (n) => 'Số liệu then chốt của ' + n + ' eform',
    kpis: XA_OV[A.id], groups: []
  });
});
