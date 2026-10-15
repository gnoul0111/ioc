/* ============================== NHẬT KÝ ĐĂNG NHẬP — màn quản trị (sidebar "Nhật ký đăng nhập") ==============================
 Theo tài liệu yêu cầu + 2 ảnh mẫu (13/10/2026). KHÁC pop-up "Xem nhật ký đăng nhập" ở menu tài khoản của dashboard
 (js/core/login-history.js — mỗi người chỉ xem lượt của chính mình): màn này gom lượt đăng nhập của MỌI tài khoản,
 chỉ Admin hệ thống được vào (các role khác ẩn menu), chỉ xem — không có thao tác sửa/xóa log.
 Dữ liệu lấy từ nguồn dùng chung js/core/login-log-data.js (window.LOGIN_LOG) — cùng nguồn với bản mobile
 (mobile-admin/) nên 2 bên ra cùng một con số; cách sinh số giả lập ghi ở đầu tệp đó.
 Đây là số mô phỏng. window.__ollSimulateError=true để thử trạng thái lỗi. */
const OLL_VIEWER=LOGIN_LOG.VIEWER;
const OLL_MAX_RANGE_DAYS=365;
const OLL_PAGE_SIZE=10;
const OLL_DAY_MS=86400000;
const OLL_AXIS_OPTS=[['','Tất cả'],['DANG','Đảng ủy'],['HDND','HĐND'],['UBND','UBND'],['MTTQ','MTTQ']];
const OLL_STATUS_OPTS=[['all','Tất cả'],['ok','Thành công'],['fail','Thất bại']];
const OLL_IC={
 search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 cal:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
 down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
 left:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg>',
 right:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>',
 arrow:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m5 12 5 5 9-10"/></svg>',
 filter:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 5h16l-6 8v5l-4 2v-7z"/></svg>'
};

const OLL={inited:false,preset:'week',range:null,draftFrom:'',draftTo:'',formErr:'',status:'all',axis:'',org:null,orgSub:true,orgQ:'',q:'',
 page:1,loading:false,error:null,rows:[],token:0,dd:null,fkey:'',flist:[],exporting:false,exportPct:0,
 cal:{open:false,field:'from',start:null,end:null,view:null,pickEnd:false}};

/* ---------- Tiện ích ---------- */
function ollPad(n){return String(n).padStart(2,'0');}
function ollEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ollNum(n){return Number(n||0).toLocaleString('vi-VN');}
function ollNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');}
function ollReason(k){return LOGIN_LOG.reason(k);}
function ollToast(msg){if(typeof ouaToast==='function') ouaToast(msg);}

/* ---------- Ngày giờ ---------- */
function ollToday(){const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate());}
function ollAddDays(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
function ollSameDay(a,b){return !!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function ollIso(d){return `${d.getFullYear()}-${ollPad(d.getMonth()+1)}-${ollPad(d.getDate())}`;}
function ollFmtDate(d){return `${ollPad(d.getDate())}/${ollPad(d.getMonth()+1)}/${d.getFullYear()}`;}
function ollFmtTime(d){return `${ollPad(d.getHours())}:${ollPad(d.getMinutes())}:${ollPad(d.getSeconds())}`;}
function ollParseDate(s){
 const m=String(s||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if(!m) return null;
 const d=new Date(+m[3],+m[2]-1,+m[1]);
 return (d.getDate()===+m[1]&&d.getMonth()===+m[2]-1)?d:null;
}
function ollDaysIncl(a,b){return Math.round((b-a)/OLL_DAY_MS)+1;}
/* Tuần/Tháng/Quý = kỳ hiện tại chứa hôm nay, tính tới hết hôm nay (tuần bắt đầu Thứ Hai). */
function ollPresetRange(p){
 const t=ollToday();
 if(p==='month') return {from:new Date(t.getFullYear(),t.getMonth(),1),to:t};
 if(p==='quarter') return {from:new Date(t.getFullYear(),Math.floor(t.getMonth()/3)*3,1),to:t};
 return {from:ollAddDays(t,-((t.getDay()+6)%7)),to:t};
}

/* ---------- Quyền xem ---------- */
/* Màn quản trị hiện chỉ có 1 tài khoản đăng nhập là Admin toàn cục (ioc_mbfs). Khi nối phân quyền thật, đổi
   OLL_VIEWER.role theo người đang đăng nhập — role khác 'global_admin' sẽ ẩn menu và chặn vào trang. */
function ollCanView(){return LOGIN_LOG.canView();}
function ollApplyMenuPermission(){
 const nav=document.querySelector('#ouaScreen .nav[data-page="login-log"]');
 if(nav) nav.style.display=ollCanView()?'':'none';
}

/* ---------- Người dùng & đơn vị ---------- */
let ollOrgCache=null;
function ollUserOf(e){return LOGIN_LOG.userOf(e);}
/* Danh sách đơn vị cho "Bộ lọc nâng cao" — chỉ đơn vị có người dùng (tính cả đơn vị trực thuộc), theo thứ tự cây. */
function ollOrgs(){
 if(ollOrgCache) return ollOrgCache;
 const cnt=new Map();
 LOGIN_LOG.users.forEach(u=>{if(u.orgPath) u.orgPath.split('.').forEach(id=>cnt.set(id,(cnt.get(id)||0)+1));});
 if(typeof ouaRealOrgRows!=='undefined'&&!ouaRealOrgRows&&typeof ouaBuildRealData==='function') ouaBuildRealData();
 const src=(typeof ouaRealOrgRows!=='undefined'&&ouaRealOrgRows)||[];
 ollOrgCache=src.filter(o=>cnt.get(String(o.id))).map(o=>({id:String(o.id),name:o.name,path:String(o.path||o.id),parentName:o.parentName||'',axis:o.axis||null,users:cnt.get(String(o.id)),_s:ollNorm(o.name)}));
 return ollOrgCache;
}

/* ---------- Phiên quản trị thật ---------- */
/* Gọi khi vào màn quản trị (ouaOpen ở demo_ioc.html / lúc tải oua-admin.html) — mỗi lần vào là 1 phiên mới. */
function ollRecordAdminSession(){LOGIN_LOG.recordAdminSession(false);}
function ollIsCurrent(e){return LOGIN_LOG.isCurrent(e);}

/* ---------- Truy vấn (mô phỏng 1 lần gọi API, có độ trễ) ---------- */
function ollQuery(range){return LOGIN_LOG.query(range.from,range.to);}
function ollFetch(range){
 return new Promise((resolve,reject)=>{
  setTimeout(()=>{
   try{
    if(window.__ollSimulateError) throw new Error('simulated');
    resolve(ollQuery(range));
   }catch(e){reject(e);}
  },300+Math.floor(Math.random()*250));
 });
}
function ollFiltered(){
 const key=`${OLL.token}|${OLL.loading}|${OLL.status}|${OLL.axis}|${OLL.org?OLL.org.id:''}|${OLL.orgSub}|${OLL.q}`;
 if(key===OLL.fkey) return OLL.flist;
 const q=ollNorm(OLL.q).trim(), org=OLL.org;
 OLL.flist=OLL.rows.filter(e=>{
  if(OLL.status==='ok'&&!e.ok) return false;
  if(OLL.status==='fail'&&e.ok) return false;
  const u=ollUserOf(e);
  if(OLL.axis&&u.axis!==OLL.axis) return false;
  if(org){
   if(OLL.orgSub){if(!(u.orgPath===org.path||u.orgPath.startsWith(org.path+'.'))) return false;}
   else if(String(u.orgId)!==org.id) return false;
  }
  if(q&&!u._s.includes(q)&&!e.ip.includes(q)) return false;
  return true;
 });
 OLL.fkey=key;
 return OLL.flist;
}

/* ---------- Mở trang / tải dữ liệu ---------- */
function ollOpen(){
 const root=document.getElementById('ollRoot'); if(!root) return;
 if(!ollCanView()){
  OLL.inited=false;
  root.innerHTML='<div class="empty">Chỉ tài khoản Admin hệ thống được xem nhật ký đăng nhập.</div>';
  return;
 }
 if(!OLL.inited){
  root.innerHTML=ollShellHtml();
  OLL.inited=true;
  Object.assign(OLL,{preset:'week',range:ollPresetRange('week'),status:'all',axis:'',org:null,orgSub:true,q:'',formErr:'',dd:null});
  ollSyncDraft();
 }else if(OLL.preset!=='custom'){
  OLL.range=ollPresetRange(OLL.preset); // sang ngày mới thì kỳ hiện tại cũng đổi
 }
 OLL.cal.open=false; OLL.dd=null;
 ollLoad();
}
function ollSyncDraft(){OLL.draftFrom=ollFmtDate(OLL.range.from);OLL.draftTo=ollFmtDate(OLL.range.to);}
function ollLoad(){
 const tk=++OLL.token;
 OLL.loading=true; OLL.error=null; OLL.page=1;
 ollRender();
 ollFetch(OLL.range).then(rows=>{
  if(tk!==OLL.token) return;
  OLL.rows=rows; OLL.loading=false; ollRender();
 }).catch(()=>{
  if(tk!==OLL.token) return;
  OLL.rows=[]; OLL.loading=false; OLL.error='Không tải được nhật ký đăng nhập. Vui lòng thử lại.'; ollRender();
 });
}
function ollRefresh(){OLL.dd=null;OLL.cal.open=false;ollLoad();}

/* ---------- Bộ lọc ---------- */
function ollSetPreset(p){
 if(p===OLL.preset&&p!=='custom') return;
 OLL.dd=null; OLL.formErr=''; OLL.cal.open=false;
 if(p==='custom'){OLL.preset='custom';ollSyncDraft();ollRender();return;} // Tùy chọn: chỉ hiện dòng chọn ngày, bấm Áp dụng mới tải
 OLL.preset=p; OLL.range=ollPresetRange(p); ollSyncDraft();
 ollLoad();
}
let ollSearchTimer=null;
function ollOnSearch(v){
 clearTimeout(ollSearchTimer);
 ollSearchTimer=setTimeout(()=>{OLL.q=v;OLL.page=1;ollRender();},180);
}
function ollToggleDd(name){
 OLL.dd=OLL.dd===name?null:name; OLL.cal.open=false;
 ollRender();
 if(OLL.dd==='org') setTimeout(()=>document.getElementById('ollOrgQ')?.focus(),20);
 else if(OLL.dd) document.querySelector(`#ouaScreen .oll-dd-wrap.open .oll-opt.active`)?.focus();
}
function ollSetStatus(v){OLL.status=v;OLL.page=1;OLL.dd=null;ollRender();}
function ollSetAxis(v){
 OLL.axis=v; OLL.page=1; OLL.dd=null;
 if(v&&OLL.org&&OLL.org.axis&&OLL.org.axis!==v) OLL.org=null; // đơn vị đã chọn không thuộc trục mới → bỏ
 ollRender();
}
function ollOrgListHtml(){
 const q=ollNorm(OLL.orgQ).trim();
 const all=ollOrgs().filter(o=>(!OLL.axis||o.axis===OLL.axis)&&(!q||o._s.includes(q)));
 if(!all.length) return '<div class="oll-org-empty">Không tìm thấy đơn vị phù hợp.</div>';
 const shown=all.slice(0,60);
 return shown.map(o=>`<button type="button" class="oll-org-item ${OLL.org&&OLL.org.id===o.id?'active':''}" onclick="ollPickOrg('${o.id}')"><b>${ollEsc(o.name)}</b><small>${o.parentName?ollEsc(o.parentName)+' · ':''}${ollNum(o.users)} người dùng</small></button>`).join('')
  +(all.length>shown.length?`<div class="oll-org-more">Còn ${ollNum(all.length-shown.length)} đơn vị khác — nhập thêm từ khóa để thu hẹp.</div>`:'');
}
function ollOnOrgSearch(v){OLL.orgQ=v;const el=document.getElementById('ollOrgList');if(el) el.innerHTML=ollOrgListHtml();}
function ollPickOrg(id){
 const o=ollOrgs().find(x=>x.id===String(id)); if(!o) return;
 OLL.org=o; OLL.page=1; OLL.dd=null; ollRender();
}
function ollClearOrg(){OLL.org=null;OLL.page=1;OLL.dd=null;ollRender();}
function ollSetOrgSub(v){OLL.orgSub=!!v;OLL.page=1;ollRenderActive();ollRenderData();}
function ollGoPage(p){OLL.page=p;ollRenderData();document.getElementById('ollTableWrap')?.scrollIntoView({block:'nearest'});}

/* ---------- Tùy chọn khoảng ngày ---------- */
function ollValidate(fromS,toS){
 if(!String(fromS).trim()||!String(toS).trim()) return {err:'Vui lòng nhập đủ Từ ngày và Đến ngày.'};
 const f=ollParseDate(fromS), t=ollParseDate(toS);
 if(!f||!t) return {err:'Ngày không hợp lệ, nhập theo dạng dd/mm/yyyy.'};
 const today=ollToday();
 if(f>today||t>today) return {err:'Không chọn ngày trong tương lai.'};
 if(f>t) return {err:'Từ ngày không được lớn hơn Đến ngày.'};
 if(ollDaysIncl(f,t)>OLL_MAX_RANGE_DAYS) return {err:`Khoảng thời gian tối đa ${OLL_MAX_RANGE_DAYS} ngày.`};
 return {from:f,to:t};
}
function ollApplyCustom(){
 const v=ollValidate(OLL.draftFrom,OLL.draftTo);
 OLL.cal.open=false;
 if(v.err){OLL.formErr=v.err;ollRender();return;}
 OLL.formErr=''; OLL.range={from:v.from,to:v.to};
 ollLoad();
}
/* Đặt lại = về mặc định Tuần (ẩn dòng chọn ngày). */
function ollResetCustom(){
 OLL.preset='week'; OLL.range=ollPresetRange('week'); ollSyncDraft(); OLL.formErr=''; OLL.cal.open=false;
 ollLoad();
}
function ollDraftInput(field,val){if(field==='from')OLL.draftFrom=val;else OLL.draftTo=val;}

/* ---------- Lịch 2 tháng ---------- */
function ollOpenCal(field){
 const f=ollParseDate(OLL.draftFrom), t=ollParseDate(OLL.draftTo), today=ollToday();
 const start=f&&f<=today?f:null, end=t&&t<=today&&(!start||t>=start)?t:null;
 const anchor=end||start||today;
 /* Tháng bên phải = tháng của mốc đang xem, nhưng không vượt quá tháng hiện tại. */
 let right=new Date(anchor.getFullYear(),anchor.getMonth(),1);
 const cur=new Date(today.getFullYear(),today.getMonth(),1);
 if(right>cur) right=cur;
 OLL.dd=null;
 OLL.cal={open:true,field,start,end,view:new Date(right.getFullYear(),right.getMonth()-1,1),pickEnd:field==='to'&&!!start};
 ollRender();
}
function ollCalNav(step){
 const v=OLL.cal.view, today=ollToday();
 const next=new Date(v.getFullYear(),v.getMonth()+step,1);
 if(new Date(next.getFullYear(),next.getMonth()+1,1)>new Date(today.getFullYear(),today.getMonth(),1)) return;
 OLL.cal.view=next; ollRender();
}
function ollCalPick(iso){
 const [y,m,d]=iso.split('-').map(Number), day=new Date(y,m-1,d);
 if(day>ollToday()) return;
 const c=OLL.cal;
 if(c.pickEnd&&c.start&&day>=c.start){c.end=day;c.pickEnd=false;}
 else if(!c.start||c.end||day<c.start){c.start=day;c.end=null;c.pickEnd=true;}
 else {c.end=day;c.pickEnd=false;}
 ollRender();
}
function ollCalApply(){
 const c=OLL.cal; if(!c.start) return;
 const end=c.end||c.start;
 if(ollDaysIncl(c.start,end)>OLL_MAX_RANGE_DAYS) return;
 OLL.draftFrom=ollFmtDate(c.start); OLL.draftTo=ollFmtDate(end); OLL.formErr=''; c.open=false;
 ollRender();
}
function ollCalCancel(){OLL.cal.open=false;ollRender();}
function ollMonthHtml(first){
 const today=ollToday(), c=OLL.cal, end=c.end||null;
 const lead=(first.getDay()+6)%7, n=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
 let cells='';
 for(let i=0;i<lead;i++) cells+='<span></span>';
 for(let d=1;d<=n;d++){
  const day=new Date(first.getFullYear(),first.getMonth(),d);
  const fut=day>today, isS=ollSameDay(day,c.start), isE=ollSameDay(day,end);
  const inR=c.start&&end&&day>c.start&&day<end, band=c.start&&end&&!ollSameDay(c.start,end);
  const cls=['oll-day',fut?'off':'',inR?'in':'',isS&&band?'start':'',isE&&band?'end':'',(isS||isE)?'sel':'',ollSameDay(day,today)?'today':''].filter(Boolean).join(' ');
  cells+=`<button type="button" class="${cls}" ${fut?'disabled':''} onclick="ollCalPick('${ollIso(day)}')"><span>${d}</span></button>`;
 }
 return `<div class="oll-month"><div class="oll-month-title">Tháng ${first.getMonth()+1} / ${first.getFullYear()}</div>
 <div class="oll-dow"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
 <div class="oll-days">${cells}</div></div>`;
}
function ollCalHtml(){
 const c=OLL.cal, v=c.view, right=new Date(v.getFullYear(),v.getMonth()+1,1), today=ollToday();
 const nextOff=new Date(right.getFullYear(),right.getMonth()+1,1)>new Date(today.getFullYear(),today.getMonth(),1);
 const end=c.end||c.start;
 const tooLong=c.start&&ollDaysIncl(c.start,end)>OLL_MAX_RANGE_DAYS;
 const hint=!c.start?'Chọn ngày bắt đầu':(tooLong?`Khoảng thời gian tối đa ${OLL_MAX_RANGE_DAYS} ngày`:`${ollFmtDate(c.start)} → ${c.end?ollFmtDate(c.end):'chọn ngày kết thúc'}`);
 return `<div class="oll-cal ${c.field}" role="dialog" aria-label="Chọn khoảng ngày">
 <button type="button" class="oll-cal-nav prev" onclick="ollCalNav(-1)" aria-label="Tháng trước">${OLL_IC.left}</button>
 <button type="button" class="oll-cal-nav next" onclick="ollCalNav(1)" ${nextOff?'disabled':''} aria-label="Tháng sau">${OLL_IC.right}</button>
 <div class="oll-months">${ollMonthHtml(v)}${ollMonthHtml(right)}</div>
 <div class="oll-cal-foot"><span class="oll-cal-hint ${tooLong?'err':''}">${hint}</span>
 <button type="button" class="btn ghost small" onclick="ollCalCancel()">Hủy</button>
 <button type="button" class="btn primary small" onclick="ollCalApply()" ${(!c.start||tooLong)?'disabled':''}>Áp dụng</button></div>
 </div>`;
}

/* ---------- Vẽ ---------- */
function ollShellHtml(){
 return `<div class="head"><div><h2>Nhật ký đăng nhập</h2><p>Toàn bộ lượt đăng nhập vào hệ thống IOC của mọi tài khoản: thành công, thất bại, bị khóa. Chỉ Admin hệ thống được xem và xuất dữ liệu; nhật ký chỉ để xem, không sửa hoặc xóa.</p></div>
 <div class="actions oll-head-actions"><button type="button" class="btn" onclick="ollRefresh()">Làm mới</button><button type="button" class="btn primary" id="ollExportBtn" onclick="ollExport()">Xuất Excel</button></div></div>
 <div class="oll-toolbar">
  <label class="oll-search">${OLL_IC.search}<input id="ollSearch" placeholder="Tìm theo họ tên, tên đăng nhập, IP..." oninput="ollOnSearch(this.value)" autocomplete="off"></label>
  <div class="oll-seg" id="ollSeg" role="group" aria-label="Khoảng thời gian"></div>
  <div class="oll-dd-wrap" id="ollStatusBox"></div>
  <div class="oll-dd-wrap" id="ollAxisBox"></div>
  <div class="oll-dd-wrap oll-adv-wrap" id="ollAdvBox"></div>
 </div>
 <div id="ollRangeRow"></div>
 <div id="ollActive"></div>
 <div class="oll-table-wrap" id="ollTableWrap"><table class="oll-table"><colgroup><col style="width:15%"><col style="width:20%"><col style="width:8%"><col style="width:22%"><col style="width:11%"><col style="width:11%"><col style="width:13%"></colgroup>
 <thead><tr><th>Thời gian</th><th>Người dùng</th><th>Trục</th><th>Đơn vị công tác</th><th>Địa chỉ IP</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody id="ollTbody"></tbody></table></div>
 <div class="oll-foot" id="ollFoot"></div>`;
}
function ollDdHtml(name,label,opts,cur,onPick){
 const sel=opts.find(o=>o[0]===cur)||opts[0], open=OLL.dd===name;
 return `<button type="button" class="oll-dd-btn" aria-haspopup="listbox" aria-expanded="${open}" onclick="ollToggleDd('${name}')"><span>${label}</span><b>${sel[1]}</b>${OLL_IC.down}</button>
 ${open?`<div class="oll-dd-panel" role="listbox">${opts.map(([k,l])=>`<button type="button" role="option" aria-selected="${cur===k}" class="oll-opt ${cur===k?'active':''}" onclick="${onPick}('${k}')">${name==='status'?`<i class="oll-dot ${k}"></i>`:''}<span>${l}</span>${cur===k?OLL_IC.check:''}</button>`).join('')}</div>`:''}`;
}
function ollRender(){
 if(!OLL.inited||!document.getElementById('ollRoot')) return;
 document.getElementById('ollSeg').innerHTML=[['week','Tuần'],['month','Tháng'],['quarter','Quý'],['custom','Tùy chọn']]
  .map(([k,l])=>`<button type="button" class="${OLL.preset===k?'active':''}" aria-pressed="${OLL.preset===k}" onclick="ollSetPreset('${k}')">${l}</button>`).join('');
 const st=document.getElementById('ollStatusBox');
 st.classList.toggle('open',OLL.dd==='status'); st.innerHTML=ollDdHtml('status','Trạng thái',OLL_STATUS_OPTS,OLL.status,'ollSetStatus');
 const ax=document.getElementById('ollAxisBox');
 ax.classList.toggle('open',OLL.dd==='axis'); ax.innerHTML=ollDdHtml('axis','Trục',OLL_AXIS_OPTS,OLL.axis,'ollSetAxis');
 const adv=document.getElementById('ollAdvBox');
 adv.classList.toggle('open',OLL.dd==='org');
 adv.innerHTML=`<button type="button" class="oll-adv-btn ${OLL.org?'on':''}" aria-expanded="${OLL.dd==='org'}" onclick="ollToggleDd('org')">${OLL_IC.filter}<span>Bộ lọc nâng cao</span>${OLL.org?'<i class="oll-adv-badge">1</i>':''}</button>
 ${OLL.dd==='org'?`<div class="oll-dd-panel oll-org-panel"><div class="oll-org-title">Lọc theo đơn vị công tác${OLL.axis?` · trục ${ollEsc((OLL_AXIS_OPTS.find(o=>o[0]===OLL.axis)||[])[1])}`:''}</div>
  <label class="oll-search sm">${OLL_IC.search}<input id="ollOrgQ" placeholder="Tìm tên đơn vị..." value="${ollEsc(OLL.orgQ)}" oninput="ollOnOrgSearch(this.value)" autocomplete="off"></label>
  <div class="oll-org-list" id="ollOrgList">${ollOrgListHtml()}</div>
  <div class="oll-org-foot"><label class="oll-check"><input type="checkbox" ${OLL.orgSub?'checked':''} onchange="ollSetOrgSub(this.checked)"> Gồm cả đơn vị trực thuộc</label>${OLL.org?'<button type="button" class="btn ghost small" onclick="ollClearOrg()">Bỏ chọn đơn vị</button>':''}</div></div>`:''}`;
 const dateBox=(field,label,v)=>`<label class="oll-date ${OLL.cal.open&&OLL.cal.field===field?'focus':''}"><span>${label}</span><input type="text" inputmode="numeric" placeholder="dd/mm/yyyy" value="${ollEsc(v)}" oninput="ollDraftInput('${field}',this.value)" onclick="ollOpenCal('${field}')" onkeydown="if(event.key==='Enter'){event.preventDefault();ollApplyCustom();}"/><i class="oll-cal-ic" onclick="ollOpenCal('${field}')">${OLL_IC.cal}</i></label>`;
 document.getElementById('ollRangeRow').innerHTML=OLL.preset!=='custom'?'':`<div class="oll-range">
  ${dateBox('from','Từ ngày',OLL.draftFrom)}<i class="oll-arrow">${OLL_IC.arrow}</i>${dateBox('to','Đến ngày',OLL.draftTo)}
  <button type="button" class="btn primary" onclick="ollApplyCustom()">Áp dụng</button>
  <button type="button" class="btn" onclick="ollResetCustom()">Đặt lại</button>
  <span class="oll-range-max">Tối đa ${OLL_MAX_RANGE_DAYS} ngày</span>
  ${OLL.cal.open?ollCalHtml():''}
 </div>${OLL.formErr?`<div class="oll-form-err" role="alert">${ollEsc(OLL.formErr)}</div>`:''}`;
 ollRenderActive();
 ollRenderData();
}
function ollRenderActive(){
 const el=document.getElementById('ollActive'); if(!el) return;
 el.innerHTML=OLL.org?`<div class="oll-active"><span class="oll-fchip">Đơn vị: <b>${ollEsc(OLL.org.name)}</b>${OLL.orgSub?' (gồm đơn vị trực thuộc)':''}<button type="button" onclick="ollClearOrg()" aria-label="Bỏ lọc đơn vị">×</button></span></div>`:'';
}
function ollPages(cur,total){
 const s=new Set([1,total,cur-1,cur,cur+1]);
 if(cur<=3){s.add(2);s.add(3);}
 if(cur>=total-2){s.add(total-1);s.add(total-2);}
 const list=[...s].filter(p=>p>=1&&p<=total).sort((a,b)=>a-b), out=[];
 list.forEach((p,i)=>{if(i&&p-list[i-1]>1) out.push('…'); out.push(p);});
 return out;
}
const OLL_AXIS_NAME={DANG:'Đảng ủy',HDND:'HĐND',UBND:'UBND',MTTQ:'MTTQ',SYS:'Hệ thống'};
function ollRowHtml(e){
 const u=ollUserOf(e), d=new Date(e.ts), cur=ollIsCurrent(e);
 const color=e.u<0?'#3b6fd6':(typeof ouaAvatarColor==='function'?ouaAvatarColor(u.id):'#5c6bc0');
 const initial=(u.name||'?').trim().charAt(0).toUpperCase()||'?';
 const note=e.ok?(cur?'<span class="oll-tag cur">Phiên hiện tại</span>':'<span class="oll-dash">–</span>'):`<span class="oll-tag fail">${ollEsc(ollReason(e.reason))}</span>`;
 return `<tr class="${e.ok?'':'is-fail'}">
 <td class="oll-time">${ollFmtDate(d)} <b>${ollFmtTime(d)}</b></td>
 <td><div class="oll-user"><span class="oll-av" style="background:${color}">${ollEsc(initial)}</span><div><b>${ollEsc(u.name)}</b><small>@${ollEsc(u.username)}</small></div></div></td>
 <td>${u.axis?`<span class="oll-axis ${u.axis}">${OLL_AXIS_NAME[u.axis]||u.axis}</span>`:'<span class="oll-dash">–</span>'}</td>
 <td><span class="oll-org" title="${ollEsc(u.orgName)}">${ollEsc(u.orgName)}</span></td>
 <td class="oll-ip">${ollEsc(e.ip)}</td>
 <td><span class="oll-chip ${e.ok?'ok':'fail'}"><i></i>${e.ok?'Thành công':'Thất bại'}</span></td>
 <td>${note}</td></tr>`;
}
function ollRenderData(){
 if(!OLL.inited) return;
 const tbody=document.getElementById('ollTbody'), foot=document.getElementById('ollFoot');
 if(!tbody||!foot) return;
 const list=OLL.loading?[]:ollFiltered(), pages=Math.max(1,Math.ceil(list.length/OLL_PAGE_SIZE));
 if(OLL.page>pages) OLL.page=pages;
 document.getElementById('ollTableWrap').setAttribute('aria-busy',String(OLL.loading));
 if(OLL.loading) tbody.innerHTML=Array.from({length:8},()=>`<tr class="oll-skel-row"><td><span class="oll-skel w1"></span></td><td><span class="oll-skel w2"></span></td><td><span class="oll-skel w3"></span></td><td><span class="oll-skel w2"></span></td><td><span class="oll-skel w1"></span></td><td><span class="oll-skel w3"></span></td><td><span class="oll-skel w3"></span></td></tr>`).join('');
 else if(OLL.error) tbody.innerHTML=`<tr><td colspan="7"><div class="oll-state err"><b>!</b><span>${ollEsc(OLL.error)}</span><button type="button" class="btn small" onclick="ollLoad()">Thử lại</button></div></td></tr>`;
 else if(!list.length) tbody.innerHTML=`<tr><td colspan="7"><div class="oll-state">${OLL_IC.cal}<span>Không có dữ liệu trong khoảng thời gian đã chọn</span></div></td></tr>`;
 else tbody.innerHTML=list.slice((OLL.page-1)*OLL_PAGE_SIZE,OLL.page*OLL_PAGE_SIZE).map(ollRowHtml).join('');
 const showFoot=!OLL.loading&&!OLL.error&&list.length>0;
 const a=(OLL.page-1)*OLL_PAGE_SIZE+1, b=Math.min(OLL.page*OLL_PAGE_SIZE,list.length);
 foot.innerHTML=showFoot?`<span>Hiển thị ${ollNum(a)}–${ollNum(b)} / ${ollNum(list.length)} lượt đăng nhập</span>
 <nav class="oll-pager" aria-label="Phân trang">
 <button type="button" ${OLL.page<=1?'disabled':''} onclick="ollGoPage(${OLL.page-1})" aria-label="Trang trước">${OLL_IC.left}</button>
 ${ollPages(OLL.page,pages).map(p=>p==='…'?'<span class="oll-ell">…</span>':`<button type="button" class="${p===OLL.page?'active':''}" onclick="ollGoPage(${p})">${ollNum(p)}</button>`).join('')}
 <button type="button" ${OLL.page>=pages?'disabled':''} onclick="ollGoPage(${OLL.page+1})" aria-label="Trang sau">${OLL_IC.right}</button>
 </nav>`:'';
 ollUpdateExportBtn();
}
function ollUpdateExportBtn(){
 const btn=document.getElementById('ollExportBtn'); if(!btn) return;
 const empty=OLL.loading||!!OLL.error||!ollFiltered().length;
 btn.disabled=OLL.exporting||empty;
 btn.textContent=OLL.exporting?`Đang xuất… ${OLL.exportPct}%`:'Xuất Excel';
}

/* ---------- Xuất Excel ---------- */
/* Xuất TOÀN BỘ kết quả theo bộ lọc hiện tại (không chỉ trang đang xem). Xử lý bất đồng bộ theo từng khúc để giao
   diện không bị treo khi khoảng 365 ngày (~13 vạn dòng); nút hiện % tiến độ. */
function ollLoadExcel(){
 if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
 return new Promise((resolve,reject)=>{
  const s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  s.onload=()=>window.ExcelJS?resolve(window.ExcelJS):reject(new Error('ExcelJS'));
  s.onerror=reject;
  document.head.appendChild(s);
 });
}
async function ollExport(){
 if(OLL.exporting) return;
 const list=ollFiltered().slice(), range=OLL.range;
 if(!list.length) return;
 const filters=[];
 if(OLL.status!=='all') filters.push(`Trạng thái: ${OLL.status==='ok'?'Thành công':'Thất bại'}`);
 if(OLL.axis) filters.push(`Trục: ${OLL_AXIS_NAME[OLL.axis]}`);
 if(OLL.org) filters.push(`Đơn vị: ${OLL.org.name}${OLL.orgSub?' (gồm đơn vị trực thuộc)':''}`);
 if(OLL.q.trim()) filters.push(`Từ khóa: "${OLL.q.trim()}"`);
 OLL.exporting=true; OLL.exportPct=0; ollUpdateExportBtn();
 ollToast(`Đang chuẩn bị tệp Excel ${ollNum(list.length)} dòng…`);
 try{
  const X=await ollLoadExcel();
  const wb=new X.Workbook(), ws=wb.addWorksheet('Nhật ký đăng nhập');
  ws.addRow(['Nhật ký đăng nhập hệ thống IOC — toàn bộ tài khoản']).font={bold:true,size:13};
  ws.addRow([`Từ ngày ${ollFmtDate(range.from)} đến ngày ${ollFmtDate(range.to)}${filters.length?' · '+filters.join(' · '):''}`]);
  ws.addRow(['SỐ LIỆU MÔ PHỎNG (BẢN DEMO) — KHÔNG PHẢI SỐ LIỆU THẬT']).font={italic:true,color:{argb:'FFC00000'}};
  ws.addRow([]);
  ws.addRow(['STT','Thời gian','Họ tên','Tên đăng nhập','Trục','Đơn vị công tác','Địa chỉ IP','Trạng thái','Ghi chú']).font={bold:true};
  const CHUNK=4000;
  for(let i=0;i<list.length;i++){
   const e=list[i], u=ollUserOf(e), d=new Date(e.ts);
   ws.addRow([i+1,`${ollFmtDate(d)} ${ollFmtTime(d)}`,u.name,u.username,OLL_AXIS_NAME[u.axis]||'',u.orgName,e.ip,e.ok?'Thành công':'Thất bại',e.ok?(ollIsCurrent(e)?'Phiên hiện tại':''):ollReason(e.reason)]);
   if((i+1)%CHUNK===0){OLL.exportPct=Math.round((i+1)/list.length*90);ollUpdateExportBtn();await new Promise(r=>setTimeout(r,0));}
  }
  ws.columns=[{width:8},{width:21},{width:26},{width:26},{width:11},{width:44},{width:16},{width:13},{width:20}];
  OLL.exportPct=95; ollUpdateExportBtn();
  const buf=await wb.xlsx.writeBuffer();
  const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`nhat-ky-dang-nhap-toan-he-thong-${ollIso(range.from)}-${ollIso(range.to)}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  ollToast(`Đã xuất ${ollNum(list.length)} lượt đăng nhập ra Excel.`);
 }catch(err){
  ollToast('Không xuất được tệp Excel. Vui lòng thử lại.');
 }finally{
  OLL.exporting=false; OLL.exportPct=0; ollUpdateExportBtn();
 }
}

/* ---------- Đóng popover khi bấm ra ngoài / Esc ---------- */
document.addEventListener('click',e=>{
 if(!OLL.inited||!document.contains(e.target)) return; // phần tử đã bị vẽ lại → do chính component xử lý
 let changed=false;
 if(OLL.dd&&!e.target.closest('.oll-dd-wrap')){OLL.dd=null;changed=true;}
 if(OLL.cal.open&&!e.target.closest('.oll-cal')&&!e.target.closest('.oll-date')){OLL.cal.open=false;changed=true;}
 if(changed) ollRender();
});
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape'||!OLL.inited) return;
 if(!document.getElementById('login-log')?.classList.contains('active')) return;
 if(OLL.dd){OLL.dd=null;ollRender();e.preventDefault();}
 else if(OLL.cal.open){OLL.cal.open=false;ollRender();e.preventDefault();}
});
ollApplyMenuPermission();
