/* Dựng trang ĐỘC LẬP cho chỉ tiêu cấp xã, phường — 4 trục Đảng ủy · HĐND · UBND · Ủy ban MTTQ, 4 tab (một file, mở thẳng
   bằng trình duyệt, không cần IOC). Ra 1 file: standalone/xa-phuong-chi-tieu-doc-lap.html
   Cách làm giống trang độc lập Thành ủy/HĐND/MTTQ (tools/dang-hdnd-mttq-build-doc-lap.js): nhúng nguyên CSS + JS gốc của khuôn
   chỉ tiêu mới cộng một khung tối thiểu.
   - Chọn 1 trong 126 xã, phường (ô chọn trên đầu trang); mỗi tab là màn ngoài như tài khoản xã, phường trong IOC xem trục đó.
   - Bấm thẻ / ô số: mở popup chi tiết khuôn mới (Tổng quan → nhóm → So với 126 xã, phường; chọn kỳ, xuất Excel).
   - Số khớp IOC: nhúng cả các đơn vị cấp Thành phố mà số xã lấy từ đó (ctm-dang/hdnd/mttq.js), số Trung tâm Phục vụ HCC
     (hcc-config.js, hcc-data.js + bảng gdUnitData của dashboard-education.js) và số Sở Y tế (syt-config.js).
   Danh sách đơn vị lấy từ DANG/HDND/UBND/MTTQ_XA_CATEGORIES trong js/core/central-level.js (chạy thử trong vm lúc dựng).
   Chạy lại mỗi khi sửa số liệu hoặc khuôn chỉ tiêu:   node tools/xa-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const P_HELPERS = 'function P(dim,items){return {dim,type:"bar",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nfunction S(dim,items){return {dim,type:"stat",items:items.map(x=>({label:x[0],value:x[1]}))};}';

/* 1. Khung CSS tối thiểu: phần đầu <style> của trang độc lập Sở Tài chính, trước khi bắt đầu css/stc.css */
const stc = read('standalone/stc-chi-tieu-doc-lap.html');
const s0 = stc.indexOf('<style>') + '<style>'.length;
const s1 = stc.indexOf('/* ============================== SỞ TÀI CHÍNH', s0);
if (s0 < 7 || s1 < 0) throw new Error('Không tìm thấy khung CSS trong stc-chi-tieu-doc-lap.html');
const frameCss = stc.slice(s0, s1).replace('bộ chỉ tiêu Sở Tài chính cần', 'bộ chỉ tiêu cần');

/* 2. Danh sách đơn vị 4 trục cấp xã: cắt từ "const DANG_XA_CATEGORIES" đến hết dòng XA_CATEGORIES_BY_ROLE rồi chạy trong vm */
const cl = read('js/core/central-level.js');
const x0 = cl.indexOf('const DANG_XA_CATEGORIES');
const x1 = cl.indexOf('const XA_CATEGORIES_BY_ROLE', x0);
const x2 = cl.indexOf('\n', x1);
if (x0 < 0 || x1 < 0) throw new Error('Không tìm thấy *_XA_CATEGORIES trong central-level.js');
const ctx = { console: console };
vm.createContext(ctx);
vm.runInContext(P_HELPERS + '\n' + cl.slice(x0, x2) + '\nthis.__seed = XA_CATEGORIES_BY_ROLE;', ctx);
const ROLES = [['DANG', 'Đảng ủy phường'], ['HDND', 'HĐND phường'], ['UBND', 'UBND phường'], ['MTTQ', 'Ủy ban MTTQ phường']];
const seed = {};
ROLES.forEach(([r]) => {
  const list = ctx.__seed[r];
  if (!list || list.length < 3) throw new Error('Danh sách đơn vị ' + r + ' bất thường');
  seed[r] = list.map((c) => ({ id: c.id, name: c.name, desc: c.desc, types: c.types || [], items: (c.items || []).map((it) => [it[0]]) }));
});

/* 3. Bảng 126 đơn vị của Sở GD&ĐT (gdUnitData) — Trung tâm Phục vụ HCC chia số theo quy mô này, cần đúng để số Một cửa khớp IOC */
const ed = read('js/features/dashboard-education.js');
const g0 = ed.indexOf('const gdUnitData=[');
const g1 = ed.indexOf('];', g0);
if (g0 < 0 || g1 < 0) throw new Error('Không tìm thấy gdUnitData trong dashboard-education.js');
const gctx = {};
vm.createContext(gctx);
vm.runInContext(ed.slice(g0, g1 + 2) + '\nthis.__gd = gdUnitData;', gctx);
if (gctx.__gd.length !== 126) throw new Error('gdUnitData không đủ 126 đơn vị');
const gdJs = 'const gdUnitData=' + JSON.stringify(gctx.__gd) + ';';

/* 4. Khung JS tối thiểu */
const KEY = 'xa-standalone';
const DEFAULT_XA = 'Phường Việt Hưng';
const frameJs = `/* ============================== KHUNG TỐI THIỂU (tự viết) ==============================
   Thay cho phần lõi của IOC mà khuôn chỉ tiêu mới cần: thoát HTML, popup #modal, thông báo nhỏ, danh sách đơn vị
   (CTM_SEED, dựng sẵn từ central-level.js), chọn xã/phường (currentXaId), chuyển tab trục và điều hướng khi bấm thẻ/ô số. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}
function unlockScroll(){document.body.style.overflow='';document.documentElement.style.overflow=''}
function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll()}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('overlay').classList.remove('show');unlockScroll();if(typeof CTM_UI!=='undefined')CTM_UI.open=false}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
/* Nút "Nhập chỉ tiêu" trên thanh công cụ các popup — chép từ js/core/modal-drawer-toast.js */
${read('js/core/modal-drawer-toast.js').split('\n').filter((l) => /^\s*(const INDICATOR_ENTRY_URL|function openIndicatorEntrySystem|function indicatorEntryBtnHtml)/.test(l)).map((l) => l.trim()).join('\n')}
${gdJs}
/* currentXaId: số thứ tự trong wardNames() (như login.js của IOC) — ở đây wardNames() là danh sách 126 xã, phường của ctm-xa.js */
let currentXaId=null;
function wardNames(){ return CTM_XA.map((u)=>u.name); }
const CTM_ROLES=${JSON.stringify(ROLES)};
const CTM_SEED=${JSON.stringify(seed)};
const STORE_KEY=${JSON.stringify(KEY)};
let currentRole=CTM_ROLES[0][0];
function categorySeedForRole(r){ return CTM_SEED[r] || []; }
function openCategoryDetail(role, catId, itemIndex){
  if(typeof ctmHandles==='function' && ctmHandles(catId)){ ctmOpenForm(catId, itemIndex, role); return; }
  const c = (CTM_SEED[role]||[]).find((x)=>x.id===catId);
  toast((c ? ctmXaLoc(c.name, ctmCtx()) : 'Đơn vị này') + ' hiện chưa có chỉ tiêu được giao.');
}
function xaRn(s){ return ctmXaLoc(s, ctmCtx()); }
function renderTabs(){
  const bar = document.getElementById('axTabs');
  if(!bar) return;
  bar.innerHTML = CTM_ROLES.map(([r,l])=>'<button type="button" role="tab" aria-selected="'+(r===currentRole)+'" class="stc-tab'+(r===currentRole?' on':'')+'" onclick="pickRole(\\''+r+'\\')">'+esc(xaRn(l))+' <span class="stc-cnt">'+CTM_SEED[r].length+'</span></button>').join('');
}
function renderHead(){
  const u = ctmCurrentXaUnit();
  document.getElementById('xaH1').textContent = 'Nhóm chỉ tiêu theo lĩnh vực · ' + (u ? u.name : 'xã, phường');
  document.title = 'Chỉ tiêu ' + (u ? u.name : 'xã, phường') + ' — IOC Hà Nội';
  document.getElementById('uoSearch').placeholder = 'Tìm đơn vị trong ' + (u && u.k === 'X' ? 'xã' : 'phường') + '...';
}
function pickRole(r){
  if(!CTM_SEED[r]) return;
  currentRole=r; renderTabs();
  try{ localStorage.setItem(STORE_KEY+'-role', r); }catch(e){}
  renderCategoryGrid();
}
function pickXa(i){
  i = Number(i);
  if(!(i >= 0 && i < CTM_XA.length)) return;
  currentXaId = i;
  try{ localStorage.setItem(STORE_KEY+'-xa', CTM_XA[i].name); }catch(e){}
  const sel = document.getElementById('xaPick'); if(sel) sel.value = String(i);
  renderHead(); renderTabs(); renderCategoryGrid();
}
function renderXaPick(){
  const opt = (k, lab) => '<optgroup label="'+lab+'">' + CTM_XA.map((u,i)=>[u,i]).filter(([u])=>u.k===k).sort((a,b)=>a[0].short.localeCompare(b[0].short,'vi')).map(([u,i])=>'<option value="'+i+'">'+esc(u.name)+'</option>').join('') + '</optgroup>';
  const n = (k) => CTM_XA.filter((u)=>u.k===k).length;
  document.getElementById('xaPick').innerHTML = opt('P', n('P')+' phường') + opt('X', n('X')+' xã');
}
function renderCategoryGrid(){
  const q = (document.getElementById('uoSearch').value || '').toLowerCase();
  const list = CTM_SEED[currentRole].map((c)=>Object.assign({}, c, {role:currentRole})).filter((c)=>!q || xaRn(c.name).toLowerCase().includes(q));
  const cfg = ctmOverviewFor([currentRole]);
  document.getElementById('uoOuterGrid').innerHTML = cfg ? ctmOverviewHtml(cfg, list) : '<div class="access-lock">Chưa có màn tổng quan cho trục này.</div>';
}
const renderIndicators = renderCategoryGrid;
function uoSetThemeStandalone(t){
  document.documentElement.classList.remove('theme-light','theme-green');
  if(t==='light'||t==='green') document.documentElement.classList.add('theme-'+t);
  try{ localStorage.setItem(STORE_KEY+'-theme', t); }catch(e){}
  document.querySelectorAll('.stc-theme-sw button').forEach((b)=>b.classList.toggle('on', b.dataset.theme===t));
}
document.addEventListener('DOMContentLoaded', () => {
  let saved = 'dark', role = currentRole, xa = ${JSON.stringify(DEFAULT_XA)};
  try{ saved = localStorage.getItem(STORE_KEY+'-theme') || 'dark'; role = localStorage.getItem(STORE_KEY+'-role') || role; xa = localStorage.getItem(STORE_KEY+'-xa') || xa; }catch(e){}
  const h = (location.hash || '').slice(1).toUpperCase();
  if(CTM_SEED[h]) role = h;
  if(!CTM_SEED[role]) role = CTM_ROLES[0][0];
  let xi = CTM_XA.findIndex((u)=>u.name===xa);
  if(xi < 0) xi = CTM_XA.findIndex((u)=>u.name===${JSON.stringify(DEFAULT_XA)});
  uoSetThemeStandalone(saved);
  renderXaPick();
  currentRole = role;
  pickXa(Math.max(0, xi));
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const extraCss = `
/* ===== Trang độc lập: ô chọn xã/phường, ô tìm đơn vị, thanh tab trục ===== */
.uo-search{height:34px;width:240px;max-width:60vw;border-radius:10px;border:1px solid rgba(87,178,255,.3);background:rgba(6,28,52,.6);color:#eaf4ff;padding:0 12px;font:inherit;font-size:13px}
.xa-pick{width:220px;cursor:pointer;font-weight:600}
.xa-pick option,.xa-pick optgroup{background:#0b2240;color:#eaf4ff}
html.theme-light .uo-search,html.theme-green .uo-search{background:#fff;border-color:#D5DAE3;color:#111827}
html.theme-light .xa-pick option,html.theme-light .xa-pick optgroup,html.theme-green .xa-pick option,html.theme-green .xa-pick optgroup{background:#fff;color:#111827}
.uo-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.dhm-tabbar.stc-root{background:transparent;overflow:visible;margin-bottom:14px}
.dhm-tabbar .stc-tabs{margin-bottom:0;overflow-x:auto}
.dhm-tabbar .stc-tab{white-space:nowrap;cursor:pointer}
.field-category-grid>.uo-root{min-width:0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media(max-width:900px){.field-category-grid{grid-template-columns:minmax(0,1fr)}}
@media(max-width:600px){.stc-page{padding:18px 16px 40px}.uo-tools,.uo-tools>label{width:100%}.uo-search,.xa-pick{width:100%;max-width:none}.uo-grid{grid-template-columns:minmax(0,1fr)}}
`;
const css = frameCss + part('css/stc.css') + part('css/sgd.css') + part('css/ubnd-overview.css') + part('css/ctm.css') + extraCss;
/* Thứ tự như demo_ioc.html: số Sở Y tế, HCC trước; rồi khuôn chỉ tiêu mới; đơn vị cấp Thành phố trước đơn vị cấp xã */
const ctmJsSrc = part('js/core/xa-dan-so.js') + part('js/core/syt-config.js') + part('js/core/hcc-config.js') + part('js/features/hcc-data.js') +
  part('js/core/line-chart.js') + part('js/core/ctm-xa.js') + part('js/features/ctm-engine.js') +
  part('js/features/ctm-mttq.js') + part('js/features/ctm-dang.js') + part('js/features/ctm-hdnd.js') + part('js/features/ctm-xa-units.js');
if (/<\/script/i.test(ctmJsSrc) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chỉ tiêu xã, phường — IOC Hà Nội</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/xa-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- ExcelJS: nút "Xuất Excel" trong popup chi tiết -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<style>${css}
</style>
</head>
<body>
<div class="stc-page">
  <div class="stc-page-head">
    <div>
      <h1 id="xaH1">Nhóm chỉ tiêu theo lĩnh vực · xã, phường</h1>
      <p>Trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) Hà Nội · 126 xã, phường · số liệu mô phỏng theo dân số, diện tích thật, đối chiếu số công bố</p>
    </div>
    <div class="uo-tools">
      <label><span class="sr-only">Chọn xã, phường</span><select id="xaPick" class="uo-search xa-pick" onchange="pickXa(this.value)"></select></label>
      <label><span class="sr-only">Tìm đơn vị</span><input id="uoSearch" class="uo-search" type="search" placeholder="Tìm đơn vị..." oninput="renderCategoryGrid()"></label>
      <div class="stc-theme-sw" role="group" aria-label="Chọn giao diện">
        <button type="button" data-theme="dark" onclick="uoSetThemeStandalone('dark')">Tối</button>
        <button type="button" data-theme="light" onclick="uoSetThemeStandalone('light')">Sáng</button>
        <button type="button" data-theme="green" onclick="uoSetThemeStandalone('green')">Xanh lá</button>
      </div>
    </div>
  </div>
  <div class="stc-root dhm-tabbar"><div class="stc-tabs" id="axTabs" role="tablist" aria-label="Chọn trục"></div></div>
  <div class="field-category-grid" id="uoOuterGrid"></div>
</div>

<div id="overlay" class="overlay" onclick="closeModal()"></div>
<section id="modal" class="modal">
  <div class="modal-head"><div><h3 id="modalTitle">Chi tiết</h3><div class="muted" id="modalSub"></div></div><button class="close" onclick="closeModal()">×</button></div>
  <div class="modal-body" id="modalBody"></div>
</section>
<div class="toast" id="toast"></div>

<script>
${frameJs}
${ctmJsSrc}
</script>
</body>
</html>
`;
const OUT = 'xa-phuong-chi-tieu-doc-lap.html';
fs.writeFileSync(path.join(root, 'standalone', OUT), html, 'utf8');
console.log('Đã dựng ' + OUT + ' (' + Math.round(html.length / 1024) + ' KB · ' + ROLES.map(([r, l]) => l + ' ' + seed[r].length).join(', ') + ' đơn vị)');
