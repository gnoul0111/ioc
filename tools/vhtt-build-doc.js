/* Sinh docs/VHTT_SoVanHoaTheThao/VHTT_MO_TA_CHI_TIEU.md từ bảng cách tính VHTT_CT (js/core/vhtt-config.js) — sửa cách tính trong config rồi chạy lại:
   node tools/vhtt-build-doc.js   (chạy từ thư mục gốc ioc). Kèm phụ lục danh sách trường nếu có tools/vhtt-fields.json. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/core/vhtt-config.js'), 'utf8') + '\n;this.CT=VHTT_CT;this.KY=VHTT_KY;this.D=VHTT_DATA;', ctx);
const CT = ctx.CT;
const fieldsFile = path.join(__dirname, 'vhtt-fields.json');
const FIELDS = fs.existsSync(fieldsFile) ? JSON.parse(fs.readFileSync(fieldsFile, 'utf8')) : null;
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

let md = '# Sở Văn hóa và Thể thao — Mô tả chỉ tiêu trên IOC\n\n';
md += 'Tài liệu mô tả 6 chỉ tiêu của Sở Văn hóa và Thể thao trên IOC, dựng theo 6 eform trong "File mô tả đầu vào eform" (sheet "Sở VHTT", 152 trường nhập). Với mỗi chỉ tiêu: lấy bản ghi nào, mỗi số liệu và biểu đồ lấy từ trường nào, tính ra sao, và kết quả với số liệu giả lập hiện tại.\n\n';
md += '**Lưu ý:** chưa có số liệu thật. Mọi con số trong tài liệu là số giả lập dùng để dựng giao diện, đã cộng kiểm cho khớp. Kỳ hiển thị mặc định là ' + ctx.KY + ' (tháng 1 – 9); chỉ tiêu 1 và 2 lấy bản báo cáo mới nhất vì số đã là số tích lũy.\n\n';
md += '## Tóm tắt\n\n| # | Chỉ tiêu trên IOC | Eform nguồn | Kỳ | Số bản ghi (giả lập) |\n|---|---|---|---|---|\n';
CT.forEach((c, i) => { md += `| ${i + 1} | ${cell(c.name)} | ${cell(c.eform)} | ${c.ky} | ${c.soBanGhi.toLocaleString('vi-VN')} |\n`; });
md += '\n**Quy ước chung**\n\n- Tên trường viết đúng như tên hiển thị trong file mô tả eform.\n- "Cộng" là cộng giá trị của trường trên tất cả bản ghi được lấy; "Đếm" là đếm số bản ghi thỏa điều kiện.\n- Tỷ lệ (%) = tử số ÷ mẫu số × 100, làm tròn 1 chữ số thập phân.\n- Bảng 126 phường/xã ở bên phải form: mỗi cột nhóm theo trường Địa bàn (riêng chỉ tiêu 5 theo Đơn vị báo cáo); dòng Toàn Thành phố bằng tổng các phường/xã.\n- Bấm vào một khối biểu đồ trên IOC thì bảng số của chính biểu đồ đó hiện ở ô bên phải.\n\n';
CT.forEach((c, i) => {
  md += `## ${i + 1}. ${c.name}\n\n`;
  md += `- **Eform nguồn:** ${c.eform}\n- **Kỳ báo cáo:** ${c.freq.toLowerCase()} · kỳ đang hiển thị: ${c.ky}\n- **Bản ghi:** ${c.banGhi.replace(/[«»]/g, '"')}\n\n`;
  md += '| # | Số liệu / biểu đồ | Lấy từ trường | Cách tính | Kết quả (giả lập) |\n|---|---|---|---|---|\n';
  c.f.forEach((x, j) => { md += `| ${j + 1} | ${cell(x.so)} | ${cell(x.truong)} | ${cell(x.cach)} | ${cell(x.kq)} |\n`; });
  if (c.giaDinh && c.giaDinh.length) { md += '\n**Giả định, cần Sở xác nhận**\n\n' + c.giaDinh.map((t) => '- ' + t.replace(/[«»]/g, '"')).join('\n') + '\n'; }
  md += '\n';
});
if (FIELDS) {
  md += '## Phụ lục — Danh sách trường của 6 eform\n\nTrích từ file mô tả đầu vào eform. Bốn trường kỳ báo cáo (Kỳ báo cáo, Năm, Quý, Tháng) có ở mọi eform.\n\n';
  FIELDS.forEach((e, i) => {
    md += `### ${i + 1}. ${e.eform} (${e.fields.length} trường)\n\n| Tên trường | Mã trường | Kiểu nhập |\n|---|---|---|\n`;
    e.fields.forEach((f) => { md += `| ${cell(f[0])} | \`${f[1]}\` | ${cell(f[2])} |\n`; });
    md += '\n';
  });
}
fs.writeFileSync(path.join(root, 'docs/VHTT_SoVanHoaTheThao/VHTT_MO_TA_CHI_TIEU.md'), md, 'utf8');
console.log('Đã ghi docs/VHTT_SoVanHoaTheThao/VHTT_MO_TA_CHI_TIEU.md (' + md.length + ' ký tự)');
