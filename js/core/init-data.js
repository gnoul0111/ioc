 /* ============================== KHỞI TẠO TOÀN BỘ DỮ LIỆU ============================== */
 function initData(){
 generateRecords();
 ensureCategoryIndicators();
 (categorySeed.UBND||[]).forEach(cat=>ensureFakeCategoryItems('UBND',cat.id));
 seedDefaultSubtasks();
 attachTasksToDocuments();
 /* Sau khi records[] đã có đủ — seed vài dòng "Cập nhật trạng thái" mẫu cho notify (my-tasks-notify.js), nếu
 không nhóm này luôn hiện 0 lúc mới mở trang (xem giải thích chi tiết tại seedNotiStatusLogDemo()). */
 seedNotiStatusLogDemo();
 }

