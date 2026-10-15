'use strict';
/* Đọc cấu hình chỉ tiêu của IOC (không cần trình duyệt) và in ra JSON cho tools/tong_hop_du_lieu_docx.py:
   - seed: categorySeed 4 trục Thành phố, bộ cấp xã (XA_CATEGORIES_BY_ROLE), cấp Trung ương — [tên, kỳ, nguồn] từng chỉ tiêu
   - ctm: các đơn vị khuôn chỉ tiêu mới (CTM_SPECS) — trục, cấp, số kỳ, số chỉ số
   - so: số chỉ tiêu 3 đơn vị có form riêng (Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC)
   Chạy từ thư mục gốc ioc:  node tools/tong-hop-du-lieu-dump.js */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: (s) => String(s == null ? '' : s), document: { getElementById: () => null }, window: {}, localStorage: { getItem: () => null, setItem() {} } });
const run = (c, f) => vm.runInContext(c, ctx, { filename: f });
const SO = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'];
SO.map((s) => 'js/core/' + s + '-config.js').concat(['js/core/hcc-config.js', 'js/core/sgd-config.js', 'js/core/stc-config.js', 'js/core/central-level.js']).forEach((f) => run(read(f), f));
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
run('const gdUnitData=[' + eduM[1] + '];function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
['js/features/hcc-data.js', 'js/features/sgd-data.js', 'js/core/ctm-xa.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js'].forEach((f) => run(read(f), f));
const out = run(`(function(){
 function cats(a){return a.map(function(c){return {id:c.id,name:c.name,types:c.types||[],items:(c.items||[]).map(function(i){return [i[0],i[2],i[3]]})}})}
 var r={seed:{},xa:{},tw:{}};
 Object.keys(categorySeed).forEach(function(k){r.seed[k]=cats(categorySeed[k])});
 Object.keys(XA_CATEGORIES_BY_ROLE).forEach(function(k){r.xa[k]=cats(XA_CATEGORIES_BY_ROLE[k])});
 Object.keys(TW_OFFICE_CATEGORIES_BY_ROLE).forEach(function(k){r.tw[k]=cats(TW_OFFICE_CATEGORIES_BY_ROLE[k])});
 r.ctm=Object.keys(CTM_SPECS).map(function(id){var s=CTM_SPECS[id];return {id:id,role:s.role,level:s.level,periods:(s.periods||[]).length,metrics:Object.keys(s.metrics||{}).length}});
 r.xaCount={total:CTM_XA.length,phuong:CTM_XA.filter(function(u){return u.k==='P'}).length,xa:CTM_XA.filter(function(u){return u.k==='X'}).length,pop:CTM_POP};
 return r})()`);
const src = read('js/core/stc-config.js');
out.so = {
  stc: (src.match(/\{ id: '[a-z_0-9]+', group: '/g) || []).length,
  sgd: (read('js/features/sgd-data.js').match(/\{ id: '[a-z0-9]+', g: '/g) || []).length,
  hcc: (read('js/features/hcc-data.js').match(/\{ id: '[a-zA-Z0-9]+', g: '/g) || []).length
};
process.stdout.write(JSON.stringify(out));
