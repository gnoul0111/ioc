 /* ===== Giao diện riêng cho "Thanh tra Thành phố" — 3 chỉ tiêu theo 3 eform, SỐ GIẢ LẬP (ttra-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ
 Chart.js (cách tính chỉ nằm trong tài liệu mô tả). Dùng lại các hàm vẽ của dashboard-vhtt.js (vhttTiles, vhttChartBox, vhttBar,
 vhttDonut, vhttWrap) nên nạp SAU dashboard-vhtt.js. Ô bên phải mặc định là bảng 126 phường/xã (ttraUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initTtraCharts() gọi từ openCategoryDetail. */

 function ttraCt(key){ return TTRA_CT.find(c=>c.key===key); }
 function ttraHead(key,extra){ const i=TTRA_CT.findIndex(c=>c.key===key), ct=TTRA_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const ttraP=(v)=>fmt(Math.round(v*10)/10)+'%';
 function ttraChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }
 const ttraTy=(trieu)=>fmt(Math.round(trieu/10)/100);   // triệu đồng → tỷ đồng, 2 chữ số thập phân

 /* ---------- 3 chỉ tiêu ---------- */
 function ttraKtHtml(){
 const S=TTRA_SUM.kt;
 return catBoxHtml(ttraHead('kt'),vhttTiles([
 TTRA_SHOW_KE_HOACH_KT?['Cuộc kiểm tra',fmt(S.n)+'/'+fmt(S.keHoach),'so với kế hoạch năm 2026']:['Cuộc kiểm tra',fmt(S.n)],
 ['Đã ban hành kết luận',fmt(S.kl),fmt(S.soDv)+' đơn vị được kiểm tra'],
 ['Kiến nghị xử lý',fmt(S.soKn),'kiến nghị thu hồi '+fmt(S.thuHoi)+' triệu đồng'],
 ['Đã thực hiện kiến nghị',ttraP(S.da/S.soKn*100),fmt(S.da)+'/'+fmt(S.soKn)],
 ['Quá hạn thực hiện kiến nghị',fmt(S.qh),'kiến nghị']
 ]),ttraCt('kt').freq)
 +ttraChart('trKtTt','Cuộc kiểm tra theo trạng thái',220)
 +ttraChart('trKtNd','Cuộc kiểm tra theo nội dung chính',220)
 +ttraChart('trKtTg','Thời gian kiểm tra: kế hoạch và thực tế (ngày)',330,'Cuộc chưa kết thúc: cột thực tế là số ngày đã kiểm tra đến 30/9/2026.')
 +ttraChart('trKtKn','Thực hiện kiến nghị theo cuộc kiểm tra đã có kết luận',240);
 }
 function ttraTtHtml(){
 const S=TTRA_SUM.tt, td=TTRA_THEO_DOI;
 return catBoxHtml(ttraHead('tt'),vhttTiles([
 ['Cuộc thanh tra',fmt(S.n),fmt(S.kyTruoc)+' cuộc kỳ trước chuyển sang'],
 ['Đã ban hành kết luận',fmt(S.kl),fmt(S.soDvKl)+' đơn vị'],
 ['Kiến nghị thu hồi',ttraTy(S.thuHoi),'tỷ đồng · đã thu '+ttraP(S.daThu/S.thuHoi*100)],
 ['Kiến nghị xử lý hành chính',fmt(S.hcToChuc+S.hcCaNhan),fmt(S.hcToChuc)+' tổ chức · '+fmt(S.hcCaNhan)+' cá nhân'],
 ['Chuyển cơ quan điều tra',fmt(S.cqdt),'vụ việc'],
 ['Cảnh báo đỏ',fmt(S.cb[3]),'cuộc quá hạn trên 10 ngày'],
 ['Kết luận đang theo dõi',fmt(td.tong),'đã hoàn thành '+fmt(td.hoanThanh)]
 ]),ttraCt('tt').freq)
 +ttraChart('trTtTt','Cuộc thanh tra theo trạng thái',230)
 +ttraChart('trTtLv','Cuộc thanh tra theo lĩnh vực',300)
 +ttraChart('trTtNguon','Cuộc thanh tra theo nguồn kế hoạch',220)
 +ttraChart('trTtTien','Kiến nghị thu hồi và đã thu hồi theo lĩnh vực (triệu đồng)',260)
 +ttraChart('trTtCb','Mức cảnh báo cuộc thanh tra',190)
 +ttraChart('trTtTd','Theo dõi thực hiện kết luận thanh tra các năm trước',220);
 }
 function ttraTcdHtml(){
 const S=TTRA_SUM.tcd;
 return catBoxHtml(ttraHead('tcd'),vhttTiles([
 ['Lượt tiếp công dân',fmt(S.luot),fmt(S.nguoi)+' công dân'],
 ['Đoàn đông người',fmt(S.doan)],
 ['Đơn thư tiếp nhận',fmt(S.donMoi),fmt(S.kyTruoc)+' đơn kỳ trước chuyển sang'],
 ['Vụ việc thụ lý',fmt(S.thuLy),'khiếu nại, tố cáo thuộc thẩm quyền'],
 ['Đã giải quyết',ttraP(S.daGq/S.thuLy*100),'đúng hạn '+ttraP(S.dungHan/S.daGq*100)],
 ['Tồn cuối kỳ',fmt(S.ton),fmt(S.phucTap)+' vụ phức tạp, kéo dài']
 ]),ttraCt('tcd').freq)
 +ttraChart('trTcThang','Lượt tiếp công dân và đơn thư tiếp nhận theo tháng',240)
 +ttraChart('trTcLoai','Đơn thư tiếp nhận theo loại',230)
 +ttraChart('trTcXl','Kết quả phân loại, xử lý đơn',230,'Gồm đơn mới trong kỳ và đơn kỳ trước chuyển sang.')
 +ttraChart('trTcKq','Kết quả giải quyết vụ việc khiếu nại, tố cáo',230)
 +ttraChart('trTcDb','15 phường/xã nhiều vụ việc khiếu nại, tố cáo nhất',380,'Bảng đủ 126 phường/xã ở ô bên phải.');
 }
 const TTRA_BUILDERS={kt:ttraKtHtml,tt:ttraTtHtml,tcd:ttraTcdHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-thanhtra']=TTRA_CT.map(c=>TTRA_BUILDERS[c.key]);

 /* ---------- Biểu đồ (id bắt đầu "tr") ---------- */
 function initTtraCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('tr')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=TTRA_SUM, K=S.kt, T=S.tt, C=S.tcd;
 /* nhãn trục dọc: hiện đủ, chừa chỗ cho số ở đầu cột; wrap = ngắt dòng NGAY TRÊN TRỤC (dữ liệu giữ tên đầy đủ cho bảng bấm-khối);
 short = viết tắt "Phường"/"Xã" trên trục */
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;}; c.update();};
 /* 1. Kiểm tra */
 vhttDonut('trKtTt',TTRA_KT_TT.map((t,i)=>[t[0],K.tt[i],t[1]]),fmt(K.n),'cuộc kiểm tra');
 vhttDonut('trKtNd',TTRA_KT_ND.map((t,i)=>[t[0],K.nd[i],t[1]]),fmt(K.n),'cuộc kiểm tra');
 const kt=TTRA_KT;
 vhttBar('trKtTg',kt.map(r=>r.diaBan),[{label:'Kế hoạch',data:kt.map(r=>r.ngayKh),color:'#8ba7c2'},
 {label:'Thực tế',data:kt.map(r=>r.ngayTt!=null?r.ngayTt:Math.max(0,TTRA_NGAY_CHOT-r.ngayBd)),color:'#2a78d6'}],{h:true});
 fit('trKtTg',{short:true});
 const kl=kt.filter(r=>r.kl);
 vhttBar('trKtKn',kl.map(r=>r.diaBan),[{label:'Đã thực hiện',data:kl.map(r=>r.da),color:'#1baf7a'},{label:'Đang thực hiện',data:kl.map(r=>r.dang),color:'#2a78d6'},{label:'Quá hạn',data:kl.map(r=>r.qh),color:'#d33a44'}],{h:true,stacked:true});
 fit('trKtKn',{short:true});
 /* 2. Thanh tra */
 vhttDonut('trTtTt',TTRA_TT.map((t,i)=>[t[0],T.tt[i],t[1]]),fmt(T.n),'cuộc thanh tra');
 const lv=TTRA_LV.map((l,i)=>[l,T.lv[i]]).sort((a,b)=>b[1]-a[1]);
 vhttBar('trTtLv',lv.map(r=>r[0]),[{label:'Cuộc thanh tra',data:lv.map(r=>r[1]),color:'#2a78d6'}],{h:true});
 fit('trTtLv');
 vhttDonut('trTtNguon',TTRA_NGUON.map((t,i)=>[t[0],T.nguon[i],t[1]]),fmt(T.n),'cuộc thanh tra');
 const lt=TTRA_LV.map((l,i)=>[l,T.lvTien[i]]).filter(r=>r[1][0]>0).sort((a,b)=>b[1][0]-a[1][0]);
 vhttBar('trTtTien',lt.map(r=>r[0]),[{label:'Kiến nghị thu hồi',data:lt.map(r=>r[1][0]),color:'#8ba7c2'},{label:'Đã thu hồi',data:lt.map(r=>r[1][1]),color:'#1baf7a'}],{h:true});
 fit('trTtTien',{wrap:18});
 vhttBar('trTtCb',TTRA_CB.map(c=>c[0]),[{label:'Cuộc thanh tra',data:T.cb,color:'#7086FD'}],{h:true});
 const cc=vhttChartInstances.trTtCb; if(cc){cc.data.datasets[0].backgroundColor=TTRA_CB.map(c=>c[1]); cc.update();}
 fit('trTtCb',{wrap:20});
 vhttDonut('trTtTd',TTRA_TD.map((t,i)=>[t[0],T.theoDoi[i],t[1]]),fmt(TTRA_THEO_DOI.tong),'kết luận');
 /* 3. Tiếp công dân, khiếu nại, tố cáo */
 vhttBar('trTcThang',TTRA_MONTHS,[{label:'Lượt tiếp công dân',data:C.luotT,color:'#7086FD'},{label:'Đơn thư tiếp nhận',data:C.donT,color:'#2a78d6'}],{noLabels:true});
 vhttDonut('trTcLoai',TTRA_LOAI_DON.map((t,i)=>[t[0],[C.kn,C.tc,C.knpa,C.khac][i],t[1]]),fmt(C.donMoi),'đơn');
 vhttDonut('trTcXl',[['Thuộc thẩm quyền',C.tq,'#1baf7a'],['Không thuộc thẩm quyền, đã chuyển',C.chuyen,'#2a78d6'],['Không thuộc thẩm quyền, đã hướng dẫn',C.huongDan,'#39d5ff'],['Không đủ điều kiện/lưu',C.khongDk,'#8ba7c2']],fmt(C.daXl),'đơn đã xử lý'); /* BA mục 82: giữa vòng = đã xử lý (cộng 4 phần), không phải kỳ trước + đơn mới */
 vhttDonut('trTcKq',TTRA_KQ.map((t,i)=>[t[0],[C.dungHan,C.quaHan,C.dangTh,C.dangQh,C.rut][i],t[1]]),fmt(C.thuLy),'vụ việc thụ lý');
 vhttBar('trTcDb',C.top.map(r=>r[0]),[{label:'Đã giải quyết',data:C.top.map(r=>r[1]),color:'#1baf7a'},{label:'Tồn',data:C.top.map(r=>r[2]),color:'#d33a44'},{label:'Rút đơn/đình chỉ',data:C.top.map(r=>r[3]),color:'#898781'}],{h:true,stacked:true});
 fit('trTcDb',{short:true});
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function ttraUnitTableHtml(){
 const U=TTRA_TCD, S=TTRA_SUM;
 const cuoc={}; TTRA_CUOC.forEach(c=>{cuoc[c.diaBan]=(cuoc[c.diaBan]||0)+1;});
 const kt={}; TTRA_KT.forEach(r=>{kt[r.diaBan]=TTRA_KT_TT[r.tt][0];});
 const cols=[
 {l:'Lượt tiếp công dân',v:(u)=>fmt(u.luot),t:fmt(S.tcd.luot)},
 {l:'Đơn thư tiếp nhận',v:(u)=>fmt(u.donMoi),t:fmt(S.tcd.donMoi)},
 {l:'Vụ việc thụ lý',v:(u)=>fmt(u.thuLy),t:fmt(S.tcd.thuLy)},
 {l:'Đã giải quyết',v:(u)=>u.thuLy?ttraP(u.daGq/u.thuLy*100):'—',t:ttraP(S.tcd.daGq/S.tcd.thuLy*100)},
 {l:'Tồn cuối kỳ',v:(u)=>fmt(u.ton),t:fmt(S.tcd.ton)},
 {l:'Cuộc thanh tra tại địa bàn',v:(u)=>cuoc[u.ten]?fmt(cuoc[u.ten]):'—',t:fmt(S.tt.n)},
 {l:'Kiểm tra Chủ tịch UBND',v:(u)=>kt[u.ten]||'—',t:fmt(S.kt.n)+' cuộc'}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Cộng ${U.length} phường/xã</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(TTRA_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của 3 eform. Tiếp công dân, khiếu nại, tố cáo: cộng bản ghi tổng hợp tháng 1 – 9 của từng phường/xã. Cuộc thanh tra: theo địa bàn của đơn vị được thanh tra. Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*115}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
