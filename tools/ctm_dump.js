'use strict';
/* Xuất cách hiển thị của một (hay nhiều) chỉ tiêu trên giao diện IOC mới, đọc thẳng từ cấu hình khung dùng chung (ctm-*.js),
   để tài liệu mô tả luôn khớp code. Chạy từ thư mục gốc ioc:  node tools/ctm_dump.js ubnd-vhtt [ubnd-dulich …]  → JSON
   Dùng bởi tools/ctm_display.py (phần "Cách hiển thị trên giao diện IOC" của các tài liệu *_MO_TA_CHI_TIEU). */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SO = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
const FILES = SO.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js',
  'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js']);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc, document: {} });
const edu = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + edu[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
vm.runInContext('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}', ctx);
const run = (c) => vm.runInContext(c, ctx);
const S = run('CTM_SPECS');
const txt = (f, D) => { try { return typeof f === 'function' ? f(D) : f || ''; } catch (e) { return ''; } };
/* kiểu số: cờ của chỉ tiêu; chỉ tiêu sở theo eform (một kỳ) không gắn cờ lũy kế / tại thời điểm thì nhận theo tên */
const typeOf = (m) => m.plan ? 'plan' : m.month ? 'month' : m.u === '%' ? 'rate' : m.u === 'điểm' ? 'score'
  : m.ck || /lũy kế/i.test(m.l) ? 'lk' : m.td || /cuối kỳ|đầu kỳ|đang (hoạt động|làm việc|theo dõi|thực hiện|có)|hiện có|tại thời điểm|\(\d{1,2}\/\d{1,2}\/\d{4}\)/i.test(m.l + ' ' + (m.short || '')) ? 'td' : 'ps';

const out = {};
process.argv.slice(2).forEach((id) => {
  const s = S[id];
  if (!s) { out[id] = null; return; }
  const pid = s.periods[0].id, D = run('ctmD')(S[id], pid) || {};
  const ckPid = s.periods.find((p) => p.id === 'ck') ? 'ck' : null, DC = ckPid ? run('ctmD')(s, 'ck') || {} : {};
  const metrics = Object.keys(s.metrics).map((k) => {
    const m = s.metrics[k];
    return { k, l: m.l, short: m.short || '', u: m.u, d: m.d || 0, type: typeOf(m), pol: m.inv ? 'inv' : m.neutral ? 'neutral' : 'up',
      base: run('ctmBase')(s, k), hasCk: DC[k] != null, v: D[k] == null ? null : D[k], vs: D[k] == null ? '—' : run('ctmF')(D[k], m.d || 0) };
  });
  const groups = (s.groups || []).map((g) => ({
    id: g.id, label: g.label, note: txt(g.note, D), lines: g.lines || [],
    cards: [].concat(...(g.rows || run('ctmAutoRows')(s, g))).map((c) => ({ type: c.type, t: c.t || '', u: c.u || '', plan: !!(c.vals2 && (c.plan || /kế hoạch/i.test(c.l2 || ''))),
      l2: c.l2 || '', idx: /chỉ số/i.test(c.t || '') || !!c.idx, hint: txt(c.hint, D), semantic: !!c.semantic, items: c.items && Array.isArray(c.items) ? c.items : [] }))
  }));
  const xa = s.xa ? s.xa.inds.map((I) => ({ id: I.id, l: I.l, u: I.u, d: I.d || 0, better: I.better || 'high', tot: !!I.tot, noRank: run('ctmXaNoRank')(I),
    tpL: I.tpL || (I.tot ? 'Tổng 126 xã, phường' : 'Mức chung Thành phố'), tpm: I.tpm || '', minW: I.minW || 0 })) : [];
  const card = (s.card || []).map((k) => ({ k, l: (s.cardL && s.cardL[k]) || (s.metrics[k] && (s.metrics[k].short || s.metrics[k].l)) || k }));
  const kpis = (s.kpis || []).map((o) => ({ k: o.m, sub: txt(o.sub, D) }));
  out[id] = { id, name: s.name, ky: s.periods.map((p) => p.label), ck: ckPid ? s.periods.find((p) => p.id === 'ck').label : '', metrics, groups, xa, card, kpis };
});
process.stdout.write(JSON.stringify(out));
