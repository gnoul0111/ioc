 /* ============================== CHI TIẾT 1 BẢN GHI CHỈ TIÊU (cấp 2) ============================== */
 function openIndicatorDetail(id){
 const r=indicatorRecords.find(x=>x.id===id); if(!r)return;
 const st=indicatorStatusMeta(r.status);
 document.getElementById('modalTitle').textContent=`Cấp 2 · ${r.id}`;
 document.getElementById('modalSub').textContent=`Chỉ tiêu · ${roleMeta(r.role).name} · ${r.indicator}`;
 let body=`<div class="detail-grid"><div class="detail-card"><h4>Thông tin chỉ tiêu</h4><div class="kv"><b>Tên chỉ tiêu</b><span>${r.indicator}</span><b>Trục</b><span>${roleMeta(r.role).icon} ${roleMeta(r.role).name}</span><b>Đơn vị cập nhật</b><span>${r.unit}</span><b>Nguồn dữ liệu</b><span>${r.source}</span><b>Tần suất</b><span>${r.freq}</span><b>Trạng thái</b><span>${pillHtml(st)}</span><b>Tiến độ</b><span>${progressBarHtml(r.progress)}<b class="mono">${r.progress}%</b></span></div></div><div class="detail-card"><h4>Nội dung theo dõi</h4><p>${r.description}</p><div class="action-bar"><button class="primary" onclick="openIndicatorEntrySystem()">＋ Nhập chỉ tiêu</button><button class="primary" onclick="openIndicatorScenarioSelector('${id}')">Giao nhiệm vụ từ chỉ tiêu</button><button class="ghost" onclick="toast('Đã yêu cầu cập nhật số liệu chỉ tiêu ${r.id}')">Yêu cầu cập nhật dữ liệu</button><button class="ghost" onclick="toast('Đã tạo cảnh báo cho chỉ tiêu ${r.id}')">Tạo cảnh báo</button></div></div></div><div class="detail-card"><h4>Nhật ký chỉ tiêu</h4>${r.history.map(h=>`<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join('')}</div>`;
 if(r.role==='HDND' && /kiến nghị cử tri|ý kiến liên quan/i.test(r.indicator)){
 const total=87, done=42, doing=31, pending=14;
 body+=`<div class="detail-card"><h4>Tổng hợp ý kiến liên quan đến kiến nghị cử tri</h4><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(total)}</b><span>Tổng số ý kiến liên quan</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Đã xử lý/trả lời</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(pending)}</b><span>Chưa xử lý/cần giám sát</span></div></div><table class="compact-table"><thead><tr><th>Nhóm nội dung</th><th>Số ý kiến</th><th>Đã xử lý</th><th>Đang xử lý</th><th>Chưa xử lý</th></tr></thead><tbody><tr><td>Đất đai, GPMB</td><td>24</td><td>11</td><td>9</td><td>4</td></tr><tr><td>Giao thông, đô thị</td><td>21</td><td>10</td><td>7</td><td>4</td></tr><tr><td>An sinh, chính sách</td><td>18</td><td>9</td><td>6</td><td>3</td></tr><tr><td>Môi trường, trật tự</td><td>15</td><td>8</td><td>5</td><td>2</td></tr><tr><td>Hành chính công</td><td>9</td><td>4</td><td>4</td><td>1</td></tr></tbody></table><div class="action-bar"><button class="primary" onclick="openIndicator('HDND', indicators.HDND.findIndex(x=>x[0]==='Tổng số ý kiến liên quan đến kiến nghị cử tri'))">Mở danh sách 87 ý kiến</button><button class="ghost" onclick="openAssignmentForm()">Giao nhiệm vụ xử lý kiến nghị</button></div></div>`;
 }
 body+=indicatorScenarioSummary(r);
 document.getElementById('modalBody').innerHTML=body;
 openModal();
 }

 /* --- Kịch bản xử lý từ chỉ tiêu (dùng chung helper với hồ sơ) --- */
 function indicatorSubtasksStore(id){window.__indicatorScenarioSubtasks=window.__indicatorScenarioSubtasks||{};window.__indicatorScenarioSubtasks[id]=window.__indicatorScenarioSubtasks[id]||[];return window.__indicatorScenarioSubtasks[id]}
 function indicatorSelectedScenario(id){window.__indicatorSelectedScenario=window.__indicatorSelectedScenario||{};return window.__indicatorSelectedScenario[id]||''}
 function setIndicatorSelectedScenario(id,key){window.__indicatorSelectedScenario=window.__indicatorSelectedScenario||{};window.__indicatorSelectedScenario[id]=key}
 function indicatorScenarioSummary(ind){
 const subs=indicatorSubtasksStore(ind.id);
 const done=subs.filter(s=>(s.state||'').toLowerCase().includes('hoàn')).length;
 const doing=subs.filter(s=>(s.state||'').toLowerCase().includes('đang')).length;
 const soon=subs.filter(s=>(s.state||'').toLowerCase().includes('sắp')).length;
 const scen=indicatorSelectedScenario(ind.id)?scenarioTemplates()[indicatorSelectedScenario(ind.id)]:null;
 const subOrder=subs.map((s,i)=>i).sort((a,b)=>parseDMY(subs[b].due)-parseDMY(subs[a].due));
 const rows=subOrder.map(i=>{const s=subs[i]; return `<tr class="clickable" onclick="openIndicatorSubTaskDetail('${ind.id}',${i})"><td>${s.id||('CTN-'+String(i+1).padStart(2,'0'))}</td><td class="subtask-scenario-col">${s.scenario?scenarioTemplates()[s.scenario]?.title||s.scenario:'Giao thường'}</td><td class="subtask-name-col">${s.name||'Việc nhánh'}</td><td class="subtask-content-col">${s.content||s.name||'--'}</td><td>${s.owner||'--'}</td><td>${s.due||'--'}</td><td>${Number(s.progress??35)}%</td><td><span class="badge ${s.state&&s.state.includes('Hoàn')?'ok':s.state&&s.state.includes('Sắp')?'warn':''}">${s.state||'Đang xử lý'}</span></td></tr>`}).join('');
 return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><div><h4>Kịch bản xử lý &amp; nhiệm vụ nhánh từ chỉ tiêu</h4><p>Chọn kịch bản → tạo nhiệm vụ nhánh liên quan → có thể thêm mới kịch bản hoặc nhiệm vụ nhánh.</p></div><div class="scenario-actions"><button class="primary" onclick="openIndicatorScenarioSelector('${ind.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('indicator','${ind.id}')">＋ Thêm kịch bản</button></div></div>${scen?`<div class="scenario-applied"><b>Kịch bản đang áp dụng:</b> ${scen.title} · ${scen.desc}</div>`:''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length?`<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="subtask-empty">Chưa có nhiệm vụ nhánh từ chỉ tiêu này. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống quá hạn/chậm tiến độ/thiếu dữ liệu.</div>`}</section>`;
 }
 function openIndicatorScenarioSelector(id){
 if(guardAction('chọn kịch bản xử lý'))return;
 const ind=indicatorRecords.find(x=>x.id===id); if(!ind)return;
 const allKeys=indicatorScenarioKeys(ind).filter(k=>scenarioTemplates()[k]&&!isScenarioArchived(k)); const st=indicatorStatusMeta(ind.status);
 const fieldLabel=indicatorFieldLabel(ind); const mode=scenarioFieldFilterModeFor('indicator:'+id);
 const keys=filterScenarioKeysByField(allKeys,fieldLabel,mode);
 document.getElementById('modalTitle').textContent='Chọn kịch bản xử lý từ chỉ tiêu';
 document.getElementById('modalSub').textContent=`${ind.id} · ${ind.indicator}`;
 document.getElementById('modalBody').innerHTML=`<div class="scenario-history-badge"><b>Trạng thái chỉ tiêu:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${ind.progress}% · Nguồn ${ind.source} · Tần suất ${ind.freq}. Chọn kịch bản để tạo nhiệm vụ nhánh.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('indicator','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openIndicatorDetail('${id}')">Quay lại chi tiết chỉ tiêu</button></div>${scenarioFieldFilterBarHtml('indicator',id,fieldLabel,mode)}<div class="scenario-grid">${keys.length?keys.map(k=>scenarioCardHtml('indicator',id,k)).join(''):'<div class="subtask-empty">Không có kịch bản phù hợp với bộ lọc lĩnh vực hiện tại.</div>'}</div>`;
 openModal();
 }
 function selectIndicatorScenario(id,key){
 const ind=indicatorRecords.find(x=>x.id===id); if(!ind||!scenarioTemplates()[key])return; setIndicatorSelectedScenario(id,key);
 document.getElementById('modalTitle').textContent=`${scenarioTemplates()[key].title} · ${ind.id}`;
 document.getElementById('modalSub').textContent='Chọn nhiệm vụ nhánh';
 document.getElementById('modalBody').innerHTML=scenarioDetailHtml('indicator',id,key,ind,indicatorScenarioSummary);
 openModal();
 }
 function applyIndicatorScenarioTasks(id,key){
 if(guardAction('tạo nhiệm vụ nhánh theo kịch bản'))return;
 const ind=indicatorRecords.find(x=>x.id===id); const s=scenarioTemplates()[key]; if(!ind||!s)return;
 const checked=[...document.querySelectorAll('[data-scenario-task]:checked')].map(x=>Number(x.dataset.scenarioTask));
 if(!checked.length){toast('Chưa chọn nhiệm vụ nhánh nào.');return;}
 const subs=indicatorSubtasksStore(id);
 checked.forEach(idx=>{const t=s.tasks[idx]; const dup=subs.some(x=>x.name===t[0]&&x.scenario===key); if(!dup){subs.push({id:`${id}-N${String(subs.length+1).padStart(2,'0')}`,name:t[0],content:t[1],owner:t[2],coordinators:t[3]||[],state:'Đang xử lý',startDate:t[6]||'',due:t[7]||dueDate(idx,key==='overdue'?'soon':'doing'),priority:t[4]||((s.level==='Khẩn'||s.level==='Cao')?'Cao':'Bình thường'),urgency:t[5]||'Thường',progress:10,scenario:key,created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId});
 const subIdx=subs.length-1;
 pushNoti({role:ind.role,soId:resolveSoIdByUnitName(t[2]),category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${t[0]}`,sub:`Theo kịch bản "${s.title}", giao cho ${t[2]}, thuộc chỉ tiêu ${ind.indicator}.`,level:s.level==='Khẩn'?'Khẩn':'Cao',target:{type:'indicatorSubtask',id,idx:subIdx}});
 }});
 setIndicatorSelectedScenario(id,key);
 toast(`Đã tạo ${checked.length} nhiệm vụ nhánh từ chỉ tiêu theo kịch bản.`); openIndicatorDetail(id);
 }
 function openIndicatorSubTaskDetail(indId,idx){
 const ind=indicatorRecords.find(x=>x.id===indId); const s=indicatorSubtasksStore(indId)[idx]; if(!ind||!s)return;
 document.getElementById('modalTitle').textContent=`Chi tiết nhiệm vụ nhánh từ chỉ tiêu · ${s.id}`;
 document.getElementById('modalSub').textContent=`Gắn với ${ind.id} · ${ind.indicator}`;
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="openIndicatorDetail('${indId}')">← Quay lại chỉ tiêu</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id}</span><b>Kịch bản</b><span>${s.scenario?scenarioTemplates()[s.scenario]?.title:'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name}</span><b>Nội dung</b><span>${s.content}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p>${subtaskProgressHtml(s.state,s.progress??30)}<div class="action-bar" style="margin-top:10px">${subtaskSyncButtonHtml(s.state,`simulateIndicatorSubtaskSync('${indId}',${idx})`)}${subtaskActionButtonsHtml(s)}</div></div></div>${indicatorScenarioSummary(ind)}`;
 openModal();
 }

 /* --- Kịch bản xử lý từ lĩnh vực/chỉ tiêu (dùng chung helper với hồ sơ/chỉ tiêu con) --- */
 function fieldSubtasksStore(fid){window.__fieldScenarioSubtasks=window.__fieldScenarioSubtasks||{};window.__fieldScenarioSubtasks[fid]=window.__fieldScenarioSubtasks[fid]||[];return window.__fieldScenarioSubtasks[fid]}
 function fieldSelectedScenario(fid){window.__fieldSelectedScenario=window.__fieldSelectedScenario||{};return window.__fieldSelectedScenario[fid]||''}
 function setFieldSelectedScenario(fid,key){window.__fieldSelectedScenario=window.__fieldSelectedScenario||{};window.__fieldSelectedScenario[fid]=key}
 function openFieldSource(fid){
 closeModal();
 const t=fieldTarget(fid); if(!t.cat)return;
 if(t.scope==='item') openCategoryItemDetail(t.role,t.catId,t.idx);
 else openCategoryDetail(t.role,t.catId);
 }
 function fieldLinkedRecords(fid){return records.filter(r=>r.linkedFieldId===fid);}
 function fieldScenarioSummary(fid){
 const t=fieldTarget(fid); if(!t.cat) return '';
 const subs=fieldSubtasksStore(fid);
 const linked=fieldLinkedRecords(fid);
 const subDone=subs.filter(s=>(s.state||'').toLowerCase().includes('hoàn')).length;
 const subDoing=subs.filter(s=>(s.state||'').toLowerCase().includes('đang')).length;
 const subSoon=subs.filter(s=>(s.state||'').toLowerCase().includes('sắp')).length;
 const recDone=linked.filter(r=>r.status==='done'||r.status==='closed').length;
 const recDoing=linked.filter(r=>r.status==='new'||r.status==='doing'||r.status==='pending').length;
 const recSoon=linked.filter(r=>r.status==='extend').length;
 const done=subDone+recDone, doing=subDoing+recDoing, soon=subSoon+recSoon;
 const total=subs.length+linked.length;
 const scen=fieldSelectedScenario(fid)?scenarioTemplates()[fieldSelectedScenario(fid)]:null;
 const subOrder=subs.map((s,i)=>i).sort((a,b)=>parseDMY(subs[b].due)-parseDMY(subs[a].due));
 const subRows=subOrder.map(i=>{const s=subs[i]; return `<tr class="clickable" onclick="openFieldSubTaskDetail('${fid}',${i})"><td></td><td>${s.id||('NV-'+String(i+1).padStart(2,'0'))}</td><td class="subtask-scenario-col">${s.scenario?scenarioTemplates()[s.scenario]?.title||s.scenario:'Giao thường'}</td><td class="subtask-name-col">${s.name||'Việc cần làm'}</td><td class="subtask-content-col">${s.content||s.name||'--'}</td><td>${s.owner||'--'}</td><td>${s.due||'--'}</td><td>${Number(s.progress??35)}%</td><td><span class="badge ${s.state&&s.state.includes('Hoàn')?'ok':s.state&&s.state.includes('Sắp')?'warn':''}">${s.state||'Đang xử lý'}</span></td><td></td></tr>`}).join('');
 const linkedSorted=linked.slice().sort((a,b)=>parseDMY(b.due)-parseDMY(a.due));
 const linkedRows=linkedSorted.map(r=>{
 const st=statusMeta(r.status); const scenTitle=r.selectedScenario?(scenarioTemplates()[r.selectedScenario]?.title||r.selectedScenario):'Giao thường';
 return `<tr class="clickable" data-task-id="${r.id}" onclick="toggleFieldTaskNode(this,'${r.id}','${fid}')"><td class="tc"><span class="tree-toggle">▸</span></td><td class="mono">${r.id}</td><td class="subtask-scenario-col">${scenTitle}</td><td class="subtask-name-col">${r.title}</td><td class="subtask-content-col">${r.description||r.title}</td><td>${r.unit||'--'}</td><td>${r.due||'--'}</td><td>${Number(r.progress??0)}%</td><td><span class="badge" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></td><td class="tc"><button type="button" title="Xem chi tiết nhiệm vụ" onclick="event.stopPropagation();openTaskDetailFromField('${r.id}','${fid}')" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">→</button></td></tr><tr class="task-children-row hidden" data-task-children="${r.id}"><td colspan="10"></td></tr>`;
 }).join('');
 const rows=subRows+linkedRows;
 return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><h4>Nhiệm vụ đã giao</h4><div class="scenario-actions"><button class="primary" onclick="openAssignmentFromField('${fid}')">Thêm nhiệm vụ</button></div></div>${scen?`<div class="scenario-applied"><b>${scen.title}</b></div>`:''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(total)}</b><span>Tổng nhiệm vụ</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${total?`<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhiệm vụ</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="subtask-empty">Chưa có nhiệm vụ nào được giao.</div>`}</section>`;
 }
 function openFieldScenarioSelector(fid){
 if(guardAction('chọn kịch bản xử lý'))return;
 const t=fieldTarget(fid); if(!t.cat){toast('Không tìm thấy lĩnh vực/chỉ tiêu.');return}
 const allKeys=fieldScenarioKeys(fid).filter(k=>scenarioTemplates()[k]&&!isScenarioArchived(k));
 const fieldLabel=t.cat.field||null; const mode=scenarioFieldFilterModeFor('field:'+fid);
 const keys=filterScenarioKeysByField(allKeys,fieldLabel,mode);
 document.getElementById('modalTitle').textContent='Chọn kịch bản xử lý theo '+(t.scope==='item'?'chỉ tiêu':'lĩnh vực');
 document.getElementById('modalSub').textContent=`${roleMeta(t.role).name} · ${t.label}`;
 document.getElementById('modalBody').innerHTML=`<div class="scenario-history-badge"><b>${t.scope==='item'?'Chỉ tiêu':'Lĩnh vực'}:</b> ${esc(t.label)}. Chọn kịch bản để tạo nhiệm vụ nhánh.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('field','${fid}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="openFieldSource('${fid}')">Quay lại ${t.scope==='item'?'chỉ tiêu':'lĩnh vực'}</button></div>${scenarioFieldFilterBarHtml('field',fid,fieldLabel,mode)}<div class="scenario-grid">${keys.length?keys.map(k=>scenarioCardHtml('field',fid,k)).join(''):'<div class="subtask-empty">Không có kịch bản phù hợp với bộ lọc lĩnh vực hiện tại.</div>'}</div>`;
 openModal();
 }
 function selectFieldScenario(fid,key){
 const t=fieldTarget(fid); if(!t.cat||!scenarioTemplates()[key])return; setFieldSelectedScenario(fid,key);
 document.getElementById('modalTitle').textContent=`${scenarioTemplates()[key].title} · ${t.label}`;
 document.getElementById('modalSub').textContent='Chọn nhiệm vụ nhánh';
 document.getElementById('modalBody').innerHTML=scenarioDetailHtml('field',fid,key,null,null);
 openModal();
 }
 function applyFieldScenarioTasks(fid,key){
 if(guardAction('tạo nhiệm vụ nhánh theo kịch bản'))return;
 const t=fieldTarget(fid); const s=scenarioTemplates()[key]; if(!t.cat||!s)return;
 const checked=[...document.querySelectorAll('[data-scenario-task]:checked')].map(x=>Number(x.dataset.scenarioTask));
 if(!checked.length){toast('Chưa chọn nhiệm vụ nhánh nào.');return;}
 const subs=fieldSubtasksStore(fid);
 checked.forEach(idx=>{const tk=s.tasks[idx]; const dup=subs.some(x=>x.name===tk[0]&&x.scenario===key); if(!dup){subs.push({id:`NV-${fid.replace(/::/g,'-')}-${String(subs.length+1).padStart(2,'0')}`,name:tk[0],content:tk[1],owner:tk[2],coordinators:tk[3]||[],state:'Đang xử lý',startDate:tk[6]||'',due:tk[7]||dueDate(idx,key==='overdue'?'soon':'doing'),priority:tk[4]||((s.level==='Khẩn'||s.level==='Cao')?'Cao':'Bình thường'),urgency:tk[5]||'Thường',progress:10,scenario:key,created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId});
 const subIdx=subs.length-1;
 pushNoti({role:t.role,soId:resolveSoIdByUnitName(tk[2]),category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${tk[0]}`,sub:`Theo kịch bản "${s.title}", giao cho ${tk[2]}, thuộc ${t.label}.`,level:s.level==='Khẩn'?'Khẩn':'Cao',target:{type:'fieldSubtask',id:fid,idx:subIdx}});
 }});
 setFieldSelectedScenario(fid,key);
 toast(`Đã tạo ${checked.length} nhiệm vụ theo ${t.scope==='item'?'chỉ tiêu':'lĩnh vực'}.`); openFieldSource(fid);
 }
 function openFieldSubTaskDetail(fid,idx){
 const t=fieldTarget(fid); const s=fieldSubtasksStore(fid)[idx]; if(!t.cat||!s)return;
 document.getElementById('modalTitle').textContent=`Chi tiết nhiệm vụ · ${s.id}`;
 document.getElementById('modalSub').textContent=`Gắn với ${roleMeta(t.role).name} · ${t.label}`;
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${fid}')">← Quay lại ${t.scope==='item'?'chỉ tiêu':'lĩnh vực'}</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ</h4><div class="kv"><b>Mã nhiệm vụ</b><span>${s.id}</span><b>Kịch bản</b><span>${s.scenario?scenarioTemplates()[s.scenario]?.title:'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name}</span><b>Nội dung</b><span>${s.content}</span><b>Đơn vị nhận</b><span>${s.owner}</span><b>Hạn xử lý</b><span>${s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p>${subtaskProgressHtml(s.state,s.progress??30)}<div class="action-bar" style="margin-top:10px">${subtaskSyncButtonHtml(s.state,`simulateFieldSubtaskSync('${fid}',${idx})`)}${subtaskActionButtonsHtml(s)}</div></div></div>${fieldScenarioSummary(fid)}`;
 openModal();
 }

