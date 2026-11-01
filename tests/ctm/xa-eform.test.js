'use strict';
/* Kiểm thử chỉ tiêu xã, phường theo 12 eform trên khung chung (ctm-eform.js + ctm-xa-eform.js, bản đọc docs/BAN_DOC_EFORM/XA_*, duyệt
   30/10/2026). Theo Phần V của quy ước 28/10/2026: Dữ liệu đã nhập đủ cột, đúng tên, đúng thứ tự; không có chỉ tiêu nào không gắn với trường
   eform; mọi số lần lại được bản ghi (ô số, dòng số liệu, thẻ so sánh, cột qua các kỳ); số đã nhập không bị thay; bản ghi lỗi được đánh dấu.
   Thêm: bố cục nhiều cấp (Tất cả nhóm + từng nhóm, thẻ so sánh, biểu đồ đặt trên bảng), kỳ xem Tháng / Quý / Năm từ 7/2025, X1, X2, X5.
   Chạy: node tests/ctm/xa-eform.test.js */
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
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ths = (h, cls) => { const t = h.split('class="stc-tbl ' + cls + '"')[1] || ''; return (t.split('</thead>')[0].match(/<th[^>]*>([\s\S]*?)<\/th>/g) || []).map((x) => unesc(x.replace(/<[^>]*>/g, ''))); };
const trs = (h, cls) => { const t = (h.split('class="stc-tbl ' + cls + '"')[1] || '').split('</tbody>')[0].split('<tbody>')[1] || ''; return t.split('</tr>').filter((x) => x.indexOf('<td') >= 0); };
const html = (id, scr, g, key) => run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.screen=' + JSON.stringify(scr) + ';CTM_UI.group=' + JSON.stringify(g || null) + ';CTM_UI.rec={f:"all",q:"",key:' + JSON.stringify(key || null) + ',ef:null};ctmScreenHtml(CTM_SPECS[CTM_UI.id])');
const EF = run('XA_EFORM'), EFK = run('EFK'), S = run('CTM_SPECS'), CFG = run('EF_CFG');
const XS = Object.keys(S).filter((k) => S[k].level === 'xa');
const XA_T = ['Phường Việt Hưng', 'Xã Ba Vì'];

console.log('== Khung eform: 12 eform của sheet XãPhường, đưa vào khung chung');
{
  ok(EF.length === 12, '12 eform (' + EF.length + ')');
  ok(EF.reduce((s, e) => s + e.fields.length, 0) === 188, '188 trường như file 30/10/2026 (' + EF.reduce((s, e) => s + e.fields.length, 0) + ')');
  ok(EF.every((e) => e.fields.every((f) => /^[A-Za-z0-9_]+$/.test(f.c))), 'mã trường đã chuẩn hóa (không dấu, không ký tự ẩn)');
  ok(EF.every((e) => e.fields.every((f) => (f.dm || []).every((o) => /^[A-Za-z0-9_%]+$/.test(o.v)))), 'mã danh mục đã chuẩn hóa');
  ok(EF.every((e) => EFK['xa_' + e.id] && EFK['xa_' + e.id].xa && EFK['xa_' + e.id].fields === e.fields), 'mỗi eform xã có trên khung chung (mã xa_…), cùng danh sách trường');
  ok(XS.length === 12 && XS.every((id) => S[id].efDonVi && S[id].eforms === undefined), '12 đơn vị cấp xã dựng bằng ctmEformDonVi (' + XS.length + ')');
  ok(EF.every((e) => Object.keys(CFG).indexOf('xa_' + e.id) >= 0), 'mỗi eform có cấu hình theo bản đọc');
}

console.log('== Không có chỉ tiêu nào ngoài trường eform; chia nhóm theo danh mục của eform');
Object.keys(CFG).filter((k) => /^xa_/.test(k)).forEach((efId) => {
  const cfg = CFG[efId], F = EFK[efId].F, tag = efId;
  const fieldsOf = (m) => [].concat(m.c || [], Object.keys(m.loc || {}), Object.keys(m.td || {}), Object.keys(m.dau || {}), m.theo || []);
  ok(Object.keys(cfg.chi).every((id) => fieldsOf(cfg.chi[id]).every((c) => F[c])), tag + ': mọi chỉ tiêu chỉ dùng trường của eform');
  ok(Object.keys(cfg.chi).every((id) => { const m = cfg.chi[id]; return Object.keys(m.loc || {}).every((c) => !(F[c].dm || []).length || m.loc[c].every((v) => v === null || (F[c].dm || []).some((o) => o.v === v))); }), tag + ': điều kiện lọc chỉ dùng mã có trong danh mục');
  ok((cfg.khoa || []).concat(cfg.cap || [], cfg.dong ? cfg.dong.theo : [], cfg.dvt ? [cfg.dvt] : []).every((c) => F[c]), tag + ': khóa, chia cấp, dòng số liệu chỉ dùng trường của eform');
  ok(F[cfg.tach] && F[cfg.tach].t === 'dm' && F[cfg.tach].dm.length > 0, tag + ': chia nhóm theo một trường danh mục của eform (' + cfg.tach + ')');
  ok(Object.keys(cfg.chi).every((id) => /^(dem|demdk|dembang|demkhac|demkhoa|cong|td|dau|motlan|nhap|tyle|hieu|tang|thuong|bqts|congtich|tuy)$/.test(cfg.chi[id].loai)), tag + ': mọi chỉ tiêu thuộc các cách tính của khung chung');
  ok(Object.keys(cfg.chi).filter((id) => /^(tyle|hieu|tang|thuong)$/.test(cfg.chi[id].loai)).every((id) => /IOC tính/.test(cfg.chi[id].l)), tag + ': số IOC tính ghi rõ "IOC tính"');
});

/* Ô số đúng bản đọc (E1, bổ sung 02/11/2026): mỗi đơn vị, mỗi màn ngoài đúng danh sách — thừa hay thiếu đều sai */
const XA_KPI = { 'dangxa-eform': ['dong'], 'hdndxa-eform': ['gs', 'kh', 'tx', 'dong'], 'ubndxa-hcc': ['tuyen', 'tt', 'bcci', 'dh', 'qh', 'cdh', 'dqh', 'ktn'],
  'ubndxa-tcns': ['thu', 'chi', 'tlThu', 'tlChi', 'dn', 'htx'], 'ubndxa-qlvb': ['den', 'di', 'chuaXl', 'dangXl', 'hoanTat'], 'ubndxa-gpmb': ['da', 'phai', 'dt', 'tlTh', 'ho', 'bg', 'tlBg', 'kpCt'],
  'ubndxa-gd': ['hs', 'dong'], 'ubndxa-yte': ['dong'], 'ubndxa-vh': ['ng', 'kp', 'dong'], 'ubndxa-nv': ['dong', 'tlTh', 'tlTra', 'phien', 'luot'], 'ubndxa-ktxh': ['n'],
  'mttqxa-eform': ['doanvien', 'giamsat', 'phanbien', 'hienmau', 'mohinh', 'tongthu', 'tongchi', 'tonquy'] };
/* CHUNG-3 */
const XA_OV_KPI = { 'xa-DANG': ['xa_dang_dong'], 'xa-HDND': ['xa_hdnd_dong'], 'xa-MTTQ': ['xa_mttq_doanvien'],
  'xa-UBND': ['xa_hcc_tuyen', 'xa_hcc_dh', 'xa_hcc_dqh', 'xa_qlvb_den', 'xa_qlvb_di', 'xa_gpmb_dt', 'xa_gpmb_bg', 'xa_tcns_thu', 'xa_tcns_chi', 'xa_gd_dong', 'xa_yte_dong', 'xa_vh_dong', 'xa_nv_dong', 'xa_ktxh_n'] };
XA_OV_KPI['xa-4truc'] = XA_OV_KPI['xa-UBND'].concat(XA_OV_KPI['xa-MTTQ'], XA_OV_KPI['xa-DANG'], XA_OV_KPI['xa-HDND']);
/* X7: bản ghi tạo ra một ô số phải giống nhau ở mọi trường mô tả của dòng số liệu, trừ các trường bản đọc cho cộng (VD «Đơn vị» — HCC-4) */
const XA_DUOC_KHAC = { 'ubndxa-hcc': ['don_vi'], 'ubndxa-tcns': ['ten_chi_tieu'], 'ubndxa-qlvb': ['ten_can_bo_phong'], 'ubndxa-gpmb': ['ma_du_an', 'ten_du_an_khu_vuc_GPMB', 'loai_dong'],
  'ubndxa-gd': ['bac_hoc_loai_hinh_giao_duc', 'ten_chi_tieu'], 'ubndxa-nv': ['ten_chi_tieu'], 'mttqxa-eform': ['don_vi_doan_loai_hinh'], 'hdndxa-eform': ['ten_chi_tieu', 'du_an_dau_tu_cong'],
  'ubndxa-vh': '*' /* «Số người tham gia», «Kinh phí/Doanh thu»: bản đọc VH duyệt diễn biến tổng qua các kỳ */ };
console.log('== Ô số đúng bản đọc; màn ngoài đúng câu CHUNG-3');
XS.forEach((id) => {
  const ef = S[id].groups[0].id.split(':')[0];
  ok(JSON.stringify(S[id].kpis.map((k) => k.m)) === JSON.stringify(XA_KPI[id].map((m) => ef + '_' + m)), id + ': ô số đúng danh sách bản đọc (' + S[id].kpis.map((k) => k.m.slice(ef.length + 1)).join(', ') + ')');
});
Object.keys(XA_OV_KPI).forEach((oid) => { const c = run('CTM_OVERVIEWS').find((x) => x.id === oid); ok(c && JSON.stringify(c.kpis.map((k) => k.m)) === JSON.stringify(XA_OV_KPI[oid]), oid + ': ô số màn ngoài đúng câu CHUNG-3'); });

XA_T.forEach((xa) => {
  setXa(xa);
  const u = run('ctmCurrentXaUnit()');
  console.log('== ' + xa);
  XS.forEach((id) => {
    const s = S[id], efId = s.groups[0].id.split(':')[0], ef = EFK[efId], cfg = CFG[efId], tag = id + ' [' + xa + ']';
    run('CTM_UI.id=' + JSON.stringify(id) + ';CTM_UI.gran="quy";CTM_UI.period=null');
    /* bản ghi mẫu: chỉ trường của eform, danh mục đúng mã, đúng kiểu */
    const src = run('XA_EF_NGUON')(ef.goc, u);
    ok(src.length > 0, tag + ': có bản ghi mẫu (' + src.length + ')');
    ok(src.every((R) => Object.keys(R).every((c) => ef.F[c])), tag + ': bản ghi mẫu không có trường ngoài eform');
    ok(src.every((R) => ef.fields.every((f) => R[f.c] == null || f.t !== 'dm' || !f.dm.length || f.dm.some((o) => o.v === R[f.c]))), tag + ': ô danh mục chỉ có mã trong danh mục');
    ok(src.every((R) => ef.fields.every((f) => R[f.c] == null || f.t !== 'so' || typeof R[f.c] === 'number')), tag + ': ô Số là số');
    /* kỳ xem Tháng / Quý / Năm từ tháng 7/2025 */
    ['thang', 'quy', 'nam'].forEach((g) => { run('CTM_UI.gran=' + JSON.stringify(g)); const P = s.periods; ok(P.length && P[P.length - 1].id === { thang: '2025-07', quy: '2025Q3', nam: '2025' }[g], tag + ': kỳ ' + g + ' bắt đầu từ ' + P[P.length - 1].id); });
    run('CTM_UI.gran="quy";CTM_UI.period=null');
    /* Dữ liệu đã nhập: đủ trường, đúng tên, đúng thứ tự; danh mục hiện tên hiển thị */
    const hr = html(id, 'rec');
    ok(JSON.stringify(ths(hr, 'ctm-rect')) === JSON.stringify(['STT'].concat(ef.fields.map((f) => f.l))), tag + ': Dữ liệu đã nhập đủ ' + ef.fields.length + ' cột, đúng tên, đúng thứ tự');
    ok(trs(hr, 'ctm-rect').length > 0, tag + ': Dữ liệu đã nhập có bản ghi của kỳ đang xem');
    ok(!/>(quy|thang|nam|quy_i|quy_ii|quy_iii|quy_iv)</.test(hr), tag + ': ô danh mục kỳ hiện tên hiển thị, không hiện mã');
    ok(/bản ghi mẫu/i.test(hr), tag + ': ghi rõ đang là bản ghi mẫu');
    /* X1: bản gửi lại cùng khóa được đánh dấu, không dùng ở phần tổng hợp */
    const all = run('efAll(' + JSON.stringify(efId) + ')');
    ok(all.some((R) => R._thay), tag + ': có bản trùng khóa bị bản gửi sau thay (X1)');
    /* X2: bản quý trùng các bản tháng không cộng chồng */
    if (all.some((R) => R.ky_bao_cao === 'quy') && all.some((R) => R.ky_bao_cao === 'thang')) {
      const P = run('efPick')(cfg, '2026Q1');
      ok(P.used.every((R) => R._ky.loai === 'thang') && P.cand.some((R) => R._x2), tag + ': Quý 1/2026 dùng bản tháng, bản quý trùng khóa không cộng chồng (X2)');
    }
    /* ô số: có số thì bấm mở được các bản ghi tạo ra số */
    const n = run('ctmNP')(s);
    s.kpis.forEach((k) => {
      const v = n.D[k.m], key = /^rec:/.test(k.target) ? k.target.slice(4) : null;
      ok(!!key, tag + ' › ô «' + s.metrics[k.m].l + '»: bấm mở thẳng bản ghi (E4)');
      if (key && v != null) ok(trs(html(id, 'rec', null, key), 'ctm-rect').length > 0, tag + ' › ô «' + s.metrics[k.m].l + '» = ' + v + ': mở được bản ghi tạo ra số');
    });
    /* X7: ô số không cộng các chỉ tiêu, tình trạng, đơn vị tính khác nhau */
    const P0 = run('efPick')(cfg, n.p), mo = (cfg.dong ? cfg.dong.theo : cfg.khoa).filter((c) => c !== 'dia_ban'), dk = XA_DUOC_KHAC[id] || [];
    if (dk !== '*') s.kpis.forEach((k) => {
      const cid = k.m.slice(efId.length + 1), m = cfg.chi[cid];
      if (/^(tyle|hieu|tang|thuong|dem|demkhoa|demkhac|dembang|demdk)$/.test(m.loai)) return;
      const rs = run('efRecsOf')(cfg, P0.used, cid), khac = mo.filter((c) => dk.indexOf(c) < 0 && new Set(rs.map((R) => (R[c] == null ? '' : String(R[c])))).size > 1);
      ok(!khac.length, tag + ' › ô «' + m.l + '»: không cộng các bản ghi khác nhau ở ' + (khac.join(', ') || 'trường mô tả'));
    });
    /* X7 cho biểu đồ: mỗi cột / thanh / kỳ không cộng các bản ghi khác nhau ở trường mô tả (trừ trường bản đọc cho cộng; cột theo trường «theo» thì trường đó được khác) */
    if (dk !== '*') {
      const nhs = [null].concat(ef.F[cfg.tach].dm.map((o) => o.v)), viec = [];
      (cfg.bieu || []).forEach((b) => nhs.forEach((nv) => {
        if (b.loai === 'dong' || (nv == null ? b.chiNhom : b.theo === cfg.tach || (b.nhom && b.nhom.indexOf(nv) < 0))) return;
        const rs0 = P0.used.filter((R) => nv == null || R[cfg.tach] === nv);
        (b.ms || [b.m]).forEach((cid) => {
          const m = cfg.chi[cid];
          if (!m || /^(tyle|hieu|tang|thuong|dem|demkhoa|demkhac|dembang|demdk)$/.test(m.loai)) return;
          const parts = b.theo ? [...new Set(rs0.map((R) => R[b.theo]))].map((v) => rs0.filter((R) => R[b.theo] === v)) : [rs0];
          parts.forEach((rs1) => { const rs = run('efRecsOf')(cfg, rs1, cid), khac = mo.filter((c) => c !== b.theo && dk.indexOf(c) < 0 && new Set(rs.map((R) => (R[c] == null ? '' : String(R[c])))).size > 1); if (khac.length) viec.push('«' + b.t + '» (' + (nv || 'Tất cả nhóm') + '): ' + khac.join(', ')); });
        });
      }));
      ok(!viec.length, tag + ': biểu đồ không cộng các chỉ tiêu khác nhau' + (viec.length ? ' — ' + [...new Set(viec)].slice(0, 3).join('; ') : ''));
    }
    /* màn nhóm: Tất cả nhóm + mỗi mã của trường chia nhóm; thẻ so sánh và biểu đồ đặt trên bảng; dòng số liệu lần lại được bản ghi */
    ok(s.groups.length === ef.F[cfg.tach].dm.length + 1 && s.groups[0].label === 'Tất cả nhóm', tag + ': màn «Tất cả nhóm» và ' + ef.F[cfg.tach].dm.length + ' màn nhóm');
    let soNhom = 0;
    s.groups.forEach((g) => {
      const gh = html(id, 'group', g.id), t = gh.replace(/<[^>]*>/g, ' ');
      ok(!/undefined|NaN/.test(t), tag + ' › ' + g.label + ': không có undefined/NaN');
      if (/chưa có bản ghi nào/.test(gh)) { ok(/Kỳ gần nhất có bản ghi|chưa có bản ghi nào\./.test(gh), tag + ' › ' + g.label + ': kỳ trống báo rõ'); return; }
      soNhom++;
      const tb = gh.indexOf('ctm-eft'), ch = gh.search(/stc-cmp|sgd-rt|sgd-cc|ef-barbtn|stc-pg/);
      ok(tb > 0 && ch > 0 && ch < tb, tag + ' › ' + g.label + ': có biểu đồ, đặt trên bảng');
      ok(gh.indexOf('data-rec=') >= 0 || gh.indexOf('ef-barbtn') >= 0, tag + ' › ' + g.label + ': thẻ, thanh bấm được ra bản ghi');
      /* G6, X7: dòng Cộng của bảng không cộng «Giá trị» của các chỉ tiêu khác nhau */
      const iM = (cfg.cot || []).findIndex((cid) => cfg.chi[cid].motDong), tot = (gh.split('<tr class="tot">')[1] || '').split('</tr>')[0], tds = tot.match(/<td>([\s\S]*?)<\/td>/g) || [];
      const leaf = trs(gh, 'ctm-eft ef-tree').filter((x) => x.indexOf('class="tot"') < 0).length;
      if (iM >= 0 && tds.length && leaf > 2) ok(/—/.test(tds[iM + 1] || ''), tag + ' › ' + g.label + ': dòng Cộng không cộng «' + cfg.chi[cfg.cot[iM]].l + '» của các chỉ tiêu khác nhau');
      const L = run('ctmGLines')(g, n);
      ok(L.every((k) => s.metrics[k]), tag + ' › ' + g.label + ': dòng thẻ nhóm có khai báo');
      L.filter((k) => s.metrics[k].rec && n.D[k] != null).slice(0, 2).forEach((k) => ok(trs(html(id, 'rec', null, s.metrics[k].rec), 'ctm-rect').length > 0, tag + ' › ' + g.label + ' › «' + s.metrics[k].l + '»: mở được bản ghi'));
    });
    ok(soNhom > 1, tag + ': có ít nhất 2 màn nhóm có số (' + soNhom + ')');
    /* số đã nhập là số hiện: dòng số liệu một bản ghi «nhap» hiện đúng số đã nhập */
    Object.keys(cfg.chi).filter((cid) => cfg.chi[cid].loai === 'nhap').forEach((cid) => {
      const P = run('efPick')(cfg, n.p), R = P.used.find((x) => typeof x[cfg.chi[cid].c] === 'number');
      if (R) ok(run('efVals')(cfg, [R])[cid] === R[cfg.chi[cid].c], tag + ' › «' + cfg.chi[cid].l + '»: hiện đúng số đã nhập');
    });
  });
  setXa(null);
});

console.log('== Tổng hợp cộng đúng bản ghi; bản ghi lỗi được tô màu; mã có dấu, ký tự ẩn vẫn đọc được; chữ gộp theo G8');
{
  setXa('Phường Việt Hưng');
  run('var __src=XA_EF_NGUON;');
  const base = { dia_ban: 'MTTQ phường Việt Hưng', ky_bao_cao: 'quy', nam: 2026, thang: null, quy: 'quy_ii', nhom_to_chuc: 'mttq', don_vi_doan_loai_hinh: null, phan_loai_ket_qua: null, don_vi_tinh: 'người', ghi_chu: null };
  const recs = [
    Object.assign({}, base, { ten_chi_tieu: 'doanvien', gia_tri: 10, don_vi_doan_loai_hinh: 'Chi hội 1' }),
    Object.assign({}, base, { ten_chi_tieu: 'doanvien', gia_tri: '1.234', don_vi_doan_loai_hinh: 'Chi hội 2' }),
    Object.assign({}, base, { ten_chi_tieu: 'khong_co_ma_nay', gia_tri: 5 }),
    Object.assign({}, base, { ten_chi_tieu: 'giamsat', gia_tri: 'mười', don_vi_tinh: 'Cuộc' }),
    Object.assign({}, base, { ten_chi_tieu: 'chitieuh​oi', gia_tri: 7 }),
    Object.assign({}, base, { ten_chi_tieu: 'tongthu', gia_tri: 3, don_vi_tinh: 'triệu  đồng' }),
    Object.assign({}, base, { ten_chi_tieu: 'tongthu', gia_tri: 4, don_vi_tinh: 'Triệu đồng', don_vi_doan_loai_hinh: 'Chi hội 2' })
  ];
  ctx.__T = recs;
  run('XA_EF_NGUON=function(ef,u){return ef==="mttq"?__T:__src(ef,u)};efReset();CTM_UI.gran="quy";CTM_UI.period="2026Q2"');
  const s = S['mttqxa-eform'], D = run('ctmD')(s, '2026Q2');
  ok(D.xa_mttq_doanvien === 1244, 'Đoàn viên = 10 + "1.234" (số dạng chữ đọc ra số) = 1244 (' + D.xa_mttq_doanvien + ')');
  ok(D.xa_mttq_tongthu === 7, 'chữ «Đơn vị tính» khác hoa thường, khoảng trắng vẫn gộp một dòng (G8): tổng thu = 7 (' + D.xa_mttq_tongthu + ')');
  const all = run('efAll("xa_mttq")'), bad = (R) => run('efBad')(CFG.xa_mttq, R, all);
  ok(bad(all[2]).ten_chi_tieu, 'mã ngoài danh mục được đánh dấu');
  ok(bad(all[3]).gia_tri, 'số không đọc được được đánh dấu');
  ok(all[4].ten_chi_tieu === 'chitieuhoi' && !bad(all[4]).ten_chi_tieu, 'mã có ký tự ẩn vẫn đọc đúng');
  const hr = html('mttqxa-eform', 'rec');
  ok(hr.indexOf('>triệu  đồng<') >= 0, 'Dữ liệu đã nhập hiện đúng chữ đã nhập (không đổi theo cách viết đã gộp)');
  ok((hr.match(/ctm-badrow/g) || []).length >= 2, 'bản ghi lỗi tô màu ở Dữ liệu đã nhập');
  run('XA_EF_NGUON=__src;efReset();CTM_UI.period=null');
  setXa(null);
}

console.log('== Màn ngoài tài khoản xã, phường');
{
  setXa('Phường Việt Hưng');
  const cats = [];
  ['DANG', 'HDND', 'UBND', 'MTTQ'].forEach((r) => XS.forEach((id) => { if (S[id].role === r) cats.push({ id: id, role: r, name: id, items: [] }); }));
  run('function categorySeedForRole(r){return ' + JSON.stringify(cats) + '.filter(function(c){return c.role===r})}');
  ['xa-4truc', 'xa-DANG', 'xa-HDND', 'xa-UBND', 'xa-MTTQ'].forEach((oid) => {
    const cfg = run('CTM_OVERVIEWS').find((c) => c.id === oid);
    const list = cats.filter((c) => cfg.roles.indexOf(c.role) >= 0);
    const h = run('ctmOverviewHtml')(cfg, list);
    ok((h.match(/class="uo-card"/g) || []).length === list.length, oid + ': đủ ' + list.length + ' thẻ eform');
    ok((h.match(/class="stc-kpi uo-kpi"/g) || []).length === cfg.kpis.length && !/>—</.test(h.split('uo-kpis')[1].split('</section>')[0]), oid + ': ' + cfg.kpis.length + ' ô số then chốt đều có số');
    ok(cfg.kpis.every((k) => /^rec:/.test(k.target)), oid + ': ô số mở thẳng bản ghi tạo ra số');
  });
  setXa(null);
}

console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
process.exit(fail ? 1 : 0);
