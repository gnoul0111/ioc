 /* ===== Giao diện riêng cho "Sở Văn hóa và Thể thao" — 6 chỉ tiêu theo 6 eform, SỐ GIẢ LẬP (vhtt-config.js) =====
 Cùng khuôn với các sở khác (Sở NN&MT, Nội vụ, Tài chính cũ): mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp,
 các khối biểu đồ Chart.js và 1 khối "Cách tính" (đọc từ VHTT_CT). Bấm một khối → bảng số liệu của khối đó hiện ở ô bên
 phải (cơ chế chung populateDimDetailFromBox). Ô bên phải mặc định là bảng 126 phường/xã (vhttUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js) nên nạp SAU subtasks.js; initVhttCharts() gọi từ openCategoryDetail. */

 /* Tách nhãn dài thành nhiều dòng cho trục biểu đồ (cột trái của drawer khá hẹp) */
 function vhttWrap(s,n){
 n=n||22; const words=String(s).split(' '), out=[]; let cur='';
 words.forEach(w=>{ if((cur+' '+w).trim().length>n && cur){out.push(cur);cur=w;} else cur=(cur+' '+w).trim(); });
 if(cur) out.push(cur); return out.length>1?out:out[0];
 }
 function vhttTiles(rows){
 return `<div class="cir-stat-grid" style="margin-top:8px;margin-bottom:0">${rows.map(r=>`<div class="cir-stat-tile"><p>${esc(r[0])}</p><b>${esc(r[1])}</b>${r[2]?`<small style="display:block;font-size:10px;color:var(--text-muted);margin-top:2px">${esc(r[2])}</small>`:''}</div>`).join('')}</div>`;
 }
 function vhttChartBox(id,title,height,freq,note){
 return catBoxHtml(title,`<div style="position:relative;height:${height||220}px;margin-top:8px"><canvas id="${id}"></canvas></div>${note?`<p style="font-size:10.5px;color:var(--text-muted);margin:8px 0 0">${esc(note)}</p>`:''}`,freq);
 }
 function vhttNoteHtml(txt){ return `<p style="font-size:10.5px;color:var(--text-muted);margin:8px 0 0">${esc(txt)}</p>`; }
 /* Khối "Cách tính": số liệu nào, lấy từ trường nào của eform, tính ra sao, kết quả với số hiện tại */
 /* Dạng danh sách (không dùng bảng 4 cột) vì cột trái của drawer hẹp — bảng bị cắt mất cột Kết quả */
 /* false = ẨN khối "Cách tính" ở mọi đơn vị dùng hàm này (Sở VHTT, Văn phòng UBND, Ban Quản lý KCNC & KCN) và ô "Cách tính ·" trong màn chi tiết của Sở Tài chính, Sở GD&ĐT, Trung tâm Phục vụ HCC (dashboard-stc/sgd/hcc.js đọc cùng cờ): cách tính đã có
    trong tài liệu mô tả chỉ tiêu (Word), không hiện trên giao diện nữa (anh yêu cầu 2026-10-05). Dữ liệu *_CT giữ nguyên. */
 const SHOW_FORMULA_BOX=false;
 function vhttFormulaBox(ct){
 if(!SHOW_FORMULA_BOX) return '';
 const sub='font-size:11px;color:var(--text-secondary);margin:3px 0 0;line-height:1.45';
 const rows=ct.f.map((x,i)=>`<div style="padding:9px 0;border-top:1px solid rgba(87,178,255,.16)">
 <div style="font-size:12px;font-weight:800">${i+1}. ${esc(x.so)}</div>
 <p style="${sub}"><b>Lấy từ trường:</b> ${esc(x.truong)}</p>
 <p style="${sub}"><b>Cách tính:</b> ${esc(x.cach)}</p>
 <p style="${sub}"><b>Kết quả:</b> ${esc(x.kq)}</p></div>`).join('');
 const gd=(ct.giaDinh||[]).map(t=>`<li>${esc(t)}</li>`).join('');
 return `<div class="cat-chart-box cat-item-row vhtt-formula" style="cursor:default">
 <h4 style="margin:0 0 6px">Cách tính số liệu</h4>
 <p style="${sub};margin:0 0 8px"><b>Nguồn:</b> eform "${esc(ct.eform)}". ${esc(ct.banGhi)}</p>
 ${rows}
 ${gd?`<div style="padding-top:9px;border-top:1px solid rgba(87,178,255,.16)"><div style="font-size:12px;font-weight:800">${esc(ct.gdTitle||'Giả định, cần Sở xác nhận')}</div><ul style="margin:4px 0 0;padding-left:18px;font-size:11px;color:var(--text-secondary);display:grid;gap:3px;line-height:1.45">${gd}</ul></div>`:''}
 </div>`;
 }
 function vhttHead(i,extra){ const ct=VHTT_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }

 /* ---------- 6 chỉ tiêu ---------- */
 function vhttCt08Html(){
 const S=VHTT_SUM.ct08, ct=VHTT_CT[0];
 return catBoxHtml(vhttHead(0),vhttTiles([
 ['Tổng số nhiệm vụ',fmt(S.tong)],['Đã hoàn thành',fmt(S.ht),VHTT_TACH_DUNG_HAN?fmt(Math.round(S.dungHanTyLe*10)/10)+'% đúng hạn':undefined],
 ['Tỷ lệ hoàn thành',fmt(Math.round(S.htTyLe*10)/10)+'%'],['Quá hạn chưa xong',fmt(S.quaHan)]
 ]),ct.freq)
 +vhttChartBox('vhCt08St','Nhiệm vụ theo tiến độ',220)
 +vhttChartBox('vhCt08Dv','Nhiệm vụ theo đơn vị chủ trì',300)
 +vhttChartBox('vhCt08Lk','Kế hoạch và thực tế hoàn thành (lũy kế theo tháng)',220,undefined,'Kế hoạch: số nhiệm vụ đã đến hạn hoàn thành. Thực tế: số nhiệm vụ đã báo Hoàn thành.')
 +vhttFormulaBox(ct);
 }
 function vhttDuanHtml(){
 const S=VHTT_SUM.duan, ct=VHTT_CT[1];
 return catBoxHtml(vhttHead(1),vhttTiles([
 ['Dự án theo NQ 80',fmt(S.da)],['Dự án đã bố trí vốn',fmt(S.daBt),fmt(Math.round(S.daBt/S.da*1000)/10)+'%'],
 ['Tổng vốn theo NQ 80',fmt(S.von),'tỷ đồng'],['Vốn đã bố trí',fmt(S.vonBt),fmt(Math.round(S.vonBt/S.von*1000)/10)+'% · tỷ đồng']
 ]),ct.freq)
 +vhttChartBox('vhDaVon','Vốn theo nhóm công trình (tỷ đồng)',280)
 +vhttChartBox('vhDaTd','Dự án theo tiến độ thực hiện',220)
 +vhttFormulaBox(ct);
 }
 function vhttNtgHtml(){
 const S=VHTT_SUM.ntg, D=VHTT_DATA.ntg, ct=VHTT_CT[2];
 return catBoxHtml(vhttHead(2),vhttTiles([
 ['Số hoạt động',fmt(S.hd)],['Lượt người tham gia',fmt(S.nguoi)],['Số buổi/đêm diễn',fmt(D.buoi)],
 ['Bình quân/hoạt động',fmt(Math.round(S.bq)),'người'],['Đã đối soát',fmt(Math.round(S.daDoiSoat/S.hd*1000)/10)+'%',fmt(S.daDoiSoat)+' hoạt động']
 ]),ct.freq)
 +vhttChartBox('vhNtgLoai','Theo loại hoạt động',240,undefined,'Cột: số hoạt động · Đường: nghìn lượt người tham gia.')
 +vhttChartBox('vhNtgQm','Theo quy mô',210)
 +vhttChartBox('vhNtgCap','Theo cấp tổ chức thực tế',170)
 +vhttChartBox('vhNtgThang','Diễn biến theo tháng',230,undefined,'Cột: số hoạt động · Đường: nghìn lượt người tham gia.')
 +vhttFormulaBox(ct);
 }
 function vhttDtHtml(){
 const S=VHTT_SUM.dt, D=VHTT_DATA.dt, ct=VHTT_CT[3];
 return catBoxHtml(vhttHead(3,'triệu đồng'),vhttTiles([
 ['Tổng doanh thu',fmt(S.tong),'triệu đồng']].concat(VHTT_SHOW_KE_HOACH_DT?[['So kế hoạch năm',fmt(Math.round(S.tong/D.keHoach*1000)/10)+'%','kế hoạch '+fmt(D.keHoach)]]:[]).concat([
 ['Chênh lệch thu – chi',fmt(S.cl),'triệu đồng'],['NSNN hỗ trợ',fmt(S.nsnn),'triệu đồng'],
 ['Lượt khán giả',fmt(S.khan)],['Giá vé bình quân',fmt(Math.round(S.giaVe)),'đồng/vé']
 ])),ct.freq)
 +vhttChartBox('vhDtKhoan','Cơ cấu nguồn thu',220)
 +vhttChartBox('vhDtDv','Doanh thu theo đơn vị nghệ thuật (triệu đồng)',280)
 +vhttChartBox('vhDtThang','Doanh thu, chi phí theo tháng (triệu đồng)',250,undefined,'Cột: doanh thu và chi phí trong tháng · Đường: doanh thu lũy kế'+(VHTT_SHOW_KE_HOACH_DT?' so với kế hoạch năm chia đều 12 tháng.':'.'))
 +vhttChartBox('vhDtHt','Doanh thu theo trạng thái hạch toán',220)
 +vhttFormulaBox(ct);
 }
 function vhttNtcnHtml(){
 const S=VHTT_SUM.ntcn, D=VHTT_DATA.ntcn, ct=VHTT_CT[4];
 return catBoxHtml(vhttHead(4),vhttTiles([
 ['Hoạt động đã diễn ra',fmt(S.tong)],['Số buổi/đêm diễn',fmt(D.buoi)],['Lượt nghệ sĩ, diễn viên',fmt(D.ngheSi)],['Lượt khán giả',fmt(D.khanGia)]
 ])+vhttNoteHtml('Chưa diễn ra: '+D.chuaDienRa.map(r=>r[0]+' '+r[1]).join(' · ')+'. Ngoài phân tổ chuẩn QĐ 4795: '+D.ngoaiQd+' hoạt động (cần giải trình).'),ct.freq)
 +vhttChartBox('vhNtcnThang','Theo tháng và loại hình',240)
 +vhttChartBox('vhNtcnTc','Theo tính chất',220)
 +vhttChartBox('vhNtcnQm','Theo quy mô',200)
 +vhttChartBox('vhNtcnNt','Theo loại hình nghệ thuật',290)
 +vhttChartBox('vhNtcnKp','Nguồn kinh phí (triệu đồng)',220)
 +vhttFormulaBox(ct);
 }
 function vhttBcHtml(){
 const S=VHTT_SUM.bc, D=VHTT_DATA.bc, ct=VHTT_CT[5];
 return catBoxHtml(vhttHead(5),vhttTiles([
 ['Tổng tin bài',fmt(S.tong)],['Tích cực',fmt(Math.round(S.cx[0]/S.tong*1000)/10)+'%',fmt(S.cx[0])+' tin'],
 ['Tiêu cực',fmt(Math.round(S.cx[2]/S.tong*1000)/10)+'%',fmt(S.cx[2])+' tin'],['Tiêu cực cần xử lý gấp',fmt(S.canXuLy),'khẩn cấp + cao'],
 ['Lượt xem',fmt(D.xem)+' tr'],['Lượt tiếp cận',fmt(D.reach)+' tr']
 ])+vhttNoteHtml('Lượt thích '+fmt(D.thich)+' triệu · chia sẻ '+fmt(D.chiaSe)+' triệu · bình luận '+fmt(D.binhLuan)+' triệu.'),ct.freq)
 +vhttChartBox('vhBcNguon','Theo loại nguồn và mức độ cảm xúc',290)
 +vhttChartBox('vhBcThang','Diễn biến theo tháng',240,undefined,'Cột: tổng tin bài · Đường: tin tích cực và tin tiêu cực.')
 +vhttChartBox('vhBcLv','Theo lĩnh vực',260)
 +vhttChartBox('vhBcUt','Tin tiêu cực theo mức ưu tiên xử lý',220)
 +vhttFormulaBox(ct);
 }
 const VHTT_BUILDERS={ct08:vhttCt08Html,duan:vhttDuanHtml,ntg:vhttNtgHtml,dt:vhttDtHtml,ntcn:vhttNtcnHtml,bc:vhttBcHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined'){
 CUSTOM_CAT_ITEM_BUILDERS['ubnd-vhtt']=VHTT_CT.map(c=>VHTT_BUILDERS[c.key]);
 }

 /* ---------- Biểu đồ ---------- */
 let vhttChartInstances={};
 function vhttAxis(o){
 o=o||{};
 const t=(c)=>({color:c,font:{size:10}});
 const sc={x:{stacked:!!o.stacked,beginAtZero:true,ticks:t(o.h?chartAxisColor():chartLabelColor()),grid:o.h?{color:chartGridColor()}:{display:false}},
 y:{stacked:!!o.stacked,beginAtZero:true,ticks:t(o.h?chartLabelColor():chartAxisColor()),grid:o.h?{display:false}:{color:chartGridColor()}}};
 const num=(v)=>fmt(v);
 if(o.h) sc.x.ticks.callback=num; else sc.y.ticks.callback=num;
 if(o.y1) sc.y1={position:'right',beginAtZero:true,ticks:Object.assign(t(chartAxisColor()),{callback:num}),grid:{display:false}};
 return sc;
 }
 function vhttLegend(show){ return {display:show!==false,position:'bottom',labels:{color:chartLabelColor(),boxWidth:11,font:{size:10}}}; }
 function vhttPctTip(){ return {callbacks:{label:(c)=>{const arr=c.dataset.data, tot=arr.reduce((a,b)=>a+b,0)||1; return `${String(c.label).replace(/:\s*[\d.,]+$/,'')}: ${fmt(c.raw)} (${fmt(Math.round(c.raw/tot*1000)/10)}%)`;}}}; }
 function vhttDonut(id,rows,center,unit){
 const c=document.getElementById(id); if(!c) return;
 vhttChartInstances[id]=new Chart(c,{type:'doughnut',
 data:{labels:rows.map(r=>`${r[0]}: ${fmt(r[1])}`),datasets:[{data:rows.map(r=>r[1]),backgroundColor:rows.map(r=>r[2]),borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:'66%',plugins:{legend:vhttLegend(),tooltip:vhttPctTip()}},
 plugins:[donutCenterTextPlugin(center,unit)]});
 }
 /* Số trên cột — thay plugin chung "valueLabels" (helpers.js) cho biểu đồ Sở VHTT: plugin chung vẽ cả số 0, vẽ cả điểm của
 đường và đặt số cạnh từng đoạn của cột xếp chồng (đè lên nhau). Ở đây: cột xếp chồng → số nằm trong đoạn (bỏ số 0 và
 đoạn quá hẹp) + tổng ở đầu cột; cột thường → số ở đầu cột; đường → không vẽ số. */
 const VHTT_LABELS={id:'vhttLabels',afterDatasetsDraw(chart){
 const {ctx}=chart, h=chart.options.indexAxis==='y', stacked=chart.options.scales&&chart.options.scales.x&&chart.options.scales.x.stacked;
 const bars=chart.data.datasets.map((ds,i)=>({ds,i})).filter(o=>o.ds.type!=='line'&&chart.isDatasetVisible(o.i));
 ctx.save(); ctx.font="700 10.5px 'Be Vietnam Pro',sans-serif";
 if(stacked){
 ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff';
 bars.forEach(({ds,i})=>chart.getDatasetMeta(i).data.forEach((el,j)=>{
 const v=ds.data[j]; if(!v) return;
 const size=h?Math.abs(el.x-el.base):Math.abs(el.base-el.y), txt=fmt(v);
 if(size<ctx.measureText(txt).width+6||(!h&&size<14)) return;
 ctx.fillText(txt,h?(el.x+el.base)/2:el.x,h?el.y:(el.y+el.base)/2);
 }));
 const last=bars[bars.length-1]; if(!last){ctx.restore();return;}
 ctx.fillStyle=chartLabelColor(); ctx.textAlign=h?'left':'center'; ctx.textBaseline=h?'middle':'bottom';
 chart.getDatasetMeta(last.i).data.forEach((el,j)=>{
 const tot=bars.reduce((a,o)=>a+(Number(o.ds.data[j])||0),0);
 let edge=null; bars.forEach(o=>{const e=chart.getDatasetMeta(o.i).data[j]; if(e&&o.ds.data[j]) edge=edge==null?(h?e.x:e.y):(h?Math.max(edge,e.x):Math.min(edge,e.y));});
 if(edge==null) return;
 if(h) ctx.fillText(fmt(tot),edge+6,el.y); else ctx.fillText(fmt(tot),el.x,edge-3);
 });
 } else {
 ctx.fillStyle=chartLabelColor(); ctx.textAlign=h?'left':'center'; ctx.textBaseline=h?'middle':'bottom';
 bars.forEach(({ds,i})=>chart.getDatasetMeta(i).data.forEach((el,j)=>{
 const v=ds.data[j]; if(v==null) return;
 if(h) ctx.fillText(fmt(v),el.x+5,el.y); else ctx.fillText(fmt(v),el.x,el.y-3);
 }));
 }
 ctx.restore();
 }};
 function vhttBar(id,labels,datasets,opt){
 const c=document.getElementById(id); if(!c) return;
 opt=opt||{};
 const sc=vhttAxis(opt);
 /* chừa chỗ cho số ở đầu cột */
 if(opt.h) sc.x.grace='14%'; else sc.y.grace='10%';
 vhttChartInstances[id]=new Chart(c,{type:'bar',
 data:{labels:labels,datasets:datasets.map(d=>{const {color,...rest}=d; return Object.assign({borderRadius:3,maxBarThickness:opt.h?22:34},d.type==='line'?{borderColor:color,backgroundColor:color,pointRadius:3.5,tension:.3,borderWidth:2,fill:false,order:1}:{backgroundColor:color,order:2},rest);})},
 options:{indexAxis:opt.h?'y':'x',responsive:true,maintainAspectRatio:false,animation:false,scales:sc,plugins:{valueLabels:false,legend:vhttLegend(datasets.length>1)}},
 plugins:opt.noLabels?[]:[VHTT_LABELS]});
 }
 function initVhttCharts(){
 Object.keys(vhttChartInstances).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const D=VHTT_DATA, S=VHTT_SUM, M=VHTT_MONTHS;
 /* 1. Chương trình 08-CT */
 /* gộp hoàn thành đúng hạn / chậm khi eform không có ngày hoàn thành thực tế (VHTT_TACH_DUNG_HAN) */
 vhttDonut('vhCt08St',vhttCt08Nhom(D.ct08.st,S.ct08.st).map(r=>[r[0].l,r[1],r[0].c]),fmt(S.ct08.tong),'nhiệm vụ');
 const ctDv=D.ct08.dv.map(r=>vhttCt08Nhom(D.ct08.st,r[1]));
 vhttBar('vhCt08Dv',D.ct08.dv.map(r=>vhttWrap(r[0],24)),ctDv[0].map((x,i)=>({label:x[0].l,data:ctDv.map(d=>d[i][1]),color:x[0].c})),{h:true,stacked:true});
 vhttBar('vhCt08Lk',M,[{type:'line',label:'Kế hoạch (đến hạn)',data:D.ct08.khLk,color:'#898781',borderDash:[5,4]},{type:'line',label:'Thực tế (đã hoàn thành)',data:D.ct08.htLk,color:'#1baf7a'}]);
 /* 2. Dự án 2026-2030 */
 vhttBar('vhDaVon',D.duan.nhom.map(r=>vhttWrap(r[0],22)),[{label:'Theo NQ 80',data:D.duan.nhom.map(r=>r[3]),color:'#7086FD'},{label:'Đã bố trí',data:D.duan.nhom.map(r=>r[4]),color:'#6FD195'}],{h:true});
 vhttDonut('vhDaTd',D.duan.td,fmt(S.duan.da),'dự án');
 /* 3. Người tham gia hoạt động nghệ thuật */
 vhttBar('vhNtgLoai',D.ntg.loai.map(r=>vhttWrap(r[0],12)),[{label:'Số hoạt động',data:D.ntg.loai.map(r=>r[1]),color:'#2a78d6',yAxisID:'y'},{type:'line',label:'Người tham gia (nghìn)',data:D.ntg.loai.map(r=>Math.round(r[2]/100)/10),color:'#FD9843',yAxisID:'y1'}],{y1:true});
 vhttDonut('vhNtgQm',D.ntg.quyMo,fmt(S.ntg.hd),'hoạt động');
 vhttBar('vhNtgCap',D.ntg.cap.map(r=>r[0]),[{label:'Số hoạt động',data:D.ntg.cap.map(r=>r[1]),color:'#39d5ff'}],{h:true});
 vhttBar('vhNtgThang',M,[{label:'Số hoạt động',data:D.ntg.thangHd,color:'#2a78d6',yAxisID:'y'},{type:'line',label:'Người tham gia (nghìn)',data:D.ntg.thangNguoi.map(v=>Math.round(v/100)/10),color:'#FD9843',yAxisID:'y1'}],{y1:true});
 /* 4. Doanh thu */
 vhttDonut('vhDtKhoan',D.dt.khoan.map((k,i)=>[k[0],S.dt.khoan[i],k[1]]),fmt(S.dt.tong),'triệu đồng');
 vhttBar('vhDtDv',D.dt.dv.map(r=>vhttWrap(r[0].replace(/^Nhà hát /,'NH '),20)),D.dt.khoan.map((k,i)=>({label:k[0],data:D.dt.dv.map(r=>r[1][i]),color:k[1]})),{h:true,stacked:true});
 vhttBar('vhDtThang',M,[{label:'Doanh thu',data:D.dt.thangDt,color:'#2a78d6',yAxisID:'y'},{label:'Chi phí trực tiếp',data:D.dt.thangCp,color:'#898781',yAxisID:'y'},{type:'line',label:'Doanh thu lũy kế',data:S.dt.lk,color:'#1baf7a',yAxisID:'y1'}].concat(VHTT_SHOW_KE_HOACH_DT?[{type:'line',label:'Kế hoạch lũy kế',data:S.dt.khLk,color:'#eda100',borderDash:[5,4],yAxisID:'y1'}]:[]),{y1:true,noLabels:true});
 vhttDonut('vhDtHt',D.dt.hachToan,fmt(S.dt.tong),'triệu đồng');
 /* 5. Hoạt động nghệ thuật chuyên nghiệp */
 vhttBar('vhNtcnThang',M,D.ntcn.loaiHinh.map((l,i)=>({label:l[0],data:D.ntcn.thang[i],color:l[1]})),{stacked:true});
 vhttDonut('vhNtcnTc',D.ntcn.tinhChat.map(r=>[r[0].replace('Kết hợp có thu và phục vụ chính trị','Kết hợp hai tính chất'),r[1],r[2]]),fmt(S.ntcn.tong),'hoạt động');
 vhttDonut('vhNtcnQm',D.ntcn.quyMo,fmt(S.ntcn.tong),'hoạt động');
 vhttBar('vhNtcnNt',D.ntcn.ngheThuat.map(r=>r[0]),[{label:'Số hoạt động',data:D.ntcn.ngheThuat.map(r=>r[1]),color:'#4a3aa7'}],{h:true});
 vhttDonut('vhNtcnKp',D.ntcn.kinhPhi,fmt(D.ntcn.kinhPhi.reduce((a,r)=>a+r[1],0)),'triệu đồng');
 /* 6. Báo chí, mạng xã hội */
 vhttBar('vhBcNguon',D.bc.nguon.map(r=>r[0]),D.bc.cx.map((c,i)=>({label:c[0],data:D.bc.nguon.map(r=>r[1][i]),color:c[1]})),{h:true,stacked:true});
 vhttBar('vhBcThang',M,[{label:'Tổng tin bài',data:D.bc.thangTong,color:'#2a78d6',yAxisID:'y'},{type:'line',label:'Tích cực',data:D.bc.thangTc,color:'#1baf7a',yAxisID:'y'},{type:'line',label:'Tiêu cực',data:D.bc.thangTieuCuc,color:'#d33a44',yAxisID:'y1'}],{y1:true});
 vhttBar('vhBcLv',D.bc.linhVuc.map(r=>r[0]),[{label:'Tin bài',data:D.bc.linhVuc.map(r=>r[1]),color:'#39d5ff'}],{h:true});
 vhttDonut('vhBcUt',D.bc.uuTien,fmt(S.bc.cx[2]),'tin tiêu cực');
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ----------
 Chia tổng Thành phố cho 126 đơn vị theo trọng số cố định (hash tên + khóa chỉ tiêu, các phường trung tâm nặng hơn),
 làm tròn theo phần dư lớn nhất nên cộng lại luôn đúng bằng tổng. conc càng lớn số càng dồn vào ít đơn vị. */
 const VHTT_CENTER=['Phường Hoàn Kiếm','Phường Cửa Nam','Phường Ba Đình','Phường Văn Miếu - Quốc Tử Giám','Phường Ô Chợ Dừa','Phường Hai Bà Trưng','Phường Tây Hồ','Phường Đống Đa','Phường Giảng Võ','Phường Ngọc Hà','Phường Cầu Giấy','Phường Láng'];
 function vhttHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
 function vhttWeights(names,key,conc){ return names.map(n=>Math.pow(0.3+(vhttHash(n+'|'+key)%1000)/1000*1.4,conc||1)*(VHTT_CENTER.includes(n)?4:1)); }
 function vhttSplit(total,names,key,conc,w){
 w=w||vhttWeights(names,key,conc);
 const ws=w.reduce((a,b)=>a+b,0)||1, raw=w.map(x=>total*x/ws), base=raw.map(Math.floor);
 let left=total-base.reduce((a,b)=>a+b,0);
 raw.map((v,i)=>[v-base[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,left).forEach(([,i])=>base[i]++);
 return base;
 }
 function vhttUnitCols(){
 const D=VHTT_DATA, S=VHTT_SUM;
 return [
 {l:'Hoạt động nghệ thuật',t:S.ntg.hd,k:'ntg',c:1.6},{l:'Người tham gia',t:S.ntg.nguoi,k:'nguoi',by:0},
 {l:'Hoạt động NT chuyên nghiệp',t:S.ntcn.tong,k:'ntcn',c:2.5},{l:'Doanh thu (triệu đồng)',t:S.dt.tong,k:'dt',c:4},
 {l:'Dự án 2026-2030',t:S.duan.da,k:'duan',c:3},{l:'Tin bài có gắn địa bàn',t:D.bc.coDiaBan,k:'bc',c:1.4}
 ];
 }
 function vhttUnitTableHtml(){
 const names=HN_UNIT_NAMES, cols=vhttUnitCols();
 /* by: chia theo số của cột khác (người tham gia chia theo số hoạt động của phường, nhân hệ số quy mô 0,6 – 1,4) —
 phường không có hoạt động thì không có người tham gia */
 const vals=[];
 cols.forEach((c,ci)=>{
 const w=c.by!=null?vals[c.by].map((v,i)=>v*(0.6+(vhttHash(names[i]+'|'+c.k)%800)/1000)):null;
 vals[ci]=vhttSplit(c.t,names,c.k,c.c,w);
 });
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Toàn Thành phố</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${fmt(c.t)}</td>`).join('')}</tr>`;
 const rows=names.map((n,ri)=>`<tr><td>${esc(n)}</td>${vals.map(v=>`<td class="num" style="text-align:right">${fmt(v[ri])}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${names.length} phường/xã · ${esc(VHTT_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập. Mỗi cột cộng theo trường Địa bàn (hoặc Đơn vị báo cáo) của eform tương ứng; dòng Toàn Thành phố bằng tổng các phường/xã. Chỉ tiêu Chương trình 08-CT không có địa bàn nên không có cột. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*120}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
