/* Dựng trang ĐỘC LẬP cho bộ chỉ tiêu Trung tâm Phục vụ HCC: hcc-chi-tieu-doc-lap.html (một file, mở thẳng bằng trình duyệt, không cần IOC).
   Cách làm giống stc-chi-tieu-doc-lap.html của Sở Tài chính: nhúng nguyên CSS + JS gốc của bộ chỉ tiêu, cộng một khung tối
   thiểu (popup #modal, thông báo, nút đổi giao diện). Khung CSS tối thiểu lấy lại từ trang độc lập của Sở Tài chính.
   Chạy lại mỗi khi sửa code bộ chỉ tiêu:   node tools/hcc-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/* 1. Khung CSS tối thiểu: phần đầu <style> của trang độc lập Sở Tài chính, trước khi bắt đầu css/stc.css */
const stc = read('standalone/stc-chi-tieu-doc-lap.html');
const s0 = stc.indexOf('<style>') + '<style>'.length;
const s1 = stc.indexOf('/* ============================== SỞ TÀI CHÍNH', s0);
if (s0 < 7 || s1 < 0) throw new Error('Không tìm thấy khung CSS trong stc-chi-tieu-doc-lap.html');
const frameCss = stc.slice(s0, s1).replace('bộ chỉ tiêu Sở Tài chính cần', 'bộ chỉ tiêu cần');

/* 2. Danh sách 126 phường/xã (trọng số sinh số giả lập, dùng chung với Sở GD&ĐT) — lấy từ dashboard-education.js, file đó cần DOM nên không nhúng cả file */
const edu = read('js/features/dashboard-education.js');
const m = edu.match(/const gdUnitData=\[([\s\S]*?)\n\s*\];/);
if (!m) throw new Error('Không tìm thấy gdUnitData trong dashboard-education.js');
const units = 'const gdUnitData=[' + m[1] + '\n];';

const frameJs = `/* ============================== KHUNG TỐI THIỂU (tự viết) ==============================
   Thay cho phần lõi của IOC (helpers.js, modal-drawer-toast.js, indicators.js...) mà bộ chỉ tiêu Trung tâm Phục vụ HCC cần: thoát HTML,
   mở/đóng popup #modal, thông báo nhỏ, và điều hướng khi bấm ô KPI/thẻ nhóm ở băng Tổng quan (openCategoryDetail rút gọn:
   trang chỉ có 1 lĩnh vực nên chỉ dùng chỉ số thẻ). Khối "Nhiệm vụ đã giao" của IOC không có ở trang độc lập. */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}
function unlockScroll(){document.body.style.overflow='';document.documentElement.style.overflow=''}
function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll()}
function closeModal(){document.getElementById('modal').classList.remove('open');document.getElementById('overlay').classList.remove('show');unlockScroll()}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3000)}
const currentRole='UBND';
const HCC_CAT={role:'UBND',id:'ubnd-hcc'};
function openCategoryDetail(role, catId, itemIndex){ hccOpenForm(itemIndex, role); }
function renderHccOuterGrid(){ document.getElementById('hccOuterGrid').innerHTML = hccOverviewBandHtml(HCC_CAT, 0); }
const renderIndicators = renderHccOuterGrid;
function hccSetThemeStandalone(t){
  document.documentElement.classList.remove('theme-light','theme-green');
  if(t==='light'||t==='green') document.documentElement.classList.add('theme-'+t);
  try{ localStorage.setItem('hcc-standalone-theme', t); }catch(e){}
  document.querySelectorAll('.stc-theme-sw button').forEach((b)=>b.classList.toggle('on', b.dataset.theme===t));
}
document.addEventListener('DOMContentLoaded', () => {
  let saved = 'dark';
  try{ saved = localStorage.getItem('hcc-standalone-theme') || 'dark'; }catch(e){}
  hccSetThemeStandalone(saved);
  renderHccOuterGrid();
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const css = frameCss + part('css/stc.css') + part('css/sgd.css') + part('css/hcc.css');
const js = frameJs + '\n\n/* ===== gdUnitData (từ js/features/dashboard-education.js) ===== */\n' + units +
  part('js/core/line-chart.js') + part('js/core/hcc-config.js') + part('js/features/hcc-data.js') + part('js/features/dashboard-hcc.js');
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bộ chỉ tiêu Trung tâm Phục vụ hành chính công — IOC Hà Nội</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/hcc-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<!-- ExcelJS: dùng cho nút "Xuất Excel" trong popup (hccExport() ở dashboard-hcc.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<style>${css}
</style>
</head>
<body>
<div class="stc-page">
  <div class="stc-page-head">
    <div>
      <h1>Bộ chỉ tiêu hành chính công Thủ đô</h1>
      <p>Trung tâm Phục vụ hành chính công Hà Nội · trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) Hà Nội · <b style="color:#f2b636">số liệu giả lập</b></p>
    </div>
    <div class="stc-theme-sw" role="group" aria-label="Chọn giao diện">
      <button type="button" data-theme="dark" onclick="hccSetThemeStandalone('dark')">Tối</button>
      <button type="button" data-theme="light" onclick="hccSetThemeStandalone('light')">Sáng</button>
      <button type="button" data-theme="green" onclick="hccSetThemeStandalone('green')">Xanh lá</button>
    </div>
  </div>
  <div class="field-category-grid" id="hccOuterGrid"></div>
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
fs.writeFileSync(path.join(root, 'standalone', 'hcc-chi-tieu-doc-lap.html'), html, 'utf8');
console.log('Đã dựng hcc-chi-tieu-doc-lap.html (' + Math.round(html.length / 1024) + ' KB)');
