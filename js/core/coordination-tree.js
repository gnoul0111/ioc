 /* ============================== CÂY "ĐƠN VỊ/NGƯỜI PHỐI HỢP" (chọn NHIỀU) ==============================
 Dùng lại ĐÚNG cây cơ cấu tổ chức thật orgTreeRoot() (central-level.js — cùng nguồn với sidebar/đăng nhập/giao
 nhiệm vụ), KHÔNG giới hạn theo quyền tài khoản đang đăng nhập (phối hợp có thể mời bất kỳ đơn vị/lãnh đạo nào,
 kể cả bên Trung ương — trước đây chỉ có 4 trục Thành phố) và cho chọn ĐỘC LẬP NHIỀU đơn vị/người cùng lúc bằng
 checkbox. Mỗi checkbox lưu giá trị là đường dẫn đầy đủ (vd. "HĐND TP / Ban Đô thị") để nhất quán với cây chọn
 đơn vị nhận nhiệm vụ. Chỉ còn danh sách lãnh đạo theo tên (AXIS_LEADERS, xem unit-picker.js) là tiện ích phụ
 gắn thêm vào đúng nút trục gốc thành phố, không phải 1 phần cơ cấu tổ chức thật. */
 function buildCoordTreeData(){
 const wrap=n=>{
 const kids=[];
 if(n.type!=='ward'&&typeof n.children==='function') kids.push(...n.children().map(wrap));
 const isAxisRoot=n.officeRole&&!n.officeId&&!n.soId&&n.xaId==null&&!isTwRole(n.officeRole);
 const leaders=isAxisRoot?AXIS_LEADERS[n.officeRole]:null;
 if(leaders) kids.push({label:leaders.label,children:leaders.names.map(name=>({label:name,children:null}))});
 return {label:n.label,children:kids.length?kids:null};
 };
 return orgTreeRoot().map(wrap);
 }
 let coordTreeSeq=0;
 function coordNodeHtml(node,ancestors,checkedSet,prefix,expandAll){
 ancestors=ancestors||[];
 const breadcrumb=ancestors.concat([node.label]).join(' / ');
 const valAttr=esc(breadcrumb).replace(/"/g,'&quot;');
 const isChecked=checkedSet.has(breadcrumb)?'checked':'';
 const cbHtml=`<span class="snav-cbwrap"><input type="checkbox" value="${valAttr}" class="${prefix}Coord" ${isChecked} onchange="updateUnitTriggerLabel('${prefix}CoordTriggerText','${prefix}CoordBox','Chọn đơn vị phối hợp')"/><span class="snav-cb-box"></span></span>`;
 const hasChildren=Array.isArray(node.children)&&node.children.length;
 if(!hasChildren){
 return `<div class="snav-node"><label class="snav-row snav-leaf" style="cursor:pointer">${cbHtml}<span class="snav-label" style="margin-left:6px">${esc(node.label)}</span></label></div>`;
 }
 const cid=`${prefix}ctc${(coordTreeSeq++)}`;
 const childAncestors=ancestors.concat([node.label]);
 const childHtml=node.children.map(c=>coordNodeHtml(c,childAncestors,checkedSet,prefix,expandAll)).join('');
 const cls=expandAll?' open':'';
 return `<div class="snav-node"><div class="snav-row snav-split" style="padding:0"><button type="button" class="snav-caret-btn" onclick="unitPickerToggle(this,'${cid}')"><span class="snav-caret${cls}">▸</span></button><label style="display:flex;align-items:center;flex:1;padding:6px 8px 6px 0;cursor:pointer">${cbHtml}<span class="snav-label" style="margin-left:6px">${esc(node.label)}</span></label></div><div class="snav-children${cls}" id="${cid}">${childHtml}</div></div>`;
 }
 function coordTreeData(){ return window.__coordTreeData||(window.__coordTreeData=buildCoordTreeData()); }
 function coordTreeHtml(prefix,checkedSet,query){
 coordTreeSeq=0;
 const q=(query||'').trim().toLowerCase();
 const nodes=q?filterUnitTreeData(coordTreeData(),q):coordTreeData();
 return nodes.length?nodes.map(n=>coordNodeHtml(n,[],checkedSet,prefix,!!q)).join(''):'<div class="access-lock" style="margin:4px 8px">Không tìm thấy đơn vị phù hợp.</div>';
 }
 function filterCoordTree(prefix){
 const box=document.getElementById(prefix+'CoordBox'); if(!box)return;
 const checkedSet=new Set(Array.from(box.querySelectorAll('input[type=checkbox]:checked')).map(c=>c.value));
 const q=document.getElementById(prefix+'CoordSearch').value;
 box.innerHTML=coordTreeHtml(prefix,checkedSet,q);
 updateUnitTriggerLabel(prefix+'CoordTriggerText',prefix+'CoordBox','Chọn đơn vị phối hợp');
 }
 function openUnitPicker(){
 /* Luôn tính lại assignableTargets() (không dùng thẳng window.__assignTargets đang có) vì buildUnitPickerTree
 sẽ NỐI THÊM các "đơn vị giả lập" (Ban/Phòng/lãnh đạo) làm target ảo ngay trên mảng này — nếu tái sử dụng mảng
 cũ, mỗi lần mở lại popup sẽ cộng dồn thêm 1 lượt target ảo trùng lặp. */
 const targets=assignableTargets(); window.__assignTargets=targets; if(!targets.length)return;
 unitPickerTreeData=buildUnitPickerTree(targets);
 unitPickerSelectedIdx=Number(document.getElementById('assTargetIdx').value);
 unitPickerSelectedLabel=unitPickerSelectedIdx>=0?(document.getElementById('assTargetTriggerText').textContent||''):'';
 document.getElementById('unitPickerSearch').value='';
 renderUnitPickerTree('');
 document.getElementById('unitPickerOverlay').classList.add('show');
 document.getElementById('unitPickerModal').classList.add('open');
 }
 function closeUnitPicker(){document.getElementById('unitPickerOverlay').classList.remove('show');document.getElementById('unitPickerModal').classList.remove('open')}
 function selectUnitPickerTarget(idx,label){
 const targets=window.__assignTargets||[]; const t=targets[idx]; if(!t)return;
 document.getElementById('assTargetIdx').value=idx;
 document.getElementById('assRole').value=t.role;
 const fieldInput=document.getElementById('assFieldInput'); if(fieldInput) fieldInput.value='';
 const trigText=document.getElementById('assTargetTriggerText'); if(trigText){ trigText.textContent=label||t.label; trigText.style.color='#d0e8f8'; }
 closeUnitPicker();
 }
 function openAssignmentForm(source,prefill,originTag){
 if(guardAction('giao nhiệm vụ'))return;
 const returnDocId=window.__assignmentReturnDocId||null; window.__assignmentReturnDocId=null;
 const returnFieldId=window.__assignmentReturnFieldId||null; window.__assignmentReturnFieldId=null;
 window.__assignmentFiles=[]; window.__selectedDocs=[];
 window.__pendingAssignmentScenario=null;
 window.__assignmentFormState={source, returnDocId, returnFieldId, prefill:prefill||null, originTag:originTag||null};
 renderAssignmentFormBody();
 }
 function openAssignmentFromField(fid){
 window.__assignmentReturnFieldId=fid;
 openAssignmentForm('field');
 }
 function renderAssignmentFormBody(){
 const {source, returnDocId, returnFieldId, editRecord, prefill}=window.__assignmentFormState||{};
 const fieldCtx=returnFieldId?fieldTarget(returnFieldId):null;
 const targets=assignableTargets(); window.__assignTargets=targets;
 if(!targets.length){
 document.getElementById('modalTitle').textContent='Giao nhiệm vụ IOC/CAD';document.getElementById('modalSub').textContent='';
 document.getElementById('modalBody').innerHTML=`<div class="access-lock"><b>${currentAccount.title}</b> chưa có dữ liệu đơn vị trực thuộc trong cơ cấu tổ chức để giao nhiệm vụ.</div><div class="action-bar" style="margin-top:10px"><button class="ghost" onclick="closeModal()">Đóng</button></div>`;
 openModal();
 return;
 }
 let preselectedIdx=-1;
 if(editRecord){
 const foundIdx=targets.findIndex(t=>t.role===editRecord.role && (t.soId||null)===(editRecord.targetSoId||null) && (t.xaId||null)===(editRecord.targetXaId||null) && (t.officeId||null)===(editRecord.targetOfficeId||null));
 preselectedIdx=foundIdx>=0?foundIdx:0;
 }
 const preselectedTarget=targets[preselectedIdx]||null;
 const isDocSource=source==='docIn'||source==='docOut'||source==='doc';
 const isNotifySource=source==='notify';
 window.__assignmentDocTypeLock=(source==='docIn'||source==='docOut')?source:null;
 const formTitle=editRecord?`Sửa nhiệm vụ · ${editRecord.id}`:isNotifySource?'Tạo notify IOC/CAD & giao nhiệm vụ':isDocSource?'Thêm mới nhiệm vụ từ văn bản':source==='field'?`Giao nhiệm vụ · ${fieldCtx?esc(fieldCtx.label):'Lĩnh vực'}`:'Giao nhiệm vụ IOC/CAD';
 document.getElementById('modalTitle').textContent=formTitle;document.getElementById('modalSub').textContent=isNotifySource?'Notify sự kiện phát sinh (điểm nghẽn, cháy nổ, TTHC, văn bản, lịch họp, đô thị/môi trường) — tạo xong sẽ gửi notify và giao nhiệm vụ xử lý xuống đơn vị nhận.':fieldCtx?`${roleMeta(fieldCtx.role).name} · ${fieldCtx.label}`:`${currentAccount.title} · chọn đơn vị nhận trong toàn bộ cơ cấu tổ chức`;
 const importanceVal=editRecord?(editRecord.importance||editRecord.priority||'Bình thường'):'Bình thường';
 const urgencyVal=editRecord?(editRecord.urgency||'Thường'):'Thường';
 document.getElementById('modalBody').innerHTML=`${returnDocId?`<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${returnDocId}')">← Quay lại văn bản</button></div>`:returnFieldId?`<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${returnFieldId}')">← Quay lại ${fieldCtx&&fieldCtx.scope==='item'?'chỉ tiêu':'lĩnh vực'}</button></div>`:''}<div class="detail-card">
 <div class="card-head"><h4>Thông tin chung nhiệm vụ</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
 <div class="form2 compact widget-body">
 <div class="field wide"><label>${isNotifySource?'Tiêu đề notify':'Tiêu đề nhiệm vụ'}</label><input id="assTitle" value="${editRecord?esc(editRecord.title):esc(prefill?.title||'')}" placeholder="${isNotifySource?'Nhập tiêu đề notify':'Nhập tiêu đề nhiệm vụ'}" /></div>
 <input type="hidden" id="assRole" value="${preselectedTarget?preselectedTarget.role:''}" />
 <div class="field wide ass-row3">
 <div class="field"><label>Người giao</label><input id="assGiver" value="${currentAccount.title}" disabled style="height:38px;box-sizing:border-box" /></div>
 <div class="field"><label>Mã nhiệm vụ</label><input id="assCode" value="${editRecord?esc(editRecord.code||generateTaskCode()):generateTaskCode()}" style="height:38px;box-sizing:border-box" /></div>
 <div class="field"><label>Đơn vị nhận nhiệm vụ</label>
 <input type="hidden" id="assTargetIdx" value="${preselectedIdx}" />
 <div id="assTargetTrigger" onclick="openUnitPicker()" style="width:100%;height:38px;box-sizing:border-box;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:0 30px 0 12px;position:relative;cursor:pointer;display:flex;align-items:center">
 <span id="assTargetTriggerText" style="color:${preselectedTarget?'#d0e8f8':'#8ab0c8'};font-size:13px">${preselectedTarget?esc(preselectedTarget.label):'Chọn đơn vị nhận nhiệm vụ'}</span><span class="combo-caret" style="position:absolute;top:0;right:12px;height:38px;display:flex;align-items:center">⌄</span>
 </div>
 </div>
 </div>
 <div class="field wide"><label>Đơn vị/người phối hợp</label>
 <div class="ms-wrap" style="position:relative">
 <div id="assCoordTrigger" onclick="toggleUnitDropdown('assCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
 <span id="assCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span class="combo-caret" style="position:absolute;top:50%;right:12px;transform:translateY(-50%)">⌄</span>
 </div>
 <div id="assCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45);max-height:320px;display:flex;flex-direction:column">
 <input type="text" id="assCoordSearch" placeholder="Tìm đơn vị..." oninput="filterCoordTree('ass')" style="flex:0 0 auto;width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
 <div id="assCoordBox" style="flex:1;min-height:0;overflow-y:auto">${coordTreeHtml('ass',new Set(editRecord?(editRecord.coordinators||[]):[]),'')}</div>
 </div>
 </div>
 </div>
 <div class="field half"><label>Nhóm lĩnh vực</label><div class="ms-wrap" style="display:flex;gap:6px;align-items:center"><div style="flex:1;position:relative"><input type="text" id="assFieldInput" placeholder="Tìm kiếm" autocomplete="off" value="${editRecord?esc(editRecord.field||''):(fieldCtx?esc(fieldCtx.label):esc(prefill?.field||''))}" oninput="filterAssField()" onfocus="openAssFieldDropdown()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;outline:0;color:#d0e8f8" /><span class="combo-caret" style="position:absolute;top:50%;right:12px;transform:translateY(-50%);pointer-events:none">⌄</span><div id="assFieldDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"></div></div></div></div>
 <div class="field"><label>Mức độ quan trọng</label>${simpleSelectHtml('assImportance',['Cao','Bình thường'],importanceVal)}</div>
 <div class="field"><label>Độ khẩn</label>${simpleSelectHtml('assUrgency',['Khẩn cấp','Gấp','Thường'],urgencyVal)}</div>
 <div class="field half"><label>Ngày bắt đầu</label><input id="assStart" type="date" value="${editRecord?toISODate(editRecord.startDate):''}" min="${dateMinAttr(editRecord?.startDate)}" onchange="syncDueMin('assStart','assDue')" /></div>
 <div class="field half"><label>Hạn xử lý</label><input id="assDue" type="date" value="${editRecord?toISODate(editRecord.due):''}" min="${dateMinAttr(editRecord?.due)}" /></div>
 ${editRecord?'':'<div class="field wide"><label>Kịch bản xử lý (tuỳ chọn)</label><div id="assScenarioSummary"></div></div>'}
 </div>
 </div>
 <div class="detail-card">
 <div class="card-head"><h4>Thông tin văn bản</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
 <div class="form2 compact widget-body">
 <div class="field wide"><label>Chọn văn bản (liên kết hệ thống quản lý văn bản)</label><div id="assDocsList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px"></div><button type="button" onclick="openDocPicker()" style="border:1px dashed rgba(73,188,255,.45);background:rgba(44,125,210,.08);color:#49bcff;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:700">+ Chọn văn bản từ hệ thống quản lý văn bản</button></div>
 <div class="field wide"><label>${isNotifySource?'Khuyến nghị xử lý':'Ý kiến xử lý'}</label><textarea id="assDesc" rows="2">${editRecord?esc(editRecord.description||''):isNotifySource?'Đề nghị đơn vị chủ trì kiểm tra, cập nhật kết quả và đính kèm minh chứng trên IOC/CAD.':esc(prefill?.description||'Cập nhật dữ liệu đúng, đủ, sạch, sống; đính kèm file Excel/PDF hoặc minh chứng xử lý.')}</textarea></div>
 <div class="field wide"><label>Đính kèm file</label><input id="assFileInput" type="file" multiple onchange="handleAssignmentFiles(this)" /><div id="assFileList" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
 </div>
 </div>
 <div class="action-bar">${editRecord?`<button class="primary" onclick="saveEditedAssignment()">Lưu thay đổi</button><button class="ghost" onclick="closeModal()">Hủy</button>`:`<button class="primary" onclick="createAssignment()">${isNotifySource?' Tạo notify & giao nhiệm vụ':'Phát hành nhiệm vụ'}</button><button class="ghost" onclick="saveAssignmentDraft()">Lưu nháp</button><button class="ghost" onclick="cancelAssignmentForm()">Hủy</button>`}</div>`;openModal();
 if(editRecord){ updateUnitTriggerLabel('assCoordTriggerText','assCoordBox','Chọn đơn vị phối hợp'); }
 else renderAssignmentScenarioSummary();
 }
 /* ---- Sửa nhiệm vụ đã tạo (không áp dụng cho văn bản đến/đi vì đồng bộ từ hệ thống nguồn) ---- */
 function openEditRecordForm(id){
 if(guardAction('sửa nhiệm vụ'))return;
 const r=records.find(x=>x.id===id); if(!r)return;
 if(r.metric==='docIn'||r.metric==='docOut'){toast('Văn bản đồng bộ từ hệ thống nguồn, không thể sửa tại IOC.');return;}
 if(r.mirrorOfId){openEditRecordForm(r.mirrorOfId);return;}
 if(!isRecordOwnedByMe(r)){guardOwnership('sửa');return;}
 window.__assignmentFiles=r.attachmentsKey?JSON.parse(localStorage.getItem(r.attachmentsKey)||'[]'):[];
 window.__selectedDocs=(r.linkedDocIds||[]).map(did=>records.find(x=>x.id===did)).filter(Boolean);
 window.__pendingAssignmentScenario=null;
 window.__assignmentFormState={source:null, returnDocId:null, editRecord:r};
 renderAssignmentFormBody();
 renderSelectedDocsList();
 renderAssignmentFileList();
 }
 function saveEditedAssignment(){
 if(guardAction('sửa nhiệm vụ'))return;
 const editRecord=window.__assignmentFormState?.editRecord; if(!editRecord){toast('Không tìm thấy nhiệm vụ để sửa.');return;}
 const r=records.find(x=>x.id===editRecord.id); if(!r){toast('Nhiệm vụ không còn tồn tại.');return;}
 const targets=window.__assignTargets||[]; const t=targets[Number(document.getElementById('assTargetIdx').value)];
 if(!t){toast('Không xác định được đơn vị nhận hợp lệ.');return}
 const title=document.getElementById('assTitle').value.trim(); if(!title){toast('Cần nhập tiêu đề nhiệm vụ.');return;}
 if(!validDateRange('assStart','assDue',r.startDate,r.due))return;
 const oldSnapshot={title:r.title,unit:r.unit,importance:r.importance,urgency:r.urgency,due:r.due,field:r.field};
 const code=document.getElementById('assCode').value.trim()||r.code;
 const coordinators=Array.from(document.querySelectorAll('.assCoord:checked')).map(c=>c.value);
 const field=document.getElementById('assFieldInput').value.trim()||'Chưa phân loại';
 const docType=document.getElementById('assDocTypeInput')?.value.trim()||'';
 const linkedDocIds=(window.__selectedDocs||[]).map(d=>d.id);
 const attachments=window.__assignmentFiles||[];
 const attachmentsKey=r.attachmentsKey||(attachments.length?`px-ioc-files-${r.id}`:null);
 if(attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
 const oldRole=r.role, status=r.status, metric=r.metric;
 r.title=title; r.code=code; r.role=t.role; r.unit=t.label; r.receiver=t.label; r.officeId=t.officeId||null; r.targetSoId=t.soId; r.targetXaId=t.xaId; r.targetOfficeId=t.officeId||null;
 r.coordinators=coordinators; r.field=field; r.docType=docType;
 r.importance=document.getElementById('assImportance').value; r.urgency=document.getElementById('assUrgency').value; r.priority=r.importance;
 r.startDate=isoToDMY(document.getElementById('assStart').value)||r.startDate;
 r.due=isoToDMY(document.getElementById('assDue').value)||r.due;
 r.description=document.getElementById('assDesc').value;
 r.linkedDocIds=linkedDocIds; r.evidence=attachments.map(a=>a.name); r.attachmentsKey=attachmentsKey;
 /* Đồng bộ lại bản ghi mirror phía "Nhiệm vụ giao" cho khớp nội dung vừa sửa (không đổi role/metric của mirror). */
 if(r.mirrorId){
 const rOut=records.find(x=>x.id===r.mirrorId);
 if(rOut){ rOut.title=r.title; rOut.code=r.code; rOut.unit=r.unit; rOut.receiver=r.receiver; rOut.targetSoId=r.targetSoId; rOut.targetXaId=r.targetXaId; rOut.coordinators=r.coordinators; rOut.field=r.field; rOut.docType=r.docType; rOut.importance=r.importance; rOut.urgency=r.urgency; rOut.priority=r.priority; rOut.startDate=r.startDate; rOut.due=r.due; rOut.description=r.description; }
 }
 /* Đồng bộ nốt dòng đã bơm vào vptuDetailStore() (bảng "Mới tạo/Chờ phê duyệt/..." của widget theo trục) cho khớp tiêu đề/lĩnh vực/hạn vừa sửa — không đổi vptuLabel/status ở đây vì app chưa có màn đổi trạng thái nhiệm vụ. */
 [['received',r.id],['assigned',r.mirrorId]].forEach(([m,rid])=>{
 if(!rid) return; const item=(vptuDetailStore()[m]||[]).find(x=>x.id===rid); if(!item) return;
 item.title=r.title; item.field=r.field; item.due=r.due; item.startDate=r.startDate; item.description=r.description;
 });
 if(oldRole!==t.role && segmentTemplate[oldRole]?.[metric] && segmentTemplate[t.role]?.[metric]){
 segmentTemplate[oldRole][metric][status]=Math.max(0,(segmentTemplate[oldRole][metric][status]||0)-1);
 segmentTemplate[t.role][metric][status]=(segmentTemplate[t.role][metric][status]||0)+1;
 }
 r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`${currentAccount.title} chỉnh sửa thông tin nhiệm vụ.`});
 const changes=[];
 if(oldSnapshot.title!==r.title) changes.push(`Tiêu đề: "${oldSnapshot.title}" → "${r.title}"`);
 if(oldSnapshot.unit!==r.unit) changes.push(`Đơn vị nhận: ${oldSnapshot.unit} → ${r.unit}`);
 if(oldSnapshot.importance!==r.importance) changes.push(`Ưu tiên: ${oldSnapshot.importance} → ${r.importance}`);
 if(oldSnapshot.urgency!==r.urgency) changes.push(`Khẩn: ${oldSnapshot.urgency} → ${r.urgency}`);
 if(oldSnapshot.due!==r.due) changes.push(`Hạn: ${oldSnapshot.due||'—'} → ${r.due||'—'}`);
 if(oldSnapshot.field!==r.field) changes.push(`Lĩnh vực: ${oldSnapshot.field} → ${r.field}`);
 pushActionLog({category:'edit',icon:'',title:`Sửa nhiệm vụ: ${r.title}`,sub:`${r.id} · ${roleMeta(r.role)?.name||r.role}`,detail:changes.length?changes.join(' · '):'Không có trường nào thay đổi giá trị.',role:r.role,target:{type:'record',id:r.id}});
 window.__assignmentFormState=null;
 closeModal(); renderAll(); openRecordDetail(r.id); toast('Đã cập nhật nhiệm vụ.');
 }
 /* ---- Xóa nhiệm vụ đã tạo ---- */
 function deleteRecord(id){
 if(guardAction('xóa nhiệm vụ'))return;
 const r=records.find(x=>x.id===id); if(!r)return;
 if(r.metric==='docIn'||r.metric==='docOut'){toast('Văn bản đồng bộ từ hệ thống nguồn, không thể xóa tại IOC.');return;}
 if(r.mirrorOfId){deleteRecord(r.mirrorOfId);return;}
 if(!isRecordOwnedByMe(r)){guardOwnership('xóa');return;}
 openDeleteConfirm('Xóa nhiệm vụ', `Xóa nhiệm vụ "<b>${esc(r.title)}</b>" (${r.id})${(r.subtasks&&r.subtasks.length)?` và toàn bộ ${fmt(r.subtasks.length)} nhiệm vụ nhánh liên quan`:''}? Thao tác này không thể hoàn tác.`, `performDeleteRecord('${id}')`);
 }
 function performDeleteRecord(id){
 const idx=records.findIndex(x=>x.id===id); if(idx<0)return;
 const r=records[idx];
 if(segmentTemplate[r.role]?.[r.metric]) segmentTemplate[r.role][r.metric][r.status]=Math.max(0,(segmentTemplate[r.role][r.metric][r.status]||0)-1);
 records.splice(idx,1);
 removeVptuDetailItem(r);
 /* Xóa kèm bản ghi mirror ở phía bên kia (nhận↔giao) để không còn nhiệm vụ "mồ côi" trỏ tới bản ghi đã xóa. */
 if(r.mirrorId){ const outIdx=records.findIndex(x=>x.id===r.mirrorId); if(outIdx>=0){ const rOut=records[outIdx]; if(segmentTemplate[rOut.role]?.[rOut.metric]) segmentTemplate[rOut.role][rOut.metric][rOut.status]=Math.max(0,(segmentTemplate[rOut.role][rOut.metric][rOut.status]||0)-1); records.splice(outIdx,1); removeVptuDetailItem(rOut); } }
 pushActionLog({category:'delete',icon:'',title:`Xóa nhiệm vụ: ${r.title}`,sub:`${r.id} · ${roleMeta(r.role)?.name||r.role} · ${r.unit||'—'}`,detail:`Trạng thái lúc xóa: ${statusMeta(r.status).label} · Tiến độ ${r.progress}% · Hạn ${r.due||'—'}${(r.subtasks&&r.subtasks.length)?` · Đã xóa kèm ${r.subtasks.length} nhiệm vụ nhánh`:''}`,role:r.role});
 closeModal(); renderAll(); toast(`Đã xóa nhiệm vụ ${id}.`);
 }
 function cancelAssignmentForm(){window.__pendingAssignmentScenario=null;window.__assignmentFormDraft=null;closeModal();}
 /* --- Chọn kịch bản xử lý ngay khi giao nhiệm vụ mới (áp dụng sau khi hồ sơ được tạo) --- */
 function renderAssignmentScenarioSummary(){
 const box=document.getElementById('assScenarioSummary'); if(!box) return;
 const p=window.__pendingAssignmentScenario;
 if(!p){ box.innerHTML=`<button type="button" class="ghost" onclick="openAssignmentScenarioPicker()">⚡ Chọn kịch bản xử lý</button>`; return; }
 const s=scenarioTemplates()[p.key];
 box.innerHTML=`<div class="scenario-history-badge"> Đã chọn: <b>${esc(s?s.title:p.key)}</b> · ${p.checked.length} nhiệm vụ nhánh sẽ tạo ngay khi phát hành. <button type="button" class="ghost" style="margin-left:8px" onclick="openAssignmentScenarioPicker()">Đổi</button> <button type="button" class="ghost danger-btn" onclick="clearAssignmentScenario()">Bỏ chọn</button></div>`;
 }
 function clearAssignmentScenario(){window.__pendingAssignmentScenario=null; renderAssignmentScenarioSummary();}
 function snapshotAssignmentForm(){
 window.__assignmentFormDraft={
 title:document.getElementById('assTitle')?.value,
 code:document.getElementById('assCode')?.value,
 targetIdx:document.getElementById('assTargetIdx')?.value,
 coordinators:Array.from(document.querySelectorAll('.assCoord:checked')).map(c=>c.value),
 field:document.getElementById('assFieldInput')?.value,
 docType:document.getElementById('assDocTypeInput')?.value,
 importance:document.getElementById('assImportance')?.value,
 urgency:document.getElementById('assUrgency')?.value,
 start:document.getElementById('assStart')?.value,
 due:document.getElementById('assDue')?.value,
 desc:document.getElementById('assDesc')?.value,
 notiType:document.getElementById('notiType')?.value,
 notiLevel:document.getElementById('notiLevel')?.value
 };
 }
 function resumeAssignmentForm(){
 renderAssignmentFormBody();
 const d=window.__assignmentFormDraft; if(!d) return;
 const set=(id,v)=>{const el=document.getElementById(id); if(el&&v!=null) el.value=v;};
 set('assTitle',d.title); set('assCode',d.code); set('assTargetIdx',d.targetIdx);
 const resumedTarget=window.__assignTargets[Number(d.targetIdx)]||null;
 document.getElementById('assRole').value=resumedTarget?resumedTarget.role:'';
 const resumedTrigText=document.getElementById('assTargetTriggerText');
 if(resumedTrigText){ resumedTrigText.textContent=resumedTarget?resumedTarget.label:'Chọn đơn vị nhận nhiệm vụ'; resumedTrigText.style.color=resumedTarget?'#d0e8f8':'#8ab0c8'; }
 set('assFieldInput',d.field); set('assDocTypeInput',d.docType);
 if(d.importance) selectSimpleOption('assImportance',d.importance);
 if(d.urgency) selectSimpleOption('assUrgency',d.urgency);
 set('assStart',d.start); set('assDue',d.due); set('assDesc',d.desc);
 set('notiType',d.notiType); set('notiLevel',d.notiLevel);
 (d.coordinators||[]).forEach(v=>{const cb=document.querySelector(`.assCoord[value="${v.replace(/"/g,'&quot;')}"]`); if(cb) cb.checked=true;});
 updateUnitTriggerLabel('assCoordTriggerText','assCoordBox','Chọn đơn vị phối hợp');
 window.__assignmentFormDraft=null;
 }
 function openAssignmentScenarioPicker(){ snapshotAssignmentForm(); openDraftScenarioSelector(); }
 function openDraftScenarioSelector(){
 if(guardAction('chọn kịch bản xử lý'))return;
 const allKeys=Object.keys(scenarioTemplates()).filter(k=>!isScenarioArchived(k));
 const fieldLabel=window.__assignmentFormDraft?.field||null; const mode=scenarioFieldFilterModeFor('draft:');
 const keys=filterScenarioKeysByField(allKeys,fieldLabel,mode);
 document.getElementById('modalTitle').textContent='Chọn kịch bản xử lý cho nhiệm vụ sắp giao';
 document.getElementById('modalSub').textContent=window.__assignmentFormDraft?.title||'';
 document.getElementById('modalBody').innerHTML=`<div class="scenario-history-badge">Chọn 01 kịch bản — hệ thống sẽ tự tạo các nhiệm vụ nhánh đã chọn ngay sau khi phát hành nhiệm vụ này.</div><div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm('draft','')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="resumeAssignmentForm()">Quay lại giao nhiệm vụ</button></div>${scenarioFieldFilterBarHtml('draft','',fieldLabel,mode)}<div class="scenario-grid">${keys.length?keys.map(k=>scenarioCardHtml('draft','',k)).join(''):'<div class="subtask-empty">Không có kịch bản phù hợp với bộ lọc lĩnh vực hiện tại.</div>'}</div>`;
 openModal();
 }
 function selectDraftScenario(key){
 if(!scenarioTemplates()[key])return;
 document.getElementById('modalTitle').textContent=`${scenarioTemplates()[key].title} · Nhiệm vụ sắp giao`;
 document.getElementById('modalSub').textContent='Chọn nhiệm vụ nhánh sẽ tạo ngay khi phát hành';
 document.getElementById('modalBody').innerHTML=scenarioDetailHtml('draft','',key,null,null);
 openModal();
 }
 function confirmDraftScenarioTasks(key){
 const s=scenarioTemplates()[key]; if(!s)return;
 const checked=[...document.querySelectorAll('[data-scenario-task]:checked')].map(x=>Number(x.dataset.scenarioTask));
 if(!checked.length){toast('Chưa chọn nhiệm vụ nhánh nào.');return;}
 window.__pendingAssignmentScenario={key,checked};
 resumeAssignmentForm();
 toast(`Đã chọn kịch bản "${s.title}" (${checked.length} nhiệm vụ nhánh) — sẽ tạo ngay sau khi phát hành nhiệm vụ.`);
 }
 function saveAssignmentDraft(){
 const targets=window.__assignTargets||[]; const t=targets[Number(document.getElementById('assTargetIdx')?.value)]||{};
 const draft={code:document.getElementById('assCode').value,title:document.getElementById('assTitle').value,role:t.role,unit:t.label,savedAt:new Date().toLocaleString('vi-VN')};
 const drafts=JSON.parse(localStorage.getItem('px-ioc-drafts')||'[]'); drafts.push(draft); localStorage.setItem('px-ioc-drafts',JSON.stringify(drafts));
 window.__pendingAssignmentScenario=null;
 closeModal(); toast('Đã lưu nháp nhiệm vụ.');
 }
 function createAssignment(){
 const {source, returnFieldId, originTag}=window.__assignmentFormState||{}; const isNotifySource=source==='notify';
 if(guardAction(isNotifySource?'tạo notify':'phát hành nhiệm vụ'))return;
 const targets=window.__assignTargets||[]; const t=targets[Number(document.getElementById('assTargetIdx').value)];
 if(!t){toast('Không xác định được đơn vị nhận hợp lệ.');return}
 if(!validDateRange('assStart','assDue'))return;
 const role=t.role, unit=t.label; const title=document.getElementById('assTitle').value.trim()||'Nhiệm vụ mới'; const code=document.getElementById('assCode').value.trim()||generateTaskCode();
 const coordinators=Array.from(document.querySelectorAll('.assCoord:checked')).map(c=>c.value);
 const notifyType=isNotifySource?'Thông báo':null;
 const notifyLevel=isNotifySource?'Cao':null;
 const id=`PX-NEW-${Date.now().toString().slice(-6)}`;
 const attachments=window.__assignmentFiles||[]; const attachmentsKey=attachments.length?`px-ioc-files-${id}`:null;
 if(attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
 const field=document.getElementById('assFieldInput').value.trim()||'Chưa phân loại';
 const docType=document.getElementById('assDocTypeInput')?.value.trim()||'';
 const linkedDocIds=(window.__selectedDocs||[]).map(d=>d.id);
 /* Bản ghi này là nhiệm vụ ĐẾN (nhận) đối với đơn vị đích t.role — phải đếm vào "Nhiệm vụ nhận" của đơn vị đó,
 không phải "Nhiệm vụ giao" của chính họ (đó là lỗi logic cũ: coi UBND là bên giao khi thực chất họ là bên nhận). */
 /* status PHẢI là 1 trong các key của statusDefs (new/pending/extend/done/closed/revoked) — 'doing' không tồn tại
 trong bộ trạng thái này nên trước đây nhiệm vụ mới tạo bị "vô hình": không rơi vào ô trạng thái nào khi lọc,
 và segmentTemplate[...].doing chỉ là 1 property rác không ai đọc (sumObj/metricTotal chỉ cộng theo đúng key
 của statusDefs) → tổng "Nhiệm vụ giao/nhận" không bao giờ tăng dù đã tạo nhiệm vụ thật. */
 /* officeId (khác targetOfficeId) là field THẬT đang được results-dashboard.js (twOfficeScope()) đọc để lọc đúng
 "Nhiệm vụ nhận" của 1 đơn vị Trung ương cụ thể (Vụ/Cục/Phòng) — bản ghi demo sinh sẵn (generateRecords()) đã
 có field này, nhiệm vụ tạo thật qua form cũng phải set để hiện đúng trong dashboard của đơn vị nhận. */
 const r={id,code,role,metric:'received',status:'new',title,field,docType,creator:currentAccount.title,receiver:unit,unit,coordinators,importance:document.getElementById('assImportance').value,urgency:document.getElementById('assUrgency').value,priority:document.getElementById('assImportance').value,startDate:isoToDMY(document.getElementById('assStart').value),due:isoToDMY(document.getElementById('assDue').value)||dueDate(0,'regular'),created:new Date().toLocaleDateString('vi-VN'),progress:5,description:document.getElementById('assDesc').value,linkedDocIds,evidence:attachments.map(a=>a.name),attachmentsKey,history:[{time:new Date().toLocaleString('vi-VN'),text:isNotifySource?`${currentAccount.title} tạo notify "${notifyType}" và giao nhiệm vụ xử lý`:`${currentAccount.title} phát hành nhiệm vụ`}],subtasks:[],creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,officeId:t.officeId||null,targetSoId:t.soId,targetXaId:t.xaId,targetOfficeId:t.officeId||null,notifyType,notifyLevel,linkedFieldId:returnFieldId||null};
 records.push(r); segmentTemplate[role].received.new += 1;
 /* Ép build cache vptuDetailStore() TRƯỚC khi cộng số vào GIAO_DATA/VPTU_DATA bên dưới — nếu build SAU thì lần
 tạo nhiệm vụ đầu tiên trong phiên sẽ tự sinh dư 1 dòng theo số đã cộng, cộng thêm dòng em push tay = đúp 2 dòng. */
 vptuDetailStore();
 /* Đồng thời tạo 1 bản ghi "mirror" ở phía người GIAO (trục hiện đang đăng nhập) để nhiệm vụ này cũng lên đúng
 "Nhiệm vụ giao" của họ — không chỉ nằm ở "Nhiệm vụ nhận" của đơn vị nhận. Nội dung/sửa/xóa/nhánh việc vẫn
 quản lý duy nhất tại bản ghi gốc r (renderRecordDetail có nhánh riêng cho bản ghi mirror này). */
 if(segmentTemplate[currentRole]){
 /* officeId của bản ghi mirror (phía GIAO) phải là đơn vị của chính người đang giao (currentOfficeId), KHÔNG
 phải đơn vị nhận (t.officeId) — vì twOfficeScope() lọc "Nhiệm vụ giao" của 1 đơn vị Trung ương theo đúng
 officeId của bản ghi so với officeId đang xem, không phải theo nơi nhận. */
 const rOut={id:id+'-OUT',code,role:currentRole,metric:'assigned',status:r.status,title,field,docType,creator:currentAccount.title,receiver:unit,unit,coordinators,importance:r.importance,urgency:r.urgency,priority:r.priority,startDate:r.startDate,due:r.due,created:r.created,progress:r.progress,description:r.description,linkedDocIds,evidence:r.evidence,attachmentsKey:null,history:r.history,subtasks:[],creatorRole:currentRole,creatorSoId:currentSoId,creatorXaId:currentXaId,officeId:currentOfficeId||null,targetSoId:t.soId,targetXaId:t.xaId,targetOfficeId:t.officeId||null,notifyType,notifyLevel,linkedFieldId:returnFieldId||null,mirrorOfId:id};
 records.push(rOut); segmentTemplate[currentRole].assigned.new += 1;
 r.mirrorId=rOut.id;
 /* Widget "VĂN BẢN/NHIỆM VỤ THEO TRỤC" (chế độ Nhiệm vụ giao/nhận) không đọc segmentTemplate cho 2 metric này —
 nó đọc thẳng GIAO_DATA/VPTU_DATA (xem bumpFixedDataset ở khu vực khai báo 2 mảng đó). Phải cộng thêm ở đây
 thì số & danh sách "Mới tạo" trên đúng widget anh đang xem mới thực sự tăng theo. */
 const giaoEntry=bumpFixedDataset(GIAO_DATA,currentRole,'Mới tạo',1);
 pushVptuDetailItem('assigned',giaoEntry,'Mới tạo',rOut.id,title,field,giaoEntry?giaoEntry.title:unit,unit,coordinators,r.due,r.startDate,r.progress,r.description);
 }
 const vptuEntry=bumpFixedDataset(VPTU_DATA,role,'Mới tạo',1);
 pushVptuDetailItem('received',vptuEntry,'Mới tạo',id,title,field,vptuEntry?vptuEntry.title:unit,unit,coordinators,r.due,r.startDate,r.progress,r.description);
 /* Nếu nhiệm vụ này được tạo từ 1 notify GIS/Camera AI ("Giao xử lý"), gắn ngược lại nguồn phát sinh để
 nguồn đó không còn hiện lại như "chưa xử lý" — mà hiển thị đã có nhiệm vụ thật đi kèm (điều IOC yêu cầu). */
 if(originTag&&originTag.type==='gis'){
 const rec=(gisEformData||[]).find(x=>x.id===originTag.id);
 if(rec){ rec.linkedRecordId=id; if(rec.status!=='done') rec.status='doing'; if(typeof gisUpdateEformMarker==='function') gisUpdateEformMarker(rec); }
 } else if(originTag&&originTag.type==='camera'){
 window.__cameraAlertLinks=window.__cameraAlertLinks||{};
 window.__cameraAlertLinks[originTag.id]=id;
 }
 const notiIcon=isNotifySource?(notifyType.includes('Cháy')?'':notifyType.includes('Lịch')?'':notifyType.includes('Văn bản')?'':notifyType.includes('Đô thị')?'':notifyType.includes('TTHC')?'':''):'';
 pushNoti({role,soId:t.soId,xaId:t.xaId,officeId:t.officeId||null,category:'assigned',icon:notiIcon,title:isNotifySource?`${notifyType}: ${title}`:`Nhiệm vụ mới: ${title}`,sub:isNotifySource?`${currentAccount.title} gửi notify "${notifyType}" và giao nhiệm vụ xử lý cho ${unit}.`:`${currentAccount.title} vừa giao nhiệm vụ cho ${unit}.`,level:isNotifySource?notifyLevel:(r.urgency==='Khẩn cấp'?'Khẩn':(r.importance==='Cao'?'Cao':'Thường')),...(isNotifySource?{type:notifyType,source:'Nhập thủ công'}:{}),target:{type:'record',id}});
 let scenarioNote='';
 const pending=window.__pendingAssignmentScenario;
 if(pending){
 const s=scenarioTemplates()[pending.key];
 if(s){ const created=applyScenarioTasksToRecord(r,pending.key,pending.checked); r.selectedScenario=pending.key; r.history.push({time:new Date().toLocaleString('vi-VN'),text:`Áp dụng ${s.title} ngay khi phát hành, tạo ${created} nhiệm vụ nhánh.`}); scenarioNote=` Đã tạo ${created} nhiệm vụ nhánh theo kịch bản "${s.title}".`; }
 window.__pendingAssignmentScenario=null;
 }
 pushActionLog({category:'assign',icon:notiIcon,title:isNotifySource?`Notify & giao nhiệm vụ: ${title}`:`Giao nhiệm vụ: ${title}`,sub:`${id} → ${unit} · Ưu tiên ${r.importance} · Khẩn ${r.urgency} · Hạn ${r.due||'—'}`,detail:`Lĩnh vực: ${field}${docType?` · Loại VB: ${docType}`:''}${coordinators.length?` · Phối hợp: ${coordinators.join(', ')}`:''}${linkedDocIds.length?` · Kèm ${linkedDocIds.length} văn bản liên kết`:''}${isNotifySource?` · Notify: ${notifyType} (mức ${notifyLevel})`:''}${scenarioNote}`,role,soId:t.soId,xaId:t.xaId,target:{type:'record',id}});
 closeModal(); renderAll(); openRecordDetail(id,null,returnFieldId); toast(isNotifySource?`Đã tạo notify "${notifyType}" và giao nhiệm vụ xử lý xuống ${unit}.${scenarioNote}`:`Đã phát hành nhiệm vụ và lưu file đính kèm (nếu có) vào trình duyệt.${scenarioNote}`);
 }

