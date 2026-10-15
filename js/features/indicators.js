 /* ============================== CHỈ TIÊU / LĨNH VỰC (mục Chỉ tiêu) ============================== */
 function catTotal(cat){return cat.items.reduce((s,it)=>s+(Number(it[1])||0),0)}
 function isScheduleIndicator(name){return /lịch|kỳ họp|chương trình kỳ họp/i.test(name||'')}

 /* Preview kiểu "hàng thống kê + thanh mini" (port từ dashboard Giáo dục) dùng chung cho thẻ lĩnh vực khối UBND */
 /* Bản thu gọn của phanToDimBodyHtml, dùng cho card preview nhỏ ở lưới chính — vẫn theo đúng 4 quy tắc, chỉ giảm kích thước */
 function compactPhanToHtml(p){
 if(p.type==='stat'){
 const pctItems=p.items.filter(x=>isPercentLabel(x.label));
 const plainItems=p.items.filter(x=>!isPercentLabel(x.label));
 let html='';
 if(pctItems.length) html+=`<div class="mini-pct-row">${pctItems.map((x,i)=>`<span class="mini-pct-chip" style="border-color:${PART_PAL[i%PART_PAL.length]}66" title="${esc(x.label)}"><b style="color:${PART_PAL[i%PART_PAL.length]}">${fmt(x.value)}%</b> ${esc(x.label.replace(/\s*\(%\)\s*$/,''))}</span>`).join('')}</div>`;
 if(plainItems.length) html+=`<div class="mini-stat-row">${plainItems.map(x=>`<span class="mini-stat-chip" title="${esc(x.label)}"><b>${fmt(x.value)}</b> ${esc(x.label)}</span>`).join('')}</div>`;
 return html;
 }
 if(shouldRankBar(p.items)){
 const max=Math.max(...p.items.map(x=>Number(x.value)||0))||1;
 return `<div class="mini-rank">${p.items.map((x,i)=>`<div class="mini-rank-row" title="${esc(x.label)}: ${fmt(x.value)}"><div class="mini-rank-track"><div style="width:${(x.value/max*100).toFixed(1)}%;background:${PART_PAL[i%PART_PAL.length]}"></div></div><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
 }
 const tot=p.items.reduce((s,x)=>s+(Number(x.value)||0),0)||1;
 const segsHtml=p.items.map((x,i)=>`<div style="flex:${(x.value/tot*100).toFixed(1)};background:${PART_PAL[i%PART_PAL.length]};border-radius:3px" title="${esc(x.label)}: ${fmt(x.value)}"></div>`).join('');
 const legendHtml=p.items.map((x,i)=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${PART_PAL[i%PART_PAL.length]};display:inline-block;flex:0 0 auto"></i>${fmt(x.value)}</span>`).join('');
 return `<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p class="cpi-legend" style="margin:5px 0 0">${legendHtml}</p>`;
 }
 function catItemPreviewBody(role,it){
 if(it && it.stcKey && typeof stcPreviewBody==='function') return stcPreviewBody(it);
 if(it && it.sgdKey && typeof sgdPreviewBody==='function') return sgdPreviewBody(it);
 if(it && it.hccKey && typeof hccPreviewBody==='function') return hccPreviewBody(it);
 const name=it[0], declared=Number(it[1])||0, itemParts=it[4]||[];
 const dim=itemParts.find(p=>p.type==='bar')||itemParts.find(p=>p.type==='stat');
 if(dim) return {label:name,bodyHtml:compactPhanToHtml(dim)};
 const recs=indicatorRecordsFor(role,name);
 const tot=recs.length||declared||1;
 const cnts={}; CAT_ST.forEach(s=>cnts[s.k]=recs.filter(r=>r.status===s.k).length);
 const parts=CAT_ST.map(s=>({l:s.l,c:s.c,n:cnts[s.k]||0})).filter(s=>s.n>0);
 const list=parts.length?parts:[{l:'Chưa phân loại',c:'#2c7dd2',n:tot}];
 const tot2=list.reduce((s,x)=>s+x.n,0)||1;
 const segsHtml=list.map(s=>`<div style="flex:${(s.n/tot2*100).toFixed(1)};background:${s.c};border-radius:3px" title="${esc(s.l)}: ${fmt(s.n)}"></div>`).join('');
 const legendHtml=list.map(s=>`<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${s.c};display:inline-block;flex:0 0 auto"></i>${fmt(s.n)}</span>`).join('');
 return {label:name,bodyHtml:`<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p class="cpi-legend">${legendHtml}</p>`};
 }
 function soCategoryPreviewHtml(cat){
 /* Bản xem trước gộp nhiều lĩnh vực chỉ hiện tối đa 4 dòng, nên bỏ thẻ "Tổng quan" (điều hướng, không phải một
    nhóm số liệu) ra khỏi danh sách cắt bớt — để 4 chỗ đó luôn là 4 nhóm chỉ tiêu thật của Sở Tài chính. */
 const rows=(cat.items||[]).filter(it=>!(it&&(it.stcKey==='home'||it.sgdKey==='home'||it.hccKey==='home'))).slice(0,4).map(it=>catItemPreviewBody(cat.role,it));
 if(!rows.length) return '<div class="access-lock" style="height:100%">Chưa có chỉ tiêu con.</div>';
 return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">${rows.map(r=>`
 <div class="cat-preview-item">
 <p class="cpi-label">${esc(r.label)}</p>
 ${r.bodyHtml}
 </div>`).join('')}</div>`;
 }
 /* Khuôn thẻ MẶC ĐỊNH (2026-10-02): tiêu đề + mô tả ngắn + danh sách dòng "số · nhãn" cuộn dọc — dùng chung cho mọi
    đơn vị, cả thẻ đơn vị ở lưới nhiều đơn vị lẫn thẻ từng chỉ tiêu khi xem riêng 1 đơn vị. Đơn vị có UI chỉ tiêu riêng
    (Sở Tài chính, Sở GD&ĐT, TT Phục vụ HCC) vẫn giữ khuôn cũ. false = quay về khuôn xem trước biểu đồ mini cũ
    (soCategoryPreviewHtml/catItemPreviewBody giữ nguyên). */
 const CAT_CARD_LIST_STYLE=true;
 /* Badge trục + số chỉ tiêu trên đầu thẻ đơn vị — giữ nguyên như khuôn cũ, khuôn mới chỉ thay phần bên dưới. */
 const CAT_CARD_SHOW_META=true;
 function catHasOwnUi(cat){return !!(cat&&(cat.stc||cat.sgd||cat.hcc));}
 function catItemHasOwnUi(it){return !!(it&&(it.stcKey||it.sgdKey||it.hccKey));}
 function catListValue(r){
 if(r.value==null||r.value==='') return '—';
 return isPercentLabel(r.label)?`${fmt(r.value)}%`:fmt(r.value);
 }
 function catListCardHtml(title,desc,rows,onclick,metaHtml){
 const list=rows.length
 ? rows.map(r=>`<div class="cat-list-row"><span class="cat-list-chip" title="${esc(r.label)}: ${esc(catListValue(r))}"><b>${esc(catListValue(r))}</b><span>${esc(String(r.label).replace(/\s*\(%\)\s*$/,''))}</span></span></div>`).join('')
 : '<div class="cat-list-empty">Chưa có chỉ tiêu con.</div>';
 return `<button class="field-category-card cat-list-card" onclick="${onclick}">${metaHtml||''}<h4>${esc(title)}</h4>${desc?`<p class="cat-list-desc">${esc(desc)}</p>`:''}<div class="cat-list">${list}</div></button>`;
 }
 /* Thẻ 1 đơn vị: mỗi dòng là 1 chỉ tiêu con kèm số bản ghi. */
 function catUnitRows(cat){return (cat.items||[]).map(it=>({label:it[0],value:it[1]}));}
 /* Thẻ 1 chỉ tiêu: mỗi dòng là 1 thành phần phân tổ (dim bar/stat), không có phân tổ thì là số bản ghi theo trạng thái. */
 function catItemRows(role,it){
 const parts=it[4]||[];
 const dim=parts.find(p=>p.type==='bar')||parts.find(p=>p.type==='stat');
 if(dim) return {desc:`Phân theo ${String(dim.dim||'').toLowerCase()}${it[2]?` · cập nhật theo ${String(it[2]).toLowerCase()}`:''}`,rows:dim.items.map(x=>({label:x.label,value:x.value}))};
 const recs=indicatorRecordsFor(role,it[0]);
 const rows=CAT_ST.map(s=>({label:s.l,value:recs.filter(r=>r.status===s.k).length})).filter(r=>r.value>0);
 return {desc:`Theo trạng thái${it[2]?` · cập nhật theo ${String(it[2]).toLowerCase()}`:''}`,rows:rows.length?rows:[{label:'Tổng số bản ghi',value:it[1]}]};
 }
 /* Không lặp lại badge tên đơn vị trong từng card nữa — khi đã drill vào đúng 1 đơn vị (scoped) thì mọi card ở
 đây đều thuộc cùng 1 đơn vị đó, tên đơn vị đã hiện đúng 1 lần ở khung nhỏ đầu trang (span.badge trong
 .field-category-toolbar, xem renderIndicators()), lặp lại trong từng card vừa thừa vừa dễ vỡ layout khi tên
 đơn vị dài (VD "Vụ Địa phương III (tại Thành phố Hồ Chí Minh, gọi tắt là Vụ III)"). */
 function soItemCardHtml(cat,idx,it){
 /* Thẻ "Tổng quan" của Sở Tài chính đưa hẳn màn Trang chủ – tổng quan (7 ô KPI + Bốn nhóm chỉ tiêu) ra ngoài lưới,
    rộng hết cả hàng, thay vì thẻ xem trước rút gọn như các nhóm khác — nên không dùng khung <button> chung (bên
    trong đã có nút riêng cho từng ô KPI/thẻ nhóm, button lồng button là HTML không hợp lệ). Băng này đã thay thế
    được 4 thẻ nhóm rút gọn nên mặc định ẩn 4 thẻ đó ở đây (STC_SHOW_OUTER_GROUP_CARDS, xem stc-config.js) — code
    dựng thẻ vẫn giữ nguyên, chỉ không gọi khi đang ẩn. */
 if(it && it.stcKey==='home' && typeof stcOverviewBandHtml==='function') return stcOverviewBandHtml(cat,idx);
 if(it && it.stcKey && it.stcKey!=='home' && typeof STC_SHOW_OUTER_GROUP_CARDS!=='undefined' && !STC_SHOW_OUTER_GROUP_CARDS) return '';
 /* Sở GD&ĐT: cùng cách với Sở Tài chính — băng Tổng quan rộng cả hàng thay cho các thẻ nhóm rút gọn (ẩn bằng cờ SGD_SHOW_OUTER_GROUP_CARDS). */
 if(it && it.sgdKey==='home' && typeof sgdOverviewBandHtml==='function') return sgdOverviewBandHtml(cat,idx);
 if(it && it.sgdKey && it.sgdKey!=='home' && typeof SGD_SHOW_OUTER_GROUP_CARDS!=='undefined' && !SGD_SHOW_OUTER_GROUP_CARDS) return '';
 /* Trung tâm Phục vụ HCC: cùng cách — băng Tổng quan rộng cả hàng (ẩn thẻ nhóm rút gọn bằng cờ HCC_SHOW_OUTER_GROUP_CARDS). */
 if(it && it.hccKey==='home' && typeof hccOverviewBandHtml==='function') return hccOverviewBandHtml(cat,idx);
 if(it && it.hccKey && it.hccKey!=='home' && typeof HCC_SHOW_OUTER_GROUP_CARDS!=='undefined' && !HCC_SHOW_OUTER_GROUP_CARDS) return '';
 if(CAT_CARD_LIST_STYLE && !catHasOwnUi(cat) && !catItemHasOwnUi(it)){
 const {desc,rows}=catItemRows(cat.role,it);
 return catListCardHtml(it[0],desc,rows,`openCategoryDetail('${cat.role}','${cat.id}',${idx})`);
 }
 const {label,bodyHtml}=catItemPreviewBody(cat.role,it);
 return `<button class="field-category-card so-item-card" onclick="openCategoryDetail('${cat.role}','${cat.id}',${idx})"><h4>${esc(label)}</h4>${bodyHtml}</button>`;
 }
 /* Tài khoản xã/phường (dù nội bộ vẫn gắn role UBND để dữ liệu nhiệm vụ/GIS/notify tự động lọc đúng theo xaId)
 đại diện cho cả 4 trục của xã đó nên luôn được xem đủ 4 nhóm chỉ tiêu (Đảng ủy phường/HĐND/UBND/MTTQ phường),
 khác với tài khoản UBND/HĐND/MTTQ cấp Thành phố chỉ xem đúng chỉ tiêu trục của mình. */
 /* Cấp Trung ương không có khái niệm "trục quản lý toàn bộ" như Đảng ủy Thành phố (mỗi tài khoản trục TW chỉ
 xem đúng lĩnh vực của trục mình) — trả về đúng 1 role đang đăng nhập để renderCategoryGrid() duyệt qua toàn
 bộ đơn vị con của trục đó dưới dạng thẻ, thay vì rơi vào allowedRoles() vốn chỉ biết 4 trục Thành phố. TW_ALL
 là ngoại lệ (tài khoản "Trung ương" tổng hợp) — trả về đủ 5 trục TW thật để xem lĩnh vực của tất cả. */
 function allowedCategoryRoles(){
 if(currentRole==='TW_ALL') return TW_AXIS_REAL_ORDER;
 if(isTwRole(currentRole)) return [currentRole];
 if(currentXaId!=null) return AXIS_CANONICAL_ORDER.filter(r=>categorySeed[r]);
 return allowedRoles().filter(r=>categorySeed[r]);
 }
 function roleAxisLabel(r){
 if(currentXaId!=null) return r==='DANG'?'Đảng ủy':roleMeta(r).name.replace(/\s*TP$/,'');
 return roleMeta(r).name;
 }
 /* Tab con (cấp 2) cho 1 trục TW — khi trục đó chỉ có ĐÚNG 1 đơn vị gốc mà bản thân đơn vị gốc lại lồng nhiều
 đơn vị con (VD BCH Trung ương Đảng: Ban Tổ chức Trung ương -> 9 Vụ + 2 Cục + 1 Văn phòng ban), tách thành:
 1 tab cho chính đơn vị gốc — GỘP CẢ chỉ tiêu của toàn bộ đơn vị con/cháu bên trong (cấp trên quản lý được cấp
 dưới, đúng tinh thần tab "Tất cả" của tài khoản Thành ủy gộp cả 4 trục Thành ủy/HĐND/UBND/MTTQ) — + 1 tab cho
 mỗi đơn vị con trực tiếp (gồm cả chỉ tiêu của mọi đơn vị cháu bên trong riêng đơn vị đó, để vẫn xem tách riêng
 từng Vụ/Cục được). Nếu trục có nhiều đơn vị gốc rời nhau (VD Chính phủ: 2 đơn vị, MTTQ TW: 2 đơn vị) thì mỗi
 đơn vị gốc là 1 tab. Trả về null nếu trục chỉ có 1 đơn vị không lồng gì (VD Văn phòng Chủ tịch nước) — giữ
 nguyên 1 tab như cũ.
 Danh sách id thuộc 1 tab được tính bằng cách DUYỆT THẬT cây TW_ORG_TREE (đệ quy qua children() thật) — không
 đoán qua tiền tố chuỗi id, vì id không phải lúc nào cũng đặt theo kiểu "cha-con" (VD "Văn phòng ban" có
 officeId 'tw-dang-vpban' nhưng 6 phòng con lại đặt id rời 'tw-dang-p1'..'p6', không có tiền tố chung). */
 function twCollectIds(node,out){
 /* Chỉ gom node có officeId thật (type:'office') — nhánh "Thành phố" mới trong TW_CP (type:'branch'/'city'/
 'placeholder', xem TW_CITY_GROUPS) không có officeId, nếu không lọc sẽ đẩy hàng chục giá trị undefined
 vào danh sách, làm loãng officeId gán cho dữ liệu demo của tài khoản Chính phủ. */
 if(node.officeId) out.push(node.officeId);
 if(typeof node.children==='function') node.children().forEach(c=>twCollectIds(c,out));
 return out;
 }
 /* Danh sách tab cho 1 node "cấp trên" cụ thể (node.children là function) — 1 tab cho chính node đó (gộp cả cây
 con) + 1 tab cho mỗi con trực tiếp. Tách riêng thành hàm dùng chung vì cần dùng ở 2 nơi: twCategoryTabs() (tài
 khoản xem theo trục TW) VÀ renderIndicators()/renderCategoryGrid() (tài khoản đăng nhập SCOPED thẳng vào 1
 office cụ thể, currentOfficeId — VD tài khoản "Ban Tổ chức Trung ương" tự nó cũng phải lên tab con 9 Vụ+2
 Cục+1 VP giống hệt kiểu tab "Tất cả/4 trục" của tài khoản Thành ủy, không phải chỉ gộp phẳng 1 danh sách). */
 /* Tab đầu tiên gộp cả cây con — đổi nhãn thành "🌐 Tất cả" thay vì tên đơn vị gốc (VD "Ban Tổ chức Trung
 ương"), cho đúng đúng ý nghĩa thật của nó (gộp hết 9 Vụ+2 Cục+1 VP) và khớp đúng kiểu tab "🌐 Tất cả" của tài
 khoản Thành ủy — tránh hiểu lầm tưởng đây là chỉ tiêu riêng của mỗi "Ban Tổ chức Trung ương". */
 function twChildTabs(node){
 return [{key:node.officeId,label:'🌐 Tất cả',ids:twCollectIds(node,[])}, ...node.children().map(c=>({key:c.officeId,label:c.label,ids:twCollectIds(c,[])}))];
 }
 function twCategoryTabs(role){
 /* Lọc chỉ giữ node có officeId thật (type:'office') — nhánh "Thành phố" mới trong TW_CP (type:'branch',
 xem TW_CITY_GROUPS) không phải 1 nhóm chỉ tiêu, không nên thành tab rỗng ở đây. */
 const top=(TW_ORG_TREE[role]||[]).filter(t=>t.officeId);
 if(top.length===1 && typeof top[0].children==='function') return twChildTabs(top[0]);
 if(top.length>1) return top.map(t=>({key:t.officeId,label:t.label,ids:twCollectIds(t,[])}));
 return null;
 }
 function renderCategoryGrid(){
 const grid=document.getElementById('indicatorGrid'); if(!grid) return;
 const q=(document.getElementById('categorySearch')?.value||'').toLowerCase();
 const scoped=scopedSingleCategory();
 if(scoped){
 const scopedNode=isTwRole(currentRole)?findTwNode(currentRole,currentOfficeId):null;
 if(scopedNode && typeof scopedNode.children==='function'){
 /* Đang ở office "cấp trên" (còn tab con) — hiện dạng lưới thẻ ĐƠN VỊ (badge số chỉ tiêu + tên + mini-chart,
 bấm vào mở drawer chi tiết qua openCategoryDetail) đúng kiểu màn "Nhóm chỉ tiêu theo lĩnh vực" của tài khoản
 Thành ủy, thay vì list phẳng từng chỉ tiêu — vì 1 tab ở đây có thể gồm nhiều đơn vị con/cháu cùng lúc. */
 const subTabs=twChildTabs(scopedNode);
 const activeGroup=subTabs.find(g=>g.key===activeCategorySubGroup)||subTabs[0];
 const allCats=categorySeedForRole(currentRole);
 const cats=activeGroup.ids.map(id=>allCats.find(c=>c.id===id)).filter(Boolean).map(c=>({...c,role:currentRole}));
 const filtered=cats.filter(c=>!q || c.name.toLowerCase().includes(q));
 /* Badge loại đơn vị (Vụ/Cục/Văn phòng/Phòng/Ban) đứng cạnh badge số chỉ tiêu — suy trực tiếp từ chữ đầu tên
 đơn vị, không cần thêm field riêng trong dữ liệu. Giúp phân biệt nhanh khi lưới có nhiều loại đơn vị trộn lẫn
 (VD tab "Ban Tổ chức Trung ương" gộp cả 9 Vụ + 2 Cục + 1 Văn phòng ban cùng lúc). */
 const twOfficeTypeLabel=name=>{ const m=/^(Vụ|Cục|Văn phòng|Phòng|Ban)\b/.exec(name||''); return m?m[1]:'Đơn vị'; };
 grid.innerHTML=filtered.map(c=>(CAT_CARD_LIST_STYLE&&!catHasOwnUi(c))
 ? catListCardHtml(c.name,c.desc,catUnitRows(c),`openCategoryDetail('${c.role}','${c.id}')`,CAT_CARD_SHOW_META?`<div class="field-category-meta"><span class="badge gold">${esc(twOfficeTypeLabel(c.name))}</span><span class="badge">${c.items.length} chỉ tiêu</span></div>`:'')
 : `<button class="field-category-card" onclick="openCategoryDetail('${c.role}','${c.id}')"><div class="field-category-meta"><span class="badge gold">${esc(twOfficeTypeLabel(c.name))}</span><span class="badge">${c.items.length} chỉ tiêu</span></div><h4>${esc(c.name)}</h4>${soCategoryPreviewHtml(c)}</button>`).join('') || '<div class="access-lock">Không có đơn vị phù hợp bộ lọc.</div>';
 return;
 }
 /* Đơn vị đã khai báo khuôn mới (ctm-engine.js): băng tổng quan rộng cả hàng thay cho lưới thẻ từng chỉ tiêu cũ. Tắt CTM_ENABLED để quay về lưới cũ. */
 if(typeof ctmHandles==='function' && ctmHandles(scoped.id)){ grid.innerHTML=ctmBandHtml(scoped); return; }
 const apiFetch=apiCategoryFetcher(scoped.id);
 if(apiFetch){
 grid.innerHTML='<div class="access-lock">Đang tải dữ liệu từ API...</div>';
 apiFetch().then(kpis=>{
 if(!kpis){ grid.innerHTML='<div class="access-lock">Không tải được dữ liệu từ API.</div>'; return; }
 const filteredKpis=kpis.map((k,idx)=>[idx,k]).filter(([,k])=>!q || k.label.toLowerCase().includes(q));
 grid.innerHTML=filteredKpis.length
 ? filteredKpis.map(([idx,k])=>apiKpiGridCardHtml(k,idx,scoped.role,scoped.id)).join('')
 : '<div class="access-lock">Không có chỉ tiêu phù hợp bộ lọc.</div>';
 });
 return;
 }
 const entries=(scoped.items||[]).map((it,idx)=>[idx,it]).filter(([,it])=>!q || it[0].toLowerCase().includes(q));
 grid.innerHTML=entries.length?entries.map(([idx,it])=>soItemCardHtml(scoped,idx,it)).join(''):'<div class="access-lock">Không có chỉ tiêu phù hợp bộ lọc.</div>';
 return;
 }
 const roles=allowedCategoryRoles();
 const sourceRoles=activeCategoryRole==='ALL'?roles:[activeCategoryRole];
 let cats=[]; sourceRoles.forEach(r=>categorySeedForRole(r).forEach(c=>cats.push({...c,role:r})));
 const subGroups=(activeCategoryRole!=='ALL'&&isTwRole(activeCategoryRole))?twCategoryTabs(activeCategoryRole):null;
 if(subGroups&&activeCategorySubGroup){
 const activeGroup=subGroups.find(g=>g.key===activeCategorySubGroup);
 if(activeGroup) cats=cats.filter(c=>activeGroup.ids.includes(c.id));
 }
 const filtered=cats.filter(c=>!q || c.name.toLowerCase().includes(q));
 /* Trục UBND cấp Thành phố: màn tổng quan theo giao diện mới (ubnd-overview.js) thay lưới thẻ bên dưới; bấm thẻ vẫn
    mở chi tiết sở như cũ. Tắt bằng cờ UBND_OVERVIEW_ENABLED=false để quay về lưới thẻ cũ. */
 if(typeof ubndOverviewApplies==='function' && ubndOverviewApplies(sourceRoles) && !subGroups){ grid.innerHTML=ubndOverviewHtml(filtered); return; }
 /* Các trục, cấp đã khai báo màn ngoài khuôn mới (ctm-engine.js: ctmRegisterOverview). Tắt CTM_OVERVIEW_ENABLED để quay về lưới thẻ cũ. */
 if(typeof ctmOverviewFor==='function' && !subGroups){ const ctmOv=ctmOverviewFor(sourceRoles); if(ctmOv){ grid.innerHTML=ctmOverviewHtml(ctmOv,filtered); return; } }
 grid.innerHTML=filtered.length?filtered.map(c=>{
 const roleBadge=`<span class="badge ${c.role==='UBND'?'ok':c.role==='HDND'?'gold':c.role==='MTTQ'?'':'red'}">${roleMeta(c.role).icon||''} ${roleAxisLabel(c.role)}</span>`;
 const apiFetch=apiCategoryFetcher(c.id);
 if(apiFetch){
 const cardId='catCard_'+c.id.replace(/[^a-zA-Z0-9]/g,'_');
 apiFetch().then(items=>{
 const el=document.getElementById(cardId); if(!el)return;
 const countBadge=el.querySelector('.field-category-count');
 const preview=el.querySelector('.api-cat-preview');
 if(!items){ if(countBadge)countBadge.textContent='—'; if(preview)preview.outerHTML='<div class="access-lock" style="height:100%">Không tải được dữ liệu từ API.</div>'; return; }
 if(countBadge)countBadge.textContent=`${items.length} chỉ tiêu`;
 if(preview)preview.outerHTML=apiCategoryPreviewHtml(items);
 });
 return `<button class="field-category-card" id="${cardId}" onclick="openCategoryDetail('${c.role}','${c.id}')"><div class="field-category-meta">${roleBadge}<span class="badge field-category-count">Đang tải...</span></div><h4>${c.name}</h4><div class="api-cat-preview access-lock" style="height:100%">Đang tải dữ liệu từ API...</div></button>`;
 }
 if(CAT_CARD_LIST_STYLE && !catHasOwnUi(c)) return catListCardHtml(c.name,c.desc,catUnitRows(c),`openCategoryDetail('${c.role}','${c.id}')`,CAT_CARD_SHOW_META?`<div class="field-category-meta">${roleBadge}<span class="badge">${c.items.length} chỉ tiêu</span></div>`:'');
 return `<button class="field-category-card" onclick="openCategoryDetail('${c.role}','${c.id}')"><div class="field-category-meta">${roleBadge}<span class="badge">${c.items.length} chỉ tiêu</span></div><h4>${c.name}</h4>${soCategoryPreviewHtml(c)}</button>`;
 }).join(''):'<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>';
 }
 function setFieldCategoryRole(role){activeCategoryRole=role; renderIndicators();}
 /* Nút ⛶ ở đầu khung "Nhóm chỉ tiêu theo lĩnh vực": phóng khung ra toàn màn hình (cùng cách nút toàn màn hình của bản đồ
    GIS — lớp CSS cố định, không dùng Fullscreen API của trình duyệt). Bấm lại hoặc Esc để thu về. Lớp phủ đặt dưới
    drawer/popup chi tiết (z-index 85) nên bấm thẻ sở khi đang phóng to vẫn mở chi tiết lên trên. */
 function indicatorsToggleFullscreen(btn){
 const w=document.getElementById('indicatorsWidget'); if(!w) return;
 const on=w.classList.toggle('ind-fs-active');
 const b=btn||w.querySelector('.ind-fs-btn');
 if(b){ const t=on?'Thu nhỏ về khung cũ (Esc)':'Phóng to toàn màn hình'; b.title=t; b.setAttribute('aria-label',t); b.setAttribute('aria-pressed',on?'true':'false'); }
 if(typeof lockScroll==='function'&&typeof unlockScroll==='function'){ if(on) lockScroll(); else unlockScroll(); }
 if(on) document.addEventListener('keydown',indicatorsFsEsc); else document.removeEventListener('keydown',indicatorsFsEsc);
 }
 /* Esc chỉ thu khung khi không có drawer/popup chi tiết nào đang mở phía trên (Esc lúc đó để đóng popup). */
 function indicatorsFsEsc(e){
 if(e.key!=='Escape') return;
 if(document.querySelector('#drawer.open,#modal.open')) return;
 const w=document.getElementById('indicatorsWidget');
 if(w&&w.classList.contains('ind-fs-active')) indicatorsToggleFullscreen();
 }

 /* Lớp 1: dải KPI tổng quan cho toàn bộ lĩnh vực/chỉ tiêu đang được phép xem */
 function renderIndicatorKpiRow(){
 const row=document.getElementById('indicatorKpiRow'); if(!row) return;
 const roles=allowedCategoryRoles();
 const scoped=scopedSingleCategory();
 const cats=scoped?[scoped]:[]; if(!scoped) roles.forEach(r=>categorySeedForRole(r).forEach(c=>cats.push({...c,role:r})));
 const isApiScoped=scoped && apiCategoryFetcher(scoped.id);
 const totalItems=isApiScoped?null:cats.reduce((s,c)=>s+c.items.length,0);
 const totalRecords=(isApiScoped||(scoped&&scoped.stc&&typeof TC_SHOW_LEGACY!=='undefined'&&!TC_SHOW_LEGACY)||(scoped&&scoped.sgd&&typeof SGD_SHOW_LEGACY!=='undefined'&&!SGD_SHOW_LEGACY)||(scoped&&scoped.hcc))?null:cats.reduce((s,c)=>s+catTotal(c),0);
 const tiles=[
 {label:'Lĩnh vực',value:fmt(cats.length)},
 {label:'Chỉ tiêu con',value:totalItems==null?'—':fmt(totalItems)},
 {label:'Tổng bản ghi',value:totalRecords==null?'—':fmt(totalRecords)},
 {label:'Trục quản lý',value:fmt(scoped?1:roles.length)}
 ];
 row.innerHTML=tiles.map(t=>`<div class="indicator-kpi-tile"><p class="ikt-label">${t.label}</p><p class="ikt-value">${t.value}</p></div>`).join('');
 }

 function renderIndicators(){
 const tabs=document.getElementById('indicatorRoleTabs'); const grid=document.getElementById('indicatorGrid');
 if(!tabs||!grid) return;
 const scoped=scopedSingleCategory();
 if(scoped){
 /* Tài khoản đăng nhập scoped thẳng vào 1 office cấp Trung ương (currentOfficeId) mà office đó còn đơn vị con
 bên trong (VD "Ban Tổ chức Trung ương" -> 9 Vụ+2 Cục+1 VP) thì lên hàng tab con y hệt kiểu "Tất cả/4 trục"
 của tài khoản Thành ủy — không gộp phẳng hết vào 1 danh sách chỉ tiêu như trước. Office không có con (VD 1 Vụ,
 1 phòng cụ thể) thì vẫn giữ nguyên khung nhỏ 1 badge như cũ. */
 const scopedNode=isTwRole(currentRole)?findTwNode(currentRole,currentOfficeId):null;
 if(scopedNode && typeof scopedNode.children==='function'){
 const subTabs=twChildTabs(scopedNode);
 if(!activeCategorySubGroup||!subTabs.some(g=>g.key===activeCategorySubGroup)) activeCategorySubGroup=subTabs[0].key;
 const prevQ=document.getElementById('categorySearch')?.value||'';
 const mainTabsHtml=subTabs.map(g=>`<button class="${activeCategorySubGroup===g.key?'active':''}" onclick="setFieldCategorySubGroup('${g.key}')">${esc(g.label)}</button>`).join('');
 tabs.innerHTML=`<div class="field-category-toolbar"><div class="field-category-tabs" id="fieldCategoryTabsRow">${mainTabsHtml}</div><div class="field-category-search"><input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" /></div></div>`;
 if(prevQ) document.getElementById('categorySearch').value=prevQ;
 fitFieldCategoryTabsOverflow();
 } else {
 activeCategorySubGroup=null;
 tabs.innerHTML=`<div class="field-category-toolbar"><span class="badge ok"> ${esc(scoped.name)}</span></div>`;
 }
 renderIndicatorKpiRow();
 renderCategoryGrid();
 return;
 }
 const roles=allowedCategoryRoles();
 /* Tài khoản xã/phường đại diện cho cả 4 trục của xã nên cũng có tab "Tất cả" (màn ngoài gộp 4 trục, ctm-xa-units.js). Tắt CTM_XA_ALL_TAB để bỏ. */
 const canSeeAll=currentRole==='DANG'||currentRole==='TW_ALL'||(currentXaId!=null && typeof CTM_XA_ALL_TAB!=='undefined' && CTM_XA_ALL_TAB);
 if(activeCategoryRole==='ALL'){ if(!canSeeAll) activeCategoryRole=roles[0]; }
 else if(!roles.includes(activeCategoryRole)) activeCategoryRole=canSeeAll?'ALL':roles[0];
 const prevQ=document.getElementById('categorySearch')?.value||'';
 /* Nhóm con — chỉ tính khi tab trục đang chọn (không phải "Tất cả") là 1 trục TW có đơn vị lồng nhau (xem
 twCategoryTabs). Không lưu lựa chọn cũ giữa các trục khác nhau — mỗi lần đổi tab trục thì mặc định lại đúng
 nhóm đầu tiên, tránh giữ nhầm 1 key không thuộc trục mới. */
 const subGroups=(activeCategoryRole!=='ALL'&&isTwRole(activeCategoryRole))?twCategoryTabs(activeCategoryRole):null;
 /* Khi tài khoản chỉ có ĐÚNG 1 trục để xem (không có "Tất cả", không có trục khác để chuyển) thì bản thân hàng
 tab trục chỉ còn đúng 1 nút — không mang thông tin gì (bấm cũng không đổi được gì) nên KHÔNG hiển thị hàng đó
 nữa. Thay vào đó, nhóm con (nếu có) lên thẳng làm hàng tab CHÍNH, cùng 1 kiểu với hàng tab trục bình thường
 (VD "Tất cả/Thành ủy/HĐND/UBND/MTTQ" của tài khoản Thành ủy) — không phải hàng tab phụ nhỏ hơn nữa. */
 const soloRoleWithSubGroups=!canSeeAll && roles.length===1 && subGroups;
 let mainTabsHtml, subHtml='';
 if(soloRoleWithSubGroups){
 if(!activeCategorySubGroup||!subGroups.some(g=>g.key===activeCategorySubGroup)) activeCategorySubGroup=subGroups[0].key;
 mainTabsHtml=subGroups.map(g=>`<button class="${activeCategorySubGroup===g.key?'active':''}" onclick="setFieldCategorySubGroup('${g.key}')">${esc(g.label)}</button>`).join('');
 } else {
 mainTabsHtml=`${canSeeAll?`<button class="${activeCategoryRole==='ALL'?'active':''}" onclick="setFieldCategoryRole('ALL')">🌐 Tất cả</button>`:''}${roles.map(r=>`<button class="${activeCategoryRole===r?'active':''}" onclick="setFieldCategoryRole('${r}')">${roleMeta(r).icon||''} ${roleAxisLabel(r)}</button>`).join('')}`;
 if(subGroups){
 if(!activeCategorySubGroup||!subGroups.some(g=>g.key===activeCategorySubGroup)) activeCategorySubGroup=subGroups[0].key;
 subHtml=`<div class="field-category-subtabs">${subGroups.map(g=>`<button data-key="${g.key}" class="${activeCategorySubGroup===g.key?'active':''}" onclick="setFieldCategorySubGroup('${g.key}')">${esc(g.label)}</button>`).join('')}</div>`;
 } else {
 activeCategorySubGroup=null;
 }
 }
 tabs.innerHTML=`<div class="field-category-toolbar"><div class="field-category-tabs" id="fieldCategoryTabsRow">${mainTabsHtml}</div><div class="field-category-search"><input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" /></div>${subHtml}</div>`;
 if(prevQ) document.getElementById('categorySearch').value=prevQ;
 fitFieldCategoryTabsOverflow();
 renderIndicatorKpiRow();
 renderCategoryGrid();
 }
 function setFieldCategorySubGroup(key){activeCategorySubGroup=key; renderIndicators();}
 /* Hàng tab lĩnh vực/đơn vị (.field-category-tabs) giờ CHỈ 1 DÒNG (CSS flex-wrap:nowrap;overflow:hidden) — khi
 tab nhiều/dài quá không vừa 1 hàng (VD 13 tab của Ban Tổ chức Trung ương: chính nó + 9 Vụ + 2 Cục + 1 VP),
 hàm này đo bề rộng thật rồi cắt bớt các tab cuối dòng vào nút "⋯ N khác ▾" mở dropdown nhỏ (giữ nguyên tab đầu
 tiên luôn hiển thị vì thường là "Tất cả"/đơn vị gốc). Dùng chung cho MỌI hàng .field-category-tabs (tab
 trục Thành ủy/HĐND/UBND/MTTQ, tab trục TW, tab đơn vị con TW) — không cần biết nội dung/onclick từng nút vì
 chỉ CLONE nguyên nút đã render (kể cả onclick inline) sang menu, không phải build lại HTML riêng. */
 function fitFieldCategoryTabsOverflow(){
 const row=document.getElementById('fieldCategoryTabsRow'); if(!row) return;
 const oldMore=row.querySelector('.field-category-more-wrap'); if(oldMore) oldMore.remove();
 const buttons=[...row.querySelectorAll(':scope > button')];
 buttons.forEach(b=>b.style.display='');
 if(buttons.length<2) return;
 const rowWidth=row.clientWidth;
 const gap=parseFloat(getComputedStyle(row).gap)||6;
 const widths=buttons.map(b=>b.getBoundingClientRect().width);
 const totalWidth=widths.reduce((s,w)=>s+w,0)+gap*(widths.length-1);
 if(totalWidth<=rowWidth+1) return;
 const moreWrap=document.createElement('div');
 moreWrap.className='field-category-more-wrap';
 moreWrap.innerHTML='<button type="button" class="field-category-more-btn" onclick="toggleFieldCategoryMoreMenu(event)">... <span class="fcm-count">0</span> khác ▾</button><div class="field-category-more-menu"></div>';
 row.appendChild(moreWrap);
 const moreBtnWidth=moreWrap.querySelector('.field-category-more-btn').getBoundingClientRect().width;
 const budget=rowWidth-moreBtnWidth-gap;
 let used=0, cutIndex=0;
 for(let i=0;i<buttons.length;i++){
 const w=widths[i]+(i>0?gap:0);
 if(i===0 || used+w<=budget){ used+=w; cutIndex=i+1; } else break;
 }
 if(cutIndex>=buttons.length){ moreWrap.remove(); return; }
 const hidden=buttons.slice(cutIndex);
 hidden.forEach(b=>b.style.display='none');
 const menu=moreWrap.querySelector('.field-category-more-menu');
 let hasActiveHidden=false;
 hidden.forEach(b=>{
 const clone=b.cloneNode(true); clone.style.display='';
 if(clone.classList.contains('active')) hasActiveHidden=true;
 menu.appendChild(clone);
 });
 moreWrap.querySelector('.fcm-count').textContent=hidden.length;
 moreWrap.querySelector('.field-category-more-btn').classList.toggle('active',hasActiveHidden);
 }
 function toggleFieldCategoryMoreMenu(e){
 e.stopPropagation();
 const btn=e.currentTarget;
 const menu=btn.parentElement.querySelector('.field-category-more-menu');
 const willOpen=!menu.classList.contains('open');
 document.querySelectorAll('.field-category-more-menu.open').forEach(m=>m.classList.remove('open'));
 if(willOpen){
 const r=btn.getBoundingClientRect();
 menu.style.top=(r.bottom+6)+'px';
 menu.style.right=(window.innerWidth-r.right)+'px';
 menu.style.left='auto';
 menu.classList.add('open');
 }
 }
 document.addEventListener('click',e=>{ if(!e.target.closest('.field-category-more-wrap')) document.querySelectorAll('.field-category-more-menu.open').forEach(m=>m.classList.remove('open')); });
 /* Dùng capture:true để bắt được scroll ở BẤT KỲ vùng cuộn nào trong trang (kể cả widget-body/drawer đang cuộn),
 nhưng chính vì bắt ở capture nên phải LOẠI TRỪ scroll xảy ra bên trong chính cái menu đang mở (menu tự
 overflow-y:auto để cuộn danh sách dài) — nếu không, cuộn xem thêm mục trong menu cũng bị tính là "cuộn trang"
 và tự đóng luôn menu ngay khi vừa cuộn được 1 chút. */
 document.addEventListener('scroll',e=>{ if(e.target && e.target.closest && e.target.closest('.field-category-more-menu')) return; document.querySelectorAll('.field-category-more-menu.open').forEach(m=>m.classList.remove('open')); },true);
 let fieldCategoryTabsResizeTimer=null;
 window.addEventListener('resize',()=>{
 clearTimeout(fieldCategoryTabsResizeTimer);
 fieldCategoryTabsResizeTimer=setTimeout(()=>{ if(document.getElementById('fieldCategoryTabsRow')) fitFieldCategoryTabsOverflow(); },150);
 });

 /* Chi tiết 1 lĩnh vực: donut tổng + danh sách chỉ tiêu con dạng thanh ngang (bar theo trạng thái) */
 const CAT_ST=[
 {k:'done', l:'Đã hoàn thành', c:'#2fb174'},
 {k:'doing',l:'Đang thực hiện', c:'#2c7dd2'},
 {k:'regular',l:'Vượt chỉ tiêu',c:'#39d5ff'},
 {k:'soon', l:'Chưa bắt đầu', c:'#d8a50c'},
 {k:'risk', l:'Tạm dừng', c:'#d25a19'},
 {k:'overdue',l:'Không đạt', c:'#ef4444'}
 ];
 /* Phân bố trạng thái theo trọng số + seed (thay cho chia đều CAT_ST[(i+idx)%6] khiến 6 nhóm luôn ra số bằng nhau).
 Trọng số xoay vòng theo seed (thường = idx của chỉ tiêu) để mỗi chỉ tiêu có 1 "hình dạng" số liệu riêng — nhóm nào
 chiếm đa số/thiểu số khác nhau — nhưng vẫn xác định (không Math.random) nên số liệu ổn định qua các lần render lại. */
 function weightedStatusForIndex(i,seed){
 const baseWeights=[38,26,14,12,7,3];
 const n=CAT_ST.length, rot=((seed%n)+n)%n;
 const weights=baseWeights.map((_,k)=>baseWeights[(k+n-rot)%n]);
 const total=weights.reduce((a,b)=>a+b,0);
 const h=((i*2654435761+seed*40503)>>>0)%total;
 let acc=0;
 for(let k=0;k<n;k++){acc+=weights[k]; if(h<acc) return CAT_ST[k];}
 return CAT_ST[n-1];
 }
 function catStatusInfo(k){return CAT_ST.find(s=>s.k===k)||{k,l:k,c:'#7a9ab8'};}
 /* Trạng thái đạt mục tiêu của 1 bản ghi chỉ tiêu (khác trạng thái luồng xử lý nhiệm vụ ở statusDefs) — dùng chung
 CAT_ST, bọc lại đúng hình dạng {key,label,short,color} để tái dùng ở các nơi vốn gọi statusMeta(). */
 function indicatorStatusMeta(k){const s=catStatusInfo(k); return {key:s.k,label:s.l,short:s.l,color:s.c};}
 function indicatorRecordsFor(role,name){return indicatorRecords.filter(r=>r.role===role&&r.indicator===name);}

 /* Banner cảnh báo lĩnh vực có số liệu chưa đồng nhất giữa các nguồn (Excel/CSDL/API...) */
 const categoryDataIssues={
 'ubnd-gddt':'Số liệu học sinh, giáo viên toàn ngành đang tổng hợp từ báo cáo các Phòng/Sở GD-ĐT theo quận huyện; đối chiếu sơ bộ giữa các nguồn cho thấy chênh lệch khoảng 5-7% — cần chuẩn hóa về một nguồn trước khi công bố chính thức.',
 'ubnd-taichinh':'Số liệu thu-chi ngân sách giữa CSDL kế toán Thành phố và báo cáo tổng hợp cấp trên đang lệch nhẹ theo kỳ báo cáo (do thời điểm chốt số khác nhau) — cần đối soát trước khi công bố cuối kỳ.',
 'dang-to-chuc':'Số lượng đảng viên giữa sổ theo dõi Excel nội bộ khối Đảng và CSDL đảng viên Thành ủy chưa khớp hoàn toàn — đang rà soát, cập nhật.'
 };


