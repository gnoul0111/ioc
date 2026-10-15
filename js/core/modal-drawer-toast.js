 /* ============================== MODAL / DRAWER / TOAST / CUSTOMIZER ============================== */
 function lockScroll(){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';}
 function unlockScroll(){
 const drawerOpen=document.getElementById('drawer')?.classList.contains('open');
 const modalOpen=document.querySelector('.modal.open');
 if(!drawerOpen&&!modalOpen){document.body.style.overflow='';document.documentElement.style.overflow='';}
 }
 function openDrawer(){const act=document.getElementById('drawerHeadActions');if(act)act.innerHTML='';document.getElementById('overlay').classList.add('show');document.getElementById('drawer').classList.add('open');lockScroll();}
 function closeDrawer(){document.getElementById('drawer').classList.remove('open'); if(!document.getElementById('modal').classList.contains('open')) document.getElementById('overlay').classList.remove('show'); unlockScroll();}
 function openModal(){document.getElementById('overlay').classList.add('show');document.getElementById('modal').classList.add('open');lockScroll();}
 function closeModal(){document.getElementById('modal').classList.remove('open','modal-compact'); if(!document.getElementById('drawer').classList.contains('open')) document.getElementById('overlay').classList.remove('show'); unlockScroll(); window.__actionLogModalOpen=false;}
 function closePanels(){closeDrawer();closeModal();}
 function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),3000)}
 /* Nút "Phê duyệt" chỉ hiện khi có nhiệm vụ ở trạng thái Chờ duyệt — bấm vào chuyển sang hệ thống Theo dõi nhiệm vụ
 (VPTU) ngoài IOC để thực hiện thao tác phê duyệt thật, IOC không tự xử lý phê duyệt. */
 const APPROVAL_SYSTEM_URL='https://test-theodoinhiemvu.hanoi.gov.vn/app/task';
 function openApprovalSystem(){toast('Đang chuyển sang hệ thống phê duyệt...');window.open(APPROVAL_SYSTEM_URL,'_blank');}
 /* Với MỌI nhiệm vụ nhận (r.metric==='received'), bất kể tài khoản/trục nào đang xem, cho phép chuyển thẳng sang phần mềm Chủ trương/Kế hoạch để khởi tạo hồ sơ tương ứng — IOC chỉ điều hướng, không xử lý nghiệp vụ tại đây. */
 const CHUTRUONG_KEHOACH_URL='https://dhvb_qlnv.lifetex.vn/OutGoingDocument';
 function openChuTruongKeHoach(){toast('Đang chuyển sang hệ thống Chủ trương/Kế hoạch...');window.open(CHUTRUONG_KEHOACH_URL,'_blank');}
 const INDICATOR_ENTRY_URL='https://quanlyquytrinh.lifetex.vn/';
 function openIndicatorEntrySystem(){toast('Đang chuyển sang hệ thống Nhập chỉ tiêu...');window.open(INDICATOR_ENTRY_URL,'_blank');}
 /* Nút "＋ Nhập chỉ tiêu" cho thanh công cụ các form chỉ tiêu UI mới (STC/SGD/HCC/khuôn ctm) — đặt cạnh "Xuất Excel". */
 function indicatorEntryBtnHtml(){return '<button type="button" class="stc-btn" onclick="openIndicatorEntrySystem()" title="Mở hệ thống Nhập chỉ tiêu"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>Nhập chỉ tiêu</button>';}
 /* Hệ thống theo dõi nhiệm vụ ngoài IOC — 2 hệ thống khác nhau theo phạm vi tài khoản đang xem: tài khoản 04 trục
 (cấp Thành phố) dùng chung URL với hệ thống phê duyệt (APPROVAL_SYSTEM_URL); tài khoản xã/phường (đang xem theo
 đúng 1 xã/phường cụ thể, currentXaId!=null) dùng hệ thống riêng của xã/phường. */
 const TASK_TRACKING_XA_URL='https://qlnv.lifetex.vn/DS_NHIEM_VU_MOI/ds-nhiem-vu/';
 function taskTrackingUrl(){return currentXaId!=null?TASK_TRACKING_XA_URL:APPROVAL_SYSTEM_URL;}
 function openTaskTrackingSystem(){toast('Đang chuyển sang hệ thống theo dõi nhiệm vụ...');window.open(taskTrackingUrl(),'_blank');}
 function approveButtonHtml(hasPending){return hasPending?`<button class="ghost" onclick="openApprovalSystem()">✓ Phê duyệt</button>`:'';}

 function toggleWidgetBody(btn){const box=btn.closest('.widget')||btn.closest('.top-overview')||btn.closest('.detail-card');const body=box.querySelector('.widget-body');body.classList.toggle('hidden');btn.textContent=body.classList.contains('hidden')?'＋':'−'}
 /* Chế độ sáng/tối — chỉ đổi màu (html.theme-light), không đổi bố cục/HTML. Lưu lựa chọn qua các lần tải lại trang. */
 const THEME_STORAGE_KEY='px-ioc-theme';
 /* 3 theme: 'dark' (mặc định, không gắn class), 'light' (.theme-light), 'green' (.theme-green — theme mới, tông
 xanh lá tươi/navy theo yêu cầu, chỉ đổi màu qua CSS giống hệt cơ chế .theme-light, không đụng HTML/bố cục). */
 function applyTheme(theme){
 document.documentElement.classList.remove('theme-light','theme-green');
 if(theme==='light'||theme==='green') document.documentElement.classList.add('theme-'+theme);
 const sel=document.getElementById('themeSelect');
 if(sel) sel.value=theme;
 }
 function setTheme(theme){
 applyTheme(theme);
 try{localStorage.setItem(THEME_STORAGE_KEY,theme);}catch(e){}
 refreshChartsForTheme();
 /* Giao diện app sáng/tươi mát thì nền bản đồ GIS cũng đổi theo sang CARTO Sáng cho đồng bộ (mặc định GIS vẫn
 ở nền tối, đổi tay theme app không tự đụng tới nếu không có dòng này); quay lại chế độ tối thì trả GIS về nền tối. */
 if(typeof gisSetTheme==='function'){
 if(theme==='light'||theme==='green') gisSetTheme('light');
 else gisSetTheme('dark');
 }
 }
 /* overviewSvg/chartDimBodyHtml tạo canvas id mới (chartCanvasId()) ở mỗi lần render thay vì tái dùng 1 id cố định —
 khi container cha bị innerHTML=... ghi đè, canvas cũ bị gỡ khỏi DOM nhưng Chart.js instance của nó vẫn còn sống
 trong Chart.instances (không ai gọi .destroy()), tích tụ dần theo phiên làm việc. Quét & destroy các instance có
 canvas đã rời DOM trước mỗi lần vẽ lại/đổi theme để tránh rò rỉ này. */
 function destroyDetachedCharts(){
 if(typeof Chart==='undefined') return;
 Object.values(Chart.instances||{}).forEach(c=>{
 try{ if(c.canvas && !document.body.contains(c.canvas)) c.destroy(); }catch(e){}
 });
 }
 function refreshChartsForTheme(){
 if(typeof Chart==='undefined') return;
 destroyDetachedCharts();
 const instances=Object.values(Chart.instances||{});
 instances.forEach(c=>{
 try{
 const legendLabels=c.options?.plugins?.legend?.labels;
 if(legendLabels) legendLabels.color=chartLabelColor();
 if(c.options?.scales){
 Object.values(c.options.scales).forEach(sc=>{
 if(sc.ticks) sc.ticks.color=chartAxisColor();
 if(sc.grid) sc.grid.color=chartGridColor();
 });
 }
 if(c.config?.type==='doughnut'){
 (c.data.datasets||[]).forEach(ds=>{if(ds.borderColor) ds.borderColor=donutBorderColor();});
 }
 c.update();
 }catch(e){}
 });
 /* applyTheme() (gọi ngay trước hàm này trong setTheme()) thêm/bỏ class .theme-light/.theme-green trên <html> —
 đổi màu nền/viền của rất nhiều phần tử, có thể làm layout xung quanh biểu đồ đổi kích thước (reflow). c.update()
 ở trên chỉ đổi MÀU, không đo lại kích thước canvas — nếu không resize() lại, biểu đồ giữ nguyên kích thước cũ
 (tính từ trước lúc đổi theme), gây đúng hiện tượng "biểu đồ bị to/lệch" khi bấm đổi theme. Đợi 1 khung hình
 (requestAnimationFrame) cho reflow do đổi class chạy xong rồi mới resize(), để đo đúng kích thước container sau
 khi đã đổi theme thay vì trước đó. */
 if(instances.length) requestAnimationFrame(()=>instances.forEach(c=>{try{c.resize();}catch(e){}}));
 }
 function initTheme(){
 let saved=null;
 try{saved=localStorage.getItem(THEME_STORAGE_KEY);}catch(e){}
 applyTheme(saved==='light'||saved==='green'?saved:'dark');
 }
 /* Màu chữ dùng chung cho mọi biểu đồ Chart.js (canvas vẽ trực tiếp, không đọc được CSS) — gọi tại thời điểm khởi
 tạo chart để lấy đúng màu theo theme hiện tại. isLightTheme() = nền sáng nói chung (áp dụng cho cả .theme-light
 và .theme-green — cả 2 đều nền trắng, chữ tối, nên dùng chung 1 bộ màu chart). */
 function isLightTheme(){return document.documentElement.classList.contains('theme-light')||document.documentElement.classList.contains('theme-green');}
 function chartAxisColor(){return isLightTheme()?'#475569':'#a8c3d8';}
 function chartLabelColor(){return isLightTheme()?'#111827':'#dceeff';}
 function chartGridColor(){return isLightTheme()?'rgba(15,23,42,.18)':'rgba(87,178,255,.12)';}
 function donutBorderColor(){return document.documentElement.classList.contains('theme-green')?'#ffffff':(isLightTheme()?'#F9FAFB':'#04101d');}

