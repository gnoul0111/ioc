/* ============================== QUẢN TRỊ NGUỒN DỮ LIỆU — màn quản trị (sidebar "Quản trị nguồn dữ liệu") ==============================
 Theo ảnh mẫu anh gửi 22/10/2026. Dùng chung 6 nguồn với khối "Nguồn dữ liệu & cập nhật gần nhất" trên dashboard
 (js/core/data-sources.js — sourceDefs) nên tên, phương thức, tần suất, độ tin cậy hai nơi khớp nhau. Màn này giữ bản
 sao riêng để "Đồng bộ ngay"/lưu cấu hình chỉ đổi trong màn quản trị (trong phiên, chưa nối API). Số liệu mô phỏng.
 Tiền tố ods. */
const ODS_PAGE_SIZE=10;
/* Phân loại phục vụ bộ lọc: loại nguồn, kiểu kết nối, nhóm tần suất. */
const ODS_META={
 api:{type:'api',conn:'push'},
 excel:{type:'excel',conn:'file'},
 db:{type:'db',conn:'pull'},
 docs:{type:'docs',conn:'file'},
 alert:{type:'alert',conn:'push'},
 calendar:{type:'calendar',conn:'pull'}
};
const ODS_TYPE_OPTS=[['','Tất cả'],['api','API'],['excel','Tệp Excel'],['db','CSDL chuyên ngành'],['docs','Văn bản/PDF'],['alert','Cảnh báo hệ thống'],['calendar','Lịch công tác']];
const ODS_CONN_OPTS=[['','Tất cả'],['push','Tự động, tức thời'],['pull','Tự động, theo lịch'],['file','Nhập tệp']];
const ODS_FREQ_OPTS=[['','Tất cả'],['realtime','Realtime'],['schedule','Theo lịch'],['event','Khi phát sinh']];
const ODS_PERIOD_OPTS=[['1','Hôm nay'],['7','7 ngày qua'],['30','30 ngày qua']];
const ODS_QUAL_OPTS=[['','Tất cả'],['high','Từ 98%'],['mid','Từ 96% đến dưới 98%'],['low','Dưới 96%']];
const ODS_STATUS_OPTS=[['','Tất cả'],['ok','Hoạt động'],['late','Chậm cập nhật'],['stale','Quá hạn đồng bộ']];
const ODS_STATUS_LABEL={ok:'Hoạt động',late:'Chậm cập nhật',stale:'Quá hạn đồng bộ'};
/* Lựa chọn trong form cấu hình — phương thức kèm kiểu kết nối tương ứng để bộ lọc "Kết nối" theo đúng cấu hình mới. */
const ODS_MODES=[['API Gateway / Webhook','push'],['Rule engine','push'],['Adapter / ETL delta','pull'],['API lịch công tác','pull'],['Import Excel có kiểm tra schema','file'],['DMS / OCR chỉ mục','file']];
const ODS_FREQS=['Realtime / mỗi 1 phút','Realtime / mỗi 5 phút','Realtime / sự kiện','15 phút / theo lịch','30 phút / theo lịch','1 giờ / theo lịch','Khi phát sinh / cuối ngày','Ngày / khi phát hành'];
const ODS_IC={
 search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 down:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>',
 check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="m5 12 5 5 9-10"/></svg>',
 sync:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/></svg>',
 left:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg>',
 right:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>'
};

const ODS={inited:false,rows:[],q:'',type:'',conn:'',freq:'',period:'1',qual:'',status:'',dd:null,page:1,checkedAt:0,syncing:false,cur:null};

/* ---------- Tiện ích ---------- */
function odsPad(n){return String(n).padStart(2,'0');}
function odsEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function odsNum(n){return Number(n||0).toLocaleString('vi-VN');}
function odsNorm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d');}
function odsDt(ts){const d=new Date(ts);return `${odsPad(d.getHours())}:${odsPad(d.getMinutes())} ${odsPad(d.getDate())}/${odsPad(d.getMonth()+1)}/${d.getFullYear()}`;}
function odsDtFull(ts){const d=new Date(ts);return `${odsPad(d.getDate())}/${odsPad(d.getMonth()+1)}/${d.getFullYear()} ${odsPad(d.getHours())}:${odsPad(d.getMinutes())}:${odsPad(d.getSeconds())}`;}
function odsRel(ts){
 const s=Math.max(0,Math.floor((Date.now()-ts)/1000));
 if(s<60) return `${s} giây trước`;
 const m=Math.floor(s/60); if(m<60) return `${m} phút trước`;
 const h=Math.floor(m/60), mm=m%60; if(h<24) return `${h} giờ${mm?` ${mm} phút`:''} trước`;
 const d=Math.floor(h/24), hh=h%24; return `${d} ngày${hh?` ${hh} giờ`:''} trước`;
}
function odsQualNum(q){return parseFloat(String(q).replace(',','.'))||0;}
function odsQualTxt(n){return n.toFixed(1).replace('.',',')+'%';}
function odsQualClass(n){return n>=98?'good':n>=96?'mid':'low';}
function odsFreqGroup(f){return /^Realtime/i.test(f)?'realtime':/theo lịch/i.test(f)?'schedule':'event';}
function odsToast(msg){if(typeof ouaToast==='function') ouaToast(msg);}

/* ---------- Dữ liệu ---------- */
function odsBuildRows(){
 const boot=typeof bootTime!=='undefined'?bootTime:Date.now();
 ODS.rows=(typeof sourceDefs!=='undefined'?sourceDefs:[]).map(s=>({
  key:s.key,name:s.name,desc:s.desc,mode:s.mode,freq:s.freq,owner:s.owner,
  lastAt:boot-s.offset,rows:s.rows,synced:s.synced!=null?s.synced:s.rows,qual:odsQualNum(s.quality),status:s.status,
  type:(ODS_META[s.key]||{}).type||'',conn:(ODS_META[s.key]||{}).conn||''
 }));
}
function odsRow(key){return ODS.rows.find(r=>r.key===key);}
/* Khối lượng theo kỳ: hôm nay = số của nguồn; 7/30 ngày = cộng dồn các ngày (dao động nhẹ, cố định theo nguồn),
   phần còn thiếu chỉ là phần tồn của lần đồng bộ gần nhất (các ngày trước đã đồng bộ đủ). */
function odsVolume(r){
 const n=+ODS.period;
 if(n===1) return {total:r.rows,done:r.synced};
 let h=0; for(const c of r.key+n) h=(h*31+c.charCodeAt(0))%997;
 const total=Math.round(r.rows*n*(0.88+(h%17)/100));
 return {total,done:total-(r.rows-r.synced)};
}
function odsPct(v){if(!v.total) return 100;const p=Math.round(v.done/v.total*100);return v.done<v.total&&p===100?99:p;}
function odsPctClass(p){return p>=95?'good':p>=70?'mid':'low';}
function odsFiltered(){
 const q=odsNorm(ODS.q).trim();
 return ODS.rows.filter(r=>{
  if(ODS.type&&r.type!==ODS.type) return false;
  if(ODS.conn&&r.conn!==ODS.conn) return false;
  if(ODS.freq&&odsFreqGroup(r.freq)!==ODS.freq) return false;
  if(ODS.qual&&odsQualClass(r.qual)!==({high:'good',mid:'mid',low:'low'})[ODS.qual]) return false;
  if(ODS.status&&r.status!==ODS.status) return false;
  if(q&&!odsNorm(`${r.name} ${r.desc} ${r.owner}`).includes(q)) return false;
  return true;
 });
}

/* ---------- Mở trang ---------- */
function odsOpen(){
 const root=document.getElementById('odsRoot'); if(!root) return;
 if(!ODS.inited){
  odsBuildRows();
  ODS.checkedAt=Date.now();
  root.innerHTML=odsShellHtml();
  ODS.inited=true;
 }
 ODS.dd=null;
 odsRender();
}
function odsShellHtml(){
 return `<div class="head"><div><h2>Nguồn dữ liệu &amp; cập nhật gần nhất</h2><p>Theo dõi kết nối, lịch đồng bộ và độ tin cậy của các nguồn cấp số liệu cho IOC. Cấu hình phương thức, tần suất và đồng bộ lại khi nguồn chậm hoặc lỗi.</p></div>
 <div class="actions ods-head-actions"><button type="button" class="btn" id="odsSyncBtn" onclick="odsSyncAll()">Đồng bộ ngay</button></div></div>
 <div class="ods-strip" id="odsStrip"></div>
 <div class="ods-toolbar">
  <label class="ods-search">${ODS_IC.search}<input id="odsSearch" placeholder="Tìm tên nguồn dữ liệu..." oninput="odsOnSearch(this.value)" autocomplete="off"></label>
  <div class="ods-dd-wrap" id="odsDd-type"></div>
  <div class="ods-dd-wrap" id="odsDd-conn"></div>
  <div class="ods-dd-wrap" id="odsDd-freq"></div>
  <div class="ods-dd-wrap" id="odsDd-period"></div>
  <div class="ods-dd-wrap" id="odsDd-qual"></div>
  <div class="ods-dd-wrap" id="odsDd-status"></div>
 </div>
 <div class="ods-table-wrap"><table class="ods-table"><colgroup><col style="width:23%"><col style="width:13%"><col style="width:12%"><col style="width:12%"><col style="width:18%"><col style="width:8%"><col style="width:14%"></colgroup>
 <thead><tr><th>Nguồn dữ liệu</th><th>Phương thức kết nối</th><th>Tần suất cập nhật</th><th>Cập nhật gần nhất</th><th>Khối lượng đồng bộ</th><th>Độ tin cậy</th><th>Trạng thái</th></tr></thead><tbody id="odsTbody"></tbody></table></div>
 <div class="ods-foot" id="odsFoot"></div>`;
}

/* ---------- Bộ lọc ---------- */
const ODS_DDS=[
 {name:'type',label:'Loại nguồn',opts:ODS_TYPE_OPTS},
 {name:'conn',label:'Kết nối',opts:ODS_CONN_OPTS},
 {name:'freq',label:'Tần suất',opts:ODS_FREQ_OPTS},
 {name:'period',label:'',opts:ODS_PERIOD_OPTS},
 {name:'qual',label:'Độ tin cậy',opts:ODS_QUAL_OPTS},
 {name:'status',label:'Trạng thái',opts:ODS_STATUS_OPTS}
];
let odsSearchTimer=null;
function odsOnSearch(v){clearTimeout(odsSearchTimer);odsSearchTimer=setTimeout(()=>{ODS.q=v;ODS.page=1;odsRenderTable();},150);}
function odsToggleDd(name){ODS.dd=ODS.dd===name?null:name;odsRenderToolbar();}
function odsSetFilter(name,v){ODS[name]=v;ODS.dd=null;ODS.page=1;odsRender();}
function odsDdHtml(d){
 const cur=ODS[d.name], sel=d.opts.find(o=>o[0]===cur)||d.opts[0], open=ODS.dd===d.name;
 return `<button type="button" class="ods-dd-btn ${d.label?'':'plain'}" aria-haspopup="listbox" aria-expanded="${open}" onclick="odsToggleDd('${d.name}')">${d.label?`<span>${d.label}</span>`:''}<b>${sel[1]}</b>${ODS_IC.down}</button>
 ${open?`<div class="ods-dd-panel" role="listbox">${d.opts.map(([k,l])=>`<button type="button" role="option" aria-selected="${cur===k}" class="ods-opt ${cur===k?'active':''}" onclick="odsSetFilter('${d.name}','${k}')"><span>${l}</span>${cur===k?ODS_IC.check:''}</button>`).join('')}</div>`:''}`;
}

/* ---------- Vẽ ---------- */
function odsRender(){
 if(!ODS.inited) return;
 odsRenderStrip();
 odsRenderToolbar();
 odsRenderTable();
}
function odsRenderStrip(){
 const el=document.getElementById('odsStrip'); if(!el) return;
 const c={ok:0,late:0,stale:0}; ODS.rows.forEach(r=>{c[r.status]=(c[r.status]||0)+1;});
 const parts=[`${ODS.rows.length} nguồn`];
 if(c.ok) parts.push(`${c.ok} hoạt động`);
 if(c.late) parts.push(`${c.late} chậm cập nhật`);
 if(c.stale) parts.push(`${c.stale} quá hạn đồng bộ`);
 el.innerHTML=`<i>${ODS_IC.sync}</i><span>Cập nhật gần nhất: <b>${odsDtFull(ODS.checkedAt)}</b></span><span class="sep"></span><span>Tình trạng: <b>${parts.join(' · ')}</b></span>`;
}
function odsRenderToolbar(){
 ODS_DDS.forEach(d=>{
  const box=document.getElementById('odsDd-'+d.name); if(!box) return;
  box.classList.toggle('open',ODS.dd===d.name);
  box.innerHTML=odsDdHtml(d);
 });
}
function odsRowHtml(r){
 const v=odsVolume(r), p=odsPct(v), pc=odsPctClass(p), st=r.status;
 return `<tr tabindex="0" onclick="odsOpenDetail('${r.key}')" onkeydown="if(event.key==='Enter'){odsOpenDetail('${r.key}')}">
 <td><div class="ods-src"><b>${odsEsc(r.name)}</b><small title="${odsEsc(r.desc)}">${odsEsc(r.desc)}</small></div></td>
 <td class="ods-text">${odsEsc(r.mode)}</td>
 <td class="ods-text">${odsEsc(r.freq)}</td>
 <td class="ods-last"><b>${odsDt(r.lastAt)}</b><small class="${st}">${odsRel(r.lastAt)}</small></td>
 <td><div class="ods-vol"><div class="ods-vol-top"><b>${odsNum(v.total)} dòng</b><span class="${pc}">${p}%</span></div><div class="ods-bar"><i class="${pc}" style="width:${p}%"></i></div><small>Đã đồng bộ ${odsNum(v.done)} / ${odsNum(v.total)} dòng</small></div></td>
 <td class="ods-q ${odsQualClass(r.qual)}">${odsQualTxt(r.qual)}</td>
 <td><span class="ods-chip ${st}">${ODS_STATUS_LABEL[st]||st}</span></td></tr>`;
}
function odsRenderTable(){
 const tbody=document.getElementById('odsTbody'), foot=document.getElementById('odsFoot'); if(!tbody||!foot) return;
 const list=odsFiltered(), pages=Math.max(1,Math.ceil(list.length/ODS_PAGE_SIZE));
 if(ODS.page>pages) ODS.page=pages;
 tbody.innerHTML=list.length?list.slice((ODS.page-1)*ODS_PAGE_SIZE,ODS.page*ODS_PAGE_SIZE).map(odsRowHtml).join('')
  :`<tr class="ods-empty-row"><td colspan="7"><div class="ods-empty">Không có nguồn dữ liệu phù hợp với bộ lọc.</div></td></tr>`;
 const pg=[];
 for(let i=1;i<=pages;i++) pg.push(`<button type="button" class="${i===ODS.page?'active':''}" onclick="odsGoPage(${i})">${i}</button>`);
 foot.innerHTML=`<span>Hiển thị ${odsNum(list.length)} / ${odsNum(ODS.rows.length)} nguồn dữ liệu · Bấm vào một dòng để xem chi tiết, cấu hình hoặc đồng bộ lại</span>
 <nav class="ods-pager" aria-label="Phân trang"><button type="button" ${ODS.page<=1?'disabled':''} onclick="odsGoPage(${ODS.page-1})" aria-label="Trang trước">${ODS_IC.left}</button>${pg.join('')}<button type="button" ${ODS.page>=pages?'disabled':''} onclick="odsGoPage(${ODS.page+1})" aria-label="Trang sau">${ODS_IC.right}</button></nav>`;
}
function odsGoPage(p){ODS.page=p;odsRenderTable();}

/* ---------- Đồng bộ (mô phỏng) ---------- */
function odsMarkSynced(r,at){r.lastAt=at;r.synced=r.rows;r.status='ok';}
function odsSyncAll(){
 if(ODS.syncing) return;
 ODS.syncing=true;
 const btn=document.getElementById('odsSyncBtn');
 if(btn){btn.disabled=true;btn.textContent='Đang đồng bộ…';}
 setTimeout(()=>{
  const now=Date.now();
  ODS.rows.forEach((r,i)=>odsMarkSynced(r,now-i*1000));
  ODS.checkedAt=now; ODS.syncing=false;
  if(btn){btn.disabled=false;btn.textContent='Đồng bộ ngay';}
  odsRender();
  odsToast(`Đã đồng bộ lại ${ODS.rows.length} nguồn dữ liệu.`);
 },1200);
}
function odsSyncOne(key){
 const r=odsRow(key); if(!r) return;
 const btn=document.getElementById('odsSyncOneBtn');
 if(btn){btn.disabled=true;btn.textContent='Đang đồng bộ…';}
 setTimeout(()=>{
  odsMarkSynced(r,Date.now()); ODS.checkedAt=Date.now();
  odsRender();
  if(ODS.cur===key&&document.getElementById('ouaModalRoot')?.classList.contains('show')) odsFillDetail(r);
  odsToast(`Đã đồng bộ lại nguồn ${r.name}.`);
 },900);
}

/* ---------- Chi tiết / cấu hình nguồn (dùng modal chung của màn quản trị) ---------- */
function odsJobs(r){
 const step={api:4,alert:9,db:15,calendar:30,excel:47,docs:300}[r.key]||60;
 return [0,1,2,3,4].map(i=>({
  at:r.lastAt-i*step*60000,
  type:i===0?'Đồng bộ gần nhất':i===1?'Đối soát dữ liệu':'Đồng bộ định kỳ',
  rows:i===0?r.synced:Math.max(1,Math.round(r.rows/(i+3))),
  warn:i===0&&r.status!=='ok'
 }));
}
function odsOpenDetail(key){
 const r=odsRow(key); if(!r) return;
 ODS.cur=key; ODS.dd=null; odsRenderToolbar();
 if(typeof ouaOpenModal==='function') ouaOpenModal('odsDetail');
 document.getElementById('ouaModalTitle').textContent='Nguồn dữ liệu · '+r.name;
 const ok=document.querySelector('#ouaModalRoot .modal-footer .btn.primary'); if(ok) ok.textContent='Lưu cấu hình';
 odsFillDetail(r);
}
function odsFillDetail(r){
 const body=document.getElementById('ouaModalBody'); if(!body) return;
 const p=odsPct({total:r.rows,done:r.synced});
 const modeOpts=ODS_MODES.map(([m])=>m).includes(r.mode)?ODS_MODES.map(([m])=>m):[r.mode,...ODS_MODES.map(([m])=>m)];
 const freqOpts=ODS_FREQS.includes(r.freq)?ODS_FREQS:[r.freq,...ODS_FREQS];
 const opt=(list,cur)=>list.map(x=>`<option ${x===cur?'selected':''}>${odsEsc(x)}</option>`).join('');
 const missing=r.rows-r.synced;
 body.innerHTML=`<div class="ods-d">
 <p class="ods-d-desc">${odsEsc(r.desc)}</p>
 <div class="ods-d-kpis">
  <div><span>Cập nhật gần nhất</span><b>${odsDt(r.lastAt)}</b><small class="${r.status}">${odsRel(r.lastAt)}</small></div>
  <div><span>Khối lượng hôm nay</span><b>${odsNum(r.rows)} dòng</b><small>Đã đồng bộ ${odsNum(r.synced)} (${p}%)</small></div>
  <div><span>Độ tin cậy</span><b class="ods-q ${odsQualClass(r.qual)}">${odsQualTxt(r.qual)}</b><small>${r.qual>=98?'Đạt yêu cầu':'Cần rà soát dữ liệu'}</small></div>
  <div><span>Trạng thái</span><b><span class="ods-chip ${r.status}">${ODS_STATUS_LABEL[r.status]}</span></b><small>${missing>0?`Còn ${odsNum(missing)} dòng chờ đồng bộ`:'Không có dòng tồn'}</small></div>
 </div>
 <div class="ods-d-grid">
  <div class="card"><h3>Cấu hình nguồn</h3><div class="ods-d-form">
   <div class="form-control"><label for="odsCfgMode">Phương thức kết nối</label><select id="odsCfgMode">${opt(modeOpts,r.mode)}</select></div>
   <div class="form-control"><label for="odsCfgFreq">Tần suất cập nhật</label><select id="odsCfgFreq">${opt(freqOpts,r.freq)}</select></div>
   <div class="form-control"><label for="odsCfgOwner">Đơn vị phụ trách</label><input id="odsCfgOwner" value="${odsEsc(r.owner)}"></div>
  </div>
  <div class="ods-d-actions"><button type="button" class="btn primary" id="odsSyncOneBtn" onclick="odsSyncOne('${r.key}')">Đồng bộ lại nguồn này</button></div></div>
  <div class="card"><h3>Nhật ký đồng bộ gần nhất</h3><div class="ods-jobs">${odsJobs(r).map(j=>`<div class="ods-job"><b>${odsDt(j.at)}</b><span><b>${j.type}</b><small>${odsNum(j.rows)} bản ghi · kiểm tra định dạng, mã đơn vị</small></span><span class="ods-chip ${j.warn?r.status:'ok'}">${j.warn?(r.status==='stale'?'Còn dòng tồn':'Chậm so với lịch'):'Thành công'}</span></div>`).join('')}</div></div>
 </div></div>`;
}
/* Nút "Lưu cấu hình" ở chân modal → ouaConfirmModal() (js/oua-data.js) chuyển về đây. */
function odsSaveConfig(){
 const r=odsRow(ODS.cur); if(!r){if(typeof ouaCloseModal==='function') ouaCloseModal();return;}
 const mode=document.getElementById('odsCfgMode')?.value||r.mode, freq=document.getElementById('odsCfgFreq')?.value||r.freq;
 const owner=(document.getElementById('odsCfgOwner')?.value||'').trim()||r.owner;
 const changed=mode!==r.mode||freq!==r.freq||owner!==r.owner;
 r.mode=mode; r.freq=freq; r.owner=owner;
 const m=ODS_MODES.find(x=>x[0]===mode); if(m) r.conn=m[1];
 if(typeof ouaCloseModal==='function') ouaCloseModal();
 odsRender();
 odsToast(changed?`Đã lưu cấu hình nguồn ${r.name}.`:'Cấu hình không thay đổi.');
}

/* ---------- Đóng ô chọn khi bấm ra ngoài / Esc; cập nhật "x phút trước" ---------- */
document.addEventListener('click',e=>{
 if(!ODS.inited||!ODS.dd||!document.contains(e.target)) return;
 if(!e.target.closest('.ods-dd-wrap')){ODS.dd=null;odsRenderToolbar();}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&ODS.inited&&ODS.dd){ODS.dd=null;odsRenderToolbar();}
});
setInterval(()=>{
 if(ODS.inited&&document.getElementById('source-admin')?.classList.contains('active')) odsRenderTable();
},30000);
