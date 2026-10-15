/* Dựng bản mẫu: ghép CSS thật của IOC (khung trang độc lập + stc/sgd/hcc/ubnd-overview) và bảng 126 xã, phường vào template.html.
   node build.js <thư mục gốc ioc> */
'use strict';
const fs = require('fs');
const path = require('path');
const root = process.argv[2];
const here = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const stc = read('standalone/stc-chi-tieu-doc-lap.html');
const s0 = stc.indexOf('<style>') + 7;
const s1 = stc.indexOf('/* ============================== SỞ TÀI CHÍNH', s0);
if (s0 < 7 || s1 < 0) throw new Error('Không tìm thấy khung CSS');
const css = stc.slice(s0, s1) + ['css/stc.css', 'css/sgd.css', 'css/hcc.css', 'css/ubnd-overview.css'].map((f) => '\n/* ===== ' + f + ' ===== */\n' + read(f)).join('');

const tsv = fs.readFileSync(path.join(here, '..', 'xa126-dan-so-dien-tich.tsv'), 'utf8').trim().split(/\r?\n/).slice(1);
const xa = tsv.map((l) => { const [k, n, dt, ds] = l.split('\t'); return [k === 'Phường' ? 'P' : 'X', n, Number(dt), Number(ds)]; });
if (xa.length !== 126) throw new Error('Cần 126 dòng, có ' + xa.length);
const data = '/* 126 xã, phường: [loại P/X, tên, diện tích km², dân số] — theo phương án sắp xếp ĐVHC cấp xã Hà Nội 2025 */\nconst XA=' + JSON.stringify(xa) + ';';

let html = fs.readFileSync(path.join(here, 'template.html'), 'utf8').replace('/*__CSS__*/', () => css).replace('/*__DATA__*/', () => data);
if (/<\/script/i.test(data)) throw new Error('Dữ liệu chứa </script>');
fs.writeFileSync(path.join(here, 'ban-mau-chi-tieu.html'), html, 'utf8');
console.log('OK ' + Math.round(html.length / 1024) + ' KB');
