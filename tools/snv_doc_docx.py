# -*- coding: utf-8 -*-
"""Sinh docs/SNV_SoNoiVu/SNV_MO_TA_CHI_TIEU.docx + .md — tài liệu mô tả 4 chỉ tiêu theo 2 eform của Sở Nội vụ trên IOC.
Chạy từ thư mục gốc ioc:  python tools/snv_doc_docx.py
Lời văn viết tay; CÁC CON SỐ đọc thẳng từ js/core/snv-config.js (qua node). Tên trường đúng như file mô tả đầu vào eform
(tools/snv-fields.json, sheet "Sở Nội vụ"); tài liệu được ghi mã chỉ tiêu của eform, còn giao diện IOC không hiện mã.
Word + Markdown qua tools/doc_kit.py. Sau khi sinh, cập nhật Mục lục bằng tools/vhtt_doc_finalize.ps1."""
import json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EF = json.load(open(os.path.join(ROOT, 'tools', 'snv-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'SNV_SoNoiVu', 'SNV_MO_TA_CHI_TIEU.docx')
_JS = ("const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);"
       "vm.runInContext(fs.readFileSync('js/core/snv-config.js','utf8')+';this.S=SNV_SUM;this.D=SNV_UNITS.reduce((a,u)=>a+u.dan,0);',c);"
       "process.stdout.write(JSON.stringify({S:c.S,D:c.D}));")
_R = json.loads(subprocess.run(['node', '-e', _JS], cwd=ROOT, capture_output=True, check=True).stdout.decode('utf-8'))
S, DAN = _R['S'], _R['D']


def n(x, d=0):
    s = f'{abs(x):,.{d}f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return ('−' if x < 0 else '') + s
def pc(a, b, d=1): return n(a / b * 100, d) + '%'
def ty(trieu): return n(trieu / 1000) + ' tỷ đồng'


B, L, C, D = S['bh'], S['ld'], S['bc'], S['cds']
EA, EB = EF
NDV = 126

k = Kit('Sở Nội vụ · Mô tả chỉ tiêu trên IOC')
para, table, box, heading, note = k.para, k.table, k.box, k.heading, k.note

# ======================================================= TRANG BÌA
k.blank(5)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(4)
para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, CENTER, 6, bold=True, color=NAVY)
para('SỞ NỘI VỤ THÀNH PHỐ HÀ NỘI', 20, CENTER, 14, bold=True, color=NAVY)
para('Bảo hiểm, lao động, biên chế và cán bộ chuyển đổi số: biểu đồ, trường dữ liệu và cách tính', 14, CENTER, 4, italic=True, color=GREY)
para('xây dựng từ 2 eform nhập liệu của Sở', 14, CENTER, 0, italic=True, color=GREY)
k.blank(5)
table([
    ['Đơn vị', 'Sở Nội vụ Thành phố Hà Nội (hợp nhất từ Sở Nội vụ và Sở Lao động - Thương binh và Xã hội)'],
    ['Nguồn dữ liệu', f'File mô tả đầu vào eform, sheet "Sở Nội vụ": 2 eform, {len(EA["fields"]) + len(EB["fields"])} trường nhập'],
    ['Phạm vi', '4 chỉ tiêu, 13 biểu đồ, bảng 126 phường/xã; giữ 5 chỉ tiêu số liệu thật đã có'],
    ['Số liệu ví dụ', 'Số giả lập đặt theo số liệu đã công bố của Hà Nội, kỳ tháng 9/2026'],
    ['Phiên bản', '1.2 · ngày 13/10/2026 (theo phản hồi nhóm triển khai khi nối eform thật: thêm quy ước xử lý dữ liệu eform — khóa bản ghi, cách lấy theo kỳ, chỉ hiện số có trường trong eform)'],
], [4.2, 10.0], header=False, size=12, key_col=True)
k.page_break()
k.toc()
k.page_break()

# ======================================================= PHẦN I
heading('PHẦN I. QUY ƯỚC CHUNG', 1)
heading('1. Mục đích tài liệu', 2)
para('Tài liệu mô tả cách IOC dựng các chỉ tiêu của Sở Nội vụ từ 2 eform: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào, mỗi con số được tính ra sao. Tên trường viết đúng như file mô tả eform. Eform bảo hiểm có trường «Mã chỉ tiêu QĐ4795» (mã 27 – 31); tài liệu ghi mã để Sở đối chiếu, **trên giao diện IOC chỉ ghi tên bằng lời, không hiện mã**.')
para('Trên giao diện, mỗi chỉ tiêu chỉ gồm **thẻ số tổng hợp** và **biểu đồ**; cách tính chỉ trình bày trong tài liệu này.')

heading('2. Hai eform, bốn chỉ tiêu', 2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Nội dung chính'],
    ['1', 'Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp', EA['eform'], 'Tỷ lệ tham gia bảo hiểm xã hội, thất nghiệp; người hưởng chế độ hằng tháng; thu, chi'],
    ['2', 'Lao động, việc làm trên địa bàn', EB['eform'], 'Lực lượng lao động, lao động qua đào tạo, lao động đi làm việc ở nước ngoài, lao động nước ngoài'],
    ['3', 'Biên chế công chức, viên chức cấp xã', EB['eform'], 'Biên chế được giao, thực hiện, hưởng lương; tuyển mới, nghỉ hưu, thôi việc, chuyển công tác'],
    ['4', 'Cán bộ chuyển đổi số và chữ ký số', EB['eform'], 'Đơn vị có chuyên trách chuyển đổi số, an toàn thông tin mạng; bồi dưỡng kỹ năng số; chữ ký số công vụ'],
], [0.8, 4.2, 4.6, 6.4], size=10.5)
para('Eform "Lao động Công chức viên chức" gồm ba nhóm trường khác hẳn nhau nên IOC tách thành 3 chỉ tiêu (cùng cách đã làm với Ban Quản lý Khu công nghệ cao và khu công nghiệp). Mỗi bản ghi là số liệu **một tháng của một «Địa bàn»** (126 phường/xã). Ở eform bảo hiểm, mỗi bản ghi là **một «Địa bàn» × một «Mã chỉ tiêu»** (5 mã) trong một kỳ.')

heading('3. Năm chỉ tiêu số liệu thật giữ nguyên', 2)
para('Bộ chỉ tiêu cũ STT 42 (Lao động), 47 (Công chức, viên chức) và 53 (Chỉ số cải cách hành chính) đã **thay bằng 4 chỉ tiêu theo eform**. Năm chỉ tiêu đang có số liệu thật, chưa có eform thay thế, **giữ nguyên ở cuối danh sách**: Doanh nghiệp tham gia tuyển dụng (64), Tổng số nhu cầu tuyển dụng (443), Số hồ sơ tìm việc (652), Tổng số chi trả an sinh cho người có công (tháng 3/2026), Tổng số công chức, viên chức khối chính quyền (năm 2025: 136.343).')

heading('4. Kỳ báo cáo', 2)
para('Kỳ hiển thị mặc định: **tháng 9/2026**. Số người tham gia bảo hiểm, người hưởng, lực lượng lao động, lao động nước ngoài, biên chế, số cán bộ được bồi dưỡng và cấp chữ ký số là **số tại thời điểm**: lấy bản ghi tháng đang xem, không cộng các tháng. Thu, chi bảo hiểm, lao động đi làm việc ở nước ngoài, tuyển mới, nghỉ hưu, thôi việc, chuyển công tác là **số trong tháng**: thẻ số cộng 9 tháng, biểu đồ theo tháng dùng bản ghi tháng 1 – 9.')

heading('5. Căn cứ đặt số giả lập', 2)
table([
    ['Số liệu công bố', 'Giá trị', 'Số giả lập tháng 9/2026'],
    ['Người tham gia BHXH hết năm 2025', 'Gần 2,39 triệu bắt buộc + 136,5 nghìn tự nguyện', n(B['bhxh']) + ' người (' + pc(B['bhxh'], B['llld']) + ')'],
    ['Chỉ tiêu năm 2025 (trên lực lượng lao động trong độ tuổi)', 'BHXH bắt buộc 47,5%, tự nguyện 3,5%; BHTN 45%', 'BHXH ' + pc(B['bhxh'], B['llld']) + '; BHTN ' + pc(B['bhtn'], B['llld'])],
    ['Thu BHXH, BHYT, BHTN năm 2025', 'Khoảng 78 – 80 nghìn tỷ đồng', 'Đã thu 9 tháng ' + ty(B['daThu'])],
    ['Chi năm 2025', 'Trên 49 nghìn tỷ đồng', 'Đã chi 9 tháng ' + ty(B['daChi'])],
    ['Người hưởng lương hưu, trợ cấp BHXH hằng tháng (4/2025)', '~596 nghìn; 99,25% nhận qua tài khoản', n(B['nguoiHuong']) + ' người; ' + pc(B['quaTk'], B['nguoiHuong']) + ' qua tài khoản'],
    ['Cán bộ, công chức bố trí cho 126 xã, phường (2025)', '9.536 người', 'Biên chế được giao ' + n(C['giao']) + ', thực hiện ' + n(C['thucHien'])],
    ['Biên chế tạm giao năm 2025 (QĐ 4164/QĐ-UBND)', '139.501 công chức, viên chức toàn Thành phố', 'Không dùng: eform chỉ báo cáo theo phường/xã'],
    ['Giấy phép lao động nước ngoài 9 tháng 2025', '8.009 lượt; cả nước 162.858 lao động nước ngoài (cuối 2025)', n(L['nuocNgoai']) + ' người đang làm việc (giả định)'],
    ['Lao động Hà Nội đi làm việc ở nước ngoài', 'Chưa thấy số công bố; cả nước ~150 nghìn người/năm', n(L['diNn']) + ' người trong 9 tháng (giả định)'],
    ['Cán bộ ký số', '100% xử lý hồ sơ trên môi trường mạng và ký số từ 30/6/2025', pc(D['cks'], D['tong']) + ' được cấp chữ ký số'],
    ['Dân số Hà Nội', 'Khoảng 8,6 – 8,7 triệu người', n(DAN) + ' người; lực lượng lao động trong độ tuổi ' + n(B['llld'])],
], [5.0, 5.0, 6.0], size=10)
note('Nguồn: Tạp chí Kinh tế Tài chính, VnBusiness (BHXH Hà Nội 2025), Luật sư Việt Nam (người hưởng lương hưu tại Hà Nội), Báo Đấu thầu (QĐ 4164/QĐ-UBND tạm giao biên chế), Báo Văn hóa (9.536 cán bộ cho 126 xã, phường), VnEconomy (giấy phép lao động nước ngoài 9 tháng 2025). Phân bổ theo phường/xã, theo tháng là giả lập: phường cao hơn xã; xã có khu công nghiệp nhiều lao động làm công ăn lương và lao động nước ngoài; xã miền núi thấp hơn mặt bằng.')

heading('6. Nguyên tắc tính tỷ lệ', 2)
para('Eform bảo hiểm có sẵn trường «Tỷ lệ (%)» do đơn vị tự tính (dữ liệu mẫu nhập 0,5 thay vì 50). IOC **không dùng** trường này mà **cộng «Số đối tượng đạt» và «Tổng số đối tượng» của 126 phường/xã rồi mới chia**. Các tỷ lệ ở eform lao động, công chức cũng tính theo cách đó.')
box([f'Tỷ lệ tham gia bảo hiểm xã hội toàn Thành phố = {n(B["bhxh"])} ÷ {n(B["llld"])} = {pc(B["bhxh"], B["llld"])}, không phải trung bình cộng 126 tỷ lệ của phường/xã.'], k.FORM_FILL, 'Ví dụ: ')

# ======================================================= PHẦN II
k.page_break()
heading('PHẦN II. CHI TIẾT 4 CHỈ TIÊU', 1)

def fields_table(rows):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1)] + list(r))
    table(data, [0.8, 5.6, 2.0, 2.1, 5.5], size=10.5)
def kpi_table(rows): table([['Thẻ số', 'Công thức', 'Kết quả (giả lập)']] + rows, [3.6, 8.2, 4.2], size=11, keep=True)
def chart(code, title, kind, axis, value, formula, example, note_=None):
    heading(f'Biểu đồ {code}. {title}', 3)
    rows = [['Loại biểu đồ', kind], ['Trục / nhóm', axis], ['Giá trị hiển thị', value], ['Cách tính', formula], ['Ví dụ (giả lập)', example]]
    if note_: rows.append(['Ghi chú', note_])
    table(rows, [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)
ALL_NOTES = []
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026; nội dung vẫn gom vào Phần IV
def notes(ct, items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], k.NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)
    ALL_NOTES.extend((ct, x) for x in items)
KY = [['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', 'Chọn bản ghi tháng đang xem']
DB = ['Địa bàn', 'Danh mục', 'Nhóm', 'Phường/xã của bản ghi; tách Phường / Xã; bảng 126 phường/xã']
T9 = 8

# ---------------- CHỈ TIÊU 1
heading('Chỉ tiêu 1. Bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp', 2)
heading('1.1. Cách đọc 5 mã chỉ tiêu', 3)
para('Eform dùng **một bộ trường chung** («Tổng số đối tượng», «Số đối tượng đạt», «Tỷ lệ (%)», «Đơn vị tính») cho 5 mã có ý nghĩa khác nhau. IOC tạm hiểu như sau (đề nghị Sở xác nhận):')
table([
    ['Mã', 'Tên mã trong eform', '«Tổng số đối tượng»', '«Số đối tượng đạt»', 'Loại số'],
    ['27', '27 - Tỷ lệ tham gia BHTN', 'Lực lượng lao động trong độ tuổi', 'Số người tham gia bảo hiểm thất nghiệp', 'Thời điểm'],
    ['28', '28 - Tỷ lệ tham gia BHXH', 'Lực lượng lao động trong độ tuổi', 'Số người tham gia BHXH (bắt buộc và tự nguyện)', 'Thời điểm'],
    ['29', '29 - Số người hưởng', 'Số người hưởng lương hưu, trợ cấp BHXH hằng tháng', 'Số người nhận qua tài khoản cá nhân', 'Thời điểm'],
    ['30', '30 - Thu BHXH/BHYT/BHTN', 'Số phải thu trong kỳ (triệu đồng)', 'Số đã thu trong kỳ', 'Trong kỳ'],
    ['31', '31 - Chi BHXH/BHYT/BHTN', 'Số phải chi trong kỳ (triệu đồng)', 'Số đã chi trong kỳ', 'Trong kỳ'],
], [1.0, 4.0, 4.4, 4.6, 2.0], size=10.5)
heading('1.2. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Mã chỉ tiêu QĐ4795', 'Danh mục', 'Nhóm', 'Tách bản ghi theo 5 mã (bảng 1.1)'],
    ['Tổng số đối tượng', 'Số', 'Cộng', 'Mẫu số của tỷ lệ; số phải thu, phải chi'],
    ['Số đối tượng đạt', 'Số', 'Cộng', 'Tử số của tỷ lệ; số người hưởng; số đã thu, đã chi'],
    ['Đơn vị tính', 'Chữ', 'Quy đổi', 'Quy thu, chi về triệu đồng'],
    ['Thôn/TDP', 'Chữ', 'Cộng dồn', 'Nếu nhập theo thôn, cộng các thôn của một Địa bàn'],
    ['Tỷ lệ (%)', 'Số', 'Không dùng', 'IOC tự tính (Phần I, mục 6)'],
    ['Tên chỉ tiêu, Đối tượng/Nội dung, Ghi chú', 'Chữ', 'Không dùng', 'Chỉ để xem chi tiết'],
])
heading('1.3. Thẻ số tổng hợp', 3)
kpi_table([
    ['Tham gia bảo hiểm xã hội', 'TỔNG(«Số đối tượng đạt», mã 28) ÷ TỔNG(«Tổng số đối tượng», mã 28) × 100, tháng 9', pc(B['bhxh'], B['llld']) + ' · ' + n(B['bhxh']) + ' người'],
    ['Tham gia bảo hiểm thất nghiệp', 'Như trên với mã 27', pc(B['bhtn'], B['llld']) + ' · ' + n(B['bhtn']) + ' người'],
    ['Lực lượng lao động trong độ tuổi', 'TỔNG(«Tổng số đối tượng», mã 28), tháng 9', n(B['llld'])],
    ['Người hưởng chế độ hằng tháng', 'TỔNG(«Tổng số đối tượng», mã 29); dòng phụ: TỔNG(«Số đối tượng đạt») ÷ TỔNG(«Tổng số đối tượng»)', n(B['nguoiHuong']) + ' · ' + pc(B['quaTk'], B['nguoiHuong'])],
    ['Đã thu 9 tháng', 'TỔNG(«Số đối tượng đạt», mã 30), tháng 1 – 9; dòng phụ: so với TỔNG(«Tổng số đối tượng»)', ty(B['daThu']) + ' · ' + pc(B['daThu'], B['phaiThu'])],
    ['Đã chi 9 tháng', 'Như trên với mã 31', ty(B['daChi']) + ' · ' + pc(B['daChi'], B['phaiChi'])],
])
heading('1.4. Biểu đồ', 3)
xh = B['xuHuong']
chart('1.1', 'Tỷ lệ tham gia bảo hiểm xã hội, bảo hiểm thất nghiệp theo tháng', 'Biểu đồ đường, 2 đường (%)', 'Trục ngang: «Tháng» 1 → 9; trục dọc 40 – 60%', 'Hai tỷ lệ ở thẻ số',
      'Với mỗi tháng, tính hai tỷ lệ như thẻ số trên bản ghi của tháng đó.', f'BHXH {n(xh[0][0], 1)}% → {n(xh[0][T9], 1)}% · BHTN {n(xh[1][0], 1)}% → {n(xh[1][T9], 1)}%',
      'Ghi chú dưới biểu đồ nhắc chỉ tiêu năm 2025 của Thành phố (BHXH bắt buộc 47,5%, tự nguyện 3,5%, BHTN 45%).')
chart('1.2', 'Thu, chi bảo hiểm theo tháng', 'Biểu đồ cột, mỗi tháng 2 cột (tỷ đồng)', 'Trục ngang: «Tháng» 1 → 9', 'Số đã thu (mã 30), đã chi (mã 31)',
      'TỔNG(«Số đối tượng đạt») của từng mã trong từng tháng, đổi sang tỷ đồng.', f'Tháng 9: thu {ty(B["dtT"][T9])}, chi {ty(B["dcT"][T9])}; tháng 2 (Tết) thu thấp nhất {ty(B["dtT"][1])}')
chart('1.3', 'Phường/xã theo tỷ lệ tham gia bảo hiểm xã hội — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126', '3 nhóm: ' + ' / '.join(g[0] for g in B['nhom']), 'Số phường/xã',
      'Tính tỷ lệ tham gia BHXH tháng 9 của từng phường/xã, xếp vào 3 nhóm.', ' · '.join(f'{g[0]} {g[1]}' for g in B['nhom']))
chart('1.4', '10 phường/xã có tỷ lệ tham gia bảo hiểm xã hội thấp nhất — tháng 9', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ tham gia BHXH',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in B['thap'][:3]), 'Dùng để biết nơi cần ưu tiên vận động tham gia.')
notes('1', ['Eform mang tên "bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp" nhưng danh mục «Mã chỉ tiêu» không có mã cho bảo hiểm y tế (tỷ lệ bao phủ BHYT là chỉ tiêu Thành phố theo dõi, năm 2025 đạt 95,95% dân số). Đề nghị bổ sung mã tỷ lệ tham gia BHYT.',
            'Đề nghị xác nhận cách đọc «Tổng số đối tượng», «Số đối tượng đạt» cho từng mã (bảng 1.1), nhất là mã 29 "Số người hưởng": IOC đang hiểu «đạt» là người nhận qua tài khoản cá nhân.',
            'Mã 28 nên tách BHXH bắt buộc và tự nguyện (chỉ tiêu Thành phố giao riêng 47,5% và 3,5%). IOC hiện cộng chung.',
            '«Đơn vị tính» đang là Chữ tự do, thu, chi có thể nhập đồng, triệu đồng hoặc tỷ đồng. Đề nghị đổi sang Danh mục; IOC quy về triệu đồng.',
            '«Thôn/TDP» là Chữ (mẫu "thôn 2"). Đề nghị xác nhận báo cáo cấp thôn hay cấp xã. Nếu có cả hai, cần trường phân biệt bản ghi tổng hợp của xã để IOC không cộng trùng.',
            'Số liệu tham gia, thu, chi do cơ quan Bảo hiểm xã hội quản lý; phường/xã nhập tay dễ lệch với số của ngành. Đề nghị kết nối dữ liệu từ Bảo hiểm xã hội thay vì nhập eform.',
            '«Tỷ lệ (%)» dữ liệu mẫu nhập 0,5 (tức 50%). IOC không dùng trường này nên không ảnh hưởng, nhưng đề nghị bỏ trường hoặc tự tính trên eform.'])

# ---------------- CHỈ TIÊU 2
k.page_break()
heading('Chỉ tiêu 2. Lao động, việc làm trên địa bàn', 2)
heading('2.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Tổng lực lượng lao động trên địa bàn', 'Số', 'Cộng', 'Thẻ số; mẫu số tỷ lệ lao động qua đào tạo'],
    ['Số lao động đạt trên địa bàn', 'Số', 'Cộng', 'Tử số; IOC tạm hiểu là lao động đã qua đào tạo'],
    ['Lao động Việt Nam đi làm việc ở nước ngoài', 'Số', 'Cộng các tháng', 'Thẻ số 9 tháng; biểu đồ 2.1'],
    ['Lao động nước ngoài làm việc tại địa phương', 'Số', 'Cộng (thời điểm)', 'Thẻ số; biểu đồ 2.2'],
])
heading('2.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Lực lượng lao động', 'TỔNG(«Tổng lực lượng lao động trên địa bàn»), tháng 9', n(L['llld'])],
    ['Lao động qua đào tạo', 'TỔNG(«Số lao động đạt trên địa bàn») ÷ TỔNG(«Tổng lực lượng lao động trên địa bàn») × 100', pc(L['daoTao'], L['llld'])],
    ['Đi làm việc ở nước ngoài', 'TỔNG(«Lao động Việt Nam đi làm việc ở nước ngoài»), tháng 1 – 9', n(L['diNn']) + ' người'],
    ['Lao động nước ngoài đang làm việc', 'TỔNG(«Lao động nước ngoài làm việc tại địa phương»), tháng 9', n(L['nuocNgoai']) + ' người'],
])
heading('2.3. Biểu đồ', 3)
chart('2.1', 'Lao động đi làm việc ở nước ngoài theo hợp đồng, theo tháng', 'Biểu đồ cột (người)', 'Trục ngang: «Tháng» 1 → 9', 'Số người trong tháng',
      'TỔNG(«Lao động Việt Nam đi làm việc ở nước ngoài») theo tháng.', ' · '.join(f'T{i + 1}: {n(v)}' for i, v in enumerate(L['diT'][:3])) + ' …')
chart('2.2', '10 phường/xã có nhiều lao động nước ngoài nhất', 'Biểu đồ cột ngang (người)', 'Trục dọc: 10 «Địa bàn», xếp từ cao xuống', 'Số lao động nước ngoài tháng 9',
      'Xếp giảm dần theo «Lao động nước ngoài làm việc tại địa phương», lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1])}' for r in L['nnTop'][:3]))
chart('2.3', '10 phường/xã có tỷ lệ lao động qua đào tạo thấp nhất', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ lao động qua đào tạo',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in L['dtThap'][:3]))
notes('2', ['«Số lao động đạt trên địa bàn» chưa rõ "đạt" theo tiêu chí gì. IOC tạm hiểu là **lao động đã qua đào tạo** (chỉ tiêu Thành phố theo dõi). Đề nghị Sở xác nhận và đổi tên trường cho rõ.',
            '«Tổng lực lượng lao động trên địa bàn» trùng mẫu số của mã 27, 28 ở eform bảo hiểm. Đề nghị chỉ nhập một nơi; IOC đang dùng chung một số.',
            '«Lao động Việt Nam đi làm việc ở nước ngoài»: đề nghị xác nhận là số xuất cảnh trong kỳ (IOC đang cộng các tháng) hay số đang làm việc ở nước ngoài.',
            '«Lao động nước ngoài làm việc tại địa phương» tính theo nơi làm việc hay nơi cư trú? Số này đã có trong hệ thống cấp giấy phép lao động của Sở; đề nghị lấy từ đó thay vì phường/xã nhập tay.',
            'Số lao động Hà Nội đi làm việc ở nước ngoài và số lao động nước ngoài đang làm việc chưa thấy công bố; số giả lập là giả định theo bậc độ lớn (Phần I, mục 5).'])

# ---------------- CHỈ TIÊU 3
k.page_break()
heading('Chỉ tiêu 3. Biên chế công chức, viên chức cấp xã', 2)
heading('3.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Biên chế được giao', 'Số', 'Cộng (thời điểm)', 'Thẻ số; mẫu số tỷ lệ thực hiện; biểu đồ 3.2, 3.3'],
    ['Biên chế thực hiện', 'Số', 'Cộng (thời điểm)', 'Thẻ số; tử số tỷ lệ thực hiện'],
    ['Biên chế hưởng lương', 'Số', 'Cộng (thời điểm)', 'Thẻ số'],
    ['Số tuyển mới, Số nghỉ hưu, Thôi việc, Chuyển công tác', 'Số', 'Cộng các tháng', 'Thẻ số 9 tháng; biểu đồ 3.1'],
])
heading('3.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Biên chế được giao', 'TỔNG(«Biên chế được giao»), tháng 9', n(C['giao'])],
    ['Biên chế thực hiện', 'TỔNG(«Biên chế thực hiện»); dòng phụ: ÷ TỔNG(«Biên chế được giao») × 100', n(C['thucHien']) + ' · ' + pc(C['thucHien'], C['giao'])],
    ['Biên chế hưởng lương', 'TỔNG(«Biên chế hưởng lương»), tháng 9', n(C['huongLuong'])],
    ['Tuyển mới; Nghỉ hưu; Thôi việc; Chuyển công tác', 'TỔNG từng trường, tháng 1 – 9', f'{n(C["tuyen"])}; {n(C["huu"])}; {n(C["thoiViec"])}; {n(C["chuyen"])}'],
])
heading('3.3. Biểu đồ', 3)
chart('3.1', 'Biến động công chức, viên chức theo tháng', 'Biểu đồ cột, mỗi tháng 2 cột: tuyển mới / cột xếp chồng 3 loại giảm (người)', 'Trục ngang: «Tháng» 1 → 9', 'Tuyển mới; nghỉ hưu, thôi việc, chuyển công tác',
      'TỔNG từng trường theo tháng.', f'Tuyển mới dồn vào tháng 6 – 8 (kỳ thi tuyển): {", ".join(n(v) for v in C["tuyenT"][5:8])} người')
chart('3.2', 'Phường/xã theo tỷ lệ biên chế thực hiện so với được giao — tháng 9', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi 126', '3 nhóm: ' + ' / '.join(g[0] for g in C['nhom']), 'Số phường/xã',
      '«Biên chế thực hiện» ÷ «Biên chế được giao» của từng phường/xã, xếp vào 3 nhóm.', ' · '.join(f'{g[0]} {g[1]}' for g in C['nhom']))
chart('3.3', '10 phường/xã còn thiếu nhiều biên chế nhất so với được giao', 'Biểu đồ cột ngang (người)', 'Trục dọc: 10 «Địa bàn», xếp từ cao xuống', '«Biên chế được giao» − «Biên chế thực hiện»',
      'Tính số còn thiếu của từng phường/xã, xếp giảm dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {r[1]}' for r in C['thieu'][:3]))
notes('3', ['Đề nghị xác nhận phạm vi biên chế trong eform: chỉ công chức của UBND phường/xã, hay gồm cả viên chức đơn vị sự nghiệp thuộc xã (trường mầm non, tiểu học, trung học cơ sở, trạm y tế…). IOC đang hiểu là công chức, viên chức của UBND phường/xã (bậc độ lớn theo 9.536 cán bộ, công chức đã bố trí).',
            '«Biên chế hưởng lương» khác «Biên chế thực hiện» thế nào (người nghỉ không lương, chờ nghỉ hưu, hợp đồng)? IOC đang hiểu hưởng lương ≤ thực hiện.',
            '«Chuyển công tác» chưa tách chuyển đến và chuyển đi. Đề nghị tách 2 trường; IOC đang hiểu là chuyển đi (biến động giảm).',
            '«Biên chế được giao» chỉ đổi khi có quyết định giao biên chế năm; đề nghị nhập theo năm hoặc lấy từ quyết định giao, không nhập lại mỗi tháng.',
            'Eform chỉ có bản ghi theo «Địa bàn», không có sở, ngành; vì vậy chỉ tiêu công chức, viên chức toàn khối chính quyền vẫn dùng số liệu thật năm 2025 (136.343 người), giữ ở cuối danh sách.'])

# ---------------- CHỈ TIÊU 4
k.page_break()
heading('Chỉ tiêu 4. Cán bộ chuyển đổi số và chữ ký số', 2)
heading('4.1. Trường dữ liệu sử dụng', 3)
fields_table([KY, DB,
    ['Đơn vị có công chức, viên chức chuyên trách về CĐS', 'Số', 'Cộng; Điều kiện', 'Tổng số đơn vị; đếm phường/xã có ít nhất 1 đơn vị: thẻ số, biểu đồ 4.2'],
    ['Đơn vị có công chức, viên chức chuyên trách về ANTT mạng', 'Số', 'Cộng; Điều kiện', 'Như trên'],
    ['Tổng công chức, viên chức được bồi dưỡng, tập huấn về kỹ năng số cơ bản', 'Số', 'Cộng', 'Mẫu số tỷ lệ bồi dưỡng kỹ năng số'],
    ['Số công chức, viên chức được bồi dưỡng, tập huấn về kỹ năng số cơ bản đạt', 'Số', 'Cộng', 'Tử số tỷ lệ bồi dưỡng kỹ năng số'],
    ['Tổng CBCCVC được cấp chữ ký số chuyên dùng công vụ', 'Số', 'Cộng', 'Mẫu số tỷ lệ chữ ký số'],
    ['Số CBCCVC được cấp chữ ký số chuyên dùng công vụ đạt', 'Số', 'Cộng', 'Tử số tỷ lệ chữ ký số'],
])
heading('4.2. Thẻ số tổng hợp', 3)
kpi_table([
    ['Được bồi dưỡng kỹ năng số cơ bản', 'TỔNG(«Số … kỹ năng số cơ bản đạt») ÷ TỔNG(«Tổng … kỹ năng số cơ bản») × 100, tháng 9', pc(D['kns'], D['tong']) + f' ({n(D["kns"])}/{n(D["tong"])})'],
    ['Được cấp chữ ký số công vụ', 'TỔNG(«Số CBCCVC được cấp chữ ký số … đạt») ÷ TỔNG(«Tổng CBCCVC được cấp chữ ký số …») × 100', pc(D['cks'], D['tong']) + f' ({n(D["cks"])}/{n(D["tong"])})'],
    ['Có chuyên trách chuyển đổi số', 'ĐẾM(phường/xã có «Đơn vị có … CĐS» ≥ 1); dòng phụ: TỔNG(«Đơn vị có … CĐS»)', f'{D["tieuChi"][0][1]}/{NDV} · {n(D["dvCds"])} đơn vị'],
    ['Có chuyên trách an toàn thông tin mạng', 'Như trên với «Đơn vị có … ANTT mạng»', f'{D["tieuChi"][1][1]}/{NDV} · {n(D["dvAntt"])} đơn vị'],
])
heading('4.3. Biểu đồ', 3)
dx = D['xuHuong']
chart('4.1', 'Tỷ lệ công chức, viên chức được bồi dưỡng kỹ năng số, được cấp chữ ký số theo tháng', 'Biểu đồ đường, 2 đường (%)', 'Trục ngang: «Tháng» 1 → 9; trục dọc 70 – 100%', 'Hai tỷ lệ ở thẻ số',
      'Với mỗi tháng, tính hai tỷ lệ như thẻ số trên bản ghi của tháng đó.', f'Kỹ năng số {n(dx[0][0], 1)}% → {n(dx[0][T9], 1)}% · Chữ ký số {n(dx[1][0], 1)}% → {n(dx[1][T9], 1)}%')
chart('4.2', 'Phường/xã có công chức, viên chức chuyên trách', 'Biểu đồ cột ngang xếp chồng Có / Không', '2 tiêu chí: chuyên trách chuyển đổi số; chuyên trách an toàn thông tin mạng', 'Số phường/xã; mỗi cột = 126',
      'Có = phường/xã có trường «Đơn vị có …» ≥ 1.', ' · '.join(f'{r[0]} {r[1]}/{NDV}' for r in D['tieuChi']))
chart('4.3', '10 phường/xã có tỷ lệ được bồi dưỡng kỹ năng số thấp nhất — tháng 9', 'Biểu đồ cột ngang (%)', 'Trục dọc: 10 «Địa bàn», xếp từ thấp lên', 'Tỷ lệ bồi dưỡng kỹ năng số',
      'Tính tỷ lệ của từng phường/xã, xếp tăng dần, lấy 10 đơn vị đầu.', ' · '.join(f'{r[0]} {n(r[1], 1)}%' for r in D['thap'][:3]))
notes('4', ['Hai trường «Đơn vị có công chức, viên chức chuyên trách…» kiểu Số nhưng không có tổng số đơn vị để so sánh, cũng chưa rõ "đơn vị" là UBND phường/xã, phòng chuyên môn hay đơn vị sự nghiệp. IOC chỉ cộng số đơn vị và đếm phường/xã có ít nhất 1 đơn vị. Đề nghị bổ sung «Tổng số đơn vị» hoặc đổi sang Có/Không.',
            'Cặp trường «Tổng …» / «Số … đạt»: IOC hiểu «Tổng» là tổng số công chức, viên chức thuộc diện (mẫu số), «đạt» là số đã được bồi dưỡng / đã được cấp. Tên «Tổng CBCCVC được cấp chữ ký số» dễ hiểu nhầm thành số đã cấp; đề nghị đổi thành «Tổng số CBCCVC».',
            'Tổng số công chức, viên chức được nhập 3 lần (2 cặp trường ở chỉ tiêu này và «Biên chế thực hiện» ở chỉ tiêu 3). Đề nghị dùng một trường chung.',
            'Nội dung trùng một phần với eform của Sở Khoa học và Công nghệ (cán bộ học an toàn thông tin, văn bản ký số) và Văn phòng UBND Thành phố. Đề nghị thống nhất mỗi chỉ số chỉ nhập ở một nơi.'])

# ======================================================= PHẦN III, IV, PHỤ LỤC
k.page_break()
heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', 1)
para('Ô bên phải của form là bảng đủ **126 phường/xã**. Dòng đầu là số chung toàn Thành phố, tỷ lệ tính bằng cộng tử số và mẫu số của 126 phường/xã (Phần I, mục 6).')
table([
    ['Cột trong bảng', 'Chỉ tiêu', 'Cách tính cho mỗi phường/xã', 'Dòng đầu'],
    ['Tham gia BHXH', '1', 'Người tham gia BHXH ÷ lực lượng lao động × 100, tháng 9', pc(B['bhxh'], B['llld'])],
    ['Tham gia BH thất nghiệp', '1', 'Người tham gia BHTN ÷ lực lượng lao động × 100, tháng 9', pc(B['bhtn'], B['llld'])],
    ['Thu so với phải thu (9 tháng)', '1', 'Đã thu ÷ phải thu × 100, cộng tháng 1 – 9', pc(B['daThu'], B['phaiThu'])],
    ['Lao động qua đào tạo', '2', '«Số lao động đạt» ÷ «Tổng lực lượng lao động» × 100', pc(L['daoTao'], L['llld'])],
    ['Biên chế thực hiện / giao', '3', '«Biên chế thực hiện» / «Biên chế được giao»', f'{n(C["thucHien"])}/{n(C["giao"])}'],
    ['Bồi dưỡng kỹ năng số', '4', 'Số đạt ÷ tổng × 100, tháng 9', pc(D['kns'], D['tong'])],
    ['Có chữ ký số', '4', 'Số đạt ÷ tổng × 100, tháng 9', pc(D['cks'], D['tong'])],
], [4.4, 1.5, 7.3, 2.8], size=10.5)
k.page_break()
heading('PHẦN IV. TỔNG HỢP ĐỀ NGHỊ SỞ XÁC NHẬN', 1)
para('Gom các đề nghị Sở xác nhận của 4 chỉ tiêu. Cột "Kết quả" để trống cho Sở ghi ý kiến.')
table([['#', 'Chỉ tiêu', 'Nội dung', 'Kết quả']] + [[str(i + 1), c, x, ''] for i, (c, x) in enumerate(ALL_NOTES)], [0.8, 1.6, 10.6, 3.0], size=10.5)
k.page_break()
ctm_section(heading, para, lambda rows, w: table(rows, w, size=10), 'ubnd-noivu',
            'PHẦN V. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=['Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
k.page_break()
k.page_break()
heading('PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA 2 EFORM', 1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở Nội vụ". Trường «Địa bàn» của cả 2 eform là danh mục 126 phường/xã.')
for i, e in enumerate(EF):
    heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', 2)
    table([['#', 'Tên trường', 'Mã trường', 'Kiểu nhập']] + [[str(j + 1), f[0], f[1], f[2] or '(chưa ghi)'] for j, f in enumerate(e['fields'])],
          [0.8, 6.6, 6.4, 2.2], size=10, mono_col=2)
print('đề nghị:', len(ALL_NOTES))
for p in k.save(OUT): print('ok', p)
