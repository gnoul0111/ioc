'use strict';
/* Kiểm thử ô số → thẻ (03/11/2026): bấm ô số ở Tổng quan phải tới đúng số đó — mở nhóm, cuộn tới thẻ có chính chỉ tiêu đó (data-ctm-m);
   nhóm không có thẻ nào hiện số này thì mở thẳng các bản ghi tạo ra số (chỉ tiêu theo eform). Đơn vị đã ẩn (TRUC_AN_DON_VI_CU, UBND_SO_DA_NHAP) bỏ qua.
   Chạy: node tests/ctm/o-so-focus.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO_CFG.unshift('js/core/xa-dan-so.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js',
  'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js',
  'js/core/eform-khung.js', 'js/core/eform-mau.js', 'js/features/ctm-eform.js', 'js/features/ctm-truc-eform.js', 'js/features/ctm-so-eform.js', 'js/features/ctm-so-eform2.js', 'js/features/ctm-xa-eform.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, Set, esc: escFn, document: { getElementById: () => null } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const S = run('CTM_SPECS'), J = JSON.stringify;
/* bỏ qua đơn vị không hiện: ban cũ của 4 trục (TRUC_AN_DON_VI_CU), sở đã nhập vào sở khác (UBND_SO_DA_NHAP, central-level.js) */
const hien = (id) => !/^(mttq|hdnd)-(?!ef)/.test(id) && ['dang-vptu', 'ubnd-dulich', 'ubnd-quyhoach-kientruc'].indexOf(id) < 0;
const check = (id, tag) => {
  const s = S[id];
  run('CTM_UI.id=' + J(id) + ';CTM_UI.kyMode=null;CTM_UI.gran="quy";CTM_UI.period=null;CTM_UI.screen="home";CTM_UI.dd=null');
  const home = run('ctmScreenHtml(CTM_SPECS[' + J(id) + '])');
  s.kpis.forEach((k) => {
    if (String(k.target).indexOf('g:') !== 0) return;
    ok(home.indexOf('CTM_UI.focus=' + J(k.m).replace(/"/g, '&quot;')) >= 0, tag + ' ' + k.m + ': ô số đặt chỉ tiêu cần tới trước khi mở nhóm');
    const h = run('CTM_UI.screen="group";CTM_UI.group=' + J(String(k.target).slice(2)) + ';ctmScreenHtml(CTM_SPECS[' + J(id) + '])');
    const co = (h.match(/data-ctm-m="([^"]*)"/g) || []).some((x) => x.slice(12, -1).split(' ').indexOf(k.m) >= 0);
    const v = run('ctmV(CTM_SPECS[' + J(id) + '],' + J(k.m) + ',ctmNP(CTM_SPECS[' + J(id) + ']).D)'), rec = s.metrics[k.m] && s.metrics[k.m].rec;
    ok(co || (rec && s.rec) || v == null, tag + ' ' + k.m + ': nhóm có thẻ hiện số này, hoặc mở thẳng bản ghi tạo ra số');
    run('CTM_UI.screen="home"');
  });
};
console.log('== Cấp Thành phố');
Object.keys(S).filter((id) => (S[id].level || 'city') === 'city' && hien(id)).forEach((id) => check(id, id));
console.log('== Xã, phường');
setXa('Phường Việt Hưng');
Object.keys(S).filter((id) => S[id].level === 'xa').forEach((id) => check(id, id + ' [Việt Hưng]'));
setXa(null);
console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
if (fail) process.exitCode = 1;
