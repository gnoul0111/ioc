 /* ============================== SINH DỮ LIỆU DEMO ============================== */
 function generateRecords(){
 let idCounter=1; records=[];
 /* "Đơn vị"/"Người-đơn vị phối hợp" của records[] (bảng nhiệm vụ giao/nhận/văn bản kiểu cũ, dùng openList()) trước
 đây lấy tên phẳng từ "units"/"twUnits" (VD "Sở Tài chính", hoàn toàn không liên quan đến officeId của bản ghi)
 — khác hẳn định dạng đường dẫn phân cấp "Thành ủy / Ban Nội chính Thành ủy" mà bảng VPTU/GIAO_DATA
 (openVptuDetailList(), xem vptuOrgLeafPaths()) đang dùng, gây lệch định dạng giữa 2 bảng dù cùng hiển thị
 "nhiệm vụ giao/nhận". Nay dùng đúng 1 kiểu đường dẫn phân cấp cho CẢ 4 trục Thành phố (vptuOrgLeafPaths(), duyệt
 UNIT_TREE_AXIS_DEPTS) lẫn 5 khối Trung ương (twOfficePaths()/twAllOrgPaths(), duyệt TW_ORG_TREE) để mọi trục/
 khối luôn đồng bộ định dạng — riêng "Đơn vị" của Trung ương lấy ĐÚNG theo officeId đã gán cho bản ghi (không
 random độc lập) để khớp với chính đơn vị đang lọc/xem, "phối hợp" vẫn rải ngẫu nhiên xuyên khối như bên Thành
 phố. Bước nhảy coop (+41, số nguyên tố) copy đúng kỹ thuật rải đều nhánh của buildVptuDetailList() để "phối
 hợp" không luôn rơi vào lân cận "chủ trì". */
 const cityLeafPaths=vptuOrgLeafPaths();
 Object.keys(segmentTemplate).forEach(role=>{
 Object.keys(metricMeta).forEach(metric=>{
 const isDocument = metric==='docIn'||metric==='docOut';
 const unitPool = isTwRole(role) ? twUnits : units;
 const useCityTree = !isTwRole(role) && cityLeafPaths.length;
 const twOfficeIds = isTwRole(role) ? twAllOfficeIds(role) : null;
 /* Văn bản (docIn/docOut) đã bật lại dữ liệu mẫu thật (trước đây tạm ẩn theo yêu cầu luonghd2k, ép count=0) —
 đồng bộ với isDocMetric() trong helpers.js đã bỏ ép về 0. */
 (isDocument?docStatusDefs:statusDefs).forEach(st=>{
 const count=segmentTemplate[role][metric][st.key]||0;
 for(let i=0;i<count;i++){
 /* Không status nào trong dueDate() từng ra delta=0 (xem helpers.js) nên trước giờ KHÔNG bao giờ có nhiệm vụ mẫu
 nào hạn đúng hôm nay — anh yêu cầu fake thêm cho có dữ liệu thấy ngay trên demo. Ép due=hôm nay cho 1 phần nhỏ
 nhiệm vụ received/assigned (đúng loại "Nhiệm vụ" đang theo dõi Sắp hết hạn), bỏ qua trạng thái đã xong (done/
 closed, không còn ý nghĩa "sắp hết hạn" nữa) — modulo 37 (số nguyên tố, không trùng chu kỳ 3/7/10/13/29/97 đã
 dùng ở priority/urgency/due khác) để rải đều, không dồn cục 1 chỗ. */
 const isTaskMetric=metric==='received'||metric==='assigned';
 const forceDueToday=isTaskMetric && st.key!=='done' && st.key!=='closed' && idCounter%37===0;
 const due=forceDueToday?todayDateStr():dueDate(i,st.key);
 /* TRƯỚC ĐÂY priority/urgency gắn CỐ ĐỊNH theo trạng thái workflow (chỉ 'revoked'/'extend' mới ra "Cao") — 2
 trạng thái đó lại luôn có due âm (quá khứ, xem dueDate()) nên mọi nhiệm vụ ⭐/🔥 chỉ rơi đúng vào nhóm "Quá
 hạn", còn "Sắp hết hạn"/"Cập nhật trạng thái"/hoàn thành không bao giờ có (anh phát hiện đúng). Tách hẳn
 priority/urgency thành 2 roll NGẪU NHIÊN ĐỘC LẬP với status/due — để mọi nhóm/bucket đều có đủ 4 trường hợp
 (không có gì / chỉ quan trọng / chỉ khẩn cấp / cả hai) như anh yêu cầu "fake đủ các trường hợp". */
 /* CHÚ Ý toán học: idCounter tăng ĐÚNG +1 mỗi bản ghi, và trong 1 khối cùng role/metric/status thì i cũng tăng
 +1 song song idCounter — công thức i*7+idCounter*13 có 7+13=20 chia hết cho 10 nên số hạng i TỰ TRIỆT TIÊU
 theo mod 10, ra hằng số cố định suốt cả khối (bug thực tế gặp phải: "Sắp hết hạn" toàn 1 màu). Chỉ dùng đúng
 idCounter (duy nhất, tăng đều +1 toàn cục) với hệ số NGUYÊN TỐ CÙNG NHAU với 10 (3 và 7) — %10 khi đó chắc
 chắn chạy đều qua đủ 10 dư số khi idCounter tăng dần, không còn bị triệt tiêu. */
 /* importantRoll/urgentRoll vẫn còn TƯƠNG QUAN nếu cả 2 cùng %10 tuyến tính theo idCounter (chu kỳ 10 trùng
 nhau, mỗi idCounter chỉ rơi đúng 1 cặp giá trị cố định) — không bao giờ ra được đủ ca "vừa quan trọng vừa khẩn
 cấp" hay "không có gì". Cho urgentRoll qua modulo số NGUYÊN TỐ khác hẳn (97, không liên quan gì đến 10) trước
 khi %10 lần nữa — 2 chu kỳ 10 và 97 nguyên tố cùng nhau (chu kỳ chung 970) nên phá tương quan, đủ đa dạng
 trong từng khối vài chục bản ghi. */
 const importantRoll=(idCounter*3)%10;
 const urgentRoll=((idCounter*29)%97)%10;
 const priority=importantRoll<3?'Cao':'Bình thường'; // chỉ 2 mức, đã bỏ "Trung bình"
 const urgency=urgentRoll<2?'Khẩn cấp':(urgentRoll<5?'Gấp':'Thường');
 const officeId = twOfficeIds && twOfficeIds.length ? twOfficeIds[(i+idCounter)%twOfficeIds.length] : null;
 /* completedAt (epoch ms) — trước đây nhiệm vụ mẫu done/closed KHÔNG có mốc hoàn thành nào, nên nhóm "Hoàn
 thành" mới (my-tasks-notify.js, tự ẩn sau 24h) luôn rỗng với dữ liệu mẫu. Rải 0-72 giờ trước (idCounter*41,
 số nguyên tố chưa dùng ở công thức nào khác) — vừa có phần nằm TRONG 24h gần nhất (còn hiện), vừa có phần đã
 QUÁ 24h (đúng ý "tự mất sau 1 ngày", kiểm chứng được ngay là nó thực sự rớt khỏi danh sách). */
 const completedAt=(st.key==='done'||st.key==='closed')?Date.now()-((idCounter*41)%72)*3600000:null;
 const base={
 id:`PX-${metric.toUpperCase()}-${role}-${String(idCounter).padStart(4,'0')}`,
 role, metric, status:st.key,
 /* "Mã nhiệm vụ"/"Ngày bắt đầu"/"Độ khẩn"/"Đơn vị phối hợp" trong popup chi tiết (renderRecordDetail) trước đây
 luôn hiện "—" cho toàn bộ dữ liệu mẫu (chỉ nhiệm vụ tạo thật qua form "+ Giao nhiệm vụ" mới có) — vì generateRecords()
 chưa từng sinh các trường này, KHÔNG PHẢI lỗi riêng của cấp Trung ương. Sinh đủ ở đây (cùng công thức startDate
 với vptuStartDate() của bảng VPTU để đồng nhất 1 cách tính) để mọi đơn vị/tài khoản đều thấy chi tiết đầy đủ như nhau. */
 code:`${metric.toUpperCase()}-${String(idCounter).padStart(5,'0')}`,
 officeId,
 unit: useCityTree ? cityLeafPaths[(i+idCounter)%cityLeafPaths.length] : (isTwRole(role) && officeId && twOfficePaths(role)[officeId]) ? twOfficePaths(role)[officeId] : pick(unitPool,i+idCounter),
 coop: useCityTree ? cityLeafPaths[(i+idCounter+41)%cityLeafPaths.length] : (isTwRole(role) && twAllOrgPaths().length) ? twAllOrgPaths()[(i+idCounter+41)%twAllOrgPaths().length] : pick(unitPool,i+idCounter+7),
 priority, urgency,
 /* created TRƯỚC ĐÂY cố định "06/2026" — không liên quan gì đến ngày thật hôm nay, nên nhóm "Nhiệm vụ mới" (lọc
 theo created trong 3 ngày gần nhất, xem myTasksNew() ở my-tasks-notify.js) LUÔN rỗng với toàn bộ dữ liệu mẫu,
 chỉ có nhiệm vụ tạo thật trong phiên mới lọt vào. Đổi sang tính lùi (i%10) ngày so với hôm nay — rải đều 0-9
 ngày trước, đảm bảo luôn có 1 phần đáng kể rơi vào khoảng "3 ngày gần nhất" dù ngày hệ thống là ngày nào. */
 due, startDate:vptuStartDate(i,due), created:createdDateFor(i), progress:progressFor(st.key,i), completedAt,
 evidence:[`Biểu mẫu_${role}_${i+1}.xlsx`,`Văn bản_chỉ_đạo_${i+1}.pdf`,`Ảnh_minh_chứng_${i+1}.jpg`],
 history:[
 {time:'08:15 24/06/2026',text:'Tiếp nhận vào IOC/CAD'},
 {time:'09:40 24/06/2026',text:`Phân loại ${st.label}`},
 {time:'14:20 25/06/2026',text:`Gán xử lý cho ${pick(unitPool,i+2)}`},
 {time:'10:10 26/06/2026',text:'Cập nhật tiến độ và đính kèm minh chứng'}
 ]
 };
 if(isDocument){
 const doc=buildDocumentContent(role,idCounter-1);
 records.push({...base, ...doc, title:doc.title,
 description:`Văn bản ${metric==='docIn'?'đến':'đi'} thuộc ${roleMeta(role).name}, lĩnh vực ${doc.field}. Trích yếu: ${doc.summary}.`
 });
 } else {
 const titleBase=pick(taskTitlePool[role],i);
 const field=pick(fieldPool[role],i+idCounter);
 const receivedCreatorPool = isTwRole(role) ? ['Trung ương Đảng','Quốc hội','Chính phủ','MTTQ Trung ương','Bộ/ngành phối hợp'] : ['Thành ủy Hà Nội','HĐND Thành phố','UBND Thành phố','MTTQ Thành phố','Sở/ban ngành phối hợp'];
 const creator = metric==='received' ? pick(receivedCreatorPool,i) : roleMeta(role).name;
 const receiver = metric==='assigned' ? pick(unitPool,i+role.length) : roleMeta(role).name;
 records.push({...base, title:`${titleBase} #${i+1}`, field, creator, receiver, linkedDocIds:[],
 description:`Hồ sơ demo thuộc ${roleMeta(role).name}, lĩnh vực ${field}. Nội dung dùng để mô phỏng vận hành IOC/CAD${isTwRole(role)?'':' Thành ủy Hà Nội'}, có theo dõi tiến độ, cảnh báo, đơn vị phối hợp và minh chứng số hóa.`,
 subtasks:[]
 });
 }
 idCounter++;
 }
 })
 })
 });
 indicatorRecords=[];
 Object.keys(indicators).forEach(role=>{
 indicators[role].forEach((it,idx)=>{
 const [name,count,freq,source]=it;
 for(let i=0;i<count;i++){
 const st=weightedStatusForIndex(i,idx);
 indicatorRecords.push({
 id:`CT-${role}-${idx+1}-${String(i+1).padStart(4,'0')}`,role,indicator:name,status:st.k,
 title:`${name} - bản ghi ${i+1}`,field:name,source,freq,
 unit:pick(units,i),due:dueDate(i,st.k),progress:progressFor(st.k,i),
 description:`Bản ghi chỉ tiêu ${name} của ${roleMeta(role).name}. Tần suất cập nhật ${freq}, nguồn ${source}.`,
 history:[{time:'07:30 26/06/2026',text:'Đồng bộ dữ liệu mẫu'}, {time:'11:00 26/06/2026',text:'Xác nhận số liệu cấp phường'}, {time:'15:20 26/06/2026',text:'Cập nhật tiến độ và đính kèm minh chứng'}]
 });
 }
 })
 })
 }

 /* Bổ sung chỉ tiêu con của category (nếu chưa có trong "indicators") + chỉ tiêu tổng hợp kiến nghị cử tri */
 function addIndicatorFromCategory(role,item){
 indicators[role] = indicators[role] || [];
 const [name,count,freq,source] = item;
 let idx = indicators[role].findIndex(x=>x[0]===name);
 if(idx < 0){indicators[role].push([name,count,freq,source]); idx = indicators[role].length-1;}
 if(!indicatorRecords.some(r=>r.role===role && r.indicator===name)){
 /* count có thể là 1 con số thống kê thật rất lớn (VD 186.400 đảng viên, 420.600 lượt sinh hoạt chi bộ...),
 không phải "số bản ghi demo cần tạo" — nếu dùng thẳng count làm số vòng lặp sẽ sinh dư hàng trăm nghìn
 bản ghi không cần thiết, làm chậm hẳn lúc tải trang. Giới hạn số bản ghi mẫu tối đa, còn tổng số liệu
 thật (count) vẫn giữ nguyên trong indicators[role] nên các chỗ hiển thị tổng (catTotal()...) không đổi. */
 const sampleCount=Math.min(count,300);
 for(let i=0;i<sampleCount;i++){
 const st=weightedStatusForIndex(i,idx);
 indicatorRecords.push({id:`CT-${role}-CAT-${idx+1}-${String(i+1).padStart(4,'0')}`,role,indicator:name,status:st.k,title:`${name} - bản ghi ${i+1}`,field:name,source,freq,unit:pick(units,i+idx),due:dueDate(i,st.k),progress:progressFor(st.k,i),description:`Bản ghi thuộc nhóm chỉ tiêu ${name}; dữ liệu được phân cấp theo lĩnh vực, nguồn ${source}, tần suất ${freq}.`,history:[{time:'08:00 30/06/2026',text:'Đồng bộ/nhập mẫu theo phụ lục khảo sát xã phường'}, {time:'09:10 30/06/2026',text:'Xác nhận phạm vi hiển thị theo phân quyền'}]});
 }
 }
 }
 function ensureCategoryIndicators(){
 Object.keys(categorySeed).forEach(role=>categorySeed[role].forEach(cat=>cat.items.forEach(item=>addIndicatorFromCategory(role,item))));
 /* Nạp sẵn indicatorRecords cho toàn bộ đơn vị con cấp Trung ương (TW_OFFICE_CATEGORIES_BY_ROLE) — cùng cơ chế
 với Thành phố, để notify "chỉ tiêu chưa đạt KPI" và các nơi khác dựa trên indicatorRecords cũng có dữ liệu. */
 Object.keys(TW_OFFICE_CATEGORIES_BY_ROLE).forEach(role=>TW_OFFICE_CATEGORIES_BY_ROLE[role].forEach(cat=>cat.items.forEach(item=>addIndicatorFromCategory(role,item))));
 /* Nạp sẵn indicatorRecords cho cả 4 bộ chỉ tiêu cấp phường/xã (DANG/UBND/HDND/MTTQ _XA_CATEGORIES) — để xem trước
 (preview)/chi tiết chỉ tiêu phường luôn có dữ liệu thật, không phụ thuộc tài khoản đang xem có đang ở cấp xã hay
 không (dữ liệu được nạp sẵn 1 lần, chỉ khác nhau ở việc categorySeedForRole() chọn hiển thị bộ nào). */
 [['DANG',DANG_XA_CATEGORIES],['UBND',UBND_XA_CATEGORIES],['HDND',HDND_XA_CATEGORIES],['MTTQ',MTTQ_XA_CATEGORIES]].forEach(([role,cats])=>cats.forEach(cat=>cat.items.forEach(item=>addIndicatorFromCategory(role,item))));
 const label='Tổng số ý kiến liên quan đến kiến nghị cử tri';
 if(!indicators.HDND.some(x=>x[0]===label)) indicators.HDND.push([label,87,'Tuần','Excel/API cử tri']);
 if(!indicatorRecords.some(r=>r.role==='HDND' && r.indicator===label)){
 for(let i=0;i<87;i++){const st=weightedStatusForIndex(i,2);indicatorRecords.push({id:`CT-HDND-KNCT-${String(i+1).padStart(4,'0')}`,role:'HDND',indicator:label,status:st.k,title:`Ý kiến/kiến nghị cử tri liên quan #${i+1}`,field:'Cử tri – kiến nghị',source:'Excel/API cử tri',freq:'Tuần',unit:pick(units,i+3),due:dueDate(i,st.k),progress:progressFor(st.k,i),description:'Bản ghi tổng hợp ý kiến liên quan đến kiến nghị cử tri: nhóm nội dung, đơn vị tiếp nhận, trạng thái xử lý và kết quả trả lời.',history:[{time:'07:40 26/06/2026',text:'Đồng bộ danh sách ý kiến/kiến nghị cử tri'}, {time:'10:30 26/06/2026',text:'HĐND rà soát trạng thái xử lý'}]});}
 }
 }

 /* Mỗi nhiệm vụ (assigned/received) có tối thiểu 5 nhiệm vụ nhánh mẫu để minh hoạ bảng thống kê. Văn bản (docIn/docOut) không có nhiệm vụ nhánh trực tiếp — con của văn bản là Nhiệm vụ, xem attachTasksToDocuments(). */
 function seedDefaultSubtasks(){
 const samples=['Rà soát hồ sơ nguồn và đối chiếu số liệu','Chuẩn hóa biểu mẫu/minh chứng gửi IOC','Liên hệ đơn vị phối hợp xác nhận kết quả','Cập nhật tiến độ xử lý lên hệ thống','Tổng hợp báo cáo ngắn phục vụ lãnh đạo'];
 records.forEach((r,idx)=>{
 if(r.metric!=='assigned'&&r.metric!=='received') return;
 r.subtasks=r.subtasks||[];
 while(r.subtasks.length<5){
 const n=r.subtasks.length;
 r.subtasks.push({id:`${r.id}-N${String(n+1).padStart(2,'0')}`,name:samples[n],content:`${samples[n]} cho hồ sơ ${r.id}, lĩnh vực ${r.field}.`,owner:pick(units,idx+n),state:n===0?'Hoàn thành':n===3?'Chờ duyệt':'Đang xử lý',due:dueDate(n,n===0?'done':n===3?'pending':'doing'),priority:n===3?'Cao':'Bình thường',progress:n===0?100:n===3?68:35+n*8,scenario:'',created:'26/06/2026 08:00'});
 }
 });
 }

 /* Gắn 1-3 nhiệm vụ (assigned/received) đã sinh sẵn cùng trục vào từng văn bản, làm nhiệm vụ "cấp 1" của văn bản đó.
 Chỉ gắn tham chiếu (linkedDocIds) vào nhiệm vụ đã có sẵn — không tạo thêm bản ghi, không đổi số KPI dashboard. */
 function attachTasksToDocuments(){
 const tasksByRole={};
 records.forEach(r=>{ if(r.metric==='assigned'||r.metric==='received'){ (tasksByRole[r.role]=tasksByRole[r.role]||[]).push(r); } });
 const cursor={};
 records.forEach((doc,docIdx)=>{
 if(doc.metric!=='docIn'&&doc.metric!=='docOut') return;
 const pool=tasksByRole[doc.role]||[]; if(!pool.length) return;
 const taskCount=1+(docIdx%3);
 cursor[doc.role]=cursor[doc.role]||0;
 for(let k=0;k<taskCount;k++){
 const task=pool[cursor[doc.role]%pool.length];
 cursor[doc.role]++;
 task.linkedDocIds=task.linkedDocIds||[];
 if(!task.linkedDocIds.includes(doc.id)) task.linkedDocIds.push(doc.id);
 }
 });
 }

