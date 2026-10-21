 /* ===== Giao diện riêng cho "Sở Du lịch" — 2 chỉ tiêu theo 2 eform, SỐ GIẢ LẬP (dl-config.js) =====
 Cùng khuôn với Sở VHTT, Văn phòng UBND, Ban Quản lý KCNC & KCN: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số
 tổng hợp và các khối biểu đồ Chart.js (cách tính chỉ nằm trong tài liệu mô tả, không hiện trên giao diện). Dùng lại các
 hàm vẽ của dashboard-vhtt.js (vhttTiles, vhttChartBox, vhttBar, vhttDonut, vhttWrap) nên nạp SAU dashboard-vhtt.js.
 Ô bên phải mặc định là bảng 126 phường/xã (dlUnitTableHtml). Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js);
 initDlCharts() gọi từ openCategoryDetail. */

 function dlCt(key){ return DL_CT.find(c=>c.key===key); }
 function dlHead(key,extra){ const i=DL_CT.findIndex(c=>c.key===key), ct=DL_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const dlP=(v)=>fmt(Math.round(v*10)/10)+'%';
 /* lượt → nghìn lượt, triệu đồng → tỷ đồng (số nguyên, cho biểu đồ) */
 const dlK=(v)=>Math.round(v/1000);
 /* khối biểu đồ: ô chọn kỳ mặc định Tháng (eform của Sở báo cáo theo tháng) */
 function dlChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }
 const dlShort=(s)=>String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. ').replace('Văn Miếu - Quốc Tử Giám','Văn Miếu - QTG');
 const DL_C_QT='#7086FD', DL_C_ND='#2a78d6';

 /* ---------- 2 chỉ tiêu ---------- */
 function dlKhachHtml(){
 const S=DL_SUM.khach, dv=DL_DV.length, tg=(S.t9/S.t8-1)*100;
 return catBoxHtml(dlHead('khach'),vhttTiles([
 ['Tổng lượt khách',dlLuot(S.tong),'lượt'],
 ['Khách quốc tế',dlLuot(S.qt),dlP(S.tyQt)+' tổng lượt khách'],
 ['Khách nội địa',dlLuot(S.nd),dlP(100-S.tyQt)+' tổng lượt khách'],
 ['Tháng 9',dlLuot(S.t9),(tg>=0?'+':'')+dlP(tg)+' so với tháng 8'],
 ['Đơn vị có khách',fmt(S.dvCoKhach),'trên '+dv+' phường/xã']
 ]),dlCt('khach').freq)
 +dlChart('dlKhThang','Lượt khách theo tháng (nghìn lượt)',240,'Tháng 2 đông nhất do Tết và mùa lễ hội đầu năm.')
 +dlChart('dlKhLoai','Lượt khách theo loại điểm du lịch — 9 tháng (nghìn lượt)',260)
 +dlChart('dlKhDb','15 phường/xã đông khách nhất — 9 tháng (nghìn lượt)',400,'Bảng đủ 126 phường/xã ở ô bên phải.');
 }
 function dlDoanhThuHtml(){
 const S=DL_SUM.doanhThu;
 return catBoxHtml(dlHead('doanhThu','tỷ đồng'),vhttTiles([
 ['Tổng thu từ khách du lịch',dlTy(S.tong,0),'tỷ đồng'],
 ['Lưu trú và ăn uống',dlTy(S.ltau,0),dlP(S.ltau/S.tong*100)+' tổng thu'],
 ['Lữ hành',dlTy(S.lh,0),dlP(S.lh/S.tong*100)+' tổng thu'],
 ['Chi tiêu bình quân',fmt(Math.round(S.chiBq)),'nghìn đồng/lượt khách'],
 ['Tháng 9',dlTy(S.tongT[8],0),'tỷ đồng']
 ]),dlCt('doanhThu').freq)
 +dlChart('dlDtThang','Tổng thu theo tháng (tỷ đồng)',250,'Mỗi cột chia 3 phần: lưu trú và ăn uống, lữ hành, dịch vụ khác; cả cột = tổng thu từ khách du lịch.')
 +dlChart('dlDtCoCau','Cơ cấu tổng thu — 9 tháng',230)
 +dlChart('dlDtLoai','Tổng thu theo loại điểm du lịch — 9 tháng (tỷ đồng)',260)
 +dlChart('dlDtDb','15 phường/xã có tổng thu lớn nhất — 9 tháng (tỷ đồng)',400);
 }
 const DL_BUILDERS={khach:dlKhachHtml,doanhThu:dlDoanhThuHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-dulich']=DL_CT.map(c=>DL_BUILDERS[c.key]);
 /* Sở Du lịch đã nhập vào Sở Văn hóa, Thể thao và Du lịch (cờ UBND_SAP_XEP_SO_2026): 2 khối du lịch nối sau 6 khối của sở này */
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined' && typeof UBND_SAP_XEP_SO_2026!=='undefined' && UBND_SAP_XEP_SO_2026 && CUSTOM_CAT_ITEM_BUILDERS['ubnd-vhtt'])
 CUSTOM_CAT_ITEM_BUILDERS['ubnd-vhtt']=CUSTOM_CAT_ITEM_BUILDERS['ubnd-vhtt'].concat(CUSTOM_CAT_ITEM_BUILDERS['ubnd-dulich']);

 /* ---------- Biểu đồ (vẽ bằng vhttBar/vhttDonut, instance lưu chung trong vhttChartInstances với id bắt đầu "dl") ---------- */
 function initDlCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('dl')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=DL_SUM, M=DL_MONTHS, K=S.khach, T=S.doanhThu;
 /* hiện đủ nhãn trục dọc (mặc định Chart.js bỏ bớt khi chật) */
 const allTicks=(id,short)=>{const c=vhttChartInstances[id]; if(!c) return; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='24%'; /* chừa chỗ cho số tổng ở đầu cột xếp chồng */
 /* short: dữ liệu giữ tên đầy đủ (bảng bấm-khối hiện tên đầy đủ), chỉ nhãn trục viết tắt P./X. */
 if(short) c.options.scales.y.ticks.callback=function(v){return dlShort(this.getLabelForValue(v));}; c.update();};
 /* 1. Khách du lịch */
 vhttBar('dlKhThang',M,[{label:'Quốc tế',data:K.qtT.map(dlK),color:DL_C_QT},{label:'Nội địa',data:K.ndT.map(dlK),color:DL_C_ND}],{stacked:true});
 const lo=DL_LOAI.map((l,k)=>[l[0],K.qtLoai[k],K.ndLoai[k]]).sort((a,b)=>(b[1]+b[2])-(a[1]+a[2]));
 vhttBar('dlKhLoai',lo.map(r=>r[0]),[{label:'Quốc tế',data:lo.map(r=>dlK(r[1])),color:DL_C_QT},{label:'Nội địa',data:lo.map(r=>dlK(r[2])),color:DL_C_ND}],{h:true,stacked:true});
 allTicks('dlKhLoai');
 vhttBar('dlKhDb',K.top.map(r=>r[0]),[{label:'Quốc tế',data:K.top.map(r=>dlK(r[1])),color:DL_C_QT},{label:'Nội địa',data:K.top.map(r=>dlK(r[2])),color:DL_C_ND}],{h:true,stacked:true});
 allTicks('dlKhDb',true);
 /* 2. Doanh thu */
 vhttBar('dlDtThang',M,DL_CO_CAU.map((c,i)=>({label:c[0].replace(/ \(.*\)$/,''),data:[T.ltauT,T.lhT,T.khacT][i].map(dlK),color:c[1]})),{stacked:true});
 vhttDonut('dlDtCoCau',DL_CO_CAU.map((c,i)=>[c[0].replace(/ \(.*\)$/,''),dlK([T.ltau,T.lh,T.khac][i]),c[1]]),fmt(dlK(T.tong)),'tỷ đồng');
 const lt=DL_LOAI.map((l,k)=>[l[0],T.tongLoai[k],l[1]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('dlDtLoai',lt.map(r=>r[0]),[{label:'Tổng thu (tỷ đồng)',data:lt.map(r=>dlK(r[1])),color:'#1baf7a'}],{h:true});
 allTicks('dlDtLoai');
 vhttBar('dlDtDb',T.top.map(r=>r[0]),[{label:'Tổng thu (tỷ đồng)',data:T.top.map(r=>dlK(r[1])),color:'#1baf7a'}],{h:true});
 allTicks('dlDtDb',true);
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã (số lấy thẳng từ DL_UNITS, dòng đầu = cộng 126 đơn vị) ---------- */
 function dlUnitTableHtml(){
 const U=DL_UNITS, S=DL_SUM;
 const cols=[
 {l:'Lượt khách 9 tháng',v:(u)=>fmt(u.qt+u.nd),t:fmt(S.khach.tong)},
 {l:'Khách quốc tế',v:(u)=>fmt(u.qt),t:fmt(S.khach.qt)},
 {l:'Khách nội địa',v:(u)=>fmt(u.nd),t:fmt(S.khach.nd)},
 {l:'Tổng thu (tỷ đồng)',v:(u)=>dlTy(u.tong),t:dlTy(S.doanhThu.tong)},
 {l:'Lưu trú, ăn uống (tỷ đồng)',v:(u)=>dlTy(u.ltau),t:dlTy(S.doanhThu.ltau)},
 {l:'Lữ hành (tỷ đồng)',v:(u)=>dlTy(u.lh),t:dlTy(S.doanhThu.lh)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng ${U.length} phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(DL_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Đơn vị báo cáo của 2 eform, cộng các tháng 1 – 9 và mọi loại điểm du lịch. Dòng đầu là cộng 126 phường/xã. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*120}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
