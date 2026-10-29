 /* ============================== MỤC TỔNG QUAN (3 pie donut) ============================== */
 function queueOverviewDonut(id,segments,total,center,sub,group){
 (window.__pendingOverviewDonuts=window.__pendingOverviewDonuts||[]).push({id,segments,total,center,sub,group});
 }
 function flushPendingOverviewDonuts(){
 const list=window.__pendingOverviewDonuts||[]; window.__pendingOverviewDonuts=[];
 if(typeof Chart==='undefined') return;
 destroyDetachedCharts();
 const created=[];
 list.forEach(o=>{
 const canvas=document.getElementById(o.id); if(!canvas) return;
 const segs=o.segments.filter(s=>(s.value||0)>0);
 const labels=segs.map(s=>s.label), data=segs.map(s=>s.value||0), colors=segs.map(s=>s.color), keys=segs.map(s=>s.key);
 created.push(new Chart(canvas,{
 type:'doughnut',
 /* hoverOffset đã bỏ — khi trỏ chuột đúng vào 1 miếng, Chart.js đẩy miếng đó ra ngoài vài px, đồng thời lộ khe
 hở/lệch mép với 2 miếng liền kề (đặc biệt dễ thấy ở đường nối giữa miếng đầu và miếng cuối của cả vòng tròn) —
 trông giống bị "lẹm/lệch" một góc chứ không phải chủ đích, không cần thiết cho 1 dashboard báo cáo tĩnh. */
 data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0}]},
 options:{
 responsive:true,maintainAspectRatio:false,cutout:'66%',animation:false,
 plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${fmt(ctx.parsed)}`}}}
 },
 plugins:[donutCenterTextPlugin(o.center,o.sub),{
 id:'overviewDonutClick',
 afterEvent(chart,args){
 const e=args.event;
 const els=chart.getElementsAtEventForMode(e,'nearest',{intersect:true},false);
 chart.canvas.style.cursor=els.length?'pointer':'default';
 if(e.type==='click'&&els.length) openOverviewPieSegment(o.group,keys[els[0].index]);
 }
 }]
 }));
 });
 /* Lỗi kinh điển của Chart.js responsive: biểu đồ tạo NGAY sau khi gán innerHTML (trước khi trình duyệt kịp
 hoàn tất layout lưới .pie-grid 3 cột, nhất là khi mở trực tiếp bằng file:// — font/CSS có thể load lệch nhịp
 so với qua server) sẽ "chụp" nhầm kích thước container tạm thời lúc đó rồi giữ nguyên luôn, trong khi biểu đồ
 tạo sau (đã layout ổn định) lại đúng — biểu hiện là 1 vài donut méo to hẳn so với các donut còn lại dù cùng 1
 khung 150x150px. Ép resize() lại 1 lần sau khi trình duyệt đã sơn xong khung hình (requestAnimationFrame) để
 mọi canvas tự đo lại đúng kích thước container thật, không phụ thuộc thời điểm tạo chart nữa. */
 if(created.length) requestAnimationFrame(()=>created.forEach(c=>{try{c.resize();}catch(e){}}));
 }
 function overviewSvg(segments, total, center, sub, group){
 total = total || segments.reduce((a,s)=>a+(s.value||0),0) || 1;
 const id=chartCanvasId();
 queueOverviewDonut(id,segments,total,center,sub,group);
 return `<div style="position:relative;width:150px;height:150px;max-width:100%"><canvas id="${id}"></canvas></div>`;
 }
 function pieCard(title,note,segments,group,center,sub,extra='',headerExtra=''){
 const total=segments.reduce((a,s)=>a+(s.value||0),0);
 const legend = extra || `<div class="pie-legend">${segments.map(s=>`<button onclick="openOverviewPieSegment('${group}','${s.key}')"><i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value||0)}</b></button>`).join('')}</div>`;
 const headRow = headerExtra ? `<div class="pie-card-head-row"><h3>${title}</h3>${headerExtra}</div>` : `<h3>${title}</h3>`;
 return `<article class="pie-card"><div>${headRow}<div class="pie-note">${note}</div></div><div class="pie-card-body"><div class="pie-donut-wrap">${overviewSvg(segments,total,center??fmt(total),sub||'Tổng',group)}</div><div>${legend}</div></div></article>`;
 }
 /* Công thức "Kết quả xử lý" theo yêu cầu: 4 nhóm suy ra từ (trạng thái nhiệm vụ + hạn xử lý), không phải 1 trạng thái có sẵn.
    - Hoàn thành: status là 'done' hoặc 'closed' (đã xong/đã kết thúc vòng đời).
    - Các nhiệm vụ còn lại (new/pending/extend/revoked) được xếp theo hạn xử lý (due) so với hôm nay:
      quá hạn (due < hôm nay) → Chưa HT quá hạn; còn ≤7 ngày → Chưa HT gần hạn; còn lại → Chưa HT trong hạn. */
 const TASK_RESULT_BUCKETS=[
 {key:'done', label:'Hoàn thành', color:'#2fb174'},
 {key:'onTime', label:'Chưa HT trong hạn', color:'#2c7dd2'},
 {key:'dueSoon', label:'Chưa HT gần hạn', color:'#d8a50c'},
 {key:'overdue', label:'Chưa HT quá hạn', color:'#d33a44'}
 ];
 function taskResultBucket(r){
 if(r.status==='done'||r.status==='closed') return 'done';
 const dueMs=parseDMY(r.due);
 if(!dueMs) return 'onTime';
 const today=new Date(); today.setHours(0,0,0,0);
 const diffDays=Math.round((dueMs-today.getTime())/86400000);
 if(diffDays<0) return 'overdue';
 if(diffDays<=7) return 'dueSoon';
 return 'onTime';
 }
 function taskResultBucketMeta(key){return TASK_RESULT_BUCKETS.find(b=>b.key===key)||TASK_RESULT_BUCKETS[0]}
 function visibleTaskRecords(){return records.filter(r=>(r.metric==='assigned'||r.metric==='received')&&canSeeRole(r.role))}
 function taskResultBucketCount(key){return visibleTaskRecords().filter(r=>taskResultBucket(r)===key).length}
 /* Biến thể theo ĐÚNG 1 chiều (chỉ giao HOẶC chỉ nhận) — dùng cho 2 thẻ "Nhiệm vụ giao"/"Nhiệm vụ nhận" tách
    riêng ở tổng quan trang chủ, khác taskResultBucketCount() ở trên vốn gộp cả 2 chiều cho thẻ "Kết quả xử lý" cũ. */
 function visibleTaskRecordsByMetric(metric){return records.filter(r=>r.metric===metric&&canSeeRole(r.role))}
 function taskResultBucketCountByMetric(metric,key){return visibleTaskRecordsByMetric(metric).filter(r=>taskResultBucket(r)===key).length}
 function openOverviewTaskSegment(metric,key){
 const role=window.__overviewAxisSel?.[metric]||null;
 openList({metric,role,status:key,bucketStatus:true,title:`${taskResultBucketMeta(key).label} · ${metricMeta[metric].label}${role?' · '+roleMeta(role).name:''}`});
 }
 /* Lựa chọn "chọn trục" riêng cho mỗi thẻ Nhiệm vụ giao/nhận ở tổng quan trang chủ — lưu theo metric ('assigned'/
    'received') để 2 thẻ lọc độc lập nhau. '' = tất cả trục (mặc định, giữ nguyên hành vi cũ). */
 window.__overviewAxisSel = window.__overviewAxisSel || {};
 function setOverviewAxisFilter(metric,role){
 window.__overviewAxisSel[metric]=role||'';
 renderSummary();
 }
 /* customSelectHtml() (dropdown tự dựng, dùng chung khắp app — xem js/core/assign-task.js) không truyền tham số
 vào onchangeFn, chỉ gọi window[onchangeFn]() suông rồi để hàm đó tự đọc lại giá trị theo id — cần 1 hàm riêng
 cho mỗi thẻ (assigned/received) vì 2 dropdown độc lập nhau, không gộp chung được như setOverviewAxisFilter(). */
 function onOverviewAxisAssignedChange(){ setOverviewAxisFilter('assigned', document.getElementById('overviewAxisFilter_assigned')?.value||''); }
 function onOverviewAxisReceivedChange(){ setOverviewAxisFilter('received', document.getElementById('overviewAxisFilter_received')?.value||''); }
 /* Thẻ "Nhiệm vụ giao"/"Nhiệm vụ nhận" tách riêng (thay cho việc gộp chung 1 donut "Cơ cấu hồ sơ điều hành" +
    1 donut "Kết quả xử lý" như trước) — mỗi thẻ có donut breakdown 4 trạng thái kết quả xử lý CỦA RIÊNG chiều đó,
    kèm nút hành động riêng (actionsHtml) thay vì dùng chung legend-only như pieCard() gốc. */
 function taskMetricCard(metric,note,actionsFn){
 const allRecords=visibleTaskRecordsByMetric(metric);
 /* Lấy trục từ CHÍNH các bản ghi đang thấy (giống cách ô "Trục" trong drawer-list.js làm), không dùng allowedRoles()
    trực tiếp — vì canSeeRole() có 1 ngoại lệ (Đảng ủy khi đang xem thay 1 xã/phường cụ thể) không nằm trong
    allowedRoles() nhưng vẫn có bản ghi thấy được, tránh dropdown thiếu mất trục đó. */
 const roleOrder=[...AXIS_CANONICAL_ORDER,...TW_AXIS_REAL_ORDER];
 const roles=[...new Set(allRecords.map(r=>r.role))].sort((a,b)=>roleOrder.indexOf(a)-roleOrder.indexOf(b));
 const selRole=window.__overviewAxisSel[metric]||'';
 const scopedRecords=selRole?allRecords.filter(r=>r.role===selRole):allRecords;
 const segs=TASK_RESULT_BUCKETS.map(b=>({key:b.key,label:b.label,value:scopedRecords.filter(r=>taskResultBucket(r)===b.key).length,color:b.color}));
 const total=segs.reduce((a,s)=>a+s.value,0);
 const legend=`<div class="pie-legend">${segs.map(s=>`<button onclick="openOverviewTaskSegment('${metric}','${s.key}')"><i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value)}</b></button>`).join('')}</div>`;
 const extra=`${legend}<div class="pie-card-actions">${actionsFn(selRole)}</div>`;
 /* Chỉ hiện dropdown khi tài khoản thực sự thấy >1 trục — tài khoản phạm vi hẹp (VD 1 xã/phường, 1 sở) chỉ có
    đúng 1 role nên dropdown vô nghĩa, tự ẩn giống cách ô "Trục" trong drawer-list.js đang làm. */
 const axisSelectHtml = roles.length>1 ? `<div class="pie-card-axis-sel">${customSelectHtml('overviewAxisFilter_'+metric,roles.map(r=>({value:r,label:roleMeta(r).name})),selRole,'Tất cả trục',metric==='assigned'?'onOverviewAxisAssignedChange':'onOverviewAxisReceivedChange')}</div>` : '';
 return pieCard(metricMeta[metric].label,note,segs,'task_'+metric,fmt(total),metricMeta[metric].short,extra,axisSelectHtml);
 }

 function renderRoleScope(){
 const el=document.getElementById('roleScopeCards');if(!el)return;
 el.innerHTML=`<div class="top-overview-head"><div class="top-overview-title">Tổng quan điều hành theo tài khoản đăng nhập · Piechart, click xem chi tiết/giao nhiệm vụ</div><button class="mini-btn" onclick="toggleWidgetBody(this)">−</button></div><div class="top-overview-body widget-body" id="overviewPieBody"><div class="pie-grid" id="pieGrid"></div></div>`;
 }
 /* Thẻ "Lịch công tác/kỳ họp" ở tổng quan trang chủ đang ẩn tạm — anh (luonghd2k) sẽ làm lại phần này.
    CHỈ ẨN, KHÔNG XÓA code/dữ liệu bên dưới. Đổi lại true để hiện thẻ như cũ. */
 const SHOW_CALENDAR_OVERVIEW_CARD = false;
 function renderSummary(){
 ensureCalendarEvents(); const roles=allowedRoles();
 /* Thẻ "Văn bản" giữ nguyên phong cách pie-card cũ (đúng như "Cơ cấu hồ sơ điều hành" trước đây), chỉ thu hẹp lại
    còn 2 loại văn bản đến/đi — phần nhiệm vụ giao/nhận đã tách riêng thành 2 thẻ taskMetricCard() bên dưới thay
    vì gộp chung 4 loại vào 1 donut như bản cũ. */
 const docSegments=['docIn','docOut'].map((m,i)=>({key:m,label:metricMeta[m].short,value:metricTotalVisible(m),color:['#d8a50c','#8b5cf6'][i]}));
 const cal=calendarStatusCounts(); const calSegments=[{key:'today',label:'Hôm nay',value:cal.today,color:'#39d5ff'},{key:'upcoming',label:'Sắp diễn ra',value:cal.upcoming,color:'#d8a50c'},{key:'late',label:'Trễ xác nhận',value:cal.late,color:'#d33a44'},{key:'planned',label:'Đã lên lịch',value:cal.planned,color:'#2c7dd2'},{key:'done',label:'Đã hoàn thành',value:cal.done,color:'#2fb174'}];
 const next=getCalendarEventsForScope().filter(e=>['today','upcoming','late'].includes(eventState(e).key)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,3);
 const secretary=`<div class="secretary-list">${next.map(e=>{const st=eventState(e);return `<button class="secretary-row ${st.key==='late'?'danger':st.key==='upcoming'?'warn':''}" onclick="openMeetingDetail('${e.id}')"><span>${st.icon}</span><b>${e.title}</b><small>${eventDateShort(e)} ${e.time}</small></button>`}).join('')||'<div class="muted">Không có lịch cần nhắc.</div>'}<button class="ghost" onclick="openCalendar(null,'Lịch công tác - thư ký điều hành')">Mở calendar</button></div>`;
 const assignLockAttr=isReadOnlyViewAs()?'disabled title="Chỉ Thành ủy được thao tác khi xem IOC của cấp dưới"':'';
 const cards=[
 pieCard('Văn bản','Văn bản đến/đi trong phạm vi quyền.',docSegments,'doc',fmt(docSegments.reduce((a,s)=>a+s.value,0)),'Văn bản'),
 taskMetricCard('assigned','Theo dõi, đôn đốc nhiệm vụ đã giao',selRole=>{
 const listTitle=`Nhiệm vụ giao · ${selRole?roleMeta(selRole).name:currentAccount.title}`;
 return `<button class="ghost" onclick="openList({metric:'assigned',role:${selRole?`'${selRole}'`:'null'},title:'${listTitle}'})">Xem chi tiết</button><button class="primary" ${assignLockAttr} onclick="openAssignmentForm(null)">Thêm nhiệm vụ</button>`;
 }),
 taskMetricCard('received','Trực tiếp xử lý nhiệm vụ được giao',()=>`<button class="ghost" onclick="openOverviewPieSegment('metric','received')">Xem chi tiết theo 4 trục</button>`),
 SHOW_CALENDAR_OVERVIEW_CARD?pieCard('Lịch công tác/kỳ họp','Vai trò thư ký: ngày/tuần/tháng, lịch sắp họp và lịch trễ.',calSegments,'calendar',fmt(calSegments.reduce((a,s)=>a+s.value,0)),'Lịch',secretary):''
 ].join('');
 const body=document.getElementById('pieGrid');
 if(body){
 body.innerHTML=cards;
 ['overview-documents','overview-assigned','overview-received'].forEach((id,index)=>{if(body.children[index]) body.children[index].id=id;});
 }
 flushPendingOverviewDonuts();
 if(typeof uvApply==='function') uvApply(false);
 }
 function openOverviewPieSegment(group,key){
 if(group==='metric'){
 activeMetric=key; renderMetricTabs(); renderAxisDashboard();
 document.getElementById('axisDashboardWidget')?.scrollIntoView({behavior:'smooth',block:'center'});
 openList({metric:key,title:`${metricMeta[key].label} · ${currentAccount.title}`});
 return;
 }
 if(group==='doc'){
 openList({metric:key,title:`${metricMeta[key].label} · ${currentAccount.title}`});
 return;
 }
 if(group.startsWith('task_')){
 openOverviewTaskSegment(group.slice(5),key);
 return;
 }
 if(group==='status'){
 openList({metricIn:['assigned','received'],status:key,bucketStatus:true,title:`${taskResultBucketMeta(key).label} · Nhiệm vụ giao/nhận trong phạm vi được xem`});
 return;
 }
 if(group==='calendar'){
 openCalendar(null,'Lịch công tác/kỳ họp',key);
 return;
 }
 if(group==='drawerStatus'){ setDrawerPieStatus(key); return; }
 if(group==='indicatorPie'){ setIndicatorStatusFilter(key); return; }
 if(group==='vptuRole'){ filterVptuDrawerByStatus(key); return; }
 }

