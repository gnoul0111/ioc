 /* ============================== ĐĂNG NHẬP / ĐỒNG HỒ / LỆNH NHANH ============================== */
 function wardNames(){return gdUnitData.map(u=>u[0]);}
 /* Combobox "cây tổ chức" duy nhất thay wizard 3 bước (chọn cấp/loại tài khoản/đơn vị) trước đây — dựng LƯỜI
 (children là hàm, chỉ gọi khi mở nhánh hoặc khi tìm kiếm) vì nhánh 126 xã/phường có hàng trăm nút con.
 Tái dùng nguyên dữ liệu đã có cho cây "Cơ cấu tổ chức" của sidebar sau đăng nhập (TW_ORG_TREE/TW_AXIS_META/
 twAccounts, cityOfficeList/categorySeed.UBND/XA_CATEGORIES_BY_ROLE) — không tạo dữ liệu mới, chỉ đổi cách chọn.
 Mỗi node: {type:'branch'} chỉ nhóm/xổ; {type:'account',user} vừa đăng nhập thẳng vừa xổ được; {type:'office',
 officeId,wardIdx?} -> ban-<officeId> hoặc xaban-<wardIdx>-<officeId>; {type:'so',soId} -> so-<soId>;
 {type:'ward',wardIdx} -> xa-<wardIdx>. Khớp đúng 5 tiền tố username mà login() đã xử lý sẵn, không đổi login(). */
 /* Cây chỉ có 1 gốc duy nhất: "Trung ương" (cấp 1). Cấp 2 (con trực tiếp của Trung ương) gồm 6 mục: 5 khối
 (Chủ tịch nước/BCH TW Đảng/Quốc hội/Chính phủ/MTTQ TW) + "Thành phố". "Thành phố" giờ là 1 nhóm chung (không
 còn gắn thẳng tài khoản danguy như trước) — xổ ra 2 nhóm theo TW_CITY_GROUPS (Thành phố trực thuộc Trung
 ương / Tỉnh, Thành phố không trực thuộc Trung ương), mỗi nhóm liệt kê tên tỉnh/thành. Chỉ "Hà Nội" có tài
 khoản thật (dùng lại đúng cây Thành ủy/HĐND/UBND/MTTQ/126 xã-phường cũ) — 33 tỉnh/thành còn lại chỉ là tên,
 bấm vào không chọn được tài khoản (xem selectAcctNode: acctLeafUsername trả về null với node không có
 user/officeId/soId/wardIdx thì toast báo "chưa có dữ liệu" thay vì im lặng không phản hồi). */
 /* Tài khoản đăng nhập trực tiếp (nếu có) ứng với 1 officeRole trục/khối — dùng để quyết định 1 node cây gốc
 chung (orgTreeRoot()) có nên trở thành node bấm-đăng-nhập-được (type:'account') hay chỉ là nhóm để xổ. */
 function orgAccountForRole(role){
 if(isTwRole(role)) return Object.values(twAccounts).find(a=>a.role===role)||null;
 const key={DANG:'danguy',HDND:'hdnd',UBND:'ubnd',MTTQ:'mttq'}[role];
 return key?accounts[key]:null;
 }
 /* Bọc 1 node của cây cơ cấu tổ chức chung (orgTreeRoot(), xem central-level.js) thành đúng khuôn node của combobox
 đăng nhập ({type,label,user/officeId/soId/wardIdx,children}, xem acctLeafUsername) — KHÔNG tự dựng lại cây riêng
 như trước (trước đây loginAccountTree() tự viết lại gần như nguyên cây sidebar, dễ lệch nhau khi 1 bên đổi mà
 quên đổi bên kia). */
 function loginWrapNode(n){
 if(n.type==='ward') return {type:'ward', label:n.label, wardIdx:Number(n.xaId), children:n.children?()=>n.children().map(loginWrapNode):null};
 if(n.type==='so') return {type:'so', label:n.label, soId:n.soId||n.key};
 if(n.type==='office') return {type:'office', label:n.label, officeId:n.officeId, wardIdx:n.xaId!=null?Number(n.xaId):(n.wardIdx!=null?n.wardIdx:undefined), children:n.children?()=>n.children().map(loginWrapNode):null};
 /* Nhãn chỉ ghi "Hà Nội" (không kèm "(Thành ủy)") vì node này gộp chung cả 4 trục (Đảng ủy/HĐND/UBND/MTTQ) của
 thành phố — gắn tên riêng 1 trục vào đây từng khiến tìm kiếm "thành ủy" kéo theo mọi Sở/ban thuộc cả 3 trục
 còn lại (VD "Sở Công Thương" thuộc UBND) dù chúng chẳng liên quan gì đến Thành ủy. Bấm thẳng vào đây vẫn mặc
 định đăng nhập tài khoản Thành ủy (user:'danguy') như trước, chỉ đổi cách hiển thị tên. */
 if(n.type==='city') return {type:'account', label:'Hà Nội', user:'danguy', children:n.children?()=>n.children().map(loginWrapNode):null};
 if(n.type==='placeholder') return {type:'branch', label:n.label};
 const acc=n.officeRole?orgAccountForRole(n.officeRole):null;
 if(acc) return {type:'account', label:n.label, user:acc.user, children:n.children?()=>n.children().map(loginWrapNode):null};
 return {type:'branch', label:n.label, children:n.children?()=>n.children().map(loginWrapNode):null};
 }
 function loginAccountTree(){
 return [
 {type:'account', label:'Trung ương', user:'tw', children:()=>orgTreeRoot().map(loginWrapNode)}
 ];
 }
 function acctLeafUsername(node){
 if(node.type==='account') return node.user;
 if(node.type==='office') return node.wardIdx!=null?`xaban-${node.wardIdx}-${node.officeId}`:`ban-${node.officeId}`;
 if(node.type==='so') return `so-${node.soId}`;
 if(node.type==='ward') return `xa-${node.wardIdx}`;
 return null;
 }
 let acctSeq=0; window.__acctNodes={};
 function acctNodeHtml(node){
 const hasChildren=typeof node.children==='function';
 const isSelectable=node.type!=='branch';
 const id=acctSeq++; window.__acctNodes[id]=node;
 if(!hasChildren){
 /* Không có nhánh con thì vẫn chừa đúng khoảng trống bằng nút mũi tên (span rỗng cùng kích thước .acct-caret-btn)
 để thẳng hàng với các mục anh em CÓ mũi tên — nếu không, mục này bị lùi trái, trông như 1 tiêu đề nhóm đứng
 trên thay vì ngang hàng (VD "Trung ương" đứng cạnh 6 mục khác đều có mũi tên xổ). */
 return `<div class="acct-node"><div class="acct-row"><span class="acct-caret-btn" style="cursor:default" aria-hidden="true"></span><button type="button" class="acct-main" onclick="selectAcctNode(${id},this)">${esc(node.label)}</button></div></div>`;
 }
 const childId='acctc'+id;
 if(isSelectable){
 return `<div class="acct-node"><div class="acct-row"><button type="button" class="acct-caret-btn" onclick="acctToggle(this,${id},'${childId}')"><span class="acct-caret">▸</span></button><button type="button" class="acct-main" onclick="selectAcctNode(${id},this)">${esc(node.label)}</button></div><div class="acct-children" id="${childId}"></div></div>`;
 }
 /* Node "branch" có con (VD "126 xã/phường", "Thành phố") KHÔNG chọn được tài khoản trực tiếp, nhưng vẫn phải
 dùng ĐÚNG khuôn 2 nút tách rời (caret riêng + main riêng) như node "account" ở trên — nếu gộp chung 1 nút
 full-width như trước sẽ lệch canh (thụt trái so với các dòng khác) và nền hover phủ khác vùng, trông như
 style bị lỗi khi đứng cạnh các mục account/branch khác trong cùng danh sách. */
 return `<div class="acct-node"><div class="acct-row"><button type="button" class="acct-caret-btn" onclick="acctToggle(this,${id},'${childId}')"><span class="acct-caret">▸</span></button><button type="button" class="acct-main" onclick="acctToggle(this.previousElementSibling,${id},'${childId}')">${esc(node.label)}</button></div><div class="acct-children" id="${childId}"></div></div>`;
 }
 function acctToggle(btn,id,childId){
 const box=document.getElementById(childId); if(!box) return;
 const caret=btn.querySelector('.acct-caret');
 const willOpen=!box.classList.contains('open');
 if(willOpen&&!box.dataset.rendered){
 const node=window.__acctNodes[id]; const children=node.children?node.children():[];
 box.innerHTML=children.length?children.map(acctNodeHtml).join(''):'<div class="acct-empty">Chưa có đơn vị con.</div>';
 box.dataset.rendered='1';
 }
 box.classList.toggle('open',willOpen);
 if(caret) caret.classList.toggle('open',willOpen);
 }
 function selectAcctNode(id,btn){
 const node=window.__acctNodes[id]; if(!node) return;
 const uname=acctLeafUsername(node);
 if(!uname){toast('Chưa có tài khoản/dữ liệu cho đơn vị này — chờ cập nhật ở bản tiếp theo.');return;}
 document.getElementById('username').value=uname;
 document.getElementById('password').value='123456';
 const label=document.getElementById('acctComboLabel');
 label.textContent=node.label; label.classList.remove('muted');
 document.querySelectorAll('#acctComboTree .active').forEach(b=>b.classList.remove('active'));
 if(btn) btn.classList.add('active');
 toggleAcctCombo(false);
 }
 function toggleAcctCombo(force){
 const combo=document.getElementById('acctCombo'); const panel=document.getElementById('acctComboPanel'); if(!combo||!panel) return;
 const open=force!=null?force:panel.classList.contains('hidden');
 if(open){
 panel.classList.remove('hidden'); combo.classList.add('open');
 const search=document.getElementById('acctSearch'); if(search) search.value='';
 acctSearchInput('');
 if(search) setTimeout(()=>search.focus(),30);
 } else {
 panel.classList.add('hidden'); combo.classList.remove('open');
 }
 }
 /* Làm phẳng toàn bộ cây 1 lần (kể cả nhánh chưa mở, gọi children() ngay) để ô tìm kiếm lọc xuyên suốt — kể cả
 126 xã/phường. Cache lại vì build 1 lần đủ dùng cả phiên (cây không đổi trong lúc đang ở màn đăng nhập). */
 function acctFlatten(){
 if(window.__acctFlatCache) return window.__acctFlatCache;
 const out=[];
 (function walk(nodes,path){
 nodes.forEach(n=>{
 const curPath=path.concat([n.label]);
 if(n.type!=='branch') out.push({node:n,path:curPath.join(' ▸ ')});
 if(typeof n.children==='function') walk(n.children(),curPath);
 });
 })(loginAccountTree(),[]);
 window.__acctFlatCache=out;
 return out;
 }
 function acctSearchInput(q){
 const box=document.getElementById('acctComboTree');
 const query=(q||'').trim().toLowerCase();
 if(!query){ box.innerHTML=loginAccountTree().map(acctNodeHtml).join(''); return; }
 /* Ưu tiên node có TÊN CHÍNH NÓ (leaf) khớp từ khóa lên đầu danh sách — tránh tình trạng từ khóa trùng tên 1 tổ
 tiên nào đó (VD tên 1 nhánh/khối lớn) kéo theo cả trăm node con cháu không thật sự liên quan lấn át đúng kết
 quả người dùng đang tìm. */
 const matches=acctFlatten()
 .filter(x=>x.path.toLowerCase().includes(query))
 .map(x=>({...x,leafHit:x.path.split(' ▸ ').pop().toLowerCase().includes(query)}))
 .sort((a,b)=>(b.leafHit?1:0)-(a.leafHit?1:0))
 .slice(0,80);
 box.innerHTML=matches.length?matches.map(m=>{
 const id=acctSeq++; window.__acctNodes[id]=m.node;
 const parts=m.path.split(' ▸ '); const leafLabel=parts.pop();
 return `<div class="acct-node"><button type="button" class="acct-row acct-leaf" onclick="selectAcctNode(${id},this)"><div class="acct-leaf-main"><span class="acct-leaf-label">${esc(leafLabel)}</span>${parts.length?`<span class="acct-path">${esc(parts.join(' ▸ '))}</span>`:''}</div></button></div>`;
 }).join(''):'<div class="acct-empty">Không tìm thấy tài khoản/đơn vị phù hợp.</div>';
 }
 document.addEventListener('click',function(e){
 const combo=document.getElementById('acctCombo'); if(!combo||combo.contains(e.target)) return;
 toggleAcctCombo(false);
 });
 document.addEventListener('click',function(e){
 const combo=document.getElementById('ouaRealLoginCombo'); if(!combo||combo.contains(e.target)) return;
 const box=document.getElementById('ouaRealLoginResults'); if(box) box.classList.add('hidden');
 });
 function resetLoginCombo(){
 document.getElementById('username').value=''; document.getElementById('password').value='';
 const label=document.getElementById('acctComboLabel'); if(label){label.textContent='— Chọn tài khoản theo cây tổ chức —'; label.classList.add('muted');}
 document.querySelectorAll('#acctComboTree .active').forEach(b=>b.classList.remove('active'));
 toggleAcctCombo(false);
 }
 function initLogin(){
 initData();
 resetLoginCombo();
 setInterval(updateClock,1000); updateClock();
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openQuickCommand()}})
 document.addEventListener('keydown',e=>{if(e.key==='Enter' && !document.getElementById('loginScreen').classList.contains('hidden')){e.preventDefault();login()}})
 }
 function enterApp(account,role,soId,xaId,officeId){
 currentAccount=account; currentRole=role; currentSoId=soId||null; currentXaId=(xaId!=null&&xaId!=='')?String(xaId):null; currentOfficeId=officeId||null;
 activeMetric='received'; activeIndicatorRole=role; activeCategoryRole=(currentXaId!=null&&!soId&&typeof CTM_XA_ALL_TAB!=='undefined'&&CTM_XA_ALL_TAB)?'ALL':(soId||currentXaId)?'UBND':((role==='DANG'||role==='TW_ALL')?'ALL':role);
 document.getElementById('loginScreen').classList.add('hidden');
 document.getElementById('app').classList.remove('hidden');
 renderAll();
 if(typeof lhRecordLogin==='function') lhRecordLogin(account);
 const levelLabel=isTwRole(role)?'Cấp Trung ương':({1:'Cấp 04 trục',2:'Cấp sở/ngành',3:'Cấp xã/phường'}[myLevel()]);
 pushActionLog({category:'auth',icon:'',title:`${account.title} đăng nhập hệ thống`,sub:`${account.subtitle||''} · ${levelLabel} · Trục ${roleMeta(role).name||role}`,detail:`Tài khoản: ${account.user||account.title} · Vai trò: ${roleMeta(role).name||role}${soId?` · Sở/ngành: ${(categorySeed.UBND||[]).find(c=>c.id===soId)?.name||soId}`:''}${currentXaId?` · Xã/phường: ${wardNames()[Number(currentXaId)]||currentXaId}`:''}`});
 toast((soId||currentXaId)?`Đăng nhập ${account.title}. Chỉ hiển thị dữ liệu chỉ tiêu/lĩnh vực của đơn vị này.`:`Đăng nhập ${account.title}. Áp dụng phân quyền dữ liệu theo tài khoản.`);
 }
 function login(){
 const u=document.getElementById('username').value.trim().toLowerCase();
 const p=document.getElementById('password').value;
 if(u.startsWith('so-')){
 const soId=u.slice(3);
 const cat=(categorySeed.UBND||[]).find(c=>c.id===soId);
 if(!cat||p!=='123456'){if(cat) loginFailed(u); toast('Vui lòng chọn một sở/ngành hợp lệ và dùng mật khẩu 123456.');return}
 enterApp({user:u, pass:'123456', role:'UBND', title:cat.name, subtitle:'Tài khoản Sở/ngành · Chỉ xem dữ liệu chỉ tiêu/lĩnh vực của đơn vị mình', icon:''},'UBND',soId,null);
 return;
 }
 if(u.startsWith('xaban-')){
 const m=u.match(/^xaban-(\d+)-(.+)$/);
 const idx=m?Number(m[1]):NaN; const officeId=m?m[2]:''; const wardName=wardNames()[idx];
 let found=null;
 if(wardName){ for(const role of ['DANG','HDND','UBND','MTTQ']){ const cat=(XA_CATEGORIES_BY_ROLE[role]||[]).find(c=>c.id===officeId); if(cat){found={role,cat};break} } }
 if(!found||p!=='123456'){if(found) loginFailed(u); toast('Vui lòng chọn một phòng/ban trong xã/phường hợp lệ và dùng mật khẩu 123456.');return}
 enterApp({user:u, pass:'123456', role:found.role, title:`${found.cat.name} · ${wardName}`, subtitle:'Tài khoản phòng/ban xã/phường · Chỉ xem dữ liệu chỉ tiêu của đơn vị mình', icon:''},found.role,null,idx,officeId);
 return;
 }
 if(u.startsWith('xa-')){
 const idx=Number(u.slice(3)); const name=wardNames()[idx];
 if(!name||p!=='123456'){if(name) loginFailed(u); toast('Vui lòng chọn một xã/phường hợp lệ và dùng mật khẩu 123456.');return}
 enterApp({user:u, pass:'123456', role:'UBND', title:name, subtitle:'Tài khoản Xã/phường · Chỉ xem dữ liệu chỉ tiêu/lĩnh vực của đơn vị mình', icon:''},'UBND',null,idx);
 return;
 }
 if(u.startsWith('ban-')){
 const officeId=u.slice(4); const found=findOfficeCategory(officeId);
 if(!found||p!=='123456'){if(found) loginFailed(Object.values(twAccounts).find(a=>a.officeId===officeId)?.user||u); toast('Vui lòng chọn một phòng/ban hợp lệ và dùng mật khẩu 123456.');return}
 /* Nếu officeId này trùng với officeId đã gắn sẵn trên 1 tài khoản trục (VD twdang -> tw-dang-btc) thì tái dùng
 THẲNG account đó — 2 lối vào (trục & phòng/ban) phải cùng trỏ về 1 account object duy nhất, không tự dựng
 2 object riêng rồi tìm cách làm chúng giống nhau. */
 const axisAcc=Object.values(twAccounts).find(a=>a.officeId===officeId);
 const acc=axisAcc||{user:u, pass:'123456', role:found.role, title:found.cat.name, subtitle:`Tài khoản phòng/ban · Chỉ xem dữ liệu chỉ tiêu của đơn vị mình`, icon:roleMeta(found.role).icon||''};
 enterApp(acc,found.role,null,null,officeId);
 return;
 }
 const acc=accounts[u]||twAccounts[u];
 if(!acc||acc.pass!==p){if(acc) loginFailed(acc.user||u); toast('Sai tài khoản hoặc mật khẩu demo. Dùng 123456.');return}
 enterApp(acc,acc.role,null,null,acc.officeId||null);
 }
 /* Đúng tài khoản nhưng sai mật khẩu → ghi 1 lượt "Sai mật khẩu" vào nhật ký đăng nhập của tài khoản đó (login-history.js). */
 function loginFailed(user){if(typeof lhRecordFailedLogin==='function') lhRecordFailedLogin(user);}
 function logout(){
 if(currentAccount) pushActionLog({category:'auth',icon:'',title:`${currentAccount.title} đăng xuất hệ thống`,sub:`Kết thúc phiên làm việc · Trục ${roleMeta(currentRole).name||currentRole}`,detail:`Tài khoản: ${currentAccount.user||currentAccount.title} · Đăng xuất chủ động.`});
 if(typeof closeLoginHistory==='function'){closeLoginHistory();toggleAccountMenu(false);}
 currentAccount=null;currentRole=null;currentSoId=null;currentXaId=null;currentOfficeId=null;window.__homeScope=null;window.__viewingLabel=null;window.__viewingIcon=null;closePanels();document.getElementById('app').classList.add('hidden');document.getElementById('loginScreen').classList.remove('hidden');resetLoginCombo();
 if(typeof btctwEmbedSync==='function') btctwEmbedSync()
 }
 function updateClock(){
 const d=new Date();
 const timeStr=`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
 const dateStr=d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
 document.getElementById('clock').textContent=timeStr;
 document.getElementById('dateText').textContent=dateStr;
 }
 function openQuickCommand(){
 if(guardAction('mở lệnh nhanh điều hành'))return;
 document.getElementById('modalTitle').textContent='Lệnh nhanh IOC/CAD';document.getElementById('modalSub').textContent='';
 document.getElementById('modalBody').innerHTML=`<div class="field"><label>Nhập lệnh</label><input id="quickInput" placeholder="Ví dụ: mở nhiệm vụ bị thu hồi UBND, giao việc TTHC, văn bản đến sắp quá hạn..." autofocus /></div><div class="action-bar"><button class="primary" onclick="runQuick()">Chạy lệnh</button><button class="ghost" onclick="setMetric('assigned');closeModal()">Mở nhiệm vụ giao</button><button class="ghost" onclick="setMetric('received');closeModal()">Mở nhiệm vụ nhận</button><button class="ghost" onclick="openList({metric:null,status:'revoked',title:'Tất cả hồ sơ bị thu hồi'})">Mở thu hồi</button></div>`;openModal();setTimeout(()=>document.getElementById('quickInput')?.focus(),80)
 }
 function runQuick(){const q=(document.getElementById('quickInput')?.value||'').toLowerCase(); if(q.includes('giao')) openAssignmentForm(); else if(q.includes('thu hồi')) openList({metric:null,status:'revoked',title:'Kết quả lệnh nhanh: thu hồi'}); else if(q.includes('văn bản đến')) {setMetric('docIn');closeModal()} else if(q.includes('nhiệm vụ nhận')) {setMetric('received');closeModal()} else {toast('Lệnh demo đã được ghi nhận. Gợi ý: "giao", "thu hồi", "văn bản đến", "nhiệm vụ nhận".')}}

 /* ===== Đăng nhập bằng tài khoản người dùng THẬT (ouaRealUserRows, xem js/oua-data.js/account-data.js) =====
    Hệ thống đăng nhập chính chỉ có tài khoản theo ĐƠN VỊ/CHỨC DANH (accounts/twAccounts/categorySeed.UBND/
    XA_CATEGORIES_BY_ROLE), không có tài khoản theo TỪNG NGƯỜI. Vì vậy không tạo 12.577 tài khoản mới — chỉ MAP
    mỗi người thật sang ĐÚNG tài khoản đơn vị đã có sẵn (nhiều người cùng đơn vị sẽ cùng vào 1 dashboard đơn vị
    đó, đúng bản chất "phân quyền theo đơn vị" hiện tại của app, chưa phải phân quyền theo từng cá nhân). */
 function ouaNormalizeVn(s){
 return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[-\/]/g,' ').replace(/\s+/g,' ').trim();
 }
 /* 4 đơn vị gốc cấp Thành phố trong account.json có org id CỐ ĐỊNH (490.695/1775/698/1790) — map thẳng bằng id
    cho chắc chắn, không dò theo tên (tên có thể đổi/khác dấu qua các lần đồng bộ dữ liệu thật). */
 const OUA_AXIS_ROOT_ORGID_TO_ACCOUNT={695:'danguy',1775:'hdnd',698:'ubnd',1790:'mttq'};
 function ouaMatchSoId(orgName){
 const target=ouaNormalizeVn(String(orgName||'').replace(/\(.*?\)/g,''));
 const cat=(categorySeed.UBND||[]).find(c=>ouaNormalizeVn(String(c.name||'').replace(/\(.*?\)/g,''))===target);
 return cat?cat.id:null;
 }
 /* Tên đơn vị của người thật luôn có tên xã/phường ở CUỐI chuỗi (vd "Phòng Văn hóa - Xã hội Phường Hoàn Kiếm")
    — so khớp bằng endsWith với wardNames() thay vì dò từ khóa "Xã"/"Phường" (dễ trúng nhầm cụm "Xã hội"). */
 function ouaMatchWardIdx(orgName){
 const target=ouaNormalizeVn(orgName);
 const names=wardNames();
 for(let i=0;i<names.length;i++){ if(target.endsWith(ouaNormalizeVn(names[i]))) return i; }
 return null;
 }
 function ouaResolveLoginUsername(realUser){
 if(OUA_AXIS_ROOT_ORGID_TO_ACCOUNT[realUser.orgId]) return OUA_AXIS_ROOT_ORGID_TO_ACCOUNT[realUser.orgId];
 const orgName=realUser.orgName||'';
 if(/^Sở /.test(orgName)){ const soId=ouaMatchSoId(orgName); if(soId) return 'so-'+soId; }
 const wardIdx=ouaMatchWardIdx(orgName);
 if(wardIdx!=null) return 'xa-'+wardIdx;
 const fallbackByAxis={DANG:'danguy',HDND:'hdnd',UBND:'ubnd',MTTQ:'mttq'};
 if(realUser.axis && fallbackByAxis[realUser.axis]) return fallbackByAxis[realUser.axis];
 return null;
 }
 function ouaRealLoginSearchInput(q){
 const box=document.getElementById('ouaRealLoginResults'); if(!box) return;
 const query=(q||'').trim().toLowerCase();
 if(!query){ box.innerHTML=''; box.classList.add('hidden'); return; }
 box.classList.remove('hidden');
 const pool=(typeof ouaRealUserRows!=='undefined'&&ouaRealUserRows)?ouaRealUserRows:[];
 const matches=pool.filter(u=>(u.name||'').toLowerCase().includes(query)||(u.orgName||'').toLowerCase().includes(query)).slice(0,20);
 if(!matches.length){ box.innerHTML='<div class="acct-empty">Không tìm thấy người dùng phù hợp.</div>'; return; }
 box.innerHTML=matches.map(u=>{
 const uname=ouaResolveLoginUsername(u);
 return `<div class="acct-node"><button type="button" class="acct-row acct-leaf" onclick="ouaRealLoginSelect('${u.id}')"><div class="acct-leaf-main"><span class="acct-leaf-label">${esc(u.name||'—')}</span><span class="acct-path">${esc(u.orgName||'—')}${uname?'':' · chưa map được tài khoản'}</span></div></button></div>`;
 }).join('');
 }
 function ouaRealLoginSelect(userId){
 const pool=(typeof ouaRealUserRows!=='undefined'&&ouaRealUserRows)?ouaRealUserRows:[];
 const u=pool.find(x=>String(x.id)===String(userId));
 if(!u) return;
 const uname=ouaResolveLoginUsername(u);
 if(!uname){ toast(`Chưa map được tài khoản đăng nhập cho "${u.name}" (đơn vị: ${u.orgName||'—'}).`); return; }
 document.getElementById('username').value=uname;
 document.getElementById('password').value='123456';
 const box=document.getElementById('ouaRealLoginResults'); if(box){ box.innerHTML=''; box.classList.add('hidden'); }
 const search=document.getElementById('ouaRealLoginSearch'); if(search) search.value='';
 login();
 }

