 /* ===== Mở rộng: donut theo trục cho tài khoản UBND (chia theo 17 sở/ngành) và tài khoản HĐND/MTTQ (1 thẻ tổng) ===== */
 function vptuRoleRow(title){return VPTU_DATA.find(d=>d.title===title);}
 function giaoRoleRow(role){return GIAO_DATA.find(d=>d.role===role);}
 function soAxisWeight(cat){
 const t=catTotal(cat);
 if(t>0) return t;
 const seed=[...cat.id].reduce((a,ch)=>a+ch.charCodeAt(0),0);
 return 40+(seed%50);
 }
 function splitRowAcrossUnits(parentRow,parentTotal,units){
 const sumW=units.reduce((a,u)=>a+u.weight,0)||1;
 let allocatedTotal=0;
 return units.map((u,i)=>{
 const isLastUnit=i===units.length-1;
 const unitTotal=isLastUnit?(parentTotal-allocatedTotal):Math.round(parentTotal*u.weight/sumW);
 allocatedTotal+=unitTotal;
 let allocatedRow=0;
 const rows=parentRow.map(([k,v],j)=>{
 const isLastKey=j===parentRow.length-1;
 const val=isLastKey?(unitTotal-allocatedRow):Math.round(unitTotal*(parentTotal?v/parentTotal:0));
 allocatedRow+=val;
 return [k,Math.max(0,val)];
 });
 return {title:u.title, soId:u.id, total:unitTotal, rows};
 });
 }
 function soAxisSplit(metric){
 const parent=metric==='received'?vptuRoleRow('UBND Thành phố'):giaoRoleRow('UBND');
 if(!parent) return [];
 const units=(categorySeed.UBND||[]).map(c=>({id:c.id,title:c.name,weight:soAxisWeight(c)}));
 return splitRowAcrossUnits(parent.rows,parent.total,units);
 }
 /* Xã/phường không quản lý nhiệm vụ theo Sở/ngành (đó là cấp Thành phố) — quản lý theo đúng 4 trục nội bộ phường:
 Đảng ủy/UBND/HĐND/MTTQ. Chưa có số liệu thật riêng cho 126 phường nên chia ước tính theo tỷ trọng từ tổng
 của UBND Thành phố (parent), giữ nguyên cơ chế chia tỷ lệ splitRowAcrossUnits đã dùng cho tách theo Sở. */
 function wardAxisSplit(metric){
 const parent=metric==='received'?vptuRoleRow('UBND Thành phố'):giaoRoleRow('UBND');
 if(!parent) return [];
 const wardName=wardNames()[Number(currentXaId)]||'phường';
 const defs=[['DANG','Đảng ủy',12],['UBND','UBND',58],['HDND','HĐND',15],['MTTQ','MTTQ',15]];
 const units=defs.map(([role,name,weight])=>({id:role,title:`${name} ${wardName}`,weight}));
 return splitRowAcrossUnits(parent.rows,parent.total,units).map((u,i)=>({...u,role:defs[i][0],soId:null}));
 }
