 /* ============================== LỊCH CÔNG TÁC / KỲ HỌP (1 bộ hàm dùng chung) ============================== */
 function ensureCalendarEvents(){
 if(window.__calendarEvents) return;
 const today=new Date(); today.setHours(0,0,0,0);
 const templates={
 DANG:['Giao ban Thường trực Đảng ủy','Họp Ban Thường vụ Đảng ủy','Làm việc về Nghị quyết 57','Kiểm điểm tiến độ công tác Đảng viên','Họp giao ban tuyên giáo - dân vận','Họp rà soát văn bản chỉ đạo'],
 HDND:['Họp Thường trực HĐND','Phiên giải trình chuyên đề','Giám sát kiến nghị cử tri','Chuẩn bị nội dung kỳ họp HĐND','Rà soát dự thảo nghị quyết','Họp tổ đại biểu HĐND'],
 UBND:['Giao ban lãnh đạo UBND','Họp xử lý TTHC sắp hạn','Họp thu ngân sách - an sinh','Họp đô thị, môi trường, PCCC','Họp GPMB dự án trọng điểm','Họp chuyển đổi số dữ liệu IOC'],
 MTTQ:['Họp Ban Thường trực MTTQ','Họp phản biện xã hội','Họp quỹ ủng hộ và an sinh','Họp Đoàn Thanh niên - Hội Phụ nữ','Họp giám sát cộng đồng','Họp tổng hợp dư luận xã hội'],
 TW_CTN:['Họp giao ban Văn phòng Chủ tịch nước','Chuẩn bị lễ tân, đối ngoại Nhà nước','Họp xét duyệt hồ sơ khen thưởng','Họp xét đặc xá, ân giảm','Rà soát văn bản trình ký','Họp tiếp công dân'],
 TW_DANG:['Giao ban Lãnh đạo Ban Tổ chức Trung ương','Họp xét công tác cán bộ','Họp Hội đồng đào tạo, bồi dưỡng','Họp thẩm định chính trị nội bộ','Họp kiểm tra, giám sát','Họp Văn phòng ban'],
 TW_QH:['Họp Ủy ban Thường vụ Quốc hội','Họp thẩm tra dự án luật','Họp giám sát chuyên đề','Họp chuẩn bị kỳ họp Quốc hội','Họp Đoàn Chủ tịch','Họp tiếp xúc cử tri'],
 TW_CP:['Họp Chính phủ thường kỳ','Họp chuyên đề xây dựng pháp luật','Họp cải cách hành chính','Họp chỉ đạo điều hành kinh tế - xã hội','Họp rà soát đầu tư công','Họp giao ban Văn phòng Chính phủ'],
 TW_MTTQ:['Họp Ban Thường trực Ủy ban Trung ương MTTQ','Họp giám sát, phản biện xã hội','Họp vận động Quỹ vì người nghèo','Họp hiệp thương, phối hợp thống nhất hành động','Họp các tổ chức thành viên','Họp tổng hợp ý kiến cử tri']
 };
 const counts={DANG:18,HDND:17,UBND:15,MTTQ:9,TW_CTN:6,TW_DANG:10,TW_QH:7,TW_CP:12,TW_MTTQ:8};
 let id=1; const events=[];
 Object.keys(counts).forEach(role=>{
 for(let i=0;i<counts[role];i++){
 const offsets=[-8,-3,-1,0,1,2,3,5,7,9,12,15,18,22,27,31,38,45];
 const d=addDays(today, offsets[i%offsets.length] + (role==='UBND'?1:role==='MTTQ'?2:0));
 const late = d<today && i%3!==0;
 const done = d<today && !late;
 events.push({
 id:`MEET-${role}-${String(id++).padStart(3,'0')}`,role,date:iso(d),time:['07:45','08:00','08:30','09:00','14:00','15:30'][i%6],end:['09:00','09:30','10:30','11:00','15:30','16:30'][i%6],
 title:`${templates[role][i%templates[role].length]} ${i+1}`,
 venue:['Phòng họp Đảng ủy','Hội trường UBND phường','Phòng họp HĐND','Phòng giao ban IOC','Nhà văn hóa trung tâm'][i%5],
 chair: role==='DANG'?'Bí thư Đảng ủy':role==='HDND'?'Chủ tịch HĐND':role==='UBND'?'Chủ tịch UBND':role==='MTTQ'?'Chủ tịch MTTQ':'Lãnh đạo '+roleMeta(role).name,
 secretary:['Văn phòng Đảng ủy','Văn phòng HĐND','Văn phòng UBND','Cán bộ MTTQ'][i%4],
 participants:[roleMeta(role).name,'Văn phòng phường','Công chức chuyên môn', i%2?'Đơn vị phối hợp':'Tổ chuyển đổi số', i%3?'Đại diện thôn/tổ dân phố':'Công an phường'],
 agenda:`Chuẩn bị nội dung, rà soát số liệu IOC, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp cho ${roleMeta(role).name}.`,
 docs:[`Tài liệu_họp_${role}_${i+1}.pdf`,`Dự_thảo_kết_luận_${i+1}.docx`],
 rawStatus: done?'done':late?'late':'planned',
 prepared: i%4!==1, confirmed: i%5!==2
 });
 }
 });
 window.__calendarEvents=events;
 }
 function eventState(e){
 const today=new Date(); today.setHours(0,0,0,0); const d=parseISO(e.date); d.setHours(0,0,0,0); const diff=Math.round((d-today)/86400000);
 if(e.rawStatus==='late') return {key:'late',label:'Trễ xác nhận/chuẩn bị',icon:'⚠️'};
 if(e.rawStatus==='done') return {key:'done',label:'Đã hoàn thành',icon:'✅'};
 if(diff===0) return {key:'today',label:'Hôm nay',icon:'🔔'};
 if(diff>0 && diff<=7) return {key:'upcoming',label:'Sắp diễn ra',icon:'⏰'};
 return {key:'planned',label:'Đã lên lịch',icon:'📅'};
 }
 function getCalendarEventsForScope(roleFilter){ensureCalendarEvents();return (window.__calendarEvents||[]).filter(e=>allowedRoles().includes(e.role)&&(!roleFilter||e.role===roleFilter));}
 function calendarStatusCounts(roleFilter){const ev=getCalendarEventsForScope(roleFilter);const out={today:0,upcoming:0,late:0,planned:0,done:0};ev.forEach(e=>out[eventState(e).key]++);return out;}
 function eventFullDate(e){const d=parseISO(e.date);return d.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}
 function eventDateShort(e){const d=parseISO(e.date);return `${pad(d.getDate())}/${pad(d.getMonth()+1)}`}

 function openCalendar(role=null,title='Lịch công tác/kỳ họp',stateFilter=''){
 ensureCalendarEvents();
 const validRole = role && allowedRoles().includes(role) ? role : '';
 window.__calState={mode:'month',date:iso(new Date()),role:validRole,state:stateFilter||''};
 document.getElementById('drawerTitle').textContent=title;
 document.getElementById('drawerSub').textContent='';
 document.getElementById('drawerBody').innerHTML=`<div class="calendar-shell" style="display:grid;gap:12px"><div class="calendar-toolbar" style="display:grid;grid-template-columns:repeat(6,max-content) minmax(160px,1fr);gap:8px;align-items:center"><div class="mode-tabs" style="margin:0"><button id="calModeDay" onclick="setCalMode('day')">Ngày</button><button id="calModeWeek" onclick="setCalMode('week')">Tuần</button><button id="calModeMonth" onclick="setCalMode('month')">Tháng</button></div><button class="ghost" onclick="moveCalendar(-1)">←</button><button class="ghost" onclick="moveCalendar(1)">→</button><input id="calDate" type="date" onchange="window.__calState.date=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"/><select id="calRole" onchange="window.__calState.role=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trục được xem</option>${allowedRoles().map(r=>`<option value="${r}" ${validRole===r?'selected':''}>${roleMeta(r).name}</option>`).join('')}</select><select id="calStateFilter" onchange="window.__calState.state=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trạng thái</option><option value="today">Hôm nay</option><option value="upcoming">Sắp diễn ra</option><option value="late">Trễ xác nhận</option><option value="planned">Đã lên lịch</option><option value="done">Đã hoàn thành</option></select><button class="primary" onclick="openAssignmentForm()">＋ Giao nhiệm vụ chuẩn bị họp</button></div><div class="calendar-report" id="calendarReport" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px"></div><div class="calendar-board" id="calendarBoard" style="border:1px solid rgba(87,178,255,.22);border-radius:14px;overflow-x:auto;background:rgba(4,16,30,.72)"></div></div>`;
 document.getElementById('calDate').value=window.__calState.date;
 document.getElementById('calStateFilter').value=window.__calState.state;
 openDrawer(); renderCalendar();
 }
 function setCalMode(mode){window.__calState.mode=mode;renderCalendar();}
 function moveCalendar(delta){const st=window.__calState;let d=parseISO(st.date); if(st.mode==='day') d=addDays(d,delta); else if(st.mode==='week') d=addDays(d,delta*7); else d=new Date(d.getFullYear(),d.getMonth()+delta,1); st.date=iso(d); document.getElementById('calDate').value=st.date; renderCalendar();}
 function filterCalendarEvents(){const st=window.__calState||{};return getCalendarEventsForScope(st.role).filter(e=>!st.state||eventState(e).key===st.state).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}
 function reportCard(label,valueCls,value,hint,stateKey){return `<button class="report-card" style="border:1px solid rgba(87,178,255,.22);background:rgba(5,26,47,.72);border-radius:12px;padding:9px;min-height:78px;overflow:hidden;text-align:left" onclick="window.__calState.state='${stateKey}';document.getElementById('calStateFilter').value='${stateKey}';renderCalendar()"><span style="display:block;color:#c8ddec;font-weight:800;line-height:1.25">${label}</span><b class="${valueCls}" style="display:block;font-size:21px;line-height:1.05;margin-top:4px">${value}</b><small style="display:block;color:var(--muted);margin-top:4px;line-height:1.25">${hint}</small></button>`}
 function renderCalendar(){
 const st=window.__calState; if(!st)return;
 document.querySelectorAll('#calModeDay,#calModeWeek,#calModeMonth').forEach(b=>b.classList.remove('active'));
 document.getElementById('calMode'+st.mode[0].toUpperCase()+st.mode.slice(1))?.classList.add('active');
 const counts=calendarStatusCounts(st.role);
 document.getElementById('calendarReport').innerHTML=
 reportCard('Sắp đến lịch họp','warn',fmt(counts.upcoming+counts.today),'Hôm nay và 7 ngày tới','upcoming')+
 reportCard('Lịch trễ xác nhận','danger',fmt(counts.late),'Cần thư ký nhắc việc','late')+
 reportCard('Đã lên lịch','blue',fmt(counts.planned),'Chưa đến hạn','planned')+
 reportCard('Đã hoàn thành','ok',fmt(counts.done),'Có thể lập kết luận/giao việc','done');
 const board=document.getElementById('calendarBoard');
 if(st.mode==='month') board.innerHTML=renderMonthCalendar();
 if(st.mode==='week') board.innerHTML=renderWeekCalendar();
 if(st.mode==='day') board.innerHTML=renderDayCalendar();
 }
 function eventChip(e){const st=eventState(e);return `<button class="event-chip ${st.key}" style="border:1px solid rgba(87,178,255,.22);background:rgba(8,35,62,.88);border-radius:8px;padding:5px 6px;text-align:left;font-size:10.5px;line-height:1.24;min-width:0;overflow:hidden;display:block;width:100%" onclick="openMeetingDetail('${e.id}')"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${st.icon} ${e.time} · ${e.title}</b><small style="display:block;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${roleMeta(e.role).name} · ${e.venue}</small></button>`}
 function renderMonthCalendar(){
 const st=window.__calState; const cursor=parseISO(st.date); const y=cursor.getFullYear(), m=cursor.getMonth(); const first=new Date(y,m,1); const startOffset=(first.getDay()+6)%7; const start=addDays(first,-startOffset); const events=filterCalendarEvents();
 const headers=['T2','T3','T4','T5','T6','T7','CN'].map(h=>`<div style="padding:9px;background:rgba(44,125,210,.18);border-right:1px solid rgba(87,178,255,.16);font-weight:900;text-align:center">${h}</div>`).join('');
 let cells=''; for(let i=0;i<42;i++){const d=addDays(start,i);const dayIso=iso(d);const inMonth=d.getMonth()===m;const today=dayIso===iso(new Date());const evs=events.filter(e=>e.date===dayIso);
 cells+=`<div style="min-height:118px;padding:8px;border-right:1px solid rgba(87,178,255,.12);border-top:1px solid rgba(87,178,255,.12);display:grid;grid-template-rows:auto 1fr;gap:6px;background:rgba(7,27,48,.42);overflow:hidden;${inMonth?'':'opacity:.36;'}${today?'box-shadow:inset 0 0 0 2px rgba(255,213,75,.55);background:rgba(88,71,11,.25);':''}"><div style="font-weight:900;color:#e9f8ff">${d.getDate()}</div><div style="display:grid;gap:5px;align-content:start;overflow:hidden">${evs.slice(0,4).map(eventChip).join('')}${evs.length>4?`<button class="ghost" style="font-size:10px;padding:4px" onclick="window.__calState.mode='day';window.__calState.date='${dayIso}';document.getElementById('calDate').value='${dayIso}';renderCalendar()">+${evs.length-4} lịch khác</button>`:''}</div></div>`}
 return `<div style="display:grid;grid-template-columns:repeat(7,minmax(120px,1fr))">${headers}${cells}</div>`;
 }
 function weekStart(d){const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x}
 function renderWeekCalendar(){const st=window.__calState;const start=weekStart(parseISO(st.date));const events=filterCalendarEvents();let html='<div style="display:grid;grid-template-columns:repeat(7,minmax(150px,1fr))">';for(let i=0;i<7;i++){const d=addDays(start,i), dayIso=iso(d), evs=events.filter(e=>e.date===dayIso);html+=`<div style="min-height:420px;border-right:1px solid rgba(87,178,255,.14);padding:9px;display:grid;align-content:start;gap:8px"><h4 style="margin:0 0 4px;font-size:12px">${d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'})}</h4>${evs.map(eventChip).join('')||'<div class="muted">Không có lịch</div>'}</div>`}return html+'</div>'}
 function renderDayCalendar(){const st=window.__calState;const events=filterCalendarEvents().filter(e=>e.date===st.date);const d=parseISO(st.date);return `<div style="display:grid;gap:8px"><div style="padding:9px;background:rgba(44,125,210,.18);font-weight:900">${d.toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'})}</div>${events.map(e=>`<button class="agenda-row" style="display:grid;grid-template-columns:84px 1fr auto;gap:9px;align-items:start;border:1px solid rgba(87,178,255,.2);background:rgba(5,26,47,.72);border-radius:10px;padding:9px;text-align:left;margin:0 9px" onclick="openMeetingDetail('${e.id}')"><div style="font-weight:900;color:#58b7ff">${e.time}<br/>${e.end}</div><div><h4 style="margin:0;font-size:12px;line-height:1.32">${eventState(e).icon} ${e.title}</h4><p style="margin:4px 0 0;color:var(--muted);font-size:11.5px;line-height:1.38">${roleMeta(e.role).name} · ${e.venue} · Chủ trì: ${e.chair}</p></div><span class="badge ${eventState(e).key==='late'?'red':eventState(e).key==='today'?'ok':'gold'}">${eventState(e).label}</span></button>`).join('')||'<div class="access-lock" style="margin:0 9px">Không có lịch họp trong ngày này.</div>'}</div>`}
 function openMeetingDetail(id){
 ensureCalendarEvents();const e=(window.__calendarEvents||[]).find(x=>x.id===id);if(!e)return;const st=eventState(e);
 document.getElementById('modalTitle').textContent=`Chi tiết lịch họp · ${e.id}`;
 document.getElementById('modalSub').textContent=`${roleMeta(e.role).name} · ${eventFullDate(e)} · ${e.time}-${e.end}`;
 document.getElementById('modalBody').innerHTML=`<div class="scenario-detail-grid"><div class="detail-card"><h4>${st.icon} ${e.title}</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.key==='late'?'#ff626b':st.key==='today'?'#39d5ff':'#ffd65a'}">${st.label}</span><b>Ngày giờ</b><span>${eventFullDate(e)} · ${e.time}-${e.end}</span><b>Địa điểm</b><span>${e.venue}</span><b>Chủ trì</b><span>${e.chair}</span><b>Thư ký</b><span>${e.secretary}</span><b>Tài liệu</b><span>${e.docs.join(', ')}</span></div>${st.key==='late'?'<div class="access-lock" style="margin-top:10px;border-color:rgba(255,98,107,.45)">Vai trò thư ký: lịch này đã trễ xác nhận/chuẩn bị tài liệu. Cần nhắc đơn vị và giao nhiệm vụ hoàn thiện ngay.</div>':''}</div><div class="detail-card"><h4>Thành phần tham gia</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${e.participants.map(p=>`<span style="padding:5px 7px;border:1px solid rgba(87,178,255,.22);background:rgba(6,28,52,.72);border-radius:999px;font-size:11.5px">${p}</span>`).join('')}</div><h4 style="margin-top:10px">Nội dung họp</h4><p class="wrap">${e.agenda}</p><div class="action-bar"><button class="primary" onclick="openAssignmentForm()">Giao nhiệm vụ chuẩn bị/kết luận</button><button class="ghost" onclick="toast('Đã gửi nhắc lịch tới thành phần tham dự ${e.id}')">Gửi nhắc lịch</button><button class="ghost" onclick="toast('Đã xác nhận tham dự và cập nhật calendar ${e.id}')">Xác nhận tham dự</button><button class="ghost danger-btn" onclick="toast('Đã tạo báo cáo lịch trễ cho ${e.id}')">Báo cáo lịch trễ</button></div></div></div><div class="detail-card"><h4>Báo cáo thư ký</h4><div class="audit"><div class="audit-item"><b>Chuẩn bị tài liệu</b><span>${e.prepared?'Đã đủ tài liệu họp':'Thiếu tài liệu, cần nhắc đơn vị gửi trước giờ họp'}</span></div><div class="audit-item"><b>Xác nhận tham dự</b><span>${e.confirmed?'Đã xác nhận thành phần chính':'Chưa đủ xác nhận, cần gọi/nhắc tự động'}</span></div><div class="audit-item"><b>Việc sau họp</b><span>Tạo dự thảo kết luận, giao nhiệm vụ theo kết luận và theo dõi SLA trên IOC/CAD.</span></div></div></div>`;
 openModal();
 }

