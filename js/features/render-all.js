 /* ============================== RENDER ALL / KHỞI ĐỘNG ============================== */
 function headerScopeName(){
 if(isTwRole(currentRole)) return roleMeta(currentRole).name||currentAccount.title;
 if(currentXaId!=null){ const name=wardNames()[Number(currentXaId)]; return name||currentAccount.title; }
 if(currentSoId){ const cat=(categorySeed.UBND||[]).find(c=>c.id===currentSoId); return cat?cat.name:currentAccount.title; }
 if(currentOfficeId){ const found=findOfficeCategory(currentOfficeId); return found?found.cat.name:currentAccount.title; }
 return roleMeta(currentRole)?.fullName||'Thành ủy Hà Nội';
 }
 /* Cấp Trung ương chưa có dữ liệu chỉ tiêu/nhiệm vụ/GIS thật (toàn bộ mock data trong file chỉ dựng cho
 Thành phố Hà Nội) — thay vì gọi các hàm render* vốn giả định currentRole ∈ {DANG,HDND,UBND,MTTQ} (sẽ lỗi/sai
 số liệu), hiện 1 màn "đang chờ dữ liệu" gọn gàng nhưng vẫn giữ đúng sidebar cơ cấu tổ chức + định danh tài khoản. */
 /* Widget "Nhiệm vụ giao/nhận", "Bản đồ GIS", "Notify", "Nguồn dữ liệu" là mock riêng cho Hà Nội (tọa độ GIS,
 sinh nhiệm vụ giả lập theo segmentTemplate/taskTitlePool của 4 trục Thành phố...) — không áp dụng được cho
 cấp Trung ương nên vẫn để "chưa có dữ liệu". Widget "Chỉ tiêu" thì KHÔNG đụng ở đây nữa — để renderIndicators()
 tự render thật (card/lưới/breakdown) cho đơn vị đang xem, vì đã wiring xong categorySeedForRole()/scopedSingleCategory(). */
 /* Bản đồ GIS: mọi tài khoản — kể cả các trục Trung ương — đều dùng chung 1 pipeline buildGisScopeData()/
 initGisMap() như Thành phố. Cấp Trung ương chưa có eForm thật riêng nên rơi vào đúng nhánh "sinh dữ liệu ước
 tính theo seed tài khoản" (isCityWide=false trong buildGisScopeData) giống hệt 1 xã/phường/sở chưa có dữ liệu
 thật — không còn hiện "chưa có dữ liệu" cứng cho riêng khối Trung ương nữa. */
 function renderAll(){
 document.getElementById('currentIcon').innerHTML=`<i class="ti ${roleIconClass(currentRole)}" aria-hidden="true"></i>`;
 document.getElementById('currentRoleName').textContent=currentAccount.title;
 document.getElementById('currentRoleDesc').textContent=currentAccount.subtitle;
 /* Trục "BCH Trung ương Đảng" (tài khoản twdang lẫn tài khoản phòng/ban ban-tw-dang-btc đều có role TW_DANG,
 xem central-level.js:19) — riêng trục này dùng tên gọi cố định theo đúng ngành, không theo khuôn IOC/CAD chung. */
 document.getElementById('appBrandTitle').textContent=currentRole==='TW_DANG'
 ? 'TRUNG TÂM ĐIỀU HÀNH THÔNG MINH NGÀNH TỔ CHỨC XÂY DỰNG ĐẢNG'
 : `TRUNG TÂM ĐIỀU HÀNH IOC/CAD ${headerScopeName().toUpperCase()}`;
 /* Logo theo cấp tài khoản: Trung ương giữ logo gốc (images.png), từ Thành phố trở xuống (Đảng ủy/HĐND/UBND/MTTQ/
 sở/xã-phường) đổi sang logo images_HN.png. */
 const crestImg=document.getElementById('appCrestImg');
 if(crestImg) crestImg.src=isTwRole(currentRole)?'assets/images/images.png':'assets/images/images_HN.png';
 const banner=document.getElementById('viewAsBanner');
 if(window.__homeScope){
 banner.classList.remove('hidden');
 document.getElementById('viewAsBannerText').textContent=`🔎 Đang xem theo cơ cấu tổ chức: ${window.__viewingIcon||''} ${window.__viewingLabel||headerScopeName()} — tài khoản đăng nhập vẫn là ${currentAccount.title}.`;
 } else {
 banner.classList.add('hidden');
 }
 renderSideNav();
 renderRoleScope(); renderSummary(); renderMetricTabs(); renderAxisDashboard(); renderIndicators(); renderSources(); renderNotifications(); renderMyTasksNotify(); renderCad();
 initGisMap();
 if(typeof renderBtctwNationalMap==='function') renderBtctwNationalMap();
 if(typeof btctwEmbedSync==='function') btctwEmbedSync();
 if(typeof renderBtctwTaskTally==='function') renderBtctwTaskTally();
 }

 initLogin();
 initTheme();
