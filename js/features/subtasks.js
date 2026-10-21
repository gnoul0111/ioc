 /* ============================== NHIỆM VỤ NHÁNH GẮN VỚI BẢN GHI VPTU (tạo thủ công trong IOC, tách riêng khỏi dữ liệu đồng bộ) ============================== */
 function vptuSubtasksStore(id){window.__vptuSubtasks=window.__vptuSubtasks||{};window.__vptuSubtasks[id]=window.__vptuSubtasks[id]||[];return window.__vptuSubtasks[id];}
 function vptuSubtaskStatsHtml(metric,parentId){
 const subs=vptuSubtasksStore(parentId);
 const done=subs.filter(s=>(s.state||'').toLowerCase().includes('hoàn')).length;
 const doing=subs.filter(s=>(s.state||'').toLowerCase().includes('đang')).length;
 const soon=subs.filter(s=>(s.state||'').toLowerCase().includes('sắp')).length;
 const groups=groupSubtasksByScenario(subs);
 const groupsHtml=groups.length?groups.map(g=>{
 const rows=g.items.map(({s,i})=>`<tr class="clickable" onclick="openVptuSubTaskDetail('${metric}','${parentId}',${i})"><td>${s.id}</td><td class="subtask-name-col">${s.name||'Việc nhánh'}</td><td class="subtask-content-col">${s.content||s.name||'--'}</td><td>${s.owner||'--'}</td><td>${s.due||'--'}</td><td>${s.progress??35}%</td><td><span class="badge ${s.state&&s.state.includes('Hoàn')?'ok':s.state&&s.state.includes('Sắp')?'warn':''}">${s.state||'Đang xử lý'}</span></td></tr>`).join('');
 return `<div class="task-scenario-group"><div class="task-scenario-heading"> ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 }).join(''):`<div class="subtask-empty">Chưa có nhiệm vụ nhánh. Bấm "＋ Giao nhiệm vụ nhánh" để tạo.</div>`;
 return `<section class="subtask-summary"><div class="subtask-head"><div><h4>Nhiệm vụ nhánh</h4><div class="subtask-meta-note">Chọn kịch bản xử lý → tạo nhiệm vụ nhánh liên quan, nhóm theo đúng kịch bản → có thể thêm mới nhiệm vụ nhánh.</div></div><div class="action-bar"><button class="primary" onclick="openVptuScenarioSelector('${metric}::${parentId}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openVptuSubTaskForm('${metric}','${parentId}')">＋ Giao nhiệm vụ nhánh</button></div></div><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div><div class="task-scenario-groups">${groupsHtml}</div></section>`;
 }
 /* --- Kịch bản xử lý cho nhiệm vụ nhánh VPTU (dùng chung helper với hồ sơ/chỉ tiêu/lĩnh vực) --- */
 function vptuScenarioTarget(id){const [metric,parentId]=String(id).split('::'); const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); return {metric,parentId,r};}
 function vptuScenarioKeys(id){const arr=['data','coordinate']; arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)];}
 function openVptuScenarioSelector(id){
 if(guardAction('chọn kịch bản xử lý'))return;
 const t=vptuScenarioTarget(id); if(!t.r){toast('Không tìm thấy bản ghi VPTU.');return}
 const allKeys=vptuScenarioKeys(id).filter(k=>scenarioTemplates()[k]&&!isScenarioArchived(k));
 const fieldLabel=t.r.field||null; const mode=scenarioFieldFilterModeFor('vptu:'+id);
 const keys=filterScenarioKeysByField(allKeys,fieldLabel,mode);
 document.getElementById('modalTitle').textContent='Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh';
 document.getElementById('modalSub').textContent=`${t.r.id} · ${esc(t.r.title)}`;
 document.getElementById('modalBody').innerHTML=`<div class="scenario-history-badge"><b>Bản ghi VPTU:</b> ${t.r.id} · ${esc(t.r.title)}. Chọn kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('vptu','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openVptuRecordDetail('${t.metric}','${t.parentId}')">Quay lại hồ sơ chính</button></div>${scenarioFieldFilterBarHtml('vptu',id,fieldLabel,mode)}<div class="scenario-grid">${keys.length?keys.map(k=>scenarioCardHtml('vptu',id,k)).join(''):'<div class="subtask-empty">Không có kịch bản phù hợp với bộ lọc lĩnh vực hiện tại.</div>'}</div>`;
 openModal();
 }
 function selectVptuScenario(id,key){
 const t=vptuScenarioTarget(id); if(!t.r||!scenarioTemplates()[key])return;
 document.getElementById('modalTitle').textContent=`${scenarioTemplates()[key].title} · ${t.r.id}`;
 document.getElementById('modalSub').textContent='Chọn nhiệm vụ nhánh';
 document.getElementById('modalBody').innerHTML=scenarioDetailHtml('vptu',id,key,t.r,null);
 openModal();
 }
 function applyVptuScenarioTasks(id,key){
 if(guardAction('tạo nhiệm vụ nhánh theo kịch bản'))return;
 const t=vptuScenarioTarget(id); const s=scenarioTemplates()[key]; if(!t.r||!s)return;
 const checked=[...document.querySelectorAll('[data-scenario-task]:checked')].map(x=>Number(x.dataset.scenarioTask));
 if(!checked.length){toast('Chưa chọn nhiệm vụ nhánh nào.');return;}
 const subs=vptuSubtasksStore(t.parentId);
 let created=0;
 checked.forEach(idx=>{
 const tk=s.tasks[idx]; if(!tk) return;
 const dup=subs.some(x=>x.name===tk[0]&&x.scenario===key); if(dup) return;
 subs.push({id:`${t.parentId}-N${String(subs.length+1).padStart(2,'0')}`,name:tk[0],content:tk[1],owner:tk[2],coordinators:tk[3]||[],state:'Đang xử lý',startDate:tk[6]||'',due:tk[7]||dueDate(idx,key==='overdue'?'soon':'doing'),priority:tk[4]||((s.level==='Khẩn'||s.level==='Cao')?'Cao':'Bình thường'),urgency:tk[5]||'Thường',progress:10,scenario:key,created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,creatorOfficeId:currentOfficeId});
 const subIdx=subs.length-1;
 pushNoti({role:t.r.role,soId:resolveSoIdByUnitName(tk[2]),category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${tk[0]}`,sub:`Theo kịch bản "${s.title}", giao cho ${tk[2]}, thuộc ${t.r.id}.`,level:s.level==='Khẩn'?'Khẩn':'Cao',target:{type:'vptuSubtask',id:t.parentId,metric:t.metric,idx:subIdx}});
 created++;
 });
 pushActionLog({category:'scenario',icon:'',title:`Áp dụng kịch bản "${s.title}"`,sub:`${t.r.id} — tạo ${created} nhiệm vụ nhánh`,detail:'',role:t.r.role,target:{type:'vptuSubtask',id:t.parentId,metric:t.metric}});
 toast(`Đã tạo ${created} nhiệm vụ nhánh theo kịch bản.`); openVptuRecordDetail(t.metric,t.parentId);
 }
 function openVptuSubTaskForm(metric,parentId,editIdx){
 if(guardAction(editIdx!=null?'sửa nhiệm vụ nhánh':'giao nhiệm vụ nhánh'))return;
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); if(!r)return;
 const subs=vptuSubtasksStore(parentId);
 const editing=editIdx!=null; const s=editing?subs[editIdx]:null;
 if(editing && !s) return;
 if(editing && !isSubtaskOwnedByMe(s)){guardOwnership('sửa');openVptuRecordDetail(metric,parentId);return;}
 window.__assignmentFiles=editing&&s.attachmentsKey?JSON.parse(localStorage.getItem(s.attachmentsKey)||'[]'):[];
 document.getElementById('modalTitle').textContent=editing?`Sửa nhiệm vụ nhánh · ${s.id}`:`Giao nhiệm vụ nhánh · ${r.id}`;
 document.getElementById('modalSub').textContent=`Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${r.id} · ${esc(r.title)}`;
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="openVptuRecordDetail('${metric}','${parentId}')">← Quay lại hồ sơ chính</button></div><div class="scenario-history-badge"><b>Nhiệm vụ cha:</b> ${r.id} · ${esc(r.title)} · Trục ${roleMeta(r.role)?.icon||''} ${roleMeta(r.role)?.name||r.role}</div>
 ${subTaskFormFieldsHtml(parentId,subs.length,editing,s)}
 <div class="action-bar">${editing?`<button class="primary" onclick="saveEditedVptuSubTask('${metric}','${parentId}',${editIdx})">Lưu thay đổi</button><button class="ghost" onclick="openVptuRecordDetail('${metric}','${parentId}')">Hủy</button>`:`<button class="primary" onclick="createVptuSubTaskAssignment('${metric}','${parentId}')">Phát hành nhiệm vụ nhánh</button><button class="ghost" onclick="openVptuRecordDetail('${metric}','${parentId}')">Hủy</button>`}</div>`;
 openModal();
 renderAssignmentFileList();
 if(editing) updateUnitTriggerLabel('subCoordTriggerText','subCoordBox','Chọn đơn vị phối hợp');
 }
 function createVptuSubTaskAssignment(metric,parentId){
 if(guardAction('giao nhiệm vụ nhánh'))return;
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); if(!r)return;
 const name=(document.getElementById('subTitle').value||'').trim(); if(!name){toast('Cần nhập tên nhiệm vụ nhánh.');return;}
 if(!validDateRange('subStart','subDue'))return;
 const owner=document.getElementById('subOwner').value;
 const coordinators=Array.from(document.querySelectorAll('.subCoord:checked')).map(c=>c.value);
 const priority=document.getElementById('subPriority').value;
 const urgency=document.getElementById('subUrgency').value;
 const startDate=document.getElementById('subStart').value||'';
 const dueRaw=document.getElementById('subDue').value||''; const due=dueRaw?dueRaw.split('-').reverse().join('/'):dueDate(0,'doing');
 const content=(document.getElementById('subContent').value||'').trim()||name;
 const subs=vptuSubtasksStore(parentId);
 const id=`${parentId}-N${String(subs.length+1).padStart(2,'0')}`;
 const attachments=window.__assignmentFiles||[]; const attachmentsKey=attachments.length?`px-ioc-files-${id}`:null;
 if(attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
 subs.push({id,name,content,owner,coordinators,state:'Đang xử lý',due,startDate,priority,urgency,progress:5,scenario:'',attachmentsKey,evidence:attachments.map(a=>a.name),created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,creatorOfficeId:currentOfficeId});
 const subIdx=subs.length-1;
 pushNoti({role:r.role,soId:resolveSoIdByUnitName(owner),category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${name}`,sub:`${currentAccount.title} giao cho ${owner}, thuộc ${r.id}.`,level:urgency==='Khẩn cấp'?'Khẩn':(priority==='Cao'?'Cao':'Thường'),target:{type:'vptuSubtask',id:parentId,metric,idx:subIdx}});
 pushActionLog({category:'assign',icon:'',title:`Giao nhiệm vụ nhánh: ${name}`,sub:`Thuộc ${r.id} → ${owner} · Ưu tiên ${priority} · Khẩn ${urgency} · Hạn ${due||'—'}`,detail:`Nội dung: ${content}${coordinators.length?` · Phối hợp: ${coordinators.join(', ')}`:''}`,role:r.role,target:{type:'vptuSubtask',id:parentId,metric,idx:subIdx}});
 toast(`Đã giao nhiệm vụ nhánh "${name}" là nhiệm vụ con của ${r.id}.`);
 openVptuRecordDetail(metric,parentId);
 }
 function saveEditedVptuSubTask(metric,parentId,idx){
 if(guardAction('sửa nhiệm vụ nhánh'))return;
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); const s=vptuSubtasksStore(parentId)[idx]; if(!r||!s)return;
 if(!isSubtaskOwnedByMe(s)){guardOwnership('sửa');return;}
 const name=(document.getElementById('subTitle').value||'').trim(); if(!name){toast('Cần nhập tên nhiệm vụ nhánh.');return;}
 if(!validDateRange('subStart','subDue',s.startDate,s.due))return;
 s.name=name;
 s.owner=document.getElementById('subOwner').value;
 s.ownerXaId=resolveXaIdByUnitName(s.owner);
 s.coordinators=Array.from(document.querySelectorAll('.subCoord:checked')).map(c=>c.value);
 s.priority=document.getElementById('subPriority').value;
 s.urgency=document.getElementById('subUrgency').value;
 s.startDate=document.getElementById('subStart').value||'';
 const dueRaw=document.getElementById('subDue').value||''; s.due=dueRaw?dueRaw.split('-').reverse().join('/'):s.due;
 s.content=(document.getElementById('subContent').value||'').trim()||name;
 const attachments=window.__assignmentFiles||[];
 if(attachments.length){ const key=s.attachmentsKey||`px-ioc-files-${s.id}`; localStorage.setItem(key, JSON.stringify(attachments)); s.attachmentsKey=key; s.evidence=attachments.map(a=>a.name); }
 pushActionLog({category:'edit',icon:'',title:`Sửa nhiệm vụ nhánh: ${name}`,sub:`Thuộc ${r.id}`,detail:'Cập nhật thông tin nhiệm vụ nhánh.',role:r.role,target:{type:'vptuSubtask',id:parentId,metric,idx}});
 toast(`Đã cập nhật nhiệm vụ nhánh "${name}".`);
 openVptuSubTaskDetail(metric,parentId,idx);
 }
 function deleteVptuSubTask(metric,parentId,idx){
 if(guardAction('xóa nhiệm vụ nhánh'))return;
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); const s=vptuSubtasksStore(parentId)[idx]; if(!r||!s)return;
 if(!isSubtaskOwnedByMe(s)){guardOwnership('xóa');return;}
 openDeleteConfirm('Xóa nhiệm vụ nhánh', `Xóa nhiệm vụ nhánh "<b>${esc(s.name||'')}</b>" (${s.id})? Thao tác này không thể hoàn tác.`, `performDeleteVptuSubTask('${metric}','${parentId}',${idx})`);
 }
 function performDeleteVptuSubTask(metric,parentId,idx){
 const subs=vptuSubtasksStore(parentId); const removed=subs[idx]; if(!removed)return;
 subs.splice(idx,1);
 pushActionLog({category:'delete',icon:'',title:`Xóa nhiệm vụ nhánh: ${removed.name}`,sub:`Thuộc ${parentId}`,detail:`Đơn vị nhận: ${removed.owner||'—'} · Trạng thái lúc xóa: ${removed.state||'—'} · Tiến độ ${removed.progress??0}%`,role:currentRole});
 closeModal(); openVptuRecordDetail(metric,parentId); toast(`Đã xóa nhiệm vụ nhánh "${removed.name}".`);
 }
 function openVptuSubTaskDetail(metric,parentId,idx){
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===parentId); const s=vptuSubtasksStore(parentId)[idx]; if(!r||!s)return;
 const attFiles=s.attachmentsKey?JSON.parse(localStorage.getItem(s.attachmentsKey)||'[]'):[];
 document.getElementById('modalTitle').textContent=`Chi tiết nhiệm vụ nhánh · ${s.id}`;
 document.getElementById('modalSub').textContent=`Gắn với ${r.id}`;
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="openVptuRecordDetail('${metric}','${parentId}')">← Quay lại hồ sơ chính</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id}</span><b>Nhiệm vụ cha</b><span>${r.id} · ${esc(r.title)}</span><b>Tên nhiệm vụ</b><span>${esc(s.name)}</span><b>Nội dung</b><span class="wrap">${esc(s.content||s.name)}</span><b>Đơn vị chủ trì</b><span>${esc(s.owner)}</span><b>Đơn vị phối hợp</b><span>${(s.coordinators&&s.coordinators.length)?s.coordinators.join(', '):'—'}</span><b>Ngày bắt đầu</b><span>${s.startDate||'—'}</span><b>Hạn xử lý</b><span>${s.due||'--'}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Độ khẩn</b><span>${s.urgency||'—'}</span><b>Trạng thái</b><span>${s.state}</span>${attFiles.length?`<b>File đính kèm</b><span>${attFiles.map(f=>`<a href="${f.dataUrl}" download="${f.name}" style="color:#49bcff">${f.name}</a>`).join(', ')}</span>`:''}</div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p>${subtaskProgressHtml(s.state,s.progress??30)}<div class="action-bar" style="margin-top:10px">${subtaskSyncButtonHtml(s.state)}${subtaskActionButtonsHtml(s)}${isSubtaskOwnedByMe(s)?`<button class="ghost" onclick="openVptuSubTaskForm('${metric}','${parentId}',${idx})">✏️ Sửa nhiệm vụ nhánh</button><button class="ghost danger-btn" onclick="deleteVptuSubTask('${metric}','${parentId}',${idx})">🗑️ Xóa nhiệm vụ nhánh</button>`:''}</div></div></div>`;
 openModal();
 }
 function vptuBoxHtml(idx){
 const d=VPTU_DATA[idx];
 const rows=d.rows.map(r=>`<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${STATUS_COLOR_MAP[r[0]]};margin-right:6px"></i>${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('');
 return catBoxHtml(d.title,`<div style="position:relative;height:170px;margin-top:8px"><canvas id="vptuChart${idx}"></canvas></div><div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>`);
 }
 let vptuChartInstances=[];
 function initVptuCharts(){
 vptuChartInstances.forEach(c=>c&&c.destroy()); vptuChartInstances=[];
 VPTU_DATA.forEach((d,idx)=>{
 const canvas=document.getElementById('vptuChart'+idx); if(!canvas||typeof Chart==='undefined') return;
 const labels=d.rows.map(r=>r[0]), data=d.rows.map(r=>r[1]), colors=d.rows.map(r=>STATUS_COLOR_MAP[r[0]]);
 vptuChartInstances[idx]=new Chart(canvas,{
 type:'doughnut',
 data:{labels,datasets:[{data,backgroundColor:colors,borderColor:donutBorderColor(),borderWidth:1.5}]},
 options:{responsive:true,maintainAspectRatio:false,animation:false,cutout:'68%',plugins:{legend:{display:false}}},
 plugins:[donutCenterTextPlugin(fmt(d.total),'nhiệm vụ')]
 });
 });
 }
 /* Thẻ KPI đơn (1 chỉ số) — dùng cho các chỉ tiêu vốn chỉ là 1 con số, tách ra từ các hàng KPI gộp trước đây. */
 function kpiTileHtml(label,value){
 return catBoxHtml(label,`<b style="font-size:24px;color:#fff;display:block;margin-top:4px">${esc(value)}</b>`);
 }
 /* Đăng ký: mỗi chỉ tiêu con (theo đúng thứ tự categorySeed.items) ứng với 1 hàm dựng nội dung riêng (khớp đúng số
 liệu/biểu đồ thật đã có sẵn cho lĩnh vực đó); null = chưa có khối riêng, dùng lại catItemCardHtml (donut/bar theo
 dữ liệu khai báo). Nhờ đăng ký này, openCategoryDetail xử lý MỌI lĩnh vực theo cùng 1 cấu trúc: xem đầy đủ = nối
 tất cả các khối; xem 1 chỉ tiêu = chỉ hiện đúng khối đó. */
 const CUSTOM_CAT_ITEM_BUILDERS={
 'dang-ubkt':[null,ubktBox1Html,ubktBox2Html,ubktBox3Html,ubktBox4Html,ubktChartBoxHtml],
 'dang-to-chuc':[
 ()=>kpiTileHtml('CBCCVC khối Đảng, MTTQ','4.505'),
 null,
 ()=>kpiTileHtml('Tổ chức cơ sở Đảng','5.887'),
 tochucBox1Html,tochucBox2Html,tochucBox3Html,tochucBox4Html,tochucBox5Html
 ],
 'dang-noi-chinh':[noichinhTopKpiHtml,noichinhBox1Html,noichinhBox2Html,noichinhBox3Html],
 'dang-tuyen-giao':[tuyengiaoBox2Html,null,tuyengiaoBox1Html],
 'ubnd-nnmt':[null,null,null,null,null,null,null,null,null,null,nnmtGpmbBoxHtml,nnmtDatDaiBoxHtml],
 'ubnd-taichinh':[
 null,null,null,null,null,null,null,null,null,null,null,null,null,
 ()=>tcChartBox('tcThuChart','Tình hình thu ngân sách so với dự toán (%)',260),
 ()=>tcChartBox('tcLuuChuyenChart','Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội (ước tính)',260),
 ()=>tcChartBox('tcVonDauTuChart','Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành',260),
 ()=>tcChartBox('tcVonNsnnChart','Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý',260),
 ()=>tcChartBox('tcSxcnChart','Chỉ số SXCN so với cùng kỳ năm trước (ước tính)',260),
 ()=>tcChartBox('tcDuAnChart','Tiến độ hoàn thành các dự án trọng điểm (ước tính)',260),
 ()=>tcChartBox('tcVanTaiChart','Doanh thu vận tải, kho bãi, bưu chính chuyển phát (ước tính)',300),
 ()=>tcChartBox('tcKhachDLChart','Khách du lịch đến Hà Nội',260),
 ()=>tcChartBox('tcXnkChart','Kim ngạch xuất nhập khẩu (ước tính)',300),
 ()=>tcChartBox('tcGiaChart','Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ (ước tính)',260),
 ()=>tcChartBox('tcChiNsChart','Tình hình chi ngân sách địa phương Quý I/2026 (ước tính)',300)
 ],
 /* 4 khối đầu (chỉ tiêu theo eform) do dashboard-snv.js đăng ký đè lên dòng này */
 'ubnd-noivu':[
 null,null,null,null,
 ()=>kpiTileHtml('Doanh nghiệp tham gia tuyển dụng','64'),
 ()=>kpiTileHtml('Tổng số nhu cầu tuyển dụng','443'),
 ()=>kpiTileHtml('Số hồ sơ tìm việc','652'),
 noivuBox1Html,noivuBox2Html
 ]
 };
 const CAT_EMPTY_OPEN_DRAWER=false;
 function openCategoryDetail(role,catId,itemIndex){
 if(role!==currentRole && !allowedCategoryRoles().includes(role)){toast('Không có quyền xem lĩnh vực này.');return}
 const cat=categorySeedForRole(role).find(c=>c.id===catId); if(!cat)return;
 cat.role=role;
 if(catId==='ubnd-taichinh' && !(typeof TC_SHOW_LEGACY!=='undefined' && TC_SHOW_LEGACY) && typeof stcOpenForm==='function'){ stcOpenForm(itemIndex, role); return; }
 /* Sở GD&ĐT cấp Thành phố: form chỉ tiêu mới (dashboard-sgd.js). Cấp xã/phường giữ nguyên bộ riêng của xã. */
 if(catId==='ubnd-gddt' && currentXaId==null && cat.sgd && !(typeof SGD_SHOW_LEGACY!=='undefined' && SGD_SHOW_LEGACY) && typeof sgdOpenForm==='function'){ sgdOpenForm(itemIndex, role); return; }
 /* Trung tâm Phục vụ HCC Thành phố: form chỉ tiêu mới (dashboard-hcc.js). */
 if(catId==='ubnd-hcc' && cat.hcc && typeof hccOpenForm==='function'){ hccOpenForm(itemIndex, role); return; }
 /* Bộ chỉ tiêu khuôn mới dùng chung (ctm-engine.js) cho các đơn vị đã khai báo (ctm-mttq.js, …). Tắt CTM_ENABLED để quay về drawer cũ bên dưới. */
 if(typeof ctmHandles==='function' && ctmHandles(catId)){ ctmOpenForm(catId, itemIndex, role); return; }
 const apiFetch=apiCategoryFetcher(catId);
 if(apiFetch){
 const isSingle=typeof itemIndex==='number';
 document.getElementById('drawerTitle').textContent=`Lĩnh vực: ${cat.name}`;
 document.getElementById('drawerSub').textContent='Đang tải dữ liệu từ API...';
 document.getElementById('drawerBody').innerHTML=`<div class="cat-item-list" id="apiCatBody"><div class="access-lock" style="text-align:center;padding:24px 12px"><p style="margin:0;color:var(--text-secondary);font-size:13px">Đang tải dữ liệu từ API...</p></div></div>`;
 openDrawer();
 document.getElementById('drawerHeadActions').innerHTML=`<div style="display:flex;gap:10px"><button class="ghost" onclick="exportCategoryToExcel('${role}','${catId}')" style="height:36px;min-width:130px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap">⬇ Xuất Excel</button><button class="primary" onclick="openIndicatorEntrySystem()" style="height:36px;min-width:130px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap">＋ Nhập chỉ tiêu</button></div>`;
 apiFetch().then(kpis=>{
 const el=document.getElementById('apiCatBody'); if(!el)return;
 if(!kpis){ el.innerHTML='<div class="access-lock" style="text-align:center;padding:24px 12px"><p style="margin:0;color:var(--text-secondary);font-size:13px">Không tải được dữ liệu từ API.</p></div>'; return; }
 if(isSingle){
 const kpi=kpis[itemIndex];
 document.getElementById('drawerTitle').textContent=`Lĩnh vực: ${cat.name}${kpi?` — ${kpi.label}`:''}`;
 el.innerHTML=kpi?apiKpiCardHtml(kpi):'<div class="access-lock">Không tìm thấy chỉ tiêu này.</div>';
 } else {
 el.innerHTML=`<div style="display:grid;gap:14px">${kpis.map(apiKpiCardHtml).join('')}</div>`;
 }
 flushPendingDimCharts();
 document.getElementById('drawerSub').textContent=`${cat.name} · Dữ liệu trực tiếp từ API IOC`;
 });
 return;
 }
 ensureFakeCategoryItems(role,catId);
 /* Đơn vị không có chỉ tiêu: không mở drawer (UI cũ), chỉ báo ở góc màn hình. Bật CAT_EMPTY_OPEN_DRAWER để quay lại drawer "Không có chỉ tiêu được giao." */
 if(!CAT_EMPTY_OPEN_DRAWER && (cat.noItems || (!(cat.items||[]).length && catId!=='dang-vptu' && !(catId==='ubnd-gddt' && currentXaId==null)))){ toast(`${cat.name} hiện chưa có chỉ tiêu được giao.`); return; }
 const singleItem=(typeof itemIndex==='number')?cat.items[itemIndex]:null;
 const total=singleItem?(Number(singleItem[1])||0):catTotal(cat);
 document.getElementById('drawerTitle').textContent=`Lĩnh vực: ${cat.name}${singleItem?` — ${singleItem[0]}`:''}`;
 document.getElementById('drawerSub').textContent=singleItem?`Chỉ tiêu: ${singleItem[0]} · ${fmt(total)} bản ghi`:`${cat.items.length} chỉ tiêu · ${fmt(total)} bản ghi`;
 const head='';
 let cardsHtml;
 if(catId==='dang-vptu'){
 cardsHtml=`<div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${vptuBoxHtml(0)}${vptuBoxHtml(1)}${vptuBoxHtml(2)}${vptuBoxHtml(3)}</div>
 </div>`;
 } else if(catId==='ubnd-gddt' && currentXaId==null){
 const gdBody=(singleItem&&GD_SECTION_BUILDERS[itemIndex])?GD_SECTION_BUILDERS[itemIndex]():gdRealBoxesHtml();
 cardsHtml=`<div>${gdKpiTilesHtml()}${gdBody}</div>`;
 } else if(CUSTOM_CAT_ITEM_BUILDERS[catId]){
 const builders=CUSTOM_CAT_ITEM_BUILDERS[catId];
 const renderItem=(idx,it)=>builders[idx]?builders[idx]():catItemCardHtml(role,catId,idx,it);
 cardsHtml=singleItem
 ? `<div class="cat-item-list">${renderItem(itemIndex,singleItem)}</div>`
 : `<div style="display:grid;gap:14px">${cat.items.map((it,idx)=>renderItem(idx,it)).join('')}</div>`;
 } else if(cat.noItems){
 cardsHtml=`<div class="access-lock" style="text-align:center;padding:24px 12px"><i class="ti ti-info-circle" style="font-size:20px;color:var(--text-muted)" aria-hidden="true"></i><p style="margin:8px 0 0;color:var(--text-secondary);font-size:13px">Không có chỉ tiêu được giao.</p></div>`;
 } else {
 const itemList=singleItem?[[itemIndex,singleItem]]:cat.items.map((it,idx)=>[idx,it]);
 cardsHtml=`<div class="cat-item-list">${itemList.map(([idx,it])=>catItemCardHtml(role,catId,idx,it)).join('')}</div>`;
 }
 const twoCol=`<div class="cat-two-col">${cardsHtml}${genUnitTableHtml(cat)}</div>`;
 document.getElementById('drawerBody').innerHTML=head+twoCol+fieldScenarioSummary(`cat::${role}::${catId}`);
 openDrawer();
 document.getElementById('drawerHeadActions').innerHTML=`<div style="display:flex;gap:10px"><button class="ghost" onclick="exportCategoryToExcel('${role}','${catId}')" style="height:36px;min-width:130px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap">⬇ Xuất Excel</button><button class="primary" onclick="openIndicatorEntrySystem()" style="height:36px;min-width:130px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap">＋ Nhập chỉ tiêu</button></div>`;
 flushPendingDimCharts();
 syncGenUnitBoxHeight();
 if(catId==='ubnd-nnmt'){if(typeof initNmCharts==='function') initNmCharts(); initNnmtGpmbChart();initNnmtDatDaiChart();}
 if(catId==='ubnd-noivu'){if(typeof initSnvCharts==='function') initSnvCharts(); initNoivuAnSinhChart();initNoivuCcvcChart();}
 if(catId==='ubnd-taichinh') initTaichinhCharts();
 if(catId==='ubnd-gddt') initGdRealCharts();
 if(catId==='ubnd-vhtt' && typeof initVhttCharts==='function') initVhttCharts();
 if(catId==='ubnd-vpubnd' && typeof initVpubCharts==='function') initVpubCharts();
 if(catId==='ubnd-bqlkcnc' && typeof initBqlCharts==='function') initBqlCharts();
 if((catId==='ubnd-dulich' || (catId==='ubnd-vhtt' && typeof UBND_SAP_XEP_SO_2026!=='undefined' && UBND_SAP_XEP_SO_2026)) && typeof initDlCharts==='function') initDlCharts();
 if(catId==='ubnd-dantoc-tongiao' && typeof initDttgCharts==='function') initDttgCharts();
 if(catId==='ubnd-thanhtra' && typeof initTtraCharts==='function') initTtraCharts();
 if(catId==='ubnd-khcn' && typeof initKhcnCharts==='function') initKhcnCharts();
 if(catId==='ubnd-yte' && typeof initSytCharts==='function') initSytCharts();
 if(catId==='ubnd-congthuong' && typeof initSctCharts==='function') initSctCharts();
 if(catId==='ubnd-xaydung' && typeof initSxdCharts==='function') initSxdCharts();
 if(catId==='dang-ubkt') initUbktDoanChart();
 if(catId==='dang-to-chuc'){initTochucBienCheChart();initTochucDanhGiaChart();initTochucBienDongChart();initTochucCoCauChart();}
 if(catId==='dang-noi-chinh'){initNoichinhVanBanChart();initNoichinhChayNoChart();initNoichinhKhieuNaiChart();}
 if(catId==='dang-tuyen-giao'){initTuyengiaoDuLuanChart();initTuyengiaoDanVanChart();}
 if(catId==='dang-vptu') initVptuCharts();
 }

