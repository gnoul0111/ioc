 /* ===== Văn bản đến/đi theo trục: dùng đúng số liệu segmentTemplate, hiển thị dạng donut giống nhiệm vụ giao/nhận ===== */
 const STATUS_COLOR_MAP=Object.fromEntries(ALL_STATUS_DEFS.map(s=>[s.short,s.color]));
 function roleDocRow(role,metric){
 const data=segmentTemplate[role]?.[metric]; if(!data) return null;
 return {title:roleMeta(role).name, role, total:sumObj(data), rows:docStatusDefs.map(st=>[st.short,data[st.key]||0])};
 }
 function docAxisSplit(metric){
 const parent=roleDocRow('UBND',metric);
 if(!parent) return [];
 const units=(categorySeed.UBND||[]).map(c=>({id:c.id,title:c.name,weight:soAxisWeight(c)}));
 return splitRowAcrossUnits(parent.rows,parent.total,units);
 }
 function wardDocAxisSplit(metric){
 const parent=roleDocRow('UBND',metric);
 if(!parent) return [];
 const wardName=wardNames()[Number(currentXaId)]||'phường';
 const defs=[['DANG','Đảng ủy',12],['UBND','UBND',58],['HDND','HĐND',15],['MTTQ','MTTQ',15]];
 const units=defs.map(([role,name,weight])=>({id:role,title:`${name} ${wardName}`,weight}));
 return splitRowAcrossUnits(parent.rows,parent.total,units).map((u,i)=>({...u,role:defs[i][0],soId:null}));
 }
 function axisFixedDataset(role,soId,metric){
 /* Cấp Trung ương không có GIAO_DATA/VPTU_DATA/roleDocRow tách theo từng đơn vị con (Vụ/Cục/Văn phòng ban...) —
 luôn trả về null để renderAxisDashboard() đi qua nhánh dựa trên records[] (twOfficeScope()), nhánh DUY NHẤT
 biết lọc đúng theo đơn vị đang xem thay vì luôn hiện nguyên số liệu cả trục. */
 if(isTwRole(role)) return null;
 if(metric==='docIn'||metric==='docOut'){
 if(role==='DANG') return allowedRoles('DANG').map(r=>roleDocRow(r,metric)).filter(Boolean);
 if(role==='UBND'){
 if(currentXaId!=null && !soId){ const split=wardDocAxisSplit(metric); return split.length?split:null; }
 if(soId){ const split=docAxisSplit(metric); const e=split.find(s=>s.soId===soId); return e?[e]:null; }
 /* Chỉ Thành ủy (xem theo cơ cấu tổ chức, cần duyệt qua từng sở) mới thấy bảng tách 17 sở/ngành —
 tài khoản UBND xem chính dashboard của mình chỉ cần 1 dòng tổng UBND, giống HĐND/MTTQ. */
 if(currentAccount?.role==='DANG'){ const split=docAxisSplit(metric); return split.length?split:null; }
 const row=roleDocRow('UBND',metric);
 return row?[row]:null;
 }
 const row=roleDocRow(role,metric);
 return row?[row]:null;
 }
 if(metric!=='received'&&metric!=='assigned') return null;
 if(role==='DANG') return metric==='received'?VPTU_DATA:GIAO_DATA;
 if(role==='UBND'){
 if(currentXaId!=null && !soId){ const split=wardAxisSplit(metric); return split.length?split:null; }
 if(soId){ const split=soAxisSplit(metric); const e=split.find(s=>s.soId===soId); return e?[e]:null; }
 if(currentAccount?.role==='DANG'){ const split=soAxisSplit(metric); return split.length?split:null; }
 const e=metric==='received'?vptuRoleRow('UBND Thành phố'):giaoRoleRow('UBND'); return e?[e]:null;
 }
 if(role==='HDND'){ const e=metric==='received'?vptuRoleRow('HĐND Thành phố'):giaoRoleRow('HDND'); return e?[e]:null; }
 if(role==='MTTQ'){ const e=metric==='received'?vptuRoleRow('Ủy ban MTTQ Việt Nam Thành phố'):giaoRoleRow('MTTQ'); return e?[e]:null; }
 return null;
 }
 function axisFixedTotal(role,soId,metric){
 const ds=axisFixedDataset(role,soId,metric);
 return ds?ds.reduce((a,d)=>a+d.total,0):null;
 }
