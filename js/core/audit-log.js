 /* ============================== NHẬT KÝ THAO TÁC (audit trail toàn hệ thống — lưu theo phiên trình duyệt) ==============================
 Khác với notiFeed() (thông báo CẦN xử lý gửi cho người nhận việc), nhật ký này ghi lại MỌI hành động thay đổi dữ liệu
 đã thực hiện trong phiên hiện tại — ai, làm gì, lúc nào — phục vụ xem lại/đối soát, không phải để nhắc việc. */
 const ACTION_LOG_CATEGORIES={
 auth:{label:'Đăng nhập/Đăng xuất',icon:'',color:'#d8a50c'},
 assign:{label:'Giao nhiệm vụ',icon:'',color:'#2c7dd2'},
 edit:{label:'Sửa',icon:'',color:'#39d5ff'},
 delete:{label:'Xóa',icon:'',color:'#e0527a'},
 sync:{label:'Mô phỏng đồng bộ',icon:'',color:'#2fb174'},
 viewas:{label:'Xem theo cơ cấu tổ chức',icon:'',color:'#8b5cf6'},
 scenario:{label:'Kịch bản xử lý',icon:'',color:'#f39c12'}
 };
 const ACTION_LOG_STORAGE_KEY='px-ioc-action-log';
 function actionLogFeed(){
 if(!window.__actionLog){
 try{ window.__actionLog=JSON.parse(localStorage.getItem(ACTION_LOG_STORAGE_KEY)||'[]'); }
 catch(e){ window.__actionLog=[]; }
 }
 return window.__actionLog;
 }
 function saveActionLog(){
 try{ localStorage.setItem(ACTION_LOG_STORAGE_KEY, JSON.stringify(actionLogFeed())); }catch(e){}
 }
 function actionLogVisible(n){
 if(!allowedRoles().includes(n.role)) return false;
 if(currentXaId!=null) return n.xaId===currentXaId;
 if(currentSoId) return n.soId===currentSoId;
 return true;
 }
 function pushActionLog(n){
 const feed=actionLogFeed();
 feed.unshift({
 id:`log-${Date.now()}-${Math.floor(Math.random()*10000)}`, ts:Date.now(),
 actor:currentAccount?currentAccount.title:'—',
 role:n.role??currentRole, soId:n.soId!==undefined?n.soId:currentSoId, xaId:n.xaId!==undefined?n.xaId:currentXaId,
 ...n
 });
 if(feed.length>300) feed.length=300;
 saveActionLog();
 if(window.__actionLogModalOpen) renderActionLogModalBody();
 }
 function setActionLogFilter(cat){window.__actionLogFilter=cat; renderActionLogModalBody();}
 /* Popup xem nhật ký thao tác — mở qua nút trên thanh header, dùng chung #modal có sẵn. */
 function openActionLogModal(){
 window.__actionLogModalOpen=true;
 document.getElementById('modalTitle').textContent=' Nhật ký thao tác';
 document.getElementById('modalSub').textContent='Toàn bộ hành động thay đổi dữ liệu trong phiên hiện tại, theo đúng phạm vi tài khoản đang xem.';
 renderActionLogModalBody();
 openModal();
 }
 function renderActionLogModalBody(){
 const active=window.__actionLogFilter||'';
 const cats=[['',{label:'Tất cả',icon:''}],...Object.entries(ACTION_LOG_CATEGORIES)];
 const toolbar=`<div class="mode-tabs">${cats.map(([k,c])=>`<button class="${active===k?'active':''}" onclick="setActionLogFilter('${k}')">${c.icon} ${c.label}</button>`).join('')}</div>`;
 const all=actionLogFeed().filter(actionLogVisible);
 const list=all.filter(n=>!active||n.category===active).slice(0,80);
 const rows=list.map(n=>{
 const cat=ACTION_LOG_CATEGORIES[n.category]||{icon:'',color:'#49bcff'};
 return `<button class="action-log-row" style="--alc:${cat.color}" onclick="openActionLogDetail('${n.id}')">
 <div class="dot" style="background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}66">${cat.icon}</div>
 <div><div class="alr-title">${esc(n.title)}</div>${n.sub?`<div class="alr-sub">${esc(n.sub)}</div>`:''}</div>
 <div class="alr-meta"><span class="alr-actor">${esc(n.actor)}</span><span class="alr-time">${relTime(Date.now()-n.ts)}</span></div>
 </button>`;
 }).join('') || `<div class="access-lock">Chưa có thao tác nào trong phiên này.</div>`;
 const clearBar=`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid rgba(87,178,255,.15)"><small class="muted">${fmt(all.length)} thao tác đã lưu trên trình duyệt này</small><button class="ghost danger-btn" style="padding:7px 12px;font-size:11.5px" onclick="clearActionLog()">🗑️ Xóa toàn bộ nhật ký</button></div>`;
 document.getElementById('modalBody').innerHTML=`${toolbar}${clearBar}<div class="action-log-list" style="margin-top:10px">${rows}</div>`;
 }
 /* Cấp 2 — chi tiết đầy đủ 1 dòng nhật ký: ghi rõ đã làm gì/sửa gì, kèm nút quay lại danh sách. */
 function openActionLogDetail(id){
 const n=actionLogFeed().find(x=>x.id===id); if(!n)return;
 const cat=ACTION_LOG_CATEGORIES[n.category]||{icon:'',color:'#49bcff',label:'Khác'};
 const elapsed=Date.now()-n.ts;
 const scopeBits=[roleMeta(n.role)?.name||n.role];
 if(n.soId) scopeBits.push((categorySeed.UBND||[]).find(c=>c.id===n.soId)?.name||n.soId);
 if(n.xaId!=null) scopeBits.push(wardNames()[Number(n.xaId)]||`Xã/phường #${n.xaId}`);
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="renderActionLogModalBody()">← Quay lại nhật ký</button></div>
 <div class="detail-grid">
 <div class="detail-card">
 <h4>${cat.icon} ${esc(n.title)}</h4>
 <div class="kv">
 <b>Loại hành động</b><span style="color:${cat.color}">${cat.label}</span>
 <b>Người thực hiện</b><span>${esc(n.actor)}</span>
 <b>Phạm vi</b><span>${esc(scopeBits.join(' · '))}</span>
 <b>Thời điểm</b><span>${dtTime(elapsed)} · ${relTime(elapsed)}</span>
 </div>
 </div>
 <div class="detail-card">
 <h4>Nội dung chi tiết</h4>
 <p class="wrap">${n.sub?esc(n.sub):'—'}</p>
 ${n.detail?`<p class="wrap" style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(87,178,255,.22);color:#bcdcf0"><b style="color:#e9f8ff">Đã thay đổi:</b><br/>${esc(n.detail)}</p>`:'<p class="muted" style="margin-top:8px">Không có ghi chú thay đổi bổ sung.</p>'}
 </div>
 </div>
 ${n.target?actionLogTargetButtonHtml(n):''}`;
 }
 /* Nhiệm vụ tạo trong phiên trước (PX-NEW-*, nhiệm vụ nhánh...) không được lưu qua lần tải lại trang — chỉ riêng Nhật ký thao tác được lưu.
 Vì vậy cần kiểm tra nhiệm vụ liên quan còn tồn tại hay không trước khi cho bấm sang, tránh bấm mà không thấy phản hồi gì. */
 function resolveActionLogTarget(t){
 if(!t) return null;
 const r=records.find(x=>x.id===t.id); if(!r) return null;
 if(t.type==='recordSubtask' && !r.subtasks?.[t.idx]) return null;
 return r;
 }
 function actionLogTargetButtonHtml(n){
 const r=resolveActionLogTarget(n.target);
 if(r) return `<div class="action-bar" style="margin-top:12px"><button class="primary" onclick="openActionLogTarget('${n.id}')">Xem nhiệm vụ liên quan →</button></div>`;
 return `<div class="manual-note" style="margin-top:12px"> Nhiệm vụ liên quan (${esc(n.target.id)}) không còn trong phiên hiện tại — dữ liệu nhiệm vụ demo không lưu qua lần tải lại trang, chỉ riêng Nhật ký thao tác được lưu.</div>`;
 }
 function clearActionLog(){
 window.__actionLogModalOpen=false;
 openDeleteConfirm('Xóa nhật ký thao tác','Xóa toàn bộ nhật ký thao tác đã lưu trên trình duyệt này? Thao tác này không thể hoàn tác.','performClearActionLog()');
 }
 function performClearActionLog(){
 window.__actionLog=[];
 saveActionLog();
 closeModal();
 toast('Đã xóa toàn bộ nhật ký thao tác.');
 }
 function openActionLogTarget(id){
 const n=actionLogFeed().find(x=>x.id===id); if(!n||!n.target) return;
 const t=n.target;
 if(!resolveActionLogTarget(t)){ toast('Nhiệm vụ liên quan không còn trong phiên hiện tại.'); return; }
 window.__actionLogModalOpen=false;
 if(t.type==='record') openRecordDetail(t.id);
 else if(t.type==='recordSubtask') openSubTaskDetail(t.id,t.idx);
 }
 /* ===== 6 nguồn Notify IOC/CAD =====
 1) Tự tạo noti — người dùng bấm "+ Nhập notify" → tạo kèm 1 nhiệm vụ thật (xem createAssignment/isNotifySource),
 phát qua pushNoti với target:{type:'record'} → click mở thẳng openRecordDetail (qua openNotiTarget).
 2-7) Văn bản/nhiệm vụ — TÁCH RIÊNG 6 dòng (không gộp): mới/đổi trạng thái/sắp hạn x văn bản/nhiệm vụ. Số liệu lấy
 THẲNG từ dữ liệu văn bản/nhiệm vụ thật của records (đúng trục đang xem, qua canSeeRole) theo metric+status tương
 ứng — không phải số giả, nên luôn khớp với các widget khác đang hiển thị cùng bộ records. Riêng "mới"/"đổi trạng
 thái" của nhiệm vụ còn CỘNG THÊM số sự kiện thật phát sinh trong phiên (giao nhiệm vụ nhánh/đổi trạng thái subtask
 qua pushNoti — cơ chế real-action giữ nguyên).
 8) GIS — mỗi bản ghi eForm (khác 'done') trong gisEformData là 1 dòng riêng, dữ liệu thật đang nuôi bản đồ GIS.
 9) Camera AI — data giả riêng theo phạm vi đang xem, mỗi cảnh báo 1 dòng riêng.
 10) Lịch họp — từ calendarStatusCounts (giữ nguyên, đã là dạng danh sách qua openCalendar).
 11) KPI chưa đạt — từ indicatorRecords có status 'overdue' (Không đạt), là dữ liệu chỉ tiêu thật có sẵn. */
 function noticeScopeSeed(tag){return gisSeedNum(`${gisScopeKey()}|${tag}`);}
 function noticeScopeRng(tag){return gisRng(noticeScopeSeed(tag));}
 function noticeBaselineCount(tag,min,max){return min+Math.floor(noticeScopeRng(tag)()*(max-min+1));}
 /* status dùng để đếm/lọc: docStatusDefs (new/progress/dueSoon/done/overdue) cho văn bản, statusDefs (new/pending/
 extend/done/closed/revoked) cho nhiệm vụ — tái dùng đúng bộ trạng thái sẵn có, không tự bịa trạng thái mới. */
 const NOTI_DOCTASK_DEFS=[
 {key:'doc_new', label:'Văn bản mới', kind:'doc', metricIn:['docIn'], status:'new'},
 {key:'task_new', label:'Nhiệm vụ mới', kind:'task', metricIn:['assigned','received'], status:'new', feedCat:'assigned'},
 {key:'doc_status', label:'Văn bản đổi trạng thái', kind:'doc', metricIn:['docIn'], status:'progress'},
 {key:'task_status',label:'Nhiệm vụ đổi trạng thái', kind:'task', metricIn:['assigned','received'], status:'pending', feedCat:'status_update'},
 {key:'doc_due', label:'Văn bản sắp đến hạn', kind:'doc', metricIn:['docIn'], status:'dueSoon'},
 {key:'task_due', label:'Nhiệm vụ sắp đến hạn', kind:'task', metricIn:['assigned','received'], status:'extend'}
 ];
 function noticeLiveEvents(feedCat){
 if(!feedCat) return [];
 return notiFeed().filter(n=>n.category===feedCat && n.source!=='Nhập thủ công' && notiVisible(n));
 }
 function noticeDocTaskRecords(def){
 return records.filter(r=>canSeeRole(r.role)&&def.metricIn.includes(r.metric)&&r.status===def.status);
 }
 function openNoticeDocTaskList(key){
 const def=NOTI_DOCTASK_DEFS.find(d=>d.key===key); if(!def) return;
 const recs=noticeDocTaskRecords(def);
 const liveEvents=noticeLiveEvents(def.feedCat);
 document.getElementById('modalTitle').textContent=`Notify IOC/CAD · ${def.label}`;
 document.getElementById('modalSub').textContent=`${gisScopeLabel()} · ${fmt(recs.length+liveEvents.length)} thông báo`;
 const liveHtml=liveEvents.length?`<div class="detail-card"><h4>Phát sinh trong phiên (thao tác thật)</h4><table class="compact-table"><thead><tr><th>Nội dung</th><th>Thời điểm</th></tr></thead><tbody>${liveEvents.map(n=>`<tr onclick="closeModal();openNotiTarget('${n.id}')" style="cursor:pointer"><td>${esc(n.title)}</td><td>${relTime(Date.now()-n.ts)}</td></tr>`).join('')}</tbody></table></div>`:'';
 const page=recs.slice(0,60);
 const listHtml=`<div class="detail-card"><h4>Danh sách ${def.label.toLowerCase()}</h4>${page.length?`<div class="vptu-table-wrap"><table class="vptu-table"><thead><tr><th>STT</th><th>Số ký hiệu</th><th>${def.kind==='doc'?'Trích yếu văn bản':'Tiêu đề nhiệm vụ'}</th><th>Đơn vị</th><th>Người/Đơn vị phối hợp</th><th>Nhóm lĩnh vực</th><th>Ngày bắt đầu</th><th>Hạn xử lý</th><th>Trạng thái xử lý</th></tr></thead><tbody>${page.map((r,i)=>recordRowHtml(r,i+1)).join('')}</tbody></table></div>`:'<div class="access-lock">Không có bản ghi phù hợp</div>'}</div>`;
 document.getElementById('modalBody').innerHTML=`${liveHtml}${listHtml}`;
 openModal();
 }
 function noticeGisItems(){ return (gisEformData||[]).filter(rec=>rec.status!=='done'); }
 function openGisAssignForm(id){
 const rec=(gisEformData||[]).find(x=>x.id===id); if(!rec)return;
 const b=gisBottleneckMeta(rec.bottleneck_code);
 openAssignmentForm('gis',{title:`Xử lý điểm nghẽn GIS: ${rec.title}`,description:`Xử lý điểm nghẽn "${rec.title}" (${b.name}), vị trí ${rec.location_text}. Hạn xử lý: ${gisFmtDue(rec.due_at)}.`,field:b.name},{type:'gis',id:rec.id});
 }
 /* Modal chi tiết ĐẦY ĐỦ trường (khác popup trên bản đồ chỉ có bộ trường cơ bản) — mở từ nút "Xem chi tiết đầy đủ"
 trong popup lẫn từ danh sách Notify IOC/CAD, dùng chung 1 hàm duy nhất. */
 function openGisEformDetail(id){
 const rec=(gisEformData||[]).find(x=>x.id===id); if(!rec) return;
 const b=gisBottleneckMeta(rec.bottleneck_code);
 document.getElementById('modalTitle').textContent=`Notify IOC/CAD · GIS · ${b.name}`;
 document.getElementById('modalSub').textContent=`${gisScopeLabel()} · ${rec.title}`;
 const linkedRowHtml=rec.linkedRecordId?`<b>Xử lý</b><span style="color:#8ff0c1">✓ Đã giao xử lý · nhiệm vụ ${rec.linkedRecordId}</span>`:(rec.demoLinked?`<b>Xử lý</b><span style="color:#8ff0c1">✓ Đã giao xử lý (dữ liệu minh hoạ)</span>`:'');
 /* Bước 3 kịch bản: hiện số lần phản ánh trùng vị trí đã gộp vào điểm này (gisFindMergeTarget ở gis.js). */
 const countRowHtml=(rec.reportCount||1)>1?`<b>Số phản ánh trùng vị trí</b><span>${rec.reportCount}</span>`:'';
 const imgs=rec.images||[];
 const imagesHtml=imgs.length?`<div class="manual-note" style="margin-top:8px"><b>Hình ảnh đính kèm (${imgs.length})</b><div class="gis-report-images" style="margin-top:4px">${imgs.map(im=>`<span class="gis-report-image-thumb"><img src="${im.dataUrl}" alt="${esc(im.name||'')}"/></span>`).join('')}</div></div>`:'';
 const related=rec.relatedReports||[];
 const relatedHtml=related.length?`<div class="manual-note" style="margin-top:8px"><b>Phản ánh liên quan (${related.length})</b><div class="gis-report-related">${related.map(r=>`<div>• ${esc(r.title)}</div>`).join('')}</div></div>`:'';
 /* "Giao xử lý" (bước 4) → "Hoàn thành xử lý" (bước 5, chỉ hiện sau khi đã giao và chưa hoàn thành) →
    marker chuyển xanh lá rồi tự ẩn sau GIS_AUTO_HIDE_MS (xem gisCompleteReport trong gis.js). */
 /* rec.demoLinked (dữ liệu minh hoạ, không có nhiệm vụ thật) không hiện nút "Xem nhiệm vụ đã giao" — bấm vào sẽ
    lỗi vì openRecordDetail() không tìm thấy bản ghi nào khớp id giả; cũng không hiện lại nút "Giao xử lý" vì
    trạng thái đang hiển thị là đã giao. */
 const assignActionHtml=rec.linkedRecordId?`<button class="primary" onclick="closeModal();openRecordDetail('${rec.linkedRecordId}')">→ Xem nhiệm vụ đã giao (${rec.linkedRecordId})</button>`:(rec.demoLinked?'':`<button class="primary" onclick="openGisAssignForm('${rec.id}')">Giao xử lý</button>`);
 const completeActionHtml=((rec.linkedRecordId||rec.demoLinked)&&rec.status!=='done')?`<button class="primary" onclick="gisCompleteReport('${rec.id}');closeModal();" style="background:#0d3c1f;border-color:rgba(47,177,116,.5);color:#7dffba">✓ Hoàn thành xử lý</button>`:'';
 const doneNoteHtml=rec.status==='done'?`<div class="manual-note" style="margin-top:8px;color:#7dffba">✓ Đã xử lý xong — marker sẽ tự ẩn khỏi bản đồ sau ít phút.</div>`:'';
 document.getElementById('modalBody').innerHTML=`<div class="manual-note"><b>Nguồn:</b> eForm GIS — báo cáo điểm nghẽn ${b.name}.</div><div class="detail-card"><h4>Thông tin điểm nghẽn</h4><div class="kv"><b>Mô tả</b><span>${esc(rec.description)}</span><b>Vị trí</b><span>${esc(rec.location_text)}</span><b>Mốc nhận biết</b><span>${esc(rec.landmark||'—')}</span><b>Tọa độ</b><span>${rec.lat.toFixed(4)}, ${rec.lng.toFixed(4)}</span><b>Đơn vị chịu trách nhiệm</b><span>${esc(gisOrgLabel(rec.responsible_org_id))}</span><b>Đơn vị phối hợp</b><span>${(rec.coordinating_org_ids||[]).map(gisOrgLabel).join(', ')||'—'}</span><b>Hạn xử lý</b><span>${gisFmtDue(rec.due_at)}</span><b>Mức nguy hiểm</b><span>${gisDangerLabel(rec.danger_level)} (${rec.danger_level}/5)</span><b>Mức khẩn cấp</b><span>${gisDangerLabel(rec.emergency_level)} (${rec.emergency_level}/5)</span><b>Độ đầy đủ dữ liệu</b><span>${Math.round(rec.completeness_score*100)}%</span><b>Trạng thái xử lý</b><span>${gisStatusLabel[rec.status]}</span>${countRowHtml}${linkedRowHtml}</div>${imagesHtml}${relatedHtml}<div class="manual-note" style="margin-top:8px"><b>Ghi chú người nhập:</b> ${esc(rec.user_notes||'—')}</div><div class="manual-note"><b>Ghi chú GIS/AI:</b> ${esc(rec.gis_ai_notes||'—')}</div><div class="manual-note"><b>Nguồn dữ liệu:</b> ${esc(rec.data_source_note||'—')}</div>${doneNoteHtml}<div class="action-bar" style="margin-top:12px">${assignActionHtml}${completeActionHtml}<button class="ghost" onclick="openGisEformMap('${rec.id}')">Xem trên bản đồ</button></div></div>`;
 openModal();
 }
 function openGisEformMap(id){
 closeModal();
 document.querySelector('.gis-widget')?.scrollIntoView({behavior:'smooth',block:'center'});
 const rec=(gisEformData||[]).find(x=>x.id===id);
 const m=GM.markerRefs && GM.markerRefs.get(id);
 if(m && GM.map && rec){
 GM.map.flyTo([rec.lat,rec.lng],16,{duration:.65});
 setTimeout(()=>{ const grp=GM.groups[rec.bottleneck_code]; if(grp&&typeof grp.zoomToShowLayer==='function') grp.zoomToShowLayer(m,()=>m.openPopup()); else m.openPopup(); },700);
 }
 else gisFocusLayer('all');
 }
 const CAMERA_AI_EVENT_TYPES=[
 {type:'Tụ tập đông người bất thường',level:'Cao'},
 {type:'Phát hiện khói/lửa qua hình ảnh',level:'Khẩn'},
 {type:'Phương tiện dừng đỗ sai quy định',level:'Trung bình'},
 {type:'Xung đột/ẩu đả nơi công cộng',level:'Khẩn'},
 {type:'Xâm nhập khu vực cấm ngoài giờ',level:'Cao'}
 ];
 function noticeCameraItems(){
 const rng=noticeScopeRng('camera-ai-rows');
 const n=noticeBaselineCount('camera-ai-count',1,4);
 const label=gisScopeLabel(); const items=[];
 for(let i=0;i<n;i++){
 const t=CAMERA_AI_EVENT_TYPES[Math.floor(rng()*CAMERA_AI_EVENT_TYPES.length)];
 const camId=`CAM-${String(1+Math.floor(rng()*40)).padStart(3,'0')}`;
 const h=String(Math.floor(rng()*24)).padStart(2,'0'), m=String(Math.floor(rng()*60)).padStart(2,'0');
 items.push({id:`cam-${i}`,camId,type:t.type,level:t.level,location:`Camera giám sát · ${label}`,time:`${h}:${m}`,confidence:70+Math.floor(rng()*28)});
 }
 return items;
 }
 function openCameraAssignForm(id){
 const c=(window.__noticeCameraCache||[]).find(x=>x.id===id); if(!c)return;
 openAssignmentForm('camera',{title:`Xử lý cảnh báo Camera AI: ${c.type}`,description:`Camera ${c.camId} phát hiện "${c.type}" lúc ${c.time} hôm nay, độ tin cậy AI ${c.confidence}%. Vị trí: ${c.location}.`},{type:'camera',id:c.id});
 }
 function openNoticeCameraDetail(id){
 const c=(window.__noticeCameraCache||[]).find(x=>x.id===id); if(!c) return;
 const linkedId=(window.__cameraAlertLinks||{})[c.id];
 document.getElementById('modalTitle').textContent=`Notify IOC/CAD · Camera AI · ${c.camId}`;
 document.getElementById('modalSub').textContent=`${c.type} · ${c.time} hôm nay`;
 const linkedRowHtml=linkedId?`<b>Xử lý</b><span style="color:#8ff0c1">✓ Đã giao xử lý · nhiệm vụ ${linkedId}</span>`:'';
 const actionHtml=linkedId?`<button class="primary" onclick="closeModal();openRecordDetail('${linkedId}')">→ Xem nhiệm vụ đã giao (${linkedId})</button>`:`<button class="primary" onclick="openCameraAssignForm('${c.id}')">Giao xử lý</button>`;
 document.getElementById('modalBody').innerHTML=`<div class="manual-note"><b>Nguồn:</b> Camera AI giám sát (dữ liệu minh họa demo).</div><div class="detail-card"><h4>Thông tin cảnh báo AI</h4><div class="kv"><b>Camera</b><span>${c.camId}</span><b>Loại cảnh báo</b><span>${c.type}</span><b>Mức độ</b><span class="${c.level==='Khẩn'?'danger':'warn'}">${c.level}</span><b>Thời điểm</b><span>${c.time} hôm nay</span><b>Vị trí</b><span>${c.location}</span><b>Độ tin cậy AI</b><span>${c.confidence}%</span>${linkedRowHtml}</div><div class="action-bar" style="margin-top:12px">${actionHtml}</div></div>`;
 openModal();
 }
 function noticeKpiItems(){
 const roles=allowedRoles();
 /* Khi đang xem theo 1 xã/phường cụ thể, chỉ tính chỉ tiêu thuộc đúng bộ chỉ tiêu cấp phường (categorySeedForRole),
 không tính chỉ tiêu cấp thành phố — tránh lộ dữ liệu thành phố vào notify KPI của tài khoản xã/phường. */
 const scopedNames=currentXaId!=null?new Set(roles.flatMap(r=>categorySeedForRole(r).flatMap(c=>c.items.map(it=>it[0])))):null;
 return (indicatorRecords||[]).filter(r=>roles.includes(r.role)&&r.status==='overdue'&&(!scopedNames||scopedNames.has(r.indicator)));
 }
 function openNoticeKpiList(){
 const items=noticeKpiItems().slice(0,60);
 document.getElementById('modalTitle').textContent='Notify IOC/CAD · Chỉ tiêu chưa đạt KPI';
 document.getElementById('modalSub').textContent=`${gisScopeLabel()} · ${fmt(items.length)} chỉ tiêu chưa đạt`;
 document.getElementById('modalBody').innerHTML=`<div class="detail-card"><h4>Danh sách chỉ tiêu chưa đạt (Không đạt)</h4><table class="compact-table"><thead><tr><th>Mã</th><th>Chỉ tiêu</th><th>Đơn vị</th><th>Tiến độ</th></tr></thead><tbody>${items.map(r=>`<tr onclick="closeModal();openIndicatorDetail('${r.id}')" style="cursor:pointer"><td>${r.id}</td><td>${esc(r.indicator)}</td><td>${esc(r.unit)}</td><td>${r.progress}%</td></tr>`).join('')||'<tr><td colspan="4">Không có chỉ tiêu chưa đạt trong phạm vi hiện tại</td></tr>'}</tbody></table></div>`;
 openModal();
 }
 function renderNotifications(){
 const rows=[];
 notiFeed().filter(n=>notiVisible(n)&&n.source==='Nhập thủ công').slice(0,20).forEach(n=>{
 rows.push(`<button class="notify" onclick="openNotiTarget('${n.id}')"><div><b>${esc(n.title)}</b></div><span class="badge ${n.level==='Khẩn'?'red':'warn'}">${esc(n.type||'Notify')}</span></button>`);
 });
 NOTI_DOCTASK_DEFS.forEach(def=>{
 const total=noticeDocTaskRecords(def).length+noticeLiveEvents(def.feedCat).length;
 if(total<=0) return;
 rows.push(`<button class="notify" onclick="openNoticeDocTaskList('${def.key}')"><div><b>${fmt(total)} ${def.label.toLowerCase()}</b></div><span class="badge ${def.key.includes('due')?'red':'warn'}">${def.label}</span></button>`);
 });
 /* Notify GIS/Camera AI dùng chung đúng 1 nguồn dữ liệu với bản đồ GIS (noticeGisItems() đọc gisEformData) —
 GIS giờ đã có dữ liệu cho mọi tài khoản kể cả Trung ương (xem buildGisScopeData/renderAll), nên KHÔNG còn lọc
 riêng theo isTwRole ở đây nữa; nếu chặn ở đây mà không chặn ở bản đồ sẽ tạo lại đúng kiểu lệch pha khó hiểu
 (bản đồ có dữ liệu nhưng Notify lại không hiện) đã từng xảy ra. */
 noticeGisItems().forEach(rec=>{
 const linked=!!(rec.linkedRecordId||rec.demoLinked);
 const b=gisBottleneckMeta(rec.bottleneck_code);
 rows.push(`<button class="notify" onclick="openGisEformDetail('${rec.id}')"><div><b>${esc(rec.title)}</b></div><span class="badge ${linked?'ok':(rec.danger_level>=4?'red':'warn')}">${linked?'Đã giao · ':''}GIS · ${esc(b.name)}</span></button>`);
 });
 const camItems=noticeCameraItems(); window.__noticeCameraCache=camItems;
 camItems.forEach(c=>{
 const linked=!!(window.__cameraAlertLinks&&window.__cameraAlertLinks[c.id]);
 rows.push(`<button class="notify" onclick="openNoticeCameraDetail('${c.id}')"><div><b>${esc(c.type)} · ${c.camId}</b></div><span class="badge ${linked?'ok':(c.level==='Khẩn'?'red':'warn')}">${linked?'Đã giao · ':''}Camera AI</span></button>`);
 });
 const cal=calendarStatusCounts();
 if(cal.upcoming+cal.today>0) rows.push(`<button class="notify" onclick="openCalendar(null,'Lịch công tác/kỳ họp','upcoming')"><div><b>${fmt(cal.upcoming+cal.today)} lịch họp sắp diễn ra/hôm nay</b></div><span class="badge warn">Lịch họp</span></button>`);
 if(cal.late>0) rows.push(`<button class="notify" onclick="openCalendar(null,'Lịch công tác/kỳ họp','late')"><div><b>${fmt(cal.late)} lịch họp trễ xác nhận/chuẩn bị</b></div><span class="badge red">Lịch họp</span></button>`);
 const kpiCount=noticeKpiItems().length;
 if(kpiCount>0) rows.push(`<button class="notify" onclick="openNoticeKpiList()"><div><b>${fmt(kpiCount)} chỉ tiêu chưa đạt KPI</b></div><span class="badge red">KPI</span></button>`);
 const box=document.getElementById('notifyList');
 if(box) box.innerHTML=rows.join('')||`<div class="access-lock">Không có notify trong phạm vi quyền hiện tại.</div>`;
 }
 function openNotifyForm(){
 if(guardAction('nhập notify'))return;
 openAssignmentForm('notify');
 }
 function openNotifySourceConfig(){
 if(guardAction('cấu hình nguồn notify'))return;
 document.getElementById('modalTitle').textContent='Cấu hình nguồn Notify IOC/CAD';
 document.getElementById('modalSub').textContent='';
 const sources=[
 ['Tự tạo notify','Khi phát sinh','Cán bộ trực IOC nhập notify thủ công, tạo kèm 1 nhiệm vụ xử lý','Có thao tác'],
 ['Văn bản/nhiệm vụ','Realtime trong phiên + tổng hợp theo ngày','Văn bản/nhiệm vụ mới nhận, đổi trạng thái, sắp đến hạn (SLA) — tách riêng từng loại','Tự động'],
 ['GIS (Phản ánh/sự cố)','Realtime','Phản ánh, sự cố ghi nhận trên bản đồ GIS khu vực quản lý','Tự động'],
 ['Camera AI','Realtime','Camera AI phát hiện bất thường (tụ tập, cháy nổ, xung đột...)','Tự động'],
 ['Calendar thư ký','15 phút/lần','Lịch họp trong 24h hoặc trễ xác nhận','Tự động'],
 ['Chỉ tiêu (KPI)','Theo kỳ báo cáo','Chỉ tiêu không đạt mục tiêu (Không đạt) theo dữ liệu chỉ tiêu','Tự động']
 ];
 document.getElementById('modalBody').innerHTML=`<div class="detail-card"><h4>6 nguồn phát sinh Notify</h4><table class="compact-table"><thead><tr><th>Nguồn</th><th>Tần suất</th><th>Điều kiện sinh notify</th><th>Cơ chế</th></tr></thead><tbody>${sources.map(s=>`<tr><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td></tr>`).join('')}</tbody></table></div>`;
 openModal();
 }
 /* "⚙ Cấu hình nguồn" gỡ khỏi đây theo yêu cầu — sẽ chuyển vào màn quản trị riêng; openNotifySourceConfig() giữ
 nguyên bên dưới, không xóa, chỉ không còn nút gọi ở widget này. #cadToolbar giờ là 1 trong 3 item của hàng flex
 [Tìm kiếm | + Tạo | icon phễu] (demo_ioc.html) — auto width vừa nội dung, không ép width:100% như hồi còn ở
 lưới 2 cột. Nhãn rút gọn "+ Tạo" theo đúng bản vẽ tay anh gửi (trước là "+ Nhập notify"), hành vi giữ nguyên.
 Lý do khóa (locked) chuyển hẳn vào title (tooltip) vì không còn chỗ cho khối access-lock riêng trên hàng này. */
 function renderCad(){
 const box=document.getElementById('cadToolbar'); if(!box) return;
 const locked=isReadOnlyViewAs();
 const lockAttr=locked?'disabled title="Chỉ Thành ủy được thao tác khi xem IOC của cấp dưới"':'';
 box.innerHTML=`<button class="ghost" ${lockAttr} onclick="openNotifyForm()" style="white-space:nowrap;padding:8px 14px;font-size:13px">＋ Tạo</button>`;
 }

