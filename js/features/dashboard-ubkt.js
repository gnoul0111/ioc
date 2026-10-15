 /* ===== Giao diện riêng cho "Ủy ban Kiểm tra Thành ủy" — port đúng số liệu & bố cục từ ảnh số liệu thật UBKT cung cấp ===== */
 function ubktBox1Html(){
 return catBoxHtml('Giám sát của UBKT các cấp',`
 <p style="text-align:center;margin:8px 0 16px"><span style="font-size:10px;color:var(--text-muted)">Tổng: </span><b style="font-size:24px;color:#fff">233</b></p>
 <div style="display:flex;flex-direction:column;gap:9px">
 <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span> Tổ chức Đảng</span><b>109</b></div>
 <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span> Đảng viên</span><b>124</b></div>
 </div>`);
 }
 function ubktBox2Html(){
 const grp=(label,total,to,dv)=>`<div style="background:rgba(44,125,210,.16);border:1px solid rgba(44,125,210,.4);border-radius:10px;padding:10px 12px">
 <div style="display:flex;justify-content:space-between;font-weight:800;color:#fff;font-size:11.5px"><span>${label}</span><span>${fmt(total)}</span></div>
 <div style="margin-top:9px;font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between"><span> Tổ chức Đảng</span><b>${fmt(to)}</b></div>
 <div style="font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between;margin-top:4px"><span> Đảng viên</span><b>${fmt(dv)}</b></div>
 </div>`;
 return catBoxHtml('Kiểm tra giám sát của cấp ủy các cấp và chi bộ',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${grp('Kiểm tra',574,256,318)}${grp('Giám sát',475,228,247)}</div>`);
 }
 function ubktBox3Html(){
 const rows=[['Cách chức','#2c7dd2'],['Cảnh cáo','#d8a50c'],['Khiển trách','#d25a19'],['Khai trừ','#d33a44']];
 const vals={'Đảng viên':[1,6,8,20],'Tổ chức Đảng':[0,0,0,0]};
 const col=(label,icon)=>`<div style="background:rgba(44,125,210,.16);border:1px solid rgba(44,125,210,.4);border-radius:10px;padding:10px 12px">
 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:800;color:#fff;font-size:11.5px">${label}</span><span style="background:rgba(44,125,210,.16);border-radius:8px;padding:2px 8px;font-size:11px">${icon}</span></div>
 ${rows.map((r,i)=>`<div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:#b7d4ee;margin-top:5px"><i style="width:8px;height:8px;border-radius:50%;background:${r[1]};display:inline-block;flex:0 0 auto"></i><span style="flex:1">${r[0]}</span><b>${vals[label][i]}</b></div>`).join('')}
 </div>`;
 return catBoxHtml('Thi hành kỷ luật',`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${col('Đảng viên','')}${col('Tổ chức Đảng','')}</div>`);
 }
 function ubktBox4Html(){
 const rows=[
 ['Kiểm tra tổ chức đảng cấp dưới thực hiện nhiệm vụ KTGS',42,'#2c7dd2'],
 ['Kiểm tra việc thi hành kỷ luật của tổ chức đảng cấp dưới',6,'#1baf7a'],
 ['Về thu, chi ngân sách và sản xuất kinh doanh',0,'#d33a44'],
 ['Về thu, nộp, quản lý và sử dụng đảng phí',43,'#8b5cf6']
 ];
 return catBoxHtml('Kiểm tra của UBKT các cấp (kiểm tra việc thực hiện nhiệm vụ KTGS và THKL và tài chính đảng)',`<div style="display:grid;gap:10px;margin-top:8px">${rows.map(r=>`<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#dceeff"><i style="width:9px;height:9px;border-radius:50%;background:${r[2]};flex:0 0 auto"></i><span style="flex:1">${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('')}</div>`);
 }
 const UBKT_DOAN_DATA=[
 ['Đoàn 1',2,2,2,8],['Đoàn 2',3,3,0,40],['Đoàn 3',3,3,0,8],['Đoàn 4',3,3,0,14],
 ['Đoàn 5',3,3,0,12],['Đoàn 6',3,3,0,31],['Đoàn 7',3,3,2,19],['Đoàn 8',4,4,4,23],
 ['Đoàn 9',4,4,0,19],['Đoàn 10',4,4,0,37],['Đoàn 11',4,4,0,31],['Đoàn 12',4,4,0,30]
 ];
 function ubktChartBoxHtml(){
 return catBoxHtml('Thống kê tình hình đoàn kiểm tra, giám sát',`<div style="overflow-x:auto"><div style="position:relative;height:320px;min-width:${UBKT_DOAN_DATA.length*150}px"><canvas id="ubktDoanChart"></canvas></div></div>`,'Tháng','margin-top:14px');
 }
 let ubktDoanChartInstance=null;
 function initUbktDoanChart(){
 const canvas=document.getElementById('ubktDoanChart'); if(!canvas||typeof Chart==='undefined') return;
 if(ubktDoanChartInstance){ubktDoanChartInstance.destroy();ubktDoanChartInstance=null;}
 const labels=UBKT_DOAN_DATA.map(d=>d[0]);
 const series=[
 {label:'Đơn vị đã công bố/triển khai QĐ',color:'#7c6fe0',idx:1},
 {label:'Đơn vị đã báo cáo',color:'#39d5ff',idx:2},
 {label:'Đơn vị được kiểm tra đã làm việc',color:'#eda100',idx:3},
 {label:'Khó khăn, kiến nghị',color:'#ffd54b',idx:4}
 ];
 ubktDoanChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels,datasets:series.map(s=>({label:s.label,data:UBKT_DOAN_DATA.map(d=>d[s.idx]),backgroundColor:s.color,borderRadius:3,maxBarThickness:16}))},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 categoryPercentage:0.85,barPercentage:0.85,
 scales:{y:{min:0,max:60,ticks:{stepSize:10,color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:10}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:9.5}}}}
 }
 });
 }
