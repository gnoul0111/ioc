 /* ============================== NHIỆM VỤ CỦA TÔI (4 nhóm notify cá nhân) ==============================
 Khác với NOTI_CATEGORIES/notiFeed() (notify.js) — vốn broadcast theo 6 nguồn (thủ công/văn bản/GIS/Camera/
 Lịch/KPI) cho cả đơn vị — khối này chỉ theo dõi ĐÚNG các nhiệm vụ (records, metric==='received') mà tài khoản
 đang đăng nhập là bên NHẬN, chia 4 nhóm: Mới / Sắp hết hạn / Quá hạn / Cập nhật trạng thái, theo đúng luồng
 anh yêu cầu. "User hiện tại" = tài khoản/trục đang đăng nhập (app không có login cá nhân từng người); cấp
 Trung ương tách chính xác tới từng Vụ/Cục qua officeId+twOfficeScope() (như notiVisible() đang làm), cấp
 Thành phố chỉ tách tới cấp TRỤC (DANG/HDND/UBND/MTTQ) vì dữ liệu demo (generateRecords()) không có sẵn
 soId/xaId gắn theo từng Sở/Xã cho 700+ bản ghi nhiệm vụ. */
 function myReceivedTasks(){
 return records.filter(r=>{
 if(r.metric!=='received') return false;
 if(!canSeeRole(r.role)) return false;
 if(isTwRole(currentRole) && currentOfficeId){
 const scope=twOfficeScope();
 if(scope) return !r.officeId || scope.ids.includes(r.officeId);
 }
 return true;
 });
 }
 /* Bucket suy ra từ (trạng thái + hạn xử lý), tương tự taskResultBucket() (overview.js). Trước đây tách "Hoàn
 thành" thành 2 mức đúng hạn/quá hạn (ht_dung_han/ht_qua_han) — anh yêu cầu bỏ hẳn phân biệt này: hoàn thành là
 hoàn thành, không cần biết có trễ hay không. Gộp về đúng 1 key 'ht' duy nhất, không cần so completedAt với hạn
 xử lý nữa. Ngưỡng "sắp quá hạn" = số ngày «Nhiệm vụ sắp hết hạn» ở màn «Cấu hình chức năng IOC» (mặc định 3,
 trước đây viết cứng MY_TASK_DUE_SOON_DAYS=3). */
 function myTaskDueSoonDays(){ return ichSo('noti.nv.sapHetHan'); }
 const MY_TASK_BUCKET_META={
 cht_trong_han:{label:'Trong hạn',badge:''},
 cht_sap_qua_han:{label:'Sắp quá hạn',badge:'warn'},
 cht_qua_han:{label:'Quá hạn',badge:'red'},
 cho_duyet:{label:'Chờ phê duyệt',badge:'gold'},
 ht:{label:'Hoàn thành',badge:'ok'}
 };
 /* status='pending' (statusDefs: "Chờ phê duyệt") xét TRƯỚC cả done/closed lẫn hạn xử lý — tách hẳn ra 1 bucket
 riêng (cho_duyet) thay vì để nó rơi vào cht_trong_han/cht_sap_qua_han/cht_qua_han theo hạn như trước, để tránh
 hiện trùng 2 lần (vừa ở "Chờ duyệt" vừa ở "Sắp hết hạn"/"Quá hạn" nếu tình cờ hạn cũng gần) khi xem "Tất cả". */
 function myTaskBucket(r){
 const dueMs=parseDMY(r.due);
 if(r.status==='pending') return 'cho_duyet';
 if(r.status==='done'||r.status==='closed') return 'ht';
 if(!dueMs) return 'cht_trong_han';
 const today=new Date(); today.setHours(0,0,0,0);
 const diffDays=Math.round((dueMs-today.getTime())/86400000);
 if(diffDays<0) return 'cht_qua_han';
 if(diffDays<=myTaskDueSoonDays()) return 'cht_sap_qua_han';
 return 'cht_trong_han';
 }
 /* ===== Trạng thái nhiệm vụ trên Noti theo «Cấu hình chức năng IOC» (js/core/ioc-cau-hinh.js, anh duyệt 17/11/2026) =====
 Trước đây 4 nhóm Mới / Sắp hết hạn / Quá hạn / Hoàn thành lọc RIÊNG từng nhóm rồi nối lại, nên 1 nhiệm vụ vừa tạo
 mà hạn đã gần (hoặc đã quá) hiện 2–3 lần. Nay mỗi nhiệm vụ chỉ có ĐÚNG 1 trạng thái: xét lần lượt theo thứ tự ưu
 tiên khai báo ở cấu hình (ichUuTien: Quá hạn khẩn cấp → Quá hạn → Hạn hôm nay → Sắp hết hạn → Mới → Trong hạn →
 Hoàn thành), lấy trạng thái đầu tiên nhiệm vụ thỏa VÀ đang bật; trạng thái tắt thì rơi xuống trạng thái kế tiếp.
 Ngưỡng ngày lấy từ cấu hình (ichSo), không viết cứng. Nhiệm vụ chờ phê duyệt (pending) không hiện trên Noti (giữ
 đúng yêu cầu cũ "bỏ thông báo chờ duyệt"); các trạng thái trước «Hoàn thành» chỉ áp cho nhiệm vụ chưa hoàn thành. */
 function noiTodayMs(){ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
 function noiKhoa(id){ return id.split('.').pop(); }
 /* → {key, diff (số ngày còn tới hạn, null nếu không có hạn), qh (số ngày quá hạn)} hoặc null (không hiện). */
 function noiNvTrangThai(r,todayMs){
 if(r.status==='pending') return null;
 const done=r.status==='done'||r.status==='closed';
 const dueMs=parseDMY(r.due), createdMs=parseDMY(r.created);
 const diff=dueMs?Math.round((dueMs-todayMs)/86400000):null;
 const qh=diff!=null&&diff<0?-diff:0;
 const now=Date.now();
 const thoa={
 quaHanKhanCap:!done&&qh>0&&qh>=ichSo('noti.nv.quaHanKhanCap'),
 quaHan:!done&&qh>0,
 hanHomNay:!done&&diff===0,
 sapHetHan:!done&&diff!=null&&diff>=1&&diff<=ichSo('noti.nv.sapHetHan'),
 moi:!done&&!!createdMs&&createdMs>=now-ichSo('noti.nv.moi')*86400000,
 trongHan:!done&&(diff==null||diff>=1),
 hoanThanh:done&&!!r.completedAt&&ichSo('noti.nv.hoanThanh')>0&&r.completedAt>=now-ichSo('noti.nv.hoanThanh')*86400000
 };
 for(const id of ichUuTien('noti','nv')){ const k=noiKhoa(id); if(thoa[k]&&ichBat(id)) return {key:k,diff,qh}; }
 return null;
 }
 /* Gom nhiệm vụ đang theo dõi theo trạng thái: {key:[records]} — sắp xếp trong từng nhóm giữ như trước: quá hạn
 lâu nhất / gần hạn nhất lên trước (hạn tăng dần), mới tạo nhất lên trước, mới hoàn thành nhất lên trước. */
 /* Bộ nhớ tạm trong ĐÚNG 1 lần vẽ Noti (renderMyTasksNotify mở/đóng): bộ lọc trạng thái, danh sách tab đang mở, số
 đếm các tab khi phóng to cùng dùng chung 1 lần xếp nhóm thay vì mỗi chỗ xếp lại. Ngoài lần vẽ (null) thì tính mới,
 nên dữ liệu/cấu hình/ngày đổi lúc nào cũng không bị dùng số cũ. */
 let __noiTam=null;
 function noiNvNhom(){
 if(__noiTam&&__noiTam.nv) return __noiTam.nv;
 const today=noiTodayMs(), g={};
 myReceivedTasks().forEach(r=>{ const t=noiNvTrangThai(r,today); if(t) (g[t.key]=g[t.key]||[]).push(r); });
 const theoHan=(a,b)=>(parseDMY(a.due)||Infinity)-(parseDMY(b.due)||Infinity);
 ['quaHanKhanCap','quaHan','hanHomNay','sapHetHan','trongHan'].forEach(k=>g[k]&&g[k].sort(theoHan));
 if(g.moi) g.moi.sort((a,b)=>parseDMY(b.created)-parseDMY(a.created));
 if(g.hoanThanh) g.hoanThanh.sort((a,b)=>b.completedAt-a.completedAt);
 if(__noiTam) __noiTam.nv=g;
 return g;
 }
 /* Các hàm nhóm cũ giữ tên (chỉ dùng trong file này), nay lấy từ noiNvNhom() nên không còn trùng nhau. */
 function myTasksNew(){ return noiNvNhom().moi||[]; }
 function myTasksDueSoon(){ const g=noiNvNhom(); return [...(g.hanHomNay||[]),...(g.sapHetHan||[])]; }
 function myTasksOverdue(){ const g=noiNvNhom(); return [...(g.quaHanKhanCap||[]),...(g.quaHan||[])]; }
 /* Nhóm mới: chờ phê duyệt (status='pending') — nhiệm vụ cần chính tài khoản đang xem phê duyệt, không phụ
 thuộc hạn xử lý. Sort due ASC như các nhóm khác (gần hạn nhất lên trước, dù ở đây ít quan trọng bằng việc
 đang chờ duyệt hay không). */
 function myTasksPendingApproval(){
 return myReceivedTasks().filter(r=>myTaskBucket(r)==='cho_duyet').sort((a,b)=>parseDMY(a.due)-parseDMY(b.due));
 }
 /* Hoàn thành: hiện trong số ngày «Nhiệm vụ hoàn thành» ở cấu hình, tính từ lúc hoàn thành (r.completedAt); 0 = ẩn
 ngay (trước đây cứng 24 giờ). Nhiệm vụ demo có sẵn được gán completedAt giả lập (demo-data-generator.js). */
 function myTasksCompletedRecent(){ return noiNvNhom().hoanThanh||[]; }
 /* Nhóm 4: nhật ký chuyển bucket (CHT trong hạn/sắp quá hạn/quá hạn, HT đúng hạn/quá hạn) — lưu riêng, KHÔNG
 dùng chung notiFeed() (notify.js) để tránh lẫn với 6 nguồn broadcast cũ. Chỉ sinh 1 dòng khi bucket THỰC SỰ
 đổi (so với r._lastNotiBucket lưu trên chính record) — sửa dữ liệu khác (mô tả, tiến độ...) không sinh dòng
 mới, đúng yêu cầu "update dữ liệu nhưng không đổi trạng thái → không sinh Notify". */
 function myTaskStatusLog(){return window.__myTaskStatusLog=window.__myTaskStatusLog||[];}
 /* myTaskStatusLog() lưu chung 1 mảng toàn cục, KHÔNG tự lọc theo tài khoản đang xem (bug có sẵn từ trước) —
 dùng đúng scope của myReceivedTasks() (role/officeId theo currentRole hiện tại) để chỉ hiện log của những
 nhiệm vụ tài khoản đang đăng nhập thực sự nhìn thấy được, tránh lộ cập nhật trạng thái của tài khoản/trục khác. */
 function myTaskStatusLogScoped(){
 /* Số ngày giữ trên Noti và bật/tắt theo «Cập nhật trạng thái» ở cấu hình (trước đây cứng 3 ngày). */
 if(!ichBat('noti.nv.capNhat')) return [];
 if(typeof __noiTam!=='undefined'&&__noiTam&&__noiTam.log) return __noiTam.log;
 const ids=new Set(myReceivedTasks().map(r=>r.id));
 const cutoff=Date.now()-ichSo('noti.nv.capNhat')*86400000;
 const log=myTaskStatusLog().filter(x=>x.ts>=cutoff&&ids.has(x.recordId));
 if(typeof __noiTam!=='undefined'&&__noiTam) __noiTam.log=log;
 return log;
 }
 /* Seed vài dòng "Cập nhật trạng thái" mẫu ngay khi khởi tạo dữ liệu (initData(), gọi 1 lần lúc mở trang) — nếu
 không seed, nhóm này LUÔN rỗng lúc mới mở trang vì bản chất nó chỉ ghi nhận khi bucket THẬT SỰ đổi giữa 2 lần
 render (checkMyTaskTransitions), mà lần render đầu tiên chỉ lưu baseline, không tính là 1 lần đổi. Chọn 1 phần
 nhiệm vụ "received" từ TOÀN BỘ vai trò (chưa biết ai sẽ đăng nhập), gắn transition hợp lý dẫn tới đúng bucket
 hiện tại của bản ghi + gán r._lastNotiBucket luôn về bucket đó để checkMyTaskTransitions() không sinh trùng lần
 render đầu. myTaskStatusLogScoped() ở trên sẽ tự lọc đúng phần liên quan tài khoản đang đăng nhập. */
 function seedNotiStatusLogDemo(){
 window.__myTaskStatusLog=[];
 const pool=records.filter(r=>r.metric==='received');
 pool.forEach((r,idx)=>{
 if(idx%14!==0) return;
 const bucket=myTaskBucket(r);
 let from=null;
 if(bucket==='cht_sap_qua_han') from='cht_trong_han';
 else if(bucket==='cht_qua_han') from=idx%2===0?'cht_trong_han':'cht_sap_qua_han';
 else if(bucket==='ht') from=['cht_trong_han','cht_sap_qua_han','cht_qua_han'][idx%3];
 else return;
 const text=MY_TASK_TRANSITION_TEXT[`${from}>${bucket}`]; if(!text) return;
 const hoursAgo=6+((idx*37)%66);
 myTaskStatusLog().unshift({id:`mt-seed-${r.id}`,ts:Date.now()-hoursAgo*3600000,recordId:r.id,title:r.title,text,from,to:bucket});
 r._lastNotiBucket=bucket;
 });
 }
 const MY_TASK_TRANSITION_TEXT={
 'cht_trong_han>cht_sap_qua_han':'Nhiệm vụ sắp quá hạn',
 'cht_trong_han>cht_qua_han':'Nhiệm vụ quá hạn',
 'cht_sap_qua_han>cht_qua_han':'Nhiệm vụ đã quá hạn',
 'cht_trong_han>ht':'Nhiệm vụ đã hoàn thành',
 'cht_sap_qua_han>ht':'Nhiệm vụ đã hoàn thành',
 'cht_qua_han>ht':'Nhiệm vụ đã hoàn thành'
 };
 function emitMyTaskTransition(r,from,to){
 if(!from||from===to) return;
 const text=MY_TASK_TRANSITION_TEXT[`${from}>${to}`]||`Cập nhật trạng thái: ${MY_TASK_BUCKET_META[to].label}`;
 myTaskStatusLog().unshift({id:`mt-${Date.now()}-${Math.floor(Math.random()*10000)}`,ts:Date.now(),recordId:r.id,title:r.title,text,from,to});
 if(myTaskStatusLog().length>100) myTaskStatusLog().length=100;
 }
 /* Gọi mỗi lần render panel — phát hiện đổi bucket từ lần render trước (do hạn trôi qua ngày mới, hoặc do sửa
 hạn/đánh dấu hoàn thành trong phiên) và sinh đúng 1 Notify/lần đổi. */
 function checkMyTaskTransitions(){
 myReceivedTasks().forEach(r=>{
 const bucket=myTaskBucket(r);
 if(r._lastNotiBucket===undefined) r._lastNotiBucket=bucket;
 else if(r._lastNotiBucket!==bucket){ emitMyTaskTransition(r,r._lastNotiBucket,bucket); r._lastNotiBucket=bucket; }
 });
 }
 /* App hiện chưa có thao tác nào đổi nhiệm vụ cấp 1 (records[], khác nhiệm vụ nhánh subtasks đã có nút "mô
 phỏng đồng bộ") sang hoàn thành — thêm đúng 1 hành động tối thiểu để demo được nhóm 4 (HT đúng hạn/quá hạn),
 gắn trong taskActionBarHtml của renderRecordDetail (record-detail.js). */
 function markMyTaskDone(id){
 if(guardAction('đánh dấu hoàn thành'))return;
 const r=records.find(x=>x.id===id); if(!r)return;
 if(r.status==='done'||r.status==='closed'){toast('Nhiệm vụ đã hoàn thành.');return;}
 const prevBucket=myTaskBucket(r);
 r.status='done'; r.completedAt=Date.now(); r.progress=100;
 r.history=r.history||[]; r.history.unshift({time:new Date().toLocaleString('vi-VN'),text:`${currentAccount.title} đánh dấu hoàn thành nhiệm vụ.`});
 pushActionLog({category:'edit',icon:'✅',title:`Hoàn thành nhiệm vụ: ${r.title}`,sub:`${r.id} · ${r.unit||'—'}`,detail:`Trạng thái: ${statusMeta(r.status).label} · Hạn ${r.due||'—'}`,role:r.role,target:{type:'record',id}});
 const newBucket=myTaskBucket(r);
 emitMyTaskTransition(r,prevBucket,newBucket);
 r._lastNotiBucket=newBucket;
 toast('Đã đánh dấu hoàn thành nhiệm vụ.');
 renderMyTasksNotify();
 openRecordDetail(id);
 }
 /* Panel Notify cũ (6 nguồn, notify.js/audit-log.js — #notifyOldPanel/#notifyList) KHÔNG xóa khỏi DOM/code,
 renderNotifications() vẫn chạy bình thường trong renderAll() — chỉ vĩnh viễn ẩn khỏi UI (demo_ioc.html đặt
 sẵn display:none), vì toàn bộ dữ liệu của nó (văn bản/nhiệm vụ/GIS/Camera/KPI) nay gộp chung vào đúng 1 danh
 sách lọc theo loại+trạng thái bên dưới, theo đúng yêu cầu "gộp thành 1 danh sách duy nhất". Riêng "Lịch công
 tác/kỳ họp" (nguồn thứ 6) không đưa vào danh sách gộp (anh chọn bỏ hẳn) — vẫn xem được qua openCalendar() ở
 nơi khác trong app, không liên quan trực tiếp Notify nữa. */
 /* Đơn vị lưu dạng đường dẫn phân cấp đầy đủ (VD "Chủ tịch nước / Văn phòng Chủ tịch nước") — quá dài cho 1 dòng
 phụ trong danh sách notify, chỉ cần lấy đúng tên đơn vị cuối (chủ trì thực tế) để gọn, dòng phụ khớp CSS
 line-clamp 1 dòng ở dưới. */
 function shortUnit(u){ const s=String(u||'').trim(); if(!s) return '—'; const parts=s.split('/').map(p=>p.trim()); return parts[parts.length-1]||s; }
 function myTaskRowNew(r){
 /* Badge "Mới" không mang thông tin ngày (khác due_soon/overdue đã có số ngày trong badge) nên vẫn giữ ngày tạo
 ở dòng phụ, nhưng rút ngắn DD/MM (bỏ năm + chữ "Tạo") cho gọn. */
 const shortDate=(String(r.created||'').match(/^(\d{2})\/(\d{2})/)||[])[0]||r.created||'—';
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))} · ${esc(shortDate)}</small></div><span class="badge blue">Mới</span></button>`;
 }
 /* Sắp hết hạn = LUÔN vàng (warn), không chia mức đỏ/vàng theo số ngày nữa (trước đây ≤2 ngày để đỏ, anh yêu
 cầu để hết màu vàng cho đồng nhất — giống cách "Quá hạn" đã đồng nhất về đỏ). Dòng phụ bỏ "· Hạn ..." vì trùng
 ý với badge, chỉ còn tên đơn vị — rút gọn theo yêu cầu "đang nhiều chữ quá". */
 /* Nhiệm vụ sắp hết hạn/quá hạn mà tiến độ còn quá thấp (<40%) là dấu hiệu rủi ro trễ hẹn rõ ràng — thêm hẳn 1
 badge tiến độ riêng, xếp CHỒNG lên trên badge hạn (không thay thế), để nhận ra ngay khi lướt danh sách mà
 không cần bấm vào từng nhiệm vụ. Ngưỡng và bật/tắt theo «Ngưỡng tiến độ thấp» ở cấu hình (mặc định 40%, trước đây
 viết cứng NOTI_LOW_PROGRESS_THRESHOLD=40); tiến độ từ ngưỡng trở lên thì không hiện. */
 /* Đổi từ icon ⚠️ (trùng hệt icon "khẩn cấp" cạnh tiêu đề, 2 dấu ⚠️ chồng nhau trong cùng 1 thẻ rất rối — anh chỉ
 ra đúng) sang 1 thanh tiến độ mini ngay trong badge — trực quan hơn hẳn 1 icon tĩnh (nhìn phát biết đang thấp
 CỠ NÀO, không chỉ "có cảnh báo"), lại không đụng icon nào khác. Dùng ĐÚNG class .badge.red có sẵn (đã có
 override riêng cho cả 3 theme) làm khung ngoài; track/fill vẽ tay nhỏ bên trong, fill dùng currentColor để tự
 khớp màu đỏ của .badge.red theo từng theme mà không phải khai màu riêng. */
 function noiProgressBadgeHtml(r){
 const p=Number(r.progress);
 if(!ichBat('noti.nv.tienDoThap')||!Number.isFinite(p)||p>=ichSo('noti.nv.tienDoThap')) return '';
 /* width:100% + flex:1 để thanh này GIÃN BẰNG ĐÚNG chiều rộng badge hạn xếp bên dưới (anh yêu cầu) — trước đây
 mỗi badge tự co theo nội dung riêng (badge % ngắn hơn hẳn "Quá hạn X ngày") nên lệch nhau; cột cha đã đổi
 align-items:stretch (myTaskRowDueSoon/Overdue) để cả 2 badge cùng giãn theo đúng badge rộng nhất. */
 return `<span class="badge red" style="display:flex;align-items:center;justify-content:center;gap:5px;padding:3px 8px" title="Tiến độ ${p}%"><span style="flex:1;min-width:24px;height:6px;border-radius:999px;background:rgba(0,0,0,.28);overflow:hidden;display:inline-block"><span style="display:block;width:${p}%;height:100%;background:currentColor;border-radius:999px"></span></span>${p}%</span>`;
 }
 /* Hạn NGAY HÔM NAY (days===0) tách riêng màu cam + nhãn "Hạn hôm nay" — nổi bật hẳn so với "Còn X ngày" màu vàng
 chung của cả nhóm, đúng yêu cầu "khẩn hơn 1 bậc" so với sắp hết hạn thông thường. Nhóm này vẫn thuộc đúng bucket
 cht_sap_qua_han (myTaskBucket() đã tính days>=0 là còn nằm trong "sắp hết hạn", không cần đổi điều kiện lọc) —
 và tự lên đầu danh sách vì myTasksDueSoon() sort theo due ASC, hạn hôm nay luôn có due nhỏ nhất trong nhóm. */
 function myTaskRowDueSoon(r,todayMs){
 const days=Math.max(0,Math.round((parseDMY(r.due)-todayMs)/86400000));
 const isToday=days===0;
 const badgeText=isToday?'Hạn hôm nay':`Còn ${fmt(days)} ngày`;
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><div style="display:flex;flex-direction:column;gap:4px;align-items:stretch;min-width:96px">${noiProgressBadgeHtml(r)}<span class="badge ${isToday?'orange':'warn'}" style="text-align:center">${badgeText}</span></div></button>`;
 }
 /* Quá hạn = LUÔN đỏ, không chia mức nữa (trước đây ≤3 ngày còn để vàng, anh yêu cầu để hết màu đỏ cho đồng
 nhất — đã quá hạn thì mức độ nào cũng là red). Vẫn giữ dấu ‼ cho mốc >14 ngày để phân biệt độ nghiêm trọng
 dù cùng màu đỏ. */
 function myTaskRowOverdue(r,todayMs,khanCap){
 const days=Math.max(0,Math.round((todayMs-parseDMY(r.due))/86400000));
 /* 3 mức theo cấu hình: «Quá hạn khẩn cấp · X ngày» nền đỏ đặc từ mốc Quá hạn khẩn cấp (mặc định 10 ngày); dưới
 mốc đó là «Quá hạn X ngày», thêm dấu ‼ từ «Mốc nhận biết quá hạn» (mặc định 5 ngày, trước đây cứng >14 ngày). */
 const mark=!khanCap&&ichBat('noti.nv.mocQuaHan')&&days>=ichSo('noti.nv.mocQuaHan')?'‼ ':'';
 const badge=khanCap?`<span class="badge red-solid" style="text-align:center">Quá hạn khẩn cấp · ${fmt(days)} ngày</span>`
 :`<span class="badge red" style="text-align:center">${mark}Quá hạn ${fmt(days)} ngày</span>`;
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><div style="display:flex;flex-direction:column;gap:4px;align-items:stretch;min-width:96px">${noiProgressBadgeHtml(r)}${badge}</div></button>`;
 }
 /* Trong hạn: chưa hoàn thành, đã qua thời gian Mới, chưa tới Sắp hết hạn — nhãn trung tính «Còn X ngày» (không có
 hạn thì «Trong hạn»). */
 function myTaskRowTrongHan(r,todayMs){
 const dueMs=parseDMY(r.due);
 const text=dueMs?`Còn ${fmt(Math.max(0,Math.round((dueMs-todayMs)/86400000)))} ngày`:'Trong hạn';
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><span class="badge">${text}</span></button>`;
 }
 /* Vẽ 1 dòng nhiệm vụ theo đúng trạng thái đã xếp (noiNvTrangThai). */
 function noiNvRow(r,key,todayMs){
 if(key==='quaHanKhanCap') return myTaskRowOverdue(r,todayMs,true);
 if(key==='quaHan') return myTaskRowOverdue(r,todayMs,false);
 if(key==='hanHomNay'||key==='sapHetHan') return myTaskRowDueSoon(r,todayMs);
 if(key==='moi') return myTaskRowNew(r);
 if(key==='trongHan') return myTaskRowTrongHan(r,todayMs);
 return myTaskRowCompleted(r);
 }

 /* Badge màu vàng (gold) — khớp ĐÚNG màu statusDefs.pending ('#d8a50c'/cls:'gold', data-static.js) đang dùng ở
 mọi nơi khác trong app cho trạng thái "Chờ phê duyệt", không tự bịa màu riêng. */
 function myTaskRowPending(r){
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><span class="badge gold">Chờ duyệt</span></button>`;
 }
 /* Bỏ hiện số giờ còn lại theo yêu cầu — badge chỉ còn "Hoàn thành" trơn, logic tự rớt sau 24h (myTasksCompletedRecent)
 vẫn giữ nguyên, chỉ không hiển thị đếm ngược ra ngoài nữa. */
 function myTaskRowCompleted(r){
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><span class="badge ok">Hoàn thành</span></button>`;
 }
 /* Badge trước đây LUÔN dùng nhãn tĩnh (MY_TASK_BUCKET_META[x.to].label = "Sắp quá hạn"/"Quá hạn" trơn, không số
 ngày) — khác hẳn badge cùng nhiệm vụ đó ở nhóm "Sắp hết hạn"/"Quá hạn" (có số ngày cụ thể: "Còn 3 ngày"/"Quá
 hạn 1 ngày"). Cùng 1 nhiệm vụ mà 2 nơi hiện khác thông tin — đúng lỗi anh chỉ ra khi so sánh. Tính lại số ngày
 TỪ ĐÚNG record gốc (rec.due) theo cùng công thức myTaskRowDueSoon/Overdue để badge luôn khớp nội dung dù xem
 ở nhóm nào. Trạng thái "Hoàn thành..." giữ nguyên nhãn tĩnh vì không có khái niệm "còn/quá X ngày" (đã xong). */
 function myTaskRowStatus(x){
 const timeShort=new Date(x.ts).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})+' '+new Date(x.ts).toLocaleDateString('vi-VN');
 const rec=records.find(rr=>rr.id===x.recordId);
 let label=MY_TASK_BUCKET_META[x.to].label;
 let badgeCls=MY_TASK_BUCKET_META[x.to].badge;
 if(rec){
 const dueMs=parseDMY(rec.due);
 if(dueMs){
 const today=new Date(); today.setHours(0,0,0,0);
 const diffDays=Math.round((dueMs-today.getTime())/86400000);
 if(x.to==='cht_sap_qua_han'){
 if(diffDays===0){ label='Hạn hôm nay'; badgeCls='orange'; }
 else label=`Còn ${fmt(Math.max(0,diffDays))} ngày`;
 }
 else if(x.to==='cht_qua_han') label=`Quá hạn ${fmt(Math.max(0,-diffDays))} ngày`;
 }
 }
 return `<button class="notify" onclick="closeModal();openRecordDetail('${x.recordId}')"><div><b>${rec?noiStar(rec):''}${esc(x.title)}</b><small>${esc(x.text)} · ${timeShort}</small></div><span class="badge ${badgeCls}">${esc(label)}</span></button>`;
 }
 /* Dropdown <select> thay cho dải nút/chip cuộn ngang — select KHÔNG BAO GIỜ tự xuống dòng (native control) dù
 màn hình hẹp cỡ nào, trong khi dải nút flex từng bị wrap lỗi trên 1 số trình duyệt/thiết bị thực tế dù test
 headless không tái hiện được. Đây là lựa chọn AN TOÀN, ưu tiên đúng yêu cầu "gọn, không lỗi UI" hơn là đẹp mắt.
 Mặc định "Tất cả" (all) — gộp cả 4 nhóm, ưu tiên hiển thị theo mức khẩn: quá hạn trước, rồi sắp hết hạn, mới,
 cập nhật trạng thái. Có ô tìm kiếm (myTaskSearchInput) lọc theo tên nhiệm vụ/đơn vị, áp dụng trên mọi nhóm. */
 /* ============================== LỌC 2 TẦNG: LOẠI → TRẠNG THÁI (gộp toàn bộ notify vào 1 danh sách) ==============
 4 loại theo đúng yêu cầu: Nhiệm vụ / Văn bản / GIS (gộp cả Camera AI) / OKR-KPI. Chọn Loại ở lọc 1 sẽ nạp lại
 đúng bộ Trạng thái tương ứng ở lọc 2 (reset về "Tất cả" của loại đó) — lọc 2 "ăn theo" lọc 1 như anh yêu cầu. */
 const NOTI_TYPE_DEFS=[
 {key:'nv',label:'Nhiệm vụ'},
 {key:'vb',label:'Văn bản'},
 {key:'gis',label:'GIS / Camera AI'},
 {key:'kpi',label:'OKR/KPI'}
 ];
 /* Bộ trạng thái của bộ lọc (icon phễu) từng tab — chỉ gồm trạng thái ĐANG BẬT ở «Cấu hình chức năng IOC», nhãn và
 thứ tự lấy từ cấu hình. Nhiệm vụ: các trạng thái theo thứ tự ưu tiên + «Cập nhật trạng thái». Văn bản: Sắp đến hạn /
 Mới / Đổi trạng thái (tính theo ngày, xem noiVbTrangThai). GIS/Camera: đã giao xử lý hay chưa (linked). OKR/KPI:
 6 trạng thái CAT_ST (indicators.js) của indicatorRecords. "Chờ duyệt" vẫn bỏ khỏi Noti theo yêu cầu cũ
 (myTasksPendingApproval()/myTaskRowPending() giữ trong code, không dùng). */
 function noiNhanCauHinh(id){ const t=ichThamSo(id); return t&&t.nhan?t.nhan[0]:noiKhoa(id); }
 function notiStatusDefsFor(typeKey){
 if(typeKey==='vb'){
 const g=noiVbNhom();
 return ichUuTien('noti','vb').filter(ichBat).map(id=>({key:noiKhoa(id),label:noiNhanCauHinh(id),count:(g[noiKhoa(id)]||[]).length}));
 }
 if(typeKey==='gis'){
 const items=noiGisCombinedItems(), defs=[];
 if(ichBat('noti.gis.chuaXuLy')) defs.push({key:'pending',label:'Chưa xử lý',count:items.filter(it=>!noiGisItemLinked(it)).length});
 if(ichBat('noti.gis.daGiao')) defs.push({key:'assigned',label:'Đã giao xử lý',count:items.filter(noiGisItemLinked).length});
 return defs;
 }
 if(typeKey==='kpi'){
 const all=noiKpiScopedRecords();
 return CAT_ST.filter(s=>ichBat('noti.kpi.'+s.k)).map(s=>({key:s.k,label:s.l,count:all.filter(r=>r.status===s.k).length}));
 }
 const g=noiNvNhom();
 const defs=ichUuTien('noti','nv').filter(ichBat).map(id=>({key:noiKhoa(id),label:noiNhanCauHinh(id),count:(g[noiKhoa(id)]||[]).length}));
 if(ichBat('noti.nv.capNhat')) defs.push({key:'status',label:'Cập nhật trạng thái',count:myTaskStatusLogScoped().length});
 return defs;
 }
 /* ===== Văn bản trên Noti (tab Văn bản và Khẩn cấp/Quan trọng) =====
 Trước đây lấy thẳng theo trạng thái có sẵn trong dữ liệu (NOTI_DOCTASK_DEFS: new/progress/dueSoon). Nay tính theo
 ngày như nhiệm vụ (anh duyệt 17/11/2026): Sắp đến hạn = còn 0..N ngày tới hạn xử lý; Mới = tạo trong N ngày; Đổi
 trạng thái = đang thực hiện (progress, chỉ hiển thị). Mỗi văn bản chỉ 1 trạng thái theo thứ tự ưu tiên ở cấu
 hình; văn bản đã hoàn thành không hiện. NOTI_DOCTASK_DEFS vẫn giữ cho các danh sách khác (audit-log.js). */
 function noiVbTrangThai(r,todayMs){
 if(r.status==='done') return null;
 const dueMs=parseDMY(r.due), createdMs=parseDMY(r.created);
 const diff=dueMs?Math.round((dueMs-todayMs)/86400000):null;
 const thoa={
 sapDenHan:diff!=null&&diff>=0&&diff<=ichSo('noti.vb.sapDenHan'),
 moi:!!createdMs&&createdMs>=Date.now()-ichSo('noti.vb.moi')*86400000,
 doiTrangThai:r.status==='progress'
 };
 for(const id of ichUuTien('noti','vb')){ const k=noiKhoa(id); if(thoa[k]&&ichBat(id)) return k; }
 return null;
 }
 function noiVbNhom(){
 if(__noiTam&&__noiTam.vb) return __noiTam.vb;
 const today=noiTodayMs(), g={};
 records.filter(r=>r.metric==='docIn'&&canSeeRole(r.role)).forEach(r=>{ const k=noiVbTrangThai(r,today); if(k) (g[k]=g[k]||[]).push(r); });
 /* Mới nhất lên đầu trong từng nhóm (như trước). */
 Object.values(g).forEach(a=>a.sort((x,y)=>parseDMY(y.created)-parseDMY(x.created)));
 if(__noiTam) __noiTam.vb=g;
 return g;
 }
 function noiGisCombinedItems(){
 return [...noticeGisItems().map(rec=>({kind:'gis',rec})),...noticeCameraItems().map(rec=>({kind:'camera',rec}))];
 }
 function noiGisItemLinked(it){
 return it.kind==='gis' ? !!(it.rec.linkedRecordId||it.rec.demoLinked||it.rec.cadActive) :!!(window.__cameraAlertLinks&&window.__cameraAlertLinks[it.rec.id]);
 }
 /* Tách riêng khỏi noticeKpiItems() (audit-log.js, chỉ lấy status==='overdue') vì lọc trạng thái ở đây cần duyệt
 được CẢ 6 trạng thái CAT_ST, không riêng "Không đạt" — vẫn giữ đúng nguyên tắc lọc phạm vi (role + scoped theo
 xã/phường) như noticeKpiItems() gốc. */
 function noiKpiScopedRecords(){
 const roles=allowedRoles();
 const scopedNames=currentXaId!=null?new Set(roles.flatMap(r=>categorySeedForRole(r).flatMap(c=>c.items.map(it=>it[0])))):null;
 return (indicatorRecords||[]).filter(r=>roles.includes(r.role)&&(!scopedNames||scopedNames.has(r.indicator)));
 }
 function noiRowVb(r,label){
 const st=statusMeta(r.status);
 return `<button class="notify" onclick="closeModal();openRecordDetail('${r.id}')"><div><b>${noiStar(r)}${esc(r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><span class="badge ${st.cls||''}">${esc(label)}</span></button>`;
 }
 function noiRowGis(it){
 if(it.kind==='gis'){
 const rec=it.rec, linked=noiGisItemLinked(it), b=gisBottleneckMeta(rec.bottleneck_code);
 return `<button class="notify" onclick="closeModal();openGisEformDetail('${rec.id}')"><div><b>${noiStarGis(it)}${esc(rec.title)}</b><small>${esc(b.name)}</small></div><span class="badge ${linked?'ok':(rec.danger_level>=4?'red':'warn')}">${linked?'Đã giao xử lý':'GIS'}</span></button>`;
 }
 const c=it.rec, linked=noiGisItemLinked(it);
 return `<button class="notify" onclick="closeModal();openNoticeCameraDetail('${c.id}')"><div><b>${noiStarGis(it)}${esc(c.type)} · ${esc(c.camId)}</b><small>${esc(c.location||'—')}</small></div><span class="badge ${linked?'ok':(c.level==='Khẩn'?'red':'warn')}">${linked?'Đã giao xử lý':'Camera AI'}</span></button>`;
 }
 function noiRowKpi(r){
 const st=CAT_ST.find(s=>s.k===r.status)||CAT_ST[0];
 return `<button class="notify" onclick="closeModal();openIndicatorDetail('${r.id}')"><div><b>${esc(r.indicator||r.title)}</b><small>${esc(shortUnit(r.unit))}</small></div><span class="badge" style="border-color:${st.c};color:${st.c}">${esc(st.l)}</span></button>`;
 }
 /* Dải tab bấm nhanh theo bản vẽ tay anh gửi (thay dropdown loại): KC-QT / NV / VB / OKR / GIS — bỏ hẳn tab
 "Tất cả" theo yêu cầu, KC/QT trở thành tab mặc định khi mở widget. "KC/QT" (Khẩn cấp/Quan trọng) KHÁC bản chất
 4 tab loại còn lại — nó lọc THEO MỨC ƯU TIÊN, xuyên suốt nhiều loại, không phải theo nguồn dữ liệu. Chỉ gộp
 NV+VB+GIS (3 loại có sẵn field ưu tiên/mức khẩn thật: priority/urgency cho NV+VB, danger_level/level cho
 GIS+Camera) — KHÔNG gồm OKR/KPI vì indicatorRecords không có field tương đương, tránh suy diễn sai dữ liệu
 (đã thống nhất với anh). */
 const NOTI_TAB_DEFS=[
 {key:'urgent',short:'KC/QT',label:'Khẩn cấp/Quan trọng'},
 {key:'nv',short:'NV',label:'Nhiệm vụ'},
 {key:'vb',short:'VB',label:'Văn bản'},
 {key:'kpi',short:'OKR',label:'OKR/KPI'},
 {key:'gis',short:'GIS',label:'GIS/Camera AI'}
 ];
 /* "Quan trọng" (priority='Cao') và "Khẩn cấp" (urgency='Khẩn cấp') là 2 field ĐỘC LẬP trên record (nhiệm vụ tạo
 thủ công qua form chọn riêng từng ô "Mức độ quan trọng"/"Độ khẩn") — noiIsUrgentRecord() dùng OR để LỌC (còn nằm
 trong tab KC/QT hay không, chỉ cần 1 trong 2 đúng), khác hẳn noiStar() bên dưới cần biết CHÍNH XÁC cái nào đúng
 để chọn icon phù hợp, không gộp chung 1 boolean như trước. */
 /* Mức nào được đưa vào tab KC/QT theo «Cấu hình chức năng IOC» (tab Khẩn cấp/Quan trọng): Quan trọng = Cao,
 Độ khẩn = Khẩn cấp, Gấp (mặc định tắt) — dòng nào tắt thì không đưa vào tab và không hiện icon. */
 function noiLaQuanTrong(r){ return r.priority==='Cao'&&ichBat('noti.kcqt.quanTrongCao'); }
 function noiLaKhan(r){ return (r.urgency==='Khẩn cấp'&&ichBat('noti.kcqt.khanCap'))||(r.urgency==='Gấp'&&ichBat('noti.kcqt.gap')); }
 function noiIsUrgentRecord(r){ return noiLaQuanTrong(r)||noiLaKhan(r); }
 /* Thứ tự trong tab: Khẩn cấp → Gấp → chỉ Quan trọng. */
 function noiHangKhan(r){ return r.urgency==='Khẩn cấp'&&ichBat('noti.kcqt.khanCap')?0:(r.urgency==='Gấp'&&ichBat('noti.kcqt.gap')?1:2); }
 /* GIS: mức nguy hiểm từ ngưỡng ở cấu hình (mặc định 4) trở lên, dòng tắt thì không đưa vào; Camera AI mức Khẩn
 luôn đưa vào (dòng chỉ hiển thị ở cấu hình). */
 function noiIsUrgentGis(it){ return it.kind==='gis' ? (ichBat('noti.kcqt.gisNguyHiem')&&Number(it.rec.danger_level||0)>=ichSo('noti.kcqt.gisNguyHiem')) : it.rec.level==='Khẩn'; }
 /* Đánh dấu NGAY TRÊN mọi dòng notify (không riêng tab KC/QT) — khác tab KC/QT (thay hẳn badge trạng thái bằng
 "Khẩn cấp"/"Quan trọng"), ở đây chỉ CHÈN THÊM icon cạnh tiêu đề, badge trạng thái thật (Còn X ngày/Quá hạn X
 ngày/Mới/...) vẫn giữ nguyên — 2 việc không thay thế nhau. ❗ (đỏ) = quan trọng, ⚠️ (tam giác có "!") = khẩn
 cấp — đổi từ ⭐/🔥 theo đúng icon anh chỉ định. Vừa quan trọng vừa khẩn cấp thì hiện CẢ HAI. */
 function noiStar(r){
 let s='';
 if(noiLaQuanTrong(r)) s+='❗ ';
 if(noiLaKhan(r)) s+='⚠️ ';
 return s;
 }
 /* GIS/Camera AI chỉ có 1 khái niệm duy nhất (danger_level/level — bản chất là mức độ khẩn cấp/nguy hiểm, không
 có field "mức độ quan trọng" riêng như NV/VB) nên chỉ dùng đúng icon ⚠️ (khẩn cấp), không gán ❗ tùy tiện cho
 dữ liệu không có căn cứ. */
 function noiStarGis(it){ return noiIsUrgentGis(it)?'⚠️ ':''; }
 /* SỬA LẠI: tab KC/QT trước đây thay hẳn badge trạng thái thật bằng badge "Khẩn cấp"/"Quan trọng" (noiRowUrgentRecord
 cũ) — sai với đúng nguyên tắc đã thống nhất "⭐ chỉ chèn thêm, không thay thế badge trạng thái". Giờ tái dùng
 ĐÚNG các hàm render dòng đã có sẵn cho từng loại (đã tích hợp sẵn ⭐ qua noiStar) thay vì tự chế 1 badge riêng —
 NV lọc qua đúng 3 nhóm đang theo dõi (quá hạn/sắp hết hạn/mới), VB lọc qua đúng NOTI_DOCTASK_DEFS, GIS/Camera
 giữ nguyên (noiRowGis vốn đã đúng, không có badge giả thay thế). */
 /* "auto lọc khẩn cấp xếp trước quan trọng" — gắn cờ urgent=true/false cho từng dòng rồi SORT ỔN ĐỊNH (Array.sort
 trong JS hiện đại luôn ổn định) theo urgent trước, giữ nguyên thứ tự gốc (theo hạn/ngày tạo/thời gian nhận) bên
 trong từng nhóm. Không thể sort sau khi đã map thành chuỗi HTML nên phải gắn cờ NGAY LÚC build rồi mới map. */
 /* Nhiệm vụ: lấy theo đúng 1 trạng thái đã xếp (noiNvTrangThai) — không còn hiện 1 nhiệm vụ 2–3 lần; gồm mọi trạng
 thái đang bật trừ Hoàn thành. Văn bản: theo noiVbTrangThai. Xếp: Khẩn cấp → Gấp → chỉ Quan trọng, giữ thứ tự gốc
 bên trong (sort ổn định); GIS/Camera/CAD tính như Khẩn cấp. */
 function noiUrgentRows(matchQ){
 const todayMs=noiTodayMs();
 const mQ=r=>matchQ(`${r.title||''} ${r.unit||''}`);
 const items=[];
 const nv=noiNvNhom();
 ichUuTien('noti','nv').map(noiKhoa).filter(k=>k!=='hoanThanh').forEach(k=>{
 (nv[k]||[]).filter(noiIsUrgentRecord).filter(mQ).forEach(r=>items.push({hang:noiHangKhan(r),html:()=>noiNvRow(r,k,todayMs)}));
 });
 const vb=noiVbNhom();
 ichUuTien('noti','vb').forEach(id=>{
 (vb[noiKhoa(id)]||[]).filter(noiIsUrgentRecord).filter(mQ).forEach(r=>items.push({hang:noiHangKhan(r),html:()=>noiRowVb(r,noiNhanCauHinh(id))}));
 });
 const tsOfGis=it=>it.kind==='gis'?(it.rec.received_at||0):Date.now();
 noiGisCombinedItems().filter(noiIsUrgentGis).filter(it=>matchQ(it.kind==='gis'?it.rec.title:`${it.rec.type} ${it.rec.camId}`))
 .sort((a,b)=>tsOfGis(b)-tsOfGis(a))
 .forEach(it=>items.push({hang:0,html:()=>noiRowGis(it)})); // GIS/Camera chỉ có khái niệm khẩn cấp
 /* Notify CAD mức khẩn (bị từ chối, quá hạn xác nhận, hết ứng viên phù hợp, phiếu lệnh khẩn cho xã/phường). */
 if(typeof cadNotifyRows==='function') cadNotifyRows(matchQ,true).forEach(html=>items.push({hang:0,html:()=>html}));
 items.sort((a,b)=>a.hang-b.hang);
 return items.map(x=>x.html);
 }
 /* 2 nút mũi tên (demo_ioc.html) trượt dải tab. Lần sửa trước vẫn sai: tìm "tab đầu tiên có offsetLeft>cur+8"
 vô tình khớp luôn TAB ĐANG HIỆN (offsetLeft của nó > 0 do padding container), nên bấm lần đầu chỉ nhích đúng
 bằng khoảng padding đó (rất ngắn) thay vì nhảy sang tab kế tiếp thật. Sửa đúng: xét theo VÙNG ĐANG NHÌN THẤY
 [cur, cur+clientWidth] — nút "tiếp" tìm tab đầu tiên bị CẮT/NẰM NGOÀI bên phải vùng nhìn thấy (offsetLeft+
 offsetWidth > cur+clientWidth) rồi cuộn để mép trái tab đó khớp đúng đầu vùng nhìn; nút "trước" tìm tab cuối
 cùng nằm trước vùng nhìn (offsetLeft<cur) và cuộn ngược lại đúng mép trái tab đó. */
 function noiScrollTabs(dir){
 const box=document.getElementById('notiTabsBox'); if(!box) return;
 const btns=[...box.children];
 const cur=box.scrollLeft, viewEnd=cur+box.clientWidth;
 let left;
 if(dir>0){
 const target=btns.find(b=>b.offsetLeft+b.offsetWidth>viewEnd+2);
 left=target?target.offsetLeft:box.scrollWidth;
 } else {
 const target=btns.slice().reverse().find(b=>b.offsetLeft<cur-2);
 /* Bug vừa gặp: khi tab tìm được chính là TAB ĐẦU TIÊN, offsetLeft của nó vẫn > 0 (do padding/border container),
 nên cuộn "về trước" dừng lại giữa chừng chứ chưa thật sự về hẳn đầu — về đúng 0 tuyệt đối trong trường hợp
 này thay vì dùng offsetLeft của nó. */
 left=(target&&target!==btns[0])?target.offsetLeft:0;
 }
 box.scrollTo({left,behavior:'smooth'});
 }
 function onNotiTabClick(key){
 window.__notiActiveTab=key;
 window.__notiActiveStatuses=[];
 const dd=document.getElementById('notiStatusFilterDropdown'); if(dd) dd.classList.add('hidden');
 renderMyTasksNotify();
 noiResetListScroll();
 }
 /* Đổi tab chỉ VẼ LẠI nội dung #myTaskList tại chỗ — không tự đưa vị trí cuộn về đầu, nên nếu đang cuộn dở danh
 sách tab cũ rồi bấm sang tab khác, danh sách MỚI lại hiện ra ở đúng vị trí cuộn CŨ (trông như tự cuộn xuống,
 đúng lỗi anh chỉ ra). Duyệt ngược lên tổ tiên của #myTaskList và reset scrollTop về 0 ở đâu đang bị cuộn — NHƯNG
 PHẢI DỪNG LẠI trước <body>/<html>: lần trước duyệt tới tận document.body/documentElement khiến cuộn CẢ TRANG
 bị kéo lên đầu mỗi lần đổi tab (bug mới anh vừa gặp) — chỉ nên reset cuộn NỘI BỘ của widget, không được đụng
 tới vị trí cuộn của cả trang (thứ người dùng đang xem, không liên quan gì tới việc đổi tab trong 1 widget con). */
 function noiResetListScroll(){
 let el=document.getElementById('myTaskList');
 while(el && el!==document.body && el!==document.documentElement){
 if(el.scrollHeight>el.clientHeight+2) el.scrollTop=0;
 el=el.parentElement;
 }
 }
 /* Icon phễu (#notiFilterBtn) mở 1 DROPDOWN tích chọn nhiều trạng thái (checkbox), không phải modal chọn 1 như
 bản trước — anh yêu cầu rõ "bấm vào ra dropbox, tích chọn các trạng thái muốn lọc". Tái dùng đúng cơ chế
 .ms-wrap/.ms-dropdown/toggleUnitDropdown() đã có sẵn (assign-task.js) — kể cả hành vi tự đóng khi bấm ra ngoài
 (listener document click đã lắng nghe sẵn mọi .ms-wrap, không cần viết thêm). window.__notiActiveStatuses là
 MẢNG các key đã tích — rỗng nghĩa là không lọc (hiện hết), giống hệt "Tất cả" trước đây nhưng giờ chọn được
 nhiều trạng thái cùng lúc thay vì chỉ 1. */
 function renderNotiStatusFilterDropdown(){
 const dd=document.getElementById('notiStatusFilterDropdown'); if(!dd) return;
 const activeTab=window.__notiActiveTab||'urgent';
 if(activeTab==='urgent'){
 dd.innerHTML=`<div class="field-opt-row" style="opacity:.6;cursor:default">Chọn 1 loại cụ thể (NV/VB/GIS/OKR) để lọc trạng thái</div>`;
 return;
 }
 const statusDefs=notiStatusDefsFor(activeTab);
 const selected=window.__notiActiveStatuses||[];
 const allChecked=selected.length===0;
 const totalCount=statusDefs.reduce((a,s)=>a+s.count,0);
 /* .field-opt-row KHÔNG có style mặc định trong CSS (chỉ có :hover) — mọi nơi khác đều tự khai padding/radius/
 font-size riêng, dòng checkbox này trước đó thiếu hẳn nên bị bẹp dí sát mép, đó là lý do "xấu". Thêm đủ padding
 + min-height cho vùng bấm thoải mái, badge đếm đổi sang khối tròn cố định thay vì .badge mặc định (vốn thiết
 kế cho text dài, không hợp con số ngắn căn giữa). */
 /* Dùng ĐÚNG class .badge (không tự bịa màu chữ) — .badge đã có sẵn override riêng cho cả 3 theme (theme-light
 đổi hẳn sang chữ/nền tối trên nền sáng); lần trước hardcode color:#d9efff cho nhãn + màu xanh cho badge khiến
 chữ mờ hẳn trên nền trắng ở theme sáng (không đọc được), đúng lỗi anh chỉ ra. */
 const optRow=(key,label,count,checked)=>`<label class="field-opt-row" style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;min-height:20px"><input type="checkbox" value="${key}" ${checked?'checked':''} onchange="onNotiStatusCheckboxChange(this)" style="width:16px;height:16px;flex:0 0 auto;accent-color:#49bcff;cursor:pointer" /><span style="flex:1">${esc(label)}</span><span class="badge" style="flex:0 0 auto;min-width:34px;text-align:center">${fmt(count)}</span></label>`;
 dd.innerHTML=optRow('__all__','Tất cả',totalCount,allChecked)
 +'<div style="margin:6px 2px;border-top:1px solid rgba(87,178,255,.18)"></div>'
 +statusDefs.map(s=>optRow(s.key,s.label,s.count,selected.includes(s.key))).join('');
 }
 function onNotiStatusCheckboxChange(el){
 const dd=document.getElementById('notiStatusFilterDropdown');
 if(el.value==='__all__'){
 window.__notiActiveStatuses=[];
 } else {
 const checked=[...dd.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value).filter(v=>v!=='__all__');
 window.__notiActiveStatuses=checked;
 }
 renderMyTasksNotify();
 /* Tích/bỏ tích checkbox lọc trạng thái cũng phải đưa danh sách về đầu, giống hệt lúc đổi tab (noiResetListScroll
 đã có sẵn, tái dùng luôn) — trước đây chỉ reset khi đổi TAB, quên mất lọc trạng thái cũng làm danh sách đổi
 hẳn nội dung nên cũng cần về đầu. */
 noiResetListScroll();
 }
 /* Tách rows-builder theo ĐÚNG 1 loại cụ thể (không bao giờ nhận typeKey==='all') để loại "Tất cả" ở lọc 1 tái
 dùng được — gọi lần lượt cho cả 4 loại thật rồi nối lại, thay vì viết lại logic. statuses là MẢNG (multi-select);
 mảng rỗng = không lọc (hiện hết), LUÔN rỗng khi gọi cho loại "Tất cả"/"KC-QT" (lọc trạng thái không "ăn theo"
 được khi chưa chọn đúng 1 loại cụ thể). */
 function notiRowsForType(typeKey,statuses,matchQ){
 const showAll=!statuses||statuses.length===0;
 const has=k=>showAll||statuses.includes(k);
 if(typeKey==='nv'){
 /* Mỗi nhiệm vụ 1 trạng thái (noiNvTrangThai), các nhóm nối theo thứ tự ưu tiên ở cấu hình; nhật ký «Cập nhật
 trạng thái» ở cuối (chỉ khi đang bật). */
 const todayMs=noiTodayMs();
 const mQ=r=>matchQ(`${r.title||''} ${r.unit||''}`);
 const g=noiNvNhom(), rows=[];
 ichUuTien('noti','nv').map(noiKhoa).forEach(k=>{ if(has(k)) rows.push(...(g[k]||[]).filter(mQ).map(r=>()=>noiNvRow(r,k,todayMs))); });
 if(has('status')) rows.push(...myTaskStatusLogScoped().filter(x=>matchQ(`${x.title||''} ${x.text||''}`)).map(x=>()=>myTaskRowStatus(x)));
 return rows;
 }
 if(typeKey==='vb'){
 /* Mỗi văn bản 1 trạng thái (noiVbTrangThai), nhóm nối theo thứ tự ưu tiên ở cấu hình; mới nhất lên đầu trong
 từng nhóm (noiVbNhom). */
 const g=noiVbNhom(), rows=[];
 ichUuTien('noti','vb').forEach(id=>{
 const k=noiKhoa(id); if(!has(k)) return;
 rows.push(...(g[k]||[]).filter(r=>matchQ(`${r.title||''} ${r.unit||''}`)).map(r=>()=>noiRowVb(r,noiNhanCauHinh(id))));
 });
 return rows;
 }
 if(typeKey==='gis'){
 /* GIS eform có received_at (epoch ms thật) — Camera AI không có mốc ngày (chỉ có giờ trong ngày), coi như
 "vừa nhận hôm nay" (Date.now()) để không bị chìm dưới GIS cũ, vẫn đúng tinh thần "mới nhất lên đầu". */
 const tsOf=it=>it.kind==='gis'?(it.rec.received_at||0):Date.now();
 /* Notify CAD (điều phối điểm nghẽn) luôn mới nhất nên đứng đầu tab — chỉ hiện khi không lọc trạng thái, vì
    bộ trạng thái của tab (đã giao/chưa giao) không áp được cho sự kiện điều phối. */
 const cadRows=(showAll&&typeof cadNotifyRows==='function'?cadNotifyRows(matchQ,false):[]).map(html=>()=>html);
 return cadRows.concat(noiGisCombinedItems()
 .filter(it=>noiGisItemLinked(it)?(ichBat('noti.gis.daGiao')&&has('assigned')):(ichBat('noti.gis.chuaXuLy')&&has('pending')))
 .filter(it=>matchQ(it.kind==='gis'?it.rec.title:`${it.rec.type} ${it.rec.camId}`))
 .sort((a,b)=>tsOf(b)-tsOf(a))
 .map(it=>()=>noiRowGis(it)));
 }
 if(typeKey==='kpi'){
 return noiKpiScopedRecords()
 .filter(r=>ichBat('noti.kpi.'+r.status)&&has(r.status))
 .filter(r=>matchQ(`${r.indicator||r.title||''} ${r.unit||''}`))
 .map(r=>()=>noiRowKpi(r));
 }
 return [];
 }
 function renderMyTasksNotify(){
 checkMyTaskTransitions();
 const tabsBox=document.getElementById('notiTabsBox');
 const filterBtn=document.getElementById('notiFilterBtn');
 const listBox=document.getElementById('myTaskList');
 const searchInput=document.getElementById('myTaskSearchInput');
 if(!tabsBox||!listBox) return;
 __noiTam={};
 try{ noiVeDanhSach(tabsBox,filterBtn,listBox,searchInput); } finally{ __noiTam=null; }
 }
 function noiVeDanhSach(tabsBox,filterBtn,listBox,searchInput){
 const activeTab=window.__notiActiveTab||'urgent';
 const q=((searchInput&&searchInput.value)||'').trim().toLowerCase();
 const matchQ=txt=>!q||String(txt||'').toLowerCase().includes(q);
 /* Hiện ĐỦ tên (t.label) NHƯNG vẫn phải giữ ĐÚNG 1 hàng (anh từ chối phương án 2 hàng) — 5 tên đầy đủ không thể
 vừa 1 hàng hẹp của widget nếu ép co chữ/tự xuống dòng, nên chuyển hẳn sang dải CUỘN NGANG: các tab giữ nguyên
 kích thước tự nhiên theo tên (flex:0 0 auto, không co), hàng chỉ cao đúng 1 dòng, tràn ra thì cuộn/vuốt ngang
 để xem tab còn lại thay vì vỡ dòng hay ép chữ nhỏ khó đọc. */
 tabsBox.style.display='flex';
 tabsBox.style.overflowX='auto';
 tabsBox.style.flexWrap='nowrap';
 let rows;
 const isCrossType=(activeTab==='urgent');
 if(activeTab==='urgent'){
 window.__notiActiveStatuses=[];
 rows=noiUrgentRows(matchQ);
 } else {
 const statusDefs=notiStatusDefsFor(activeTab);
 const validKeys=statusDefs.map(s=>s.key);
 const activeStatuses=(window.__notiActiveStatuses||[]).filter(k=>validKeys.includes(k));
 window.__notiActiveStatuses=activeStatuses;
 rows=notiRowsForType(activeTab,activeStatuses,matchQ);
 }
 /* Notify đang phóng to (js/features/notify-fs.js): tab hiện thêm số thông báo của tab đó (đếm đúng danh sách tab sẽ
 hiện, theo ô tìm kiếm; tab đang mở = đúng số dòng đang hiện, kể cả lọc trạng thái). Widget nhỏ không đếm để
 khỏi tốn công vẽ. Vẽ dải tab SAU khi đã có rows để dùng lại số của tab đang mở. */
 const tabCount=(typeof nfsActive==='function'&&nfsActive())
 ? (k=>`<em class="noti-tab-count">${fmt(k===activeTab?rows.length:(k==='urgent'?noiUrgentRows(matchQ):notiRowsForType(k,[],matchQ)).length)}</em>`)
 : (()=> '');
 tabsBox.innerHTML=NOTI_TAB_DEFS.map(t=>
 `<button class="gis-report-tab${t.key===activeTab?' active':''}" data-uv-item="notify-tab-${t.key}" data-uv-label="${esc(t.label)}" data-uv-icon="🔔" data-uv-parent="notify" style="flex:0 0 auto;white-space:nowrap;padding:8px 12px" onclick="onNotiTabClick('${t.key}')">${esc(t.label)}${tabCount(t.key)}</button>`
 ).join('');
 renderNotiStatusFilterDropdown();
 /* Icon phễu khóa lại (disabled) khi đang ở tab KC/QT (gộp nhiều loại) — không có 1 bộ trạng thái để "ăn theo",
 tránh anh bấm vào tưởng lọc được mà không hiểu vì sao không có gì xảy ra. */
 if(filterBtn){
 filterBtn.disabled=isCrossType;
 filterBtn.style.opacity=isCrossType?'.4':'1';
 filterBtn.title=isCrossType?'Chọn 1 loại cụ thể (NV/VB/GIS/OKR) để lọc trạng thái':'Lọc trạng thái';
 }
 /* Chỉ tiêu OKR/KPI có thể lên tới hàng chục nghìn bản ghi — render hết 1 lúc thành hàng chục nghìn <button> DOM
 node là nguyên nhân lag thực tế anh gặp lần trước. Thay vì cắt cứng + báo "còn X khác" (ép anh phải tìm kiếm
 mới xem tiếp), giờ tải dần theo kiểu infinite scroll: render trước NOTI_PAGE_SIZE dòng đầu, cuộn gần chạm đáy
 danh sách (IntersectionObserver theo dõi 1 "sentinel" rỗng cuối danh sách, root:null = theo viewport vì bản
 thân widget không tự cuộn, cả TRANG mới là nơi thật sự cuộn) thì tự nạp thêm đúng 1 đợt tiếp theo — dữ liệu vẫn
 tính đủ 100%, chỉ khác ở tốc độ đưa vào DOM. Từ 17/11/2026 mỗi phần tử của rows là 1 HÀM trả HTML (noiDong):
 dòng chỉ được dựng khi sắp hiện, không dựng sẵn hàng nghìn chuỗi HTML rồi chỉ hiện 50. */
 if(__notiScrollObserver){ __notiScrollObserver.disconnect(); __notiScrollObserver=null; }
 const NOTI_PAGE_SIZE=50;
 window.__notiAllRows=rows;
 window.__notiRenderedCount=Math.min(NOTI_PAGE_SIZE,rows.length);
 listBox.innerHTML=rows.slice(0,window.__notiRenderedCount).map(noiDong).join('')||`<div class="access-lock">Không có notify${q?' khớp tìm kiếm':''}.</div>`;
 if(rows.length>window.__notiRenderedCount){
 const sentinel=document.createElement('div');
 sentinel.id='notiLoadMoreSentinel';
 sentinel.className='access-lock';
 sentinel.textContent='Đang tải thêm…';
 listBox.appendChild(sentinel);
 __notiScrollObserver=new IntersectionObserver(entries=>{ if(entries[0].isIntersecting) loadMoreNotiRows(); },{root:null,rootMargin:'300px'});
 __notiScrollObserver.observe(sentinel);
 }
 /* Chỉ áp lại «Ẩn/hiện giao diện» cho 5 nút tab vừa vẽ (uvApplyNotify), không rà cả trang (uvApply). */
 if(typeof uvApplyNotify==='function') uvApplyNotify(); else if(typeof uvApply==='function') uvApply(false);
 }
 let __notiScrollObserver=null;
 /* 1 phần tử danh sách Noti → HTML. Phần tử là hàm (dựng muộn); chuỗi/{html} vẫn nhận để an toàn. */
 function noiDong(x){ return typeof x==='function'?x():(typeof x==='string'?x:(x&&x.html)||''); }
 function loadMoreNotiRows(){
 const rows=window.__notiAllRows||[];
 const cur=window.__notiRenderedCount||0;
 const next=rows.slice(cur,cur+50);
 const sentinel=document.getElementById('notiLoadMoreSentinel');
 if(next.length&&sentinel) sentinel.insertAdjacentHTML('beforebegin',next.map(noiDong).join(''));
 window.__notiRenderedCount=cur+next.length;
 if(window.__notiRenderedCount>=rows.length){
 if(__notiScrollObserver){ __notiScrollObserver.disconnect(); __notiScrollObserver=null; }
 if(sentinel) sentinel.remove();
 }
 }
 /* Admin lưu «Cấu hình chức năng IOC» (cùng trang, hoặc oua-admin.html ở tab khác cùng trình duyệt) → Noti vẽ lại
 ngay. Ngưỡng «Sắp hết hạn» đổi làm bucket nhật ký của nhiều nhiệm vụ đổi theo — lấy lại mốc (r._lastNotiBucket)
 trước khi vẽ để checkMyTaskTransitions() không sinh hàng loạt dòng «Cập nhật trạng thái» giả. */
 ichKhiDoi(()=>{
 (records||[]).forEach(r=>{ if(r.metric==='received'&&r._lastNotiBucket!==undefined) r._lastNotiBucket=myTaskBucket(r); });
 if(document.getElementById('myTaskList')) renderMyTasksNotify();
 });
