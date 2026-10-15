 /* ============================== CÂY NHIỆM VỤ CỦA 1 VĂN BẢN ============================== */
 function openAssignmentFromDocument(docId){
 const doc=records.find(x=>x.id===docId);
 window.__assignmentReturnDocId=docId;
 openAssignmentForm(doc?doc.metric:'doc');
 if(doc){ window.__selectedDocs=[doc]; renderSelectedDocsList(); }
 }
 function linkedTasksTreeHtml(doc){
 const tasks=records.filter(t=>(t.metric==='assigned'||t.metric==='received')&&t.linkedDocIds?.includes(doc.id));
 if(!tasks.length) return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này</h4></div><div class="subtask-empty">Chưa có nhiệm vụ nào được giao từ văn bản này. Dùng nút "＋ Giao nhiệm vụ từ văn bản này" ở trên để tạo nhiệm vụ đầu tiên.</div></div>`;
 const rows=tasks.map(t=>{
 const st=statusMeta(t.status);
 return `<tr class="clickable" data-task-id="${t.id}" onclick="toggleTaskNode(this,'${t.id}','${doc.id}')"><td class="tc"><span class="tree-toggle">▸</span></td><td class="mono">${t.id}</td><td class="subtask-name-col">${t.title}</td><td>${metricMeta[t.metric].short}</td><td>${t.unit||''}</td><td>${t.due}</td><td><div class="progress" style="width:76px"><i style="width:${t.progress}%"></i></div></td><td><span class="badge" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></td><td class="tc"><button type="button" title="Xem chi tiết nhiệm vụ" onclick="event.stopPropagation();openTaskDetailFromDocument('${t.id}','${doc.id}')" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">→</button></td></tr><tr class="task-children-row hidden" data-task-children="${t.id}"><td colspan="9"></td></tr>`;
 }).join('');
 return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này (${fmt(tasks.length)})</h4>${approveButtonHtml(tasks.some(t=>t.status==='pending'))}</div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhiệm vụ</th><th>Tiêu đề</th><th>Loại</th><th>Đơn vị</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 }
 /* Xem nhanh (rút gọn) khi mở 1 nhiệm vụ trong cây: tách rõ 2 phần — kịch bản đang áp dụng, và danh sách nhiệm vụ con (chỉ nội dung chính). Bấm vào 1 nhiệm vụ con mới mở chi tiết đầy đủ. */
 function taskInlineSummaryHtml(task){
 const subs=task.subtasks||[];
 const groups=groupSubtasksByScenario(subs);
 const groupsHtml=groups.length?groups.map(g=>{
 const rows=g.items.map(({s,i})=>{
 const done=(s.state||'').toLowerCase().includes('hoàn'), soon=(s.state||'').toLowerCase().includes('sắp');
 const stColor=done?'#2fb174':soon?'#d8a50c':'#2c7dd2';
 return `<button type="button" class="task-subtask-mini-row" onclick="openSubTaskDetail('${task.id}',${i})">
 <span class="task-subtask-mini-name" title="${s.name||''}">${s.name||'Việc nhánh'}</span>
 <span class="task-subtask-mini-owner">${s.owner||''}</span>
 <span class="badge" style="background:${stColor}22;color:${stColor};border:1px solid ${stColor}66">${s.state||'Đang xử lý'}</span>
 <span class="mono task-subtask-mini-pct">${s.progress??0}%</span>
 </button>`;
 }).join('');
 return `<div class="task-scenario-group">
 <div class="task-scenario-heading"> ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div>
 <div class="task-subtask-mini-list">${rows}</div>
 </div>`;
 }).join(''):'<div class="subtask-empty">Chưa có nhiệm vụ con nào.</div>';
 return `<div class="task-inline-summary">
 <div class="task-scenario-groups">${groupsHtml}</div>
 <div class="action-bar"><button class="primary" onclick="openScenarioSelector('${task.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openSubTaskForm('${task.id}')">＋ Giao nhiệm vụ nhánh</button></div>
 </div>`;
 }
 function toggleTaskNode(rowEl,taskId,docId){
 if(docId) window.__scenarioReturnDocId=docId;
 const childRow=rowEl.nextElementSibling; if(!childRow) return;
 const cell=childRow.querySelector('td');
 const willOpen=childRow.classList.contains('hidden');
 const toggle=rowEl.querySelector('.tree-toggle');
 if(willOpen){
 const task=records.find(x=>x.id===taskId);
 cell.innerHTML=task?taskInlineSummaryHtml(task):'';
 childRow.classList.remove('hidden');
 if(toggle) toggle.textContent='▾';
 } else {
 childRow.classList.add('hidden'); cell.innerHTML='';
 if(toggle) toggle.textContent='▸';
 }
 }
 /* Xem chi tiết đầy đủ 1 nhiệm vụ từ trong cây của văn bản — dùng lại popup hiện có, kèm nút quay lại đúng văn bản. */
 function openTaskDetailFromDocument(taskId,docId){
 openRecordDetail(taskId);
 window.__scenarioReturnDocId=docId;
 setTimeout(()=>{
 const body=document.getElementById('modalBody');
 if(body && !body.querySelector('.iip-modal-back')){
 body.insertAdjacentHTML('afterbegin',`<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${docId}')">← Quay lại văn bản</button></div>`);
 }
 },0);
 }
 /* Mở rộng/thu gọn 1 nhiệm vụ cha ngay trong bảng "Nhiệm vụ đã giao" của lĩnh vực — cùng cơ chế cây với văn bản. */
 function toggleFieldTaskNode(rowEl,taskId,fid){
 if(fid) window.__scenarioReturnFieldId=fid;
 const childRow=rowEl.nextElementSibling; if(!childRow) return;
 const cell=childRow.querySelector('td');
 const willOpen=childRow.classList.contains('hidden');
 const toggle=rowEl.querySelector('.tree-toggle');
 if(willOpen){
 const task=records.find(x=>x.id===taskId);
 cell.innerHTML=task?taskInlineSummaryHtml(task):'';
 childRow.classList.remove('hidden');
 if(toggle) toggle.textContent='▾';
 } else {
 childRow.classList.add('hidden'); cell.innerHTML='';
 if(toggle) toggle.textContent='▸';
 }
 }
 /* Xem chi tiết đầy đủ 1 nhiệm vụ từ trong cây của lĩnh vực — dùng lại popup hiện có, kèm nút quay lại đúng lĩnh vực. */
 function openTaskDetailFromField(taskId,fid){
 openRecordDetail(taskId,null,fid);
 window.__scenarioReturnFieldId=fid;
 }
 /* Sau khi tạo/xong luồng kịch bản xử lý: nếu đang thao tác từ trong cây của 1 văn bản hoặc 1 lĩnh vực thì quay lại đúng chỗ đó (giữ nguyên nhiệm vụ đang mở), ngược lại về trang nhiệm vụ độc lập như cũ. */
 function returnFromScenario(taskId){
 const docId=window.__scenarioReturnDocId;
 const fieldId=window.__scenarioReturnFieldId;
 const backId=window.__recordBackId||undefined, backFieldId=window.__recordBackFieldId||undefined;
 if(docId && records.some(x=>x.id===docId)){
 openRecordDetail(docId,backId,backFieldId);
 setTimeout(()=>{
 const row=document.querySelector(`.linked-tasks-card tr.clickable[data-task-id="${taskId}"]`);
 if(row) toggleTaskNode(row,taskId,docId);
 },0);
 } else if(fieldId){
 openFieldSource(fieldId);
 setTimeout(()=>{
 const row=document.querySelector(`.indicator-scenario-panel tr.clickable[data-task-id="${taskId}"]`);
 if(row) toggleFieldTaskNode(row,taskId,fieldId);
 },0);
 } else {
 openRecordDetail(taskId,backId,backFieldId);
 }
 }

