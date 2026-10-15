 /* ============================== CHI TIẾT 1 HỒ SƠ/NHIỆM VỤ (cấp 2) ============================== */
 function openRecordDetail(id,fromId,fromFieldId){
 const r=records.find(x=>x.id===id); if(!r)return;
 /* Bản ghi "nhiệm vụ giao" (mirror, r.mirrorOfId) không có nội dung riêng — toàn bộ dữ liệu thật nằm ở bản ghi
 gốc phía "nhiệm vụ nhận". Vào thẳng bản ghi gốc luôn, khỏi bắt bấm thêm 1 màn tóm tắt trung gian. */
 if(r.mirrorOfId){ openRecordDetail(r.mirrorOfId,fromId,fromFieldId); return; }
 window.__scenarioReturnDocId=null;
 window.__scenarioReturnFieldId=null;
 window.__recordBackId=fromId||null;
 window.__recordBackFieldId=fromFieldId||null;
 document.getElementById('modalTitle').textContent=`Cấp 2 · ${r.id}`;
 document.getElementById('modalSub').textContent=`${metricMeta[r.metric].label} · ${roleMeta(r.role).name} · ${statusMeta(r.status).label}`;
 renderRecordDetail(r); openModal();
 }
 function sourceForRecord(r){
 if(r.metric==='docIn'||r.metric==='docOut') return {name:'Văn bản/PDF',offset:26*60*60*1000+8*60*1000};
 if(r.metric==='indicator') return {name:'CSDL chuyên ngành',offset:18*60*1000+15*1000};
 return {name:'API realtime',offset:3*60*1000+28*1000};
 }
 function relTime(offsetMs){
 const s=Math.floor(offsetMs/1000);
 if(s<60) return `${s} giây trước`;
 const m=Math.floor(s/60); if(m<60) return `${m} phút trước`;
 const h=Math.floor(m/60), mm=m%60; if(h<24) return `${h} giờ${mm?` ${mm} phút`:''} trước`;
 const d=Math.floor(h/24), hh=h%24; return `${d} ngày${hh?` ${hh} giờ`:''} trước`;
 }
 function dtTime(offsetMs){const d=new Date(Date.now()-offsetMs);return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`}
 /* Khối nút hành động ở popup "Cấp 2" của 1 nhiệm vụ — DÙNG CHUNG cho cả records[] (openRecordDetail, bảng cũ)
 lẫn VPTU (openVptuRecordDetail, bảng 2): hàng "Tạo chủ trương/kế hoạch" (nếu áp dụng), "Cập nhật nhiệm vụ",
 "Nhắc xử lý", cộng thêm nút riêng theo quyền sở hữu (sửa/xóa) nếu có. */
 function taskActionBarHtml(opts){
 const {showChuTruong,remindClick,ownedButtons}=opts;
 const rows=[];
 if(showChuTruong) rows.push(`<button class="ghost" onclick="openChuTruongKeHoach()">Tạo chủ trương/kế hoạch</button>`);
 rows.push(`<button class="ghost" onclick="openTaskTrackingSystem()">Cập nhật nhiệm vụ</button>`);
 rows.push(`<button class="ghost" onclick="${remindClick}">Nhắc xử lý</button>`);
 if(ownedButtons) rows.push(ownedButtons);
 return `<div class="action-bar">${rows.join('')}</div>`;
 }
 /* Khung dùng chung cho popup "Cấp 2" (văn bản/nhiệm vụ thật/bản ghi tổng hợp VPTU) — trước đây mỗi loại tự viết
 tay 1 template string riêng dù cùng 1 bố cục (card thông tin dạng bảng kv + card "Mô tả & tiến độ" + note nguồn
 dữ liệu + phần thống kê bên dưới), nên sửa 1 chỗ (VD bug gradient progress bar) phải sửa lặp lại nhiều nơi.
 Gộp về đúng 3 hàm này, mỗi loại chỉ khai báo dữ liệu riêng (rows/description/progress/actionBarHtml) rồi lắp lại. */
 function detailCardHtml(title,rows){
 return `<div class="detail-card"><h4>${title}</h4><div class="kv">${rows.map(([l,v])=>`<b>${l}</b><span>${v}</span>`).join('')}</div></div>`;
 }
 function descProgressCardHtml({description,extraHtml,progress,actionBarHtml}){
 return `<div class="detail-card"><h4>Mô tả &amp; tiến độ</h4><p class="wrap">${description}</p>${extraHtml||''}${progressBarHtml(progress)}<p><b class="mono">${progress}%</b> hoàn thành</p>${actionBarHtml}</div>`;
 }
 function detailModalHtml({backHtml,note,cards,bottomHtml}){
 return `${backHtml||''}${note||''}<div class="detail-grid">${cards.join('')}</div>${bottomHtml||''}`;
 }
 function renderRecordDetail(r){
 const isDoc=r.metric==='docIn'||r.metric==='docOut';
 const st=statusMeta(r.status);
 let cards;
 if(isDoc){
 const infoRows=[
 ['Loại',r.metric==='docIn'?'📨 Văn bản đến':'📄 Văn bản đi'],
 ['Số/ký hiệu',`<span class="mono">${esc(r.code||'—')}</span>`],
 ['Tên văn bản',esc(r.title)],
 ['Trích yếu',`<span class="wrap">${esc(r.summary||'—')}</span>`],
 ['Loại văn bản',esc(r.docType||'—')],
 ['Lĩnh vực',esc(r.field)],
 ['Lãnh đạo ký',esc(r.signer||'—')],
 ['Cơ quan ban hành',esc(r.issuer||'—')],
 ['Đơn vị xử lý',esc(r.unit)],
 ['Ngày văn bản',esc(r.created)],
 ['Hạn xử lý',esc(r.due)],
 ['Trạng thái',`<span style="color:${st.color}">${st.label}</span>`]
 ];
 const actionBarHtml=`<div class="action-bar"><button class="primary" onclick="openAssignmentFromDocument('${r.id}')">＋ Giao nhiệm vụ từ văn bản này</button><button class="ghost" onclick="toast('Đã gửi nhắc xử lý văn bản tới đơn vị: ${esc(r.unit)}')">Nhắc xử lý</button></div>`;
 cards=[detailCardHtml('Thông tin văn bản',infoRows),descProgressCardHtml({description:esc(r.description),progress:r.progress,actionBarHtml})];
 } else {
 const linkedDocs=(r.linkedDocIds||[]).map(id=>records.find(x=>x.id===id)).filter(Boolean);
 const infoRows=[
 ['Mã nhiệm vụ',`<span class="mono">${esc(r.id)}</span>`],
 ['Loại văn bản',esc(r.docType||'—')],
 ['Tiêu đề',esc(r.title)],
 ['Lĩnh vực',esc(r.field)],
 ['Đơn vị chủ trì',esc(r.unit)],
 ['Đơn vị phối hợp',vptuCoopListHtml(r.coop)],
 ['Người giao',esc(r.creator)],
 ['Ngày bắt đầu',esc(r.startDate||'—')],
 ['Hạn hoàn thành',esc(r.due)],
 ['Mức độ quan trọng',esc(r.importance||r.priority)],
 ['Độ khẩn',esc(r.urgency||'—')],
 ['Văn bản liên kết',linkedDocs.length?linkedDocs.map(d=>`<a href="javascript:void(0)" onclick="openRecordDetail('${d.id}','${r.id}')" style="color:#49bcff">${esc(d.code)} – ${esc(d.title)}</a>`).join('; '):'—'],
 ['Trạng thái',`<span style="color:${st.color}">${st.label}</span>`]
 ];
 /* "Đánh dấu hoàn thành" (markMyTaskDone, my-tasks-notify.js) là hành động tối thiểu để mô phỏng nhiệm vụ cấp 1
 chuyển sang hoàn thành — trước đây chỉ nhiệm vụ nhánh (subtasks) mới có nút mô phỏng đồng bộ trạng thái. */
 const doneBtn=(r.metric==='received'&&r.status!=='done'&&r.status!=='closed')?`<button class="ghost" onclick="markMyTaskDone('${r.id}')">✅ Đánh dấu hoàn thành</button>`:'';
 const ownedBtns=isRecordOwnedByMe(r)?`<button class="ghost" onclick="openEditRecordForm('${r.id}')">✏️ Sửa nhiệm vụ</button><button class="ghost danger-btn" onclick="deleteRecord('${r.id}')">🗑️ Xóa nhiệm vụ</button>`:'';
 const actionBarHtml=taskActionBarHtml({showChuTruong:r.status==='new',remindClick:`toast('Đã gửi nhắc xử lý tới đơn vị: ${esc(r.unit)}')`,ownedButtons:(doneBtn+ownedBtns)||null});
 const extraHtml=r.additionalInfo?`<p class="wrap"><b>Thông tin bổ sung:</b> ${esc(r.additionalInfo)}</p>`:'';
 cards=[detailCardHtml('Thông tin nhiệm vụ/văn bản',infoRows),descProgressCardHtml({description:esc(r.description),extraHtml,progress:r.progress,actionBarHtml})];
 }
 const src=sourceForRecord(r);
 const note=`<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${src.name}</b> · cập nhật gần nhất <b>${dtTime(src.offset)}</b> · <b>${relTime(src.offset)}</b>.</div>`;
 const bottomHtml=isDoc?linkedTasksTreeHtml(r):subtaskStatsHtml(r);
 const backRec=window.__recordBackId?records.find(x=>x.id===window.__recordBackId):null;
 const backFieldCtx=window.__recordBackFieldId?fieldTarget(window.__recordBackFieldId):null;
 const backHtml=backRec?`<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${backRec.id}')">← Quay lại ${backRec.id}</button></div>`:backFieldCtx?`<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${window.__recordBackFieldId}')">← Quay lại ${backFieldCtx.scope==='item'?'chỉ tiêu':'lĩnh vực'}: ${esc(backFieldCtx.label)}</button></div>`:'';
 document.getElementById('modalBody').innerHTML=detailModalHtml({backHtml,note,cards,bottomHtml});
 }
 /* Chi tiết cấp 2 cho 1 bản ghi VPTU (dữ liệu tổng hợp, chỉ xem — xem vptu-detail.js) — cùng khung với
 renderRecordDetail() ở trên, chỉ khác dữ liệu: nhiều field không áp dụng cho bản ghi tổng hợp (Người giao, Mức
 độ quan trọng, Độ khẩn, Văn bản liên kết) nên để "—" đúng như dữ liệu VPTU thật sự có. */
 function openVptuRecordDetail(metric,id){
 /* Dòng vừa được bơm thêm từ createAssignment() dùng ĐÚNG id của nhiệm vụ thật trong records[] — mở thẳng
 nhiệm vụ thật (đầy đủ sửa/xóa/nhiệm vụ nhánh) thay vì màn tổng hợp chỉ-xem. */
 if(records.some(x=>x.id===id)){ openRecordDetail(id); return; }
 const r=(vptuDetailStore()[metric]||[]).find(x=>x.id===id); if(!r)return;
 const st=vptuStatusMeta(r.status);
 const src={name:'Hệ thống Theo dõi nhiệm vụ (VPTU)',offset:26*60*1000+40*1000};
 document.getElementById('modalTitle').textContent=`Cấp 2 · ${r.id}`;
 document.getElementById('modalSub').textContent=`${metricMeta[r.metric].label} · ${roleMeta(r.role)?.name||r.role} · ${esc(r.vptuLabel)}`;
 const infoRows=[
 ['Mã nhiệm vụ',`<span class="mono">${esc(r.id)}</span>`],
 ['Loại văn bản','—'],
 ['Tiêu đề',esc(r.title)],
 ['Lĩnh vực',esc(r.field)],
 ['Đơn vị chủ trì',esc(r.lead||'—')],
 ['Đơn vị phối hợp',vptuCoopListHtml(r.coop)],
 ['Người giao','—'],
 ['Ngày bắt đầu',esc(r.startDate||'—')],
 ['Hạn hoàn thành',esc(r.due)],
 ['Mức độ quan trọng','—'],
 ['Độ khẩn','—'],
 ['Văn bản liên kết','—'],
 ['Trạng thái',`<span style="color:${st.color}">${st.label} (VPTU: ${esc(r.vptuLabel)})</span>`]
 ];
 const actionBarHtml=taskActionBarHtml({showChuTruong:r.status==='new',remindClick:`toast('Đã gửi nhắc xử lý tới đơn vị: ${esc(r.unit)}')`,ownedButtons:null});
 const note=`<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${src.name}</b> · cập nhật gần nhất <b>${dtTime(src.offset)}</b> · <b>${relTime(src.offset)}</b>.</div>`;
 const cards=[detailCardHtml('Thông tin nhiệm vụ/văn bản',infoRows),descProgressCardHtml({description:esc(r.description),progress:r.progress,actionBarHtml})];
 document.getElementById('modalBody').innerHTML=detailModalHtml({note,cards,bottomHtml:vptuSubtaskStatsHtml(metric,r.id)});
 openModal();
 }

