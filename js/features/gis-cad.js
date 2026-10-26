/* ============================== gis-cad.js ==============================
   CAD — điều phối xử lý điểm nghẽn trên bản đồ GIS. Làm đúng theo tài liệu nghiệp vụ đã chốt với anh
   (docs/CHUNG/NGHIEP_VU_CAD_DIEU_PHOI_DIEM_NGHEN_2026_10_23.md). Dữ liệu nền + công thức điểm ở cad-data.js.

   3 vai trò:
   - IOC Thành phố (tài khoản cấp Thành phố, không xem theo xã/phường hay sở): mở "Điều phối CAD", chọn chế độ
     Thủ công / Bán tự động / Tự động, chọn lực lượng + đơn vị, phát phiếu lệnh, theo dõi tới khi xử lý xong.
   - IOC xã/phường (tài khoản xem theo 1 xã/phường): chỉ thấy phiếu lệnh của ĐƠN VỊ ĐÓNG TRÊN ĐỊA BÀN MÌNH,
     xác nhận hoặc từ chối (bắt buộc lý do) trong thời hạn xác nhận.
   - Đơn vị xử lý: chưa có tài khoản riêng, nên 3 bước báo cáo của đơn vị (nhận lệnh, tới hiện trường, hoàn thành
     kèm ảnh) được thao tác thay ngay trên bảng phiếu lệnh của IOC xã/phường, báo cáo tự động chuyển lên IOC TP.

   Giao diện (làm lại 2026-10-24 theo bản thiết kế anh duyệt): mở CAD thì khung điều phối THAY CHỖ sidebar bên
   phải của widget bản đồ, bản đồ Leaflet vẫn hiện bên trái và được vẽ thêm điểm nghẽn đang điều phối, đơn vị sẽ
   điều động (chấm vàng đánh số), tuyến dự kiến + số phút, vòng phạm vi ETA tối đa.

   Lực lượng (mục 7.3): đơn vị chính BẮT BUỘC, 3 đơn vị phối hợp chỉ là gợi ý — mặc định không tick, trực ban tick
   lực lượng nào cần. "Đã xử lý" = mọi đơn vị THỰC SỰ được điều động báo hoàn thành.

   "Mô phỏng phản hồi cấp dưới" (bật mặc định): khi đang xem bằng tài khoản Thành phố, hệ thống tự đóng vai IOC
   xã/phường + đơn vị (xác nhận/từ chối/im lặng tới quá hạn, rồi báo 3 bước) để xem được trọn luồng mà không phải
   đổi tài khoản. Thời hạn xác nhận (2/5 phút) là thời gian THẬT, không tua nhanh.

   Trạng thái CAD giữ trong phiên (biến CAD), không ghi máy chủ — đổi tài khoản trong phiên vẫn còn nguyên phiếu
   lệnh, để thử đúng luồng TP phát lệnh → đăng nhập xã/phường xác nhận. Tải lại trang thì về dữ liệu ban đầu. */

const CAD={inited:false,mode:'semi',sim:true,seq:100,inc:{},tickets:[],log:[],notify:[],extraHist:{},
 open:null,sel:null,tab:'open',q:'',kind:'all',dtab:'forces',expand:null,cmdEdit:false,xaTab:'wait',
 autoTimers:[],reinf:null,xaReject:null,photoDraft:{},flash:null,photoView:null,fitKey:null,layer:null};
const CAD_PREF_KEY='iocCadPrefs';
const CAD_STEPS=['IOC Thành phố ban hành','IOC xã/phường tiếp nhận','Đơn vị nhận lệnh','Tới hiện trường','Hoàn thành'];
const CAD_MODES=[['manual','Thủ công'],['semi','Bán tự động'],['auto','Tự động']];
const CAD_MODE_HINT={
 manual:'Trực ban tự chọn đơn vị và phát từng lực lượng. Thay đơn vị đề xuất phải nhập lý do.',
 semi:'Hệ thống đề xuất đơn vị và soạn sẵn lệnh. Trực ban thay đơn vị (nhập lý do), sửa lệnh rồi duyệt.',
 auto:'Hệ thống tự phát cho đơn vị chính khi mở điểm nghẽn, và cho mỗi lực lượng phối hợp ngay khi được tick.'
};
const CAD_REJECT_REASONS=['Đơn vị đang dồn lực cho vụ việc khác trên địa bàn','Phương tiện chuyên dụng đang bảo dưỡng','Không đủ quân số trực tại thời điểm nhận lệnh'];
const CAD_FAIL=['rejected','expired'];
const CAD_STATUS_LABEL={open:'Chưa xử lý',doing:'Đang xử lý',done:'Đã xử lý'};

/* ---------- tiện ích ---------- */
function cadNow(){return Date.now();}
function cadHm(ts){if(!ts)return '';const d=new Date(ts);return pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds());}
function cadMmSs(ms){ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return pad2(Math.floor(s/60))+':'+pad2(s%60);}
function cadQ(id){return String(id).replace(/[^\w-]/g,'');}
function cadForceName(type){return (CAD_FORCE_TYPES[type]||{}).name||type;}
function cadRoleLabel(k){return k===0?'Đơn vị chính':'Đơn vị phối hợp';}
function cadMeta(code){return gisBottleneckMeta(code)||{name:'Điểm nghẽn',color:'#49bcff',code};}
function cadKmTxt(km){return km.toFixed(1).replace('.',',')+' km';}
/* Chỉ tài khoản cấp Thành phố (không xem theo xã/phường, sở/ngành, không phải tài khoản Trung ương) mới là
   trực ban IOC Thành phố — đúng phạm vi dữ liệu "toàn Thành phố" của gisEformData. */
function cadIsTpView(){return !!currentRole&&currentXaId==null&&!currentSoId&&!(typeof isTwRole==='function'&&isTwRole(currentRole));}
function cadIsXaView(){return !!currentRole&&currentXaId!=null;}
function cadLoadPrefs(){try{const p=JSON.parse(localStorage.getItem(CAD_PREF_KEY)||'{}');if(CAD_MODES.some(m=>m[0]===p.mode))CAD.mode=p.mode;if(typeof p.sim==='boolean')CAD.sim=p.sim;}catch(e){}}
function cadSavePrefs(){try{localStorage.setItem(CAD_PREF_KEY,JSON.stringify({mode:CAD.mode,sim:CAD.sim}));}catch(e){}}
function cadFlash(text,kind){CAD.flash={text,kind:kind||'info',at:cadNow()};}

/* ---------- điểm nghẽn ---------- */
function cadRec(id){return (gisEformData||[]).find(r=>r.id===id);}
function cadIncOf(rec){
 let inc=CAD.inc[rec.id];
 if(!inc){
  const title=rec.title||rec.name||'Điểm nghẽn';
  /* Điểm cháy nổ mẫu có location_text = chính tên vụ việc → bỏ, để lệnh dùng tên xã/phường thay vì lặp tên. */
  inc=CAD.inc[rec.id]={id:rec.id,code:rec.bottleneck_code,title,loc:rec.location_text&&rec.location_text!==title?rec.location_text:'',
   lat:rec.lat,lng:rec.lng,xaId:cadNearestWard(rec.lat,rec.lng),received:rec.received_at||cadNow(),reportCount:rec.reportCount||1,
   /* Mục 7.3: chỉ đơn vị chính được tick sẵn (on), 3 đơn vị phối hợp chờ trực ban tick. */
   forces:cadGroup(rec.bottleneck_code).forces.map((type,k)=>({type,on:k===0,excluded:[],exclNotes:[],pick:0,reason:'',alerted:false})),
   cmd:null,closedAt:null};
 }
 inc.reportCount=rec.reportCount||inc.reportCount;
 return inc;
}
function cadTicketsOf(id){return CAD.tickets.filter(t=>t.recId===id);}
function cadActiveTicket(id,k){return CAD.tickets.find(t=>t.recId===id&&t.k===k&&!CAD_FAIL.includes(t.status));}
function cadStep(t){return t.at.length;}
/* Lực lượng tính vào điều phối = đã tick, hoặc đã có phiếu đang chạy. */
function cadOnKs(inc){return inc.forces.map((f,k)=>k).filter(k=>inc.forces[k].on||cadActiveTicket(inc.id,k));}
function cadIncStatus(inc){
 const ks=cadOnKs(inc),act=ks.map(k=>cadActiveTicket(inc.id,k));
 if(ks.length&&act.every(t=>t&&t.status==='done')) return 'done';
 return act.some(Boolean)?'doing':'open';
}
function cadIncAlert(inc){return inc.forces.some((f,k)=>f.on&&f.alerted&&!cadActiveTicket(inc.id,k));}
function cadBusy(unitId){return CAD.tickets.filter(t=>t.unitId===unitId&&!CAD_FAIL.includes(t.status)&&t.status!=='done').length;}
function cadCands(inc,k){
 const f=inc.forces[k];
 return cadRankUnits(f.type,{incXaId:inc.xaId,lat:inc.lat,lng:inc.lng,code:inc.code,excluded:new Set(f.excluded),busy:cadBusy,extraHist:id=>CAD.extraHist[id]});
}
function cadTop3(inc,k){return cadCands(inc,k).slice(0,3);}
function cadHistAdd(unitId,ok){const h=CAD.extraHist[unitId]=CAD.extraHist[unitId]||{total:0,ok:0};h.total++;if(ok)h.ok++;}

/* ---------- nhật ký + notify ---------- */
function cadLog(recId,text){CAD.log.unshift({ts:cadNow(),recId,text});}
function cadNotify(aud,level,title,sub,recId){
 CAD.notify.unshift({id:'cadn'+(CAD.notify.length+1),ts:cadNow(),aud,level,title,sub,recId});
}
function cadNotifyVisible(){
 if(cadIsTpView()) return CAD.notify.filter(n=>n.aud==='tp');
 if(cadIsXaView()) return CAD.notify.filter(n=>n.aud===Number(currentXaId));
 return [];
}
/* Dòng Notify CAD cho widget "Notify IOC/CAD" (my-tasks-notify.js gọi) — tab GIS/Camera AI hiện mọi dòng, tab
   Khẩn cấp/Quan trọng chỉ hiện dòng mức khẩn. */
function cadNotifyRows(matchQ,urgentOnly){
 if(!GIS_CAD_ENABLED) return [];
 return cadNotifyVisible().filter(n=>!urgentOnly||n.level==='urgent').filter(n=>!matchQ||matchQ(n.title+' '+n.sub)).slice(0,30).map(n=>
  `<button class="notify" onclick="closeModal();cadOpenFromNotify('${cadQ(n.recId)}')"><div><b>${n.level==='urgent'?'⚠️ ':''}${esc(n.title)}</b><small>${esc(n.sub)} · ${cadHm(n.ts)}</small></div><span class="badge ${n.level==='urgent'?'red':'ok'}">CAD</span></button>`);
}
function cadOpenFromNotify(recId){if(cadIsXaView())cadOpenXaPanel();else cadOpenPanel(recId);}

/* ---------- đồng bộ ngược sang marker GIS ---------- */
function cadSyncRec(inc){
 const st=cadIncStatus(inc);
 if(st==='done'&&!inc.closedAt){
  inc.closedAt=cadNow();
  cadLog(inc.id,'Tất cả đơn vị được điều động đã báo hoàn thành — điểm nghẽn chuyển sang "Đã xử lý"');
  cadNotify('tp','info','Đã xử lý: '+inc.title,'Tất cả đơn vị được điều động đã báo hoàn thành kèm ảnh',inc.id);
 }
 const rec=cadRec(inc.id);
 if(!rec) return;
 rec.cadActive=st==='doing';
 if(st==='done'&&rec.status!=='done'){
  rec.status='done';rec.completed_at=cadNow();rec.cadActive=false;
  if(typeof gisScheduleAutoHide==='function') gisScheduleAutoHide(rec.id);
 }
 if(typeof gisUpdateEformMarker==='function') gisUpdateEformMarker(rec);
}
function cadAfterChange(){
 CAD.inc&&Object.values(CAD.inc).forEach(cadSyncRec);
 if(typeof updateGisStatus==='function')updateGisStatus();
 if(typeof gisRenderKpiStrip==='function')gisRenderKpiStrip();
 cadRenderSidebar();
 if(typeof renderMyTasksNotify==='function') try{renderMyTasksNotify();}catch(e){}
 cadRender();
}

/* ---------- nội dung lệnh ---------- */
/* Nơi xảy ra để ghi vào lệnh: vị trí cụ thể nếu có, không thì "phường Hai Bà Trưng" (viết thường giữa câu). */
function cadPlace(inc){if(inc.loc)return inc.loc;const w=cadWardInfo(inc.xaId);return w.type+' '+w.short;}
function cadDefaultCmd(inc,u){
 const lv=cadLevel(inc.reportCount);
 return `Đề nghị ${cadIocName(u.xaId)} chỉ đạo ${u.name} xử lý “${inc.title}” tại ${cadPlace(inc)}, hoàn thành trong ${lv.sla} phút, báo cáo về IOC Thành phố.`;
}
function cadSemiText(inc){
 if(inc.cmd==null){const lv=cadLevel(inc.reportCount);inc.cmd=`Xử lý “${inc.title}” tại ${cadPlace(inc)}, hoàn thành trong ${lv.sla} phút, báo cáo về IOC Thành phố.`;}
 return inc.cmd;
}
function cadTicketCmd(inc,u,mode){return mode==='semi'?`Đề nghị ${cadIocName(u.xaId)} chỉ đạo ${u.name}: ${cadSemiText(inc)}`:cadDefaultCmd(inc,u);}

/* ---------- vòng đời phiếu lệnh (mục 8.2) ---------- */
function cadDispatch(recId,k,opts){
 const inc=CAD.inc[recId]; if(!inc||cadActiveTicket(recId,k)) return null;
 const u=cadUnitById(opts.unitId); if(!u) return null;
 const t={no:++CAD.seq,recId,k,type:inc.forces[k].type,unitId:u.id,unitName:u.name,xaId:u.xaId,kind:opts.kind||'normal',
  fromRecId:opts.fromRecId||null,mode:opts.mode||CAD.mode,status:'sent',at:[cadNow()],deadline:cadNow()+cadConfirmMs(inc.code),
  cmd:opts.cmd||cadTicketCmd(inc,u,opts.mode||CAD.mode),eta:opts.eta||null,reason:'',failAt:null,photo:null,seed:false};
 CAD.tickets.push(t);
 inc.forces[k].on=true;inc.forces[k].alerted=false;
 const how=t.mode==='manual'?'trực ban phát':t.mode==='semi'?'trực ban duyệt':'hệ thống tự phát';
 cadLog(recId,`Phát phiếu lệnh #${t.no} (${how}) → ${cadIocName(u.xaId)} · ${u.name}${t.kind==='reinforce'?' · điều động bớt lực lượng':''}`);
 if(opts.reason) cadLog(recId,`Thay đơn vị đề xuất cho lực lượng ${cadForceName(t.type)} bằng ${u.name}. Lý do: ${opts.reason}`);
 cadNotify(u.xaId,cadIsEmergency(inc.code)?'urgent':'info',`Phiếu lệnh #${t.no}: ${inc.title}`,`${u.name} · xác nhận trong ${cadConfirmMs(inc.code)/60000} phút`,recId);
 cadSimPlan(t);
 return t;
}
function cadFindTicket(no){return CAD.tickets.find(t=>t.no===Number(no));}
function cadConfirm(no){
 const t=cadFindTicket(no); if(!t||t.status!=='sent') return;
 t.status='confirmed';t.at.push(cadNow());cadHistAdd(t.unitId,true);
 cadLog(t.recId,`${cadIocName(t.xaId)} xác nhận phiếu #${t.no}, chỉ đạo ${t.unitName}`);
 cadSimNext(t);
}
function cadFail(t,status,reason){
 const inc=CAD.inc[t.recId],f=inc.forces[t.k];
 t.status=status;t.failAt=cadNow();t.reason=reason||'';cadHistAdd(t.unitId,false);
 f.excluded.push(t.unitId);f.exclNotes.push({unit:t.unitName,why:status==='rejected'?'Từ chối: '+reason:'Quá hạn xác nhận'});
 f.pick=0;f.reason='';
 const what=status==='rejected'?`từ chối phiếu #${t.no}. Lý do: ${reason}`:`không phản hồi phiếu #${t.no} trong ${cadConfirmMs(inc.code)/60000} phút (quá hạn xác nhận)`;
 cadLog(t.recId,`${cadIocName(t.xaId)} ${what}. Tạm loại ${t.unitName} khỏi lần xử lý này`);
 cadNotify('tp','urgent',(status==='rejected'?'Bị từ chối: ':'Quá hạn xác nhận: ')+inc.title,`${cadForceName(t.type)} · ${t.unitName}${reason?' · '+reason:''}`,t.recId);
 cadAfterFail(inc,t.k);
}
function cadReject(no,reason){const t=cadFindTicket(no);if(!t||t.status!=='sent')return false;cadFail(t,'rejected',reason);return true;}
/* Mục 9.1 bước 4: Thủ công → dồn ứng viên, chờ trực ban chọn lại; Bán tự động/Tự động → tự phát cho ứng viên đứng
   đầu mới. Hết ứng viên phù hợp → cảnh báo (mục 9.2). */
function cadAfterFail(inc,k){
 const top=cadCands(inc,k)[0];
 if(!top){cadAlertNoCand(inc,k);return;}
 if(CAD.mode==='manual'){
  cadLog(inc.id,`Danh sách ứng viên ${cadForceName(inc.forces[k].type)} đã dồn lên — chờ trực ban chọn lại đơn vị`);
  return;
 }
 const t=cadDispatch(inc.id,k,{unitId:top.unit.id,mode:CAD.mode,eta:top.eta});
 if(t) cadLog(inc.id,`Hệ thống tự phát phiếu #${t.no} cho ứng viên kế tiếp ${top.unit.name}`);
}
function cadAlertNoCand(inc,k){
 const f=inc.forces[k]; if(f.alerted) return;
 f.alerted=true;
 cadLog(inc.id,`Cảnh báo: hết ứng viên ${cadForceName(f.type)} phù hợp (trong ${cadEtaMax(inc.code)} phút di chuyển) — cần điều động bớt lực lượng từ điểm nghẽn đang xử lý`);
 cadNotify('tp','urgent','Hết ứng viên phù hợp: '+inc.title,`Thiếu lực lượng ${cadForceName(f.type)} · cần điều động bớt lực lượng`,inc.id);
}
/* Bước 3–5 do đơn vị báo về IOC xã/phường của mình; báo cáo tự động chuyển lên IOC Thành phố (không duyệt). */
function cadUnitReport(no,photo){
 const t=cadFindTicket(no); if(!t||!['confirmed','received','onsite'].includes(t.status)) return false;
 const next={confirmed:'received',received:'onsite',onsite:'done'}[t.status];
 if(next==='done'&&!photo) return false;
 t.status=next;t.at.push(cadNow());
 if(next==='done') t.photo=photo;
 const label={received:'đã nhận lệnh, đang điều lực lượng',onsite:'đã có mặt tại hiện trường',done:'báo hoàn thành kèm ảnh hiện trường'}[next];
 cadLog(t.recId,`${t.unitName} ${label} (phiếu #${t.no}) — ${cadIocName(t.xaId)} tự động chuyển báo cáo lên IOC Thành phố`);
 if(next==='done'){const inc=CAD.inc[t.recId];cadNotify('tp','info','Đơn vị hoàn thành: '+inc.title,t.unitName,t.recId);}
 cadSimNext(t);
 return true;
}

/* ---------- mô phỏng cấp dưới ---------- */
function cadSimPlan(t){
 const r=gisRng(gisSeedNum('cadsim|'+t.no+'|'+t.unitId));
 const x=r();
 t.simOutcome=x<0.08?'reject':x<0.15?'silent':'confirm';
 t.simReason=CAD_REJECT_REASONS[Math.floor(r()*CAD_REJECT_REASONS.length)];
 t.simNext=cadNow()+4000+Math.round(r()*5000);
}
function cadSimNext(t){
 const r=gisRng(gisSeedNum('cadsimstep|'+t.no+'|'+t.at.length));
 /* Phiếu mẫu dựng sẵn lúc mở trang là vụ việc đang xử lý dở — chạy chậm hơn hẳn (vài phút mỗi bước). */
 if(t.seed){const d={confirmed:60000+r()*60000,received:120000+r()*120000,onsite:240000+r()*240000}[t.status];t.simNext=d?cadNow()+Math.round(d):null;return;}
 const d={confirmed:3000+r()*3000,received:Math.min(20000,Math.max(4000,(t.eta||5)*1500)),onsite:8000+r()*7000}[t.status];
 t.simNext=d?cadNow()+Math.round(d):null;
}
function cadSimPhoto(t){
 try{
  const c=document.createElement('canvas');c.width=360;c.height=220;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,360,220);g.addColorStop(0,'#2b3a2f');g.addColorStop(1,'#5b4d3a');x.fillStyle=g;x.fillRect(0,0,360,220);
  x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,160,360,60);
  x.fillStyle='#fff';x.font='bold 15px sans-serif';x.fillText('Ảnh hiện trường (mô phỏng)',12,184);
  x.font='12px sans-serif';x.fillText(t.unitName.slice(0,48),12,204);x.fillText(cadHm(cadNow()),300,204);
  return c.toDataURL('image/jpeg',.7);
 }catch(e){return 'sim';}
}
/* Mô phỏng chỉ chạy khi đang xem bằng tài khoản Thành phố — đăng nhập xã/phường để tự thao tác thì hệ thống
   không "làm hộ" nữa (nếu không phiếu vừa tới đã bị tự xác nhận trước khi kịp bấm). */
function cadTick(){
 if(!CAD.inited) return;
 const now=cadNow();let changed=false;
 CAD.tickets.forEach(t=>{
  if(t.status==='sent'&&now>=t.deadline){cadFail(t,'expired');changed=true;return;}
  if(!CAD.sim||!cadIsTpView()||!t.simNext||now<t.simNext) return;
  if(t.status==='sent'){
   if(t.simOutcome==='silent'){t.simNext=null;return;}
   if(t.simOutcome==='reject') cadFail(t,'rejected',t.simReason); else cadConfirm(t.no);
   changed=true;
  }else if(['confirmed','received','onsite'].includes(t.status)){
   cadUnitReport(t.no,t.status==='onsite'?cadSimPhoto(t):null);changed=true;
  }
 });
 if(changed) cadAfterChange(); else cadTickCountdowns();
}
function cadTickCountdowns(){
 document.querySelectorAll('[data-cad-deadline]').forEach(el=>{
  const left=Number(el.dataset.cadDeadline)-cadNow();
  el.textContent=cadMmSs(left);
  el.classList.toggle('cad-cd-warn',left<30000);
 });
}

/* ---------- khởi tạo: 5 điểm nghẽn mẫu "Đang xử lý" có sẵn phiếu lệnh thật ---------- */
/* wardNames() đọc gdUnitData ở dashboard-education.js (nạp SAU file này) — chưa nạp xong thì chờ lần gọi sau. */
function cadWardsReady(){try{return typeof wardNames==='function'&&wardNames().length>0;}catch(e){return false;}}
function cadEnsureInit(){
 if(CAD.inited||!cadWardsReady()) return CAD.inited;
 CAD.inited=true;
 cadLoadPrefs();
 /* Vụ việc mẫu đang xử lý: đơn vị chính + 1–2 đơn vị phối hợp (không phải vụ nào cũng đủ 4 lực lượng). */
 const now=cadNow(),pattern=[['onsite',22],['received',17],['confirmed',9]];
 (typeof GIS_EFORM_SEED!=='undefined'?GIS_EFORM_SEED:[]).filter(r=>r.demoLinked&&r.status!=='done').forEach((rec,ri)=>{
  const inc=cadIncOf(rec),nForces=ri%2?3:2;
  inc.forces.slice(0,nForces).forEach((f,k)=>{
   const top=cadCands(inc,k)[0]; if(!top) return;
   const [status,minsAgo]=pattern[k],steps={confirmed:2,received:3,onsite:4}[status];
   const t0=now-minsAgo*60000,at=[];for(let i=0;i<steps;i++)at.push(t0+i*90000);
   f.on=true;
   CAD.tickets.push({no:++CAD.seq,recId:rec.id,k,type:f.type,unitId:top.unit.id,unitName:top.unit.name,xaId:top.unit.xaId,kind:'normal',
    fromRecId:null,mode:'semi',status,at,deadline:t0+cadConfirmMs(inc.code),cmd:cadDefaultCmd(inc,top.unit),eta:top.eta,reason:'',failAt:null,photo:null,seed:true});
   CAD.log.push({ts:t0,recId:rec.id,text:`Phát phiếu lệnh #${CAD.seq} (trực ban duyệt) → ${cadIocName(top.unit.xaId)} · ${top.unit.name}`});
  });
  CAD.tickets.filter(t=>t.recId===rec.id).forEach(cadSimNext);
  rec.cadActive=true;
 });
 CAD.log.sort((a,b)=>b.ts-a.ts);
 setInterval(cadTick,1000);
 return true;
}

/* ---------- thao tác của trực ban IOC Thành phố ---------- */
function cadOpenPanel(recId){
 if(!cadEnsureInit()) return;
 if(!cadIsTpView()){if(cadIsXaView())cadOpenXaPanel();return;}
 CAD.open='tp';
 cadShowRoot();
 if(recId){const rec=cadRec(recId);if(rec)cadIncOf(rec);cadSelect(recId,true);if(CAD.inc[recId])CAD.tab=cadTabOf(CAD.inc[recId]);}
 cadRender();
}
function cadSelect(recId,silent){
 CAD.autoTimers.forEach(clearTimeout);CAD.autoTimers=[];
 if(CAD.sel!==recId){CAD.flash=null;CAD.expand=null;CAD.cmdEdit=false;CAD.addOpen=false;}
 CAD.sel=recId;CAD.reinf=null;
 const inc=CAD.inc[recId];
 if(inc){
  const st=cadIncStatus(inc);
  CAD.dtab=st==='open'?'forces':'tickets';
  if(st!=='done'){
   inc.forces.forEach((f,k)=>{if(f.on&&!cadActiveTicket(recId,k)&&!cadCands(inc,k).length)cadAlertNoCand(inc,k);});
   if(CAD.mode==='auto') cadAutoRun(recId);
  }
 }
 if(!silent) cadAfterChange();
}
function cadBack(){CAD.autoTimers.forEach(clearTimeout);CAD.autoTimers=[];CAD.sel=null;CAD.reinf=null;CAD.flash=null;cadRender();}
function cadSetTab(tab){CAD.tab=tab;cadRender();}
function cadSetKind(kind){CAD.kind=kind;cadRender();}
function cadSetQ(v){CAD.q=v;cadRender();}
function cadSetDtab(t){CAD.dtab=t;cadRender();}
function cadSetMode(mode){
 if(CAD.mode===mode) return;
 CAD.mode=mode;cadSavePrefs();
 cadLog(CAD.sel,'Đổi chế độ điều hành: '+CAD_MODES.find(m=>m[0]===mode)[1]);
 if(mode==='auto'&&CAD.sel&&CAD.inc[CAD.sel]&&cadIncStatus(CAD.inc[CAD.sel])!=='done') cadAutoRun(CAD.sel);
 cadAfterChange();
}
function cadSetSim(on){CAD.sim=!!on;cadSavePrefs();cadRender();}
/* Tự động: phát lần lượt (cách nhau 0,6 giây) cho các lực lượng ĐÃ TICK chưa giao, ứng viên đứng đầu. */
function cadAutoRun(recId){
 const inc=CAD.inc[recId];
 inc.forces.forEach((f,k)=>{
  if(!f.on||cadActiveTicket(recId,k)) return;
  CAD.autoTimers.push(setTimeout(()=>{
   if(CAD.mode!=='auto'||CAD.sel!==recId||!f.on||cadActiveTicket(recId,k)) return;
   const top=cadCands(inc,k)[0];
   if(top) cadDispatch(recId,k,{unitId:top.unit.id,mode:'auto',eta:top.eta}); else cadAlertNoCand(inc,k);
   cadAfterChange();
  },600*(CAD.autoTimers.length+1)));
 });
}
/* Mục 7.3: tick/bỏ tick lực lượng phối hợp. Đơn vị chính luôn tick; đã phát phiếu thì không bỏ được. */
function cadToggleForce(k,on){
 const inc=CAD.inc[CAD.sel];if(!inc||k===0||cadActiveTicket(inc.id,k))return;
 const f=inc.forces[k];f.on=!!on;
 if(!on){f.pick=0;f.reason='';f.alerted=false;if(CAD.expand===k)CAD.expand=null;}
 else{
  if(!cadCands(inc,k).length) cadAlertNoCand(inc,k);
  else if(CAD.mode==='auto') cadAutoRun(inc.id);
 }
 cadAfterChange();
}
function cadToggleExpand(k){CAD.expand=CAD.expand===k?null:k;cadRender();}
/* Mục 7.3: thêm lực lượng khác ngoài 4 lực lượng của nhóm (VD cháy cần thêm Cứu hộ, ngập cần thêm CSGT).
   Lực lượng thêm vào là đơn vị phối hợp bổ sung (extra), tick sẵn; chưa có phiếu nào thì bỏ ra được (ẩn, giữ
   nguyên vị trí trong mảng để chỉ số k của các phiếu khác không bị lệch). */
function cadVisibleKs(inc){return inc.forces.map((f,k)=>k).filter(k=>!inc.forces[k].hidden);}
function cadAddableTypes(inc){const shown=new Set(inc.forces.filter(f=>!f.hidden).map(f=>f.type));return Object.keys(CAD_FORCE_TYPES).filter(t=>!shown.has(t));}
function cadTypePreview(inc,type){return cadRankUnits(type,{incXaId:inc.xaId,lat:inc.lat,lng:inc.lng,code:inc.code,excluded:new Set(),busy:cadBusy,extraHist:id=>CAD.extraHist[id]})[0]||null;}
function cadToggleAdd(){CAD.addOpen=!CAD.addOpen;cadRender();}
function cadAddForce(type){
 const inc=CAD.inc[CAD.sel];if(!inc||!CAD_FORCE_TYPES[type])return;
 let k=inc.forces.findIndex(f=>f.type===type&&f.hidden);
 if(k>=0){Object.assign(inc.forces[k],{hidden:false,on:true,pick:0,reason:'',alerted:false});}
 else{inc.forces.push({type,on:true,extra:true,excluded:[],exclNotes:[],pick:0,reason:'',alerted:false});k=inc.forces.length-1;}
 CAD.addOpen=false;
 cadLog(inc.id,`Trực ban thêm lực lượng ${cadForceName(type)} (ngoài các lực lượng gợi ý của nhóm)`);
 if(!cadCands(inc,k).length) cadAlertNoCand(inc,k);
 else if(CAD.mode==='auto') cadAutoRun(inc.id);
 cadAfterChange();
}
function cadRemoveForce(k){
 const inc=CAD.inc[CAD.sel];if(!inc)return;const f=inc.forces[k];
 if(!f||!f.extra||CAD.tickets.some(t=>t.recId===inc.id&&t.k===k))return;
 Object.assign(f,{hidden:true,on:false,pick:0,reason:'',alerted:false});
 if(CAD.expand===k)CAD.expand=null;
 cadLog(inc.id,`Trực ban bỏ lực lượng bổ sung ${cadForceName(f.type)}`);
 cadAfterChange();
}
function cadPick(k,j){const inc=CAD.inc[CAD.sel];if(!inc)return;inc.forces[k].pick=j;if(j===0)inc.forces[k].reason='';cadRender();}
function cadSetReason(k,v){const inc=CAD.inc[CAD.sel];if(inc)inc.forces[k].reason=v;}
function cadSetCmd(v){const inc=CAD.inc[CAD.sel];if(inc)inc.cmd=v;}
function cadToggleCmd(){CAD.cmdEdit=!CAD.cmdEdit;cadRender();if(CAD.cmdEdit){const el=document.getElementById('cadCmd');if(el)el.focus();}}
/* Lấy đơn vị đã chọn của 1 lực lượng + kiểm tra lý do thay thế (bắt buộc ở Thủ công và Bán tự động). */
function cadChosen(inc,k){
 const top=cadTop3(inc,k),f=inc.forces[k],j=f.pick<top.length?f.pick:0,c=top[j];
 if(!c) return {err:'none'};
 if(j>0&&!f.reason.trim()) return {err:'reason',c};
 return {c,reason:j>0?f.reason.trim():''};
}
/* Lực lượng sẵn sàng phát: đã tick, chưa có phiếu đang chạy, còn ứng viên. */
function cadReadyKs(inc){return inc.forces.map((f,k)=>k).filter(k=>inc.forces[k].on&&!cadActiveTicket(inc.id,k)&&cadTop3(inc,k).length);}
function cadDispatchForces(ks){
 const inc=CAD.inc[CAD.sel]; if(!inc) return;
 if(typeof guardAction==='function'&&guardAction('điều phối CAD')) return;
 const bad=ks.find(k=>cadChosen(inc,k).err==='reason');
 if(bad!==undefined){CAD.expand=bad;cadFlash(`Nhập lý do khi thay đơn vị đề xuất của lực lượng ${cadForceName(inc.forces[bad].type)}.`,'err');cadRender();const el=document.getElementById('cadReason'+bad);if(el)el.focus();return;}
 let n=0;
 ks.forEach(k=>{
  if(cadActiveTicket(inc.id,k)) return;
  const ch=cadChosen(inc,k);
  if(ch.err==='none'){cadAlertNoCand(inc,k);return;}
  if(cadDispatch(inc.id,k,{unitId:ch.c.unit.id,mode:CAD.mode,reason:ch.reason,eta:ch.c.eta})){n++;inc.forces[k].pick=0;inc.forces[k].reason='';}
 });
 if(n) cadFlash(`Đã phát ${n} phiếu lệnh. Chờ IOC xã/phường xác nhận.`,'ok');
 CAD.expand=null;CAD.tab=cadTabOf(inc);
 if(!cadReadyKs(inc).length) CAD.dtab='tickets';
 cadAfterChange();
}
function cadDispatchOne(k){cadDispatchForces([k]);}
function cadDispatchAll(){const inc=CAD.inc[CAD.sel];if(inc)cadDispatchForces(inc.forces.map((f,k)=>k).filter(k=>inc.forces[k].on&&!cadActiveTicket(inc.id,k)));}
function cadCancel(){
 CAD.autoTimers.forEach(clearTimeout);CAD.autoTimers=[];
 if(CAD.sel){const inc=CAD.inc[CAD.sel];cadLog(CAD.sel,'Trực ban hủy thao tác điều phối'+(inc?` “${inc.title}”`:'')+' — phiếu đã phát giữ nguyên');}
 CAD.sel=null;CAD.reinf=null;cadAfterChange();
}

/* ---------- mục 9.2: điều động bớt lực lượng (không bao giờ tự phát) ---------- */
function cadReinfCands(inc,k){
 const type=inc.forces[k].type,ex=new Set(inc.forces[k].excluded);
 return CAD.tickets.filter(t=>t.type===type&&t.recId!==inc.id&&['received','onsite'].includes(t.status)&&!ex.has(t.unitId)&&CAD.inc[t.recId]&&cadIncStatus(CAD.inc[t.recId])==='doing')
  .map(t=>{const from=CAD.inc[t.recId];const km=cadKm([from.lat,from.lng],[inc.lat,inc.lng]);return {t,from,km,eta:cadEta(km)};})
  .sort((a,b)=>(b.t.status==='onsite'?1:0)-(a.t.status==='onsite'?1:0)||a.eta-b.eta);
}
function cadReinfCmd(inc,k,c){
 const lv=cadLevel(inc.reportCount),meta=cadMeta(inc.code);
 const present=inc.forces.map((f,i)=>cadActiveTicket(inc.id,i)).filter(t=>t&&['onsite','done'].includes(t.status)).map(t=>cadForceName(t.type));
 return `Đề nghị ${cadIocName(c.t.xaId)} chỉ đạo ${c.t.unitName} tách bớt lực lượng đang xử lý “${c.from.title}” sang hỗ trợ “${inc.title}” tại ${cadPlace(inc)}. Tình hình: ${meta.name}, mức độ ${lv.level.toLowerCase()}, ${inc.reportCount} phản ánh, lực lượng đã có mặt: ${present.length?present.join(', '):'chưa có'}. Hiện không còn ${cadForceName(inc.forces[k].type)} phù hợp ở gần. Báo cáo về IOC Thành phố.`;
}
function cadOpenReinf(k){
 const inc=CAD.inc[CAD.sel];if(!inc)return;
 const cands=cadReinfCands(inc,k),manual=CAD.mode==='manual';
 const pick=manual||!cands.length?null:cands[0].t.no;
 CAD.reinf={k,pick,cmd:pick?cadReinfCmd(inc,k,cands[0]):''};
 cadRender();
}
function cadReinfPick(no){
 const inc=CAD.inc[CAD.sel],r=CAD.reinf;if(!inc||!r)return;
 const c=cadReinfCands(inc,r.k).find(x=>x.t.no===Number(no));if(!c)return;
 r.pick=c.t.no;r.cmd=cadReinfCmd(inc,r.k,c);cadRender();
}
function cadReinfSetCmd(v){if(CAD.reinf)CAD.reinf.cmd=v;}
function cadReinfSend(){
 const inc=CAD.inc[CAD.sel],r=CAD.reinf;if(!inc||!r)return;
 if(typeof guardAction==='function'&&guardAction('điều phối CAD')) return;
 const c=cadReinfCands(inc,r.k).find(x=>x.t.no===r.pick);
 if(!c){cadFlash('Chọn đơn vị cần điều động trước.','err');cadRender();return;}
 if(!r.cmd.trim()){cadFlash('Nội dung lệnh điều động không được để trống.','err');cadRender();return;}
 const mode=CAD.mode==='manual'?'manual':'semi';
 const t=cadDispatch(inc.id,r.k,{unitId:c.t.unitId,mode,kind:'reinforce',fromRecId:c.t.recId,cmd:r.cmd.trim(),eta:c.eta});
 if(t){cadLog(c.t.recId,`${c.t.unitName} được điều động bớt lực lượng sang “${inc.title}” (phiếu #${t.no}); phiếu đang xử lý ở đây giữ nguyên`);cadFlash(`Đã phát lệnh điều động #${t.no}.`,'ok');}
 CAD.reinf=null;CAD.tab=cadTabOf(inc);CAD.dtab='tickets';cadAfterChange();
}
function cadCloseReinf(){CAD.reinf=null;cadRender();}

/* ---------- thao tác của IOC xã/phường (+ đơn vị) ---------- */
function cadOpenXaPanel(){if(!cadEnsureInit())return;CAD.open='xa';cadShowRoot();cadRender();}
function cadXaTickets(){return CAD.tickets.filter(t=>t.xaId===Number(currentXaId));}
function cadXaSetTab(tab){CAD.xaTab=tab;CAD.xaReject=null;cadRender();}
function cadXaConfirm(no){if(typeof guardAction==='function'&&guardAction('xác nhận phiếu lệnh'))return;cadConfirm(no);cadFlash(`Đã xác nhận phiếu #${no} và chỉ đạo đơn vị.`,'ok');cadAfterChange();}
function cadXaStartReject(no){CAD.xaReject={no:Number(no),reason:''};cadRender();const el=document.getElementById('cadRejectReason');if(el)el.focus();}
function cadXaSetReject(v){if(CAD.xaReject)CAD.xaReject.reason=v;}
function cadXaCancelReject(){CAD.xaReject=null;cadRender();}
function cadXaSendReject(){
 const r=CAD.xaReject;if(!r)return;
 if(!r.reason.trim()){cadFlash('Nhập lý do từ chối.','err');cadRender();const el=document.getElementById('cadRejectReason');if(el)el.focus();return;}
 if(cadReject(r.no,r.reason.trim()))cadFlash(`Đã từ chối phiếu #${r.no}. IOC Thành phố đã nhận thông báo.`,'ok');
 CAD.xaReject=null;cadAfterChange();
}
function cadXaReport(no){
 const t=cadFindTicket(no);if(!t)return;
 if(t.status==='onsite'&&!CAD.photoDraft[no]){cadFlash('Báo hoàn thành phải kèm ảnh hiện trường.','err');cadRender();return;}
 if(cadUnitReport(no,CAD.photoDraft[no]||null)){delete CAD.photoDraft[no];cadFlash(`Đã gửi báo cáo phiếu #${no} lên IOC Thành phố.`,'ok');}
 cadAfterChange();
}
/* Ảnh hiện trường: thu nhỏ còn cạnh dài 640px trước khi giữ trong phiên (tránh giữ ảnh gốc vài MB). */
function cadXaPhoto(no,input){
 const file=input.files&&input.files[0];if(!file)return;
 const rd=new FileReader();
 rd.onload=()=>{const img=new Image();img.onload=()=>{
  const s=Math.min(1,640/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  CAD.photoDraft[no]=c.toDataURL('image/jpeg',.8);CAD.flash=null;cadRender();
 };img.src=rd.result;};
 rd.readAsDataURL(file);
}
function cadViewPhoto(no){CAD.photoView=Number(no);cadRender();}
function cadClosePhoto(){CAD.photoView=null;cadRender();}

/* ============================== KHUNG + BẢN ĐỒ ============================== */
/* Khung CAD nằm trong lưới .gis-map-body của widget bản đồ, THAY CHỖ cột sidebar (ẩn tạm, không xóa); bản đồ
   bên trái thu hẹp lại nhưng vẫn hiện. Widget đang thu gọn thì mở ra; mở từ Notify thì cuộn tới widget GIS. */
function cadHost(){return document.querySelector('#gismap .gis-map-body');}
function cadShowRoot(){
 const host=cadHost();if(!host)return;
 let panel=document.getElementById('cadPanel');
 if(!panel){panel=document.createElement('aside');panel.id='cadPanel';panel.className='cad-panel';}
 if(!CAD.keyBound){CAD.keyBound=true;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&CAD.open){if(CAD.photoView!=null)cadClosePhoto();else cadClose();}});}
 if(panel.parentNode!==host)host.appendChild(panel);
 host.classList.add('cad-on');
 const body=host.closest('.widget-body');
 if(body&&body.classList.contains('hidden')){body.classList.remove('hidden');const b=document.querySelector('#gismap .widget-head button[onclick^="toggleWidgetBody"]');if(b)b.textContent='−';}
 setTimeout(()=>{if(GM.map)GM.map.invalidateSize();cadDrawMap(true);},60);
 const r=host.getBoundingClientRect();
 if(r.top<0||r.bottom>window.innerHeight)document.getElementById('gismap').scrollIntoView({behavior:'smooth',block:'start'});
}
function cadClose(){
 CAD.open=null;CAD.photoView=null;CAD.fitKey=null;
 const host=cadHost();if(host)host.classList.remove('cad-on');
 const panel=document.getElementById('cadPanel');if(panel)panel.remove();
 cadMapClear();
 const vp=document.getElementById('gisMapViewport');if(vp)vp.classList.remove('cad-dim');
 setTimeout(()=>{if(GM.map)GM.map.invalidateSize();},60);
}
function cadMapClear(){if(CAD.layer)CAD.layer.clearLayers();}
function cadMapLayer(){if(!GM.map||!window.L)return null;if(!CAD.layer)CAD.layer=L.layerGroup();if(!GM.map.hasLayer(CAD.layer))CAD.layer.addTo(GM.map);return CAD.layer;}
function cadIcon(cls,inner,label,labelCls){
 return L.divIcon({className:'cad-divicon',iconSize:[0,0],html:`<div class="cad-pin ${cls}">${inner||''}</div>${label?`<span class="cad-lbl ${labelCls||''}">${esc(label)}</span>`:''}`});
}
function cadEtaIcon(text,cls){return L.divIcon({className:'cad-divicon',iconSize:[0,0],html:`<span class="cad-eta ${cls||''}">${esc(text)}</span>`});}
function cadMid(a,b){return [(a[0]+b[0])/2,(a[1]+b[1])/2];}
/* Vẽ lớp CAD lên bản đồ theo màn đang mở. fit=true khi đổi điểm nghẽn/màn (bay tới vùng cần xem); cập nhật trạng
   thái (cấp dưới phản hồi) thì chỉ vẽ lại, không giật khung nhìn. */
function cadDrawMap(force){
 const lg=cadMapLayer();if(!lg)return;
 lg.clearLayers();
 const vp=document.getElementById('gisMapViewport');
 const pts=[];let key='';
 const incMarker=(inc,cls)=>{const p=[inc.lat,inc.lng];pts.push(p);L.marker(p,{icon:cadIcon('cad-pin-inc '+(cls||''),'',inc.title,'cad-lbl-inc'),zIndexOffset:2000,interactive:false}).addTo(lg);return p;};
 const unitLine=(from,to,cls,eta)=>{
  L.polyline([from,to],{color:cls==='ok'?'#4fd18b':cls==='fail'?'#ff6b74':'#ffd54b',weight:3,dashArray:cls==='ok'?null:'7 7',opacity:.95,interactive:false}).addTo(lg);
  if(eta)L.marker(cadMid(from,to),{icon:cadEtaIcon(eta,cls),interactive:false,zIndexOffset:1500}).addTo(lg);
 };
 if(CAD.open==='tp'&&CAD.sel&&CAD.inc[CAD.sel]){
  const inc=CAD.inc[CAD.sel],ip=[inc.lat,inc.lng];key='tp|'+inc.id+'|'+(CAD.reinf?'r':'d');
  if(CAD.reinf){
   const cands=cadReinfCands(inc,CAD.reinf.k);
   L.circle(ip,{radius:cadEtaMax(inc.code)/CAD_MIN_PER_KM/CAD_ROAD_FACTOR*1000,color:'#ff6b74',weight:1.5,dashArray:'8 7',fillColor:'#ff6b74',fillOpacity:.05,interactive:false}).addTo(lg);
   incMarker(inc,'alert');
   cands.forEach((c,i)=>{const p=[c.from.lat,c.from.lng];pts.push(p);const on=CAD.reinf.pick===c.t.no;
    L.marker(p,{icon:cadIcon(on?'cad-pin-gold':'cad-pin-alt',on?'✓':String(i+1),c.t.unitName,''),zIndexOffset:1800,interactive:false}).addTo(lg);
    unitLine(p,ip,on?'':'alt',c.eta+' phút');});
  }else{
   if(cadIncStatus(inc)!=='done'&&inc.forces.some((f,k)=>f.on&&!cadActiveTicket(inc.id,k)))
    L.circle(ip,{radius:cadEtaMax(inc.code)/CAD_MIN_PER_KM/CAD_ROAD_FACTOR*1000,color:'#ffd54b',weight:1.5,dashArray:'8 7',fillColor:'#ffd54b',fillOpacity:.04,interactive:false}).addTo(lg);
   incMarker(inc,cadIncStatus(inc));
   let n=0;
   inc.forces.forEach((f,k)=>{
    CAD.tickets.filter(t=>t.recId===inc.id&&t.k===k&&CAD_FAIL.includes(t.status)).forEach(t=>{const u=cadUnitById(t.unitId);if(!u)return;
     L.marker([u.lat,u.lng],{icon:cadIcon('cad-pin-fail','✕',t.unitName+' · '+(t.status==='rejected'?'từ chối':'quá hạn'),'cad-lbl-fail'),interactive:false}).addTo(lg);});
    const t=cadActiveTicket(inc.id,k);
    if(t){const u=cadUnitById(t.unitId);if(!u)return;const p=[u.lat,u.lng];pts.push(p);n++;
     const st=['onsite','done'].includes(t.status)?'ok':'';
     L.marker(p,{icon:cadIcon(st?'cad-pin-ok':'cad-pin-gold',st?'✓':String(n),t.unitName,''),zIndexOffset:1800,interactive:false}).addTo(lg);
     unitLine(p,ip,st,st?'':(t.eta?t.eta+' phút':''));return;}
    if(!f.on) return;
    const top=cadTop3(inc,k);if(!top.length)return;
    const j=f.pick<top.length?f.pick:0;n++;
    top.forEach((c,i)=>{const p=[c.unit.lat,c.unit.lng];
     if(i===j){pts.push(p);L.marker(p,{icon:cadIcon('cad-pin-gold',String(n),c.unit.name,''),zIndexOffset:1800,interactive:false}).addTo(lg);unitLine(p,ip,'',c.eta+' phút');}
     else if(CAD.expand===k){pts.push(p);L.marker(p,{icon:cadIcon('cad-pin-alt',String(i+1),c.unit.name,'cad-lbl-alt'),zIndexOffset:1600,interactive:false}).addTo(lg);}
    });
   });
  }
  if(vp)vp.classList.add('cad-dim');
 }else if(CAD.open==='xa'){
  const list=cadXaList();key='xa|'+CAD.xaTab+'|'+list.map(t=>t.no).join(',');
  list.forEach(t=>{const inc=CAD.inc[t.recId],u=cadUnitById(t.unitId);if(!inc||!u)return;const ip=incMarker(inc,cadIncStatus(inc));
   const p=[u.lat,u.lng];pts.push(p);const st=['onsite','done'].includes(t.status)?'ok':CAD_FAIL.includes(t.status)?'fail':'';
   L.marker(p,{icon:cadIcon(st==='ok'?'cad-pin-ok':st==='fail'?'cad-pin-fail':'cad-pin-gold',st==='ok'?'✓':st==='fail'?'✕':'#',t.unitName,''),zIndexOffset:1800,interactive:false}).addTo(lg);
   unitLine(p,ip,st,'');});
  if(vp)vp.classList.toggle('cad-dim',list.length>0);
 }else{
  if(vp)vp.classList.remove('cad-dim');key='list';
 }
 if((force||key!==CAD.fitKey)&&pts.length&&GM.map){
  CAD.fitKey=key;
  /* Chừa chỗ cho thanh công cụ GIS phủ trên đỉnh bản đồ và dải nút dưới đáy. */
  if(pts.length===1)GM.map.flyTo(pts[0],15,{duration:.6});
  else GM.map.flyToBounds(L.latLngBounds(pts),{paddingTopLeft:[50,100],paddingBottomRight:[150,70],maxZoom:16,duration:.6});
 }else if(key!==CAD.fitKey)CAD.fitKey=key;
}

/* ============================== GIAO DIỆN KHUNG ============================== */
/* Vẽ lại toàn khung nhưng giữ nguyên ô đang gõ (lý do, nội dung lệnh, tìm kiếm) + vị trí cuộn — vì vẽ lại xảy ra
   cả khi cấp dưới phản hồi giữa lúc trực ban đang nhập. */
function cadRender(){
 const panel=document.getElementById('cadPanel');if(!panel||!CAD.open)return;
 const act=document.activeElement,focusId=act&&panel.contains(act)?act.id:null,sel=focusId&&'selectionStart' in act?[act.selectionStart,act.selectionEnd]:null;
 const scrolls={};panel.querySelectorAll('[data-cad-scroll]').forEach(el=>scrolls[el.dataset.cadScroll]=el.scrollTop);
 panel.setAttribute('aria-label',CAD.open==='tp'?'Điều phối CAD':'Phiếu lệnh CAD');
 panel.innerHTML=(CAD.open==='tp'?(CAD.sel&&CAD.inc[CAD.sel]?(CAD.reinf?cadReinfHtml(CAD.inc[CAD.sel]):cadDetailHtml(CAD.inc[CAD.sel])):cadListHtml()):cadXaHtml())+cadPhotoViewHtml();
 panel.querySelectorAll('[data-cad-scroll]').forEach(el=>{if(scrolls[el.dataset.cadScroll]!=null)el.scrollTop=scrolls[el.dataset.cadScroll];});
 if(focusId){const el=document.getElementById(focusId);if(el){el.focus();if(sel&&el.setSelectionRange)try{el.setSelectionRange(sel[0],sel[1]);}catch(e){}}}
 cadTickCountdowns();
 cadDrawMap(false);
}
const CAD_SVG={
 x:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 back:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
 check:'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
 search:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>'
};
function cadFlashHtml(){
 const f=CAD.flash;if(!f||cadNow()-f.at>6000)return '';
 return `<div class="cad-flash cad-flash-${f.kind}" role="status">${esc(f.text)}</div>`;
}
function cadPhotoViewHtml(){
 if(CAD.photoView==null)return '';
 const t=cadFindTicket(CAD.photoView);if(!t||!t.photo)return '';
 return `<div class="cad-lightbox" onclick="cadClosePhoto()"><figure onclick="event.stopPropagation()"><img src="${t.photo}" alt="Ảnh hiện trường phiếu #${t.no}"><figcaption>Phiếu #${t.no} · ${esc(t.unitName)} · ${cadHm(t.at[4])}</figcaption><button class="cad-btn" onclick="cadClosePhoto()">Đóng</button></figure></div>`;
}
function cadPill(text,kind){return `<span class="cad-pill cad-pill-${kind}">${esc(text)}</span>`;}
function cadStatusPill(st){return cadPill(CAD_STATUS_LABEL[st],st);}
function cadTicketPill(t){
 const m={sent:['Chờ xác nhận','wait'],confirmed:['Đã xác nhận','doing'],received:['Đơn vị đã nhận lệnh','doing'],onsite:['Tại hiện trường','doing'],done:['Hoàn thành','done'],rejected:['Bị từ chối','fail'],expired:['Quá hạn xác nhận','fail']}[t.status];
 return cadPill(m[0],m[1]);
}
function cadCountdownHtml(t){return `<span class="cad-cd" data-cad-deadline="${t.deadline}">${cadMmSs(t.deadline-cadNow())}</span>`;}
function cadHead(left,title,sub){
 return `<header class="cad-ph">${left||''}<div class="cad-ph-t"><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div><button class="cad-ib" onclick="cadClose()" aria-label="Đóng điều phối, về bản đồ">${CAD_SVG.x}</button></header>`;
}

/* ---------- 1. danh sách điểm nghẽn (IOC Thành phố) ---------- */
function cadTpIncs(){
 const recs=(gisEformData||[]).filter(r=>r.status!=='done'||CAD.inc[r.id]);
 const incs=recs.map(cadIncOf);
 Object.values(CAD.inc).forEach(i=>{if(!incs.includes(i)&&i.closedAt)incs.push(i);});
 return incs;
}
function cadTabOf(inc){const st=cadIncStatus(inc);return st==='done'?'done':cadIncAlert(inc)?'alert':st;}
function cadListHtml(){
 const incs=cadTpIncs(),count={open:0,doing:0,alert:0,done:0};
 incs.forEach(i=>{count[cadTabOf(i)]++;});
 const tabs=[['open','Cần điều phối'],['doing','Đang xử lý'],['alert','Cảnh báo'],['done','Đã xử lý']];
 const q=CAD.q.trim().toLowerCase();
 const list=incs.filter(i=>cadTabOf(i)===CAD.tab)
  .filter(i=>CAD.kind==='all'||(CAD.kind==='emer')===cadIsEmergency(i.code))
  .filter(i=>!q||(i.title+' '+cadWardInfo(i.xaId).full+' '+cadMeta(i.code).name).toLowerCase().includes(q))
  .sort((a,b)=>(cadLevel(b.reportCount).urgent||cadIsEmergency(b.code)?1:0)-(cadLevel(a.reportCount).urgent||cadIsEmergency(a.code)?1:0)||b.received-a.received);
 const waiting=CAD.tickets.filter(t=>t.status==='sent').length;
 const kinds=[['all','Tất cả'],['emer','Sự cố khẩn cấp'],['normal','Điểm nghẽn']];
 return cadHead('','Điều phối CAD',waiting+' phiếu chờ xã/phường xác nhận')
 +`<div class="cad-pad">
  <label class="cad-search"><span class="cad-sr">Tìm điểm nghẽn</span>${CAD_SVG.search}<input id="cadSearch" value="${esc(CAD.q)}" oninput="cadSetQ(this.value)" placeholder="Tìm điểm nghẽn, xã/phường…" autocomplete="off"></label>
  <div class="cad-seg cad-seg4" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${CAD.tab===t[0]}" class="${t[0]==='alert'&&count.alert?'is-alert':''}" onclick="cadSetTab('${t[0]}')">${t[1]}<b>${count[t[0]]}</b></button>`).join('')}</div>
  <div class="cad-chips">${kinds.map(k=>`<button class="cad-chip${CAD.kind===k[0]?' on':''}" aria-pressed="${CAD.kind===k[0]}" onclick="cadSetKind('${k[0]}')">${k[1]}</button>`).join('')}</div>
 </div>
 ${cadFlashHtml()}
 <div class="cad-scroll cad-list" data-cad-scroll="q">${list.map(cadRowHtml).join('')||'<p class="cad-empty">Không có điểm nghẽn nào ở mục này.</p>'}</div>
 <footer class="cad-pf cad-pf-note"><label class="cad-switch" title="Hệ thống tự đóng vai IOC xã/phường và đơn vị để xem trọn luồng"><input type="checkbox" ${CAD.sim?'checked':''} onchange="cadSetSim(this.checked)"><span>Mô phỏng phản hồi cấp dưới</span></label></footer>`;
}
function cadRowHtml(inc){
 const meta=cadMeta(inc.code),lv=cadLevel(inc.reportCount),ks=cadOnKs(inc);
 const act=ks.filter(k=>cadActiveTicket(inc.id,k)).length,done=ks.filter(k=>{const t=cadActiveTicket(inc.id,k);return t&&t.status==='done';}).length;
 const pill=cadIsEmergency(inc.code)?cadPill('Sự cố khẩn cấp','urgent'):lv.urgent?cadPill('Ưu tiên','wait'):'';
 const side=act?`<small>${done}/${ks.length} hoàn thành</small>`:'';
 return `<button class="cad-row${CAD.sel===inc.id?' sel':''}" onclick="cadSelect('${cadQ(inc.id)}')" style="--g:${meta.color}">
  <span class="cad-ico">${gisInlineIconHtml(meta.code,20,meta.color)}</span>
  <span class="cad-row-t"><b>${esc(inc.title)}</b><small>${esc(meta.name)} · ${esc(cadWardInfo(inc.xaId).full)} · ${inc.reportCount} phản ánh</small></span>
  <span class="cad-row-s">${pill}${side}</span>
 </button>`;
}

/* ---------- 2–3. điều phối + theo dõi 1 điểm nghẽn ---------- */
function cadDetailHtml(inc){
 const meta=cadMeta(inc.code),lv=cadLevel(inc.reportCount),st=cadIncStatus(inc),ward=cadWardInfo(inc.xaId);
 const ks=cadOnKs(inc),done=ks.filter(k=>{const t=cadActiveTicket(inc.id,k);return t&&t.status==='done';}).length;
 const anyTicket=cadTicketsOf(inc.id).length;
 const nList=cadTpIncs().filter(i=>cadTabOf(i)===CAD.tab).length;
 let h=cadHead(`<button class="cad-back" onclick="cadBack()">${CAD_SVG.back}Danh sách (${nList})</button>`,'Điều phối CAD','');
 /* Khoá cuộn theo điểm nghẽn + tab: đổi tab/điểm nghẽn thì về đầu, vẽ lại do cấp dưới phản hồi thì giữ chỗ. */
 h+=`<div class="cad-scroll" data-cad-scroll="d|${cadQ(inc.id)}|${CAD.dtab}">`+cadFlashHtml()+`<section class="cad-card cad-inc">
  <div class="cad-inc-top"><span class="cad-kicker" style="color:${meta.color}">${esc(meta.name.toUpperCase())}${cadIsEmergency(inc.code)?' · SỰ CỐ KHẨN CẤP':''}</span>${cadStatusPill(st)}</div>
  <h3>${esc(inc.title)}</h3>
  <div class="cad-chips">
   <span class="cad-chip static">${esc(ward.full)}</span>
   <span class="cad-chip static ${lv.urgent?'warn':''}">${inc.reportCount} phản ánh · ${esc(lv.priority)}</span>
   <span class="cad-chip static">Hoàn thành ≤ ${lv.sla} phút</span>
   <span class="cad-chip static">Xã/phường xác nhận ≤ ${cadConfirmMs(inc.code)/60000} phút</span>
  </div>
  ${inc.loc?`<p class="cad-loc">${esc(inc.loc)}</p>`:''}
  ${anyTicket?`<div class="cad-prog"><div><i style="width:${ks.length?Math.round(done/ks.length*100):0}%"></i></div><span>${done}/${ks.length} đơn vị hoàn thành</span></div>`:''}
 </section>`;
 /* Widget bản đồ thấp → giải thích chế độ để ở chú thích khi rê chuột thay vì 1 dòng chữ chiếm chỗ. */
 if(st!=='done') h+=`<div class="cad-seg" role="group" aria-label="Chế độ điều hành">${CAD_MODES.map(m=>`<button aria-pressed="${CAD.mode===m[0]}" title="${esc(CAD_MODE_HINT[m[0]])}" onclick="cadSetMode('${m[0]}')">${m[1]}</button>`).join('')}</div>`;
 const tabs=[['forces','Lực lượng'],['tickets',`Phiếu lệnh (${anyTicket})`],['log','Nhật ký']];
 h+=`<div class="cad-utabs" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${CAD.dtab===t[0]}" onclick="cadSetDtab('${t[0]}')">${t[1]}</button>`).join('')}</div>`;
 if(CAD.dtab==='forces') h+=cadForcesHtml(inc,st);
 else if(CAD.dtab==='tickets'){const tks=cadTicketsOf(inc.id).slice().sort((a,b)=>(CAD_FAIL.includes(a.status)?1:0)-(CAD_FAIL.includes(b.status)?1:0)||(a.status==='sent'?0:1)-(b.status==='sent'?0:1)||b.no-a.no);
  h+=tks.map(cadTicketHtml).join('')||'<p class="cad-empty">Chưa phát phiếu lệnh nào.</p>';}
 else{const logs=CAD.log.filter(l=>l.recId===inc.id);h+=`<ol class="cad-log">${logs.map(l=>`<li><time>${cadHm(l.ts)}</time><span>${esc(l.text)}</span></li>`).join('')||'<li class="cad-empty">Chưa có thao tác.</li>'}</ol>`;}
 h+='</div>';
 const ready=cadReadyKs(inc);
 if(CAD.dtab==='forces'&&st!=='done'&&ready.length){
  const main=CAD.mode==='manual'?`Phát cả loạt ${ready.length} phiếu lệnh`:CAD.mode==='semi'?`Duyệt và phát ${ready.length} phiếu lệnh`:'';
  h+=`<footer class="cad-pf"><button class="cad-btn ghost" onclick="cadCancel()">Hủy</button>${main?`<button class="cad-btn grow" onclick="cadDispatchAll()">${main}</button>`:'<span class="cad-note grow">Hệ thống đang tự phát phiếu…</span>'}</footer>`;
 }
 return h;
}
function cadForcesHtml(inc,st){
 const on=cadOnKs(inc).length,vis=cadVisibleKs(inc);
 let h=`<div class="cad-sec"><h4>Lực lượng điều động</h4><span><b>${on}</b> / ${vis.length} lực lượng</span></div><div class="cad-forces">`;
 h+=vis.map(k=>cadForceHtml(inc,k,st)).join('');
 if(st!=='done'){
  h+=`<button class="cad-add" aria-expanded="${!!CAD.addOpen}" onclick="cadToggleAdd()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="${CAD.addOpen?'M5 12h14':'M12 5v14M5 12h14'}"/></svg>${CAD.addOpen?'Đóng danh sách lực lượng':'Thêm lực lượng khác'}</button>`;
  if(CAD.addOpen){
   const types=cadAddableTypes(inc);
   h+=`<div class="cad-addlist" role="list" aria-label="Lực lượng có thể thêm">${types.map(type=>{const p=cadTypePreview(inc,type);
    return `<button role="listitem" class="cad-addrow${p?'':' none'}" onclick="cadAddForce('${type}')"><b>${esc(cadForceName(type))}</b><small>${p?`Gần nhất: ${esc(p.unit.name)} · ${p.eta} phút`:`Không có đơn vị trong ${cadEtaMax(inc.code)} phút`}</small></button>`;}).join('')||'<p class="cad-empty">Đã có đủ mọi lực lượng.</p>'}</div>`;
  }
 }
 h+='</div>';
 if(st!=='done'&&CAD.mode==='semi'&&cadReadyKs(inc).length){
  h+=`<section class="cad-card cad-cmd"><div class="cad-cmd-h"><b>Lệnh soạn sẵn</b><button class="cad-btn ghost sm" onclick="cadToggleCmd()" aria-expanded="${CAD.cmdEdit}">${CAD.cmdEdit?'Xong':'Sửa'}</button></div>`
   +(CAD.cmdEdit?`<label class="cad-sr" for="cadCmd">Nội dung lệnh soạn sẵn</label><textarea id="cadCmd" class="cad-input" rows="3" oninput="cadSetCmd(this.value)">${esc(cadSemiText(inc))}</textarea><small class="cad-note">Mỗi phiếu gửi đi: “Đề nghị IOC [xã/phường] chỉ đạo [đơn vị]: …” kèm nội dung trên.</small>`:`<p>${esc(cadSemiText(inc))}</p>`)+`</section>`;
 }
 const ready=cadReadyKs(inc);
 if(st!=='done'&&ready.length){
  const by={};ready.forEach(k=>{const c=cadChosen(inc,k).c;if(c)(by[c.unit.xaId]=by[c.unit.xaId]||[]).push(cadForceName(inc.forces[k].type));});
  h+=`<section class="cad-sendto"><h4>Phiếu sẽ gửi tới</h4>${Object.entries(by).map(([x,fs])=>`<div><span>${esc(cadIocName(Number(x)))}</span><small>${fs.map(esc).join(' · ')}</small></div>`).join('')}</section>`;
 }
 return h;
}
function cadForceHtml(inc,k,st){
 const f=inc.forces[k],t=cadActiveTicket(inc.id,k),main=k===0,name=esc(cadForceName(f.type));
 const role=main?'ĐƠN VỊ CHÍNH · BẮT BUỘC':f.extra?'PHỐI HỢP · BỔ SUNG':'PHỐI HỢP';
 /* Lực lượng bổ sung chưa có phiếu nào (kể cả phiếu bị từ chối) thì cho bỏ ra. */
 const rm=f.extra&&!t&&st!=='done'&&!CAD.tickets.some(x=>x.recId===inc.id&&x.k===k)?`<button class="cad-btn ghost sm" onclick="cadRemoveForce(${k})" aria-label="Bỏ lực lượng ${name}">Bỏ</button>`:'';
 const box=main||t?`<span class="cad-tick on locked" aria-label="${main?'Bắt buộc':'Đã phát phiếu'}">${CAD_SVG.check}</span>`
  :`<label class="cad-tickw"><input type="checkbox" ${f.on?'checked':''} ${st==='done'?'disabled':''} onchange="cadToggleForce(${k},this.checked)" aria-label="Điều động ${name}"></label>`;
 const ex=f.exclNotes.length?`<details class="cad-excl"><summary>Đã loại ${f.exclNotes.length} đơn vị</summary>${f.exclNotes.map(e=>`<div>${esc(e.unit)} — ${esc(e.why)}</div>`).join('')}</details>`:'';
 const headTxt=`<div class="cad-f-h"><b>${name}</b><small>${role}</small></div>`;
 if(t){
  return `<div class="cad-force on"><div class="cad-f-row">${box}<div class="cad-f-main">${headTxt}
   <div class="cad-f-unit">${esc(t.unitName)}</div><small class="cad-f-meta">${esc(cadIocName(t.xaId))}${t.kind==='reinforce'?' · điều động bớt lực lượng':''}</small>
   ${cadStepsMiniHtml(t)}${t.status==='sent'?`<small class="cad-wait">Chờ xác nhận, còn ${cadCountdownHtml(t)}</small>`:''}</div>${cadTicketPill(t)}</div>${ex}</div>`;
 }
 if(!f.on){
  const top=cadTop3(inc,k)[0];
  return `<div class="cad-force off"><div class="cad-f-row">${box}<div class="cad-f-main">${headTxt}<small class="cad-f-meta">Không điều động lần này${top?` · gợi ý: ${esc(top.unit.name)}, ${top.eta} phút`:''}</small></div>${rm?`<div class="cad-f-act">${rm}</div>`:''}</div></div>`;
 }
 const top=cadTop3(inc,k);
 if(!top.length){
  return `<div class="cad-force alert"><div class="cad-f-row">${box}<div class="cad-f-main">${headTxt}<small class="cad-f-meta">Hết ứng viên phù hợp trong ${cadEtaMax(inc.code)} phút di chuyển</small></div>${rm?`<div class="cad-f-act">${rm}</div>`:''}</div>
   <button class="cad-btn warn sm" onclick="cadOpenReinf(${k})">Điều động bớt lực lượng</button>${ex}</div>`;
 }
 const j=f.pick<top.length?f.pick:0,c=top[j],open=CAD.expand===k,num=cadForceNumber(inc,k);
 let h=`<div class="cad-force on${open?' open':''}"><div class="cad-f-row">${box}<div class="cad-f-main">${headTxt}
  <div class="cad-f-unit"><span class="cad-num">${num}</span>${esc(c.unit.name)}</div>
  <small class="cad-f-meta">${cadKmTxt(c.km)} · ${c.eta} phút · ${c.sameWard?'đúng địa bàn':'ngoài địa bàn'} · ${c.busyN?'đang bận':'đang rảnh'} · ${c.score} điểm</small></div>
  <div class="cad-f-act">${rm}${CAD.mode!=='auto'?`<button class="cad-btn ghost sm" aria-expanded="${open}" onclick="cadToggleExpand(${k})">${open?'Thu gọn':'Đổi'}</button>`:''}${CAD.mode==='manual'?`<button class="cad-btn sm" onclick="cadDispatchOne(${k})">Phát</button>`:''}</div></div>`;
 if(open){
  h+=`<fieldset class="cad-cands"><legend>Chọn 1 trong ${top.length} đơn vị phù hợp nhất</legend>${top.map((x,i)=>`<label class="cad-cand${i===j?' on':''}"><input type="radio" name="cadPick${k}" ${i===j?'checked':''} onchange="cadPick(${k},${i})"><span><span class="cad-cand-n">${esc(x.unit.name)}</span>${i===0?' '+cadPill('Đề xuất','sel'):''}<small>${cadKmTxt(x.km)} · ${x.eta} phút · ${x.sameWard?'đúng địa bàn':'ngoài địa bàn'} · ${x.busyN?'đang bận ('+x.busyN+' phiếu)':'đang rảnh'} · đúng hạn ${Math.round(x.reliability*100)}%</small></span><b class="cad-score">${x.score}</b></label>`).join('')}`
   +(j>0?`<label class="cad-reason-l" for="cadReason${k}">Lý do thay đơn vị đề xuất (bắt buộc)</label><input id="cadReason${k}" class="cad-input" value="${esc(f.reason)}" oninput="cadSetReason(${k},this.value)" placeholder="Ví dụ: đơn vị đề xuất đang xử lý vụ khác">`:'')+`</fieldset>`;
 }else if(j>0&&!f.reason.trim()){
  h+=`<small class="cad-warnline">Đã chọn đơn vị thay thế — bấm “Đổi” để nhập lý do.</small>`;
 }
 return h+ex+'</div>';
}
/* Số thứ tự đơn vị sẽ điều động — khớp số trên chấm vàng ở bản đồ. */
function cadForceNumber(inc,k){let n=0;for(let i=0;i<=k;i++){const f=inc.forces[i];if(cadActiveTicket(inc.id,i)||(f.on&&cadTop3(inc,i).length))n++;}return n;}
function cadStepsMiniHtml(t){
 const step=cadStep(t),fail=CAD_FAIL.includes(t.status);
 const bars=CAD_STEPS.map((s,i)=>`<i class="${i<step?'d':(!fail&&i===step)?'c':''}"></i>`).join('');
 const i=Math.min(step,CAD_STEPS.length)-1,name=i===1?cadIocName(t.xaId)+' tiếp nhận':CAD_STEPS[i];
 return `<div class="cad-mini"><div>${bars}</div><small>Bước ${step}/5 · ${esc(name)} · ${cadHm(t.at[i])}</small></div>`;
}
function cadTicketHtml(t){
 const fail=CAD_FAIL.includes(t.status);
 const extra=t.status==='sent'?`<div class="cad-tk-wait"><span>${esc(cadIocName(t.xaId))} chưa phản hồi</span><b>còn ${cadCountdownHtml(t)}</b></div>`
  :t.status==='rejected'?`<p class="cad-failnote">${esc(cadIocName(t.xaId))} từ chối lúc ${cadHm(t.failAt)} — “${esc(t.reason)}”</p>`
  :t.status==='expired'?`<p class="cad-failnote">Quá hạn xác nhận lúc ${cadHm(t.failAt)}</p>`:'';
 const photo=t.photo?`<div class="cad-tk-photo"><button class="cad-thumb" onclick="cadViewPhoto(${t.no})" aria-label="Xem ảnh hiện trường phiếu ${t.no}"><img src="${t.photo}" alt=""></button><small>Hoàn thành lúc ${cadHm(t.at[4])} · có ảnh hiện trường</small></div>`:'';
 const from=t.kind==='reinforce'&&CAD.inc[t.fromRecId]?` · điều động bớt lực lượng từ “${esc(CAD.inc[t.fromRecId].title)}”`:'';
 return `<article class="cad-tk${fail?' failed':''}${t.status==='sent'?' waiting':''}">
  <header><b>#${t.no} · ${esc(t.unitName)}</b>${cadTicketPill(t)}</header>
  <small class="cad-f-meta">${cadRoleLabel(t.k)} ${esc(cadForceName(t.type))} · ${esc(cadIocName(t.xaId))} · ${t.mode==='manual'?'Thủ công':t.mode==='semi'?'Bán tự động':'Tự động'}${from}</small>
  ${fail?'':cadStepsMiniHtml(t)}${extra}${photo}
  <details class="cad-cmdd"><summary>Nội dung lệnh</summary><p>${esc(t.cmd)}</p></details>
 </article>`;
}

/* ---------- 4. điều động bớt lực lượng ---------- */
function cadReinfHtml(inc){
 const r=CAD.reinf,f=inc.forces[r.k],cands=cadReinfCands(inc,r.k),fname=esc(cadForceName(f.type));
 const note=CAD.mode==='manual'?'Trực ban tự chọn đơn vị và soạn lệnh.':'Hệ thống gợi ý đơn vị sắp xử lý xong, gần nhất. Lệnh này <b>không tự phát</b> kể cả ở chế độ Tự động.';
 let h=cadHead(`<button class="cad-back" onclick="cadCloseReinf()">${CAD_SVG.back}Về điều phối</button>`,'Điều động bớt lực lượng','');
 h+=`<div class="cad-scroll" data-cad-scroll="r">${cadFlashHtml()}
  <section class="cad-alert" role="alert"><b>Hết ứng viên ${fname} phù hợp</b><p>“${esc(inc.title)}” (${esc(cadWardInfo(inc.xaId).full)}, ${inc.reportCount} phản ánh) — không còn đơn vị nào chưa bị loại trong ${cadEtaMax(inc.code)} phút di chuyển. Kiểm tra đơn vị đang xử lý điểm nghẽn khác để tách bớt lực lượng.</p></section>
  <p class="cad-hint">${note}</p>`;
 if(cands.length){
  h+=`<fieldset class="cad-cands"><legend>Đơn vị đang xử lý điểm nghẽn khác</legend>${cands.map((c,i)=>`<label class="cad-cand${r.pick===c.t.no?' on':''}"><input type="radio" name="cadReinf" ${r.pick===c.t.no?'checked':''} onchange="cadReinfPick(${c.t.no})"><span><span class="cad-cand-n">${esc(c.t.unitName)}</span>${i===0&&CAD.mode!=='manual'?' '+cadPill('Gợi ý','sel'):''}<small>${c.t.status==='onsite'?'Đang ở hiện trường':'Đang tới'} “${esc(c.from.title)}”${c.t.status==='onsite'?' từ '+cadHm(c.t.at[3]):''} · bước ${cadStep(c.t)}/5</small></span><b class="cad-eta-b">${c.eta} phút</b></label>`).join('')}</fieldset>
  <label class="cad-reason-l" for="cadReinfCmd">Nội dung lệnh điều động (sửa được)</label>
  <textarea id="cadReinfCmd" class="cad-input" rows="6" oninput="cadReinfSetCmd(this.value)" placeholder="Chọn đơn vị để hệ thống soạn sẵn nội dung">${esc(r.cmd)}</textarea>
  <small class="cad-note">Phiếu đi theo tuyến thường, có xác nhận trong thời hạn như phiếu khác. Phiếu đơn vị đang xử lý ở điểm nghẽn cũ giữ nguyên.</small>`;
 }else h+=`<p class="cad-empty">Hiện không có đơn vị ${fname} nào đang xử lý điểm nghẽn khác để điều động.</p>`;
 h+='</div>';
 if(cands.length) h+=`<footer class="cad-pf"><button class="cad-btn ghost" onclick="cadCloseReinf()">Thôi</button><button class="cad-btn grow" onclick="cadReinfSend()" ${r.pick?'':'disabled'}>${CAD.mode==='manual'?'Phát lệnh điều động':'Duyệt và phát lệnh điều động'}</button></footer>`;
 return h;
}

/* ---------- 5. phiếu lệnh IOC xã/phường ---------- */
function cadXaGroups(){
 const all=cadXaTickets();
 return {wait:all.filter(t=>t.status==='sent'),doing:all.filter(t=>['confirmed','received','onsite'].includes(t.status)),closed:all.filter(t=>['done',...CAD_FAIL].includes(t.status))};
}
function cadXaList(){return cadXaGroups()[CAD.xaTab].slice().sort((a,b)=>CAD.xaTab==='wait'?a.deadline-b.deadline:b.no-a.no);}
function cadXaHtml(){
 const g=cadXaGroups(),tabs=[['wait','Chờ xác nhận'],['doing','Đang thực hiện'],['closed','Đã xong']];
 return cadHead('','Phiếu lệnh CAD',cadIocName(Number(currentXaId))+' · chỉ phiếu của đơn vị trên địa bàn')
 +`<div class="cad-pad"><div class="cad-seg cad-seg3" role="tablist">${tabs.map(t=>`<button role="tab" aria-selected="${CAD.xaTab===t[0]}" class="${t[0]==='wait'&&g.wait.length?'is-alert':''}" onclick="cadXaSetTab('${t[0]}')">${t[1]}<b>${g[t[0]].length}</b></button>`).join('')}</div></div>
 ${cadFlashHtml()}<div class="cad-scroll" data-cad-scroll="x">${cadXaList().map(cadXaCardHtml).join('')||'<p class="cad-empty">Không có phiếu lệnh nào ở mục này.</p>'}</div>`;
}
function cadXaCardHtml(t){
 const inc=CAD.inc[t.recId],meta=cadMeta(inc.code),lv=cadLevel(inc.reportCount);
 let act='';
 if(t.status==='sent'){
  act=CAD.xaReject&&CAD.xaReject.no===t.no
   ?`<div class="cad-rej"><label class="cad-reason-l" for="cadRejectReason">Lý do từ chối (bắt buộc)</label><textarea id="cadRejectReason" class="cad-input" rows="2" oninput="cadXaSetReject(this.value)">${esc(CAD.xaReject.reason)}</textarea><div class="cad-row2"><button class="cad-btn ghost" onclick="cadXaCancelReject()">Thôi</button><button class="cad-btn danger grow" onclick="cadXaSendReject()">Gửi từ chối</button></div></div>`
   :`<div class="cad-row2"><button class="cad-btn danger ghost" onclick="cadXaStartReject(${t.no})">Từ chối</button><button class="cad-btn grow" onclick="cadXaConfirm(${t.no})">Xác nhận và chỉ đạo đơn vị</button></div>`;
 }else if(['confirmed','received','onsite'].includes(t.status)){
  const label={confirmed:'Đơn vị đã nhận lệnh',received:'Đơn vị đã tới hiện trường',onsite:'Báo hoàn thành'}[t.status];
  const ph=CAD.photoDraft[t.no];
  const photo=t.status==='onsite'?`<div class="cad-row2 left"><label class="cad-file"><input type="file" accept="image/*" onchange="cadXaPhoto(${t.no},this)"><span>${ph?'Đổi ảnh':'Chọn ảnh hiện trường'}</span></label>${ph?`<img class="cad-photo-prev" src="${ph}" alt="Ảnh hiện trường sẽ gửi">`:'<small class="cad-note">Bắt buộc khi báo hoàn thành</small>'}</div>`:'';
  act=`<div class="cad-unitbox"><small class="cad-note">Báo cáo của đơn vị — tự động chuyển lên IOC Thành phố</small>${photo}<button class="cad-btn" onclick="cadXaReport(${t.no})" ${t.status==='onsite'&&!ph?'disabled':''}>${label}</button></div>`;
 }
 const photoDone=t.photo?`<div class="cad-tk-photo"><button class="cad-thumb" onclick="cadViewPhoto(${t.no})" aria-label="Xem ảnh hiện trường phiếu ${t.no}"><img src="${t.photo}" alt=""></button></div>`:'';
 const fail=t.status==='rejected'?`<p class="cad-failnote">Đã từ chối lúc ${cadHm(t.failAt)} — “${esc(t.reason)}”</p>`:t.status==='expired'?`<p class="cad-failnote">Quá hạn xác nhận lúc ${cadHm(t.failAt)} — IOC Thành phố đã chuyển sang đơn vị khác.</p>`:'';
 return `<article class="cad-tk cad-xa${t.status==='sent'?' waiting':''}">
  <div class="cad-xa-top"><span class="cad-kicker" style="color:${meta.color}">PHIẾU #${t.no} · ${esc(meta.name.toUpperCase())}</span>${t.status==='sent'?`<span class="cad-bigcd"><b data-cad-deadline="${t.deadline}" class="cad-cd">${cadMmSs(t.deadline-cadNow())}</b><small>còn để xác nhận</small></span>`:cadTicketPill(t)}</div>
  <h3>${esc(inc.title)}</h3>
  <small class="cad-f-meta">${[inc.loc,'địa bàn sự cố: '+cadWardInfo(inc.xaId).full,inc.reportCount+' phản ánh, ưu tiên '+lv.priority.toLowerCase()].filter(Boolean).map(esc).join(' · ')}</small>
  <dl class="cad-kv"><dt>Đơn vị nhận lệnh</dt><dd><b>${esc(t.unitName)}</b></dd><dt>Vai trò</dt><dd>${cadRoleLabel(t.k)} · ${esc(cadForceName(t.type))}${t.kind==='reinforce'?' · điều động bớt lực lượng':''}</dd><dt>Nội dung lệnh</dt><dd>${esc(t.cmd)}</dd></dl>
  ${t.status==='sent'||CAD_FAIL.includes(t.status)?'':cadStepsMiniHtml(t)}${fail}${photoDone}${act}
 </article>`;
}

/* ---------- khối "Điều phối CAD" trong sidebar bản đồ GIS (khi khung CAD đóng) ---------- */
function cadRenderSidebar(){
 const box=document.getElementById('gisCadBlock');if(!box)return;
 if(!GIS_CAD_ENABLED||!cadEnsureInit()||!(cadIsTpView()||cadIsXaView())){box.innerHTML='';box.hidden=true;return;}
 box.hidden=false;
 if(cadIsTpView()){
  const incs=cadTpIncs(),c={open:0,doing:0,alert:0};
  incs.forEach(i=>{const t=cadTabOf(i);if(c[t]!=null)c[t]++;});
  const wait=CAD.tickets.filter(t=>t.status==='sent').length;
  box.innerHTML=`<div class="gis-layer-head">ĐIỀU PHỐI CAD</div><div class="cad-side">
   <span><i style="background:#d8a50c"></i>Cần điều phối<b>${c.open}</b></span><span><i style="background:#2c7dd2"></i>Đang xử lý<b>${c.doing}</b></span>
   <span><i style="background:#49bcff"></i>Chờ xã/phường xác nhận<b>${wait}</b></span><span class="${c.alert?'alert':''}"><i style="background:#d33a44"></i>Cảnh báo<b>${c.alert}</b></span></div>
   <button class="gis-map-pill cad-side-btn" onclick="cadOpenPanel()"><i class="gdi">🚨</i><span>Mở điều phối CAD</span></button>`;
 }else{
  const g=cadXaGroups();
  box.innerHTML=`<div class="gis-layer-head">PHIẾU LỆNH CAD</div><div class="cad-side">
   <span class="${g.wait.length?'alert':''}"><i style="background:#d8a50c"></i>Chờ xác nhận<b>${g.wait.length}</b></span><span><i style="background:#2c7dd2"></i>Đang thực hiện<b>${g.doing.length}</b></span></div>
   <button class="gis-map-pill cad-side-btn" onclick="cadOpenXaPanel()"><i class="gdi">📋</i><span>Mở phiếu lệnh</span></button>`;
 }
}
/* Gọi từ gis.js mỗi khi dựng lại lớp marker (đổi phạm vi xem, tải lần đầu). */
function cadOnGisRefresh(){
 if(!GIS_CAD_ENABLED||!cadEnsureInit()) return;
 /* Đổi tài khoản khi khung đang mở → đóng khung của vai cũ. */
 if((CAD.open==='tp'&&!cadIsTpView())||(CAD.open==='xa'&&!cadIsXaView())) cadClose();
 (gisEformData||[]).forEach(r=>{const inc=CAD.inc[r.id];if(inc)r.cadActive=cadIncStatus(inc)==='doing';});
 cadRenderSidebar();
}
/* Popup marker: dòng trạng thái CAD + nút mở điều phối (chỉ trực ban IOC Thành phố thấy nút). */
function cadPopupStatusHtml(rec){
 const inc=CAD.inc[rec.id];if(!inc||!cadTicketsOf(rec.id).length)return '';
 const ks=cadOnKs(inc),n=ks.filter(k=>cadActiveTicket(rec.id,k)).length,done=ks.filter(k=>{const t=cadActiveTicket(rec.id,k);return t&&t.status==='done';}).length;
 return `<p style="color:#8ff0c1">Điều phối CAD: ${n}/${ks.length} đơn vị đã nhận lệnh · ${done}/${ks.length} đã hoàn thành</p>`;
}
function cadPopupActionHtml(rec){
 if(!GIS_CAD_ENABLED||!cadIsTpView()||rec.status==='done'||!cadEnsureInit())return '';
 return gisPopupActionBtn(`cadOpenPanel('${cadQ(rec.id)}')`,'🚨 Điều phối CAD','border:1px solid rgba(255,93,108,.6);background:rgba(120,16,28,.9);color:#ffd1d6');
}

cadOnGisRefresh();
