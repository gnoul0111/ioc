/* Dựng lại trang ĐỘC LẬP của bộ chỉ tiêu Sở Tài chính: standalone/stc-chi-tieu-doc-lap.html.
   Trang này trước đây được ghép tay; công cụ này giữ nguyên phần khung (CSS khung, HTML, JS khung tối thiểu) của trang
   hiện có và chỉ THAY phần nhúng code gốc: css/stc.css và 5 file JS của bộ chỉ tiêu.
   Chạy lại mỗi khi sửa code Sở Tài chính:   node tools/stc-build-doc-lap.js */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'standalone', 'stc-chi-tieu-doc-lap.html');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const html = fs.readFileSync(out, 'utf8');

/* 1. CSS: từ đầu css/stc.css (dòng tiêu đề) đến </style> */
const cssMark = '/* ============================== SỞ TÀI CHÍNH — GIAO DIỆN FORM CHỈ TIÊU MỚI';
const c0 = html.indexOf(cssMark), c1 = html.indexOf('</style>', c0);
if (c0 < 0 || c1 < 0) throw new Error('Không tìm thấy phần CSS nhúng trong trang độc lập');

/* 2. JS: từ mốc file đầu tiên đến </script> cuối */
const jsMark = '/* ===== js\\core\\stc-config.js ===== */';
const j0 = html.indexOf(jsMark), j1 = html.lastIndexOf('</script>');
if (j0 < 0 || j1 < j0) throw new Error('Không tìm thấy phần JS nhúng trong trang độc lập');

const files = ['js\\core\\stc-config.js', 'js\\data\\stc-snapshot.js', 'js\\features\\stc-demo-data.js', 'js\\features\\stc-data.js', 'js\\features\\dashboard-stc.js'];
const js = files.map((f) => '/* ===== ' + f + ' ===== */\n' + read(f.replace(/\\/g, '/')).replace(/\s+$/, '') + '\n').join('\n');
const css = read('css/stc.css').replace(/\s+$/, '') + '\n\n';
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('Mã nhúng chứa thẻ đóng </script> hoặc </style>');

const built = html.slice(0, c0) + css + html.slice(c1, j0) + js + html.slice(j1);
fs.writeFileSync(out, built, 'utf8');
console.log('Đã dựng stc-chi-tieu-doc-lap.html (' + Math.round(built.length / 1024) + ' KB)');
