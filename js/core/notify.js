 /* ============================== NOTIFY IOC/CAD ============================== */
 /* Notify động sinh ra từ hành động thật trong phiên demo: giao nhiệm vụ (từ văn bản/chỉ tiêu/lĩnh vực/giao trực tiếp)
 và mô phỏng đồng bộ trạng thái từ hệ thống nguồn (gửi ngược về đơn vị đã giao). */
 const NOTI_CATEGORIES={
 assigned:{label:'Nhiệm vụ giao/nhận',icon:'',badge:'gold'},
 status_update:{label:'Cập nhật trạng thái',icon:'',badge:'ok'},
 urgent:{label:'Khẩn cấp',icon:'',badge:'red'},
 deadline_soon:{label:'Sắp đến hạn',icon:'',badge:'warn'},
 overdue:{label:'Quá hạn',icon:'',badge:'red'}
 };
 function notiFeed(){return window.__notiFeed=window.__notiFeed||[];}
 function notiVisible(n){
 if(!allowedRoles().includes(n.role)) return false;
 if(currentXaId!=null) return n.xaId===currentXaId;
 if(currentSoId) return n.soId===currentSoId;
 /* Tài khoản Trung ương scoped thẳng vào 1 đơn vị cụ thể (VD 1 Vụ/Cục) chỉ thấy noti của đúng đơn vị mình (và
 các đơn vị con nếu có) — dùng chung twOfficeScope() với results-dashboard.js để nhất quán, không để lọt noti
 của Vụ/Cục khác trong cùng khối. Noti không gắn officeId cụ thể (thông báo chung cả khối) vẫn hiện bình thường. */
 if(isTwRole(currentRole) && currentOfficeId){
 const scope=twOfficeScope();
 if(scope) return !n.officeId || scope.ids.includes(n.officeId);
 }
 return true;
 }
 function pushNoti(n){
 const cat=NOTI_CATEGORIES[n.category];
 const feed=notiFeed();
 feed.unshift({id:`evt-${Date.now()}-${Math.floor(Math.random()*10000)}`,ts:Date.now(),level:'Cao',type:cat?cat.label:'Notify',status:n.level==='Khẩn'?'risk':'soon',...n});
 if(feed.length>200) feed.length=200;
 if(document.getElementById('notifyList')) renderNotifications();
 /* BUG đã gặp thực tế: mọi hành động giao nhiệm vụ/tạo notify (createAssignment, giao nhiệm vụ nhánh...) đều đi
 qua pushNoti(), nhưng trước đây chỉ refresh panel Notify CŨ (#notifyList) — panel "Nhiệm vụ của tôi" mới
 (#myTaskList, my-tasks-notify.js) không hề được vẽ lại, nên nhiệm vụ vừa tạo xong không hiện lên cho tới khi
 người dùng tự bấm đổi tab/tìm kiếm (thứ duy nhất trigger renderMyTasksNotify() khác renderAll()). Thêm refresh
 ở đây để mọi nơi gọi pushNoti() cũng tự cập nhật panel mới ngay lập tức. */
 if(document.getElementById('myTaskList')) renderMyTasksNotify();
 }
 function resolveSoIdByUnitName(name){
 const cat=(categorySeed.UBND||[]).find(c=>c.name===name);
 return cat?cat.id:null;
 }
 function resolveXaIdByUnitName(name){
 const idx=wardNames().indexOf(name);
 return idx>=0?String(idx):null;
 }
