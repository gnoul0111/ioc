/* ============================== 12 SỞ, NGÀNH LÀM THEO EFORM — CHỈ TIÊU KHUÔN MỚI ==============================
   Khai báo cho ctm-engine.js phần chi tiết của 12 sở, ngành có bộ chỉ tiêu theo eform (VHTT, VP UBND, BQL KCNC, Du lịch,
   Dân tộc và Tôn giáo, Thanh tra, KH&CN, NN&MT, Công Thương, Xây dựng, Nội vụ, Y tế). SỐ LIỆU giữ NGUYÊN số và cách tính
   đã chốt ở cấu hình từng sở (js/core/*-config.js: *_SUM, *_DATA, *_UNITS) — cùng số với tài liệu mô tả chỉ tiêu đã gửi —,
   file này chỉ đổi cách trình bày sang khuôn Sở GD&ĐT / TT Phục vụ HCC. Kỳ: kỳ báo cáo của sở; sở nào có số cùng kỳ năm
   trước thì có thêm kỳ "cùng kỳ" để so sánh (chỉ các chỉ tiêu có số cùng kỳ).
   KHUÔN CŨ (drawer catBoxHtml + Chart.js ở dashboard-*.js) KHÔNG xóa: đặt CTM_SO_ENABLED = false là quay về khuôn cũ. */
const CTM_SO_ENABLED = true;

function soPc(a, b) { return a == null || !b ? null : a / b * 100; }
function soSum(a) { return (a || []).reduce((s, v) => s + (Number(v) || 0), 0); }
/* Khai báo một sở:
   ctmSo({ id, name, short, org, ky, ck (nhãn kỳ cùng kỳ, nếu có),
           m: { khóa: [nhãn, đơn vị, số lẻ, () => số kỳ này, () => số cùng kỳ | null, 'i|n', nhãn ngắn] },
           kpis, groups: [{ id, label, note, lines, cards: [thẻ mbars/shares/list/...] }],
           xa: { label, units: () => *_UNITS (có .ten), inds: [{ id, l, u, d, better, tot, f: (đơn vị sở, đơn vị CTM_XA) => số }] }, note }) */
function ctmSo(def) {
  /* def.an: khóa chỉ tiêu KHÔNG HIỆN vì eform không có trường để tính (quy ước 1, phản hồi nhóm triển khai 13/10/2026).
     Khai báo và số vẫn giữ trong def.m / cấu hình sở; bỏ khóa khỏi def.an là hiện lại. */
  const an = (def.an || []).filter(Boolean);
  if (an.length) {
    const keep = (k) => an.indexOf(Array.isArray(k) ? k[0] : k && typeof k === 'object' ? k.m : k) < 0;
    const m = {};
    Object.keys(def.m).forEach((k) => { if (keep(k)) m[k] = def.m[k]; });
    def = Object.assign({}, def, { m: m, kpis: (def.kpis || []).filter(keep), card: def.card && def.card.filter(keep),
      groups: (def.groups || []).map((g) => Object.assign({}, g, { lines: (g.lines || []).filter(keep) })) });
  }
  const periods = [{ id: 'ky', label: def.ky }].concat(def.ck ? [{ id: 'ck', label: def.ck }] : []);
  const metrics = {}, now = {}, ck = {};
  Object.keys(def.m).forEach((k) => {
    const x = def.m[k], fl = x[5] || '';
    metrics[k] = { l: x[0], u: x[1], d: x[2] || 0, short: x[6], inv: fl.indexOf('i') >= 0, neutral: fl.indexOf('n') >= 0, plan: fl.indexOf('p') >= 0, td: fl.indexOf('t') >= 0, month: fl.indexOf('m') >= 0 };
    now[k] = x[3]; ck[k] = x[4];
  });
  const data = (pid) => {
    const D = { _ky: pid === 'ky' };
    Object.keys(metrics).forEach((k) => {
      const f = pid === 'ky' ? now[k] : ck[k];
      let v = null;
      try { v = f == null ? null : typeof f === 'function' ? f() : f; } catch (e) { v = null; }
      D[k] = v == null || !isFinite(v) ? null : Number(v);
    });
    return D;
  };
  const grpOf = (k) => (def.groups || []).find((g) => (g.lines || []).indexOf(k) >= 0);
  const kpis = (def.kpis || []).map((k) => {
    const o = Array.isArray(k) ? { m: k[0], sub: k[1] } : typeof k === 'string' ? { m: k } : Object.assign({}, k);
    if (typeof o.sub === 'string') { const s = o.sub; o.sub = () => s; }
    if (!o.target) { const g = grpOf(o.m); o.target = g ? 'g:' + g.id : ''; }
    return o;
  });
  /* hàng thẻ của nhóm: thẻ so sánh các chỉ tiêu cùng đơn vị (hoặc thẻ tỷ lệ) + các thẻ riêng của nhóm, xếp 2 thẻ một hàng */
  const groups = (def.groups || []).map((g) => {
    const L = g.lines || [], u0 = (metrics[L[0]] || {}).u, cards = [];
    const pct = L.filter((k) => metrics[k] && (metrics[k].u === '%' || metrics[k].u === 'điểm'));
    if (u0 === '%') cards.push({ type: 'rates', t: g.label, items: pct });
    else {
      /* kế hoạch (cờ 'p') không vẽ thành thanh ngang hàng với số thực hiện (quy tắc H13) */
      cards.push({ type: 'cmp', t: g.cmpT || g.label, big: L[0], items: L.filter((k) => metrics[k] && metrics[k].u === u0 && !metrics[k].plan).slice(0, 4), xa: g.xa, hint: g.hint });
      if (pct.length) cards.push({ type: 'rates', t: g.ratesT || 'Tỷ lệ', items: pct });
    }
    (g.cards || []).forEach((c) => cards.push(c));
    const rows = [];
    for (let i = 0; i < cards.length; i += 2) rows.push(cards.slice(i, i + 2));
    return Object.assign({}, g, { rows: rows });
  });
  let xa = null;
  if (def.xa) {
    /* tpm: khóa chỉ tiêu Thành phố — "Mức chung Thành phố" của bảng xã lấy đúng số ô số của sở (quy tắc H20) */
    const inds = def.xa.inds.map((I) => Object.assign({ d: 0, better: 'high' }, I, { v: (r) => r[I.id] }, I.tpm ? { tp: (D) => (D ? D[I.tpm] : null) } : {}));
    xa = {
      label: def.xa.label || 'Theo 126 xã, phường', inds: inds,
      cardRows: def.xa.cardRows,
      rows: (pid) => {
        let U = [];
        try { U = def.xa.units() || []; } catch (e) { U = []; }
        return CTM_XA.map((u) => {
          const s = pid === 'ky' ? U.find((x) => x.ten === u.name) : null, r = { u: u };
          def.xa.inds.forEach((I) => { let v = null; try { v = s ? I.f(s, u) : null; } catch (e) { v = null; } r[I.id] = v == null || !isFinite(v) ? null : v; });
          return r;
        });
      },
      note: def.xa.note || 'Số của từng xã, phường là số theo eform của sở (địa bàn báo cáo) cùng kỳ; dân số, diện tích là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025.'
    };
  }
  return ctmRegister({
    id: def.id, role: 'UBND', level: 'city', enabled: CTM_SO_ENABLED, name: def.name, short: def.short, org: def.org || 'UBND Thành phố Hà Nội',
    periods: periods, kind: 'kỳ', cmpRef: 'cùng kỳ', data: data, metrics: metrics, kpis: kpis, groups: groups, xa: xa, card: def.card, cardL: def.cardL,
    note: def.note || ('số liệu theo eform của sở, kỳ ' + def.ky + (def.ck ? '; chỉ tiêu có số cùng kỳ năm trước thì so với ' + def.ck : '') + '. Bấm tên một thẻ (có dấu ›) để xem theo từng xã, phường.'),
    foot: 'Số liệu theo eform của sở · ' + def.ky + (def.ck ? ', so với ' + def.ck : '') + '.'
  });
}
const CTM_SO_M9 = (typeof VHTT_MONTHS !== 'undefined' ? VHTT_MONTHS : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9']);
const ctmSoZip = (labels, vals) => (labels || []).map((l, i) => [ctmLb(l), vals ? vals[i] : null]);

/* ============================== SỞ VĂN HÓA VÀ THỂ THAO ============================== */
/* Từ 15/10/2026 là "Sở Văn hóa, Thể thao và Du lịch": khai báo này đăng ký lại ở cuối mục Sở Du lịch, gộp thêm 2 chỉ tiêu du lịch. */
const CTM_SO_VHTT_DEF = {
  id: 'ubnd-vhtt', name: 'Sở Văn hóa và Thể thao', ky: VHTT_KY,
  m: {
    ctTong: ['Nhiệm vụ Chương trình hành động 08-CT', 'nhiệm vụ', 0, () => VHTT_SUM.ct08.tong, null, 'n', 'Tổng số nhiệm vụ'],
    ctHt: ['Nhiệm vụ đã hoàn thành', 'nhiệm vụ', 0, () => VHTT_SUM.ct08.ht, null, '', 'Đã hoàn thành'],
    ctQh: ['Nhiệm vụ quá hạn chưa hoàn thành', 'nhiệm vụ', 0, () => VHTT_SUM.ct08.quaHan, null, 'i', 'Quá hạn chưa hoàn thành'],
    ctR: ['Tỷ lệ hoàn thành nhiệm vụ', '%', 1, () => VHTT_SUM.ct08.htTyLe, null, '', 'Tỷ lệ hoàn thành'],
    ctDh: ['Hoàn thành đúng hạn trên số đã hoàn thành', '%', 1, () => VHTT_SUM.ct08.dungHanTyLe, null, '', 'Hoàn thành đúng hạn'],
    da: ['Dự án theo Nghị quyết 80', 'dự án', 0, () => VHTT_SUM.duan.da, null, 'n', 'Dự án theo Nghị quyết 80'],
    daBt: ['Dự án đã bố trí vốn', 'dự án', 0, () => VHTT_SUM.duan.daBt, null, '', 'Đã bố trí vốn'],
    daR: ['Dự án đã bố trí vốn', '%', 1, () => soPc(VHTT_SUM.duan.daBt, VHTT_SUM.duan.da), null, '', 'Dự án đã bố trí vốn'],
    von: ['Tổng vốn theo Nghị quyết 80', 'tỷ đồng', 0, () => VHTT_SUM.duan.von, null, 'n', 'Tổng vốn theo Nghị quyết 80'],
    vonBt: ['Vốn đã bố trí giai đoạn 2026–2030', 'tỷ đồng', 0, () => VHTT_SUM.duan.vonBt, null, '', 'Vốn đã bố trí'],
    vonR: ['Vốn đã bố trí so tổng vốn', '%', 1, () => soPc(VHTT_SUM.duan.vonBt, VHTT_SUM.duan.von), null, '', 'Vốn đã bố trí'],
    hd: ['Hoạt động nghệ thuật Thành phố quản lý', 'hoạt động', 0, () => VHTT_SUM.ntg.hd, null, 'n', 'Số hoạt động'],
    nguoi: ['Lượt người tham gia hoạt động nghệ thuật', 'lượt', 0, () => VHTT_SUM.ntg.nguoi, null, '', 'Lượt người tham gia'],
    buoi: ['Buổi, đêm diễn', 'buổi', 0, () => VHTT_DATA.ntg.buoi, null, '', 'Buổi, đêm diễn'],
    bq: ['Bình quân người tham gia một hoạt động', 'người', 0, () => VHTT_SUM.ntg.bq, null, 'n', 'Bình quân một hoạt động'],
    dsR: ['Hoạt động đã đối soát', '%', 1, () => soPc(VHTT_SUM.ntg.daDoiSoat, VHTT_SUM.ntg.hd), null, '', 'Đã đối soát'],
    /* tiền: cấu hình tính bằng triệu đồng, hiển thị tỷ đồng (quy tắc H4: tổng tiền ghi tỷ đồng) */
    dt: ['Doanh thu đơn vị nghệ thuật', 'tỷ đồng', 1, () => VHTT_SUM.dt.tong / 1000, null, '', 'Tổng doanh thu'],
    cl: ['Chênh lệch thu – chi', 'tỷ đồng', 1, () => VHTT_SUM.dt.cl / 1000, null, '', 'Chênh lệch thu – chi'],
    nsnn: ['Kinh phí ngân sách nhà nước hỗ trợ', 'tỷ đồng', 1, () => VHTT_SUM.dt.nsnn / 1000, null, 'n', 'Ngân sách hỗ trợ'],
    dtKh: ['Doanh thu so kế hoạch năm', '%', 1, () => soPc(VHTT_SUM.dt.tong, VHTT_DATA.dt.keHoach), null, '', 'So kế hoạch năm'],
    khan: ['Lượt khán giả', 'lượt', 0, () => VHTT_SUM.dt.khan],
    giaVe: ['Giá vé bình quân', 'nghìn đồng', 0, () => VHTT_SUM.dt.giaVe / 1000, null, 'n'],
    ntcn: ['Hoạt động nghệ thuật chuyên nghiệp', 'hoạt động', 0, () => VHTT_SUM.ntcn.tong, null, '', 'Hoạt động chuyên nghiệp'],
    ncBuoi: ['Buổi, đêm diễn chuyên nghiệp', 'buổi', 0, () => VHTT_DATA.ntcn.buoi, null, '', 'Buổi, đêm diễn'],
    ncNs: ['Lượt nghệ sĩ, diễn viên', 'lượt', 0, () => VHTT_DATA.ntcn.ngheSi, null, '', 'Lượt nghệ sĩ'],
    ncKg: ['Lượt khán giả nghệ thuật chuyên nghiệp', 'lượt', 0, () => VHTT_DATA.ntcn.khanGia, null, '', 'Lượt khán giả'],
    bc: ['Tin, bài về Hà Nội trên báo chí, mạng xã hội', 'tin bài', 0, () => VHTT_SUM.bc.tong, null, 'n', 'Tổng tin bài'],
    tcR: ['Tin tích cực', '%', 1, () => soPc(VHTT_SUM.bc.cx[0], VHTT_SUM.bc.tong)],
    tieuR: ['Tin tiêu cực', '%', 1, () => soPc(VHTT_SUM.bc.cx[2], VHTT_SUM.bc.tong), null, 'i'],
    gap: ['Tin tiêu cực cần xử lý gấp', 'tin bài', 0, () => VHTT_SUM.bc.canXuLy, null, 'i', 'Cần xử lý gấp'],
    /* lượt: cấu hình tính bằng triệu lượt, hiển thị nghìn lượt như mọi chỉ tiêu lượt (quy tắc H3) */
    xem: ['Lượt xem tin, bài', 'nghìn lượt', 0, () => VHTT_DATA.bc.xem * 1000, null, '', 'Lượt xem']
  },
  kpis: [['ctTong', 'Chương trình hành động 08-CT'], ['ctR', 'trên tổng số nhiệm vụ'], ['da', 'giai đoạn 2026–2030'], ['vonBt', 'giai đoạn 2026–2030'], ['nguoi', 'hoạt động nghệ thuật'], ['dt', 'đơn vị nghệ thuật Thành phố'], ['ntcn', 'Liên hoan, Hội diễn, Hội thi'], ['bc', 'báo chí, mạng xã hội']],
  /* eform không có trường kế hoạch doanh thu, không có ngày hoàn thành thực tế (phản hồi 13/10/2026) */
  an: [VHTT_SHOW_KE_HOACH_DT ? '' : 'dtKh', VHTT_TACH_DUNG_HAN ? '' : 'ctDh'],
  card: ['ctR', 'da', 'dt', 'bc'],
  cardL: { ctR: 'Hoàn thành nhiệm vụ Chương trình 08-CT', da: 'Dự án văn hóa, thể thao 2026–2030', dt: 'Doanh thu đơn vị nghệ thuật', bc: 'Tin, bài về Hà Nội' },
  groups: [
    { id: 'ct08', label: 'Chương trình 08-CT', note: 'Tiến độ triển khai Chương trình hành động số 08-CT (kỳ tháng 9/2026)', lines: ['ctTong', 'ctHt', 'ctQh', 'ctR', 'ctDh'],
      cards: [
        /* nhóm tiến độ: gộp hoàn thành đúng hạn / chậm khi không tách được (VHTT_TACH_DUNG_HAN) */
        { type: 'shares', t: 'Nhiệm vụ theo tiến độ', u: 'nhiệm vụ', items: () => vhttCt08Nhom(VHTT_DATA.ct08.st, VHTT_SUM.ct08.st).map((r) => [r[0].l, r[1]]) },
        /* kế hoạch = đếm theo «Thời gian hoàn thành theo Kế hoạch»; thực tế = đếm «Tiến độ thực hiện» = Hoàn thành trong bản báo cáo từng tháng */
        { type: 'mbars', t: 'Hoàn thành lũy kế so kế hoạch', labels: CTM_SO_M9, vals: () => VHTT_DATA.ct08.htLk, vals2: () => VHTT_DATA.ct08.khLk, l1: 'Thực tế hoàn thành', l2: 'Đến hạn theo kế hoạch', u: 'nhiệm vụ' },
        { type: 'list', t: 'Theo đơn vị chủ trì', head: ['Đơn vị chủ trì'].concat(vhttCt08Nhom(VHTT_DATA.ct08.st, VHTT_DATA.ct08.st.map(() => 0)).map((r) => r[0].l)),
          rows: () => VHTT_DATA.ct08.dv.map((r) => [r[0]].concat(vhttCt08Nhom(VHTT_DATA.ct08.st, r[1]).map((x) => x[1]))) }
      ] },
    { id: 'duan', label: 'Dự án 2026–2030', note: 'Dự án Thành phố đầu tư, hỗ trợ đầu tư lĩnh vực văn hóa, thể thao giai đoạn 2026–2030 (Quý III/2026)', lines: ['da', 'daBt', 'von', 'vonBt', 'daR', 'vonR'],
      cards: [
        { type: 'shares', t: 'Dự án theo tiến độ', u: 'dự án', items: () => VHTT_DATA.duan.td.map((r) => [r[0], r[1]]) },
        { type: 'list', t: 'Vốn theo nhóm công trình', head: ['Nhóm công trình', 'Dự án', 'Đã bố trí vốn', 'Vốn theo NQ 80 (tỷ đồng)', 'Vốn đã bố trí (tỷ đồng)'], rows: () => VHTT_DATA.duan.nhom.map((r) => [r[0], r[1], r[2], r[3], r[4]]) }
      ] },
    { id: 'ntg', label: 'Hoạt động nghệ thuật', note: 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý', lines: ['nguoi', 'hd', 'buoi', 'bq', 'dsR'],
      cards: [
        { type: 'mbars', t: 'Hoạt động theo tháng', labels: CTM_SO_M9, vals: () => VHTT_DATA.ntg.thangHd, u: 'hoạt động' },
        { type: 'list', t: 'Theo loại hoạt động', head: ['Loại hoạt động', 'Hoạt động', 'Người tham gia'], rows: () => VHTT_DATA.ntg.loai.map((r) => [r[0], r[1], r[2]]) },
        { type: 'shares', t: 'Theo quy mô', u: 'hoạt động', items: () => VHTT_DATA.ntg.quyMo.map((r) => [r[0], r[1]]) },
        { type: 'shares', t: 'Theo cấp tổ chức', u: 'hoạt động', items: () => VHTT_DATA.ntg.cap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'dt', label: 'Doanh thu nghệ thuật', note: 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý (tỷ đồng)', lines: ['dt', 'cl', 'nsnn', 'khan', 'giaVe', 'dtKh'],
      cards: [
        { type: 'shares', t: 'Cơ cấu nguồn thu', u: 'tỷ đồng', d: 1, items: () => ctmSoZip(VHTT_DATA.dt.khoan, VHTT_SUM.dt.khoan.map((v) => v / 1000)) },
        { type: 'mbars', t: 'Doanh thu, chi phí theo tháng', labels: CTM_SO_M9, vals: () => VHTT_DATA.dt.thangDt.map((v) => v / 1000), vals2: () => VHTT_DATA.dt.thangCp.map((v) => v / 1000), l1: 'Doanh thu', l2: 'Chi phí trực tiếp', u: 'tỷ đồng', d: 1 },
        { type: 'list', t: 'Theo đơn vị nghệ thuật', head: ['Đơn vị', 'Doanh thu (tỷ đồng)', 'Chi phí trực tiếp (tỷ đồng)', 'Chênh lệch (tỷ đồng)'], d: [1, 1, 1], rows: () => VHTT_DATA.dt.dv.map((r) => [r[0], soSum(r[1]) / 1000, r[2] / 1000, (soSum(r[1]) - r[2]) / 1000]) }
      ] },
    { id: 'ntcn', label: 'Nghệ thuật chuyên nghiệp', note: 'Hoạt động nghệ thuật chuyên nghiệp đã diễn ra (Liên hoan, Hội diễn, Hội thi)', lines: ['ntcn', 'ncBuoi', 'ncNs', 'ncKg'],
      cards: [
        { type: 'shares', t: 'Theo loại hình', u: 'hoạt động', items: () => ctmSoZip(VHTT_DATA.ntcn.loaiHinh, VHTT_SUM.ntcn.loai) },
        { type: 'mbars', t: 'Hoạt động theo tháng', labels: CTM_SO_M9, vals: () => VHTT_SUM.ntcn.thang, u: 'hoạt động' },
        { type: 'shares', t: 'Theo tính chất', u: 'hoạt động', items: () => VHTT_DATA.ntcn.tinhChat.map((r) => [r[0], r[1]]) },
        { type: 'shares', t: 'Nguồn kinh phí', u: 'tỷ đồng', d: 1, items: () => VHTT_DATA.ntcn.kinhPhi.map((r) => [r[0], r[1] / 1000]) }
      ] },
    { id: 'bc', label: 'Thông tin báo chí, mạng xã hội', note: 'Tin, bài về Thành phố Hà Nội trên báo chí, trang tin, mạng xã hội', lines: ['bc', 'gap', 'tcR', 'tieuR', 'xem'],
      cards: [
        { type: 'mbars', t: 'Tin, bài theo tháng', labels: CTM_SO_M9, vals: () => VHTT_DATA.bc.thangTong, vals2: () => VHTT_DATA.bc.thangTieuCuc, l1: 'Tổng tin bài', l2: 'Tin tiêu cực', u: 'tin bài' },
        { type: 'shares', t: 'Theo mức độ cảm xúc', u: 'tin bài', items: () => ctmSoZip(VHTT_DATA.bc.cx, VHTT_SUM.bc.cx) },
        { type: 'list', t: 'Theo loại nguồn', head: ['Loại nguồn'].concat(VHTT_DATA.bc.cx.map((c) => c[0])), rows: () => VHTT_DATA.bc.nguon.map((r) => [r[0]].concat(r[1])) },
        { type: 'list', t: 'Theo lĩnh vực', head: ['Lĩnh vực', 'Tin bài'], rows: () => VHTT_DATA.bc.linhVuc.map((r) => [r[0], r[1]]) }
      ] }
  ]
};
ctmSo(CTM_SO_VHTT_DEF);

/* ============================== VĂN PHÒNG UBND THÀNH PHỐ ============================== */
ctmSo({
  id: 'ubnd-vpubnd', name: 'Văn phòng UBND Thành phố Hà Nội', short: 'Văn phòng UBND', ky: VPUB_KY,
  m: {
    vbT: ['Văn bản, hồ sơ công việc (Quý III)', 'văn bản', 0, () => VPUB_SUM.cs27.tong[2], null, 'n', 'Tổng văn bản, hồ sơ'],
    vbM: ['Văn bản, hồ sơ xử lý trên môi trường mạng (Quý III)', 'văn bản', 0, () => VPUB_SUM.cs27.mang[2], null, '', 'Xử lý trên môi trường mạng'],
    vbR: ['Văn bản, hồ sơ xử lý trên môi trường mạng', '%', 1, () => VPUB_SUM.cs27.tyLeQ[2], null, '', 'Tỷ lệ toàn Thành phố'],
    vbSo: ['Tỷ lệ của sở, ban, ngành', '%', 1, () => VPUB_SUM.cs27.soTyLe, null, '', 'Sở, ban, ngành'],
    vbXa: ['Tỷ lệ của phường, xã', '%', 1, () => VPUB_SUM.cs27.xaTyLe, null, '', 'Phường, xã'],
    tla: ['Phường, xã đã triển khai trợ lý ảo', 'đơn vị', 0, () => VPUB_SUM.cs29.tla, null, '', 'Đã triển khai'],
    tlaR: ['Phường, xã đã triển khai trợ lý ảo', '%', 1, () => soPc(VPUB_SUM.cs29.tla, VPUB_SUM.cs29.dv), null, '', 'Tỷ lệ đã triển khai'],
    nv: ['Nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao', 'nhiệm vụ', 0, () => VPUB_SUM.cs74.tong, null, 'n', 'Tổng số nhiệm vụ'],
    nvHt: ['Nhiệm vụ đã hoàn thành', 'nhiệm vụ', 0, () => VPUB_SUM.cs74.ht, null, '', 'Đã hoàn thành'],
    nvQh: ['Nhiệm vụ quá hạn chưa hoàn thành', 'nhiệm vụ', 0, () => VPUB_SUM.cs74.quaHan, null, 'i', 'Quá hạn chưa hoàn thành'],
    nvSap: ['Nhiệm vụ sắp đến hạn', 'nhiệm vụ', 0, () => VPUB_DATA.cs74.sapDenHan, null, 'n', 'Sắp đến hạn'],
    nvR: ['Tỷ lệ hoàn thành nhiệm vụ', '%', 1, () => VPUB_SUM.cs74.htTyLe, null, '', 'Tỷ lệ hoàn thành'],
    nvDh: ['Hoàn thành đúng hạn trên số đã hoàn thành', '%', 1, () => VPUB_SUM.cs74.dungHanTyLe, null, '', 'Hoàn thành đúng hạn'],
    nvTd: ['Tiến độ bình quân nhiệm vụ đang thực hiện', '%', 1, () => VPUB_DATA.cs74.tienDoBq, null, '', 'Tiến độ bình quân đang thực hiện'],
    /* hồ sơ thủ tục hành chính: nguồn chính là TT Phục vụ HCC (chốt 12/10/2026); đây là số theo báo cáo eform chỉ số 52 nên ghi rõ nguồn (quy tắc H19) */
    hs: ['Hồ sơ thủ tục hành chính tiếp nhận tại phường, xã (theo báo cáo eform)', 'hồ sơ', 0, () => VPUB_SUM.cs52.hs.tn, null, 'n', 'Hồ sơ tiếp nhận (báo cáo eform)'],
    /* tiếp nhận − đúng hạn − quá hạn: không gọi "đang giải quyết" vì có thể lẫn hồ sơ kỳ trước chuyển sang (bản trả lời BA, mục 06) */
    hsDang: ['Hồ sơ chưa có kết quả trong kỳ', 'hồ sơ', 0, () => VPUB_SUM.cs52.hs.dangGq, null, 'n', 'Chưa có kết quả trong kỳ'],
    hsDh: ['Hồ sơ giải quyết đúng hạn (theo báo cáo eform)', '%', 2, () => soPc(VPUB_SUM.cs52.hs.dh, VPUB_SUM.cs52.hs.dh + VPUB_SUM.cs52.hs.qh), null, '', 'Đúng hạn (báo cáo eform)'],
    hsTt: ['Hồ sơ trực tuyến', '%', 1, () => soPc(VPUB_SUM.cs52.hs.tt, VPUB_SUM.cs52.hs.tn), null, '', 'Hồ sơ trực tuyến'],
    hsTttt: ['Thanh toán trực tuyến', '%', 1, () => soPc(VPUB_SUM.cs52.hs.tttt, VPUB_SUM.cs52.hs.tt), null, '', 'Thanh toán trực tuyến'],
    hsSh: ['Hồ sơ đã số hóa', '%', 1, () => soPc(VPUB_SUM.cs52.hs.sh, VPUB_SUM.cs52.hs.tn), null, '', 'Đã số hóa'],
    /* trường eform "Điểm hài lòng (%)": đơn vị theo tên trường là % (quy tắc Q1); gọi "mức độ hài lòng" để không ghi "điểm … %" (H4),
       2 số lẻ như các tỷ lệ hồ sơ thủ tục hành chính (H5). Chờ Sở xác nhận là tỷ lệ hay điểm trên thang 100. */
    hsHl: ['Mức độ hài lòng', '%', 2, () => VPUB_SUM.cs52.hs.hl, null, '', 'Mức độ hài lòng'],
    tb: ['Thiết bị, hệ thống công nghệ thông tin', 'thiết bị', 0, () => VPUB_SUM.cs1112.tong, null, 'n', 'Tổng thiết bị, hệ thống'],
    tbHong: ['Thiết bị hỏng, không hoạt động', 'thiết bị', 0, () => VPUB_SUM.cs1112.tt[3], null, 'i', 'Hỏng, không hoạt động'],
    tbR: ['Thiết bị đang hoạt động', '%', 1, () => soPc(VPUB_SUM.cs1112.tt[0], VPUB_SUM.cs1112.tong), null, '', 'Đang hoạt động'],
    phR: ['Phòng họp có giao ban trực tuyến', '%', 1, () => soPc(VPUB_SUM.cs1112.phongTb, VPUB_SUM.cs1112.phong), null, '', 'Phòng họp có giao ban trực tuyến'],
    /* riêng 126 phường, xã (không gồm sở, ban, ngành): mức chung của bảng xã, phường — quy tắc H20 */
    phXaR: ['Phòng họp có giao ban trực tuyến của phường, xã', '%', 1, () => soPc(soSum(VPUB_UNITS.map((u) => u.phongTb)), soSum(VPUB_UNITS.map((u) => u.phongHop))), null, '', 'Phòng họp có giao ban (phường, xã)']
  },
  kpis: [['vbR', 'văn bản, hồ sơ Quý III/2026'], ['tlaR', 'trên 126 phường, xã'], ['nv', 'giao năm 2026'], ['nvR', 'trên tổng số nhiệm vụ'], ['hs', '9 tháng, 126 phường, xã'], ['hsDh', 'trên hồ sơ đã giải quyết'], ['hsTt', 'trên hồ sơ tiếp nhận'], ['tbR', 'thiết bị, hệ thống']],
  card: ['vbR', 'tlaR', 'nvR', 'hsDh'],
  cardL: { vbR: 'Văn bản xử lý trên môi trường mạng', tlaR: 'Phường, xã có trợ lý ảo', nvR: 'Hoàn thành nhiệm vụ Chính phủ giao', hsDh: 'Hồ sơ đúng hạn (báo cáo eform)' },
  groups: [
    { id: 'cs27', label: 'Văn bản trên môi trường mạng', note: 'Chỉ số 27: văn bản, hồ sơ công việc xử lý trên môi trường mạng (Quý III/2026)', lines: ['vbT', 'vbM', 'vbR', 'vbSo', 'vbXa'], xa: 'vbR',
      cards: [
        { type: 'mbars', t: 'Tỷ lệ theo quý', labels: VPUB_QUY, vals: () => VPUB_SUM.cs27.tyLeQ, u: '%', d: 1 },
        { type: 'shares', t: 'Phường, xã theo mức tỷ lệ', u: 'đơn vị', items: () => ctmSoZip(VPUB_DATA.cs27.nhom, VPUB_SUM.cs27.nhom) },
        { type: 'list', t: '10 phường, xã tỷ lệ thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [1], rows: () => VPUB_SUM.cs27.thapNhat.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'cs29', label: 'Trợ lý ảo', note: 'Chỉ số 29: triển khai trợ lý ảo tại phường, xã (năm 2026)', lines: ['tla', 'tlaR'],
      cards: [
        { type: 'shares', t: 'Theo ứng dụng trợ lý ảo', u: 'đơn vị', items: () => ctmSoZip(VPUB_DATA.cs29.app, VPUB_SUM.cs29.app) },
        { type: 'shares', t: 'Theo đối tượng phục vụ', u: 'đơn vị', items: () => ctmSoZip(VPUB_DATA.cs29.doiTuong, VPUB_SUM.cs29.dt) },
        { type: 'list', t: 'Phường và xã', head: ['', 'Đã triển khai', 'Số đơn vị'], rows: () => [['Phường', VPUB_SUM.cs29.phuong[0], VPUB_SUM.cs29.phuong[1]], ['Xã', VPUB_SUM.cs29.xa[0], VPUB_SUM.cs29.xa[1]]] }
      ] },
    { id: 'cs74', label: 'Nhiệm vụ Chính phủ giao', note: 'Chỉ số 74: nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao năm 2026', lines: ['nv', 'nvHt', 'nvQh', 'nvSap', 'nvR', 'nvDh', 'nvTd'],
      cards: [
        { type: 'shares', t: 'Theo trạng thái thực hiện', u: 'nhiệm vụ', items: () => ctmSoZip(VPUB_DATA.cs74.st, VPUB_SUM.cs74.st) },
        { type: 'mbars', t: 'Giao và hoàn thành lũy kế theo tháng', labels: CTM_SO_M9, vals: () => VPUB_SUM.cs74.lkGiao, vals2: () => VPUB_SUM.cs74.lkHt, l1: 'Đã giao', l2: 'Đã hoàn thành', u: 'nhiệm vụ' },
        { type: 'list', t: 'Theo cơ quan giao', head: ['Cơ quan giao', 'Nhiệm vụ', 'Đã hoàn thành'], rows: () => VPUB_DATA.cs74.coQuan.map((r) => [r[0], soSum(r[1]), r[1][0] + r[1][1]]) }
      ] },
    { id: 'cs52', label: 'Hồ sơ thủ tục hành chính', note: 'Chỉ số 52: hồ sơ thủ tục hành chính, dịch vụ công tại 126 phường, xã theo báo cáo eform (cộng 3 quý). Số chính thức về hồ sơ thủ tục hành chính là số của Trung tâm Phục vụ hành chính công (hệ thống dịch vụ công).', lines: ['hs', 'hsDang', 'hsDh', 'hsTt', 'hsTttt', 'hsSh', 'hsHl'], xa: 'hs',
      cards: [
        { type: 'mbars', t: 'Hồ sơ tiếp nhận theo quý', labels: VPUB_QUY, vals: () => VPUB_SUM.cs52.quy.map((q) => q.tn), u: 'hồ sơ' },
        /* vòng 2 phần, giữa vòng = số đã giải quyết; phần chênh với số tiếp nhận ở dòng phụ (bản trả lời BA, mục 06) */
        { type: 'shares', t: 'Kết quả giải quyết', u: 'hồ sơ', items: () => [['Giải quyết đúng hạn', VPUB_SUM.cs52.hs.dh], ['Giải quyết quá hạn', VPUB_SUM.cs52.hs.qh]],
          hint: () => { const c = VPUB_SUM.cs52.hs.dangGq; return c >= 0 ? 'Chưa có kết quả trong kỳ: ' + ctmF(c) + ' hồ sơ (tiếp nhận ' + ctmF(VPUB_SUM.cs52.hs.tn) + ' − đã giải quyết ' + ctmF(VPUB_SUM.cs52.hs.daGq) + '; eform chưa có số hồ sơ kỳ trước chuyển sang).' : 'Có giải quyết hồ sơ kỳ trước (' + ctmF(c) + ' hồ sơ).'; } }
      ] },
    { id: 'cs1112', label: 'Hạ tầng công nghệ thông tin', note: 'Chỉ số 11, 12: hạ tầng công nghệ thông tin (Quý III/2026)', lines: ['tb', 'tbHong', 'tbR', 'phR'],
      cards: [
        { type: 'shares', t: 'Theo tình trạng hoạt động', u: 'thiết bị', items: () => ctmSoZip(VPUB_DATA.cs1112.tt, VPUB_SUM.cs1112.tt) },
        { type: 'list', t: 'Số lượng theo loại hạ tầng', head: ['Loại hạ tầng', 'Số lượng'], rows: () => VPUB_SUM.cs1112.loai.map((r, i) => [r[0], VPUB_SUM.cs1112.loaiTong[i]]) },
        /* mỗi cặp đơn vị × loại hạ tầng một lượt đánh giá, không đếm theo dòng tình trạng (bản trả lời BA, mục 03) */
        { type: 'shares', t: 'Mức độ đáp ứng', u: 'lượt đánh giá', items: () => ctmSoZip(VPUB_DATA.cs1112.dapUng, VPUB_SUM.cs1112.dapUng),
          hint: 'Mỗi đơn vị, mỗi loại hạ tầng tính một lượt; nhiều dòng tình trạng thì lấy bản mới nhất, cùng lúc thì lấy mức thấp nhất.' }
      ] }
  ],
  xa: {
    units: () => VPUB_UNITS,
    inds: [
      { id: 'vbR', l: 'Văn bản, hồ sơ xử lý trên môi trường mạng (Quý III)', u: '%', d: 1, tpm: 'vbXa', tpL: 'Mức chung 126 phường, xã', f: (s) => soPc(s.vbMang[2], s.vbTong[2]) },
      { id: 'hs', l: 'Hồ sơ thủ tục hành chính tiếp nhận (9 tháng, theo báo cáo eform)', u: 'hồ sơ', tot: true, f: (s) => soSum(s.hs.map((h) => h.tn)) },
      { id: 'hsDh', l: 'Hồ sơ giải quyết đúng hạn (theo báo cáo eform)', u: '%', d: 2, tpm: 'hsDh', f: (s) => { const dh = soSum(s.hs.map((h) => h.dh)), qh = soSum(s.hs.map((h) => h.qh)); return soPc(dh, dh + qh); } },
      { id: 'phR', l: 'Phòng họp có giao ban trực tuyến', u: '%', d: 1, tpm: 'phXaR', tpL: 'Mức chung 126 phường, xã', f: (s) => soPc(s.phongTb, s.phongHop) }
    ]
  }
});

/* ============================== BAN QUẢN LÝ KHU CÔNG NGHỆ CAO VÀ KHU CÔNG NGHIỆP ============================== */
ctmSo({
  id: 'ubnd-bqlkcnc', name: 'Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố', short: 'Ban Quản lý KCNC và KCN', ky: BQL_KY,
  m: {
    dn: ['Doanh nghiệp đang hoạt động (30/9/2026)', 'doanh nghiệp', 0, () => BQL_SUM.dn.dn, null, '', 'Doanh nghiệp đang hoạt động'],
    ld: ['Lao động đang làm việc', 'người', 0, () => BQL_SUM.dn.ld, null, '', 'Lao động đang làm việc'],
    ldBq: ['Lao động bình quân một doanh nghiệp', 'người', 0, () => BQL_SUM.dn.ldBq, null, 'n', 'Bình quân một doanh nghiệp'],
    von: ['Tổng vốn đầu tư đăng ký', 'tỷ đồng', 0, () => BQL_SUM.dn.von, null, '', 'Vốn đầu tư đăng ký'],
    da: ['Dự án thu hút đầu tư mới', 'dự án', 0, () => BQL_SUM.thuHut.da, null, '', 'Dự án mới'],
    tl: ['Lượt thành lập, điều chỉnh', 'lượt', 0, () => BQL_SUM.thuHut.tl, null, 'n', 'Thành lập, điều chỉnh'],
    vm: ['Vốn thu hút đầu tư mới', 'tỷ đồng', 0, () => BQL_SUM.thuHut.vm, null, '', 'Vốn thu hút mới'],
    vmBq: ['Vốn bình quân một dự án mới', 'tỷ đồng', 1, () => BQL_SUM.thuHut.vmBq, null, 'n', 'Bình quân một dự án'],
    dt: ['Doanh thu sản xuất kinh doanh', 'tỷ đồng', 0, () => BQL_SUM.sxkd.dt, null, '', 'Doanh thu'],
    vh: ['Vốn đầu tư hạ tầng', 'tỷ đồng', 0, () => BQL_SUM.sxkd.vh, null, '', 'Vốn đầu tư hạ tầng'],
    dtLd: ['Doanh thu bình quân một lao động', 'triệu đồng', 1, () => BQL_SUM.sxkd.dtLd, null, '', 'Bình quân một lao động'],
    mtR: ['Địa bàn đạt chuẩn môi trường', '%', 1, () => soPc(BQL_SUM.sxkd.mt[0], BQL_SUM.db), null, '', 'Đạt chuẩn môi trường']
  },
  kpis: [['dn', 'tại 30/9/2026'], ['von', 'vốn đăng ký'], ['ld', 'tại 30/9/2026'], ['da', '9 tháng'], ['vm', '9 tháng'], ['dt', '9 tháng'], ['vh', '9 tháng'], ['mtR', 'trên ' + BQL_SUM.db + ' địa bàn có khu']],
  card: ['dn', 'ld', 'vm'],
  groups: [
    { id: 'dn', label: 'Doanh nghiệp, lao động', note: 'Doanh nghiệp, vốn đầu tư đăng ký và lao động trong các khu (số tại 30/9/2026)', lines: ['dn', 'ld', 'ldBq', 'von'], xa: 'dn',
      cards: [
        { type: 'mbars', t: 'Doanh nghiệp theo quý', labels: BQL_QUY, vals: () => BQL_SUM.dn.dnQ, u: 'doanh nghiệp' },
        { type: 'list', t: 'Theo địa bàn', head: ['Địa bàn', 'Doanh nghiệp', 'Vốn đăng ký (tỷ đồng)'], rows: () => BQL_SUM.dn.hang.map((r) => [r[0], r[1], r[2]]) },
        { type: 'list', t: 'Nhà đầu tư chính', head: ['Nhóm nhà đầu tư', 'Số địa bàn có nhà đầu tư'], rows: () => BQL_DOI_TAC.map((g, i) => [g[0], BQL_SUM.dn.doiTac[i]]) }
      ] },
    { id: 'thuHut', label: 'Thu hút đầu tư', note: 'Thu hút đầu tư, thành lập và điều chỉnh trong các khu (cộng 3 quý)', lines: ['da', 'tl', 'vm', 'vmBq'],
      cards: [
        { type: 'mbars', t: 'Vốn thu hút mới theo quý', labels: BQL_QUY, vals: () => BQL_SUM.thuHut.vmQ, u: 'tỷ đồng' },
        { type: 'list', t: 'Vốn thu hút mới theo địa bàn', head: ['Địa bàn', 'Vốn thu hút mới (tỷ đồng)', 'Dự án mới'], rows: () => BQL_SUM.thuHut.hang.map((r) => [r[0], r[1], r[2]]) },
        { type: 'list', t: 'Nội dung thành lập, điều chỉnh gần nhất', head: ['Địa bàn', 'Nội dung', 'Vốn mới Quý III (tỷ đồng)'], rows: () => BQL_SUM.thuHut.ganNhat.map((u) => [u.ten, u.ndGanNhat, u.vm[2]]) }
      ] },
    { id: 'sxkd', label: 'Sản xuất, hạ tầng, môi trường', note: 'Đầu tư hạ tầng, sản xuất kinh doanh và bảo vệ môi trường trong các khu', lines: ['dt', 'vh', 'dtLd', 'mtR'],
      cards: [
        { type: 'mbars', t: 'Doanh thu theo quý', labels: BQL_QUY, vals: () => BQL_SUM.sxkd.dtQ, u: 'tỷ đồng' },
        { type: 'shares', t: 'Tình hình đầu tư kết cấu hạ tầng', u: 'địa bàn', items: () => ctmSoZip(BQL_HT, BQL_SUM.sxkd.ht) },
        { type: 'shares', t: 'Đạt chuẩn môi trường', u: 'địa bàn', items: () => ctmSoZip(BQL_MT, BQL_SUM.sxkd.mt) },
        { type: 'list', t: 'Doanh thu, vốn hạ tầng theo địa bàn', head: ['Địa bàn', 'Doanh thu (tỷ đồng)', 'Vốn hạ tầng (tỷ đồng)'], rows: () => BQL_SUM.sxkd.hang.map((r) => [r[0], r[1], r[2]]) }
      ] }
  ],
  xa: {
    label: 'Theo địa bàn có khu', units: () => BQL_UNITS,
    cardRows: ['Bảng ' + BQL_SUM.db + ' địa bàn có khu công nghiệp, khu công nghệ cao', 'Hạng, nơi cao nhất / thấp nhất', 'Hồ sơ từng địa bàn: dân số, diện tích, các chỉ tiêu và hạng', 'Lọc phường / xã, tìm theo tên'],
    inds: [
      { id: 'dn', l: 'Doanh nghiệp đang hoạt động', u: 'doanh nghiệp', tot: true, f: (s) => s.dn[2] },
      { id: 'ld', l: 'Lao động đang làm việc', u: 'người', tot: true, f: (s) => s.ld[2] },
      { id: 'von', l: 'Vốn đầu tư đăng ký', u: 'tỷ đồng', tot: true, f: (s) => s.von[2] },
      { id: 'vm', l: 'Vốn thu hút mới (9 tháng)', u: 'tỷ đồng', tot: true, f: (s) => soSum(s.vm) },
      { id: 'dt', l: 'Doanh thu sản xuất kinh doanh (9 tháng)', u: 'tỷ đồng', tot: true, f: (s) => soSum(s.dt) }
    ],
    note: 'Chỉ ' + BQL_SUM.db + ' xã, phường có khu công nghiệp, khu công nghệ cao báo cáo; các xã, phường khác để trống.'
  }
});

/* ============================== SỞ DU LỊCH ============================== */
const CTM_SO_DL_DEF = {
  id: 'ubnd-dulich', name: 'Sở Du lịch', ky: DL_KY,
  m: {
    /* lượt khách: một đơn vị nghìn lượt ở mọi chỗ — ô số, thẻ, biểu đồ tháng, bảng, bảng xã (quy tắc H2, H3; chốt 12/10/2026) */
    tong: ['Tổng lượt khách du lịch', 'nghìn lượt', 0, () => DL_SUM.khach.tong / 1000, null, '', 'Tổng lượt khách'],
    qt: ['Khách quốc tế', 'nghìn lượt', 0, () => DL_SUM.khach.qt / 1000, null, '', 'Quốc tế'],
    nd: ['Khách nội địa', 'nghìn lượt', 0, () => DL_SUM.khach.nd / 1000, null, '', 'Nội địa'],
    tyQt: ['Khách quốc tế trên tổng lượt khách', '%', 1, () => DL_SUM.khach.tyQt, null, '', 'Tỷ trọng khách quốc tế'],
    /* số một tháng (cờ m): không đặt thành thanh cạnh số 9 tháng, chỉ ghi dòng phụ (quy tắc H11) */
    t9: ['Lượt khách tháng 9', 'nghìn lượt', 0, () => DL_SUM.khach.t9 / 1000, null, 'nm', 'Tháng 9'],
    dt: ['Tổng thu từ khách du lịch', 'tỷ đồng', 0, () => DL_SUM.doanhThu.tong / 1000, null, '', 'Tổng thu'],
    ltau: ['Doanh thu lưu trú, ăn uống', 'tỷ đồng', 0, () => DL_SUM.doanhThu.ltau / 1000, null, '', 'Lưu trú, ăn uống'],
    lh: ['Doanh thu lữ hành', 'tỷ đồng', 0, () => DL_SUM.doanhThu.lh / 1000, null, '', 'Lữ hành'],
    khac: ['Doanh thu dịch vụ khác', 'tỷ đồng', 0, () => DL_SUM.doanhThu.khac / 1000, null, '', 'Dịch vụ khác'],
    chi: ['Chi tiêu bình quân một lượt khách', 'nghìn đồng', 0, () => DL_SUM.doanhThu.chiBq, null, '', 'Chi tiêu bình quân']
  },
  kpis: [['tong', '9 tháng'], ['qt', '9 tháng'], ['nd', '9 tháng'], ['tyQt', 'trên tổng lượt khách'], ['dt', '9 tháng'], ['ltau', '9 tháng'], ['lh', '9 tháng'], ['chi', 'một lượt khách']],
  card: ['tong', 'qt', 'dt'],
  cardL: { tong: 'Tổng lượt khách du lịch', qt: 'Khách quốc tế', dt: 'Tổng thu từ khách du lịch' },
  groups: [
    { id: 'khach', label: 'Khách du lịch', note: 'Khách du lịch nội địa và quốc tế (9 tháng năm 2026)', lines: ['tong', 'nd', 'qt', 't9', 'tyQt'], xa: 'khach',
      cards: [
        { type: 'mbars', t: 'Lượt khách theo tháng', labels: CTM_SO_M9, vals: () => DL_SUM.khach.khT.map((v) => v / 1000), vals2: () => DL_SUM.khach.qtT.map((v) => v / 1000), l1: 'Tổng lượt khách', l2: 'Khách quốc tế', u: 'nghìn lượt' },
        { type: 'list', t: 'Theo loại điểm đến', head: ['Loại điểm', 'Khách quốc tế (nghìn lượt)', 'Khách nội địa (nghìn lượt)'], rows: () => DL_LOAI.map((l, i) => [l[0], DL_SUM.khach.qtLoai[i] / 1000, DL_SUM.khach.ndLoai[i] / 1000]) },
        { type: 'list', t: 'Phường, xã đón nhiều khách nhất', head: ['Phường, xã', 'Khách quốc tế (nghìn lượt)', 'Khách nội địa (nghìn lượt)'], rows: () => DL_SUM.khach.top.map((r) => [r[0], r[1] / 1000, r[2] / 1000]) }
      ] },
    { id: 'dt', label: 'Doanh thu du lịch', note: 'Doanh thu dịch vụ du lịch (tỷ đồng)', lines: ['dt', 'ltau', 'lh', 'khac', 'chi'], xa: 'dt',
      cards: [
        { type: 'shares', t: 'Cơ cấu tổng thu', u: 'tỷ đồng', items: () => [[DL_CO_CAU[0][0], DL_SUM.doanhThu.ltau / 1000], [DL_CO_CAU[1][0], DL_SUM.doanhThu.lh / 1000], [DL_CO_CAU[2][0], DL_SUM.doanhThu.khac / 1000]] },
        { type: 'mbars', t: 'Tổng thu theo tháng', labels: CTM_SO_M9, vals: () => DL_SUM.doanhThu.tongT.map((v) => v / 1000), u: 'tỷ đồng' },
        { type: 'list', t: 'Phường, xã có tổng thu lớn nhất', head: ['Phường, xã', 'Tổng thu (tỷ đồng)'], rows: () => DL_SUM.doanhThu.top.map((r) => [r[0], r[1] / 1000]) }
      ] }
  ],
  xa: {
    units: () => DL_UNITS,
    inds: [
      { id: 'khach', l: 'Lượt khách du lịch', u: 'nghìn lượt', tot: true, f: (s) => (s.qt + s.nd) / 1000 },
      { id: 'qt', l: 'Khách quốc tế', u: 'nghìn lượt', tot: true, f: (s) => s.qt / 1000 },
      { id: 'dt', l: 'Tổng thu từ khách du lịch', u: 'tỷ đồng', tot: true, f: (s) => s.tong / 1000 },
      { id: 'kpc', l: 'Lượt khách trên 1.000 dân', u: 'lượt', d: 0, f: (s, u) => (s.qt + s.nd) / u.ds * 1000 }
    ]
  }
};
ctmSo(CTM_SO_DL_DEF);

/* Sở Du lịch đã nhập vào Sở Văn hóa và Thể thao (cờ UBND_SAP_XEP_SO_2026, central-level.js): đăng ký lại 'ubnd-vhtt' gồm
   6 nhóm văn hóa, thể thao + 2 nhóm du lịch. Khóa chỉ tiêu, mã nhóm du lịch thêm tiền tố "dl" để không trùng (cả hai sở đều có
   khóa "dt"); số, cách tính, bảng 126 xã, phường giữ nguyên của cấu hình Du lịch. Thẻ ngoài thêm dòng tổng lượt khách. */
function ctmSoGopDl(V, L) {
  const k = (x) => 'dl' + x.charAt(0).toUpperCase() + x.slice(1), mk = (x) => (Array.isArray(x) ? [k(x[0])].concat(x.slice(1)) : k(x));
  const m = Object.assign({}, V.m), cardL = Object.assign({}, V.cardL);
  Object.keys(L.m).forEach((x) => { m[k(x)] = L.m[x]; });
  Object.keys(L.cardL || {}).forEach((x) => { cardL[k(x)] = L.cardL[x]; });
  return Object.assign({}, V, {
    name: 'Sở Văn hóa, Thể thao và Du lịch', m: m,
    /* tối đa 8 ô số chính (quy tắc chung): 6 ô văn hóa, thể thao + 2 ô du lịch; các số bỏ ra vẫn có trong nhóm của nó */
    kpis: [['ctR', 'Chương trình hành động 08-CT'], ['da', 'giai đoạn 2026–2030'], ['nguoi', 'hoạt động nghệ thuật'], ['dt', 'đơn vị nghệ thuật Thành phố'], ['ntcn', 'Liên hoan, Hội diễn, Hội thi'], ['bc', 'báo chí, mạng xã hội']]
      .concat(L.kpis.filter((x) => ['tong', 'dt'].indexOf(x[0]) >= 0).map(mk)),
    card: V.card.concat(['dlTong']), cardL: cardL,
    groups: V.groups.concat(L.groups.map((g) => Object.assign({}, g, { id: 'dl' + g.id, lines: g.lines.map(k) }))),
    xa: L.xa
  });
}
if (typeof UBND_SAP_XEP_SO_2026 !== 'undefined' && UBND_SAP_XEP_SO_2026) ctmSo(ctmSoGopDl(CTM_SO_VHTT_DEF, CTM_SO_DL_DEF));

/* ============================== SỞ DÂN TỘC VÀ TÔN GIÁO ============================== */
ctmSo({
  id: 'ubnd-dantoc-tongiao', name: 'Sở Dân tộc và Tôn giáo', ky: DTTG_KY,
  m: {
    kh: ['Kế hoạch vốn năm 2026', 'tỷ đồng', 1, () => DTTG_SUM.gn.kh / 1000, null, 'np', 'Kế hoạch vốn'],
    pb: ['Vốn đã phân bổ', 'tỷ đồng', 1, () => DTTG_SUM.gn.pb / 1000, null, 't', 'Đã phân bổ'],
    gn: ['Giải ngân lũy kế', 'tỷ đồng', 1, () => DTTG_SUM.gn.gn / 1000, null, '', 'Giải ngân lũy kế'],
    gnKy: ['Giải ngân trong tháng', 'tỷ đồng', 1, () => DTTG_SUM.gn.gnKy / 1000, null, 'm', 'Trong tháng 9'],
    gnR: ['Giải ngân so kế hoạch', '%', 1, () => soPc(DTTG_SUM.gn.gn, DTTG_SUM.gn.kh), null, '', 'Giải ngân so kế hoạch'],
    n: ['Dự án, công trình', 'dự án', 0, () => DTTG_SUM.td.n, null, 'n', 'Tổng số dự án, công trình'],
    ht: ['Dự án, công trình hoàn thành', 'dự án', 0, () => DTTG_SUM.td.tt[0], null, '', 'Hoàn thành'],
    dang: ['Đang thực hiện', 'dự án', 0, () => DTTG_SUM.td.tt[1], null, 'n'],
    dinh: ['Đình trệ, tạm dừng', 'dự án', 0, () => DTTG_SUM.td.tt[3] + DTTG_SUM.td.tt[4], null, 'i', 'Đình trệ, tạm dừng'],
    dungR: ['Dự án đúng tiến độ', '%', 1, () => soPc(DTTG_SUM.td.dung[0], DTTG_SUM.td.dung[0] + DTTG_SUM.td.dung[1]), null, '', 'Đúng tiến độ'],
    soHo: ['Hộ đồng bào dân tộc thiểu số', 'hộ', 0, () => DTTG_SUM.kq.soHo, null, 'n'],
    nuocR: ['Hộ được dùng nước sinh hoạt hợp vệ sinh', '%', 1, () => DTTG_SUM.kq.tl[0], null, '', 'Nước sinh hoạt hợp vệ sinh'],
    duongR: ['Đường trục thôn được cứng hóa', '%', 1, () => DTTG_SUM.kq.tl[1], null, '', 'Đường được cứng hóa'],
    hsR: ['Học sinh đi học đúng cấp', '%', 1, () => DTTG_SUM.kq.tl[2], null, '', 'Học sinh đúng cấp'],
    hnD: ['Hộ nghèo đầu kỳ', 'hộ', 0, () => DTTG_SUM.kq.hoNgheoDau, null, 'i', 'Hộ nghèo đầu kỳ'],
    hnC: ['Hộ nghèo dân tộc thiểu số cuối kỳ', 'hộ', 0, () => DTTG_SUM.kq.hoNgheoCuoi, null, 'i', 'Hộ nghèo cuối kỳ'],
    bcCo: ['Phường, xã có dự án, hoạt động', 'đơn vị', 0, () => DTTG_SUM.ds.bc[0], null, 'n', 'Có dự án, hoạt động'],
    bcKps: ['Phường, xã xác nhận không phát sinh', 'đơn vị', 0, () => DTTG_SUM.ds.bc[1], null, 'n', 'Xác nhận không phát sinh'],
    bcChua: ['Phường, xã chưa báo cáo', 'đơn vị', 0, () => DTTG_SUM.ds.bc[2], null, 'i', 'Chưa báo cáo']
  },
  kpis: [['kh', 'năm 2026'], ['gn', 'lũy kế đến tháng 9'], ['gnR', 'trên kế hoạch năm'], ['n', 'đang theo dõi'], ['ht', 'đến tháng 9'], ['dinh', 'cần tháo gỡ'], ['hnC', 'đầu kỳ ' + DTTG_SUM.kq.hoNgheoDau + ' hộ'], ['bcChua', 'trên 126 phường, xã']],
  card: ['gn', 'gnR', 'ht', 'hnC'],
  cardL: { gn: 'Giải ngân vốn vùng đồng bào dân tộc thiểu số', gnR: 'Giải ngân so kế hoạch', ht: 'Dự án, công trình hoàn thành', hnC: 'Hộ nghèo dân tộc thiểu số' },
  groups: [
    { id: 'gn', label: 'Giải ngân vốn', note: 'Giải ngân vốn Chương trình mục tiêu quốc gia vùng đồng bào dân tộc thiểu số (lũy kế đến tháng 9/2026)', lines: ['gn', 'pb', 'kh', 'gnKy', 'gnR'],
      cards: [
        { type: 'mbars', t: 'Giải ngân lũy kế theo tháng', labels: CTM_SO_M9, vals: () => DTTG_SUM.gn.luyKeT.map((v) => v / 1000), u: 'tỷ đồng', d: 1 },
        { type: 'list', t: 'Theo dự án thành phần', head: ['Dự án thành phần', 'Kế hoạch (tỷ đồng)', 'Phân bổ', 'Giải ngân'], d: [1, 1, 1], rows: () => DTTG_DATP.map((l, i) => [l, DTTG_SUM.gn.byDatp[i][0] / 1000, DTTG_SUM.gn.byDatp[i][1] / 1000, DTTG_SUM.gn.byDatp[i][2] / 1000]) },
        { type: 'list', t: 'Theo xã vùng đồng bào dân tộc thiểu số', head: ['Xã', 'Phân bổ (tỷ đồng)', 'Giải ngân (tỷ đồng)'], d: [1, 1], rows: () => DTTG_SUM.gn.byXa.map((r) => [r[0], r[1] / 1000, r[2] / 1000]) },
        { type: 'shares', t: 'Kế hoạch vốn theo nguồn', u: 'tỷ đồng', d: 1, items: () => DTTG_NGUON.map((l, i) => [l, DTTG_SUM.gn.byNguon[i] / 1000]).filter((r) => r[1] > 0) }
      ] },
    { id: 'td', label: 'Tiến độ dự án', note: 'Tiến độ thực hiện dự án, công trình', lines: ['n', 'ht', 'dang', 'dinh', 'dungR'],
      cards: [
        { type: 'shares', t: 'Theo trạng thái triển khai', u: 'dự án', items: () => ctmSoZip(DTTG_TT, DTTG_SUM.td.tt) },
        { type: 'list', t: 'Theo dự án thành phần', head: ['Dự án thành phần'].concat(DTTG_TT), rows: () => DTTG_DATP.map((l, i) => [l].concat(DTTG_SUM.td.ttDatp[i])) }
      ] },
    { id: 'kq', label: 'Kết quả vùng đồng bào', note: 'Kết quả đối với vùng đồng bào dân tộc thiểu số', lines: ['soHo', 'hnD', 'hnC', 'nuocR', 'duongR', 'hsR'],
      cards: [{ type: 'list', t: 'Theo xã vùng đồng bào dân tộc thiểu số', head: ['Xã', 'Số hộ', 'Hộ có nước sạch', 'Hộ nghèo đầu kỳ', 'Hộ nghèo cuối kỳ'], rows: () => DTTG_SUM.kqXa.map((x) => [x.ten, x.soHo, x.hoNuoc, x.hoNgheoDau, x.hoNgheoCuoi]) }] },
    { id: 'ds', label: 'Báo cáo, đối soát', note: 'Tình hình báo cáo và đối soát dữ liệu của 126 phường, xã', lines: ['bcCo', 'bcKps', 'bcChua'],
      cards: [
        { type: 'shares', t: 'Tình trạng đối soát', u: 'bản ghi', items: () => ctmSoZip(DTTG_DOI_SOAT, DTTG_SUM.ds.doiSoat) },
        { type: 'shares', t: 'Kiểm tra logic dữ liệu', u: 'bản ghi', items: () => ctmSoZip(DTTG_CO, DTTG_SUM.ds.co) }
      ] }
  ]
});

/* ============================== THANH TRA THÀNH PHỐ ============================== */
ctmSo({
  id: 'ubnd-thanhtra', name: 'Thanh tra Thành phố', ky: TTRA_KY,
  m: {
    ktN: ['Cuộc kiểm tra trách nhiệm người đứng đầu', 'cuộc', 0, () => TTRA_SUM.kt.n, null, '', 'Cuộc kiểm tra'],
    ktKh: ['Cuộc kiểm tra theo kế hoạch năm', 'cuộc', 0, () => TTRA_SUM.kt.keHoach, null, 'np', 'Theo kế hoạch năm'],
    ktKl: ['Cuộc kiểm tra đã ban hành kết luận', 'cuộc', 0, () => TTRA_SUM.kt.kl, null, '', 'Đã ban hành kết luận'],
    ktKn: ['Kiến nghị qua kiểm tra', 'kiến nghị', 0, () => TTRA_SUM.kt.soKn, null, 'n', 'Kiến nghị'],
    ktDa: ['Kiến nghị đã thực hiện', 'kiến nghị', 0, () => TTRA_SUM.kt.da, null, '', 'Đã thực hiện'],
    ktQh: ['Kiến nghị quá hạn chưa thực hiện', 'kiến nghị', 0, () => TTRA_SUM.kt.qh, null, 'i', 'Quá hạn chưa thực hiện'],
    ktR: ['Tiến độ so kế hoạch năm', '%', 1, () => soPc(TTRA_SUM.kt.n, TTRA_SUM.kt.keHoach), null, '', 'Thực hiện so kế hoạch'],
    ttN: ['Cuộc thanh tra', 'cuộc', 0, () => TTRA_SUM.tt.n, null, '', 'Cuộc thanh tra'],
    ttKt: ['Cuộc kỳ trước chuyển sang', 'cuộc', 0, () => TTRA_SUM.tt.kyTruoc, null, 'n', 'Kỳ trước chuyển sang'],
    ttKl: ['Cuộc thanh tra đã ban hành kết luận', 'cuộc', 0, () => TTRA_SUM.tt.kl, null, '', 'Đã ban hành kết luận'],
    ttKn: ['Kiến nghị xử lý qua thanh tra', 'kiến nghị', 0, () => TTRA_SUM.tt.soKn, null, 'n', 'Kiến nghị xử lý'],
    ttTh: ['Kiến nghị thu hồi', 'tỷ đồng', 1, () => TTRA_SUM.tt.thuHoi / 1000, null, 'n', 'Kiến nghị thu hồi'],
    ttDt: ['Đã thu hồi', 'tỷ đồng', 1, () => TTRA_SUM.tt.daThu / 1000, null, '', 'Đã thu hồi'],
    ttThR: ['Đã thu hồi so kiến nghị', '%', 1, () => soPc(TTRA_SUM.tt.daThu, TTRA_SUM.tt.thuHoi), null, '', 'Đã thu hồi'],
    ttHc: ['Kiến nghị xử lý hành chính cá nhân', 'cá nhân', 0, () => TTRA_SUM.tt.hcCaNhan, null, 'n', 'Xử lý hành chính cá nhân'],
    ttHcTc: ['Kiến nghị xử lý hành chính tổ chức', 'tổ chức', 0, () => TTRA_SUM.tt.hcToChuc, null, 'n'],
    ttCq: ['Vụ việc chuyển cơ quan điều tra', 'vụ', 0, () => TTRA_SUM.tt.cqdt, null, 'n', 'Chuyển cơ quan điều tra'],
    luot: ['Lượt tiếp công dân', 'lượt', 0, () => TTRA_SUM.tcd.luot, null, 'n', 'Lượt tiếp công dân'],
    doan: ['Đoàn đông người', 'đoàn', 0, () => TTRA_SUM.tcd.doan, null, 'i'],
    don: ['Đơn thư tiếp nhận mới', 'đơn', 0, () => TTRA_SUM.tcd.donMoi, null, 'n', 'Đơn tiếp nhận mới'],
    /* đã xử lý = cộng 4 phần đã phân loại; phải xử lý = kỳ trước chuyển sang + đơn mới (bản trả lời BA, mục 82) */
    donXl: ['Đơn đã phân loại, xử lý', 'đơn', 0, () => TTRA_SUM.tcd.daXl, null, 'n', 'Đơn đã xử lý'],
    thuLy: ['Vụ việc thuộc thẩm quyền đã thụ lý', 'vụ việc', 0, () => TTRA_SUM.tcd.thuLy, null, 'n', 'Đã thụ lý'],
    daGq: ['Vụ việc đã giải quyết', 'vụ việc', 0, () => TTRA_SUM.tcd.daGq, null, '', 'Đã giải quyết'],
    gqDh: ['Giải quyết đúng hạn trên số đã giải quyết', '%', 1, () => soPc(TTRA_SUM.tcd.dungHan, TTRA_SUM.tcd.daGq), null, '', 'Giải quyết đúng hạn'],
    gqR: ['Đã giải quyết trên số thụ lý', '%', 1, () => soPc(TTRA_SUM.tcd.daGq, TTRA_SUM.tcd.thuLy), null, '', 'Đã giải quyết']
  },
  kpis: [['ktN', 'kiểm tra người đứng đầu cấp xã'], ['ttN', '9 tháng'], ['ttKl', '9 tháng'], ['ttTh', 'qua thanh tra'], ['luot', '9 tháng'], ['don', '9 tháng'], ['daGq', 'thuộc thẩm quyền'], ['gqDh', 'trên vụ việc đã giải quyết']],
  /* eform kiểm tra không có trường kế hoạch số cuộc năm (phản hồi 13/10/2026) */
  an: TTRA_SHOW_KE_HOACH_KT ? [] : ['ktKh', 'ktR'],
  card: ['ttN', 'ttKl', 'luot', 'daGq'],
  cardL: { ttN: 'Cuộc thanh tra',ttKl: 'Cuộc thanh tra đã kết luận', luot: 'Lượt tiếp công dân', daGq: 'Vụ việc khiếu nại, tố cáo đã giải quyết' },
  groups: [
    { id: 'kt', label: 'Kiểm tra người đứng đầu', note: 'Kiểm tra trách nhiệm Chủ tịch UBND xã, phường và người đứng đầu trong thực hiện pháp luật', lines: ['ktN', 'ktKh', 'ktKl', 'ktKn', 'ktDa', 'ktQh', 'ktR'],
      cards: [
        { type: 'shares', t: 'Theo trạng thái cuộc kiểm tra', u: 'cuộc', items: () => ctmSoZip(TTRA_KT_TT, TTRA_SUM.kt.tt) },
        { type: 'shares', t: 'Theo nội dung kiểm tra', u: 'cuộc', items: () => ctmSoZip(TTRA_KT_ND, TTRA_SUM.kt.nd) }
      ] },
    { id: 'tt', label: 'Thanh tra', note: 'Cuộc thanh tra, kết luận, kiến nghị xử lý', lines: ['ttN', 'ttKt', 'ttKl', 'ttKn', 'ttTh', 'ttDt', 'ttHc', 'ttHcTc', 'ttCq', 'ttThR'],
      cards: [
        { type: 'shares', t: 'Theo trạng thái cuộc thanh tra', u: 'cuộc', items: () => ctmSoZip(TTRA_TT, TTRA_SUM.tt.tt) },
        { type: 'list', t: 'Theo lĩnh vực', head: ['Lĩnh vực', 'Cuộc thanh tra', 'Kiến nghị thu hồi (triệu đồng)', 'Đã thu hồi'], rows: () => TTRA_LV.map((l, i) => [l, TTRA_SUM.tt.lv[i], TTRA_SUM.tt.lvTien[i][0], TTRA_SUM.tt.lvTien[i][1]]) },
        { type: 'shares', t: 'Theo nguồn', u: 'cuộc', items: () => ctmSoZip(TTRA_NGUON, TTRA_SUM.tt.nguon) },
        { type: 'shares', t: 'Cảnh báo tiến độ', u: 'cuộc', semantic: true, items: () => TTRA_CB.map((l, i) => [l[0], TTRA_SUM.tt.cb[i], l[1]]),
          hint: 'Vàng: đang triển khai, đã dùng trên 75% thời gian kế hoạch mà chưa kết thúc, hoặc đang theo dõi mà chưa thu hồi đủ. Cam: quá hạn đến 10 ngày hoặc tạm dừng. Đỏ: quá hạn trên 10 ngày.' }
      ] },
    { id: 'tcd', label: 'Tiếp công dân, khiếu nại, tố cáo', note: 'Tiếp công dân, xử lý đơn, giải quyết khiếu nại, tố cáo', lines: ['luot', 'doan', 'don', 'donXl', 'thuLy', 'daGq', 'gqDh', 'gqR'],
      cards: [
        { type: 'mbars', t: 'Lượt tiếp công dân theo tháng', labels: CTM_SO_M9, vals: () => TTRA_SUM.tcd.luotT, u: 'lượt' },
        { type: 'mbars', t: 'Đơn thư tiếp nhận theo tháng', labels: CTM_SO_M9, vals: () => TTRA_SUM.tcd.donT, u: 'đơn' },
        { type: 'shares', t: 'Đơn theo loại', u: 'đơn', items: () => [['Khiếu nại', TTRA_SUM.tcd.kn], ['Tố cáo', TTRA_SUM.tcd.tc], ['Kiến nghị, phản ánh', TTRA_SUM.tcd.knpa], ['Nhiều nội dung, khác', TTRA_SUM.tcd.khac]] },
        /* tổng của thẻ = đơn ĐÃ xử lý (cộng 4 phần); "phải xử lý" chỉ ghi dòng phụ (bản trả lời BA, mục 82) */
        { type: 'shares', t: 'Kết quả phân loại, xử lý đơn', u: 'đơn', items: () => [['Thuộc thẩm quyền', TTRA_SUM.tcd.tq], ['Không thuộc thẩm quyền, đã chuyển', TTRA_SUM.tcd.chuyen], ['Không thuộc thẩm quyền, đã hướng dẫn', TTRA_SUM.tcd.huongDan], ['Không đủ điều kiện, lưu', TTRA_SUM.tcd.khongDk]],
          hint: () => 'Phải xử lý: ' + ctmF(TTRA_SUM.tcd.phaiXl) + ' đơn (kỳ trước chuyển sang ' + ctmF(TTRA_SUM.tcd.kyTruoc) + ' + đơn mới ' + ctmF(TTRA_SUM.tcd.donMoi) + ') · Chưa xử lý: ' + ctmF(TTRA_SUM.tcd.chuaXl) + ' đơn.' },
        { type: 'shares', t: 'Kết quả giải quyết vụ việc', u: 'vụ việc', items: () => [['Giải quyết đúng hạn', TTRA_SUM.tcd.dungHan], ['Giải quyết quá hạn', TTRA_SUM.tcd.quaHan], ['Đang xử lý trong hạn', TTRA_SUM.tcd.dangTh], ['Đang xử lý quá hạn', TTRA_SUM.tcd.dangQh], ['Rút đơn, đình chỉ', TTRA_SUM.tcd.rut]] }
      ] }
  ]
});

/* ============================== SỞ KHOA HỌC VÀ CÔNG NGHỆ (chuyển đổi số cấp xã) ============================== */
ctmSo({
  id: 'ubnd-khcn', name: 'Sở Khoa học và Công nghệ', ky: KHCN_KY,
  m: {
    cqR: ['Hộ có Internet cáp quang', '%', 1, () => soPc(KHCN_SUM.ht.hoCq, KHCN_SUM.ht.ho), null, '', 'Hộ có cáp quang'],
    smR: ['Người dùng điện thoại thông minh', '%', 1, () => soPc(KHCN_SUM.ht.sm, KHCN_SUM.ht.ds15), null, '', 'Dùng điện thoại thông minh'],
    hoCq: ['Hộ có Internet cáp quang', 'hộ', 0, () => KHCN_SUM.ht.hoCq, null, '', 'Hộ có cáp quang'],
    dvcR: ['Người dân dùng dịch vụ công trực tuyến', '%', 1, () => soPc(KHCN_SUM.cn.dvctt, KHCN_SUM.cn.dan), null, '', 'Dùng dịch vụ công trực tuyến'],
    dtdtR: ['Người dân có danh tính điện tử', '%', 1, () => soPc(KHCN_SUM.cn.dtdt, KHCN_SUM.cn.ds14), null, '', 'Có danh tính điện tử'],
    cksR: ['Người dân có chữ ký số', '%', 1, () => soPc(KHCN_SUM.cn.cks, KHCN_SUM.cn.dsTt), null, '', 'Có chữ ký số'],
    dvc: ['Người dân dùng dịch vụ công trực tuyến', 'người', 0, () => KHCN_SUM.cn.dvctt, null, '', 'Dùng dịch vụ công trực tuyến'],
    hs: ['Hồ sơ dịch vụ công trong tháng', 'hồ sơ', 0, () => KHCN_SUM.vb.hs, null, 'n', 'Hồ sơ dịch vụ công'],
    ttR: ['Hồ sơ trực tuyến toàn trình', '%', 1, () => KHCN_SUM.vb.toanTrinh, null, '', 'Trực tuyến toàn trình'],
    tttR: ['Thanh toán trực tuyến', '%', 1, () => soPc(KHCN_SUM.vb.tttt, KHCN_SUM.vb.nvtc), null, '', 'Thanh toán trực tuyến'],
    vbmR: ['Văn bản xử lý trên môi trường mạng', '%', 1, () => soPc(KHCN_SUM.vb.vbMang, KHCN_SUM.vb.vbNb), null, '', 'Văn bản trên môi trường mạng'],
    ksR: ['Văn bản ký số', '%', 1, () => soPc(KHCN_SUM.vb.vbKySo, KHCN_SUM.vb.vbCq), null, '', 'Văn bản ký số']
  },
  kpis: [['cqR', 'trên tổng số hộ'], ['smR', 'người từ 15 tuổi'], ['dvcR', 'trên dân số'], ['dtdtR', 'người từ 14 tuổi'], ['cksR', 'người trưởng thành'], ['ttR', 'tháng 9/2026'], ['tttR', 'hồ sơ có nghĩa vụ tài chính'], ['ksR', 'văn bản đi của cơ quan']],
  card: ['cqR', 'dvcR', 'ttR', 'ksR'],
  cardL: { cqR: 'Hộ có Internet cáp quang', dvcR: 'Người dân dùng dịch vụ công trực tuyến', ttR: 'Hồ sơ trực tuyến toàn trình', ksR: 'Văn bản ký số' },
  groups: [
    { id: 'ht', label: 'Hạ tầng, thiết bị số', note: 'Hạ tầng và thiết bị số tại 126 phường, xã', lines: ['cqR', 'smR'], xa: 'cq',
      cards: [
        { type: 'list', t: 'Tiêu chí hạ tầng cấp xã', head: ['Tiêu chí', 'Số phường, xã đạt'], rows: () => KHCN_SUM.ht.tieuChi.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 phường, xã tỷ lệ hộ có cáp quang thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [1], rows: () => KHCN_SUM.ht.cqThap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'cn', label: 'Con người, cộng đồng số', note: 'Người dân dùng dịch vụ số, danh tính điện tử, chữ ký số', lines: ['dvcR', 'dtdtR', 'cksR'], xa: 'dvc',
      cards: [
        { type: 'list', t: 'Tiêu chí cộng đồng số cấp xã', head: ['Tiêu chí', 'Số phường, xã đạt'], rows: () => KHCN_SUM.cn.tieuChi.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 phường, xã tỷ lệ dùng dịch vụ công trực tuyến thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [1], rows: () => KHCN_SUM.cn.dvcThap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'vb', label: 'Văn bản, dịch vụ công', note: 'Văn bản, quy trình và dịch vụ công trực tuyến (tháng 9/2026)', lines: ['ttR', 'tttR', 'vbmR', 'ksR'],
      cards: [
        { type: 'mbars', t: 'Tỷ lệ hồ sơ trực tuyến toàn trình theo tháng', labels: CTM_SO_M9, vals: () => KHCN_SUM.vb.xuHuong[0], u: '%', d: 1 },
        { type: 'shares', t: 'Phường, xã theo tỷ lệ toàn trình', u: 'đơn vị', items: () => KHCN_SUM.vb.nhom.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 phường, xã tỷ lệ toàn trình thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [1], rows: () => KHCN_SUM.vb.thap.map((r) => [r[0], r[1]]) }
      ] }
  ],
  xa: {
    units: () => KHCN_UNITS,
    inds: [
      { id: 'cq', l: 'Hộ có Internet cáp quang', u: '%', d: 1, tpm: 'cqR', f: (s) => soPc(s.ht.hoCq, s.ht.ho) },
      { id: 'sm', l: 'Người dùng điện thoại thông minh', u: '%', d: 1, tpm: 'smR', f: (s) => soPc(s.ht.sm, s.ht.ds15) },
      { id: 'dvc', l: 'Người dân dùng dịch vụ công trực tuyến', u: '%', d: 1, tpm: 'dvcR', f: (s) => soPc(s.cn.dvctt, s.cn.dan) },
      { id: 'dtdt', l: 'Người dân có danh tính điện tử', u: '%', d: 1, tpm: 'dtdtR', f: (s) => soPc(s.cn.dtdt, s.cn.ds14) },
      { id: 'cks', l: 'Người dân có chữ ký số', u: '%', d: 1, tpm: 'cksR', f: (s) => soPc(s.cn.cks, s.cn.dsTt) }
    ]
  }
});

/* ============================== SỞ NÔNG NGHIỆP VÀ MÔI TRƯỜNG (10 eform + 2 chỉ tiêu số thật) ============================== */
/* 2 chỉ tiêu số thật: lấy từ dashboard-nong-nghiep.js (NNMT_GPMB_*, NNMT_DATDAI_*); chưa nạp file đó thì dùng bản sao cùng số */
function ctmNnmtThat() {
  const ok = typeof NNMT_GPMB_CATS !== 'undefined' && typeof NNMT_DATDAI_CATS !== 'undefined';
  return ok ? { gc: NNMT_GPMB_CATS, gi: NNMT_GPMB_INVEST, gk: NNMT_GPMB_KINHPHI, gp: NNMT_GPMB_PROJECTS, dc: NNMT_DATDAI_CATS, ds: NNMT_DATDAI_SERIES[0].data, dg: NNMT_DATDAI_SERIES[1].data }
    : { gc: ['Các dự án đầu tư xây dựng cầu', 'Các đường vành đai', 'Các Dự án cải tạo, nâng cấp đường giao thông đường bộ'], gi: [754166193378, 3772, 22492140852], gk: [711955448286, 2587, 106129450930], gp: [5, 3, 6],
      dc: ['Nhóm đất nông nghiệp', 'Nhóm đất phi nông nghiệp', 'Nhóm đất chưa sử dụng'], ds: [173264, 138336, 2342], dg: [22042, 66659, 2338] };
}
ctmSo({
  id: 'ubnd-nnmt', name: 'Sở Nông nghiệp và Môi trường', short: 'Sở NN&MT', ky: '9 tháng năm 2026', ck: '9 tháng năm 2025',
  m: {
    /* Bộ tiêu chí 2026–2030 (QĐ 51/2025/QĐ-TTg): bỏ mức "nâng cao", "kiểu mẫu" (bản trả lời BA mục 23, 24) */
    ntm: ['Xã đạt chuẩn nông thôn mới giai đoạn 2026–2030', 'xã', 0, () => NM_SUM.ntm.muc26[0], null, '', 'Xã đạt chuẩn (2026–2030)'],
    ntmHd: ['Xã đạt chuẩn nông thôn mới hiện đại', 'xã', 0, () => NM_SUM.ntm.muc26[1], null, '', 'Nông thôn mới hiện đại'],
    ntmChua: ['Xã chưa đạt chuẩn theo bộ tiêu chí mới', 'xã', 0, () => NM_SUM.ntm.muc26[2], null, 'n', 'Chưa đạt chuẩn'],
    ntmHs: ['Xã đủ 10/10 tiêu chí, đang hoàn thiện hồ sơ công nhận', 'xã', 0, () => NM_SUM.ntm.hoSo, null, '', 'Đang hoàn thiện hồ sơ'],
    ntmTc: ['Số tiêu chí bình quân đã đạt (trên 10)', 'tiêu chí', 1, () => NM_SUM.ntm.tcTb, null, '', 'Tiêu chí bình quân đã đạt'],
    th: ['Diện tích rừng bị thiệt hại', 'ha', 1, () => NM_SUM.rungTh.ha, () => NM_SUM.rungTh.cungKy, 'i', 'Rừng bị thiệt hại'],
    thVu: ['Vụ thiệt hại rừng', 'vụ', 0, () => soSum(NM_SUM.rungTh.nnVu), null, 'i', 'Số vụ'],
    tm: ['Diện tích rừng trồng mới tập trung', 'ha', 1, () => NM_SUM.rungTm.ha, () => NM_SUM.rungTm.cungKy, '', 'Rừng trồng mới'],
    tmKh: ['Kế hoạch trồng rừng năm', 'ha', 1, () => NM_SUM.rungTm.kh, null, 'np', 'Kế hoạch năm'],
    tmR: ['Rừng trồng mới so kế hoạch năm', '%', 1, () => soPc(NM_SUM.rungTm.ha, NM_SUM.rungTm.kh), null, '', 'So kế hoạch năm'],
    nvKh: ['Kế hoạch vốn Chương trình nông thôn mới', 'tỷ đồng', 0, () => NM_SUM.ntmVon.kh / 1000, null, 'np', 'Kế hoạch vốn'],
    nvGn: ['Giải ngân Chương trình nông thôn mới', 'tỷ đồng', 0, () => NM_SUM.ntmVon.gn / 1000, () => NM_SUM.ntmVon.cungKy / 1000, '', 'Giải ngân lũy kế'],
    nvR: ['Giải ngân nông thôn mới so kế hoạch', '%', 1, () => soPc(NM_SUM.ntmVon.gn, NM_SUM.ntmVon.kh), null, '', 'Giải ngân so kế hoạch'],
    gvKh: ['Kế hoạch vốn Chương trình giảm nghèo', 'tỷ đồng', 1, () => NM_SUM.gnVon.kh / 1000, null, 'np', 'Kế hoạch vốn'],
    gvGn: ['Giải ngân Chương trình giảm nghèo', 'tỷ đồng', 1, () => NM_SUM.gnVon.gn / 1000, () => NM_SUM.gnVon.cungKy / 1000, '', 'Giải ngân lũy kế'],
    gvR: ['Giải ngân giảm nghèo so kế hoạch', '%', 1, () => soPc(NM_SUM.gnVon.gn, NM_SUM.gnVon.kh), null, '', 'Giải ngân so kế hoạch'],
    qt: ['Số liệu quan trắc khí tượng thủy văn', 'bản tin', 0, () => NM_SUM.kttv.tong[0], () => NM_SUM.kttv.cungKy[0], 'n', 'Số liệu quan trắc'],
    dbao: ['Bản tin dự báo', 'bản tin', 0, () => NM_SUM.kttv.tong[1], () => NM_SUM.kttv.cungKy[1], 'n'],
    cb: ['Cảnh báo thiên tai', 'bản tin', 0, () => NM_SUM.kttv.tong[2], () => NM_SUM.kttv.cungKy[2], 'n'],
    ct: ['Công trình phòng chống thiên tai theo dõi', 'công trình', 0, () => soSum(NM_SUM.pctt.loai), null, 'n', 'Công trình theo dõi'],
    ctCx: ['Công trình cần xử lý', 'công trình', 0, () => NM_SUM.pctt.canXuLy, null, 'i', 'Cần xử lý'],
    de: ['Chiều dài đê điều', 'km', 1, () => NM_SUM.pctt.km, null, 'n'],
    /* hỗ trợ lương thực tính theo LƯỢT NGƯỜI (bản trả lời BA, mục 35 – 37): định mức theo người (NĐ 20/2021/NĐ-CP, 15 kg/người/tháng);
       số hộ chỉ để tham khảo, đề nghị Sở thêm trường «Số hộ» riêng */
    nguoi: ['Lượt người được hỗ trợ lương thực', 'lượt người', 0, () => NM_SUM.hoTro.nguoi, () => NM_SUM.hoTro.cungKy.nguoi, 'n', 'Lượt người được hỗ trợ'],
    ho: ['Hộ được hỗ trợ lương thực', 'hộ', 0, () => NM_SUM.hoTro.ho, () => NM_SUM.hoTro.cungKy.ho, 'n', 'Hộ được hỗ trợ'],
    gao: ['Gạo hỗ trợ', 'tấn', 1, () => NM_SUM.hoTro.gaoTan, () => NM_SUM.hoTro.cungKy.gaoTan, 'n', 'Gạo hỗ trợ'],
    bd: ['Sản phẩm bản đồ, ảnh viễn thám', 'sản phẩm', 0, () => NM_SUM.banDo.n, () => NM_SUM.banDo.cungKy, '', 'Sản phẩm bản đồ, viễn thám'],
    /* 2 chỉ tiêu số liệu thật (giữ nguyên số của khuôn cũ, dashboard-nong-nghiep.js) */
    gpmbDa: ['Dự án giải phóng mặt bằng giao thông (tuần 01/2026)', 'dự án', 0, () => soSum(ctmNnmtThat().gp), null, 'n', 'Dự án giải phóng mặt bằng'],
    gpmbKp: ['Kinh phí giải phóng mặt bằng (tuần 01/2026)', 'tỷ đồng', 1, () => soSum(ctmNnmtThat().gk) / 1e9, null, 'n', 'Kinh phí giải phóng mặt bằng'],
    ddSd: ['Diện tích đất đang sử dụng (năm 2025)', 'ha', 0, () => soSum(ctmNnmtThat().ds), null, 'n', 'Diện tích sử dụng']
  },
  kpis: [['ntm', () => 'bộ tiêu chí mới · ' + NM_SUM.ntm.hoSo + ' xã đang hoàn thiện hồ sơ'], ['th', '9 tháng'], ['tm', '9 tháng'], ['nvGn', 'lũy kế đến tháng 9'], ['gvGn', 'lũy kế đến tháng 9'], ['cb', '9 tháng'], ['nguoi', '9 tháng'], ['gpmbKp', 'tuần 01/2026']],
  /* eform không có kế hoạch dạng số, không có «Số hộ» (phản hồi 13/10/2026) */
  an: (NNMT_SHOW_KE_HOACH ? [] : ['tmKh', 'tmR', 'nvKh', 'nvR', 'gvKh', 'gvR']).concat(NNMT_SHOW_SO_HO ? [] : ['ho']),
  card: ['ntm', 'tm', 'nvGn', 'nguoi'],
  cardL: { ntm: 'Xã đạt chuẩn nông thôn mới 2026–2030', tm: 'Rừng trồng mới tập trung', nvGn: 'Giải ngân nông thôn mới', nguoi: 'Lượt người được hỗ trợ lương thực' },
  groups: [
    { id: 'ntm', label: 'Nông thôn mới', note: 'Theo bộ tiêu chí quốc gia 2026–2030 (10 tiêu chí, hiệu lực từ 15/02/2026), Quý III/2026. Kết quả theo bộ tiêu chí 2021–2025 (382/382 xã trước sắp xếp đạt chuẩn) là số lịch sử, không còn các mức nâng cao, kiểu mẫu.',
      lines: ['ntm', 'ntmHd', 'ntmHs', 'ntmChua', 'ntmTc'],
      cards: [{ type: 'shares', t: 'Xã theo mức đạt chuẩn (bộ tiêu chí 2026–2030)', u: 'xã', items: () => ctmSoZip(NM_MUC26, NM_SUM.ntm.muc26) },
        { type: 'mbars', t: 'Xã chưa đạt chuẩn theo số tiêu chí đã đạt (trên 10)', labels: NM_SUM.ntm.tc10.map((r) => r[0] + ' tiêu chí'), vals: () => NM_SUM.ntm.tc10.map((r) => r[1]), u: 'xã', l1: 'Số xã',
          hint: () => NM_SUM.ntm.hoSo + ' xã đủ 10/10 tiêu chí đang hoàn thiện hồ sơ đề nghị công nhận.' }] },
    { id: 'rung', label: 'Rừng', note: 'Diện tích rừng bị thiệt hại, rừng trồng mới tập trung', lines: ['tm', 'th', 'tmKh', 'thVu', 'tmR'],
      cards: [
        NNMT_SHOW_KE_HOACH ? { type: 'mbars', t: 'Rừng trồng mới lũy kế so kế hoạch', labels: CTM_SO_M9, vals: () => NM_SUM.rungTm.lkT, vals2: () => NM_SUM.rungTm.khT, l1: 'Đã trồng', l2: 'Kế hoạch', u: 'ha', d: 1 }
          : { type: 'mbars', t: 'Rừng trồng mới lũy kế theo tháng', labels: CTM_SO_M9, vals: () => NM_SUM.rungTm.lkT, l1: 'Đã trồng', u: 'ha', d: 1 },
        { type: 'shares', t: 'Rừng trồng mới theo loại rừng', u: 'ha', d: 1, items: () => ctmSoZip(NM_LOAI_RUNG, NM_SUM.rungTm.loaiHa) },
        { type: 'shares', t: 'Rừng bị thiệt hại theo nguyên nhân', u: 'ha', d: 1, items: () => ctmSoZip(NM_TH, NM_SUM.rungTh.nnHa) },
        { type: 'list', t: 'Xã có rừng bị thiệt hại', head: ['Xã', 'Diện tích (ha)'], d: [2], rows: () => NM_SUM.rungTh.top.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'ntmVon', label: 'Vốn nông thôn mới', note: 'Chương trình mục tiêu quốc gia xây dựng nông thôn mới (lũy kế đến tháng 9/2026)', lines: ['nvGn', 'nvKh', 'nvR'],
      cards: [
        { type: 'mbars', t: 'Giải ngân lũy kế, so cùng kỳ', labels: CTM_SO_M9, vals: () => NM_SUM.ntmVon.luyKeT.map((v) => v / 1000), vals2: () => NM_SUM.ntmVon.cungKyT.map((v) => v / 1000), l1: 'Năm 2026', l2: 'Cùng kỳ 2025', u: 'tỷ đồng' },
        { type: 'shares', t: 'Giải ngân theo nguồn', u: 'tỷ đồng', items: () => NM_NGUON.map((l, i) => [l, NM_SUM.ntmVon.nguon[i] / 1000]).filter((r) => r[1] > 0) },
        { type: 'list', t: 'Xã giải ngân nhiều nhất', head: ['Xã', 'Giải ngân (tỷ đồng)'], d: [1], rows: () => NM_SUM.ntmVon.top.map((r) => [r[0], r[1] / 1000]) }
      ] },
    { id: 'gnVon', label: 'Vốn giảm nghèo', note: 'Chương trình mục tiêu quốc gia giảm nghèo bền vững (lũy kế đến tháng 9/2026)', lines: ['gvGn', 'gvKh', 'gvR'],
      cards: [
        { type: 'shares', t: 'Giải ngân theo nội dung', u: 'tỷ đồng', d: 1, items: () => NM_GN_ND.map((l, i) => [l, NM_SUM.gnVon.nd[i] / 1000]) },
        { type: 'list', t: 'Xã, phường giải ngân nhiều nhất', head: ['Xã, phường', 'Giải ngân (tỷ đồng)'], d: [2], rows: () => NM_SUM.gnVon.top.map((r) => [r[0], r[1] / 1000]) }
      ] },
    { id: 'kttv', label: 'Khí tượng thủy văn, thiên tai', note: 'Thông tin khí tượng thủy văn; công trình phòng chống thiên tai', lines: ['qt', 'dbao', 'cb', 'ct', 'ctCx', 'de'],
      cards: [
        { type: 'shares', t: 'Công trình phòng chống thiên tai theo loại', u: 'công trình', items: () => ctmSoZip(NM_PCTT_LOAI, NM_SUM.pctt.loai).filter((r) => r[1] > 0) },
        { type: 'list', t: 'Xã, phường có nhiều điểm cần theo dõi', head: ['Xã, phường', 'Điểm'], rows: () => NM_SUM.pctt.topDiem.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'hoTro', label: 'Hỗ trợ lương thực', note: 'Lượt người được hỗ trợ lương thực do thiên tai, hỏa hoạn, giáp hạt và lý do bất khả kháng (một người nhận nhiều đợt tính nhiều lượt)', lines: ['nguoi', 'ho', 'gao'],
      cards: [
        { type: 'shares', t: 'Lượt người được hỗ trợ theo lý do', u: 'lượt người', items: () => ctmSoZip(NM_LD, NM_SUM.hoTro.ldNguoi).filter((r) => r[1] > 0) },
        /* eform không có ngày bắt đầu đợt → xếp theo «Tháng» của kỳ báo cáo (quy ước 4, phản hồi 13/10/2026) */
        { type: 'mbars', t: 'Lượt người được hỗ trợ theo tháng', labels: CTM_SO_M9, vals: () => NM_SUM.hoTro.thangNguoi, u: 'lượt người',
          hint: 'Theo tháng báo cáo (eform không có ngày bắt đầu đợt hỗ trợ).' },
        NNMT_SHOW_SO_HO ? { type: 'list', t: 'Xã, phường có nhiều lượt người được hỗ trợ', head: ['Xã, phường', 'Lượt người', 'Hộ'], rows: () => NM_SUM.hoTro.topNguoi.map((r) => [r[0], r[1], r[2]]) }
          : { type: 'list', t: 'Xã, phường có nhiều lượt người được hỗ trợ', head: ['Xã, phường', 'Lượt người'], rows: () => NM_SUM.hoTro.topNguoi.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'banDo', label: 'Bản đồ, ảnh viễn thám', note: 'Dữ liệu bản đồ và ảnh viễn thám', lines: ['bd'],
      cards: [{ type: 'shares', t: 'Theo loại sản phẩm', u: 'sản phẩm', items: () => ctmSoZip(NM_BD_LOAI, NM_SUM.banDo.loai) }, { type: 'mbars', t: 'Sản phẩm theo tháng', labels: CTM_SO_M9, vals: () => NM_SUM.banDo.thang, u: 'sản phẩm' }] },
    { id: 'that', label: 'Giải phóng mặt bằng, đất đai', note: 'Hai chỉ tiêu số liệu thật: tổng hợp giải phóng mặt bằng (tuần 01/2026) và thống kê sử dụng đất đai (năm 2025)', lines: ['gpmbKp', 'gpmbDa', 'ddSd'],
      cards: [
        { type: 'list', t: 'Giải phóng mặt bằng các dự án giao thông (tuần 01/2026)', head: ['Nhóm dự án', 'Dự án', 'Tổng mức đầu tư (tỷ đồng)', 'Kinh phí giải phóng mặt bằng (tỷ đồng)'], d: [0, 1, 1],
          rows: () => { const T = ctmNnmtThat(); return T.gc.map((l, i) => [l, T.gp[i], T.gi[i] / 1e9, T.gk[i] / 1e9]); } },
        { type: 'list', t: 'Tình hình sử dụng đất đai (năm 2025, ha)', head: ['Nhóm đất', 'Diện tích sử dụng', 'Được giao quản lý'],
          rows: () => { const T = ctmNnmtThat(); return T.dc.map((l, i) => [l, T.ds[i], T.dg[i]]); } }
      ] }
  ],
  note: 'số liệu theo 10 eform của Sở, 9 tháng năm 2026 (nông thôn mới theo Quý III/2026); các chỉ tiêu có số cùng kỳ năm 2025 thì so với cùng kỳ. Rừng bị thiệt hại giảm hiển thị màu xanh. Hai chỉ tiêu giải phóng mặt bằng, đất đai là số liệu thật, ghi rõ kỳ ở từng thẻ.'
});

/* ============================== SỞ CÔNG THƯƠNG ============================== */
ctmSo({
  id: 'ubnd-congthuong', name: 'Sở Công Thương', ky: SCT_KY, ck: '9 tháng năm 2025',
  m: {
    xk: ['Kim ngạch xuất khẩu', 'triệu USD', 0, () => SCT_SUM.xnk.xk, () => SCT_SUM.xnk.xkCk, '', 'Xuất khẩu'],
    nk: ['Kim ngạch nhập khẩu', 'triệu USD', 0, () => SCT_SUM.xnk.nk, () => SCT_SUM.xnk.nkCk, 'n', 'Nhập khẩu'],
    dnX: ['Doanh nghiệp xuất nhập khẩu báo cáo', 'doanh nghiệp', 0, () => SCT_SUM.xnk.soDn, null, 'n', 'Doanh nghiệp báo cáo'],
    bl: ['Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng', 'tỷ đồng', 0, () => SCT_SUM.bl.tong, () => SCT_SUM.bl.ck, '', 'Tổng mức bán lẻ và dịch vụ'],
    blH: ['Bán lẻ hàng hóa', 'tỷ đồng', 0, () => SCT_SUM.bl.banLe, null, '', 'Bán lẻ hàng hóa'],
    blD: ['Doanh thu dịch vụ tiêu dùng', 'tỷ đồng', 0, () => SCT_SUM.bl.dichVu, null, '', 'Doanh thu dịch vụ'],
    b2c: ['Doanh số bán hàng qua mạng', 'tỷ đồng', 0, () => SCT_SUM.bl.tmdtB2c, null, '', 'Bán hàng qua mạng'],
    b2cR: ['Bán hàng qua mạng trên tổng mức bán lẻ', '%', 1, () => soPc(SCT_SUM.bl.tmdtB2c, SCT_SUM.bl.banLe), null, '', 'Bán hàng qua mạng'],
    hkdR: ['Hộ kinh doanh đạt chuẩn thương mại điện tử', '%', 1, () => SCT_SUM.tmdt.tl[2], null, '', 'Hộ kinh doanh'],
    dnnvR: ['Doanh nghiệp nhỏ và vừa đạt chuẩn thương mại điện tử', '%', 1, () => SCT_SUM.tmdt.tl[0], null, '', 'Doanh nghiệp nhỏ và vừa'],
    dien: ['Điện năng tiêu thụ', 'triệu kWh', 0, () => SCT_SUM.nl.dien, () => SCT_SUM.nl.dienCk, 'n', 'Điện năng'],
    xd: ['Xăng dầu tiêu thụ', 'nghìn m³', 0, () => SCT_SUM.nl.xangDau, () => SCT_SUM.nl.xangDauCk, 'n', 'Xăng dầu'],
    than: ['Than tiêu thụ', 'nghìn tấn', 1, () => SCT_SUM.nl.than, () => SCT_SUM.nl.thanCk, 'n', 'Than'],
    /* eform chỉ có giá trị sản xuất theo giá hiện hành của doanh nghiệp tự báo cáo, nên KHÔNG gọi là chỉ số sản xuất công nghiệp
       (chỉ số chính thức tính theo khối lượng sản phẩm, quyền số của cơ quan thống kê) — bản trả lời BA, mục 40 – 41 */
    iip: ['Chỉ số giá trị sản xuất của doanh nghiệp công nghiệp báo cáo (cùng kỳ năm trước = 100)', '', 1, () => SCT_SUM.iip.chung, null, 'n', 'Giá trị sản xuất so cùng kỳ (= 100)'],
    gtsx: ['Giá trị sản xuất công nghiệp', 'tỷ đồng', 0, () => SCT_SUM.iip.gtsx, null, '', 'Giá trị sản xuất'],
    dnCn: ['Doanh nghiệp công nghiệp báo cáo', 'doanh nghiệp', 0, () => SCT_SUM.iip.soDn, null, 'n', 'Doanh nghiệp báo cáo']
  },
  kpis: [['xk', '9 tháng'], ['nk', '9 tháng'], ['bl', '9 tháng'], ['b2cR', 'trên bán lẻ hàng hóa'], ['hkdR', 'tháng 9/2026'], ['dien', '9 tháng'], ['xd', '9 tháng'], ['iip', '9 tháng (cùng kỳ = 100)']],
  card: ['xk', 'bl', 'dien', 'iip'],
  cardL: { xk: 'Kim ngạch xuất khẩu', bl: 'Bán lẻ hàng hóa và dịch vụ tiêu dùng', dien: 'Điện năng tiêu thụ', iip: 'Giá trị sản xuất công nghiệp so cùng kỳ' },
  groups: [
    { id: 'xnk', label: 'Xuất khẩu, nhập khẩu', note: 'Kim ngạch xuất khẩu, nhập khẩu (triệu USD)', lines: ['xk', 'nk', 'dnX'], xa: 'xk',
      cards: [
        { type: 'mbars', t: 'Kim ngạch theo tháng', labels: CTM_SO_M9, vals: () => SCT_SUM.xnk.xkT, vals2: () => SCT_SUM.xnk.nkT, l1: 'Xuất khẩu', l2: 'Nhập khẩu', u: 'triệu USD' },
        { type: 'list', t: 'Theo thị trường', head: ['Thị trường', 'Xuất khẩu', 'Nhập khẩu'], rows: () => SCT_THI_TRUONG.map((t, i) => [t[0], SCT_SUM.xnk.ttXk[i], SCT_SUM.xnk.ttNk[i]]) },
        { type: 'shares', t: 'Xuất khẩu theo ngành hàng', u: 'triệu USD', items: () => ctmSoZip(SCT_NGANH_XK, SCT_SUM.xnk.nganh) }
      ] },
    { id: 'bl', label: 'Bán lẻ, dịch vụ tiêu dùng', note: 'Tổng mức bán lẻ hàng hóa và doanh thu dịch vụ tiêu dùng (tỷ đồng)', lines: ['bl', 'blH', 'blD', 'b2c'], xa: 'bl',
      cards: [
        { type: 'mbars', t: 'Theo tháng', labels: CTM_SO_M9, vals: () => SCT_SUM.bl.blT, vals2: () => SCT_SUM.bl.dvT, l1: 'Bán lẻ hàng hóa', l2: 'Doanh thu dịch vụ', u: 'tỷ đồng' },
        { type: 'shares', t: 'Theo loại hình kinh doanh', u: 'tỷ đồng', items: () => ctmSoZip(SCT_LH, SCT_SUM.bl.lh) }
      ] },
    { id: 'tmdt', label: 'Thương mại điện tử', note: 'Đối tượng đạt chuẩn ứng dụng thương mại điện tử (tháng 9/2026)', lines: ['hkdR', 'dnnvR', 'b2cR'], xa: 'hkd',
      cards: [{ type: 'list', t: 'Theo đối tượng', head: ['Đối tượng', 'Tổng số', 'Đạt chuẩn', 'Tỷ lệ (%)'], d: [0, 0, 1], rows: () => SCT_TMDT.map((d, i) => [d[0], SCT_SUM.tmdt.tong[i], SCT_SUM.tmdt.dat[i], SCT_SUM.tmdt.tl[i]]) }] },
    { id: 'nl', label: 'Điện năng, xăng dầu, than', note: 'Tiêu thụ điện năng, xăng dầu, than', lines: ['dien', 'xd', 'than'], xa: 'dien',
      cards: [{ type: 'mbars', t: 'Điện năng theo tháng', labels: CTM_SO_M9, vals: () => SCT_SUM.nl.dienT, u: 'triệu kWh', hint: 'Nắng nóng tháng 5 – 8 tiêu thụ điện cao.' }] },
    { id: 'iip', label: 'Sản xuất công nghiệp', note: 'Giá trị sản xuất của các doanh nghiệp công nghiệp báo cáo qua eform, theo giá hiện hành. Đây không phải chỉ số sản xuất công nghiệp chính thức của cơ quan thống kê (tính theo khối lượng sản phẩm).', lines: ['gtsx', 'dnCn', 'iip'], xa: 'gtsx',
      cards: [
        /* mức tăng = (giá trị sản xuất kỳ này ÷ cùng kỳ − 1) × 100, trên cùng tập doanh nghiệp báo cáo cả hai kỳ (BA mục 40) */
        { type: 'list', t: 'Mức tăng giá trị sản xuất theo ngành (doanh nghiệp báo cáo, giá hiện hành)', head: ['Ngành', 'Giá trị sản xuất (tỷ đồng)', 'Mức tăng so cùng kỳ (%)', 'Tháng 9 so tháng 8 (tháng 8 = 100)'], d: [0, 1, 1], rows: () => SCT_NGANH.map((x, i) => [x[0], SCT_SUM.iip.nganhGt[i], x[2] - 100, x[3]]) },
        /* chỉ số = giá trị sản xuất tháng này ÷ tháng trước × 100, đường có mốc 100 (BA mục 41) */
        { type: 'mbars', t: 'Giá trị sản xuất tháng so với tháng trước (tháng trước = 100)', labels: CTM_SO_M9, vals: () => SCT_SUM.iip.thang, u: '%', d: 1, idx: true }
      ] }
  ],
  xa: {
    units: () => SCT_UNITS,
    inds: [
      { id: 'xk', l: 'Kim ngạch xuất khẩu', u: 'triệu USD', tot: true, f: (s) => s.xk },
      { id: 'bl', l: 'Bán lẻ hàng hóa và doanh thu dịch vụ', u: 'tỷ đồng', tot: true, f: (s) => s.banLe + s.dichVu },
      { id: 'blpc', l: 'Bán lẻ, dịch vụ bình quân đầu người', u: 'triệu đồng/người', d: 1, f: (s, u) => (s.banLe + s.dichVu) * 1000 / u.ds },
      { id: 'hkd', l: 'Hộ kinh doanh đạt chuẩn thương mại điện tử', u: '%', d: 1, tpm: 'hkdR', f: (s) => soPc(s.tmdtDat[2], s.tmdtTong[2]) },
      { id: 'dien', l: 'Điện năng tiêu thụ', u: 'triệu kWh', tot: true, f: (s) => s.dien },
      { id: 'gtsx', l: 'Giá trị sản xuất công nghiệp', u: 'tỷ đồng', tot: true, f: (s) => s.gtsx }
    ]
  }
});

/* ============================== SỞ XÂY DỰNG ============================== */
ctmSo({
  id: 'ubnd-xaydung', name: 'Sở Xây dựng', ky: SXD_KY, ck: '9 tháng năm 2025',
  m: {
    san: ['Diện tích sàn nhà ở hoàn thành', 'nghìn m²', 0, () => SXD_SUM.nha.sanTong, () => SXD_SUM.nha.ck, '', 'Diện tích sàn hoàn thành'],
    /* nhà ở: chỉ «Tình trạng công trình» = Đã hoàn thành; các tình trạng khác là số phát sinh riêng, không cộng (phản hồi 13/10/2026) */
    ct: ['Công trình nhà ở hoàn thành', 'công trình', 0, () => SXD_SUM.nha.ctTong, null, 'n', 'Công trình hoàn thành'],
    noxh: ['Diện tích sàn nhà ở xã hội hoàn thành', 'nghìn m²', 0, () => SXD_SUM.nha.noxh, null, '', 'Nhà ở xã hội'],
    /* hành khách, hàng hóa: một đơn vị nghìn lượt, nghìn tấn ở mọi chỗ (quy tắc H2, H3); eform nhập lượt (HK), tấn — IOC chia 1.000 (BA mục 62–67) */
    hk: ['Hành khách vận tải của các đơn vị vận tải', 'nghìn lượt', 0, () => SXD_SUM.vt.tong, () => SXD_SUM.vt.ck, '', 'Hành khách vận tải'],
    dvVt: ['Đơn vị vận tải báo cáo', 'đơn vị', 0, () => SXD_SUM.vt.soDv, null, 'n'],
    cl: ['Cự ly bình quân một lượt', 'km', 1, () => SXD_SUM.vt.cuLy, null, 'n', 'Cự ly bình quân'],
    nc: ['Điểm nguy cơ sạt lở, úng ngập trên tuyến đường', 'điểm', 0, () => SXD_SUM.nc.n, null, 'i', 'Điểm nguy cơ'],
    ncCx: ['Điểm nguy cơ chưa xử lý', 'điểm', 0, () => SXD_SUM.nc.chuaXl, null, 'i', 'Chưa xử lý'],
    ncCao: ['Điểm nguy cơ mức cao, rất cao', 'điểm', 0, () => SXD_SUM.nc.caoTro, null, 'i', 'Mức cao, rất cao'],
    hh: ['Hàng hóa vận chuyển', 'nghìn tấn', 0, () => SXD_SUM.vtdl.hh, () => SXD_SUM.vtdl.hhCk, '', 'Hàng hóa vận chuyển'],
    hhKm: ['Hàng hóa luân chuyển', 'triệu tấn.km', 0, () => SXD_SUM.vtdl.hhKm / 1000, null, '', 'Hàng hóa luân chuyển'],
    hkKm: ['Hành khách luân chuyển', 'triệu lượt.km', 0, () => SXD_SUM.vtdl.hkKm / 1000, null, '', 'Hành khách luân chuyển']
  },
  kpis: [['san', '9 tháng'], ['noxh', '9 tháng'], ['hk', '9 tháng'], ['nc', 'tháng 9/2026'], ['ncCx', 'tháng 9/2026'], ['hh', '9 tháng'], ['hhKm', '9 tháng'], ['hkKm', '9 tháng']],
  card: ['san', 'hk', 'hh', 'nc'],
  cardL: { san: 'Diện tích sàn nhà ở hoàn thành', hk: 'Hành khách vận tải', hh: 'Hàng hóa vận chuyển', nc: 'Điểm nguy cơ sạt lở, úng ngập' },
  groups: [
    { id: 'nha', label: 'Nhà ở', note: 'Nhà ở hoàn thành theo loại công trình (nghìn m² sàn)', lines: ['san', 'noxh', 'ct'], xa: 'san',
      cards: [
        { type: 'mbars', t: 'Diện tích sàn hoàn thành theo tháng', labels: CTM_SO_M9, vals: () => SXD_SUM.nha.sanT, u: 'nghìn m²' },
        { type: 'list', t: 'Theo loại công trình', head: ['Loại công trình', 'Diện tích sàn (nghìn m²)', 'Công trình'], rows: () => SXD_LCT.map((l, i) => [l, SXD_SUM.nha.san[i], SXD_SUM.nha.ct[i]]) },
        { type: 'list', t: 'Xã, phường hoàn thành nhiều nhất', head: ['Xã, phường', 'Diện tích sàn (nghìn m²)'], d: [1], rows: () => SXD_SUM.nha.top.map((r) => [r[0], r[1]]) },
        { type: 'list', t: 'Diện tích sàn theo tình trạng', head: ['Tình trạng công trình', 'Diện tích sàn (nghìn m²)'], rows: () => SXD_TTCT.map((x, i) => [x[0], SXD_SUM.nha.sanTT[i]]),
          hint: 'Mỗi tình trạng là diện tích phát sinh trong kỳ; một công trình đi qua nhiều tình trạng nên không cộng các tình trạng với nhau.' }
      ] },
    { id: 'vt', label: 'Vận tải hành khách', note: 'Vận tải hành khách của các đơn vị vận tải', lines: ['hk', 'dvVt', 'cl'], xa: 'hk',
      cards: [
        { type: 'mbars', t: 'Hành khách theo tháng', labels: CTM_SO_M9, vals: () => SXD_SUM.vt.hkT, u: 'nghìn lượt' },
        { type: 'shares', t: 'Theo loại hình', u: 'nghìn lượt', items: () => ctmSoZip(SXD_VT, SXD_SUM.vt.nhom) }
      ].concat(SXD_SHOW_METRO_TUYEN ? [   // eform không có trường «Tuyến» → ẩn
        { type: 'list', t: 'Đường sắt đô thị', head: ['Tuyến', 'Hành khách (nghìn lượt)'], rows: () => SXD_SUM.vt.metro.map((r) => [r[0], r[1]]) }] : []) },
    { id: 'nc', label: 'Điểm nguy cơ trên tuyến đường', note: 'Điểm nguy cơ sạt lở, úng ngập trên tuyến đường (tháng 9/2026)', lines: ['nc', 'ncCx', 'ncCao'], xa: 'diem',
      cards: [
        { type: 'shares', t: 'Theo loại nguy cơ', u: 'điểm', items: () => ctmSoZip(SXD_LNC, SXD_SUM.nc.loai) },
        { type: 'shares', t: 'Theo tình trạng xử lý', u: 'điểm', items: () => ctmSoZip(SXD_TTXL, SXD_SUM.nc.tt) }
      ] },
    { id: 'vtdl', label: 'Vận chuyển, luân chuyển', note: 'Khối lượng vận chuyển, luân chuyển hành khách và hàng hóa', lines: ['hh', 'hhKm', 'hkKm'], xa: 'hh',
      cards: [
        { type: 'shares', t: 'Hàng hóa vận chuyển theo loại hình', u: 'nghìn tấn', items: () => ctmSoZip(SXD_LHVT, SXD_SUM.vtdl.hhLh).filter((r) => r[1] > 0) },
        { type: 'list', t: 'Xã, phường vận chuyển hàng hóa nhiều nhất', head: ['Xã, phường', 'Hàng hóa (nghìn tấn)'], rows: () => SXD_SUM.vtdl.topHh.map((r) => [r[0], r[1]]) }
      ] }
  ],
  xa: {
    units: () => SXD_UNITS,
    inds: [
      { id: 'san', l: 'Diện tích sàn nhà ở hoàn thành', u: 'nghìn m²', tot: true, f: (s) => soSum(s.nhaSan) },
      { id: 'hk', l: 'Hành khách vận tải', u: 'nghìn lượt', tot: true, f: (s) => soSum(s.hk) },
      { id: 'hh', l: 'Hàng hóa vận chuyển', u: 'nghìn tấn', tot: true, f: (s) => soSum(s.hh) },
      { id: 'diem', l: 'Điểm nguy cơ sạt lở, úng ngập', u: 'điểm', tot: true, better: 'low', f: (s) => s.diem }
    ]
  }
});

/* ============================== SỞ NỘI VỤ (2 eform + 5 chỉ tiêu số thật) ============================== */
ctmSo({
  id: 'ubnd-noivu', name: 'Sở Nội vụ', ky: SNV_KY,
  m: {
    bhxhR: ['Lực lượng lao động tham gia bảo hiểm xã hội', '%', 1, () => soPc(SNV_SUM.bh.bhxh, SNV_SUM.bh.llld), null, '', 'Bảo hiểm xã hội'],
    bhtnR: ['Lực lượng lao động tham gia bảo hiểm thất nghiệp', '%', 1, () => soPc(SNV_SUM.bh.bhtn, SNV_SUM.bh.llld), null, '', 'Bảo hiểm thất nghiệp'],
    bhxh: ['Người tham gia bảo hiểm xã hội', 'người', 0, () => SNV_SUM.bh.bhxh, null, '', 'Tham gia bảo hiểm xã hội'],
    huong: ['Người hưởng chế độ bảo hiểm xã hội', 'người', 0, () => SNV_SUM.bh.nguoiHuong, null, 'n', 'Người hưởng chế độ'],
    tkR: ['Chi trả qua tài khoản', '%', 1, () => soPc(SNV_SUM.bh.quaTk, SNV_SUM.bh.nguoiHuong), null, '', 'Chi trả qua tài khoản'],
    thuR: ['Đã thu so số phải thu', '%', 1, () => soPc(SNV_SUM.bh.daThu, SNV_SUM.bh.phaiThu), null, '', 'Đã thu so phải thu'],
    dtR: ['Lao động qua đào tạo', '%', 1, () => soPc(SNV_SUM.ld.daoTao, SNV_SUM.ld.llld), null, '', 'Lao động qua đào tạo'],
    llld: ['Lực lượng lao động', 'người', 0, () => SNV_SUM.ld.llld, null, 'n'],
    diNn: ['Người đi làm việc ở nước ngoài (9 tháng)', 'người', 0, () => SNV_SUM.ld.diNn, null, 'n', 'Đi làm việc ở nước ngoài'],
    nnN: ['Lao động nước ngoài đang làm việc', 'người', 0, () => SNV_SUM.ld.nuocNgoai, null, 'n', 'Lao động nước ngoài'],
    bcGiao: ['Biên chế công chức, viên chức cấp xã được giao', 'người', 0, () => SNV_SUM.bc.giao, null, 'n', 'Được giao'],
    bcTh: ['Biên chế cấp xã thực hiện', 'người', 0, () => SNV_SUM.bc.thucHien, null, '', 'Thực hiện'],
    bcR: ['Biên chế thực hiện so được giao', '%', 1, () => soPc(SNV_SUM.bc.thucHien, SNV_SUM.bc.giao), null, '', 'Thực hiện so được giao'],
    cdsKns: ['Cán bộ được bồi dưỡng kỹ năng số', '%', 1, () => soPc(SNV_SUM.cds.kns, SNV_SUM.cds.tong), null, '', 'Bồi dưỡng kỹ năng số'],
    cdsCks: ['Cán bộ được cấp chữ ký số', '%', 1, () => soPc(SNV_SUM.cds.cks, SNV_SUM.cds.tong), null, '', 'Được cấp chữ ký số'],
    /* 5 chỉ tiêu số liệu thật, giữ nguyên số của khuôn cũ (subtasks.js, dashboard-noi-vu.js) */
    tdDn: ['Doanh nghiệp tham gia tuyển dụng (quý)', 'doanh nghiệp', 0, () => 64, null, 'n', 'Doanh nghiệp tuyển dụng'],
    tdNc: ['Tổng số nhu cầu tuyển dụng (quý)', 'chỉ tiêu', 0, () => 443, null, 'n', 'Nhu cầu tuyển dụng'],
    tdHs: ['Hồ sơ tìm việc (quý)', 'hồ sơ', 0, () => 652, null, 'n', 'Hồ sơ tìm việc'],
    ncc: ['Chi trả an sinh cho người có công (tháng 3/2026)', 'tỷ đồng', 1, () => 228987078109 / 1e9, null, 'n', 'Chi trả người có công'],
    ccvc: ['Công chức, viên chức khối chính quyền (năm 2025)', 'người', 0, () => 124378 + 11965, null, 'n', 'Công chức, viên chức']
  },
  kpis: [['bhxhR', 'trên lực lượng lao động'], ['bhtnR', 'trên lực lượng lao động'], ['dtR', 'trên lực lượng lao động'], ['bcR', 'cấp xã'], ['cdsKns', 'cán bộ cấp xã'], ['tdNc', 'quý gần nhất'], ['ncc', 'tháng 3/2026, đã chi trả hết'], ['ccvc', 'năm 2025']],
  card: ['bhxhR', 'dtR', 'bcR', 'ccvc'],
  cardL: { bhxhR: 'Tham gia bảo hiểm xã hội', dtR: 'Lao động qua đào tạo', bcR: 'Biên chế cấp xã so được giao', ccvc: 'Công chức, viên chức (năm 2025)' },
  groups: [
    { id: 'bh', label: 'Bảo hiểm', note: 'Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp (tháng 9/2026)', lines: ['bhxh', 'huong', 'bhxhR', 'bhtnR', 'tkR', 'thuR'], xa: 'bhxh',
      cards: [
        { type: 'mbars', t: 'Tỷ lệ tham gia bảo hiểm xã hội theo tháng', labels: CTM_SO_M9, vals: () => SNV_SUM.bh.xuHuong[0], u: '%', d: 1 },
        { type: 'shares', t: 'Phường, xã theo tỷ lệ tham gia', u: 'đơn vị', items: () => SNV_SUM.bh.nhom.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 phường, xã tỷ lệ tham gia thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [1], rows: () => SNV_SUM.bh.thap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'ld', label: 'Lao động, việc làm', note: 'Lao động, việc làm trên địa bàn', lines: ['llld', 'diNn', 'nnN', 'dtR'], xa: 'dt',
      cards: [
        { type: 'list', t: 'Xã, phường nhiều lao động nước ngoài', head: ['Xã, phường', 'Lao động nước ngoài'], rows: () => SNV_SUM.ld.nnTop.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 xã, phường tỷ lệ qua đào tạo thấp nhất', head: ['Xã, phường', 'Tỷ lệ (%)'], d: [1], rows: () => SNV_SUM.ld.dtThap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'bc', label: 'Biên chế cấp xã', note: 'Biên chế công chức, viên chức cấp xã', lines: ['bcGiao', 'bcTh', 'bcR'], xa: 'bc',
      cards: [{ type: 'shares', t: 'Phường, xã theo tỷ lệ thực hiện biên chế', u: 'đơn vị', items: () => SNV_SUM.bc.nhom.map((r) => [r[0], r[1]]) }] },
    { id: 'cds', label: 'Cán bộ chuyển đổi số', note: 'Cán bộ chuyển đổi số và chữ ký số cấp xã', lines: ['cdsKns', 'cdsCks'],
      cards: [{ type: 'list', t: 'Tiêu chí cán bộ chuyển đổi số', head: ['Tiêu chí', 'Số phường, xã đạt'], rows: () => SNV_SUM.cds.tieuChi.map((r) => [r[0], r[1]]) }] },
    { id: 'that', label: 'Tuyển dụng, người có công, công chức', note: 'Năm chỉ tiêu số liệu thật: tuyển dụng, tìm việc (quý), chi trả người có công (tháng 3/2026), công chức, viên chức (năm 2025)', lines: ['tdNc', 'tdHs', 'tdDn', 'ncc', 'ccvc'],
      cards: [{ type: 'shares', t: 'Công chức, viên chức khối chính quyền (năm 2025)', u: 'người', items: () => [['Viên chức', 124378], ['Công chức', 11965]] }] }
  ],
  xa: {
    units: () => SNV_UNITS,
    inds: [
      { id: 'bhxh', l: 'Người hưởng chế độ được chi trả qua tài khoản', u: '%', d: 1, tpm: 'tkR', f: (s) => soPc(s.bh.quaTk, s.bh.nguoiHuong) },
      { id: 'dt', l: 'Lao động qua đào tạo', u: '%', d: 1, tpm: 'dtR', f: (s) => soPc(s.ld.daoTao, s.ld.llld) },
      { id: 'bc', l: 'Biên chế thực hiện so được giao', u: '%', d: 1, tpm: 'bcR', f: (s) => soPc(s.bc.thucHien, s.bc.giao) },
      { id: 'll', l: 'Lực lượng lao động', u: 'người', tot: true, f: (s) => s.ld.llld }
    ]
  }
});

/* ============================== SỞ Y TẾ ============================== */
ctmSo({
  id: 'ubnd-yte', name: 'Sở Y tế', ky: SYT_KY,
  m: {
    ndVu: ['Vụ ngộ độc thực phẩm (9 tháng)', 'vụ', 0, () => SYT_SUM.nd.vu, null, 'i', 'Số vụ'],
    ndMac: ['Người mắc, nhập viện do ngộ độc', 'người', 0, () => SYT_SUM.nd.mac, null, 'i', 'Người mắc, nhập viện'],
    ndNang: ['Ca nặng', 'người', 0, () => SYT_SUM.nd.nang, null, 'i'],
    ndTv: ['Tử vong do ngộ độc', 'người', 0, () => SYT_SUM.nd.tuVong, null, 'i', 'Tử vong'],
    bhR: ['Tỷ lệ bao phủ bảo hiểm y tế', '%', 2, () => soPc(SYT_SUM.bh.bhyt, SYT_SUM.bh.dan), null, '', 'Bao phủ bảo hiểm y tế'],
    bhCt: ['Chỉ tiêu bao phủ năm 2026', '%', 2, () => SYT_SUM.bh.chiTieu, null, 'np', 'Chỉ tiêu năm 2026'],
    bhChua: ['Người chưa có thẻ bảo hiểm y tế', 'người', 0, () => SYT_SUM.bh.chua, null, 'i', 'Chưa có thẻ'],
    bhDat: ['Phường, xã đạt chỉ tiêu bao phủ', 'đơn vị', 0, () => SYT_SUM.bh.datCt, null, '', 'Đạt chỉ tiêu'],
    ca: ['Ca mắc dịch bệnh nhóm A, B (9 tháng)', 'ca', 0, () => SYT_SUM.dich.ca, null, 'i', 'Ca mắc'],
    caNang: ['Ca nặng do dịch bệnh', 'ca', 0, () => SYT_SUM.dich.nang, null, 'i', 'Ca nặng'],
    caTv: ['Tử vong do dịch bệnh', 'ca', 0, () => SYT_SUM.dich.tuVong, null, 'i', 'Tử vong'],
    caT9: ['Ca mắc trong tháng 9', 'ca', 0, () => SYT_SUM.dich.caT9, null, 'im', 'Trong tháng 9'],
    hsR: ['Người dân có hồ sơ sức khỏe điện tử', '%', 1, () => soPc(SYT_SUM.hs.hssk, SYT_SUM.hs.dan), null, '', 'Có hồ sơ sức khỏe điện tử'],
    hsChua: ['Người chưa có hồ sơ sức khỏe điện tử', 'người', 0, () => SYT_SUM.hs.chua, null, 'i', 'Chưa có hồ sơ']
  },
  kpis: [['ndVu', '9 tháng'], ['ndMac', '9 tháng'], ['bhR', 'chỉ tiêu năm 2026: ' + ctmF(SYT_SUM.bh.chiTieu, 2) + '%'], ['bhChua', 'tháng 9/2026'], ['ca', 'nhóm A, B, 9 tháng'], ['caTv', '9 tháng'], ['hsR', 'trên dân số'], ['bhDat', 'trên 126 phường, xã']],
  card: ['bhR', 'hsR', 'ca', 'ndVu'],
  cardL: { bhR: 'Bao phủ bảo hiểm y tế', hsR: 'Người dân có hồ sơ sức khỏe điện tử', ca: 'Ca mắc dịch bệnh nhóm A, B', ndVu: 'Vụ ngộ độc thực phẩm' },
  groups: [
    { id: 'nd', label: 'Ngộ độc thực phẩm', note: 'Ngộ độc thực phẩm và mức độ thiệt hại (cộng 9 tháng)', lines: ['ndMac', 'ndNang', 'ndTv', 'ndVu'],
      cards: [
        { type: 'mbars', t: 'Người mắc theo tháng', labels: CTM_SO_M9, vals: () => SYT_SUM.nd.thangMac, u: 'người' },
        { type: 'shares', t: 'Theo nguyên nhân', u: 'người', items: () => SYT_SUM.nd.nguyenNhan.map((r) => [r[0], r[1]]) },
        { type: 'list', t: 'Các vụ ngộ độc', head: ['Vụ việc', 'Người mắc', 'Ca nặng', 'Tử vong'], rows: () => SYT_SUM.nd.dsVu.map((r) => [r[0], r[1], r[2], r[3]]) }
      ] },
    { id: 'bh', label: 'Bảo hiểm y tế', note: 'Tỷ lệ bao phủ bảo hiểm y tế (tháng 9/2026)', lines: ['bhR', 'bhCt', 'bhChua', 'bhDat'], xa: 'bh',
      cards: [
        { type: 'mbars', t: 'Tỷ lệ bao phủ theo tháng', labels: CTM_SO_M9, vals: () => SYT_SUM.bh.xuHuong, u: '%', d: 2 },
        { type: 'shares', t: 'Phường, xã theo tỷ lệ bao phủ', u: 'đơn vị', items: () => SYT_SUM.bh.nhom.map((r) => [r[0], r[1]]) },
        { type: 'list', t: '10 phường, xã tỷ lệ thấp nhất', head: ['Phường, xã', 'Tỷ lệ (%)'], d: [2], rows: () => SYT_SUM.bh.thap.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'dich', label: 'Dịch bệnh nhóm A, B', note: 'Dịch bệnh truyền nhiễm nhóm A, B theo Luật Phòng, chống bệnh truyền nhiễm (cộng 9 tháng)', lines: ['ca', 'caT9', 'caNang', 'caTv'],
      cards: [
        { type: 'list', t: 'Theo bệnh', head: ['Bệnh', 'Ca mắc', 'Ca nặng', 'Tử vong'], rows: () => SYT_SUM.dich.benh.map((r) => [r[0], r[1], r[3], r[4]]) },
        { type: 'mbars', t: 'Sốt xuất huyết theo tháng', labels: CTM_SO_M9, vals: () => SYT_SUM.dich.thang[1], u: 'ca', hint: 'Sốt xuất huyết tăng mạnh từ tháng 7 (mùa mưa).' },
        { type: 'list', t: 'Phường nhiều ca sốt xuất huyết nhất', head: ['Phường, xã', 'Ca mắc'], rows: () => SYT_SUM.dich.sxhTop.map((r) => [r[0], r[1]]) }
      ] },
    { id: 'hs', label: 'Hồ sơ sức khỏe điện tử', note: 'Người dân có hồ sơ sức khỏe điện tử (tháng 9/2026)', lines: ['hsR', 'hsChua'], xa: 'hs',
      cards: [
        { type: 'mbars', t: 'Tỷ lệ theo tháng', labels: CTM_SO_M9, vals: () => SYT_SUM.hs.xuHuong, u: '%', d: 1 },
        { type: 'shares', t: 'Phường, xã theo tỷ lệ', u: 'đơn vị', items: () => SYT_SUM.hs.nhom.map((r) => [r[0], r[1]]) }
      ] }
  ],
  xa: {
    units: () => SYT_UNITS,
    inds: [
      { id: 'bh', l: 'Tỷ lệ bao phủ bảo hiểm y tế', u: '%', d: 2, tpm: 'bhR', f: (s) => soPc(s.bhyt[s.bhyt.length - 1], s.dan) },
      { id: 'hs', l: 'Người dân có hồ sơ sức khỏe điện tử', u: '%', d: 1, tpm: 'hsR', f: (s) => soPc(s.hssk[s.hssk.length - 1], s.dan) }
    ]
  }
});
