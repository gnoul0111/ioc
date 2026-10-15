 /* ===== Giao diện riêng cho "Giao nhiệm vụ" — đúng số liệu thật theo từng đơn vị giao ===== */
 const GIAO_DATA=[
 {role:'DANG',title:'Thành ủy',total:1468,rows:[['Mới tạo',126],['Chờ phê duyệt',502],['Xin gia hạn',0],['Hoàn thành',542],['Kết thúc',127],['Thu hồi',171]]},
 {role:'UBND',title:'UBND Thành phố',total:4165,rows:[['Mới tạo',428],['Chờ phê duyệt',1710],['Xin gia hạn',37],['Hoàn thành',1049],['Kết thúc',758],['Thu hồi',183]]},
 {role:'HDND',title:'HĐND Thành phố',total:705,rows:[['Mới tạo',26],['Chờ phê duyệt',104],['Xin gia hạn',1],['Hoàn thành',526],['Kết thúc',21],['Thu hồi',27]]},
 {role:'MTTQ',title:'Ủy ban MTTQ Việt Nam Thành phố',total:0,rows:[['Mới tạo',0],['Chờ phê duyệt',0],['Xin gia hạn',0],['Hoàn thành',0],['Kết thúc',0],['Thu hồi',0]]}
 ];
 /* Widget "VĂN BẢN/NHIỆM VỤ THEO TRỤC" (mode Nhiệm vụ giao/nhận) LUÔN đọc qua axisFixedDataset() → GIAO_DATA/
 VPTU_DATA (2 mảng tĩnh ở trên) — axisFixedDataset() không bao giờ trả về null cho metric assigned/received nên
 nhánh vẽ theo segmentTemplate trong renderAxisDashboard() thực chất không bao giờ chạy tới cho 2 metric này.
 Vì vậy nhiệm vụ tạo mới ở createAssignment() PHẢI cộng thẳng vào đúng 2 mảng này (không chỉ segmentTemplate)
 thì số liệu + danh sách "Mới tạo" mới thực sự nhúc nhích. */
 function bumpFixedDataset(dataset,role,statusLabel,delta){
 const d=dataset.find(x=>x.role===role); if(!d) return null;
 d.total+=delta;
 const row=d.rows.find(x=>x[0]===statusLabel);
 if(row) row[1]+=delta;
 return d;
 }
 function pushVptuDetailItem(metric,dEntry,vptuLabel,id,title,field,unit,lead,coop,due,startDate,progress,description){
 if(!dEntry) return;
 const store=vptuDetailStore();
 const arr=store[metric]||(store[metric]=[]);
 arr.unshift({id,ts:Date.now(),metric,role:dEntry.role,soId:null,vptuLabel,status:VPTU_LABEL_TO_STATUS[vptuLabel]||'new',title,field,unit,lead:lead||'',coop:coop||[],due,startDate,progress,description});
 }
 /* coop luôn là MẢNG đường dẫn (0..N đơn vị phối hợp) — 1 nhiệm vụ thật có thể mời nhiều đơn vị/lãnh đạo cùng lúc
 (xem cây chọn nhiều ở CÂY "ĐƠN VỊ/NGƯỜI PHỐI HỢP"), không phải lúc nào cũng đúng 1 đơn vị như "chủ trì" (chỉ chọn 1). */
 function vptuCoopArr(coop){ return Array.isArray(coop)?coop:(coop?[coop]:[]); }
 /* Ô rút gọn dùng trong bảng danh sách (không gian hẹp): chỉ hiện đơn vị đầu + "và N đơn vị khác", hover hiện
 popup nhỏ liệt kê đủ (mỗi đơn vị 1 dòng, xem vptuCoopTipShow/#vptuCoopTip), bấm vào dòng vẫn mở chi tiết xem
 lại đầy đủ dạng gạch đầu dòng (xem vptuCoopListHtml). */
 function vptuCoopSummaryHtml(coop){
 const arr=vptuCoopArr(coop);
 if(!arr.length) return '';
 if(arr.length===1) return `<span>${esc(arr[0])}</span>`;
 const dataAttr=esc(JSON.stringify(arr));
 return `<span class="vptu-coop-trigger" data-coop="${dataAttr}" onmouseenter="vptuCoopTipShow(this)" onmouseleave="vptuCoopTipHide()">${esc(arr[0])} <span class="muted">và ${arr.length-1} đơn vị khác</span></span>`;
 }
 function vptuCoopTipEl(){
 let el=document.getElementById('vptuCoopTip');
 if(!el){ el=document.createElement('div'); el.id='vptuCoopTip'; document.body.appendChild(el); }
 return el;
 }
 function vptuCoopTipShow(trigger){
 let arr=[]; try{ arr=JSON.parse(trigger.dataset.coop||'[]'); }catch(e){}
 if(!arr.length) return;
 const el=vptuCoopTipEl();
 el.innerHTML=arr.map(p=>`<div>${esc(p)}</div>`).join('');
 el.classList.add('show');
 const r=trigger.getBoundingClientRect();
 const tipRect=el.getBoundingClientRect();
 let left=r.left, top=r.bottom+6;
 if(left+tipRect.width>window.innerWidth-8) left=Math.max(8,window.innerWidth-8-tipRect.width);
 if(top+tipRect.height>window.innerHeight-8) top=r.top-tipRect.height-6;
 el.style.left=left+'px'; el.style.top=top+'px';
 }
 function vptuCoopTipHide(){
 const el=document.getElementById('vptuCoopTip'); if(el) el.classList.remove('show');
 }
 /* Danh sách đầy đủ dùng ở màn chi tiết cấp 2 (đủ chỗ hơn) — mỗi đơn vị phối hợp 1 dòng riêng, không giới hạn số lượng. */
 function vptuCoopListHtml(coop){
 const arr=vptuCoopArr(coop);
 if(!arr.length) return '—';
 return `<ul style="margin:2px 0 0;padding-left:16px">${arr.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`;
 }
 /* Khi xóa nhiệm vụ thật, gỡ luôn dòng tương ứng khỏi GIAO_DATA/VPTU_DATA + vptuDetailStore để số liệu không bị
 "ma" (đã xóa nhưng tổng vẫn còn đếm). Không tìm thấy (VD nhiệm vụ tạo trước khi có bản vá này) thì bỏ qua êm. */
 function removeVptuDetailItem(rec){
 const store=vptuDetailStore(); const arr=store[rec.metric]; if(!arr) return;
 const i=arr.findIndex(x=>x.id===rec.id); if(i<0) return;
 const item=arr[i]; arr.splice(i,1);
 bumpFixedDataset(rec.metric==='assigned'?GIAO_DATA:VPTU_DATA, item.role, item.vptuLabel, -1);
 }
