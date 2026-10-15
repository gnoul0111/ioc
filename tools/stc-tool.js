#!/usr/bin/env node
/*
 * Công cụ nạp số liệu Sở Tài chính (STC) vào web IOC — Node thuần, không cần cài thư viện.
 *
 * Số liệu API Sở Tài chính chỉ trả lời cho IP được whitelist, nên web không gọi trực tiếp. Thay vào đó web đọc
 * một "bản chụp" nhúng sẵn: file js/data/stc-snapshot.js (window.STC_SNAPSHOT). Công cụ này sinh/cập nhật file đó
 * từ một thư mục chứa 14 file JSON đúng như API trả về (vd thư mục export_stc_api_ba/).
 *
 * Lệnh:
 *   node tools/stc-tool.js import <thư-mục> --year 2026 --period 1 [--source "ghi chú nguồn"] [--dry-run]
 *   node tools/stc-tool.js validate          kiểm tra file bản chụp hiện có
 *   node tools/stc-tool.js list              liệt kê các kỳ đã nạp
 *
 * Tên file trong thư mục: "01_sp_dia_ban.json" ... "14_chi_ngan_sach_dia_phuong.json" (số thứ tự 01–14)
 * hoặc "<MÃ_API>.json" (vd THU_NGAN_SACH.json). File 00_auth_token.json bị bỏ qua (không bao giờ lưu token).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const SNAPSHOT_FILE = path.join(__dirname, '..', 'js', 'data', 'stc-snapshot.js');
const CODES = [
  'SP_DIA_BAN', 'TONG_HANG_BAN_RA', 'TONG_HANG_BAN_LE', 'VON_DAU_TU', 'VON_NSNN_DIA_PHUONG',
  'CHI_SO_SXCN', 'DA_TRONG_DIEM', 'DOANH_THU_VAN_TAI', 'KHACH_DU_LICH_HN', 'KIM_NGACH_XK',
  'KIM_NGACH_NK', 'CHI_SO_KINH_TE', 'THU_NGAN_SACH', 'CHI_NGAN_SACH_DIA_PHUONG'
];

function fail(msg) { console.error('LỖI: ' + msg); process.exit(1); }

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (k === 'dry-run') out['dry-run'] = true;
      else out[k] = argv[++i];
    } else out._.push(a);
  }
  return out;
}

/* Đọc bản chụp hiện có (file JS dạng: window.STC_SNAPSHOT = {...};) */
function readSnapshot() {
  if (!fs.existsSync(SNAPSHOT_FILE)) return { version: 1, periods: {} };
  const txt = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
  const start = txt.indexOf('{');
  const end = txt.lastIndexOf('}');
  if (start < 0 || end < 0) fail('File bản chụp hiện có bị hỏng: ' + SNAPSHOT_FILE);
  try { return JSON.parse(txt.slice(start, end + 1)); }
  catch (e) { fail('Không đọc được file bản chụp hiện có: ' + e.message); }
}

function writeSnapshot(snap) {
  fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
  const header = '/* TỰ ĐỘNG SINH bởi stc-tool.js — đừng sửa tay. Bản chụp số liệu API Sở Tài chính Hà Nội (dữ liệu thô như API trả về). */\n';
  fs.writeFileSync(SNAPSHOT_FILE, header + 'window.STC_SNAPSHOT = ' + JSON.stringify(snap, null, 1) + ';\n', 'utf8');
}

/* Tìm file JSON của từng mã API trong thư mục */
function findFiles(dir) {
  const names = fs.readdirSync(dir).filter((n) => /\.json$/i.test(n));
  const map = {};
  names.forEach((n) => {
    const stem = n.replace(/\.json$/i, '');
    if (/^00_/.test(stem)) return; // token: bỏ qua
    const m = /^(\d{2})_/.exec(stem);
    if (m) {
      const idx = parseInt(m[1], 10) - 1;
      if (idx >= 0 && idx < CODES.length) map[CODES[idx]] = n;
    }
    const up = stem.toUpperCase();
    if (CODES.includes(up)) map[up] = n;
  });
  return map;
}

function validateRows(code, payload) {
  const errs = [];
  if (!payload || typeof payload !== 'object') return ['không phải JSON object'];
  if (payload.code !== 0) errs.push('code = ' + payload.code + ' (kỳ vọng 0), message: ' + payload.message);
  if (!Array.isArray(payload.data)) { errs.push('thiếu mảng data'); return errs; }
  payload.data.forEach((r, i) => {
    if (typeof r.chiTieu !== 'string') errs.push('dòng ' + (i + 1) + ': chiTieu không phải chuỗi');
    if (typeof r.loai !== 'string') errs.push('dòng ' + (i + 1) + ': loai không phải chuỗi');
    if (typeof r.giaTri !== 'number' || !isFinite(r.giaTri)) errs.push('dòng ' + (i + 1) + ': giaTri không phải số');
    if (typeof r.quy !== 'string') errs.push('dòng ' + (i + 1) + ': quy không phải chuỗi');
  });
  return errs;
}

function summarize(dataByCode) {
  const rows = [];
  CODES.forEach((c) => {
    const arr = dataByCode[c];
    if (!arr) { rows.push([c, 'THIẾU', '', '']); return; }
    const nz = arr.filter((r) => r.giaTri !== 0).length;
    rows.push([c, String(arr.length), String(nz), nz === 0 ? 'toàn 0 (chưa có số)' : 'có số']);
  });
  const w = [Math.max(...rows.map((r) => r[0].length)), 6, 8, 20];
  console.log(['Mã API'.padEnd(w[0]), 'Dòng'.padStart(w[1]), 'Khác 0'.padStart(w[2]), 'Ghi chú'].join('  '));
  rows.forEach((r) => console.log([r[0].padEnd(w[0]), r[1].padStart(w[1]), r[2].padStart(w[2]), r[3]].join('  ')));
}

function cmdImport(args) {
  const dir = args._[1];
  if (!dir) fail('Thiếu đường dẫn thư mục. Ví dụ: node tools/stc-tool.js import export_stc_api_ba --year 2026 --period 1');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) fail('Không tìm thấy thư mục: ' + dir);
  const year = parseInt(args.year, 10), period = parseInt(args.period, 10);
  if (!(year >= 2000 && year <= 2100)) fail('Thiếu hoặc sai --year (vd 2026)');
  if (!(period >= 1 && period <= 12)) fail('Thiếu hoặc sai --period (vd 1)');

  const files = findFiles(dir);
  const missing = CODES.filter((c) => !files[c]);
  if (missing.length) fail('Thiếu file cho ' + missing.length + ' API: ' + missing.join(', '));

  const data = {};
  const problems = [];
  CODES.forEach((c) => {
    let payload;
    try { payload = JSON.parse(fs.readFileSync(path.join(dir, files[c]), 'utf8')); }
    catch (e) { problems.push(c + ' (' + files[c] + '): không đọc được JSON — ' + e.message); return; }
    const errs = validateRows(c, payload);
    if (errs.length) { errs.slice(0, 5).forEach((e) => problems.push(c + ' (' + files[c] + '): ' + e)); return; }
    data[c] = payload.data.map((r) => ({ chiTieu: r.chiTieu, giaTri: r.giaTri, loai: r.loai, quy: r.quy }));
  });
  if (problems.length) { problems.forEach((p) => console.error(' - ' + p)); fail('Có ' + problems.length + ' vấn đề, chưa ghi gì.'); }

  console.log('Đã đọc đủ 14 API từ ' + dir + ' cho kỳ ' + period + '/' + year + ':');
  summarize(data);
  if (args['dry-run']) { console.log('\n(--dry-run: không ghi file)'); return; }

  const snap = readSnapshot();
  snap.version = 1;
  snap.periods = snap.periods || {};
  const key = year + '-' + period;
  const replaced = !!snap.periods[key];
  snap.periods[key] = {
    year, period,
    importedAt: new Date().toISOString(),
    source: args.source || path.basename(path.resolve(dir)),
    data
  };
  writeSnapshot(snap);
  console.log('\n' + (replaced ? 'Đã THAY' : 'Đã THÊM') + ' kỳ ' + key + ' vào ' + path.relative(path.join(__dirname, '..'), SNAPSHOT_FILE));
  console.log('Các kỳ hiện có: ' + Object.keys(snap.periods).sort().join(', '));
}

function cmdList() {
  const snap = readSnapshot();
  const keys = Object.keys(snap.periods || {}).sort();
  if (!keys.length) { console.log('Chưa có kỳ nào.'); return; }
  keys.forEach((k) => {
    const p = snap.periods[k];
    const nz = CODES.filter((c) => (p.data[c] || []).some((r) => r.giaTri !== 0)).length;
    console.log(k + '  nạp lúc ' + p.importedAt + '  nguồn: ' + p.source + '  API có số: ' + nz + '/' + CODES.length);
  });
}

function cmdValidate() {
  const snap = readSnapshot();
  const keys = Object.keys(snap.periods || {});
  if (!keys.length) fail('Bản chụp trống.');
  let bad = 0;
  keys.forEach((k) => {
    const p = snap.periods[k];
    CODES.forEach((c) => {
      if (!Array.isArray(p.data[c])) { console.error(k + ': thiếu ' + c); bad++; return; }
      const errs = validateRows(c, { code: 0, data: p.data[c] });
      errs.forEach((e) => { console.error(k + ' ' + c + ': ' + e); bad++; });
    });
  });
  if (bad) fail(bad + ' vấn đề.');
  console.log('Bản chụp hợp lệ: ' + keys.length + ' kỳ, đủ ' + CODES.length + ' API mỗi kỳ.');
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (cmd === 'import') cmdImport(args);
else if (cmd === 'list') cmdList();
else if (cmd === 'validate') cmdValidate();
else {
  console.log('Cách dùng:\n  node tools/stc-tool.js import <thư-mục> --year 2026 --period 1 [--source "ghi chú"] [--dry-run]\n  node tools/stc-tool.js list\n  node tools/stc-tool.js validate');
  process.exit(cmd ? 1 : 0);
}
