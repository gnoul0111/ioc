 /* ============================== GIAO NHIỆM VỤ / CHỌN VĂN BẢN ============================== */
 function generateTaskCode(){const y=new Date().getFullYear();const rnd=Math.floor(10000+Math.random()*90000);return `${y}-${rnd}`}
 /* Chuẩn hoá ngày về định dạng yyyy-mm-dd cho <input type=date>: dữ liệu cũ có thể ở dd/mm/yyyy hoặc đã là yyyy-mm-dd. */
 function toISODate(s){
 if(!s) return '';
 if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
 const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
 return m?`${m[3]}-${m[2]}-${m[1]}`:'';
 }
 /* yyyy-mm-dd (giá trị <input type=date>) → dd/mm/yyyy — định dạng lưu thống nhất với dữ liệu demo và nhiệm vụ nhánh. */
 function isoToDMY(v){ return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v.split('-').reverse().join('/'):(v||''); }
 /* Hôm nay dạng yyyy-mm-dd theo giờ máy (không dùng toISOString vì lệch UTC → sáng sớm ở VN ra ngày hôm qua). */
 function todayISO(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
 /* Chặn ở mọi form tạo/sửa nhiệm vụ (chính + nhánh + kịch bản): (1) không chọn ngày quá khứ, (2) hạn xử lý không
 trước ngày bắt đầu. Khi SỬA truyền origStart/origDue (giá trị đang lưu): giữ nguyên ngày cũ thì cho qua dù đã ở
 quá khứ (nhiệm vụ đã bắt đầu/đã quá hạn từ trước), chỉ chặn khi ĐỔI sang ngày quá khứ. Giá trị <input type=date>
 là yyyy-mm-dd nên so sánh chuỗi là đúng thứ tự ngày. */
 function validDateRange(startId,dueId,origStart,origDue){
 const s=document.getElementById(startId)?.value||'', d=document.getElementById(dueId)?.value||'', today=todayISO();
 const fail=(id,msg)=>{ toast(msg); document.getElementById(id).focus(); return false; };
 if(s&&s<today&&s!==toISODate(origStart||'')) return fail(startId,'Ngày bắt đầu không được chọn ngày trong quá khứ.');
 if(d&&d<today&&d!==toISODate(origDue||'')) return fail(dueId,'Hạn xử lý không được chọn ngày trong quá khứ.');
 if(s&&d&&d<s) return fail(dueId,'Hạn xử lý không được trước ngày bắt đầu.');
 return true;
 }
 /* Lịch chọn ngày: không cho chọn trước hôm nay (form tạo mới), hoặc trước ngày cũ nếu ngày cũ đã ở quá khứ (form sửa). */
 function dateMinAttr(orig){ const o=toISODate(orig||''), t=todayISO(); return (o&&o<t)?o:t; }
 /* Đổi ngày bắt đầu thì lịch hạn xử lý không cho chọn trước ngày đó (và không trước mốc sàn ban đầu của ô hạn). */
 function syncDueMin(startId,dueId){
 const a=document.getElementById(startId), b=document.getElementById(dueId); if(!a||!b) return;
 if(b.dataset.floor===undefined) b.dataset.floor=b.min||'';
 const floor=b.dataset.floor; b.min=(a.value&&a.value>floor)?a.value:floor;
 }
 /* Modal xác nhận dùng chung cho các thao tác xóa (thay cho confirm() gốc, giữ đúng phong cách giao diện). */
 function openDeleteConfirm(title,message,onConfirm){
 document.getElementById('modalTitle').textContent=title;
 document.getElementById('modalSub').textContent='';
 document.getElementById('modalBody').innerHTML=`<div class="access-lock">${message}</div><div class="action-bar" style="margin-top:14px"><button class="ghost danger-btn" onclick="${onConfirm}">Xác nhận xóa</button><button class="ghost" onclick="closeModal()">Hủy</button></div>`;
 openModal();
 }
 function handleAssignmentFiles(input){
 const files=Array.from(input.files||[]);
 window.__assignmentFiles=window.__assignmentFiles||[];
 let remaining=files.length;
 if(!remaining){renderAssignmentFileList();return}
 files.forEach(f=>{const reader=new FileReader();reader.onload=()=>{window.__assignmentFiles.push({name:f.name,dataUrl:reader.result});remaining--;if(remaining===0)renderAssignmentFileList()};reader.readAsDataURL(f)});
 }
 function renderAssignmentFileList(){const box=document.getElementById('assFileList');if(!box)return;box.innerHTML=(window.__assignmentFiles||[]).map(f=>` ${f.name}`).join('<br/>')||'Chưa có file đính kèm.'}
 function filterUnitChecklist(searchId,boxId){const q=(document.getElementById(searchId).value||'').trim().toLowerCase();document.getElementById(boxId).querySelectorAll('label.unit-check-row').forEach(l=>{l.style.display=l.dataset.name.includes(q)?'flex':'none'})}
 function toggleUnitDropdown(id){const el=document.getElementById(id);const willOpen=el.classList.contains('hidden');document.querySelectorAll('.ms-dropdown').forEach(d=>d.classList.add('hidden'));if(willOpen)el.classList.remove('hidden')}
 /* Combobox tự dựng thay cho <select> gốc — dùng cho các ô lựa chọn ngắn (Mức độ quan trọng, Độ khẩn...) để đồng nhất
 100% với các dropdown khác trong form (kể cả màu highlight khi hover/chọn), vì bảng lựa chọn của <select> gốc do
 trình duyệt/hệ điều hành tự vẽ, CSS không can thiệp được. Vẫn giữ 1 input ẩn cùng id để code đọc .value như cũ. */
 function simpleSelectHtml(id,options,selected){
 return `<div class="ms-wrap" style="position:relative"><input type="hidden" id="${id}" value="${esc(selected)}" /><div onclick="toggleUnitDropdown('${id}Dropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:12px;padding:12px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;color:#d0e8f8"><span id="${id}TriggerText">${esc(selected)}</span><span class="combo-caret" style="position:static"></span></div><div id="${id}Dropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)">${options.map(o=>`<div class="field-opt-row" style="padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px" onclick="selectSimpleOption('${id}','${esc(o)}')">${esc(o)}</div>`).join('')}</div></div>`;
 }
 function selectSimpleOption(id,val){
 document.getElementById(id).value=val;
 const t=document.getElementById(id+'TriggerText'); if(t)t.textContent=val;
 const dd=document.getElementById(id+'Dropdown'); if(dd)dd.classList.add('hidden');
 }
 /* Hiển thị mỗi đơn vị/người phối hợp đã chọn thành 1 "chip" riêng (có nút × bỏ chọn nhanh), thay vì gộp chung
 1 câu dài nối dấu phẩy — tên mỗi lựa chọn vốn đã là 1 đường dẫn có dấu "/" (vd "Thành ủy / Ban Đô thị"), nối
 nhiều cái bằng dấu phẩy rất khó thấy ranh giới đâu là hết 1 đơn vị. */
 function updateUnitTriggerLabel(textId,boxId,placeholder){
 const textEl=document.getElementById(textId); if(!textEl) return;
 const checked=Array.from(document.querySelectorAll('#'+boxId+' input[type=checkbox]:checked'));
 textEl.dataset.boxId=boxId; textEl.dataset.placeholder=placeholder;
 if(!checked.length){
 textEl.classList.remove('unit-chip-wrap');
 textEl.textContent=placeholder;
 textEl.style.color='#8ab0c8';
 return;
 }
 textEl.style.color='#d0e8f8';
 textEl.classList.add('unit-chip-wrap');
 textEl.innerHTML=checked.map((c,i)=>`<span class="unit-chip">${esc(c.value)}<button type="button" class="unit-chip-x" data-idx="${i}" onclick="event.stopPropagation();uncheckUnitCoordChip(this)">×</button></span>`).join('');
 }
 /* Bấm × trên 1 chip: bỏ tick đúng checkbox tương ứng trong cây (kể cả khi cây đang đóng/đã lọc) rồi vẽ lại chip. */
 function uncheckUnitCoordChip(btn){
 const textEl=btn.closest('.unit-chip-wrap'); if(!textEl) return;
 const boxId=textEl.dataset.boxId, placeholder=textEl.dataset.placeholder;
 const checked=Array.from(document.querySelectorAll('#'+boxId+' input[type=checkbox]:checked'));
 const target=checked[Number(btn.dataset.idx)];
 if(target) target.checked=false;
 updateUnitTriggerLabel(textEl.id,boxId,placeholder);
 }
 /* Bản combobox tự dựng "đầy đủ" hơn simpleSelectHtml — dùng cho các ô lọc kiểu <select> có value khác label và
 danh sách dài (VD 126 xã/phường), thay cho <select> gốc để bảng lựa chọn không còn bị hệ điều hành tự vẽ (không
 đồng nhất giao diện). Vẫn giữ 1 input ẩn cùng id để mọi chỗ đọc .value hiện có (applyDrawerFilters...) không phải sửa gì. */
 /* pathSplit=true: label là đường dẫn phân cấp dài (VD "BCH Trung ương / BTC Trung ương / Văn phòng ban / Phòng
 Tổ chức - Cán bộ") — nếu in nguyên dòng thì chữ tự xuống dòng lung tung, mỗi option dài ngắn khác nhau, rất khó
 lướt nhanh xuống danh sách. Tách thành 2 dòng: tên đơn vị (đoạn cuối path) nổi bật ở trên 1 dòng cố định, đường
 dẫn tổ tiên nhỏ/mờ ở dưới — cùng cách đã áp dụng cho danh sách tìm tài khoản đăng nhập. */
 function customSelectHtml(id,options,selectedValue,placeholder,onchangeFn,pathSplit){
 const selectedOpt=options.find(o=>String(o.value)===String(selectedValue||''));
 const displayText=selectedOpt?selectedOpt.label:placeholder;
 const allOpts=[{value:'',label:placeholder},...options];
 const optsHtml=allOpts.map(o=>{
 const onclick=`selectCustomOption('${id}','${esc(o.value)}','${esc(o.label)}','${onchangeFn||''}')`;
 if(pathSplit&&o.value&&o.label.includes(' / ')){
 const parts=o.label.split(' / '); const leaf=parts.pop();
 return `<div class="field-opt-row field-opt-path-row" onclick="${onclick}"><div class="field-opt-leaf">${esc(leaf)}</div><div class="field-opt-path">${esc(parts.join(' / '))}</div></div>`;
 }
 return `<div class="field-opt-row" style="padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px" onclick="${onclick}">${esc(o.label)}</div>`;
 }).join('');
 /* Popup rộng tối thiểu 340px CHỈ áp dụng cho dropdown kiểu đường dẫn phân cấp (pathSplit, VD tên đơn vị dài
 "Vụ Địa phương II (tại Đà Nẵng...)") — nơi cần khoảng rộng để tên không bị cắt. Dropdown danh sách phẳng (trạng
 thái, lĩnh vực, loại...) nhãn vốn ngắn, ép rộng 340px không cần thiết và tràn ra ngoài khi cột lọc hẹp (nhiều ô
 lọc chung 1 hàng) — giữ đúng bề rộng cột (100%) cho các dropdown này. */
 const dropdownWidth = pathSplit ? 'max(100%,340px)' : '100%';
 return `<div class="ms-wrap" style="position:relative"><input type="hidden" id="${id}" value="${esc(selectedValue||'')}" /><div onclick="toggleUnitDropdown('${id}Dropdown')" style="width:100%;min-height:40px;border:1px solid rgba(87,178,255,.26);background:#05172b;border-radius:10px;padding:9px 30px 9px 10px;cursor:pointer;display:flex;align-items:center;overflow:hidden"><span id="${id}TriggerText" style="color:${selectedOpt?'#d0e8f8':'#8ab0c8'};font-size:13px;text-transform:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(displayText)}</span></div><span class="combo-caret" style="position:absolute;top:50%;right:10px;transform:translateY(-50%);pointer-events:none"></span><div id="${id}Dropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;width:${dropdownWidth};background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:260px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)">${optsHtml}</div></div>`;
 }
 function selectCustomOption(id,val,label,onchangeFn){
 document.getElementById(id).value=val;
 const t=document.getElementById(id+'TriggerText'); if(t){t.textContent=label;t.style.color='#d0e8f8';}
 const dd=document.getElementById(id+'Dropdown'); if(dd)dd.classList.add('hidden');
 if(onchangeFn&&typeof window[onchangeFn]==='function') window[onchangeFn]();
 }
 function onStatusFilterChange(){setDrawerPieStatus(document.getElementById('statusFilter').value);}
 document.addEventListener('click',function(e){document.querySelectorAll('.ms-wrap').forEach(wrap=>{if(!wrap.contains(e.target))wrap.querySelectorAll('.ms-dropdown').forEach(d=>d.classList.add('hidden'))})});
 function renderComboList(inputId,dropdownId,getBaseOptions,storeKey,query){
 const q=(query||'').trim().toLowerCase();
 const custom=JSON.parse(localStorage.getItem(storeKey)||'[]');
 const all=[...getBaseOptions(),...custom];
 const opts=q?all.filter(f=>f.toLowerCase().includes(q)):all;
 const box=document.getElementById(dropdownId);
 box.innerHTML=opts.length?opts.map(f=>`<div class="field-opt-row" style="padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px">${f}</div>`).join(''):'<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không tìm thấy, bấm + để thêm mới</div>';
 Array.from(box.children).forEach((el,i)=>{if(opts[i])el.onclick=()=>{document.getElementById(inputId).value=opts[i];box.classList.add('hidden')}});
 document.querySelectorAll('.ms-dropdown').forEach(d=>{if(d.id!==dropdownId)d.classList.add('hidden')});
 box.classList.remove('hidden');
 }
 function addComboOption(inputId,dropdownId,getBaseOptions,storeKey){
 const val=(document.getElementById(inputId).value||'').trim();
 if(!val){toast('Nhập giá trị trước khi thêm.');return}
 const all=[...getBaseOptions(),...JSON.parse(localStorage.getItem(storeKey)||'[]')];
 if(!all.some(f=>f.toLowerCase()===val.toLowerCase())){
 const custom=JSON.parse(localStorage.getItem(storeKey)||'[]'); custom.push(val); localStorage.setItem(storeKey,JSON.stringify(custom));
 toast(`Đã thêm: ${val}`);
 } else toast('Lĩnh vực/loại văn bản này đã có trong danh sách.');
 document.getElementById(dropdownId).classList.add('hidden');
 }
 const ASSIGN_FIELD_OPTIONS=['Cháy nổ','An toàn thực phẩm','Trật tự đô thị','Vệ sinh môi trường','Úng ngập đô thị','Văn hóa - thể thao','Giáo dục đào tạo','Nông nghiệp','Y tế','Tài chính','Nội vụ','Tư pháp','Công thương','Xây dựng','Khoa học công nghệ','Dân tộc tôn giáo','Du lịch','Quy hoạch kiến trúc','Khu công nghiệp','Khác'];
 function assFieldOptions(){return ASSIGN_FIELD_OPTIONS}
 function openAssFieldDropdown(){const input=document.getElementById('assFieldInput');renderComboList('assFieldInput','assFieldDropdown',assFieldOptions,'px-ioc-custom-fields-'+document.getElementById('assRole').value,'');input.select()}
 function filterAssField(){renderComboList('assFieldInput','assFieldDropdown',assFieldOptions,'px-ioc-custom-fields-'+document.getElementById('assRole').value,document.getElementById('assFieldInput').value)}
 function assDocTypeOptions(){return docTypeOptions}
 function openAssDocTypeDropdown(){const input=document.getElementById('assDocTypeInput');renderComboList('assDocTypeInput','assDocTypeDropdown',assDocTypeOptions,'px-ioc-custom-doctypes','');input.select()}
 function filterAssDocType(){renderComboList('assDocTypeInput','assDocTypeDropdown',assDocTypeOptions,'px-ioc-custom-doctypes',document.getElementById('assDocTypeInput').value)}
 function addAssDocType(){addComboOption('assDocTypeInput','assDocTypeDropdown',assDocTypeOptions,'px-ioc-custom-doctypes')}
 /* Nguồn văn bản dùng chung cho ô chọn văn bản, đúng bằng dữ liệu đang hiển thị ở dashboard (lọc theo phân quyền tài khoản). */
 function allDocumentRecords(){return records.filter(r=>(r.metric==='docIn'||r.metric==='docOut')&&canSeeRole(r.role));}
 function openDocPicker(){
 docPickerSelection=new Set((window.__selectedDocs||[]).map(d=>d.id));
 document.getElementById('docPickerSearch').value='';
 const roleSel=document.getElementById('docPickerRole');
 roleSel.innerHTML='<option value="">Tất cả trục</option>'+allowedRoles().map(r=>`<option value="${r}">${roleMeta(r).name}</option>`).join('');
 const typeSel=document.getElementById('docPickerType');
 const lock=window.__assignmentDocTypeLock;
 typeSel.value=lock||'';
 typeSel.disabled=!!lock;
 const lockNote=document.getElementById('docPickerLockNote');
 if(lockNote) lockNote.classList.toggle('hidden',!lock);
 renderDocPickerList();
 document.getElementById('docPickerOverlay').classList.add('show');
 document.getElementById('docPickerModal').classList.add('open');
 }
 function closeDocPicker(){document.getElementById('docPickerOverlay').classList.remove('show');document.getElementById('docPickerModal').classList.remove('open')}
 function renderDocPickerList(){
 const q=(document.getElementById('docPickerSearch').value||'').trim().toLowerCase();
 const typeFilter=document.getElementById('docPickerType').value;
 const roleFilter=document.getElementById('docPickerRole').value;
 const list=allDocumentRecords().filter(d=>(!typeFilter||d.metric===typeFilter)&&(!roleFilter||d.role===roleFilter)&&(!q||[d.code,d.title,d.summary].join(' ').toLowerCase().includes(q)));
 list.sort((a,b)=>parseDMY(b.created)-parseDMY(a.created));
 document.getElementById('docPickerTbody').innerHTML=list.length?list.map((d,i)=>`<tr><td class="tc"><input type="checkbox" ${docPickerSelection.has(d.id)?'checked':''} onchange="toggleDocPick('${d.id}',this.checked)"/></td><td class="tc">${i+1}</td><td class="tc"><span class="badge ${d.metric==='docIn'?'ok':'gold'}" title="${d.metric==='docIn'?'Văn bản đến':'Văn bản đi'}">${d.metric==='docIn'?' Đến':' Đi'}</span></td><td class="tc" title="${roleMeta(d.role).name}">${roleMeta(d.role).icon}</td><td class="mono" title="${d.code}">${d.code}</td><td class="wrap-cell">${d.title}</td><td class="wrap-cell">${d.summary}</td><td title="${d.signer||''}">${d.signer||''}</td><td title="${d.field||''}">${d.field||''}</td><td title="${d.issuer||''}">${d.issuer||''}</td><td class="tc">${d.created}</td><td class="tc"><button type="button" onclick="openDocDetail('${d.id}')" title="Xem chi tiết" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">→</button></td></tr>`).join(''):'<tr><td colspan="12">Không tìm thấy văn bản phù hợp.</td></tr>';
 }
 function toggleDocPick(id,checked){if(checked)docPickerSelection.add(id);else docPickerSelection.delete(id)}
 function openDocDetail(id){
 const d=records.find(x=>x.id===id); if(!d)return;
 document.getElementById('docDetailSub').textContent=d.code;
 document.getElementById('docDetailBody').innerHTML=`<div class="kv">
 <b>Loại</b><span>${d.metric==='docIn'?' Văn bản đến':' Văn bản đi'}</span>
 <b>Trục</b><span>${roleMeta(d.role).icon} ${roleMeta(d.role).name}</span>
 <b>Số/ký hiệu</b><span class="mono">${d.code}</span>
 <b>Tên văn bản</b><span>${d.title}</span>
 <b>Trích yếu</b><span>${d.summary||''}</span>
 <b>Loại văn bản</b><span>${d.docType||''}</span>
 <b>Lãnh đạo ký</b><span>${d.signer||''}</span>
 <b>Lĩnh vực</b><span>${d.field||''}</span>
 <b>Cơ quan ban hành</b><span>${d.issuer||''}</span>
 <b>Ngày văn bản</b><span>${d.created}</span>
 </div>`;
 document.getElementById('docDetailOverlay').classList.add('show');
 document.getElementById('docDetailModal').classList.add('open');
 }
 function closeDocDetail(){document.getElementById('docDetailOverlay').classList.remove('show');document.getElementById('docDetailModal').classList.remove('open')}
 function confirmDocPicker(){
 window.__selectedDocs=records.filter(d=>docPickerSelection.has(d.id));
 renderSelectedDocsList();
 closeDocPicker();
 toast(`Đã chọn ${window.__selectedDocs.length} văn bản.`);
 }
 function renderSelectedDocsList(){
 const box=document.getElementById('assDocsList'); if(!box)return;
 const docs=window.__selectedDocs||[];
 if(!docs.length){box.innerHTML='';return}
 box.innerHTML=`<table class="compact-table"><thead><tr><th>Loại</th><th>Mã văn bản</th><th>Tên văn bản</th><th>Trích yếu</th><th>Ngày văn bản</th><th></th></tr></thead><tbody>${docs.map(d=>`<tr><td>${d.metric==='docIn'?' Đến':' Đi'}</td><td class="mono">${d.code}</td><td>${d.title}</td><td>${d.summary||''}</td><td>${d.created}</td><td><button type="button" onclick="removeSelectedDoc('${d.id}')" title="Bỏ chọn" style="border:0;background:none;color:#ff6b6b;cursor:pointer;font-weight:900;font-size:15px;line-height:1">×</button></td></tr>`).join('')}</tbody></table>`;
 }
 function removeSelectedDoc(id){window.__selectedDocs=(window.__selectedDocs||[]).filter(d=>d.id!==id);renderSelectedDocsList()}
