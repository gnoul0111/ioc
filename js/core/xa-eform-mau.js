/* ============================== BẢN GHI MẪU CỦA 12 EFORM CẤP XÃ, PHƯỜNG ==============================
   Chưa có dữ liệu thật (API xã, phường chưa cung cấp — sheet "API cần IOC cung cấp") nên màn hình chạy bằng bản ghi mẫu,
   dựng ĐÚNG khung eform (js/core/xa-eform.js), quy ước chốt 28/10/2026:
     · mỗi bản ghi chỉ có các trường của eform, ô danh mục chỉ nhận mã có trong danh mục của chính trường đó;
     · không đặt tên chỉ tiêu mới: ô "Tên chỉ tiêu" kiểu Chữ chép tên hiển thị của một danh mục trong cùng bản ghi;
       các ô Chữ mô tả khác (ghi chú, người nhập, nguồn…) để trống;
     · số theo quy mô dân số thật của xã, phường (ctm-xa.js), hạt giống cố định theo tên nên mở lần nào cũng ra cùng số;
     · kỳ báo cáo là quý, 4 quý từ Quý 3/2025 như phần còn lại của bộ chỉ tiêu xã, phường.
   Có dữ liệu thật thì thay XA_EF_NGUON (hàm trả mảng bản ghi của một eform, một xã) — màn hình không đổi. */
const XA_EF_QUY = [['2026', 2], ['2026', 1], ['2025', 4], ['2025', 3]];
const XA_EF_LA_MA = ['', 'quy_i', 'quy_ii', 'quy_iii', 'quy_iv'];

/* Cách dựng bản ghi mẫu của từng eform:
     nhom: trường chia nhóm; rows: số dòng mỗi nhóm; ten: trường lấy tên hiển thị chép vào "Tên chỉ tiêu";
     cap: { nhóm: [mã chỉ tiêu…] } khi chỉ tiêu là danh mục cố định (field: trường chỉ tiêu); w: { mã chỉ tiêu: hệ số độ lớn };
     dvtDong: mỗi dòng của nhóm lấy lần lượt một đơn vị tính của danh mục */
/* hop: { trường: { mã nhóm: [mã hợp nghĩa…] } } — bản ghi mẫu chỉ ghép nhóm với giá trị cùng nghĩa (VD nhóm "Kỳ họp HĐND" với
   đối tượng "Kỳ họp HĐND xã"); nhóm không ghi thì lấy bất kỳ giá trị nào của danh mục */
const XA_EF_MAU_CFG = {
  dang: { nhom: 'nhom_muc', rows: 3, ten: 'doi_tuong_thong_ke', hop: { doi_tuong_thong_ke: {
    kiemtragiamsat: ['tochucdang', 'dangvien', 'doanktttra'], thihanhkyluat: ['dangvien', 'tochucdang'], kiemtranhiemvu: ['tccapduoi', 'tochucdonvi'],
    thongkedoanktttra: ['doanktttra'], tongsocbccvc: ['biencheldhd', 'canbo'], danhgiacanbo: ['canbo', 'canbodangvien'], congtacchinhtrinoibo: ['truonghopthamdinh', 'canbodangvien'],
    biendongdangvien: ['dangvien'], cocautochuc: ['tccsd', 'tochucdang', 'tccapduoi'] } } },
  hdnd: { nhom: 'chu_de_nhom', rows: 3, ten: 'doi_tuong_thong_ke', hop: {
    doi_tuong_thong_ke: { '1_nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026': ['nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026'],
      '2_nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030': ['nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030'], '3_nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030': ['nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030'],
      '4_nghi_quyet_quy_che_tiep_cong_dan': ['nghi_quyet_quy_che_tiep_cong_dan'], hoat_dong_giam_sat: ['cuoc_giam_sat', 'ket_qua_thuc_hien_kien_nghi_sau_giam_sat'],
      hop_tt_hdnd: ['buoi_hop_thuong_truc_hdnd_xa'], ky_hop_hdnd: ['ky_hop_hdnd', 'ky_hop_hdnd_xa'], tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa: ['cuoc_tiep_xuc_cu_tri'] },
    phan_loai_ket_qua: { '1_nghi_quyet_phat_trien_kinh_te_xa_hoi_06_thang_cuoi_nam_2026': ['toc_do_tang_truong', 'thu_ngan_sach', 'thu_nhap', 'ty_le'],
      '2_nghi_quyet_phat_trien_kinh_te_xa_hoi_5_nam_2026_2030': ['toc_do_tang', 'thu_ngan_sach', 'cong_nhan', 'san_pham'], '3_nghi_quyet_ve_dau_tu_cong_trung_han_05_nam_2026_2030': ['du_an', 'gia_tri'],
      '4_nghi_quyet_quy_che_tiep_cong_dan': ['buoi'], hoat_dong_giam_sat: ['da_thuc_hien', 'dang_thuc_hien', 'chua_thuc_hien'], hop_tt_hdnd: ['buoi_hop'],
      ky_hop_hdnd: ['so_luong'], tiep_xuc_cu_tri_voi_dai_bieu_hdnd_xa: ['so_luong'] } } },
  hcc: { nhom: 'nhom_chi_tieu', field: 'chi_tieu', w: { tiep_nhan_truc_tuyen: 6, tiep_nhan_truc_tiep: 2.5, dung_va_truoc_han: 7, chua_den_han: 2, da_giai_quyet_qua_han: 0.15, dang_giai_quyet_qua_han: 0.1, ho_so_khong_duoc_tiep_nhan: 0.2 }, cap: {
    so_ho_so_nhan_giai_quyet: ['so_ky_truoc_chuyen_qua', 'tiep_nhan_truc_tiep', 'tiep_nhan_truc_tuyen', 'tiep_nhan_bcci'],
    ket_qua_giai_quyet: ['dung_va_truoc_han', 'da_giai_quyet_qua_han'],
    ho_so_dang_giai_quyet: ['chua_den_han', 'dang_giai_quyet_qua_han'],
    tiep_nhan_ho_so: ['ho_so_tthc_cho_tiep_nhan', 'ho_so_khong_duoc_tiep_nhan'] } },
  tcns: { nhom: 'loai_gia_tri_sl_st', field: 'tieu_chi_tieu', ten: 'tieu_chi_tieu', cap: {
    st: ['tong_thu_ngan_sach_nha_nuoc', 'thu_noi_dia', 'thue_gtgt', 'thue_tncn', 'phi_le_phi', 'le_phi', 'tong_chi_ngan_sach_nha_nuoc', 'chi_dau_tu_phat_trien', 'chi_thuong_xuyen', 'tong_von_dau_tu'],
    sl: ['so_luong_doanh_nghiep_dang_hoat_dong', 'so_luong_htx_dang_hoat_dong', 'so_htx_thanh_lap_moi', 'so_luong_du_an_dau_tu_cong', 'so_ho_thieu_doi'] } },
  qlvb: { nhom: 'loai_van_ban', field: 'nhom_chi_tieu', cap: {
    van_ban_den: ['tong_so_van_ban_den', 'van_ban_den_chua_luu', 'van_ban_den_cho_duy', 'van_ban_den_da_chuye', 'tong_so_cong_van', 'chua_xu_ly', 'dang_xu_ly', 'da_hoan_tat'],
    van_ban_di: ['tong_so_van_ban_di', 'van_ban_lien_thong', 'van_ban_noi_bo'] } },
  gpmb: { nhom: 'nhom_trang_thai' },
  gd: { nhom: 'nhom_chi_tieu', rows: 4, ten: 'bac_hoc_loai_hinh_giao' },
  yte: { nhom: 'nhom_chi_tieu', rows: 3, ten: 'nhom_chi_tieu', dvtDong: true },
  vh: { nhom: 'nhom_chi_tieu', rows: 3, ten: 'doi_tuong_thong_ke', hop: {
    doi_tuong_thong_ke: { nghe_thuat_bieu_dien: ['don_vi_nghe_thuat', 'chuong_trinh', 'lien_hoan', 'hoi_thi'], di_san_van_hoa: ['di_tich', 'di_san_van_hoa_phi_vat_the', 'nghe_nhan'],
      le_hoi: ['le_hoi'], thiet_che_van_hoa: ['thiet_che'], the_thao: ['clb', 'hoi_thi'], du_lich: ['khach', 'doanh_nghiep'], du_an_dau_tu_van_hoa_the_thao: ['du_an'],
      truyen_thong_bao_chi_mang_xa_hoi: ['bao_chi', 'trang_tin', 'mang_xa_hoi'], gia_dinh_van_hoa_co_so: ['ho_gia_dinh', 'thon'] },
    loai_hinh: { nghe_thuat_bieu_dien: ['bieu_dien', 'lien_hoan', 'hoi_thi'], di_san_van_hoa: ['di_san'], le_hoi: ['le_hoi'], thiet_che_van_hoa: ['thiet_che_van_hoa'],
      the_thao: ['giai_dau', 'su_kien_the_thao', 'ngay_hoi_the_thao'], du_lich: ['di_san', 'le_hoi'], du_an_dau_tu_van_hoa_the_thao: ['thiet_che_van_hoa'],
      truyen_thong_bao_chi_mang_xa_hoi: ['su_kien_the_thao', 'le_hoi'], gia_dinh_van_hoa_co_so: ['clb', 'thiet_che_van_hoa'] } } },
  nv: { nhom: 'doi_tuong_thong_ke', rows: 2, ten: 'doi_tuong_thong_ke', hop: { phan_loai_ket_qua: {
    lao_dong_viet_nam: ['tong_so', 'trong_ky'], lao_dong_nuoc_ngoai: ['tong_so', 'trong_ky'], giao_dich_viec_lam: ['so_phien_giao_dich', 'so_luot_nguoi_tham_gia'],
    bien_che: ['ke_hoach_giao', 'thuc_hien'], tuyen_moi: ['trong_ky', 'tong_so'], nghi_huu: ['trong_ky', 'tong_so'], thoi_viec: ['trong_ky', 'tong_so'],
    chuyen_cong_tac: ['trong_ky', 'tong_so'], nguoi_co_cong: ['so_phai_tra', 'so_da_tra'] } } },
  ktxh: { nhom: 'nhom_chi_tieu', rows: 2, ten: 'phan_nhom' },
  mttq: { nhom: 'nhom_to_chuc', rows: 4, uu: ['doanvien', 'giamsat', 'phanbienxahoi', 'hienmau', 'mohinh', 'tongthu', 'tongchi', 'tonquy'] }
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
/* Một số theo đơn vị, quy mô dân số và quý (i = 0 là quý mới nhất) */
function xaEfNum(unit, u, seed, i) {
  const r = xaEfR(seed), rq = xaEfR(seed + '|' + i), sz = Math.sqrt(u.ds / 70000);
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

/* Bản ghi mẫu của một eform cho một xã, phường (cả 4 quý) */
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
  /* các dòng (cố định cho mọi xã, phường để so sánh được qua các quý) */
  const lines = [];
  if (efId === 'gpmb') {
    const n = 2 + Math.floor(xaEfR('gpmb|n|' + u.name) * 4);
    for (let j = 0; j < n; j++) {
      const s = 'gpmb|' + u.name + '|' + j, ma = 'DA-' + String(j + 1).padStart(2, '0');
      const base = { nhom_trang_thai: j < Math.max(1, n - 1) ? 'du_an_dang_trien_khai' : 'du_an_chua_trien_khai', ma_du_an: ma, ten_du_an_khu_vuc_GPMB: 'Dự án ' + String(j + 1).padStart(2, '0'),
        nhom_du_an: xaEfPick(F.nhom_du_an.dm, s + 'nda').v, chu_dau_tu_don_vi_phu_trach: xaEfPick(F.chu_dau_tu_don_vi_phu_trach.dm, s + 'cdt').v };
      lines.push(Object.assign({ loai_dong: 'du_an', _s: s }, base));
      if (j === 0) lines.push(Object.assign({}, base, { loai_dong: 'khu_vuc_con_cua_du_an', ten_du_an_khu_vuc_GPMB: 'Dự án 01 — khu vực 1', _s: s + 'kv', _con: true }));
    }
  } else if (C.cap) {
    Object.keys(C.cap).forEach((g) => C.cap[g].forEach((v) => {
      const L = { _s: efId + '|' + g + '|' + v };
      L[C.nhom] = g; L[C.field] = v;
      lines.push(L);
      if (efId === 'qlvb' && v === 'tong_so_cong_van') lines.push(Object.assign({}, L, { phan_loai: 'qua_han', _s: L._s + '|qh' }));
    }));
  } else {
    const keys = ef.fields.filter((f) => f.t === 'dm' && f.dm.length && f.c !== C.nhom && f.c !== 'don_vi_tinh' && !/^(ky_bao_cao|quy|dia_ban|linh_vuc|cap_don_vi|tan_suat|nguon_so_lieu|don_vi_chu_tri_bao_cao)$/.test(f.c));
    F[C.nhom].dm.forEach((g, gi) => {
      for (let j = 0; j < (C.rows || 3); j++) {
        const L = { _s: efId + '|' + g.v + '|' + j, _j: j };
        L[C.nhom] = g.v;
        keys.forEach((f) => {
          const want = C.hop && C.hop[f.c] && C.hop[f.c][g.v], ok = want ? f.dm.filter((o) => want.indexOf(o.v) >= 0) : [];
          const hop = ok.length > 0, list = hop ? ok : f.dm;
          /* giá trị hợp nghĩa lần lượt theo dòng để các dòng của một nhóm khác nhau */
          L[f.c] = (hop ? list[j % list.length] : xaEfPick(list, L._s + '|' + f.c)).v;
        });
        /* MTTQ: các chỉ tiêu của ô số chính lần lượt có ở các nhóm tổ chức */
        if (C.uu) L.ten_chi_tieu = C.uu[(gi * (C.rows || 3) + j) % C.uu.length];
        if (efId === 'ktxh') { L.phan_nhom = g.v === 'KINH_TE_TONG_HOP' ? (j % 2 ? 'CHI_NGAN_SACH' : 'THU_NGAN_SACH') : null;L.don_vi_chu_tri_bao_cao = g.v === 'VAN_HOA_XA_HOI' ? 'P_VH_XH' : 'P_KTHT_DT'; }
        lines.push(L);
      }
    });
  }
  const out = [];
  XA_EF_QUY.forEach(([nam, q], i) => {
    const thangCuoi = q * 3, ngay = nam + '-' + String(thangCuoi).padStart(2, '0') + '-' + (thangCuoi === 6 || thangCuoi === 9 ? '30' : '31');
    lines.forEach((L) => {
      const R = {};
      ef.fields.forEach((f) => {
        const c = f.c;
        let v = null;
        if (c === 'dia_ban') v = diaBan;
        else if (c === 'ky_bao_cao') v = 'quy';
        else if (c === 'nam') v = Number(nam);
        else if (c === 'thang') v = null;
        else if (c === 'quy') v = XA_EF_LA_MA[q];
        else if (c in L) v = L[c];
        else if (f.t === 'dm' && f.dm.length === 1) v = f.dm[0].v;
        else if (c === 'tan_suat') v = 'quy';
        else if (c === 'nguon_so_lieu' && f.dm.length) v = f.dm[0].v;
        else if (f.t === 'ngay') v = ngay;
        else if (c === 'don_vi' && efId === 'hcc') v = 'UBND ' + (u.k === 'P' ? 'phường ' : 'xã ') + u.short;
        R[c] = v;
      });
      /* tên chỉ tiêu kiểu Chữ: chép tên hiển thị của một danh mục trong cùng bản ghi (không đặt tên mới) */
      if (F.ten_chi_tieu && F.ten_chi_tieu.t === 'chu') R.ten_chi_tieu = lb(C.ten, R[C.ten]) || lb(C.nhom, R[C.nhom]);
      if (F.chi_tieu && F.chi_tieu.t === 'chu') R.chi_tieu = lb(C.ten, R[C.ten]) || lb(C.nhom, R[C.nhom]);
      const texts = Object.keys(R).map((k) => (F[k] && F[k].t === 'dm' ? lb(k, R[k]) : '')).concat([R.ten_chi_tieu || '', R.chi_tieu || '']);
      /* dvtDong: mỗi dòng của nhóm một đơn vị tính (Y tế: số vụ, số người…) để các dòng không trùng mô tả */
      const dv = C.dvtDong && dvtF && dvtF.dm.length ? dvtF.dm[(L._j || 0) % dvtF.dm.length] : xaEfDvt(dvtF, texts, L._s + '|dvt');
      if (dv) R.don_vi_tinh = dv.v;
      const unitText = dv ? dv.l : '';
      numFields.forEach((f) => {
        const unit = xaEfUnitOf(f.l) || (XA_EF_DVT_SO.test(f.c) ? xaEfUnitOf(unitText) : '') || (/^(thu_nsnn|chi_nsdp)$/.test(f.c) ? 'triệu đồng' : '');
        const w = unit === '%' ? 1 : (C.w && C.w[L[C.field]]) || 1;
        R[f.c] = Math.round(xaEfNum(unit, u, L._s + '|' + f.c + '|' + u.name, i) * w * 10) / 10;
        if (!unit || unit === 'đồng' || unit === 'triệu đồng' || unit === 'm²' || unit === 'ha') R[f.c] = Math.round(R[f.c]);
      });
      if (efId === 'tcns') {
        R.gia_tri_luy_ke = Math.round(R.gia_tri_ky_bao_cao * (q + 0.3 * xaEfR(L._s + u.name)) * 10) / 10;
        R.du_toan_kh_nam = Math.round(R.gia_tri_ky_bao_cao * (3.6 + 0.8 * xaEfR(L._s + 'dt' + u.name)) * 10) / 10;
        R.ty_le_so_voi_du_toan_kh = R.du_toan_kh_nam ? (Math.round(R.gia_tri_luy_ke / R.du_toan_kh_nam * 1000) / 10).toString().replace('.', ',') + '%' : '';
      }
      if (efId === 'ktxh') {
        R.uoc_thuc_hien_den_nay = Math.round(R.kh_nam * (q / 4) * (0.85 + 0.25 * xaEfR(L._s + 'u' + u.name + i)));
        R.thanh_pho_giao = R.kh_nam;
        R.danh_gia_muc_do_hoan_thanh = R.kh_nam ? Math.round(R.uoc_thuc_hien_den_nay / R.kh_nam * 1000) / 10 : null;
      }
      if (efId === 'gpmb') {
        const tien = Math.min(100, Math.round((30 + 60 * xaEfR(L._s + 'td')) * Math.pow(0.9, i) * 10) / 10);
        R.tien_do_thuc_te = R.nhom_trang_thai === 'du_an_chua_trien_khai' ? 0 : tien;
        R.trang_thai_tien_do = R.nhom_trang_thai === 'du_an_chua_trien_khai' ? 'chua_thuc_hien' : tien >= 100 ? 'da_hoan_thanh' : 'dang_thuc_hien';
        if (L._con) ['tong_dien_tich_phai_thu_hoi', 'tong_so_doi_tuong_gpmb', 'kinh_phi_boi_thuong_ho_tro_du_kien'].forEach((k) => { R[k] = Math.round(R[k] * 0.4); });
        const k = R.tien_do_thuc_te / 100;
        R.dien_tich_da_thu_hoi = Math.round(R.tong_dien_tich_phai_thu_hoi * k);
        R.ty_le_thu_hoi = R.tong_dien_tich_phai_thu_hoi ? Math.round(R.dien_tich_da_thu_hoi / R.tong_dien_tich_phai_thu_hoi * 1000) / 10 : 0;
        const ho = R.tong_so_doi_tuong_gpmb;
        R.da_thong_bao_thu_hoi_dat = Math.round(ho * Math.min(1, k + 0.3));
        R.da_kiem_dem = Math.round(ho * Math.min(1, k + 0.2));
        R.da_phe_duyet_phuong_an_boi_thuong = Math.round(ho * Math.min(1, k + 0.1));
        R.da_chi_tra_nhan_tien = Math.round(ho * k);
        R.da_ban_giao_mat_bang = Math.round(ho * k * 0.95);
        R.ty_le_ban_giao = ho ? Math.round(R.da_ban_giao_mat_bang / ho * 1000) / 10 : 0;
        R.kinh_phi_da_chi_tra = Math.round(R.kinh_phi_boi_thuong_ho_tro_du_kien * k / 1e4) * 1e4;
      }
      out.push(R);
    });
  });
  return out;
}
/* Nguồn bản ghi của màn hình: (mã eform, đơn vị CTM_XA) → mảng bản ghi { mã trường: giá trị } */
let XA_EF_NGUON = xaEfMau;
const XA_EF_LA_MAU = true;
