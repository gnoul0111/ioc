/* ===== Bộ btctw mới (thư mục btctw/) nhúng toàn màn hình cho tài khoản Ban Tổ chức Trung ương =====
   Bộ này là một sản phẩm riêng (khung btctw/index.html + 7 trang con trong iframe), dùng NGUYÊN VĂN, không sửa code bên trong.
   Màn cũ của role TW_DANG (bản đồ số toàn quốc, cây Vụ, chỉ tiêu...) KHÔNG xóa — chỉ bị che bởi lớp phủ này; đặt
   BTCTW_NEW_DASHBOARD = false để hiện lại màn cũ như trước.
   Phạm vi: tài khoản trục 'twdang' và tài khoản đơn vị 'ban-tw-dang-btc' (officeId 'tw-dang-btc'). Các Vụ/phòng bên
   trong BTC Trung ương (officeId sâu hơn) vẫn dùng màn cũ. */
const BTCTW_NEW_DASHBOARD = false;   // đã chuyển sang hướng viết lại code (không nhúng nguyên btctw/ nữa); giữ lại để tham chiếu
const BTCTW_NEW_SRC = 'btctw/index.html';
const BTCTW_NEW_OFFICE_IDS = [null, 'tw-dang-btc'];

function btctwEmbedWanted() {
  return BTCTW_NEW_DASHBOARD
    && typeof currentRole !== 'undefined' && currentRole === 'TW_DANG'
    && BTCTW_NEW_OFFICE_IDS.indexOf(currentOfficeId || null) >= 0;
}

/* Gọi từ renderAll() và logout(): bật/tắt lớp phủ theo tài khoản đang đăng nhập. Khung chỉ được tạo (và nạp trang)
   ở lần bật đầu tiên; các lần sau chỉ ẩn/hiện nên không phải tải lại. */
function btctwEmbedSync() {
  let box = document.getElementById('btctwEmbed');
  const want = btctwEmbedWanted();
  if (!want) { if (box) box.classList.add('hidden'); return; }
  if (!box) {
    box = document.createElement('div');
    box.id = 'btctwEmbed';
    box.className = 'btctw-embed';
    const fr = document.createElement('iframe');
    fr.title = 'Trung tâm điều hành thông minh ngành Tổ chức xây dựng Đảng';
    fr.src = BTCTW_NEW_SRC;
    box.appendChild(fr);
    document.body.appendChild(box);
  }
  box.classList.remove('hidden');
}
