/* ============================== CẤU HÌNH CHỨC NĂNG IOC — màn quản trị (sidebar "Cấu hình chức năng IOC") ==============================
 Dựng bảng hoàn toàn từ khai báo trong js/core/ioc-cau-hinh.js (ICH_CHUC_NANG, ICH_THAM_SO): thêm tham số ở đó là màn
 này tự có dòng mới, không sửa ở đây. Sửa trên bản nháp; chỉ khi bấm «Lưu thay đổi» mới ghi (ichLuu). Tiền tố ichu. */

/* nhap: bản nháp đang sửa; goc: giá trị đã lưu lúc lấy bản nháp (so với nó để biết «có thay đổi chưa lưu»);
   chu: chữ đang gõ trong ô số (giữ nguyên cả khi gõ sai để người dùng sửa tiếp). */
const ICHU={cn:null,tab:null,nhap:null,goc:null,chu:{},inited:false};

function ichuEsc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function ichuCn(){return ICH_CHUC_NANG.find(c=>c.key===ICHU.cn)||ICH_CHUC_NANG[0];}
function ichuTab(){const cn=ichuCn();return cn.tabs.find(t=>t.key===ICHU.tab)||cn.tabs[0];}
function ichuIdsCuaTab(cn,tab){return ichThamSoCuaTab(cn,tab).map(t=>t.id);}
function ichuKhac(ids){return ids.some(id=>JSON.stringify(ICHU.nhap[id])!==JSON.stringify(ICHU.goc[id]));}
function ichuCoThayDoi(){return ichuKhac(ICH_THAM_SO.map(t=>t.id));}
function ichuLayLai(){ICHU.goc=ichSaoChep(ichDoc());ICHU.nhap=ichSaoChep(ICHU.goc);ICHU.chu={};}

function ichuOpen(){
 if(!ICHU.inited){
  ICHU.inited=true;
  ICHU.cn=ICH_CHUC_NANG[0].key; ICHU.tab=ICH_CHUC_NANG[0].tabs[0].key;
  ichuLayLai();
  /* Trang khác lưu cấu hình (oua-admin.html mở song song): bản nháp chưa sửa gì thì lấy theo giá trị mới;
     đang sửa dở thì giữ bản nháp. */
  ichKhiDoi(()=>{ if(!ichuCoThayDoi()){ ichuLayLai(); ichuRender(); } });
 }
 ichuRender();
}

/* Nhãn trạng thái: lớp màu có sẵn hoặc mã màu (OKR/KPI theo CAT_ST). */
function ichuNhan(n){
 if(!n) return '';
 const [chu,mau]=n;
 if(String(mau).startsWith('#')) return `<span class="ich-badge" style="color:${mau};border-color:${mau}">${ichuEsc(chu)}</span>`;
 return `<span class="ich-badge ${mau}">${ichuEsc(chu)}</span>`;
}

function ichuDonVi(t){return t.so&&t.so.donVi?t.so.donVi:'';}
function ichuGoiY(t,loi){
 if(loi) return `<div class="ich-hint err">${ichuEsc(loi)}</div>`;
 const k=ichKhoang(t.id,ICHU.nhap);
 const dv=t.so.donVi==='%'?'%':(t.so.donVi==='ngày'?' ngày':'');
 return `<div class="ich-hint">Nhập từ ${k.min} đến ${k.max}${dv}${t.so.ghiChu?` (${ichuEsc(t.so.ghiChu)})`:''}</div>`;
}
function ichuO(t,loi,khoa){
 const gt=ICHU.nhap[t.id];
 const chu=ICHU.chu[t.id]!=null?ICHU.chu[t.id]:(gt.so==null?'':String(gt.so));
 const tat=khoa||!gt.bat;
 const dv=ichuDonVi(t);
 return `<div class="ich-val"><input class="ich-input${loi&&!tat?' err':''}" data-ich-so="${t.id}" inputmode="numeric" value="${ichuEsc(chu)}" ${tat?'disabled':''} oninput="ichuNhapSo(this)" aria-label="${ichuEsc(t.ten)}">${dv?`<span class="ich-unit">${ichuEsc(dv)}</span>`:''}</div><div data-ich-hint="${t.id}">${tat?'':ichuGoiY(t,loi)}</div>`;
}
function ichuChuCongTac(){return Object.assign({cot:'Sử dụng',bat:'Đang bật',tat:'Đang tắt'},ichuTab().congTac||{});}
/* Ô chọn cho tham số có ít giá trị (luaChon) — nằm cùng dòng với chữ, không cần dòng gợi ý khoảng nhập. Màn quản trị tự
   bọc <select> thành ô chọn kiểu riêng (ouaEnhanceSelect, js/oua-data.js; vẫn bắn sự kiện change); ô kiểu riêng không
   đọc thuộc tính disabled nên dòng tắt khóa bằng lớp .tat ở CSS. */
function ichuChon(t,tat){
 const v=ICHU.nhap[t.id].so;
 return `<select class="ich-select" data-ich-chon="${t.id}" ${tat?'disabled':''} onchange="ichuChonSo('${t.id}',this.value)" aria-label="${ichuEsc(t.ten)}">${Object.entries(t.so.luaChon).map(([k,ten])=>`<option value="${k}" ${Number(k)===v?'selected':''}>${k} – ${ichuEsc(ten)}</option>`).join('')}</select>`;
}
function ichuChonSo(id,val){ICHU.nhap[id].so=parseInt(val,10);ichuRender();}
function ichuCongTac(t){
 const gt=ICHU.nhap[t.id], ct=ichuChuCongTac();
 if(t.chiXem) return `<label class="ich-switch locked" title="Chỉ hiển thị, không thay đổi được"><input type="checkbox" checked disabled><span class="ich-track"><span class="ich-thumb"></span></span></label><div class="ich-sw-txt">🔒 Luôn hiện</div>`;
 const khoaCha=ichBiKhoa(t.id,ICHU.nhap);
 const cha=khoaCha&&t.phuThuoc?ichThamSo(t.phuThuoc):null;
 return `<label class="ich-switch${khoaCha?' locked':''}"><input type="checkbox" ${gt.bat?'checked':''} ${khoaCha?'disabled':''} onchange="ichuBat('${t.id}',this.checked)"><span class="ich-track"><span class="ich-thumb"></span></span></label><div class="ich-sw-txt">${cha?`Khóa vì «${ichuEsc(cha.ten)}» tắt`:(gt.bat?ct.bat:ct.tat)}</div>`;
}

function ichuBang(tab,ds,loi){
 const coGiaTri=ds.some(t=>t.so);
 if(tab.kieu==='muc'){
  let truoc=null;
  const rows=ds.map(t=>{
   const nhom=t.ten!==truoc?t.ten:''; truoc=t.ten;
   const khoa=ichBiKhoa(t.id,ICHU.nhap), tat=khoa||!ICHU.nhap[t.id].bat;
   const apDung=`<div class="ich-apdung">${ichuEsc(t.apDung)}</div>`;
   const muc=t.so&&t.so.luaChon?`<div class="ich-muc-chon${tat?' tat':''}"><b>${ichuEsc(t.muc)}</b>${ichuChon(t,tat)}<b>${ichuEsc(t.so.donVi||'')}</b></div>${apDung}`
    :`<b>${ichuEsc(t.muc)}</b>${apDung}`;
   return `<tr class="${tat&&!t.chiXem?'off':''}"><td class="ich-nhom">${ichuEsc(nhom)}</td><td class="ich-muc">${muc}</td><td class="ich-icon">${t.icon||'—'}</td><td class="ich-mota">${ichuEsc(t.moTa)}</td><td class="ich-sw">${ichuCongTac(t)}</td></tr>`;
  }).join('');
  return `<table class="ich-table"><thead><tr><th style="width:22%">Nhóm</th><th style="width:18%">Mức</th><th style="width:9%">Icon</th><th>Cách áp dụng</th><th style="width:150px">${ichuEsc(ichuChuCongTac().cot)}</th></tr></thead><tbody>${rows}</tbody></table>`;
 }
 const n=coGiaTri?5:4;
 const rows=ds.map(t=>{
  const khoa=ichBiKhoa(t.id,ICHU.nhap), tat=khoa||!ICHU.nhap[t.id].bat;
  const doan=t.doan?`<tr class="ich-doan"><td colspan="${n}">${ichuEsc(t.doan)}</td></tr>`:'';
  const giaTri=!coGiaTri?'':`<td class="ich-gt">${t.so?ichuO(t,loi[t.id],khoa):`<span class="ich-gt-xem">${ichuEsc(t.giaTriXem||'—')}</span>`}</td>`;
  return `${doan}<tr class="${tat&&!t.chiXem?'off':''}"><td class="ich-ten"><b>${ichuEsc(t.ten)}</b></td><td>${ichuNhan(t.nhan)}</td><td class="ich-mota">${ichuEsc(t.moTa)}</td>${giaTri}<td class="ich-sw">${ichuCongTac(t)}</td></tr>`;
 }).join('');
 return `<table class="ich-table"><thead><tr><th style="width:20%">Tham số</th><th style="width:15%">Trạng thái</th><th>Cách áp dụng</th>${coGiaTri?'<th style="width:200px">Giá trị</th>':''}<th style="width:150px">${ichuEsc(ichuChuCongTac().cot)}</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* Dòng «Thứ tự ưu tiên» dưới mô tả tab — đọc từ khai báo uuTien, nhãn như trên Noti. */
function ichuUuTien(cn,tab){
 const ids=ichUuTien(cn,tab); if(!ids.length) return '';
 return `<div class="ich-uutien"><span>Thứ tự ưu tiên:</span>${ids.map(id=>ichuNhan(ichThamSo(id).nhan)).join('<i>→</i>')}</div>`;
}
function ichuDauTab(cn,tab,loi){
 const ids=ichuIdsCuaTab(cn,tab.key);
 if(ids.some(id=>loi[id])) return '<i class="ich-dot err" title="Có ô nhập chưa đúng"></i>';
 if(ichuKhac(ids)) return '<i class="ich-dot" title="Có thay đổi chưa lưu"></i>';
 return '';
}

function ichuRender(){
 const root=document.getElementById('ichRoot'); if(!root) return;
 const cn=ichuCn(), tab=ichuTab();
 const loi=ichKiemTra(ICHU.nhap);
 const ds=ichThamSoCuaTab(cn.key,tab.key);
 root.innerHTML=`
  <div class="ich-cn" role="tablist" aria-label="Chức năng">${ICH_CHUC_NANG.map(c=>`<button type="button" class="ich-cn-btn${c.key===cn.key?' active':''}" onclick="ichuChonCn('${c.key}')"><span>${c.icon}</span>${ichuEsc(c.label)}</button>`).join('')}<span class="ich-cn-sub">${ichuEsc(cn.ten)}</span></div>
  <div class="ich-tabs" role="tablist">${cn.tabs.map(t=>`<button type="button" class="ich-tab${t.key===tab.key?' active':''}" data-ich-tab="${t.key}" onclick="ichuChonTab('${t.key}')">${ichuEsc(t.label)}${ichuDauTab(cn.key,t,loi)}</button>`).join('')}</div>
  <div class="panel ich-panel">
   <div class="ich-title"><h2>${ichuEsc(tab.tieuDe)}</h2><p>${ichuEsc(tab.moTa)}</p>${ichuUuTien(cn.key,tab.key)}</div>
   <div class="ich-table-wrap">${ichuBang(tab,ds,loi)}</div>
   <div class="ich-note">${ichuEsc(tab.chuThich)}</div>
   <div class="ich-foot"><div class="ich-state" id="ichState"></div><div class="ich-actions">
    <button type="button" class="btn" onclick="ichuKhoiPhuc()" title="Đưa các dòng của tab này về giá trị mặc định (chưa lưu)">Khôi phục mặc định</button>
    <button type="button" class="btn" id="ichHuy" onclick="ichuHuy()">Hủy</button>
    <button type="button" class="btn primary" id="ichLuu" onclick="ichuLuu()">Lưu thay đổi</button>
   </div></div>
  </div>`;
 ichuCapNhatChan(loi);
}

/* Cập nhật chỗ báo trạng thái, nút, chấm trên tab mà không vẽ lại bảng (giữ con trỏ trong ô đang gõ). */
function ichuCapNhatChan(loi){
 loi=loi||ichKiemTra(ICHU.nhap);
 const coLoi=Object.keys(loi).length>0, doi=ichuCoThayDoi();
 const st=document.getElementById('ichState');
 if(st){
  st.className='ich-state'+(coLoi?' err':doi?' warn':'');
  st.textContent=coLoi?`Có ${Object.keys(loi).length} ô nhập chưa đúng, chưa lưu được`:doi?'Có thay đổi chưa lưu':'';
 }
 const luu=document.getElementById('ichLuu'), huy=document.getElementById('ichHuy');
 if(luu) luu.disabled=coLoi||!doi;
 if(huy) huy.disabled=!doi;
 const cn=ichuCn();
 document.querySelectorAll('#ichRoot [data-ich-tab]').forEach(b=>{
  const t=cn.tabs.find(x=>x.key===b.dataset.ichTab); if(!t) return;
  const old=b.querySelector('.ich-dot'); if(old) old.remove();
  b.insertAdjacentHTML('beforeend',ichuDauTab(cn.key,t,loi));
 });
}

function ichuNhapSo(el){
 const id=el.dataset.ichSo, chu=el.value.trim();
 ICHU.chu[id]=el.value;
 ICHU.nhap[id].so=/^\d+$/.test(chu)?parseInt(chu,10):null;
 const loi=ichKiemTra(ICHU.nhap);
 /* Khoảng của các ô khác có thể đổi theo ô vừa gõ (Quá hạn ↔ Quá hạn khẩn cấp) → cập nhật gợi ý, viền đỏ mọi ô. */
 document.querySelectorAll('#ichRoot [data-ich-so]').forEach(inp=>{
  const tid=inp.dataset.ichSo, t=ichThamSo(tid), h=document.querySelector(`#ichRoot [data-ich-hint="${tid}"]`);
  if(inp.disabled) return;
  inp.classList.toggle('err',!!loi[tid]);
  if(h) h.innerHTML=ichuGoiY(t,loi[tid]);
 });
 ichuCapNhatChan(loi);
}
function ichuBat(id,on){ICHU.nhap[id].bat=!!on;ichuRender();}
function ichuChonTab(k){ICHU.tab=k;ichuRender();}
function ichuChonCn(k){ICHU.cn=k;ICHU.tab=ichuCn().tabs[0].key;ichuRender();}
function ichuKhoiPhuc(){
 const md=ichMacDinh();
 ichuIdsCuaTab(ICHU.cn,ICHU.tab).forEach(id=>{ICHU.nhap[id]=md[id];delete ICHU.chu[id];});
 ichuRender();
 if(typeof ouaToast==='function') ouaToast('Đã đưa tab về giá trị mặc định. Bấm «Lưu thay đổi» để áp dụng.');
}
function ichuHuy(){ichuLayLai();ichuRender();}
function ichuLuu(){
 const kq=ichLuu(ICHU.nhap);
 if(!kq.ok){
  ichuRender();
  if(typeof ouaToast==='function') ouaToast(kq.khongLuuDuoc?'Trình duyệt không cho lưu (localStorage bị chặn).':'Còn ô nhập chưa đúng, chưa lưu.');
  return;
 }
 ichuLayLai();
 ichuRender();
 if(typeof ouaToast==='function') ouaToast('Đã lưu cấu hình chức năng IOC.');
}
