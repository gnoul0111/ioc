 /* ===== Giao diện riêng cho "Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố" — 3 chỉ tiêu từ 1 eform, SỐ GIẢ LẬP (bql-config.js) =====
 Cùng khuôn với Sở VHTT, Văn phòng UBND: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp, các khối biểu đồ
 Chart.js (khối "Cách tính" đọc từ BQL_CT đang ẩn theo cờ SHOW_FORMULA_BOX; BQL_CT dùng để sinh tài liệu mô tả). Dùng lại các hàm vẽ của dashboard-vhtt.js (vhttTiles, vhttChartBox,
 vhttFormulaBox, vhttBar, vhttDonut, vhttWrap) nên nạp SAU dashboard-vhtt.js. Ô bên phải mặc định là bảng 126 phường/xã
 (bqlUnitTableHtml). Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initBqlCharts() gọi từ openCategoryDetail. */

 function bqlCt(key){ return BQL_CT.find(c=>c.key===key); }
 function bqlHead(key,extra){ const i=BQL_CT.findIndex(c=>c.key===key), ct=BQL_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 function bqlFormula(key){ return vhttFormulaBox(Object.assign({gdTitle:'Giả định, cần Ban Quản lý xác nhận'},bqlCt(key))); }
 const bqlP=(v)=>fmt(Math.round(v*10)/10)+'%';
 /* tên địa bàn ngắn cho trục biểu đồ */
 /* khối biểu đồ: ô chọn kỳ mặc định Quý (eform của Ban báo cáo theo quý) */
 function bqlChart(id,title,height,note){ return vhttChartBox(id,title,height,'Quý',note); }
 const bqlShort=(s)=>String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. ');

 /* ---------- Khối gộp "theo địa bàn": 2 số của cùng một địa bàn trên cùng một hàng ----------
 Hai đại lượng chênh nhau hàng nghìn lần (doanh nghiệp ~100, vốn ~100.000 tỷ) nên KHÔNG vẽ chung một trục hay hai trục
 trên một biểu đồ (dễ đọc sai). Thay vào đó: 2 biểu đồ cột ngang đặt cạnh nhau, dùng chung thứ tự hàng (xếp theo số chính),
 mỗi cột một thang đo riêng; tên địa bàn chỉ ghi ở cột trái. Di chuột vào một hàng ở cột nào cũng hiện đủ 2 số; bấm khối →
 bảng bên phải có cả 2 cột (populateDimDetailFromBox đọc tooltip của biểu đồ trái). */
 const BQL_PAIR={
 dn:{a:{label:'Doanh nghiệp đang hoạt động',color:'#2a78d6'},b:{label:'Vốn đăng ký (tỷ đồng)',color:'#7086FD'}},
 thuHut:{a:{label:'Vốn thu hút mới (tỷ đồng)',color:'#2a78d6'},b:{label:'Dự án mới',color:'#7086FD'}},
 sxkd:{a:{label:'Doanh thu (tỷ đồng)',color:'#2a78d6'},b:{label:'Vốn đầu tư hạ tầng (tỷ đồng)',color:'#7086FD'}}
 };
 const BQL_PAIR_LABEL_W=86;   // bề rộng cột tên địa bàn ở biểu đồ trái (cố định để tiêu đề cột thẳng hàng với vạch 0)
 function bqlPairBox(id,title,nRows,pair,note){
 const h=Math.max(160,nRows*24+34);
 const head=(x,pad)=>`<div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--text-secondary);padding-left:${pad}px;height:30px;overflow:hidden;line-height:1.2;margin-bottom:2px"><span style="flex:0 0 auto;width:9px;height:9px;border-radius:2px;background:${x.color}"></span><span>${esc(x.label)}</span></div>`;
 return catBoxHtml(title,`<div style="display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:10px;margin-top:8px">
 <div style="min-width:0">${head(pair.a,BQL_PAIR_LABEL_W)}<div style="position:relative;height:${h}px"><canvas id="${id}A"></canvas></div></div>
 <div style="min-width:0">${head(pair.b,0)}<div style="position:relative;height:${h}px"><canvas id="${id}B"></canvas></div></div>
 </div><p style="font-size:10.5px;color:var(--text-muted);margin:8px 0 0">Mỗi hàng là một địa bàn, xếp theo cột trái; mỗi cột có thang đo riêng.${note?' '+esc(note):''}</p>`,'Quý');
 }
 function bqlPair(id,rows,pair){
 const tip={callbacks:{title:(it)=>it.length?rows[it[0].dataIndex][0]:'',
 label:(c)=>[pair.a.label+': '+fmt(rows[c.dataIndex][1]),pair.b.label+': '+fmt(rows[c.dataIndex][2])]}};
 const draw=(side,x,col,showY)=>{
 const c=document.getElementById(id+side); if(!c) return;
 vhttChartInstances[id+side]=new Chart(c,{type:'bar',
 data:{labels:rows.map(r=>r[0]),datasets:[{label:x.label,data:rows.map(r=>r[col]),backgroundColor:x.color,borderRadius:4,maxBarThickness:14}]},
 options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,animation:false,
 /* không vẽ trục số: mỗi cột đã ghi số ở đầu cột; chừa chỗ bên phải cho số dài nhất (vd 112.600) */
 scales:{x:{display:false,beginAtZero:true,max:Math.max(1,...rows.map(r=>r[col]))*1.6},
 /* cột phải vẫn có nhãn (trong suốt, bề rộng 0) để Chart.js chừa lề trên/dưới giống cột trái → các hàng thẳng nhau */
 y:{ticks:{color:showY?chartLabelColor():'transparent',font:{size:10},autoSkip:false,callback:function(v){return bqlShort(this.getLabelForValue(v));}},grid:{display:false},
 afterFit:(s)=>{s.width=showY?BQL_PAIR_LABEL_W:0;}}},
 plugins:{valueLabels:false,legend:{display:false},tooltip:tip}},
 plugins:[VHTT_LABELS]});
 };
 draw('A',pair.a,1,true); draw('B',pair.b,2,false);
 }

 /* ---------- 3 chỉ tiêu ---------- */
 function bqlDnHtml(){
 const S=BQL_SUM.dn, q=2;
 return catBoxHtml(bqlHead('dn','tại 30/9/2026'),vhttTiles([
 ['Doanh nghiệp đang hoạt động',fmt(S.dn),'+'+fmt(S.dnQ[q]-S.dnQ[q-1])+' so với quý II'],
 ['Vốn đầu tư đăng ký',fmt(S.von),'tỷ đồng'],
 ['Lao động đang làm việc',fmt(S.ld),'+'+fmt(S.ldQ[q]-S.ldQ[q-1])+' so với quý II'],
 ['Lao động bình quân',fmt(Math.round(S.ldBq)),'người/doanh nghiệp'],
 ['Địa bàn có báo cáo',fmt(BQL_SUM.db),'trên 126 phường/xã']
 ]),bqlCt('dn').freq)
 +bqlChart('bqDnQuy','Doanh nghiệp và lao động theo quý',230,'Cột: số doanh nghiệp đang hoạt động · Đường: nghìn lao động. Số tại cuối mỗi quý, không cộng dồn.')
 +bqlPairBox('bqDnHang','Doanh nghiệp và vốn đầu tư đăng ký theo địa bàn — quý III',S.hang.length,BQL_PAIR.dn)
 +bqlChart('bqDnDt','Nhà đầu tư chính (số địa bàn có nêu)',220,'Một địa bàn nêu nhiều nhóm nhà đầu tư thì được đếm ở mỗi nhóm.')
 +bqlFormula('dn');
 }
 function bqlThuHutHtml(){
 const S=BQL_SUM.thuHut, q=2;
 const list=S.ganNhat.map(u=>`<div style="padding:8px 0;border-top:1px solid rgba(87,178,255,.16)">
 <div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:800"><span>${esc(u.ten)}</span><span style="white-space:nowrap">${fmt(u.vm[q])} tỷ đồng</span></div>
 <p style="font-size:11px;color:var(--text-secondary);margin:3px 0 0;line-height:1.45">${esc(u.ndGanNhat)}</p></div>`).join('');
 return catBoxHtml(bqlHead('thuHut'),vhttTiles([
 ['Lượt thành lập, điều chỉnh',fmt(S.tl)],['Dự án đầu tư mới',fmt(S.da),'quý III: '+fmt(S.daQ[q])],
 ['Vốn thu hút mới',fmt(S.vm),'tỷ đồng'],['Vốn bình quân',fmt(Math.round(S.vmBq*10)/10),'tỷ đồng/dự án mới']
 ]),bqlCt('thuHut').freq)
 +bqlChart('bqThQuy','Thu hút đầu tư theo quý',240,'Cột: lượt thành lập, điều chỉnh và số dự án mới · Đường: vốn thu hút mới (tỷ đồng).')
 +bqlPairBox('bqThHang','Vốn thu hút mới và dự án mới theo địa bàn — 9 tháng',S.hang.length,BQL_PAIR.thuHut,'Chỉ gồm địa bàn có dự án mới trong 9 tháng.')
 +catBoxHtml('Nội dung thành lập, điều chỉnh gần nhất — quý III',`<div style="margin-top:6px">${list}</div><p style="font-size:10.5px;color:var(--text-muted);margin:8px 0 0">6 địa bàn có vốn thu hút mới quý III lớn nhất; nội dung hiện nguyên văn như đơn vị nhập.</p>`,bqlCt('thuHut').freq)
 +bqlFormula('thuHut');
 }
 function bqlSxkdHtml(){
 const S=BQL_SUM.sxkd, db=BQL_SUM.db;
 return catBoxHtml(bqlHead('sxkd'),vhttTiles([
 ['Doanh thu sản xuất kinh doanh',fmt(S.dt),'tỷ đồng'],['Doanh thu bình quân',fmt(Math.round(S.dtLd)),'triệu đồng/lao động'],
 ['Vốn đầu tư hạ tầng',fmt(S.vh),'tỷ đồng'],['Hạ tầng đang triển khai',fmt(S.ht[1]),'địa bàn'],
 ['Đạt chuẩn môi trường',bqlP(S.mt[0]/db*100),S.mt[0]+'/'+db+' địa bàn']
 ]),bqlCt('sxkd').freq)
 +bqlChart('bqSxQuy','Doanh thu và vốn đầu tư hạ tầng theo quý (tỷ đồng)',240,'Cột: doanh thu sản xuất kinh doanh · Đường: vốn đầu tư hạ tầng (trục phải).')
 +bqlPairBox('bqSxHang','Doanh thu và vốn đầu tư hạ tầng theo địa bàn — 9 tháng',S.hang.length,BQL_PAIR.sxkd)
 +bqlChart('bqSxHt','Tình hình đầu tư kết cấu hạ tầng — quý III',210)
 +bqlChart('bqSxMt','Đạt chuẩn môi trường — quý III',210)
 +bqlFormula('sxkd');
 }
 const BQL_BUILDERS={dn:bqlDnHtml,thuHut:bqlThuHutHtml,sxkd:bqlSxkdHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined'){
 CUSTOM_CAT_ITEM_BUILDERS['ubnd-bqlkcnc']=BQL_CT.map(c=>BQL_BUILDERS[c.key]);
 }

 /* ---------- Biểu đồ (vẽ bằng vhttBar/vhttDonut, instance lưu chung trong vhttChartInstances với id bắt đầu "bq") ---------- */
 function initBqlCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('bq')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=BQL_SUM, Q=BQL_QUY;
 /* 1. Doanh nghiệp, vốn, lao động */
 vhttBar('bqDnQuy',Q,[{label:'Doanh nghiệp đang hoạt động',data:S.dn.dnQ,color:'#2a78d6',yAxisID:'y'},
 {type:'line',label:'Lao động (nghìn người)',data:S.dn.ldQ.map(v=>Math.round(v/100)/10),color:'#FD9843',yAxisID:'y1'}],{y1:true});
 bqlPair('bqDnHang',S.dn.hang,BQL_PAIR.dn);
 vhttBar('bqDnDt',BQL_DOI_TAC.map(g=>g[0]),[{label:'Số địa bàn',data:S.dn.doiTac,color:'#4a3aa7'}],{h:true});
 /* 2. Thu hút đầu tư */
 vhttBar('bqThQuy',Q,[{label:'Lượt thành lập, điều chỉnh',data:S.thuHut.tlQ,color:'#8ba7c2',yAxisID:'y'},{label:'Dự án mới',data:S.thuHut.daQ,color:'#2a78d6',yAxisID:'y'},
 {type:'line',label:'Vốn thu hút mới (tỷ đồng)',data:S.thuHut.vmQ,color:'#1baf7a',yAxisID:'y1'}],{y1:true});
 bqlPair('bqThHang',S.thuHut.hang,BQL_PAIR.thuHut);
 /* 3. Hạ tầng, sản xuất kinh doanh, môi trường */
 vhttBar('bqSxQuy',Q,[{label:'Doanh thu',data:S.sxkd.dtQ,color:'#2a78d6',yAxisID:'y'},
 {type:'line',label:'Vốn đầu tư hạ tầng',data:S.sxkd.vhQ,color:'#eda100',yAxisID:'y1'}],{y1:true});
 bqlPair('bqSxHang',S.sxkd.hang,BQL_PAIR.sxkd);
 vhttDonut('bqSxHt',BQL_HT.map((g,i)=>[g[0],S.sxkd.ht[i],g[1]]),fmt(S.db),'địa bàn');
 vhttDonut('bqSxMt',BQL_MT.map((g,i)=>[g[0],S.sxkd.mt[i],g[1]]),fmt(S.db),'địa bàn');
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã (số lấy thẳng từ BQL_UNITS, dòng đầu = cộng các địa bàn có số) ---------- */
 function bqlUnitTableHtml(){
 const U=BQL_UNITS, S=BQL_SUM, q=2, sum=(a)=>a.reduce((x,y)=>x+y,0);
 const cols=[
 {l:'Doanh nghiệp (30/9)',v:(u)=>fmt(u.dn[q]),t:fmt(S.dn.dn)},
 {l:'Vốn đăng ký (tỷ đồng)',v:(u)=>fmt(u.von[q]),t:fmt(S.dn.von)},
 {l:'Lao động (30/9)',v:(u)=>fmt(u.ld[q]),t:fmt(S.dn.ld)},
 {l:'Dự án mới 9 tháng',v:(u)=>fmt(sum(u.da)),t:fmt(S.thuHut.da)},
 {l:'Vốn thu hút mới (tỷ đồng)',v:(u)=>fmt(sum(u.vm)),t:fmt(S.thuHut.vm)},
 {l:'Doanh thu 9 tháng (tỷ đồng)',v:(u)=>fmt(sum(u.dt)),t:fmt(S.sxkd.dt)},
 {l:'Hạ tầng',v:(u)=>BQL_HT[u.ht][0],t:S.sxkd.ht[0]+' hoàn thành'},
 {l:'Môi trường',v:(u)=>BQL_MT[u.mt][0],t:S.sxkd.mt[0]+' đạt chuẩn'}
 ];
 /* đủ 126 phường/xã theo thứ tự danh mục «Địa bàn» của eform (dùng chung VPUB_DV); nơi không có khu, không báo cáo → "—" */
 const names=typeof VPUB_DV!=='undefined'?VPUB_DV:HN_UNIT_NAMES;
 const byName={}; U.forEach(u=>{byName[u.ten]=u;});
 const thead=`<tr><th>Địa bàn</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng ${names.length} phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=names.map(n=>{const u=byName[n];
 return u?`<tr><td>${esc(n)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`
 :`<tr style="color:var(--text-muted)"><td>${esc(n)}</td>${cols.map(()=>`<td class="num" style="text-align:right">—</td>`).join('')}</tr>`;}).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${names.length} phường/xã · ${esc(BQL_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của eform. Hiện ${U.length}/${names.length} phường/xã có khu công nghiệp, khu công nghệ cao và có báo cáo; nơi không có khu để "—". Dòng đầu là cộng ${names.length} phường/xã. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên địa bàn..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*110}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
