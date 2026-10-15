 /* ===== Giao diện "Sở Nông nghiệp và Môi trường" — 10 chỉ tiêu theo 10 eform, SỐ GIẢ LẬP (nnmt-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ Chart.js
 (cách tính chỉ nằm trong tài liệu mô tả). Hai chỉ tiêu số liệu thật cũ (GPMB, đất đai — dashboard-nong-nghiep.js) được nối vào cuối.
 Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js và dashboard-nong-nghiep.js. Ô bên phải: bảng 126 phường/xã
 (nmUnitTableHtml). Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (ghi đè dòng 'ubnd-nnmt' cũ trong subtasks.js); initNmCharts() gọi từ openCategoryDetail. */

 function nmCt(key){ return NM_CT.find(c=>c.key===key); }
 function nmHead(key,extra){ const i=NM_CT.findIndex(c=>c.key===key), ct=NM_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const nmP=(v)=>fmt(Math.round(v*10)/10)+'%';
 const nmTy=(trieu)=>fmt(Math.round(trieu/100)/10);            // triệu đồng → tỷ đồng, 1 chữ số thập phân
 const nmSo=(a,b)=>{ const v=(a/b-1)*100; return (v>=0?'+':'')+fmt(Math.round(v*10)/10)+'% so cùng kỳ'; };
 function nmChart(id,title,height,note,freq){ return vhttChartBox(id,title,height,freq||'Tháng',note); }
 function nmBox(key,tiles,extra){ return catBoxHtml(nmHead(key,extra),vhttTiles(tiles),nmCt(key).freq); }

 /* ---------- 10 chỉ tiêu ---------- */
 function nmNtmHtml(){ const S=NM_SUM.ntm, nc=S.muc[1]+S.muc[2], chua=NM_NTM.filter(r=>r.muc===0);
 return nmBox('ntm',[
 ['Xã đạt chuẩn nông thôn mới',S.n+'/'+S.n,'100% xã'],['Đạt nâng cao trở lên',fmt(nc),nmP(nc/S.n*100)+' số xã'],['Đạt kiểu mẫu',fmt(S.muc[2]),'xã'],
 ['Tiêu chí nâng cao đã đạt',fmt(Math.round(chua.reduce((a,r)=>a+r.tieuChi,0)/chua.length*10)/10)+'/19','bình quân xã chưa đạt nâng cao'],['Phường','51','không thuộc diện xét']])
 +nmChart('nmNtmMuc','Xã theo mức đạt chuẩn',220,null,'Quý')
 +nmChart('nmNtmTc','Xã chưa đạt nâng cao theo số tiêu chí đã đạt (trên 19)',200,'Xã đạt 17 – 18 tiêu chí là nhóm sắp được công nhận nâng cao.','Quý'); }
 function nmThHtml(){ const S=NM_SUM.rungTh;
 return nmBox('rungTh',[
 ['Diện tích rừng bị thiệt hại',fmt(S.ha)+' ha',nmSo(S.ha,S.cungKy)],['Số vụ',fmt(S.n)],['Bị cháy',fmt(S.nnHa[0])+' ha',S.nnVu[0]+' vụ'],
 ['Bị chặt phá',fmt(S.nnHa[1])+' ha',S.nnVu[1]+' vụ'],['Vụ chưa xử lý xong',fmt(S.canXuLy)]])
 +nmChart('nmThNn','Diện tích thiệt hại theo nguyên nhân (ha)',220)
 +nmChart('nmThThang','Diện tích thiệt hại theo tháng (ha)',230,'Cháy rừng tập trung mùa khô (tháng 1 – 4).')
 +nmChart('nmThDb','Địa bàn có diện tích rừng bị thiệt hại (ha)',260); }
 function nmTmHtml(){ const S=NM_SUM.rungTm;
 return nmBox('rungTm',[
 ['Rừng trồng mới tập trung',fmt(S.ha)+' ha',nmP(S.ha/S.kh*100)+' kế hoạch năm ('+S.kh+' ha)'],
 ...NM_LOAI_RUNG.map((l,i)=>[l[0],fmt(S.loaiHa[i])+' ha','kế hoạch '+NM_TM_KH[i]+' ha']),
 ['Cây phân tán',fmt(Math.round(S.cayPt.luyKe/1000))+' nghìn cây',nmP(S.cayPt.luyKe/S.cayPt.keHoach*100)+' kế hoạch']])
 +nmChart('nmTmLk','Diện tích trồng mới lũy kế so với kế hoạch (ha)',230,'Đường gạch: tiến độ kế hoạch theo mùa vụ (vụ xuân, vụ thu).')
 +nmChart('nmTmLoai','Kế hoạch và kết quả theo loại rừng (ha)',190)
 +nmChart('nmTmDb','Diện tích trồng mới theo địa bàn (ha)',280); }
 function nmNvHtml(){ const S=NM_SUM.ntmVon;
 return nmBox('ntmVon',[
 ['Kế hoạch vốn năm 2026',nmTy(S.kh),'tỷ đồng'],['Giải ngân lũy kế',nmTy(S.gn),nmP(S.gn/S.kh*100)+' kế hoạch · tỷ đồng'],['Giải ngân tháng 9',nmTy(S.gnKy),'tỷ đồng'],
 ['So cùng kỳ',nmSo(S.gn,S.cungKy).replace(' so cùng kỳ',''),'giải ngân lũy kế'],['Dự án chậm, đình trệ, cần xử lý',fmt(S.tt[3]+S.tt[4]+S.tt[5]),'/'+fmt(S.n)+' dự án']],'tỷ đồng')
 +nmChart('nmNvLk','Giải ngân lũy kế theo tháng (tỷ đồng)',240,'Đường gạch: kế hoạch vốn năm.')
 +nmChart('nmNvNguon','Kế hoạch vốn theo nguồn',230,'Hà Nội tự cân đối ngân sách nên không có vốn ngân sách Trung ương.')
 +nmChart('nmNvTt','Dự án theo trạng thái triển khai',230)
 +nmChart('nmNvDb','10 xã giải ngân nhiều nhất (tỷ đồng)',300); }
 function nmGnHtml(){ const S=NM_SUM.gnVon;
 return nmBox('gnVon',[
 ['Kế hoạch vốn năm 2026',nmTy(S.kh),'tỷ đồng'],['Giải ngân lũy kế',nmTy(S.gn),nmP(S.gn/S.kh*100)+' kế hoạch · tỷ đồng'],['Phường/xã thực hiện',fmt(S.db),'còn hộ cận nghèo'],
 ['Nội dung, dự án',fmt(S.n)],['Chậm, đình trệ, cần xử lý',fmt(S.tt[3]+S.tt[4]+S.tt[5])]],'tỷ đồng')
 +nmChart('nmGnNd','Kế hoạch và giải ngân theo nội dung hỗ trợ (tỷ đồng)',300)
 +nmChart('nmGnLk','Giải ngân lũy kế theo tháng (tỷ đồng)',220)
 +nmChart('nmGnDb','10 phường/xã giải ngân nhiều nhất (tỷ đồng)',300,'Hà Nội không còn hộ nghèo; nội dung hỗ trợ tập trung cho hộ cận nghèo theo chuẩn Thành phố.'); }
 function nmKtHtml(){ const S=NM_SUM.kttv;
 return nmBox('kttv',[
 ['Bản tin dự báo',fmt(S.tong[1]),nmSo(S.tong[1],S.cungKy[1])],['Cảnh báo thiên tai',fmt(S.tong[2]),nmSo(S.tong[2],S.cungKy[2])],['Lượt số liệu quan trắc',fmt(S.tong[0])]])
 +nmChart('nmKtThang','Bản tin dự báo và cảnh báo thiên tai theo tháng',230)
 +nmChart('nmKtCb','Cảnh báo thiên tai: năm 2026 và cùng kỳ năm 2025',210); }
 function nmPcHtml(){ const S=NM_SUM.pctt;
 return nmBox('pctt',[
 ['Hồ chứa thủy lợi',fmt(S.loai[0]),'hồ'],['Đê điều',fmt(S.km)+' km',S.loai[2]+' tuyến đê'],['Điểm sạt lở bờ sông',fmt(S.loai[3]),'điểm'],
 ['Điểm úng ngập',fmt(S.loai[4]),'điểm'],['Cần xử lý',fmt(S.canXuLy),'công trình, điểm'],['Thủy điện','0','Hà Nội không có']])
 +nmChart('nmPcTt','Công trình, điểm theo loại và trạng thái',240)
 +nmChart('nmPcDb','Địa bàn nhiều điểm sạt lở, úng ngập nhất',280); }
 function nmHtHtml(){ const S=NM_SUM.hoTro;
 return nmBox('hoTro',[
 ['Hộ được hỗ trợ lương thực',fmt(S.ho),nmSo(S.ho,S.cungKy.ho)],['Số người',fmt(S.nguoi)],['Số đợt hỗ trợ',fmt(S.n)],
 ['Do thiên tai',fmt(S.ldHo[0]),'hộ'],['Giáp hạt','0','Hà Nội không còn giáp hạt']])
 +nmChart('nmHtLd','Hộ được hỗ trợ theo lý do',220)
 +nmChart('nmHtThang','Hộ được hỗ trợ theo tháng',200,'Tháng 7 có mưa lớn gây ngập ở khu vực Chương Mỹ, Quốc Oai, Mỹ Đức.')
 +nmChart('nmHtDb','Địa bàn có nhiều hộ được hỗ trợ',260); }
 function nmGaoHtml(){ const S=NM_SUM.hoTro;
 return nmBox('gao',[
 ['Tổng số gạo hỗ trợ',fmt(S.gaoTan)+' tấn',nmSo(S.gaoTan,S.cungKy.gaoTan)],['Bình quân mỗi hộ',fmt(Math.round(S.gaoTan*1000/S.ho))+' kg'],
 ['Do thiên tai',fmt(S.ldGao[0])+' tấn'],['Xuất dự trữ, khẩn cấp','0','tấn']])
 +nmChart('nmGaoLd','Gạo hỗ trợ theo lý do (tấn)',220)
 +nmChart('nmGaoThang','Gạo hỗ trợ theo tháng (tấn)',200); }
 function nmBdHtml(){ const S=NM_SUM.banDo;
 return nmBox('banDo',[
 ['Sản phẩm bản đồ, ảnh viễn thám',fmt(S.n),nmSo(S.n,S.cungKy)],['Hoàn thành',fmt(S.tt[0])],['Đang thực hiện',fmt(S.tt[1])],['Bản đồ rủi ro thiên tai',fmt(S.loai[0])]])
 +nmChart('nmBdLoai','Sản phẩm theo loại',220)
 +nmChart('nmBdTt','Sản phẩm theo trạng thái',200); }
 const NM_BUILDERS={ntm:nmNtmHtml,rungTh:nmThHtml,rungTm:nmTmHtml,ntmVon:nmNvHtml,gnVon:nmGnHtml,kttv:nmKtHtml,pctt:nmPcHtml,hoTro:nmHtHtml,gao:nmGaoHtml,banDo:nmBdHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-nnmt']=NM_CT.map(c=>NM_BUILDERS[c.key])
 .concat([typeof nnmtGpmbBoxHtml==='function'?nnmtGpmbBoxHtml:null,typeof nnmtDatDaiBoxHtml==='function'?nnmtDatDaiBoxHtml:null]);

 /* ---------- Biểu đồ (id bắt đầu "nm") ---------- */
 function initNmCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('nm')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=NM_SUM, M=NM_MONTHS, ty=(v)=>Math.round(v/100)/10;
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;}; c.update();};
 const hbar=(id,rows,label,color)=>{vhttBar(id,rows.map(r=>r[0]),[{label:label,data:rows.map(r=>r[1]),color:color}],{h:true}); fit(id,{short:true});};
 /* 1 */ vhttDonut('nmNtmMuc',NM_MUC.map((m,i)=>[m[0],S.ntm.muc[i],m[1]]),fmt(S.ntm.n),'xã');
 vhttBar('nmNtmTc',S.ntm.tieuChi.map(r=>r[0]+' tiêu chí'),[{label:'Số xã',data:S.ntm.tieuChi.map(r=>r[1]),color:'#39d5ff'}]);
 /* 2 */ vhttDonut('nmThNn',NM_TH.map((m,i)=>[m[0],S.rungTh.nnHa[i],m[1]]),fmt(S.rungTh.ha),'ha');
 vhttBar('nmThThang',M,NM_TH.map((m,i)=>({label:m[0],data:S.rungTh.thangHa[i],color:m[1]})),{stacked:true});
 hbar('nmThDb',S.rungTh.top,'Diện tích (ha)','#d33a44');
 /* 3 */ vhttBar('nmTmLk',M,[{type:'line',label:'Trồng mới lũy kế',data:S.rungTm.lkT,color:'#1baf7a'},{type:'line',label:'Kế hoạch theo mùa vụ',data:S.rungTm.khT,color:'#898781',borderDash:[5,4],pointRadius:0}]);
 vhttBar('nmTmLoai',NM_LOAI_RUNG.map(l=>l[0]),[{label:'Kế hoạch năm',data:NM_TM_KH,color:'#8ba7c2'},{label:'Đã trồng',data:S.rungTm.loaiHa,color:'#1baf7a'}],{h:true}); fit('nmTmLoai');
 hbar('nmTmDb',S.rungTm.top,'Diện tích (ha)','#1baf7a');
 /* 4 */ const nv=S.ntmVon;
 vhttBar('nmNvLk',M,[{type:'line',label:'Năm 2026',data:nv.luyKeT.map(ty),color:'#2a78d6'},{type:'line',label:'Cùng kỳ năm 2025',data:nv.cungKyT.map(ty),color:'#8ba7c2'},
 {type:'line',label:'Kế hoạch vốn năm',data:M.map(()=>ty(nv.kh)),color:'#898781',borderDash:[5,4],pointRadius:0}],{noLabels:true});
 vhttDonut('nmNvNguon',NM_NGUON.map((g,i)=>[g[0],ty(nv.nguonKh[i]),g[1]]).filter(r=>r[1]>0),fmt(ty(nv.kh)),'tỷ đồng');
 vhttDonut('nmNvTt',NM_TT.map((t,i)=>[t[0],nv.tt[i],t[1]]),fmt(nv.n),'dự án');
 hbar('nmNvDb',nv.top.map(r=>[r[0],ty(r[1])]),'Giải ngân (tỷ đồng)','#2a78d6');
 /* 5 */ const gv=S.gnVon, nd=NM_GN_ND.map((g,i)=>[g[0],gv.ndKh[i],gv.nd[i]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('nmGnNd',nd.map(r=>r[0]),[{label:'Kế hoạch',data:nd.map(r=>ty(r[1])),color:'#8ba7c2'},{label:'Giải ngân lũy kế',data:nd.map(r=>ty(r[2])),color:'#1baf7a'}],{h:true}); fit('nmGnNd',{wrap:18});
 vhttBar('nmGnLk',M,[{type:'line',label:'Giải ngân lũy kế',data:gv.luyKeT.map(ty),color:'#1baf7a'},{type:'line',label:'Kế hoạch vốn năm',data:M.map(()=>ty(gv.kh)),color:'#898781',borderDash:[5,4],pointRadius:0}],{noLabels:true});
 hbar('nmGnDb',gv.top.map(r=>[r[0],ty(r[1])]),'Giải ngân (tỷ đồng)','#1baf7a');
 /* 6 */ vhttBar('nmKtThang',M,[{label:'Bản tin dự báo',data:NM_KTTV.thang[1],color:'#2a78d6'},{label:'Cảnh báo thiên tai',data:NM_KTTV.thang[2],color:'#d33a44'}]);
 vhttBar('nmKtCb',M,[{type:'line',label:'Năm 2026',data:NM_KTTV.thang[2],color:'#d33a44'},{type:'line',label:'Cùng kỳ năm 2025',data:NM_KTTV.cungKy[2],color:'#8ba7c2'}]);
 /* 7 */ const pl=[0,2,3,4];
 vhttBar('nmPcTt',pl.map(i=>NM_PCTT_LOAI[i][0]),NM_TT.map((t,s)=>({label:t[0],data:pl.map(i=>S.pctt.tt[i][s]),color:t[1]})).filter(d=>d.data.some(v=>v>0)),{h:true,stacked:true}); fit('nmPcTt',{wrap:16});
 hbar('nmPcDb',S.pctt.topDiem,'Số điểm','#eda100');
 /* 8 */ vhttDonut('nmHtLd',NM_LD.slice(0,4).map((g,i)=>[g[0],S.hoTro.ldHo[i],g[1]]),fmt(S.hoTro.ho),'hộ');
 vhttBar('nmHtThang',M,[{label:'Số hộ',data:S.hoTro.thangHo,color:'#2a78d6'}]);
 hbar('nmHtDb',S.hoTro.top,'Số hộ','#2a78d6');
 /* 9 */ vhttDonut('nmGaoLd',NM_LD.slice(0,4).map((g,i)=>[g[0],S.hoTro.ldGao[i],g[1]]),fmt(S.hoTro.gaoTan),'tấn');
 vhttBar('nmGaoThang',M,[{label:'Gạo (tấn)',data:S.hoTro.thangGao,color:'#eda100'}]);
 /* 10 */ const bd=NM_BD_LOAI.map((l,i)=>[l[0],S.banDo.loai[i]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('nmBdLoai',bd.map(r=>r[0]),[{label:'Sản phẩm',data:bd.map(r=>r[1]),color:'#7086FD'}],{h:true}); fit('nmBdLoai');
 vhttDonut('nmBdTt',NM_TT.slice(0,3).map((t,i)=>[t[0],S.banDo.tt[i],t[1]]),fmt(S.banDo.n),'sản phẩm');
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function nmUnitTableHtml(){
 const g=(arr,f)=>{const o={}; arr.forEach(r=>{o[r.diaBan]=(o[r.diaBan]||0)+f(r);}); return o;};
 const ntm={}; NM_NTM.forEach(r=>{ntm[r.diaBan]=NM_MUC[r.muc][0].replace('Nông thôn mới','NTM');});
 const th=g(NM_RUNG_TH,r=>r.ha), tm=g(NM_RUNG_TM,r=>r.luyKe), nv=g(NM_NTM_VON,r=>r.gn9), gn=g(NM_GN_VON,r=>r.gn9), pc=g(NM_PCTT.filter(r=>r.loai>=3),()=>1), ht=g(NM_HO_TRO,r=>r.ho);
 const S=NM_SUM, d2=(v)=>v?fmt(Math.round(v*100)/100):'—', n0=(v)=>v?fmt(v):'—', t1=(v)=>v?nmTy(v):'—';
 const cols=[
 {l:'Nông thôn mới',v:(n)=>ntm[n]||'—',t:(S.ntm.muc[1]+S.ntm.muc[2])+' xã nâng cao trở lên'},
 {l:'Rừng bị thiệt hại (ha)',v:(n)=>d2(th[n]),t:fmt(S.rungTh.ha)},
 {l:'Rừng trồng mới (ha)',v:(n)=>d2(tm[n]),t:fmt(S.rungTm.ha)},
 {l:'Vốn nông thôn mới đã giải ngân (tỷ đồng)',v:(n)=>t1(nv[n]),t:nmTy(S.ntmVon.gn)},
 {l:'Vốn giảm nghèo đã giải ngân (tỷ đồng)',v:(n)=>t1(gn[n]),t:nmTy(S.gnVon.gn)},
 {l:'Điểm sạt lở, úng ngập',v:(n)=>n0(pc[n]),t:fmt(S.pctt.loai[3]+S.pctt.loai[4])},
 {l:'Hộ được hỗ trợ lương thực',v:(n)=>n0(ht[n]),t:fmt(S.hoTro.ho)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng 126 phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=NM_DV.map(n=>`<tr><td>${esc(n)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(n))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách 126 phường/xã · ${esc(NM_KY9)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của các eform. Phường không thuộc diện xét nông thôn mới; rừng chỉ có ở các xã miền núi, bán sơn địa; "—" là không phát sinh. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*120}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
