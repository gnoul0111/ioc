 /* ===== Giao diện riêng cho "Ban Tổ chức Thành ủy" — port đúng số liệu thật từ hệ thống IOC (network JSON) ===== */
 const TOCHUC_BIENCHE_DATA={labels:['Biên chế CBCC, VC','LĐHĐ theo Nghị định 111','LĐHĐ theo Nghị định 173'],giao:[5238,723,0],hienco:[4505,570,40]};
 function tochucBox1Html(){
 return catBoxHtml('Biên chế khối Đảng, đoàn thể',`<div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienCheChart"></canvas></div>`);
 }
 let tochucBienCheChartInstance=null;
 function initTochucBienCheChart(){
 const canvas=document.getElementById('tochucBienCheChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tochucBienCheChartInstance){tochucBienCheChartInstance.destroy();tochucBienCheChartInstance=null;}
 tochucBienCheChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:TOCHUC_BIENCHE_DATA.labels,datasets:[
 {label:'Số được giao',data:TOCHUC_BIENCHE_DATA.giao,backgroundColor:'#38A13E',borderRadius:3,maxBarThickness:36},
 {label:'Số hiện có',data:TOCHUC_BIENCHE_DATA.hienco,backgroundColor:'#C9FFCC',borderRadius:3,maxBarThickness:36}
 ]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,suggestedMax:Math.ceil(Math.max(...TOCHUC_BIENCHE_DATA.giao,...TOCHUC_BIENCHE_DATA.hienco)*1.15),ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:9.5}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:9.5}}}}
 }
 });
 }
 /* Chỉ có số liệu chính xác của Tháng 3/2026 (từ tooltip thật); 5 tháng trước ước lượng theo đúng hình dạng đường trong ảnh gốc */
 const TOCHUC_DANHGIA_MONTHS=['10/2025','11/2025','12/2025','01/2026','02/2026','03/2026'];
 const TOCHUC_DANHGIA_DATA=[
 {label:'Không hoàn thành nhiệm vụ',color:'#d33a44',data:[65,58,62,55,60,59]},
 {label:'Hoàn thành nhiệm vụ',color:'#d8a50c',data:[1250,1280,1230,1260,1240,1214]},
 {label:'Hoàn thành tốt nhiệm vụ',color:'#2fb174',data:[130000,127000,122000,131000,131000,115052]},
 {label:'Hoàn thành xuất sắc nhiệm vụ',color:'#39d5ff',data:[21500,22000,21800,22300,22400,22621]}
 ];
 function tochucBox2Html(){
 return catBoxHtml('Kết quả đánh giá cán bộ hàng tháng (Tháng 3/2026 chính xác — các tháng trước ước lượng theo xu hướng)',`<div style="position:relative;height:220px;margin-top:8px"><canvas id="tochucDanhGiaChart"></canvas></div>`);
 }
 let tochucDanhGiaChartInstance=null;
 function initTochucDanhGiaChart(){
 const canvas=document.getElementById('tochucDanhGiaChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tochucDanhGiaChartInstance){tochucDanhGiaChartInstance.destroy();tochucDanhGiaChartInstance=null;}
 tochucDanhGiaChartInstance=new Chart(canvas,{
 type:'line',
 data:{labels:TOCHUC_DANHGIA_MONTHS,datasets:TOCHUC_DANHGIA_DATA.map(s=>({label:s.label,data:s.data,borderColor:s.color,backgroundColor:s.color,pointBackgroundColor:s.color,pointRadius:4,tension:.3,fill:false}))},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,ticks:{color:chartAxisColor(),font:{size:9.5},callback:v=>(v/1000)+' nghìn'},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:9.5}},grid:{display:false}}},
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:10,font:{size:9}}}}
 }
 });
 }
 const TOCHUC_BIENDONG_DATA=[['Kết nạp mới',591,'#38A13E'],['Chuyển SHĐ đến',1357,'#00D5FF'],['Chuyển SHĐ đi',1021,'#FD9843'],['Xóa tên, cho ra khỏi Đảng',60,'#E80054'],['Từ trần',314,'#CACACA']];
 function tochucBox3Html(){
 return catBoxHtml('Biến động đảng viên theo thời gian',`<div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienDongChart"></canvas></div>`);
 }
 let tochucBienDongChartInstance=null;
 function initTochucBienDongChart(){
 const canvas=document.getElementById('tochucBienDongChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tochucBienDongChartInstance){tochucBienDongChartInstance.destroy();tochucBienDongChartInstance=null;}
 tochucBienDongChartInstance=new Chart(canvas,{
 type:'bar',
 data:{labels:TOCHUC_BIENDONG_DATA.map(d=>d[0]),datasets:[{data:TOCHUC_BIENDONG_DATA.map(d=>d[1]),backgroundColor:TOCHUC_BIENDONG_DATA.map(d=>d[2]),borderRadius:3,maxBarThickness:34}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,
 scales:{y:{beginAtZero:true,suggestedMax:Math.ceil(Math.max(...TOCHUC_BIENDONG_DATA.map(d=>d[1]))*1.15),ticks:{color:chartAxisColor(),font:{size:10}},grid:{color:chartGridColor()}},x:{ticks:{color:chartLabelColor(),font:{size:9}},grid:{display:false}}},
 plugins:{legend:{display:false}}
 }
 });
 }
 function donutCenterTextPlugin(line1,line2){
 return {
 id:'donutCenterText',
 afterDraw(chart){
 const {ctx,chartArea}=chart; if(!chartArea) return;
 const cx=(chartArea.left+chartArea.right)/2, cy=(chartArea.top+chartArea.bottom)/2;
 ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
 ctx.fillStyle=chartLabelColor(); ctx.font="700 17px 'Be Vietnam Pro',Arial,sans-serif";
 ctx.fillText(line1,cx,cy-8);
 ctx.fillStyle=chartAxisColor(); ctx.font="600 9.5px 'Be Vietnam Pro',Arial,sans-serif";
 ctx.fillText(line2,cx,cy+11);
 ctx.restore();
 }
 };
 }
 function tochucBox4Html(){
 return catBoxHtml('Cơ cấu tổ chức Đảng trực thuộc',`<div style="position:relative;height:190px;margin-top:8px"><canvas id="tochucCoCauChart"></canvas></div>`);
 }
 let tochucCoCauChartInstance=null;
 function initTochucCoCauChart(){
 const canvas=document.getElementById('tochucCoCauChart'); if(!canvas||typeof Chart==='undefined') return;
 if(tochucCoCauChartInstance){tochucCoCauChartInstance.destroy();tochucCoCauChartInstance=null;}
 tochucCoCauChartInstance=new Chart(canvas,{
 type:'doughnut',
 data:{labels:['Đảng bộ cơ sở: 862','Chi bộ cơ sở: 3.499'],datasets:[{data:[862,3499],backgroundColor:['#6f6fe0','#2fb174'],borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{
 responsive:true,maintainAspectRatio:false,animation:false,cutout:'68%',
 plugins:{legend:{position:'bottom',labels:{color:chartLabelColor(),boxWidth:12,font:{size:10}}}}
 },
 plugins:[donutCenterTextPlugin('4.361','TCCSĐ')]
 });
 }
 function tochucBox5Html(){
 const abroadRows=[['Công tác',60,'#39d5ff'],['Việc riêng',598,'#8fe3b0']];
 const maxAbroad=Math.max(...abroadRows.map(r=>r[1]));
 const abroadBars=abroadRows.map(r=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:14px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1]/maxAbroad*100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
 const policyRows=[['Nghỉ điều dưỡng',315,'#FFEF98'],['Thăm hỏi',15,'#FFC61B'],['Phúng viếng',14,'#E87F00'],['Lễ Tang',15,'#CACACA']];
 const maxPolicy=Math.max(...policyRows.map(r=>r[1]));
 const policyBars=policyRows.map(r=>`<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:12px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1]/maxPolicy*100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
 return catBoxHtml('Kết quả thực hiện công tác bảo vệ chính trị nội bộ',`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:10px">
 <div>
 <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Số cán bộ, đảng viên đi nước ngoài</p>
 ${abroadBars}
 </div>
 <div style="text-align:center">
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 8px">Kết quả thẩm định chính trị nội bộ</p>
 <b style="font-size:20px;color:#fff">2.304</b><span style="font-size:10px;color:var(--text-muted)"> trường hợp</span>
 <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;text-align:left">
 <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span> Có vấn đề về chính trị</span><b>36</b></div>
 <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span> Không có vấn đề</span><b>2.268</b></div>
 </div>
 </div>
 <div>
 <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Thực hiện chế độ, chính sách</p>
 ${policyBars}
 </div>
 </div>`,null,'margin-top:14px');
 }
