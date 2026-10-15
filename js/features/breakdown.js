 /* ===== Hiển thị phân tổ (breakdown) theo chỉ tiêu — dùng chung cho mọi nơi (card lưới, card lĩnh vực, drawer chi tiết) =====
 Quy tắc chọn biểu đồ:
 1) Phân tổ dạng % (nhãn có "%") → radial ring.
 2) Phân tổ dạng bar ≤3 mục và không mục nào quá nhỏ → thanh % xếp chồng (nhãn nổi).
 3) Phân tổ dạng bar 4+ mục, hoặc có mục < 8% tổng → thanh ngang xếp hạng (không xếp chồng).
 4) Phân tổ dạng stat khác (không phải %) → thẻ KPI rời. */
 const PART_PAL=['#2a78d6','#1baf7a','#eda100','#4a3aa7','#39d5ff','#d33a44','#898781'];
 function isPercentLabel(l){return /%/.test(l||'');}
 function radialRingSvg(pct,size,strokeW,color){
 pct=Math.max(0,Math.min(100,Number(pct)||0));
 const r=(size-strokeW)/2,c=size/2,circ=2*Math.PI*r,dash=circ*pct/100;
 return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${strokeW}"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${(c+size*0.07).toFixed(1)}" text-anchor="middle" font-size="${(size*0.24).toFixed(0)}" font-weight="900" fill="#fff">${Math.round(pct)}%</text></svg>`;
 }
 function shouldRankBar(items){
 const total=items.reduce((s,x)=>s+(Number(x.value)||0),0)||1;
 const minShare=Math.min(...items.map(x=>(Number(x.value)||0)/total));
 return items.length>=4||minShare<0.08;
 }
 /* Biểu đồ Chart.js thật (donut/bar ngang) cho phân tổ chỉ tiêu — dùng chung cho mọi lĩnh vực, cùng phong cách với dashboard Giáo dục */
 function chartCanvasId(){window.__dimChartSeq=(window.__dimChartSeq||0)+1;return `dimChart${window.__dimChartSeq}`;}
 function queueDimChart(id,type,labels,data,colors,centerText){(window.__pendingDimCharts=window.__pendingDimCharts||[]).push({id,type,labels,data,colors,centerText});}
 function flushPendingDimCharts(){
 const list=window.__pendingDimCharts||[]; window.__pendingDimCharts=[];
 if(typeof Chart==='undefined') return;
 destroyDetachedCharts();
 list.forEach(c=>{
 const canvas=document.getElementById(c.id); if(!canvas) return;
 const isDonut=c.type==='doughnut';
 const isLine=c.type==='line';
 const mainColor=c.colors[0]||'#39d5ff';
 const dataset=isLine
 ?{data:c.data,borderColor:mainColor,backgroundColor:mainColor+'2e',pointBackgroundColor:mainColor,pointBorderColor:mainColor,pointRadius:3.5,borderWidth:2,tension:.35,fill:true}
 :{data:c.data,backgroundColor:c.colors,hoverBackgroundColor:c.colors,borderColor:c.colors,hoverBorderColor:'#fff',borderWidth:isDonut?0:1,hoverBorderWidth:isDonut?3:2,borderRadius:isDonut?0:4,maxBarThickness:26,hoverOffset:isDonut?10:0};
 new Chart(canvas,{
 type:c.type,
 data:{labels:isDonut?c.labels.map((l,i)=>`${l}: ${fmt(c.data[i])}`):c.labels,datasets:[dataset]},
 options:{
 indexAxis:(!isDonut&&!isLine)?'y':undefined, responsive:true, maintainAspectRatio:false,
 cutout:isDonut?'68%':undefined,
 plugins:{
 legend:{display:isDonut,position:'bottom',labels:{color:chartLabelColor(),boxWidth:13,padding:8,font:{size:12,weight:700}}},
 tooltip:{backgroundColor:isLightTheme()?'#ffffff':'#0a2038',titleColor:isLightTheme()?'#111827':'#ffd54b',bodyColor:isLightTheme()?'#111827':'#fff',borderColor:'rgba(87,178,255,.5)',borderWidth:1,padding:10,displayColors:true,titleFont:{size:12,weight:700},bodyFont:{size:12}}
 },
 scales:isDonut?{}:isLine?{x:{ticks:{color:chartAxisColor(),font:{size:10}},grid:{display:false}},y:{beginAtZero:true,ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}}}:{x:{ticks:{color:chartAxisColor(),font:{size:10.5}},grid:{color:chartGridColor()}},y:{ticks:{color:chartLabelColor(),font:{size:11}},grid:{display:false}}}
 },
 plugins:(isDonut&&c.centerText)?[donutCenterTextPlugin(c.centerText.line1,c.centerText.line2)]:[]
 });
 });
 }
 function chartDimBodyHtml(p){
 const items=p.items; const id=chartCanvasId();
 const isDonut=!shouldRankBar(items);
 const colors=items.map((x,i)=>PART_PAL[i%PART_PAL.length]);
 queueDimChart(id,isDonut?'doughnut':'bar',items.map(x=>x.label),items.map(x=>Number(x.value)||0),colors);
 const h=isDonut?200:Math.max(120,items.length*34+20);
 return `<div style="position:relative;height:${h}px;margin-top:4px"><canvas id="${id}"></canvas></div>`;
 }
 function statDimBodyHtml(p){
 const pctItems=p.items.filter(x=>isPercentLabel(x.label));
 const plainItems=p.items.filter(x=>!isPercentLabel(x.label));
 let html='';
 if(pctItems.length) html+=`<div class="phanto-radial-row">${pctItems.map((x,i)=>`<div class="phanto-radial-item">${radialRingSvg(x.value,64,7,PART_PAL[i%PART_PAL.length])}<span>${esc(x.label.replace(/\s*\(%\)\s*$/,''))}</span></div>`).join('')}</div>`;
 if(plainItems.length) html+=`<div class="cir-stat-grid">${plainItems.map(x=>`<div class="cir-stat-tile"><p>${esc(x.label)}</p><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
 return html;
 }
 function phanToDimBodyHtml(p){return p.type==='stat'?statDimBodyHtml(p):chartDimBodyHtml(p);}
 function openCategoryItemDetail(role,catId,idx){
 toast('Tạm thời chưa hỗ trợ xem chi tiết chỉ tiêu con.'); return;
 }
 function openIndicator(role,idx){
 if(!allowedCategoryRoles().includes(role)){toast('Không có quyền xem chỉ tiêu này.');return}
 const item=indicators[role][idx]; const [name,count]=item;
 if(isScheduleIndicator(name)){openCalendar(role,name);return;}
 const rs=indicatorRecordsFor(role,name).map(r=>({...r,metric:'indicator'}));
 currentDrawerRecords=rs;
 activeIndicatorPieStatus='';
 document.getElementById('drawerTitle').textContent=`Chỉ tiêu: ${name}`;
 document.getElementById('drawerSub').textContent=`${fmt(count)} bản ghi · ${roleMeta(role).name}`;
 renderIndicatorList(currentDrawerRecords);
 openDrawer();
 }
 function indicatorCounts(rs=currentDrawerRecords){
 return CAT_ST.map(st=>({key:st.k,label:st.l,short:st.l,color:st.c,count:rs.filter(r=>r.status===st.k).length}));
 }
 function renderIndicatorList(rs){
 const counts=indicatorCounts(rs); const total=rs.length||1;
 document.getElementById('drawerBody').innerHTML=`<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="indicatorDonut"></div><button class="ghost" style="margin-top:8px" onclick="setIndicatorStatusFilter('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý theo trạng thái</h4><div class="pie-legend" id="indicatorPieLegend"></div></div></div><div class="filters"><input id="qInd" placeholder="Tìm chỉ tiêu/bản ghi..." oninput="renderIndicatorRows()"/><select id="stInd" onchange="activeIndicatorPieStatus=this.value;renderIndicatorRows()"><option value="">Tất cả trạng thái</option>${CAT_ST.map(s=>`<option value="${s.k}">${s.l}</option>`).join('')}</select><select id="unitInd" onchange="renderIndicatorRows()"><option value="">Tất cả đơn vị</option>${[...new Set(rs.map(r=>r.unit))].map(u=>`<option>${u}</option>`).join('')}</select><button class="ghost" onclick="openAssignmentForm()">Giao xử lý từ chỉ tiêu</button></div><div class="list-summary" id="indSummary"></div><div id="indRows"></div>`;
 document.getElementById('indicatorDonut').innerHTML=overviewSvg(counts.map(c=>({key:c.key,label:c.short,value:c.count,color:c.color})),total,fmt(activeIndicatorPieStatus?counts.find(c=>c.key===activeIndicatorPieStatus)?.count||0:total),activeIndicatorPieStatus?indicatorStatusMeta(activeIndicatorPieStatus).short:'Tổng bản ghi','indicatorPie');
 document.getElementById('indicatorPieLegend').innerHTML=counts.map(c=>`<button class="${activeIndicatorPieStatus===c.key?'active':''}" onclick="setIndicatorStatusFilter('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
 flushPendingOverviewDonuts();
 renderIndicatorRows();
 }
 function setIndicatorStatusFilter(status){
 activeIndicatorPieStatus=status||'';
 const sel=document.getElementById('stInd'); if(sel) sel.value=activeIndicatorPieStatus;
 renderIndicatorList(currentDrawerRecords);
 }
 function indicatorRowHtml(r){
 const progress=Number(r.progress||0);
 return `<button class="indicator-row" onclick="openIndicatorDetail('${r.id}')">
 <div class="indicator-id"><b>${r.id}</b><small>Chỉ tiêu</small></div>
 <div class="indicator-title"><div class="title">${r.title}</div><small>${roleMeta(r.role)?.icon||''} ${roleMeta(r.role)?.name||r.role} · ${r.unit}</small></div>
 <div class="indicator-status">${pillHtml(indicatorStatusMeta(r.status))}</div>
 <div class="indicator-source"><small>Nguồn</small><b>${r.source}</b></div>
 <div class="indicator-progress"><small>Tiến độ</small>${progressBarHtml(progress)}<b>${progress}%</b></div>
 </button>`;
 }
 function renderIndicatorRows(){
 const q=(document.getElementById('qInd')?.value||'').toLowerCase();
 const st=(document.getElementById('stInd')?.value||activeIndicatorPieStatus||'');
 const unit=document.getElementById('unitInd')?.value||'';
 activeIndicatorPieStatus=st;
 const rs=currentDrawerRecords.filter(r=>(!st||r.status===st)&&(!unit||r.unit===unit)&&(!q||[r.id,r.title,r.indicator,r.unit,r.source,r.freq].join(' ').toLowerCase().includes(q)));
 rs.sort((a,b)=>parseDMY(b.due)-parseDMY(a.due));
 const sourceLabel=rs[0]?.source||currentDrawerRecords[0]?.source||'--';
 const freqLabel=rs[0]?.freq||currentDrawerRecords[0]?.freq||'--';
 document.getElementById('indSummary').innerHTML=`<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge ok">Tổng chỉ tiêu: ${fmt(currentDrawerRecords.length)}</span><span class="badge">Nguồn: ${sourceLabel}</span><span class="badge">Tần suất: ${freqLabel}</span>${st?`<span class="badge" style="border-color:${indicatorStatusMeta(st).color};color:${indicatorStatusMeta(st).color}">${indicatorStatusMeta(st).label}</span>`:''}`;
 const holder=document.getElementById('indRows'); if(!holder)return;
 if(!rs.length){holder.innerHTML='<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';return;}
 holder.innerHTML=`<div class="indicator-table"><div class="indicator-table-head"><span>Mã bản ghi</span><span>Chỉ tiêu / đơn vị</span><span>Trạng thái</span><span>Nguồn</span><span>Tiến độ</span></div>${rs.map(indicatorRowHtml).join('')}</div>`;
 }

