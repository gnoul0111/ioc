(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.IndicatorImportCounts = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    function slug(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }

    function displayName(value) {
        return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function build(entries) {
        var buckets = new Map();
        (entries || []).forEach(function (entry) {
            var key = slug(entry && entry.code) || slug(entry && entry.name);
            if (!key || !entry || !Number.isInteger(entry.sourceRow)) return;
            var bucket = buckets.get(key);
            if (!bucket) {
                bucket = {
                    ma_don_vi: key,
                    ten_don_vi: displayName(entry.name),
                    rows: new Set(),
                };
                buckets.set(key, bucket);
            }
            bucket.rows.add(entry.sourceRow);
        });
        return Array.from(buckets.values()).map(function (bucket) {
            return {
                ma_don_vi: bucket.ma_don_vi,
                ten_don_vi: bucket.ten_don_vi,
                count: bucket.rows.size,
            };
        });
    }

    return { build: build, slug: slug };
});
