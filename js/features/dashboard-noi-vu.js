 /* ===== Giao diện riêng cho "Sở Nội vụ" — đúng số liệu thật ===== */
 function noivuBox1Html(){
 return catBoxHtml('Tổng số chi trả an sinh cho người có công (Tháng 3/2026)',`
 <div style="position:relative;height:190px;margin-top:8px"><canvas id="noivuAnSinhChart"></canvas></div>
 <p style="text-align:center;margin:12px 0 4px"><span style="font-size:10px;color:var(--text-muted)">Tổng </span><b style="font-size:20px;color:#fff">228,987</b><span style="font-size:10px;color:var(--text-muted)"> tỷ đồng</span></p>
 <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
 <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span> Tổng số đã chi trả</span><b>228.987.078.109 đồng</b></div>
 <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span> Tổng số chưa chi trả</span><b>0 đồng</b></div>
 </div>`);
 }
 let noivuAnSinhChartInstance=null;
 function initNoivuAnSinhChart(){
 const canvas=document.getElementById('noivuAnSinhChart'); if(!canvas||typeof Chart==='undefined') return;
 if(noivuAnSinhChartInstance){noivuAnSinhChartInstance.destroy();noivuAnSinhChartInstance=null;}
 noivuAnSinhChartInstance=new Chart(canvas,{
 type:'pie',
 data:{labels:['Đã chi trả','Chưa chi trả'],datasets:[{data:[228987078109,0],backgroundColor:['#2fb174','#e0218a'],borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false}}}
 });
 }
 function noivuBox2Html(){
 return catBoxHtml('Tổng số CCVC khối chính quyền (Năm 2025)',`<div style="position:relative;height:220px;margin-top:8px"><canvas id="noivuCcvcChart"></canvas></div>`,'Năm');
 }
 let noivuCcvcChartInstance=null;
 function initNoivuCcvcChart(){
 const canvas=document.getElementById('noivuCcvcChart'); if(!canvas||typeof Chart==='undefined') return;
 if(noivuCcvcChartInstance){noivuCcvcChartInstance.destroy();noivuCcvcChartInstance=null;}
 noivuCcvcChartInstance=new Chart(canvas,{
 type:'doughnut',
 data:{labels:['Viên chức: 124.378','Công chức: 11.965'],datasets:[{data:[124378,11965],backgroundColor:['#7086FD','#6FD195'],borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:10}}}}},
 plugins:[donutCenterTextPlugin('136.343','CCVC')]
 });
 }
