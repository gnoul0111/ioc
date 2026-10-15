/* Dựng trang ĐỘC LẬP cho khối "Bản đồ số toàn quốc" của tài khoản Ban Tổ chức Trung ương (TW_DANG):
   standalone/btctw-ban-do-toan-quoc-doc-lap.html (một file, mở thẳng bằng trình duyệt, không cần IOC).
   Nhúng nguyên code gốc: js/features/btctw-national-map.js, css/btctw-national-map.css, ranh giới 34 tỉnh + nước láng giềng
   (js/data/vn34-map-data.js), Leaflet (lib/leaflet) — cộng khung tối thiểu (khung widget, thông báo nhỏ, đổi giao diện).
   Đủ 2 chế độ Đảng viên / Văn bản, chọn địa bàn, bảng xếp hạng + Tải xuống Excel, biểu đồ 30 ngày, toàn màn hình.
   Chart.js và ExcelJS tải từ cdnjs như demo_ioc.html (cần mạng cho biểu đồ và nút Excel; bản đồ chạy cả khi không có mạng).
   Chạy lại mỗi khi sửa code bản đồ:   node tools/btctw-ban-do-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const lines = (p, from, to) => read(p).split(/\r?\n/).slice(from - 1, to).join('\n');
const need = (s, what) => { if (!s || !s.trim()) throw new Error('Không cắt được ' + what); return s; };

/* 1. CSS khung: đầu theme-base.css (biến màu, nền trang, nút, .hidden) + khối .widget, và phần đầu khối widget của
      theme-light.css / theme-green.css — cắt theo nội dung để không lệch khi file gốc thêm dòng */
const tb = read('css/theme-base.css');
const tbHead = need(tb.slice(0, tb.indexOf('.muted{')), 'đầu theme-base.css');
const tbWidget = need((tb.match(/^\s*\.widget\{[\s\S]*?^\s*\.widget-body\{[^\n]*$/m) || [])[0], '.widget trong theme-base.css');
const pickTheme = (file, t) => read(file).split(/\r?\n/).filter((l) => new RegExp('html\\.theme-' + t + ' (\\.widget|\\.mini-btn|\\.top-overview-title)').test(l) && !/::-webkit/.test(l)).join('\n');
const frameCss = `/* ============================== KHUNG TỐI THIỂU ==============================
   Trích từ css/theme-base.css, css/theme-light.css, css/theme-green.css: biến màu, nền trang, khung .widget. */
${tbHead}
${tbWidget}
html.theme-light,html.theme-light body{background:#f3f5f9;color:#0b1220}
html.theme-green,html.theme-green body{background:#eef9f3;color:#1f2937}
${need(pickTheme('css/theme-light.css', 'light'), 'theme-light')}
${need(pickTheme('css/theme-green.css', 'green'), 'theme-green')}
/* Trang độc lập */
.btm-page{max-width:1500px;margin:0 auto;padding:16px 16px 40px}
.btm-page-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;font-size:12.5px;color:var(--muted)}
html.theme-light .btm-page-bar,html.theme-green .btm-page-bar{color:#5b6a80}
.btm-theme-sw{display:flex;gap:6px}
.btm-theme-sw button{height:30px;padding:0 12px;border-radius:8px;border:1px solid rgba(87,178,255,.3);background:rgba(255,255,255,.06);font-size:12.5px;font-weight:600}
.btm-theme-sw button.on{background:#1f63b8;border-color:transparent;color:#fff}
html.theme-light .btm-theme-sw button{border-color:#D5DAE3;background:#fff;color:#111827}
html.theme-green .btm-theme-sw button{border-color:#d1fae5;background:#fff;color:#1f2937}
html.theme-light .btm-theme-sw button.on{background:#9d151c;color:#fff;border-color:transparent}
html.theme-green .btm-theme-sw button.on{background:#2e9d5b;color:#fff;border-color:transparent}
.toast{position:fixed;right:18px;bottom:18px;z-index:3000;background:#06223f;border:1px solid rgba(87,178,255,.45);border-radius:12px;padding:12px 14px;box-shadow:0 15px 50px rgba(0,0,0,.4);transform:translateY(20px);opacity:0;pointer-events:none;transition:.2s;max-width:420px;font-size:13px}
.toast.show{transform:translateY(0);opacity:1}
html.theme-light .toast{background:#F9FAFB;border-color:#D5DAE3;color:#111827}
html.theme-green .toast{background:#ffffff;border-color:#d1fae5;color:#1f2937}
@media(max-width:700px){#btctwMapWidget .widget-head{flex-wrap:wrap}#btctwMapWidget .widget-title{white-space:normal;flex-basis:100%}}
`;

/* 2. Khung HTML của widget: cắt nguyên khối <article id="btctwMapWidget"> trong demo_ioc.html, bỏ lớp hidden */
const demo = read('demo_ioc.html');
const a0 = demo.lastIndexOf('<article', demo.indexOf('id="btctwMapWidget"'));
const a1 = demo.indexOf('</article>', a0) + '</article>'.length;
if (a0 < 0 || a1 < a0) throw new Error('Không tìm thấy #btctwMapWidget trong demo_ioc.html');
const widgetHtml = demo.slice(a0, a1).replace('class="widget hidden"', 'class="widget"');

/* 3. Hàm lõi IOC mà bản đồ cần — chép nguyên dòng từ js/core/modal-drawer-toast.js */
const mdt = read('js/core/modal-drawer-toast.js').split(/\r?\n/);
const fnLine = (name) => need(mdt.find((l) => new RegExp('^\\s*function ' + name + '\\(').test(l)), name).trim();
const frameJs = `/* ============================== KHUNG TỐI THIỂU (tự viết + chép từ js/core/modal-drawer-toast.js) ============================== */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3500)}
${fnLine('toggleWidgetBody')}
${fnLine('isLightTheme')}
${fnLine('chartAxisColor')}
${fnLine('chartGridColor')}
const currentRole='TW_DANG';
function btmSetThemeStandalone(t){
  document.documentElement.classList.remove('theme-light','theme-green');
  if(t==='light'||t==='green') document.documentElement.classList.add('theme-'+t);
  try{ localStorage.setItem('btctw-standalone-theme', t); }catch(e){}
  document.querySelectorAll('.btm-theme-sw button').forEach((b)=>b.classList.toggle('on', b.dataset.theme===t));
  if(typeof BTM!=='undefined' && BTM.map) btmRenderPanels();   // biểu đồ 30 ngày đổi màu trục theo giao diện
}
document.addEventListener('DOMContentLoaded', () => {
  let saved = 'dark';
  try{ saved = localStorage.getItem('btctw-standalone-theme') || 'dark'; }catch(e){}
  btmSetThemeStandalone(saved);
  renderBtctwNationalMap();
});`;

const part = (file) => '\n/* ===== ' + file + ' ===== */\n' + read(file);
const css = frameCss + part('lib/leaflet/leaflet.css') + part('css/btctw-national-map.css');
const js = part('lib/leaflet/leaflet.js') + part('js/data/vn34-map-data.js') + '\n' + frameJs + part('js/features/btctw-national-map.js');
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bản đồ số toàn quốc — IOC Ban Tổ chức Trung ương</title>
<!-- Trang độc lập, dựng tự động bằng "node tools/btctw-ban-do-build-doc-lap.js" lúc ${built}. Đừng sửa tay: sửa code gốc rồi dựng lại. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<!-- Chart.js: biểu đồ diễn biến 30 ngày · ExcelJS: nút "Tải xuống Excel" (cùng bản với demo_ioc.html) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>
<style>${css}
</style>
</head>
<body>
<div class="btm-page">
  <div class="btm-page-bar">
    <span>Trang độc lập, tách riêng từ Trung tâm Điều hành thông minh (IOC) · tài khoản Ban Tổ chức Trung ương · bản demo, số liệu mô phỏng</span>
    <div class="btm-theme-sw" role="group" aria-label="Chọn giao diện">
      <button type="button" data-theme="dark" onclick="btmSetThemeStandalone('dark')">Tối</button>
      <button type="button" data-theme="light" onclick="btmSetThemeStandalone('light')">Sáng</button>
      <button type="button" data-theme="green" onclick="btmSetThemeStandalone('green')">Xanh lá</button>
    </div>
  </div>
${widgetHtml}
</div>
<div class="toast" id="toast"></div>

<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'standalone', 'btctw-ban-do-toan-quoc-doc-lap.html'), html, 'utf8');
console.log('Đã dựng btctw-ban-do-toan-quoc-doc-lap.html (' + Math.round(html.length / 1024) + ' KB)');
