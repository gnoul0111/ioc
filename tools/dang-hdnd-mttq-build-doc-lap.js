/* Dựng trang ĐỘC LẬP cho chỉ tiêu 3 trục Thành ủy · HĐND Thành phố · Ủy ban MTTQ Thành phố (một file, mở thẳng bằng
   trình duyệt, không cần IOC). Mỗi lần chạy ra 4 file trong standalone/:
     thanh-uy-chi-tieu-doc-lap.html, hdnd-chi-tieu-doc-lap.html, mttq-chi-tieu-doc-lap.html   — mỗi file một trục
     dang-hdnd-mttq-chi-tieu-doc-lap.html                                                      — gộp 3 trục, có tab chuyển
   Cách làm giống trang độc lập UBND (tools/ubnd-build-doc-lap.js): nhúng nguyên CSS + JS gốc của khuôn chỉ tiêu mới
   (ctm-engine.js, ctm-dang.js, ctm-hdnd.js, ctm-mttq.js) cộng một khung tối thiểu.
   - Mỗi trục là màn ngoài như tài khoản trục đó trong IOC (ô số then chốt, thẻ nhóm, thẻ từng đơn vị).
   - Bấm thẻ / ô số: mở popup chi tiết khuôn mới (Tổng quan → nhóm → Theo 126 xã, phường; chọn kỳ, xuất Excel).
   Danh sách đơn vị lấy từ đoạn DANG/HDND/MTTQ của categorySeed trong js/core/central-level.js (chạy thử trong vm lúc dựng).
   Chạy lại mỗi khi sửa số liệu hoặc khuôn chỉ tiêu:   node tools/dang-hdnd-mttq-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/* 1. Khung CSS tối thiểu: phần đầu <style> của trang độc lập Sở Tài chính, trước khi bắt đầu css/stc.css */
const stc = read('standalone/stc-chi-tieu-doc-lap.html');
const s0 = stc.indexOf('<style>') + '<style>'.length;
const s1 = stc.indexOf('/* ============================== SỞ TÀI CHÍNH', s0);
if (s0 < 7 || s1 < 0) throw new Error('Không tìm thấy khung CSS trong stc-chi-tieu-doc-lap.html');
const frameCss = stc.slice(s0, s1).replace('bộ chỉ tiêu Sở Tài chính cần', 'bộ chỉ tiêu cần');

/* 2. Danh sách đơn vị 3 trục: cắt categorySeed từ DANG:[ đến trước UBND:[ rồi chạy trong vm */
const cl = read('js/core/central-level.js');
const c0 = cl.indexOf('const categorySeed = {');
const d0 = cl.indexOf('\n DANG:[', c0);
const d1 = cl.indexOf('\n UBND:[', c0);
if (c0 < 0 || d0 < 0 || d1 < 0) throw new Error('Không tìm thấy DANG/HDND/MTTQ trong categorySeed (central-level.js)');
const ctx = { console: console };
vm.createContext(ctx);
vm.runInContext('function P(dim,items){return {dim,type:"bar",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nfunction S(dim,items){return {dim,type:"stat",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nthis.__seed = {' + cl.slice(d0, d1).replace(/,\s*$/, '') + '};', ctx);
const ROLES = [['DANG', 'Thành ủy'], ['HDND', 'HĐND Thành phố'], ['MTTQ', 'Ủy ban MTTQ Thành phố']];
const seed = {};
ROLES.forEach(([r]) => {
  const list = ctx.__seed[r];
  if (!list || list.length < 4) throw new Error('Danh sách đơn vị ' + r + ' bất thường');
  seed[r] = list.map((c) => ({ id: c.id, name: c.name, desc: c.desc, types: c.types || [], noItems: !!c.noItems, items: (c.items || []).map((it) => [it[0]]) }));
});

/* 3. Khung JS tối thiểu — roles: các trục có trong file (1 trục thì không hiện thanh tab) */
const frameJs = (roles, key) => `/* ============================== KHUNG TỐI THIỂU (tự viết) ==============================
   Thay cho phần lõi của IOC mà khuôn chỉ tiêu mới cần: thoát HTML, popup #modal, thông báo nhỏ, danh sách đơn vị
   (CTM_SEED, dựng sẵn từ central-level.js), chuyển tab trục và điều hướng khi bấm thẻ/ô số. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}
function unlockScroll(){document.body.style.overflow='';document.documentElement.style.overflow=''}
function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll()}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('overlay').classList.remove('show');unlockScroll();if(typeof CTM_UI!=='undefined')CTM_UI.open=false}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
/* Nút "Nhập chỉ tiêu" trên thanh công cụ các popup — chép từ js/core/modal-drawer-toast.js */
${read('js/core/modal-drawer-toast.js').split('\n').filter((l) => /^\s*(const INDICATOR_ENTRY_URL|function openIndicatorEntrySystem|function indicatorEntryBtnHtml)/.test(l)).map((l) => l.trim()).join('\n')}
const currentXaId=null;
const CTM_ROLES=${JSON.stringify(roles)};
const CTM_SEED=${JSON.stringify(Object.fromEntries(roles.map(([r]) => [r, seed[r]])))};
const STORE_KEY=${JSON.stringify(key)};
let currentRole=CTM_ROLES[0][0];
function categorySeedForRole(r){ return CTM_SEED[r] || []; }
function openCategoryDetail(role, catId, itemIndex){
  if(typeof ctmHandles==='function' && ctmHandles(catId)){ ctmOpenForm(catId, itemIndex, role); return; }
  const c = (CTM_SEED[role]||[]).find((x)=>x.id===catId);
  toast((c ? c.name : 'Đơn vị này') + ' hiện chưa có chỉ tiêu được giao.');
}
function renderTabs(){
  const bar = document.getElementById('axTabs');
  if(!bar) return;
  bar.innerHTML = CTM_ROLES.map(([r,l])=>'<button type="button" role="tab" aria-selected="'+(r===currentRole)+'" class="stc-tab'+(r===currentRole?' on':'')+'" onclick="pickRole(\\''+r+'\\')">'+esc(l)+' <span class="stc-cnt">'+CTM_SEED[r].length+'</span></button>').join('');
}
function pickRole(r){
  if(!CTM_SEED[r]) return;
  currentRole=r; renderTabs();
  try{ localStorage.setItem(STORE_KEY+'-role', r); }catch(e){}
  renderCategoryGrid();
}
function renderCategoryGrid(){
  const q = (document.getElementById('uoSearch').value || '').toLowerCase();
  const list = CTM_SEED[currentRole].map((c)=>Object.assign({}, c, {role:currentRole})).filter((c)=>!q || c.name.toLowerCase().includes(q));
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
  let saved = 'dark', role = currentRole;
  try{ saved = localStorage.getItem(STORE_KEY+'-theme') || 'dark'; role = localStorage.getItem(STORE_KEY+'-role') || role; }catch(e){}
  const h = (location.hash || '').slice(1).toUpperCase();
  if(CTM_SEED[h]) role = h;
  if(!CTM_SEED[role]) role = CTM_ROLES[0][0];
  uoSetThemeStandalone(saved);
  currentRole = role; renderTabs(); renderCategoryGrid();
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const extraCss = `
/* ===== Trang độc lập: ô tìm đơn vị, thanh tab trục ===== */
.uo-search{height:34px;width:240px;max-width:60vw;border-radius:10px;border:1px solid rgba(87,178,255,.3);background:rgba(6,28,52,.6);color:#eaf4ff;padding:0 12px;font:inherit;font-size:13px}
html.theme-light .uo-search,html.theme-green .uo-search{background:#fff;border-color:#D5DAE3;color:#111827}
.uo-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.dhm-tabbar.stc-root{background:transparent;overflow:visible;margin-bottom:14px}
.dhm-tabbar .stc-tabs{margin-bottom:0;overflow-x:auto}
.dhm-tabbar .stc-tab{white-space:nowrap;cursor:pointer}
.field-category-grid>.uo-root{min-width:0}
@media(max-width:900px){.field-category-grid{grid-template-columns:minmax(0,1fr)}}
@media(max-width:600px){.stc-page{padding:18px 16px 40px}.uo-tools,.uo-tools>label{width:100%}.uo-search{width:100%;max-width:none}.uo-grid{grid-template-columns:minmax(0,1fr)}}
`;
const css = frameCss + part('css/stc.css') + part('css/sgd.css') + part('css/ubnd-overview.css') + part('css/ctm.css') + extraCss;
/* Nhúng đủ 3 file khai báo ở mọi bản (thứ tự như demo_ioc.html) — các file có thể dùng chung hàm của nhau */
const ctmJsSrc = part('js/core/line-chart.js') + part('js/core/ctm-xa.js') + part('js/features/ctm-engine.js') +
  part('js/features/ctm-mttq.js') + part('js/features/ctm-dang.js') + part('js/features/ctm-hdnd.js');
if (/<\/script/i.test(ctmJsSrc) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
function page(o) {
  const tabs = o.roles.length > 1 ? '\n  <div class="stc-root dhm-tabbar"><div class="stc-tabs" id="axTabs" role="tablist" aria-label="Chọn trục"></div></div>' : '';
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${o.title} — IOC Hà Nội</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/dang-hdnd-mttq-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
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
      <h1>Nhóm chỉ tiêu theo lĩnh vực · ${o.h1}</h1>
      <p>Trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) Hà Nội · số liệu mô phỏng theo quy mô, đối chiếu số công bố</p>
    </div>
    <div class="uo-tools">
      <label><span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Tìm ban, đơn vị</span><input id="uoSearch" class="uo-search" type="search" placeholder="Tìm ban, đơn vị..." oninput="renderCategoryGrid()"></label>
      <div class="stc-theme-sw" role="group" aria-label="Chọn giao diện">
        <button type="button" data-theme="dark" onclick="uoSetThemeStandalone('dark')">Tối</button>
        <button type="button" data-theme="light" onclick="uoSetThemeStandalone('light')">Sáng</button>
        <button type="button" data-theme="green" onclick="uoSetThemeStandalone('green')">Xanh lá</button>
      </div>
    </div>
  </div>${tabs}
  <div class="field-category-grid" id="uoOuterGrid"></div>
</div>

<div id="overlay" class="overlay" onclick="closeModal()"></div>
<section id="modal" class="modal">
  <div class="modal-head"><div><h3 id="modalTitle">Chi tiết</h3><div class="muted" id="modalSub"></div></div><button class="close" onclick="closeModal()">×</button></div>
  <div class="modal-body" id="modalBody"></div>
</section>
<div class="toast" id="toast"></div>

<script>
${frameJs(o.roles, o.key)}
${ctmJsSrc}
</script>
</body>
</html>
`;
}

const R = (id) => ROLES.filter(([r]) => r === id);
const OUT = [
  { file: 'thanh-uy-chi-tieu-doc-lap.html', key: 'tu-standalone', roles: R('DANG'), title: 'Chỉ tiêu Thành ủy', h1: 'Thành ủy Hà Nội' },
  { file: 'hdnd-chi-tieu-doc-lap.html', key: 'hdnd-standalone', roles: R('HDND'), title: 'Chỉ tiêu HĐND Thành phố', h1: 'HĐND Thành phố Hà Nội' },
  { file: 'mttq-chi-tieu-doc-lap.html', key: 'mttq-standalone', roles: R('MTTQ'), title: 'Chỉ tiêu Ủy ban MTTQ Thành phố', h1: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội' },
  { file: 'dang-hdnd-mttq-chi-tieu-doc-lap.html', key: 'dhm-standalone', roles: ROLES, title: 'Chỉ tiêu Thành ủy, HĐND, MTTQ', h1: 'Thành ủy, HĐND, Ủy ban MTTQ Thành phố Hà Nội' }
];
OUT.forEach((o) => {
  const html = page(o);
  fs.writeFileSync(path.join(root, 'standalone', o.file), html, 'utf8');
  console.log('Đã dựng ' + o.file + ' (' + Math.round(html.length / 1024) + ' KB · ' + o.roles.map(([r, l]) => l + ' ' + seed[r].length).join(', ') + ' đơn vị)');
});
