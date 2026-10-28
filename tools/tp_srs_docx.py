# -*- coding: utf-8 -*-
"""Sinh docs/CHUNG/TRUC_SRS_CHI_TIEU_4_TRUC_THEO_EFORM_2026_10_28.docx + .md — Đặc tả yêu cầu phần mềm (SRS) phân hệ chỉ tiêu
4 trục cấp Thành phố (Đảng ủy, HĐND, UBND, MTTQ) theo eform, bản 1.0 ngày 28/10/2026.
Chạy từ thư mục gốc ioc:  python3 tools/tp_srs_docx.py      (cần python-docx; Node lấy từ biến NODE hoặc PATH)
Đơn vị, eform, chỉ tiêu, cách tính, biểu đồ, kiểm tra, vai trò từng trường và số mẫu đọc thẳng từ code qua tools/tp_srs_dump.js
nên luôn khớp giao diện; phần yêu cầu chức năng, phi chức năng viết tay theo hành vi của ctm-engine.js, ctm-eform.js,
ctm-truc-eform.js, eform-mau.js, central-level.js. Lỗi file eform và các câu đã chốt lấy từ bản đọc eform (docs/BAN_DOC_EFORM/TRUC_*).
Sau khi sinh, cập nhật Mục lục bằng Word: tools/vhtt_doc_finalize.ps1 -Docx <đường dẫn .docx>."""
import glob, json, os, re, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'CHUNG', 'TRUC_SRS_CHI_TIEU_4_TRUC_THEO_EFORM_2026_10_28.docx')
NODE = os.environ.get('NODE') or shutil.which('node')
if not NODE:
    raise SystemExit('Không tìm thấy Node: đặt biến NODE=<đường dẫn node> (hoặc Electron, tool tự bật ELECTRON_RUN_AS_NODE).')
D = json.loads(subprocess.run([NODE, 'tools/tp_srs_dump.js'], cwd=ROOT, capture_output=True, check=True,
                              env=dict(os.environ, ELECTRON_RUN_AS_NODE='1')).stdout.decode('utf-8'))
VER, NGAY = '1.1', '29/10/2026'
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k'
TESTS = {'ctm.test.js': 6741, 'ctm-quy-tac.test.js': 1707, 'xa-eform.test.js': 797, 'tp-eform.test.js': 1431}
ROLES = ['DANG', 'HDND', 'UBND', 'MTTQ']
ROLE = {'DANG': 'Đảng ủy', 'HDND': 'HĐND', 'UBND': 'UBND', 'MTTQ': 'Ủy ban MTTQ'}
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
DOC = {'DANG': 'TRUC_DANG_UY', 'HDND': 'TRUC_HDND', 'UBND': 'TRUC_UBND_VPUB', 'MTTQ': 'TRUC_MTTQ'}


def efno(e):
    m = re.match(r'[a-z]+(\d+)', e)
    return int(m.group(1)) if m else 0


# SRS này chỉ gồm 4 trục (Thành ủy, HĐND, MTTQ) và Văn phòng UBND (trục UBND); các sở có tài liệu riêng (tools/so_mo_ta_docx.py)
D['units'] = [u for u in D['units'] if u['role'] != 'UBND' or u['id'] == 'ubnd-vpubnd']
U = sorted(D['units'], key=lambda u: (ROLES.index(u['role']), min(efno(e['ef']) + (100 if e['ef'].startswith('ubnd') else 0) for e in u['eforms'])))
EFS = [(u, e) for u in U for e in u['eforms']]
N_EF, N_FIELD = len(EFS), sum(len(e['fields']) for _, e in EFS)
N_CHI = sum(len(e['chi']) for _, e in EFS)
N_BIEU = sum(len(e['bieu']) for _, e in EFS)
OV = {o['id']: o for o in D['overviews']}
PL = D['plabel']


def dm_text(f):
    if not f['dm']:
        return '—'
    if f['t'] != 'dm':
        return f'— (file kèm {len(f["dm"])} giá trị; trường {KIEU.get(f["t"], "để trống kiểu")} nên hiện đúng chữ đã nhập)'
    ls = f['dm']
    return f'{len(ls)} mã: ' + ', '.join(ls[:4]) + (f', … (+{len(ls) - 4})' if len(ls) > 4 else '')


# ---------- đơn vị cũ ẩn bằng cờ (đọc từ js/core/central-level.js) ----------
CL = open(os.path.join(ROOT, 'js', 'core', 'central-level.js'), encoding='utf-8').read()


def seed_units(role):
    """Đơn vị khai báo trong categorySeed[role] (từ khóa role đến khóa role kế tiếp hoặc hết khối)"""
    s = CL.index('const categorySeed = {')
    keys = [(m.group(1), s + m.start()) for m in re.finditer(r'\n ?([A-Z_]+):\[', CL[s:CL.index('\n };', s)])]
    i = [x[0] for x in keys].index(role)
    a, b = keys[i][1], keys[i + 1][1] if i + 1 < len(keys) else CL.index('\n };', s)
    return re.findall(r"\{id:'([a-z0-9-]+)',name:'([^']+)'", CL[a:b])


AN = [('Đảng ủy', n, i) for i, n in seed_units('DANG') if i == 'dang-vptu'] + \
     [('HĐND', n, i) for i, n in seed_units('HDND')] + [('Ủy ban MTTQ', n, i) for i, n in seed_units('MTTQ')]


# ---------- lỗi file eform và câu đã chốt (từ bản đọc eform) ----------
def ban_doc(role):
    p = sorted(glob.glob(os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', DOC[role] + '_*.md')))
    return open(p[-1], encoding='utf-8').read() if p else ''


LOI, CHOT = [], {}
for r in ROLES:
    t = ban_doc(r)
    for sec in re.split(r'\n## ', t)[1:]:
        title = sec.split('\n', 1)[0]
        if re.match(r'\d+\. ', title) and '**Lỗi, chỗ nghi trong file eform:**' in sec:
            part = sec.split('**Lỗi, chỗ nghi trong file eform:**', 1)[1]
            for ln in part.strip().split('\n'):
                if not ln.startswith('- '):
                    break
                LOI.append((ROLE[r], title.split('. ', 1)[1].strip(), ln[2:].strip()))
        elif re.match(r'(CÁC CÂU|CÂU HỎI)', title):
            body = [ln.strip() for ln in sec.split('\n', 1)[1].split('\n') if ln.strip()]
            CHOT.setdefault(r, []).extend(re.sub(r'^\d+\.\s*', '', ln) for ln in body if not ln.startswith('|'))

k = Kit('Đặc tả yêu cầu phần mềm · Chỉ tiêu 4 trục cấp Thành phố theo eform · IOC Hà Nội')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets

# ======================================================= TRANG BÌA
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Đặc tả yêu cầu phần mềm (SRS) — Phân hệ chỉ tiêu 4 trục cấp Thành phố theo eform')
para('Phân hệ chỉ tiêu 4 trục cấp Thành phố', 16, CENTER, 4, bold=True, color=NAVY)
para(f'{N_EF} eform của Thành ủy, HĐND, UBND (Văn phòng UBND) và Ủy ban MTTQ Thành phố', 13, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([
    ['Phạm vi', f'Màn hình chỉ tiêu 4 trục cấp Thành phố: {len(U)} đơn vị trên IOC, {N_EF} eform, {N_FIELD} trường, {N_CHI} chỉ tiêu, {N_BIEU} biểu đồ; màn ngoài các trục; tài khoản trục, Ban, sở'],
    ['Căn cứ', 'Sheet "Trục Đảng Uỷ", "Trục HĐND", "Trục MTTQ", "Trục UBND", "Văn phòng UBND Thành phố Hà Nội" của "File mô tả đầu vào eform"; bản đọc eform đã chốt (docs/BAN_DOC_EFORM/TRUC_*); quy ước chỉ tiêu theo eform bản 2.0; mã nguồn IOC đang chạy (28/10/2026)'],
    ['Phiên bản', VER],
    ['Ngày lập', NGAY],
], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break()
k.toc()
k.page_break()

# ======================================================= 1. GIỚI THIỆU
heading('1. GIỚI THIỆU', 1)
heading('1.1. Mục đích', 2)
para('Tài liệu đặc tả yêu cầu đối với phân hệ chỉ tiêu của 4 trục cấp Thành phố trên Hệ thống điều hành IOC Hà Nội sau khi làm lại theo đúng eform: '
     'đơn vị nào hiện trên IOC, người dùng nào được xem gì, các màn hình và thao tác, khung từng eform, cách tính từng chỉ tiêu từ trường của eform, '
     'quy tắc kỳ, so sánh, hiển thị, yêu cầu phi chức năng và tiêu chí nghiệm thu.')
para('Người đọc: nhóm phân tích nghiệp vụ, nhóm phát triển, nhóm kiểm thử, nhóm làm eform, cán bộ Văn phòng Thành ủy, Văn phòng Đoàn ĐBQH và HĐND, '
     'Văn phòng UBND, cơ quan Ủy ban MTTQ Thành phố tham gia nghiệm thu.')
box(['Từ ngày 28/10/2026, chỉ tiêu của 4 trục **chỉ dựng từ trường có trong eform** (quy ước bản 2.0): đơn vị không có eform được ẩn bằng cờ, không xóa; '
     'không lấy số từ văn bản, số công bố, bộ chỉ tiêu cũ; số đã nhập hiện đúng như nhập, số IOC tự tính ghi rõ "IOC tính" và công thức; '
     'mọi số lần lại được bản ghi; mọi trường của eform xem được ở màn "Dữ liệu đã nhập".'], k.NOTE_FILL, 'Thay đổi chính: ')
heading('1.2. Phạm vi', 2)
para('**Trong phạm vi:**')
bullets([
    f'{len(U)} đơn vị trên IOC dựng từ {N_EF} eform của 4 trục (Bảng 2.1) và việc ẩn {len(AN)} đơn vị cũ không có eform.',
    'Màn ngoài theo eform: tab "Tất cả" (4 trục) và tab Thành ủy, HĐND, Ủy ban MTTQ.',
    'Cửa sổ chi tiết (popup) của từng đơn vị: Tổng quan, màn từng eform, "Theo 126 xã, phường", "Dữ liệu đã nhập", chọn kỳ Tháng / Quý / Năm, so sánh, xuất Excel.',
    'Tài khoản các Ban HĐND: lọc sẵn eform «Hoạt động Thường trực, Ban và Tổ đại biểu» theo Ban (FR-12).',
    'Khung eform cấp Thành phố sinh từ file và công cụ đối chiếu; bản ghi mẫu dựng theo khung eform khi chưa có dữ liệu thật.',
])
para('**Ngoài phạm vi:**')
bullets([
    'Hệ thống nhập eform (IOC chỉ đọc bản ghi); kết nối API dữ liệu 4 trục (chưa cung cấp — mục 9).',
    'Chỉ tiêu cấp xã, phường (tài liệu riêng: docs/XA_XaPhuong/XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28).',
    'Các sở, ngành khác của UBND: đã làm theo eform (28–29/10/2026), mỗi đơn vị có tài liệu mô tả chỉ tiêu riêng (docs/<ĐƠN VỊ>/*_MO_TA_CHI_TIEU, tools/so_mo_ta_docx.py).',
    'Cấp Trung ương; bản đồ GIS; giao việc, theo dõi nhiệm vụ chung của hệ thống; quản trị đơn vị, người dùng.',
])
heading('1.3. Thuật ngữ', 2)
table([
    ['Thuật ngữ', 'Giải thích'],
    ['Trục', 'Một trong bốn khối của hệ thống chính trị cấp Thành phố: Thành ủy (Đảng ủy), HĐND, UBND, Ủy ban MTTQ'],
    ['Eform', 'Biểu mẫu nhập liệu mô tả ở "File mô tả đầu vào eform" (tên trường, mã, kiểu nhập, danh mục)'],
    ['Đơn vị trên IOC', 'Thẻ trong "Nhóm chỉ tiêu theo lĩnh vực": một Ban (Đảng ủy), một eform (HĐND, MTTQ) hoặc Văn phòng UBND (9 eform)'],
    ['Trường', 'Một ô của eform: Danh mục, Số, Chữ hoặc Ngày tháng. Kiểu trường giữ y hệt eform: trường Chữ có kèm danh sách vẫn là Chữ'],
    ['Bản ghi', 'Một lần nhập eform: mỗi trường một giá trị. Mỗi eform ghi rõ "một bản ghi là gì" (mục 5)'],
    ['Khóa bản ghi', 'Các trường nhận ra một bản ghi (cùng kỳ): hai bản cùng khóa thì lấy bản gửi sau (BR-03)'],
    ['Chỉ tiêu', 'Một số tính từ trường của eform theo cách tính ghi ở mục 5 (đếm, cộng, lấy một lần, tại thời điểm, IOC tính…)'],
    ['Số đã nhập / số IOC tính', 'Số đã nhập: giá trị của một trường Số. Số IOC tính: tỷ lệ, hiệu IOC tính thêm từ trường eform, tên luôn có "(IOC tính)"'],
    ['Bảng nhiều cấp', 'Bảng chia bản ghi theo các trường chia cấp của eform (cấp 1 trước), mỗi dòng ghi các chỉ tiêu và số bản ghi'],
    ['Dữ liệu đã nhập', 'Màn hiện mọi bản ghi của eform, đủ mọi trường, đúng thứ tự, tên cột đúng như eform'],
    ['Bản ghi cần xem lại', 'Bản ghi có ô sai kiểu, mã ngoài danh mục, thiếu trường khóa, thiếu kỳ, hoặc vi phạm kiểm tra riêng của eform (BR-05)'],
    ['Bản ghi mẫu', 'Bản ghi dựng theo khung eform khi chưa có dữ liệu thật (mục 4.6)'],
    ['Kỳ xem', 'Tháng, Quý hoặc Năm, người xem chọn (FR-09). Dữ liệu mẫu từ tháng 1/2025 đến tháng 9/2026'],
], [3.8, 12.2], size=11)
heading('1.4. Tài liệu liên quan', 2)
table([
    ['Tài liệu', 'Nội dung dùng ở đây'],
    ['File mô tả đầu vào eform (' + SHEET_URL + ')', 'Nguồn duy nhất của eform: tên trường, mã, kiểu nhập, danh mục'],
    ['docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28 (bản 2.0)', 'Quy ước bắt buộc: eform là nguồn duy nhất, hiện đủ trường, số đã nhập là số hiển thị, lần lại bản ghi, chia cấp, ẩn bằng cờ, kỳ Tháng/Quý/Năm, quyền xem theo cấp'],
    ['docs/BAN_DOC_EFORM/TRUC_DANG_UY, TRUC_HDND, TRUC_MTTQ, TRUC_UBND_VPUB (28/10/2026)', 'Bản đọc từng eform đã chốt: một bản ghi là gì, khóa, chia cấp, vai trò trường, lỗi file eform, câu đã chốt (Phụ lục B, C)'],
    ['docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12', 'Quy tắc hiển thị: định dạng số, mốc so sánh, không hiện mã kỹ thuật'],
    ['docs/XA_XaPhuong/XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28', 'SRS cấp xã, phường theo eform — cùng khung chỉ tiêu dùng chung'],
], [7.0, 9.0], size=10.5)
heading('1.5. Quy ước mã yêu cầu', 2)
bullets(['**FR-nn**: yêu cầu chức năng (mục 3).', '**DR-nn**: yêu cầu dữ liệu (mục 4).', '**BR-nn**: quy tắc nghiệp vụ (mục 4).',
         '**NFR-nn**: yêu cầu phi chức năng (mục 6).', '**TC-nn**: kịch bản nghiệm thu (mục 8).',
         'Mức ưu tiên: **Bắt buộc** (phải có để nghiệm thu), **Nên có**, **Tùy chọn**. Yêu cầu không ghi mức là Bắt buộc.'])

# ======================================================= 2. MÔ TẢ TỔNG QUAN
heading('2. MÔ TẢ TỔNG QUAN', 1)
heading('2.1. Bối cảnh', 2)
para('Trước 28/10/2026, chỉ tiêu 4 trục cấp Thành phố được dựng theo phòng, ban với số giả lập và bộ chỉ tiêu tự đặt, không bám eform; người nhập eform không '
     'đối chiếu được số trên IOC với số mình đã nhập. Quy ước bản 2.0 yêu cầu làm lại theo eform: chỉ đơn vị có eform mới có chỉ tiêu, mọi chỉ tiêu dựng từ '
     'trường của eform, mọi số lần lại được bản ghi. Mỗi trục được đọc eform, lập bản đọc, chốt các câu hỏi trước khi dựng màn hình.')
note('Bảng 2.1. Đơn vị trên IOC và eform của 4 trục')
rows = [['Trục', 'Đơn vị trên IOC', 'Eform', 'Trường', 'Chỉ tiêu', 'Biểu đồ']]
for u in U:
    rows.append([ROLE[u['role']], u['name'], [e['efTen'] for e in u['eforms']], str(sum(len(e['fields']) for e in u['eforms'])),
                 str(sum(len(e['chi']) for e in u['eforms'])), str(sum(len(e['bieu']) for e in u['eforms']))])
rows.append(['**Cộng**', f'**{len(U)} đơn vị**', f'**{N_EF} eform**', f'**{N_FIELD}**', f'**{N_CHI}**', f'**{N_BIEU}**'])
table(rows, [1.9, 3.6, 6.7, 1.3, 1.3, 1.2], size=9.5)
para('Chia cấp trên IOC theo quy ước: **Trục → Đơn vị (Ban) → Eform → Nhóm (danh mục của eform) → Dòng số liệu → Bản ghi**. '
     'Trục Đảng ủy có cấp Ban (4 Ban giữ mã đơn vị cũ); trục HĐND, MTTQ hiện thẳng eform (không qua cấp Ban); trục UBND đợt này có Văn phòng UBND '
     '(5 eform sheet "Văn phòng UBND" và 4 eform chỉ có ở sheet "Trục UBND").')
heading('2.2. Chức năng chính', 2)
bullets([
    'Xem số then chốt của 4 trục ở màn ngoài; bấm ô mở đúng eform.',
    'Xem từng đơn vị: ô số, thẻ eform so với kỳ trước, biểu đồ qua các kỳ, cơ cấu, tỷ lệ IOC tính, biểu đồ theo trường của eform, bảng nhiều cấp.',
    'Xem theo 126 xã, phường với eform có trường xã, phường: bảng sắp từ lớn đến nhỏ, hồ sơ từng xã.',
    '**Dữ liệu đã nhập**: mọi bản ghi, đủ mọi trường, đúng tên trường như eform; bản ghi cần xem lại tô màu kèm lý do; bản ghi không dùng ghi lý do.',
    '**Lần lại**: bấm tên dòng ở bảng, thanh ở biểu đồ, ô số → các bản ghi tạo ra số đó.',
    'Chọn kỳ xem Tháng / Quý / Năm; xuất Excel; tài khoản Ban HĐND được lọc sẵn theo Ban ở eform hoạt động Thường trực, Ban, Tổ.',
])
heading('2.3. Người dùng và quyền xem', 2)
para('Quyền xem theo cấp: cấp trên xem được cấp dưới. Đơn vị cũ bị ẩn nhưng tài khoản của đơn vị đó vẫn đăng nhập được.')
table([
    ['Người dùng', 'Được xem', 'Ghi chú'],
    ['Tài khoản Thành ủy', ['Tab "Tất cả" (4 trục) và các tab trục', 'Mọi đơn vị của 4 trục'], 'Mở mặc định tab "Tất cả"'],
    ['Tài khoản trục HĐND, Ủy ban MTTQ', ['Tab của trục mình: 6 eform', 'Popup, Dữ liệu đã nhập của từng eform'], ''],
    ['Tài khoản 4 Ban Thành ủy (UBKT, Tổ chức, Tuyên giáo và Dân vận, Nội chính)', 'Đơn vị của Ban mình với các eform của Ban', 'Văn phòng Thành ủy · Theo dõi nhiệm vụ đã ẩn'],
    ['Tài khoản các Ban HĐND, Văn phòng Đoàn ĐBQH - HĐND, Đoàn ĐBQH, Tổ tư vấn', ['Cả 6 eform của trục HĐND (đơn vị cũ đã ẩn)', 'Riêng 4 Ban HĐND: eform hoạt động Thường trực, Ban, Tổ lọc sẵn theo Ban (FR-12)'], 'Bỏ lọc được'],
    ['Tài khoản các Ban, đoàn thể MTTQ', 'Cả 6 eform của trục MTTQ (đơn vị cũ đã ẩn)', 'Câu chốt 5, bản đọc MTTQ'],
    ['Tài khoản Văn phòng UBND Thành phố', '9 eform của Văn phòng UBND', 'Các sở khác: tài liệu riêng của từng sở'],
], [5.0, 7.0, 4.0], size=10)
heading('2.4. Ràng buộc thiết kế', 2)
bullets([
    '**Eform là nguồn duy nhất** (BR-01): không thêm chỉ tiêu, trường ngoài eform; không lấy số từ văn bản, số công bố, bộ chỉ tiêu cũ, mục tiêu Thành phố giao, dân số, diện tích.',
    '**Số đã nhập là số hiển thị**: trường tỷ lệ, trường tổng của đơn vị hiện đúng số đã nhập; IOC chỉ tính thêm và ghi "(IOC tính)"; lệch thì đánh dấu bản ghi (BR-08).',
    '**Kiểu trường y hệt eform**: trường Chữ có kèm danh sách vẫn là Chữ, hiện đúng chữ đã nhập.',
    '**Khung eform sinh từ file, không sửa tay** (js/core/eform-khung.js, tools/xa_eform_schema.py --tp); chạy --check trước khi phát hành (FR-14).',
    '**Ẩn bằng cờ, không xóa** đơn vị không có eform (TRUC_AN_DON_VI_CU, mục 7; Phụ lục A).',
    'Giữ bố cục nhiều cấp của khuôn chỉ tiêu: Tổng quan → thẻ eform → màn eform (thẻ so sánh, biểu đồ qua các kỳ, cơ cấu, tỷ lệ, top 10 xã) → Theo 126 xã, phường → Dữ liệu đã nhập.',
    'Dùng chung khung chỉ tiêu với cấp xã và các sở: mỗi eform chỉ khai báo khóa, chia cấp, chỉ tiêu, biểu đồ, kiểm tra (js/features/ctm-truc-eform.js); phần dựng màn hình là chung (js/features/ctm-eform.js).',
    'Không hiện mã kỹ thuật, trừ ô có mã ngoài danh mục (hiện nguyên mã đã nhập để người nhập thấy lỗi).',
])
heading('2.5. Giả định và phụ thuộc', 2)
bullets([
    '**Chưa có dữ liệu thật**: sheet "API cần IOC cung cấp" ghi "Chưa cung cấp". Màn hình chạy bằng bản ghi mẫu dựng đúng khung eform (mục 4.6) và ghi rõ "bản ghi mẫu".',
    'Khi có API, chỉ thay nguồn bản ghi (DR-02) và đặt EF_LA_MAU = false; màn hình không đổi.',
    'Danh mục 126 xã, phường dùng chung với cấp xã và đăng nhập.',
    'Xuất Excel cần thư viện ExcelJS đã tải trên trang.',
    'Môi trường trình diễn: phân quyền, lọc theo tài khoản làm ở trình duyệt. Khi vận hành thật, máy chủ phải lọc bản ghi theo tài khoản (NFR-03).',
])

# ======================================================= 3. YÊU CẦU CHỨC NĂNG
heading('3. YÊU CẦU CHỨC NĂNG', 1)
para('Mỗi yêu cầu ghi mục đích, cách kích hoạt, xử lý, kết quả và tiêu chí chấp nhận.')


def fr(code, title, rows, ac, prio='Bắt buộc'):
    heading(f'{code}. {title}', 2)
    table([['Mức ưu tiên', prio]] + rows, [3.2, 12.8], header=False, key_col=True, size=10.5)
    para('**Tiêu chí chấp nhận:**', after=2)
    bullets(ac, 11.5)


fr('FR-01', 'Đơn vị của 4 trục trên IOC', [
    ['Mục đích', 'Chỉ đơn vị có eform mới có chỉ tiêu; đơn vị cũ không mất.'],
    ['Xử lý', [f'Thành ủy: 4 Ban giữ mã đơn vị cũ, chỉ tiêu cũ thay bằng eform (giữ lại ở "itemsCu"); ẩn "Văn phòng Thành ủy · Theo dõi nhiệm vụ".',
               'HĐND, Ủy ban MTTQ: mỗi eform một đơn vị mới (không phải phòng, ban — không vào cây tổ chức); mọi đơn vị cũ của 2 trục ẩn.',
               'UBND: Văn phòng UBND Thành phố gồm 9 eform; các sở khác giữ nguyên đến đợt làm theo eform.',
               'Ẩn bằng cờ TRUC_AN_DON_VI_CU (js/core/central-level.js): đơn vị ẩn không hiện ở lưới, thẻ; tài khoản vẫn đăng nhập được. Đặt cờ = false là về như cũ.']],
    ['Kết quả', f'{len(U)} đơn vị theo Bảng 2.1; {len(AN)} đơn vị cũ ẩn (Phụ lục A).'],
], ['Tab HĐND có đúng 6 thẻ eform, tab Ủy ban MTTQ 6 thẻ, Thành ủy 4 thẻ Ban; không còn thẻ đơn vị cũ.',
    'Mỗi eform của 4 trục nằm ở đúng một đơn vị (kiểm tự động).', 'Đặt TRUC_AN_DON_VI_CU = false: đơn vị cũ hiện lại.'])

ova = OV['tu-all-ef']
fr('FR-02', 'Màn ngoài — tab "Tất cả" (4 trục)', [
    ['Mục đích', 'Cho lãnh đạo thấy nhanh số then chốt của 4 trục.'],
    ['Kích hoạt', 'Tài khoản Thành ủy mở trang chính (mặc định) hoặc bấm tab "Tất cả".'],
    ['Xử lý', ['Dải đầu "Tổng quan · 4 trục cấp Thành phố"; tiêu đề "Số liệu then chốt của N ban, sở, đơn vị, eform".',
               f'{len(ova["kpis"])} ô số (Bảng 3.1): mỗi ô ghi đơn vị cung cấp và kỳ; bấm ô mở màn eform của đơn vị.',
               '4 thẻ trục; bấm một trục để lọc danh sách đơn vị bên dưới.', 'Màn ngoài cũ (dang-tp, hdnd-tp, mttq-tp, tu-all) tắt bằng cờ enabled = false, không xóa.']],
], ['Mọi ô số trỏ đúng chỉ tiêu eform (kiểm tự động), có số ở kỳ mặc định.', 'Bấm thẻ trục HĐND: chỉ còn đơn vị HĐND; bấm lại: bỏ lọc.'])
note('Bảng 3.1. Ô số của tab "Tất cả"')
table([['#', 'Ô số', 'Đơn vị cung cấp', 'Nguồn']] + [[str(i + 1), x['l'], x['unit'] if x['unit'] != 'ubnd-taichinh' else 'Sở Tài chính',
       'Eform' if x['eform'] else 'Nguồn hiện hành của sở (chưa làm theo eform)'] for i, x in enumerate(ova['kpis'])], [0.8, 6.0, 5.4, 3.8], size=10)

fr('FR-03', 'Màn ngoài — tab Thành ủy, HĐND, Ủy ban MTTQ', [
    ['Kích hoạt', 'Bấm tab trục, hoặc đăng nhập tài khoản trục.'],
    ['Xử lý', ['Dải đầu "Tổng quan · <trục> · số liệu theo eform"; 8 ô số then chốt của trục (Bảng 3.2); lưới thẻ đơn vị của trục.',
               'Mỗi ô ghi đơn vị và kỳ; bấm ô mở màn eform chứa chỉ tiêu đó.', 'Tab UBND giữ màn ngoài các sở hiện hành.']],
], ['Mỗi tab có đúng các ô số theo Bảng 3.2; số ô bằng số cùng chỉ tiêu, cùng kỳ ở popup (BR-10).'])
note('Bảng 3.2. Ô số của tab từng trục')
table([['Tab', 'Ô số (đơn vị · chỉ tiêu)']] + [[{'dang-tp-ef': 'Thành ủy', 'hdnd-tp-ef': 'HĐND', 'mttq-tp-ef': 'Ủy ban MTTQ'}[o],
       [f'{x["unit"]} · {x["l"]}' for x in OV[o]['kpis']]] for o in ['dang-tp-ef', 'hdnd-tp-ef', 'mttq-tp-ef']], [2.6, 13.4], size=10)

fr('FR-04', 'Popup chi tiết — Tổng quan đơn vị', [
    ['Kích hoạt', 'Bấm thẻ đơn vị ở lưới, hoặc ô số ở màn ngoài.'],
    ['Xử lý', ['Tiêu đề: tên đơn vị; dòng phụ: cơ quan · số chỉ tiêu chính · số nhóm · kỳ.',
               'Thanh công cụ: "Xem theo" (Tháng / Quý / Năm), "Kỳ báo cáo", "Nhập chỉ tiêu", "Xuất Excel".',
               'Hàng ô số của đơn vị (mục 5, cột "Hiện ở" = Ô số): tên, số, đơn vị · tên eform, so kỳ trước.',
               'Thẻ "Dữ liệu đã nhập" (bản ghi của kỳ, tổng số trường các eform, "hiện đủ"); mỗi eform một thẻ với 4 chỉ tiêu (cột "Thẻ"), so kỳ trước; thẻ "Theo 126 xã, phường" khi có.',
               'Khung "Cách đọc": số lấy từ eform nào; số đã nhập hiện đúng như nhập; số IOC tính ghi công thức; bấm để lần lại bản ghi.',
               'Đơn vị là chính một eform (HĐND, MTTQ): thẻ eform gọi "Bảng và biểu đồ" để tiêu đề không lặp tên eform.']],
], ['Ô số, thẻ của mỗi đơn vị đúng như mục 5.', 'Không hiện mã kỹ thuật.', 'Bản ghi mẫu: có câu "Đang là bản ghi mẫu…" ở Dữ liệu đã nhập.'])

fr('FR-05', 'Popup chi tiết — màn eform', [
    ['Kích hoạt', 'Bấm thẻ eform, ô số, hoặc "Xem nhóm ›".'],
    ['Xử lý', ['Dòng đầu: "Eform «<tên>» · một bản ghi là … · N bản ghi dùng cho <kỳ>".',
               'Hàng 1 (khuôn chung): thẻ so sánh kỳ này – kỳ trước của 4 chỉ tiêu thẻ; biểu đồ "qua các kỳ" (tối đa 12 tháng / 6 quý / 2 năm, cột đậm là kỳ đang xem); thẻ cơ cấu, thẻ tỷ lệ IOC tính khi eform có; top 10 xã, phường khi eform có trường xã.',
               'Các biểu đồ theo trường của eform (mục 5, "Biểu đồ"), hai biểu đồ một hàng; bấm thanh → bản ghi.',
               'Bảng nhiều cấp theo trường chia cấp; mặc định 12 dòng, nút "Xem đủ N dòng ›" / "Thu gọn"; dòng "Cộng"; rê chuột tên cột xem cách tính.',
               'Bảng phụ (mục 5, "Bảng phụ") và bảng theo địa bàn khi có.',
               '**Kỳ chưa có bản ghi**: chỉ hiện "Kỳ này chưa có bản ghi", nêu kỳ gần nhất có bản ghi (số bản ghi) và nút "Xem <kỳ> ›"; không vẽ thẻ rỗng.',
               'Eform không có trường «Năm»: không vẽ thẻ so sánh, diễn biến; ghi lý do (BR-02).']],
], ['Màn «Biến động Đảng viên» Quý 3/2026: có thẻ so sánh, top xã, bảng có "Xem đủ".',
    'Màn «Đánh giá cán bộ» Quý 2/2025 (chưa có bản ghi): báo trống, nút sang Năm 2025; bấm nút đổi kỳ xem sang Năm 2025.'])

fr('FR-06', 'Theo 126 xã, phường', [
    ['Mục đích', 'Xem số của eform theo từng xã, phường khi eform có trường xã, phường.'],
    ['Xử lý', ['Chỉ eform có trường xã, phường (mục 5, "Theo 126 xã, phường"); giá trị trường phải là tên xã, phường trong danh mục 126.',
               'Bảng 126 xã, phường: chọn chỉ tiêu; số tuyệt đối sắp từ lớn đến nhỏ, không xếp hạng tốt/kém; tỷ lệ IOC tính gộp lên Thành phố bằng tổng tử ÷ tổng mẫu.',
               'Hồ sơ từng xã: các chỉ tiêu và liên kết "Xem N bản ghi «…» của <xã> ›".',
               'Bản ghi ghi xã, phường không khớp danh sách: không vào bảng, ghi số lượng ở ghi chú.',
               'Không dùng dân số, diện tích.']],
], ['Đơn vị Ban Tổ chức, UBKT, Nội chính, Tuyên giáo và Dân vận, VP UBND, 4 eform MTTQ có màn này; HĐND không có (eform không có trường xã, phường).'])

fr('FR-07', 'Dữ liệu đã nhập', [
    ['Mục đích', 'Người nhập eform đối chiếu được từng ô đã nhập với số trên IOC.'],
    ['Kích hoạt', 'Thẻ "Dữ liệu đã nhập"; bấm tên dòng, thanh biểu đồ, ô số.'],
    ['Xử lý', ['Đơn vị nhiều eform: nút chọn eform.',
               'Khung ghi chú: "Toàn bộ bản ghi đã nhập vào eform «…», <kỳ>: N bản ghi, đủ M trường…; một bản ghi là …"; câu "Đang là bản ghi mẫu…" khi chưa có dữ liệu thật; số bản ghi thiếu năm, kỳ.',
               '4 ô đếm: bản ghi của kỳ, trường của eform, bản ghi cần xem lại, bản ghi mọi kỳ.',
               'Nút lọc theo nhóm cấp 1 (khi ≤ 12 nhóm), "Cần xem lại"; ô tìm chữ trong bất kỳ ô nào, không phân biệt dấu.',
               '**Bảng: STT rồi đủ mọi trường của eform đúng thứ tự, tên cột đúng như eform**; rê chuột tên cột xem kiểu. Ô Danh mục hiện tên hiển thị; ô trống "—". Hiện 500 bản ghi đầu, còn lại xem bằng lọc hoặc Xuất Excel.',
               'Ô cần xem lại tô màu, rê chuột xem lý do (BR-05). Bản ghi không dùng ở phần tổng hợp ghi lý do ở cột STT: trùng khóa với bản gửi sau (BR-03), hoặc cùng khóa đã có bản tháng (BR-04).']],
], ['Mỗi eform: số cột = số trường + 1, tên và thứ tự cột trùng khung eform (kiểm tự động).',
    'Bản ghi lệch kiểm tra riêng của eform (VD «Tổng số cán bộ được đánh giá» khác cộng 5 mức) được tô màu, lọc "Cần xem lại" ra đúng bản ghi.'])

fr('FR-08', 'Lần lại từ số đến bản ghi', [
    ['Xử lý', ['Bấm tên dòng ở bảng nhiều cấp: mở Dữ liệu đã nhập chỉ với các bản ghi đã dùng tạo ra dòng đó.',
               'Bấm thanh ở biểu đồ theo trường: các bản ghi có giá trị trường đó.', 'Bấm ô số: mở màn eform chứa chỉ tiêu.',
               'Đầu bảng ghi "Đang xem các bản ghi tạo ra số của dòng «…» · Bỏ lọc".']],
], ['Bấm một dòng bất kỳ: số bản ghi hiện bằng số ở cột "Bản ghi" của dòng đó (kiểm tự động trên mọi eform).'])

fr('FR-09', 'Kỳ xem Tháng / Quý / Năm', [
    ['Xử lý', ['"Xem theo": Tháng (tháng 1/2025 – tháng 9/2026), Quý (Quý 1/2025 – Quý 3/2026), Năm (2025, 2026 đến tháng 9); mặc định Quý, kỳ mới nhất.',
               'Bản ghi xếp vào kỳ theo «Kỳ báo cáo», «Năm», «Tháng», «Quý» (DR-03). Đổi loại kỳ hoặc kỳ thì dựng lại mọi số, bảng, bản ghi.']],
], ['Chọn Tháng: danh sách tháng; Dữ liệu đã nhập chỉ còn bản ghi tháng đó.', 'Bản ghi kỳ Năm chỉ hiện khi xem theo Năm.'])

fr('FR-10', 'So với kỳ liền trước, màu trung tính', [
    ['Xử lý', ['So với kỳ liền trước cùng loại (tháng trước, quý trước, năm trước). Số đếm, cộng: % thay đổi; tỷ lệ: chênh điểm %.',
               'Kỳ trước không có số: "Chưa có số <kỳ> trước". **Màu trung tính**: eform không quy định tăng là tốt hay xấu, IOC không tự đánh giá.']],
], ['Không có mũi tên xanh/đỏ ở phần chỉ tiêu 4 trục.'])

fr('FR-11', 'Số đã nhập và số IOC tính', [
    ['Xử lý', ['Trường tỷ lệ, trường tổng đã nhập hiện đúng số đã nhập ("… đã nhập"); dòng gộp nhiều bản ghi không thay bằng số tự tính.',
               'Tỷ lệ, hiệu IOC tính từ các chỉ tiêu khác: tên có "(IOC tính)"; cách tính ghi theo tên trường (mục 5, cột "Cách tính"); rê chuột tên cột xem cách tính; dưới bảng liệt kê cách tính của các cột IOC tính.',
               'Số đã nhập lệch số IOC tính từ cùng bản ghi: đánh dấu bản ghi (BR-08).']],
], ['Mọi chỉ tiêu tỷ lệ, hiệu có "(IOC tính)" và tử, mẫu là chỉ tiêu của cùng eform (kiểm tự động).'])

loc = [u for u in U if u['loc']][0]
fr('FR-12', 'Lọc sẵn theo tài khoản Ban HĐND', [
    ['Mục đích', 'Tài khoản Ban HĐND thấy ngay hoạt động của Ban mình (câu chốt 5, bản đọc HĐND).'],
    ['Tác nhân', 'Tài khoản Ban Kinh tế - Ngân sách, Ban Văn hóa - Xã hội, Ban Pháp chế, Ban Đô thị, Ban Khoa học Công nghệ và Môi trường.'],
    ['Xử lý', [f'Khi mở đơn vị «{loc["name"]}»: chỉ dùng bản ghi có «{loc["loc"]["c"]}» = Ban của tài khoản, ở mọi màn của đơn vị (ô số, thẻ, biểu đồ, bảng, Dữ liệu đã nhập, Xuất Excel).',
               f'Dải báo dưới thanh công cụ: "Tài khoản <Ban>: đang lọc sẵn «{loc["loc"]["c"]}» = <Ban>…" và nút "Bỏ lọc, xem mọi đơn vị thực hiện ›"; bỏ lọc thì có nút "Lọc lại theo <Ban> ›". Bỏ lọc nhớ theo tài khoản.',
               'Ban Khoa học Công nghệ và Môi trường không có trong danh mục của trường: không lọc, dải báo ghi rõ lý do.',
               'Màn ngoài, thẻ đơn vị và 5 eform còn lại của trục HĐND vẫn là số cả trục.']],
], ['Tài khoản Ban Kinh tế - Ngân sách: ô "Số hoạt động" bằng số bản ghi của Ban; Dữ liệu đã nhập chỉ có bản ghi của Ban, ghi "lọc sẵn theo tài khoản".',
    'Bấm "Bỏ lọc": về đủ bản ghi; "Lọc lại": về bản ghi của Ban.', 'Tài khoản trục HĐND (không phải Ban): không lọc.'])

fr('FR-13', 'Xuất Excel', [
    ['Xử lý', ['Tệp .xlsx: trang "Chỉ tiêu" (ô số, chỉ tiêu: kỳ này, kỳ trước, thay đổi, đơn vị); trang "Dữ liệu đã nhập" của eform đang chọn (STT, "Ghi chú IOC" — lý do bản ghi không dùng, rồi đủ mọi trường; ô Số giữ dạng số); trang "Theo xã, phường" khi có.',
               'Đang lọc sẵn theo tài khoản (FR-12) thì xuất đúng bản ghi đang lọc.', 'Thư viện chưa tải xong: báo để thử lại.']],
], ['Trang "Dữ liệu đã nhập" đủ cột, đủ bản ghi như màn hình.'], 'Nên có')

fr('FR-14', 'Đối chiếu khung eform với file eform', [
    ['Mục đích', 'Eform thêm, bớt, đổi trường thì biết ngay màn hình chưa theo kịp.'],
    ['Xử lý', [f'Tải "File mô tả đầu vào eform" về .xlsx; chạy "python3 tools/xa_eform_schema.py <tệp.xlsx> --tp --check": so khung {D["nKhoi"]} khối, {D["nEform"]} eform với js/core/eform-khung.js.',
               'Báo trường thêm, bỏ, đổi tên/kiểu/danh mục; có khác biệt thì trả mã lỗi để chặn phát hành. Chạy không có "--check": ghi lại khung.']],
], ['Với file ngày 28/10/2026: khung khớp; 4 trục dùng 29 eform của 5 khối (Bảng 4.1).'])

fr('FR-15', 'Nút ← quay lại màn trước', [
    ['Mục đích', 'Xem bản ghi xong quay lại đúng chỗ đang xem, không phải bấm lại từ Tổng quan.'],
    ['Xử lý', ['Mỗi lần sang màn khác trong popup (Tổng quan → màn eform → Theo 126 xã → hồ sơ xã → Dữ liệu đã nhập), IOC nhớ màn đang đứng: eform, chỉ tiêu và hồ sơ xã đang mở, bộ lọc của Dữ liệu đã nhập.',
               'Nút ở góc trên bên trái ghi tên màn trước (VD "← Theo 126 xã, phường · Phường Cửa Nam"); bấm thì về đúng màn đó, hồ sơ xã vẫn mở. Màn trước không phải Tổng quan thì có thêm lối "Tổng quan".',
               'Lọc, tìm trong cùng một màn không thêm lịch sử. Về Tổng quan hoặc mở đơn vị khác thì xóa lịch sử.']],
], ['Mở bản ghi từ hồ sơ Phường Cửa Nam (màn 126 xã) → bấm ← về màn 126 xã, hồ sơ Phường Cửa Nam vẫn mở; bấm ← lần nữa về màn eform.'], 'Nên có')

# ======================================================= 4. DỮ LIỆU, QUY TẮC
heading('4. YÊU CẦU DỮ LIỆU VÀ QUY TẮC NGHIỆP VỤ', 1)
heading('4.1. DR-01. Khung eform', 2)
para(f'Tệp js/core/eform-khung.js (tự sinh, không sửa tay): {D["nKhoi"]} khối (mỗi khối một sheet), {D["nEform"]} eform cấp Thành phố. Mỗi trường có tên, mã chuẩn hóa '
     '(bỏ dấu, ký tự ẩn; mã gốc giữ lại để đối chiếu), kiểu (Danh mục, Số, Chữ, Ngày tháng, hoặc để trống như file), dữ liệu mẫu, danh mục, số dòng trong sheet. 4 trục dùng các khối:')
note('Bảng 4.1. Khối eform dùng cho 4 trục')
table([['Khối', 'Sheet', 'Số eform']] + [[x['id'], x['sheet'], str(x['n'])] for x in D['khoi']], [2.4, 10.6, 3.0], size=10.5)
heading('4.2. DR-02. Nguồn bản ghi', 2)
bullets(['Màn hình lấy bản ghi qua hàm nguồn EF_NGUON(mã eform) → danh sách bản ghi { mã trường: giá trị }. Hiện là bản ghi mẫu (js/core/eform-mau.js, EF_LA_MAU = true).',
         'Có dữ liệu thật: thay EF_NGUON, đặt EF_LA_MAU = false, gọi efReset() để tính lại; không sửa màn hình.',
         'Mã trường, mã danh mục chuẩn hóa như khung; số dạng chữ kiểu Việt Nam ("1.234", "1.234,5") đọc thành số; giá trị không đọc được giữ nguyên để hiện và đánh dấu.'])
heading('4.3. DR-03. Kỳ báo cáo và xếp kỳ', 2)
table([
    ['«Kỳ báo cáo» của bản ghi', 'Xem theo Tháng', 'Xem theo Quý', 'Xem theo Năm'],
    ['Tháng («Năm», «Tháng»)', 'Tháng đó', 'Quý chứa tháng', 'Năm'],
    ['Quý («Năm», «Quý»)', 'Không hiện', 'Quý đó', 'Năm'],
    ['Năm («Năm»)', 'Không hiện', 'Không hiện', 'Năm'],
    ['Thiếu năm hoặc kỳ', 'Không xếp được: đếm ở Dữ liệu đã nhập, đánh dấu cần xem lại', '', ''],
    ['Eform không có trường «Năm»', 'Mọi kỳ xem hiện toàn bộ bản ghi; cùng khóa lấy bản gửi sau; không vẽ diễn biến theo kỳ', '', ''],
], [4.6, 3.8, 3.8, 3.8], size=10.5)
heading('4.4. Cách tính chỉ tiêu', 2)
para('Mỗi chỉ tiêu khai báo một cách tính trên tập bản ghi đã chọn cho kỳ (sau BR-03, BR-04). Cách tính ghi bằng chữ theo tên trường ở mục 5.')
table([
    ['Cách tính', 'Ý nghĩa'],
    ['Đếm bản ghi', 'Số bản ghi (có thể chỉ đếm bản ghi có trường = giá trị, hoặc thỏa điều kiện ghi rõ)'],
    ['Đếm … khác nhau', 'Số giá trị khác nhau của một trường (VD số cuộc tiếp xúc cử tri = số «Tên cuộc tiếp xúc cử tri» khác nhau)'],
    ['Cộng', 'Tổng một (hoặc nhiều) trường Số của các bản ghi'],
    ['Cộng, mỗi bản ghi lấy kỳ cuối', 'Số tại thời điểm: mỗi khóa lấy bản của kỳ cuối cùng trong kỳ xem rồi cộng (VD tổng đảng viên cuối kỳ)'],
    ['Cộng, mỗi bản ghi lấy kỳ đầu', 'Số đầu kỳ: mỗi khóa lấy bản của kỳ đầu tiên trong kỳ xem rồi cộng'],
    ['Cộng, mỗi … lấy một lần', 'Trường ghi lặp ở nhiều bản ghi (thông tin cuộc, đợt, đơn vị): mỗi tổ hợp lấy một lần (bản gửi sau) rồi cộng'],
    ['Số đã nhập', 'Giá trị đã nhập của trường; dòng gộp nhiều bản ghi thì xem ở Dữ liệu đã nhập (không tự tính thay)'],
    ['IOC tính: a ÷ b × 100; a − b', 'Tỷ lệ, hiệu tính từ hai chỉ tiêu của cùng eform; tên có "(IOC tính)"'],
], [5.2, 10.8], size=10.5)
heading('4.5. Quy tắc nghiệp vụ', 2)
table([
    ['Mã', 'Quy tắc'],
    ['BR-01', '**Chỉ trường của eform.** Mọi chỉ tiêu, chia cấp, biểu đồ, kiểm tra chỉ dùng trường có trong khung eform (kiểm tự động trên 29 eform).'],
    ['BR-02', '**Kỳ**: bản ghi xếp vào kỳ theo DR-03; eform không có «Năm» không xếp kỳ, ghi rõ trên màn hình.'],
    ['BR-03', '**Bản trùng khóa (X1)**: cùng khóa, cùng kỳ báo cáo thì bản gửi sau thay bản trước; bản bị thay vẫn hiện ở Dữ liệu đã nhập, ghi lý do, không vào tổng hợp.'],
    ['BR-04', '**Bản tháng và bản quý không cộng chồng (X2)**: cùng khóa trong kỳ xem có bản kỳ ngắn hơn thì chỉ lấy bản đó (tháng trước quý, quý trước năm).'],
    ['BR-05', '**Bản ghi cần xem lại (X8)**: ô Danh mục có mã ngoài danh mục; ô Số không đọc được; ô Ngày tháng không đọc được; thiếu trường khóa (trừ trường khóa được để trống); thiếu năm, kỳ; vi phạm kiểm tra riêng của eform (mục 5). Bản ghi vẫn hiện đủ, ô lỗi tô màu, rê chuột xem lý do.'],
    ['BR-06', '**Đơn vị tính**: eform có «Đơn vị tính» thì không cộng giá trị khác đơn vị tính; dòng gộp nhiều đơn vị tính ghi "—"; ô số tách theo từng đơn vị tính.'],
    ['BR-07', '**Bản ghi ưu tiên**: eform có bản tổng hợp (VD «Loại bản ghi» = Tổng hợp ở Thu chi Quỹ QĐ4795) thì cùng địa bàn, kỳ chỉ dùng bản tổng hợp, không cộng chồng với bản chi tiết.'],
    ['BR-08', '**Số đã nhập là số hiển thị**: trường tỷ lệ, tổng đã nhập không bị thay; lệch với số IOC tính từ cùng bản ghi (VD tỷ lệ lệch quá 0,1 điểm, tổng khác cộng thành phần) thì đánh dấu bản ghi.'],
    ['BR-09', '**Kỳ trống**: kỳ không có bản ghi nào của eform thì mọi chỉ tiêu để trống ("—"), không hiện 0.'],
    ['BR-10', 'Màn ngoài, popup, Excel dùng chung một nguồn số: cùng chỉ tiêu, cùng kỳ thì cùng số. Lọc sẵn theo tài khoản (FR-12) dùng bộ nhớ đệm riêng.'],
    ['BR-11', 'Định dạng số Việt Nam: dấu chấm hàng nghìn, dấu phẩy thập phân; tỷ lệ 1 số lẻ; đơn vị lấy từ tên trường hoặc chỉ tiêu.'],
], [1.6, 14.4], size=10.5)
heading('4.6. Bản ghi mẫu (khi chưa có dữ liệu thật)', 2)
bullets(['Bản ghi chỉ có trường của eform, đúng kiểu; ô Danh mục chỉ nhận mã trong danh mục; trường Chữ có kèm danh sách lấy chữ trong danh sách. **Không sinh thêm trường.**',
         'Giữ quan hệ hợp lý (đầu kỳ + tăng − giảm = cuối kỳ; tổng = cộng thành phần; thông tin một cuộc giống nhau ở mọi bản ghi của cuộc) và cố ý có vài bản ghi lệch để màn Dữ liệu đã nhập có bản ghi cần xem lại.',
         'Từ tháng 1/2025 đến tháng 9/2026; hạt giống cố định theo eform nên mở lần nào cũng ra cùng số.',
         'Màn hình ghi rõ "Đang là bản ghi mẫu dựng theo khung eform, chưa nối dữ liệu thật".'])

# ======================================================= 5. DANH MỤC EFORM
heading(f'5. DANH MỤC {N_EF} EFORM', 1)
para(f'Phần này sinh tự động từ cấu hình đang chạy (tools/tp_srs_dump.js). Số mẫu là kỳ {PL} (bản ghi mẫu) — eform chưa có bản ghi kỳ này lấy kỳ gần nhất có bản ghi, ghi rõ. '
     'Bảng "Trường của eform" liệt kê **đủ mọi trường** theo đúng thứ tự trong sheet; cột "Vai trò" suy thẳng từ cấu hình (trường nào chia cấp, là khóa, '
     'dùng tính chỉ tiêu nào, vẽ biểu đồ nào, kiểm tra gì); **mọi trường đều hiện ở màn Dữ liệu đã nhập** (FR-07). Cột "Hiện ở": Ô = ô số của đơn vị, Thẻ = thẻ eform, Bảng = cột của bảng nhiều cấp.')
note(f'Bảng 5.0. {N_EF} eform của 4 trục')
table([['#', 'Trục', 'Đơn vị', 'Eform (tên ngắn)', 'Trường', 'Chỉ tiêu', f'Bản ghi {PL}']] +
      [[str(i + 1), ROLE[u['role']], u['name'], e['ten'], str(len(e['fields'])), str(len(e['chi'])), str(e['mau']['n']) + ('' if e['mau']['label'] == PL else f' ({e["mau"]["label"]})')]
       for i, (u, e) in enumerate(EFS)], [0.8, 1.8, 3.8, 4.6, 1.3, 1.3, 2.4], size=9)
for i, (u, e) in enumerate(EFS):
    heading(f'5.{i + 1}. {u["name"]} — eform «{e["ten"]}»', 2)
    para(f'Trục **{ROLE[u["role"]]}** · eform «{e["efTen"]}» · sheet "{e["sheet"]}" từ dòng {e["dong"]} · {len(e["fields"])} trường, {len(e["chi"])} chỉ tiêu, {len(e["bieu"])} biểu đồ.')
    bl = [f'**Một bản ghi là**: {e["banGhi"]}',
          '**Khóa bản ghi**: ' + (' + '.join(f'«{x}»' for x in e['khoa']) + ' + kỳ' if e['khoa'] else 'không khai báo') + (f' (được để trống: {", ".join("«" + x + "»" for x in e["khoaRong"])})' if e['khoaRong'] else ''),
          '**Chia cấp (bảng nhiều cấp)**: ' + ' › '.join(f'«{x}»' for x in e['cap'])]
    if e['bang']:
        bl.append('**Bảng phụ**: ' + '; '.join(f'{b["t"]} (' + ' › '.join(f'«{x}»' for x in b['cap']) + ')' for b in e['bang']))
    if e['xa']:
        bl.append(f'**Theo 126 xã, phường** (theo «{e["xaTruong"]}»): ' + '; '.join(e['xa']))
    elif e['xaTruong']:
        bl.append(f'**Bảng theo địa bàn**: «{e["xaTruong"]}»')
    if e['khongKy']:
        bl.append('**Kỳ**: eform không có trường «Năm» — mọi kỳ xem hiện toàn bộ bản ghi (BR-02)')
    if u['loc'] and e['ef'] == 'hdnd4':
        bl.append(f'**Lọc sẵn theo tài khoản Ban** theo «{u["loc"]["c"]}» (FR-12)')
    bl.append(f'**Số mẫu {e["mau"]["label"]}**: {e["mau"]["n"]} bản ghi dùng ({e["mau"]["nAll"]} bản ghi mọi kỳ)')
    bullets(bl, 11.5)
    note('Chỉ tiêu')
    table([['#', 'Chỉ tiêu', 'Cách tính', 'Hiện ở', e['mau']['label']]] +
          [[str(j + 1), c['l'] + (f' ({c["u"]})' if c['u'] and c['u'] != '%' and '(' + c['u'] + ')' not in c['l'] else ''), c['mota'],
            ', '.join(x for x, ok in (('Ô', c['kpi']), ('Thẻ', c['the']), ('Bảng', c['cot'])) if ok) or 'Biểu đồ, bảng phụ',
            c['v'] if c['v'] is not None else '—'] for j, c in enumerate(e['chi'])], [0.7, 4.6, 6.6, 1.9, 2.2], size=9)
    if e['bieu']:
        para('**Biểu đồ**: ' + '; '.join(f'{b["t"]} ({b["loai"].lower()}' + (f' theo «{b["theo"]}»' if b['theo'] else '') + ')' for b in e['bieu']) + '.', 11.5)
    if e['kt']:
        para('**Kiểm tra riêng (đánh dấu cần xem lại)**: ' + '; '.join(e['kt']) + '.', 11.5)
    note('Trường của eform (đúng thứ tự trong sheet)')
    table([['#', 'Tên trường', 'Mã', 'Kiểu', 'Danh mục', 'Vai trò ở phần tổng hợp']] +
          [[str(j + 1), f['l'], f['c'], KIEU.get(f['t'], '(để trống trong file)'), dm_text(f), f['vai']] for j, f in enumerate(e['fields'])],
          [0.7, 3.6, 3.0, 1.6, 3.3, 3.8], size=8.5)

# ======================================================= 6. PHI CHỨC NĂNG
heading('6. YÊU CẦU PHI CHỨC NĂNG', 1)
table([
    ['Mã', 'Yêu cầu', 'Cách kiểm'],
    ['NFR-01 Hiệu năng', 'Mở popup, đổi kỳ, chuyển màn, lọc bản ghi dưới 1 giây. Bản ghi của một eform đọc một lần rồi dùng lại; số của một đơn vị, một kỳ tính một lần (bộ nhớ đệm, làm mới bằng efReset).', 'Đo trên trình duyệt'],
    ['NFR-02 Co giãn màn hình', 'Máy tính, máy tính bảng, điện thoại 390px: không tràn ngang trang; bảng Dữ liệu đã nhập, bảng nhiều cấp cuộn ngang trong khung.', 'Chụp ảnh ở 390px, 1440px'],
    ['NFR-03 Bảo mật, phân quyền', 'Người dùng chỉ nhận bản ghi được phép theo cấp. Khi có API, máy chủ lọc theo tài khoản; lọc sẵn của Ban HĐND (FR-12) là tiện ích hiển thị, không phải phân quyền.', 'Đăng nhập từng loại tài khoản, kiểm dữ liệu nhận được'],
    ['NFR-04 Bám eform', f'Dữ liệu đã nhập hiện đủ {N_FIELD} trường của {N_EF} eform; không chỉ tiêu ngoài eform; khung khớp file (FR-14).', 'Kiểm thử tự động + --tp --check'],
    ['NFR-05 Dễ bảo trì', 'Eform đổi trường: chạy lại công cụ sinh khung. Đổi cách tính: sửa khai báo eform trong js/features/ctm-truc-eform.js, không sửa phần dựng màn hình. Tài liệu này sinh lại bằng tools/tp_srs_docx.py.', 'Rà soát mã'],
    ['NFR-06 Kiểm thử tự động', 'tests/ctm: ' + ', '.join(f'{a} {n:,} phép kiểm'.replace(',', '.') for a, n in TESTS.items()) + ' (chạy 28/10/2026, 0 lỗi). tp-eform.test.js kiểm: khung 74 eform; mỗi eform một đơn vị; chỉ trường eform; Dữ liệu đã nhập đủ cột; lần lại bản ghi; X1, X2; đơn vị cũ ẩn bằng cờ; kỳ trống; màn ngoài; lọc sẵn Ban HĐND.', 'node tests/ctm/*.test.js'],
    ['NFR-07 Trình duyệt', 'Microsoft Edge, Google Chrome bản hiện hành; không lỗi JavaScript khi tải trang và mở mọi màn.', 'Mở thử bằng trình duyệt tự động'],
    ['NFR-08 Ngôn ngữ', 'Tiếng Việt có dấu; tên trường, danh mục đúng như eform; không hiện mã kỹ thuật (trừ mã sai ở ô cần xem lại).', 'Quét chữ hiển thị'],
    ['NFR-09 Khả dụng', 'Ô số, thẻ, tên dòng, thanh biểu đồ bấm được có trạng thái rê chuột, dùng được bằng bàn phím; ô cần xem lại có lý do bằng chữ, không chỉ dựa vào màu.', 'Kiểm bằng bàn phím'],
], [3.4, 9.6, 3.0], size=10)

# ======================================================= 7. CỜ
heading('7. CẤU HÌNH BẬT, TẮT', 1)
table([
    ['Cờ', 'Giá trị hiện tại', 'Tác dụng'],
    ['CTM_ENABLED (js/features/ctm-engine.js)', str(D['flags']['CTM_ENABLED']).lower(), 'Bật khuôn chỉ tiêu mới.'],
    ['CTM_OVERVIEW_ENABLED (js/features/ctm-engine.js)', str(D['flags']['CTM_OVERVIEW_ENABLED']).lower(), 'Bật màn ngoài kiểu mới.'],
    ['TRUC_AN_DON_VI_CU (js/core/central-level.js)', 'true', 'Ẩn đơn vị cũ không có eform của 4 trục, dựng đơn vị theo eform. false: về như cũ.'],
    ['enabled của màn ngoài cũ dang-tp, hdnd-tp, mttq-tp, tu-all', ', '.join(str(o['enabled']).lower() for o in D['oldOverviews']), 'Màn ngoài cũ tắt, thay bằng *-ef (js/features/ctm-truc-eform.js).'],
    ['EF_LA_MAU (js/core/eform-mau.js)', str(D['flags']['EF_LA_MAU']).lower(), 'Đang dùng bản ghi mẫu: hiện câu "Đang là bản ghi mẫu…". Đặt false khi nối dữ liệu thật.'],
    ['EF_HDND4_LOC (js/features/ctm-truc-eform.js)', '5 tài khoản Ban', 'Bảng tài khoản Ban → mã «Đơn vị thực hiện» để lọc sẵn (FR-12); null là danh mục không có Ban đó.'],
], [6.2, 2.6, 7.2], size=10)

# ======================================================= 8. NGHIỆM THU
heading('8. KỊCH BẢN NGHIỆM THU', 1)
table([
    ['Mã', 'Kịch bản', 'Kết quả mong đợi', 'Yêu cầu'],
    ['TC-01', 'Đăng nhập Thành ủy', 'Tab "Tất cả": 8 ô số có số, 4 thẻ trục; không lỗi JavaScript', 'FR-02'],
    ['TC-02', 'Bấm tab HĐND, Ủy ban MTTQ, Thành ủy', 'Mỗi tab 8 ô số theo Bảng 3.2; HĐND 6, MTTQ 6, Thành ủy 4 thẻ đơn vị; không còn đơn vị cũ', 'FR-01, FR-03'],
    ['TC-03', f'Mở lần lượt {len(U)} đơn vị, mọi eform', 'Ô số, thẻ, biểu đồ, bảng như mục 5; mọi màn dựng được, không lỗi', 'FR-04, FR-05'],
    ['TC-04', 'Mở Dữ liệu đã nhập của từng eform', 'Số cột = số trường + 1; tên, thứ tự cột như mục 5', 'FR-07, NFR-04'],
    ['TC-05', 'Ở bảng nhiều cấp, bấm tên một dòng', 'Hiện đúng số bản ghi ở cột "Bản ghi"; đầu bảng ghi "Đang xem các bản ghi tạo ra số…"', 'FR-08'],
    ['TC-06', 'Nạp bản tháng và bản quý cùng khóa, cùng quý', 'Chỉ cộng bản tháng; bản quý ghi lý do ở Dữ liệu đã nhập', 'BR-04'],
    ['TC-07', 'Nạp hai bản cùng khóa, cùng kỳ', 'Lấy bản gửi sau; bản trước ghi "Trùng khóa với bản gửi sau"', 'BR-03'],
    ['TC-08', 'Đổi "Xem theo" Quý → Tháng → Năm', 'Danh sách kỳ, số, bảng, bản ghi đổi theo loại kỳ; so với tháng/quý/năm trước', 'FR-09, FR-10'],
    ['TC-09', 'Mở «Đánh giá cán bộ» Quý 2/2025', '"Kỳ này chưa có bản ghi", nút sang Năm 2025; không vẽ thẻ rỗng', 'FR-05'],
    ['TC-10', 'Mở «Biến động Đảng viên» → Theo 126 xã, phường → một xã', 'Bảng 126 xã sắp từ lớn đến nhỏ; hồ sơ xã có liên kết bản ghi', 'FR-06'],
    ['TC-11', 'Đăng nhập Ban Kinh tế - Ngân sách (HĐND), mở «Hoạt động Thường trực, Ban và Tổ đại biểu»', 'Dải "đang lọc sẵn"; số, bản ghi chỉ của Ban; Bỏ lọc / Lọc lại đúng', 'FR-12'],
    ['TC-12', 'Đăng nhập Ban Khoa học Công nghệ và Môi trường, mở cùng eform', 'Không lọc; dải ghi danh mục eform không có Ban', 'FR-12'],
    ['TC-13', 'Xuất Excel đơn vị Ban Tổ chức', 'Trang "Chỉ tiêu", "Dữ liệu đã nhập" (đủ cột), "Theo xã, phường"', 'FR-13'],
    ['TC-14', 'Chạy xa_eform_schema.py --tp --check với file hiện hành', 'Khớp khung; trả mã 0', 'FR-14'],
    ['TC-15', 'Điện thoại 390px, Dữ liệu đã nhập', 'Không tràn ngang trang; bảng cuộn ngang trong khung', 'NFR-02'],
], [1.4, 4.8, 7.4, 2.4], size=10)

# ======================================================= 9. HẠN CHẾ
heading('9. HẠN CHẾ HIỆN TẠI VÀ VẤN ĐỀ MỞ', 1)
table([
    ['#', 'Vấn đề', 'Hướng xử lý đề xuất'],
    ['1', 'Chưa có dữ liệu thật: API 4 trục chưa cung cấp; màn hình chạy bằng bản ghi mẫu.', 'Có API: thay EF_NGUON (DR-02), đặt EF_LA_MAU = false.'],
    ['2', '«Tên chỉ tiêu» là ô Chữ tự do ở eform Tuyên giáo và Dân vận, Nội chính: gõ khác nhau một chữ thì tách thành hai dòng.', 'Đề nghị bên eform chuyển thành danh mục có mã.'],
    ['3', 'Eform «Theo dõi nhiệm vụ HĐND»: danh mục «Khối», «Đơn vị» là các Ban của HĐND cấp xã, khác các Ban của HĐND Thành phố; eform «Theo dõi nhiệm vụ MTTQ»: danh mục «Khối» chép từ HĐND.', 'IOC hiện đúng như danh mục; bên eform sửa danh mục.'],
    ['4', 'Danh mục «Đơn vị thực hiện» của eform hoạt động Thường trực, Ban, Tổ không có Ban Khoa học Công nghệ và Môi trường nên tài khoản Ban này không lọc sẵn được.', 'Bên eform bổ sung mã, rồi thêm vào EF_HDND4_LOC.'],
    ['5', 'Ba eform sheet "Trục UBND" (văn bản trên môi trường mạng, cuộc họp không giấy tờ, chữ ký số) không có trường «Năm»: không xếp được kỳ, không so sánh, không vẽ diễn biến.', 'Bên eform thêm «Năm» (và «Tháng»/«Quý»).'],
    ['6', 'Ô số "Thu ngân sách nhà nước" ở tab "Tất cả" lấy từ Sở Tài chính theo nguồn hiện hành.', 'Giữ nguyên theo quy ước (nguồn khác để nguyên); đổi khi Sở Tài chính có eform.'],
    ['7', 'Lọc sẵn và phân quyền đang làm ở trình duyệt (môi trường trình diễn).', 'Lọc bản ghi theo tài khoản ở máy chủ (NFR-03).'],
    ['8', 'Các sở, ngành của UBND đã làm theo eform (28–29/10/2026): Thanh tra, Công Thương, NN&MT, Nội vụ, KH&CN, Xây dựng, Dân tộc và Tôn giáo, Y tế, VH, TT và Du lịch, Ban QL khu CNC; mô tả ở tài liệu riêng từng sở.', 'Không còn việc dở; tab UBND của màn ngoài đọc thẻ từng sở theo eform.'],
    ['9', f'File eform còn {len(LOI)} chỗ lỗi, chỗ nghi (Phụ lục B).', 'Bên eform sửa; chạy lại công cụ sinh khung.'],
], [0.8, 8.6, 6.6], size=10)

# ======================================================= PHỤ LỤC
k.page_break()
heading('PHỤ LỤC A. ĐƠN VỊ CŨ ẨN BẰNG CỜ', 1)
para(f'{len(AN)} đơn vị cũ không có eform, ẩn bằng TRUC_AN_DON_VI_CU (không xóa khai báo; tài khoản vẫn đăng nhập được).')
table([['#', 'Trục', 'Đơn vị cũ', 'Mã']] + [[str(i + 1), a, b, c] for i, (a, b, c) in enumerate(AN)], [0.8, 2.8, 8.6, 3.8], size=10)

heading('PHỤ LỤC B. LỖI, CHỖ NGHI TRONG FILE EFORM', 1)
para('Lấy từ bản đọc eform 4 trục (docs/BAN_DOC_EFORM/TRUC_*). IOC hiện đúng như file; đề nghị bên eform rà soát.')
table([['#', 'Trục', 'Eform', 'Lỗi, chỗ nghi']] + [[str(i + 1), a, b, c] for i, (a, b, c) in enumerate(LOI)], [0.8, 2.0, 4.6, 8.6], size=9.5)

heading('PHỤ LỤC C. CÁC CÂU ĐÃ CHỐT KHI ĐỌC EFORM', 1)
para('Lấy từ bản đọc eform 4 trục; đã áp dụng vào cấu hình mục 5.')
for r in ROLES:
    if CHOT.get(r):
        para(f'**{ROLE[r]}**', after=2)
        bullets(CHOT[r], 11)

heading('PHỤ LỤC D. BẢN ĐỒ MÃ NGUỒN', 1)
table([
    ['Tệp', 'Nội dung'],
    ['js/core/eform-khung.js', f'Khung {D["nEform"]} eform cấp Thành phố (tự sinh từ file, không sửa tay)'],
    ['tools/xa_eform_schema.py', 'Sinh khung từ tệp .xlsx; "--tp" khung cấp Thành phố; "--check" đối chiếu, liệt kê khác biệt'],
    ['js/core/eform-mau.js', 'Bản ghi mẫu theo khung eform; hàm nguồn EF_NGUON, cờ EF_LA_MAU'],
    ['js/features/ctm-eform.js', 'Khung chỉ tiêu theo eform cấp Thành phố: đọc bản ghi, kỳ, X1/X2, cách tính, bảng nhiều cấp, biểu đồ, Theo 126 xã, Dữ liệu đã nhập, lọc sẵn theo tài khoản'],
    ['js/features/ctm-truc-eform.js', f'Khai báo {N_EF} eform, {len(U)} đơn vị của 4 trục; màn ngoài *-ef; bảng lọc sẵn Ban HĐND'],
    ['js/features/ctm-engine.js', 'Khuôn chỉ tiêu dùng chung: màn ngoài, popup, chọn kỳ, so sánh, xuất Excel'],
    ['js/core/central-level.js', 'Đơn vị của 4 trục, cờ TRUC_AN_DON_VI_CU, tài khoản Ban, sở'],
    ['tests/ctm/tp-eform.test.js', 'Kiểm thử 4 trục theo eform'],
    ['tools/tp_srs_dump.js, tools/tp_srs_docx.py', 'Sinh tài liệu này từ cấu hình đang chạy'],
], [6.0, 10.0], size=10)

heading('PHỤ LỤC E. LỊCH SỬ PHIÊN BẢN', 1)
table([['Phiên bản', 'Ngày', 'Nội dung'],
       ['1.1', NGAY, 'Thêm FR-15 (nút ← quay lại màn trước); các sở đã làm theo eform, tách tài liệu riêng từng sở; cập nhật số kiểm thử.'],
       ['1.0', '28/10/2026', f'Bản đầu: {len(U)} đơn vị, {N_EF} eform, {N_FIELD} trường, {N_CHI} chỉ tiêu theo eform; ẩn {len(AN)} đơn vị cũ; màn ngoài theo eform; kỳ Tháng/Quý/Năm; Dữ liệu đã nhập; lọc sẵn theo tài khoản Ban HĐND.']],
      [2.2, 2.6, 11.2], size=10.5)

from docx.oxml import OxmlElement
from docx.oxml.ns import qn
uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); k.doc.settings.element.append(uf)
d, m = k.save(OUT)
print(d); print(m)
print(f'{len(U)} đơn vị, {N_EF} eform, {N_FIELD} trường, {N_CHI} chỉ tiêu, {len(AN)} đơn vị ẩn, {len(LOI)} lỗi file eform')
