 /* ============================== HELPERS ============================== */
 /* Gộp cả 2 bộ trạng thái (statusDefs nhiệm vụ + docStatusDefs văn bản) khi cần liệt kê "mọi trạng thái có thể gặp",
 vì 2 metric dùng 2 bộ khoá khác nhau nhưng có thể xuất hiện cùng lúc trong các view tổng hợp đa metric. */
 const ALL_STATUS_DEFS=[...statusDefs,...docStatusDefs.filter(d=>!statusDefs.some(s=>s.key===d.key))];
 function sumObj(o){return ALL_STATUS_DEFS.reduce((a,s)=>a+(o[s.key]||0),0)}
 function statusMeta(k){return statusDefs.find(s=>s.key===k)||docStatusDefs.find(s=>s.key===k)||statusDefs[0]}
 /* Pill trạng thái + thanh tiến độ dùng chung cho MỌI nơi hiển thị "chỉ tiêu"/hồ sơ (KPI tile, card lĩnh vực,
 dòng bảng drawer, modal chi tiết, card kịch bản...) — trước đây mỗi nơi tự viết lại style inline riêng nên
 cùng 1 trạng thái ra màu/kiểu khác nhau tùy chỗ. Layout của từng nơi vẫn giữ nguyên, chỉ phần dựng pill/progress
 dùng chung hàm này để đảm bảo đồng nhất tuyệt đối. */
 function pillHtml(st){return `<span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span>`;}
 function statusPillHtml(status){return pillHtml(statusMeta(status));}
 /* --p (0-100) cho .progress i dùng để bù background-size (xem theme-base.css): gradient của thanh tiến độ vốn
 định nghĩa trên chính khối "đã điền" (width theo %) nên trước đây LUÔN hiện đủ dải xanh lá→xanh dương dù mới
 điền 10% hay 100% — nhìn progress thấp cũng như đã gần xong. Truyền thêm % qua biến CSS để gradient co giãn
 đúng theo toàn thanh, chỉ hiện đúng đoạn màu tương ứng mức đã hoàn thành. */
 function progressBarHtml(progress){const p=Math.max(0,Math.min(100,Number(progress)||0));return `<div class="progress"><i style="width:${p}%;--p:${p}"></i></div>`;}
 /* Khối "Trạng thái xử lý" ở chi tiết nhiệm vụ nhánh (subtasks.js / scenarios.js / indicator-detail.js dùng chung):
 dòng "Trạng thái" đã ẩn theo yêu cầu (bật lại bằng SUBTASK_SHOW_STATE_ROW); thanh tiến độ + "x% hoàn thành" xếp giống
 hệt card "Mô tả & tiến độ" của hồ sơ chính (descProgressCardHtml ở record-detail.js). */
 const SUBTASK_SHOW_STATE_ROW=false;
 function subtaskProgressHtml(state,progress){const p=Math.max(0,Math.min(100,Number(progress)||0));return `${SUBTASK_SHOW_STATE_ROW?`<div class="kv"><b>Trạng thái</b><span>${state}</span></div>`:''}${progressBarHtml(p)}<p><b class="mono">${p}%</b> hoàn thành</p>`;}
 function fmt(n){return Number(n).toLocaleString('vi-VN')}
 function pct(n,d){return d?((n/d)*100).toFixed(1).replace('.',',')+'%':'0%'}
 function pad(n){return String(n).padStart(2,'0')}
 function pick(arr,i){return arr[i%arr.length]}
 function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function dueDate(i,status){const d=new Date();let delta={done:-i%15,doing:(i%12)+3,regular:30+(i%20),soon:(i%4)+1,risk:(i%3)+1,overdue:-(i%8+1),new:(i%10)+7,pending:(i%5)+1,extend:-(i%6+1),closed:-i%20,revoked:-(i%10+1),progress:(i%12)+3,dueSoon:(i%4)+1}[status]||5;d.setDate(d.getDate()+delta);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`}
 /* Ngày tạo lùi 0-9 ngày so với HÔM NAY thật (thay vì cố định tháng/năm) — để nhóm "Nhiệm vụ mới" (lọc created
 trong 3 ngày gần nhất, my-tasks-notify.js) luôn có dữ liệu mẫu bất kể chạy demo vào ngày nào. */
 function createdDateFor(i){const d=new Date();d.setDate(d.getDate()-(i%10));return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`}
 /* Ngày hôm nay thật, định dạng DD/MM/YYYY — dùng để fake vài nhiệm vụ mẫu có hạn ĐÚNG hôm nay (demo-data-
 generator.js), vì không status nào trong dueDate() từng ra delta=0 (mọi công thức đều +N/-N, không có 0 trần). */
 function todayDateStr(){const d=new Date();return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`}
 function progressFor(status,i){return {done:100,doing:45+(i%38),regular:70+(i%22),soon:65+(i%20),risk:38+(i%30),overdue:20+(i%35),new:i%20,pending:75+(i%20),extend:50+(i%25),closed:100,revoked:i%30,progress:45+(i%38),dueSoon:65+(i%20)}[status]||50}
 /* Nhãn n tháng gần nhất (tính đến tháng hiện tại) — dùng cho các biểu đồ xu hướng theo tháng của chỉ tiêu demo. */
 function trendMonthLabels(n){const out=[],base=new Date();for(let i=n-1;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth()-i,1);out.push(`Th.${d.getMonth()+1}/${d.getFullYear()}`);}return out;}
 /* Chuỗi số liệu n tháng tăng dần không đều, hội tụ đúng về "total" ở tháng cuối — seed khác nhau ra hình dạng
 đường khác nhau (không phải đường thẳng đều), nhưng vẫn xác định nên ổn định qua các lần render lại. */
 function trendSeriesFor(total,seed,n){
 const out=[]; let prev=0;
 for(let i=0;i<n;i++){
 const h=((seed+1)*(i+3)*2654435761)>>>0;
 const noise=0.55+((h%450)/1000);
 const v=Math.max(prev,Math.round(total*((i+1)/n)*noise));
 out.push(v); prev=v;
 }
 out[n-1]=total;
 return out;
 }
 function iso(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
 function parseISO(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,m-1,d)}
 /* Nhận cả yyyy-mm-dd: form giao nhiệm vụ (<input type=date>) lưu thẳng r.due/r.startDate dạng ISO — trước đây
 trả 0 nên nhiệm vụ tạo thật không bao giờ vào nhóm "Sắp hết hạn"/"Quá hạn" (kể cả tab KC/QT), hết 3 ngày "Mới" là mất. */
 function parseDMY(s){const str=String(s||'');const iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(str);if(iso)return new Date(+iso[1],iso[2]-1,+iso[3]).getTime();const [d,m,y]=str.split('/').map(Number); return (d&&m&&y)?new Date(y,m-1,d).getTime():0}
 function addDays(base,n){const d=new Date(base);d.setDate(d.getDate()+n);return d}
 /* Plugin dùng chung: hiện số liệu ngay trên/cạnh mỗi cột/hàng của mọi biểu đồ Chart.js dạng bar (dọc lẫn ngang) */
 if(typeof Chart!=='undefined'){
 Chart.register({
 id:'valueLabels',
 afterDatasetsDraw(chart){
 if(chart.config.type!=='bar') return;
 const {ctx}=chart;
 chart.data.datasets.forEach((ds,dsIndex)=>{
 const meta=chart.getDatasetMeta(dsIndex);
 meta.data.forEach((elem,i)=>{
 const raw=ds.data[i];
 if(raw===null||raw===undefined) return;
 const pos=elem.tooltipPosition();
 ctx.save();
 ctx.fillStyle=chartLabelColor();
 ctx.font="700 11px 'Be Vietnam Pro',sans-serif";
 if(chart.options.indexAxis==='y'){
 ctx.textAlign='left'; ctx.textBaseline='middle';
 ctx.fillText(fmt(raw),pos.x+6,pos.y);
 } else {
 ctx.textAlign='center'; ctx.textBaseline='bottom';
 ctx.fillText(fmt(raw),pos.x,pos.y-4);
 }
 ctx.restore();
 });
 });
 }
 });
 }

 /* Thứ tự hiển thị 4 trục LUÔN đồng bộ theo Đảng ủy → HĐND → UBND → MTTQ ở mọi tài khoản (không phải trục đang đăng nhập đứng đầu). */
 const AXIS_CANONICAL_ORDER=['DANG','HDND','UBND','MTTQ'];
 /* Cấp Trung ương không có khái niệm "trục quản lý toàn bộ 4 trục" như Đảng ủy Thành phố — mỗi tài khoản trục TW
 chỉ quản lý đúng phạm vi nhiệm vụ/văn bản của mình, trả về ngay [role] thay vì lọc qua AXIS_CANONICAL_ORDER
 (vốn chỉ chứa 4 mã trục Thành phố nên sẽ luôn lọc mất TW_*). Riêng TW_ALL (tài khoản "Trung ương" tổng hợp,
 giống hệt vai trò của Thành ủy ở cấp Thành phố) là NGOẠI LỆ duy nhất — trả về đủ cả 5 trục TW thật. */
 function allowedRoles(role=currentRole){
 if(role==='TW_ALL') return TW_AXIS_REAL_ORDER;
 if(isTwRole(role)) return [role];
 let visible;
 if(role==='DANG') visible=['DANG','HDND','UBND','MTTQ'];
 else if(role==='UBND') visible=['UBND'];
 else if(role==='HDND') visible=['HDND'];
 else if(role==='MTTQ') visible=['MTTQ'];
 else visible=[];
 return AXIS_CANONICAL_ORDER.filter(r=>visible.includes(r));
 }
 function canSeeRole(role){return allowedRoles().includes(role)||(role==='DANG'&&currentXaId!=null)}
 /* Văn bản (docIn/docOut) đã bật lại dữ liệu mẫu thật (trước đây tạm ẩn theo yêu cầu luonghd2k, ép về 0) —
 isDocMetric() vẫn giữ lại vì results-dashboard.js còn dùng để phân biệt nút hành động, chỉ bỏ điều kiện ép
 0 ở metricTotal/statusTotal. Đồng bộ với generateRecords() (demo-data-generator.js) đã bỏ ép count=0. */
 function isDocMetric(metric){return metric==='docIn'||metric==='docOut'}
 function metricTotal(role,metric){return sumObj(segmentTemplate[role][metric])}
 function statusTotal(metric,status,roles=allowedRoles()){return roles.reduce((a,r)=>a+(segmentTemplate[r]?.[metric]?.[status]||0),0)}
 function metricTotalVisible(metric){return allowedRoles().reduce((a,r)=>a+metricTotal(r,metric),0)}

