 /* ============================== SIDEBAR CƠ CẤU TỔ CHỨC (4 cấp) ============================== */
 /* Cấp 1: Đảng ủy/MTTQ/UBND/HĐND/Xã-Phường (chỉ TK Thành ủy thấy đủ 5 nhánh).
 Cấp 2: Đảng ủy/HĐND/MTTQ → phòng/ban thật (lấy tên từ categorySeed, xem cityOfficeList); UBND → 17 sở thật
 (bấm mở đúng dashboard sở). Xã/Phường → 126 xã/phường thật. Cấp 3 (trong mỗi xã/phường): Đảng ủy/MTTQ/UBND/HĐND.
 Cấp 4: các đơn vị thật của từng trục trong xã/phường (lấy từ *_XA_CATEGORIES, xem XA_CATEGORIES_BY_ROLE).
 Cây được sinh LƯỜI (chỉ tính children khi người dùng bấm mở rộng) vì nhánh Xã/Phường có tới ~2.500 nút. */
 function snavIcon(type){return {branch:'',so:'',ward:'',office:'',placeholder:''}[type]||'';}
 /* Danh sách phòng/ban thật của 1 trục ở cấp Thành phố — mỗi phòng/ban là 1 node bấm được (xem theo/đăng nhập
 thẳng), khác hẳn "Văn phòng 1-8" giả lập trước đây. */
 function snavOfficeNodes(role,prefix){
 return cityOfficeList(role).map(c=>({label:c.name,type:'office',key:`${prefix}-${c.id}`,officeRole:role,officeId:c.id}));
 }
 /* 17 sở/ngành thật (categorySeed.UBND) dạng node — tách thành hàm riêng vì được dùng lặp lại ở nhiều nơi
 (sidebarTree, hanoiCityNode, trước đây mỗi nơi tự viết lại đúng 1 dòng map này). */
 function snavSoNodes(){
 return (categorySeed.UBND||[]).map(c=>({label:c.name,type:'so',key:c.id,officeRole:'UBND',soId:c.id}));
 }
 /* Danh sách đơn vị thật của 1 trục trong 1 xã/phường cụ thể — lấy từ *_XA_CATEGORIES tương ứng. */
 function snavWardOfficeNodes(role,wardIdx,prefix){
 return (XA_CATEGORIES_BY_ROLE[role]||[]).map(c=>({label:c.name,type:'office',key:`${prefix}-${c.id}`,officeRole:role,officeId:c.id,wardIdx}));
 }
 /* Nhánh của 1 xã/phường, lọc đúng theo trục của TÀI KHOẢN GỐC (restrictRole) — Đảng ủy được xem tất cả 4 trục
 (vì Đảng ủy giám sát toàn diện), các trục còn lại (HĐND/UBND/MTTQ) chỉ được xem đúng trục của mình ở cấp xã/phường. */
 function snavWardBranches(wardIdx,restrictRole){
 const all=[
 {label:'Đảng ủy',type:'branch',key:`w${wardIdx}-dang`,axisRole:'DANG',children:()=>snavWardOfficeNodes('DANG',wardIdx,`w${wardIdx}-dang`)},
 {label:'HĐND',type:'branch',key:`w${wardIdx}-hdnd`,axisRole:'HDND',children:()=>snavWardOfficeNodes('HDND',wardIdx,`w${wardIdx}-hdnd`)},
 {label:'UBND',type:'branch',key:`w${wardIdx}-ubnd`,axisRole:'UBND',children:()=>snavWardOfficeNodes('UBND',wardIdx,`w${wardIdx}-ubnd`)},
 {label:'MTTQ',type:'branch',key:`w${wardIdx}-mttq`,axisRole:'MTTQ',children:()=>snavWardOfficeNodes('MTTQ',wardIdx,`w${wardIdx}-mttq`)}
 ];
 if(!restrictRole||restrictRole==='DANG') return all;
 return all.filter(b=>b.axisRole===restrictRole);
 }
 /* Nhánh Xã/Phường dùng chung cho mọi trục — bấm vào 1 xã sẽ "xem thay" xã đó, nhưng cây con của xã chỉ hiện đúng
 trục của tài khoản gốc (sidebarHomeScope().role), không phải trục đang tạm xem. restrictRoleOverride dùng cho
 trường hợp duyệt vào Hà Nội từ cây Trung ương (home.role='TW_ALL'/TW_*, không phải 1 trong 4 trục Thành phố nên
 snavWardBranches lọc rỗng nếu không ép về null) — luôn xem đủ 4 trục giống hệt tài khoản Thành ủy. */
 function snavXaPhuongBranch(prefix,restrictRoleOverride){
 const hasOverride=arguments.length>1;
 return {label:'Xã/Phường',type:'branch',key:`${prefix}-xaphuong`,children:()=>wardNames().map((name,idx)=>({label:name,type:'ward',key:String(idx),officeRole:'UBND',xaId:String(idx),children:()=>snavWardBranches(idx,hasOverride?restrictRoleOverride:sidebarHomeScope().role)}))};
 }
 /* Phạm vi GỐC của tài khoản đang đăng nhập — dùng để dựng cây "Cơ cấu tổ chức" ổn định, KHÔNG đổi theo
 trạng thái đang "xem thay" 1 đơn vị khác (currentRole/currentSoId/currentXaId chỉ là trạng thái xem tạm thời). */
 function sidebarHomeScope(){
 return window.__homeScope || {role:currentRole,soId:currentSoId,xaId:currentXaId,officeId:currentOfficeId};
 }
 /* Toàn bộ logic "tài khoản này thấy nhánh nào" nay tập trung DUY NHẤT ở orgFindHomeChildren() (central-level.js)
 — đọc từ đúng 1 cây gốc chung (orgTreeRoot()/hanoiCityNode()) thay vì mỗi nơi (sidebar/login/giao nhiệm vụ/
 phối hợp) tự viết lại 1 phiên bản cây riêng. sidebarTree() chỉ còn việc lấy home scope rồi giao cho hàm chung. */
 function sidebarTree(){
 return orgFindHomeChildren(sidebarHomeScope());
 }
 let snavSeq=0;
 function snavMainAction(node){
 if(node.type==='so') return `snavViewAsSo('${node.key}')`;
 if(node.type==='ward') return `snavViewAsWard(${node.key})`;
 if(node.type==='office') return `snavViewAsOffice('${node.officeRole}','${node.officeId}'${node.wardIdx!=null?`,${node.wardIdx}`:''})`;
 if(node.type==='city') return `snavViewAsCity()`;
 return 'snavPlaceholderClick()';
 }
 function snavNodeHtml(node){
 const hasChildren=typeof node.children==='function';
 const isViewable=node.type==='so'||node.type==='ward'||node.type==='office'||node.type==='city';
 if(!hasChildren){
 return `<div class="snav-node"><button class="snav-row snav-leaf" onclick="${snavMainAction(node)}"><span class="snav-caret"></span><span class="snav-icon">${snavIcon(node.type)}</span><span class="snav-label">${esc(node.label)}</span></button></div>`;
 }
 const id='snav'+(snavSeq++);
 window.__snavFns[id]=node.children;
 if(isViewable){
 return `<div class="snav-node"><div class="snav-row snav-split"><button class="snav-caret-btn" onclick="snavToggle(this,'${id}')"><span class="snav-caret">▸</span></button><button class="snav-main" onclick="${snavMainAction(node)}"><span class="snav-icon">${snavIcon(node.type)}</span><span class="snav-label">${esc(node.label)}</span></button></div><div class="snav-children" id="${id}"></div></div>`;
 }
 return `<div class="snav-node"><button class="snav-row" onclick="snavToggle(this,'${id}')"><span class="snav-caret">▸</span><span class="snav-icon">${snavIcon(node.type)}</span><span class="snav-label">${esc(node.label)}</span></button><div class="snav-children" id="${id}"></div></div>`;
 }
 function snavToggle(btn,id){
 const box=document.getElementById(id); if(!box) return;
 const caret=btn.querySelector('.snav-caret');
 const willOpen=!box.classList.contains('open');
 if(willOpen&&!box.dataset.rendered){
 const fn=window.__snavFns[id]; const children=fn?fn():[];
 box.innerHTML=children.map(snavNodeHtml).join('')||'<div class="access-lock" style="margin:4px 8px">Chưa có đơn vị con.</div>';
 box.dataset.rendered='1';
 }
 box.classList.toggle('open',willOpen);
 caret.classList.toggle('open',willOpen);
 }
 function snavPlaceholderClick(){toast('Chưa có dữ liệu cho đơn vị này — chờ cập nhật ở bản tiếp theo.');}
 function renderSideNav(){
 snavSeq=0; window.__snavFns={};
 const box=document.getElementById('sideNavBody'); if(!box) return;
 const tree=sidebarTree();
 box.innerHTML=tree.length?tree.map(snavNodeHtml).join(''):'<div class="access-lock">Không có cơ cấu để hiển thị.</div>';
 }
 /* Làm phẳng toàn bộ cây (kể cả nhánh chưa mở rộng, gọi children() ngay để lấy đủ dữ liệu) phục vụ tìm kiếm xuyên suốt. */
 function sidebarFlattenNodes(nodes,path){
 let out=[];
 (nodes||[]).forEach(n=>{
 const curPath=path.concat([n.label]);
 out.push({node:n,path:path});
 if(typeof n.children==='function') out=out.concat(sidebarFlattenNodes(n.children(),curPath));
 });
 return out;
 }
 function filterSideNav(q){
 const box=document.getElementById('sideNavBody'); if(!box) return;
 const query=(q||'').trim().toLowerCase();
 if(!query){ renderSideNav(); return; }
 snavSeq=0; window.__snavFns={};
 const matches=sidebarFlattenNodes(sidebarTree(),[]).filter(x=>x.node.label.toLowerCase().includes(query));
 if(!matches.length){ box.innerHTML='<div class="access-lock">Không tìm thấy đơn vị phù hợp.</div>'; return; }
 box.innerHTML=matches.map(({node,path})=>{
 const crumb=path.join(' › ');
 return `<div class="snav-node"><button class="snav-row snav-leaf" onclick="${snavMainAction(node)}" title="${esc(crumb)}"><span class="snav-caret"></span><span class="snav-icon">${snavIcon(node.type)}</span><span class="snav-label">${esc(node.label)}${crumb?` <small style="color:#8ab0c8;font-weight:400">· ${esc(crumb)}</small>`:''}</span></button></div>`;
 }).join('');
 }
 function toggleSideNav(){
 const nav=document.getElementById('sideNav'); const overlay=document.getElementById('sideNavOverlay');
 const opening=nav.classList.contains('collapsed');
 nav.classList.toggle('collapsed',!opening);
 if(overlay) overlay.classList.toggle('show',opening);
 }
 function closeSideNav(){
 document.getElementById('sideNav')?.classList.add('collapsed');
 document.getElementById('sideNavOverlay')?.classList.remove('show');
 }
 /* Chỉ tài khoản Thành ủy mới được thao tác (giao nhiệm vụ/kịch bản/notify...) khi đang "xem theo cơ cấu tổ chức"
 vào 1 đơn vị cấp dưới. Các tài khoản khác ở chế độ này chỉ được xem, không được tạo/sửa dữ liệu.
 Trên chính dashboard của mình (không view-as) thì mọi tài khoản vẫn thao tác bình thường như cũ. */
 function isReadOnlyViewAs(){return !!window.__homeScope && currentAccount?.role!=='DANG';}
 function guardAction(label){
 if(!isReadOnlyViewAs()) return false;
 toast(`Chỉ xem — tài khoản này không có quyền ${label} khi xem IOC của cấp dưới (chỉ Thành ủy mới có quyền này).`);
 return true;
 }
 /* Chỉ được sửa/xóa đúng nhiệm vụ (chính hoặc nhánh) do chính tài khoản đang đăng nhập (hoặc đang "xem theo cơ cấu tổ chức" đúng vai đó) đã tạo ra.
 Dữ liệu mẫu dựng sẵn (generateRecords) không có creatorRole nên luôn coi là không sở hữu — không cho sửa/xóa. */
 function isRecordOwnedByMe(r){
 if(!r || r.metric==='docIn'||r.metric==='docOut') return false;
 if(!r.creatorRole) return false;
 return r.creatorRole===currentRole && (r.creatorSoId||null)===(currentSoId||null) && (r.creatorXaId||null)===(currentXaId||null) && (r.creatorOfficeId||null)===(currentOfficeId||null);
 }
 /* Đơn vị đang xem có phải ĐƠN VỊ CHỦ TRÌ của nhiệm vụ nhánh không (khác isSubtaskOwnedByMe = người TẠO nhánh). s.owner là
 tên đơn vị dạng chữ (có thể là đường dẫn "A / B / C" khi chọn từ cây) nên so theo tên đơn vị cuối cùng với tên đơn vị
 đang xem (headerScopeName — đúng tên hiện trên header) hoặc tên tài khoản. */
 function isSubtaskHostedByMe(s){
 if(!s || !s.owner || !currentAccount) return false;
 const norm=x=>String(x||'').split('/').pop().trim().toLowerCase();
 const own=norm(s.owner);
 return [headerScopeName(),currentAccount.title].some(n=>norm(n)===own);
 }
 function isSubtaskOwnedByMe(s){
 if(!s || !s.creatorRole) return false;
 return s.creatorRole===currentRole && (s.creatorSoId||null)===(currentSoId||null) && (s.creatorXaId||null)===(currentXaId||null) && (s.creatorOfficeId||null)===(currentOfficeId||null);
 }
 function guardOwnership(label){
 
 toast(`Bạn chỉ có thể ${label} nhiệm vụ do chính tài khoản này tạo ra.`);
 return true;
 }
 /* "Xem theo cơ cấu tổ chức": chuyển toàn bộ phạm vi dữ liệu dashboard sang 1 sở/xã-phường/phòng-ban khác,
 giống hệt như đăng nhập tài khoản đó — nhưng KHÔNG đổi định danh tài khoản đang đăng nhập (vẫn là Thành ủy).
 officeId (nếu có) thu hẹp tiếp xuống đúng 1 phòng/ban trong trục role (xem scopedSingleCategory). */
 function viewAsUnit(role,soId,xaId,label,icon,officeId){
 if(!window.__homeScope) window.__homeScope={role:currentRole,soId:currentSoId,xaId:currentXaId,officeId:currentOfficeId};
 const home=window.__homeScope;
 window.__viewingLabel=label; window.__viewingIcon=icon||'';
 currentRole=role; currentSoId=soId||null; currentXaId=xaId||null; currentOfficeId=officeId||null;
 activeMetric='received'; activeIndicatorRole=role; activeCategoryRole=(currentXaId!=null&&!currentSoId&&typeof CTM_XA_ALL_TAB!=='undefined'&&CTM_XA_ALL_TAB)?'ALL':(currentSoId||currentXaId)?'UBND':((role==='DANG'||role==='TW_ALL')?'ALL':role);
 renderAll();
 pushActionLog({category:'viewas',icon:'',title:`Xem theo cơ cấu tổ chức: ${label}`,sub:`Bắt đầu xem thay · Trục ${roleMeta(role)?.name||role}`,detail:`Tài khoản gốc: ${currentAccount.title} (${roleMeta(home.role)?.name||home.role}) → đang thao tác dưới danh nghĩa ${label}.`,role:home.role,soId:home.soId,xaId:home.xaId});
 toast(`Đang xem theo cơ cấu tổ chức: ${label}.`);
 }
 function returnToHomeScope(){
 const h=window.__homeScope; if(!h) return;
 const viewingLabel=window.__viewingLabel;
 currentRole=h.role; currentSoId=h.soId; currentXaId=h.xaId; currentOfficeId=h.officeId||null;
 window.__homeScope=null; window.__viewingLabel=null; window.__viewingIcon=null;
 activeMetric='received'; activeIndicatorRole=currentRole; activeCategoryRole=(currentXaId!=null&&!currentSoId&&typeof CTM_XA_ALL_TAB!=='undefined'&&CTM_XA_ALL_TAB)?'ALL':(currentSoId||currentXaId)?'UBND':((currentRole==='DANG'||currentRole==='TW_ALL')?'ALL':currentRole);
 renderAll();
 pushActionLog({category:'viewas',icon:'',title:`Quay lại phạm vi tài khoản gốc (đã rời xem ${viewingLabel||''})`,sub:`Kết thúc xem thay · Trục ${roleMeta(h.role)?.name||h.role}`,detail:`Trở về đúng phạm vi tài khoản: ${currentAccount.title}.`,role:h.role,soId:h.soId,xaId:h.xaId});
 toast('Đã quay lại phạm vi xem của tài khoản gốc.');
 }
 /* "Xem theo" 1 phòng/ban/đơn vị — dùng chung cho cả cấp Thành phố (cityOfficeList/XA_CATEGORIES_BY_ROLE) và
 cấp Trung ương (TW_OFFICE_CATEGORIES_BY_ROLE), vì categorySeedForRole()/scopedSingleCategory() đã tự biết
 dispatch đúng bảng theo role. */
 function snavViewAsOffice(role,officeId,wardIdx){
 const list = isTwRole(role) ? (TW_OFFICE_CATEGORIES_BY_ROLE[role]||[]) : (wardIdx!=null ? (XA_CATEGORIES_BY_ROLE[role]||[]) : cityOfficeList(role));
 const cat = list.find(c=>c.id===officeId); if(!cat) return;
 viewAsUnit(role, null, wardIdx!=null?String(wardIdx):null, cat.name, '', officeId);
 closeSideNav();
 }
 function snavViewAsSo(soId){
 const cat=(categorySeed.UBND||[]).find(c=>c.id===soId); if(!cat) return;
 viewAsUnit('UBND',soId,null,cat.name,'');
 closeSideNav();
 }
 function snavViewAsWard(idx){
 const name=wardNames()[Number(idx)]; if(!name) return;
 viewAsUnit('UBND',null,String(idx),name,'');
 closeSideNav();
 }
 /* "Hà Nội" trong nhánh Thành phố (TW_ORG_TREE.TW_CP) — KHÔNG tạo bản sao dữ liệu, chỉ view-as thẳng vào
 role DANG (Thành ủy, scope 'all') để dùng nguyên hệ thống 4 trục + 126 xã/phường đang có. Tài khoản gốc
 (Trung ương, không phải DANG) nên isReadOnlyViewAs() tự làm phạm vi này thành chỉ xem, không sửa được. */
 function snavViewAsCity(){
 viewAsUnit('DANG',null,null,'Thành phố Hà Nội','🚩');
 closeSideNav();
 }

