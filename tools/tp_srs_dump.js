'use strict';
/* Xuất dữ liệu cho tài liệu SRS chỉ tiêu 4 trục cấp Thành phố theo eform (tools/tp_srs_docx.py) ra JSON. Đọc thẳng cấu hình đang chạy
   — nạp code vào vm như tests/ctm/tp-eform.test.js: khung eform (js/core/eform-khung.js), đơn vị và cấu hình eform
   (js/features/ctm-truc-eform.js), cách tính từng chỉ tiêu (efMoTa), vai trò từng trường suy từ cấu hình, màn ngoài, cờ, số mẫu.
   Chạy từ thư mục gốc ioc:  node tools/tp_srs_dump.js > scratch.json */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SO = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO.unshift('js/core/xa-dan-so.js');
const FILES = SO.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js',
  'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js',
  'js/core/eform-khung.js', 'js/core/eform-mau.js', 'js/features/ctm-eform.js', 'js/features/ctm-truc-eform.js']);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc, document: { getElementById: () => null } });
const edu = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + edu[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
vm.runInContext('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}', ctx);
const run = (c) => vm.runInContext(c, ctx);
const S = run('CTM_SPECS'), EFK = run('EFK'), K = run('EFORM_KHUNG'), efMoTa = run('efMoTa'), efUnit = run('efUnit'), efPick = run('efPick'), efVals = run('efVals'), efAll = run('efAll');
const efKhongKy = run('efKhongKy'), efFmt = run('efFmt'), EF_XA = run('EF_XA'), EF_LOC = run('EF_LOC');
const ROLES = ['DANG', 'HDND', 'UBND', 'MTTQ'];
const ids = Object.keys(S).filter((k) => S[k].efDonVi && ROLES.indexOf(S[k].role) >= 0);
const PID = '2026Q3', PLB = (p) => run('EF_KY').quy.concat(run('EF_KY').thang, run('EF_KY').nam).find((x) => x.id === p).label;
const KY = { ky_bao_cao: 'Kỳ: xếp bản ghi vào kỳ', nam: 'Kỳ', thang: 'Kỳ', quy: 'Kỳ' };

/* Vai trò của một trường ở phần tổng hợp, suy thẳng từ cấu hình eform (không viết tay) */
function vaiTro(cfg, unitId, c) {
  if (KY[c]) return [KY[c]];
  const out = [], fl = (x) => '«' + (EFK[cfg.ef].F[x] ? EFK[cfg.ef].F[x].l : x) + '»';
  const ci = (cfg.cap || []).indexOf(c);
  if (ci >= 0) out.push('Chia cấp ' + (ci + 1) + ' của bảng nhiều cấp');
  (cfg.bang || []).forEach((b) => { const i = b.cap.indexOf(c); if (i >= 0) out.push('Chia cấp ' + (i + 1) + ' bảng «' + b.t + '»'); });
  if ((cfg.khoa || []).indexOf(c) >= 0) out.push('Khóa bản ghi' + ((cfg.khoaRong || []).indexOf(c) >= 0 ? ' (được để trống)' : ''));
  if (cfg.xaTruong === c || (cfg.diaBan === c && (EF_XA[unitId] || []).some((I) => I.ef === cfg.ef))) out.push('Xã, phường của bản ghi: màn «Theo 126 xã, phường»');
  else if (cfg.diaBan === c) out.push('Bảng «Theo ' + EFK[cfg.ef].F[c].l.toLowerCase() + '»');
  if (cfg.dvt === c) out.push('Đơn vị tính: không cộng khác đơn vị tính');
  if (cfg.uuTien && (cfg.uuTien.c === c || cfg.uuTien.theo.indexOf(c) >= 0)) out.push('Chọn bản ghi ưu tiên (' + fl(cfg.uuTien.c) + ')');
  const tinh = Object.keys(cfg.chi).filter((id) => {
    const m = cfg.chi[id];
    return [].concat(m.c || []).indexOf(c) >= 0 || (m.theo || []).indexOf(c) >= 0 || Object.keys(m.loc || {}).indexOf(c) >= 0 || (m.f && new RegExp('R\\.' + c + '\\b').test(String(m.f)));
  }).map((id) => cfg.chi[id].l);
  if (tinh.length) out.push('Tính: ' + tinh.slice(0, 3).join('; ') + (tinh.length > 3 ? '; … (+' + (tinh.length - 3) + ')' : ''));
  const bieu = (cfg.bieu || []).filter((b) => b.theo === c).map((b) => b.t);
  if (bieu.length) out.push('Biểu đồ: ' + bieu.join('; '));
  const kt = (cfg.kt || []).filter((k) => (k.c || []).indexOf(c) >= 0 || new RegExp('R\\.' + c + '\\b').test(String(k.f))).map((k) => k.l);
  if (kt.length) out.push('Kiểm tra: ' + kt.join('; '));
  if (EF_LOC && Object.keys(EF_LOC).some((s) => s === unitId && EF_LOC[s].c === c)) out.push('Lọc sẵn theo tài khoản Ban (FR-12)');
  return out.length ? out : ['Chỉ xem ở Dữ liệu đã nhập'];
}
const BIEU = { cot: 'Thanh ngang', chong: 'Cơ cấu, thanh xếp chồng', xu: 'Cột qua các kỳ', phan: 'Cơ cấu theo chỉ tiêu thành phần', ds: 'Thanh các chỉ tiêu' };
const units = ids.map((id) => {
  const s = S[id];
  const efs = s.groups.map((g) => run('EF_CFG')[g.id]).map((cfg) => {
    const ef = EFK[cfg.ef];
    let pid = PID, P = efPick(cfg, pid);
    if (!P.used.length && !efKhongKy(cfg.ef)) { const k = run('efKyGanNhat')(cfg); if (k) { pid = k.p; P = efPick(cfg, pid); } }
    const V = P.used.length ? efVals(cfg, P.used) : {};
    return {
      ef: cfg.ef, ten: cfg.ten || ef.ten, efTen: ef.ten, sheet: ef.sheet, dong: ef.dong, banGhi: cfg.banGhi, khongKy: efKhongKy(cfg.ef),
      khoa: (cfg.khoa || []).map((c) => ef.F[c].l), khoaRong: (cfg.khoaRong || []).map((c) => ef.F[c].l), cap: (cfg.cap || []).map((c) => ef.F[c].l),
      chi: Object.keys(cfg.chi).map((cid) => ({ id: cid, l: cfg.chi[cid].l, loai: cfg.chi[cid].loai, u: efUnit(cfg, cid), mota: efMoTa(cfg, cid),
        the: (cfg.the || []).indexOf(cid) >= 0, cot: (cfg.cot || []).indexOf(cid) >= 0, kpi: (s.kpis || []).some((k) => k.m === cfg.ef + '_' + cid), v: V[cid] == null ? null : efFmt(cfg, cid, V[cid]) })),
      bieu: (cfg.bieu || []).map((b) => ({ t: b.t, loai: BIEU[b.loai] || b.loai, theo: b.theo ? ef.F[b.theo].l : null })),
      bang: (cfg.bang || []).map((b) => ({ t: b.t, cap: b.cap.map((c) => ef.F[c].l) })),
      xa: (EF_XA[id] || []).filter((I) => I.ef === cfg.ef).map((I) => I.l), xaTruong: cfg.xaTruong || cfg.diaBan ? ef.F[cfg.xaTruong || cfg.diaBan].l : null,
      kt: (cfg.kt || []).map((k) => k.l),
      mau: { pid: pid, label: efKhongKy(cfg.ef) ? 'mọi kỳ' : PLB(pid), n: P.used.length, nAll: efAll(cfg.ef).length },
      fields: ef.fields.map((f) => ({ l: f.l, c: f.c, t: f.t, mau: f.mau || '', dong: f.dong, dm: (f.dm || []).map((o) => o.l || o.v), vai: vaiTro(cfg, id, f.c) }))
    };
  });
  return { id: id, role: s.role, name: s.name, org: s.org, kpis: s.kpis.map((k) => ({ l: k.l || s.metrics[k.m].l, m: k.m })), card: (s.card || []).map((k) => s.metrics[k] ? s.metrics[k].l : k),
    xa: !!s.xa, loc: EF_LOC[id] ? { c: EFK[EF_LOC[id].ef].F[EF_LOC[id].c].l, tk: EF_LOC[id].tk } : null, eforms: efs };
});
const ov = run('CTM_OVERVIEWS').filter((o) => /-ef$/.test(o.id)).map((o) => ({ id: o.id, roles: o.roles, title: o.eyebrow,
  kpis: o.kpis.map((k) => ({ cat: k.cat, unit: S[k.cat] ? (typeof S[k.cat].name === 'string' ? S[k.cat].name : k.cat) : k.cat, l: k.l || (S[k.cat] && S[k.cat].metrics[k.m] ? S[k.cat].metrics[k.m].l : 'dòng ' + k.line + ' (nguồn cũ)'), eform: !!(S[k.cat] && S[k.cat].efDonVi) })) }));
const old = run('CTM_OVERVIEWS').filter((o) => ['dang-tp', 'hdnd-tp', 'mttq-tp', 'tu-all'].indexOf(o.id) >= 0 && (o.level || 'city') === 'city').map((o) => ({ id: o.id, enabled: o.enabled }));
const khoi = K.filter((k) => k.eforms.some((e) => /^(dang|hdnd|mttq|vpub|ubnd)\d/.test(e.id))).map((k) => ({ id: k.id, sheet: k.sheet, n: k.eforms.length }));
process.stdout.write(JSON.stringify({
  pid: PID, plabel: PLB(PID), units: units, overviews: ov, oldOverviews: old, khoi: khoi, nKhoi: K.length, nEform: K.reduce((a, k) => a + k.eforms.length, 0),
  flags: { CTM_ENABLED: run('CTM_ENABLED'), CTM_OVERVIEW_ENABLED: run('CTM_OVERVIEW_ENABLED'), EF_LA_MAU: run('EF_LA_MAU') }
}));
