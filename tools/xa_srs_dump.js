'use strict';
/* Xuất dữ liệu cho tài liệu SRS chỉ tiêu cấp xã, phường theo 12 eform (tools/xa_srs_docx.py) ra JSON. Đọc thẳng cấu hình đang chạy
   — nạp code vào vm như tests/ctm/xa-eform.test.js: khung eform (js/core/xa-eform.js), 12 đơn vị (js/features/ctm-xa-units.js),
   màn ngoài, cờ, danh mục 126 xã, phường và số mẫu của 2 xã, phường để đối chiếu khi kiểm thử.
   Chạy từ thư mục gốc ioc:  node tools/xa_srs_dump.js > scratch.json */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const SO = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO.unshift('js/core/xa-dan-so.js');
const FILES = SO.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js',
  'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js']);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc, document: { getElementById: () => null } });
const edu = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + edu[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
vm.runInContext('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}', ctx);
const run = (c) => vm.runInContext(c, ctx);
const S = run('CTM_SPECS'), EF = run('XA_EFORM'), XA = run('CTM_XA'), P = run('CTM_PER_XA');
const SAMPLE = ['Phường Việt Hưng', 'Xã Ba Vì'];
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));
const pid = P[0].id;
const loc = run('ctmXaLoc');
const rnd = (v, d) => (v == null ? null : Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0));

const ids = Object.keys(S).filter((k) => S[k].level === 'xa');
const units = ids.map((id) => {
  const s = S[id], C = s.efCfg, ef = EF.find((e) => e.id === s.ef);
  const samples = SAMPLE.map((name) => {
    setXa(name);
    const u = run('ctmCurrentXaUnit()'), D = run('ctmD')(s, pid, { xa: u }) || {}, all = run('xaEfAll')(s.ef, u);
    const rows = Object.keys(D).filter((k) => k.charAt(0) === 'r').map((k) => s.metrics[k]).filter((m) => m.fi === 0).length;
    return { name: name, recs: all.filter((R) => R._pid === pid).length, recsAll: all.length, rows: rows, n: D.n,
      groups: s.groups.map((g) => D['g' + run('xaEfHash')(g.id)]), kpis: s.kpis.map((k) => rnd(D[k.m], s.metrics[k.m].d)) };
  });
  setXa(SAMPLE[0]);
  return {
    id: id, role: s.role, ef: s.ef, efName: ef.ten, efRow: ef.dong, name: loc(typeof s.name === 'function' ? s.name({ xa: null }) : s.name, { xa: null }),
    short: run('CTM_XA_SHORT')[id] || '', nhom: C.nhom, key: C.key, so: C.so, info: C.info, dvt: C.dvt,
    kpis: s.kpis.map((k, i) => {
      const m = s.metrics[k.m], kd = C.kpis.find((x) => 'k' + x.id === k.m);
      return { m: k.m, l: m.l, u: m.u || '', target: k.target, where: kd ? kd.where : null, so: kd ? kd.so : null, kind: kd ? 'sum' : k.m === 'n' ? 'rows' : 'group' };
    }),
    groups: s.groups.map((g) => ({ id: g.id, label: g.label })),
    card: (s.card || []).map((k) => s.metrics[k] ? s.metrics[k].l : k),
    note: s.note, samples: samples
  };
});
setXa(null);
const ov = run('CTM_OVERVIEWS').filter((o) => o.level === 'xa').map((o) => ({ id: o.id, roles: o.roles, kpis: o.kpis.map((k) => ({ cat: k.cat, m: k.m, l: k.l || (S[k.cat].metrics[k.m] || {}).l, u: (S[k.cat].metrics[k.m] || {}).u || '', target: k.target || '' })) }));
const out = {
  periods: P, sample: SAMPLE, eforms: EF.map((e) => ({ id: e.id, truc: e.truc, ten: e.ten, dong: e.dong, fields: e.fields.map((f) => ({ l: f.l, c: f.c, goc: f.goc || null, t: f.t, mau: f.mau || '', dong: f.dong, dm: (f.dm || []).map((o) => ({ v: o.v, l: o.l, goc: o.goc || null, lgoc: o.lgoc || null })) })) })),
  units: units, overviews: ov,
  flags: { CTM_ENABLED: run('CTM_ENABLED'), CTM_OVERVIEW_ENABLED: run('CTM_OVERVIEW_ENABLED'), CTM_XA_ALL_TAB: run('CTM_XA_ALL_TAB'), CTM_XA_SO_SANH: run('CTM_XA_SO_SANH'), XA_EF_LA_MAU: run('XA_EF_LA_MAU') },
  xa: XA.map((u) => ({ name: u.name, k: u.k, ds: u.ds, dt: u.dt, den: u.den, ho: u.ho })),
  tot: { pop: run('CTM_POP'), dt: XA.reduce((a, u) => a + u.dt, 0), nP: XA.filter((u) => u.k === 'P').length, nX: XA.filter((u) => u.k === 'X').length }
};
process.stdout.write(JSON.stringify(out));
