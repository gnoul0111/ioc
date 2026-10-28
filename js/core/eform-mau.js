/* ============================== BẢN GHI MẪU CỦA EFORM CẤP THÀNH PHỐ (4 trục) ==============================
   Chưa có dữ liệu thật (sheet "API cần IOC cung cấp" ghi "Chưa cung cấp") nên màn hình chạy bằng bản ghi mẫu dựng ĐÚNG khung eform
   (js/core/eform-khung.js), quy ước 28/10/2026: số liệu, chữ mẫu được tự sinh; KHÔNG sinh thêm trường; ô Danh mục chỉ nhận mã trong
   danh mục; trường Chữ có kèm danh sách (X11) lấy chữ trong danh sách. Bản ghi mẫu giữ các quan hệ hợp lý (đầu kỳ + tăng − giảm = cuối kỳ,
   tổng = cộng thành phần, thông tin một cuộc ghi giống nhau ở mọi bản ghi của cuộc đó) và cố ý có vài bản ghi lệch để màn
   "Dữ liệu đã nhập" có bản ghi cần xem lại. Hạt giống cố định theo eform nên mở lần nào cũng ra cùng số.
   Có dữ liệu thật thì thay EF_NGUON (mã eform → mảng bản ghi { mã trường: giá trị }) và đặt EF_LA_MAU = false. */
const EF_LA_MAU = true;
const EF_MAU_THANG = (function () { const a = []; for (let y = 2025; y <= 2026; y++) for (let m = 1; m <= (y === 2026 ? 9 : 12); m++) a.push([y, m]); return a; })();
const EF_TEN = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Thu Hà', 'Hoàng Văn Nam', 'Vũ Thị Lan', 'Đỗ Quang Huy', 'Bùi Thị Mai', 'Ngô Đức Long', 'Đặng Thu Trang'];
const EF_XA_TEN = (typeof CTM_XA !== 'undefined' ? CTM_XA.map((u) => u.name) : []);

function efMauRng(seed) { const r = ctmRng(seed); return { f: r, i: (a, b) => a + Math.floor(r() * (b - a + 1)), p: (list) => list[Math.floor(r() * list.length) % list.length], c: (x) => r() < x }; }
function efMauNgay(y, m, d) { return y + '-' + String(m).padStart(2, '0') + '-' + String(Math.max(1, Math.min(28, d))).padStart(2, '0'); }
/* Điền giá trị mẫu cho trường chưa có: theo kiểu trường và tên trường */
function efMauDien(f, r, ctx) {
  const c = f.c, l = f.l;
  if (f.dm && f.dm.length) {
    const o = r.p(f.dm.filter((x) => !/không phát sinh/i.test(x.l)).length ? f.dm.filter((x) => !/không phát sinh/i.test(x.l)) : f.dm);
    return f.t === 'dm' ? o.v : o.l;
  }
  if (f.t === 'so') {
    if (/%|tỷ lệ/i.test(l)) return Math.round((55 + 44 * r.f()) * 10) / 10;
    if (/VNĐ|VND|đồng/i.test(l)) return Math.round((5 + 400 * r.f()) * 1e5) * 1e4;
    if (/ngày/i.test(l)) return r.i(0, 12);
    return r.i(1, 60);
  }
  if (f.t === 'ngay') return efMauNgay(ctx.y, ctx.m || 6, r.i(1, 28));
  if (/nguoi|ho_va_ten/.test(c)) return r.p(EF_TEN);
  if (/ghi_chu|minh_chung|vuong_mac|kien_nghi_de_xuat|giai_trinh/.test(c)) return r.c(0.2) ? r.p(['Đã đối chiếu số liệu', 'Bổ sung minh chứng trong tháng sau', 'Số liệu tạm tính']) : '';
  if (/so_van_ban|so_hieu|van_ban_giao|so_chung_tu|ten_so_hieu/.test(c)) return r.i(10, 999) + '/' + ctx.y + '/' + r.p(['BC', 'TB', 'QĐ', 'KH', 'NQ']);
  if (/dia_ban|dia_diem/.test(c)) return r.p(EF_XA_TEN);
  if (/don_vi/.test(c)) return r.p(['UBND ' + r.p(EF_XA_TEN).replace(/^(Phường|Xã) /, (s) => s.toLowerCase()), 'Sở Nội vụ', 'Sở Tài chính', 'Sở Xây dựng', 'Sở Y tế']);
  if (/nguon_du_lieu/.test(c)) return r.p(['Báo cáo của đơn vị', 'Hệ thống nghiệp vụ', 'Đối soát thủ công']);
  return l + ' ' + r.i(1, 20);
}
/* Kỳ báo cáo của bản ghi */
/* Chỉ điền trường kỳ mà eform có (không sinh thêm trường): eform chỉ có «Kỳ báo cáo» thì chỉ điền trường đó */
function efMauKy(R, loai, y, mq, F) {
  const set = (c, v) => { if (!F || F[c]) R[c] = v; };
  set('ky_bao_cao', loai); set('nam', y);
  if (loai === 'thang') { set('thang', mq); set('quy', ['quy_i', 'quy_ii', 'quy_iii', 'quy_iv'][Math.ceil(mq / 3) - 1]); }
  else if (loai === 'quy') set('quy', ['quy_i', 'quy_ii', 'quy_iii', 'quy_iv'][mq - 1]);
}
/* Dựng các bản ghi: cfg.ky = 'thang' | 'quy' | 'nam'; cfg.gen(ctx, push, r) đẩy từng bản ghi (chỉ các trường muốn đặt), phần còn lại điền mẫu */
function efMauDung(efId, cfg) {
  const ef = EFK[efId], out = [], r = efMauRng('ef|' + efId), st = {};
  const periods = cfg.ky === 'nam' ? [[2025], [2026]] : cfg.ky === 'quy' ? EF_MAU_THANG.filter((x) => x[1] % 3 === 0).map((x) => [x[0], x[1] / 3]) : EF_MAU_THANG;
  periods.forEach((p, pi) => {
    if (!ef.F.nam && pi !== periods.length - 1) return; /* eform không có «Năm»: chỉ một lượt bản ghi (lượt cuối) */
    const ctx = { y: p[0], m: cfg.ky === 'thang' ? p[1] : cfg.ky === 'quy' ? p[1] * 3 : 12, q: cfg.ky === 'quy' ? p[1] : null, pi: pi, st: st };
    cfg.gen(ctx, (part) => {
      const R = {};
      efMauKy(R, cfg.ky, p[0], p[1], ef.F);
      /* part được ghi đè trường kỳ (VD một eform có cả bản năm và bản quý) */
      ef.fields.forEach((f) => { R[f.c] = f.c in part ? part[f.c] : f.c in R ? R[f.c] : efMauDien(f, r, ctx); });
      out.push(R);
    }, r);
  });
  return out;
}
function efLbs(efId, c) { return (EFK[efId].F[c].dm || []).map((o) => o.l); }
function efVs(efId, c) { return (EFK[efId].F[c].dm || []).map((o) => o.v); }
function efVof(efId, c, l) { const o = (EFK[efId].F[c].dm || []).find((x) => x.l === l); return o ? o.v : null; }

const EF_MAU_CFG = {
  /* ---------- Trục Đảng ủy ---------- */
  dang1: { ky: 'thang', gen: (x, push, r) => { for (let i = 0; i < 10; i++) { const ms = r.i(4, 40), th = r.i(Math.floor(ms * 0.5), ms), sai = r.c(0.03);
    push({ nhom_du_lieu: r.c(0.8) ? 'chi_tieu' : 'doan_ktgs', mau_so_ke_hoach: ms, gia_tri_thuc_hien: th, ty_le_hoan_thanh_phan_tram: Math.round(th / ms * 1000) / 10 + (sai ? 7 : 0),
      so_don_vi_cong_bo_trien_khai_qd: r.i(2, 30), so_don_vi_da_bao_cao: r.i(2, 30), so_don_vi_duoc_kiem_tra_da_lam_viec: r.i(0, 12), so_kho_khan_kien_nghi: r.i(0, 4),
      ten_don_vi: 'UBKT ' + r.p(['Đảng ủy ', 'Đảng ủy ']) + r.p(EF_XA_TEN).toLowerCase().replace(/^(phường|xã) /, (s) => s), co_du_lieu: r.c(0.9) ? 'ok' : r.p(['thieu_minh_chung', 'thieu_mau_so']),
      trang_thai_doi_soat: r.c(0.8) ? 'da_doi_soat' : 'chua_doi_soat', lop_du_lieu: r.p(['lop_0', 'lop_1', 'lop_2']), minh_chung_url: '' }); } } },
  /* đánh giá cán bộ: bản năm 2025 và bản quý của năm 2026 */
  dang2: { ky: 'quy', gen: (x, push, r) => { const nam = x.y === 2025; if (nam && x.q !== 4) return; const ky = nam ? { ky_bao_cao: 'nam', quy: null } : {}; efVs('dang2', 'don_vi').forEach((dv, i) => { const tot = r.i(40, 900), xs = Math.round(tot * (0.12 + 0.08 * r.f())), kht = Math.round(tot * 0.01 * r.f()), kdg = r.i(0, 3), ht = Math.round(tot * 0.2 * r.f()), tot2 = tot - xs - kht - kdg - ht;
    push(Object.assign({ don_vi: dv, so_hoan_thanh_xuat_sac_nhiem_vu: xs, so_hoan_thanh_tot_nhiem_vu: tot2, so_hoan_thanh_nhiem_vu: ht, so_khong_hoan_thanh_nhiem_vu: kht, so_khong_danh_gia_xep_loai: kdg, tong_so_can_bo_duoc_danh_gia: tot + (nam && i === 3 ? 2 : 0), ngay_cap_nhat: nam ? '2026-01-' + String(10 + i).padStart(2, '0') : efMauNgay(x.y, x.m, 10 + i) }, ky)); }); } },
  dang3: { ky: 'thang', gen: (x, push, r) => { for (let i = 0; i < 6; i++) { const d = r.i(1, 20), xong = r.c(0.6);
    push({ chuc_vu: r.p(['Chuyên viên', 'Phó Trưởng phòng', 'Trưởng phòng', 'Phó Chủ tịch UBND', 'Bí thư chi bộ']), noi_dung_chi_tiet: r.p(['Thẩm định tiêu chuẩn chính trị', 'Đi công tác nước ngoài theo đoàn', 'Giải quyết chế độ chính sách', 'Xác minh lý lịch']),
      thoi_gian_bat_dau: efMauNgay(x.y, x.m, d), thoi_gian_ket_thuc: xong ? efMauNgay(x.y, x.m, d + r.i(2, 8)) : null, trang_thai_xu_ly_thuc_hien: xong ? 'hoan_thanh' : r.p(['dang_xu_ly_dang_xac_minh', 'dang_xu_ly_dang_xac_minh', 'tam_dung']),
      ket_qua_ket_luan: xong ? r.p(['Đủ tiêu chuẩn', 'Hoàn thành', 'Đã giải quyết']) : '', ngay_xac_nhan: efMauNgay(x.y, x.m, 28), ghi_chu: '' }); } } },
  dang4: { ky: 'quy', gen: (x, push, r) => { const ds = x.st.dang4 || (x.st.dang4 = Array.from({ length: 36 }, (_, i) => ({ ten: (i < 24 ? 'Đảng bộ ' : 'Chi bộ ') + EF_XA_TEN[i * 3 % EF_XA_TEN.length].replace(/^(Phường|Xã)/, (s) => s.toLowerCase()), lh: i < 24 ? 'dang_bo_co_so' : 'chi_bo_co_so', cap: r.p(efVs('dang4', 'cap_quan_ly_truc_tiep')), dv: r.i(30, 600) })));
    ds.forEach((o) => { o.dv += r.i(-3, 8); push({ ten_to_chuc_dang: o.ten, loai_hinh: o.lh, cap_quan_ly_truc_tiep: o.cap, so_dang_vien_truc_thuoc: o.dv, so_chi_bo_truc_thuoc: o.lh === 'dang_bo_co_so' ? Math.round(o.dv / 30) : 0, ngay_thanh_lap_kien_toan_gan_nhat: '2025-07-01', ngay_cap_nhat: efMauNgay(x.y, x.m, 25) }); }); } },
  dang5: { ky: 'thang', gen: (x, push, r) => { const st = x.st.dang5 || (x.st.dang5 = {}); EF_XA_TEN.forEach((xa, i) => { const u = CTM_XA[i], dau = st[xa] || Math.round(u.ds * (0.045 + 0.02 * r.f()));
    const kn = r.i(0, 7), den = r.i(0, 4), di = r.i(0, 4), xoa = r.c(0.08) ? 1 : 0, tt = r.i(0, 2), cuoi = dau + kn + den - di - xoa - tt;
    st[xa] = cuoi; push({ dia_ban: efVs('dang5', 'dia_ban')[i], tong_dang_vien_hien_co_dau_ky: dau, chi_tieu_ket_nap_duoc_giao: r.i(3, 8), so_ket_nap_moi_trong_ky: kn, so_chuyen_den: den, so_chuyen_di: di, so_bi_xoa_ten_cho_ra_khoi_dang: xoa, so_tu_tran: tt,
      tong_dang_vien_hien_co_cuoi_ky: cuoi + (x.pi === 20 && i === 5 ? 3 : 0), ngay_xac_nhan: efMauNgay(x.y, x.m, 28) }); }); } },
  dang6: { ky: 'quy', gen: (x, push, r) => { const st = x.st.dang6 || (x.st.dang6 = {}); efVs('dang6', 'don_vi').forEach((dv) => { const o = st[dv] || (st[dv] = { giao: r.i(20, 260), k: 1.1 + r.f(), tc: r.i(3, 60) }); if (x.q === 1) o.giao += r.i(-3, 6);
    push({ don_vi: dv, so_cbccvc_khoi_dang_mttq: Math.round(o.giao * o.k) + r.i(-4, 4), so_to_chuc_co_so_dang_truc_thuoc: o.tc, bien_che_duoc_giao: o.giao, bien_che_hien_co: o.giao - r.i(0, Math.ceil(o.giao * 0.08)), ngay_xac_nhan: efMauNgay(x.y, x.m, 25) }); }); } },
  dang7: { ky: 'thang', gen: (x, push, r) => { const T = { 'Lĩnh vực dân vận khéo': ['Mô hình dân vận khéo đăng ký', 'Mô hình được biểu dương'], 'Loại đối tượng': ['Đối tượng được tuyên truyền'], 'Hội nghị': ['Hội nghị học tập, quán triệt nghị quyết', 'Đại biểu dự hội nghị'],
      'Tuyên truyền': ['Tin, bài tuyên truyền', 'Điểm cầu trực tuyến'], 'Báo cáo viên': ['Báo cáo viên được cập nhật thông tin'], 'Cộng tác viên': ['Cộng tác viên dư luận xã hội'] };
    const DVT = { 'Lĩnh vực dân vận khéo': 'Lượt đăng ký', 'Loại đối tượng': 'Đối tượng', 'Hội nghị': 'Đại biểu', 'Tuyên truyền': 'Tin/bài', 'Báo cáo viên': 'Người', 'Cộng tác viên': 'Người' };
    for (let i = 0; i < 10; i++) { const nh = r.p(Object.keys(T)), xa = r.p(EF_XA_TEN); push({ nhom_phan_loai: efVof('dang7', 'nhom_phan_loai', nh), ten_chi_tieu: r.p(T[nh]), dia_ban: xa, don_vi_cung_cap: 'Đảng ủy ' + xa.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()),
      chi_tiet_phan_loai: '', gia_tri: r.i(3, 400), don_vi_tinh: efVof('dang7', 'don_vi_tinh', DVT[nh]), trang_thai_doi_soat: r.c(0.85) ? 'da_doi_soat' : 'can_bo_sung', nguon_du_lieu: 'Báo cáo của đơn vị', minh_chung_url: '' }); } } },
  dang8: { ky: 'thang', gen: (x, push, r) => { const T = { 'Tiếp công dân': ['Lượt công dân được tiếp', 'Buổi tiếp công dân định kỳ'], 'Văn bản tham mưu': ['Văn bản tham mưu Thường trực Thành ủy'], 'Cháy, nổ': ['Vụ cháy, nổ được theo dõi'], 'Khiếu nại, tố cáo đông người': ['Đoàn khiếu nại, tố cáo đông người'] };
    const DVT = { 'Tiếp công dân': 'Lượt người', 'Văn bản tham mưu': 'Văn bản', 'Cháy, nổ': 'Vụ việc', 'Khiếu nại, tố cáo đông người': 'Cuộc' };
    for (let i = 0; i < 9; i++) { const nh = r.p(Object.keys(T)); push({ nhom_phan_loai: efVof('dang8', 'nhom_phan_loai', nh), ten_chi_tieu: r.p(T[nh]), dia_ban: r.p(efVs('dang8', 'dia_ban')), don_vi_cung_cap: 'Ban Nội chính Thành ủy',
      gia_tri: nh === 'Tiếp công dân' ? r.i(20, 260) : r.i(1, 25), don_vi_tinh: efVof('dang8', 'don_vi_tinh', DVT[nh]), trang_thai_doi_soat: r.c(0.85) ? 'da_doi_soat' : 'chua_doi_soat', nguon_du_lieu: 'Báo cáo của đơn vị', minh_chung_url: '' }); } } },
  /* ---------- Trục HĐND ---------- */
  hdnd1: { ky: 'thang', gen: (x, push, r) => { const nc = r.i(3, 7); for (let c = 0; c < nc; c++) { const ten = 'TXCT-' + x.y + String(x.m).padStart(2, '0') + '-' + (c + 1), ngay = r.i(1, 20), xa = r.p(EF_XA_TEN), lc = r.i(60, 320), nk = r.i(2, 6);
    for (let k = 0; k < nk; k++) { const t1 = r.c(0.85), t2 = t1 && r.c(0.7), t3 = t2 && r.c(0.6);
      push({ ten_cuoc_txct: ten, ngay_to_chuc_txct: efMauNgay(x.y, x.m, ngay), dia_diem_don_vi_bau_cu: xa + ', Hà Nội', so_luot_cu_tri_tham_gia: lc + (x.pi === 20 && c === 0 && k === 1 ? 15 : 0), so_hieu_kien_nghi: c * 10 + k + 1,
        noi_dung_kien_nghi: r.p(['Đề nghị sửa chữa tuyến đường', 'Đề nghị giải quyết úng ngập', 'Đề nghị cấp giấy chứng nhận quyền sử dụng đất', 'Đề nghị tăng cường trật tự đô thị', 'Đề nghị bổ sung trường mầm non']),
        ngay_ghi_nhan_kien_nghi: efMauNgay(x.y, x.m, ngay), ngay_chuyen_co_quan_xu_ly: t1 ? efMauNgay(x.y, x.m, ngay + 2) : null, ngay_co_quan_tra_loi: t2 ? efMauNgay(x.y, x.m, ngay + 6) : null, ngay_giai_quyet_dut_diem: t3 ? efMauNgay(x.y, x.m, ngay + 10) : null,
        da_chuyen_xu_ly: t1 ? 'da_xu_ly' : 'chua', da_tra_loi: t2 ? 'da_tl' : 'chua1', da_giai_quyet_dut_diem: t3 ? 'da_gq' : 'chua2', thoi_gian_xu_ly_ngay: t3 ? efMauNgay(x.y, x.m, ngay + 10) : null, so_van_ban_lien_quan: r.i(0, 3), trang_thai_doi_soat: r.c(0.85) ? 'da_doi_soat' : 'chua_doi_soat' }); } } } },
  hdnd2: { ky: 'thang', gen: (x, push, r) => { const KH = efVs('hdnd2', 'khoi'), DV = efVs('hdnd2', 'don_vi');
    for (let i = 0; i < 10; i++) { const k = r.p(KH), g = r.i(1, 18), han = g + r.i(5, 10), st = r.p(['hoan_thanh', 'hoan_thanh', 'dang_thuc_hien', 'chua_thuc_hien', 'qua_han']);
      push({ khoi: k, don_vi: DV.indexOf(k) >= 0 ? k : r.p(DV), ngay_giao: efMauNgay(x.y, x.m, g), han_hoan_thanh: efMauNgay(x.y, x.m, han), tinh_trang_nhan_nhiem_vu: st === 'chua_thuc_hien' ? 'chua_nhan' : 'da_nhan', tinh_trang_thuc_hien: st,
        ngay_hoan_thanh_thuc_te: st === 'hoan_thanh' ? efMauNgay(x.y, x.m, han - 1) : null, so_ngay_cham_tien_do: st === 'qua_han' ? r.i(1, 15) : 0, ghi_chu: '' }); } } },
  hdnd3: { ky: 'thang', gen: (x, push, r) => { const nh = r.i(1, 3); for (let h = 0; h < nh; h++) { const loai = r.p(efVs('hdnd3', 'loai_hoat_dong')), ten = r.p(['Giám sát công tác giải phóng mặt bằng', 'Chất vấn về xử lý rác thải', 'Giải trình về chậm tiến độ dự án', 'Giám sát chương trình xây dựng trường học']) + ' ' + String(x.m) + '/' + x.y, nk = r.i(1, 4), ngay = r.i(1, 15);
    for (let k = 0; k < nk; k++) { const st = r.p(['da_hoan_thanh', 'da_hoan_thanh', 'dang_xu_ly', 'chua_xu_ly', 'qua_han']);
      push({ loai_hoat_dong: loai, ten_chu_de_hoat_dong: ten, ngay_to_chuc: efMauNgay(x.y, x.m, ngay), so_hieu_kien_nghi: 'KN-' + x.y + '-' + x.m + '-' + (h + 1) + '.' + (k + 1), so_kien_nghi_sau_giam_sat: nk,
        noi_dung_kien_nghi: r.p(['Đẩy nhanh tiến độ bàn giao mặt bằng', 'Bổ sung kinh phí duy tu', 'Rà soát quy trình cấp phép']), don_vi_ca_nhan_chiu_trach_nhiem_xu_ly: r.p(['Sở Xây dựng', 'Sở Tài chính', 'UBND ' + r.p(EF_XA_TEN).toLowerCase()]),
        ngay_phat_sinh_kien_nghi: efMauNgay(x.y, x.m, ngay), han_xu_ly_theo_quy_dinh: efMauNgay(x.y, x.m, ngay + 12), ngay_hoan_thanh_xu_ly: st === 'da_hoan_thanh' ? efMauNgay(x.y, x.m, ngay + 9) : null, trang_thai_xu_ly: st, so_ky_giam_sat_chat_van_da_neu: r.c(0.25) ? r.i(2, 4) : 1,
        nguon_du_lieu: 'Biên bản giám sát', so_van_ban_bien_ban_lien_quan: r.i(0, 2), trang_thai_doi_soat: 'da_doi_soat' }); } } } },
  hdnd4: { ky: 'thang', gen: (x, push, r) => { for (let i = 0; i < 12; i++) { const coKN = r.c(0.4); push({ ten_chu_de_hoat_dong: r.p(['Họp Thường trực thường kỳ', 'Thẩm tra dự thảo nghị quyết', 'Giám sát thu chi ngân sách', 'Khảo sát an toàn thực phẩm', 'Tiếp xúc cử tri khu vực']) + ' tháng ' + x.m,
    ngay_to_chuc_ban_hanh: efMauNgay(x.y, x.m, r.i(1, 28)), so_hieu_kien_nghi: coKN ? 'KN-' + r.i(1, 90) : null, noi_dung_kien_nghi: coKN ? 'Đề nghị đơn vị khắc phục tồn tại' : null, don_vi_duoc_kien_nghi: coKN ? r.p(['UBND Thành phố', 'Sở Tài chính', 'Sở Y tế']) : null,
    trang_thai_tiep_thu: coKN ? r.p(['da_tiep_thu', 'chua_tiep_thu', 'dang_xu_ly']) : 'khong_ap_dung', so_van_ban_lien_quan: r.i(0, 3), trang_thai_doi_soat: 'da_doi_soat' }); } } },
  hdnd5: { ky: 'thang', gen: (x, push, r) => { const hop = [3, 7, 12].indexOf(x.m) >= 0 ? 'thuong_le' : r.c(0.35) ? 'chuyen_de' : null; if (!hop) return; const ten = 'Kỳ họp ' + (hop === 'thuong_le' ? 'thường lệ' : 'chuyên đề') + ' tháng ' + x.m + '/' + x.y, nq = hop === 'thuong_le' ? r.i(12, 30) : r.i(3, 9), km = r.i(3, 18);
    for (let i = 0; i < nq; i++) { const tre = r.c(0.08); push({ ten_so_hieu_ky_hop: ten, loai_ky_hop: hop, ngay_khai_mac_ky_hop: efMauNgay(x.y, x.m, km), ngay_be_mac_ky_hop: efMauNgay(x.y, x.m, km + 2), so_hieu_nghi_quyet: (i + 1) + '/' + x.y + '/NQ-HĐND-' + x.m,
      trich_yeu_nghi_quyet: r.p(['Nghị quyết về dự toán ngân sách', 'Nghị quyết về đầu tư công', 'Nghị quyết về chính sách hỗ trợ', 'Nghị quyết về quy hoạch', 'Nghị quyết về giá dịch vụ']), ngay_hdnd_thong_qua: efMauNgay(x.y, x.m, km + 2),
      ngay_ban_hanh_chinh_thuc: efMauNgay(x.y, x.m, km + (tre ? 14 : 5)), han_ban_hanh_theo_quy_dinh: efMauNgay(x.y, x.m, km + 10), linh_vuc_nghi_quyet: r.p(['Kinh tế - xã hội', 'Ngân sách', 'Đô thị', 'Văn hóa - xã hội', 'Pháp chế']), nguon_du_lieu: 'Văn bản', so_van_ban_qd_lien_quan: r.i(0, 2), trang_thai_doi_soat: 'da_doi_soat' }); } } },
  hdnd6: { ky: 'quy', gen: (x, push, r) => { const rong = { ten_tieu_chi_hieu_qua_dai_dien_dan_cu: null, loai_tieu_chi: null, gia_tri_tieu_chi: null, chi_so_hieu_qua_dai_dien_dan_cu: null, dot_khao_sat_hai_long_cu_tri: null, ngay_khao_sat: null, tong_so_phieu_phat_ra: null, tong_so_phieu_thu_ve: null, so_phieu_hai_long_rat_hai_long: null,
      don_vi_thuc_hien_khao_sat: null, linh_vuc_kien_nghi: null, noi_dung_kien_nghi: null, ngay_tiep_nhan_kien_nghi: null, han_giai_quyet: null, ngay_giai_quyet: null, trang_thai_kien_nghi: null, kien_nghi_lap_lai_hang_nam: null, ke_hoach_nam_cua_hdnd: null, trang_thai_ke_hoach_nam: null, ngay_hoan_thanh: null, ghi_chu: '' };
    const dv = ['HĐND Thành phố', 'Đoàn ĐBQH Thành phố'];
    ['tiep_xuc_cu_tri', 'chat_van_giai_trinh', 'giam_sat_chuyen_de', 'ban_hanh_nghi_quyet'].filter((v) => efVs('hdnd6', 'loai_tieu_chi').indexOf(v) >= 0).forEach((lt, i) => push(Object.assign({}, rong, { don_vi_hdnd_doan_dbqh: dv[i % 2], ten_tieu_chi_hieu_qua_dai_dien_dan_cu: 'Tiêu chí ' + (i + 1), loai_tieu_chi: lt, gia_tri_tieu_chi: Math.round((70 + 28 * r.f()) * 10) / 10, chi_so_hieu_qua_dai_dien_dan_cu: Math.round((60 + 35 * r.f()) * 10) / 10 })));
    const ph = r.i(800, 1500), tv = Math.round(ph * (0.8 + 0.15 * r.f())); push(Object.assign({}, rong, { don_vi_hdnd_doan_dbqh: dv[0], dot_khao_sat_hai_long_cu_tri: 'Khảo sát quý ' + x.q + '/' + x.y, ngay_khao_sat: efMauNgay(x.y, x.m, 15), tong_so_phieu_phat_ra: ph, tong_so_phieu_thu_ve: tv, so_phieu_hai_long_rat_hai_long: Math.round(tv * (0.7 + 0.2 * r.f())), don_vi_thuc_hien_khao_sat: 'Văn phòng Đoàn ĐBQH - HĐND' }));
    for (let i = 0; i < 5; i++) push(Object.assign({}, rong, { don_vi_hdnd_doan_dbqh: dv[0], linh_vuc_kien_nghi: r.p(efVs('hdnd6', 'linh_vuc_kien_nghi').filter((v) => !/khong_phat_sinh/.test(v))), noi_dung_kien_nghi: 'Kiến nghị cử tri ' + (i + 1), ngay_tiep_nhan_kien_nghi: efMauNgay(x.y, x.m - 1, r.i(1, 20)), han_giai_quyet: efMauNgay(x.y, x.m, 28), trang_thai_kien_nghi: r.p(efVs('hdnd6', 'trang_thai_kien_nghi').filter((v) => !/khong_phat_sinh|chua_xac_dinh/.test(v))), kien_nghi_lap_lai_hang_nam: r.c(0.3) ? efVs('hdnd6', 'kien_nghi_lap_lai_hang_nam')[0] : efVs('hdnd6', 'kien_nghi_lap_lai_hang_nam')[1] }));
    if (x.q === 1 || x.q === 3) push(Object.assign({}, rong, { don_vi_hdnd_doan_dbqh: dv[0], ke_hoach_nam_cua_hdnd: 'Kế hoạch giám sát năm ' + x.y, trang_thai_ke_hoach_nam: r.p(efVs('hdnd6', 'trang_thai_ke_hoach_nam').filter((v) => !/khong_phat_sinh/.test(v))) })); } },
  /* ---------- Trục MTTQ ---------- */
  mttq1: { ky: 'thang', gen: (x, push, r) => { for (let i = 0; i < 9; i++) { const g = r.i(1, 20), st = r.p(['hoan_thanh', 'hoan_thanh', 'dang_thuc_hien', 'chua_thuc_hien', 'qua_han']);
    push({ so_van_ban_giao: r.i(100, 999), ngay_van_ban: efMauNgay(x.y, x.m, g), don_vi_giao: 'Ban Thường trực Ủy ban MTTQ Thành phố', don_vi_thuc_hien: r.p(['Ban Dân chủ, Giám sát', 'Ban Tuyên giáo và CTXH', 'Ban Tổ chức, kiểm tra', 'Văn phòng Cơ quan']),
      noi_dung_nhiem_vu: r.p(['Tổng hợp kết quả giám sát', 'Chuẩn bị hội nghị phản biện', 'Báo cáo vận động Quỹ', 'Tổng hợp ý kiến cử tri']), ngay_giao: efMauNgay(x.y, x.m, g), han_hoan_thanh: efMauNgay(x.y, x.m, Math.min(28, g + 10)), trang_thai_giao: 'da_giao', trang_thai_nhan: st === 'chua_thuc_hien' ? 'chua_nhan' : 'da_nhan',
      trang_thai_thuc_hien: st, ngay_hoan_thanh: st === 'hoan_thanh' ? efMauNgay(x.y, x.m, Math.min(28, g + 7)) : null, ket_qua_thuc_hien: st === 'hoan_thanh' ? 'Đã hoàn thành' : '' }); } } },
  mttq2: { ky: 'thang', gen: (x, push, r) => { const dvs = EF_XA_TEN.slice(0, 12).map((n) => ['Ủy ban MTTQ ' + n.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()), 'xa_phuong']).concat([['Sở Tài chính', 'so_nganh'], ['Sở Y tế', 'so_nganh'], ['Sở Xây dựng', 'so_nganh']]);
    dvs.forEach(([dv, cap], j) => { const rows = r.i(2, 4), parts = []; const seen = {}; for (let k = 0; k < rows; k++) { const ht = r.p(efVs('mttq2', 'hinh_thuc_ung_ho')), ng = r.p(efVs('mttq2', 'nguon_ung_ho')); if (seen[ht + ng]) continue; seen[ht + ng] = 1; parts.push({ hinh_thuc_ung_ho: ht, nguon_ung_ho: ng, so_tien_ung_ho: Math.round((2 + 60 * r.f()) * 1e6 / 1e4) * 1e4, so_to_chuc_don_vi_ung_ho: r.i(0, 12), so_ca_nhan_nha_hao_tam_ung_ho: r.i(2, 80) }); }
      const tong = parts.reduce((s, p) => s + p.so_tien_ung_ho, 0), ct = Math.round(tong * (0.9 + 0.6 * r.f()) / 1e6) * 1e6, cv = cap === 'xa_phuong' ? efVs('mttq2', 'cap_bao_cao').find((v) => /xa/.test(v)) || efVs('mttq2', 'cap_bao_cao')[0] : efVs('mttq2', 'cap_bao_cao').find((v) => /so/.test(v)) || efVs('mttq2', 'cap_bao_cao')[1];
      const chung = { don_vi_bao_cao: dv, cap_bao_cao: cv, chi_tieu_van_dong_duoc_giao: ct, tong_so_tien_van_dong_duoc: tong + (x.pi === 20 && j === 2 ? 5e6 : 0), ty_le_hoan_thanh_chi_tieu: Math.round(tong / ct * 1000) / 10, so_tien_quy_mttq_tp_ho_tro: r.c(0.3) ? r.i(1, 8) * 1e7 : 0,
        muc_dich_ho_tro_tu_mttq_tp: r.c(0.3) ? 'Hỗ trợ xây nhà Đại đoàn kết' : '', so_nha_dai_doan_ket_ho_tro_tu_mttq_tp: r.c(0.3) ? r.i(1, 3) : 0, so_suat_ho_tro_sinh_ke_tu_mttq_tp: r.i(0, 5), so_tien_quy_dia_phuong_da_chi: Math.round(tong * 0.6 / 1e4) * 1e4, so_du_quy_dia_phuong_cuoi_ky: Math.round(tong * 0.4 / 1e4) * 1e4 };
      parts.forEach((p) => push(Object.assign({}, chung, p))); }); } },
  mttq3: { ky: 'nam', gen: (x, push, r) => { const dvs = EF_XA_TEN.slice(0, 30); dvs.forEach((xa, i) => { const vd = Math.round((5 + 120 * r.f()) * 1e6 / 1e4) * 1e4, ch = x.y === 2026 && r.c(0.4) ? Math.round(vd * r.f() / 1e4) * 1e4 : vd;
    push({ dot_van_dong: 'Đợt vận động ủng hộ Quỹ "Vì biển, đảo Việt Nam" năm ' + x.y, ten_don_vi: 'Ủy ban MTTQ ' + xa.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()), cap_don_vi: 'cap_co_so', dia_ban: efVs('mttq3', 'dia_ban')[EF_XA_TEN.indexOf(xa)], so_tien_da_van_dong: vd, so_tien_da_chuyen_ve_quy_thanh_pho: ch,
      so_tien_con_phai_chuyen: vd - ch + (i === 7 ? 1e6 : 0), ty_le_da_chuyen_phan_tram: Math.round(ch / vd * 1000) / 10, ngay_chuyen_quy_gan_nhat: efMauNgay(x.y, x.y === 2026 ? 8 : 11, r.i(1, 28)), trang_thai_chuyen_quy: ch === vd ? 'da_chuyen_du' : ch > 0 ? 'chuyen_mot_phan' : 'chua_chuyen',
      nguon_du_lieu: 'chung_tu_ngan_hang', so_chung_tu: r.i(1, 40), minh_chung_url: '', trang_thai_doi_soat: r.c(0.8) ? 'da_doi_soat' : 'chua_doi_soat', co_du_lieu: i === 7 ? 'can_bo_sung_kiem_tra' : 'ok', ngay_cap_nhat: efMauNgay(x.y, x.y === 2026 ? 9 : 12, 5) }); }); } },
  mttq4: { ky: 'thang', gen: (x, push, r) => { const st = x.st.mttq4 || (x.st.mttq4 = {}); EF_XA_TEN.forEach((xa, i) => { const u = CTM_XA[i], dau = st[xa] != null ? st[xa] : Math.round(u.ds * 3 / 1e3) * 1e3;
    const T = ['thu_ung_ho_cq_to_chuc_dn_trong_nuoc', 'thu_ung_ho_ca_nhan_trong_nuoc', 'thu_ung_ho_cbccvc_nld', 'thu_ung_ho_to_chuc_ca_nhan_nuoc_ngoai', 'thu_dieu_chuyen_tu_quy_cap_khac', 'thu_lai_tien_gui_ngan_hang', 'thu_khac'];
    const C = ['chi_ho_tro_xay_moi_nha_ddk', 'chi_ho_tro_sua_chua_nha', 'chi_ho_tro_kham_chua_benh', 'chi_ho_tro_hssv_ngheo', 'chi_ho_tro_von_sx_sinh_ke', 'chi_ho_tro_dip_le_tet', 'chi_phi_quan_ly_quy', 'chi_khac'];
    const R = {}, he = x.m === 11 ? 4 : x.m === 1 || x.m === 12 ? 2 : 1; T.forEach((k, j) => { R[k] = j === 3 && r.c(0.85) ? 0 : Math.round(u.ds * (j < 3 ? 0.4 : 0.05) * he * r.f()) * 100; });
    const thu = T.reduce((s, k) => s + R[k], 0); C.forEach((k, j) => { R[k] = (j === 5 && he < 2) ? 0 : Math.round(thu * (0.05 + 0.1 * r.f()) / 100) * 100; });
    const chi = C.reduce((s, k) => s + R[k], 0), cuoi = dau + thu - chi; st[xa] = cuoi;
    push(Object.assign(R, { dot_van_dong: 'Năm ' + x.y, ngay_bao_cao: efMauNgay(x.y, x.m, 28), tinh_tp: efVs('mttq4', 'tinh_tp')[0], dia_ban: efVs('mttq4', 'dia_ban')[i], don_vi_mttq_bao_cao: 'Ủy ban MTTQ ' + xa.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()),
      cap_bao_cao: efVs('mttq4', 'cap_bao_cao')[0], loai_ban_ghi: 'tong_hop', ton_quy_dau_ky: dau, tong_thu_trong_ky: thu + (x.pi === 20 && i === 9 ? 500000 : 0), tong_chi_trong_ky: chi, ton_quy_cuoi_ky: cuoi,
      so_ho_ngheo_can_ngheo_duoc_ho_tro: r.i(0, 12), so_nha_ddk_xay_moi: R.chi_ho_tro_xay_moi_nha_ddk > 0 && r.c(0.3) ? 1 : 0, so_nha_duoc_sua_chua: r.c(0.2) ? 1 : 0, so_luot_hssv_duoc_ho_tro: r.i(0, 8), ty_le_giai_ngan_trong_ky: dau + thu ? Math.round(chi / (dau + thu) * 1000) / 10 : 0,
      han_bao_cao_chot_so_lieu: efMauNgay(x.y, x.m, 28), qua_han_bao_cao: null, tinh_trang_xu_ly_tong_hop: r.c(0.9) ? efVs('mttq4', 'tinh_trang_xu_ly_tong_hop')[2] : efVs('mttq4', 'tinh_trang_xu_ly_tong_hop')[1], don_vi_kiem_tra_giam_sat: 'Ban Tuyên giáo và CTXH', vuong_mac_nguyen_nhan: '', kien_nghi_de_xuat: '', nguoi_lap_bieu: r.p(EF_TEN), nguoi_phe_duyet: r.p(EF_TEN), ghi_chu: '' })); }); } },
  mttq5: { ky: 'thang', gen: (x, push, r) => { if (x.m !== 1 && x.m !== 2) return; EF_XA_TEN.slice(0, 40).forEach((xa, i) => efVs('mttq5', 'nhom_doi_tuong_nhom_du_lieu').filter((v) => !/khong_phat_sinh/.test(v)).forEach((nh) => { const kh = r.i(20, 400), dat = r.c(0.85);
    push({ ngay_chot_so_lieu: efMauNgay(x.y, x.m, 20), don_vi_cap_cung_cap: 'Ủy ban MTTQ ' + xa.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()), dia_ban: efVs('mttq5', 'dia_ban')[EF_XA_TEN.indexOf(xa)], thon_tdp: '', nhom_doi_tuong_nhom_du_lieu: nh, ten_doi_tuong_he_thong_ho_so: 'Hồ sơ quà Tết ' + x.y,
      chi_tieu_co_khong: efVs('mttq5', 'chi_tieu_co_khong')[0], ke_hoach_chuan_muc_tieu: kh, ty_le_tinh_chi_tieu: Math.round((dat ? 100 : 60 + 35 * r.f()) * 10) / 10, dat_dieu_kien: dat ? efVs('mttq5', 'dat_dieu_kien')[0] : efVs('mttq5', 'dat_dieu_kien')[1], minh_chung_url: '', trang_thai_doi_soat: efVs('mttq5', 'trang_thai_doi_soat')[2] }); })); } },
  mttq6: { ky: 'thang', gen: (x, push, r) => { if (x.m !== 1 && x.m !== 2) return; EF_XA_TEN.slice(0, 40).forEach((xa) => efVs('mttq6', 'nhom_doi_tuong_nhom_du_lieu').filter((v) => !/khong_phat_sinh/.test(v)).forEach((nh) => { const kh = r.i(10, 300), dat = r.c(0.85);
    push({ ngay_chot_so_lieu: efMauNgay(x.y, x.m, 20), don_vi_cap_cung_cap: 'Ủy ban MTTQ ' + xa.replace(/^(Phường|Xã)/, (s) => s.toLowerCase()), dia_ban: efVs('mttq6', 'dia_ban')[EF_XA_TEN.indexOf(xa)], thon_tdp: '', nhom_doi_tuong_nhom_du_lieu: nh, ten_doi_tuong_he_thong_ho_so: 'Hồ sơ hỗ trợ Tết ' + x.y,
      chi_tieu_co_khong: efVs('mttq6', 'chi_tieu_co_khong')[0], ke_hoach_chuan_muc_tieu: kh, ty_le_tinh_chi_tieu: Math.round((dat ? 100 : 60 + 35 * r.f()) * 10) / 10, dat_dieu_kien: dat ? efVs('mttq6', 'dat_dieu_kien')[0] : efVs('mttq6', 'dat_dieu_kien')[1], minh_chung_url: '', trang_thai_doi_soat: efVs('mttq6', 'trang_thai_doi_soat')[2] }); })); } },
  /* ---------- Trục UBND: VP UBND Thành phố ---------- */
  vpub1: { ky: 'quy', gen: (x, push, r) => { efVs('vpub1', 'don_vi_bao_cao').forEach((dv, i) => { const t = Math.round(CTM_XA[i].ds * (0.05 + 0.03 * r.f())), xl = Math.round(t * (0.9 + 0.095 * r.f()));
    push({ don_vi_bao_cao: dv, cap_bao_cao: efVof('vpub1', 'cap_bao_cao', 'Xã/Phường'), tong_so_van_ban_ho_so_cong_viec: t, so_van_ban_ho_so_xu_ly_tren_moi_truong_mang: xl, ty_le_tu_tinh: Math.round(xl / t * 1000) / 10 + (x.pi === 6 && i === 4 ? 5 : 0), ghi_chu: '' }); }); } },
  /* trợ lý ảo: bản năm 2025 và bản quý của năm 2026 */
  vpub2: { ky: 'quy', gen: (x, push, r) => { const nam = x.y === 2025; if (nam && x.q !== 4) return; efVs('vpub2', 'don_vi_bao_cao').slice(0, 60).forEach((dv, i) => { const co = r.c(nam ? 0.45 : 0.5 + 0.08 * x.q);
    push({ ...(nam ? { ky_bao_cao: 'nam', quy: null } : {}), don_vi_bao_cao: dv, doi_tuong_phuc_vu: r.p(['Người dân, doanh nghiệp', 'Cán bộ, công chức']), da_trien_khai_tro_ly_ao: co ? 'Có' : 'Không', ten_ung_dung_tro_ly_ao: co ? r.p(['Trợ lý ảo iHanoi', 'Trợ lý ảo hành chính công', 'Trợ lý ảo văn bản']) : '', ghi_chu: '' }); }); } },
  vpub3: { ky: 'thang', gen: (x, push, r) => { for (let i = 0; i < 7; i++) { const g = r.i(1, 15), st = r.p(efVs('vpub3', 'trang_thai_thuc_hien')), xong = /hoan_thanh/.test(st);
    push({ ten_nhiem_vu: r.p(['Triển khai Đề án 06', 'Rà soát thủ tục hành chính', 'Báo cáo giải ngân đầu tư công', 'Xây dựng cơ sở dữ liệu đất đai', 'Chuyển đổi số y tế']) + ' (' + x.m + '/' + x.y + ')', co_quan_giao: r.p(['Chính phủ', 'Thủ tướng Chính phủ', 'Văn phòng Chính phủ']),
      van_ban_giao_nhiem_vu: r.i(100, 999) + '/VPCP-' + r.p(['KSTT', 'TH', 'KTTH']), ngay_giao: efMauNgay(x.y, x.m, g), han_hoan_thanh: efMauNgay(x.y, x.m, Math.min(28, g + 12)), don_vi_chu_tri: r.p(['Sở Tài chính', 'Sở Nội vụ', 'Sở Nông nghiệp và Môi trường', 'Sở Y tế']), don_vi_phoi_hop: r.p(['Văn phòng UBND Thành phố', 'Sở Khoa học và Công nghệ']),
      trang_thai_thuc_hien: st, ty_le_hoan_thanh: xong ? 100 : st === 'chua_thuc_hien' ? 0 : r.i(20, 90), ngay_hoan_thanh: xong ? efMauNgay(x.y, x.m, Math.min(28, g + (st === 'hoan_thanh_qua_han' ? 15 : 9))) : null, ghi_chu: '', canh_bao_tien_do: /qua_han/.test(st) ? 'Quá hạn' : '', dia_ban: r.p(efVs('vpub3', 'dia_ban')) }); } } },
  vpub4: { ky: 'thang', gen: (x, push, r) => { efVs('vpub4', 'don_vi_bao_cao').forEach((dv, i) => { const t = Math.round(CTM_XA[i].ds * (0.011 + 0.006 * r.f())), dh = Math.round(t * (0.95 + 0.04 * r.f()));
    push({ don_vi_bao_cao: dv, tong_so_ho_so_tiep_nhan: t, ho_so_giai_quyet_dung_han: dh, ho_so_giai_quyet_qua_han: Math.round(t * 0.01 * r.f()), ho_so_truc_tuyen: Math.round(t * (0.6 + 0.3 * r.f())), ho_so_thanh_toan_truc_tuyen: Math.round(t * (0.3 + 0.3 * r.f())), ho_so_da_so_hoa: Math.round(t * (0.8 + 0.18 * r.f())), diem_hai_long: Math.round((95 + 4.9 * r.f()) * 10) / 10 }); }); } },
  vpub5: { ky: 'quy', gen: (x, push, r) => { efVs('vpub5', 'don_vi_bao_cao').slice(0, 40).forEach((dv) => { const loais = efVs('vpub5', 'loai_ha_tang_cntt'); [0, 1, 2, 6].forEach((li) => { const loai = loais[li]; if (!loai) return; const giao = /giao_ban|ht07/i.test(loai) || li === 6;
    push({ don_vi_bao_cao: dv, cap_bao_cao: efVof('vpub5', 'cap_bao_cao', 'Xã/Phường') || efVs('vpub5', 'cap_bao_cao')[0], doi_tuong_phuc_vu: efVs('vpub5', 'doi_tuong_phuc_vu')[li === 0 ? 0 : 1], loai_ha_tang_cntt: loai, tinh_trang_hoat_dong: r.c(0.85) ? efVs('vpub5', 'tinh_trang_hoat_dong')[0] : r.p(efVs('vpub5', 'tinh_trang_hoat_dong')),
      so_luong: li === 0 ? r.i(30, 140) : r.i(1, 12), muc_do_dap_ung: r.p(efVs('vpub5', 'muc_do_dap_ung')), tong_so_phong_hop_chi_ap_dung_ht07: giao ? r.i(2, 6) : null, so_phong_duoc_trang_bi_he_thong_giao_ban_truc_tuyen_ht07: giao ? r.i(1, 2) : null, ghi_chu: '' }); }); }); } },
  ubnd2: { ky: 'quy', gen: (x, push, r) => { efVs('ubnd2', 'don_vi_bao_cao').forEach((dv, i) => { const t = Math.round(CTM_XA[i].ds * (0.05 + 0.03 * r.f())), xl = Math.round(t * (0.9 + 0.095 * r.f()));
    push({ don_vi_bao_cao: dv, tong_so_van_ban_ho_so_cong_viec: t, so_van_ban_ho_so_xu_ly_tren_moi_truong_mang: xl, ty_le_tu_tinh: Math.round(xl / t * 1000) / 10, ghi_chu: '' }); }); } },
  ubnd3: { ky: 'quy', gen: (x, push, r) => { efVs('ubnd3', 'don_vi_bao_cao').slice(0, 40).forEach((dv) => { const t = r.i(5, 60), dvt = r.p(efVs('ubnd3', 'don_vi_tinh_chi_phi_vnd_gio_cong')), tr = dvt === efVs('ubnd3', 'don_vi_tinh_chi_phi_vnd_gio_cong')[0] ? r.i(50, 900) * 1e6 : r.i(200, 5000);
    push({ don_vi_bao_cao: dv, tong_so_quy_dinh_can_ra_soat_cat_giam: t, so_quy_dinh_da_duoc_cat_giam_don_gian_hoa: r.i(0, t), don_vi_tinh_chi_phi_vnd_gio_cong: dvt, tong_chi_phi_tuan_thu_truoc_cai_cach: tr, chi_phi_tuan_thu_sau_cai_cach: Math.round(tr * (0.6 + 0.35 * r.f())), ghi_chu: '' }); }); } },
  ubnd6: { ky: 'quy', gen: (x, push, r) => { efVs('ubnd6', 'dia_ban').forEach((db, i) => { const t = r.i(25, 90); push({ dia_ban: db, cap_bao_cao: efVs('ubnd6', 'cap_bao_cao')[1], tong_so_cbccvc_thuoc_dien_duoc_cap_chu_ky_so: t, so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu: t - r.i(0, 3) }); }); } },
  ubnd9: { ky: 'quy', gen: (x, push, r) => { efVs('ubnd9', 'don_vi_bao_cao').forEach((dv, i) => { const t = r.i(25, 90); push({ don_vi_bao_cao: dv, cap_bao_cao: efVs('ubnd9', 'cap_bao_cao')[1], tong_so_cbccvc_thuoc_dien_duoc_cap_chu_ky_so: t, so_cbccvc_da_duoc_cap_chu_ky_so_chuyen_dung_cong_vu: t - r.i(0, 3) + (x.pi === 6 && i === 2 ? 5 : 0) }); }); } },
  /* ---------- 12 sở — đợt 1: Thanh tra Thành phố ---------- */
  /* kiểm tra Chủ tịch UBND xã: cuộc chưa thực hiện xong kiến nghị được nhập lại tháng sau để cập nhật (bản đọc, câu 1) */
  ttra1: { ky: 'thang', gen: (x, push, r) => { const XA = efVs('ttra1', 'dia_ban'), cu = (x.st.ttra1 || []).filter((o) => !o.xong), moi = [];
    for (let i = 0; i < r.i(2, 4); i++) moi.push({ qd: r.i(10, 299) + '/QĐ-TTTP-' + x.y + String(x.m).padStart(2, '0') + (i + 1), xa: r.p(XA), kn: r.i(3, 14), da: 0, bd: r.i(1, 12), lv: r.p(['Đất đai', 'Trật tự xây dựng', 'Tài chính - ngân sách', 'Tiếp công dân, giải quyết khiếu nại']) });
    x.st.ttra1 = [];
    cu.concat(moi).forEach((o, j) => { o.da = Math.min(o.kn, o.da + r.i(1, Math.ceil(o.kn / 2))); const qh = r.c(0.25) ? r.i(0, o.kn - o.da) : 0, dang = o.kn - o.da - qh; o.xong = o.da === o.kn; if (!o.xong) x.st.ttra1.push(o);
      const kl = o.da > 0, ngay = efMauNgay(x.y, x.m, o.bd), sai = x.pi === 20 && j === 0;
      push({ dia_ban: o.xa, thon_tdp: '', loai_ban_ghi: efVs('ttra1', 'loai_ban_ghi')[0], ten_cuoc_kiem_tra_noi_dung: 'Kiểm tra trách nhiệm Chủ tịch UBND về ' + o.lv.toLowerCase(), doi_tuong_kiem_tra: 'Chủ tịch UBND xã, phường', nhom_doi_tuong: 'Người đứng đầu',
        co_quan_chu_tri_kiem_tra: r.c(0.8) ? 'co' : 'khong', can_cu_quyet_dinh_kiem_tra_so: o.qd, ngay_quyet_dinh: ngay, noi_dung_kiem_tra_chinh: 'Trách nhiệm thực hiện pháp luật về ' + o.lv.toLowerCase(), linh_vuc_kiem_tra_chi_tiet: o.lv,
        thoi_gian_bat_dau: ngay, thoi_gian_ket_thuc_ke_hoach: efMauNgay(x.y, x.m, o.bd + 10), thoi_gian_ket_thuc_thuc_te: kl ? efMauNgay(x.y, x.m, o.bd + r.i(8, 14)) : null,
        trang_thai_kiem_tra: o.xong ? 'Hoàn thành' : kl ? 'Đã ban hành kết luận' : 'Đang kiểm tra', so_don_vi_duoc_kiem_tra: r.i(1, 6), da_ban_hanh_ket_luan: kl ? 'co' : 'khong', ngay_ban_hanh_ket_luan: kl ? efMauNgay(x.y, x.m, o.bd + 15) : null,
        so_ket_luan: kl ? r.i(10, 99) + '/KL-TTTP' : '', co_kien_nghi_xu_ly: 'co', so_kien_nghi_xu_ly: o.kn, kien_nghi_hanh_chinh: r.c(0.5) ? 'Kiểm điểm trách nhiệm' : '', kien_nghi_tai_chinh: r.c(0.4) ? 'Thu hồi về ngân sách' : '', kien_nghi_chuyen_cqdt: '',
        gia_tri_kien_nghi_thu_hoi_giam_tru_trieu_dong: r.i(0, 900), da_thuc_hien_kien_nghi: o.da, dang_thuc_hien_kien_nghi: dang, qua_han_thuc_hien_kien_nghi: qh,
        ty_le_thuc_hien_kien_nghi: Math.round(o.da / o.kn * 1000) / 10 + (sai ? 9 : 0), han_bao_cao_ket_qua: efMauNgay(x.y, x.m, 28), tinh_trang_qua_han: qh ? 'Quá hạn' : 'Chưa quá hạn', vuong_mac_kien_nghi: '', ghi_chu: '' }); });
    if (x.m % 4 === 0) push({ dia_ban: r.p(XA), loai_ban_ghi: efVs('ttra1', 'loai_ban_ghi').slice(-1)[0], ten_cuoc_kiem_tra_noi_dung: '', can_cu_quyet_dinh_kiem_tra_so: '', trang_thai_kiem_tra: '', so_don_vi_duoc_kiem_tra: null, so_kien_nghi_xu_ly: null,
      gia_tri_kien_nghi_thu_hoi_giam_tru_trieu_dong: null, da_thuc_hien_kien_nghi: null, dang_thuc_hien_kien_nghi: null, qua_han_thuc_hien_kien_nghi: null, ty_le_thuc_hien_kien_nghi: null, da_ban_hanh_ket_luan: null, co_kien_nghi_xu_ly: null,
      ngay_quyet_dinh: null, thoi_gian_bat_dau: null, thoi_gian_ket_thuc_ke_hoach: null, thoi_gian_ket_thuc_thuc_te: null, ngay_ban_hanh_ket_luan: null, han_bao_cao_ket_qua: null, so_ket_luan: '', tinh_trang_qua_han: '', doi_tuong_kiem_tra: '', nhom_doi_tuong: '',
      co_quan_chu_tri_kiem_tra: null, noi_dung_kiem_tra_chinh: '', linh_vuc_kiem_tra_chi_tiet: '', kien_nghi_hanh_chinh: '', kien_nghi_tai_chinh: '', kien_nghi_chuyen_cqdt: '', vuong_mac_kien_nghi: '', thon_tdp: '', ghi_chu: 'Kỳ này không phát sinh' }); } },
  /* thanh tra: bản «Theo dõi sau thanh tra» cập nhật giá trị đã thu hồi (lũy kế của cuộc) 2 và 4 tháng sau khi có kết luận */
  ttra2: { ky: 'thang', gen: (x, push, r) => { const XA = efVs('ttra2', 'dia_ban'), LV = efVs('ttra2', 'linh_vuc_thanh_tra'), st = x.st.ttra2 || (x.st.ttra2 = []);
    const base = (o) => ({ ten_cuoc_thanh_tra_noi_dung: 'Thanh tra ' + o.ten, nguon_ke_hoach: o.ng, thon_tdp: '', dia_ban: o.xa, don_vi_duoc_thanh_tra: o.dv, linh_vuc_thanh_tra: o.lv, co_quan_chu_tri: 'co', so_qd_thanh_tra: o.qd, ngay_qd_thanh_tra: o.nqd,
      ngay_bat_dau: o.nbd, ngay_ket_thuc_du_kien: o.nkt, so_don_vi_duoc_thanh_tra: o.sdv, so_kien_nghi_xu_ly: o.kn, gia_tri_kien_nghi_thu_hoi_trieu_dong: o.gtkn, so_ca_nhan_to_chuc_kien_nghi_xu_ly_hc: o.hc, so_vu_viec_chuyen_cq_dieu_tra: o.cq, vuong_mac: '', kien_nghi_ho_tro: '' });
    for (let i = 0; i < r.i(2, 4); i++) { const d = r.i(1, 7), lv = r.p(LV.filter((v) => v !== 'khac')), ketluan = r.c(0.65), gtkn = Math.round((20 + 1500 * r.f()) * 10) / 10, gtth = ketluan ? Math.round(gtkn * (0.2 + 0.5 * r.f()) * 10) / 10 : 0;
      const o = { qd: r.i(100, 999) + '/QĐ-TTTP-' + x.y + String(x.m).padStart(2, '0'), xa: r.p(XA), ten: r.p(['quản lý, sử dụng ngân sách', 'công tác quản lý đất đai', 'đầu tư xây dựng', 'mua sắm tài sản công', 'giải quyết thủ tục hành chính']), ng: r.p(efVs('ttra2', 'nguon_ke_hoach')),
        dv: r.p(['UBND xã, phường', 'Ban Quản lý dự án', 'Trung tâm y tế', 'Trường học']), lv: lv, nqd: efMauNgay(x.y, x.m, d), nbd: efMauNgay(x.y, x.m, d + 2), nkt: efMauNgay(x.y, x.m, d + 18), sdv: r.i(1, 8), kn: ketluan ? r.i(2, 15) : 0, gtkn: gtkn, hc: ketluan ? r.i(0, 6) : 0, cq: r.c(0.1) ? 1 : 0, gtth: gtth, t: x.pi };
      const qh = r.c(0.15) ? r.i(1, 20) : 0, sai = x.pi === 20 && i === 0;
      push(Object.assign(base(o), { loai_ban_ghi: 'cuocthanhtra', ngay_ket_thuc_thuc_te: ketluan ? efMauNgay(x.y, x.m, d + 19) : null, trang_thai_cuoc_thanh_tra: ketluan ? 'dabanhanhketluan' : r.p(['dangtrienkhai', 'daketthucxacminh']),
        da_ban_hanh_ket_luan: ketluan ? 'co' : 'khong', so_kl_thanh_tra: ketluan ? r.i(10, 99) + '/KL-TTTP' : '', ngay_kl_thanh_tra: ketluan ? efMauNgay(x.y, x.m, d + 20) : null, kien_nghi_xu_ly: ketluan ? 'co' : 'khong',
        gia_tri_da_thu_hoi_trieu_dong: gtth, so_van_ban_don_doc_nhac: 0, ty_le_thu_hoi: gtkn ? Math.round(gtth / gtkn * 1000) / 10 + (sai ? 12 : 0) : null, tien_do_phan_tram: ketluan ? 100 : r.i(20, 90), qua_han_ngay: qh, muc_canh_bao: qh > 10 ? 'do' : qh ? 'vang' : 'xanh' }));
      if (ketluan) st.push(o); }
    st.filter((o) => x.pi - o.t === 2 || x.pi - o.t === 4).forEach((o) => { o.gtth = Math.min(o.gtkn, Math.round((o.gtth + o.gtkn * 0.25 * r.f()) * 10) / 10);
      push(Object.assign(base(o), { loai_ban_ghi: 'theodoisauthanhtra', ngay_ket_thuc_thuc_te: o.nkt, trang_thai_cuoc_thanh_tra: 'theodoithuchien', da_ban_hanh_ket_luan: 'co', so_kl_thanh_tra: 'KL/' + o.qd, ngay_kl_thanh_tra: o.nkt, kien_nghi_xu_ly: 'co',
        gia_tri_da_thu_hoi_trieu_dong: o.gtth, so_van_ban_don_doc_nhac: r.i(0, 3), ty_le_thu_hoi: Math.round(o.gtth / o.gtkn * 1000) / 10, tien_do_phan_tram: 100, qua_han_ngay: 0, muc_canh_bao: 'xanh' })); }); } },
  /* tiếp công dân: 40 xã bản Tổng hợp; 3 xã thêm bản chi tiết (không dùng vì đã có Tổng hợp); 2 xã chỉ có bản chi tiết; 1 bản Đột xuất; bản Không phát sinh mỗi quý */
  ttra3: { ky: 'thang', gen: (x, push, r) => { const XA = efVs('ttra3', 'dia_ban'), st = x.st.ttra3 || (x.st.ttra3 = {}), LT = efVs('ttra3', 'loai_tiep_cong_dan_chinh').filter((v) => v !== 'khongphatsinh'), TT = efVs('ttra3', 'tinh_trang_xu_ly_tong_hop').filter((v) => v !== 'khongphatsinh');
    const so = (xa, k, loai, sai) => { const dau = st[xa + loai] != null ? st[xa + loai] : r.i(0, 12 * k), moi = r.i(2, 25 * k), tong = dau + moi, dkd = r.i(Math.floor(tong * 0.6), tong), tq = r.i(0, dkd), chuyen = r.i(0, dkd - tq), hd = dkd - tq - chuyen;
      const a = r.i(0, tong), b = r.i(0, tong - a), c = r.i(0, tong - a - b), thuly = r.i(Math.floor(tq / 2), tq + 3), dgq = r.i(0, thuly), dh = r.i(Math.floor(dgq * 0.7), dgq), rut = r.i(0, thuly - dgq), dxqh = r.c(0.3) ? r.i(0, thuly - dgq - rut) : 0, ton = r.i(0, tong - Math.floor(dgq / 2));
      st[xa + loai] = ton;
      return { loai_tiep_cong_dan_chinh: r.p(LT), so_cuoc_tiep_cong_dan: r.i(1, 8 * k), so_luot_cong_dan: r.i(3, 60 * k), so_doan_dong_nguoi: r.c(0.2) ? r.i(1, 2) : 0, so_vu_viec_tiep_nhan_qua_tiep_dan: r.i(0, 10 * k), tong_don_thu_tiep_nhan: tong + (sai ? 3 : 0), don_ky_truoc_chuyen_sang: dau, don_moi_trong_ky: moi,
        don_du_dieu_kien_xu_ly: dkd, don_khong_du_dieu_kien_luu: tong - dkd, don_thuoc_tham_quyen: tq, don_khong_thuoc_tham_quyen_da_chuyen: chuyen, don_khong_thuoc_tham_quyen_da_huong_dan: hd, so_don_khieu_nai: a, so_don_to_cao: b, so_don_kien_nghi_phan_anh: c, so_don_nhieu_noi_dung_khac: tong - a - b - c,
        so_vu_viec_thu_ly: thuly, so_vu_viec_da_giai_quyet: dgq, so_vu_giai_quyet_dung_han: dh, so_vu_giai_quyet_qua_han: dgq - dh, so_vu_dang_xu_ly_trong_han: thuly - dgq - rut - dxqh, so_vu_dang_xu_ly_qua_han: dxqh, so_vu_rut_don_dinh_chi: rut, so_vu_phuc_tap_keo_dai: r.c(0.15) ? 1 : 0,
        ty_le_giai_quyet_vu_viec: thuly ? Math.round(dgq / thuly * 1000) / 10 : null, ty_le_giai_quyet_dung_han: dgq ? Math.round(dh / dgq * 1000) / 10 : null, ton_cuoi_ky: ton, ngay_bao_cao: efMauNgay(x.y, x.m, 25), han_bao_cao_chot_so_lieu: efMauNgay(x.y, x.m, 25), qua_han_bao_cao_ngay: null,
        tinh_trang_xu_ly_tong_hop: r.p(TT), vuong_mac_nguyen_nhan: '', kien_nghi_ho_tro: '', ghi_chu: '', thon_tdp: '' }; };
    XA.slice(0, 40).forEach((xa, i) => { push(Object.assign({ dia_ban: xa, loai_ban_ghi: 'tonghop' }, so(xa, 2, 'th', x.pi === 20 && i === 3)));
      if (i < 3) push(Object.assign({ dia_ban: xa, loai_ban_ghi: 'chitietdonthu' }, so(xa, 1, 'ct'), { thon_tdp: 'Tổ dân phố ' + (i + 1) })); });
    XA.slice(40, 42).forEach((xa) => ['chitietdonthu', 'chitietvuviec'].forEach((l) => push(Object.assign({ dia_ban: xa, loai_ban_ghi: l }, so(xa, 1, l)))));
    push(Object.assign({ dia_ban: XA[42], loai_ban_ghi: 'tonghop' }, so(XA[42], 1, 'dx'), { ky_bao_cao: 'dotxuat', thang: null, quy: null, ngay_bao_cao: efMauNgay(x.y, x.m, r.i(5, 20)), ghi_chu: 'Báo cáo đột xuất' }));
    if (x.m % 3 === 0) { const kps = { dia_ban: XA[43], loai_ban_ghi: 'khongphatsinh', loai_tiep_cong_dan_chinh: 'khongphatsinh', tinh_trang_xu_ly_tong_hop: 'khongphatsinh', thon_tdp: '', ngay_bao_cao: efMauNgay(x.y, x.m, 25), han_bao_cao_chot_so_lieu: efMauNgay(x.y, x.m, 25),
      qua_han_bao_cao_ngay: null, vuong_mac_nguyen_nhan: '', kien_nghi_ho_tro: '', ghi_chu: 'Không phát sinh' };
      EFK.ttra3.fields.forEach((f) => { if (f.t === 'so' && ['nam', 'thang'].indexOf(f.c) < 0) kps[f.c] = /^ty_le/.test(f.c) ? null : 0; }); push(kps); } } },
  /* ---------- Sở Công Thương ---------- */
  sct1: { ky: 'thang', gen: (x, push, r) => { const L = x.st.sct1 || (x.st.sct1 = Array.from({ length: 25 }, (_, i) => ({ ten: 'Công ty ' + ['Hà Thành', 'Thăng Long', 'Long Biên', 'Sông Hồng', 'Tây Hồ'][i % 5] + ' ' + (i + 1), xa: r.p(efVs('sct1', 'dia_ban')),
      lh: r.p(efVs('sct1', 'loai_hinh_hoat_dong')), ng: r.p(['Dệt may', 'Điện tử', 'Nông sản', 'Cơ khí', 'Đồ gỗ']), tt: r.p(['Hoa Kỳ', 'Nhật Bản', 'Hàn Quốc', 'Trung Quốc', 'EU']), qm: r.i(50, 3000) })));
    L.forEach((o, i) => { const xk = o.lh === 'nhap_khau' ? 0 : Math.round(o.qm * (0.7 + 0.6 * r.f())) * 1000, nk = o.lh === 'xuat_khau' ? 0 : Math.round(o.qm * (0.4 + 0.5 * r.f())) * 1000;
      push({ dia_ban: o.xa, ten_doanh_nghiep: o.ten, loai_hinh_doanh_nghiep: i % 3 ? 'Công ty TNHH' : 'Công ty cổ phần', nganh_hang_mat_hang_chinh: o.ng, loai_hinh_hoat_dong: o.lh, thi_truong_chinh: o.tt, kim_ngach_xuat_khau_usd: xk, kim_ngach_nhap_khau_usd: nk,
        tong_kim_ngach_xnk_usd: xk + nk + (x.pi === 20 && i === 2 ? 5000 : 0), ghi_chu: '' }); }); } },
  sct2: { ky: 'thang', gen: (x, push, r) => { const L = x.st.sct2 || (x.st.sct2 = Array.from({ length: 30 }, (_, i) => ({ ten: ['Siêu thị', 'Cửa hàng', 'Trung tâm thương mại', 'Nhà hàng'][i % 4] + ' ' + (i + 1), xa: r.p(efVs('sct2', 'dia_ban')),
      lh: ['Siêu thị', 'Cửa hàng bán lẻ', 'Trung tâm thương mại', 'Ăn uống, lưu trú'][i % 4], ng: r.p(['Lương thực, thực phẩm', 'Hàng may mặc', 'Đồ dùng gia đình', 'Dịch vụ ăn uống']), qm: r.i(200, 4000) * 1e6, truoc: null })));
    L.forEach((o, i) => { const bl = Math.round(o.qm * (0.5 + 0.4 * r.f()) / 1e6) * 1e6, dv = Math.round(o.qm * (0.1 + 0.3 * r.f()) / 1e6) * 1e6, tm = bl + dv, kt = o.truoc || Math.round(tm * (0.9 + 0.15 * r.f()) / 1e6) * 1e6; o.truoc = tm;
      push({ dia_ban: o.xa, ten_co_so_doanh_nghiep: o.ten, loai_hinh_kinh_doanh: o.lh, nganh_hang_linh_vuc_dich_vu_chinh: o.ng, doanh_thu_ban_le_hang_hoa_dong: bl, doanh_thu_dich_vu_dong: dv, tong_muc_ban_le_dv_tieu_dung_dong: tm,
        doanh_thu_ky_truoc_lien_ke_dong: kt, toc_do_tang_ky_truoc_phan_tram: Math.round((tm / kt * 100 - 100) * 10) / 10 + (x.pi === 20 && i === 4 ? 6 : 0), ghi_chu: '' }); }); } },
  sct3: { ky: 'thang', gen: (x, push, r) => { const st = x.st.sct3 || (x.st.sct3 = {}), DT = efVs('sct3', 'doi_tuong_thong_ke');
    efVs('sct3', 'dia_ban').slice(0, 30).forEach((xa, i) => efVs('sct3', 'ma_chi_tieu_con_cds').forEach((ma, j) => { const k = xa + ma, o = st[k] || (st[k] = { tong: r.i(20, 400), dat: 0, dt: DT[j % DT.length] }); o.tong += r.i(0, 4); o.dat = Math.min(o.tong, Math.max(o.dat, Math.round(o.tong * (0.3 + 0.5 * r.f()))));
      push({ dia_ban: xa, ma_chi_tieu_con_cds: ma, doi_tuong_thong_ke: o.dt, tong_so_doi_tuong: o.tong, so_doi_tuong_dat: o.dat, ty_le_dat_phan_tram: Math.round(o.dat / o.tong * 1000) / 10 + (x.pi === 20 && i === 1 && j === 0 ? 8 : 0), nen_tang_so_hinh_thuc_ap_dung: r.p(['Sàn thương mại điện tử', 'Thanh toán không dùng tiền mặt', 'Mạng xã hội', 'Website bán hàng']), ghi_chu: '' }); })); } },
  sct4: { ky: 'thang', gen: (x, push, r) => { const MH = { dien_nang: [efVs('sct4', 'ma_chi_tieu_qd4795')[0], [efVs('sct4', 'don_vi_tinh')[0]], () => r.i(200, 9000) * 1000], xang_dau: [efVs('sct4', 'ma_chi_tieu_qd4795')[1], efVs('sct4', 'don_vi_tinh').slice(1, 3), () => r.i(5, 900) * 1000],
      than: [efVs('sct4', 'ma_chi_tieu_qd4795')[2], [efVs('sct4', 'don_vi_tinh')[3]], () => r.i(10, 3000)] };
    const L = x.st.sct4 || (x.st.sct4 = Array.from({ length: 18 }, (_, i) => { const mh = Object.keys(MH)[i % 3]; return { ten: ['Điện lực', 'Cửa hàng xăng dầu', 'Công ty kinh doanh than'][i % 3] + ' ' + (i + 1), mh: mh, xa: r.p(efVs('sct4', 'dia_ban')), lh: r.p(efVs('sct4', 'loai_hinh_don_vi')), dvt: r.p(MH[mh][1]) }; }));
    L.forEach((o, i) => push({ dia_ban: o.xa, ma_chi_tieu_qd4795: MH[o.mh][0], loai_mat_hang: o.mh, ten_don_vi_cung_ung: o.ten, loai_hinh_don_vi: o.lh, san_luong_trong_ky: MH[o.mh][2](), don_vi_tinh: x.pi === 20 && i === 2 ? efVs('sct4', 'don_vi_tinh')[0] : o.dvt, ghi_chu: '' })); } },
  sct5: { ky: 'thang', gen: (x, push, r) => { const L = x.st.sct5 || (x.st.sct5 = Array.from({ length: 20 }, (_, i) => ({ ten: 'Doanh nghiệp sản xuất ' + (i + 1), xa: r.p(efVs('sct5', 'dia_ban')), ng: efVs('sct5', 'nganh_cong_nghiep_vsic')[i % 5], gt: r.i(5, 400) * 1e9 })));
    L.forEach((o, i) => { const kt = o.gt, kn = Math.round(kt * (0.92 + 0.18 * r.f()) / 1e6) * 1e6; o.gt = kn;
      push({ dia_ban: o.xa, ten_doanh_nghiep_co_so: o.ten, nganh_cong_nghiep_vsic: o.ng, gia_tri_sx_ky_nay_dong: kn, gia_tri_sx_ky_truoc_dong: kt, chi_so_iip_ky_truoc_phan_tram: Math.round(kn / kt * 1000) / 10 + (x.pi === 20 && i === 3 ? 4 : 0), ghi_chu: '' }); }); } },
  /* ---------- Sở Nội vụ ---------- */
  snv1: { ky: 'thang', gen: (x, push, r) => { const st = x.st.snv1 || (x.st.snv1 = {}), MA = efVs('snv1', 'ma_chi_tieu_qd4795');
    efVs('snv1', 'dia_ban').slice(0, 30).forEach((xa, i) => MA.forEach((ma, j) => { const k = xa + ma, o = st[k] || (st[k] = { tong: r.i(400, 4000), k: 0.4 + 0.3 * r.f() }); o.tong += r.i(-5, 15); o.k = Math.min(0.98, o.k + 0.004 * r.f());
      if (j < 2) { const dat = Math.round(o.tong * o.k); push({ thon_tdp: '', ma_chi_tieu_qd4795: ma, ten_chi_tieu: j ? 'Tỷ lệ tham gia BHXH' : 'Tỷ lệ tham gia BHTN', doi_tuong_noi_dung: 'Người lao động thuộc diện tham gia', tong_so_doi_tuong: o.tong, so_doi_tuong_dat: dat,
        ty_le_phan_tram: Math.round(dat / o.tong * 1000) / 10 + (x.pi === 20 && i === 2 && j === 1 ? 5 : 0), don_vi_tinh: 'người', ghi_chu: '', dia_ban: xa }); }
      else push({ thon_tdp: '', ma_chi_tieu_qd4795: ma, ten_chi_tieu: ['Số người hưởng', 'Thu BHXH, BHYT, BHTN', 'Chi BHXH, BHYT, BHTN'][j - 2], doi_tuong_noi_dung: j === 2 ? 'Người hưởng chế độ' : 'Số tiền', tong_so_doi_tuong: j === 2 ? r.i(20, 300) : r.i(500, 9000), so_doi_tuong_dat: null, ty_le_phan_tram: null,
        don_vi_tinh: j === 2 ? 'người' : 'triệu đồng', ghi_chu: '', dia_ban: xa }); })); } },
  snv2: { ky: 'thang', gen: (x, push, r) => { const st = x.st.snv2 || (x.st.snv2 = {});
    efVs('snv2', 'dia_ban').forEach((xa, i) => { const o = st[xa] || (st[xa] = { ld: Math.round(CTM_XA[i % CTM_XA.length].ds * 0.55), kd: 0.5 + 0.3 * r.f(), cds: r.i(0, 2), antt: r.i(0, 1), ks: r.i(20, 80), ck: r.i(20, 80), giao: r.i(40, 120) });
      o.ld += r.i(-20, 40); o.kd = Math.min(0.95, o.kd + 0.003 * r.f()); const tm = r.c(0.3) ? r.i(1, 3) : 0, nh = r.c(0.2) ? 1 : 0, tv = r.c(0.1) ? 1 : 0, ct = r.c(0.15) ? 1 : 0; o.th = Math.min(o.giao, (o.th || o.giao - r.i(0, 8)) + tm - nh - tv - ct);
      push({ tong_luc_luong_lao_dong: o.ld, so_lao_dong_dat: Math.round(o.ld * o.kd), don_vi_co_cbccvc_chuyen_trach_cds: o.cds, don_vi_co_cbccvc_chuyen_trach_antt_mang: o.antt, tong_cbccvc_boi_duong_ky_nang_so: o.ks, so_cbccvc_boi_duong_ky_nang_so_dat: Math.round(o.ks * (0.6 + 0.4 * r.f())),
        tong_cbccvc_cap_chu_ky_so: o.ck, so_cbccvc_cap_chu_ky_so_dat: o.ck - r.i(0, 4) + (x.pi === 20 && i === 5 ? 9 : 0), lao_dong_viet_nam_di_nuoc_ngoai: r.i(0, 6), lao_dong_nuoc_ngoai: r.i(0, 12), bien_che_huong_luong: o.th, bien_che_duoc_giao: o.giao, bien_che_thuc_hien: o.th,
        so_tuyen_moi: tm, so_nghi_huu: nh, thoi_viec: tv, chuyen_cong_tac: ct, dia_ban: xa }); }); } }
};
/* ---------- Sở NN&MT: 10 eform cùng mẫu 18 trường — 20 nội dung cố định (xã × phân tổ × tên) mỗi tháng; lũy kế cộng dồn trong năm;
   vài bản lệch chênh lệch, thiếu vướng mắc để màn Dữ liệu đã nhập có bản ghi cần xem lại ---------- */
(function () {
  const T = { nnmt1: ['Xã đạt chuẩn nông thôn mới nâng cao', 'Xã đạt chuẩn nông thôn mới kiểu mẫu'], nnmt2: ['Vụ chặt phá rừng', 'Vụ cháy rừng'], nnmt3: ['Trồng rừng phòng hộ', 'Trồng rừng sản xuất'],
    nnmt4: ['Hạ tầng giao thông nông thôn', 'Nhà văn hóa thôn'], nnmt5: ['Hỗ trợ sinh kế hộ nghèo', 'Đào tạo nghề cho lao động nghèo'], nnmt6: ['Trạm quan trắc mưa', 'Bản tin dự báo thời tiết'],
    nnmt7: ['Hồ chứa', 'Tuyến đê'], nnmt8: ['Hỗ trợ hộ bị thiên tai', 'Hỗ trợ dịp giáp hạt'], nnmt9: ['Gạo hỗ trợ thiên tai', 'Gạo cứu đói giáp hạt'], nnmt10: ['Bản đồ rủi ro thiên tai cấp xã', 'Lớp dữ liệu ngập lụt'] };
  const PT_CHU = { nnmt1: ['Nông thôn mới nâng cao', 'Nông thôn mới kiểu mẫu'], nnmt5: ['Dự án 1', 'Dự án 2', 'Dự án 3'] };
  Object.keys(T).forEach((ef) => { EF_MAU_CFG[ef] = { ky: 'thang', gen: (x, push, r) => {
    const F = EFK[ef].F, fs = EFK[ef].fields, c9 = fs[8].c, c11 = fs[10].c, pts = F.phan_to_loai_du_lieu.t === 'dm' ? efVs(ef, 'phan_to_loai_du_lieu').filter((v) => v !== 'khong_phat_sinh') : PT_CHU[ef] || ['Nội dung chung'];
    const TT = efVs(ef, 'trang_thai_trien_khai').filter((v) => v !== 'khong_phat_sinh'), XA = efVs(ef, 'dia_ban');
    const L = x.st[ef] || (x.st[ef] = Array.from({ length: 20 }, (_, i) => ({ xa: XA[(i * 6 + ef.length) % XA.length], pt: pts[i % pts.length], ten: T[ef][i % 2] + ' ' + (i + 1), qm: r.i(2, 60), lk: 0, y: 0 })));
    L.forEach((o, i) => { if (o.y !== x.y) { o.lk = 0; o.y = x.y; } const kn = Math.round(o.qm * (0.5 + r.f()) * 10) / 10, ck = Math.round(o.qm * (0.5 + r.f()) * 10) / 10; o.lk = Math.round((o.lk + kn) * 10) / 10;
      const tt = r.p(TT), cham = ['cham_tien_do', 'dinh_tre', 'can_xu_ly'].indexOf(tt) >= 0, sai = x.pi === 20 && i === 1;
      push({ ngay_bao_cao: efMauNgay(x.y, x.m, 25), dia_ban: o.xa, thon_tdp: '', phan_to_loai_du_lieu: o.pt, [c9]: o.ten, don_vi_chu_tri_phoi_hop: 'Phòng Kinh tế', [c11]: 'Kế hoạch năm ' + x.y,
        gia_tri_ky_nay: kn, gia_tri_luy_ke: o.lk, cung_ky_chuan_so_sanh: ck, ty_le_tien_do_tu_tinh: Math.min(100, Math.round(o.lk / (o.qm * 12) * 1000) / 10), chenh_lech_ky_nay_cung_ky: Math.round((kn - ck + (sai ? 3 : 0)) * 10) / 10,
        trang_thai_trien_khai: tt, vuong_mac_nguyen_nhan: cham && !(x.pi === 19 && i < 3) ? r.p(['Chậm giải ngân vốn', 'Vướng mặt bằng', 'Thời tiết bất lợi']) : '' }); }); } }; });
})();
const EF_MAU_CACHE = {};
function efMau(efId) { if (!EF_MAU_CFG[efId]) return []; if (!EF_MAU_CACHE[efId]) EF_MAU_CACHE[efId] = efMauDung(efId, EF_MAU_CFG[efId]); return EF_MAU_CACHE[efId]; }
/* Nguồn bản ghi của màn hình: mã eform → mảng bản ghi { mã trường: giá trị } */
let EF_NGUON = efMau;
