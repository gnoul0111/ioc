/* ============================== TRUNG TÂM PHỤC VỤ HCC — LỚP DỮ LIỆU (SỐ GIẢ LẬP) ==============================
   API hcc_tkpro (api/API_HCC) mới có schema, chưa có bản ghi thật, nên lớp này SINH SỐ GIẢ LẬP có cấu trúc đúng như API
   sẽ trả: số theo từng đơn vị lá của cây đơn vị (các sở/ngành trong HCC_SO + 126 phường/xã) cho 6 quý, số theo lĩnh vực (chỉ cấp
   Thành phố), số tài khoản, và danh sách mẫu (hồ sơ trễ hạn, thủ tục chưa trực tuyến toàn trình) khi mở hồ sơ một đơn vị.
   - Tổng Thành phố lấy từ HCC_TARGETS (hcc-config.js), chia cho các đơn vị theo quy mô (phường/xã: số học sinh trong file
     "SỐ LIỆU TRƯỜNG HỌC" 07/2026 làm thước đo dân số; sở/ngành: trọng số trong HCC_SO), có nhiễu ngẫu nhiên CỐ ĐỊNH (seed)
     → lần nào mở cũng ra cùng số. Mỗi đơn vị có một "mức chất lượng" cố định nên đơn vị tốt ở quý này thường tốt ở quý sau.
   - Số con không vượt số cha (trễ hạn ≤ đã giải quyết, số hóa ≤ tiếp nhận...). Mọi số cấp Thành phố là TỔNG CỘNG DỒN
     từ các đơn vị (trừ số thủ tục: lấy nút gốc, xem giả định trong hcc-config.js).
   - Theo lĩnh vực: tổng hồ sơ tiếp nhận các lĩnh vực = tổng tiếp nhận các đơn vị; đã giải quyết các lĩnh vực = tổng
     trước hạn + đúng hạn + trễ hạn các đơn vị; tồn cuối quý này = chuyển sang đầu quý sau (khớp theo từng lĩnh vực).
   Khi có API thật: thay hccBuild() bằng hàm đọc các endpoint, giữ nguyên cấu trúc {name,kind,v:{kỳ:{trường}}}. */

/* dxl = hồ sơ đang xử lý cuối kỳ (tồn của đơn vị), dxlt = trong đó đã quá hạn xử lý (đang xử lý trễ hạn), dxlth = còn trong hạn */
const HCC_UFIELDS = ['hs', 'sh', 'gq', 'th', 'dh', 'tre', 'tp', 'ttt', 'tkh', 'dg', 'rhl', 'hl', 'bt', 'khl', 'rkhl', 'tthc', 'tt', 'mp', 'ctt', 'dxl', 'dxlt', 'dxlth'];
const HCC_KHOI = [['so', 'Sở, ngành'], ['p', 'Phường'], ['x', 'Xã']];

function hccRng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* Chia tổng theo trọng số (phần dư lớn nhất), có trần cho từng phần tử. Tổng luôn giữ đúng nếu tổng trần đủ lớn. */
function hccAlloc(total, w, cap) {
  const n = w.length;
  const sw = w.reduce((a, b) => a + b, 0) || 1;
  const raw = w.map((x) => (x / sw) * total);
  const out = raw.map((x) => Math.floor(x));
  const rem = total - out.reduce((a, b) => a + b, 0);
  const ord = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < rem; k++) out[ord[k % n][1]]++;
  if (cap) {
    let ex = 0;
    for (let i = 0; i < n; i++) if (out[i] > cap[i]) { ex += out[i] - cap[i]; out[i] = cap[i]; }
    let guard = 0;
    while (ex > 0 && guard < 200000) {
      let best = -1, bv = -1;
      for (let i = 0; i < n; i++) {
        if (cap[i] - out[i] > 0) { const s = (w[i] + 1e-9) / (out[i] + 1); if (s > bv) { bv = s; best = i; } }
      }
      if (best < 0) break;
      const add = Math.min(ex, cap[best] - out[best], Math.max(1, Math.floor(ex / 8)));
      out[best] += add; ex -= add; guard++;
    }
  }
  return out;
}
const hccClamp = (v, a, b) => Math.max(a, Math.min(b, v));

let HCC_CACHE = null;
/* Danh sách 126 phường/xã + trọng số quy mô. Dùng gdUnitData (file txt 07/2026) nếu có. */
function hccWardBase() {
  if (typeof gdUnitData !== 'undefined' && Array.isArray(gdUnitData) && gdUnitData.length) return gdUnitData.map((u) => [u[0], u[3]]);
  const out = [];
  for (let i = 0; i < 126; i++) out.push(['Phường ' + (i + 1), 12000]);
  return out;
}
function hccBuild() {
  if (HCC_CACHE) return HCC_CACHE;
  const T = HCC_TARGETS, PS = HCC_PERIODS.map((p) => p.id), NP = PS.length;
  const g = hccRng(20260928);
  const R = [];
  HCC_SO.forEach((s, i) => { const rg = hccRng(i * 104729 + 71); R.push({ name: s[0], kind: 'so', w: s[1], rg: rg, q: rg(), lv: s[3], n0: s[2], v: {} }); });
  hccWardBase().forEach((u, i) => {
    const rg = hccRng(i * 7919 + 29), isXa = /^Xã/.test(u[0]);
    R.push({ name: u[0], kind: isXa ? 'x' : 'p', w: Math.max(200, u[1]) * (isXa ? 0.85 : 1.15), rg: rg, q: rg(), lv: HCC_XA_LV, n0: 318 + Math.floor(rg() * 26), v: {} });
  });
  R.forEach((r) => { PS.forEach((p) => { r.v[p] = {}; }); });
  const SO = R.filter((r) => r.kind === 'so'), WD = R.filter((r) => r.kind !== 'so');

  /* Chuỗi tồn: kỳ cũ nhất → mới nhất. Đã giải quyết = tồn đầu kỳ + tiếp nhận − tồn cuối kỳ. */
  const gqT = new Array(NP), ktT = new Array(NP);
  let kt = T.ktFirst;
  for (let pi = NP - 1; pi >= 0; pi--) { ktT[pi] = kt; gqT[pi] = kt + T.hs[pi] - T.tonEnd[pi]; kt = T.tonEnd[pi]; }
  const pct = (a, r) => Math.round((a * r) / 100);
  const put = (list, key, p, vals) => vals.forEach((v, i) => { list[i].v[p][key] = v; });
  const col = (list, key, p) => list.map((r) => r.v[p][key]);

  PS.forEach((p, pi) => {
    const hsT = T.hs[pi], soT = pct(hsT, T.soShare);
    put(SO, 'hs', p, hccAlloc(soT, SO.map((r) => r.w * (0.92 + 0.16 * g()))));
    put(WD, 'hs', p, hccAlloc(hsT - soT, WD.map((r) => r.w * (0.9 + 0.2 * g()))));
    const hs = col(R, 'hs', p);
    put(R, 'gq', p, hccAlloc(gqT[pi], hs.map((v) => v * (0.96 + 0.08 * g()) + 0.01)));
    const gq = col(R, 'gq', p);
    const treT = pct(gqT[pi], T.treR[pi]);
    put(R, 'tre', p, hccAlloc(treT, R.map((r, i) => gq[i] * (0.2 + 2.6 * Math.pow(1 - r.q, 2)) * (0.85 + 0.3 * g()) + 0.001), gq));
    const tre = col(R, 'tre', p);
    put(R, 'th', p, hccAlloc(pct(gqT[pi], T.thR[pi]), R.map((r, i) => (gq[i] - tre[i]) * (0.6 + 0.8 * r.q) + 0.001), gq.map((v, i) => v - tre[i])));
    R.forEach((r) => { const o = r.v[p]; o.dh = o.gq - o.tre - o.th; });
    /* Đang xử lý cuối kỳ: chia tổng tồn cuối kỳ theo quy mô hồ sơ (tổng các đơn vị = tồn Thành phố theo lĩnh vực).
       Đang xử lý trễ hạn: đơn vị chất lượng kém có tỷ lệ quá hạn cao hơn, không vượt số đang xử lý. */
    put(R, 'dxl', p, hccAlloc(T.tonEnd[pi], hs.map((v, i) => v * (0.9 + 0.2 * g()) * (1.25 - 0.5 * R[i].q) + 0.01)));
    const dxl = col(R, 'dxl', p);
    put(R, 'dxlt', p, hccAlloc(pct(T.tonEnd[pi], T.dxlTreR[pi]), R.map((r, i) => dxl[i] * (0.15 + 2.4 * Math.pow(1 - r.q, 2)) * (0.85 + 0.3 * g()) + 0.001), dxl));
    R.forEach((r) => { const o = r.v[p]; o.dxlth = o.dxl - o.dxlt; });
    put(R, 'sh', p, hccAlloc(pct(hsT, T.shR[pi]), R.map((r, i) => hs[i] * (0.75 + 0.45 * r.q) * (r.kind === 'so' ? 1.05 : 1) + 0.001), hs.map((v) => Math.floor(v * 0.995))));   // trần 99,5%: không đơn vị nào số hóa tròn 100%
    put(R, 'tp', p, hccAlloc(pct(hsT, T.tpR[pi]), R.map((r, i) => hs[i] * (r.kind === 'so' ? 1.6 : 0.8) * (0.9 + 0.2 * r.rg()) + 0.001), hs));
    const tp = col(R, 'tp', p);
    put(R, 'ttt', p, hccAlloc(pct(pct(hsT, T.tpR[pi]), T.tttR[pi]), R.map((r, i) => tp[i] * (0.45 + 0.9 * r.q) + 0.001), tp));
    R.forEach((r) => { const o = r.v[p]; o.tkh = o.tp - o.ttt; });
    const dgT = pct(gqT[pi], T.dgR[pi]);
    put(R, 'dg', p, hccAlloc(dgT, R.map((r, i) => gq[i] * (0.6 + 0.8 * r.q) + 0.001), gq));
    const dg = col(R, 'dg', p);
    const badT = pct(dgT, T.badR[pi]), hlT = pct(dgT, T.hlR[pi]), btT = dgT - hlT - badT;
    const bad = hccAlloc(badT, R.map((r, i) => dg[i] * (0.25 + 2.4 * Math.pow(1 - r.q, 2)) + 0.001), dg);
    const rk = hccAlloc(Math.round(badT * 0.28), bad.map((v) => v + 0.001), bad);
    R.forEach((r, i) => { r.v[p].rkhl = rk[i]; r.v[p].khl = bad[i] - rk[i]; });
    const bt = hccAlloc(btT, R.map((r, i) => (dg[i] - bad[i]) * (0.5 + (1 - r.q)) + 0.001), dg.map((v, i) => v - bad[i]));
    const hlAll = dg.map((v, i) => v - bad[i] - bt[i]);
    const rhl = hccAlloc(Math.round(hlT * T.rhlShare[pi] / 100), R.map((r, i) => hlAll[i] * (0.8 + 0.4 * r.q) + 0.001), hlAll);
    R.forEach((r, i) => { const o = r.v[p]; o.bt = bt[i]; o.rhl = rhl[i]; o.hl = hlAll[i] - rhl[i]; });
    /* Thủ tục theo đơn vị (danh mục, không cộng lên Thành phố) */
    R.forEach((r) => {
      const o = r.v[p];
      o.tthc = r.n0 - Math.floor(pi / 2);
      const ttR = hccClamp(T.ttUnitR[pi] + (r.q - 0.5) * 22 + (r.kind === 'so' ? -3 : 0), 12, 96);
      const mpR = hccClamp(T.mpUnitR[pi] - (r.q - 0.5) * 12, 2, 100 - ttR);
      o.tt = Math.round((o.tthc * ttR) / 100);
      o.mp = Math.min(o.tthc - o.tt, Math.round((o.tthc * mpR) / 100));
      o.ctt = o.tthc - o.tt - o.mp;
    });
  });

  /* Theo lĩnh vực (chỉ cấp Thành phố) — dựng từ kỳ cũ nhất để tồn cuối kỳ trước = chuyển sang kỳ sau, khớp từng lĩnh vực */
  const LV = {};
  let prevTon = null;
  for (let pi = NP - 1; pi >= 0; pi--) {
    const p = PS[pi], hsT = T.hs[pi];
    const tong = hccAlloc(hsT, HCC_LV.map((l) => l[2] * (0.95 + 0.1 * g())));
    const olW = HCC_LV.map((l, i) => tong[i] * hccClamp(T.olR[pi] + l[3], 5, 99) / 100 + 0.001);
    const ol = hccAlloc(pct(hsT, T.olR[pi]), olW, tong);
    const bc = hccAlloc(pct(hsT, T.bcR[pi]), HCC_LV.map((l, i) => tong[i] * (['datdai', 'lltp', 'dkkd'].indexOf(l[0]) >= 0 ? 2 : 1) + 0.001), tong.map((v, i) => v - ol[i]));
    const kt = prevTon || hccAlloc(ktT[pi], tong.map((v) => v + 0.001));
    const avail = tong.map((v, i) => v + kt[i]);
    const ht = hccAlloc(gqT[pi], avail.map((v) => v * (0.97 + 0.04 * g())), avail);
    LV[p] = HCC_LV.map((l, i) => ({ id: l[0], name: l[1], tong: tong[i], ol: ol[i], bc: bc[i], tti: tong[i] - ol[i] - bc[i], kt: kt[i], ht: ht[i], ton: avail[i] - ht[i] }));
    prevTon = LV[p].map((x) => x.ton);
  }

  HCC_CACHE = { R: R, LV: LV, gqT: gqT, ktT: ktT, late: {}, proc: {} };
  return HCC_CACHE;
}
function hccUnits() { return hccBuild().R; }
function hccPrevPeriod(id) { const i = HCC_PERIODS.findIndex((p) => p.id === id); return i >= 0 && i < HCC_PERIODS.length - 1 ? HCC_PERIODS[i + 1].id : null; }
function hccSameLastYear(id) { const p = HCC_PERIODS.find((x) => x.id === id); if (!p) return null; const q = HCC_PERIODS.find((x) => x.y === p.y - 1 && x.q === p.q); return q ? q.id : null; }

/* Số Thành phố của một kỳ: cộng dồn các đơn vị (kèm tổng theo khối: trường@so, trường@p, trường@x) + số chỉ có ở cấp
   Thành phố (lĩnh vực, kênh nộp, tồn, số thủ tục nút gốc, tài khoản). */
function hccCity(p) {
  const D = hccBuild(), pi = HCC_PERIODS.findIndex((x) => x.id === p);
  if (pi < 0) return null;
  const T = HCC_TARGETS, o = {};
  HCC_UFIELDS.forEach((k) => {
    o[k] = 0; HCC_KHOI.forEach((kh) => { o[k + '@' + kh[0]] = 0; });
    D.R.forEach((r) => { o[k] += r.v[p][k]; o[k + '@' + r.kind] += r.v[p][k]; });
  });
  const lv = D.LV[p];
  o.lv = lv;
  ['ol', 'bc', 'tti', 'kt', 'ht', 'ton'].forEach((k) => { o[k] = lv.reduce((a, x) => a + x[k], 0); });
  o.tong = lv.reduce((a, x) => a + x.tong, 0);
  lv.forEach((x) => { o['lv_' + x.id] = x.tong; o['lvht_' + x.id] = x.ht; });
  o.tthcC = T.tthcCity[pi]; o.ttC = T.ttCity[pi]; o.mpC = T.mpCity[pi]; o.cttC = T.tthcCity[pi] - T.ttCity[pi] - T.mpCity[pi];
  o.cd = T.tkCd[pi]; o.dn = T.tkDn[pi];
  o.bad = o.khl + o.rkhl; o.good = o.rhl + o.hl; o.dung = o.th + o.dh;
  HCC_KHOI.forEach((kh) => { const s = '@' + kh[0]; o['dung' + s] = o['th' + s] + o['dh' + s]; o['csh' + s] = o['hs' + s] - o['sh' + s]; });
  o.csh = o.hs - o.sh;
  return o;
}

function hccHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function hccD2(n) { return (n < 10 ? '0' : '') + n; }
function hccDateStr(d) { return hccD2(d.getUTCDate()) + '/' + hccD2(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear(); }
/* ttgqhs_detail: danh sách mẫu hồ sơ TRỄ HẠN của một đơn vị trong kỳ (tối đa max dòng, số dòng thật = số trễ hạn).
   Tên người nộp che bớt; mã hồ sơ, tên thủ tục, ngày tháng là mẫu. */
const HCC_HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Công ty TNHH', 'Công ty CP', 'Hộ kinh doanh'];
function hccLateList(r, p, max) {
  const D = hccBuild(), key = r.name + '|' + p;
  if (!D.late[key]) {
    const per = HCC_PERIODS.find((x) => x.id === p), rg = hccRng(hccHash(key));
    const n = Math.min(r.v[p].tre, 40), out = [];
    const pool = [];
    r.lv.forEach((l) => (HCC_TTHC_MAU[l] || []).forEach((t) => pool.push([l, t])));
    const qStart = Date.UTC(per.y, (per.q - 1) * 3, 1);
    const code = (r.kind === 'so' ? 'S' : 'X') + hccD2((Math.abs(hccHash(r.name)) % 97) + 1);
    for (let i = 0; i < n; i++) {
      const t = pool[Math.floor(rg() * pool.length)];
      const rec = new Date(qStart + Math.floor(rg() * 80) * 86400000);
      const han = 3 + Math.floor(rg() * 25);
      const exp = new Date(rec.getTime() + han * 86400000);
      const late = 1 + Math.floor(Math.pow(rg(), 2) * 20);
      const done = new Date(exp.getTime() + late * 86400000);
      const ho = HCC_HO[Math.floor(rg() * HCC_HO.length)];
      out.push({ code: 'H01.' + code + '-' + String(rec.getUTCFullYear()).slice(2) + hccD2(rec.getUTCMonth() + 1) + hccD2(rec.getUTCDate()) + '-' + String(1000 + Math.floor(rg() * 9000)),
        applicant: ho + ' ' + (ho.length > 6 ? '***' : String.fromCharCode(65 + Math.floor(rg() * 20)) + '. ***'), tthc: t[1], lv: t[0],
        rec: hccDateStr(rec), exp: hccDateStr(exp), done: hccDateStr(done), late: late, status: 'Đã trả kết quả, trễ hạn' });
    }
    out.sort((a, b) => b.late - a.late);
    D.late[key] = out;
  }
  return D.late[key].slice(0, max || 40);
}
/* Danh sách mẫu hồ sơ ĐANG XỬ LÝ TRỄ HẠN của một đơn vị tại ngày cuối kỳ (chưa trả kết quả, hạn xử lý đã qua).
   Số ngày quá hạn = ngày cuối kỳ − hạn xử lý. Nguồn thật: API hồ sơ phát sinh (chưa có ngày hoàn thành) + API tiến trình xử lý. */
const HCC_DXL_ST = ['Đang xử lý', 'Đang xử lý', 'Đang xử lý', 'Yêu cầu bổ sung giấy tờ', 'Yêu cầu thực hiện nghĩa vụ tài chính'];
function hccOpenLateList(r, p, max) {
  const D = hccBuild(), key = 'o|' + r.name + '|' + p;
  if (!D.late[key]) {
    const per = HCC_PERIODS.find((x) => x.id === p), rg = hccRng(hccHash(key));
    const n = Math.min(r.v[p].dxlt, 40), out = [];
    const pool = [];
    r.lv.forEach((l) => (HCC_TTHC_MAU[l] || []).forEach((t) => pool.push([l, t])));
    const qEnd = Date.UTC(per.y, per.q * 3, 0);   // ngày cuối quý
    const code = (r.kind === 'so' ? 'S' : 'X') + hccD2((Math.abs(hccHash(r.name)) % 97) + 1);
    for (let i = 0; i < n; i++) {
      const t = pool[Math.floor(rg() * pool.length)];
      const over = 1 + Math.floor(Math.pow(rg(), 2.2) * 45);
      const exp = new Date(qEnd - over * 86400000);
      const rec = new Date(exp.getTime() - (3 + Math.floor(rg() * 25)) * 86400000);
      const ho = HCC_HO[Math.floor(rg() * HCC_HO.length)];
      out.push({ code: 'H01.' + code + '-' + String(rec.getUTCFullYear()).slice(2) + hccD2(rec.getUTCMonth() + 1) + hccD2(rec.getUTCDate()) + '-' + String(1000 + Math.floor(rg() * 9000)),
        applicant: ho + ' ' + (ho.length > 6 ? '***' : String.fromCharCode(65 + Math.floor(rg() * 20)) + '. ***'), tthc: t[1], lv: t[0],
        rec: hccDateStr(rec), exp: hccDateStr(exp), late: over, status: HCC_DXL_ST[Math.floor(rg() * HCC_DXL_ST.length)] });
    }
    out.sort((a, b) => b.late - a.late);
    D.late[key] = out;
  }
  return D.late[key].slice(0, max || 40);
}
/* tthc_truc_tuyen_detail: ví dụ mức cung cấp trực tuyến của một số thủ tục của đơn vị, chia ba mức theo đúng tỷ lệ của
   đơn vị đó (tên thủ tục là tên mẫu theo lĩnh vực, không phải danh mục thật). Xếp: chưa trực tuyến → một phần → toàn trình. */
function hccProcList(r, p) {
  const D = hccBuild(), key = r.name + '|' + p;
  if (!D.proc[key]) {
    const rg = hccRng(hccHash(key) ^ 0x5bd1e995), o = r.v[p], out = [];
    const pool = [];
    r.lv.forEach((l) => (HCC_TTHC_MAU[l] || []).forEach((t) => pool.push(t)));
    pool.sort(() => rg() - 0.5);
    const [nCt, nMp] = hccAlloc(pool.length, [o.ctt, o.mp, o.tt]);   // chia theo phần dư lớn nhất: đúng tỷ lệ kể cả khi danh sách ngắn
    pool.forEach((t, i) => out.push({ name: t, muc: i < nCt ? 'Chưa trực tuyến' : i < nCt + nMp ? 'Một phần' : 'Toàn trình' }));
    D.proc[key] = out;
  }
  return D.proc[key];
}

/* ---------- Cây chỉ tiêu (màn "Chi tiết theo cấp bậc") ----------
   f: danh sách trường của số Thành phố cộng lại; nút không có f thì lấy tổng các con. den: mẫu số để hiện tỷ lệ phụ.
   inv: giảm là tốt. neutral: tăng/giảm không tự thân tốt/xấu. cityOnly: số chỉ có ở cấp Thành phố. */
const HCC_S1 = 'var(--s1)', HCC_S2 = 'var(--s2)', HCC_S3 = 'var(--s3)', HCC_S4 = 'var(--s4)', HCC_S5 = 'var(--s5)';
function hccKhoiKids(pre, extra) {
  return HCC_KHOI.map((k, i) => Object.assign({ id: pre + '_' + k[0], label: k[1], f: [pre + '@' + k[0]], color: [HCC_S4, HCC_S1, HCC_S3][i] }, extra || {}));
}
const HCC_TREE = [
  { id: 'tiepnhan', group: 'tn', label: 'Hồ sơ tiếp nhận mới', unit: 'hồ sơ', kind: 'add', src: 'thong_ke_theo_linh_vuc · total', xa: 'hoso',
    kids: [{ id: 'k_ol', label: 'Nộp trực tuyến', f: ['ol'], color: HCC_S1, field: 'totalTrucTuyen' }, { id: 'k_tti', label: 'Nộp trực tiếp', f: ['tti'], color: HCC_S4, neutral: true, field: 'totalTrucTiep' }, { id: 'k_bc', label: 'Qua bưu chính', f: ['bc'], color: HCC_S3, neutral: true, field: 'totalBCCI' }] },
  { id: 'linhvuc', group: 'tn', label: 'Hồ sơ tiếp nhận theo lĩnh vực', unit: 'hồ sơ', kind: 'add', src: 'thong_ke_theo_linh_vuc · total', xa: 'hoso', neutral: true,
    kids: HCC_LV.slice(0, 5).map((l, i) => ({ id: 'lv_' + l[0], label: l[1], f: ['lv_' + l[0]], color: [HCC_S1, HCC_S2, HCC_S3, HCC_S4, HCC_S5][i], neutral: true, filt: 'name = ' + l[1] }))
      .concat([{ id: 'lv_con', label: 'Các lĩnh vực còn lại', f: HCC_LV.slice(5).map((l) => 'lv_' + l[0]), color: 'var(--prev)', neutral: true, filt: HCC_LV.length - 5 + ' lĩnh vực' }]) },
  { id: 'giaiquyet', group: 'gq', label: 'Hồ sơ đã giải quyết', unit: 'hồ sơ', kind: 'add', src: 'ttgqhs · totalTruocHan + totalDungHan + totalTreHan', xa: 'giaiquyet',
    kids: [{ id: 'g_th', label: 'Trước hạn', color: HCC_S1, field: 'totalTruocHan', kids: hccKhoiKids('th') },
      { id: 'g_dh', label: 'Đúng hạn', color: HCC_S3, neutral: true, field: 'totalDungHan', kids: hccKhoiKids('dh', { neutral: true }) },
      { id: 'g_tre', label: 'Trễ hạn', color: HCC_S2, inv: true, field: 'totalTreHan', kids: hccKhoiKids('tre', { inv: true }) }] },
  { id: 'dangxl', group: 'gq', label: 'Hồ sơ đang xử lý cuối kỳ', unit: 'hồ sơ', kind: 'add', src: 'hồ sơ phát sinh · chưa có date_of_completion', xa: 'dangxltre', inv: true,
    kids: [{ id: 'x_th', label: 'Còn trong hạn', color: HCC_S3, neutral: true, field: 'date_of_expiration ≥ cuối kỳ', kids: hccKhoiKids('dxlth', { neutral: true }) },
      { id: 'x_qh', label: 'Đã quá hạn (đang xử lý trễ hạn)', color: HCC_S2, inv: true, field: 'date_of_expiration < cuối kỳ', kids: hccKhoiKids('dxlt', { inv: true }) }] },
  { id: 'tthc', group: 'dvc', label: 'Thủ tục hành chính của Thành phố', unit: 'thủ tục', kind: 'add', src: 'tthc_truc_tuyen · total (nút gốc)', xa: 'toantrinh', cityOnly: true,
    kids: [{ id: 't_tt', label: 'Trực tuyến toàn trình', f: ['ttC'], color: HCC_S1, field: 'total_TT', den: ['tthcC'], denTxt: 'số thủ tục' },
      { id: 't_mp', label: 'Trực tuyến một phần', f: ['mpC'], color: HCC_S4, neutral: true, field: 'total_1Phan', den: ['tthcC'], denTxt: 'số thủ tục' },
      { id: 't_ct', label: 'Chưa trực tuyến', f: ['cttC'], color: HCC_S2, inv: true, field: 'total_ChuaTT', den: ['tthcC'], denTxt: 'số thủ tục' }] },
  { id: 'thanhtoan', group: 'dvc', label: 'Hồ sơ có phí, lệ phí', unit: 'hồ sơ', kind: 'add', src: 'thanh_toan_truc_tuyen · total', xa: 'thanhtoan', neutral: true,
    kids: [{ id: 'p_tt', label: 'Thanh toán trực tuyến', color: HCC_S1, field: 'total_TT', kids: hccKhoiKids('ttt') },
      { id: 'p_kh', label: 'Hình thức khác', color: 'var(--prev)', neutral: true, field: 'total_Other', kids: hccKhoiKids('tkh', { neutral: true }) }] },
  { id: 'sohoa', group: 'sh', label: 'Hồ sơ tiếp nhận của các đơn vị', unit: 'hồ sơ', kind: 'add', src: 'so_hoa_ho_so · total', xa: 'sohoa', neutral: true,
    kids: [{ id: 's_sh', label: 'Đã số hóa', color: HCC_S1, field: 'total_SH', den: ['hs'], denTxt: 'hồ sơ tiếp nhận', kids: hccKhoiKids('sh') },
      { id: 's_ch', label: 'Chưa số hóa', color: HCC_S2, inv: true, field: 'total − total_SH', den: ['hs'], denTxt: 'hồ sơ tiếp nhận', kids: hccKhoiKids('csh', { inv: true }) }] },
  { id: 'danhgia', group: 'hl', label: 'Lượt đánh giá', unit: 'lượt', kind: 'add', src: 'muc_do_hai_long · total', xa: 'hailong', neutral: true,
    kids: [{ id: 'd_rhl', label: 'Rất hài lòng', f: ['rhl'], color: HCC_S1, field: 'rat_Hai_Long', den: ['dg'], denTxt: 'lượt' },
      { id: 'd_hl', label: 'Hài lòng', f: ['hl'], color: HCC_S3, field: 'hai_Long', den: ['dg'], denTxt: 'lượt' },
      { id: 'd_bt', label: 'Bình thường', f: ['bt'], color: 'var(--prev)', neutral: true, field: 'binh_Thuong', den: ['dg'], denTxt: 'lượt' },
      { id: 'd_khl', label: 'Không hài lòng', f: ['khl'], color: HCC_S4, inv: true, field: 'khong_Hai_Long', den: ['dg'], denTxt: 'lượt' },
      { id: 'd_rkhl', label: 'Rất không hài lòng', f: ['rkhl'], color: HCC_S2, inv: true, field: 'rat_Khong_Hai_Long', den: ['dg'], denTxt: 'lượt' }] },
  { id: 'taikhoan', group: 'tn', label: 'Tài khoản trên Cổng dịch vụ công', unit: 'tài khoản', kind: 'add', src: 'thong_ke_tai_khoan', xa: null, cityOnly: true,
    kids: [{ id: 'a_cd', label: 'Công dân', f: ['cd'], color: HCC_S1, field: 'congDan' }, { id: 'a_dn', label: 'Doanh nghiệp', f: ['dn'], color: HCC_S3, field: 'doanhNghiep' }] }
];

function hccSum(o, keys) { if (!o) return null; let s = 0; for (const k of keys) { if (o[k] == null) return null; s += o[k]; } return s; }
function hccEvalTree(spec, oNow, oPrev) {
  const ev = (n) => {
    const kids = (n.kids || []).map(ev);
    let now = null, prev = null, den = null, denPrev = null;
    if (n.f) { now = hccSum(oNow, n.f); prev = hccSum(oPrev, n.f); }
    else if (kids.length) { now = kids.every((k) => k.now != null) ? kids.reduce((s, k) => s + k.now, 0) : null; prev = kids.every((k) => k.prev != null) ? kids.reduce((s, k) => s + k.prev, 0) : null; }
    if (n.den) { den = hccSum(oNow, n.den); denPrev = hccSum(oPrev, n.den); }
    return Object.assign({}, n, { kind: 'add', now: now, prev: prev, den: den, denPrev: denPrev, kids: kids });
  };
  return ev(spec);
}

/* ---------- Chỉ tiêu xem theo đơn vị (các sở/ngành trong HCC_SO + 126 phường/xã) ----------
   type 'count': cộng các parts; 'ratio': num/den (× m). cols: cột thành phần của bảng. better: high|low|none. */
/* Ngưỡng xếp hạng (anh yêu cầu 02/10/2026): chỉ tiêu tỷ lệ chỉ xếp hạng đơn vị có mẫu số từ HCC_XA_MIN_DEN trở lên
   (minDen riêng của chỉ tiêu nếu có; minDen = 0 là không áp ngưỡng). Đơn vị quá nhỏ (Sở Ngoại vụ, Thanh tra Thành phố...)
   vẫn hiện trong bảng nhưng không xếp hạng, không tính vào tốt nhất/kém nhất và số đơn vị kém hơn mức Thành phố,
   vì tỷ lệ trên vài hồ sơ dễ ra 0% hoặc 100%. */
const HCC_XA_MIN_DEN = 30;
function hccXaMin(ind) { return ind.type !== 'ratio' ? 0 : ind.minDen != null ? ind.minDen : HCC_XA_MIN_DEN; }
function hccXaOk(ind, o) { const mn = hccXaMin(ind); return !mn || (o != null && ind.den(o) >= mn); }
function hccCnt(k, label) { return { label: label, f: (o) => o[k], d: 0 }; }
function hccRat(label, f, d, pct) { return { label: label, f: f, d: d, pct: pct }; }
function hccDv(a, b, m) { return a == null || b == null || !b ? null : (a / b) * m; }
const HCC_XA_INDS = [
  { id: 'hoso', g: 'tn', label: 'Hồ sơ tiếp nhận', unit: 'hồ sơ', type: 'count', parts: [hccCnt('sh', 'Đã số hóa'), hccRat('Chưa số hóa', (o) => o.hs - o.sh, 0)], better: 'none', src: 'so_hoa_ho_so · total', vh: 'Tổng', tree: 'tiepnhan' },
  { id: 'giaiquyet', g: 'gq', label: 'Hồ sơ đã giải quyết', unit: 'hồ sơ', type: 'count', parts: [hccCnt('th', 'Trước hạn'), hccCnt('dh', 'Đúng hạn'), hccCnt('tre', 'Trễ hạn')], better: 'none', src: 'ttgqhs', vh: 'Tổng', tree: 'giaiquyet' },
  { id: 'dunghan', g: 'gq', label: 'Tỷ lệ giải quyết đúng hạn', type: 'ratio', num: (o) => o.th + o.dh, den: (o) => o.gq, m: 100, pct: true, d: 2, cols: [hccRat('Trước hạn', (o) => hccDv(o.th, o.gq, 100), 1, true), hccCnt('tre', 'Số trễ hạn'), hccCnt('gq', 'Đã giải quyết')], better: 'high', src: 'ttgqhs', vh: 'Đúng hạn', numL: 'Trước hạn + đúng hạn', denL: 'Đã giải quyết', tree: 'giaiquyet' },
  { id: 'trehan', g: 'gq', label: 'Tỷ lệ hồ sơ trễ hạn', type: 'ratio', num: (o) => o.tre, den: (o) => o.gq, m: 100, pct: true, d: 2, cols: [hccCnt('tre', 'Trễ hạn'), hccCnt('gq', 'Đã giải quyết')], better: 'low', src: 'ttgqhs · totalTreHan', vh: 'Trễ hạn', numL: 'Hồ sơ trễ hạn', denL: 'Đã giải quyết', tree: 'giaiquyet' },
  { id: 'dangxltre', g: 'gq', label: 'Tỷ lệ hồ sơ đang xử lý trễ hạn', type: 'ratio', num: (o) => o.dxlt, den: (o) => o.dxl, m: 100, pct: true, d: 2, cols: [hccCnt('dxlt', 'Đang xử lý trễ hạn'), hccCnt('dxl', 'Đang xử lý')], better: 'low', src: 'hồ sơ phát sinh · date_of_expiration', vh: 'Trễ hạn', numL: 'Hồ sơ đang xử lý trễ hạn', denL: 'Hồ sơ đang xử lý cuối kỳ', tree: 'dangxl', openLate: true },
  { id: 'toantrinh', g: 'dvc', label: 'Tỷ lệ thủ tục trực tuyến toàn trình', type: 'ratio', num: (o) => o.tt, den: (o) => o.tthc, m: 100, pct: true, d: 1, cols: [hccCnt('tt', 'Toàn trình'), hccCnt('mp', 'Một phần'), hccCnt('ctt', 'Chưa TT'), hccCnt('tthc', 'Số thủ tục')], better: 'high', src: 'tthc_truc_tuyen · total_TT', vh: 'Toàn trình', numL: 'Thủ tục toàn trình', denL: 'Số thủ tục', tree: 'tthc', procs: true, minDen: 0 },
  { id: 'dvctt', g: 'dvc', label: 'Tỷ lệ thủ tục có dịch vụ công trực tuyến', type: 'ratio', num: (o) => o.tt + o.mp, den: (o) => o.tthc, m: 100, pct: true, d: 1, cols: [hccCnt('tt', 'Toàn trình'), hccCnt('mp', 'Một phần'), hccCnt('tthc', 'Số thủ tục')], better: 'high', src: 'tthc_truc_tuyen', vh: 'Có DVC TT', numL: 'Toàn trình + một phần', denL: 'Số thủ tục', tree: 'tthc', procs: true, minDen: 0 },
  { id: 'thanhtoan', g: 'dvc', label: 'Tỷ lệ thanh toán trực tuyến', type: 'ratio', num: (o) => o.ttt, den: (o) => o.tp, m: 100, pct: true, d: 1, cols: [hccCnt('tp', 'Hồ sơ có phí'), hccCnt('ttt', 'Trực tuyến'), hccCnt('tkh', 'Hình thức khác')], better: 'high', src: 'thanh_toan_truc_tuyen', vh: 'Tỷ lệ', numL: 'Thanh toán trực tuyến', denL: 'Hồ sơ có phí', tree: 'thanhtoan' },
  { id: 'sohoa', g: 'sh', label: 'Tỷ lệ số hóa hồ sơ', type: 'ratio', num: (o) => o.sh, den: (o) => o.hs, m: 100, pct: true, d: 1, cols: [hccCnt('hs', 'Tiếp nhận'), hccCnt('sh', 'Đã số hóa')], better: 'high', src: 'so_hoa_ho_so · total_SH', vh: 'Tỷ lệ', numL: 'Hồ sơ đã số hóa', denL: 'Hồ sơ tiếp nhận', tree: 'sohoa' },
  { id: 'hailong', g: 'hl', label: 'Tỷ lệ hài lòng', type: 'ratio', num: (o) => o.rhl + o.hl, den: (o) => o.dg, m: 100, pct: true, d: 2, cols: [hccRat('Rất HL', (o) => hccDv(o.rhl, o.dg, 100), 1, true), hccRat('Hài lòng', (o) => hccDv(o.hl, o.dg, 100), 1, true), hccRat('Bình thường', (o) => hccDv(o.bt, o.dg, 100), 1, true)], better: 'high', src: 'muc_do_hai_long', vh: 'Hài lòng', numL: 'Rất hài lòng + hài lòng', denL: 'Lượt đánh giá', tree: 'danhgia' },
  { id: 'khonghl', g: 'hl', label: 'Tỷ lệ không hài lòng', type: 'ratio', num: (o) => o.khl + o.rkhl, den: (o) => o.dg, m: 100, pct: true, d: 2, cols: [hccCnt('khl', 'Không HL'), hccCnt('rkhl', 'Rất không HL'), hccCnt('dg', 'Lượt đánh giá')], better: 'low', src: 'muc_do_hai_long', vh: 'Không HL', numL: 'Không hài lòng + rất không hài lòng', denL: 'Lượt đánh giá', tree: 'danhgia', minDen: 50 },
  { id: 'danhgia', g: 'hl', label: 'Tỷ lệ hồ sơ được đánh giá', type: 'ratio', num: (o) => o.dg, den: (o) => o.gq, m: 100, pct: true, d: 1, cols: [hccCnt('dg', 'Lượt đánh giá'), hccCnt('gq', 'Đã giải quyết')], better: 'high', src: 'muc_do_hai_long · total ÷ ttgqhs', vh: 'Tỷ lệ', numL: 'Lượt đánh giá', denL: 'Hồ sơ đã giải quyết', tree: 'danhgia' }
];
