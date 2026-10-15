 /* ============================== KỊCH BẢN XỬ LÝ (dùng chung hồ sơ + chỉ tiêu) ============================== */
 const CUSTOM_SCENARIO_KEY='px-ioc-custom-scenarios-v15';
 function loadCustomScenarios(){try{return JSON.parse(localStorage.getItem(CUSTOM_SCENARIO_KEY)||'{}')}catch(e){return {}}}
 function saveCustomScenarios(obj){localStorage.setItem(CUSTOM_SCENARIO_KEY,JSON.stringify(obj||{}))}
 function scenarioTemplates(){return Object.assign({},DEFAULT_SCENARIOS,loadCustomScenarios())}
 /* Kịch bản đã có nhiệm vụ nhánh sinh ra từ nó (record/chỉ tiêu/lĩnh vực) -> khoá Sửa, và Xoá chỉ được phép ẩn (archive) chứ không xoá cứng, để các nhiệm vụ nhánh cũ vẫn tra được tên kịch bản. */
 function isScenarioInUse(key){
 if(!key) return false;
 if(records.some(r=>(r.subtasks||[]).some(s=>s.scenario===key))) return true;
 const indStore=window.__indicatorScenarioSubtasks||{};
 if(Object.values(indStore).some(list=>(list||[]).some(s=>s.scenario===key))) return true;
 const fieldStore=window.__fieldScenarioSubtasks||{};
 if(Object.values(fieldStore).some(list=>(list||[]).some(s=>s.scenario===key))) return true;
 const vptuStore=window.__vptuSubtasks||{};
 if(Object.values(vptuStore).some(list=>(list||[]).some(s=>s.scenario===key))) return true;
 return false;
 }
 function isScenarioArchived(key){const c=loadCustomScenarios();return !!(c[key]&&c[key].archived)}
 function indicatorScenarioKeys(r){const arr=[]; if(r.status==='overdue')arr.push('overdue'); if(['risk','soon'].includes(r.status)||Number(r.progress||0)<70)arr.push('slow'); arr.push('data'); if(/cử tri|kiến nghị/i.test(r.indicator||r.title||''))arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)]}
 function recordScenarioKeys(r){const arr=[]; if(r.status==='revoked'||r.status==='overdue')arr.push('overdue'); if(['extend','pending','dueSoon'].includes(r.status)||Number(r.progress||0)<70)arr.push('slow'); if(r.metric==='indicator'||/dữ liệu|chỉ tiêu|bản ghi/i.test(r.title||''))arr.push('data'); if(/cử tri|kiến nghị/i.test(r.field||r.title||''))arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)]}
 function fieldTarget(fid){
 const parts=String(fid||'').split('::');
 if(parts[0]==='item'){
 const [,role,catId,idxStr]=parts; const idx=Number(idxStr);
 const cat=categorySeedForRole(role).find(c=>c.id===catId); const it=cat?cat.items[idx]:null;
 return {scope:'item',role,catId,idx,cat,label:it?it[0]:'Chỉ tiêu con'};
 }
 const [,role,catId]=parts; const cat=categorySeedForRole(role).find(c=>c.id===catId);
 return {scope:'cat',role,catId,cat,label:cat?cat.name:'Lĩnh vực'};
 }
 function fieldScenarioKeys(fid){
 const t=fieldTarget(fid); const arr=['data','coordinate'];
 if(t.scope==='cat' && categoryDataIssues[t.catId]) arr.unshift('overdue');
 if(/cử tri|kiến nghị/i.test(t.label||'')) arr.push('citizen');
 arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)];
 }
 /* Lĩnh vực áp dụng của kịch bản: gộp toàn bộ lĩnh vực nhiệm vụ (fieldPool) + lĩnh vực chỉ tiêu/category (categorySeed). Kịch bản không gán fields = áp dụng mọi lĩnh vực (5 kịch bản mặc định đều như vậy để không phá vỡ gợi ý hiện có). */
 function scenarioFieldOptions(){
 const set=new Set();
 Object.values(fieldPool).forEach(arr=>arr.forEach(f=>set.add(f)));
 Object.values(categorySeed).forEach(cats=>cats.forEach(c=>{if(c.field) set.add(c.field);}));
 return [...set].sort((a,b)=>a.localeCompare(b,'vi'));
 }
 function scenarioFieldMatches(s,label){
 if(!s.fields||!s.fields.length) return true;
 if(!label) return false;
 return s.fields.some(f=>f.toLowerCase()===String(label).toLowerCase());
 }
 function filterScenarioKeysByField(keys,label,mode){
 if(mode==='all'||!label) return keys;
 return keys.filter(k=>{const s=scenarioTemplates()[k]; if(!s)return false; const match=scenarioFieldMatches(s,label); return mode==='other'?!match:match;});
 }
 /* Tra ngược lĩnh vực của 1 chỉ tiêu qua categorySeed (chỉ tiêu không có sẵn trường lĩnh vực như nhiệm vụ). Không tìm thấy -> trả null, bộ lọc coi như "chưa xác định" và không ẩn kịch bản. */
 function indicatorFieldLabel(ind){
 if(!ind) return null;
 const cat=(categorySeed[ind.role]||[]).find(c=>(c.items||[]).some(it=>it[0]===ind.indicator));
 return (cat&&cat.field)?cat.field:null;
 }
 function scenarioFieldFilterModeFor(filterKey){
 if(window.__scenarioFieldFilterKey!==filterKey){window.__scenarioFieldFilterKey=filterKey;window.__scenarioFieldFilterMode='same';}
 return window.__scenarioFieldFilterMode||'same';
 }
 function scenarioFieldFilterBarHtml(ctx,id,fieldLabel,mode){
 if(!fieldLabel) return '';
 const chip=(m,label)=>`<button type="button" class="ghost" style="padding:6px 12px;font-size:12px;font-weight:800;${mode===m?'border-color:var(--gold);color:#ffe083;background:rgba(255,213,75,.12)':''}" onclick="setScenarioFieldFilter('${ctx}','${id}','${m}')">${label}</button>`;
 return `<div class="scenario-field-filter" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0"><span class="muted" style="font-size:12px">Lọc theo lĩnh vực (${esc(fieldLabel)}):</span>${chip('same','Cùng lĩnh vực')}${chip('all','Tất cả')}${chip('other','Lĩnh vực khác')}</div>`;
 }
 function setScenarioFieldFilter(ctx,id,mode){
 window.__scenarioFieldFilterMode=mode;
 if(ctx==='indicator') openIndicatorScenarioSelector(id);
 else if(ctx==='field') openFieldScenarioSelector(id);
 else if(ctx==='vptu') openVptuScenarioSelector(id);
 else if(ctx==='draft') openDraftScenarioSelector();
 else openScenarioSelector(id);
 }
 function scenarioCardHtml(ctx,id,key){const s=scenarioTemplates()[key]; if(!s)return '';return `<button class="scenario-card" onclick="${ctx==='indicator'?`selectIndicatorScenario('${id}','${key}')`:ctx==='field'?`selectFieldScenario('${id}','${key}')`:ctx==='vptu'?`selectVptuScenario('${id}','${key}')`:ctx==='draft'?`selectDraftScenario('${key}')`:`selectScenario('${id}','${key}')`}"><div class="scenario-severity"><span class="badge ${s.level==='Khẩn'?'red':s.level==='Cao'?'warn':'ok'}">${esc(s.level)}</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3"> ${(s.tasks||[]).length} nhiệm vụ nhánh</span></div><h4>${esc(s.title)}</h4><p>${esc(s.desc)}</p>${s.objective?`<p class="scenario-objective"> ${esc(s.objective)}</p>`:''}<div class="scenario-sla-tags">${(s.fields&&s.fields.length)?s.fields.map(f=>`<span class="badge gold" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip"> ${esc(f)}</span>`).join(''):`<span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip">📁 Mọi lĩnh vực</span>`}${(s.sla||[]).map(x=>`<span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip"> ${esc(x)}</span>`).join('')}</div></button>`}
 function scenarioFullPageHtml(s,actionBarHtml,leadUnit,coordUnits){
 const tagStyle='max-width:none;white-space:normal;overflow:visible;text-overflow:clip';
 const coordTags=(coordUnits&&coordUnits.length)?coordUnits.map(u=>`<span class="badge" style="${tagStyle}"> ${esc(u)}</span>`).join(''):'';
 return `<div class="detail-card scenario-fullpage">
 <div class="scenario-severity" style="margin-bottom:8px"><span class="badge ${s.level==='Khẩn'?'red':s.level==='Cao'?'warn':'ok'}">${esc(s.level||'—')}</span><span class="badge" style="${tagStyle}"> ${(s.tasks||[]).length} nhiệm vụ nhánh</span></div>
 <h4>📋 Kịch bản điều hành IOC: ${esc(s.title)}</h4><div class="scenario-fullpage-grid">
 <div class="scenario-fullpage-sec wide"><b>1. Mục tiêu</b><p>${esc(s.objective||'—')}</p></div>
 <div class="scenario-fullpage-sec wide"><b>2. Phạm vi áp dụng</b><p>${esc(s.scope||'—')}</p></div>
 <div class="scenario-fullpage-sec wide"><b>3. Quy trình vận hành</b><ol>${(s.process||[]).map(p=>`<li><b>${esc(p.step)}:</b> ${esc(p.desc)}</li>`).join('')||'<li>—</li>'}</ol></div>
 <div class="scenario-fullpage-sec"><b>4. Kết quả mong đợi</b><div class="scenario-sla-tags">${(s.expectedResults&&s.expectedResults.length)?s.expectedResults.map(x=>`<span class="badge" style="${tagStyle}"> ${esc(x)}</span>`).join(''):'<span class="muted">—</span>'}</div></div>
 <div class="scenario-fullpage-sec"><b>5. Đơn vị chủ trì / phối hợp</b><div class="scenario-sla-tags"><span class="badge gold" style="${tagStyle}"> ${esc(leadUnit||'Chưa xác định')}</span>${coordTags}</div><small class="muted" style="display:block;margin-top:6px">Tự lấy theo nhiệm vụ/chỉ tiêu đang áp dụng kịch bản.</small></div>
 </div>${actionBarHtml||''}</div>`;
 }
 function scenarioTaskTableHtml(ctx,id,key,s,recordLike){
 const existingSubs = ctx==='indicator' ? indicatorSubtasksStore(id) : ctx==='field' ? fieldSubtasksStore(id) : ctx==='vptu' ? vptuSubtasksStore(vptuScenarioTarget(id).parentId) : (recordLike?.subtasks||[]);
 const rows=(s.tasks||[]).map((t,i)=>{
 const already=existingSubs.find(x=>x.name===t[0]&&x.scenario===key);
 const coordText=(t[3]&&t[3].length)?esc(t[3].join(', ')):'—';
 const priority=esc(t[4]||((s.level==='Khẩn'||s.level==='Cao')?'Cao':'Bình thường'));
 const urgency=esc(t[5]||'Thường');
 const dueText=already?esc(already.due||'—'):esc(t[7]||'Theo lúc áp dụng');
 const checkboxCell=already?'<span title="Đã tạo nhiệm vụ nhánh này"></span>':`<input type="checkbox" data-scenario-task="${i}" checked/>`;
 return `<tr><td class="tc">${checkboxCell}</td><td class="mono">${already?esc(already.id):'—'}</td><td class="subtask-name-col">${esc(t[0])}</td><td class="subtask-content-col">${esc(t[1])}</td><td>${esc(t[2])}</td><td>${coordText}</td><td>${priority}</td><td>${urgency}</td><td>${dueText}</td><td>${already?'<span class="badge ok">Đã tạo</span>':'<span class="badge warn">Chưa tạo</span>'}</td></tr>`;
 }).join('');
 return `<div class="detail-card"><h4>Nhiệm vụ nhánh trong kịch bản</h4><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Đơn vị phối hợp</th><th>Mức độ</th><th>Độ khẩn</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>${rows||'<tr><td colspan="10">Kịch bản chưa khai báo nhiệm vụ nhánh nào.</td></tr>'}</tbody></table></div></div>`;
 }
 function scenarioDetailHtml(ctx,id,key,recordLike,subsHtmlFn){
 const s=scenarioTemplates()[key]; if(!s)return '';
 const leadUnit=recordLike?.unit||'';
 const coordUnits=recordLike?.coordinators||[];
 const actionBarHtml=`<div class="action-bar" style="margin-top:12px"><button class="primary" onclick="${ctx==='indicator'?`applyIndicatorScenarioTasks('${id}','${key}')`:ctx==='field'?`applyFieldScenarioTasks('${id}','${key}')`:ctx==='vptu'?`applyVptuScenarioTasks('${id}','${key}')`:ctx==='draft'?`confirmDraftScenarioTasks('${key}')`:`applyScenarioTasks('${id}','${key}')`}">Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="${ctx==='indicator'?`openIndicatorScenarioSelector('${id}')`:ctx==='field'?`openFieldScenarioSelector('${id}')`:ctx==='vptu'?`openVptuScenarioSelector('${id}')`:ctx==='draft'?`openDraftScenarioSelector()`:`openScenarioSelector('${id}')`}">Chọn kịch bản khác</button><button class="ghost" onclick="openScenarioCreateForm('${ctx}','${id}')">＋ Thêm kịch bản mới</button></div>`;
 return `${scenarioFullPageHtml(s,'',leadUnit,coordUnits)}${scenarioTaskTableHtml(ctx,id,key,s,recordLike)}${actionBarHtml}`;
 }
 function openScenarioCreateForm(ctx,id,editKey){
 const customs=loadCustomScenarios();
 let editing=!!(editKey && customs[editKey]);
 if(editKey && !editing){toast('Không tìm thấy kịch bản để sửa.');editKey=null;}
 if(editing && isScenarioInUse(editKey)){toast('Kịch bản đã có nhiệm vụ nhánh sử dụng nên không thể sửa.');editKey=null;editing=false;}
 if(guardAction(editing?'sửa kịch bản':'thêm kịch bản mới'))return;
 const existing=editing?customs[editKey]:null;
 const backFn=ctx==='indicator'?'openIndicatorScenarioSelector':ctx==='field'?'openFieldScenarioSelector':ctx==='vptu'?'openVptuScenarioSelector':ctx==='general'?'closeModal':ctx==='draft'?'openDraftScenarioSelector':'openScenarioSelector';
 window.__newScenarioTasksDraft=existing?(existing.tasks||[]).map(t=>t.slice()):[];
 document.getElementById('modalTitle').textContent=editing?`Sửa kịch bản xử lý · ${existing.title}`:'Thêm mới kịch bản xử lý';
 document.getElementById('modalSub').textContent='';
 const PROCESS_STEP_NAMES=['Thu thập & đồng bộ dữ liệu','Phân tích, đối chiếu, phát hiện bất thường','Cảnh báo','Đề xuất phương án xử lý','Theo dõi kết quả & báo cáo'];
 const levelOpts=['Cao','Khẩn','Trung bình','Bình thường'];
 const existingFields=existing?.fields||[];
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="${backFn}('${id}')">← Quay lại chọn kịch bản</button></div><div class="form2"><div class="field"><label>Mã kịch bản</label><input id="newScenarioKey" value="${editing?esc(editKey):`custom_${Date.now().toString().slice(-5)}`}" ${editing?'disabled':''} /></div><div class="field"><label>Mức độ</label><select id="newScenarioLevel">${levelOpts.map(o=>`<option ${existing&&existing.level===o?'selected':''}>${o}</option>`).join('')}</select></div><div class="field wide"><label>Tên kịch bản</label><input id="newScenarioTitle" value="${existing?esc(existing.title||''):''}" placeholder="Ví dụ: Kịch bản xử lý dữ liệu sai lệch giữa các nguồn" /></div><div class="field wide"><label>Mô tả ngắn (khi nào dùng kịch bản này)</label><textarea id="newScenarioDesc" rows="2" placeholder="Khi nào áp dụng kịch bản này...">${existing?esc(existing.desc||''):''}</textarea></div><div class="field wide"><label>Lĩnh vực áp dụng (để trống = áp dụng cho mọi lĩnh vực)</label><div class="ms-wrap" style="position:relative"><div id="newScenarioFieldsTrigger" onclick="toggleUnitDropdown('newScenarioFieldsDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="newScenarioFieldsTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">${existingFields.length?esc(existingFields.join(', ')):'Mọi lĩnh vực (mặc định)'}</span><span class="combo-caret" style="position:absolute;top:50%;right:12px;transform:translateY(-50%)">⌄</span></div><div id="newScenarioFieldsDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;max-height:260px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="newScenarioFieldsSearch" placeholder="Tìm lĩnh vực..." oninput="filterUnitChecklist('newScenarioFieldsSearch','newScenarioFieldsBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="newScenarioFieldsBox" style="display:flex;flex-direction:column;gap:2px">${scenarioFieldOptions().map(f=>`<label class="unit-check-row" data-name="${f.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${esc(f)}" class="newScenarioFieldChk" ${existingFields.includes(f)?'checked':''} onchange="updateUnitTriggerLabel('newScenarioFieldsTriggerText','newScenarioFieldsBox','Mọi lĩnh vực (mặc định)')"/>${esc(f)}</label>`).join('')}</div></div></div></div>
 <div class="field wide"><label>1. Mục tiêu</label><textarea id="newScenarioObjective" rows="2" placeholder="Mục tiêu của kịch bản...">${existing?esc(existing.objective||''):''}</textarea></div>
 <div class="field wide"><label>2. Phạm vi áp dụng</label><textarea id="newScenarioScope" rows="2" placeholder="Áp dụng cho đối tượng/địa bàn nào...">${existing?esc(existing.scope||''):''}</textarea></div>
 <div class="field wide">
 <label>Nhiệm vụ nhánh gợi ý (tự động tạo khi áp dụng kịch bản)</label>
 <div id="newScenarioTasksList" style="display:grid;gap:8px"></div>
 <!-- Nút "＋ Thêm nhiệm vụ nhánh" chuyển xuống chung 1 hàng với "Lưu kịch bản mới" (action-bar cuối form). -->
 <div id="newScenarioTaskForm" class="detail-card hidden" style="margin-top:8px">
 <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4></div>
 <div class="form2 compact">
 <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="nsTaskName" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
 <div class="field"><label>Người giao</label><input value="Theo tài khoản khi áp dụng" disabled /></div>
 <div class="field"><label>Mã nhiệm vụ nhánh</label><input value="Tự sinh khi áp dụng" disabled /></div>
 <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="nsTaskOwner"><optgroup label="Sở/ban ngành Thành phố">${units.map(u=>`<option>${esc(u)}</option>`).join('')}</optgroup><optgroup label="Xã/phường">${wardNames().map(w=>`<option>${esc(w)}</option>`).join('')}</optgroup></select></div>
 <div class="field wide"><label>Đơn vị/người phối hợp</label>
 <div class="ms-wrap" style="position:relative">
 <div id="nsCoordTrigger" onclick="toggleUnitDropdown('nsCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
 <span id="nsCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span class="combo-caret" style="position:absolute;top:50%;right:12px;transform:translateY(-50%)">⌄</span>
 </div>
 <div id="nsCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
 <input type="text" id="nsCoordSearch" placeholder="Tìm đơn vị..." oninput="filterUnitChecklist('nsCoordSearch','nsCoordBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
 <div id="nsCoordBox" style="display:flex;flex-direction:column;gap:2px">${[...units,...wardNames()].map(u=>`<label class="unit-check-row" data-name="${u.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${u}" class="nsCoord" onchange="updateUnitTriggerLabel('nsCoordTriggerText','nsCoordBox','Chọn đơn vị phối hợp')"/>${u}</label>`).join('')}</div>
 </div>
 </div>
 </div>
 <div class="field"><label>Mức độ quan trọng</label><select id="nsTaskPriority"><option>Cao</option><option selected>Bình thường</option></select></div>
 <div class="field"><label>Độ khẩn</label><select id="nsTaskUrgency"><option>Khẩn cấp</option><option>Gấp</option><option selected>Thường</option></select></div>
 <div class="field half"><label>Ngày bắt đầu</label><input id="nsTaskStart" type="date" min="${todayISO()}" onchange="syncDueMin('nsTaskStart','nsTaskDue')" /></div>
 <div class="field half"><label>Hạn hoàn thành</label><input id="nsTaskDue" type="date" min="${todayISO()}" /></div>
 <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="nsTaskContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
 </div>
 <div class="action-bar"><button type="button" class="primary" onclick="addNewScenarioTaskRow()">Thêm vào danh sách</button><button type="button" class="ghost" onclick="closeNewScenarioTaskForm()">Hủy</button></div>
 </div>
 </div></div><div class="action-bar"><button type="button" class="ghost" onclick="openNewScenarioTaskForm()">＋ Thêm nhiệm vụ nhánh</button><button class="primary" onclick="saveNewScenarioTemplate('${ctx}','${id}','${editing?editKey:''}')">${editing?'Lưu thay đổi':'Lưu kịch bản mới'}</button></div><div class="detail-card"><h4>Các kịch bản tự tạo hiện có</h4><div class="scenario-template-list">${Object.entries(loadCustomScenarios()).map(([k,s])=>{
 const inUse=isScenarioInUse(k); const archived=!!s.archived;
 const statusBadge=archived?'<span class="badge warn">Đã ẩn khỏi lựa chọn (đã dùng)</span>':inUse?'<span class="badge">Đang dùng</span>':'<span class="badge ok">Chưa dùng</span>';
 const editBtn=inUse?`<button class="ghost" disabled title="Kịch bản đã có nhiệm vụ nhánh sử dụng, không thể sửa">Sửa</button>`:`<button class="ghost" onclick="openScenarioCreateForm('${ctx}','${id}','${k}')">Sửa</button>`;
 const delBtn=archived?`<button class="ghost" onclick="restoreCustomScenario('${k}','${ctx}','${id}')">Khôi phục</button>`:`<button class="ghost danger-btn" onclick="deleteCustomScenario('${k}','${ctx}','${id}')">Xóa</button>`;
 return `<div class="scenario-template-row"><div><b>${esc(s.title)}</b><small>${esc(s.desc||'')} · ${esc(s.level||'')} · ${(s.fields&&s.fields.length)?'Lĩnh vực: '+esc(s.fields.join(', ')):'📁 Mọi lĩnh vực'} · ${statusBadge}</small></div><div class="action-bar" style="gap:6px">${editBtn}${delBtn}</div></div>`;
 }).join('')||'<div class="muted">Chưa có kịch bản tự tạo.</div>'}</div></div>`;
 renderNewScenarioTasksList();
 openModal();
 }
 function renderNewScenarioTasksList(){
 const box=document.getElementById('newScenarioTasksList'); if(!box) return;
 const list=window.__newScenarioTasksDraft||[];
 box.innerHTML=list.length?list.map((t,i)=>`<div class="scenario-template-row"><div><b>${esc(t[0])}</b><small>${esc(t[2])}${(t[3]&&t[3].length)?' · phối hợp '+esc(t[3].join(', ')):''} · ${esc(t[4]||'Bình thường')}${t[7]?' · hạn '+esc(t[7]):''}</small></div><button type="button" class="ghost danger-btn" onclick="removeNewScenarioTaskRow(${i})">Xóa</button></div>`).join(''):'<div class="muted">Chưa có nhiệm vụ nhánh nào — bấm "＋ Thêm nhiệm vụ nhánh" để khai báo.</div>';
 }
 function openNewScenarioTaskForm(){
 document.getElementById('nsTaskName').value='';document.getElementById('nsTaskContent').value='';document.getElementById('nsTaskOwner').selectedIndex=0;
 document.getElementById('nsTaskPriority').selectedIndex=1;document.getElementById('nsTaskUrgency').selectedIndex=2;
 document.getElementById('nsTaskStart').value='';document.getElementById('nsTaskDue').value='';document.getElementById('nsTaskDue').min=todayISO();
 document.querySelectorAll('.nsCoord').forEach(c=>c.checked=false);
 updateUnitTriggerLabel('nsCoordTriggerText','nsCoordBox','Chọn đơn vị phối hợp');
 document.getElementById('newScenarioTaskForm').classList.remove('hidden');
 document.getElementById('nsTaskName').focus();
 }
 function closeNewScenarioTaskForm(){document.getElementById('newScenarioTaskForm').classList.add('hidden');}
 function addNewScenarioTaskRow(){
 const name=(document.getElementById('nsTaskName').value||'').trim(); if(!name){toast('Cần nhập tên nhiệm vụ nhánh.');return;}
 const content=(document.getElementById('nsTaskContent').value||'').trim()||name;
 const owner=document.getElementById('nsTaskOwner').value;
 const coordinators=Array.from(document.querySelectorAll('.nsCoord:checked')).map(c=>c.value);
 if(!validDateRange('nsTaskStart','nsTaskDue'))return;
 const priority=document.getElementById('nsTaskPriority').value;
 const urgency=document.getElementById('nsTaskUrgency').value;
 const startRaw=document.getElementById('nsTaskStart').value||''; const startDate=startRaw?startRaw.split('-').reverse().join('/'):'';
 const dueRaw=document.getElementById('nsTaskDue').value||''; const due=dueRaw?dueRaw.split('-').reverse().join('/'):'';
 window.__newScenarioTasksDraft=window.__newScenarioTasksDraft||[];
 window.__newScenarioTasksDraft.push([name,content,owner,coordinators,priority,urgency,startDate,due]);
 renderNewScenarioTasksList();
 closeNewScenarioTaskForm();
 }
 function removeNewScenarioTaskRow(idx){
 (window.__newScenarioTasksDraft||[]).splice(idx,1);
 renderNewScenarioTasksList();
 }
 function saveNewScenarioTemplate(ctx,id,editKey){
 if(guardAction(editKey?'sửa kịch bản':'lưu kịch bản mới'))return;
 if(editKey && isScenarioInUse(editKey)){toast('Kịch bản đã có nhiệm vụ nhánh sử dụng nên không thể sửa.');return;}
 const PROCESS_STEP_NAMES=['Thu thập & đồng bộ dữ liệu','Phân tích, đối chiếu, phát hiện bất thường','Cảnh báo','Đề xuất phương án xử lý','Theo dõi kết quả & báo cáo'];
 const keyRaw=(document.getElementById('newScenarioKey')?.value||'').trim().replace(/\s+/g,'_');const key=editKey||keyRaw||`custom_${Date.now()}`;
 const title=(document.getElementById('newScenarioTitle')?.value||'').trim(); if(!title){toast('Cần nhập tên kịch bản.');return;}
 const level=document.getElementById('newScenarioLevel')?.value||'Trung bình';
 const desc=(document.getElementById('newScenarioDesc')?.value||'').trim()||'Kịch bản tự tạo bởi người dùng.';
 const objective=(document.getElementById('newScenarioObjective')?.value||'').trim();
 const scope=(document.getElementById('newScenarioScope')?.value||'').trim();
 const processLines=(document.getElementById('newScenarioProcess')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const process=PROCESS_STEP_NAMES.map((step,i)=>({step,desc:processLines[i]||''})).filter(p=>p.desc);
 const expectedResults=(document.getElementById('newScenarioResults')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const sla=(document.getElementById('newScenarioSla')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const tasks=(window.__newScenarioTasksDraft||[]).slice();
 const fields=Array.from(document.querySelectorAll('.newScenarioFieldChk:checked')).map(c=>c.value);
 const c=loadCustomScenarios(); c[key]={title,level,desc,objective,scope,process,expectedResults,sla:sla.length?sla:['Trong ngày tiếp nhận','24h cập nhật kết quả'],tasks:tasks.length?tasks:[[title,desc,'Đơn vị chuyên môn']],fields}; saveCustomScenarios(c);
 toast(editKey?'Đã cập nhật kịch bản.':'Đã thêm kịch bản mới.');
 if(ctx==='indicator') openIndicatorScenarioSelector(id);
 else if(ctx==='field') openFieldScenarioSelector(id);
 else if(ctx==='vptu') openVptuScenarioSelector(id);
 else if(ctx==='general') openScenarioCreateForm('general','');
 else if(ctx==='draft') openDraftScenarioSelector();
 else openScenarioSelector(id);
 }
 /* Kịch bản chưa từng dùng -> xóa cứng. Kịch bản đã có nhiệm vụ nhánh dùng rồi -> chỉ ẩn (archive) khỏi các lưới chọn kịch bản mới, giữ nguyên dữ liệu để nhiệm vụ nhánh cũ vẫn tra được tên/kịch bản. */
 function deleteCustomScenario(key,ctx,id){
 const c=loadCustomScenarios(); if(!c[key]){toast('Không tìm thấy kịch bản.');return;}
 if(isScenarioInUse(key)){
 c[key].archived=true; saveCustomScenarios(c);
 toast('Kịch bản đã có nhiệm vụ nhánh sử dụng nên không thể xóa hẳn — đã ẩn khỏi danh sách chọn kịch bản mới.');
 } else {
 delete c[key]; saveCustomScenarios(c);
 toast('Đã xóa kịch bản tự tạo.');
 }
 openScenarioCreateForm(ctx,id);
 }
 function restoreCustomScenario(key,ctx,id){
 const c=loadCustomScenarios(); if(!c[key])return;
 delete c[key].archived; saveCustomScenarios(c);
 toast('Đã khôi phục kịch bản vào danh sách chọn.');
 openScenarioCreateForm(ctx,id);
 }

 /* --- Kịch bản cho hồ sơ/nhiệm vụ --- */
 function openScenarioSelector(id){
 if(guardAction('chọn kịch bản xử lý'))return;
 const r=records.find(x=>x.id===id); if(!r)return;
 const allKeys=recordScenarioKeys(r).filter(k=>scenarioTemplates()[k]&&!isScenarioArchived(k)); const st=statusMeta(r.status);
 const fieldLabel=r.field||null; const mode=scenarioFieldFilterModeFor('record:'+id);
 const keys=filterScenarioKeysByField(allKeys,fieldLabel,mode);
 document.getElementById('modalTitle').textContent='Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh';
 document.getElementById('modalSub').textContent=`${r.id} · ${r.title}`;
 document.getElementById('modalBody').innerHTML=`<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:${st.color}">${st.label}</span> · Tiến độ ${r.progress}% · Hạn ${r.due}. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('record','${id}')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="returnFromScenario('${id}')">Quay lại hồ sơ chính</button></div>${scenarioFieldFilterBarHtml('record',id,fieldLabel,mode)}<div class="scenario-grid">${keys.length?keys.map(k=>scenarioCardHtml('record',id,k)).join(''):'<div class="subtask-empty">Không có kịch bản phù hợp với bộ lọc lĩnh vực hiện tại.</div>'}</div>`;
 openModal();
 }
 function selectScenario(id,key){
 const r=records.find(x=>x.id===id); if(!r||!scenarioTemplates()[key])return; r.selectedScenario=key;
 document.getElementById('modalTitle').textContent=`${scenarioTemplates()[key].title} · ${r.id}`;
 document.getElementById('modalSub').textContent='Chọn nhiệm vụ nhánh';
 document.getElementById('modalBody').innerHTML=scenarioDetailHtml('record',id,key,r,subtaskStatsHtml);
 openModal();
 }
 /* Tạo các nhiệm vụ nhánh của 1 kịch bản vào 1 hồ sơ đã tồn tại — dùng chung cho áp kịch bản thủ công
 (applyScenarioTasks, đọc checkbox từ DOM) và áp kịch bản đã chọn sẵn lúc giao nhiệm vụ mới (createAssignment). */
 function applyScenarioTasksToRecord(r,key,checkedIndices){
 const s=scenarioTemplates()[key]; if(!r||!s) return 0;
 r.subtasks=r.subtasks||[];
 let created=0;
 checkedIndices.forEach(idx=>{
 const t=s.tasks[idx]; if(!t) return;
 const dup=r.subtasks.some(x=>x.name===t[0]&&x.scenario===key); if(dup) return;
 r.subtasks.push({id:`${r.id}-N${String(r.subtasks.length+1).padStart(2,'0')}`,name:t[0],content:t[1],owner:t[2],coordinators:t[3]||[],state:'Đang xử lý',startDate:t[6]||'',due:t[7]||dueDate(idx,key==='overdue'?'soon':'doing'),priority:t[4]||((s.level==='Khẩn'||s.level==='Cao')?'Cao':'Bình thường'),urgency:t[5]||'Thường',progress:10,scenario:key,created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,creatorOfficeId:currentOfficeId});
 const subIdx=r.subtasks.length-1;
 pushNoti({role:r.role,soId:resolveSoIdByUnitName(t[2]),category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${t[0]}`,sub:`Theo kịch bản "${s.title}", giao cho ${t[2]}, thuộc ${r.id}.`,level:s.level==='Khẩn'?'Khẩn':'Cao',target:{type:'recordSubtask',id:r.id,idx:subIdx}});
 created++;
 });
 return created;
 }
 function applyScenarioTasks(id,key){
 if(guardAction('tạo nhiệm vụ nhánh theo kịch bản'))return;
 const r=records.find(x=>x.id===id); const s=scenarioTemplates()[key]; if(!r||!s)return;
 const checked=[...document.querySelectorAll('[data-scenario-task]:checked')].map(x=>Number(x.dataset.scenarioTask));
 if(!checked.length){toast('Chưa chọn nhiệm vụ nhánh nào.');return;}
 const created=applyScenarioTasksToRecord(r,key,checked);
 r.selectedScenario=key; r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`Áp dụng ${s.title}, tạo ${created} nhiệm vụ nhánh liên quan`});
 const newNames=(r.subtasks||[]).slice(-created).map(x=>x.name);
 pushActionLog({category:'scenario',icon:'',title:`Áp dụng kịch bản "${s.title}"`,sub:`${r.id} · ${r.title} — tạo ${created} nhiệm vụ nhánh`,detail:newNames.length?`Nhiệm vụ nhánh mới: ${newNames.join(', ')}`:'',role:r.role,target:{type:'record',id}});
 toast(`Đã tạo ${created} nhiệm vụ nhánh theo kịch bản.`); returnFromScenario(id);
 }
 /* --- Bảng thống kê nhiệm vụ nhánh (chung cho renderRecordDetail) --- */
 /* Nhóm nhiệm vụ nhánh theo đúng kịch bản đã sinh ra nó (dùng chung cho bảng đầy đủ lẫn bản rút gọn trong cây văn bản) */
 function groupSubtasksByScenario(subs){
 const groups=[]; const groupAt={};
 const order=subs.map((s,i)=>i).sort((a,b)=>parseDMY(subs[b].due)-parseDMY(subs[a].due));
 order.forEach(i=>{const s=subs[i];
 const key=s.scenario||'';
 if(!(key in groupAt)){ groupAt[key]=groups.length; groups.push({key,label:key?(scenarioTemplates()[key]?.title||key):'Giao thường (không qua kịch bản)',items:[]}); }
 groups[groupAt[key]].items.push({s,i});
 });
 return groups;
 }
 function subtaskStatsHtml(r,filterScenario){
 const allSubs=r.subtasks||[];
 const scoped=filterScenario===undefined?allSubs:allSubs.filter(s=>(s.scenario||'')===filterScenario);
 const done=scoped.filter(s=>(s.state||'').toLowerCase().includes('hoàn')).length;const doing=scoped.filter(s=>(s.state||'').toLowerCase().includes('đang')).length;const soon=scoped.filter(s=>(s.state||'').toLowerCase().includes('sắp')).length;
 const allGroups=groupSubtasksByScenario(allSubs);
 const groups=filterScenario===undefined?allGroups:allGroups.filter(g=>g.key===filterScenario);
 const groupsHtml=groups.length?groups.map(g=>{
 const rows=g.items.map(({s,i})=>`<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${i})"><td>${s.id||('NVN-'+String(i+1).padStart(2,'0'))}</td><td class="subtask-name-col">${s.name||'Việc nhánh'}</td><td class="subtask-content-col">${s.content||s.name||'--'}</td><td>${s.owner||'--'}</td><td>${(s.coordinators&&s.coordinators.length)?s.coordinators.join(', '):'--'}</td><td>${s.due||'--'}</td><td>${s.progress??(s.state&&s.state.includes('Hoàn')?100:35)}%</td><td><span class="badge ${s.state&&s.state.includes('Hoàn')?'ok':s.state&&s.state.includes('Sắp')?'warn':''}">${s.state||'Đang xử lý'}</span></td></tr>`).join('');
 return `<div class="task-scenario-group"><div class="task-scenario-heading"> ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Người/Đơn vị phối hợp</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
 }).join(''):`<div class="subtask-empty">Chưa có nhiệm vụ nhánh${filterScenario!==undefined?' trong kịch bản này':''}. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống chậm tiến độ/quá hạn/thiếu dữ liệu.</div>`;
 const heading=filterScenario===undefined?`Thống kê nhiệm vụ nhánh liên quan ${r.metric==='docIn'||r.metric==='docOut'?'văn bản':'nhiệm vụ'} chính`:`Nhiệm vụ nhánh cùng kịch bản: ${groups[0]?groups[0].label:(filterScenario?scenarioTemplates()[filterScenario]?.title||filterScenario:'Giao thường (không qua kịch bản)')}`;
 const actionBar=filterScenario===undefined?`<div class="action-bar"><button class="primary" onclick="openScenarioSelector('${r.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openSubTaskForm('${r.id}')">＋ Giao nhiệm vụ nhánh</button><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>`:`<div class="action-bar"><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>`;
 return `<section class="subtask-summary"><div class="subtask-head"><div><h4>${heading}</h4><div class="subtask-meta-note">Chọn kịch bản xử lý → tạo nhiệm vụ nhánh liên quan, nhóm theo đúng kịch bản → có thể thêm mới nhiệm vụ nhánh.</div></div>${actionBar}</div><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(scoped.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div><div class="task-scenario-groups">${groupsHtml}</div></section>`;
 }
 /* Khung form "nhiệm vụ nhánh" (tên/mã/đơn vị chủ trì/phối hợp/ưu tiên/khẩn/ngày/nội dung/đính kèm) dùng chung cho
 cả luồng hồ sơ thường (openSubTaskForm) và luồng VPTU (openVptuSubTaskForm) — trước đây 2 nơi copy y hệt khối
 HTML này, dễ sửa 1 nơi quên nơi kia. codePrefix/subsLength là 2 chỗ khác nhau duy nhất giữa 2 luồng. */
 function subTaskFormFieldsHtml(codePrefix,subsLength,editing,s){
 return `<div class="detail-card">
 <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
 <div class="form2 compact widget-body">
 <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="subTitle" value="${editing?esc(s.name||''):''}" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
 <div class="field"><label>Người giao</label><input value="${currentAccount.title}" disabled /></div>
 <div class="field"><label>Mã nhiệm vụ nhánh</label><input id="subCode" value="${editing?s.id:codePrefix+'-N'+String(subsLength+1).padStart(2,'0')}" disabled /></div>
 <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="subOwner"><optgroup label="Sở/ban ngành Thành phố">${units.map(u=>`<option ${editing&&s.owner===u?'selected':''}>${u}</option>`).join('')}</optgroup><optgroup label="Xã/phường">${wardNames().map(w=>`<option ${editing&&s.owner===w?'selected':''}>${w}</option>`).join('')}</optgroup></select></div>
 <div class="field wide"><label>Đơn vị/người phối hợp</label>
 <div class="ms-wrap" style="position:relative">
 <div id="subCoordTrigger" onclick="toggleUnitDropdown('subCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
 <span id="subCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span class="combo-caret" style="position:absolute;top:50%;right:12px;transform:translateY(-50%)">⌄</span>
 </div>
 <div id="subCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
 <input type="text" id="subCoordSearch" placeholder="Tìm đơn vị..." oninput="filterUnitChecklist('subCoordSearch','subCoordBox')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
 <div id="subCoordBox" style="display:flex;flex-direction:column;gap:2px">${units.map(u=>`<label class="unit-check-row" data-name="${u.toLowerCase()}" style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="${u}" class="subCoord" ${editing&&(s.coordinators||[]).includes(u)?'checked':''} onchange="updateUnitTriggerLabel('subCoordTriggerText','subCoordBox','Chọn đơn vị phối hợp')"/>${u}</label>`).join('')}</div>
 </div>
 </div>
 </div>
 <div class="field"><label>Mức độ quan trọng</label><select id="subPriority"><option ${editing&&s.priority==='Cao'?'selected':''}>Cao</option><option ${!editing||s.priority!=='Cao'?'selected':''}>Bình thường</option></select></div>
 <div class="field"><label>Độ khẩn</label><select id="subUrgency"><option ${editing&&s.urgency==='Khẩn cấp'?'selected':''}>Khẩn cấp</option><option ${editing&&s.urgency==='Gấp'?'selected':''}>Gấp</option><option ${!editing||s.urgency==='Thường'?'selected':''}>Thường</option></select></div>
 <div class="field half"><label>Ngày bắt đầu</label><input id="subStart" type="date" value="${editing?toISODate(s.startDate):''}" min="${dateMinAttr(editing?s.startDate:'')}" onchange="syncDueMin('subStart','subDue')" /></div>
 <div class="field half"><label>Hạn hoàn thành</label><input id="subDue" type="date" value="${editing?toISODate(s.due):''}" min="${dateMinAttr(editing?s.due:'')}" /></div>
 <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="subContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu...">${editing?esc(s.content||''):''}</textarea></div>
 <div class="field wide"><label>Đính kèm file</label><input id="subFileInput" type="file" multiple onchange="handleAssignmentFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
 </div>
 </div>`;
 }
 function openSubTaskForm(parentId,editIdx){
 if(guardAction(editIdx!=null?'sửa nhiệm vụ nhánh':'giao nhiệm vụ nhánh'))return;
 const r=records.find(x=>x.id===parentId); if(!r)return;
 const editing=editIdx!=null; const s=editing?(r.subtasks||[])[editIdx]:null;
 if(editing && !s) return;
 if(editing && !isSubtaskOwnedByMe(s)){guardOwnership('sửa');returnFromScenario(parentId);return;}
 window.__assignmentFiles=editing&&s.attachmentsKey?JSON.parse(localStorage.getItem(s.attachmentsKey)||'[]'):[];
 document.getElementById('modalTitle').textContent=editing?`Sửa nhiệm vụ nhánh · ${s.id}`:`Giao nhiệm vụ nhánh · ${r.id}`;
 document.getElementById('modalSub').textContent=`Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${r.id} · ${r.title}`;
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="scenario-history-badge"><b>Nhiệm vụ cha:</b> ${r.id} · ${r.title} · Trục ${roleMeta(r.role).icon} ${roleMeta(r.role).name}</div>
 ${subTaskFormFieldsHtml(r.id,(r.subtasks||[]).length,editing,s)}
 <div class="action-bar">${editing?`<button class="primary" onclick="saveEditedSubTask('${parentId}',${editIdx})">Lưu thay đổi</button><button class="ghost" onclick="returnFromScenario('${parentId}')">Hủy</button>`:`<button class="primary" onclick="createSubTaskAssignment('${parentId}')">Phát hành nhiệm vụ nhánh</button><button class="ghost" onclick="openScenarioSelector('${parentId}')">⚡ Dùng kịch bản có sẵn</button><button class="ghost" onclick="returnFromScenario('${parentId}')">Hủy</button>`}</div>`;
 openModal();
 renderAssignmentFileList();
 if(editing) updateUnitTriggerLabel('subCoordTriggerText','subCoordBox','Chọn đơn vị phối hợp');
 }
 function saveEditedSubTask(parentId,idx){
 if(guardAction('sửa nhiệm vụ nhánh'))return;
 const r=records.find(x=>x.id===parentId); const s=r?.subtasks?.[idx]; if(!r||!s)return;
 if(!isSubtaskOwnedByMe(s)){guardOwnership('sửa');return;}
 const name=(document.getElementById('subTitle').value||'').trim(); if(!name){toast('Cần nhập tên nhiệm vụ nhánh.');return;}
 if(!validDateRange('subStart','subDue',s.startDate,s.due))return;
 const oldSub={name:s.name,owner:s.owner,priority:s.priority,urgency:s.urgency,due:s.due};
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
 r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`${currentAccount.title} chỉnh sửa nhiệm vụ nhánh ${s.id}: ${name}`});
 const subChanges=[];
 if(oldSub.name!==s.name) subChanges.push(`Tên: "${oldSub.name}" → "${s.name}"`);
 if(oldSub.owner!==s.owner) subChanges.push(`Đơn vị: ${oldSub.owner} → ${s.owner}`);
 if(oldSub.priority!==s.priority) subChanges.push(`Ưu tiên: ${oldSub.priority} → ${s.priority}`);
 if(oldSub.urgency!==s.urgency) subChanges.push(`Khẩn: ${oldSub.urgency} → ${s.urgency}`);
 if(oldSub.due!==s.due) subChanges.push(`Hạn: ${oldSub.due||'—'} → ${s.due||'—'}`);
 pushActionLog({category:'edit',icon:'',title:`Sửa nhiệm vụ nhánh: ${name}`,sub:`Thuộc ${r.id} · ${r.title}`,detail:subChanges.length?subChanges.join(' · '):'Không có trường nào thay đổi giá trị.',role:r.role,target:{type:'recordSubtask',id:parentId,idx}});
 toast(`Đã cập nhật nhiệm vụ nhánh "${name}".`);
 openSubTaskDetail(parentId,idx);
 }
 /* ---- Xóa nhiệm vụ nhánh ---- */
 function deleteSubTask(parentId,idx){
 if(guardAction('xóa nhiệm vụ nhánh'))return;
 const r=records.find(x=>x.id===parentId); const s=r?.subtasks?.[idx]; if(!r||!s)return;
 if(!isSubtaskOwnedByMe(s)){guardOwnership('xóa');return;}
 openDeleteConfirm('Xóa nhiệm vụ nhánh', `Xóa nhiệm vụ nhánh "<b>${esc(s.name||'')}</b>" (${s.id})? Thao tác này không thể hoàn tác.`, `performDeleteSubTask('${parentId}',${idx})`);
 }
 function performDeleteSubTask(parentId,idx){
 const r=records.find(x=>x.id===parentId); if(!r||!r.subtasks||!r.subtasks[idx])return;
 const removed=r.subtasks[idx];
 r.subtasks.splice(idx,1);
 r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`${currentAccount.title} xóa nhiệm vụ nhánh: ${removed.name}`});
 pushActionLog({category:'delete',icon:'',title:`Xóa nhiệm vụ nhánh: ${removed.name}`,sub:`Thuộc ${r.id} · ${r.title}`,detail:`Đơn vị nhận: ${removed.owner||'—'} · Trạng thái lúc xóa: ${removed.state||'—'} · Tiến độ ${removed.progress??0}%`,role:r.role,target:{type:'record',id:parentId}});
 toast(`Đã xóa nhiệm vụ nhánh "${removed.name}".`);
 returnFromScenario(parentId);
 }
 function createSubTaskAssignment(parentId){
 if(guardAction('giao nhiệm vụ nhánh'))return;
 const r=records.find(x=>x.id===parentId); if(!r)return;
 const name=(document.getElementById('subTitle').value||'').trim(); if(!name){toast('Cần nhập tên nhiệm vụ nhánh.');return;}
 if(!validDateRange('subStart','subDue'))return;
 const owner=document.getElementById('subOwner').value;
 const coordinators=Array.from(document.querySelectorAll('.subCoord:checked')).map(c=>c.value);
 const priority=document.getElementById('subPriority').value;
 const urgency=document.getElementById('subUrgency').value;
 const startDate=document.getElementById('subStart').value||'';
 const dueRaw=document.getElementById('subDue').value||''; const due=dueRaw?dueRaw.split('-').reverse().join('/'):dueDate(0,'doing');
 const content=(document.getElementById('subContent').value||'').trim()||name;
 r.subtasks=r.subtasks||[];
 const id=`${r.id}-N${String(r.subtasks.length+1).padStart(2,'0')}`;
 const attachments=window.__assignmentFiles||[]; const attachmentsKey=attachments.length?`px-ioc-files-${id}`:null;
 if(attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
 const ownerXaId=resolveXaIdByUnitName(owner);
 r.subtasks.push({id,name,content,owner,ownerXaId,coordinators,state:'Đang xử lý',due,startDate,priority,urgency,progress:5,scenario:'',attachmentsKey,evidence:attachments.map(a=>a.name),created:new Date().toLocaleString('vi-VN'),creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,creatorOfficeId:currentOfficeId});
 const subIdx=r.subtasks.length-1;
 pushNoti({role:r.role,soId:resolveSoIdByUnitName(owner),xaId:ownerXaId,category:'assigned',icon:'',title:`Nhiệm vụ nhánh mới: ${name}`,sub:`${currentAccount.title} giao cho ${owner}, thuộc ${r.id}.`,level:urgency==='Khẩn cấp'?'Khẩn':(priority==='Cao'?'Cao':'Thường'),target:{type:'recordSubtask',id:r.id,idx:subIdx}});
 r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`${currentAccount.title} giao nhiệm vụ nhánh mới cho ${r.id}: ${name} → ${owner}`});
 pushActionLog({category:'assign',icon:'',title:`Giao nhiệm vụ nhánh: ${name}`,sub:`Thuộc ${r.id} · ${r.title} → ${owner} · Ưu tiên ${priority} · Khẩn ${urgency} · Hạn ${due||'—'}`,detail:`Nội dung: ${content}${coordinators.length?` · Phối hợp: ${coordinators.join(', ')}`:''}`,role:r.role,target:{type:'recordSubtask',id:r.id,idx:subIdx}});
 toast(`Đã giao nhiệm vụ nhánh "${name}" là nhiệm vụ con của ${r.id}.`);
 returnFromScenario(r.id);
 }
 /* Mô phỏng sự kiện đồng bộ trạng thái nhiệm vụ nhánh từ hệ thống nguồn (IOC không cho sửa tay trực tiếp),
 và gửi noti "Cập nhật trạng thái" ngược về đúng trục/sở đã tạo ra nhiệm vụ nhánh đó. */
 const SUBTASK_STATE_STEPS=['Đang xử lý','Sắp hoàn thành','Hoàn thành'];
 function advanceSubtaskState(s){
 const i=SUBTASK_STATE_STEPS.indexOf(s.state);
 const next=SUBTASK_STATE_STEPS[Math.min(i<0?0:i+1,SUBTASK_STATE_STEPS.length-1)];
 if(next===s.state){ toast('Nhiệm vụ nhánh đã hoàn thành, không còn cập nhật mới.'); return false; }
 s.state=next; s.progress=next==='Hoàn thành'?100:next==='Sắp hoàn thành'?70:s.progress;
 return true;
 }
 function notifySubtaskStatusUpdate(s,fallbackRole,parentLabel,target){
 const role=s.creatorRole||fallbackRole;
 pushNoti({role,soId:s.creatorSoId||null,category:'status_update',icon:'',title:`${s.owner} cập nhật trạng thái: ${s.name}`,sub:`Trạng thái mới: ${s.state} · Thuộc: ${parentLabel}`,level:s.state==='Hoàn thành'?'Trung bình':'Cao',target});
 pushActionLog({category:'sync',icon:'',title:`Mô phỏng đồng bộ trạng thái: ${s.name}`,sub:`Trạng thái mới: ${s.state} · Thuộc: ${parentLabel}`,detail:`Đơn vị thực hiện: ${s.owner||'—'} · Tiến độ mới: ${s.progress??0}%`,role,soId:s.creatorSoId||null,target});
 toast('Đã mô phỏng đồng bộ trạng thái, gửi cập nhật về đơn vị đã giao.');
 }
 function simulateRecordSubtaskSync(parentId,idx){
 if(guardAction('mô phỏng đồng bộ trạng thái'))return;
 const r=records.find(x=>x.id===parentId); const s=r?.subtasks?.[idx]; if(!r||!s)return;
 if(!advanceSubtaskState(s))return;
 notifySubtaskStatusUpdate(s,r.role,r.title,{type:'recordSubtask',id:parentId,idx});
 openSubTaskDetail(parentId,idx);
 }
 function simulateIndicatorSubtaskSync(indId,idx){
 if(guardAction('mô phỏng đồng bộ trạng thái'))return;
 const ind=indicatorRecords.find(x=>x.id===indId); const s=indicatorSubtasksStore(indId)[idx]; if(!ind||!s)return;
 if(!advanceSubtaskState(s))return;
 notifySubtaskStatusUpdate(s,ind.role,ind.indicator,{type:'indicatorSubtask',id:indId,idx});
 openIndicatorSubTaskDetail(indId,idx);
 }
 function simulateFieldSubtaskSync(fid,idx){
 if(guardAction('mô phỏng đồng bộ trạng thái'))return;
 const t=fieldTarget(fid); const s=fieldSubtasksStore(fid)[idx]; if(!t.cat||!s)return;
 if(!advanceSubtaskState(s))return;
 notifySubtaskStatusUpdate(s,t.role,t.label,{type:'fieldSubtask',id:fid,idx});
 openFieldSubTaskDetail(fid,idx);
 }
 function subtaskSyncButtonHtml(state,onclick){
 return state==='Hoàn thành'?'<span class="badge ok">Đã hoàn thành</span>':'';
 }
 /* 2 nút giống card "Mô tả & tiến độ" của hồ sơ chính (taskActionBarHtml ở record-detail.js): "Cập nhật nhiệm vụ" chuyển
 sang hệ thống theo dõi nhiệm vụ nguồn — CHỈ hiện cho tài khoản là đơn vị chủ trì nhánh đó (isSubtaskHostedByMe);
 "Nhắc xử lý" gửi nhắc tới đơn vị chủ trì nhánh — nhánh đã hoàn thành thì không còn gì để nhắc nên ẩn nút này.
 Dùng chung cho mọi popup chi tiết nhiệm vụ nhánh. */
 function subtaskActionButtonsHtml(s){
 const update=isSubtaskHostedByMe(s)?`<button class="ghost" onclick="openTaskTrackingSystem()">Cập nhật nhiệm vụ</button>`:'';
 const remind=s.state==='Hoàn thành'?'':`<button class="ghost" onclick="${esc(`toast(${JSON.stringify('Đã gửi nhắc xử lý tới đơn vị: '+(s.owner||'—'))})`)}">Nhắc xử lý</button>`;
 return update+remind;
 }
 function openSubTaskDetail(parentId,idx){
 const r=records.find(x=>x.id===parentId); const s=r?.subtasks?.[idx]; if(!r||!s)return;
 document.getElementById('modalTitle').textContent=`Chi tiết nhiệm vụ nhánh · ${s.id||idx+1}`;
 document.getElementById('modalSub').textContent=`Gắn với ${r.id} · ${r.title}`;
 const attFiles=s.attachmentsKey?JSON.parse(localStorage.getItem(s.attachmentsKey)||'[]'):[];
 document.getElementById('modalBody').innerHTML=`<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id||'--'}</span><b>Nhiệm vụ cha</b><span>${r.id} · ${r.title}</span><b>Kịch bản</b><span>${s.scenario?scenarioTemplates()[s.scenario]?.title:'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.name||'--'}</span><b>Nội dung</b><span class="wrap">${s.content||s.name||'--'}</span><b>Đơn vị chủ trì</b><span>${s.owner}</span><b>Đơn vị phối hợp</b><span>${(s.coordinators&&s.coordinators.length)?s.coordinators.join(', '):'—'}</span><b>Ngày bắt đầu</b><span>${s.startDate||'—'}</span><b>Hạn xử lý</b><span>${s.due||'--'}</span><b>Mức ưu tiên</b><span>${s.priority||'Bình thường'}</span><b>Độ khẩn</b><span>${s.urgency||'—'}</span><b>Trạng thái</b><span>${s.state||'Đang xử lý'}</span>${attFiles.length?`<b>File đính kèm</b><span>${attFiles.map(f=>`<a href="${f.dataUrl}" download="${f.name}" style="color:#49bcff">${f.name}</a>`).join(', ')}</span>`:''}</div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p>${subtaskProgressHtml(s.state||'Đang xử lý',s.progress??30)}<div class="action-bar" style="margin-top:10px">${subtaskSyncButtonHtml(s.state||'Đang xử lý',`simulateRecordSubtaskSync('${parentId}',${idx})`)}${subtaskActionButtonsHtml(s)}${isSubtaskOwnedByMe(s)?`<button class="ghost" onclick="openSubTaskForm('${parentId}',${idx})">✏️ Sửa nhiệm vụ nhánh</button><button class="ghost danger-btn" onclick="deleteSubTask('${parentId}',${idx})">🗑️ Xóa nhiệm vụ nhánh</button>`:''}</div></div></div>${subtaskStatsHtml(r,s.scenario||'')}`;
 openModal();
 }

