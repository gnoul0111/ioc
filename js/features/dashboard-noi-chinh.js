 /* ===== Giao diện riêng cho "Ban Nội chính Thành ủy" — đúng số liệu thật từ network JSON ===== */
 function noichinhTopKpiHtml(){
 return catBoxHtml('Tiếp công dân',`<div class="cir-stat-grid" style="margin-top:8px;margin-bottom:0"><div class="cir-stat-tile"><p>Tổng số cuộc tiếp công dân</p><b>3</b></div><div class="cir-stat-tile"><p>Tổng số lượt công dân</p><b>8</b></div></div>`,'Tuần');
 }
 const NOICHINH_VANBAN_DATA=[['An ninh trật tự',1],['Phòng chống tham nhũng lãng phí tiêu cực',3],['Cải cách tư pháp',3],['Công tác tham mưu xử lý vụ án vụ việc',1],['Tiếp nhận, xử lý đơn thư tiếp công dân',1]];
 function noichinhBox1Html(){
 return catBoxHtml('Số văn bản tham mưu trong tháng cho Thành ủy lãnh đạo chỉ đạo',`<div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhVanBanChart"></canvas></div>`);
 }
 let noichinhVanBanChartInstance=null;
 function initNoichinhVanBanChart(){
 const canvas=document.getElementById('noichinhVanBanChart'); if(!canvas||typeof Chart==='undefined') return;
 if(noichinhVanBanChartInstance){noichinhVanBanChartInstance.destroy();noichinhVanBanChartInstance=null;}
 noichinhVanBanChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:NOICHINH_VANBAN_DATA.map(d=>d[0]),datasets:[{data:NOICHINH_VANBAN_DATA.map(d=>d[1]),backgroundColor:'#FFE96B',borderRadius:3,maxBarThickness:30}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,suggestedMax:Math.max(...NOICHINH_VANBAN_DATA.map(d=>d[1]))+1,ticks:{stepSize:1,color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:8.5}},grid:{display:false}}},
 plugins:{legend:{display:false}}
 }
 });
 }
 function noichinhBox2Html(){
 return catBoxHtml('Vụ việc an toàn cháy nổ',`<div style="position:relative;height:190px;margin-top:8px"><canvas id="noichinhChayNoChart"></canvas></div>`);
 }
 let noichinhChayNoChartInstance=null;
 function initNoichinhChayNoChart(){
 const canvas=document.getElementById('noichinhChayNoChart'); if(!canvas||typeof Chart==='undefined') return;
 if(noichinhChayNoChartInstance){noichinhChayNoChartInstance.destroy();noichinhChayNoChartInstance=null;}
 noichinhChayNoChartInstance=new Chart(canvas,{
 type:'doughnut',
 data:{labels:['Ít nghiêm trọng: 58','Nghiêm trọng: 1'],datasets:[{data:[58,1],backgroundColor:['#6FD195','#7086FD'],borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,cutout:'68%',
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:10}}}}
 },
 plugins:[donutCenterTextPlugin('59','vụ việc')]
 });
 }
 const NOICHINH_KHIEUNAI_DATA=[['Khiếu nại đông người',90,'#00D5FF'],['Tố cáo đông người',606,'#E80054']];
 function noichinhBox3Html(){
 return catBoxHtml('Số lượt công dân theo khiếu nại, tố cáo đông người',`<div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhKhieuNaiChart"></canvas></div>`);
 }
 let noichinhKhieuNaiChartInstance=null;
 function initNoichinhKhieuNaiChart(){
 const canvas=document.getElementById('noichinhKhieuNaiChart'); if(!canvas||typeof Chart==='undefined') return;
 if(noichinhKhieuNaiChartInstance){noichinhKhieuNaiChartInstance.destroy();noichinhKhieuNaiChartInstance=null;}
 noichinhKhieuNaiChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:NOICHINH_KHIEUNAI_DATA.map(d=>d[0]),datasets:[{data:NOICHINH_KHIEUNAI_DATA.map(d=>d[1]),backgroundColor:NOICHINH_KHIEUNAI_DATA.map(d=>d[2]),borderRadius:3,maxBarThickness:60}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,suggestedMax:Math.ceil(Math.max(...NOICHINH_KHIEUNAI_DATA.map(d=>d[1]))*1.15),ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:10.5}},grid:{display:false}}},
 plugins:{legend:{display:false}}
 }
 });
 }
