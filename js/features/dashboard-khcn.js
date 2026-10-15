 /* ===== Giao diện riêng cho "Sở Khoa học và Công nghệ" — 3 chỉ tiêu chuyển đổi số cấp xã theo 3 eform, SỐ GIẢ LẬP (khcn-config.js) =====
 Cùng khuôn với các sở làm theo eform: mỗi chỉ tiêu là một chuỗi khối catBoxHtml — 1 khối số tổng hợp và các khối biểu đồ
 Chart.js (cách tính chỉ nằm trong tài liệu mô tả). Không hiện mã chỉ số ("mã 9", "mã 42"…) trên giao diện, chỉ tên bằng lời.
 Dùng lại các hàm vẽ của dashboard-vhtt.js nên nạp SAU dashboard-vhtt.js. Ô bên phải là bảng 126 phường/xã (khcnUnitTableHtml).
 Đăng ký vào CUSTOM_CAT_ITEM_BUILDERS (subtasks.js); initKhcnCharts() gọi từ openCategoryDetail. */

 function khcnCt(key){ return KHCN_CT.find(c=>c.key===key); }
 function khcnHead(key,extra){ const i=KHCN_CT.findIndex(c=>c.key===key), ct=KHCN_CT[i]; return `${i+1}. ${ct.name} — ${ct.ky}${extra?' · '+extra:''}`; }
 const khcnP=(v)=>fmt(Math.round(v*10)/10)+'%';
 const khcnR1=(v)=>Math.round(v*10)/10;
 function khcnChart(id,title,height,note){ return vhttChartBox(id,title,height,'Tháng',note); }

 /* ---------- 3 chỉ tiêu ---------- */
 function khcnHtHtml(){
 const S=KHCN_SUM.ht, dv=KHCN_DV.length, tc=S.tieuChi;
 return catBoxHtml(khcnHead('ht'),vhttTiles([
 ['Hộ có Internet cáp quang',khcnP(S.hoCq/S.ho*100),fmt(S.hoCq)+'/'+fmt(S.ho)+' hộ'],
 ['Dùng điện thoại thông minh',khcnP(S.sm/S.ds15*100),'dân số từ 15 tuổi'],
 ['Trụ sở có cáp quang',tc[0][1]+'/'+dv,'phường/xã'],
 ['Đáp ứng hạ tầng họp trực tuyến',tc[1][1]+'/'+dv,'phường/xã'],
 ['Có wifi công cộng miễn phí',tc[2][1]+'/'+dv,'phường/xã'],
 ['Điểm phục vụ dịch vụ công trực tuyến',tc[3][1]+'/'+dv,'phường/xã']
 ]),khcnCt('ht').freq)
 +khcnChart('kcHtCap','Phường và xã: hộ có cáp quang, người dùng điện thoại thông minh (%)',200)
 +khcnChart('kcHtTc','Tiêu chí hạ tầng tại trụ sở phường/xã',220)
 +khcnChart('kcHtThap','10 phường/xã có tỷ lệ hộ có cáp quang thấp nhất (%)',300);
 }
 function khcnCnHtml(){
 const S=KHCN_SUM.cn, dv=KHCN_DV.length;
 return catBoxHtml(khcnHead('cn'),vhttTiles([
 ['Dùng dịch vụ công trực tuyến',khcnP(S.dvctt/S.dan*100),fmt(S.dvctt)+' người'],
 ['Có danh tính điện tử',khcnP(S.dtdt/S.ds14*100),'dân số từ 14 tuổi'],
 ['Có chữ ký số',khcnP(S.cks/S.dsTt*100),'dân số trưởng thành'],
 ['Phổ cập kỹ năng số',khcnP(S.kns/S.dan*100),fmt(S.kns)+' người'],
 ['Có Tổ chuyển đổi số cộng đồng',S.tieuChi[0][1]+'/'+dv,'phường/xã'],
 ['Cán bộ học an toàn thông tin',khcnP(S.attt/S.cb*100),fmt(S.attt)+'/'+fmt(S.cb)+' người']
 ]),khcnCt('cn').freq)
 +khcnChart('kcCnTl','Bốn tỷ lệ công dân số: phường và xã (%)',260)
 +khcnChart('kcCnTc','Tổ chức hỗ trợ chuyển đổi số tại phường/xã',200)
 +khcnChart('kcCnThap','10 phường/xã có tỷ lệ dùng dịch vụ công trực tuyến thấp nhất (%)',300);
 }
 function khcnVbHtml(){
 const S=KHCN_SUM.vb, dv=KHCN_DV.length;
 return catBoxHtml(khcnHead('vb'),vhttTiles([
 ['Hồ sơ thủ tục tiếp nhận',fmt(S.hs),'tháng 9'],
 ['Trực tuyến toàn trình',khcnP(S.toanTrinh),'bình quân theo số hồ sơ'],
 ['Thanh toán trực tuyến',khcnP(S.tttt/S.nvtc*100),fmt(S.tttt)+'/'+fmt(S.nvtc)+' hồ sơ có phí'],
 ['Văn bản xử lý trên môi trường mạng',khcnP(S.vbMang/S.vbNb*100)],
 ['Văn bản trao đổi được ký số',khcnP(S.vbKySo/S.vbCq*100)],
 ['Có trợ lý ảo',S.troLy+'/'+dv,'phường/xã'],
 ['Nhận thanh toán không tiền mặt',S.ktm+'/'+dv,'phường/xã'],
 ['Hội nghị tổ chức trong tháng',fmt(S.hoiNghi)]
 ]),khcnCt('vb').freq)
 +khcnChart('kcVbXh','Diễn biến các tỷ lệ theo tháng (%)',250)
 +khcnChart('kcVbNhom','Phường/xã theo tỷ lệ hồ sơ trực tuyến toàn trình — tháng 9',220,'Thành phố yêu cầu phường/xã tiếp nhận tối thiểu 60% hồ sơ thủ tục trực tuyến.')
 +khcnChart('kcVbThap','10 phường/xã có tỷ lệ trực tuyến toàn trình thấp nhất — tháng 9 (%)',300);
 }
 const KHCN_BUILDERS={ht:khcnHtHtml,cn:khcnCnHtml,vb:khcnVbHtml};
 if(typeof CUSTOM_CAT_ITEM_BUILDERS!=='undefined') CUSTOM_CAT_ITEM_BUILDERS['ubnd-khcn']=KHCN_CT.map(c=>KHCN_BUILDERS[c.key]);

 /* ---------- Biểu đồ (id bắt đầu "kc") ---------- */
 function initKhcnCharts(){
 Object.keys(vhttChartInstances).filter(k=>k.indexOf('kc')===0).forEach(k=>{try{vhttChartInstances[k].destroy();}catch(e){} delete vhttChartInstances[k];});
 if(typeof Chart==='undefined') return;
 const S=KHCN_SUM, H=S.ht, C=S.cn, V=S.vb, dv=KHCN_DV.length;
 /* nhãn trục dọc: hiện đủ, ngắt dòng / viết tắt ngay trên trục (dữ liệu giữ tên đầy đủ cho bảng bấm-khối); pct: trục % không ghi vạch trên 100 */
 const fit=(id,o)=>{const c=vhttChartInstances[id]; if(!c) return; o=o||{}; c.options.scales.y.ticks.autoSkip=false; c.options.scales.x.grace='22%';
 if(o.wrap||o.short) c.options.scales.y.ticks.callback=function(v){let s=this.getLabelForValue(v); if(o.short) s=String(s).replace(/^Phường /,'P. ').replace(/^Xã /,'X. '); return o.wrap?vhttWrap(s,o.wrap):s;};
 if(o.pct){c.options.scales.x.max=114; c.options.scales.x.ticks.callback=(v)=>v<=100?fmt(v):'';}
 if(o.min!=null){c.options.scales.x.min=o.min; c.options.scales.x.beginAtZero=false;}
 c.update();};
 const coKhong=(id,rows)=>{vhttBar(id,rows.map(r=>r[0]),[{label:'Có',data:rows.map(r=>r[1]),color:'#1baf7a'},{label:'Không',data:rows.map(r=>dv-r[1]),color:'#d33a44'}],{h:true,stacked:true}); fit(id,{wrap:24});};
 /* 1. Hạ tầng */
 vhttBar('kcHtCap',['Phường','Xã'],[{label:'Hộ có Internet cáp quang',data:H.cap.map(r=>khcnR1(r[0])),color:'#2a78d6'},{label:'Dùng điện thoại thông minh',data:H.cap.map(r=>khcnR1(r[1])),color:'#39d5ff'}],{h:true});
 fit('kcHtCap',{pct:true});
 coKhong('kcHtTc',H.tieuChi);
 vhttBar('kcHtThap',H.cqThap.map(r=>r[0]),[{label:'Hộ có cáp quang (%)',data:H.cqThap.map(r=>khcnR1(r[1])),color:'#eda100'}],{h:true});
 fit('kcHtThap',{short:true,pct:true});
 /* 2. Con người */
 vhttBar('kcCnTl',['Dùng dịch vụ công trực tuyến','Có danh tính điện tử','Có chữ ký số','Phổ cập kỹ năng số'],
 [{label:'Phường',data:C.cap[0].map(khcnR1),color:'#2a78d6'},{label:'Xã',data:C.cap[1].map(khcnR1),color:'#6FD195'}],{h:true});
 fit('kcCnTl',{wrap:16,pct:true});
 coKhong('kcCnTc',C.tieuChi);
 vhttBar('kcCnThap',C.dvcThap.map(r=>r[0]),[{label:'Dùng dịch vụ công trực tuyến (%)',data:C.dvcThap.map(r=>khcnR1(r[1])),color:'#eda100'}],{h:true});
 fit('kcCnThap',{short:true,pct:true});
 /* 3. Văn bản, dịch vụ công */
 const XH=[['Hồ sơ trực tuyến toàn trình','#2a78d6'],['Thanh toán trực tuyến','#eda100'],['Văn bản xử lý trên môi trường mạng','#1baf7a'],['Văn bản trao đổi được ký số','#7086FD']];
 vhttBar('kcVbXh',KHCN_MONTHS,XH.map((x,i)=>({type:'line',label:x[0],data:V.xuHuong[i].map(khcnR1),color:x[1]})));
 const cx=vhttChartInstances.kcVbXh; if(cx){cx.options.scales.y.min=50; cx.options.scales.y.max=100; cx.options.scales.y.beginAtZero=false; cx.update();}
 vhttDonut('kcVbNhom',V.nhom.map(g=>[g[0],g[1],g[2]]),fmt(dv),'phường/xã');
 vhttBar('kcVbThap',V.thap.map(r=>r[0]),[{label:'Trực tuyến toàn trình (%)',data:V.thap.map(r=>r[1]),color:'#eda100'}],{h:true});
 fit('kcVbThap',{short:true,pct:true});
 }

 /* ---------- Ô bên phải: bảng 126 phường/xã ---------- */
 function khcnUnitTableHtml(){
 const U=KHCN_UNITS, S=KHCN_SUM, q=8;
 const cols=[
 {l:'Hộ có cáp quang',v:(u)=>khcnP(u.ht.hoCq/u.ht.ho*100),t:khcnP(S.ht.hoCq/S.ht.ho*100)},
 {l:'Dùng điện thoại thông minh',v:(u)=>khcnP(u.ht.sm/u.ht.ds15*100),t:khcnP(S.ht.sm/S.ht.ds15*100)},
 {l:'Dùng dịch vụ công trực tuyến',v:(u)=>khcnP(u.cn.dvctt/u.cn.dan*100),t:khcnP(S.cn.dvctt/S.cn.dan*100)},
 {l:'Có danh tính điện tử',v:(u)=>khcnP(u.cn.dtdt/u.cn.ds14*100),t:khcnP(S.cn.dtdt/S.cn.ds14*100)},
 {l:'Có chữ ký số',v:(u)=>khcnP(u.cn.cks/u.cn.dsTt*100),t:khcnP(S.cn.cks/S.cn.dsTt*100)},
 {l:'Trực tuyến toàn trình (T9)',v:(u)=>khcnP(u.vb.thang[q].toanTrinh),t:khcnP(S.vb.toanTrinh)},
 {l:'Thanh toán trực tuyến (T9)',v:(u)=>khcnP(u.vb.thang[q].tttt/u.vb.thang[q].nvtc*100),t:khcnP(S.vb.tttt/S.vb.nvtc*100)}
 ];
 const thead=`<tr><th>Đơn vị</th>${cols.map(c=>`<th style="text-align:right">${esc(c.l)}</th>`).join('')}</tr>`;
 const tot=`<tr style="background:rgba(255,213,75,.1)"><td style="font-weight:900;color:#ffd54b">Toàn Thành phố</td>${cols.map(c=>`<td class="num" style="text-align:right;font-weight:900;color:#ffd54b">${esc(c.t)}</td>`).join('')}</tr>`;
 const rows=U.map(u=>`<tr><td>${esc(u.ten)}</td>${cols.map(c=>`<td class="num" style="text-align:right">${esc(c.v(u))}</td>`).join('')}</tr>`).join('');
 return `<div class="cat-chart-box gen-unit-box" id="dimDetailPanel" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
 <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách ${U.length} phường/xã · ${esc(KHCN_KY)}</div>
 <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Số liệu giả lập, lấy theo trường Địa bàn của 3 eform. Dòng đầu là tỷ lệ chung toàn Thành phố, tính bằng cộng tử số và mẫu số của 126 phường/xã rồi mới chia (không lấy trung bình các dòng). Bấm một khối bên trái để xem bảng số của khối đó.</p>
 <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
 <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
 <table class="iip-table" style="min-width:${280+cols.length*115}px"><thead>${thead}</thead><tbody>${tot}${rows}</tbody></table>
 </div>
 </div>`;
 }
