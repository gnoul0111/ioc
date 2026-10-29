/* ============================== 12 SỞ, NGÀNH THEO EFORM — 7 SỞ CÒN LẠI (đợt 2, 3) ==============================
   KH&CN, Xây dựng, Dân tộc và Tôn giáo, Y tế, VH, TT và Du lịch (gồm 2 eform Sở Du lịch), Ban QL khu CNC và KCN. Dựng theo bản đọc
   eform đã duyệt 28/10/2026 (docs/BAN_DOC_EFORM/SO_KHCN, SO_XAY_DUNG, SO_DTTG, SO_Y_TE, SO_VHTT, SO_DU_LICH, SO_BQL_KCNC; anh trả lời
   "theo đề xuất") và quy ước 28/10/2026 (AGENTS.md). Khai báo đè mã đơn vị cũ của js/features/ctm-so.js — khai báo cũ giữ nguyên;
   đặt SO_EFORM_DOT23 = false (js/core/central-level.js) là về như cũ. Nạp SAU ctm-so-eform.js (dùng efMa, efDong). */
const SO_EF2_BAT = typeof SO_EFORM_DOT23 === 'undefined' ? true : SO_EFORM_DOT23;
const SO_GOP_DL = typeof UBND_SAP_XEP_SO_2026 === 'undefined' ? true : UBND_SAP_XEP_SO_2026;
const efNhap = (ef, c, theo) => ({ l: efL(ef, c) + ' đã nhập', loai: 'nhap', c: c, u: '%', theo: theo });
/* Một cặp tử – mẫu có trường tỷ lệ đơn vị đã nhập: tổng, số đạt (td | cong), tỷ lệ IOC tính, tỷ lệ đã nhập */
function efCap(ef, ma, tong, so, tl, loai) {
  const o = {};
  o['t' + ma] = { l: efL(ef, tong), loai: loai, c: tong };
  o['s' + ma] = { l: efL(ef, so), loai: loai, c: so };
  o['tl' + ma] = { l: efL(ef, tl).replace(/\s*\(%\)\s*$/, '') + ' (IOC tính)', loai: 'tyle', tu: 's' + ma, mau: 't' + ma };
  o['n' + ma] = efNhap(ef, tl);
  return o;
}
const efKtCap = (ef, pairs) => [{ l: 'Số "có" lớn hơn số "tổng" tương ứng', c: pairs.map((p) => p[1]), f: (R) => pairs.some((p) => efDong(R[p[1]], R[p[0]])) },
  { l: 'Tỷ lệ đã nhập lệch số ÷ tổng × 100 quá 0,1 điểm', c: pairs.map((p) => p[2]), f: (R) => pairs.some((p) => efTyleSai(R[p[2]], R[p[1]], R[p[0]])) }];
/* đếm xã, phường có giá trị «Có» ở một trường Có/Không */
const efCoXa = (ef, c, l) => ({ l: l, loai: 'demkhac', c: 'dia_ban', loc: { [c]: [efMa(ef, c, 'Có')] }, u: 'xã, phường' });
const efNgaySai = (a, b) => ({ l: '«' + 'Ngày kết thúc' + '» trước «Ngày bắt đầu»', c: [b], f: (R) => efSauHan(R[a], R[b]) });

/* ============================== SỞ KHOA HỌC VÀ CÔNG NGHỆ ============================== */
const KHCN_KHOA = { khoa: ['dia_ban', 'loai_doi_tuong', 'ten_doi_tuong'], khoaRong: ['loai_doi_tuong', 'ten_doi_tuong'], cap: ['dia_ban', 'loai_doi_tuong'], xaTruong: 'dia_ban' };
const KHCN1_P = [['tong_so_ho_gia_dinh_ma9', 'so_ho_co_internet_cap_quang_ma9', 'ty_le_ma9'], ['dan_so_tu_15_tuoi_ma42', 'so_nguoi_dung_smartphone_ma42', 'ty_le_ma42']];
const EF_KHCN1 = Object.assign({
  ef: 'khcn1', ten: 'Hạ tầng và thiết bị số', banGhi: 'số liệu chuyển đổi số của một xã, phường (có thể theo «Loại đối tượng», «Tên đối tượng») trong một kỳ', kyCuoi: true, xaChi: ['tl9', 'tl42'],
  luuY: 'Số tại thời điểm: xem quý, năm thì mỗi xã, phường lấy bản kỳ cuối. Tỷ lệ đơn vị đã nhập hiện đúng số khi dòng là một bản ghi; IOC tính thêm từ tử số, mẫu số.',
  chi: Object.assign({}, efCap('khcn1', 9, ...KHCN1_P[0], 'cong'), efCap('khcn1', 42, ...KHCN1_P[1], 'cong'), {
    c10: efCoXa('khcn1', 'co_ket_noi_internet_cap_quang_ma10', 'Xã, phường có Internet cáp quang (mã 10)'), c12: efCoXa('khcn1', 'da_dap_ung_ha_tang_cntt_giao_ban_ma12', 'Xã, phường đáp ứng hạ tầng giao ban (mã 12)'),
    c45: efCoXa('khcn1', 'co_wifi_cong_cong_mien_phi_ma45', 'Xã, phường có wifi công cộng (mã 45)'), c13: efCoXa('khcn1', 'co_phuc_vu_dvc_truc_tuyen_ma13', 'Xã, phường phục vụ DVC trực tuyến (mã 13)') }),
  cot: ['t9', 's9', 'tl9', 'n9', 't42', 's42', 'tl42', 'n42'], the: ['tl9', 'tl42', 'c10', 'c45'],
  bieu: [{ loai: 'ds', t: 'Hai tỷ lệ (IOC tính)', ms: ['tl9', 'tl42'] }, { loai: 'ds', t: 'Số xã, phường đạt 4 tiêu chí hạ tầng', ms: ['c10', 'c12', 'c45', 'c13'] }, { loai: 'xu', t: 'Tỷ lệ hộ có Internet cáp quang qua các kỳ', m: 'tl9' }],
  kt: efKtCap('khcn1', KHCN1_P)
}, KHCN_KHOA);
const KHCN2_P = [['dan_so_ma48', 'so_nguoi_dung_dvc_truc_tuyen_ma48', 'ty_le_ma48'], ['dan_so_tu_14_tuoi_ma40', 'so_nguoi_co_danh_tinh_dien_tu_ma40', 'ty_le_ma40'], ['dan_so_truong_thanh_ma41', 'so_nguoi_co_chu_ky_so_ma41', 'ty_le_ma41'],
  ['dan_so_ma19', 'so_nguoi_pho_cap_ky_nang_so_ma19', 'ty_le_ma19'], ['tong_cbccvc_ma21', 'so_tham_gia_lop_attt_ma21', 'ty_le_ma21']];
const EF_KHCN2 = Object.assign({
  ef: 'khcn2', ten: 'Con người và cộng đồng số', banGhi: 'số liệu chuyển đổi số của một xã, phường (có thể theo «Loại đối tượng», «Tên đối tượng») trong một kỳ', kyCuoi: true, xaChi: ['tl48', 'tl41', 'tl21'],
  luuY: 'Số tại thời điểm: xem quý, năm thì mỗi xã, phường lấy bản kỳ cuối. Tỷ lệ đơn vị đã nhập hiện đúng số khi dòng là một bản ghi; IOC tính thêm từ tử số, mẫu số.',
  chi: Object.assign({}, ...[48, 40, 41, 19, 21].map((ma, i) => efCap('khcn2', ma, ...KHCN2_P[i], 'cong')), {
    c14: efCoXa('khcn2', 'co_to_cds_cong_dong_ma14', 'Xã, phường có Tổ CĐS cộng đồng (mã 14)'), c15: efCoXa('khcn2', 'co_doi_ho_tro_cds_phan_ung_nhanh_ma15', 'Xã, phường có Đội hỗ trợ CĐS (mã 15)'),
    c8: efCoXa('khcn2', 'co_mo_hinh_khuyen_khich_dvc_tt_ma8', 'Xã, phường có mô hình khuyến khích DVC (mã 8)') }),
  cot: ['tl48', 'n48', 'tl40', 'n40', 'tl41', 'n41', 'tl19', 'n19', 'tl21', 'n21'], the: ['tl48', 'tl41', 'tl19', 'tl21'],
  bieu: [{ loai: 'ds', t: 'Năm tỷ lệ (IOC tính)', ms: ['tl48', 'tl40', 'tl41', 'tl19', 'tl21'] }, { loai: 'ds', t: 'Số xã, phường đạt 3 tiêu chí', ms: ['c14', 'c15', 'c8'] }, { loai: 'xu', t: 'Tỷ lệ có chữ ký số qua các kỳ', m: 'tl41' }],
  kt: efKtCap('khcn2', KHCN2_P)
}, KHCN_KHOA);
const KHCN3_P = [['tong_ho_so_nghia_vu_tai_chinh_ma50', 'so_ho_so_thanh_toan_truc_tuyen_ma50', 'ty_le_ma50'], ['tong_van_ban_ho_so_noi_bo_ma27', 'so_xu_ly_tren_moi_truong_mang_ma27', 'ty_le_ma27'],
  ['tong_van_ban_trao_doi_cqnn_ma28', 'so_van_ban_dien_tu_ky_so_ma28', 'ty_le_ma28']];
const EF_KHCN3 = Object.assign({
  ef: 'khcn3', ten: 'Văn bản, quy trình và dịch vụ công', banGhi: 'số liệu hồ sơ, văn bản của một xã, phường (có thể theo «Loại đối tượng», «Tên đối tượng») trong một kỳ', xaChi: ['tt', 'tl27'],
  luuY: 'Hồ sơ, văn bản, hội nghị là số phát sinh trong kỳ (cộng). Mã 25/49 không có trường số hồ sơ toàn trình: gộp nhiều xã thì IOC tính bình quân tỷ lệ theo tổng hồ sơ.',
  chi: Object.assign({
    hs: { l: efL('khcn3', 'tong_ho_so_tthc_tiep_nhan_ma25_49'), loai: 'cong', c: 'tong_ho_so_tthc_tiep_nhan_ma25_49' },
    tt: { l: 'Tỷ lệ hồ sơ trực tuyến toàn trình - mã 25/49 (IOC tính)', loai: 'bqts', c: 'ty_le_ma25_49', w: 'tong_ho_so_tthc_tiep_nhan_ma25_49' },
    ntt: efNhap('khcn3', 'ty_le_ma25_49') }, ...[50, 27, 28].map((ma, i) => efCap('khcn3', ma, ...KHCN3_P[i], 'cong')), {
    c37: efCoXa('khcn3', 'co_chap_nhan_thanh_toan_khong_tien_mat_ma37', 'Xã, phường chấp nhận thanh toán không tiền mặt (mã 37)'), c29: efCoXa('khcn3', 'co_tro_ly_ao_ma29', 'Xã, phường có trợ lý ảo (mã 29)'),
    hn: { l: efL('khcn3', 'so_hoi_nghi_to_chuc_trong_ky_ma5'), loai: 'cong', c: 'so_hoi_nghi_to_chuc_trong_ky_ma5' } }),
  cot: ['hs', 'tt', 'ntt', 'tl50', 'n50', 'tl27', 'n27', 'tl28', 'n28', 'hn'], the: ['tt', 'tl50', 'tl27', 'tl28'],
  bieu: [{ loai: 'ds', t: 'Bốn tỷ lệ (IOC tính)', ms: ['tt', 'tl50', 'tl27', 'tl28'] }, { loai: 'ds', t: 'Số xã, phường đạt 2 tiêu chí', ms: ['c37', 'c29'] }, { loai: 'xu', t: 'Tổng hồ sơ TTHC qua các kỳ', m: 'hs' }],
  kt: efKtCap('khcn3', KHCN3_P)
}, KHCN_KHOA);

/* ============================== SỞ XÂY DỰNG ============================== */
const SXD1_TT = (l) => [efMa('sxd1', 'tinh_trang_cong_trinh', l)];
const efSxd1 = (l, loai, c, tt, u) => ({ l: l, loai: loai, c: c, loc: { tinh_trang_cong_trinh: SXD1_TT(tt) }, u: u });
const EF_SXD1 = {
  ef: 'sxd1', ten: 'Nhà ở', banGhi: 'số công trình nhà ở theo «Loại công trình» × «Loại nhà ở» × «Tình trạng công trình» của một xã, phường trong một kỳ',
  khoa: ['don_vi_bao_cao', 'loai_cong_trinh', 'loai_nha_o', 'tinh_trang_cong_trinh'], cap: ['tinh_trang_cong_trinh', 'loai_cong_trinh', 'loai_nha_o'], xaTruong: 'don_vi_bao_cao', xaChi: ['ctCp', 'sanHt'],
  luuY: 'Đã cấp phép, đã hoàn thành, đưa vào sử dụng: số phát sinh trong kỳ (cộng). Đang thi công: số tại thời điểm (xem quý, năm lấy kỳ cuối). «Số tầng» hiện đúng số đã nhập, không cộng.',
  chi: {
    ctCp: efSxd1('Công trình đã cấp phép', 'cong', 'so_luong_cong_trinh', 'Đã cấp phép', 'công trình'), ctTc: efSxd1('Công trình đang thi công', 'td', 'so_luong_cong_trinh', 'Đang thi công', 'công trình'),
    ctHt: efSxd1('Công trình đã hoàn thành', 'cong', 'so_luong_cong_trinh', 'Đã hoàn thành', 'công trình'), ctSd: efSxd1('Công trình đưa vào sử dụng', 'cong', 'so_luong_cong_trinh', 'Đưa vào sử dụng', 'công trình'),
    sanHt: efSxd1('Diện tích sàn hoàn thành (m²)', 'cong', 'tong_dien_tich_san_m2', 'Đã hoàn thành', 'm²'), sanCp: efSxd1('Diện tích sàn cấp phép (m²)', 'cong', 'tong_dien_tich_san_m2', 'Đã cấp phép', 'm²'),
    xdHt: efSxd1('Diện tích xây dựng hoàn thành (m²)', 'cong', 'tong_dien_tich_xay_dung_m2', 'Đã hoàn thành', 'm²'),
    tang: { l: efL('sxd1', 'so_tang') + ' đã nhập', loai: 'nhap', c: 'so_tang', u: 'tầng' }
  },
  cot: ['ctCp', 'ctTc', 'ctHt', 'ctSd', 'sanCp', 'sanHt', 'tang'], the: ['ctCp', 'ctHt', 'sanHt', 'ctTc'],
  bieu: [{ loai: 'cot', t: 'Diện tích sàn hoàn thành theo loại nhà ở', theo: 'loai_nha_o', m: 'sanHt' }, { loai: 'cot', t: 'Công trình cấp phép theo loại công trình', theo: 'loai_cong_trinh', m: 'ctCp' },
    { loai: 'xu', t: 'Diện tích sàn hoàn thành qua các kỳ', m: 'sanHt' }],
  kt: [{ l: '«Tổng diện tích sàn» nhỏ hơn «Tổng diện tích xây dựng» khi số tầng từ 1 trở lên', c: ['tong_dien_tich_san_m2'], f: (R) => efNum(R.so_tang) >= 1 && efDong(R.tong_dien_tich_xay_dung_m2, R.tong_dien_tich_san_m2) }]
};
const EF_SXD2 = {
  ef: 'sxd2', ten: 'Vận tải hành khách', banGhi: 'số liệu vận tải hành khách theo «Ngành vận tải» × «Loại hình vận tải» của một xã, phường trong một kỳ',
  khoa: ['don_vi_bao_cao', 'nganh_van_tai', 'loai_hinh_van_tai'], cap: ['nganh_van_tai', 'loai_hinh_van_tai'], xaTruong: 'don_vi_bao_cao', xaChi: ['hk'],
  luuY: 'Hành khách.km: dùng số đã nhập; bản ghi để trống thì IOC tính lượt hành khách × cự ly bình quân. Eform không có trường tên doanh nghiệp: số theo xã, phường.',
  chi: {
    hk: { l: efL('sxd2', 'so_luot_hanh_khach_van_chuyen_hk'), loai: 'cong', c: 'so_luot_hanh_khach_van_chuyen_hk', u: 'lượt' },
    hkkm: { l: 'Hành khách.km', loai: 'congtich', c: 'hanh_khach_km_tu_tinh', a: 'so_luot_hanh_khach_van_chuyen_hk', b: 'cu_ly_van_chuyen_binh_quan_km', u: 'HK.km' },
    cl: { l: 'Cự ly bình quân (IOC tính)', loai: 'thuong', tu: 'hkkm', mau: 'hk', u: 'km', d: 1 },
    clN: { l: efL('sxd2', 'cu_ly_van_chuyen_binh_quan_km') + ' đã nhập', loai: 'nhap', c: 'cu_ly_van_chuyen_binh_quan_km', u: 'km' }
  },
  cot: ['hk', 'hkkm', 'cl', 'clN'], the: ['hk', 'hkkm', 'cl'],
  bieu: [{ loai: 'cot', t: 'Lượt hành khách theo ngành vận tải', theo: 'nganh_van_tai', m: 'hk' }, { loai: 'cot', t: 'Lượt hành khách theo loại hình vận tải', theo: 'loai_hinh_van_tai', m: 'hk' }, { loai: 'xu', t: 'Lượt hành khách qua các kỳ', m: 'hk' }],
  kt: [{ l: '«Hành khách.km (tự tính)» lệch lượt × cự ly quá 1%', c: ['hanh_khach_km_tu_tinh'], f: (R) => { const x = efNum(R.hanh_khach_km_tu_tinh), p = efNum(R.so_luot_hanh_khach_van_chuyen_hk) != null && efNum(R.cu_ly_van_chuyen_binh_quan_km) != null ? R.so_luot_hanh_khach_van_chuyen_hk * R.cu_ly_van_chuyen_binh_quan_km : null; return x != null && p ? Math.abs(x - p) > p * 0.01 : false; } }]
};
const SXD_SO = (ef) => ({ c: 'cap_bao_cao', v: efMa(ef, 'cap_bao_cao', 'Sở/Ngành') });
const EF_SXD3 = {
  ef: 'sxd3', ten: 'Điểm nguy cơ sạt lở, úng ngập', banGhi: 'một điểm nguy cơ («Tên tuyến đường» + «Tên vị trí / Địa điểm») của một xã, phường tại thời điểm báo cáo', kyCuoi: true,
  khoa: ['don_vi_bao_cao', 'ten_tuyen_duong', 'ten_vi_tri_dia_diem'], cap: ['loai_nguy_co', 'ten_tuyen_duong'], xaTruong: 'don_vi_bao_cao', xaChi: ['diem', 'cao'],
  uuTien: Object.assign(SXD_SO('sxd3'), { theo: ['don_vi_bao_cao', '_kyId'] }),
  luuY: 'Mỗi điểm đếm một lần: xem quý, năm lấy bản báo cáo cuối của điểm. Cùng xã, cùng kỳ có bản Sở/Ngành thì dùng bản Sở/Ngành.',
  chi: {
    diem: { l: 'Số điểm nguy cơ', loai: 'dem', u: 'điểm' },
    cao: { l: 'Điểm mức Cao, Rất cao', loai: 'dembang', c: 'muc_do_nguy_co', v: ['Cao', 'Rất cao'].map((l) => efMa('sxd3', 'muc_do_nguy_co', l)), u: 'điểm' },
    chua: { l: 'Điểm chưa xử lý', loai: 'dembang', c: 'trang_thai_xu_ly', v: [efMa('sxd3', 'trang_thai_xu_ly', 'Chưa xử lý')], u: 'điểm' },
    dxl: { l: 'Điểm đã xử lý', loai: 'dembang', c: 'trang_thai_xu_ly', v: [efMa('sxd3', 'trang_thai_xu_ly', 'Đã xử lý')], u: 'điểm' },
    cd: { l: efL('sxd3', 'chieu_dai_anh_huong_m'), loai: 'cong', c: 'chieu_dai_anh_huong_m' }
  },
  cot: ['diem', 'cao', 'chua', 'dxl', 'cd'], the: ['diem', 'cao', 'chua', 'cd'],
  bieu: [{ loai: 'chong', t: 'Điểm theo loại nguy cơ', theo: 'loai_nguy_co', m: 'diem' }, { loai: 'cot', t: 'Điểm theo mức độ nguy cơ', theo: 'muc_do_nguy_co', m: 'diem' },
    { loai: 'chong', t: 'Điểm theo trạng thái xử lý', theo: 'trang_thai_xu_ly', m: 'diem' }, { loai: 'xu', t: 'Số điểm nguy cơ qua các kỳ', m: 'diem' }],
  kt: [{ l: 'Đã xử lý mà «Mức độ nguy cơ» để trống', c: ['muc_do_nguy_co'], f: (R) => R.trang_thai_xu_ly === efMa('sxd3', 'trang_thai_xu_ly', 'Đã xử lý') && !R.muc_do_nguy_co }]
};
const SXD4_DT = (l) => ({ doi_tuong_van_chuyen: [efMa('sxd4', 'doi_tuong_van_chuyen', l)] });
const EF_SXD4 = {
  ef: 'sxd4', ten: 'Vận chuyển, luân chuyển', banGhi: 'khối lượng vận chuyển, luân chuyển theo «Đối tượng vận chuyển» × «Loại hình vận tải» của một xã, phường trong một kỳ',
  khoa: ['dia_ban', 'cap_bao_cao', 'doi_tuong_van_chuyen', 'loai_hinh_van_tai'], cap: ['doi_tuong_van_chuyen', 'loai_hinh_van_tai'], dvt: 'doi_tuong_van_chuyen', xaTruong: 'dia_ban', xaChi: ['hkVc', 'hhVc'],
  uuTien: Object.assign(SXD_SO('sxd4'), { theo: ['dia_ban', '_kyId'] }),
  luuY: 'Không cộng hành khách với hàng hóa (đơn vị khác nhau). Cùng xã, cùng kỳ có bản Sở/Ngành thì dùng bản Sở/Ngành.',
  chi: {
    vc: { l: efL('sxd4', 'khoi_luong_van_chuyen_hanh_khach_hoac_tan'), loai: 'cong', c: 'khoi_luong_van_chuyen_hanh_khach_hoac_tan', dvt: true },
    lc: { l: efL('sxd4', 'khoi_luong_luan_chuyen_hanh_khach_km_hoac_tan_km'), loai: 'cong', c: 'khoi_luong_luan_chuyen_hanh_khach_km_hoac_tan_km', dvt: true },
    hkVc: { l: 'Hành khách vận chuyển', loai: 'cong', c: 'khoi_luong_van_chuyen_hanh_khach_hoac_tan', loc: SXD4_DT('Hành khách'), u: 'lượt' },
    hkLc: { l: 'Hành khách luân chuyển', loai: 'cong', c: 'khoi_luong_luan_chuyen_hanh_khach_km_hoac_tan_km', loc: SXD4_DT('Hành khách'), u: 'HK.km' },
    hhVc: { l: 'Hàng hóa vận chuyển', loai: 'cong', c: 'khoi_luong_van_chuyen_hanh_khach_hoac_tan', loc: SXD4_DT('Hàng hóa'), u: 'tấn' },
    hhLc: { l: 'Hàng hóa luân chuyển', loai: 'cong', c: 'khoi_luong_luan_chuyen_hanh_khach_km_hoac_tan_km', loc: SXD4_DT('Hàng hóa'), u: 'tấn.km' }
  },
  cot: ['vc', 'lc'], the: ['hkVc', 'hkLc', 'hhVc', 'hhLc'],
  bieu: [{ loai: 'cot', t: 'Hành khách vận chuyển theo loại hình', theo: 'loai_hinh_van_tai', m: 'hkVc' }, { loai: 'cot', t: 'Hàng hóa vận chuyển theo loại hình', theo: 'loai_hinh_van_tai', m: 'hhVc' },
    { loai: 'xu', t: 'Hàng hóa vận chuyển qua các kỳ', m: 'hhVc' }],
  kt: []
};

/* ============================== SỞ DÂN TỘC VÀ TÔN GIÁO ============================== */
const DT_KPS = (c) => [efMa('dttg1', c, 'Không phát sinh')];
const efVung = (c) => ({ l: efL('dttg1', c), loai: 'motlan', c: c, theo: ['dia_ban'] });
const DTTG_VUNG = [['so_ho_dtts', 'so_ho_dtts_dung_nuoc_hvs', 'ty_le_ho_dtts_dung_nuoc_hvs'], ['so_dia_ban_co_duong_o_to_den_trung_tam', 'so_dia_ban_da_cung_hoa', 'ty_le_duong_trung_tam_cung_hoa'],
  ['so_hs_trong_do_tuoi', 'so_hs_di_hoc_dung_cap', 'ty_le_hs_di_hoc_dung_cap']];
const EF_DTTG1 = {
  ef: 'dttg1', ten: 'CTMTQG vùng đồng bào DTTS và miền núi', banGhi: 'một dự án, tiểu dự án, hoạt động hoặc công trình theo một «Nguồn vốn» tại một xã, phường (có thể đến thôn) trong một kỳ',
  khoa: ['dia_ban', 'thon_tdp', 'ten_du_an_hoat_dong', 'loai_ban_ghi', 'nguon_von'], khoaRong: ['thon_tdp'], cap: ['du_an_thanh_phan_noi_dung', 'ten_du_an_hoat_dong'], xaTruong: 'dia_ban', xaChi: ['gnlk', 'tlKh', 'tlNuoc'],
  bo: { loai_ban_ghi: DT_KPS('loai_ban_ghi'), trang_thai_trien_khai: DT_KPS('trang_thai_trien_khai'), nguon_von: DT_KPS('nguon_von') },
  luuY: 'Cộng mọi loại bản ghi (dự án, tiểu dự án, công trình): eform không có trường nối bản con với bản cha. Kế hoạch, phân bổ, giải ngân lũy kế, vốn đình trệ lấy kỳ cuối; giải ngân kỳ này cộng. Kết quả vùng (hộ DTTS, đường, học sinh, hộ nghèo) là số của cả xã: lấy một lần mỗi xã.',
  chi: {
    da: { l: 'Số dự án, tiểu dự án, công trình', loai: 'dem' },
    kh: { l: efL('dttg1', 'ke_hoach_von_nam_trieu_dong'), loai: 'td', c: 'ke_hoach_von_nam_trieu_dong' }, pb: { l: efL('dttg1', 'von_duoc_phan_bo_trieu_dong'), loai: 'td', c: 'von_duoc_phan_bo_trieu_dong' },
    gnk: { l: efL('dttg1', 'giai_ngan_ky_nay_trieu_dong'), loai: 'cong', c: 'giai_ngan_ky_nay_trieu_dong' }, gnlk: { l: efL('dttg1', 'giai_ngan_luy_ke_trieu_dong'), loai: 'td', c: 'giai_ngan_luy_ke_trieu_dong' },
    tlKh: { l: 'Tỷ lệ giải ngân so kế hoạch (IOC tính)', loai: 'tyle', tu: 'gnlk', mau: 'kh' }, tlPb: { l: 'Tỷ lệ giải ngân so phân bổ (IOC tính)', loai: 'tyle', tu: 'gnlk', mau: 'pb' },
    nKh: efNhap('dttg1', 'ty_le_giai_ngan_ke_hoach', ['dia_ban', 'thon_tdp', 'ten_du_an_hoat_dong', 'loai_ban_ghi', 'nguon_von']), nPb: efNhap('dttg1', 'ty_le_giai_ngan_phan_bo', ['dia_ban', 'thon_tdp', 'ten_du_an_hoat_dong', 'loai_ban_ghi', 'nguon_von']),
    dt: { l: efL('dttg1', 'von_dinh_tre_phap_ly_tthc_trieu_dong'), loai: 'td', c: 'von_dinh_tre_phap_ly_tthc_trieu_dong' },
    vp: { l: efL('dttg1', 'so_vu_vi_pham_sai_pham'), loai: 'cong', c: 'so_vu_vi_pham_sai_pham' },
    dung: { l: 'Đúng tiến độ', loai: 'dembang', c: 'dung_tien_do', v: [efMa('dttg1', 'dung_tien_do', 'Có')] },
    dinhTre: { l: 'Đình trệ, tạm dừng', loai: 'dembang', c: 'trang_thai_trien_khai', v: ['Đình trệ', 'Tạm dừng'].map((l) => efMa('dttg1', 'trang_thai_trien_khai', l)) },
    hoDtts: efVung('so_ho_dtts'), hoNuoc: efVung('so_ho_dtts_dung_nuoc_hvs'), dCo: efVung('so_dia_ban_co_duong_o_to_den_trung_tam'), dCung: efVung('so_dia_ban_da_cung_hoa'),
    hsTuoi: efVung('so_hs_trong_do_tuoi'), hsDung: efVung('so_hs_di_hoc_dung_cap'), ngDau: efVung('so_ho_ngheo_dau_ky'), ngCuoi: efVung('so_ho_ngheo_cuoi_ky'),
    tlNuoc: { l: 'Tỷ lệ hộ DTTS dùng nước HVS (IOC tính)', loai: 'tyle', tu: 'hoNuoc', mau: 'hoDtts' }, tlDuong: { l: 'Tỷ lệ đường trung tâm cứng hóa (IOC tính)', loai: 'tyle', tu: 'dCung', mau: 'dCo' },
    tlHs: { l: 'Tỷ lệ HS đi học đúng cấp (IOC tính)', loai: 'tyle', tu: 'hsDung', mau: 'hsTuoi' }, giam: { l: 'Hộ nghèo giảm (IOC tính)', loai: 'hieu', a: 'ngDau', b: 'ngCuoi', u: 'hộ' },
    tlGiam: { l: 'Tỷ lệ giảm hộ nghèo (IOC tính)', loai: 'tyle', tu: 'giam', mau: 'ngDau' }
  },
  cot: ['da', 'kh', 'pb', 'gnk', 'gnlk', 'tlKh', 'nKh', 'dt'], the: ['gnlk', 'tlKh', 'da', 'dinhTre'],
  bang: [{ t: 'Kết quả vùng đồng bào theo xã, phường (lấy một lần mỗi xã)', cap: ['dia_ban'], cot: ['hoDtts', 'tlNuoc', 'dCo', 'tlDuong', 'hsTuoi', 'tlHs', 'ngDau', 'tlGiam'] }],
  bieu: [{ loai: 'cot', t: 'Giải ngân lũy kế theo nguồn vốn', theo: 'nguon_von', m: 'gnlk' }, { loai: 'chong', t: 'Dự án theo trạng thái triển khai', theo: 'trang_thai_trien_khai', m: 'da' },
    { loai: 'ds', t: 'Kết quả vùng đồng bào (IOC tính)', ms: ['tlNuoc', 'tlDuong', 'tlHs', 'tlGiam'] }, { loai: 'cot', t: 'Bản ghi theo trạng thái đối soát', theo: 'trang_thai_doi_soat', m: 'da' },
    { loai: 'xu', t: 'Giải ngân lũy kế qua các kỳ', m: 'gnlk' }],
  kt: [{ l: 'Tỷ lệ giải ngân đã nhập lệch lũy kế ÷ kế hoạch (hoặc ÷ phân bổ) × 100', c: ['ty_le_giai_ngan_ke_hoach', 'ty_le_giai_ngan_phan_bo'],
      f: (R) => efTyleSai(R.ty_le_giai_ngan_ke_hoach, R.giai_ngan_luy_ke_trieu_dong, R.ke_hoach_von_nam_trieu_dong) || efTyleSai(R.ty_le_giai_ngan_phan_bo, R.giai_ngan_luy_ke_trieu_dong, R.von_duoc_phan_bo_trieu_dong) },
    { l: '«Giải ngân lũy kế» nhỏ hơn «Giải ngân kỳ này»', c: ['giai_ngan_luy_ke_trieu_dong'], f: (R) => efDong(R.giai_ngan_ky_nay_trieu_dong, R.giai_ngan_luy_ke_trieu_dong) },
    { l: 'Số "có" lớn hơn số "tổng" (nước HVS, đường cứng hóa, học sinh)', c: DTTG_VUNG.map((p) => p[1]), f: (R) => DTTG_VUNG.some((p) => efDong(R[p[1]], R[p[0]])) },
    { l: 'Tỷ lệ kết quả vùng đã nhập lệch số ÷ tổng × 100', c: DTTG_VUNG.map((p) => p[2]), f: (R) => DTTG_VUNG.some((p) => efTyleSai(R[p[2]], R[p[1]], R[p[0]])) },
    { l: '«Cờ dữ liệu» khác "Đạt logic sơ bộ"', c: ['trang_thai_chat_luong_du_lieu'], f: (R) => R.trang_thai_chat_luong_du_lieu != null && R.trang_thai_chat_luong_du_lieu !== efMa('dttg1', 'trang_thai_chat_luong_du_lieu', 'Đạt logic sơ bộ') },
    { l: 'Đình trệ, tạm dừng mà để trống «Vướng mắc/Nguyên nhân»', c: ['vuong_mac_nguyen_nhan'], f: (R) => ['Đình trệ', 'Tạm dừng'].map((l) => efMa('dttg1', 'trang_thai_trien_khai', l)).indexOf(R.trang_thai_trien_khai) >= 0 && !R.vuong_mac_nguyen_nhan }]
};

/* ============================== SỞ Y TẾ ============================== */
const efKtCa = (mac) => [{ l: 'Số ca nặng hoặc tử vong lớn hơn số mắc', c: ['so_ca_nang', 'so_ca_tu_vong'], f: (R) => efDong(R.so_ca_nang, R[mac]) || efDong(R.so_ca_tu_vong, R[mac]) }];
const EF_SYT1 = {
  ef: 'syt1', ten: 'Ngộ độc thực phẩm', banGhi: 'một vụ ngộ độc thực phẩm («Tên vụ việc», «Ngày phát hiện») tại một xã, phường', kyCuoi: true,
  khoa: ['dia_ban', 'ten_vu_viec', 'ngay_phat_hien'], cap: ['nguyen_nhan_nghi_ngo', 'ten_vu_viec'], xaTruong: 'dia_ban', xaChi: ['vu', 'mac'],
  luuY: 'Mỗi vụ đếm một lần: vụ nhập lại khi cập nhật thì lấy bản sau cùng trong kỳ xem (khóa «Địa bàn» + «Tên vụ việc» + «Ngày phát hiện»).',
  chi: { vu: { l: 'Số vụ ngộ độc', loai: 'dem', u: 'vụ' }, mac: { l: efL('syt1', 'so_nguoi_mac_nhap_vien'), loai: 'cong', c: 'so_nguoi_mac_nhap_vien', u: 'người' },
    nang: { l: efL('syt1', 'so_ca_nang'), loai: 'cong', c: 'so_ca_nang', u: 'ca' }, tv: { l: efL('syt1', 'so_ca_tu_vong'), loai: 'cong', c: 'so_ca_tu_vong', u: 'ca' } },
  cot: ['vu', 'mac', 'nang', 'tv'], the: ['vu', 'mac', 'nang', 'tv'],
  bieu: [{ loai: 'cot', t: 'Vụ ngộ độc theo nguyên nhân nghi ngờ', theo: 'nguyen_nhan_nghi_ngo', m: 'vu' }, { loai: 'xu', t: 'Người mắc qua các kỳ', m: 'mac' }],
  kt: efKtCa('so_nguoi_mac_nhap_vien')
};
const efSytTl = (ef, so, l) => ({
  ef: ef, ten: l, banGhi: 'dân số và số người ' + (ef === 'syt2' ? 'có thẻ BHYT' : 'có hồ sơ sức khỏe điện tử') + ' của một thôn/TDP thuộc một xã, phường tại thời điểm báo cáo', kyCuoi: true,
  khoa: ['dia_ban', 'thon_tdp'], cap: ['dia_ban', 'thon_tdp'], xaTruong: 'dia_ban', xaChi: ['tl'],
  luuY: 'Số tại thời điểm: xem quý, năm thì mỗi thôn lấy bản kỳ cuối.',
  chi: { ds: { l: efL(ef, 'tong_dan_so_thon'), loai: 'cong', c: 'tong_dan_so_thon', u: 'người' }, co: { l: efL(ef, so), loai: 'cong', c: so, u: 'người' },
    tl: { l: (ef === 'syt2' ? 'Tỷ lệ bao phủ bảo hiểm y tế' : 'Tỷ lệ người dân có hồ sơ sức khỏe điện tử') + ' (IOC tính)', loai: 'tyle', tu: 'co', mau: 'ds' }, thon: { l: 'Số thôn, tổ dân phố báo cáo', loai: 'dem' } },
  cot: ['ds', 'co', 'tl'], the: ['tl', 'co', 'ds', 'thon'],
  bieu: [{ loai: 'xu', t: 'Tỷ lệ qua các kỳ', m: 'tl' }],
  kt: [{ l: 'Số có lớn hơn «Tổng dân số thôn»', c: [so], f: (R) => efDong(R[so], R.tong_dan_so_thon) }]
});
const EF_SYT2 = efSytTl('syt2', 'so_nguoi_co_the_bhyt', 'Bao phủ bảo hiểm y tế');
const EF_SYT3 = {
  ef: 'syt3', ten: 'Dịch bệnh nhóm A, B', banGhi: 'số ca mắc một bệnh («Tên bệnh») tại một thôn/TDP thuộc một xã, phường, phát hiện trong kỳ',
  khoa: ['dia_ban', 'thon_tdp', 'ten_benh', 'ngay_phat_hien'], cap: ['ten_benh', 'dia_ban'], xaTruong: 'dia_ban', xaChi: ['mac', 'o'],
  chi: { o: { l: 'Số ổ dịch (bản ghi)', loai: 'dem' }, mac: { l: efL('syt3', 'so_ca_mac'), loai: 'cong', c: 'so_ca_mac', u: 'ca' }, nang: { l: efL('syt3', 'so_ca_nang'), loai: 'cong', c: 'so_ca_nang', u: 'ca' },
    tv: { l: efL('syt3', 'so_ca_tu_vong'), loai: 'cong', c: 'so_ca_tu_vong', u: 'ca' }, benh: { l: 'Số bệnh ghi nhận', loai: 'demkhac', c: 'ten_benh' } },
  cot: ['o', 'mac', 'nang', 'tv'], the: ['mac', 'nang', 'tv', 'benh'],
  bieu: [{ loai: 'cot', t: 'Ca mắc theo bệnh', theo: 'ten_benh', m: 'mac' }, { loai: 'xu', t: 'Ca mắc qua các kỳ', m: 'mac' }],
  kt: efKtCa('so_ca_mac')
};
const EF_SYT4 = efSytTl('syt4', 'so_nguoi_co_ho_so_skdt', 'Hồ sơ sức khỏe điện tử');

/* ============================== SỞ VĂN HÓA, THỂ THAO (VÀ DU LỊCH) ============================== */
const EF_VHTT1 = {
  ef: 'vhtt1', ten: 'Chương trình 08-CT', banGhi: 'tiến độ một chỉ tiêu/nhiệm vụ của Chương trình 08-CT do một đơn vị chủ trì, trong một kỳ', kyCuoi: true,
  khoa: ['chi_tieu_nhiem_vu', 'don_vi_chu_tri', 'dia_ban'], khoaRong: ['dia_ban'], cap: ['don_vi_chu_tri', 'chi_tieu_nhiem_vu'],
  luuY: 'Mỗi nhiệm vụ lấy bản báo cáo cuối trong kỳ xem. «Tiến độ thực hiện» hiện đúng chữ đã nhập (sheet "Những chỉ tiêu bị thay đổi" ghi trường này đã xóa nhưng sheet sở vẫn còn).',
  chi: { nv: { l: 'Số nhiệm vụ', loai: 'dem' }, dv: { l: 'Số đơn vị chủ trì', loai: 'demkhac', c: 'don_vi_chu_tri' } },
  cot: ['nv'], the: ['nv', 'dv'],
  bieu: [{ loai: 'chong', t: 'Nhiệm vụ theo tiến độ thực hiện', theo: 'tien_do_thuc_hien', m: 'nv' }, { loai: 'cot', t: 'Nhiệm vụ theo đơn vị chủ trì', theo: 'don_vi_chu_tri', m: 'nv' }, { loai: 'xu', t: 'Số nhiệm vụ qua các kỳ', m: 'nv' }],
  kt: []
};
const EF_VHTT2 = {
  ef: 'vhtt2', ten: 'Người tham gia hoạt động nghệ thuật', banGhi: 'một hoạt động, chương trình nghệ thuật tại một xã, phường', khoa: ['ten_hoat_dong_chuong_trinh', 'dia_ban', 'ngay_bat_dau'],
  cap: ['hoat_dong_nghe_thuat', 'ten_hoat_dong_chuong_trinh'], xaTruong: 'dia_ban', xaChi: ['hd', 'ng'],
  chi: { hd: { l: 'Số hoạt động', loai: 'dem' }, buoi: { l: efL('vhtt2', 'so_buoi_dem_dien'), loai: 'cong', c: 'so_buoi_dem_dien', u: 'buổi' }, ng: { l: efL('vhtt2', 'so_nguoi_tham_gia'), loai: 'cong', c: 'so_nguoi_tham_gia', u: 'người' },
    cbs: { l: 'Bản ghi cần bổ sung', loai: 'dembang', c: 'trang_thai_doi_soat', v: [efMa('vhtt2', 'trang_thai_doi_soat', 'Cần bổ sung')] } },
  cot: ['hd', 'buoi', 'ng'], the: ['hd', 'ng', 'buoi', 'cbs'],
  bieu: [{ loai: 'cot', t: 'Người tham gia theo hoạt động/nghệ thuật', theo: 'hoat_dong_nghe_thuat', m: 'ng' }, { loai: 'chong', t: 'Hoạt động theo quy mô', theo: 'quy_mo_ioc', m: 'hd' },
    { loai: 'cot', t: 'Hoạt động theo cấp tổ chức thực tế', theo: 'cap_to_chuc_thuc_te', m: 'hd' }, { loai: 'xu', t: 'Người tham gia qua các kỳ', m: 'ng' }],
  kt: [efNgaySai('ngay_bat_dau', 'ngay_ket_thuc')]
};
const VH3_NGUON = ['doanh_thu_ban_ve_trieu_dong', 'doanh_thu_hop_dong_dat_hang_trieu_dong', 'doanh_thu_tai_tro_quang_cao_trieu_dong', 'doanh_thu_dich_vu_khac_trieu_dong'];
const efCong3 = (c) => ({ l: efL('vhtt3', c), loai: 'cong', c: c });
const EF_VHTT3 = {
  ef: 'vhtt3', ten: 'Doanh thu đơn vị nghệ thuật', banGhi: 'doanh thu, chi phí của một hoạt động do một đơn vị nghệ thuật Thành phố quản lý tổ chức',
  khoa: ['don_vi_nghe_thuat_tp_quan_ly', 'ten_hoat_dong_chuong_trinh', 'ngay_bat_dau'], cap: ['don_vi_nghe_thuat_tp_quan_ly', 'ten_hoat_dong_chuong_trinh'], xaTruong: 'dia_ban', xaChi: ['tong', 'kg'],
  bo: { tinh_chat: [efMa('vhtt3', 'tinh_chat', 'Không phát sinh')] },
  luuY: 'Số chính là «Tổng doanh thu (triệu đồng)»; «Tổng doanh thu (tỷ đồng)» hiện đúng như nhập, đối chiếu = triệu đồng ÷ 1.000.',
  chi: { hd: { l: 'Số hoạt động', loai: 'dem' }, ve: efCong3('so_ve_ban'), bv: efCong3('doanh_thu_ban_ve_trieu_dong'), hdg: efCong3('doanh_thu_hop_dong_dat_hang_trieu_dong'),
    tt: efCong3('doanh_thu_tai_tro_quang_cao_trieu_dong'), dvk: efCong3('doanh_thu_dich_vu_khac_trieu_dong'), tong: efCong3('tong_doanh_thu_trieu_dong'), kg: Object.assign(efCong3('luot_khan_gia'), { u: 'lượt' }),
    ns: efCong3('kinh_phi_nsnn_ho_tro_trieu_dong'), cp: efCong3('chi_phi_truc_tiep_trieu_dong'), cl: efCong3('chenh_lech_thu_chi_trieu_dong') },
  cot: ['tong', 'bv', 'hdg', 'tt', 'dvk', 'kg', 'cp', 'cl'], the: ['tong', 'kg', 'ns', 'cl'],
  bieu: [{ loai: 'phan', t: 'Cơ cấu tổng doanh thu theo 4 nguồn', ms: ['bv', 'hdg', 'tt', 'dvk'] }, { loai: 'cot', t: 'Tổng doanh thu theo đơn vị nghệ thuật', theo: 'don_vi_nghe_thuat_tp_quan_ly', m: 'tong' },
    { loai: 'chong', t: 'Hoạt động theo tính chất', theo: 'tinh_chat', m: 'hd' }, { loai: 'xu', t: 'Tổng doanh thu qua các kỳ', m: 'tong' }],
  kt: [{ l: '«Tổng doanh thu (triệu đồng)» khác cộng 4 nguồn', c: ['tong_doanh_thu_trieu_dong'], f: (R) => efSai(efNum(R.tong_doanh_thu_trieu_dong), efCong(R, VH3_NGUON)) },
    { l: '«Tổng doanh thu (tỷ đồng)» khác tổng (triệu đồng) ÷ 1.000', c: ['tong_doanh_thu_ty_dong'], f: (R) => efNum(R.tong_doanh_thu_ty_dong) != null && efNum(R.tong_doanh_thu_trieu_dong) != null && Math.abs(R.tong_doanh_thu_ty_dong - R.tong_doanh_thu_trieu_dong / 1000) > 0.01 },
    { l: '«Chênh lệch thu-chi» khác tổng doanh thu − chi phí trực tiếp', c: ['chenh_lech_thu_chi_trieu_dong'], f: (R) => efNum(R.tong_doanh_thu_trieu_dong) != null && efNum(R.chi_phi_truc_tiep_trieu_dong) != null && efSai(efNum(R.chenh_lech_thu_chi_trieu_dong), R.tong_doanh_thu_trieu_dong - R.chi_phi_truc_tiep_trieu_dong) },
    efNgaySai('ngay_bat_dau', 'ngay_ket_thuc')]
};
const efCong4 = (c, u) => ({ l: efL('vhtt4', c), loai: 'cong', c: c, u: u });
const EF_VHTT4 = {
  ef: 'vhtt4', ten: 'Hoạt động nghệ thuật chuyên nghiệp', banGhi: 'một hoạt động nghệ thuật chuyên nghiệp do một xã, phường báo cáo', khoa: ['ten_hoat_dong_nghe_thuat', 'don_vi_bao_cao', 'ngay_bat_dau'],
  cap: ['loai_hinh_nghe_thuat', 'ten_hoat_dong_nghe_thuat'], xaTruong: 'don_vi_bao_cao', xaChi: ['hd', 'kg'],
  bo: { trang_thai_hoat_dong: [efMa('vhtt4', 'trang_thai_hoat_dong', 'Không phát sinh')] },
  chi: { hd: { l: 'Hoạt động đã diễn ra', loai: 'dembang', c: 'trang_thai_hoat_dong', v: [efMa('vhtt4', 'trang_thai_hoat_dong', 'Đã diễn ra')] }, bg: { l: 'Số hoạt động (mọi trạng thái)', loai: 'dem' },
    buoi: efCong4('so_buoi_dem_dien', 'buổi'), ns: efCong4('so_luot_nghe_si_dien_vien', 'lượt'), kg: efCong4('so_luot_khan_gia', 'lượt'), ve: efCong4('so_ve_khach_moi_phat_hanh', 'vé'),
    dt: efCong4('doanh_thu_ve_dich_vu_dong'), nsnn: efCong4('kinh_phi_nsnn_ho_tro_dong'), khac: efCong4('nguon_kinh_phi_khac_dong') },
  cot: ['hd', 'bg', 'buoi', 'kg', 've', 'dt', 'nsnn'], the: ['hd', 'kg', 'buoi', 'dt'],
  bieu: [{ loai: 'cot', t: 'Hoạt động đã diễn ra theo loại hình nghệ thuật', theo: 'loai_hinh_nghe_thuat', m: 'hd' }, { loai: 'chong', t: 'Hoạt động theo quy mô', theo: 'quy_mo_theo', m: 'bg' },
    { loai: 'cot', t: 'Hoạt động theo hình thức tổ chức', theo: 'hinh_thuc_to_chuc', m: 'bg' }, { loai: 'chong', t: 'Hoạt động theo trạng thái', theo: 'trang_thai_hoat_dong', m: 'bg' }, { loai: 'xu', t: 'Lượt khán giả qua các kỳ', m: 'kg' }],
  kt: [efNgaySai('ngay_bat_dau', 'ngay_ket_thuc'), { l: 'Khán giả gấp hơn 2 lần vé/khách mời phát hành', c: ['so_luot_khan_gia'], f: (R) => efNum(R.so_ve_khach_moi_phat_hanh) > 0 && efNum(R.so_luot_khan_gia) > R.so_ve_khach_moi_phat_hanh * 2 }]
};
const efCong5 = (c) => ({ l: efL('vhtt5', c), loai: 'cong', c: c, u: 'lượt' });
const EF_VHTT5 = {
  ef: 'vhtt5', ten: 'Thông tin báo chí, mạng xã hội', banGhi: 'một tin, bài trên báo, trang tin hoặc mạng xã hội về Thành phố', khoa: ['tieu_de_tin_bai', 'ten_bao_trang_tin_mang_xa_hoi', 'ngay_dang'],
  cap: ['loai_nguon', 'ten_bao_trang_tin_mang_xa_hoi'], xaTruong: 'dia_ban', xaChi: ['tin', 'tc'],
  chi: { tin: { l: 'Số tin, bài', loai: 'dem' }, tc: { l: 'Tin tiêu cực', loai: 'dembang', c: 'muc_do_cam_xuc', v: [efMa('vhtt5', 'muc_do_cam_xuc', 'Tiêu cực')] },
    tich: { l: 'Tin tích cực', loai: 'dembang', c: 'muc_do_cam_xuc', v: [efMa('vhtt5', 'muc_do_cam_xuc', 'Tích cực')] },
    ut: { l: 'Tin ưu tiên xử lý Cao, Khẩn cấp', loai: 'dembang', c: 'muc_do_uu_tien_xu_ly', v: ['Cao', 'Khẩn cấp'].map((l) => efMa('vhtt5', 'muc_do_uu_tien_xu_ly', l)) },
    xem: efCong5('luot_xem'), cs: efCong5('luot_chia_se'), bl: efCong5('luot_binh_luan'), th: efCong5('luot_thich'), reach: efCong5('luot_tiep_can_reach'), eng: Object.assign(efCong5('diem_tuong_tac_engagement'), { u: 'điểm' }) },
  cot: ['tin', 'tc', 'xem', 'cs', 'bl', 'th'], the: ['tin', 'tc', 'xem', 'ut'],
  bieu: [{ loai: 'chong', t: 'Tin, bài theo mức độ cảm xúc', theo: 'muc_do_cam_xuc', m: 'tin' }, { loai: 'cot', t: 'Tin, bài theo loại nguồn', theo: 'loai_nguon', m: 'tin' },
    { loai: 'cot', t: 'Tin, bài theo lĩnh vực', theo: 'linh_vuc', m: 'tin' }, { loai: 'xu', t: 'Số tin, bài qua các kỳ', m: 'tin' }],
  kt: [{ l: '«Thời gian cập nhật» trước «Ngày đăng»', c: ['thoi_gian_cap_nhat'], f: (R) => efSauHan(R.ngay_dang, R.thoi_gian_cap_nhat) }]
};
/* Du lịch (sheet "Sở Du lịch") */
const EF_DL1 = {
  ef: 'dl1', ten: 'Khách du lịch', banGhi: 'số lượt khách quốc tế, nội địa theo «Loại điểm du lịch» của một xã, phường trong một tháng', khoa: ['don_vi_bao_cao', 'loai_diem_du_lich'],
  cap: ['loai_diem_du_lich', 'don_vi_bao_cao'], xaTruong: 'don_vi_bao_cao', xaChi: ['tong'],
  chi: { qt: { l: efL('dl1', 'so_luot_khach_du_lich_quoc_te'), loai: 'cong', c: 'so_luot_khach_du_lich_quoc_te', u: 'lượt' }, nd: { l: efL('dl1', 'so_luot_khach_du_lich_noi_dia'), loai: 'cong', c: 'so_luot_khach_du_lich_noi_dia', u: 'lượt' },
    tong: { l: 'Tổng lượt khách (IOC tính)', kl: 'Tổng lượt khách du lịch', loai: 'cong', c: ['so_luot_khach_du_lich_quoc_te', 'so_luot_khach_du_lich_noi_dia'], u: 'lượt' } },
  cot: ['tong', 'qt', 'nd'], the: ['tong', 'qt', 'nd'],
  bieu: [{ loai: 'phan', t: 'Cơ cấu khách quốc tế – nội địa', ms: ['qt', 'nd'] }, { loai: 'cot', t: 'Lượt khách theo loại điểm du lịch', theo: 'loai_diem_du_lich', m: 'tong' }, { loai: 'xu', t: 'Tổng lượt khách qua các kỳ', m: 'tong' }],
  kt: []
};
const DL2_LT = (l) => ({ loai_doanh_thu: [efMa('dl2', 'loai_doanh_thu', l)] });
const DL2_KHACH = ['don_vi_bao_cao', 'loai_diem_du_lich', '_kyId'];
const EF_DL2 = {
  ef: 'dl2', ten: 'Doanh thu du lịch', banGhi: 'doanh thu một «Loại doanh thu» theo «Loại điểm du lịch» của một xã, phường trong một kỳ (số khách ghi kèm)', khoa: ['don_vi_bao_cao', 'loai_diem_du_lich', 'loai_doanh_thu'],
  cap: ['loai_doanh_thu', 'loai_diem_du_lich'], xaTruong: 'don_vi_bao_cao', xaChi: ['tt'],
  luuY: '«Tổng thu từ khách du lịch» là tổng, hiện riêng, không cộng với lưu trú – ăn uống và lữ hành. Số khách ở eform này chỉ để đối chiếu (mỗi xã × loại điểm × kỳ lấy một lần); số khách chính ở eform Khách du lịch.',
  chi: { lt: { l: 'Doanh thu lưu trú và ăn uống', loai: 'cong', c: 'gia_tri_doanh_thu_vnd', loc: DL2_LT('Doanh thu dịch vụ lưu trú và ăn uống') },
    lh: { l: 'Doanh thu lữ hành', loai: 'cong', c: 'gia_tri_doanh_thu_vnd', loc: DL2_LT('Doanh thu dịch vụ du lịch lữ hành') },
    tt: { l: 'Tổng thu từ khách du lịch', loai: 'cong', c: 'gia_tri_doanh_thu_vnd', loc: DL2_LT('Tổng thu từ khách du lịch') },
    qt: { l: efL('dl2', 'so_luot_khach_du_lich_quoc_te') + ' (đối chiếu)', loai: 'motlan', c: 'so_luot_khach_du_lich_quoc_te', theo: DL2_KHACH, u: 'lượt' },
    nd: { l: efL('dl2', 'so_luot_khach_du_lich_noi_dia') + ' (đối chiếu)', loai: 'motlan', c: 'so_luot_khach_du_lich_noi_dia', theo: DL2_KHACH, u: 'lượt' } },
  cot: ['tt', 'lt', 'lh', 'qt', 'nd'], the: ['tt', 'lt', 'lh', 'qt'],
  bieu: [{ loai: 'cot', t: 'Tổng thu theo loại điểm du lịch', theo: 'loai_diem_du_lich', m: 'tt' }, { loai: 'xu', t: 'Tổng thu từ khách du lịch qua các kỳ', m: 'tt' }],
  kt: [{ l: '«Tổng thu từ khách du lịch» nhỏ hơn cộng lưu trú – ăn uống và lữ hành cùng xã, loại điểm, kỳ', c: ['gia_tri_doanh_thu_vnd'],
    f: (R, all) => { const T = efMa('dl2', 'loai_doanh_thu', 'Tổng thu từ khách du lịch'); if (R.loai_doanh_thu !== T || efNum(R.gia_tri_doanh_thu_vnd) == null) return false;
      const s = all.filter((x) => x !== R && !x._thay && x._kyId === R._kyId && x.don_vi_bao_cao === R.don_vi_bao_cao && x.loai_diem_du_lich === R.loai_diem_du_lich && x.loai_doanh_thu !== T).reduce((a, x) => a + (efNum(x.gia_tri_doanh_thu_vnd) || 0), 0);
      return s > R.gia_tri_doanh_thu_vnd; } }]
};

/* ============================== BAN QUẢN LÝ KHU CNC VÀ KCN ============================== */
const efTdB = (c, l) => ({ l: l || efL('bql1', c), loai: 'td', c: c });
const efCongB = (c) => ({ l: efL('bql1', c), loai: 'cong', c: c });
const EF_BQL1 = {
  ef: 'bql1', ten: 'Khu công nghiệp, khu chế xuất, khu kinh tế, khu công nghệ cao', banGhi: 'số liệu một khu («Loại khu», «Tên khu») trên một xã, phường trong một kỳ',
  khoa: ['dia_ban', 'loai_khu', 'ten_khu'], khoaRong: ['loai_khu', 'ten_khu'], cap: ['loai_khu', 'ten_khu'], xaTruong: 'dia_ban', xaChi: ['dn', 'ld', 'tl'],
  luuY: 'Doanh nghiệp, vốn đăng ký, lao động, diện tích là số tại thời điểm (xem quý, năm lấy kỳ cuối); các số "trong kỳ" cộng. «Loại khu», «Tên khu» bổ sung sau nên được để trống ở bản ghi cũ.',
  chi: { dn: efTdB('so_doanh_nghiep_dang_hoat_dong'), von: efTdB('tong_von_dau_tu_dang_ky_ty_dong'), ld: efTdB('so_lao_dong_dang_lam_viec'),
    tldc: efCongB('so_luong_thanh_lap_dieu_chinh_trong_ky'), da: efCongB('so_du_an_thu_hut_dau_tu_moi_trong_ky'), vonMoi: efCongB('tong_von_thu_hut_dau_tu_moi_ty_dong'),
    vonHt: efCongB('von_dau_tu_ha_tang_trong_ky_ty_dong'), dt: efCongB('doanh_thu_san_xuat_kinh_doanh_trong_ky_ty_dong'),
    qh: efTdB('dien_tich_quy_hoach_ha'), lap: efTdB('dien_tich_da_lap_day_ha'), tl: { l: 'Tỷ lệ lấp đầy (IOC tính)', loai: 'tyle', tu: 'lap', mau: 'qh' },
    tlN: efNhap('bql1', 'ty_le_lap_day_phan_tram', ['dia_ban', 'loai_khu', 'ten_khu']), bg: { l: 'Số bản ghi', loai: 'dem' } },
  cot: ['dn', 'von', 'ld', 'da', 'vonMoi', 'dt', 'qh', 'lap', 'tl', 'tlN'], the: ['dn', 'von', 'ld', 'tl'],
  bieu: [{ loai: 'cot', t: 'Doanh nghiệp đang hoạt động theo loại khu', theo: 'loai_khu', m: 'dn' }, { loai: 'cot', t: 'Lao động theo loại khu', theo: 'loai_khu', m: 'ld' },
    { loai: 'cot', t: 'Bản ghi theo tình hình đầu tư kết cấu hạ tầng', theo: 'tinh_hinh_dau_tu_ket_cau_ha_tang', m: 'bg' }, { loai: 'cot', t: 'Bản ghi theo đạt chuẩn môi trường', theo: 'dat_chuan_moi_truong', m: 'bg' },
    { loai: 'xu', t: 'Vốn thu hút đầu tư mới qua các kỳ', m: 'vonMoi' }],
  kt: [{ l: '«Diện tích đã lấp đầy» lớn hơn «Diện tích quy hoạch»', c: ['dien_tich_da_lap_day_ha'], f: (R) => efDong(R.dien_tich_da_lap_day_ha, R.dien_tich_quy_hoach_ha) },
    { l: '«Tỷ lệ lấp đầy (%)» lệch lấp đầy ÷ quy hoạch × 100', c: ['ty_le_lap_day_phan_tram'], f: (R) => efTyleSai(R.ty_le_lap_day_phan_tram, R.dien_tich_da_lap_day_ha, R.dien_tich_quy_hoach_ha) }]
};

if (SO_EF2_BAT) {
  const UB = { role: 'UBND', org: 'UBND Thành phố Hà Nội' };
  ctmEformDonVi(Object.assign({ id: 'ubnd-khcn', name: 'Sở Khoa học và Công nghệ', short: 'Sở KH&CN', eforms: [EF_KHCN1, EF_KHCN2, EF_KHCN3],
    kpis: [{ ef: 'khcn1', m: 'tl9' }, { ef: 'khcn1', m: 'tl42' }, { ef: 'khcn2', m: 'tl48' }, { ef: 'khcn2', m: 'tl41' }, { ef: 'khcn2', m: 'tl21' }, { ef: 'khcn3', m: 'tt' }, { ef: 'khcn3', m: 'tl27' }, { ef: 'khcn3', m: 'tl28' }],
    card: ['khcn1_tl9', 'khcn2_tl48', 'khcn3_tt'] }, UB));
  ctmEformDonVi(Object.assign({ id: 'ubnd-xaydung', name: 'Sở Xây dựng', short: 'Sở Xây dựng', eforms: [EF_SXD1, EF_SXD2, EF_SXD3, EF_SXD4],
    kpis: [{ ef: 'sxd1', m: 'ctCp' }, { ef: 'sxd1', m: 'sanHt' }, { ef: 'sxd2', m: 'hk' }, { ef: 'sxd2', m: 'hkkm' }, { ef: 'sxd3', m: 'diem' }, { ef: 'sxd3', m: 'cao' }, { ef: 'sxd4', m: 'hkVc' }, { ef: 'sxd4', m: 'hhVc' }],
    card: ['sxd1_sanHt', 'sxd2_hk', 'sxd3_diem'] }, UB));
  ctmEformDonVi(Object.assign({ id: 'ubnd-dantoc-tongiao', name: 'Sở Dân tộc và Tôn giáo', short: 'Sở Dân tộc và Tôn giáo', eforms: [EF_DTTG1],
    kpis: ['gnlk', 'tlKh', 'kh', 'da', 'dinhTre', 'tlNuoc', 'tlGiam', 'vp'].map((m) => ({ ef: 'dttg1', m: m })), card: ['dttg1_gnlk', 'dttg1_tlKh', 'dttg1_da'] }, UB));
  ctmEformDonVi(Object.assign({ id: 'ubnd-yte', name: 'Sở Y tế', short: 'Sở Y tế', eforms: [EF_SYT1, EF_SYT2, EF_SYT3, EF_SYT4],
    kpis: [{ ef: 'syt2', m: 'tl' }, { ef: 'syt4', m: 'tl' }, { ef: 'syt1', m: 'vu' }, { ef: 'syt1', m: 'mac' }, { ef: 'syt3', m: 'mac' }, { ef: 'syt3', m: 'tv' }],
    card: ['syt2_tl', 'syt4_tl', 'syt1_vu'], cardL: { syt2_tl: 'Bao phủ bảo hiểm y tế', syt4_tl: 'Có hồ sơ sức khỏe điện tử' } }, UB));
  /* VH, TT và Du lịch: gộp 2 eform Sở Du lịch khi Sở Du lịch đã nhập vào (cờ UBND_SAP_XEP_SO_2026, central-level.js); tắt cờ thì tách 2 đơn vị */
  const VH = [EF_VHTT1, EF_VHTT2, EF_VHTT3, EF_VHTT4, EF_VHTT5], VHK = [{ ef: 'vhtt1', m: 'nv' }, { ef: 'vhtt2', m: 'ng' }, { ef: 'vhtt3', m: 'tong' }, { ef: 'vhtt4', m: 'hd' }, { ef: 'vhtt4', m: 'kg' }, { ef: 'vhtt5', m: 'tin' }];
  const DLK = [{ ef: 'dl1', m: 'tong' }, { ef: 'dl2', m: 'tt' }];
  ctmEformDonVi(Object.assign({ id: 'ubnd-vhtt', name: SO_GOP_DL ? 'Sở Văn hóa, Thể thao và Du lịch' : 'Sở Văn hóa và Thể thao', short: SO_GOP_DL ? 'Sở VH, TT và DL' : 'Sở VH&TT',
    eforms: SO_GOP_DL ? VH.concat([EF_DL1, EF_DL2]) : VH, kpis: SO_GOP_DL ? VHK.concat(DLK) : VHK, card: SO_GOP_DL ? ['vhtt3_tong', 'vhtt4_hd', 'dl1_tong'] : ['vhtt3_tong', 'vhtt4_hd', 'vhtt5_tin'] }, UB));
  if (!SO_GOP_DL) ctmEformDonVi(Object.assign({ id: 'ubnd-dulich', name: 'Sở Du lịch', short: 'Sở Du lịch', eforms: [EF_DL1, EF_DL2], kpis: DLK.concat([{ ef: 'dl1', m: 'qt' }, { ef: 'dl1', m: 'nd' }]) }, UB));
  ctmEformDonVi(Object.assign({ id: 'ubnd-bqlkcnc', name: 'Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố', short: 'Ban QL KCNC và KCN', eforms: [EF_BQL1],
    kpis: ['dn', 'von', 'ld', 'vonMoi', 'dt', 'tl'].map((m) => ({ ef: 'bql1', m: m })), card: ['bql1_dn', 'bql1_von', 'bql1_ld'] }, UB));
  /* màn tổng quan UBND: ô số Y tế, Du lịch đọc khóa chỉ tiêu mới */
  if (typeof UBND_OV_KPIS !== 'undefined') UBND_OV_KPIS.forEach((k) => { if (k.cat === 'ubnd-yte' && k.m === 'bhR') k.m = 'syt2_tl'; if ((k.cat === 'ubnd-vhtt' && k.m === 'dlTong') || (k.cat === 'ubnd-dulich' && k.m === 'tong')) k.m = 'dl1_tong'; });
}
