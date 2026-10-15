 /* ============================== DRAWER DANH SÁCH (cấp 1, có pie) ============================== */
 function openList(opts){
 const {metric=null,metricIn=null,role=null,status=null,officeIds=null,bucketStatus=false,title='Danh sách'}=opts||{};
 let base=records.filter(r=>canSeeRole(r.role));
 if(metric) base=base.filter(r=>r.metric===metric);
 if(metricIn) base=base.filter(r=>metricIn.includes(r.metric));
 if(role) base=base.filter(r=>r.role===role);
 if(officeIds) base=base.filter(r=>officeIds.includes(r.officeId));
 currentDrawerRecords=base;
 drawerPieStatus=status||'';
 /* status truyền vào đây LUÔN là mã trạng thái gốc (statusDefs/docStatusDefs: new/pending/extend/done/closed/
 revoked...) trừ đúng 1 nơi gọi từ thẻ "Kết quả xử lý" ở trang chủ (xem openOverviewPieSegment, group==='status')
 vốn dùng mã nhóm TASK_RESULT_BUCKETS (done/onTime/dueSoon/overdue) — nơi đó phải truyền bucketStatus:true để
 phân biệt, vì 'done' trùng mã ở cả 2 bộ. Cờ này quyết định drawer hiển thị theo đúng 6 trạng thái gốc hay theo
 4 nhóm kết quả xử lý (xem drawerUsesResultBuckets()), tránh vênh giữa mã lọc và panel/pie hiển thị. */
 drawerRawStatusMode=!!(status && !bucketStatus);
 /* Khi mở drawer đã khóa sẵn 1 trục (role), pie/tổng số PHẢI đúng số của riêng trục đó — không thể chỉ nới lỏng
 base để nhồi thêm các trục khác vào currentDrawerRecords (drawerCounts() tính thẳng từ currentDrawerRecords,
 không qua bộ lọc), sẽ làm sai số liệu ban đầu. Nên vẫn giữ nguyên base đã lọc role như cũ — chỉ lưu lại "công
 thức mở" (opts) + danh sách các trục KHÁC mà tài khoản này còn xem được với cùng metric/officeIds, để ô lọc
 "Trục" có thể hiện ra dù currentDrawerRecords chỉ có 1 trục, và đổi trục = mở lại drawer bằng đúng trục mới
 (xem switchDrawerRole()) thay vì lọc cục bộ trên dữ liệu không có sẵn. */
 window.__lastOpenListOpts=opts||{};
 window.__drawerRoleUniverse=role?drawerRoleUniverseFor(opts||{}):null;
 document.getElementById('drawerTitle').textContent=title;
 document.getElementById('drawerSub').textContent='';
 renderDrawerList(base);
 openDrawer();
 }
 /* Toàn bộ trục mà tài khoản đang đăng nhập còn xem được, với cùng metric/metricIn/officeIds như lúc mở drawer
 (bỏ qua đúng ràng buộc role) — nguồn cho dropdown "Trục" khi drawer đang khóa 1 trục. */
 function drawerRoleUniverseFor(opts){
 let base=records.filter(r=>canSeeRole(r.role));
 if(opts.metric) base=base.filter(r=>r.metric===opts.metric);
 if(opts.metricIn) base=base.filter(r=>opts.metricIn.includes(r.metric));
 if(opts.officeIds) base=base.filter(r=>opts.officeIds.includes(r.officeId));
 const roleOrder=[...AXIS_CANONICAL_ORDER,...TW_AXIS_REAL_ORDER];
 return [...new Set(base.map(r=>r.role))].sort((a,b)=>roleOrder.indexOf(a)-roleOrder.indexOf(b));
 }
 /* Tiêu đề dựng lại theo đúng khuôn "<trạng thái·> <metric> · <trục hoặc tài khoản>" — dùng khi đổi trục qua
 dropdown, vì title gốc là chuỗi tự do do nơi gọi openList() tự đặt, không thể suy ngược tách phần role ra. */
 function drawerReopenTitle(opts,role){
 const parts=[];
 if(opts.status) parts.push(opts.bucketStatus?taskResultBucketMeta(opts.status).label:statusMeta(opts.status).short);
 if(opts.metric) parts.push(metricMeta[opts.metric].label);
 else if(opts.metricIn) parts.push('Nhiệm vụ giao/nhận');
 parts.push(role?roleMeta(role).name:currentAccount.title);
 return parts.join(' · ');
 }
 function switchDrawerRole(newRole){
 const prev=window.__lastOpenListOpts||{};
 openList({...prev,role:newRole||null,title:drawerReopenTitle(prev,newRole||null)});
 }
 function onDrawerRoleSwitchChange(){
 switchDrawerRole(document.getElementById('roleFilter')?.value||'');
 }
 /* Loại bản ghi drawer đang mở, suy từ chính currentDrawerRecords — nhưng khi danh sách rỗng (0 bản ghi, VD văn
 bản đã ép về 0) thì metrics rút ra rỗng theo, không đủ để nhận diện "đây là danh sách văn bản" hay "nhiệm vụ".
 Fallback về đúng công thức mở drawer (window.__lastOpenListOpts.metric/metricIn) để vẫn chọn đúng bộ trạng thái/
 nhãn đơn vị dù danh sách trống, tránh lộ ra bộ trạng thái gộp ALL_STATUS_DEFS không thuộc về. */
 function drawerMetricsIntent(){
 const fromRecords=[...new Set(currentDrawerRecords.map(r=>r.metric))];
 if(fromRecords.length) return fromRecords;
 const opts=window.__lastOpenListOpts||{};
 if(opts.metric) return [opts.metric];
 if(opts.metricIn) return opts.metricIn;
 return [];
 }
 /* Chọn đúng bộ trạng thái để hiển thị trong drawer theo loại bản ghi đang có (chỉ văn bản/chỉ nhiệm vụ/hỗn hợp),
 tránh liệt kê các trạng thái không thuộc về (VD: "Chờ duyệt" trong drawer chỉ toàn văn bản). */
 function drawerStatusDefs(){
 const list=drawerMetricsIntent();
 if(list.length && list.every(m=>m==='docIn'||m==='docOut')) return docStatusDefs;
 if(list.length && list.every(m=>m==='assigned'||m==='received')) return statusDefs;
 return ALL_STATUS_DEFS;
 }
 /* Nhiệm vụ giao/nhận (assigned/received) hiển thị đúng 4 nhóm "Kết quả xử lý" (trạng thái + hạn xử lý) thay vì
 6 trạng thái gốc, đồng bộ với widget tổng quan ở trang chủ. Văn bản đến/đi vẫn giữ nguyên bộ trạng thái riêng. */
 function drawerUsesResultBuckets(){
 if(drawerRawStatusMode) return false;
 const list=drawerMetricsIntent();
 return list.length>0 && list.every(m=>m==='assigned'||m==='received');
 }
 function drawerCounts(){
 if(drawerUsesResultBuckets()) return TASK_RESULT_BUCKETS.map(b=>({key:b.key,label:b.label,short:b.label,color:b.color,count:currentDrawerRecords.filter(r=>taskResultBucket(r)===b.key).length}));
 return drawerStatusDefs().map(st=>({key:st.key,label:st.label,short:st.short,color:st.color,count:currentDrawerRecords.filter(r=>r.status===st.key).length}));
 }
 /* Khi drawer đang ở "chế độ nhóm Kết quả xử lý" (bucketMode, xem drawerUsesResultBuckets), trạng thái ban đầu
 truyền vào từ nơi mở drawer (VD bấm 1 lát cắt "Mới tạo"/"Xin gia hạn"/"Thu hồi" ở widget "VĂN BẢN/NHIỆM VỤ
 THEO TRỤC") vẫn là mã trạng thái GỐC (statusDefs: new/pending/extend/done/closed/revoked) — khác hẳn 4 mã
 nhóm kết quả (done/onTime/dueSoon/overdue) mà bucket mode dùng để lọc/đếm. Không có khớp 1-1 giữa 2 bộ mã này
 (VD "Mới tạo" có thể rơi vào bất kỳ nhóm nào tùy hạn xử lý) nên phải phát hiện đúng trường hợp "mã gốc lọt vào
 bucket mode" để lọc/đếm bằng r.status thay vì taskResultBucket(r), tránh việc so sánh sai mã khiến danh sách
 luôn rỗng dù dữ liệu đã lọc đúng theo trục/đơn vị. */
 function isBucketKey(key){ return TASK_RESULT_BUCKETS.some(b=>b.key===key); }
 function renderDrawerPie(){
 const bucketMode=drawerUsesResultBuckets();
 const rawStatusMode=bucketMode && drawerPieStatus && !isBucketKey(drawerPieStatus);
 /* overviewSvg() đã tự có total||...||1 riêng để tránh chia 0 khi vẽ canvas — KHÔNG lặp lại ||1 ở đây, vì total
 ở đây còn được dùng làm "active" mặc định (dòng dưới), lặp lại sẽ làm số "Tổng" hiện sai thành 1 khi danh sách
 thật sự rỗng (0 bản ghi). */
 const counts=drawerCounts(); const total=counts.reduce((a,c)=>a+c.count,0);
 const segs=counts.map(c=>({key:c.key,label:c.short,value:c.count,color:c.color}));
 const active=drawerPieStatus ? (rawStatusMode?currentDrawerRecords.filter(r=>r.status===drawerPieStatus).length:(counts.find(c=>c.key===drawerPieStatus)?.count||0)) : total;
 const activeLabel=drawerPieStatus?(rawStatusMode?statusMeta(drawerPieStatus).short:(bucketMode?taskResultBucketMeta(drawerPieStatus).label:statusMeta(drawerPieStatus).short)):'Tổng';
 document.getElementById('drawerPieSvg').innerHTML=overviewSvg(segs,total,fmt(active),activeLabel,'drawerStatus');
 document.getElementById('drawerPieLegend').innerHTML=counts.map(c=>`<button class="${drawerPieStatus===c.key?'active':''}" onclick="setDrawerPieStatus('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
 }
 function setDrawerPieStatus(st){
 drawerPieStatus=st||'';
 const sel=document.getElementById('statusFilter'); if(sel)sel.value=drawerPieStatus;
 const t=document.getElementById('statusFilterTriggerText');
 if(t){ t.textContent=drawerPieStatus?(drawerUsesResultBuckets()?taskResultBucketMeta(drawerPieStatus).label:statusMeta(drawerPieStatus).short):'Tất cả trạng thái'; t.style.color=drawerPieStatus?'#d0e8f8':'#8ab0c8'; }
 renderDrawerPie();flushPendingOverviewDonuts();applyDrawerFilters();
 }
 function renderDrawerList(rs){
 const body=document.getElementById('drawerBody');
 const roleOrder=[...AXIS_CANONICAL_ORDER,...TW_AXIS_REAL_ORDER];
 /* Drawer đang khóa 1 trục (mở qua role, VD từ dropdown "chọn trục" ở thẻ tổng quan) → ô "Trục" phải liệt kê
 TOÀN BỘ trục account còn xem được (drawerRoleUniverse), không phải chỉ đúng 1 trục có trong rs — nếu không sẽ
 luôn ẩn (≤1 lựa chọn) và không đổi trục được. Đổi trục ở chế độ này gọi switchDrawerRole() để mở lại đúng dữ
 liệu, KHÔNG lọc cục bộ như applyDrawerFilters() (dữ liệu trục khác không có sẵn trong currentDrawerRecords). */
 const roleSwitchMode=!!window.__drawerRoleUniverse;
 const roles=roleSwitchMode?window.__drawerRoleUniverse:[...new Set(rs.map(r=>r.role))].sort((a,b)=>roleOrder.indexOf(a)-roleOrder.indexOf(b));
 const roleSelectedValue=roleSwitchMode?(window.__lastOpenListOpts?.role||''):'';
 const bucketMode=drawerUsesResultBuckets();
 const statusOptions=bucketMode?TASK_RESULT_BUCKETS.map(b=>({key:b.key,label:b.label})):drawerStatusDefs();
 /* Ở chế độ nhóm kết quả xử lý (bucketMode), 1 nhóm ("Hoàn thành") có thể gộp NHIỀU trạng thái gốc khác nhau
 (VD "Hoàn thành" + "Kết thúc" đều rơi vào bucket 'done' — xem taskResultBucket()), nên cột "Trạng thái xử lý"
 trong bảng vẫn hiện lẫn nhiều nhãn dù đã lọc đúng 1 nhóm. Thêm ô lọc PHỤ theo đúng trạng thái gốc để tách được
 2 trường hợp này — chỉ hiện khi đang ở bucketMode VÀ có >1 trạng thái gốc trong tập đang xem. */
 const rawStatusesPresent=drawerStatusDefs().filter(st=>currentDrawerRecords.some(r=>r.status===st.key));
 const rawStatusHtml=(bucketMode&&rawStatusesPresent.length>1)?`<div class="vef-item"><span>Trạng thái xử lý</span>${customSelectHtml('rawStatusFilter',rawStatusesPresent.map(s=>({value:s.key,label:s.label})),'','Tất cả trạng thái','applyDrawerFilters')}</div>`:'';
 const fields=[...new Set(currentDrawerRecords.map(r=>r.field))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
 /* Chỉ liệt kê đúng (các) loại thực sự có trong danh sách đang xem — trước đây hiện cứng cả 4 loại (kể cả Văn bản
 đến/đi) dù danh sách đang mở (VD "Kết quả xử lý") chỉ toàn nhiệm vụ giao/nhận, chọn vào sẽ luôn ra rỗng. */
 const metricsPresent=[...new Set(currentDrawerRecords.map(r=>r.metric))].filter(m=>metricMeta[m]);
 /* "Đơn vị" của 1 nhiệm vụ mang nghĩa khác nhau tùy chiều xem, giống hệt cách vptuDrawerPageList() đã làm cho
 bảng VPTU (xem unitLabel ở vptu-detail.js): xem "Nhiệm vụ giao" thì đó là đơn vị CHỦ TRÌ thực hiện; xem "Nhiệm vụ
 nhận" thì đó là đơn vị đã GIAO việc. "Chủ trì" và "giao" là 2 khái niệm khác nhau, KHÔNG gộp chung 1 nhãn/cột mập
 mờ như trước ("Đơn vị chủ trì/giao") khi danh sách trộn cả 2 chiều — tách hẳn thành 2 ô lọc + 2 cột bảng riêng,
 mỗi cột chỉ điền đúng dòng thuộc chiều của nó. Văn bản (docIn/docOut) không có khái niệm "chủ trì"/"giao" — dùng
 nhãn "Đơn vị" trung tính, tránh rơi vào nhãn gộp "chủ trì/giao" vốn chỉ dành cho nhiệm vụ giao/nhận. Dùng
 drawerMetricsIntent() thay vì metricsPresent (rút từ currentDrawerRecords) để vẫn chọn đúng nhãn khi danh sách
 đang rỗng (0 bản ghi). */
 const metricIntent=drawerMetricsIntent();
 drawerUnitSplitMode = metricsPresent.includes('assigned') && metricsPresent.includes('received');
 let unitFilterHtml;
 if(drawerUnitSplitMode){
 const assignedUnits=[...new Set(currentDrawerRecords.filter(r=>r.metric==='assigned').map(r=>r.unit))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
 const receivedUnits=[...new Set(currentDrawerRecords.filter(r=>r.metric==='received').map(r=>r.unit))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
 unitFilterHtml=`<div class="vef-item"><span>Đơn vị chủ trì</span>${customSelectHtml('unitChuTriFilter',assignedUnits.map(u=>({value:u,label:u})),'','Tất cả đơn vị','applyDrawerFilters',true)}</div><div class="vef-item"><span>Đơn vị giao</span>${customSelectHtml('unitGiaoFilter',receivedUnits.map(u=>({value:u,label:u})),'','Tất cả đơn vị','applyDrawerFilters',true)}</div>`;
 } else {
 const units=[...new Set(currentDrawerRecords.map(r=>r.unit))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
 drawerUnitLabel=metricIntent.length&&metricIntent.every(m=>m==='docIn'||m==='docOut')?'Đơn vị':metricIntent.length&&metricIntent.every(m=>m==='received')?'Đơn vị giao':metricIntent.length&&metricIntent.every(m=>m==='assigned')?'Đơn vị chủ trì':'Đơn vị chủ trì/giao';
 unitFilterHtml=`<div class="vef-item"><span>${drawerUnitLabel}</span>${customSelectHtml('unitFilter',units.map(u=>({value:u,label:u})),'','Tất cả đơn vị','applyDrawerFilters',true)}</div>`;
 }
 body.innerHTML=`<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="drawerPieSvg"></div><button class="ghost" onclick="setDrawerPieStatus('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">${bucketMode?'Phân bổ kết quả xử lý':'Phân bổ theo trạng thái'}</h4><div class="pie-legend" id="drawerPieLegend"></div></div></div><div class="vef-panel">
 <div class="vef-row vef-row-main">
 <div class="vef-item"><span>Tìm kiếm</span><input id="qFilter" placeholder="Tìm mã, tiêu đề, đơn vị, phối hợp, lĩnh vực..." oninput="applyDrawerFilters()"/></div>
 <div class="vef-item${roles.length<=1?' hidden':''}"><span>Trục</span>${customSelectHtml('roleFilter',roles.map(r=>({value:r,label:roleMeta(r).name})),roleSelectedValue,'Tất cả trục',roleSwitchMode?'onDrawerRoleSwitchChange':'applyDrawerFilters')}</div>
 ${unitFilterHtml}
 <div class="vef-item"><span>Nhóm lĩnh vực</span>${customSelectHtml('fieldFilter',fields.map(f=>({value:f,label:f})),'','Tất cả lĩnh vực','applyDrawerFilters')}</div>
 <div class="vef-item"><span>Trạng thái</span>${customSelectHtml('statusFilter',statusOptions.map(s=>({value:s.key,label:s.label})),drawerPieStatus,'Tất cả trạng thái','onStatusFilterChange')}</div>
 ${rawStatusHtml}
 <div class="vef-item${metricsPresent.length<=1?' hidden':''}"><span>Loại</span>${customSelectHtml('metricFilter',metricsPresent.map(m=>({value:m,label:metricMeta[m].label})),'','Tất cả loại','applyDrawerFilters')}</div>
 </div>
 <div class="vef-row-dates">
 <div class="vef-date-group"><span>Bắt đầu</span><div class="vef-date-pair"><input type="date" id="startFromFilter" onchange="applyDrawerFilters()"/><span class="vef-date-sep">–</span><input type="date" id="startToFilter" onchange="applyDrawerFilters()"/></div></div>
 <div class="vef-date-group"><span>Hạn xử lý</span><div class="vef-date-pair"><input type="date" id="dueFromFilter" onchange="applyDrawerFilters()"/><span class="vef-date-sep">–</span><input type="date" id="dueToFilter" onchange="applyDrawerFilters()"/></div></div>
 <div class="vef-row-actions"><div class="list-summary" id="listSummary"></div><button class="ghost" onclick="resetDrawerFilters()">Xóa lọc</button></div>
 </div>
 </div><div id="recordList"></div><div id="drawerPagination"></div>`;
 renderDrawerPie(); flushPendingOverviewDonuts(); applyDrawerFilters();
 }
 function resetDrawerFilters(){
 drawerPieStatus='';
 renderDrawerList(currentDrawerRecords);
 }
 function applyDrawerFilters(){
 const q=(document.getElementById('qFilter')?.value||'').toLowerCase();
 const role=document.getElementById('roleFilter')?.value||''; const status=document.getElementById('statusFilter')?.value||drawerPieStatus||''; const metric=document.getElementById('metricFilter')?.value||'';
 const field=document.getElementById('fieldFilter')?.value||'';
 const unitChuTri=drawerUnitSplitMode?document.getElementById('unitChuTriFilter')?.value||'':'';
 const unitGiao=drawerUnitSplitMode?document.getElementById('unitGiaoFilter')?.value||'':'';
 const unit=drawerUnitSplitMode?'':document.getElementById('unitFilter')?.value||'';
 const startFrom=document.getElementById('startFromFilter')?.value||''; const startTo=document.getElementById('startToFilter')?.value||'';
 const dueFrom=document.getElementById('dueFromFilter')?.value||''; const dueTo=document.getElementById('dueToFilter')?.value||'';
 const rawStatus=document.getElementById('rawStatusFilter')?.value||'';
 drawerPieStatus=status;
 const bucketMode=drawerUsesResultBuckets();
 const rawStatusMode=bucketMode && status && !isBucketKey(status);
 const rs=currentDrawerRecords.filter(r=>(!role||r.role===role)&&(!status||(rawStatusMode?r.status===status:(bucketMode?taskResultBucket(r)===status:r.status===status)))&&(!rawStatus||r.status===rawStatus)&&(!metric||r.metric===metric)&&(!unit||r.unit===unit)&&(!unitChuTri||r.metric!=='assigned'||r.unit===unitChuTri)&&(!unitGiao||r.metric!=='received'||r.unit===unitGiao)&&(!field||r.field===field)&&(!startFrom||parseDMY(r.created)>=new Date(startFrom).getTime())&&(!startTo||parseDMY(r.created)<=new Date(startTo).getTime())&&(!dueFrom||parseDMY(r.due)>=new Date(dueFrom).getTime())&&(!dueTo||parseDMY(r.due)<=new Date(dueTo).getTime())&&(!q||[r.id,r.title,r.field,r.unit,r.coop,r.creator,r.receiver].join(' ').toLowerCase().includes(q)));
 rs.sort((a,b)=>parseDMY(b.due)-parseDMY(a.due));
 const metricsInList=new Set(rs.map(r=>r.metric));
 const isDocList=metricsInList.size>0 && [...metricsInList].every(m=>m==='docIn'||m==='docOut');
 const pending=rs.filter(r=>r.status===(isDocList?'dueSoon':'pending')).length;
 document.getElementById('listSummary').innerHTML=approveButtonHtml(!isDocList&&pending>0);
 window.__drawerFilteredRecords=rs;
 drawerPage=1;
 renderDrawerPageList();
 }
 function renderDrawerPageList(){
 const rs=window.__drawerFilteredRecords||[];
 const totalPages=Math.max(1,Math.ceil(rs.length/DRAWER_PAGE_SIZE));
 if(drawerPage>totalPages) drawerPage=totalPages;
 if(drawerPage<1) drawerPage=1;
 const start=(drawerPage-1)*DRAWER_PAGE_SIZE;
 const pageRows=rs.slice(start,start+DRAWER_PAGE_SIZE);
 const unitHeadHtml=drawerUnitSplitMode?'<th>Đơn vị chủ trì</th><th>Đơn vị giao</th>':`<th>${drawerUnitLabel}</th>`;
 const isDocList=rs.length>0 && rs.every(r=>r.metric==='docIn'||r.metric==='docOut');
 const titleHead=isDocList?'Trích yếu văn bản':'Tiêu đề nhiệm vụ';
 document.getElementById('recordList').innerHTML=pageRows.length?`<div class="vptu-table-wrap"><table class="vptu-table"><thead><tr><th>STT</th><th>Số ký hiệu</th><th>${titleHead}</th>${unitHeadHtml}<th>Người/Đơn vị phối hợp</th><th>Nhóm lĩnh vực</th><th>Ngày bắt đầu</th><th>Hạn xử lý</th><th>Trạng thái xử lý</th></tr></thead><tbody>${pageRows.map((r,i)=>recordRowHtml(r,start+i+1)).join('')}</tbody></table></div>`:'<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
 const pagBox=document.getElementById('drawerPagination');
 if(!pagBox) return;
 if(!rs.length){pagBox.innerHTML='';return}
 pagBox.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap">
 <span style="font-size:11.5px;color:var(--muted)">Hiển thị ${fmt(start+1)}–${fmt(start+pageRows.length)} / ${fmt(rs.length)} bản ghi</span>
 <div style="display:flex;gap:6px;align-items:center">
 <button class="ghost" ${drawerPage<=1?'disabled':''} onclick="setDrawerPage(${drawerPage-1})">‹ Trước</button>
 <span style="font-size:12px">Trang ${drawerPage}/${totalPages}</span>
 <button class="ghost" ${drawerPage>=totalPages?'disabled':''} onclick="setDrawerPage(${drawerPage+1})">Sau ›</button>
 </div>
 </div>`;
 }
 function setDrawerPage(p){
 drawerPage=p;
 renderDrawerPageList();
 }
 function recordRowHtml(r,stt){
 return `<tr onclick="openRecordDetail('${r.id}')">
 <td class="mono">${stt}</td>
 <td class="mono">${esc(r.id)}</td>
 <td><div class="title">${esc(r.title)}</div><small>${roleMeta(r.role).icon} ${roleMeta(r.role).name} · ${metricMeta[r.metric].short}</small></td>
 ${drawerUnitSplitMode?`<td>${r.metric==='assigned'?esc(r.unit||''):''}</td><td>${r.metric==='received'?esc(r.unit||''):''}</td>`:`<td>${esc(r.unit||'')}</td>`}
 <td>${esc(r.coop||'')}</td>
 <td>${esc(r.field||'')}</td>
 <td class="mono">${r.created||''}</td>
 <td class="mono">${r.due}</td>
 <td>${statusPillHtml(r.status)}</td>
 </tr>`;
 }

