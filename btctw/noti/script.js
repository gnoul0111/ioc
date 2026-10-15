/* Base cua backend be_ioc_dash (user-tree / user-info / qlnv token).
   Cau hinh qua window.API_BASE trong khoi <script> config cua trang, giong window.IOC_API_BASE
   va window.QLNV_API_BASE. KHONG hardcode hostname: cookie "session" chi duoc gui kem khi request
   cung site, nen gan cung mot moi truong lam cac API nay that bai o moi truong con lai.
   Khong set thi dung chinh origin cua trang (theo domain, cong 443) — prefix /api-nest
   duoc reverse proxy tra ve be_ioc_dash. Moi truong nao con phai goi thang cong 3004
   thi set window.API_BASE tuong ung, KHONG hardcode trong code. Doc lai moi lan goi de khong phu thuoc thu tu load script. */
function resolveApiBase() {
    var b = (typeof window !== "undefined" && window.API_BASE) || "";
    b = String(b).trim().replace(/\/+$/, "");
    return b || location.origin;
}

(function () {
    /* QLNV API base — trỏ qua BE proxy same-host (:3000) /api (route GỐC be_qlnv).
       Kiến trúc (pivot 2026-07-16b): FE -> be_ioc_dash (proxy token/CORS) -> be_qlnv route GỐC
       (/qlnv, /danh-sach-nhiem-vu...). Nguồn sự thật = MongoDB; be_qlnv tự mirror BKAV qua module bmm.
       Proxy gắn JWT server-side; FE vẫn giữ luồng getQlnvToken (gửi kèm Bearer).
       Override: set window.QLNV_API_BASE trước khi load script nếu cần đổi host. */
    (function initQlnvApiConfig() {
        if (typeof window === "undefined") return;
        // Host ĐÚNG (BE xác nhận qua curl): dữ liệu QLNV nằm cùng host CRM = administrator.lifetex.vn:360.
        // Portal builder có thể tự set window.QLNV_API_BASE = iochn.hanoi.dcs.vn:3004 (host KHÔNG có route data -> 500).
        // -> ÉP: chưa set HOẶC đang trỏ :3004 thì bắt buộc dùng :360. Override sang host khác vẫn giữ nguyên.
        var QLNV_BASE_360 = "https://iochn.hanoi.dcs.vn:360/api";
        var cur = window.QLNV_API_BASE;
        if (!cur || /iochn\.hanoi\.dcs\.vn:3004/i.test(String(cur))) cur = QLNV_BASE_360;
        window.QLNV_API_BASE = cur;
    })();

    /* CRM Status Cache for mapping codes */
    var crmStatusCache = {
        DUT: null,    // Độ khẩn
        S3103: null,  // Nhóm lĩnh vực
        S3Z03: null,  // Loại văn bản
        LOAINHIEMVU: null, // Loại nhiệm vụ
        S3O03: null // Đơn vị chủ trì
    };
    let urlAPI = 'https://iochn.hanoi.dcs.vn:360';
    var CRM_STATUS_URL = `${urlAPI}/api/crm-source`;
    /* Cây cơ cấu tổ chức — NGUỒN DUY NHẤT là be_ioc_dash (đổi 2026-09-10, bỏ hẳn
       /qlnv/v2/organization-structure để cả hệ thống đọc chung một nguồn `organizations`):
         - /dashboards/user-tree         -> phạm vi được cấp, dùng cho ô "đơn vị chủ trì";
         - /dashboards/coordination-tree -> đơn vị NGANG CẤP (BE cắt sẵn), ô "đơn vị phối hợp".
       ⚠️ KHÔNG dùng `window.QLNV_API_BASE` làm base như bên tongquan: file này ÉP biến đó về host
       be_qlnv (:360/api) ở initQlnvApiConfig ngay đầu file, ghép vào sẽ gọi nhầm sang be_qlnv.
       Hai API đều đi bằng cookie session của cổng IOC -> phải có credentials:'include'. */
    var IOC_TREE_BASE = resolveApiBase() + "/api-nest/dashboards";
    var CRM_COORDINATOR_CODE = 'S3O03';
    var DOC_PICKER_URL = `${urlAPI}/api/incommingdocument/list-document-by-organ?&limit=10&sort=-updatedAt&filter%5Bstatus%5D=1&`;
    var QLNV_RECEIVED_DASHBOARD_URL = `${urlAPI}/api/danh-sach-nhiem-vu/moi?type=urgencyLevel&limit=100&sort=-createdAt&&`;
    /* Danh sách nhiệm vụ theo TAB NOTIFY (new-task/updated-task/near-end-task...) — xem fetchLinhVucTaskList/
       openLinhVucDrawer bên dưới; đổi từ /qlnv/v2/get-task?nhomLinhVuc=... sang route này (lọc theo `type`
       = notiType của tab, KHÔNG còn theo lĩnh vực). */
    var LINH_VUC_TASK_LIST_URL = `${urlAPI}/api/qlnv/v2/notify-task-list`;
    var SUB_TASK_V2_URL = `${urlAPI}/api/qlnv/v2/sub-task`;
    /* Phạm vi = đơn vị của TÀI KHOẢN ĐĂNG NHẬP (/qlnv/v2/pham-vi -> canBo.iddv), thay id trang CMS
       hard-code. notify-statistic / notify-task-list / sub-task đều chạy qua apPhamViTuToken() bên BE:
       tham số pageId client gửi bị xoá rồi suy lại từ token, nên FE không gửi nữa. iddv chỉ còn dùng
       để cắt phạm vi cây đơn vị cho các picker (xem qlnvOrgScopeRoot). Nguồn iddv là
       qlnvLoadMyScope()/__qlnvScopeInfo sẵn có bên dưới cùng file — KHÔNG khai báo bản thứ hai,
       trùng tên hàm/biến trong cùng IIFE là ghi đè lẫn nhau. */
    function qlnvMyIddv() {
        return __qlnvScopeInfo && __qlnvScopeInfo.iddv != null ? String(__qlnvScopeInfo.iddv) : '';
    }

    /* ============================================================
     * QLNV TOKEN — LẤY RUNTIME (thay JWT hard-code, sửa bug SEC-01)
     * Chuỗi 3 API: (1) /api/v1/me/ [session portal] -> username
     *              (2) oauth/token [password grant] -> access token opaque
     *              (3) oauth/authorize -> callback -> JWT app (dùng QLNV)
     * ⚠️ [VERIFY-Phase0]: field response + CORS + cách callback trả JWT (DevTools). Điểm cần xác nhận đánh dấu [VERIFY].
     * ============================================================ */
    var QLNV_TOKEN_CFG = {
        meUrl: 'https://iochn.hanoi.dcs.vn/api/v1/me/',                           // [VERIFY] API1 same-origin
        oauthBase: 'https://administrator.lifetex.vn:351',                       // [VERIFY] API2/3 host
        tokenPath: '/oauth/token',
        authorizePath: '/oauth/authorize',
        clientIdToken: 'authServer',
        clientIdAuthorize: '03_Driver',
        redirectUri: 'https://administrator.lifetex.vn:353/api/oauth/callback',  // [VERIFY]
        state: 'antiCSRF',
        scope: 'user',
        username: 'canbopx',        // [TẠM] chỉ dùng cho fallback OAuth frontend (không khuyến nghị — CORS chặn bước 3)
        servicePassword: '12345678', // [TẠM] chỉ dùng cho fallback OAuth frontend. Prod: để backend proxy giữ, KHÔNG để đây
        useAuthorizeStep: false,     // bước 3 oauth/authorize bị CORS ở frontend -> luôn để false; dùng proxy backend thay thế
        // ✅ KHUYẾN NGHỊ: trỏ tới backend proxy be_ioc_dash (làm trọn OAuth server-side, hết CORS, không lộ credential).
        //    Cùng host BE: '/api/qlnv/token'. Khác host: 'https://<be_ioc_dash_host>/api/qlnv/token' (BE phải có origin dashboard trong CORS allowlist).
        // [CẤU HÌNH] endpoint proxy BE (be_ioc_dash). Khác port :3000 => cross-origin => BE PHẢI whitelist origin dashboard trong CORS (main.ts) + credentials:true.
        // Cookie session gửi được vì cùng hostname iochn.hanoi.dcs.vn (cookie không phân biệt port). Nếu BE chỉ HTTP thì trang HTTPS sẽ chặn mixed-content -> cần TLS trước BE.
        proxyTokenUrl: resolveApiBase() + '/api/token'
    };

    var _qlnvTokenState = { jwt: '', expMs: 0, inflight: null };

    function _qlnvReadCookie(name) {
        try {
            var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : '';
        } catch (e) { return ''; }
    }
    function _qlnvCsrfToken() {
        // [VERIFY] nguồn x-csrftoken runtime — thử các cookie phổ biến
        return _qlnvReadCookie('csrftoken') || _qlnvReadCookie('csrf') || _qlnvReadCookie('XSRF-TOKEN') || '';
    }
    var QLNV_TOKEN_MAX_AGE_MS = 10 * 60 * 1000;
    function _qlnvParseJwtExpMs(jwt) {
        try {
            var parts = String(jwt).split('.');
            if (parts.length < 2) return 0;
            var b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b.length % 4) b += '=';
            var payload = JSON.parse(atob(b));
            if (!payload || !payload.exp) return 0;
            // CHẶN TRẦN hạn dùng lại. Token SSO trả exp = 361789526284 (năm 13434, expires_in
            // hơn 11.000 năm) -> nếu tin nguyên giá trị đó thì token nằm trong localStorage
            // vĩnh viễn: đăng xuất rồi người khác đăng nhập trên cùng máy vẫn gọi API bằng
            // token của người trước. Trần này ép lấy lại token từ /api/token (same-origin,
            // cookie sẵn có nên rất rẻ) sau mỗi QLNV_TOKEN_MAX_AGE_MS.
            return Math.min(payload.exp * 1000, Date.now() + QLNV_TOKEN_MAX_AGE_MS);
        } catch (e) { return 0; }
    }
    function _qlnvPick(obj, keys) {
        for (var i = 0; i < keys.length; i++) {
            var cur = obj, parts = keys[i].split('.'), ok = true;
            for (var j = 0; j < parts.length; j++) {
                if (cur && typeof cur === 'object' && parts[j] in cur) { cur = cur[parts[j]]; } else { ok = false; break; }
            }
            if (ok && cur != null && cur !== '') return cur;
        }
        return '';
    }
    function assEsc(v) {
        return String(v == null ? "" : v)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
    function _qlnvErr(code, msg) { var e = new Error(msg || code); e.code = code; return e; }

    /* Token do HOST/portal cấp lúc runtime (KHÔNG hard-code trong source).
     * Portal nhúng dashboard set 1 trong 2: window.QLNV_JWT_TOKEN hoặc localStorage.access_token.
     * (đúng ý comment gốc file). Để test tay: localStorage.setItem('access_token','<jwt>'). */
    function _qlnvHostToken() {
        try { if (typeof window !== 'undefined' && window.QLNV_JWT_TOKEN) return String(window.QLNV_JWT_TOKEN); } catch (e) { }
        try { var t = localStorage.getItem('access_token'); if (t) return String(t); } catch (e) { }
        return '';
    }

    /* API1: session portal -> username. [TẠM] best-effort: nếu /me/ lỗi/không có field -> fallback QLNV_TOKEN_CFG.username ('Botruong'), KHÔNG chặn luồng. */
    function _qlnvFetchUsername() {
        var headers = { 'Accept': 'application/json' };
        var csrf = _qlnvCsrfToken();
        if (csrf) headers['x-csrftoken'] = csrf;
        return fetch(QLNV_TOKEN_CFG.meUrl, { credentials: 'include', headers: headers }).then(function (r) {
            if (!r.ok) return null;   // [TẠM] không chặn (401/403/lỗi) -> dùng username cấu hình
            return r.json();
        }).then(function (me) {
            var u = me ? _qlnvPick(me, ['username', 'userName', 'user_name', 'data.username', 'data.userName', 'user.username', 'user.userName', 'email', 'data.email']) : ''; // [VERIFY] field username
            return String(u || QLNV_TOKEN_CFG.username);   // [TẠM] mặc định Botruong
        }, function () {
            return QLNV_TOKEN_CFG.username;   // [TẠM] /me/ lỗi CORS/mạng -> Botruong
        });
    }
    /* API2: password grant -> access token opaque */
    function _qlnvFetchAccessToken(username) {
        var body = 'username=' + encodeURIComponent(username)
            + '&password=' + encodeURIComponent(QLNV_TOKEN_CFG.servicePassword)
            + '&client_id=' + encodeURIComponent(QLNV_TOKEN_CFG.clientIdToken)
            + '&grant_type=password&scope=' + encodeURIComponent(QLNV_TOKEN_CFG.scope);
        return fetch(QLNV_TOKEN_CFG.oauthBase + QLNV_TOKEN_CFG.tokenPath, {
            method: 'POST',
            headers: { 'Accept': '*/*', 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            credentials: 'omit',
            body: body
        }).then(function (r) {
            if (!r.ok) throw _qlnvErr('OAUTH_FAILED', 'oauth/token HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            var t = _qlnvPick(res, ['access_token', 'accessToken', 'token', 'data.access_token', 'data.token']); // [VERIFY] field access_token
            if (!t) throw _qlnvErr('OAUTH_FAILED', 'Không có access_token từ oauth/token');
            return String(t);
        }, function (err) {
            if (err && err.code) throw err;
            throw _qlnvErr('CORS_BLOCKED', 'Không gọi được oauth/token (CORS/mạng): ' + (err && err.message || err));
        });
    }
    /* API3: authorize -> callback -> JWT app cuối */
    function _qlnvFetchAppJwt(accessTokenB2) {
        var q = '?client_id=' + encodeURIComponent(QLNV_TOKEN_CFG.clientIdAuthorize)
            + '&allowed=true'
            + '&redirect_uri=' + encodeURIComponent(QLNV_TOKEN_CFG.redirectUri)
            + '&state=' + encodeURIComponent(QLNV_TOKEN_CFG.state)
            + '&response_type=code&scope=' + encodeURIComponent(QLNV_TOKEN_CFG.scope);
        return fetch(QLNV_TOKEN_CFG.oauthBase + QLNV_TOKEN_CFG.authorizePath + q, {
            headers: { 'Accept': '*/*', 'Authorization': 'Bearer ' + accessTokenB2 },
            credentials: 'include',
            redirect: 'follow'
        }).then(function (r) {
            if (!r.ok) throw _qlnvErr('OAUTH_FAILED', 'oauth/authorize HTTP ' + r.status);
            var ct = r.headers.get('content-type') || '';
            if (ct.indexOf('json') >= 0) return r.json();
            return r.text().then(function (t) { try { return JSON.parse(t); } catch (e) { return { _raw: t }; } });
        }).then(function (res) {
            // [VERIFY-Phase0] callback trả JWT ở đâu: JSON body / cookie do callback set
            var jwt = _qlnvPick(res, ['access_token', 'accessToken', 'token', 'jwt', 'data.access_token', 'data.token', 'data.jwt']);
            if (!jwt) {
                jwt = _qlnvReadCookie('access_token') || (function () { try { return localStorage.getItem('access_token') || ''; } catch (e) { return ''; } })();
            }
            if (!jwt) throw _qlnvErr('OAUTH_FAILED', 'Không lấy được JWT từ oauth/authorize callback [VERIFY Phase0]');
            return String(jwt);
        }, function (err) {
            if (err && err.code) throw err;
            throw _qlnvErr('CORS_BLOCKED', 'Không gọi được oauth/authorize (CORS/redirect): ' + (err && err.message || err));
        });
    }

    /* Lấy JWT từ BACKEND PROXY (be_ioc_dash /api/qlnv/token) — làm trọn OAuth server-side, hết CORS */
    function _qlnvFetchProxyToken() {
        if (!QLNV_TOKEN_CFG.proxyTokenUrl) return Promise.reject(_qlnvErr('OAUTH_FAILED', 'Chưa cấu hình proxyTokenUrl'));
        return fetch(QLNV_TOKEN_CFG.proxyTokenUrl, { credentials: 'include', headers: { 'Accept': 'application/json' } }).then(function (r) {
            if (r.status === 401 || r.status === 403) throw _qlnvErr('NOT_AUTHENTICATED', 'Proxy: chưa đăng nhập (' + r.status + ')');
            if (!r.ok) throw _qlnvErr('OAUTH_FAILED', 'Proxy token HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            // [VERIFY-Phase0 đã xác nhận] Response thực tế: { tokenBase: { access_token (opaque, không phải JWT) },
            // token: { jwt_access_token (JWT thật), jwt_expires_at, source } }. Ưu tiên jwt_access_token trước —
            // nếu để 'token' (bare key) đứng trước, _qlnvPick khớp nhầm cả OBJECT token{...} (khác null/rỗng) rồi
            // String(t) ra "[object Object]", tạo header Authorization rác -> mọi API (kể cả crm-source) 401.
            var t = _qlnvPick(res, ['token.jwt_access_token', 'jwt_access_token', 'access_token', 'tokenBase.access_token', 'data.access_token']);
            if (!t) throw _qlnvErr('OAUTH_FAILED', 'Proxy không trả access_token');
            return String(t);
        }, function (err) {
            if (err && err.code) throw err;
            throw _qlnvErr('CORS_BLOCKED', 'Không gọi được proxy token: ' + (err && err.message || err));
        });
    }

    /* Orchestrator: proxy backend (ưu tiên) hoặc OAuth frontend (fallback) + cache in-memory + exp + in-flight dedupe */
    function getQlnvToken(opts) {
        opts = opts || {};
        var now = Date.now();
        // TẠM THỜI (DEV): có token nạp sẵn thì dùng luôn, khỏi gọi proxy (401 ở localhost).
        if (typeof window !== 'undefined' && window.QLNV_DEV_TOKEN) {
            _qlnvTokenState.jwt = window.QLNV_DEV_TOKEN;
            _qlnvTokenState.expMs = _qlnvParseJwtExpMs(window.QLNV_DEV_TOKEN) || now + 60 * 60000;
            return Promise.resolve(_qlnvTokenState.jwt);
        }
        if (!opts.force && _qlnvTokenState.jwt && now < _qlnvTokenState.expMs - 60000) {
            return Promise.resolve(_qlnvTokenState.jwt);
        }
        // Token do widget KHÁC (iframe khác, cùng origin: tongquan/noti/...) lấy trước đó
        // và lưu localStorage — dùng lại thay vì mỗi iframe tự xin token riêng của mình.
        if (!opts.force) {
            var shared = localStorage.getItem('qlnv_jwt_access_token') || '';
            var sharedExp = shared ? _qlnvParseJwtExpMs(shared) : 0;
            if (shared && sharedExp && now < sharedExp - 60000) {
                _qlnvTokenState.jwt = shared;
                _qlnvTokenState.expMs = sharedExp;
                return Promise.resolve(shared);
            }
        }
        // Token do HOST cấp (window.QLNV_JWT_TOKEN / localStorage.access_token) CHỈ dùng khi KHÔNG cấu hình proxy.
        // Có proxy -> luôn ưu tiên proxy (tránh localStorage.access_token cũ đè, làm không gọi BE).
        if (!QLNV_TOKEN_CFG.proxyTokenUrl) {
            var host = _qlnvHostToken();
            if (host) {
                _qlnvTokenState.jwt = host;
                _qlnvTokenState.expMs = _qlnvParseJwtExpMs(host) || (now + 5 * 60000);
                return Promise.resolve(host);
            }
        }
        if (_qlnvTokenState.inflight) return _qlnvTokenState.inflight;
        // Ưu tiên BACKEND PROXY (đúng chuẩn, hết CORS). Không cấu hình proxy -> fallback OAuth frontend (bước 3 thường lỗi CORS).
        var acquire = QLNV_TOKEN_CFG.proxyTokenUrl
            ? _qlnvFetchProxyToken()
            : _qlnvFetchUsername()
                .then(_qlnvFetchAccessToken)
                .then(function (accessTokenB2) {
                    if (QLNV_TOKEN_CFG.useAuthorizeStep) return _qlnvFetchAppJwt(accessTokenB2);
                    return accessTokenB2;
                });
        var p = acquire
            .then(function (jwt) {
                _qlnvTokenState.jwt = jwt;
                var exp = _qlnvParseJwtExpMs(jwt);
                _qlnvTokenState.expMs = exp || (Date.now() + 5 * 60000); // không parse được exp -> refresh sau 5'
                _qlnvTokenState.inflight = null;
                try { localStorage.setItem('qlnv_jwt_access_token', jwt); } catch (e) { }
                return jwt;
            }, function (err) {
                _qlnvTokenState.inflight = null;
                throw err;
            });
        _qlnvTokenState.inflight = p;
        return p;
    }
    function clearQlnvToken() { _qlnvTokenState.jwt = ''; _qlnvTokenState.expMs = 0; _qlnvTokenState.inflight = null; }

    /* Accessor ĐỒNG BỘ: trả token đang cache ('' nếu chưa acquire). KHÔNG còn JWT hard-code. */
    function readQlnvToken() { return _qlnvTokenState.jwt || ''; }

    try { if (typeof window !== 'undefined') { window.QlnvToken = { get: getQlnvToken, clear: clearQlnvToken, current: readQlnvToken }; } } catch (e) { }

    function extractCrmStatusList(payload) {
        if (Array.isArray(payload)) return payload;
        if (!payload || typeof payload !== 'object') return [];

        var directKeys = ['data', 'items', 'rows', 'results', 'docs'];
        for (var i = 0; i < directKeys.length; i += 1) {
            var value = payload[directKeys[i]];
            if (Array.isArray(value)) return value;
            if (value && typeof value === 'object') {
                var nested = extractCrmStatusList(value);
                if (nested.length) return nested;
            }
        }

        var objectKeys = Object.keys(payload);
        for (var j = 0; j < objectKeys.length; j += 1) {
            var child = payload[objectKeys[j]];
            if (child && typeof child === 'object') {
                var childList = extractCrmStatusList(child);
                if (childList.length) return childList;
            }
        }

        return [];
    }

    function findCrmGroupByCode(list, code) {
        if (!Array.isArray(list)) return null;
        for (var i = 0; i < list.length; i += 1) {
            var item = list[i];
            if (item && item.code === code) return item;
        }
        return null;
    }

    async function loadCrmStatusMapping() {
        var token = ''; try { token = await getQlnvToken(); } catch (e) { token = ''; }
        var _crmHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
        if (token) _crmHeaders.Authorization = 'Bearer ' + token;
        return fetch(CRM_STATUS_URL, {
            headers: _crmHeaders
        }).then(function (r) {
            if (!r.ok) throw new Error('CRM Status HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            var data = extractCrmStatusList(res);
            crmStatusCache.DUT = findCrmGroupByCode(data, 'DUT');
            crmStatusCache.S3103 = findCrmGroupByCode(data, 'S3103');
            crmStatusCache.S3Z03 = findCrmGroupByCode(data, 'S3Z03');
            crmStatusCache.LOAINHIEMVU = findCrmGroupByCode(data, 'LOAINHIEMVU');
            crmStatusCache.S3O03 = findCrmGroupByCode(data, 'S3O03');
            return crmStatusCache;
        }).catch(function (err) {
            console.warn('[CRM] Load failed:', err);
            return crmStatusCache;
        });
    }

    /* Danh sách "nhóm lĩnh vực" cho tabs notify giờ lấy TRỰC TIẾP từ /qlnv/thong-ke-linh-vuc (field
       `danhSach`, mỗi item đã có sẵn name/value/count) — KHÔNG còn map qua CRM S3103 như trước (API cũ
       chỉ trả đếm theo mã, phải ghép tên từ CRM). Xem baseNotifications() + refreshNotifyTabs(). */

    function syncAssignmentOptionsFromCrmStatus() {
        var fieldValues = crmStatusCache.S3103 && crmStatusCache.S3103.data
            ? crmStatusCache.S3103.data.map(function (item) {
                return item.name || item.title || item.value;
            }).filter(Boolean)
            : [];
        var docTypeValues = crmStatusCache.S3Z03 && crmStatusCache.S3Z03.data
            ? crmStatusCache.S3Z03.data.map(function (item) {
                return item.name || item.title || item.value;
            }).filter(Boolean)
            : [];
        var urgencyValues = crmStatusCache.DUT && crmStatusCache.DUT.data
            ? crmStatusCache.DUT.data.map(function (item) {
                return item.name || item.title || item.value;
            }).filter(Boolean)
            : [];
        var loaiNhiemVuValues = crmStatusCache.LOAINHIEMVU && crmStatusCache.LOAINHIEMVU.data
            ? crmStatusCache.LOAINHIEMVU.data.map(function (item) {
                return item.name || item.title || item.value;
            }).filter(Boolean)
            : [];
        var leadUnitValues = crmStatusCache.S3O03 && crmStatusCache.S3O03.data
            ? crmStatusCache.S3O03.data.map(function (item) {
                return item.name || item.title || item.value;
            }).filter(Boolean)
            : [];

        if (fieldValues.length) {
            window.__crmFieldOptions = fieldValues.slice();
            Object.keys(fieldPool).forEach(function (role) {
                fieldPool[role] = fieldValues.slice();
            });
        }

        if (docTypeValues.length) {
            window.__crmDocTypeOptions = docTypeValues.slice();
            docTypeOptions.length = 0;
            docTypeValues.forEach(function (item) {
                docTypeOptions.push(item);
            });
        }

        if (urgencyValues.length) {
            window.__crmUrgencyOptions = urgencyValues.slice();
            assignmentCatalogState.urgencyOptions = urgencyValues.map(function (v) {
                return { value: v, label: v };
            });
        }

        if (loaiNhiemVuValues.length) {
            window.__crmLoaiNhiemVuOptions = loaiNhiemVuValues.slice();
        }

        if (leadUnitValues.length) {
            window.__crmLeadUnitOptions = leadUnitValues.slice();
        }
    }

    function getCrmConfigItems(crmCode) {
        var crmGroup = crmStatusCache[crmCode];
        return crmGroup && Array.isArray(crmGroup.data) ? crmGroup.data : [];
    }

    function normalizeCrmText(value) {
        return String(value || '').trim().toLowerCase();
    }

    function findCrmConfigItem(crmCode, rawValue) {
        var normalized = normalizeCrmText(rawValue);
        if (!normalized) return null;
        return getCrmConfigItems(crmCode).find(function (item) {
            return [
                item && item.name,
                item && item.title,
                item && item.value,
                item && item.code,
            ].some(function (candidate) {
                return normalizeCrmText(candidate) === normalized;
            });
        }) || null;
    }

    function renderUrgencyOptions() {
        var urgencyOptions = window.__crmUrgencyOptions && window.__crmUrgencyOptions.length
            ? window.__crmUrgencyOptions
            : [];
        var currentValue = document.getElementById('assUrgency')
            ? document.getElementById('assUrgency').value
            : 'Thường';
        if (!urgencyOptions.length) {
            return '<option value="">Đang tải độ khẩn...</option>';
        }
        var html = urgencyOptions.map(function (item) {
            var selected = item === currentValue || (!currentValue && item === 'Thường')
                ? ' selected'
                : '';
            return '<option' + selected + '>' + item + '</option>';
        }).join('');
        return html;
    }

    function renderLeadUnitOptions() {
        var options = window.__orgLeadUnitOptions && window.__orgLeadUnitOptions.length
            ? window.__orgLeadUnitOptions
            : [];
        if (!options.length) {
            return '<option value="">Đang tải đơn vị chủ trì...</option>';
        }
        return options.map(function (item, index) {
            var selected = index === 0 ? ' selected' : '';
            var label = item.fullName || item.name || item.code || '';
            return '<option value="' + (item.id || item._id || '') + '"' + selected + '>' + label + '</option>';
        }).join('');
    }

    function getAdministrativeUnitState() {
        if (!window.__adminUnitState) {
            window.__adminUnitState = {
                page: 1,
                step: 20,
                threshold: 5,
                items: [],
                total: null,
                loading: false,
                hasMore: true,
                selectedId: '',
                selectedLabel: '',
                query: ''
            };
        }
        return window.__adminUnitState;
    }

    function normalizeAdministrativeUnitItem(item, index) {
        var label = item && (item.name || item.fullName || item.tenDonVi || item.title || item.organizationName || item.departmentName || item.code || ('Đơn vị ' + (index + 1)));
        return {
            id: String(item && (item._id || item.id || item.code || label) || ''),
            name: label,
            fullName: label,
            code: item && item.code ? item.code : '',
            raw: item || null
        };
    }

    function extractAdministrativeUnitTotal(res, fallback) {
        var body = res && res.data && !Array.isArray(res.data) ? res.data : res;
        if (!body || typeof body !== 'object') return fallback;
        var meta = body.meta && typeof body.meta === 'object' ? body.meta : null;
        var pagination = body.pagination && typeof body.pagination === 'object' ? body.pagination : null;
        return Number(
            body.tong != null ? body.tong // /qlnv/v2/get-task trả tổng số ở `tong` (xem file.js normalizeData)
                : body.total != null ? body.total
                    : body.count != null ? body.count
                        : body.totalItems != null ? body.totalItems
                            : pagination && pagination.total != null ? pagination.total
                                : pagination && pagination.totalItems != null ? pagination.totalItems
                                    : meta && meta.total != null ? meta.total
                                        : fallback
        ) || fallback;
    }

    /* ============================== CÂY ĐƠN VỊ (user-tree + coordination-tree) ==============================
       Route v2 tạo nhiệm vụ (qlnvCreateTaskV2/buildQlnvCreateBodyV2) nhận thẳng id SỐ của cây này, không cần
       quy đổi ObjectId như administrative-units — đã kiểm chứng ở khối "Giao nhiệm vụ" của tongquan.js.
       id của `organizations` (be_ioc_dash) trùng `iddv` của datamart: đối chiếu toàn bộ 3.664 đơn vị
       ngày 2026-09-10 thì 3.660 khớp cả id lẫn tên, 0 đơn vị không tra được -> be_qlnv giải mã được hết.
       Hai route đều trả TOÀN BỘ cây 1 lần (không page/limit) -> tải 1 lần + cache, gộp lời gọi trùng.
       Lỗi -> cây rỗng, form vẫn mở được (không chặn UI). */
    var __qlnvOrg = null, __qlnvOrgP = null;
    /* Làm PHẲNG cây lồng của user-tree/coordination-tree về đúng shape cũ của
       organization-structure ({id, name, parent}) để MỌI chỗ dùng `nodes` phía dưới
       (qlnvOrgBuildTree, qlnvOrgById, loadAdministrativeUnits, cache tên đơn vị...) không
       phải sửa. Gắn thêm:
         - `_src`  : 'ut' (user-tree) hay 'coord' (coordination-tree) — hai ô lấy gốc khác nhau;
         - `_root` : node gốc của cây đó.
       id đơn vị lấy như FE tongquan: node `custom-*` để ở `orgId`, node `org-*` thì chính `id`
       (xem assUserTreeUnitId), fallback là phần tử cuối của path/external_path. */
    function qlnvTreeUnitId(n) {
        if (!n) return '';
        if (n.orgId != null && n.orgId !== '') return String(n.orgId);
        var seg = String(n.external_path || '').split('.')
            .concat(String(n.path || '').split('/'))
            .filter(function (s) { return s !== ''; });
        if (seg.length) return String(seg[seg.length - 1]);
        if (n.id != null && String(n.key || '').indexOf('org-') === 0) return String(n.id);
        return '';
    }
    function qlnvFlattenTree(res, src, out, seen) {
        (function walk(arr, parentId) {
            (arr || []).forEach(function (n) {
                if (!n) return;
                var id = qlnvTreeUnitId(n);
                // Node không ra được id thì bỏ qua NHƯNG vẫn đi tiếp xuống con, để nhánh dưới
                // không mất theo (con treo lên cấp trên còn lại).
                if (!id) return walk(n.children, parentId);
                if (!seen[id]) {
                    seen[id] = 1;
                    out.push({
                        id: isNaN(Number(id)) ? id : Number(id),
                        name: n.name || n.title || id,
                        parent: parentId === '' ? null : parentId,
                        _src: src,
                        _root: parentId === '',
                        /* Đường dẫn cơ cấu, giữ để qlnvOrgDuoiMinh phân biệt CẤP DƯỚI với
                           NGANG CẤP — node gốc user-tree luôn có parent null nên `parent`
                           không nói được gì. */
                        _path: n.external_path || n.path || null,
                    });
                }
                walk(n.children, id);
            });
        })((res && (res.tree || res.data)) || [], '');
        return out;
    }
    function qlnvFetchTree(path) {
        return fetch(IOC_TREE_BASE + path, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        }).then(function (r) {
            if (!r.ok) throw new Error('IOC TREE HTTP ' + r.status + ' ' + path);
            return r.json();
        }, function (err) {
            console.warn('[IOC TREE] Load failed:', path, err);
            return {};
        });
    }
    function qlnvLoadOrgStructure() {
        if (__qlnvOrg) return Promise.resolve(__qlnvOrg);
        if (__qlnvOrgP) return __qlnvOrgP;
        /* Nạp kèm phạm vi tài khoản: qlnvOrgScopeRoot() là hàm ĐỒNG BỘ, mọi picker đều đi qua
           promise này trước nên chờ ở đây là đủ để __qlnvScopeInfo có sẵn khi cắt cây. */
        __qlnvOrgP = Promise.all([
            qlnvFetchTree('/user-tree'),
            qlnvFetchTree('/coordination-tree'),
            qlnvLoadMyScope(),
        ]).then(function (r) {
            /* MỘT DANH SÁCH PHẲNG GỘP cả hai cây, khử trùng theo id (user-tree ưu tiên): đơn vị
               ngang cấp nằm NGOÀI phạm vi user-tree nên nếu để riêng thì tra byId/children lúc
               mở ▸ ở ô phối hợp sẽ trượt. Vai của từng node do `_src`/`_root` quyết định. */
            var seen = {}, out = [];
            qlnvFlattenTree(r[0], 'ut', out, seen);
            qlnvFlattenTree(r[1], 'coord', out, seen);
            __qlnvOrg = out;
            __qlnvOrgP = null;
            if (!out.length) console.warn('[IOC TREE] cây đơn vị rỗng -> các picker sẽ trống');
            return __qlnvOrg;
        }, function (err) {
            console.warn('[IOC TREE] Load failed:', err);
            __qlnvOrg = [];
            __qlnvOrgP = null;
            return __qlnvOrg;
        });
        return __qlnvOrgP;
    }
    /* Dựng cây lồng nhau (gắn `child`) từ danh sách phẳng org-structure — dùng chung cho cả 3 cây chọn đơn vị
       (Giao nhiệm vụ / Nhập notify / Giao nhiệm vụ nhánh), thay 3 bản *BuildUnitTree gần giống hệt nhau từng
       dựng từ administrative-units. org-structure KHÔNG có `governanceAxis` (field riêng của Mongo
       administrative-units) nên bỏ hẳn phần sắp theo khối ĐẢNG/HĐND/UBND/MTTQ — giữ nguyên thứ tự BE trả về.
       id ở đây là SỐ (iddv BKAV); *UnitTreeId() hiện có đã tự ép String(n.id) nên không cần đổi gì thêm. */
    function qlnvOrgBuildTree(nodes) {
        var byId = {}, roots = [];
        (nodes || []).forEach(function (n) {
            if (!n || n.id == null) return;
            n.child = [];
            byId[String(n.id)] = n;
        });
        (nodes || []).forEach(function (n) {
            if (!n || n.id == null) return;
            var pid = n.parent == null ? '' : String(n.parent);
            if (pid && byId[pid]) byId[pid].child.push(n);
            else roots.push(n);
        });
        return roots;
    }
    /* Port từ assScopeRoot/assLocalityName/assPickerRoots/assCoordRoots (tongquan.js:3516-3607): qlnvOrgBuildTree()
       ở trên trả về TOÀN BỘ cây từ gốc — gồm cả nhánh "900000 BAN TỔ CHỨC TRUNG ƯƠNG" không thuộc Hà Nội, chọn
       nhầm các đơn vị này BE không tra được (chặn hẳn phát hành) — không lọc theo đơn vị đang đăng nhập như bên
       tongquan.js. 3 picker "đơn vị nhận"/"đơn vị phối hợp" của qlnv_v2.js (Giao nhiệm vụ/Nhập notify/Nhiệm vụ
       nhánh) dùng chung các hàm này, cắt phạm vi theo iddv của token (qlnvLoadMyScope).
       Nhận CHÍNH array `nodes` phẳng (từ qlnvLoadOrgStructure), không phải cây đã lồng `.child`. */
    function qlnvOrgNorm(v) {
        return String(v || '').trim().toLowerCase();
    }
    function qlnvOrgById(nodes) {
        var byId = {};
        (nodes || []).forEach(function (n) { if (n && n.id != null) byId[String(n.id)] = n; });
        return byId;
    }
    function qlnvOrgChildrenOf(nodes, parentId) {
        var pid = parentId == null ? '' : String(parentId);
        return (nodes || []).filter(function (n) { return n && String(n.parent == null ? '' : n.parent) === pid; });
    }
    /* Gốc phạm vi = đơn vị của TÀI KHOẢN ĐĂNG NHẬP (pham-vi.canBo.iddv, chính là `id` node trong cây
       cơ cấu tổ chức) — giống assScopeRoot bên tongquan.js. Không lùi về dashboardId nữa: id trang CMS
       là hệ id khác hẳn iddv datamart, lùi về nó là cắt phạm vi vào nhầm đơn vị. */
    function qlnvOrgScopeRoot(nodes) {
        var iddv = qlnvMyIddv();
        if (!iddv) return null;
        var self = (nodes || []).find(function (n) { return n && String(n.id) === iddv; }) || null;
        if (!self || !(__qlnvScopeInfo && __qlnvScopeInfo.viewAllUnits)) return self;
        /* LÃNH ĐẠO XEM TOÀN HỆ THỐNG -> phạm vi giao việc là CẢ CÂY nên gốc là node cao nhất,
           không phải đơn vị trên giấy tờ. Ca thật: `hoangvanbang_vptu` có iddv = 701 "Văn phòng
           Thành ủy" nhưng được cấp cả cây Hà Nội; bám 701 thì ô nhận chỉ ra 7 phòng của Văn
           phòng, trong khi phải là 4 TRỤC (cấp dưới của 490 THÀNH PHỐ HÀ NỘI).
           Leo cây thay vì hard-code 490 để cây BTCTW (900000) cũng đúng. Xem assScopeRoot bên
           tongquan/script.js. */
        var byId = qlnvOrgById(nodes);
        var cur = self;
        for (var g = 0; cur && cur.parent != null && String(cur.parent) !== '' && g < 50; g++) {
            var p = byId[String(cur.parent)];
            if (!p) break;
            cur = p;
        }
        return cur;
    }
    /* Node GỐC của từng cây — `_root` do qlnvFlattenTree gắn khi làm phẳng. */
    function qlnvOrgRootsOf(nodes, src) {
        return (nodes || []).filter(function (n) { return n && n._root && n._src === src; });
    }
    /* Node này có nằm DƯỚI đơn vị đang đăng nhập không — xét theo `_path` cơ cấu, vì node gốc
       user-tree có parent null nên không suy ra được quan hệ. Không có `_path` -> true (chỉ
       loại khi CHỨNG MINH được là ngang cấp). Cùng ngữ nghĩa assDuoiMinh bên tongquan.js. */
    function qlnvOrgDuoiMinh(n, root) {
        if (!n) return false;
        if (!n._path) return true;
        return qlnvPathSegs(n).some(function (seg) {
            return root && String(seg) === String(root.id) && String(seg) !== String(n.id);
        });
    }
    /* Mã trên đường dẫn cơ cấu: "490.698.1310.1427" và "/490/698/1310/1427/" cùng ra
       ["490","698","1310","1427"]. */
    function qlnvPathSegs(n) {
        return String((n && n._path) || '').split(/[./]/).filter(Boolean);
    }
    /* NGOẠI LỆ ĐẢNG ỦY (quy tắc 26/08): Đảng ủy giao được cho CẢ 4 TRỤC của địa bàn. Mã trục =
       phần tử thứ 2 của path (695 Thành ủy / 1775 HĐND TP / 698 UBND TP / 1790 MTTQ TP). Chặn
       lạm dụng bằng hai điều kiện: node phải do user-tree cấp (user-tree cấp theo địa bàn) và
       phải CÙNG ĐỘ SÂU với đơn vị Đảng ủy đó. Cùng ngữ nghĩa assDangGiaoDuoc bên tongquan.js. */
    var QLNV_TRUC_DANG = '695';
    function qlnvOrgDangGiaoDuoc(n, root) {
        if (!n || !n._path || !root || !root._path) return false;
        var segs = qlnvPathSegs(root);
        return segs.length > 1 && segs[1] === QLNV_TRUC_DANG
            && segs.length === qlnvPathSegs(n).length;
    }
    /* "Đơn vị nhận nhiệm vụ" (chủ trì) = GIAO XUỐNG: CẤP DƯỚI trực tiếp của đơn vị đang đăng
       nhập, CỘNG các node gốc khác mà user-tree cấp NHƯNG nằm dưới đơn vị đó — user-tree trả
       node gốc cho cả đơn vị ở ĐỘ SÂU KHÁC (đo thật: `lanhdao_viethung` được cấp 1427 UBND
       phường Việt Hưng kèm 6469 "Điểm phục vụ HCC Việt Hưng" vốn là CHÁU) — chỉ lấy con thì
       đơn vị đó rơi khỏi mọi ô.
       KHÔNG nhận đơn vị NGANG CẤP: tài khoản kiêm Đảng ủy được cấp cả 4 trục của địa bàn nên
       UBND/MTTQ/Đảng ủy phường cũng về làm node gốc, nhưng chúng ngang cấp -> thuộc ô phối
       hợp (coordination-tree đã trả sẵn). Cùng ngữ nghĩa assLeadRoots bên tongquan.js. */
    function qlnvOrgPickerRoots(nodes) {
        var root = qlnvOrgScopeRoot(nodes);
        var roots = qlnvOrgRootsOf(nodes, 'ut');
        if (!root) return roots; // không tra được đơn vị mình -> hiện cả cây được cấp
        /* GỐC = CHÍNH đơn vị đang đăng nhập; cấp dưới nằm trong nhánh của nó, bung ▸ là thấy.
           "Không giao cho chính mình" là chuyện ở tầng NGƯỜI, không phải tầng ĐƠN VỊ — trước
           2026-09-30 chỗ này loại đơn vị mình (commit 657c430a) vì gộp nhầm việc chặn GIAO
           NGANG vào đó, mà giao ngang nay đã có qlnvOrgDuoiMinh lọc riêng. */
        var out = [root];
        var seen = {};
        seen[String(root.id)] = 1;
        /* TỔ TIÊN của mình KHÔNG được vào ô chủ trì: giao là giao XUỐNG. Cây của tài khoản
           được cấp rộng (VPTU) có node gốc 490 là cấp trên của 701 — lọt vào là giao ngược. */
        var byId = qlnvOrgById(nodes);
        var toTien = {};
        for (var cur = root, g = 0; cur && cur.parent != null && String(cur.parent) !== '' && g < 50; g++) {
            toTien[String(cur.parent)] = 1;
            cur = byId[String(cur.parent)];
            if (!cur) break;
        }
        roots.forEach(function (n) {
            if (!n || seen[String(n.id)] || toTien[String(n.id)]) return;
            // Node đã có CHA trong cây -> bung ▸ từ cha là thấy, thêm vào gốc là hiện TRÙNG.
            if (n.parent != null && String(n.parent) !== '') return;
            /* Ngang cấp thì không vào ô giao: giao là giao XUỐNG — trừ vai Đảng ủy,
               vốn giao được cả 4 trục của địa bàn. */
            if (!qlnvOrgDuoiMinh(n, root) && !qlnvOrgDangGiaoDuoc(n, root)) return;
            seen[String(n.id)] = 1;
            out.push(n);
        });
        return out;
    }
    /* "Đơn vị/người phối hợp" = NGANG CẤP với đơn vị đang đăng nhập, trừ chính nó.
       Phép cắt theo ĐỘ SÂU giờ nằm ở BE (/dashboards/coordination-tree, xem getCoordinationTree)
       vì phối hợp phải nhìn RA NGOÀI phạm vi user-tree — cây user-tree bắt đầu ngay tại trục của
       tài khoản nên không có node cha lẫn anh em của cha. FE chỉ lấy node GỐC của cây đó. */
    function qlnvOrgCoordRoots(nodes) {
        return qlnvOrgRootsOf(nodes, 'coord');
    }

    /* organization-structure không hỗ trợ page/limit (route trả TOÀN BỘ cây 1 lần) -> tải qua cache dùng
       chung qlnvLoadOrgStructure(), rồi TỰ cắt trang phía client theo state.page/state.step để giữ nguyên
       hành vi infinite-scroll cũ của các picker phẳng (nsOwner/nsCoord/assignmentCatalogState...). */
    async function loadAdministrativeUnits(forceReset) {
        var state = getAdministrativeUnitState();
        if (state.loading) return state.items;
        if (forceReset) {
            state.page = 1;
            state.items = [];
            state.total = null;
            state.hasMore = true;
            state.query = '';
        } else if (!state.hasMore) {
            return state.items;
        } else if (state.items.length) {
            state.page += 1;
        }
        state.loading = true;
        assignmentCatalogState.loading.owners = true;
        assignmentCatalogState.loading.coordinators = true;
        assignmentCatalogState.errors.owners = null;
        assignmentCatalogState.errors.coordinators = null;
        renderAdministrativeUnitList();
        return qlnvLoadOrgStructure().then(function (nodes) {
            var allItems = (Array.isArray(nodes) ? nodes : []).map(function (item, index) {
                return normalizeAdministrativeUnitItem(item, index);
            }).filter(function (item) {
                return !!item.id && !!item.name;
            });
            var seen = {};
            state.items = allItems.slice(0, state.page * state.step).filter(function (item) {
                if (seen[item.id]) return false;
                seen[item.id] = true;
                return true;
            });
            state.total = allItems.length;
            state.hasMore = state.items.length < state.total;
            window.__orgLeadUnitOptions = state.items.slice();
            assignmentCatalogState.owners = state.items.slice();
            assignmentCatalogState.coordinators = state.items.slice();
            syncAdministrativeUnitHiddenInput();
            renderAdministrativeUnitList();
            refreshAssignmentCoordinatorOptions();
            refreshSubCoordinatorOptions();
            return state.items;
        }).catch(function (err) {
            console.warn('[ADMIN UNITS] Load failed:', err);
            state.hasMore = false;
            assignmentCatalogState.errors.owners = err;
            assignmentCatalogState.errors.coordinators = err;
            renderAdministrativeUnitList(err);
            refreshAssignmentCoordinatorOptions();
            refreshSubCoordinatorOptions();
            return state.items;
        }).finally(function () {
            state.loading = false;
            assignmentCatalogState.loading.owners = false;
            assignmentCatalogState.loading.coordinators = false;
            renderAdministrativeUnitList();
            refreshAssignmentCoordinatorOptions();
            refreshSubCoordinatorOptions();
            refreshScenarioTaskCatalogControls();
        });
    }

    function getAdministrativeUnitLabelById(id) {
        var state = getAdministrativeUnitState();
        var found = state.items.find(function (item) { return item.id === id; });
        return found ? found.name : '';
    }

    /* Cache ID -> tên đơn vị nạp TOÀN BỘ cây organization-structure một lần — dùng cho các màn "Chi tiết
       nhiệm vụ"/"nhiệm vụ nhánh" (danh-sach-linh-vuc, con-moi-full) khi BE trả donViChuTri/donViThucHien
       dưới dạng ID trần thay vì tên. Trước đây tra theo administrative-units (ObjectId) nên nhiệm vụ tạo
       qua route v2 (donViChuTri là id SỐ iddv) luôn tra rỗng -> hiển thị id trần thay vì tên đơn vị. */
    var __qlnvUnitNameCache = null, __qlnvUnitNameCacheP = null;
    function loadQlnvUnitNameCache() {
        if (__qlnvUnitNameCache) return Promise.resolve(__qlnvUnitNameCache);
        if (__qlnvUnitNameCacheP) return __qlnvUnitNameCacheP;
        /* TỪ ĐIỂN TOÀN HỆ THỐNG, không phải cây phạm vi: bản ghi ở màn chi tiết có thể thuộc
           BẤT KỲ đơn vị nào (nhiệm vụ mình nhận thì đơn vị chủ trì luôn ngoài phạm vi), tra
           trên cây được cấp là trượt -> hiện id trần thay cho tên. */
        __qlnvUnitNameCacheP = qlnvFetchTree('/org-directory').then(function (res) {
            var nodes = (res && res.data) || [];
            var map = {};
            (Array.isArray(nodes) ? nodes : []).forEach(function (item) {
                var id = String((item && item.id) || '');
                var name = item && item.name;
                if (id && name) map[id] = name;
            });
            __qlnvUnitNameCache = map;
            __qlnvUnitNameCacheP = null;
            return map;
        });
        return __qlnvUnitNameCacheP;
    }
    function qlnvLookupUnitNameById(id) {
        if (id == null || id === '') return '';
        var map = __qlnvUnitNameCache || {};
        return map[String(id)] || '';
    }
    /* Tên đơn vị để HIỂN THỊ từ 1 giá trị BE trả: chuỗi tên, chuỗi ID trần, object {title/name/_id},
       hoặc mảng nhiều đơn vị (donViThucHien) — join các tên tìm được bằng ', '. Tra không ra thì giữ
       nguyên giá trị gốc (không làm mất dữ liệu, chỉ không đẹp bằng). */
    function qlnvUnitDisplayName(v) {
        if (v == null || v === '') return '';
        if (Array.isArray(v)) {
            var names = v.map(qlnvUnitDisplayName).filter(Boolean);
            return names.length ? names.join(', ') : '';
        }
        if (typeof v === 'object') {
            return v.title || v.name || v.fullName || v.tenDonVi || qlnvLookupUnitNameById(v._id || v.id) || '';
        }
        return qlnvLookupUnitNameById(v) || String(v);
    }

    function normalizeAdministrativeUnitLabel(value) {
        return normalizeCrmText(String(value || ''));
    }

    function isSameAdministrativeUnit(unitA, unitB) {
        if (!unitA || !unitB) return false;
        var idA = unitA.id != null ? String(unitA.id) : '';
        var idB = unitB.id != null ? String(unitB.id) : '';
        var labelA = normalizeAdministrativeUnitLabel(unitA.label || unitA.name || '');
        var labelB = normalizeAdministrativeUnitLabel(unitB.label || unitB.name || '');
        if (idA && idB && idA === idB) return true;
        return !!labelA && !!labelB && labelA === labelB;
    }

    function syncAdministrativeUnitHiddenInput() {
        var hiddenInput = document.getElementById('assUnit');
        if (!hiddenInput) return;
        var state = getAdministrativeUnitState();
        hiddenInput.value = state.selectedId || '';
    }

    function renderAdministrativeUnitList(error) {
        var listEl = document.getElementById('assUnitList');
        var statusEl = document.getElementById('assUnitStatus');
        var inputEl = document.getElementById('assUnitSearch');
        if (!listEl || !statusEl) return;
        var state = getAdministrativeUnitState();
        var query = normalizeCrmText(state.query);
        var filtered = state.items.filter(function (item) {
            return !query || normalizeCrmText(item.name + ' ' + (item.code || '')).indexOf(query) >= 0;
        });
        if (inputEl && !inputEl.value && state.selectedLabel) {
            inputEl.value = state.selectedLabel;
        }
        if (!filtered.length) {
            if (error) {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị chủ trì.</div>';
            } else if (state.loading && !state.items.length) {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị chủ trì...</div>';
            } else {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
            }
        } else {
            listEl.innerHTML = filtered.map(function (item) {
                var active = item.id === state.selectedId;
                return '<button type="button" class="field-opt-row" data-unit-id="' + esc(item.id) + '" style="width:100%;text-align:left;padding:8px 10px;border:0;border-radius:8px;cursor:pointer;font-size:13px;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + '">' + esc(item.name) + '</button>';
            }).join('');
            listEl.querySelectorAll('[data-unit-id]').forEach(function (btn) {
                btn.onclick = function () {
                    selectAdministrativeUnit(btn.getAttribute('data-unit-id'));
                };
            });
        }
        var loadedCount = filtered.length;
        var totalText = state.total != null ? state.total : state.items.length;
        if (error) {
            statusEl.textContent = 'Tải dữ liệu thất bại.';
        }
    }

    function openAdministrativeUnitDropdown() {
        var dropdown = document.getElementById('assUnitDropdown');
        if (!dropdown) return;
        document.querySelectorAll('.ms-dropdown').forEach(function (el) {
            if (el.id !== 'assUnitDropdown') el.classList.add('hidden');
        });
        dropdown.classList.remove('hidden');
        renderAdministrativeUnitList();
        if (!getAdministrativeUnitState().items.length) {
            loadAdministrativeUnits(true);
        }
    }

    function filterAdministrativeUnitOptions() {
        var input = document.getElementById('assUnitSearch');
        var state = getAdministrativeUnitState();
        state.query = input ? input.value : '';
        renderAdministrativeUnitList();
    }

    function selectAdministrativeUnit(unitId) {
        var state = getAdministrativeUnitState();
        state.selectedId = unitId || '';
        state.selectedLabel = getAdministrativeUnitLabelById(unitId) || '';
        syncAdministrativeUnitHiddenInput();
        var input = document.getElementById('assUnitSearch');
        if (input) input.value = state.selectedLabel;
        var dropdown = document.getElementById('assUnitDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        renderAdministrativeUnitList();
        refreshAssignmentCoordinatorOptions();
    }

    function maybeLoadMoreAdministrativeUnits() {
        var listEl = document.getElementById('assUnitList');
        if (!listEl) return;
        var state = getAdministrativeUnitState();
        if (state.loading || !state.hasMore) return;
        var remaining = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
        var approxRowHeight = 36;
        if (remaining <= approxRowHeight * state.threshold) {
            loadAdministrativeUnits(false);
        }
    }

    function bindAdministrativeUnitScroll() {
        var listEl = document.getElementById('assUnitList');
        if (!listEl || listEl.dataset.boundScroll === 'true') return;
        listEl.dataset.boundScroll = 'true';
        listEl.addEventListener('scroll', maybeLoadMoreAdministrativeUnits);
    }

    function getAssignmentLeadUnitLabel() {
        return getAssUnitState().selectedLabel || '';
    }

    function renderAdministrativeUnitSelectOptions(selectedId) {
        var options = getAdministrativeUnitState().items || [];
        if (!options.length) {
            return '<option value="">Đang tải đơn vị...</option>';
        }
        return options.map(function (item, index) {
            var selected = selectedId ? (String(selectedId) === String(item.id) ? ' selected' : '') : (index === 0 ? ' selected' : '');
            return '<option value="' + (item.id || '') + '"' + selected + '>' + (item.name || item.fullName || item.code || '') + '</option>';
        }).join('');
    }

    function getCoordinatorCrmOptions() {
        return getCrmConfigItems(CRM_COORDINATOR_CODE).map(function (item, index) {
            var label = item && (item.name || item.title || item.value || item.code || ('Đơn vị phối hợp ' + (index + 1)));
            var value = item && (item.value || item.code || item._id || item.id || label);
            return {
                id: String(value || ''),
                name: label,
                fullName: label,
                code: item && item.code ? item.code : '',
                raw: item || null
            };
        }).filter(function (item) {
            return !!item.id && !!item.name;
        });
    }

    function getCoordinatorOptionsFromAdministrativeUnits() {
        return (getAdministrativeUnitState().items || []).slice();
    }

    function renderCoordinatorOptionsByClass(inputClass, textId, boxId, placeholder, excludeUnit) {
        var options = getCoordinatorOptionsFromAdministrativeUnits();
        var checkedMap = {};
        if (boxId) {
            var currentBox = document.getElementById(boxId);
            if (currentBox) {
                currentBox.querySelectorAll('input[type=checkbox]:checked').forEach(function (cb) {
                    checkedMap[cb.value] = true;
                });
            }
        }
        return options.map(function (item) {
            var label = item.fullName || item.name;
            var searchName = normalizeCrmText(label);
            var value = String(item.id || item._id || '');
            var isExcluded = !!excludeUnit && isSameAdministrativeUnit(
                { id: value, label: label },
                { id: excludeUnit.id, label: excludeUnit.label }
            );
            var safeLabel = esc(label);
            return '<label class="unit-check-row" data-name="' + esc(searchName) + '" data-excluded="' + (isExcluded ? 'true' : 'false') + '" style="display:' + (isExcluded ? 'none' : 'flex') + ';align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s"><input type="checkbox" value="' + esc(value) + '" data-label="' + safeLabel + '" class="' + inputClass + '"' + (checkedMap[value] ? ' checked' : '') + (isExcluded ? ' disabled' : '') + ' onchange="updateUnitTriggerLabel(\'' + textId + '\',\'' + boxId + '\',\'' + placeholder + '\')"/>' + safeLabel + '</label>';
        }).join('');
    }

    /* "Đơn vị/người phối hợp" của modal "Giao nhiệm vụ" giờ là CÂY (assCoordTreeRowsHtml, dữ liệu RIÊNG
       __assCoordTreeData — đơn vị NGANG CẤP với đơn vị đăng nhập, khác gốc với __assUnitTreeData của "Đơn
       vị chủ trì" (CẤP DƯỚI) — port qlnvOrgCoordRoots/qlnvOrgPickerRoots, xem khối ass* ngay phía trên
       openAssignmentForm). Giữ nguyên 2 tên hàm này (gọi từ nhiều nơi: hydrateAssignmentFormFromCrmStatus,
       loadAdministrativeUnits...) để không phải sửa các call site cũ; chỉ đổi bên trong sang render cây
       thay vì danh sách phẳng. */
    function renderCoordinatorOptions() {
        if (!__assCoordTreeData.length) {
            return __assUnitTreeLoading ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>' : '';
        }
        var q = normalizeCrmText(getAssCoordUiState().query);
        return q ? assCoordTreeSearchHtml(q) : assCoordTreeRowsHtml(__assCoordTreeData, 0);
    }

    function refreshAssignmentCoordinatorOptions() {
        var box = document.getElementById('assCoordBox');
        if (!box) return;
        var optionsHtml = renderCoordinatorOptions();
        box.innerHTML = optionsHtml || '<div style="padding:8px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>';
        assRenderCoordChips();
    }

    function refreshSubCoordinatorOptions() {
        var box = document.getElementById('subCoordBox');
        if (!box) return;
        var ownerInput = document.getElementById('subOwner');
        var optionsHtml = renderCoordinatorOptionsByClass('subCoord', 'subCoordTriggerText', 'subCoordBox', 'Chọn đơn vị phối hợp', {
            id: ownerInput ? ownerInput.value : '',
            label: getSubAssignmentLeadUnitState().selectedLabel || getAdministrativeUnitLabelById(ownerInput ? ownerInput.value : '')
        });
        box.innerHTML = optionsHtml || '<div style="padding:8px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>';
        updateUnitTriggerLabel('subCoordTriggerText', 'subCoordBox', 'Chọn đơn vị phối hợp');
    }

    function bindCoordinatorBoxScroll(boxId, refreshFn) {
        var box = document.getElementById(boxId);
        if (!box || box.dataset.boundScroll === 'true') return;
        box.style.maxHeight = '220px';
        box.style.overflowY = 'auto';
        box.dataset.boundScroll = 'true';
        box.addEventListener('scroll', function () {
            var state = getAdministrativeUnitState();
            if (state.loading || !state.hasMore) return;
            var remaining = box.scrollHeight - box.scrollTop - box.clientHeight;
            if (remaining <= 36 * state.threshold) {
                loadAdministrativeUnits(false).then(function () {
                    if (typeof refreshFn === 'function') refreshFn();
                });
            }
        });
    }

    function ensureCoordinatorOptionsLoaded(refreshFn) {
        var state = getAdministrativeUnitState();
        if (!state.items.length) {
            return loadAdministrativeUnits(true).then(function () {
                if (typeof refreshFn === 'function') refreshFn();
            });
        }
        if (typeof refreshFn === 'function') refreshFn();
        return Promise.resolve(state.items);
    }

    function getSubAssignmentLeadUnitState() {
        if (!window.__subAdminUnitState) {
            window.__subAdminUnitState = {
                selectedId: '',
                selectedLabel: '',
                query: ''
            };
        }
        return window.__subAdminUnitState;
    }

    function syncSubAssignmentLeadUnitHiddenInput() {
        var hiddenInput = document.getElementById('subOwner');
        if (!hiddenInput) return;
        hiddenInput.value = getSubAssignmentLeadUnitState().selectedId || '';
    }

    function renderSubAdministrativeUnitList(error) {
        var listEl = document.getElementById('subOwnerList');
        var statusEl = document.getElementById('subOwnerStatus');
        var inputEl = document.getElementById('subOwnerSearch');
        if (!listEl || !statusEl) return;
        var state = getSubAssignmentLeadUnitState();
        var globalState = getAdministrativeUnitState();
        var query = normalizeCrmText(state.query);
        var filtered = (globalState.items || []).filter(function (item) {
            return !query || normalizeCrmText((item.name || '') + ' ' + (item.code || '')).indexOf(query) >= 0;
        });
        if (inputEl && !inputEl.value && state.selectedLabel) inputEl.value = state.selectedLabel;
        if (!filtered.length) {
            if (error) listEl.innerHTML = '<div style="padding:8px 10px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị chủ trì.</div>';
            else if (globalState.loading && !(globalState.items || []).length) listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị chủ trì...</div>';
            else listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
        } else {
            listEl.innerHTML = filtered.map(function (item) {
                var active = String(item.id) === String(state.selectedId);
                return '<button type="button" class="field-opt-row" data-sub-unit-id="' + item.id + '" style="width:100%;text-align:left;padding:8px 10px;border:0;border-radius:8px;cursor:pointer;font-size:13px;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + '">' + (item.name || item.fullName || '') + '</button>';
            }).join('');
            listEl.querySelectorAll('[data-sub-unit-id]').forEach(function (btn) {
                btn.onclick = function () { selectSubAdministrativeUnit(btn.getAttribute('data-sub-unit-id')); };
            });
        }
        var totalText = globalState.total != null ? globalState.total : (globalState.items || []).length;
        if (error) statusEl.textContent = 'Tải dữ liệu thất bại.';
        else if (globalState.loading && (globalState.items || []).length) statusEl.textContent = 'Đang tải thêm đơn vị...';
        else if (globalState.hasMore) statusEl.textContent = 'Đã tải ' + filtered.length + '/' + totalText + ' đơn vị. Cuộn gần cuối sẽ tải thêm 20 bản ghi.';
        else statusEl.textContent = 'Đã hiển thị ' + filtered.length + '/' + totalText + ' đơn vị.';
    }

    function selectSubAdministrativeUnit(unitId) {
        var subState = getSubAssignmentLeadUnitState();
        subState.selectedId = unitId || '';
        subState.selectedLabel = getAdministrativeUnitLabelById(unitId) || '';
        syncSubAssignmentLeadUnitHiddenInput();
        var input = document.getElementById('subOwnerSearch');
        if (input) input.value = subState.selectedLabel;
        var dropdown = document.getElementById('subOwnerDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        renderSubAdministrativeUnitList();
        refreshSubCoordinatorOptions();
    }

    function openSubAdministrativeUnitDropdown() {
        var dropdown = document.getElementById('subOwnerDropdown');
        if (!dropdown) return;
        document.querySelectorAll('.ms-dropdown').forEach(function (el) {
            if (el.id !== 'subOwnerDropdown') el.classList.add('hidden');
        });
        dropdown.classList.remove('hidden');
        renderSubAdministrativeUnitList();
        if (!getAdministrativeUnitState().items.length) loadAdministrativeUnits(true);
    }

    function filterSubAdministrativeUnitOptions() {
        var input = document.getElementById('subOwnerSearch');
        var state = getSubAssignmentLeadUnitState();
        state.query = input ? input.value : '';
        renderSubAdministrativeUnitList();
    }

    /* === Nhiệm vụ nhánh trong kịch bản - Đơn vị chủ trì === */
    function renderNsOwnerList() {
        var listEl = document.getElementById('nsOwnerList');
        var statusEl = document.getElementById('nsOwnerStatus');
        var inputEl = document.getElementById('nsTaskOwnerSearch');
        if (!listEl || !statusEl) return;
        var ownerInput = document.getElementById('nsTaskOwner');
        var selectedId = ownerInput ? ownerInput.value : '';
        var query = inputEl ? normalizeCrmText(inputEl.value) : '';
        var globalState = getAdministrativeUnitState();
        var options = getAssignmentOwnerOptions();
        var filtered = options.filter(function (item) {
            return !query || normalizeCrmText((item.name || '') + ' ' + (item.code || '')).indexOf(query) >= 0;
        });
        if (!filtered.length) {
            if (assignmentCatalogState.errors.owners) {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị chủ trì.</div><button type="button" class="ghost" style="margin:4px 10px 0" onclick="loadAssignmentCatalogs(true)">Thử lại</button>';
            } else if (globalState.loading && !options.length) {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị...</div>';
            } else {
                listEl.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">' + (options.length ? 'Không tìm thấy đơn vị phù hợp.' : 'Không có dữ liệu danh mục.') + '</div>';
            }
        } else {
            listEl.innerHTML = filtered.map(function (item) {
                var active = String(item.id) === String(selectedId);
                return '<button type="button" class="field-opt-row" data-ns-owner-id="' + item.id + '" style="width:100%;text-align:left;padding:8px 10px;border:0;border-radius:8px;cursor:pointer;font-size:13px;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + '">' + (item.name || item.fullName || '') + '</button>';
            }).join('');
            listEl.querySelectorAll('[data-ns-owner-id]').forEach(function (btn) {
                btn.onclick = function () { selectNsOwner(btn.getAttribute('data-ns-owner-id')); };
            });
        }
        var totalText = globalState.total != null ? globalState.total : options.length;
        if (assignmentCatalogState.errors.owners) {
            statusEl.textContent = 'Tải dữ liệu thất bại.';
        } else if (globalState.loading && options.length) {
            statusEl.textContent = 'Đang tải thêm...';
        } else if (globalState.hasMore) {
            statusEl.textContent = 'Đã hiển thị ' + filtered.length + '/' + totalText + '. Cuộn gần cuối sẽ tải thêm.';
        } else {
            statusEl.textContent = 'Đã hiển thị ' + filtered.length + '/' + totalText + ' đơn vị.';
        }
    }

    function selectNsOwner(unitId) {
        var ownerInput = document.getElementById('nsTaskOwner');
        var searchInput = document.getElementById('nsTaskOwnerSearch');
        var unitLabel = getAdministrativeUnitLabelById(unitId) || '';
        if (ownerInput) ownerInput.value = unitId || '';
        if (searchInput) searchInput.value = unitLabel;
        var dropdown = document.getElementById('nsOwnerDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        var clearBtn = document.getElementById('nsOwnerClearBtn');
        if (clearBtn) clearBtn.style.display = unitId ? 'block' : 'none';
        renderNsCoordOptions();
        if (removeNsCoordIfDuplicated(unitId)) {
            toast('Đã tự loại bỏ đơn vị phối hợp trùng với đơn vị chủ trì.');
        }
    }

    function clearNsOwnerSelection() {
        var ownerInput = document.getElementById('nsTaskOwner');
        var searchInput = document.getElementById('nsTaskOwnerSearch');
        if (ownerInput) ownerInput.value = '';
        if (searchInput) searchInput.value = '';
        var clearBtn = document.getElementById('nsOwnerClearBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        renderNsCoordOptions();
    }

    function openNsOwnerDropdown() {
        var dropdown = document.getElementById('nsOwnerDropdown');
        if (!dropdown) return;
        document.querySelectorAll('.ms-dropdown').forEach(function (el) {
            if (el.id !== 'nsOwnerDropdown') el.classList.add('hidden');
        });
        dropdown.classList.remove('hidden');
        renderNsOwnerList();
        bindNsOwnerScroll();
        if (!getAdministrativeUnitState().items.length) loadAdministrativeUnits(true);
    }

    function bindNsOwnerScroll() {
        var listEl = document.getElementById('nsOwnerList');
        if (!listEl || listEl.dataset.boundScroll === 'true') return;
        listEl.dataset.boundScroll = 'true';
        listEl.addEventListener('scroll', function () {
            var globalState = getAdministrativeUnitState();
            if (globalState.loading || !globalState.hasMore) return;
            var remaining = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
            if (remaining <= 36 * 5) {
                loadAdministrativeUnits(false).then(function () { renderNsOwnerList(); });
            }
        });
    }

    function filterNsOwnerOptions() {
        renderNsOwnerList();
    }

    function removeNsCoordIfDuplicated(ownerId) {
        if (!ownerId) return;
        var ownerLabel = getAdministrativeUnitLabelById(ownerId) || '';
        var coordCheckboxes = document.querySelectorAll('.nsCoord');
        var removed = false;
        coordCheckboxes.forEach(function (cb) {
            var coordId = cb.value;
            var coordLabel = cb.getAttribute('data-label') || getAdministrativeUnitLabelById(coordId) || coordId;
            if (isSameAdministrativeUnit({ id: coordId, label: coordLabel }, { id: ownerId, label: ownerLabel })) {
                if (cb.checked) removed = true;
                cb.checked = false;
            }
        });
        var checkedCount = document.querySelectorAll('.nsCoord:checked').length;
        var triggerText = document.getElementById('nsCoordTrigger_notiText');
        if (triggerText) {
            if (checkedCount > 0) {
                var checkedLabels = Array.from(document.querySelectorAll('.nsCoord:checked')).map(function (cb) {
                    return getAdministrativeUnitLabelById(cb.value) || cb.value;
                });
                triggerText.textContent = checkedLabels.join(', ');
            } else {
                triggerText.textContent = 'Chọn đơn vị phối hợp';
            }
        }
        return removed;
    }

    function renderNsCoordOptions() {
        var box = document.getElementById('nsCoordBox_noti');
        if (!box) return;
        var ownerInput = document.getElementById('nsTaskOwner');
        var ownerId = ownerInput ? ownerInput.value : '';
        var ownerLabel = getAdministrativeUnitLabelById(ownerId) || '';
        var options = getAssignmentCoordinatorOptions();
        if (!options.length && assignmentCatalogState.loading.coordinators) {
            box.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>';
            return;
        }
        if (!options.length && assignmentCatalogState.errors.coordinators) {
            box.innerHTML = '<div style="padding:8px 10px;color:#ff9a9a;font-size:12.5px">Không tải được đơn vị phối hợp.</div><button type="button" class="ghost" style="margin:4px 6px 0" onclick="loadAssignmentCatalogs(true)">Thử lại</button>';
            return;
        }
        if (!options.length) {
            box.innerHTML = '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không có dữ liệu danh mục.</div>';
            return;
        }
        var checkedMap = {};
        document.querySelectorAll('.nsCoord:checked').forEach(function (cb) {
            checkedMap[cb.value] = true;
        });
        box.innerHTML = options.map(function (u) {
            var unitId = u.id;
            var unitName = u.name || u.fullName || '';
            var isOwner = isSameAdministrativeUnit({ id: unitId, label: unitName }, { id: ownerId, label: ownerLabel });
            return '<label class="unit-check-row" data-name="' + (unitName || '').toLowerCase() + '" data-excluded="' + (isOwner ? 'true' : 'false') + '" style="display:' + (isOwner ? 'none' : 'flex') + ';align-items:center;gap:6px;font-size:12.5px;font-weight:400;padding:5px 6px;border-radius:6px;transition:.15s">' +
                '<input type="checkbox" value="' + unitId + '" class="nsCoord" data-label="' + unitName + '"' + (checkedMap[unitId] ? ' checked' : '') + (isOwner ? ' disabled' : '') + ' onchange="updatensCoordTrigger_notiLabel()"/>' + unitName + '</label>';
        }).join('');
        updatensCoordTrigger_notiLabel();
    }

    function updatensCoordTrigger_notiLabel() {
        var checked = Array.from(document.querySelectorAll('.nsCoord:checked')).map(function (c) {
            return c.getAttribute('data-label') || c.value;
        });
        var triggerText = document.getElementById('nsCoordTrigger_notiText');
        if (triggerText) {
            triggerText.textContent = checked.length ? checked.join(', ') : 'Chọn đơn vị phối hợp';
            triggerText.style.color = checked.length ? '#d0e8f8' : '#8ab0c8';
        }
    }

    function filterNsCoordOptions() {
        var input = document.getElementById('nsCoordSearch_noti');
        var box = document.getElementById('nsCoordBox_noti');
        if (!input || !box) return;
        var query = (input.value || '').trim().toLowerCase();
        box.querySelectorAll('label.unit-check-row').forEach(function (label) {
            var name = label.dataset.name || '';
            var isExcluded = label.dataset.excluded === 'true';
            label.style.display = (!isExcluded && name.includes(query)) ? 'flex' : 'none';
        });
    }

    function bindSubAdministrativeUnitScroll() {
        var listEl = document.getElementById('subOwnerList');
        if (!listEl || listEl.dataset.boundScroll === 'true') return;
        listEl.dataset.boundScroll = 'true';
        listEl.addEventListener('scroll', function () {
            var globalState = getAdministrativeUnitState();
            if (globalState.loading || !globalState.hasMore) return;
            var remaining = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
            if (remaining <= 36 * 5) {
                loadAdministrativeUnits(false).then(function () { renderSubAdministrativeUnitList(); });
            }
        });
    }

    function resolveParentQlnvId(record) {
        if (!record) return '';
        if (record.__qlnvId) return String(record.__qlnvId);
        if (record._id) return String(record._id);
        if (record.task_id) return String(record.task_id);
        if (record.__qlnvRaw) {
            var raw = record.__qlnvRaw;
            if (raw._id) return String(raw._id);
            if (raw.id) return String(raw.id);
            if (raw.task_id) return String(raw.task_id);
            if (raw.parent_id && record.loaiNV === 'NHIEM_VU_CON') return String(raw.parent_id);
        }
        if (record.id) return String(record.id);
        return '';
    }

    function hydrateAssignmentFormFromCrmStatus() {
        var docTypeInput = document.getElementById('assDocTypeInput');
        var urgencySelect = document.getElementById('assUrgency');
        var docTypeOptionsList = window.__crmDocTypeOptions || [];
        var urgencyOptions = window.__crmUrgencyOptions || [];

        if (docTypeInput && !docTypeInput.value && docTypeOptionsList.length) {
            docTypeInput.value = docTypeOptionsList[0];
        }

        if (urgencySelect) {
            var preferredUrgency = urgencyOptions.find(function (item) {
                return normalizeCrmText(item) === 'thường';
            }) || urgencyOptions[0] || 'Thường';
            urgencySelect.innerHTML = renderUrgencyOptions();
            if (!urgencySelect.value || normalizeCrmText(urgencySelect.value) === 'thường') {
                urgencySelect.value = preferredUrgency;
            }
        }

        if (document.getElementById('assCoordBox')) {
            refreshAssignmentCoordinatorOptions();
        }
    }

    function getCrmItemCode(crmCode, itemName) {
        var found = findCrmConfigItem(crmCode, itemName);
        return found ? (found.value || found.code || null) : null;
    }

    (function (global) {
        'use strict';

        function qlnvWin() {
            return typeof window !== 'undefined' ? window : global;
        }

        function qlnvBase() {
            return String(qlnvWin().QLNV_API_BASE || '').replace(/\/+$/, '');
        }

        var LOAI_NV_LABELS = {
            NHIEM_VU: 'Nhiệm vụ cá nhân',
            NHIEM_VU_CON: 'Nhiệm vụ nhiều đơn vị',
            CHI_DAO_DX: 'Chỉ đạo điện tử',
            NHIEM_VU_THUONG_XUYEN: 'Nhiệm vụ thường xuyên',
            CONG_VIEC_THUONG_XUYEN: 'Công việc thường xuyên',
        };

        function apiUrl(path) {
            var base = qlnvBase();
            if (!base) return '';
            if (!path || path === '/') return base;                // list/tạo/xóa ở base
            if (path.indexOf('http') === 0) return path;           // URL tuyệt đối -> giữ nguyên
            if (path.charAt(0) === '?') return base + path;        // query -> base?...
            if (path.charAt(0) === '/') return base + path;        // /:id, /dsnh/*, /xuLy/*, /giaoNV...
            return base + '/' + path;
        }

        var QLNV_TIMEOUT_MS = 30000;

        /* Chuẩn hóa lỗi HTTP -> thông điệp người dùng (ưu tiên message từ body be_qlnv/BKAV). */
        function qlnvHttpMessage(status, bodyMsg) {
            if (bodyMsg) return String(bodyMsg);
            var m = {
                400: 'Yêu cầu không hợp lệ (400).',
                401: 'Không có quyền / phiên hết hạn (401).',
                403: 'Không có quyền truy cập (403).',
                404: 'Không tìm thấy (404).',
                409: 'Xung đột dữ liệu (409).',
                422: 'Dữ liệu không hợp lệ (422).',
                500: 'Lỗi máy chủ (500).',
                502: 'Không kết nối được dịch vụ liên thông (502).',
                503: 'Dịch vụ tạm gián đoạn (503).',
                504: 'Hết thời gian chờ dịch vụ (504).'
            };
            return m[status] || ('Lỗi HTTP ' + status + '.');
        }

        async function qlnvFetch(pathOrUrl, opts) {
            opts = opts || {};
            var url = apiUrl(pathOrUrl);
            if (!url) throw new Error('QLNV_API_BASE chưa cấu hình');
            var token = '';
            try { token = await getQlnvToken(); } catch (e) { token = ''; /* đi tiếp không token -> server 401 -> báo lỗi rõ */ }
            function doFetch(tk) {
                // FormData (upload) -> KHÔNG set Content-Type để browser tự thêm boundary.
                var isForm = (typeof FormData !== 'undefined' && opts.body instanceof FormData);
                var headers = Object.assign(
                    isForm ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
                    opts.headers || {}
                );
                if (tk) headers.Authorization = 'Bearer ' + tk;
                var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
                var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, opts.timeout || QLNV_TIMEOUT_MS) : null;
                var fetchOpts = Object.assign({}, opts, { headers: headers, credentials: 'omit', cache: 'no-store' });
                if (ctrl) fetchOpts.signal = ctrl.signal;
                return fetch(url, fetchOpts).finally(function () { if (timer) clearTimeout(timer); });
            }
            var r;
            try {
                r = await doFetch(token);
                if (r.status === 401 && token) {            // retry-once: token cũ/hết hạn -> re-acquire
                    clearQlnvToken();
                    try { token = await getQlnvToken({ force: true }); } catch (e) { token = ''; }
                    r = await doFetch(token);
                }
            } catch (e) {
                if (e && e.name === 'AbortError') throw new Error('Hết thời gian chờ (timeout) khi gọi ' + (pathOrUrl || url));
                throw new Error('Lỗi mạng khi gọi ' + (pathOrUrl || url) + ': ' + ((e && e.message) || e));
            }
            var ct = r.headers.get('content-type') || '';
            var payload = null;
            if (ct.indexOf('json') >= 0) { try { payload = await r.json(); } catch (e) { payload = null; } }
            else { var t = await r.text(); payload = { raw: t }; }
            if (!r.ok) {
                var bodyMsg = payload && (payload.message || payload.error || (payload.errors ? String(payload.errors) : ''));
                var err = new Error(qlnvHttpMessage(r.status, bodyMsg) + (token ? '' : ' (thiếu Bearer token)'));
                err.status = r.status; err.body = payload;
                throw err;
            }
            return payload;
        }

        function mapDoKhanToPriority(doKhan) {
            var s = String(doKhan || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (/hoa toc|dac biet/.test(s)) return '3';
            if (/thuong khan/.test(s)) return '2';
            if (/khan/.test(s)) return '1';
            return '0';
        }

        function mapPriorityToDoKhan(priority) {
            var p = String(priority || '0');
            if (p === '3') return 'Hỏa tốc';
            if (p === '2') return 'Thượng khẩn';
            if (p === '1') return 'Khẩn';
            return 'Thường';
        }

        function toIsoDateTime(val) {
            if (!val) return null;
            if (typeof val === 'string' && val.indexOf('T') >= 0) return val;
            var d = val instanceof Date ? val : new Date(val);
            if (isNaN(d.getTime())) return null;
            var pad = function (n) { return String(n).padStart(2, '0'); };
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T00:00:00+07:00';
        }

        function asArray(v) { return Array.isArray(v) ? v : (v == null ? [] : [v]); }

        /* ============================================================
         * Route GỐC be_qlnv (Mongo). be_qlnv tự mirror BKAV qua module `bmm`
         * (feature-flag BMM_ENABLE_INTEGRATION). FE KHÔNG dựng payload BKAV.
         * ============================================================ */

        /* Danh sách nhiệm vụ phân loại: GET /danh-sach-nhiem-vu/<seg>
           seg: 'moi' | 'dang-trien-khai' | 'dot-xuat-moi' | 'con-moi' | ... (quanLyNhiemVuDSNH.route.js)
           Trả object trần {data,count,limit,skip,filter} (KHÔNG bọc status). */
        function listSegment(seg, params) {
            params = params || {};
            var qs = [];
            qs.push('limit=' + encodeURIComponent(params.limit != null ? params.limit : 200));
            qs.push('skip=' + encodeURIComponent(params.skip != null ? params.skip : 0));
            if (params.sort) qs.push('sort=' + encodeURIComponent(params.sort));
            if (params.filter) qs.push('filter=' + encodeURIComponent(typeof params.filter === 'string' ? params.filter : JSON.stringify(params.filter)));
            return qlnvFetch('/danh-sach-nhiem-vu/' + seg + (qs.length ? '?' + qs.join('&') : ''));
        }

        /* Chi tiết: GET /qlnv/:id -> {status:1, data} */
        function getTask(id) { return qlnvFetch('/qlnv/' + encodeURIComponent(id)); }

        /* Tạo: POST /qlnv/bmm/create (body shape Mongo — validateNhiemVu). be_qlnv ghi Mongo + mirror BKAV. */
        function createTask(body) { return qlnvFetch('/qlnv/bmm/create', { method: 'POST', body: JSON.stringify(body) }); }

        /* Giao nhiệm vụ con: PUT /qlnv/giaoNVCon/:id */
        function createSubTask(parentId, body) { return qlnvFetch('/qlnv/giaoNVCon/' + encodeURIComponent(parentId), { method: 'PUT', body: JSON.stringify(body) }); }

        /* Kịch bản xử lý: POST /qlnv/scenarios */
        /* Phạm vi đơn vị của kịch bản — xem window.qlnvScenarioOrgQuery. Trả "" khi chưa
           nạp được /rbac/me, khi đó BE chỉ trả 5 kịch bản mặc định. */
        function scenarioOrgQuery(prefix) {
            return typeof window.qlnvScenarioOrgQuery === 'function'
                ? window.qlnvScenarioOrgQuery(prefix)
                : '';
        }

        /* organizationId: đơn vị sở hữu kịch bản sắp tạo — BE chỉ cho đơn vị này thấy lại. */
        function createScenario(body) { return qlnvFetch('/qlnv/scenarios' + scenarioOrgQuery('?'), { method: 'POST', body: JSON.stringify(body) }); }

        /* Tạo nhiệm vụ từ kịch bản: POST /qlnv/scenarios/:id/create-tasks */
        function createScenarioTasks(id, body) {
            return qlnvFetch('/qlnv/scenarios/' + encodeURIComponent(id) + '/create-tasks', { method: 'POST', body: JSON.stringify(body) });
        }

        /* Lấy danh sách kịch bản: GET /qlnv/scenarios?page=1&limit=20 */
        function listScenarios(params) {
            var q = [];
            if (params && params.page) q.push('page=' + params.page);
            if (params && params.limit) q.push('limit=' + params.limit);
            if (params && params.key) q.push('key=' + encodeURIComponent(params.key));
            if (params && params.title) q.push('title=' + encodeURIComponent(params.title));
            if (params && params.level) q.push('level=' + encodeURIComponent(params.level));
            var path = '/qlnv/scenarios' + (q.length ? '?' + q.join('&') : '');
            path += scenarioOrgQuery(path.indexOf('?') >= 0 ? '&' : '?');
            return qlnvFetch(path, { method: 'GET' });
        }

        /* Lấy chi tiết kịch bản: GET /qlnv/scenarios/:key */
        function getScenario(key) { return qlnvFetch('/qlnv/scenarios/' + encodeURIComponent(key), { method: 'GET' }); }

        /* Cập nhật kịch bản: PUT /qlnv/scenarios/:key */
        function updateScenario(key, body) { return qlnvFetch('/qlnv/scenarios/' + encodeURIComponent(key) + scenarioOrgQuery('?'), { method: 'PUT', body: JSON.stringify(body) }); }

        /* Xóa kịch bản: DELETE /qlnv/scenarios/:key */
        function deleteScenario(key) { return qlnvFetch('/qlnv/scenarios/' + encodeURIComponent(key) + scenarioOrgQuery('?'), { method: 'DELETE' }); }

        /* Sửa: PUT /qlnv/:id (body Mongo). */
        function updateTask(id, body) { return qlnvFetch('/qlnv/' + encodeURIComponent(id), { method: 'PUT', body: JSON.stringify(body) }); }

        /* Xóa (nhiều): DELETE /qlnv body {ids, content, delete_sub_task}. be_qlnv soft-delete Mongo + mirror BKAV theo bmmTaskId. */
        function deleteTasks(ids, content, deleteSub) {
            var payload = { ids: asArray(ids), content: content || '', delete_sub_task: !!deleteSub };
            return qlnvFetch('/qlnv', { method: 'DELETE', body: JSON.stringify(payload) });
        }

        /* Chuẩn hóa list — xử lý 2 kiểu bọc: DSNH trả {data,count} trần; /qlnv/ GET bọc {status:1,data:{data,count}}. */
        function normalizeListResponse(res) {
            if (!res) return { items: [], total: 0, page: 1, limit: 20 };
            if (Array.isArray(res)) return { items: res, total: res.length, page: 1, limit: res.length || 20 };
            var body = (res.data && !Array.isArray(res.data) && (Array.isArray(res.data.data) || res.data.count != null)) ? res.data : res;
            var items = Array.isArray(body.data) ? body.data : (Array.isArray(body.items) ? body.items : (Array.isArray(res.data) ? res.data : []));
            var total = Number(body.count != null ? body.count : (body.total != null ? body.total : items.length)) || items.length;
            /* Cỡ trang: BE qlnvV2 trả `page_size` (xem qlnvV2.controller.js), KHÔNG phải `limit`.
               Đọc thiếu tên này là rơi về mặc định 20 dù BE đang chia trang cỡ khác.
               Tuyệt đối không suy từ items.length: trang cuối trả ít bản ghi hơn cỡ trang. */
            var limit = Number(body.page_size || body.pageSize || body.limit) || 20;
            var skip = Number(body.skip || 0);
            var page = limit > 0 ? Math.floor(skip / limit) + 1 : 1;
            return { items: items, total: total, page: page, limit: limit };
        }

        /* Export dưới tên RIÊNG (không phải window.QlnvApi) — cô lập với block khác (vd block_nv/nv.js)
           cũng tự định nghĩa global.QlnvApi: nếu 2 khối cùng nhúng 1 trang, khối nào script nạp SAU
           sẽ đè window.QlnvApi của khối nạp trước, khiến các lệnh gọi QlnvApiNotify.createTask() ở đây âm
           thầm chạy nhầm bản của khối kia (đã xảy ra thật với notifyToggleCoordDropdown — xem comment
           ở openNotifyForm). Đặt tên riêng thì không bao giờ bị khối khác ghi đè hay đè khối khác. */
        global.QlnvApiNotify = {
            LOAI_NV_LABELS: LOAI_NV_LABELS,
            qlnvFetch: qlnvFetch,
            listSegment: listSegment,
            getTask: getTask,
            createTask: createTask,
            createSubTask: createSubTask,
            createScenario: createScenario,
            createScenarioTasks: createScenarioTasks,
            listScenarios: listScenarios,
            getScenario: getScenario,
            updateScenario: updateScenario,
            deleteScenario: deleteScenario,
            updateTask: updateTask,
            deleteTasks: deleteTasks,
            mapDoKhanToPriority: mapDoKhanToPriority,
            mapPriorityToDoKhan: mapPriorityToDoKhan,
            toIsoDateTime: toIsoDateTime,
            normalizeListResponse: normalizeListResponse,
            asArray: asArray,
        };
    })(typeof window !== 'undefined' ? window : global);

    function setAppVh() { document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px') }
    setAppVh(); window.addEventListener('resize', setAppVh); window.addEventListener('orientationchange', setAppVh);

    /* ============================== DATA TĨNH ============================== */
    const statusDefs = [
        { key: 'done', label: 'Hoàn thành đúng tiến độ', short: 'Hoàn thành', color: '#2fb174', cls: 'green' },
        { key: 'doing', label: 'Đang thực hiện chưa đến hạn', short: 'Đang xử lý', color: '#2c7dd2', cls: 'blue' },
        { key: 'regular', label: 'Thường xuyên, liên tục', short: 'Thường xuyên', color: '#229cbd', cls: 'cyan' },
        { key: 'soon', label: 'Sắp đến hạn cảnh báo', short: 'Sắp đến hạn', color: '#d8a50c', cls: 'gold' },
        { key: 'risk', label: 'Nguy cơ không hoàn thành đúng hạn', short: 'Nguy cơ trễ', color: '#d25a19', cls: 'orange' },
        { key: 'overdue', label: 'Quá hạn', short: 'Quá hạn', color: '#d33a44', cls: 'red' }
    ];
    const axisMeta = {
        DANG: { name: 'Thành ủy', icon: '🚩', color: '#e84d5b', desc: 'Thường trực Thành ủy · xem tất cả 04 trục', scope: 'all' },
        HDND: { name: 'HĐND TP', icon: '🏛️', color: '#f59e0b', desc: 'Chủ tịch HĐND Thành phố · chỉ xem HĐND', scope: 'own' },
        UBND: { name: 'UBND TP', icon: '🏢', color: '#2fb174', desc: 'Chủ tịch UBND Thành phố · UBND đầy đủ + HĐND/MTTQ chỉ số', scope: 'ubnd' },
        MTTQ: { name: 'MTTQ TP', icon: '🤝', color: '#8b5cf6', desc: 'Chủ tịch UB MTTQ Thành phố · chỉ xem MTTQ', scope: 'own' }
    };
    const metricMeta = {
        assigned: { label: 'Nhiệm vụ giao', short: 'Nhiệm vụ giao', icon: '📤' },
        received: { label: 'Nhiệm vụ nhận', short: 'Nhiệm vụ nhận', icon: '📥' },
        docIn: { label: 'Văn bản đến', short: 'Văn bản đến', icon: '📨' },
        docOut: { label: 'Văn bản đi', short: 'Văn bản đi', icon: '📄' }
    };
    /* DEMO credentials — stored as SHA-256 hex (không lưu plaintext). */
const _DEMO_PASS_HASH = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';
const accounts = {
        danguy: { user: 'danguy', passHash: _DEMO_PASS_HASH, role: 'DANG', title: 'Tài khoản Thành ủy', subtitle: 'Thường trực Thành ủy · Xem tất cả 04 trục', icon: '🚩' },
        hdnd: { user: 'hdnd', passHash: _DEMO_PASS_HASH, role: 'HDND', title: 'Tài khoản HĐND', subtitle: 'Chủ tịch HĐND Thành phố · Chỉ xem HĐND', icon: '🏛️' },
        ubnd: { user: 'ubnd', passHash: _DEMO_PASS_HASH, role: 'UBND', title: 'Tài khoản UBND', subtitle: 'Chủ tịch UBND Thành phố · UBND full + HĐND/MTTQ chỉ số', icon: '🏢' },
        mttq: { user: 'mttq', passHash: _DEMO_PASS_HASH, role: 'MTTQ', title: 'Tài khoản MTTQ', subtitle: 'Chủ tịch UB MTTQ Thành phố · Chỉ xem MTTQ', icon: '🤝' }
    };

    const segmentTemplate = {
        DANG: { assigned: { done: 180, doing: 95, regular: 40, soon: 30, risk: 22, overdue: 10 }, received: { done: 120, doing: 70, regular: 25, soon: 20, risk: 15, overdue: 8 }, docIn: { done: 210, doing: 140, regular: 35, soon: 40, risk: 25, overdue: 12 }, docOut: { done: 160, doing: 110, regular: 30, soon: 28, risk: 18, overdue: 9 } },
        HDND: { assigned: { done: 40, doing: 22, regular: 10, soon: 8, risk: 6, overdue: 3 }, received: { done: 55, doing: 35, regular: 15, soon: 14, risk: 10, overdue: 5 }, docIn: { done: 60, doing: 38, regular: 14, soon: 12, risk: 9, overdue: 4 }, docOut: { done: 42, doing: 26, regular: 10, soon: 8, risk: 6, overdue: 3 } },
        UBND: { assigned: { done: 320, doing: 210, regular: 90, soon: 75, risk: 55, overdue: 28 }, received: { done: 480, doing: 330, regular: 130, soon: 110, risk: 85, overdue: 42 }, docIn: { done: 600, doing: 410, regular: 160, soon: 140, risk: 100, overdue: 55 }, docOut: { done: 440, doing: 290, regular: 120, soon: 105, risk: 75, overdue: 35 } },
        MTTQ: { assigned: { done: 60, doing: 32, regular: 15, soon: 12, risk: 9, overdue: 4 }, received: { done: 75, doing: 48, regular: 20, soon: 18, risk: 12, overdue: 6 }, docIn: { done: 80, doing: 52, regular: 18, soon: 16, risk: 12, overdue: 6 }, docOut: { done: 58, doing: 36, regular: 14, soon: 12, risk: 9, overdue: 4 } }
    };

    const indicators = {
        DANG: [
            ['Theo dõi nhiệm vụ (VPTU)', 180, 'Ngày', 'Đồng bộ dữ liệu API'],
            ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ', 24, 'Tháng', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý', 24, 'Tháng', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng tháng (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
            ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng'],
            ['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'],
            ['UBKT - Giám sát của UBKT các cấp', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'],
            ['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'],
            ['UBKT - Thi hành kỷ luật', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'],
            ['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'],
            ['UBKT - Thống kê tình hình đoàn kiểm tra giám sát', 30, 'Tuần', 'CSDL/Excel UBKT Thành ủy'],
            ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân', 45, 'Tuần', 'CSDL/Excel Ban Nội chính'],
            ['Ban Nội chính - Số văn bản tham mưu trong tháng', 12, 'Tháng', 'CSDL/Excel Ban Nội chính'],
            ['Ban Nội chính - Vụ việc an toàn cháy nổ', 20, 'Tuần', 'CSDL/Excel Ban Nội chính'],
            ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người', 20, 'Tuần', 'CSDL/Excel Ban Nội chính'],
            ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo', 30, 'Quý', 'CSDL/Excel Ban Tuyên giáo'],
            ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị', 15, 'Quý', 'CSDL/Excel Ban Tuyên giáo'],
            ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội', 30, 'Tuần', 'CSDL/Excel Ban Tuyên giáo']
        ],
        HDND: [
            ['Theo dõi nhiệm vụ (HĐND)', 60, 'Ngày', 'Đồng bộ dữ liệu API']
        ],
        UBND: [
            ['Theo dõi nhiệm vụ (dùng chung khối chính quyền)', 420, 'Ngày', 'Đồng bộ dữ liệu API'],
            ['Sở GD&ĐT - Tổng quan số liệu toàn ngành', 30, 'Tháng', 'Kết nối API'],
            ['Sở GD&ĐT - Tổng quan mạng lưới trường học', 30, 'Tháng', 'Kết nối API'],
            ['Sở NN&MT - Chỉ tiêu tổng hợp ngành Nông nghiệp', 12, 'Tháng', 'File'],
            ['Sở NN&MT - Tổng hợp dữ liệu Giải phóng mặt bằng', 12, 'Tháng', 'File'],
            ['Sở NN&MT - Thống kê tình hình sử dụng đất đai', 12, 'Quý', 'File'],
            ['Sở NN&MT - Chỉ số chất lượng không khí (AQI)', 12, 'Ngày', 'File'],
            ['Sở Y tế - Tình hình dịch bệnh', 20, 'Tuần', 'File'],
            ['Sở Y tế - Số lượt khám chữa bệnh', 20, 'Tháng', 'File'],
            ['TT Phục vụ HCC - Thống kê số lượng hồ sơ', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Tỷ lệ cung cấp DVC trực tuyến', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Tình hình xử lý hồ sơ', 30, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Mức độ hài lòng', 30, 'Tháng', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Sáng kiến diễn đàn KHCN', 15, 'Quý', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Sáng kiến xây dựng Thủ đô', 15, 'Quý', 'Kết nối API (L0 đã thống nhất)'],
            ['TT Phục vụ HCC - Phản ánh hiện trường iHaNoi', 40, 'Ngày', 'Kết nối API (L0 đã thống nhất)'],
            ['Sở Tài chính - Sản phẩm trên địa bàn', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Tổng mức bán ra và doanh thu dịch vụ', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Tổng mức bán lẻ và doanh thu dịch vụ', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Vốn đầu tư phát triển xã hội theo giá hiện hành', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Vốn đầu tư thực hiện nguồn NSNN do địa phương quản lý', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Chỉ số sản xuất công nghiệp so với cùng kỳ', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Dự án trọng điểm', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Doanh thu vận tải, kho bãi, bưu chính chuyển phát', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Khách du lịch đến Hà Nội', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Kim ngạch nhập khẩu', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Kim ngạch xuất khẩu', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Chỉ số tiêu dùng, giá vàng, đô la Mỹ', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Tình hình thu ngân sách', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Tài chính - Tình hình chi ngân sách địa phương', 25, 'Tháng', 'Đang trao đổi để kết nối API'],
            ['Sở Nội vụ - Số lượng tìm việc trên sàn giao dịch việc làm', 20, 'Tuần', 'File'],
            ['Sở Nội vụ - Tổng số chi trả an sinh cho người có công', 20, 'Tháng', 'File'],
            ['Sở Nội vụ - Số lượng CCVC khối chính quyền', 20, 'Quý', 'File']
        ],
        MTTQ: [
            ['Theo dõi nhiệm vụ (MTTQ)', 60, 'Ngày', 'Đồng bộ dữ liệu API'],
            ['Thu chi quỹ "Vì người nghèo"', 15, 'Tháng', 'Excel/CSDL MTTQ'],
            ['Tình hình vận động thu quỹ "Vì người nghèo"', 15, 'Tháng', 'Excel/CSDL MTTQ'],
            ['Cơ cấu kết quả vận động nguồn lực hỗ trợ tặng quà Tết theo các cấp', 15, 'Quý', 'Excel/CSDL MTTQ'],
            ['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ', 15, 'Quý', 'Excel/CSDL MTTQ'],
            ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam"', 15, 'Quý', 'Excel/CSDL MTTQ']
        ]
    };

    /* Phân tổ (breakdown) của 1 chỉ tiêu: P = tách theo nhóm cùng đơn vị (vẽ dạng thanh %); S = các số liệu độc lập khác đơn vị (vẽ dạng thẻ KPI) */
    function P(dim, items) { return { dim, type: 'bar', items: items.map(x => ({ label: x[0], value: x[1] })) }; }
    function S(dim, items) { return { dim, type: 'stat', items: items.map(x => ({ label: x[0], value: x[1] })) }; }

    const categorySeed = {
        DANG: [
            { id: 'dang-vptu', name: 'VPTU · Theo dõi nhiệm vụ', field: 'Thành ủy', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ theo khối/đơn vị, đồng bộ trực tiếp qua IOC.', types: ['API'], items: [['Theo dõi nhiệm vụ (VPTU)', 1442, 'Ngày', 'Đồng bộ dữ liệu API']] },
            {
                id: 'dang-to-chuc', name: 'Ban Tổ chức Thành ủy', field: 'Thành ủy', desc: 'Tổ chức cán bộ, biên chế, đánh giá cán bộ, biến động Đảng viên và công tác chính trị nội bộ.', types: ['CSDL', 'Excel'], items: [
                    ['Ban Tổ chức - Tổng số CBCCVC khối Đảng, MTTQ', 4505, 'Tháng', 'CSDL/Excel nội bộ khối Đảng', [P('Khối', [['Khối Đảng', 3240], ['Khối MTTQ', 1620]])]],
                    ['Ban Tổ chức - Tổng số CBCCVC diện BTV Thành ủy quản lý', 24, 'Tháng', 'CSDL/Excel nội bộ khối Đảng', [P('Loại cán bộ', [['Lãnh đạo chủ chốt', 180], ['Cán bộ diện quy hoạch', 320], ['Cán bộ khác', 180]])]],
                    ['Ban Tổ chức - Tổng số Tổ chức Cơ sở Đảng', 5887, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Loại hình', [['Đảng bộ cơ sở', 186], ['Chi bộ cơ sở', 940]])]],
                    ['Ban Tổ chức - Biên chế khối Đảng, Đoàn thể (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng', [P('Khối', [['Khối Đảng', 1860], ['Đoàn thể', 940]])]],
                    ['Ban Tổ chức - Kết quả đánh giá cán bộ hàng tháng (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng', [P('Mức đánh giá', [['Hoàn thành xuất sắc', 420], ['Hoàn thành tốt', 1240], ['Hoàn thành nhiệm vụ', 980], ['Không hoàn thành', 60]])]],
                    ['Ban Tổ chức - Biến động Đảng viên theo thời gian (126 xã/phường)', 126, 'Tháng', 'CSDL/Excel nội bộ khối Đảng', [P('Loại biến động', [['Kết nạp mới', 680], ['Chuyển sinh hoạt đến', 420], ['Chuyển sinh hoạt đi', 380], ['Từ trần, xóa tên', 86]])]],
                    ['Ban Tổ chức - Cơ cấu tổ chức Đảng trực thuộc', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Loại hình', [['Đảng bộ trực thuộc', 48], ['Chi bộ trực thuộc', 186]])]],
                    ['Ban Tổ chức - Kết quả thực hiện công tác chính trị nội bộ', 24, 'Quý', 'CSDL/Excel nội bộ khối Đảng', [P('Nội dung', [['Sinh hoạt định kỳ', 420], ['Học tập nghị quyết, chỉ thị', 280], ['Kiểm điểm, đánh giá cuối năm', 180]])]]
                ]
            },
            { id: 'dang-ubkt', name: 'Ủy ban Kiểm tra Thành ủy', field: 'Thành ủy', desc: 'Kiểm tra, giám sát theo địa bàn (bản đồ), thi hành kỷ luật và tình hình đoàn kiểm tra giám sát.', types: ['CSDL', 'Excel'], items: [['UBKT - Thống kê số liệu kiểm tra, giám sát theo địa bàn (bản đồ)', 30, 'Tháng', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Giám sát của UBKT các cấp', 233, 'Tháng', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Kiểm tra giám sát của cấp ủy các cấp và chi bộ', 1049, 'Tháng', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Thi hành kỷ luật', 35, 'Tháng', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Kiểm tra của UBKT các cấp (KTGS, THKL, tài chính Đảng)', 91, 'Tháng', 'CSDL/Excel UBKT Thành ủy'], ['UBKT - Thống kê tình hình đoàn kiểm tra giám sát', 272, 'Tuần', 'CSDL/Excel UBKT Thành ủy']] },
            {
                id: 'dang-noi-chinh', name: 'Ban Nội chính Thành ủy', field: 'Thành ủy', desc: 'Tiếp công dân, văn bản tham mưu, an toàn cháy nổ và khiếu nại - tố cáo đông người.', types: ['CSDL', 'Excel'], items: [
                    ['Ban Nội chính - Tổng số cuộc tiếp/Tổng số lượt công dân', 11, 'Tuần', 'CSDL/Excel Ban Nội chính'],
                    ['Ban Nội chính - Số văn bản tham mưu trong tháng', 9, 'Tháng', 'CSDL/Excel Ban Nội chính'],
                    ['Ban Nội chính - Vụ việc an toàn cháy nổ', 59, 'Tuần', 'CSDL/Excel Ban Nội chính'],
                    ['Ban Nội chính - Số lượt công dân khiếu nại, tố cáo đông người', 696, 'Tuần', 'CSDL/Excel Ban Nội chính']
                ]
            },
            {
                id: 'dang-tuyen-giao', name: 'Ban Tuyên giáo và Dân vận Thành ủy', field: 'Thành ủy', desc: 'Mô hình dân vận khéo, học tập quán triệt nghị quyết/chỉ thị và nắm bắt dư luận xã hội.', types: ['CSDL', 'Excel'], items: [
                    ['Ban Tuyên giáo & Dân vận - Đăng ký mô hình dân vận khéo', 10972, 'Năm', 'CSDL/Excel Ban Tuyên giáo'],
                    ['Ban Tuyên giáo & Dân vận - Học tập quán triệt nghị quyết, chỉ thị', 15, 'Quý', 'CSDL/Excel Ban Tuyên giáo', [P('Đối tượng', [['Cán bộ chủ chốt', 420], ['Đảng viên', 3860], ['Quần chúng, đoàn viên, hội viên', 1240]])]],
                    ['Ban Tuyên giáo & Dân vận - Nắm bắt dư luận xã hội', 2410, 'Tuần', 'CSDL/Excel Ban Tuyên giáo']
                ]
            }
        ],
        HDND: [
            { id: 'hdnd-nhiem-vu', name: 'HĐND · Theo dõi nhiệm vụ', field: 'HĐND', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối HĐND Thành phố.', types: ['API'], items: [['Theo dõi nhiệm vụ (HĐND)', 60, 'Ngày', 'Đồng bộ dữ liệu API']] }
        ],
        MTTQ: [
            { id: 'mttq-nhiem-vu', name: 'MTTQ · Theo dõi nhiệm vụ', field: 'MTTQ', desc: 'Thống kê số lượng, tình trạng nhận và giao nhiệm vụ của khối MTTQ Thành phố.', types: ['API'], items: [['Theo dõi nhiệm vụ (MTTQ)', 60, 'Ngày', 'Đồng bộ dữ liệu API']] },
            {
                id: 'mttq-quy', name: 'MTTQ · Quỹ và an sinh', field: 'MTTQ', desc: 'Thu chi Quỹ "Vì người nghèo", vận động tặng quà Tết và ủng hộ Quỹ "Vì biển, đảo Việt Nam".', types: ['Excel', 'CSDL'], items: [
                    ['Thu chi quỹ "Vì người nghèo" (triệu đồng)', 15, 'Tháng', 'Excel/CSDL MTTQ', [P('Loại', [['Thu quỹ', 680], ['Chi hỗ trợ', 540]])]],
                    ['Tình hình vận động thu quỹ "Vì người nghèo"', 15, 'Tháng', 'Excel/CSDL MTTQ', [P('Nguồn vận động', [['Cán bộ, công chức', 280], ['Doanh nghiệp', 420], ['Nhân dân', 680], ['Nguồn khác', 120]])]],
                    ['Cơ cấu kết quả vận động nguồn lực hỗ trợ tặng quà Tết theo các cấp', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Cấp vận động', [['Cấp Thành phố', 420], ['Cấp quận/huyện', 680], ['Cấp xã/phường', 940]])]],
                    ['Cơ cấu kết quả hỗ trợ tặng quà Tết theo nguồn quỹ', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Nguồn quỹ', [['Ngân sách hỗ trợ', 380], ['Quỹ Vì người nghèo', 620], ['Xã hội hóa, doanh nghiệp', 480]])]],
                    ['Thống kê ủng hộ quỹ "Vì biển, đảo Việt Nam"', 15, 'Quý', 'Excel/CSDL MTTQ', [P('Đối tượng ủng hộ', [['Cán bộ, công chức, viên chức', 420], ['Doanh nghiệp', 280], ['Nhân dân', 680]])]]
                ]
            }
        ],
        UBND: [
            {
                id: 'ubnd-vhtt', name: 'Sở Văn hóa và Thể thao', field: 'Văn hóa - Thể thao', desc: 'Bộ chỉ tiêu STT 66-67 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Số hoạt động nghệ thuật chuyên nghiệp', 186, 'Quý', 'File', [P('Loại hình', [['Liên hoan', 62], ['Hội diễn', 78], ['Hội thi', 46]]), P('Tính chất', [['Có thu', 104], ['Phục vụ chính trị', 82]]), P('Quy mô', [['Quốc gia', 35], ['Thành phố', 151]])]],
                    ['Doanh thu của các đơn vị nghệ thuật Thành phố quản lý (42.800 triệu đồng)', 24, 'Quý', 'File', []]
                ]
            },
            {
                id: 'ubnd-gddt', name: 'Sở Giáo dục và Đào tạo', field: 'Giáo dục', desc: 'Tổng quan số liệu toàn ngành và mạng lưới trường học.', types: ['API'], items: [
                    ['Sở GD&ĐT - Tổng quan số liệu toàn ngành', 30, 'Tháng', 'Kết nối API', [S('Quy mô toàn ngành', [['Tổng số trường', 2963], ['Trường đạt chuẩn quốc gia', 1868], ['Tổng số lớp học', 50523], ['Tổng số phòng học', 41332]]), S('Nhân lực - học sinh', [['Tổng học sinh', 1918158], ['Tổng giáo viên', 144292], ['Tổng nhân sự', 186401]]), S('Sức khỏe & chính sách học sinh', [['HS biết bơi', 639081], ['HS có tật về mắt', 492302], ['HS diện chính sách', 51063]])]],
                    ['Sở GD&ĐT - Tổng quan mạng lưới trường học', 30, 'Tháng', 'Kết nối API', [P('Top 8 đơn vị theo số học sinh', [['Phường Hà Đông', 61084], ['Phường Từ Liêm', 53054], ['Phường Yên Hòa', 51622], ['Phường Cầu Giấy', 35595], ['Phường Nghĩa Đô', 34641], ['Phường Vĩnh Tuy', 33802], ['Xã Gia Lâm', 32804], ['Phường Thanh Xuân', 31094]]), P('Top 8 đơn vị chênh lệch số HS giữa 2 nguồn', [['Phường Vĩnh Tuy', 18243], ['Phường Yên Hòa', 13952], ['Phường Nghĩa Đô', 9833], ['Phường Từ Liêm', 8993], ['Xã Gia Lâm', 8833], ['Phường Định Công', 8050], ['Phường Tây Mỗ', 7236], ['Phường Cầu Giấy', 5288]])]]
                ]
            },
            {
                id: 'ubnd-nnmt', name: 'Sở Nông nghiệp và Môi trường (hợp nhất từ Sở NN&PTNT và Sở TN&MT)', field: 'Nông nghiệp - Môi trường', desc: 'Bộ chỉ tiêu STT 17-19, 75, 76, 78, 79, 81-83 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Tỷ lệ xã được công nhận đạt chuẩn nông thôn mới', 126, 'Quý', 'File', [P('Mức đạt chuẩn', [['NTM nâng cao', 68], ['NTM kiểu mẫu', 34], ['Chưa đạt nâng cao/kiểu mẫu', 24]])]],
                    ['Diện tích rừng bị thiệt hại (ha)', 186, 'Quý', 'File', [P('Nguyên nhân', [['Bị chặt phá', 62], ['Bị cháy', 84], ['Nguyên nhân khác', 40]])]],
                    ['Diện tích rừng trồng mới tập trung (ha)', 420, 'Quý', 'File', []],
                    ['Chương trình mục tiêu quốc gia về xây dựng nông thôn mới', 2860, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 980], ['NS Địa phương', 1240], ['Tín dụng', 420], ['Doanh nghiệp', 140], ['Đóng góp người dân', 80]]), S('Kết quả thực hiện', [['Tỷ lệ giải ngân so kế hoạch (%)', 62.4], ['Tỷ lệ dự án hoàn thành đúng tiến độ (%)', 78.6], ['Thu nhập bình quân đầu người nông thôn (triệu đồng/năm)', 68.2], ['Tỷ lệ tham gia BHYT (%)', 94.8], ['Tỷ lệ hộ dùng nước sạch (%)', 96.5]])]],
                    ['Chương trình mục tiêu quốc gia giảm nghèo bền vững', 1420, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 520], ['NS Địa phương', 640], ['Tín dụng', 180], ['Doanh nghiệp', 50], ['Đóng góp người dân', 30]]), S('Kết quả thực hiện', [['Tỷ lệ hộ nghèo (%)', 0.8], ['Tỷ lệ hộ cận nghèo (%)', 1.4], ['Lao động hộ nghèo được hỗ trợ đào tạo nghề', 680]])]],
                    ['Các thông tin về khí tượng thủy văn', 365, 'Ngày', 'File', []],
                    ['Các thông tin về công trình phòng chống thiên tai', 248, 'Quý', 'File', [P('Loại công trình', [['Hồ chứa thủy lợi', 42], ['Thủy điện', 18], ['Đê điều', 126], ['Sạt lở bờ sông, bờ biển', 62]])]],
                    ['Số hộ/người được hỗ trợ lương thực do thiên tai, hỏa hoạn, giáp hạt', 1860, 'Quý', 'File', []],
                    ['Tổng số gạo hỗ trợ (tấn)', 3200, 'Quý', 'File', []],
                    ['Các dữ liệu về bản đồ và ảnh viễn thám', 18, 'Quý', 'File', [P('Loại dữ liệu', [['Bản đồ rủi ro thiên tai', 6], ['Sạt lở', 4], ['Ngập lụt', 5], ['Ảnh vệ tinh', 3]])]],
                    ['Tổng hợp dữ liệu GPMB', 14, 'Tuần', 'File'],
                    ['Thống kê tình hình sử dụng đất đai (ha)', 3, 'Năm', 'File']
                ]
            },
            {
                id: 'ubnd-yte', name: 'Sở Y tế', field: 'Y tế', desc: 'Bộ chỉ tiêu STT 36, 37, 46 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Số vụ ngộ độc thực phẩm và mức độ thiệt hại', 42, 'Tháng', 'File', [S('Mức độ thiệt hại', [['Số vụ', 42], ['Số người bị ngộ độc', 386], ['Số người chết', 2]])]],
                    ['Dịch bệnh nhóm A, B theo Luật Phòng chống bệnh truyền nhiễm', 1860, 'Tuần', 'File', [S('Tình hình dịch', [['Số người nhiễm', 1860], ['Số người tử vong', 4]])]],
                    ['Bảo trợ xã hội', 60, 'Tháng', 'File', [P('Đối tượng', [['Trợ cấp xã hội hàng tháng', 32400], ['Hỗ trợ kinh phí chăm sóc hàng tháng', 8600], ['Người khuyết tật được cấp giấy chứng nhận', 5200], ['Người khuyết tật được cấp thẻ BHYT', 2400]])]]
                ]
            },
            {
                id: 'ubnd-taichinh', name: 'Sở Tài chính (hợp nhất từ Sở Kế hoạch và Đầu tư và Sở Tài chính)', field: 'Tài chính - Ngân sách', desc: 'Bộ chỉ tiêu STT 2, 3, 5, 6, 7, 8, 11, 12, 21, 55, 57, 58, 80 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['Excel', 'CSDL'], items: [
                    ['Thu ngân sách nhà nước (tỷ đồng)', 36, 'Tháng', 'CSDL', [S('So với dự toán', [['Lũy kế đến kỳ báo cáo', 186500], ['Dự toán năm', 420000]])]],
                    ['Thuế, phí, lệ phí và các khoản thu khác NSNN (tỷ đồng)', 36, 'Tháng', 'CSDL', [P('Sắc thuế chính', [['Thuế GTGT', 52400], ['Thuế TNDN', 38600], ['Thuế TNCN', 29800], ['Phí, lệ phí và khoản thu khác', 21500]])]],
                    ['Gạo xuất cấp hỗ trợ các địa phương (tấn)', 3200, 'Quý', 'File', [P('Mục đích', [['Cứu đói giáp hạt', 1400], ['Khắc phục thiên tai', 1100], ['Hỗ trợ khác', 700]])]],
                    ['Doanh nghiệp', 60, 'Tháng', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Công nghiệp - Xây dựng', 18600], ['Thương mại - Dịch vụ', 26400], ['Nông - Lâm - Thủy sản', 3200], ['Ngành khác', 6000]]), S('Tình hình hoạt động', [['Đang hoạt động', 54200], ['Thành lập mới', 4800], ['Quay trở lại hoạt động', 1600], ['Tạm ngừng kinh doanh', 2100], ['Chờ giải thể', 540], ['Đã giải thể', 380]])]],
                    ['Đấu thầu', 2860, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Xây dựng', 1240], ['Y tế - Giáo dục', 480], ['CNTT - Viễn thông', 360], ['Ngành khác', 780]]), S('Kết quả đấu thầu', [['Tổng số gói thầu', 2860], ['Tổng giá trị trúng thầu (tỷ đồng)', 18400], ['Tỷ lệ tiết kiệm (%)', 8.6]])]],
                    ['Hợp tác xã, kinh tế tập thể', 1850, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Nông nghiệp', 920], ['Công nghiệp - TTCN', 380], ['Thương mại - Dịch vụ', 420], ['Ngành khác', 130]]), S('Biến động', [['Đang hoạt động', 1850], ['Thành lập mới', 86], ['Giải thể', 34], ['Vốn điều lệ HTX thành lập mới (tỷ đồng)', 142]])]],
                    ['Vốn đầu tư có yếu tố nước ngoài (triệu USD)', 4820, 'Tháng', 'CSDL', [S('Cơ cấu vốn FDI', [['Vốn đầu tư thực hiện', 2650], ['Vốn đăng ký cấp mới', 1680], ['Vốn đăng ký điều chỉnh', 490], ['Góp vốn mua cổ phần', 380]]), S('Dự án', [['Số dự án cấp mới', 186], ['Số lượt dự án điều chỉnh', 94]])]],
                    ['Dự án đầu tư công', 420, 'Quý', 'CSDL', [P('Theo phân ngành kinh tế (VSIC)', [['Giao thông', 148], ['Giáo dục - Y tế', 96], ['Hạ tầng đô thị', 112], ['Ngành khác', 64]]), S('Giải ngân', [['Tổng vốn đầu tư (tỷ đồng)', 68400], ['Tỷ lệ giải ngân so kế hoạch (%)', 54.2]])]],
                    ['Dự án quan trọng quốc gia, công trình trọng điểm giao thông vận tải', 18, 'Quý', 'File', [S('Tiến độ tổng hợp', [['Tổng vốn đầu tư (tỷ đồng)', 186000], ['Tiến độ giải ngân (%)', 42.5], ['Tiến độ thi công (%)', 58]])]],
                    ['Số dự án, số vốn đầu tư bằng nguồn vốn trong nước ngoài ngân sách nhà nước được cấp chủ trương đầu tư', 96, 'Quý', 'CSDL', [P('Ngành kinh tế', [['Bất động sản', 34], ['Công nghiệp', 28], ['Thương mại - Dịch vụ', 22], ['Ngành khác', 12]])]],
                    ['Thu ngân sách nhà nước và cơ cấu thu (tỷ đồng)', 36, 'Tháng', 'CSDL', [P('Lĩnh vực thu', [['Thu nội địa', 158200], ['Thu từ hoạt động xuất nhập khẩu', 24600], ['Thu viện trợ', 1200], ['Thu khác', 2500]])]],
                    ['Chi ngân sách nhà nước và cơ cấu chi (tỷ đồng)', 36, 'Tháng', 'CSDL', [P('Khoản chi chủ yếu', [['Chi đầu tư phát triển', 58600], ['Chi thường xuyên', 76400], ['Chi trả nợ lãi', 7800]])]],
                    ['Các thông tin về dân sinh – kinh tế', 126, 'Quý', 'File', [S('Chỉ tiêu tổng hợp', [['Dân cư (nghìn người)', 8580], ['Nhà ở (nghìn căn)', 2140], ['Đất diện tích trồng trọt (ha)', 86500], ['Số đầu con trong chăn nuôi (nghìn con)', 4250], ['Diện tích thủy sản (ha)', 24800], ['Số hộ thiếu đói', 86]])]],
                    ['Tình hình thu ngân sách so với dự toán', 10, 'Quý', 'CSDL'],
                    ['Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội', 10, 'Quý', 'CSDL'],
                    ['Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 10, 'Quý', 'CSDL'],
                    ['Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 10, 'Quý', 'CSDL'],
                    ['Chỉ số sản xuất công nghiệp so với cùng kỳ năm trước', 10, 'Quý', 'CSDL'],
                    ['Tiến độ hoàn thành các dự án trọng điểm', 10, 'Quý', 'CSDL'],
                    ['Doanh thu vận tải, kho bãi, dịch vụ hỗ trợ vận tải và bưu chính chuyển phát', 10, 'Quý', 'CSDL'],
                    ['Khách du lịch đến Hà Nội (do cơ sở lưu trú phục vụ)', 10, 'Quý', 'CSDL'],
                    ['Kim ngạch xuất nhập khẩu', 10, 'Quý', 'CSDL'],
                    ['Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ', 10, 'Quý', 'CSDL'],
                    ['Tình hình chi ngân sách địa phương', 10, 'Quý', 'CSDL']
                ]
            },
            {
                id: 'ubnd-noivu', name: 'Sở Nội vụ (hợp nhất từ Sở Nội vụ và Sở Lao động - Thương binh và Xã hội)', field: 'Nội vụ', desc: 'Bộ chỉ tiêu STT 42, 47, 53 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Lao động', 60, 'Quý', 'File', [P('Loại hình lao động', [['LĐ Việt Nam đi làm việc ở nước ngoài theo hợp đồng', 8600], ['LĐ nước ngoài làm việc tại Việt Nam', 5200], ['Giao dịch việc làm', 38600]])]],
                    ['Công chức, viên chức (186.401 biên chế thực hiện)', 60, 'Quý', 'File', [S('Biên chế', [['Biên chế được giao', 168500], ['Biên chế thực hiện', 162300], ['Biên chế hưởng lương từ NSNN', 159800]]), P('Biến động trong kỳ', [['Tuyển mới', 4200], ['Nghỉ hưu', 3100], ['Thôi việc', 1800], ['Chuyển công tác ra khỏi cơ quan', 950]])]],
                    ['Chỉ số cải cách hành chính của thành phố (89,4 điểm)', 12, 'Năm', 'File', []],
                    ['Doanh nghiệp tham gia tuyển dụng', 64, 'Quý', 'File'],
                    ['Tổng số nhu cầu tuyển dụng', 443, 'Quý', 'File'],
                    ['Số hồ sơ tìm việc', 652, 'Quý', 'File'],
                    ['Tổng số chi trả an sinh cho người có công', 1, 'Tháng', 'File'],
                    ['Tổng số CCVC khối chính quyền', 20, 'Năm', 'File']
                ]
            },
            { id: 'ubnd-tuphap', name: 'Sở Tư pháp', field: 'Tư pháp', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Tư pháp hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
            {
                id: 'ubnd-congthuong', name: 'Sở Công Thương', field: 'Công Thương', desc: 'Bộ chỉ tiêu STT 15, 16, 25 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Xăng dầu (nghìn m3)', 1240, 'Tháng', 'File', [P('Nguồn cung', [['Sản xuất trong nước', 780], ['Nhập khẩu', 460]])]],
                    ['Than (nghìn tấn)', 860, 'Tháng', 'File', [P('Nguồn cung', [['Sản xuất trong nước', 520], ['Nhập khẩu', 340]])]],
                    ['Thương mại điện tử', 24, 'Tháng', 'File', [S('Chỉ số tổng hợp', [['Doanh thu TMĐT (tỷ đồng)', 48600], ['Tỷ lệ đóng góp vào tổng mức bán lẻ (%)', 14.8], ['Số người mua sắm trực tuyến (nghìn người)', 3860], ['Giá trị GD trung bình/người mua (nghìn đồng)', 1260], ['Chỉ số phát triển hạ tầng logistics', 72.4], ['Mức độ phổ biến thanh toán điện tử (%)', 68.5]]), P('Phương thức thanh toán', [['Ví điện tử', 38], ['Thẻ ngân hàng', 34], ['Tiền mặt khi nhận hàng', 22], ['Khác', 6]]), P('Kênh mua sắm phổ biến', [['Sàn TMĐT', 46], ['Mạng xã hội', 28], ['Website doanh nghiệp', 18], ['Ứng dụng giao đồ ăn', 8]])]]
                ]
            },
            {
                id: 'ubnd-xaydung', name: 'Sở Xây dựng', field: 'Xây dựng', desc: 'Bộ chỉ tiêu STT 20, 84 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Nhà ở và thị trường bất động sản', 48, 'Quý', 'File', [P('Phân loại công trình', [['Nhà ở thương mại', 9600], ['Nhà ở xã hội', 4200], ['Nhà ở riêng lẻ', 8400], ['Chung cư tái định cư', 2600]]), S('Diện tích xây dựng', [['Tổng diện tích (triệu m2)', 18.6]])]],
                    ['Các thông tin dữ liệu về giao thông vận tải', 86, 'Quý', 'File', [P('Loại nguy cơ', [['Sạt lở', 34], ['Úng ngập', 52]])]]
                ]
            },
            { id: 'ubnd-khcn', name: 'Sở Khoa học và Công nghệ (hợp nhất từ Sở TT&TT và Sở KH&CN)', field: 'Khoa học - Công nghệ', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Khoa học và Công nghệ hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
            {
                id: 'ubnd-dantoc-tongiao', name: 'Sở Dân tộc và Tôn giáo', field: 'Dân tộc - Tôn giáo', desc: 'Bộ chỉ tiêu STT 77 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Chương trình mục tiêu quốc gia về phát triển kinh tế - xã hội vùng đồng bào dân tộc và miền núi', 680, 'Quý', 'File', [P('Nguồn vốn theo kế hoạch (tỷ đồng)', [['NS Trung ương', 280], ['NS Địa phương', 260], ['Tín dụng', 90], ['Doanh nghiệp', 30], ['Đóng góp người dân', 20]]), S('Kết quả thực hiện', [['Tỷ lệ hộ DTTS dùng nước sinh hoạt hợp vệ sinh (%)', 92.4], ['Tỷ lệ xã có đường ô tô đến trung tâm được cứng hóa (%)', 96.8], ['Tỷ lệ học sinh đi học đúng cấp học (%)', 97.2], ['Tỷ lệ giảm hộ nghèo tại xã/thôn khó khăn (%)', 2.6]])]]
                ]
            },
            {
                id: 'ubnd-dulich', name: 'Sở Du lịch', field: 'Du lịch', desc: 'Bộ chỉ tiêu STT 22, 23, 65 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Số lượt khách du lịch nội địa (18.600 nghìn lượt)', 36, 'Tháng', 'File', []],
                    ['Số lượt khách du lịch quốc tế (nghìn lượt)', 4860, 'Tháng', 'File', [P('Lưu trú', [['Có lưu trú', 3420], ['Không lưu trú', 1440]]), P('Thị trường trọng điểm', [['Trung Quốc', 1240], ['Hàn Quốc', 980], ['Ấn Độ', 620], ['Pháp', 480], ['Nhật Bản', 540], ['Thị trường khác', 1000]])]],
                    ['Tổng thu từ khách du lịch (86.400 tỷ đồng)', 36, 'Tháng', 'File', [P('Nhóm khách', [['Khách nội địa', 48600], ['Khách quốc tế', 37800]])]]
                ]
            },
            { id: 'ubnd-quyhoach-kientruc', name: 'Sở Quy hoạch - Kiến trúc', field: 'Quy hoạch - Kiến trúc', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, Sở Quy hoạch - Kiến trúc hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
            { id: 'ubnd-so14', name: 'Sở/đơn vị chuyên môn thứ 14 (PMO xác nhận theo danh mục chính thức)', field: '', desc: 'Theo phụ lục khảo sát chỉ tiêu theo sở, đơn vị này hiện không có chỉ tiêu nào được giao trong bộ chỉ số IOC/CAD.', types: [], items: [], noItems: true },
            {
                id: 'ubnd-thanhtra', name: 'Thanh tra Thành phố', field: 'Thanh tra', desc: 'Bộ chỉ tiêu STT 39, 40, 41 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Thanh tra', 186, 'Quý', 'File', [S('Kết quả', [['Số đơn vị được thanh tra', 186], ['Đã ban hành kết luận', 162], ['Kiến nghị xử lý', 94]])]],
                    ['Kiểm tra Chủ tịch UBND xã, phường, người đứng đầu cơ quan chuyên môn, tổ chức hành chính khác, đơn vị sự nghiệp công lập trong việc thực hiện pháp luật về tiếp công dân, giải quyết khiếu nại, tố cáo và phòng, chống tham nhũng, tiêu cực', 126, 'Quý', 'File', [S('Kết quả', [['Số đơn vị được kiểm tra', 126], ['Đã ban hành kết luận', 108], ['Kiến nghị xử lý', 46]])]],
                    ['Tiếp công dân, giải quyết khiếu nại, tố cáo', 2860, 'Tuần', 'File', [S('Kết quả', [['Số cuộc tiếp công dân', 2860], ['Tiếp nhận đơn thư', 1940], ['Kết quả giải quyết vụ việc, khiếu nại, tố cáo', 1680]])]]
                ]
            },
            {
                id: 'ubnd-vpubnd', name: 'Văn phòng UBND Thành phố Hà Nội', field: 'Văn phòng UBND', desc: 'Bộ chỉ tiêu STT 74 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['API'], items: [
                    ['Nhóm chỉ số theo dõi việc thực hiện nhiệm vụ Chính phủ, Thủ tướng Chính phủ giao', 4860, 'Tháng', 'API', [P('Tình trạng thực hiện (lũy kế)', [['Hoàn thành đúng hạn', 3260], ['Hoàn thành quá hạn', 420], ['Chưa hoàn thành quá hạn', 180], ['Đang triển khai', 1000]])]]
                ]
            },
            {
                id: 'ubnd-bqlkcnc', name: 'Ban Quản lý Khu công nghệ cao và khu công nghiệp thành phố', field: 'Khu công nghệ cao - KCN', desc: 'Bộ chỉ tiêu STT 9, 10 theo phụ lục khảo sát chỉ tiêu theo sở.', types: ['File'], items: [
                    ['Khu công nghiệp, khu chế xuất, khu kinh tế', 186, 'Quý', 'File', [S('Tình hình hoạt động', [['Số lượng thành lập, điều chỉnh', 18], ['Thu hút đầu tư (dự án)', 42], ['Đầu tư kết cấu hạ tầng (%)', 86.4]])]],
                    ['Khu Công nghệ cao', 48, 'Quý', 'File', [S('Tình hình hoạt động', [['Số lượng thành lập, điều chỉnh', 6], ['Thu hút đầu tư (dự án)', 14], ['Đầu tư kết cấu hạ tầng (%)', 92.1]])]]
                ]
            }
        ]
    };

    const taskTitlePool = {
        DANG: ['Rà soát, tổng hợp nhiệm vụ thực hiện Nghị quyết 57-NQ/TW', 'Tổng hợp số liệu công tác cán bộ, Đảng viên (Ban Tổ chức)', 'Tổng hợp kết quả kiểm tra - giám sát (UBKT Thành ủy)', 'Xử lý đơn thư, tiếp công dân (Ban Nội chính)', 'Tổng hợp dư luận xã hội, mô hình dân vận khéo (Ban Tuyên giáo)', 'Chuẩn bị nội dung giao ban Thường trực Thành ủy'],
        HDND: ['Theo dõi tiến độ thực hiện nghị quyết HĐND Thành phố', 'Tổng hợp kết quả giám sát chuyên đề', 'Giải quyết kiến nghị cử tri', 'Chuẩn bị nội dung kỳ họp HĐND Thành phố', 'Rà soát báo cáo chất vấn, trả lời chất vấn', 'Theo dõi các dự án, công trình trọng điểm'],
        UBND: ['Tổng hợp số liệu ngành Giáo dục và Đào tạo', 'Tổng hợp số liệu Nông nghiệp và Môi trường (GPMB, AQI)', 'Tổng hợp tình hình dịch bệnh, khám chữa bệnh (Sở Y tế)', 'Xử lý hồ sơ tại Trung tâm Phục vụ hành chính công', 'Tổng hợp chỉ số kinh tế - tài chính - ngân sách (Sở Tài chính)', 'Tổng hợp số liệu tổ chức - biên chế (Sở Nội vụ)', 'Điều phối, giao ban khối chính quyền'],
        MTTQ: ['Tổng hợp phản biện xã hội, giám sát cộng đồng', 'Theo dõi thu chi Quỹ "Vì người nghèo"', 'Tổng hợp vận động Quỹ "Vì biển, đảo Việt Nam"', 'Tổng hợp kết quả hỗ trợ, tặng quà Tết', 'Theo dõi hoạt động Đoàn Thanh niên, Hội Phụ nữ, CCB, Công đoàn', 'Tổng hợp ý kiến nhân dân qua các đợt khảo sát IOC']
    };
    const fieldPool = {
        DANG: ['Điều hành – chỉ đạo', 'Tổ chức cán bộ (Ban Tổ chức)', 'Kiểm tra – giám sát (UBKT)', 'Nội chính – tiếp công dân', 'Tuyên giáo – dân vận', 'Nghị quyết 57-NQ/TW', 'Văn bản điều hành'],
        HDND: ['Điều hành kỳ họp', 'Theo dõi nghị quyết', 'Giám sát chuyên đề', 'Cử tri – kiến nghị'],
        UBND: ['Giáo dục và Đào tạo', 'Nông nghiệp và Môi trường', 'Y tế', 'Hành chính công', 'Tài chính – ngân sách', 'Nội vụ', 'Kinh tế – xã hội', 'Văn bản điều hành'],
        MTTQ: ['Phản biện xã hội', 'Quỹ vì người nghèo', 'Quỹ biển đảo', 'Tặng quà Tết', 'Đoàn thể chính trị - xã hội']
    };
    const units = ['Văn phòng Thành ủy', 'Ban Tổ chức Thành ủy', 'Ủy ban Kiểm tra Thành ủy', 'Ban Nội chính Thành ủy', 'Ban Tuyên giáo và Dân vận Thành ủy', 'Văn phòng HĐND Thành phố', 'Văn phòng UBND Thành phố', 'Sở Giáo dục và Đào tạo', 'Sở Nông nghiệp và Môi trường', 'Sở Y tế', 'Trung tâm Phục vụ hành chính công Thành phố', 'Sở Tài chính', 'Sở Nội vụ', 'Ủy ban MTTQ Việt Nam Thành phố'];
    const docTypeOptions = ['Công văn', 'Đơn thư', 'Tường trình', 'Quyết định', 'Thông báo', 'Cảnh cáo'];
    const docTypeCodePrefix = { 'Công văn': 'CV', 'Đơn thư': 'DT', 'Tường trình': 'TT', 'Quyết định': 'QD', 'Thông báo': 'TB', 'Cảnh cáo': 'CB' };
    const docSignerPool = {
        DANG: ['Nguyễn Văn Phong', 'Trần Thị Hạnh'],
        HDND: ['Trần Thị Hạnh', 'Nguyễn Văn Phong'],
        UBND: ['Nguyễn Văn Phong', 'Trần Thị Hạnh', 'Nguyễn Đình Trường'],
        MTTQ: ['Trần Thị Hạnh', 'Nguyễn Đình Trường']
    };
    const docIssuerPool = { DANG: 'Thành ủy Hà Nội', HDND: 'HĐND Thành phố Hà Nội', UBND: 'UBND Thành phố Hà Nội', MTTQ: 'Ủy ban MTTQ Việt Nam Thành phố Hà Nội' };
    const docTopicPhrases = ['đôn đốc tiến độ thực hiện', 'hướng dẫn triển khai', 'phê duyệt kế hoạch', 'kiện toàn tổ chức', 'thông báo kết luận giao ban', 'tổng hợp báo cáo kết quả', 'xử lý phản ánh, kiến nghị', 'rà soát, cập nhật số liệu', 'chỉ đạo tăng cường công tác', 'thành lập tổ công tác', 'ban hành quy định tạm thời', 'sơ kết, tổng kết công tác', 'phối hợp thực hiện nhiệm vụ', 'khảo sát, đánh giá hiện trạng'];
    /* Sinh nội dung 1 văn bản (số/ký hiệu, tiêu đề, trích yếu, người ký, cơ quan...) theo mẫu thực tế, biến thiên theo lĩnh vực/trục — deterministic (không Math.random) để demo ổn định. */
    function buildDocumentContent(role, idx) {
        const docType = pick(docTypeOptions, idx);
        const fieldName = pick(fieldPool[role], idx + 3);
        const topic = pick(docTopicPhrases, idx);
        const signer = pick(docSignerPool[role], idx);
        const issuer = /an ninh|trật tự|pccc/i.test(fieldName) ? 'Công an Thành phố Hà Nội' : docIssuerPool[role];
        const code = `${docTypeCodePrefix[docType]}-2026-${String(idx + 1).padStart(3, '0')}`;
        const title = `${docType} ${topic} thuộc lĩnh vực ${fieldName}`;
        const summary = `V/v ${topic} lĩnh vực ${fieldName.toLowerCase()} tại Thành phố Hà Nội`;
        return { code, title, summary, signer, issuer, docType, field: fieldName };
    }

    /* Kịch bản xử lý dùng chung cho hồ sơ/nhiệm vụ và chỉ tiêu */
    const DEFAULT_SCENARIOS = {
        overdue: {
            title: 'Kịch bản xử lý quá hạn', level: 'Khẩn', desc: 'Dùng khi nhiệm vụ/văn bản/chỉ tiêu đã quá hạn hoặc chưa có kết quả trong thời gian cam kết.',
            objective: 'Phát hiện, cảnh báo và xử lý dứt điểm các nhiệm vụ/văn bản/chỉ tiêu đã quá hạn cam kết, đảm bảo có kết quả và trách nhiệm rõ ràng.',
            scope: 'Áp dụng cho toàn bộ nhiệm vụ, văn bản, chỉ tiêu do các đơn vị thuộc phường Việt Hưng chủ trì hoặc phối hợp xử lý, khi đã vượt hạn xử lý trên hệ thống IOC.',
            process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Hệ thống tự động quét trạng thái, hạn xử lý của nhiệm vụ/văn bản/chỉ tiêu từ các nguồn kết nối IOC.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'So sánh hạn xử lý với thời điểm hiện tại để xác định các hồ sơ đã quá hạn, xác minh nguyên nhân và đơn vị phụ trách.' }, { step: 'Cảnh báo', desc: 'Gửi cảnh báo tới đơn vị chủ trì và lãnh đạo phụ trách ngay khi phát hiện quá hạn.' }, { step: 'Đề xuất phương án xử lý', desc: 'Yêu cầu đơn vị chủ trì báo cáo tiến độ, đề xuất mốc hoàn thành mới và giao nhiệm vụ nhánh cụ thể.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Theo dõi đến khi có đủ minh chứng xử lý, cập nhật trạng thái và tổng hợp báo cáo lãnh đạo.' }],
            expectedResults: ['Rút ngắn thời gian phát hiện và xử lý hồ sơ quá hạn', 'Xác định rõ trách nhiệm đơn vị chủ trì', 'Giảm tồn đọng nhiệm vụ/văn bản quá hạn theo thời gian'],
            leadUnit: 'Văn phòng UBND phường', coordUnits: ['Văn phòng Đảng ủy', 'Công chức Văn phòng - Thống kê', 'Trực IOC/CAD'],
            sla: ['15 phút xác nhận', 'Trong ngày có phương án', '24h báo cáo kết quả'], tasks: [['Xác minh nguyên nhân quá hạn', 'Rà soát hồ sơ, xác định nút nghẽn, người phụ trách và thời điểm bắt đầu quá hạn.', 'Văn phòng UBND'], ['Yêu cầu đơn vị chủ trì cập nhật tiến độ', 'Gửi nhắc việc, yêu cầu nêu rõ kết quả đã làm, khó khăn và thời hạn hoàn thành mới.', 'Công chức Văn phòng - Thống kê'], ['Báo cáo lãnh đạo phụ trách', 'Tổng hợp tình trạng quá hạn và đề xuất chỉ đạo/đôn đốc.', 'Văn phòng Đảng ủy'], ['Cập nhật minh chứng xử lý', 'Đính kèm văn bản, file dữ liệu, ảnh hiện trường hoặc biên bản làm việc.', 'Đơn vị chuyên môn'], ['Đóng vòng xử lý sau khi có kết quả', 'Kiểm tra đủ minh chứng, cập nhật trạng thái và ghi nhật ký kết thúc.', 'Trực IOC/CAD']]
        },
        slow: {
            title: 'Kịch bản chậm tiến độ / nguy cơ trễ hạn', level: 'Cao', desc: 'Dùng khi nhiệm vụ chưa quá hạn nhưng tiến độ thấp, thiếu minh chứng hoặc có cảnh báo nguy cơ không hoàn thành.',
            objective: 'Phát hiện sớm các nhiệm vụ có tiến độ thấp hoặc nguy cơ không hoàn thành đúng hạn để can thiệp trước khi phát sinh quá hạn.',
            scope: 'Áp dụng cho nhiệm vụ, chỉ tiêu chưa quá hạn nhưng có tiến độ dưới ngưỡng an toàn hoặc thiếu minh chứng cập nhật trong khoảng thời gian quy định.',
            process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Đồng bộ tiến độ và thời hạn còn lại của từng nhiệm vụ/chỉ tiêu theo thời gian thực.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'So sánh tiến độ thực tế với tiến độ kỳ vọng theo mốc thời gian để xác định nguy cơ trễ hạn.' }, { step: 'Cảnh báo', desc: 'Cảnh báo sớm cho đơn vị chủ trì và cán bộ tổng hợp IOC khi tiến độ dưới ngưỡng an toàn.' }, { step: 'Đề xuất phương án xử lý', desc: 'Chia nhỏ phần việc còn lại, bổ sung đơn vị phối hợp hoặc điều chỉnh nguồn lực xử lý.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Thiết lập mốc nhắc tự động, theo dõi đến khi tiến độ trở lại an toàn hoặc hoàn thành đúng hạn.' }],
            expectedResults: ['Giảm số nhiệm vụ chuyển từ nguy cơ sang quá hạn thực tế', 'Tăng tỷ lệ hoàn thành đúng hạn cam kết', 'Phát hiện sớm vướng mắc để bổ sung nguồn lực kịp thời'],
            leadUnit: 'Đơn vị chủ trì nhiệm vụ', coordUnits: ['Cán bộ tổng hợp IOC', 'Lãnh đạo phụ trách', 'Trực IOC/CAD'],
            sla: ['30 phút nhắc việc', '4h cập nhật tiến độ', 'Trước hạn có kết quả'], tasks: [['Đánh giá lại tiến độ thực tế', 'Đối chiếu phần việc đã hoàn thành với thời hạn và sản phẩm đầu ra.', 'Đơn vị chủ trì'], ['Chia nhỏ phần việc còn lại', 'Tách thành các nhiệm vụ nhánh rõ tên việc, chủ trì, hạn xử lý và minh chứng.', 'Cán bộ tổng hợp IOC'], ['Bổ sung đơn vị phối hợp', 'Giao thêm đơn vị hỗ trợ nếu vướng dữ liệu, nhân lực hoặc xác nhận chuyên môn.', 'Lãnh đạo phụ trách'], ['Thiết lập mốc nhắc tự động', 'Đặt notify sắp hạn và cập nhật tiến độ theo từng mốc.', 'Trực IOC/CAD'], ['Cập nhật phương án xử lý thay thế', 'Đề xuất phương án nếu không hoàn thành đúng hạn.', 'Đơn vị chuyên môn']]
        },
        data: {
            title: 'Kịch bản thiếu dữ liệu / dữ liệu chưa xác nhận', level: 'Trung bình', desc: 'Dùng khi chỉ tiêu chưa đủ nguồn, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đảm bảo đúng-đủ-sạch-sống.',
            objective: 'Đảm bảo dữ liệu phục vụ điều hành đúng - đủ - sạch - sống trước khi hiển thị chính thức trên dashboard IOC.',
            scope: 'Áp dụng cho các chỉ tiêu, hồ sơ có nguồn dữ liệu chưa đầy đủ, chưa đúng biểu mẫu, thiếu xác nhận hoặc chưa đối chiếu giữa các nguồn.',
            process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tổng hợp dữ liệu từ các nguồn được kết nối, xác định định dạng và tần suất cập nhật.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Đối chiếu dữ liệu giữa các nguồn, phát hiện sai lệch, thiếu trường hoặc chưa đúng biểu mẫu.' }, { step: 'Cảnh báo', desc: 'Cảnh báo đơn vị cung cấp số liệu về phần dữ liệu chưa đạt yêu cầu đúng-đủ-sạch-sống.' }, { step: 'Đề xuất phương án xử lý', desc: 'Yêu cầu chuẩn hóa biểu mẫu, bổ sung minh chứng và xác nhận số liệu cuối cùng.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Theo dõi đến khi dữ liệu được xác nhận, ghi nhận khó khăn vướng mắc còn tồn tại.' }],
            expectedResults: ['Dữ liệu hiển thị trên IOC đảm bảo đúng-đủ-sạch-sống', 'Giảm sai lệch số liệu giữa các nguồn báo cáo', 'Rõ trách nhiệm xác nhận số liệu cuối cùng'],
            leadUnit: 'Cán bộ tổng hợp IOC', coordUnits: ['Đơn vị cung cấp số liệu', 'Lãnh đạo đơn vị chuyên môn'],
            sla: ['Trong ngày rà soát', '24h bổ sung dữ liệu', '48h xác nhận'], tasks: [['Kiểm tra nguồn dữ liệu hiện có', 'Xác định dữ liệu đến từ API, Excel, CSDL, PDF hoặc file cứng.', 'Cán bộ dữ liệu'], ['Chuẩn hóa biểu mẫu theo phụ lục khảo sát', 'Đối chiếu trường dữ liệu, tần suất, đơn vị cung cấp và người xác nhận cuối cùng.', 'Cán bộ tổng hợp IOC'], ['Yêu cầu bổ sung minh chứng', 'Bổ sung file Excel/PDF/ảnh chụp màn hình hoặc trích xuất hệ thống.', 'Đơn vị cung cấp số liệu'], ['Xác nhận số liệu cuối cùng', 'Lãnh đạo/đơn vị được phân công xác nhận số liệu trước khi hiển thị chính thức.', 'Lãnh đạo đơn vị'], ['Ghi nhận khó khăn, vướng mắc', 'Ghi rõ khó khăn tổng hợp, chia sẻ dữ liệu hoặc hệ thống phần mềm.', 'Cán bộ phụ trách']]
        },
        coordinate: {
            title: 'Kịch bản phối hợp liên đơn vị', level: 'Cao', desc: 'Dùng khi nhiệm vụ cần nhiều đơn vị phối hợp, có liên quan địa bàn, lĩnh vực hoặc phát sinh phản ánh công dân.',
            objective: 'Đảm bảo các nhiệm vụ cần nhiều đơn vị phối hợp được phân công rõ vai trò, xử lý đồng bộ và đúng tiến độ.',
            scope: 'Áp dụng cho nhiệm vụ liên quan nhiều lĩnh vực/địa bàn, hoặc phát sinh từ phản ánh của công dân, doanh nghiệp cần phối hợp nhiều đơn vị xử lý.',
            process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tiếp nhận nhiệm vụ/phản ánh và xác định các lĩnh vực, đơn vị có liên quan.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Xác định đơn vị chủ trì, đơn vị phối hợp và phạm vi dữ liệu mỗi đơn vị được xem.' }, { step: 'Cảnh báo', desc: 'Thông báo phân công tới các đơn vị liên quan kèm thời hạn và yêu cầu phối hợp.' }, { step: 'Đề xuất phương án xử lý', desc: 'Tổ chức trao đổi nhanh, giao nhiệm vụ nhánh theo từng đơn vị với minh chứng cụ thể.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Tổng hợp tiến độ từng đơn vị, nhắc việc đơn vị chậm và báo cáo kết quả chung.' }],
            expectedResults: ['Rút ngắn thời gian phối hợp liên đơn vị', 'Rõ vai trò chủ trì - phối hợp trong từng nhiệm vụ', 'Tổng hợp kết quả xử lý đầy đủ, kịp thời'],
            leadUnit: 'Văn phòng UBND phường', coordUnits: ['Các đơn vị chuyên môn liên quan', 'Trực IOC/CAD', 'Lãnh đạo phụ trách'],
            sla: ['1h phân công', 'Trong ngày làm việc', 'Theo mốc giao việc'], tasks: [['Xác định đơn vị chủ trì và phối hợp', 'Làm rõ vai trò chủ trì, phối hợp, thời hạn và phạm vi dữ liệu được xem.', 'Văn phòng UBND phường'], ['Tổ chức trao đổi nhanh', 'Mở kênh trao đổi hoặc cuộc họp ngắn để thống nhất phương án xử lý.', 'Lãnh đạo phụ trách'], ['Giao nhiệm vụ nhánh theo từng đơn vị', 'Tạo việc con cho từng đơn vị, gắn hạn xử lý và minh chứng cụ thể.', 'Trực IOC/CAD'], ['Theo dõi tiến độ từng đơn vị', 'Tổng hợp tiến độ, nhắc việc đơn vị chậm và cảnh báo nguy cơ.', 'Cán bộ tổng hợp IOC'], ['Tổng hợp kết quả chung', 'Gộp kết quả xử lý, đối chiếu minh chứng và trình lãnh đạo.', 'Văn phòng']]
        },
        citizen: {
            title: 'Kịch bản xử lý kiến nghị cử tri', level: 'Cao', desc: 'Dùng cho nhóm ý kiến, kiến nghị cử tri hoặc phản ánh liên quan nhiều đơn vị, cần theo dõi trả lời đúng hạn.',
            objective: 'Đảm bảo các ý kiến, kiến nghị cử tri được phân loại, chuyển đúng đơn vị và trả lời đúng hạn theo quy định giám sát.',
            scope: 'Áp dụng cho các kiến nghị, phản ánh của cử tri thuộc thẩm quyền phường Việt Hưng, liên quan nhiều lĩnh vực đời sống dân sinh.',
            process: [{ step: 'Thu thập & đồng bộ dữ liệu', desc: 'Tiếp nhận và tổng hợp toàn bộ kiến nghị cử tri từ các kênh, kỳ họp HĐND.' }, { step: 'Phân tích, đối chiếu, phát hiện bất thường', desc: 'Phân nhóm nội dung kiến nghị theo lĩnh vực và xác định đơn vị chủ trì trả lời.' }, { step: 'Cảnh báo', desc: 'Cảnh báo các kiến nghị sắp/đã quá hạn trả lời theo quy định giám sát của HĐND.' }, { step: 'Đề xuất phương án xử lý', desc: 'Chuyển đơn vị chuyên môn trả lời, giao nhiệm vụ nhánh nêu rõ hạn và mẫu kết quả.' }, { step: 'Theo dõi kết quả & báo cáo', desc: 'Giám sát tiến độ trả lời, tổng hợp báo cáo kết quả xử lý kiến nghị cử tri.' }],
            expectedResults: ['Kiến nghị cử tri được trả lời đúng hạn, đúng thẩm quyền', 'Tăng tính minh bạch trong theo dõi giám sát', 'Giảm kiến nghị tồn đọng qua các kỳ họp'],
            leadUnit: 'Văn phòng HĐND phường', coordUnits: ['Văn phòng UBND', 'Thường trực HĐND', 'Đơn vị chuyên môn liên quan'],
            sla: ['Trong ngày phân loại', '03 ngày có phản hồi bước đầu', 'Theo hạn nghị quyết/giám sát'], tasks: [['Phân nhóm nội dung kiến nghị', 'Tách theo đất đai, đô thị, an sinh, môi trường, hành chính công.', 'Văn phòng HĐND'], ['Chuyển đơn vị chuyên môn trả lời', 'Giao nhiệm vụ nhánh cho đơn vị chủ trì, nêu rõ hạn và mẫu kết quả trả lời.', 'Văn phòng UBND'], ['Giám sát tiến độ trả lời', 'Theo dõi trạng thái đã xử lý/đang xử lý/chưa xử lý theo từng nhóm kiến nghị.', 'Thường trực HĐND'], ['Tổng hợp báo cáo cử tri', 'Lập báo cáo kết quả xử lý, khó khăn và kiến nghị cấp trên nếu vượt thẩm quyền.', 'Cán bộ tổng hợp IOC']]
        }
    };

    let docPickerSelection = new Set();
    let docPickerApiItems = [];
    let currentAccount = null, currentRole = null, activeMetric = 'received', activeIndicatorRole = null, activeCategoryRole = 'ALL', currentDrawerRecords = [], records = [], indicatorRecords = [], drawerPieStatus = '', activeIndicatorPieStatus = '';
    let qlnvApiLoading = false, qlnvApiError = null;
    const QLNV_DEFAULT_ROLE = 'UBND';
    const QLNV_PROFILE_URL = `${urlAPI}/api/employees/profile`;
    // Nguồn "danh sách người trong 1 đơn vị" cho cây chọn đơn vị (port từ assLoadPeople, tongquan.js:3665) —
    // /qlnv/v2/can-bo (bảng dm_user/qlnv_cbcc_danhgia) thay cho /api/employees: employees lọc CHÍNH XÁC
    // theo organizationUnitId nên hay rỗng vì cán bộ thật chỉ gắn ở đơn vị LÁ của cây organization-structure.
    /* Gọi THẲNG be_ioc_dash (đổi 2026-09-10) — cùng nguồn với user-tree, và tránh vòng qua
       be_qlnv `/qlnv/v2/can-bo-ioc` vốn phụ thuộc biến môi trường IOC_DASH_BASE_URL (prod
       chưa đặt -> ECONNREFUSED 127.0.0.1:3000, ô chọn cán bộ rỗng). Đi bằng cookie session
       của cổng IOC nên phải có credentials:'include'. */
    const QLNV_CANBO_URL = `${resolveApiBase()}/api-nest/qlnv-directory/users`;
    // Trường payload dùng để GIAO CHO ĐÚNG NGƯỜI (chọn người trong đơn vị ở cây "đơn vị chủ trì"/
    // "đơn vị nhận nhiệm vụ") — port từ block_nv/nv.js. BE CHƯA chốt tên trường "người nhận" -> tạm
    // dùng lanhDaoChiDaoId (trường người-id sẵn có trong payload).
    var QLNV_RECEIVER_FIELD = (typeof window !== 'undefined' && window.QLNV_RECEIVER_FIELD) || 'lanhDaoChiDaoId';
    // Khóa cha cho nhiệm vụ nhánh (loaiNV=NHIEM_VU_CON) gửi lên route v2 — đã kiểm chứng với
    // block "Giao nhiệm vụ" (tongquan.js/assScenarioSubTaskBody): POST xong thì GET
    // /qlnv/v2/sub-task?taskId=<cha> trả đúng nhánh vừa tạo.
    var QLNV_SUBTASK_PARENT_FIELD = (typeof window !== 'undefined' && window.QLNV_SUBTASK_PARENT_FIELD) || 'parentId';

    /* ============================================================
     * TÀI KHOẢN ĐANG ĐĂNG NHẬP — id nhân sự thật, dùng làm mặc định lanhDaoChiDaoId.
     * '507' cũ không tra ra nhân sự nào -> BE populate null -> GET /qlnv/:id trả 500
     * và bản ghi KHÔNG mirror sang BKAV (xem block_nv/nv.js). Port lại logic đó ở đây.
     * ============================================================ */
    let __qlnvMe = null, __qlnvMeP = null;
    function qlnvCurrentUserId() {
        try {
            var parts = String(readQlnvToken() || '').split('.');
            if (parts.length < 2) return '';
            var b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (b.length % 4) b += '=';
            var p = JSON.parse(atob(b));
            return String((p && (p.user || p.userId || p.sub)) || '');
        } catch (e) { return ''; }
    }
    function adaptQlnvEmployee(e) {
        e = e && typeof e === 'object' ? e : {};
        var name = e.fullName || e.name || e.hoTen || e.tenNhanVien || e.displayName ||
            ((e.firstName || '') + ' ' + (e.lastName || '')).trim() || '';
        var position = qlnvCodeVal(e.position || e.chucVu || e.chucDanh || e.title || e.viTri || e.role || '');
        // organizationUnit của nhân viên (Employee._id, khác iddv/canboId của /qlnv/v2/can-bo) — dùng làm
        // "đơn vị hiện tại" cho donViGiao/donViTao khi tạo nhiệm vụ (xem qlnvCurrentUnitId), vì qlnv_v2.js
        // không có idDashBoard/__assOrg như file.js (khối cấp phường/xã) để suy ra đơn vị theo URL.
        var ou = e.organizationUnit && typeof e.organizationUnit === 'object' ? e.organizationUnit : null;
        var unitId = String((ou && (ou.organizationUnitId || ou._id || ou.id)) || e.organizationUnitId || '');
        var unitLabel = (ou && ou.name) || '';
        // `account` = tài khoản đăng nhập (Employee.username) — giống assAdaptEmployee bên
        // tongquan.js. Dùng cho deeplink Bkav và để tra hoTen có dấu bên can-bo.
        var account = String(e.username || e.account || '');
        return { id: String(e._id || e.id || e.employeeId || e.userId || ''), name: name, account: account, position: position, unitId: unitId, unitLabel: unitLabel, __emp: e };
    }
    /* HỒ SƠ NGƯỜI ĐANG ĐĂNG NHẬP — GET /api/employees/profile, giống assLoadMe() bên
       tongquan.js (block "Giao nhiệm vụ").
       Thay cho GET /api/employees?filter[_id]=... trước đây: route danh sách đó tra Employee
       bên Mongo bằng `req.user.user`, mà với token LifeSSO giá trị đó là `ab_user.id` (số) chứ
       không phải ObjectId -> CastError -> 500, hồ sơ luôn rỗng. `/profile` không còn phụ thuộc
       Mongo (dựng từ token + portal), nên đây mới là nguồn chạy được. */
    async function loadQlnvProfile() {
        var token = '';
        try { token = await getQlnvToken(); } catch (e) { token = ''; }
        var headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
        if (token) headers.Authorization = 'Bearer ' + token;
        return fetch(QLNV_PROFILE_URL, { headers: headers })
            .then(function (r) { if (!r.ok) throw new Error('EMP HTTP ' + r.status); return r.json(); })
            .then(function (res) {
                // `/profile` trả object TRẦN; vẫn dò lớp bọc phòng BE đổi shape.
                var e = (res && res._id) ? res : ((res && (res.data || res.employee)) || null);
                return e ? adaptQlnvEmployee(e) : null;
            })
            .catch(function (err) { console.warn('[EMP] Load profile failed:', err); return null; });
    }
    // Chuẩn hoá 1 dòng cán bộ từ /qlnv/v2/can-bo (nguồn dm_user) về đúng shape {id,name,position} mà
    // assUnitPeopleRowsHtml/subNvUnitPeopleRowsHtml/notifyUnitPeopleRowsHtml... đang đọc — giữ NGUYÊN
    // shape cũ của adaptQlnvEmployee để không phải sửa các hàm vẽ cây ở phía dưới.
    function adaptQlnvCanBo(p) {
        p = p && typeof p === 'object' ? p : {};
        var id = (p.canboId != null && p.canboId !== '') ? String(p.canboId) : String(p.account || '');
        var name = p.hoTen || p.account || id;
        var position = p.chucDanh || p.chucVu || '';
        return { id: id, name: name, position: position };
    }
    /* Danh sách NGƯỜI của 1 đơn vị — dùng để mở rộng nhánh cuối trong cây "đơn vị chủ trì"/"đơn vị/người
       phối hợp" xuống tới cấp người. Port từ assLoadPeople (tongquan.js:3665-3691): đổi từ /api/employees
       (lọc CHÍNH XÁC organizationUnitId, hay trả rỗng vì cán bộ thật chỉ gắn ở đơn vị LÁ) sang
       /qlnv/v2/can-bo. BẮT BUỘC includeChildren=true — thiếu cờ này BE trả rỗng dù đơn vị có cán bộ
       (đã kiểm chứng bên tongquan.js: iddv=490 không cờ trả 0, kèm cờ trả 3358 cán bộ). */
    async function loadQlnvEmployeeOptions(orgUnitId) {
        if (!orgUnitId) return [];
        var token = '';
        try { token = await getQlnvToken(); } catch (e) { token = ''; }
        var headers = { Accept: 'application/json' };
        if (token) headers.Authorization = 'Bearer ' + token;
        var url = QLNV_CANBO_URL + '?iddv=' + encodeURIComponent(orgUnitId) + '&includeChildren=true&limit=200';
        return fetch(url, { credentials: 'include', headers: headers })
            .then(function (r) { if (!r.ok) throw new Error('CAN BO HTTP ' + r.status); return r.json(); })
            .then(function (res) {
                var raw = extractCrmStatusList(res);
                if (!raw.length && Array.isArray(res)) raw = res;
                return raw.map(function (p) { return adaptQlnvCanBo(p); }).filter(function (x) { return x && x.id; });
            })
            .catch(function (err) { console.warn('[CAN BO] Load failed:', err); return []; });
    }
    /* __qlnvUnitPeople: cache người theo id đơn vị ("loading" | mảng {id,name,position}) — DÙNG CHUNG
       giữa cây "đơn vị chủ trì" của cả 2 modal (Nhập notify + Giao nhiệm vụ nhánh) vì cùng 1 đơn vị
       thì danh sách người như nhau, khỏi gọi API 2 lần.
       __qlnvPickedPerson: người đang chọn cho 1 ô ({selectId,id,name,unitId,unitLabel}) — selectId phân
       biệt ô nào đang giữ lựa chọn người ('notifyUnit' | 'subNvUnit'), giống cơ chế bên block_nv/nv.js. */
    var __qlnvUnitPeople = {};
    var __qlnvPickedPerson = null;
    function qlnvLoadUnitPeople(unitId) {
        if (!unitId) return Promise.resolve([]);
        if (Array.isArray(__qlnvUnitPeople[unitId])) return Promise.resolve(__qlnvUnitPeople[unitId]);
        if (__qlnvUnitPeople[unitId] === 'loading') return null;
        __qlnvUnitPeople[unitId] = 'loading';
        return loadQlnvEmployeeOptions(unitId).then(function (list) {
            __qlnvUnitPeople[unitId] = Array.isArray(list) ? list : [];
            return __qlnvUnitPeople[unitId];
        }, function () {
            __qlnvUnitPeople[unitId] = [];
            return [];
        });
    }
    function loadQlnvMe() {
        if (__qlnvMe) return Promise.resolve(__qlnvMe);
        if (__qlnvMeP) return __qlnvMeP;
        // Nạp kèm phạm vi tài khoản: qlnvCurrentUnitId cần iddv, thiếu là lùi nhầm về unitId Employee.
        __qlnvMeP = getQlnvToken().then(qlnvLoadMyScope).then(function () {
            var uid = qlnvCurrentUserId();
            return loadQlnvProfile().then(function (emp) {
                // Không suy được id -> rơi về JWT, giống assCurrentUserId() bên tongquan.js.
                return { id: String((emp && emp.id) || uid || ''), name: (emp && emp.name) || '', account: (emp && emp.account) || '', unitId: (emp && emp.unitId) || '', unitLabel: (emp && emp.unitLabel) || '' };
            });
        }).then(function (me) {
            __qlnvMe = me || { id: '', name: '', account: '' };
            __qlnvMeP = null;
            try { window.__qlnvMe = __qlnvMe; } catch (e) { }
            return __qlnvMe;
        }, function () {
            __qlnvMe = { id: '', name: '', account: '', unitId: '', unitLabel: '' };
            __qlnvMeP = null;
            return __qlnvMe;
        });
        return __qlnvMeP;
    }
    /* Người chỉ đạo mặc định = chính mình: _id từ /employees/profile, JWT là dự phòng khi chưa nạp
       xong hồ sơ — cùng thứ tự với assCurrentUserId() bên tongquan.js. Bỏ hằng '507': id đó không
       tra ra nhân sự nào nên BE populate null, GET /qlnv/:id trả 500 và bản ghi không mirror sang
       BKAV (xem ghi chú đầu khối). Không suy được -> rỗng để nơi gọi CHẶN phát hành. */
    function qlnvDefaultLeaderId() {
        return (__qlnvMe && __qlnvMe.id) || qlnvCurrentUserId() || '';
    }
    /* Đơn vị đang đăng nhập — iddv từ /qlnv/v2/pham-vi, dùng cho donViGiao/donViTao khi tạo nhiệm vụ
       theo route v2 (xem buildQlnvCreateBodyV2). Cây cơ cấu tổ chức cũng dùng chính id này. */
    var __qlnvScopeInfo = null, __qlnvScopeP = null;
    function qlnvLoadMyScope() {
        if (__qlnvScopeInfo) return Promise.resolve(__qlnvScopeInfo);
        if (__qlnvScopeP) return __qlnvScopeP;
        __qlnvScopeP = qlnvAuthHeaders().then(function (headers) {
            return fetch(urlAPI + '/api/qlnv/v2/pham-vi', { headers: headers });
        }).then(function (r) {
            if (!r.ok) throw new Error('PHAM VI HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            /* Giữ luôn cờ `filter.viewAllUnits` — BE bật cho tài khoản trong
               LEADER_WHITELIST (be_qlnv/leaderWhitelist.js); qlnvOrgScopeRoot dùng nó. */
            __qlnvScopeInfo = (res && res.canBo) || {}; __qlnvScopeP = null;
            if (res && res.filter && res.filter.viewAllUnits) __qlnvScopeInfo.viewAllUnits = true;
            try { window.__qlnvScopeInfo = __qlnvScopeInfo; } catch (e) { }
            return __qlnvScopeInfo;
        }, function (err) {
            console.warn('[PHAM VI] Load failed:', err);
            __qlnvScopeInfo = {}; __qlnvScopeP = null;
            return __qlnvScopeInfo;
        });
        return __qlnvScopeP;
    }
    /* TÀI KHOẢN BKAV của người đang đăng nhập — dùng cho deeplink /api/deeplink/task.
       Nguồn đúng là `username` của hồ sơ /api/employees/profile. KHÔNG dùng
       __qlnvScopeInfo.account (/qlnv/v2/pham-vi): pham-vi phụ thuộc bảng dm_user, tài khoản
       chưa được gán đơn vị thì API trả lỗi -> account rỗng -> deeplink rơi về dashboard Bkav.
       Lỗi -> '' để nơi gọi lùi về trang danh sách, không kẹt luồng. */
    var __bkavAccountP = null;
    function qlnvBkavAccount() {
        if (!__bkavAccountP) {
            // Dùng CHUNG hồ sơ đã nạp ở loadQlnvMe() thay vì gọi /employees/profile lần hai:
            // cùng một nguồn, cùng một lần gọi (loadQlnvMe đã gộp lời gọi trùng).
            __bkavAccountP = loadQlnvMe().then(function (me) {
                return String((me && me.account) || '').trim();
            }, function (err) {
                console.warn('[Bkav deeplink] không lấy được tài khoản:', err);
                return '';
            });
        }
        return __bkavAccountP;
    }
    function qlnvCurrentUnitId() {
        /* CHỈ iddv từ /pham-vi. Bỏ đường lùi về __qlnvMe.unitId: đó là ObjectId organizationUnit của
           Employee, khác hệ với iddv SỐ mà donViGiao/donViTao đòi — gửi nhầm thì BE đóng dấu đơn vị
           giao sai, đi nhánh xã/phường và bỏ đồng bộ BMM. Không suy được -> null để nơi gọi CHẶN
           phát hành, giống assCurrentUnitId() bên tongquan.js. */
        return __qlnvScopeInfo && __qlnvScopeInfo.iddv != null ? __qlnvScopeInfo.iddv : null;
    }
    /* Nhãn đơn vị phải cùng nguồn với qlnvCurrentUnitId (dm_user qua /pham-vi): organizationUnit
       của Employee là đơn vị hồ sơ nhân sự, lệch với phạm vi thật của tài khoản. */
    function qlnvCurrentUnitLabel() {
        return (__qlnvScopeInfo && __qlnvScopeInfo.donvi) || (__qlnvMe && __qlnvMe.unitLabel) || '';
    }

    function isQlnvConfigured() {
        return typeof QlnvApiNotify !== 'undefined' && !!window.QLNV_API_BASE;
    }
    function parseQlnvDate(val) {
        if (!val) return null;
        if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
        var s = String(val).trim();
        var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    function formatQlnvDate(val) {
        var d = parseQlnvDate(val);
        return d ? d.toLocaleDateString('vi-VN') : '—';
    }
    /* ============================================================
     * TASK BLOCK · TẦNG BUSINESS RULES (nguồn duy nhất, không lặp)
     * Nguồn API THẬT = BKAV shape (đối chiếu response.json):
     *   task_id,title,status,state,sort_status,progress,priority,
     *   is_recurring,period_type,expire_date,date_line,complete_date,
     *   created_date,started_date,department("490.695..."),departmentName,
     *   organization,parent_id,total_child_task,total_child_task_ids,detail,doc_code
     * ============================================================ */

    /* ⚠️ GIẢ ĐỊNH cần user xác nhận: bảng enum mã trạng thái server (sort_status/state/status).
       Mặc định RỖNG -> KHÔNG bịa nghĩa mã; chỉ dùng field chắc chắn (complete_date/progress/
       expire_date/is_recurring). User điền qua window.QLNV_STATUS_CODE_MAP khi có bảng mã. */
    var QLNV_STATUS_CODE_MAP = (typeof window !== 'undefined' && window.QLNV_STATUS_CODE_MAP) || { sort_status: {}, state: {}, status: {} };
    function statusCodeIs(field, value, key) {
        var m = QLNV_STATUS_CODE_MAP[field]; var arr = m && m[key];
        return !!arr && arr.map(Number).indexOf(Number(value)) >= 0;
    }
    var QLNV_SOON_DAYS = (typeof window !== 'undefined' && Number(window.QLNV_SOON_DAYS)) || 3;
    var QLNV_RISK_DAYS = (typeof window !== 'undefined' && Number(window.QLNV_RISK_DAYS)) || 7;

    /* Map 1 item API -> 1 trong 6 trạng thái. Ưu tiên done->overdue->risk->soon->regular->doing.
       Ưu tiên field chính thức; ngày/tiến độ chỉ bổ sung; risk KHÔNG chỉ theo số ngày còn lại. */
    function resolveDashboardStatus(item) {
        if (!item || typeof item !== 'object') return 'doing';
        if (item.__status) return item.__status;
        // 1) Hoàn thành
        if (item.complete_date || item.ngayHoanThanh) return 'done';
        if (item.progress != null && Number(item.progress) >= 100) return 'done';
        if (statusCodeIs('sort_status', item.sort_status, 'done') || statusCodeIs('state', item.state, 'done') || statusCodeIs('status', item.status, 'done')) return 'done';
        var due = parseQlnvDate(item.expire_date || item.date_line || item.ngayHetHan);
        var now = new Date(); now.setHours(0, 0, 0, 0);
        var diffDays = due ? Math.floor((due - now) / 86400000) : null;
        // 2) Quá hạn
        if ((diffDays != null && diffDays < 0) || statusCodeIs('sort_status', item.sort_status, 'overdue')) return 'overdue';
        // 3) Nguy cơ: cờ server risk, HOẶC gần hạn + tiến độ thấp (không chỉ dựa số ngày)
        if (statusCodeIs('sort_status', item.sort_status, 'risk')) return 'risk';
        if (diffDays != null && diffDays <= QLNV_RISK_DAYS && Number(item.progress || 0) < 50) return 'risk';
        // 4) Sắp đến hạn (cảnh báo theo ngày)
        if ((diffDays != null && diffDays <= QLNV_SOON_DAYS) || statusCodeIs('sort_status', item.sort_status, 'soon')) return 'soon';
        // 5) Thường xuyên, liên tục (từ is_recurring/period_type — KHÔNG để luôn 0)
        if (Number(item.is_recurring) === 1 || item.is_recurring === true || (item.period_type != null && item.period_type !== '')) return 'regular';
        // 6) Đang thực hiện chưa đến hạn
        return 'doing';
    }
    function inferQlnvStatus(item) { return resolveDashboardStatus(item); }

    /* Map 1 item API -> 1 trong 4 trục DANG/HDND/UBND/MTTQ. Ưu tiên mã đơn vị (department dotted),
       chỉ so keyword tên khi không có mã. KHÔNG mặc định UBND (trả null nếu không xác định được). */
    // ⚠️ GIẢ ĐỊNH: prefix root mã `department` -> trục. Seed 490=DANG (mẫu "490...VPTU"=Văn phòng Thành ủy).
    // User bổ sung/override qua window.QLNV_DEPT_AXIS_PREFIX = { '490':'DANG', ... }.
    var QLNV_DEPT_AXIS_PREFIX = Object.assign({ '490': 'DANG' }, (typeof window !== 'undefined' && window.QLNV_DEPT_AXIS_PREFIX) || {});
    var AXIS_NAME_KEYWORDS = [
        { re: /th[àa]nh[\s.]*[uủ]y|vptu|v[ăa]n\s*ph[òo]ng\s*th[àa]nh/i, axis: 'DANG' },
        { re: /h[đd]nd|h[ộo]i\s*đ[ồo]ng\s*nh[âa]n\s*d[âa]n/i, axis: 'HDND' },
        { re: /mttq|m[ặa]t\s*tr[ậa]n/i, axis: 'MTTQ' },
        { re: /ubnd|[uủ]y\s*ban\s*nh[âa]n\s*d[âa]n/i, axis: 'UBND' }
    ];
    function resolveOrganizationAxis(item) {
        if (!item || typeof item !== 'object') return null;
        if (item.__role && typeof segmentTemplate !== 'undefined' && segmentTemplate[item.__role]) return item.__role;
        // 1) mã department/organization dạng cây "490.695..." -> prefix root
        var codes = [item.department, item.organization].filter(function (c) { return c != null && c !== ''; });
        for (var c = 0; c < codes.length; c++) {
            var s = String(codes[c]); var root = s.split('.')[0];
            if (QLNV_DEPT_AXIS_PREFIX[s]) return QLNV_DEPT_AXIS_PREFIX[s];
            if (QLNV_DEPT_AXIS_PREFIX[root]) return QLNV_DEPT_AXIS_PREFIX[root];
        }
        // 2) fallback keyword theo tên đơn vị
        var name = String(item.departmentName || item.organizationName || item.donViChuTriName || '');
        for (var i = 0; i < AXIS_NAME_KEYWORDS.length; i++) { if (AXIS_NAME_KEYWORDS[i].re.test(name)) return AXIS_NAME_KEYWORDS[i].axis; }
        return null; // KHÔNG mặc định UBND
    }
    function inferQlnvRole(item) { return resolveOrganizationAxis(item) || QLNV_DEFAULT_ROLE; }

    function inferQlnvMetric(nv) { return nv.__metric || 'received'; }
    /* tienDo Mongo có thể là "x/y" (DSNH DangTrienKhai) hoặc số; suy % THẬT.
       Trả null nếu API không cung cấp -> UI hiển thị trạng thái thay vì % bịa. */
    function qlnvTienDoPercent(td) {
        if (td != null && typeof td === 'string' && td.indexOf('/') >= 0) {
            var p = td.split('/'); var a = Number(p[0]), b = Number(p[1]);
            if (b > 0) return Math.max(0, Math.min(100, Math.round(a / b * 100)));
        }
        if (td != null && td !== '' && !isNaN(Number(td))) return Number(td);
        return null;
    }
    function qlnvUnitName(nv) {
        var u = nv.donViChuTri;
        if (typeof u === 'string' && u) return u;
        if (Array.isArray(u) && u[0]) return u[0].title || u[0].name || '—';
        return nv.donViChuTriName || '—';
    }
    function qlnvCodeVal(v) { return (v && typeof v === 'object') ? (v.title || v.value || '') : (v || ''); }
    /* ============================================================
     * TASK BLOCK · TẦNG ADAPTER — item API (BKAV shape) -> record dashboard.
     * Validate null/undefined/khác cấu trúc. KHÔNG escape ở đây (escape tại render).
     * ============================================================ */
    function adaptQlnvToRecord(item, idx) {
        item = (item && typeof item === 'object') ? item : {};
        var rawId = item.task_id != null ? item.task_id : (item.id != null ? item.id : (item._id || ('idx' + idx)));
        var metric = inferQlnvMetric(item);
        var status = resolveDashboardStatus(item);
        var axis = resolveOrganizationAxis(item);            // null nếu không xác định trục
        var role = (axis && segmentTemplate[axis]) ? axis : QLNV_DEFAULT_ROLE; // render-safe; đếm dùng __axisResolved
        var due = formatQlnvDate(item.expire_date || item.date_line || item.ngayHetHan);
        var created = formatQlnvDate(item.created_date || item.started_date || item.ngayChiDao);
        var start = formatQlnvDate(item.started_date || item.ngayChiDao || item.created_date);
        var progress = (item.progress != null && item.progress !== '' && !isNaN(Number(item.progress))) ? Number(item.progress) : null;
        var urgency = (typeof QlnvApiNotify !== 'undefined' && QlnvApiNotify.mapPriorityToDoKhan) ? QlnvApiNotify.mapPriorityToDoKhan(item.priority) : 'Thường';
        var unit = item.departmentName || item.organizationName || item.donViChuTriName || '—';
        var childIds = Array.isArray(item.total_child_task_ids) ? item.total_child_task_ids : [];
        var recurring = (Number(item.is_recurring) === 1 || item.is_recurring === true || (item.period_type != null && item.period_type !== ''));
        return {
            id: 'QLNV-' + rawId,
            __qlnvId: String(rawId),
            __qlnv: true,
            __axisResolved: axis,                               // null = chưa phân trục (không dồn UBND khi đếm)
            code: item.doc_code || ('QLNV/' + rawId),
            role: role, metric: metric, status: status,
            title: item.title || item.tenNhiemVu || item.noiDung || ('Nhiệm vụ #' + rawId),
            field: recurring ? 'Thường xuyên' : 'Nhiệm vụ',
            unit: unit,
            creator: item.creatorName || item.createdByName || item.createdBy || item.userName || '—',
            receiver: unit,
            coordinators: [],
            importance: /khẩn|hỏa|thượng/i.test(urgency) ? 'Cao' : 'Bình thường',
            urgency: urgency, priority: urgency,
            startDate: start, due: due, created: created,
            progress: progress == null ? 0 : progress,
            __hasProgress: progress != null,
            isRecurring: recurring,
            description: item.detail || item.description || item.noiDung || '',
            docType: (item.loaiVanBan && (item.loaiVanBan.title || item.loaiVanBan.value)) || item.docType || (item.doc_code ? 'Văn bản' : ''),
            linkedDocIds: [],
            evidence: [],
            history: [{ time: (created && created !== '—') ? created : new Date().toLocaleString('vi-VN'), text: 'Đồng bộ từ QLNV' }],
            subtasks: [],
            __parentId: item.parent_id || null,
            __childCount: Number(item.total_child_task) || 0,
            __childIds: childIds,
            __bmmTaskId: item.bmmTaskId || null,
            __qlnvRaw: item,
        };
    }
    function enrichRecordFromQlnv(r, nv) {
        var adapted = adaptQlnvToRecord(Object.assign({}, r.__qlnvRaw || {}, nv), 0);
        adapted.id = r.id;
        adapted.__qlnvId = r.__qlnvId;
        adapted.metric = r.metric;
        adapted.role = r.role;
        if (r.linkedDocIds) adapted.linkedDocIds = r.linkedDocIds;
        var idx = records.findIndex(function (x) { return x.id === r.id; });
        if (idx >= 0) records[idx] = adapted;
        return adapted;
    }
    var qlnvUnresolvedAxis = {};   // {metric: số item API chưa xác định được trục (tạm xếp theo role fallback)}
    function rebuildSegmentFromTaskRecords() {
        // Các metric do QLNV làm chủ (có endpoint) -> zero rồi đếm lại từ record API.
        var qlnvMetrics = Object.keys(QLNV_METRIC_ENDPOINT);
        qlnvUnresolvedAxis = {};
        Object.keys(segmentTemplate).forEach(function (role) {
            qlnvMetrics.forEach(function (metric) {
                if (segmentTemplate[role] && segmentTemplate[role][metric]) {
                    statusDefs.forEach(function (st) { segmentTemplate[role][metric][st.key] = 0; });
                }
            });
        });
        // Đã cấu hình QLNV -> CHỈ đếm bản ghi API (__qlnv) để KPI khớp đúng popup (không lẫn mock sót lại).
        var apiOnly = (typeof isQlnvConfigured === 'function') && isQlnvConfigured();
        records.filter(function (r) { return qlnvMetrics.indexOf(r.metric) >= 0 && (!apiOnly || r.__qlnv); }).forEach(function (r) {
            // Đếm theo r.role (= trục đã map, hoặc fallback UBND khi chưa có mã trục) -> tổng KPI = tổng trục = tổng metric.
            if (segmentTemplate[r.role] && segmentTemplate[r.role][r.metric]) {
                segmentTemplate[r.role][r.metric][r.status] = (segmentTemplate[r.role][r.metric][r.status] || 0) + 1;
            }
            // Đánh dấu item API chưa xác định được trục thật -> để axis dashboard cảnh báo minh bạch.
            if (r.__qlnv && !r.__axisResolved) { qlnvUnresolvedAxis[r.metric] = (qlnvUnresolvedAxis[r.metric] || 0) + 1; }
        });
    }
    function mergeQlnvIntoRecords(items) {
        if (!Array.isArray(items)) items = [];
        records = records.filter(function (r) { return r.metric !== 'assigned' && r.metric !== 'received'; });
        items.forEach(function (nv, i) { records.push(adaptQlnvToRecord(nv, i)); });
        rebuildSegmentFromTaskRecords();
        window.__qlnvList = items;
    }
    /* ============================================================
     * TASK BLOCK · TẦNG API — cấu hình endpoint TẬP TRUNG (1 nguồn duy nhất).
     * metric -> { label (tab), segment }. List = GET /danh-sach-nhiem-vu/{segment}.
     * KHÔNG hard-code URL rải rác — mọi nơi đọc từ đây. Override: window.METRIC_API_CONFIG.
     * ============================================================ */
    var METRIC_API_CONFIG = (typeof window !== 'undefined' && window.METRIC_API_CONFIG) || {
        assigned: { label: 'Nhiệm vụ giao', segment: 'moi' },
        received: { label: 'Nhiệm vụ nhận', segment: 'dang-trien-khai' },
        docIn: { label: 'Văn bản đến', segment: 'van-ban-den' },
        docOut: { label: 'Văn bản đi', segment: 'van-ban-di' }
    };
    // Back-compat: map metric -> segment (loadQlnvMetric/rebuild đọc field này).
    var QLNV_METRIC_ENDPOINT = Object.keys(METRIC_API_CONFIG).reduce(function (o, k) { o[k] = METRIC_API_CONFIG[k].segment; return o; }, {});
    function qlnvMetricHasEndpoint(m) { return !!QLNV_METRIC_ENDPOINT[m]; }
    /* Nút "Thử lại" (error state) -> tải lại metric (force). Global để inline onclick gọi được. */
    function retryQlnvMetric(m) { if (qlnvMetricHasEndpoint(m)) loadQlnvMetric(m, { force: true }); }
    /* Nút "Thử lại" trong drawer popup: force reload metric của popup rồi render lại đúng danh sách. */
    var qlnvDrawerMetric = null, qlnvLastListOpts = null;
    function retryDrawerQlnv() {
        if (!qlnvDrawerMetric) return;
        loadQlnvMetric(qlnvDrawerMetric, { force: true }).then(function () { if (qlnvLastListOpts) openList(qlnvLastListOpts); });
    }

    /* Trạng thái tải LƯỜI theo TỪNG metric: chỉ gọi API metric nào khi người dùng cần nó. */
    var qlnvMetricState = {};
    function qlnvStateOf(metric) { return qlnvMetricState[metric] || (qlnvMetricState[metric] = { loaded: false, loading: false, error: null, _p: null }); }
    /* Đồng bộ cờ của metric ĐANG xem -> cờ toàn cục (renderAxisDashboard + openList popup dùng chung). */
    function syncActiveQlnvFlags() {
        var s = qlnvMetricState[activeMetric];
        qlnvApiLoading = !!(s && s.loading);
        qlnvApiError = s ? s.error : null;
    }
    /* Thay TOÀN BỘ record của 1 metric bằng dữ liệu API (KHÔNG đụng metric khác -> tải lười độc lập). */
    function mergeQlnvMetric(metric, items) {
        if (!Array.isArray(items)) items = [];
        // Nhiệm vụ/văn bản notify (van-ban-den) được đẩy thủ công vào records với cùng metric 'received'
        // nhưng KHÔNG đến từ endpoint đang tải lại ở đây -> phải giữ lại, không cho lọc theo metric xoá mất.
        records = records.filter(function (r) { return r.metric !== metric || r.__notifyTask || r.__notifyDoc; });
        items.forEach(function (nv, i) { records.push(adaptQlnvToRecord(nv, i)); });
        rebuildSegmentFromTaskRecords();
        window.__qlnvList = records.filter(function (r) { return r.__qlnv; });
    }
    /* Xóa record demo của 1 metric (đã cấu hình QLNV nhưng chưa tải xong) -> các hạng mục về 0. */
    function clearQlnvMetric(metric) { mergeQlnvMetric(metric, []); }
    /* Tải LƯỜI 1 metric: boot chỉ gọi received; click tab/hạng mục khác mới gọi API tương ứng. */
    function loadQlnvMetric(metric, opts) {
        opts = opts || {};
        var seg = QLNV_METRIC_ENDPOINT[metric];
        if (!isQlnvConfigured() || !seg) return Promise.resolve(null);
        var s = qlnvStateOf(metric);
        if (s.loading && s._p) return s._p;                 // đang tải -> dùng lại promise, tránh gọi trùng
        if (s.loaded && !opts.force) return Promise.resolve(null);
        s.loading = true; s.error = null;
        syncActiveQlnvFlags();
        if (metric === activeMetric && typeof renderAxisDashboard === 'function') renderAxisDashboard();
        s._p = QlnvApiNotify.listSegment(seg, { limit: 200, sort: '-createdAt' }).then(function (res) {
            var norm = QlnvApiNotify.normalizeListResponse(res);
            var items = norm.items.map(function (it) { return Object.assign({}, it, { __metric: metric }); });
            mergeQlnvMetric(metric, items);
            s.loaded = true; s.loading = false; s.error = null; s._p = null;
            syncActiveQlnvFlags();
            if (metric === activeMetric) {
                if (typeof renderMetricTabs === 'function') renderMetricTabs();
                if (typeof renderAxisDashboard === 'function') renderAxisDashboard();
            }
            if (typeof toast === 'function') toast('Đã tải ' + fmt(items.length) + ' "' + ((metricMeta[metric] || {}).label || metric) + '" từ QLNV.');
            return items;
        }).catch(function (err) {
            s.loading = false; s.error = (err && err.message) || String(err); s._p = null;
            clearQlnvMetric(metric);                          // giữ 0, KHÔNG quay lại demo
            syncActiveQlnvFlags();
            if (metric === activeMetric && typeof renderAxisDashboard === 'function') renderAxisDashboard();
            if (typeof toast === 'function') toast('Tải "' + ((metricMeta[metric] || {}).label || metric) + '" lỗi: ' + s.error);
            return null;
        });
        return s._p;
    }
    /* Đảm bảo metric QLNV đã tải (dùng khi mở popup hạng mục): chưa tải -> gọi API; đã tải -> thôi. */
    function ensureQlnvMetricLoaded(metric, opts) {
        if (!isQlnvConfigured() || !qlnvMetricHasEndpoint(metric)) return Promise.resolve(null);
        return loadQlnvMetric(metric, opts || {});
    }
    /* Wrapper tương thích cũ: tải metric ĐANG xem (mặc định received). Dùng ở boot + sau khi tạo NV. */
    function loadQlnvAndMerge() {
        if (!isQlnvConfigured()) return Promise.resolve();
        var m = qlnvMetricHasEndpoint(activeMetric) ? activeMetric : 'received';
        return loadQlnvMetric(m, { force: true });
    }
    function refreshQlnvApi() {
        if (!isQlnvConfigured()) return Promise.resolve();
        var m = qlnvMetricHasEndpoint(activeMetric) ? activeMetric : 'received';
        return loadQlnvMetric(m, { force: true }).then(function () {
            var s = qlnvStateOf(m);
            if (typeof toast === 'function') {
                if (s.error) toast('QLNV: ' + s.error);
                else toast('Đã làm mới "' + ((metricMeta[m] || {}).label || m) + '".');
            }
        });
    }
    function urgencyToDoKhan(u) {
        var s = String(u || '').toLowerCase();
        if (/khẩn cấp|gấp|hỏa|đặc biệt/.test(s)) return 'Khẩn';
        if (/cao|thượng/.test(s)) return 'Thượng khẩn';
        return 'Thường';
    }
    // Port từ assIsObjectId (tongquan.js:4714-4716): _id chỉ có giá trị khi là ObjectId Mongo thật (24 hex).
    // doc.id ở đây có thể là id hiển thị/composite (vd "doc-api-3") chứ không phải _id Mongo — gửi thẳng
    // lên BE dễ bị từ chối liên kết văn bản hoặc lưu sai tham chiếu; không hợp lệ thì để null như tongquan.js.
    function assIsObjectId(v) {
        return /^[0-9a-fA-F]{24}$/.test(String(v || ''));
    }
    function mapSelectedDocsToVanBanDenDinhKem(docs) {
        return (docs || []).map(function (doc) {
            var raw = doc && doc.raw && typeof doc.raw === 'object' ? doc.raw : {};
            var rawId = raw._id || doc.id;
            return {
                soVanBan: doc && doc.code ? doc.code : (raw.toBook || raw.code || raw.documentNumber || ''),
                ngayVanBan: raw.documentDate || raw.ngayVanBan || raw.createdAt || null,
                trichYeu: doc && doc.summary ? doc.summary : (raw.abstractNote || raw.summary || ''),
                fileDinhKem: Array.isArray(raw.fileDinhKem) ? raw.fileDinhKem : [],
                _id: assIsObjectId(rawId) ? rawId : null
            };
        }).filter(function (item) {
            return !!(item._id || item.soVanBan || item.trichYeu);
        });
    }
    function mapImportanceToMucDoQuanTrong(v) {
        var known = { 'cao': 'cao', 'bình thường': 'binh_thuong' };
        var normalized = normalizeCrmText(v);
        return known[normalized] || normalized.replace(/\s+/g, '_');
    }
    function qlnvCurrentUserName() {
        return (__qlnvScopeInfo && __qlnvScopeInfo.hoTen) || (__qlnvMe && __qlnvMe.name) || '';
    }

    /* ============================== LUỒNG TẠO NHIỆM VỤ V2 (đồng bộ từ khối nhiệm vụ) ==============================
       Route mới POST {urlAPI}/api/qlnv/v2/nhiem-vu (khác host với QLNV_API_BASE/qlnvFetch ở trên, và là route
       BẮT BUỘC Bearer token — port theo assCreateTaskV2/qlnvxCreateAssignmentImpl của
       khối nhiệm vụ). Dùng cho cả nhiệm vụ CHÍNH (Giao nhiệm vụ + Nhập notify) LẪN nhiệm vụ NHÁNH
       (createSubTaskAssignment, loaiNV=NHIEM_VU_CON + parentId — xem buildQlnvCreateBodyV2) vì route v2 nhận
       thẳng id SỐ của cây organization-structure, không cần quy đổi ObjectId như route cũ /qlnv/bmm/create. */
    var ASS_CREATE_V2_URL = urlAPI + '/api/qlnv/v2/nhiem-vu';
    /* Thiếu token thì dừng ngay tại FE thay vì để BE trả 401. */
    function qlnvAuthHeaders() {
        var t = '';
        try { t = localStorage.getItem('qlnv_jwt_access_token') || ''; } catch (e) { }
        var p = (t || readQlnvToken()) ? Promise.resolve(t || readQlnvToken()) : getQlnvToken().catch(function () { return ''; });
        return p.then(function (tk) {
            if (!tk) throw new Error('Thiếu token đăng nhập, đăng nhập lại rồi thử lại.');
            return { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk };
        });
    }
    /* Ghi đính kèm cho nhiệm vụ ĐÃ tạo — route create bỏ qua vanBanDenDinhKem.
       Ưu tiên taskId BKAV, fallback docId (_id Mongo) cho nhiệm vụ xã/phường không mirror BMM. */
    function qlnvSaveDinhKemV2(ref, payload) {
        var body = Object.assign({}, payload);
        var soBmm = ref && ref.bmmTaskId != null ? String(ref.bmmTaskId) : '';
        if (soBmm) body.taskId = Number(soBmm) || soBmm;
        else if (ref && ref.docId) body.docId = String(ref.docId);
        else return Promise.reject(new Error('Thiếu định danh nhiệm vụ vừa tạo'));
        return qlnvAuthHeaders().then(function (headers) {
            return fetch(urlAPI + '/api/qlnv/v2/nhiem-vu/tep-dinh-kem', { method: 'POST', headers: headers, body: JSON.stringify(body) });
        }).then(function (r) {
            return r.json().then(function (res) { return { ok: r.ok, res: res }; }, function () { return { ok: r.ok, res: null }; });
        }).then(function (out) {
            var st = out.res && out.res.status;
            if (!out.ok || (st != null && Number(st) !== 1)) throw new Error((out.res && out.res.message) || 'Lưu đính kèm thất bại');
            return out.res;
        });
    }
    function qlnvCreateTaskV2(body) {
        return qlnvAuthHeaders().then(function (headers) {
            return fetch(ASS_CREATE_V2_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
        }).then(function (r) {
            return r.json().then(function (res) { return { ok: r.ok, res: res }; }, function () { return { ok: r.ok, res: null }; });
        }).then(function (out) {
            var res = out.res;
            var st = res && res.status;
            if (!out.ok || (st != null && Number(st) !== 1)) {
                throw new Error((res && res.message) || ('Tạo nhiệm vụ thất bại (HTTP ' + (out.ok ? 200 : 'lỗi') + ')'));
            }
            /* Route create BỎ QUA vanBanDenDinhKem -> ghi lại bằng /tep-dinh-kem. Làm ngay trong hàm này
               để cả 4 chỗ gọi đều có đính kèm; lỗi ở đây KHÔNG rollback nhiệm vụ đã tạo. */
            var dk = body && body.vanBanDenDinhKem;
            if (!dk || !dk.length) return res;
            var row = (res && res.data && Array.isArray(res.data.mongo) && res.data.mongo[0]) || null;
            return qlnvSaveDinhKemV2(
                { bmmTaskId: row && row.bmmTaskId, docId: row && (row._id || row.docId) },
                { vanBanDenDinhKem: dk }
            ).then(function () { return res; }, function (err) {
                if (typeof toast === 'function') toast('Nhiệm vụ đã tạo nhưng văn bản đính kèm CHƯA lưu: ' + err.message);
                return res;
            });
        });
    }
    /* Dựng body cho route v2 — field name khác với buildQlnvCreateBody (route cũ): donViGiao/donViTao/
       nguoiTaoId/nguoiTaoNhiemVu/nguoiGiaoNhiemVu/nguoiThucHien là MỚI; linhVuc gửi thẳng NHÃN hiển thị
       (không dò code như route cũ); ngayChiDao/ngayHetHan gửi chuỗi ngày thô (input[type=date].value),
       KHÔNG qua QlnvApiNotify.toIsoDateTime — đúng như khối nhiệm vụ đang gửi. */
    /* Chặn phát hành khi chưa đủ danh tính từ token — port assBlock() của tongquan.js. Nạp lại phạm
       vi/hồ sơ để lần bấm sau có dữ liệu, thay vì gửi lên tạo bản ghi hỏng. */
    function qlnvBlockCreate(msg) {
        console.warn('[QLNV tạo nhiệm vụ] ' + msg, { __qlnvMe: __qlnvMe, __qlnvScopeInfo: __qlnvScopeInfo });
        if (typeof toast === 'function') toast(msg);
        qlnvLoadMyScope();
        loadQlnvMe();
    }
    /* Trả null khi thiếu danh tính -> MỌI nơi gọi phải kiểm tra trước khi POST. */
    function buildQlnvCreateBodyV2(form) {
        var urgencyItem = findCrmConfigItem('DUT', form.urgency);
        if (!urgencyItem) urgencyItem = findCrmConfigItem('DUT', urgencyToDoKhan(form.urgency));
        var doKhanCode = urgencyItem ? (urgencyItem.code || urgencyItem.value) : (form.doKhan || form.urgency || null);
        var giverName = qlnvCurrentUserName();
        var myUnit = qlnvCurrentUnitId();
        var leaderId = form.lanhDaoChiDaoId || qlnvDefaultLeaderId();
        /* Hai guard này khớp tongquan.js:5427/5474 — thiếu id người thì BE lưu bản ghi lỗi, thiếu
           iddv thì đơn vị giao sai và mất đồng bộ Bkav. Cả hai đều phải chặn, không gửi tạm. */
        if (!leaderId) {
            qlnvBlockCreate('Chưa xác định được tài khoản đăng nhập, thử tải lại trang.');
            return null;
        }
        if (myUnit == null) {
            qlnvBlockCreate('Chưa xác định được đơn vị của tài khoản, thử lại sau giây lát.');
            return null;
        }
        var body = {
            loaiNV: form.loaiNV || 'NHIEM_VU',
            lanhDaoChiDaoId: leaderId,
            donViGiao: myUnit,
            donViChuTri: form.donViChuTri && form.donViChuTri.length ? form.donViChuTri : null,
            donViTao: myUnit,
            nguoiTaoId: leaderId,
            nguoiTaoNhiemVu: giverName || null,
            // BE đọc thẳng field này, không suy từ nguoiTaoId.
            nguoiTaoNhiemVuId: leaderId || null,
            // Mặc định = tên người tạo (hành vi cũ, giữ nguyên cho các luồng chưa có ô "Người giao"); truyền
            // form.nguoiGiaoNhiemVu/nguoiGiaoLaCaNhan để ghi đè khi có ô chọn đơn vị/cá nhân thật — port
            // nguoiGiaoLaCaNhan từ qlnvxCreateAssignmentImpl (tongquan.js:5482), trước đây field này chưa từng
            // được gửi bởi bất kỳ luồng tạo nào trong file.
            nguoiGiaoNhiemVu: form.nguoiGiaoNhiemVu !== undefined ? form.nguoiGiaoNhiemVu : (giverName || null),
            nguoiGiaoLaCaNhan: !!form.nguoiGiaoLaCaNhan,
            nguoiThucHien: form.receiverLabel || null,
            tenNhiemVu: form.title,
            noiDungNhiemVu: form.description || form.title,
            ngayChiDao: form.startDate || undefined,
            ngayHetHan: form.dueDate || undefined,
            doKhan: doKhanCode,
            linhVuc: form.fieldLabel || form.field || undefined,
            loaiVanBan: form.loaiVanBan || form.docType || undefined,
            yKienChiDao: form.yKien || form.description || undefined
        };
        if (form.soVanBan) body.soVanBan = form.soVanBan;
        if (form.donViThucHien && form.donViThucHien.length) {
            body.donViThucHien = form.donViThucHien;
            body.donViPhoiHopName = (form.donViThucHienLabels || []).join(', ');
        }
        // canboId và iddv trùng dải số -> cán bộ phối hợp phải đi field riêng, không gộp donViThucHien.
        if (form.canBoThucHien && form.canBoThucHien.length) body.canBoThucHien = form.canBoThucHien;
        if (form.vanBanDenDinhKem && form.vanBanDenDinhKem.length) body.vanBanDenDinhKem = form.vanBanDenDinhKem;
        if (form.receiverPersonId) body[QLNV_RECEIVER_FIELD] = form.receiverPersonId;
        /* Nhiệm vụ NHÁNH — theo assScenarioSubTaskBody/qlnvxCreateAssignmentImpl của tongquan.js: cùng payload
           nhiệm vụ chính, chỉ gắn thêm khóa cha + vài field app QLNV LUÔN đòi khi tạo nhánh (thiếu thì BE có thể
           400 hoặc lưu sai nhóm, nhánh không hiện lại ở bảng nhiệm vụ nhánh). */
        if (form.loaiNV === 'NHIEM_VU_CON' && form.parentId) {
            body[QLNV_SUBTASK_PARENT_FIELD] = String(form.parentId);
            body.status = 1;
            body.capTrinh = form.capTrinh || '1';
            // Nhóm lĩnh vực: app gửi khóa `nhiemVu` (KHÔNG phải `linhVuc`) cho nhánh, kế thừa của cha.
            var nhiemVuGroup = form.fieldLabel || form.field;
            if (nhiemVuGroup) body.nhiemVu = nhiemVuGroup;
            // Payload thật dùng MẢNG RỖNG (không phải null) cho các danh sách khi tạo nhánh.
            if (!Array.isArray(body.donViChuTri)) body.donViChuTri = [];
            if (!Array.isArray(body.donViThucHien)) body.donViThucHien = [];
            ['vanBanDenDinhKem', 'vanBanDiDinhKem', 'hoSoCongViecLienQuan', 'danhSachBaoCao', 'donViLienQuan'].forEach(function (k) {
                if (!Array.isArray(body[k])) body[k] = [];
            });
        }
        return body;
    }
    /* Upload file đính kèm THẬT lên QLNV sau khi tạo nhiệm vụ (route cũ /qlnv/bmm/files/:id/upload, vẫn qua
       qlnvFetch/QLNV_API_BASE có Bearer token — chỉ route TẠO nhiệm vụ mới đổi host, route upload thì không).
       :id phải là task_id BKAV (SỐ) lấy từ data.mongo[0].bmmTaskId của response tạo nhiệm vụ — thiếu thì
       nhiệm vụ coi như chưa mirror sang BKAV, báo lỗi rõ thay vì âm thầm bỏ qua file. */
    function extractQlnvV2BmmTaskId(res) {
        var mongo = res && res.data && res.data.mongo;
        return (Array.isArray(mongo) && mongo[0] && mongo[0].bmmTaskId) || null;
    }
    function qlnvDataUrlToBlob(dataUrl) {
        return fetch(dataUrl).then(function (r) { return r.blob(); });
    }
    function qlnvAssertUploadOk(res) {
        var inner = res && typeof res === 'object' ? res.data : null;
        var st = inner && inner.status;
        var bad = (res && Number(res.status) === 0) || (inner && ((st != null && Number(st) >= 400) || (Array.isArray(inner.errors) && inner.errors.length)));
        if (bad) {
            throw new Error((inner && (Array.isArray(inner.errors) ? inner.errors.join('; ') : inner.message)) || (res && res.message) || 'Upload thất bại');
        }
        return res;
    }
    function qlnvUploadTaskFilesV2(bmmId, files) {
        if (!files || !files.length) return Promise.resolve();
        if (!bmmId) return Promise.reject(new Error('Nhiệm vụ chưa đồng bộ BKAV nên chưa đính được file'));
        return Promise.all(files.map(function (f) {
            return qlnvDataUrlToBlob(f.dataUrl).then(function (b) { return { name: f.name, blob: b }; });
        })).then(function (parts) {
            var fd = new FormData();
            parts.forEach(function (p) { fd.append('files', p.blob, p.name); });
            return QlnvApiNotify.qlnvFetch('/qlnv/bmm/files/' + encodeURIComponent(bmmId) + '/upload', { method: 'POST', body: fd }).then(qlnvAssertUploadOk);
        });
    }
    function extractQlnvTaskId(res) {
        if (!res) return '';
        // Response thật từ /qlnv/bmm/create (be_qlnv mirror qua module bmm, xem createTask()) KHÔNG có
        // _id Mongo: chỉ có task_id (số, sinh bên BKAV) nằm ở data[0].bmmResult.data[0].task_id, và
        // taskCode (= soVanBan mình tự sinh khi tạo) ở data[0].taskCode. Vài nơi gọi hàm này truyền thẳng
        // `res` gốc (res.data[0].bmmResult...), vài nơi khác đã tự unwrap `created = res.data[0]` trước
        // rồi mới gọi (created.bmmResult... nằm ngay ở gốc tham số) -> phải dò cả 2 dạng.
        var d0 = Array.isArray(res.data) ? res.data[0] : null;
        var directBmm = (res.bmmResult && Array.isArray(res.bmmResult.data)) ? res.bmmResult.data[0] : null;
        var nestedBmm = (d0 && d0.bmmResult && Array.isArray(d0.bmmResult.data)) ? d0.bmmResult.data[0] : null;
        var candidates = [
            res._id,
            res.id,
            res.task_id,
            res.taskId,
            res.data && !Array.isArray(res.data) && res.data._id,
            res.data && !Array.isArray(res.data) && res.data.id,
            res.data && !Array.isArray(res.data) && res.data.task_id,
            res.data && !Array.isArray(res.data) && res.data.taskId,
            d0 && (d0._id || d0.id || d0.task_id || d0.taskId),
            directBmm && directBmm.task_id,
            nestedBmm && nestedBmm.task_id,
            res.taskCode,
            d0 && d0.taskCode,
            res.result && res.result._id,
            res.result && res.result.id,
            res.result && res.result.task_id,
            // Response của route v2 (/api/qlnv/v2/nhiem-vu, xem qlnvCreateTaskV2): id Mongo nằm ở
            // data.mongo[0]._id (khác hẳn shape của /qlnv/bmm/create ở trên).
            res.data && res.data.mongo && Array.isArray(res.data.mongo) && res.data.mongo[0] && (res.data.mongo[0]._id || res.data.mongo[0].id)
        ];
        for (var i = 0; i < candidates.length; i++) {
            // Chỉ nhận chuỗi/số làm id — chặn boolean lọt qua vòng lặp (trước đây "Array.isArray(res.data) &&
            // res.data[0] && (...)" short-circuit ra literal `false` khi res.data không phải mảng, khiến vòng
            // lặp coi `false` là id hợp lệ rồi trả về chuỗi "false" cho các nhiệm vụ nhánh mới tạo).
            if (candidates[i] != null && candidates[i] !== '' && typeof candidates[i] !== 'boolean') return String(candidates[i]);
        }
        return '';
    }
    function findCreatedQlnvRecord(baseRecord) {
        if (!baseRecord) return null;
        return records.find(function (x) {
            return !!x.__qlnv && x.metric === baseRecord.metric
                && String(x.code || '') === String(baseRecord.code || '')
                && String(x.title || '') === String(baseRecord.title || '');
        }) || null;
    }
    window.refreshQlnvApi = refreshQlnvApi;
    window.loadQlnvAndMerge = loadQlnvAndMerge;

    /* ============================== HELPERS ============================== */
    function sumObj(o) { return statusDefs.reduce((a, s) => a + (o[s.key] || 0), 0) }
    function statusMeta(k) { return statusDefs.find(s => s.key === k) || statusDefs[0] }
    function fmt(n) { return Number(n).toLocaleString('vi-VN') }
    function pct(n, d) { return d ? ((n / d) * 100).toFixed(1).replace('.', ',') + '%' : '0%' }
    function pad(n) { return String(n).padStart(2, '0') }
    function pick(arr, i) { return arr[i % arr.length] }
    function esc(s) { return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])) }
    function dueDate(i, status) { const d = new Date(); let delta = { done: -i % 15, doing: (i % 12) + 3, regular: 30 + (i % 20), soon: (i % 4) + 1, risk: (i % 3) + 1, overdue: -(i % 8 + 1) }[status] || 5; d.setDate(d.getDate() + delta); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
    function progressFor(status, i) { return { done: 100, doing: 45 + (i % 38), regular: 70 + (i % 22), soon: 65 + (i % 20), risk: 38 + (i % 30), overdue: 20 + (i % 35) }[status] || 50 }
    function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
    function parseISO(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d) }
    function addDays(base, n) { const d = new Date(base); d.setDate(d.getDate() + n); return d }
    function donutArc(cx, cy, r, start, end) {
        const rad = a => (a - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(rad(start)), y1 = cy + r * Math.sin(rad(start));
        const x2 = cx + r * Math.cos(rad(end)), y2 = cy + r * Math.sin(rad(end));
        const large = end - start > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    }

    /* Plugin dùng chung: hiện số liệu ngay trên/cạnh mỗi cột/hàng của mọi biểu đồ Chart.js dạng bar (dọc lẫn ngang) */
    if (typeof Chart !== 'undefined') {
        Chart.register({
            id: 'valueLabels',
            afterDatasetsDraw(chart) {
                if (chart.config.type !== 'bar') return;
                const { ctx } = chart;
                chart.data.datasets.forEach((ds, dsIndex) => {
                    const meta = chart.getDatasetMeta(dsIndex);
                    meta.data.forEach((elem, i) => {
                        const raw = ds.data[i];
                        if (raw === null || raw === undefined) return;
                        const pos = elem.tooltipPosition();
                        ctx.save();
                        ctx.fillStyle = (document.documentElement.classList.contains('theme-light') || document.documentElement.classList.contains('theme-green')) ? '#111827' : '#eaf6ff';
                        ctx.font = "700 11px 'Be Vietnam Pro',sans-serif";
                        if (chart.options.indexAxis === 'y') {
                            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                            const text = fmt(raw);
                            const textWidth = ctx.measureText(text).width;
                            let labelX = pos.x + 6;
                            if (labelX + textWidth > chart.width - 4) {
                                labelX = Math.max(pos.x - textWidth - 6, chart.width - textWidth - 4);
                            }
                            ctx.fillText(text, labelX, pos.y);
                        } else {
                            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                            const labelY = Math.max(12, pos.y - 4);
                            ctx.fillText(fmt(raw), pos.x, labelY);
                        }
                        ctx.restore();
                    });
                });
            }
        });
    }

    function allowedRoles(role = currentRole) {
        if (role === 'DANG') return ['DANG', 'HDND', 'UBND', 'MTTQ'];
        if (role === 'UBND') return ['UBND', 'HDND', 'MTTQ'];
        if (role === 'HDND') return ['HDND'];
        if (role === 'MTTQ') return ['MTTQ'];
        return [];
    }
    function canSeeRole(role) { return allowedRoles().includes(role) }
    function isLimitedRole(role) { return currentRole === 'UBND' && (role === 'HDND' || role === 'MTTQ') }
    function metricTotal(role, metric) { return sumObj(segmentTemplate[role][metric]) }
    function statusTotal(metric, status, roles = allowedRoles()) { return roles.reduce((a, r) => a + (segmentTemplate[r]?.[metric]?.[status] || 0), 0) }
    function metricTotalVisible(metric) { return allowedRoles().reduce((a, r) => a + metricTotal(r, metric), 0) }

    /* ============================== SINH DỮ LIỆU DEMO ============================== */
    function generateRecords() {
        let idCounter = 1; records = [];
        Object.keys(segmentTemplate).forEach(role => {
            Object.keys(metricMeta).forEach(metric => {
                const isDocument = metric === 'docIn' || metric === 'docOut';
                statusDefs.forEach(st => {
                    const count = segmentTemplate[role][metric][st.key] || 0;
                    for (let i = 0; i < count; i++) {
                        const base = {
                            id: `PX-${metric.toUpperCase()}-${role}-${String(idCounter).padStart(4, '0')}`,
                            role, metric, status: st.key,
                            unit: pick(units, i + idCounter), priority: st.key === 'overdue' || st.key === 'risk' ? 'Cao' : st.key === 'soon' ? 'Trung bình' : 'Bình thường',
                            due: dueDate(i, st.key), created: `${pad((i % 25) + 1)}/06/2026`, progress: progressFor(st.key, i),
                            evidence: [`Biểu mẫu_${role}_${i + 1}.xlsx`, `Văn bản_chỉ_đạo_${i + 1}.pdf`, `Ảnh_minh_chứng_${i + 1}.jpg`],
                            history: [
                                { time: '08:15 24/06/2026', text: 'Tiếp nhận vào IOC/CAD' },
                                { time: '09:40 24/06/2026', text: `Phân loại ${st.label}` },
                                { time: '14:20 25/06/2026', text: `Gán xử lý cho ${pick(units, i + 2)}` },
                                { time: '10:10 26/06/2026', text: 'Cập nhật tiến độ và đính kèm minh chứng' }
                            ]
                        };
                        if (isDocument) {
                            const doc = buildDocumentContent(role, idCounter - 1);
                            records.push({
                                ...base, ...doc, title: doc.title,
                                description: `Văn bản ${metric === 'docIn' ? 'đến' : 'đi'} thuộc ${axisMeta[role].name}, lĩnh vực ${doc.field}. Trích yếu: ${doc.summary}.`
                            });
                        } else {
                            const titleBase = pick(taskTitlePool[role], i);
                            const field = pick(fieldPool[role], i + idCounter);
                            const creator = metric === 'received' ? pick(['Thành ủy Hà Nội', 'HĐND Thành phố', 'UBND Thành phố', 'MTTQ Thành phố', 'Sở/ban ngành phối hợp'], i) : axisMeta[role].name;
                            const receiver = metric === 'assigned' ? pick(units, i + role.length) : axisMeta[role].name;
                            records.push({
                                ...base, title: `${titleBase} #${i + 1}`, field, creator, receiver, linkedDocIds: [],
                                description: `Hồ sơ demo thuộc ${axisMeta[role].name}, lĩnh vực ${field}. Nội dung dùng để mô phỏng vận hành IOC/CAD Thành ủy Hà Nội, có theo dõi tiến độ, cảnh báo, đơn vị phối hợp và minh chứng số hóa.`,
                                subtasks: []
                            });
                        }
                        idCounter++;
                    }
                })
            })
        });
        indicatorRecords = [];
        Object.keys(indicators).forEach(role => {
            indicators[role].forEach((it, idx) => {
                const [name, count, freq, source] = it;
                for (let i = 0; i < count; i++) {
                    const st = statusDefs[(i + idx) % statusDefs.length];
                    indicatorRecords.push({
                        id: `CT-${role}-${idx + 1}-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key,
                        title: `${name} - bản ghi ${i + 1}`, field: name, source, freq,
                        unit: pick(units, i), due: dueDate(i, st.key), progress: progressFor(st.key, i),
                        description: `Bản ghi chỉ tiêu ${name} của ${axisMeta[role].name}. Tần suất cập nhật ${freq}, nguồn ${source}.`,
                        history: [{ time: '07:30 26/06/2026', text: 'Đồng bộ dữ liệu mẫu' }, { time: '11:00 26/06/2026', text: 'Xác nhận số liệu cấp phường' }, { time: '15:20 26/06/2026', text: 'Cập nhật tiến độ và đính kèm minh chứng' }]
                    });
                }
            })
        })
    }

    /* Bổ sung chỉ tiêu con của category (nếu chưa có trong "indicators") + chỉ tiêu tổng hợp kiến nghị cử tri */
    function addIndicatorFromCategory(role, item) {
        indicators[role] = indicators[role] || [];
        const [name, count, freq, source] = item;
        let idx = indicators[role].findIndex(x => x[0] === name);
        if (idx < 0) { indicators[role].push([name, count, freq, source]); idx = indicators[role].length - 1; }
        if (!indicatorRecords.some(r => r.role === role && r.indicator === name)) {
            for (let i = 0; i < count; i++) {
                const st = statusDefs[(i + idx) % statusDefs.length];
                indicatorRecords.push({ id: `CT-${role}-CAT-${idx + 1}-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key, title: `${name} - bản ghi ${i + 1}`, field: name, source, freq, unit: pick(units, i + idx), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: `Bản ghi thuộc nhóm chỉ tiêu ${name}; dữ liệu được phân cấp theo lĩnh vực, nguồn ${source}, tần suất ${freq}.`, history: [{ time: '08:00 30/06/2026', text: 'Đồng bộ/nhập mẫu theo phụ lục khảo sát xã phường' }, { time: '09:10 30/06/2026', text: 'Xác nhận phạm vi hiển thị theo phân quyền' }] });
            }
        }
    }
    function ensureCategoryIndicators() {
        Object.keys(categorySeed).forEach(role => categorySeed[role].forEach(cat => cat.items.forEach(item => addIndicatorFromCategory(role, item))));
        const label = 'Tổng số ý kiến liên quan đến kiến nghị cử tri';
        if (!indicators.HDND.some(x => x[0] === label)) indicators.HDND.push([label, 87, 'Tuần', 'Excel/API cử tri']);
        if (!indicatorRecords.some(r => r.role === 'HDND' && r.indicator === label)) {
            for (let i = 0; i < 87; i++) { const st = statusDefs[(i + 2) % statusDefs.length]; indicatorRecords.push({ id: `CT-HDND-KNCT-${String(i + 1).padStart(4, '0')}`, role: 'HDND', indicator: label, status: st.key, title: `Ý kiến/kiến nghị cử tri liên quan #${i + 1}`, field: 'Cử tri – kiến nghị', source: 'Excel/API cử tri', freq: 'Tuần', unit: pick(units, i + 3), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: 'Bản ghi tổng hợp ý kiến liên quan đến kiến nghị cử tri: nhóm nội dung, đơn vị tiếp nhận, trạng thái xử lý và kết quả trả lời.', history: [{ time: '07:40 26/06/2026', text: 'Đồng bộ danh sách ý kiến/kiến nghị cử tri' }, { time: '10:30 26/06/2026', text: 'HĐND rà soát trạng thái xử lý' }] }); }
        }
    }

    /* Mỗi nhiệm vụ (assigned/received) có tối thiểu 5 nhiệm vụ nhánh mẫu để minh hoạ bảng thống kê. Văn bản (docIn/docOut) không có nhiệm vụ nhánh trực tiếp — con của văn bản là Nhiệm vụ, xem attachTasksToDocuments(). */
    function seedDefaultSubtasks() {
        const samples = ['Rà soát hồ sơ nguồn và đối chiếu số liệu', 'Chuẩn hóa biểu mẫu/minh chứng gửi IOC', 'Liên hệ đơn vị phối hợp xác nhận kết quả', 'Cập nhật tiến độ xử lý lên hệ thống', 'Tổng hợp báo cáo ngắn phục vụ lãnh đạo'];
        records.forEach((r, idx) => {
            if (r.metric !== 'assigned' && r.metric !== 'received') return;
            r.subtasks = r.subtasks || [];
            while (r.subtasks.length < 5) {
                const n = r.subtasks.length;
                r.subtasks.push({ id: `${r.id}-N${String(n + 1).padStart(2, '0')}`, name: samples[n], content: `${samples[n]} cho hồ sơ ${r.id}, lĩnh vực ${r.field}.`, owner: pick(units, idx + n), state: n === 0 ? 'Hoàn thành' : n === 3 ? 'Sắp đến hạn' : 'Đang xử lý', due: dueDate(n, n === 0 ? 'done' : n === 3 ? 'soon' : 'doing'), priority: n === 3 ? 'Cao' : 'Trung bình', progress: n === 0 ? 100 : n === 3 ? 68 : 35 + n * 8, scenario: '', created: '26/06/2026 08:00' });
            }
        });
    }

    /* Gắn 1-3 nhiệm vụ (assigned/received) đã sinh sẵn cùng trục vào từng văn bản, làm nhiệm vụ "cấp 1" của văn bản đó.
       Chỉ gắn tham chiếu (linkedDocIds) vào nhiệm vụ đã có sẵn — không tạo thêm bản ghi, không đổi số KPI dashboard. */
    function attachTasksToDocuments() {
        const tasksByRole = {};
        records.forEach(r => { if (r.metric === 'assigned' || r.metric === 'received') { (tasksByRole[r.role] = tasksByRole[r.role] || []).push(r); } });
        const cursor = {};
        records.forEach((doc, docIdx) => {
            if (doc.metric !== 'docIn' && doc.metric !== 'docOut') return;
            const pool = tasksByRole[doc.role] || []; if (!pool.length) return;
            const taskCount = 1 + (docIdx % 3);
            cursor[doc.role] = cursor[doc.role] || 0;
            for (let k = 0; k < taskCount; k++) {
                const task = pool[cursor[doc.role] % pool.length];
                cursor[doc.role]++;
                task.linkedDocIds = task.linkedDocIds || [];
                if (!task.linkedDocIds.includes(doc.id)) task.linkedDocIds.push(doc.id);
            }
        });
    }

    /* ============================== KHỞI TẠO TOÀN BỘ DỮ LIỆU ============================== */
    function initData() {
        generateRecords();
        ensureCategoryIndicators();
        (categorySeed.UBND || []).forEach(cat => ensureFakeCategoryItems('UBND', cat.id));
        seedDefaultSubtasks();
        attachTasksToDocuments();
    }

    /* ============================== LỊCH CÔNG TÁC / KỲ HỌP (1 bộ hàm dùng chung) ============================== */
    function ensureCalendarEvents() {
        if (window.__calendarEvents) return;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const templates = {
            DANG: ['Giao ban Thường trực Đảng ủy', 'Họp Ban Thường vụ Đảng ủy', 'Làm việc về Nghị quyết 57', 'Kiểm điểm tiến độ công tác Đảng viên', 'Họp giao ban tuyên giáo - dân vận', 'Họp rà soát văn bản chỉ đạo'],
            HDND: ['Họp Thường trực HĐND', 'Phiên giải trình chuyên đề', 'Giám sát kiến nghị cử tri', 'Chuẩn bị nội dung kỳ họp HĐND', 'Rà soát dự thảo nghị quyết', 'Họp tổ đại biểu HĐND'],
            UBND: ['Giao ban lãnh đạo UBND', 'Họp xử lý TTHC sắp hạn', 'Họp thu ngân sách - an sinh', 'Họp đô thị, môi trường, PCCC', 'Họp GPMB dự án trọng điểm', 'Họp chuyển đổi số dữ liệu IOC'],
            MTTQ: ['Họp Ban Thường trực MTTQ', 'Họp phản biện xã hội', 'Họp quỹ ủng hộ và an sinh', 'Họp Đoàn Thanh niên - Hội Phụ nữ', 'Họp giám sát cộng đồng', 'Họp tổng hợp dư luận xã hội']
        };
        const counts = { DANG: 18, HDND: 17, UBND: 15, MTTQ: 9 };
        let id = 1; const events = [];
        Object.keys(counts).forEach(role => {
            for (let i = 0; i < counts[role]; i++) {
                const offsets = [-8, -3, -1, 0, 1, 2, 3, 5, 7, 9, 12, 15, 18, 22, 27, 31, 38, 45];
                const d = addDays(today, offsets[i % offsets.length] + (role === 'UBND' ? 1 : role === 'MTTQ' ? 2 : 0));
                const late = d < today && i % 3 !== 0;
                const done = d < today && !late;
                events.push({
                    id: `MEET-${role}-${String(id++).padStart(3, '0')}`, role, date: iso(d), time: ['07:45', '08:00', '08:30', '09:00', '14:00', '15:30'][i % 6], end: ['09:00', '09:30', '10:30', '11:00', '15:30', '16:30'][i % 6],
                    title: `${templates[role][i % templates[role].length]} ${i + 1}`,
                    venue: ['Phòng họp Đảng ủy', 'Hội trường UBND phường', 'Phòng họp HĐND', 'Phòng giao ban IOC', 'Nhà văn hóa trung tâm'][i % 5],
                    chair: role === 'DANG' ? 'Bí thư Đảng ủy' : role === 'HDND' ? 'Chủ tịch HĐND' : role === 'UBND' ? 'Chủ tịch UBND' : 'Chủ tịch MTTQ',
                    secretary: ['Văn phòng Đảng ủy', 'Văn phòng HĐND', 'Văn phòng UBND', 'Cán bộ MTTQ'][i % 4],
                    participants: [axisMeta[role].name, 'Văn phòng phường', 'Công chức chuyên môn', i % 2 ? 'Đơn vị phối hợp' : 'Tổ chuyển đổi số', i % 3 ? 'Đại diện thôn/tổ dân phố' : 'Công an phường'],
                    agenda: `Chuẩn bị nội dung, rà soát số liệu IOC, kết luận giao nhiệm vụ và cập nhật tiến độ sau họp cho ${axisMeta[role].name}.`,
                    docs: [`Tài liệu_họp_${role}_${i + 1}.pdf`, `Dự_thảo_kết_luận_${i + 1}.docx`],
                    rawStatus: done ? 'done' : late ? 'late' : 'planned',
                    prepared: i % 4 !== 1, confirmed: i % 5 !== 2
                });
            }
        });
        window.__calendarEvents = events;
    }
    function eventState(e) {
        const today = new Date(); today.setHours(0, 0, 0, 0); const d = parseISO(e.date); d.setHours(0, 0, 0, 0); const diff = Math.round((d - today) / 86400000);
        if (e.rawStatus === 'late') return { key: 'late', label: 'Trễ xác nhận/chuẩn bị', icon: '⚠️' };
        if (e.rawStatus === 'done') return { key: 'done', label: 'Đã hoàn thành', icon: '✅' };
        if (diff === 0) return { key: 'today', label: 'Hôm nay', icon: '?' };
        if (diff > 0 && diff <= 7) return { key: 'upcoming', label: 'Sắp diễn ra', icon: '⏰' };
        return { key: 'planned', label: 'Đã lên lịch', icon: '?' };
    }
    function getCalendarEventsForScope(roleFilter) { ensureCalendarEvents(); return (window.__calendarEvents || []).filter(e => allowedRoles().includes(e.role) && (!roleFilter || e.role === roleFilter)); }
    function calendarStatusCounts(roleFilter) { const ev = getCalendarEventsForScope(roleFilter); const out = { today: 0, upcoming: 0, late: 0, planned: 0, done: 0 }; ev.forEach(e => out[eventState(e).key]++); return out; }
    function eventFullDate(e) { const d = parseISO(e.date); return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) }
    function eventDateShort(e) { const d = parseISO(e.date); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` }

    function openCalendar(role = null, title = 'Lịch công tác/kỳ họp', stateFilter = '') {
        ensureCalendarEvents();
        const validRole = role && allowedRoles().includes(role) ? role : '';
        window.__calState = { mode: 'month', date: iso(new Date()), role: validRole, state: stateFilter || '' };
        document.getElementById('drawerTitleNotify').textContent = title;
        document.getElementById('drawerSubNotify').textContent = '';
        document.getElementById('drawerBodyNotify').innerHTML = `<div class="calendar-shell" style="display:grid;gap:12px"><div class="calendar-toolbar" style="display:grid;grid-template-columns:repeat(6,max-content) minmax(160px,1fr);gap:8px;align-items:center"><div class="mode-tabs" style="margin:0"><button id="calModeDay" onclick="setCalMode('day')">Ngày</button><button id="calModeWeek" onclick="setCalMode('week')">Tuần</button><button id="calModeMonth" onclick="setCalMode('month')">Tháng</button></div><button class="ghost" onclick="moveCalendar(-1)">←</button><button class="ghost" onclick="moveCalendar(1)">→</button><input id="calDate" type="date" onchange="window.__calState.date=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"/><select id="calRole" onchange="window.__calState.role=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trục được xem</option>${allowedRoles().map(r => `<option value="${r}" ${validRole === r ? 'selected' : ''}>${axisMeta[r].name}</option>`).join('')}</select><select id="calStateFilter" onchange="window.__calState.state=this.value;renderCalendar()" style="height:36px;border-radius:10px;border:1px solid rgba(87,178,255,.25);background:#071f38;color:#eaf8ff;padding:0 10px"><option value="">Tất cả trạng thái</option><option value="today">Hôm nay</option><option value="upcoming">Sắp diễn ra</option><option value="late">Trễ xác nhận</option><option value="planned">Đã lên lịch</option><option value="done">Đã hoàn thành</option></select><button class="primary" onclick="openAssignmentForm()">＋ Giao nhiệm vụ chuẩn bị họp</button></div><div class="calendar-report" id="calendarReport" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px"></div><div class="calendar-board" id="calendarBoard" style="border:1px solid rgba(87,178,255,.22);border-radius:14px;overflow:hidden;background:rgba(4,16,30,.72)"></div></div>`;
        document.getElementById('calDate').value = window.__calState.date;
        document.getElementById('calStateFilter').value = window.__calState.state;
        openDrawerNoti(); renderCalendar();
    }
    function setCalMode(mode) { window.__calState.mode = mode; renderCalendar(); }
    function moveCalendar(delta) { const st = window.__calState; let d = parseISO(st.date); if (st.mode === 'day') d = addDays(d, delta); else if (st.mode === 'week') d = addDays(d, delta * 7); else d = new Date(d.getFullYear(), d.getMonth() + delta, 1); st.date = iso(d); document.getElementById('calDate').value = st.date; renderCalendar(); }
    function filterCalendarEvents() { const st = window.__calState || {}; return getCalendarEventsForScope(st.role).filter(e => !st.state || eventState(e).key === st.state).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); }
    function reportCard(label, valueCls, value, hint, stateKey) { return `<button class="report-card" style="border:1px solid rgba(87,178,255,.22);background:rgba(5,26,47,.72);border-radius:12px;padding:9px;min-height:78px;overflow:hidden;text-align:left" onclick="window.__calState.state='${stateKey}';document.getElementById('calStateFilter').value='${stateKey}';renderCalendar()"><span style="display:block;color:#c8ddec;font-weight:800;line-height:1.25">${label}</span><b class="${valueCls}" style="display:block;font-size:21px;line-height:1.05;margin-top:4px">${value}</b><small style="display:block;color:var(--muted);margin-top:4px;line-height:1.25">${hint}</small></button>` }
    function renderCalendar() {
        const st = window.__calState; if (!st) return;
        document.querySelectorAll('#calModeDay,#calModeWeek,#calModeMonth').forEach(b => b.classList.remove('active'));
        document.getElementById('calMode' + st.mode[0].toUpperCase() + st.mode.slice(1))?.classList.add('active');
        const counts = calendarStatusCounts(st.role);
        document.getElementById('calendarReport').innerHTML =
            reportCard('Sắp đến lịch họp', 'warn', fmt(counts.upcoming + counts.today), 'Hôm nay và 7 ngày tới', 'upcoming') +
            reportCard('Lịch trễ xác nhận', 'danger', fmt(counts.late), 'Cần thư ký nhắc việc', 'late') +
            reportCard('Đã lên lịch', 'blue', fmt(counts.planned), 'Chưa đến hạn', 'planned') +
            reportCard('Đã hoàn thành', 'ok', fmt(counts.done), 'Có thể lập kết luận/giao việc', 'done');
        const board = document.getElementById('calendarBoard');
        if (st.mode === 'month') board.innerHTML = renderMonthCalendar();
        if (st.mode === 'week') board.innerHTML = renderWeekCalendar();
        if (st.mode === 'day') board.innerHTML = renderDayCalendar();
    }
    function eventChip(e) { const st = eventState(e); return `<button class="event-chip ${st.key}" style="border:1px solid rgba(87,178,255,.22);background:rgba(8,35,62,.88);border-radius:8px;padding:5px 6px;text-align:left;font-size:10.5px;line-height:1.24;min-width:0;overflow:hidden;display:block;width:100%" onclick="openMeetingDetail('${e.id}')"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${st.icon} ${e.time} · ${e.title}</b><small style="display:block;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${axisMeta[e.role].name} · ${e.venue}</small></button>` }
    function renderMonthCalendar() {
        const st = window.__calState; const cursor = parseISO(st.date); const y = cursor.getFullYear(), m = cursor.getMonth(); const first = new Date(y, m, 1); const startOffset = (first.getDay() + 6) % 7; const start = addDays(first, -startOffset); const events = filterCalendarEvents();
        const headers = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(h => `<div style="padding:9px;background:rgba(44,125,210,.18);border-right:1px solid rgba(87,178,255,.16);font-weight:900;text-align:center">${h}</div>`).join('');
        let cells = ''; for (let i = 0; i < 42; i++) {
            const d = addDays(start, i); const dayIso = iso(d); const inMonth = d.getMonth() === m; const today = dayIso === iso(new Date()); const evs = events.filter(e => e.date === dayIso);
            cells += `<div style="min-height:118px;padding:8px;border-right:1px solid rgba(87,178,255,.12);border-top:1px solid rgba(87,178,255,.12);display:grid;grid-template-rows:auto 1fr;gap:6px;background:rgba(7,27,48,.42);overflow:hidden;${inMonth ? '' : 'opacity:.36;'}${today ? 'box-shadow:inset 0 0 0 2px rgba(255,213,75,.55);background:rgba(88,71,11,.25);' : ''}"><div style="font-weight:900;color:#e9f8ff">${d.getDate()}</div><div style="display:grid;gap:5px;align-content:start;overflow:hidden">${evs.slice(0, 4).map(eventChip).join('')}${evs.length > 4 ? `<button class="ghost" style="font-size:10px;padding:4px" onclick="window.__calState.mode='day';window.__calState.date='${dayIso}';document.getElementById('calDate').value='${dayIso}';renderCalendar()">+${evs.length - 4} lịch khác</button>` : ''}</div></div>`
        }
        return `<div style="display:grid;grid-template-columns:repeat(7,minmax(120px,1fr))">${headers}${cells}</div>`;
    }
    function weekStart(d) { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x }
    function renderWeekCalendar() { const st = window.__calState; const start = weekStart(parseISO(st.date)); const events = filterCalendarEvents(); let html = '<div style="display:grid;grid-template-columns:repeat(7,minmax(150px,1fr))">'; for (let i = 0; i < 7; i++) { const d = addDays(start, i), dayIso = iso(d), evs = events.filter(e => e.date === dayIso); html += `<div style="min-height:420px;border-right:1px solid rgba(87,178,255,.14);padding:9px;display:grid;align-content:start;gap:8px"><h4 style="margin:0 0 4px;font-size:12px">${d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}</h4>${evs.map(eventChip).join('') || '<div class="muted">Không có lịch</div>'}</div>` } return html + '</div>' }
    function renderDayCalendar() { const st = window.__calState; const events = filterCalendarEvents().filter(e => e.date === st.date); const d = parseISO(st.date); return `<div style="display:grid;gap:8px"><div style="padding:9px;background:rgba(44,125,210,.18);font-weight:900">${d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>${events.map(e => `<button class="agenda-row" style="display:grid;grid-template-columns:84px 1fr auto;gap:9px;align-items:start;border:1px solid rgba(87,178,255,.2);background:rgba(5,26,47,.72);border-radius:10px;padding:9px;text-align:left;margin:0 9px" onclick="openMeetingDetail('${e.id}')"><div style="font-weight:900;color:#58b7ff">${e.time}<br/>${e.end}</div><div><h4 style="margin:0;font-size:12px;line-height:1.32">${eventState(e).icon} ${e.title}</h4><p style="margin:4px 0 0;color:var(--muted);font-size:11.5px;line-height:1.38">${axisMeta[e.role].name} · ${e.venue} · Chủ trì: ${e.chair}</p></div><span class="badge ${eventState(e).key === 'late' ? 'red' : eventState(e).key === 'today' ? 'ok' : 'gold'}">${eventState(e).label}</span></button>`).join('') || '<div class="access-lock" style="margin:0 9px">Không có lịch họp trong ngày này.</div>'}</div>` }
    function openMeetingDetail(id) {
        ensureCalendarEvents(); const e = (window.__calendarEvents || []).find(x => x.id === id); if (!e) return; const st = eventState(e);
        document.getElementById('modalTitleNotify').textContent = `Chi tiết lịch họp · ${e.id}`;
        document.getElementById('modalSubNotify').textContent = `${axisMeta[e.role].name} · ${eventFullDate(e)} · ${e.time}-${e.end}`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="scenario-detail-grid"><div class="detail-card"><h4>${st.icon} ${e.title}</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.key === 'late' ? '#ff626b' : st.key === 'today' ? '#39d5ff' : '#ffd65a'}">${st.label}</span><b>Ngày giờ</b><span>${eventFullDate(e)} · ${e.time}-${e.end}</span><b>Địa điểm</b><span>${e.venue}</span><b>Chủ trì</b><span>${e.chair}</span><b>Thư ký</b><span>${e.secretary}</span><b>Tài liệu</b><span>${e.docs.join(', ')}</span></div>${st.key === 'late' ? '<div class="access-lock" style="margin-top:10px;border-color:rgba(255,98,107,.45)">Vai trò thư ký: lịch này đã trễ xác nhận/chuẩn bị tài liệu. Cần nhắc đơn vị và giao nhiệm vụ hoàn thiện ngay.</div>' : ''}</div><div class="detail-card"><h4>Thành phần tham gia</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${e.participants.map(p => `<span style="padding:5px 7px;border:1px solid rgba(87,178,255,.22);background:rgba(6,28,52,.72);border-radius:999px;font-size:11.5px">${p}</span>`).join('')}</div><h4 style="margin-top:10px">Nội dung họp</h4><p class="wrap">${e.agenda}</p><div class="action-bar"><button class="primary" onclick="openAssignmentForm()">Giao nhiệm vụ chuẩn bị/kết luận</button><button class="ghost" onclick="toast('Đã gửi nhắc lịch tới thành phần tham dự ${e.id}')">Gửi nhắc lịch</button><button class="ghost" onclick="toast('Đã xác nhận tham dự và cập nhật calendar ${e.id}')">Xác nhận tham dự</button><button class="ghost danger-btn" onclick="toast('Đã tạo báo cáo lịch trễ cho ${e.id}')">Báo cáo lịch trễ</button></div></div></div><div class="detail-card"><h4>Báo cáo thư ký</h4><div class="audit"><div class="audit-item"><b>Chuẩn bị tài liệu</b><span>${e.prepared ? 'Đã đủ tài liệu họp' : 'Thiếu tài liệu, cần nhắc đơn vị gửi trước giờ họp'}</span></div><div class="audit-item"><b>Xác nhận tham dự</b><span>${e.confirmed ? 'Đã xác nhận thành phần chính' : 'Chưa đủ xác nhận, cần gọi/nhắc tự động'}</span></div><div class="audit-item"><b>Việc sau họp</b><span>Tạo dự thảo kết luận, giao nhiệm vụ theo kết luận và theo dõi SLA trên IOC/CAD.</span></div></div></div>`;
        openModal();
    }

    /* ============================== ĐĂNG NHẬP / ĐỒNG HỒ / LỆNH NHANH ============================== */
    function initLogin() {
        initData();
        const wrap = document.getElementById('loginAccounts');
        wrap.innerHTML = Object.values(accounts).map(acc => `<button class="account-pick" onclick="selectLogin('${acc.user}')"><div class="role-icon">${acc.icon}</div><div><b>${acc.title}</b><small class="muted">User: ${acc.user} · Pass: demo</small></div></button>`).join('');
        selectLogin('danguy');
        setInterval(updateClock, 1000); updateClock();
        document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openQuickCommand() } })
    }
    function selectLogin(user) {
        document.getElementById('username').value = user; document.getElementById('password').value = '';
        document.querySelectorAll('.account-pick').forEach(b => b.classList.remove('active'));
        const idx = Object.keys(accounts).indexOf(user); if (idx >= 0) document.querySelectorAll('.account-pick')[idx].classList.add('active');
    }
    /* Hàm tiện ích: tính SHA-256 hex bằng Web Crypto API. */
async function _sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function login() {
        const u = document.getElementById('username').value.trim().toLowerCase();
        const p = document.getElementById('password').value;
        const acc = accounts[u];
        if (!acc) { toast('Sai tài khoản hoặc mật khẩu demo. '); return; }
    _sha256hex(p).then(hash => { if (hash !== acc.passHash) { toast('Sai tài khoản hoặc mật khẩu demo. '); return; }
        currentAccount = acc; currentRole = acc.role; activeMetric = 'received'; activeIndicatorRole = allowedRoles()[0]; activeCategoryRole = (acc.role === 'DANG') ? 'ALL' : allowedRoles()[0];
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        renderAll();
        toast(`Đăng nhập ${acc.title}. Áp dụng phân quyền dữ liệu theo tài khoản.`);
    });
    }
    function logout() { currentAccount = null; currentRole = null; closePanelsNotify(); document.getElementById('app').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden') }
    function updateClock() {
        const d = new Date();
        document.getElementById('clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        document.getElementById('dateText').textContent = d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    function openQuickCommand() {
        document.getElementById('modalTitleNotify').textContent = 'Lệnh nhanh IOC/CAD'; document.getElementById('modalSubNotify').textContent = '';
        document.getElementById('modalBodyNotify').innerHTML = `<div class="field"><label>Nhập lệnh</label><input id="quickInput" placeholder="Ví dụ: mở nhiệm vụ quá hạn UBND, giao việc TTHC, văn bản đến sắp hạn..." autofocus /></div><div class="action-bar"><button class="primary" onclick="runQuick()">Chạy lệnh</button><button class="ghost" onclick="setMetric('assigned');closeModalNoti()">Mở nhiệm vụ giao</button><button class="ghost" onclick="setMetric('received');closeModalNoti()">Mở nhiệm vụ nhận</button><button class="ghost" onclick="openList({metric:null,status:'overdue',title:'Tất cả hồ sơ quá hạn'})">Mở quá hạn</button></div>`; openModal(); setTimeout(() => document.getElementById('quickInput')?.focus(), 80)
    }
    function runQuick() { const q = (document.getElementById('quickInput')?.value || '').toLowerCase(); if (q.includes('giao')) openAssignmentForm(); else if (q.includes('quá hạn')) openList({ metric: null, status: 'overdue', title: 'Kết quả lệnh nhanh: quá hạn' }); else if (q.includes('văn bản đến')) { setMetric('docIn'); closeModalNoti() } else if (q.includes('nhiệm vụ nhận')) { setMetric('received'); closeModalNoti() } else { toast('Lệnh demo đã được ghi nhận. Gợi ý: "giao", "quá hạn", "văn bản đến", "nhiệm vụ nhận".') } }

    /* ============================== MODAL / DRAWER / TOAST / CUSTOMIZER ============================== */
    function lockScroll() { document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; }
    function unlockScroll() {
        const drawerOpen = document.getElementById('drawer_notify')?.classList.contains('open');
        const modalOpen = document.querySelector('.modal.open');
        if (!drawerOpen && !modalOpen) { document.body.style.overflow = ''; document.documentElement.style.overflow = ''; }
    }
    function openDrawerNoti() { document.getElementById('overlay_notify').classList.add('show'); document.getElementById('drawer_notify').classList.add('open'); lockScroll(); }
    function closeDrawerNoti() { document.getElementById('drawer_notify').classList.remove('open'); if (!document.getElementById('modal_notify').classList.contains('open')) document.getElementById('overlay_notify').classList.remove('show'); unlockScroll(); }
    function openModal() { document.getElementById('overlay_notify').classList.add('show'); document.getElementById('modal_notify').classList.add('open'); lockScroll(); }
    function closeModalNoti() { document.getElementById('modal_notify').classList.remove('open'); if (!document.getElementById('drawer_notify').classList.contains('open')) document.getElementById('overlay_notify').classList.remove('show'); unlockScroll(); window.__assignmentFilesNoti = []; }
    function closePanelsNotify() { closeDrawerNoti(); closeModalNoti(); document.getElementById('customizer').classList.remove('open') }
    function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(window.__toast); window.__toast = setTimeout(() => t.classList.remove('show'), 3000) }

    function toggleWidgetBody(btn) {
        const box = btn.closest('.widget') || btn.closest('.widget-gd') || btn.closest('.top-overview') || btn.closest('.detail-card') || btn.closest('article') || btn.closest('section');
        if (!box) return;
        let body = box.querySelector('.widget-body') || box.querySelector('.widget-body-gd') || box.querySelector('.top-overview-body') || box.querySelector('.card-body') || box.querySelector('.v12-card-body');
        if (!body) {
            const head = btn.closest('.widget-head') || btn.closest('.top-overview-head') || btn.closest('.card-head') || btn.closest('.iip-head') || btn.closest('header');
            if (head && head.nextElementSibling) body = head.nextElementSibling;
        }
        if (!body) return;
        const isHidden = body.classList.toggle('hidden');
        if (isHidden) {
            body.style.setProperty('visibility', 'hidden', 'important');
            body.style.setProperty('opacity', '0', 'important');
            body.style.setProperty('pointer-events', 'none', 'important');
        } else {
            body.style.removeProperty('visibility');
            body.style.removeProperty('opacity');
            body.style.removeProperty('pointer-events');
        }
        btn.textContent = isHidden ? '＋' : '−';
    }
    const widgetLabels = { summary: 'Tổng quan KPI & chân dung vận hành', indicators: 'Chỉ tiêu từng trục', sources: 'Nguồn dữ liệu', axisDashboard: 'Dashboard xử lý', notifications: 'Notify IOC/CAD & Điều hành CAD', gismap: 'Bản đồ GIS Tương tác – Thành ủy Hà Nội' };
    function prefKey() { return `px-ioc-hidden-${currentRole}` }
    function getHiddenWidgets() { try { return JSON.parse(localStorage.getItem(prefKey()) || '[]') } catch (e) { return [] } }
    function setHiddenWidgets(arr) { localStorage.setItem(prefKey(), JSON.stringify(arr)) }
    function renderCustomizer() { const hidden = getHiddenWidgets(); document.getElementById('customList').innerHTML = Object.keys(widgetLabels).map(k => `<label><input type="checkbox" ${hidden.includes(k) ? '' : 'checked'} onchange="toggleWidgetPref('${k}',this.checked)"/><span><b>${widgetLabels[k]}</b><br/><small class="muted">${hidden.includes(k) ? 'Đang ẩn' : 'Đang hiển thị'}</small></span></label>`).join('') }
    function toggleWidgetPref(k, show) { let hidden = getHiddenWidgets(); if (show) hidden = hidden.filter(x => x !== k); else if (!hidden.includes(k)) hidden.push(k); setHiddenWidgets(hidden); applyWidgetVisibility(); renderCustomizer() }
    function applyWidgetVisibility() { const hidden = getHiddenWidgets(); document.querySelectorAll('[data-widget]').forEach(w => w.classList.toggle('hidden', hidden.includes(w.dataset.widget))); if (!hidden.includes('gismap')) initGisMap(); }
    function toggleCustomizer() { document.getElementById('customizer').classList.toggle('open') }

    /* ============================== MỤC TỔNG QUAN (3 pie donut) ============================== */
    function overviewSvg(segments, total, center, sub, group) {
        total = total || segments.reduce((a, s) => a + (s.value || 0), 0) || 1;
        let angle = 0;
        const paths = segments.map(s => {
            const val = Math.max(0, s.value || 0); const len = val / total * 360; const start = angle; const end = angle + len; angle = end;
            if (!val) return '';
            return `<path class="pie-seg" d="${donutArc(75, 75, 52, start, end)}" fill="none" stroke="${s.color}" stroke-width="18" stroke-linecap="round" onclick="openOverviewPieSegment('${group}','${s.key}')"><title>${s.label}: ${fmt(val)}</title></path>`
        }).join('');
        return `<svg class="pie-donut" viewBox="0 0 150 150"><circle cx="75" cy="75" r="52" fill="none" stroke="#06192c" stroke-width="18"/>${paths}<circle cx="75" cy="75" r="35" fill="#061528" stroke="rgba(87,178,255,.24)"/><text x="75" y="72" text-anchor="middle" class="pie-center">${center}</text><text x="75" y="88" text-anchor="middle" class="pie-sub">${sub}</text></svg>`;
    }
    function pieCard(title, note, segments, group, center, sub, extra = '') {
        const total = segments.reduce((a, s) => a + (s.value || 0), 0);
        const legend = extra || `<div class="pie-legend">${segments.map(s => `<button onclick="openOverviewPieSegment('${group}','${s.key}')"><i style="background:${s.color}"></i><span>${s.label}</span><b>${fmt(s.value || 0)}</b></button>`).join('')}</div>`;
        return `<article class="pie-card"><div><h3>${title}</h3><div class="pie-note">${note}</div></div><div class="pie-card-body"><div class="pie-donut-wrap">${overviewSvg(segments, total, center ?? fmt(total), sub || 'Tổng', group)}</div><div>${legend}</div></div></article>`;
    }
    function totalForRole(role) { return Object.keys(metricMeta).reduce((sum, m) => sum + metricTotal(role, m), 0) }
    function statusAllVisible(status) { return Object.keys(metricMeta).reduce((sum, m) => sum + statusTotal(m, status, allowedRoles()), 0) }

    function renderRoleScope() {
        const el = document.getElementById('roleScopeCards'); if (!el) return;
        el.innerHTML = `<div class="top-overview-head"><div class="top-overview-title">TỔNG QUAN ĐIỀU HÀNH NHIỆM VỤ/VĂN BẢN</div><button class="mini-btn" onclick="toggleWidgetBody(this)">−</button></div><div class="top-overview-body widget-body" id="overviewPieBody"><div class="pie-grid" id="pieGrid"></div></div>`;
    }
    function renderSummary() {
        ensureCalendarEvents(); const roles = allowedRoles();
        const metricSegments = Object.keys(metricMeta).map((m, i) => ({ key: m, label: metricMeta[m].short, value: metricTotalVisible(m), color: ['#2fb174', '#2c7dd2', '#d8a50c', '#8b5cf6'][i] }));
        const statusSegments = statusDefs.map(st => ({ key: st.key, label: st.short, value: statusAllVisible(st.key), color: st.color }));
        const cal = calendarStatusCounts(); const calSegments = [{ key: 'today', label: 'Hôm nay', value: cal.today, color: '#39d5ff' }, { key: 'upcoming', label: 'Sắp diễn ra', value: cal.upcoming, color: '#d8a50c' }, { key: 'late', label: 'Trễ xác nhận', value: cal.late, color: '#d33a44' }, { key: 'planned', label: 'Đã lên lịch', value: cal.planned, color: '#2c7dd2' }, { key: 'done', label: 'Đã hoàn thành', value: cal.done, color: '#2fb174' }];
        const next = getCalendarEventsForScope().filter(e => ['today', 'upcoming', 'late'].includes(eventState(e).key)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
        const secretary = `<div class="secretary-list">${next.map(e => { const st = eventState(e); return `<button class="secretary-row ${st.key === 'late' ? 'danger' : st.key === 'upcoming' ? 'warn' : ''}" onclick="openMeetingDetail('${e.id}')"><span>${st.icon}</span><b>${e.title}</b><small>${eventDateShort(e)} ${e.time}</small></button>` }).join('') || '<div class="muted">Không có lịch cần nhắc.</div>'}<button class="ghost" onclick="openCalendar(null,'Lịch công tác - thư ký điều hành')">Mở calendar</button></div>`;
        const cards = [
            pieCard('Cơ cấu hồ sơ điều hành', 'Nhiệm vụ giao/nhận, văn bản đến/đi trong phạm vi quyền.', metricSegments, 'metric', fmt(metricSegments.reduce((a, s) => a + s.value, 0)), 'Hồ sơ'),
            pieCard('Kết quả xử lý', 'Click trạng thái để lọc bảng đúng số liệu và giao nhiệm vụ.', statusSegments, 'status', fmt(statusSegments.reduce((a, s) => a + s.value, 0)), 'Kết quả'),
            pieCard('Lịch công tác/kỳ họp', 'Vai trò thư ký: ngày/tuần/tháng, lịch sắp họp và lịch trễ.', calSegments, 'calendar', fmt(calSegments.reduce((a, s) => a + s.value, 0)), 'Lịch', secretary)
        ].join('');
        const body = document.getElementById('pieGrid'); if (body) body.innerHTML = cards;
    }
    function openOverviewPieSegment(group, key) {
        if (group === 'metric') {
            activeMetric = key; renderMetricTabs(); renderAxisDashboard();
            document.getElementById('axisDashboardWidget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            openList({ metric: key, title: `${metricMeta[key].label} · ${currentAccount.title}` });
            return;
        }
        if (group === 'status') {
            openList({ metric: null, status: key, title: `${statusMeta(key).label} · toàn bộ phạm vi được xem` });
            return;
        }
        if (group === 'calendar') {
            openCalendar(null, 'Lịch công tác/kỳ họp', key);
            return;
        }
        if (group === 'drawerStatus') { setDrawerPieStatus(key); return; }
        if (group === 'indicatorPie') { setIndicatorStatusFilter(key); return; }
    }

    /* ============================== DASHBOARD KẾT QUẢ XỬ LÝ (mục giữa) ============================== */
    function renderMetricTabs() {
        // BỎ con số trên tab (Nhiệm vụ giao/nhận, Văn bản đến/đi) — số liệu chỉ hiện ở các HẠNG MỤC bên dưới
        // sau khi tải API. Chỉ hiện spinner nhỏ trên tab metric đang tải.
        var anyLoading = Object.keys(metricMeta).some(function (m) { var s = qlnvMetricState[m]; return s && s.loading; });
        if (anyLoading && typeof ensureQlnvDetailStyles === 'function') ensureQlnvDetailStyles();
        document.getElementById('metricTabs').innerHTML = Object.keys(metricMeta).map(function (m) {
            var s = qlnvMetricState[m];
            var busy = (s && s.loading) ? ' <span class="qlnv-syncing" style="display:inline-flex;vertical-align:middle"><span class="sp"></span></span>' : '';
            return '<button class="' + (activeMetric === m ? 'b-mono active' : 'b-mono') + '" onclick="setMetric(\'' + m + '\')">' + metricMeta[m].icon + ' ' + metricMeta[m].label + busy + '</button>';
        }).join('');
    }
    function setMetric(m) {
        activeMetric = m;
        syncActiveQlnvFlags();
        renderMetricTabs();
        renderAxisDashboard();
        // Tải LƯỜI: chỉ khi CHUYỂN sang metric QLNV (nhiệm vụ giao/nhận) chưa tải mới gọi API tương ứng.
        if (isQlnvConfigured() && qlnvMetricHasEndpoint(m)) {
            var s = qlnvStateOf(m);
            if (!s.loaded && !s.loading) loadQlnvMetric(m);
        }
    }
    function renderAxisDashboard() {
        const roles = allowedRoles();
        document.getElementById('axisDashboardTitle').textContent = `${metricMeta[activeMetric].label.toUpperCase()} THEO TRỤC`;
        const total = metricTotalVisible(activeMetric);
        const actionTitle = activeMetric === 'assigned' ? 'Giao nhiệm vụ theo trục' : activeMetric === 'received' ? 'Xử lý nhiệm vụ nhận' : activeMetric === 'docIn' ? 'Xử lý văn bản đến' : 'Theo dõi văn bản đi';
        const qlnvCount = window.__qlnvList ? window.__qlnvList.length : 0;
        document.getElementById('axisActions').innerHTML = ` <div class="axis-action-card"><h4>${metricMeta[activeMetric].icon} ${actionTitle}</h4><div class="axis-action-buttons"><button class="primary" onclick="openAssignmentForm(${(activeMetric === 'docIn' || activeMetric === 'docOut') ? `'${activeMetric}'` : 'null'})">＋ Giao nhiệm vụ</button><button class="ghost danger-btn" onclick="openList({metric:'${activeMetric}',status:'risk',title:'Nguy cơ trễ hạn · ${metricMeta[activeMetric].short}'})">Nhắc nguy cơ trễ</button></div></div>`;
        const top = statusDefs.map(st => {
            const n = statusTotal(activeMetric, st.key, roles);
            return `<button class="seg-kpi" onclick="openList({metric:'${activeMetric}',status:'${st.key}',title:'${st.label} - ${metricMeta[activeMetric].short}'})"><span>${st.label}</span><b class="mono" style="color:${st.color}">${fmt(n)}</b><span>${pct(n, total)}</span></button>`
        }).join('');
        document.getElementById('segKpis').innerHTML = top;
        // Trạng thái nguồn QLNV của metric đang xem: đang tải (spinner) / lỗi (retry) / chưa phân trục (note).
        var qlnvConfigured = (typeof isQlnvConfigured === 'function' && isQlnvConfigured());
        var qlnvLoading = (typeof qlnvApiLoading !== 'undefined' && qlnvApiLoading && qlnvConfigured);
        var qlnvErr = (qlnvConfigured && !qlnvLoading && qlnvApiError && qlnvMetricHasEndpoint(activeMetric)) ? String(qlnvApiError) : '';
        if ((qlnvLoading || qlnvErr) && typeof ensureQlnvDetailStyles === 'function') ensureQlnvDetailStyles();
        var qlnvStrip = '';
        if (qlnvLoading) {
            qlnvStrip = '<div class="qlnv-syncing" style="display:flex;align-items:center;gap:8px;padding:9px 12px;margin-bottom:10px;border:1px dashed rgba(87,178,255,.4);border-radius:8px;color:#8fb8dd;font-size:13px"><span class="sp"></span> Đang tải nhiệm vụ từ QLNV… (tạm hiển thị 0)</div>';
        } else if (qlnvErr) {
            qlnvStrip = '<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;margin-bottom:10px;border:1px solid rgba(230,140,90,.5);border-radius:8px;color:#e6a07a;font-size:13px">⚠ Lỗi tải ' + esc(String((metricMeta[activeMetric] || {}).label || activeMetric)) + ': ' + esc(qlnvErr) + ' <button class="ghost" style="margin-left:auto" onclick="retryQlnvMetric(\'' + activeMetric + '\')">Thử lại</button></div>';
        }
        var unresolved = (typeof qlnvUnresolvedAxis !== 'undefined' && qlnvUnresolvedAxis[activeMetric]) || 0;
        if (unresolved > 0) {
            qlnvStrip += '<div style="padding:7px 12px;margin-bottom:10px;border:1px dashed rgba(216,165,12,.5);border-radius:8px;color:#d8a50c;font-size:12.5px">⚠ ' + fmt(unresolved) + ' nhiệm vụ chưa xác định được trục (thiếu bảng mã đơn vị) — tạm xếp ' + esc((axisMeta[QLNV_DEFAULT_ROLE] || {}).name || QLNV_DEFAULT_ROLE) + '.</div>';
        }
        document.getElementById('axisRows').innerHTML = qlnvStrip + roles.map(role => {
            const data = segmentTemplate[role][activeMetric]; const rowTotal = sumObj(data);
            const segs = statusDefs.map(st => {
                const n = data[st.key] || 0; const w = rowTotal ? n / rowTotal * 100 : 0;
                return `<button class="seg ${n ? '' : 'zero'}" title="${axisMeta[role].name} · ${st.label}: ${n}" style="width:${w}%;background:${st.color}" onclick="openList({metric:'${activeMetric}',role:'${role}',status:'${st.key}',title:'${axisMeta[role].name} · ${st.label}'})">${n ? fmt(n) : ''}</button>`
            }).join('');
            return `<div class="axis-row"><button class="axis-label" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${axisMeta[role].icon} ${axisMeta[role].name}</button><div class="bar">${segs}</div><button class="axis-total mono" onclick="openList({metric:'${activeMetric}',role:'${role}',title:'${axisMeta[role].name} · ${metricMeta[activeMetric].label}'})">${fmt(rowTotal)}</button></div>`
        }).join('');
        document.getElementById('legend').innerHTML = statusDefs.map(s => `<span><i class="sw" style="background:${s.color}"></i>${s.label}</span>`).join('')
    }

    /* ============================== DRAWER DANH SÁCH (cấp 1, có pie) ============================== */
    /* Metric do QLNV làm chủ = metric có endpoint (received/assigned + docIn/docOut). indicator vẫn demo. */
    function isQlnvOwnedMetric(m) { return qlnvMetricHasEndpoint(m); }
    function openList(opts) {
        const { metric = null, role = null, status = null, title = 'Danh sách' } = opts || {};
        // received/assigned có endpoint QLNV -> popup phải lấy từ API (không mock).
        var qlnvMetric = isQlnvOwnedMetric(metric) && isQlnvConfigured() && qlnvMetricHasEndpoint(metric);
        qlnvDrawerMetric = qlnvMetric ? metric : null;   // cho nút "Thử lại" trong popup lỗi
        qlnvLastListOpts = opts || {};
        // Click hạng mục (Hoàn thành/Đang thực hiện/Thường xuyên…) mà metric CHƯA tải -> GỌI API ngay,
        // hiện spinner trong popup; tải xong tự render lại đúng số liệu API.
        if (qlnvMetric) {
            var s0 = qlnvStateOf(metric);
            if (!s0.loaded && !s0.loading) {
                var token = metric + '|' + (role || '') + '|' + (status || '');
                window.__qlnvListToken = token;
                loadQlnvMetric(metric).then(function () {
                    var open = document.getElementById('drawer_notify') && document.getElementById('drawer_notify').classList.contains('open');
                    if (open && window.__qlnvListToken === token) openList(opts);   // render lại popup với dữ liệu API
                });
            }
        }
        let base = records.filter(r => canSeeRole(r.role));
        if (metric) base = base.filter(r => r.metric === metric);
        if (role) base = base.filter(r => r.role === role);
        // Đã cấu hình QLNV: popup nhiệm vụ CHỈ hiển thị bản ghi API (__qlnv), không bao giờ hiện mock sót.
        if (qlnvMetric) base = base.filter(function (r) { return r.__qlnv; });
        currentDrawerRecords = base;
        drawerPieStatus = status || '';
        document.getElementById('drawerTitleNotify').textContent = title;
        const selected = drawerPieStatus ? ` · ${statusMeta(drawerPieStatus).label}` : '';
        // Trạng thái nguồn QLNV của ĐÚNG metric này để popup phản ánh: đang tải / lỗi / rỗng.
        var st = qlnvMetric ? qlnvStateOf(metric) : null;
        var qlnvState = st ? (st.loading ? 'loading' : (st.error && !base.length ? 'error' : '')) : '';
        if (qlnvState === 'error') qlnvApiError = st.error;   // để renderDrawerList hiển thị đúng lỗi
        document.getElementById('drawerSubNotify').textContent = qlnvState === 'loading'
            ? 'Đang tải từ QLNV…'
            : `${fmt(base.length)} bản ghi${selected}`;
        renderDrawerList(base, qlnvState);
        openDrawerNoti();
    }
    function drawerCounts() { return statusDefs.map(st => ({ key: st.key, label: st.label, short: st.short, color: st.color, count: currentDrawerRecords.filter(r => r.status === st.key).length })) }
    function renderDrawerPie() {
        const counts = drawerCounts(); const total = counts.reduce((a, c) => a + c.count, 0) || 1;
        const segs = counts.map(c => ({ key: c.key, label: c.short, value: c.count, color: c.color }));
        const active = drawerPieStatus ? counts.find(c => c.key === drawerPieStatus)?.count || 0 : total;
        document.getElementById('drawerPieSvg').innerHTML = overviewSvg(segs, total, fmt(active), drawerPieStatus ? statusMeta(drawerPieStatus).short : 'Tổng', 'drawerStatus');
        document.getElementById('drawerPieLegend').innerHTML = counts.map(c => `<button class="${drawerPieStatus === c.key ? 'active' : ''}" onclick="setDrawerPieStatus('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
    }
    function setDrawerPieStatus(st) { drawerPieStatus = st || ''; const sel = document.getElementById('statusFilter'); if (sel) sel.value = drawerPieStatus; renderDrawerPie(); applyDrawerFilters(); }
    function renderDrawerList(rs, qlnvState) {
        const body = document.getElementById('drawerBodyNotify');
        // Nguồn QLNV đang tải/lỗi -> hiện rõ trong popup, KHÔNG render danh sách (tránh nhìn nhầm mock cũ).
        if (qlnvState === 'loading') {
            if (typeof ensureQlnvDetailStyles === 'function') ensureQlnvDetailStyles();
            body.innerHTML = '<div class="qlnv-syncing" style="padding:26px 20px;font-size:14px"><span class="sp"></span> Đang tải nhiệm vụ từ QLNV…</div>';
            return;
        }
        if (qlnvState === 'error') {
            body.innerHTML = '<div class="access-lock" style="margin:20px;display:flex;flex-direction:column;gap:12px;align-items:flex-start">'
                + '<span>Không tải được nhiệm vụ từ QLNV' + (qlnvApiError ? (' (' + esc(String(qlnvApiError)) + ')') : '') + '. Kiểm tra đăng nhập/kết nối rồi thử lại.</span>'
                + '<button class="primary" onclick="retryDrawerQlnv()">↻ Thử lại</button></div>';
            return;
        }
        const roles = [...new Set(rs.map(r => r.role))];
        body.innerHTML = `<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="drawerPieSvg"></div><button class="ghost" onclick="setDrawerPieStatus('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý</h4><div class="pie-legend" id="drawerPieLegend"></div><div class="action-bar"><button class="primary" onclick="openAssignmentForm()">＋ Giao nhiệm vụ tương ứng</button></div></div></div><div class="filters"><input id="qFilter" placeholder="Tìm mã, tiêu đề, lĩnh vực..." oninput="applyDrawerFilters()"/><select id="roleFilter" onchange="applyDrawerFilters()"><option value="">Tất cả trục</option>${roles.map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('')}</select><select id="statusFilter" onchange="setDrawerPieStatus(this.value)"><option value="">Tất cả trạng thái</option>${statusDefs.map(s => `<option value="${s.key}" ${drawerPieStatus === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}</select><select id="metricFilter" onchange="applyDrawerFilters()"><option value="">Tất cả loại</option>${Object.keys(metricMeta).map(m => `<option value="${m}">${metricMeta[m].label}</option>`).join('')}</select></div><div class="list-summary" id="listSummary"></div><div id="recordList"></div>`;
        renderDrawerPie(); applyDrawerFilters();
    }
    function applyDrawerFilters() {
        const q = (document.getElementById('qFilter')?.value || '').toLowerCase();
        const role = document.getElementById('roleFilter')?.value || ''; const status = document.getElementById('statusFilter')?.value || drawerPieStatus || ''; const metric = document.getElementById('metricFilter')?.value || '';
        drawerPieStatus = status;
        const rs = currentDrawerRecords.filter(r => (!role || r.role === role) && (!status || r.status === status) && (!metric || r.metric === metric) && (!q || [r.id, r.title, r.field, r.unit, r.creator, r.receiver].join(' ').toLowerCase().includes(q)));
        const done = rs.filter(r => r.status === 'done').length, risk = rs.filter(r => r.status === 'risk').length, overdue = rs.filter(r => r.status === 'overdue').length;
        document.getElementById('listSummary').innerHTML = `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge">Tổng nền: ${fmt(currentDrawerRecords.length)}</span><span class="badge ok">Hoàn thành: ${fmt(done)}</span><span class="badge warn">Nguy cơ: ${fmt(risk)}</span><span class="badge red">Quá hạn: ${fmt(overdue)}</span><button class="ghost" onclick="openAssignmentForm()">＋ Giao nhiệm vụ nhánh</button>`;
        document.getElementById('recordList').innerHTML = rs.map(r => recordRowHtml(r)).join('') || '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>';
    }
    function recordRowHtml(r) {
        const st = statusMeta(r.status); const limited = isLimitedRole(r.role);
        return `<button class="record-row" onclick="openRecordDetail('${r.id}')"><div><b class="mono">${esc(r.id)}</b><small>${metricMeta[r.metric].short}</small></div><div class="wrap"><div class="title">${limited ? '[Tổng hợp] ' : ''}${esc(r.title)}</div><small>${axisMeta[r.role].icon} ${axisMeta[r.role].name} · ${esc(r.field)} · ${esc(r.unit)}</small></div><div><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></div><div><small>Hạn</small><b>${esc(r.due)}</b></div><div><small>Tiến độ</small><div class="progress"><i style="width:${Number(r.progress) || 0}%"></i></div><b class="mono">${Number(r.progress) || 0}%</b></div></button>`
    }

    /* ============================== KỊCH BẢN XỬ LÝ (dùng chung hồ sơ + chỉ tiêu) ============================== */
    const CUSTOM_SCENARIO_KEY = 'px-ioc-custom-scenarios-v15';
    const SCENARIO_PROCESS_STEP_NAMES = ['Thu thập & đồng bộ dữ liệu', 'Phân tích, đối chiếu, phát hiện bất thường', 'Cảnh báo', 'Đề xuất phương án xử lý', 'Theo dõi kết quả & báo cáo'];
    const SCENARIO_LEVEL_OPTIONS = ['Cao', 'Khẩn', 'Trung bình', 'Bình thường'];
    const SCENARIO_LEVEL_API_VALUES = {
        'Cao': 'Cao',
        'Khẩn': 'Khan',
        'Trung bình': 'Trungbinh',
        'Bình thường': 'Binhthuong'
    };
    const SCENARIO_LEVEL_UI_LABELS = {
        'Cao': 'Cao',
        'Khan': 'Khẩn',
        'Trungbinh': 'Trung bình',
        'Binhthuong': 'Bình thường'
    };
    function normalizeScenarioLevelToApi(level) {
        return SCENARIO_LEVEL_API_VALUES[level] || level || 'Trungbinh';
    }
    function normalizeScenarioLevelFromApi(level) {
        return SCENARIO_LEVEL_UI_LABELS[level] || level || 'Trung bình';
    }
    /* ============================== SCENARIO API STATE ============================== */
    var scenarioApiState = {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        filters: { key: '', title: '', level: '' },
        loading: false,
        error: null,
        loaded: false,
        inflight: null
    };
    var scenarioDetailState = {
        active: null,
        cache: {},
        loading: false,
        error: null
    };
    var scenarioFilterDebounceTimer = null;

    /* ============================== ASSIGNMENT CATALOG STATE (dùng chung) ============================== */
    var assignmentCatalogState = {
        owners: [],
        coordinators: [],
        priorityOptions: [
            { value: 1, label: 'Rất cao' },
            { value: 2, label: 'Cao' },
            { value: 3, label: 'Trung bình' },
            { value: 4, label: 'Thấp' },
            { value: 5, label: 'Rất thấp' }
        ],
        urgencyOptions: [],
        confidentialityOptions: [
            { value: 'Bình thường', label: 'Bình thường' },
            { value: 'Mật', label: 'Mật' },
            { value: 'Tối mật', label: 'Tối mật' }
        ],
        loading: {
            owners: false,
            coordinators: false,
            priority: false,
            urgency: false,
            confidentiality: false
        },
        errors: {
            owners: null,
            coordinators: null,
            priority: null,
            urgency: null,
            confidentiality: null
        }
    };

    function normalizePriorityValue(value) {
        var num = Number(value);
        if (num >= 1 && num <= 5) return num;
        var text = String(value || '').trim().toLowerCase();
        if (text === 'rất cao') return 1;
        if (text === 'cao') return 2;
        if (text === 'trung bình') return 3;
        if (text === 'thấp') return 4;
        if (text === 'rất thấp') return 5;
        return 3;
    }

    function getPriorityLabel(value) {
        var priority = normalizePriorityValue(value);
        var found = assignmentCatalogState.priorityOptions.find(function (option) {
            return option.value === priority;
        });
        return found ? found.label : 'Trung bình';
    }

    function getAssignmentPriorityOptions() {
        return assignmentCatalogState.priorityOptions;
    }

    function getAssignmentUrgencyOptions() {
        return assignmentCatalogState.urgencyOptions;
    }

    function getAssignmentConfidentialityOptions() {
        return assignmentCatalogState.confidentialityOptions;
    }

    function getAssignmentOwnerOptions() {
        return assignmentCatalogState.owners || [];
    }

    function getAssignmentCoordinatorOptions() {
        return getCoordinatorOptionsFromAdministrativeUnits();
    }

    function renderPriorityOptionsHtml(selectedValue) {
        var opts = getAssignmentPriorityOptions();
        var selected = normalizePriorityValue(selectedValue);
        return opts.map(function (o) {
            return '<option value="' + o.value + '"' + (o.value === selected ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('');
    }

    function renderUrgencyOptionsHtml(selectedValue) {
        var opts = getAssignmentUrgencyOptions();
        var selected = selectedValue || 'Thường';
        if (assignmentCatalogState.loading.urgency && !opts.length) {
            return '<option value="">Đang tải độ khẩn...</option>';
        }
        if (assignmentCatalogState.errors.urgency && !opts.length) {
            return '<option value="">Lỗi tải độ khẩn</option>';
        }
        if (!opts.length) {
            return '<option value="">Không có dữ liệu danh mục.</option>';
        }
        return opts.map(function (o) {
            return '<option value="' + o.value + '"' + (o.value === selected ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('');
    }

    function renderConfidentialityOptionsHtml(selectedValue) {
        var opts = getAssignmentConfidentialityOptions();
        var selected = selectedValue || 'Bình thường';
        if (assignmentCatalogState.loading.confidentiality && !opts.length) {
            return '<option value="">Đang tải độ mật...</option>';
        }
        if (assignmentCatalogState.errors.confidentiality && !opts.length) {
            return '<option value="">Lỗi tải độ mật</option>';
        }
        if (!opts.length) {
            return '<option value="">Không có dữ liệu danh mục.</option>';
        }
        return opts.map(function (o) {
            return '<option value="' + o.value + '"' + (o.value === selected ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('');
    }

    function loadAssignmentCatalogs(forceReset) {
        assignmentCatalogState.loading.owners = true;
        assignmentCatalogState.loading.coordinators = true;
        assignmentCatalogState.loading.urgency = true;
        assignmentCatalogState.loading.priority = false;
        assignmentCatalogState.loading.confidentiality = false;
        assignmentCatalogState.errors.owners = null;
        assignmentCatalogState.errors.coordinators = null;
        assignmentCatalogState.errors.urgency = null;
        return Promise.allSettled([loadCrmStatusMapping(), loadAdministrativeUnits(forceReset)]).then(function (results) {
            if (results[0].status === 'rejected') {
                assignmentCatalogState.errors.urgency = results[0].reason || new Error('Không tải được độ khẩn.');
            }
            assignmentCatalogState.urgencyOptions = (window.__crmUrgencyOptions || []).map(function (item) {
                return { value: item, label: item };
            });
            assignmentCatalogState.coordinators = getCoordinatorOptionsFromAdministrativeUnits();
            if (!assignmentCatalogState.coordinators.length && assignmentCatalogState.errors.owners) {
                assignmentCatalogState.errors.coordinators = assignmentCatalogState.errors.owners;
            }
            return assignmentCatalogState;
        }).finally(function () {
            assignmentCatalogState.loading.owners = false;
            assignmentCatalogState.loading.coordinators = false;
            assignmentCatalogState.loading.urgency = false;
            refreshScenarioTaskCatalogControls();
        });
    }

    function setSelectOptionsPreserveValue(selectId, html, fallbackValue) {
        var select = document.getElementById(selectId);
        if (!select) return;
        var currentValue = select.value;
        select.innerHTML = html;
        if (currentValue && Array.from(select.options).some(function (option) { return option.value === currentValue; })) {
            select.value = currentValue;
        } else if (fallbackValue && Array.from(select.options).some(function (option) { return option.value === fallbackValue; })) {
            select.value = fallbackValue;
        }
    }

    function refreshScenarioTaskCatalogControls() {
        setSelectOptionsPreserveValue('nsTaskPriority', renderPriorityOptionsHtml(3), '3');
        setSelectOptionsPreserveValue('nsTaskUrgency', renderUrgencyOptionsHtml('Thường'), 'Thường');
        setSelectOptionsPreserveValue('nsTaskSecrecy', renderConfidentialityOptionsHtml('Bình thường'), 'Bình thường');
        renderNsOwnerList();
        renderNsCoordOptions();
    }

    /* ============================== SCENARIO API ADAPTERS ============================== */
    function scenarioApiToUi(apiScenario) {
        if (!apiScenario) return null;
        return {
            _id: apiScenario._id,
            key: apiScenario.key,
            title: apiScenario.title || '',
            level: normalizeScenarioLevelFromApi(apiScenario.level) || 'Trung bình',
            desc: apiScenario.desc || '',
            objective: apiScenario.objective || '',
            scope: apiScenario.scope || '',
            process: Array.isArray(apiScenario.process) ? apiScenario.process : [],
            expectedResults: Array.isArray(apiScenario.expectedResults) ? apiScenario.expectedResults : [],
            sla: Array.isArray(apiScenario.sla) ? apiScenario.sla : [],
            tasks: Array.isArray(apiScenario.tasks) ? apiScenario.tasks.map(scenarioTaskApiToUi) : [],
            isDefault: !!apiScenario.isDefault,
            createdAt: apiScenario.createdAt || '',
            updatedAt: apiScenario.updatedAt || '',
            ctx: apiScenario.ctx || 'general',
            id: apiScenario.id || null
        };
    }

    function scenarioTaskApiToUi(apiTask) {
        if (!apiTask) return null;
        var ownerId = apiTask.ownerId || apiTask.donViChuTri || apiTask.owner || '';
        var ownerLabel = apiTask.ownerLabel || apiTask.donViChuTriLabel || apiTask.owner || apiTask.donViChuTri || '';
        var coordinatorIds = Array.isArray(apiTask.coordinators)
            ? apiTask.coordinators
            : (Array.isArray(apiTask.donViThucHien) ? apiTask.donViThucHien : []);
        var coordinatorLabels = Array.isArray(apiTask.coordinatorLabels)
            ? apiTask.coordinatorLabels
            : (Array.isArray(apiTask.donViThucHienLabels) ? apiTask.donViThucHienLabels : coordinatorIds);
        return {
            maNhiemVuNhanh: apiTask.maNhanh || apiTask.taskCode || '',
            tenNhiemVu: apiTask.name || apiTask.tenNhiemVu || '',
            noiDungNhiemVu: apiTask.content || apiTask.noiDungNhiemVu || '',
            donViChuTri: ownerId,
            donViChuTriLabel: ownerLabel,
            donViThucHien: coordinatorIds,
            donViThucHienLabels: coordinatorLabels,
            priority: normalizePriorityValue(apiTask.priority),
            doKhan: apiTask.urgency || apiTask.doKhan || 'Thường',
            doMat: apiTask.secrecy || apiTask.doMat || 'Bình thường',
            ngayChiDao: toScenarioIsoDate(apiTask.startDate || apiTask.ngayChiDao),
            ngayHetHan: toScenarioIsoDate(apiTask.dueDate || apiTask.ngayHetHan)
        };
    }

    function scenarioTaskUiToApi(taskDraft) {
        var task = buildScenarioTaskDraftObject(taskDraft);
        if (!task || !task.tenNhiemVu) return null;
        return {
            tenNhiemVu: task.tenNhiemVu,
            noiDungNhiemVu: task.noiDungNhiemVu || '',
            donViChuTri: task.donViChuTri || null,
            donViThucHien: Array.isArray(task.donViThucHien) ? task.donViThucHien : [],
            doKhan: task.doKhan || 'Thường',
            doMat: task.doMat || 'Bình thường',
            priority: normalizePriorityValue(task.priority),
            ngayChiDao: task.ngayChiDao || '',
            ngayHetHan: task.ngayHetHan || ''
        };
    }

    function getScenarioErrorMessage(error) {
        if (!error) return 'Lỗi không xác định';
        var code = error.body?.code || error.body?.errorCode || error.body?.error?.code || error.message;
        var msg = '';
        switch (code) {
            case 'SCENARIO_TITLE_REQUIRED': msg = 'Tên kịch bản là bắt buộc.'; break;
            case 'SCENARIO_TITLE_TOO_SHORT': msg = 'Tên kịch bản phải có ít nhất 5 ký tự.'; break;
            case 'SCENARIO_TITLE_TOO_LONG': msg = 'Tên kịch bản không được quá 200 ký tự.'; break;
            case 'SCENARIO_KEY_INVALID_FORMAT': msg = 'Mã kịch bản chỉ được chứa chữ cái thường, số và dấu gạch dưới.'; break;
            case 'SCENARIO_KEY_DUPLICATE': msg = 'Mã kịch bản đã tồn tại.'; break;
            case 'SCENARIO_LEVEL_INVALID': msg = 'Mức độ kịch bản không hợp lệ.'; break;
            case 'SCENARIO_DESC_TOO_LONG': msg = 'Mô tả không được quá 500 ký tự.'; break;
            case 'SCENARIO_OBJECTIVE_TOO_LONG': msg = 'Mục tiêu không được quá 1000 ký tự.'; break;
            case 'SCENARIO_SCOPE_TOO_LONG': msg = 'Phạm vi không được quá 1000 ký tự.'; break;
            case 'SCENARIO_PROCESS_STEP_INVALID': msg = 'Quy trình vận hành không hợp lệ.'; break;
            case 'SCENARIO_PROCESS_STEP_DUPLICATE': msg = 'Các bước quy trình bị trùng lặp.'; break;
            case 'SCENARIO_PROCESS_DESC_TOO_LONG': msg = 'Mô tả bước quy trình quá dài.'; break;
            case 'SCENARIO_EXPECTED_RESULT_LIMIT_EXCEEDED': msg = 'Vượt quá số lượng kết quả mong đợi cho phép (tối đa 20).'; break;
            case 'SCENARIO_EXPECTED_RESULT_TOO_LONG': msg = 'Kết quả mong đợi quá dài (tối đa 300 ký tự).'; break;
            case 'SCENARIO_SLA_LIMIT_EXCEEDED': msg = 'Vượt quá số lượng SLA cho phép (tối đa 10).'; break;
            case 'SCENARIO_SLA_TOO_LONG': msg = 'Mô tả SLA quá dài (tối đa 300 ký tự).'; break;
            case 'SCENARIO_TASKS_LIMIT_EXCEEDED': msg = 'Vượt quá số lượng nhiệm vụ nhánh cho phép (tối đa 20).'; break;
            case 'SCENARIO_TASK_NAME_REQUIRED': msg = 'Tên nhiệm vụ nhánh là bắt buộc.'; break;
            case 'SCENARIO_TASK_NAME_TOO_LONG': msg = 'Tên nhiệm vụ nhánh quá dài (tối đa 200 ký tự).'; break;
            case 'SCENARIO_TASK_CONTENT_TOO_LON': msg = 'Nội dung nhiệm vụ nhánh quá dài (tối đa 1000 ký tự).'; break;
            case 'SCENARIO_TASK_PRIORITY_INVALID': msg = 'Mức độ quan trọng không hợp lệ.'; break;
            case 'SCENARIO_TASK_URGENCY_INVALID': msg = 'Độ khẩn không hợp lệ.'; break;
            case 'SCENARIO_TASK_START_DATE_INVALID': msg = 'Ngày bắt đầu không hợp lệ.'; break;
            case 'SCENARIO_TASK_DUE_DATE_INVALID': msg = 'Hạn hoàn thành không hợp lệ.'; break;
            case 'SCENARIO_TASK_DATE_RANGE_INVALID': msg = 'Hạn hoàn thành không được nhỏ hơn ngày bắt đầu.'; break;
            case 'SCENARIO_TASK_COORDINATOR_DUPLICATE': msg = 'Đơn vị phối hợp bị trùng lặp.'; break;
            case 'CTX_INVALID': msg = 'Ngữ cảnh kịch bản không hợp lệ.'; break;
            case 'RESOURCE_ID_REQUIRED': msg = 'ID hồ sơ/chỉ tiêu/lĩnh vực là bắt buộc.'; break;
            case 'SCENARIO_NOT_FOUND': msg = 'Không tìm thấy kịch bản.'; break;
            case 'FORBIDDEN': msg = 'Không có quyền thực hiện thao tác này.'; break;
            default: msg = error.body?.message || error.message || 'Lỗi không xác định';
        }
        return msg;
    }

    function invalidateScenarioCache() {
        scenarioApiState.loaded = false;
        scenarioApiState.items = [];
        scenarioApiState.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    }

    async function loadScenariosFromApi(page, filters) {
        if (scenarioApiState.loading) return null;
        scenarioApiState.loading = true;
        scenarioApiState.error = null;
        try {
            /* Chờ có id đơn vị trước khi hỏi danh sách: thiếu ?organizationId= thì BE chỉ
               trả phần dùng chung (5 kịch bản mặc định), mất hết kịch bản của đơn vị. */
            if (typeof window.qlnvLoadScenarioLinhVuc === 'function') {
                await window.qlnvLoadScenarioLinhVuc();
            }
            var params = { page: page || 1, limit: 20 };
            if (filters) {
                if (filters.key) params.key = filters.key;
                if (filters.title) params.title = filters.title;
                if (filters.level) params.level = normalizeScenarioLevelToApi(filters.level);
            }
            var res = await QlnvApiNotify.listScenarios(params);
            var data = res?.data || [];
            var rawPagination = res?.pagination || {};
            var total = Number(
                rawPagination.total != null ? rawPagination.total
                    : rawPagination.totalItems != null ? rawPagination.totalItems
                        : rawPagination.count != null ? rawPagination.count
                            : data.length
            ) || data.length;
            var limit = Number(rawPagination.limit != null ? rawPagination.limit : params.limit) || params.limit || 20;
            var currentPage = Number(rawPagination.page != null ? rawPagination.page : params.page) || params.page || 1;
            var totalPages = Number(rawPagination.totalPages != null ? rawPagination.totalPages : Math.ceil(total / Math.max(limit, 1))) || 1;
            var pagination = { page: currentPage, limit: limit, total: total, totalPages: totalPages };
            scenarioApiState.items = data.map(scenarioApiToUi);
            scenarioApiState.pagination = pagination;
            scenarioApiState.loaded = true;
            return scenarioApiState;
        } catch (err) {
            scenarioApiState.error = err;
            console.error('Failed to load scenarios from API:', err);
            return null;
        } finally {
            scenarioApiState.loading = false;
        }
    }

    function loadCustomScenarios() { try { return JSON.parse(localStorage.getItem(CUSTOM_SCENARIO_KEY) || '{}') } catch (e) { return {} } }
    function saveCustomScenarios(obj) { localStorage.setItem(CUSTOM_SCENARIO_KEY, JSON.stringify(obj || {})) }
    function scenarioTemplates() { return Object.assign({}, DEFAULT_SCENARIOS, loadCustomScenarios()) }

    function getAllScenarios() {
        var result = {};
        Object.assign(result, DEFAULT_SCENARIOS);
        var custom = loadCustomScenarios();
        Object.assign(result, custom);
        if (scenarioApiState.loaded && scenarioApiState.items && scenarioApiState.items.length) {
            scenarioApiState.items.forEach(function (apiScenario) {
                if (apiScenario && apiScenario.key) {
                    result[apiScenario.key] = apiScenario;
                }
            });
        }
        return result;
    }

    function formatScenarioDisplayDate(value) {
        var iso = toScenarioIsoDate(value);
        if (!iso) return '';
        var parts = iso.split('-');
        return parts.length === 3 ? [parts[2], parts[1], parts[0]].join('/') : iso;
    }
    function scenarioLevelBadgeClass(level) {
        return level === 'Khẩn' ? 'red' : level === 'Cao' ? 'warn' : 'ok';
    }
    /* getAllScenarios() đã tự gộp DEFAULT_SCENARIOS + tuỳ biến local + scenarioApiState.items (nếu đã tải) —
       trước đây khi isQlnvConfigured() nhánh này chỉ đọc thẳng scenarioApiState.items, bỏ qua 5 kịch bản mặc
       định cục bộ nếu backend chưa seed đúng key -> mất kịch bản mặc định ở màn "chi tiết nhiệm vụ"/"giao
       nhiệm vụ nhánh" dù màn "Nhập notify" (dùng scenarioTemplates(), luôn local) vẫn thấy đủ 5. */
    function getScenarioSourceMap() {
        return getAllScenarios();
    }
    function getScenarioByRef(ref) {
        if (!ref) return null;
        var active = scenarioDetailState.active;
        if (active && active.scenario && (active.key === ref || active.detailRef === ref || active.scenario.key === ref || active.scenario._id === ref)) return active.scenario;
        if (scenarioDetailState.cache[ref]) return scenarioDetailState.cache[ref];
        if (Array.isArray(scenarioApiState.items)) {
            var found = scenarioApiState.items.find(function (item) {
                return item && (item.key === ref || item._id === ref);
            });
            if (found) return found;
        }
        var sourceMap = getScenarioSourceMap();
        return sourceMap[ref] || null;
    }
    function getScenarioDetailRef(scenarioOrKey) {
        if (!scenarioOrKey) return '';
        if (typeof scenarioOrKey === 'string') {
            var found = getScenarioByRef(scenarioOrKey);
            return found ? String(found._id || found.key || scenarioOrKey) : String(scenarioOrKey);
        }
        return String(scenarioOrKey._id || scenarioOrKey.key || '');
    }
    function getScenarioByKey(key) {
        if (!key) return null;
        var active = scenarioDetailState.active;
        if (active && active.scenario && active.scenario.key === key) return active.scenario;
        if (scenarioDetailState.cache[key]) return scenarioDetailState.cache[key];
        var sourceMap = getScenarioSourceMap();
        return sourceMap[key] || null;
    }
    function getScenarioTitleByKey(key) {
        var scenario = getScenarioByKey(key);
        return scenario ? scenario.title : key;
    }
    function getScenarioSelectionMeta(ctx, id) {
        if (ctx === 'indicator') {
            var ind = indicatorRecords.find(function (x) { return x.id === id; });
            if (!ind) return null;
            var indStatus = statusMeta(ind.status);
            return {
                title: 'Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh',
                sub: ind.id + ' · ' + ind.indicator,
                headerHtml: '<div class="scenario-history-badge"><b>Trạng thái chỉ tiêu:</b> <span style="color:' + indStatus.color + '">' + esc(indStatus.label) + '</span> · Tiến độ ' + esc(ind.progress) + '% · Nguồn ' + esc(ind.source) + ' · Tần suất ' + esc(ind.freq) + '. Chọn 01 kịch bản để tạo nhiệm vụ nhánh.</div>',
                backFnName: 'openIndicatorDetail',
                backFnArg: id,
                backLabel: 'Quay lại chi tiết chỉ tiêu'
            };
        }
        if (ctx === 'field') {
            var target = fieldTarget(id);
            if (!target.cat) return null;
            return {
                title: 'Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh',
                sub: axisMeta[target.role].name + ' · ' + target.label,
                headerHtml: '<div class="scenario-history-badge"><b>' + esc(target.scope === 'item' ? 'Chỉ tiêu' : 'Lĩnh vực') + ':</b> ' + esc(target.label) + '. Chọn 01 kịch bản để tạo nhiệm vụ nhánh.</div>',
                backFnName: 'openFieldSource',
                backFnArg: id,
                backLabel: 'Quay lại ' + (target.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực')
            };
        }
        var record = records.find(function (x) { return x.id === id; });
        if (!record) return null;
        var recordStatus = statusMeta(record.status);
        return {
            title: 'Chọn kịch bản xử lý trước khi giao nhiệm vụ nhánh',
            sub: record.id + ' · ' + record.title,
            headerHtml: '<div class="scenario-history-badge"><b>Trạng thái hồ sơ chính:</b> <span style="color:' + recordStatus.color + '">' + esc(recordStatus.label) + '</span> · Tiến độ ' + esc(record.progress) + '% · Hạn ' + esc(record.due) + '. Chọn 01 kịch bản để hệ thống đề xuất nhiệm vụ nhánh phù hợp.</div>',
            backFnName: 'returnFromScenario',
            backFnArg: id,
            backLabel: 'Quay lại hồ sơ chính'
        };
    }
    function renderScenarioSelectorFilters() {
        var filters = scenarioApiState.filters || { title: '' };
        return '<div class="scenario-filter-bar" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">'
            + '<input type="text" id="scenarioSearchInput" placeholder="Tên kịch bản" value="' + esc(filters.title || '') + '" oninput="debounceScenarioFilters()" style="padding:8px 12px;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;color:#d0e8f8;min-width:260px" />'
            + '</div>';
    }
    function debounceScenarioFilters() {
        if (scenarioFilterDebounceTimer) {
            clearTimeout(scenarioFilterDebounceTimer);
        }
        scenarioFilterDebounceTimer = setTimeout(function () {
            scenarioFilterDebounceTimer = null;
            applyScenarioFilters();
        }, 1000);
    }
    function openScenarioCardDetail(el) {
        if (!el) return;
        var ctx = el.getAttribute('data-scenario-ctx') || 'record';
        var id = decodeURIComponent(el.getAttribute('data-scenario-target-id') || '');
        var key = decodeURIComponent(el.getAttribute('data-scenario-key') || '');
        var detailRef = decodeURIComponent(el.getAttribute('data-scenario-detail-ref') || key || '');
        if (!id || !key) return;
        if (ctx === 'indicator') {
            selectIndicatorScenario(id, key, detailRef);
            return;
        }
        if (ctx === 'field') {
            selectFieldScenario(id, key, detailRef);
            return;
        }
        selectScenario(id, key, detailRef);
    }
    function renderScenarioSelectorWithApi(ctx, id) {
        var meta = getScenarioSelectionMeta(ctx, id);
        if (!meta) return;
        document.getElementById('modalTitleNotify').textContent = meta.title;
        document.getElementById('modalSubNotify').textContent = meta.sub;
        openModal();
        /* Gộp 5 kịch bản mặc định (DEFAULT_SCENARIOS) + tuỳ biến local + kịch bản từ API — trước đây khi
           isQlnvConfigured() chỉ hiện đúng scenarioApiState.items, mất 5 mặc định nếu backend chưa seed. */
        var allScenariosMap = getAllScenarios();
        /* Object trong DEFAULT_SCENARIOS không có field .key riêng (key chỉ là tên thuộc tính trong map) —
           phải gán lại .key = tên thuộc tính, nếu không scenarioCardHtml() sẽ coi là thiếu key và bỏ qua
           (return ''), khiến toàn bộ danh sách join thành chuỗi rỗng và rơi về "Chưa có kịch bản nào.". */
        var items = Object.keys(allScenariosMap).map(function (key) {
            var s = allScenariosMap[key];
            return s ? Object.assign({ key: key }, s) : s;
        }).filter(Boolean);
        if (scenarioApiState.loading) {
            document.getElementById('modalBodyNotify').innerHTML = meta.headerHtml + '<div class="loading">Đang tải danh sách kịch bản...</div>';
            return;
        }
        if (scenarioApiState.error) {
            document.getElementById('modalBodyNotify').innerHTML = meta.headerHtml + '<div class="error-state"><p>' + esc(getScenarioErrorMessage(scenarioApiState.error)) + '</p><button class="primary" onclick="retryScenarioSelector(\'' + ctx + '\',\'' + id + '\')">Thử lại</button></div>';
            return;
        }
        var pagination = scenarioApiState.pagination || { page: 1, totalPages: 0 };
        document.getElementById('modalBodyNotify').innerHTML = '<input type="hidden" id="scenarioModalCtx" value="' + esc(ctx) + '" /><input type="hidden" id="scenarioModalTargetId" value="' + esc(id) + '" />'
            + meta.headerHtml
            + '<div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm(\'' + ctx + '\',\'' + id + '\')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="' + meta.backFnName + '(\'' + meta.backFnArg + '\')">' + esc(meta.backLabel) + '</button></div>'
            + renderScenarioSelectorFilters()
            + '<div class="scenario-grid" id="scenarioListContainer">' + (items.map(function (s) { return scenarioCardHtml(ctx, id, s); }).join('') || '<div class="empty-state">Chưa có kịch bản nào.</div>') + '</div>'
            + (pagination.totalPages > 1 ? '<div class="scenario-pagination"><button class="ghost" onclick="loadScenarioPage(' + (pagination.page - 1) + ',\'' + ctx + '\',\'' + id + '\')"' + (pagination.page <= 1 ? ' disabled' : '') + '>Trang trước</button><span>Trang ' + esc(pagination.page) + '/' + esc(pagination.totalPages) + '</span><button class="ghost" onclick="loadScenarioPage(' + (pagination.page + 1) + ',\'' + ctx + '\',\'' + id + '\')"' + (pagination.page >= pagination.totalPages ? ' disabled' : '') + '>Trang sau</button></div>' : '');
    }
    function retryScenarioSelector(ctx, id) {
        loadScenariosFromApi(1, scenarioApiState.filters).then(function () { renderScenarioSelectorWithApi(ctx, id); });
    }
    function loadScenarioPage(page, ctx, id) {
        if (page < 1) return;
        loadScenariosFromApi(page, scenarioApiState.filters).then(function () { renderScenarioSelectorWithApi(ctx, id); });
    }
    function applyScenarioFilters() {
        var ctx = document.getElementById('scenarioModalCtx')?.value || '';
        var id = document.getElementById('scenarioModalTargetId')?.value || '';
        var search = (document.getElementById('scenarioSearchInput')?.value || '').trim();
        scenarioApiState.filters = { title: search };
        if (!isQlnvConfigured()) {
            renderScenarioSelectorWithApi(ctx, id);
            return;
        }
        loadScenariosFromApi(1, scenarioApiState.filters).then(function () { renderScenarioSelectorWithApi(ctx, id); });
    }
    function resetScenarioFilters() {
        if (scenarioFilterDebounceTimer) {
            clearTimeout(scenarioFilterDebounceTimer);
            scenarioFilterDebounceTimer = null;
        }
        scenarioApiState.filters = { title: '' };
        var ctx = document.getElementById('scenarioModalCtx')?.value || '';
        var id = document.getElementById('scenarioModalTargetId')?.value || '';
        if (!isQlnvConfigured()) {
            renderScenarioSelectorWithApi(ctx, id);
            return;
        }
        loadScenariosFromApi(1, scenarioApiState.filters).then(function () { renderScenarioSelectorWithApi(ctx, id); });
    }
    async function openScenarioSelectorViaApi(ctx, id) {
        scenarioApiState.filters = { title: '' };
        var meta = getScenarioSelectionMeta(ctx, id);
        if (!meta) return;
        document.getElementById('modalTitleNotify').textContent = meta.title;
        document.getElementById('modalSubNotify').textContent = meta.sub;
        document.getElementById('modalBodyNotify').innerHTML = meta.headerHtml + '<div class="loading">Đang tải danh sách kịch bản...</div>';
        openModal();
        if (isQlnvConfigured()) await loadScenariosFromApi(1, scenarioApiState.filters);
        renderScenarioSelectorWithApi(ctx, id);
    }
    function splitScenarioLines(text, max) {
        const lines = String(text || '').split('\n').map(x => x.trim()).filter(Boolean);
        return typeof max === 'number' ? lines.slice(0, max) : lines;
    }
    function toScenarioIsoDate(value) {
        const v = String(value || '').trim();
        if (!v) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return '';
        return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    }
    function buildScenarioProcess(processText) {
        return splitScenarioLines(processText, SCENARIO_PROCESS_STEP_NAMES.length).map((desc, idx) => ({ step: SCENARIO_PROCESS_STEP_NAMES[idx], desc }));
    }
    function normalizeScenarioCtx(ctx) {
        return ctx === 'indicator' || ctx === 'field' || ctx === 'record' || ctx === 'draft' ? ctx : 'general';
    }
    function buildScenarioContextPayload(ctx, id) {
        const payload = { ctx: normalizeScenarioCtx(ctx) };
        if ((payload.ctx === 'indicator' || payload.ctx === 'field' || payload.ctx === 'record') && id) payload.id = id;
        return payload;
    }
    function buildScenarioTaskDraftObject(task) {
        const item = task || {};
        return {
            maNhiemVuNhanh: '',
            tenNhiemVu: String(item.tenNhiemVu || item.name || '').trim(),
            noiDungNhiemVu: String(item.noiDungNhiemVu || item.content || '').trim(),
            donViChuTri: String(item.donViChuTri || item.owner || '').trim(),
            donViChuTriLabel: String(item.donViChuTriLabel || item.ownerLabel || item.owner || item.donViChuTri || '').trim(),
            donViThucHien: Array.isArray(item.donViThucHien)
                ? item.donViThucHien.map(function (x) { return String(x || '').trim(); }).filter(Boolean)
                : (Array.isArray(item.coordinators) ? item.coordinators.map(function (x) { return String(x || '').trim(); }).filter(Boolean) : []),
            donViThucHienLabels: Array.isArray(item.donViThucHienLabels)
                ? item.donViThucHienLabels.map(function (x) { return String(x || '').trim(); }).filter(Boolean)
                : (Array.isArray(item.coordinatorLabels)
                    ? item.coordinatorLabels.map(function (x) { return String(x || '').trim(); }).filter(Boolean)
                    : (Array.isArray(item.donViThucHien)
                        ? item.donViThucHien.map(function (x) { return String(x || '').trim(); }).filter(Boolean)
                        : (Array.isArray(item.coordinators) ? item.coordinators.map(function (x) { return String(x || '').trim(); }).filter(Boolean) : []))),
            priority: normalizePriorityValue(item.priority),
            doKhan: String(item.doKhan || item.urgency || 'Thường').trim() || 'Thường',
            doMat: String(item.doMat || item.secrecy || 'Bình thường').trim() || 'Bình thường',
            ngayChiDao: toScenarioIsoDate(item.ngayChiDao || item.startDate),
            ngayHetHan: toScenarioIsoDate(item.ngayHetHan || item.dueDate)
        };
    }
    function buildScenarioTaskTuple(task) {
        const t = buildScenarioTaskDraftObject(task);
        return {
            tenNhiemVu: t.tenNhiemVu,
            noiDungNhiemVu: t.noiDungNhiemVu || t.tenNhiemVu,
            donViChuTri: t.donViChuTri,
            donViChuTriLabel: t.donViChuTriLabel,
            donViThucHien: t.donViThucHien,
            donViThucHienLabels: t.donViThucHienLabels,
            priority: t.priority,
            doKhan: t.doKhan,
            doMat: t.doMat,
            ngayChiDao: t.ngayChiDao,
            ngayHetHan: t.ngayHetHan
        };
    }
    function normalizeScenarioForStore(s) {
        const src = s || {};
        return {
            title: String(src.title || '').trim(),
            level: String(src.level || 'Trung bình').trim() || 'Trung bình',
            desc: String(src.desc || '').trim(),
            objective: String(src.objective || '').trim(),
            scope: String(src.scope || '').trim(),
            process: Array.isArray(src.process) ? src.process.map(p => ({ step: String((p && p.step) || '').trim(), desc: String((p && p.desc) || '').trim() })).filter(p => p.step && p.desc) : [],
            expectedResults: Array.isArray(src.expectedResults) ? src.expectedResults.map(x => String(x || '').trim()).filter(Boolean) : [],
            sla: Array.isArray(src.sla) ? src.sla.map(x => String(x || '').trim()).filter(Boolean) : [],
            tasks: Array.isArray(src.tasks) ? src.tasks.map(buildScenarioTaskTuple).filter(t => t.tenNhiemVu) : [],
        };
    }
    function indicatorScenarioKeys(r) { const arr = []; if (r.status === 'overdue') arr.push('overdue'); if (['risk', 'soon'].includes(r.status) || Number(r.progress || 0) < 70) arr.push('slow'); arr.push('data'); if (/cử tri|kiến nghị/i.test(r.indicator || r.title || '')) arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)] }
    function recordScenarioKeys(r) { const arr = []; if (r.status === 'overdue') arr.push('overdue'); if (['risk', 'soon'].includes(r.status) || Number(r.progress || 0) < 70) arr.push('slow'); if (r.metric === 'indicator' || /dữ liệu|chỉ tiêu|bản ghi/i.test(r.title || '')) arr.push('data'); if (/cử tri|kiến nghị/i.test(r.field || r.title || '')) arr.push('citizen'); arr.push('coordinate'); arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)] }
    function fieldTarget(fid) {
        const parts = String(fid || '').split('::');
        if (parts[0] === 'item') {
            const [, role, catId, idxStr] = parts; const idx = Number(idxStr);
            const cat = (categorySeed[role] || []).find(c => c.id === catId); const it = cat ? cat.items[idx] : null;
            return { scope: 'item', role, catId, idx, cat, label: it ? it[0] : 'Chỉ tiêu con' };
        }
        const [, role, catId] = parts; const cat = (categorySeed[role] || []).find(c => c.id === catId);
        return { scope: 'cat', role, catId, cat, label: cat ? cat.name : 'Lĩnh vực' };
    }
    function fieldScenarioKeys(fid) {
        const t = fieldTarget(fid); const arr = ['data', 'coordinate'];
        if (t.scope === 'cat' && categoryDataIssues[t.catId]) arr.unshift('overdue');
        if (/cử tri|kiến nghị/i.test(t.label || '')) arr.push('citizen');
        arr.push(...Object.keys(loadCustomScenarios())); return [...new Set(arr)];
    }
    function scenarioCardHtml(ctx, id, scenario) { const s = scenario || null; if (!s || !s.key) return ''; const detailRef = getScenarioDetailRef(s); return `<button type="button" class="scenario-card" data-scenario-ctx="${esc(ctx || 'record')}" data-scenario-target-id="${encodeURIComponent(String(id || ''))}" data-scenario-key="${encodeURIComponent(String(s.key || ''))}" data-scenario-detail-ref="${encodeURIComponent(String(detailRef || s.key || ''))}" onclick="openScenarioCardDetail(this)"><div class="scenario-severity"><span class="badge ${scenarioLevelBadgeClass(s.level)}">${esc(s.level || 'Trung bình')}</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3">? ${esc((s.tasks || []).length)} nhiệm vụ nhánh</span></div><h4>${esc(s.title || s.key)}</h4><p>${esc(s.desc || '')}</p>${s.objective ? `<p class="scenario-objective">? ${esc(s.objective)}</p>` : ''}<div class="scenario-sla-tags">${(s.sla || []).map(x => `<span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip">⏱ ${esc(x)}</span>`).join('')}</div></button>` }
    function scenarioFullPageHtml(s, actionBarHtml, leadUnit, coordUnits) {
        const tagStyle = 'max-width:none;white-space:normal;overflow:visible;text-overflow:clip';
        const coordTags = (coordUnits && coordUnits.length) ? coordUnits.map(u => `<span class="badge" style="${tagStyle}">? ${esc(u)}</span>`).join('') : '';
        return `<div class="detail-card scenario-fullpage">
      <div class="scenario-severity" style="margin-bottom:8px"><span class="badge ${scenarioLevelBadgeClass(s.level)}">${esc(s.level || '—')}</span><span class="badge" style="${tagStyle}">? ${esc((s.tasks || []).length)} nhiệm vụ nhánh</span></div>
      <h4>? Kịch bản điều hành IOC: ${esc(s.title)}</h4><div class="scenario-fullpage-grid">
      <div class="scenario-fullpage-sec wide"><b>1. Mục tiêu</b><p>${esc(s.objective || '—')}</p></div>
      <div class="scenario-fullpage-sec wide"><b>2. Phạm vi áp dụng</b><p>${esc(s.scope || '—')}</p></div>
      <div class="scenario-fullpage-sec wide"><b>3. Quy trình vận hành</b><ol>${(s.process || []).map(p => `<li><b>${esc(p.step)}:</b> ${esc(p.desc)}</li>`).join('') || '<li>—</li>'}</ol></div>
      <div class="scenario-fullpage-sec"><b>4. Kết quả mong đợi</b><div class="scenario-sla-tags">${(s.expectedResults && s.expectedResults.length) ? s.expectedResults.map(x => `<span class="badge" style="${tagStyle}">✅ ${esc(x)}</span>`).join('') : '<span class="muted">—</span>'}</div></div>
      <div class="scenario-fullpage-sec"><b>5. Đơn vị chủ trì / phối hợp</b><div class="scenario-sla-tags"><span class="badge gold" style="${tagStyle}">? ${esc(leadUnit || 'Chưa xác định')}</span>${coordTags}</div><small class="muted" style="display:block;margin-top:6px">Tự lấy theo nhiệm vụ/chỉ tiêu đang áp dụng kịch bản.</small></div>
    </div>${actionBarHtml || ''}</div>`;
    }
    function scenarioTaskTableHtml(ctx, id, key, s, recordLike) {
        const existingSubs = ctx === 'indicator' ? indicatorSubtasksStore(id) : ctx === 'field' ? fieldSubtasksStore(id) : (recordLike?.subtasks || []);
        const rows = (s.tasks || []).map((t, i) => {
            const already = existingSubs.find(x => (x.tenNhiemVu || x.name) === t.tenNhiemVu && x.scenario === key);
            const coordText = (t.donViThucHien && t.donViThucHien.length) ? esc(t.donViThucHien.join(', ')) : '—';
            const priority = esc(t.priorityLabel || (s.level === 'Khẩn' ? 'Cao' : s.level) || 'Trung bình');
            const urgency = esc(t.doKhan || 'Thường');
            const dueText = already ? esc(already.due || already.ngayHetHan || '—') : esc(formatScenarioDisplayDate(t.ngayHetHan) || 'Theo lúc áp dụng');
            const checkboxCell = already ? '<span title="Đã tạo nhiệm vụ nhánh này">✅</span>' : `<input type="checkbox" data-scenario-task="${i}" checked onchange="updateScenarioCreateButtonState()"/>`;
            return `<tr><td class="tc">${checkboxCell}</td><td class="mono">${esc(already ? already.id : (t.maNhanh || ('NV-' + String(i + 1).padStart(2, '0'))))}</td><td class="subtask-name-col">${esc(t.tenNhiemVu)}</td><td class="subtask-content-col">${esc(t.noiDungNhiemVu || t.tenNhiemVu)}</td><td>${esc(t.donViChuTri || '—')}</td><td>${coordText}</td><td>${priority}</td><td>${urgency}</td><td>${dueText}</td><td>${already ? '<span class="badge ok">Đã tạo</span>' : '<span class="badge warn">Chưa tạo</span>'}</td></tr>`;
        }).join('');
        return `<div class="detail-card"><h4>Nhiệm vụ nhánh trong kịch bản</h4><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Đơn vị phối hợp</th><th>Mức độ</th><th>Độ khẩn</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>${rows || '<tr><td colspan="10">Kịch bản chưa khai báo nhiệm vụ nhánh nào.</td></tr>'}</tbody></table></div></div>`;
    }
    function todayIsoDate() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }
    function getSelectedScenarioTaskIndexes() {
        return [...document.querySelectorAll('[data-scenario-task]:checked')].map(function (x) { return Number(x.dataset.scenarioTask); }).filter(function (x) { return !Number.isNaN(x); });
    }
    function updateScenarioCreateButtonState() {
        var openBtn = document.getElementById('scenarioOpenCreateTasksBtn');
        var hasSelection = !!getSelectedScenarioTaskIndexes().length;
        if (openBtn) openBtn.disabled = !hasSelection;
    }
    function getScenarioAssignmentUnits(ctx, id, recordLike) {
        if (ctx === 'field') {
            const target = fieldTarget(id);
            if (!target.cat) return { leadUnit: '', coordUnits: [] };
            return { leadUnit: target.cat.unit || target.cat.owner || axisMeta[target.role]?.name || '', coordUnits: Array.isArray(target.cat.coordinators) ? target.cat.coordinators : [] };
        }
        return { leadUnit: recordLike?.unit || '', coordUnits: recordLike?.coordinators || [] };
    }
    function scenarioDetailHtml(ctx, id, scenario, recordLike, subsHtmlFn) {
        const s = scenario || null; if (!s) return '';
        const units = getScenarioAssignmentUnits(ctx, id, recordLike);
        const actionBarHtml = `<div class="action-bar" style="margin-top:12px"><button class="primary" id="scenarioOpenCreateTasksBtn" onclick="submitScenarioTasks('${ctx}','${id}','${s.key}')" disabled>Tạo các nhiệm vụ nhánh đã chọn</button><button class="ghost" onclick="${ctx === 'indicator' ? 'openIndicatorScenarioSelector' : ctx === 'field' ? 'openFieldScenarioSelector' : 'openScenarioSelector'}('${id}')">Chọn kịch bản khác</button><button class="ghost" onclick="openScenarioCreateForm('${ctx}','${id}')">＋ Thêm kịch bản mới</button></div>`;
        return `${scenarioFullPageHtml(s, '', units.leadUnit, units.coordUnits)}${scenarioTaskTableHtml(ctx, id, s.key, s, recordLike)}${actionBarHtml}`;
    }
    async function loadScenarioDetailForSelection(ctx, id, key, recordLike, detailRef) {
        var label = ctx === 'field' ? (fieldTarget(id).label || id) : id;
        document.getElementById('modalTitleNotify').textContent = `${getScenarioTitleByKey(key) || key} · ${label}`;
        document.getElementById('modalSubNotify').textContent = 'Chọn nhiệm vụ nhánh';
        document.getElementById('modalBodyNotify').innerHTML = '<div class="loading">Đang tải chi tiết kịch bản...</div>';
        openModal();
        scenarioDetailState.loading = true;
        scenarioDetailState.error = null;
        try {
            var scenario = null;
            /* Ưu tiên đọc kịch bản mặc định/tuỳ biến LOCAL trước (scenarioTemplates() = DEFAULT_SCENARIOS +
               tuỳ biến) — 5 kịch bản mặc định không có bản ghi trên backend nên gọi thẳng getScenario(key) sẽ
               404 "Không tìm thấy kịch bản." dù nó vẫn hiện trong danh sách (xem renderScenarioSelectorWithApi).
               Chỉ gọi API khi key không khớp kịch bản local nào, tức chắc chắn là kịch bản chỉ có trên backend. */
            var localScenario = scenarioTemplates()[key];
            if (localScenario) {
                /* Object trong scenarioTemplates() không có field .key riêng (key chỉ là tên thuộc tính
                   trong map) — phải gán lại, nếu không scenarioDetailHtml()/scenarioTaskTableHtml() render
                   ra "${s.key}" = "undefined" (onclick="submitScenarioTasks('record','id','undefined')"). */
                scenario = Object.assign({ key: key }, localScenario);
            } else if (isQlnvConfigured()) {
                var ref = detailRef || getScenarioDetailRef(key) || key;
                var res = await QlnvApiNotify.getScenario(ref);
                scenario = scenarioApiToUi(res?.data || res);
            }
            if (!scenario) throw new Error('SCENARIO_NOT_FOUND');
            var resolvedDetailRef = detailRef || getScenarioDetailRef(scenario) || key;
            scenarioDetailState.active = { ctx: ctx, id: id, key: key, detailRef: resolvedDetailRef, scenario: scenario };
            scenarioDetailState.cache[key] = scenario;
            if (resolvedDetailRef) scenarioDetailState.cache[resolvedDetailRef] = scenario;
            document.getElementById('modalTitleNotify').textContent = `${scenario.title} · ${label}`;
            document.getElementById('modalBodyNotify').innerHTML = scenarioDetailHtml(ctx, id, scenario, recordLike, null);
            updateScenarioCreateButtonState();
            return scenario;
        } catch (err) {
            scenarioDetailState.error = err;
            document.getElementById('modalBodyNotify').innerHTML = '<div class="error-state"><p>' + esc(getScenarioErrorMessage(err)) + '</p><button class="primary" onclick="' + (ctx === 'indicator' ? 'selectIndicatorScenario' : ctx === 'field' ? 'selectFieldScenario' : 'selectScenario') + '(\'' + id + '\',\'' + key + '\',\'' + esc(String(detailRef || '')) + '\')">Thử lại</button><button class="ghost" onclick="' + (ctx === 'indicator' ? 'openIndicatorScenarioSelector' : ctx === 'field' ? 'openFieldScenarioSelector' : 'openScenarioSelector') + '(\'' + id + '\')">Chọn kịch bản khác</button></div>';
            return null;
        } finally {
            scenarioDetailState.loading = false;
        }
    }
    function getActiveScenarioDetail(ctx, id, key) {
        const active = scenarioDetailState.active;
        if (active && active.ctx === ctx && active.id === id && active.key === key && active.scenario) return active.scenario;
        if (scenarioDetailState.cache[key]) return scenarioDetailState.cache[key];
        /* Tra cứu local (DEFAULT_SCENARIOS + tuỳ biến) luôn an toàn — không cần điều kiện isQlnvConfigured(),
           khớp với ưu tiên "local trước" của loadScenarioDetailForSelection ở trên. */
        /* Gán lại .key (không có sẵn trong object local) để getScenarioDetailRef()/submitScenarioTasks()
           dùng đúng key. */
        var localScenario = scenarioTemplates()[key];
        return localScenario ? Object.assign({ key: key }, localScenario) : null;
    }
    function buildAppliedScenarioSubtask(task, idx, scenarioKey, scenarioLevel, generatedId) {
        return {
            id: generatedId,
            maNhanh: task.maNhanh || generatedId,
            tenNhiemVu: task.tenNhiemVu,
            noiDungNhiemVu: task.noiDungNhiemVu || task.tenNhiemVu,
            donViChuTri: task.donViChuTri || '',
            donViThucHien: Array.isArray(task.donViThucHien) ? task.donViThucHien.slice() : [],
            priority: task.priorityLabel || (scenarioLevel === 'Khẩn' ? 'Cao' : scenarioLevel) || 'Trung bình',
            doKhan: task.doKhan || 'Thường',
            doMat: task.doMat || 'Bình thường',
            ngayChiDao: task.ngayChiDao || '',
            ngayHetHan: task.ngayHetHan || dueDate(idx, scenarioKey === 'overdue' ? 'soon' : 'doing'),
            trangThai: 'Đang xử lý',
            progress: 10,
            scenario: scenarioKey,
            created: new Date().toLocaleString('vi-VN'),
            name: task.tenNhiemVu,
            content: task.noiDungNhiemVu || task.tenNhiemVu,
            owner: task.donViChuTri || '',
            coordinators: Array.isArray(task.donViThucHien) ? task.donViThucHien.slice() : [],
            state: 'Đang xử lý',
            startDate: task.ngayChiDao || '',
            due: task.ngayHetHan || dueDate(idx, scenarioKey === 'overdue' ? 'soon' : 'doing'),
            urgency: task.doKhan || 'Thường',
            secrecy: task.doMat || 'Bình thường'
        };
    }
    function buildScenarioSubtaskFromCreatedTask(task, scenarioKey, fallbackId) {
        var draft = buildScenarioTaskDraftObject(task || {});
        var recordId = String((task && (task._id || task.id || task.task_id)) || fallbackId || ('NV-' + Date.now()));
        return {
            id: 'QLNV-' + recordId,
            maNhanh: draft.maNhiemVuNhanh || recordId,
            tenNhiemVu: draft.tenNhiemVu,
            noiDungNhiemVu: draft.noiDungNhiemVu || draft.tenNhiemVu,
            donViChuTri: draft.donViChuTriLabel || draft.donViChuTri || '',
            donViThucHien: Array.isArray(draft.donViThucHienLabels) && draft.donViThucHienLabels.length ? draft.donViThucHienLabels.slice() : draft.donViThucHien.slice(),
            priority: getPriorityLabel(draft.priority),
            doKhan: draft.doKhan || 'Thường',
            doMat: draft.doMat || 'Bình thường',
            ngayChiDao: draft.ngayChiDao || '',
            ngayHetHan: draft.ngayHetHan || '',
            trangThai: 'Đang xử lý',
            progress: 5,
            scenario: scenarioKey,
            created: new Date().toLocaleString('vi-VN'),
            name: draft.tenNhiemVu,
            content: draft.noiDungNhiemVu || draft.tenNhiemVu,
            owner: draft.donViChuTriLabel || draft.donViChuTri || '',
            coordinators: Array.isArray(draft.donViThucHienLabels) && draft.donViThucHienLabels.length ? draft.donViThucHienLabels.slice() : draft.donViThucHien.slice(),
            state: 'Đang xử lý',
            startDate: draft.ngayChiDao || '',
            due: draft.ngayHetHan || '',
            urgency: draft.doKhan || 'Thường',
            secrecy: draft.doMat || 'Bình thường',
            __qlnvId: recordId
        };
    }
    function getScenarioRecordLike(ctx, id) {
        if (ctx === 'indicator') return indicatorRecords.find(function (x) { return x.id === id; }) || null;
        if (ctx === 'field') return fieldTarget(id);
        return records.find(function (x) { return x.id === id; }) || null;
    }
    function mergeCreatedScenarioTasks(ctx, id, key, createdTasks) {
        var tasks = Array.isArray(createdTasks) ? createdTasks : [];
        if (ctx === 'indicator') {
            var indicatorSubs = indicatorSubtasksStore(id);
            tasks.forEach(function (task, index) {
                var subtask = buildScenarioSubtaskFromCreatedTask(task, key, id + '-N' + String(indicatorSubs.length + index + 1).padStart(2, '0'));
                if (!indicatorSubs.some(function (item) { return (item.__qlnvId && item.__qlnvId === subtask.__qlnvId) || (item.tenNhiemVu || item.name) === subtask.tenNhiemVu; })) indicatorSubs.push(subtask);
            });
            setIndicatorSelectedScenario(id, key);
            openIndicatorDetail(id);
            return;
        }
        if (ctx === 'field') {
            var fieldSubs = fieldSubtasksStore(id);
            tasks.forEach(function (task, index) {
                var subtask = buildScenarioSubtaskFromCreatedTask(task, key, 'NV-' + id.replace(/::/g, '-') + '-' + String(fieldSubs.length + index + 1).padStart(2, '0'));
                if (!fieldSubs.some(function (item) { return (item.__qlnvId && item.__qlnvId === subtask.__qlnvId) || (item.tenNhiemVu || item.name) === subtask.tenNhiemVu; })) fieldSubs.push(subtask);
            });
            setFieldSelectedScenario(id, key);
            openFieldSource(id);
            return;
        }
        var record = records.find(function (x) { return x.id === id; });
        if (!record) return;
        record.subtasks = record.subtasks || [];
        tasks.forEach(function (task, index) {
            var subtask = buildScenarioSubtaskFromCreatedTask(task, key, id + '-N' + String(record.subtasks.length + index + 1).padStart(2, '0'));
            if (!record.subtasks.some(function (item) { return (item.__qlnvId && item.__qlnvId === subtask.__qlnvId) || (item.tenNhiemVu || item.name) === subtask.tenNhiemVu; })) record.subtasks.push(subtask);
        });
        record.selectedScenario = key;
        record.history = record.history || [];
        record.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `Áp dụng ${getScenarioTitleByKey(key)}, tạo ${tasks.length} nhiệm vụ nhánh từ API` });
        returnFromScenario(id);
    }
    function submitScenarioTasks(ctx, id, key) {
        var scenario = getActiveScenarioDetail(ctx, id, key);
        if (!scenario) { toast('Không tìm thấy chi tiết kịch bản.'); return; }
        var scenarioId = getScenarioDetailRef(scenario);
        if (!scenarioId) { toast('Kịch bản chưa có ID để tạo nhiệm vụ.'); return; }
        var taskIndexes = getSelectedScenarioTaskIndexes();
        if (!taskIndexes.length) { toast('Cần chọn ít nhất một nhiệm vụ nhánh.'); return; }
        var recordLike = getScenarioRecordLike(ctx, id);
        var parentId = '';
        if (ctx === 'record' && recordLike) {
            parentId = String(recordLike.__qlnvId || recordLike._id || recordLike.task_id || '');
        }
        var payload = {
            taskIndexes: taskIndexes,
            ngayChiDao: todayIsoDate(),
            loaiNV: 'NHIEM_VU_CON'
        };
        if (parentId) payload.parentId = parentId;
        payload.lanhDaoChiDaoId = (window.QLNV_CREATE_DEFAULTS && window.QLNV_CREATE_DEFAULTS.lanhDaoChiDaoId) || qlnvDefaultLeaderId() || '';
        /* Route kịch bản không đi qua buildQlnvCreateBodyV2 nên phải tự chặn — cùng lý do: thiếu id
           người chỉ đạo thì BE lưu bản ghi lỗi. */
        if (!payload.lanhDaoChiDaoId) {
            qlnvBlockCreate('Chưa xác định được tài khoản đăng nhập, thử tải lại trang.');
            return;
        }
        var btn = document.getElementById('scenarioOpenCreateTasksBtn');
        if (btn) btn.disabled = true;
        if (typeof toast === 'function') toast('Đang tạo nhiệm vụ nhánh từ kịch bản...');
        QlnvApiNotify.createScenarioTasks(scenarioId, payload).then(function (res) {
            var createdTasks = Array.isArray(res && res.data) ? res.data : (Array.isArray(res && res.body && res.body.data) ? res.body.data : []);
            mergeCreatedScenarioTasks(ctx, id, key, createdTasks);
            if (typeof toast === 'function') toast((res && res.message) || `Đã tạo ${createdTasks.length || taskIndexes.length} nhiệm vụ nhánh từ kịch bản.`);
        }).catch(function (err) {
            if (typeof toast === 'function') toast('Tạo nhiệm vụ nhánh lỗi: ' + getScenarioErrorMessage(err));
            if (btn) btn.disabled = false;
        });
    }
    const SCENARIO_LINH_VUC = [
        "Y tế",
        "Giáo dục",
        "HCC",
        "Tài chính",
        "Giao thông",
        "Xây dựng",
        "TNMT",
        "KHCN",
        "LĐTBXH",
        "Nội chính",
        "Tổ chức",
        "Kiểm tra",
    ];
    window.SCENARIO_LINH_VUC = SCENARIO_LINH_VUC;

    /* DANH MỤC LĨNH VỰC CHO KỊCH BẢN — LẤY THEO ĐƠN VỊ ĐANG ĐĂNG NHẬP.
       Trước đây 12 lĩnh vực nằm cứng ngay trên đây (và mỗi block lại khai báo một bản),
       nên quản trị đơn vị thêm/bớt lĩnh vực trong bảng linh_vuc của be_ioc_dash thì bộ
       lọc kịch bản + ô "Lĩnh vực áp dụng" vẫn hiện danh sách cũ.
       Nguồn: GET /rbac/me -> iocContext.primaryOrganizationId, rồi
       GET /rbac/me/linh-vuc?organizationId= (route chỉ cần phiên đăng nhập; bản
       /rbac/linh-vuc nằm sau guard quản trị nên user thường bị 403). Cùng nguồn với
       assLoadLinhVuc() đang dùng cho ô "Nhóm lĩnh vực" ở form giao nhiệm vụ.
       API lỗi/rỗng -> giữ danh sách cứng, KHÔNG để trống vì mất bộ lọc là chặn chọn kịch bản.
       Cache nằm ở window.__scenarioLinhVucNames chứ không ghi đè window.SCENARIO_LINH_VUC:
       nhiều block (tongquan, noti) cùng khai báo biến đó nên block nạp sau sẽ ghi đè lại
       bản cứng và xoá mất kết quả API. */
    if (typeof window.qlnvScenarioLinhVucList !== "function") {
        /* "&organizationId=..." để gắn/lọc kịch bản theo đơn vị; rỗng khi chưa nạp được
           /rbac/me -> BE chỉ trả phần dùng chung (5 kịch bản mặc định). */
        window.qlnvScenarioOrgQuery = function (prefix) {
            var id = window.__scenarioOrgId;
            if (!id) return "";
            return (prefix || "&") + "organizationId=" + encodeURIComponent(id);
        };
        window.qlnvScenarioLinhVucList = function () {
            var api = window.__scenarioLinhVucNames;
            if (Array.isArray(api) && api.length) return api;
            return window.SCENARIO_LINH_VUC || [];
        };
        window.qlnvLoadScenarioLinhVuc = function () {
            if (window.__scenarioLinhVucP) return window.__scenarioLinhVucP;
            var base = window.QLNV_API_BASE || window.location.origin + "/api";
            window.__scenarioLinhVucP = fetch(base + "/rbac/me", { credentials: "include" })
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (me) {
                    var orgId = me && me.iocContext && me.iocContext.primaryOrganizationId;
                    /* Giữ lại id đơn vị: kịch bản tự tạo cũng phân phạm vi theo ĐÚNG hệ id
                       này (organizations của be_ioc_dash), xem qlnvScenarioOrgQuery(). */
                    window.__scenarioOrgId = orgId != null && orgId !== "" ? String(orgId) : null;
                    return fetch(
                        base + "/rbac/me/linh-vuc" + (orgId ? "?organizationId=" + encodeURIComponent(orgId) : ""),
                        { credentials: "include" },
                    );
                })
                .then(function (r) { return r && r.ok ? r.json() : null; })
                .then(function (res) {
                    var names = ((res && res.items) || [])
                        .filter(function (i) { return i && i.isActive !== false && i.name; })
                        .map(function (i) { return String(i.name); });
                    if (names.length) window.__scenarioLinhVucNames = names;
                    return window.qlnvScenarioLinhVucList();
                })
                .catch(function (err) {
                    console.warn("[QLNV] Không tải được lĩnh vực theo đơn vị, giữ danh sách mặc định:", err);
                    return window.qlnvScenarioLinhVucList();
                });
            return window.__scenarioLinhVucP;
        };
    }

    function msSearchKey(v) {
        return String(v || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d");
    }
    function msTagsHtml(fieldId) {
        const st = window.__msState[fieldId];
        if (!st.selected.length)
            return `<span class="ms-placeholder">Mọi lĩnh vực (mặc định)</span>`;
        return st.selected
            .map(
                (v) =>
                    `<span class="ms-tag">${esc(v)}<i onclick="msRemoveTag(event,'${fieldId}','${esc(v).replace(/'/g, "\\'")}')">×</i></span>`,
            )
            .join("");
    }
    function msOptionsHtml(fieldId, filterText) {
        const st = window.__msState[fieldId];
        const key = msSearchKey(filterText);
        const opts = st.options.filter((o) => !key || msSearchKey(o).indexOf(key) !== -1);
        if (!opts.length)
            return `<div class="ms-empty">Không tìm thấy lĩnh vực phù hợp</div>`;
        return opts
            .map((o) => {
                const checked = st.selected.indexOf(o) !== -1;
                return `<label class="ms-option" onclick="event.stopPropagation()"><input type="checkbox" ${checked ? "checked" : ""} onchange="msToggleOption('${fieldId}','${esc(o).replace(/'/g, "\\'")}')" /><span>${esc(o)}</span></label>`;
            })
            .join("");
    }
    function msFieldHtml(fieldId, options, selected) {
        window.__msState = window.__msState || {};
        window.__msState[fieldId] = { options: options.slice(), selected: (selected || []).slice() };
        if (!window.__msOutsideBound) {
            window.__msOutsideBound = true;
            document.addEventListener("click", function (e) {
                document.querySelectorAll(".ms-field.open").forEach(function (el) {
                    if (!el.contains(e.target)) el.classList.remove("open");
                });
            });
        }
        return (
            `<div class="ms-field" id="${fieldId}_wrap">` +
            `<div class="ms-control" onclick="msToggle('${fieldId}')">` +
            `<div class="ms-tags" id="${fieldId}_tags">${msTagsHtml(fieldId)}</div>` +
            `<span class="ms-chevron">▾</span>` +
            `</div>` +
            `<div class="ms-panel"><div class="ms-search"><input type="text" placeholder="Tìm lĩnh vực..." oninput="msFilter('${fieldId}', this.value)" onclick="event.stopPropagation()" /></div>` +
            `<div class="ms-options" id="${fieldId}_options">${msOptionsHtml(fieldId, "")}</div></div>` +
            `</div>`
        );
    }
    window.msToggle = function (fieldId, forceOpen) {
        const wrap = document.getElementById(fieldId + "_wrap");
        if (!wrap) return;
        const willOpen = typeof forceOpen === "boolean" ? forceOpen : !wrap.classList.contains("open");
        document.querySelectorAll(".ms-field.open").forEach(function (el) {
            if (el !== wrap) el.classList.remove("open");
        });
        wrap.classList.toggle("open", willOpen);
        if (willOpen) {
            const input = wrap.querySelector(".ms-search input");
            if (input) {
                input.value = "";
                setTimeout(() => input.focus(), 0);
            }
            const optsEl = document.getElementById(fieldId + "_options");
            if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, "");
        }
    };
    window.msFilter = function (fieldId, text) {
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, text);
    };
    window.msToggleOption = function (fieldId, value) {
        const st = window.__msState[fieldId];
        if (!st) return;
        const idx = st.selected.indexOf(value);
        if (idx === -1) st.selected.push(value);
        else st.selected.splice(idx, 1);
        const tagsEl = document.getElementById(fieldId + "_tags");
        if (tagsEl) tagsEl.innerHTML = msTagsHtml(fieldId);
        const searchInput = document.querySelector("#" + fieldId + "_wrap .ms-search input");
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, searchInput ? searchInput.value : "");
    };
    window.msRemoveTag = function (evt, fieldId, value) {
        if (evt) evt.stopPropagation();
        const st = window.__msState[fieldId];
        if (!st) return;
        st.selected = st.selected.filter((v) => v !== value);
        const tagsEl = document.getElementById(fieldId + "_tags");
        if (tagsEl) tagsEl.innerHTML = msTagsHtml(fieldId);
        const searchInput = document.querySelector("#" + fieldId + "_wrap .ms-search input");
        const optsEl = document.getElementById(fieldId + "_options");
        if (optsEl) optsEl.innerHTML = msOptionsHtml(fieldId, searchInput ? searchInput.value : "");
    };
    window.msGetValues = function (fieldId) {
        const st = window.__msState && window.__msState[fieldId];
        return st ? st.selected.slice() : [];
    };

    function assToggleDropdown(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const isVisible = el.style.display === "block" || el.classList.contains("open");
        document.querySelectorAll(".ms-dropdown").forEach((d) => {
            d.style.display = "none";
            d.classList.remove("open");
        });
        if (!isVisible) {
            el.style.display = "block";
            el.classList.add("open");
            const search = el.querySelector("input[type=text]");
            if (search) search.focus();
        }
    }
    window.assToggleDropdown = assToggleDropdown;

    window.__newScenarioTasksDraft = [];
    function renderNewScenarioTasksList() {
        const box = document.getElementById("newScenarioTasksList");
        if (!box) return;
        const list = window.__newScenarioTasksDraft || [];
        if (!list.length) {
            box.innerHTML =
                '<div class="muted">Chưa có nhiệm vụ nhánh nào — bấm "＋ Thêm nhiệm vụ nhánh" để khai báo.</div>';
            return;
        }
        box.innerHTML = list
            .map((t, i) => {
                if (!Array.isArray(t)) {
                    const extra = {
                        urgency: t.doKhan || t.urgency,
                        start: t.ngayChiDao || t.start,
                        coordinators: t.donViThucHienLabels || t.donViThucHien || t.coordinators || []
                    };
                    const coord = extra.coordinators && extra.coordinators.length
                        ? " · phối hợp " + esc(Array.isArray(extra.coordinators) ? extra.coordinators.join(", ") : extra.coordinators)
                        : "";
                    const urgency = extra.urgency ? " · " + esc(extra.urgency) : "";
                    const start = extra.start ? " · từ " + esc(extra.start) : "";
                    const due = (t.ngayHetHan || t.due) ? " · hạn " + esc(t.ngayHetHan || t.due) : "";
                    return `<div class="scenario-template-row"><div><b>${esc(t.tenNhiemVu || t.name || t[0])}</b><small>${esc(t.donViChuTriLabel || t.donViChuTri || t.owner || t[2])} · ${esc(t.priority || t[3] || "Trung bình")}${urgency}${coord}${start}${due}</small></div><button type="button" class="ghost danger-btn" onclick="removeNewScenarioTaskRow(${i})">Xóa</button></div>`;
                }
                const extra = t[5] || {};
                const coord = (extra.coordinators || []).length
                    ? " · phối hợp " + esc(extra.coordinators.join(", "))
                    : "";
                const urgency = extra.urgency ? " · " + esc(extra.urgency) : "";
                const start = extra.start ? " · từ " + esc(extra.start) : "";
                const due = t[4] ? " · hạn " + esc(t[4]) : "";
                return `<div class="scenario-template-row"><div><b>${esc(t[0])}</b><small>${esc(t[2])} · ${esc(t[3] || "Trung bình")}${urgency}${coord}${start}${due}</small></div><button type="button" class="ghost danger-btn" onclick="removeNewScenarioTaskRow(${i})">Xóa</button></div>`;
            })
            .join("");
    }
    function filterNsCoordOptions() {
        const q = (document.getElementById("nsCoordSearch")?.value || "")
            .trim()
            .toLowerCase();
        document.querySelectorAll("#nsCoordBox .ns-opt").forEach((el) => {
            const name = (el.getAttribute("data-name") || "").toLowerCase();
            el.style.display = !q || name.indexOf(q) !== -1 ? "flex" : "none";
        });
    }
    function getNsCoordSelected() {
        return Array.from(document.querySelectorAll(".nsCoord:checked")).map(
            (c) => c.value,
        );
    }
    function updateNsCoordLabel() {
        const el = document.getElementById("nsCoordTriggerText");
        if (!el) return;
        const picked = getNsCoordSelected();
        el.textContent = picked.length
            ? picked.join(", ")
            : "Chọn đơn vị phối hợp";
        el.style.color = picked.length ? "#d0e8f8" : "#8ab0c8";
    }
    function openNewScenarioTaskForm() {
        const form = document.getElementById("newScenarioTaskForm");
        if (!form) return;
        document.getElementById("nsTaskName").value = "";
        document.getElementById("nsTaskContent").value = "";
        document.getElementById("nsTaskPriority").value = "Trung bình";
        document.getElementById("nsTaskUrgency").value = "Thường";
        document.getElementById("nsTaskStart").value = "";
        document.getElementById("nsTaskDue").value = "";
        document.querySelectorAll(".nsCoord").forEach((c) => (c.checked = false));
        const search = document.getElementById("nsCoordSearch");
        if (search) search.value = "";
        filterNsCoordOptions();
        updateNsCoordLabel();
        document.getElementById("nsCoordDropdown")?.classList.remove("open");
        form.classList.remove("hidden");
        form.style.display = "block";
        document.getElementById("nsTaskName").focus();
    }
    function closeNewScenarioTaskForm() {
        const form = document.getElementById("newScenarioTaskForm");
        if (form) {
            form.classList.add("hidden");
            form.style.display = "none";
        }
        document.getElementById("nsCoordDropdown")?.classList.remove("open");
    }
    function addNewScenarioTaskRow() {
        const name = (document.getElementById("nsTaskName")?.value || "").trim();
        if (!name) {
            toast("Cần nhập tên nhiệm vụ nhánh.");
            return;
        }
        const content =
            (document.getElementById("nsTaskContent")?.value || "").trim() || name;
        const owner =
            document.getElementById("nsTaskOwner")?.value || "Đơn vị chuyên môn";
        const priority =
            document.getElementById("nsTaskPriority")?.value || "Trung bình";
        const urgency = document.getElementById("nsTaskUrgency")?.value || "Thường";
        const start = document.getElementById("nsTaskStart")?.value || "";
        const due = document.getElementById("nsTaskDue")?.value || "";
        if (start && due && due < start) {
            toast("Hạn hoàn thành phải sau ngày bắt đầu.");
            return;
        }
        window.__newScenarioTasksDraft = window.__newScenarioTasksDraft || [];
        window.__newScenarioTasksDraft.push([
            name,
            content,
            owner,
            priority,
            due,
            { urgency, start, coordinators: getNsCoordSelected() },
        ]);
        closeNewScenarioTaskForm();
        renderNewScenarioTasksList();
        toast("Đã thêm nhiệm vụ nhánh vào kịch bản.");
    }
    function removeNewScenarioTaskRow(i) {
        const list = window.__newScenarioTasksDraft || [];
        list.splice(i, 1);
        renderNewScenarioTasksList();
    }

    function openScenarioCreateForm(ctx, id, returnKey) {
        /* ctx 'notify'/'assign' = mở từ form GIAO NHIỆM VỤ / picker Nhập notify; ở đó chưa có hồ sơ nên không có id để
           quay về openScenarioSelector(id) — phải quay lại chính màn chọn kịch bản của form. */
        const backFn =
            ctx === "notify" || ctx === "assign"
                ? "notifyOpenScenarioPicker"
                : ctx === "indicator"
                    ? "openIndicatorScenarioSelector"
                    : ctx === "field"
                        ? "openFieldScenarioSelector"
                        : ctx === "general"
                            ? "closeModalNoti"
                            : "openScenarioSelector";
        const backArg = (ctx === "notify" || ctx === "assign") ? "" : `'${id || ""}'`;
        window.__newScenarioTasksDraft = [];
        if (document.getElementById("modalTitleNotify")) {
            document.getElementById("modalTitleNotify").textContent =
                "Thêm mới kịch bản xử lý";
        }
        if (document.getElementById("modalSubNotify")) {
            document.getElementById("modalSubNotify").textContent =
                "Kịch bản mới sẽ dùng được cho cả chỉ tiêu và hồ sơ/nhiệm vụ trong phiên trình duyệt";
        }
        const modalBody = document.getElementById("modalBodyNotify") || document.getElementById("modalBody");
        if (!modalBody) return;

        modalBody.innerHTML =
            `<div class="scenario-create-help">Nhập kịch bản theo cấu trúc: tên kịch bản, mức độ, mô tả, các mốc SLA và danh sách nhiệm vụ gợi ý. Sau khi lưu, kịch bản mới xuất hiện ngay trong màn chọn kịch bản.</div><div class="form2"><div class="field"><label>Mã kịch bản</label><input id="newScenarioKey" value="custom_${Date.now().toString().slice(-5)}" /></div><div class="field"><label>Mức độ</label><select id="newScenarioLevel"><option>Cao</option><option>Khẩn</option><option selected>Trung bình</option><option>Bình thường</option></select></div><div class="field wide"><label>Tên kịch bản</label><input id="newScenarioTitle" placeholder="Ví dụ: Kịch bản xử lý dữ liệu sai lệch giữa các nguồn" /></div><div class="field wide"><label>Mô tả kịch bản</label><textarea id="newScenarioDesc" rows="3" placeholder="Mô tả khi nào áp dụng và mục tiêu xử lý..."></textarea></div><div class="field wide"><label>Lĩnh vực áp dụng (để trống = áp dụng mọi lĩnh vực)</label>${msFieldHtml("newScenarioFields", window.qlnvScenarioLinhVucList(), [])}</div><div class="field wide"><label>SLA/Mốc xử lý, mỗi dòng 1 mốc</label><textarea id="newScenarioSla" rows="3">30 phút tiếp nhận\nTrong ngày có phương án\n24h cập nhật kết quả</textarea></div><div class="field wide"><label>Nhiệm vụ nhánh gợi ý (tự động tạo khi áp dụng kịch bản)</label><div id="newScenarioTasksList" style="display:grid;gap:8px;margin-bottom:8px"></div><button type="button" class="ghost" onclick="openNewScenarioTaskForm()">＋ Thêm nhiệm vụ nhánh</button><div id="newScenarioTaskForm" class="detail-card hidden" style="display:none;margin-top:8px"><div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4></div><div class="form2 compact"><div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="nsTaskName" placeholder="Nhập tên nhiệm vụ nhánh" /></div><div class="field"><label>Người giao</label><input value="Theo tài khoản khi áp dụng" disabled /></div><div class="field"><label>Mã nhiệm vụ nhánh</label><input value="Tự sinh khi áp dụng" disabled /></div><div class="field"><label>Đơn vị chủ trì (nhận việc)</label><select id="nsTaskOwner">${units.map((u) => `<option>${esc(u)}</option>`).join("")}</select></div><div class="field wide"><label>Đơn vị/người phối hợp</label><div class="ms-wrap" style="position:relative"><div id="nsCoordTrigger" onclick="assToggleDropdown('nsCoordDropdown')" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="nsCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span></div><div id="nsCoordDropdown" class="ms-dropdown" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="nsCoordSearch" placeholder="Tìm đơn vị..." oninput="filterNsCoordOptions()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="nsCoordBox" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto">${units.map((u) => `<label class="ns-opt" data-name="${esc(u)}" style="display:flex;gap:8px;align-items:center;justify-content:flex-start;padding:5px 6px;cursor:pointer;text-transform:none;font-size:13px;color:#d0e8f8"><input type="checkbox" class="nsCoord" value="${esc(u)}" onchange="updateNsCoordLabel()" style="width:auto;flex:0 0 auto;margin:0" /><span style="flex:1;text-align:left">${esc(u)}</span></label>`).join("")}</div></div></div></div><div class="field"><label>Mức độ quan trọng</label><select id="nsTaskPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div><div class="field"><label>Độ khẩn</label><select id="nsTaskUrgency"><option>Hỏa tốc</option><option>Khẩn</option><option selected>Thường</option></select></div><div class="field"><label>Ngày bắt đầu</label><input id="nsTaskStart" type="date" /></div><div class="field"><label>Hạn hoàn thành</label><input id="nsTaskDue" type="date" /></div><div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="nsTaskContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div></div><div class="action-bar"><button type="button" class="primary" onclick="addNewScenarioTaskRow()">Thêm vào danh sách</button><button type="button" class="ghost" onclick="closeNewScenarioTaskForm()">Hủy</button></div></div></div></div><div class="action-bar"><button class="primary" onclick="saveNewScenarioTemplate('${ctx}','${id || ""}')">Lưu kịch bản mới</button><button class="ghost" onclick="${backFn}(${backArg})">Quay lại chọn kịch bản</button></div><div class="detail-card"><h4>Các kịch bản tự tạo hiện có</h4><div class="scenario-template-list">${Object.entries(loadCustomScenarios ? loadCustomScenarios() : {})
                .map(
                    ([k, s]) =>
                        `<div class="scenario-template-row"><div><b>${esc(s.title)}</b><small>${esc(s.desc || "")} · ${esc(s.level || "")}</small></div><button class="ghost danger-btn" onclick="deleteCustomScenario('${k}','${ctx}','${id || ""}')">Xóa</button></div>`,
                )
                .join("") || '<div class="muted">Chưa có kịch bản tự tạo.</div>'
            }</div></div>`;
        renderNewScenarioTasksList();
        openModal();
    }

    function saveNewScenarioTemplate(ctx, id) {
        const keyRaw = (document.getElementById("newScenarioKey")?.value || "")
            .trim()
            .replace(/\s+/g, "_");
        const key = keyRaw || `custom_${Date.now()}`;
        const title = (
            document.getElementById("newScenarioTitle")?.value || ""
        ).trim();
        if (!title) {
            toast("Cần nhập tên kịch bản.");
            return;
        }
        const level =
            document.getElementById("newScenarioLevel")?.value || "Trung bình";
        const desc =
            (document.getElementById("newScenarioDesc")?.value || "").trim() ||
            "Kịch bản tự tạo bởi người dùng.";
        const sla = (document.getElementById("newScenarioSla")?.value || "")
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);
        const tasks = (window.__newScenarioTasksDraft || [])
            .filter((x) => x && (Array.isArray(x) ? x[0] : (x.tenNhiemVu || x.name)))
            .map((x) => {
                if (!Array.isArray(x)) {
                    return [
                        x.tenNhiemVu || x.name || "",
                        x.noiDungNhiemVu || x.content || x.tenNhiemVu || x.name || "",
                        x.donViChuTriLabel || x.donViChuTri || x.owner || "Đơn vị chuyên môn",
                        x.priority || "Trung bình",
                        x.ngayHetHan || x.due || "",
                        {
                            urgency: x.doKhan || x.urgency || "Thường",
                            start: x.ngayChiDao || x.start || "",
                            coordinators: x.donViThucHienLabels || x.donViThucHien || x.coordinators || []
                        }
                    ];
                }
                return [
                    x[0],
                    x[1] || x[0],
                    x[2] || "Đơn vị chuyên môn",
                    x[3] || "",
                    x[4] || "",
                    x[5] || {},
                ];
            });
        const fields = msGetValues("newScenarioFields");
        const c = loadCustomScenarios ? loadCustomScenarios() : {};
        c[key] = {
            title,
            level,
            desc,
            sla: sla.length ? sla : ["Trong ngày tiếp nhận", "24h cập nhật kết quả"],
            tasks: tasks.length ? tasks : [[title, desc, "Đơn vị chuyên môn"]],
            fields,
        };
        if (typeof saveCustomScenarios === "function") saveCustomScenarios(c);
        toast("Đã thêm kịch bản mới.");
        if (ctx === "notify" || ctx === "assign") notifyOpenScenarioPicker();
        else if (ctx === "indicator") openIndicatorScenarioSelector(id);
        else if (ctx === "field") openFieldScenarioSelector(id);
        else openScenarioSelector(id);
    }

    function deleteCustomScenario(key, ctx, id) {
        const c = loadCustomScenarios ? loadCustomScenarios() : {};
        delete c[key];
        if (typeof saveCustomScenarios === "function") saveCustomScenarios(c);
        toast("Đã xóa kịch bản tự tạo.");
        openScenarioCreateForm(ctx, id);
    }

    async function editScenario(key, ctx, id) {
        try {
            toast('Đang tải thông tin kịch bản...');
            var res = await QlnvApiNotify.getScenario(key);
            var scenarioData = scenarioApiToUi(res?.data || res);
            if (!scenarioData) {
                toast('Không tìm thấy kịch bản.');
                return;
            }
            window.__editingScenarioKey = key;
            window.__editingScenarioData = scenarioData;
            openScenarioCreateForm(ctx, id);
            setTimeout(function () {
                fillScenarioFormWithData(scenarioData);
            }, 100);
        } catch (err) {
            toast('Tải kịch bản lỗi: ' + getScenarioErrorMessage(err));
        }
    }

    function fillScenarioFormWithData(data) {
        if (!data) return;
        if (document.getElementById('newScenarioKey')) {
            var keyInput = document.getElementById('newScenarioKey');
            keyInput.value = data.key || '';
            keyInput.disabled = true;
        }
        if (document.getElementById('newScenarioTitle')) {
            document.getElementById('newScenarioTitle').value = data.title || '';
        }
        if (document.getElementById('newScenarioLevel')) {
            var levelSelect = document.getElementById('newScenarioLevel');
            var levelOptions = Array.from(levelSelect.options).map(function (o) { return o.value; });
            if (levelOptions.includes(data.level)) {
                levelSelect.value = data.level;
            }
        }
        if (document.getElementById('newScenarioDesc')) {
            document.getElementById('newScenarioDesc').value = data.desc || '';
        }
        if (data.fields && window.__msState && window.__msState['newScenarioFields']) {
            window.__msState['newScenarioFields'].selected = data.fields.slice();
            var tagsEl = document.getElementById('newScenarioFields_tags');
            if (tagsEl) tagsEl.innerHTML = msTagsHtml('newScenarioFields');
        }
        if (document.getElementById('newScenarioSla')) {
            document.getElementById('newScenarioSla').value = Array.isArray(data.sla) ? data.sla.join('\n') : (data.sla || '');
        }
        window.__newScenarioTasksDraft = [];
        if (data.tasks && data.tasks.length) {
            data.tasks.forEach(function (t) {
                window.__newScenarioTasksDraft.push(t);
            });
            renderNewScenarioTasksList();
        }
        if (document.getElementById('modalTitleNotify')) {
            document.getElementById('modalTitleNotify').textContent = 'Sửa kịch bản xử lý';
        }
    }

    /* --- Kịch bản cho hồ sơ/nhiệm vụ --- */
    function openScenarioSelector(id) {
        const r = records.find(x => x.id === id); if (!r) return;
        openScenarioSelectorViaApi('record', id);
    }
    async function selectScenario(id, key, detailRef) {
        const r = records.find(x => x.id === id); if (!r) return; r.selectedScenario = key;
        await loadScenarioDetailForSelection('record', id, key, r, detailRef);
    }
    function applyScenarioTasks(id, key) {
        const r = records.find(x => x.id === id); const s = getActiveScenarioDetail('record', id, key); if (!r || !s) return;
        const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
        if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
        r.subtasks = r.subtasks || [];
        checked.forEach(idx => { const t = s.tasks[idx]; const dup = r.subtasks.some(x => (x.tenNhiemVu || x.name) === t.tenNhiemVu && x.scenario === key); if (!dup) r.subtasks.push(buildAppliedScenarioSubtask(t, idx, key, s.level, `${r.id}-N${String(r.subtasks.length + 1).padStart(2, '0')}`)); });
        r.selectedScenario = key; r.history = r.history || []; r.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `Áp dụng ${s.title}, tạo ${checked.length} nhiệm vụ nhánh liên quan` });
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo kịch bản.`); returnFromScenario(id);
    }
    /* --- Bảng thống kê nhiệm vụ nhánh (chung cho renderRecordDetail) --- */
    /* Nhóm nhiệm vụ nhánh theo đúng kịch bản đã sinh ra nó (dùng chung cho bảng đầy đủ lẫn bản rút gọn trong cây văn bản) */
    function groupSubtasksByScenario(subs) {
        const groups = []; const groupAt = {};
        subs.forEach((s, i) => {
            const key = s.scenario || '';
            if (!(key in groupAt)) { groupAt[key] = groups.length; groups.push({ key, label: key ? (getScenarioTitleByKey(key) || key) : 'Giao thường (không qua kịch bản)', items: [] }); }
            groups[groupAt[key]].items.push({ s, i });
        });
        return groups;
    }
    function subtaskStatsHtml(r, filterScenario) {
        const allSubs = r.subtasks || [];
        const scoped = filterScenario === undefined ? allSubs : allSubs.filter(s => (s.scenario || '') === filterScenario);
        const done = scoped.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length; const doing = scoped.filter(s => (s.state || '').toLowerCase().includes('đang')).length; const soon = scoped.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
        const allGroups = groupSubtasksByScenario(allSubs);
        const groups = filterScenario === undefined ? allGroups : allGroups.filter(g => g.key === filterScenario);
        const groupsHtml = groups.length ? groups.map(g => {
            const rows = g.items.map(({ s, i }) => `<tr class="clickable" onclick="openSubTaskDetail('${r.id}',${i})"><td>${s.id || ('NVN-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-name-col">${s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.content || s.name || '--'}</td><td>${s.owner || '--'}</td><td>${s.due || '--'}</td><td>${s.progress ?? (s.state && s.state.includes('Hoàn') ? 100 : 35)}%</td><td><span class="badge ${s.state && s.state.includes('Hoàn') ? 'ok' : s.state && s.state.includes('Sắp') ? 'warn' : ''}">${s.state || 'Đang xử lý'}</span></td></tr>`).join('');
            return `<div class="task-scenario-group"><div class="task-scenario-heading">? ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }).join('') : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh${filterScenario !== undefined ? ' trong kịch bản này' : ''}. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống chậm tiến độ/quá hạn/thiếu dữ liệu.</div>`;
        const heading = filterScenario === undefined ? `Thống kê nhiệm vụ nhánh liên quan ${r.metric === 'docIn' || r.metric === 'docOut' ? 'văn bản' : 'nhiệm vụ'} chính` : `Nhiệm vụ nhánh cùng kịch bản: ${groups[0] ? groups[0].label : (filterScenario ? getScenarioTitleByKey(filterScenario) || filterScenario : 'Giao thường (không qua kịch bản)')}`;
        const actionBar = filterScenario === undefined ? `<div class="action-bar"><button class="primary" onclick="openScenarioSelector('${r.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>` : `<div class="action-bar"><button class="ghost" onclick="toast('Đã xuất bảng nhiệm vụ nhánh của ${r.id}')">Xuất bảng</button></div>`;
        return `<section class="subtask-summary"><div class="subtask-head"><div><h4>${heading}</h4><div class="subtask-meta-note">Chọn kịch bản xử lý → tạo nhiệm vụ nhánh liên quan, nhóm theo đúng kịch bản → có thể thêm mới nhiệm vụ nhánh.</div></div>${actionBar}</div><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(scoped.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div><div class="task-scenario-groups">${groupsHtml}</div></section>`;
    }
    /* Đơn vị chủ trì/phối hợp dùng CHUNG picker cây/chip "subNv" với openNotifySubTaskForm (xem định nghĩa
       subNv phía dưới, nay ở phạm vi global) — thay cho list phẳng "subOwner" / "subCoord" cũ, để 2 form
       "Giao nhiệm vụ nhánh" (từ hồ sơ chính vs từ tab lĩnh vực) đồng bộ cùng 1 kiểu giao diện chọn đơn vị. */
    function openSubTaskForm(parentId) {
        const r = records.find(x => x.id === parentId);
        if (!r) { if (typeof toast === 'function') toast('Không tìm thấy dữ liệu nhiệm vụ cha (' + parentId + ') để mở form giao nhiệm vụ nhánh.'); return; }
        window.__assignmentFilesNoti = [];
        window.__subNvUnitState = { selectedId: '', selectedLabel: '', query: '' };
        window.__subNvCoordState = { selectedIds: [], selectedLabels: {} };
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') __qlnvPickedPerson = null;
        loadCrmStatusMapping().then(function () {
            syncAssignmentOptionsFromCrmStatus();
            document.getElementById('modalTitleNotify').textContent = `Giao nhiệm vụ nhánh · ${r.code}`;
            document.getElementById('modalSubNotify').textContent = `Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${r.code} · ${r.title}`;
            const rAxis = axisMeta[r.role] || axisMeta[QLNV_DEFAULT_ROLE];
            document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="scenario-history-badge"><b>Nhiệm vụ cha:</b> ${esc(r.code)} · ${esc(r.title)} · Trục ${rAxis.icon} ${esc(rAxis.name)}</div>
      <div class="detail-card">
        <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
        <div class="form2 compact widget-body">
        <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="subTitle" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
        <div class="field"><label>Người giao</label><input value="${esc(currentAccount.title)}" disabled /></div>
        <div class="field"><label>Mã nhiệm vụ nhánh</label><input id="subCode" value="${generateTaskCode()}" /></div>
        <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><div class="ms-wrap" style="position:relative"><input type="hidden" id="subNvUnit" value="" /><div id="subNvUnitTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="subNvUnitTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị chủ trì</span><span style="position:absolute;top:4px;right:12px;color:#49bcff;pointer-events:none">⌄</span></div><div id="subNvUnitDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="subNvUnitSearch" placeholder="Tìm đơn vị..." autocomplete="off" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="subNvUnitList" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto"></div><div id="subNvUnitStatus" style="padding:4px 2px 0;color:#8ab0c8;font-size:12px"></div></div></div></div>
        <div class="field wide"><label>Đơn vị/người phối hợp</label>
          <div class="ms-wrap" style="position:relative">
            <div id="subNvCoordTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
              <span id="subNvCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
            </div>
            <div id="subNvCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
              <input type="text" id="subNvCoordSearch" placeholder="Tìm đơn vị..." style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
              <div id="subNvCoordBox" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto"></div>
            </div>
          </div>
        </div>
        <div class="field"><label>Mức độ quan trọng</label><select id="subPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div>
        <div class="field"><label>Độ khẩn</label><select id="subUrgency">${renderUrgencyOptions()}</select></div>
        <div class="field half"><label>Ngày bắt đầu</label><input id="subStart" type="date" /></div>
        <div class="field half"><label>Hạn hoàn thành</label><input id="subDue" type="date" /></div>
        <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="subContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
        <div class="field wide"><label>Đính kèm file</label><input id="subFileInputNoti" type="file" multiple onchange="handleAssignmentFilesNoti(this)" /><div id="assFileListNoti" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
        </div>
      </div>
      <div class="action-bar"><button class="primary" onclick="createSubTaskAssignment('${parentId}')">Phát hành nhiệm vụ nhánh</button><button class="ghost" onclick="openScenarioSelector('${parentId}')">⚡ Dùng kịch bản có sẵn</button><button class="ghost" onclick="closeModalNoti()">Hủy</button></div>`;
            var unitTriggerEl = document.getElementById('subNvUnitTrigger');
            if (unitTriggerEl) unitTriggerEl.addEventListener('click', subNvToggleUnitDropdown);
            var unitListEl = document.getElementById('subNvUnitList');
            if (unitListEl) unitListEl.addEventListener('click', subNvHandleUnitTreeClick);
            var unitSearchEl = document.getElementById('subNvUnitSearch');
            if (unitSearchEl) unitSearchEl.addEventListener('input', subNvFilterUnitOptions);
            var coordTriggerEl = document.getElementById('subNvCoordTrigger');
            if (coordTriggerEl) coordTriggerEl.addEventListener('click', subNvToggleCoordDropdown);
            var coordSearchEl = document.getElementById('subNvCoordSearch');
            if (coordSearchEl) coordSearchEl.addEventListener('input', subNvFilterCoordOptions);
            var coordTriggerTextEl = document.getElementById('subNvCoordTriggerText');
            if (coordTriggerTextEl) coordTriggerTextEl.addEventListener('click', subNvHandleChipRemoveClick);
            var coordBoxEl = document.getElementById('subNvCoordBox');
            if (coordBoxEl) { coordBoxEl.addEventListener('click', subNvHandleCoordTreeClick); coordBoxEl.addEventListener('change', subNvHandleCoordTreeChange); }
            openModal();
            if (document.getElementById('subUrgency') && window.__crmUrgencyOptions && window.__crmUrgencyOptions.length) {
                document.getElementById('subUrgency').value = window.__crmUrgencyOptions[0];
            }
        }).catch(function (err) {
            console.error('[openSubTaskForm] lỗi khi mở form giao nhiệm vụ nhánh:', err);
            if (typeof toast === 'function') toast('Không mở được form giao nhiệm vụ nhánh: ' + (err && (err.message || err)));
        });
    }
    function createSubTaskAssignment(parentId) {
        const r = records.find(x => x.id === parentId); if (!r) return;
        const name = (document.getElementById('subTitle').value || '').trim(); if (!name) { toast('Cần nhập tên nhiệm vụ nhánh.'); return; }
        const unitState = getSubNvUnitState();
        const owner = unitState.selectedId;
        if (!owner) { toast('Cần chọn Đơn vị chủ trì (nhận việc).'); return; }
        const ownerLabel = unitState.selectedLabel || owner;
        const coordState = getSubNvCoordState();
        const duplicatedCoordinator = coordState.selectedIds.find(function (cid) {
            return isSameAdministrativeUnit(
                { id: cid, label: coordState.selectedLabels[cid] || cid },
                { id: owner, label: ownerLabel }
            );
        });
        if (duplicatedCoordinator) { toast('Đơn vị phối hợp không được trùng với đơn vị chủ trì (nhận việc).'); return; }
        const coordinators = coordState.selectedIds.slice();
        const coordinatorLabels = coordState.selectedIds.map(cid => coordState.selectedLabels[cid] || cid);
        const priority = document.getElementById('subPriority').value;
        const urgency = document.getElementById('subUrgency').value;
        const startDate = document.getElementById('subStart').value || '';
        const dueRaw = document.getElementById('subDue').value || ''; const due = dueRaw ? dueRaw.split('-').reverse().join('/') : dueDate(0, 'doing');
        const content = (document.getElementById('subContent').value || '').trim() || name;
        const attachments = window.__assignmentFilesNoti || [];
        const idBase = `${r.id}-N${String(((r.subtasks || []).length) + 1).padStart(2, '0')}`;
        const subCode = (document.getElementById('subCode').value || '').trim() || generateTaskCode();
        const parentQlnvId = resolveParentQlnvId(r);
        const parentSnapshot = r.__assignmentSnapshot || {};
        const inheritedCoordinatorIds = (coordinators.length ? coordinators : (parentSnapshot.coordinatorIds || [])).slice();
        const inheritedCoordinatorLabels = (coordinatorLabels.length ? coordinatorLabels : (parentSnapshot.coordinatorLabels || [])).slice();
        const inheritedDocType = parentSnapshot.docType || r.docType || '';
        const inheritedField = parentSnapshot.field || r.field || '';
        const inheritedUrgency = urgency || parentSnapshot.urgency;
        const inheritedDescription = parentSnapshot.description || r.description || content;
        const effectiveStartDate = startDate || parentSnapshot.startDate || '';
        if (isQlnvConfigured()) {
            if (window.__qlnvSubmitting) { if (typeof toast === 'function') toast('Đang gửi nhiệm vụ nhánh, vui lòng đợi…'); return; }
            if (!parentQlnvId) { toast('Không xác định được nhiệm vụ cha trên QLNV — không thể giao nhánh.'); return; }
            // Route v2 (đồng bộ từ khối nhiệm vụ, xem buildQlnvCreateBodyV2) — thay route cũ /qlnv/bmm/create vì
            // nhận thẳng id SỐ của cây organization-structure (subNvUnitTree), không cần quy đổi ObjectId.
            var form = {
                title: name,
                loaiNV: 'NHIEM_VU_CON',
                parentId: parentQlnvId,
                capTrinh: parentSnapshot.capTrinh || '1',
                startDate: effectiveStartDate,
                dueDate: dueRaw,
                lanhDaoChiDaoId: (window.QLNV_CREATE_DEFAULTS && window.QLNV_CREATE_DEFAULTS.lanhDaoChiDaoId) || qlnvDefaultLeaderId(),
                donViChuTri: (owner ? [owner] : null),
                receiverPersonId: (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') ? __qlnvPickedPerson.id : null,
                urgency: inheritedUrgency,
                description: content,
                docType: inheritedDocType,
                fieldLabel: inheritedField,
                soVanBan: subCode,
                donViThucHien: inheritedCoordinatorIds,
                donViThucHienLabels: inheritedCoordinatorLabels
            };
            var body = buildQlnvCreateBodyV2(form);
            if (!body) return;
            if (!body.noiDungNhiemVu) body.noiDungNhiemVu = inheritedDescription;
            // Đồng bộ payload với modal Nhập notify/Tạo nhiệm vụ: "Mức độ quan trọng" (subPriority) trước đây
            // chỉ lưu vào record local, không gửi lên QLNV.
            body.mucDoQuanTrong = mapImportanceToMucDoQuanTrong(priority);
            window.__qlnvSubmitting = true;
            if (typeof toast === 'function') toast('Đang gửi nhiệm vụ nhánh lên QLNV...');
            qlnvCreateTaskV2(body).then(function (res) {
                var newId = extractQlnvTaskId(res);
                r.subtasks = r.subtasks || [];
                var subId = newId ? ('QLNV-' + newId) : idBase;
                var attachmentsKey = attachments.length ? `px-ioc-files-${subId}` : null;
                if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
                r.subtasks.push({ id: subId, name: name, content: content, owner: ownerLabel, coordinators: inheritedCoordinatorLabels, state: 'Đang xử lý', due: due, startDate: effectiveStartDate, priority: priority, urgency: inheritedUrgency, progress: 5, scenario: '', attachmentsKey: attachmentsKey, evidence: attachments.map(a => a.name), created: new Date().toLocaleString('vi-VN'), __qlnvId: newId || undefined, __parentId: parentQlnvId });
                r.history = r.history || []; r.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `${currentAccount.title} giao nhiệm vụ nhánh mới cho ${r.id}: ${name} → ${ownerLabel}` });
                if (typeof toast === 'function') toast(`Đã giao nhiệm vụ nhánh "${name}" lên QLNV.`);
                return loadQlnvMetric('assigned', { force: true }).then(function () {
                    if (typeof renderMetricTabs === 'function') renderMetricTabs();
                    if (typeof renderAxisDashboard === 'function') renderAxisDashboard();
                    returnFromScenario(r.id);
                });
            }).catch(function (err) {
                if (typeof toast === 'function') toast('Tạo nhiệm vụ nhánh QLNV lỗi: ' + (err && (err.message || err)) + ' — CHƯA lưu, vui lòng thử lại.');
            }).finally(function () { window.__qlnvSubmitting = false; });
            return;
        }
        r.subtasks = r.subtasks || [];
        const id = idBase;
        const attachmentsKey = attachments.length ? `px-ioc-files-${id}` : null;
        if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
        r.subtasks.push({ id, name, content, owner: ownerLabel, coordinators: inheritedCoordinatorLabels, state: 'Đang xử lý', due, startDate: effectiveStartDate, priority, urgency: inheritedUrgency, progress: 5, scenario: '', attachmentsKey, evidence: attachments.map(a => a.name), created: new Date().toLocaleString('vi-VN') });
        r.history = r.history || []; r.history.unshift({ time: new Date().toLocaleString('vi-VN'), text: `${currentAccount.title} giao nhiệm vụ nhánh mới cho ${r.id}: ${name} → ${ownerLabel}` });
        toast(`Đã giao nhiệm vụ nhánh "${name}" là nhiệm vụ con của ${r.id}.`);
        returnFromScenario(r.id);
    }
    function openSubTaskDetail(parentId, idx) {
        const r = records.find(x => x.id === parentId); const s = r?.subtasks?.[idx]; if (!r || !s) return;
        document.getElementById('modalTitleNotify').textContent = `Chi tiết nhiệm vụ nhánh · ${s.id || idx + 1}`;
        document.getElementById('modalSubNotify').textContent = `Gắn với ${r.id} · ${r.title}`;
        const attFiles = s.attachmentsKey ? JSON.parse(localStorage.getItem(s.attachmentsKey) || '[]') : [];
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="returnFromScenario('${parentId}')">← Quay lại hồ sơ chính</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || s.maNhanh || '--'}</span><b>Nhiệm vụ cha</b><span>${r.code} · ${r.title}</span><b>Kịch bản</b><span>${s.scenario ? getScenarioTitleByKey(s.scenario) : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.tenNhiemVu || s.name || '--'}</span><b>Nội dung</b><span class="wrap">${s.noiDungNhiemVu || s.content || s.tenNhiemVu || s.name || '--'}</span><b>Đơn vị chủ trì</b><span>${s.donViChuTri || s.owner}</span><b>Đơn vị phối hợp</b><span>${((s.donViThucHien || s.coordinators) && ((s.donViThucHien || s.coordinators).length)) ? (s.donViThucHien || s.coordinators).join(', ') : '—'}</span><b>Ngày bắt đầu</b><span>${s.ngayChiDao || s.startDate || '—'}</span><b>Hạn xử lý</b><span>${s.ngayHetHan || s.due || '--'}</span><b>Mức ưu tiên</b><span>${s.priority || 'Trung bình'}</span><b>Độ khẩn</b><span>${s.doKhan || s.urgency || '—'}</span><b>Trạng thái</b><span>${s.trangThai || s.state || 'Đang xử lý'}</span>${attFiles.length ? `<b>File đính kèm</b><span>${attFiles.map(f => `<a href="${f.dataUrl}" download="${f.name}" style="color:#49bcff">${f.name}</a>`).join(', ')}</span>` : ''}</div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.trangThai || s.state || 'Đang xử lý'}</span><b>Tiến độ</b><span class="mono">${s.progress ?? 30}%</span></div></div></div>${subtaskStatsHtml(r, s.scenario || '')}`;
        openModal();
    }

    /* ============================== CHI TIẾT 1 HỒ SƠ/NHIỆM VỤ (cấp 2) ============================== */
    /* Style spinner đồng bộ chi tiết (inject 1 lần — chỉ ở qlnv_v1.js, không sửa css gốc). */
    function ensureQlnvDetailStyles() {
        if (typeof document === 'undefined' || document.getElementById('qlnv-detail-styles')) return;
        var s = document.createElement('style'); s.id = 'qlnv-detail-styles';
        s.textContent = '@keyframes qlnvspin{to{transform:rotate(360deg)}}'
            + '.qlnv-syncing{display:flex;align-items:center;gap:8px;color:#49bcff}'
            + '.qlnv-syncing .sp{width:14px;height:14px;border:2px solid rgba(73,188,255,.3);border-top-color:#49bcff;border-radius:50%;animation:qlnvspin .7s linear infinite;display:inline-block;flex:0 0 auto}';
        document.head.appendChild(s);
    }
    function openRecordDetail(id, fromId) {
        const r = records.find(x => x.id === id); if (!r) return;
        window.__scenarioReturnDocId = null;
        window.__scenarioReturnNotifyTaskId = null;
        window.__recordBackId = fromId || null;
        const limited = isLimitedRole(r.role);
        document.getElementById('modalTitleNotify').textContent = `Cấp 2 · ${r.code}`;
        document.getElementById('modalSubNotify').textContent = `${metricMeta[r.metric].label} · ${axisMeta[r.role].name} · ${statusMeta(r.status).label}`;
        // API record: hiện skeleton/loading rồi thay bằng CHI TIẾT THẬT từ getTask (không giữ mock).
        const willFetch = r.__qlnvId && isQlnvConfigured();
        if (willFetch) ensureQlnvDetailStyles();
        const loadingNote = '<div class="record-update-note qlnv-syncing"><span class="sp"></span> Đang tải chi tiết đầy đủ từ QLNV…</div>';
        renderRecordDetail(r, limited, willFetch ? loadingNote : ''); openModal();
        if (willFetch) {
            QlnvApiNotify.getTask(r.__qlnvId).then(function (detail) {
                var nv = detail.data || detail.item || detail;
                if (!nv || typeof nv !== 'object') { renderRecordDetail(r, limited, ''); return; }
                var enriched = enrichRecordFromQlnv(r, nv);
                document.getElementById('modalSubNotify').textContent = `${metricMeta[enriched.metric].label} · ${axisMeta[enriched.role].name} · ${statusMeta(enriched.status).label} · QLNV`;
                renderRecordDetail(enriched, limited, '');   // thay loading bằng dữ liệu thật
            }).catch(function (err) {
                renderRecordDetail(r, limited, '<div class="record-update-note" style="color:#e6934a">⚠ Không tải được chi tiết đầy đủ từ QLNV — đang hiển thị dữ liệu danh sách.</div>');
                if (typeof toast === 'function') toast('Không tải chi tiết QLNV: ' + (err.message || err));
            });
        }
    }
    function sourceForRecord(r) {
        if (r.metric === 'docIn' || r.metric === 'docOut') return { name: 'Văn bản/PDF', offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000 };
        if (r.metric === 'indicator') return { name: 'CSDL chuyên ngành', offset: 18 * 60 * 1000 + 15 * 1000 };
        return { name: 'API realtime', offset: 3 * 60 * 1000 + 28 * 1000 };
    }
    function relTime(offsetMs) {
        const s = Math.floor(offsetMs / 1000);
        if (s < 60) return `${s} giây trước`;
        const m = Math.floor(s / 60); if (m < 60) return `${m} phút trước`;
        const h = Math.floor(m / 60), mm = m % 60; if (h < 24) return `${h} giờ${mm ? ` ${mm} phút` : ''} trước`;
        const d = Math.floor(h / 24), hh = h % 24; return `${d} ngày${hh ? ` ${hh} giờ` : ''} trước`;
    }
    function dtTime(offsetMs) { const d = new Date(Date.now() - offsetMs); return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }
    function renderRecordDetail(r, limited, syncNote) {
        const isDoc = r.metric === 'docIn' || r.metric === 'docOut';
        const st = statusMeta(r.status);
        const isApi = !!r.__qlnv;
        // Nhiệm vụ từ API: chỉ hiện % khi QLNV có số liệu thật; không thì hiện trạng thái (không bịa %).
        const progressHtml = (isApi && !r.__hasProgress)
            ? `<p class="wrap" style="color:#8ab0c8;margin-top:6px">Tiến độ: <b style="color:${st.color}">${st.label}</b> <span style="opacity:.65">· QLNV chưa cung cấp số liệu %</span></p>`
            : `<div class="progress"><i style="width:${r.progress}%"></i></div><p><b class="mono">${r.progress}%</b> hoàn thành</p>`;
        let content = '';
        {
            if (isDoc) {
                content = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin văn bản</h4><div class="kv"><b>Loại</b><span>${r.metric === 'docIn' ? 'Văn bản đến' : 'Văn bản đi'}</span><b>Số/ký hiệu</b><span class="mono">${esc(r.code || '—')}</span><b>Tên văn bản</b><span>${esc(r.title)}</span><b>Trích yếu</b><span class="wrap">${esc(r.summary || '—')}</span><b>Loại văn bản</b><span>${esc(r.docType || '—')}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Lĩnh vực</b><span>${esc(r.field)}</span><b>Lãnh đạo ký</b><span>${limited ? 'Ẩn theo phân quyền' : esc(r.signer || '—')}</span><b>Cơ quan ban hành</b><span>${esc(r.issuer || '—')}</span><b>Đơn vị xử lý</b><span>${limited ? 'Ẩn theo phân quyền' : esc(r.unit)}</span><b>Ngày văn bản</b><span>${esc(r.created)}</span><b>Hạn xử lý</b><span>${esc(r.due)}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span></div></div><div class="detail-card"><h4>Mô tả &amp; tiến độ</h4><p class="wrap">${limited ? 'Nội dung được che theo phân quyền.' : esc(r.description)}</p>${progressHtml}<div class="action-bar"><button class="primary" onclick="openAssignmentFromDocument('${r.id}')">＋ Giao nhiệm vụ từ văn bản này</button><button class="ghost" onclick="toast('Đã gửi nhắc xử lý văn bản tới đơn vị xử lý.')">Nhắc xử lý</button></div></div></div>`;
            } else {
                const linkedDocs = (r.linkedDocIds || []).map(id => records.find(x => x.id === id)).filter(Boolean);
                content = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ/văn bản</h4><div class="kv"><b>Mã nhiệm vụ</b><span>${esc(r.code || '—')}</span><b>Loại văn bản</b><span>${esc(r.docType || '—')}</span><b>Tiêu đề</b><span>${limited ? '[Đã rút gọn theo phân quyền] ' : ''}${esc(r.title)}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Lĩnh vực</b><span>${esc(r.field)}</span><b>Đơn vị chủ trì</b><span>${limited ? 'Đơn vị liên quan được masking' : esc(r.unit)}</span><b>Đơn vị phối hợp</b><span>${limited ? 'Ẩn theo phân quyền' : ((r.coordinators && r.coordinators.length) ? esc(r.coordinators.join(', ')) : '—')}</span><b>Người giao</b><span>${limited ? 'Ẩn theo phân quyền' : esc(r.creator)}</span><b>Người nhận</b><span>${limited ? 'Ẩn theo phân quyền' : esc(r.receiver)}</span><b>Ngày bắt đầu</b><span>${esc(r.startDate || '—')}</span><b>Hạn hoàn thành</b><span>${esc(r.due)}</span><b>Mức độ quan trọng</b><span>${esc(r.importance || r.priority)}</span><b>Độ khẩn</b><span>${esc(r.urgency || '—')}</span><b>Văn bản liên kết</b><span>${linkedDocs.length ? linkedDocs.map(d => `<a href="javascript:void(0)" onclick="openRecordDetail('${d.id}','${r.id}')" style="color:#49bcff">${esc(d.code)} – ${esc(d.title)}</a>`).join('; ') : '—'}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span>${r.__qlnvId ? `<b>QLNV ID</b><span class="mono">${esc(r.__qlnvId)}</span>` : ''}</div></div><div class="detail-card"><h4>Mô tả &amp; tiến độ</h4><p class="wrap">${limited ? 'Nội dung được che theo phân quyền.' : esc(r.description)}</p>${r.additionalInfo ? `<p class="wrap"><b>Thông tin bổ sung:</b> ${esc(r.additionalInfo)}</p>` : ''}${progressHtml}<div class="action-bar"><button class="primary" onclick="openSubTaskForm('${r.id}')">Giao nhiệm vụ nhánh</button><button class="ghost" onclick="toast('Đã gửi nhắc việc tới đơn vị xử lý.')">Nhắc việc</button><button class="ghost danger-btn" onclick="toast('Đã lập phiếu báo cáo vượt cấp cho nhiệm vụ này.')">Báo cáo vượt cấp</button></div></div></div>`;
            }
        }
        const src = sourceForRecord(r);
        // Nhiệm vụ API: nguồn THẬT (không bịa "X phút trước"); bỏ khối nhiệm vụ nhánh/kịch bản demo.
        const note = isApi
            ? `<div class="record-update-note">Nguồn: <b>Hệ thống QLNV</b> · đồng bộ trực tiếp khi mở chi tiết${r.__qlnvId ? ` · ID <span class="mono">${r.__qlnvId}</span>` : ''}.</div>`
            : `<div class="record-update-note">Nguồn dữ liệu liên quan: <b>${src.name}</b> · cập nhật gần nhất <b>${dtTime(src.offset)}</b> · <b>${relTime(src.offset)}</b>.</div>`;
        const bottom = isApi ? '' : (isDoc ? linkedTasksTreeHtml(r) : subtaskStatsHtml(r));
        const backRec = window.__recordBackId ? records.find(x => x.id === window.__recordBackId) : null;
        const backHtml = backRec ? `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${backRec.id}')">← Quay lại ${backRec.id}</button></div>` : '';
        document.getElementById('modalBodyNotify').innerHTML = `${backHtml}${syncNote || ''}${note}${content}${bottom}`;
    }

    /* ============================== CÂY NHIỆM VỤ CỦA 1 VĂN BẢN ============================== */
    function openAssignmentFromDocument(docId) {
        const doc = records.find(x => x.id === docId);
        window.__assignmentReturnDocId = docId;
        openAssignmentForm(doc ? doc.metric : 'doc');
        if (doc) { window.__selectedDocs = [doc]; renderSelectedDocsList(); }
    }
    function linkedTasksTreeHtml(doc) {
        const tasks = records.filter(t => (t.metric === 'assigned' || t.metric === 'received') && t.linkedDocIds?.includes(doc.id));
        if (!tasks.length) return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này</h4></div><div class="subtask-empty">Chưa có nhiệm vụ nào được giao từ văn bản này. Dùng nút "Giao nhiệm vụ từ văn bản này" ở trên để tạo nhiệm vụ đầu tiên.</div></div>`;
        const rows = tasks.map(t => {
            const st = statusMeta(t.status);
            return `<tr class="clickable" data-task-id="${t.id}" onclick="onTaskRowClick(this,'${t.id}','${doc.id}')"><td class="tc"><span class="tree-toggle">▸</span></td><td class="mono">${t.code}</td><td class="subtask-name-col">${t.title}</td><td>${metricMeta[t.metric].short}</td><td>${t.unit || ''}</td><td>${t.due}</td><td><div class="progress" style="width:76px"><i style="width:${t.progress}%"></i></div></td><td><span class="badge" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></td><td class="tc"><button type="button" title="Xem chi tiết nhiệm vụ" onclick="event.stopPropagation();openTaskDetailFromDocument('${t.id}','${doc.id}')" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">→</button></td></tr><tr class="task-children-row hidden" data-task-children="${t.id}"><td colspan="9"></td></tr>`;
        }).join('');
        return `<div class="detail-card linked-tasks-card"><div class="card-head"><h4>Nhiệm vụ liên quan văn bản này (${fmt(tasks.length)})</h4></div><div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th></th><th>Mã nhiệm vụ</th><th>Tiêu đề</th><th>Loại</th><th>Đơn vị</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
    }
    /* Xem nhanh (rút gọn) khi mở 1 nhiệm vụ trong cây: tách rõ 2 phần — kịch bản đang áp dụng, và danh sách nhiệm vụ con (chỉ nội dung chính). Bấm vào 1 nhiệm vụ con mới mở chi tiết đầy đủ. */
    function taskInlineSummaryHtml(task) {
        const subs = task.subtasks || [];
        const groups = groupSubtasksByScenario(subs);
        const groupsHtml = groups.length ? groups.map(g => {
            const rows = g.items.map(({ s, i }) => {
                const done = (s.state || '').toLowerCase().includes('hoàn'), soon = (s.state || '').toLowerCase().includes('sắp');
                const stColor = done ? '#2fb174' : soon ? '#d8a50c' : '#2c7dd2';
                return `<button type="button" class="task-subtask-mini-row" onclick="openSubTaskDetail('${task.id}',${i})">
          <span class="task-subtask-mini-name" title="${s.name || ''}">${s.name || 'Việc nhánh'}</span>
          <span class="task-subtask-mini-owner">${s.owner || ''}</span>
          <span class="badge" style="background:${stColor}22;color:${stColor};border:1px solid ${stColor}66">${s.state || 'Đang xử lý'}</span>
          <span class="mono task-subtask-mini-pct">${s.progress ?? 0}%</span>
        </button>`;
            }).join('');
            return `<div class="task-scenario-group">
        <div class="task-scenario-heading">? ${g.label}<span class="badge gold">${fmt(g.items.length)}</span></div>
        <div class="task-subtask-mini-list">${rows}</div>
      </div>`;
        }).join('') : '<div class="subtask-empty">Chưa có nhiệm vụ con nào.</div>';
        return `<div class="task-inline-summary">
      <div class="task-scenario-groups">${groupsHtml}</div>
      <div class="action-bar"><button class="primary" onclick="openScenarioSelector('${task.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openSubTaskForm('${task.id}')">Giao nhiệm vụ nhánh</button></div>
    </div>`;
    }
    /* Handler onClick gắn trực tiếp vào row nhiệm vụ chính (không đi qua bước innerHTML trung gian nào khác
       có thể bị đè) — mở/đóng dropdown và LUÔN gọi API con-moi-full lấy nhiệm vụ con mới nhất khi mở, thay vì
       chỉ dựa vào cờ __childrenLoaded (áp dụng cho mọi nhiệm vụ, không riêng nhiệm vụ notify). */
    function onTaskRowClick(rowEl, taskId, docId) {
        if (docId) window.__scenarioReturnDocId = docId;
        const childRow = rowEl.nextElementSibling; if (!childRow) return;
        const cell = childRow.querySelector('td');
        const willOpen = childRow.classList.contains('hidden');
        const toggle = rowEl.querySelector('.tree-toggle');
        if (!willOpen) {
            childRow.classList.add('hidden'); cell.innerHTML = '';
            if (toggle) toggle.textContent = '▸';
            return;
        }
        childRow.classList.remove('hidden');
        if (toggle) toggle.textContent = '▾';
        const task = records.find(x => x.id === taskId);
        if (!task) { cell.innerHTML = '<div class="subtask-empty">Không tìm thấy dữ liệu nhiệm vụ (có thể đã bị làm mới ở nơi khác).</div>'; return; }
        cell.innerHTML = '<div class="access-lock">Đang tải nhiệm vụ con...</div>';
        const qlnvParentId = task.__notifyTaskId || resolveParentQlnvId(task);
        if (!qlnvParentId) { task.__childrenLoaded = true; cell.innerHTML = taskInlineSummaryHtml(task); return; }
        fetchChildTasks(qlnvParentId).then(res => {
            const items = Array.isArray(res && res.data) ? res.data : [];
            task.subtasks = items.map(mapNotifyChildToSubtask);
        }).catch(e => {
            console.error('[task-row] lỗi tải nhiệm vụ con:', e);
            task.subtasks = task.subtasks || [];
        }).finally(() => {
            task.__childrenLoaded = true;
            if (!childRow.classList.contains('hidden')) cell.innerHTML = taskInlineSummaryHtml(task);
        });
    }
    /* Giữ tên cũ để tương thích ngược với các chỗ đang gọi trực tiếp (vd: returnFromScenario). */
    function toggleTaskNode(rowEl, taskId, docId) { return onTaskRowClick(rowEl, taskId, docId); }
    /* Xem chi tiết đầy đủ 1 nhiệm vụ từ trong cây của văn bản — dùng lại popup hiện có, kèm nút quay lại đúng văn bản. */
    function openTaskDetailFromDocument(taskId, docId) {
        openRecordDetail(taskId);
        window.__scenarioReturnDocId = docId;
        setTimeout(() => {
            const body = document.getElementById('modalBodyNotify');
            if (body && !body.querySelector('.iip-modal-back')) {
                body.insertAdjacentHTML('afterbegin', `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${docId}')">← Quay lại văn bản</button></div>`);
            }
        }, 0);
    }
    /* Sau khi tạo/xong luồng kịch bản xử lý, nếu đang thao tác từ trong cây của 1 văn bản thì quay lại đúng văn bản đó (giữ nguyên nhiệm vụ đang mở), ngược lại về trang nhiệm vụ độc lập như cũ. */
    function returnFromScenario(taskId) {
        window.__assignmentFilesNoti = [];
        /* Vào kịch bản từ modal "nhiệm vụ QLNV thật" (openNotifyTaskScenarioSelector) -> quay lại ĐÚNG modal
           đó (renderTaskDetailModal) và nạp lại nhiệm vụ nhánh từ API, thay vì rơi về openRecordDetail —
           record ép ra bởi ensureNotifyLinhVucTaskRecord chỉ để tra cứu, không phải màn hình hiển thị chính. */
        const notifyTaskId = window.__scenarioReturnNotifyTaskId;
        window.__scenarioReturnNotifyTaskId = null;
        if (notifyTaskId && notifyTaskDetailState && notifyTaskDetailState.record && notifyTaskDetailState.record.id === notifyTaskId) {
            const s = notifyTaskDetailState;
            s.children = []; s.childrenTotal = null; s.childrenStats = null; s.hasMore = true; s.loading = true;
            renderTaskDetailModal();
            loadChildTasksPage();
            return;
        }
        const docId = window.__scenarioReturnDocId;
        if (docId && records.some(x => x.id === docId)) {
            openRecordDetail(docId, window.__recordBackId || undefined);
            setTimeout(() => {
                const row = document.querySelector(`.linked-tasks-card tr.clickable[data-task-id="${taskId}"]`);
                if (row) toggleTaskNode(row, taskId, docId);
            }, 0);
        } else {
            openRecordDetail(taskId, window.__recordBackId || undefined);
        }
    }
    /* Mở picker kịch bản thật (API /qlnv/scenarios) từ modal "nhiệm vụ QLNV thật" (openTaskDetailModal) —
       dùng chung cho cả nút "Chọn kịch bản xử lý" (childTasksSectionHtml) lẫn "Dùng kịch bản có sẵn"
       (openNotifySubTaskForm). Đánh dấu __scenarioReturnNotifyTaskId để returnFromScenario() biết quay lại
       đúng modal này (xem trên) thay vì màn hình hồ sơ chung. */
    function openNotifyTaskScenarioSelector() {
        const s = notifyTaskDetailState;
        if (!s || !s.record) { toast('Không tìm thấy dữ liệu nhiệm vụ để chọn kịch bản.'); return; }
        window.__scenarioReturnNotifyTaskId = s.record.id;
        openScenarioSelector(s.record.id);
    }
    /* IOC chỉ nhận và hiển thị dữ liệu nhiệm vụ/văn bản đổ về từ phần mềm nguồn — không có thao tác sửa trạng thái/tiến độ tay trong IOC.
       "Xem nhật ký đồng bộ" thay cho form cập nhật cũ: chỉ xem lịch sử đồng bộ, không sửa. */
    function openSyncLog(id) {
        const r = records.find(x => x.id === id); if (!r) return;
        const isDoc = r.metric === 'docIn' || r.metric === 'docOut';
        const st = statusMeta(r.status); const src = sourceForRecord(r);
        document.getElementById('modalTitleNotify').textContent = `Nhật ký đồng bộ · ${r.id}`;
        document.getElementById('modalSubNotify').textContent = `${isDoc ? 'Văn bản' : 'Nhiệm vụ'} · Nguồn: ${src.name}`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="manual-note">Trạng thái và tiến độ của ${isDoc ? 'văn bản' : 'nhiệm vụ'} này được đồng bộ tự động từ <b>${src.name}</b> (hệ thống quản lý ${isDoc ? 'văn bản' : 'nhiệm vụ'} bên ngoài IOC). IOC chỉ hiển thị, không chỉnh sửa trực tiếp tại đây.</div><div class="detail-grid"><div class="detail-card"><h4>Trạng thái hiện tại</h4><div class="kv"><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span><b>Tiến độ</b><span>${r.progress}%</span><b>Hạn xử lý</b><span>${r.due}</span><b>Cập nhật gần nhất</b><span>${dtTime(src.offset)} · ${relTime(src.offset)}</span></div></div><div class="detail-card"><h4>Lịch sử đồng bộ</h4><div class="audit">${r.history.map(h => `<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join('')}</div></div></div><div class="action-bar"><button class="ghost" onclick="openRecordDetail('${id}')">Quay lại chi tiết</button></div>`;
        openModal();
    }

    /* ============================== GIAO NHIỆM VỤ / CHỌN VĂN BẢN ============================== */
    function generateTaskCode() { const y = new Date().getFullYear(); const rnd = Math.floor(10000 + Math.random() * 90000); return `${y}-${rnd}` }
    // Port từ ASS_UPLOAD_EXTS (tongquan.js:3433-3449) — danh sách định dạng BE cho phép, đo từ response
    // upload thật của app QLNV. Ngoài whitelist thì BE trả "File X không đúng định dạng" -> chặn sớm ở FE.
    var ASSIGNMENT_UPLOAD_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', 'png', 'jpg', 'jpeg', 'gif'];
    // Port từ assHandleFiles (tongquan.js:4410-4447): lọc theo whitelist định dạng, báo tên file bị chặn,
    // và reset input.value sau khi xử lý — thiếu bước reset thì chọn lại ĐÚNG file vừa xoá sẽ không kích
    // hoạt onchange lần 2 (value input không đổi), im lặng không thêm lại được.
    function syncFileInputNoti() {
        ['subFileInputNoti', 'assFileInputNoti'].forEach(function (id) {
            const el = notifyFormEl(id);
            if (!el) return;
            const files = window.__assignmentFilesNoti || [];
            if (!files.length) {
                el.value = '';
                return;
            }
            try {
                const dt = new DataTransfer();
                files.forEach(function (item) {
                    if (item.file instanceof File) {
                        dt.items.add(item.file);
                    } else {
                        dt.items.add(new File([], item.name || 'file'));
                    }
                });
                el.files = dt.files;
            } catch (e) {
                // Ignore if DataTransfer is not supported
            }
        });
    }
    function handleAssignmentFilesNoti(input) {
        const files = Array.from(input.files || []);
        window.__assignmentFilesNoti = window.__assignmentFilesNoti || [];
        const bad = files.filter(function (f) {
            const ext = String(f.name).split('.').pop().toLowerCase();
            return ASSIGNMENT_UPLOAD_EXTS.indexOf(ext) < 0;
        });
        if (bad.length) toast('Định dạng không được phép: ' + bad.map(function (f) { return f.name; }).join(', '));
        const ok = files.filter(function (f) { return bad.indexOf(f) < 0; });
        let remaining = ok.length;
        if (!remaining) {
            renderAssignmentFileListNoti();
            syncFileInputNoti();
            return;
        }
        ok.forEach(function (f) {
            const reader = new FileReader();
            reader.onload = function () {
                window.__assignmentFilesNoti.push({ name: f.name, dataUrl: reader.result, file: f });
                if (!--remaining) {
                    renderAssignmentFileListNoti();
                    syncFileInputNoti();
                }
            };
            reader.onerror = function () {
                if (!--remaining) {
                    renderAssignmentFileListNoti();
                    syncFileInputNoti();
                }
            };
            reader.readAsDataURL(f);
        });
    }
    // Port từ assRemoveFile (tongquan.js:4448-4451): trước đây không có cách nào bỏ 1 file đã chọn khỏi
    // danh sách ngoài việc huỷ cả form.
    function removeAssignmentFileNoti(idx) {
        (window.__assignmentFilesNoti || []).splice(idx, 1);
        renderAssignmentFileListNoti();
        syncFileInputNoti();
    }
    // notifyFormEl scope vào #modalBodyNotify: id "assFileList" trùng với form Giao nhiệm vụ bên tongquan.js
    // (xem notifyFormRoot) — không scope thì có thể ghi nhầm vào #modalBody đã đóng của tongquan.js.
    // Port hiển thị + nút "Bỏ" từng dòng từ assRenderFileList (tongquan.js:4452-4463).
    function renderAssignmentFileListNoti() {
        const box = notifyFormEl('assFileListNoti'); if (!box) return;
        const files = window.__assignmentFilesNoti || [];
        box.innerHTML = files.length
            ? files.map(function (f, i) {
                return `<div style="display:flex;gap:8px;align-items:center"><span>📎 ${assEsc(f.name)}</span><button type="button" class="ghost danger-btn" onclick="removeAssignmentFileNoti(${i})" style="padding:2px 8px">Bỏ</button></div>`;
            }).join('')
            : 'Chưa có file đính kèm.';
    }
    function filterUnitChecklist(searchId, boxId) { const q = (document.getElementById(searchId).value || '').trim().toLowerCase(); document.getElementById(boxId).querySelectorAll('label.unit-check-row').forEach(l => { const excluded = l.dataset.excluded === 'true'; l.style.display = (!excluded && l.dataset.name.includes(q)) ? 'flex' : 'none' }) }
    function toggleUnitDropdown(id) { const el = document.getElementById(id); if (!el) return; const willOpen = el.classList.contains('hidden'); document.querySelectorAll('.ms-dropdown').forEach(d => d.classList.add('hidden')); if (willOpen) { el.classList.remove('hidden'); if (id === 'assCoordDropdown') { bindCoordinatorBoxScroll('assCoordBox', refreshAssignmentCoordinatorOptions); ensureCoordinatorOptionsLoaded(refreshAssignmentCoordinatorOptions); } else if (id === 'subCoordDropdown') { bindCoordinatorBoxScroll('subCoordBox', refreshSubCoordinatorOptions); ensureCoordinatorOptionsLoaded(refreshSubCoordinatorOptions); } else if (id === 'nsCoordDropdown_noti') { bindCoordinatorBoxScroll('nsCoordBox_noti', renderNsCoordOptions); ensureCoordinatorOptionsLoaded(renderNsCoordOptions); } } }
    /* Dùng chung cho 'nsCoordDropdown_noti' (ô phối hợp của form "kịch bản mới") — id 'notifyCoordDropdown_noti'
       (ô phối hợp của Nhập Noti) đã tách riêng qua notifyToggleCoordDropdown (xem block IIFE "NOTIFY" phía dưới)
       để tránh đúng lỗi mà comment ở đầu file mô tả: onclick="tenHam()" dạng chuỗi tra cứu qua global nên dễ bị
       khối CMS khác nạp sau đè mất. */
    function toggleUnitDropdown_noti(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const isOpen = !el.classList.contains('hidden');
        document.querySelectorAll('.ms-dropdown').forEach(function (d) {
            if (d !== el) d.classList.add('hidden');
        });
        if (isOpen) { el.classList.add('hidden'); return; }
        el.classList.remove('hidden');
    }
    function updateUnitTriggerLabel(textId, boxId, placeholder) { const checked = Array.from(document.querySelectorAll('#' + boxId + ' input[type=checkbox]:checked')).map(c => c.getAttribute('data-label') || c.value); document.getElementById(textId).textContent = checked.length ? checked.join(', ') : placeholder; document.getElementById(textId).style.color = checked.length ? '#d0e8f8' : '#8ab0c8' }
    document.addEventListener('click', function (e) {
        // Dùng composedPath() (đường đi của event tại thời điểm dispatch) thay vì wrap.contains(e.target):
        // các cây đơn vị (assUnit, subNvUnit, notifyUnit...) render lại innerHTML ngay trong handler bấm ▸
        // mở nhánh -> nút vừa bấm bị detach khỏi DOM -> wrap.contains(e.target) trả về false dù đang bấm
        // BÊN TRONG dropdown -> dropdown tự đóng ngay khi mở xuống cấp nhỏ hơn. composedPath() chụp path
        // gốc trước khi DOM bị mutate nên không bị ảnh hưởng.
        var path = typeof e.composedPath === 'function' ? e.composedPath() : null;
        document.querySelectorAll('.ms-wrap').forEach(function (wrap) {
            var inside = path ? path.indexOf(wrap) !== -1 : wrap.contains(e.target);
            if (!inside) {
                wrap.querySelectorAll('.ms-dropdown').forEach(function (d) { d.classList.add('hidden'); });
            }
        });
    });
    /* Ủy quyền cập nhật label qua document (thay vì chỉ dựa vào onchange inline trên từng checkbox) —
       an toàn để tồn tại song song với onchange inline sẵn có, vì đây là thao tác idempotent (chạy lại
       vô hại nếu bản inline vẫn hoạt động). */
    document.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || t.tagName !== 'INPUT' || t.type !== 'checkbox') return;
        if (t.classList.contains('assCoord')) updateUnitTriggerLabel('assCoordTriggerText', 'assCoordBox', 'Chọn đơn vị phối hợp');
        else if (t.classList.contains('subCoord')) updateUnitTriggerLabel('subCoordTriggerText', 'subCoordBox', 'Chọn đơn vị phối hợp');
        else if (t.classList.contains('nsCoord') && typeof updatensCoordTrigger_notiLabel === 'function') updatensCoordTrigger_notiLabel();
    });
    // inputId/dropdownId ở đây LUÔN là assDocTypeInput/assDocTypeDropdown (2 hàm này không có nơi gọi nào
    // khác) — assDocTypeDropdown trùng id với dropdown "Loại văn bản" bên tongquan.js (assSelectHtml("assDocType",...)
    // sinh ra "assDocTypeDropdown") nên phải scope qua notifyFormEl, không dùng getElementById trần.
    function renderComboList(inputId, dropdownId, getBaseOptions, storeKey, query) {
        const q = (query || '').trim().toLowerCase();
        const custom = JSON.parse(localStorage.getItem(storeKey) || '[]');
        const all = [...getBaseOptions(), ...custom];
        const opts = q ? all.filter(f => f.toLowerCase().includes(q)) : all;
        const box = notifyFormEl(dropdownId);
        box.innerHTML = opts.length ? opts.map(f => `<div class="field-opt-row" style="padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px">${f}</div>`).join('') : '<div style="padding:8px 10px;color:#8ab0c8;font-size:12.5px">Không tìm thấy, bấm + để thêm mới</div>';
        Array.from(box.children).forEach((el, i) => { if (opts[i]) el.onclick = () => { notifyFormEl(inputId).value = opts[i]; box.classList.add('hidden') } });
        document.querySelectorAll('.ms-dropdown').forEach(d => { if (d.id !== dropdownId) d.classList.add('hidden') });
        box.classList.remove('hidden');
    }
    function addComboOption(inputId, dropdownId, getBaseOptions, storeKey) {
        const val = (notifyFormEl(inputId).value || '').trim();
        if (!val) { toast('Nhập giá trị trước khi thêm.'); return }
        const all = [...getBaseOptions(), ...JSON.parse(localStorage.getItem(storeKey) || '[]')];
        if (!all.some(f => f.toLowerCase() === val.toLowerCase())) {
            const custom = JSON.parse(localStorage.getItem(storeKey) || '[]'); custom.push(val); localStorage.setItem(storeKey, JSON.stringify(custom));
            toast(`Đã thêm: ${val}`);
        } else toast('Lĩnh vực/loại văn bản này đã có trong danh sách.');
        notifyFormEl(dropdownId).classList.add('hidden');
    }
    function assDocTypeOptions() { return docTypeOptions }
    function openAssDocTypeDropdown() { const input = notifyFormEl('assDocTypeInput'); renderComboList('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes', ''); input.select() }
    function filterAssDocType() { renderComboList('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes', notifyFormEl('assDocTypeInput').value) }
    function addAssDocType() { addComboOption('assDocTypeInput', 'assDocTypeDropdown', assDocTypeOptions, 'px-ioc-custom-doctypes') }
    function normalizeDocPickerItem(item, idx) {
        return {
            id: String(item._id || item.id || ('doc-api-' + idx)),
            metric: 'docOut',
            role: currentRole || QLNV_DEFAULT_ROLE,
            code: item.toBook || item.code || item.documentNumber || '',
            title: item.name || item.title || item.subject || item.toBook || ('Văn bản ' + (idx + 1)),
            summary: item.abstractNote || item.summary || '',
            created: formatQlnvDate(item.documentDate || item.createdAt),
            signer: item.signer && item.signer.name ? item.signer.name : (item.signer || ''),
            field: item.field && item.field.title ? item.field.title : (item.field || item.linhVuc || ''),
            issuer: item.organizationUnit && item.organizationUnit.name ? item.organizationUnit.name : (item.issuer || item.senderUnit || ''),
            raw: item
        };
    }
    function getDocPickerSourceItems() { return docPickerApiItems || [] }
    function findDocPickerItemById(id) { return getDocPickerSourceItems().find(function (d) { return d.id === id }) || records.find(function (x) { return x.id === id }) }
    function hideAssignmentModalWhilePicking() {
        var mainModal = document.getElementById('modal_notify');
        if (mainModal) {
            mainModal.dataset.docPickerHidden = 'true';
            mainModal.style.visibility = 'hidden';
            mainModal.style.pointerEvents = 'none';
        }
    }
    function showAssignmentModalAfterPicking() {
        var mainModal = document.getElementById('modal_notify');
        if (mainModal && mainModal.dataset.docPickerHidden === 'true') {
            mainModal.style.visibility = '';
            mainModal.style.pointerEvents = '';
            delete mainModal.dataset.docPickerHidden;
        }
    }
    function ensureDocPickerShell() {
        if (!document.getElementById('docPickerOverlay')) {
            document.body.insertAdjacentHTML('beforeend', `<div id="docPickerOverlay" class="overlay" onclick="closeDocPicker()" style="position:fixed;inset:0;z-index:1200"></div>
      <div id="docPickerModal" class="modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);margin:0;max-width:1320px;width:min(96vw,1320px);max-height:92vh;overflow:auto;z-index:1201">
        <div class="modal-head">
          <div>
            <div id="docPickerTitle" style="font-weight:800;font-size:24px;line-height:1.1">Chọn văn bản từ hệ thống quản lý văn bản</div>
            <div style="color:#8ab0c8;margin-top:4px">Có thể tick chọn nhiều văn bản cùng lúc</div>
          </div>
          <button class="ghost" type="button" onclick="closeDocPicker()" style="min-width:38px;padding:0 10px">×</button>
        </div>
        <div class="modal-body">
          <div class="filters" style="margin-bottom:12px">
            <input id="docPickerSearch" placeholder="Tìm theo mã, tên văn bản, trích yếu..." oninput="renderDocPickerList()" />
            <select id="docPickerType" onchange="renderDocPickerList()">
              <option value="docOut">Văn bản đi</option>
              <option value="docIn">Văn bản đến</option>
              <option value="">Tất cả loại</option>
            </select>
            <select id="docPickerRole" onchange="renderDocPickerList()"></select>
          </div>
          <div id="docPickerLockNote" class="manual-note hidden" style="margin-bottom:10px">Danh sách đang khóa theo loại văn bản của hồ sơ nguồn.</div>
          <div class="iip-table-wrap" style="max-height:58vh">
            <table class="compact-table">
              <thead>
                <tr>
                  <th></th>
                  <th>STT</th>
                  <th>Loại</th>
                  <th>Trục</th>
                  <th>Số VB</th>
                  <th>Tên văn bản</th>
                  <th>Trích yếu</th>
                  <th>Lãnh đạo ký</th>
                  <th>Lĩnh vực</th>
                  <th>Cơ quan ban hành</th>
                  <th>Ngày văn bản</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="docPickerTbody"><tr><td colspan="12">Đang tải văn bản...</td></tr></tbody>
            </table>
          </div>
          <div class="action-bar">
            <button class="primary" type="button" onclick="confirmDocPicker()">Xác nhận</button>
            <button class="ghost" type="button" onclick="closeDocPicker()">Đóng</button>
          </div>
        </div>
      </div>`);
        }
        if (!document.getElementById('docDetailOverlay')) {
            document.body.insertAdjacentHTML('beforeend', `<div id="docDetailOverlay" class="overlay" onclick="closeDocDetail()" style="position:fixed;inset:0;z-index:1210"></div>
      <div id="docDetailModal" class="modal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);margin:0;max-width:860px;width:min(92vw,860px);max-height:88vh;overflow:auto;z-index:1211">
        <div class="modal-head">
          <div>
            <div style="font-weight:800;font-size:22px;line-height:1.1">Chi tiết văn bản</div>
            <div id="docDetailSub" style="color:#8ab0c8;margin-top:4px"></div>
          </div>
          <button class="ghost" type="button" onclick="closeDocDetail()" style="min-width:38px;padding:0 10px">×</button>
        </div>
        <div class="modal-body" id="docDetailBody"></div>
      </div>`);
        }
    }
    async function loadDocPickerData() {
        var token = ''; try { token = await getQlnvToken(); } catch (e) { token = ''; }
        var _docHeaders = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
        if (token) _docHeaders.Authorization = 'Bearer ' + token;
        return fetch(DOC_PICKER_URL, {
            headers: _docHeaders
        }).then(function (r) {
            if (!r.ok) throw new Error('DOC PICKER HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            var data = extractCrmStatusList(res);
            if (!data.length && Array.isArray(res)) data = res;
            docPickerApiItems = data.map(function (item, idx) { return normalizeDocPickerItem(item, idx) });
            return docPickerApiItems;
        }).catch(function (err) {
            console.warn('[DOC PICKER] Load failed:', err);
            docPickerApiItems = [];
            return docPickerApiItems;
        });
    }
    /* Nguồn văn bản dùng chung cho ô chọn văn bản, đúng bằng dữ liệu đang hiển thị ở dashboard (lọc theo phân quyền tài khoản). */
    function allDocumentRecords() { return records.filter(r => (r.metric === 'docIn' || r.metric === 'docOut') && canSeeRole(r.role)); }
    function captureAssignmentFormState() {
        var unitState = getAssUnitState();
        var coordState = getAssCoordState();
        var pickedPerson = (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') ? __qlnvPickedPerson : null;
        return {
            source: window.__assignmentFormSource || null,
            title: document.getElementById('assTitle') ? document.getElementById('assTitle').value : '',
            code: document.getElementById('assCode') ? document.getElementById('assCode').value : '',
            role: document.getElementById('assRole') ? document.getElementById('assRole').value : '',
            unitId: unitState.selectedId,
            unitLabel: unitState.selectedLabel,
            receiverPersonId: pickedPerson ? pickedPerson.id : '',
            receiverPersonName: pickedPerson ? pickedPerson.name : '',
            field: document.getElementById('assField') ? document.getElementById('assField').value : '',
            importance: document.getElementById('assImportance') ? document.getElementById('assImportance').value : '',
            urgency: document.getElementById('assUrgency') ? document.getElementById('assUrgency').value : '',
            start: document.getElementById('assStart') ? document.getElementById('assStart').value : '',
            due: document.getElementById('assDue') ? document.getElementById('assDue').value : '',
            docType: document.getElementById('assDocTypeInput') ? document.getElementById('assDocTypeInput').value : '',
            desc: document.getElementById('assDesc') ? document.getElementById('assDesc').value : '',
            selectedDocs: (window.__selectedDocs || []).slice(),
            assignmentFiles: (window.__assignmentFilesNoti || []).slice(),
            coordIds: coordState.selectedIds.slice(),
            coordLabels: Object.assign({}, coordState.selectedLabels)
        };
    }
    function restoreAssignmentFormState(state) {
        if (!state) return;
        if (document.getElementById('assTitle')) document.getElementById('assTitle').value = state.title || '';
        if (document.getElementById('assCode')) document.getElementById('assCode').value = state.code || document.getElementById('assCode').value;
        if (document.getElementById('assRole') && state.role) document.getElementById('assRole').value = state.role;
        if (state.unitId) {
            var unitState = getAssUnitState();
            unitState.selectedId = state.unitId;
            unitState.selectedLabel = state.unitLabel || state.unitId;
            if (state.receiverPersonId) {
                __qlnvPickedPerson = { selectId: 'assUnit', id: state.receiverPersonId, name: state.receiverPersonName || '', unitId: state.unitId, unitLabel: state.unitLabel || '' };
            }
            assSyncUnitHiddenInput();
            assSyncUnitTriggerLabel();
            assRenderUnitTree();
        }
        if (document.getElementById('assField') && state.field) document.getElementById('assField').value = state.field;
        if (document.getElementById('assImportance') && state.importance) document.getElementById('assImportance').value = state.importance;
        if (document.getElementById('assUrgency') && state.urgency) document.getElementById('assUrgency').value = state.urgency;
        if (document.getElementById('assStart')) document.getElementById('assStart').value = state.start || '';
        if (document.getElementById('assDue')) document.getElementById('assDue').value = state.due || '';
        if (document.getElementById('assDocTypeInput')) document.getElementById('assDocTypeInput').value = state.docType || '';
        if (document.getElementById('assDesc')) document.getElementById('assDesc').value = state.desc || '';
        window.__selectedDocs = (state.selectedDocs || []).slice();
        window.__assignmentFilesNoti = (state.assignmentFiles || []).slice();
        var coordState = getAssCoordState();
        coordState.selectedIds = (state.coordIds || []).slice();
        coordState.selectedLabels = Object.assign({}, state.coordLabels || {});
        refreshAssignmentCoordinatorOptions();
        renderSelectedDocsList();
        renderAssignmentFileListNoti();
        syncFileInputNoti();
    }
    function renderDocPickerInMainModal() {
        document.getElementById('modalTitleNotify').textContent = 'Chọn văn bản từ hệ thống quản lý văn bản';
        document.getElementById('modalSubNotify').textContent = 'Có thể tick chọn nhiều văn bản cùng lúc';
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="closeDocPicker()">← Quay lại giao nhiệm vụ</button></div>
    <div class="detail-card">
      <div class="filters" style="margin-bottom:12px">
        <input id="docPickerSearch" placeholder="Tìm theo mã, tên văn bản, trích yếu..." oninput="renderDocPickerList()" />
        <select id="docPickerType" onchange="renderDocPickerList()">
          <option value="docOut">Văn bản đi</option>
          <option value="docIn">Văn bản đến</option>
          <option value="">Tất cả loại</option>
        </select>
        <select id="docPickerRole" onchange="renderDocPickerList()"></select>
      </div>
      <div id="docPickerLockNote" class="manual-note hidden" style="margin-bottom:10px">Danh sách đang khóa theo loại văn bản của hồ sơ nguồn.</div>
      <div class="iip-table-wrap" style="max-height:58vh">
        <table class="compact-table">
          <thead>
            <tr>
              <th></th>
              <th>STT</th>
              <th>Loại</th>
              <th>Trục</th>
              <th>Số VB</th>
              <th>Tên văn bản</th>
              <th>Trích yếu</th>
              <th>Lãnh đạo ký</th>
              <th>Lĩnh vực</th>
              <th>Cơ quan ban hành</th>
              <th>Ngày văn bản</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="docPickerTbody"><tr><td colspan="12">Đang tải văn bản...</td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="action-bar"><button class="primary" type="button" onclick="confirmDocPicker()">Xác nhận</button><button class="ghost" type="button" onclick="closeDocPicker()">Đóng</button></div>`;
    }
    function reopenAssignmentFromDocPicker() {
        var state = window.__assignmentDraftBeforeDocPicker || null;
        if (!state) return;
        openAssignmentForm(state.source, true, state);
    }
    function openDocPicker() {
        window.__assignmentDraftBeforeDocPicker = captureAssignmentFormState();
        docPickerSelection = new Set((window.__selectedDocs || []).map(d => d.id));
        renderDocPickerInMainModal();
        openModal();
        document.getElementById('docPickerSearch').value = '';
        const roleSel = document.getElementById('docPickerRole');
        roleSel.innerHTML = '<option value="">Tất cả trục</option>' + allowedRoles().map(r => `<option value="${r}">${axisMeta[r].name}</option>`).join('');
        const typeSel = document.getElementById('docPickerType');
        const lock = window.__assignmentDocTypeLock;
        typeSel.value = lock || 'docOut';
        typeSel.disabled = !!lock;
        const lockNote = document.getElementById('docPickerLockNote');
        if (lockNote) lockNote.classList.toggle('hidden', !lock);
        document.getElementById('docPickerTbody').innerHTML = '<tr><td colspan="12">Đang tải văn bản...</td></tr>';
        loadDocPickerData().then(function () { renderDocPickerList(); });
    }
    function closeDocPicker() {
        /* openDocPicker() là hàm DÙNG CHUNG cho cả 2 modal của qlnv_v2.js: "Tạo nhiệm vụ" (openAssignmentForm)
           và "Nhập notify" (openNotifyForm) — trước đây quay lại LUÔN gọi reopenAssignmentFromDocPicker()
           (mở lại openAssignmentForm), nên nếu bấm "+ Chọn văn bản..." từ modal Nhập notify thì "Xác nhận"
           sẽ nhảy nhầm sang modal "Tạo nhiệm vụ" và mất hết lựa chọn đơn vị/phối hợp đã nhập ở notify. Cờ
           window.__docPickerReturnToNotify (đặt bởi notifyOpenDocPicker) đánh dấu đúng nơi cần quay lại. */
        if (window.__docPickerReturnToNotify) {
            window.__docPickerReturnToNotify = false;
            var restore = window.__notifyDraftBeforeDocPicker;
            window.__notifyDraftBeforeDocPicker = null;
            if (typeof window.openNotifyForm === 'function') window.openNotifyForm({ keepSelection: true, restore: restore });
            return;
        }
        reopenAssignmentFromDocPicker();
    }
    function renderDocPickerList() {
        const q = (document.getElementById('docPickerSearch').value || '').trim().toLowerCase();
        const typeFilter = document.getElementById('docPickerType').value;
        const roleFilter = document.getElementById('docPickerRole').value;
        const list = getDocPickerSourceItems().filter(d => (!typeFilter || d.metric === typeFilter) && (!roleFilter || d.role === roleFilter) && (!q || [d.code, d.title, d.summary].join(' ').toLowerCase().includes(q)));
        document.getElementById('docPickerTbody').innerHTML = list.length ? list.map((d, i) => `<tr><td class="tc"><input type="checkbox" ${docPickerSelection.has(d.id) ? 'checked' : ''} onchange="toggleDocPick('${d.id}',this.checked)"/></td><td class="tc">${i + 1}</td><td class="tc"><span class="badge ${d.metric === 'docIn' ? 'ok' : 'gold'}" title="${d.metric === 'docIn' ? 'Văn bản đến' : 'Văn bản đi'}">${d.metric === 'docIn' ? '? Đến' : '? Đi'}</span></td><td class="tc" title="${axisMeta[d.role].name}">${axisMeta[d.role].icon}</td><td class="mono" title="${d.code}">${d.code}</td><td class="wrap-cell">${d.title}</td><td class="wrap-cell">${d.summary}</td><td title="${d.signer || ''}">${d.signer || ''}</td><td title="${d.field || ''}">${d.field || ''}</td><td title="${d.issuer || ''}">${d.issuer || ''}</td><td class="tc">${d.created}</td><td class="tc"><button type="button" onclick="openDocDetail('${d.id}')" title="Xem chi tiết" style="border:0;background:none;color:#49bcff;cursor:pointer;font-size:15px;line-height:1">?</button></td></tr>`).join('') : '<tr><td colspan="12">Không tìm thấy văn bản phù hợp.</td></tr>';
    }
    function toggleDocPick(id, checked) { if (checked) docPickerSelection.add(id); else docPickerSelection.delete(id) }
    function openDocDetail(id) {
        const d = findDocPickerItemById(id); if (!d) return;
        document.getElementById('docDetailSub').textContent = d.code;
        document.getElementById('docDetailBody').innerHTML = `<div class="kv">
      <b>Loại</b><span>${d.metric === 'docIn' ? 'Văn bản đến' : 'Văn bản đi'}</span>
      <b>Trục</b><span>${axisMeta[d.role].icon} ${axisMeta[d.role].name}</span>
      <b>Số/ký hiệu</b><span class="mono">${d.code}</span>
      <b>Tên văn bản</b><span>${d.title}</span>
      <b>Trích yếu</b><span>${d.summary || ''}</span>
      <b>Loại văn bản</b><span>${d.docType || ''}</span>
      <b>Lãnh đạo ký</b><span>${d.signer || ''}</span>
      <b>Lĩnh vực</b><span>${d.field || ''}</span>
      <b>Cơ quan ban hành</b><span>${d.issuer || ''}</span>
      <b>Ngày văn bản</b><span>${d.created}</span>
    </div>`;
        document.getElementById('docDetailOverlay').classList.add('show');
        document.getElementById('docDetailModal').classList.add('open');
    }
    function closeDocDetail() {
        document.getElementById('docDetailOverlay').classList.remove('show');
        document.getElementById('docDetailModal').classList.remove('open');
        var pickerModal = document.getElementById('docPickerModal');
        if (!pickerModal || !pickerModal.classList.contains('open')) showAssignmentModalAfterPicking();
    }
    function confirmDocPicker() {
        window.__selectedDocs = getDocPickerSourceItems().filter(d => docPickerSelection.has(d.id));
        if (window.__assignmentDraftBeforeDocPicker) {
            window.__assignmentDraftBeforeDocPicker.selectedDocs = (window.__selectedDocs || []).slice();
        }
        closeDocPicker();
        toast(`Đã chọn ${window.__selectedDocs.length} văn bản.`);
    }
    // notifyFormEl scope vào #modalBodyNotify: "assDocsList" trùng id với danh sách văn bản đính kèm bên
    // form Giao nhiệm vụ của tongquan.js (xem notifyFormRoot).
    function renderSelectedDocsList() {
        const box = notifyFormEl('assDocsList'); if (!box) return;
        const docs = window.__selectedDocs || [];
        if (!docs.length) { box.innerHTML = ''; return }
        box.innerHTML = `<table class="compact-table"><thead><tr><th>Loại</th><th>Mã văn bản</th><th>Tên văn bản</th><th>Trích yếu</th><th>Ngày văn bản</th><th></th></tr></thead><tbody>${docs.map(d => `<tr><td>${d.metric === 'docIn' ? '? Đến' : '? Đi'}</td><td class="mono">${d.code}</td><td>${d.title}</td><td>${d.summary || ''}</td><td>${d.created}</td><td><button type="button" onclick="removeSelectedDoc('${d.id}')" title="Bỏ chọn" style="border:0;background:none;color:#ff6b6b;cursor:pointer;font-weight:900;font-size:15px;line-height:1">×</button></td></tr>`).join('')}</tbody></table>`;
    }
    function removeSelectedDoc(id) { window.__selectedDocs = (window.__selectedDocs || []).filter(d => d.id !== id); renderSelectedDocsList() }

    /* ============================== "Giao nhiệm vụ" (openAssignmentForm) — "Đơn vị chủ trì"/"Đơn vị phối hợp"
       DẠNG CÂY, cùng cơ chế với modal Nhập notify (notifyUnitTree*) và Giao nhiệm vụ nhánh (subNvUnitTree*):
       cây cơ cấu tổ chức, mở tới cấp người: "đơn vị chủ trì" chọn đích danh 1 người (radio/nút), "đơn vị
       phối hợp" chọn nhiều — bấm 1 người ở đây = tick đơn vị của người đó (donViThucHien lưu theo ĐƠN VỊ).
       Thay cho cơ chế cũ (getAdministrativeUnitState — danh sách phẳng phân trang 20/lần). ============ */
    function getAssUnitState() {
        if (!window.__assUnitState) window.__assUnitState = { selectedId: '', selectedLabel: '', query: '' };
        return window.__assUnitState;
    }
    function getAssCoordState() {
        if (!window.__assCoordState) window.__assCoordState = { selectedIds: [], selectedLabels: {} };
        return window.__assCoordState;
    }
    function assSyncUnitHiddenInput() {
        var hiddenInput = document.getElementById('assUnit');
        if (hiddenInput) hiddenInput.value = getAssUnitState().selectedId || '';
    }
    var __assUnitTreeData = [];
    // "Đơn vị/người phối hợp" có DANH SÁCH GỐC RIÊNG (ngang cấp) — xem qlnvOrgPickerRoots/qlnvOrgCoordRoots.
    var __assCoordTreeData = [];
    // byId từ TOÀN BỘ nodes phẳng — tra 1 node bất kỳ theo id bất kể nó thuộc gốc nào (assFindUnitNode).
    var __assOrgById = {};
    var __assUnitTreeLoading = false;
    var __assUnitTreeOpen = {};
    function assUnitTreeChildren(node) { return node && Array.isArray(node.child) ? node.child : []; }
    // Port từ assTreeHtml (tongquan.js:3616): fallback tenVietTat -> id, KHÔNG dừng ở fullName — vài node
    // "khối" gom nhóm của cây organization-structure (vd "HĐND Xã, Phường") chỉ có tenVietTat, không có
    // name/fullName; thiếu fallback thì dòng đó hiện trống trơn (đặc biệt rõ ở __assCoordTreeData vì
    // qlnvOrgCoordRoots quét NGANG CẤP nên hay chạm đúng cấp "khối" này, khác __assUnitTreeData quét
    // xuống nhánh con cụ thể hơn).
    function assUnitTreeLabel(node) { return String((node && (node.name || node.fullName || node.tenVietTat)) || (node && node.id != null ? node.id : '')); }
    function assUnitTreeId(node) { return String((node && (node._id || node.id || node.code)) || assUnitTreeLabel(node)); }
    function assLoadUnitTree() {
        if (__assUnitTreeLoading) return Promise.resolve(__assUnitTreeData);
        __assUnitTreeLoading = true;
        return qlnvLoadOrgStructure().then(function (nodes) {
            qlnvOrgBuildTree(nodes); // gắn .child cho từng node (mutate tại chỗ) — không dùng roots trả về
            __assOrgById = qlnvOrgById(nodes);
            __assUnitTreeData = qlnvOrgPickerRoots(nodes);
            __assCoordTreeData = qlnvOrgCoordRoots(nodes);
        }).then(function () {
            __assUnitTreeLoading = false;
            return __assUnitTreeData;
        });
    }
    // Tra thẳng byId (toàn bộ cây) — dùng chung được cho cả "đơn vị chủ trì" lẫn "đơn vị phối hợp" dù
    // chúng có gốc khác nhau.
    function assFindUnitNode(id) {
        return __assOrgById[String(id)] || null;
    }
    /* Dòng NGƯỜI của 1 đơn vị (nhánh cuối) trong cây "đơn vị chủ trì" — bấm CHỌN ĐƯỢC đích danh 1 người. */
    function assUnitPeopleRowsHtml(unitId, unitLabel, depth) {
        var pe = __qlnvUnitPeople[unitId];
        var pad = depth * 16;
        var lead = '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>';
        if (pe === 'loading' || pe === undefined) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">Đang tải người…</span></div>';
        if (!Array.isArray(pe) || !pe.length) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">— Không có người trong đơn vị —</span></div>';
        return pe.map(function (p) {
            var picked = __qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit' && String(__qlnvPickedPerson.id) === String(p.id);
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>'
                + '<button type="button" data-ass-tree-pick-person="' + esc(String(p.id)) + '" data-ass-person-name="' + esc(p.name || '') + '" data-ass-person-unit="' + esc(String(unitId)) + '" data-ass-person-unitlabel="' + esc(unitLabel || '') + '" style="flex:1;min-width:0;text-align:left;border:0;background:' + (picked ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (picked ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;font-weight:' + (picked ? '700' : '400') + ';padding:7px 8px;border-radius:8px">👤 '
                + esc(p.name || '(không tên)') + (p.position ? ' <span style="opacity:.7;font-size:11.5px">· ' + esc(p.position) + '</span>' : '')
                + '</button></div>';
        }).join('');
    }
    function assUnitTreeRowsHtml(nodes, depth) {
        var state = getAssUnitState();
        var pickedHere = !!(__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit');
        return (nodes || []).map(function (n) {
            var id = assUnitTreeId(n);
            var kids = assUnitTreeChildren(n);
            var open = !!__assUnitTreeOpen[id];
            var active = String(state.selectedId) === id && !pickedHere;
            var label = assUnitTreeLabel(n);
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + (depth * 16) + 'px">'
                + '<button type="button" data-ass-tree-toggle="' + esc(id) + '" style="width:22px;height:30px;flex:0 0 auto;border:0;background:none;cursor:pointer;font-size:12px;line-height:1;padding:0;color:#49bcff;opacity:.85">' + (open ? '▾' : '▸') + '</button>'
                + '<button type="button" data-ass-tree-pick="' + esc(id) + '" data-ass-tree-label="' + esc(label) + '" style="flex:1;min-width:0;text-align:left;border:0;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;font-weight:' + (active ? '700' : '400') + ';padding:7px 8px;border-radius:8px">' + esc(label) + '</button>'
                + '</div>'
                + (open ? (kids.length ? assUnitTreeRowsHtml(kids, depth + 1) : assUnitPeopleRowsHtml(id, label, depth + 1)) : '');
        }).join('');
    }
    function assUnitTreeSearchHtml(q) {
        var out = [];
        (function walk(nodes, path) {
            (nodes || []).forEach(function (n) {
                var label = assUnitTreeLabel(n);
                if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: assUnitTreeId(n), label: label, path: path.join(' › ') });
                walk(assUnitTreeChildren(n), path.concat([label]));
            });
        })(__assUnitTreeData, []);
        if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
        var state = getAssUnitState();
        var extra = out.length > 200 ? out.length - 200 : 0;
        return out.slice(0, 200).map(function (u) {
            var active = String(state.selectedId) === u.id;
            return '<div style="padding:1px 0"><button type="button" data-ass-tree-pick="' + esc(u.id) + '" data-ass-tree-label="' + esc(u.label) + '" style="width:100%;text-align:left;border:0;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;padding:7px 8px;border-radius:8px">' + esc(u.label) + (u.path ? '<span style="display:block;font-size:11px;color:#8ab0c8;margin-top:2px">' + esc(u.path) + '</span>' : '') + '</button></div>';
        }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
    }
    function assRenderUnitTree() {
        var listEl = document.getElementById('assUnitList');
        var statusEl = document.getElementById('assUnitStatus');
        if (!listEl) return;
        if (!__assUnitTreeData.length) {
            listEl.innerHTML = __assUnitTreeLoading
                ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị...</div>'
                : '<div style="padding:14px 6px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị.</div>';
            if (statusEl) statusEl.textContent = '';
            return;
        }
        var q = normalizeCrmText(getAssUnitState().query);
        listEl.innerHTML = q ? assUnitTreeSearchHtml(q) : assUnitTreeRowsHtml(__assUnitTreeData, 0);
        if (statusEl) statusEl.textContent = '';
    }
    function assHandleUnitTreeClick(e) {
        var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-ass-tree-toggle]') : null;
        if (toggleBtn) {
            var tid = toggleBtn.getAttribute('data-ass-tree-toggle');
            if (tid) {
                __assUnitTreeOpen[tid] = !__assUnitTreeOpen[tid];
                var node = assFindUnitNode(tid);
                var isLeaf = node && !assUnitTreeChildren(node).length;
                if (isLeaf && __assUnitTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
                    var pp = qlnvLoadUnitPeople(tid);
                    if (pp) pp.then(function () { if (__assUnitTreeOpen[tid]) assRenderUnitTree(); });
                }
                assRenderUnitTree();
            }
            return;
        }
        var personBtn = e.target && e.target.closest ? e.target.closest('[data-ass-tree-pick-person]') : null;
        if (personBtn) {
            assPickPerson(
                personBtn.getAttribute('data-ass-tree-pick-person'),
                personBtn.getAttribute('data-ass-person-name'),
                personBtn.getAttribute('data-ass-person-unit'),
                personBtn.getAttribute('data-ass-person-unitlabel')
            );
            return;
        }
        var pickBtn = e.target && e.target.closest ? e.target.closest('[data-ass-tree-pick]') : null;
        if (pickBtn) assSelectUnit(pickBtn.getAttribute('data-ass-tree-pick'), pickBtn.getAttribute('data-ass-tree-label'));
    }
    function assToggleUnitDropdown() {
        var dropdown = document.getElementById('assUnitDropdown');
        if (!dropdown) return;
        var wasOpen = !dropdown.classList.contains('hidden');
        document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) d.classList.add('hidden'); });
        if (wasOpen) { dropdown.classList.add('hidden'); return; }
        dropdown.classList.remove('hidden');
        __assUnitTreeOpen = {};
        assRenderUnitTree();
        if (!__assUnitTreeData.length && !__assUnitTreeLoading) {
            assLoadUnitTree().then(function () {
                if (!dropdown.classList.contains('hidden')) assRenderUnitTree();
            });
        }
        var search = document.getElementById('assUnitSearch');
        if (search) { search.value = ''; setTimeout(function () { search.focus(); }, 0); }
    }
    function assFilterUnitOptions() {
        var input = document.getElementById('assUnitSearch');
        getAssUnitState().query = input ? input.value : '';
        assRenderUnitTree();
    }
    function assSyncUnitTriggerLabel() {
        var triggerText = document.getElementById('assUnitTriggerText');
        if (!triggerText) return;
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') {
            var pl = '👤 ' + __qlnvPickedPerson.name + (__qlnvPickedPerson.unitLabel ? ' · ' + __qlnvPickedPerson.unitLabel : '');
            triggerText.textContent = pl;
            triggerText.style.color = '#d0e8f8';
            return;
        }
        var state = getAssUnitState();
        triggerText.textContent = state.selectedLabel || 'Chọn đơn vị chủ trì';
        triggerText.style.color = state.selectedLabel ? '#d0e8f8' : '#8ab0c8';
    }
    function assSelectUnit(unitId, label) {
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') __qlnvPickedPerson = null;
        var state = getAssUnitState();
        state.selectedId = unitId || '';
        state.selectedLabel = label || '';
        assSyncUnitHiddenInput();
        assSyncUnitTriggerLabel();
        var dropdown = document.getElementById('assUnitDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        assRenderUnitTree();
        refreshAssignmentCoordinatorOptions();
    }
    function assPickPerson(personId, personName, unitId, unitLabel) {
        var state = getAssUnitState();
        state.selectedId = unitId || '';
        state.selectedLabel = unitLabel || '';
        assSyncUnitHiddenInput();
        __qlnvPickedPerson = { selectId: 'assUnit', id: personId, name: personName || '', unitId: unitId || '', unitLabel: unitLabel || '' };
        assSyncUnitTriggerLabel();
        var dropdown = document.getElementById('assUnitDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        assRenderUnitTree();
        refreshAssignmentCoordinatorOptions();
    }
    /* Cây phối hợp dùng RIÊNG __assCoordTreeData (ngang cấp) — xem qlnvOrgCoordRoots, khác gốc với
       __assUnitTreeData (cấp dưới, "đơn vị chủ trì"). */
    var __assCoordTreeOpen = {};
    function getAssCoordUiState() {
        if (!window.__assCoordUiState) window.__assCoordUiState = { query: '' };
        return window.__assCoordUiState;
    }
    // Port từ assLoadUnitPeople (tongquan.js:3716-3725, checkbox .assCoordPerson): trước đây chỉ hiện
    // TÊN (view-only) nên bấm không chọn được — đơn vị phối hợp luôn lưu theo ĐƠN VỊ (donViThucHien là
    // mảng id đơn vị), nên bấm 1 người = tick luôn đơn vị của người đó, nhãn hiện rõ tên người vừa chọn.
    function assCoordPeopleRowsHtml(unitId, depth) {
        var pe = __qlnvUnitPeople[unitId];
        var pad = depth * 16;
        var lead = '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>';
        if (pe === 'loading' || pe === undefined) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">Đang tải người…</span></div>';
        if (!Array.isArray(pe) || !pe.length) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">— Không có người trong đơn vị —</span></div>';
        var ownerId = getAssUnitState().selectedId;
        var disabled = !!ownerId && String(ownerId) === String(unitId);
        var checked = getAssCoordState().selectedIds.indexOf(unitId) !== -1;
        var unitNode = assFindUnitNode(unitId);
        var unitLabel = unitNode ? assUnitTreeLabel(unitNode) : unitId;
        return pe.map(function (p) {
            var personLabel = (p.name || '(không tên)') + ' · ' + unitLabel;
            return lead + '<label style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-size:13px;padding:7px 8px;border-radius:8px;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '.45' : '1') + '">'
                + '<input type="checkbox" data-ass-coord-tree-check="' + esc(unitId) + '" data-label="' + esc(personLabel) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />'
                + '👤 ' + esc(p.name || '(không tên)') + (p.position ? ' <span style="opacity:.7;font-size:11.5px">· ' + esc(p.position) + '</span>' : '')
                + '</label></div>';
        }).join('');
    }
    function assCoordTreeRowsHtml(nodes, depth) {
        var ownerId = getAssUnitState().selectedId;
        var coordState = getAssCoordState();
        return (nodes || []).map(function (n) {
            var id = assUnitTreeId(n);
            var kids = assUnitTreeChildren(n);
            var open = !!__assCoordTreeOpen[id];
            var label = assUnitTreeLabel(n);
            var checked = coordState.selectedIds.indexOf(id) !== -1;
            var disabled = !!ownerId && String(ownerId) === id;
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + (depth * 16) + 'px">'
                + '<button type="button" data-ass-coord-tree-toggle="' + esc(id) + '" style="width:22px;height:30px;flex:0 0 auto;border:0;background:none;cursor:pointer;font-size:12px;line-height:1;padding:0;color:#49bcff;opacity:.85">' + (open ? '▾' : '▸') + '</button>'
                + '<label style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-size:13px;padding:7px 8px;border-radius:8px;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '.45' : '1') + '">'
                + '<input type="checkbox" data-ass-coord-tree-check="' + esc(id) + '" data-label="' + esc(label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />'
                + esc(label) + '</label></div>'
                + (open ? (kids.length ? assCoordTreeRowsHtml(kids, depth + 1) : assCoordPeopleRowsHtml(id, depth + 1)) : '');
        }).join('');
    }
    function assCoordTreeSearchHtml(q) {
        var ownerId = getAssUnitState().selectedId;
        var coordState = getAssCoordState();
        var out = [];
        (function walk(nodes, path) {
            (nodes || []).forEach(function (n) {
                var label = assUnitTreeLabel(n);
                if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: assUnitTreeId(n), label: label, path: path.join(' › ') });
                walk(assUnitTreeChildren(n), path.concat([label]));
            });
        })(__assCoordTreeData, []);
        if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
        var extra = out.length > 200 ? out.length - 200 : 0;
        return out.slice(0, 200).map(function (u) {
            var checked = coordState.selectedIds.indexOf(u.id) !== -1;
            var disabled = !!ownerId && String(ownerId) === u.id;
            return '<div style="padding:1px 0"><label style="width:100%;display:flex;align-items:center;gap:6px;color:#d0e8f8;cursor:' + (disabled ? 'default' : 'pointer') + ';font-size:13px;padding:7px 8px;border-radius:8px;opacity:' + (disabled ? '.45' : '1') + '"><input type="checkbox" data-ass-coord-tree-check="' + esc(u.id) + '" data-label="' + esc(u.label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' /><span>' + esc(u.label) + (u.path ? '<span style="display:block;font-size:11px;color:#8ab0c8;margin-top:2px">' + esc(u.path) + '</span>' : '') + '</span></label></div>';
        }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
    }
    function assHandleCoordTreeClick(e) {
        var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-ass-coord-tree-toggle]') : null;
        if (!toggleBtn) return;
        var tid = toggleBtn.getAttribute('data-ass-coord-tree-toggle');
        if (!tid) return;
        __assCoordTreeOpen[tid] = !__assCoordTreeOpen[tid];
        var node = assFindUnitNode(tid);
        var isLeaf = node && !assUnitTreeChildren(node).length;
        if (isLeaf && __assCoordTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
            var pp = qlnvLoadUnitPeople(tid);
            if (pp) pp.then(function () { if (__assCoordTreeOpen[tid]) refreshAssignmentCoordinatorOptions(); });
        }
        refreshAssignmentCoordinatorOptions();
    }
    function assHandleCoordTreeChange(e) {
        var cb = e.target;
        if (!cb || !cb.hasAttribute || !cb.hasAttribute('data-ass-coord-tree-check')) return;
        var id = cb.getAttribute('data-ass-coord-tree-check');
        var state = getAssCoordState();
        var idx = state.selectedIds.indexOf(id);
        if (cb.checked) {
            if (idx === -1) { state.selectedIds.push(id); state.selectedLabels[id] = cb.getAttribute('data-label') || id; }
        } else if (idx !== -1) {
            state.selectedIds.splice(idx, 1);
        }
        assRenderCoordChips();
    }
    function assRenderCoordChips() {
        var textEl = document.getElementById('assCoordTriggerText');
        if (!textEl) return;
        var state = getAssCoordState();
        if (!state.selectedIds.length) {
            textEl.textContent = 'Chọn đơn vị phối hợp';
            textEl.style.color = '#8ab0c8';
            return;
        }
        textEl.style.color = '#d0e8f8';
        textEl.innerHTML = state.selectedIds.map(function (id) {
            var label = state.selectedLabels[id] || id;
            return '<span class="notify-coord-chip" style="display:inline-flex;align-items:center;gap:4px;background:rgba(44,125,210,.22);border:1px solid rgba(73,188,255,.35);border-radius:999px;padding:2px 6px 2px 8px;margin:2px 4px 2px 0;font-size:11.5px;color:#d0e8f8">'
                + esc(label)
                + '<span data-chip-remove="' + esc(id) + '" title="Bỏ chọn" style="cursor:pointer;color:#ff9a9a;font-weight:900;line-height:1">×</span></span>';
        }).join('');
    }
    function assHandleChipRemoveClick(e) {
        var removeEl = e.target.closest ? e.target.closest('[data-chip-remove]') : null;
        if (!removeEl) return;
        e.stopPropagation();
        var value = removeEl.getAttribute('data-chip-remove');
        var state = getAssCoordState();
        var idx = state.selectedIds.indexOf(value);
        if (idx !== -1) state.selectedIds.splice(idx, 1);
        delete state.selectedLabels[value];
        var box = document.getElementById('assCoordBox');
        if (box) {
            box.querySelectorAll('input[data-ass-coord-tree-check]').forEach(function (cb) {
                if (cb.getAttribute('data-ass-coord-tree-check') === value) cb.checked = false;
            });
        }
        assRenderCoordChips();
    }
    function assToggleCoordDropdown() {
        var dropdown = document.getElementById('assCoordDropdown');
        if (!dropdown) return;
        var wasOpen = !dropdown.classList.contains('hidden');
        document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) d.classList.add('hidden'); });
        if (wasOpen) { dropdown.classList.add('hidden'); return; }
        dropdown.classList.remove('hidden');
        __assCoordTreeOpen = {};
        getAssCoordUiState().query = '';
        refreshAssignmentCoordinatorOptions();
        if (!__assCoordTreeData.length && !__assUnitTreeLoading) {
            assLoadUnitTree().then(function () {
                if (!dropdown.classList.contains('hidden')) refreshAssignmentCoordinatorOptions();
            });
        }
        var search = document.getElementById('assCoordSearch');
        if (search) { search.value = ''; setTimeout(function () { search.focus(); }, 0); }
    }
    function assFilterCoordOptions() {
        var input = document.getElementById('assCoordSearch');
        getAssCoordUiState().query = input ? input.value : '';
        refreshAssignmentCoordinatorOptions();
    }
    /* "Nhóm lĩnh vực" lấy option từ CRM S3103, giống hệt modal "Nhập notify" (notifyRenderFieldOptions) —
       value của <option> là item.value/item.code (mã CRM dùng làm field "nhiemVu" của nhiệm vụ), KHÔNG
       phải nhãn hiển thị. createAssignment() đọc thẳng select.value này để gán vào body.nhiemVu. */
    function assRenderFieldOptions() {
        var selectEl = document.getElementById('assField');
        if (!selectEl) return;
        var items = getCrmConfigItems('S3103');
        var selected = selectEl.value;
        if (!items.length) {
            selectEl.innerHTML = '<option value="">Đang tải nhóm lĩnh vực...</option>';
            return;
        }
        selectEl.innerHTML = items.map(function (item) {
            var value = (item && (item.value || item.code)) || '';
            var label = (item && (item.name || item.title)) || value;
            return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>';
        }).join('');
    }

    function openAssignmentForm(source, skipReset, restoreState) {
        const returnDocId = window.__assignmentReturnDocId || null; window.__assignmentReturnDocId = null;
        window.__assignmentFormSource = source || null;
        if (!skipReset) {
            window.__assignmentFilesNoti = [];
            window.__selectedDocs = [];
            window.__assUnitState = { selectedId: '', selectedLabel: '', query: '' };
            window.__assCoordState = { selectedIds: [], selectedLabels: {} };
            if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') __qlnvPickedPerson = null;
        } else {
            window.__assignmentFilesNoti = (restoreState && restoreState.assignmentFiles ? restoreState.assignmentFiles.slice() : window.__assignmentFilesNoti || []);
            window.__selectedDocs = (restoreState && restoreState.selectedDocs ? restoreState.selectedDocs.slice() : window.__selectedDocs || []);
        }
        const isDocSource = source === 'docIn' || source === 'docOut' || source === 'doc';
        window.__assignmentDocTypeLock = (source === 'docIn' || source === 'docOut') ? source : null;
        const formTitle = isDocSource ? 'Thêm mới nhiệm vụ từ văn bản' : source === 'field' ? 'Thêm mới nhiệm vụ từ lĩnh vực' : 'Giao nhiệm vụ IOC/CAD';
        document.getElementById('modalTitleNotify').textContent = formTitle; document.getElementById('modalSubNotify').textContent = '';
        document.getElementById('modalBodyNotify').innerHTML = '';
        document.getElementById('modalBodyNotify').innerHTML = `${returnDocId ? `<div class="iip-modal-back"><button class="ghost" onclick="openRecordDetail('${returnDocId}')">← Quay lại văn bản</button></div>` : ''}<div class="detail-card">
      <div class="card-head"><h4>Thông tin chung nhiệm vụ</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
      <div class="form2 compact widget-body">
      <div class="field wide"><label>Tiêu đề nhiệm vụ</label><input id="assTitle" value="Rà soát, cập nhật số liệu chỉ tiêu phục vụ dashboard IOC Thành ủy Hà Nội" /></div>
      <div class="field"><label>Người giao</label><input id="assGiver" value="${currentAccount.title}" disabled /></div>
      <div class="field"><label>Mã nhiệm vụ</label><input id="assCode" value="${generateTaskCode()}" /></div>
      <input type="hidden" id="assRole" value="${currentRole}">
      <div class="field"><label>Đơn vị chủ trì</label><div class="ms-wrap" style="position:relative"><input type="hidden" id="assUnit" value="" /><div id="assUnitTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="assUnitTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị chủ trì</span><span style="position:absolute;top:4px;right:12px;color:#49bcff;pointer-events:none">⌄</span></div><div id="assUnitDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="assUnitSearch" placeholder="Tìm đơn vị..." autocomplete="off" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="assUnitList" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto"></div><div id="assUnitStatus" style="padding:4px 2px 0;color:#8ab0c8;font-size:12px"></div></div></div></div>
      <div class="field wide"><label>Đơn vị/người phối hợp</label>
        <div class="ms-wrap" style="position:relative">
          <div id="assCoordTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
            <span id="assCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
          </div>
          <div id="assCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
            <input type="text" id="assCoordSearch" placeholder="Tìm đơn vị..." style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
            <div id="assCoordBox" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto">${renderCoordinatorOptions() || '<div style="padding:8px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>'}</div>
          </div>
        </div>
      </div>
      <div class="field half"><label>Nhóm lĩnh vực</label><select id="assField"><option value="">Đang tải nhóm lĩnh vực...</option></select></div>
      <div class="field"><label>Mức độ quan trọng</label><select id="assImportance"><option>Cao</option><option selected>Bình thường</option></select></div>
      <div class="field"><label>Độ khẩn</label><select id="assUrgency">${renderUrgencyOptions()}</select></div>
      <div class="field half"><label>Ngày bắt đầu</label><input id="assStart" type="date" /></div>
      <div class="field half"><label>Hạn xử lý</label><input id="assDue" type="date" /></div>
      </div>
    </div>
    <div class="detail-card">
      <div class="card-head"><h4>Thông tin văn bản</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
      <div class="form2 compact widget-body">
      <div class="field"><label>Loại văn bản</label><div class="ms-wrap" style="display:flex;gap:6px;align-items:center"><div style="flex:1;position:relative"><input type="text" id="assDocTypeInput" placeholder="Tìm kiếm" autocomplete="off" oninput="filterAssDocType()" onfocus="openAssDocTypeDropdown()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;outline:0;color:#d0e8f8" /><span style="position:absolute;top:4px;right:12px;color:#49bcff;pointer-events:none">⌄</span><div id="assDocTypeDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"></div></div><button type="button" onclick="addAssDocType()" title="Thêm loại văn bản mới" style="flex:0 0 auto;width:36px;height:36px;border-radius:9px;border:0;background:#2c7dd2;color:#fff;font-size:18px;font-weight:900;cursor:pointer;line-height:1">+</button></div></div>
      <div class="field wide"><label>Chọn văn bản (liên kết hệ thống quản lý văn bản)</label><div id="assDocsList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px"></div><button type="button" onclick="openDocPicker()" style="border:1px dashed rgba(73,188,255,.45);background:rgba(44,125,210,.08);color:#49bcff;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:700">+ Chọn văn bản từ hệ thống quản lý văn bản</button></div>
    <div class="field wide"><label>Ý kiến xử lý</label><textarea id="assDesc" rows="2">Cập nhật dữ liệu đúng, đủ, sạch, sống; đính kèm file Excel/PDF hoặc minh chứng xử lý.</textarea></div>
    <div class="field wide"><label>Đính kèm file</label><input id="assFileInputNoti" type="file" multiple onchange="handleAssignmentFilesNoti(this)" /><div id="assFileListNoti" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
      </div>
    </div>
    <div class="action-bar"><button class="primary" onclick="createAssignment()">Phát hành nhiệm vụ</button><button class="ghost" onclick="saveAssignmentDraft()">Lưu nháp</button><button class="ghost" onclick="closeModalNoti()">Hủy</button></div>`;
        var assUnitTriggerEl = document.getElementById('assUnitTrigger');
        if (assUnitTriggerEl) assUnitTriggerEl.addEventListener('click', assToggleUnitDropdown);
        var assUnitListEl = document.getElementById('assUnitList');
        if (assUnitListEl) assUnitListEl.addEventListener('click', assHandleUnitTreeClick);
        var assUnitSearchEl = document.getElementById('assUnitSearch');
        if (assUnitSearchEl) assUnitSearchEl.addEventListener('input', assFilterUnitOptions);
        var assCoordTriggerEl = document.getElementById('assCoordTrigger');
        if (assCoordTriggerEl) assCoordTriggerEl.addEventListener('click', assToggleCoordDropdown);
        var assCoordSearchEl = document.getElementById('assCoordSearch');
        if (assCoordSearchEl) assCoordSearchEl.addEventListener('input', assFilterCoordOptions);
        var assCoordTriggerTextEl = document.getElementById('assCoordTriggerText');
        if (assCoordTriggerTextEl) assCoordTriggerTextEl.addEventListener('click', assHandleChipRemoveClick);
        var assCoordBoxEl = document.getElementById('assCoordBox');
        if (assCoordBoxEl) { assCoordBoxEl.addEventListener('click', assHandleCoordTreeClick); assCoordBoxEl.addEventListener('change', assHandleCoordTreeChange); }
        openModal();
        assRenderFieldOptions();
        Promise.all([loadCrmStatusMapping(), assLoadUnitTree()]).then(function () {
            syncAssignmentOptionsFromCrmStatus();
            if (!document.getElementById('modal_notify').classList.contains('open')) return;
            hydrateAssignmentFormFromCrmStatus();
            assRenderFieldOptions();
            if (restoreState) restoreAssignmentFormState(restoreState);
            assRenderUnitTree();
            refreshAssignmentCoordinatorOptions();
            var docTypeDropdown = document.getElementById('assDocTypeDropdown');
            if (docTypeDropdown && !docTypeDropdown.classList.contains('hidden')) {
                filterAssDocType();
            }
        });
    }
    function saveAssignmentDraft() {
        const assUnitEl = document.getElementById('assUnit');
        const draft = { code: document.getElementById('assCode').value, title: document.getElementById('assTitle').value, role: document.getElementById('assRole').value, unit: getAssignmentLeadUnitLabel() || (assUnitEl ? assUnitEl.value : ''), savedAt: new Date().toLocaleString('vi-VN') };
        const drafts = JSON.parse(localStorage.getItem('px-ioc-drafts') || '[]'); drafts.push(draft); localStorage.setItem('px-ioc-drafts', JSON.stringify(drafts));
        closeModalNoti(); toast('Đã lưu nháp nhiệm vụ.');
    }
    function ensureCreatedAssignmentRecord(baseRecord, newId) {
        var qlnvId = newId != null ? String(newId) : '';
        var recordId = qlnvId ? ('QLNV-' + qlnvId) : baseRecord.id;
        var existed = records.find(function (x) {
            return x.id === recordId || (qlnvId && String(x.__qlnvId || '') === qlnvId) || (x.code === baseRecord.code && x.title === baseRecord.title && x.metric === baseRecord.metric);
        });
        if (existed) return existed;
        var preview = Object.assign({}, baseRecord, {
            id: recordId,
            __qlnv: !!qlnvId,
            __qlnvId: qlnvId || undefined,
            __hasProgress: false,
            progress: Number(baseRecord.progress) || 0,
            status: baseRecord.status || 'doing'
        });
        records.push(preview);
        return preview;
    }
    function createAssignment() {
        if (window.__qlnvSubmitting) { if (typeof toast === 'function') toast('Đang gửi nhiệm vụ, vui lòng đợi…'); return; }
        const role = document.getElementById('assRole').value; const title = document.getElementById('assTitle').value.trim() || 'Nhiệm vụ mới'; const assUnitEl = document.getElementById('assUnit'); const unitId = assUnitEl.value; const unit = getAssignmentLeadUnitLabel() || unitId; const code = document.getElementById('assCode').value.trim() || generateTaskCode();
        const coordState = getAssCoordState();
        const duplicatedCoordinator = coordState.selectedIds.find(function (cid) {
            return isSameAdministrativeUnit(
                { id: cid, label: coordState.selectedLabels[cid] || cid },
                { id: unitId, label: unit }
            );
        });
        if (duplicatedCoordinator) { toast('Đơn vị phối hợp không được trùng với đơn vị chủ trì.'); return; }
        const coordinators = coordState.selectedIds.slice();
        const coordinatorLabels = coordState.selectedIds.map(function (cid) { return coordState.selectedLabels[cid] || cid; });
        const id = `PX-NEW-${Date.now().toString().slice(-6)}`;
        const attachments = window.__assignmentFilesNoti || []; const attachmentsKey = attachments.length ? `px-ioc-files-${id}` : null;
        if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
        // "Nhóm lĩnh vực" là <select id="assField"> nạp option từ CRM S3103 (xem assRenderFieldOptions) —
        // route v2 gửi thẳng NHÃN hiển thị (option.text) vào body.linhVuc, không dò lại theo code
        // (xem buildQlnvCreateBodyV2).
        const assFieldEl = document.getElementById('assField');
        const fieldLabel = (assFieldEl && assFieldEl.selectedIndex >= 0 && assFieldEl.options[assFieldEl.selectedIndex]) ? assFieldEl.options[assFieldEl.selectedIndex].text : '';
        const field = fieldLabel || 'Chưa phân loại';
        const docType = document.getElementById('assDocTypeInput').value.trim() || '';
        const linkedDocIds = (window.__selectedDocs || []).map(d => d.id);
        const vanBanDenDinhKem = mapSelectedDocsToVanBanDenDinhKem(window.__selectedDocs || []);
        const startVal = document.getElementById('assStart').value;
        const dueVal = document.getElementById('assDue').value;
        const assignmentSnapshot = {
            role: role,
            unitId: unitId,
            unitLabel: unit,
            coordinatorIds: coordinators.slice(),
            coordinatorLabels: coordinatorLabels.slice(),
            field: field,
            docType: docType,
            urgency: document.getElementById('assUrgency').value,
            soVanBan: code,
            description: document.getElementById('assDesc').value || '',
            startDate: startVal || '',
            dueDate: dueVal || '',
            selectedDocs: (window.__selectedDocs || []).slice()
        };
        const r = { id, code, role, metric: 'assigned', status: 'doing', title, field, docType, creator: currentAccount.title, receiver: axisMeta[role].name, unit, coordinators: coordinatorLabels, importance: document.getElementById('assImportance').value, urgency: document.getElementById('assUrgency').value, priority: document.getElementById('assImportance').value, startDate: startVal || '', due: dueVal || '30/06/2026', created: new Date().toLocaleDateString('vi-VN'), progress: 5, description: document.getElementById('assDesc').value, linkedDocIds, evidence: attachments.map(a => a.name), attachmentsKey, history: [{ time: new Date().toLocaleString('vi-VN'), text: `${currentAccount.title} phát hành nhiệm vụ` }], subtasks: [], __assignmentSnapshot: assignmentSnapshot };
        if (isQlnvConfigured()) {
            // KHÔNG đóng modal sớm — chỉ đóng khi POST thành công (để user sửa lại nếu lỗi).
            if (typeof toast === 'function') toast('Đang gửi nhiệm vụ lên QLNV...');
            // Route v2 (đồng bộ từ khối nhiệm vụ, xem buildQlnvCreateBodyV2/qlnvCreateTaskV2) — KHÁC route cũ
            // /qlnv/bmm/create: field tên khác (donViGiao/donViTao/nguoiThucHien...), linhVuc gửi NHÃN thay vì
            // code, và không còn mucDoQuanTrong/parentId/vanBanDiDinhKem (route mới không đọc các field này).
            const receiverLabel = (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') ? __qlnvPickedPerson.name : unit;
            var form = {
                title: title,
                loaiNV: 'NHIEM_VU',
                startDate: startVal, dueDate: dueVal,
                lanhDaoChiDaoId: (window.QLNV_CREATE_DEFAULTS && window.QLNV_CREATE_DEFAULTS.lanhDaoChiDaoId) || qlnvDefaultLeaderId(),
                donViChuTri: (unitId ? [unitId] : null),
                receiverPersonId: (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'assUnit') ? __qlnvPickedPerson.id : null,
                receiverLabel: receiverLabel,
                urgency: document.getElementById('assUrgency').value,
                description: document.getElementById('assDesc').value,
                docType: docType,
                fieldLabel: field,
                soVanBan: code,
                donViThucHien: coordinators,
                canBoThucHien: (getNotifyCoordState().staffIds || []).slice(),
                donViThucHienLabels: coordinatorLabels,
                vanBanDenDinhKem: vanBanDenDinhKem
            };
            var body = buildQlnvCreateBodyV2(form);
            if (!body) return;
            window.__qlnvSubmitting = true;
            qlnvCreateTaskV2(body).then(function (res) {
                // Lấy id NV vừa tạo nếu API trả về (mở chi tiết ngay, không refetch cả list).
                var newId = extractQlnvTaskId(res);
                var bmmId = extractQlnvV2BmmTaskId(res);
                if (typeof toast === 'function') toast('Đã tạo nhiệm vụ trên QLNV.');
                // Thêm thẳng nhiệm vụ vừa tạo vào records[] cục bộ (ensureCreatedAssignmentRecord) để hiện ngay
                // trong list "assigned" — KHÔNG gọi lại loadQlnvMetric('assigned',{force:true}) nữa, việc fetch cả
                // list chỉ nên xảy ra 1 lần lúc mở tab/modal lần đầu (đã có qua qlnvStateOf('assigned').loaded).
                var created = findCreatedQlnvRecord(r) || ensureCreatedAssignmentRecord(r, newId);
                if (created && !created.__assignmentSnapshot) created.__assignmentSnapshot = assignmentSnapshot;
                rebuildSegmentFromTaskRecords();
                if (typeof renderMetricTabs === 'function') renderMetricTabs();
                if (typeof renderAxisDashboard === 'function') renderAxisDashboard();
                closeModalNoti();
                openRecordDetail(created.id);
                if (!attachments.length) return null;
                if (typeof toast === 'function') toast('Đang tải ' + attachments.length + ' file đính kèm…');
                return qlnvUploadTaskFilesV2(bmmId, attachments).then(function () {
                    if (typeof toast === 'function') toast('Đã đính ' + attachments.length + ' file vào nhiệm vụ.');
                }, function (err) {
                    // Nhiệm vụ đã tạo -> không rollback, chỉ báo rõ file chưa đính.
                    if (typeof toast === 'function') toast('Nhiệm vụ đã tạo nhưng file CHƯA đính: ' + (err && err.message));
                });
            }).catch(function (err) {
                // Lỗi API: KHÔNG thêm NV giả, KHÔNG đóng modal (giữ để user sửa & gửi lại).
                if (typeof toast === 'function') toast('Tạo nhiệm vụ QLNV lỗi: ' + (err && (err.message || err)) + ' — CHƯA lưu, vui lòng thử lại.');
            }).finally(function () { window.__qlnvSubmitting = false; window.__assignmentFilesNoti = []; });
            return;
        }
        records.push(r); segmentTemplate[role].assigned.doing += 1; closeModalNoti(); renderAll(); openRecordDetail(id); toast('Đã phát hành nhiệm vụ và lưu file đính kèm (nếu có) vào trình duyệt.');
    }

    /* Cả tongquan.js lẫn qlnv_v2.js cùng nạp trên 1 dashboard và cố ý dùng TRÙNG id cho các field dùng
       chung (assTitle/assCode/assGiver/assImportance/assUrgency/assStart/assDue/assDesc/assFileInputNoti/
       assFileList/assDocsList/assDocTypeDropdown — xem qlnvxOpenAssignmentForm bên tongquan.js). Đóng modal
       chỉ ẩn qua class (closeModal/closeModalNoti), KHÔNG xóa innerHTML, nên nếu modal "Giao nhiệm vụ" bên
       tongquan.js đã từng mở 1 lần trong phiên thì #modalBody của nó vẫn còn y nguyên các id này trong DOM
       — document.getElementById(id) không scope sẽ trả về phần tử của BẤT KỲ modal nào xuất hiện trước
       trong DOM (tuỳ thứ tự block được nạp trên trang CMS), đọc/ghi nhầm sang form đã đóng. Port cách phòng
       thủ assFormEl/assFormRoot của tongquan.js (tongquan.js:4785-4794): mọi field của modal Nhập notify
       PHẢI tra trong #modalBodyNotify trước, chỉ fallback getElementById toàn trang khi không có root. */
    function notifyFormRoot() {
        return document.getElementById('modalBodyNotify') || document;
    }
    function notifyFormEl(id) {
        var root = notifyFormRoot();
        return (root.querySelector && root.querySelector('#' + id)) || document.getElementById(id);
    }
    /* Port từ assCreateScenarioSubtasks/assScenarioSubTaskBody (tongquan.js): sau khi nhiệm vụ chính của
       notify tạo xong, tự động POST tạo từng nhiệm vụ nhánh khai báo trong kịch bản đã chọn. Dùng
       buildQlnvCreateBodyV2/qlnvCreateTaskV2 sẵn có của qlnv_v2.js (cùng cách createNotifySubTaskAssignment
       tạo 1 nhánh thủ công) thay vì gọi hàm global của tongquan.js — 2 block có thể không cùng nạp 1 trang. */
    function notifyCreateScenarioSubtasks(opts) {
        opts = opts || {};
        var key = opts.scenarioKey || '';
        var s = key ? scenarioTemplates()[key] : null;
        var tasks = (s && Array.isArray(s.tasks) && s.tasks) || [];
        if (!tasks.length) return Promise.resolve(0);
        if (!opts.parentId) {
            toast('Đã tạo notify nhưng CHƯA tạo được nhánh theo kịch bản "' + ((s && s.title) || key) + '" (thiếu mã nhiệm vụ cha) — vào chi tiết nhiệm vụ để giao nhánh.');
            return Promise.resolve(0);
        }
        toast('Đang tạo ' + tasks.length + ' nhiệm vụ nhánh theo kịch bản…');
        return Promise.all(tasks.map(function (t) {
            var subForm = {
                title: t[0],
                loaiNV: 'NHIEM_VU_CON',
                parentId: opts.parentId,
                startDate: opts.startDate,
                dueDate: opts.dueDate,
                lanhDaoChiDaoId: opts.leaderId,
                donViChuTri: (opts.ownerId ? [opts.ownerId] : null),
                urgency: opts.urgency,
                description: t[1] || t[0],
                soVanBan: generateTaskCode()
            };
            var subBody = buildQlnvCreateBodyV2(subForm);
            // Thiếu danh tính -> coi như nhánh lỗi, đã báo trong qlnvBlockCreate.
            if (!subBody) return Promise.resolve(false);
            return qlnvCreateTaskV2(subBody).then(function () {
                return true;
            }, function (err) {
                console.warn('[QLNV notify] Nhánh kịch bản lỗi:', t[0], err);
                return false;
            });
        })).then(function (results) {
            var ok = results.filter(Boolean).length;
            if (ok === tasks.length) toast('Đã tạo ' + ok + ' nhiệm vụ nhánh theo kịch bản.');
            else toast('Tạo nhánh theo kịch bản: ' + ok + '/' + tasks.length + ' thành công (một số nhánh lỗi).');
            return ok;
        });
    }
    function createNotifyAssignment() {
        if (window.__qlnvSubmitting) { if (typeof toast === 'function') toast('Đang gửi nhiệm vụ, vui lòng đợi…'); return; }
        const title = notifyFormEl('assTitle').value.trim() || 'Nhiệm vụ mới';
        const notifyUnitEl = document.getElementById('notifyUnit'); const unitId = notifyUnitEl.value; const unit = notifyGetUnitLabel() || unitId;
        // Port từ qlnvxCreateAssignmentImpl (tongquan.js): thiếu đơn vị nhận trước đây vẫn cho gửi
        // donViChuTri:null lên BE — chặn sớm giống modal Giao nhiệm vụ gốc.
        if (!unitId) { toast('Chưa chọn đơn vị nhận nhiệm vụ.'); return; }
        const codeEl = notifyFormEl('assCode'); // fallback tự sinh mã giống khối Tạo nhiệm vụ (generateTaskCode) khi bỏ trống
        // Đọc từ mảng state (window.__notifyCoordState) thay vì query lại checkbox :checked trên DOM — box
        // checkbox bị render lại nhiều lần trong lúc thao tác nên DOM không đáng tin, state mới là nguồn sự thật.
        const coordState = window.__notifyCoordState || { selectedIds: [], selectedLabels: {} };
        const coordinators = coordState.selectedIds.slice();
        const duplicatedCoordinator = coordinators.find(function (cid) {
            return isSameAdministrativeUnit(
                { id: cid, label: coordState.selectedLabels[cid] || cid },
                { id: unitId, label: unit }
            );
        });
        if (duplicatedCoordinator) { toast('Đơn vị phối hợp không được trùng với đơn vị nhận nhiệm vụ.'); return; }
        // "Nhóm lĩnh vực" là <select id="notiType"> nạp option từ CRM S3103 (xem notifyRenderFieldOptions) —
        // value của option là code CRM (vd "20"/"21"), text hiển thị là nhãn gửi vào body.linhVuc (route v2
        // gửi thẳng nhãn, không dò lại theo code — xem buildQlnvCreateBodyV2).
        const notiTypeEl = document.getElementById('notiType');
        const fieldLabel = (notiTypeEl && notiTypeEl.selectedIndex >= 0 && notiTypeEl.options[notiTypeEl.selectedIndex]) ? notiTypeEl.options[notiTypeEl.selectedIndex].text : '';
        const docType = notifyFormEl('assDocTypeInput').value.trim() || '';
        const vanBanDenDinhKem = mapSelectedDocsToVanBanDenDinhKem(window.__selectedDocs || []);
        const startVal = notifyFormEl('assStart').value;
        const dueVal = notifyFormEl('assDue').value;
        if (!dueVal) { toast('Chưa chọn hạn xử lý.'); return; }
        // Port từ qlnvxCreateAssignmentImpl (tongquan.js): kịch bản đã chọn (nếu có) gộp thẳng vào nội dung
        // chỉ đạo, giống hệt cách modal Giao nhiệm vụ gốc trình bày cho người nhận.
        const scenarioKey = window.__notifyScenario || '';
        const scenario = scenarioKey ? scenarioTemplates()[scenarioKey] : null;
        const descRaw = notifyFormEl('assDesc').value;
        const yKien = scenario ? (descRaw + '\n\nKịch bản áp dụng: ' + scenario.title + '. Mốc SLA: ' + (scenario.sla || []).join('; ') + '.') : descRaw;
        const attachments = window.__assignmentFilesNoti || [];
        const receiverLabel = (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit') ? __qlnvPickedPerson.name : unit;
        const coordinatorLabels = coordinators.map(function (cid) { return coordState.selectedLabels[cid] || cid; });
        // Port từ qlnvxCreateAssignmentImpl (tongquan.js:5460-5464): ô "Người giao (danh nghĩa)" chọn giao
        // dưới danh nghĩa đơn vị hay cá nhân mình — trước đây ô này bị disable/cứng "Tài khoản Thành ủy" nên
        // KHÔNG có gì để đọc, nguoiGiaoLaCaNhan chưa từng được gửi.
        const assGiverEl = notifyFormEl('assGiver');
        const giverMode = (assGiverEl && assGiverEl.value === 'person') ? 'person' : 'unit';
        const giverName = qlnvCurrentUserName();
        const nguoiGiaoLabel = giverMode === 'person' ? (giverName || null) : (qlnvCurrentUnitLabel() || giverName || null);
        // Route v2 (đồng bộ từ khối nhiệm vụ) — cùng payload builder với createAssignment(), chỉ khác nguồn
        // đơn vị nhận/phối hợp lấy từ picker riêng của modal Nhập notify (notifyUnit/__notifyCoordState).
        var form = {
            title: title,
            loaiNV: 'NHIEM_VU',
            startDate: startVal, dueDate: dueVal,
            lanhDaoChiDaoId: (window.QLNV_CREATE_DEFAULTS && window.QLNV_CREATE_DEFAULTS.lanhDaoChiDaoId) || qlnvDefaultLeaderId(),
            // Modal notify: "Đơn vị nhận nhiệm vụ" (chọn đơn) -> donViChuTri; "Đơn vị/người phối hợp" (checkbox) -> donViThucHien.
            donViThucHien: coordinators,
            donViThucHienLabels: coordinatorLabels,
            donViChuTri: (unitId ? [unitId] : null),
            receiverPersonId: (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit') ? __qlnvPickedPerson.id : null,
            receiverLabel: receiverLabel,
            urgency: notifyFormEl('assUrgency').value,
            description: yKien,
            yKien: yKien,
            nguoiGiaoNhiemVu: nguoiGiaoLabel,
            nguoiGiaoLaCaNhan: giverMode === 'person',
            docType: docType,
            fieldLabel: fieldLabel,
            soVanBan: (codeEl && codeEl.value.trim()) || generateTaskCode(),
            vanBanDenDinhKem: vanBanDenDinhKem
        };
        var body = buildQlnvCreateBodyV2(form);
        if (!body) return;
        window.__qlnvSubmitting = true;
        if (typeof toast === 'function') toast('Đang gửi notify lên QLNV...');
        qlnvCreateTaskV2(body).then(function (res) {
            var bmmId = extractQlnvV2BmmTaskId(res);
            if (typeof toast === 'function') toast('Đã tạo notify & giao nhiệm vụ.');
            closeModalNoti();
            if (typeof refreshNotifyTabs === 'function') refreshNotifyTabs();
            var followUps = [];
            if (scenarioKey) {
                followUps.push(notifyCreateScenarioSubtasks({
                    parentId: bmmId, scenarioKey: scenarioKey, leaderId: form.lanhDaoChiDaoId,
                    startDate: startVal, dueDate: dueVal, urgency: form.urgency, ownerId: unitId
                }));
            }
            if (attachments.length) {
                if (typeof toast === 'function') toast('Đang tải ' + attachments.length + ' file đính kèm…');
                followUps.push(qlnvUploadTaskFilesV2(bmmId, attachments).then(function () {
                    if (typeof toast === 'function') toast('Đã đính ' + attachments.length + ' file vào nhiệm vụ.');
                }, function (err) {
                    if (typeof toast === 'function') toast('Nhiệm vụ đã tạo nhưng file CHƯA đính: ' + (err && err.message));
                }));
            }
            window.__notifyScenario = '';
            return Promise.all(followUps);
        }).catch(function (err) {
            if (typeof toast === 'function') toast('Tạo notify lỗi: ' + (err && (err.message || err)) + ' — CHƯA lưu, vui lòng thử lại.');
        }).finally(function () { window.__qlnvSubmitting = false; window.__assignmentFilesNoti = []; });
    }

    /* ============================== NGUỒN DỮ LIỆU & CẬP NHẬT ============================== */
    const sourceDefs = [
        { key: 'api', icon: '?', name: 'API realtime', desc: 'Một cửa, văn bản, DVC quốc gia, đồng bộ nhiệm vụ', count: '98%', mode: 'API Gateway / Webhook', freq: 'Realtime / mỗi 1 phút', owner: 'Văn phòng UBND phường', offset: 3 * 60 * 1000 + 28 * 1000, quality: '99,1%', rows: 642, status: 'ok' },
        { key: 'excel', icon: '?', name: 'Excel import', desc: 'Báo cáo chuyên môn, đoàn thể, mẫu khảo sát xã/phường', count: '42 file', mode: 'Import Excel có kiểm tra schema', freq: 'Khi phát sinh / cuối ngày', owner: 'Cán bộ tổng hợp IOC', offset: 2 * 60 * 60 * 1000 + 16 * 60 * 1000, quality: '96,4%', rows: 187, status: 'late' },
        { key: 'db', icon: '?️', name: 'CSDL chuyên ngành', desc: 'Tài chính, giáo dục, nội vụ, đô thị, GPMB, văn hóa', count: '12 nguồn', mode: 'Adapter / ETL delta', freq: '15 phút / theo lịch', owner: 'Đơn vị chuyên môn', offset: 18 * 60 * 1000 + 15 * 1000, quality: '98,7%', rows: 1248, status: 'ok' },
        { key: 'docs', icon: '?', name: 'Văn bản/PDF', desc: 'Nghị quyết, kết luận, minh chứng, phụ lục, hồ sơ số hóa', count: '165', mode: 'DMS / OCR chỉ mục', freq: 'Ngày / khi phát hành', owner: 'Văn phòng Đảng ủy-HĐND-UBND', offset: 26 * 60 * 60 * 1000 + 8 * 60 * 1000, quality: '94,8%', rows: 305, status: 'stale' },
        { key: 'alert', icon: '?', name: 'Cảnh báo IOC', desc: 'Điểm nghẽn, cháy nổ, quá hạn, sắp hạn, lịch họp cần nhắc', count: '27', mode: 'Rule engine', freq: 'Realtime / sự kiện', owner: 'Trực IOC/CAD', offset: 46 * 1000, quality: '99,6%', rows: 189, status: 'ok' },
        { key: 'calendar', icon: '?', name: 'Lịch công tác/kỳ họp', desc: 'Lịch Đảng ủy, HĐND, UBND, MTTQ; nhắc họp vai trò thư ký', count: '41 lịch', mode: 'Calendar API / nhập nhanh', freq: 'Ngay khi phát sinh', owner: 'Văn phòng phường', offset: 12 * 60 * 1000 + 5 * 1000, quality: '97,9%', rows: 59, status: 'ok' }
    ];
    const bootTime = Date.now();
    function sourceAt(s) { return bootTime - s.offset }
    function getSource(keyOrName) { return sourceDefs.find(s => s.key === keyOrName || s.name === keyOrName) || sourceDefs[0] }
    function freshnessClass(s) { return s.status === 'stale' ? 'stale' : s.status === 'late' ? 'late' : '' }
    function renderSources() {
        const box = document.getElementById('sourceList'); if (!box) return;
        box.innerHTML = sourceDefs.map(s => { const t = sourceAt(s); const cls = freshnessClass(s); return `<button class="source-item" onclick="openSourceDetail('${s.key}')"><div class="dot">${s.icon}</div><div><b>${s.name}</b><small>${s.desc}</small><small class="source-update-line ${cls}">? <span class="time">${dtTime(s.offset)}</span><span>·</span><span class="rel">${relTime(s.offset)}</span></small><div class="source-quality"><span>${s.mode}</span><span>${s.freq}</span><span>Độ tin cậy ${s.quality}</span></div></div><div class="source-badge-stack"><span class="badge ${s.status === 'ok' ? 'ok' : s.status === 'late' ? 'warn' : 'red'}">${s.count}</span><span class="badge">${fmt(s.rows)} dòng</span></div></button>` }).join('');
    }
    function openSourceDetail(keyOrName) {
        const s = getSource(keyOrName); const t = sourceAt(s); const cls = freshnessClass(s);
        const jobs = [0, 1, 2, 3, 4].map(i => ({ time: t - i * (s.key === 'api' ? 4 * 60 * 1000 : s.key === 'alert' ? 9 * 60 * 1000 : 47 * 60 * 1000), type: i === 0 ? 'Đồng bộ gần nhất' : i === 1 ? 'Đối soát dữ liệu' : 'Đồng bộ định kỳ', rows: Math.max(1, Math.round(s.rows / (i + 3))), result: i === 3 && s.status === 'late' ? 'Có cảnh báo chậm' : 'Thành công' }));
        document.getElementById('modalTitleNotify').textContent = 'Nguồn dữ liệu & cập nhật · ' + s.name;
        document.getElementById('modalSubNotify').textContent = `Lần cập nhật gần nhất: ${dtTime(s.offset)} · ${relTime(s.offset)} so với hiện tại`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="freshness-grid"><div class="freshness-kpi"><span>Thời điểm cập nhật</span><b>${dtTime(s.offset)}</b><small>${relTime(s.offset)}</small></div><div class="freshness-kpi"><span>Tần suất/SLA</span><b>${s.freq}</b><small>${s.mode}</small></div><div class="freshness-kpi"><span>Bản ghi/kết nối</span><b>${fmt(s.rows)}</b><small>${s.count} · chủ quản: ${s.owner}</small></div><div class="freshness-kpi"><span>Chất lượng dữ liệu</span><b class="${s.status === 'ok' ? 'ok' : s.status === 'late' ? 'warn' : 'danger'}">${s.quality}</b><small>${s.status === 'ok' ? 'Đúng hạn' : 'Cần rà soát cập nhật'}</small></div></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nguồn</h4><div class="kv"><b>Tên nguồn</b><span>${s.name}</span><b>Mô tả</b><span>${s.desc}</span><b>Cơ chế</b><span>${s.mode}</span><b>Tần suất</b><span>${s.freq}</span><b>Đơn vị phụ trách</b><span>${s.owner}</span><b>Kiểm tra dữ liệu</b><span>Đúng · đủ · sạch · sống · audit log</span></div></div><div class="detail-card"><h4>Data health</h4><div class="data-health"><div><b>Đúng</b><span>Kiểm tra định dạng/mã đơn vị</span></div><div><b>Đủ</b><span>${fmt(s.rows)} dòng có khóa định danh</span></div><div><b>Sạch</b><span>Tỷ lệ trùng lặp thấp, ${s.quality}</span></div><div><b>Sống</b><span>${dtTime(s.offset)} · ${relTime(s.offset)}</span></div></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="toast('Đã chạy đồng bộ thử nguồn ${s.name}')">Đồng bộ thử</button><button class="ghost" onclick="toast('Đã mở màn import Excel cho ${s.name}')">Import Excel</button><button class="ghost" onclick="toast('Đã tạo cảnh báo lỗi dữ liệu nguồn ${s.name}')">Cảnh báo lỗi</button><button class="ghost" onclick="toast('Đã gửi yêu cầu xác nhận số liệu tới ${s.owner}')">Yêu cầu xác nhận</button></div></div></div><div class="detail-card"><h4>Nhật ký đồng bộ gần nhất</h4><div class="sync-timeline">${jobs.map(j => `<div class="sync-job"><b>${dtTime(bootTime - j.time + (bootTime - t))}</b><span><b>${j.type}</b><br/><small>${fmt(j.rows)} bản ghi · kiểm tra schema, mã đơn vị, trạng thái xử lý</small></span><span class="badge ${j.result === 'Thành công' ? 'ok' : 'warn'}">${j.result}</span></div>`).join('')}</div></div>`;
        openModal();
    }

    /* ============================== NOTIFY IOC/CAD ============================== */
    /* Nguồn dữ liệu thật (docs/api_van_ban.md, docs/api_nv.md), thay cho danh sách demo tĩnh cũ:
       - GET /api/qlnv/v2/notify-statistic-v2     (host QLNV_API_BASE/be_qlnv)  -> thống kê trạng thái của tab
       - GET /api/qlnv/v2/notify-task-list-v2     (host QLNV_API_BASE/be_qlnv)  -> danh sách nhiệm vụ của tab
       - GET /api/danh-sach-nhiem-vu/con-moi-full (host QLNV_API_BASE)          -> nhiệm vụ con của 1 nhiệm vụ
       Các API trên dùng chung 1 Bearer token (getQlnvToken()) qua QlnvApiNotify.qlnvFetch(). */
    function qlnvQueryString(params) {
        const qs = Object.keys(params || {})
            .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        return qs.length ? '?' + qs.join('&') : '';
    }
    /* Tab đang active của panel Notify — lưu localStorage để mở lại trang vẫn ở đúng tab, và để
       fetchNotifyStatistic biết notiType cần thống kê. Giá trị lạ/không đọc được -> tab đầu tiên. */
    var NOTI_PANEL_TAB_STORAGE_KEY = 'ioc-noti-active-tab';
    function notiPanelReadTab() {
        var key = '';
        try { key = localStorage.getItem(NOTI_PANEL_TAB_STORAGE_KEY) || ''; } catch (e) { }
        return NOTI_PANEL_TABS.some(function (t) { return t.key === key; }) ? key : NOTI_PANEL_TABS[0].key;
    }
    function notiPanelSaveTab(key) {
        try { localStorage.setItem(NOTI_PANEL_TAB_STORAGE_KEY, key); } catch (e) { }
    }
    /* GET /qlnv/v2/notify-statistic-v2?notiType=<tab> -> { notiType, title, total, trangThai:[{trangThai,title,count}] }.
       Mặc định notiType = tab đang active; params gọi kèm được ưu tiên. Phạm vi suy từ token bên BE nên không gửi iddonvi. */
    function fetchNotifyStatistic(params) {
        var merged = Object.assign({ notiType: notiPanelReadTab() }, params || {});
        return QlnvApiNotify.qlnvFetch('/qlnv/v2/notify-statistic-v2' + qlnvQueryString(merged));
    }
    /* badgeColor trả về dạng "badge.warn"/"badge.red" (dấu chấm nối class gốc + modifier) — đổi "." thành
       khoảng trắng để ra đúng className CSS ("badge warn"/"badge red"); fallback "badge warn" nếu thiếu/rỗng. */
    function notifyBadgeClass(badgeColor) {
        var cls = String(badgeColor || '').replace(/\./g, ' ').trim();
        if (!cls) return 'badge warn';
        return cls.indexOf('badge') === 0 ? cls : 'badge ' + cls;
    }
    /* Danh sách nhiệm vụ CHÍNH theo TAB NOTIFY (khác host với QLNV_API_BASE — nằm ở urlAPI, giống
       CRM_STATUS_URL/DOC_PICKER_URL) — dùng để đổ danh sách trong drawer khi bấm 1 tab notify (xem
       openLinhVucDrawer/baseNotifications). Đổi từ /qlnv/v2/get-task?nhomLinhVuc=... (lọc theo lĩnh vực)
       sang /qlnv/v2/notify-task-list?type=... (lọc theo notiType của tab — new-task/updated-task/
       near-end-task...), cùng lúc với việc thay API thống kê tab (notify-statistic) — xem
       fetchNotifyStatistic. Response phẳng {data:[...], total, page, page_size} — extractCrmStatusList/
       extractAdministrativeUnitTotal đọc thẳng data/total, không cần map field riêng. */
    function fetchLinhVucTaskList(notiType, params) {
        var page = (params && params.page) || 1;
        var limit = (params && params.limit) || 20;
        return getQlnvToken().catch(function () { return ''; }).then(function (token) {
            var headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
            if (token) headers.Authorization = 'Bearer ' + token;
            var url = LINH_VUC_TASK_LIST_URL + qlnvQueryString({
                type: notiType, page: page, page_size: limit
            });
            return fetch(url, { headers: headers });
        }).then(function (r) {
            if (!r.ok) throw new Error('QLNV V2 NOTIFY-TASK-LIST HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            var items = extractCrmStatusList(res);
            /* extractAdministrativeUnitTotal đã tổng quát hoá cách đoán field total (total, count,
               totalItems, pagination.total, meta.total, tong) — tái dùng thay vì viết lại cho endpoint này. */
            return { items: items, total: extractAdministrativeUnitTotal(res, items.length) };
        });
    }
    function fetchChildTasks(parentId) {
        return QlnvApiNotify.qlnvFetch('/danh-sach-nhiem-vu/con-moi-full?filter%5B%24or%5D%5B0%5D%5BparentId%5D=' + encodeURIComponent(parentId));
    }
    /* Ép 1 item nhiệm vụ nhánh của /qlnv/v2/sub-task vào shape childTasksSectionHtml/openChildTaskDetailModal
       đang đọc (_id, soVanBan, noiDungNhiemVu, donViChuTri, ngayChiDao, ngayHetHan, trangThaiThucHien) —
       body của sub-task GIỐNG HỆT /qlnv/v2/get-task (đã xác nhận mẫu response thật, xem normalizeNotifyTaskDetail/
       ensureNotifyLinhVucTaskRecord): manv (id thật), vanBanGiaoNhiemVu (mã ký hiệu), tenNhiemVu, donViGiao/
       khoiGiao, donViChuTri, donvi_dvthuchien (đơn vị/người thực hiện, có thể nối "; "), loai, doKhan,
       thoiHanHoanThanh/ngayHoanThanh (đã sẵn DD/MM/YYYY, KHÔNG parse qua Date), trangThai (câu), tienDoHoanThanh
       (chuỗi "xx.xx%"), soNgayQuaHan. Giữ thêm vài field cũ (soKyHieu, donVi, taskId...) làm fallback phòng
       backend đổi field lần nữa. */
    function mapQlnvSubTaskItem(it, idx) {
        it = it || {};
        var code = it.vanBanGiaoNhiemVu || it.manv || it.soKyHieu || it.soVanBan || it.maNhanh || it.code
            || ('NVN-' + String(idx + 1).padStart(2, '0'));
        var pctRaw = it.tienDoHoanThanh;
        var pctNum = parseInt(String(pctRaw != null ? pctRaw : '').replace('%', ''), 10);
        var quaHan = it.soNgayQuaHan;
        quaHan = (quaHan != null && quaHan !== '') ? Number(quaHan) : null;
        return {
            _id: String(it.manv || (it.taskId != null && it.taskId !== '' ? it.taskId : (it._id || code))),
            soVanBan: code,
            noiDungNhiemVu: it.tenNhiemVu || it.noiDungNhiemVu || '(không có nội dung)',
            donViChuTri: it.donViChuTri || it.donVi || it.donViPhoiHop || null,
            donViGiao: it.donViGiao || it.khoiGiao || '—',
            donViThucHien: it.donvi_dvthuchien || null,
            loaiVanBan: it.loai || '—',
            doKhan: it.doKhan || '—',
            ngayChiDao: it.ngayBatDau || it.ngayChiDao || '',
            ngayHetHan: it.thoiHanHoanThanh || it.ngayHetHan || '',
            ngayHoanThanh: it.ngayHoanThanh || '',
            trangThaiThucHien: it.trangThai || it.trangThaiThucHien || it.status || '—',
            soNgayQuaHan: quaHan,
            tienDoHoanThanh: isNaN(pctNum) ? null : pctNum,
            _raw: it
        };
    }
    /* Bản có phân trang (page/limit — route v2 phân trang theo `page`, KHÔNG phải skip) của danh sách
       nhiệm vụ nhánh — dùng riêng cho modal chi tiết nhiệm vụ nhánh (infinite scroll). Đổi từ
       /danh-sach-nhiem-vu/con-moi-full sang /qlnv/v2/sub-task?taskId=<id cha> theo curl mẫu người dùng cung
       cấp; taskId nhận cả _id (Mongo) lẫn taskId (datamart) tuỳ nhiệm vụ cha đang xem. */
    function fetchChildTasksPage(parentId, params) {
        var page = (params && params.page) || (Math.floor(((params && params.skip) || 0) / ((params && params.limit) || 10)) + 1);
        var limit = (params && params.limit) || 10;
        return getQlnvToken().catch(function () { return ''; }).then(function (token) {
            var headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
            if (token) headers.Authorization = 'Bearer ' + token;
            var url = SUB_TASK_V2_URL + qlnvQueryString({ taskId: parentId, page: page, limit: limit });
            return fetch(url, { headers: headers });
        }).then(function (r) {
            if (!r.ok) throw new Error('QLNV V2 SUB-TASK HTTP ' + r.status);
            return r.json();
        }).then(function (res) {
            var rawItems = extractCrmStatusList(res);
            var items = rawItems.map(mapQlnvSubTaskItem);
            return { data: items, count: extractAdministrativeUnitTotal(res, items.length), listStats: res && res.listStats };
        });
    }
    /* Làm mới panel Notify (thống kê trạng thái + danh sách của tab đang active) — gọi sau khi tạo notify
       và theo chu kỳ 30 phút. */
    function refreshNotifyTabs() {
        loadNotiPanelStatistic();
        reloadNotiPanel();
    }

    /* Tabs notify render TRỰC TIẾP từ window.__notifyStatisticItems (= response của /qlnv/v2/notify-statistic,
       mỗi item {title, badgeColor, notiType, count}) — thay cho danh sách "lĩnh vực" cũ lấy từ
       /qlnv/thong-ke-linh-vuc. count=0 -> không hiện tab; count>0 -> tiêu đề "count + title", badge lấy
       class từ badgeColor (xem notifyBadgeClass) và nội dung badge = title. */
    function baseNotifications() {
        const roles = allowedRoles();
        const defaultRole = roles[0] || currentRole;
        const statisticRows = (window.__notifyStatisticItems || []).map(item => {
            const count = Number(item.count) || 0;
            return {
                id: 'notify-stat-' + item.notiType, role: defaultRole,
                type: item.title, level: 'Trung bình',
                title: count + ' ' + item.title,
                sub: 'Nguồn: API thống kê notify (qlnv/v2/notify-statistic).', status: 'soon', source: 'API/CSDL sự kiện',
                __count: count, __badgeClass: notifyBadgeClass(item.badgeColor), __badgeText: item.title
            };
        });
        const manual = (window.__manualNotis || []).filter(n => roles.includes(n.role));
        return [...statisticRows.filter(row => row.__count > 0), ...manual];
    }
    function renderNotifications() {
        const notis = baseNotifications(); window.__incidents = notis;
        const list = notis.map(n => {
            const badgeClass = n.__badgeClass || ('badge ' + (n.level === 'Khẩn' || n.status === 'risk' ? 'red' : 'warn'));
            const badgeText = n.__badgeText != null ? n.__badgeText : n.type;
            return `<button class="notify" onclick="${n.id.indexOf('notify-stat-') === 0 ? `openLinhVucDrawer('${n.id}')` : `openIncidentDetail('${n.id}')`}" style="display:flex; align-items:center; gap:10px"><div style="flex:1; min-width:0"><b style="color:white; font-size: 11px">${esc(n.title)}</b></div><span class="${badgeClass}" style="flex-shrink:0">${esc(badgeText)}</span></button>`;
        }).join('') || `<div class="access-lock">Không có thông báo trong phạm vi quyền hiện tại.</div>`;
        const box = document.getElementById('notifyList'); if (box) box.innerHTML = list;
    }

    /* ============================== NOTIFY IOC/CAD CẦN XỬ LÝ (bố cục theo trang mẫu ioc-thanhuy) ==============================
       Hàng 1 [Tìm kiếm | ＋ Tạo | phễu lọc trạng thái], hàng 2 dải tab cuộn ngang, bên dưới danh sách nhiệm vụ tải
       dần (infinite scroll, NOTI_PANEL_PAGE_SIZE bản ghi/lần). Nguồn dữ liệu (be_qlnv, NOTIFY V2):
         - GET /qlnv/v2/notify-statistic-v2?notiType=<tab>  -> { notiType, title, total, trangThai:[{trangThai,title,count}] }
           dùng fill option bộ lọc trạng thái ("Tất cả" = total). Chỉ tab mission có trangThai, tab khác trả [].
         - GET /qlnv/v2/notify-task-list-v2?notiType=<tab>&trangThai=a,b&page=&limit= -> { data, total, page, page_size }
           mỗi item có trangThaiNoti (new|pending|near-end|out-date|complete|null), server đã sắp xếp sẵn.
       ⚠️ notiType=important gửi kèm trangThai là 400 -> chỉ gửi trangThai khi đang lọc (mà chỉ mission có option lọc).
       Tìm kiếm: tab trong NOTI_PANEL_SERVER_SEARCH_TABS gửi param `filter` (tìm theo tên nhiệm vụ, server bỏ qua
       hoa/thường + dấu, tối đa 200 ký tự) và gọi lại API; tab khác backend chưa hỗ trợ (important bỏ qua `filter`
       im lặng) nên vẫn lọc phía client trên các bản ghi đã tải (xem notiPanelVisibleItems). */
    const NOTI_PANEL_PAGE_SIZE = 20;
    const NOTI_PANEL_SERVER_SEARCH_TABS = ['mission'];
    const NOTI_PANEL_FILTER_MAX = 200;
    function notiPanelServerSearch(tab) { return NOTI_PANEL_SERVER_SEARCH_TABS.includes(tab); }
    const NOTI_PANEL_TABS = [
        { key: 'important', label: 'Khẩn cấp/Quan trọng' },
        { key: 'mission', label: 'Nhiệm vụ' },
        { key: 'document', label: 'Văn bản' },
        { key: 'okr-kpi', label: 'OKR/KPI' },
        { key: 'gis-cam', label: 'GIS/Camera AI' }
    ];
    const NOTI_PANEL_NEW_DAYS = 3;
    const NOTI_PANEL_LOW_PROGRESS = 40;

    /* Notify v2 đi chung QlnvApiNotify.qlnvFetch (QLNV_API_BASE + token + retry 401) như các API QLNV khác.
       Phạm vi suy hoàn toàn từ token bên BE (docPhamViNotify) nên KHÔNG gửi iddonvi. */
    function notiV2Fetch(path, params) {
        return QlnvApiNotify.qlnvFetch('/qlnv/v2' + path + qlnvQueryString(params || {}));
    }
    function fetchNotiPanelPage(notiType, params) {
        return notiV2Fetch('/notify-task-list-v2', {
            notiType,
            trangThai: (params.statuses || []).join(','),
            filter: params.filter,
            page: params.page || 1,
            limit: params.limit || NOTI_PANEL_PAGE_SIZE
        }).then(res => ({ items: (res && res.data) || [], total: Number(res && res.total) || 0 }));
    }
    /* ngayBatDau/ngayTao của API lẫn nhiều định dạng (YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY) — ép về DD/MM/YYYY cho
       notiPanelDaysFromToday + hiển thị. */
    function notiPanelNormDate(v) {
        const s = String(v || '').trim();
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) return `${m[3].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[1]}`;
        m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        if (m) return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
        return s;
    }
    function notiPanelNormItem(t) {
        t = t || {};
        return { ...t, ngayTao: notiPanelNormDate(t.ngayTao || t.ngayBatDau), donViChuTri: t.donViChuTri || t.donVi };
    }

    /* ---------- Suy trạng thái/nhãn từ 1 item ---------- */
    function notiPanelPct(t) {
        const p = parseFloat(String(t.tienDoHoanThanh ?? '').replace('%', ''));
        return Number.isFinite(p) ? Math.round(p) : null;
    }
    /* thoiHanHoanThanh đã ở dạng DD/MM/YYYY — tách tay, KHÔNG đưa qua new Date(chuỗi) (parse sai tùy trình duyệt). */
    function notiPanelDaysFromToday(dmy) {
        const m = String(dmy || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (!m) return null;
        const d = new Date(+m[3], +m[2] - 1, +m[1]);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return Math.round((d - today) / 86400000);
    }
    function notiPanelDaysLeft(t) { return notiPanelDaysFromToday(t.thoiHanHoanThanh); }
    /* Nhãn trạng thái lấy từ trangThaiNoti do SERVER gán (cùng điều kiện với số đếm của notify-statistic, nên badge
       luôn khớp option lọc) — FE chỉ đổi sang key/nhãn/màu hiển thị. null = không thuộc trạng thái nào (chỉ gặp ở
       tab important) -> "Đang thực hiện". */
    function notiPanelItemStatus(t) {
        switch (t.trangThaiNoti) {
            case 'complete': return { key: 'done', label: 'Hoàn thành', cls: 'ok' };
            case 'pending': return { key: 'pending', label: 'Chờ duyệt', cls: 'gold' };
            case 'out-date': {
                const days = notiPanelDaysLeft(t);
                const late = Number(t.soNgayQuaHan) || (days != null && days < 0 ? -days : null);
                return { key: 'overdue', label: late ? `Quá hạn ${fmt(late)} ngày` : 'Quá hạn', cls: 'red' };
            }
            case 'near-end': return { key: 'today', label: 'Hạn hôm nay', cls: 'orange' };
            case 'new': return { key: 'new', label: 'Mới', cls: 'blue' };
            default: return { key: 'in_progress', label: 'Đang thực hiện', cls: '' };
        }
    }
    /* ⚠️ = Hỏa tốc/Thượng khẩn, ❗ = Khẩn — chỉ chèn cạnh tiêu đề, không thay badge trạng thái. */
    function notiPanelUrgencyIcon(t) {
        const k = String(t.doKhan || '');
        if (k === 'Hỏa tốc' || k === 'Thượng khẩn') return `<span title="${esc(k)}">⚠️</span> `;
        if (k === 'Khẩn') return `<span title="${esc(k)}">❗</span> `;
        return '';
    }
    /* Chỉ đơn vị cuối cùng trong chuỗi "A / B / C" — dòng phụ chỉ có 1 dòng. */
    function notiPanelShortUnit(u) {
        const s = String(u || '').trim(); if (!s) return '—';
        const parts = s.split('/').map(p => p.trim());
        return parts[parts.length - 1] || s;
    }
    /* Thanh tiến độ mini xếp chồng trên badge hạn — chỉ hiện khi chưa xong mà tiến độ < 40% (tín hiệu rủi ro trễ). */
    function notiPanelProgressBadge(t, st) {
        const p = notiPanelPct(t);
        /* Chỉ cảnh báo ở các case sát/quá hạn — nhiệm vụ mới tạo hay còn dài hạn thì tiến độ thấp là bình thường. */
        if (p == null || p >= NOTI_PANEL_LOW_PROGRESS || !['overdue', 'today'].includes(st.key)) return '';
        return `<span class="badge red notify-progress" title="Tiến độ ${p}%"><span class="notify-progress-track"><span style="width:${p}%"></span></span>${p}%</span>`;
    }
    /* idx = vị trí trong notiPanelState.items (không phải trong danh sách đã lọc tìm kiếm) để modal lấy đúng bản ghi. */
    function notiPanelRowHtml(t, idx) {
        const st = notiPanelItemStatus(t);
        /* Badge "Mới" không mang thông tin ngày nên dòng phụ thêm ngày tạo rút gọn DD/MM. */
        const sub = notiPanelShortUnit(t.donViChuTri) + (st.key === 'new' && t.ngayTao ? ' · ' + String(t.ngayTao).slice(0, 5) : '');
        return `<button class="notify" onclick="openNotiPanelItem(${idx})"><div><b>${notiPanelUrgencyIcon(t)}${esc(t.tenNhiemVu || '(không có tên)')}</b><small>${esc(sub)}</small></div><div class="notify-badges">${notiPanelProgressBadge(t, st)}<span class="badge ${st.cls}">${esc(st.label)}</span></div></button>`;
    }

    /* ---------- State + tải trang ---------- */
    /* stat = response notify-statistic của tab hiện tại (null = đang tải/lỗi); statReqId chặn response tab cũ về muộn. */
    let notiPanelState = { tab: notiPanelReadTab(), statuses: [], q: '', items: [], total: null, loading: false, error: false, reqId: 0, stat: null, statReqId: 0 };
    let __notiPanelObserver = null;
    let __notiPanelSearchTimer = null;

    function renderNotiPanel() {
        renderNotiPanelTabs();
        loadNotiPanelStatistic();
        reloadNotiPanel();
    }
    /* Mọi thay đổi tab/lọc đều reset danh sách về trang 1. reqId chặn response cũ về muộn ghi đè
       danh sách mới (đổi tab nhanh trong lúc trang trước còn đang tải). */
    function reloadNotiPanel() {
        const s = notiPanelState;
        s.items = []; s.total = null; s.error = false; s.loading = false;
        s.reqId++;
        notiPanelResetListScroll();
        loadNotiPanelPage();
    }
    async function loadNotiPanelPage() {
        const s = notiPanelState;
        if (s.loading || (s.total != null && s.items.length >= s.total)) return;
        s.loading = true;
        const reqId = s.reqId;
        renderNotiPanelList();
        try {
            const res = await fetchNotiPanelPage(s.tab, { page: Math.floor(s.items.length / NOTI_PANEL_PAGE_SIZE) + 1, limit: NOTI_PANEL_PAGE_SIZE, statuses: s.statuses, filter: notiPanelServerSearch(s.tab) ? s.q : '' });
            if (reqId !== s.reqId) return;
            s.items = s.items.concat(res.items.map(notiPanelNormItem));
            /* Trang trả thiếu bản ghi (dữ liệu đổi giữa 2 lần gọi) -> coi như hết, tránh gọi lặp vô hạn trang rỗng. */
            s.total = res.items.length < NOTI_PANEL_PAGE_SIZE ? s.items.length : res.total;
        } catch (e) {
            console.error('[notify] lỗi tải danh sách notify:', e);
            if (reqId !== s.reqId) return;
            s.error = true; s.total = s.items.length;
        }
        s.loading = false;
        renderNotiPanelList();
    }
    function notiPanelVisibleItems() {
        const s = notiPanelState;
        /* Tab tìm ở server thì s.items đã là kết quả lọc sẵn. */
        const q = notiPanelServerSearch(s.tab) ? '' : s.q.toLowerCase();
        return s.items
            .map((t, idx) => ({ t, idx }))
            .filter(({ t }) => !q || `${t.tenNhiemVu || ''} ${t.donViChuTri || ''} ${t.soKyHieu || ''}`.toLowerCase().includes(q));
    }
    function renderNotiPanelList() {
        const box = document.getElementById('notiPanelList'); if (!box) return;
        const s = notiPanelState;
        if (__notiPanelObserver) { __notiPanelObserver.disconnect(); __notiPanelObserver = null; }
        const visible = notiPanelVisibleItems();
        const hasMore = s.total == null || s.items.length < s.total;
        const clientSearching = !!s.q && !notiPanelServerSearch(s.tab);
        let html = visible.map(({ t, idx }) => notiPanelRowHtml(t, idx)).join('');
        if (!visible.length && !(clientSearching && hasMore)) {
            html = s.loading ? '<div class="access-lock">Đang tải…</div>'
                : s.error ? '<div class="access-lock">Không tải được danh sách thông báo.</div>'
                    : `<div class="access-lock">Không có thông báo${s.q || s.statuses.length ? ' khớp điều kiện lọc' : ''}.</div>`;
        }
        /* Đang lọc client mà chưa tải hết thì vẫn giữ sentinel: nó nằm trong vùng nhìn thấy nên observer tự tải tiếp
           cho tới khi đủ kết quả lấp màn hình hoặc hết dữ liệu. */
        if ((s.items.length || clientSearching) && hasMore) html += '<div id="notiPanelSentinel" class="access-lock">Đang tải thêm…</div>';
        box.innerHTML = html;
        /* Theo dõi 1 sentinel cuối danh sách — chạm gần đáy (rootMargin 150px) thì tải trang kế. root = .widget-body
           vì chính nó là vùng cuộn của widget (overflow-y:auto), không phải cả trang. */
        const sentinel = document.getElementById('notiPanelSentinel');
        if (sentinel && !s.loading) {
            __notiPanelObserver = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) loadNotiPanelPage();
            }, { root: box.closest('.widget-body'), rootMargin: '150px' });
            __notiPanelObserver.observe(sentinel);
        }
    }
    /* Chỉ reset cuộn NỘI BỘ của widget (dừng trước body/html) — không kéo cả trang lên đầu khi đổi tab. */
    function notiPanelResetListScroll() {
        let el = document.getElementById('notiPanelList');
        while (el && el !== document.body && el !== document.documentElement) {
            if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = 0;
            el = el.parentElement;
        }
    }

    /* ---------- Tab ---------- */
    function renderNotiPanelTabs() {
        const box = document.getElementById('notiTabsBox'); if (!box) return;
        box.innerHTML = NOTI_PANEL_TABS.map(t =>
            `<button class="noti-tab${t.key === notiPanelState.tab ? ' active' : ''}" onclick="onNotiPanelTabClick('${t.key}')">${esc(t.label)}</button>`
        ).join('');
    }
    function onNotiPanelTabClick(key) {
        if (key === notiPanelState.tab) return;
        notiPanelState.tab = key;
        notiPanelSaveTab(key);
        notiPanelState.statuses = [];
        const dd = document.getElementById('notiStatusFilterDropdown'); if (dd) dd.classList.add('hidden');
        renderNotiPanelTabs();
        loadNotiPanelStatistic();
        reloadNotiPanel();
    }
    /* Nút "tiếp": cuộn tới tab đầu tiên bị cắt bên phải vùng nhìn thấy; nút "trước": tab cuối nằm trước vùng
       nhìn thấy (tab đầu tiên thì về hẳn 0 vì offsetLeft còn dính padding container). */
    function notiScrollTabs(dir) {
        const box = document.getElementById('notiTabsBox'); if (!box) return;
        const btns = [...box.children];
        const cur = box.scrollLeft, viewEnd = cur + box.clientWidth;
        let left;
        if (dir > 0) {
            const target = btns.find(b => b.offsetLeft + b.offsetWidth > viewEnd + 2);
            left = target ? target.offsetLeft : box.scrollWidth;
        } else {
            const target = btns.slice().reverse().find(b => b.offsetLeft < cur - 2);
            left = (target && target !== btns[0]) ? target.offsetLeft : 0;
        }
        box.scrollTo({ left, behavior: 'smooth' });
    }

    /* ---------- Tìm kiếm (debounce 250ms để không bắn API theo từng phím) ----------
       Tab tìm ở server -> gọi lại notify-task-list kèm `filter` (reset về trang 1); tab khác -> lọc client, không reload. */
    function onNotiPanelSearch() {
        clearTimeout(__notiPanelSearchTimer);
        __notiPanelSearchTimer = setTimeout(() => {
            const input = document.getElementById('notiPanelSearch');
            const q = ((input && input.value) || '').trim().slice(0, NOTI_PANEL_FILTER_MAX);
            if (q === notiPanelState.q) return;
            notiPanelState.q = q;
            if (notiPanelServerSearch(notiPanelState.tab)) { reloadNotiPanel(); return; }
            notiPanelResetListScroll();
            renderNotiPanelList();
        }, 250);
    }

    /* ---------- Lọc trạng thái (phễu → dropdown checkbox, chọn nhiều) ----------
       Option + số đếm lấy từ notify-statistic của tab hiện tại; statuses rỗng = không lọc ("Tất cả"). */
    async function loadNotiPanelStatistic() {
        const s = notiPanelState;
        const reqId = ++s.statReqId, tab = s.tab;
        s.stat = null;
        renderNotiStatusFilter();
        try {
            const stat = await fetchNotifyStatistic({ notiType: tab });
            if (reqId !== s.statReqId) return;
            s.stat = stat;
        } catch (e) {
            console.error('[notify] lỗi tải notify-statistic:', e);
            if (reqId !== s.statReqId) return;
            s.stat = { error: true, total: 0, trangThai: [] };
        }
        renderNotiStatusFilter();
    }
    function renderNotiStatusFilter() {
        const dd = document.getElementById('notiStatusFilterDropdown'); if (!dd) return;
        const stat = notiPanelState.stat;
        const selected = notiPanelState.statuses;
        const row = (key, label, count, checked) => `<label class="noti-filter-row"><input type="checkbox" value="${esc(key)}" ${checked ? 'checked' : ''} onchange="onNotiStatusFilterChange(this)" /><span style="flex:1">${esc(label)}</span><span class="badge">${count == null ? '…' : fmt(count)}</span></label>`;
        const opts = (stat && stat.trangThai) || [];
        dd.innerHTML = row('__all__', 'Tất cả', stat ? stat.total : null, !selected.length)
            + (opts.length ? '<div class="noti-filter-sep"></div>' + opts.map(o => row(o.trangThai, o.title, o.count, selected.includes(o.trangThai))).join('') : '')
            + (stat && stat.error ? '<div class="muted" style="padding:6px 8px">Không tải được thống kê trạng thái.</div>' : '');
        const btn = document.getElementById('notiFilterBtn');
        if (btn) {
            btn.style.boxShadow = selected.length ? '0 0 0 2px rgba(73,188,255,.45)' : '';
            /* Tab important không có lọc trạng thái (gửi trangThai -> 400) nên khoá nút. */
            btn.disabled = notiPanelState.tab === 'important';
            btn.title = btn.disabled ? 'Tab này không hỗ trợ lọc trạng thái' : 'Lọc trạng thái';
        }
    }
    function onNotiStatusFilterChange(el) {
        const dd = document.getElementById('notiStatusFilterDropdown');
        notiPanelState.statuses = el.value === '__all__' ? []
            : [...dd.querySelectorAll('input[type=checkbox]:checked')].map(c => c.value).filter(v => v !== '__all__');
        renderNotiStatusFilter();
        reloadNotiPanel();
    }

    /* ---------- Chi tiết 1 item (modal) ---------- */
    function openNotiPanelItem(idx) {
        const t = notiPanelState.items[idx]; if (!t) return;
        const st = notiPanelItemStatus(t);
        const pct = notiPanelPct(t);
        const tabLabel = (NOTI_PANEL_TABS.find(x => x.key === notiPanelState.tab) || {}).label || '';
        document.getElementById('modalTitleNotify').textContent = `Notify IOC/CAD · ${tabLabel}`;
        document.getElementById('modalSubNotify').textContent = t.tenNhiemVu || '';
        document.getElementById('modalBodyNotify').innerHTML = `<div class="detail-card"><h4>Thông tin nhiệm vụ</h4><div class="kv">`
            + `<b>Tên nhiệm vụ</b><span>${esc(t.tenNhiemVu || '—')}</span>`
            + `<b>Văn bản giao</b><span>${esc(t.soKyHieu || '—')}</span>`
            + `<b>Đơn vị chủ trì</b><span>${esc(t.donViChuTri || '—')}</span>`
            + `<b>Độ khẩn</b><span>${esc(t.doKhan || '—')}</span>`
            + `<b>Ngày tạo</b><span>${esc(t.ngayTao || '—')}</span>`
            + `<b>Thời hạn hoàn thành</b><span>${esc(t.thoiHanHoanThanh || '—')}</span>`
            + `<b>Tiến độ</b><span>${pct != null ? pct + '%' : '—'}</span>`
            + `<b>Trạng thái xử lý</b><span>${esc(t.trangThai || '—')}</span>`
            /* Dòng "Cảnh báo" chỉ hiện với case tính theo ngày (quá hạn/hạn hôm nay/mới/sắp hết hạn) — các case còn
               lại trùng đúng trạng thái xử lý ở dòng trên. */
            + (['overdue', 'today', 'new', 'due_soon'].includes(st.key) ? `<b>Cảnh báo</b><span><span class="badge ${st.cls}">${esc(st.label)}</span></span>` : '')
            + `</div></div>`;
        openModal();
    }

    /* Hiển thị field "người/đơn vị" từ API — item có thể là string, object populate ({name/fullName/...})
       hoặc mảng (receivers) tuỳ nguồn, nên thử lần lượt thay vì giả định 1 shape cố định. */
    function notifyDisplayPerson(v) {
        if (v == null || v === '') return '—';
        if (Array.isArray(v)) return v.map(notifyDisplayPerson).filter(s => s !== '—').join(', ') || '—';
        if (typeof v === 'object') return v.name || v.fullName || v.title || v.username || v._id || '—';
        return String(v);
    }

    /* Ép nhiệm vụ chính lấy từ tab "lĩnh vực" (danh-sach-linh-vuc) vào shape `records`, — mục đích: id của record LUÔN LÀ id thật của
       nhiệm vụ (không phụ thuộc đúng tên field `_id` do API trả về, vì openNotifySubTaskForm hiện đang lỗi
       "không lấy được nhiệm vụ cha" khi field đó thiếu/khác tên). find-or-create theo id để mở lại chi tiết
       nhiều lần không tạo trùng bản ghi. KHÔNG set __qlnv để không lẫn vào KPI/segment dashboard "Nhiệm vụ
       giao/nhận". */
    function notifyLinhVucTaskRecordId(item) {
        /* /qlnv/v2/notify-task-list trả id thật ở `taskId` (số, vd 237112) — /qlnv/v2/get-task cũ (giờ không
           còn gọi) trả ở `manv`. Giữ cả 2 + vài field cũ làm fallback phòng route đổi shape lần nữa. */
        return String((item && (item._id || item.id || item.taskId || item.manv || item.maNhiemVu)) || '');
    }
    function ensureNotifyLinhVucTaskRecord(task, linhVucLabel) {
        const id = notifyLinhVucTaskRecordId(task);
        if (!id) return null;
        let rec = records.find(x => x.id === id);
        if (!rec) {
            const pctRaw = task.tienDoHoanThanh;
            const pctNum = parseInt(String(pctRaw != null ? pctRaw : '').replace('%', ''), 10);
            rec = {
                id, code: task.vanBanGiaoNhiemVu || task.soVanBan || task.soKyHieu || task.maNhiemVu || task.code || '—', role: allowedRoles()[0] || currentRole, metric: 'received', status: 'doing',
                title: task.tenNhiemVu || '(không có tên)', field: linhVucLabel || task.nhomLinhVuc || task.tenLinhVuc || task.linhVuc || '—', docType: task.loaiVanBan || task.loai || '',
                unit: qlnvUnitDisplayName(task.donViChuTri) || task.organizationUnit || task.donVi || '—',
                creator: task.donViGiao || task.khoiGiao || 'Hệ thống QLNV',
                receiver: qlnvUnitDisplayName(task.donViThucHien) || qlnvUnitDisplayName(task.donvi_dvthuchien) || qlnvUnitDisplayName(task.donViChuTri) || task.organizationUnit || task.donVi || '—',
                coordinators: [], importance: 'Bình thường', urgency: task.doKhan || '—',
                startDate: task.ngayBatDau || task.ngayChiDao || '', due: task.thoiHanHoanThanh || task.ngayHetHan || task.hanXuLy || task.due || '—',
                created: task.createdAt ? String(task.createdAt).slice(0, 10) : '—', progress: isNaN(pctNum) ? 0 : pctNum,
                description: task.moTa || task.description || task.noiDung || `Trạng thái theo QLNV: ${task.trangThai || task.tinhTrang || task.trangThaiXuLy || task.status || '—'}. IOC chỉ hiển thị, không chỉnh sửa tại đây.`,
                linkedDocIds: [], evidence: [], history: [{ time: new Date().toLocaleString('vi-VN'), text: 'Đồng bộ từ QLNV (v2/notify-task-list)' }],
                subtasks: [], __notifyLinhVucTask: true, __notifyTaskId: id, __childrenLoaded: false
            };
            records.push(rec);
        }
        return rec;
    }
    /* Map nhiệm vụ con (con-moi-full) sang shape subtask dùng chung — việc gọi API lấy nhiệm vụ con nay nằm
       trực tiếp trong onTaskRowClick() để áp dụng cho mọi nhiệm vụ, không riêng nhiệm vụ notify. */
    function mapNotifyChildToSubtask(c) {
        return {
            id: c._id, maNhanh: c._id,
            tenNhiemVu: c.noiDungNhiemVu || '(không có nội dung)', name: c.noiDungNhiemVu || '(không có nội dung)',
            noiDungNhiemVu: c.noiDungNhiemVu || '', content: c.noiDungNhiemVu || '',
            donViChuTri: qlnvUnitDisplayName(c.donViChuTri) || '—', owner: qlnvUnitDisplayName(c.donViChuTri) || '—',
            donViThucHien: [], coordinators: [],
            ngayChiDao: c.ngayChiDao || '—', startDate: c.ngayChiDao || '—',
            ngayHetHan: c.ngayHetHan || '—', due: c.ngayHetHan || '—',
            priority: 'Trung bình', doKhan: '—', urgency: '—',
            trangThai: c.trangThaiThucHien || '—', state: c.trangThaiThucHien || '—',
            progress: 0, scenario: '',
            created: new Date().toLocaleString('vi-VN')
        };
    }

    /* ============================== DRAWER TAB NOTIFY (api/qlnv/v2/notify-task-list?type=<notiType>) ==============================
       Tab được click xác định qua id lấy từ window.__notifyStatisticItems (response của notify-statistic,
       xem baseNotifications) — notiType để lọc là item.notiType (vd "new-task"/"updated-task"/"near-end-task").
       Danh sách nhiệm vụ CHÍNH trong drawer gọi thẳng API v2/notify-task-list (host urlAPI, xem
       fetchLinhVucTaskList) mỗi lần mở tab. Tên hàm/biến còn giữ "LinhVuc" từ khi tính năng này chỉ phục vụ
       tab lĩnh vực — nay dùng chung cho MỌI tab notify, không đổi tên để giữ diff nhỏ. */
    let notifyLinhVucDrawerState = { code: '', label: '', items: [], total: null, limit: 20, threshold: 5, loading: false, loadingMore: false, hasMore: true, error: false };
    async function openLinhVucDrawer(rowId) {
        const clicked = (window.__notifyStatisticItems || []).find(x => 'notify-stat-' + x.notiType === rowId); if (!clicked) return;
        const notiType = clicked.notiType;
        notifyLinhVucDrawerState = {
            code: notiType, label: clicked.title || ('Notify ' + notiType),
            items: [], total: null, limit: 20, threshold: 5, loading: true, loadingMore: false, hasMore: true, error: false
        };
        openDrawerNoti();
        renderLinhVucDrawer();
        await loadLinhVucDrawerPage();
    }
    /* Tải 1 trang (limit=20) và gộp nối vào items hiện có — dùng cho cả lần mở đầu tiên lẫn
       infinite scroll (maybeLoadMoreLinhVucDrawer). skip tính theo items.length hiện có. */
    async function loadLinhVucDrawerPage() {
        const s = notifyLinhVucDrawerState;
        const notiType = s.code;
        const page = Math.floor(s.items.length / s.limit) + 1;
        try {
            const res = await fetchLinhVucTaskList(notiType, { page: page, limit: s.limit });
            if (notifyLinhVucDrawerState.code !== notiType) return; // đã chuyển sang tab notify khác trong lúc chờ
            s.items = s.items.concat(res.items);
            s.total = res.total;
            s.hasMore = s.items.length < s.total;
        } catch (e) {
            console.error('[notify] lỗi tải danh sách nhiệm vụ theo tab notify:', e);
            if (notifyLinhVucDrawerState.code !== notiType) return;
            s.error = true; s.hasMore = false;
        }
        s.loading = false; s.loadingMore = false;
        renderLinhVucDrawer();
    }
    function maybeLoadMoreLinhVucDrawer() {
        const box = document.getElementById('drawerBodyNotify');
        if (!box || !document.getElementById('linhVucTasksList')) return; // drawer đang hiển thị nội dung khác (calendar/GIS/chỉ tiêu...)
        const s = notifyLinhVucDrawerState;
        if (s.loading || s.loadingMore || !s.hasMore) return;
        const remaining = box.scrollHeight - box.scrollTop - box.clientHeight;
        const approxRowHeight = 40;
        if (remaining <= approxRowHeight * s.threshold) { s.loadingMore = true; loadLinhVucDrawerPage(); }
    }
    function bindLinhVucDrawerScroll() {
        const box = document.getElementById('drawerBodyNotify');
        if (!box || box.dataset.boundLinhVucScroll === 'true') return;
        box.dataset.boundLinhVucScroll = 'true';
        box.addEventListener('scroll', maybeLoadMoreLinhVucDrawer);
    }
    function renderLinhVucDrawer() {
        const s = notifyLinhVucDrawerState;
        document.getElementById('drawerTitleNotify').textContent = s.label;
        document.getElementById('drawerSubNotify').textContent = (s.loading && !s.items.length) ? 'Đang tải…' : fmt(s.total != null ? s.total : s.items.length) + ' nhiệm vụ';
        let body;
        if (s.loading && !s.items.length) {
            body = '<div class="access-lock">Đang tải danh sách nhiệm vụ...</div>';
        } else if (s.error && !s.items.length) {
            body = '<div class="access-lock">Không tải được danh sách nhiệm vụ.</div>';
        } else {
            const rows = s.items.map((t, i) => {
                /* /qlnv/v2/notify-task-list: mã ký hiệu = soKyHieu, hạn xử lý = thoiHanHoanThanh, ngày bắt đầu =
                   ngayBatDau — CẢ 3 ĐÃ SẴN ĐỊNH DẠNG DD/MM/YYYY (không phải chuỗi ISO) nên KHÔNG được đưa qua
                   new Date() (parse sai/Invalid Date tuỳ trình duyệt). donVi/donViThucHien là chuỗi tên đơn vị,
                   không phải id nên qlnvUnitDisplayName trả nguyên văn nếu không tra được tên. */
                const trangThai = t.trangThai || t.trangThaiVietTat || t.tinhTrang || '—';
                return `<tr class="clickable" onclick="openTaskDetailFromLinhVuc(${i})">`
                    + `<td class="tc">${i + 1}</td>`
                    + `<td class="mono">${esc(t.soKyHieu || t.vanBanGiaoNhiemVu || t.soVanBan || t.maNhiemVu || t.code || '—')}</td>`
                    + `<td class="linhvuc-title-col"><b>${esc(t.tenNhiemVu || '(không có tên)')}</b></td>`
                    + `<td>${esc(qlnvUnitDisplayName(t.donVi || t.donViChuTri) || t.organizationUnit || '—')}</td>`
                    + `<td>${esc(qlnvUnitDisplayName(t.donViThucHien || t.donvi_dvthuchien) || qlnvUnitDisplayName(t.donViPhoiHop || t.coordinators) || '—')}</td>`
                    + `<td>${esc(t.nhomLinhVuc || s.label)}</td>`
                    + `<td>${esc(t.ngayBatDau || t.ngayChiDao || '—')}</td>`
                    + `<td>${esc(t.thoiHanHoanThanh || t.ngayHetHan || t.hanXuLy || '—')}</td>`
                    + `<td>${trangThai !== '—' ? `<span class="status-pill" style="background:#2c7dd222;color:#49bcff;border:1px solid #2c7dd266">${esc(trangThai)}</span>` : '—'}</td>`
                    + `</tr>`;
            }).join('') || '<tr><td colspan="9">Không có nhiệm vụ.</td></tr>';
            body = `<div style="overflow-x:auto"><table class="compact-table"><thead><tr><th class="tc">STT</th><th>Số ký hiệu</th><th class="linhvuc-title-col">Tiêu đề nhiệm vụ</th><th>Đơn vị</th><th>Người/đơn vị phối hợp</th><th>Nhóm lĩnh vực</th><th>Ngày bắt đầu</th><th>Hạn xử lý</th><th>Trạng thái xử lý</th></tr></thead><tbody>${rows}</tbody></table></div>${s.loadingMore ? '<div class="access-lock">Đang tải thêm...</div>' : ''}`;
        }
        document.getElementById('drawerBodyNotify').innerHTML = `<div id="linhVucTasksList">${body}</div>`;
        bindLinhVucDrawerScroll();
    }
    function backToLinhVucDrawer() { closeModalNoti(); setTimeout(() => { openDrawerNoti(); renderLinhVucDrawer(); }, 0); }
    function openTaskDetailFromLinhVuc(idx) {
        const t = (notifyLinhVucDrawerState.items || [])[idx]; if (!t) return;
        closeDrawerNoti();
        openTaskDetailModal(t, 'backToLinhVucDrawer');
    }

    /* ============================== MODAL cấp 2/3: chi tiết nhiệm vụ + nhiệm vụ nhánh (qlnv/v2/sub-task, phân trang) ==============================
       Cấp 2 (openTaskDetailModal) và Cấp 3 (openChildTaskDetailModal) dùng CHUNG 1 state (notifyTaskDetailState)
       cho phần "nhiệm vụ nhánh": cấp 3 chỉ thêm khối thông tin nhánh đang xem ở trên, còn danh sách/nút phân trang
       bên dưới là chính bảng đã tải ở cấp 2 (đúng yêu cầu "lấy danh sách nhiệm vụ nhánh giống màn chi tiết nhiệm
       vụ chính") — không gọi lại API riêng, không tạo state thứ 2. IOC chỉ hiển thị dữ liệu đồng bộ từ QLNV nên
       không có nút thao tác ghi/tạo (chọn kịch bản, giao nhiệm vụ nhánh, xuất bảng...) ở 2 màn này. */
    /* [Cập nhật theo mẫu response thật của /qlnv/v2/get-task] Trước đây field set chỉ giữ Mã nhiệm vụ/Tiêu đề/
       Lĩnh vực/Đơn vị chủ trì/Hạn hoàn thành/Trạng thái vì route cũ không cung cấp gì thêm đáng tin cậy. Route
       v2/get-task trả thêm loai (loại văn bản), donViGiao/khoiGiao, donvi_dvthuchien (đơn vị/người thực hiện,
       có thể nhiều đơn vị nối "; "), doKhan, tienDoHoanThanh (chuỗi "xx.xx%"), soNgayQuaHan, ngayHoanThanh —
       nên hiện thêm các field này thay vì bỏ qua. id lấy từ `manv` (route này không trả _id/taskId). Ngày
       (thoiHanHoanThanh/ngayHoanThanh) đã sẵn định dạng DD/MM/YYYY — không parse lại qua Date. */
    function normalizeNotifyTaskDetail(task, linhVucLabel) {
        task = task || {};
        var pctRaw = task.tienDoHoanThanh;
        var pctNum = parseInt(String(pctRaw != null ? pctRaw : '').replace('%', ''), 10);
        var quaHan = task.soNgayQuaHan;
        quaHan = (quaHan != null && quaHan !== '') ? Number(quaHan) : null;
        return {
            id: task.manv || task.taskId || task._id, code: task.vanBanGiaoNhiemVu || task.soVanBan || task.soKyHieu || task.maNhiemVu || task.code || '—',
            title: task.tenNhiemVu || '(không có tên)',
            linhVuc: linhVucLabel || task.nhomLinhVuc || task.tenLinhVuc || task.linhVuc || '—',
            loaiVanBan: task.loaiVanBan || task.loai || '—',
            donViGiao: task.donViGiao || task.khoiGiao || '—',
            donViChuTri: qlnvUnitDisplayName(task.donViChuTri) || task.organizationUnit || task.donVi || '—',
            donViThucHien: qlnvUnitDisplayName(task.donViThucHien) || qlnvUnitDisplayName(task.donvi_dvthuchien) || '—',
            nguoiGiao: task.nguoiGiao || '',
            nguoiThucHien: task.nguoiThucHien || '',
            doKhan: task.doKhan || '—',
            hanXuLy: task.thoiHanHoanThanh || task.ngayHetHan || task.hanXuLy || task.due || '—',
            ngayHoanThanh: task.ngayHoanThanh || '',
            trangThai: task.trangThai || task.trangThaiXuLy || task.tinhTrang || task.status || '—',
            soNgayQuaHan: quaHan,
            progress: isNaN(pctNum) ? null : pctNum,
            moTa: task.moTa || task.description || task.noiDung || '',
            ketQuaGhiChu: task.ketQuaGhiChu || '',
            sanPhamChuYeu: task.sanPhamChuYeu || ''
        };
    }
    /* Mở hệ NGUỒN (Bkav/DHVB) kèm token SSO cho 2 nút "Tạo chủ trương/kế hoạch" và "Cập nhật nhiệm
       vụ" của modal cấp 2 — port từ tongquan.js (qlnvxRenderRecordDetail + các helper nó cần), điều chỉnh
       để đọc dữ liệu từ notifyTaskDetailState/normalizeNotifyTaskDetail thay vì records[]/r._raw. */
    var QLNV_EXTERNAL_TASK_URL = {
        bkavHost: (typeof window !== 'undefined' && window.QLNV_EXTERNAL_BKAV_HOST) || 'https://theodoinhiemvu.hanoi.gov.vn',
        /* Deeplink chính thức Bkav: /api/deeplink/task?task_id=&username=&key= — hệ đích tự đăng nhập. */
        bkavDeeplink: '/api/deeplink/task',
        bkavApiKey: (typeof window !== 'undefined' && window.QLNV_EXTERNAL_BKAV_API_KEY) || 'RJFwW1Uqvd85QkWw_10xo4QZNc3wxhGw2j7NkUiJjZg',
        bkavAppList: '/app/task'
    };
    var QLNV_CHUTRUONG_BASE = (typeof window !== 'undefined' && window.QLNV_CHUTRUONG_BASE) || 'https://iochn.hanoi.dcs.vn:300/';
    var QLNV_CHUTRUONG_PAGE = (typeof window !== 'undefined' && window.QLNV_CHUTRUONG_PAGE) || '/OutGoingDocument';
    function qlnvSerializeQuery(obj) {
        var params = new URLSearchParams();
        Object.keys(obj || {}).forEach(function (key) {
            var val = obj[key];
            if (val == null || val === '') return;
            params.append(key, String(val));
        });
        return params.toString();
    }
    /* Bundle {tokenBase, token:{jwt_access_token}} từ proxy BE — dùng riêng cho deeplink SSO. KHÁC
       getQlnvToken() (chỉ trả JWT string dùng làm header Authorization cho các API gọi trong app). */
    function qlnvFetchProxyTokenBundle() {
        // KHÔNG dùng QLNV_TOKEN_CFG.proxyTokenUrl: từ khi xác thực chuyển sang token SSO,
        // biến đó trỏ /api/token và trả access_token SSO. Deeplink lại cần đúng bundle
        // {tokenBase, token:{jwt_access_token}} — JWT do be_qlnv ký — vì DHVB nhận
        // token đó để tự đăng nhập. Hai việc khác nhau, giữ hai endpoint khác nhau.
        var bundleUrl = resolveApiBase() + '/api-nest/qlnv/token';
        return fetch(bundleUrl, { credentials: 'include', headers: { Accept: 'application/json' } }).then(function (r) {
            if (!r.ok) throw new Error('Lấy token HTTP ' + r.status);
            return r.json();
        });
    }
    /* "Cập nhật nhiệm vụ" -> mở nhiệm vụ trên Bkav (Theo dõi nhiệm vụ) qua deeplink chính thức. Mọi nhiệm vụ —
       kể cả xã/phường giao — đều đã lên BMM nên không còn nhánh mở QLNV lifetex theo _id Mongo. Thiếu mã
       hoặc tài khoản thì lùi về trang danh sách của Bkav. Không tham số — tự đọc notifyTaskDetailState. */
    function qlnvOpenTaskExternal() {
        var s = notifyTaskDetailState; var task = s && s.task; if (!task) return;
        var d = normalizeNotifyTaskDetail(task, s.linhVucLabel);
        var T = QLNV_EXTERNAL_TASK_URL;
        /* Mã BKAV để vào thẳng chi tiết = `taskId` của route v2 (chính là `Ma` bên BKAV). */
        var bmmId = task.bmmTaskId != null ? String(task.bmmTaskId) : '';
        if (!bmmId && /^\d+$/.test(String(d.id || ''))) bmmId = String(d.id);
        /* username cho deeplink = `username` hồ sơ /employees/profile (xem qlnvBkavAccount). */
        qlnvBkavAccount().then(function (bkavUser) {
            var target = bmmId && bkavUser
                ? T.bkavHost + T.bkavDeeplink + '?' + qlnvSerializeQuery({ task_id: bmmId, username: bkavUser, key: T.bkavApiKey })
                : T.bkavHost + T.bkavAppList;
            /* In LINK THẬT ra Console để đối chiếu khi Bkav trả sso_error. */
            console.log('[QLNV] Mở Bkav:', { link: target, task_id: bmmId || '(không có)', username: bkavUser || '(chưa lấy được account)', id_ban_ghi: d.id, bmmTaskId_raw: task.bmmTaskId });
            try { window.open(target, '_blank', 'noopener'); } catch (e) { location.href = target; }
            toast('Mở nhiệm vụ trên hệ Theo dõi nhiệm vụ (Bkav) — ' + (bmmId && bkavUser ? 'chi tiết nhiệm vụ' : !bmmId ? 'danh sách (chưa mirror mã nhiệm vụ)' : 'danh sách (chưa lấy được tài khoản đăng nhập)') + '…');
        });
    }
    /* "Tạo chủ trương/kế hoạch" -> mở hệ Văn bản đi (DHVB) kèm token để tự đăng nhập. */
    function qlnvOpenChuTruong() {
        qlnvFetchProxyTokenBundle().then(function (bundle) {
            var tokenBase = (bundle && bundle.tokenBase) || null;
            var token = (bundle && bundle.token) || null;
            if (!token || !token.jwt_access_token) { window.open(QLNV_CHUTRUONG_BASE, '_blank', 'noopener'); return; }
            window.open(QLNV_CHUTRUONG_BASE + '?' + qlnvSerializeQuery(Object.assign({}, tokenBase || {}, { token: token.jwt_access_token, isRedirect: true, default_page: QLNV_CHUTRUONG_PAGE })), '_blank', 'noopener');
        }).catch(function (err) {
            console.warn('[DHVB redirect] token lỗi', err);
            window.open(QLNV_CHUTRUONG_BASE, '_blank', 'noopener');
        });
        toast('Mở hệ Văn bản đi (DHVB) để tạo chủ trương/kế hoạch…');
    }

    let notifyTaskDetailState = { task: null, backFn: 'backToLinhVucDrawer', linhVucLabel: '', children: [], childrenTotal: null, childrenStats: null, limit: 10, threshold: 5, loading: false, loadingMore: false, hasMore: true, error: false };
    function openTaskDetailModal(task, backFn) {
        const linhVucLabel = notifyLinhVucDrawerState.label || '';
        /* record: bản ghi trong `records[]` ép ra từ task (ensureNotifyLinhVucTaskRecord) — openNotifySubTaskForm/
           createNotifySubTaskAssignment dùng cái này (qua resolveParentQlnvId) thay vì đọc thẳng task._id, để không
           bị lỗi "không lấy được nhiệm vụ cha" khi API danh-sach-linh-vuc không trả đúng field _id. */
        const record = ensureNotifyLinhVucTaskRecord(task, linhVucLabel);
        notifyTaskDetailState = { task, record, backFn, linhVucLabel, children: [], childrenTotal: null, childrenStats: null, limit: 10, threshold: 5, loading: true, loadingMore: false, hasMore: true, error: false };
        renderTaskDetailModal();
        openModal();
        loadChildTasksPage();
    }
    /* Vẽ khung cấp 2 (thông tin nhiệm vụ + bảng nhiệm vụ nhánh) — tách riêng khỏi openTaskDetailModal để
       backToTaskDetailModal() (quay lại từ cấp 3) có thể vẽ lại NGAY từ state đã có, không cần gọi lại API. */
    function renderTaskDetailModal() {
        window.__assignmentFilesNoti = [];
        const s = notifyTaskDetailState;
        const d = normalizeNotifyTaskDetail(s.task, s.linhVucLabel);
        document.getElementById('modalTitleNotify').textContent = 'Chi tiết nhiệm vụ';
        document.getElementById('modalSubNotify').textContent = d.title;
        const infoCard = `<div class="detail-card"><h4>Thông tin nhiệm vụ</h4><div class="kv">`
            + `<b>Mã nhiệm vụ</b><span class="mono">${esc(d.code)}</span>`
            + `<b>Tiêu đề</b><span>${esc(d.title)}</span>`
            + `<b>Lĩnh vực</b><span>${esc(d.linhVuc)}</span>`
            + `<b>Loại văn bản</b><span>${esc(d.loaiVanBan)}</span>`
            + `<b>Đơn vị giao</b><span>${esc(d.donViGiao)}</span>`
            + `<b>Đơn vị chủ trì</b><span>${esc(d.donViChuTri)}</span>`
            + `<b>Đơn vị/người thực hiện</b><span>${esc(d.donViThucHien)}</span>`
            + (d.nguoiGiao ? `<b>Người giao</b><span>${esc(d.nguoiGiao)}</span>` : '')
            + (d.nguoiThucHien ? `<b>Người thực hiện</b><span>${esc(d.nguoiThucHien)}</span>` : '')
            + `<b>Độ khẩn</b><span>${esc(d.doKhan)}</span>`
            + `<b>Hạn hoàn thành</b><span>${esc(d.hanXuLy)}</span>`
            + (d.ngayHoanThanh ? `<b>Ngày hoàn thành</b><span>${esc(d.ngayHoanThanh)}</span>` : '')
            + `<b>Trạng thái</b><span>${esc(d.trangThai)}${d.soNgayQuaHan != null && d.soNgayQuaHan > 0 ? ' · Quá hạn ' + d.soNgayQuaHan + ' ngày' : ''}</span>`
            + (d.sanPhamChuYeu ? `<b>Sản phẩm chủ yếu</b><span>${esc(d.sanPhamChuYeu)}</span>` : '')
            + (d.ketQuaGhiChu ? `<b>Kết quả/ghi chú</b><span>${esc(d.ketQuaGhiChu)}</span>` : '')
            + `</div></div>`;
        /* tienDoHoanThanh của v2/notify-task-list đáng tin (số thật, không phải suy đoán) -> hiện % khi có,
           chỉ lùi về hiện trạng thái bằng chữ nếu route trả rỗng/không parse được. */
        const progressHtml = d.progress != null
            ? `<div class="progress"><i style="width:${d.progress}%"></i></div><p class="wrap" style="color:#8ab0c8;margin-top:6px"><b class="mono">${d.progress}%</b> hoàn thành · <span style="opacity:.65">${esc(d.trangThai)}</span></p>`
            : `<p class="wrap" style="color:#8ab0c8;margin-top:6px">Tiến độ: <b>${esc(d.trangThai)}</b> <span style="opacity:.65">· QLNV chưa cung cấp số liệu %</span></p>`;
        /* "Xem nhật ký đồng bộ" chỉ mang tính trang trí (như ảnh 2) — chưa có endpoint nhật ký đồng bộ
           riêng cho nhiệm vụ đồng bộ QLNV nên tạm báo "đang phát triển", không tự dựng lịch sử giả.
           3 nút còn lại port từ tongquan.js (qlnvxRenderRecordDetail): "Tạo chủ trương/kế hoạch"/"Cập nhật
           nhiệm vụ" mở hệ nguồn kèm token SSO (xem qlnvOpenChuTruong/qlnvOpenTaskExternal ở trên). */
        const moTaCard = `<div class="detail-card"><h4>Mô tả &amp; tiến độ</h4>${d.moTa ? `<p class="wrap">${esc(d.moTa)}</p>` : ''}${progressHtml}<div class="action-bar">`
            + `<button class="ghost" onclick="qlnvOpenChuTruong()" title="Mở hệ Văn bản đi (DHVB) để tạo chủ trương/kế hoạch">Tạo chủ trương/kế hoạch</button>`
            + `<button class="ghost" onclick="qlnvOpenTaskExternal()" title="Mở phần mềm nguồn (Bkav / QLNV) theo đơn vị thực hiện">Cập nhật nhiệm vụ</button>`
            + `<button class="ghost" onclick="toast('Đã gửi nhắc xử lý tới đơn vị thực hiện.')">Nhắc xử lý</button>`
            + `</div></div>`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="${s.backFn}()">← Quay lại</button></div><div class="detail-grid">${infoCard}${moTaCard}</div><div id="notifyChildTasksBox">${childTasksSectionHtml()}</div>`;
        bindModalNotifyChildScroll();
    }
    /* Bảng "Thống kê nhiệm vụ nhánh" dùng chung cho cấp 2 và cấp 3 — luôn đọc từ notifyTaskDetailState
       (đã tải/đang tải thêm), vẽ lại vào #notifyChildTasksBox mà không đụng phần khung phía trên. */
    function childTasksSectionHtml() {
        const s = notifyTaskDetailState;
        const stats = s.childrenStats || {};
        const done = Number(stats.hoanThanh) || 0;
        const doing = Number(stats.dangXuLy) || 0;
        const soon = Number(stats.sapHetHan) || 0;
        const total = stats.total != null ? Number(stats.total) : (s.childrenTotal != null ? s.childrenTotal : s.children.length);
        let table;
        if (s.children.length) {
            const rows = s.children.map(c => {
                const trangThai = c.trangThaiThucHien || '—';
                const stColor = /hoàn/i.test(trangThai) ? '#2fb174' : /(sắp|gần)/i.test(trangThai) ? '#d8a50c' : '#2c7dd2';
                /* /qlnv/v2/sub-task trả tienDoHoanThanh (đã parse sẵn ở mapQlnvSubTaskItem -> c.tienDoHoanThanh)
                   — hiện % thật, khác con-moi-full cũ hoàn toàn không có field này nên trước đây luôn "—". */
                const pctDisplay = c.tienDoHoanThanh != null ? c.tienDoHoanThanh + '%' : '—';
                return `<tr class="clickable" onclick="openChildTaskDetailModal('${esc(c._id)}')"><td class="mono">${esc(c.soVanBan || '—')}</td><td class="subtask-content-col">${esc(c.noiDungNhiemVu || '—')}</td><td>${esc(qlnvUnitDisplayName(c.donViChuTri) || '—')}</td><td>${esc(c.ngayHetHan || '—')}</td><td>${esc(pctDisplay)}</td><td><span class="badge" style="background:${stColor}22;color:${stColor};border:1px solid ${stColor}66">${esc(trangThai)}</span></td></tr>`;
            }).join('');
            table = `<div class="subtask-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>${s.loadingMore ? '<div class="access-lock">Đang tải thêm...</div>' : ''}`;
        } else {
            table = s.loading ? '<div class="access-lock">Đang tải nhiệm vụ nhánh...</div>' : s.error ? '<div class="access-lock">Không tải được nhiệm vụ nhánh.</div>' : '<div class="subtask-empty">Chưa có nhiệm vụ nhánh.</div>';
        }
        /* "Chọn kịch bản xử lý" nay dùng CHUNG picker kịch bản thật (API /qlnv/scenarios) với "Dùng kịch bản
           có sẵn" trong openNotifySubTaskForm — xem openNotifyTaskScenarioSelector(). "Xuất bảng" vẫn chỉ
           trang trí, chưa nối API. */
        const actionBar = `<div class="action-bar"><button class="ghost" onclick="openNotifyTaskScenarioSelector()">⚡ Chọn kịch bản xử lý</button><button class="primary" onclick="openNotifySubTaskForm()">＋ Giao nhiệm vụ nhánh</button><button class="ghost" onclick="toast('Tính năng đang phát triển.')">Xuất bảng</button></div>`;
        return `<section class="subtask-summary"><div class="subtask-head"><div><h4>Thống kê nhiệm vụ nhánh liên quan nhiệm vụ chính</h4></div>${actionBar}</div><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(total)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${table}</section>`;
    }
    function updateChildTasksBox() {
        if (!document.getElementById('modal_notify').classList.contains('open')) return;
        const box = document.getElementById('notifyChildTasksBox'); if (box) box.innerHTML = childTasksSectionHtml();
    }
    /* "+ Giao nhiệm vụ nhánh" (nút duy nhất hoạt động thật trong 4 nút ở ảnh 2, xem childTasksSectionHtml)
       — dùng picker "cây đơn vị + chip đơn vị phối hợp" giống modal "Tạo notify" (openNotifyForm, bản mới
       nhất/đã polish hơn kiểu checkbox-list phẳng cũ), thay vì gọi thẳng vào các hàm notify* (chúng cố tình
       private trong IIFE của openNotifyForm, và comment ở đó đã ghi rõ "KHÔNG dùng cho... openSubTaskForm"
       — để tránh 2 form khác nhau cùng đụng 1 bộ state/element id). Nên tự dựng 1 bản cây/chip riêng, tiền
       tố "subNv". [Cập nhật] Không còn bọc trong IIFE riêng — openSubTaskForm() (luồng "văn bản đến"/hồ sơ
       chính, xem trên) giờ dùng CHUNG bộ picker cây/chip này thay vì list phẳng cũ (subOwnerList/subCoordBox),
       nên các hàm subNv* phải ở phạm vi global để cả 2 nơi gọi được. openSubTaskForm/openNotifySubTaskForm
       giờ đồng bộ field set (tiêu đề dùng id thật, badge nhiệm vụ cha đủ id/title/trục, có Mức độ quan trọng
       + Đính kèm file + nút "Dùng kịch bản có sẵn" ở cả 2 nơi) — chỉ khác nguồn dữ liệu cha (records[] demo/
       assignment vs records[] ép từ QLNV danh-sach-linh-vuc qua ensureNotifyLinhVucTaskRecord). */
    function getSubNvUnitState() {
        if (!window.__subNvUnitState) window.__subNvUnitState = { selectedId: '', selectedLabel: '', query: '' };
        return window.__subNvUnitState;
    }
    function getSubNvCoordState() {
        if (!window.__subNvCoordState) window.__subNvCoordState = { selectedIds: [], selectedLabels: {} };
        return window.__subNvCoordState;
    }
    function subNvSyncUnitHiddenInput() {
        var hiddenInput = document.getElementById('subNvUnit');
        if (hiddenInput) hiddenInput.value = getSubNvUnitState().selectedId || '';
    }
    var __subNvUnitTreeData = [];
    // "Đơn vị/người phối hợp" có DANH SÁCH GỐC RIÊNG (ngang cấp) — xem qlnvOrgPickerRoots/qlnvOrgCoordRoots.
    var __subNvCoordTreeData = [];
    // byId từ TOÀN BỘ nodes phẳng — tra 1 node bất kỳ theo id bất kể nó thuộc gốc nào (subNvFindUnitNode).
    var __subNvOrgById = {};
    var __subNvUnitTreeLoading = false;
    var __subNvUnitTreeOpen = {};
    function subNvUnitTreeChildren(node) { return node && Array.isArray(node.child) ? node.child : []; }
    // Port từ assTreeHtml (tongquan.js:3616): fallback tenVietTat -> id — vài node "khối" gom nhóm của
    // cây organization-structure chỉ có tenVietTat, thiếu fallback thì dòng đó hiện trống trơn.
    function subNvUnitTreeLabel(node) { return String((node && (node.name || node.fullName || node.tenVietTat)) || (node && node.id != null ? node.id : '')); }
    function subNvUnitTreeId(node) { return String((node && (node._id || node.id || node.code)) || subNvUnitTreeLabel(node)); }
    function subNvLoadUnitTree() {
        if (__subNvUnitTreeLoading) return Promise.resolve(__subNvUnitTreeData);
        __subNvUnitTreeLoading = true;
        return qlnvLoadOrgStructure().then(function (nodes) {
            qlnvOrgBuildTree(nodes); // gắn .child cho từng node (mutate tại chỗ) — không dùng roots trả về
            __subNvOrgById = qlnvOrgById(nodes);
            __subNvUnitTreeData = qlnvOrgPickerRoots(nodes);
            __subNvCoordTreeData = qlnvOrgCoordRoots(nodes);
        }).then(function () {
            __subNvUnitTreeLoading = false;
            return __subNvUnitTreeData;
        });
    }
    // Tra thẳng byId (toàn bộ cây) — dùng chung được cho cả "đơn vị chủ trì" lẫn "đơn vị phối hợp" dù
    // chúng có gốc khác nhau.
    function subNvFindUnitNode(id) {
        return __subNvOrgById[String(id)] || null;
    }
    /* Dòng NGƯỜI của 1 đơn vị (nhánh cuối) đang mở trong cây "đơn vị chủ trì" — bấm CHỌN ĐƯỢC đích
       danh 1 người (khác cây "đơn vị/người phối hợp" chỉ hiển thị để tham khảo). */
    function subNvUnitPeopleRowsHtml(unitId, unitLabel, depth) {
        var pe = __qlnvUnitPeople[unitId];
        var pad = depth * 16;
        var lead = '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>';
        if (pe === 'loading' || pe === undefined) {
            return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">Đang tải người…</span></div>';
        }
        if (!Array.isArray(pe) || !pe.length) {
            return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">— Không có người trong đơn vị —</span></div>';
        }
        return pe.map(function (p) {
            var picked = __qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit' && String(__qlnvPickedPerson.id) === String(p.id);
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>'
                + '<button type="button" data-subnv-tree-pick-person="' + esc(String(p.id)) + '" data-subnv-person-name="' + esc(p.name || '') + '" data-subnv-person-unit="' + esc(String(unitId)) + '" data-subnv-person-unitlabel="' + esc(unitLabel || '') + '" style="flex:1;min-width:0;text-align:left;border:0;background:' + (picked ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (picked ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;font-weight:' + (picked ? '700' : '400') + ';padding:7px 8px;border-radius:8px">👤 '
                + esc(p.name || '(không tên)') + (p.position ? ' <span style="opacity:.7;font-size:11.5px">· ' + esc(p.position) + '</span>' : '')
                + '</button></div>';
        }).join('');
    }
    function subNvUnitTreeRowsHtml(nodes, depth) {
        var state = getSubNvUnitState();
        var pickedHere = !!(__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit');
        return (nodes || []).map(function (n) {
            var id = subNvUnitTreeId(n);
            var kids = subNvUnitTreeChildren(n);
            var open = !!__subNvUnitTreeOpen[id];
            var active = String(state.selectedId) === id && !pickedHere;
            var label = subNvUnitTreeLabel(n);
            // MỌI đơn vị đều cho mở rộng (▸): nhánh còn con thì xổ đơn vị con, nhánh cuối thì xổ người.
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + (depth * 16) + 'px">'
                + '<button type="button" data-subnv-tree-toggle="' + esc(id) + '" style="width:22px;height:30px;flex:0 0 auto;border:0;background:none;cursor:pointer;font-size:12px;line-height:1;padding:0;color:#49bcff;opacity:.85">' + (open ? '▾' : '▸') + '</button>'
                + '<button type="button" data-subnv-tree-pick="' + esc(id) + '" data-subnv-tree-label="' + esc(label) + '" style="flex:1;min-width:0;text-align:left;border:0;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;font-weight:' + (active ? '700' : '400') + ';padding:7px 8px;border-radius:8px">' + esc(label) + '</button>'
                + '</div>'
                + (open ? (kids.length ? subNvUnitTreeRowsHtml(kids, depth + 1) : subNvUnitPeopleRowsHtml(id, label, depth + 1)) : '');
        }).join('');
    }
    function subNvUnitTreeSearchHtml(q) {
        var out = [];
        (function walk(nodes, path) {
            (nodes || []).forEach(function (n) {
                var label = subNvUnitTreeLabel(n);
                if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: subNvUnitTreeId(n), label: label, path: path.join(' › ') });
                walk(subNvUnitTreeChildren(n), path.concat([label]));
            });
        })(__subNvUnitTreeData, []);
        if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
        var state = getSubNvUnitState();
        var extra = out.length > 200 ? out.length - 200 : 0;
        return out.slice(0, 200).map(function (u) {
            var active = String(state.selectedId) === u.id;
            return '<div style="padding:1px 0"><button type="button" data-subnv-tree-pick="' + esc(u.id) + '" data-subnv-tree-label="' + esc(u.label) + '" style="width:100%;text-align:left;border:0;background:' + (active ? 'rgba(44,125,210,.26)' : 'transparent') + ';color:' + (active ? '#dff4ff' : '#d0e8f8') + ';cursor:pointer;font-size:13px;padding:7px 8px;border-radius:8px">' + esc(u.label) + (u.path ? '<span style="display:block;font-size:11px;color:#8ab0c8;margin-top:2px">' + esc(u.path) + '</span>' : '') + '</button></div>';
        }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
    }
    function subNvRenderUnitTree() {
        var listEl = document.getElementById('subNvUnitList');
        var statusEl = document.getElementById('subNvUnitStatus');
        if (!listEl) return;
        if (!__subNvUnitTreeData.length) {
            listEl.innerHTML = __subNvUnitTreeLoading
                ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị...</div>'
                : '<div style="padding:14px 6px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị.</div>';
            if (statusEl) statusEl.textContent = '';
            return;
        }
        var q = normalizeCrmText(getSubNvUnitState().query);
        listEl.innerHTML = q ? subNvUnitTreeSearchHtml(q) : subNvUnitTreeRowsHtml(__subNvUnitTreeData, 0);
        if (statusEl) statusEl.textContent = '';
    }
    function subNvHandleUnitTreeClick(e) {
        var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-subnv-tree-toggle]') : null;
        if (toggleBtn) {
            var tid = toggleBtn.getAttribute('data-subnv-tree-toggle');
            if (tid) {
                __subNvUnitTreeOpen[tid] = !__subNvUnitTreeOpen[tid];
                // Mở NHÁNH CUỐI lần đầu -> tải LƯỜI danh sách người. Node còn đơn vị con thì KHÔNG tải
                // (người chỉ hiện ở nhánh cuối).
                var node = subNvFindUnitNode(tid);
                var isLeaf = node && !subNvUnitTreeChildren(node).length;
                if (isLeaf && __subNvUnitTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
                    var pp = qlnvLoadUnitPeople(tid);
                    if (pp) pp.then(function () { if (__subNvUnitTreeOpen[tid]) subNvRenderUnitTree(); });
                }
                subNvRenderUnitTree();
            }
            return;
        }
        var personBtn = e.target && e.target.closest ? e.target.closest('[data-subnv-tree-pick-person]') : null;
        if (personBtn) {
            subNvPickPerson(
                personBtn.getAttribute('data-subnv-tree-pick-person'),
                personBtn.getAttribute('data-subnv-person-name'),
                personBtn.getAttribute('data-subnv-person-unit'),
                personBtn.getAttribute('data-subnv-person-unitlabel')
            );
            return;
        }
        var pickBtn = e.target && e.target.closest ? e.target.closest('[data-subnv-tree-pick]') : null;
        if (pickBtn) subNvSelectUnit(pickBtn.getAttribute('data-subnv-tree-pick'), pickBtn.getAttribute('data-subnv-tree-label'));
    }
    function subNvToggleUnitDropdown() {
        var dropdown = document.getElementById('subNvUnitDropdown');
        if (!dropdown) return;
        var wasOpen = !dropdown.classList.contains('hidden');
        document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) d.classList.add('hidden'); });
        if (wasOpen) { dropdown.classList.add('hidden'); return; }
        dropdown.classList.remove('hidden');
        __subNvUnitTreeOpen = {};
        subNvRenderUnitTree();
        if (!__subNvUnitTreeData.length && !__subNvUnitTreeLoading) {
            subNvLoadUnitTree().then(function () {
                if (!dropdown.classList.contains('hidden')) subNvRenderUnitTree();
            });
        }
        var search = document.getElementById('subNvUnitSearch');
        if (search) { search.value = ''; setTimeout(function () { search.focus(); }, 0); }
    }
    function subNvFilterUnitOptions() {
        var input = document.getElementById('subNvUnitSearch');
        getSubNvUnitState().query = input ? input.value : '';
        subNvRenderUnitTree();
    }
    /* Nhãn ô "đơn vị chủ trì": đang chọn NGƯỜI cho ô này -> hiện tên người (kèm đơn vị) thay vì tên
       đơn vị, giống block_nv/nv.js qlnvSyncLeadUnitLabel. */
    function subNvSyncUnitTriggerLabel() {
        var triggerText = document.getElementById('subNvUnitTriggerText');
        if (!triggerText) return;
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') {
            var pl = '👤 ' + __qlnvPickedPerson.name + (__qlnvPickedPerson.unitLabel ? ' · ' + __qlnvPickedPerson.unitLabel : '');
            triggerText.textContent = pl;
            triggerText.style.color = '#d0e8f8';
            return;
        }
        var state = getSubNvUnitState();
        triggerText.textContent = state.selectedLabel || 'Chọn đơn vị chủ trì';
        triggerText.style.color = state.selectedLabel ? '#d0e8f8' : '#8ab0c8';
    }
    function subNvSelectUnit(unitId, label) {
        // Chọn ĐƠN VỊ -> bỏ người đã chọn trước đó của ô này (nếu có).
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') __qlnvPickedPerson = null;
        var state = getSubNvUnitState();
        state.selectedId = unitId || '';
        state.selectedLabel = label || '';
        subNvSyncUnitHiddenInput();
        subNvSyncUnitTriggerLabel();
        var dropdown = document.getElementById('subNvUnitDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        subNvRenderUnitTree();
        subNvRenderCoordOptions();
    }
    /* Chọn 1 NGƯỜI: vẫn giữ ĐƠN VỊ trong state (donViChuTri gửi đơn vị của người đó); người lưu ở
       __qlnvPickedPerson -> ghép vào payload qua QLNV_RECEIVER_FIELD lúc submit. */
    function subNvPickPerson(personId, personName, unitId, unitLabel) {
        var state = getSubNvUnitState();
        state.selectedId = unitId || '';
        state.selectedLabel = unitLabel || '';
        subNvSyncUnitHiddenInput();
        __qlnvPickedPerson = { selectId: 'subNvUnit', id: personId, name: personName || '', unitId: unitId || '', unitLabel: unitLabel || '' };
        subNvSyncUnitTriggerLabel();
        var dropdown = document.getElementById('subNvUnitDropdown');
        if (dropdown) dropdown.classList.add('hidden');
        subNvRenderUnitTree();
        subNvRenderCoordOptions();
    }
    /* Cây phối hợp dùng RIÊNG __subNvCoordTreeData (ngang cấp) — xem qlnvOrgCoordRoots, khác gốc với
       __subNvUnitTreeData (cấp dưới, "đơn vị chủ trì"). Cùng cơ chế ▸ mở/thu nhánh, chỉ khác mỗi dòng là
       checkbox (chọn NHIỀU) thay vì nút chọn 1, và khoá (disable) đúng đơn vị đang là chủ trì để 1 đơn vị
       không vừa chủ trì vừa phối hợp. */
    var __subNvCoordTreeOpen = {};
    function getSubNvCoordUiState() {
        if (!window.__subNvCoordUiState) window.__subNvCoordUiState = { query: '' };
        return window.__subNvCoordUiState;
    }
    // Port từ assLoadUnitPeople (tongquan.js:3716-3725, checkbox .assCoordPerson) — xem comment tương ứng
    // ở assCoordPeopleRowsHtml: đơn vị phối hợp lưu theo ĐƠN VỊ, bấm 1 người = tick đơn vị của người đó.
    function subNvCoordPeopleRowsHtml(unitId, depth) {
        var pe = __qlnvUnitPeople[unitId];
        var pad = depth * 16;
        var lead = '<div style="display:flex;align-items:center;gap:2px;padding-left:' + pad + 'px"><span style="width:22px;height:30px;flex:0 0 auto;display:inline-block"></span>';
        if (pe === 'loading' || pe === undefined) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">Đang tải người…</span></div>';
        if (!Array.isArray(pe) || !pe.length) return lead + '<span style="color:#8ab0c8;font-size:12.5px;padding:7px 8px">— Không có người trong đơn vị —</span></div>';
        var ownerId = getSubNvUnitState().selectedId;
        var disabled = !!ownerId && String(ownerId) === String(unitId);
        var checked = getSubNvCoordState().selectedIds.indexOf(unitId) !== -1;
        var unitNode = subNvFindUnitNode(unitId);
        var unitLabel = unitNode ? subNvUnitTreeLabel(unitNode) : unitId;
        return pe.map(function (p) {
            var personLabel = (p.name || '(không tên)') + ' · ' + unitLabel;
            return lead + '<label style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-size:13px;padding:7px 8px;border-radius:8px;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '.45' : '1') + '">'
                + '<input type="checkbox" data-subnv-coord-tree-check="' + esc(unitId) + '" data-label="' + esc(personLabel) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />'
                + '👤 ' + esc(p.name || '(không tên)') + (p.position ? ' <span style="opacity:.7;font-size:11.5px">· ' + esc(p.position) + '</span>' : '')
                + '</label></div>';
        }).join('');
    }
    function subNvCoordTreeRowsHtml(nodes, depth) {
        var ownerId = getSubNvUnitState().selectedId;
        var coordState = getSubNvCoordState();
        return (nodes || []).map(function (n) {
            var id = subNvUnitTreeId(n);
            var kids = subNvUnitTreeChildren(n);
            var open = !!__subNvCoordTreeOpen[id];
            var label = subNvUnitTreeLabel(n);
            var checked = coordState.selectedIds.indexOf(id) !== -1;
            var disabled = !!ownerId && String(ownerId) === id;
            // MỌI đơn vị đều có mũi tên ▸ — khớp cây "đơn vị chủ trì": nhánh còn con thì xổ đơn vị con,
            // nhánh cuối thì xổ danh sách người (bấm chọn được, xem subNvCoordPeopleRowsHtml).
            return '<div style="display:flex;align-items:center;gap:2px;padding-left:' + (depth * 16) + 'px">'
                + '<button type="button" data-subnv-coord-tree-toggle="' + esc(id) + '" style="width:22px;height:30px;flex:0 0 auto;border:0;background:none;cursor:pointer;font-size:12px;line-height:1;padding:0;color:#49bcff;opacity:.85">' + (open ? '▾' : '▸') + '</button>'
                + '<label style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-size:13px;padding:7px 8px;border-radius:8px;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '.45' : '1') + '">'
                + '<input type="checkbox" data-subnv-coord-tree-check="' + esc(id) + '" data-label="' + esc(label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' />'
                + esc(label) + '</label></div>'
                + (open ? (kids.length ? subNvCoordTreeRowsHtml(kids, depth + 1) : subNvCoordPeopleRowsHtml(id, depth + 1)) : '');
        }).join('');
    }
    function subNvCoordTreeSearchHtml(q) {
        var ownerId = getSubNvUnitState().selectedId;
        var coordState = getSubNvCoordState();
        var out = [];
        (function walk(nodes, path) {
            (nodes || []).forEach(function (n) {
                var label = subNvUnitTreeLabel(n);
                if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: subNvUnitTreeId(n), label: label, path: path.join(' › ') });
                walk(subNvUnitTreeChildren(n), path.concat([label]));
            });
        })(__subNvCoordTreeData, []);
        if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
        var extra = out.length > 200 ? out.length - 200 : 0;
        return out.slice(0, 200).map(function (u) {
            var checked = coordState.selectedIds.indexOf(u.id) !== -1;
            var disabled = !!ownerId && String(ownerId) === u.id;
            return '<div style="padding:1px 0"><label style="width:100%;display:flex;align-items:center;gap:6px;color:#d0e8f8;cursor:' + (disabled ? 'default' : 'pointer') + ';font-size:13px;padding:7px 8px;border-radius:8px;opacity:' + (disabled ? '.45' : '1') + '"><input type="checkbox" data-subnv-coord-tree-check="' + esc(u.id) + '" data-label="' + esc(u.label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' /><span>' + esc(u.label) + (u.path ? '<span style="display:block;font-size:11px;color:#8ab0c8;margin-top:2px">' + esc(u.path) + '</span>' : '') + '</span></label></div>';
        }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
    }
    function subNvRenderCoordOptions() {
        var box = document.getElementById('subNvCoordBox');
        if (!box) return;
        if (!__subNvCoordTreeData.length) {
            box.innerHTML = __subNvUnitTreeLoading
                ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>'
                : '<div style="padding:14px 6px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị.</div>';
            subNvRenderCoordChips();
            return;
        }
        var q = normalizeCrmText(getSubNvCoordUiState().query);
        box.innerHTML = q ? subNvCoordTreeSearchHtml(q) : subNvCoordTreeRowsHtml(__subNvCoordTreeData, 0);
        subNvRenderCoordChips();
    }
    /* Click ▸ (mở/thu nhánh) hoặc tick checkbox — bắt bằng ỦY QUYỀN trên khung box (gắn 1 lần lúc dựng
       form, xem openSubTaskForm/openNotifySubTaskForm) vì cây bị vẽ lại liên tục khi mở/thu nhánh/tick. */
    function subNvHandleCoordTreeClick(e) {
        var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-subnv-coord-tree-toggle]') : null;
        if (!toggleBtn) return;
        var tid = toggleBtn.getAttribute('data-subnv-coord-tree-toggle');
        if (!tid) return;
        __subNvCoordTreeOpen[tid] = !__subNvCoordTreeOpen[tid];
        var node = subNvFindUnitNode(tid);
        var isLeaf = node && !subNvUnitTreeChildren(node).length;
        if (isLeaf && __subNvCoordTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
            var pp = qlnvLoadUnitPeople(tid);
            if (pp) pp.then(function () { if (__subNvCoordTreeOpen[tid]) subNvRenderCoordOptions(); });
        }
        subNvRenderCoordOptions();
    }
    function subNvHandleCoordTreeChange(e) {
        var cb = e.target;
        if (!cb || !cb.hasAttribute || !cb.hasAttribute('data-subnv-coord-tree-check')) return;
        var id = cb.getAttribute('data-subnv-coord-tree-check');
        var state = getSubNvCoordState();
        var idx = state.selectedIds.indexOf(id);
        if (cb.checked) {
            if (idx === -1) { state.selectedIds.push(id); state.selectedLabels[id] = cb.getAttribute('data-label') || id; }
        } else if (idx !== -1) {
            state.selectedIds.splice(idx, 1);
        }
        subNvRenderCoordChips();
    }
    function subNvRenderCoordChips() {
        var textEl = document.getElementById('subNvCoordTriggerText');
        if (!textEl) return;
        var state = getSubNvCoordState();
        if (!state.selectedIds.length) {
            textEl.textContent = 'Chọn đơn vị phối hợp';
            textEl.style.color = '#8ab0c8';
            return;
        }
        textEl.style.color = '#d0e8f8';
        textEl.innerHTML = state.selectedIds.map(function (id) {
            var label = state.selectedLabels[id] || id;
            return '<span class="notify-coord-chip" style="display:inline-flex;align-items:center;gap:4px;background:rgba(44,125,210,.22);border:1px solid rgba(73,188,255,.35);border-radius:999px;padding:2px 6px 2px 8px;margin:2px 4px 2px 0;font-size:11.5px;color:#d0e8f8">'
                + esc(label)
                + '<span data-chip-remove="' + esc(id) + '" title="Bỏ chọn" style="cursor:pointer;color:#ff9a9a;font-weight:900;line-height:1">×</span></span>';
        }).join('');
    }
    function subNvHandleChipRemoveClick(e) {
        var removeEl = e.target.closest ? e.target.closest('[data-chip-remove]') : null;
        if (!removeEl) return;
        e.stopPropagation();
        var value = removeEl.getAttribute('data-chip-remove');
        var state = getSubNvCoordState();
        var idx = state.selectedIds.indexOf(value);
        if (idx !== -1) state.selectedIds.splice(idx, 1);
        delete state.selectedLabels[value];
        var box = document.getElementById('subNvCoordBox');
        if (box) {
            box.querySelectorAll('input[data-subnv-coord-tree-check]').forEach(function (cb) {
                if (cb.getAttribute('data-subnv-coord-tree-check') === value) cb.checked = false;
            });
        }
        subNvRenderCoordChips();
    }
    function subNvToggleCoordDropdown() {
        var dropdown = document.getElementById('subNvCoordDropdown');
        if (!dropdown) return;
        var wasOpen = !dropdown.classList.contains('hidden');
        document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) d.classList.add('hidden'); });
        if (wasOpen) { dropdown.classList.add('hidden'); return; }
        dropdown.classList.remove('hidden');
        __subNvCoordTreeOpen = {}; // mở lại -> mọi nhánh gốc thu gọn, tránh cây "đàn" cả loạt
        getSubNvCoordUiState().query = '';
        subNvRenderCoordOptions();
        if (!__subNvCoordTreeData.length && !__subNvUnitTreeLoading) {
            subNvLoadUnitTree().then(function () {
                if (!dropdown.classList.contains('hidden')) subNvRenderCoordOptions();
            });
        }
        var search = document.getElementById('subNvCoordSearch');
        if (search) { search.value = ''; setTimeout(function () { search.focus(); }, 0); }
    }
    function subNvFilterCoordOptions() {
        var input = document.getElementById('subNvCoordSearch');
        getSubNvCoordUiState().query = input ? input.value : '';
        subNvRenderCoordOptions();
    }
    function openNotifySubTaskForm() {
        var s = notifyTaskDetailState;
        var task = s.task;
        if (!task || !resolveParentQlnvId(s.record || task)) { toast('Không tìm thấy dữ liệu nhiệm vụ để giao nhiệm vụ nhánh.'); return; }
        var record = s.record;
        var d = normalizeNotifyTaskDetail(task, s.linhVucLabel);
        var recAxis = axisMeta[record.role] || axisMeta[QLNV_DEFAULT_ROLE];
        window.__assignmentFilesNoti = [];
        window.__subNvUnitState = { selectedId: '', selectedLabel: '', query: '' };
        window.__subNvCoordState = { selectedIds: [], selectedLabels: {} };
        if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') __qlnvPickedPerson = null;

        document.getElementById('modalTitleNotify').textContent = `Giao nhiệm vụ nhánh · ${esc(d.code)}`;
        document.getElementById('modalSubNotify').textContent = `Nhiệm vụ nhánh này sẽ là nhiệm vụ con của ${esc(d.code)} · ${esc(d.title)}`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="backToTaskDetailModal()">← Quay lại hồ sơ chính</button></div><div class="scenario-history-badge"><b>Nhiệm vụ cha:</b> ${esc(d.code)} · ${esc(d.title)} · Trục ${recAxis.icon} ${esc(recAxis.name)}</div>
      <div class="detail-card">
        <div class="card-head"><h4>Thông tin nhiệm vụ nhánh</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
        <div class="form2 compact widget-body">
        <div class="field wide"><label>Tên nhiệm vụ nhánh</label><input id="subTitle" placeholder="Nhập tên nhiệm vụ nhánh" /></div>
        <div class="field"><label>Người giao</label><input value="${esc(currentAccount.title)}" disabled /></div>
        <div class="field"><label>Mã nhiệm vụ nhánh</label><input id="subCode" value="${generateTaskCode()}" /></div>
        <div class="field"><label>Đơn vị chủ trì (nhận việc)</label><div class="ms-wrap" style="position:relative"><input type="hidden" id="subNvUnit" value="" /><div id="subNvUnitTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px"><span id="subNvUnitTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị chủ trì</span><span style="position:absolute;top:4px;right:12px;color:#49bcff;pointer-events:none">⌄</span></div><div id="subNvUnitDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)"><input type="text" id="subNvUnitSearch" placeholder="Tìm đơn vị..." autocomplete="off" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" /><div id="subNvUnitList" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto"></div><div id="subNvUnitStatus" style="padding:4px 2px 0;color:#8ab0c8;font-size:12px"></div></div></div></div>
        <div class="field wide"><label>Đơn vị/người phối hợp</label>
          <div class="ms-wrap" style="position:relative">
            <div id="subNvCoordTrigger" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;position:relative;cursor:pointer;min-height:18px">
              <span id="subNvCoordTriggerText" style="color:#8ab0c8;line-height:1.6;font-size:13px">Chọn đơn vị phối hợp</span><span style="position:absolute;top:9px;right:12px;color:#49bcff">⌄</span>
            </div>
            <div id="subNvCoordDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:8px;box-shadow:0 14px 30px rgba(0,0,0,.45)">
              <input type="text" id="subNvCoordSearch" placeholder="Tìm đơn vị..." style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:8px;padding:7px 10px;outline:0;color:#d0e8f8;font-size:12.5px;margin-bottom:6px" />
              <div id="subNvCoordBox" style="display:flex;flex-direction:column;gap:2px;max-height:220px;overflow-y:auto"></div>
            </div>
          </div>
        </div>
        <div class="field"><label>Mức độ quan trọng</label><select id="subPriority"><option>Cao</option><option selected>Trung bình</option><option>Bình thường</option></select></div>
        <div class="field"><label>Độ khẩn</label><select id="subUrgency">${renderUrgencyOptions()}</select></div>
        <div class="field half"><label>Ngày bắt đầu</label><input id="subStart" type="date" /></div>
        <div class="field half"><label>Hạn hoàn thành</label><input id="subDue" type="date" /></div>
        <div class="field wide"><label>Nội dung/yêu cầu</label><textarea id="subContent" rows="3" placeholder="Mô tả việc cần làm, sản phẩm đầu ra, minh chứng yêu cầu..."></textarea></div>
        <div class="field wide"><label>Đính kèm file</label><input id="subFileInputNoti" type="file" multiple onchange="handleAssignmentFilesNoti(this)" /><div id="assFileListNoti" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
        </div>
      </div>
      <div class="action-bar"><button class="primary" onclick="createNotifySubTaskAssignment()">Phát hành nhiệm vụ nhánh</button><button class="ghost" onclick="openNotifyTaskScenarioSelector()">⚡ Dùng kịch bản có sẵn</button><button class="ghost" onclick="backToTaskDetailModal()">Hủy</button></div>`;
        /* Gắn sự kiện qua addEventListener với tham chiếu hàm trực tiếp (không dùng onclick="tenHam()" dạng
           chuỗi) — cùng lý do cô lập như openNotifyForm: trang CMS nhúng chung nhiều khối, tránh bị khối
           khác định nghĩa lại hàm cùng tên rồi "thắng" ở bước tra cứu theo tên lúc click. */
        var unitTriggerEl = document.getElementById('subNvUnitTrigger');
        if (unitTriggerEl) unitTriggerEl.addEventListener('click', subNvToggleUnitDropdown);
        var unitListEl = document.getElementById('subNvUnitList');
        if (unitListEl) unitListEl.addEventListener('click', subNvHandleUnitTreeClick);
        var unitSearchEl = document.getElementById('subNvUnitSearch');
        if (unitSearchEl) unitSearchEl.addEventListener('input', subNvFilterUnitOptions);
        var coordTriggerEl = document.getElementById('subNvCoordTrigger');
        if (coordTriggerEl) coordTriggerEl.addEventListener('click', subNvToggleCoordDropdown);
        var coordSearchEl = document.getElementById('subNvCoordSearch');
        if (coordSearchEl) coordSearchEl.addEventListener('input', subNvFilterCoordOptions);
        var coordTriggerTextEl = document.getElementById('subNvCoordTriggerText');
        if (coordTriggerTextEl) coordTriggerTextEl.addEventListener('click', subNvHandleChipRemoveClick);
        var coordBoxEl = document.getElementById('subNvCoordBox');
        if (coordBoxEl) { coordBoxEl.addEventListener('click', subNvHandleCoordTreeClick); coordBoxEl.addEventListener('change', subNvHandleCoordTreeChange); }
        openModal();
        if (document.getElementById('subUrgency') && window.__crmUrgencyOptions && window.__crmUrgencyOptions.length) {
            document.getElementById('subUrgency').value = window.__crmUrgencyOptions[0];
        } else {
            loadCrmStatusMapping().then(function () {
                if (!document.getElementById('modal_notify').classList.contains('open')) return;
                syncAssignmentOptionsFromCrmStatus();
                var sel = document.getElementById('subUrgency');
                if (sel) sel.innerHTML = renderUrgencyOptions();
            });
        }
        subNvLoadUnitTree();
    }
    function createNotifySubTaskAssignment() {
        var s = notifyTaskDetailState;
        var task = s.task; if (!task) return;
        var record = s.record;
        var parentId = resolveParentQlnvId(record || task); if (!parentId) return;
        var name = (document.getElementById('subTitle').value || '').trim(); if (!name) { toast('Cần nhập tên nhiệm vụ nhánh.'); return; }
        var unitState = getSubNvUnitState();
        var owner = unitState.selectedId;
        if (!owner) { toast('Cần chọn Đơn vị chủ trì (nhận việc).'); return; }
        var ownerLabel = unitState.selectedLabel || owner;
        var coordState = getSubNvCoordState();
        var duplicatedCoordinator = coordState.selectedIds.find(function (cid) {
            return isSameAdministrativeUnit(
                { id: cid, label: coordState.selectedLabels[cid] || cid },
                { id: owner, label: ownerLabel }
            );
        });
        if (duplicatedCoordinator) { toast('Đơn vị phối hợp không được trùng với đơn vị chủ trì (nhận việc).'); return; }
        var coordinators = coordState.selectedIds.slice();
        var coordinatorLabels = coordState.selectedIds.map(function (cid) { return coordState.selectedLabels[cid] || cid; });
        var priority = document.getElementById('subPriority').value;
        var urgency = document.getElementById('subUrgency').value;
        var startDate = document.getElementById('subStart').value || '';
        var dueRaw = document.getElementById('subDue').value || ''; var due = dueRaw ? dueRaw.split('-').reverse().join('/') : dueDate(0, 'doing');
        var content = (document.getElementById('subContent').value || '').trim() || name;
        var attachments = window.__assignmentFilesNoti || [];
        var subCode = (document.getElementById('subCode').value || '').trim() || generateTaskCode();
        var parentQlnvId = parentId;
        if (window.__qlnvSubmitting) { toast('Đang gửi nhiệm vụ nhánh, vui lòng đợi…'); return; }
        // Route v2 (đồng bộ từ khối nhiệm vụ, xem buildQlnvCreateBodyV2) — thay route cũ /qlnv/bmm/create vì
        // nhận thẳng id SỐ của cây organization-structure (subNvUnitTree), không cần quy đổi ObjectId.
        var form = {
            title: name,
            loaiNV: 'NHIEM_VU_CON',
            parentId: parentQlnvId,
            capTrinh: (record && record.capTrinh) || '1',
            startDate: startDate,
            dueDate: dueRaw,
            lanhDaoChiDaoId: (window.QLNV_CREATE_DEFAULTS && window.QLNV_CREATE_DEFAULTS.lanhDaoChiDaoId) || qlnvDefaultLeaderId(),
            donViChuTri: (owner ? [owner] : null),
            receiverPersonId: (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'subNvUnit') ? __qlnvPickedPerson.id : null,
            urgency: urgency,
            description: content,
            fieldLabel: record ? record.field : '',
            soVanBan: subCode,
            donViThucHien: coordinators,
            donViThucHienLabels: coordinatorLabels
        };
        var body = buildQlnvCreateBodyV2(form);
        if (!body) return;
        // Đồng bộ payload với modal Nhập notify/Tạo nhiệm vụ: "Mức độ quan trọng" (subPriority) trước đây
        // chỉ lưu vào record local, không gửi lên QLNV.
        body.mucDoQuanTrong = mapImportanceToMucDoQuanTrong(priority);
        window.__qlnvSubmitting = true;
        toast('Đang gửi nhiệm vụ nhánh lên QLNV...');
        qlnvCreateTaskV2(body).then(function (res) {
            var newId = extractQlnvTaskId(res);
            if (record) {
                record.subtasks = record.subtasks || [];
                var subId = newId ? ('QLNV-' + newId) : (record.id + '-N' + String(record.subtasks.length + 1).padStart(2, '0'));
                var attachmentsKey = attachments.length ? `px-ioc-files-${subId}` : null;
                if (attachmentsKey) localStorage.setItem(attachmentsKey, JSON.stringify(attachments));
                record.subtasks.push({ id: subId, name: name, content: content, owner: ownerLabel, coordinators: coordinatorLabels, state: 'Đang xử lý', due: due, startDate: startDate, priority: priority, urgency: urgency, progress: 5, scenario: '', attachmentsKey: attachmentsKey, evidence: attachments.map(function (a) { return a.name; }), created: new Date().toLocaleString('vi-VN'), __qlnvId: newId || undefined, __parentId: parentQlnvId });
            }
            toast(`Đã giao nhiệm vụ nhánh "${name}" lên QLNV.`);
            /* Quay lại cấp 2 + đẩy thẳng nhánh vừa tạo vào đầu s.children để thấy ngay — KHÔNG gọi lại
               loadChildTasksPage()/fetchChildTasksPage() nữa: việc fetch danh sách nhiệm vụ nhánh chỉ nên xảy
               ra 1 lần lúc mở modal (openTaskDetailModal → loadChildTasksPage ban đầu), các lần tạo nhánh tiếp
               theo chỉ cập nhật state cục bộ rồi vẽ lại (renderTaskDetailModal → childTasksSectionHtml đọc từ
               s.children hiện có). Shape item khớp field childTasksSectionHtml/openChildTaskDetailModal đang đọc
               (_id, soVanBan, noiDungNhiemVu, donViChuTri, ngayChiDao, ngayHetHan, trangThaiThucHien). */
            var prevTotal = s.childrenTotal != null ? s.childrenTotal : s.children.length;
            s.children.unshift({
                // Response /qlnv/bmm/create không trả _id Mongo cho nhánh vừa tạo (chỉ có task_id số bên BKAV,
                // xem extractQlnvTaskId) -> dùng subCode (soVanBan) làm _id hiển thị, khớp đúng cách
                // openChildTaskDetailModal() đang hiện "Mã nhánh" từ child.soVanBan (không phải _id).
                _id: subCode,
                soVanBan: subCode,
                // con-moi-full (list thật từ Mongo) không trả field tên riêng cho nhiệm vụ nhánh, chỉ có
                // noiDungNhiemVu (xem mapNotifyChildToSubtask) -> cột "Tên nhiệm vụ"/"Nội dung" ở bảng thật
                // trùng nhau là theo đúng dữ liệu backend. Nhưng lúc TẠO thì có 2 field riêng (subTitle/subContent)
                // -> giữ tenNhiemVu ở đây để bảng hiện đúng tên người dùng vừa nhập, không bị trùng nội dung.
                tenNhiemVu: name,
                noiDungNhiemVu: content || name,
                donViChuTri: owner ? [owner] : null,
                ngayChiDao: startDate || '',
                ngayHetHan: due || '',
                trangThaiThucHien: 'Mới tạo'
            });
            s.childrenTotal = prevTotal + 1;
            renderTaskDetailModal();
        }).catch(function (err) {
            toast('Tạo nhiệm vụ nhánh lỗi: ' + (err && (err.message || err)) + ' — CHƯA lưu, vui lòng thử lại.');
        }).finally(function () { window.__qlnvSubmitting = false; });
    }
    /* Tải 1 trang nhiệm vụ nhánh (page tính theo số item đã có / limit, route v2 phân trang theo page)
       và gộp nối — dùng cho lần mở đầu lẫn infinite scroll (maybeLoadMoreChildTasks), phục vụ cả cấp 2
       lẫn cấp 3 vì dùng chung state. */
    async function loadChildTasksPage() {
        const s = notifyTaskDetailState;
        /* s.task._id không tồn tại với dữ liệu từ /qlnv/v2/get-task (chỉ có `manv`) — dùng id đã resolve
           sẵn ở s.record (ensureNotifyLinhVucTaskRecord/notifyLinhVucTaskRecordId) thay vì đọc thẳng task._id.
           parentId này chính là taskId truyền cho /qlnv/v2/sub-task (nhận cả _id Mongo lẫn taskId datamart). */
        const parentId = (s.record && s.record.id) || notifyLinhVucTaskRecordId(s.task);
        if (!parentId) { s.loading = false; s.loadingMore = false; s.error = true; s.hasMore = false; updateChildTasksBox(); return; }
        try {
            const page = Math.floor(s.children.length / s.limit) + 1;
            const res = await fetchChildTasksPage(parentId, { page: page, limit: s.limit });
            if (notifyTaskDetailState !== s) return; // đã chuyển sang xem nhiệm vụ khác trong lúc chờ
            const items = Array.isArray(res && res.data) ? res.data : [];
            s.children = s.children.concat(items);
            s.childrenTotal = Number(res && res.count) || s.children.length;
            s.childrenStats = (res && res.listStats) || s.childrenStats;
            s.hasMore = s.children.length < s.childrenTotal;
        } catch (e) {
            console.error('[notify] lỗi tải nhiệm vụ nhánh:', e);
            if (notifyTaskDetailState !== s) return;
            s.error = true; s.hasMore = false;
        }
        s.loading = false; s.loadingMore = false;
        updateChildTasksBox();
    }
    function maybeLoadMoreChildTasks() {
        const scrollEl = document.getElementById('modalBodyNotify');
        if (!scrollEl || !document.getElementById('notifyChildTasksBox')) return; // modal đang hiển thị nội dung khác
        const s = notifyTaskDetailState;
        if (s.loading || s.loadingMore || !s.hasMore) return;
        const remaining = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
        const approxRowHeight = 40;
        if (remaining <= approxRowHeight * s.threshold) { s.loadingMore = true; updateChildTasksBox(); loadChildTasksPage(); }
    }
    function bindModalNotifyChildScroll() {
        const el = document.getElementById('modalBodyNotify');
        if (!el || el.dataset.boundNotifyChildScroll === 'true') return;
        el.dataset.boundNotifyChildScroll = 'true';
        el.addEventListener('scroll', maybeLoadMoreChildTasks);
    }
    /* Cấp 3: quay lại cấp 2 KHÔNG refetch — vẽ lại đúng khung cấp 2 từ notifyTaskDetailState hiện có
       (đã tải sẵn danh sách nhiệm vụ nhánh + đã tải thêm bao nhiêu trang thì giữ nguyên bấy nhiêu). */
    function backToTaskDetailModal() { renderTaskDetailModal(); }
    function openChildTaskDetailModal(childId) {
        const child = (notifyTaskDetailState.children || []).find(c => c._id === childId); if (!child) return;
        const parentD = normalizeNotifyTaskDetail(notifyTaskDetailState.task, notifyTaskDetailState.linhVucLabel);
        document.getElementById('modalTitleNotify').textContent = `Chi tiết nhiệm vụ nhánh · ${esc(child.soVanBan || '—')}`;
        document.getElementById('modalSubNotify').textContent = `Gắn với ${esc(parentD.title)}`;
        const infoCard = `<div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv">`
            + `<b>Mã nhánh</b><span class="mono">${esc(child.soVanBan || '—')}</span>`
            + `<b>Nhiệm vụ cha</b><span>${esc(parentD.title)}</span>`
            + `<b>Nội dung</b><span class="wrap">${esc(child.noiDungNhiemVu || '(không có nội dung)')}</span>`
            + `<b>Loại văn bản</b><span>${esc(child.loaiVanBan || '—')}</span>`
            + `<b>Đơn vị giao</b><span>${esc(child.donViGiao || '—')}</span>`
            + `<b>Đơn vị chủ trì</b><span>${esc(qlnvUnitDisplayName(child.donViChuTri) || '—')}</span>`
            + `<b>Đơn vị/người thực hiện</b><span>${esc(qlnvUnitDisplayName(child.donViThucHien) || '—')}</span>`
            + `<b>Độ khẩn</b><span>${esc(child.doKhan || '—')}</span>`
            + `<b>Ngày chỉ đạo</b><span>${esc(child.ngayChiDao || '—')}</span>`
            + `<b>Hạn xử lý</b><span>${esc(child.ngayHetHan || '—')}</span>`
            + (child.ngayHoanThanh ? `<b>Ngày hoàn thành</b><span>${esc(child.ngayHoanThanh)}</span>` : '')
            + `<b>Trạng thái</b><span>${esc(child.trangThaiThucHien || '—')}${child.soNgayQuaHan != null && child.soNgayQuaHan > 0 ? ' · Quá hạn ' + child.soNgayQuaHan + ' ngày' : ''}</span>`
            + `</div></div>`;
        const statusCard = `<div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${esc(child.trangThaiThucHien || '—')}</span><b>Tiến độ</b><span class="mono">${child.tienDoHoanThanh != null ? child.tienDoHoanThanh + '%' : '—'}</span></div></div>`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="backToTaskDetailModal()">← Quay lại hồ sơ chính</button></div><div class="detail-grid">${infoCard}${statusCard}</div><div id="notifyChildTasksBox">${childTasksSectionHtml()}</div>`;
        bindModalNotifyChildScroll();
    }
    /* ============================== NOTIFY: "Đơn vị nhận nhiệm vụ" / "Đơn vị người phối hợp" (CÔ LẬP RIÊNG) ==============================
       Tách hẳn khỏi cơ chế dùng chung (toggleUnitDropdown_noti/updateUnitTriggerLabel/id assUnit*|assCoord*) — trang CMS này
       nhúng chung với các khối khác, mỗi khối tự nạp 1 file JS riêng nhưng khai báo hàm/ID CÙNG TÊN ở phạm vi global,
       nên hàm nạp sau cùng sẽ đè hàm/ID của khối trước đó (đã xác nhận qua console: toggleUnitDropdown_noti thực chạy
       là bản của khối khác). Toàn bộ hàm/ID dưới đây dùng tiền tố "notify" — không đụng tới bất kỳ hàm/ID dùng chung
       nào khác (assUnit*, assCoord*, toggleUnitDropdown_noti...) nên không bị ai đè, và cũng không đè của ai. Chỉ dùng
       riêng cho modal "Tạo notify" (openNotifyForm) — KHÔNG dùng cho openAssignmentForm/openSubTaskForm/kịch bản mới.
       [2026-07-23] Bọc toàn bộ trong 1 IIFE: mọi lời gọi CHÉO giữa các hàm notify* bên dưới (vd notifyToggleCoordDropdown
       gọi notifyRenderCoordOptions, hay addEventListener(..., notifyToggleCoordDropdown)) đều phân giải qua SCOPE CỤC BỘ
       của IIFE này — không bao giờ tra cứu lại theo tên ở phạm vi global nữa. Vì vậy dù có khối CMS khác nạp SAU và định
       nghĩa lại một tên trùng (vd cũng có hàm tên notifyToggleCoordDropdown) ở global, nó KHÔNG THỂ chen vào được các lời
       gọi bên trong IIFE này — khác với cách cũ (hàm khai báo ở top-level global) vẫn bị "trúng" nếu khối kia nạp sau và
       đè lại đúng lúc addEventListener/onclick tra cứu tên đó. Chỉ export ra window đúng 2 cái cần dùng từ bên ngoài. */
    (function () {
        function getNotifyUnitState() {
            if (!window.__notifyUnitState) window.__notifyUnitState = { selectedId: '', selectedLabel: '', query: '' };
            return window.__notifyUnitState;
        }
        /* Mảng id đơn vị phối hợp đã tick — lưu độc lập trên window.__notifyCoordState (data thuần, không phải
           hàm) thay vì đọc lại checkbox :checked từ DOM mỗi lần, vì box bị render lại nhiều lần (mở dropdown,
           scroll load thêm, đổi đơn vị nhận nhiệm vụ...) nên checkbox có thể bị thay thế/đè mất tick nếu chỉ
           dựa vào DOM. createNotifyAssignment() đọc thẳng window.__notifyCoordState.selectedIds khi submit. */
        function getNotifyCoordState() {
            if (!window.__notifyCoordState) window.__notifyCoordState = { selectedIds: [], selectedLabels: {}, staffIds: [] };
            if (!Array.isArray(window.__notifyCoordState.staffIds)) window.__notifyCoordState.staffIds = [];
            return window.__notifyCoordState;
        }
        function notifySyncUnitHiddenInput() {
            var hiddenInput = document.getElementById('notifyUnit');
            if (hiddenInput) hiddenInput.value = getNotifyUnitState().selectedId || '';
        }
        function notifyGetUnitLabel() { return getNotifyUnitState().selectedLabel || ''; }
        // Mũi tên xổ xuống của ô ms-trigger — copy hình dạng từ assChevronHtml (tongquan.js) để giống hệt.
        function notifyChevronHtml() {
            return '<svg class="ms-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8.25 9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        var __notifyUnitTreeData = [];
        // "Đơn vị/người phối hợp" giờ có DANH SÁCH GỐC RIÊNG (ngang cấp), khác "đơn vị nhận" (cấp dưới) —
        // port đúng ngữ nghĩa assPickerRoots/assCoordRoots của tongquan.js (xem qlnvOrgPickerRoots/qlnvOrgCoordRoots).
        var __notifyCoordTreeData = [];
        // byId từ TOÀN BỘ nodes phẳng (không chỉ nodes nằm trong __notifyUnitTreeData/__notifyCoordTreeData) —
        // dùng để tra 1 node bất kỳ theo id (notifyFindUnitNode) bất kể nó thuộc danh sách gốc nào.
        var __notifyOrgById = {};
        var __notifyUnitTreeLoading = false;
        var __notifyUnitTreeOpen = {};
        function notifyUnitTreeChildren(node) { return node && Array.isArray(node.child) ? node.child : []; }
        // Port từ assTreeHtml (tongquan.js:3616): fallback tenVietTat -> id — vài node "khối" gom nhóm của
        // cây organization-structure chỉ có tenVietTat, thiếu fallback thì dòng đó hiện trống trơn.
        function notifyUnitTreeLabel(node) { return String((node && (node.name || node.fullName || node.tenVietTat)) || (node && node.id != null ? node.id : '')); }
        function notifyUnitTreeId(node) { return String((node && (node._id || node.id || node.code)) || notifyUnitTreeLabel(node)); }
        /* Nạp TOÀN BỘ cây organization-structure 1 lần (dùng chung cache qlnvLoadOrgStructure/
           qlnvOrgBuildTree) rồi dựng cây — thay cho administrative-units. Tải LƯỜI: chỉ gọi khi người
           dùng mở dropdown lần đầu, không chặn lúc mở form. */
        function notifyLoadUnitTree() {
            if (__notifyUnitTreeLoading) return Promise.resolve(__notifyUnitTreeData);
            __notifyUnitTreeLoading = true;
            return qlnvLoadOrgStructure().then(function (nodes) {
                qlnvOrgBuildTree(nodes); // gắn .child cho từng node (mutate tại chỗ) — không dùng roots trả về
                __notifyOrgById = qlnvOrgById(nodes);
                __notifyUnitTreeData = qlnvOrgPickerRoots(nodes);
                __notifyCoordTreeData = qlnvOrgCoordRoots(nodes);
            }).then(function () {
                __notifyUnitTreeLoading = false;
                return __notifyUnitTreeData;
            });
        }
        /* Tìm 1 node đơn vị theo id — tra thẳng byId (toàn bộ cây, không riêng nhánh đang hiển thị) nên
           dùng chung được cho cả 2 cây "đơn vị nhận" và "đơn vị phối hợp" dù chúng có gốc khác nhau. */
        function notifyFindUnitNode(id) {
            return __notifyOrgById[String(id)] || null;
        }
        /* Dòng NGƯỜI của 1 đơn vị (nhánh cuối) đang mở trong cây "đơn vị nhận nhiệm vụ" — bấm CHỌN ĐƯỢC
           đích danh 1 người (khác cây "đơn vị/người phối hợp" chỉ hiển thị để tham khảo). */
        function notifyUnitPeopleRowsHtml(unitId, unitLabel, depth) {
            var pe = __qlnvUnitPeople[unitId];
            var pad = depth * 14;
            if (pe === 'loading' || pe === undefined) return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span><span class="qlnv-tree-name" style="cursor:default;opacity:.7"><span>Đang tải người…</span></span></div>';
            if (!Array.isArray(pe) || !pe.length) return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span><span class="qlnv-tree-name" style="cursor:default;opacity:.7"><span>— Không có người trong đơn vị —</span></span></div>';
            return pe.map(function (p) {
                var picked = __qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit' && String(__qlnvPickedPerson.id) === String(p.id);
                return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span>'
                    + '<button type="button" class="qlnv-tree-name' + (picked ? ' on' : '') + '" data-notify-tree-pick-person="' + esc(String(p.id)) + '" data-notify-person-name="' + esc(p.name || '') + '" data-notify-person-unit="' + esc(String(unitId)) + '" data-notify-person-unitlabel="' + esc(unitLabel || '') + '"><span>👤 '
                    + esc(p.name || '(không tên)') + (p.position ? ' <small style="opacity:.7">· ' + esc(p.position) + '</small>' : '')
                    + '</span></button></div>';
            }).join('');
        }
        function notifyUnitTreeRowsHtml(nodes, depth) {
            var state = getNotifyUnitState();
            var pickedHere = !!(__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit');
            return (nodes || []).map(function (n) {
                var id = notifyUnitTreeId(n);
                var kids = notifyUnitTreeChildren(n);
                var open = !!__notifyUnitTreeOpen[id];
                var active = String(state.selectedId) === id && !pickedHere;
                var label = notifyUnitTreeLabel(n);
                // MỌI đơn vị đều cho mở rộng (▸): nhánh còn con thì xổ đơn vị con, nhánh cuối thì xổ người.
                return '<div class="ass-node" data-key="' + esc(normalizeCrmText(label)) + '">'
                    + '<div class="qlnv-tree-row" style="padding-left:' + (depth * 14) + 'px">'
                    + '<button type="button" class="qlnv-tree-arrow" data-notify-tree-toggle="' + esc(id) + '" title="Mở rộng">' + (open ? '▾' : '▸') + '</button>'
                    + '<button type="button" class="qlnv-tree-name' + (active ? ' on' : '') + '" data-notify-tree-pick="' + esc(id) + '" data-notify-tree-label="' + esc(label) + '"><span>' + esc(label) + '</span></button>'
                    + '</div>'
                    + '<div class="ass-kids qlnv-tree-children" style="display:' + (open ? 'block' : 'none') + '">' + (open ? (kids.length ? notifyUnitTreeRowsHtml(kids, depth + 1) : notifyUnitPeopleRowsHtml(id, label, depth + 1)) : '') + '</div>'
                    + '</div>';
            }).join('');
        }
        /* Đang gõ tìm -> trả danh sách PHẲNG các đơn vị khớp kèm đường dẫn nhánh cha, cho thấy kết quả
           ngay thay vì bắt tự mở từng nhánh (giống qlnvUnitTreeSearchHtml bên khối Tạo nhiệm vụ). */
        function notifyUnitTreeSearchHtml(q) {
            var out = [];
            (function walk(nodes, path) {
                (nodes || []).forEach(function (n) {
                    var label = notifyUnitTreeLabel(n);
                    if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: notifyUnitTreeId(n), label: label, path: path.join(' › ') });
                    walk(notifyUnitTreeChildren(n), path.concat([label]));
                });
            })(__notifyUnitTreeData, []);
            if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
            var state = getNotifyUnitState();
            var extra = out.length > 200 ? out.length - 200 : 0;
            return out.slice(0, 200).map(function (u) {
                var active = String(state.selectedId) === u.id;
                return '<div class="qlnv-tree-row" style="grid-template-columns:minmax(0,1fr)"><button type="button" class="qlnv-tree-name' + (active ? ' on' : '') + '" data-notify-tree-pick="' + esc(u.id) + '" data-notify-tree-label="' + esc(u.label) + '"><span>' + esc(u.label) + '</span>' + (u.path ? '<small style="display:block;opacity:.65;font-weight:400;white-space:normal">' + esc(u.path) + '</small>' : '') + '</button></div>';
            }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
        }
        function notifyRenderUnitTree() {
            var listEl = document.getElementById('notifyUnitList');
            if (!listEl) return;
            if (!__notifyUnitTreeData.length) {
                listEl.innerHTML = __notifyUnitTreeLoading
                    ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị...</div>'
                    : '<div style="padding:14px 6px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị.</div>';
                return;
            }
            var q = normalizeCrmText(getNotifyUnitState().query);
            listEl.innerHTML = q ? notifyUnitTreeSearchHtml(q) : notifyUnitTreeRowsHtml(__notifyUnitTreeData, 0);
        }
        /* Click ▸ (mở/thu nhánh) hoặc click tên đơn vị (chọn) — bắt bằng ỦY QUYỀN trên khung danh sách
           thay vì gắn onclick cho từng dòng, vì cây bị vẽ lại liên tục khi mở/thu nhánh. */
        function notifyHandleUnitTreeClick(e) {
            var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-notify-tree-toggle]') : null;
            if (toggleBtn) {
                var tid = toggleBtn.getAttribute('data-notify-tree-toggle');
                if (tid) {
                    __notifyUnitTreeOpen[tid] = !__notifyUnitTreeOpen[tid];
                    // Mở NHÁNH CUỐI lần đầu -> tải LƯỜI danh sách người. Node còn đơn vị con thì KHÔNG tải.
                    var node = notifyFindUnitNode(tid);
                    var isLeaf = node && !notifyUnitTreeChildren(node).length;
                    if (isLeaf && __notifyUnitTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
                        var pp = qlnvLoadUnitPeople(tid);
                        if (pp) pp.then(function () { if (__notifyUnitTreeOpen[tid]) notifyRenderUnitTree(); });
                    }
                    notifyRenderUnitTree();
                }
                return;
            }
            var personBtn = e.target && e.target.closest ? e.target.closest('[data-notify-tree-pick-person]') : null;
            if (personBtn) {
                notifyPickPerson(
                    personBtn.getAttribute('data-notify-tree-pick-person'),
                    personBtn.getAttribute('data-notify-person-name'),
                    personBtn.getAttribute('data-notify-person-unit'),
                    personBtn.getAttribute('data-notify-person-unitlabel')
                );
                return;
            }
            var pickBtn = e.target && e.target.closest ? e.target.closest('[data-notify-tree-pick]') : null;
            if (pickBtn) notifySelectUnit(pickBtn.getAttribute('data-notify-tree-pick'), pickBtn.getAttribute('data-notify-tree-label'));
        }
        /* Cơ chế mở/đóng THỦ CÔNG (set style.display trực tiếp + kèm classList 'hidden') — quay lại đúng
           cách cũ thay vì chỉ dựa vào class "open" của CSS: bộ chọn document.click ở ngoài IIFE này
           (xem forEach ".ms-wrap" phía trên hàm renderComboList) cứ mỗi lần bấm ra ngoài 1 .ms-wrap bất kỳ
           là gắn "hidden" cho MỌI .ms-dropdown bên trong — kể cả 2 dropdown notify* này. Nếu chỉ dùng class
           "open" thì lần mở SAU sẽ bị đè bởi ".hidden{display:none!important}" (còn sót từ lần bấm ra ngoài
           trước đó, không có gì gỡ lại) dù đã add "open", khiến dropdown kẹt luôn không mở lại được. Cách cũ
           luôn classList.remove('hidden') + set style.display trực tiếp mỗi lần mở nên không bị kẹt. */
        function notifyToggleUnitDropdown() {
            var dropdown = document.getElementById('notifyUnitDropdown');
            if (!dropdown) return;
            var wasOpen = !dropdown.classList.contains('hidden');
            document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) { d.classList.add('hidden'); d.style.display = 'none'; } });
            if (wasOpen) { dropdown.classList.add('hidden'); dropdown.style.display = 'none'; return; }
            dropdown.classList.remove('hidden');
            dropdown.style.display = 'block';
            var unitTriggerRef = document.getElementById('notifyUnitTrigger');
            if (unitTriggerRef) { dropdown.style.width = unitTriggerRef.getBoundingClientRect().width + 'px'; dropdown.style.right = 'auto'; }
            __notifyUnitTreeOpen = {}; // mở lại -> mọi nhánh gốc thu gọn, tránh cây "đàn" cả loạt
            notifyRenderUnitTree();
            if (!__notifyUnitTreeData.length && !__notifyUnitTreeLoading) {
                notifyLoadUnitTree().then(function () {
                    if (!dropdown.classList.contains('hidden')) notifyRenderUnitTree();
                });
            }
            var search = document.getElementById('notifyUnitSearch');
            // preventScroll: true — nếu không, trình duyệt tự cuộn .modal-body để đưa ô tìm kiếm vào tầm
            // nhìn khi focus(), gây cảm giác "xô cả modal" ngay lúc vừa mở dropdown.
            if (search) { search.value = ''; setTimeout(function () { search.focus({ preventScroll: true }); }, 0); }
        }
        /* Trước đây "Đơn vị phối hợp" mở qua onclick="toggleUnitDropdown_noti('notifyCoordDropdown_noti')" khai báo
           thẳng trong HTML — đây là hàm DÙNG CHUNG ở phạm vi global (không có tiền tố notify), đúng cái nhóm tên mà
           comment ở đầu file này đã cảnh báo là dễ bị khối CMS khác nạp sau đè mất. Thêm nữa, onclick="..." dạng
           chuỗi LUÔN tra cứu tên hàm qua global/window tại thời điểm click, bất kể hàm đó khai báo trong IIFE nào —
           nên vẫn có thể bị đè dù toàn bộ file này đã bọc IIFE. Chuyển sang notifyToggleCoordDropdown (scope cục bộ,
           gắn qua addEventListener với tham chiếu hàm trực tiếp — xem dưới) để giống hệt notifyToggleUnitDropdown ở trên. */
        function notifyToggleCoordDropdown() {
            var dropdown = document.getElementById('notifyCoordDropdown_noti');
            if (!dropdown) return;
            var wasOpen = !dropdown.classList.contains('hidden');
            document.querySelectorAll('.ms-dropdown').forEach(function (d) { if (d !== dropdown) { d.classList.add('hidden'); d.style.display = 'none'; } });
            if (wasOpen) { dropdown.classList.add('hidden'); dropdown.style.display = 'none'; return; }
            dropdown.classList.remove('hidden');
            dropdown.style.display = 'block';
            var coordTriggerRef = document.getElementById('notifyCoordTrigger');
            if (coordTriggerRef) { dropdown.style.width = coordTriggerRef.getBoundingClientRect().width + 'px'; dropdown.style.right = 'auto'; }
            notifyOpenCoordTree();
        }
        function notifyFilterUnitOptions() {
            var input = document.getElementById('notifyUnitSearch');
            getNotifyUnitState().query = input ? input.value : '';
            notifyRenderUnitTree();
        }
        /* Nhãn ô "đơn vị nhận nhiệm vụ": đang chọn NGƯỜI cho ô này -> hiện tên người (kèm đơn vị) thay
           vì tên đơn vị, giống block_nv/nv.js qlnvSyncLeadUnitLabel. */
        function notifySyncUnitTriggerLabel() {
            var triggerText = document.getElementById('notifyUnitTriggerText');
            if (!triggerText) return;
            if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit') {
                var pl = '👤 ' + __qlnvPickedPerson.name + (__qlnvPickedPerson.unitLabel ? ' · ' + __qlnvPickedPerson.unitLabel : '');
                triggerText.textContent = pl;
                triggerText.classList.remove('ms-placeholder');
                return;
            }
            var state = getNotifyUnitState();
            triggerText.textContent = state.selectedLabel || 'Chọn đơn vị nhận nhiệm vụ';
            triggerText.classList.toggle('ms-placeholder', !state.selectedLabel);
        }
        function notifySelectUnit(unitId, label) {
            // Chọn ĐƠN VỊ -> bỏ người đã chọn trước đó của ô này (nếu có).
            if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit') __qlnvPickedPerson = null;
            var state = getNotifyUnitState();
            state.selectedId = unitId || '';
            state.selectedLabel = label || '';
            notifySyncUnitHiddenInput();
            notifySyncUnitTriggerLabel();
            var dropdown = document.getElementById('notifyUnitDropdown');
            if (dropdown) dropdown.classList.add('hidden');
            notifyRenderUnitTree();
            notifyRenderCoordOptions();
        }
        /* Chọn 1 NGƯỜI: vẫn giữ ĐƠN VỊ trong state (donViChuTri gửi đơn vị của người đó); người lưu ở
           __qlnvPickedPerson -> ghép vào payload qua QLNV_RECEIVER_FIELD lúc submit. */
        function notifyPickPerson(personId, personName, unitId, unitLabel) {
            var state = getNotifyUnitState();
            state.selectedId = unitId || '';
            state.selectedLabel = unitLabel || '';
            notifySyncUnitHiddenInput();
            __qlnvPickedPerson = { selectId: 'notifyUnit', id: personId, name: personName || '', unitId: unitId || '', unitLabel: unitLabel || '' };
            notifySyncUnitTriggerLabel();
            var dropdown = document.getElementById('notifyUnitDropdown');
            if (dropdown) dropdown.classList.add('hidden');
            notifyRenderUnitTree();
            notifyRenderCoordOptions();
        }
        /* Cây phối hợp dùng RIÊNG __notifyCoordTreeData (đơn vị NGANG CẤP với đơn vị đăng nhập — port
           qlnvOrgCoordRoots/assCoordRoots của tongquan.js), khác gốc với __notifyUnitTreeData (CẤP DƯỚI,
           dùng cho "đơn vị nhận") — 2 danh sách nạp cùng lúc trong notifyLoadUnitTree(). Cùng cơ chế ▸
           mở/thu nhánh, chỉ khác mỗi dòng là checkbox (chọn NHIỀU) thay vì nút chọn 1, và khoá (disable)
           đúng đơn vị đang là chủ trì để 1 đơn vị không vừa chủ trì vừa phối hợp. */
        var __notifyCoordTreeOpen = {};
        function getNotifyCoordUiState() {
            if (!window.__notifyCoordUiState) window.__notifyCoordUiState = { query: '' };
            return window.__notifyCoordUiState;
        }
        /* Danh sách NGƯỜI của 1 đơn vị (nhánh cuối) trong cây phối hợp — port từ assLoadUnitPeople
           (tongquan.js:3716-3725, checkbox .assCoordPerson): đơn vị phối hợp lưu theo ĐƠN VỊ (donViThucHien
           là mảng id đơn vị), bấm 1 người = tick đơn vị của người đó, nhãn hiện rõ tên người vừa chọn. */
        function notifyCoordPeopleRowsHtml(unitId, depth) {
            var pe = __qlnvUnitPeople[unitId];
            var pad = depth * 14;
            if (pe === 'loading' || pe === undefined) return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span><span class="qlnv-tree-name" style="cursor:default;opacity:.7"><span>Đang tải người…</span></span></div>';
            if (!Array.isArray(pe) || !pe.length) return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span><span class="qlnv-tree-name" style="cursor:default;opacity:.7"><span>— Không có người trong đơn vị —</span></span></div>';
            var ownerId = getNotifyUnitState().selectedId;
            var disabled = !!ownerId && String(ownerId) === String(unitId);
            var checked = getNotifyCoordState().selectedIds.indexOf(unitId) !== -1;
            var unitNode = notifyFindUnitNode(unitId);
            var unitLabel = unitNode ? notifyUnitTreeLabel(unitNode) : unitId;
            return pe.map(function (p) {
                var personLabel = (p.name || '(không tên)') + ' · ' + unitLabel;
                return '<div class="qlnv-tree-row" style="padding-left:' + pad + 'px"><span class="qlnv-tree-arrow"></span><label class="qlnv-tree-name' + (checked ? ' on' : '') + '"' + (disabled ? ' style="cursor:default;opacity:.45"' : '') + '>'
                    + '<input type="checkbox" data-notify-coord-tree-check="' + esc(unitId) + '" data-canbo-id="' + esc(p.id || '') + '" data-label="' + esc(personLabel) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' /><span class="qlnv-box"></span>'
                    + '<span>👤 ' + esc(p.name || '(không tên)') + (p.position ? ' <small style="opacity:.7">· ' + esc(p.position) + '</small>' : '') + '</span></label></div>';
            }).join('');
        }
        function notifyCoordTreeRowsHtml(nodes, depth) {
            var ownerId = getNotifyUnitState().selectedId;
            var coordState = getNotifyCoordState();
            return (nodes || []).map(function (n) {
                var id = notifyUnitTreeId(n);
                var kids = notifyUnitTreeChildren(n);
                var open = !!__notifyCoordTreeOpen[id];
                var label = notifyUnitTreeLabel(n);
                var checked = coordState.selectedIds.indexOf(id) !== -1;
                var disabled = !!ownerId && String(ownerId) === id;
                // MỌI đơn vị đều có mũi tên ▸ — khớp cây "đơn vị nhận": nhánh còn con thì xổ đơn vị con,
                // nhánh cuối thì xổ danh sách người (bấm chọn được, xem notifyCoordPeopleRowsHtml).
                return '<div class="ass-node" data-key="' + esc(normalizeCrmText(label)) + '">'
                    + '<div class="qlnv-tree-row" style="padding-left:' + (depth * 14) + 'px">'
                    + '<button type="button" class="qlnv-tree-arrow" data-notify-coord-tree-toggle="' + esc(id) + '" title="Mở rộng">' + (open ? '▾' : '▸') + '</button>'
                    + '<label class="qlnv-tree-name' + (checked ? ' on' : '') + '"' + (disabled ? ' style="cursor:default;opacity:.45"' : '') + '>'
                    + '<input type="checkbox" data-notify-coord-tree-check="' + esc(id) + '" data-label="' + esc(label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' /><span class="qlnv-box"></span>'
                    + '<span>' + esc(label) + '</span></label></div>'
                    + '<div class="ass-kids qlnv-tree-children" style="display:' + (open ? 'block' : 'none') + '">' + (open ? (kids.length ? notifyCoordTreeRowsHtml(kids, depth + 1) : notifyCoordPeopleRowsHtml(id, depth + 1)) : '') + '</div>'
                    + '</div>';
            }).join('');
        }
        function notifyCoordTreeSearchHtml(q) {
            var ownerId = getNotifyUnitState().selectedId;
            var coordState = getNotifyCoordState();
            var out = [];
            (function walk(nodes, path) {
                (nodes || []).forEach(function (n) {
                    var label = notifyUnitTreeLabel(n);
                    if (normalizeCrmText(label).indexOf(q) >= 0) out.push({ id: notifyUnitTreeId(n), label: label, path: path.join(' › ') });
                    walk(notifyUnitTreeChildren(n), path.concat([label]));
                });
            })(__notifyCoordTreeData, []);
            if (!out.length) return '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Không tìm thấy đơn vị phù hợp.</div>';
            var extra = out.length > 200 ? out.length - 200 : 0;
            return out.slice(0, 200).map(function (u) {
                var checked = coordState.selectedIds.indexOf(u.id) !== -1;
                var disabled = !!ownerId && String(ownerId) === u.id;
                return '<div class="qlnv-tree-row" style="grid-template-columns:minmax(0,1fr)"><label class="qlnv-tree-name' + (checked ? ' on' : '') + '"' + (disabled ? ' style="cursor:default;opacity:.45"' : '') + '><input type="checkbox" data-notify-coord-tree-check="' + esc(u.id) + '" data-label="' + esc(u.label) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + ' /><span class="qlnv-box"></span><span>' + esc(u.label) + '</span>' + (u.path ? '<small style="display:block;opacity:.65;font-weight:400;white-space:normal">' + esc(u.path) + '</small>' : '') + '</label></div>';
            }).join('') + (extra ? '<div style="padding:8px 6px;color:#8ab0c8;font-size:11.5px">… còn ' + extra + ' đơn vị khớp, gõ thêm để thu hẹp.</div>' : '');
        }
        function notifyRenderCoordOptions() {
            var box = document.getElementById('notifyCoordBox_noti');
            if (!box) return;
            if (!__notifyCoordTreeData.length) {
                box.innerHTML = __notifyUnitTreeLoading
                    ? '<div style="padding:14px 6px;color:#8ab0c8;font-size:12.5px">Đang tải đơn vị phối hợp...</div>'
                    : '<div style="padding:14px 6px;color:#ff9a9a;font-size:12.5px">Không tải được danh sách đơn vị.</div>';
                notifyRenderCoordChips();
                return;
            }
            var q = normalizeCrmText(getNotifyCoordUiState().query);
            box.innerHTML = q ? notifyCoordTreeSearchHtml(q) : notifyCoordTreeRowsHtml(__notifyCoordTreeData, 0);
            notifyRenderCoordChips();
        }
        /* Click ▸ (mở/thu nhánh) hoặc tick checkbox — bắt bằng ỦY QUYỀN trên khung box (gắn 1 lần lúc dựng
           form, xem openNotifyForm) vì cây bị vẽ lại liên tục khi mở/thu nhánh/tick. */
        function notifyHandleCoordTreeClick(e) {
            var toggleBtn = e.target && e.target.closest ? e.target.closest('[data-notify-coord-tree-toggle]') : null;
            if (!toggleBtn) return;
            var tid = toggleBtn.getAttribute('data-notify-coord-tree-toggle');
            if (!tid) return;
            __notifyCoordTreeOpen[tid] = !__notifyCoordTreeOpen[tid];
            var node = notifyFindUnitNode(tid);
            var isLeaf = node && !notifyUnitTreeChildren(node).length;
            if (isLeaf && __notifyCoordTreeOpen[tid] && __qlnvUnitPeople[tid] === undefined) {
                var pp = qlnvLoadUnitPeople(tid);
                if (pp) pp.then(function () { if (__notifyCoordTreeOpen[tid]) notifyRenderCoordOptions(); });
            }
            notifyRenderCoordOptions();
        }
        /* Tick/bỏ tick 1 checkbox phối hợp -> cập nhật thẳng vào mảng id trong window.__notifyCoordState. */
        function notifyHandleCoordTreeChange(e) {
            var cb = e.target;
            if (!cb || !cb.hasAttribute || !cb.hasAttribute('data-notify-coord-tree-check')) return;
            var id = cb.getAttribute('data-notify-coord-tree-check');
            var state = getNotifyCoordState();
            /* Ô CÁN BỘ: gửi canboId qua canBoThucHien, không nhồi đơn vị của họ vào donViThucHien
               (canboId và iddv trùng dải số -> BE 400 hoặc lưu sai vai). */
            var canboId = cb.getAttribute && cb.getAttribute('data-canbo-id');
            if (canboId) {
                var n = Number(canboId), si = state.staffIds.indexOf(n);
                if (cb.checked) { if (!isNaN(n) && si === -1) state.staffIds.push(n); }
                else if (si !== -1) state.staffIds.splice(si, 1);
                var lbp = cb.closest ? cb.closest('.qlnv-tree-name') : null;
                if (lbp) lbp.classList.toggle('on', cb.checked);
                notifyRenderCoordChips();
                return;
            }
            var idx = state.selectedIds.indexOf(id);
            if (cb.checked) {
                if (idx === -1) { state.selectedIds.push(id); state.selectedLabels[id] = cb.getAttribute('data-label') || id; }
            } else if (idx !== -1) {
                state.selectedIds.splice(idx, 1);
            }
            var lb = cb.closest ? cb.closest('.qlnv-tree-name') : null;
            if (lb) lb.classList.toggle('on', cb.checked);
            notifyRenderCoordChips();
        }
        /* Hiển thị đơn vị phối hợp đã tick dưới dạng chip/tag riêng từng cái (thay vì text nối dấu phẩy) —
           mỗi chip có nút x để bỏ chọn ngay tại chỗ. Render thẳng từ mảng state, không đọc lại DOM checkbox. */
        function notifyRenderCoordChips() {
            var textEl = document.getElementById('notifyCoordTriggerText');
            if (!textEl) return;
            var state = getNotifyCoordState();
            if (!state.selectedIds.length) {
                textEl.textContent = 'Chọn đơn vị phối hợp';
                textEl.classList.add('ms-placeholder');
                return;
            }
            textEl.classList.remove('ms-placeholder');
            textEl.innerHTML = state.selectedIds.map(function (id) {
                var label = state.selectedLabels[id] || id;
                return '<span class="notify-coord-chip" style="display:inline-flex;align-items:center;gap:4px;background:rgba(44,125,210,.22);border:1px solid rgba(73,188,255,.35);border-radius:999px;padding:2px 6px 2px 8px;margin:2px 4px 2px 0;font-size:11.5px;color:#d0e8f8">'
                    + esc(label)
                    + '<span data-chip-remove="' + esc(id) + '" title="Bỏ chọn" style="cursor:pointer;color:#ff9a9a;font-weight:900;line-height:1">×</span></span>';
            }).join('');
        }
        /* Click vào nút x trên chip -> gỡ id khỏi mảng state, đồng bộ lại checkbox trên DOM nếu box đang render,
           rồi render lại chip. Dùng event delegation gắn 1 lần trên span (xem openNotifyForm) thay vì onclick
           inline theo tên hàm global, để không phụ thuộc window. */
        function notifyHandleChipRemoveClick(e) {
            var removeEl = e.target.closest ? e.target.closest('[data-chip-remove]') : null;
            if (!removeEl) return;
            e.stopPropagation();
            var value = removeEl.getAttribute('data-chip-remove');
            var state = getNotifyCoordState();
            var idx = state.selectedIds.indexOf(value);
            if (idx !== -1) state.selectedIds.splice(idx, 1);
            delete state.selectedLabels[value];
            var box = document.getElementById('notifyCoordBox_noti');
            if (box) {
                box.querySelectorAll('input[data-notify-coord-tree-check]').forEach(function (cb) {
                    if (cb.getAttribute('data-notify-coord-tree-check') === value) {
                        cb.checked = false;
                        var lb = cb.closest('.qlnv-tree-name');
                        if (lb) lb.classList.remove('on');
                    }
                });
            }
            notifyRenderCoordChips();
        }
        /* Mở dropdown "đơn vị/người phối hợp": reset nhánh mở rộng + ô tìm kiếm, vẽ ngay theo dữ liệu đã
           có (nếu có), rồi nạp cây (nếu chưa nạp — __notifyCoordTreeData nạp CÙNG LÚC với __notifyUnitTreeData
           trong notifyLoadUnitTree(), chỉ khác gốc hiển thị). */
        function notifyOpenCoordTree() {
            __notifyCoordTreeOpen = {};
            getNotifyCoordUiState().query = '';
            notifyRenderCoordOptions();
            if (!__notifyCoordTreeData.length && !__notifyUnitTreeLoading) {
                notifyLoadUnitTree().then(function () { notifyRenderCoordOptions(); });
            }
            var search = document.getElementById('notifyCoordSearch');
            if (search) { search.value = ''; setTimeout(function () { search.focus({ preventScroll: true }); }, 0); }
        }
        function notifyFilterCoordOptions() {
            var input = document.getElementById('notifyCoordSearch');
            getNotifyCoordUiState().query = input ? input.value : '';
            notifyRenderCoordOptions();
        }

        /* "Nhóm lĩnh vực" lấy option từ CRM S3103 (crmStatusCache, xem loadCrmStatusMapping) thay vì text tĩnh —
           value của <option> là item.value/item.code (chính là code CRM dùng làm field "nhiemVu" của nhiệm vụ,
           vd "20"/"21" theo docs/api_van_ban.md), KHÔNG phải nhãn hiển thị. createNotifyAssignment() đọc thẳng
           select.value này để gán vào body.nhiemVu, không qua bước dò text như findCrmConfigItem. */
        function notifyRenderFieldOptions() {
            var selectEl = document.getElementById('notiType');
            if (!selectEl) return;
            var items = getCrmConfigItems('S3103');
            var selected = selectEl.value;
            if (!items.length) {
                selectEl.innerHTML = '<option value="">Đang tải nhóm lĩnh vực...</option>';
                return;
            }
            selectEl.innerHTML = items.map(function (item) {
                var value = (item && (item.value || item.code)) || '';
                var label = (item && (item.name || item.title)) || value;
                return '<option value="' + esc(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + esc(label) + '</option>';
            }).join('');
        }

        /* Kịch bản xử lý (tuỳ chọn) cho form Nhập notify — port từ assScenarioBoxHtml/assOpenScenarioPicker/
           assPickScenario/assCreateScenarioSubtasks của tongquan.js, viết bản CỤC BỘ (không gọi thẳng hàm
           global của tongquan.js) vì 2 block có thể không cùng nạp trên 1 trang. Dùng chung scenarioTemplates()
           (đã có sẵn trong file, hợp nhất DEFAULT_SCENARIOS + kịch bản tuỳ biến) thay vì window.__scenarioTemplates
           của tongquan.js, và state riêng window.__notifyScenario để không đụng window.__assScenario. */
        function notifyScenarioBoxHtml() {
            var key = window.__notifyScenario || '';
            var s = key ? scenarioTemplates()[key] : null;
            if (s) {
                return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span class="badge ok">Đã chọn</span><b>' + esc(s.title) + '</b><button type="button" class="ghost" onclick="notifyOpenScenarioPicker()">Đổi kịch bản</button><button type="button" class="ghost danger-btn" onclick="notifyClearScenario()">Bỏ chọn</button></div>';
            }
            return '<button type="button" class="ghost" onclick="notifyOpenScenarioPicker()">⚡ Chọn kịch bản xử lý</button>';
        }
        function notifyClearScenario() {
            window.__notifyScenario = '';
            var box = document.getElementById('assScenarioSummary');
            if (box) box.innerHTML = notifyScenarioBoxHtml();
        }
        /* Chụp lại vài field KHÔNG có state riêng (title/code/notiType/importance/urgency/ngày/loại văn
           bản/mô tả) để khôi phục khi quay lại form sau khi chọn kịch bản — đơn vị nhận/phối hợp đã có
           window.__notifyUnitState/__notifyCoordState sống ngoài DOM nên không cần chụp riêng. */
        function notifyCaptureForm() {
            // notifyFormEl scope vào #modalBodyNotify — vài id ở đây (assTitle/assCode/assImportance/assUrgency/
            // assStart/assDue/assDesc) trùng với form Giao nhiệm vụ bên tongquan.js, không scope thì đọc nhầm
            // sang #modalBody của tongquan.js nếu block đó đã từng mở modal trong phiên (xem notifyFormRoot).
            function v(id) { var el = notifyFormEl(id); return el ? el.value : ''; }
            return { title: v('assTitle'), code: v('assCode'), notiType: v('notiType'), importance: v('assImportance'), urgency: v('assUrgency'), start: v('assStart'), due: v('assDue'), docType: v('assDocTypeInput'), desc: v('assDesc') };
        }
        function notifyApplyForm(state) {
            if (!state) return;
            function set(id, val) { var el = notifyFormEl(id); if (el && val) el.value = val; }
            set('assTitle', state.title); set('assCode', state.code); set('notiType', state.notiType);
            set('assImportance', state.importance); set('assUrgency', state.urgency);
            set('assStart', state.start); set('assDue', state.due);
            set('assDocTypeInput', state.docType); set('assDesc', state.desc);
            // Đơn/file đính kèm không nằm trong state field-value thường (sống ở window.__selectedDocs/
            // __assignmentFilesNoti, không bị reset khi quay lại form) — vẽ lại danh sách sau khi DOM bị ghi đè,
            // nếu không #assDocsList/#assFileList trống trơn dù dữ liệu vẫn còn khi submit.
            if (typeof renderSelectedDocsList === 'function') renderSelectedDocsList();
            if (typeof renderAssignmentFileListNoti === 'function') renderAssignmentFileListNoti();
        }
        function notifyOpenScenarioPicker() {
            /* CHỈ chụp lại form khi form còn trên DOM. Quay về đây từ màn "Thêm mới kịch bản"
               thì #modalBodyNotify đã là form kịch bản -> notifyCaptureForm() đọc ra toàn chuỗi
               rỗng và xóa sạch nội dung người dùng vừa nhập ở form Nhập notify. */
            if (notifyFormEl('assTitle')) window.__notifyFormDraft = notifyCaptureForm();
            var tpl = scenarioTemplates();
            document.getElementById('modalTitleNotify').textContent = 'Chọn kịch bản xử lý cho nhiệm vụ sắp giao';
            document.getElementById('modalSubNotify').textContent = 'Kịch bản sẽ gợi ý nội dung chỉ đạo và các mốc SLA';
            document.getElementById('modalBodyNotify').innerHTML = '<div class="scenario-template-toolbar"><button class="primary" onclick="openScenarioCreateForm(\'notify\',\'\')">＋ Thêm mới kịch bản</button><button class="ghost" onclick="notifyBackToForm()">← Quay lại tạo notify</button></div><div class="scenario-grid">' + Object.keys(tpl).map(function (k) {
                var s = tpl[k];
                return '<button class="scenario-card" onclick="notifyPickScenario(\'' + k + '\')"><div class="scenario-severity"><span class="badge ' + (s.level === 'Khẩn' ? 'red' : s.level === 'Cao' ? 'warn' : 'ok') + '">' + esc(s.level) + '</span><span class="badge" style="max-width:none;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3">📋 ' + (s.tasks || []).length + ' nhiệm vụ nhánh</span></div><h4>' + esc(s.title) + '</h4><p>' + esc(s.desc) + '</p><ul>' + (s.sla || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></button>';
            }).join('') + '</div>';
            openModal();
        }
        function notifyBackToForm() {
            openNotifyForm({ keepSelection: true, restore: window.__notifyFormDraft });
        }
        function notifyPickScenario(key) {
            window.__notifyScenario = key;
            notifyBackToForm();
        }
        /* Wrapper riêng cho nút "+ Chọn văn bản..." của modal Nhập notify — đặt cờ để closeDocPicker() (dùng
           chung với modal "Tạo nhiệm vụ") biết đường quay LẠI ĐÚNG modal notify thay vì mở nhầm openAssignmentForm. */
        function notifyOpenDocPicker() {
            window.__docPickerReturnToNotify = true;
            window.__notifyDraftBeforeDocPicker = notifyCaptureForm();
            openDocPicker();
        }
        function openNotifyForm(opts) {
            opts = opts || {};
            const roles = allowedRoles();
            if (!opts.keepSelection) {
                window.__notifyCoordState = { selectedIds: [], selectedLabels: {} };
                window.__notifyUnitState = { selectedId: '', selectedLabel: '', query: '' };
                window.__notifyScenario = '';
                if (__qlnvPickedPerson && __qlnvPickedPerson.selectId === 'notifyUnit') __qlnvPickedPerson = null;
            }
            document.getElementById('modalTitleNotify').textContent = 'Tạo notify IOC/CAD & giao nhiệm vụ';
            document.getElementById('modalSubNotify').textContent = 'Notify sự kiện phát sinh (điểm nghẽn, cháy nổ, TTHC, văn bản, lịch họp, đô thị/môi trường) — tạo xong sẽ gửi notify và giao nhiệm vụ xử lý xuống đơn vị nhận.';
            document.getElementById('modalBodyNotify').innerHTML = '';
            // Bố cục/CSS port 1:1 từ qlnvxOpenAssignmentForm (tongquan.js): .form2-row-3 gộp 3 ô/hàng,
            // .ms-wrap/.ms-trigger/.ms-dropdown thay cho style inline cũ (xem style mới trong qlnv_v2.css).
            // Giữ NGUYÊN id notify* đã tách riêng (notifyUnit*/notifyCoord*) — không đụng tới id/hàm dùng
            // chung (assUnit*/assCoord*) để không đụng độ với modal khác cùng nạp trên trang (xem comment
            // đầu IIFE "NOTIFY" phía dưới).
            document.getElementById('modalBodyNotify').innerHTML = `<div class="detail-card">
 <div class="card-head"><h4>Thông tin chung nhiệm vụ</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
 <div class="form2 compact widget-body">
 <div class="field wide"><label>Tiêu đề notify</label><input id="assTitle" value="" placeholder="Nhập tiêu đề notify"></div>
 <input type="hidden" id="assRole" value="">
 <div class="form2-row-3">
 <div class="field"><label>Người giao (danh nghĩa)</label><select id="assGiver"><option value="unit">🏢 ${esc(qlnvCurrentUnitLabel() || 'Đơn vị của tôi')}</option><option value="person">👤 ${esc(qlnvCurrentUserName() || 'Cá nhân tôi')}</option></select></div>
 <div class="field"><label>Mã nhiệm vụ</label><input id="assCode" value="${generateTaskCode()}"></div>
 <div class="field"><label>Đơn vị nhận nhiệm vụ</label>
 <div class="ms-wrap">
 <input type="hidden" id="notifyUnit" value="">
 <div class="ms-trigger" id="notifyUnitTrigger"><span id="notifyUnitTriggerText" class="ms-placeholder">Chọn đơn vị nhận nhiệm vụ</span>${notifyChevronHtml()}</div>
 <div id="notifyUnitDropdown" class="ms-dropdown hidden">
 <div class="ms-dropdown-title">Chọn đơn vị nhận nhiệm vụ</div>
 <div class="ms-dropdown-sub">Cây cơ cấu tổ chức — tick để chọn 01 đơn vị hoặc người, bấm ▸ để mở rộng</div>
 <input type="text" id="notifyUnitSearch" placeholder="Tìm đơn vị..." autocomplete="off">
 <div id="notifyUnitList">Đang tải cơ cấu tổ chức...</div>
 </div>
 </div>
 </div>
 </div>
 <div class="field wide"><label>Đơn vị/người phối hợp</label>
 <div class="ms-wrap">
 <div class="ms-trigger" id="notifyCoordTrigger"><span id="notifyCoordTriggerText" class="ms-placeholder">Chọn đơn vị phối hợp</span>${notifyChevronHtml()}</div>
 <div id="notifyCoordDropdown_noti" class="ms-dropdown hidden">
 <div class="ms-dropdown-title">Chọn đơn vị/người phối hợp</div>
 <div class="ms-dropdown-sub">Đơn vị ngang cấp (cùng cha với đơn vị của bạn) — tick để chọn nhiều đơn vị, bấm ▸ để mở rộng</div>
 <input type="text" id="notifyCoordSearch" placeholder="Tìm đơn vị...">
 <div id="notifyCoordBox_noti">Đang tải đơn vị phối hợp...</div>
 </div>
 </div>
 </div>
 <div class="form2-row-3">
 <div class="field"><label>Nhóm lĩnh vực</label><select id="notiType"><option value="">Đang tải nhóm lĩnh vực...</option></select></div>
 <div class="field"><label>Mức độ quan trọng</label><select id="assImportance"><option>Cao</option><option selected="">Bình thường</option></select></div>
 <div class="field"><label>Độ khẩn</label><select id="assUrgency"><option>Khẩn cấp</option><option>Gấp</option><option selected="">Thường</option></select></div>
 </div>
 <div class="form2-row-3">
 <div class="field"><label>Ngày bắt đầu</label><input id="assStart" type="date" value=""></div>
 <div class="field"><label>Hạn xử lý</label><input id="assDue" type="date" value=""></div>
 <div class="field"></div>
 </div>
 <div class="field wide"><label>Kịch bản xử lý (tuỳ chọn)</label><div id="assScenarioSummary">${notifyScenarioBoxHtml()}</div></div>
 </div>
 </div>
 <div class="detail-card">
 <div class="card-head"><h4>Thông tin văn bản</h4><button type="button" class="mini-btn" onclick="toggleWidgetBody(this)" title="Thu gọn/mở rộng">−</button></div>
 <div class="form2 compact widget-body">
 <div class="field"><label>Loại văn bản</label><div class="ms-wrap" style="display:flex;gap:6px;align-items:center"><div style="flex:1;position:relative"><input type="text" id="assDocTypeInput" placeholder="Tìm kiếm" autocomplete="off" value="" oninput="filterAssDocType()" onfocus="openAssDocTypeDropdown()" style="width:100%;border:1px solid rgba(87,178,255,.32);background:#061528;border-radius:10px;padding:9px 30px 9px 12px;outline:0;color:#d0e8f8"><span style="position:absolute;top:4px;right:12px;color:#49bcff;pointer-events:none">⌄</span><div id="assDocTypeDropdown" class="ms-dropdown hidden" style="position:absolute;z-index:60;top:calc(100% + 4px);left:0;right:0;background:#071b31;border:1px solid rgba(73,188,255,.4);border-radius:10px;padding:6px;max-height:220px;overflow-y:auto;box-shadow:0 14px 30px rgba(0,0,0,.45)"></div></div>
 </div></div>
 <div class="field wide"><label>Chọn văn bản (liên kết hệ thống quản lý văn bản)</label><div id="assDocsList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px"></div><button type="button" onclick="notifyOpenDocPicker()" style="border:1px dashed rgba(73,188,255,.45);background:rgba(44,125,210,.08);color:#49bcff;border-radius:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:700">+ Chọn văn bản từ hệ thống quản lý văn bản</button></div>
 <div class="field wide"><label>Khuyến nghị xử lý</label><textarea id="assDesc" rows="2">Đề nghị đơn vị chủ trì kiểm tra, cập nhật kết quả và đính kèm minh chứng trên IOC/CAD.</textarea></div>
 <div class="field wide"><label>Đính kèm file</label><input id="assFileInputNoti" type="file" multiple="" onchange="handleAssignmentFilesNoti(this)"><div id="assFileListNoti" style="margin-top:5px;font-size:11.5px;color:#8ab0c8">Chưa có file đính kèm.</div></div>
 </div>
 </div>
 <div class="action-bar"><button class="primary" onclick="createNotifyAssignment()"> Tạo notify &amp; giao nhiệm vụ</button><button class="ghost" onclick="saveAssignmentDraft()">Lưu nháp</button><button class="ghost" onclick="closeModalNoti()">Hủy</button></div>`;
            /* Gắn sự kiện bằng addEventListener với tham chiếu hàm trực tiếp — KHÔNG dùng onclick="tenHam()" dạng
               chuỗi, vì trang CMS nhúng chung nhiều khối, mỗi khối tự nạp 1 script riêng nhưng có thể khai báo hàm
               trùng tên ở phạm vi global (đã xác nhận thực tế: 1 khối khác định nghĩa lại notifyToggleCoordDropdown,
               nạp sau nên thắng, khiến onclick="notifyToggleCoordDropdown()" gọi nhầm bản của khối kia). Gắn thẳng
               tham chiếu hàm tại đây thì không bao giờ bị tra cứu lại theo tên nên miễn nhiễm với xung đột đó. */
            var notifyUnitTriggerEl = document.getElementById('notifyUnitTrigger');
            if (notifyUnitTriggerEl) notifyUnitTriggerEl.addEventListener('click', notifyToggleUnitDropdown);
            var notifyCoordTriggerEl = document.getElementById('notifyCoordTrigger');
            if (notifyCoordTriggerEl) notifyCoordTriggerEl.addEventListener('click', notifyToggleCoordDropdown);
            var notifyUnitListEl = document.getElementById('notifyUnitList');
            if (notifyUnitListEl) notifyUnitListEl.addEventListener('click', notifyHandleUnitTreeClick);
            var notifyUnitSearchEl = document.getElementById('notifyUnitSearch');
            if (notifyUnitSearchEl) notifyUnitSearchEl.addEventListener('input', notifyFilterUnitOptions);
            var notifyCoordSearchEl = document.getElementById('notifyCoordSearch');
            if (notifyCoordSearchEl) notifyCoordSearchEl.addEventListener('input', notifyFilterCoordOptions);
            var notifyCoordTriggerTextEl = document.getElementById('notifyCoordTriggerText');
            if (notifyCoordTriggerTextEl) notifyCoordTriggerTextEl.addEventListener('click', notifyHandleChipRemoveClick);
            var notifyCoordBoxEl = document.getElementById('notifyCoordBox_noti');
            if (notifyCoordBoxEl) { notifyCoordBoxEl.addEventListener('click', notifyHandleCoordTreeClick); notifyCoordBoxEl.addEventListener('change', notifyHandleCoordTreeChange); }
            // Quay lại form sau khi chọn kịch bản (opts.restore) — khôi phục các field không có state riêng,
            // rồi vẽ lại nhãn đơn vị nhận/phối hợp từ __notifyUnitState/__notifyCoordState (state này sống
            // ngoài DOM nên không mất khi innerHTML bị ghi đè, chỉ cần sơn lại UI).
            if (opts.restore) notifyApplyForm(opts.restore);
            notifySyncUnitTriggerLabel();
            notifyRenderCoordChips();
            openModal();
            notifyRenderFieldOptions();
            loadCrmStatusMapping().then(function () {
                if (!document.getElementById('modal_notify').classList.contains('open')) return;
                notifyRenderFieldOptions();
                syncAssignmentOptionsFromCrmStatus();
                hydrateAssignmentFormFromCrmStatus();
            });
            notifyLoadUnitTree().then(function () {
                if (!document.getElementById('modal_notify').classList.contains('open')) return;
                // Thiếu dòng này thì ô "Đơn vị nhận nhiệm vụ" kẹt mãi ở "Đang tải đơn vị..." nếu người dùng bấm
                // mở dropdown TRƯỚC khi __notifyUnitTreeData tải xong: notifyToggleUnitDropdown() chỉ tự nạp lại
                // khi __notifyUnitTreeLoading còn false, nhưng ở đây nó đã bị đặt true ngay khi modal mở (xem
                // notifyLoadUnitTree) nên nhánh tự nạp lại đó không bao giờ chạy — phải tự vẽ lại ở đây khi data
                // đã có, giống hệt cách openAssignmentForm() gọi assRenderUnitTree() sau khi assLoadUnitTree() xong.
                notifyRenderUnitTree();
                notifyRenderCoordOptions();
            });
        }
        window.openNotifyForm = openNotifyForm;
        window.notifyOpenScenarioPicker = notifyOpenScenarioPicker;
        window.notifyOpenDocPicker = notifyOpenDocPicker;
        window.notifyPickScenario = notifyPickScenario;
        window.notifyBackToForm = notifyBackToForm;
        window.notifyClearScenario = notifyClearScenario;
        window.notifyGetUnitLabel = notifyGetUnitLabel;
        window.notifyRenderCoordOptions = notifyRenderCoordOptions;
        window.notifyOpenCoordTree = notifyOpenCoordTree;
    })();
    function saveNotify() {
        const role = document.getElementById('notiRole').value, metric = document.getElementById('notiMetric').value;
        const type = document.getElementById('notiType').value, level = document.getElementById('notiLevel').value;
        window.__manualNotis = window.__manualNotis || [];
        window.__manualNotis.push({ id: `manual-${Date.now()}`, role, type, level, title: document.getElementById('notiTitle').value.trim() || 'Notify mới', sub: document.getElementById('notiSub').value.trim() || 'Cần xử lý', metric, status: level === 'Khẩn' || level === 'Cao' ? 'risk' : 'soon', source: 'Nhập thủ công' });
        closeModalNoti(); renderNotifications(); toast('Đã nhập notify IOC/CAD và cập nhật danh sách.');
    }
    function openNotifySourceConfig() {
        document.getElementById('modalTitleNotify').textContent = 'Cấu hình nguồn Notify IOC/CAD';
        document.getElementById('modalSubNotify').textContent = '';
        document.getElementById('modalBodyNotify').innerHTML = `<div class="detail-card"><h4>Luồng tạo Notify</h4>${['Rule engine kiểm tra SLA nhiệm vụ/văn bản mỗi 1 phút', 'QLNV (van-ban-den) đồng bộ trực tiếp số văn bản đến sắp/quá hạn', 'Calendar thư ký sinh nhắc lịch sắp họp/trễ xác nhận', 'Cán bộ trực IOC nhập notify thủ công khi phát sinh tình huống'].map((s, i) => `<div class="scenario-task" style="grid-template-columns:30px 1fr auto"><i style="width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#12375f;font-style:normal;font-weight:900">${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? 'ok' : 'gold'}">${i < 2 ? 'Tự động' : 'Có thao tác'}</span></div>`).join('')}</div><div class="detail-card"><h4>Cấu hình demo</h4><table class="compact-table"><thead><tr><th>Nguồn</th><th>Tần suất</th><th>Điều kiện sinh notify</th><th>Người nhận</th></tr></thead><tbody><tr><td>Rule engine IOC</td><td>Realtime/1 phút</td><td>Sắp hạn, nguy cơ trễ, quá hạn</td><td>Lãnh đạo/đơn vị chủ trì</td></tr><tr><td>QLNV (van-ban-den)</td><td>Mỗi 5 phút</td><td>Có văn bản đến mới/sắp quá hạn</td><td>Trực IOC/CAD</td></tr><tr><td>Calendar thư ký</td><td>15 phút/lần</td><td>Lịch họp trong 24h hoặc trễ xác nhận</td><td>Thư ký + chủ trì</td></tr><tr><td>Nhập thủ công</td><td>Khi phát sinh</td><td>Cán bộ trực tạo thông báo</td><td>Theo trục được chọn</td></tr></tbody></table></div>`;
        openModal();
    }
    function openIncidentDetail(id) {
        const n = (window.__incidents || []).find(x => x.id === id); if (!n) return;
        window.__openIncidentId = id;
        const relatedRowsHtml = records.filter(r => canSeeRole(r.role) && r.role === n.role && r.metric === n.metric && r.status === n.status).slice(0, 8).map(r => `<tr onclick="openRecordFromIncident('${r.id}','${n.id}')"><td>${r.id}</td><td>${r.title}</td><td>${r.unit}</td><td>${statusMeta(r.status).short}</td></tr>`).join('') || '<tr><td colspan="4">Chưa có hồ sơ liên quan</td></tr>';
        document.getElementById('modalTitleNotify').textContent = `Notify IOC/CAD · ${n.type}`;
        document.getElementById('modalSubNotify').textContent = `${axisMeta[n.role].name} · mức ${n.level} · ${n.title}`;
        const isFire = n.id === 'fire-market';
        document.getElementById('modalBodyNotify').innerHTML = `<div class="manual-note"><b>Nguồn phát sinh notify:</b> ${n.source || 'Rule engine IOC'} · <b>Vị trí nhập/cấu hình:</b> mục Notify IOC/CAD → nút "Nhập notify" hoặc "Cấu hình nguồn notify".</div><div class="scenario-detail-grid"><div class="detail-card"><h4>Thông tin cảnh báo</h4><div class="kv"><b>Loại</b><span>${n.type}</span><b>Mức độ</b><span class="${n.level === 'Khẩn' ? 'danger' : 'warn'}">${n.level}</span><b>Đơn vị/trục</b><span>${axisMeta[n.role].icon} ${axisMeta[n.role].name}</span><b>Nội dung</b><span>${n.title}</span><b>Khuyến nghị</b><span>${n.sub}</span><b>SLA</b><span>${isFire ? '15 phút tiếp nhận · 30 phút xử lý bước đầu' : 'Trong ngày làm việc'}</span></div><div class="action-bar" style="margin-top:12px"><button class="primary" onclick="openAssignmentForm()">Giao xử lý</button><button class="ghost" onclick="openList({metric:'${n.metric}',role:'${n.role}',status:'${n.status}',title:'${n.title}'})">Mở hồ sơ liên quan</button><button class="ghost danger-btn" onclick="toast('Đã kích hoạt SOP ${n.type} và gửi notify tới đơn vị trực.')">Kích hoạt SOP</button></div></div><div class="detail-card"><h4>SOP xử lý đề xuất</h4>${['Tiếp nhận/cảnh báo IOC', 'Phân loại mức độ & địa bàn', 'Gán đơn vị chủ trì/phối hợp', 'Theo dõi SLA và cập nhật hiện trường', 'Kết thúc xử lý, báo cáo lãnh đạo'].map((s, i) => `<div class="sop-step" style="display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;border:1px solid rgba(87,178,255,.2);background:rgba(6,28,52,.68);border-radius:10px;padding:9px;margin-top:8px"><i style="width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#12375f;font-style:normal;font-weight:900">${i + 1}</i><span>${s}</span><span class="badge ${i < 2 ? 'ok' : 'gold'}">${i < 2 ? 'Tự động' : 'Thao tác'}</span></div>`).join('')}</div></div><div class="detail-card"><h4>Hồ sơ/nhiệm vụ liên quan</h4><table class="compact-table"><thead><tr><th>Mã</th><th>Nội dung</th><th>Đơn vị</th><th>Trạng thái</th></tr></thead><tbody>${relatedRowsHtml}</tbody></table></div>`;
        openModal();
    }
    function openRecordFromIncident(taskId, incidentId) {
        openRecordDetail(taskId);
        setTimeout(() => {
            const body = document.getElementById('modalBodyNotify');
            if (body && !body.querySelector('.iip-modal-back')) {
                body.insertAdjacentHTML('afterbegin', `<div class="iip-modal-back"><button class="ghost" onclick="openIncidentDetail('${incidentId}')">← Quay lại notify</button></div>`);
            }
        }, 0);
    }
    /* #cadToolbar giờ chỉ là 1 ô nhỏ trong hàng toolbar [Tìm kiếm | ＋ Tạo | phễu lọc] của widget Notify —
       .cad-toolbar (sticky) đã bọc ở khối cha trong index.html nên không add class vào đây nữa. Nút "Cấu hình
       nguồn" gỡ khỏi widget theo trang mẫu, hàm openNotifySourceConfig() vẫn giữ nguyên. */
    function renderCad() {
        const box = document.getElementById('cadToolbar'); if (!box) return;
        box.innerHTML = `<button class="ghost" onclick="openNotifyForm()" style="white-space:nowrap;padding:8px 14px;font-size:13px">＋ Tạo</button>`;
    }

    /* ============================== BẢN ĐỒ GIS (Leaflet) ============================== */
    const GC_CENTER = [21.0453, 105.8988], GC_ZOOM = 15;
    const gisTileUrls = {
        dark: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
        light: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
        satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'Tiles © Esri'],
        contrast: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap']
    };
    const gisStatusColor = { done: '#2fb174', doing: '#2c7dd2', soon: '#d8a50c', risk: '#d25a19', overdue: '#d33a44' };
    const gisStatusLabel = { done: 'Hoàn thành', doing: 'Đang xử lý', soon: 'Sắp đến hạn', risk: 'Nguy cơ trễ', overdue: 'Quá hạn' };
    const gisCongTrinhData = [
        { id: 'CT-001', name: 'Nâng cấp trụ sở UBND phường', lat: 21.0453, lng: 105.8982, loai: 'Công sở', status: 'doing', pct: 62, don_vi: 'Văn phòng UBND', han: '30/09/2026' },
        { id: 'CT-002', name: 'Cải tạo đường khu Giang Biên', lat: 21.0459, lng: 105.9052, loai: 'Giao thông', status: 'done', pct: 100, don_vi: 'Công chức Địa chính', han: '15/06/2026' },
        { id: 'CT-003', name: 'Xây dựng nhà văn hóa khu Phúc Đông', lat: 21.0504, lng: 105.9032, loai: 'Văn hóa', status: 'soon', pct: 45, don_vi: 'Công chức VH-XH', han: '10/07/2026' },
        { id: 'CT-004', name: 'Hệ thống thoát nước khu chợ', lat: 21.0426, lng: 105.8962, loai: 'Hạ tầng', status: 'risk', pct: 28, don_vi: 'Công chức Địa chính', han: '05/07/2026' },
        { id: 'CT-005', name: 'Sân thể thao đa năng trường TH', lat: 21.0484, lng: 105.8917, loai: 'Giáo dục', status: 'doing', pct: 70, don_vi: 'Trường học', han: '20/08/2026' },
        { id: 'CT-006', name: 'Dự án GPMB đường vành đai', lat: 21.0404, lng: 105.9042, loai: 'GPMB', status: 'overdue', pct: 18, don_vi: 'Công chức Địa chính', han: '01/06/2026' }
    ];
    const gisPhanAnhData = [
        { id: 'PA-001', name: 'Phản ánh ngập úng khu Giang Biên', lat: 21.0466, lng: 105.9002, loai: 'Môi trường', status: 'risk', ngay: '26/06/2026', nguoi: 'Nguyễn Văn A' },
        { id: 'PA-002', name: 'Lấn chiếm vỉa hè khu chợ Việt Hưng', lat: 21.0434, lng: 105.8965, loai: 'Đô thị', status: 'soon', ngay: '25/06/2026', nguoi: 'Trần Thị B' },
        { id: 'PA-003', name: 'Cột điện nghiêng nguy hiểm khu Phúc Đông', lat: 21.0519, lng: 105.9019, loai: 'Hạ tầng', status: 'risk', ngay: '27/06/2026', nguoi: 'Lê Văn C' },
        { id: 'PA-004', name: 'Chó thả rông cắn người khu Phúc Lợi', lat: 21.0376, lng: 105.8955, loai: 'Trật tự', status: 'done', ngay: '24/06/2026', nguoi: 'Phạm Thị D' },
        { id: 'PA-005', name: 'Ô nhiễm mương thoát nước khu Phúc Lợi', lat: 21.0394, lng: 105.8995, loai: 'Môi trường', status: 'overdue', ngay: '20/06/2026', nguoi: 'Hoàng Văn E' }
    ];
    const gisTruSoData = [
        { id: 'TS-001', name: 'Trụ sở UBND phường Việt Hưng (số 1 phố Vạn Hạnh)', lat: 21.0453, lng: 105.8982, chuc_nang: 'Trung tâm hành chính' },
        { id: 'TS-002', name: 'Trụ sở Đảng ủy phường', lat: 21.0455, lng: 105.8976, chuc_nang: 'Cơ quan Đảng' },
        { id: 'TS-003', name: 'Trụ sở HĐND & MTTQ', lat: 21.0449, lng: 105.8989, chuc_nang: 'Dân chủ & Mặt trận' },
        { id: 'TS-004', name: 'Công an phường', lat: 21.0447, lng: 105.8972, chuc_nang: 'An ninh trật tự' },
        { id: 'TS-005', name: 'Trạm Y tế phường', lat: 21.0439, lng: 105.8997, chuc_nang: 'Y tế cộng đồng' }
    ];
    /* Không còn vùng giám sát mẫu sẵn — layer "zones" chỉ chứa vùng do người dùng tự khoanh (gisStartDraw). */
    const gisZoneDefs = [];
    const GM = { map: null, base: 'dark', baseLayer: null, labelLayer: null, groups: {}, zoneLayer: null, markerRefs: new Map(), draw: { active: false, points: [], line: null }, userZones: [] };

    function gisMarkerIcon(color, emoji, size) {
        size = size || 30;
        return L.divIcon({ className: '', html: '<div class="gis-marker" style="color:' + color + ';background:' + color + '22;border:1.5px solid ' + color + '88;width:' + size + 'px;height:' + size + 'px"><span class="gis-marker-pulse" style="color:' + color + '"></span><span style="font-size:' + Math.round(size * 0.38) + 'px">' + emoji + '</span></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
    }
    function gisPctBarHtml(pct, col) { return '<div class="gis-pct-bar"><div class="gis-pct-bar-track"><span class="gis-pct-bar-fill" style="width:' + pct + '%;background:' + col + '"></span></div><small>' + pct + '% hoàn thành</small></div>'; }
    function gisBadgeHtml(col, label) { return '<span class="gis-pb" style="background:' + col + '22;color:' + col + ';border:1px solid ' + col + '55">' + label + '</span>'; }
    function gisTileLayer(theme) { const t = gisTileUrls[theme] || gisTileUrls.dark; const opt = { maxZoom: 20, maxNativeZoom: 19, attribution: t[1] }; if (t[0].indexOf('{s}') >= 0) opt.subdomains = 'abc'; return L.tileLayer(t[0], opt); }
    function gisSetTheme(theme) {
        if (!GM.map) return;
        if (GM.baseLayer) GM.map.removeLayer(GM.baseLayer);
        if (GM.labelLayer) { GM.map.removeLayer(GM.labelLayer); GM.labelLayer = null; }
        GM.base = theme; GM.baseLayer = gisTileLayer(theme).addTo(GM.map); { var __tp = GM.map.getPane('tilePane'); if (__tp) __tp.style.filter = theme === 'dark' ? 'invert(1) hue-rotate(180deg) brightness(.86) contrast(1.06) saturate(.62)' : theme === 'light' ? 'grayscale(.82) brightness(1.06) contrast(.9) saturate(.55)' : 'none'; }
        if (theme === 'satellite') GM.labelLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 20, maxNativeZoom: 19 }).addTo(GM.map);
        const lbl = { dark: 'Nền tối', light: 'Nền sáng', satellite: 'Ảnh vệ tinh', contrast: 'OpenStreetMap' };
        const ll = document.getElementById('gisLiveLabel'); if (ll) ll.textContent = 'GIS trực tuyến • ' + lbl[theme];
        const sel = document.getElementById('gisBaseSelect'); if (sel) sel.value = theme;
    }
    function createGisGroups() {
        ['congtrinh', 'phananh', 'truso', 'zones', 'heatmap'].forEach(k => { GM.groups[k] = L.layerGroup(); });
        gisCongTrinhData.forEach(ct => {
            const col = gisStatusColor[ct.status] || '#2c7dd2';
            const m = L.marker([ct.lat, ct.lng], { icon: gisMarkerIcon(col, '🏗', 36), riseOnHover: true, title: ct.name });
            m.bindPopup('<h4>🏗 ' + ct.name + '</h4><p><b>Loại:</b> ' + ct.loai + ' · <b>Đơn vị:</b> ' + ct.don_vi + '</p><p><b>Hạn:</b> ' + ct.han + '</p>' + gisPctBarHtml(ct.pct, col) + gisBadgeHtml(col, gisStatusLabel[ct.status]));
            m.addTo(GM.groups.congtrinh);
            GM.markerRefs.set(ct.id, m);
        });
        gisPhanAnhData.forEach(pa => {
            const col = gisStatusColor[pa.status] || '#d33a44';
            const m = L.marker([pa.lat, pa.lng], { icon: gisMarkerIcon(col, '⚠', 34), riseOnHover: true, title: pa.name });
            m.bindPopup('<h4>⚠ ' + pa.name + '</h4><p><b>Loại:</b> ' + pa.loai + ' · <b>Ngày:</b> ' + pa.ngay + '</p><p><b>Người phản ánh:</b> ' + pa.nguoi + '</p>' + gisBadgeHtml(col, gisStatusLabel[pa.status]));
            m.addTo(GM.groups.phananh);
            GM.markerRefs.set(pa.id, m);
        });
        gisTruSoData.forEach(ts => {
            const m = L.marker([ts.lat, ts.lng], { icon: gisMarkerIcon('#39d5ff', '🏢', 34), riseOnHover: true, title: ts.name });
            m.bindPopup('<h4>🏢 ' + ts.name + '</h4><p>' + ts.chuc_nang + '</p><p style="color:#39d5ff;font-size:9px">Trụ sở hành chính phường Việt Hưng</p>');
            m.addTo(GM.groups.truso);
            GM.markerRefs.set(ts.id, m);
        });
        if (window.L && L.heatLayer) {
            const heatPts = [];
            gisPhanAnhData.forEach(pa => { heatPts.push([pa.lat, pa.lng, pa.status === 'overdue' ? 1 : pa.status === 'risk' ? .7 : .4]); });
            gisCongTrinhData.filter(ct => ct.status === 'risk' || ct.status === 'overdue').forEach(ct => { heatPts.push([ct.lat, ct.lng, .8]); });
            GM.groups.heatmap = L.heatLayer(heatPts, { radius: 32, blur: 24, maxZoom: 17, gradient: { 0.2: '#2c7dd2', 0.5: '#d8a50c', 0.8: '#d25a19', 1: '#d33a44' } });
            const hc = document.getElementById('gisHeatCount'); if (hc) hc.textContent = String(heatPts.length).padStart(2, '0');
        }
        gisZoneDefs.forEach(z => {
            L.polygon(z.coords, { color: z.color, weight: 2, fillColor: z.color, fillOpacity: .1, dashArray: '5 4' })
                .bindTooltip(z.name, { permanent: true, direction: 'center', className: 'gis-zone-tooltip' })
                .addTo(GM.groups.zones);
        });
        ['congtrinh', 'phananh', 'truso', 'zones'].forEach(k => { GM.groups[k].addTo(GM.map); });
        updateGisZoneCount();
        updateGisStatus();
    }
    function updateGisZoneCount() { const zc = document.getElementById('gisZoneCount'); if (zc) zc.textContent = String(gisZoneDefs.length + GM.userZones.length).padStart(2, '0'); }
    function updateGisStatus() { const sb = document.getElementById('gisMapStatus'); if (sb) sb.innerHTML = gisCongTrinhData.length + ' công trình&nbsp;·&nbsp;' + gisPhanAnhData.length + ' phản ánh<br>' + gisTruSoData.length + ' trụ sở&nbsp;·&nbsp;' + (gisZoneDefs.length + GM.userZones.length) + ' vùng giám sát'; }
    function updateGisCoord() { if (!GM.map) return; const z = GM.map.getZoom(), c = GM.map.getCenter(); const el = document.getElementById('gisCoordinate'); if (el) el.textContent = c.lat.toFixed(4) + ', ' + c.lng.toFixed(4) + ' • Z' + Math.round(z); }
    function initGisMap() {
        if (!window.L) { if (window.toast) toast('Leaflet chưa tải – bản đồ GIS không khởi động được'); return; }
        const el = document.getElementById('gisMap'); if (!el) return;
        if (GM.map) { GM.map.invalidateSize(); return; }
        GM.map = L.map('gisMap', { center: GC_CENTER, zoom: GC_ZOOM, zoomControl: false, attributionControl: true, preferCanvas: true });
        gisSetTheme('dark');
        createGisGroups();
        L.control.zoom({ position: 'topright' }).addTo(GM.map);
        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(GM.map);
        GM.map.on('moveend zoomend', updateGisCoord);
        updateGisCoord();
        setupGisControls();
        setTimeout(() => { GM.map.invalidateSize(); }, 300);
        window._gisMap = GM.map;
    }
    function setupGisControls() {
        const sel = document.getElementById('gisBaseSelect');
        if (sel) sel.onchange = () => { gisSetTheme(sel.value); };
        document.querySelectorAll('[data-gis-layer]').forEach(inp => {
            inp.onchange = () => {
                const key = inp.dataset.gisLayer, on = inp.checked;
                if (!GM.map || !GM.groups[key]) return;
                if (on) GM.groups[key].addTo(GM.map); else GM.map.removeLayer(GM.groups[key]);
            };
        });
        const db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn'), cb = document.getElementById('gisClearBtn');
        if (db) db.onclick = gisStartDraw; if (fb) fb.onclick = gisFinishDraw; if (cb) cb.onclick = gisClearZone;
        const si = document.getElementById('gisMapSearch');
        if (si) { si.oninput = () => { renderGisSearch(si.value); }; si.onkeydown = e => { if (e.key === 'Enter') { const f = document.querySelector('#gisSearchSuggest button'); if (f) f.click(); } }; }
        document.addEventListener('click', e => { if (!e.target.closest('#gisMapSearch, #gisSearchSuggest')) { const s = document.getElementById('gisSearchSuggest'); if (s) s.style.display = 'none'; } });
    }
    function renderGisSearch(value) {
        const box = document.getElementById('gisSearchSuggest'); if (!box) return;
        const k = value.trim().toLowerCase();
        if (!k) { box.style.display = 'none'; return; }
        const results = [];
        gisCongTrinhData.forEach(ct => { if ((ct.name + ' ' + ct.loai).toLowerCase().includes(k)) results.push({ icon: '?', label: ct.name, sub: ct.loai + ' • ' + gisStatusLabel[ct.status], action: () => { const m = GM.markerRefs.get(ct.id); if (m) { GM.map.flyTo([ct.lat, ct.lng], 16, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
        gisPhanAnhData.forEach(pa => { if ((pa.name + ' ' + pa.loai).toLowerCase().includes(k)) results.push({ icon: '⚠', label: pa.name, sub: pa.loai + ' • ' + gisStatusLabel[pa.status], action: () => { const m = GM.markerRefs.get(pa.id); if (m) { GM.map.flyTo([pa.lat, pa.lng], 16, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
        gisTruSoData.forEach(ts => { if ((ts.name + ' ' + ts.chuc_nang).toLowerCase().includes(k)) results.push({ icon: '?', label: ts.name, sub: ts.chuc_nang, action: () => { const m = GM.markerRefs.get(ts.id); if (m) { GM.map.flyTo([ts.lat, ts.lng], 17, { duration: .65 }); setTimeout(() => { m.openPopup(); }, 700); } } }); });
        if (!results.length) { box.style.display = 'none'; return; }
        box.innerHTML = results.slice(0, 8).map((r, i) => '<button data-i="' + i + '">' + r.icon + ' <span>' + r.label + '<br><em style="font-size:8px;color:#7598b0">' + r.sub + '</em></span></button>').join('');
        box.style.display = 'block';
        box.querySelectorAll('button').forEach((btn, i) => { btn.onclick = () => { results[i].action(); box.style.display = 'none'; const si = document.getElementById('gisMapSearch'); if (si) si.value = ''; }; });
    }
    function gisStartDraw() {
        if (!GM.map || GM.draw.active) return;
        GM.draw.active = true; GM.draw.points = [];
        GM.map.dragging.disable(); GM.map.doubleClickZoom.disable();
        const h = document.getElementById('gisDrawHint'), db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn');
        if (h) h.style.display = 'block'; if (db) db.classList.add('active'); if (fb) fb.style.display = '';
        GM.map.on('click', gisDrawPoint); GM.map.once('dblclick', gisFinishDraw);
        if (window.toast) toast('Khoanh vùng GIS: click từng điểm trên bản đồ, nhấn Hoàn tất hoặc double-click để đóng vùng.');
    }
    function gisDrawPoint(e) {
        GM.draw.points.push(e.latlng);
        if (GM.draw.line) GM.map.removeLayer(GM.draw.line);
        GM.draw.line = L.polyline(GM.draw.points, { color: '#59caff', weight: 2, dashArray: '5 5' }).addTo(GM.map);
    }
    function gisFinishDraw() {
        if (!GM.draw.active) return;
        if (GM.draw.points.length < 3) { if (window.toast) toast('Cần tối thiểu 3 điểm để tạo vùng giám sát.'); gisStopDraw(); return; }
        const colors = ['#f0a923', '#ef4444', '#29d5ea', '#2fb174', '#a78bfa'];
        const col = colors[GM.userZones.length % colors.length];
        const coords = GM.draw.points.map(ll => [ll.lat, ll.lng]);
        const poly = L.polygon(coords, { color: col, weight: 2, fillColor: col, fillOpacity: .12 }).bindTooltip('Vùng GS-' + (GM.userZones.length + 1), { permanent: true, direction: 'center', className: 'gis-zone-tooltip' });
        poly.addTo(GM.groups.zones);
        GM.userZones.push(poly);
        gisStopDraw();
        updateGisZoneCount();
        updateGisStatus();
        if (window.toast) toast('Đã tạo vùng giám sát ' + GM.userZones.length + ' trên bản đồ GIS.');
    }
    function gisStopDraw() {
        GM.draw.active = false; GM.draw.points = [];
        if (GM.draw.line) { GM.map.removeLayer(GM.draw.line); GM.draw.line = null; }
        GM.map.dragging.enable(); GM.map.doubleClickZoom.enable();
        GM.map.off('click', gisDrawPoint);
        const h = document.getElementById('gisDrawHint'), db = document.getElementById('gisDrawBtn'), fb = document.getElementById('gisFinishBtn');
        if (h) h.style.display = 'none'; if (db) db.classList.remove('active'); if (fb) fb.style.display = 'none';
    }
    function gisClearZone() {
        if (GM.draw.active) { if (GM.draw.line) GM.map.removeLayer(GM.draw.line); gisStopDraw(); return; }
        const z = GM.userZones.pop();
        if (z) { GM.groups.zones.removeLayer(z); if (window.toast) toast('Đã xóa vùng giám sát vừa tạo.'); }
        else if (window.toast) toast('Chưa có vùng tự tạo để xóa.');
        updateGisZoneCount();
        updateGisStatus();
    }
    function gisResetView() { if (GM.map) GM.map.flyTo(GC_CENTER, GC_ZOOM, { duration: .7 }); }
    function gisFocusLayer(key) {
        if (!GM.map) return;
        const pts = [];
        if (key === 'congtrinh') { gisCongTrinhData.forEach(ct => { pts.push([ct.lat, ct.lng]); }); }
        else if (key === 'phananh') { gisPhanAnhData.forEach(pa => { pts.push([pa.lat, pa.lng]); }); }
        else if (key === 'truso') { gisTruSoData.forEach(ts => { pts.push([ts.lat, ts.lng]); }); }
        if (pts.length) GM.map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
        const inp = document.querySelector('[data-gis-layer="' + key + '"]');
        if (inp && !inp.checked) { inp.checked = true; if (GM.groups[key]) GM.groups[key].addTo(GM.map); }
    }
    function gisToggleFullscreen(btn) {
        const widget = document.querySelector('.gis-widget');
        if (!widget) return;
        const isFs = widget.classList.toggle('gis-fs-active');
        if (btn) { btn.textContent = isFs ? '✕' : '⛶'; btn.title = isFs ? 'Thoát toàn màn hình' : 'Toàn màn hình'; }
        setTimeout(() => { GM.map && GM.map.invalidateSize(); }, 120);
        if (isFs) {
            widget.scrollIntoView({ behavior: 'smooth' });
            document.addEventListener('keydown', function _esc(e) { if (e.key === 'Escape') { gisToggleFullscreen(btn); document.removeEventListener('keydown', _esc); } });
        }
    }

    /* ============================== CHỈ TIÊU / LĨNH VỰC (mục Chỉ tiêu) ============================== */
    const CDL_PAL = ['#2fb174', '#2c7dd2', '#d8a50c', '#d25a19', '#a78bfa', '#39d5ff', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
    function fmtCompact(n) { n = Number(n) || 0; return n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 10000 ? (n / 1000).toFixed(1) + 'K' : fmt(n); }
    function catTotal(cat) { return cat.items.reduce((s, it) => s + (Number(it[1]) || 0), 0) }
    function isScheduleIndicator(name) { return /lịch|kỳ họp|chương trình kỳ họp/i.test(name || '') }

    function renderCatDonut(cat) {
        const items = cat.items || []; if (!items.length) return '';
        const total = items.reduce((s, it) => s + (Number(it[1]) || 0), 0); if (!total) return '';
        let arcs = '', a = -Math.PI / 2;
        items.forEach((it, i) => {
            const cnt = Number(it[1]) || 0; if (!cnt) return;
            const sw = (cnt / total) * 2 * Math.PI;
            arcs += '<path class="cat-donut-seg" data-idx="' + i + '" onclick="catDonutSegmentClick(\'' + cat.role + '\',\'' + cat.id + '\',' + i + ')" d="' + donutArc(100, 100, 68, (a * 180 / Math.PI) + 90, ((a + sw - 0.014) * 180 / Math.PI) + 90) + '" fill="none" stroke="' + CDL_PAL[i % CDL_PAL.length] + '" stroke-width="26" stroke-linecap="butt"/>';
            a += sw;
        });
        const cname = cat.name.length > 13 ? cat.name.slice(0, 12) + '…' : cat.name;
        const legend = items.map((it, i) => {
            const nm = it[0], cnt = Number(it[1]) || 0, sh = nm.length > 33 ? nm.slice(0, 32) + '…' : nm;
            return '<div class="cdl-item" onclick="catDonutSegmentClick(\'' + cat.role + '\',\'' + cat.id + '\',' + i + ')"><span class="cdl-dot" style="background:' + CDL_PAL[i % CDL_PAL.length] + '"></span><span class="cdl-name">' + sh + '</span><span class="cdl-cnt">' + fmtCompact(cnt) + '</span></div>';
        }).join('');
        return '<div class="cat-donut-wrap">'
            + '<div class="cat-donut-svg"><svg viewBox="0 0 200 200" width="156" height="156" xmlns="http://www.w3.org/2000/svg">'
            + '<circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="26"/>'
            + arcs
            + '<circle cx="100" cy="100" r="35" fill="transparent" cursor="pointer" onclick="catDonutClearSelection()" class="cat-donut-center"/>'
            + '<text x="100" y="94" text-anchor="middle" font-size="26" font-weight="700" fill="#e8f4ff">' + fmtCompact(total) + '</text>'
            + '<text x="100" y="113" text-anchor="middle" font-size="11" fill="#7aaed4">' + cname + '</text>'
            + '<text x="100" y="127" text-anchor="middle" font-size="10" fill="#4a7ea8">bản ghi · click để fill</text>'
            + '</svg></div>'
            + '<div class="cat-donut-legend"><div class="cdl-title">Phân bổ theo chỉ tiêu con — click để fill số liệu vào bảng</div>' + legend + '</div>'
            + '<button class="ghost" style="margin-top:6px;font-size:10.5px;padding:4px 10px" onclick="catDonutClearSelection()">Bỏ chọn</button>'
            + '</div>';
    }
    /* Click vào segment của donut (hoặc legend item) → fill số liệu vào bảng 126 đơn vị */
    let __catDonutSelectedIdx = null;
    function catFillTableColumn(role, catId, idx, valOverride, labelSuffix) {
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
        const it = cat.items[idx]; if (!it) return;
        __catDonutSelectedIdx = idx;
        const name = it[0], val = (valOverride !== undefined && valOverride !== null) ? valOverride : Number(it[1]) || 0;
        document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
        document.querySelectorAll(`.cat-donut-seg[data-idx="${idx}"]`).forEach(el => el.classList.add('cat-donut-seg-active'));
        document.querySelectorAll('.cdl-item').forEach(el => el.classList.remove('cdl-item-active'));
        const legendItems = document.querySelectorAll('.cdl-item');
        if (legendItems[idx]) legendItems[idx].classList.add('cdl-item-active');
        const labelPart = labelSuffix ? ' · ' + labelSuffix : '';
        const seed = String(role + catId + name + labelSuffix).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const unitVals = HN_UNIT_NAMES.map((_, ui) => {
            const r = ((seed + ui * 37 + idx * 53) % 100) / 100;
            return val > 0 ? Math.round((val / 126) * (0.3 + r * 1.4)) : 0;
        });
        const tbody = document.querySelector('.gen-unit-box table tbody');
        if (!tbody) return;
        const rows = tbody.querySelectorAll('tr');
        HN_UNIT_NAMES.forEach((_, ui) => {
            const cells = rows[ui]?.querySelectorAll('td');
            if (cells && cells[idx + 1]) cells[idx + 1].textContent = fmt(unitVals[ui]);
        });
        const thead = document.querySelector('.gen-unit-box table thead tr');
        if (thead) {
            const ths = thead.querySelectorAll('th');
            ths.forEach(t => t.classList.remove('col-active'));
            if (ths[idx + 1]) ths[idx + 1].classList.add('col-active');
        }
        const title = document.querySelector('.gen-unit-box .cdl-title');
        if (title) title.textContent = 'Danh sách 126 đơn vị · Đã chọn: ' + name + labelPart;
        const note = document.querySelector('.gen-unit-box > p');
        if (note) {
            const total = unitVals.reduce((s, v) => s + v, 0);
            note.innerHTML = 'Đã chọn "' + esc(name) + '" (' + fmt(val) + ' bản ghi) — phân bổ <b>' + fmt(total) + ' bản ghi</b> theo 126 đơn vị.';
        }
    }
    function catDonutSegmentClick(role, catId, idx) {
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
        const it = cat.items[idx]; if (!it) return;
        if (__catDonutSelectedIdx === idx) { catDonutClearSelection(); return; }
        catFillTableColumn(role, catId, idx, null, '');
    }
    function catDonutClearSelection() {
        __catDonutSelectedIdx = null;
        document.querySelectorAll('.cat-donut-seg').forEach(el => el.classList.remove('cat-donut-seg-active'));
        document.querySelectorAll('.cdl-item').forEach(el => el.classList.remove('cdl-item-active'));
        const tbody = document.querySelector('.gen-unit-box table tbody');
        if (tbody) {
            const rows = tbody.querySelectorAll('tr');
            HN_UNIT_NAMES.forEach((_, ui) => {
                const cells = rows[ui]?.querySelectorAll('td');
                if (cells) cells.forEach((td, ci) => { if (ci > 0) td.textContent = '0'; });
            });
        }
        const thead = document.querySelector('.gen-unit-box table thead tr');
        if (thead) thead.querySelectorAll('th').forEach(t => t.classList.remove('col-active'));
        const title = document.querySelector('.gen-unit-box .cdl-title');
        if (title) title.textContent = 'Danh sách 126 đơn vị';
        const note = document.querySelector('.gen-unit-box > p');
        if (note) note.innerHTML = 'Lĩnh vực này chưa có số liệu thật theo từng đơn vị — tạm hiển thị 0, chờ cập nhật dữ liệu.';
    }

    /* Preview kiểu "hàng thống kê + thanh mini" (port từ dashboard Giáo dục) dùng chung cho thẻ lĩnh vực khối UBND */
    /* Bản thu gọn của phanToDimBodyHtml, dùng cho card preview nhỏ ở lưới chính — vẫn theo đúng 4 quy tắc, chỉ giảm kích thước */
    function compactPhanToHtml(p) {
        if (p.type === 'stat') {
            const pctItems = p.items.filter(x => isPercentLabel(x.label));
            const plainItems = p.items.filter(x => !isPercentLabel(x.label));
            let html = '';
            if (pctItems.length) html += `<div class="mini-pct-row">${pctItems.map((x, i) => `<span class="mini-pct-chip" style="border-color:${PART_PAL[i % PART_PAL.length]}66" title="${esc(x.label)}"><b style="color:${PART_PAL[i % PART_PAL.length]}">${fmt(x.value)}%</b> ${esc(x.label.replace(/\s*\(%\)\s*$/, ''))}</span>`).join('')}</div>`;
            if (plainItems.length) html += `<div class="mini-stat-row">${plainItems.map(x => `<span class="mini-stat-chip" title="${esc(x.label)}"><b>${fmt(x.value)}</b> ${esc(x.label)}</span>`).join('')}</div>`;
            return html;
        }
        if (shouldRankBar(p.items)) {
            const max = Math.max(...p.items.map(x => Number(x.value) || 0)) || 1;
            return `<div class="mini-rank">${p.items.map((x, i) => `<div class="mini-rank-row" title="${esc(x.label)}: ${fmt(x.value)}"><div class="mini-rank-track"><div style="width:${(x.value / max * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}"></div></div><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
        }
        const tot = p.items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
        const segsHtml = p.items.map((x, i) => `<div style="flex:${(x.value / tot * 100).toFixed(1)};background:${PART_PAL[i % PART_PAL.length]};border-radius:3px" title="${esc(x.label)}: ${fmt(x.value)}"></div>`).join('');
        const legendHtml = p.items.map((x, i) => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${PART_PAL[i % PART_PAL.length]};display:inline-block;flex:0 0 auto"></i>${fmt(x.value)}</span>`).join('');
        return `<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p style="font-size:9px;color:#c8dcec;margin:5px 0 0">${legendHtml}</p>`;
    }
    function soCategoryPreviewHtml(cat) {
        const role = cat.role;
        const rows = (cat.items || []).slice(0, 4).map(it => {
            const name = it[0], declared = Number(it[1]) || 0, itemParts = it[4] || [];
            const dim = itemParts.find(p => p.type === 'bar') || itemParts.find(p => p.type === 'stat');
            if (dim) return { label: name, bodyHtml: compactPhanToHtml(dim) };
            const recs = indicatorRecordsFor(role, name);
            const tot = recs.length || declared || 1;
            const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
            const parts = CAT_ST.map(s => ({ l: s.l, c: s.c, n: cnts[s.k] || 0 })).filter(s => s.n > 0);
            const list = parts.length ? parts : [{ l: 'Chưa phân loại', c: '#2c7dd2', n: tot }];
            const tot2 = list.reduce((s, x) => s + x.n, 0) || 1;
            const segsHtml = list.map(s => `<div style="flex:${(s.n / tot2 * 100).toFixed(1)};background:${s.c};border-radius:3px" title="${esc(s.l)}: ${fmt(s.n)}"></div>`).join('');
            const legendHtml = list.map(s => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><i style="width:7px;height:7px;border-radius:2px;background:${s.c};display:inline-block;flex:0 0 auto"></i>${fmt(s.n)}</span>`).join('');
            return { label: name, bodyHtml: `<div style="display:flex;gap:3px;height:8px">${segsHtml}</div><p style="font-size:9px;color:#c8dcec;margin:5px 0 0">${legendHtml}</p>` };
        });
        if (!rows.length) return '<div class="access-lock" style="height:100%">Chưa có chỉ tiêu con.</div>';
        return `<div style="display:grid;gap:7px;height:100%;overflow-y:auto">${rows.map(r => `
      <div style="background:rgba(6,28,52,.68);border:1px solid rgba(87,178,255,.16);border-radius:10px;padding:8px 10px">
        <p style="font-weight:700;font-size:11.5px;margin:0 0 6px;color:#eaf6ff">${esc(r.label)}</p>
        ${r.bodyHtml}
      </div>`).join('')}</div>`;
    }
    /* Thẻ chỉ tiêu con bên trong dashboard sở, giống hệt style card của dashboard Giáo dục (đơn giản, thanh mảnh, không badge/legend) */
    function soCategoryItemCardHtml(role, catId, idx, it) {
        const name = it[0], parts = it[4] || [];
        if (!parts.length) {
            return `<div style="background:var(--surface-1);border-radius:12px;padding:1.3rem 1.4rem;">
        <p style="font-weight:600;font-size:14px;margin:0;">${esc(name)}</p>
      </div>`;
        }
        return parts.map(p => `<div style="background:var(--surface-1);border-radius:12px;padding:1.3rem 1.4rem;">
      <p style="font-weight:600;font-size:14px;margin:0 0 4px;color:#eaf6ff">${esc(name)}</p>
      <p class="cir-dim-label">${esc(p.dim)}</p>
      ${phanToDimBodyHtml(p)}
    </div>`).join('');
    }
    function allowedCategoryRoles() { return allowedRoles().filter(r => categorySeed[r]); }
    function renderCategoryGrid() {
        const grid = document.getElementById('indicatorGrid'); if (!grid) return;
        const roles = allowedCategoryRoles();
        const q = (document.getElementById('categorySearch')?.value || '').toLowerCase();
        const sourceRoles = activeCategoryRole === 'ALL' ? roles : [activeCategoryRole];
        const cats = []; sourceRoles.forEach(r => (categorySeed[r] || []).forEach(c => cats.push({ ...c, role: r })));
        const filtered = cats.filter(c => !q || c.name.toLowerCase().includes(q));
        grid.innerHTML = filtered.map(c => `<button class="field-category-card" onclick="${c.field === 'Giáo dục' ? 'openGiaoDucDashboard()' : c.role === 'UBND' ? `openSoDashboard('${c.role}','${c.id}')` : `openCategoryDetail('${c.role}','${c.id}')`}"><div class="field-category-meta"><span class="badge ${c.role === 'UBND' ? 'ok' : c.role === 'HDND' ? 'gold' : c.role === 'MTTQ' ? '' : 'red'}">${axisMeta[c.role].icon} ${axisMeta[c.role].name}</span><span class="badge">${c.items.length} chỉ tiêu</span></div><h4>${c.name}</h4>${soCategoryPreviewHtml(c)}</button>`).join('') || '<div class="access-lock">Không có lĩnh vực phù hợp bộ lọc.</div>';
    }
    function setFieldCategoryRole(role) { activeCategoryRole = role; renderIndicators(); }

    /* Lớp 1: dải KPI tổng quan cho toàn bộ lĩnh vực/chỉ tiêu đang được phép xem */
    function renderIndicatorKpiRow() {
        const row = document.getElementById('indicatorKpiRow'); if (!row) return;
        const roles = allowedCategoryRoles();
        const cats = []; roles.forEach(r => (categorySeed[r] || []).forEach(c => cats.push({ ...c, role: r })));
        const totalItems = cats.reduce((s, c) => s + c.items.length, 0);
        const totalRecords = cats.reduce((s, c) => s + catTotal(c), 0);
        const tiles = [
            { label: 'Lĩnh vực', value: fmt(cats.length) },
            { label: 'Chỉ tiêu con', value: fmt(totalItems) },
            { label: 'Tổng bản ghi', value: fmt(totalRecords) },
            { label: 'Trục quản lý', value: fmt(roles.length) }
        ];
        row.innerHTML = tiles.map(t => `<div class="indicator-kpi-tile"><p class="ikt-label">${t.label}</p><p class="ikt-value">${t.value}</p></div>`).join('');
    }

    function renderIndicators() {
        const roles = allowedCategoryRoles();
        const canSeeAll = currentRole === 'DANG';
        if (activeCategoryRole === 'ALL') { if (!canSeeAll) activeCategoryRole = roles[0]; }
        else if (!roles.includes(activeCategoryRole)) activeCategoryRole = canSeeAll ? 'ALL' : roles[0];
        const tabs = document.getElementById('indicatorRoleTabs'); const grid = document.getElementById('indicatorGrid');
        if (!tabs || !grid) return;
        const prevQ = document.getElementById('categorySearch')?.value || '';
        tabs.innerHTML = `<div class="field-category-toolbar"><div class="field-category-tabs">${canSeeAll ? `<button class="${activeCategoryRole === 'ALL' ? 'active' : ''}" onclick="setFieldCategoryRole('ALL')">? Tất cả</button>` : ''}${roles.map(r => `<button class="${activeCategoryRole === r ? 'active' : ''}" onclick="setFieldCategoryRole('${r}')">${axisMeta[r].icon} ${axisMeta[r].name}</button>`).join('')}</div><div class="field-category-search"><input id="categorySearch" placeholder="Tìm lĩnh vực..." oninput="renderCategoryGrid()" /></div></div>`;
        if (prevQ) document.getElementById('categorySearch').value = prevQ;
        renderIndicatorKpiRow();
        renderCategoryGrid();
    }

    /* Chi tiết 1 lĩnh vực: donut tổng + danh sách chỉ tiêu con dạng thanh ngang (bar theo trạng thái) */
    const CAT_ST = [
        { k: 'done', l: 'Đã hoàn thành', c: '#2fb174' },
        { k: 'doing', l: 'Đang thực hiện', c: '#2c7dd2' },
        { k: 'regular', l: 'Vượt chỉ tiêu', c: '#39d5ff' },
        { k: 'soon', l: 'Chưa bắt đầu', c: '#d8a50c' },
        { k: 'risk', l: 'Tạm dừng', c: '#d25a19' },
        { k: 'overdue', l: 'Không đạt', c: '#ef4444' }
    ];
    function catStatusInfo(k) { return CAT_ST.find(s => s.k === k) || { k, l: k, c: '#7a9ab8' }; }
    function indicatorRecordsFor(role, name) { return indicatorRecords.filter(r => r.role === role && r.indicator === name); }
    function catAxisRowHtml(role, it) {
        const name = it[0], declared = Number(it[1]) || 0;
        const recs = indicatorRecordsFor(role, name);
        const tot = recs.length || declared || 1;
        const enc = encodeURIComponent(name);
        const cnts = {}; CAT_ST.forEach(s => { cnts[s.k] = recs.filter(r => r.status === s.k).length; });
        const segs = CAT_ST.map(s => {
            const n = cnts[s.k] || 0;
            if (!n) return '<div class="seg zero"></div>';
            const w = (n / tot * 100).toFixed(1);
            return `<button class="seg" style="width:${w}%;background:${s.c};border:0;cursor:pointer;font-family:inherit" title="${s.l}: ${fmt(n)}" onclick="catSegClick(this,'${role}','${enc}','${s.k}')">${fmt(n)}</button>`;
        }).join('');
        return `<div class="cat-axis-row"><button class="cat-axis-label" title="Xem tất cả" onclick="catSegClick(this,'${role}','${enc}','')">${name}</button><div class="bar">${segs}</div><div class="cat-axis-total">${fmt(declared)}</div></div>`;
    }
    function catAxisLegendHtml() { return `<div class="legend" style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(87,178,255,.12)">${CAT_ST.map(s => `<span><span class="sw" style="background:${s.c}"></span>${s.l}</span>`).join('')}</div>` }

    /* Banner cảnh báo lĩnh vực có số liệu chưa đồng nhất giữa các nguồn (Excel/CSDL/API...) */
    const categoryDataIssues = {
        'ubnd-gddt': 'Số liệu học sinh, giáo viên toàn ngành đang tổng hợp từ báo cáo các Phòng/Sở GD-ĐT theo quận huyện; đối chiếu sơ bộ giữa các nguồn cho thấy chênh lệch khoảng 5-7% — cần chuẩn hóa về một nguồn trước khi công bố chính thức.',
        'ubnd-taichinh': 'Số liệu thu-chi ngân sách giữa CSDL kế toán Thành phố và báo cáo tổng hợp cấp trên đang lệch nhẹ theo kỳ báo cáo (do thời điểm chốt số khác nhau) — cần đối soát trước khi công bố cuối kỳ.',
        'dang-to-chuc': 'Số lượng đảng viên giữa sổ theo dõi Excel nội bộ khối Đảng và CSDL đảng viên Thành ủy chưa khớp hoàn toàn — đang rà soát, cập nhật.'
    };
    function dataIssueBannerHtml(catId) {
        if (!categoryDataIssues[catId]) return '';
        return `<div class="data-issue-banner"><span class="di-icon">⚠️</span><span>Lệch dữ liệu giữa các nguồn</span></div>`;
    }

    /* Biểu đồ phụ: phân bổ theo tần suất cập nhật của các chỉ tiêu con trong lĩnh vực */
    const FREQ_COLORS = { 'Ngày': '#39d5ff', 'Tuần': '#2c7dd2', 'Tháng': '#2fb174', 'Quý': '#d8a50c', 'Realtime': '#ef4444', 'Khi phát sinh': '#d25a19', 'Năm': '#a78bfa' };
    function freqColor(f) { return FREQ_COLORS[f] || '#7a9ab8'; }
    function renderCatFreqChart(cat) {
        const byFreq = {};
        (cat.items || []).forEach(it => { const f = it[2] || 'Khác'; byFreq[f] = (byFreq[f] || 0) + (Number(it[1]) || 0); });
        const list = Object.entries(byFreq).sort((a, b) => b[1] - a[1]);
        const max = list.reduce((m, x) => Math.max(m, x[1]), 0) || 1;
        const rows = list.map(([f, c]) => `<div class="freq-row"><span>${f}</span><div class="freq-track"><div class="freq-fill" style="width:${(c / max * 100).toFixed(1)}%;background:${freqColor(f)}"></div></div><span class="freq-cnt">${fmt(c)}</span></div>`).join('');
        return `<div class="cat-chart-box"><div class="cdl-title">Phân bổ theo tần suất cập nhật</div><div class="freq-bars">${rows || '<div class="unit-lookup-empty">Không có dữ liệu.</div>'}</div></div>`;
    }


    /* ============================== LĨNH VỰC GIÁO DỤC: port nguyên bản giaoduc_full_dashboard.html ============================== */
    /* Dữ liệu thật 126 đơn vị phường/xã: [tên,số trường,trường CQG,học sinh,lớp học,phòng học,nhân sự,CBQL,giáo viên,biết bơi,tật về mắt,diện chính sách] — nguồn: Tong_hop_so_lieu_giao_duc_cap_nhat_A3_ngang.pdf, cập nhật 07/07/2026 */
    const gdUnitData = [
        ['Phường Ba Đình', 17, 13, 9606, 238, 239, 893, 47, 678, 4555, 3447, 48],
        ['Phường Bạch Mai', 32, 20, 22876, 614, 520, 2126, 94, 1650, 9137, 9648, 57],
        ['Phường Bồ Đề', 54, 23, 25543, 748, 586, 2674, 149, 2062, 10138, 9389, 107],
        ['Phường Chương Mỹ', 28, 23, 22114, 428, 293, 1771, 86, 1432, 3650, 3441, 159],
        ['Phường Cầu Giấy', 38, 5, 35595, 697, 638, 3320, 113, 2771, 9505, 6997, 49],
        ['Phường Cửa Nam', 18, 6, 12105, 299, 216, 982, 44, 785, 6802, 5524, 250],
        ['Phường Dương Nội', 30, 10, 21748, 612, 295, 2390, 109, 1940, 6920, 5537, 35],
        ['Phường Giảng Võ', 23, 18, 27645, 582, 592, 1979, 74, 1628, 10617, 8106, 59],
        ['Phường Hai Bà Trưng', 26, 17, 16470, 341, 239, 1340, 69, 1035, 7628, 8190, 114],
        ['Phường Hoàn Kiếm', 19, 15, 11640, 186, 171, 977, 55, 753, 5126, 3638, 42],
        ['Phường Hoàng Liệt', 14, 4, 15441, 251, 204, 866, 39, 692, 8989, 6271, 37],
        ['Phường Hoàng Mai', 18, 7, 15109, 692, 627, 1094, 53, 864, 7654, 6310, 75],
        ['Phường Hà Đông', 84, 30, 61084, 1697, 1072, 6414, 321, 5110, 21565, 16659, 163],
        ['Phường Hồng Hà', 22, 13, 9132, 335, 332, 1195, 68, 911, 2364, 2767, 26],
        ['Phường Khương Đình', 24, 12, 25617, 589, 569, 2115, 70, 1791, 10236, 7477, 71],
        ['Phường Kim Liên', 31, 15, 19082, 431, 273, 1722, 85, 1333, 7383, 5400, 49],
        ['Phường Kiến Hưng', 19, 8, 17410, 561, 504, 1676, 85, 1325, 6125, 5455, 26],
        ['Phường Long Biên', 21, 17, 13001, 341, 310, 1223, 73, 913, 3966, 4027, 36],
        ['Phường Láng', 12, 6, 6865, 195, 185, 730, 31, 563, 3632, 2101, 15],
        ['Phường Lĩnh Nam', 5, 4, 3314, 76, 86, 279, 19, 197, 919, 472, 17],
        ['Phường Nghĩa Đô', 34, 8, 34641, 979, 989, 3856, 136, 3031, 11144, 8761, 50],
        ['Phường Ngọc Hà', 27, 13, 12710, 324, 232, 1539, 77, 1156, 4887, 3200, 27],
        ['Phường Phú Diễn', 29, 12, 21634, 713, 687, 2548, 81, 2087, 10127, 7380, 674],
        ['Phường Phú Lương', 17, 9, 11274, 321, 275, 1030, 58, 793, 4093, 3800, 63],
        ['Phường Phú Thượng', 18, 6, 10177, 257, 253, 1121, 55, 856, 2698, 2958, 15],
        ['Phường Phúc Lợi', 33, 17, 22533, 587, 621, 2250, 96, 1785, 6177, 6325, 54],
        ['Phường Phương Liệt', 15, 5, 7889, 346, 234, 1311, 76, 969, 3324, 2262, 18],
        ['Phường Sơn Tây', 25, 18, 14721, 339, 222, 1438, 65, 1080, 4601, 3818, 571],
        ['Phường Thanh Liệt', 22, 16, 16193, 413, 262, 1488, 86, 1168, 6663, 5240, 721],
        ['Phường Thanh Xuân', 48, 19, 31094, 871, 775, 3666, 126, 2815, 13986, 9023, 72],
        ['Phường Thượng Cát', 11, 6, 6354, 147, 165, 566, 32, 437, 3534, 2438, 67],
        ['Phường Tây Hồ', 32, 16, 18076, 521, 490, 2047, 82, 1496, 9043, 7315, 1981],
        ['Phường Tây Mỗ', 21, 6, 24943, 865, 509, 2928, 88, 2208, 6524, 5612, 82],
        ['Phường Tây Tựu', 16, 9, 6562, 182, 169, 707, 45, 522, 3384, 2416, 50],
        ['Phường Tùng Thiện', 21, 15, 10931, 266, 172, 874, 52, 661, 5194, 3341, 190],
        ['Phường Tương Mai', 31, 13, 23114, 667, 266, 1888, 109, 1450, 10709, 8786, 90],
        ['Phường Từ Liêm', 54, 21, 53054, 1651, 782, 5584, 180, 4019, 22536, 18300, 261],
        ['Phường Việt Hưng', 47, 25, 23749, 675, 379, 2223, 124, 1732, 6438, 7970, 198],
        ['Phường Văn Miếu - Quốc Tử Giám', 16, 6, 4651, 171, 40, 607, 39, 440, 1401, 1367, 29],
        ['Phường Vĩnh Hưng', 18, 13, 15389, 410, 350, 1296, 64, 1024, 6081, 5201, 177],
        ['Phường Vĩnh Tuy', 24, 8, 33802, 857, 598, 3363, 85, 2899, 8777, 5669, 152],
        ['Phường Xuân Phương', 24, 12, 15836, 544, 559, 1820, 82, 1480, 6401, 5276, 389],
        ['Phường Xuân Đỉnh', 15, 5, 13787, 523, 475, 1616, 78, 1256, 6020, 5327, 150],
        ['Phường Yên Hòa', 53, 15, 51622, 1395, 1385, 5156, 164, 4202, 16150, 12938, 48],
        ['Phường Yên Nghĩa', 14, 11, 8433, 310, 159, 969, 67, 743, 1716, 1951, 33],
        ['Phường Yên Sở', 13, 6, 8063, 389, 199, 823, 54, 632, 3903, 2592, 27],
        ['Phường Ô Chợ Dừa', 17, 9, 11861, 347, 282, 1061, 56, 815, 5154, 3920, 66],
        ['Phường Đông Ngạc', 20, 15, 17916, 520, 444, 1730, 75, 1347, 9388, 7319, 105],
        ['Phường Đại Mỗ', 24, 8, 13314, 593, 189, 2026, 94, 1595, 5348, 3573, 56],
        ['Phường Định Công', 21, 7, 24388, 446, 771, 2039, 57, 1688, 8402, 6180, 28],
        ['Phường Đống Đa', 19, 11, 15294, 378, 261, 1221, 57, 961, 6733, 5883, 504],
        ['Xã An Khánh', 33, 22, 19029, 648, 380, 2263, 98, 1705, 5201, 3226, 124],
        ['Xã Ba Vì', 13, 12, 4940, 144, 92, 586, 36, 416, 1278, 644, 1170],
        ['Xã Bát Tràng', 18, 16, 10812, 230, 227, 860, 47, 647, 3772, 3359, 390],
        ['Xã Bình Minh', 28, 17, 20554, 526, 550, 2358, 97, 1946, 5061, 3340, 210],
        ['Xã Bất Bạt', 14, 12, 6739, 187, 155, 673, 35, 491, 953, 906, 144],
        ['Xã Chuyên Mỹ', 17, 13, 7518, 197, 188, 789, 42, 585, 1233, 1225, 579],
        ['Xã Chương Dương', 19, 18, 9696, 267, 256, 989, 55, 758, 2162, 2007, 95],
        ['Xã Cổ Đô', 25, 23, 11573, 312, 249, 1208, 67, 880, 3166, 2668, 310],
        ['Xã Dân Hòa', 20, 19, 10430, 265, 189, 952, 55, 722, 2666, 2034, 225],
        ['Xã Dương Hòa', 20, 18, 10723, 255, 243, 1026, 46, 780, 3007, 2481, 87],
        ['Xã Gia Lâm', 32, 16, 32804, 853, 834, 3448, 98, 2668, 10895, 9312, 50],
        ['Xã Hoài Đức', 30, 15, 19016, 446, 325, 1731, 78, 1393, 4717, 4013, 84],
        ['Xã Hát Môn', 25, 16, 12477, 323, 290, 1196, 64, 913, 2917, 2324, 3489],
        ['Xã Hòa Lạc', 8, 4, 4685, 168, 224, 685, 28, 517, 1533, 905, 56],
        ['Xã Hòa Phú', 22, 19, 9331, 225, 141, 860, 53, 630, 2385, 1062, 1313],
        ['Xã Hòa Xá', 25, 21, 9026, 246, 171, 1011, 57, 726, 2607, 1633, 208],
        ['Xã Hưng Đạo', 19, 17, 9407, 240, 200, 938, 50, 702, 2249, 2223, 568],
        ['Xã Hương Sơn', 19, 16, 7979, 215, 177, 856, 51, 596, 1768, 1421, 182],
        ['Xã Hạ Bằng', 18, 12, 9721, 245, 239, 872, 51, 690, 2406, 1713, 155],
        ['Xã Hồng Sơn', 23, 23, 10006, 266, 274, 1104, 60, 789, 1676, 1651, 321],
        ['Xã Hồng Vân', 21, 15, 11079, 304, 211, 1085, 63, 826, 3497, 3117, 168],
        ['Xã Kim Anh', 13, 10, 9598, 221, 190, 783, 31, 605, 2534, 1279, 168],
        ['Xã Kiều Phú', 20, 18, 10445, 276, 265, 1026, 51, 759, 3640, 2404, 3082],
        ['Xã Liên Minh', 15, 14, 8160, 209, 181, 764, 35, 580, 1919, 1446, 81],
        ['Xã Minh Châu', 4, 1, 867, 27, 27, 113, 7, 77, 300, 44, 40],
        ['Xã Mê Linh', 19, 7, 12993, 308, 241, 1122, 53, 874, 2386, 2430, 161],
        ['Xã Mỹ Đức', 22, 17, 15085, 295, 249, 1355, 70, 1008, 2790, 3074, 371],
        ['Xã Nam Phù', 17, 13, 9409, 256, 209, 908, 47, 686, 4401, 2312, 85],
        ['Xã Ngọc Hồi', 15, 10, 12657, 265, 263, 991, 54, 767, 4730, 2635, 70],
        ['Xã Nội Bài', 22, 17, 16442, 387, 334, 1298, 56, 1007, 6626, 3470, 336],
        ['Xã Phù Đổng', 37, 28, 20475, 482, 417, 1779, 92, 1358, 7556, 6621, 142],
        ['Xã Phú Cát', 19, 14, 7028, 196, 152, 809, 41, 586, 2137, 832, 171],
        ['Xã Phú Nghĩa', 20, 12, 10363, 259, 265, 932, 54, 705, 1877, 1521, 180],
        ['Xã Phú Xuyên', 35, 24, 16388, 419, 348, 1831, 95, 1339, 3169, 3096, 763],
        ['Xã Phúc Lộc', 25, 20, 11913, 304, 210, 1173, 65, 868, 2804, 2319, 240],
        ['Xã Phúc Sơn', 20, 20, 8074, 211, 195, 961, 58, 670, 2407, 1383, 386],
        ['Xã Phúc Thịnh', 27, 18, 21391, 517, 598, 2089, 86, 1664, 7026, 5230, 813],
        ['Xã Phúc Thọ', 28, 22, 13255, 317, 253, 1392, 71, 1060, 2776, 1600, 1925],
        ['Xã Phượng Dực', 16, 15, 9069, 253, 207, 1063, 46, 787, 1306, 1140, 279],
        ['Xã Quang Minh', 26, 16, 18242, 434, 278, 1462, 66, 1155, 4014, 3339, 309],
        ['Xã Quảng Bị', 16, 13, 12261, 274, 224, 906, 41, 716, 2894, 1664, 160],
        ['Xã Quảng Oai', 24, 17, 12887, 316, 240, 1140, 60, 852, 4069, 2248, 510],
        ['Xã Quốc Oai', 25, 17, 15999, 398, 322, 1506, 70, 1162, 4658, 4304, 354],
        ['Xã Suối Hai', 12, 13, 8679, 226, 167, 793, 39, 592, 2061, 1108, 1663],
        ['Xã Sóc Sơn', 47, 32, 30785, 653, 579, 2536, 115, 1958, 10859, 6413, 2313],
        ['Xã Sơn Đồng', 27, 14, 13102, 367, 278, 1419, 72, 1059, 3662, 3097, 58],
        ['Xã Tam Hưng', 16, 10, 9609, 211, 192, 790, 40, 613, 2831, 2017, 122],
        ['Xã Thanh Oai', 23, 18, 11390, 296, 283, 1055, 60, 793, 3542, 2123, 478],
        ['Xã Thanh Trì', 17, 12, 9705, 298, 149, 1077, 77, 814, 3353, 3145, 26],
        ['Xã Thiên Lộc', 25, 14, 14890, 398, 358, 1315, 68, 1029, 5878, 4255, 4877],
        ['Xã Thuận An', 18, 18, 12743, 322, 286, 1126, 55, 870, 4456, 3605, 50],
        ['Xã Thư Lâm', 31, 21, 19612, 486, 442, 1651, 78, 1289, 7673, 6041, 3879],
        ['Xã Thường Tín', 32, 26, 19016, 451, 451, 1722, 89, 1328, 6452, 4306, 168],
        ['Xã Thượng Phúc', 16, 16, 7884, 208, 168, 770, 40, 593, 2294, 1269, 93],
        ['Xã Thạch Thất', 22, 17, 12867, 260, 249, 1059, 59, 817, 4224, 2339, 164],
        ['Xã Tiến Thắng', 16, 13, 9689, 243, 131, 868, 39, 660, 2252, 1739, 216],
        ['Xã Trung Giã', 19, 18, 11731, 257, 207, 1002, 49, 750, 4586, 2164, 353],
        ['Xã Trần Phú', 17, 9, 10508, 230, 183, 793, 42, 620, 3001, 1236, 264],
        ['Xã Tây Phương', 34, 26, 20250, 516, 442, 1836, 91, 1454, 4864, 5245, 351],
        ['Xã Vân Đình', 24, 19, 9654, 247, 193, 1027, 60, 747, 2773, 2212, 245],
        ['Xã Vĩnh Thanh', 16, 10, 8959, 295, 312, 938, 46, 725, 2869, 2154, 111],
        ['Xã Vật Lại', 18, 10, 12384, 269, 225, 1082, 54, 825, 3113, 1016, 704],
        ['Xã Xuân Mai', 29, 14, 16278, 435, 342, 1228, 70, 972, 5863, 2138, 276],
        ['Xã Yên Bài', 12, 12, 3753, 115, 100, 470, 29, 335, 1114, 667, 98],
        ['Xã Yên Lãng', 23, 17, 13586, 329, 286, 1248, 62, 928, 2153, 2333, 218],
        ['Xã Yên Xuân', 18, 10, 6417, 167, 129, 687, 47, 501, 2055, 614, 269],
        ['Xã Ô Diên', 30, 26, 17367, 471, 423, 1642, 76, 1273, 4027, 5698, 181],
        ['Xã Đa Phúc', 22, 20, 14748, 339, 277, 1303, 59, 979, 5430, 2178, 2152],
        ['Xã Đan Phượng', 18, 16, 12429, 266, 167, 1176, 48, 938, 2185, 2550, 97],
        ['Xã Đoài Phương', 11, 7, 6611, 142, 127, 575, 27, 434, 2845, 1054, 67],
        ['Xã Đông Anh', 42, 30, 29919, 613, 608, 2798, 114, 2268, 10370, 6144, 1157],
        ['Xã Đại Thanh', 26, 20, 17184, 526, 392, 1760, 102, 1334, 6401, 5055, 772],
        ['Xã Đại Xuyên', 25, 20, 12006, 301, 349, 1240, 57, 943, 1988, 1552, 207],
        ['Xã Ứng Hòa', 30, 29, 9796, 255, 210, 1046, 68, 729, 2151, 2273, 267],
        ['Xã Ứng Thiên', 19, 18, 8659, 225, 199, 919, 48, 677, 3141, 1910, 230]
    ];
    /* Drill-down + chi tiết đơn vị cho dashboard Giáo dục — dùng chung 1 nguồn gdUnitData */
    const GD_SOURCE_NOTE = 'Nguồn: file cập nhật "SỐ LIỆU TRƯỜNG HỌC CÁC ĐƠN VỊ_SỞ GIÁO DỤC.txt" (Sở Giáo dục và Đào tạo), ghép theo tên đơn vị phường/xã với dữ liệu sức khỏe học sinh — cập nhật 07/07/2026.';
    const GD_COL_GET = { name: u => u[0], truong: u => u[1], cqg: u => u[2], cqgRate: u => u[1] ? u[2] / u[1] * 100 : 0, hs: u => u[3], lop: u => u[4], phong: u => u[5], nhansu: u => u[6], cbql: u => u[7], gv: u => u[8], boi: u => u[9], mat: u => u[10], cs: u => u[11], hsLop: u => u[4] ? u[3] / u[4] : 0, hsGv: u => u[8] ? u[3] / u[8] : 0 };
    const gdColumns = [
        { label: 'Đơn vị', key: 'name', align: 'left' }, { label: 'Số trường', key: 'truong', align: 'right' }, { label: 'Trường CQG', key: 'cqg', align: 'right' }, { label: 'Tỷ lệ CQG', key: 'cqgRate', align: 'right' },
        { label: 'Học sinh', key: 'hs', align: 'right' }, { label: 'Lớp học', key: 'lop', align: 'right' }, { label: 'Phòng học', key: 'phong', align: 'right' }, { label: 'Nhân sự', key: 'nhansu', align: 'right' },
        { label: 'CBQL', key: 'cbql', align: 'right' }, { label: 'Giáo viên', key: 'gv', align: 'right' }, { label: 'Biết bơi', key: 'boi', align: 'right' }, { label: 'Tật về mắt', key: 'mat', align: 'right' }, { label: 'Diện chính sách', key: 'cs', align: 'right' }
    ];
    let gdSort = { key: 'hs', dir: 'desc' };
    function gdFmtVal(key, v) { return key === 'cqgRate' ? v.toFixed(1) + '%' : fmt(v); }
    function gdSortedUnits() {
        const { key, dir } = gdSort, get = GD_COL_GET[key];
        return [...gdUnitData].sort((a, b) => {
            const av = get(a), bv = get(b);
            if (key === 'name') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return dir === 'asc' ? av - bv : bv - av;
        });
    }
    function gdSortBy(key) {
        gdSort = gdSort.key === key ? { key, dir: gdSort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' };
        const thead = document.getElementById('gdUnitThead'); if (thead) thead.innerHTML = gdUnitTheadHtml();
        const tbody = document.getElementById('gdUnitTbody'); if (tbody) tbody.innerHTML = gdUnitTableRowsHtml();
    }
    function gdUnitTheadHtml() {
        return `<tr>${gdColumns.map(c => `<th onclick="gdSortBy('${c.key}')" style="cursor:pointer;text-align:${c.align};white-space:nowrap">${esc(c.label)}${gdSort.key === c.key ? (gdSort.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>`;
    }
    function gdUnitTableRowsHtml() {
        return gdSortedUnits().map(u => {
            const nameSafe = u[0].replace(/'/g, "\\'");
            return `<tr onclick="gdOpenUnitDetail('${nameSafe}')">${gdColumns.map(c => {
                const v = GD_COL_GET[c.key](u);
                return `<td style="text-align:${c.align}">${c.key === 'name' ? esc(v) : gdFmtVal(c.key, v)}</td>`;
            }).join('')}</tr>`;
        }).join('');
    }
    function gdDrillToUnits(key, names, note) {
        gdSort = { key, dir: key === 'name' ? 'asc' : 'desc' };
        const thead = document.getElementById('gdUnitThead'); if (thead) thead.innerHTML = gdUnitTheadHtml();
        const tbody = document.getElementById('gdUnitTbody'); if (tbody) tbody.innerHTML = gdUnitTableRowsHtml();
        if (note) toast(note);
        const rows = [...document.querySelectorAll('#gdUnitTbody tr')];
        const target = names && names.length ? rows.find(r => names.some(n => r.firstElementChild.textContent.indexOf(n) === 0)) : rows[0];
        if (target) {
            target.style.outline = '2px solid #ffd54b';
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            setTimeout(() => { target.style.outline = ''; }, 2500);
        }
    }
    function gdOpenUnitDetail(name) {
        toast('Tạm thời chưa hỗ trợ xem chi tiết đơn vị.'); return;
        const u = gdUnitData.find(x => x[0] === name); if (!u) return;
        const fields = [['Số trường', u[1]], ['Trường chuẩn quốc gia', u[2]], ['Số lớp học', u[4]], ['Số phòng học', u[5]], ['Tổng nhân sự', u[6]], ['CBQL', u[7]], ['Giáo viên', u[8]], ['Học sinh', u[3]], ['HS biết bơi', u[9]], ['HS có tật về mắt', u[10]], ['HS diện chính sách', u[11]]];
        document.getElementById('modalTitleNotify').textContent = name;
        document.getElementById('modalSubNotify').textContent = 'Sở Giáo dục và Đào tạo · 126 đơn vị phường/xã';
        document.getElementById('modalBodyNotify').innerHTML = `
      <div class="kv">${fields.map(f => `<b>${esc(f[0])}</b><span>${fmt(f[1])}</span>`).join('')}</div>
      <div class="record-update-note" style="margin-top:12px">${GD_SOURCE_NOTE}</div>`;
        openModal();
    }

    /* Xếp hạng cao nhất / thấp nhất theo 1 chỉ số — gộp thẳng vào từng màn chi tiết category, không tách card riêng */
    function gdRankRowHtml(name, valueLabel, pct, color) {
        const nameSafe = name.replace(/'/g, "\\'");
        return `<div class="rank-row" style="cursor:pointer" onclick="gdOpenUnitDetail('${nameSafe}')"><div class="rank-row-top"><span class="rank-label">${esc(name)}</span><b class="rank-value">${valueLabel}</b></div><div class="rank-track"><div class="rank-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div></div>`;
    }
    function gdMetricRankHtml(key, label, fmtFn) {
        const rows = gdUnitData.map(u => ({ name: u[0], v: GD_COL_GET[key](u) }));
        const highest = [...rows].sort((a, b) => b.v - a.v).slice(0, 5);
        const lowest = [...rows].sort((a, b) => a.v - b.v).slice(0, 5);
        const maxAbs = Math.max(...rows.map(r => r.v), 1);
        return `<div class="cat-chart-box">
      <div class="cdl-title">${esc(label)} — cao nhất / thấp nhất</div>
      <p style="font-size:11px;font-weight:800;color:#7fe0a0;margin:8px 0 6px">? Cao nhất</p>
      <div class="rank-list" style="margin-bottom:12px">${highest.map(r => gdRankRowHtml(r.name, fmtFn(r.v), r.v / maxAbs * 100, '#2fb174')).join('')}</div>
      <p style="font-size:11px;font-weight:800;color:#8fc7ea;margin:0 0 6px">? Thấp nhất</p>
      <div class="rank-list">${lowest.map(r => gdRankRowHtml(r.name, fmtFn(r.v), r.v / maxAbs * 100, '#2c9ed2')).join('')}</div>
    </div>`;
    }

    /* Lớp 2: 1 màn chi tiết riêng cho mỗi category (Mạng lưới trường học / Học sinh / Nhân sự) — panel nhỏ ước tính bên trái + xếp hạng 126 đơn vị (data thật) bên phải */
    const GD_CAT_META = {
        truong: {
            title: 'Mạng lưới trường học', icon: '?',
            kpis: [['Số trường', '2.963'], ['Trường CQG', '1.868'], ['Tỷ lệ CQG', '63,04%'], ['Phòng học', '41.332']],
            smallCharts: [
                { id: 'gdD1', title: 'Số trường theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [3600, 800, 400, 700, 123], color: '#2a78d6' },
                { id: 'gdD2', title: 'Loại hình trường (ước tính toàn ngành)', type: 'doughnut', labels: ['Công lập', 'Tư thục'], data: [2359, 3264], color: ['#2a78d6', '#1baf7a'] }
            ],
            rankKey: 'truong', rankLabel: 'số trường',
            tooltipFields: [['Số trường', 'truong'], ['Trường CQG', 'cqg'], ['Tỷ lệ CQG', 'cqgRate'], ['Phòng học', 'phong']],
            extraMetrics: [
                { key: 'cqgRate', label: 'Tỷ lệ trường chuẩn QG', fmt: v => v.toFixed(1) + '%' },
                { key: 'hsLop', label: 'Học sinh / lớp', fmt: v => v.toFixed(1) }
            ]
        },
        hocsinh: {
            title: 'Học sinh', icon: '🎓',
            kpis: [['Tổng học sinh', '1.918.158'], ['Học 2 buổi/ngày (ước tính)', '1.902.083'], ['HS diện chính sách', '51.063']],
            smallCharts: [
                { id: 'gdD3', title: 'Học sinh theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [756790, 652108, 318317, 66450], color: '#1baf7a' },
                { id: 'gdD4', title: 'Sức khỏe & chính sách (toàn ngành)', type: 'bar', labels: ['Biết bơi', 'Tật về mắt', 'Diện chính sách'], data: [639081, 492302, 51063], color: '#eda100' }
            ],
            rankKey: 'hs', rankLabel: 'học sinh',
            tooltipFields: [['Học sinh', 'hs'], ['Biết bơi', 'boi'], ['Tật về mắt', 'mat'], ['Diện chính sách', 'cs']]
        },
        nhansu: {
            title: 'Nhân sự – giáo viên', icon: '🧑‍🏫',
            kpis: [['Tổng nhân sự', '186.401'], ['CBQL', '8.464'], ['Giáo viên', '144.292'], ['Nhân viên (ước tính)', '33.645']],
            smallCharts: [
                { id: 'gdD5', title: 'Vị trí việc làm (ước tính toàn ngành)', type: 'doughnut', labels: ['Giáo viên', 'CBQL', 'Nhân viên'], data: [144292, 8464, 33645], color: ['#2a78d6', '#eda100', '#4a3aa7'] },
                { id: 'gdD6', title: 'Giáo viên theo cấp học (ước tính toàn ngành)', type: 'bar', labels: ['Mầm non', 'Tiểu học', 'THCS', 'THPT', 'GDTX'], data: [48053, 32888, 30691, 17628, 4122], color: '#2a78d6' }
            ],
            rankKey: 'nhansu', rankLabel: 'nhân sự',
            tooltipFields: [['Tổng nhân sự', 'nhansu'], ['CBQL', 'cbql'], ['Giáo viên', 'gv']],
            extraMetrics: [
                { key: 'hsGv', label: 'Học sinh / giáo viên', fmt: v => v.toFixed(1) }
            ]
        }
    };
    function gdCategoryDetailHtml(catKey) {
        const m = GD_CAT_META[catKey];
        return `
<button class="category-view-back" onclick="openGiaoDucDashboard()"><i class="ti ti-arrow-left" style="font-size:14px" aria-hidden="true"></i>Quay lại</button>
<p style="font-weight:600;font-size:16px;margin:10px 0 12px">${m.icon} ${esc(m.title)}</p>
<div class="indicator-kpi-row" style="margin-bottom:14px">${m.kpis.map(k => `<div class="indicator-kpi-tile"><p class="ikt-label">${esc(k[0])}</p><p class="ikt-value">${esc(k[1])}</p></div>`).join('')}</div>
<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:14px;align-items:start">
  <div style="display:grid;gap:14px">
    ${m.smallCharts.map(c => `<div class="cat-chart-box"><div class="cdl-title">${esc(c.title)}</div><div style="position:relative;height:190px"><canvas id="${c.id}"></canvas></div></div>`).join('')}
  </div>
  <div class="cat-chart-box">
    <div class="cdl-title">Xếp hạng 126 đơn vị theo ${esc(m.rankLabel)} (data thật — hover/bấm 1 cột để xem chi tiết đơn vị)</div>
    <div style="max-height:560px;overflow-y:auto"><div style="position:relative;height:${gdUnitData.length * 20}px"><canvas id="gdRankChart"></canvas></div></div>
  </div>
</div>
${(m.extraMetrics || []).length ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;margin-top:14px">${m.extraMetrics.map(em => gdMetricRankHtml(em.key, em.label, em.fmt)).join('')}</div>` : ''}`;
    }
    function gdInitCategoryCharts(catKey) {
        const m = GD_CAT_META[catKey];
        m.smallCharts.forEach(c => {
            const labels = c.type === 'doughnut' ? c.labels.map((l, i) => `${l}: ${fmt(c.data[i])}`) : c.labels;
            new Chart(document.getElementById(c.id), { type: c.type, data: { labels, datasets: [{ data: c.data, backgroundColor: c.color, borderRadius: c.type === 'bar' ? 4 : 0, maxBarThickness: 28 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: c.type === 'doughnut', position: 'bottom', labels: { color: '#dceeff', boxWidth: 13, padding: 10, font: { size: 14, weight: 700 } } } } } });
        });
        const sorted = [...gdUnitData].sort((a, b) => GD_COL_GET[m.rankKey](b) - GD_COL_GET[m.rankKey](a));
        new Chart(document.getElementById('gdRankChart'), {
            type: 'bar',
            data: { labels: sorted.map(u => u[0]), datasets: [{ data: sorted.map(u => GD_COL_GET[m.rankKey](u)), backgroundColor: '#2c9ed2', maxBarThickness: 14 }] },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const u = sorted[ctx.dataIndex];
                                return m.tooltipFields.map(f => `${f[0]}: ${gdFmtVal(f[1], GD_COL_GET[f[1]](u))}`);
                            }
                        }
                    }
                },
                onClick: (evt, elements) => { if (elements.length) { gdOpenUnitDetail(sorted[elements[0].index][0]); } },
                scales: { y: { ticks: { font: { size: 10 } } } }
            }
        });
    }
    function gdOpenCategoryDetail(catKey) {
        toast('Tạm thời chưa hỗ trợ xem chi tiết lĩnh vực con.'); return;
        document.getElementById('drawerBodyNotify').innerHTML = `<div class="gd-dash">${gdCategoryDetailHtml(catKey)}</div>`;
        gdInitCategoryCharts(catKey);
    }

    function gdDashboardHtml() {
        return `
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
  <p style="font-weight:500;font-size:16px;margin:0;"><i class="ti ti-school" style="font-size:17px;vertical-align:-2px;margin-right:6px;" aria-hidden="true"></i>Giáo dục</p>
  <button class="primary" style="font-size:12px;" onclick="openFieldScenarioSelector('cat::UBND::ubnd-gddt')">Giao nhiệm vụ</button>
</div>
<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
  <select style="height:32px;font-size:12px;"><option>2025-2026</option></select>
  <select style="height:32px;font-size:12px;"><option>Đầu năm</option></select>
  <span style="font-size:10.5px;color:var(--text-muted)">(hiển thị thông tin, chưa hỗ trợ lọc)</span>
</div>

<div class="indicator-kpi-row" style="margin-bottom:14px">
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('truong')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Số trường</p><p class="ikt-value">2.963</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('hs')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Học sinh</p><p class="ikt-value">1.918.158</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('gv')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Giáo viên</p><p class="ikt-value">144.292</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('nhansu')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Nhân sự</p><p class="ikt-value">186.401</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('lop')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Số lớp</p><p class="ikt-value">50.523</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('phong')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Phòng học</p><p class="ikt-value">41.332</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('cqgRate')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Chuẩn QG</p><p class="ikt-value">63,04%</p></div>
  <div class="indicator-kpi-tile" onclick="gdDrillToUnits('cqg')" title="Xem theo 126 đơn vị" style="cursor:pointer"><p class="ikt-label">Trường CQG</p><p class="ikt-value">1.868</p></div>
</div>

<div class="gd-two-col">
  <div style="display:grid;gap:14px">
    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('truong')">
      <div class="cdl-title">🏫 Mạng lưới trường học</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">2.963 trường · 1.868 trường CQG (63,04%) · 41.332 phòng học</p>
      ${barDimBodyHtml(P('Cấp học (ước tính toàn ngành)', [['Mầm non', 3600], ['Tiểu học', 800], ['THCS', 400], ['THPT/GDTX', 823]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>

    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('hocsinh')">
      <div class="cdl-title">🎓 Học sinh</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">1.918.158 học sinh · 99,2% học 2 buổi/ngày (ước tính)</p>
      ${barDimBodyHtml(P('Cấp học (ước tính toàn ngành)', [['Tiểu học', 756790], ['THCS', 652108], ['THPT', 318317], ['GDTX', 66450]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>

    <div class="cat-chart-box" style="cursor:pointer" onclick="gdOpenCategoryDetail('nhansu')">
      <div class="cdl-title">🧑‍🏫 Nhân sự – giáo viên</div>
      <p style="font-size:12px;color:var(--text-secondary);margin:6px 0 10px;">186.401 nhân sự · 144.292 giáo viên · 8.464 CBQL</p>
      ${barDimBodyHtml(P('Nhân lực', [['Giáo viên', 144292], ['CBQL', 8464], ['Nhân viên', 33645]]))}
      <p style="font-size:11px;color:#58b7ff;margin-top:8px">Bấm để xem chi tiết & xếp hạng 126 đơn vị →</p>
    </div>
  </div>

  <div class="unit-lookup">
    <div class="unit-lookup-title" style="margin-bottom:10px">📋 Danh sách 126 đơn vị</div>
    <input id="gd-search-donvi" type="text" placeholder="Tìm tên đơn vị..." oninput="gdFilterRows()" style="width:100%;margin-bottom:10px;">
    <div class="iip-table-wrap" style="max-height:640px">
      <table class="iip-table" id="gdUnitTable">
        <thead id="gdUnitThead">${gdUnitTheadHtml()}</thead>
        <tbody id="gdUnitTbody">${gdUnitTableRowsHtml()}</tbody>
      </table>
    </div>
  </div>
</div>

${fieldScenarioSummary('cat::UBND::ubnd-gddt')}`;
    }
    function gdFilterRows() {
        const q = document.getElementById('gd-search-donvi').value.toLowerCase();
        const rows = document.querySelectorAll('#gdUnitTbody tr');
        rows.forEach(function (r) {
            const name = r.children[0].textContent.toLowerCase();
            r.style.display = name.indexOf(q) !== -1 ? '' : 'none';
        });
    }
    function openGiaoDucDashboard() {
        document.getElementById('drawerTitleNotify').textContent = 'Lĩnh vực: Giáo dục';
        document.getElementById('drawerSubNotify').textContent = 'Giáo dục';
        document.getElementById('drawerBodyNotify').innerHTML = `<div class="gd-dash">${gdDashboardHtml()}</div>`;
        openDrawerNoti();
    }

    /* Lớp 2: KPI tổng lĩnh vực + lưới thẻ nhóm (mỗi chỉ tiêu con = 1 thẻ, có mini-bar cơ cấu trạng thái) */
    function catKpiRowHtml(cat) {
        const total = catTotal(cat);
        const recs = []; cat.items.forEach(it => recs.push(...indicatorRecordsFor(cat.role, it[0])));
        const done = recs.filter(r => r.status === 'done').length;
        const overdue = recs.filter(r => r.status === 'overdue').length;
        const tiles = [
            { label: 'Chỉ tiêu con', value: fmt(cat.items.length) },
            { label: 'Tổng bản ghi', value: fmt(total) },
            { label: 'Hoàn thành', value: fmt(done) },
            { label: 'Không đạt/quá hạn', value: fmt(overdue) }
        ];
        return `<div class="indicator-kpi-row">${tiles.map(t => `<div class="indicator-kpi-tile"><p class="ikt-label">${t.label}</p><p class="ikt-value">${t.value}</p></div>`).join('')}</div>`;
    }
    function catItemCardHtml(role, catId, idx, it) {
        const name = it[0], declared = Number(it[1]) || 0, freq = it[2], parts = it[4] || [];
        const clickAttr = `onclick="event.stopPropagation();catDonutSegmentClick('${role}','${catId}',${idx})"`;
        let bodyHtml;
        if (parts.length) {
            /* Chỉ tiêu thống kê: hiển thị phân tổ thật (không phải trạng thái xử lý) */
            bodyHtml = parts.map(p => `<p class="cir-dim-label">${esc(p.dim)}</p>${phanToDimBodyHtml(p)}`).join('');
        } else {
            /* Chỉ tiêu dạng nhiệm vụ/việc: biểu đồ Chart.js donut theo trạng thái xử lý */
            const recs = indicatorRecordsFor(role, name);
            const tot = recs.length || declared || 1;
            const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
            const list = CAT_ST.map(s => ({ l: s.l, c: s.c, n: cnts[s.k] || 0 })).filter(s => s.n > 0);
            const finalList = list.length ? list : [{ l: 'Chưa phân loại', c: '#2c7dd2', n: tot }];
            const chartId = chartCanvasId();
            queueDimChart(chartId, 'doughnut', finalList.map(s => s.l), finalList.map(s => s.n), finalList.map(s => s.c));
            bodyHtml = `<div style="position:relative;height:210px;margin-top:8px;cursor:pointer" ${clickAttr} title="Click để fill số liệu vào bảng 126 đơn vị"><canvas id="${chartId}"></canvas></div>`;
        }
        return `<button class="cat-item-row" onclick="openCategoryItemDetail('${role}','${catId}',${idx})">
      <div class="field-category-meta"><span class="badge">${freq}</span></div>
      <h4>${name}</h4>
      <div class="cat-item-chart-trigger" style="cursor:pointer" ${clickAttr} title="Click biểu đồ này để fill số liệu vào bảng 126 đơn vị">${bodyHtml}</div>
    </button>`;
    }
    /* Danh sách 126 đơn vị phường/xã dùng chung cho mọi lĩnh vực (port từ dashboard Giáo dục) —
       lĩnh vực nào chưa có số liệu thật theo đơn vị thì hiển thị mặc định 0, chờ cập nhật dữ liệu thật. */
    const HN_UNIT_NAMES = gdUnitData.map(u => u[0]);
    function genUnitTableHtml(cat) {
        const cols = cat.items.map(it => it[0]);
        const thead = `<tr><th>Đơn vị</th>${cols.map(c => `<th style="text-align:right">${esc(c)}</th>`).join('')}</tr>`;
        const rows = HN_UNIT_NAMES.map(name => `<tr><td>${esc(name)}</td>${cols.map(() => '<td class="num" style="text-align:right">0</td>').join('')}</tr>`).join('');
        return `<div class="cat-chart-box gen-unit-box" style="padding:14px 16px;min-height:0;min-width:0;overflow:hidden;display:flex;flex-direction:column">
      <div class="cdl-title" style="margin-bottom:2px;flex:0 0 auto">Danh sách 126 đơn vị</div>
      <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 10px;flex:0 0 auto">Lĩnh vực này chưa có số liệu thật theo từng đơn vị — tạm hiển thị 0, chờ cập nhật dữ liệu.</p>
      <input type="text" placeholder="Tìm tên đơn vị..." oninput="genFilterUnitTable(this)" style="width:100%;margin-bottom:10px;height:34px;border:1px solid rgba(87,178,255,.28);background:#061a2f;border-radius:10px;padding:0 10px;color:#e8f4ff;font-size:12px;flex:0 0 auto">
      <div class="iip-table-wrap" style="max-height:none;min-height:0;overflow-x:auto;flex:1 1 auto">
        <table class="iip-table" style="min-width:${280 + cols.length * 110}px"><thead>${thead}</thead><tbody>${rows}</tbody></table>
      </div>
    </div>`;
    }
    function genFilterUnitTable(input) {
        const wrap = input.closest('.cat-chart-box'); if (!wrap) return;
        const q = input.value.trim().toLowerCase();
        wrap.querySelectorAll('tbody tr').forEach(r => { r.style.display = r.children[0].textContent.toLowerCase().includes(q) ? '' : 'none'; });
    }
    /* Đo chiều cao thật của cột chỉ tiêu (trái) rồi gán cứng cho khung 126 đơn vị (phải) — tránh vòng lặp
       tính toán của CSS grid/flex khi nội dung bảng 126 dòng không bị giới hạn chiều cao. */
    function syncGenUnitBoxHeight() {
        document.querySelectorAll('.cat-two-col').forEach(wrap => {
            const left = wrap.children[0], box = wrap.querySelector('.gen-unit-box');
            if (!left || !box) return;
            box.style.height = Math.max(left.offsetHeight, 320) + 'px';
        });
    }
    /* ===== Giao diện riêng cho "Ủy ban Kiểm tra Thành ủy" — port đúng số liệu & bố cục từ ảnh số liệu thật UBKT cung cấp ===== */
    function ubktBox1Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',1)" title="Giám sát UBKT — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Giám sát của UBKT các cấp</div>
      <p style="text-align:center;margin:8px 0 16px"><span style="font-size:10px;color:var(--text-muted)">Tổng: </span><b style="font-size:24px;color:#fff">233</b></p>
      <div style="display:flex;flex-direction:column;gap:9px">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span>👥 Tổ chức Đảng</span><b>109</b></div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:#dceeff"><span>🏛 Đảng viên</span><b>124</b></div>
      </div>
    </div>`;
    }
    function ubktBox2Html() {
        const grp = (label, total, to, dv) => `<div style="background:rgba(44,125,210,.16);border:1px solid rgba(44,125,210,.4);border-radius:10px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;font-weight:800;color:#fff;font-size:11.5px"><span>${label}</span><span>${fmt(total)}</span></div>
      <div style="margin-top:9px;font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between"><span>🏛 Tổ chức Đảng</span><b>${fmt(to)}</b></div>
      <div style="font-size:10.5px;color:#b7d4ee;display:flex;justify-content:space-between;margin-top:4px"><span>👥 Đảng viên</span><b>${fmt(dv)}</b></div>
    </div>`;
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',2)" title="KTGS cấp ủy — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kiểm tra giám sát của cấp ủy các cấp và chi bộ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${grp('Kiểm tra', 574, 256, 318)}${grp('Giám sát', 475, 228, 247)}</div>
    </div>`;
    }
    function ubktBox3Html() {
        const rows = [['Cách chức', '#2c7dd2'], ['Cảnh cáo', '#d8a50c'], ['Khiển trách', '#d25a19'], ['Khai trừ', '#d33a44']];
        const vals = { 'Đảng viên': [1, 6, 8, 20], 'Tổ chức Đảng': [0, 0, 0, 0] };
        const col = (label, icon) => `<div style="background:rgba(6,28,52,.6);border:1px solid rgba(87,178,255,.2);border-radius:10px;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-weight:800;color:#fff;font-size:11.5px">${label}</span><span style="background:rgba(87,178,255,.16);border-radius:8px;padding:2px 8px;font-size:11px">${icon}</span></div>
      ${rows.map((r, i) => `<div style="display:flex;align-items:center;gap:6px;font-size:10.5px;color:#c8dcec;margin-top:5px"><i style="width:8px;height:8px;border-radius:50%;background:${r[1]};display:inline-block;flex:0 0 auto"></i><span style="flex:1">${r[0]}</span><b>${vals[label][i]}</b></div>`).join('')}
    </div>`;
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',3)" title="Thi hành kỷ luật — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Thi hành kỷ luật</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">${col('Đảng viên', '👥')}${col('Tổ chức Đảng', '🏛')}</div>
    </div>`;
    }
    function ubktBox4Html() {
        const rows = [
            ['Kiểm tra tổ chức đảng cấp dưới thực hiện nhiệm vụ KTGS', 42, '#2c7dd2'],
            ['Kiểm tra việc thi hành kỷ luật của tổ chức đảng cấp dưới', 6, '#1baf7a'],
            ['Về thu, chi ngân sách và sản xuất kinh doanh', 0, '#d33a44'],
            ['Về thu, nộp, quản lý và sử dụng đảng phí', 43, '#8b5cf6']
        ];
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',4)" title="Kiểm tra UBKT — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kiểm tra của UBKT các cấp (kiểm tra việc thực hiện nhiệm vụ KTGS và THKL và tài chính đảng)</div>
      <div style="display:grid;gap:10px;margin-top:8px">${rows.map(r => `<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#dceeff"><i style="width:9px;height:9px;border-radius:50%;background:${r[2]};flex:0 0 auto"></i><span style="flex:1">${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('')}</div>
    </div>`;
    }
    const UBKT_DOAN_DATA = [
        ['Đoàn 1', 2, 2, 2, 8], ['Đoàn 2', 3, 3, 0, 40], ['Đoàn 3', 3, 3, 0, 8], ['Đoàn 4', 3, 3, 0, 14],
        ['Đoàn 5', 3, 3, 0, 12], ['Đoàn 6', 3, 3, 0, 31], ['Đoàn 7', 3, 3, 2, 19], ['Đoàn 8', 4, 4, 4, 23],
        ['Đoàn 9', 4, 4, 0, 19], ['Đoàn 10', 4, 4, 0, 37], ['Đoàn 11', 4, 4, 0, 31], ['Đoàn 12', 4, 4, 0, 30]
    ];
    function ubktChartBoxHtml() {
        return `<div class="cat-chart-box" style="margin-top:14px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-ubkt',5)" title="Đoàn KTGS — click để fill số liệu">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <div class="cdl-title" style="margin:0">Thống kê tình hình đoàn kiểm tra, giám sát</div>
        <span style="height:30px;font-size:11.5px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid rgba(87,178,255,.32);background:#0a2338;color:#e8f4ff;border-radius:8px" title="Chưa hỗ trợ lọc theo tháng">Tháng 4/2026</span>
      </div>
      <div style="overflow-x:auto"><div style="position:relative;height:320px;min-width:${UBKT_DOAN_DATA.length * 150}px"><canvas id="ubktDoanChart"></canvas></div></div>
    </div>`;
    }
    let ubktDoanChartInstance = null;
    function initUbktDoanChart() {
        const canvas = document.getElementById('ubktDoanChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (ubktDoanChartInstance) { ubktDoanChartInstance.destroy(); ubktDoanChartInstance = null; }
        const labels = UBKT_DOAN_DATA.map(d => d[0]);
        const series = [
            { label: 'Đơn vị đã công bố/triển khai QĐ', color: '#7c6fe0', idx: 1 },
            { label: 'Đơn vị đã báo cáo', color: '#39d5ff', idx: 2 },
            { label: 'Đơn vị được kiểm tra đã làm việc', color: '#eda100', idx: 3 },
            { label: 'Khó khăn, kiến nghị', color: '#ffd54b', idx: 4 }
        ];
        ubktDoanChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: series.map(s => ({ label: s.label, data: UBKT_DOAN_DATA.map(d => d[s.idx]), backgroundColor: s.color, borderRadius: 3, maxBarThickness: 16 })) },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                categoryPercentage: 0.85, barPercentage: 0.85,
                scales: { y: { min: 0, max: 60, ticks: { stepSize: 10, color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 10 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 9.5 } } } }
            }
        });
    }
    /* ===== Giao diện riêng cho "Ban Tổ chức Thành ủy" — port đúng số liệu thật từ hệ thống IOC (network JSON) ===== */
    function tochucTopKpiHtml() {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-to-chuc',0)" title="CBCCVC — click để fill số liệu">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">CBCCVC khối Đảng, MTTQ</p><b style="font-size:20px;color:#fff">4.505</b></div>
        <span style="font-size:20px">📋</span>
      </div>
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-to-chuc',2)" title="TCCSĐ — click để fill số liệu">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Tổ chức cơ sở Đảng</p><b style="font-size:20px;color:#fff">5.887</b></div>
        <span style="font-size:20px">👥</span>
      </div>
    </div>`;
    }
    const TOCHUC_BIENCHE_DATA = { labels: ['Biên chế CBCC, VC', 'LĐHĐ theo Nghị định 111', 'LĐHĐ theo Nghị định 173'], giao: [5238, 723, 0], hienco: [4505, 570, 40] };
    function tochucBox1Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',3)" title="Biên chế khối Đảng — click cột/bar cụ thể để fill số liệu tương ứng">
      <div class="cdl-title" style="text-align:center;font-size:11px">Biên chế khối Đảng, đoàn thể</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienCheChart"></canvas></div>
    </div>`;
    }
    let tochucBienCheChartInstance = null;
    function initTochucBienCheChart() {
        const canvas = document.getElementById('tochucBienCheChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tochucBienCheChartInstance) { tochucBienCheChartInstance.destroy(); tochucBienCheChartInstance = null; }
        tochucBienCheChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: TOCHUC_BIENCHE_DATA.labels, datasets: [
                    { label: 'Số được giao', data: TOCHUC_BIENCHE_DATA.giao, backgroundColor: '#38A13E', borderRadius: 3, maxBarThickness: 36 },
                    { label: 'Số hiện có', data: TOCHUC_BIENCHE_DATA.hienco, backgroundColor: '#C9FFCC', borderRadius: 3, maxBarThickness: 36 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TOCHUC_BIENCHE_DATA.giao, ...TOCHUC_BIENCHE_DATA.hienco) * 1.15), ticks: { color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 9.5 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 9.5 } } } },
                onClick: (e, els) => { if (els.length) { const el = els[0]; const v = TOCHUC_BIENCHE_DATA[['giao', 'hienco'][el.datasetIndex]][el.index]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 3, v, ['Giao', 'Hiện có'][el.datasetIndex] + ' - ' + TOCHUC_BIENCHE_DATA.labels[el.index]); } },
                onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
            }
        });
    }
    /* Chỉ có số liệu chính xác của Tháng 3/2026 (từ tooltip thật); 5 tháng trước ước lượng theo đúng hình dạng đường trong ảnh gốc */
    const TOCHUC_DANHGIA_MONTHS = ['10/2025', '11/2025', '12/2025', '01/2026', '02/2026', '03/2026'];
    const TOCHUC_DANHGIA_DATA = [
        { label: 'Không hoàn thành nhiệm vụ', color: '#d33a44', data: [65, 58, 62, 55, 60, 59] },
        { label: 'Hoàn thành nhiệm vụ', color: '#d8a50c', data: [1250, 1280, 1230, 1260, 1240, 1214] },
        { label: 'Hoàn thành tốt nhiệm vụ', color: '#2fb174', data: [130000, 127000, 122000, 131000, 131000, 115052] },
        { label: 'Hoàn thành xuất sắc nhiệm vụ', color: '#39d5ff', data: [21500, 22000, 21800, 22300, 22400, 22621] }
    ];
    function tochucBox2Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',4)" title="Đánh giá cán bộ — click từng đường/month để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kết quả đánh giá cán bộ hàng tháng (Tháng 3/2026 chính xác — các tháng trước ước lượng theo xu hướng)</div>
      <div style="position:relative;height:220px;margin-top:8px"><canvas id="tochucDanhGiaChart"></canvas></div>
    </div>`;
    }
    let tochucDanhGiaChartInstance = null;
    function initTochucDanhGiaChart() {
        const canvas = document.getElementById('tochucDanhGiaChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tochucDanhGiaChartInstance) { tochucDanhGiaChartInstance.destroy(); tochucDanhGiaChartInstance = null; }
        tochucDanhGiaChartInstance = new Chart(canvas, {
            type: 'line',
            data: { labels: TOCHUC_DANHGIA_MONTHS, datasets: TOCHUC_DANHGIA_DATA.map(s => ({ label: s.label, data: s.data, borderColor: s.color, backgroundColor: s.color, pointBackgroundColor: s.color, pointRadius: 4, tension: .3, fill: false })) },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, ticks: { color: '#a8c3d8', font: { size: 9.5 }, callback: v => (v / 1000) + ' nghìn' }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 9.5 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 10, font: { size: 9 } } } },
                onClick: (e, els) => { if (els.length) { const el = els[0]; const v = TOCHUC_DANHGIA_DATA[el.datasetIndex].data[el.index]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 4, v, TOCHUC_DANHGIA_DATA[el.datasetIndex].label + ' - ' + TOCHUC_DANHGIA_MONTHS[el.index]); } },
                onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
            }
        });
    }
    const TOCHUC_BIENDONG_DATA = [['Kết nạp mới', 591, '#38A13E'], ['Chuyển SHĐ đến', 1357, '#00D5FF'], ['Chuyển SHĐ đi', 1021, '#FD9843'], ['Xóa tên, cho ra khỏi Đảng', 60, '#E80054'], ['Từ trần', 314, '#CACACA']];
    function tochucBox3Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',5)" title="Biến động đảng viên — click từng cột để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Biến động đảng viên theo thời gian</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="tochucBienDongChart"></canvas></div>
    </div>`;
    }
    let tochucBienDongChartInstance = null;
    function initTochucBienDongChart() {
        const canvas = document.getElementById('tochucBienDongChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tochucBienDongChartInstance) { tochucBienDongChartInstance.destroy(); tochucBienDongChartInstance = null; }
        tochucBienDongChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: TOCHUC_BIENDONG_DATA.map(d => d[0]), datasets: [{ data: TOCHUC_BIENDONG_DATA.map(d => d[1]), backgroundColor: TOCHUC_BIENDONG_DATA.map(d => d[2]), borderRadius: 3, maxBarThickness: 34 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TOCHUC_BIENDONG_DATA.map(d => d[1])) * 1.15), ticks: { color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 9 } }, grid: { display: false } } },
                plugins: { legend: { display: false } },
                onClick: (e, els) => { if (els.length) { const el = els[0]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 5, TOCHUC_BIENDONG_DATA[el.index][1], TOCHUC_BIENDONG_DATA[el.index][0]); } },
                onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
            }
        });
    }
    function donutCenterTextPlugin(line1, line2) {
        return {
            id: 'donutCenterText',
            afterDraw(chart) {
                const { ctx, chartArea } = chart; if (!chartArea) return;
                const cx = (chartArea.left + chartArea.right) / 2, cy = (chartArea.top + chartArea.bottom) / 2;
                ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff'; ctx.font = "700 17px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line1, cx, cy - 8);
                ctx.fillStyle = '#a8c3d8'; ctx.font = "600 9.5px 'Be Vietnam Pro',Arial,sans-serif";
                ctx.fillText(line2, cx, cy + 11);
                ctx.restore();
            }
        };
    }
    function tochucBox4Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="if(window.__chartElClicked)window.__chartElClicked=false;else catDonutSegmentClick('DANG','dang-to-chuc',6)" title="Cơ cấu tổ chức Đảng — click từng phần để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Cơ cấu tổ chức Đảng trực thuộc</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="tochucCoCauChart"></canvas></div>
    </div>`;
    }
    let tochucCoCauChartInstance = null;
    function initTochucCoCauChart() {
        const canvas = document.getElementById('tochucCoCauChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tochucCoCauChartInstance) { tochucCoCauChartInstance.destroy(); tochucCoCauChartInstance = null; }
        const cocauLabels = ['Đảng bộ cơ sở: 862', 'Chi bộ cơ sở: 3.499']; const cocauVals = [862, 3499];
        tochucCoCauChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: { labels: cocauLabels, datasets: [{ data: cocauVals, backgroundColor: ['#6f6fe0', '#2fb174'], borderColor: '#04101d', borderWidth: 2 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%',
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } },
                onClick: (e, els) => { if (els.length) { const el = els[0]; window.__chartElClicked = true; catFillTableColumn('DANG', 'dang-to-chuc', 6, cocauVals[el.index], cocauLabels[el.index].replace(':', '=')); } },
                onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
            },
            plugins: [donutCenterTextPlugin('4.361', 'TCCSĐ')]
        });
    }
    function tochucBox5Html() {
        const abroadRows = [['Công tác', 60, '#39d5ff'], ['Việc riêng', 598, '#8fe3b0']];
        const maxAbroad = Math.max(...abroadRows.map(r => r[1]));
        const abroadBars = abroadRows.map(r => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:14px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1] / maxAbroad * 100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
        const policyRows = [['Nghỉ điều dưỡng', 315, '#FFEF98'], ['Thăm hỏi', 15, '#FFC61B'], ['Phúng viếng', 14, '#E87F00'], ['Lễ Tang', 15, '#CACACA']];
        const maxPolicy = Math.max(...policyRows.map(r => r[1]));
        const policyBars = policyRows.map(r => `<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff;margin-bottom:3px"><span>${r[0]}</span><b>${fmt(r[1])}</b></div><div style="height:12px;background:#061a2f;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(r[1] / maxPolicy * 100).toFixed(1)}%;background:${r[2]}"></div></div></div>`).join('');
        return `<div class="cat-chart-box" style="margin-top:14px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-to-chuc',7)" title="Chính trị nội bộ — click để fill số liệu vào bảng">
      <div class="cdl-title" style="text-align:center;font-size:11px">Kết quả thực hiện công tác bảo vệ chính trị nội bộ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:10px">
        <div>
          <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Số cán bộ, đảng viên đi nước ngoài</p>
          ${abroadBars}
        </div>
        <div style="text-align:center">
          <p style="font-size:10.5px;color:var(--text-muted);margin:0 0 8px">Kết quả thẩm định chính trị nội bộ</p>
          <b style="font-size:20px;color:#fff">2.304</b><span style="font-size:10px;color:var(--text-muted)"> trường hợp</span>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;text-align:left">
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🔴 Có vấn đề về chính trị</span><b>36</b></div>
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>🟢 Không có vấn đề</span><b>2.268</b></div>
          </div>
        </div>
        <div>
          <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin:0 0 8px">Thực hiện chế độ, chính sách</p>
          ${policyBars}
        </div>
      </div>
    </div>`;
    }
    /* ===== Giao diện riêng cho "Ban Nội chính Thành ủy" — đúng số liệu thật từ network JSON ===== */
    function noichinhTopKpiHtml() {
        return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',0)" title="Tiếp công dân — click để fill số liệu">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Tổng số cuộc tiếp công dân</p><b style="font-size:20px;color:#fff">3</b></div>
        <span style="font-size:20px">🏠</span>
      </div>
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',0)" title="Tiếp công dân — click để fill số liệu">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Tổng số lượt công dân</p><b style="font-size:20px;color:#fff">8</b></div>
        <span style="font-size:20px">📋</span>
      </div>
    </div>`;
    }
    const NOICHINH_VANBAN_DATA = [['An ninh trật tự', 1], ['Phòng chống tham nhũng lãng phí tiêu cực', 3], ['Cải cách tư pháp', 3], ['Công tác tham mưu xử lý vụ án vụ việc', 1], ['Tiếp nhận, xử lý đơn thư tiếp công dân', 1]];
    function noichinhBox1Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',1)" title="Văn bản tham mưu — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Số văn bản tham mưu trong tháng cho Thành ủy lãnh đạo chỉ đạo</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhVanBanChart"></canvas></div>
    </div>`;
    }
    let noichinhVanBanChartInstance = null;
    function initNoichinhVanBanChart() {
        const canvas = document.getElementById('noichinhVanBanChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (noichinhVanBanChartInstance) { noichinhVanBanChartInstance.destroy(); noichinhVanBanChartInstance = null; }
        noichinhVanBanChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: NOICHINH_VANBAN_DATA.map(d => d[0]), datasets: [{ data: NOICHINH_VANBAN_DATA.map(d => d[1]), backgroundColor: '#FFE96B', borderRadius: 3, maxBarThickness: 30 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, suggestedMax: Math.max(...NOICHINH_VANBAN_DATA.map(d => d[1])) + 1, ticks: { stepSize: 1, color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 8.5 } }, grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }
    function noichinhBox2Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',2)" title="Cháy nổ — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Vụ việc an toàn cháy nổ</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="noichinhChayNoChart"></canvas></div>
    </div>`;
    }
    let noichinhChayNoChartInstance = null;
    function initNoichinhChayNoChart() {
        const canvas = document.getElementById('noichinhChayNoChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (noichinhChayNoChartInstance) { noichinhChayNoChartInstance.destroy(); noichinhChayNoChartInstance = null; }
        noichinhChayNoChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: { labels: ['Ít nghiêm trọng: 58', 'Nghiêm trọng: 1'], datasets: [{ data: [58, 1], backgroundColor: ['#6FD195', '#7086FD'], borderColor: '#04101d', borderWidth: 2 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%',
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } }
            },
            plugins: [donutCenterTextPlugin('59', 'vụ việc')]
        });
    }
    const NOICHINH_KHIEUNAI_DATA = [['Khiếu nại đông người', 90, '#00D5FF'], ['Tố cáo đông người', 606, '#E80054']];
    function noichinhBox3Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-noi-chinh',3)" title="Khiếu nại tố cáo — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">Số lượt công dân theo khiếu nại, tố cáo đông người</div>
      <div style="position:relative;height:200px;margin-top:8px"><canvas id="noichinhKhieuNaiChart"></canvas></div>
    </div>`;
    }
    let noichinhKhieuNaiChartInstance = null;
    function initNoichinhKhieuNaiChart() {
        const canvas = document.getElementById('noichinhKhieuNaiChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (noichinhKhieuNaiChartInstance) { noichinhKhieuNaiChartInstance.destroy(); noichinhKhieuNaiChartInstance = null; }
        noichinhKhieuNaiChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: NOICHINH_KHIEUNAI_DATA.map(d => d[0]), datasets: [{ data: NOICHINH_KHIEUNAI_DATA.map(d => d[1]), backgroundColor: NOICHINH_KHIEUNAI_DATA.map(d => d[2]), borderRadius: 3, maxBarThickness: 60 }] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...NOICHINH_KHIEUNAI_DATA.map(d => d[1])) * 1.15), ticks: { color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });
    }
    /* ===== Giao diện riêng cho "Ban Tuyên giáo và Dân vận Thành ủy" — đúng số liệu thật từ network JSON ===== */
    const TUYENGIAO_DULUAN_CATS = ['Tin bài tuyên truyền qua các kênh thông tin', 'Số báo cáo viên hiện có cấp TP/ cơ sở', 'Số CTV hiện có cấp TP/ cơ sở'];
    const TUYENGIAO_DULUAN_SERIES = [
        { label: 'Tin bài tuyên truyền qua các kênh thông tin', color: '#FFC300', data: [474, 0, 0] },
        { label: 'Cấp TP', color: '#6FD195', data: [0, 324, 70] },
        { label: 'Cấp cơ sở', color: '#93C381', data: [0, 660, 882] }
    ];
    function tuyengiaoBox1Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-tuyen-giao',2)" title="Dư luận xã hội — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:12px">Nắm bắt dư luận xã hội (Tuần 10/2026)</div>
      <div style="position:relative;height:300px;margin-top:8px"><canvas id="tuyengiaoDuLuanChart"></canvas></div>
    </div>`;
    }
    let tuyengiaoDuLuanChartInstance = null;
    function initTuyengiaoDuLuanChart() {
        const canvas = document.getElementById('tuyengiaoDuLuanChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tuyengiaoDuLuanChartInstance) { tuyengiaoDuLuanChartInstance.destroy(); tuyengiaoDuLuanChartInstance = null; }
        tuyengiaoDuLuanChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: TUYENGIAO_DULUAN_CATS, datasets: TUYENGIAO_DULUAN_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 40 })) },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TUYENGIAO_DULUAN_SERIES.flatMap(s => s.data)) * 1.15), ticks: { color: '#a8c3d8', font: { size: 11 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 11 } } } }
            }
        });
    }
    const TUYENGIAO_DANVAN_CATS = ['Cấp xã, phường', 'Cấp cơ sở', 'Cấp thành phố'];
    const TUYENGIAO_DANVAN_BARS = [
        { label: 'Lĩnh vực kinh tế', color: '#7086FD', data: [1126, 873, 210] },
        { label: 'Lĩnh vực văn hóa - xã hội', color: '#6FD195', data: [6655, 4618, 719] },
        { label: 'Lĩnh vực an ninh quốc phòng', color: '#FD9843', data: [1103, 692, 122] },
        { label: 'Lĩnh vực xây dựng hệ thống chính trị', color: '#FFD54B', data: [1163, 948, 185] }
    ];
    const TUYENGIAO_DANVAN_LINES = [
        { label: 'Tổng số tập thể đăng ký', color: '#eda100', data: [6335, 3790, 847] },
        { label: 'Tổng số cá nhân đăng ký', color: '#39d5ff', data: [3712, 3341, 389] }
    ];
    function tuyengiaoBox2Html() {
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-tuyen-giao',0)" title="Dân vận khéo — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng hợp việc đăng ký thực hiện mô hình dân vận khéo (Năm 2026)</div>
      <div style="position:relative;height:320px;margin-top:8px"><canvas id="tuyengiaoDanVanChart"></canvas></div>
    </div>`;
    }
    let tuyengiaoDanVanChartInstance = null;
    function initTuyengiaoDanVanChart() {
        const canvas = document.getElementById('tuyengiaoDanVanChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (tuyengiaoDanVanChartInstance) { tuyengiaoDanVanChartInstance.destroy(); tuyengiaoDanVanChartInstance = null; }
        const barDatasets = TUYENGIAO_DANVAN_BARS.map(s => ({ type: 'bar', label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 26 }));
        const lineDatasets = TUYENGIAO_DANVAN_LINES.map(s => ({ type: 'line', label: s.label, data: s.data, borderColor: s.color, backgroundColor: s.color, pointRadius: 4, tension: .3, fill: false }));
        tuyengiaoDanVanChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: TUYENGIAO_DANVAN_CATS, datasets: [...barDatasets, ...lineDatasets] },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, ticks: { color: '#a8c3d8', font: { size: 10.5 }, callback: v => (v / 1000) + ' nghìn' }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 11 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 11, font: { size: 10 } } } }
            }
        });
    }
    /* ===== Giao diện riêng cho "VPTU · Theo dõi nhiệm vụ" — đúng số liệu thật theo từng đầu mối giao việc ===== */
    const VPTU_STATUS_COLORS = { 'CHT quá hạn': '#e0218a', 'CHT sắp quá hạn': '#f39c12', 'CHT trong hạn': '#39d5ff', 'HT quá hạn': '#8b5cf6', 'HT đúng hạn': '#2fb174' };
    const VPTU_DATA = [
        { title: 'Trung ương giao Thành ủy', total: 403, rows: [['CHT quá hạn', 6], ['CHT sắp quá hạn', 2], ['CHT trong hạn', 180], ['HT quá hạn', 40], ['HT đúng hạn', 175]] },
        { title: 'UBND Thành phố', total: 981, rows: [['CHT quá hạn', 88], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 267], ['HT quá hạn', 78], ['HT đúng hạn', 548]] },
        { title: 'HĐND Thành phố', total: 28, rows: [['CHT quá hạn', 3], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 8], ['HT quá hạn', 2], ['HT đúng hạn', 15]] },
        { title: 'Ủy ban MTTQ Việt Nam Thành phố', total: 30, rows: [['CHT quá hạn', 3], ['CHT sắp quá hạn', 0], ['CHT trong hạn', 19], ['HT quá hạn', 3], ['HT đúng hạn', 5]] }
    ];
    function vptuBoxHtml(idx) {
        const d = VPTU_DATA[idx];
        const rows = d.rows.map(r => `<div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${VPTU_STATUS_COLORS[r[0]]};margin-right:6px"></i>${esc(r[0])}</span><b>${fmt(r[1])}</b></div>`).join('');
        return `<div class="cat-chart-box" style="cursor:pointer" onclick="catDonutSegmentClick('DANG','dang-vptu',0)" title="Theo dõi nhiệm vụ — click để fill số liệu">
      <div class="cdl-title" style="text-align:center;font-size:11px">${esc(d.title)}</div>
      <div style="position:relative;height:170px;margin-top:8px"><canvas id="vptuChart${idx}"></canvas></div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${rows}</div>
    </div>`;
    }
    let vptuChartInstances = [];
    function initVptuCharts() {
        vptuChartInstances.forEach(c => c && c.destroy()); vptuChartInstances = [];
        VPTU_DATA.forEach((d, idx) => {
            const canvas = document.getElementById('vptuChart' + idx); if (!canvas || typeof Chart === 'undefined') return;
            const labels = d.rows.map(r => r[0]), data = d.rows.map(r => r[1]), colors = d.rows.map(r => VPTU_STATUS_COLORS[r[0]]);
            vptuChartInstances[idx] = new Chart(canvas, {
                type: 'doughnut',
                data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: '#04101d', borderWidth: 2 }] },
                options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { display: false } } },
                plugins: [donutCenterTextPlugin(fmt(d.total), 'nhiệm vụ')]
            });
        });
    }
    function openCategoryDetail(role, catId) {
        if (!canSeeRole(role)) { toast('Không có quyền xem lĩnh vực này.'); return }
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
        cat.role = role;
        const total = catTotal(cat);
        document.getElementById('drawerTitleNotify').textContent = `Lĩnh vực: ${cat.name}`;
        document.getElementById('drawerSubNotify').textContent = `${cat.items.length} chỉ tiêu · ${fmt(total)} bản ghi`;
        const head = `<div class="category-detail-head"><div><div class="field-category-meta"><span class="badge gold">${fmt(total)} bản ghi</span><span class="badge">${cat.items.length} chỉ tiêu</span>${cat.types.map(t => `<span class="badge">${t}</span>`).join('')}</div></div><button class="primary" onclick="openFieldScenarioSelector('cat::${role}::${catId}')">⚡ Chọn kịch bản xử lý</button></div>`;
        let cardsHtml;
        if (catId === 'dang-ubkt') {
            cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${ubktBox1Html()}${ubktBox2Html()}${ubktBox3Html()}${ubktBox4Html()}</div>
        ${ubktChartBoxHtml()}
      </div>`;
        } else if (catId === 'dang-to-chuc') {
            cardsHtml = `<div>
        ${tochucTopKpiHtml()}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${tochucBox1Html()}${tochucBox2Html()}${tochucBox3Html()}${tochucBox4Html()}</div>
        ${tochucBox5Html()}
      </div>`;
        } else if (catId === 'dang-noi-chinh') {
            cardsHtml = `<div>
        ${noichinhTopKpiHtml()}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${noichinhBox1Html()}${noichinhBox2Html()}</div>
        <div style="margin-top:14px">${noichinhBox3Html()}</div>
      </div>`;
        } else if (catId === 'dang-tuyen-giao') {
            cardsHtml = `<div>
        <div style="display:grid;gap:14px">${tuyengiaoBox1Html()}${tuyengiaoBox2Html()}</div>
      </div>`;
        } else if (catId === 'dang-vptu') {
            cardsHtml = `<div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${vptuBoxHtml(0)}${vptuBoxHtml(1)}${vptuBoxHtml(2)}${vptuBoxHtml(3)}</div>
      </div>`;
        } else {
            cardsHtml = `<div class="cat-item-list">${cat.items.map((it, idx) => catItemCardHtml(role, catId, idx, it)).join('')}</div>`;
        }
        const donutHtml = renderCatDonut(cat);
        const twoCol = `<div class="cat-two-col">${cardsHtml}${genUnitTableHtml(cat)}</div>`;
        document.getElementById('drawerBodyNotify').innerHTML = catKpiRowHtml(cat) + head + donutHtml + twoCol + fieldScenarioSummary(`cat::${role}::${catId}`);
        openDrawerNoti();
        flushPendingDimCharts();
        syncGenUnitBoxHeight();
        if (catId === 'dang-ubkt') initUbktDoanChart();
        if (catId === 'dang-to-chuc') { initTochucBienCheChart(); initTochucDanhGiaChart(); initTochucBienDongChart(); initTochucCoCauChart(); }
        if (catId === 'dang-noi-chinh') { initNoichinhVanBanChart(); initNoichinhChayNoChart(); initNoichinhKhieuNaiChart(); }
        if (catId === 'dang-tuyen-giao') { initTuyengiaoDuLuanChart(); initTuyengiaoDanVanChart(); }
        if (catId === 'dang-vptu') initVptuCharts();
    }

    /* Lớp 3a: chi tiết 1 chỉ tiêu con — KPI + Chart.js doughnut trạng thái + bảng bản ghi có tìm kiếm */
    let itemStatusChartInstance = null;
    function initItemStatusChart(cnts) {
        const canvas = document.getElementById('itemStatusCanvas'); if (!canvas || typeof Chart === 'undefined') return;
        if (itemStatusChartInstance) { itemStatusChartInstance.destroy(); itemStatusChartInstance = null; }
        const entries = CAT_ST.filter(s => cnts[s.k]);
        itemStatusChartInstance = new Chart(canvas, { type: 'doughnut', data: { labels: entries.map(s => s.l), datasets: [{ data: entries.map(s => cnts[s.k]), backgroundColor: entries.map(s => s.c) }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#b7d4ee', boxWidth: 10, font: { size: 10 } } } } } });
    }
    /* Biểu đồ cột fake (port phong cách dashboard Giáo dục) cho trang chi tiết chỉ tiêu con dùng chung mọi sở */
    let catItemTrendChartInstance = null, catItemUnitChartInstance = null;
    function catItemFakeSeed(name) { return [...String(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0); }
    function catItemExtraChartsHtml(seed) {
        return `<div class="cat-charts-row" style="grid-template-columns:1fr 1fr">
      <div class="cat-chart-box"><div class="cdl-title">Xu hướng cập nhật theo thời gian</div><div class="cat-chart-canvas-wrap"><canvas id="catItemTrendCanvas"></canvas></div></div>
      <div class="cat-chart-box"><div class="cdl-title">Phân bổ theo đơn vị phụ trách</div><div class="cat-chart-canvas-wrap"><canvas id="catItemUnitCanvas"></canvas></div></div>
    </div>`;
    }
    function initCatItemExtraCharts(seed) {
        if (typeof Chart === 'undefined') return;
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
        const trendData = months.map((_, i) => 20 + ((seed + i * 17) % 80));
        const trendCanvas = document.getElementById('catItemTrendCanvas');
        if (trendCanvas) {
            if (catItemTrendChartInstance) { catItemTrendChartInstance.destroy(); catItemTrendChartInstance = null; }
            catItemTrendChartInstance = new Chart(trendCanvas, { type: 'bar', data: { labels: months, datasets: [{ data: trendData, backgroundColor: '#2a78d6', borderRadius: 4, maxBarThickness: 32 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        }
        const unitNames = [0, 3, 6, 9].map(o => units[(seed + o) % units.length]);
        const unitData = unitNames.map((_, i) => 10 + ((seed + i * 23) % 60));
        const unitCanvas = document.getElementById('catItemUnitCanvas');
        if (unitCanvas) {
            if (catItemUnitChartInstance) { catItemUnitChartInstance.destroy(); catItemUnitChartInstance = null; }
            catItemUnitChartInstance = new Chart(unitCanvas, { type: 'bar', data: { labels: unitNames, datasets: [{ data: unitData, backgroundColor: '#1baf7a', borderRadius: 4, maxBarThickness: 28 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        }
    }
    function itemRecordsTableHtml(recs) {
        return `<div class="iip-search-row"><input class="iip-search" placeholder="Tìm mã, tiêu đề, hạn..." oninput="filterItemRecords(this)"/><span class="iip-rec-count">${fmt(recs.length)} bản ghi</span></div><div class="iip-table-wrap"><table class="iip-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead><tbody>${iipRowsHtml(recs)}</tbody></table></div>`;
    }
    function filterItemRecords(input) {
        const wrap = input.closest('.cat-chart-box'); if (!wrap) return;
        const role = wrap.dataset.role, name = decodeURIComponent(wrap.dataset.nameEnc || '');
        const q = input.value.trim().toLowerCase();
        let recs = indicatorRecordsFor(role, name);
        if (q) recs = recs.filter(r => ((r.id || '') + ' ' + (r.title || '') + ' ' + (r.due || '')).toLowerCase().includes(q));
        const tbody = wrap.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(recs);
        const cnt = wrap.querySelector('.iip-rec-count'); if (cnt) cnt.textContent = fmt(recs.length) + (q ? ' kết quả' : ' bản ghi');
    }
    /* ===== Hiển thị phân tổ (breakdown) theo chỉ tiêu — dùng chung cho mọi nơi (card lưới, card lĩnh vực, drawer chi tiết) =====
       Quy tắc chọn biểu đồ:
       1) Phân tổ dạng % (nhãn có "%") → radial ring.
       2) Phân tổ dạng bar ≤3 mục và không mục nào quá nhỏ → thanh % xếp chồng (nhãn nổi).
       3) Phân tổ dạng bar 4+ mục, hoặc có mục < 8% tổng → thanh ngang xếp hạng (không xếp chồng).
       4) Phân tổ dạng stat khác (không phải %) → thẻ KPI rời. */
    const PART_PAL = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#39d5ff', '#d33a44', '#898781'];
    function isPercentLabel(l) { return /%/.test(l || ''); }
    function radialRingSvg(pct, size, strokeW, color) {
        pct = Math.max(0, Math.min(100, Number(pct) || 0));
        const r = (size - strokeW) / 2, c = size / 2, circ = 2 * Math.PI * r, dash = circ * pct / 100;
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="${strokeW}"/><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/><text x="${c}" y="${(c + size * 0.07).toFixed(1)}" text-anchor="middle" font-size="${(size * 0.24).toFixed(0)}" font-weight="900" fill="#fff">${Math.round(pct)}%</text></svg>`;
    }
    function shouldRankBar(items) {
        const total = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
        const minShare = Math.min(...items.map(x => (Number(x.value) || 0) / total));
        return items.length >= 4 || minShare < 0.08;
    }
    function rankedBarHtml(items) {
        const max = Math.max(...items.map(x => Number(x.value) || 0)) || 1;
        const sorted = [...items].sort((a, b) => b.value - a.value);
        const rows = sorted.map((x, i) => `<div class="rank-row"><div class="rank-row-top"><span class="rank-label">${esc(x.label)}</span><b class="rank-value">${fmt(x.value)}</b></div><div class="rank-track"><div class="rank-fill" style="width:${(x.value / max * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}"></div></div></div>`).join('');
        return `<div class="rank-list">${rows}</div>`;
    }
    function stackedBarHtml(items) {
        const tot = items.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
        let cum = 0;
        const segs = items.map((x, i) => `<div class="seg" style="width:${(x.value / tot * 100).toFixed(1)}%;background:${PART_PAL[i % PART_PAL.length]}" title="${esc(x.label)}: ${fmt(x.value)}"></div>`).join('');
        const labels = items.map((x, i) => { const w = x.value / tot * 100, center = cum + w / 2; cum += w; return `<div style="position:absolute;top:-24px;left:${center.toFixed(2)}%;transform:translateX(-50%);background:${PART_PAL[i % PART_PAL.length]};color:#fff;font-weight:900;font-size:12px;padding:2px 6px;border-radius:5px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35)">${fmt(x.value)}</div>`; }).join('');
        const legend = `<div class="legend" style="margin-top:8px;font-size:10.5px">${items.map((x, i) => `<span><i class="sw" style="background:${PART_PAL[i % PART_PAL.length]}"></i>${esc(x.label)} <b>${fmt(x.value)}</b></span>`).join('')}</div>`;
        return `<div class="bar" style="height:22px;position:relative;margin-top:24px;overflow:visible">${segs}${labels}</div>${legend}`;
    }
    function barDimBodyHtml(p) { return shouldRankBar(p.items) ? rankedBarHtml(p.items) : stackedBarHtml(p.items); }
    /* Biểu đồ Chart.js thật (donut/bar ngang) cho phân tổ chỉ tiêu — dùng chung cho mọi lĩnh vực, cùng phong cách với dashboard Giáo dục */
    function chartCanvasId() { window.__dimChartSeq = (window.__dimChartSeq || 0) + 1; return `dimChart${window.__dimChartSeq}`; }
    function queueDimChart(id, type, labels, data, colors) { (window.__pendingDimCharts = window.__pendingDimCharts || []).push({ id, type, labels, data, colors }); }
    function flushPendingDimCharts() {
        const list = window.__pendingDimCharts || []; window.__pendingDimCharts = [];
        if (typeof Chart === 'undefined') return;
        list.forEach(c => {
            const canvas = document.getElementById(c.id); if (!canvas) return;
            const isDonut = c.type === 'doughnut';
            new Chart(canvas, {
                type: c.type,
                data: { labels: isDonut ? c.labels.map((l, i) => `${l}: ${fmt(c.data[i])}`) : c.labels, datasets: [{ data: c.data, backgroundColor: c.colors, borderRadius: isDonut ? 0 : 4, maxBarThickness: 26 }] },
                options: {
                    indexAxis: isDonut ? undefined : 'y', responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: isDonut, position: 'bottom', labels: { color: '#dceeff', boxWidth: 13, padding: 8, font: { size: 12, weight: 700 } } } },
                    scales: isDonut ? {} : { x: { ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { color: 'rgba(87,178,255,.12)' } }, y: { ticks: { color: '#dceeff', font: { size: 11 } }, grid: { display: false } } }
                }
            });
        });
    }
    function chartDimBodyHtml(p) {
        const items = p.items; const id = chartCanvasId();
        const isDonut = !shouldRankBar(items);
        const colors = items.map((x, i) => PART_PAL[i % PART_PAL.length]);
        queueDimChart(id, isDonut ? 'doughnut' : 'bar', items.map(x => x.label), items.map(x => Number(x.value) || 0), colors);
        const h = isDonut ? 200 : Math.max(120, items.length * 34 + 20);
        return `<div style="position:relative;height:${h}px;margin-top:4px"><canvas id="${id}"></canvas></div>`;
    }
    function statDimBodyHtml(p) {
        const pctItems = p.items.filter(x => isPercentLabel(x.label));
        const plainItems = p.items.filter(x => !isPercentLabel(x.label));
        let html = '';
        if (pctItems.length) html += `<div class="phanto-radial-row">${pctItems.map((x, i) => `<div class="phanto-radial-item">${radialRingSvg(x.value, 64, 7, PART_PAL[i % PART_PAL.length])}<span>${esc(x.label.replace(/\s*\(%\)\s*$/, ''))}</span></div>`).join('')}</div>`;
        if (plainItems.length) html += `<div class="cir-stat-grid">${plainItems.map(x => `<div class="cir-stat-tile"><p>${esc(x.label)}</p><b>${fmt(x.value)}</b></div>`).join('')}</div>`;
        return html;
    }
    function phanToDimBodyHtml(p) { return p.type === 'stat' ? statDimBodyHtml(p) : chartDimBodyHtml(p); }
    function catItemPartsHtml(parts) {
        if (!parts || !parts.length) return '';
        return `<div class="cat-parts-wrap">${parts.map(p => `<div class="cat-chart-box"><div class="cdl-title">${esc(p.dim)}</div>${phanToDimBodyHtml(p)}</div>`).join('')}</div>`;
    }
    function openCategoryItemDetail(role, catId, idx) {
        toast('Tạm thời chưa hỗ trợ xem chi tiết chỉ tiêu con.'); return;
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
        const it = cat.items[idx]; if (!it) return;
        const name = it[0], declared = Number(it[1]) || 0, freq = it[2], source = it[3], parts = it[4] || [];
        const recs = indicatorRecordsFor(role, name);
        const cnts = {}; CAT_ST.forEach(s => cnts[s.k] = recs.filter(r => r.status === s.k).length);
        document.getElementById('drawerTitleNotify').textContent = `Chỉ tiêu: ${name}`;
        document.getElementById('drawerSubNotify').textContent = `${cat.name} · ${source} · ${freq}`;
        const kpiTiles = [
            { label: 'Tổng bản ghi', value: fmt(recs.length || declared) },
            { label: 'Đã hoàn thành', value: fmt(cnts.done || 0) },
            { label: 'Đang thực hiện', value: fmt(cnts.doing || 0) },
            { label: 'Không đạt/quá hạn', value: fmt(cnts.overdue || 0) }
        ];
        const kpiHtml = `<div class="indicator-kpi-row">${kpiTiles.map(t => `<div class="indicator-kpi-tile"><p class="ikt-label">${t.label}</p><p class="ikt-value">${t.value}</p></div>`).join('')}</div>`;
        const partsHtml = parts.length ? `<p style="font-size:12px;color:var(--text-secondary);margin:14px 0 8px">Phân tổ theo chỉ tiêu</p>${catItemPartsHtml(parts)}` : '';
        const backBtn = `<button class="category-view-back" onclick="${role === 'UBND' ? 'openSoDashboard' : 'openCategoryDetail'}('${role}','${catId}')">← Quay lại ${cat.name}</button>`;
        const seed = catItemFakeSeed(name);
        document.getElementById('drawerBodyNotify').innerHTML = backBtn + kpiHtml + partsHtml + catItemExtraChartsHtml(seed) + fieldScenarioSummary(`item::${role}::${catId}::${idx}`);
        openDrawerNoti();
        initCatItemExtraCharts(seed);
        flushPendingDimCharts();
    }

    /* Lớp 3b: bảng tra cứu chỉ tiêu con theo đơn vị phụ trách (toàn màn hình popup) */

    /* Panel inline (accordion) hiện nhanh danh sách bản ghi của 1 chỉ tiêu, có thể lọc theo trạng thái */
    function iipRowsHtml(rs) {
        if (!rs.length) return '<tr><td colspan="5" class="iip-empty">Không có bản ghi phù hợp</td></tr>';
        return rs.map(r => {
            const si = catStatusInfo(r.status), p = Number(r.progress) || 0;
            return `<tr style="cursor:pointer" onclick="iipOpenRecord('${r.id}')"><td class="iip-td-id">${r.id}</td><td style="color:#cde4f8">${r.title || r.indicator || ''}</td><td style="white-space:nowrap"><span style="font-size:10px;padding:2px 7px;border-radius:999px;background:${si.c}22;color:${si.c};border:1px solid ${si.c}44">${si.l}</span></td><td style="white-space:nowrap;color:#7aaed4;font-size:10px">${r.due || '--'}</td><td style="white-space:nowrap"><div class="iip-pct-bar"><div class="iip-pct-fill" style="width:${p}%"></div></div>${p}%</td></tr>`;
        }).join('');
    }
    function iipOpenRecord(id) {
        openIndicatorDetail(id);
        setTimeout(() => {
            const body = document.getElementById('modalBodyNotify');
            if (body && !body.querySelector('.iip-modal-back')) body.insertAdjacentHTML('afterbegin', '<div class="iip-modal-back"><button class="ghost" onclick="closeModalNoti()">← Quay lại lĩnh vực</button></div>');
        }, 60);
    }
    function buildCatPanel(role, enc, statusKey) {
        const name = decodeURIComponent(enc);
        const all = indicatorRecordsFor(role, name);
        const rs = statusKey ? all.filter(r => r.status === statusKey) : all;
        const cnts = {}; CAT_ST.forEach(s => { cnts[s.k] = all.filter(r => r.status === s.k).length; });
        const st = statusKey ? catStatusInfo(statusKey) : null;
        const panel = document.createElement('div');
        panel.className = 'iip-wrap';
        panel.dataset.catEnc = enc; panel.dataset.catRole = role; panel.dataset.catStatus = statusKey || '';
        panel.innerHTML =
            `<div class="iip-head"><div class="iip-head-left"><span class="iip-head-title">${name}</span><span class="badge gold mono" style="font-size:10px">${fmt(all.length)} bản ghi</span>${st ? `<span class="badge" style="background:${st.c}22;color:${st.c};border:1px solid ${st.c}55">${st.l}</span>` : ''}</div><button class="iip-close-btn" onclick="this.closest('.iip-wrap').remove()">✕ Đóng</button></div>` +
            `<div class="iip-chips"><button class="iip-chip ${statusKey === '' ? 'iip-chip-active' : ''}" data-sk="" onclick="catPanelFilter(this,'${role}','${enc}','')"><span class="iip-chip-lbl">Tất cả</span><span class="iip-chip-cnt">${fmt(all.length)}</span></button>${CAT_ST.map(s => cnts[s.k] ? `<button class="iip-chip ${statusKey === s.k ? 'iip-chip-active' : ''}" data-sk="${s.k}" onclick="catPanelFilter(this,'${role}','${enc}','${s.k}')"><span class="iip-chip-dot" style="background:${s.c}"></span><span class="iip-chip-lbl">${s.l}</span><span class="iip-chip-cnt">${fmt(cnts[s.k])}</span></button>` : '').join('')}</div>` +
            `<div class="iip-search-row"><input class="iip-search" placeholder="Tìm mã, tiêu đề, hạn..." oninput="catIipSearch(this)"/><span class="iip-rec-count">${fmt(rs.length)} bản ghi</span></div>` +
            `<div class="iip-table-wrap"><table class="iip-table"><thead><tr><th>Mã</th><th>Tiêu đề</th><th>Trạng thái</th><th>Hạn</th><th>Tiến độ</th></tr></thead><tbody>${iipRowsHtml(rs)}</tbody></table></div>` +
            `<div style="padding:10px 0 2px;text-align:center"><button class="ghost" style="font-size:11px;padding:5px 14px" onclick="iipOpenAll(this)">Xem tất cả trong popup đầy đủ →</button></div>`;
        panel.dataset.iipCatRole = role; panel.dataset.iipEnc = enc;
        return panel;
    }
    function updateCatPanel(panel, role, enc, statusKey) {
        const name = decodeURIComponent(enc);
        const all = indicatorRecordsFor(role, name);
        const rs = statusKey ? all.filter(r => r.status === statusKey) : all;
        panel.dataset.catStatus = statusKey || '';
        panel.querySelectorAll('.iip-chip').forEach(b => b.classList.toggle('iip-chip-active', b.dataset.sk === statusKey));
        const badge = panel.querySelector('.badge:not(.gold)');
        if (statusKey) { const st = catStatusInfo(statusKey); const html = `<span class="badge" style="background:${st.c}22;color:${st.c};border:1px solid ${st.c}55">${st.l}</span>`; if (badge) badge.outerHTML = html; else panel.querySelector('.iip-head-left').insertAdjacentHTML('beforeend', html); }
        else if (badge) badge.remove();
        const tbody = panel.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(rs);
        const cnt = panel.querySelector('.iip-rec-count'); if (cnt) cnt.textContent = fmt(rs.length) + ' bản ghi';
    }
    function catSegClick(btn, role, enc, statusKey) {
        const row = btn.closest('.cat-axis-row'); const grid = row ? row.parentElement : null; if (!grid) return;
        const existing = grid.querySelector(`.iip-wrap[data-cat-enc="${enc}"]`);
        if (existing) {
            if (existing.dataset.catStatus === statusKey) { existing.remove(); return; }
            updateCatPanel(existing, role, enc, statusKey);
            setTimeout(() => existing.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40);
            return;
        }
        grid.querySelectorAll('.iip-wrap').forEach(el => el.remove());
        const panel = buildCatPanel(role, enc, statusKey);
        row.after(panel);
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function catPanelFilter(btn, role, enc, statusKey) { const panel = btn.closest('.iip-wrap'); if (panel) updateCatPanel(panel, role, enc, statusKey); }
    function catIipSearch(input) {
        const panel = input.closest('.iip-wrap'); if (!panel) return;
        const role = panel.dataset.catRole, enc = panel.dataset.catEnc, statusKey = panel.dataset.catStatus || '';
        const name = decodeURIComponent(enc);
        const q = input.value.trim().toLowerCase();
        const all = indicatorRecordsFor(role, name);
        let rs = statusKey ? all.filter(r => r.status === statusKey) : all;
        if (q) rs = rs.filter(r => ((r.id || '') + ' ' + (r.title || '') + ' ' + (r.due || '')).toLowerCase().includes(q));
        const tbody = panel.querySelector('tbody'); if (tbody) tbody.innerHTML = iipRowsHtml(rs);
        const el = panel.querySelector('.iip-rec-count'); if (el) el.textContent = fmt(rs.length) + (q ? ' kết quả' : ' bản ghi');
    }
    function iipOpenAll(btn) {
        const panel = btn.closest('.iip-wrap'); if (!panel) return;
        const role = panel.dataset.iipCatRole || panel.dataset.catRole;
        const catId = panel.closest('.cat-axis-grid')?.dataset.catId;
        const enc = panel.dataset.iipEnc;
        window.__lastCat = { role, catId };
        openIndicatorByName(role, enc);
        setTimeout(() => {
            const body = document.getElementById('drawerBodyNotify');
            if (body && !body.querySelector('.iip-back-in-drawer')) body.insertAdjacentHTML('afterbegin', `<div class="iip-back-in-drawer" style="margin-bottom:10px"><button class="ghost" style="font-size:11.5px;padding:6px 14px" onclick="(function(){const c=window.__lastCat;if(c)openCategoryDetail(c.role,c.catId);})()">← Quay lại lĩnh vực</button></div>`);
        }, 80);
    }

    /* Drawer đầy đủ 1 chỉ tiêu (donut + bảng có filter) */
    function openIndicatorByName(role, encodedName) {
        const name = decodeURIComponent(encodedName);
        let idx = indicators[role].findIndex(x => x[0] === name);
        if (idx < 0) { addIndicatorFromCategory(role, [name, 10, 'Tháng', 'Excel']); idx = indicators[role].length - 1; }
        openIndicator(role, idx);
    }
    function openIndicator(role, idx) {
        if (!canSeeRole(role)) { toast('Không có quyền xem chỉ tiêu này.'); return }
        const item = indicators[role][idx]; const [name, count] = item;
        if (isScheduleIndicator(name)) { openCalendar(role, name); return; }
        const rs = indicatorRecordsFor(role, name).map(r => ({ ...r, metric: 'indicator' }));
        currentDrawerRecords = rs;
        activeIndicatorPieStatus = '';
        document.getElementById('drawerTitleNotify').textContent = `Chỉ tiêu: ${name}`;
        document.getElementById('drawerSubNotify').textContent = `${fmt(count)} bản ghi · ${axisMeta[role].name}`;
        renderIndicatorList(currentDrawerRecords);
        openDrawerNoti();
    }
    function indicatorCounts(rs = currentDrawerRecords) {
        return statusDefs.map(st => ({ key: st.key, label: st.label, short: st.short, color: st.color, count: rs.filter(r => r.status === st.key).length }));
    }
    function renderIndicatorList(rs) {
        const counts = indicatorCounts(rs); const total = rs.length || 1;
        document.getElementById('drawerBodyNotify').innerHTML = `<div class="drawer-pie-layout"><div class="drawer-pie-box"><div id="indicatorDonut"></div><button class="ghost" style="margin-top:8px" onclick="setIndicatorStatusFilter('')">Xem tất cả trạng thái</button></div><div class="drawer-pie-side"><h4 style="margin:0">Phân bổ kết quả xử lý theo trạng thái</h4><div class="pie-legend" id="indicatorPieLegend"></div></div></div><div class="filters"><input id="qInd" placeholder="Tìm chỉ tiêu/bản ghi..." oninput="renderIndicatorRows()"/><select id="stInd" onchange="activeIndicatorPieStatus=this.value;renderIndicatorRows()"><option value="">Tất cả trạng thái</option>${statusDefs.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}</select><select id="unitInd" onchange="renderIndicatorRows()"><option value="">Tất cả đơn vị</option>${[...new Set(rs.map(r => r.unit))].map(u => `<option>${u}</option>`).join('')}</select><button class="ghost" onclick="openAssignmentForm()">Giao xử lý từ chỉ tiêu</button></div><div class="list-summary" id="indSummary"></div><div id="indRows"></div>`;
        document.getElementById('indicatorDonut').innerHTML = overviewSvg(counts.map(c => ({ key: c.key, label: c.short, value: c.count, color: c.color })), total, fmt(activeIndicatorPieStatus ? counts.find(c => c.key === activeIndicatorPieStatus)?.count || 0 : total), activeIndicatorPieStatus ? statusMeta(activeIndicatorPieStatus).short : 'Tổng bản ghi', 'indicatorPie');
        document.getElementById('indicatorPieLegend').innerHTML = counts.map(c => `<button class="${activeIndicatorPieStatus === c.key ? 'active' : ''}" onclick="setIndicatorStatusFilter('${c.key}')"><i class="sw" style="background:${c.color}"></i><span>${c.short}</span><b>${fmt(c.count)}</b></button>`).join('');
        renderIndicatorRows();
    }
    function setIndicatorStatusFilter(status) {
        activeIndicatorPieStatus = status || '';
        const sel = document.getElementById('stInd'); if (sel) sel.value = activeIndicatorPieStatus;
        renderIndicatorList(currentDrawerRecords);
    }
    function indicatorRowHtml(r) {
        const st = statusMeta(r.status); const progress = Number(r.progress || 0);
        return `<button class="indicator-row" onclick="openIndicatorDetail('${r.id}')">
      <div class="indicator-id"><b>${r.id}</b><small>Chỉ tiêu</small></div>
      <div class="indicator-title"><div class="title">${r.title}</div><small>${axisMeta[r.role]?.icon || ''} ${axisMeta[r.role]?.name || r.role} · ${r.unit}</small></div>
      <div class="indicator-status"><span class="status-pill" style="background:${st.color}22;color:${st.color};border:1px solid ${st.color}66">${st.short}</span></div>
      <div class="indicator-source"><small>Nguồn</small><b>${r.source}</b></div>
      <div class="indicator-progress"><small>Tiến độ</small><div class="progress"><i style="width:${Math.max(0, Math.min(100, progress))}%"></i></div><b>${progress}%</b></div>
    </button>`;
    }
    function renderIndicatorRows() {
        const q = (document.getElementById('qInd')?.value || '').toLowerCase();
        const st = (document.getElementById('stInd')?.value || activeIndicatorPieStatus || '');
        const unit = document.getElementById('unitInd')?.value || '';
        activeIndicatorPieStatus = st;
        const rs = currentDrawerRecords.filter(r => (!st || r.status === st) && (!unit || r.unit === unit) && (!q || [r.id, r.title, r.indicator, r.unit, r.source, r.freq].join(' ').toLowerCase().includes(q)));
        const sourceLabel = rs[0]?.source || currentDrawerRecords[0]?.source || '--';
        const freqLabel = rs[0]?.freq || currentDrawerRecords[0]?.freq || '--';
        document.getElementById('indSummary').innerHTML = `<span class="badge gold">Đang hiển thị: ${fmt(rs.length)}</span><span class="badge ok">Tổng chỉ tiêu: ${fmt(currentDrawerRecords.length)}</span><span class="badge">Nguồn: ${sourceLabel}</span><span class="badge">Tần suất: ${freqLabel}</span>${st ? `<span class="badge" style="border-color:${statusMeta(st).color};color:${statusMeta(st).color}">${statusMeta(st).label}</span>` : ''}`;
        const holder = document.getElementById('indRows'); if (!holder) return;
        if (!rs.length) { holder.innerHTML = '<div class="access-lock">Không có bản ghi phù hợp bộ lọc.</div>'; return; }
        holder.innerHTML = `<div class="indicator-table"><div class="indicator-table-head"><span>Mã bản ghi</span><span>Chỉ tiêu / đơn vị</span><span>Trạng thái</span><span>Nguồn</span><span>Tiến độ</span></div>${rs.map(indicatorRowHtml).join('')}</div>`;
    }

    /* ============================== CHI TIẾT 1 BẢN GHI CHỈ TIÊU (cấp 2) ============================== */
    function openIndicatorDetail(id) {
        const r = indicatorRecords.find(x => x.id === id); if (!r) return;
        const st = statusMeta(r.status);
        document.getElementById('modalTitleNotify').textContent = `Cấp 2 · ${r.code}`;
        document.getElementById('modalSubNotify').textContent = `Chỉ tiêu · ${axisMeta[r.role].name} · ${r.indicator}`;
        let body = `<div class="detail-grid"><div class="detail-card"><h4>Thông tin chỉ tiêu</h4><div class="kv"><b>Tên chỉ tiêu</b><span>${r.indicator}</span><b>Trục</b><span>${axisMeta[r.role].icon} ${axisMeta[r.role].name}</span><b>Đơn vị cập nhật</b><span>${r.unit}</span><b>Nguồn dữ liệu</b><span>${r.source}</span><b>Tần suất</b><span>${r.freq}</span><b>Trạng thái</b><span style="color:${st.color}">${st.label}</span><b>Tiến độ</b><span>${r.progress}%</span></div></div><div class="detail-card"><h4>Nội dung theo dõi</h4><p>${r.description}</p><div class="action-bar"><button class="primary" onclick="openIndicatorScenarioSelector('${id}')">Giao nhiệm vụ từ chỉ tiêu</button><button class="ghost" onclick="toast('Đã yêu cầu cập nhật số liệu chỉ tiêu ${r.id}')">Yêu cầu cập nhật dữ liệu</button><button class="ghost" onclick="toast('Đã tạo cảnh báo cho chỉ tiêu ${r.id}')">Tạo cảnh báo</button></div></div></div><div class="detail-card"><h4>Nhật ký chỉ tiêu</h4>${r.history.map(h => `<div class="audit-item"><b>${h.time}</b><span>${h.text}</span></div>`).join('')}</div>`;
        if (r.role === 'HDND' && /kiến nghị cử tri|ý kiến liên quan/i.test(r.indicator)) {
            const total = 87, done = 42, doing = 31, pending = 14;
            body += `<div class="detail-card"><h4>Tổng hợp ý kiến liên quan đến kiến nghị cử tri</h4><div class="subtask-kpis"><div class="mini-kpi"><b class="mono">${fmt(total)}</b><span>Tổng số ý kiến liên quan</span></div><div class="mini-kpi"><b class="mono ok">${fmt(done)}</b><span>Đã xử lý/trả lời</span></div><div class="mini-kpi"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="mini-kpi"><b class="mono warn">${fmt(pending)}</b><span>Chưa xử lý/cần giám sát</span></div></div><table class="compact-table"><thead><tr><th>Nhóm nội dung</th><th>Số ý kiến</th><th>Đã xử lý</th><th>Đang xử lý</th><th>Chưa xử lý</th></tr></thead><tbody><tr><td>Đất đai, GPMB</td><td>24</td><td>11</td><td>9</td><td>4</td></tr><tr><td>Giao thông, đô thị</td><td>21</td><td>10</td><td>7</td><td>4</td></tr><tr><td>An sinh, chính sách</td><td>18</td><td>9</td><td>6</td><td>3</td></tr><tr><td>Môi trường, trật tự</td><td>15</td><td>8</td><td>5</td><td>2</td></tr><tr><td>Hành chính công</td><td>9</td><td>4</td><td>4</td><td>1</td></tr></tbody></table><div class="action-bar"><button class="primary" onclick="openIndicator('HDND', indicators.HDND.findIndex(x=>x[0]==='Tổng số ý kiến liên quan đến kiến nghị cử tri'))">Mở danh sách 87 ý kiến</button><button class="ghost" onclick="openAssignmentForm()">Giao nhiệm vụ xử lý kiến nghị</button></div></div>`;
        }
        body += indicatorScenarioSummary(r);
        document.getElementById('modalBodyNotify').innerHTML = body;
        openModal();
    }

    /* --- Kịch bản xử lý từ chỉ tiêu (dùng chung helper với hồ sơ) --- */
    function indicatorSubtasksStore(id) { window.__indicatorScenarioSubtasks = window.__indicatorScenarioSubtasks || {}; window.__indicatorScenarioSubtasks[id] = window.__indicatorScenarioSubtasks[id] || []; return window.__indicatorScenarioSubtasks[id] }
    function indicatorSelectedScenario(id) { window.__indicatorSelectedScenario = window.__indicatorSelectedScenario || {}; return window.__indicatorSelectedScenario[id] || '' }
    function setIndicatorSelectedScenario(id, key) { window.__indicatorSelectedScenario = window.__indicatorSelectedScenario || {}; window.__indicatorSelectedScenario[id] = key }
    function indicatorScenarioSummary(ind) {
        const subs = indicatorSubtasksStore(ind.id);
        const done = subs.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length;
        const doing = subs.filter(s => (s.state || '').toLowerCase().includes('đang')).length;
        const soon = subs.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
        const scen = indicatorSelectedScenario(ind.id) ? getScenarioByKey(indicatorSelectedScenario(ind.id)) : null;
        const rows = subs.map((s, i) => `<tr class="clickable" onclick="openIndicatorSubTaskDetail('${ind.id}',${i})"><td>${s.id || s.maNhanh || ('CTN-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-scenario-col">${s.scenario ? getScenarioTitleByKey(s.scenario) : 'Giao thường'}</td><td class="subtask-name-col">${s.tenNhiemVu || s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.noiDungNhiemVu || s.content || s.tenNhiemVu || s.name || '--'}</td><td>${s.donViChuTri || s.owner || '--'}</td><td>${s.ngayHetHan || s.due || '--'}</td><td>${Number(s.progress ?? 35)}%</td><td><span class="badge ${((s.trangThai || s.state || '').includes('Hoàn')) ? 'ok' : ((s.trangThai || s.state || '').includes('Sắp')) ? 'warn' : ''}">${s.trangThai || s.state || 'Đang xử lý'}</span></td></tr>`).join('');
        return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><div><h4>Kịch bản xử lý &amp; nhiệm vụ nhánh từ chỉ tiêu</h4><p>Chọn kịch bản → tạo nhiệm vụ nhánh liên quan → có thể thêm mới kịch bản hoặc nhiệm vụ nhánh.</p></div><div class="scenario-actions"><button class="primary" onclick="openIndicatorScenarioSelector('${ind.id}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('indicator','${ind.id}')">＋ Thêm kịch bản</button></div></div>${scen ? `<div class="scenario-applied"><b>Kịch bản đang áp dụng:</b> ${scen.title} · ${scen.desc}</div>` : ''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length ? `<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nhánh từ chỉ tiêu này. Bấm "Chọn kịch bản xử lý" để tạo các việc con theo tình huống quá hạn/chậm tiến độ/thiếu dữ liệu.</div>`}</section>`;
    }
    function openIndicatorScenarioSelector(id) {
        const ind = indicatorRecords.find(x => x.id === id); if (!ind) return;
        openScenarioSelectorViaApi('indicator', id);
    }
    async function selectIndicatorScenario(id, key, detailRef) {
        const ind = indicatorRecords.find(x => x.id === id); if (!ind) return; setIndicatorSelectedScenario(id, key);
        await loadScenarioDetailForSelection('indicator', id, key, ind, detailRef);
    }
    function applyIndicatorScenarioTasks(id, key) {
        const ind = indicatorRecords.find(x => x.id === id); const s = getActiveScenarioDetail('indicator', id, key); if (!ind || !s) return;
        const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
        if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
        const subs = indicatorSubtasksStore(id);
        checked.forEach(idx => { const t = s.tasks[idx]; const dup = subs.some(x => (x.tenNhiemVu || x.name) === t.tenNhiemVu && x.scenario === key); if (!dup) subs.push(buildAppliedScenarioSubtask(t, idx, key, s.level, `${id}-N${String(subs.length + 1).padStart(2, '0')}`)); });
        setIndicatorSelectedScenario(id, key);
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh từ chỉ tiêu theo kịch bản.`); openIndicatorDetail(id);
    }
    function openIndicatorSubTaskDetail(indId, idx) {
        const ind = indicatorRecords.find(x => x.id === indId); const s = indicatorSubtasksStore(indId)[idx]; if (!ind || !s) return;
        document.getElementById('modalTitleNotify').textContent = `Chi tiết nhiệm vụ nhánh từ chỉ tiêu · ${s.id}`;
        document.getElementById('modalSubNotify').textContent = `Gắn với ${ind.id} · ${ind.indicator}`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="openIndicatorDetail('${indId}')">← Quay lại chỉ tiêu</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || s.maNhanh}</span><b>Kịch bản</b><span>${s.scenario ? getScenarioTitleByKey(s.scenario) : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.tenNhiemVu || s.name}</span><b>Nội dung</b><span>${s.noiDungNhiemVu || s.content}</span><b>Đơn vị nhận</b><span>${s.donViChuTri || s.owner}</span><b>Hạn xử lý</b><span>${s.ngayHetHan || s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.trangThai || s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.trangThai || s.state}</span><b>Tiến độ</b><span class="mono">${Number(s.progress ?? 30)}%</span></div></div></div>${indicatorScenarioSummary(ind)}`;
        openModal();
    }

    /* --- Kịch bản xử lý từ lĩnh vực/chỉ tiêu (dùng chung helper với hồ sơ/chỉ tiêu con) --- */
    function fieldSubtasksStore(fid) { window.__fieldScenarioSubtasks = window.__fieldScenarioSubtasks || {}; window.__fieldScenarioSubtasks[fid] = window.__fieldScenarioSubtasks[fid] || []; return window.__fieldScenarioSubtasks[fid] }
    function fieldSelectedScenario(fid) { window.__fieldSelectedScenario = window.__fieldSelectedScenario || {}; return window.__fieldSelectedScenario[fid] || '' }
    function setFieldSelectedScenario(fid, key) { window.__fieldSelectedScenario = window.__fieldSelectedScenario || {}; window.__fieldSelectedScenario[fid] = key }
    function openFieldSource(fid) {
        closeModalNoti();
        const t = fieldTarget(fid); if (!t.cat) return;
        if (t.cat.field === 'Giáo dục') openGiaoDucDashboard();
        else if (t.scope === 'item') openCategoryItemDetail(t.role, t.catId, t.idx);
        else if (t.role === 'UBND') openSoDashboard(t.role, t.catId);
        else openCategoryDetail(t.role, t.catId);
    }
    function fieldScenarioSummary(fid) {
        const t = fieldTarget(fid); if (!t.cat) return '';
        const subs = fieldSubtasksStore(fid);
        const done = subs.filter(s => (s.state || '').toLowerCase().includes('hoàn')).length;
        const doing = subs.filter(s => (s.state || '').toLowerCase().includes('đang')).length;
        const soon = subs.filter(s => (s.state || '').toLowerCase().includes('sắp')).length;
        const scen = fieldSelectedScenario(fid) ? getScenarioByKey(fieldSelectedScenario(fid)) : null;
        const rows = subs.map((s, i) => `<tr class="clickable" onclick="openFieldSubTaskDetail('${fid}',${i})"><td>${s.id || s.maNhanh || ('NV-' + String(i + 1).padStart(2, '0'))}</td><td class="subtask-scenario-col">${s.scenario ? getScenarioTitleByKey(s.scenario) : 'Giao thường'}</td><td class="subtask-name-col">${s.tenNhiemVu || s.name || 'Việc nhánh'}</td><td class="subtask-content-col">${s.noiDungNhiemVu || s.content || s.tenNhiemVu || s.name || '--'}</td><td>${s.donViChuTri || s.owner || '--'}</td><td>${s.ngayHetHan || s.due || '--'}</td><td>${Number(s.progress ?? 35)}%</td><td><span class="badge ${((s.trangThai || s.state || '').includes('Hoàn')) ? 'ok' : ((s.trangThai || s.state || '').includes('Sắp')) ? 'warn' : ''}">${s.trangThai || s.state || 'Đang xử lý'}</span></td></tr>`).join('');
        return `<section class="indicator-scenario-panel"><div class="indicator-scenario-head"><h4>Nhiệm vụ đã giao</h4><div class="scenario-actions"><button class="primary" onclick="openFieldScenarioSelector('${fid}')">⚡ Chọn kịch bản xử lý</button><button class="ghost" onclick="openScenarioCreateForm('field','${fid}')">＋ Thêm kịch bản</button></div></div>${scen ? `<div class="scenario-applied"><b>${scen.title}</b></div>` : ''}<div class="scenario-mini-grid"><div class="scenario-mini-card"><b class="mono">${fmt(subs.length)}</b><span>Tổng nhiệm vụ nhánh</span></div><div class="scenario-mini-card"><b class="mono ok">${fmt(done)}</b><span>Hoàn thành</span></div><div class="scenario-mini-card"><b class="mono blue">${fmt(doing)}</b><span>Đang xử lý</span></div><div class="scenario-mini-card"><b class="mono warn">${fmt(soon)}</b><span>Sắp hạn/cần theo dõi</span></div></div>${subs.length ? `<div class="scenario-table-wrap"><table class="compact-table"><thead><tr><th>Mã nhánh</th><th>Kịch bản</th><th>Tên nhiệm vụ</th><th>Nội dung</th><th>Đơn vị nhận</th><th>Hạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="subtask-empty">Chưa có nhiệm vụ nào được giao.</div>`}</section>`;
    }
    function openFieldScenarioSelector(fid) {
        const t = fieldTarget(fid); if (!t.cat) { toast('Không tìm thấy lĩnh vực/chỉ tiêu.'); return }
        openScenarioSelectorViaApi('field', fid);
    }
    async function selectFieldScenario(fid, key, detailRef) {
        const t = fieldTarget(fid); if (!t.cat) return; setFieldSelectedScenario(fid, key);
        await loadScenarioDetailForSelection('field', fid, key, t, detailRef);
    }
    function applyFieldScenarioTasks(fid, key) {
        const t = fieldTarget(fid); const s = getActiveScenarioDetail('field', fid, key); if (!t.cat || !s) return;
        const checked = [...document.querySelectorAll('[data-scenario-task]:checked')].map(x => Number(x.dataset.scenarioTask));
        if (!checked.length) { toast('Chưa chọn nhiệm vụ nhánh nào.'); return; }
        const subs = fieldSubtasksStore(fid);
        checked.forEach(idx => { const tk = s.tasks[idx]; const dup = subs.some(x => (x.tenNhiemVu || x.name) === tk.tenNhiemVu && x.scenario === key); if (!dup) subs.push(buildAppliedScenarioSubtask(tk, idx, key, s.level, `NV-${fid.replace(/::/g, '-')}-${String(subs.length + 1).padStart(2, '0')}`)); });
        setFieldSelectedScenario(fid, key);
        toast(`Đã tạo ${checked.length} nhiệm vụ nhánh theo ${t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực'}.`); openFieldSource(fid);
    }
    function openFieldSubTaskDetail(fid, idx) {
        const t = fieldTarget(fid); const s = fieldSubtasksStore(fid)[idx]; if (!t.cat || !s) return;
        document.getElementById('modalTitleNotify').textContent = `Chi tiết nhiệm vụ nhánh · ${s.id}`;
        document.getElementById('modalSubNotify').textContent = `Gắn với ${axisMeta[t.role].name} · ${t.label}`;
        document.getElementById('modalBodyNotify').innerHTML = `<div class="iip-modal-back"><button class="ghost" onclick="openFieldSource('${fid}')">← Quay lại ${t.scope === 'item' ? 'chỉ tiêu' : 'lĩnh vực'}</button></div><div class="detail-grid"><div class="detail-card"><h4>Thông tin nhiệm vụ nhánh</h4><div class="kv"><b>Mã nhánh</b><span>${s.id || s.maNhanh}</span><b>Kịch bản</b><span>${s.scenario ? getScenarioTitleByKey(s.scenario) : 'Giao thường'}</span><b>Tên nhiệm vụ</b><span>${s.tenNhiemVu || s.name}</span><b>Nội dung</b><span>${s.noiDungNhiemVu || s.content}</span><b>Đơn vị nhận</b><span>${s.donViChuTri || s.owner}</span><b>Hạn xử lý</b><span>${s.ngayHetHan || s.due}</span><b>Mức ưu tiên</b><span>${s.priority}</span><b>Trạng thái</b><span>${s.trangThai || s.state}</span></div></div><div class="detail-card"><h4>Trạng thái xử lý</h4><p class="wrap muted">IOC chỉ hiển thị trạng thái, tiến độ nhiệm vụ nhánh đồng bộ từ hệ thống nguồn; không chỉnh sửa thủ công tại đây.</p><div class="kv"><b>Trạng thái</b><span>${s.trangThai || s.state}</span><b>Tiến độ</b><span class="mono">${Number(s.progress ?? 30)}%</span></div></div></div>${fieldScenarioSummary(fid)}`;
        openModal();
    }

    /* ============================== DASHBOARD SỞ (dùng chung cho các sở UBND chưa có dữ liệu thật, port giao diện từ dashboard Giáo dục) ============================== */
    function ensureFakeCategoryItems(role, catId) {
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat || cat.items.length || cat.noItems) return;
        const seed = [...catId].reduce((a, c) => a + c.charCodeAt(0), 0);
        const shortName = cat.name.split(' (')[0];
        const templates = [['Tổng hợp số liệu chuyên ngành', 'Tháng'], ['Kết quả thực hiện nhiệm vụ trọng tâm', 'Quý'], ['Tình hình xử lý phản ánh, kiến nghị liên quan', 'Tuần'], ['Chỉ tiêu tổng hợp báo cáo định kỳ', 'Tháng']];
        const n = 3 + (seed % 2);
        cat.items = templates.slice(0, n).map((t, i) => [`${shortName} - ${t[0]}`, 10 + ((seed + i * 13) % 50), t[1], 'Dữ liệu demo, chưa kết nối nguồn chính thức']);
        if (!cat.desc) cat.desc = 'Dữ liệu minh họa — lĩnh vực chưa có nguồn kết nối chính thức, số liệu chỉ mang tính demo.';
        if (!cat.types || !cat.types.length) cat.types = ['Demo'];
        cat.items.forEach(item => {
            addIndicatorFromCategory(role, item);
            const name = item[0], count = Number(item[1]) || 0;
            const idx = indicators[role].findIndex(x => x[0] === name);
            for (let i = 0; i < count; i++) {
                const st = statusDefs[(i + idx) % statusDefs.length];
                indicatorRecords.push({ id: `CT-${role}-${idx + 1}-FAKE-${String(i + 1).padStart(4, '0')}`, role, indicator: name, status: st.key, title: `${name} - bản ghi ${i + 1}`, field: name, source: item[3], freq: item[2], unit: pick(units, i), due: dueDate(i, st.key), progress: progressFor(st.key, i), description: `Bản ghi demo minh họa cho chỉ tiêu ${name}, chưa đồng bộ từ nguồn thật.`, history: [{ time: '--', text: 'Dữ liệu demo minh họa, chưa đồng bộ nguồn thật.' }] });
            }
        });
    }
    function soDashboardKpis(cat, seed) {
        return [
            { label: 'Tổng chỉ tiêu', value: fmt(cat.items.length) },
            { label: 'Tổng bản ghi', value: fmt(catTotal(cat)) },
            { label: 'Đơn vị trực thuộc', value: fmt(3 + (seed % 6)) },
            { label: 'Tỷ lệ hoàn thành', value: (55 + (seed % 35)) + '%' },
            { label: 'Đang xử lý', value: fmt(10 + (seed % 40)) },
            { label: 'Sắp đến hạn', value: fmt(3 + (seed % 10)) },
            { label: 'Quá hạn', value: fmt(seed % 5) },
            { label: 'Cập nhật gần nhất', value: (1 + (seed % 6)) + ' ngày trước' }
        ];
    }
    /* ===== Giao diện riêng cho "Sở Nông nghiệp và Môi trường" — đúng số liệu thật từ network JSON ===== */
    const NNMT_GPMB_CATS = ['Các dự án đầu tư xây dựng cầu', 'Các đường vành đai', 'Các Dự án cải tạo, nâng cấp đường giao thông đường bộ'];
    const NNMT_GPMB_INVEST = [754166193378, 3772, 22492140852];
    const NNMT_GPMB_KINHPHI = [711955448286, 2587, 106129450930];
    const NNMT_GPMB_PROJECTS = [5, 3, 6];
    function nnmtGpmbBoxHtml() {
        return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng hợp dữ liệu GPMB (Tuần 01/2026)</div>
      <div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtGpmbChart"></canvas></div>
    </div>`;
    }
    let nnmtGpmbChartInstance = null;
    function initNnmtGpmbChart() {
        const canvas = document.getElementById('nnmtGpmbChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (nnmtGpmbChartInstance) { nnmtGpmbChartInstance.destroy(); nnmtGpmbChartInstance = null; }
        nnmtGpmbChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: NNMT_GPMB_CATS, datasets: [
                    { type: 'bar', label: 'Tổng mức đầu tư (đồng)', data: NNMT_GPMB_INVEST, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                    { type: 'bar', label: 'Tổng kinh phí GPMB (đồng)', data: NNMT_GPMB_KINHPHI, backgroundColor: '#6FD195', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                    { type: 'line', label: 'Tổng số dự án', data: NNMT_GPMB_PROJECTS, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: {
                    y: { beginAtZero: true, position: 'left', ticks: { color: '#a8c3d8', font: { size: 9 }, callback: v => fmt(v) }, grid: { color: 'rgba(87,178,255,.12)' } },
                    y1: { beginAtZero: true, position: 'right', ticks: { color: '#a8c3d8', font: { size: 9.5 } }, grid: { display: false } },
                    x: { ticks: { color: '#dceeff', font: { size: 9.5 } }, grid: { display: false } }
                },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 11, font: { size: 9.5 } } } }
            }
        });
    }
    const NNMT_DATDAI_CATS = ['Nhóm đất nông nghiệp', 'Nhóm đất phi nông nghiệp', 'Nhóm đất chưa sử dụng'];
    const NNMT_DATDAI_SERIES = [
        { label: 'Diện tích sử dụng', color: '#7086FD', data: [173264, 138336, 2342] },
        { label: 'Diện tích được giao quản lý', color: '#6FD195', data: [22042, 66659, 2338] }
    ];
    function nnmtDatDaiBoxHtml() {
        return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Thống kê tình hình sử dụng đất đai — ha (Năm 2025)</div>
      <div style="position:relative;height:260px;margin-top:8px"><canvas id="nnmtDatDaiChart"></canvas></div>
    </div>`;
    }
    let nnmtDatDaiChartInstance = null;
    function initNnmtDatDaiChart() {
        const canvas = document.getElementById('nnmtDatDaiChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (nnmtDatDaiChartInstance) { nnmtDatDaiChartInstance.destroy(); nnmtDatDaiChartInstance = null; }
        nnmtDatDaiChartInstance = new Chart(canvas, {
            type: 'bar',
            data: { labels: NNMT_DATDAI_CATS, datasets: NNMT_DATDAI_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 40 })) },
            options: {
                responsive: true, maintainAspectRatio: false, animation: false,
                scales: { y: { beginAtZero: true, ticks: { color: '#a8c3d8', font: { size: 10 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } },
                plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } }
            }
        });
    }
    /* ===== Giao diện riêng cho "Sở Nội vụ" — đúng số liệu thật ===== */
    function noivuTopKpiHtml() {
        return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Doanh nghiệp tham gia tuyển dụng</p><b style="font-size:20px;color:#fff">64</b></div>
        <span style="font-size:20px">?</span>
      </div>
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Tổng số nhu cầu tuyển dụng</p><b style="font-size:20px;color:#fff">443</b></div>
        <span style="font-size:20px">?</span>
      </div>
      <div class="cat-chart-box" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px">
        <div><p style="font-size:10.5px;color:var(--text-muted);margin:0 0 4px">Số hồ sơ tìm việc</p><b style="font-size:20px;color:#fff">652</b></div>
        <span style="font-size:20px">?</span>
      </div>
    </div>`;
    }
    function noivuBox1Html() {
        return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng số chi trả an sinh cho người có công (Tháng 3/2026)</div>
      <div style="position:relative;height:190px;margin-top:8px"><canvas id="noivuAnSinhChart"></canvas></div>
      <p style="text-align:center;margin:12px 0 4px"><span style="font-size:10px;color:var(--text-muted)">Tổng </span><b style="font-size:20px;color:#fff">228,987</b><span style="font-size:10px;color:var(--text-muted)"> tỷ đồng</span></p>
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>? Tổng số đã chi trả</span><b>228.987.078.109 đồng</b></div>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#dceeff"><span>? Tổng số chưa chi trả</span><b>0 đồng</b></div>
      </div>
    </div>`;
    }
    let noivuAnSinhChartInstance = null;
    function initNoivuAnSinhChart() {
        const canvas = document.getElementById('noivuAnSinhChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (noivuAnSinhChartInstance) { noivuAnSinhChartInstance.destroy(); noivuAnSinhChartInstance = null; }
        noivuAnSinhChartInstance = new Chart(canvas, {
            type: 'pie',
            data: { labels: ['Đã chi trả', 'Chưa chi trả'], datasets: [{ data: [228987078109, 0], backgroundColor: ['#2fb174', '#e0218a'], borderColor: '#04101d', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } } }
        });
    }
    function noivuBox2Html() {
        return `<div class="cat-chart-box">
      <div class="cdl-title" style="text-align:center;font-size:12px">Tổng số CCVC khối chính quyền (Năm 2025)</div>
      <div style="position:relative;height:220px;margin-top:8px"><canvas id="noivuCcvcChart"></canvas></div>
    </div>`;
    }
    let noivuCcvcChartInstance = null;
    function initNoivuCcvcChart() {
        const canvas = document.getElementById('noivuCcvcChart'); if (!canvas || typeof Chart === 'undefined') return;
        if (noivuCcvcChartInstance) { noivuCcvcChartInstance.destroy(); noivuCcvcChartInstance = null; }
        noivuCcvcChartInstance = new Chart(canvas, {
            type: 'doughnut',
            data: { labels: ['Viên chức: 124.378', 'Công chức: 11.965'], datasets: [{ data: [124378, 11965], backgroundColor: ['#7086FD', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } } },
            plugins: [donutCenterTextPlugin('136.343', 'CCVC')]
        });
    }
    const NOIVU_CUSTOM_ITEMS = ['Doanh nghiệp tham gia tuyển dụng', 'Tổng số nhu cầu tuyển dụng', 'Số hồ sơ tìm việc', 'Tổng số chi trả an sinh cho người có công', 'Tổng số CCVC khối chính quyền'];
    /* ===== Giao diện riêng cho "Sở Tài chính" — 4/11 biểu đồ có số liệu thật (Thu ngân sách, 2 donut vốn đầu tư, Khách du lịch),
       8 biểu đồ còn lại (không có số hiển thị rõ trên ảnh gốc) tạm ước tính theo đúng hình dạng cột — sẽ cập nhật khi có số liệu thật. */
    const TC_CUSTOM_ITEMS = ['Tình hình thu ngân sách so với dự toán', 'Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội', 'Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 'Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 'Chỉ số sản xuất công nghiệp so với cùng kỳ năm trước', 'Tiến độ hoàn thành các dự án trọng điểm', 'Doanh thu vận tải, kho bãi, dịch vụ hỗ trợ vận tải và bưu chính chuyển phát', 'Khách du lịch đến Hà Nội (do cơ sở lưu trú phục vụ)', 'Kim ngạch xuất nhập khẩu', 'Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ', 'Tình hình chi ngân sách địa phương'];
    function tcChartBox(id, title, height) {
        return `<div class="cat-chart-box"><div class="cdl-title" style="text-align:center;font-size:11.5px">${esc(title)}</div><div style="position:relative;height:${height || 220}px;margin-top:8px"><canvas id="${id}"></canvas></div></div>`;
    }
    const TC_THU_CATS = ['Thu từ hoạt động XNK', 'Thu dầu thô', 'Thu nội địa', 'Thu viện trợ không hoàn lại'];
    const TC_THU_SERIES = [{ label: 'So với dự toán', color: '#7086FD', data: [27.6, 32.6, 39.9, 278.8] }, { label: 'So cùng kỳ năm 2025', color: '#6FD195', data: [122, 145.6, 98.7, 377.9] }];
    const TC_LUUCHUYEN_CATS = ['Nhà nước', 'Ngoài nhà nước', 'Khu vực có vốn đầu tư nước ngoài'];
    const TC_LUUCHUYEN_SERIES = [{ label: 'Tổng mức bán lẻ và doanh thu dịch vụ (ước tính)', color: '#7086FD', data: [45000, 230000, 35000] }, { label: 'Tổng mức bán ra và doanh thu dịch vụ (ước tính)', color: '#6FD195', data: [90000, 980000, 70000] }];
    const TC_SXCN_CATS = ['Toàn ngành công nghiệp', 'Khai khoáng', 'Công nghiệp chế biến, chế tạo', 'Sản xuất và phân phối điện, khí đốt, hơi nước, điều hoà không khí', 'Cung cấp nước, quản lý và xử lý rác thải, nước thải'];
    const TC_SXCN_DATA = [108, 102, 112, 106, 104];
    const TC_DUAN_CATS = ['Nhóm 10 dự án, công trình', 'Dự án 07 cầu vượt sông Hồng', 'Các tuyến đường Vành đai và Giao thông trọng điểm', 'Quy hoạch và Thể chế phát triển Thủ đô', 'Xử lý các dự án ngoài ngân sách chậm triển khai'];
    const TC_DUAN_DATA = [30, 35, 15, 40, 48];
    const TC_VANTAI_CATS = ['Vận tải hành khách', 'Vận tải hàng hóa', 'Dịch vụ kho bãi và hỗ trợ vận tải', 'Bưu chính, chuyển phát'];
    const TC_VANTAI_BAR = [78000, 48000, 52000, 8000];
    const TC_VANTAI_LINE = [130, 120, 140, 10];
    const TC_XNK_CATS = ['Khu vực kinh tế trong nước', 'Khu vực có vốn đầu tư nước ngoài'];
    const TC_XNK_NHAPKHAU = [2950, 1200], TC_XNK_XUATKHAU = [620, 630];
    const TC_XNK_NHAPKHAU_CK = [125, 110], TC_XNK_XUATKHAU_CK = [85, 110];
    const TC_GIA_CATS = ['Chỉ số giá tiêu dùng', 'Chỉ số giá vàng', 'Chỉ số giá đô la Mỹ'];
    const TC_GIA_DATA = [103, 190, 103];
    const TC_CHINS_CATS = ['Tổng chi ngân sách địa phương', 'Chi đầu tư phát triển', 'Chi phát triển thường xuyên', 'Chi trả nợ lãi', 'Chi bổ sung quỹ dự trữ tài chính', 'Các khoản chi khác'];
    const TC_CHINS_SERIES = [{ label: 'Quý I năm trước', color: '#7086FD', data: [28000, 10000, 20000, 1000, 500, 300] }, { label: 'Quý I năm 2026', color: '#6FD195', data: [45000, 28000, 22000, 1200, 600, 400] }];
    let tcChartInstances = {};
    function tcDestroy(id) { if (tcChartInstances[id]) { tcChartInstances[id].destroy(); delete tcChartInstances[id]; } }
    function initTaichinhCharts() {
        ['tcThu', 'tcLuuChuyen', 'tcVonDauTu', 'tcVonNsnn', 'tcSxcn', 'tcDuAn', 'tcVanTai', 'tcKhachDL', 'tcXnk', 'tcGia', 'tcChiNs'].forEach(tcDestroy);
        let c;
        c = document.getElementById('tcThuChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcThu = new Chart(c, { type: 'bar', data: { labels: TC_THU_CATS, datasets: TC_THU_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 46 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, max: 400, ticks: { color: '#a8c3d8', font: { size: 11 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 11 } } } } } });
        c = document.getElementById('tcLuuChuyenChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcLuuChuyen = new Chart(c, { type: 'bar', data: { labels: TC_LUUCHUYEN_CATS, datasets: TC_LUUCHUYEN_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 50 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TC_LUUCHUYEN_SERIES.flatMap(s => s.data)) * 1.18), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10.5 } } } } } });
        c = document.getElementById('tcVonDauTuChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVonDauTu = new Chart(c, { type: 'doughnut', data: { labels: ['Vốn nhà nước: 42.006', 'Vốn ngoài nhà nước: 53.222', 'Vốn đầu tư trực tiếp nước ngoài: 7.032'], datasets: [{ data: [42006, 53222, 7032], backgroundColor: ['#7086FD', '#FD9843', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('102.260', 'tỷ đồng')] });
        c = document.getElementById('tcVonNsnnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVonNsnn = new Chart(c, { type: 'doughnut', data: { labels: ['Cấp thành phố: 11.519', 'Cấp xã: 9.426'], datasets: [{ data: [11519, 9426], backgroundColor: ['#7086FD', '#6FD195'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('20.945', 'tỷ đồng')] });
        c = document.getElementById('tcSxcnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcSxcn = new Chart(c, { type: 'bar', data: { labels: TC_SXCN_CATS, datasets: [{ data: TC_SXCN_DATA, backgroundColor: '#39d5ff', borderRadius: 3, maxBarThickness: 26 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { beginAtZero: true, max: 180, ticks: { color: '#a8c3d8', font: { size: 11 } }, grid: { color: 'rgba(87,178,255,.12)' } }, y: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
        c = document.getElementById('tcDuAnChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcDuAn = new Chart(c, { type: 'bar', data: { labels: TC_DUAN_CATS, datasets: [{ data: TC_DUAN_DATA, backgroundColor: '#39d5ff', borderRadius: 3, maxBarThickness: 26 }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { beginAtZero: true, max: 50, ticks: { color: '#a8c3d8', font: { size: 11 } }, grid: { color: 'rgba(87,178,255,.12)' } }, y: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
        c = document.getElementById('tcVanTaiChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcVanTai = new Chart(c, { type: 'bar', data: { labels: TC_VANTAI_CATS, datasets: [{ type: 'bar', label: 'Ước tính quý I năm 2026 (tỷ đồng)', data: TC_VANTAI_BAR, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 46, yAxisID: 'y' }, { type: 'line', label: 'Quý I 2026 so với cùng kỳ (số lượng)', data: TC_VANTAI_LINE, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, position: 'left', suggestedMax: Math.ceil(Math.max(...TC_VANTAI_BAR) * 1.18), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { color: 'rgba(87,178,255,.12)' } }, y1: { beginAtZero: true, position: 'right', suggestedMax: Math.ceil(Math.max(...TC_VANTAI_LINE) * 1.25), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { display: false } }, x: { ticks: { color: '#dceeff', font: { size: 10.5 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } } } });
        c = document.getElementById('tcKhachDLChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcKhachDL = new Chart(c, { type: 'doughnut', data: { labels: ['Khách nội địa: 654', 'Khách quốc tế: 1.781'], datasets: [{ data: [654, 1781], backgroundColor: ['#FD9843', '#7086FD'], borderColor: '#04101d', borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10.5 } } } } }, plugins: [donutCenterTextPlugin('2.435', 'nghìn lượt')] });
        c = document.getElementById('tcXnkChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcXnk = new Chart(c, {
            type: 'bar', data: {
                labels: TC_XNK_CATS, datasets: [
                    { type: 'bar', label: 'Nhập khẩu', data: TC_XNK_NHAPKHAU, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                    { type: 'bar', label: 'Xuất khẩu', data: TC_XNK_XUATKHAU, backgroundColor: '#6FD195', borderRadius: 3, maxBarThickness: 40, yAxisID: 'y' },
                    { type: 'line', label: 'Nhập khẩu so với cùng kỳ năm trước', data: TC_XNK_NHAPKHAU_CK, borderColor: '#FD9843', backgroundColor: '#FD9843', pointRadius: 4, tension: .3, yAxisID: 'y1' },
                    { type: 'line', label: 'Xuất khẩu so với cùng kỳ năm trước', data: TC_XNK_XUATKHAU_CK, borderColor: '#39d5ff', backgroundColor: '#39d5ff', pointRadius: 4, tension: .3, yAxisID: 'y1' }
                ]
            }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, position: 'left', suggestedMax: Math.ceil(Math.max(...TC_XNK_NHAPKHAU, ...TC_XNK_XUATKHAU) * 1.18), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { color: 'rgba(87,178,255,.12)' } }, y1: { beginAtZero: true, position: 'right', suggestedMax: Math.ceil(Math.max(...TC_XNK_NHAPKHAU_CK, ...TC_XNK_XUATKHAU_CK) * 1.25), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { display: false } }, x: { ticks: { color: '#dceeff', font: { size: 11 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } } }
        });
        c = document.getElementById('tcGiaChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcGia = new Chart(c, { type: 'bar', data: { labels: TC_GIA_CATS, datasets: [{ data: TC_GIA_DATA, backgroundColor: '#7086FD', borderRadius: 3, maxBarThickness: 60 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, max: 200, ticks: { color: '#a8c3d8', font: { size: 11 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 11.5 } }, grid: { display: false } } }, plugins: { legend: { display: false } } } });
        c = document.getElementById('tcChiNsChart'); if (c && typeof Chart !== 'undefined') tcChartInstances.tcChiNs = new Chart(c, { type: 'bar', data: { labels: TC_CHINS_CATS, datasets: TC_CHINS_SERIES.map(s => ({ label: s.label, data: s.data, backgroundColor: s.color, borderRadius: 3, maxBarThickness: 28 })) }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, suggestedMax: Math.ceil(Math.max(...TC_CHINS_SERIES.flatMap(s => s.data)) * 1.18), ticks: { color: '#a8c3d8', font: { size: 10.5 } }, grid: { color: 'rgba(87,178,255,.12)' } }, x: { ticks: { color: '#dceeff', font: { size: 10 } }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { color: '#dceeff', boxWidth: 12, font: { size: 10 } } } } } });
    }
    function taichinhBoxesHtml() {
        return `<div style="display:grid;gap:14px">
      ${tcChartBox('tcThuChart', 'Tình hình thu ngân sách so với dự toán (%)', 260)}
      ${tcChartBox('tcLuuChuyenChart', 'Tổng mức lưu chuyển hàng hóa và doanh thu dịch vụ tiêu dùng xã hội (ước tính)', 260)}
      ${tcChartBox('tcVonDauTuChart', 'Vốn đầu tư phát triển toàn xã hội thực hiện theo giá hiện hành', 260)}
      ${tcChartBox('tcVonNsnnChart', 'Vốn đầu tư thực hiện từ nguồn NSNN do địa phương quản lý', 260)}
      ${tcChartBox('tcSxcnChart', 'Chỉ số SXCN so với cùng kỳ năm trước (ước tính)', 260)}
      ${tcChartBox('tcDuAnChart', 'Tiến độ hoàn thành các dự án trọng điểm (ước tính)', 260)}
      ${tcChartBox('tcVanTaiChart', 'Doanh thu vận tải, kho bãi, bưu chính chuyển phát (ước tính)', 300)}
      ${tcChartBox('tcKhachDLChart', 'Khách du lịch đến Hà Nội', 260)}
      ${tcChartBox('tcXnkChart', 'Kim ngạch xuất nhập khẩu (ước tính)', 300)}
      ${tcChartBox('tcGiaChart', 'Chỉ số giá tiêu dùng, giá vàng, đô la Mỹ (ước tính)', 260)}
      ${tcChartBox('tcChiNsChart', 'Tình hình chi ngân sách địa phương Quý I/2026 (ước tính)', 300)}
    </div>`;
    }
    function openSoDashboard(role, catId) {
        if (!canSeeRole(role)) { toast('Không có quyền xem lĩnh vực này.'); return }
        ensureFakeCategoryItems(role, catId);
        const cat = (categorySeed[role] || []).find(c => c.id === catId); if (!cat) return;
        cat.role = role;
        const seed = [...catId].reduce((a, c) => a + c.charCodeAt(0), 0);
        const fid = `cat::${role}::${catId}`;
        const kpis = soDashboardKpis(cat, seed);
        document.getElementById('drawerTitleNotify').textContent = `Lĩnh vực: ${cat.name}`;
        document.getElementById('drawerSubNotify').textContent = '';
        document.getElementById('drawerBodyNotify').innerHTML = `<div class="gd-dash">
      <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
        <button style="font-size:12px;background:linear-gradient(180deg,#2c7dd2,#1c5aa0);color:#fff;border-radius:8px;padding:6px 14px;font-weight:800" onclick="openFieldScenarioSelector('${fid}')">Giao nhiệm vụ</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
        <select style="height:32px;font-size:12px;"><option>2025-2026</option></select>
        <select style="height:32px;font-size:12px;"><option>Đầu năm</option></select>
        <select style="height:32px;font-size:12px;"><option>Toàn thành phố</option></select>
        <select style="height:32px;font-size:12px;"><option>Tất cả chỉ tiêu</option></select>
      </div>
      ${cat.noItems ? `<div class="access-lock" style="text-align:center;padding:24px 12px"><i class="ti ti-info-circle" style="font-size:20px;color:var(--text-muted)" aria-hidden="true"></i><p style="margin:8px 0 0;color:var(--text-secondary);font-size:13px">Không có chỉ tiêu được giao.</p></div>` : `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:20px;">${kpis.map(k => `<div style="background:var(--surface-1);border-radius:var(--radius);padding:0.7rem;"><p style="font-size:11px;color:var(--text-secondary);margin:0 0 3px;">${esc(k.label)}</p><p style="font-size:17px;font-weight:500;margin:0;">${esc(k.value)}</p></div>`).join('')}</div>
      ${catId === 'ubnd-noivu' ? `${noivuTopKpiHtml()}<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">${noivuBox1Html()}${noivuBox2Html()}</div>` : ''}
      <div class="cat-two-col" style="margin-top:0">
        <div>
          ${catId === 'ubnd-nnmt' ? `<div style="display:grid;gap:14px">${nnmtGpmbBoxHtml()}${nnmtDatDaiBoxHtml()}</div>` : catId === 'ubnd-taichinh' ? taichinhBoxesHtml() : `<p style="font-size:12px;color:var(--text-secondary);margin:0 0 8px;">Nhóm chỉ tiêu</p><div style="display:grid;gap:12px">${cat.items.map((it, idx) => (catId === 'ubnd-noivu' && NOIVU_CUSTOM_ITEMS.includes(it[0])) ? '' : soCategoryItemCardHtml(role, catId, idx, it)).join('')}</div>`}
        </div>
        ${genUnitTableHtml(cat)}
      </div>
      ${fieldScenarioSummary(fid)}`}
    </div>`;
        openDrawerNoti();
        flushPendingDimCharts();
        syncGenUnitBoxHeight();
        if (catId === 'ubnd-nnmt') { initNnmtGpmbChart(); initNnmtDatDaiChart(); }
        if (catId === 'ubnd-noivu') { initNoivuAnSinhChart(); initNoivuCcvcChart(); }
        if (catId === 'ubnd-taichinh') initTaichinhCharts();
    }

    /* ============================== RENDER ALL / KHỞI ĐỘNG ============================== */
    function renderAll() {
        const meta = axisMeta[currentRole];
        document.getElementById('currentIcon').textContent = meta.icon;
        document.getElementById('currentRoleName').textContent = currentAccount.title;
        document.getElementById('currentRoleDesc').textContent = currentAccount.subtitle;
        renderRoleScope(); renderSummary(); renderMetricTabs(); renderAxisDashboard(); renderIndicators(); renderSources(); renderNotifications(); renderCad(); renderCustomizer(); applyWidgetVisibility();
    }



    /* ===================================================================
     * BOOTSTRAP - khoi tao component standalone (da bo dang nhap).
     * Mac dinh dong vai tro DANG / Thanh uy (giong selectLogin('danguy') cua file goc) -> xem tat ca 04 truc.
     * =================================================================== */
    (function () {
        function __boot() {
            try { if (typeof initData === 'function') { initData(); } else { generateRecords(); } } catch (e) { console.error('initData', e); }
            try {
                var acc = (typeof accounts !== 'undefined') ? (accounts.danguy || Object.keys(accounts).map(function (k) { return accounts[k]; }).filter(function (a) { return a.role === 'DANG'; })[0]) : null;
                if (acc) { currentAccount = acc; currentRole = acc.role; }
            } catch (e) { }
            try { activeMetric = 'received'; } catch (e) { }
            try { activeIndicatorRole = allowedRoles()[0]; } catch (e) { }
            try { activeCategoryRole = (currentRole === 'DANG') ? 'ALL' : allowedRoles()[0]; } catch (e) { }
            try { renderAll = window.renderAll = function () { }; } catch (e) { }
            try { if (document.getElementById('clock')) { updateClock(); setInterval(updateClock, 1000); } } catch (e) { }
            try {
                var m = axisMeta[currentRole];
                var i = document.getElementById('currentIcon'); if (i) i.textContent = m.icon;
                var n = document.getElementById('currentRoleName'); if (n) n.textContent = currentAccount.title;
                var d = document.getElementById('currentRoleDesc'); if (d) d.textContent = currentAccount.subtitle;
            } catch (e) { }
            try { document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === 'k') { e.preventDefault(); if (typeof openQuickCommand === 'function') openQuickCommand(); } }); } catch (e) { }
            /* ==== RENDER RIENG CUA COMPONENT ==== */
            // Đã cấu hình QLNV: KHÔNG hiển thị nhiệm vụ demo. Xóa số demo CẢ Nhiệm vụ giao + nhận (về 0).
            // Tải LƯỜI: chỉ 'received' tải NGAY (bật spinner trước render đầu); 'assigned' tải khi bấm tab của nó.
            try {
                if (typeof isQlnvConfigured === 'function' && isQlnvConfigured()) {
                    // Xóa số demo của TẤT CẢ metric QLNV (Nhiệm vụ giao/nhận + Văn bản đến/đi) -> chờ API.
                    if (typeof clearQlnvMetric === 'function') { Object.keys(QLNV_METRIC_ENDPOINT).forEach(function (m) { clearQlnvMetric(m); }); }
                    var rs0 = qlnvStateOf('received'); rs0.loading = true; rs0.error = null;  // chỉ 'received' tải ngay
                    if (typeof syncActiveQlnvFlags === 'function') syncActiveQlnvFlags();
                }
            } catch (e) { console.error('qlnv pre-zero', e); }
            try { renderMetricTabs(); renderAxisDashboard(); } catch (e) { console.error('component render', e); }
            try {
                if (typeof getQlnvToken === 'function') {
                    getQlnvToken().then(function () {
                        // Nạp sớm hồ sơ của chính mình để lúc "Tạo nhiệm vụ"/"Nhập noti" không phải chờ.
                        if (typeof loadQlnvMe === 'function') loadQlnvMe();
                        // Nạp sớm cache tên đơn vị để các màn "Chi tiết nhiệm vụ" hiện tên thay vì ID trần.
                        if (typeof loadQlnvUnitNameCache === 'function') loadQlnvUnitNameCache();
                        if (typeof loadQlnvAndMerge === 'function') loadQlnvAndMerge();
                    }).catch(function (err) {
                        var code = (err && err.code) || 'lỗi';
                        // Token lỗi: KHÔNG quay lại demo. Dừng spinner 'received', giữ 0, báo lỗi rõ.
                        var rs = qlnvStateOf('received'); rs.loading = false; rs.error = code; rs.loaded = false;
                        if (typeof syncActiveQlnvFlags === 'function') syncActiveQlnvFlags();
                        var msg = (code === 'NOT_AUTHENTICATED')
                            ? 'Chưa đăng nhập portal — không tải được nhiệm vụ QLNV.'
                            : 'Không lấy được token QLNV (' + code + ') — không tải được nhiệm vụ.';
                        console.warn('[QLNV token]', code, err && err.message);
                        if (typeof renderMetricTabs === 'function') renderMetricTabs();
                        if (typeof renderAxisDashboard === 'function') renderAxisDashboard();
                        if (typeof toast === 'function') toast(msg);
                    });
                } else if (typeof loadQlnvAndMerge === 'function') { loadQlnvAndMerge(); }
            } catch (e) { console.error('loadQlnv', e); }
            try {
                // Lần tải đầu do renderNotiPanel() bên dưới đảm nhận; ở đây chỉ làm mới định kỳ.
                if (typeof refreshNotifyTabs === 'function') setInterval(refreshNotifyTabs, 30 * 60 * 1000);
            } catch (e) { console.error('refreshNotifyTabs', e); }
            // Gọi renderCad() độc lập, không phụ thuộc renderAll(): renderAll() đọc thẳng #currentIcon/
            // #currentRoleName/... (không có null-guard) nên nếu widget nào đó (axisDashboard...) không có
            // trong HTML, renderAll() sẽ throw ngay từ đầu và không bao giờ chạy tới renderCad()/renderNotifications
            // phía sau trong cùng hàm — khiến thanh command CAD im lặng "không render" dù code không có lỗi.
            try { if (typeof renderCad === 'function') renderCad(); } catch (e) { console.error('renderCad', e); }
            try { if (typeof renderNotiPanel === 'function') renderNotiPanel(); } catch (e) { console.error('renderNotiPanel', e); }
            try { Array.prototype.forEach.call(document.querySelectorAll('[data-widget]'), function (el) { el.classList.remove('hidden'); }); } catch (e) { }
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __boot); else __boot();
    })();

    /* ============================== EXPORT RA WINDOW ==============================
       Toàn bộ file được bọc trong IIFE này để cô lập khỏi các khối CMS khác cùng nhúng chung
       1 trang (vd file.js) — tránh xung đột trùng tên hàm/biến top-level (đã xác nhận: ~75 hàm
       trùng tên hoàn toàn giữa 2 khối). Danh sách dưới đây là MỌI hàm được gọi qua thuộc tính
       inline onclick="..."/onchange="..." trong các đoạn HTML template (bắt buộc phải nằm trên
       window vì trình duyệt luôn tra cứu handler theo tên ở phạm vi global), cộng với các hàm
       trùng tên với file.js (để không bị/không đè khối kia dù khối nào nạp trước/sau). */
    window._qlnvCsrfToken = _qlnvCsrfToken;
    window._qlnvErr = _qlnvErr;
    window._qlnvFetchAccessToken = _qlnvFetchAccessToken;
    window._qlnvFetchAppJwt = _qlnvFetchAppJwt;
    window._qlnvFetchProxyToken = _qlnvFetchProxyToken;
    window._qlnvFetchUsername = _qlnvFetchUsername;
    window._qlnvHostToken = _qlnvHostToken;
    window._qlnvParseJwtExpMs = _qlnvParseJwtExpMs;
    window._qlnvPick = _qlnvPick;
    window._qlnvReadCookie = _qlnvReadCookie;
    window.addAssDocType = addAssDocType;
    window.addNewScenarioTaskRow = addNewScenarioTaskRow;
    window.allowedRoles = allowedRoles;
    window.applyDrawerFilters = applyDrawerFilters;
    window.applyWidgetVisibility = applyWidgetVisibility;
    window.assPickPerson = assPickPerson;
    window.backToTaskDetailModal = backToTaskDetailModal;
    window.canSeeRole = canSeeRole;
    window.catDonutClearSelection = catDonutClearSelection;
    window.assToggleDropdown = assToggleDropdown;
    window.catDonutSegmentClick = catDonutSegmentClick;
    window.catIipSearch = catIipSearch;
    window.catPanelFilter = catPanelFilter;
    window.catSegClick = catSegClick;
    window.clearNsOwnerSelection = clearNsOwnerSelection;
    window.clearQlnvToken = clearQlnvToken;
    window.closeDocDetail = closeDocDetail;
    window.closeDocPicker = closeDocPicker;
    window.closeDrawerNoti = closeDrawerNoti;
    window.closeModalNoti = closeModalNoti;
    window.closeNewScenarioTaskForm = closeNewScenarioTaskForm;
    window.closePanelsNotify = closePanelsNotify;
    window.confirmDocPicker = confirmDocPicker;
    window.createAssignment = createAssignment;
    window.createNotifyAssignment = createNotifyAssignment;
    window.createNotifySubTaskAssignment = createNotifySubTaskAssignment;
    window.createSubTaskAssignment = createSubTaskAssignment;
    window.debounceScenarioFilters = debounceScenarioFilters;
    window.deleteCustomScenario = deleteCustomScenario;
    window.donutArc = donutArc;
    window.drawerCounts = drawerCounts;
    window.dtTime = dtTime;
    window.dueDate = dueDate;
    window.esc = esc;
    window.extractCrmStatusList = extractCrmStatusList;
    window.filterAssDocType = filterAssDocType;
    window.filterItemRecords = filterItemRecords;
    window.filterNsCoordOptions = filterNsCoordOptions;
    window.filterNsOwnerOptions = filterNsOwnerOptions;
    window.findCrmGroupByCode = findCrmGroupByCode;
    window.fmt = fmt;
    window.gdDrillToUnits = gdDrillToUnits;
    window.gdFilterRows = gdFilterRows;
    window.gdOpenCategoryDetail = gdOpenCategoryDetail;
    window.gdOpenUnitDetail = gdOpenUnitDetail;
    window.gdSortBy = gdSortBy;
    window.genFilterUnitTable = genFilterUnitTable;
    window.generateRecords = generateRecords;
    window.getHiddenWidgets = getHiddenWidgets;
    window.getNsCoordSelected = getNsCoordSelected;
    window.getQlnvToken = getQlnvToken;
    window.handleAssignmentFilesNoti = handleAssignmentFilesNoti;
    window.iipOpenAll = iipOpenAll;
    window.iipOpenRecord = iipOpenRecord;
    window.indicatorCounts = indicatorCounts;
    window.initLogin = initLogin;
    window.isLimitedRole = isLimitedRole;
    window.linkedTasksTreeHtml = linkedTasksTreeHtml;
    window.loadAssignmentCatalogs = loadAssignmentCatalogs;
    window.loadCrmStatusMapping = loadCrmStatusMapping;
    window.loadScenarioPage = loadScenarioPage;
    window.login = login;
    window.logout = logout;
    window.metricTotal = metricTotal;
    window.metricTotalVisible = metricTotalVisible;
    window.moveCalendar = moveCalendar;
    window.msFieldHtml = msFieldHtml;
    window.msFilter = msFilter;
    window.msGetValues = msGetValues;
    window.msOptionsHtml = msOptionsHtml;
    window.msRemoveTag = msRemoveTag;
    window.msSearchKey = msSearchKey;
    window.msTagsHtml = msTagsHtml;
    window.msToggle = msToggle;
    window.msToggleOption = msToggleOption;
    window.onTaskRowClick = onTaskRowClick;
    window.openAssDocTypeDropdown = openAssDocTypeDropdown;
    window.openAssignmentForm = openAssignmentForm;
    window.openAssignmentFromDocument = openAssignmentFromDocument;
    window.openCalendar = openCalendar;
    window.openCategoryDetail = openCategoryDetail;
    window.openCategoryItemDetail = openCategoryItemDetail;
    window.openChildTaskDetailModal = openChildTaskDetailModal;
    window.openDocDetail = openDocDetail;
    window.openDocPicker = openDocPicker;
    window.openFieldScenarioSelector = openFieldScenarioSelector;
    window.openFieldSource = openFieldSource;
    window.openFieldSubTaskDetail = openFieldSubTaskDetail;
    window.openGiaoDucDashboard = openGiaoDucDashboard;
    window.openIncidentDetail = openIncidentDetail;
    window.openIndicator = openIndicator;
    window.openIndicatorDetail = openIndicatorDetail;
    window.openIndicatorScenarioSelector = openIndicatorScenarioSelector;
    window.openIndicatorSubTaskDetail = openIndicatorSubTaskDetail;
    window.openLinhVucDrawer = openLinhVucDrawer;
    window.openList = openList;
    window.openMeetingDetail = openMeetingDetail;
    window.openModal = openModal;
    window.openNewScenarioTaskForm = openNewScenarioTaskForm;
    window.notifyFormEl = notifyFormEl;
    window.openNotifySourceConfig = openNotifySourceConfig;
    window.openNotifySubTaskForm = openNotifySubTaskForm;
    window.openNotifyTaskScenarioSelector = openNotifyTaskScenarioSelector;
    window.openNsOwnerDropdown = openNsOwnerDropdown;
    window.openOverviewPieSegment = openOverviewPieSegment;
    window.openQuickCommand = openQuickCommand;
    window.openRecordDetail = openRecordDetail;
    window.openRecordFromIncident = openRecordFromIncident;
    window.openScenarioCardDetail = openScenarioCardDetail;
    /* Ô "Lĩnh vực áp dụng" vẽ đồng bộ -> phải nạp danh mục theo đơn vị xong mới mở form. */
    window.openScenarioCreateForm = function () {
        var args = arguments;
        if (typeof window.qlnvLoadScenarioLinhVuc !== "function")
            return openScenarioCreateForm.apply(null, args);
        return window.qlnvLoadScenarioLinhVuc().then(function () {
            return openScenarioCreateForm.apply(null, args);
        });
    };
    window.openScenarioSelector = openScenarioSelector;
    window.openSoDashboard = openSoDashboard;
    window.openSourceDetail = openSourceDetail;
    window.openSubTaskDetail = openSubTaskDetail;
    window.openSubTaskForm = openSubTaskForm;
    window.openSyncLog = openSyncLog;
    window.openTaskDetailFromDocument = openTaskDetailFromDocument;
    window.openTaskDetailFromLinhVuc = openTaskDetailFromLinhVuc;
    window.pad = pad;
    window.pct = pct;
    window.pick = pick;
    window.prefKey = prefKey;
    window.progressFor = progressFor;
    window.qlnvOpenChuTruong = qlnvOpenChuTruong;
    window.qlnvOpenTaskExternal = qlnvOpenTaskExternal;
    window.readQlnvToken = readQlnvToken;
    window.recordRowHtml = recordRowHtml;
    window.relTime = relTime;
    window.removeAssignmentFileNoti = removeAssignmentFileNoti;
    window.removeNewScenarioTaskRow = removeNewScenarioTaskRow;
    window.removeSelectedDoc = removeSelectedDoc;
    window.renderAll = renderAll;
    window.renderAxisDashboard = renderAxisDashboard;
    window.renderCad = renderCad;
    window.renderCalendar = renderCalendar;
    window.renderCategoryGrid = renderCategoryGrid;
    window.renderCustomizer = renderCustomizer;
    window.renderDocPickerList = renderDocPickerList;
    window.renderDrawerList = renderDrawerList;
    window.renderIndicatorList = renderIndicatorList;
    window.renderIndicatorRows = renderIndicatorRows;
    window.renderIndicators = renderIndicators;
    window.renderMetricTabs = renderMetricTabs;
    window.renderNewScenarioTasksList = renderNewScenarioTasksList;
    window.renderSources = renderSources;
    window.retryDrawerQlnv = retryDrawerQlnv;
    window.retryQlnvMetric = retryQlnvMetric;
    window.retryScenarioSelector = retryScenarioSelector;
    window.returnFromScenario = returnFromScenario;
    window.runQuick = runQuick;
    window.saveAssignmentDraft = saveAssignmentDraft;
    window.saveNewScenarioTemplate = saveNewScenarioTemplate;
    window.selectLogin = selectLogin;
    window.setAppVh = setAppVh;
    window.setCalMode = setCalMode;
    window.setDrawerPieStatus = setDrawerPieStatus;
    window.setFieldCategoryRole = setFieldCategoryRole;
    window.setHiddenWidgets = setHiddenWidgets;
    window.setIndicatorStatusFilter = setIndicatorStatusFilter;
    window.setMetric = setMetric;
    window.sourceForRecord = sourceForRecord;
    window.statusMeta = statusMeta;
    window.statusTotal = statusTotal;
    window.submitScenarioTasks = submitScenarioTasks;
    window.sumObj = sumObj;
    window.toast = toast;
    window.toggleCustomizer = toggleCustomizer;
    window.toggleDocPick = toggleDocPick;
    window.toggleUnitDropdown_noti = toggleUnitDropdown_noti;
    window.toggleWidgetBody = toggleWidgetBody;
    window.notiScrollTabs = notiScrollTabs;
    window.onNotiPanelSearch = onNotiPanelSearch;
    window.onNotiPanelTabClick = onNotiPanelTabClick;
    window.onNotiStatusFilterChange = onNotiStatusFilterChange;
    window.openNotiPanelItem = openNotiPanelItem;
    window.renderNotiPanel = renderNotiPanel;
    window.toggleWidgetPref = toggleWidgetPref;
    window.updateClock = updateClock;
    window.updateNsCoordLabel = updateNsCoordLabel;
    window.updateScenarioCreateButtonState = updateScenarioCreateButtonState;
    window.updateUnitTriggerLabel = updateUnitTriggerLabel;
    window.updatensCoordTrigger_notiLabel = updatensCoordTrigger_notiLabel;
})();
