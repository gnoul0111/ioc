 /* ===== Giao diện riêng cho "Sở Công Thương" — 5 chỉ tiêu theo 5 eform, SỐ GIẢ LẬP (sct-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ Chart.js
 (cách tính chỉ nằm trong tài liệu mô tả). Không hiện «Mã chỉ tiêu con (CĐS)», «Mã chỉ tiêu QĐ4795» trên giao diện.
 Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js. Ô bên phải: bảng 126 phường/xã (sctUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initSctCharts() gọi từ openCategoryDetail. */

 function sctCt(key){ return SCT_CT.find(c=>c.key===key); }
 function sctHead(key,extra){ const i=SCT_CT.findIndex(c=>c.key===key), ct=SCT_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const sctP=(v)=>fmt(Math.round(v*10)/10)+'%';
 const sctSo=(a,b)=>{ const v=(a/b-1)*100; return (v>=0?'+':'')+fmt(Math.round(v*10)/10)+'% so cùng kỳ'; };
 const sct1=(v)=>fmt(Math.round(v*10)/10);
 function sctChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }
 function sctBox(key,tiles,extra){ return catBoxHtml(sctHead(key,extra),vhttTiles(tiles),sctCt(key).freq); }

 /* ---------- 5 chỉ tiêu ---------- */
 function sctXnkHtml(){ const S=SCT_SUM.xnk;
 return sctBox('xnk',[
 ['Kim ngạch xuất khẩu',sct1(S.xk/1000)+' tỷ USD',sctSo(S.xk,S.xkCk)],['Kim ngạch nhập khẩu',sct1(S.nk/1000)+' tỷ USD',sctSo(S.nk,S.nkCk)],
 ['Tổng kim ngạch',sct1((S.xk+S.nk)/1000)+' tỷ USD'],['Nhập siêu',sct1((S.nk-S.xk)/1000)+' tỷ USD','nhập khẩu − xuất khẩu'],['Doanh nghiệp báo cáo',fmt(S.soDn)]])
 +sctChart('scXnkThang','Xuất khẩu, nhập khẩu theo tháng (triệu USD)',240)
 +sctChart('scXnkTt','Kim ngạch theo thị trường (triệu USD)',300)
 +sctChart('scXnkNganh','Cơ cấu xuất khẩu theo ngành hàng',230)
 +sctChart('scXnkDb','10 phường/xã có kim ngạch lớn nhất (triệu USD)',300,'Doanh nghiệp có vốn đầu tư nước ngoài tập trung ở các khu công nghiệp; doanh nghiệp thương mại ở khu trung tâm.'); }
 function sctBlHtml(){ const S=SCT_SUM.bl;
 return sctBox('bl',[
 ['Tổng mức bán lẻ và dịch vụ',sct1(S.tong/1000)+' nghìn tỷ',sctSo(S.tong,S.ck)],['Bán lẻ hàng hóa',sct1(S.banLe/1000)+' nghìn tỷ',sctP(S.banLe/S.tong*100)+' tổng mức'],
 ['Doanh thu dịch vụ tiêu dùng',sct1(S.dichVu/1000)+' nghìn tỷ',sctP(S.dichVu/S.tong*100)+' tổng mức'],
 ['Bán hàng qua mạng',sctP(S.tmdtB2c/S.tong*100),'tổng mức (mục tiêu 13%)'],['Cơ sở báo cáo',fmt(S.soCs)]])
 +sctChart('scBlThang','Bán lẻ hàng hóa và doanh thu dịch vụ theo tháng (tỷ đồng)',240)
 +sctChart('scBlLh','Theo loại hình kinh doanh (tỷ đồng)',300)
 +sctChart('scBlDb','10 phường/xã có doanh thu lớn nhất (tỷ đồng)',300); }
 function sctTmHtml(){ const S=SCT_SUM.tmdt;
 return sctBox('tmdt',SCT_TMDT.map((d,i)=>[d[0],sctP(S.tl[i]),SCT_TMDT_ND[i].toLowerCase()]))
 +sctChart('scTmTl','Tỷ lệ đạt theo nhóm đối tượng: phường và xã (%)',340)
 +sctChart('scTmHkd','10 phường/xã có tỷ lệ hộ kinh doanh bán hàng trực tuyến thấp nhất (%)',300); }
 function sctNlHtml(){ const S=SCT_SUM.nl;
 return sctBox('nl',[
 ['Điện năng tiêu thụ',sct1(S.dien/1000)+' tỷ kWh',sctSo(S.dien,S.dienCk)],['Bình quân mỗi ngày',sct1(S.dien/273)+' triệu kWh'],
 ['Xăng dầu',fmt(S.xangDau)+' nghìn m³',sctSo(S.xangDau,S.xangDauCk)],['Than',fmt(S.than)+' nghìn tấn',sctSo(S.than,S.thanCk)]])
 +sctChart('scNlDien','Điện năng tiêu thụ theo tháng (triệu kWh)',230,'Tiêu thụ điện tăng cao các tháng nắng nóng (tháng 5 – 8).')
 +sctChart('scNlXd','Xăng dầu theo tháng (nghìn m³)',210)
 +sctChart('scNlLh','Xăng dầu theo loại hình đơn vị kinh doanh',230)
 +sctChart('scNlDb','10 phường/xã tiêu thụ điện nhiều nhất (triệu kWh)',300); }
 function sctIipHtml(){ const S=SCT_SUM.iip;
 return sctBox('iip',[
 ['Chỉ số sản xuất công nghiệp',sct1(S.chung)+'%','9 tháng so cùng kỳ'],['Tháng 9 so tháng 8',sct1(S.thang9)+'%'],
 ['Giá trị sản xuất',sct1(S.gtsx/1000)+' nghìn tỷ đồng'],['Doanh nghiệp báo cáo',fmt(S.soDn)]])
 +sctChart('scIipNganh','Mức tăng sản xuất theo ngành, 9 tháng so cùng kỳ (%)',230)
 +sctChart('scIipThang','Chỉ số sản xuất từng tháng so với tháng trước (%)',220,'Tháng 2 giảm do nghỉ Tết, tháng 3 tăng trở lại; mốc 100% là bằng tháng trước.')
 +sctChart('scIipGt','Cơ cấu giá trị sản xuất theo ngành',230)
 +sctChart('scIipDb','10 phường/xã có giá trị sản xuất lớn nhất (tỷ đồng)',300); }
 const SCT_BUILDERS={xnk:sctXnkHtml,bl:sctBlHtml,tmdt:sctTmHtml,nl:sctNlHtml,iip:sctIipHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-congthuong']=SCT_CT.map(c=>SCT_BUILDERS[c.key]);

 /* ---------- Biểu đồ (id bắt đầu "sc") ---------- */
 function initSctCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('sc')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=SCT_SUM, M=SCT_MONTHS;
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;};
 if(o.pct){c.options.scales.x.max=114; c.options.scales.x.ticks.callback=(v)=>v<=100?fmt(v):'';} c.update();};
 const hbar=(id,rows,label,color)=>{vhttBar(id,rows.map(r=>r[0]),[{label:label,data:rows.map(r=>r[1]),color:color}],{h:true}); fit(id,{short:true});};
 /* 1. Xuất nhập khẩu */
 vhttBar('scXnkThang',M,[{label:'Xuất khẩu',data:S.xnk.xkT,color:'#1baf7a'},{label:'Nhập khẩu',data:S.xnk.nkT,color:'#2a78d6'}],{noLabels:true});
 vhttBar('scXnkTt',SCT_THI_TRUONG.map(x=>x[0]),[{label:'Xuất khẩu',data:S.xnk.ttXk,color:'#1baf7a'},{label:'Nhập khẩu',data:S.xnk.ttNk,color:'#2a78d6'}],{h:true}); fit('scXnkTt');
 const nc=['#2a78d6','#7086FD','#1baf7a','#eda100','#FD9843','#8ba7c2'];
 vhttDonut('scXnkNganh',SCT_NGANH_XK.map((x,i)=>[x[0],S.xnk.nganh[i],nc[i]]),fmt(Math.round(S.xnk.xk)),'triệu USD');
 vhttBar('scXnkDb',S.xnk.top.map(r=>r[0]),[{label:'Xuất khẩu',data:S.xnk.top.map(r=>SCT_UNITS.find(u=>u.ten===r[0]).xk),color:'#1baf7a'},{label:'Nhập khẩu',data:S.xnk.top.map(r=>SCT_UNITS.find(u=>u.ten===r[0]).nk),color:'#2a78d6'}],{h:true,stacked:true});
 fit('scXnkDb',{short:true});
 /* 2. Bán lẻ, dịch vụ */
 vhttBar('scBlThang',M,[{label:'Bán lẻ hàng hóa',data:S.bl.blT,color:'#2a78d6'},{label:'Doanh thu dịch vụ',data:S.bl.dvT,color:'#39d5ff'}],{stacked:true,noLabels:true});
 const lh=SCT_LH.map((x,i)=>[x[0],S.bl.lh[i],x[1]>0]).sort((a,b)=>b[1]-a[1]);
 vhttBar('scBlLh',lh.map(r=>r[0]),[{label:'Doanh thu (tỷ đồng)',data:lh.map(r=>r[1]),color:'#2a78d6'}],{h:true});
 const cl=vhttChartInstances.scBlLh; if(cl){cl.data.datasets[0].backgroundColor=lh.map(r=>r[2]?'#2a78d6':'#39d5ff'); cl.update();}
 fit('scBlLh',{wrap:20});
 hbar('scBlDb',S.bl.top,'Doanh thu (tỷ đồng)','#2a78d6');
 /* 3. Thương mại điện tử */
 vhttBar('scTmTl',SCT_TMDT.map(d=>d[0]),[{label:'Phường',data:S.tmdt.tlPX.map(r=>Math.round(r[0]*10)/10),color:'#2a78d6'},{label:'Xã',data:S.tmdt.tlPX.map(r=>Math.round(r[1]*10)/10),color:'#6FD195'}],{h:true});
 fit('scTmTl',{wrap:20,pct:true});
 vhttBar('scTmHkd',S.tmdt.hkdThap.map(r=>r[0]),[{label:'Hộ kinh doanh bán hàng trực tuyến (%)',data:S.tmdt.hkdThap.map(r=>Math.round(r[1]*10)/10),color:'#eda100'}],{h:true});
 fit('scTmHkd',{short:true,pct:true});
 /* 4. Năng lượng */
 vhttBar('scNlDien',M,[{label:'Điện năng (triệu kWh)',data:S.nl.dienT,color:'#eda100'}]);
 vhttBar('scNlXd',M,[{label:'Xăng dầu (nghìn m³)',data:S.nl.xdT,color:'#2a78d6'}]);
 vhttDonut('scNlLh',SCT_LHDV.map((x,i)=>[x[0],Math.round(S.nl.xangDau*S.nl.lhdv[0][i]),x[1]]).filter(r=>r[1]>0),fmt(Math.round(S.nl.xangDau)),'nghìn m³');
 hbar('scNlDb',S.nl.topDien,'Điện năng (triệu kWh)','#eda100');
 /* 5. Sản xuất công nghiệp */
 const ng=SCT_NGANH.map(x=>[x[0],Math.round((x[2]-100)*10)/10]).sort((a,b)=>b[1]-a[1]);
 vhttBar('scIipNganh',ng.map(r=>r[0]),[{label:'Tăng so cùng kỳ (%)',data:ng.map(r=>r[1]),color:'#1baf7a'}],{h:true}); fit('scIipNganh');
 vhttBar('scIipThang',M,[{type:'line',label:'So tháng trước (%)',data:S.iip.thang,color:'#2a78d6'},{type:'line',label:'Mốc 100%',data:M.map(()=>100),color:'#898781',borderDash:[5,4],pointRadius:0}]);
 const ci=vhttChartInstances.scIipThang; if(ci){ci.options.scales.y.min=75; ci.options.scales.y.max=125; ci.options.scales.y.beginAtZero=false; ci.update();}
 vhttDonut('scIipGt',SCT_NGANH.map((x,i)=>[x[0],S.iip.nganhGt[i],nc[i]]),sct1(S.iip.gtsx/1000),'nghìn tỷ đồng');
 hbar('scIipDb',S.iip.top,'Giá trị sản xuất (tỷ đồng)','#7086FD');
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function sctUnitTableHtml(){
 const U=SCT_UNITS, S=SCT_SUM;
 const cols=[
 {l:'Xuất khẩu (triệu USD)',v:(u)=>fmt(u.xk),t:fmt(S.xnk.xk)},
 {l:'Nhập khẩu (triệu USD)',v:(u)=>fmt(u.nk),t:fmt(S.xnk.nk)},
 {l:'Bán lẻ và dịch vụ (tỷ đồng)',v:(u)=>fmt(u.banLe+u.dichVu),t:fmt(S.bl.tong)},
 {l:'Hộ kinh doanh bán hàng trực tuyến',v:(u)=>sctP(u.tmdtDat[2]/u.tmdtTong[2]*100),t:sctP(S.tmdt.tl[2])},
 {l:'Điện năng (triệu kWh)',v:(u)=>fmt(u.dien),t:fmt(S.nl.dien)},
 {l:'Xăng dầu (nghìn m³)',v:(u)=>fmt(Math.round(u.xangDau*10)/10),t:fmt(S.nl.xangDau)},
 {l:'Giá trị sản xuất công nghiệp (tỷ đồng)',v:(u)=>fmt(u.gtsx),t:fmt(S.iip.gtsx)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng 126 phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách 126 phường/xã · ${esc(SCT_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của 5 eform (nơi đặt trụ sở doanh nghiệp, cơ sở kinh doanh). Dòng đầu là cộng 126 phường/xã. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*120}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
