/* ============================== DỮ LIỆU NHẬT KÝ ĐĂNG NHẬP — DÙNG CHUNG ==============================
 Một nguồn cho cả màn quản trị máy tính (js/oua-login-log.js, js/oua-data.js) và bản mobile (mobile-admin/), để
 hai bên ra cùng một con số. Phải nạp SAU js/core/account-data.js và TRƯỚC js/oua-data.js / mobile-admin.js.
 - Người dùng: người thật trong account.json (window.OUA_ACCOUNT_DATA), đúng thứ tự cây.
 - Lượt đăng nhập: GIẢ LẬP, sinh cố định theo ngày từ ngày hệ thống bắt đầu ghi nhật ký (LL_START). Ngày làm việc
   ~480 lượt (thứ Hai đông hơn), thứ Bảy ~70, Chủ nhật/ngày lễ ~18; ~20% tài khoản dùng thường xuyên chiếm ~78% số
   lượt (tỉ lệ này cho ra ~19% tài khoản "Chưa đăng nhập", sát mức 18% các màn đang dùng); cao điểm đầu giờ sáng/chiều; IP nội bộ 10.x theo trục/đơn vị, ngoài giờ dùng IP nhà mạng.
 - Ngày tạo / bị khóa của từng tài khoản sinh cố định theo id (cùng công thức bản mobile dùng từ trước). Không có lượt
   nào trước ngày tạo; tài khoản bị khóa thì từ lúc khóa mọi lượt là "Tài khoản bị khóa".
 - "Đăng nhập gần nhất" = lượt thành công mới nhất trong nhật ký; không có lượt nào = "Chưa đăng nhập".
 - Phiên vào màn quản trị của Admin là lượt THẬT (localStorage) — đánh dấu "Phiên hiện tại".
 Đây là số mô phỏng. window.__ollSimulateError=true để thử trạng thái lỗi ở cả 2 giao diện. */
(function(){
'use strict';
const DAY=864e5, NOW=Date.now();
const LL_START=new Date(2025,8,15); // ngày hệ thống bắt đầu ghi nhật ký đăng nhập (giả định cho bản demo)
const STORAGE_KEY='px-ioc-oua-login-log';
const FAIL_REASONS={wrong_password:'Sai mật khẩu',locked:'Tài khoản bị khóa',session_expired:'Phiên hết hạn'};
const AXIS_NAME={DANG:'Đảng ủy',HDND:'HĐND',UBND:'UBND',MTTQ:'MTTQ',SYS:'Hệ thống'};
const HOLIDAYS=new Set(['2025-09-01','2025-09-02','2026-01-01','2026-02-14','2026-02-15','2026-02-16','2026-02-17','2026-02-18','2026-02-19','2026-02-20','2026-02-21','2026-02-22','2026-04-27','2026-04-30','2026-05-01','2026-09-01','2026-09-02']);
const PUBLIC_PREFIX=['113.190.','14.177.','123.24.','171.224.','27.72.','116.96.','42.112.','118.70.'];
const AXIS_NET={DANG:12,HDND:14,UBND:16,MTTQ:21};
const VIEWER={user:'ioc_mbfs',role:'global_admin',name:'Quản trị hệ thống',orgName:'Quản trị toàn cục IOC'};

const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const gauss=r=>Math.sqrt(-2*Math.log(r()||1e-9))*Math.cos(2*Math.PI*r());
/* Số ngẫu nhiên cố định theo (id, salt) — y hệt hàm rnd() của mobile-admin.js để giữ nguyên các số đã có. */
function rnd(seed,salt){
 let t=(Number(seed)*7919+salt*104729)>>>0;
 t+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61);
 return ((t^t>>>14)>>>0)/4294967296;
}
function inferAxis(name){
 if(!name) return null;
 if(/Thành ủy|Đảng ủy|Đảng bộ/i.test(name)) return 'DANG';
 if(/HĐND/i.test(name)) return 'HDND';
 if(/UBND|Sở |Ban Quản lý|Thanh tra/i.test(name)) return 'UBND';
 if(/MTTQ/i.test(name)) return 'MTTQ';
 return null;
}

/* ---------- Người dùng ---------- */
const users=[], byId=new Map(), orgPaths=new Map();
(function build(){
 const src=window.OUA_ACCOUNT_DATA; if(!src) return;
 (function walk(n,parentAxis){
  const axis=inferAxis(n.name)||parentAxis||null, path=String(n.path||n.id);
  orgPaths.set(String(n.id),path);
  (n.users||[]).forEach(raw=>{
   const id=raw.egov_user_id, r1=rnd(id,1), isNew=r1<0.04;
   const username=String((raw.label||'').split(' - ')[0]||(raw.email||'').split('@')[0]||'').trim();
   const u={i:users.length,id,name:(raw.name||'').trim()||'—',username,axis,orgId:n.id,orgName:(n.name||'').trim()||'Chưa gán đơn vị',orgPath:path,
    createdAt:NOW-(isNew?Math.floor(r1/0.04*30):30+Math.floor(rnd(id,2)*700))*DAY-Math.floor(rnd(id,6)*DAY),
    locked:rnd(id,5)<0.012};
   u.lockAt=u.locked?NOW-Math.round((0.3+rnd(id,8)*9)*DAY):Infinity;
   u._s=norm(`${u.name} ${username}`);
   users.push(u); byId.set(String(id),u);
  });
  (n.children||[]).forEach(c=>walk(c,axis));
 })(src,null);
})();
const active=[];
users.forEach(u=>{if(hash(`oll-act|${u.id}`)%100<20) active.push(u.i);});
const ADMIN_USER={i:-1,id:VIEWER.user,name:VIEWER.name,username:VIEWER.user,axis:'SYS',orgId:null,orgName:VIEWER.orgName,orgPath:'',_s:norm(`${VIEWER.name} ${VIEWER.user}`)};
const userOf=e=>e.u<0?ADMIN_USER:(users[e.u]||ADMIN_USER);

function lanIp(u){return `10.${AXIS_NET[u.axis]||18}.${20+(Number(u.orgId)||0)%220}.${10+hash(`oll-host|${u.id}`)%240}`;}
/* IP nhà mạng đổi theo tháng (IP động hộ gia đình) — cùng người, cùng tháng thì cùng 1 IP. */
function homeIp(u,d){
 const r=rng(hash(`oll-home|${u.id}|${d.getFullYear()}-${d.getMonth()}`));
 return `${PUBLIC_PREFIX[Math.floor(r()*PUBLIC_PREFIX.length)]}${1+Math.floor(r()*254)}.${1+Math.floor(r()*254)}`;
}

/* ---------- Sinh lượt đăng nhập theo ngày ---------- */
const dayCache=new Map();
function dayEvents(day){
 const k=iso(day);
 if(dayCache.has(k)) return dayCache.get(k);
 const out=[];
 if(users.length&&day>=LL_START){
  const r=rng(hash(`oll-day|${k}`));
  const dow=day.getDay(), off=HOLIDAYS.has(k)||dow===0, sat=dow===6&&!off;
  const n=Math.round((off?18:(sat?70:(dow===1?540:480)))*(0.85+r()*0.3));
  const t0=day.getTime();
  for(let i=0;i<n;i++){
   const ui=(r()<0.78&&active.length)?active[Math.floor(r()*active.length)]:Math.floor(r()*users.length);
   let mins, home=false;
   if(off||sat){mins=8*60+Math.floor(r()*12*60);home=r()<0.65;}
   else{
    const q=r();
    if(q<0.52) mins=7*60+30+Math.floor(Math.abs(gauss(r))*45);
    else if(q<0.80) mins=13*60+15+Math.floor(Math.abs(gauss(r))*40);
    else if(q<0.95) mins=9*60+Math.floor(r()*8*60);
    else {mins=19*60+Math.floor(r()*210);home=true;}
   }
   mins=Math.min(mins,23*60+58);
   const ts=t0+mins*60000+Math.floor(r()*60000), u=users[ui];
   const ip=home?homeIp(u,day):lanIp(u), x=r();
   if(ts<u.createdAt) continue;                 // chưa có tài khoản
   if(ts>=u.lockAt){out.push({ts,u:ui,ip,ok:false,reason:'locked'});continue;} // đã bị khóa
   if(x<0.003){
    /* Nhập sai liên tiếp → hệ thống khóa tạm, lượt này không vào được. */
    [170,120,75].forEach(s=>out.push({ts:ts-s*1000,u:ui,ip,ok:false,reason:'wrong_password'}));
    out.push({ts:ts-30000,u:ui,ip,ok:false,reason:'locked'});
    continue;
   }
   if(x<0.045) out.push({ts:ts-(20+Math.floor(r()*70))*1000,u:ui,ip,ok:false,reason:'wrong_password'});
   else if(x<0.06) out.push({ts:ts-(5+Math.floor(r()*20))*1000,u:ui,ip,ok:false,reason:'session_expired'});
   out.push({ts,u:ui,ip,ok:true});
  }
  out.sort((a,b)=>b.ts-a.ts);
 }
 dayCache.set(k,out);
 return out;
}

/* ---------- Phiên quản trị thật ---------- */
let adminMem=null;
function adminEvents(){
 if(!adminMem){try{adminMem=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')||[];}catch(e){adminMem=[];}}
 return adminMem;
}
/* Mỗi lần vào màn quản trị = 1 phiên. reuseInTab=true (bản mobile): tải lại trang trong cùng tab không tính là
   lần đăng nhập mới. */
function recordAdminSession(reuseInTab){
 if(reuseInTab){try{const s=sessionStorage.getItem('px-ioc-oua-session');if(s){window.__ollSession=s;return;}}catch(e){}}
 const list=adminEvents(), sid=`oua-${Date.now()}-${Math.floor(Math.random()*1e6)}`;
 window.__ollSession=sid;
 list.push({ts:Date.now(),u:-1,ip:'10.10.1.25',ok:true,sid});
 if(list.length>300) list.splice(0,list.length-300);
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(list));}catch(e){}
 if(reuseInTab){try{sessionStorage.setItem('px-ioc-oua-session',sid);}catch(e){}}
}
const isCurrent=e=>!!(e.ok&&e.sid&&window.__ollSession===e.sid);

/* ---------- Truy vấn ---------- */
const dayOf=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
/* Mọi lượt trong [from, to] (tính theo ngày, gồm cả 2 đầu), mới nhất trước. */
function query(from,to){
 const now=Date.now(), out=[], a=dayOf(from), b=dayOf(to);
 for(let d=b;d>=a;d=addDays(d,-1)){
  if(d<LL_START) break;
  for(const e of dayEvents(d)) if(e.ts<=now) out.push(e);
 }
 const lo=a.getTime(), hi=addDays(b,1).getTime();
 const own=adminEvents().filter(e=>e.ts>=lo&&e.ts<hi);
 if(own.length){out.push(...own);out.sort((x,y)=>y.ts-x.ts);}
 return out;
}
/* Lượt của 1 người trong n ngày gần nhất (dùng cho hồ sơ người dùng). */
function userEvents(id,days){
 const u=byId.get(String(id)); if(!u) return [];
 const t=dayOf(new Date()), out=[];
 for(let i=0;i<days;i++){
  const d=addDays(t,-i); if(d<LL_START) break;
  for(const e of dayEvents(d)) if(e.u===u.i&&e.ts<=Date.now()) out.push(e);
 }
 return out;
}
let lastMap=null;
function lastLogin(id){
 if(!lastMap){
  lastMap=new Float64Array(users.length);
  const now=Date.now();
  for(let d=dayOf(new Date());d>=LL_START;d=addDays(d,-1)){
   for(const e of dayEvents(d)) if(e.ok&&e.ts<=now&&!lastMap[e.u]) lastMap[e.u]=e.ts;
  }
 }
 const u=byId.get(String(id));
 return u&&lastMap[u.i]?lastMap[u.i]:null;
}
function meta(id){const u=byId.get(String(id));return u?{createdAt:u.createdAt,locked:u.locked,lockAt:u.lockAt}:null;}
/* Đếm nhanh lượt thất bại hôm nay (thẻ "Cần xử lý" bản mobile). */
function todayStats(){
 const ev=query(new Date(),new Date()), fail=ev.filter(e=>!e.ok);
 return {total:ev.length,fail:fail.length,failUsers:new Set(fail.map(e=>e.u)).size};
}

window.LOGIN_LOG={
 START:LL_START,FAIL_REASONS,AXIS_NAME,VIEWER,ADMIN_USER,
 users,userById:id=>byId.get(String(id))||null,userOf,orgPathOf:id=>orgPaths.get(String(id))||'',
 dayEvents,query,userEvents,lastLogin,meta,todayStats,
 adminEvents,recordAdminSession,isCurrent,
 reason:k=>FAIL_REASONS[k]||'',
 canView:()=>VIEWER.role==='global_admin',
 norm
};
})();
