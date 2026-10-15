 /* ============================== CHI TIẾT SỐ LIỆU VPTU/GIAO_DATA (nguồn tổng hợp từ API, chỉ xem — không sửa/xóa) ==============================
 Sinh sẵn danh sách bản ghi "ảo" khớp đúng từng con số trong VPTU_DATA/GIAO_DATA để có thể bấm xem chi tiết, giống các tab khác.
 Không đẩy vào mảng records[] dùng chung để tránh làm sai lệch các tổng KPI khác (vốn tính từ segmentTemplate, độc lập với dữ liệu này). */
 /* VPTU_DATA/GIAO_DATA nay dùng đúng nhãn statusDefs.short nên quy đổi thẳng về key của statusDefs. */
 const VPTU_LABEL_TO_STATUS=Object.fromEntries(statusDefs.map(s=>[s.short,s.key]));
 function vptuStatusMeta(k){return statusMeta(k);}
 let __vptuDetailCache=null;
 /* Ngày bắt đầu — sinh trước hạn xử lý 1 khoảng cố định theo i để có dữ liệu ổn định, không đổi giữa các lần render. */
 function vptuStartDate(i,due){
 const d=parseDMY(due)?new Date(parseDMY(due)):new Date();
 d.setDate(d.getDate()-(10+(i%20)));
 return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
 }
 /* Đường dẫn phân cấp đầy đủ (vd. "UBND Thành phố / Sở ngành / Sở Y tế") của TẤT CẢ đơn vị lá trong đúng cây
 4 trục (UNIT_TREE_AXIS_DEPTS/buildCoordTreeData) đang dùng ở popup "Đơn vị/người phối hợp" khi giao nhiệm vụ
 thật — dùng lại y hệt cây này để dữ liệu mẫu "chủ trì"/"phối hợp" ở bảng VPTU hiển thị đúng định dạng đường dẫn
 như phần tạo nhiệm vụ, thay vì chỉ 1 tên đơn vị rời rạc như trước. */
 function vptuOrgLeafPaths(){
 if(window.__vptuOrgLeafPaths) return window.__vptuOrgLeafPaths;
 const paths=[];
 const walk=(node,ancestors)=>{
 const path=ancestors.concat([node.label]);
 if(node.children&&node.children.length) node.children.forEach(c=>walk(c,path));
 else paths.push(path.join(' / '));
 };
 coordTreeData().forEach(root=>walk(root,[]));
 return window.__vptuOrgLeafPaths=paths;
 }
 function buildVptuDetailList(metric,dataset){
 const list=[];
 const leafPaths=vptuOrgLeafPaths();
 dataset.forEach(d=>{
 const role=d.role||'UBND', soId=d.soId||null;
 d.rows.forEach(([label,count])=>{
 for(let i=0;i<count;i++){
 const st=VPTU_LABEL_TO_STATUS[label]||'pending';
 const due=dueDate(i,st);
 /* Chủ trì luôn ĐÚNG 1 đơn vị (giống ô "Đơn vị nhận nhiệm vụ" chỉ chọn 1 khi giao việc thật). Phối hợp lấy
 1-3 đơn vị/dòng (xoay vòng theo i) để có cả trường hợp nhiều đơn vị phối hợp như dữ liệu thật, và bước nhảy
 lớn (41, số nguyên tố, không chia hết cho các block con trong cây) để rải đều qua nhiều nhánh khác nhau —
 tránh dồn cụm liên tiếp vào đúng 1 nhánh (vd toàn "Đảng bộ trực thuộc / Đảng ủy Phường ...") như bước nhảy
 nhỏ (+7) trước đây, do khối "Xã/Phường" trong cây chiếm phần lớn số node lá (126/trục). */
 const leadIdx=(i+list.length)%leafPaths.length;
 const coopCount=(i%3)+1;
 const coopPaths=[]; let coopOffset=17;
 while(coopPaths.length<coopCount && coopPaths.length<leafPaths.length-1){
 const idx=(leadIdx+coopOffset)%leafPaths.length;
 const p=leafPaths[idx];
 if(idx!==leadIdx && !coopPaths.includes(p)) coopPaths.push(p);
 coopOffset+=41;
 }
 list.push({
 id:`PX-${metric.toUpperCase()}-${role}${soId?'-'+soId:''}-${String(list.length+1).padStart(4,'0')}`,
 ts:0, /* dữ liệu mẫu dựng sẵn — luôn coi là "cũ nhất", để nhiệm vụ tạo thật trong phiên (ts=Date.now()) luôn nổi lên đầu danh sách */
 metric, role, soId, vptuLabel:label, status:st,
 title:`[Tổng hợp] ${label} · ${d.title} #${i+1}`,
 field:pick(fieldPool[role]||fieldPool.UBND,i+list.length),
 unit:d.title,
 lead:leafPaths[leadIdx],
 coop:coopPaths,
 due, startDate:vptuStartDate(i,due), progress:progressFor(st,i),
 description:`Bản ghi tổng hợp thuộc "${d.title}", trạng thái "${label}", đồng bộ tự động từ hệ thống Theo dõi nhiệm vụ (VPTU) ngoài IOC.`
 });
 }
 });
 });
 return list;
 }
 function vptuDetailStore(){
 if(__vptuDetailCache) return __vptuDetailCache;
 __vptuDetailCache={received:buildVptuDetailList('received',VPTU_DATA),assigned:buildVptuDetailList('assigned',GIAO_DATA)};
 return __vptuDetailCache;
 }
 /* Bảng danh sách VPTU: STT, Số ký hiệu, Tiêu đề nhiệm vụ, Đơn vị (nhãn đổi theo chiều giao/nhận), Nhóm lĩnh vực, Ngày bắt đầu, Hạn xử lý, Trạng thái xử lý. */
 /* Bản ghi "mirror" phía Nhiệm vụ giao dùng id nội bộ "<mã gốc>-OUT" để không đụng độ với bản gốc bên Nhiệm vụ
 nhận (xem createAssignment) — id đó chỉ phục vụ tra cứu/liên kết, hiển thị ra bảng thì bỏ hậu tố cho sạch mắt,
 để cả 2 phía giao/nhận cùng hiện đúng 1 số ký hiệu như thật. */
 function vptuDisplayId(id){ return String(id).replace(/-OUT$/,''); }
 function vptuRecordRowHtml(r,stt){
 return `<tr onclick="openVptuRecordDetail('${r.metric}','${r.id}')">
 <td class="mono">${stt}</td>
 <td class="mono">${esc(vptuDisplayId(r.id))}</td>
 <td><div class="title">${esc(r.title)}</div><small>${roleMeta(r.role)?.icon||''} ${roleMeta(r.role)?.name||''}</small></td>
 <td>${esc(r.unit)}</td>
 <td>${esc(r.lead||'')}</td>
 <td>${vptuCoopSummaryHtml(r.coop)}</td>
 <td>${esc(r.field)}</td>
 <td class="mono">${r.startDate}</td>
 <td class="mono">${r.due}</td>
 <td>${statusPillHtml(r.status)}</td>
 </tr>`;
 }
 /* Drawer cấp 1 cho dữ liệu VPTU: pie theo trạng thái (đủ cả 6 mức, giống hệt widget bên ngoài) + lọc tìm kiếm + list, đúng phong cách renderDrawerList() gốc. */
 /* Luôn gộp theo trạng thái — nền (__vptuDrawerFull) là TOÀN BỘ bản ghi trong đúng phạm vi trục/đơn vị đang xem
 (không lọc theo trạng thái), để pie/legend luôn hiển thị đủ 6 trạng thái như bên ngoài; danh sách dưới bảng
 vẫn chỉ hiển thị đúng trạng thái đang chọn (__vptuDrawerLabel), có highlight trên legend. */
 function vptuDrawerCountsByStatus(list){
 const byStatus={};
 list.forEach(r=>{byStatus[r.vptuLabel]=(byStatus[r.vptuLabel]||0)+1;});
 return Object.keys(byStatus).map(label=>({key:label,label,color:STATUS_COLOR_MAP[label]||'#2c7dd2',value:byStatus[label]}));
 }
 /* Văn bản đến/đi là bản ghi THẬT trong IOC (nằm trong records[]), khác với nhiệm vụ nhận/giao (số liệu đồng bộ ngoài, chỉ xem qua vptuDetailStore). Điều hướng đúng nguồn theo metric để tránh danh sách rỗng giả. */
 function openVptuDetailList(metric,scope,label,scopeTitle){
 if(metric==='docIn'||metric==='docOut'){
 const stDef=docStatusDefs.find(s=>s.short===label);
 const scopeArr=Array.isArray(scope)?scope:(scope?[scope]:null);
 const roleScope=scopeArr?(scopeArr.find(s=>roleMeta(s))||'UBND'):null;
 openList({metric,role:roleScope,status:stDef?stDef.key:null,title:`${label} · ${metricMeta[metric].label}${scopeTitle?' · '+esc(scopeTitle):''}`});
 return;
 }
 const store=vptuDetailStore()[metric]||[];
 const scopeArr=Array.isArray(scope)?scope:(scope?[scope]:null);
 const fullScope=store.filter(r=>!scopeArr || scopeArr.includes(r.role) || scopeArr.includes(r.soId));
 window.__vptuDrawerFull=fullScope; window.__vptuDrawerLabel=label; window.__vptuDrawerScopeTitle=scopeTitle||'';
 window.__vptuDrawerMetric=metric; window.__vptuDrawerScopeArr=scopeArr;
 document.getElementById('drawerTitle').textContent=`${label} · ${metricMeta[metric].label}`;
 vptuDrawerPage=1;
 renderVptuDrawerList(fullScope.filter(r=>r.vptuLabel===label));
 openDrawer();
 }
 /* Lọc theo 1 trạng thái cụ thể (bấm vào 1 miếng pie/1 dòng legend) — nền giữ nguyên, chỉ đổi trạng thái đang highlight + danh sách hiển thị. */
 function filterVptuDrawerByStatus(label){
 const full=window.__vptuDrawerFull||[];
 window.__vptuDrawerLabel=label||'';
 vptuDrawerPage=1;
 renderVptuDrawerList(label?full.filter(r=>r.vptuLabel===label):full);
 }
 /* Bỏ lọc theo trạng thái đang xem, hiển thị TOÀN BỘ nhiệm vụ (mọi trạng thái) trong đúng trục/đơn vị đang xem. */
 function vptuShowAllInScope(){
 filterVptuDrawerByStatus('');
 }
 function renderVptuDrawerList(list){
 window.__vptuDrawerCurrent=list;
 const full=window.__vptuDrawerFull||list;
 /* Cùng logic nhãn động đã dùng cho tiêu đề cột bảng (renderVptuDrawerPageList) — "Đơn vị giao" khi đang xem
 nhiệm vụ nhận, "Đơn vị chủ trì" khi đang xem nhiệm vụ giao, để ô lọc và cột bảng luôn khớp nhau. */
 const unitLabel=window.__vptuDrawerMetric==='received'?'Đơn vị giao':'Đơn vị chủ trì';
 const scopeTitle=window.__vptuDrawerScopeTitle;
 document.getElementById('drawerSub').textContent='';
 const activeLabel=window.__vptuDrawerLabel||'';
 const counts=vptuDrawerCountsByStatus(full);
 const donut=overviewSvg(counts.map(c=>({key:c.key,label:c.label,value:c.value,color:c.color})),full.length,fmt(list.length),activeLabel||'Tổng','vptuRole');
 const legend=`<div class="pie-legend">${counts.map(c=>`<button class="${activeLabel===c.key?'active':''}" onclick="filterVptuDrawerByStatus('${esc(c.key)}')"><i style="background:${c.color}"></i><span>${esc(c.label)}</span><b>${fmt(c.value)}</b></button>`).join('')}</div>`;
 const units=[...new Set(full.map(r=>r.unit))].sort((a,b)=>a.localeCompare(b,'vi'));
 const fields=[...new Set(full.map(r=>r.field))].sort((a,b)=>a.localeCompare(b,'vi'));
 const unitOptions=units.map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('');
 const fieldOptions=fields.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join('');
 document.getElementById('drawerBody').innerHTML=`<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="vptuDrawerPieSvg">${donut}</div><button class="ghost" onclick="vptuShowAllInScope()">Xem tất cả nhiệm vụ trong trục</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ theo trạng thái</h4><div class="pie-legend" id="vptuDrawerLegend">${legend}</div></div></div><div class="vef-row"><div class="vef-item"><span>Tìm kiếm</span><input id="vptuQFilter" placeholder="Tìm mã, tiêu đề, đơn vị..." oninput="applyVptuDrawerFilter()"/></div><div class="vef-item"><span>${unitLabel}</span><select id="vptuUnitFilter" onchange="applyVptuDrawerFilter()"><option value="">Tất cả đơn vị</option>${unitOptions}</select></div><div class="vef-item"><span>Nhóm lĩnh vực</span><select id="vptuFieldFilter" onchange="applyVptuDrawerFilter()"><option value="">Tất cả lĩnh vực</option>${fieldOptions}</select></div><div class="vef-item"><span>Bắt đầu từ ngày</span><input type="date" id="vptuStartFromFilter" onchange="applyVptuDrawerFilter()"/></div><div class="vef-item"><span>Bắt đầu đến ngày</span><input type="date" id="vptuStartToFilter" onchange="applyVptuDrawerFilter()"/></div><div class="vef-item"><span>Hạn xử lý từ ngày</span><input type="date" id="vptuDueFromFilter" onchange="applyVptuDrawerFilter()"/></div><div class="vef-item"><span>Hạn xử lý đến ngày</span><input type="date" id="vptuDueToFilter" onchange="applyVptuDrawerFilter()"/></div><div class="vef-item list-summary" id="vptuListSummary" style="align-self:end"></div></div><div id="vptuRecordList"></div><div id="vptuDrawerPagination"></div>`;
 flushPendingOverviewDonuts();
 applyVptuDrawerFilter();
 }
 function applyVptuDrawerFilter(){
 const q=(document.getElementById('vptuQFilter')?.value||'').toLowerCase();
 const unit=document.getElementById('vptuUnitFilter')?.value||'';
 const field=document.getElementById('vptuFieldFilter')?.value||'';
 const startFrom=document.getElementById('vptuStartFromFilter')?.value||'';
 const startTo=document.getElementById('vptuStartToFilter')?.value||'';
 const dueFrom=document.getElementById('vptuDueFromFilter')?.value||'';
 const dueTo=document.getElementById('vptuDueToFilter')?.value||'';
 const list=(window.__vptuDrawerCurrent||[]).filter(r=>{
 if(q && ![r.id,r.title,r.unit,r.lead,...vptuCoopArr(r.coop)].join(' ').toLowerCase().includes(q)) return false;
 if(unit && r.unit!==unit) return false;
 if(field && r.field!==field) return false;
 if(startFrom && parseDMY(r.startDate)<new Date(startFrom).getTime()) return false;
 if(startTo && parseDMY(r.startDate)>new Date(startTo).getTime()) return false;
 if(dueFrom && parseDMY(r.due)<new Date(dueFrom).getTime()) return false;
 if(dueTo && parseDMY(r.due)>new Date(dueTo).getTime()) return false;
 return true;
 });
 /* Mới nhất lên đầu: nhiệm vụ vừa tạo thật trong phiên có ts=Date.now(), dữ liệu mẫu dựng sẵn có ts=0 nên luôn
 rơi xuống dưới — trước đây sắp theo hạn xử lý nên nhiệm vụ mới tạo có hạn gần hơn bị chìm lẫn vào giữa danh sách. */
 list.sort((a,b)=>(b.ts||0)-(a.ts||0));
 document.getElementById('vptuListSummary').innerHTML=approveButtonHtml(list.some(r=>r.status==='pending'));
 window.__vptuDrawerFiltered=list;
 vptuDrawerPage=1;
 renderVptuDrawerPageList();
 }
 function renderVptuDrawerPageList(){
 const rs=window.__vptuDrawerFiltered||[];
 const totalPages=Math.max(1,Math.ceil(rs.length/DRAWER_PAGE_SIZE));
 if(vptuDrawerPage>totalPages) vptuDrawerPage=totalPages;
 if(vptuDrawerPage<1) vptuDrawerPage=1;
 const start=(vptuDrawerPage-1)*DRAWER_PAGE_SIZE;
 const pageRows=rs.slice(start,start+DRAWER_PAGE_SIZE);
 const unitLabel=window.__vptuDrawerMetric==='received'?'Đơn vị giao':'Đơn vị chủ trì';
 document.getElementById('vptuRecordList').innerHTML=pageRows.length?`<div class="vptu-table-wrap"><table class="vptu-table"><thead><tr><th>STT</th><th>Số ký hiệu</th><th>Tiêu đề nhiệm vụ</th><th>${unitLabel}</th><th>Người/Đơn vị chủ trì</th><th>Người/Đơn vị phối hợp</th><th>Nhóm lĩnh vực</th><th>Ngày bắt đầu</th><th>Hạn xử lý</th><th>Trạng thái xử lý</th></tr></thead><tbody>${pageRows.map((r,i)=>vptuRecordRowHtml(r,start+i+1)).join('')}</tbody></table></div>`:'<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
 const pagBox=document.getElementById('vptuDrawerPagination');
 if(!pagBox) return;
 if(!rs.length){pagBox.innerHTML='';return}
 pagBox.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap">
 <span style="font-size:11.5px;color:var(--muted)">Hiển thị ${fmt(start+1)}–${fmt(start+pageRows.length)} / ${fmt(rs.length)} bản ghi</span>
 <div style="display:flex;gap:6px;align-items:center">
 <button class="ghost" ${vptuDrawerPage<=1?'disabled':''} onclick="setVptuDrawerPage(${vptuDrawerPage-1})">‹ Trước</button>
 <span style="font-size:12px">Trang ${vptuDrawerPage}/${totalPages}</span>
 <button class="ghost" ${vptuDrawerPage>=totalPages?'disabled':''} onclick="setVptuDrawerPage(${vptuDrawerPage+1})">Sau ›</button>
 </div>
 </div>`;
 }
 function setVptuDrawerPage(p){
 vptuDrawerPage=p;
 renderVptuDrawerPageList();
 }
 /* openVptuRecordDetail() đã chuyển sang record-detail.js (dùng chung khung detailCardHtml/descProgressCardHtml/
 detailModalHtml với renderRecordDetail()) — xem file đó. */
