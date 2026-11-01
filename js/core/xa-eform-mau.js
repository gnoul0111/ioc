/* ============================== BẢN GHI MẪU CỦA 12 EFORM CẤP XÃ, PHƯỜNG ==============================
   Chưa có dữ liệu thật (API xã, phường chưa cung cấp — sheet "API cần IOC cung cấp") nên màn hình chạy bằng bản ghi mẫu,
   dựng ĐÚNG khung eform (js/core/xa-eform.js), quy ước 28/10/2026 và bản đọc docs/BAN_DOC_EFORM/XA_* (duyệt 30/10/2026):
     · mỗi bản ghi chỉ có các trường của eform, ô danh mục chỉ nhận mã có trong danh mục của chính trường đó; không sinh thêm trường;
     · kỳ báo cáo theo eform: bản tháng (Đảng ủy, Hành chính công, Tài chính - Ngân sách, Quản lý văn bản, GPMB, Y tế, Nội vụ) hoặc bản quý
       (HĐND, Giáo dục, Văn hóa, Kinh tế xã hội, MTTQ), từ tháng 7/2025 (chính quyền hai cấp) đến tháng 9/2026;
     · số theo quy mô dân số thật của xã, phường (ctm-xa.js), hạt giống cố định theo tên nên mở lần nào cũng ra cùng số; số phát sinh của
       bản tháng nhỏ hơn bản quý, số tại thời điểm, số lũy kế đi lên dần; tổng = cộng thành phần (Tài chính - Ngân sách, Giáo dục);
     · cố ý có vài bản ghi để thử quy tắc: một bản gửi lại cùng khóa (X1), một bản quý trùng các bản tháng (X2), vài xã có bản lệch
       tổng / lệch tỷ lệ (X5) — màn "Dữ liệu đã nhập" đánh dấu các bản này.
   Có dữ liệu thật thì thay XA_EF_NGUON (hàm trả mảng bản ghi của một eform, một xã) và đặt XA_EF_LA_MAU = false — màn hình không đổi. */
const XA_EF_THANG = (function () { const a = []; for (let y = 2025; y <= 2026; y++) for (let m = y === 2025 ? 7 : 1; m <= (y === 2026 ? 9 : 12); m++) a.push([y, m]); return a; })();
const XA_EF_LA_MA = ['', 'quy_i', 'quy_ii', 'quy_iii', 'quy_iv'];

/* Cách dựng bản ghi mẫu của từng eform:
     ky: 'thang' | 'quy' — kỳ báo cáo của bản ghi; nhom: trường chia nhóm; rows: số dòng mỗi nhóm; ten: trường lấy tên hiển thị chép vào
     "Tên chỉ tiêu" (Chữ); cap: { nhóm: [mã chỉ tiêu…] } khi chỉ tiêu là danh mục cố định (field: trường chỉ tiêu); w: { mã chỉ tiêu: hệ số };
     dvtDong: mỗi dòng của nhóm lấy lần lượt một đơn vị tính; hop: { trường: { mã nhóm: [mã hợp nghĩa…] } } — ghép nhóm với giá trị cùng nghĩa;
     td: (dòng) → true khi là số tại thời điểm / lũy kế (không chia nhỏ theo tháng) — khớp loại số trong bản đọc */
const XA_EF_MAU_CFG = {
  dang: { ky: 'thang', nhom: 'nhom_muc', rows: 3, ten: 'doi_tuong_thong_ke', td: (L) => ['tongsocbccvc', 'biendongdangvien', 'cocautochuc'].indexOf(L.nhom_muc) >= 0, hop: { doi_tuong_thong_ke: {
    kiemtragiamsat: ['tochucdang', 'dangvien', 'doankttra'], thihanhkyluat: ['dangvien', 'tochucdang'], kiemtranhiemvu: ['tccapduoi', 'tochucdonvi'],
    thongkedoankttra: ['doankttra'], tongsocbccvc: ['biencheldhd', 'canbo'], danhgiacanbo: ['canbo', 'canbodangvien'], congtacchinhtrinoibo: ['truonghopthamdinh', 'canbodangvien'],
    biendongdangvien: ['dangvien'], cocautochuc: ['tccsd', 'tochucdang', 'tccapduoi'] } },
    dvtChu: { tochucdang: 'Tổ chức', dangvien: 'Người', tccapduoi: 'Tổ chức', tochucdonvi: 'Tổ chức', doankttra: 'Đoàn', biencheldhd: 'Người', canbo: 'Người', canbodangvien: 'Người', tccsd: 'Tổ chức', truonghopthamdinh: 'Trường hợp' } },
  hdnd: { ky: 'quy', nhom: 'chu_de_nhom', rows: 3, ten: 'doi_tuong_thong_ke', td: (L) => /nghi_quyet/.test(L.chu_de_nhom),
    dvtFn: (L) => ({ hoat_dong_giam_sat: 'cuoc', hop_tt_hdnd: 'cuoc', ky_hop_hdnd: 'ky_hop', tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa: 'cuoc_tiep_xuc', '4_nghi_quyet_quy_che_tiep_cong_dan': 'buoi_tiep_cong_dan' }[L.chu_de_nhom] ||
      { toc_do_tang_truong: 'phan_tram_nam', toc_do_tang: 'phan_tram_nam', thu_ngan_sach: 'ty_dong', thu_nhap: 'trieu_dong_nguoi_nam', ty_le: 'phan_tram', cong_nhan: 'xa', san_pham: 'san_pham', du_an: 'du_an', gia_tri: 'ty_dong' }[L.phan_loai_ket_qua]), hop: {
    doi_tuong_thong_ke: { '1_nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026': ['nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026'],
      '2_nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030': ['nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030'], '3_nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030': ['nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030'],
      '4_nghi_quyet_quy_che_tiep_cong_dan': ['nghi_quyet_quy_che_tiep_cong_dan'], hoat_dong_giam_sat: ['cuoc_giam_sat'],
      hop_tt_hdnd: ['buoi_hop_thuong_truc_hdnd_xa'], ky_hop_hdnd: ['ky_hop_hdnd', 'ky_hop_hdnd_xa'], tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa: ['cuoc_tiep_xuc_cu_tri'] },
    phan_loai_ket_qua: { '1_nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026': ['toc_do_tang_truong', 'thu_ngan_sach', 'thu_nhap', 'ty_le'],
      '2_nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030': ['toc_do_tang', 'thu_ngan_sach', 'cong_nhan', 'san_pham'], '3_nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030': ['du_an', 'gia_tri'],
      '4_nghi_quyet_quy_che_tiep_cong_dan': ['buoi'], hoat_dong_giam_sat: ['da_thuc_hien', 'dang_thuc_hien', 'chua_thuc_hien'], hop_tt_hdnd: ['buoi_hop'],
      ky_hop_hdnd: ['so_luong'], tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa: ['so_luong'] } } },
  hcc: { ky: 'thang', nhom: 'nhom_chi_tieu', field: 'chi_tieu', td: (L) => ['chua_den_han', 'dang_giai_quyet_qua_han', 'ho_so_tthc_cho_tiep_nhan', 'so_ky_truoc_chuyen_qua'].indexOf(L.chi_tieu) >= 0,
    w: { tiep_nhan_truc_tuyen: 6, tiep_nhan_truc_tiep: 2.5, tiep_nhan_bcci: 0.3, dung_va_truoc_han: 7, chua_den_han: 2, da_giai_quyet_qua_han: 0.15, dang_giai_quyet_qua_han: 0.1, ho_so_khong_duoc_tiep_nhan: 0.2 }, cap: {
    so_ho_so_nhan_giai_quyet: ['so_ky_truoc_chuyen_qua', 'tiep_nhan_truc_tiep', 'tiep_nhan_truc_tuyen', 'tiep_nhan_bcci'],
    ket_qua_giai_quyet: ['dung_va_truoc_han', 'da_giai_quyet_qua_han'],
    ho_so_dang_giai_quyet: ['chua_den_han', 'dang_giai_quyet_qua_han'],
    tiep_nhan_ho_so: ['ho_so_tthc_cho_tiep_nhan', 'ho_so_khong_duoc_tiep_nhan'] } },
  tcns: { ky: 'thang', nhom: 'loai_gia_tri_sl_st', field: 'tieu_chi_tieu', ten: 'tieu_chi_tieu', dvtFn: (L) => (L.loai_gia_tri_sl_st === 'st' ? 'dong' : /doanh_nghiep/.test(L.tieu_chi_tieu) ? 'doanh_nghiep' : /htx/.test(L.tieu_chi_tieu) ? 'hop_tac_xa' : /du_an/.test(L.tieu_chi_tieu) ? 'du_an' : 'ho'), td: (L) => /dang_hoat_dong/.test(L.tieu_chi_tieu), cap: {
    st: ['tong_thu_ngan_sach_nha_nuoc', 'thu_noi_dia', 'thu_vien_tro', 'thue_gtgt', 'thue_tncn', 'phi_le_phi', 'le_phi', 'tong_chi_ngan_sach_nha_nuoc', 'chi_dau_tu_phat_trien', 'chi_thuong_xuyen', 'chi_khac', 'tong_von_dau_tu'],
    sl: ['so_luong_doanh_nghiep_dang_hoat_dong', 'so_luong_htx_dang_hoat_dong', 'so_htx_thanh_lap_moi', 'so_htx_giai_the', 'so_luong_du_an_dau_tu_cong', 'so_ho_thieu_doi'] } },
  qlvb: { ky: 'thang', nhom: 'loai_van_ban', field: 'nhom_chi_tieu', w: { tong_so_van_ban_den: 4, tong_so_van_ban_di: 3, tong_so_cong_van: 2, chua_xu_ly: 0.15, dang_xu_ly: 0.3, da_hoan_tat: 2.5,
    van_ban_den_chua_luu: 0.15, van_ban_den_cho_duyet: 0.25, van_ban_den_da_chuyen_thuc_hien: 3, van_ban_lien_thong: 1.5, van_ban_noi_bo: 1.2 }, td: (L) => ['chua_xu_ly', 'dang_xu_ly', 'van_ban_den_chua_luu', 'van_ban_den_cho_duyet'].indexOf(L.nhom_chi_tieu) >= 0, cap: {
    van_ban_den: ['tong_so_van_ban_den', 'van_ban_den_chua_luu', 'van_ban_den_cho_duyet', 'van_ban_den_da_chuyen_thuc_hien', 'tong_so_cong_van', 'chua_xu_ly', 'dang_xu_ly', 'da_hoan_tat'],
    van_ban_di: ['tong_so_van_ban_di', 'van_ban_lien_thong', 'van_ban_noi_bo', 'chua_xu_ly', 'dang_xu_ly', 'da_hoan_tat'] } },
  gpmb: { ky: 'thang', nhom: 'nhom_trang_thai' },
  gd: { ky: 'quy', nhom: 'nhom_chi_tieu' },
  yte: { ky: 'thang', nhom: 'nhom_chi_tieu', td: (L) => L.nhom_chi_tieu === 'BAO_TRO_XA_HOI' },
  vh: { ky: 'quy', nhom: 'nhom_chi_tieu', rows: 3, ten: 'doi_tuong_thong_ke', td: (L) => ['don_vi_nghe_thuat', 'di_tich', 'di_san_van_hoa_phi_vat_the', 'nghe_nhan', 'thiet_che', 'clb'].indexOf(L.doi_tuong_thong_ke) >= 0, hop: {
    doi_tuong_thong_ke: { nghe_thuat_bieu_dien: ['don_vi_nghe_thuat', 'chuong_trinh', 'lien_hoan', 'hoi_thi'], di_san_van_hoa: ['di_tich', 'di_san_van_hoa_phi_vat_the', 'nghe_nhan'],
      le_hoi: ['le_hoi'], thiet_che_van_hoa: ['thiet_che'], the_thao: ['clb', 'hoi_thi'], du_lich: ['khach', 'doanh_nghiep'], du_an_dau_tu_van_hoa_the_thao: ['du_an'],
      truyen_thong_bao_chi_mang_xa_hoi: ['bao_chi', 'trang_tin', 'mang_xa_hoi'], gia_dinh_van_hoa_co_so: ['ho_gia_dinh', 'thon'] },
    loai_hinh: { nghe_thuat_bieu_dien: ['bieu_dien', 'lien_hoan', 'hoi_thi'], di_san_van_hoa: ['di_san'], le_hoi: ['le_hoi'], thiet_che_van_hoa: ['thiet_che_van_hoa'],
      the_thao: ['giai_dau', 'su_kien_the_thao', 'ngay_hoi_the_thao'], du_lich: ['di_san', 'le_hoi'], du_an_dau_tu_van_hoa_the_thao: ['thiet_che_van_hoa'],
      truyen_thong_bao_chi_mang_xa_hoi: ['su_kien_the_thao', 'le_hoi'], gia_dinh_van_hoa_co_so: ['clb', 'thiet_che_van_hoa'] } },
    dvtMa: { don_vi_nghe_thuat: 'don_vi', chuong_trinh: 'chuong_trinh', lien_hoan: 'hoat_dong', hoi_thi: 'hoat_dong', clb: 'don_vi', di_tich: 'di_tich', di_san_van_hoa_phi_vat_the: 'di_san', nghe_nhan: 'nguoi',
      le_hoi: 'le_hoi', thiet_che: 'thiet_che', khach: 'nguoi', doanh_nghiep: 'don_vi', du_an: 'du_an', bao_chi: 'tin_bai', trang_tin: 'tin_bai', mang_xa_hoi: 'tin_bai', ho_gia_dinh: 'diem', thon: 'diem' } },
  nv: { ky: 'thang', nhom: 'doi_tuong_thong_ke', rows: 3, ten: 'doi_tuong_thong_ke', td: (L) => L.phan_loai_ket_qua === 'tong_so' || L.phan_loai_ket_qua === 'ke_hoach_giao', hop: { phan_loai_ket_qua: {
    lao_dong_viet_nam: ['tong_so', 'trong_ky'], lao_dong_nuoc_ngoai: ['tong_so', 'trong_ky'], giao_dich_viec_lam: ['so_phien_giao_dich', 'so_luot_nguoi_tham_gia'],
    bien_che: ['tong_so', 'ke_hoach_giao', 'thuc_hien'], tuyen_moi: ['trong_ky', 'tong_so'], nghi_huu: ['trong_ky', 'tong_so'], thoi_viec: ['trong_ky', 'tong_so'],
    chuyen_cong_tac: ['trong_ky', 'tong_so'], nguoi_co_cong: ['so_phai_tra', 'so_da_tra'] } } },
  ktxh: { ky: 'quy', nhom: 'nhom_chi_tieu', rows: 2, ten: 'phan_nhom', td: () => true },
  mttq: { ky: 'quy', nhom: 'nhom_to_chuc', rows: 4, td: (L) => ['doanvien', 'socbcc', 'bienchetc', 'tonquy'].indexOf(L.ten_chi_tieu) >= 0,
    uu: ['doanvien', 'giamsat', 'phanbienxahoi', 'hienmau', 'mohinh', 'tongthu', 'tongchi', 'tonquy'],
    dvtChu: { doanvien: 'Người', giamsat: 'Cuộc', phanbienxahoi: 'Cuộc', hienmau: 'Đơn vị máu', mohinh: 'Mô hình', tongthu: 'Triệu đồng', tongchi: 'Triệu đồng', tonquy: 'Triệu đồng' } }
};

function xaEfR(seed) { return ctmRng(seed)(); }
function xaEfPick(list, seed) { return list.length ? list[Math.floor(xaEfR(seed) * list.length) % list.length] : null; }
/* Đơn vị (đọc từ tên hiển thị của đơn vị tính hoặc từ tên trường, VD "Tiến độ thực tế(%)", "Kinh phí đã chi trả (đồng)") */
function xaEfUnitOf(text) {
  const t = String(text || '');
  if (/%/.test(t)) return '%';
  if (/tỷ đồng/i.test(t)) return 'tỷ đồng';
  if (/triệu đồng/i.test(t)) return 'triệu đồng';
  if (/đồng|VND/i.test(t)) return 'đồng';
  if (/m\^2|m²/i.test(t)) return 'm²';
  if (/^ha$/i.test(t.trim())) return 'ha';
  return '';
}
/* Trường số mà «Đơn vị tính» của bản ghi áp vào; trường số khác chỉ có đơn vị khi tên trường ghi (VD "(đồng)", "(%)") */
const XA_EF_DVT_SO = /^(gia_tri|so_luong|gia_tri_ky_bao_cao|gia_tri_luy_ke|du_toan_kh_nam|thanh_pho_giao|kh_nam|uoc_thuc_hien_den_nay)$/;
/* Một số theo đơn vị, quy mô dân số và kỳ (i = 0 là quý mới nhất; số lẻ là các tháng xen giữa) */
function xaEfNum(unit, u, seed, i) {
  const r = xaEfR(seed), rq = xaEfR(seed + '|' + Math.round(i * 3)), sz = Math.sqrt(u.ds / 70000);
  const trend = Math.pow(0.97, i) * (0.94 + 0.12 * rq);
  if (unit === '%') return Math.round(Math.min(100, (45 + 50 * r) * (0.97 + 0.03 * Math.pow(0.99, i)) + (rq - 0.5) * 3) * 10) / 10;
  if (unit === 'tỷ đồng') return Math.round((2 + 38 * r) * sz * trend * 10) / 10;
  if (unit === 'triệu đồng') return Math.round((300 + 9000 * r) * sz * trend);
  if (unit === 'đồng') return Math.round((0.2 + 9 * r) * sz * trend * 1e5) * 1e4;
  if (unit === 'm²') return Math.round((800 + 60000 * r) * sz);
  if (unit === 'ha') return Math.round((5 + 300 * r) * sz);
  return Math.max(0, Math.round((2 + 160 * r * r) * sz * trend));
}
/* Đơn vị tính danh mục hợp với chỉ tiêu: tỷ lệ, tốc độ → %; thu, chi → tiền; tên đơn vị có trong tên chỉ tiêu (VD "Số hộ
   thiếu đói" → Hộ, "Kỳ họp HĐND" → kỳ họp); còn lại một đơn vị đếm không phải % hay tiền */
function xaEfDvt(f, texts, seed) {
  if (!f || f.t !== 'dm' || !f.dm.length) return null;
  const t = texts.join(' '), words = ' ' + t.toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ') + ' ';
  const by = (re) => f.dm.find((o) => re.test(o.l));
  if (/tỷ lệ|tốc độ|%/i.test(t) && by(/%/)) return by(/^%$/) || by(/%/);
  if (/thu|chi|ngân sách|kinh phí|vốn/i.test(t) && by(/đồng/i)) return by(/tỷ đồng/i) || by(/đồng/i);
  const named = f.dm.filter((o) => !/%|đồng/i.test(o.l) && words.indexOf(' ' + o.l.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ') >= 0)
    .sort((a, b) => b.l.length - a.l.length);
  if (named.length) return named[0];
  const cnt = f.dm.filter((o) => !/%|đồng/i.test(o.l));
  return xaEfPick(cnt.length ? cnt : f.dm, seed);
}

/* Các dòng (cố định cho mọi kỳ để so sánh được qua các kỳ) của một eform, một xã */
function xaEfMauDong(efId, ef, F, C, u) {
  const lines = [];
  if (efId === 'gpmb') {
    const n = 2 + Math.floor(xaEfR('gpmb|n|' + u.name) * 4);
    for (let j = 0; j < n; j++) {
      const s = 'gpmb|' + u.name + '|' + j, ma = 'DA-' + String(j + 1).padStart(2, '0');
      const base = { nhom_trang_thai: j < Math.max(1, n - 1) ? 'du_an_dang_trien_khai' : 'du_an_chua_trien_khai', ma_du_an: ma, ten_du_an_khu_vuc_GPMB: 'Dự án ' + String(j + 1).padStart(2, '0'),
        nhom_du_an: xaEfPick(F.nhom_du_an.dm, s + 'nda').v, chu_dau_tu_don_vi_phu_trach: xaEfPick(F.chu_dau_tu_don_vi_phu_trach.dm, s + 'cdt').v, _s: s };
      lines.push(Object.assign({ loai_dong: 'du_an' }, base));
      /* dự án 01 có 2 khu vực con; dòng Dự án = tổng các khu vực con (bản đọc GPMB-1) */
      if (j === 0) [0.6, 0.4].forEach((k, i) => lines.push(Object.assign({}, base, { loai_dong: 'khu_vuc_con_cua_du_an', ten_du_an_khu_vuc_GPMB: 'Dự án 01 — khu vực ' + (i + 1), _s: s + 'kv' + i, _con: k })));
    }
  } else if (efId === 'gd') {
    /* số học sinh, giáo viên theo bậc học: dòng "Tổng số" và các dòng thành phần (công lập / ngoài công lập, nam / nữ) cộng đúng bằng tổng */
    const KA = { gioi_tinh: 'khong_ap_dung', dan_toc: 'khong_ap_dung', trinh_do_chuyen_mon: 'khong_ap_dung', loai_co_so: 'tong_so' };
    [['giao_duc_mam_non', 1.1], ['giao_duc_pho_thong_tieu_hoc', 1.6], ['giao_duc_pho_thong_thcs', 1.2], ['giao_duc_pho_thong_thpt', 0.7]].forEach(([bh, w]) => {
      const T = Object.assign({}, KA, { nhom_chi_tieu: 'giao_duc_va_dao_tao', bac_hoc_loai_hinh_giao_duc: bh, nhom_doi_tuong: 'hoc_sinh', phan_loai_ket_qua: 'tong_so', don_vi_tinh: 'hoc_sinh', _s: 'gd|' + bh, _w: 9 * w, _td: true });
      lines.push(Object.assign({}, T, { gioi_tinh: 'tong_so' }));
      lines.push(Object.assign({}, T, { loai_co_so: 'cong_lap', _tp: 0.82, _cua: T._s }), Object.assign({}, T, { loai_co_so: 'ngoai_cong_lap', _bu: 0.82, _cua: T._s }));
      lines.push(Object.assign({}, T, { gioi_tinh: 'nam', _tp: 0.51, _cua: T._s }), Object.assign({}, T, { gioi_tinh: 'nu', _bu: 0.51, _cua: T._s }));
      lines.push(Object.assign({}, T, { dan_toc: 'kinh', _tp: 0.96, _cua: T._s }), Object.assign({}, T, { dan_toc: 'dan_toc_thieu_so', _bu: 0.96, _cua: T._s }));
      lines.push(Object.assign({}, T, { nhom_doi_tuong: 'giao_vien', don_vi_tinh: 'giao_vien', _s: 'gd|gv|' + bh, _w: 0.5 * w }));
      lines.push(Object.assign({}, T, { nhom_doi_tuong: 'co_so', don_vi_tinh: 'co_so', _s: 'gd|cs|' + bh, _w: 0.02 * w }));
      lines.push(Object.assign({}, T, { nhom_doi_tuong: 'hoc_sinh', phan_loai_ket_qua: 'tot_nghiep', _s: 'gd|tn|' + bh, _w: 1.8 * w, _td: false }));
      lines.push(Object.assign({}, T, { nhom_doi_tuong: 'hoc_sinh', phan_loai_ket_qua: 'tuyen_moi', _s: 'gd|tm|' + bh, _w: 2.2 * w, _td: false }));
    });
    ['so_cap', 'trung_cap', 'cao_dang'].forEach((td, i) => ['tuyen_moi', 'tot_nghiep'].forEach((pl) => lines.push({ nhom_chi_tieu: 'giao_duc_nghe_nghiep', bac_hoc_loai_hinh_giao_duc: 'giao_duc_nghe_nghiep',
      loai_co_so: 'tong_so', gioi_tinh: 'khong_ap_dung', dan_toc: 'khong_ap_dung', trinh_do_chuyen_mon: td, nhom_doi_tuong: 'hoc_vien', phan_loai_ket_qua: pl, don_vi_tinh: 'hoc_vien', _s: 'gd|nn|' + td + pl, _w: 1.2 / (i + 1) })));
    lines.push({ nhom_chi_tieu: 'giao_duc_nghe_nghiep_cho_nguoi_khuyet_tat', bac_hoc_loai_hinh_giao_duc: 'giao_duc_nghe_nghiep', loai_co_so: 'tong_so', gioi_tinh: 'khong_ap_dung', dan_toc: 'khong_ap_dung',
      trinh_do_chuyen_mon: 'so_cap', nhom_doi_tuong: 'nguoi_khuyet_tat', phan_loai_ket_qua: 'co_day_nghe_cho_nguoi_khuyet_tat', don_vi_tinh: 'hoc_vien', _s: 'gd|nkt', _w: 0.15 });
    lines.push({ nhom_chi_tieu: 'giao_duc_nghe_nghiep_cho_nguoi_khuyet_tat', bac_hoc_loai_hinh_giao_duc: 'giao_duc_nghe_nghiep', loai_co_so: 'tong_so', gioi_tinh: 'khong_ap_dung', dan_toc: 'khong_ap_dung',
      trinh_do_chuyen_mon: 'khong_ap_dung', nhom_doi_tuong: 'co_so', phan_loai_ket_qua: 'tong_so', don_vi_tinh: 'co_so', _s: 'gd|nktcs', _w: 0.02, _td: true });
  } else if (efId === 'yte') {
    [['NGO_DOC_THUC_PHAM', 'Ngộ độc thực phẩm', '', 'VU', 0.05], ['NGO_DOC_THUC_PHAM', 'Ngộ độc thực phẩm', 'Số người mắc', 'NGUOI', 0.4], ['DICH_BENH_TRUYEN_NHIEM', 'Sốt xuất huyết', 'Số ca mắc', 'NGUOI', 0.6],
      ['DICH_BENH_TRUYEN_NHIEM', 'Tay chân miệng', 'Số ca mắc', 'NGUOI', 0.4], ['DICH_BENH_TRUYEN_NHIEM', 'Ổ dịch', '', 'VU', 0.08], ['BAO_TRO_XA_HOI', 'Đối tượng bảo trợ xã hội', 'Hưởng trợ cấp hằng tháng', 'NGUOI', 6],
      ['BAO_TRO_XA_HOI', 'Hộ nghèo, cận nghèo', 'Được hỗ trợ', 'NGUOI_HO_GIA_DINH', 1.5]].forEach(([g, t, tt, dv, w], j) => lines.push({ nhom_chi_tieu: g, ten_chi_tieu: t, tieu_chi_tieu: tt || null, don_vi_tinh: dv, _s: 'yte|' + j, _w: w }));
  } else if (C.cap) {
    Object.keys(C.cap).forEach((g) => C.cap[g].forEach((v) => {
      const L = { _s: efId + '|' + g + '|' + v };
      L[C.nhom] = g; L[C.field] = v;
      lines.push(L);
      if (efId === 'qlvb' && v === 'tong_so_cong_van') lines.push(Object.assign({}, L, { phan_loai: 'qua_han', _s: L._s + '|qh' }));
      /* tình trạng xử lý: thêm số tách trong hạn / quá hạn */
      if (efId === 'qlvb' && ['chua_xu_ly', 'dang_xu_ly', 'da_hoan_tat'].indexOf(v) >= 0) [['trong_han', 0.8], ['qua_han', 0.2]].forEach(([pl, k]) => lines.push(Object.assign({}, L, { phan_loai: pl, _s: L._s + '|' + pl, _goc: L._s, _phan: k })));
      /* số từng phòng của «Tổng số văn bản đến», kèm bản để trống tên là số của xã (bản đọc QLVB-3) */
      if (efId === 'qlvb' && v === 'tong_so_van_ban_den') ['Văn phòng HĐND và UBND', 'Phòng Kinh tế', 'Phòng Văn hóa - Xã hội'].forEach((ph, i) => lines.push(Object.assign({}, L, { ten_can_bo_phong: ph, _s: L._s + '|ph' + i, _goc: L._s, _phan: [0.5, 0.3, 0.2][i] })));
    }));
  } else {
    const keys = ef.fields.filter((f) => f.t === 'dm' && f.dm.length && f.c !== C.nhom && f.c !== 'don_vi_tinh' && !/^(ky_bao_cao|quy|dia_ban|linh_vuc|cap_don_vi|tan_suat|nguon_so_lieu|don_vi_chu_tri_bao_cao)$/.test(f.c));
    F[C.nhom].dm.forEach((g, gi) => {
      /* MTTQ: mỗi tổ chức có đủ các mã của ô số chính */
      const rows = C.uu ? C.uu.length : C.rows || 3;
      for (let j = 0; j < rows; j++) {
        const L = { _s: efId + '|' + g.v + '|' + j, _j: j };
        L[C.nhom] = g.v;
        keys.forEach((f) => {
          const want = C.hop && C.hop[f.c] && C.hop[f.c][g.v], ok = want ? f.dm.filter((o) => want.indexOf(o.v) >= 0) : [];
          const hop = ok.length > 0, list = hop ? ok : f.dm;
          L[f.c] = (hop ? list[j % list.length] : xaEfPick(list, L._s + '|' + f.c)).v;
        });
        if (C.uu) L.ten_chi_tieu = C.uu[j];
        if (efId === 'nv' && L.phan_loai_ket_qua === 'thuc_hien') L._w = 0.1;
        if (efId === 'ktxh') { L.phan_nhom = g.v === 'KINH_TE_TONG_HOP' ? (j % 2 ? 'CHI_NGAN_SACH' : 'THU_NGAN_SACH') : null; L.don_vi_chu_tri_bao_cao = g.v === 'VAN_HOA_XA_HOI' ? 'P_VH_XH' : 'P_KTHT_DT'; }
        lines.push(L);
      }
    });
  }
  /* dòng trùng mọi trường danh mục với dòng trước trong cùng nhóm: thêm ý vào tên chỉ tiêu (Chữ) */
  const seen = {}, Y = [' — số mới trong kỳ', ' — số lũy kế', ' — số khác'];
  lines.forEach((L) => { const k = Object.keys(L).filter((c) => c.charAt(0) !== '_').sort().map((c) => c + '=' + L[c]).join('|'); seen[k] = (seen[k] || 0) + 1; if (seen[k] > 1) L._ten2 = Y[(seen[k] - 2) % Y.length]; });
  return lines;
}

/* Bản ghi mẫu của một eform cho một xã, phường (mọi kỳ từ tháng 7/2025) */
function xaEfMau(efId, u) {
  const ef = XA_EFORM.find((e) => e.id === efId), C = XA_EF_MAU_CFG[efId];
  if (!ef || !C || !u) return [];
  const F = {};
  ef.fields.forEach((f) => { F[f.c] = f; });
  const pre = String((F.dia_ban && F.dia_ban.mau) || 'UBND').replace(/\s+(phường|xã)\s.*$/i, '');
  const diaBan = pre + ' ' + (u.k === 'P' ? 'phường ' : 'xã ') + u.short;
  const lb = (fc, v) => { const o = F[fc] && F[fc].dm && F[fc].dm.find((x) => x.v === v); return o ? o.l : ''; };
  const numFields = ef.fields.filter((f) => f.t === 'so' && f.c !== 'nam' && f.c !== 'thang');
  const dvtF = F.don_vi_tinh;
  const lines = xaEfMauDong(efId, ef, F, C, u);
  /* kỳ: bản tháng hoặc bản quý (quý = 3 tháng cuối quý), i = số quý tính từ kỳ mới nhất (tháng xen giữa là số lẻ) */
  const kys = C.ky === 'quy' ? XA_EF_THANG.filter((x) => x[1] % 3 === 0).map(([y, m]) => ({ loai: 'quy', y: y, q: m / 3, m: m })) : XA_EF_THANG.map(([y, m]) => ({ loai: 'thang', y: y, q: Math.ceil(m / 3), m: m }));
  const last = XA_EF_THANG[XA_EF_THANG.length - 1], idx = (k) => ((last[0] - k.y) * 12 + last[1] - k.m) / 3;
  const out = [], gdTong = {};
  const dong = (L, k) => {
    const i = idx(k), ngay = k.y + '-' + String(k.m).padStart(2, '0') + '-' + (k.m === 2 ? '28' : [4, 6, 9, 11].indexOf(k.m) >= 0 ? '30' : '31');
    const R = {};
    ef.fields.forEach((f) => {
      const c = f.c;
      let v = null;
      if (c === 'dia_ban') v = diaBan;
      else if (c === 'ky_bao_cao') v = k.loai;
      else if (c === 'nam') v = k.y;
      else if (c === 'thang') v = k.loai === 'thang' ? k.m : null;
      else if (c === 'quy') v = k.loai === 'quy' ? XA_EF_LA_MA[k.q] : null;
      else if (c in L) v = L[c];
      else if (f.t === 'dm' && f.dm.length === 1) v = f.dm[0].v;
      else if (c === 'tan_suat') v = k.loai;
      else if (f.t === 'ngay') v = ngay;
      else if (c === 'don_vi' && efId === 'hcc') v = 'Bộ phận một cửa';
      R[c] = v;
    });
    /* tên chỉ tiêu kiểu Chữ: chép tên hiển thị của một danh mục trong cùng bản ghi */
    if (F.ten_chi_tieu && F.ten_chi_tieu.t === 'chu' && !L.ten_chi_tieu) R.ten_chi_tieu = efId === 'gd' ? ((L.phan_loai_ket_qua === 'tong_so' ? 'Số ' : lb('phan_loai_ket_qua', L.phan_loai_ket_qua) + ' — ') + lb('nhom_doi_tuong', L.nhom_doi_tuong).toLowerCase()) : lb(C.ten, R[C.ten]) || lb(C.nhom, R[C.nhom]);
    if (F.chi_tieu && F.chi_tieu.t === 'chu') R.chi_tieu = lb(C.ten, R[C.ten]) || lb(C.nhom, R[C.nhom]);
    /* các dòng của một nhóm giống nhau ở mọi trường danh mục (nhóm chỉ có một giá trị hợp nghĩa): tên chỉ tiêu ghi thêm ý để không trùng khóa */
    if (L._ten2) ['ten_chi_tieu', 'chi_tieu'].forEach((c) => { if (F[c] && F[c].t === 'chu' && R[c]) R[c] += L._ten2; });
    const texts = Object.keys(R).map((x) => (F[x] && F[x].t === 'dm' ? lb(x, R[x]) : '')).concat([R.ten_chi_tieu || '', R.chi_tieu || '']);
    let dvText = '';
    if (dvtF && dvtF.t === 'chu') { dvText = (C.dvtChu && (C.dvtChu[L.doi_tuong_thong_ke] || C.dvtChu[L.ten_chi_tieu])) || 'Người'; R.don_vi_tinh = dvText; }
    else if (dvtF && !L.don_vi_tinh) {
      const ma = C.dvtFn ? C.dvtFn(L) : C.dvtMa ? C.dvtMa[L.doi_tuong_thong_ke] : null, dv = ma ? dvtF.dm.find((o) => o.v === ma) : xaEfDvt(dvtF, texts, L._s + '|dvt');
      if (dv) { R.don_vi_tinh = dv.v; dvText = dv.l; }
    } else if (dvtF) dvText = lb('don_vi_tinh', L.don_vi_tinh);
    const td = L._td != null ? L._td : C.td ? C.td(L) : false, chia = k.loai === 'thang' && !td ? 3 : 1;
    numFields.forEach((f) => {
      const unit = xaEfUnitOf(f.l) || (XA_EF_DVT_SO.test(f.c) ? xaEfUnitOf(dvText) : '') || (/^(thu_nsnn|chi_nsdp)$/.test(f.c) ? 'triệu đồng' : '');
      const w = unit === '%' ? 1 : L._w || (C.w && C.w[L[C.field]]) || 1;
      /* dòng là phần của một dòng khác (số từng phòng, số tách trong hạn / quá hạn): cùng hạt giống với dòng gốc rồi nhân tỷ phần */
      let v = xaEfNum(unit, u, (L._goc || L._s) + '|' + f.c + '|' + u.name, i) * w / (unit === '%' ? 1 : chia);
      if (L._phan) v *= L._phan;
      R[f.c] = !unit || unit === 'đồng' || unit === 'triệu đồng' || unit === 'm²' || unit === 'ha' ? Math.round(v) : Math.round(v * 10) / 10;
    });
    /* HĐND: «Thu NSNN», «Chi NSDP» chỉ có ở nghị quyết đầu tư công */
    if (efId === 'hdnd' && !/dau_tu_cong/.test(R.chu_de_nhom || '')) { R.thu_nsnn = null; R.chi_nsdp = null; R.du_an_dau_tu_cong = null; }
    if (efId === 'hdnd' && /dau_tu_cong/.test(R.chu_de_nhom || '')) R.du_an_dau_tu_cong = 'Dự án cải tạo hạ tầng ' + (L._j + 1);
    /* Giáo dục: dòng thành phần = phần của dòng tổng cùng bậc học, cùng kỳ (tổng = cộng thành phần, bản đọc GD-1) */
    if (efId === 'gd') { const kk = '|' + k.y + '-' + k.m; if (L._cua) { const T = gdTong[L._cua + kk]; R.gia_tri = L._bu ? T - Math.round(T * L._bu) : Math.round(T * L._tp); } else gdTong[L._s + kk] = R.gia_tri; }
    if (efId === 'tcns') {
      const yThang = k.m, f = yThang / 12;
      R.du_toan_kh_nam = Math.round(R.gia_tri_ky_bao_cao * (chia === 3 ? 12 : 1) * (1.05 + 0.15 * xaEfR(L._s + 'dt' + u.name + k.y)) * 10) / 10;
      R.gia_tri_luy_ke = chia === 3 ? Math.round(R.du_toan_kh_nam * f * (0.85 + 0.25 * xaEfR(L._s + u.name + k.y + k.m)) * 10) / 10 : R.gia_tri_ky_bao_cao;
      if (chia === 1) R.du_toan_kh_nam = Math.round(R.gia_tri_ky_bao_cao * 1.1);
      R.ty_le_so_voi_du_toan_kh = R.du_toan_kh_nam ? (Math.round(R.gia_tri_luy_ke / R.du_toan_kh_nam * 1000) / 10).toString().replace('.', ',') + '%' : '';
    }
    if (efId === 'ktxh') {
      R.kh_nam = Math.round(R.kh_nam * 4);
      R.thanh_pho_giao = R.kh_nam;
      R.uoc_thuc_hien_den_nay = Math.round(R.kh_nam * (k.q / 4) * (0.85 + 0.25 * xaEfR(L._s + 'u' + u.name + k.y + k.q)));
      R.danh_gia_muc_do_hoan_thanh = R.kh_nam ? Math.round(R.uoc_thuc_hien_den_nay / R.kh_nam * 1000) / 10 : null;
    }
    if (efId === 'gpmb') {
      const tien = Math.min(100, Math.round((30 + 60 * xaEfR(L._s + 'td')) * Math.pow(0.93, i) * 10) / 10);
      R.tien_do_thuc_te = R.nhom_trang_thai === 'du_an_chua_trien_khai' ? 0 : tien;
      R.trang_thai_tien_do = R.nhom_trang_thai === 'du_an_chua_trien_khai' ? 'chua_thuc_hien' : tien >= 100 ? 'da_hoan_thanh' : 'dang_thuc_hien';
      const goc = Object.assign({}, R);
      ['tong_dien_tich_phai_thu_hoi', 'tong_so_doi_tuong_gpmb', 'kinh_phi_boi_thuong_ho_tro_du_kien'].forEach((x) => { R[x] = Math.round(xaEfNum(x === 'tong_so_doi_tuong_gpmb' ? '' : xaEfUnitOf(F[x].l), u, L._s.replace(/kv\d$/, '') + '|' + x + '|' + u.name, 0) * (L._con || 1)); });
      const kk = R.tien_do_thuc_te / 100;
      R.dien_tich_da_thu_hoi = Math.round(R.tong_dien_tich_phai_thu_hoi * kk);
      R.ty_le_thu_hoi = R.tong_dien_tich_phai_thu_hoi ? Math.round(R.dien_tich_da_thu_hoi / R.tong_dien_tich_phai_thu_hoi * 1000) / 10 : 0;
      const ho = R.tong_so_doi_tuong_gpmb;
      R.da_thong_bao_thu_hoi_dat = Math.round(ho * Math.min(1, kk + 0.3));
      R.da_kiem_dem = Math.round(ho * Math.min(1, kk + 0.2));
      R.da_phe_duyet_phuong_an_boi_thuong = Math.round(ho * Math.min(1, kk + 0.1));
      R.da_chi_tra_nhan_tien = Math.round(ho * kk);
      R.da_ban_giao_mat_bang = Math.round(ho * kk * 0.95);
      R.ty_le_ban_giao = ho ? Math.round(R.da_ban_giao_mat_bang / ho * 1000) / 10 : 0;
      R.kinh_phi_da_chi_tra = Math.round(R.kinh_phi_boi_thuong_ho_tro_du_kien * kk / 1e4) * 1e4;
      R.nhom_vuong_mac_chinh = goc.nhom_vuong_mac_chinh; R.han_xu_ly_kien_nghi = goc.han_xu_ly_kien_nghi;
    }
    return R;
  };
  kys.forEach((k) => lines.forEach((L) => { const R = dong(L, k); if (R.gia_tri !== null || efId !== 'gd') out.push(R); }));
  /* Tài chính - Ngân sách: tổng thu, tổng chi = cộng các khoản thành phần cùng kỳ (bản đọc TCNS-1) */
  if (efId === 'tcns') {
    const TP = { tong_thu_ngan_sach_nha_nuoc: ['thu_noi_dia', 'thu_vien_tro'], tong_chi_ngan_sach_nha_nuoc: ['chi_dau_tu_phat_trien', 'chi_thuong_xuyen', 'chi_khac'] };
    const ky = (R) => R.nam + '-' + R.thang, by = {};
    out.forEach((R) => { by[ky(R) + '|' + R.tieu_chi_tieu] = R; });
    out.forEach((R) => { const tp = TP[R.tieu_chi_tieu]; if (!tp) return; ['gia_tri_ky_bao_cao', 'gia_tri_luy_ke', 'du_toan_kh_nam'].forEach((c) => { R[c] = Math.round(tp.reduce((s, x) => s + ((by[ky(R) + '|' + x] || {})[c] || 0), 0) * 10) / 10; });
      R.ty_le_so_voi_du_toan_kh = R.du_toan_kh_nam ? (Math.round(R.gia_tri_luy_ke / R.du_toan_kh_nam * 1000) / 10).toString().replace('.', ',') + '%' : ''; });
  }
  /* bản ghi cố ý để thử quy tắc (một số xã, phường): */
  const h = xaEfR('lech|' + efId + '|' + u.name);
  if (out.length) {
    const lastKy = out[out.length - 1], cung = out.filter((R) => R.nam === lastKy.nam && R.thang === lastKy.thang && R.quy === lastKy.quy);
    /* X1: một bản gửi lại cùng khóa, cùng kỳ (bản sau thay bản trước) */
    const R1 = Object.assign({}, cung[cung.length - 1]);
    numFields.forEach((f) => { if (typeof R1[f.c] === 'number' && f.c !== 'nam' && !/ty_le|tien_do|danh_gia/.test(f.c)) R1[f.c] = Math.round(R1[f.c] * 1.05); });
    out.push(R1);
    /* X2: eform báo cáo tháng có thêm một bản quý (Quý 1/2026) trùng khóa với các bản tháng — không cộng chồng */
    if (C.ky === 'thang') { const T3 = out.find((R) => R.nam === 2026 && R.thang === 3); if (T3) out.push(Object.assign({}, T3, { ky_bao_cao: 'quy', thang: null, quy: 'quy_i' })); }
  }
  /* X5: vài xã có bản lệch tổng / lệch tỷ lệ đã nhập */
  if (h < 0.25) {
    if (efId === 'tcns') { const R = out.find((x) => x.tieu_chi_tieu === 'tong_thu_ngan_sach_nha_nuoc' && x.nam === 2026 && x.thang === 9); if (R) R.gia_tri_luy_ke = Math.round((R.gia_tri_luy_ke + 1) * 10) / 10; }
    if (efId === 'gpmb') { const R = out.find((x) => x.loai_dong === 'du_an' && x.nam === 2026 && x.thang === 9 && x.ty_le_thu_hoi > 5); if (R) R.ty_le_thu_hoi = Math.round((R.ty_le_thu_hoi + 3) * 10) / 10; }
    if (efId === 'gd') { const R = out.find((x) => x.gioi_tinh === 'nam' && x.nam === 2026 && x.quy === 'quy_iii'); if (R) R.gia_tri += 7; }
    if (efId === 'ktxh') { const R = out.find((x) => x.nam === 2026 && x.quy === 'quy_iii'); if (R) R.danh_gia_muc_do_hoan_thanh = Math.round((R.danh_gia_muc_do_hoan_thanh + 4) * 10) / 10; }
  }
  return out;
}
/* Nguồn bản ghi của màn hình: (mã eform, đơn vị CTM_XA) → mảng bản ghi { mã trường: giá trị }; một xã, một eform chỉ dựng một lần */
const XA_EF_MAU_CACHE = {};
function xaEfMauNho(efId, u) { const k = efId + '|' + (u ? u.name : ''); if (!XA_EF_MAU_CACHE[k]) XA_EF_MAU_CACHE[k] = xaEfMau(efId, u); return XA_EF_MAU_CACHE[k]; }
let XA_EF_NGUON = xaEfMauNho;
const XA_EF_LA_MAU = true;
