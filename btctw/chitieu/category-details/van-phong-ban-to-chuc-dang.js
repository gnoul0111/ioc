(function (global) {
  'use strict';

  var CARD_ID = 'chart_van_phong_ban_to_chuc_dang_vien_co_so';
  var CATEGORY_KEY = 'van-phong-ban-to-chuc-dang-vien-co-so';
  var TITLE = 'Tổ chức đảng, đảng viên cơ sở';
  var REPORT_YEAR = 2026;
  var REPORT_MONTHS = "1,2,3";
  var PALETTE = ['#2a78d6', '#1baf7a', '#eda100', '#4a3aa7', '#39bfe8', '#d33a44', '#898781'];
  var charts = new Map();
  var activeRoot = null;
  var activeItemIndex = 0;
  var selectedBuckets = [];
  var clickHandler = null;
  var changeHandler = null;
  var inputHandler = null;
  var activeUnitSearch = '';

  /* ============================== API BÁO CÁO THEO CHỈ TIÊU (trung-uong/data/query) ==============================
     Khung gọi API thật cho từng chỉ tiêu (POST, body { indicatorKey, year, months }) — chưa có mẫu
     response từ backend nên phần map dữ liệu (mapApiReportToScaled/mapApiReportToUnitValues) đang để
     TODO. Khi nào có response thật, chỉ cần sửa 2 hàm map đó; phần gọi API + cache + fallback về dữ
     liệu mẫu (TCD_ITEMS/TCD_DANG_BO_TABLE) không cần đụng vào. */
  var INDICATOR_REPORTS_API = 'https://administrator.lifetex.vn:324/api/v1/trung-uong/data/query';
  var apiReportCache = {}; // cacheKey (indicatorKey::bucketKey) -> { status: 'pending'|'done'|'error', response }

  /* Chỉ khi chạy local (localhost/127.0.0.1/file:) mới tự nạp file cấu hình dev riêng của máy
     (van-phong-ban-to-chuc-dang-dev-auth.local.js — không commit, xem hướng dẫn trong file đó)
     để có window.INDICATOR_REPORTS_DEV_AUTH.authorization dùng tạm cho việc test API thật.
     Không có tác dụng ở môi trường thật (không tự load, không cần file này tồn tại). */
  (function loadDevAuthOverride() {
    if (typeof document === 'undefined' || typeof location === 'undefined') return;
    var isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname || '');
    if (!isLocalHost && location.protocol !== 'file:') return;
    var script = document.createElement('script');
    script.src = 'category-details/van-phong-ban-to-chuc-dang-dev-auth.local.js';
    script.async = false;
    script.onerror = function () {
      console.info('[van-phong-ban] Không tìm thấy file dev-auth.local.js (bỏ qua, chỉ ảnh hưởng test local).');
    };
    (document.head || document.body || document.documentElement).appendChild(script);
  })();

  function data() {
    return global.VanPhongBanToChucDangData || { items: [], unitTable: { units: [], cols: [] } };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('vi-VN');
  }

  function hash(value) {
    var result = 0;
    var text = String(value || '');
    for (var index = 0; index < text.length; index += 1) {
      result = (result * 31 + text.charCodeAt(index)) >>> 0;
    }
    return result;
  }

  function monthShares(seed) {
    var weights = Array.from({ length: 12 }, function (_, monthIndex) {
      return 0.08 + (hash(seed + '|m' + monthIndex) % 1000) / 1000 * 2.4;
    });
    var sum = weights.reduce(function (total, value) { return total + value; }, 0) || 1;
    return weights.map(function (value) { return value / sum; });
  }

  function bucketTotal(monthly, bucketKey) {
    if (bucketKey === 'year') {
      return monthly.reduce(function (total, value) { return total + value; }, 0);
    }
    if (bucketKey.charAt(0) === 'q') {
      var quarter = Number(bucketKey.slice(1));
      return monthly.slice((quarter - 1) * 3, quarter * 3)
        .reduce(function (total, value) { return total + value; }, 0);
    }
    return monthly[Number(bucketKey.slice(1)) - 1] || 0;
  }

  function periodLabel(bucketKey) {
    if (bucketKey === 'year') return 'Năm ' + REPORT_YEAR;
    if (bucketKey.charAt(0) === 'q') {
      return 'Quý ' + ['I', 'II', 'III', 'IV'][Number(bucketKey.slice(1)) - 1] + '/' + REPORT_YEAR;
    }
    return 'Tháng ' + Number(bucketKey.slice(1)) + '/' + REPORT_YEAR;
  }

  function apiReportCacheKey(indicatorKey) {
    return indicatorKey;
  }

  /* POST /api/v1/trung-uong/data/query
     Body: { indicatorKey: <id của TCD_ITEMS>, year: <số>, months?: "1,2,3" }. Gọi nội bộ từ
     ensureIndicatorReport() không truyền year/months (mặc định REPORT_YEAR, không months — gọi 1 lần
     cho cả năm theo indicatorKey). year/months tuỳ chọn để script.js gọi lại theo bộ lọc Năm/Quý/Tháng
     riêng ở drawer (xem global.fetchIndicatorReportForKey bên dưới). */
  function fetchIndicatorReport(indicatorKey, year, months) {
    var body = { indicatorKey: indicatorKey, year: year || REPORT_YEAR };
    if (months) body.months = months;
    var headers = {
      Accept: 'application/json',
      'Accept-Language': 'vi',
      'Content-Type': 'application/json',
    };
    /* Chỉ dùng cho test local — xem van-phong-ban-to-chuc-dang-dev-auth.local.js (file không commit). */
    var devAuth = global.INDICATOR_REPORTS_DEV_AUTH;
    if (devAuth && devAuth.authorization) headers.Authorization = devAuth.authorization;
    console.info('[van-phong-ban] POST', INDICATOR_REPORTS_API, body,
      devAuth ? '(có Authorization dev)' : '(không có Authorization)');
    /* Không dùng credentials:'include' — xác thực qua header Authorization (Bearer), không qua cookie;
       gửi kèm 'include' không cần thiết và làm CORS khắt khe hơn (server phải khai Access-Control-
       Allow-Credentials + origin cụ thể thay vì '*'). */
    return fetch(INDICATOR_REPORTS_API, {
      method: 'POST',
      cache: 'no-store',
      headers: headers,
      body: JSON.stringify(body),
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status + ' — ' + INDICATOR_REPORTS_API);
      return response.json();
    }).catch(function (err) {
      /* fetch() ném TypeError "Failed to fetch" (không có status) khi bị chặn CORS hoặc lỗi mạng —
         khác với lỗi "HTTP xxx" ở trên (server có trả lời nhưng status lỗi). Log rõ để phân biệt khi
         debug trên DevTools > Console/Network. */
      if (err instanceof TypeError) {
        console.error('[van-phong-ban] Request bị chặn trước khi tới server (CORS/network) — kiểm tra ' +
          'DevTools > Network xem có request "data/query" nào bị đỏ/(failed) kèm lỗi CORS không:',
          INDICATOR_REPORTS_API, err);
      }
      throw err;
    });
  }

  /* TODO: chưa có mẫu response thật từ /api/indicator-reports. Khi có, map field của `apiResponse`
     vào đúng shape { title, value, period, source, parts } (giống output của scaleItem()) rồi return
     object đó. Trả về falsy nghĩa là "chưa map được" -> nơi gọi tự fallback dùng dữ liệu mẫu. */
  function mapApiReportToScaled(item, bucketKey, apiResponse) {
    return null;
  }

  /* TODO: tương tự — map `apiResponse` thành mảng đúng data().unitTable.units.length số, theo đúng
     thứ tự data().unitTable.units, rồi return mảng đó. Trả về falsy -> fallback dùng
     TCD_DANG_BO_TABLE / item[4] như sourceColumnValues() hiện tại. */
  function mapApiReportToUnitValues(item, apiResponse) {
    return null;
  }

  /* Đảm bảo đã gọi (hoặc đang gọi) API cho đúng chỉ tiêu + kỳ báo cáo đang xem; khi có kết quả thì tự
     render lại chart + bảng nếu drawer vẫn đang mở đúng item/kỳ đó (tránh ghi đè khi user đã đổi kỳ
     hoặc đóng drawer trong lúc chờ). Cache theo indicatorKey — gọi 1 lần duy nhất cho mỗi chỉ tiêu
     (không gọi lại khi user chỉ đổi kỳ Tháng/Quý/Năm, vì request không còn phụ thuộc bucketKey). */
  function ensureIndicatorReport(item, itemIndex) {
    var indicatorKey = item[5];
    if (!indicatorKey) return; // item chưa có id -> giữ nguyên dữ liệu mẫu
    var cacheKey = apiReportCacheKey(indicatorKey);
    if (apiReportCache[cacheKey]) return; // đã gọi rồi (đang chờ hoặc đã có kết quả)
    apiReportCache[cacheKey] = { status: 'pending', response: null };
    fetchIndicatorReport(indicatorKey).then(function (json) {
      apiReportCache[cacheKey] = { status: 'done', response: json };
    }).catch(function (err) {
      console.warn('[van-phong-ban] fetchIndicatorReport lỗi, dùng dữ liệu mẫu:', err.message || err);
      apiReportCache[cacheKey] = { status: 'error', response: null };
    }).then(function () {
      if (activeItemIndex === itemIndex && activeRoot) {
        renderCard(itemIndex);
        showUnitTable(activeUnitSearch);
      }
    });
  }

  function scaleItemEffective(item, itemIndex, bucketKey) {
    ensureIndicatorReport(item, itemIndex);
    var indicatorKey = item[5];
    var entry = indicatorKey ? apiReportCache[apiReportCacheKey(indicatorKey)] : null;
    if (entry && entry.status === 'done') {
      var mapped = mapApiReportToScaled(item, bucketKey, entry.response);
      if (mapped) return mapped;
    }
    return scaleItem(item, bucketKey);
  }

  function scaleItem(item, bucketKey) {
    var frequency = { 'Tháng': 12, 'Quý': 4, 'Năm': 1 }[item[2]] || 1;
    var annual = Number(item[1] || 0) * frequency;
    var itemMonthly = monthShares(CATEGORY_KEY + '|' + item[0]).map(function (share) {
      return annual * share;
    });
    var parts = (item[4] || []).map(function (part) {
      return {
        dim: part.dim,
        type: part.type,
        items: part.items.map(function (entry) {
          if (/%/.test(entry.label || '')) return { label: entry.label, value: entry.value };
          var entryMonthly = monthShares(CATEGORY_KEY + '|' + item[0] + '|' + entry.label)
            .map(function (share) { return Number(entry.value || 0) * frequency * share; });
          return { label: entry.label, value: Math.max(0, Math.round(bucketTotal(entryMonthly, bucketKey))) };
        }),
      };
    });
    return {
      title: item[0],
      value: Math.max(0, Math.round(bucketTotal(itemMonthly, bucketKey))),
      period: periodLabel(bucketKey),
      source: item[3],
      parts: parts,
    };
  }

  function periodOptions(selected) {
    var options = [{ value: 'year', label: 'Năm ' + REPORT_YEAR }];
    for (var quarter = 1; quarter <= 4; quarter += 1) {
      options.push({
        value: 'q' + quarter,
        label: 'Quý ' + ['I', 'II', 'III', 'IV'][quarter - 1] + '/' + REPORT_YEAR,
      });
    }
    for (var month = 1; month <= 12; month += 1) {
      options.push({ value: 'm' + month, label: 'Tháng ' + month + '/' + REPORT_YEAR });
    }
    return options.map(function (option) {
      return '<option value="' + option.value + '"' +
        (option.value === selected ? ' selected' : '') + '>' +
        escapeHtml(option.label) + '</option>';
    }).join('');
  }

  function statPartHtml(part) {
    return '<div class="vpb-tdvcs-stat-grid">' + part.items.map(function (entry) {
      return '<div class="vpb-tdvcs-stat"><span>' + escapeHtml(entry.label) +
        '</span><strong>' + formatNumber(entry.value) + '</strong></div>';
    }).join('') + '</div>';
  }

  function partHtml(part, itemIndex, partIndex) {
    var label = '<p class="vpb-tdvcs-dimension">' + escapeHtml(part.dim) + '</p>';
    if (part.type === 'stat') return label + statPartHtml(part);
    var height = Math.min(420, Math.max(150, part.items.length * 31 + 28));
    return label + '<div class="vpb-tdvcs-chart" style="height:' + height + 'px">' +
      '<canvas data-vpb-item="' + itemIndex + '" data-vpb-part="' + partIndex + '"></canvas></div>';
  }

  function cardBodyHtml(itemIndex, bucketKey) {
    var item = data().items[itemIndex];
    if (!item) return '';
    var scaled = scaleItemEffective(item, itemIndex, bucketKey);
    return '<div class="vpb-tdvcs-card-summary"><strong>' + formatNumber(scaled.value) +
      '</strong><span>' + escapeHtml(scaled.period) + ' · ' + escapeHtml(scaled.source) + '</span></div>' +
      scaled.parts.map(function (part, partIndex) {
        return partHtml(part, itemIndex, partIndex);
      }).join('');
  }

  function cardHtml(item, itemIndex) {
    var bucketKey = selectedBuckets[itemIndex] || 'year';
    return '<article class="vpb-tdvcs-card" data-vpb-card="' + itemIndex +
      '" tabindex="0" role="button" aria-label="Xem chi tiết ' + escapeHtml(item[0]) + '">' +
      '<div class="vpb-tdvcs-card-head"><h4>' + escapeHtml(item[0]) + '</h4>' +
      '<select class="vpb-tdvcs-period" data-vpb-period="' + itemIndex +
      '" aria-label="Chọn kỳ cho ' + escapeHtml(item[0]) + '">' +
      periodOptions(bucketKey) + '</select></div>' +
      '<div class="vpb-tdvcs-card-body" data-vpb-card-body="' + itemIndex + '">' +
      cardBodyHtml(itemIndex, bucketKey) + '</div></article>';
  }

  /* Vẽ 1 block "phân tổ" (part) độc lập: label riêng (part.dim) + thanh chia màu (hoặc thẻ KPI nếu
     type 'stat') + legend chấm-số. */
  function compactPreviewPartHtml(part) {
    var labelHtml = '<p class="vpb-tdvcs-preview-label">' + escapeHtml(part.dim) + '</p>';
    if (part.type === 'stat') {
      return `<div style="margin-bottom:8px;background:rgba(6,28,52,.68);border:1px solid rgba(87,178,255,.16);border-radius:10px;padding:8px 10px">` + labelHtml + '<div class="vpb-tdvcs-list-stats">' + part.items.map(function (entry) {
        return '<span><strong>' + formatNumber(entry.value) + '</strong> ' +
          escapeHtml(entry.label) + '</span>';
      }).join('') + '</div></div>';
    }
    var total = part.items.reduce(function (sum, entry) { return sum + (Number(entry.value) || 0); }, 0) || 1;
    // Luôn dùng 1 thanh chia màu liền + legend chấm-số (khớp ảnh mẫu), kể cả khi phân tổ có nhiều
    // mục hoặc có mục tỉ trọng nhỏ — không còn chuyển sang kiểu rank-bar (.vpb-tdvcs-list-ranks) nữa.
    return `<div style="margin-bottom:8px;background:rgba(6,28,52,.68);border:1px solid rgba(87,178,255,.16);border-radius:10px;padding:8px 10px">` + labelHtml + '<div class="vpb-tdvcs-list-segments">' +
      '<div>' + part.items.map(function (entry, index) {
        return '<i style="flex:' + (Number(entry.value || 0) / total * 100).toFixed(1) +
          ';background:' + PALETTE[index % PALETTE.length] + '" title="' +
          escapeHtml(entry.label) + ': ' + formatNumber(entry.value) + '"></i>';
      }).join('') + '</div><p>' + part.items.map(function (entry, index) {
        return '<span><i style="background:' + PALETTE[index % PALETTE.length] +
          '"></i>' + formatNumber(entry.value) + '</span>';
      }).join('') + '</p></div></div>';
  }

  /* Nhận vào mảng "parts" (item[4]) — mỗi phần tử P()/S() trong TCD_ITEMS — rồi vẽ MỖI phần tử thành
     1 block riêng (label độc lập theo đúng part.dim của nó), thay vì trước đây chỉ lấy phần tử bar/stat
     ĐẦU TIÊN rồi bỏ qua các phần tử phân tổ còn lại. */
  function compactPreviewHtml(parts) {
    if (!parts || !parts.length) return '';
    return parts.map(compactPreviewPartHtml).join('');
  }

  function gridCardHtml(card) {
    var item = data().items[card.__vanPhongBanItemIndex];
    if (!item) return '';
    return '<button type="button" class="vpb-tdvcs-list-card" ' +
      'onclick="openVanPhongBanToChucDangPopup(' + card.__vanPhongBanItemIndex + ')" ' +
      'aria-label="Xem chi tiết ' + escapeHtml(item[0]) + '">' +
      '<h4>' + escapeHtml(card.titleDashboard) + '</h4>' + '<div class="vpb-tdvcs-preview-scroll" style="display:grid;gap:7px;height:100%;overflow-y:auto;margin-bottom:8px">' + compactPreviewHtml(item[4] || [])+'</div>' + '</button>';
  }

  function sourceColumnValues(item, itemIndex) {
    var table = data().unitTable;
    var indicatorKey = item[5];
    if (indicatorKey && itemIndex !== undefined) {
      ensureIndicatorReport(item, itemIndex);
      var entry = apiReportCache[apiReportCacheKey(indicatorKey)];
      if (entry && entry.status === 'done') {
        var mappedUnits = mapApiReportToUnitValues(item, entry.response);
        if (mappedUnits) return mappedUnits;
      }
    }
    var tableColumn = table.cols.find(function (column) { return column.label === item[0]; });
    if (tableColumn) {
      return table.units.map(function (_, index) { return tableColumn.values[index] || 0; });
    }
    var breakdown = (item[4] || []).find(function (part) { return part.dim === 'Đảng bộ'; });
    if (!breakdown) return table.units.map(function () { return 0; });
    return table.units.map(function (unitName) {
      var found = breakdown.items.find(function (entry) { return entry.label === unitName; });
      return found ? found.value : 0;
    });
  }

  function unitTableHtml(filterText, itemIndex) {
    var model = data();
    var item = model.items[itemIndex];
    if (!item) return '';
    var query = String(filterText || '').trim().toLocaleLowerCase('vi-VN');
    var values = sourceColumnValues(item, itemIndex);
    var unitIndexes = model.unitTable.units.map(function (_, index) { return index; })
      .filter(function (index) {
        return !query || model.unitTable.units[index].toLocaleLowerCase('vi-VN').includes(query);
      });
    var totalRow = '<tr class="vpb-tdvcs-total-row"><th>Tổng toàn quốc</th><td>' +
      formatNumber(item[1]) + '</td></tr>';
    var rows = unitIndexes.map(function (unitIndex) {
      return '<tr><th>' + escapeHtml(model.unitTable.units[unitIndex]) + '</th><td>' +
        formatNumber(values[unitIndex]) + '</td></tr>';
    }).join('');
    if (!rows) {
      rows = '<tr><td colspan="2" class="vpb-tdvcs-empty">Không tìm thấy đảng bộ phù hợp.</td></tr>';
    }
    return '<div class="vpb-tdvcs-table-wrap"><table class="vpb-tdvcs-table"><thead><tr>' +
      '<th>Đảng bộ</th><th title="' + escapeHtml(item[0]) + '">' +
      escapeHtml(item[0]) + '</th></tr></thead><tbody>' + totalRow + rows + '</tbody></table></div>';
  }

  function detailHtml(itemIndex) {
    var item = data().items[itemIndex];
    var scaled = scaleItemEffective(item, itemIndex, selectedBuckets[itemIndex] || 'year');
    return '<div class="vpb-tdvcs-detail">' +
      '<button type="button" class="vpb-tdvcs-back" data-vpb-back>← Danh sách đảng bộ</button>' +
      '<div class="vpb-tdvcs-detail-title"><div><span>CHI TIẾT CHỈ TIÊU</span><h3>' +
      escapeHtml(scaled.title) + '</h3></div><strong>' + formatNumber(scaled.value) + '</strong></div>' +
      scaled.parts.map(function (part) {
        return '<section class="vpb-tdvcs-detail-section"><h4>' + escapeHtml(part.dim) + '</h4>' +
          '<div class="vpb-tdvcs-detail-list">' + part.items.map(function (entry) {
            return '<div><span>' + escapeHtml(entry.label) + '</span><strong>' +
              formatNumber(entry.value) + '</strong></div>';
          }).join('') + '</div></section>';
      }).join('') + '</div>';
  }

  function rightPanelHtml(itemIndex) {
    var item = data().items[itemIndex];
    var hasUnitBreakdown = (item[4] || []).some(function (part) { return part.dim === 'Đảng bộ'; }) ||
      data().unitTable.cols.some(function (column) { return column.label === item[0]; });
    return '<section class="vpb-tdvcs-unit-panel" aria-label="Danh sách đảng bộ">' +
      '<div class="vpb-tdvcs-unit-head"><div><span>DANH SÁCH ' +
      data().unitTable.units.length + ' ĐẢNG BỘ</span><p>' +
      (hasUnitBreakdown ? 'Số liệu theo đảng bộ.' :
        'Chỉ tiêu chưa có breakdown theo đảng bộ; các đơn vị hiển thị 0.') + '</p></div>' +
      '<button type="button" class="vpb-tdvcs-export" data-vpb-export>⇩ Xuất CSV</button></div>' +
      '<label class="vpb-tdvcs-search"><span class="sr-only">Tìm đảng bộ</span>' +
      '<input type="search" data-vpb-search placeholder="Tìm tên đảng bộ..." /></label>' +
      '<div data-vpb-unit-content>' + unitTableHtml('', itemIndex) + '</div></section>';
  }

  function popupHtml(itemIndex) {
    var item = data().items[itemIndex];
    selectedBuckets = data().items.map(function () { return 'year'; });
    return '<div class="vpb-tdvcs-popup">' +
      '<div class="vpb-tdvcs-summary"><div><span>VĂN PHÒNG BAN TỔ CHỨC TRUNG ƯƠNG</span>' +
      '<h2>' + escapeHtml(item[0]) + '</h2>' +
      '<p>Dữ liệu mock cứng từ ' + escapeHtml(item[3]) + '; chưa kết nối API.</p></div>' +
      '<div class="vpb-tdvcs-kpis"><div><strong>' + formatNumber(item[1]) +
      '</strong><span>tổng số</span></div><div><strong>' +
      data().unitTable.units.length + '</strong><span>đảng bộ</span></div></div></div>' +
      '<div class="vpb-tdvcs-layout"><section class="vpb-tdvcs-indicators" aria-label="Danh sách chỉ tiêu">' +
      cardHtml(item, itemIndex) + '</section>' + rightPanelHtml(itemIndex) + '</div></div>';
  }

  function chartTokens() {
    var styles = activeRoot && typeof global.getComputedStyle === 'function'
      ? global.getComputedStyle(activeRoot)
      : null;
    function token(name, fallback) {
      var value = styles ? styles.getPropertyValue(name).trim() : '';
      return value || fallback;
    }
    return {
      text: token('--vpb-chart-text', '#dceeff'),
      muted: token('--vpb-chart-muted', '#8aa4bc'),
      grid: token('--vpb-chart-grid', 'rgba(87,178,255,.14)'),
      tooltip: token('--vpb-chart-tooltip', '#0a2038'),
      tooltipText: token('--vpb-chart-tooltip-text', '#ffffff'),
    };
  }

  function destroyChart(canvas) {
    var chart = charts.get(canvas);
    if (chart) {
      try { chart.destroy(); } catch (error) { }
      charts.delete(canvas);
    }
  }

  function renderCanvas(canvas) {
    if (typeof global.Chart === 'undefined') return;
    destroyChart(canvas);
    var itemIndex = Number(canvas.dataset.vpbItem);
    var partIndex = Number(canvas.dataset.vpbPart);
    var scaled = scaleItemEffective(data().items[itemIndex], itemIndex, selectedBuckets[itemIndex] || 'year');
    var part = scaled.parts[partIndex];
    if (!part || part.type !== 'bar') return;
    var values = part.items.map(function (entry) { return Number(entry.value) || 0; });
    var total = values.reduce(function (sum, value) { return sum + value; }, 0) || 1;
    var smallestShare = Math.min.apply(null, values.map(function (value) { return value / total; }));
    var isDoughnut = part.items.length < 4 && smallestShare >= 0.08;
    var tokens = chartTokens();
    var colors = part.items.map(function (_, index) { return PALETTE[index % PALETTE.length]; });
    var chart = new global.Chart(canvas, {
      type: isDoughnut ? 'doughnut' : 'bar',
      data: {
        labels: part.items.map(function (entry) { return entry.label; }),
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: isDoughnut ? 0 : 1,
          borderRadius: isDoughnut ? 0 : 4,
          maxBarThickness: 25,
        }],
      },
      options: {
        indexAxis: isDoughnut ? undefined : 'y',
        responsive: true,
        maintainAspectRatio: false,
        cutout: isDoughnut ? '66%' : undefined,
        plugins: {
          legend: {
            display: isDoughnut,
            position: 'bottom',
            labels: { color: tokens.text, boxWidth: 12, padding: 9, font: { size: 11, weight: 600 } },
          },
          tooltip: {
            backgroundColor: tokens.tooltip,
            titleColor: tokens.tooltipText,
            bodyColor: tokens.tooltipText,
            padding: 10,
          },
        },
        scales: isDoughnut ? {} : {
          x: { beginAtZero: true, ticks: { color: tokens.muted }, grid: { color: tokens.grid } },
          y: { ticks: { color: tokens.text, font: { size: 10 } }, grid: { display: false } },
        },
      },
    });
    charts.set(canvas, chart);
  }

  function renderCharts(scope) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    scope.querySelectorAll('canvas[data-vpb-item]').forEach(renderCanvas);
  }

  function renderCard(itemIndex) {
    if (!activeRoot || typeof activeRoot.querySelector !== 'function') return;
    var body = activeRoot.querySelector('[data-vpb-card-body="' + itemIndex + '"]');
    if (!body) return;
    if (typeof body.querySelectorAll === 'function') {
      body.querySelectorAll('canvas[data-vpb-item]').forEach(destroyChart);
    }
    body.innerHTML = cardBodyHtml(itemIndex, selectedBuckets[itemIndex] || 'year');
    renderCharts(body);
  }

  function showUnitTable(filterText) {
    if (!activeRoot || typeof activeRoot.querySelector !== 'function') return;
    var content = activeRoot.querySelector('[data-vpb-unit-content]');
    if (content) content.innerHTML = unitTableHtml(filterText, activeItemIndex);
  }

  function exportCsv() {
    var model = data();
    var item = model.items[activeItemIndex];
    var values = sourceColumnValues(item, activeItemIndex);
    var rows = [['Đảng bộ', item[0]], ['Tổng toàn quốc', item[1]]];
    model.unitTable.units.forEach(function (unit, unitIndex) {
      rows.push([unit, values[unitIndex]]);
    });
    var csv = '\uFEFF' + rows.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'chi-tieu-van-phong-ban-' + (activeItemIndex + 1) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  function onClick(event) {
    var exportButton = event.target.closest('[data-vpb-export]');
    if (exportButton) {
      event.preventDefault();
      exportCsv();
      return;
    }
    var backButton = event.target.closest('[data-vpb-back]');
    if (backButton) {
      event.preventDefault();
      var search = activeRoot.querySelector('[data-vpb-search]');
      if (search) search.value = '';
      activeUnitSearch = '';
      showUnitTable('');
      return;
    }
    if (event.target.closest('[data-vpb-period]')) return;
    var card = event.target.closest('[data-vpb-card]');
    if (!card || !activeRoot.contains(card)) return;
    var content = activeRoot.querySelector('[data-vpb-unit-content]');
    if (content) content.innerHTML = detailHtml(Number(card.dataset.vpbCard));
  }

  function onChange(event) {
    var select = event.target.closest('[data-vpb-period]');
    if (!select) return;
    event.stopPropagation();
    var itemIndex = Number(select.dataset.vpbPeriod);
    selectedBuckets[itemIndex] = select.value;
    renderCard(itemIndex);
    if (itemIndex === activeItemIndex) showUnitTable(activeUnitSearch);
  }

  function onInput(event) {
    if (!event.target.matches('[data-vpb-search]')) return;
    activeUnitSearch = event.target.value;
    showUnitTable(activeUnitSearch);
  }

  function bindEvents() {
    if (!activeRoot || typeof activeRoot.addEventListener !== 'function') return;
    clickHandler = onClick;
    changeHandler = onChange;
    inputHandler = onInput;
    activeRoot.addEventListener('click', clickHandler);
    activeRoot.addEventListener('change', changeHandler);
    activeRoot.addEventListener('input', inputHandler);
  }

  function destroy() {
    charts.forEach(function (chart) {
      try { chart.destroy(); } catch (error) { }
    });
    charts.clear();
    if (activeRoot && typeof activeRoot.removeEventListener === 'function') {
      if (clickHandler) activeRoot.removeEventListener('click', clickHandler);
      if (changeHandler) activeRoot.removeEventListener('change', changeHandler);
      if (inputHandler) activeRoot.removeEventListener('input', inputHandler);
    }
    clickHandler = null;
    changeHandler = null;
    inputHandler = null;
    activeRoot = null;
  }

  function openPopup(itemIndex) {
    destroy();
    var parsedIndex = Number(itemIndex);
    activeItemIndex = Number.isInteger(parsedIndex) && data().items[parsedIndex] ? parsedIndex : 0;
    activeUnitSearch = '';
    var item = data().items[activeItemIndex];
    var drawer = document.getElementById('drawer-ct');
    var title = document.getElementById('drawerTitle-ct');
    var body = document.getElementById('drawerBodyCT');
    if (!drawer || !title || !body || !item) return;
    title.textContent = 'Lĩnh vực: ' + TITLE + ' — ' + item[0];
    /* Ghi nhớ đúng id (TCD_ITEMS[itemIndex][5]) của chỉ tiêu đang mở — dùng làm indicatorKey khi
       import Excel qua nút "Nhập chỉ tiêu"/"Lưu dữ liệu" ở header drawer, VÀ để load dữ liệu thật từ
       API ngay bên dưới (xem script.js). */
    global.__activeDrawerIndicatorKey = item[5] || null;
    /* KHÔNG còn dùng popupHtml()/TCD_ITEMS/TCD_DANG_BO_TABLE (dữ liệu mẫu) để hiển thị nữa — chỉ hiện
       trạng thái "Đang tải..." tạm, sau đó để script.js tự gọi API thật
       (POST /api/v1/trung-uong/data/query) và render toàn bộ chart + bảng báo cáo từ đúng data API
       trả về (cùng 1 pipeline với bộ lọc Năm/Quý/Tháng ở drawer, xem onDrawerPeriodFilterChange). */
    body.innerHTML = '<div class="access-lock" style="text-align:center;padding:32px 16px">Đang tải dữ liệu...</div>';
    drawer.dataset.categoryPopup = CATEGORY_KEY;
    if (typeof global.openDrawer === 'function') global.openDrawer();
    if (!item[5]) {
      // Chỉ tiêu chưa có id -> không có gì để gọi API, đừng để kẹt mãi ở trạng thái "Đang tải...".
      if (typeof global.ictShowNoDataInDrawer === 'function') global.ictShowNoDataInDrawer('Chỉ tiêu này chưa có id để tải dữ liệu.');
    } else if (typeof global.onDrawerPeriodFilterChange === 'function') {
      global.onDrawerPeriodFilterChange();
    }
  }

  function refreshTheme() {
    if (!activeRoot) return;
    renderCharts(activeRoot);
  }

  function expandCards(cards, activeTabId) {
    if (activeTabId !== 'van_phong_ban') return cards;
    return cards.flatMap(function (card) {
      if (!card || card._id !== 'chart_van_phong_ban') return [card];
      return data().items.map(function (item, itemIndex) {
        return {
          _id: CARD_ID + '-' + itemIndex,
          _parent_id: 'van_phong_ban',
          titleDashboard: item[0],
          description: item[3],
          __vanPhongBanItemIndex: itemIndex,
          ...item,
        };
      });
    });
  }

  function isListCard(card) {
    return card && Number.isInteger(card.__vanPhongBanItemIndex);
  }

  var api = {
    CARD_ID: CARD_ID,
    CATEGORY_KEY: CATEGORY_KEY,
    TITLE: TITLE,
    expandCards: expandCards,
    isListCard: isListCard,
    gridCardHtml: gridCardHtml,
    open: openPopup,
    destroy: destroy,
    refreshTheme: refreshTheme,
  };

  global.VanPhongBanPopup = api;
  global.VAN_PHONG_BAN_TO_CHUC_DANG_CARD_ID = CARD_ID;
  global.openVanPhongBanToChucDangPopup = openPopup;
  global.destroyVanPhongBanToChucDangPopup = destroy;
  global.refreshVanPhongBanToChucDangTheme = refreshTheme;
  // Cho script.js gọi lại đúng hàm fetch này (cùng URL/headers/dev-auth) khi user đổi bộ lọc
  // Năm/Quý/Tháng ở drawer (xem drawerPeriodFilterHtml/onDrawerPeriodFilterChange trong script.js).
  global.fetchIndicatorReportForKey = fetchIndicatorReport;
})(typeof window !== 'undefined' ? window : globalThis);
