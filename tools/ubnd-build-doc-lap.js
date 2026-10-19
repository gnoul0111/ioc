/* Dựng trang ĐỘC LẬP cho màn tổng quan chỉ tiêu tài khoản UBND Thành phố: standalone/ubnd-tong-quan-doc-lap.html
   (một file, mở thẳng bằng trình duyệt, không cần IOC). Cách làm giống trang độc lập của Sở Tài chính / Sở GD&ĐT / HCC:
   nhúng nguyên CSS + JS gốc (ubnd-overview.js và cấu hình số liệu của các sở), cộng một khung tối thiểu.
   - Bấm thẻ / ô số của Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC: mở popup chỉ tiêu của sở đó (code gốc nhúng sẵn).
   - 12 sở theo eform: mở popup khuôn mới dùng chung (ctm-engine.js + ctm-so.js nhúng sẵn).
   - Sở chưa có chỉ tiêu: hiện thông báo.
   Danh sách 18 đơn vị lấy từ đoạn UBND:[...] trong js/core/central-level.js (chạy thử trong vm lúc dựng).
   Chạy lại mỗi khi sửa code tổng quan hoặc số liệu các sở:   node tools/ubnd-build-doc-lap.js */
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

/* 2. Danh sách 126 phường/xã (Sở GD&ĐT và HCC sinh số theo trọng số này) — lấy từ dashboard-education.js */
const edu = read('js/features/dashboard-education.js');
const m = edu.match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
if (!m) throw new Error('Không tìm thấy gdUnitData trong dashboard-education.js');
const units = 'const gdUnitData=[' + m[1] + '\n];';

/* 3. Cấu hình số liệu các sở (thứ tự như demo_ioc.html) */
const CONFIGS = ['stc-config', 'sgd-config', 'hcc-config', 'vhtt-config', 'vpub-config', 'bql-config', 'dl-config', 'dttg-config',
  'ttra-config', 'khcn-config', 'nnmt-config', 'sct-config', 'sxd-config', 'snv-config', 'syt-config'].map((f) => 'js/core/' + f + '.js');

/* 4. Danh sách 18 đơn vị trục UBND: cắt đoạn UBND:[...] của categorySeed rồi chạy trong vm cùng cấu hình các sở */
const cl = read('js/core/central-level.js');
const u0 = cl.indexOf('\n UBND:[', cl.indexOf('const categorySeed = {'));
const u1 = cl.indexOf('\n };', u0);
if (u0 < 0 || u1 < 0) throw new Error('Không tìm thấy UBND:[...] trong central-level.js');
const ubndSrc = cl.slice(u0 + '\n UBND:'.length, u1).trim();
/* Sắp xếp sở theo bộ máy mới (cờ UBND_SAP_XEP_SO_2026 ngay sau categorySeed): chạy nguyên đoạn đó trên danh sách vừa cắt */
const x0 = cl.indexOf(' const UBND_SAP_XEP_SO_2026'), x1 = cl.indexOf('\n }', cl.indexOf('if(UBND_SAP_XEP_SO_2026){', x0));
if (x0 < 0 || x1 < 0) throw new Error('Không tìm thấy đoạn UBND_SAP_XEP_SO_2026 trong central-level.js');
const sapXepSrc = cl.slice(x0, x1 + 3);
const ctx = { console: console, window: {}, document: { addEventListener() {} }, localStorage: { getItem() { return null; }, setItem() {} }, location: { search: '' } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(CONFIGS.map(read).join('\n;\n') +
  '\n;function P(dim,items){return {dim,type:"bar",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nfunction S(dim,items){return {dim,type:"stat",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nglobalThis.__cats = ' + ubndSrc + ';' +
  '\nvar categorySeed = { UBND: globalThis.__cats };\n' + sapXepSrc + '\nglobalThis.__cats = categorySeed.UBND; globalThis.__sapXep = UBND_SAP_XEP_SO_2026;', ctx);
const cats = ctx.__cats.map((c) => ({ id: c.id, name: c.name, desc: c.desc, types: c.types || [], noItems: !!c.noItems, items: (c.items || []).map((it) => [it[0]]) }));
if (cats.length < 10) throw new Error('Danh sách đơn vị UBND bất thường: ' + cats.length);

const frameJs = `/* ============================== KHUNG TỐI THIỂU (tự viết) ==============================
   Thay cho phần lõi của IOC mà màn tổng quan UBND cần: thoát HTML, popup #modal, thông báo nhỏ, danh sách đơn vị trục UBND
   (UBND_CATS, dựng sẵn từ central-level.js) và điều hướng khi bấm thẻ/ô số. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}
function unlockScroll(){document.body.style.overflow='';document.documentElement.style.overflow=''}
function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll()}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('overlay').classList.remove('show');unlockScroll()}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
/* Nút "Nhập chỉ tiêu" trên thanh công cụ các popup — chép từ js/core/modal-drawer-toast.js */
${read('js/core/modal-drawer-toast.js').split('\n').filter((l) => /^\s*(const INDICATOR_ENTRY_URL|function openIndicatorEntrySystem|function indicatorEntryBtnHtml)/.test(l)).map((l) => l.trim()).join('\n')}
const currentRole='UBND';
const currentXaId=null;
const UBND_SAP_XEP_SO_2026=${ctx.__sapXep};
const UBND_CATS=${JSON.stringify(cats)};
function categorySeedForRole(r){ return r==='UBND' ? UBND_CATS : []; }
function openCategoryDetail(role, catId, itemIndex){
  const i = itemIndex == null ? 0 : itemIndex;
  if(catId==='ubnd-taichinh' && typeof stcOpenForm==='function'){ stcOpenForm(i, role); return; }
  if(catId==='ubnd-gddt' && typeof sgdOpenForm==='function'){ sgdOpenForm(i, role); return; }
  if(catId==='ubnd-hcc' && typeof hccOpenForm==='function'){ hccOpenForm(i, role); return; }
  if(typeof ctmHandles==='function' && ctmHandles(catId)){ ctmOpenForm(catId, itemIndex, role); return; }
  const c = UBND_CATS.find((x)=>x.id===catId);
  toast((c ? c.name.replace(/\\s*\\(.*\\)\\s*$/,'') : 'Đơn vị này') + ' hiện chưa có chỉ tiêu được giao.');
}
function renderCategoryGrid(){
  const q = (document.getElementById('uoSearch').value || '').toLowerCase();
  const list = UBND_CATS.map((c)=>Object.assign({}, c, {role:'UBND'})).filter((c)=>!q || c.name.toLowerCase().includes(q));
  document.getElementById('uoOuterGrid').innerHTML = ubndOverviewHtml(list);
}
const renderIndicators = renderCategoryGrid;
function uoSetThemeStandalone(t){
  document.documentElement.classList.remove('theme-light','theme-green');
  if(t==='light'||t==='green') document.documentElement.classList.add('theme-'+t);
  try{ localStorage.setItem('ubnd-standalone-theme', t); }catch(e){}
  document.querySelectorAll('.stc-theme-sw button').forEach((b)=>b.classList.toggle('on', b.dataset.theme===t));
}
document.addEventListener('DOMContentLoaded', () => {
  let saved = 'dark';
  try{ saved = localStorage.getItem('ubnd-standalone-theme') || 'dark'; }catch(e){}
  uoSetThemeStandalone(saved);
  renderCategoryGrid();
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const extraCss = `
/* ===== Trang độc lập: ô tìm sở ===== */
.uo-search{height:34px;width:240px;max-width:60vw;border-radius:10px;border:1px solid rgba(87,178,255,.3);background:rgba(6,28,52,.6);color:#eaf4ff;padding:0 12px;font:inherit;font-size:13px}
html.theme-light .uo-search,html.theme-green .uo-search{background:#fff;border-color:#D5DAE3;color:#111827}
.uo-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
`;
const css = frameCss + part('css/stc.css') + part('css/sgd.css') + part('css/hcc.css') + part('css/ubnd-overview.css') + part('css/ctm.css') + extraCss;
const js = frameJs + '\n\n/* ===== gdUnitData (từ js/features/dashboard-education.js) ===== */\n' + units +
  CONFIGS.map(part).join('') +
  part('js/data/stc-snapshot.js') + part('js/features/stc-demo-data.js') + part('js/features/stc-data.js') + part('js/features/dashboard-stc.js') +
  part('js/features/sgd-data.js') + part('js/features/dashboard-sgd.js') +
  part('js/features/hcc-data.js') + part('js/features/dashboard-hcc.js') +
  part('js/features/ubnd-overview.js') +
  part('js/core/ctm-xa.js') + part('js/features/ctm-engine.js') + part('js/features/ctm-so.js');
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tổng quan chỉ tiêu UBND Thành phố — IOC Hà Nội</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/ubnd-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- ExcelJS: nút "Xuất Excel" trong popup Sở Tài chính / Sở GD&ĐT / TT Phục vụ HCC -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<style>${css}
</style>
</head>
<body>
<div class="stc-page">
  <div class="stc-page-head">
    <div>
      <h1>Nhóm chỉ tiêu theo lĩnh vực · UBND Thành phố Hà Nội</h1>
      <p>Tổng quan chỉ tiêu của các sở, ngành · trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) Hà Nội</p>
    </div>
    <div class="uo-tools">
      <label><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Tìm sở, ngành</span><input id="uoSearch" class="uo-search" type="search" placeholder="Tìm sở, ngành..." oninput="renderCategoryGrid()"></label>
      <div class="stc-theme-sw" role="group" aria-label="Chọn giao diện">
        <button type="button" data-theme="dark" onclick="uoSetThemeStandalone('dark')">Tối</button>
        <button type="button" data-theme="light" onclick="uoSetThemeStandalone('light')">Sáng</button>
        <button type="button" data-theme="green" onclick="uoSetThemeStandalone('green')">Xanh lá</button>
      </div>
    </div>
  </div>
  <div class="field-category-grid" id="uoOuterGrid"></div>
</div>

<div id="overlay" class="overlay" onclick="closeModal()"></div>
<section id="modal" class="modal">
  <div class="modal-head"><div><h3 id="modalTitle">Chi tiết</h3><div class="muted" id="modalSub"></div></div><button class="close" onclick="closeModal()">×</button></div>
  <div class="modal-body" id="modalBody"></div>
</section>
<div class="toast" id="toast"></div>

<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'standalone', 'ubnd-tong-quan-doc-lap.html'), html, 'utf8');
console.log('Đã dựng ubnd-tong-quan-doc-lap.html (' + Math.round(html.length / 1024) + ' KB, ' + cats.length + ' đơn vị)');
