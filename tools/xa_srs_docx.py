# -*- coding: utf-8 -*-
"""Sinh docs/XA_XaPhuong/XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28.docx + .md — Đặc tả yêu cầu phần mềm (SRS) phân hệ chỉ tiêu
cấp xã, phường theo 12 eform (bản 2.0, thay bản 1.0 ngày 27/10/2026 — 19 đơn vị; tệp bản 1.0 đã xóa theo yêu cầu 28/10/2026).
Chạy từ thư mục gốc ioc:  python3 tools/xa_srs_docx.py      (cần python-docx; Node lấy từ biến NODE hoặc PATH)
Khung eform, cách gom số, ô số, nhóm và số mẫu đọc thẳng từ code qua tools/xa_srs_dump.js nên luôn khớp giao diện; phần yêu cầu
chức năng, phi chức năng viết tay theo hành vi của ctm-engine.js, ctm-xa-units.js, xa-eform-mau.js, login.js, indicators.js.
Sau khi sinh, cập nhật Mục lục bằng Word: tools/vhtt_doc_finalize.ps1 -Docx <đường dẫn .docx>."""
import json, os, re, shutil, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'XA_XaPhuong', 'XA_SRS_CHI_TIEU_XA_PHUONG_2026_10_28.docx')
NODE = os.environ.get('NODE') or shutil.which('node')
if not NODE:
    raise SystemExit('Không tìm thấy Node: đặt biến NODE=<đường dẫn node> (hoặc Electron, tool tự bật ELECTRON_RUN_AS_NODE).')
D = json.loads(subprocess.run([NODE, 'tools/xa_srs_dump.js'], cwd=ROOT, capture_output=True, check=True,
                              env=dict(os.environ, ELECTRON_RUN_AS_NODE='1')).stdout.decode('utf-8'))
VER, NGAY = '2.2', '30/10/2026'
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k'
TESTS = {'ctm.test.js': 6741, 'ctm-quy-tac.test.js': 1707, 'xa-eform.test.js': 797}


def n(x, d=0):
    if x is None:
        return '—'
    s = f'{x:,.{d}f}'
    return s.replace(',', '§').replace('.', ',').replace('§', '.')


def num(x):
    """Số mẫu: giữ số lẻ như đã tính (tối đa 1)"""
    if x is None:
        return '—'
    return n(x, 0 if float(x).is_integer() else 1)


U, EF, P, TOT = D['units'], {e['id']: e for e in D['eforms']}, D['periods'], D['tot']
SAMPLE, SAMPLE2 = D['sample']
ROLE = {'DANG': 'Đảng ủy', 'HDND': 'HĐND', 'UBND': 'UBND', 'MTTQ': 'Ủy ban MTTQ'}
ROLES = ['DANG', 'HDND', 'UBND', 'MTTQ']
N_FIELD = sum(len(e['fields']) for e in D['eforms'])
N_KPI = sum(len(u['kpis']) for u in U)
N_GROUP = sum(len(u['groups']) for u in U)
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
KY = {'ky_bao_cao', 'nam', 'thang', 'quy'}


def F(u, c):
    return next(f for f in EF[u['ef']]['fields'] if f['c'] == c)


def fl(u, c):
    return '«' + F(u, c)['l'] + '»'


def dml(f, v):
    return next((o['l'] for o in f['dm'] if o['v'] == v), v)


def where_text(u, w):
    return ' và '.join(fl(u, c) + ' = ' + dml(F(u, c), v) for c, v in w.items())


def role_of(u, f):
    c, r = f['c'], []
    if c == 'dia_ban':
        r.append('Địa bàn: bản ghi của xã, phường nào')
    elif c in KY:
        r.append('Kỳ: xếp bản ghi vào quý (DR-04)')
    if c == u['nhom']:
        r.append('Chia nhóm: mỗi giá trị một màn')
    if c in u['key']:
        r.append('Mô tả dòng số liệu')
    if c == u['dvt']:
        r.append('Đơn vị tính của dòng')
    if c in u['so']:
        r.append('Số tỷ lệ: không cộng' if '%' in f['l'] else 'Số: cộng dồn')
    if c in u['info']:
        r.append('Ghi kèm dòng số liệu')
    if any(k['so'] == c or (k['where'] and c in k['where']) for k in u['kpis']):
        r.append('Dùng ở ô số chính')
    return r or ['Không dùng (xem ở Dữ liệu đã nhập)']


def dm_text(f):
    if f['t'] != 'dm':
        return '—'
    if not f['dm']:
        return 'Tên xã, phường (126 đơn vị)'
    ls = [o['l'] or '(trống)' for o in f['dm']]
    return f'{len(ls)} mã: ' + ', '.join(ls[:4]) + (f', … (+{len(ls) - 4})' if len(ls) > 4 else '')


def eform_issues():
    """Lỗi trong file eform phát hiện tự động từ khung eform (giống tools/xa_eform_schema.py --check)"""
    out = []
    for e in D['eforms']:
        for f in e['fields']:
            if f['goc']:
                out.append((f['dong'], e['ten'], f'Mã trường «{f["l"]}» có dấu hoặc ký tự ẩn ("{f["goc"]}")', f'Sửa thành "{f["c"]}"'))
        for f in e['fields']:
            for i, o in enumerate(f['dm']):
                if o['goc']:
                    an = re.search('[​-‏⁠﻿]', o['goc'])
                    out.append((f['dong'] + i, e['ten'], f'Mã danh mục "{o["v"]}" của «{f["l"]}» ' + ('có ký tự ẩn (U+200B), nhìn không thấy' if an else f'có dấu ("{o["goc"]}")'), f'Gõ lại mã "{o["v"]}"'))
        miss = {}
        for f in e['fields']:
            for i, o in enumerate(f['dm']):
                if not o['l']:
                    miss.setdefault(f['l'], []).append(f['dong'] + i)
        for f in e['fields']:
            for i, o in enumerate(f['dm']):
                if o.get('lgoc'):
                    out.append((f['dong'] + i, e['ten'], f'Mã "{o["v"]}" của «{f["l"]}» ghi tên "{o["lgoc"]}" (lệch mã); màn hình hiện "{o["l"]}" theo mã', f'Sửa tên thành "{o["l"]}"'))
        for l, rows in miss.items():
            out.append((rows[0], e['ten'], f'«{l}»: {len(rows)} mã danh mục thiếu tên hiển thị (dòng {rows[0]}–{rows[-1]})', 'Bổ sung tên như các eform khác'))
        for f in e['fields']:
            if f['t'] == 'dm' and f['mau'] and f['dm'] and not any(o['l'] == f['mau'] or o['v'] == f['mau'] for o in f['dm']):
                out.append((f['dong'], e['ten'], f'Dữ liệu mẫu "{f["mau"]}" của «{f["l"]}» không có trong danh mục', 'Cho mẫu trùng một giá trị của danh mục'))
            if f['t'] == 'so' and f['mau'] and not re.fullmatch(r'-?\d+(\.\d+)?', f['mau']):
                out.append((f['dong'], e['ten'], f'Trường Số «{f["l"]}» có dữ liệu mẫu không phải số ("{f["mau"]}")', 'Thay bằng một số'))
    return sorted(out, key=lambda x: x[0])


ISSUES = eform_issues()
# ghi nhận thêm khi rà soát bằng mắt ngày 27/10/2026 (tool không tự bắt được); 28/10 bên eform đã sửa «Nhóm mục» Đảng Ủy, "Đến ngàu" — bỏ khỏi danh sách
ISSUES_TAY = [
    ('38, 46', 'Hội đồng nhân dân', '"Nghị quyết phát triển kinh tế - xã hội 06 tháng cuối năm 2026" — nhiều khả năng là năm 2025', 'Kiểm tra lại năm'),
    ('255', 'Quản lý văn bản', 'Tên trường "Ngày báo cáo" nhưng mã là ngay_van_hanh', 'Thống nhất tên và mã'),
    ('350', 'Giáo dục', 'Mã bao_cao_nganh_giao_duc có tên hiển thị "Tuyển mới"', '"Báo cáo ngành giáo dục"'),
]

k = Kit('Đặc tả yêu cầu phần mềm · Chỉ tiêu cấp xã, phường theo eform · IOC Hà Nội')
para, table, box, heading, note, bullets = k.para, k.table, k.box, k.heading, k.note, k.bullets

# ======================================================= TRANG BÌA
k.blank(3)
para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
k.rule()
k.blank(3)
para('ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)', 22, CENTER, 6, bold=True, color=NAVY, md=False)
k.md.title('Đặc tả yêu cầu phần mềm (SRS) — Phân hệ chỉ tiêu cấp xã, phường theo eform')
para('Phân hệ chỉ tiêu cấp xã, phường', 16, CENTER, 4, bold=True, color=NAVY)
para(f'{len(U)} eform của 4 trục Đảng ủy, HĐND, UBND, Ủy ban MTTQ trong mỗi xã, phường', 13, CENTER, 4, italic=True, color=GREY)
k.blank(3)
table([
    ['Phạm vi', f'Màn hình chỉ tiêu của tài khoản xã, phường và tài khoản phòng, ban trong xã, phường; {len(U)} đơn vị đúng {len(U)} eform, {N_FIELD} trường; áp dụng cho {TOT["nP"] + TOT["nX"]} xã, phường'],
    ['Căn cứ', 'Sheet "Xã/Phường" của "File mô tả đầu vào eform"; mã nguồn IOC đang chạy (28/10/2026); khung eform, cách gom số, số mẫu sinh tự động từ cấu hình'],
    ['Phiên bản', VER + ' — thay bản 1.0 ngày 27/10/2026'],
    ['Ngày lập', NGAY],
], [3.5, 12.5], header=False, key_col=True, size=12)
k.page_break()
k.toc()
k.page_break()

# ======================================================= 1. GIỚI THIỆU
heading('1. GIỚI THIỆU', 1)
heading('1.1. Mục đích', 2)
para('Tài liệu đặc tả yêu cầu đối với phân hệ chỉ tiêu cấp xã, phường của Hệ thống điều hành IOC Thành phố Hà Nội sau khi làm lại theo đúng eform: '
     'người dùng nào được xem gì, các màn hình và thao tác, khung từng eform, cách gom bản ghi thành số, quy tắc so sánh và hiển thị, '
     'yêu cầu phi chức năng và tiêu chí nghiệm thu.')
para('Người đọc: nhóm phân tích nghiệp vụ, nhóm phát triển, nhóm kiểm thử, nhóm làm eform, đơn vị tiếp nhận vận hành và cán bộ xã, phường tham gia nghiệm thu.')
box(['Từ bản 2.0 (chốt 28/10/2026), màn hình chỉ tiêu xã, phường **chỉ dùng dữ liệu có trong eform**: bỏ toàn bộ 19 đơn vị, 161 chỉ tiêu của bản 1.0; '
     'không tự đặt chỉ tiêu, không tính tỷ lệ, bình quân, xếp hạng từ số không có trong eform; mọi trường của eform phải xem được trên IOC để người nhập đối chiếu.'],
    k.NOTE_FILL, 'Thay đổi chính: ')
heading('1.2. Phạm vi', 2)
para('**Trong phạm vi:**')
bullets([
    'Màn ngoài "Nhóm chỉ tiêu theo lĩnh vực" của tài khoản xã, phường: tab "Tất cả" (gộp 4 trục) và 4 tab trục.',
    'Băng tổng quan của tài khoản phòng, ban trong xã, phường (đăng nhập riêng một eform).',
    'Cửa sổ chi tiết (popup) của từng eform: màn Tổng quan, màn từng nhóm, màn **Dữ liệu đã nhập**, chọn kỳ, so sánh, xuất Excel.',
    f'Khung {len(U)} eform ({N_FIELD} trường) và công cụ đối chiếu khung với sheet eform.',
    'Bản ghi mẫu dựng theo khung eform khi chưa có dữ liệu thật.',
    'Người dùng cấp Thành phố xem một xã, phường qua chức năng "Xem theo cơ cấu tổ chức".',
])
para('**Ngoài phạm vi:**')
bullets([
    'Hệ thống nhập eform (IOC chỉ đọc bản ghi); kết nối API dữ liệu xã, phường (chưa cung cấp — mục 9).',
    'Chỉ tiêu của các đơn vị cấp Thành phố và các sở; cấp Trung ương; bản đồ GIS; giao việc, theo dõi nhiệm vụ; quản trị đơn vị, người dùng.',
    'Trang độc lập chỉ tiêu xã, phường (standalone/xa-phuong-chi-tieu-doc-lap.html) — còn theo bản 1.0, chưa dựng lại (mục 9).',
])
heading('1.3. Thuật ngữ', 2)
table([
    ['Thuật ngữ', 'Giải thích'],
    ['Xã, phường', f'Đơn vị hành chính cấp xã của Hà Nội sau sắp xếp năm 2025: {TOT["nP"]} phường, {TOT["nX"]} xã, chính quyền địa phương hai cấp vận hành từ 01/7/2025'],
    ['Trục', 'Một trong bốn khối của hệ thống chính trị cấp xã: Đảng ủy, HĐND, UBND, Ủy ban MTTQ'],
    ['Eform', 'Biểu mẫu nhập liệu của một lĩnh vực, mô tả ở sheet "Xã/Phường" (tên trường, mã, kiểu nhập, danh mục). Mỗi eform là một đơn vị trên IOC'],
    ['Trường', 'Một ô của eform: Danh mục (chọn trong danh sách mã), Số, Chữ hoặc Ngày tháng'],
    ['Bản ghi', 'Một lần nhập eform: mỗi trường một giá trị'],
    ['Khung eform', f'Danh sách {N_FIELD} trường của {len(U)} eform chép từ sheet (js/core/xa-eform.js), sinh bằng tools/xa_eform_schema.py'],
    ['Dòng số liệu', 'Các bản ghi cùng kỳ giống nhau ở trường chia nhóm, mọi trường mô tả và đơn vị tính, gộp làm một hàng ở phần Tổng hợp'],
    ['Ô số', 'Ô hiển thị một số then chốt ở đầu màn; bấm mở các bản ghi tạo ra số đó'],
    ['Nhóm', 'Một giá trị của trường chia nhóm (VD «Nhóm mục» = Kiểm tra giám sát); mỗi nhóm một màn hình'],
    ['Dữ liệu đã nhập', 'Màn hiện toàn bộ bản ghi của eform, đủ mọi trường, để người nhập đối chiếu'],
    ['Bản ghi cần xem lại', 'Bản ghi có mã ngoài danh mục, số không đọc được hoặc bỏ trống trường chia nhóm'],
    ['Bản ghi mẫu', 'Bản ghi dựng theo khung eform khi chưa có dữ liệu thật (mục 4.6)'],
    ['Kỳ báo cáo', 'Quý. Hiện có 4 kỳ: ' + ', '.join(p['label'] for p in reversed(P))],
], [3.5, 12.5], size=11)
heading('1.4. Tài liệu liên quan', 2)
table([
    ['Tài liệu', 'Nội dung dùng ở đây'],
    ['File mô tả đầu vào eform, sheet "Xã/Phường" (' + SHEET_URL + ')', f'Nguồn duy nhất của {len(U)} eform: tên trường, mã, kiểu nhập, danh mục'],
    ['docs/CHUNG/QUY_UOC_XU_LY_EFORM_2026_10_13', 'Quy ước xử lý dữ liệu eform của các sở (không thêm trường; bản tháng và bản quý không cộng chồng)'],
    ['docs/CHUNG/QUY_TAC_HIEN_THI_CHI_TIEU_2026_10_12', 'Quy tắc hiển thị H1–H22: định dạng số, mốc so sánh, không hiện mã kỹ thuật'],
], [7.5, 8.5], size=10.5)
heading('1.5. Quy ước mã yêu cầu', 2)
bullets(['**FR-nn**: yêu cầu chức năng (mục 3).', '**DR-nn**: yêu cầu dữ liệu (mục 4).', '**BR-nn**: quy tắc nghiệp vụ (mục 4).',
         '**NFR-nn**: yêu cầu phi chức năng (mục 6).', '**TC-nn**: kịch bản nghiệm thu (mục 8).',
         'Mức ưu tiên: **Bắt buộc** (phải có để nghiệm thu), **Nên có**, **Tùy chọn**. Yêu cầu không ghi mức là Bắt buộc.'])

# ======================================================= 2. MÔ TẢ TỔNG QUAN
heading('2. MÔ TẢ TỔNG QUAN', 1)
heading('2.1. Bối cảnh', 2)
para(f'Từ 01/7/2025 Hà Nội vận hành chính quyền địa phương hai cấp với {TOT["nP"] + TOT["nX"]} xã, phường. Số liệu của xã, phường được nhập qua '
     f'{len(U)} eform. Ở bản 1.0, màn hình chỉ tiêu xã được dựng trước theo phòng ban, số giả lập, không bám eform; khi các sở làm theo eform, '
     'màn hình lại không hiện hết các trường nên người nhập không biết số đẩy lên IOC có đúng không. Bản 2.0 dựng lại toàn bộ theo eform để khắc phục cả hai điểm.')
rows = [['Trục', 'Eform (đơn vị trên IOC)', 'Số trường', 'Số nhóm', 'Số ô số']]
for r in ROLES:
    us = [u for u in U if u['role'] == r]
    rows.append([ROLE[r], [u['efName'] for u in us], str(sum(len(EF[u['ef']]['fields']) for u in us)), str(sum(len(u['groups']) for u in us)), str(sum(len(u['kpis']) for u in us))])
rows.append(['**Cộng**', f'**{len(U)} eform**', f'**{N_FIELD}**', f'**{N_GROUP}**', f'**{N_KPI}**'])
note('Bảng 2.1. Eform của một xã, phường')
table(rows, [2.6, 7.6, 1.9, 1.9, 2.0], size=10.5)
heading('2.2. Chức năng chính', 2)
bullets([
    'Xem số then chốt của cả 4 trục (8 ô số) và lọc danh sách eform theo trục.',
    'Xem phần Tổng hợp của từng eform: bản ghi gom theo danh mục của chính eform, cộng dồn cùng trường số, so với quý trước.',
    '**Xem Dữ liệu đã nhập**: mọi bản ghi, đủ mọi trường, đúng tên trường như eform; bản ghi cần xem lại được tô màu kèm lý do.',
    '**Lần lại**: bấm bất kỳ số nào ở phần Tổng hợp hoặc ô số để mở đúng các bản ghi tạo ra số đó.',
    'Chọn kỳ báo cáo; xuất Excel (số tổng hợp và toàn bộ bản ghi).',
    'Đối chiếu khung eform trên IOC với sheet eform; báo trường eform thêm, bớt, đổi và lỗi trong file eform.',
])
heading('2.3. Người dùng và quyền xem', 2)
table([
    ['Người dùng', 'Cách vào', 'Được xem', 'Không được xem'],
    ['Tài khoản xã, phường', 'Chọn xã, phường trên cây tổ chức ở màn đăng nhập',
     ['Tab "Tất cả" và 4 tab trục của xã mình', f'Cả {len(U)} eform, mở popup từng eform, Dữ liệu đã nhập'], 'Bản ghi, số của xã, phường khác'],
    ['Tài khoản phòng, ban trong xã', 'Chọn một eform dưới xã, phường trên cây tổ chức',
     ['Băng tổng quan của đúng eform đó', 'Popup chi tiết, Dữ liệu đã nhập của eform đó'], 'Eform khác trong xã; xã, phường khác'],
    ['Người dùng cấp Thành phố', 'Đăng nhập tài khoản trục, chọn một xã, phường ở "Xem theo cơ cấu tổ chức"',
     ['Như tài khoản xã, phường đó', 'Quay lại phạm vi tài khoản gốc bất cứ lúc nào'], 'Không đổi định danh tài khoản; thao tác được ghi nhật ký'],
], [3.0, 4.6, 4.6, 3.8], size=10.5)
heading('2.4. Ràng buộc thiết kế', 2)
bullets([
    '**Chỉ dùng trường có trong eform** (BR-01). Không đặt tên chỉ tiêu, không tính tỷ lệ, bình quân, xếp hạng, không lấy số từ nguồn khác.',
    '**Mọi trường của eform đều xem được trên IOC** ở màn Dữ liệu đã nhập, tên cột đúng như eform (kể cả tên đang gõ sai trong file, để đối chiếu).',
    'Khung eform sinh tự động từ sheet, không sửa tay; eform đổi thì chạy lại công cụ (FR-15).',
    'Dùng chung bộ khung chỉ tiêu với cấp Thành phố: mỗi eform chỉ khai báo cách gom (trường chia nhóm, trường mô tả, trường số, ô số); phần dựng màn hình là chung.',
    'Giao diện không hiện mã kỹ thuật (mã trường, mã danh mục), trừ ô có mã ngoài danh mục — hiện nguyên mã đã nhập để người nhập thấy lỗi.',
    'Tài khoản xã, phường chỉ thấy số của chính mình — không có màn so với 126 xã, phường (chốt 27/10/2026).',
    'Tên gọi theo đúng loại đơn vị hành chính: "phường" với phường, "xã" với xã.',
])
heading('2.5. Giả định và phụ thuộc', 2)
bullets([
    '**Chưa có dữ liệu thật**: API xã, phường đang ghi "Chưa cung cấp" (sheet "API cần IOC cung cấp"). Màn hình chạy bằng bản ghi mẫu dựng đúng khung eform (mục 4.6) và ghi rõ trên màn hình.',
    'Khi có API, chỉ thay nguồn bản ghi (DR-03); màn hình không đổi.',
    'Danh mục 126 xã, phường dùng chung với đăng nhập và các eform của sở.',
    'Xuất Excel cần thư viện ExcelJS đã tải trên trang.',
    'Môi trường trình diễn: phân quyền làm ở trình duyệt. Khi vận hành thật, máy chủ phải lọc bản ghi theo tài khoản (NFR-03).',
])

# ======================================================= 3. YÊU CẦU CHỨC NĂNG
heading('3. YÊU CẦU CHỨC NĂNG', 1)
para('Mỗi yêu cầu ghi mục đích, tác nhân, cách kích hoạt, xử lý, kết quả và tiêu chí chấp nhận.')


def fr(code, title, rows, ac, prio='Bắt buộc'):
    heading(f'{code}. {title}', 2)
    table([['Mức ưu tiên', prio]] + rows, [3.2, 12.8], header=False, key_col=True, size=10.5)
    para('**Tiêu chí chấp nhận:**', after=2)
    bullets(ac, 11.5)


OV = {o['id']: o for o in D['overviews']}
UB = {u['id']: u for u in U}
fr('FR-01', 'Xác định phạm vi xã, phường khi vào hệ thống', [
    ['Mục đích', 'Mọi số và bản ghi trên màn chỉ tiêu là của đúng một xã, phường mà người dùng được phép xem.'],
    ['Tác nhân', 'Tài khoản xã, phường; tài khoản phòng, ban trong xã; người dùng cấp Thành phố xem theo cơ cấu tổ chức.'],
    ['Kích hoạt', 'Đăng nhập, hoặc chọn một xã, phường / một eform trong xã ở "Xem theo cơ cấu tổ chức".'],
    ['Xử lý', ['Ghi nhận xã, phường đang xem theo số thứ tự trong danh mục 126 xã, phường; ghi nhận eform (nếu là tài khoản phòng, ban).',
             'Tài khoản xã, phường: mở mặc định tab "Tất cả".', 'Ghi nhật ký đăng nhập / nhật ký xem thay.']],
    ['Kết quả', 'Trang chính hiện phần "Nhóm chỉ tiêu theo lĩnh vực" của xã, phường; tiêu đề màn ngoài ghi "Tổng quan · <tên xã, phường>".'],
], ['Đăng nhập Phường Việt Hưng: tiêu đề "Tổng quan · Phường Việt Hưng", mọi bản ghi là của Việt Hưng.',
    'Người dùng cấp Thành phố quay lại phạm vi gốc thì màn chỉ tiêu trở về cấp Thành phố.'])

ova = OV['xa-4truc']
fr('FR-02', 'Màn ngoài — tab "Tất cả" (4 trục)', [
    ['Mục đích', 'Cho lãnh đạo xã, phường thấy nhanh số then chốt của cả 4 trục.'],
    ['Kích hoạt', 'Mở trang chính (mặc định) hoặc bấm tab "Tất cả".'],
    ['Xử lý', ['Dải đầu: "Tổng quan · <tên>", tiêu đề "Số liệu then chốt của 4 trục, 12 eform", dòng gợi ý "Số liệu lấy từ 12 eform của <tên> (đang là bản ghi mẫu) · bấm ô để mở chi tiết".',
             '8 ô số then chốt (Bảng 3.1); mỗi ô ghi eform cung cấp và kỳ; bấm ô mở màn Dữ liệu đã nhập của eform đó, lọc đúng các bản ghi tạo ra số.',
             f'4 thẻ trục: số eform, số ô số, dòng số đầu của từng eform; bấm để lọc lưới, bấm lần nữa bỏ lọc; nút "Tất cả {len(U)} eform".',
             'Lưới thẻ eform: nhãn trục, số ô số, tên, 3 dòng số (mục 5, "Dòng số trên thẻ ngoài"), kỳ; bấm thẻ mở popup màn Tổng quan.']],
    ['Kết quả', f'Màn ngoài có 8 ô số, 4 thẻ trục và {len(U)} thẻ eform.'],
], [f'Phường Việt Hưng: 8 ô số đều có số, 4 thẻ trục, {len(U)} thẻ eform; không lỗi JavaScript.',
    'Số trên ô số, thẻ ngoài bằng đúng số cùng chỉ tiêu, cùng kỳ ở popup (BR-09).',
    'Bấm thẻ trục UBND: lưới còn 9 thẻ; bấm lại: về 12 thẻ.'])
note('Bảng 3.1. Tám ô số then chốt của tab "Tất cả"')
table([['#', 'Ô số', 'Eform', 'Bấm mở']] + [[str(i + 1), x['l'] + (' (' + x['u'] + ')' if x['u'] else ''), UB[x['cat']]['efName'],
       'Dữ liệu đã nhập' + (', lọc bản ghi tạo ra số' if ':' in x['target'] else '')] for i, x in enumerate(ova['kpis'])], [0.8, 6.4, 4.4, 4.4], size=10.5)
rows = [['Tab', 'Ô số then chốt (eform · ô số)']]
for r in ROLES:
    rows.append([ROLE[r], [f'{UB[x["cat"]]["efName"]} · {x["l"]}' for x in OV['xa-' + r]['kpis']]])
fr('FR-03', 'Màn ngoài — tab từng trục', [
    ['Mục đích', 'Xem riêng các eform của một trục.'],
    ['Kích hoạt', 'Bấm tab Đảng ủy, HĐND, UBND hoặc Ủy ban MTTQ.'],
    ['Xử lý', ['Dải đầu như FR-02, thêm tên trục; các ô số then chốt của trục (Bảng 3.2); lưới thẻ eform của trục.']],
    ['Kết quả', 'Đảng ủy 1 thẻ, HĐND 1 thẻ, UBND 9 thẻ, Ủy ban MTTQ 1 thẻ.'],
], ['Mỗi tab trục có đúng các ô số theo Bảng 3.2, mọi ô có số.'])
note('Bảng 3.2. Ô số của từng tab trục')
table(rows, [2.6, 13.4], size=10)

fr('FR-04', 'Băng tổng quan cho tài khoản phòng, ban', [
    ['Mục đích', 'Tài khoản chỉ có một eform thì vào thẳng số của eform đó.'],
    ['Xử lý', ['Thay lưới bằng một băng rộng: "Tổng quan · <tên eform>", nút "Xem tổng quan đầy đủ ›".',
             'Các ô số của eform; thẻ Dữ liệu đã nhập; các thẻ nhóm. Bấm mở đúng màn.']],
], ['Tài khoản Hành chính công của Phường Việt Hưng: băng có 8 ô số, thẻ Dữ liệu đã nhập và 4 thẻ nhóm.'])

fr('FR-05', 'Popup chi tiết — màn Tổng quan', [
    ['Mục đích', 'Trình bày số chính của một eform và lối vào bản ghi.'],
    ['Kích hoạt', 'Bấm thẻ eform, hoặc "Xem tổng quan đầy đủ ›" ở băng.'],
    ['Xử lý', ['Tiêu đề: tên đơn vị (đổi "phường"/"xã" theo FR-12); dòng phụ: "Eform «<tên eform>» · <cơ quan> <tên xã, phường> · N chỉ tiêu chính · M nhóm · <kỳ>".',
             'Thanh công cụ: chọn "Kỳ báo cáo", nút "Nhập chỉ tiêu" (mở hệ thống nhập), nút "Xuất Excel".',
             'Hàng ô số (4–8 ô) theo BR-07: tên, số, dòng phụ "<đơn vị> · bấm xem bản ghi" hoặc "dòng số liệu đã nhập", mũi tên so quý trước.',
             'Thẻ **Dữ liệu đã nhập** đứng đầu: số bản ghi của kỳ, số trường của eform ("hiện đủ"), số bản ghi cần xem lại.',
             'Các thẻ nhóm: tên nhóm, số dòng số liệu, tối đa 4 dòng đầu (tên, số, mũi tên).',
             'Khung "Cách đọc": số lấy từ eform nào, nhóm theo trường nào, dòng số liệu gộp theo trường nào; không tính thêm chỉ tiêu ngoài eform.']],
], ['Ô số, nhóm của mỗi eform đúng như mục 5.', 'Không có thẻ "So với 126 xã, phường".', 'Không hiện mã kỹ thuật.'])

fr('FR-06', 'Popup chi tiết — màn nhóm', [
    ['Mục đích', 'Xem các dòng số liệu của một nhóm.'],
    ['Kích hoạt', 'Bấm thẻ nhóm hoặc ô số chia theo nhóm.'],
    ['Xử lý', ['Tiêu đề "<đơn vị> — <nhóm>", dòng phụ "Nhóm i/N · <kỳ>"; liên kết "← Tổng quan"; dòng "<eform> · <trường nhóm>: <nhóm> · k dòng số liệu, <kỳ>".',
             'Bố cục nhiều cấp như 4 trục, các sở: **thẻ so sánh quý này – quý trước** (tối đa 4 dòng số liệu đầu có số, cùng đơn vị; dòng tỷ lệ (%) vẽ thành thẻ tỷ lệ) và **biểu đồ qua các quý** của dòng đầu có số đổi giữa các quý (mọi quý bằng nhau thì không vẽ).',
             'Nhóm có hơn 4 dòng cùng đơn vị: thêm **biểu đồ thanh** «<trường số> theo dòng số liệu», sắp từ lớn đến nhỏ, tối đa 10 thanh; bấm thanh mở Dữ liệu đã nhập lọc đúng các bản ghi đó.',
             'Trường số vẽ biểu đồ: trường số đầu của eform; Kinh tế xã hội dùng «Ước thực hiện đến nay» (không vẽ số kế hoạch, Thành phố giao).',
             'Dưới biểu đồ là **bảng số liệu**: mỗi dòng số liệu một hàng. Cột mô tả theo thứ tự trường của eform, **chỉ hiện cột có ít nhất một dòng ghi**; cột «Đơn vị tính»; cột ghi kèm. Bảng dài hiện 12 dòng đầu, nút "Xem đủ n dòng ›" / "Thu gọn về 12 dòng".',
             'Eform có một trường số: cột "<trường> · kỳ này", "kỳ trước", "Thay đổi". Eform nhiều trường số: mỗi trường một cột (kỳ này).',
             'Cột "Bản ghi": số bản ghi gộp vào dòng. Bấm chữ ở cột đầu mở Dữ liệu đã nhập lọc đúng các bản ghi đó (FR-08).',
             'Quý đang xem chưa có bản ghi của nhóm: thẻ "Quý này chưa có bản ghi" ghi rõ, kèm quý gần nhất có bản ghi và nút "Xem <quý> ›" (không vẽ thẻ rỗng).',
             'Dòng điều hướng "‹ nhóm trước", "Tổng quan", "nhóm sau ›".']],
], ['GPMB nhóm "DỰ ÁN ĐANG TRIỂN KHAI": mỗi dự án, khu vực con một hàng, đủ 13 cột số.',
    'Ô tỷ lệ (%) gộp từ nhiều bản ghi để trống và có ghi chú (BR-03).'])

fr('FR-07', 'Dữ liệu đã nhập', [
    ['Mục đích', 'Người nhập eform đối chiếu được từng ô đã nhập với số trên IOC.'],
    ['Tác nhân', 'Mọi người dùng xem được eform; chủ yếu cán bộ nhập liệu.'],
    ['Kích hoạt', 'Thẻ hoặc liên kết "Dữ liệu đã nhập ›" ở màn Tổng quan; bấm ô số; bấm tên dòng ở màn nhóm.'],
    ['Xử lý', ['Khung ghi chú: "Toàn bộ bản ghi <xã> đã nhập vào eform «<tên>», <kỳ>: N bản ghi, đủ M trường…"; có câu "Đang là bản ghi mẫu…" khi chưa có dữ liệu thật; nêu số bản ghi thiếu năm, kỳ (chưa xếp được vào quý).',
             '4 ô đếm: bản ghi của kỳ, số trường của eform, bản ghi cần xem lại, bản ghi mọi quý.',
             'Nút lọc: "Tất cả", từng nhóm có bản ghi (kèm số), "Cần xem lại" (khi có). Ô tìm chữ trong bất kỳ ô nào, không phân biệt dấu.',
             '**Bảng: cột STT rồi đủ mọi trường của eform đúng thứ tự, tên cột đúng như eform**; rê chuột tên cột hiện kiểu nhập. Hàng tiêu đề đứng yên, bảng cuộn ngang.',
             'Ô Danh mục hiện tên hiển thị; ô Số theo định dạng Việt Nam, giữ số lẻ đã nhập; ô Ngày tháng dạng dd/mm/yyyy; ô trống hiện "—".',
             'Ô cần xem lại (BR-05) tô màu cảnh báo, rê chuột hiện lý do; ô mã ngoài danh mục hiện nguyên mã đã nhập; STT của bản ghi đó tô màu.']],
    ['Kết quả', 'Người nhập thấy đúng từng bản ghi đã gửi lên IOC.'],
], ['Mỗi eform: số cột = số trường + 1, tên và thứ tự cột trùng khung eform (kiểm tự động, NFR-06).',
    'Bản ghi có mã ngoài danh mục, số "mười", bỏ trống trường chia nhóm: vẫn hiện, ô lỗi tô màu, lọc "Cần xem lại" ra đúng các bản ghi đó.',
    'Tìm "doan vien" ra bản ghi "Đoàn viên".'])

fr('FR-08', 'Lần lại từ số đến bản ghi', [
    ['Mục đích', 'Mọi số ở phần Tổng hợp lần lại được bản ghi tạo ra nó.'],
    ['Xử lý', ['Bấm ô số cộng theo điều kiện: mở Dữ liệu đã nhập, chỉ hiện các bản ghi khớp điều kiện của ô số.',
             'Bấm tên dòng số liệu ở màn nhóm: chỉ hiện các bản ghi gộp vào dòng đó.',
             'Đầu bảng ghi "Đang xem các bản ghi tạo ra số «…» · Bỏ lọc".']],
], ['Bấm ô "Diện tích đã thu hồi" của GPMB Phường Việt Hưng: hiện 4 bản ghi dòng Dự án (không gồm khu vực con), cộng trường «Diện tích đã thu hồi(m^2)» bằng số trên ô.'])

fr('FR-09', 'Chọn kỳ báo cáo', [
    ['Xử lý', ['Danh sách chọn 4 quý, mới nhất trước: ' + ', '.join(p['label'] for p in P) + '.',
             'Mặc định kỳ mới nhất khi mở một eform lần đầu; giữ kỳ khi chuyển màn trong cùng eform; đổi kỳ thì dựng lại mọi số, bảng, bản ghi.']],
], ['Chọn Quý 3/2025: mọi mũi tên ghi "Chưa có số quý trước"; Dữ liệu đã nhập chỉ hiện bản ghi Quý 3/2025.'])

fr('FR-10', 'So sánh với quý trước', [
    ['Xử lý', ['Mọi số so với **quý liền trước** (chưa có số cùng kỳ năm trước vì đơn vị hành chính mới từ 01/7/2025).',
             'Số đếm, tiền: % thay đổi; tỷ lệ: chênh điểm %. Bằng nhau: "Không đổi". Không có số quý trước: "Chưa có số quý trước".',
             '**Màu trung tính** cho mọi mũi tên: eform không quy định tăng là tốt hay xấu, IOC không tự đánh giá.']],
], ['Không có mũi tên xanh/đỏ ở phần chỉ tiêu xã, phường.'])

fr('FR-11', 'Xuất Excel', [
    ['Xử lý', ['Tệp .xlsx 2 trang: "Chỉ tiêu" (ô số, dòng thẻ nhóm: kỳ này, kỳ trước, thay đổi, đơn vị) và "Dữ liệu đã nhập" (STT + đủ mọi trường của eform, mọi bản ghi của kỳ; ô Số giữ dạng số).',
             'Không có trang theo xã, phường khác.', 'Thư viện chưa tải xong: báo "Thư viện xuất Excel chưa tải xong, thử lại sau giây lát."']],
    ['Kết quả', 'Tệp chi-tieu-<mã đơn vị>-<mã kỳ>.xlsx.'],
], ['Trang "Dữ liệu đã nhập" có đủ cột, đủ bản ghi như màn hình.'], 'Nên có')

fr('FR-12', 'Gọi tên phường / xã theo loại đơn vị', [
    ['Xử lý', ['Tên đơn vị khai báo với chữ "phường"; khi xem một xã đổi "phường" → "xã" trên tên, tên trục, dòng phụ, thẻ ngoài.',
             'Chữ trong bản ghi (VD «Địa bàn») hiện đúng như đã nhập, không đổi.']],
], ['Xã Ba Vì: thẻ "Đảng ủy xã", dòng phụ "… Đảng ủy xã Ba Vì".'])

fr('FR-13', 'Không so sánh với xã, phường khác', [
    ['Xử lý', ['Không có màn, thẻ, liên kết "So với 126 xã, phường" ở cấp xã; không đưa bản ghi xã khác về màn hình.']],
], ['Tài khoản bất kỳ xã nào không thấy số, bản ghi của xã khác.'])

fr('FR-14', 'Điều hướng và đóng popup', [
    ['Xử lý', ['Esc: đóng danh sách chọn đang mở; nếu không có thì đóng popup.', 'Mở lại cùng eform: giữ kỳ; mở eform khác: về kỳ mới nhất, bỏ mọi bộ lọc của Dữ liệu đã nhập.',
               'Nút ← ở góc trên bên trái quay lại đúng màn trước (nhóm đang xem, bộ lọc của Dữ liệu đã nhập) và ghi tên màn đó; màn trước không phải Tổng quan thì có thêm lối "Tổng quan". Về Tổng quan hoặc mở eform khác thì xóa lịch sử.']],
], ['Esc đóng popup, không để lại lớp phủ.', 'Từ màn nhóm bấm tên dòng sang Dữ liệu đã nhập, bấm ← về đúng màn nhóm đó.'], 'Nên có')

fr('FR-15', 'Đối chiếu khung eform với sheet eform', [
    ['Mục đích', 'Eform thêm, bớt, đổi trường thì biết ngay màn hình chưa theo kịp.'],
    ['Tác nhân', 'Nhóm phát triển, nhóm làm eform.'],
    ['Xử lý', ['Tải sheet về .xlsx; chạy "python3 tools/xa_eform_schema.py <tệp.xlsx> --check".',
             'Báo: trường eform THÊM (màn hình chưa có), BỎ, đổi tên/kiểu/danh mục; liệt kê lỗi trong file eform (Phụ lục B). Có khác biệt thì trả mã lỗi để chặn phát hành.',
             'Chạy không có "--check": ghi lại js/core/xa-eform.js theo sheet.']],
], [f'Với sheet ngày 28/10/2026: "Khớp: {len(U)} eform, {N_FIELD} trường.", kèm danh sách lỗi trong file eform (gộp lại ở Phụ lục B).'])

# ======================================================= 4. DỮ LIỆU, QUY TẮC
heading('4. YÊU CẦU DỮ LIỆU VÀ QUY TẮC NGHIỆP VỤ', 1)
heading('4.1. DR-01. Danh mục 126 xã, phường', 2)
para(f'Tên, loại, diện tích, dân số là số thật theo phương án sắp xếp đơn vị hành chính cấp xã năm 2025 (tổng {n(TOT["pop"])} người, {n(TOT["dt"], 2)} km²). '
     'Tên khớp danh mục dùng ở đăng nhập và các eform. Dân số chỉ dùng để dựng bản ghi mẫu, không hiện thành chỉ tiêu. Danh sách ở Phụ lục A.')
heading('4.2. DR-02. Khung eform', 2)
bullets([
    f'Tệp js/core/xa-eform.js (tự sinh, không sửa tay): {len(U)} eform, {N_FIELD} trường, đúng thứ tự trong sheet; mỗi trường có tên, mã, kiểu nhập, dữ liệu mẫu, danh mục (mã, tên hiển thị), số dòng trong sheet.',
    '**Chuẩn hóa mã**: bỏ ký tự ẩn (zero-width, BOM), bỏ dấu, đ → d. Mã gốc khác mã chuẩn được giữ lại để đối chiếu. Bản ghi đọc vào cũng chuẩn hóa mã trường, mã danh mục theo cùng cách (BR-06).',
    'Mã danh mục để trống tên hiển thị: dùng tên của cùng mã ở eform khác (VD «Kỳ báo cáo», «Quý» của Văn hóa, Nội vụ, Kinh tế xã hội).',
])
heading('4.3. DR-03. Nguồn bản ghi', 2)
bullets([
    'Màn hình lấy bản ghi qua một hàm nguồn: (mã eform, xã, phường) → danh sách bản ghi, mỗi bản ghi là { mã trường: giá trị }. Hiện là bản ghi mẫu (js/core/xa-eform-mau.js).',
    'Khi có API (dự kiến khối "xa_phuong/<mã xã>/<khối>", lớp dữ liệu chi tiết): thay hàm nguồn, gọi hàm làm mới để tính lại; không sửa màn hình.',
    'Số dạng chữ kiểu Việt Nam ("1.234", "1.234,5") đọc thành số. Giá trị không đọc được giữ nguyên để hiện và đánh dấu (BR-05).',
])
heading('4.4. DR-04. Kỳ báo cáo và xếp kỳ', 2)
table([
    ['«Kỳ báo cáo» của bản ghi', 'Xếp vào quý'],
    ['Quý', '«Năm» + «Quý» (Quý I–IV)'],
    ['Tháng', 'Quý chứa «Tháng» của «Năm»'],
    ['Năm', 'Quý 4 của «Năm»'],
    ['Thiếu năm hoặc kỳ', 'Không xếp được; đếm và nêu ở Dữ liệu đã nhập, không vào Tổng hợp'],
], [5.5, 10.5], size=10.5)
heading('4.5. Quy tắc nghiệp vụ', 2)
table([
    ['Mã', 'Quy tắc'],
    ['BR-01', '**Chỉ trường của eform.** Mọi số trên màn hình là giá trị của một trường Số, hoặc cộng giá trị của cùng một trường Số, hoặc số dòng đã nhập. Không có chỉ tiêu nào khác.'],
    ['BR-02', '**Dòng số liệu**: các bản ghi cùng kỳ giống nhau ở trường chia nhóm, mọi trường mô tả và «Đơn vị tính» (nếu eform có) gộp làm một dòng. Trường mô tả của từng eform ở mục 5.'],
    ['BR-03', '**Cộng dồn**: giá trị một dòng = tổng cùng trường Số của các bản ghi trong dòng. Trường tỷ lệ (tên có "%") **không cộng**: một bản ghi thì hiện giá trị đó, nhiều bản ghi thì để trống.'],
    ['BR-04', '**Bản tháng và bản quý không cộng chồng**: một dòng có cả bản ghi kỳ Quý và kỳ Tháng thì chỉ lấy bản Quý.'],
    ['BR-05', '**Bản ghi cần xem lại**: (a) ô Danh mục có mã không có trong danh mục của trường; (b) ô Số không đọc được thành số; (c) ô Ngày tháng không đọc được; (d) bỏ trống trường chia nhóm. Bản ghi vẫn hiện đủ ở Dữ liệu đã nhập; (a) ở trường chia nhóm hoặc (d) thì không vào Tổng hợp.'],
    ['BR-06', '**Mã có dấu, ký tự ẩn** (VD "hạn_xử_lý", "chitieuh​oi") được chuẩn hóa trước khi so với danh mục nên vẫn đọc đúng tên hiển thị.'],
    ['BR-07', '**Ô số chính**: eform có chỉ tiêu là danh mục cố định (Hành chính công, Tài chính - Ngân sách, Quản lý văn bản, GPMB, MTTQ): ô số = cộng một trường Số của các bản ghi khớp điều kiện danh mục (mục 5). Eform còn lại: ô số là số dòng số liệu đã nhập của cả eform và từng nhóm.'],
    ['BR-08', '**So quý trước, màu trung tính** (FR-10).'],
    ['BR-09', 'Màn ngoài, băng tổng quan, popup, Excel dùng chung một nguồn số: cùng ô số, cùng kỳ thì cùng số.'],
    ['BR-10', 'Định dạng số kiểu Việt Nam: dấu chấm hàng nghìn, dấu phẩy thập phân; tỷ lệ 1 số lẻ; ô Số ở Dữ liệu đã nhập giữ số lẻ đã nhập (tối đa 3); đơn vị lấy từ tên trường ("(m^2)" → m², "(đồng)", "(VND)" → đồng, "(%)") hoặc «Đơn vị tính» của bản ghi.'],
], [1.6, 14.4], size=10.5)
heading('4.6. Bản ghi mẫu (khi chưa có dữ liệu thật)', 2)
bullets([
    'Mỗi bản ghi chỉ có các trường của eform; ô Danh mục chỉ nhận mã có trong danh mục của chính trường đó.',
    'Không đặt tên chỉ tiêu mới: ô "Tên chỉ tiêu" kiểu Chữ chép tên hiển thị của một danh mục trong cùng bản ghi; ô Chữ mô tả khác (ghi chú, người nhập, nguồn…) để trống.',
    'Nhóm được ghép với giá trị cùng nghĩa (VD nhóm "Kỳ họp HĐND" với đối tượng "Kỳ họp HĐND xã").',
    'Số theo quy mô dân số thật của xã, phường, cố định theo tên (mở lần nào cũng ra cùng số); kỳ báo cáo là quý, 4 quý.',
    'Màn hình ghi rõ "Đang là bản ghi mẫu dựng theo khung eform, chưa nối dữ liệu thật".',
])

# ======================================================= 5. DANH MỤC 12 EFORM
heading('5. DANH MỤC 12 EFORM', 1)
para(f'Phần này sinh tự động từ cấu hình đang chạy. Số mẫu là kỳ {P[0]["label"]} của {SAMPLE} và {SAMPLE2} (bản ghi mẫu) để đối chiếu khi kiểm thử. '
     'Bảng "Trường của eform" liệt kê **đủ mọi trường** và vai trò của từng trường ở phần Tổng hợp; **mọi trường đều hiện ở màn Dữ liệu đã nhập** (FR-07).')
rows = [['#', 'Trục', 'Eform', 'Đơn vị trên IOC', 'Trường', 'Nhóm', 'Ô số', f'Bản ghi {P[0]["label"]} (P. Việt Hưng)']]
for i, u in enumerate(U):
    rows.append([str(i + 1), ROLE[u['role']], u['efName'], u['name'], str(len(EF[u['ef']]['fields'])), str(len(u['groups'])), str(len(u['kpis'])), str(u['samples'][0]['recs'])])
note(f'Bảng 5.0. {len(U)} eform của một xã, phường')
table(rows, [0.8, 2.0, 3.4, 3.6, 1.4, 1.3, 1.2, 2.3], size=10)

for i, u in enumerate(U):
    ef, s1, s2 = EF[u['ef']], u['samples'][0], u['samples'][1]
    k.page_break()
    heading(f'5.{i + 1}. {u["name"]} — eform «{ef["ten"]}»', 2)
    para(f'Trục **{ROLE[u["role"]]}** · sheet "Xã/Phường" từ dòng {ef["dong"]} · {len(ef["fields"])} trường, {len(u["groups"])} nhóm, {len(u["kpis"])} ô số.')
    table([
        ['Chia nhóm theo', fl(u, u['nhom']) + f' — {len(u["groups"])} nhóm: ' + ', '.join(g['label'] for g in u['groups'])],
        ['Dòng số liệu gộp theo', ', '.join(fl(u, c) for c in u['key']) + (' và ' + fl(u, u['dvt']) if u['dvt'] else '')],
        ['Trường số', ', '.join(fl(u, c) for c in u['so'])],
        ['Ghi kèm dòng', ', '.join(fl(u, c) for c in u['info']) if u['info'] else '—'],
        ['Dòng số trên thẻ ngoài', '; '.join(u['card'])],
        [f'Số mẫu {P[0]["label"]}', f'{SAMPLE}: {s1["recs"]} bản ghi, {s1["rows"]} dòng số liệu · {SAMPLE2}: {s2["recs"]} bản ghi, {s2["rows"]} dòng số liệu'],
    ], [4.0, 12.0], header=False, key_col=True, size=10)
    note('Ô số của màn Tổng quan')
    krow = []
    for j, x in enumerate(u['kpis']):
        how = (f'Cộng {fl(u, x["so"])} của các bản ghi có ' + where_text(u, x['where'])) if x['kind'] == 'sum' else \
              'Số dòng số liệu đã nhập của cả eform' if x['kind'] == 'rows' else f'Số dòng số liệu của nhóm «{x["l"]}»'
        krow.append([str(j + 1), x['l'] + (f' ({x["u"]})' if x['u'] else ''), how, num(s1['kpis'][j]), num(s2['kpis'][j])])
    table([['#', 'Ô số', 'Cách có số', SAMPLE.replace('Phường ', 'P. '), SAMPLE2.replace('Xã ', 'X. ')]] + krow, [0.7, 4.3, 7.4, 1.8, 1.8], size=9.5)
    note('Trường của eform (đúng thứ tự trong sheet)')
    table([['#', 'Tên trường', 'Mã', 'Kiểu', 'Danh mục', 'Vai trò ở phần Tổng hợp']] +
          [[str(j + 1), f['l'], f['c'] + (' (gốc có dấu/ký tự ẩn)' if f['goc'] else ''), KIEU[f['t']], dm_text(f), role_of(u, f)] for j, f in enumerate(ef['fields'])],
          [0.7, 3.4, 3.0, 1.6, 4.0, 3.3], size=8.5)

# ======================================================= 6. PHI CHỨC NĂNG
k.page_break()
heading('6. YÊU CẦU PHI CHỨC NĂNG', 1)
table([
    ['Mã', 'Yêu cầu', 'Cách kiểm'],
    ['NFR-01 Hiệu năng', 'Mở popup, đổi kỳ, chuyển màn, lọc bản ghi dưới 1 giây. Bản ghi của một eform, một xã đọc một lần rồi dùng lại; dòng số liệu của một kỳ tính một lần.', 'Đo trên trình duyệt'],
    ['NFR-02 Co giãn màn hình', 'Màn hình rộng, máy tính, máy tính bảng, điện thoại 390px: không tràn ngang trang; bảng Dữ liệu đã nhập cuộn ngang trong khung, popup giữ đúng bề rộng màn hình.', 'Chụp ảnh ở 390px, 1366px, 1440px'],
    ['NFR-03 Bảo mật, phân quyền', 'Người dùng chỉ nhận bản ghi của xã, phường (và eform) được phép. Khi có API, máy chủ lọc theo tài khoản; không gửi bản ghi xã khác về trình duyệt.', 'Đăng nhập xã A, kiểm dữ liệu nhận được'],
    ['NFR-04 Bám eform', f'Màn Dữ liệu đã nhập hiện đủ {N_FIELD} trường của {len(U)} eform; không có chỉ tiêu ngoài eform; khung eform khớp sheet (FR-15).', 'Kiểm thử tự động + công cụ --check'],
    ['NFR-05 Dễ bảo trì', 'Eform đổi trường: chạy lại công cụ sinh khung; đổi cách gom: sửa khai báo của eform (trường nhóm, mô tả, số, ô số), không sửa phần dựng màn hình.', 'Rà soát mã khi sửa'],
    ['NFR-06 Kiểm thử tự động', 'tests/ctm: ' + ', '.join(f'{k_} {n(v)} phép kiểm' for k_, v in TESTS.items()) + f' (chạy {NGAY}, 0 lỗi). xa-eform.test.js kiểm: bản ghi chỉ có trường eform, mã trong danh mục; Dữ liệu đã nhập đủ cột đúng tên, thứ tự; mọi số lần lại được bản ghi; cộng dồn, bản tháng/quý, bản ghi lỗi, mã có dấu.', 'node tests/ctm/*.test.js'],
    ['NFR-07 Trình duyệt', 'Microsoft Edge, Google Chrome bản hiện hành; không lỗi JavaScript khi tải trang và mở mọi màn.', 'Mở thử bằng trình duyệt tự động'],
    ['NFR-08 Ngôn ngữ', 'Tiếng Việt có dấu; tên trường, tên danh mục hiện đúng như eform; không hiện mã kỹ thuật (trừ mã sai ở ô cần xem lại).', 'Quét chữ hiển thị'],
    ['NFR-09 Truy vết', 'Ghi nhật ký đăng nhập và "Xem theo cơ cấu tổ chức".', 'Kiểm màn nhật ký'],
    ['NFR-10 Khả dụng', 'Ô số, thẻ, tên dòng bấm được có trạng thái rê chuột; dùng được bằng bàn phím; ô cần xem lại có viền và lý do chữ, không chỉ dựa vào màu.', 'Kiểm bằng bàn phím'],
], [3.2, 9.0, 3.8], size=10)

# ======================================================= 7. CỜ CẤU HÌNH
heading('7. CẤU HÌNH BẬT, TẮT', 1)
Fl = D['flags']
table([
    ['Cờ', 'Giá trị hiện tại', 'Tác dụng'],
    ['CTM_ENABLED (js/features/ctm-engine.js)', str(Fl['CTM_ENABLED']).lower(), 'Bật khuôn chỉ tiêu mới.'],
    ['CTM_OVERVIEW_ENABLED (js/features/ctm-engine.js)', str(Fl['CTM_OVERVIEW_ENABLED']).lower(), 'Bật màn ngoài kiểu mới.'],
    ['CTM_XA_ALL_TAB (js/features/ctm-xa-units.js)', str(Fl['CTM_XA_ALL_TAB']).lower(), 'Tài khoản xã, phường có tab "Tất cả" gộp 4 trục.'],
    ['CTM_XA_SO_SANH (js/features/ctm-xa-units.js)', str(Fl['CTM_XA_SO_SANH']).lower(), 'Màn so với 126 xã, phường ở cấp xã — tắt theo FR-13.'],
    ['XA_EF_LA_MAU (js/core/xa-eform-mau.js)', str(Fl['XA_EF_LA_MAU']).lower(), 'Đang dùng bản ghi mẫu: hiện câu "Đang là bản ghi mẫu…". Đặt false khi nối dữ liệu thật.'],
], [5.6, 2.4, 8.0], size=10)

# ======================================================= 8. NGHIỆM THU
heading('8. KỊCH BẢN NGHIỆM THU', 1)
table([
    ['Mã', 'Kịch bản', 'Kết quả mong đợi', 'Yêu cầu'],
    ['TC-01', 'Đăng nhập Phường Việt Hưng', f'Tab "Tất cả", 8 ô số đều có số, 4 thẻ trục, {len(U)} thẻ eform', 'FR-01, FR-02'],
    ['TC-02', 'Bấm thẻ trục UBND rồi bấm lại', 'Lưới còn 9 thẻ; bấm lại về 12 thẻ', 'FR-02'],
    ['TC-03', 'Mở lần lượt 12 eform, mọi nhóm', 'Mỗi popup có ô số, nhóm như mục 5; mọi màn dựng được, không lỗi', 'FR-05, FR-06'],
    ['TC-04', 'Mở Dữ liệu đã nhập của từng eform', 'Số cột = số trường + 1; tên, thứ tự cột như mục 5; đủ bản ghi của kỳ', 'FR-07, NFR-04'],
    ['TC-05', 'Bấm ô "Diện tích đã thu hồi" (GPMB)', 'Hiện đúng các bản ghi dòng Dự án; cộng trường bằng số trên ô', 'FR-08'],
    ['TC-06', 'Ở màn nhóm, bấm tên một dòng số liệu', 'Hiện đúng số bản ghi ghi ở cột "Bản ghi"', 'FR-06, FR-08'],
    ['TC-07', 'Nạp bản ghi có mã ngoài danh mục, số "mười", bỏ trống nhóm', 'Vẫn hiện; 3 ô tô màu, rê chuột có lý do; lọc "Cần xem lại" ra 3 bản ghi; không vào Tổng hợp', 'FR-07, BR-05'],
    ['TC-08', 'Nạp bản ghi mã "chitieuh​oi" (ký tự ẩn), số "1.234"', 'Đọc thành «Chỉ tiêu công tác Hội», số 1.234', 'BR-06, DR-03'],
    ['TC-09', 'Nạp bản Quý (30) và bản Tháng (9) cùng dòng', 'Dòng ghi 30', 'BR-04'],
    ['TC-10', 'Đổi kỳ Quý 2/2026 → Quý 3/2025', 'Số, bảng, bản ghi đổi theo kỳ; mũi tên "Chưa có số quý trước"', 'FR-09, FR-10'],
    ['TC-11', 'Đăng nhập Xã Ba Vì', 'Tên đơn vị ghi "xã"; số, bản ghi là của Ba Vì', 'FR-12'],
    ['TC-12', 'Xuất Excel eform Hành chính công', 'Tệp có trang "Chỉ tiêu" và "Dữ liệu đã nhập" đủ 15 cột + STT', 'FR-11'],
    ['TC-13', 'Chạy công cụ --check với sheet hiện hành', f'"Khớp: {len(U)} eform, {N_FIELD} trường."', 'FR-15'],
    ['TC-14', 'Điện thoại 390px, popup Dữ liệu đã nhập', 'Không tràn ngang trang; bảng cuộn ngang trong khung', 'NFR-02'],
], [1.4, 4.6, 7.6, 2.4], size=10)

# ======================================================= 9. HẠN CHẾ, VẤN ĐỀ MỞ
heading('9. HẠN CHẾ HIỆN TẠI VÀ VẤN ĐỀ MỞ', 1)
table([
    ['#', 'Vấn đề', 'Hướng xử lý đề xuất'],
    ['1', 'Chưa có dữ liệu thật: API xã, phường chưa cung cấp; màn hình chạy bằng bản ghi mẫu.', 'Khi có API lớp dữ liệu chi tiết theo xã, phường: thay hàm nguồn (DR-03), đặt XA_EF_LA_MAU = false.'],
    ['2', '"Tên chỉ tiêu" là ô Chữ tự do ở nhiều eform (Đảng ủy, HĐND, Tài chính - Ngân sách, Giáo dục, Y tế, Văn hóa, Nội vụ, Kinh tế xã hội): gõ khác nhau một chữ thì tách thành hai dòng số liệu.', 'Đề nghị bên eform chuyển thành danh mục có mã; khi đó có thể đặt ô số theo chỉ tiêu như Hành chính công.'],
    ['3', f'File eform còn {len(ISSUES) + len(ISSUES_TAY)} lỗi (Phụ lục B). Màn hình đã tự đọc được mã có dấu, ký tự ẩn và tên trống, nhưng tên trường sai vẫn hiện đúng như file.', 'Bên eform sửa theo Phụ lục B; chạy lại công cụ sinh khung.'],
    ['4', 'Chưa có số cùng kỳ năm trước đến hết Quý 2/2026.', 'Đang so quý trước; khi có Quý 3/2026 có thể bổ sung so cùng kỳ nếu được yêu cầu.'],
    ['5', 'Trang độc lập chỉ tiêu xã, phường (standalone/xa-phuong-chi-tieu-doc-lap.html) còn theo bản 1.0.', 'Sửa tools/xa-build-doc-lap.js theo 12 eform rồi sinh lại.'],
    ['6', 'Phân quyền đang làm ở trình duyệt (môi trường trình diễn).', 'Lọc bản ghi theo tài khoản ở máy chủ (NFR-03).'],
    ['7', 'Lớp Dữ liệu đã nhập mới có ở cấp xã, phường; các sở chưa có.', 'Áp cùng màn cho các sở (cùng yêu cầu: người nhập phải đối chiếu được).'],
], [0.8, 7.6, 7.6], size=10)

# ======================================================= PHỤ LỤC
k.page_break()
heading('PHỤ LỤC A. DANH SÁCH 126 XÃ, PHƯỜNG', 1)
para(f'{TOT["nP"]} phường, {TOT["nX"]} xã; tổng {n(TOT["pop"])} người, {n(TOT["dt"], 2)} km².')
table([['STT', 'Tên', 'Loại', 'Dân số (người)', 'Diện tích (km²)', 'Mật độ (người/km²)']] +
      [[str(i + 1), x['name'], 'Phường' if x['k'] == 'P' else 'Xã', n(x['ds']), n(x['dt'], 2), n(x['den'])] for i, x in enumerate(D['xa'])],
      [1.2, 5.4, 1.8, 2.6, 2.4, 2.6], size=9.5)

heading('PHỤ LỤC B. LỖI TRONG FILE EFORM CẦN BÊN EFORM SỬA', 1)
para(f'Số dòng tính theo sheet "Xã/Phường". Bảng B.1 do công cụ tự phát hiện ({len(ISSUES)} lỗi, chạy lại bằng "--check"); bảng B.2 ghi nhận khi rà soát.')
note('Bảng B.1. Phát hiện tự động')
table([['Dòng', 'Eform', 'Lỗi', 'Đề xuất']] + [[str(a), b, c, d] for a, b, c, d in ISSUES], [1.3, 3.0, 8.0, 3.7], size=9.5)
note('Bảng B.2. Ghi nhận khi rà soát')
table([['Dòng', 'Eform', 'Lỗi', 'Đề xuất']] + [list(x) for x in ISSUES_TAY], [1.3, 3.0, 8.0, 3.7], size=9.5)

heading('PHỤ LỤC C. BẢN ĐỒ MÃ NGUỒN', 1)
table([
    ['Tệp', 'Nội dung'],
    ['js/core/xa-eform.js', f'Khung {len(U)} eform (tự sinh từ sheet, không sửa tay)'],
    ['tools/xa_eform_schema.py', 'Sinh khung eform từ tệp .xlsx của sheet; "--check" đối chiếu và liệt kê lỗi file eform'],
    ['js/core/xa-eform-mau.js', 'Bản ghi mẫu theo khung eform; hàm nguồn bản ghi, cờ bản ghi mẫu'],
    ['js/features/ctm-xa-units.js', f'Đọc, chuẩn hóa bản ghi; khai báo {len(U)} eform (nhóm, dòng số liệu, trường số, ô số); màn nhóm, Dữ liệu đã nhập; màn ngoài'],
    ['js/features/ctm-engine.js', 'Khung chỉ tiêu dùng chung: màn ngoài, popup, chọn kỳ, so sánh, xuất Excel, lối vào Dữ liệu đã nhập'],
    ['js/core/central-level.js', f'Danh mục {len(U)} đơn vị theo eform của 4 trục (cây tổ chức, đăng nhập)'],
    ['js/core/ctm-xa.js', 'Danh mục 126 xã, phường (số thật)'],
    ['css/ctm.css', 'Giao diện bảng nhóm, Dữ liệu đã nhập, ô cần xem lại'],
    ['tests/ctm/xa-eform.test.js', 'Kiểm thử bám eform, lần lại số, bản ghi lỗi'],
    ['tools/xa_srs_dump.js, tools/xa_srs_docx.py', 'Sinh tài liệu này từ cấu hình đang chạy'],
], [6.0, 10.0], size=10)

heading('PHỤ LỤC D. LỊCH SỬ PHIÊN BẢN', 1)
table([['Phiên bản', 'Ngày', 'Nội dung'],
       ['1.0', '27/10/2026', '19 đơn vị theo phòng ban, 161 chỉ tiêu, số giả lập và số dùng chung với cấp Thành phố.'],
       ['2.2', NGAY, 'Màn nhóm theo bố cục nhiều cấp như 4 trục, các sở: thẻ so sánh quý này – quý trước, biểu đồ qua các quý, biểu đồ thanh các dòng số liệu, bảng đặt dưới biểu đồ (thu gọn 12 dòng); quý chưa có bản ghi báo rõ, có nút sang quý gần nhất có số.'],
       ['2.1', '29/10/2026', 'Khung eform sinh lại theo file eform sửa ngày 28/10/2026 (tên «Nhóm mục», "Đến ngày", mã danh mục, Giáo dục đổi mã «Bậc học/Loại hình giáo dục»); «Kỳ báo cáo», «Quý» hiện tên theo mã khi file ghi lệch; nút ← quay lại màn trước.'],
       ['2.0', '28/10/2026', f'Làm lại theo {len(U)} eform: bỏ mọi chỉ tiêu ngoài eform; thêm màn Dữ liệu đã nhập đủ mọi trường, lần lại từ số đến bản ghi, đánh dấu bản ghi cần xem lại; khung eform sinh từ sheet và công cụ đối chiếu; so quý trước màu trung tính; bản ghi mẫu theo danh mục eform.']],
      [2.2, 2.6, 11.2], size=10.5)

from docx.oxml import OxmlElement
from docx.oxml.ns import qn
uf = OxmlElement('w:updateFields'); uf.set(qn('w:val'), 'true'); k.doc.settings.element.append(uf)
d, m = k.save(OUT)
print(d); print(m)
