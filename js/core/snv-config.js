/* ============================== SỞ NỘI VỤ — CHỈ TIÊU THEO 2 EFORM ==============================
   Nguồn: "File mô tả đầu vào eform" (Google Sheets, sheet "Sở Nội vụ"), 2 eform:
     A. "Danh sách bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp" — bản ghi = «Địa bàn» (126 phường/xã) × «Mã chỉ tiêu»
        (5 mã: tỷ lệ tham gia BHTN, tỷ lệ tham gia BHXH, số người hưởng, thu, chi) × kỳ; mỗi bản ghi có «Tổng số đối tượng»,
        «Số đối tượng đạt», «Tỷ lệ (%)», «Đơn vị tính». «Thôn/TDP» là Chữ, không bắt buộc.
     B. "Lao động Công chức viên chức" — bản ghi = «Địa bàn» × kỳ; 3 nhóm trường: lao động trên địa bàn; biên chế và biến động
        công chức, viên chức; cán bộ chuyển đổi số, kỹ năng số, chữ ký số.
   → 4 chỉ tiêu: 1. Bảo hiểm xã hội, y tế, thất nghiệp (eform A); 2. Lao động, việc làm; 3. Biên chế công chức, viên chức cấp xã;
     4. Cán bộ chuyển đổi số và chữ ký số (2 – 4 tách từ eform B, như Ban QL KCNC & KCN). Mã chỉ tiêu trong eform không hiện trên giao diện.
   Bộ chỉ tiêu cũ STT 42, 47, 53 đã xóa; 5 chỉ tiêu số liệu thật (tuyển dụng, chi trả người có công, CCVC 2025) giữ ở cuối (central-level.js).

   SỐ GIẢ LẬP, đặt theo số thật đã công bố của Hà Nội:
   - Hết năm 2025: gần 2,39 triệu người tham gia BHXH bắt buộc, 136,5 nghìn tự nguyện; chỉ tiêu 2025 BHXH bắt buộc 47,5%,
     tự nguyện 3,5%, BHTN 45% lực lượng lao động trong độ tuổi; BHYT 95,95% dân số. Tổng thu 2025 ~78 – 80 nghìn tỷ đồng, chi > 49 nghìn tỷ.
   - ~596 nghìn người hưởng lương hưu, trợ cấp BHXH hằng tháng (4/2025), 99,25% nhận qua tài khoản cá nhân.
   - QĐ 4164/QĐ-UBND tạm giao 139.501 biên chế công chức, viên chức năm 2025; 9.536 cán bộ, công chức bố trí cho 126 xã, phường.
   - 9 tháng 2025 Sở Nội vụ cấp, cấp lại, gia hạn giấy phép cho 8.009 lao động nước ngoài; cả nước 162.858 lao động nước ngoài (cuối 2025).
   - Từ 30/6/2025 toàn bộ cán bộ xử lý hồ sơ trên môi trường mạng và ký số.
   Số lao động Hà Nội đi làm việc ở nước ngoài và số lao động nước ngoài đang làm việc chưa thấy công bố → GIẢ ĐỊNH theo bậc độ lớn.
   Nạp TRƯỚC central-level.js (central-level.js dùng SNV_ITEMS). Không dùng hàm nào của file khác. */

const SNV_KY = 'Tháng 9/2026';
const SNV_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9'];

function snvSum(a) { return a.reduce((s, v) => s + v, 0); }
function snvHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function snvR(name, key) { return (snvHash(name + '|' + key) % 10000) / 10000; }

/* ---------- 126 phường/xã — đúng danh mục «Địa bàn» của 2 eform ---------- */
const SNV_DV = [
  'Phường Ba Đình', 'Phường Bạch Mai', 'Phường Bồ Đề', 'Phường Chương Mỹ', 'Phường Cầu Giấy', 'Phường Cửa Nam', 'Phường Dương Nội',
  'Phường Giảng Võ', 'Phường Hai Bà Trưng', 'Phường Hoàn Kiếm', 'Phường Hoàng Liệt', 'Phường Hoàng Mai', 'Phường Hà Đông', 'Phường Hồng Hà',
  'Phường Khương Đình', 'Phường Kim Liên', 'Phường Kiến Hưng', 'Phường Long Biên', 'Phường Láng', 'Phường Lĩnh Nam', 'Phường Nghĩa Đô',
  'Phường Ngọc Hà', 'Phường Phú Diễn', 'Phường Phú Lương', 'Phường Phú Thượng', 'Phường Phúc Lợi', 'Phường Phương Liệt', 'Phường Sơn Tây',
  'Phường Thanh Liệt', 'Phường Thanh Xuân', 'Phường Thượng Cát', 'Phường Tây Hồ', 'Phường Tây Mỗ', 'Phường Tây Tựu', 'Phường Tùng Thiện',
  'Phường Tương Mai', 'Phường Từ Liêm', 'Phường Việt Hưng', 'Phường Văn Miếu - Quốc Tử Giám', 'Phường Vĩnh Hưng', 'Phường Vĩnh Tuy',
  'Phường Xuân Phương', 'Phường Xuân Đỉnh', 'Phường Yên Hòa', 'Phường Yên Nghĩa', 'Phường Yên Sở', 'Phường Ô Chợ Dừa', 'Phường Đông Ngạc',
  'Phường Đại Mỗ', 'Phường Định Công', 'Phường Đống Đa',
  'Xã An Khánh', 'Xã Ba Vì', 'Xã Bát Tràng', 'Xã Bình Minh', 'Xã Bất Bạt', 'Xã Chuyên Mỹ', 'Xã Chương Dương', 'Xã Cổ Đô', 'Xã Dân Hòa',
  'Xã Dương Hòa', 'Xã Gia Lâm', 'Xã Hoài Đức', 'Xã Hát Môn', 'Xã Hòa Lạc', 'Xã Hòa Phú', 'Xã Hòa Xá', 'Xã Hưng Đạo', 'Xã Hương Sơn',
  'Xã Hạ Bằng', 'Xã Hồng Sơn', 'Xã Hồng Vân', 'Xã Kim Anh', 'Xã Kiều Phú', 'Xã Liên Minh', 'Xã Minh Châu', 'Xã Mê Linh', 'Xã Mỹ Đức',
  'Xã Nam Phù', 'Xã Ngọc Hồi', 'Xã Nội Bài', 'Xã Phù Đổng', 'Xã Phú Cát', 'Xã Phú Nghĩa', 'Xã Phú Xuyên', 'Xã Phúc Lộc', 'Xã Phúc Sơn',
  'Xã Phúc Thịnh', 'Xã Phúc Thọ', 'Xã Phượng Dực', 'Xã Quang Minh', 'Xã Quảng Bị', 'Xã Quảng Oai', 'Xã Quốc Oai', 'Xã Suối Hai',
  'Xã Sóc Sơn', 'Xã Sơn Đồng', 'Xã Tam Hưng', 'Xã Thanh Oai', 'Xã Thanh Trì', 'Xã Thiên Lộc', 'Xã Thuận An', 'Xã Thư Lâm', 'Xã Thường Tín',
  'Xã Thượng Phúc', 'Xã Thạch Thất', 'Xã Tiến Thắng', 'Xã Trung Giã', 'Xã Trần Phú', 'Xã Tây Phương', 'Xã Vân Đình', 'Xã Vĩnh Thanh',
  'Xã Vật Lại', 'Xã Xuân Mai', 'Xã Yên Bài', 'Xã Yên Lãng', 'Xã Yên Xuân', 'Xã Ô Diên', 'Xã Đa Phúc', 'Xã Đan Phượng', 'Xã Đoài Phương',
  'Xã Đông Anh', 'Xã Đại Thanh', 'Xã Đại Xuyên', 'Xã Ứng Hòa', 'Xã Ứng Thiên'
];
/* địa bàn có khu công nghiệp, khu công nghệ cao lớn: nhiều lao động làm công ăn lương, nhiều lao động nước ngoài */
const SNV_KCN = ['Xã Quang Minh', 'Xã Nội Bài', 'Xã Hòa Lạc', 'Xã Phú Nghĩa', 'Xã Thạch Thất', 'Xã Đông Anh', 'Xã Kim Anh', 'Xã Thường Tín', 'Xã Phú Xuyên', 'Xã Mê Linh'];
/* phường trung tâm, nhiều văn phòng doanh nghiệp FDI */
const SNV_TT = ['Phường Cầu Giấy', 'Phường Ba Đình', 'Phường Hoàn Kiếm', 'Phường Tây Hồ', 'Phường Từ Liêm', 'Phường Yên Hòa', 'Phường Láng', 'Phường Xuân Phương', 'Phường Hai Bà Trưng', 'Phường Cửa Nam'];
/* xã miền núi, xa trung tâm */
const SNV_XA_XA = ['Xã Ba Vì', 'Xã Yên Bài', 'Xã Suối Hai', 'Xã Bất Bạt', 'Xã Yên Xuân', 'Xã Mỹ Đức', 'Xã Hương Sơn', 'Xã Phú Cát', 'Xã Trần Phú',
  'Xã Minh Châu', 'Xã Cổ Đô', 'Xã Hồng Sơn', 'Xã Phúc Sơn', 'Xã Đại Xuyên', 'Xã Chuyên Mỹ'];

const SNV_M = [0, 1, 2, 3, 4, 5, 6, 7, 8];
/* đơn vị tiền lưu TRIỆU ĐỒNG */
const SNV_UNITS = SNV_DV.map((ten) => {
  const R = (k) => snvR(ten, k), ph = ten.indexOf('Phường') === 0, kcn = SNV_KCN.indexOf(ten) >= 0, tt = SNV_TT.indexOf(ten) >= 0, xa = SNV_XA_XA.indexOf(ten) >= 0;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const dan = Math.round((ph ? 82000 : 58000) * (0.6 + 0.8 * R('ds')) / 100) * 100;
  const llld = Math.round(dan * (0.55 + 0.03 * R('ll')));
  /* ---- 1. bảo hiểm: tỷ lệ tham gia tăng dần từ T1 đến T9 ---- */
  const bhxh9 = cl((ph ? 0.585 : 0.468) + 0.11 * (R('bx') - 0.5) + (kcn ? 0.09 : 0) + (tt ? 0.05 : 0) - (xa ? 0.08 : 0), 0.3, 0.8);
  const bhtnK = 0.84 + 0.06 * R('tn');
  const nguoiHuong = Math.round(dan * (ph ? 0.084 : 0.058) * (0.9 + 0.2 * R('nh')));
  const quaTk = cl(0.996 - (xa ? 0.03 : 0) - 0.008 * R('tk'), 0.9, 1);
  const thang = SNV_M.map((m) => {
    const RM = (k) => R(k + m), heSo = 0.968 + 0.032 * m / 8;
    const bhxh = Math.round(llld * bhxh9 * heSo), bhtn = Math.round(bhxh * bhtnK);
    /* thu: bình quân ~2,8 triệu đồng/người tham gia/tháng (gồm BHYT); tháng 2 (Tết) thấp hơn; đơn vị nợ đóng → thu đạt 92 – 99% */
    const phaiThu = Math.round(bhxh * 2.78 * (m === 1 ? 0.9 : 0.97 + 0.06 * RM('pt')));
    const daThu = Math.round(phaiThu * cl(0.955 + 0.035 * RM('dt') - (xa ? 0.02 : 0) + 0.002 * m, 0.9, 0.995));
    /* chi: bình quân ~7,3 triệu đồng/người hưởng/tháng (lương hưu, trợ cấp, chi khám chữa bệnh BHYT) */
    const phaiChi = Math.round(nguoiHuong * 7.3 * (0.96 + 0.08 * RM('pc')));
    const daChi = Math.round(phaiChi * (0.996 + 0.004 * RM('dc')));
    return { bhxh: bhxh, bhtn: bhtn, phaiThu: phaiThu, daThu: daThu, phaiChi: phaiChi, daChi: daChi };
  });
  const bh = { llld: llld, nguoiHuong: nguoiHuong, quaTk: Math.round(nguoiHuong * quaTk), thang: thang, soThon: Math.round((ph ? 22 : 30) + 18 * R('th')) };
  /* ---- 2. lao động: «Số lao động đạt» hiểu là lao động đã qua đào tạo ---- */
  const ld = {
    llld: llld, daoTao: Math.round(llld * cl((ph ? 0.805 : 0.725) + 0.06 * (R('dt') - 0.5) - (xa ? 0.05 : 0) + (kcn ? 0.02 : 0), 0.55, 0.9)),
    /* đi làm việc ở nước ngoài theo hợp đồng trong tháng: chủ yếu lao động xã ngoại thành */
    diNn: SNV_M.map((m) => Math.floor((ph ? 0.6 : (xa ? 2.4 : 3.3)) * (0.5 + R('xk')) * (m === 1 ? 0.5 : 1) + snvR(ten, 'xm' + m))),
    /* lao động nước ngoài đang làm việc (thời điểm): dồn ở phường trung tâm và địa bàn có khu công nghiệp */
    nuocNgoai: Math.round((tt ? 650 : kcn ? 1100 : ph ? 90 : 20) * (0.5 + R('nn')))
  };
  /* ---- 3. biên chế công chức, viên chức cấp xã (thời điểm) và biến động trong tháng ---- */
  const giao = Math.round((ph ? 73 : 66) + 13 * R('bg'));
  const thucHien = Math.round(giao * cl(0.935 + 0.06 * R('th2'), 0.9, 1));
  const huongLuong = thucHien - (R('hl') < 0.3 ? 1 : 0);
  const bd = (k, lam) => SNV_M.map((m) => Math.floor(lam + snvR(ten, k + m)));
  const bc = { giao: giao, thucHien: thucHien, huongLuong: huongLuong,
    tuyen: SNV_M.map((m) => (m === 5 || m === 6 || m === 7) ? Math.floor(0.5 + 1.2 * snvR(ten, 'tm' + m)) : Math.floor(0.12 + snvR(ten, 'tm' + m))),
    huu: bd('hu', 0.14), thoiViec: bd('tv', 0.17 + 0.06 * R('tv0')), chuyen: bd('ct', 0.27) };
  /* ---- 4. cán bộ chuyển đổi số, kỹ năng số, chữ ký số (tổng = công chức, viên chức thực hiện) ---- */
  const lechCds = (ph ? 0.03 : -0.01) - (xa ? 0.05 : 0) + 0.04 * (R('ks') - 0.5);
  const cds = {
    dvCds: R('dc1') < 0.05 ? 0 : (R('dc2') < 0.55 ? 1 : 2), dvAntt: R('da1') < (xa ? 0.45 : 0.2) ? 0 : 1,
    thang: SNV_M.map((m) => {
      const kns = cl(0.78 + 0.14 * m / 8 + lechCds, 0.5, 1), cks = cl(0.968 + 0.022 * m / 8 + lechCds * 0.3, 0.8, 1);
      return { tong: thucHien, kns: Math.round(thucHien * kns), cks: Math.round(thucHien * cks) };
    })
  };
  return { ten: ten, phuong: ph, dan: dan, bh: bh, ld: ld, bc: bc, cds: cds };
});

/* ---------- Số tổng hợp ---------- */
const SNV_SUM = (function () {
  const U = SNV_UNITS, t = (f) => snvSum(U.map(f)), cnt = (f) => U.filter(f).length, Q9 = 8;
  const th = (f) => SNV_M.map((m) => t((u) => f(u, m)));
  const nhom = (g, f) => [U.filter((u) => u.phuong), U.filter((u) => !u.phuong)].map(f);
  const top = (f, n, asc) => U.map((u) => [u.ten, f(u)]).sort((a, b) => asc ? a[1] - b[1] : b[1] - a[1]).slice(0, n || 10);
  const xep = (rows, g) => g.map((x, i) => [x[0], rows.filter((r) => r[1] >= x[1] && (i === 0 || r[1] < g[i - 1][1])).length, x[2]]);
  /* 1. bảo hiểm */
  const bhxhT = th((u, m) => u.bh.thang[m].bhxh), bhtnT = th((u, m) => u.bh.thang[m].bhtn);
  const ptT = th((u, m) => u.bh.thang[m].phaiThu), dtT = th((u, m) => u.bh.thang[m].daThu), pcT = th((u, m) => u.bh.thang[m].phaiChi), dcT = th((u, m) => u.bh.thang[m].daChi);
  const llld = t((u) => u.bh.llld);
  const tlBhxh = U.map((u) => [u.ten, u.bh.thang[Q9].bhxh / u.bh.llld * 100]);
  const bh = {
    llld: llld, bhxh: bhxhT[Q9], bhtn: bhtnT[Q9], nguoiHuong: t((u) => u.bh.nguoiHuong), quaTk: t((u) => u.bh.quaTk),
    phaiThu: snvSum(ptT), daThu: snvSum(dtT), phaiChi: snvSum(pcT), daChi: snvSum(dcT),
    ptT: ptT, dtT: dtT, pcT: pcT, dcT: dcT,
    xuHuong: [bhxhT.map((v) => v / llld * 100), bhtnT.map((v) => v / llld * 100)],
    cap: nhom(0, (g) => [snvSum(g.map((u) => u.bh.thang[Q9].bhxh)) / snvSum(g.map((u) => u.bh.llld)) * 100, snvSum(g.map((u) => u.bh.thang[Q9].bhtn)) / snvSum(g.map((u) => u.bh.llld)) * 100]),
    nhom: xep(tlBhxh, [['Từ 60% trở lên', 60, '#1baf7a'], ['Từ 45% đến dưới 60%', 45, '#2a78d6'], ['Dưới 45%', 0, '#eda100']]),
    thap: tlBhxh.slice().sort((a, b) => a[1] - b[1]).slice(0, 10),
    soThon: t((u) => u.bh.soThon)
  };
  /* 2. lao động */
  const diT = th((u, m) => u.ld.diNn[m]);
  const ld = {
    llld: t((u) => u.ld.llld), daoTao: t((u) => u.ld.daoTao), diNn: snvSum(diT), diT: diT, nuocNgoai: t((u) => u.ld.nuocNgoai),
    cap: nhom(0, (g) => snvSum(g.map((u) => u.ld.daoTao)) / snvSum(g.map((u) => u.ld.llld)) * 100),
    diTop: top((u) => snvSum(u.ld.diNn)), nnTop: top((u) => u.ld.nuocNgoai),
    dtThap: top((u) => u.ld.daoTao / u.ld.llld * 100, 10, true)
  };
  /* 3. biên chế */
  const tuyenT = th((u, m) => u.bc.tuyen[m]), huuT = th((u, m) => u.bc.huu[m]), tvT = th((u, m) => u.bc.thoiViec[m]), ctT = th((u, m) => u.bc.chuyen[m]);
  const tlBc = U.map((u) => [u.ten, u.bc.thucHien / u.bc.giao * 100]);
  const bc = {
    giao: t((u) => u.bc.giao), thucHien: t((u) => u.bc.thucHien), huongLuong: t((u) => u.bc.huongLuong),
    tuyen: snvSum(tuyenT), huu: snvSum(huuT), thoiViec: snvSum(tvT), chuyen: snvSum(ctT),
    tuyenT: tuyenT, giamT: [huuT, tvT, ctT],
    nhom: xep(tlBc, [['Từ 98% trở lên', 98, '#1baf7a'], ['Từ 95% đến dưới 98%', 95, '#2a78d6'], ['Dưới 95%', 0, '#eda100']]),
    thieu: top((u) => u.bc.giao - u.bc.thucHien)
  };
  /* 4. chuyển đổi số */
  const tongT = th((u, m) => u.cds.thang[m].tong), knsT = th((u, m) => u.cds.thang[m].kns), cksT = th((u, m) => u.cds.thang[m].cks);
  const cds = {
    tong: tongT[Q9], kns: knsT[Q9], cks: cksT[Q9],
    dvCds: t((u) => u.cds.dvCds), dvAntt: t((u) => u.cds.dvAntt),
    tieuChi: [['Có công chức, viên chức chuyên trách chuyển đổi số', cnt((u) => u.cds.dvCds > 0)], ['Có công chức, viên chức chuyên trách an toàn thông tin mạng', cnt((u) => u.cds.dvAntt > 0)]],
    xuHuong: [knsT.map((v, m) => v / tongT[m] * 100), cksT.map((v, m) => v / tongT[m] * 100)],
    thap: top((u) => u.cds.thang[Q9].kns / u.cds.thang[Q9].tong * 100, 10, true)
  };
  return { bh: bh, ld: ld, bc: bc, cds: cds };
})();

/* ---------- Mô tả 4 chỉ tiêu (dùng cho tài liệu; khối "Cách tính" trên giao diện đang ẩn) ---------- */
const SNV_EFORM_A = 'Danh sách bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp';
const SNV_EFORM_B = 'Lao động Công chức viên chức';
const SNV_CT = [
  { key: 'bh', name: 'Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp', eform: SNV_EFORM_A, ky: SNV_KY, freq: 'Tháng', soBanGhi: SNV_DV.length * 5 },
  { key: 'ld', name: 'Lao động, việc làm trên địa bàn', eform: SNV_EFORM_B, ky: SNV_KY, freq: 'Tháng', soBanGhi: SNV_DV.length },
  { key: 'bc', name: 'Biên chế công chức, viên chức cấp xã', eform: SNV_EFORM_B, ky: SNV_KY, freq: 'Tháng', soBanGhi: SNV_DV.length },
  { key: 'cds', name: 'Cán bộ chuyển đổi số và chữ ký số', eform: SNV_EFORM_B, ky: SNV_KY, freq: 'Tháng', soBanGhi: SNV_DV.length }
];

/* ---------- Dòng chỉ tiêu cho categorySeed (central-level.js) ---------- */
function snvPart(dim, type, rows) { return { dim: dim, type: type, items: rows.map((r) => ({ label: r[0], value: r[1] })) }; }
const SNV_ITEMS = (function () {
  const S = SNV_SUM, src = 'Eform Sở Nội vụ (giả lập)', r1 = (v) => Math.round(v * 10) / 10;
  const parts = {
    bh: [snvPart('Tỷ lệ tham gia (%)', 'stat', [['Bảo hiểm xã hội', r1(S.bh.bhxh / S.bh.llld * 100)], ['Bảo hiểm thất nghiệp', r1(S.bh.bhtn / S.bh.llld * 100)]])],
    ld: [snvPart('Lao động', 'stat', [['Lao động qua đào tạo (%)', r1(S.ld.daoTao / S.ld.llld * 100)], ['Đi làm việc ở nước ngoài, 9 tháng (người)', S.ld.diNn], ['Lao động nước ngoài đang làm việc (người)', S.ld.nuocNgoai]])],
    bc: [snvPart('Biên chế (người)', 'stat', [['Được giao', S.bc.giao], ['Thực hiện', S.bc.thucHien], ['Hưởng lương', S.bc.huongLuong]])],
    cds: [snvPart('Tỷ lệ tháng 9 (%)', 'stat', [['Được bồi dưỡng kỹ năng số', r1(S.cds.kns / S.cds.tong * 100)], ['Được cấp chữ ký số', r1(S.cds.cks / S.cds.tong * 100)]])]
  };
  return SNV_CT.map((c) => { const it = [c.name, c.soBanGhi, c.freq, src, parts[c.key]]; it.vkey = c.key; return it; });
})();
