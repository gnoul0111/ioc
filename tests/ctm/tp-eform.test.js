'use strict';
/* Kiểm thử chỉ tiêu 4 trục cấp Thành phố theo eform (ctm-eform.js, ctm-truc-eform.js, chốt 28/10/2026). Chặn tái phát:
     1. màn hình không hiện hết các trường của eform → người nhập không đối chiếu được;
     2. tự đặt thêm chỉ tiêu, trường ngoài eform; dữ liệu mẫu sinh thêm trường;
     3. số trên màn tổng hợp không lần lại được bản ghi;
     4. bản tháng và bản quý cộng chồng (X2), bản trùng khóa cộng hai lần (X1);
     5. đơn vị cũ không có eform bị xóa thay vì ẩn.
   Chạy: node tests/ctm/tp-eform.test.js */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const escFn = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const SO_CFG = ['vhtt', 'vpub', 'bql', 'dl', 'dttg', 'ttra', 'khcn', 'nnmt', 'sct', 'sxd', 'snv', 'syt'].map((s) => 'js/core/' + s + '-config.js');
SO_CFG.unshift('js/core/xa-dan-so.js');
const FILES = SO_CFG.concat(['js/core/hcc-config.js', 'js/features/hcc-data.js', 'js/core/ctm-xa.js', 'js/core/xa-eform.js', 'js/core/xa-eform-mau.js', 'js/core/line-chart.js', 'js/features/ctm-engine.js', 'js/features/ctm-mttq.js', 'js/features/ctm-dang.js', 'js/features/ctm-hdnd.js', 'js/features/ctm-all.js', 'js/features/ctm-xa-units.js', 'js/features/ctm-so.js',
  'js/core/eform-khung.js', 'js/core/eform-mau.js', 'js/features/ctm-eform.js', 'js/features/ctm-truc-eform.js']);
const ctx = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date, esc: escFn, document: { getElementById: () => null } });
const eduM = read('js/features/dashboard-education.js').match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
vm.runInContext('const gdUnitData=[' + eduM[1] + '];', ctx);
FILES.forEach((f) => vm.runInContext(read(f), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
run('var currentXaId=null;function wardNames(){return gdUnitData.map(function(u){return u[0]})}');

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  ✗ ' + msg); } };
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ths = (h, cls) => { const t = h.split('class="stc-tbl ' + cls + '"')[1] || ''; return (t.split('</thead>')[0].match(/<th[^>]*>([\s\S]*?)<\/th>/g) || []).map((x) => unesc(x.replace(/<[^>]*>/g, '')).trim()); };
const trs = (h, cls) => { const t = (h.split('class="stc-tbl ' + cls + '"')[1] || '').split('</tbody>')[0].split('<tbody>')[1] || ''; return t.split('</tr>').filter((x) => x.indexOf('<td') >= 0); };
const S = run('CTM_SPECS'), EFK = run('EFK'), CFG = run('EF_CFG');
const UNITS = Object.keys(S).filter((k) => S[k].efDonVi);
const screen = (id, sc, p, extra) => run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.period=' + JSON.stringify(p) + ';CTM_UI.screen=' + JSON.stringify(sc) + ';' + (extra || '') + 'ctmScreenHtml(CTM_SPECS[' + JSON.stringify(id) + '])');
const TRUC_EF = Object.keys(EFK).filter((k) => /^(dang|hdnd|mttq|vpub)\d$/.test(k) || ['ubnd2', 'ubnd3', 'ubnd6', 'ubnd9'].indexOf(k) >= 0);

console.log('== Khung eform cấp Thành phố sinh từ file');
{
  const K = run('EFORM_KHUNG');
  ok(K.length === 16, '16 khối (sheet) (' + K.length + ')');
  ok(K.reduce((s, k) => s + k.eforms.length, 0) === 74, '74 eform');
  ok(TRUC_EF.length === 29, '29 eform của 4 trục được dựng (' + TRUC_EF.length + ')');
  ok(TRUC_EF.every((e) => CFG[e]), 'mỗi eform 4 trục có cấu hình chỉ tiêu');
  ok(TRUC_EF.every((e) => UNITS.filter((u) => S[u].groups.some((g) => g.id === e)).length === 1), 'mỗi eform nằm ở đúng một đơn vị trên IOC');
  const at = (u) => S[u].groups.map((g) => g.id).join(',');
  ok(at('dang-ubkt') === 'dang1' && at('dang-to-chuc') === 'dang2,dang3,dang4,dang5,dang6' && at('dang-tuyen-giao') === 'dang7' && at('dang-noi-chinh') === 'dang8', 'Đảng: eform về đúng Ban đã chốt');
  ok(at('ubnd-vpubnd') === 'vpub1,vpub2,vpub3,vpub4,vpub5,ubnd2,ubnd3,ubnd6,ubnd9', 'VP UBND: 9 eform (5 sheet VP UBND + 4 chỉ có ở sheet Trục UBND)');
  ok([1, 2, 3, 4, 5, 6].every((i) => at('hdnd-ef' + i) === 'hdnd' + i && at('mttq-ef' + i) === 'mttq' + i), 'HĐND, MTTQ: mỗi eform một đơn vị');
}

console.log('== Chỉ dùng trường của eform (không thêm chỉ tiêu, trường)');
TRUC_EF.forEach((e) => {
  const cfg = CFG[e], F = EFK[e].F, has = (c) => c === '_kyId' || !!F[c];
  const used = [].concat(cfg.khoa || [], cfg.cap || [], cfg.diaBan ? [cfg.diaBan] : [], cfg.xaTruong ? [cfg.xaTruong] : [], cfg.dvt ? [cfg.dvt] : [], (cfg.bieu || []).filter((b) => b.theo).map((b) => b.theo),
    ...(cfg.bang || []).map((t) => t.cap), ...(cfg.kt || []).map((k) => k.c || []), cfg.uuTien ? [cfg.uuTien.c].concat(cfg.uuTien.theo) : []);
  Object.keys(cfg.chi).forEach((id) => { const m = cfg.chi[id]; [].concat(m.c || []).forEach((c) => used.push(c)); (m.theo || []).forEach((c) => used.push(c)); Object.keys(m.loc || {}).forEach((c) => used.push(c)); });
  const bad = used.filter((c) => !has(c));
  ok(!bad.length, e + ': mọi trường dùng để tính, chia cấp, vẽ có trong eform' + (bad.length ? ' — thừa ' + bad.join(', ') : ''));
  const ids = Object.keys(cfg.chi);
  ok(Object.keys(cfg.chi).every((id) => { const m = cfg.chi[id]; return m.loai !== 'tyle' && m.loai !== 'hieu' ? true : /IOC tính/.test(m.l) && ids.indexOf(m.tu || m.a) >= 0 && ids.indexOf(m.mau || m.b) >= 0; }), e + ': số IOC tính (tỷ lệ, hiệu) ghi "IOC tính", tính từ chỉ tiêu của eform');
  ok([].concat(cfg.cot || [], cfg.the || [], cfg.xaChi || [], cfg.cotDb || [], ...(cfg.bieu || []).map((b) => b.ms || [b.m]), ...(cfg.bang || []).map((t) => t.cot)).every((id) => cfg.chi[id]), e + ': bảng, biểu đồ chỉ dùng chỉ tiêu đã khai báo');
  /* dữ liệu mẫu: chỉ trường của eform, ô danh mục chỉ nhận mã trong danh mục */
  const raw = run('EF_NGUON')(e), extra = new Set(), badDm = new Set();
  raw.forEach((R) => Object.keys(R).forEach((c) => { const f = F[c]; if (!f) { extra.add(c); return; } if (f.t === 'dm' && R[c] != null && R[c] !== '' && !f.dm.some((o) => o.v === R[c])) badDm.add(c + '=' + R[c]); }));
  ok(raw.length > 0, e + ': có bản ghi mẫu');
  ok(!extra.size, e + ': bản ghi mẫu không sinh thêm trường' + (extra.size ? ' — ' + [...extra].join(', ') : ''));
  ok(!badDm.size, e + ': ô danh mục của bản ghi mẫu đúng mã trong danh mục' + (badDm.size ? ' — ' + [...badDm].slice(0, 3).join(', ') : ''));
});
UNITS.forEach((u) => {
  const s = S[u], allow = new Set();
  s.groups.forEach((g) => Object.keys(CFG[g.id].chi).forEach((id) => allow.add(g.id + '_' + id)));
  ok(Object.keys(s.metrics).every((k) => allow.has(k)), u + ': mọi chỉ tiêu của đơn vị là chỉ tiêu dựng từ eform');
  ok(s.kpis.length >= 4 && s.kpis.length <= 8, u + ': 4–8 ô số chính (' + s.kpis.length + ')');
});

console.log('== Màn "Dữ liệu đã nhập": đủ mọi trường, đúng thứ tự, đúng tên');
UNITS.forEach((u) => {
  const s = S[u];
  s.groups.forEach((g) => {
    const e = g.id, ef = EFK[e];
    /* kỳ xem có bản ghi: eform báo cáo theo năm thì chọn Năm */
    run('CTM_UI.gran=' + JSON.stringify(['quy', 'nam'].find((gr) => { run('CTM_UI.gran=' + JSON.stringify(gr)); return s.periods.some((x) => run('efPick')(CFG[e], x.id).cand.length); }) || 'quy'));
    const p = (s.periods.find((x) => run('efPick')(CFG[e], x.id).cand.length) || s.periods[0]).id;
    const h = screen(u, 'rec', p, 'CTM_UI.rec={f:"all",q:"",key:null,ef:' + JSON.stringify(e) + '};');
    const head = ths(h, 'ctm-rect');
    ok(JSON.stringify(head) === JSON.stringify(['STT'].concat(ef.fields.map((f) => f.l))), u + ' · ' + e + ': cột = STT + ' + ef.fields.length + ' trường của eform, đúng thứ tự, đúng tên');
    const cand = run('efPick')(CFG[e], p).cand.length;
    ok(trs(h, 'ctm-rect').length === Math.min(500, cand), u + ' · ' + e + ': hiện mọi bản ghi của kỳ (' + cand + ')');
    const sh = run('CTM_SPECS[' + JSON.stringify(u) + '].rec.sheet')(s, run('ctmNP(CTM_SPECS[' + JSON.stringify(u) + '])'));
    ok(sh.head.length === ef.fields.length + 2 && sh.rows.length === cand, u + ' · ' + e + ': Xuất Excel đủ trường, đủ bản ghi, có cột Ghi chú IOC');
  });
  run('CTM_UI.gran="quy"');
});

console.log('== Mọi màn dựng được ở Tháng / Quý / Năm; số lần lại được bản ghi');
['thang', 'quy', 'nam'].forEach((gr) => {
  run('CTM_UI.gran=' + JSON.stringify(gr));
  UNITS.forEach((u) => {
    const s = S[u], p = s.periods[0].id;
    let err = '';
    try {
      screen(u, 'home', p);
      s.groups.forEach((g) => { const h = screen(u, 'group', p, 'CTM_UI.group=' + JSON.stringify(g.id) + ';'); if (/NaN|undefined/.test(h)) err = g.id + ' có NaN/undefined'; });
    } catch (e) { err = e.message; }
    ok(!err, gr + ' · ' + u + ': dựng được màn chính và màn từng eform' + (err ? ' — ' + err : ''));
  });
});
run('CTM_UI.gran="quy"');
{
  /* Bấm dòng ở bảng nhóm → đúng các bản ghi tạo ra số của dòng đó; cộng các dòng cấp 1 = tổng */
  let checked = 0;
  UNITS.forEach((u) => S[u].groups.forEach((g) => {
    const e = g.id, cfg = CFG[e], p = S[u].periods[0].id, used = run('efPick')(cfg, p).used;
    if (!used.length || !(cfg.cap || []).length) return;
    const h = screen(u, 'group', p, 'CTM_UI.group=' + JSON.stringify(e) + ';EF_FULL[' + JSON.stringify(e + '|cap') + ']=true;');
    const rows = trs(h, 'ctm-eft ef-tree').filter((r) => /class="ef-d0"/.test(r));
    const keys = rows.map((r) => { const m = unesc(r).match(/ctmRec\(("[^"]*(?:\\.[^"]*)*")\)/); return m ? JSON.parse(m[1]) : null; }).filter(Boolean);
    const n = keys.reduce((s0, k) => { const pk = run('efParseKey')(k); return s0 + used.filter((R) => run('efMatch')(R, pk.path)).length; }, 0);
    ok(keys.length === rows.length && n === used.length, u + ' · ' + e + ': mỗi dòng cấp 1 bấm được, cộng bản ghi các dòng = ' + used.length);
    const k0 = keys[0];
    const hr = screen(u, 'rec', p, 'CTM_UI.rec={f:"all",q:"",key:' + JSON.stringify(k0) + ',ef:null};');
    const want = used.filter((R) => run('efMatch')(R, run('efParseKey')(k0).path)).length;
    ok(trs(hr, 'ctm-rect').length === Math.min(500, want), u + ' · ' + e + ': bấm dòng đầu → đúng ' + want + ' bản ghi');
    checked++;
  }));
  ok(checked >= 20, 'đã kiểm lần lại bản ghi ở ' + checked + ' eform');
}

console.log('== X1, X2: không cộng chồng, bản trùng lấy bản sau');
{
  const save = run('EF_NGUON');
  const mk = (ky, nam, thang, quy, dv, t, x) => ({ ky_bao_cao: ky, nam: nam, thang: thang, quy: quy, don_vi_bao_cao: dv, cap_bao_cao: 'xa_phuong', tong_so_van_ban_ho_so_cong_viec: t, so_van_ban_ho_so_xu_ly_tren_moi_truong_mang: x, ty_le_tu_tinh: Math.round(x / t * 1000) / 10, ghi_chu: '' });
  const dv = EFK.vpub1.F.don_vi_bao_cao.dm[0].v, dv2 = EFK.vpub1.F.don_vi_bao_cao.dm[1].v;
  ctx.__T = [mk('thang', 2026, 7, 'quy_iii', dv, 100, 90), mk('thang', 2026, 8, 'quy_iii', dv, 100, 95), mk('quy', 2026, null, 'quy_iii', dv, 300, 280),
    mk('quy', 2026, null, 'quy_iii', dv2, 50, 40), mk('quy', 2026, null, 'quy_iii', dv2, 60, 55)];
  run('EF_NGUON=function(e){return e==="vpub1"?__T:[]};efReset();');
  const P = run('efPick')(CFG.vpub1, '2026Q3'), V = run('efVals')(CFG.vpub1, P.used);
  ok(P.cand.length === 5 && P.used.length === 3, 'X1, X2: 5 bản ghi của quý, dùng 3 (' + P.used.length + ')');
  ok(V.tong === 260 && V.xl === 240, 'đơn vị có bản tháng thì không cộng bản quý; bản quý trùng khóa lấy bản sau (tổng ' + V.tong + ')');
  const h = screen('ubnd-vpubnd', 'rec', '2026Q3', 'CTM_UI.rec={f:"all",q:"",key:null,ef:"vpub1"};');
  ok((h.match(/Trùng khóa với bản gửi sau/g) || []).length === 1 && (h.match(/Cùng khóa đã có bản kỳ ngắn hơn/g) || []).length === 1, 'màn Dữ liệu đã nhập ghi lý do bản ghi không dùng');
  const Vt = run('efVals')(CFG.vpub1, run('efPick')(CFG.vpub1, '2026-07').used);
  ok(Vt.tong === 100, 'xem theo tháng: chỉ bản tháng 7 (' + Vt.tong + ')');
  ok(run('efPick')(CFG.vpub1, '2026').used.length === 3, 'xem theo năm: vẫn không cộng chồng');
  /* eform không có trường Năm: không gán năm, mọi kỳ hiện toàn bộ bản ghi */
  ctx.__U = [{ ky_bao_cao: 'quy', don_vi_bao_cao: dv, tong_so_van_ban_ho_so_cong_viec: 10, so_van_ban_ho_so_xu_ly_tren_moi_truong_mang: 9, ty_le_tu_tinh: 90, ghi_chu: '' },
    { ky_bao_cao: 'quy', don_vi_bao_cao: dv, tong_so_van_ban_ho_so_cong_viec: 20, so_van_ban_ho_so_xu_ly_tren_moi_truong_mang: 18, ty_le_tu_tinh: 90, ghi_chu: '' }];
  run('EF_NGUON=function(e){return e==="ubnd2"?__U:[]};efReset();');
  ok(run('efKhongKy')('ubnd2') && !run('efKhongKy')('vpub1'), 'nhận ra eform không có trường «Năm»');
  ok(run('efPick')(CFG.ubnd2, '2025Q1').used.length === 1 && run('efVals')(CFG.ubnd2, run('efPick')(CFG.ubnd2, '2026-09').used).tong === 20, 'eform không có «Năm»: mọi kỳ như nhau, bản trùng lấy bản sau');
  ok(!run('efAll')('ubnd2').some((R) => 'nam' in R), 'không tự thêm trường «Năm» vào bản ghi');
  run('EF_NGUON=__S;efReset();'.replace('__S', 'efMau'));
  ok(run('EF_NGUON') === save, 'trả lại nguồn bản ghi mẫu');
}

console.log('== Bản ghi cần xem lại (X8 và kiểm tra riêng của eform)');
{
  const bad = (e) => { const all = run('efAll')(e); return all.filter((R) => Object.keys(run('efBad')(CFG[e], R, all)).length); };
  ok(bad('dang5').some((R) => run('efBad')(CFG.dang5, R, []).tong_dang_vien_hien_co_cuoi_ky), 'dang5: bản ghi không cân đầu kỳ → cuối kỳ được tô màu');
  ok(bad('mttq4').some((R) => run('efBad')(CFG.mttq4, R, []).tong_thu_trong_ky), 'mttq4: tổng thu khác cộng 7 khoản được tô màu');
  ok(bad('vpub1').some((R) => run('efBad')(CFG.vpub1, R, []).ty_le_tu_tinh), 'vpub1: tỷ lệ đã nhập lệch được tô màu');
  ok(bad('hdnd1').some((R) => run('efBad')(CFG.hdnd1, R, run('efAll')('hdnd1')).so_luot_cu_tri_tham_gia), 'hdnd1: cùng cuộc TXCT mà số lượt cử tri khác nhau được tô màu');
  const ok8 = TRUC_EF.every((e) => { const all = run('efAll')(e); return bad(e).length <= all.length * 0.15; });
  ok(ok8, 'bản ghi mẫu phần lớn hợp lệ (tối đa 15% bản ghi bị tô màu ở mọi eform)');
}

console.log('== Số đã nhập hiện đúng; số tại thời điểm không cộng các kỳ');
{
  run('CTM_UI.gran="nam"');
  const P = run('efPick')(CFG.dang4, '2025').used, V = run('efVals')(CFG.dang4, P);
  const lastQ = run('efPick')(CFG.dang4, '2025Q4').used, VQ = run('efVals')(CFG.dang4, lastQ);
  ok(V.tc === VQ.tc && V.dv === VQ.dv, 'dang4: xem năm = số cuối năm (không cộng 4 quý) — tổ chức ' + V.tc + ', đảng viên ' + V.dv);
  const P5 = run('efPick')(CFG.dang5, '2025').used, V5 = run('efVals')(CFG.dang5, P5), V5a = run('efVals')(CFG.dang5, run('efPick')(CFG.dang5, '2025-01').used);
  ok(V5.dau === V5a.dau, 'dang5: đầu kỳ của năm = đầu kỳ tháng 1');
  const P2 = run('efPick')(CFG.mttq2, '2026-09').used, V2 = run('efVals')(CFG.mttq2, P2);
  const n2 = new Set(P2.map((R) => R.don_vi_bao_cao)).size;
  ok(V2.dv === n2 && V2.ct === P2.filter((R, i, a) => a.findIndex((x) => x.don_vi_bao_cao === R.don_vi_bao_cao) === i).reduce((s0, R) => s0 + R.chi_tieu_van_dong_duoc_giao, 0), 'mttq2: chỉ tiêu giao lấy một lần mỗi đơn vị, không cộng theo số bản ghi');
  const one = P2.filter((R) => R.don_vi_bao_cao === P2[0].don_vi_bao_cao);
  ok(run('efVals')(CFG.mttq2, one).tlN === one[0].ty_le_hoan_thanh_chi_tieu && V2.tlN == null, 'mttq2: tỷ lệ đã nhập hiện ở dòng một đơn vị, dòng gộp nhiều đơn vị không cộng tỷ lệ');
  run('CTM_UI.gran="quy"');
}

console.log('== Kỳ xem chọn Tháng / Quý / Năm (X12)');
{
  const s = S['dang-to-chuc'];
  run('CTM_UI.id="dang-to-chuc";CTM_UI.screen="home";');
  run('ctmSetGran("thang")');
  ok(s.periods[0].id === '2026-09' && s.kind === 'tháng', 'Tháng: kỳ đầu là tháng 9/2026');
  run('ctmSetGran("nam")');
  ok(s.periods[0].id === '2026' && s.periods.length === 2, 'Năm: 2026, 2025');
  run('ctmSetGran("quy")');
  ok(s.periods[0].id === '2026Q3', 'Quý: kỳ đầu là Quý 3/2026');
  ok(/Xem theo/.test(screen('dang-to-chuc', 'home', '2026Q3')), 'thanh công cụ có ô chọn "Xem theo" Tháng / Quý / Năm');
}

console.log('== Đơn vị cũ không có eform: ẩn bằng cờ, không xóa');
{
  const c2 = vm.createContext({ console, Math, Number, String, Object, Array, JSON, isFinite, Date });
  SO_CFG.concat(['js/core/hcc-config.js', 'js/core/central-level.js']).forEach((f) => vm.runInContext(read(f), c2, { filename: f }));
  vm.runInContext('currentXaId=null;', c2);
  const r2 = (c) => vm.runInContext(c, c2);
  const ids = (role) => r2('categorySeedForRole(' + JSON.stringify(role) + ').map(function(c){return c.id})');
  ok(r2('TRUC_AN_DON_VI_CU') === true, 'có cờ TRUC_AN_DON_VI_CU');
  ok(JSON.stringify(ids('DANG')) === JSON.stringify(['dang-to-chuc', 'dang-ubkt', 'dang-noi-chinh', 'dang-tuyen-giao']), 'Đảng: hiện 4 Ban có eform, ẩn VPTU');
  ok(JSON.stringify(ids('HDND')) === JSON.stringify([1, 2, 3, 4, 5, 6].map((i) => 'hdnd-ef' + i)), 'HĐND: chỉ hiện 6 eform');
  ok(JSON.stringify(ids('MTTQ')) === JSON.stringify([1, 2, 3, 4, 5, 6].map((i) => 'mttq-ef' + i)), 'MTTQ: chỉ hiện 6 eform');
  ok(r2('categorySeed.HDND.filter(function(c){return c.an}).length') === 10 && r2('categorySeed.MTTQ.filter(function(c){return c.an}).length') === 17, 'đơn vị cũ còn nguyên trong khai báo (10 HĐND, 17 MTTQ), chỉ gắn cờ ẩn');
  ok(r2('cityOfficeList("HDND").some(function(c){return c.id==="hdnd-kt-ns"})') && !r2('cityOfficeList("HDND").some(function(c){return c.ef})'), 'tài khoản Ban cũ vẫn có trong cây tổ chức; đơn vị eform không phải phòng/ban');
  ok(r2('categorySeed.DANG.find(function(c){return c.id==="dang-to-chuc"}).itemsCu.length') > 0, 'chỉ tiêu cũ của Ban Tổ chức giữ ở itemsCu');
  ok(UNITS.every((u) => ids(S[u].role).indexOf(u) >= 0), 'mọi đơn vị eform có thẻ trong lưới của trục');
}

console.log('== Theo 126 xã, phường: bảng xếp hạng, hồ sơ xã — số lấy từ bản ghi eform');
{
  run('CTM_UI.gran="quy"');
  const XU = UNITS.filter((u) => S[u].xa);
  ok(['dang-ubkt', 'dang-to-chuc', 'dang-tuyen-giao', 'dang-noi-chinh', 'mttq-ef3', 'mttq-ef4', 'mttq-ef5', 'mttq-ef6', 'ubnd-vpubnd'].every((u) => XU.indexOf(u) >= 0), 'các đơn vị có eform ghi xã, phường đều có màn 126 xã (' + XU.join(', ') + ')');
  ok(UNITS.filter((u) => /^hdnd-|mttq-ef[12]$/.test(u)).every((u) => !S[u].xa), 'eform không có trường xã, phường thì không có màn 126 xã');
  /* kỳ có bản ghi của eform: thử Quý, rồi Năm (eform báo cáo theo năm) */
  const kyCo = (s, e) => { for (const gr of ['quy', 'nam']) { run('CTM_UI.gran=' + JSON.stringify(gr)); const x = s.periods.find((q) => run('efPick')(CFG[e], q.id).used.length); if (x) return x.id; } run('CTM_UI.gran="quy"'); return s.periods[0].id; };
  XU.forEach((u) => {
    const s = S[u];
    s.xa.inds.forEach((I) => {
      const p = kyCo(s, I.ef);
      run('CTM_UI.id=' + JSON.stringify(u) + ';CTM_UI.period=' + JSON.stringify(p) + ';CTM_UI.xa.ind=' + JSON.stringify(I.id) + ';CTM_UI.xa.sel=null;CTM_UI.screen="xa";');
      const rows = run('ctmXaRows(CTM_SPECS[' + JSON.stringify(u) + '],' + JSON.stringify(p) + ')');
      ok(rows.length === 126 && !Object.keys(rows.miss).length, u + ' · ' + I.id + ': 126 xã, mọi bản ghi khớp tên xã');
      const loai = CFG[I.ef].chi[I.id.slice(I.ef.length + 1)].loai;
      if (I.tot && loai !== 'demkhac') { const vs = rows.map((r) => I.v(r)).filter((v) => v != null), sum = vs.length ? vs.reduce((a0, b0) => a0 + b0, 0) : null, g = run('ctmD')(s, p)[I.id]; ok(sum == null ? g == null : Math.abs(sum - g) < 0.01, u + ' · ' + I.id + ': cộng 126 xã = số của nhóm (' + sum + ' / ' + g + ')'); }
      const h = run('ctmScreenHtml(CTM_SPECS[' + JSON.stringify(u) + '])');
      ok(/Bản ghi/.test(h) && !/Dân số/.test(h) && !/NaN|undefined/.test(h), u + ' · ' + I.id + ': màn 126 xã dựng được, không có cột Dân số');
    });
    /* hồ sơ một xã: các nút "Xem N bản ghi" mở đúng bản ghi của xã đó */
    const I = s.xa.inds[0], p = kyCo(s, I.ef);
    run('CTM_UI.id=' + JSON.stringify(u) + ';CTM_UI.period=' + JSON.stringify(p) + ';');
    const r = run('ctmXaRows(CTM_SPECS[' + JSON.stringify(u) + '],' + JSON.stringify(p) + ')').find((x) => x.n[I.ef]);
    run('CTM_UI.xa.ind=' + JSON.stringify(I.id) + ';CTM_UI.screen="xa";ctmScreenHtml(CTM_SPECS[' + JSON.stringify(u) + ']);CTM_UI.xa.sel=' + JSON.stringify(r.u.name) + ';');
    const hd = run('ctmScreenHtml(CTM_SPECS[' + JSON.stringify(u) + '])');
    const k = unesc(hd).match(/ctmRec\(("[^"]*(?:\\.[^"]*)*")\)/);
    ok(!!k && !/Diện tích/.test(hd), u + ': hồ sơ ' + r.u.name + ' có nút xem bản ghi, không ghi diện tích, dân số');
    if (k) { const hr = screen(u, 'rec', p, 'CTM_UI.rec={f:"all",q:"",key:' + k[1] + ',ef:null};'); ok(trs(hr, 'ctm-rect').length === Math.min(500, r.n[run('efParseKey')(JSON.parse(k[1])).ef]), u + ': bấm → đúng ' + r.n[I.ef] + ' bản ghi của ' + r.u.name); }
  });
  run('CTM_UI.gran="quy"');
  /* màn nhóm có thẻ so sánh kỳ, biểu đồ qua các kỳ, top xã như khuôn cũ */
  const hg = screen('dang-to-chuc', 'group', '2026Q2', 'CTM_UI.group="dang5";Object.keys(EF_FULL).forEach(function(k){delete EF_FULL[k]});');
  ok(/stc-lg/.test(hg) && /Xem đủ 126 xã, phường/.test(hg) && /Xem đủ \d+ dòng/.test(hg), 'màn nhóm Biến động Đảng viên: thẻ so sánh kỳ, top xã, bảng thu gọn có "Xem đủ"');
}

console.log('== Kỳ chưa có bản ghi: nói rõ, chỉ kỳ gần nhất có số');
{
  run('CTM_UI.gran="quy"');
  ok(run('efPick')(CFG.dang2, '2026Q3').used.length > 0 && run('efPick')(CFG.dang2, '2025').used.length > 0, 'dang2: có bản ghi quý 2026 và bản năm 2025');
  const h = screen('dang-to-chuc', 'group', '2025Q2', 'CTM_UI.group="dang2";');
  ok(/Kỳ này chưa có bản ghi/.test(h) && /efGoKy\(/.test(h) && !/stc-lg/.test(h), 'dang2 Quý 2/2025 (chưa có bản ghi): báo trống, có nút sang kỳ có số, không vẽ thẻ rỗng');
  run('efGoKy("nam","2025")');
  ok(run('CTM_UI.gran') === 'nam' && run('CTM_UI.period') === '2025', 'bấm nút → chuyển sang Năm 2025');
  run('CTM_UI.gran="quy"');
}

console.log('== Màn ngoài các trục');
{
  const cats = (roles) => { const c2 = []; return c2; };
  ['DANG', 'HDND', 'MTTQ'].forEach((r) => { const ov = run('ctmOverviewFor')([r]); ok(ov && /-ef$/.test(ov.id), r + ': dùng màn ngoài theo eform (' + (ov && ov.id) + ')'); });
  const all = run('ctmOverviewFor')(['DANG', 'HDND', 'UBND', 'MTTQ']);
  ok(all && all.id === 'tu-all-ef', 'tab Tất cả: dùng màn ngoài theo eform');
  ok(run('CTM_OVERVIEWS').filter((c) => ['dang-tp', 'hdnd-tp', 'mttq-tp', 'tu-all'].indexOf(c.id) >= 0).every((c) => c.enabled === false), 'màn ngoài cũ tắt bằng cờ, không xóa');
  ok(['dang-tp-ef', 'hdnd-tp-ef', 'mttq-tp-ef', 'tu-all-ef'].every((id) => run('CTM_OVERVIEWS').find((c) => c.id === id).kpis.every((k) => k.line != null || (S[k.cat] && S[k.cat].metrics[k.m]))), 'ô số màn ngoài trỏ đúng chỉ tiêu eform');
  void cats;
}

console.log('== Tài khoản Ban HĐND: eform 4 lọc sẵn «Đơn vị thực hiện» = Ban của mình, bỏ lọc được');
{
  run('CTM_UI.gran="quy";var currentRole=null,currentOfficeId=null;var categorySeed={HDND:[{id:"hdnd-kt-ns",name:"Ban Kinh tế - Ngân sách"},{id:"hdnd-khcn-mt",name:"Ban Khoa học Công nghệ và Môi trường"}]};');
  const pid = run('EF_KY.quy').map((p) => p.id).find((p) => run('efPick')(CFG.hdnd4, p).used.length >= 5);
  const used = () => run('efPick')(CFG.hdnd4, pid).used;
  const hd = () => run('ctmD(CTM_SPECS["hdnd-ef4"],' + JSON.stringify(pid) + ')').hdnd4_hd;
  const open = (id) => run('CTM_UI.open=true;CTM_UI.id=' + JSON.stringify(id) + ';');
  open('hdnd-ef4');
  const nAll = used().length, hAll = hd(), banTk = used().filter((R) => R.don_vi_thuc_hien === 'ban_kinh_te_ngan_sach').length;
  ok(nAll > banTk && banTk > 0, 'bản ghi mẫu ' + pid + ' có cả Ban Kinh tế - Ngân sách và đơn vị khác (' + banTk + '/' + nAll + ')');
  ok(!/lọc sẵn/.test(screen('hdnd-ef4', 'home', pid)), 'tài khoản trục HĐND (không phải Ban): không lọc');
  run('currentRole="HDND";currentOfficeId="hdnd-kt-ns";');
  ok(used().length === banTk && used().every((R) => R.don_vi_thuc_hien === 'ban_kinh_te_ngan_sach'), 'Ban Kinh tế - Ngân sách: chỉ còn bản ghi của Ban');
  ok(hd() === banTk && hAll === nAll, 'số hoạt động đổi theo bộ lọc, không lấy nhầm số cả trục từ bộ nhớ đệm (' + hd() + ' / ' + hAll + ')');
  const hh = unesc(screen('hdnd-ef4', 'home', pid));
  ok(/Tài khoản Ban Kinh tế - Ngân sách: đang lọc sẵn «Đơn vị thực hiện» = Ban Kinh tế - Ngân sách/.test(hh) && /Bỏ lọc/.test(hh), 'màn đơn vị ghi rõ đang lọc theo tài khoản, có nút bỏ lọc');
  const hr = screen('hdnd-ef4', 'rec', pid, 'CTM_UI.rec={f:"all",q:"",key:null};');
  const ci = ths(hr, 'ctm-rect').indexOf('Đơn vị thực hiện');
  const rows = trs(hr, 'ctm-rect').map((r) => unesc(((r.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [])[ci] || '').replace(/<[^>]*>/g, '')));
  ok(rows.length === banTk && rows.every((v) => v === 'Ban Kinh tế - Ngân sách') && /lọc sẵn theo tài khoản/.test(unesc(hr)), 'Dữ liệu đã nhập: chỉ bản ghi của Ban, ghi rõ lọc sẵn');
  run('efLocTat("hdnd-ef4|hdnd-kt-ns")');
  ok(used().length === nAll && hd() === hAll && /Lọc lại theo Ban Kinh tế - Ngân sách/.test(unesc(screen('hdnd-ef4', 'home', pid))), 'bỏ lọc → về đủ bản ghi, có nút lọc lại');
  run('efLocTat("hdnd-ef4|hdnd-kt-ns")');
  ok(used().length === banTk, 'lọc lại → về bản ghi của Ban');
  open('hdnd-tp-ef');
  ok(used().length === nAll, 'ngoài đơn vị eform 4 (màn ngoài trục, thẻ): vẫn là số cả trục');
  open('hdnd-ef1');
  ok(!/lọc sẵn/.test(screen('hdnd-ef1', 'home', pid)), 'eform khác của trục HĐND: không lọc');
  open('hdnd-ef4');
  run('currentOfficeId="hdnd-khcn-mt";');
  ok(used().length === nAll && /danh mục «Đơn vị thực hiện» của eform không có «Ban Khoa học Công nghệ và Môi trường»/.test(unesc(screen('hdnd-ef4', 'home', pid))), 'Ban KHCN và Môi trường (không có trong danh mục eform): không lọc, ghi rõ lý do');
  run('currentRole=null;currentOfficeId=null;CTM_UI.open=false;');
}

console.log('== Nút ← ở đầu màn quay lại đúng màn trước');
{
  const st = () => run('JSON.stringify({s:CTM_UI.screen,g:CTM_UI.group,sel:CTM_UI.xa.sel,key:CTM_UI.rec.key})');
  const head = () => unesc(run('ctmHeader(CTM_SPECS["dang-to-chuc"],"home")').replace(/<[^>]*>/g, ' '));
  run('CTM_UI.gran="quy";CTM_UI.id="dang-to-chuc";CTM_UI.period="2026Q3";CTM_HIST.length=0;CTM_UI.screen="home";');
  run('ctmGo("group","dang5")');
  ok(/← Tổng quan/.test(head()), 'màn nhóm mở từ Tổng quan: nút "← Tổng quan"');
  run('ctmRec(' + JSON.stringify(run('efKey')('dang5', [['dia_ban', 'Phường Cửa Nam']])) + ')');
  ok(/← Biến động Đảng viên/.test(head()) && /Tổng quan/.test(head()), 'Dữ liệu đã nhập mở từ màn nhóm: nút "← <tên nhóm>" và lối về Tổng quan');
  run('ctmRecF("bad")');
  ok(/← Biến động Đảng viên/.test(head()), 'lọc trong Dữ liệu đã nhập không thêm lịch sử');
  run('ctmBack()');
  ok(JSON.parse(st()).s === 'group' && JSON.parse(st()).g === 'dang5', 'bấm ← về đúng màn nhóm Biến động Đảng viên');
  run('ctmXa();ctmXaSel("Phường Cửa Nam");ctmRec(' + JSON.stringify(run('efKey')('dang5', [['dia_ban', 'Phường Cửa Nam']])) + ')');
  ok(/← Theo 126 xã, phường · Phường Cửa Nam/.test(head()), 'mở bản ghi từ hồ sơ xã: nút ghi "← Theo 126 xã, phường · Phường Cửa Nam"');
  run('ctmBack()');
  const s1 = JSON.parse(st());
  ok(s1.s === 'xa' && s1.sel === 'Phường Cửa Nam', 'bấm ← về màn 126 xã, hồ sơ Phường Cửa Nam vẫn mở');
  run('ctmBack()');
  ok(JSON.parse(st()).s === 'group', 'bấm ← lần nữa về màn nhóm');
  run('ctmGo("home")');
  ok(run('CTM_HIST.length') === 0, 'về Tổng quan thì xóa lịch sử');
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
