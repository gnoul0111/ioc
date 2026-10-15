 /* ============================== PHẠM VI GIAO NHIỆM VỤ (toàn bộ cơ cấu tổ chức, tự do chọn mọi cấp) ============================== */
 function myLevel(){return currentXaId!=null?3:currentSoId?2:1;}
 /* Danh sách NODE (chưa làm phẳng) mà tài khoản đang đăng nhập được phép giao nhiệm vụ tới — lấy đúng từ cây gốc
 chung (hanoiCityNode()/TW_ORG_TREE/orgTreeRoot() ở central-level.js), KHÔNG tự viết lại cây riêng như trước
 (trước đây bộ giao nhiệm vụ tách hẳn khỏi cây cơ cấu tổ chức thật, dẫn tới Trung ương không giao được xuống
 Thành phố, HĐND/MTTQ chưa từng giao được việc dù đã có Ban/đơn vị thật). Quy tắc phân quyền theo cấp (level 1/2)
 giữ NGUYÊN như cũ — chỉ đổi nguồn dữ liệu, không mở rộng/thu hẹp phạm vi ngoài phần đã có dữ liệu thật mới. */
 function assignableTreeNodes(){
 if(isTwRole(currentRole)){
 if(currentRole==='TW_ALL') return orgTreeRoot();
 if(currentRole==='TW_DANG') return twDangHomeChildren(currentOfficeId);
 return TW_ORG_TREE[currentRole]||[];
 }
 const level=myLevel();
 if(level===1){
 if(currentRole==='DANG') return hanoiCityNode(null);
 if(currentRole==='UBND') return hanoiCityNode('UBND');
 if(currentRole==='HDND') return hanoiCityNode('HDND');
 if(currentRole==='MTTQ') return hanoiCityNode('MTTQ');
 return [];
 }
 if(level===2){
 return wardNames().map((name,idx)=>({label:name,type:'ward',officeRole:'UBND',xaId:String(idx)}));
 }
 return [];
 }
 function assignableTargets(){
 return orgFlattenAssignable(assignableTreeNodes());
 }
 function openNotiTarget(id){
 const n=notiFeed().find(x=>x.id===id); if(!n||!n.target) return;
 const t=n.target;
 if(t.type==='record') openRecordDetail(t.id);
 else if(t.type==='recordSubtask') openSubTaskDetail(t.id,t.idx);
 else if(t.type==='indicatorSubtask') openIndicatorSubTaskDetail(t.id,t.idx);
 else if(t.type==='fieldSubtask') openFieldSubTaskDetail(t.id,t.idx);
 }

