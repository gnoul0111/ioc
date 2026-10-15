/* ============================== ỦY BAN MTTQ VIỆT NAM THÀNH PHỐ — CHỈ TIÊU KHUÔN MỚI ==============================
   Khai báo cho bộ khung ctm-engine.js: màn ngoài của trục MTTQ cấp Thành phố và phần chi tiết từng ban, đơn vị.
   SỐ LIỆU: số công bố công khai được giữ đúng (ghi "số công bố" ở chú thích từng dòng); số còn lại là số ước tính, đặt theo
   quy mô của Thành phố và dân số thật của 126 xã, phường (ctm-xa.js), chờ thay bằng số do đơn vị cung cấp. */

/* ---------- Ban Tuyên giáo và Công tác Xã hội: Quỹ “Vì người nghèo”, nhà Đại đoàn kết, chăm lo Tết, Quỹ “Vì biển, đảo” ---------- */
const MTQ_QUY_BASE = {
  /* 2025: chương trình "Chung tay vì người nghèo và an sinh xã hội" 03/11/2025 tiếp nhận hơn 93 tỷ đồng (số công bố);
     hộ cận nghèo, 43 xã/phường không còn hộ cận nghèo, 126/126 không còn hộ nghèo (số công bố);
     Tết Bính Ngọ 2026: 5.280 suất × 1 triệu đồng + 300 suất người cao tuổi × 0,5 triệu đồng từ Quỹ Thành phố (số công bố);
     lễ phát động Quỹ "Vì biển, đảo Việt Nam" 2025 tiếp nhận hơn 40 tỷ đồng (số công bố). */
  2025: { thu: 214.6, chi: 203.3, tp: 121.8, xa: 92.8, ct: 93, xmN: 612, scN: 268, xmBq: 55.1, scBq: 25.0, cn: 9570, cn0: 43, suatTP: 5280, suatNCT: 300, suatAll: 152600, bd: 52.7, bdLe: 40, tet: 'Tết Bính Ngọ 2026' },
  /* 2024: 9.928 hộ cận nghèo theo kết quả rà soát cuối năm 2024 (số công bố). 2024 + 9 tháng 2025: xây mới 1.034, sửa chữa 476 nhà, 69,8 tỷ đồng (số công bố) */
  2024: { thu: 198.2, chi: 188.6, tp: 112.4, xa: 85.8, xmN: 548, scN: 262, xmBq: 54.9, scBq: 25.2, cn: 9928, cn0: 31, suatTP: 5410, suatNCT: 300, suatAll: 146900, bd: 47.9, bdLe: 37.8, tet: 'Tết Ất Tỵ 2025' },
  2023: { thu: 189.5, chi: 180.2, tp: 107.9, xa: 81.6, xmN: 506, scN: 241, xmBq: 52.6, scBq: 24.1, cn: 15644, cn0: 18, suatTP: 5120, suatNCT: 250, suatAll: 141300, bd: 44.2, bdLe: 36.1, tet: 'Tết Giáp Thìn 2024' },
  2022: { thu: 176.9, chi: 171.3, tp: 100.2, xa: 76.7, xmN: 471, scN: 228, xmBq: 50.3, scBq: 23.0, cn: 22263, cn0: 9, suatTP: 4860, suatNCT: 250, suatAll: 137800, bd: 41.5, bdLe: 33.0, tet: 'Tết Quý Mão 2023' },
  /* 2021: chưa áp dụng chuẩn cận nghèo giai đoạn 2022–2025 nên không có số hộ cận nghèo so sánh được */
  2021: { thu: 168.4, chi: 152.0, tp: 95.6, xa: 72.8, xmN: 402, scN: 196, xmBq: 48.0, scBq: 22.0, cn: null, cn0: null, suatTP: 4500, suatNCT: 200, suatAll: 131200, bd: 36.9, bdLe: 28.4, tet: 'Tết Nhâm Dần 2022' }
};
const MTQ_QUY_TON_DAU_2021 = 19.8;
/* Cơ cấu phần chi ngoài nhà Đại đoàn kết (Tết, an sinh khác, sinh kế, học tập, khám chữa bệnh) */
const MTQ_QUY_CHI_CC = [['cTet', 0.4766], ['cAs', 0.2712], ['cSk', 0.1132], ['cHt', 0.0790], ['cKcb', 0.0600]];
/* Cơ cấu người ủng hộ Quỹ "Vì biển, đảo Việt Nam" */
const MTQ_BD_CC = [['bdCq', 0.406], ['bdMt', 0.353], ['bdDn', 0.186], ['bdCn', 0.055]];
const MTQ_QUY_PERIODS = ['2025', '2024', '2023', '2022', '2021'].map((y) => ({ id: y, label: 'Năm ' + y, short: y }));

function mtqQuyData(pid) {
  const B = MTQ_QUY_BASE[pid];
  if (!B) return null;
  const D = Object.assign({}, B);
  /* tồn quỹ nối tiếp các năm: tồn đầu năm = tồn cuối năm trước */
  let ton = MTQ_QUY_TON_DAU_2021;
  for (const y of ['2021', '2022', '2023', '2024', '2025']) { const b = MTQ_QUY_BASE[y]; if (y === pid) { D.tonDau = ton; } ton = Math.round((ton + b.thu - b.chi) * 10) / 10; if (y === pid) { D.ton = ton; break; } }
  D.cxm = Math.round(B.xmN * B.xmBq / 100) / 10;
  D.csc = Math.round(B.scN * B.scBq / 100) / 10;
  const rest = Math.round((B.chi - D.cxm - D.csc) * 10) / 10;
  let used = 0;
  MTQ_QUY_CHI_CC.forEach((c, i) => { const v = i === MTQ_QUY_CHI_CC.length - 1 ? Math.round((rest - used) * 10) / 10 : Math.round(rest * c[1] * 10) / 10; D[c[0]] = v; used += v; });
  D.nhaN = B.xmN + B.scN;
  D.nhaKp = Math.round((D.cxm + D.csc) * 10) / 10;
  D.kpTP = (B.suatTP * 1 + B.suatNCT * 0.5) / 1000;
  D.kpAll = D.cTet;
  D.kpXa = Math.round((D.kpAll - D.kpTP) * 100) / 100;
  let bu = 0;
  MTQ_BD_CC.forEach((c, i) => { const v = i === MTQ_BD_CC.length - 1 ? Math.round((B.bd - bu) * 10) / 10 : Math.round(B.bd * c[1] * 10) / 10; D[c[0]] = v; bu += v; });
  return D;
}
/* 126 xã, phường: quỹ vận động tại cơ sở, hộ cận nghèo, nhà Đại đoàn kết — chia từ tổng Thành phố theo dân số thật. */
function mtqQuyXaRows(pid) {
  const D = mtqQuyData(pid);
  if (!D) return [];
  const seeds = CTM_XA.map((u) => { const g = ctmRng('mttq-quy|' + u.name); return { u: u, a: g(), b: g(), c: g(), y: ctmRng('mttq-quy|' + u.name + '|' + pid)() }; });
  const q = ctmShare(D.xa * 1000, seeds.map((s) => s.u.ds * (s.u.k === 'P' ? 1.35 : 0.85) * (0.75 + 0.5 * s.a) * (0.94 + 0.12 * s.y)));
  let cn = null;
  if (D.cn != null) {
    const zero = {};
    CTM_XA.slice().sort((x, y) => y.den - x.den).slice(0, D.cn0 || 0).forEach((u) => { zero[u.name] = 1; });
    cn = ctmShareInt(D.cn, seeds.map((s) => (zero[s.u.name] ? 0 : s.u.ho * (s.u.k === 'X' ? 1 : 0.35) * (0.4 + 1.2 * s.b) / Math.sqrt(s.u.den / 1000))));
  }
  const nha = ctmShareInt(D.nhaN, seeds.map((s, i) => (cn ? cn[i] : s.u.ho * 0.004) + (s.u.ds / 20000) * (0.5 + s.c)));
  return seeds.map((s, i) => ({ u: s.u, q: q[i], qpc: q[i] * 1000 / s.u.ds, cn: cn ? cn[i] : null, cnR: cn ? cn[i] / s.u.ho * 100 : null, nha: nha[i] }));
}

ctmRegister({
  id: 'mttq-quy', role: 'MTTQ', level: 'city',
  name: 'Ban Tuyên giáo và Công tác Xã hội', org: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội', short: 'Ban Tuyên giáo và CTXH',
  periods: MTQ_QUY_PERIODS, kind: 'năm', cmpRef: 'năm trước',
  data: mtqQuyData,
  metrics: {
    thu: { l: 'Quỹ “Vì người nghèo” vận động các cấp', short: 'Vận động các cấp', u: 'tỷ đồng', d: 1 },
    chi: { l: 'Chi hỗ trợ từ Quỹ “Vì người nghèo”', short: 'Chi hỗ trợ', u: 'tỷ đồng', d: 1, neutral: true },
    ton: { l: 'Tồn quỹ cuối năm', short: 'Tồn quỹ cuối năm', u: 'tỷ đồng', d: 1, neutral: true },
    tonDau: { l: 'Tồn quỹ đầu năm', u: 'tỷ đồng', d: 1, neutral: true },
    tp: { l: 'Quỹ cấp Thành phố', u: 'tỷ đồng', d: 1 },
    xa: { l: 'Quỹ của 126 xã, phường', short: 'Quỹ của 126 xã, phường', u: 'tỷ đồng', d: 1 },
    cTet: { l: 'Tặng quà, thăm hỏi dịp Tết', u: 'tỷ đồng', d: 1, neutral: true },
    cAs: { l: 'An sinh xã hội khác', u: 'tỷ đồng', d: 1, neutral: true },
    cSk: { l: 'Hỗ trợ sinh kế, vốn sản xuất', u: 'tỷ đồng', d: 1, neutral: true },
    cHt: { l: 'Hỗ trợ học tập', u: 'tỷ đồng', d: 1, neutral: true },
    cKcb: { l: 'Hỗ trợ khám, chữa bệnh', u: 'tỷ đồng', d: 1, neutral: true },
    cxm: { l: 'Xây mới nhà Đại đoàn kết', u: 'tỷ đồng', d: 1, neutral: true },
    csc: { l: 'Sửa chữa nhà Đại đoàn kết', u: 'tỷ đồng', d: 1, neutral: true },
    xmN: { l: 'Nhà Đại đoàn kết xây mới', short: 'Xây mới', u: 'căn' },
    scN: { l: 'Nhà Đại đoàn kết sửa chữa', short: 'Sửa chữa', u: 'căn' },
    nhaN: { l: 'Nhà Đại đoàn kết xây mới, sửa chữa', short: 'Xây mới, sửa chữa', u: 'căn' },
    nhaKp: { l: 'Kinh phí nhà Đại đoàn kết', short: 'Kinh phí', u: 'tỷ đồng', d: 1, neutral: true },
    xmBq: { l: 'Bình quân một nhà xây mới', short: 'Bình quân một nhà xây mới', u: 'triệu đồng', d: 1, neutral: true },
    cn: { l: 'Hộ cận nghèo còn lại', short: 'Hộ cận nghèo', u: 'hộ', inv: true, na: 'Chưa áp dụng chuẩn 2022–2025' },
    cnR: { l: 'Tỷ lệ hộ cận nghèo', u: '%', d: 2, inv: true, v: (D) => (D.cn == null ? null : D.cn / CTM_HO * 100) },
    cn0: { l: 'Xã, phường không còn hộ cận nghèo', short: 'Xã, phường không còn hộ cận nghèo', u: 'đơn vị' },
    /* số suất quà đi theo số hộ khó khăn (giảm khi hộ cận nghèo giảm) nên tăng/giảm để màu trung tính */
    suatTP: { l: 'Suất quà Tết từ Quỹ Thành phố', short: 'Suất quà hộ cận nghèo, hộ khó khăn', u: 'suất', neutral: true },
    suatNCT: { l: 'Suất quà Tết người cao tuổi', short: 'Suất quà người cao tuổi', u: 'suất', neutral: true },
    suatAll: { l: 'Suất quà Tết các cấp', short: 'Suất quà các cấp', u: 'suất', neutral: true },
    kpTP: { l: 'Kinh phí từ Quỹ Thành phố', u: 'tỷ đồng', d: 1, neutral: true },
    kpXa: { l: 'Kinh phí cấp xã, phường và nhà hảo tâm', u: 'tỷ đồng', d: 1, neutral: true },
    kpAll: { l: 'Kinh phí chăm lo Tết các cấp', short: 'Kinh phí các cấp', u: 'tỷ đồng', d: 1, neutral: true },
    bd: { l: 'Quỹ “Vì biển, đảo Việt Nam” tiếp nhận', short: 'Tiếp nhận cả năm', u: 'tỷ đồng', d: 1 },
    bdLe: { l: 'Tiếp nhận tại lễ phát động', short: 'Tại lễ phát động', u: 'tỷ đồng', d: 1 },
    bdCq: { l: 'Cơ quan, đơn vị khối Thành phố', u: 'tỷ đồng', d: 1 },
    bdMt: { l: 'Ủy ban MTTQ xã, phường', u: 'tỷ đồng', d: 1 },
    bdDn: { l: 'Doanh nghiệp', u: 'tỷ đồng', d: 1 },
    bdCn: { l: 'Cá nhân', u: 'tỷ đồng', d: 1 }
  },
  kpis: [
    { m: 'thu', sub: () => 'tỷ đồng trong năm', target: 'g:quy' },
    { m: 'chi', sub: (D) => ctmF(D.chi / D.thu * 100, 1) + '% số vận động', target: 'g:quy' },
    { m: 'ton', sub: () => 'tỷ đồng chuyển sang năm sau', target: 'g:quy' },
    { m: 'xmN', sub: (D) => 'bình quân ' + ctmF(D.xmBq, 1) + ' triệu đồng một nhà', target: 'g:nha' },
    { m: 'scN', sub: () => 'căn', target: 'g:nha' },
    { m: 'cn', sub: (D) => (D.cn == null ? 'chưa áp dụng chuẩn 2022–2025' : ctmF(D.cn / CTM_HO * 100, 2) + '% số hộ toàn Thành phố'), target: 'xa:cn' },
    { m: 'cn0', sub: () => 'trên 126 xã, phường', target: 'xa:cn' },
    { m: 'suatTP', sub: (D) => D.tet + ' · từ Quỹ Thành phố', target: 'g:tet' }
  ],
  card: ['thu', 'nhaN', 'cn', 'suatTP'],
  groups: [
    { id: 'quy', label: 'Quỹ “Vì người nghèo”', note: 'Vận động, chi hỗ trợ và tồn Quỹ các cấp', lines: ['thu', 'chi', 'ton', 'xa'],
      rows: [
        [{ type: 'cmp', t: 'Vận động, chi, tồn Quỹ', big: 'thu', items: ['thu', 'chi', 'ton'],
          hint: (D) => 'Tồn đầu năm + vận động − chi = tồn cuối năm: ' + ctmF(D.tonDau, 1) + ' + ' + ctmF(D.thu, 1) + ' − ' + ctmF(D.chi, 1) + ' = ' + ctmF(D.ton, 1) + ' tỷ đồng.' },
         { type: 'cols', t: 'Quỹ qua 5 năm', m: 'thu', m2: 'chi', hint: () => 'Vận động tăng đều 4–8% mỗi năm.' }],
        [{ type: 'table', t: 'Chi hỗ trợ theo nội dung', head: 'Nội dung chi', rows: ['cTet', 'cAs', 'cxm', 'cSk', 'cHt', 'cKcb', 'csc'], total: 'chi', unit: 'tỷ đồng', wide: true,
          hint: () => 'Mức hỗ trợ xây mới từ Quỹ cấp Thành phố là 50 triệu đồng một nhà; xã, phường và nhà hảo tâm hỗ trợ thêm.' },
         { type: 'parts', t: 'Nguồn vận động theo cấp', total: 'thu', parts: ['tp', 'xa'], xa: 'q',
          hint: (D) => (D.ct ? 'Riêng Chương trình “Chung tay vì người nghèo và an sinh xã hội” tối 03/11/2025 tiếp nhận hơn ' + ctmF(D.ct) + ' tỷ đồng. ' : '') + 'Bấm tên thẻ để xem quỹ của từng xã, phường.' }]
      ] },
    { id: 'nha', label: 'Nhà Đại đoàn kết', note: 'Xây mới, sửa chữa nhà cho hộ cận nghèo, hộ có hoàn cảnh đặc biệt khó khăn', lines: ['xmN', 'scN', 'nhaKp', 'xmBq'],
      rows: [
        [{ type: 'cmp', t: 'Nhà Đại đoàn kết xây mới, sửa chữa', big: 'nhaN', items: ['xmN', 'scN'], xa: 'nha',
          hint: () => 'Năm 2024 và 9 tháng đầu năm 2025, Quỹ các cấp hỗ trợ xây mới 1.034 nhà, sửa chữa 476 nhà, tổng trị giá trên 69,8 tỷ đồng.' },
         { type: 'cols', t: 'Nhà Đại đoàn kết qua 5 năm', m: 'xmN', m2: 'scN' }],
        /* cơ cấu 2 phần: thẻ cơ cấu chuẩn thay cho bảng (quy tắc H15) */
        [{ type: 'parts', t: 'Kinh phí nhà Đại đoàn kết', total: 'nhaKp', parts: ['cxm', 'csc'],
          hint: (D) => 'Bình quân ' + ctmF(D.xmBq, 1) + ' triệu đồng một nhà xây mới, ' + ctmF(D.scBq, 1) + ' triệu đồng một nhà sửa chữa.' },
         { type: 'top', ind: 'nha', n: 10, t: 'Xã, phường có nhiều nhà Đại đoàn kết nhất' }]
      ] },
    { id: 'tet', label: 'Chăm lo Tết', note: 'Tặng quà Tết cho hộ cận nghèo, hộ có hoàn cảnh khó khăn, người cao tuổi', lines: ['suatTP', 'suatNCT', 'kpTP', 'suatAll'],
      rows: [
        [{ type: 'cmp', t: 'Suất quà Tết', big: 'suatAll', items: ['suatAll', 'suatTP', 'suatNCT'], s: (D, P, n) => D.tet + (n.P ? ' so với ' + n.P.tet : '') + ' · suất',
          hint: (D) => 'Quỹ Thành phố tặng mỗi suất 1 triệu đồng cho hộ cận nghèo, hộ có hoàn cảnh đặc biệt khó khăn trên địa bàn 126 xã, phường; người cao tuổi 0,5 triệu đồng một suất.' },
         { type: 'cols', t: 'Kinh phí chăm lo Tết các cấp', m: 'kpAll', s: () => '5 đợt Tết gần nhất · tỷ đồng' }],
        [{ type: 'parts', t: 'Kinh phí chăm lo Tết theo nguồn', total: 'kpAll', parts: ['kpTP', 'kpXa'], s: (D) => D.tet + ' · tỷ đồng' }]
      ] },
    { id: 'bd', label: 'Quỹ “Vì biển, đảo Việt Nam”', note: 'Vận động ủng hộ Quỹ “Vì biển, đảo Việt Nam” hằng năm', lines: ['bd', 'bdLe', 'bdDn', 'bdCn'],
      rows: [
        [{ type: 'cmp', t: 'Tiếp nhận Quỹ “Vì biển, đảo Việt Nam”', big: 'bd', items: ['bd', 'bdLe'],
          hint: () => 'Lễ phát động năm 2026 (14/4/2026) tiếp nhận hơn 28 tỷ đồng của 115 tập thể, cá nhân; nhận ủng hộ đến 31/5/2026.' },
         { type: 'cols', t: 'Quỹ “Vì biển, đảo Việt Nam” qua 5 năm', m: 'bd', m2: 'bdLe' }],
        [{ type: 'parts', t: 'Người ủng hộ', total: 'bd', parts: ['bdCq', 'bdMt', 'bdDn', 'bdCn'] }]
      ] }
  ],
  xa: {
    label: 'Theo 126 xã, phường',
    inds: [
      { id: 'q', l: 'Quỹ “Vì người nghèo” vận động tại xã, phường', u: 'tỷ đồng', d: 2, better: 'high', tot: true, v: (r) => r.q / 1000 },
      { id: 'qpc', l: 'Vận động bình quân đầu người', u: 'nghìn đồng/người', d: 0, better: 'high', v: (r) => r.qpc, tp: (D) => D.xa * 1e6 / CTM_POP },
      { id: 'cn', l: 'Hộ cận nghèo', u: 'hộ', d: 0, better: 'low', tot: true, zeroLabel: 'Không còn hộ cận nghèo', v: (r) => r.cn },
      { id: 'cnR', l: 'Tỷ lệ hộ cận nghèo', u: '%', d: 2, better: 'low', v: (r) => r.cnR, tp: (D) => (D.cn == null ? null : D.cn / CTM_HO * 100) },
      { id: 'nha', l: 'Nhà Đại đoàn kết xây mới, sửa chữa', u: 'căn', d: 0, better: 'high', tot: true, v: (r) => r.nha }
    ],
    rows: (pid) => mtqQuyXaRows(pid),
    note: 'Tên, loại (phường hay xã), dân số và diện tích của 126 xã, phường là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025. Số hộ ước tính bằng dân số chia 3,05 người một hộ.'
  },
  note: 'kỳ báo cáo là năm, so với năm liền trước. Quỹ các cấp gồm Quỹ cấp Thành phố và Quỹ của 126 xã, phường. Hộ cận nghèo giảm hiển thị màu xanh; số chi, tồn quỹ tăng hay giảm để màu trung tính. Chăm lo Tết của kỳ năm là đợt Tết Nguyên đán vận động từ cuối năm đó. Bấm tên một thẻ chỉ tiêu (có dấu ›) để xem theo từng xã, phường.'
});

/* ---------- MTTQ · Theo dõi nhiệm vụ (số trạng thái nhiệm vụ như VPTU_DATA, vptu-tracking.js) ---------- */
ctmTaskSpec({ id: 'mttq-nhiem-vu', role: 'MTTQ', name: 'MTTQ · Theo dõi nhiệm vụ', short: 'Theo dõi nhiệm vụ', org: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội', khoi: [{ id: 'mt', label: 'Ủy ban MTTQ Việt Nam Thành phố', now: [4, 15, 0, 5, 3, 3] }] });

const MTQ_ORG = 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội';
const MTQ_NOTE = 'kỳ báo cáo là năm, so với năm liền trước. Số ước tính theo quy mô của Thành phố, chờ đơn vị cung cấp số chính thức.';

/* ---------- Ban Dân chủ, Giám sát và Phản biện xã hội ---------- */
ctmMake({
  id: 'mttq-danchu-giamsat', role: 'MTTQ', per: 'nam', name: 'Ban Dân chủ, Giám sát và Phản biện xã hội', short: 'Ban Dân chủ, Giám sát', org: MTQ_ORG,
  m: {
    dtTn: ['Đơn thư tiếp nhận', 'đơn', 0, [12460, 11820, 10940, 10380, 9760], 0, 'n'],
    dtR: ['Đơn thư đã xử lý, chuyển cơ quan có thẩm quyền', '%', 1, [95.3, 94.1, 92.8, 91.6, 90.2], 0, '', 'Đã xử lý, chuyển'],
    dtXl: { l: 'Đơn thư đã xử lý, chuyển', short: 'Đã xử lý, chuyển', u: 'đơn', f: (D) => D.dtTn * D.dtR / 100 },
    tcd: ['Lượt tiếp công dân', 'lượt', 0, 4860, 3, 'n'],
    gs: ['Cuộc giám sát của MTTQ các cấp', 'cuộc', 0, [2240, 2080, 1960, 1840, 1520], 0, '', 'Cuộc giám sát'],
    gsKn: ['Kiến nghị sau giám sát', 'kiến nghị', 0, 3860, 5, 'n'],
    gsTt: ['Kiến nghị sau giám sát được tiếp thu, giải quyết', '%', 1, [86.4, 84.9, 83.1, 81.7, 80.2], 0, '', 'Được tiếp thu, giải quyết'],
    pb: ['Hội nghị phản biện xã hội', 'hội nghị', 0, [386, 342, 318, 296, 254], 0, '', 'Hội nghị phản biện'],
    pbGy: ['Văn bản góp ý dự thảo', 'văn bản', 0, [1240, 1060, 980, 910, 820], 0, '', 'Góp ý dự thảo văn bản'],
    pbTt: ['Ý kiến phản biện được tiếp thu', '%', 1, [78.6, 76.8, 75.2, 73.4, 71.9]]
  },
  kpis: [['dtTn', 'trong năm'], ['dtR', 'trên đơn thư tiếp nhận'], ['tcd', 'trong năm'], ['gs', 'trong năm'], ['gsTt', 'trên kiến nghị sau giám sát'], ['pb', 'trong năm'], ['pbGy', 'trong năm'], ['pbTt', 'trên ý kiến phản biện']],
  card: ['dtTn', 'gs', 'pb', 'gsTt'],
  groups: [
    { id: 'dt', label: 'Đơn thư, tiếp công dân', note: 'Tiếp nhận, xử lý đơn thư; tiếp công dân', lines: ['dtTn', 'dtXl', 'tcd', 'dtR'], top: 'dt' },
    { id: 'gs', label: 'Giám sát', note: 'Giám sát của MTTQ các cấp và kết quả tiếp thu kiến nghị', lines: ['gs', 'gsKn', 'gsTt'], top: 'gs' },
    { id: 'pb', label: 'Phản biện xã hội', note: 'Hội nghị phản biện, góp ý dự thảo văn bản', lines: ['pbGy', 'pb', 'pbTt'] }
  ],
  xa: [
    { id: 'dt', l: 'Đơn thư tiếp nhận', u: 'đơn', from: 'dtTn', k: 0.7, w: 'pop', better: 'none' },
    { id: 'gs', l: 'Cuộc giám sát của Mặt trận cấp xã', u: 'cuộc', from: 'gs', k: 0.86, w: 'const' },
    { id: 'gsTt', l: 'Kiến nghị sau giám sát được tiếp thu', u: '%', d: 1, rate: 'gsTt', spread: 10 }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Công tác Dân tộc, Tôn giáo và Hội quần chúng (phản ánh, kiến nghị trên Hệ thống iHanoi từ 2023) ---------- */
ctmMake({
  id: 'mttq-dantoc-tongiao', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Dân tộc, Tôn giáo và Hội quần chúng', short: 'Ban Dân tộc, Tôn giáo', org: MTQ_ORG,
  m: {
    ph: ['Phản ánh, kiến nghị tiếp nhận trên iHanoi', 'phản ánh', 0, [96400, 71800, 38600, null, null], 0, 'n', 'Phản ánh tiếp nhận'],
    phR: ['Phản ánh đã xử lý xong', '%', 1, [95.8, 93.6, 89.2, null, null]],
    phXl: { l: 'Phản ánh đã xử lý xong', short: 'Đã xử lý xong', u: 'phản ánh', f: (D) => (D.ph == null ? null : D.ph * D.phR / 100) },
    dgR: ['Phản ánh được người dân đánh giá sau xử lý', '%', 1, [41.3, 36.8, 29.4, null, null], 0, '', 'Được đánh giá sau xử lý'],
    hl: ['Rất hài lòng, hài lòng', '%', 1, [82.6, 79.4, 74.1, null, null]],
    dgN: { l: 'Lượt đánh giá sau xử lý', short: 'Lượt đánh giá', u: 'lượt', f: (D) => (D.ph == null ? null : D.ph * D.phR / 100 * D.dgR / 100) },
    rhl: { l: 'Rất hài lòng', u: 'lượt', f: (D) => (D.dgN == null ? null : D.dgN * D.hl / 100 * 0.54) },
    hlv: { l: 'Hài lòng', u: 'lượt', f: (D) => (D.dgN == null ? null : D.dgN * D.hl / 100 - D.rhl) },
    bt: { l: 'Bình thường', u: 'lượt', f: (D) => (D.dgN == null ? null : D.dgN * (100 - D.hl) / 100 * 0.56) },
    khl: { l: 'Không hài lòng, rất không hài lòng', u: 'lượt', inv: true, f: (D) => (D.dgN == null ? null : D.dgN * (100 - D.hl) / 100 - D.bt) },
    tg: ['Cơ sở thờ tự của các tôn giáo', 'cơ sở', 0, [3216, 3209, 3201, 3196, 3190], 0, 'n'],
    cs: ['Chức sắc, chức việc tôn giáo', 'người', 0, 4860, 0.8, 'n'],
    hdTg: ['Sự kiện, lễ hội tôn giáo được nắm tình hình, hướng dẫn', 'sự kiện', 0, 1420, 3, 'n', 'Sự kiện tôn giáo được hướng dẫn'],
    hq: ['Hội quần chúng là thành viên Ủy ban MTTQ Thành phố', 'hội', 0, [24, 24, 23, 23, 22], 0, 'n', 'Hội quần chúng thành viên']
  },
  kpis: [['ph', 'trong năm'], ['phR', 'trên phản ánh tiếp nhận'], ['dgR', 'trên phản ánh đã xử lý'], ['hl', 'trên lượt đánh giá'], ['tg', 'cơ sở'], ['cs', 'người'], ['hdTg', 'trong năm'], ['hq', 'hội']],
  card: ['ph', 'phR', 'hl', 'tg'],
  groups: [
    { id: 'ph', label: 'Phản ánh trên iHanoi', note: 'Phản ánh, kiến nghị của người dân trên Hệ thống iHanoi và kết quả xử lý', lines: ['ph', 'phXl', 'phR'], top: 'ph' },
    { id: 'dg', label: 'Đánh giá sau xử lý', note: 'Mức độ hài lòng của người dân sau xử lý phản ánh', lines: ['dgN', 'dgR', 'hl'], parts: ['dgN', ['rhl', 'hlv', 'bt', 'khl'], 'Mức độ hài lòng'] },
    { id: 'tg', label: 'Dân tộc, tôn giáo', note: 'Cơ sở thờ tự, chức sắc và hoạt động tôn giáo', lines: ['tg', 'cs', 'hdTg'] },
    { id: 'hq', label: 'Hội quần chúng', note: 'Hội quần chúng là thành viên Ủy ban MTTQ Thành phố', lines: ['hq'] }
  ],
  xa: [
    { id: 'ph', l: 'Phản ánh trên iHanoi', u: 'phản ánh', from: 'ph', w: 'pho', better: 'none' },
    /* phản ánh của người dân: cùng cơ số 10.000 dân với phản ánh đô thị cấp xã (quy tắc H6) */
    { id: 'phpc', l: 'Phản ánh trên 10.000 dân', u: 'phản ánh', d: 1, per: ['ph', 'ds', 10000], better: 'none' },
    { id: 'hl', l: 'Rất hài lòng, hài lòng', u: '%', d: 1, rate: 'hl', spread: 12 }
  ],
  note: 'kỳ báo cáo là năm, so với năm liền trước. Hệ thống iHanoi tiếp nhận phản ánh từ năm 2023 nên các năm trước để trống. Số phản ánh tăng hay giảm để màu trung tính.'
});

/* ---------- Ban Công tác Phụ nữ ---------- */
ctmMake({
  id: 'mttq-cong-tac-phu-nu', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Phụ nữ', short: 'Ban Công tác Phụ nữ', org: MTQ_ORG,
  m: {
    a1: ['Hoạt động “Phụ nữ Thủ đô ứng xử đẹp”', 'cuộc', 0, 1264, 6], a2: ['Hoạt động Dự án 8 (bình đẳng giới, phụ nữ và trẻ em)', 'cuộc', 0, 486, 9, '', 'Hoạt động Dự án 8'], a3: ['Hoạt động thực hiện Đề án 938', 'cuộc', 0, 712, 5],
    hd: { l: 'Hoạt động xây dựng người phụ nữ Thủ đô', short: 'Hoạt động xây dựng phụ nữ Thủ đô', u: 'cuộc', sum: ['a1', 'a2', 'a3'] },
    lt: ['Lượt hội viên, phụ nữ tham gia', 'lượt', 0, 186400, 7],
    th: ['Lớp tập huấn, bồi dưỡng cán bộ Hội', 'lớp', 0, 342, 4], thL: ['Lượt cán bộ được tập huấn, bồi dưỡng', 'lượt', 0, 18600, 5, '', 'Lượt cán bộ được tập huấn'],
    k1: ['Chương trình hỗ trợ phụ nữ', 'tỷ đồng', 1, 52, 6, 'n'], k2: ['Chương trình hỗ trợ trẻ em', 'tỷ đồng', 1, 38, 5, 'n'], k3: ['Hoạt động an sinh xã hội', 'tỷ đồng', 1, 44, 6, 'n'],
    kp: { l: 'Kinh phí hỗ trợ phụ nữ và trẻ em', short: 'Kinh phí hỗ trợ', u: 'tỷ đồng', d: 1, neutral: true, sum: ['k1', 'k2', 'k3'] },
    utNg: ['Hộ vay vốn ủy thác qua Hội', 'hộ', 0, 38650, 2], utDn: ['Dư nợ vốn ủy thác', 'tỷ đồng', 0, 4218, 6, 'n'],
    bdg: ['Hoạt động vận động bình đẳng giới', 'cuộc', 0, 520, 6]
  },
  kpis: [['hd', 'trong năm'], ['lt', 'trong năm'], ['thL', 'trong năm'], ['kp', 'trong năm'], ['utNg', 'đang vay'], ['utDn', 'cuối năm'], ['bdg', 'trong năm'], ['th', 'trong năm']],
  card: ['hd', 'lt', 'kp', 'utDn'],
  groups: [
    { id: 'hd', label: 'Xây dựng người phụ nữ Thủ đô', note: 'Hoạt động theo phong trào, dự án, đề án', lines: ['hd', 'a1', 'a2', 'a3', 'lt'], table: ['hd', ['a1', 'a2', 'a3'], 'Hoạt động theo chương trình', 'Chương trình'] },
    { id: 'th', label: 'Tập huấn, bồi dưỡng', note: 'Tập huấn, bồi dưỡng cán bộ Hội, ứng dụng công nghệ thông tin', lines: ['thL', 'th'] },
    { id: 'kp', label: 'Kinh phí hỗ trợ', note: 'Kinh phí các chương trình hỗ trợ phụ nữ, trẻ em, an sinh', lines: ['kp', 'k1', 'k2', 'k3'], parts: ['kp', ['k1', 'k2', 'k3'], 'Kinh phí theo chương trình'] },
    { id: 'ut', label: 'Vốn ủy thác', note: 'Vốn vay ủy thác qua Hội; vận động bình đẳng giới', lines: ['utDn', 'utNg', 'bdg'], top: 'ut' }
  ],
  xa: [
    { id: 'ut', l: 'Hộ vay vốn ủy thác qua Hội', u: 'hộ', from: 'utNg', w: 'xa' },
    { id: 'utpc', l: 'Hộ vay vốn trên 1.000 hộ', u: 'hộ', d: 1, per: ['ut', 'ho', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Công tác Công đoàn ---------- */
ctmMake({
  id: 'mttq-cong-tac-cong-doan', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Công đoàn', short: 'Ban Công tác Công đoàn', org: MTQ_ORG,
  m: {
    h1: ['Hỗ trợ từ công đoàn xã, phường, khu công nghiệp', 'tỷ đồng', 1, 24.6, 8, 'n', 'Công đoàn xã, phường, khu công nghiệp'], h2: ['Hỗ trợ từ công đoàn cơ sở', 'tỷ đồng', 1, 34.0, 7, 'n'],
    hT: { l: 'Kinh phí hỗ trợ đoàn viên, người lao động', short: 'Kinh phí hỗ trợ', u: 'tỷ đồng', d: 1, neutral: true, sum: ['h1', 'h2'] },
    hL: ['Lượt đoàn viên, người lao động được hỗ trợ', 'lượt', 0, 64800, 6, '', 'Lượt được hỗ trợ'],
    c1: ['Doanh nghiệp có thỏa ước lao động tập thể tiên tiến', '%', 1, 70.3, 1.5, '', 'Thỏa ước lao động tập thể tiên tiến'],
    c2: ['Đơn vị thực hiện quy chế dân chủ ở cơ sở', '%', 1, 94.8, 0.6, '', 'Thực hiện quy chế dân chủ'],
    c3: ['Doanh nghiệp tăng giá trị bữa ăn ca', '%', 1, 61.2, 2.1, '', 'Tăng giá trị bữa ăn ca'],
    c4: ['Đơn vị tổ chức hội nghị người lao động', '%', 1, 88.6, 0.9, '', 'Tổ chức hội nghị người lao động'],
    tnV: ['Vụ tai nạn lao động', 'vụ', 0, [142, 151, 163, 170, 158], 0, 'i'],
    tnCh: ['Người chết do tai nạn lao động', 'người', 0, [38, 41, 44, 47, 45], 0, 'i'],
    tnTn: ['Người bị thương nặng do tai nạn lao động', 'người', 0, [96, 104, 112, 118, 109], 0, 'i', 'Người bị thương nặng']
  },
  kpis: [['hT', 'trong năm'], ['hL', 'trong năm'], ['c1', 'trên doanh nghiệp có công đoàn'], ['c2', 'trên đơn vị'], ['c3', 'trên doanh nghiệp có công đoàn'], ['c4', 'trên đơn vị'], ['tnV', 'trong năm'], ['tnCh', 'trong năm']],
  card: ['hT', 'hL', 'c1', 'tnV'],
  groups: [
    { id: 'cl', label: 'Chăm lo đoàn viên', note: 'Hỗ trợ đoàn viên, người lao động trong Tháng Công nhân và các dịp khác', lines: ['hT', 'h1', 'h2', 'hL'], parts: ['hT', ['h1', 'h2'], 'Kinh phí hỗ trợ theo nguồn'] },
    { id: 'ct', label: 'Chỉ tiêu Công đoàn', note: 'Kết quả thực hiện các chỉ tiêu Công đoàn', lines: ['c1', 'c2', 'c3', 'c4'] },
    { id: 'tn', label: 'An toàn lao động', note: 'Tai nạn lao động tại các đơn vị có công đoàn', lines: ['tnV', 'tnCh', 'tnTn'], top: 'tn' }
  ],
  xa: [
    { id: 'tn', l: 'Vụ tai nạn lao động', u: 'vụ', from: 'tnV', w: 'pho', better: 'low' },
    { id: 'tnpc', l: 'Vụ tai nạn lao động trên 100.000 dân', u: 'vụ', d: 1, per: ['tn', 'ds', 100000], better: 'low' }
  ],
  note: MTQ_NOTE + ' Tai nạn lao động giảm hiển thị màu xanh.'
});

/* ---------- Ban Công tác Cựu chiến binh ---------- */
ctmMake({
  id: 'mttq-cuu-chien-binh', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Cựu chiến binh', short: 'Ban Công tác Cựu chiến binh', org: MTQ_ORG,
  m: {
    hv: ['Hội viên Cựu chiến binh', 'hội viên', 0, 231600, 0.6, 'n'], ch: ['Chi hội Cựu chiến binh', 'chi hội', 0, 3120, 0.5, 'n', 'Chi hội'],
    t1: ['Buổi sinh hoạt thời sự', 'buổi', 0, 1840, 3], t2: ['Buổi học tập chỉ thị, nghị quyết', 'buổi', 0, 1260, 3], t3: ['Buổi văn nghệ, thể thao', 'buổi', 0, 860, 4],
    tT: { l: 'Buổi sinh hoạt tuyên giáo', short: 'Buổi sinh hoạt tuyên giáo', u: 'buổi', sum: ['t1', 't2', 't3'] },
    s1: ['Thăm hỏi, phúng viếng, mừng thọ', 'tỷ đồng', 1, 18.6, 5, 'n'], s2: ['Trợ cấp khó khăn', 'tỷ đồng', 1, 7.4, 4, 'n'], s3: ['Khám bệnh, cấp thuốc miễn phí', 'tỷ đồng', 1, 5.2, 6, 'n'],
    sT: { l: 'Kinh phí chính sách, hậu phương', short: 'Kinh phí chính sách, hậu phương', u: 'tỷ đồng', d: 1, neutral: true, sum: ['s1', 's2', 's3'] },
    d1: ['Lượt tham gia tiếp xúc cử tri', 'lượt', 0, 12400, 3, '', 'Tiếp xúc cử tri'], d2: ['Lượt tham gia phản biện xã hội', 'lượt', 0, 4860, 5, '', 'Phản biện xã hội'],
    d3: ['Lượt tham gia đối thoại', 'lượt', 0, 3960, 4, '', 'Đối thoại'], d4: ['Lượt vận động giải phóng mặt bằng', 'lượt', 0, 2840, 6, '', 'Vận động giải phóng mặt bằng']
  },
  kpis: [['hv', 'hội viên'], ['ch', 'chi hội'], ['tT', 'trong năm'], ['sT', 'trong năm'], ['s2', 'trong năm'], ['d1', 'trong năm'], ['d2', 'trong năm'], ['d4', 'trong năm']],
  card: ['hv', 'tT', 'sT', 'd1'],
  groups: [
    { id: 'tc', label: 'Tổ chức Hội', note: 'Hội viên, chi hội Cựu chiến binh', lines: ['hv', 'ch'], top: 'hv' },
    { id: 'tg', label: 'Tuyên giáo', note: 'Sinh hoạt thời sự, học tập nghị quyết, văn nghệ thể thao', lines: ['tT', 't1', 't2', 't3'], table: ['tT', ['t1', 't2', 't3'], 'Buổi sinh hoạt theo nội dung', 'Nội dung'] },
    { id: 'cs', label: 'Chính sách, hậu phương', note: 'Thăm hỏi, trợ cấp, khám bệnh cho hội viên', lines: ['sT', 's1', 's2', 's3'], parts: ['sT', ['s1', 's2', 's3'], 'Kinh phí theo nội dung'] },
    { id: 'td', label: 'Tiếp xúc, đối thoại', note: 'Hội viên tham gia tiếp xúc cử tri, phản biện, đối thoại, giải phóng mặt bằng', lines: ['d1', 'd2', 'd3', 'd4'] }
  ],
  xa: [
    { id: 'hv', l: 'Hội viên Cựu chiến binh', u: 'hội viên', from: 'hv', w: 'pop' },
    { id: 'hvpc', l: 'Hội viên trên 1.000 dân', u: 'hội viên', d: 1, per: ['hv', 'ds', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Công tác Đoàn và Thanh thiếu nhi ---------- */
ctmMake({
  id: 'mttq-doan-thanh-thieu-nhi', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Đoàn và Thanh thiếu nhi', short: 'Ban Đoàn và Thanh thiếu nhi', org: MTQ_ORG,
  m: {
    a1: ['Hoạt động tình nguyện vì cộng đồng', 'hoạt động', 0, 4260, 5], a2: ['Hoạt động tuyên truyền pháp luật', 'hoạt động', 0, 3640, 4], a3: ['Sinh hoạt hè, kỹ năng sống', 'hoạt động', 0, 2860, 6],
    hT: { l: 'Hoạt động Đoàn, phong trào thanh thiếu nhi', short: 'Hoạt động, phong trào', u: 'hoạt động', sum: ['a1', 'a2', 'a3'] },
    l1: ['Lượt đoàn viên tham gia', 'lượt', 0, 384000, 4], l2: ['Lượt thanh thiếu nhi tham gia', 'lượt', 0, 226000, 5],
    lT: { l: 'Lượt tham gia các hoạt động', short: 'Lượt tham gia', u: 'lượt', sum: ['l1', 'l2'] }
  },
  kpis: [['hT', 'trong năm'], ['a1', 'trong năm'], ['a2', 'trong năm'], ['a3', 'trong năm'], ['lT', 'trong năm'], ['l1', 'trong năm'], ['l2', 'trong năm']],
  card: ['hT', 'a1', 'lT'],
  groups: [
    { id: 'hd', label: 'Hoạt động, phong trào', note: 'Hoạt động Đoàn và phong trào thanh thiếu nhi', lines: ['hT', 'a1', 'a2', 'a3'], parts: ['hT', ['a1', 'a2', 'a3'], 'Hoạt động theo loại'], top: 'hd' },
    { id: 'lt', label: 'Lượt tham gia', note: 'Đoàn viên, thanh thiếu nhi tham gia hoạt động', lines: ['lT', 'l1', 'l2'], parts: ['lT', ['l1', 'l2'], 'Lượt tham gia theo đối tượng'] }
  ],
  xa: [
    { id: 'hd', l: 'Hoạt động Đoàn, phong trào', u: 'hoạt động', from: 'hT', k: 0.8, w: 'pop' },
    { id: 'hdpc', l: 'Hoạt động trên 10.000 dân', u: 'hoạt động', d: 1, per: ['hd', 'ds', 10000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Công tác Nông dân ---------- */
ctmMake({
  id: 'mttq-cong-tac-nong-dan', role: 'MTTQ', per: 'nam', name: 'Ban Công tác Nông dân', short: 'Ban Công tác Nông dân', org: MTQ_ORG,
  m: {
    s1: ['Hộ sản xuất, kinh doanh giỏi cấp Trung ương', 'hộ', 0, 124, 4, '', 'Cấp Trung ương'], s2: ['Hộ sản xuất, kinh doanh giỏi cấp Thành phố', 'hộ', 0, 1860, 3, '', 'Cấp Thành phố'], s3: ['Hộ sản xuất, kinh doanh giỏi cấp cơ sở', 'hộ', 0, 66400, 2, '', 'Cấp cơ sở'],
    sT: { l: 'Hộ sản xuất, kinh doanh giỏi các cấp', short: 'Hộ sản xuất, kinh doanh giỏi', u: 'hộ', sum: ['s1', 's2', 's3'] },
    /* số lẻ theo độ lớn (quy tắc H4): tổng từ 1.000 tỷ trở lên, các phần cùng thẻ dùng chung — không số lẻ */
    q1: ['Vốn Quỹ Hỗ trợ nông dân', 'tỷ đồng', 0, 286, 5], q2: ['Vốn ủy thác ngân hàng chính sách xã hội', 'tỷ đồng', 0, 1642, 6, '', 'Vốn ủy thác ngân hàng'],
    qT: { l: 'Vốn hỗ trợ hội viên', short: 'Vốn hỗ trợ hội viên', u: 'tỷ đồng', d: 0, sum: ['q1', 'q2'] },
    qH: ['Hộ hội viên được vay vốn', 'hộ', 0, 41200, 3],
    m1: ['Tổ hợp tác do Hội hỗ trợ', 'tổ', 0, 186, 4], m2: ['Hợp tác xã nông nghiệp do Hội hỗ trợ', 'hợp tác xã', 0, 64, 3]
  },
  kpis: [['sT', 'các cấp, trong năm'], ['s2', 'trong năm'], ['qT', 'dư nợ cuối năm'], ['q1', 'cuối năm'], ['qH', 'đang vay'], ['m1', 'tổ hợp tác'], ['m2', 'hợp tác xã']],
  card: ['sT', 'qT', 'qH'],
  groups: [
    { id: 'sx', label: 'Sản xuất, kinh doanh giỏi', note: 'Phong trào nông dân sản xuất, kinh doanh giỏi', lines: ['sT', 's1', 's2', 's3'], table: ['sT', ['s1', 's2', 's3'], 'Hộ sản xuất, kinh doanh giỏi theo cấp', 'Cấp'], top: 'sx' },
    { id: 'von', label: 'Vốn hỗ trợ', note: 'Quỹ Hỗ trợ nông dân, vốn ủy thác', lines: ['qT', 'q1', 'q2', 'qH'], parts: ['qT', ['q1', 'q2'], 'Vốn theo nguồn'] },
    { id: 'kt', label: 'Kinh tế tập thể', note: 'Tổ hợp tác, hợp tác xã do Hội hỗ trợ', lines: ['m1', 'm2'] }
  ],
  xa: [
    { id: 'sx', l: 'Hộ sản xuất, kinh doanh giỏi cấp cơ sở', u: 'hộ', from: 's3', w: 'xa' },
    { id: 'sxpc', l: 'Hộ sản xuất, kinh doanh giỏi trên 1.000 hộ', u: 'hộ', d: 1, per: ['sx', 'ho', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Thường trực ---------- */
ctmMake({
  id: 'mttq-thuong-truc', role: 'MTTQ', per: 'nam', name: 'Ban Thường trực', short: 'Ban Thường trực', org: MTQ_ORG,
  m: {
    hnTp: ['Hội nghị Ủy ban, Ban Thường trực cấp Thành phố', 'hội nghị', 0, [14, 12, 11, 11, 10], 0, 'n', 'Cấp Thành phố'],
    hnXa: ['Hội nghị Ủy ban MTTQ cấp xã', 'hội nghị', 0, [1260, 2140, 2080, 2060, 2310], 0, 'n', 'Cấp xã'],
    ctHt: ['Nội dung chương trình phối hợp hoàn thành', 'nội dung', 0, [34, 31, 30, 28, 26], 0, '', 'Đã hoàn thành'],
    ctDt: ['Nội dung chương trình phối hợp đang triển khai', 'nội dung', 0, [9, 10, 9, 10, 11], 0, 'n', 'Đang triển khai'],
    ctR: { l: 'Nội dung chương trình phối hợp đã hoàn thành', short: 'Tỷ lệ hoàn thành', u: '%', d: 1, f: (D) => D.ctHt / (D.ctHt + D.ctDt) * 100 },
    ht: ['Hội nghị hiệp thương', 'hội nghị', 0, [22, 8, 6, 6, 18], 0, 'n'],
    tv: ['Tổ chức thành viên Ủy ban MTTQ Thành phố', 'tổ chức', 0, [52, 52, 51, 51, 50], 0, 'n', 'Tổ chức thành viên']
  },
  kpis: [['hnTp', 'trong năm'], ['hnXa', 'trong năm'], ['ctHt', 'trong năm'], ['ctR', 'trên nội dung chương trình'], ['ht', 'trong năm'], ['tv', 'tổ chức']],
  card: ['hnTp', 'ctHt', 'ctR'],
  groups: [
    { id: 'hn', label: 'Hội nghị', note: 'Hội nghị Ủy ban, Ban Thường trực các cấp', lines: ['hnXa', 'hnTp'], hint: () => 'Từ 01/7/2025 cấp xã còn 126 đơn vị nên số hội nghị cấp xã giảm so với các năm trước.' },
    { id: 'ct', label: 'Chương trình phối hợp', note: 'Chương trình phối hợp và thống nhất hành động', lines: ['ctHt', 'ctDt', 'ctR'] },
    { id: 'ht', label: 'Hiệp thương, thành viên', note: 'Hội nghị hiệp thương; tổ chức thành viên', lines: ['ht', 'tv'], hint: () => 'Hội nghị hiệp thương tăng vào các năm chuẩn bị bầu cử (2021 và 2025–2026).' }
  ],
  note: MTQ_NOTE
});

/* ---------- Ban Tổ chức, kiểm tra ---------- */
ctmMake({
  id: 'mttq-to-chuc-kiem-tra', role: 'MTTQ', per: 'nam', name: 'Ban Tổ chức, kiểm tra', short: 'Ban Tổ chức, kiểm tra', org: MTQ_ORG,
  m: {
    bc: ['Biên chế', 'người', 0, 186, 0, 'n'], hd: ['Hợp đồng', 'người', 0, 42, 0, 'n'],
    cb: { l: 'Cán bộ, công chức cơ quan Ủy ban MTTQ Thành phố', short: 'Cán bộ, công chức', u: 'người', neutral: true, sum: ['bc', 'hd'] },
    kt: ['Cuộc kiểm tra nội bộ', 'cuộc', 0, 14, 3], gs: ['Cuộc giám sát chuyên đề', 'cuộc', 0, 9, 4],
    dt: ['Lượt cán bộ được đào tạo, bồi dưỡng', 'lượt', 0, 1860, 5]
  },
  kpis: [['cb', 'biên chế và hợp đồng'], ['bc', 'người'], ['kt', 'trong năm'], ['gs', 'trong năm'], ['dt', 'trong năm']],
  card: ['cb', 'kt', 'dt'],
  groups: [
    { id: 'cb', label: 'Cán bộ', note: 'Cán bộ, công chức cơ quan Ủy ban MTTQ Thành phố', lines: ['cb', 'bc', 'hd'], parts: ['cb', ['bc', 'hd'], 'Cơ cấu cán bộ'] },
    { id: 'kt', label: 'Kiểm tra, giám sát', note: 'Kiểm tra nội bộ, giám sát chuyên đề', lines: ['kt', 'gs'] },
    { id: 'dt', label: 'Đào tạo, bồi dưỡng', note: 'Đào tạo, bồi dưỡng cán bộ Mặt trận', lines: ['dt'] }
  ],
  note: MTQ_NOTE
});

/* ---------- Hội Liên hiệp phụ nữ thành phố ---------- */
ctmMake({
  id: 'mttq-hoi-lhpn', role: 'MTTQ', per: 'nam', name: 'Hội Liên hiệp phụ nữ thành phố', short: 'Hội Liên hiệp phụ nữ', org: MTQ_ORG,
  m: {
    hv: ['Hội viên phụ nữ', 'hội viên', 0, 1026000, 1.2], kn: ['Hội viên mới kết nạp', 'hội viên', 0, 18400, 3], ch: ['Chi hội phụ nữ', 'chi hội', 0, 4860, 0.4, 'n'],
    gd: ['Gia đình văn hóa tiêu biểu được biểu dương', 'gia đình', 0, 1240, 4, '', 'Gia đình văn hóa tiêu biểu'], dh: ['Phụ nữ điển hình tiên tiến', 'người', 0, 360, 5],
    ht: ['Phụ nữ nghèo, có hoàn cảnh khó khăn được hỗ trợ', 'người', 0, 12600, 4, '', 'Phụ nữ khó khăn được hỗ trợ']
  },
  kpis: [['hv', 'hội viên'], ['kn', 'trong năm'], ['ch', 'chi hội'], ['gd', 'trong năm'], ['dh', 'trong năm'], ['ht', 'trong năm']],
  card: ['hv', 'kn', 'ht'],
  groups: [
    { id: 'hv', label: 'Tổ chức Hội', note: 'Hội viên, chi hội phụ nữ', lines: ['hv', 'kn', 'ch'], top: 'hv' },
    { id: 'td', label: 'Thi đua “Phụ nữ Thủ đô”', note: 'Gia đình văn hóa tiêu biểu, phụ nữ điển hình', lines: ['gd', 'dh'] },
    { id: 'ht', label: 'Hỗ trợ phụ nữ', note: 'Hỗ trợ phụ nữ nghèo, có hoàn cảnh khó khăn', lines: ['ht'] }
  ],
  xa: [
    { id: 'hv', l: 'Hội viên phụ nữ', u: 'hội viên', from: 'hv', w: 'pop' },
    { id: 'hvpc', l: 'Hội viên trên 1.000 dân', u: 'hội viên', d: 1, per: ['hv', 'ds', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Hội Nông dân thành phố ---------- */
ctmMake({
  id: 'mttq-hoi-nong-dan-tp', role: 'MTTQ', per: 'nam', name: 'Hội Nông dân thành phố', short: 'Hội Nông dân', org: MTQ_ORG,
  m: {
    hv: ['Hội viên nông dân', 'hội viên', 0, 386200, -0.6, 'n'], kn: ['Hội viên mới kết nạp', 'hội viên', 0, 3200, 2],
    sx: ['Hộ sản xuất, kinh doanh giỏi', 'hộ', 0, 68400, 2], m1: ['Tổ hợp tác', 'tổ', 0, 186, 4], m2: ['Hợp tác xã nông nghiệp', 'hợp tác xã', 0, 64, 3]
  },
  kpis: [['hv', 'hội viên'], ['kn', 'trong năm'], ['sx', 'các cấp'], ['m1', 'do Hội hỗ trợ'], ['m2', 'do Hội hỗ trợ']],
  card: ['hv', 'sx', 'm1'],
  groups: [
    { id: 'hv', label: 'Tổ chức Hội', note: 'Hội viên nông dân; giảm dần theo quá trình đô thị hóa', lines: ['hv', 'kn'], top: 'hv' },
    { id: 'sx', label: 'Phong trào, kinh tế tập thể', note: 'Sản xuất, kinh doanh giỏi; tổ hợp tác, hợp tác xã', lines: ['sx', 'm1', 'm2'] }
  ],
  xa: [
    { id: 'hv', l: 'Hội viên nông dân', u: 'hội viên', from: 'hv', w: 'xa' },
    { id: 'hvpc', l: 'Hội viên trên 1.000 dân', u: 'hội viên', d: 1, per: ['hv', 'ds', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Liên đoàn lao động thành phố (số công bố: trên 580.000 đoàn viên, Đại hội Công đoàn Thành phố lần thứ XVIII, 12/2025) ---------- */
ctmMake({
  id: 'mttq-lien-doan-lao-dong', role: 'MTTQ', per: 'nam', name: 'Liên đoàn lao động thành phố', short: 'Liên đoàn lao động', org: MTQ_ORG,
  m: {
    dv: ['Đoàn viên công đoàn', 'đoàn viên', 0, [581400, 568200, 552600, 541300, 529800]], dvM: ['Đoàn viên kết nạp mới', 'đoàn viên', 0, 32600, 3],
    cs: ['Công đoàn cơ sở', 'đơn vị', 0, 8940, 1.2], csM: ['Công đoàn cơ sở thành lập mới', 'đơn vị', 0, 186, 2],
    k1: ['Nguồn Liên đoàn lao động thành phố', 'tỷ đồng', 1, 18.6, 6, 'n'], k2: ['Nguồn công đoàn cơ sở', 'tỷ đồng', 1, 22.4, 6, 'n'],
    kp: { l: 'Kinh phí chăm lo Tháng Công nhân', short: 'Kinh phí chăm lo Tháng Công nhân', u: 'tỷ đồng', d: 1, neutral: true, sum: ['k1', 'k2'] },
    tet: ['Suất quà Tết cho người lao động khó khăn', 'suất', 0, 15000, 2, 'n'],
    tu: ['Doanh nghiệp có thỏa ước lao động tập thể', 'doanh nghiệp', 0, 4280, 3, '', 'Doanh nghiệp có thỏa ước lao động']
  },
  kpis: [['dv', 'cuối năm'], ['dvM', 'trong năm'], ['cs', 'cuối năm'], ['csM', 'trong năm'], ['kp', 'trong năm'], ['tet', 'trong năm'], ['tu', 'cuối năm']],
  card: ['dv', 'cs', 'kp'],
  groups: [
    { id: 'tc', label: 'Đoàn viên, công đoàn cơ sở', note: 'Phát triển đoàn viên, thành lập công đoàn cơ sở', lines: ['dv', 'dvM', 'cs', 'csM'], top: 'cs' },
    { id: 'cl', label: 'Chăm lo người lao động', note: 'Tháng Công nhân, quà Tết cho người lao động khó khăn', lines: ['kp', 'k1', 'k2', 'tet'], parts: ['kp', ['k1', 'k2'], 'Kinh phí theo nguồn'] },
    { id: 'tu', label: 'Thỏa ước lao động', note: 'Doanh nghiệp có thỏa ước lao động tập thể', lines: ['tu'] }
  ],
  xa: [
    { id: 'cs', l: 'Công đoàn cơ sở', u: 'đơn vị', from: 'cs', w: 'pho' },
    { id: 'dv', l: 'Đoàn viên công đoàn', u: 'đoàn viên', from: 'dv', w: 'pho' },
    { id: 'dvpc', l: 'Đoàn viên trên 1.000 dân', u: 'đoàn viên', d: 1, per: ['dv', 'ds', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- MTTQ Xã, Phường (cơ cấu 126 đơn vị từ 01/7/2025 nên theo quý, để trống 2 quý đầu năm 2025) ---------- */
ctmMake({
  id: 'mttq-xa-phuong', role: 'MTTQ', per: 'quy', name: 'MTTQ Xã, Phường', short: 'MTTQ Xã, Phường', org: MTQ_ORG,
  m: {
    ub: ['Ủy ban MTTQ xã, phường', 'đơn vị', 0, [126, 126, 126, 126, null, null], 0, 'n'],
    ban: ['Ban công tác Mặt trận ở khu dân cư', 'ban', 0, [4410, 4410, 4406, 4398, null, null], 0, 'n', 'Ban công tác Mặt trận'],
    hn: ['Hội nghị Ủy ban MTTQ xã, phường', 'hội nghị', 0, [252, 248, 386, 412, null, null], 0, 'n'],
    gs: ['Cuộc giám sát của Mặt trận cấp xã', 'cuộc', 0, [468, 392, 612, 384, null, null], 0, '', 'Cuộc giám sát'],
    pb: ['Hội nghị phản biện xã hội cấp xã', 'hội nghị', 0, [96, 74, 128, 58, null, null], 0, '', 'Hội nghị phản biện'],
    quy: ['Quỹ “Vì người nghèo” vận động tại cơ sở (lũy kế năm)', 'tỷ đồng', 1, [38.6, 14.2, 92.8, 61.4, null, null], 0, 'k', 'Quỹ “Vì người nghèo” tại cơ sở']
  },
  kpis: [['ub', 'Ủy ban MTTQ cấp xã'], ['ban', 'khu dân cư'], ['hn', 'trong quý'], ['gs', 'trong quý'], ['pb', 'trong quý'], ['quy', 'lũy kế từ đầu năm']],
  card: ['ub', 'gs', 'quy'],
  groups: [
    { id: 'tc', label: 'Tổ chức', note: 'Ủy ban MTTQ xã, phường; Ban công tác Mặt trận ở khu dân cư', lines: ['ub', 'ban', 'hn'] },
    { id: 'gs', label: 'Giám sát, phản biện', note: 'Giám sát, phản biện xã hội của Mặt trận cấp xã', lines: ['gs', 'pb'], top: 'gs' },
    { id: 'quy', label: 'Vận động quỹ', note: 'Quỹ “Vì người nghèo” vận động tại cơ sở', lines: ['quy'], hint: () => 'Năm 2025 Quỹ của 126 xã, phường vận động được 92,8 tỷ đồng (xem chi tiết ở Ban Tuyên giáo và Công tác Xã hội).' }
  ],
  xa: [
    { id: 'gs', l: 'Cuộc giám sát', u: 'cuộc', from: 'gs', w: 'const' },
    { id: 'pb', l: 'Hội nghị phản biện', u: 'hội nghị', from: 'pb', w: 'const' },
    { id: 'ban', l: 'Ban công tác Mặt trận ở khu dân cư', u: 'ban', from: 'ban', w: 'pop' }
  ],
  note: 'kỳ báo cáo là quý, so với quý liền trước. Chính quyền địa phương hai cấp vận hành từ 01/7/2025 nên chỉ có số từ Quý 3/2025. Quỹ “Vì người nghèo” là số lũy kế từ đầu năm.'
});

/* ---------- Thành Đoàn Hà Nội ---------- */
ctmMake({
  id: 'mttq-thanh-doan', role: 'MTTQ', per: 'nam', name: 'Thành Đoàn Hà Nội', short: 'Thành Đoàn', org: MTQ_ORG,
  m: {
    dv: ['Đoàn viên thanh niên', 'đoàn viên', 0, 312400, 0.8], kn: ['Đoàn viên kết nạp mới', 'đoàn viên', 0, 28600, 2], cs: ['Đoàn cơ sở', 'đơn vị', 0, 1260, 0.5, 'n'],
    ct: ['Công trình thanh niên tình nguyện', 'công trình', 0, 186, 4], hm: ['Lượt đoàn viên, thanh niên hiến máu', 'lượt', 0, 64800, 4],
    vl: ['Thanh niên được hỗ trợ việc làm, khởi nghiệp', 'người', 0, 18600, 5, '', 'Hỗ trợ việc làm, khởi nghiệp']
  },
  kpis: [['dv', 'cuối năm'], ['kn', 'trong năm'], ['cs', 'đơn vị'], ['ct', 'trong năm'], ['hm', 'trong năm'], ['vl', 'trong năm']],
  card: ['dv', 'ct', 'hm'],
  groups: [
    { id: 'tc', label: 'Tổ chức Đoàn', note: 'Đoàn viên, đoàn cơ sở', lines: ['dv', 'kn', 'cs'], top: 'dv' },
    { id: 'tn', label: 'Tình nguyện', note: 'Công trình thanh niên, hiến máu tình nguyện', lines: ['hm', 'ct'] },
    { id: 'vl', label: 'Việc làm, khởi nghiệp', note: 'Hỗ trợ thanh niên việc làm, khởi nghiệp', lines: ['vl'] }
  ],
  xa: [
    { id: 'dv', l: 'Đoàn viên thanh niên', u: 'đoàn viên', from: 'dv', w: 'pop' },
    { id: 'dvpc', l: 'Đoàn viên trên 1.000 dân', u: 'đoàn viên', d: 1, per: ['dv', 'ds', 1000] }
  ],
  note: MTQ_NOTE
});

/* ---------- Văn phòng Cơ quan ---------- */
ctmMake({
  id: 'mttq-vp-co-quan', role: 'MTTQ', per: 'nam', name: 'Văn phòng Cơ quan', short: 'Văn phòng Cơ quan', org: MTQ_ORG,
  m: {
    vbDen: ['Văn bản đến', 'văn bản', 0, 2232, 4, 'n'], vbDi: ['Văn bản đi', 'văn bản', 0, 1704, 4, 'n'],
    ctHt: ['Nội dung chương trình công tác hoàn thành', 'nội dung', 0, 96, 3, '', 'Đã hoàn thành'], ctDt: ['Nội dung chương trình công tác đang triển khai', 'nội dung', 0, 24, 0, 'n', 'Đang triển khai'],
    ctR: { l: 'Nội dung chương trình công tác đã hoàn thành', short: 'Tỷ lệ hoàn thành', u: '%', d: 1, f: (D) => D.ctHt / (D.ctHt + D.ctDt) * 100 },
    hn: ['Hội nghị, sự kiện được phục vụ', 'hội nghị', 0, 148, 4, 'n']
  },
  kpis: [['vbDen', 'trong năm'], ['vbDi', 'trong năm'], ['ctHt', 'trong năm'], ['ctR', 'trên chương trình công tác'], ['hn', 'trong năm']],
  card: ['vbDen', 'vbDi', 'ctR'],
  groups: [
    { id: 'vb', label: 'Văn bản', note: 'Văn bản đến, đi của cơ quan', lines: ['vbDen', 'vbDi'] },
    { id: 'ct', label: 'Chương trình công tác', note: 'Kết quả thực hiện chương trình công tác cơ quan', lines: ['ctHt', 'ctDt', 'ctR', 'hn'] }
  ],
  note: MTQ_NOTE
});

/* ---------- Màn ngoài trục MTTQ cấp Thành phố ---------- */
ctmRegisterOverview({
  id: 'mttq-tp', roles: ['MTTQ'], level: 'city', ax: 'MTTQ TP', unitWord: 'đơn vị',
  eyebrow: 'Tổng quan · Ủy ban MTTQ Việt Nam Thành phố',
  title: (n) => 'Số liệu then chốt của ' + n + ' ban, đơn vị',
  hint: 'Mỗi ô ghi rõ đơn vị cung cấp và kỳ số liệu · bấm ô để mở chi tiết của đơn vị',
  short: {
    'mttq-quy': 'Ban Tuyên giáo và CTXH', 'mttq-danchu-giamsat': 'Ban Dân chủ, Giám sát', 'mttq-dantoc-tongiao': 'Ban Dân tộc, Tôn giáo', 'mttq-cong-tac-phu-nu': 'Ban Công tác Phụ nữ',
    'mttq-cong-tac-cong-doan': 'Ban Công tác Công đoàn', 'mttq-cuu-chien-binh': 'Ban Công tác Cựu chiến binh', 'mttq-doan-thanh-thieu-nhi': 'Ban Đoàn và Thanh thiếu nhi',
    'mttq-cong-tac-nong-dan': 'Ban Công tác Nông dân', 'mttq-hoi-lhpn': 'Hội Liên hiệp phụ nữ', 'mttq-hoi-nong-dan-tp': 'Hội Nông dân', 'mttq-lien-doan-lao-dong': 'Liên đoàn lao động', 'mttq-nhiem-vu': 'Theo dõi nhiệm vụ'
  },
  kpis: [
    { cat: 'mttq-quy', m: 'thu', target: 'g:quy' },
    { cat: 'mttq-quy', m: 'nhaN', target: 'g:nha' },
    { cat: 'mttq-quy', m: 'cn', target: 'xa:cn' },
    { cat: 'mttq-quy', m: 'cn0', target: 'xa:cn', u: '/ 126' },
    { cat: 'mttq-quy', m: 'suatTP', target: 'g:tet' },
    { cat: 'mttq-danchu-giamsat', m: 'dtTn', target: 'g:dt' },
    { cat: 'mttq-lien-doan-lao-dong', m: 'dv', target: 'g:tc' },
    { cat: 'mttq-dantoc-tongiao', m: 'hl', target: 'g:dg' }
  ],
  groups: [
    { id: 'ban', label: 'Các Ban chuyên trách', ids: ['mttq-quy', 'mttq-danchu-giamsat', 'mttq-dantoc-tongiao', 'mttq-cong-tac-phu-nu', 'mttq-cong-tac-cong-doan', 'mttq-cuu-chien-binh', 'mttq-doan-thanh-thieu-nhi', 'mttq-cong-tac-nong-dan', 'mttq-thuong-truc', 'mttq-to-chuc-kiem-tra'] },
    { id: 'ctxh', label: 'Tổ chức chính trị – xã hội', ids: ['mttq-hoi-lhpn', 'mttq-hoi-nong-dan-tp', 'mttq-lien-doan-lao-dong', 'mttq-thanh-doan'] },
    { id: 'cs', label: 'Cơ sở và văn phòng', ids: ['mttq-xa-phuong', 'mttq-vp-co-quan', 'mttq-nhiem-vu'] }
  ]
});

/* Kiểu dữ liệu (quy tắc H9): số tại thời điểm so với quý liền trước; còn lại là số phát sinh, so cùng kỳ năm trước */
ctmFlag('mttq-xa-phuong', 'td', ['ub', 'ban']);
/* số tại thời điểm của các ban báo cáo theo năm (hội viên, đoàn viên, cơ sở, cán bộ): biểu đồ qua các năm vẽ đường khi thay đổi ít */
ctmFlag('mttq-dantoc-tongiao', 'td', ['tg', 'hq']);
ctmFlag('mttq-cuu-chien-binh', 'td', ['hv', 'ch']);
ctmFlag('mttq-to-chuc-kiem-tra', 'td', ['bc', 'hd', 'cb']);
ctmFlag('mttq-hoi-lhpn', 'td', ['hv', 'ch']);
ctmFlag('mttq-hoi-nong-dan-tp', 'td', ['hv']);
ctmFlag('mttq-lien-doan-lao-dong', 'td', ['dv']);
ctmFlag('mttq-thanh-doan', 'td', ['dv', 'cs']);