 /* ===== Giao diện riêng cho "Sở Nông nghiệp và Môi trường" — đúng số liệu thật từ network JSON ===== */
 const NNMT_GPMB_CATS=['Các dự án đầu tư xây dựng cầu','Các đường vành đai','Các Dự án cải tạo, nâng cấp đường giao thông đường bộ'];
 const NNMT_GPMB_INVEST=[754166193378,3772,22492140852];
 const NNMT_GPMB_KINHPHI=[711955448286,2587,106129450930];
 const NNMT_GPMB_PROJECTS=[5,3,6];
 function nnmtGpmbBoxHtml(){
 return catBoxHtml('Tổng hợp dữ liệu GPMB (Tuần 01/2026)',`<div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtGpmbChart"></canvas></div>`,'Tuần');
 }
 let nnmtGpmbChartInstance=null;
 function initNnmtGpmbChart(){
 const canvas=document.getElementById('nnmtGpmbChart'); if(!canvas||typeof Chart==='undefined') return;
 if(nnmtGpmbChartInstance){nnmtGpmbChartInstance.destroy();nnmtGpmbChartInstance=null;}
 nnmtGpmbChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:NNMT_GPMB_CATS,datasets:[
 {type:'bar',label:'Tổng mức đầu tư (đồng)',data:NNMT_GPMB_INVEST,backgroundColor:'#7086FD',borderRadius:3,maxBarThickness:40,yAxisID:'y',order:2},
 {type:'bar',label:'Tổng kinh phí GPMB (đồng)',data:NNMT_GPMB_KINHPHI,backgroundColor:'#6FD195',borderRadius:3,maxBarThickness:40,yAxisID:'y',order:2},
 {type:'line',label:'Tổng số dự án',data:NNMT_GPMB_PROJECTS,borderColor:'#FD9843',backgroundColor:'#FD9843',pointRadius:4,tension:.3,yAxisID:'y1',order:1}
 ]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{
 y:{beginAtZero:true,position:'left',ticks:{color:chartAxisColor(),font:{size:9},callback:v=>fmt(v)},grid:{color:chartGridColor()}},
 y1:{beginAtZero:true,position:'right',ticks:{color:chartAxisColor(),font:{size:9.5}},grid:{display:false}},
 x:{ticks:{color:chartLabelColor(),font:{size:9.5}},grid:{display:false}}
 },
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:11,font:{size:9.5}}}}
 }
 });
 }
 const NNMT_DATDAI_CATS=['Nhóm đất nông nghiệp','Nhóm đất phi nông nghiệp','Nhóm đất chưa sử dụng'];
 const NNMT_DATDAI_SERIES=[
 {label:'Diện tích sử dụng',color:'#7086FD',data:[173264,138336,2342]},
 {label:'Diện tích được giao quản lý',color:'#6FD195',data:[22042,66659,2338]}
 ];
 function nnmtDatDaiBoxHtml(){
 return catBoxHtml('Thống kê tình hình sử dụng đất đai — ha (Năm 2025)',`<div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtDatDaiChart"></canvas></div>`,'Năm');
 }
 let nnmtDatDaiChartInstance=null;
 function initNnmtDatDaiChart(){
 const canvas=document.getElementById('nnmtDatDaiChart'); if(!canvas||typeof Chart==='undefined') return;
 if(nnmtDatDaiChartInstance){nnmtDatDaiChartInstance.destroy();nnmtDatDaiChartInstance=null;}
 nnmtDatDaiChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:NNMT_DATDAI_CATS,datasets:NNMT_DATDAI_SERIES.map(s=>({label:s.label,data:s.data,backgroundColor:s.color,borderRadius:3,maxBarThickness:40}))},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:10.5}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:10}}}}
 }
 });
 }
