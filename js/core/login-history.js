 /* ============================== NHẬT KÝ ĐĂNG NHẬP (menu tài khoản → "Xem nhật ký đăng nhập") ==============================
 Theo tài liệu "Bổ sung chức năng.pdf" (09/10/2026). Mỗi người chỉ xem được lịch sử đăng nhập CỦA CHÍNH tài khoản
 đang đăng nhập (currentAccount) — không có tham số chọn tài khoản khác, kể cả khi đang "Xem theo cơ cấu tổ chức"
 (view-as không đổi currentAccount nên vẫn đúng người).
 Nguồn dữ liệu gồm 2 phần, gộp rồi sắp xếp giảm dần theo thời gian:
 1) Lượt đăng nhập THẬT trong demo — enterApp() ghi lượt thành công (kèm mã phiên để đánh dấu "Phiên hiện tại"),
    login() ghi lượt thất bại "Sai mật khẩu" khi chọn đúng tài khoản nhưng nhập sai mật khẩu. Lưu localStorage.
 2) Lịch sử giả lập ~400 ngày trước lượt thật đầu tiên — sinh cố định theo (tài khoản, ngày) nên tải lại trang vẫn ra
    đúng số cũ. Nhịp: ngày làm việc 1–3 lượt (sáng đầu giờ, đầu giờ chiều, thỉnh thoảng tối ở nhà), cuối tuần/ngày lễ
    rất ít; IP mạng nội bộ cơ quan 10.x là chính, ngoài giờ dùng IP nhà mạng VNPT/Viettel/FPT. Đây là số mô phỏng. */
 const LOGIN_FAIL_REASONS={wrong_password:'Sai mật khẩu',locked:'Tài khoản bị khóa',session_expired:'Phiên hết hạn'}; // dùng chung với log admin
 const LH_STORAGE_KEY='px-ioc-login-history';
 const LH_MAX_RANGE_DAYS=365;
 const LH_PAGE_SIZE=20;
 const LH_SEED_DAYS=400;
 const LH_DAY_MS=86400000;
 /* Ngày nghỉ lễ chính thức trong khoảng giả lập — coi như Chủ nhật (gần như không ai đăng nhập). */
 const LH_HOLIDAYS=new Set(['2026-01-01','2026-02-14','2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-04-30','2026-05-01','2026-09-01','2026-09-02']);
 const LH_PUBLIC_PREFIX=['113.190.','14.177.','123.24.','171.224.','27.72.','116.96.','42.112.','118.70.'];

 const LH={open:false,preset:'week',range:null,draftFrom:'',draftTo:'',status:'all',page:1,loading:false,error:null,rows:[],formErr:'',token:0,
 cal:{open:false,field:'from',start:null,end:null,view:null}};

 /* ---------- Ngày giờ ---------- */
 function lhToday(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
 function lhAddDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
 function lhSameDay(a,b){return !!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
 function lhIsoDay(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
 function lhFmtDate(d){return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;}
 function lhFmtTime(d){return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;}
 function lhParseDate(s){
 const m=String(s||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(!m) return null;
 const d=new Date(+m[3],+m[2]-1,+m[1]);
 return (d.getDate()===+m[1]&&d.getMonth()===+m[2]-1)?d:null;
 }
 function lhDaysInclusive(a,b){return Math.round((b-a)/LH_DAY_MS)+1;}
 /* Tuần/Tháng/Quý = kỳ hiện tại chứa hôm nay, tính tới hết hôm nay (tuần bắt đầu Thứ Hai). */
 function lhPresetRange(p){
 const t=lhToday();
 if(p==='month') return {from:new Date(t.getFullYear(),t.getMonth(),1),to:t};
 if(p==='quarter') return {from:new Date(t.getFullYear(),Math.floor(t.getMonth()/3)*3,1),to:t};
 return {from:lhAddDays(t,-((t.getDay()+6)%7)),to:t};
 }

 /* ---------- Dữ liệu ---------- */
 function lhUserKey(acc){return String((acc&&(acc.user||acc.title))||'').toLowerCase();}
 function lhStore(){
 if(!window.__lhStore){
 try{window.__lhStore=JSON.parse(localStorage.getItem(LH_STORAGE_KEY)||'{}')||{};}catch(e){window.__lhStore={};}
 }
 return window.__lhStore;
 }
 function lhSave(){try{localStorage.setItem(LH_STORAGE_KEY,JSON.stringify(lhStore()));}catch(e){}}
 function lhProfile(user){
 const r=gisRng(gisSeedNum(`lh-profile|${user}`));
 const net=[12,14,16,21][Math.floor(r()*4)], sub=20+Math.floor(r()*200);
 const host=10+Math.floor(r()*200);
 return {lan:`10.${net}.${sub}.${host}`,lan2:`10.${net}.${sub}.${host+1+Math.floor(r()*40)}`};
 }
 /* IP nhà mạng đổi theo tháng (IP động hộ gia đình) — cùng tháng thì cùng 1 IP. */
 function lhHomeIp(user,d){
 const r=gisRng(gisSeedNum(`lh-home|${user}|${d.getFullYear()}-${d.getMonth()}`));
 return `${LH_PUBLIC_PREFIX[Math.floor(r()*LH_PUBLIC_PREFIX.length)]}${1+Math.floor(r()*254)}.${1+Math.floor(r()*254)}`;
 }
 function lhSeedDay(user,day,prof){
 const r=gisRng(gisSeedNum(`lh-day|${user}|${lhIsoDay(day)}`));
 const dow=day.getDay(), off=LH_HOLIDAYS.has(lhIsoDay(day))||dow===0;
 const out=[];
 const at=(h,m,s)=>new Date(day.getFullYear(),day.getMonth(),day.getDate(),h,m,s).getTime();
 let slots=[];
 if(off){ if(r()<0.08) slots=[{h:9+Math.floor(r()*11),home:true}]; }
 else if(dow===6){ if(r()<0.25) slots=[{h:8+Math.floor(r()*4),home:r()<0.7}]; }
 else if(r()<0.93){
 slots=[{h:7,m0:35,span:65}];
 const k=r();
 if(k<0.50) slots.push({h:13,m0:15,span:75});
 if(k<0.15) slots.push({h:19,m0:30,span:150,home:true});
 }
 slots.forEach((sl,i)=>{
 const mins=sl.m0!=null?sl.m0+Math.floor(r()*sl.span):Math.floor(r()*60);
 const ts=at(sl.h+Math.floor(mins/60),mins%60,Math.floor(r()*60));
 const ip=sl.home?lhHomeIp(user,day):(r()<0.86?prof.lan:prof.lan2);
 const x=r();
 if(x<0.006){
 /* Nhập sai liên tiếp → hệ thống khóa → quản trị mở khóa, đăng nhập lại sau 40–100 phút. */
 out.push({ts:ts-170000,ip,ok:false,reason:'wrong_password'},{ts:ts-120000,ip,ok:false,reason:'wrong_password'},{ts:ts-75000,ip,ok:false,reason:'wrong_password'},{ts:ts-30000,ip,ok:false,reason:'locked'});
 out.push({ts:ts+(40+Math.floor(r()*60))*60000,ip,ok:true});
 return;
 }
 if(x<0.040) out.push({ts:ts-(20+Math.floor(r()*70))*1000,ip,ok:false,reason:'wrong_password'});
 else if(x<0.055) out.push({ts:ts-(5+Math.floor(r()*20))*1000,ip,ok:false,reason:'session_expired'});
 out.push({ts,ip,ok:true});
 });
 return out;
 }
 /* Lịch sử giả lập dừng ngay trước lượt đăng nhập thật đầu tiên của tài khoản (seedUntil) — để không chen số giả vào giữa
    các phiên thật đã dùng trong demo. */
 function lhSeedLog(user){
 window.__lhSeedCache=window.__lhSeedCache||{};
 const st=lhStore()[user];
 const until=(st&&st.seedUntil)||Date.now();
 const ck=`${user}|${until}`;
 if(window.__lhSeedCache[ck]) return window.__lhSeedCache[ck];
 const prof=lhProfile(user), end=new Date(until), endDay=new Date(end.getFullYear(),end.getMonth(),end.getDate());
 const out=[];
 for(let i=LH_SEED_DAYS;i>=0;i--){
 lhSeedDay(user,lhAddDays(endDay,-i),prof).forEach(e=>{if(e.ts<until) out.push(e);});
 }
 window.__lhSeedCache[ck]=out;
 return out;
 }
 function lhUserLog(user){
 const st=lhStore()[user];
 return lhSeedLog(user).concat(st?st.events:[]).sort((a,b)=>b.ts-a.ts);
 }
 function lhPushEvent(user,ev){
 if(!user) return;
 const store=lhStore();
 if(!store[user]) store[user]={seedUntil:ev.ts,events:[]};
 store[user].events.push(ev);
 if(store[user].events.length>500) store[user].events.splice(0,store[user].events.length-500);
 lhSave();
 }
 /* Gọi từ enterApp() — mỗi lần vào app là 1 phiên mới; window.__lhSession giữ mã phiên để đánh dấu "Phiên hiện tại". */
 function lhRecordLogin(acc){
 const user=lhUserKey(acc); if(!user) return;
 const sid=`s-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
 window.__lhSession={user,sid};
 lhPushEvent(user,{ts:Date.now(),ip:lhProfile(user).lan,ok:true,sid});
 }
 /* Gọi từ login() khi đã xác định đúng tài khoản nhưng mật khẩu sai. */
 function lhRecordFailedLogin(user){
 user=String(user||'').toLowerCase(); if(!user) return;
 lhPushEvent(user,{ts:Date.now(),ip:lhProfile(user).lan,ok:false,reason:'wrong_password'});
 }
 /* Mô phỏng 1 lần gọi API (có độ trễ) — để giao diện có đủ trạng thái đang tải / lỗi như khi nối API thật.
    window.__lhSimulateError=true để thử trạng thái lỗi. */
 function lhFetch(user,range){
 return new Promise((resolve,reject)=>{
 setTimeout(()=>{
 try{
 if(window.__lhSimulateError) throw new Error('simulated');
 const a=range.from.getTime(), b=lhAddDays(range.to,1).getTime();
 resolve(lhUserLog(user).filter(e=>e.ts>=a&&e.ts<b));
 }catch(e){reject(e);}
 },280+Math.floor(Math.random()*240));
 });
 }

 /* ---------- Menu tài khoản ---------- */
 function toggleAccountMenu(force){
 const menu=document.getElementById('acctMenu'); if(!menu) return;
 const show=force!=null?force:menu.classList.contains('hidden');
 menu.classList.toggle('hidden',!show);
 document.getElementById('userPill')?.setAttribute('aria-expanded',show?'true':'false');
 }
 document.addEventListener('click',e=>{
 const pill=document.getElementById('userPill');
 if(pill&&!pill.contains(e.target)) toggleAccountMenu(false);
 });
 function openChangePassword(){
 toggleAccountMenu(false);
 if(!currentAccount) return;
 document.getElementById('modalTitle').textContent='Đổi mật khẩu';
 document.getElementById('modalSub').textContent=currentAccount.title||'';
 document.getElementById('modalBody').innerHTML=`<form class="lh-pw-form" onsubmit="event.preventDefault();submitChangePassword()">
 <label>Mật khẩu hiện tại<input type="password" id="pwOld" autocomplete="current-password"/></label>
 <label>Mật khẩu mới<input type="password" id="pwNew" autocomplete="new-password"/></label>
 <label>Nhập lại mật khẩu mới<input type="password" id="pwNew2" autocomplete="new-password"/></label>
 <small class="muted">Tối thiểu 8 ký tự, có cả chữ và số.</small>
 <div class="lh-form-err" id="pwErr"></div>
 <div class="lh-pw-actions"><button type="button" class="ghost" onclick="closeModal()">Hủy</button><button type="submit" class="primary">Đổi mật khẩu</button></div>
 </form>`;
 document.getElementById('modal').classList.add('modal-compact');
 openModal();
 setTimeout(()=>document.getElementById('pwOld')?.focus(),50);
 }
 /* Bản demo không có máy chủ tài khoản — kiểm tra hợp lệ đầy đủ nhưng không lưu mật khẩu mới (đăng nhập demo vẫn dùng 123456). */
 function submitChangePassword(){
 const o=document.getElementById('pwOld').value, n=document.getElementById('pwNew').value, n2=document.getElementById('pwNew2').value;
 const err=msg=>{document.getElementById('pwErr').textContent=msg;};
 if(!o||!n||!n2) return err('Vui lòng nhập đủ 3 ô.');
 if(o!==(currentAccount.pass||'123456')) return err('Mật khẩu hiện tại không đúng.');
 if(n.length<8||!/[A-Za-zÀ-ỹ]/.test(n)||!/\d/.test(n)) return err('Mật khẩu mới tối thiểu 8 ký tự, có cả chữ và số.');
 if(n===o) return err('Mật khẩu mới phải khác mật khẩu hiện tại.');
 if(n!==n2) return err('Nhập lại mật khẩu mới chưa khớp.');
 closeModal();
 toast('Đã đổi mật khẩu.');
 }

 /* ---------- Pop-up nhật ký đăng nhập ---------- */
 function lhEnsureDom(){
 if(document.getElementById('lhOverlay')) return;
 const el=document.createElement('div');
 el.id='lhOverlay'; el.className='lh-overlay';
 el.innerHTML=`<section class="lh-modal" role="dialog" aria-modal="true" aria-labelledby="lhTitle" onclick="lhModalClick(event)">
 <header class="lh-head">
 <span class="lh-head-ic"><i class="ti ti-file-text"></i></span>
 <div class="lh-head-txt"><h3 id="lhTitle">Nhật ký đăng nhập</h3><div class="lh-sub" id="lhSub"></div></div>
 <button type="button" class="lh-close" onclick="closeLoginHistory()" aria-label="Đóng"><i class="ti ti-x"></i></button>
 </header>
 <div class="lh-body" id="lhBody"></div>
 <footer class="lh-foot" id="lhFoot"></footer>
 </section>`;
 el.addEventListener('mousedown',e=>{el.__downOnSelf=(e.target===el);});
 el.addEventListener('click',e=>{if(e.target===el&&el.__downOnSelf) closeLoginHistory();});
 document.body.appendChild(el);
 }
 function openLoginHistory(){
 toggleAccountMenu(false);
 if(!currentAccount) return;
 lhEnsureDom();
 Object.assign(LH,{open:true,ddOpen:false,preset:'week',range:lhPresetRange('week'),status:'all',page:1,formErr:'',rows:[],error:null});
 LH.cal.open=false;
 lhSyncDraft();
 document.getElementById('lhSub').textContent=[currentAccount.title,currentAccount.subtitle].filter(Boolean).join(' · ');
 document.getElementById('lhOverlay').classList.add('show');
 document.body.classList.add('lh-open');
 lockScroll();
 lhLoad();
 setTimeout(()=>document.querySelector('#lhOverlay .lh-close')?.focus(),30);
 }
 function closeLoginHistory(){
 if(!LH.open) return;
 LH.open=false; LH.cal.open=false; LH.token++;
 document.getElementById('lhOverlay')?.classList.remove('show');
 document.body.classList.remove('lh-open');
 unlockScroll();
 }
 /* Esc: đang mở lịch thì đóng lịch trước, lần nữa mới đóng pop-up. Bắt ở pha capture để các xử lý Esc khác (modal chung)
    không đóng nhầm thứ nằm bên dưới. */
 document.addEventListener('keydown',e=>{
 if(e.key!=='Escape') return;
 if(LH.open){
 e.stopImmediatePropagation(); e.preventDefault();
 if(LH.ddOpen){LH.ddOpen=false;lhRender();document.querySelector('.lh-status-btn')?.focus();}
 else if(LH.cal.open){LH.cal.open=false;lhRender();}
 else closeLoginHistory();
 return;
 }
 if(!document.getElementById('acctMenu')?.classList.contains('hidden')) toggleAccountMenu(false);
 },true);
 function lhSyncDraft(){LH.draftFrom=lhFmtDate(LH.range.from);LH.draftTo=lhFmtDate(LH.range.to);}
 function lhLoad(){
 const tk=++LH.token;
 LH.loading=true; LH.error=null; LH.page=1;
 lhRender();
 lhFetch(lhUserKey(currentAccount),LH.range).then(rows=>{
 if(tk!==LH.token) return;
 LH.rows=rows; LH.loading=false; lhRender();
 }).catch(()=>{
 if(tk!==LH.token) return;
 LH.rows=[]; LH.loading=false; LH.error='Không tải được nhật ký đăng nhập. Vui lòng thử lại.'; lhRender();
 });
 }
 function lhSetPreset(p){
 if(p===LH.preset) return;
 LH.preset=p; LH.formErr=''; LH.cal.open=false;
 if(p==='custom'){lhSyncDraft();lhRender();return;} // Tùy chọn: chỉ hiện dòng chọn ngày, chưa tải lại
 LH.range=lhPresetRange(p);
 lhLoad();
 }
 /* Ô "Trạng thái" tự vẽ thay cho <select> gốc — danh sách xổ của <select> do trình duyệt vẽ (nền trắng, chữ đen), không
    theo được màu pop-up. */
 const LH_STATUS_OPTS=[['all','Tất cả'],['ok','Thành công'],['fail','Thất bại']];
 function lhStatusHtml(){
 const cur=LH_STATUS_OPTS.find(o=>o[0]===LH.status)||LH_STATUS_OPTS[0];
 return `<div class="lh-status ${LH.ddOpen?'open':''}">
 <button type="button" class="lh-status-btn" aria-haspopup="listbox" aria-expanded="${!!LH.ddOpen}" onclick="lhToggleStatus()"><span>Trạng thái</span><b>${cur[1]}</b><i class="ti ti-chevron-down"></i></button>
 ${LH.ddOpen?`<div class="lh-dd" role="listbox" onkeydown="lhDdKey(event)">${LH_STATUS_OPTS.map(([k,l])=>`<button type="button" role="option" aria-selected="${LH.status===k}" class="${LH.status===k?'active':''}" onclick="lhSetStatus('${k}')"><span class="lh-dd-dot ${k}"></span>${l}${LH.status===k?'<i class="ti ti-check"></i>':''}</button>`).join('')}</div>`:''}
 </div>`;
 }
 function lhDdKey(e){
 if(e.key!=='ArrowDown'&&e.key!=='ArrowUp') return;
 e.preventDefault();
 const btns=[...document.querySelectorAll('.lh-dd button')], i=btns.indexOf(document.activeElement);
 btns[(i+(e.key==='ArrowDown'?1:-1)+btns.length)%btns.length]?.focus();
 }
 function lhToggleStatus(){LH.ddOpen=!LH.ddOpen;LH.cal.open=false;lhRender();if(LH.ddOpen)document.querySelector('.lh-dd button.active')?.focus();}
 function lhSetStatus(v){LH.status=v;LH.page=1;LH.ddOpen=false;lhRender();document.querySelector('.lh-status-btn')?.focus();}
 function lhGoPage(p){LH.page=p;lhRender();document.querySelector('#lhBody .lh-table-wrap')?.scrollTo({top:0});}
 function lhValidate(fromS,toS){
 if(!String(fromS).trim()||!String(toS).trim()) return {err:'Vui lòng nhập đủ Từ ngày và Đến ngày.'};
 const f=lhParseDate(fromS), t=lhParseDate(toS);
 if(!f||!t) return {err:'Ngày không hợp lệ, nhập theo dạng dd/mm/yyyy.'};
 const today=lhToday();
 if(f>today||t>today) return {err:'Không chọn ngày trong tương lai.'};
 if(f>t) return {err:'Từ ngày không được lớn hơn Đến ngày.'};
 if(lhDaysInclusive(f,t)>LH_MAX_RANGE_DAYS) return {err:`Khoảng thời gian tối đa ${LH_MAX_RANGE_DAYS} ngày.`};
 return {from:f,to:t};
 }
 function lhApplyCustom(){
 const v=lhValidate(LH.draftFrom,LH.draftTo);
 LH.cal.open=false;
 if(v.err){LH.formErr=v.err;lhRender();return;}
 LH.formErr=''; LH.range={from:v.from,to:v.to};
 lhLoad();
 }
 function lhResetCustom(){
 LH.range=lhPresetRange('week'); lhSyncDraft(); LH.formErr=''; LH.cal.open=false;
 lhLoad();
 }
 function lhDraftInput(field,val){if(field==='from')LH.draftFrom=val;else LH.draftTo=val;}

 /* ---------- Lịch 2 tháng ---------- */
 function lhOpenCal(field){
 const f=lhParseDate(LH.draftFrom), t=lhParseDate(LH.draftTo), today=lhToday();
 const start=f&&f<=today?f:null, end=t&&t<=today&&(!start||t>=start)?t:null;
 const anchor=end||start||today;
 /* Tháng bên phải = tháng của mốc đang xem, nhưng không vượt quá tháng hiện tại. */
 let right=new Date(anchor.getFullYear(),anchor.getMonth(),1);
 const cur=new Date(today.getFullYear(),today.getMonth(),1);
 if(right>cur) right=cur;
 LH.ddOpen=false;
 LH.cal={open:true,field,start,end,view:new Date(right.getFullYear(),right.getMonth()-1,1),pickEnd:field==='to'&&!!start};
 lhRender();
 }
 function lhCalNav(step){
 const v=LH.cal.view, today=lhToday();
 const next=new Date(v.getFullYear(),v.getMonth()+step,1);
 if(new Date(next.getFullYear(),next.getMonth()+1,1)>new Date(today.getFullYear(),today.getMonth(),1)) return;
 LH.cal.view=next; lhRender();
 }
 function lhCalPick(iso){
 const [y,m,d]=iso.split('-').map(Number), day=new Date(y,m-1,d);
 if(day>lhToday()) return;
 const c=LH.cal;
 if(c.pickEnd&&c.start&&day>=c.start){c.end=day;c.pickEnd=false;}
 else if(!c.start||c.end||day<c.start){c.start=day;c.end=null;c.pickEnd=true;}
 else {c.end=day;c.pickEnd=false;}
 lhRender();
 }
 function lhCalApply(){
 const c=LH.cal; if(!c.start) return;
 const end=c.end||c.start;
 if(lhDaysInclusive(c.start,end)>LH_MAX_RANGE_DAYS) return;
 LH.draftFrom=lhFmtDate(c.start); LH.draftTo=lhFmtDate(end); LH.formErr=''; c.open=false;
 lhRender();
 }
 function lhCalCancel(){LH.cal.open=false;lhRender();}
 /* Click trong pop-up nhưng ngoài lịch và ngoài 2 ô ngày → đóng lịch (như bấm Hủy). */
 function lhModalClick(e){
 let changed=false;
 if(LH.ddOpen&&!e.target.closest('.lh-status')){LH.ddOpen=false;changed=true;}
 if(LH.cal.open&&!e.target.closest('.lh-cal')&&!e.target.closest('.lh-date')){LH.cal.open=false;changed=true;}
 if(changed) lhRender();
 }
 function lhMonthHtml(first){
 const today=lhToday(), c=LH.cal, end=c.end||null;
 const lead=(first.getDay()+6)%7, n=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
 let cells='';
 for(let i=0;i<lead;i++) cells+='<span></span>';
 for(let d=1;d<=n;d++){
 const day=new Date(first.getFullYear(),first.getMonth(),d);
 const fut=day>today, isS=lhSameDay(day,c.start), isE=lhSameDay(day,end);
 const inR=c.start&&end&&day>c.start&&day<end;
 const cls=['lh-day',fut?'off':'',inR?'in':'',isS?'start':'',isE?'end':'',(isS||isE)?'sel':'',lhSameDay(day,today)?'today':''].filter(Boolean).join(' ');
 cells+=`<button type="button" class="${cls}" ${fut?'disabled':''} onclick="lhCalPick('${lhIsoDay(day)}')">${d}</button>`;
 }
 return `<div class="lh-month"><div class="lh-month-title">Tháng ${first.getMonth()+1} / ${first.getFullYear()}</div>
 <div class="lh-dow"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
 <div class="lh-days">${cells}</div></div>`;
 }
 function lhCalHtml(){
 const c=LH.cal, v=c.view, right=new Date(v.getFullYear(),v.getMonth()+1,1), today=lhToday();
 const nextOff=new Date(right.getFullYear(),right.getMonth()+1,1)>new Date(today.getFullYear(),today.getMonth(),1);
 const end=c.end||c.start;
 const tooLong=c.start&&lhDaysInclusive(c.start,end)>LH_MAX_RANGE_DAYS;
 const hint=!c.start?'Chọn ngày bắt đầu':(tooLong?`Khoảng thời gian tối đa ${LH_MAX_RANGE_DAYS} ngày`:`${lhFmtDate(c.start)} → ${c.end?lhFmtDate(c.end):'chọn ngày kết thúc'}`);
 return `<div class="lh-cal" role="dialog" aria-label="Chọn khoảng ngày">
 <button type="button" class="lh-cal-nav prev" onclick="lhCalNav(-1)" aria-label="Tháng trước"><i class="ti ti-chevron-left"></i></button>
 <button type="button" class="lh-cal-nav next" onclick="lhCalNav(1)" ${nextOff?'disabled':''} aria-label="Tháng sau"><i class="ti ti-chevron-right"></i></button>
 <div class="lh-months">${lhMonthHtml(v)}${lhMonthHtml(right)}</div>
 <div class="lh-cal-foot"><span class="lh-cal-hint ${tooLong?'err':''}">${hint}</span>
 <button type="button" class="lh-btn" onclick="lhCalCancel()">Hủy</button>
 <button type="button" class="lh-btn lh-primary" onclick="lhCalApply()" ${(!c.start||tooLong)?'disabled':''}>Áp dụng</button></div>
 </div>`;
 }

 /* ---------- Vẽ pop-up ---------- */
 function lhRelDay(d){
 const t=lhToday(), day=new Date(d.getFullYear(),d.getMonth(),d.getDate());
 if(lhSameDay(day,t)) return 'hôm nay';
 if(lhSameDay(day,lhAddDays(t,-1))) return 'hôm qua';
 return lhFmtDate(d);
 }
 function lhIsCurrent(e){const s=window.__lhSession;return !!(e.ok&&e.sid&&s&&s.sid===e.sid&&s.user===lhUserKey(currentAccount));}
 function lhFiltered(){return LH.status==='all'?LH.rows:LH.rows.filter(e=>LH.status==='ok'?e.ok:!e.ok);}
 function lhPages(cur,total){
 const s=new Set([1,total,cur-1,cur,cur+1]);
 if(cur<=3){s.add(2);s.add(3);}
 if(cur>=total-2){s.add(total-1);s.add(total-2);}
 const list=[...s].filter(p=>p>=1&&p<=total).sort((a,b)=>a-b), out=[];
 list.forEach((p,i)=>{if(i&&p-list[i-1]>1) out.push('…'); out.push(p);});
 return out;
 }
 function lhRender(){
 if(!LH.open) return;
 const rows=LH.rows, okN=rows.filter(e=>e.ok).length, failN=rows.length-okN;
 const last=rows.find(e=>e.ok);
 const val=n=>LH.loading?'<span class="lh-skel"></span>':(LH.error?'–':fmt(n));
 const cards=`<div class="lh-cards">
 <div class="lh-card"><span class="lh-card-lbl">Lần đăng nhập</span><div class="lh-card-row"><b class="lh-card-val">${val(rows.length)}</b>${(!LH.loading&&last)?`<small class="lh-card-note">Gần nhất: ${pad(new Date(last.ts).getHours())}:${pad(new Date(last.ts).getMinutes())} ${lhRelDay(new Date(last.ts))}</small>`:''}</div></div>
 <div class="lh-card ok"><span class="lh-card-lbl">Thành công</span><b class="lh-card-val">${val(okN)}</b></div>
 <div class="lh-card fail"><span class="lh-card-lbl">Thất bại</span><b class="lh-card-val">${val(failN)}</b></div>
 </div>`;
 const seg=[['week','Tuần'],['month','Tháng'],['quarter','Quý'],['custom','Tùy chọn']].map(([k,l])=>`<button type="button" class="${LH.preset===k?'active':''}" aria-pressed="${LH.preset===k}" onclick="lhSetPreset('${k}')">${l}</button>`).join('');
 const toolbar=`<div class="lh-toolbar">
 <div class="lh-seg" role="group" aria-label="Khoảng thời gian">${seg}</div>
 ${lhStatusHtml()}
 <button type="button" class="lh-btn lh-export" onclick="lhExportExcel()" ${(LH.loading||LH.error||!lhFiltered().length)?'disabled':''}><i class="ti ti-download"></i> Xuất Excel</button>
 </div>`;
 const dateBox=(field,label,v)=>`<label class="lh-date ${LH.cal.open&&LH.cal.field===field?'focus':''}"><span>${label}</span><input type="text" inputmode="numeric" placeholder="dd/mm/yyyy" value="${esc(v)}" oninput="lhDraftInput('${field}',this.value)" onclick="lhOpenCal('${field}')" onkeydown="if(event.key==='Enter'){event.preventDefault();lhApplyCustom();}"/><i class="ti ti-calendar" onclick="lhOpenCal('${field}')"></i></label>`;
 const custom=LH.preset!=='custom'?'':`<div class="lh-range">
 ${dateBox('from','Từ ngày',LH.draftFrom)}<i class="ti ti-arrow-right lh-arrow"></i>${dateBox('to','Đến ngày',LH.draftTo)}
 <button type="button" class="lh-btn lh-primary" onclick="lhApplyCustom()">Áp dụng</button>
 <button type="button" class="lh-btn" onclick="lhResetCustom()">Đặt lại</button>
 <span class="lh-range-max">Tối đa ${LH_MAX_RANGE_DAYS} ngày</span>
 ${LH.cal.open?lhCalHtml():''}
 </div>${LH.formErr?`<div class="lh-form-err" role="alert">${esc(LH.formErr)}</div>`:''}`;
 const list=lhFiltered(), pages=Math.max(1,Math.ceil(list.length/LH_PAGE_SIZE));
 if(LH.page>pages) LH.page=pages;
 const pageRows=list.slice((LH.page-1)*LH_PAGE_SIZE,LH.page*LH_PAGE_SIZE);
 let tbody;
 if(LH.loading) tbody=Array.from({length:6},()=>`<tr class="lh-skel-row"><td><span class="lh-skel w1"></span></td><td><span class="lh-skel w2"></span></td><td><span class="lh-skel w3"></span></td><td><span class="lh-skel w3"></span></td></tr>`).join('');
 else if(LH.error) tbody=`<tr><td colspan="4"><div class="lh-state err"><i class="ti ti-alert-triangle"></i><span>${esc(LH.error)}</span><button type="button" class="lh-btn" onclick="lhLoad()">Thử lại</button></div></td></tr>`;
 else if(!pageRows.length) tbody=`<tr><td colspan="4"><div class="lh-state"><i class="ti ti-calendar-off"></i><span>Không có dữ liệu trong khoảng thời gian đã chọn</span></div></td></tr>`;
 else tbody=pageRows.map(e=>{
 const d=new Date(e.ts), cur=lhIsCurrent(e);
 const note=e.ok?(cur?'<span class="lh-tag cur">Phiên hiện tại</span>':'<span class="lh-dash">–</span>'):`<span class="lh-tag fail">${esc(LOGIN_FAIL_REASONS[e.reason]||'')}</span>`;
 return `<tr class="${e.ok?'':'is-fail'}"><td class="lh-time">${lhFmtDate(d)} <b>${lhFmtTime(d)}</b></td><td class="lh-ip">${esc(e.ip)}</td>
 <td><span class="lh-chip ${e.ok?'ok':'fail'}">${e.ok?'Thành công':'Thất bại'}</span></td><td>${note}</td></tr>`;
 }).join('');
 const table=`<div class="lh-table-wrap" aria-busy="${LH.loading}"><table class="lh-table"><thead><tr><th>Thời gian</th><th>Địa chỉ IP</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
 document.getElementById('lhBody').innerHTML=cards+toolbar+custom+table;
 const showFoot=!LH.loading&&!LH.error&&list.length>0;
 const a=(LH.page-1)*LH_PAGE_SIZE+1, b=Math.min(LH.page*LH_PAGE_SIZE,list.length);
 document.getElementById('lhFoot').innerHTML=showFoot?`<span class="lh-foot-info">Hiển thị ${a}–${b} / ${fmt(list.length)}</span>
 <nav class="lh-pager" aria-label="Phân trang">
 <button type="button" ${LH.page<=1?'disabled':''} onclick="lhGoPage(${LH.page-1})" aria-label="Trang trước"><i class="ti ti-chevron-left"></i></button>
 ${lhPages(LH.page,pages).map(p=>p==='…'?'<span class="lh-ell">…</span>':`<button type="button" class="${p===LH.page?'active':''}" onclick="lhGoPage(${p})">${p}</button>`).join('')}
 <button type="button" ${LH.page>=pages?'disabled':''} onclick="lhGoPage(${LH.page+1})" aria-label="Trang sau"><i class="ti ti-chevron-right"></i></button>
 </nav>`:'';
 }
 async function lhExportExcel(){
 const list=lhFiltered(); if(!list.length) return;
 if(typeof ExcelJS==='undefined'){toast('Chưa tải được thư viện xuất Excel.');return;}
 const wb=new ExcelJS.Workbook(), ws=wb.addWorksheet('Nhật ký đăng nhập');
 const who=[currentAccount.title,currentAccount.subtitle].filter(Boolean).join(' · ');
 ws.addRow([`Nhật ký đăng nhập — ${who}`]).font={bold:true,size:13};
 ws.addRow([`Từ ngày ${lhFmtDate(LH.range.from)} đến ngày ${lhFmtDate(LH.range.to)}${LH.status==='all'?'':` · Trạng thái: ${LH.status==='ok'?'Thành công':'Thất bại'}`}`]);
 ws.addRow(['SỐ LIỆU MÔ PHỎNG (BẢN DEMO) — KHÔNG PHẢI SỐ LIỆU THẬT']).font={italic:true,color:{argb:'FFC00000'}};
 ws.addRow([]);
 ws.addRow(['STT','Thời gian','Địa chỉ IP','Trạng thái','Ghi chú']).font={bold:true};
 list.forEach((e,i)=>{const d=new Date(e.ts);ws.addRow([i+1,`${lhFmtDate(d)} ${lhFmtTime(d)}`,e.ip,e.ok?'Thành công':'Thất bại',e.ok?(lhIsCurrent(e)?'Phiên hiện tại':''):(LOGIN_FAIL_REASONS[e.reason]||'')]);});
 ws.columns=[{width:6},{width:22},{width:18},{width:14},{width:22}];
 const buf=await wb.xlsx.writeBuffer();
 const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download=`nhat-ky-dang-nhap-${lhUserKey(currentAccount).replace(/[^a-z0-9-]+/g,'-')}-${lhIsoDay(LH.range.from)}-${lhIsoDay(LH.range.to)}.xlsx`;
 document.body.appendChild(a); a.click(); a.remove();
 setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }
