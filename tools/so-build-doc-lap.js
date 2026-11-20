/* Dựng trang ĐỘC LẬP cho chỉ tiêu 12 sở, ngành theo eform (một file, mở thẳng bằng trình duyệt, không cần IOC).
   Ra 1 file: standalone/so-chi-tieu-doc-lap.html — anh duyệt plan 19/11/2026 ("theo đề xuất").
   - 12 sheet sở của "File mô tả đầu vào eform" = 11 thẻ: Sở Du lịch đã gộp vào Sở Văn hóa, Thể thao và Du lịch (cờ UBND_SAP_XEP_SO_2026).
     Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC không có eform nên không đưa vào (đã có trang độc lập riêng).
   - Ô chọn trên đầu trang: «Tất cả sở» = thẻ sở như tab UBND của tài khoản Thành phố (ubndOvCardHtml, chỉ phần lưới thẻ);
     chọn một sở = như tài khoản sở đó (băng tổng quan ctmBandHtml).
   - Bấm thẻ / ô số: mở hộp chỉ tiêu theo eform như IOC (Tổng quan sở → eform → Dữ liệu đã nhập; Tháng / Quý / Năm; xuất Excel).
   - Số khớp IOC: nhúng đúng các file của IOC theo thứ tự nạp trong demo_ioc.html — cấu hình các sở (js/core/*-config.js), khung xã
     (ctm-xa.js, xa-eform.js, xa-eform-mau.js, ctm-xa-units.js: khung chung ctm-eform.js dùng các hàm đơn vị tính, tên danh mục ở đó), khuôn
     chỉ tiêu (ctm-engine.js, ctm-so.js), khung eform cấp Thành phố (eform-khung.js), bản ghi mẫu (eform-mau.js), khung chung
     (ctm-eform.js, ctm-truc-eform.js) và khai báo 12 sở (ctm-so-eform.js, ctm-so-eform2.js) theo bản đọc docs/BAN_DOC_EFORM/SO_*.
   Danh sách sở lấy từ categorySeed.UBND trong js/core/central-level.js (cùng các đoạn sắp xếp sở, đổi chỉ tiêu theo eform), chạy trong vm.
   Không sửa code IOC. Chạy lại mỗi khi sửa số liệu hoặc khuôn chỉ tiêu:   node tools/so-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const cut = (src, a, b, from) => {
  const i = src.indexOf(a, from || 0), j = b == null ? -1 : src.indexOf(b, i + a.length);
  if (i < 0 || (b != null && j < 0)) throw new Error('Không tìm thấy đoạn «' + a.slice(0, 60) + '» trong central-level.js');
  return { s: src.slice(i, b == null ? undefined : j), i: i, j: j };
};

/* 1. Khung CSS tối thiểu: phần đầu <style> của trang độc lập Sở Tài chính, trước khi bắt đầu css/stc.css */
const stc = read('standalone/stc-chi-tieu-doc-lap.html');
const s0 = stc.indexOf('<style>') + '<style>'.length;
const s1 = stc.indexOf('/* ============================== SỞ TÀI CHÍNH', s0);
if (s0 < 7 || s1 < 0) throw new Error('Không tìm thấy khung CSS trong stc-chi-tieu-doc-lap.html');
const frameCss = stc.slice(s0, s1).replace('bộ chỉ tiêu Sở Tài chính cần', 'bộ chỉ tiêu cần');

/* 2. Cấu hình số liệu các sở có eform (thứ tự như demo_ioc.html) — ctm-so.js và central-level.js đọc *_ITEMS, *_KY của các file này */
const CONFIGS = ['xa-dan-so', 'vhtt-config', 'vpub-config', 'bql-config', 'dl-config', 'dttg-config', 'ttra-config', 'khcn-config', 'nnmt-config',
  'sct-config', 'sxd-config', 'snv-config', 'syt-config'].map((f) => 'js/core/' + f + '.js');

/* 3. Danh sách đơn vị trục UBND sau khi sắp xếp sở (UBND_SAP_XEP_SO_2026) và đổi sang eform (SO_EFORM_DOT1, SO_EFORM_DOT23) */
const cl = read('js/core/central-level.js');
const seedAt = cl.indexOf('const categorySeed = {');
const u = cut(cl, '\n UBND:[', '\n };', seedAt);
const ubndSrc = u.s.slice('\n UBND:'.length).trim();
const sapXep = cut(cl, ' const UBND_SAP_XEP_SO_2026', '\n }', seedAt);
const sapXepSrc = cl.slice(sapXep.i, sapXep.j + 3);
const efTrucCatSrc = cut(cl, ' function efTrucCat(', '\n', seedAt).s;
const soEfSrc = cut(cl, ' /* 12 sở theo eform — đợt 1', ' /* Chỉ tiêu "Theo dõi nhiệm vụ"/tổng hợp', seedAt).s;
const ctx = { console: console, window: {}, document: { addEventListener() {} }, localStorage: { getItem() { return null; }, setItem() {} }, location: { search: '' } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(CONFIGS.map(read).join('\n;\n') +
  '\n;function P(dim,items){return {dim,type:"bar",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nfunction S(dim,items){return {dim,type:"stat",items:items.map(x=>({label:x[0],value:x[1]}))};}' +
  '\nglobalThis.__cats = ' + ubndSrc + ';' +
  '\nvar categorySeed = { UBND: globalThis.__cats };\n' + sapXepSrc + '\n' + efTrucCatSrc + '\n' + soEfSrc +
  '\nglobalThis.__cats = categorySeed.UBND; globalThis.__flags = { UBND_SAP_XEP_SO_2026, SO_EFORM_DOT1, SO_EFORM_DOT23 };', ctx);
/* chỉ đơn vị khai báo theo eform (types ['Eform']); trên trang còn lọc lại theo CTM_SPECS[id].efDonVi */
const cats = ctx.__cats.filter((c) => (c.types || []).length === 1 && c.types[0] === 'Eform')
  .map((c) => ({ id: c.id, name: c.name, desc: c.desc, types: c.types, items: (c.items || []).map((it) => [it[0]]) }));
if (cats.length < 10) throw new Error('Danh sách sở theo eform bất thường: ' + cats.length);

/* 4. Khung JS tối thiểu */
const KEY = 'so-standalone';
const frameJs = `/* ============================== KHUNG TỐI THIỂU (tự viết) ==============================
   Thay cho phần lõi của IOC mà khuôn chỉ tiêu cần: thoát HTML, popup #modal, thông báo nhỏ, danh sách sở (SO_CATS, dựng sẵn từ
   central-level.js), ô chọn sở (currentSoId: như tài khoản sở) và điều hướng khi bấm thẻ / ô số. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}
function unlockScroll(){document.body.style.overflow='';document.documentElement.style.overflow=''}
function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll()}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('overlay').classList.remove('show');unlockScroll();if(typeof CTM_UI!=='undefined')CTM_UI.open=false}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
/* Nút "Nhập chỉ tiêu" trên thanh công cụ các popup — chép từ js/core/modal-drawer-toast.js */
${read('js/core/modal-drawer-toast.js').split('\n').filter((l) => /^\s*(const INDICATOR_ENTRY_URL|function openIndicatorEntrySystem|function indicatorEntryBtnHtml)/.test(l)).map((l) => l.trim()).join('\n')}
const currentRole='UBND';
const currentXaId=null;
let currentSoId=null;
const UBND_SAP_XEP_SO_2026=${ctx.__flags.UBND_SAP_XEP_SO_2026};
const SO_EFORM_DOT1=${ctx.__flags.SO_EFORM_DOT1};
const SO_EFORM_DOT23=${ctx.__flags.SO_EFORM_DOT23};
const SO_CATS_ALL=${JSON.stringify(cats)};
const STORE_KEY=${JSON.stringify(KEY)};
let SO_CATS=SO_CATS_ALL;
function categorySeedForRole(r){ return r==='UBND' ? SO_CATS : []; }
function openCategoryDetail(role, catId, itemIndex){
  if(typeof ctmHandles==='function' && ctmHandles(catId)){ ctmOpenForm(catId, itemIndex, role); return; }
  const c = SO_CATS.find((x)=>x.id===catId);
  toast((c ? c.name : 'Đơn vị này') + ' hiện chưa có chỉ tiêu theo eform.');
}
function renderHead(){
  const c = currentSoId ? SO_CATS.find((x)=>x.id===currentSoId) : null;
  document.getElementById('soH1').textContent = 'Chỉ tiêu theo eform · ' + (c ? c.name : SO_CATS.length + ' sở, ngành');
  document.title = 'Chỉ tiêu ' + (c ? c.name : 'sở, ngành') + ' — IOC Hà Nội';
  document.getElementById('categorySearch').closest('label').hidden = !!c;
}
function renderCategoryGrid(){
  const grid = document.getElementById('uoOuterGrid');
  if(currentSoId){
    const c = SO_CATS.find((x)=>x.id===currentSoId);
    grid.innerHTML = c ? ctmBandHtml(Object.assign({}, c, {role:'UBND'})) : '';
    return;
  }
  const q = (document.getElementById('categorySearch').value || '').toLowerCase();
  const list = SO_CATS.map((c)=>Object.assign({}, c, {role:'UBND'})).filter((c)=>!q || c.name.toLowerCase().includes(q));
  const D = {};
  list.forEach((c)=>{ const d = ubndOvData(c.id); if(d) D[c.id] = d; });
  grid.innerHTML = '<div class="stc-root uo-root"><div class="uo-secrow uo-gridhead"><div class="stc-sec">' + list.length + ' sở, ngành · bấm thẻ để xem chi tiết của sở</div></div>' +
    (list.length ? '<div class="uo-grid">' + list.map((c)=>ubndOvCardHtml(c, D)).join('') + '</div>' : '<div class="access-lock">Không có sở, ngành phù hợp bộ lọc.</div>') + '</div>';
}
const renderIndicators = renderCategoryGrid;
const renderCategoryGridContent = renderCategoryGrid;
function pickSo(id){
  currentSoId = id && SO_CATS.some((c)=>c.id===id) ? id : null;
  try{ localStorage.setItem(STORE_KEY+'-so', currentSoId || ''); }catch(e){}
  const sel = document.getElementById('soPick'); if(sel) sel.value = currentSoId || '';
  renderHead(); renderCategoryGrid();
}
function renderSoPick(){
  document.getElementById('soPick').innerHTML = '<option value="">Tất cả ' + SO_CATS.length + ' sở, ngành</option>' +
    SO_CATS.map((c)=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
}
function uoSetThemeStandalone(t){
  document.documentElement.classList.remove('theme-light','theme-green');
  if(t==='light'||t==='green') document.documentElement.classList.add('theme-'+t);
  try{ localStorage.setItem(STORE_KEY+'-theme', t); }catch(e){}
  document.querySelectorAll('.stc-theme-sw button').forEach((b)=>b.classList.toggle('on', b.dataset.theme===t));
}
document.addEventListener('DOMContentLoaded', () => {
  /* chỉ giữ sở mà IOC dựng theo eform (CTM_SPECS[id].efDonVi), đúng thứ tự của danh mục */
  SO_CATS = SO_CATS_ALL.filter((c)=>typeof CTM_SPECS!=='undefined' && CTM_SPECS[c.id] && CTM_SPECS[c.id].efDonVi && CTM_SPECS[c.id].enabled!==false);
  let saved = 'dark', so = '';
  try{ saved = localStorage.getItem(STORE_KEY+'-theme') || 'dark'; so = localStorage.getItem(STORE_KEY+'-so') || ''; }catch(e){}
  const h = decodeURIComponent((location.hash || '').slice(1));
  if(h) so = h;
  uoSetThemeStandalone(saved);
  renderSoPick();
  pickSo(so);
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const extraCss = `
/* ===== Trang độc lập: ô chọn sở, ô tìm sở ===== */
.uo-search{height:34px;width:240px;max-width:60vw;border-radius:10px;border:1px solid rgba(87,178,255,.3);background:rgba(6,28,52,.6);color:#eaf4ff;padding:0 12px;font:inherit;font-size:13px}
.so-pick{width:300px;cursor:pointer;font-weight:600}
.so-pick option{background:#0b2240;color:#eaf4ff}
html.theme-light .uo-search,html.theme-green .uo-search{background:#fff;border-color:#D5DAE3;color:#111827}
html.theme-light .so-pick option,html.theme-green .so-pick option{background:#fff;color:#111827}
.uo-tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.field-category-grid>.uo-root{min-width:0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media(max-width:900px){.field-category-grid{grid-template-columns:minmax(0,1fr)}}
@media(max-width:600px){.stc-page{padding:18px 16px 40px}.uo-tools,.uo-tools>label{width:100%}.uo-search,.so-pick{width:100%;max-width:none}.uo-grid{grid-template-columns:minmax(0,1fr)}}
`;
const css = frameCss + part('css/stc.css') + part('css/sgd.css') + part('css/ubnd-overview.css') + part('css/ctm.css') + extraCss;
/* đúng thứ tự nạp trong demo_ioc.html (chỉ phần cần cho 12 sở theo eform) */
const ctmJsSrc = CONFIGS.map(part).join('') + part('js/core/line-chart.js') + part('js/features/ubnd-overview.js') +
  part('js/core/ctm-xa.js') + part('js/core/xa-eform.js') + part('js/core/xa-eform-mau.js') + part('js/features/ctm-engine.js') + part('js/features/ctm-xa-units.js') + part('js/features/ctm-so.js') +
  part('js/core/eform-khung.js') + part('js/core/eform-mau.js') + part('js/features/ctm-eform.js') + part('js/features/ctm-truc-eform.js') +
  part('js/features/ctm-so-eform.js') + part('js/features/ctm-so-eform2.js');
if (/<\/script/i.test(ctmJsSrc) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chỉ tiêu sở, ngành theo eform — IOC Hà Nội</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/so-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
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
      <h1 id="soH1">Chỉ tiêu theo eform · sở, ngành</h1>
      <p>Trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) Hà Nội · 12 sở, ngành có eform trong "File mô tả đầu vào eform" (Sở Du lịch nằm trong Sở Văn hóa, Thể thao và Du lịch) · đang là bản ghi mẫu dựng theo khung eform (chưa nối dữ liệu thật)</p>
    </div>
    <div class="uo-tools">
      <label><span class="sr-only">Chọn sở, ngành</span><select id="soPick" class="uo-search so-pick" onchange="pickSo(this.value)"></select></label>
      <label><span class="sr-only">Tìm sở, ngành</span><input id="categorySearch" class="uo-search" type="search" placeholder="Tìm sở, ngành…" oninput="renderCategoryGrid()"></label>
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
${frameJs}
${ctmJsSrc}
</script>
</body>
</html>
`;
const OUT = 'so-chi-tieu-doc-lap.html';
fs.writeFileSync(path.join(root, 'standalone', OUT), html, 'utf8');
console.log('Đã dựng ' + OUT + ' (' + Math.round(html.length / 1024) + ' KB · ' + cats.length + ' đơn vị có eform trong danh mục: ' + cats.map((c) => c.id).join(', ') + ')');
