'use strict';
/* Kiểm thử chỉ tiêu xã, phường theo 12 eform (ctm-xa-units.js, chốt 28/10/2026). Chặn tái phát 3 lỗi đã gặp ở các sở:
     1. màn hình không hiện hết các trường của eform → người nhập không đối chiếu được;
     2. tự đặt thêm chỉ tiêu ngoài eform;
     3. số trên màn tổng hợp không lần lại được bản ghi đã nhập.
   Chạy: node tests/ctm/xa-eform.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO_CFG.unshift('js/core/xa-dan-so.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js']);
/* document tối thiểu: ctmRec/ctmRecF… gọi ctmRerender, không có popup thì bỏ qua (getElementById trả null) */
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: { getElementById: () => null } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');
const setXa = (name) => run('currentXaId=' + (name ? JSON.stringify(String(run('wardNames().indexOf(' + JSON.stringify(name) + ')'))) : 'null'));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ths = (h, cls) => { const t = h.split('class="stc-tbl ' + cls + '"')[1] || ''; return (t.split('</thead>')[0].match(/<th[^>]*>([\s\S]*?)<\/th>/g) || []).map((x) => unesc(x.replace(/<[^>]*>/g, ''))); };
const trs = (h, cls) => { const t = (h.split('class="stc-tbl ' + cls + '"')[1] || '').split('</tbody>')[0].split('<tbody>')[1] || ''; return t.split('</tr>').filter((x) => x.indexOf('<td') >= 0); };
const EF = run('XA_EFORM'), S = run('CTM_SPECS');
const XS = Object.keys(S).filter((k) => S[k].level === 'xa');
const XA_T = ['Phường Việt Hưng', 'Xã Ba Vì'];

console.log('== Khung eform: 12 eform của sheet Xã/Phường');
{
  ok(EF.length === 12, '12 eform (' + EF.length + ')');
  ok(EF.reduce((s, e) => s + e.fields.length, 0) === 187, '187 trường như sheet (' + EF.reduce((s, e) => s + e.fields.length, 0) + ')');
  ok(EF.every((e) => e.fields.every((f) => /^[A-Za-z0-9_]+$/.test(f.c))), 'mã trường đã chuẩn hóa (không dấu, không ký tự ẩn)');
  ok(EF.every((e) => e.fields.every((f) => (f.dm || []).every((o) => /^[A-Za-z0-9_%]+$/.test(o.v)))), 'mã danh mục đã chuẩn hóa');
  const m = EF.find((e) => e.id === 'mttq').F.ten_chi_tieu.dm.find((o) => o.v === 'chitieuhoi');
  ok(m && m.goc === 'chitieuh​oi', 'MTTQ: mã "chitieuh​oi" có ký tự ẩn được chuẩn hóa, giữ mã gốc');
  ok(XS.length === 12 && new Set(XS.map((k) => S[k].ef)).size === 12 && EF.every((e) => XS.some((k) => S[k].ef === e.id)), 'mỗi eform đúng một đơn vị trên IOC');
  ok(EF.every((e) => XS.some((k) => S[k].ef === e.id && S[k].role === e.truc)), 'đơn vị nằm đúng trục của eform (Đảng ủy, HĐND, UBND, MTTQ)');
}

XA_T.forEach((xa) => {
  setXa(xa);
  const u = run('ctmCurrentXaUnit()');
  XS.forEach((id) => {
    const s = S[id], ef = EF.find((e) => e.id === s.ef), tag = xa + ' · ' + id;
    run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period="2026Q2";CTM_UI.rec={f:"all",q:"",key:null};');
    const recs = run('xaEfAll')(s.ef, u), now = recs.filter((R) => R._pid === '2026Q2');

    /* 1. bản ghi mẫu chỉ có trường của eform, ô danh mục chỉ nhận mã trong danh mục */
    const raw = run('XA_EF_NGUON')(s.ef, u);
    const extra = new Set(), badDm = [];
    raw.forEach((R) => Object.keys(R).forEach((c) => {
      const f = ef.F[c];
      if (!f) { extra.add(c); return; }
      if (f.t === 'dm' && f.dm.length && R[c] != null && !f.dm.some((o) => o.v === R[c])) badDm.push(c + '=' + R[c]);
    }));
    ok(!extra.size, tag + ': bản ghi không có trường ngoài eform' + (extra.size ? ' (' + [...extra].join(', ') + ')' : ''));
    ok(!badDm.length, tag + ': ô danh mục chỉ nhận mã có trong danh mục' + (badDm.length ? ' (' + badDm.slice(0, 3).join(', ') + ')' : ''));
    ok(raw.every((R) => ef.fields.every((f) => f.c in R)), tag + ': bản ghi có đủ mọi trường của eform');
    ok(now.length > 0 && recs.every((R) => R._pid), tag + ': có bản ghi quý 2/2026, mọi bản ghi xếp được vào quý');

    /* 2. màn Dữ liệu đã nhập: đủ mọi trường, đúng thứ tự, tên cột đúng như eform, đủ số bản ghi */
    const h = run('CTM_UI.screen="rec";ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
    const head = ths(h, 'ctm-rect');
    ok(JSON.stringify(head.slice(1)) === JSON.stringify(ef.fields.map((f) => f.l)), tag + ': Dữ liệu đã nhập có đủ ' + ef.fields.length + ' cột, đúng tên và thứ tự trường eform');
    ok(trs(h, 'ctm-rect').length === now.length, tag + ': hiện đủ ' + now.length + ' bản ghi của kỳ (' + trs(h, 'ctm-rect').length + ')');
    ok(h.indexOf('ctm-bad') < 0, tag + ': bản ghi mẫu không có ô lỗi');
    const vis = h.replace(/<[^>]*>/g, ' ');
    ok(!/undefined|NaN|\[object/.test(vis), tag + ': không có undefined/NaN');
    /* ô danh mục hiện tên hiển thị, không hiện mã */
    const R0 = now[0], fdm = ef.fields.filter((f) => f.t === 'dm' && f.dm.length && R0[f.c] != null);
    ok(fdm.every((f) => trs(h, 'ctm-rect')[0].indexOf('>' + escFn(run('xaEfLb')(f, R0[f.c])) + '<') >= 0), tag + ': ô danh mục hiện tên hiển thị của eform');

    /* 3. chỉ tiêu: chỉ có số dòng đã nhập, số theo nhóm, cộng trường số theo điều kiện danh mục, và dòng số liệu từ bản ghi */
    const D = run('ctmD')(s, '2026Q2', { xa: u });
    const keys = Object.keys(s.metrics);
    ok(keys.every((k) => /^(n|g[0-9a-z]+|k\d+|r[0-9a-z]+(_\d+)?)$/.test(k)), tag + ': không có chỉ tiêu nào ngoài 4 loại lấy từ bản ghi' + (keys.filter((k) => !/^(n|g[0-9a-z]+|k\d+|r[0-9a-z]+(_\d+)?)$/.test(k)).join(',')));
    const Sx = Object.keys(D).filter((k) => k.charAt(0) === 'r');
    ok(Sx.every((k) => s.metrics[k] && s.metrics[k].row), tag + ': mỗi dòng số liệu gắn với dòng bản ghi');
    ok(D.n === s.groups.reduce((a, g) => a + D['g' + run('xaEfHash')(g.id)], 0), tag + ': số dòng các nhóm cộng lại = tổng số dòng');
    /* mỗi số = cộng đúng trường số của các bản ghi tạo ra nó (lần lại được) */
    let badSum = 0;
    s.groups.forEach((g) => {
      run('CTM_UI.screen="group";CTM_UI.group=' + JSON.stringify(g.id));
      const lines = run('ctmGLines')(g, run('ctmNP')(s));
      ok(lines.every((k) => s.metrics[k]), tag + ' › ' + g.label + ': dòng thẻ nhóm có khai báo');
      const gh = run('ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      ok(gh.indexOf('ctm-eft') >= 0 || /chưa có bản ghi nào/.test(gh), tag + ' › ' + g.label + ': màn nhóm dựng được bảng');
      ok(!/undefined|NaN/.test(gh.replace(/<[^>]*>/g, ' ')), tag + ' › ' + g.label + ': không có undefined/NaN');
    });
    /* lần lại: mở Dữ liệu đã nhập lọc theo dòng số liệu → phải ra các bản ghi tạo ra số đó (phép cộng kiểm ở khối sau) */
    [...new Set(Sx.map((k) => s.metrics[k].row))].forEach((row) => {
      if (!trs(run('ctmRec(' + JSON.stringify(row) + ');ctmScreenHtml(CTM_SPECS[CTM_UI.id])'), 'ctm-rect').length) badSum++;
    });
    ok(!badSum, tag + ': bấm mọi dòng số liệu đều mở được các bản ghi tạo ra số đó');
    /* ô số chính lọc theo điều kiện: số = cộng trường của bản ghi khớp; bấm mở đúng các bản ghi đó */
    s.kpis.filter((k) => /^k\d+$/.test(k.m)).forEach((k) => {
      const hr = run('ctmRec(' + JSON.stringify(k.m) + ');ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
      const n = trs(hr, 'ctm-rect').length;
      ok(D[k.m] == null ? n === 0 : n > 0, tag + ' › ô số «' + s.metrics[k.m].l + '»: bấm mở ' + n + ' bản ghi tạo ra số');
    });
    run('CTM_UI.rec={f:"all",q:"",key:null};CTM_UI.screen="home"');
    const hh = run('ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
    ok(/Dữ liệu đã nhập/.test(hh) && hh.indexOf('ctmRec(null)') >= 0, tag + ': Tổng quan có lối vào Dữ liệu đã nhập');
  });
});

console.log('== Tổng hợp cộng đúng bản ghi; bản ghi lỗi được tô màu; mã có dấu, ký tự ẩn vẫn đọc được');
{
  setXa('Phường Việt Hưng');
  const u = run('ctmCurrentXaUnit()');
  /* nguồn thử: 2 bản ghi cùng dòng (cộng), 1 bản ghi mã ngoài danh mục, 1 số không đọc được, 1 mã có dấu / ký tự ẩn */
  run('var __src=XA_EF_NGUON;');
  const base = { dia_ban: 'MTTQ phường Việt Hưng', ky_bao_cao: 'quy', nam: 2026, thang: null, quy: 'quy_ii', nhom_to_chuc: 'mttq', don_vi_doan_loai_hinh: null, phan_loai_ket_qua: null, don_vi_tinh: 'người', ghi_chu: null };
  const recs = [
    Object.assign({}, base, { ten_chi_tieu: 'doanvien', gia_tri: 10 }),
    Object.assign({}, base, { ten_chi_tieu: 'doanvien', gia_tri: '1.234' }),
    Object.assign({}, base, { ten_chi_tieu: 'khong_co_ma_nay', gia_tri: 5 }),
    Object.assign({}, base, { ten_chi_tieu: 'giamsat', gia_tri: 'mười' }),
    Object.assign({}, base, { ten_chi_tieu: 'chitieuh​oi', gia_tri: 7 }),
    Object.assign({}, base, { nhom_to_chuc: null, ten_chi_tieu: 'tongthu', gia_tri: 3 })
  ];
  ctx.__T = recs;
  run('XA_EF_NGUON=function(ef,u){return ef==="mttq"?__T:__src(ef,u)};xaEfReset();');
  const s = S['mttqxa-eform'];
  const D = run('ctmD')(s, '2026Q2', { xa: u });
  const kDv = s.kpis.find((k) => s.metrics[k.m].l === 'Đoàn viên').m;
  ok(D[kDv] === 1244, 'ô số Đoàn viên = 10 + 1.234 (số dạng chữ "1.234" đọc là 1234) (' + D[kDv] + ')');
  const rDv = Object.keys(D).find((k) => k.charAt(0) === 'r' && s.metrics[k].l === 'Đoàn viên');
  ok(rDv && D[rDv] === 1244, 'dòng số liệu Đoàn viên gộp 2 bản ghi giống nhau, cộng = 1.244');
  ok(Object.keys(D).some((k) => k.charAt(0) === 'r' && s.metrics[k].l === 'Chỉ tiêu công tác Hội' && D[k] === 7), 'mã "chitieuh​oi" (ký tự ẩn) đọc đúng thành «Chỉ tiêu công tác Hội»');
  ok(D.n === 3 + 1, 'mã ngoài danh mục và bản ghi bỏ trống nhóm không vào phần Tổng hợp (' + D.n + ' dòng)');
  run('CTM_UI.id="mttqxa-eform";CTM_UI.period="2026Q2";CTM_UI.rec={f:"all",q:"",key:null};CTM_UI.screen="rec";');
  const h = run('ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
  ok(trs(h, 'ctm-rect').length === 6, 'Dữ liệu đã nhập vẫn hiện cả 6 bản ghi, kể cả bản ghi lỗi');
  ok((h.match(/ctm-bad"/g) || []).length === 3 && /Mã không có trong danh mục của eform/.test(h) && /Không phải số/.test(h) && /Bỏ trống nên bản ghi chưa vào phần Tổng hợp/.test(h), 'tô màu đúng 3 ô lỗi: mã ngoài danh mục, số không đọc được, bỏ trống trường chia nhóm');
  ok(/>khong_co_ma_nay</.test(h), 'ô mã ngoài danh mục hiện nguyên mã đã nhập để người nhập thấy');
  ok(trs(run('ctmRecF("bad");ctmScreenHtml(CTM_SPECS[CTM_UI.id])'), 'ctm-rect').length === 3, 'lọc "Cần xem lại" ra đúng 3 bản ghi');
  ok(trs(run('ctmRecF("all");ctmRecQ("hiến máu");ctmScreenHtml(CTM_SPECS[CTM_UI.id])'), 'ctm-rect').length === 0 && trs(run('ctmRecQ("doan vien");ctmScreenHtml(CTM_SPECS[CTM_UI.id])'), 'ctm-rect').length === 2, 'tìm theo chữ trong ô (không phân biệt dấu)');
  /* bản tháng và bản quý cùng dòng không cộng chồng */
  ctx.__T = [Object.assign({}, base, { ten_chi_tieu: 'doanvien', gia_tri: 30 }), Object.assign({}, base, { ky_bao_cao: 'thang', thang: 5, quy: null, ten_chi_tieu: 'doanvien', gia_tri: 9 })];
  run('xaEfReset();');
  const D2 = run('ctmD')(s, '2026Q2', { xa: u });
  ok(D2[Object.keys(D2).find((k) => k.charAt(0) === 'r')] === 30, 'cùng dòng có bản quý và bản tháng: chỉ lấy bản quý (30, không phải 39)');
  run('XA_EF_NGUON=__src;xaEfReset();');
}

console.log('== Màn ngoài tài khoản xã, phường');
{
  setXa('Phường Việt Hưng');
  const cats = [];
  ['DANG', 'HDND', 'UBND', 'MTTQ'].forEach((r) => run('[' + ['dangxa-eform', 'hdndxa-eform', 'mttqxa-eform', 'ubndxa-hcc', 'ubndxa-tcns', 'ubndxa-qlvb', 'ubndxa-gpmb', 'ubndxa-gd', 'ubndxa-yte', 'ubndxa-vh', 'ubndxa-nv', 'ubndxa-ktxh'].map((x) => JSON.stringify(x)).join(',') + ']').forEach((id) => { if (S[id].role === r) cats.push({ id: id, role: r, name: id, items: [] }); }));
  run('function categorySeedForRole(r){return ' + JSON.stringify(cats) + '.filter(function(c){return c.role===r})}');
  ['xa-4truc', 'xa-DANG', 'xa-HDND', 'xa-UBND', 'xa-MTTQ'].forEach((oid) => {
    const cfg = run('CTM_OVERVIEWS').find((c) => c.id === oid);
    const list = cats.filter((c) => cfg.roles.indexOf(c.role) >= 0);
    const h = run('ctmOverviewHtml')(cfg, list);
    ok((h.match(/class="uo-card"/g) || []).length === list.length, oid + ': đủ ' + list.length + ' thẻ eform');
    ok((h.match(/class="stc-kpi uo-kpi"/g) || []).length === cfg.kpis.length && !/>—</.test(h.split('uo-kpis')[1].split('</section>')[0]), oid + ': ' + cfg.kpis.length + ' ô số then chốt đều có số');
  });
  setXa(null);
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
