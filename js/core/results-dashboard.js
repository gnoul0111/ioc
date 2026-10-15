 /* ============================== DASHBOARD KẾT QUẢ XỬ LÝ (mục giữa) ============================== */
 function renderMetricTabs(){
 const twScope=twOfficeScope();
 document.getElementById('metricTabs').innerHTML=Object.keys(metricMeta).map(m=>{
 let n;
 if(twScope){ n=records.filter(r=>r.role===currentRole && r.metric===m && twScope.ids.includes(r.officeId)).length; }
 else { const fixedTotal=axisFixedTotal(currentRole,currentSoId,m); n=fixedTotal!==null?fixedTotal:metricTotalVisible(m); }
 return `<button class="${activeMetric===m?'active':''}" onclick="setMetric('${m}')">${metricMeta[m].icon} ${metricMeta[m].label} <b class="mono">${fmt(n)}</b></button>`;
 }).join('')
 }
 function setMetric(m){
 activeMetric=m;renderMetricTabs();renderAxisDashboard();
 }
 function renderAxisDashboard(){
 const roles=allowedRoles();
 const twScope=twOfficeScope();
 const fixedDataset = axisFixedDataset(currentRole,currentSoId,activeMetric);
 const titleSuffix = currentSoId ? '' : (fixedDataset && fixedDataset.length>1 && currentRole==='UBND' && currentXaId==null ? ' THEO SỞ, NGÀNH' : ' THEO TRỤC');
 document.getElementById('axisDashboardTitle').textContent=`VĂN BẢN/NHIỆM VỤ${titleSuffix}`;
 const total=metricTotalVisible(activeMetric);
 const actionTitle = 'Xử lý văn bản/nhiệm vụ';
 const assignLockAttr=isReadOnlyViewAs()?'disabled title="Chỉ Thành ủy được thao tác khi xem IOC của cấp dưới"':'';
 const isDocMetric=activeMetric==='docIn'||activeMetric==='docOut';
 document.getElementById('axisActions').innerHTML=`
 <div class="axis-action-card"><h4>${metricMeta[activeMetric].icon} ${actionTitle}</h4><div class="axis-action-buttons"><button class="primary" ${assignLockAttr} onclick="openAssignmentForm(${isDocMetric?`'${activeMetric}'`:'null'})">＋ Giao nhiệm vụ</button></div></div>`;
 const activeStatusDefs=(activeMetric==='docIn'||activeMetric==='docOut')?docStatusDefs:statusDefs;
 /* Dashboard "Văn bản/nhiệm vụ" chỉ có ĐÚNG 1 kiểu cấu trúc hiển thị: donut Chart.js (pie-card) + legend bên cạnh,
 dù dữ liệu đến từ fixedDataset (Trung ương/sở-ngành/xã-phường) hay so sánh trực tiếp theo 4 trục. Trước đây 2
 nguồn dữ liệu này render ra 2 kiểu khác hẳn nhau (donut vs thanh ngang CSS thuần) — nay chỉ khác phần DỮ LIỆU
 (rows/topKpis), còn CÁCH VẼ (pie-card/donut/legend) dùng chung 100%. */
 let rows, topKpis;
 if(fixedDataset){
 const fixedTotal=fixedDataset.reduce((a,d)=>a+d.total,0);
 const fixedKeys=(fixedDataset[0]?.rows||[]).map(r=>r[0]);
 const fixedScope=JSON.stringify(fixedDataset.map(d=>d.role||d.soId)).replace(/"/g,"'");
 topKpis=fixedKeys.map(key=>{
 const n=fixedDataset.reduce((a,d)=>a+(d.rows.find(r=>r[0]===key)?.[1]||0),0);
 return `<button class="seg-kpi" onclick="openVptuDetailList('${activeMetric}',${fixedScope},'${esc(key)}')"><span>${esc(key)}</span><b class="mono" style="color:${STATUS_COLOR_MAP[key]}">${fmt(n)}</b><span>${pct(n,fixedTotal)}</span></button>`;
 }).join('');
 rows=fixedDataset.map((d,idx)=>{
 const rowScope=d.role||d.soId||'';
 return {
 group:'fixedAxis'+idx,
 icon: d.role?(roleMeta(d.role)?.icon||''):(d.soId?'':''),
 title: d.title,
 total: d.total,
 segments: d.rows.map(r=>({key:r[0],label:r[0],value:r[1],color:STATUS_COLOR_MAP[r[0]]})),
 segClick:s=>`openVptuDetailList('${activeMetric}',${rowScope?`'${rowScope}'`:'null'},'${esc(s.label)}','${esc(d.title)}')`
 };
 });
 document.getElementById('legend').innerHTML=fixedKeys.map(k=>`<span><i class="sw" style="background:${STATUS_COLOR_MAP[k]}"></i>${esc(k)}</span>`).join('');
 } else if(twScope){
 /* Tài khoản cấp Trung ương đang scoped thẳng vào 1 đơn vị con (Vụ/Cục/Văn phòng ban...) — lọc đúng records[]
 theo officeId trong phạm vi đơn vị đó (twOfficeScope()) thay vì luôn hiện nguyên số liệu cả trục TW_DANG/... */
 const scopedRecords=records.filter(r=>r.role===currentRole && r.metric===activeMetric && twScope.ids.includes(r.officeId));
 const data={}; activeStatusDefs.forEach(st=>data[st.key]=0);
 scopedRecords.forEach(r=>{ if(data[r.status]!=null) data[r.status]++; });
 const rowTotal=scopedRecords.length;
 const officeIdsJson=JSON.stringify(twScope.ids);
 topKpis=activeStatusDefs.map(st=>{
 const n=data[st.key]||0;
 return `<button class="seg-kpi" onclick="openList({metric:'${activeMetric}',role:'${currentRole}',officeIds:${officeIdsJson},status:'${st.key}',title:'${st.label} - ${twScope.title}'})"><span>${st.label}</span><b class="mono" style="color:${st.color}">${fmt(n)}</b><span>${pct(n,rowTotal)}</span></button>`
 }).join('');
 rows=[{
 group:'twOffice-'+currentOfficeId,
 icon: roleMeta(currentRole).icon,
 title: twScope.title,
 total: rowTotal,
 segments: activeStatusDefs.map(st=>({key:st.key,label:st.label,value:data[st.key]||0,color:st.color})),
 segClick:s=>`openList({metric:'${activeMetric}',role:'${currentRole}',officeIds:${officeIdsJson},status:'${s.key}',title:'${twScope.title} · ${s.label}'})`
 }];
 document.getElementById('legend').innerHTML=activeStatusDefs.map(s=>`<span><i class="sw" style="background:${s.color}"></i>${s.label}</span>`).join('');
 } else {
 topKpis=activeStatusDefs.map(st=>{
 const n=statusTotal(activeMetric,st.key,roles);
 return `<button class="seg-kpi" onclick="openList({metric:'${activeMetric}',status:'${st.key}',title:'${st.label} - ${metricMeta[activeMetric].short}'})"><span>${st.label}</span><b class="mono" style="color:${st.color}">${fmt(n)}</b><span>${pct(n,total)}</span></button>`
 }).join('');
 rows=roles.map(role=>{
 const data=segmentTemplate[role][activeMetric]; const rowTotal=sumObj(data);
 return {
 group:'axisRole-'+role,
 icon: roleMeta(role).icon,
 title: roleMeta(role).name,
 total: rowTotal,
 segments: activeStatusDefs.map(st=>({key:st.key,label:st.label,value:data[st.key]||0,color:st.color})),
 segClick:s=>`openList({metric:'${activeMetric}',role:'${role}',status:'${s.key}',title:'${roleMeta(role).name} · ${s.label}'})`
 };
 });
 document.getElementById('legend').innerHTML=activeStatusDefs.map(s=>`<span><i class="sw" style="background:${s.color}"></i>${s.label}</span>`).join('');
 }
 document.getElementById('segKpis').innerHTML=topKpis;
 document.getElementById('axisRows').innerHTML=`<div class="pie-grid" style="grid-template-columns:1fr">${rows.map(row=>{
 const donut=overviewSvg(row.segments,row.total,fmt(row.total),'Tổng',row.group);
 const legend=`<div class="pie-legend">${row.segments.map(s=>`<button onclick="${row.segClick(s)}"><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${fmt(s.value)}</b></button>`).join('')}</div>`;
 return `<article class="pie-card"><div><h3>${row.icon} ${esc(row.title)}</h3></div><div class="pie-card-body"><div class="pie-donut-wrap">${donut}</div><div>${legend}</div></div></article>`;
 }).join('')}</div>`;
 flushPendingOverviewDonuts();
 }

