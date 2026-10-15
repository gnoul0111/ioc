/* ===================== XÁC THỰC (token người đang đăng nhập) =====================
   Dùng CHUNG một luồng với các widget khác của trục btctw (tongquan/noti/chitieu):
   access_token SSO lấy từ `GET /api/token` của portal (same-origin, cookie session có sẵn),
   dùng lại token do iframe khác đã lưu ở localStorage `qlnv_jwt_access_token`, tự làm mới
   khi hết hạn hoặc khi API trả 401.

   Trước đây file này gắn cứng một JWT trong source cho mọi request đọc số liệu: token đó là
   của MỘT tài khoản cố định nên (1) mọi người xem đều đọc bằng quyền của tài khoản đó, (2) hết
   hạn là widget chết câm cho tới khi ai đó sửa source. Không thêm token cứng trở lại. */
function resolveApiBase() {
  var b = (typeof window !== 'undefined' && window.API_BASE) || '';
  b = String(b).trim().replace(/\/+$/, '');
  return b || location.origin;
}
/* Backend QLNV (cổng 360) — cấu hình qua window.urlAPI giống các script cùng trục, KHÔNG
   hardcode thêm hostname ở từng hằng API bên dưới. */
var QLNV_API = (typeof window !== 'undefined' && window.urlAPI) || 'https://iochn.hanoi.dcs.vn:360/api';
var QLNV_TOKEN_CFG = { proxyTokenUrl: resolveApiBase() + '/api/token' };

var QLNV_TOKEN_MAX_AGE_MS = 10 * 60 * 1000;
function _qlnvParseJwtExpMs(jwt) {
  try {
    var parts = String(jwt).split('.');
    if (parts.length < 2) return 0;
    var b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    var payload = JSON.parse(atob(b));
    if (!payload || !payload.exp) return 0;
    // CHẶN TRẦN hạn dùng lại. Token SSO trả exp xa vô lý (năm 13434) -> tin nguyên giá trị đó
    // thì nó nằm trong localStorage vĩnh viễn: người sau đăng nhập trên cùng máy vẫn gọi API
    // bằng token người trước. Trần ép lấy lại token từ /api/token (same-origin, rất rẻ).
    return Math.min(payload.exp * 1000, Date.now() + QLNV_TOKEN_MAX_AGE_MS);
  } catch (e) {
    return 0;
  }
}

function _qlnvPick(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var cur = obj, parts = keys[i].split('.'), ok = true;
    for (var j = 0; j < parts.length; j++) {
      if (cur && typeof cur === 'object' && parts[j] in cur) {
        cur = cur[parts[j]];
      } else {
        ok = false;
        break;
      }
    }
    if (ok && cur != null && cur !== '') return cur;
  }
  return '';
}

var _qlnvTokenState = { jwt: '', expMs: 0, inflight: null };

function _qlnvFetchProxyToken() {
  return fetch(QLNV_TOKEN_CFG.proxyTokenUrl, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
    .then(function (r) {
      if (!r.ok) throw new Error('Proxy token HTTP ' + r.status);
      return r.json();
    })
    .then(function (res) {
      var t = _qlnvPick(res, ['access_token', 'token', 'data.access_token']);
      if (!t) throw new Error('Proxy không trả access_token');
      return String(t);
    });
}

/* Token dùng chung cho mọi request của widget. opts.force = bỏ qua cache/localStorage
   (dùng khi API vừa trả 401). */
function getQlnvToken(opts) {
  opts = opts || {};
  var now = Date.now();
  if (!opts.force && _qlnvTokenState.jwt && now < _qlnvTokenState.expMs - 60000) {
    return Promise.resolve(_qlnvTokenState.jwt);
  }
  // Token do widget KHÁC (cùng origin: tongquan/noti/...) lấy trước đó — dùng lại thay vì
  // mỗi iframe tự xin riêng.
  if (!opts.force) {
    var shared = '';
    try { shared = localStorage.getItem('qlnv_jwt_access_token') || localStorage.getItem('qlnv_access_token') || ''; } catch (e) { }
    var sharedExp = shared ? _qlnvParseJwtExpMs(shared) : 0;
    if (shared && sharedExp && now < sharedExp - 60000) {
      _qlnvTokenState.jwt = shared;
      _qlnvTokenState.expMs = sharedExp;
      return Promise.resolve(shared);
    }
  }
  if (_qlnvTokenState.inflight) return _qlnvTokenState.inflight;
  var p = _qlnvFetchProxyToken().then(
    function (jwt) {
      _qlnvTokenState.jwt = jwt;
      _qlnvTokenState.expMs = _qlnvParseJwtExpMs(jwt) || Date.now() + 5 * 60000;
      _qlnvTokenState.inflight = null;
      try { localStorage.setItem('qlnv_jwt_access_token', jwt); } catch (e) { }
      return jwt;
    },
    function (err) {
      _qlnvTokenState.inflight = null;
      throw err;
    },
  );
  _qlnvTokenState.inflight = p;
  return p;
}

function clearQlnvToken() {
  _qlnvTokenState.jwt = '';
  _qlnvTokenState.expMs = 0;
  _qlnvTokenState.inflight = null;
}

/* fetch có Authorization của người đang đăng nhập + tự lấy token mới và thử lại ĐÚNG 1 LẦN
   khi server trả 401 (token trong localStorage của phiên trước đã bị thu hồi). */
async function ttFetch(url, opts, isRetry) {
  opts = opts || {};
  const token = await getQlnvToken({ force: !!isRetry });
  const res = await fetch(url, {
    ...opts,
    headers: { Accept: 'application/json', ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && !isRetry) {
    clearQlnvToken();
    return ttFetch(url, opts, true);
  }
  return res;
}

/* ===================== DỮ LIỆU MẪU =====================
   Mỗi nhiệm vụ: {t: tên, u: đơn vị chủ trì, da: đề án, ld: LĐ Ban phụ trách,
                  lo: loại văn bản, due: hạn (yyyy-mm-dd), s: trạng thái}
   s: done | ontime | late | routine                                       */
const TASKS = [
  { ma: "2026/BCT-001", t: "Tham mưu ban hành Quyết định Danh mục dữ liệu và từ điển dữ liệu HTTT lĩnh vực TCXDĐ", u: "Văn phòng Ban", da: "Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng", ld: "Đ/c Hà Minh Hải", lo: "Kế hoạch", due: "2026-08-31", s: "ontime" },
  { ma: "2026/BTCTW-002", t: "Phối hợp phát triển, mở rộng tính năng ứng dụng Sổ tay đảng viên điện tử", u: "Văn phòng Ban", da: "Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng", ld: "Đ/c Hà Minh Hải", lo: "Kế hoạch", due: "2026-08-14", s: "ontime" },
  { ma: "2026/BBT-003", t: "Xây dựng phương án bảo đảm an toàn thông tin hệ thống dùng chung của Ban", u: "Văn phòng Ban", da: "Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng", ld: "Đ/c Hà Minh Hải", lo: "Công văn", due: "2026-06-30", s: "late" },
  { ma: "2026/TW-004", t: "Tổng hợp, xây dựng báo cáo công tác tổ chức xây dựng Đảng 6 tháng đầu năm", u: "Văn phòng Ban", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Báo cáo", due: "2026-08-13", s: "ontime" },
  { ma: "2026/TX-005", t: "Rà soát chế độ báo cáo định kỳ của các đơn vị thuộc Ban", u: "Văn phòng Ban", da: "Công tác thường xuyên", ld: "Đ/c Hà Minh Hải", lo: "Công văn", due: "", s: "routine" },
  { ma: "2026/BCT-006", t: "Hoàn thiện quy chế làm việc của Ban nhiệm kỳ mới", u: "Văn phòng Ban", da: "Đề án Kiện toàn tổ chức bộ máy", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Quyết định", due: "2026-07-20", s: "late" },
  { ma: "2026/BTCTW-007", t: "Chuẩn bị nội dung phục vụ hội nghị giao ban quý III", u: "Văn phòng Ban", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Kế hoạch", due: "2026-08-15", s: "ontime" },
  { ma: "2026/BTCTW-008", t: "Nghiệm thu phần mềm quản lý văn bản điều hành nội bộ", u: "Văn phòng Ban", da: "Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng", ld: "Đ/c Hà Minh Hải", lo: "Quyết định", due: "2026-05-30", s: "done" },

  { ma: "2026/TW-009", t: "Phối hợp hoàn thiện dữ liệu Sổ tay đảng viên điện tử tại các đảng bộ trực thuộc", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Cơ sở dữ liệu tổ chức đảng, đảng viên", ld: "Đ/c Bùi Thị Quỳnh Vân", lo: "Kế hoạch", due: "2026-11-30", s: "ontime" },
  { ma: "2026/BCT-010", t: "Tổ chức làm sạch, chuẩn hóa, đối soát dữ liệu tổ chức đảng, đảng viên", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Cơ sở dữ liệu tổ chức đảng, đảng viên", ld: "Đ/c Bùi Thị Quỳnh Vân", lo: "Kế hoạch", due: "2026-09-10", s: "ontime" },
  { ma: "2026/BTCTW-011", t: "Rà soát, tái cấu trúc thủ tục hành chính của Đảng theo Quy định 338-QĐ/TW", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Cải cách thủ tục hành chính trong Đảng", ld: "Đ/c Bùi Thị Quỳnh Vân", lo: "Kế hoạch", due: "2026-09-30", s: "ontime" },
  { ma: "2026/TW-012", t: "Báo cáo kết quả cập nhật dữ liệu đảng viên phục vụ đại hội đảng bộ các cấp", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Đại hội đảng bộ các cấp", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Báo cáo", due: "2026-07-15", s: "late" },
  { ma: "2026/BTCTW-013", t: "Hướng dẫn nghiệp vụ chuyển sinh hoạt đảng trên môi trường điện tử", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Cải cách thủ tục hành chính trong Đảng", ld: "Đ/c Bùi Thị Quỳnh Vân", lo: "Hướng dẫn", due: "2026-08-16", s: "ontime" },
  { ma: "2026/TX-014", t: "Theo dõi tình hình phát triển đảng viên tại các đảng bộ trực thuộc", u: "Vụ Cơ sở đảng, đảng viên", da: "Công tác thường xuyên", ld: "Đ/c Bùi Thị Quỳnh Vân", lo: "Hướng dẫn", due: "", s: "routine" },
  { ma: "2026/BCT-015", t: "Sơ kết thực hiện Kết luận về nâng cao chất lượng sinh hoạt chi bộ", u: "Vụ Cơ sở đảng, đảng viên", da: "Đề án Nâng cao chất lượng tổ chức cơ sở đảng", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Báo cáo", due: "2026-06-10", s: "late" },

  { ma: "2026/BTCTW-016", t: "Phối hợp triển khai phân hệ cơ sở dữ liệu cán bộ", u: "Vụ Cán bộ", da: "Đề án Cơ sở dữ liệu cán bộ", ld: "Đ/c Nguyễn Thanh Bình", lo: "Kế hoạch", due: "2026-09-15", s: "ontime" },
  { ma: "2026/TW-017", t: "Hoàn thiện quy trình tiếp nhận, thẩm định hồ sơ cán bộ diện Trung ương quản lý", u: "Vụ Cán bộ", da: "Đề án Cơ sở dữ liệu cán bộ", ld: "Đ/c Nguyễn Thanh Bình", lo: "Quyết định", due: "2026-07-31", s: "late" },
  { ma: "2026/TX-018", t: "Cập nhật, duy trì dữ liệu cán bộ diện Trung ương quản lý trên hệ thống", u: "Vụ Cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Hướng dẫn", due: "", s: "routine" },
  { ma: "2026/BCT-019", t: "Xây dựng khung năng lực vị trí việc làm khối cơ quan tham mưu", u: "Vụ Cán bộ", da: "Đề án Vị trí việc làm", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Kế hoạch", due: "2026-08-15", s: "ontime" },
  { ma: "2026/BTCTW-020", t: "Tổng hợp kết quả đánh giá cán bộ năm 2025", u: "Vụ Cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Báo cáo", due: "2026-04-30", s: "done" },
  { ma: "2026/BCT-021", t: "Rà soát quy hoạch cán bộ cấp chiến lược nhiệm kỳ tới", u: "Vụ Cán bộ", da: "Đề án Quy hoạch cán bộ cấp chiến lược", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Kế hoạch", due: "2026-07-05", s: "late" },

  { ma: "2026/BTCTW-022", t: "Phối hợp triển khai phân hệ cơ sở dữ liệu tổ chức bộ máy, biên chế", u: "Vụ Tổ chức - Điều lệ", da: "Đề án Kiện toàn tổ chức bộ máy", ld: "Đ/c Hà Minh Hải", lo: "Kế hoạch", due: "2026-09-15", s: "ontime" },
  { ma: "2026/BBT-023", t: "Rà soát, hoàn thiện đề án vị trí việc làm của các đơn vị thuộc Ban", u: "Vụ Tổ chức - Điều lệ", da: "Đề án Vị trí việc làm", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Quyết định", due: "2026-06-20", s: "done" },
  { ma: "2026/TW-024", t: "Hướng dẫn thực hiện Điều lệ Đảng đối với tổ chức đảng trong doanh nghiệp", u: "Vụ Tổ chức - Điều lệ", da: "Công tác thường xuyên", ld: "Đ/c Hà Minh Hải", lo: "Hướng dẫn", due: "2026-08-14", s: "ontime" },
  { ma: "2026/TX-025", t: "Tổng hợp vướng mắc thi hành Điều lệ Đảng của các tỉnh ủy, thành ủy", u: "Vụ Tổ chức - Điều lệ", da: "Công tác thường xuyên", ld: "Đ/c Hà Minh Hải", lo: "Báo cáo", due: "", s: "routine" },
  { ma: "2026/BCT-026", t: "Xây dựng phương án sắp xếp tổ chức bộ máy khối cơ quan đảng địa phương", u: "Vụ Tổ chức - Điều lệ", da: "Đề án Kiện toàn tổ chức bộ máy", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Kế hoạch", due: "2026-07-10", s: "late" },

  { ma: "2026/BTCTW-027", t: "Phối hợp triển khai phân hệ cơ sở dữ liệu bảo vệ chính trị nội bộ", u: "Cục Bảo vệ chính trị nội bộ", da: "Đề án Chuyển đổi số công tác tổ chức xây dựng Đảng", ld: "Đ/c Nguyễn Thành Tâm", lo: "Kế hoạch", due: "2026-09-15", s: "ontime" },
  { ma: "2026/BTCTW-028", t: "Thẩm định tiêu chuẩn chính trị phục vụ công tác nhân sự đại hội", u: "Cục Bảo vệ chính trị nội bộ", da: "Đề án Đại hội đảng bộ các cấp", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Công văn", due: "2026-08-15", s: "ontime" },
  { ma: "2026/TX-029", t: "Rà soát hồ sơ chính trị cán bộ diện Trung ương quản lý", u: "Cục Bảo vệ chính trị nội bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thành Tâm", lo: "Hướng dẫn", due: "", s: "routine" },
  { ma: "2026/BCT-030", t: "Báo cáo chuyên đề công tác bảo vệ chính trị nội bộ quý II", u: "Cục Bảo vệ chính trị nội bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thành Tâm", lo: "Báo cáo", due: "2026-07-08", s: "late" },
  { ma: "2026/BTCTW-031", t: "Hoàn thiện quy trình phối hợp thẩm tra, xác minh với địa phương", u: "Cục Bảo vệ chính trị nội bộ", da: "Đề án Cải cách thủ tục hành chính trong Đảng", ld: "Đ/c Nguyễn Thành Tâm", lo: "Quyết định", due: "2026-06-25", s: "late" },

  { ma: "2026/TW-032", t: "Xây dựng kế hoạch bồi dưỡng cán bộ làm công tác tổ chức năm 2026", u: "Cục Đào tạo, bồi dưỡng cán bộ", da: "Đề án Đào tạo, bồi dưỡng cán bộ", ld: "Đ/c Nguyễn Thanh Bình", lo: "Kế hoạch", due: "2026-08-16", s: "ontime" },
  { ma: "2026/BTCTW-033", t: "Tổ chức lớp bồi dưỡng nghiệp vụ cho cán bộ tổ chức cấp huyện", u: "Cục Đào tạo, bồi dưỡng cán bộ", da: "Đề án Đào tạo, bồi dưỡng cán bộ", ld: "Đ/c Nguyễn Thanh Bình", lo: "Kế hoạch", due: "2026-10-15", s: "ontime" },
  { ma: "2026/BBT-034", t: "Báo cáo kết quả đào tạo, bồi dưỡng 6 tháng đầu năm", u: "Cục Đào tạo, bồi dưỡng cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Báo cáo", due: "2026-07-12", s: "late" },
  { ma: "2026/TX-035", t: "Theo dõi, cập nhật dữ liệu học viên trên hệ thống đào tạo", u: "Cục Đào tạo, bồi dưỡng cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Hướng dẫn", due: "", s: "routine" },

  { ma: "2026/TX-036", t: "Tổng hợp tình hình tổ chức bộ máy, biên chế của các tỉnh ủy, thành ủy", u: "Vụ Địa phương I", da: "Đề án Kiện toàn tổ chức bộ máy", ld: "Đ/c Trịnh Mạnh Linh", lo: "Hướng dẫn", due: "", s: "routine" },
  { ma: "2026/TW-037", t: "Theo dõi công tác chuẩn bị đại hội đảng bộ các tỉnh khu vực phía Bắc", u: "Vụ Địa phương I", da: "Đề án Đại hội đảng bộ các cấp", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Kế hoạch", due: "2026-08-14", s: "ontime" },
  { ma: "2026/BTCTW-038", t: "Báo cáo tình hình nhân sự cấp ủy các tỉnh khu vực miền Trung", u: "Vụ Địa phương II", da: "Đề án Đại hội đảng bộ các cấp", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Báo cáo", due: "2026-09-20", s: "ontime" },
  { ma: "2026/BCT-039", t: "Kiểm tra công tác tổ chức xây dựng Đảng tại 03 tỉnh khu vực miền Trung", u: "Vụ Địa phương II", da: "Công tác thường xuyên", ld: "Đ/c Trịnh Mạnh Linh", lo: "Kế hoạch", due: "2026-07-25", s: "late" },
  { ma: "2026/TX-040", t: "Theo dõi công tác cán bộ các tỉnh khu vực phía Nam", u: "Vụ Địa phương III", da: "Công tác thường xuyên", ld: "Đ/c Trịnh Mạnh Linh", lo: "Hướng dẫn", due: "", s: "routine" },
  { ma: "2026/BCT-041", t: "Tổng hợp kiến nghị của địa phương về công tác tổ chức cán bộ", u: "Vụ Địa phương III", da: "Công tác thường xuyên", ld: "Đ/c Trịnh Mạnh Linh", lo: "Báo cáo", due: "2026-08-16", s: "ontime" },

  { ma: "2026/BTCTW-042", t: "Nghiên cứu mô hình tổ chức bộ máy của một số nước", u: "Vụ Nghiên cứu khoa học tổ chức, cán bộ", da: "Đề án Nghiên cứu khoa học tổ chức", ld: "Đ/c Hà Minh Hải", lo: "Kế hoạch", due: "2026-11-15", s: "ontime" },
  { ma: "2026/BBT-043", t: "Hoàn thiện báo cáo tổng kết đề tài cấp ban về đánh giá cán bộ", u: "Vụ Nghiên cứu khoa học tổ chức, cán bộ", da: "Đề án Nghiên cứu khoa học tổ chức", ld: "Đ/c Hà Minh Hải", lo: "Báo cáo", due: "2026-07-18", s: "late" },
  { ma: "2026/TW-044", t: "Xây dựng chính sách hỗ trợ cán bộ sau sắp xếp tổ chức bộ máy", u: "Vụ Chính sách cán bộ", da: "Đề án Kiện toàn tổ chức bộ máy", ld: "Đ/c Nguyễn Thanh Bình", lo: "Kế hoạch", due: "2026-08-15", s: "ontime" },
  { ma: "2026/TX-045", t: "Tổng hợp vướng mắc thực hiện chính sách tinh giản biên chế", u: "Vụ Chính sách cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Báo cáo", due: "", s: "routine" },
  { ma: "2026/BCT-046", t: "Hướng dẫn thực hiện chế độ, chính sách đối với cán bộ nghỉ hưu trước tuổi", u: "Vụ Chính sách cán bộ", da: "Công tác thường xuyên", ld: "Đ/c Nguyễn Thanh Bình", lo: "Hướng dẫn", due: "2026-09-05", s: "ontime" },
  { ma: "2026/BTCTW-047", t: "Rà soát chế độ phụ cấp đối với cán bộ chuyên trách công tác đảng", u: "Vụ Chính sách cán bộ", da: "Đề án Chính sách cán bộ", ld: "Đ/c Nguyễn Duy Ngọc", lo: "Công văn", due: "2026-06-28", s: "late" }
];

const TODAY = new Date('2026-08-12');
const F = n => n.toLocaleString('vi-VN');
const dmy = d => d ? d.split('-').reverse().join('/') : '';
const days = d => Math.round((new Date(d) - TODAY) / 86400000);
const ST = [
  { k: 'done', l: 'Đã hoàn thành', c: 'var(--done)' },
  { k: 'ontime', l: 'Đang thực hiện – trong hạn', c: 'var(--ontime)' },
  { k: 'late', l: 'Đang thực hiện – quá hạn', c: 'var(--late)' },
  { k: 'routine', l: 'Nhiệm vụ thường xuyên', c: 'var(--routine)' }
];
const CAP = [
  { k: 'BTCTW', l: 'Trình Ban Tổ chức Trung ương' },
  { k: 'BCT', l: 'Trình Bộ Chính trị' },
  { k: 'BBT', l: 'Trình Ban Bí thư' },
  { k: 'TX', l: 'Nhiệm vụ thường xuyên' },
  { k: 'TW', l: 'Trình Trung ương' }
];
/* mã nhiệm vụ quyết định cấp trình — xét BTCTW trước vì chuỗi này chứa cả "TW" */
function capTrinh(r) {
  const m = (r.ma || '').toUpperCase();
  const hit = CAP.find(c => m.includes(c.k));
  return hit ? hit.l : 'Chưa xác định';
}
const DIMS = {
  unit: { f: 'u', n: 'theo đơn vị chủ trì' },
  cap: { fn: capTrinh, n: 'theo cấp trình' },
  ld: { f: 'ld', n: 'theo lãnh đạo phụ trách' },
  da: { f: 'da', n: 'theo đề án' }
};
let ldFilter = 'all';
/* controller dropdown "Văn bản giao" (gán ở initMultiSelect() cuối file) — khai báo sớm bằng "let" (không
   phải "const" ngay tại chỗ dùng) để fetchKpiSummary()/fetchTaskList()/fetchThongKe() truy cập an toàn
   ngay từ lần gọi đầu tiên (qua setKy('year') lúc tải trang, xảy ra TRƯỚC khi initMultiSelect() chạy) —
   nếu khai báo bằng const ngay tại vị trí gọi initMultiSelect() sẽ dính lỗi "truy cập biến trước khi khởi
   tạo" (temporal dead zone) vì đó là dòng code nằm SAU setKy('year') trong file. */
let vbgMsel = null;
/* dropdown "LĐ phụ trách" ở lớp 1 chỉ được dựng lại từ API ĐÚNG 1 LẦN (lần fetchKpiSummary() đầu tiên có
   dữ liệu thật) — các lần fetchKpiSummary() sau (đổi kỳ báo cáo, đổi ngày, đổi chính LĐ đang lọc...) KHÔNG
   được phép build lại danh sách này nữa, tránh dropdown bị dựng lại/đổi thứ tự mỗi lần gọi API tổng hợp. */
let ldOptionsBuiltFromApi = false;
/* drilldown lớp 2 — một chiều duy nhất tại một thời điểm:
   {dim:'unit'|'cap'|'status'|'soon'|'chuyenDoiSo', v: giá trị, label: hiển thị} */
let drill = null;
const STATUS_LB = {
  done: 'Đã hoàn thành', ontime: 'Đang thực hiện – Trong hạn',
  late: 'Đang thực hiện – Quá hạn', routine: 'Nhiệm vụ thường xuyên'
};
function matchDrill(r) {
  if (!drill) return true;
  if (drill.dim === 'unit') return r.u === drill.v;
  if (drill.dim === 'cap') return capTrinh(r) === drill.v;
  if (drill.dim === 'status') return r.s === drill.v;
  if (drill.dim === 'soon') return r.due && r.s !== 'done' && days(r.due) <= 3;
  if (drill.dim === 'chuyenDoiSo') return false;   /* không có field kế hoạch chuyển đổi số trong TASKS mẫu — không match cục bộ, chỉ dựa vào API */
  return true;
}
/* ---------- lọc dữ liệu ---------- */
function inRange(r) {
  const f = document.getElementById('from').value, t = document.getElementById('to').value;
  if (!r.due) return true;                    /* nhiệm vụ thường xuyên luôn hiển thị */
  return (!f || r.due >= f) && (!t || r.due <= t);
}
const rows = () => TASKS.filter(r => inRange(r)
  && (ldFilter === 'all' || r.ld === ldFilter)
  && matchDrill(r));

function tally(list) {
  const t = { total: list.length, done: 0, ontime: 0, late: 0, routine: 0 };
  list.forEach(r => t[r.s]++);
  return t;
}
function groups(dim) {
  const d = DIMS[dim], key = r => d.fn ? d.fn(r) : r[d.f], m = new Map();
  rows().forEach(r => {
    const k = key(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  });
  return [...m.entries()].map(([n, l]) => ({ n, ...tally(l) }))
    .sort((a, b) => b.total - a.total);
}

/* ---------- KPI ---------- */
/* dữ liệu tổng hợp lấy từ API GET /api/qlnv/v2/summary-kiem-dem; null = chưa tải xong / lỗi → dùng số tính từ TASKS mẫu */
let kpiSummary = null;
let isAllPeriod = false;   /* true khi đang chọn "Tất cả" — không gửi tu/den lên API */
const KIEM_DEM_API = `${QLNV_API}/qlnv/v2/summary-kiem-dem`;
/* yyyy-mm-dd (input date) → dd/mm/yyyy (API) */
const toApiDate = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
/* dd/mm/yyyy (API kiem-dem/get-task, field thoiHanHoanThanh) → yyyy-mm-dd, để tái dùng days()/dmy() sẵn có */
const fromApiDate = s => { if (!s) return ''; const [d, m, y] = s.split('/'); return `${y}-${m}-${d}`; };
async function fetchKpiSummary() {
  const params = new URLSearchParams();
  if (!isAllPeriod) {
    const tu = toApiDate(document.getElementById('from').value);
    const den = toApiDate(document.getElementById('to').value);
    if (tu) params.set('tu', tu);
    if (den) params.set('den', den);
  }
  const ldId = selectedLdId();
  if (ldId) params.set('ldPhuTrach', ldId);
  const vbg = vanBanGiaoParam();
  if (vbg) params.set('vanBanGiao', vbg);
  const qs = params.toString();
  try {
    const res = await ttFetch(qs ? `${KIEM_DEM_API}?${qs}` : KIEM_DEM_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    kpiSummary = await res.json();
  } catch (err) {
    console.error('Không tải được dữ liệu tổng hợp KPI, dùng số liệu mẫu cục bộ:', err);
    kpiSummary = null;
  }
  renderKPI();
  renderAll();
  /* chỉ dựng dropdown LĐ phụ trách từ API 1 LẦN DUY NHẤT (lần đầu có theoLanhDaoPhuTrach thật) — các lần
     fetchKpiSummary() sau (đổi kỳ báo cáo/ngày/LĐ đang lọc...) không được đổi lại danh sách này nữa */
  if (!ldOptionsBuiltFromApi && kpiSummary && kpiSummary.theoLanhDaoPhuTrach) {
    buildLdOptions();
    ldOptionsBuiltFromApi = true;
  }
}
/* KPI lớp 1 luôn lấy nguyên từ API summary-kiem-dem (kpiSummary) — không còn fallback tính
   từ TASKS mẫu; khi kpiSummary chưa tải xong / lỗi thì hiển thị "–" chờ dữ liệu thật. */
function renderKPI() {
  const set = (id, v) => document.getElementById(id).textContent = v;
  const numStr = n => (n === undefined || n === null) ? '–' : F(n);
  const pctStr = n => (n === undefined || n === null) ? '–' : String(n).replace('.', ',') + '%';
  const k = kpiSummary || {};
  set('k-total', numStr(k.tong));
  set('k-done', numStr(k.daHoanThanh)); set('p-done', pctStr(k.daHoanThanh_phanTram));
  set('k-ontime', numStr(k.dangThucHienTrongHan)); set('p-ontime', pctStr(k.dangThucHienTrongHan_phanTram));
  set('k-late', numStr(k.dangThucHienQuaHan)); set('p-late', pctStr(k.dangThucHienQuaHan_phanTram));
  set('k-routine', numStr(k.nhiemVuThuongXuyen)); set('p-routine', pctStr(k.nhiemVuThuongXuyen_phanTram));
  set('k-soon', numStr(k.sapToiHan));
  document.getElementById('kpiSoon').classList.toggle('on', !!k.sapToiHan);
}

/* đường bo góc một phía: cột bo đỉnh, thanh ngang bo đầu phải, chân luôn phẳng */
function topRound(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
function rightRound(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w, h / 2));
  return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
}

/* khối "Theo cấp trình đề án" (card g-cap): toggle 2 chế độ xem, mặc định "Theo đề án".
   Cả 2 đều lấy trực tiếp từ kpiSummary.theoNhomNhiemVu — KHÔNG có dữ liệu mẫu TASKS thay thế,
   nếu API chưa trả field tương ứng thì donut hiển thị rỗng (0 nhiệm vụ) chứ không bịa số. */
let capView = 'deAn';   /* 'deAn' | 'chuyenDoiSo' */
function capViewGroups() {
  const nom = kpiSummary && kpiSummary.theoNhomNhiemVu;
  const src = nom && (capView === 'chuyenDoiSo' ? nom.theoChuyenDoiSo : nom.theoDeAn);   /* { tong, nhom: [...] } */
  if (!src) return { items: [], tong: 0 };
  /* "chuyenDoiSo": hiển thị tên kế hoạch (ten_ke_hoach) nhưng click phải gửi mã kế hoạch (ma_ke_hoach)
     → item.key khác item.n; "deAn": vẫn dùng ten_cap_trinh làm cả nhãn lẫn giá trị click như trước (dim 'cap'). */
  const items = capView === 'chuyenDoiSo'
    ? (src.nhom || []).map(x => ({ n: x.ten_ke_hoach, key: x.ma_ke_hoach, total: x.so_luong }))
    : (src.nhom || []).map(x => ({ n: x.ten_cap_trinh, total: x.so_luong }));
  return { items, tong: src.tong };
}
/* click vào 1 item: "Theo đề án" dùng lại drill dim 'cap' sẵn có (API filter capTrinh=ten_cap_trinh);
   "Nhiệm vụ chuyển đổi số" là drill dim mới 'chuyenDoiSo' (API filter search=ma_ke_hoach) — xem fetchThongKeForDrill() */
function capItemClick(cv) {
  if (capView === 'chuyenDoiSo') return key => {
    const it = cv.items.find(x => x.key === key);
    drillTo('chuyenDoiSo', key, it ? it.n : key);
  };
  return n => drillTo('cap', n, n);
}
function renderCapChart() {
  const cv = capViewGroups();
  donut('c-cap', cv.items, capItemClick(cv), cv.tong);
}

/* nhóm theo đơn vị chủ trì lấy từ API (kpiSummary.theoDonViChuTri); null nếu chưa có → dùng groups('unit') tính từ TASKS mẫu.
   API đã trả sẵn breakdown theo trạng thái (done/ontime/late/routine) nên map thẳng, không cần tính lại.
   Lưu ý: bấm vào 1 thanh vẫn mở lớp 2 dựng từ TASKS mẫu cục bộ như cũ (chỉ số hiển thị trên chart là số thật). */
function unitGroupsFromApi() {
  if (!kpiSummary || !kpiSummary.theoDonViChuTri) return null;
  return kpiSummary.theoDonViChuTri
    .map(x => ({ n: x.don_vi_chu_tri, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => b.total - a.total);
}

/* tên lãnh đạo trả về từ API (field ld_phu_trach) không có tiền tố — UI muốn hiển thị dạng "Đ/C <tên>" */
const ldLabel = n => n ? `Đ/C ${n}` : n;
/* danh sách LĐ phụ trách (dropdown #fLd + chart "Theo lãnh đạo Ban phụ trách" ở cả lớp 1 lẫn lớp 2):
   loại bỏ ld_phu_trach_id=900042, 900014, 900016, 1095025610; sắp xếp theo đúng thứ tự cố định LD_ID_ORDER
   (yêu cầu riêng, không phải tăng dần theo số) — dùng chung ở mọi nơi đọc theoLanhDaoPhuTrach từ API.
   getId(x) trả về id (string/number tuỳ nguồn) của 1 phần tử trong list. Id không có trong LD_ID_ORDER
   (nếu phát sinh LĐ mới) xếp cuối, tăng dần. */
const EXCLUDED_LD_IDS = [900042, 900014, 900016, 1095025610];
const LD_ID_ORDER = [900012, 900013, 900015, 900001];
const sortFilterLd = (list, getId) => list
  .filter(x => !EXCLUDED_LD_IDS.includes(Number(getId(x))))
  .sort((a, b) => {
    const ia = LD_ID_ORDER.indexOf(Number(getId(a))), ib = LD_ID_ORDER.indexOf(Number(getId(b)));
    if (ia === -1 && ib === -1) return Number(getId(a)) - Number(getId(b));
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
/* nhóm theo lãnh đạo phụ trách lấy từ API (kpiSummary.theoLanhDaoPhuTrach); null nếu chưa có → dùng groups('ld') tính từ TASKS mẫu. */
function ldGroupsFromApi() {
  if (!kpiSummary || !kpiSummary.theoLanhDaoPhuTrach) return null;
  return sortFilterLd(
    kpiSummary.theoLanhDaoPhuTrach.map(x => ({ n: ldLabel(x.ld_phu_trach), id: x.ld_phu_trach_id, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine })),
    r => r.id
  );
}

/* ---------- thống kê chi tiết theo 1 cấp trình / 1 trạng thái (khi bấm hình tròn cấp trình hoặc 1 thẻ KPI) ---------- */
const THONG_KE_API = `${QLNV_API}/qlnv/v2/kiem-dem/thong-ke`;
/* drill.v (done/ontime/late/routine cục bộ) → giá trị trangThai API mong đợi, khớp đúng tên field trong summary-kiem-dem */
const STATUS_API_MAP = { done: 'daHoanThanh', ontime: 'dangThucHienTrongHan', late: 'dangThucHienQuaHan', routine: 'nhiemVuThuongXuyen' };
/* {paramName, paramValue} tương ứng đúng 1 drill hiện tại — dùng chung cho cả API kiem-dem/thong-ke
   (fetchThongKe, biểu đồ lớp 2) lẫn API kiem-dem/get-task (fetchTaskList, bảng danh sách nhiệm vụ lớp 2) */
function drillApiParam() {
  if (!drill) return null;
  if (drill.dim === 'cap') return { name: 'capTrinh', value: drill.v };
  if (drill.dim === 'unit') return { name: 'donViChuTri', value: drill.v };
  if (drill.dim === 'status') return { name: 'trangThai', value: STATUS_API_MAP[drill.v] };
  if (drill.dim === 'soon') return { name: 'trangThai', value: 'sapToiHan' };
  if (drill.dim === 'chuyenDoiSo') return { name: 'search', value: drill.v };
  return null;
}

/* ---------- đồng bộ dữ liệu từ Ban TCTW (nút "Đồng bộ") ---------- */
const SYNC_UP_API = `${QLNV_API}/qlnv/v2/bantctw/sync-up`;
function toast(msg, isError) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.toggle('error', !!isError);
  t.classList.add('show');
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove('show'), 3000);
}
async function syncUp() {
  const btn = document.getElementById('syncUp');
  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = '⟳ Đang đồng bộ…';
  try {
    const res = await ttFetch(SYNC_UP_API, { method: 'POST' });
    let data = null;
    try { data = await res.json(); } catch { /* body không phải JSON */ }
    /* API này luôn trả HTTP 200 kể cả khi lỗi (VD rate limit) — phải dựa vào field
       "status" trong body để biết thực sự thành công hay không, không dựa vào res.ok */
    if (!res.ok || !data || data.status !== true) {
      throw new Error((data && data.message) || `HTTP ${res.status}`);
    }
    toast('Đồng bộ thành công');
  } catch (err) {
    console.error('Đồng bộ dữ liệu thất bại:', err);
    toast(`Đồng bộ dữ liệu thất bại: ${err.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
}
let thongKeSummary = null;   /* kết quả API cho phạm vi đang xem ở lớp 2; null = chưa tải xong / lỗi → dùng TASKS mẫu */
let thongKeReqId = 0;        /* chống trường hợp bấm nhanh sang mục khác rồi request cũ mới trả lời đè lên dữ liệu mới */
async function fetchThongKe(paramName, paramValue) {
  const reqId = ++thongKeReqId;
  thongKeSummary = null;
  const params = new URLSearchParams({ [paramName]: paramValue });
  if (!isAllPeriod) {
    const tu = document.getElementById('from').value, den = document.getElementById('to').value;   /* API này nhận yyyy-mm-dd, không cần đổi định dạng */
    if (tu) params.set('tu', tu);
    if (den) params.set('den', den);
  }
  const ldId = selectedLdId();
  if (ldId) params.set('ldPhuTrach', ldId);
  const vbg = vanBanGiaoParam();
  if (vbg) params.set('vanBanGiao', vbg);
  try {
    const res = await ttFetch(`${THONG_KE_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    thongKeSummary = await res.json();
  } catch (err) {
    console.error('Không tải được dữ liệu thống kê, dùng số liệu mẫu cục bộ:', err);
    thongKeSummary = null;
  }
  if (reqId === thongKeReqId && drill) renderL2();   /* bỏ qua nếu đã quay lại tổng quan (drill=null) trong lúc chờ API */
}
function thongKeUnitGroups() {
  if (!thongKeSummary || !thongKeSummary.theoDonViChuTri) return null;
  return thongKeSummary.theoDonViChuTri
    .map(x => ({ n: x.don_vi_chu_tri, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => b.total - a.total);
}
function thongKeLdGroups() {
  if (!thongKeSummary || !thongKeSummary.theoLanhDaoPhuTrach) return null;
  return sortFilterLd(
    thongKeSummary.theoLanhDaoPhuTrach.map(x => ({ n: ldLabel(x.ld_phu_trach), id: x.ld_phu_trach_id, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine })),
    r => r.id
  );
}
/* donut "... theo cấp trình" ở lớp 2 (card B, khi drill theo trạng thái/sắp tới hạn): cùng toggle
   Theo đề án / Nhiệm vụ chuyển đổi số như card "Theo cấp trình đề án" ở lớp 1 (mục 5.12) — API
   kiem-dem/thong-ke trả theoCapTrinh cùng dạng { theoDeAn:{tong,nhom}, theoChuyenDoiSo:{tong,nhom} }. */
let l2CapView = 'deAn';   /* 'deAn' | 'chuyenDoiSo' — reset về 'deAn' mỗi lần drillTo() mới */
function thongKeCapViewGroups() {
  const cap = thongKeSummary && thongKeSummary.theoCapTrinh;
  const src = cap && (l2CapView === 'chuyenDoiSo' ? cap.theoChuyenDoiSo : cap.theoDeAn);
  if (!src) return { items: [], tong: 0 };
  const items = l2CapView === 'chuyenDoiSo'
    ? (src.nhom || []).map(x => ({ n: x.ten_ke_hoach, total: x.so_luong }))
    : (src.nhom || []).map(x => ({ n: x.ten_cap_trinh, total: x.so_luong }));
  return { items, tong: src.tong };
}
function renderL2CapChart() {
  const cv = thongKeCapViewGroups();
  donut('c2-b', cv.items, undefined, cv.tong);
}
/* 3 hàm dưới đây chỉ dùng cho lớp 2 khi drill theo đơn vị chủ trì (drill.dim==='unit') */
function thongKePhongBanGroups() {
  if (!thongKeSummary || !thongKeSummary.theoPhongBan) return null;
  return thongKeSummary.theoPhongBan
    .map(x => ({ n: x.phong_ban, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => b.total - a.total);
}
function thongKeLdCucVuGroups() {
  if (!thongKeSummary || !thongKeSummary.theoLanhDaoCucVu) return null;
  return thongKeSummary.theoLanhDaoCucVu
    .map(x => ({ n: x.lanh_dao_cuc_vu, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => b.total - a.total);
}
function thongKeTimeGroups() {
  if (!thongKeSummary || !thongKeSummary.theoThoiGian) return null;
  return thongKeSummary.theoThoiGian
    .map(x => ({ n: `T${x.thang}`, l: `T${x.thang}`, o: x.thang, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => a.o - b.o);
}

/* ---------- biểu đồ tròn ---------- */
const CAP_C = ['#39d5ff', '#2fb174', '#8b5cf6', '#d8a50c', '#6f93b3'];
function donut(box, data, onClick, total) {
  const el = document.getElementById(box);
  /* total: tổng lấy thẳng từ field "tong" của API khi có (vd theoDeAn.tong/theoChuyenDoiSo.tong) —
     ưu tiên hơn tự cộng dồn from data vì nhóm hiển thị có thể không phủ hết tổng thật (vd nhóm "khác" bị API bỏ qua) */
  const tot = total != null ? total : data.reduce((a, b) => a + b.total, 0);   /* tổng thật — dùng để hiển thị, có thể là 0 */
  const safeTot = tot || 1;                      /* chỉ dùng để tính tỉ lệ, tránh chia cho 0 */
  const R = 52, C = 2 * Math.PI * R; let acc = 0;
  const clickable = !!onClick;
  /* d.key: định danh dùng để gọi onClick khi khác với nhãn hiển thị d.n (vd nhóm "chuyển đổi số" hiển thị
     tên kế hoạch nhưng phải click bằng mã kế hoạch); mặc định dùng luôn d.n nếu không có d.key */
  const segs = data.map((d, i) => {
    const key = d.key != null ? d.key : d.n;
    const len = d.total / safeTot * C;
    const el2 = `<circle ${clickable ? `class="d-seg" data-n="${key}"` : ''} cx="70" cy="70" r="${R}" fill="none" stroke="${CAP_C[i % CAP_C.length]}" stroke-width="22"
      stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)">
      <title>${d.n}: ${F(d.total)}</title></circle>`;
    acc += len; return el2;
  }).join('');
  const lg = data.map((d, i) => `<div class="pl-row${clickable ? ' pl-click' : ''}" ${clickable ? `data-n="${d.key != null ? d.key : d.n}"` : ''}>
      <i style="background:${CAP_C[i % CAP_C.length]}"></i>
      <span class="pl-n" title="${d.n}">${d.n}</span>
      <b class="bt-num">${F(d.total)}</b>
      <span class="pl-p">${(d.total / safeTot * 100).toFixed(1).replace('.', ',')}%</span>
    </div>`).join('');
  el.innerHTML = `<div class="pie">
    <div class="pie-lg">${lg}</div>
    <svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--line-soft)" stroke-width="22"/>
      ${segs}<text x="70" y="66" text-anchor="middle" class="d-num">${F(tot)}</text>
      <text x="70" y="84" text-anchor="middle" class="d-lab">nhiệm vụ</text></svg></div>`;
  if (onClick) el.querySelectorAll('[data-n]').forEach(n =>
    n.addEventListener('click', () => onClick(n.dataset.n)));
}

/* ---------- biểu đồ thanh ngang chồng ---------- */
function hBars(box, data, maxRows, opt) {
  opt = opt || {};
  const el = document.getElementById(box);
  if (!data.length) { el.innerHTML = '<div class="empty">Không có dữ liệu.</div>'; return; }
  const rows = maxRows ? data.slice(0, maxRows) : data;   /* không cắt bớt nếu không truyền maxRows — hiện đủ theo dữ liệu API */
  const W = el.clientWidth || 500;
  const containerH = Math.max(el.clientHeight || 260, 180);
  const minRh = Math.max(34, (opt.bh || 13) + 22);   /* khoảng cách tối thiểu giữa các dòng, tránh đè lên nhau khi nhiều dòng */
  const naturalH = minRh * rows.length + 8;
  const overflowing = naturalH > containerH;
  const H = overflowing ? naturalH : containerH;   /* nhiều dòng hơn không gian sẵn có → cao theo nội dung, để card-body tự cuộn */
  const padL = 6, padR = 10, padT = 4, padB = 4;
  const rh = (H - padT - padB) / rows.length;
  const bh = Math.min(opt.bh || 13, rh * .42);
  const max = Math.max(...rows.map(d => d.total));
  const longest = Math.max(...rows.map(d => d.n.length));
  const bx = Math.min(opt.label || 230, W * .46, longest * 7.1 + 18);
  const bw0 = W - padR - bx - 42;
  const lim = Math.max(8, Math.floor((bx - padL - 12) / 7.1));   /* số ký tự vừa cột nhãn ở cỡ chữ 13px */
  el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" ${overflowing ? `style="height:${H}px"` : ''} preserveAspectRatio="xMidYMid meet">
    ${rows.map((d, i) => {
    const cy = padT + rh * i + rh / 2; let acc = 0;
    const segs = ST.map(st => {
      const v = d[st.k]; if (!v) return '';
      const w = v / max * bw0, x = bx + acc; acc += w;
      return `<rect x="${x}" y="${cy - bh / 2}" width="${w}" height="${bh}" fill="${st.c}"><title>${d.n} — ${st.l}: ${F(v)}</title></rect>`;
    }).join('');
    const clip = `clip-${box}-${i}`;
    const nm = d.n.length > lim ? d.n.slice(0, lim - 1) + '…' : d.n;
    const attr = opt.click ? ` class="hb-row" data-n="${d.n}"` : '';
    return `<g${attr}><text class="bar-lb" x="${padL}" y="${cy + 4}" ${opt.bold ? 'style="font-weight:600"' : ''}>${nm}<title>${d.n}</title></text>
        <path d="${rightRound(bx, cy - bh / 2, bw0, bh, bh / 3)}" fill="var(--line-soft)"/>
        <clipPath id="${clip}"><path d="${rightRound(bx, cy - bh / 2, acc || 0.01, bh, bh / 3)}"/></clipPath>
        <g clip-path="url(#${clip})">${segs}</g>
        <text class="bar-tt" x="${bx + bw0 + 10}" y="${cy + 4.5}">${F(d.total)}</text></g>`;
  }).join('')}
  </svg>`;
  if (opt.click) el.querySelectorAll('.hb-row').forEach(g =>
    g.addEventListener('click', () => opt.click(g.dataset.n)));
}

/* ---------- biểu đồ theo thời gian ---------- */
let tScale = 'month';  /* độ mịn trục thời gian: day | week | month | quarter | year */
const MONTH_D = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function weekNo(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { w: Math.ceil(((t - y0) / 86400000 + 1) / 7), y: t.getUTCFullYear() };
}
function bucket(due) {
  const d = new Date(due), y = d.getFullYear(), m = d.getMonth();
  if (tScale === 'day') return { k: `${d.getDate()}/${m + 1}`, l: `${d.getDate()}/${m + 1}`, o: y * 10000 + m * 100 + d.getDate() };
  if (tScale === 'year') return { k: `${y}`, l: `${y}`, o: y * 100 };
  if (tScale === 'quarter') return { k: `Q${~~(m / 3) + 1}/${y}`, l: `Q${~~(m / 3) + 1}/${y}`, o: y * 100 + ~~(m / 3) };
  if (tScale === 'month') return { k: `T${m + 1}/${y}`, l: `T${m + 1}`, o: y * 100 + m };
  const w = weekNo(d); return { k: `Tuần ${w.w}/${w.y}`, l: `T${w.w}`, o: w.y * 100 + w.w };
}
/* nhóm theo thời gian lấy từ API (kpiSummary.theoThoiGian); API chỉ có granularity theo THÁNG nên chỉ dùng khi tScale==='month',
   các độ mịn khác (ngày/tuần/quý/năm) vẫn tính từ TASKS mẫu như cũ. */
function timeGroupsFromApi() {
  if (tScale !== 'month' || !kpiSummary || !kpiSummary.theoThoiGian) return null;
  return kpiSummary.theoThoiGian
    .map(x => ({ n: `T${x.thang}`, l: `T${x.thang}`, o: x.thang, total: x.tong, done: x.done, ontime: x.ontime, late: x.late, routine: x.routine }))
    .sort((a, b) => a.o - b.o);
}
function timeChart(box, data) {
  const el = document.getElementById(box);
  data = data || timeGroupsFromApi();
  if (!data) {
    const m = new Map();
    rows().filter(r => r.due).forEach(r => {
      const b = bucket(r.due);
      if (!m.has(b.k)) m.set(b.k, { n: b.k, l: b.l, o: b.o, total: 0, done: 0, ontime: 0, late: 0, routine: 0 });
      const g = m.get(b.k); g.total++; g[r.s]++;
    });
    data = [...m.values()].sort((a, b) => a.o - b.o);
  }
  if (!data.length) { el.innerHTML = '<div class="empty">Không có nhiệm vụ đặt hạn trong khoảng đã chọn.</div>'; return; }

  const W = el.clientWidth || 900, H = Math.max(el.clientHeight || 220, 170);
  const padL = 32, padR = 10, padT = 18, padB = 30, iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(...data.map(d => d.total)), step = Math.ceil(max / 4) || 1, top = step * 4;
  const gap = iw / data.length, bw = Math.min(46, gap * .58);
  const grid = [0, 1, 2, 3, 4].map(i => {
    const y = padT + ih - (i * step / top) * ih;
    return `<line class="grid-l" x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"/>
            <text class="axis" x="${padL - 7}" y="${y + 3.5}" text-anchor="end">${i * step}</text>`;
  }).join('');
  const r = Math.min(5, bw / 5);
  const bars = data.map((d, i) => {
    const x = padL + gap * i + (gap - bw) / 2; let acc = 0;
    const segs = ST.map(st => {
      const v = d[st.k]; if (!v) return '';
      const h = v / top * ih, y = padT + ih - acc - h; acc += h;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${st.c}"><title>${d.n} — ${st.l}: ${F(v)}</title></rect>`;
    }).join('');
    const clip = `clipt-${i}`;
    return `<g><text class="bar-tt" x="${x + bw / 2}" y="${padT + ih - acc - 6}" text-anchor="middle">${F(d.total)}</text>
      <clipPath id="${clip}"><path d="${topRound(x, padT + ih - acc, bw, acc || 0.01, r)}"/></clipPath>
      <g clip-path="url(#${clip})">${segs}</g>
      <text class="axis" x="${x + bw / 2}" y="${padT + ih + 16}" text-anchor="middle">${d.l}</text></g>`;
  }).join('');
  el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${grid}
    <line class="grid-l" x1="${padL}" y1="${padT + ih}" x2="${W - padR}" y2="${padT + ih}"/>${bars}</svg>`;
}

const $ = id => document.getElementById(id);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('xOv').hidden) closeXModal();
  if (!$('tdOv').hidden) closeTaskDetail();
  document.querySelectorAll('.msel-panel').forEach(p => p.hidden = true);
});

/* ---------- xuất Excel: form chọn trường ---------- */
/* danh mục trường xuất — g(r,i) trả về giá trị ô */
const XF = [
  { k: 'stt', l: 'STT', g: (r, i) => i + 1 },
  { k: 'ma', l: 'Mã nhiệm vụ', g: r => r.ma },
  { k: 't', l: 'Tên nhiệm vụ', g: r => r.t },
  { k: 'cap', l: 'Cấp trình', g: r => capTrinh(r) },
  { k: 'da', l: 'Đề án', g: r => r.da },
  { k: 'u', l: 'Đơn vị chủ trì', g: r => r.u },
  { k: 'ld', l: 'LĐ Ban phụ trách', g: r => r.ld },
  { k: 'lo', l: 'Loại văn bản', g: r => r.lo },
  { k: 'due', l: 'Thời hạn hoàn thành', g: r => r.due ? dmy(r.due) : 'Không đặt hạn' },
  { k: 'st', l: 'Trạng thái', g: r => S_LB[r.s] },
  { k: 'qh', l: 'Số ngày quá hạn', g: r => (r.s === 'late' && r.due) ? -days(r.due) : '' },
  { k: 'dht', l: 'Ngày hoàn thành', g: r => (r.s === 'done' && r.due) ? dmy(r.due) : '' },
  { k: 'td', l: 'Tiến độ', g: r => r.s === 'done' ? '100%' : r.s === 'routine' ? '—' : '0%' }
];
const xSel = new Set(XF.map(f => f.k));   /* nhớ lựa chọn giữa các lần mở form */

function openXModal() {
  const list = rows();
  $('xScope').innerHTML = `Phạm vi xuất theo bộ lọc hiện tại${drill ? ` — <b>${drill.label}</b>` : ''}: <b>${F(list.length)}</b> nhiệm vụ`;
  $('xFields').innerHTML = XF.map(f => `
    <label class="x-item${xSel.has(f.k) ? ' on' : ''}">
      <input type="checkbox" data-k="${f.k}" ${xSel.has(f.k) ? 'checked' : ''}>${f.l}</label>`).join('');
  $('xFields').querySelectorAll('input').forEach(c => c.addEventListener('change', () => {
    c.checked ? xSel.add(c.dataset.k) : xSel.delete(c.dataset.k);
    c.closest('.x-item').classList.toggle('on', c.checked);
    $('xErr').hidden = xSel.size > 0;
  }));
  $('xErr').hidden = true;
  $('xOv').hidden = false;
}
function closeXModal() { $('xOv').hidden = true; }
function xSetAll(v) {
  XF.forEach(f => v ? xSel.add(f.k) : xSel.delete(f.k));
  $('xFields').querySelectorAll('input').forEach(c => {
    c.checked = v; c.closest('.x-item').classList.toggle('on', v);
  });
  $('xErr').hidden = xSel.size > 0;
}
$('xX').onclick = closeXModal;
$('xCancel').onclick = closeXModal;
$('xOv').addEventListener('click', e => { if (e.target === $('xOv')) closeXModal(); });
$('xAll').onclick = () => xSetAll(true);
$('xNone').onclick = () => xSetAll(false);
$('xGo').onclick = () => {
  if (!xSel.size) { $('xErr').hidden = false; return; }
  try {
    toExcel(XF.filter(f => xSel.has(f.k)), $('xSum').checked);
    closeXModal();
  } catch (err) {
    $('xErr').textContent = 'Lỗi khi xuất: ' + err.message;
    $('xErr').hidden = false;
  }
};

function toExcel(fields, withSummary) {
  const list = rows();
  const t = tally(list);
  const block = (key) => {
    const g = groups(key), head = DIMS[key].n.replace('theo ', '');
    return `<table border="1"><tr><th colspan="6">Kiểm đếm nhiệm vụ ${DIMS[key].n}</th></tr>
      <tr><th>${head}</th><th>Tổng</th><th>Đã hoàn thành</th><th>Đang thực hiện - trong hạn</th>
          <th>Đang thực hiện - quá hạn</th><th>Nhiệm vụ thường xuyên</th></tr>
      ${g.map(r => `<tr><td>${r.n}</td><td>${r.total}</td><td>${r.done}</td><td>${r.ontime}</td><td>${r.late}</td><td>${r.routine}</td></tr>`).join('')}
      <tr><td><b>Tổng cộng</b></td><td>${t.total}</td><td>${t.done}</td><td>${t.ontime}</td><td>${t.late}</td><td>${t.routine}</td></tr>
      </table><br/>`;
  };
  const detail = `<table border="1"><tr><th colspan="${fields.length}">Danh sách nhiệm vụ${drill ? ` — ${drill.label}` : ''}</th></tr>
    <tr>${fields.map(f => `<th>${f.l}</th>`).join('')}</tr>
    ${list.map((r, i) => `<tr>${fields.map(f => `<td>${f.g(r, i)}</td>`).join('')}</tr>`).join('')}
    </table>`;
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>
    ${withSummary ? Object.keys(DIMS).map(block).join('') : ''}${detail}</body></html>`;
  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kiem-dem-nhiem-vu_${iso(new Date())}.xls`;
  a.click(); URL.revokeObjectURL(a.href);
}

/* ---------- khởi tạo ---------- */
/* drill từ KPI / hình tròn cấp trình / biểu đồ đơn vị chủ trì → dashboard lớp 2 thiết kế riêng */
const isCustomL2 = () => !!drill;

function renderAll() {
  if (isCustomL2()) { renderL2(); return; }
  renderKPI();
  hBars('c-unit', unitGroupsFromApi() || groups('unit'), 20, {
    bh: 12, label: 200, chars: 30, bold: true,
    click: n => drillTo('unit', n, n)
  });
  renderCapChart();
  hBars('c-ld', ldGroupsFromApi() || groups('ld'), null, { bh: 16, label: 210, chars: 32 });
  timeChart('c-time');
}

/* ---------- lớp 2 riêng: 2 biểu đồ + danh sách nhiệm vụ ---------- */
const L2_VERB = { done: 'Hoàn thành', ontime: 'Trong hạn', late: 'Quá hạn', routine: 'Thường xuyên' };
const S_CLS = { done: 'st-done', ontime: 'st-ontime', late: 'st-late', routine: 'st-routine' };
const S_LB = { done: 'Hoàn thành', ontime: 'Trong hạn', late: 'Quá hạn', routine: 'Thường xuyên' };
/* bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu */
const deVN = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

/* ---------- danh sách nhiệm vụ chi tiết lớp 2: API kiem-dem/get-task ----------
   Không truyền limit/page — gọi 1 lần lấy TOÀN BỘ dữ liệu theo phạm vi drill, rồi mọi filter (đơn vị/cấp
   trình/trạng thái/tìm kiếm) đều xử lý cục bộ trên dữ liệu đã có sẵn, tránh gọi lại API mỗi lần đổi dropdown. */
const TASK_API = `${QLNV_API}/qlnv/v2/kiem-dem/get-task`;
/* text trangThaiKiemDem trả về từ API → khoá trạng thái nội bộ (done/ontime/late/routine), suy ngược từ
   STATUS_LB vì 2 bên dùng chung 1 bộ nhãn tiếng Việt (đã xác nhận qua "Đã hoàn thành"/"Nhiệm vụ thường xuyên") */
const TRANG_THAI_KIEM_DEM_TO_KEY = Object.fromEntries(Object.entries(STATUS_LB).map(([k, v]) => [v, k]));
/* chuẩn hoá 1 item API get-task về shape nội bộ dùng chung cho cả bảng (renderL2List()/hanCell()) lẫn popup
   chi tiết (openTaskDetail()) — field nào chỉ popup dùng (chuDe/phongBan/lanhDaoDonVi/donViPhoiHop/ketQua/
   khoKhan/kienNghi) vẫn giữ lại ở đây dù bảng không hiển thị, để không phải gọi lại API khi mở popup. */
function mapTaskItem(x) {
  return {
    ma: x.taskId,
    t: x.tenNhiemVu,
    u: x.donVi,
    ld: x.ldPhuTrachName ? ldLabel(x.ldPhuTrachName) : '',
    cap: x.tenCapTrinh || capTrinh({ ma: x.taskId }),   /* ưu tiên tenCapTrinh API trả sẵn; null (vd nhiệm vụ KH...) → suy từ mã như cũ */
    vbg: x.nhomVanBan || '',   /* "Văn bản giao" — khớp giá trị với dropdown Văn bản giao (mục 5.20/5.21), vd "200-QĐ/TW" */
    nguoiThucHien: x.nguoiThucHien || '',
    due: fromApiDate(x.thoiHanHoanThanh),
    s: TRANG_THAI_KIEM_DEM_TO_KEY[x.trangThaiKiemDem] || null,
    sLabel: x.trangThaiKiemDem || '',
    /* chỉ dùng ở popup chi tiết (mục 5.22) */
    chuDe: x.chuDeName || '',
    phongBan: x.phongBanName || '',
    lanhDaoDonVi: x.lanhDaoDonViName || '',
    donViPhoiHop: x.donViPhoiHop || '',
    ketQua: x.ketQuaGhiChu || '',
    khoKhan: x.khoKhan || '',
    kienNghi: x.kienNghi || ''
  };
}
let taskItems = [];      /* toàn bộ nhiệm vụ chi tiết đã tải cho phạm vi drill hiện tại */
let taskLoading = false;
let taskReqId = 0;       /* chống trường hợp đổi drill/bộ lọc nhanh rồi request cũ trả lời đè lên dữ liệu mới */
/* tải lại toàn bộ danh sách nhiệm vụ chi tiết cho đúng phạm vi drill hiện tại (không phân trang) */
async function fetchTaskList() {
  if (!drill) return;
  const p = drillApiParam();
  if (!p) return;
  taskItems = [];
  const reqId = ++taskReqId;
  taskLoading = true;
  renderL2List();   /* hiện ngay trạng thái "đang tải" */
  const params = new URLSearchParams({ [p.name]: p.value });
  if (!isAllPeriod) {
    const tu = document.getElementById('from').value, den = document.getElementById('to').value;   /* API này nhận yyyy-mm-dd, giống kiem-dem/thong-ke */
    if (tu) params.set('tu', tu);
    if (den) params.set('den', den);
  }
  const ldId = selectedLdId();
  if (ldId) params.set('ldPhuTrach', ldId);
  const vbg = vanBanGiaoParam();
  if (vbg) params.set('vanBanGiao', vbg);
  params.set('limit', 1000);   /* chặn an toàn — tránh tải quá nhiều dữ liệu cùng lúc nếu 1 phạm vi drill có rất nhiều nhiệm vụ */
  try {
    const res = await ttFetch(`${TASK_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (reqId !== taskReqId || !drill) return;   /* đã đổi drill/bộ lọc hoặc quay lại tổng quan trong lúc chờ — bỏ kết quả cũ */
    taskItems = (data.data || []).map(mapTaskItem);
  } catch (err) {
    console.error('Không tải được danh sách nhiệm vụ chi tiết:', err);
    if (reqId === taskReqId) taskItems = [];
  } finally {
    if (reqId === taskReqId) { taskLoading = false; renderL2List(); }
  }
}
/* danh sách nhiệm vụ chi tiết dùng trong bảng lớp 2 — toàn bộ dữ liệu đã tải (xem fetchTaskList()) */
function l2Base() {
  return taskItems;
}
function fillSel(id, values, allLabel) {
  const el2 = $(id), cur = el2.value || 'all';
  el2.innerHTML = `<option value="all">${allLabel}</option>` +
    values.map(v => `<option value="${v}">${v}</option>`).join('');
  el2.value = values.includes(cur) ? cur : 'all';
}
function renderL2() {
  $('l2').classList.toggle('cols3', drill.dim === 'unit');
  $('g2c').hidden = drill.dim !== 'unit';
  $('l2CapScale').hidden = true;   /* chỉ hiện lại ở nhánh "theo cấp trình" bên dưới */

  if (drill.dim === 'unit') {
    /* 3 khối riêng khi drill từ biểu đồ "Theo đơn vị chủ trì" */
    $('l2aT').textContent = 'Theo phòng thuộc đơn vị';
    hBars('c2-a', thongKePhongBanGroups() || groups('unit'), 20, { bh: 12, label: 200, chars: 30, bold: true });
    $('l2bT').textContent = 'Theo lãnh đạo cục, vụ phụ trách';
    hBars('c2-b', thongKeLdCucVuGroups() || groups('ld'), null, { bh: 16, label: 210, chars: 32 });
    $('l2cT').textContent = 'Theo thời gian';
    timeChart('c2-c', thongKeTimeGroups());
    $('l2listT').textContent = `Danh sách nhiệm vụ ${drill.label.toLowerCase()}`;
  } else {
    const verb = drill.dim === 'status' ? L2_VERB[drill.v]
      : drill.dim === 'soon' ? 'Sắp tới hạn'
        : drill.label;                              /* cap */
    /* biểu đồ A: theo đơn vị chủ trì */
    $('l2aT').textContent = `${verb} theo đơn vị chủ trì`;
    hBars('c2-a', thongKeUnitGroups() || groups('unit'), 20, { bh: 12, label: 200, chars: 30, bold: true });
    /* biểu đồ B: mặc định "theo cấp trình" (status/soon) — riêng drill từ "Theo đề án" (dim 'cap') hoặc
       "Nhiệm vụ chuyển đổi số" (dim 'chuyenDoiSo') thì đổi sang "theo lãnh đạo phụ trách" thay vì cấp trình */
    if (drill.dim === 'cap' || drill.dim === 'chuyenDoiSo') {
      $('l2bT').textContent = `${verb} theo lãnh đạo phụ trách`;
      hBars('c2-b', thongKeLdGroups() || groups('ld'), null, { bh: 16, label: 210, chars: 32 });
    } else {
      $('l2bT').textContent = `${verb} theo cấp trình`;
      $('l2CapScale').hidden = false;
      renderL2CapChart();
    }
    $('l2listT').textContent = `Danh sách nhiệm vụ ${verb.toLowerCase()}`;
  }
  /* ẩn/hiện dropdown trạng thái chỉ phụ thuộc drill.dim, không phụ thuộc dữ liệu → set 1 lần ở đây;
     phần dựng NỘI DUNG option (phụ thuộc dữ liệu tải về từ get-task) nằm trong buildL2Filters(),
     gọi lại mỗi lần renderL2List() để option khớp với dữ liệu (rỗng lúc đang tải, đủ sau khi tải xong) */
  const stSel = $('l2fS');
  if (drill.dim === 'status' || drill.dim === 'soon') {
    /* drill xuất phát từ 1 item KPI (4 thẻ trạng thái HOẶC thẻ "Sắp tới hạn") đã tự chọn sẵn đúng 1 tiêu chí rồi
       → ẩn dropdown "Tất cả trạng thái" vì lọc thêm theo trạng thái lúc này là dư thừa/gây nhầm lẫn */
    stSel.hidden = true;
    stSel.innerHTML = '<option value="all">Tất cả trạng thái</option>';
    stSel.value = 'all';
  } else {
    stSel.hidden = false;
  }
  renderL2List();
}
/* dựng lại option của 3 dropdown lọc (đơn vị/cấp trình/trạng thái) từ CÁC TRANG ĐÃ TẢI tới thời điểm gọi —
   gọi mỗi lần renderL2List() để option tăng dần đúng theo dữ liệu, giữ lựa chọn hiện tại nếu còn hợp lệ */
function buildL2Filters(base) {
  fillSel('l2fU', [...new Set(base.map(r => r.u))].sort(), 'Tất cả đơn vị');
  fillSel('l2fC', [...new Set(base.map(r => r.cap))].sort(), 'Tất cả cấp trình');
  const stSel = $('l2fS');
  if (stSel.hidden) return;   /* status/soon: dropdown ẩn, không cần dựng option */
  const sts = [...new Set(base.map(r => r.s))];
  const cur = stSel.value || 'all';
  stSel.innerHTML = '<option value="all">Tất cả trạng thái</option>' +
    ['done', 'ontime', 'late', 'routine'].filter(k => sts.includes(k))
      .map(k => `<option value="${k}">${S_LB[k]}</option>`).join('');
  stSel.value = [...stSel.options].some(o => o.value === cur) ? cur : 'all';
}
/* trangThaiKiemDem không suy được về done/ontime/late/routine (r.s === null) → hiện nguyên văn r.sLabel, không
   gắn pill màu. Dùng chung cho cả bảng (renderL2List) lẫn popup chi tiết (openTaskDetail). */
const stCell = r => r.s ? `<span class="st-pill ${S_CLS[r.s]}">${S_LB[r.s]}</span>` : (r.sLabel || '');
const hanCell = r => {
  if (!r.due) return '<span style="color:var(--muted)">Không đặt hạn</span>';
  const d = days(r.due);
  const note = r.s === 'done' ? '' :
    d < 0 ? ` <span class="late-v">(quá ${-d} ngày)</span>` :
      d <= 3 ? ` <span style="color:var(--warn);font-weight:700">(còn ${d} ngày)</span>` : '';
  return dmy(r.due) + note;
};
/* text ngắn gọn cho ô "Ngày còn hạn / quá hạn" ở popup chi tiết (không kèm HTML như hanCell, chỉ text thuần) */
const hanStatusText = r => {
  if (r.s === 'done') return 'Đã hoàn thành';
  if (!r.due) return 'Không đặt hạn';
  const d = days(r.due);
  return d < 0 ? `Quá hạn ${-d} ngày` : `Còn ${d} ngày`;
};
function renderL2List() {
  const base = l2Base();
  buildL2Filters(base);
  const q = deVN($('l2q').value.trim());
  const fU = $('l2fU').value || 'all', fC = $('l2fC').value || 'all', fS = $('l2fS').value || 'all';
  const list = base.filter(r =>
    (fU === 'all' || r.u === fU) &&
    (fC === 'all' || r.cap === fC) &&
    (fS === 'all' || r.s === fS) &&
    (!q || deVN(`${r.ma} ${r.t} ${r.u} ${r.vbg} ${r.ld} ${r.nguoiThucHien}`).includes(q)));
  $('l2Count').textContent = list.length === base.length
    ? `${F(base.length)} nhiệm vụ`
    : `${F(list.length)} / ${F(base.length)} nhiệm vụ`;
  const emptyMsg = taskLoading ? 'Đang tải dữ liệu…' : 'Không có nhiệm vụ nào khớp.';
  $('c2-list').innerHTML = !list.length
    ? `<div class="empty">${emptyMsg}</div>`
    : `<table>
      <tr><th style="width:34px">STT</th><th class="l">Mã nhiệm vụ</th><th class="l">Tên nhiệm vụ</th>
          <th class="l">Văn bản giao</th><th class="l">Cấp trình</th><th class="l">Đơn vị chủ trì</th>
          <th class="l">LĐ phụ trách</th><th class="l">Người thực hiện</th><th class="l">Hạn hoàn thành</th><th>Trạng thái</th></tr>
      ${list.map((r, i) => `<tr data-ma="${r.ma}" style="cursor:pointer">
        <td style="text-align:center;color:var(--muted)">${i + 1}</td>
        <td class="l" style="font-weight:500;white-space:nowrap">${r.ma}</td>
        <td class="l" style="font-weight:400">${r.t}</td>
        <td class="l" style="white-space:nowrap">${r.vbg}</td>
        <td class="l" style="white-space:nowrap">${r.cap}</td>
        <td class="l" style="font-weight:400">${r.u}</td>
        <td class="l" style="white-space:nowrap;font-weight:400">${r.ld}</td>
        <td class="l" style="font-weight:400">${r.nguoiThucHien}</td>
        <td class="l" style="white-space:nowrap;font-weight:400">${hanCell(r)}</td>
        <td style="text-align:center">${stCell(r)}</td>
      </tr>`).join('')}
    </table>`;
}
$('l2q').addEventListener('input', renderL2List);
['l2fU', 'l2fC', 'l2fS'].forEach(id => $(id).addEventListener('change', renderL2List));
/* click vào 1 dòng (không tính header) → mở popup chi tiết nhiệm vụ đó — gắn 1 lần trên #c2-list (không gắn
   lại mỗi lần render) vì renderL2List() thay .innerHTML toàn bộ, gắn trực tiếp trên <tr> sẽ mất sau mỗi lần vẽ */
$('c2-list').addEventListener('click', e => {
  const tr = e.target.closest('tr[data-ma]');
  if (!tr) return;
  const item = taskItems.find(x => x.ma === tr.dataset.ma);
  if (item) openTaskDetail(item);
});

/* ---------- popup chi tiết 1 nhiệm vụ ---------- */
/* nhãn nhỏ chữ hoa + giá trị bên dưới — dùng cho các ô đứng riêng (vd "Đơn vị phối hợp") trong popup chi tiết */
const tdField = (label, value) => `<div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.03em;color:var(--muted);text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:13.5px">${value || '—'}</div>
  </div>`;
/* giống tdField nhưng có viền phải/dưới — dùng cho 6 ô trong lưới 3 cột (khối bọc ngoài tự có viền phải/dưới
   ở container, xem openTaskDetail); viền phải/dưới của từng ô trùng viền ngoài ở hàng/cột cuối, chỉ dày hơn
   1 chút chứ không lệch, chấp nhận được để không phải tính riêng ô nào là hàng/cột cuối */
const tdGridCell = (label, value) => `<div style="padding:10px 14px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)">
    <div style="font-size:11px;font-weight:700;letter-spacing:.03em;color:var(--muted);text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:13.5px">${value || '—'}</div>
  </div>`;
/* khối màu viền trái (Kết quả thực hiện / Khó khăn vướng mắc / Đề xuất kiến nghị) */
const tdBox = (color, label, value) => `<div style="border-left:3px solid ${color};background:var(--line-soft);padding:10px 12px;border-radius:6px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.03em;color:${color};text-transform:uppercase;margin-bottom:4px">${label}</div>
    <div style="font-size:13.5px">${value || '—'}</div>
  </div>`;
/* nhiệm vụ đang mở ở popup chi tiết — 2 nút chân popup cần nó để deeplink sang Bkav */
let tdItem = null;
function openTaskDetail(item) {
  tdItem = item;
  const performers = (item.nguoiThucHien || '').split(',').map(s => s.trim()).filter(Boolean);
  const performersHtml = performers.length
    ? performers.map(p => `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:var(--line-soft);font-size:12.5px;margin:0 6px 6px 0">${p}</span>`).join('')
    : '<span style="color:var(--muted)">Không có</span>';
  $('tdBody').innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-block;padding:3px 10px;border-radius:6px;background:var(--line-soft);font-size:12.5px;font-weight:600">${item.ma}</span>
      ${stCell(item)}
    </div>
    <div style="font-weight:700;font-size:15px;line-height:1.4">${item.t}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:8px;overflow:hidden">
      ${tdGridCell('Văn bản giao', item.vbg)}
      ${tdGridCell('Thời hạn hoàn thành', item.due ? dmy(item.due) : 'Không đặt hạn')}
      ${tdGridCell('Chủ đề', item.chuDe || 'Chưa phân loại')}
      ${tdGridCell('Đơn vị chủ trì', [item.u, item.phongBan].filter(Boolean).join(' — '))}
      ${tdGridCell('Lãnh đạo Ban phụ trách', [item.ld, item.lanhDaoDonVi].filter(Boolean).join(' · '))}
      ${tdGridCell('Ngày còn hạn / quá hạn', hanStatusText(item))}
    </div>
    ${tdField('Đơn vị phối hợp', item.donViPhoiHop || 'Không có')}
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.03em;color:var(--muted);text-transform:uppercase;margin-bottom:6px">Người thực hiện</div>
      ${performersHtml}
    </div>
    ${tdBox('var(--done)', 'Kết quả thực hiện', item.ketQua)}
    ${tdBox('var(--late)', 'Khó khăn, vướng mắc', item.khoKhan)}
    ${tdBox('var(--warn)', 'Đề xuất, kiến nghị', item.kienNghi)}
  `;
  $('tdOv').hidden = false;
}
function closeTaskDetail() { $('tdOv').hidden = true; }
$('tdX').onclick = closeTaskDetail;
$('tdCancel').onclick = closeTaskDetail;
$('tdOv').addEventListener('click', e => { if (e.target === $('tdOv')) closeTaskDetail(); });
/* ---------- mở nhiệm vụ trên hệ Theo dõi nhiệm vụ (Bkav) ---------- */
/* Cùng cơ chế deeplink với nút "Cập nhật nhiệm vụ" ở tongquan/noti (qlnvOpenTaskExternal):
   /api/deeplink/task?task_id=<mã>&username=<account>&key=<api key> — hệ đích tự đăng nhập
   nên không cần bọc SSO. Khác ở chỗ nhiệm vụ BTCTW chỉ có mã chữ (`ma_nhiem_vu`, vd
   "26.BTCTW.08") chứ không có id số BMM, nên task_id gửi đi chính là item.ma.
   Thiếu mã/tài khoản -> lùi về trang danh sách của Bkav, không kẹt luồng. */
const BKAV_TASK_URL = {
  host: (typeof window !== 'undefined' && window.QLNV_EXTERNAL_BKAV_HOST) || 'https://theodoinhiemvu.hanoi.gov.vn',
  deeplink: '/api/deeplink/task',
  apiKey: (typeof window !== 'undefined' && window.QLNV_EXTERNAL_BKAV_API_KEY) || 'RJFwW1Uqvd85QkWw_10xo4QZNc3wxhGw2j7NkUiJjZg',
  appList: '/app/task'
};
const PROFILE_API = `${QLNV_API}/employees/profile`;
/* account bên Bkav của người đang đăng nhập = `username` trong hồ sơ /employees/profile.
   Trước đây lấy canBo.account của /qlnv/v2/pham-vi — sai, vì pham-vi phụ thuộc bảng dm_user
   (tài khoản chưa gán đơn vị thì trả lỗi, account rỗng -> deeplink rơi về dashboard Bkav).
   Token phải là token của NGƯỜI ĐANG ĐĂNG NHẬP (ttFetch, giống departments/tongquan) —
   hồ sơ trả về quyết định deeplink mở đúng nhiệm vụ của ai.
   Lỗi -> '' để rơi về trang danh sách thay vì kẹt. */
let bkavAccountP = null;
function bkavAccount() {
  if (!bkavAccountP) {
    bkavAccountP = ttFetch(PROFILE_API)
      .then(r => (r.ok ? r.json() : null))
      .then(d => String((d && (d.username || (d.data && d.data.username))) || '').trim())
      .catch(err => { console.warn('[Bkav redirect] không lấy được tài khoản:', err); return ''; });
  }
  return bkavAccountP;
}
function openTaskOnBkav(item, hanhDong) {
  const taskId = String((item && item.ma) || '').trim();
  bkavAccount().then(user => {
    const target = taskId && user
      ? `${BKAV_TASK_URL.host}${BKAV_TASK_URL.deeplink}?` + new URLSearchParams({ task_id: taskId, username: user, key: BKAV_TASK_URL.apiKey }).toString()
      : BKAV_TASK_URL.host + BKAV_TASK_URL.appList;
    try { window.open(target, '_blank', 'noopener'); } catch (e) { location.href = target; }
    toast(`${hanhDong} trên hệ Theo dõi nhiệm vụ (Bkav) — ` +
      (taskId && user ? 'chi tiết nhiệm vụ' : !taskId ? 'danh sách (thiếu mã nhiệm vụ)' : 'danh sách (chưa lấy được tài khoản đăng nhập)') + '…');
  });
}
/* "Yêu cầu báo cáo" / "Cập nhật nhiệm vụ": IOC không có API cho 2 hành động này — cả hai
   đều chuyển sang Bkav theo task_id của nhiệm vụ đang mở, đúng như nút "Cập nhật nhiệm vụ"
   ở các trang khác. */
$('tdReport').onclick = () => { if (tdItem) openTaskOnBkav(tdItem, 'Yêu cầu báo cáo'); };
$('tdUpdate').onclick = () => { if (tdItem) openTaskOnBkav(tdItem, 'Cập nhật nhiệm vụ'); };

/* ---------- drilldown lớp 2 (đơn vị / cấp trình / trạng thái / sắp tới hạn) ---------- */
/* gọi fetchThongKe() với đúng param ứng với drill hiện tại — dùng chung cho lúc mở lớp 2
   lẫn lúc header đổi filter (tu/den) trong khi lớp 2 đang mở, để tránh dữ liệu bị lệch ngày */
function fetchThongKeForDrill() {
  const p = drillApiParam();
  if (p) fetchThongKe(p.name, p.value);
}
/* tải lại từ đầu cả 2 nguồn dữ liệu của lớp 2 khi drill mới mở HOẶC khi bộ lọc header (kỳ/ngày/LĐ) đổi
   trong lúc đang ở lớp 2: biểu đồ thống kê (kiem-dem/thong-ke) + bảng danh sách nhiệm vụ (kiem-dem/get-task) */
function refreshDrillData() {
  fetchThongKeForDrill();
  fetchTaskList();
}
function drillTo(dim, v, label) {
  if (drill) return;                 /* đang ở lớp 2: quay lại trước khi drill tiếp */
  drill = { dim, v, label };
  $('l2q').value = '';
  ['l2fU', 'l2fC', 'l2fS'].forEach(id => $(id).value = 'all');
  l2CapView = 'deAn';
  document.querySelectorAll('#l2CapScale button').forEach(o => o.setAttribute('aria-pressed', String(o.dataset.v === 'deAn')));
  syncDrillUI();
  renderAll();
  refreshDrillData();   /* nạp số liệu thật cho biểu đồ + danh sách nhiệm vụ trong lớp 2 theo đúng phạm vi vừa chọn */
}
function drillBack() {
  thongKeSummary = null;
  drill = null;
  taskItems = []; taskLoading = false;
  syncDrillUI();
  renderAll();
}
function syncDrillUI() {
  const on = !!drill;
  document.body.classList.toggle('drilled', on);
  /* tên dashboard con hiển thị thành dòng riêng dưới tên Ban, kèm nút quay lại */
  document.getElementById('h2Row').hidden = !on;
  if (on) {
    const name = drill.dim === 'unit' ? drill.label
      : drill.dim === 'status' ? `Nhiệm vụ ${L2_VERB[drill.v].toLowerCase()}`   /* nhãn trạng thái không có tên riêng */
        : drill.dim === 'soon' ? 'Nhiệm vụ sắp tới hạn (≤ 3 ngày)'
          : `Nhiệm vụ ${drill.label.charAt(0).toLowerCase()}${drill.label.slice(1)}`;   /* cap */
    document.getElementById('h2Name').textContent = name;
  }
  /* mọi drill (KPI / cấp trình / đơn vị chủ trì) đều thay toàn bộ lưới lớp 1 bằng dashboard riêng */
  document.querySelector('.kpis').hidden = on;
  document.querySelector('.grid').hidden = on;
  document.getElementById('l2').hidden = !on;
}
document.getElementById('drillBack').onclick = drillBack;
/* KPI: bấm vào thẻ để drill theo trạng thái / sắp tới hạn; thẻ Tổng = quay lại */
document.querySelectorAll('.kpi[data-drill]').forEach(k => k.addEventListener('click', () => {
  const [dim, v] = k.dataset.drill.split(':');
  if (dim === 'reset') return drillBack();
  if (dim === 'status') return drillTo('status', v, STATUS_LB[v]);
  if (dim === 'soon') return drillTo('soon', 1, 'Sắp tới hạn (≤ 3 ngày)');
}));
const sel = document.getElementById('fLd');
const LD_ORDER = ["Đ/c Nguyễn Duy Ngọc", "Đ/c Hà Minh Hải", "Đ/c Bùi Thị Quỳnh Vân", "Đ/c Nguyễn Thanh Bình", "Đ/c Nguyễn Thành Tâm", "Đ/c Trịnh Mạnh Linh"];
const ldSort = (a, b) => { const i = LD_ORDER.indexOf(a), j = LD_ORDER.indexOf(b); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); };

/* Dựng option cho dropdown "LĐ phụ trách" (#fLd). Chỉ được GỌI 1 LẦN DUY NHẤT trong suốt vòng đời trang
   (lần fetchKpiSummary() đầu tiên có dữ liệu thật, xem cờ ldOptionsBuiltFromApi) — không rebuild khi đổi
   kỳ báo cáo/ngày/LĐ đang lọc, và KHÔNG rebuild khi mở/đóng lớp 2 (drilldown từ KPI hay "Theo cấp trình
   đề án") nữa, theo đúng yêu cầu người dùng: danh sách LĐ giữ nguyên xuyên suốt, không đổi theo ngữ cảnh. */
function buildLdOptions() {
  const pool = TASKS.filter(matchDrill);   /* chỉ có tác dụng ở nhánh dự phòng bên dưới, khi chưa có kpiSummary.theoLanhDaoPhuTrach */
  /* ưu tiên: lấy đúng từ theoLanhDaoPhuTrach (API summary-kiem-dem) — khớp 100% với dữ liệu đang hiển thị ở card "Theo lãnh đạo Ban phụ trách" */
  if (kpiSummary && kpiSummary.theoLanhDaoPhuTrach) {
    /* id: giữ lại ld_phu_trach_id từ API, gắn vào data-id của <option> — đây là giá trị thật sự gửi lên
       API (param ldPhuTrach) khi lọc theo LĐ, xem selectedLdId() và fetchKpiSummary()/fetchThongKe() */
    const items = sortFilterLd(
      kpiSummary.theoLanhDaoPhuTrach.map(x => ({ label: ldLabel(x.ld_phu_trach), value: x.ld_phu_trach, id: x.ld_phu_trach_id })),
      it => it.id
    );
    if (ldFilter !== 'all' && !items.some(it => it.value === ldFilter)) ldFilter = 'all';
    sel.innerHTML = '<option value="all">Tất cả lãnh đạo</option>' +
      items.map(it => `<option value="${it.value}" data-id="${it.id ?? ''}"${it.value === ldFilter ? ' selected' : ''}>${it.label}</option>`).join('');
    return;
  }
  /* dự phòng cuối: suy từ dữ liệu nhiệm vụ mẫu */
  const lds = [...new Set(pool.map(r => r.ld))].sort(ldSort);
  if (ldFilter !== 'all' && !lds.includes(ldFilter)) ldFilter = 'all';
  sel.innerHTML = '<option value="all">Tất cả lãnh đạo</option>' +
    lds.map(v => `<option value="${v}"${v === ldFilter ? ' selected' : ''}>${v}</option>`).join('');
}
buildLdOptions();
/* mã LĐ phụ trách đang chọn (ld_phu_trach_id) — nguồn duy nhất là data-id của <option> đang selected trong
   dropdown #fLd; trả về null khi chọn "Tất cả lãnh đạo" hoặc khi dropdown đang ở nhánh dự phòng TASKS mẫu
   (không có data-id) → không gửi param ldPhuTrach lên API trong 2 trường hợp đó. */
function selectedLdId() {
  if (ldFilter === 'all') return null;
  const opt = sel.selectedOptions[0];
  return (opt && opt.dataset.id) || null;
}
/* giá trị param vanBanGiao gửi lên API — TÊN văn bản (không phải id), join bằng dấu phẩy, đúng theo ví dụ
   params đầy đủ trong api_kiem_dem_get_task.md (vanBanGiao=<tên văn bản>). "Chọn tất cả" và "Bỏ chọn" đều
   trả về null (không gửi param) — chỉ gửi khi chọn MỘT PHẦN (không phải tất cả, không phải rỗng). */
function vanBanGiaoParam() {
  return vbgMsel ? vbgMsel.getSelectedNames() : null;
}
sel.onchange = e => {
  ldFilter = e.target.value;
  renderAll();
  fetchKpiSummary();     /* lọc theo LĐ (ldPhuTrach=ld_phu_trach_id) áp cho cả API summary-kiem-dem */
  refreshDrillData();    /* ...và cho kiem-dem/thong-ke + kiem-dem/get-task nếu đang mở lớp 2 */
};
document.getElementById('from').onchange = autoScale;
document.getElementById('to').onchange = autoScale;
/* kỳ báo cáo áp cho toàn bộ dashboard: đặt lại khoảng ngày + độ mịn trục thời gian */
/* yyyy-mm-dd theo giờ ĐỊA PHƯƠNG — không dùng toISOString() vì nó quy đổi sang UTC,
   ở múi giờ UTC+7 (VN) sẽ làm ngày bị lùi lại 1 hôm trước 7h sáng */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const FINER = { week: 'day', month: 'week', quarter: 'month', year: 'month' };
const KY_TEXT = { week: 'tuần này', month: 'tháng này', quarter: 'quý này', year: 'năm nay' };
function setKy(p) {
  if (p === 'all') {
    isAllPeriod = true;
    document.getElementById('from').value = '';
    document.getElementById('to').value = '';
    tScale = 'month';
    renderAll();
    fetchKpiSummary();
    refreshDrillData();
    return;
  }
  isAllPeriod = false;
  const d = new Date(TODAY), y = d.getFullYear();
  let from, to;
  if (p === 'week') {
    const wd = (d.getDay() + 6) % 7;
    from = new Date(y, d.getMonth(), d.getDate() - wd);
    to = new Date(y, d.getMonth(), d.getDate() - wd + 6);
  } else if (p === 'month') {
    from = new Date(y, d.getMonth(), 1); to = new Date(y, d.getMonth() + 1, 0);
  } else if (p === 'quarter') {
    const q = ~~(d.getMonth() / 3);
    from = new Date(y, q * 3, 1); to = new Date(y, q * 3 + 3, 0);
  } else { from = new Date(y, 0, 1); to = new Date(y, 11, 31); }
  document.getElementById('from').value = iso(from);
  document.getElementById('to').value = iso(to);
  tScale = FINER[p];
  renderAll();
  fetchKpiSummary();
  refreshDrillData();
}
/* chọn tay khoảng ngày: tự chọn độ mịn hợp lý, bỏ đánh dấu nút kỳ */
function autoScale() {
  isAllPeriod = false;
  const f = new Date(document.getElementById('from').value),
    t = new Date(document.getElementById('to').value);
  const sp = (t - f) / 86400000;
  tScale = sp <= 31 ? 'day' : sp <= 120 ? 'week' : sp <= 400 ? 'month' : 'year';
  document.querySelectorAll('#tScale button').forEach(o => o.setAttribute('aria-pressed', false));
  renderAll();
  fetchKpiSummary();
  refreshDrillData();
}
document.querySelectorAll('#tScale button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#tScale button').forEach(o => o.setAttribute('aria-pressed', o === b));
  setKy(b.dataset.p);
});
document.querySelectorAll('#capScale button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#capScale button').forEach(o => o.setAttribute('aria-pressed', o === b));
  capView = b.dataset.v;
  if (!isCustomL2()) renderCapChart();
});
document.querySelectorAll('#l2CapScale button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#l2CapScale button').forEach(o => o.setAttribute('aria-pressed', o === b));
  l2CapView = b.dataset.v;
  renderL2CapChart();
});
document.getElementById('xlsx').onclick = openXModal;
document.getElementById('syncUp').onclick = syncUp;
document.getElementById('widgetToggle').onclick = e => {
  const body = document.getElementById('dashboardWidgetBody');
  const collapsed = body.classList.toggle('collapsed');
  e.currentTarget.textContent = collapsed ? '+' : '−';
  e.currentTarget.setAttribute('aria-label', collapsed ? 'Mở rộng' : 'Thu gọn');
  if (!collapsed) renderAll();   /* mở lại: vẽ lại chart để đo đúng kích thước hiện tại */
};
let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderAll, 150); });
setKy('year');   /* mặc định khi tải trang: chọn kỳ "Năm", tự gọi fetchKpiSummary() kèm tu/den tương ứng */

/* ---------- dropdown chọn nhiều: Chủ đề / Văn bản giao ----------
   Đổ dữ liệu từ API summary-filters (field vanBanGiao/chuDe, xem fetchSummaryFilters() bên dưới).
   items: mảng {value,label} — value = id (dùng để build query string), label = name (hiển thị) —
   tách riêng 2 field vì response có thể có id khác name dù dữ liệu mẫu hiện tại luôn trùng nhau. */
function initMultiSelect(cfg) {
  const { btn, panel, list, selected, label, onChange } = cfg;
  let items = cfg.items || [];
  let changeTimer;   /* debounce khi tick từng checkbox lẻ — tránh gọi API dồn dập lúc tick nhiều mục liên tiếp */
  const updateBtn = () => {
    btn.textContent = selected.size === 0 ? `${label}: Tất cả`
      : selected.size === 1 ? `${label}: ${items.find(it => it.value === [...selected][0])?.label ?? [...selected][0]}`
        : `${label}: ${selected.size} đã chọn`;
  };
  const render = () => {
    list.innerHTML = items.length
      ? items.map(it => `<label><input type="checkbox" value="${it.value}" ${selected.has(it.value) ? 'checked' : ''}>${it.label}</label>`).join('')
      : `<div class="msel-empty">Chưa có dữ liệu</div>`;
    list.querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => {
      cb.checked ? selected.add(cb.value) : selected.delete(cb.value);
      updateBtn();
      if (onChange) { clearTimeout(changeTimer); changeTimer = setTimeout(onChange, 350); }
    }));
    updateBtn();
  };
  btn.onclick = () => {
    const willOpen = panel.hidden;
    document.querySelectorAll('.msel-panel').forEach(p => p.hidden = true);
    document.querySelectorAll('.msel-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
    panel.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  };
  panel.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
    if (b.dataset.act === 'all') items.forEach(it => selected.add(it.value));
    else selected.clear();
    render();
    /* "Chọn tất cả"/"Bỏ chọn" là 1 thao tác trọn vẹn duy nhất — gọi onChange ngay, không debounce, và huỷ
       debounce đang chờ (nếu có) từ lần tick lẻ trước đó để tránh gọi 2 lần */
    if (onChange) { clearTimeout(changeTimer); onChange(); }
  });
  document.addEventListener('click', e => {
    if (panel.hidden) return;
    if (!panel.contains(e.target) && e.target !== btn) panel.hidden = true;
  });
  render();
  return {
    /* gọi lại khi có dữ liệu API — thay toàn bộ items rồi vẽ lại panel, giữ lựa chọn Set hiện tại (selected
       không bị đổi ở đây; item cũ không còn trong danh sách mới thì đơn giản không hiện checked nữa) */
    setItems(newItems) { items = newItems || []; render(); },
    /* giá trị dùng để gửi API: chọn 1 phần (không phải tất cả, không phải rỗng) → join label bằng dấu phẩy;
       chọn hết ("Chọn tất cả") hoặc không chọn gì ("Bỏ chọn") → null (không lọc, tương đương "Tất cả") */
    getSelectedNames() {
      if (!items.length || selected.size === 0 || selected.size >= items.length) return null;
      return items.filter(it => selected.has(it.value)).map(it => it.label).join(',');
    }
  };
}
const chuDeFilter = new Set();
const vanBanGiaoFilter = new Set();
/* onChange: đổi lựa chọn Văn bản giao phải lọc lại cả 3 API — summary-kiem-dem (KPI/chart lớp 1), và
   kiem-dem/thong-ke + kiem-dem/get-task nếu đang mở lớp 2 (refreshDrillData tự bỏ qua nếu !drill) */
const chuDeMsel = initMultiSelect({ btn: $('chuDeBtn'), panel: $('chuDePanel'), list: $('chuDeList'), items: [], selected: chuDeFilter, label: 'Chủ đề' });
vbgMsel = initMultiSelect({
  btn: $('vbgBtn'), panel: $('vbgPanel'), list: $('vbgList'), items: [], selected: vanBanGiaoFilter, label: 'Văn bản giao',
  onChange: () => { fetchKpiSummary(); refreshDrillData(); }
});

/* ---------- API summary-filters: đổ dữ liệu cho 2 dropdown "Chủ đề" / "Văn bản giao" ----------
   response: { vanBanGiao: [{id,name}], chuDe: [{id,name}], lanhDao: [...] } — lanhDao không dùng ở đây
   (đã dùng riêng cho sortFilterLd, mục 5.19). chuDe hiện luôn rỗng trong dữ liệu thực tế đã thấy — vẫn đổ
   nếu API có dữ liệu, không hard-code bỏ qua, chỉ đơn giản là dropdown sẽ trống cho tới khi backend có data. */
const SUMMARY_FILTERS_API = `${QLNV_API}/qlnv/v2/summary-filters`;
async function fetchSummaryFilters() {
  try {
    const res = await ttFetch(SUMMARY_FILTERS_API);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    vbgMsel.setItems((data.vanBanGiao || []).map(x => ({ value: x.id, label: x.name })));
    chuDeMsel.setItems((data.chuDe || []).map(x => ({ value: x.id, label: x.name })));
  } catch (err) {
    console.error('Không tải được danh mục Chủ đề / Văn bản giao:', err);
  }
}
fetchSummaryFilters();
