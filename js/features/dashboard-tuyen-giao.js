 /* ===== Giao diện riêng cho "Ban Tuyên giáo và Dân vận Thành ủy" — đúng số liệu thật từ network JSON ===== */
 const TUYENGIAO_DULUAN_CATS=['Tin bài tuyên truyền qua các kênh thông tin','Số báo cáo viên hiện có cấp TP/ cơ sở','Số CTV hiện có cấp TP/ cơ sở'];
 const TUYENGIAO_DULUAN_SERIES=[
 {label:'Tin bài tuyên truyền qua các kênh thông tin',color:'#FFC300',data:[474,0,0]},
 {label:'Cấp TP',color:'#6FD195',data:[0,324,70]},
 {label:'Cấp cơ sở',color:'#93C381',data:[0,660,882]}
 ];
 function tuyengiaoBox1Html(){
 return catBoxHtml('Nắm bắt dư luận xã hội (Tuần 10/2026)',`<div style="position:relative;height:300px;margin-top:8px"><canvas id="tuyengiaoDuLuanChart"></canvas></div>`,'Tuần');
 }
 let tuyengiaoDuLuanChartInstance=null;
 function initTuyengiaoDuLuanChart(){
 const canvas=document.getElementById('tuyengiaoDuLuanChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tuyengiaoDuLuanChartInstance){tuyengiaoDuLuanChartInstance.destroy();tuyengiaoDuLuanChartInstance=null;}
 tuyengiaoDuLuanChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:TUYENGIAO_DULUAN_CATS,datasets:TUYENGIAO_DULUAN_SERIES.map(s=>({label:s.label,data:s.data,backgroundColor:s.color,borderRadius:3,maxBarThickness:40}))},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,suggestedMax:Math.ceil(Math.max(...TUYENGIAO_DULUAN_SERIES.flatMap(s=>s.data))*1.15),ticks:{color:chartAxisColor(),font:{size:11}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:10.5}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:11}}}}
 }
 });
 }
 const TUYENGIAO_DANVAN_CATS=['Cấp xã, phường','Cấp cơ sở','Cấp thành phố'];
 const TUYENGIAO_DANVAN_BARS=[
 {label:'Lĩnh vực kinh tế',color:'#7086FD',data:[1126,873,210]},
 {label:'Lĩnh vực văn hóa - xã hội',color:'#6FD195',data:[6655,4618,719]},
 {label:'Lĩnh vực an ninh quốc phòng',color:'#FD9843',data:[1103,692,122]},
 {label:'Lĩnh vực xây dựng hệ thống chính trị',color:'#FFD54B',data:[1163,948,185]}
 ];
 const TUYENGIAO_DANVAN_LINES=[
 {label:'Tổng số tập thể đăng ký',color:'#eda100',data:[6335,3790,847]},
 {label:'Tổng số cá nhân đăng ký',color:'#39d5ff',data:[3712,3341,389]}
 ];
 function tuyengiaoBox2Html(){
 return catBoxHtml('Tổng hợp việc đăng ký thực hiện mô hình dân vận khéo (Năm 2026)',`<div style="position:relative;height:320px;margin-top:8px"><canvas id="tuyengiaoDanVanChart"></canvas></div>`,'Năm');
 }
 let tuyengiaoDanVanChartInstance=null;
 function initTuyengiaoDanVanChart(){
 const canvas=document.getElementById('tuyengiaoDanVanChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tuyengiaoDanVanChartInstance){tuyengiaoDanVanChartInstance.destroy();tuyengiaoDanVanChartInstance=null;}
 const barDatasets=TUYENGIAO_DANVAN_BARS.map(s=>({type:'bar',label:s.label,data:s.data,backgroundColor:s.color,borderRadius:3,maxBarThickness:26,order:2}));
 const lineDatasets=TUYENGIAO_DANVAN_LINES.map(s=>({type:'line',label:s.label,data:s.data,borderColor:s.color,backgroundColor:s.color,pointRadius:4,tension:.3,fill:false,order:1}));
 tuyengiaoDanVanChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:TUYENGIAO_DANVAN_CATS,datasets:[...barDatasets,...lineDatasets]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,ticks:{color:chartAxisColor(),font:{size:10.5},callback:v=>(v/1000)+' nghìn'},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:11}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:11,font:{size:10}}}}
 }
 });
 }
