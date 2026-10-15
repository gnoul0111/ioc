 /* ===== Giao diện riêng cho "Sở Y tế" — 4 chỉ tiêu theo 4 eform, SỐ GIẢ LẬP (syt-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ
 Chart.js (cách tính chỉ nằm trong tài liệu mô tả). Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js.
 Ô bên phải là bảng 126 phường/xã (sytUnitTableHtml). Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS; initSytCharts() gọi từ openCategoryDetail. */

 function sytCt(key){ return SYT_CT.find(c=>c.key===key); }
 function sytHead(key){ const i=SYT_CT.findIndex(c=>c.key===key), ct=SYT_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}`; }
 const sytP=(v,d)=>fmt(Math.round(v*Math.pow(10,d||1))/Math.pow(10,d||1))+'%';
 const sytR1=(v)=>Math.round(v*10)/10;
 const sytR2=(v)=>Math.round(v*100)/100;
 function sytChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }

 /* ---------- 4 chỉ tiêu ---------- */
 function sytNdHtml(){
 const S=SYT_SUM.nd;
 return catBoxHtml(sytHead('nd'),vhttTiles([
 ['Số vụ ngộ độc',fmt(S.vu),'vụ, 9 tháng'],
 ['Người mắc, nhập viện',fmt(S.mac),'người'],
 ['Ca nặng',fmt(S.nang),'người'],
 ['Tử vong',fmt(S.tuVong),'người'],
 ['Vụ từ 30 người mắc trở lên',fmt(S.vuLon)+'/'+fmt(S.vu),'vụ']
 ]),sytCt('nd').freq)
 +sytChart('ytNdVu','Các vụ ngộ độc thực phẩm: số người mắc, nhập viện',300)
 +sytChart('ytNdThang','Người mắc ngộ độc thực phẩm theo tháng',220)
 +sytChart('ytNdNn','Người mắc theo nhóm nguyên nhân nghi ngờ',220);
 }
 function sytBhHtml(){
 const S=SYT_SUM.bh, dv=SYT_DV.length;
 return catBoxHtml(sytHead('bh'),vhttTiles([
 ['Dân số có thẻ bảo hiểm y tế',sytP(S.bhyt/S.dan*100,2),fmt(S.bhyt)+' người'],
 ['Chỉ tiêu năm 2026',sytP(S.chiTieu,2),'Thành phố được giao'],
 ['Chưa có thẻ',fmt(S.chua),'người'],
 ['Phường/xã đạt chỉ tiêu',S.datCt+'/'+dv,'từ 96,25% trở lên']
 ]),sytCt('bh').freq)
 +sytChart('ytBhXh','Tỷ lệ bao phủ bảo hiểm y tế theo tháng (%)',230)
 +sytChart('ytBhNhom','Phường/xã theo tỷ lệ bao phủ bảo hiểm y tế — tháng 9',220)
 +sytChart('ytBhThap','10 phường/xã có tỷ lệ bao phủ bảo hiểm y tế thấp nhất — tháng 9 (%)',300);
 }
 function sytDichHtml(){
 const S=SYT_SUM.dich, dv=SYT_DV.length;
 return catBoxHtml(sytHead('dich'),vhttTiles([
 ['Tổng số ca mắc',fmt(S.ca),'ca, 9 tháng'],
 ['Ca mắc trong tháng 9',fmt(S.caT9),'ca'],
 ['Ca nặng',fmt(S.nang),'ca'],
 ['Tử vong',fmt(S.tuVong),'ca (dại, liên cầu lợn)'],
 ['Bệnh nhóm A',fmt(S.nhomA),'ca'],
 ['Phường/xã có ca sốt xuất huyết',S.sxhDv+'/'+dv,'9 tháng']
 ]),sytCt('dich').freq)
 +sytChart('ytDichThang','Số ca mắc theo tháng và theo bệnh',250)
 +sytChart('ytDichBenh','Số ca mắc 9 tháng theo bệnh',250)
 +sytChart('ytDichSxh','10 phường/xã có nhiều ca sốt xuất huyết nhất',300);
 }
 function sytHsHtml(){
 const S=SYT_SUM.hs, dv=SYT_DV.length;
 return catBoxHtml(sytHead('hs'),vhttTiles([
 ['Người dân có hồ sơ sức khỏe điện tử',sytP(S.hssk/S.dan*100),fmt(S.hssk)+' người'],
 ['Chưa có hồ sơ',fmt(S.chua),'người'],
 ['Phường/xã từ 99,5% trở lên',S.nhom[0][1]+'/'+dv,'tháng 9']
 ]),sytCt('hs').freq)
 +sytChart('ytHsXh','Tỷ lệ người dân có hồ sơ sức khỏe điện tử theo tháng (%)',230,'Mục tiêu của Thành phố: 100% người dân có Sổ sức khỏe điện tử trên VNeID từ 15/10/2026.')
 +sytChart('ytHsNhom','Phường/xã theo tỷ lệ có hồ sơ sức khỏe điện tử — tháng 9',220)
 +sytChart('ytHsThap','10 phường/xã có tỷ lệ có hồ sơ sức khỏe điện tử thấp nhất — tháng 9 (%)',300);
 }
 const SYT_BUILDERS={nd:sytNdHtml,bh:sytBhHtml,dich:sytDichHtml,hs:sytHsHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-yte']=SYT_CT.map(c=>SYT_BUILDERS[c.key]);

 /* ---------- Biểu đồ (id bắt đầu "yt") ---------- */
 function initSytCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('yt')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=SYT_SUM, N=S.nd, B=S.bh, D=S.dich, H=S.hs, M=SYT_MONTHS, dv=SYT_DV.length;
 /* nhãn trục dọc: viết tắt Phường/Xã hoặc ngắt dòng ngay trên trục (dữ liệu giữ tên đầy đủ cho bảng bấm-khối);
    min: trục % bắt đầu từ mức đó để thấy chênh lệch giữa các đơn vị cùng ở mức cao */
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;};
 if(o.min!=null){c.options.scales.x.min=o.min; c.options.scales.x.max=100; c.options.scales.x.beginAtZero=false; c.options.scales.x.grace=0;}
 c.update();};
 const yRange=(id,min,max)=>{const c=vhttChartInstances[id]; if(!c) return; c.options.scales.y.min=min; c.options.scales.y.max=max; c.options.scales.y.beginAtZero=false; c.update();};
 /* 1. Ngộ độc thực phẩm */
 vhttBar('ytNdVu',N.dsVu.map(r=>r[0]),[{label:'Người mắc, nhập viện',data:N.dsVu.map(r=>r[1]),color:'#2a78d6'}],{h:true});
 fit('ytNdVu',{wrap:26});
 vhttBar('ytNdThang',M,[{label:'Người mắc',data:N.thangMac,color:'#eda100'}]);
 vhttDonut('ytNdNn',N.nguyenNhan,fmt(N.mac),'người mắc');
 /* 2. Bảo hiểm y tế */
 vhttBar('ytBhXh',M,[{type:'line',label:'Tỷ lệ có thẻ',data:B.xuHuong.map(sytR2),color:'#2a78d6'},{type:'line',label:'Chỉ tiêu năm 2026',data:M.map(()=>B.chiTieu),color:'#898781',borderDash:[5,4],pointRadius:0}]);
 yRange('ytBhXh',95,97.5);
 vhttDonut('ytBhNhom',B.nhom,fmt(dv),'phường/xã');
 vhttBar('ytBhThap',B.thap.map(r=>r[0]),[{label:'Có thẻ bảo hiểm y tế (%)',data:B.thap.map(r=>sytR1(r[1])),color:'#eda100'}],{h:true});
 fit('ytBhThap',{short:true,min:90});
 /* 3. Dịch bệnh: 4 bệnh nhiều ca nhất + gộp các bệnh còn lại */
 const ch=D.benh.slice(0,4), con=D.benh.slice(4);
 vhttBar('ytDichThang',M,ch.map((b,i)=>({label:b[0],data:D.thang[i],color:b[2]})).concat([{label:'Bệnh khác ('+con.map(b=>b[0].toLowerCase()).join(', ')+')',data:M.map((_,m)=>con.reduce((a,b,j)=>a+D.thang[4+j][m],0)),color:'#898781'}]),{stacked:true,noLabels:true});
 const xepCa=D.benh.slice().sort((a,b)=>b[1]-a[1]);
 vhttBar('ytDichBenh',xepCa.map(b=>b[0]),[{label:'Số ca mắc',data:xepCa.map(b=>b[1]),color:'#d33a44'}],{h:true});
 fit('ytDichBenh',{});
 vhttBar('ytDichSxh',D.sxhTop.map(r=>r[0]),[{label:'Ca sốt xuất huyết',data:D.sxhTop.map(r=>r[1]),color:'#d33a44'}],{h:true});
 fit('ytDichSxh',{short:true});
 /* 4. Hồ sơ sức khỏe điện tử */
 vhttBar('ytHsXh',M,[{type:'line',label:'Có hồ sơ sức khỏe điện tử',data:H.xuHuong.map(sytR1),color:'#1baf7a'},{type:'line',label:'Mục tiêu',data:M.map(()=>100),color:'#898781',borderDash:[5,4],pointRadius:0}]);
 yRange('ytHsXh',90,100);
 vhttDonut('ytHsNhom',H.nhom,fmt(dv),'phường/xã');
 vhttBar('ytHsThap',H.thap.map(r=>r[0]),[{label:'Có hồ sơ sức khỏe điện tử (%)',data:H.thap.map(r=>sytR1(r[1])),color:'#eda100'}],{h:true});
 fit('ytHsThap',{short:true,min:90});
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function sytUnitTableHtml(){
 const U=SYT_UNITS, S=SYT_SUM, D=SYT_DICH, q=8;
 const vu=(ten)=>SYT_NGO_DOC.filter(v=>v[1]===ten);
 const cols=[
 {l:'Dân số',v:(u)=>fmt(u.dan),t:fmt(S.bh.dan)},
 {l:'Có thẻ BHYT',v:(u)=>sytP(u.bhyt[q]/u.dan*100,2),t:sytP(S.bh.bhyt/S.bh.dan*100,2)},
 {l:'Có hồ sơ sức khỏe điện tử',v:(u)=>sytP(u.hssk[q]/u.dan*100),t:sytP(S.hs.hssk/S.hs.dan*100)},
 {l:'Ca bệnh truyền nhiễm (9 tháng)',v:(u,i)=>fmt(D.caDv.reduce((a,b)=>a+b[i],0)),t:fmt(S.dich.ca)},
 {l:'Sốt xuất huyết',v:(u,i)=>fmt(D.caDv[1][i]),t:fmt(S.dich.benh[1][1])},
 {l:'Tay chân miệng',v:(u,i)=>fmt(D.caDv[0][i]),t:fmt(S.dich.benh[0][1])},
 {l:'Vụ ngộ độc thực phẩm',v:(u)=>vu(u.ten).length?fmt(vu(u.ten).length)+' ('+fmt(vu(u.ten).reduce((a,v)=>a+v[4],0))+' người)':'—',t:fmt(S.nd.vu)+' ('+fmt(S.nd.mac)+' người)'}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Toàn Thành phố</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map((u,i)=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u,i))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(SYT_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của 4 eform. Tỷ lệ của dòng đầu tính bằng cộng tử số và mẫu số của 126 phường/xã rồi mới chia (không lấy trung bình các dòng); số ca bệnh, số vụ ngộ độc cộng 9 tháng. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*115}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
