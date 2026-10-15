 /* ============================== POPUP CHỌN ĐƠN VỊ NHẬN NHIỆM VỤ (cây cơ cấu tổ chức) ==============================
 Dựng cây trực tiếp từ assignableTreeNodes() (task-scope.js) — ĐÚNG cây cơ cấu tổ chức thật đang dùng cho cả
 sidebar/đăng nhập (xem central-level.js: hanoiCityNode()/orgTreeRoot()/TW_ORG_TREE), không còn danh sách
 Ban/Phòng GIẢ LẬP riêng như trước (khiến bấm "Ban Tổ chức Thành ủy" lúc giao việc bị gán nhầm cho cả trục
 Đảng ủy thay vì đúng ban đó). Chỉ còn danh sách lãnh đạo theo tên (AXIS_LEADERS) là tiện ích phụ, KHÔNG phải
 1 phần cơ cấu tổ chức thật — vẫn giữ lại, gắn thêm vào đúng nút trục gốc (Đảng ủy/HĐND/UBND/MTTQ) khi hiển thị. */
 const AXIS_LEADERS = {
 DANG:{label:'Lãnh đạo Thành ủy TP',names:['Bùi Thị Minh Hoài','Nguyễn Ngọc Tuấn','Nguyễn Lan Hương','Trần Sỹ Thanh','Đảng ủy Test']},
 HDND:{label:'Lãnh đạo HĐND TP',names:['Trần Thế Cương','Phạm Quí Tiên','Phạm Thị Thanh Mai','Phùng Thị Hồng Hà','HĐND Test']},
 UBND:{label:'Lãnh đạo UBND TP',names:['Trần Sỹ Thanh','Dương Đức Tuấn','Nguyễn Trọng Đông','Hà Minh Hải','Nguyễn Mạnh Quyền']},
 MTTQ:{label:'Lãnh đạo MTTQ TP',names:['Nguyễn Lan Hương','Đàm Văn Huân','Nguyễn Sỹ Trường','Trần Đình Thắng','Phạm Anh Tuấn']}
 };
 /* Khớp 1 node cây với đúng target (theo role+officeId+soId+xaId) trong mảng targets đã có sẵn từ assignableTargets(). */
 function matchTargetForNode(n,targets){
 if(!n.officeRole) return null;
 const nXa=n.xaId!=null?String(n.xaId):null;
 return targets.find(t=>t.role===n.officeRole&&(t.officeId||null)===(n.officeId||null)&&(t.soId||null)===(n.soId||null)&&(t.xaId!=null?String(t.xaId):null)===nXa)||null;
 }
 let unitPickerTreeData=[]; let unitPickerSeq=0;
 function buildUnitPickerTree(targets){
 const wrap=list=>(list||[]).map(n=>{
 const target=matchTargetForNode(n,targets);
 const kids=[];
 if(n.type!=='ward'&&typeof n.children==='function') kids.push(...wrap(n.children()));
 /* Nút trục gốc = có officeRole nhưng chưa xuống tới officeId/soId/xaId cụ thể (Đảng ủy/HĐND/UBND/MTTQ) —
 chỉ những nút này mới gắn thêm nhóm lãnh đạo theo tên, không lặp lại ở mọi đơn vị con bên trong trục. */
 const isAxisRoot=n.officeRole&&!n.officeId&&!n.soId&&n.xaId==null&&!isTwRole(n.officeRole);
 const leaders=isAxisRoot?AXIS_LEADERS[n.officeRole]:null;
 if(leaders) kids.push({label:leaders.label,target:null,children:leaders.names.map(name=>{
 const t={role:n.officeRole,soId:null,xaId:null,officeId:null,label:name};
 targets.push(t);
 return {label:name,target:t,children:null};
 })});
 return {label:n.label,target,children:kids.length?kids:null};
 });
 return wrap(assignableTreeNodes());
 }
 function unitPickerLabelArg(label){return esc(label).replace(/'/g,"\\'")}
 let unitPickerSelectedIdx=-1, unitPickerSelectedLabel='';
 /* ancestors: mảng tên các cấp cha (từ trục gốc xuống) — dùng để ghép thành đường dẫn đầy đủ kiểu
 "Đảng ủy Thành phố / Văn phòng Thành ủy / Phòng Quản trị" hiển thị ở ô "Đơn vị nhận nhiệm vụ" sau khi chọn,
 vì tên riêng 1 cấp (vd. chỉ "Phòng Quản trị") không đủ rõ đang thuộc trục/đơn vị nào. Tên hiển thị TRONG cây
 vẫn chỉ là tên ngắn của từng cấp (node.label), chỉ ô kết quả sau khi chọn mới dùng đường dẫn đầy đủ. */
 function unitPickerNodeHtml(node,expandAll,ancestors){
 ancestors=ancestors||[];
 const hasChildren=Array.isArray(node.children)&&node.children.length;
 const idx=node.target?window.__assignTargets.indexOf(node.target):-1;
 const breadcrumb=ancestors.concat([node.label]).join(' / ');
 const labelArg=unitPickerLabelArg(breadcrumb);
 const selfSelected=idx>=0&&idx===unitPickerSelectedIdx&&breadcrumb===unitPickerSelectedLabel;
 const labelHtml=selfSelected?`<span class="snav-label" style="color:#ffd54b;font-weight:800">${esc(node.label)} </span>`:`<span class="snav-label">${esc(node.label)}</span>`;
 if(!hasChildren){
 return {html:`<div class="snav-node"><button type="button" class="snav-row snav-leaf" onclick="selectUnitPickerTarget(${idx},'${labelArg}')"><span class="snav-caret"></span><span class="snav-icon"></span>${labelHtml}</button></div>`,hasSelected:selfSelected};
 }
 const cid='upc'+(unitPickerSeq++);
 const childAncestors=ancestors.concat([node.label]);
 const childResults=node.children.map(c=>unitPickerNodeHtml(c,expandAll,childAncestors));
 const childHasSelected=childResults.some(r=>r.hasSelected);
 const nodeHasSelected=selfSelected||childHasSelected;
 const cls=(expandAll||childHasSelected)?' open':'';
 const inner=childResults.map(r=>r.html).join('');
 let html;
 if(idx>=0){
 html=`<div class="snav-node"><div class="snav-row snav-split"><button type="button" class="snav-caret-btn" onclick="unitPickerToggle(this,'${cid}')"><span class="snav-caret${cls}">▸</span></button><button type="button" class="snav-main" onclick="selectUnitPickerTarget(${idx},'${labelArg}')"><span class="snav-icon"></span>${labelHtml}</button></div><div class="snav-children${cls}" id="${cid}">${inner}</div></div>`;
 } else {
 html=`<div class="snav-node"><button type="button" class="snav-row" onclick="unitPickerToggle(this,'${cid}')"><span class="snav-caret${cls}">▸</span><span class="snav-icon"></span>${labelHtml}</button><div class="snav-children${cls}" id="${cid}">${inner}</div></div>`;
 }
 return {html,hasSelected:nodeHasSelected};
 }
 function unitPickerTreeHtml(nodes,expandAll){
 return nodes.map(node=>unitPickerNodeHtml(node,expandAll,[]).html).join('');
 }
 function unitPickerToggle(btn,id){
 const box=document.getElementById(id); if(!box)return;
 const caret=btn.querySelector('.snav-caret');
 const willOpen=!box.classList.contains('open');
 box.classList.toggle('open',willOpen);
 if(caret) caret.classList.toggle('open',willOpen);
 }
 function filterUnitTreeData(nodes,q){
 const res=[];
 nodes.forEach(n=>{
 const selfMatch=n.label.toLowerCase().includes(q);
 const filteredChildren=n.children?filterUnitTreeData(n.children,q):null;
 if(selfMatch||(filteredChildren&&filteredChildren.length)) res.push({label:n.label,target:n.target,children:selfMatch?n.children:filteredChildren});
 });
 return res;
 }
 function renderUnitPickerTree(q){
 unitPickerSeq=0;
 const query=(q||'').trim().toLowerCase();
 const nodes=query?filterUnitTreeData(unitPickerTreeData,query):unitPickerTreeData;
 document.getElementById('unitPickerTree').innerHTML=nodes.length?unitPickerTreeHtml(nodes,!!query):'<div class="access-lock">Không tìm thấy đơn vị phù hợp.</div>';
 }
 function filterUnitPicker(){renderUnitPickerTree(document.getElementById('unitPickerSearch').value)}

