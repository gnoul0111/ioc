/* ============================== CHỈ TIÊU THEO EFORM CẤP THÀNH PHỐ (4 trục, các sở) — KHUNG DÙNG CHUNG ==============================
   Theo docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28 (tóm tắt ở AGENTS.md):
     · chỉ dùng trường của eform (js/core/eform-khung.js, sinh từ file eform); mọi trường hiện ở màn "Dữ liệu đã nhập";
     · số đã nhập là số hiển thị; số IOC tính (tỷ lệ, hiệu) ghi rõ "IOC tính" và công thức theo tên trường;
     · mọi số lần lại được bản ghi (bấm dòng ở bảng nhóm, cột biểu đồ → các bản ghi tạo ra số đó);
     · kỳ xem chọn Tháng / Quý / Năm (X12); bản tháng và bản quý cùng khóa không cộng chồng (X2); bản trùng khóa lấy bản sau (X1).
   Khai báo một đơn vị: ctmEformDonVi({ id, role, name, org, short, eforms: [cấu hình eform], kpis: [{ ef, m }], card: [khóa], laEform: đơn vị là chính một eform,
     locTk: lọc sẵn theo tài khoản (xem efLocTk), cardL: { khóa: nhãn } nhãn riêng của dòng thẻ ngoài }).
   Cấu hình một eform (theo bản đọc eform đã duyệt, docs/BAN_DOC_EFORM):
     { ef: mã eform trong EFORM_KHUNG, ten: tên ngắn, banGhi: "một bản ghi là…", khoa: [trường khóa, không gồm kỳ], khoaRong: [trường khóa được để trống],
       cap: [trường chia cấp, cấp 1 trước], chi: { mã: chỉ tiêu }, cot: [mã chỉ tiêu hiện ở bảng], bieu: [biểu đồ],
       diaBan: trường địa bàn (xem theo địa bàn), kt: [{ l, c: [trường tô màu], f: (R) => true nếu cần xem lại }] }
   Chỉ tiêu: { l, u?, d?, loc?: { trường: [mã] } (chỉ tính bản ghi khớp), dvt?: true (không cộng khác «Đơn vị tính» cfg.dvt),
               loai: 'dem' | 'demkhac' (c) | 'dembang' (c, v: [mã]) | 'demdk' (f: (R) => true, mt: chữ mô tả) | 'cong' (c hoặc [c…]) |
               'td' (c — tại thời điểm, mỗi khóa lấy kỳ cuối) | 'dau' (c — đầu kỳ, mỗi khóa lấy kỳ đầu) |
               'motlan' (c, theo: [trường | '_kyId'] — mỗi tổ hợp lấy một lần) | 'nhap' (c — số đã nhập, chỉ hiện khi một bản ghi) |
               'tyle' (tu, mau: mã chỉ tiêu; IOC tính = tu ÷ mau × 100) | 'hieu' (a, b; IOC tính = a − b) | 'tang' (tu, mau; IOC tính = tu ÷ mau × 100 − 100) }
   Biểu đồ: { loai: 'cot' (t, theo, m) | 'chong' (t, theo, m) | 'xu' (t, m) | 'phan' (t, ms: [chỉ tiêu cộng thành tổng]) | 'ds' (t, ms: [chỉ tiêu]) }.
   Thêm: bang: [{ t, cap, cot }] bảng phụ (bỏ bản ghi để trống trường cấp 1); uuTien: { c, v, theo } — cùng tổ hợp «theo» có bản ghi
   trường c = v (VD «Loại bản ghi» = Tổng hợp) thì chỉ dùng các bản ghi đó. bo: { trường: [mã] } — bản ghi có trường = mã (VD «Không phát sinh»)
   không tính vào chỉ tiêu nào (vẫn hiện ở Dữ liệu đã nhập). luuY: câu lưu ý riêng của eform, hiện ở màn eform và Dữ liệu đã nhập.
   Bản ghi lấy từ EF_NGUON (js/core/eform-mau.js — đang là bản ghi mẫu dựng theo khung eform). */

/* ---------- Khung eform ---------- */
const EFK = {};
EFORM_KHUNG.forEach((k) => k.eforms.forEach((ef) => { ef.khoi = k.id; ef.sheet = k.sheet; ef.F = {}; ef.fields.forEach((f) => { ef.F[f.c] = f; }); EFK[ef.id] = ef; }));
const EF_KY_TRUONG = ['ky_bao_cao', 'nam', 'thang', 'quy'];

/* ---------- Kỳ xem: Tháng / Quý / Năm (X12). Dữ liệu từ tháng 1/2025 đến tháng 9/2026 ---------- */
const EF_KY = (function () {
  const thang = [], quy = [], nam = [];
  for (let y = 2026; y >= 2025; y--) {
    for (let m = y === 2026 ? 9 : 12; m >= 1; m--) thang.push({ id: y + '-' + String(m).padStart(2, '0'), label: 'Tháng ' + m + '/' + y, short: 'T' + m + '/' + String(y).slice(2) });
    for (let q = y === 2026 ? 3 : 4; q >= 1; q--) quy.push({ id: y + 'Q' + q, label: 'Quý ' + q + '/' + y, short: 'Q' + q + '/' + String(y).slice(2) });
    nam.push({ id: String(y), label: 'Năm ' + y + (y === 2026 ? ' (đến tháng 9)' : ''), short: String(y) });
  }
  return { thang: thang, quy: quy, nam: nam };
})();
const EF_GRAN = [['thang', 'Tháng'], ['quy', 'Quý'], ['nam', 'Năm']];
const EF_SO_TRUOC = { thang: 'tháng trước', quy: 'quý trước', nam: 'năm trước' };
function efGran() { return CTM_UI.gran && EF_KY[CTM_UI.gran] ? CTM_UI.gran : 'quy'; }
function efGranOf(pid) { return /^\d{4}-\d{2}$/.test(pid) ? 'thang' : /Q/.test(pid) ? 'quy' : 'nam'; }
/* Kỳ của một bản ghi: { loai: 'thang' | 'quy' | 'nam', y, q, m } hoặc null khi thiếu năm, kỳ */
function efKyOf(R) {
  const y = Number(R.nam), k = R.ky_bao_cao;
  if (!k || (!y && ['thang', 'quy', 'nam'].indexOf(k) >= 0)) return null;
  if (k === 'thang') { const m = Number(R.thang); return m >= 1 && m <= 12 ? { loai: 'thang', y: y, q: Math.ceil(m / 3), m: m } : null; }
  if (k === 'quy') { const q = ['quy_i', 'quy_ii', 'quy_iii', 'quy_iv'].indexOf(R.quy) + 1; return q ? { loai: 'quy', y: y, q: q } : null; }
  if (k === 'nam') return { loai: 'nam', y: y };
  /* kỳ khác (VD «Đột xuất», Thanh tra eform 3): xếp vào tháng chứa «Ngày báo cáo» (bản đọc SO_THANH_TRA, câu 7) */
  const d = efNgay(R.ngay_bao_cao);
  if (d != null) { const t = new Date((d - 25569) * 864e5); return { loai: 'thang', y: t.getUTCFullYear(), q: Math.ceil((t.getUTCMonth() + 1) / 3), m: t.getUTCMonth() + 1 }; }
  return null;
}
function efPidOf(R, g) {
  const k = R._ky;
  if (!k) return null;
  if (g === 'thang') return k.loai === 'thang' ? k.y + '-' + String(k.m).padStart(2, '0') : null;
  if (g === 'quy') return k.loai === 'nam' ? null : k.y + 'Q' + k.q;
  return String(k.y);
}
const EF_HANG = { thang: 0, quy: 1, nam: 2 };
/* Eform không có trường «Năm» (chỉ có «Kỳ báo cáo»): bản ghi không xếp được vào kỳ nào — IOC không tự gán năm; mọi kỳ xem đều hiện
   toàn bộ bản ghi, cùng khóa lấy bản gửi sau cùng (X1) */
function efKhongKy(efId) { return !EFK[efId].F.nam; }
const EF_KHONG_KY_NOTE = 'Eform không có trường «Năm», «Tháng», «Quý» nên bản ghi không xếp được vào kỳ: mọi kỳ xem đều hiện toàn bộ bản ghi, cùng khóa lấy bản gửi sau cùng.';

/* ---------- Bản ghi ---------- */
const EF_CACHE = {};
const EF_CFG = {};
/* Mọi bản ghi của một eform: mã chuẩn hóa (X9), số dạng chữ đổi ra số, kỳ, đánh dấu bản trùng khóa đã bị bản sau thay (X1) */
function efAll(efId) {
  if (EF_CACHE[efId]) return EF_CACHE[efId];
  const ef = EFK[efId], cfg = EF_CFG[efId] || {}, khongKy = efKhongKy(efId);
  let src = [];
  try { src = (typeof EF_NGUON === 'function' ? EF_NGUON(efId) : []) || []; } catch (e) { src = []; }
  const recs = src.map((r0, i) => {
    const R = { _i: i };
    Object.keys(r0).forEach((c0) => {
      const c = xaEfNorm(c0), f = ef.F[c];
      let v = r0[c0];
      if (v == null || v === '') { R[c] = null; return; }
      if (f && f.t === 'dm') v = xaEfNorm(v);
      else if (f && f.t === 'so' && typeof v === 'string' && /^-?[\d.]+(,\d+)?$/.test(v.trim())) v = Number(v.trim().replace(/\./g, '').replace(',', '.'));
      else if (typeof v === 'string') v = v.trim();
      R[c] = v;
    });
    if (khongKy) { R._ky = null; R._kyId = '*'; R._ord = i; return R; }
    R._ky = efKyOf(R);
    R._kyId = R._ky ? (R._ky.loai === 'thang' ? efPidOf(R, 'thang') : R._ky.loai === 'quy' ? efPidOf(R, 'quy') : String(R._ky.y)) : null;
    R._ord = R._ky ? R._ky.y * 100 + (R._ky.m || (R._ky.q ? R._ky.q * 3 : 12)) : 0;
    return R;
  });
  const khoa = cfg.khoa || [];
  const last = {};
  recs.forEach((R) => {
    const k = khoa.map((c) => String(R[c] == null ? '' : R[c])).join('|') + '#' + R._kyId;
    if (last[k]) last[k]._thay = true;
    last[k] = R;
  });
  return (EF_CACHE[efId] = recs);
}
function efKhoa(cfg, R) { return (cfg.khoa || []).map((c) => String(R[c] == null ? '' : R[c])).join('|'); }
/* ---------- Lọc sẵn theo tài khoản (def.locTk = { ef, c: trường danh mục, tk: { mã tài khoản: mã trong danh mục, null khi danh mục không có } }) ----------
   VD tài khoản Ban HĐND mở eform 4 thì lọc sẵn «Đơn vị thực hiện» = Ban của mình, bỏ lọc được (TRUC_HDND, câu chốt 5).
   Chỉ lọc khi đang mở đúng đơn vị đó; thẻ, màn ngoài trục vẫn là số cả trục. Bỏ lọc nhớ theo đơn vị + tài khoản. */
const EF_LOC = {}, EF_LOC_TAT = {};
function efLocTk(specId) {
  const L = EF_LOC[specId], role = typeof currentRole !== 'undefined' ? currentRole : null, oid = typeof currentOfficeId !== 'undefined' ? currentOfficeId : null;
  if (!L || !oid || role !== L.role || !(oid in L.tk)) return null;
  const cat = typeof categorySeed !== 'undefined' ? (categorySeed[L.role] || []).find((c) => c.id === oid) : null;
  return { ef: L.ef, c: L.c, v: L.tk[oid], ten: cat ? cat.name : oid, k: specId + '|' + oid };
}
function efLocOn(efId) {
  const specId = Object.keys(EF_LOC).find((s) => EF_LOC[s].ef === efId);
  if (!specId || !CTM_UI.open || CTM_UI.id !== specId) return null;
  const T = efLocTk(specId);
  return T && T.v && !EF_LOC_TAT[T.k] ? T : null;
}
function efLocAll(efId) { const T = efLocOn(efId), all = efAll(efId); return T ? all.filter((R) => R[T.c] === T.v) : all; }
function efLocTat(k) { EF_LOC_TAT[k] = !EF_LOC_TAT[k]; CTM_UI.dd = null; CTM_UI.rec = { f: 'all', q: '', key: null, ef: CTM_UI.rec.ef }; ctmRerender(false); }
function efLocHtml(specId) {
  const T = efLocTk(specId);
  if (!T) return '';
  const f = EFK[T.ef].F[T.c], fl = '«' + f.l + '»';
  if (!T.v) return '<div class="stc-mt" style="margin-bottom:14px">' + ctmNote('Tài khoản ' + ctmE(T.ten) + ': danh mục ' + ctmE(fl) + ' của eform không có «' + ctmE(T.ten) + '» nên chưa lọc sẵn được; đang xem mọi ' + ctmE(fl) + '.') + '</div>';
  const vl = xaEfLb(f, T.v) || T.v;
  return '<div class="stc-mt" style="margin-bottom:14px">' + ctmNote(EF_LOC_TAT[T.k] ? 'Đang xem mọi ' + ctmE(fl) + '. ' + ctmLnk('Lọc lại theo ' + vl + ' ›', 'efLocTat(' + ctmJs(T.k) + ')')
    : '<b>Tài khoản ' + ctmE(T.ten) + ': đang lọc sẵn ' + ctmE(fl) + ' = ' + ctmE(vl) + '.</b> Mọi số, biểu đồ và bản ghi ở đây chỉ gồm bản ghi có ' + ctmE(fl) + ' là ' + ctmE(vl) + '. ' + ctmLnk('Bỏ lọc, xem mọi ' + f.l.toLowerCase() + ' ›', 'efLocTat(' + ctmJs(T.k) + ')')) + '</div>';
}
/* Bản ghi dùng cho kỳ pid: cùng khóa có bản tháng thì không lấy bản quý, bản năm (X2); bỏ bản đã bị bản sau thay (X1) */
function efPick(cfg, pid) {
  const g = efGranOf(pid), all = efLocAll(cfg.ef);
  if (efKhongKy(cfg.ef)) return { cand: all, used: all.filter((R) => !R._thay) };
  const cand = all.filter((R) => efPidOf(R, g) === pid);
  const by = {};
  cand.forEach((R) => { if (!R._thay) (by[efKhoa(cfg, R)] = by[efKhoa(cfg, R)] || []).push(R); });
  let used = [];
  Object.keys(by).forEach((k) => {
    const arr = by[k], best = Math.min.apply(null, arr.map((R) => EF_HANG[R._ky.loai]));
    arr.forEach((R) => { if (EF_HANG[R._ky.loai] === best) used.push(R); else R._x2 = true; });
  });
  if (cfg.uuTien) {
    const U = cfg.uuTien, tk = (R) => U.theo.map((c) => String(R[c] == null ? '' : R[c])).join('|'), co = new Set(used.filter((R) => R[U.c] === U.v).map(tk));
    used = used.filter((R) => R[U.c] === U.v || !co.has(tk(R)));
  }
  return { cand: cand, used: used };
}
function efNum(v) { return typeof v === 'number' && isFinite(v) ? v : null; }
/* Ngày của trường Ngày tháng ra số ngày để so trước, sau (số ngày kiểu Excel hoặc chữ yyyy-mm-dd); không đọc được thì null */
function efNgay(v) { if (typeof v === 'number' && isFinite(v)) return v; const m = String(v == null ? '' : v).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 + 25569 : null; }
/* Giá trị các chỉ tiêu trên một tập bản ghi */
function efVals(cfg, rs) {
  const V = {}, C = cfg.chi;
  if (cfg.bo) rs = rs.filter((R) => !efBo(cfg, R));
  const by1 = (arr, keyF, first) => { const m = {}; arr.forEach((R) => { const k = keyF(R); if (!m[k] || (first ? R._ord < m[k]._ord : R._ord >= m[k]._ord)) m[k] = R; }); return Object.keys(m).map((k) => m[k]); };
  const sum = (arr, c) => { const cs = Array.isArray(c) ? c : [c], vs = []; arr.forEach((R) => cs.forEach((x) => { const v = efNum(R[x]); if (v != null) vs.push(v); })); return vs.length ? vs.reduce((a, b) => a + b, 0) : null; };
  const all = rs;
  Object.keys(C).forEach((id) => {
    const m = C[id], rs = m.loc ? all.filter((R) => Object.keys(m.loc).every((c) => m.loc[c].indexOf(R[c]) >= 0)) : all;
    const latestBy = (keyF) => by1(rs, keyF, false);
    if (m.loai === 'dem') V[id] = rs.length;
    else if (m.loai === 'demdk') V[id] = rs.filter((R) => { try { return !!m.f(R); } catch (e) { return false; } }).length;
    else if (m.loai === 'dau') V[id] = sum(by1(rs, (R) => efKhoa(cfg, R), true), m.c);
    else if (m.loai === 'demkhac') V[id] = new Set(rs.map((R) => R[m.c]).filter((v) => v != null && v !== '')).size;
    else if (m.loai === 'dembang') V[id] = rs.filter((R) => m.v.indexOf(R[m.c]) >= 0).length;
    else if (m.loai === 'cong') V[id] = sum(rs, m.c);
    else if (m.loai === 'td') V[id] = sum(latestBy((R) => efKhoa(cfg, R)), m.c);
    else if (m.loai === 'motlan') V[id] = sum(latestBy((R) => m.theo.map((c) => String(R[c] == null ? '' : R[c])).join('|')), m.c);
    else if (m.loai === 'nhap') { const L = m.theo ? latestBy((R) => m.theo.map((c) => String(R[c] == null ? '' : R[c])).join('|')) : rs; V[id] = L.length === 1 ? efNum(L[0][m.c]) : null; }
  });
  Object.keys(C).forEach((id) => {
    const m = C[id];
    if (m.loai === 'tyle') V[id] = V[m.tu] != null && V[m.mau] ? V[m.tu] / V[m.mau] * 100 : null;
    else if (m.loai === 'hieu') V[id] = V[m.a] != null && V[m.b] != null ? V[m.a] - V[m.b] : null;
    else if (m.loai === 'tang') V[id] = V[m.tu] != null && V[m.mau] ? V[m.tu] / V[m.mau] * 100 - 100 : null;
  });
  return V;
}
/* Bản ghi bị bỏ khỏi phần tính (cfg.bo); câu ghi chú tương ứng */
function efBo(cfg, R) { return Object.keys(cfg.bo).some((c) => cfg.bo[c].indexOf(R[c]) >= 0); }
function efBoNote(cfg) { if (!cfg.bo) return ''; const ef = EFK[cfg.ef]; return 'Bản ghi có ' + Object.keys(cfg.bo).map((c) => '«' + ef.F[c].l + '» = ' + cfg.bo[c].map((v) => xaEfLb(ef.F[c], v) || v).join(' / ')).join(' hoặc ') + ' không tính vào số.'; }
/* Cách tính bằng chữ theo tên trường (quy ước 28/10/2026, sửa H21) */
function efMoTa(cfg, id) {
  const m = cfg.chi[id], ef = EFK[cfg.ef], fl = (c) => '«' + (ef.F[c] ? ef.F[c].l : c) + '»', ml = (k) => cfg.chi[k].l;
  const loc = m.loc ? ' (chỉ bản ghi có ' + Object.keys(m.loc).map((c) => fl(c) + ' = ' + m.loc[c].map((v) => xaEfLb(ef.F[c], v) || v).join(' / ')).join(', ') + ')' : '';
  return efMoTa0(cfg, m, ef, fl, ml) + loc;
}
function efMoTa0(cfg, m, ef, fl, ml) {
  if (m.loai === 'dem') return 'đếm bản ghi';
  if (m.loai === 'demdk') return 'đếm bản ghi có ' + (m.mt || 'điều kiện');
  if (m.loai === 'dau') return 'cộng ' + fl(m.c) + ', mỗi bản ghi lấy kỳ đầu';
  if (m.loai === 'demkhac') return 'đếm ' + fl(m.c) + ' khác nhau';
  if (m.loai === 'dembang') return 'đếm bản ghi có ' + fl(m.c) + ' = ' + m.v.map((v) => xaEfLb(ef.F[m.c], v) || v).join(' / ');
  if (m.loai === 'cong') return 'cộng ' + (Array.isArray(m.c) ? m.c.map(fl).join(' + ') : fl(m.c));
  if (m.loai === 'td') return 'cộng ' + fl(m.c) + ', mỗi bản ghi lấy kỳ cuối';
  if (m.loai === 'motlan') return 'cộng ' + fl(m.c) + ', mỗi ' + m.theo.map((c) => (c === '_kyId' ? 'kỳ báo cáo' : fl(c))).join(' + ') + ' lấy một lần';
  if (m.loai === 'nhap') return 'số đã nhập ở ' + fl(m.c) + (m.theo ? ', hiện khi dòng chỉ gồm một ' + m.theo.map((c) => (c === '_kyId' ? 'kỳ báo cáo' : fl(c))).join(' + ') : ' (dòng gồm nhiều bản ghi thì xem ở Dữ liệu đã nhập)');
  if (m.loai === 'tyle') return 'IOC tính: ' + ml(m.tu) + ' ÷ ' + ml(m.mau) + ' × 100';
  if (m.loai === 'hieu') return 'IOC tính: ' + ml(m.a) + ' − ' + ml(m.b);
  if (m.loai === 'tang') return 'IOC tính: ' + ml(m.tu) + ' ÷ ' + ml(m.mau) + ' × 100 − 100';
  return '';
}
function efUnit(cfg, id) { const m = cfg.chi[id], ef = EFK[cfg.ef], c = Array.isArray(m.c) ? m.c[0] : m.c; return m.u != null ? m.u : m.loai === 'tyle' || m.loai === 'tang' ? '%' : c && ef.F[c] ? xaEfUnitOf(ef.F[c].l) : ''; }
function efD(cfg, id, v) { const m = cfg.chi[id]; if (m.d != null) return m.d; const u = efUnit(cfg, id); return u === '%' ? 1 : v != null && Math.abs(v) < 100 && Math.round(v) !== v ? 1 : 0; }
function efFmt(cfg, id, v) { const u = efUnit(cfg, id); return ctmF(v, efD(cfg, id, v)) + (u === '%' && v != null ? '%' : ''); }
/* Nhãn của một giá trị trường (danh mục ra tên hiển thị; trường khác hiện đúng chữ) */
function efLb(ef, c, v) { if (v == null || v === '') return '(trống)'; const f = ef.F[c]; if (f && f.t === 'dm') { const l = xaEfLb(f, v); return l == null ? String(v) : l; } return xaEfCell(f || { t: 'chu' }, v); }

/* ---------- Bản ghi cần xem lại (X8) ---------- */
function efBad(cfg, R, all) {
  const ef = EFK[cfg.ef], bad = {};
  ef.fields.forEach((f) => {
    const v = R[f.c];
    if (v == null || v === '') return;
    if (f.t === 'dm' && f.dm && f.dm.length && xaEfLb(f, v) === null) bad[f.c] = 'Mã không có trong danh mục của eform';
    else if (f.t === 'so' && !xaEfIsNum(v)) bad[f.c] = 'Không phải số';
    else if (f.t === 'ngay' && !xaEfDate(v)) bad[f.c] = 'Không đọc được ngày';
  });
  (cfg.khoa || []).forEach((c) => { if ((R[c] == null || R[c] === '') && (cfg.khoaRong || []).indexOf(c) < 0) bad[c] = bad[c] || 'Thiếu trường khóa của bản ghi (vẫn cộng vào phần tổng hợp, nhưng không nhận ra được bản gửi trùng)'; });
  if (!R._ky && !efKhongKy(cfg.ef)) EF_KY_TRUONG.forEach((c) => { if (ef.F[c]) bad[c] = bad[c] || 'Thiếu năm hoặc kỳ báo cáo nên chưa xếp vào kỳ nào'; });
  (cfg.kt || []).forEach((k) => { let r = false; try { r = !!k.f(R, all || []); } catch (e) { r = false; } if (r) (k.c || []).forEach((c) => { bad[c] = (bad[c] ? bad[c] + '; ' : '') + k.l; }); });
  return bad;
}

/* ---------- Vẽ: bảng nhiều cấp, biểu đồ ---------- */
function efKey(efId, path) { return efId + '¦' + JSON.stringify(path || []); }
function efParseKey(key) { const i = String(key || '').indexOf('¦'); return i < 0 ? null : { ef: key.slice(0, i), path: JSON.parse(key.slice(i + 1)) }; }
function efMatch(R, path) { return path.every((p) => String(R[p[0]] == null ? '' : R[p[0]]) === String(p[1] == null ? '' : p[1])); }
function efGroup(rs, c) { const m = {}, order = []; rs.forEach((R) => { const v = R[c] == null ? '' : R[c]; if (!(v in m)) { m[v] = []; order.push(v); } m[v].push(R); }); return order.map((v) => [v, m[v]]); }
/* Bảng nhiều cấp: mỗi cấp một giá trị của trường chia cấp; dòng ghi các chỉ tiêu của cfg.cot và số bản ghi; bấm tên mở bản ghi */
const EF_FULL = {};
function efTreeFull(id) { EF_FULL[id] = !EF_FULL[id]; ctmRerender(false); }
function efTreeHtml(cfg, rs, sortBy, boTrong, fullId) {
  const ef = EFK[cfg.ef], cot = cfg.cot || Object.keys(cfg.chi).slice(0, 4), cap = cfg.cap || [];
  if (boTrong && cap[0]) rs = rs.filter((R) => R[cap[0]] != null && R[cap[0]] !== '');
  /* chỉ tiêu cộng theo «Đơn vị tính» (m.dvt): chỉ ghi số ở dòng đã tách theo đơn vị tính, dòng gộp nhiều đơn vị tính ghi "—" */
  const dvtOk = (id, path) => !cfg.chi[id].dvt || !cfg.dvt || path.some((p) => p[0] === cfg.dvt) || new Set(rs.map((R) => R[cfg.dvt])).size <= 1;
  const cell = (id, V, path) => (dvtOk(id, path) ? efFmt(cfg, id, V[id]) : '<span class="stc-dl na" title="Nhiều đơn vị tính, xem các dòng con">—</span>');
  if (!rs.length) return '<div class="stc-hint">Kỳ này chưa có bản ghi.</div>';
  const head = '<tr><th>' + ctmE(cap.map((c) => ef.F[c] ? ef.F[c].l : c).join(' › ') || 'Nhóm') + '</th>' + cot.map((id) => { const u = efUnit(cfg, id), l = cfg.chi[id].l; return '<th title="' + ctmE(efMoTa(cfg, id)) + '">' + ctmE(l) + (u && u !== '%' && l.indexOf('(' + u + ')') < 0 ? ' <small>(' + ctmE(u) + ')</small>' : '') + '</th>'; }).join('') + '<th>Bản ghi</th></tr>';
  let body = '';
  const walk = (list, depth, path) => {
    let groups = efGroup(list, cap[depth]);
    const s = sortBy || cot[0];
    groups = groups.map((g) => [g[0], g[1], efVals(cfg, g[1])]);
    if (s) groups.sort((a, b) => (b[2][s] || 0) - (a[2][s] || 0));
    groups.forEach(([v, sub, V]) => {
      const p = path.concat([[cap[depth], v]]);
      body += '<tr class="ef-d' + depth + '"><td style="padding-left:' + (depth * 18) + 'px">' + ctmLnk(efLb(ef, cap[depth], v), 'ctmRec(' + ctmJs(efKey(cfg.ef, p)) + ')') + '</td>' +
        cot.map((id) => '<td>' + cell(id, V, p) + '</td>').join('') + '<td>' + ctmF(sub.length) + '</td></tr>';
      if (depth + 1 < cap.length) walk(sub, depth + 1, p);
    });
  };
  if (cap.length) walk(rs, 0, []);
  /* bảng dài: mặc định hiện 12 dòng đầu, bấm "Xem đủ" để mở hết (fullId: khóa nhớ trạng thái mở) */
  const LIM = 12, all = body.split('</tr>').filter(Boolean), more = fullId && all.length > LIM + 2;
  if (more && !EF_FULL[fullId]) body = all.slice(0, LIM).join('</tr>') + '</tr>';
  const T = efVals(cfg, rs);
  body += '<tr class="tot"><td>Cộng</td>' + cot.map((id) => '<td>' + cell(id, T, []) + '</td>').join('') + '<td>' + ctmF(rs.length) + '</td></tr>';
  const iocs = cot.filter((id) => /tyle|hieu|tang|nhap|motlan|td|dau/.test(cfg.chi[id].loai));
  return '<div class="ctm-scroll"><table class="stc-tbl ctm-eft ef-tree"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
    (more ? '<div style="margin-top:8px">' + ctmLnk(EF_FULL[fullId] ? 'Thu gọn về ' + LIM + ' dòng' : 'Xem đủ ' + ctmF(all.length) + ' dòng ›', 'efTreeFull(' + ctmJs(fullId) + ')') + '</div>' : '') +
    '<div class="stc-hint" style="margin-top:10px">Bấm tên ở cột đầu để xem các bản ghi tạo ra số của dòng đó. Rê chuột tên cột để xem cách tính.' +
    (iocs.length ? ' ' + iocs.map((id) => cfg.chi[id].l + ': ' + efMoTa(cfg, id)).join('; ') + '.' : '') + '</div>';
}
/* Các hàng thanh ngang (cột theo giá trị một trường) — bấm để xem bản ghi */
function efBarsHtml(cfg, rs, b) {
  const ef = EFK[cfg.ef], gs = efGroup(rs, b.theo).map((g) => [g[0], efVals(cfg, g[1])[b.m]]).filter((g) => g[1] != null).sort((a, c) => c[1] - a[1]);
  if (!gs.length) return '<div class="stc-hint">Kỳ này chưa có số.</div>';
  const mx = Math.max.apply(null, gs.map((g) => Math.abs(g[1]))) || 1;
  return gs.map((g, i) => '<button type="button" class="ef-barbtn" style="display:block;width:100%;background:none;border:0;padding:0;margin:0;text-align:left;color:inherit;font:inherit;cursor:pointer" onclick="ctmRec(' + ctmJs(efKey(cfg.ef, [[b.theo, g[0]]])) + ')">' + ctmPg(efLb(ef, b.theo, g[0]), '', Math.abs(g[1]) / mx * 100, CTM_PAL[i % CTM_PAL.length], efFmt(cfg, b.m, g[1])) + '</button>').join('');
}
function efStackHtml(cfg, rs, b) {
  const ef = EFK[cfg.ef], gs = efGroup(rs, b.theo).map((g) => [g[0], efVals(cfg, g[1])[b.m] || 0]).filter((g) => g[1] > 0).sort((a, c) => c[1] - a[1]);
  const tot = gs.reduce((s, g) => s + g[1], 0);
  if (!tot) return '<div class="stc-hint">Kỳ này chưa có số.</div>';
  return ctmBig(efFmt(cfg, b.m, tot), efUnit(cfg, b.m) === '%' ? '' : efUnit(cfg, b.m)) + '<div class="stc-stack">' + gs.map((g, i) => '<i style="flex:' + g[1] + ';background:' + CTM_PAL[i % CTM_PAL.length] + '" title="' + ctmE(efLb(ef, b.theo, g[0])) + '"></i>').join('') + '</div>' +
    gs.map((g, i) => '<button type="button" class="ef-barbtn" style="display:block;width:100%;background:none;border:0;padding:0;margin:0;text-align:left;color:inherit;font:inherit;cursor:pointer" onclick="ctmRec(' + ctmJs(efKey(cfg.ef, [[b.theo, g[0]]])) + ')">' + ctmPg(efLb(ef, b.theo, g[0]), efFmt(cfg, b.m, g[1]), g[1] / tot * 100, CTM_PAL[i % CTM_PAL.length]) + '</button>').join('');
}
/* Cơ cấu một tổng theo các chỉ tiêu thành phần (VD các khoản thu); danh sách chỉ tiêu dạng thanh (VD 3 bước xử lý kiến nghị) */
function efPartsHtml(cfg, rs, b, stack) {
  const V = efVals(cfg, rs), ps = b.ms.map((id, i) => [id, V[id], CTM_PAL[i % CTM_PAL.length]]).filter((p) => p[1] != null);
  if (!ps.length) return '<div class="stc-hint">Kỳ này chưa có số.</div>';
  const tot = ps.reduce((s, p) => s + Math.max(0, p[1]), 0), mx = Math.max.apply(null, ps.map((p) => Math.abs(p[1]))) || 1;
  if (!stack) return ps.map((p) => ctmPg(cfg.chi[p[0]].l, '', Math.abs(p[1]) / mx * 100, p[2], efFmt(cfg, p[0], p[1]))).join('') + '<div class="stc-hint" style="margin-top:8px">' + ctmE(b.ms.map((id) => cfg.chi[id].l + ': ' + efMoTa(cfg, id)).join('; ')) + '.</div>';
  return ctmBig(efFmt(cfg, b.ms[0], tot), efUnit(cfg, b.ms[0]) === '%' ? '' : efUnit(cfg, b.ms[0])) + '<div class="stc-stack">' + ps.map((p) => '<i style="flex:' + Math.max(0, p[1]) + ';background:' + p[2] + '" title="' + ctmE(cfg.chi[p[0]].l) + '"></i>').join('') + '</div>' +
    ps.map((p) => ctmPg(cfg.chi[p[0]].l, efFmt(cfg, p[0], p[1]), tot ? Math.max(0, p[1]) / tot * 100 : 0, p[2])).join('');
}
/* Diễn biến qua các kỳ gần nhất của kỳ xem đang chọn (tối đa 12 kỳ) */
function efTrendHtml(cfg, pid, b) {
  if (efKhongKy(cfg.ef)) return '<div class="stc-hint">' + EF_KHONG_KY_NOTE + ' Không vẽ được diễn biến theo kỳ.</div>';
  const g = efGranOf(pid), list = EF_KY[g], at = list.findIndex((p) => p.id === pid), per = list.slice(at, at + (g === 'nam' ? 2 : g === 'quy' ? 6 : 12)).reverse();
  const vals = per.map((p) => efVals(cfg, efPick(cfg, p.id).used)[b.m]);
  if (vals.filter((v) => v != null).length < 2) return '<div class="stc-hint">Chưa đủ kỳ để vẽ diễn biến.</div>';
  if (efUnit(cfg, b.m) === '%') return ctmLineSvg(per.map((p, i) => ({ l: p.short, v: vals[i], on: p.id === pid })), { d: 1, pct: true, hint: 'Điểm tô đậm là kỳ đang xem.' });
  const top = Math.max.apply(null, vals.map((v) => Math.abs(v || 0))) || 1;
  return '<div class="sgd-cc">' + per.map((p, i) => '<div class="sgd-col"><span class="sgd-cv">' + (vals[i] == null ? '—' : efFmt(cfg, b.m, vals[i])) + '</span><div class="sgd-pair"><div class="sgd-b1 ctm-cb" style="height:' + (Math.abs(vals[i] || 0) / top * 150).toFixed(0) + 'px;' + (p.id === pid ? '' : 'opacity:.5') + '"></div></div></div>').join('') +
    '</div><div class="sgd-ccl">' + per.map((p) => '<span>' + ctmE(p.short) + '</span>').join('') + '</div><div class="stc-hint">Cột đậm là kỳ đang xem.</div>';
}

/* ---------- Theo 126 xã, phường (màn khuôn chung: bảng xếp hạng, hồ sơ từng xã) ----------
   Chỉ eform có trường xã, phường (cfg.xaTruong, mặc định cfg.diaBan) mà giá trị là tên xã, phường trong danh sách 126.
   Số của mỗi xã = chỉ tiêu của eform tính trên các bản ghi của xã đó; không dùng dân số, diện tích (quy ước 28/10/2026). */
const EF_XA = {};
const efXaKey = (s) => ctmNorm(s).replace(/\s+/g, ' ').trim();
const EF_XA_MAP = (function () { const m = {}; (typeof CTM_XA !== 'undefined' ? CTM_XA : []).forEach((u) => { m[efXaKey(u.name)] = u; }); return m; })();
function efXaTruong(cfg) { return cfg.xaTruong || cfg.diaBan || null; }
function efXaInds(def) {
  const cfgs = def.eforms.filter((c) => efXaTruong(c)), many = cfgs.length > 1, out = [];
  cfgs.forEach((cfg) => {
    const ids = (cfg.xaChi || cfg.cotDb || cfg.the || []).filter((id) => cfg.chi[id] && ['nhap', 'dau'].indexOf(cfg.chi[id].loai) < 0 && !cfg.chi[id].dvt);
    ids.forEach((id) => {
      const m = cfg.chi[id], key = cfg.ef + '_' + id, u = efUnit(cfg, id), l = (many ? (cfg.ten || EFK[cfg.ef].ten) + ' · ' : '') + m.l;
      const I = { id: key, ef: cfg.ef, l: l, u: u === '%' ? '%' : u || (/^dem/.test(m.loai) && m.loai !== 'demkhac' ? 'bản ghi' : ''), d: u === '%' ? 1 : 0, v: (r) => r.V[key] };
      if (m.loai === 'tyle') Object.assign(I, { num: (r) => r.V[cfg.ef + '_' + m.tu], den: (r) => r.V[cfg.ef + '_' + m.mau], rank: true, better: 'high', w: (r) => r.V[cfg.ef + '_' + m.mau] || 0 });
      /* mức Thành phố = số của nhóm (đếm khác nhau như «số ứng dụng» không cộng được theo xã) */
      else Object.assign(I, { tot: true, better: 'none', tp: (D) => D[key] });
      out.push(I);
    });
  });
  return out;
}
function efXaSpec(def, mk) {
  const inds = EF_XA[def.id] || [];
  if (!inds.length) return undefined;
  const cfgs = def.eforms.filter((c) => efXaTruong(c));
  return {
    inds: inds, noDs: true, label: 'Theo 126 xã, phường',
    cot: { l: 'Bản ghi', v: (I, r) => r.n[I.ef] || 0 },
    cardRows: ['Bảng 126 xã, phường: ' + inds.slice(0, 3).map((x) => x.l.toLowerCase()).join(', ') + (inds.length > 3 ? '…' : ''), 'Số lấy từ bản ghi eform của từng xã, phường; sắp từ lớn đến nhỏ', 'Hồ sơ từng xã, phường: các chỉ tiêu, thứ tự và bản ghi đã nhập', 'Lọc phường / xã, tìm theo tên'],
    rows: (pid) => {
      const R = {}, miss = {};
      (typeof CTM_XA !== 'undefined' ? CTM_XA : []).forEach((u) => { R[u.name] = { u: u, V: {}, n: {}, k: {} }; });
      cfgs.forEach((cfg) => {
        const c = efXaTruong(cfg), ef = EFK[cfg.ef], by = {};
        efPick(cfg, pid).used.forEach((x) => { const v = x[c], u = EF_XA_MAP[efXaKey(efLb(ef, c, v))]; if (!u) { miss[cfg.ef] = (miss[cfg.ef] || 0) + 1; return; } (by[u.name] = by[u.name] || { v: v, rs: [] }).rs.push(x); });
        Object.keys(by).forEach((name) => { const V = efVals(cfg, by[name].rs), r = R[name]; r.n[cfg.ef] = by[name].rs.length; r.k[cfg.ef] = by[name].v; Object.keys(cfg.chi).forEach((id) => { r.V[mk(cfg, id)] = V[id]; }); });
      });
      const rows = Object.keys(R).map((k) => R[k]);
      rows.miss = miss;
      return rows;
    },
    note: (D, P, n) => {
      const miss = (ctmXaRows(CTM_SPECS[def.id], n.p).miss) || {}, ms = Object.keys(miss);
      return 'Số của từng xã, phường lấy từ các bản ghi eform có «' + cfgs.map((c) => EFK[c.ef].F[efXaTruong(c)].l).filter((v, i, a) => a.indexOf(v) === i).join('», «') + '» là xã, phường đó (không dùng dân số, diện tích). Số tuyệt đối chỉ sắp từ lớn đến nhỏ, không xếp hạng tốt/kém; tỷ lệ (IOC tính) gộp lên Thành phố bằng tổng tử số ÷ tổng mẫu số.' +
        (ms.length ? ' Có ' + ms.map((e) => miss[e] + ' bản ghi «' + (EF_CFG[e].ten || EFK[e].ten) + '»').join(', ') + ' ghi xã, phường không khớp danh sách 126 nên chưa vào bảng này (xem ở Dữ liệu đã nhập).' : '');
    },
    profile: (r, n) => {
      const ls = cfgs.filter((c) => r.n[c.ef]).map((c) => ctmLnk('Xem ' + r.n[c.ef] + ' bản ghi «' + (c.ten || EFK[c.ef].ten) + '» của ' + r.u.name + ' ›', 'ctmRec(' + ctmJs(efKey(c.ef, [[efXaTruong(c), r.k[c.ef]]])) + ')'));
      return ls.length ? '<div class="stc-sec" style="margin:14px 0 8px">Bản ghi đã nhập</div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start">' + ls.join('') + '</div>' : '<div class="stc-hint" style="margin-top:12px">Kỳ này xã, phường chưa có bản ghi.</div>';
    }
  };
}

/* Kỳ gần nhất có bản ghi của eform: thử loại kỳ đang xem trước (Quý), rồi Tháng, Năm */
function efKyGanNhat(cfg) {
  const order = [efGran()].concat(['quy', 'thang', 'nam'].filter((g) => g !== efGran()));
  for (const g of order) { const p = EF_KY[g].find((x) => efPick(cfg, x.id).cand.length); if (p) return { g: g, p: p.id, label: p.label, n: efPick(cfg, p.id).cand.length }; }
  return null;
}
function efTrongHtml(cfg, spec, pid) {
  const k = efKyGanNhat(cfg), ef = EFK[cfg.ef];
  return '<div class="stc-hint" style="font-size:13px;line-height:1.6">Eform «' + ctmE(ef.ten) + '» chưa có bản ghi nào cho ' + ctmE(ctmPLabel(spec, pid)) + ', nên chưa có số để vẽ.' +
    (k ? ' Kỳ gần nhất có bản ghi là <b>' + ctmE(k.label) + '</b> (' + ctmF(k.n) + ' bản ghi).</div><div style="margin-top:12px"><button type="button" class="stc-btn primary" onclick="efGoKy(' + ctmJs(k.g) + ',' + ctmJs(k.p) + ')">Xem ' + ctmE(k.label) + ' ›</button></div>' : ' Eform chưa có bản ghi nào.</div>');
}
function efGoKy(g, p) { CTM_UI.dd = null; CTM_UI.gran = g; CTM_UI.period = p; ctmRerender(false); }

/* ---------- Khai báo một đơn vị ---------- */
function ctmEformDonVi(def) {
  def.eforms.forEach((cfg) => { EF_CFG[cfg.ef] = cfg; });
  if (def.locTk) EF_LOC[def.id] = Object.assign({ role: def.role }, def.locTk);
  EF_XA[def.id] = efXaInds(def);
  const metrics = {}, mk = (cfg, id) => cfg.ef + '_' + id;
  def.eforms.forEach((cfg) => Object.keys(cfg.chi).forEach((id) => {
    const m = cfg.chi[id], u = efUnit(cfg, id);
    metrics[mk(cfg, id)] = { l: m.kl || m.l, short: m.kl || m.l, u: u, d: m.d != null ? m.d : u === '%' ? 1 : 0, td: true, neutral: true, how: efMoTa(cfg, id) };
  }));
  const data = (pid) => {
    const D = {};
    /* kỳ không có bản ghi nào của eform: mọi chỉ tiêu để trống ("—"), không hiện 0 */
    def.eforms.forEach((cfg) => { const used = efPick(cfg, pid).used, V = used.length ? efVals(cfg, used) : {}; Object.keys(cfg.chi).forEach((id) => { D[mk(cfg, id)] = V[id] == null ? null : ctmRound(V[id], metrics[mk(cfg, id)].d === 1 ? 1 : 3); }); });
    return D;
  };
  const kpis = (def.kpis || []).map((k) => {
    const cfg = def.eforms.find((x) => x.ef === k.ef);
    return { m: mk(cfg, k.m), l: k.l, sub: () => (efUnit(cfg, k.m) && efUnit(cfg, k.m) !== '%' ? efUnit(cfg, k.m) + ' · ' : '') + (cfg.ten || EFK[cfg.ef].ten), target: 'g:' + cfg.ef };
  });
  /* Màn mỗi nhóm (eform) theo bố cục khuôn chung (như các đơn vị cũ): hàng đầu là thẻ so sánh kỳ này – kỳ trước và biểu đồ qua
     các kỳ (ctmAutoRows), rồi thẻ cơ cấu, tỷ lệ, xã/phường đứng đầu; sau đó các biểu đồ theo trường của eform (bấm thanh → bản ghi)
     và bảng nhiều cấp (mặc định 12 dòng, bấm "Xem đủ"). Mọi chỉ tiêu vẫn chỉ dựng từ trường của eform. */
  const groups = def.eforms.map((cfg) => {
    const ef = EFK[cfg.ef], rsOf = (n) => efPick(cfg, n.p).used, sp = () => CTM_SPECS[def.id];
    const bieu = cfg.bieu || [], xu = bieu.find((b) => b.loai === 'xu'), phan = bieu.find((b) => b.loai === 'phan' && b.tong);
    const rates = Object.keys(cfg.chi).filter((id) => cfg.chi[id].loai === 'tyle');
    const luuY = [efBoNote(cfg), cfg.luuY || ''].filter(Boolean).join(' ');
    const extra = [];
    const bs = bieu.filter((b) => b !== xu && b !== phan).map((b) => ({ type: 'html', t: b.t, s: (D, P, n) => ctmPLabel(sp(), n.p) + (b.theo ? ' · bấm thanh để xem bản ghi' : ''),
      html: (D, P, n) => (b.loai === 'chong' ? efStackHtml(cfg, rsOf(n), b) : b.loai === 'phan' ? efPartsHtml(cfg, rsOf(n), b, true) : b.loai === 'ds' ? efPartsHtml(cfg, rsOf(n), b, false) : efBarsHtml(cfg, rsOf(n), b)) }));
    for (let i = 0; i < bs.length; i += 2) extra.push(bs.slice(i, i + 2));
    extra.push([{ type: 'html', t: 'Bảng theo ' + (cfg.cap || []).map((c) => ef.F[c].l).join(' › '), s: (D, P, n) => (cfg.ten || ef.ten) + ' · ' + ctmPLabel(sp(), n.p) + ' · bấm tên dòng để xem bản ghi', html: (D, P, n) => efTreeHtml(cfg, rsOf(n), null, false, cfg.ef + '|cap') }]);
    /* bảng phụ: t.loc chỉ lấy bản ghi khớp (VD chỉ các mã chỉ tiêu cộng dồn) */
    (cfg.bang || []).forEach((t, i) => extra.push([{ type: 'html', t: t.t, s: (D, P, n) => ctmPLabel(sp(), n.p), html: (D, P, n) => efTreeHtml(Object.assign({}, cfg, { cap: t.cap, cot: t.cot }),
      t.loc ? rsOf(n).filter((R) => Object.keys(t.loc).every((c) => t.loc[c].indexOf(R[c]) >= 0)) : rsOf(n), null, true, cfg.ef + '|bang' + i) }]));
    const xaInd = (EF_XA[def.id] || []).find((I) => I.ef === cfg.ef);
    if (cfg.diaBan && !xaInd) extra.push([{ type: 'html', t: 'Theo ' + ef.F[cfg.diaBan].l.toLowerCase(), s: (D, P, n) => 'Cộng theo từng ' + ef.F[cfg.diaBan].l.toLowerCase() + ' · ' + ctmPLabel(sp(), n.p),
      html: (D, P, n) => efTreeHtml(Object.assign({}, cfg, { cap: [cfg.diaBan], cot: cfg.cotDb || cfg.cot }), rsOf(n), null, false, cfg.ef + '|db') }]);
    /* đơn vị là chính một eform (def.laEform — HĐND, MTTQ): nhóm gọi "Bảng và biểu đồ" để tiêu đề không lặp tên eform */
    const g = {
      id: cfg.ef, label: def.laEform ? 'Bảng và biểu đồ' : cfg.ten || ef.ten,
      note: (D, P, n) => 'Eform «' + ef.ten + '» · một bản ghi là ' + cfg.banGhi + ' · ' + (efKhongKy(cfg.ef) ? rsOf(n).length + ' bản ghi. ' + EF_KHONG_KY_NOTE : rsOf(n).length + ' bản ghi dùng cho ' + ctmPLabel(sp(), n.p)) + (luuY ? '. ' + luuY : ''),
      lines: (n) => (cfg.the || Object.keys(cfg.chi).slice(0, 4)).map((id) => mk(cfg, id)),
      count: (n) => { const k = rsOf(n).length ? null : efKyGanNhat(cfg); return ctmF(rsOf(n).length) + ' bản ghi' + (k ? ' · có số ở ' + k.label : ''); },
      cols: xu ? mk(cfg, xu.m) : undefined, colsT: xu ? xu.t : undefined,
      parts: phan ? [mk(cfg, phan.tong), phan.ms.filter((id) => id !== phan.tong).map((id) => mk(cfg, id)), phan.t] : undefined,
      rates: rates.length > 1 ? [rates.map((id) => mk(cfg, id)), 'Tỷ lệ (IOC tính)'] : undefined,
      top: xaInd ? xaInd.id : undefined, xa: xaInd ? xaInd.id : undefined
    };
    Object.defineProperty(g, 'rows', { enumerable: true, get: () => {
      const n = ctmNP(sp());
      /* kỳ đang xem không có bản ghi: nói rõ, chỉ kỳ gần nhất có bản ghi thay vì vẽ các thẻ rỗng */
      if (!rsOf(n).length) return [[{ type: 'html', t: 'Kỳ này chưa có bản ghi', s: (D, P, n2) => (cfg.ten || ef.ten) + ' · ' + ctmPLabel(sp(), n2.p), html: (D, P, n2) => efTrongHtml(cfg, sp(), n2.p) }]];
      return (efKhongKy(cfg.ef) ? [] : ctmAutoRows(sp(), g)).concat(extra);
    } });
    return g;
  });

  /* ---------- Màn Dữ liệu đã nhập ---------- */
  const recOf = (spec, n) => {
    const X = CTM_UI.rec, pk = efParseKey(X.key);
    if (pk && def.eforms.some((c) => c.ef === pk.ef)) X.ef = pk.ef;
    const cfg = def.eforms.find((c) => c.ef === X.ef) || def.eforms[0], ef = EFK[cfg.ef];
    const P = efPick(cfg, n.p), all = efLocAll(cfg.ef), q = ctmNorm(X.q), path = pk && pk.ef === cfg.ef ? pk.path : [];
    const usedSet = new Set(P.used);
    const items = P.cand.map((R) => {
      const bad = efBad(cfg, R, all);
      if (R._thay) bad._ = 'Trùng khóa với bản gửi sau, không dùng ở phần tổng hợp';
      else if (!usedSet.has(R)) bad._ = 'Cùng khóa đã có bản kỳ ngắn hơn (bản tháng), không cộng chồng';
      return { R: R, bad: bad };
    });
    const c1 = (cfg.cap || [])[0];
    const shown = items.filter((x) => (X.f === 'all' || (X.f === 'bad' ? Object.keys(x.bad).length : String(x.R[c1]) === X.f)) && (!path.length || (usedSet.has(x.R) && efMatch(x.R, path))) &&
      (!q || ef.fields.some((f) => ctmNorm(efLb(ef, f.c, x.R[f.c])).indexOf(q) >= 0)));
    return { cfg: cfg, ef: ef, items: items, shown: shown, all: all, path: path, noKy: efKhongKy(cfg.ef) ? 0 : all.filter((R) => !R._ky).length, c1: c1 };
  };
  const rec = {
    label: 'Dữ liệu đã nhập',
    card: (n) => {
      const line = (a, b) => '<div class="stc-gl"><span>' + ctmE(a) + '</span><span class="stc-v">' + b + '</span><span></span></div>';
      const tot = def.eforms.reduce((s, c) => s + efPick(c, n.p).cand.length, 0), nf = def.eforms.reduce((s, c) => s + EFK[c.ef].fields.length, 0);
      return line('Bản ghi ' + ctmPLabel(CTM_SPECS[def.id], n.p), ctmF(tot)) + line(def.eforms.length > 1 ? def.eforms.length + ' eform, tổng số trường' : 'Trường của eform, hiện đủ', ctmF(nf));
    },
    screen: (spec) => {
      const n = ctmNP(spec), X = CTM_UI.rec, L = recOf(spec, n), ef = L.ef, cfg = L.cfg;
      const nb = L.items.filter((x) => Object.keys(x.bad).length).length;
      let h = ctmHeader(spec, 'home');
      if (def.eforms.length > 1) h += '<div class="sgd-pills" style="margin:0 0 12px">' + def.eforms.map((c) => '<button type="button" class="sgd-pill' + (c.ef === cfg.ef ? ' on' : '') + '" onclick="ctmRecEf(' + ctmJs(c.ef) + ')">' + ctmE(c.ten || EFK[c.ef].ten) + '</button>').join('') + '</div>';
      const loc = efLocOn(cfg.ef);
      h += ctmNote('<b>' + (loc ? 'Bản ghi có «' + ctmE(ef.F[loc.c].l) + '» = ' + ctmE(xaEfLb(ef.F[loc.c], loc.v) || loc.v) + ' (lọc sẵn theo tài khoản)' : 'Toàn bộ bản ghi') + ' đã nhập vào eform «' + ctmE(ef.ten) + '», ' + ctmE(ctmPLabel(spec, n.p)) + ':</b> ' + ctmF(L.items.length) + ' bản ghi, đủ ' + ef.fields.length + ' trường theo đúng thứ tự, tên cột đúng như eform. Một bản ghi là ' + ctmE(cfg.banGhi) + '. ' + ctmE([efBoNote(cfg), cfg.luuY || ''].filter(Boolean).join(' ')) + (cfg.bo || cfg.luuY ? ' ' : '') + 'Ô tô màu là ô cần xem lại (rê chuột xem lý do); bản ghi không dùng ở phần tổng hợp có ghi lý do ở cột đầu.' +
        (efKhongKy(cfg.ef) ? ' ' + EF_KHONG_KY_NOTE : L.noKy ? ' Có ' + L.noKy + ' bản ghi thiếu năm hoặc kỳ báo cáo nên chưa xếp vào kỳ nào.' : '') + (typeof EF_LA_MAU !== 'undefined' && EF_LA_MAU ? ' <b>Đang là bản ghi mẫu dựng theo khung eform, chưa nối dữ liệu thật.</b>' : ''));
      const mchip = (k, v) => '<div class="stc-mchip"><div class="stc-k">' + ctmE(k) + '</div><div class="stc-v">' + v + '</div></div>';
      h += '<div class="stc-mchips stc-mt">' + mchip('Bản ghi ' + ctmPLabel(spec, n.p), ctmF(L.items.length)) + mchip('Trường của eform', ctmF(ef.fields.length)) + mchip('Bản ghi cần xem lại', ctmF(nb)) + mchip('Bản ghi mọi kỳ', ctmF(L.all.length)) + '</div>';
      const cnt = {};
      L.items.forEach((x) => { const v = String(x.R[L.c1]); cnt[v] = (cnt[v] || 0) + 1; });
      /* nút lọc theo nhóm cấp 1 chỉ khi ít nhóm (≤ 12); nhiều nhóm (VD 126 xã, phường) thì dùng ô Tìm */
      const pills = [['all', 'Tất cả ' + L.items.length]].concat(L.c1 && Object.keys(cnt).length <= 12 ? Object.keys(cnt).map((v) => [v, efLb(ef, L.c1, v === 'null' ? null : v) + ' ' + cnt[v]]) : [], nb ? [['bad', 'Cần xem lại ' + nb]] : []);
      const filt = L.path.length ? '<div class="stc-hint" style="margin:0 0 10px">Đang xem các bản ghi tạo ra số của dòng «' + ctmE(L.path.map((p) => efLb(ef, p[0], p[1])).join(' › ')) + '» · ' + ctmLnk('Bỏ lọc', 'ctmRec(null)') + '</div>' : '';
      const tools = '<div class="ctm-tools"><div class="sgd-pills">' + pills.map((p) => '<button type="button" class="sgd-pill' + (X.f === p[0] ? ' on' : '') + '" onclick="ctmRecF(' + ctmJs(p[0]) + ')">' + ctmE(p[1]) + '</button>').join('') + '</div>' +
        '<label class="sgd-search"><small>Tìm</small><input id="ctmQ" value="' + ctmE(X.q) + '" placeholder="Chữ trong bất kỳ ô nào" oninput="ctmRecQ(this.value)" aria-label="Tìm trong bản ghi"></label></div>';
      const head = '<tr><th>STT</th>' + ef.fields.map((f) => '<th title="' + ctmE(f.t === 'dm' ? 'Danh mục' : f.t === 'so' ? 'Số' : f.t === 'ngay' ? 'Ngày tháng' : f.t === 'chu' ? 'Chữ' : 'Kiểu để trống trong file') + '">' + ctmE(f.l) + '</th>').join('') + '</tr>';
      const body = L.shown.slice(0, 500).map((x, i) => '<tr' + (Object.keys(x.bad).length ? ' class="ctm-badrow"' : '') + '><td' + (x.bad._ ? ' class="ctm-bad" title="' + ctmE(x.bad._) + '"' : '') + '>' + (i + 1) + '</td>' + ef.fields.map((f) => {
        const t = efLb(ef, f.c, x.R[f.c]), b = x.bad[f.c], empty = x.R[f.c] == null || x.R[f.c] === '';
        return '<td class="' + (f.t === 'so' ? 'ctm-n' : 'ctm-t') + (b ? ' ctm-bad' : '') + '"' + (b ? ' title="' + ctmE(b) + '"' : '') + '>' + (empty ? '<span class="ctm-nil">—</span>' : ctmE(t)) + '</td>';
      }).join('') + '</tr>').join('');
      h += '<div class="stc-card stc-mt" style="padding:14px 14px 12px"><div class="stc-ch" style="margin-bottom:0"><div><h3 class="stc-ct">Bản ghi eform «' + ctmE(ef.ten) + '»</h3><div class="stc-cs">' + ctmE(L.shown.length + ' / ' + L.items.length + ' bản ghi · ' + ctmPLabel(spec, n.p) + ' · cuộn ngang để xem đủ ' + ef.fields.length + ' cột' + (L.shown.length > 500 ? ' · hiện 500 bản ghi đầu, dùng bộ lọc hoặc Xuất Excel để xem hết' : '')) + '</div></div></div>' + tools + filt +
        (L.shown.length ? '<div class="ctm-scroll ctm-recbox"><table class="stc-tbl ctm-rect"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' : '<div class="stc-hint">Không có bản ghi phù hợp bộ lọc.</div>') + '</div>';
      return h + ctmFoot(spec, n);
    },
    sheet: (spec, n) => {
      const L = recOf(spec, n), ef = L.ef;
      return { head: ['STT', 'Ghi chú IOC'].concat(ef.fields.map((f) => f.l)), rows: L.items.map((x, i) => [i + 1, x.bad._ || ''].concat(ef.fields.map((f) => { const v = x.R[f.c]; return f.t === 'so' && xaEfIsNum(v) ? v : (v == null ? '' : efLb(ef, f.c, v)); }))) };
    }
  };
  const spec = {
    id: def.id, role: def.role, level: 'city', name: def.name, org: def.org, short: def.short, efDonVi: true, grans: EF_GRAN,
    get periods() { return EF_KY[efGran()]; },
    get kind() { return { thang: 'tháng', quy: 'quý', nam: 'năm' }[efGran()]; },
    get cmpRef() { return EF_SO_TRUOC[efGran()]; },
    data: data, metrics: metrics, kpis: kpis, groups: groups, rec: rec, card: def.card || kpis.slice(0, 3).map((k) => k.m), cardL: def.cardL, xa: efXaSpec(def, mk),
    locKey: def.locTk ? () => { const T = efLocOn(def.locTk.ef); return T ? T.v : ''; } : undefined, locHtml: def.locTk ? () => efLocHtml(def.id) : undefined,
    note: 'mọi số lấy từ bản ghi của ' + (def.eforms.length > 1 ? def.eforms.length + ' eform' : 'eform «' + EFK[def.eforms[0].ef].ten + '»') + '; chọn xem theo Tháng, Quý hoặc Năm ở thanh công cụ. Số đã nhập hiện đúng như nhập; số IOC tính ghi rõ công thức. Bấm tên dòng ở bảng, thanh ở biểu đồ để xem các bản ghi tạo ra số đó; "Dữ liệu đã nhập" hiện đủ mọi trường của từng eform.',
    foot: 'So với kỳ liền trước cùng loại (tháng, quý, năm), màu trung tính. Nguồn: eform trong "File mô tả đầu vào eform".'
  };
  return ctmRegister(spec);
}
/* Chọn eform ở màn Dữ liệu đã nhập; chọn kỳ xem Tháng / Quý / Năm */
function ctmRecEf(id) { CTM_UI.rec = { f: 'all', q: '', key: null, ef: id }; ctmRerender(true); }
function efReset() { Object.keys(EF_CACHE).forEach((k) => { delete EF_CACHE[k]; }); Object.keys(CTM_CACHE).forEach((k) => { const s = CTM_SPECS[k.split('|')[0]]; if (s && s.efDonVi) delete CTM_CACHE[k]; }); }
