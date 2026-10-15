 /* ===== Giao diện riêng cho "Sở Nội vụ" — 4 chỉ tiêu theo 2 eform, SỐ GIẢ LẬP (snv-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ
 Chart.js (cách tính chỉ nằm trong tài liệu mô tả). Không hiện mã chỉ tiêu của eform trên giao diện, chỉ tên bằng lời.
 Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js. Ô bên phải là bảng 126 phường/xã (snvUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (ghi đè dòng 'ubnd-noivu' cũ trong subtasks.js; 5 khối số liệu thật của
 dashboard-noi-vu.js giữ ở cuối); initSnvCharts() gọi từ openCategoryDetail. */

 function snvCt(key){ return SNV_CT.find(c=>c.key===key); }
 function snvHead(key,extra){ const i=SNV_CT.findIndex(c=>c.key===key), ct=SNV_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const snvP=(v)=>fmt(Math.round(v*10)/10)+'%';
 const snvR1=(v)=>Math.round(v*10)/10;
 /* tiền lưu triệu đồng → hiện tỷ đồng */
 const snvTy=(v)=>fmt(Math.round(v/1000));
 function snvChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }

 /* ---------- 4 chỉ tiêu ---------- */
 function snvBhHtml(){
 const S=SNV_SUM.bh;
 return catBoxHtml(snvHead('bh'),vhttTiles([
 ['Tham gia bảo hiểm xã hội',snvP(S.bhxh/S.llld*100),fmt(S.bhxh)+' người'],
 ['Tham gia bảo hiểm thất nghiệp',snvP(S.bhtn/S.llld*100),fmt(S.bhtn)+' người'],
 ['Lực lượng lao động trong độ tuổi',fmt(S.llld),'người'],
 ['Người hưởng chế độ hằng tháng',fmt(S.nguoiHuong),snvP(S.quaTk/S.nguoiHuong*100)+' nhận qua tài khoản'],
 ['Đã thu 9 tháng',snvTy(S.daThu)+' tỷ đồng',snvP(S.daThu/S.phaiThu*100)+' số phải thu'],
 ['Đã chi 9 tháng',snvTy(S.daChi)+' tỷ đồng',snvP(S.daChi/S.phaiChi*100)+' số phải chi']
 ]),snvCt('bh').freq)
 +snvChart('snBhXh','Tỷ lệ tham gia bảo hiểm xã hội, bảo hiểm thất nghiệp theo tháng (%)',230,'Tỷ lệ trên lực lượng lao động trong độ tuổi. Chỉ tiêu năm 2025 của Thành phố: bảo hiểm xã hội bắt buộc 47,5% và tự nguyện 3,5%, bảo hiểm thất nghiệp 45%.')
 +snvChart('snBhTc','Thu, chi bảo hiểm theo tháng (tỷ đồng)',240)
 +snvChart('snBhNhom','Phường/xã theo tỷ lệ tham gia bảo hiểm xã hội — tháng 9',220)
 +snvChart('snBhThap','10 phường/xã có tỷ lệ tham gia bảo hiểm xã hội thấp nhất — tháng 9 (%)',300);
 }
 function snvLdHtml(){
 const S=SNV_SUM.ld;
 return catBoxHtml(snvHead('ld'),vhttTiles([
 ['Lực lượng lao động',fmt(S.llld),'người'],
 ['Lao động qua đào tạo',snvP(S.daoTao/S.llld*100),fmt(S.daoTao)+' người'],
 ['Đi làm việc ở nước ngoài',fmt(S.diNn),'người, 9 tháng'],
 ['Lao động nước ngoài đang làm việc',fmt(S.nuocNgoai),'người, tháng 9']
 ]),snvCt('ld').freq)
 +snvChart('snLdDi','Lao động đi làm việc ở nước ngoài theo hợp đồng, theo tháng (người)',220)
 +snvChart('snLdNn','10 phường/xã có nhiều lao động nước ngoài nhất (người)',300)
 +snvChart('snLdThap','10 phường/xã có tỷ lệ lao động qua đào tạo thấp nhất (%)',300);
 }
 function snvBcHtml(){
 const S=SNV_SUM.bc;
 return catBoxHtml(snvHead('bc'),vhttTiles([
 ['Biên chế được giao',fmt(S.giao),'126 phường/xã'],
 ['Biên chế thực hiện',fmt(S.thucHien),snvP(S.thucHien/S.giao*100)+' số được giao'],
 ['Biên chế hưởng lương',fmt(S.huongLuong),'người'],
 ['Tuyển mới',fmt(S.tuyen),'người, 9 tháng'],
 ['Nghỉ hưu',fmt(S.huu),'người, 9 tháng'],
 ['Thôi việc',fmt(S.thoiViec),'người, 9 tháng'],
 ['Chuyển công tác',fmt(S.chuyen),'người, 9 tháng']
 ]),snvCt('bc').freq)
 +snvChart('snBcBd','Biến động công chức, viên chức theo tháng (người)',240)
 +snvChart('snBcNhom','Phường/xã theo tỷ lệ biên chế thực hiện so với được giao — tháng 9',220)
 +snvChart('snBcThieu','10 phường/xã còn thiếu nhiều biên chế nhất so với được giao (người)',300);
 }
 function snvCdsHtml(){
 const S=SNV_SUM.cds, dv=SNV_DV.length;
 return catBoxHtml(snvHead('cds'),vhttTiles([
 ['Được bồi dưỡng kỹ năng số cơ bản',snvP(S.kns/S.tong*100),fmt(S.kns)+'/'+fmt(S.tong)+' người'],
 ['Được cấp chữ ký số công vụ',snvP(S.cks/S.tong*100),fmt(S.cks)+'/'+fmt(S.tong)+' người'],
 ['Có chuyên trách chuyển đổi số',S.tieuChi[0][1]+'/'+dv,'phường/xã · '+fmt(S.dvCds)+' đơn vị'],
 ['Có chuyên trách an toàn thông tin mạng',S.tieuChi[1][1]+'/'+dv,'phường/xã · '+fmt(S.dvAntt)+' đơn vị']
 ]),snvCt('cds').freq)
 +snvChart('snCdsXh','Tỷ lệ công chức, viên chức được bồi dưỡng kỹ năng số, được cấp chữ ký số theo tháng (%)',230,'Từ 30/6/2025 toàn bộ cán bộ xử lý hồ sơ trên môi trường mạng và ký số.')
 +snvChart('snCdsTc','Phường/xã có công chức, viên chức chuyên trách',190)
 +snvChart('snCdsThap','10 phường/xã có tỷ lệ được bồi dưỡng kỹ năng số thấp nhất — tháng 9 (%)',300);
 }
 const SNV_BUILDERS={bh:snvBhHtml,ld:snvLdHtml,bc:snvBcHtml,cds:snvCdsHtml};
 /* 4 chỉ tiêu eform + 5 khối số liệu thật giữ nguyên (thứ tự khớp items của 'ubnd-noivu' trong central-level.js) */
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-noivu']=SNV_CT.map(c=>SNV_BUILDERS[c.key]).concat([
 ()=>kpiTileHtml('Doanh nghiệp tham gia tuyển dụng','64'),
 ()=>kpiTileHtml('Tổng số nhu cầu tuyển dụng','443'),
 ()=>kpiTileHtml('Số hồ sơ tìm việc','652'),
 typeof noivuBox1Html==='function'?noivuBox1Html:null,
 typeof noivuBox2Html==='function'?noivuBox2Html:null
 ]);

 /* ---------- Biểu đồ (id bắt đầu "sn") ---------- */
 function initSnvCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('sn')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=SNV_SUM, B=S.bh, L=S.ld, C=S.bc, D=S.cds, M=SNV_MONTHS, dv=SNV_DV.length;
 /* nhãn trục dọc: viết tắt Phường/Xã ngay trên trục (dữ liệu giữ tên đầy đủ cho bảng bấm-khối); pct: trục % không ghi vạch trên 100 */
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;};
 if(o.pct){c.options.scales.x.max=114; c.options.scales.x.ticks.callback=(v)=>v<=100?fmt(v):'';}
 c.update();};
 const yRange=(id,min,max)=>{const c=vhttChartInstances[id]; if(!c) return; c.options.scales.y.min=min; c.options.scales.y.max=max; c.options.scales.y.beginAtZero=false; c.update();};
 /* 1. Bảo hiểm */
 vhttBar('snBhXh',M,[{type:'line',label:'Bảo hiểm xã hội',data:B.xuHuong[0].map(snvR1),color:'#2a78d6'},{type:'line',label:'Bảo hiểm thất nghiệp',data:B.xuHuong[1].map(snvR1),color:'#eda100'}]);
 yRange('snBhXh',40,60);
 vhttBar('snBhTc',M,[{label:'Đã thu',data:B.dtT.map(v=>Math.round(v/1000)),color:'#2a78d6'},{label:'Đã chi',data:B.dcT.map(v=>Math.round(v/1000)),color:'#6FD195'}],{noLabels:true});
 vhttDonut('snBhNhom',B.nhom,fmt(dv),'phường/xã');
 vhttBar('snBhThap',B.thap.map(r=>r[0]),[{label:'Tham gia bảo hiểm xã hội (%)',data:B.thap.map(r=>snvR1(r[1])),color:'#eda100'}],{h:true});
 fit('snBhThap',{short:true,pct:true});
 /* 2. Lao động */
 vhttBar('snLdDi',M,[{label:'Số người',data:L.diT,color:'#2a78d6'}]);
 vhttBar('snLdNn',L.nnTop.map(r=>r[0]),[{label:'Lao động nước ngoài (người)',data:L.nnTop.map(r=>r[1]),color:'#7086FD'}],{h:true});
 fit('snLdNn',{short:true});
 vhttBar('snLdThap',L.dtThap.map(r=>r[0]),[{label:'Lao động qua đào tạo (%)',data:L.dtThap.map(r=>snvR1(r[1])),color:'#eda100'}],{h:true});
 fit('snLdThap',{short:true,pct:true});
 /* 3. Biên chế: tuyển mới và 3 loại giảm, cột xếp chồng theo tháng */
 vhttBar('snBcBd',M,[{label:'Tuyển mới',data:C.tuyenT,color:'#1baf7a',stack:'tang'},{label:'Nghỉ hưu',data:C.giamT[0],color:'#898781',stack:'giam'},{label:'Thôi việc',data:C.giamT[1],color:'#d33a44',stack:'giam'},{label:'Chuyển công tác',data:C.giamT[2],color:'#eda100',stack:'giam'}],{stacked:true,noLabels:true});
 vhttDonut('snBcNhom',C.nhom,fmt(dv),'phường/xã');
 vhttBar('snBcThieu',C.thieu.map(r=>r[0]),[{label:'Còn thiếu so với được giao (người)',data:C.thieu.map(r=>r[1]),color:'#eda100'}],{h:true});
 fit('snBcThieu',{short:true});
 /* 4. Chuyển đổi số */
 vhttBar('snCdsXh',M,[{type:'line',label:'Được bồi dưỡng kỹ năng số',data:D.xuHuong[0].map(snvR1),color:'#2a78d6'},{type:'line',label:'Được cấp chữ ký số',data:D.xuHuong[1].map(snvR1),color:'#1baf7a'}]);
 yRange('snCdsXh',70,100);
 vhttBar('snCdsTc',D.tieuChi.map(r=>r[0]),[{label:'Có',data:D.tieuChi.map(r=>r[1]),color:'#1baf7a'},{label:'Không',data:D.tieuChi.map(r=>dv-r[1]),color:'#d33a44'}],{h:true,stacked:true});
 fit('snCdsTc',{wrap:24});
 vhttBar('snCdsThap',D.thap.map(r=>r[0]),[{label:'Được bồi dưỡng kỹ năng số (%)',data:D.thap.map(r=>snvR1(r[1])),color:'#eda100'}],{h:true});
 fit('snCdsThap',{short:true,pct:true});
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function snvUnitTableHtml(){
 const U=SNV_UNITS, S=SNV_SUM, q=8, sm=(a)=>a.reduce((x,y)=>x+y,0);
 const cols=[
 {l:'Tham gia BHXH',v:(u)=>snvP(u.bh.thang[q].bhxh/u.bh.llld*100),t:snvP(S.bh.bhxh/S.bh.llld*100)},
 {l:'Tham gia BH thất nghiệp',v:(u)=>snvP(u.bh.thang[q].bhtn/u.bh.llld*100),t:snvP(S.bh.bhtn/S.bh.llld*100)},
 {l:'Thu so với phải thu (9 tháng)',v:(u)=>snvP(sm(u.bh.thang.map(x=>x.daThu))/sm(u.bh.thang.map(x=>x.phaiThu))*100),t:snvP(S.bh.daThu/S.bh.phaiThu*100)},
 {l:'Lao động qua đào tạo',v:(u)=>snvP(u.ld.daoTao/u.ld.llld*100),t:snvP(S.ld.daoTao/S.ld.llld*100)},
 {l:'Biên chế thực hiện / giao',v:(u)=>u.bc.thucHien+'/'+u.bc.giao,t:fmt(S.bc.thucHien)+'/'+fmt(S.bc.giao)},
 {l:'Bồi dưỡng kỹ năng số',v:(u)=>snvP(u.cds.thang[q].kns/u.cds.thang[q].tong*100),t:snvP(S.cds.kns/S.cds.tong*100)},
 {l:'Có chữ ký số',v:(u)=>snvP(u.cds.thang[q].cks/u.cds.thang[q].tong*100),t:snvP(S.cds.cks/S.cds.tong*100)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Toàn Thành phố</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(SNV_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của 2 eform. Dòng đầu là tỷ lệ chung toàn Thành phố, tính bằng cộng tử số và mẫu số của 126 phường/xã rồi mới chia (không lấy trung bình các dòng). Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*115}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
