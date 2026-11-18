(function () {
  'use strict';

  const PREFIX = 'px-ioc-ui-visibility-unit:v1:';
  const root = document.getElementById('unit-indicator-visibility');
  if (!root) return;

  const $ = (selector) => root.querySelector(selector);
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  let selectedKey = '';
  const expandedFields = new Set();

  function showError(message) {
    const node = $('#uvAdminError');
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
  }

  function kindOf(id) {
    if (/^ind-kpi-/.test(id) || /^ubnd-kpi-/.test(id)) return 'indicator';
    if (/^ind-unit-/.test(id)) return 'field';
    if (/^ind-group-/.test(id)) return 'group';
    return null;
  }

  function itemKind(item) {
    return item && /^ind-group-/.test(item.id) ? 'group' : ((item && item.kind) || kindOf(item && item.id));
  }

  function scopeLabel(key, record) {
    if (record.scopeLabel) return record.scopeLabel;
    try { return decodeURIComponent(key.slice(PREFIX.length)); } catch (e) { return key.slice(PREFIX.length); }
  }

  function readRecords() {
    const list = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith(PREFIX)) continue;
        const raw = localStorage.getItem(key);
        const record = raw ? JSON.parse(raw) : {};
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          throw new Error(`Cấu hình ${key} không đúng định dạng.`);
        }
        const hidden = Array.isArray(record.hidden) ? [...new Set(record.hidden.filter((id) => typeof id === 'string'))] : [];
        const items = Array.isArray(record.items)
          ? record.items.filter((item) => item && typeof item.id === 'string' && typeof item.label === 'string')
          : [];
        list.push({ key, record: { ...record, hidden, items } });
      }
    } catch (error) {
      console.error('[unit-visibility-admin] Không đọc được cấu hình hiển thị.', error);
      showError('Không đọc được cấu hình từ trình duyệt. Kiểm tra dữ liệu localStorage hoặc thử tải lại trang.');
      return [];
    }
    return list.sort((a, b) => String(b.record.updatedAt || '').localeCompare(String(a.record.updatedAt || '')));
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  function itemLabel(record, id) {
    const item = record.items.find((candidate) => candidate.id === id);
    return item ? item.label : id;
  }

  function kindLabel(item) {
    const kind = itemKind(item);
    return kind === 'indicator' ? 'Chỉ tiêu' : kind === 'group' ? 'Nhóm lĩnh vực / trục' : 'Lĩnh vực';
  }

  function historyRow(entry) {
    return `<div class="uv-admin-history-row"><b>${esc(formatDate(entry.at))}</b><span>${esc(entry.by || '—')}</span><span>${esc(entry.action || `Đã lưu · ${entry.hiddenCount || 0} mục đang ẩn`)}</span></div>`;
  }

  function render() {
    showError('');
    const records = readRecords();
    const select = $('#uvAdminScopeSelect');
    const preferred = select.value || selectedKey;
    select.innerHTML = records.length
      ? records.map(({ key, record }) => `<option value="${esc(key)}">${esc(scopeLabel(key, record))}</option>`).join('')
      : '<option value="">Chưa có cấu hình</option>';
    selectedKey = records.some((item) => item.key === preferred) ? preferred : (records[0] ? records[0].key : '');
    select.value = selectedKey;

    const selected = records.find((item) => item.key === selectedKey);
    const record = selected ? selected.record : null;
    const items = record ? record.items : [];
    const hiddenIds = new Set(record ? record.hidden : []);
    const fields = items.filter((item) => itemKind(item) === 'field');
    const indicators = items.filter((item) => itemKind(item) === 'indicator');
    const hiddenFields = fields.length
      ? fields.filter((item) => hiddenIds.has(item.id)).length
      : [...hiddenIds].filter((id) => kindOf(id) === 'field').length;
    const hiddenIndicators = indicators.length
      ? indicators.filter((item) => hiddenIds.has(item.id)).length
      : [...hiddenIds].filter((id) => kindOf(id) === 'indicator').length;
    const totalFields = record && Number.isFinite(record.totalGroups)
      ? (Number.isFinite(record.totalFields) ? record.totalFields : fields.length)
      : fields.length;
    const hasSummary = !!record && (Number.isFinite(record.totalFields) || items.length > 0);

    $('#uvAdminTotalFields').textContent = hasSummary ? String(totalFields) : '—';
    $('#uvAdminVisibleFields').textContent = hasSummary
      ? String(Math.max(0, totalFields - hiddenFields))
      : '—';
    $('#uvAdminHiddenFields').textContent = String(hiddenFields);
    $('#uvAdminHiddenIndicators').textContent = String(hiddenIndicators);
    $('#uvAdminLastUpdate').textContent = record ? `Đơn vị: ${scopeLabel(selected.key, record)}` : '';
    $('#uvAdminUpdatedAt').textContent = record ? formatDate(record.updatedAt) : '—';
    $('#uvAdminUpdatedBy').textContent = record ? (record.updatedBy || '—') : '';
    $('#uvAdminEmpty').hidden = !!record;

    const visibilityFilter = $('#uvAdminVisibilityFilter').value || 'all';
    const listedItems = record ? [...items] : [];
    const knownIds = new Set(listedItems.map((item) => item.id));
    if (record) {
      record.hidden.filter((id) => !knownIds.has(id)).forEach((id) => listedItems.push({ id, label: itemLabel(record, id), kind: kindOf(id) || 'field' }));
    }
    const matchesFilter = (item) => {
      const isHidden = hiddenIds.has(item.id);
      return visibilityFilter === 'all' || (visibilityFilter === 'hidden' ? isHidden : !isHidden);
    };
    const rowHtml = (item, nested, childCount, expanded) => {
      const isHidden = hiddenIds.has(item.id);
      const status = isHidden ? 'Đang ẩn' : 'Đang hiển thị';
      const action = isHidden ? 'show' : 'hide';
      const actionLabel = isHidden ? 'Hiện lại' : 'Ẩn';
      const expand = childCount
        ? `<button type="button" class="uv-admin-expand${expanded ? ' is-open' : ''}" data-uv-admin-expand="${esc(item.id)}" aria-expanded="${expanded}" aria-label="${expanded ? 'Thu gọn' : 'Xem'} chỉ tiêu thuộc ${esc(item.label)}"><span aria-hidden="true">›</span><small>${childCount}</small></button>`
        : '';
      const detail = !nested && itemKind(item) === 'indicator' && item.groupLabel ? `<small>${esc(item.groupLabel)}</small>` : '';
      return `<tr class="${nested ? 'uv-admin-child-row' : 'uv-admin-parent-row'}" ${nested ? `data-uv-admin-child-of="${esc(item.parentId)}"` : ''}><td><div class="uv-admin-item-cell${nested ? ' is-nested' : ''}">${expand}<div><b>${esc(item.label)}</b>${detail}</div></div></td><td><span class="uv-admin-type">${kindLabel(item)}</span></td><td><span class="uv-admin-state${isHidden ? ' is-hidden' : ''}">${status}</span></td><td>${esc(record.updatedBy || '—')}<br><small>${esc(formatDate(record.updatedAt))}</small></td><td><button type="button" class="btn${isHidden ? '' : ' danger'}" data-uv-admin-visibility="${action}" data-uv-admin-item="${esc(item.id)}">${actionLabel}</button></td></tr>`;
    };
    const fieldsInList = listedItems.filter((item) => itemKind(item) === 'field');
    const indicatorsInList = listedItems.filter((item) => itemKind(item) === 'indicator');
    const groupsInList = listedItems.filter((item) => itemKind(item) === 'group');
    const indicatorsByCategory = new Map();
    indicatorsInList.forEach((item) => {
      if (!item.categoryKey) return;
      const group = indicatorsByCategory.get(item.categoryKey) || [];
      group.push(item);
      indicatorsByCategory.set(item.categoryKey, group);
    });
    const groupedIndicatorIds = new Set();
    let rows = '';
    fieldsInList.forEach((field) => {
      const children = field.categoryKey ? (indicatorsByCategory.get(field.categoryKey) || []) : [];
      children.forEach((item) => groupedIndicatorIds.add(item.id));
      const matchingChildren = children.filter(matchesFilter);
      if (!matchesFilter(field) && !matchingChildren.length) return;
      const expanded = expandedFields.has(field.id);
      rows += rowHtml(field, false, children.length, expanded);
      if (expanded) {
        rows += matchingChildren.map((item) => rowHtml({ ...item, parentId: field.id }, true, 0, false)).join('');
      }
    });
    groupsInList.filter(matchesFilter).forEach((item) => { rows += rowHtml(item, false, 0, false); });
    indicatorsInList.filter((item) => !groupedIndicatorIds.has(item.id) && matchesFilter(item))
      .forEach((item) => { rows += rowHtml(item, false, 0, false); });
    $('#uvAdminHiddenRows').innerHTML = rows || `<tr><td colspan="5" class="muted">${record ? 'Không có mục nào phù hợp bộ lọc.' : 'Chưa có cấu hình.'}</td></tr>`;

    const history = record && Array.isArray(record.history) ? [...record.history].reverse() : [];
    $('#uvAdminHistoryRows').innerHTML = history.length
      ? history.map(historyRow).join('')
      : '<div class="muted">Chưa có lịch sử thay đổi.</div>';
    $('#uvAdminHistory').hidden = true;
    const restore = root.querySelector('[data-uv-admin-action="restore"]');
    if (restore) restore.disabled = !record || !record.hidden.length;
  }

  function writeRecord(key, record) {
    try {
      localStorage.setItem(key, JSON.stringify(record));
      selectedKey = key;
      render();
      return true;
    } catch (error) {
      console.error('[unit-visibility-admin] Không lưu được cấu hình hiển thị.', error);
      showError('Không lưu được cấu hình vào trình duyệt này.');
      return false;
    }
  }

  function updateRecord(action, itemId) {
    const selected = readRecords().find((item) => item.key === selectedKey);
    if (!selected) {
      showError('Chưa có cấu hình để cập nhật. Hãy mở IOC và lưu cấu hình trước.');
      return;
    }
    const { key, record } = selected;
    const hidden = new Set(record.hidden);
    if (action === 'restore') hidden.clear();
    else if (action === 'hide') hidden.add(itemId);
    else if (action === 'show') hidden.delete(itemId);
    else if (hidden.has(itemId)) hidden.delete(itemId);
    else hidden.add(itemId);
    const at = new Date().toISOString();
    const history = Array.isArray(record.history) ? record.history : [];
    const actor = 'Admin demo';
    const historyAction = action === 'restore' ? 'Khôi phục mặc định' : `${hidden.has(itemId) ? 'Ẩn' : 'Hiện'}: ${itemLabel(record, itemId)}`;
    const updated = {
      ...record,
      hidden: [...hidden],
      updatedAt: at,
      updatedBy: actor,
      hiddenFields: (record.items || []).filter((item) => itemKind(item) === 'field' && hidden.has(item.id)).length,
      hiddenGroups: (record.items || []).filter((item) => itemKind(item) === 'group' && hidden.has(item.id)).length,
      hiddenIndicators: (record.items || []).filter((item) => itemKind(item) === 'indicator' && hidden.has(item.id)).length,
      history: [...history, { at, by: actor, action: historyAction, hiddenCount: hidden.size }].slice(-30)
    };
    writeRecord(key, updated);
  }

  root.addEventListener('change', (event) => {
    if (event.target.id === 'uvAdminScopeSelect') {
      selectedKey = event.target.value;
      render();
    } else if (event.target.id === 'uvAdminVisibilityFilter') {
      render();
    }
  });
  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-uv-admin-action]');
    if (action) {
      if (action.dataset.uvAdminAction === 'history') {
        const history = $('#uvAdminHistory');
        history.hidden = !history.hidden;
        action.setAttribute('aria-expanded', String(!history.hidden));
      } else if (action.dataset.uvAdminAction === 'restore') {
        if (window.confirm('Khôi phục mặc định cho đơn vị đang chọn? Tất cả mục bị ẩn sẽ được hiển thị lại.')) updateRecord('restore');
      }
      return;
    }
    const toggle = event.target.closest('[data-uv-admin-visibility]');
    if (toggle) {
      updateRecord(toggle.getAttribute('data-uv-admin-visibility'), toggle.getAttribute('data-uv-admin-item'));
      return;
    }
    const expand = event.target.closest('[data-uv-admin-expand]');
    if (expand) {
      const id = expand.getAttribute('data-uv-admin-expand');
      if (expandedFields.has(id)) expandedFields.delete(id);
      else expandedFields.add(id);
      render();
    }
  });
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key.startsWith(PREFIX)) render();
  });
  window.addEventListener('pageshow', render);
  window.uvAdminRender = render;
})();
