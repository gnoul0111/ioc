 /* ===== Giao diện riêng cho "Sở Xây dựng" — 4 chỉ tiêu theo 4 eform, SỐ GIẢ LẬP (sxd-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ Chart.js
 (cách tính chỉ nằm trong tài liệu mô tả). Không hiện số hiệu "chỉ số 20, 24, 84, 68, 69" trên giao diện.
 Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js. Ô bên phải: bảng 126 phường/xã (sxdUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initSxdCharts() gọi từ openCategoryDetail. */

 function sxdCt(key){ return SXD_CT.find(c=>c.key===key); }
 function sxdHead(key,extra){ const i=SXD_CT.findIndex(c=>c.key===key), ct=SXD_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const sxdP=(v)=>fmt(Math.round(v*10)/10)+'%';
 const sxdSo=(a,b)=>{ const v=(a/b-1)*100; return (v>=0?'+':'')+fmt(Math.round(v*10)/10)+'% so cùng kỳ'; };
 const sxd1=(v)=>fmt(Math.round(v*10)/10), sxd2=(v)=>fmt(Math.round(v*100)/100);
 function sxdChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }
 function sxdBox(key,tiles){ return catBoxHtml(sxdHead(key),vhttTiles(tiles),sxdCt(key).freq); }

 /* ---------- 4 chỉ tiêu ---------- */
 function sxdNhaHtml(){ const S=SXD_SUM.nha;
 return sxdBox('nha',[
 ['Diện tích sàn nhà ở hoàn thành',sxd2(S.sanTong/1000)+' triệu m²',sxdSo(S.sanTong,S.ck)],['Công trình hoàn thành',fmt(S.ctTong)],
 ['Nhà ở xã hội hoàn thành',fmt(Math.round(S.noxh))+' nghìn m² sàn',S.ct[2]+' công trình'],['Khởi công, đang thi công',sxd2(S.sanTT[1]/1000)+' triệu m²'],['Số tầng bình quân',sxd1(S.tang)]])
 +sxdChart('sxNhaLct','Diện tích sàn hoàn thành theo loại công trình (nghìn m²)',300)
 +sxdChart('sxNhaTt','Diện tích sàn phát sinh theo tình trạng công trình (nghìn m²)',200,'Mỗi tình trạng là số phát sinh trong kỳ; một công trình đi qua nhiều tình trạng nên không cộng các tình trạng với nhau.')
 +sxdChart('sxNhaThang','Diện tích sàn hoàn thành theo tháng (nghìn m²)',210)
 +sxdChart('sxNhaDb','10 phường/xã có diện tích sàn nhà ở hoàn thành lớn nhất (nghìn m²)',300,'Nhà ở mới tập trung ở các khu vực đang đô thị hóa (Đông Anh, Hoài Đức, Long Biên, Tây Mỗ…).'); }
 function sxdVtHtml(){ const S=SXD_SUM.vt;
 return sxdBox('vt',[
 ['Lượt hành khách',sxd1(S.tong/1000)+' triệu',sxdSo(S.tong,S.ck)],['Hành khách.km',sxd2(S.km/1e6)+' tỷ'],['Cự ly bình quân',sxd1(S.cuLy)+' km'],
 ['Đường sắt đô thị',sxd1(S.nhom[4]/1000)+' triệu lượt'],['Đơn vị vận tải báo cáo',fmt(S.soDv),'doanh nghiệp, hợp tác xã']])
 +sxdChart('sxVtNhom','Lượt hành khách theo nhóm vận tải (triệu lượt)',280)
 +sxdChart('sxVtKm','Hành khách.km theo nhóm vận tải (triệu HK.km)',230,'Xe buýt chở nhiều lượt nhất nhưng chặng ngắn; tuyến cố định liên tỉnh ít lượt nhưng chặng dài.')
 +sxdChart('sxVtThang','Lượt hành khách theo tháng (triệu lượt)',210)
 +(SXD_SHOW_METRO_TUYEN?sxdChart('sxVtMetro','Đường sắt đô thị theo tuyến (triệu lượt)',160,'Eform chưa có trường tuyến; cần bổ sung để tách số theo tuyến.'):''); }
 function sxdNcHtml(){ const S=SXD_SUM.nc;
 const rc=SXD_DIEM.filter(d=>d.muc===3).sort((a,b)=>a.tt-b.tt);
 const list=rc.map(d=>`<div style="padding:7px 0;border-top:1px solid rgba(87,178,255,.16);display:flex;justify-content:space-between;gap:10px">
 <div><div style="font-size:12px;font-weight:800">${esc(d.duong)}</div><div style="font-size:11px;color:var(--text-secondary)">${esc(d.diaBan)} · ${esc(SXD_LNC[d.loai][0])} · ảnh hưởng ${fmt(d.dai)} m</div></div>
 <span style="font-size:11px;font-weight:800;white-space:nowrap;color:${SXD_TTXL[d.tt][1]}">${esc(SXD_TTXL[d.tt][0])}</span></div>`).join('');
 return sxdBox('nc',[
 ['Điểm nguy cơ',fmt(S.n),S.loai[0]+' sạt lở · '+S.loai[1]+' úng ngập'],['Mức cao, rất cao',fmt(S.caoTro),sxdP(S.caoTro/S.n*100)],
 ['Chưa xử lý',fmt(S.chuaXl)],['Đang xử lý',fmt(S.tt[1])],['Chiều dài ảnh hưởng',sxd1(S.dai/1000)+' km'],['Có tọa độ',S.n+'/'+S.n,'hiển thị được trên bản đồ']])
 +sxdChart('sxNcMuc','Điểm nguy cơ theo loại và mức độ',220)
 +sxdChart('sxNcTt','Điểm nguy cơ theo trạng thái xử lý',220)
 +catBoxHtml('Điểm nguy cơ mức rất cao',`<div style="margin-top:6px">${list}</div>`,'Tháng'); }
 function sxdVdHtml(){ const S=SXD_SUM.vtdl;
 return sxdBox('vtdl',[
 ['Hành khách vận chuyển',sxd1(S.hk/1000)+' triệu lượt'],['Hành khách luân chuyển',sxd2(S.hkKm/1e6)+' tỷ HK.km'],
 ['Hàng hóa vận chuyển',sxd1(S.hh/1000)+' triệu tấn',sxdSo(S.hh,S.hhCk)],['Hàng hóa luân chuyển',sxd2(S.hhKm/1e6)+' tỷ tấn.km']])
 +sxdChart('sxVdHh','Hàng hóa vận chuyển theo loại hình (triệu tấn)',200)
 +sxdChart('sxVdHk','Hành khách vận chuyển theo loại hình (triệu lượt)',200)
 +sxdChart('sxVdDb','10 phường/xã có khối lượng hàng hóa lớn nhất (nghìn tấn)',300); }
 const SXD_BUILDERS={nha:sxdNhaHtml,vt:sxdVtHtml,nc:sxdNcHtml,vtdl:sxdVdHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-xaydung']=SXD_CT.map(c=>SXD_BUILDERS[c.key]);

 /* ---------- Biểu đồ (id bắt đầu "sx") ---------- */
 function initSxdCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('sx')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=SXD_SUM, M=SXD_MONTHS, r1=(v)=>Math.round(v*10)/10;
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;}; c.update();};
 const hbar=(id,rows,label,color,o)=>{vhttBar(id,rows.map(r=>r[0]),[{label:label,data:rows.map(r=>r[1]),color:color}],{h:true}); fit(id,o||{short:true});};
 /* 1. Nhà ở */
 const lct=SXD_LCT.map((x,i)=>[x[0],r1(S.nha.san[i])]).sort((a,b)=>b[1]-a[1]);
 hbar('sxNhaLct',lct,'Diện tích sàn (nghìn m²)','#2a78d6',{});
 /* 4 tình trạng là 4 số phát sinh riêng, không cộng → cột ngang, không có ô tổng giữa vòng */
 vhttBar('sxNhaTt',SXD_TTCT.map(x=>x[0]),[{label:'Diện tích sàn (nghìn m²)',data:S.nha.sanTT.map(v=>Math.round(v)),color:'#2a78d6'}],{h:true});
 const ctt=vhttChartInstances.sxNhaTt; if(ctt){ctt.data.datasets[0].backgroundColor=SXD_TTCT.map(x=>x[1]); ctt.update();} fit('sxNhaTt',{});
 vhttBar('sxNhaThang',M,[{label:'Diện tích sàn (nghìn m²)',data:S.nha.sanT,color:'#2a78d6'}]);
 hbar('sxNhaDb',S.nha.top,'Diện tích sàn (nghìn m²)','#7086FD');
 /* 2. Vận tải hành khách */
 const vt=SXD_VT.map((x,i)=>[x[0],r1(S.vt.nhom[i]/1000),x[6]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('sxVtNhom',vt.map(r=>r[0]),[{label:'Lượt hành khách (triệu)',data:vt.map(r=>r[1]),color:'#2a78d6'}],{h:true});
 const cv=vhttChartInstances.sxVtNhom; if(cv){cv.data.datasets[0].backgroundColor=vt.map(r=>r[2]); cv.update();} fit('sxVtNhom',{wrap:18});
 vhttDonut('sxVtKm',SXD_VT.map((x,i)=>[x[0],Math.round(S.vt.kmNhom[i]/1000),x[6]]),fmt(Math.round(S.vt.km/1000)),'triệu HK.km');
 vhttBar('sxVtThang',M,[{label:'Lượt hành khách (triệu)',data:S.vt.hkT.map(v=>r1(v/1000)),color:'#2a78d6'}]);
 if(SXD_SHOW_METRO_TUYEN) hbar('sxVtMetro',S.vt.metro.map(r=>[r[0],r1(r[1]/1000)]),'Lượt hành khách (triệu)','#1baf7a',{});
 /* 3. Nguy cơ sạt lở, úng ngập */
 vhttBar('sxNcMuc',SXD_LNC.map(x=>x[0]),SXD_MD.map((m,j)=>({label:m[0],data:S.nc.muc.map(r=>r[j]),color:m[1]})),{h:true,stacked:true}); fit('sxNcMuc',{wrap:16});
 vhttDonut('sxNcTt',SXD_TTXL.map((x,i)=>[x[0],S.nc.tt[i],x[1]]),fmt(S.nc.n),'điểm');
 /* 4. Khối lượng vận chuyển */
 const hh=SXD_LHVT.map((x,i)=>[x,r1(S.vtdl.hhLh[i]/1000)]).filter(r=>r[1]>0).sort((a,b)=>b[1]-a[1]);
 hbar('sxVdHh',hh,'Hàng hóa (triệu tấn)','#eda100',{});
 const hk=SXD_LHVT.map((x,i)=>[x,r1(S.vtdl.hkLh[i]/1000)]).filter(r=>r[1]>0).sort((a,b)=>b[1]-a[1]);
 hbar('sxVdHk',hk,'Hành khách (triệu lượt)','#2a78d6',{});
 hbar('sxVdDb',S.vtdl.topHh.map(r=>[r[0],r[1]]),'Hàng hóa (nghìn tấn)','#eda100');
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function sxdUnitTableHtml(){
 const U=SXD_UNITS, S=SXD_SUM, sum=(a)=>a.reduce((x,y)=>x+y,0);
 const cols=[
 {l:'Diện tích sàn nhà ở (nghìn m²)',v:(u)=>fmt(Math.round(sum(u.nhaSan)*10)/10),t:fmt(Math.round(S.nha.sanTong))},
 {l:'Công trình nhà ở',v:(u)=>fmt(sum(u.nhaCt)),t:fmt(S.nha.ctTong)},
 {l:'Nhà ở xã hội (nghìn m² sàn)',v:(u)=>u.nhaSan[2]?fmt(u.nhaSan[2]):'—',t:fmt(Math.round(S.nha.noxh))},
 {l:'Hành khách (nghìn lượt)',v:(u)=>fmt(sum(u.hk)),t:fmt(S.vt.tong)},
 {l:'Hàng hóa (nghìn tấn)',v:(u)=>fmt(sum(u.hh)),t:fmt(S.vtdl.hh)},
 {l:'Điểm nguy cơ sạt lở, úng ngập',v:(u)=>u.diem?fmt(u.diem):'—',t:fmt(S.nc.n)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng 126 phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách 126 phường/xã · ${esc(SXD_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Đơn vị báo cáo / Địa bàn của 4 eform; vận tải tính theo nơi đặt trụ sở đơn vị vận tải. Dòng đầu là cộng 126 phường/xã. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*125}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
