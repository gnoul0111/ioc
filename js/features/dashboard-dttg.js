 /* ===== Giao diện riêng cho "Sở Dân tộc và Tôn giáo" — 4 chỉ tiêu từ eform CTMTQG vùng đồng bào DTTS, SỐ GIẢ LẬP (dttg-config.js) =====
 Cùng khuôn với Sở VHTT, Văn phòng UBND, Ban Quản lý, Sở Du lịch: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng
 hợp và các khối biểu đồ Chart.js (cách tính chỉ nằm trong tài liệu mô tả). Dùng lại các hàm vẽ của dashboard-vhtt.js
 (vhttTiles, vhttChartBox, vhttBar, vhttDonut, vhttWrap) nên nạp SAU dashboard-vhtt.js. Ô bên phải mặc định là bảng 126
 phường/xã (dttgUnitTableHtml). Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initDttgCharts() gọi từ openCategoryDetail. */

 function dttgCt(key){ return DTTG_CT.find(c=>c.key===key); }
 function dttgHead(key,extra){ const i=DTTG_CT.findIndex(c=>c.key===key), ct=DTTG_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const dttgP=(v)=>fmt(Math.round(v*10)/10)+'%';
 /* triệu đồng → tỷ đồng 1 chữ số thập phân (cho biểu đồ) */
 const dttgT=(v)=>Math.round(v/100)/10;
 function dttgChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }

 /* ---------- 4 chỉ tiêu ---------- */
 function dttgGnHtml(){
 const S=DTTG_SUM.gn;
 return catBoxHtml(dttgHead('gn','tỷ đồng'),vhttTiles([
 ['Kế hoạch vốn năm 2026',dttgTy(S.kh),'tỷ đồng'],
 ['Đã phân bổ',dttgTy(S.pb),dttgP(S.pb/S.kh*100)+' kế hoạch'],
 ['Giải ngân lũy kế',dttgTy(S.gn),dttgP(S.gn/S.kh*100)+' kế hoạch · '+dttgP(S.gn/S.pb*100)+' phân bổ'],
 ['Giải ngân tháng 9',dttgTy(S.gnKy),'tỷ đồng'],
 ['Vốn đình trệ do pháp lý, thủ tục',dttgTy(S.dinhTre),dttgP(S.dinhTre/S.pb*100)+' vốn phân bổ']
 ]),dttgCt('gn').freq)
 +dttgChart('dgGnLk','Giải ngân theo tháng (tỷ đồng)',250,'Cột: giải ngân trong tháng · Đường: giải ngân lũy kế; đường gạch: kế hoạch vốn năm và vốn đã phân bổ.')
 +dttgChart('dgGnDatp','Kế hoạch vốn và giải ngân theo dự án thành phần (tỷ đồng)',340,'Vốn đã phân bổ của từng dự án thành phần xem ở bảng khi bấm vào khối.')
 +dttgChart('dgGnNguon','Kế hoạch vốn theo nguồn vốn',230)
 +dttgChart('dgGnXa','Kế hoạch vốn và giải ngân theo xã (tỷ đồng)',300);
 }
 function dttgTdHtml(){
 const S=DTTG_SUM.td, done=S.dung[0]+S.dung[1];
 return catBoxHtml(dttgHead('td'),vhttTiles([
 ['Dự án, công trình',fmt(S.n),S.loai[0]+' dự án · '+S.loai[1]+' tiểu dự án · '+S.loai[2]+' công trình'],
 ['Hoàn thành',fmt(S.tt[0]),dttgP(S.tt[0]/S.n*100)],
 ['Đúng tiến độ',dttgP(S.dung[0]/done*100),S.dung[0]+'/'+done+' dự án được đánh giá'],
 ['Đình trệ, tạm dừng',fmt(S.tt[3]+S.tt[4]),'đình trệ '+S.tt[3]+' · tạm dừng '+S.tt[4]],
 ['Vụ vi phạm, sai phạm',fmt(S.viPham)],
 ['Báo cáo kiểm tra giám sát đúng hạn',dttgP(S.ktgs[0]/S.n*100),S.ktgs[0]+'/'+S.n]
 ]),dttgCt('td').freq)
 +dttgChart('dgTdTt','Dự án, công trình theo trạng thái triển khai',230)
 +dttgChart('dgTdDatp','Trạng thái theo dự án thành phần',320)
 +dttgChart('dgTdPct','Tiến độ kế hoạch và thực tế theo dự án thành phần (%)',340,'Bình quân có trọng số theo vốn phân bổ, không tính dự án chưa triển khai.');
 }
 function dttgKqHtml(){
 const K=DTTG_SUM.kq;
 return catBoxHtml(dttgHead('kq'),vhttTiles([
 ['Hộ đồng bào DTTS',fmt(K.soHo),DTTG_VUNG_NGAN],
 ['Hộ dùng nước hợp vệ sinh',dttgP(K.tl[0]),fmt(K.hoNuoc)+'/'+fmt(K.soHo)+' hộ'],
 ['Đường đến trung tâm đã cứng hóa',dttgP(K.tl[1]),K.soCungHoa+'/'+K.soDuong+' thôn'],
 ['Học sinh đi học đúng cấp',dttgP(K.tl[2]),fmt(K.hsDungCap)+'/'+fmt(K.hsTuoi)],
 ['Giảm hộ nghèo',dttgP(K.tl[3]),fmt(K.hoNgheoDau)+' → '+fmt(K.hoNgheoCuoi)+' hộ']
 ]),dttgCt('kq').freq)
 +dttgChart('dgKqTl','Bốn chỉ số kết quả của vùng đồng bào DTTS (%)',200)
 +dttgChart('dgKqNgheo','Hộ nghèo DTTS đầu kỳ và cuối kỳ theo xã',300)
 +dttgChart('dgKqNuoc','Hộ DTTS và hộ dùng nước hợp vệ sinh theo xã',300);
 }
 function dttgDsHtml(){
 const D=DTTG_SUM.ds, n=DTTG_SUM.td.n, dv=DTTG_DV.length;
 return catBoxHtml(dttgHead('ds'),vhttTiles([
 ['Phường/xã đã báo cáo',fmt(D.bc[0]+D.bc[1])+'/'+dv,'chưa báo cáo '+D.bc[2]],
 ['Xác nhận không phát sinh',fmt(D.bc[1]),'phường/xã'],
 ['Đã đối soát cấp sở',dttgP(D.doiSoat[0]/n*100),D.doiSoat[0]+'/'+n+' bản ghi dự án'],
 ['Cần giải trình, thiếu minh chứng',fmt(D.co[1]+D.co[2]),'bản ghi'],
 ['Áp dụng công nghệ số',dttgP(D.cnso[0]/n*100),D.cnso[0]+'/'+n+' bản ghi']
 ]),dttgCt('ds').freq)
 +dttgChart('dgDsBc','Tình trạng báo cáo của 126 phường/xã — tháng 9',230)
 +dttgChart('dgDsDs','Trạng thái đối soát bản ghi dự án',230)
 +dttgChart('dgDsCo','Cờ dữ liệu',170)
 +dttgChart('dgDsNdl','Nguồn dữ liệu của bản ghi',240);
 }
 const DTTG_BUILDERS={gn:dttgGnHtml,td:dttgTdHtml,kq:dttgKqHtml,ds:dttgDsHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-dantoc-tongiao']=DTTG_CT.map(c=>DTTG_BUILDERS[c.key]);

 /* ---------- Biểu đồ (vẽ bằng vhttBar/vhttDonut, instance lưu chung trong vhttChartInstances với id bắt đầu "dg") ---------- */
 function initDttgCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('dg')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=DTTG_SUM, G=S.gn, T=S.td, K=S.kq, D=S.ds, M=DTTG_MONTHS;
 /* hiện đủ nhãn trục dọc, chừa chỗ cho số ở đầu cột. wrap: ngắt dòng nhãn dài NGAY TRÊN TRỤC — dữ liệu giữ tên đầy đủ để bảng
 bấm-khối (populateDimDetailFromBox) hiện đúng tên */
 const fit=(id,wrap)=>{const c=vhttChartInstances[id]; if(!c) return; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(wrap) c.options.scales.y.ticks.callback=function(v){return vhttWrap(this.getLabelForValue(v),wrap);}; c.update();};
 const ten=(s)=>String(s).replace(/^Xã /,'');
 /* trục %: chừa chỗ cho số ở đầu cột nhưng không ghi vạch trên 100 */
 const pct100=(id)=>{const c=vhttChartInstances[id]; if(!c) return; c.options.scales.x.max=114; c.options.scales.x.ticks.stepSize=20; c.options.scales.x.ticks.callback=(v)=>v<=100?fmt(v):''; c.update();};
 /* 1. Giải ngân */
 vhttBar('dgGnLk',M,[
 {label:'Giải ngân trong tháng',data:G.kyT.map(dttgT),color:'#7086FD'},
 {type:'line',label:'Giải ngân lũy kế',data:G.luyKeT.map(dttgT),color:'#1baf7a'},
 {type:'line',label:'Vốn đã phân bổ',data:M.map(()=>dttgT(G.pb)),color:'#39d5ff',borderDash:[5,4],pointRadius:0},
 {type:'line',label:'Kế hoạch vốn năm',data:M.map(()=>dttgT(G.kh)),color:'#898781',borderDash:[5,4],pointRadius:0}],{noLabels:true});
 const dp=DTTG_DATP.map((d,i)=>[d[0],G.byDatp[i]]).sort((a,b)=>b[1][0]-a[1][0]);
 vhttBar('dgGnDatp',dp.map(r=>r[0]),[
 {label:'Kế hoạch vốn',data:dp.map(r=>dttgT(r[1][0])),color:'#8ba7c2'},{label:'Giải ngân lũy kế',data:dp.map(r=>dttgT(r[1][2])),color:'#1baf7a'}],{h:true});
 /* tooltip + bảng bấm-khối: thêm số vốn đã phân bổ */
 const cg=vhttChartInstances.dgGnDatp; if(cg){cg.options.plugins.tooltip={callbacks:{label:(c)=>[`Kế hoạch vốn: ${fmt(dttgT(dp[c.dataIndex][1][0]))}`,`Đã phân bổ: ${fmt(dttgT(dp[c.dataIndex][1][1]))}`,`Giải ngân lũy kế: ${fmt(dttgT(dp[c.dataIndex][1][2]))}`]}}; cg.update();}
 fit('dgGnDatp',18);
 vhttDonut('dgGnNguon',DTTG_NGUON.map((g,i)=>[g[0],dttgT(G.byNguon[i]),g[1]]).filter(r=>r[1]>0),fmt(dttgT(G.kh)),'tỷ đồng');
 vhttBar('dgGnXa',G.byXa.map(r=>ten(r[0])),[{label:'Kế hoạch vốn',data:G.byXa.map(r=>dttgT(r[1])),color:'#8ba7c2'},{label:'Giải ngân lũy kế',data:G.byXa.map(r=>dttgT(r[2])),color:'#1baf7a'}],{h:true});
 fit('dgGnXa');
 /* 2. Tiến độ */
 vhttDonut('dgTdTt',DTTG_TT.map((t,i)=>[t[0],T.tt[i],t[1]]),fmt(T.n),'dự án, công trình');
 vhttBar('dgTdDatp',DTTG_DATP.map(d=>d[0]),DTTG_TT.map((t,i)=>({label:t[0],data:T.ttDatp.map(r=>r[i]),color:t[1]})),{h:true,stacked:true});
 fit('dgTdDatp',18);
 vhttBar('dgTdPct',DTTG_DATP.map(d=>d[0]),[{label:'Tiến độ kế hoạch',data:T.tdDatp.map(r=>Math.round(r[0])),color:'#8ba7c2'},{label:'Tiến độ thực tế',data:T.tdDatp.map(r=>Math.round(r[1])),color:'#2a78d6'}],{h:true});
 fit('dgTdPct',18); pct100('dgTdPct');
 /* 3. Kết quả */
 vhttBar('dgKqTl',['Hộ dùng nước hợp vệ sinh','Đường trung tâm cứng hóa','Học sinh đi học đúng cấp','Giảm hộ nghèo'],[{label:'Tỷ lệ (%)',data:K.tl.map(v=>Math.round(v*10)/10),color:'#2a78d6'}],{h:true});
 pct100('dgKqTl');
 const kx=S.kqXa.slice().sort((a,b)=>b.hoNgheoDau-a.hoNgheoDau);
 vhttBar('dgKqNgheo',kx.map(u=>ten(u.ten)),[{label:'Hộ nghèo đầu kỳ',data:kx.map(u=>u.hoNgheoDau),color:'#8ba7c2'},{label:'Hộ nghèo cuối kỳ',data:kx.map(u=>u.hoNgheoCuoi),color:'#d33a44'}],{h:true});
 fit('dgKqNgheo');
 const nx=S.kqXa.slice().sort((a,b)=>b.soHo-a.soHo);
 vhttBar('dgKqNuoc',nx.map(u=>ten(u.ten)),[{label:'Hộ DTTS',data:nx.map(u=>u.soHo),color:'#8ba7c2'},{label:'Hộ dùng nước hợp vệ sinh',data:nx.map(u=>u.hoNuoc),color:'#39d5ff'}],{h:true});
 fit('dgKqNuoc');
 /* 4. Báo cáo, đối soát */
 vhttDonut('dgDsBc',DTTG_BC.map((b,i)=>[b[0],D.bc[i],b[1]]),fmt(DTTG_DV.length),'phường/xã');
 vhttDonut('dgDsDs',DTTG_DOI_SOAT.map((b,i)=>[b[0],D.doiSoat[i],b[1]]),fmt(T.n),'bản ghi');
 vhttBar('dgDsCo',DTTG_CO.map(c=>c[0]),[{label:'Bản ghi',data:D.co,color:'#7086FD'}],{h:true});
 fit('dgDsCo');
 const nd=DTTG_NGUON_DL.map((x,i)=>[x,D.ndl[i]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('dgDsNdl',nd.map(r=>r[0]),[{label:'Bản ghi',data:nd.map(r=>r[1]),color:'#4a3aa7'}],{h:true});
 fit('dgDsNdl',20);
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function dttgUnitTableHtml(){
 const U=DTTG_UNITS, S=DTTG_SUM, sum=(a,f)=>a.reduce((x,r)=>x+f(r),0);
 const BC=['Có dự án','Không phát sinh','Chưa báo cáo'];
 const cols=[
 {l:'Báo cáo tháng 9',v:(u)=>BC[u.bc],t:(S.ds.bc[0]+S.ds.bc[1])+' đã báo cáo'},
 {l:'Dự án, công trình',v:(u)=>u.bc?'—':fmt(u.rec.length),t:fmt(S.td.n)},
 {l:'Kế hoạch vốn (tỷ đồng)',v:(u)=>u.bc?'—':dttgTy(sum(u.rec,r=>r.kh)),t:dttgTy(S.gn.kh)},
 {l:'Giải ngân lũy kế (tỷ đồng)',v:(u)=>u.bc?'—':dttgTy(sum(u.rec,r=>r.gn9)),t:dttgTy(S.gn.gn)},
 {l:'Giải ngân / kế hoạch',v:(u)=>u.bc?'—':dttgP(sum(u.rec,r=>r.gn9)/sum(u.rec,r=>r.kh)*100),t:dttgP(S.gn.gn/S.gn.kh*100)},
 {l:'Hộ nghèo DTTS cuối kỳ',v:(u)=>u.bc?'—':fmt(u.hoNgheoCuoi),t:fmt(S.kq.hoNgheoCuoi)},
 {l:'Đã đối soát cấp sở',v:(u)=>u.bc?'—':u.rec.filter(r=>r.doiSoat===0).length+'/'+u.rec.length,t:S.ds.doiSoat[0]+'/'+S.td.n}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng ${U.length} phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr${u.bc===1?' style="color:var(--text-muted)"':''}><td>${esc(u.ten)}</td>${cols.map((c,i)=>`<td class="num" style="text-align:right${!i&&u.bc===2?';color:#ff8a8a;font-weight:700':''}">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(DTTG_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Lấy theo trường Địa bàn của eform. Vùng đồng bào DTTS và miền núi theo Quyết định 201/QĐ-UBND ngày 15/01/2026: ${esc(DTTG_VUNG_NGAN)}; số liệu giả lập; phường/xã không có dự án gửi bản "Không phát sinh"; ${S.ds.bc[2]} đơn vị chưa báo cáo tháng 9 (tô đỏ). Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*115}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
