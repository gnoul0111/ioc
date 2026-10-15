 /* ============================== DASHBOARD SỞ (dùng chung cho các sở UBND chưa có dữ liệu thật, port giao diện từ dashboard Giáo dục) ============================== */
 function ensureFakeCategoryItems(role,catId){
 const cat=(categorySeed[role]||[]).find(c=>c.id===catId); if(!cat||cat.items.length||cat.noItems) return;
 const seed=[...catId].reduce((a,c)=>a+c.charCodeAt(0),0);
 const shortName=cat.name.split(' (')[0];
 const templates=[['Tổng hợp số liệu chuyên ngành','Tháng'],['Kết quả thực hiện nhiệm vụ trọng tâm','Quý'],['Tình hình xử lý phản ánh, kiến nghị liên quan','Tuần'],['Chỉ tiêu tổng hợp báo cáo định kỳ','Tháng']];
 const n=3+(seed%2);
 cat.items=templates.slice(0,n).map((t,i)=>[`${shortName} - ${t[0]}`,10+((seed+i*13)%50),t[1],'Dữ liệu demo, chưa kết nối nguồn chính thức']);
 if(!cat.desc) cat.desc='Dữ liệu minh họa — lĩnh vực chưa có nguồn kết nối chính thức, số liệu chỉ mang tính demo.';
 if(!cat.types||!cat.types.length) cat.types=['Demo'];
 cat.items.forEach(item=>{
 addIndicatorFromCategory(role,item);
 const name=item[0], count=Number(item[1])||0;
 const idx=indicators[role].findIndex(x=>x[0]===name);
 for(let i=0;i<count;i++){
 const st=weightedStatusForIndex(i,idx);
 indicatorRecords.push({id:`CT-${role}-${idx+1}-FAKE-${String(i+1).padStart(4,'0')}`,role,indicator:name,status:st.k,title:`${name} - bản ghi ${i+1}`,field:name,source:item[3],freq:item[2],unit:pick(units,i),due:dueDate(i,st.k),progress:progressFor(st.k,i),description:`Bản ghi demo minh họa cho chỉ tiêu ${name}, chưa đồng bộ từ nguồn thật.`,history:[{time:'--',text:'Dữ liệu demo minh họa, chưa đồng bộ nguồn thật.'}]});
 }
 });
 }
