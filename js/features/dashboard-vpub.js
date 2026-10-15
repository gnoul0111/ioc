 /* ===== Giao diện riêng cho "Văn phòng UBND Thành phố Hà Nội" — 5 chỉ tiêu theo 5 eform, SỐ GIẢ LẬP (vpub-config.js) =====
 Cùng khuôn với Sở VHTT: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp, các khối biểu đồ Chart.js và
 1 khối "Cách tính" (đọc từ VPUB_CT). Dùng lại các hàm vẽ của dashboard-vhtt.js (vhttTiles, vhttChartBox, vhttFormulaBox,
 vhttBar, vhttDonut, vhttWrap) nên nạp SAU dashboard-vhtt.js. Ô bên phải mặc định là bảng 126 phường/xã (vpubUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initVpubCharts() gọi từ openCategoryDetail. */

 function vpubCt(key){ return VPUB_CT.find(c=>c.key===key); }
 function vpubHead(key,extra){ const i=VPUB_CT.findIndex(c=>c.key===key), ct=VPUB_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 function vpubFormula(key){ return vhttFormulaBox(Object.assign({gdTitle:'Giả định, cần Văn phòng xác nhận'},vpubCt(key))); }
 const vpubP=(v)=>fmt(Math.round(v*10)/10)+'%';

 /* ---------- 5 chỉ tiêu ---------- */
 function vpubCs27Html(){
 const S=VPUB_SUM.cs27, D=VPUB_DATA.cs27, q=2;
 return catBoxHtml(vpubHead('cs27'),vhttTiles([
 ['Tổng văn bản, hồ sơ',fmt(S.tong[q])],['Xử lý trên môi trường mạng',fmt(S.mang[q])],
 ['Tỷ lệ toàn Thành phố',vpubP(S.tyLeQ[q]),'quý II: '+vpubP(S.tyLeQ[1])],
 ['Sở, ban, ngành',vpubP(S.soTyLe),D.soDv+' đơn vị'],['Phường/xã',vpubP(S.xaTyLe),VPUB_DV.length+' đơn vị']
 ]),vpubCt('cs27').freq)
 +vhttChartBox('vpCs27Quy','Văn bản, hồ sơ và tỷ lệ xử lý trên mạng theo quý',240,undefined,'Cột: số văn bản, hồ sơ của 2 cấp · Đường: tỷ lệ toàn Thành phố (%).')
 +vhttChartBox('vpCs27Nhom','Phường/xã theo mức tỷ lệ — quý III',220)
 +vhttChartBox('vpCs27Thap','10 phường/xã có tỷ lệ thấp nhất — quý III (%)',300)
 +vpubFormula('cs27');
 }
 function vpubCs29Html(){
 const S=VPUB_SUM.cs29;
 return catBoxHtml(vpubHead('cs29'),vhttTiles([
 ['Đơn vị báo cáo',fmt(S.dv)],['Đã triển khai trợ lý ảo',fmt(S.tla)],['Tỷ lệ đã triển khai',vpubP(S.tla/S.dv*100)],['Chưa triển khai',fmt(S.dv-S.tla)]
 ]),vpubCt('cs29').freq)
 +vhttChartBox('vpCs29Cap','Phường và xã',180)
 +vhttChartBox('vpCs29App','Theo ứng dụng trợ lý ảo',220)
 +vhttChartBox('vpCs29Dt','Theo đối tượng phục vụ',220)
 +vpubFormula('cs29');
 }
 function vpubCs74Html(){
 const S=VPUB_SUM.cs74, D=VPUB_DATA.cs74;
 return catBoxHtml(vpubHead('cs74'),vhttTiles([
 ['Tổng số nhiệm vụ',fmt(S.tong)],['Đã hoàn thành',fmt(S.ht),vpubP(S.dungHanTyLe)+' đúng hạn'],['Tỷ lệ hoàn thành',vpubP(S.htTyLe)],
 ['Quá hạn chưa hoàn thành',fmt(S.quaHan)],['Sắp đến hạn',fmt(D.sapDenHan),'còn ≤ 7 ngày'],['Tiến độ bình quân',vpubP(D.tienDoBq),'nhiệm vụ đang thực hiện']
 ]),vpubCt('cs74').freq)
 +vhttChartBox('vpCs74St','Nhiệm vụ theo trạng thái thực hiện',230)
 +vhttChartBox('vpCs74Cq','Nhiệm vụ theo cơ quan giao',210)
 +vhttChartBox('vpCs74Ct','Nhiệm vụ theo đơn vị chủ trì',320)
 +vhttChartBox('vpCs74Lk','Giao và hoàn thành lũy kế theo tháng',230)
 +vpubFormula('cs74');
 }
 function vpubCs52Html(){
 const h=VPUB_SUM.cs52.hs;
 return catBoxHtml(vpubHead('cs52'),vhttTiles([
 ['Hồ sơ tiếp nhận',fmt(h.tn)],['Giải quyết đúng hạn',vpubP(h.dh/(h.dh+h.qh)*100),fmt(h.dh)+' hồ sơ'],['Quá hạn',fmt(h.qh)],
 ['Hồ sơ trực tuyến',vpubP(h.tt/h.tn*100)],['Thanh toán trực tuyến',vpubP(h.tttt/h.tt*100),'trên hồ sơ trực tuyến'],
 ['Đã số hóa',vpubP(h.sh/h.tn*100)],['Điểm hài lòng',vpubP(h.hl)]
 ]),vpubCt('cs52').freq)
 +vhttChartBox('vpCs52Quy','Kết quả giải quyết theo quý',240)
 +vhttChartBox('vpCs52Kq','Kết quả giải quyết — 9 tháng',220)
 +vhttChartBox('vpCs52Tl','Các tỷ lệ: phường và xã (%)',240)
 +vpubFormula('cs52');
 }
 function vpubCs1112Html(){
 const S=VPUB_SUM.cs1112;
 return catBoxHtml(vpubHead('cs1112'),vhttTiles([
 ['Tổng thiết bị, hệ thống',fmt(S.tong)],['Đang hoạt động',vpubP(S.tt[0]/S.tong*100),fmt(S.tt[0])],['Hỏng/không hoạt động',fmt(S.tt[3])],
 ['Máy tính làm việc',fmt(S.loaiTong[0]),'phường/xã '+fmt(S.loai[0][1].reduce((a,b)=>a+b,0))+' · sở/ngành '+fmt(S.loai[0][2].reduce((a,b)=>a+b,0))],
 ['Phòng họp có giao ban trực tuyến',vpubP(S.phongTb/S.phong*100),fmt(S.phongTb)+'/'+fmt(S.phong)+' phòng'],['Đáp ứng đầy đủ',vpubP(S.dapUng[0]/S.dapUng.reduce((a,b)=>a+b,0)*100),'lượt đánh giá']
 ]),vpubCt('cs1112').freq)
 +vhttChartBox('vpCs11Loai','Số lượng theo loại hạ tầng (trừ máy tính)',360,undefined,'Máy tính làm việc xem ở ô số phía trên, không vẽ ở đây vì số lớn hơn hẳn các loại khác.')
 +vhttChartBox('vpCs11Tt','Theo tình trạng hoạt động',220)
 +vhttChartBox('vpCs11Du','Mức độ đáp ứng theo cấp',170)
 +vhttChartBox('vpCs11Ph','Phòng họp có hệ thống giao ban trực tuyến',170)
 +vpubFormula('cs1112');
 }
 const VPUB_BUILDERS={cs27:vpubCs27Html,cs29:vpubCs29Html,cs74:vpubCs74Html,cs52:vpubCs52Html,cs1112:vpubCs1112Html};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined'){
 CUSTOM_CAT_ITEM_BUILDERS['ubnd-vpubnd']=VPUB_CT.map(c=>VPUB_BUILDERS[c.key]);
 }

 /* ---------- Biểu đồ (vẽ bằng vhttBar/vhttDonut, instance lưu chung trong vhttChartInstances với id bắt đầu "vp") ---------- */
 function initVpubCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('vp')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const D=VPUB_DATA, S=VPUB_SUM, Q=VPUB_QUY;
 /* 1. Chỉ số 27 */
 vhttBar('vpCs27Quy',Q,[{label:'Sở, ban, ngành',data:D.cs27.soTong,color:'#7086FD',yAxisID:'y'},{label:'Phường/xã',data:S.cs27.xaTong,color:'#39d5ff',yAxisID:'y'},
 {type:'line',label:'Tỷ lệ xử lý trên mạng (%)',data:S.cs27.tyLeQ.map(v=>Math.round(v*10)/10),color:'#1baf7a',yAxisID:'y1'}],{y1:true,stacked:true,noLabels:true});
 vhttDonut('vpCs27Nhom',D.cs27.nhom.map((g,i)=>[g[0],S.cs27.nhom[i],g[2]]),fmt(VPUB_DV.length),'phường/xã');
 vhttBar('vpCs27Thap',S.cs27.thapNhat.map(r=>r[0]),[{label:'Tỷ lệ (%)',data:S.cs27.thapNhat.map(r=>Math.round(r[1]*10)/10),color:'#eda100'}],{h:true});
 /* 2. Chỉ số 29 */
 vhttBar('vpCs29Cap',['Phường','Xã'],[{label:'Đã triển khai',data:[S.cs29.phuong[0],S.cs29.xa[0]],color:'#1baf7a'},{label:'Chưa triển khai',data:[S.cs29.phuong[1]-S.cs29.phuong[0],S.cs29.xa[1]-S.cs29.xa[0]],color:'#898781'}],{h:true,stacked:true});
 vhttDonut('vpCs29App',D.cs29.app.map((a,i)=>[a[0],S.cs29.app[i],a[1]]),fmt(S.cs29.tla),'đơn vị');
 vhttDonut('vpCs29Dt',D.cs29.doiTuong.map((a,i)=>[a[0],S.cs29.dt[i],a[1]]),fmt(S.cs29.tla),'đơn vị');
 /* 3. Chỉ số 74 */
 vhttDonut('vpCs74St',D.cs74.st.map((x,i)=>[x.l,S.cs74.st[i],x.c]),fmt(S.cs74.tong),'nhiệm vụ');
 vhttBar('vpCs74Cq',D.cs74.coQuan.map(r=>vhttWrap(r[0],16)),D.cs74.st.map((x,i)=>({label:x.l,data:D.cs74.coQuan.map(r=>r[1][i]),color:x.c})),{h:true,stacked:true});
 vhttBar('vpCs74Ct',D.cs74.chuTri.map(r=>vhttWrap(r[0],20)),D.cs74.nhom4.map((g,i)=>({label:g[0],data:D.cs74.chuTri.map(r=>r[1][i]),color:g[1]})),{h:true,stacked:true});
 vhttBar('vpCs74Lk',VPUB_MONTHS,[{type:'line',label:'Đã giao (lũy kế)',data:S.cs74.lkGiao,color:'#2a78d6'},{type:'line',label:'Đã hoàn thành (lũy kế)',data:S.cs74.lkHt,color:'#1baf7a'}]);
 /* 4. Chỉ số 52 */
 const qy=S.cs52.quy;
 vhttBar('vpCs52Quy',Q,[{label:'Đúng hạn',data:qy.map(o=>o.dh),color:'#1baf7a'},{label:'Quá hạn',data:qy.map(o=>o.qh),color:'#d33a44'}],{stacked:true});
 const h=S.cs52.hs;
 /* BA mục 06: vòng 2 phần, giữa vòng = đã giải quyết (bỏ phần "Đang giải quyết" suy ra từ phép trừ) */
 vhttDonut('vpCs52Kq',[['Đúng hạn',h.dh,'#1baf7a'],['Quá hạn',h.qh,'#d33a44']],fmt(h.daGq),'hồ sơ đã giải quyết');
 const tl=(o)=>[o.dh/(o.dh+o.qh)*100,o.tt/o.tn*100,o.tttt/o.tt*100,o.sh/o.tn*100].map(v=>Math.round(v*10)/10);
 vhttBar('vpCs52Tl',['Đúng hạn','Trực tuyến','Thanh toán trực tuyến','Đã số hóa'].map(s=>vhttWrap(s,12)),[{label:'Phường',data:tl(S.cs52.cap[0]),color:'#2a78d6'},{label:'Xã',data:tl(S.cs52.cap[1]),color:'#6FD195'}]);
 /* 5. Chỉ số 11, 12 */
 const L=S.cs1112.loai.slice(1);
 vhttBar('vpCs11Loai',L.map(r=>vhttWrap(r[0],18)),[{label:'Phường/xã',data:L.map(r=>r[1].reduce((a,b)=>a+b,0)),color:'#39d5ff'},{label:'Sở/ngành',data:L.map(r=>r[2].reduce((a,b)=>a+b,0)),color:'#7086FD'}],{h:true,stacked:true});
 /* 9 nhãn dài, hiện đủ (mặc định Chart.js bỏ bớt nhãn khi trục chật) */
 const cLoai=vhttChartInstances.vpCs11Loai; if(cLoai){cLoai.options.scales.y.ticks.autoSkip=false; cLoai.update();}
 vhttDonut('vpCs11Tt',D.cs1112.tt.map((t,i)=>[t[0],S.cs1112.tt[i],t[1]]),fmt(S.cs1112.tong),'thiết bị, hệ thống');
 vhttBar('vpCs11Du',['Phường/xã','Sở/ngành'],D.cs1112.dapUng.map((t,i)=>({label:t[0],data:[D.cs1112.dapUngXa[i],D.cs1112.dapUngSo[i]],color:t[1]})),{h:true,stacked:true});
 vhttBar('vpCs11Ph',['Phường/xã','Sở/ngành'],[{label:'Tổng số phòng họp',data:[S.cs1112.phXa,D.cs1112.soPhongHop],color:'#8ba7c2'},{label:'Có giao ban trực tuyến',data:[S.cs1112.tbXa,D.cs1112.soPhongTb],color:'#1baf7a'}],{h:true});
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã (số lấy thẳng từ VPUB_UNITS, dòng đầu = cộng 126 đơn vị) ---------- */
 function vpubUnitTableHtml(){
 const U=VPUB_UNITS, S=VPUB_SUM, q=2;
 const hsU=U.map(u=>({tn:u.hs.reduce((a,x)=>a+x.tn,0),dh:u.hs.reduce((a,x)=>a+x.dh,0),qh:u.hs.reduce((a,x)=>a+x.qh,0)}));
 const cols=[
 {l:'VB xử lý trên mạng quý III (%)',v:(u)=>vpubP(u.vbMang[q]/u.vbTong[q]*100),t:vpubP(S.cs27.xaTyLe)},
 {l:'Trợ lý ảo',v:(u)=>u.tla?'Có':'Chưa',t:fmt(S.cs29.tla)+' Có'},
 {l:'Hồ sơ tiếp nhận 9 tháng',v:(u,i)=>fmt(hsU[i].tn),t:fmt(S.cs52.hs.tn)},
 {l:'Đúng hạn (%)',v:(u,i)=>vpubP(hsU[i].dh/(hsU[i].dh+hsU[i].qh)*100),t:vpubP(S.cs52.hs.dh/(S.cs52.hs.dh+S.cs52.hs.qh)*100)},
 {l:'Phòng họp có giao ban',v:(u)=>u.phongTb+'/'+u.phongHop,t:fmt(S.cs1112.tbXa)+'/'+fmt(S.cs1112.phXa)},
 {l:'Nhiệm vụ CP, TTg có địa bàn',v:(u,i)=>fmt(VPUB_NV_DIABAN[i]),t:fmt(VPUB_DATA.cs74.coDiaBan)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng ${U.length} phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map((u,i)=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u,i))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(VPUB_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Đơn vị báo cáo (hoặc Địa bàn) của từng eform. Dòng đầu là cộng 126 phường/xã, chưa gồm các sở, ban, ngành. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*120}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
