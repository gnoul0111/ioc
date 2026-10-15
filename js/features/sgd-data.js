/* ============================== SỞ GD&ĐT — LỚP DỮ LIỆU (SỐ GIẢ LẬP) ==============================
   API Sở GD&ĐT (api/API_SGDDT) mới có schema, chưa có bản ghi thật, nên lớp này SINH SỐ GIẢ LẬP có cấu trúc đúng như
   API sẽ trả: số theo từng phường/xã (MA_XA) cho 2 năm học, và theo từng trường khi mở hồ sơ một phường/xã.
   - Tổng Thành phố lấy từ SGD_TARGETS (sgd-config.js), chia cho 126 phường/xã theo quy mô của file "SỐ LIỆU TRƯỜNG
     HỌC" 07/2026 (gdUnitData, dashboard-education.js) có cộng nhiễu ngẫu nhiên CỐ ĐỊNH (seed) → lần nào mở cũng ra
     cùng số. Số con không vượt số cha (trường đạt chuẩn ≤ số trường, học sinh cận thị ≤ học sinh...).
   - Mọi con số ở cấp Thành phố đều là TỔNG CỘNG DỒN từ 126 phường/xã (giống khi có API thật) nên luôn khớp nhau.
   Khi có API thật: thay sgdBuild() bằng hàm gộp bản ghi API theo MA_XA, giữ nguyên cấu trúc {name,isXa,v:{năm:{trường}}}. */

const SGD_FIELDS = Object.keys(SGD_TARGETS);

function sgdRng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* Chia tổng theo trọng số (phần dư lớn nhất), có trần cho từng phần tử và mức tối thiểu. Tổng luôn giữ đúng. */
function sgdAlloc(total, w, cap, min) {
  const n = w.length;
  const sw = w.reduce((a, b) => a + b, 0) || 1;
  const raw = w.map((x) => (x / sw) * total);
  const out = raw.map((x) => Math.floor(x));
  const rem = total - out.reduce((a, b) => a + b, 0);
  const ord = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < rem; k++) out[ord[k % n][1]]++;
  if (min) {
    for (let i = 0; i < n; i++) {
      while (out[i] < min) {
        let mx = 0;
        for (let j = 1; j < n; j++) if (out[j] > out[mx]) mx = j;
        if (out[mx] <= min) break;
        out[mx]--; out[i]++;
      }
    }
  }
  if (cap) {
    let ex = 0;
    for (let i = 0; i < n; i++) if (out[i] > cap[i]) { ex += out[i] - cap[i]; out[i] = cap[i]; }
    let guard = 0;
    while (ex > 0 && guard < 100000) {
      let best = -1, bv = -1;
      for (let i = 0; i < n; i++) {
        if (cap[i] - out[i] > 0) { const s = w[i] / (out[i] + 1); if (s > bv) { bv = s; best = i; } }
      }
      if (best < 0) break;
      const add = Math.min(ex, cap[best] - out[best], Math.max(1, Math.floor(ex / 8)));
      out[best] += add; ex -= add; guard++;
    }
  }
  return out;
}

let SGD_CACHE = null;
/* Danh sách đơn vị + trọng số quy mô. Dùng gdUnitData (126 phường/xã, file txt 07/2026) nếu có. */
function sgdBaseUnits() {
  if (typeof gdUnitData !== 'undefined' && Array.isArray(gdUnitData) && gdUnitData.length) return gdUnitData;
  const out = [];
  for (let i = 0; i < 126; i++) out.push(['Đơn vị ' + (i + 1), 20, 12, 12000, 320, 280, 1200, 60, 900, 4000, 3000, 150]);
  return out;
}
function sgdBuild() {
  if (SGD_CACHE) return SGD_CACHE;
  const U = sgdBaseUnits();
  const [Y0, Y1] = SGD_YEARS;                // năm học hiện tại, năm học trước
  const g = sgdRng(20260926);
  const R = U.map((u, i) => ({ name: u[0], isXa: /^Xã/.test(u[0]), u: u, rg: sgdRng(i * 7919 + 13), v: { [Y0]: {}, [Y1]: {} } }));
  const nz = (r, a, b) => (a == null ? 0.75 : a) + (b == null ? 0.5 : b) * r.rg();
  const gen = (key, wf, capf, min) => {
    const t = SGD_TARGETS[key];
    const w = R.map((r) => Math.max(wf(r), 0.0001));
    sgdAlloc(t[0], w, capf ? R.map((r) => capf(r.v[Y0])) : null, min).forEach((v, i) => { R[i].v[Y0][key] = v; });
    if (t[1] == null) { R.forEach((r) => { r.v[Y1][key] = null; }); return; }
    const w2 = w.map((x) => x * (0.95 + 0.1 * g()));
    sgdAlloc(t[1], w2, capf ? R.map((r) => capf(r.v[Y1])) : null, min).forEach((v, i) => { R[i].v[Y1][key] = v; });
  };
  /* Chia một trường "cha" của từng đơn vị ra nhiều khối, giữ đúng tổng cha của từng đơn vị VÀ tổng Thành phố của từng khối */
  const split = (parent, keys) => {
    [Y0, Y1].forEach((y, yi) => {
      const left = R.map((r) => r.v[y][parent]);
      keys.forEach((k, ki) => {
        if (ki === keys.length - 1) { R.forEach((r, i) => { r.v[y][k] = left[i]; }); return; }
        const vals = sgdAlloc(SGD_TARGETS[k][yi], R.map((r, i) => left[i] * (0.9 + 0.2 * r.rg()) + 0.001), left.slice());
        vals.forEach((v, i) => { R[i].v[y][k] = v; left[i] -= v; });
      });
    });
  };
  const nowOf = (r, k) => r.v[Y0][k];
  const trOf = (o) => o.tr_mn + o.tr_th + o.tr_cs + o.tr_pt + o.tr_tx;
  const hsOf = (o) => o.hs_th + o.hs_cs;
  const lopOf = (r) => nowOf(r, 'lop_th') + nowOf(r, 'lop_cs');
  const cqRate = (r) => 0.35 + 0.5 * Math.min(1, Math.max(0.15, r.u[2] / r.u[1]));

  gen('tr_mn', (r) => r.u[1] * 0.4 * nz(r), null, 1);
  gen('tr_th', (r) => r.u[1] * 0.28 * nz(r), null, 1);
  gen('tr_cs', (r) => r.u[1] * 0.22 * nz(r), null, 1);
  gen('tr_pt', (r) => r.u[1] * (r.isXa ? 0.07 : 0.1) * nz(r, 0.3, 1.2));
  gen('tr_tx', (r) => r.u[1] * 0.03 * (r.rg() < 0.45 ? 0.15 : 1));
  ['mn', 'th', 'cs', 'pt', 'tx'].forEach((c) => gen('cq_' + c, (r) => nowOf(r, 'tr_' + c) * cqRate(r) * nz(r), (o) => o['tr_' + c]));
  gen('ncl', (r) => trOf(r.v[Y0]) * (r.isXa ? 0.25 : 0.55) * nz(r), trOf);
  gen('qt', (r) => nowOf(r, 'ncl') * (r.isXa ? 0.2 : 1.4) * Math.pow(r.rg(), 2), (o) => o.ncl);
  ['dien', 'nuoc', 'vs', 'mt', 'inet'].forEach((k) => gen(k, (r) => trOf(r.v[Y0]) * (k === 'inet' || k === 'mt' ? (r.isXa ? 0.96 : 1.02) : 1), trOf));
  gen('hb', (r) => nowOf(r, 'tr_th'), (o) => o.tr_th);
  gen('hs_th', (r) => r.u[3] * 0.55 * nz(r, 0.85, 0.3));
  gen('hs_cs', (r) => r.u[3] * 0.45 * nz(r, 0.85, 0.3));
  split('hs_th', ['hs_k1', 'hs_k2', 'hs_k3', 'hs_k4', 'hs_k5']);
  split('hs_cs', ['hs_k6', 'hs_k7', 'hs_k8', 'hs_k9']);
  gen('lop_th', (r) => (nowOf(r, 'hs_th') / 35) * nz(r, 0.88, 0.24));
  gen('lop_cs', (r) => (nowOf(r, 'hs_cs') / 42.6) * nz(r, 0.88, 0.24));
  split('lop_th', ['lop_k1', 'lop_k2', 'lop_k3', 'lop_k4', 'lop_k5']);
  split('lop_cs', ['lop_k6', 'lop_k7', 'lop_k8', 'lop_k9']);
  const dcsW = (r) => 0.4 + Math.min(4, (r.u[11] / r.u[3]) * 100);
  gen('dcs_th', (r) => nowOf(r, 'hs_th') * dcsW(r) * nz(r), (o) => o.hs_th);
  gen('dcs_cs', (r) => nowOf(r, 'hs_cs') * dcsW(r) * nz(r), (o) => o.hs_cs);
  gen('kc_th', (r) => nowOf(r, 'lop_th') * 0.9 * nz(r, 0.9, 0.2));
  gen('kc_cs', (r) => nowOf(r, 'lop_cs') * 0.9 * nz(r, 0.9, 0.2));
  gen('bk_th', (r) => nowOf(r, 'lop_th') * (r.isXa ? 2.2 : 0.5) * Math.pow(r.rg(), 1.5));
  gen('bk_cs', (r) => nowOf(r, 'lop_cs') * (r.isXa ? 2.2 : 0.5) * Math.pow(r.rg(), 1.5));
  gen('tm_th', (r) => nowOf(r, 'lop_th') * (r.isXa ? 2.5 : 0.3) * Math.pow(r.rg(), 3));
  gen('tm_cs', (r) => nowOf(r, 'lop_cs') * (r.isXa ? 2.5 : 0.3) * Math.pow(r.rg(), 3));
  gen('ql_th', (r) => nowOf(r, 'tr_th') * nz(r));
  gen('ql_cs', (r) => nowOf(r, 'tr_cs') * nz(r));
  gen('gv_th', (r) => nowOf(r, 'lop_th') * nz(r, 0.88, 0.24));
  gen('gv_cs', (r) => nowOf(r, 'lop_cs') * nz(r, 0.88, 0.24));
  gen('nv_th', (r) => nowOf(r, 'tr_th') * nz(r));
  gen('nv_cs', (r) => nowOf(r, 'tr_cs') * nz(r));
  gen('can_th', (r) => nowOf(r, 'hs_th') * (r.isXa ? 0.85 : 1.15) * nz(r, 0.85, 0.3), (o) => o.hs_th);
  gen('can_cs', (r) => nowOf(r, 'hs_cs') * (r.isXa ? 0.85 : 1.15) * nz(r, 0.85, 0.3), (o) => o.hs_cs);
  ['loan', 'vien', 'kho', 'lac', 'duc', 'thd', 'mk'].forEach((k) => gen(k, (r) => hsOf(r.v[Y0]) * nz(r, 0.7, 0.6), hsOf));
  const boiW = (r) => Math.min(1.35, Math.max(0.55, (r.u[9] / r.u[3]) * 2.2));
  gen('boi_th', (r) => nowOf(r, 'hs_th') * boiW(r) * nz(r, 0.85, 0.3), (o) => o.hs_th);
  gen('boi_cs', (r) => nowOf(r, 'hs_cs') * boiW(r) * nz(r, 0.85, 0.3), (o) => o.hs_cs);
  gen('sp', (r) => hsOf(r.v[Y0]) * (r.isXa ? 0.98 : 1.01) * nz(r, 0.98, 0.04), hsOf);
  gen('pc', (r) => hsOf(r.v[Y0]) * (r.isXa ? 0.85 : 1.1) * nz(r, 0.9, 0.2), hsOf);

  SGD_CACHE = { R: R, schools: {} };
  return SGD_CACHE;
}
function sgdUnits() { return sgdBuild().R; }
/* Tổng Thành phố của một năm học = cộng dồn 126 phường/xã (null nếu năm đó chưa có số của trường dữ liệu này). */
function sgdCity(y) {
  const o = {};
  SGD_FIELDS.forEach((k) => { o[k] = sgdUnits().reduce((a, r) => (a == null || r.v[y] == null || r.v[y][k] == null ? null : a + r.v[y][k]), 0); });
  return o;
}
function sgdPrevYear(y) { const i = SGD_YEARS.indexOf(y); return i >= 0 && i < SGD_YEARS.length - 1 ? SGD_YEARS[i + 1] : null; }

/* Danh sách trường giả lập của một phường/xã (năm học hiện tại). Tên trường là tên mẫu. Số các trường cộng lại đúng số
   của phường/xã; số con không vượt số cha của từng trường. */
const SGD_CAPS = [['mn', 'Mầm non'], ['th', 'Tiểu học'], ['cs', 'THCS'], ['pt', 'THPT'], ['tx', 'GDTX']];
function sgdSchools(r) {
  const D = sgdBuild();
  if (D.schools[r.name]) return D.schools[r.name];
  const o0 = r.v[SGD_YEARS[0]];
  let h = 0;
  for (let i = 0; i < r.name.length; i++) h = (h * 31 + r.name.charCodeAt(i)) | 0;
  const rg = sgdRng(h);
  const short = r.name.replace(/^(Phường|Xã) /, '');
  const S = [];
  SGD_CAPS.forEach((c) => {
    const n = o0['tr_' + c[0]];
    const idx = [];
    for (let k = 0; k < n; k++) {
      const o = {};
      SGD_FIELDS.forEach((key) => { o[key] = 0; });
      o['tr_' + c[0]] = 1;
      const s = { name: (c[0] === 'tx' ? 'Trung tâm GDTX ' : c[1] + ' ') + short + (n > 1 ? ' ' + (k + 1) : ''), cap: c[0], capLabel: c[1], o: o, w: 0.6 + 0.8 * rg() };
      S.push(s); idx.push(s);
    }
    idx.slice().sort(() => rg() - 0.5).slice(0, o0['cq_' + c[0]]).forEach((s) => { s.o['cq_' + c[0]] = 1; });
  });
  const pickFlags = (key, list) => list.slice().sort(() => rg() - 0.5).slice(0, o0[key]).forEach((s) => { s.o[key] = 1; });
  pickFlags('ncl', S);
  pickFlags('qt', S.filter((s) => s.o.ncl));
  ['dien', 'nuoc', 'vs', 'mt', 'inet'].forEach((k) => pickFlags(k, S));
  pickFlags('hb', S.filter((s) => s.cap === 'th'));
  const spread = (key, list, wf, capf) => {
    if (!list.length) return;
    sgdAlloc(o0[key], list.map(wf), capf ? list.map(capf) : null, 0).forEach((v, i) => { list[i].o[key] = v; });
  };
  const TH = S.filter((s) => s.cap === 'th'), CS = S.filter((s) => s.cap === 'cs');
  const each = (lvl, list) => {
    const hs = 'hs_' + lvl;
    spread(hs, list, (s) => s.w);
    const fw = (s) => s.o[hs] * (0.85 + 0.3 * rg()) + 0.01;
    ['lop', 'kc', 'gv'].forEach((k) => spread(k + '_' + lvl, list, fw));
    ['dcs', 'can', 'boi'].forEach((k) => spread(k + '_' + lvl, list, fw, (s) => s.o[hs]));
    spread('bk_' + lvl, list, (s) => (s.o[hs] + 0.01) * Math.pow(rg(), 2));
    spread('tm_' + lvl, list, (s) => (s.o[hs] + 0.01) * Math.pow(rg(), 4));
    spread('ql_' + lvl, list, () => 0.8 + 0.4 * rg());
    spread('nv_' + lvl, list, () => 0.7 + 0.6 * rg());
    /* Chia khối hai chiều: tổng các khối của 1 trường = số của trường, tổng 1 khối qua các trường = số khối của phường/xã */
    const ks = lvl === 'th' ? [1, 2, 3, 4, 5] : [6, 7, 8, 9];
    ['hs', 'lop'].forEach((pre) => {
      if (!list.length) return;
      const left = list.map((s) => s.o[pre + '_' + lvl]);
      ks.forEach((k, i) => {
        const key = pre + '_k' + k;
        if (i === ks.length - 1) { list.forEach((s, j) => { s.o[key] = left[j]; }); return; }
        sgdAlloc(o0[key], list.map((s, j) => left[j] * (0.9 + 0.2 * rg()) + 0.001), left.slice()).forEach((v, j) => { list[j].o[key] = v; left[j] -= v; });
      });
    });
  };
  each('th', TH); each('cs', CS);
  const BOTH = TH.concat(CS), hsS = (s) => s.o.hs_th + s.o.hs_cs;
  ['loan', 'vien', 'kho', 'lac', 'duc', 'thd', 'mk', 'sp', 'pc'].forEach((k) => spread(k, BOTH, (s) => (hsS(s) + 0.01) * (0.85 + 0.3 * rg()), hsS));
  D.schools[r.name] = S;
  return S;
}

/* ---------- Cây chỉ tiêu (màn "Chi tiết theo cấp bậc") ----------
   f: danh sách trường dữ liệu cộng lại; nút 'add' không có f thì lấy tổng các con. den: mẫu số để hiện tỷ lệ phụ.
   kind 'rate': tỷ lệ % (num/den), không cộng dồn. inv: giảm là tốt. neutral: tăng/giảm không tự thân tốt/xấu. */
const SGD_S1 = 'var(--s1)', SGD_S2 = 'var(--s2)', SGD_S3 = 'var(--s3)', SGD_S4 = 'var(--s4)', SGD_S5 = 'var(--s5)';
function sgdLv(lvl, extra) { return Object.assign({ label: lvl === 'th' ? 'Tiểu học' : 'THCS', color: lvl === 'th' ? SGD_S1 : SGD_S2 }, extra); }
const SGD_TREE = [
  { id: 'truong', group: 'ml', label: 'Số trường', unit: 'trường', kind: 'add', src: 'hoso_truong_* · đếm MA', xa: 'truong',
    kids: SGD_CAPS.map((c, i) => ({ id: 'tr_' + c[0], label: c[1], f: ['tr_' + c[0]], color: [SGD_S1, SGD_S2, SGD_S3, SGD_S4, SGD_S5][i], src: 'hoso_truong_' + (c[0] === 'th' ? 'c1' : c[0] === 'cs' ? 'c2' : c[0] === 'pt' ? 'c3' : c[0] === 'tx' ? 'gdtx' : 'mn') })) },
  { id: 'cqg', group: 'ml', label: 'Trường đạt chuẩn quốc gia', unit: 'trường', kind: 'add', den: ['tr_mn', 'tr_th', 'tr_cs', 'tr_pt', 'tr_tx'], denTxt: 'số trường', src: 'hoso_truong_* · MA_DAT_CHUAN_DANH_GIA_CLGD', xa: 'cqg',
    kids: SGD_CAPS.map((c, i) => ({ id: 'cq_' + c[0], label: c[1], f: ['cq_' + c[0]], den: ['tr_' + c[0]], denTxt: 'trường ' + (c[0] === 'mn' ? 'MN' : c[0] === 'th' ? 'TH' : c[0] === 'cs' ? 'THCS' : c[0] === 'pt' ? 'THPT' : 'GDTX'), color: [SGD_S1, SGD_S2, SGD_S3, SGD_S4, SGD_S5][i] })) },
  { id: 'hocsinh', group: 'hs', label: 'Học sinh Tiểu học và THCS', unit: 'học sinh', kind: 'add', src: 'thongke_hocsinh_c1/_c2 · HS_TONG_SO', xa: 'hocsinh',
    kids: [sgdLv('th', { id: 'hs_th', f: ['hs_th'], src: 'thongke_hocsinh_c1', kids: [1, 2, 3, 4, 5].map((k) => ({ id: 'hs_k' + k, label: 'Lớp ' + k, f: ['hs_k' + k], filt: 'MA_KHOI = ' + k })) }),
      sgdLv('cs', { id: 'hs_cs', f: ['hs_cs'], src: 'thongke_hocsinh_c2', kids: [6, 7, 8, 9].map((k) => ({ id: 'hs_k' + k, label: 'Lớp ' + k, f: ['hs_k' + k], filt: 'MA_KHOI = ' + k })) })] },
  { id: 'lop', group: 'hs', label: 'Lớp học', unit: 'lớp', kind: 'add', src: 'thongke_lophoc_c1/_c2 · SO_LOP', xa: 'lop',
    kids: [sgdLv('th', { id: 'lop_th', f: ['lop_th'], src: 'thongke_lophoc_c1', kids: [1, 2, 3, 4, 5].map((k) => ({ id: 'lop_k' + k, label: 'Lớp ' + k, f: ['lop_k' + k], field: 'LOP_' + k })) }),
      sgdLv('cs', { id: 'lop_cs', f: ['lop_cs'], src: 'thongke_lophoc_c2', kids: [6, 7, 8, 9].map((k) => ({ id: 'lop_k' + k, label: 'Lớp ' + k, f: ['lop_k' + k], field: 'LOP_' + k })) })] },
  { id: 'dcs', group: 'hs', label: 'Học sinh diện chính sách', unit: 'học sinh', kind: 'add', neutral: true, den: ['hs_th', 'hs_cs'], denTxt: 'học sinh', src: 'thongke_hocsinhdienchinhsach · HS_DIEN_CHINH_SACH', xa: 'dcs',
    kids: [sgdLv('th', { id: 'dcs_th', f: ['dcs_th'], den: ['hs_th'], denTxt: 'HS tiểu học', neutral: true }), sgdLv('cs', { id: 'dcs_cs', f: ['dcs_cs'], den: ['hs_cs'], denTxt: 'HS THCS', neutral: true })] },
  { id: 'phong', group: 'vc', label: 'Phòng học', unit: 'phòng', kind: 'add', src: 'thongke_phonghoc_c1/_c2 · SO_PHONG_HOC', xa: 'phong',
    kids: [{ id: 'ph_kc', label: 'Kiên cố', color: SGD_S1, field: 'SO_PHONG_HOC_KIEN_CO', kids: [sgdLv('th', { id: 'kc_th', f: ['kc_th'] }), sgdLv('cs', { id: 'kc_cs', f: ['kc_cs'] })] },
      { id: 'ph_bk', label: 'Bán kiên cố', color: SGD_S4, inv: true, field: 'SO_PHONG_HOC_BAN_KIEN_CO', kids: [sgdLv('th', { id: 'bk_th', f: ['bk_th'], inv: true }), sgdLv('cs', { id: 'bk_cs', f: ['bk_cs'], inv: true })] },
      { id: 'ph_tm', label: 'Phòng học tạm', color: SGD_S2, inv: true, field: 'SO_PHONG_HOC_TAM', kids: [sgdLv('th', { id: 'tm_th', f: ['tm_th'], inv: true }), sgdLv('cs', { id: 'tm_cs', f: ['tm_cs'], inv: true })] }] },
  { id: 'nhansu', group: 'dn', label: 'Nhân sự Tiểu học và THCS', unit: 'người', kind: 'add', src: 'thongke_nhansu_c1/_c2 · TONG_SO', xa: 'nhansu',
    kids: [{ id: 'ns_ql', label: 'Cán bộ quản lý', color: SGD_S4, neutral: true, field: 'CBQL', kids: [sgdLv('th', { id: 'ql_th', f: ['ql_th'], neutral: true }), sgdLv('cs', { id: 'ql_cs', f: ['ql_cs'], neutral: true })] },
      { id: 'ns_gv', label: 'Giáo viên', color: SGD_S1, field: 'GIAO_VIEN', kids: [sgdLv('th', { id: 'gv_th', f: ['gv_th'] }), sgdLv('cs', { id: 'gv_cs', f: ['gv_cs'] })] },
      { id: 'ns_nv', label: 'Nhân viên', color: SGD_S3, neutral: true, field: 'NHAN_VIEN', kids: [sgdLv('th', { id: 'nv_th', f: ['nv_th'], neutral: true }), sgdLv('cs', { id: 'nv_cs', f: ['nv_cs'], neutral: true })] }] },
  { id: 'mat', group: 'sk', label: 'Bệnh về mắt ở học sinh', unit: '% học sinh', kind: 'rate', src: 'thongke_hocsinhsuckhoe_c1/_c2', xa: 'can',
    kids: [{ id: 'mt_can', label: 'Cận thị', num: ['can_th', 'can_cs'], den: ['hs_th', 'hs_cs'], inv: true, color: SGD_S2, field: 'HS_BI_CAN_THI' },
      { id: 'mt_loan', label: 'Loạn thị', num: ['loan'], den: ['hs_th', 'hs_cs'], inv: true, color: SGD_S2, field: 'HS_BI_LOAN_THI' },
      { id: 'mt_vien', label: 'Viễn thị', num: ['vien'], den: ['hs_th', 'hs_cs'], inv: true, color: SGD_S2, field: 'HS_BI_VIEN_THI' },
      { id: 'mt_khac', label: 'Các bệnh mắt khác', num: ['kho', 'lac', 'duc', 'thd', 'mk'], den: ['hs_th', 'hs_cs'], inv: true, color: SGD_S2, field: 'HS_BI_BENH_KHO_MAT + _LAC + _DUC_THUY_TINH_THE + _THAI_HOA_DIEM + _BENH_VE_MAT_KHAC' }] },
  { id: 'boi', group: 'sk', label: 'Học sinh biết bơi', unit: 'học sinh', kind: 'add', den: ['hs_th', 'hs_cs'], denTxt: 'học sinh', src: 'thongke_hocsinhsuckhoe · HS_BIET_BOI', xa: 'boi',
    kids: [sgdLv('th', { id: 'boi_th', f: ['boi_th'], den: ['hs_th'], denTxt: 'HS tiểu học' }), sgdLv('cs', { id: 'boi_cs', f: ['boi_cs'], den: ['hs_cs'], denTxt: 'HS THCS' })] }
];

function sgdSum(o, keys) { if (!o) return null; let s = 0; for (const k of keys) { if (o[k] == null) return null; s += o[k]; } return s; }
/* Tính cây cho một cặp (năm này, năm trước) → mỗi nút có now/prev (số) và kind/den... để vẽ. */
function sgdEvalTree(spec, oNow, oPrev) {
  const ev = (n, parentKind) => {
    const kind = n.kind || (parentKind === 'rate' ? 'rateKid' : 'add');
    const kids = (n.kids || []).map((k) => ev(k, kind));
    let now = null, prev = null, cnt = null, den = null, denPrev = null;
    if (n.num) {
      const a = sgdSum(oNow, n.num), b = sgdSum(oNow, n.den), a0 = sgdSum(oPrev, n.num), b0 = sgdSum(oPrev, n.den);
      now = a != null && b ? (a / b) * 100 : null; prev = a0 != null && b0 ? (a0 / b0) * 100 : null; cnt = a;
    } else if (kind !== 'rate') {
      if (n.f) { now = sgdSum(oNow, n.f); prev = sgdSum(oPrev, n.f); }
      else if (kids.length) { now = kids.every((k) => k.now != null) ? kids.reduce((s, k) => s + k.now, 0) : null; prev = kids.every((k) => k.prev != null) ? kids.reduce((s, k) => s + k.prev, 0) : null; }
      if (n.den) { den = sgdSum(oNow, n.den); denPrev = sgdSum(oPrev, n.den); }
    }
    return Object.assign({}, n, { kind: n.num ? 'rateKid' : kind, now: now, prev: prev, cnt: cnt, den: den, denPrev: denPrev, kids: kids });
  };
  return ev(spec, null);
}

/* ---------- 16 chỉ tiêu xem theo 126 phường/xã ----------
   type 'count': cộng các parts; 'ratio': num/den (× m). cols: cột thành phần của bảng. better: high|low|none.
   scope 'all' = danh sách trường đủ 5 cấp; 'thcs' = chỉ Tiểu học + THCS (API chỉ có thống kê cho 2 cấp này). */
function sgdCnt(k, label) { return { label: label, f: (o) => o[k], d: 0 }; }
function sgdRat(label, f, d, pct) { return { label: label, f: f, d: d, pct: pct }; }
function sgdDv(a, b, m) { return a == null || b == null || !b ? null : (a / b) * m; }
const SGD_TRK = ['tr_mn', 'tr_th', 'tr_cs', 'tr_pt', 'tr_tx'], SGD_CQK = ['cq_mn', 'cq_th', 'cq_cs', 'cq_pt', 'cq_tx'];
const SGD_HSK = ['hs_th', 'hs_cs'], SGD_LOPK = ['lop_th', 'lop_cs'], SGD_PHK = ['kc_th', 'kc_cs', 'bk_th', 'bk_cs', 'tm_th', 'tm_cs'];
const SGD_XA_INDS = [
  { id: 'truong', g: 'ml', label: 'Số trường', unit: 'trường', type: 'count', parts: [sgdCnt('tr_mn', 'Mầm non'), sgdCnt('tr_th', 'Tiểu học'), sgdCnt('tr_cs', 'THCS'), sgdCnt('tr_pt', 'THPT'), sgdCnt('tr_tx', 'GDTX')], keys: SGD_TRK, better: 'none', scope: 'all', src: 'hoso_truong_* · đếm MA', vh: 'Tổng', tree: 'truong' },
  { id: 'cqg', g: 'ml', label: 'Tỷ lệ trường đạt chuẩn quốc gia', type: 'ratio', num: (o) => sgdSum(o, SGD_CQK), den: (o) => sgdSum(o, SGD_TRK), m: 100, pct: true, d: 1, cols: [sgdCnt('cq_mn', 'MN'), sgdCnt('cq_th', 'TH'), sgdCnt('cq_cs', 'THCS'), sgdCnt('cq_pt', 'THPT'), sgdCnt('cq_tx', 'GDTX')], better: 'high', scope: 'all', src: 'MA_DAT_CHUAN_DANH_GIA_CLGD', vh: 'Tỷ lệ', numL: 'Trường đạt chuẩn', denL: 'Số trường', tree: 'cqg' },
  { id: 'ncl', g: 'ml', label: 'Tỷ lệ trường ngoài công lập', type: 'ratio', num: (o) => o.ncl, den: (o) => sgdSum(o, SGD_TRK), m: 100, pct: true, d: 1, cols: [sgdRat('Công lập', (o) => (sgdSum(o, SGD_TRK) == null || o.ncl == null ? null : sgdSum(o, SGD_TRK) - o.ncl), 0), sgdCnt('ncl', 'Ngoài CL'), sgdCnt('qt', 'Quốc tế')], better: 'none', scope: 'all', src: 'MA_LOAI_HINH_TRUONG · IS_TRUONG_QUOC_TE', vh: 'Tỷ lệ', numL: 'Trường ngoài công lập', denL: 'Số trường' },
  { id: 'inet', g: 'ml', label: 'Trường khai thác Internet dạy học', type: 'ratio', num: (o) => o.inet, den: (o) => sgdSum(o, SGD_TRK), m: 100, pct: true, d: 1, cols: [sgdRat('Điện lưới', (o) => sgdDv(o.dien, sgdSum(o, SGD_TRK), 100), 1, true), sgdRat('Nước sạch', (o) => sgdDv(o.nuoc, sgdSum(o, SGD_TRK), 100), 1, true), sgdRat('Vệ sinh', (o) => sgdDv(o.vs, sgdSum(o, SGD_TRK), 100), 1, true), sgdRat('Máy tính', (o) => sgdDv(o.mt, sgdSum(o, SGD_TRK), 100), 1, true)], better: 'high', scope: 'all', src: 'IS_KHAI_THAC_INTERNET_DAY_HOC · IS_*', vh: 'Internet', numL: 'Trường dùng Internet dạy học', denL: 'Số trường' },
  { id: 'hocsinh', g: 'hs', label: 'Học sinh', unit: 'học sinh', type: 'count', parts: [sgdCnt('hs_th', 'Tiểu học'), sgdCnt('hs_cs', 'THCS')], keys: SGD_HSK, better: 'none', scope: 'thcs', src: 'thongke_hocsinh · HS_TONG_SO', vh: 'Tổng', tree: 'hocsinh' },
  { id: 'lop', g: 'hs', label: 'Lớp học', unit: 'lớp', type: 'count', parts: [sgdCnt('lop_th', 'Tiểu học'), sgdCnt('lop_cs', 'THCS')], keys: SGD_LOPK, better: 'none', scope: 'thcs', src: 'thongke_lophoc · SO_LOP', vh: 'Tổng', tree: 'lop' },
  { id: 'siso', g: 'hs', label: 'Sĩ số bình quân', type: 'ratio', num: (o) => sgdSum(o, SGD_HSK), den: (o) => sgdSum(o, SGD_LOPK), m: 1, pct: false, d: 1, cols: [sgdRat('TH', (o) => sgdDv(o.hs_th, o.lop_th, 1), 1), sgdRat('THCS', (o) => sgdDv(o.hs_cs, o.lop_cs, 1), 1)], better: 'low', scope: 'thcs', src: 'HS_TONG_SO ÷ SO_LOP', vh: 'Chung', numL: 'Học sinh', denL: 'Lớp', tree: 'lop' },
  { id: 'dcs', g: 'hs', label: 'Học sinh diện chính sách', type: 'ratio', num: (o) => sgdSum(o, ['dcs_th', 'dcs_cs']), den: (o) => sgdSum(o, SGD_HSK), m: 100, pct: true, d: 2, cols: [sgdCnt('dcs_th', 'TH'), sgdCnt('dcs_cs', 'THCS')], better: 'none', scope: 'thcs', src: 'HS_DIEN_CHINH_SACH', vh: 'Tỷ lệ', numL: 'HS diện chính sách', denL: 'Học sinh', tree: 'dcs' },
  { id: 'phong', g: 'vc', label: 'Phòng học', unit: 'phòng', type: 'count', parts: [sgdRat('Kiên cố', (o) => sgdSum(o, ['kc_th', 'kc_cs']), 0), sgdRat('Bán kiên cố', (o) => sgdSum(o, ['bk_th', 'bk_cs']), 0), sgdRat('Tạm', (o) => sgdSum(o, ['tm_th', 'tm_cs']), 0)], keys: SGD_PHK, better: 'none', scope: 'thcs', src: 'thongke_phonghoc · SO_PHONG_HOC', vh: 'Tổng', tree: 'phong' },
  { id: 'kienco', g: 'vc', label: 'Tỷ lệ phòng học kiên cố', type: 'ratio', num: (o) => sgdSum(o, ['kc_th', 'kc_cs']), den: (o) => sgdSum(o, SGD_PHK), m: 100, pct: true, d: 1, cols: [sgdRat('Kiên cố', (o) => sgdSum(o, ['kc_th', 'kc_cs']), 0), sgdRat('Bán KC', (o) => sgdSum(o, ['bk_th', 'bk_cs']), 0), sgdRat('Tạm', (o) => sgdSum(o, ['tm_th', 'tm_cs']), 0)], better: 'high', scope: 'thcs', src: 'SO_PHONG_HOC_KIEN_CO', vh: 'Tỷ lệ', numL: 'Phòng kiên cố', denL: 'Phòng học', tree: 'phong' },
  { id: 'lopphong', g: 'vc', label: 'Số lớp / phòng học', type: 'ratio', num: (o) => sgdSum(o, SGD_LOPK), den: (o) => sgdSum(o, SGD_PHK), m: 1, pct: false, d: 2, cols: [sgdRat('Số lớp', (o) => sgdSum(o, SGD_LOPK), 0), sgdRat('Số phòng', (o) => sgdSum(o, SGD_PHK), 0)], better: 'low', scope: 'thcs', src: 'SO_LOP ÷ SO_PHONG_HOC', vh: 'Lớp/phòng', numL: 'Lớp', denL: 'Phòng học', tree: 'phong' },
  { id: 'nhansu', g: 'dn', label: 'Nhân sự', unit: 'người', type: 'count', parts: [sgdRat('CBQL', (o) => sgdSum(o, ['ql_th', 'ql_cs']), 0), sgdRat('Giáo viên', (o) => sgdSum(o, ['gv_th', 'gv_cs']), 0), sgdRat('Nhân viên', (o) => sgdSum(o, ['nv_th', 'nv_cs']), 0)], keys: ['ql_th', 'ql_cs', 'gv_th', 'gv_cs', 'nv_th', 'nv_cs'], better: 'none', scope: 'thcs', src: 'thongke_nhansu · TONG_SO', vh: 'Tổng', tree: 'nhansu' },
  { id: 'hsgv', g: 'dn', label: 'Học sinh / giáo viên', type: 'ratio', num: (o) => sgdSum(o, SGD_HSK), den: (o) => sgdSum(o, ['gv_th', 'gv_cs']), m: 1, pct: false, d: 1, cols: [sgdRat('Học sinh', (o) => sgdSum(o, SGD_HSK), 0), sgdRat('Giáo viên', (o) => sgdSum(o, ['gv_th', 'gv_cs']), 0)], better: 'low', scope: 'thcs', src: 'HS_TONG_SO ÷ GIAO_VIEN', vh: 'HS/GV', numL: 'Học sinh', denL: 'Giáo viên', tree: 'nhansu' },
  { id: 'can', g: 'sk', label: 'Tỷ lệ cận thị', type: 'ratio', num: (o) => sgdSum(o, ['can_th', 'can_cs']), den: (o) => sgdSum(o, SGD_HSK), m: 100, pct: true, d: 1, cols: [sgdRat('TH', (o) => sgdDv(o.can_th, o.hs_th, 100), 1, true), sgdRat('THCS', (o) => sgdDv(o.can_cs, o.hs_cs, 100), 1, true)], better: 'low', scope: 'thcs', src: 'HS_BI_CAN_THI', vh: 'Chung', numL: 'HS cận thị', denL: 'Học sinh', tree: 'mat' },
  { id: 'boi', g: 'sk', label: 'Tỷ lệ biết bơi', type: 'ratio', num: (o) => sgdSum(o, ['boi_th', 'boi_cs']), den: (o) => sgdSum(o, SGD_HSK), m: 100, pct: true, d: 1, cols: [sgdRat('TH', (o) => sgdDv(o.boi_th, o.hs_th, 100), 1, true), sgdRat('THCS', (o) => sgdDv(o.boi_cs, o.hs_cs, 100), 1, true)], better: 'high', scope: 'thcs', src: 'HS_BIET_BOI', vh: 'Chung', numL: 'HS biết bơi', denL: 'Học sinh', tree: 'boi' },
  { id: 'sp', g: 'sk', label: 'Phụ huynh dùng smartphone', type: 'ratio', num: (o) => o.sp, den: (o) => sgdSum(o, SGD_HSK), m: 100, pct: true, d: 1, cols: [sgdRat('Máy tính + Internet', (o) => sgdDv(o.pc, sgdSum(o, SGD_HSK), 100), 1, true)], better: 'high', scope: 'thcs', src: 'SO_PH_DUNG_SMARTPHONE', vh: 'Smartphone', numL: 'PH dùng smartphone', denL: 'Học sinh' }
];
