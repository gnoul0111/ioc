/* ============================== 126 XÃ, PHƯỜNG — CHỈ TIÊU THEO 12 EFORM CẤP XÃ, PHƯỜNG ==============================
   Khai báo cho ctm-engine.js: 12 đơn vị đúng 12 eform của sheet "Xã/Phường" ("File mô tả đầu vào eform") — Đảng ủy, HĐND,
   Ủy ban MTTQ mỗi trục một eform; UBND 9 eform (Hành chính công, Tài chính - Ngân sách, Quản lý văn bản, GPMB, Giáo dục,
   Y tế, Văn hóa, Nội vụ, Kinh tế xã hội) — danh mục ở *_XA_CATEGORIES (central-level.js), màn ngoài của tài khoản xã, phường.
   NGUYÊN TẮC (chốt 28/10/2026):
     · chỉ dùng trường có trong eform (js/core/xa-eform.js, sinh từ sheet bằng tools/xa_eform_schema.py); không tự đặt chỉ
       tiêu, không tính tỷ lệ, bình quân, xếp hạng từ số không có trong eform;
     · phần Tổng hợp chỉ cộng dồn CÙNG MỘT TRƯỜNG số của các bản ghi giống nhau ở mọi trường mô tả (nhóm, chỉ tiêu, đơn vị tính…),
       gom theo danh mục của chính eform; số tỷ lệ (%) không cộng — nhiều bản ghi thì để trống, xem ở Dữ liệu đã nhập;
     · màn "Dữ liệu đã nhập" hiện ĐỦ mọi trường của eform, tên cột đúng như eform, ô danh mục hiện đúng tên hiển thị, để người
       nhập đối chiếu số đẩy lên IOC; bản ghi có mã ngoài danh mục, số không đọc được hoặc bỏ trống trường chia nhóm thì tô màu;
     · so với quý liền trước (không có số cùng kỳ: chính quyền hai cấp từ 01/7/2025), màu trung tính.
   Bản ghi lấy từ XA_EF_NGUON (js/core/xa-eform-mau.js — đang là bản ghi mẫu dựng theo khung eform).
   Đặt CTM_XA_ALL_TAB = false để bỏ tab "Tất cả" của tài khoản xã, phường (indicators.js, login.js, sidebar-org.js). */
const CTM_XA_ALL_TAB = true;
/* Tài khoản xã, phường chỉ xem số của chính mình — không có bảng, hạng 126 xã, phường (chốt 27/10/2026). */
const CTM_XA_SO_SANH = false;
const CTM_PER_XA = XA_EF_QUY.map((x) => ({ id: x[0] + 'Q' + x[1], label: 'Quý ' + x[1] + '/' + x[0], short: 'Q' + x[1] + '/' + x[0].slice(2) }));

/* Xã, phường đang xem (currentXaId là số thứ tự trong wardNames(), login.js) */
function ctmCurrentXaUnit() {
  if (typeof currentXaId === 'undefined' || currentXaId == null) return null;
  const names = typeof wardNames === 'function' ? wardNames() : null;
  const nm = names ? names[Number(currentXaId)] : null;
  return nm ? ctmXaByName(nm) : null;
}
function ctmXaWord(ctx) { return ctx && ctx.xa && ctx.xa.k === 'X' ? 'xã' : 'phường'; }
/* Tên đơn vị trong danh mục ghi "phường" cho mọi nơi — đổi thành "xã" khi đang xem một xã */
function ctmXaLoc(s, ctx) { const w = ctmXaWord(ctx); return String(s == null ? '' : s).replace(/phường/g, w).replace(/Phường/g, w === 'xã' ? 'Xã' : 'Phường'); }
function ctmXaOf(u) { return (u.k === 'P' ? 'phường ' : 'xã ') + u.short; }

/* ============================== ĐỌC BẢN GHI THEO KHUNG EFORM ============================== */
const XA_EF = {};
XA_EFORM.forEach((ef) => { XA_EF[ef.id] = ef; ef.F = {}; ef.fields.forEach((f) => { ef.F[f.c] = f; }); });
/* Mã chuẩn như tools/xa_eform_schema.py: bỏ ký tự ẩn, bỏ dấu, đ → d (mã "hạn_xử_lý", "chitieuh​oi"… trong file eform) */
function xaEfNorm(s) { return String(s == null ? '' : s).replace(/[​-‏⁠﻿]/g, '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); }
/* Tên hiển thị dùng chung khi một eform để trống tên của mã (Kỳ báo cáo, Quý của Văn hóa, Nội vụ, Kinh tế xã hội) */
const XA_EF_DM_CHUNG = {};
XA_EFORM.forEach((ef) => ef.fields.forEach((f) => (f.dm || []).forEach((o) => { if (o.l && !XA_EF_DM_CHUNG[f.c + '|' + o.v]) XA_EF_DM_CHUNG[f.c + '|' + o.v] = o.l; })));
/* Tên hiển thị của một mã danh mục; null = mã không có trong danh mục của trường */
function xaEfLb(f, v) {
  if (v == null || v === '') return '';
  if (!f || f.t !== 'dm' || !f.dm.length) return String(v);
  const o = f.dm.find((x) => x.v === v);
  return o ? (o.l || XA_EF_DM_CHUNG[f.c + '|' + v] || '') : null;
}
function xaEfIsNum(v) { return typeof v === 'number' && isFinite(v); }
/* Kỳ của một bản ghi: quý → đúng quý; tháng → quý chứa tháng đó; năm → Quý 4 của năm. Thiếu năm hoặc kỳ thì null. */
function xaEfPid(R) {
  const y = Number(R.nam);
  if (!y) return null;
  const k = R.ky_bao_cao;
  if (k === 'quy') { const q = ['quy_i', 'quy_ii', 'quy_iii', 'quy_iv'].indexOf(R.quy) + 1; return q ? y + 'Q' + q : null; }
  if (k === 'thang') { const m = Number(R.thang); return m >= 1 && m <= 12 ? y + 'Q' + Math.ceil(m / 3) : null; }
  if (k === 'nam') return y + 'Q4';
  return null;
}
const XA_EF_CACHE = {};
const XA_EF_ROWS = [];
/* Đổi nguồn bản ghi (nạp dữ liệu thật, nhận bản ghi mới) thì gọi để tính lại mọi số */
function xaEfReset() {
  Object.keys(XA_EF_CACHE).forEach((k) => { delete XA_EF_CACHE[k]; });
  XA_EF_ROWS.forEach((c) => Object.keys(c).forEach((k) => { delete c[k]; }));
  Object.keys(CTM_CACHE).forEach((k) => { if (CTM_SPECS[k.split('|')[0]] && CTM_SPECS[k.split('|')[0]].ef) delete CTM_CACHE[k]; });
}
/* Mọi bản ghi của một eform, một xã, phường — mã trường, mã danh mục chuẩn hóa; số dạng chữ "1.234,5" đổi ra số */
function xaEfAll(efId, u) {
  if (!u) return [];
  const k = efId + '|' + u.name;
  if (!(k in XA_EF_CACHE)) {
    const ef = XA_EF[efId];
    let src = [];
    try { src = (typeof XA_EF_NGUON === 'function' ? XA_EF_NGUON(efId, u) : []) || []; } catch (e) { src = []; }
    XA_EF_CACHE[k] = src.map((r0) => {
      const R = {};
      Object.keys(r0).forEach((c0) => {
        const c = xaEfNorm(c0), f = ef.F[c];
        let v = r0[c0];
        if (v == null || v === '') { R[c] = null; return; }
        /* chỉ chuẩn hóa mã của danh mục có danh sách mã; «Địa bàn» (danh mục không liệt kê trong file) giữ nguyên chữ */
        if (f && f.t === 'dm') v = f.dm.length ? xaEfNorm(v) : String(v).trim();
        else if (f && f.t === 'so' && typeof v === 'string' && /^-?[\d.]+(,\d+)?$/.test(v.trim())) v = Number(v.trim().replace(/\./g, '').replace(',', '.'));
        R[c] = v;
      });
      R._pid = xaEfPid(R);
      return R;
    });
  }
  return XA_EF_CACHE[k];
}
/* Lỗi của một bản ghi: { mã trường: lý do } */
function xaEfBad(ef, R, nhom) {
  const bad = {};
  ef.fields.forEach((f) => {
    const v = R[f.c];
    if (f.c === nhom && (v == null || v === '')) { bad[f.c] = 'Bỏ trống nên bản ghi chưa vào phần Tổng hợp'; return; }
    if (v == null || v === '') return;
    if (f.t === 'dm' && f.dm.length && xaEfLb(f, v) === null) bad[f.c] = 'Mã không có trong danh mục của eform';
    else if (f.t === 'so' && !xaEfIsNum(v)) bad[f.c] = 'Không phải số';
    else if (f.t === 'ngay' && !xaEfDate(v)) bad[f.c] = 'Không đọc được ngày';
  });
  return bad;
}
/* Ngày: 'YYYY-MM-DD' hoặc số sê-ri Excel → 'dd/mm/yyyy' */
function xaEfDate(v) {
  if (typeof v === 'number' && isFinite(v)) { const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return String(d.getUTCDate()).padStart(2, '0') + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + d.getUTCFullYear(); }
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}
/* Chữ hiện trong ô của màn Dữ liệu đã nhập: đúng giá trị đã nhập, danh mục ra tên hiển thị */
function xaEfCell(f, v) {
  if (v == null || v === '') return '';
  if (f.t === 'dm') { const l = xaEfLb(f, v); return l === null ? String(v) : l; }
  if (f.t === 'so') { if (!xaEfIsNum(v)) return String(v); const s = String(v), d = s.indexOf('.') >= 0 ? Math.min(3, s.split('.')[1].length) : 0; return f.c === 'nam' ? s : ctmF(v, d); }
  if (f.t === 'ngay') return xaEfDate(v) || String(v);
  return String(v);
}
/* Đơn vị đọc từ tên trường hoặc tên đơn vị tính (dùng chung với bản ghi mẫu) */
function xaEfU(text) {
  const u = xaEfUnitOf(text);
  if (u) return u;
  const t = String(text || '').trim();
  return t && /^[A-ZĐ][a-zà-ỹ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
function xaEfHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); }

/* ============================== KHAI BÁO MỘT ĐƠN VỊ THEO EFORM ==============================
   ctmXaEform({ id, role, ef: mã eform, name, org, short,
     nhom: trường danh mục chia nhóm (mỗi giá trị một màn), key: [trường mô tả một dòng số liệu], so: [trường số] (mặc định
     mọi trường Số trừ Năm, Tháng), info: [trường chữ/danh mục ghi kèm dòng],
     kpis: [{ id, where: { trường: mã }, so: trường, l }] — ô số chính = cộng một trường số của các bản ghi khớp điều kiện;
           không ghi thì ô số là số dòng đã nhập của từng nhóm,
     card: [khóa…] — dòng số trên thẻ ở màn ngoài (mặc định 3 ô số đầu) }) */
function ctmXaEform(def) {
  const ef = XA_EF[def.ef], F = ef.F, nhomF = F[def.nhom], dvtF = F.don_vi_tinh || null;
  const keyF = def.key.map((c) => F[c]).filter(Boolean);
  const soF = (def.so || ef.fields.filter((f) => f.t === 'so' && f.c !== 'nam' && f.c !== 'thang').map((f) => f.c)).map((c) => F[c]).filter(Boolean);
  const infoF = (def.info || []).map((c) => F[c]).filter(Boolean);
  const metrics = { n: { l: 'Dòng số liệu đã nhập', short: 'Dòng số liệu đã nhập', u: 'dòng', d: 0, td: true, neutral: true } };
  const G = nhomF.dm.map((o) => ({ v: o.v, l: o.l }));
  G.forEach((g) => { metrics['g' + xaEfHash(g.v)] = { l: g.l, short: g.l, u: 'dòng', d: 0, td: true, neutral: true }; });
  const kpiDefs = (def.kpis || []).map((k) => Object.assign({}, k, { so: k.so || (soF[0] && soF[0].c) }));
  const unitOfF = (f, R) => xaEfUnitOf(f.l) || (dvtF && XA_EF_DVT_SO.test(f.c) && R && R.don_vi_tinh != null ? xaEfU(xaEfLb(dvtF, R.don_vi_tinh) || '') : '');
  const dOf = (u) => (u === '%' || u === 'tỷ đồng' ? 1 : 0);
  const lbl = (f, v) => { const l = xaEfLb(f, v); return l == null ? String(v) : l; };
  kpiDefs.forEach((k) => {
    const fs = F[k.so], names = Object.keys(k.where).filter((c) => c !== 'loai_dong').map((c) => lbl(F[c], k.where[c]));
    /* tên ô số: tên danh mục của điều kiện, hoặc tên trường bỏ phần đơn vị trong ngoặc (đơn vị ghi dưới số) */
    const l = k.l || (names.length ? names.join(' · ') + (soF.length > 1 ? ' · ' + fs.l : '') : fs.l.replace(/\s*\((m\^2|đồng|VND|%)\)\s*$/i, '').trim());
    metrics['k' + k.id] = { l: l, short: l, u: xaEfUnitOf(fs.l), d: dOf(xaEfUnitOf(fs.l)), td: true, neutral: true };
  });
  const rowsCache = {};
  XA_EF_ROWS.push(rowsCache);
  /* Các dòng số liệu của một kỳ: bản ghi giống nhau ở nhóm, mọi trường mô tả và đơn vị tính gộp thành một dòng */
  const rowsOf = (pid, u) => {
    const ck = pid + '|' + (u ? u.name : '');
    if (rowsCache[ck]) return rowsCache[ck];
    const recs = xaEfAll(def.ef, u).filter((R) => R._pid === pid);
    const by = {}, rows = [];
    recs.forEach((R) => {
      const g = R[def.nhom];
      if (g == null || xaEfLb(nhomF, g) === null) return;
      const idv = [g].concat(keyF.map((f) => R[f.c] == null ? '' : String(R[f.c])), [dvtF && R.don_vi_tinh != null ? String(R.don_vi_tinh) : '']);
      const id = 'r' + xaEfHash(JSON.stringify(idv));
      let r = by[id];
      if (!r) {
        const parts = [];
        keyF.forEach((f) => { const t = R[f.c] == null ? '' : lbl(f, R[f.c]); if (t && parts.indexOf(t) < 0) parts.push(t); });
        r = by[id] = { id: id, g: g, label: parts.join(' · ') || lbl(nhomF, g), keys: {}, recs: [], dvt: dvtF && R.don_vi_tinh != null ? lbl(dvtF, R.don_vi_tinh) : '' };
        keyF.forEach((f) => { r.keys[f.c] = R[f.c] == null ? '' : lbl(f, R[f.c]); });
        rows.push(r);
      }
      r.recs.push(R);
    });
    rows.forEach((r) => {
      /* bản tháng và bản quý của cùng một dòng không cộng chồng: có bản quý thì chỉ lấy bản quý */
      const use = r.recs.some((R) => R.ky_bao_cao === 'quy') ? r.recs.filter((R) => R.ky_bao_cao === 'quy') : r.recs;
      r.vals = {}; r.units = {}; r.info = {};
      soF.forEach((f) => {
        const vs = use.map((R) => R[f.c]).filter(xaEfIsNum), u0 = unitOfF(f, use[0]);
        r.units[f.c] = u0;
        r.vals[f.c] = !vs.length ? null : u0 === '%' ? (vs.length === 1 ? vs[0] : null) : vs.reduce((a, b) => a + b, 0);
      });
      infoF.forEach((f) => { const t = [...new Set(use.map((R) => xaEfCell(f, R[f.c])).filter(Boolean))]; r.info[f.c] = t.length === 1 ? t[0] : t.length ? 'Nhiều giá trị' : ''; });
    });
    return (rowsCache[ck] = { rows: rows, by: by, recs: recs });
  };
  const mKey = (r, f) => r.id + (soF.length > 1 ? '_' + soF.indexOf(f) : '');
  const kpiMatch = (k, R) => Object.keys(k.where).every((c) => R[c] === k.where[c]);
  const data = (pid, ctx) => {
    const u = ctx && ctx.xa;
    if (!u || !CTM_PER_XA.some((p) => p.id === pid)) return null;
    const S = rowsOf(pid, u), D = { n: S.rows.length };
    G.forEach((g) => { D['g' + xaEfHash(g.v)] = S.rows.filter((r) => r.g === g.v).length; });
    S.rows.forEach((r) => soF.forEach((f, i) => {
      const k = mKey(r, f), un = r.units[f.c];
      if (!metrics[k]) metrics[k] = { l: r.label + (soF.length > 1 ? ' · ' + f.l : ''), u: un, d: dOf(un), td: true, neutral: true, row: r.id, fi: i };
      D[k] = r.vals[f.c] == null ? null : ctmRound(r.vals[f.c], metrics[k].d === 1 ? 1 : 3);
    }));
    kpiDefs.forEach((k) => {
      const vs = S.recs.filter((R) => kpiMatch(k, R)).map((R) => R[k.so]).filter(xaEfIsNum);
      D['k' + k.id] = vs.length ? ctmRound(vs.reduce((a, b) => a + b, 0), metrics['k' + k.id].d) : null;
      if (!metrics['k' + k.id].u) { const R0 = S.recs.find((R) => kpiMatch(k, R) && R.don_vi_tinh != null); if (R0) metrics['k' + k.id].u = unitOfF(F[k.so], R0); }
    });
    return D;
  };
  const nP = (spec) => ctmNP(spec);
  const groupRows = (n, g) => { const S = rowsOf(n.p, ctmCtx().xa); return S.rows.filter((r) => r.g === g.v); };
  const prevRow = (n, r) => (n.pp ? rowsOf(n.pp, ctmCtx().xa).by[r.id] : null);
  /* Bảng một nhóm: mỗi dòng số liệu một hàng; cột mô tả chỉ hiện khi có ít nhất một dòng ghi; bấm tên dòng mở các bản ghi tạo ra số đó */
  const tableHtml = (spec, n, g) => {
    const rows = groupRows(n, g);
    if (!rows.length) return '<div class="stc-hint">' + ctmE(ctmPLabel(spec, n.p)) + ' chưa có bản ghi nào thuộc nhóm này.</div>';
    const kc = keyF.filter((f) => rows.some((r) => r.keys[f.c])), ic = infoF.filter((f) => rows.some((r) => r.info[f.c]));
    const one = soF.length === 1, f0 = soF[0];
    let head = '<tr>' + kc.map((f) => '<th>' + ctmE(f.l) + '</th>').join('') + (dvtF && rows.some((r) => r.dvt) ? '<th>' + ctmE(dvtF.l) + '</th>' : '') + ic.map((f) => '<th>' + ctmE(f.l) + '</th>').join('');
    head += one ? '<th>' + ctmE(f0.l + ' · ' + ctmPLabel(spec, n.p)) + '</th><th>' + ctmE(n.pp ? ctmPLabel(spec, n.pp) : 'Quý trước') + '</th><th>Thay đổi</th>' : soF.map((f) => '<th>' + ctmE(f.l) + '</th>').join('');
    head += '<th>Bản ghi</th></tr>';
    const body = rows.map((r) => {
      const pr = prevRow(n, r);
      let h = '<tr>' + kc.map((f, i) => '<td>' + (i === 0 ? ctmLnk(r.keys[f.c] || '—', 'ctmRec(' + ctmJs(r.id) + ')') : ctmE(r.keys[f.c] || '')) + '</td>').join('');
      if (!kc.length) h = '<tr><td>' + ctmLnk(r.label, 'ctmRec(' + ctmJs(r.id) + ')') + '</td>';
      if (dvtF && rows.some((x) => x.dvt)) h += '<td>' + ctmE(r.dvt) + '</td>';
      h += ic.map((f) => '<td>' + ctmE(r.info[f.c]) + '</td>').join('');
      if (one) {
        const v = r.vals[f0.c], pv = pr ? pr.vals[f0.c] : null, d = dOf(r.units[f0.c]);
        h += '<td>' + ctmF(v, d) + (r.units[f0.c] === '%' ? '%' : '') + '</td><td>' + ctmF(pv, d) + (pv != null && r.units[f0.c] === '%' ? '%' : '') + '</td><td>' + ctmDl(v, pv, { neutral: true, rate: r.units[f0.c] === '%', d: d, ref: pv != null ? 'so quý trước' : '', na: 'Chưa có số quý trước' }) + '</td>';
      } else h += soF.map((f) => '<td>' + ctmF(r.vals[f.c], dOf(r.units[f.c])) + (r.units[f.c] === '%' && r.vals[f.c] != null ? '%' : '') + '</td>').join('');
      return h + '<td>' + r.recs.length + '</td></tr>';
    }).join('');
    const pct = soF.some((f) => rows.some((r) => r.units[f.c] === '%' && r.recs.length > 1));
    return '<div class="ctm-scroll"><table class="stc-tbl ctm-eft"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="stc-hint" style="margin-top:10px">Mỗi hàng cộng trường số của các bản ghi giống nhau ở mọi cột mô tả. Bấm tên ở cột đầu để xem các bản ghi tạo ra số đó.' + (pct ? ' Ô tỷ lệ (%) có nhiều bản ghi để trống vì không cộng được tỷ lệ.' : '') + '</div>';
  };
  const groups = G.map((g) => ({
    id: g.v, label: g.l,
    note: (D, P, n) => { const k = groupRows(n, g).length; return ef.ten + ' · ' + nhomF.l + ': ' + g.l + ' · ' + k + ' dòng số liệu, ' + ctmPLabel(CTM_SPECS[def.id], n.p); },
    lines: (n) => groupRows(n, g).slice(0, 4).map((r) => mKey(r, soF[0])),
    count: (n) => groupRows(n, g).length + ' dòng',
    rows: [[{ type: 'html', t: g.l, s: (D, P, n) => nhomF.l + ' · ' + ctmPLabel(CTM_SPECS[def.id], n.p) + (n.pp ? ' so với ' + ctmPLabel(CTM_SPECS[def.id], n.pp) : ''), html: (D, P, n) => tableHtml(CTM_SPECS[def.id], n, g) }]]
  }));
  const kpis = kpiDefs.length
    ? kpiDefs.map((k) => ({ m: 'k' + k.id, sub: () => (metrics['k' + k.id].u ? metrics['k' + k.id].u + ' · ' : '') + 'bấm xem bản ghi', target: 'rec:k' + k.id }))
    : [{ m: 'n', sub: () => 'cả ' + G.length + ' nhóm', target: 'rec' }].concat(G.slice(0, 7).map((g) => ({ m: 'g' + xaEfHash(g.v), sub: () => 'dòng số liệu đã nhập', target: 'g:' + g.v })));

  /* ---------- Màn Dữ liệu đã nhập ---------- */
  const recMatch = (key, R, n) => {
    if (!key) return true;
    if (key.charAt(0) === 'k') { const k = kpiDefs.find((x) => 'k' + x.id === key); return k ? kpiMatch(k, R) : true; }
    const r = rowsOf(n.p, ctmCtx().xa).by[key];
    return r ? r.recs.indexOf(R) >= 0 : true;
  };
  const recList = (spec, n) => {
    const u = ctmCtx().xa, X = CTM_UI.rec, all = xaEfAll(def.ef, u), recs = all.filter((R) => R._pid === n.p);
    const items = recs.map((R) => ({ R: R, bad: xaEfBad(ef, R, def.nhom) }));
    const q = ctmNorm(X.q);
    const shown = items.filter((x) => (X.f === 'all' || (X.f === 'bad' ? Object.keys(x.bad).length : x.R[def.nhom] === X.f)) && recMatch(X.key, x.R, n) &&
      (!q || ef.fields.some((f) => ctmNorm(xaEfCell(f, x.R[f.c])).indexOf(q) >= 0)));
    return { all: all, items: items, shown: shown, noKy: all.filter((R) => !R._pid).length };
  };
  const rec = {
    label: 'Dữ liệu đã nhập',
    card: (n) => {
      const L = recList(CTM_SPECS[def.id], n), nb = L.items.filter((x) => Object.keys(x.bad).length).length;
      const line = (a, b) => '<div class="stc-gl"><span>' + ctmE(a) + '</span><span class="stc-v">' + b + '</span><span></span></div>';
      return line('Bản ghi ' + ctmPLabel(CTM_SPECS[def.id], n.p), ctmF(L.items.length)) + line('Trường của eform, hiện đủ', ctmF(ef.fields.length)) + line('Bản ghi cần xem lại', ctmF(nb));
    },
    screen: (spec) => {
      const n = nP(spec), X = CTM_UI.rec, L = recList(spec, n), u = ctmCtx().xa;
      const nb = L.items.filter((x) => Object.keys(x.bad).length).length;
      const cnt = {};
      L.items.forEach((x) => { const g = x.R[def.nhom]; cnt[g] = (cnt[g] || 0) + 1; });
      let h = ctmHeader(spec, 'home');
      h += ctmNote('<b>Toàn bộ bản ghi ' + ctmE(u ? u.name : '') + ' đã nhập vào eform «' + ctmE(ef.ten) + '», ' + ctmE(ctmPLabel(spec, n.p)) + ':</b> ' + ctmF(L.items.length) + ' bản ghi, đủ ' + ef.fields.length + ' trường của eform theo đúng thứ tự, tên cột đúng như eform. Đối chiếu từng ô với số đã nhập; ô tô màu là ô cần xem lại (rê chuột để xem lý do).' +
        (L.noKy ? ' Có ' + L.noKy + ' bản ghi thiếu năm hoặc kỳ báo cáo nên chưa xếp vào quý nào.' : '') + (XA_EF_LA_MAU ? ' <b>Đang là bản ghi mẫu dựng theo khung eform, chưa nối dữ liệu thật.</b>' : ''));
      const mchip = (k, v) => '<div class="stc-mchip"><div class="stc-k">' + ctmE(k) + '</div><div class="stc-v">' + v + '</div></div>';
      h += '<div class="stc-mchips stc-mt">' + mchip('Bản ghi ' + ctmPLabel(spec, n.p), ctmF(L.items.length)) + mchip('Trường của eform', ctmF(ef.fields.length)) + mchip('Bản ghi cần xem lại', ctmF(nb)) + mchip('Bản ghi mọi quý', ctmF(L.all.length)) + '</div>';
      const pills = [['all', 'Tất cả ' + L.items.length]].concat(G.filter((g) => cnt[g.v]).map((g) => [g.v, g.l + ' ' + cnt[g.v]]), nb ? [['bad', 'Cần xem lại ' + nb]] : []);
      let filt = '';
      if (X.key) {
        const k = kpiDefs.find((x) => 'k' + x.id === X.key), r = rowsOf(n.p, u).by[X.key];
        filt = '<div class="stc-hint" style="margin:0 0 10px">Đang xem các bản ghi tạo ra số «' + ctmE(k ? metrics[X.key].l : r ? r.label : '') + '» · ' + ctmLnk('Bỏ lọc', 'ctmRec(null)') + '</div>';
      }
      const tools = '<div class="ctm-tools"><div class="sgd-pills">' + pills.map((p) => '<button type="button" class="sgd-pill' + (X.f === p[0] ? ' on' : '') + '" onclick="ctmRecF(' + ctmJs(p[0]) + ')">' + ctmE(p[1]) + '</button>').join('') + '</div>' +
        '<label class="sgd-search"><small>Tìm</small><input id="ctmQ" value="' + ctmE(X.q) + '" placeholder="Chữ trong bất kỳ ô nào" oninput="ctmRecQ(this.value)" aria-label="Tìm trong bản ghi"></label></div>';
      const head = '<tr><th>STT</th>' + ef.fields.map((f) => '<th title="' + ctmE(f.t === 'dm' ? 'Danh mục' : f.t === 'so' ? 'Số' : f.t === 'ngay' ? 'Ngày tháng' : 'Chữ') + '">' + ctmE(f.l) + '</th>').join('') + '</tr>';
      const body = L.shown.map((x, i) => '<tr' + (Object.keys(x.bad).length ? ' class="ctm-badrow"' : '') + '><td>' + (i + 1) + '</td>' + ef.fields.map((f) => {
        const t = xaEfCell(f, x.R[f.c]), b = x.bad[f.c];
        return '<td class="' + (f.t === 'so' ? 'ctm-n' : 'ctm-t') + (b ? ' ctm-bad' : '') + '"' + (b ? ' title="' + ctmE(b) + '"' : '') + '>' + (t ? ctmE(t) : '<span class="ctm-nil">—</span>') + '</td>';
      }).join('') + '</tr>').join('');
      h += '<div class="stc-card stc-mt" style="padding:14px 14px 12px"><div class="stc-ch" style="margin-bottom:0"><div><h3 class="stc-ct">Bản ghi eform «' + ctmE(ef.ten) + '»</h3><div class="stc-cs">' + ctmE(L.shown.length + ' / ' + L.items.length + ' bản ghi · ' + ctmPLabel(spec, n.p) + ' · cuộn ngang để xem đủ ' + ef.fields.length + ' cột') + '</div></div></div>' + tools + filt +
        (L.shown.length ? '<div class="ctm-scroll ctm-recbox"><table class="stc-tbl ctm-rect"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' : '<div class="stc-hint">Không có bản ghi phù hợp bộ lọc.</div>') + '</div>';
      return h + ctmFoot(spec, n);
    },
    sheet: (spec, n) => {
      const L = recList(spec, n);
      return { head: ['STT'].concat(ef.fields.map((f) => f.l)), rows: L.items.map((x, i) => [i + 1].concat(ef.fields.map((f) => { const v = x.R[f.c]; return f.t === 'so' && xaEfIsNum(v) ? v : xaEfCell(f, v); }))) };
    }
  };
  return ctmRegister({
    id: def.id, role: def.role, level: 'xa', ef: def.ef,
    /* cách gom số (cho tài liệu, kiểm thử): trường chia nhóm, mô tả dòng, trường số, ghi kèm, ô số chính */
    efCfg: { nhom: def.nhom, key: keyF.map((f) => f.c), so: soF.map((f) => f.c), info: infoF.map((f) => f.c), dvt: dvtF ? dvtF.c : null, kpis: kpiDefs.map((k) => ({ id: k.id, where: k.where, so: k.so })) },
    name: (ctx) => ctmXaLoc(def.name, ctx),
    org: (ctx) => (ctx && ctx.xa ? 'Eform «' + ef.ten + '» · ' + ctmXaLoc(def.org, ctx) + ' ' + ctmXaOf(ctx.xa) : ''),
    periods: CTM_PER_XA, kind: 'quý', cmpRef: 'quý trước', data: data, metrics: metrics, kpis: kpis, groups: groups, rec: rec,
    card: def.card || kpis.slice(0, 3).map((k) => k.m),
    note: 'mọi số lấy từ bản ghi của eform «' + ef.ten + '»; mỗi nhóm là một giá trị của trường «' + nhomF.l + '». Một dòng số liệu là các bản ghi giống nhau ở ' + keyF.map((f) => '«' + f.l + '»').join(', ') + (dvtF ? ' và «' + dvtF.l + '»' : '') + ', cộng dồn trường số; không tính thêm chỉ tiêu nào ngoài eform. So với quý liền trước, màu trung tính. Mở "Dữ liệu đã nhập" để xem đủ ' + ef.fields.length + ' trường của từng bản ghi.',
    foot: 'Kỳ báo cáo quý, so với quý liền trước. Nguồn: eform «' + ef.ten + '».'
  });
}

/* ============================== 12 ĐƠN VỊ ============================== */
ctmXaEform({ id: 'dangxa-eform', role: 'DANG', ef: 'dang', name: 'Đảng ủy phường', org: 'Đảng ủy', nhom: 'nhom_muc', key: ['ten_chi_tieu', 'doi_tuong_thong_ke', 'phan_loai_ket_qua'] });
ctmXaEform({ id: 'hdndxa-eform', role: 'HDND', ef: 'hdnd', name: 'Hội đồng nhân dân phường', org: 'HĐND', nhom: 'chu_de_nhom', key: ['ten_chi_tieu', 'doi_tuong_thong_ke', 'phan_loai_ket_qua', 'du_an_dau_tu_cong'] });
ctmXaEform({ id: 'ubndxa-hcc', role: 'UBND', ef: 'hcc', name: 'Hành chính công', org: 'UBND', nhom: 'nhom_chi_tieu', key: ['chi_tieu'], info: ['don_vi'],
  kpis: ['so_ky_truoc_chuyen_qua', 'tiep_nhan_truc_tiep', 'tiep_nhan_truc_tuyen', 'tiep_nhan_bcci', 'dung_va_truoc_han', 'da_giai_quyet_qua_han', 'chua_den_han', 'dang_giai_quyet_qua_han'].map((v, i) => ({ id: i, where: { chi_tieu: v } })) });
ctmXaEform({ id: 'ubndxa-tcns', role: 'UBND', ef: 'tcns', name: 'Tài chính - Ngân sách', org: 'UBND', nhom: 'loai_gia_tri_sl_st', key: ['ten_chi_tieu', 'tieu_chi_tieu'], so: ['gia_tri_ky_bao_cao', 'gia_tri_luy_ke', 'du_toan_kh_nam'], info: ['ty_le_so_voi_du_toan_kh'],
  card: ['n', 'k4', 'k5'], kpis: ['tong_thu_ngan_sach_nha_nuoc', 'thu_noi_dia', 'tong_chi_ngan_sach_nha_nuoc', 'chi_dau_tu_phat_trien', 'so_luong_doanh_nghiep_dang_hoat_dong', 'so_luong_htx_dang_hoat_dong'].map((v, i) => ({ id: i, where: { tieu_chi_tieu: v } })) });
ctmXaEform({ id: 'ubndxa-qlvb', role: 'UBND', ef: 'qlvb', name: 'Quản lý văn bản', org: 'UBND', nhom: 'loai_van_ban', key: ['nhom_chi_tieu', 'phan_loai'],
  kpis: [{ id: 0, where: { loai_van_ban: 'van_ban_den', nhom_chi_tieu: 'tong_so_van_ban_den' }, l: 'Tổng số văn bản đến' }, { id: 1, where: { loai_van_ban: 'van_ban_di', nhom_chi_tieu: 'tong_so_van_ban_di' }, l: 'Tổng số văn bản đi' },
    { id: 2, where: { nhom_chi_tieu: 'chua_xu_ly' } }, { id: 3, where: { nhom_chi_tieu: 'dang_xu_ly' } }, { id: 4, where: { nhom_chi_tieu: 'da_hoan_tat' } },
    { id: 5, where: { nhom_chi_tieu: 'tong_so_cong_van', phan_loai: 'qua_han' }, l: 'Tổng số công văn · Quá hạn' }] });
ctmXaEform({ id: 'ubndxa-gpmb', role: 'UBND', ef: 'gpmb', name: 'Giải phóng mặt bằng', org: 'UBND', nhom: 'nhom_trang_thai', key: ['ma_du_an', 'ten_du_an_khu_vuc_GPMB', 'loai_dong'], info: ['nhom_du_an', 'chu_dau_tu_don_vi_phu_trach', 'trang_thai_tien_do'],
  kpis: ['tong_dien_tich_phai_thu_hoi', 'dien_tich_da_thu_hoi', 'tong_so_doi_tuong_gpmb', 'da_ban_giao_mat_bang', 'kinh_phi_boi_thuong_ho_tro_du_kien', 'kinh_phi_da_chi_tra'].map((c, i) => ({ id: i, so: c, where: { loai_dong: 'du_an' } })) });
ctmXaEform({ id: 'ubndxa-gd', role: 'UBND', ef: 'gd', name: 'Giáo dục', org: 'UBND', nhom: 'nhom_chi_tieu', key: ['ten_chi_tieu', 'bac_hoc_loai_hinh_giao', 'loai_co_so', 'gioi_tinh', 'dan_toc', 'trinh_do_chuyen_mon', 'nhom_doi_tuong', 'phan_loai_ket_qua'] });
ctmXaEform({ id: 'ubndxa-yte', role: 'UBND', ef: 'yte', name: 'Y tế', org: 'UBND', nhom: 'nhom_chi_tieu', key: ['ten_chi_tieu', 'tieu_chi_tieu'], info: ['tan_suat'] });
ctmXaEform({ id: 'ubndxa-vh', role: 'UBND', ef: 'vh', name: 'Văn hóa', org: 'UBND', nhom: 'nhom_chi_tieu', key: ['ten_chi_tieu', 'doi_tuong_thong_ke', 'loai_hinh', 'tinh_chat', 'quy_mo'], so: ['so_luong', 'kinh_phi_doanh_thu', 'so_nguoi_tham_gia'], info: ['muc_do_lan_toa', 'muc_do_quan_tam'] });
ctmXaEform({ id: 'ubndxa-nv', role: 'UBND', ef: 'nv', name: 'Nội vụ', org: 'UBND', nhom: 'doi_tuong_thong_ke', key: ['ten_chi_tieu', 'phan_loai_ket_qua'] });
ctmXaEform({ id: 'ubndxa-ktxh', role: 'UBND', ef: 'ktxh', name: 'Kinh tế xã hội', org: 'UBND', nhom: 'nhom_chi_tieu', key: ['phan_nhom', 'chi_tieu', 'don_vi_chu_tri_bao_cao'], so: ['thanh_pho_giao', 'kh_nam', 'uoc_thuc_hien_den_nay', 'danh_gia_muc_do_hoan_thanh'] });
ctmXaEform({ id: 'mttqxa-eform', role: 'MTTQ', ef: 'mttq', name: 'Mặt trận Tổ quốc phường', org: 'Ủy ban MTTQ', nhom: 'nhom_to_chuc', key: ['ten_chi_tieu', 'don_vi_doan_loai_hinh', 'phan_loai_ket_qua'],
  kpis: ['doanvien', 'giamsat', 'phanbienxahoi', 'hienmau', 'mohinh', 'tongthu', 'tongchi', 'tonquy'].map((v, i) => ({ id: i, where: { ten_chi_tieu: v } })) });

/* ============================== MÀN NGOÀI TÀI KHOẢN XÃ, PHƯỜNG ============================== */
const CTM_XA_SHORT = {
  'dangxa-eform': 'Đảng ủy', 'hdndxa-eform': 'HĐND', 'mttqxa-eform': 'Ủy ban MTTQ',
  'ubndxa-hcc': 'Hành chính công', 'ubndxa-tcns': 'Tài chính - Ngân sách', 'ubndxa-qlvb': 'Quản lý văn bản', 'ubndxa-gpmb': 'GPMB',
  'ubndxa-gd': 'Giáo dục', 'ubndxa-yte': 'Y tế', 'ubndxa-vh': 'Văn hóa', 'ubndxa-nv': 'Nội vụ', 'ubndxa-ktxh': 'Kinh tế xã hội'
};
const CTM_XA_EYE = (ctx) => 'Tổng quan · ' + (ctx && ctx.xa ? ctx.xa.name : 'xã, phường');
const CTM_XA_HINT = (ctx) => (ctx && ctx.xa ? 'Số liệu lấy từ 12 eform của ' + ctx.xa.name + (XA_EF_LA_MAU ? ' (đang là bản ghi mẫu)' : '') + ' · bấm ô để mở chi tiết' : '');
const CTM_XA_AXES = [{ id: 'DANG', label: 'Đảng ủy phường', ax: 'Đảng ủy' }, { id: 'HDND', label: 'HĐND phường', ax: 'HĐND' }, { id: 'UBND', label: 'UBND phường', ax: 'UBND' }, { id: 'MTTQ', label: 'Ủy ban MTTQ phường', ax: 'MTTQ' }];
ctmRegisterOverview({
  id: 'xa-4truc', roles: ['DANG', 'HDND', 'UBND', 'MTTQ'], level: 'xa', unitWord: 'eform', rename: ctmXaLoc, short: CTM_XA_SHORT,
  eyebrow: CTM_XA_EYE, hint: CTM_XA_HINT,
  title: (n) => 'Số liệu then chốt của 4 trục, ' + n + ' eform',
  groupTitle: 'Bốn trục · bấm một trục để lọc danh sách eform bên dưới',
  kpis: [
    { cat: 'dangxa-eform', m: 'n', l: 'Số liệu Đảng ủy đã nhập', target: 'rec' }, { cat: 'hdndxa-eform', m: 'n', l: 'Số liệu HĐND đã nhập', target: 'rec' }, { cat: 'ubndxa-hcc', m: 'k2', target: 'rec:k2' }, { cat: 'ubndxa-hcc', m: 'k4', target: 'rec:k4' },
    { cat: 'ubndxa-qlvb', m: 'k0', target: 'rec:k0' }, { cat: 'ubndxa-gpmb', m: 'k1', target: 'rec:k1' }, { cat: 'ubndxa-yte', m: 'n', l: 'Số liệu Y tế đã nhập', target: 'rec' }, { cat: 'mttqxa-eform', m: 'n', l: 'Số liệu MTTQ đã nhập', target: 'rec' }
  ],
  groups: CTM_XA_AXES.map((a) => ({ id: a.id, label: a.label, role: a.id, ax: a.ax }))
});
/* Từng tab trục của tài khoản xã, phường: cùng màn ngoài, không chia nhóm */
[
  ['DANG', CTM_SPECS['dangxa-eform'].kpis.map((k) => ['dangxa-eform', k.m, k.target])],
  ['HDND', CTM_SPECS['hdndxa-eform'].kpis.map((k) => ['hdndxa-eform', k.m, k.target])],
  ['UBND', [['ubndxa-hcc', 'k2', 'rec:k2'], ['ubndxa-hcc', 'k4', 'rec:k4'], ['ubndxa-qlvb', 'k0', 'rec:k0'], ['ubndxa-qlvb', 'k1', 'rec:k1'], ['ubndxa-gpmb', 'k1', 'rec:k1'], ['ubndxa-tcns', 'n', 'rec', 'Số liệu Tài chính - Ngân sách đã nhập'], ['ubndxa-gd', 'n', 'rec', 'Số liệu Giáo dục đã nhập'], ['ubndxa-yte', 'n', 'rec', 'Số liệu Y tế đã nhập']]],
  ['MTTQ', CTM_SPECS['mttqxa-eform'].kpis.map((k) => ['mttqxa-eform', k.m, k.target])]
].forEach(([role, ks]) => {
  const A = CTM_XA_AXES.find((a) => a.id === role);
  ctmRegisterOverview({
    id: 'xa-' + role, roles: [role], level: 'xa', unitWord: 'eform', rename: ctmXaLoc, short: CTM_XA_SHORT, ax: A.ax,
    eyebrow: (ctx) => CTM_XA_EYE(ctx) + ' · ' + ctmXaLoc(A.label, ctx), hint: CTM_XA_HINT,
    title: (n) => 'Số liệu then chốt của ' + n + ' eform',
    kpis: ks.slice(0, 8).map((k) => ({ cat: k[0], m: k[1], target: k[2], l: k[3] })), groups: []
  });
});
