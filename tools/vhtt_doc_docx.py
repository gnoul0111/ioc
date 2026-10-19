# -*- coding: utf-8 -*-
"""Sinh docs/VHTT_SoVanHoaTheThao/VHTT_MO_TA_CHI_TIEU.docx + .md (cùng nội dung, xem tools/doc_md.py) — tài liệu mô tả 6 chỉ tiêu Sở VHTT trên IOC (biểu đồ, trường, cách tính).
Chạy từ thư mục gốc ioc:  python tools/vhtt_doc_docx.py
Số liệu ví dụ khớp js/core/vhtt-config.js (số giả lập). Tên trường viết đúng như file mô tả đầu vào eform.
Sau khi sinh, mở bằng Word để cập nhật Mục lục (tools/vhtt_doc_finalize.ps1 làm việc này tự động)."""
import json, os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_md import MdMirror  # bản .md song song, cùng nội dung với .docx
from ctm_display import section as ctm_section  # phần "Cách hiển thị trên giao diện IOC", đọc từ cấu hình đang chạy
import dl_chi_tieu_part as DLP  # 2 chỉ tiêu du lịch (Chỉ tiêu 7, 8) — dùng chung với tài liệu cũ của Sở Du lịch

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Sở Du lịch nhập vào Sở Văn hóa và Thể thao (Nghị quyết HĐND Thành phố 10/8/2026): theo đúng cờ UBND_SAP_XEP_SO_2026 của giao diện
# (js/core/central-level.js). true = tài liệu Sở Văn hóa, Thể thao và Du lịch, 8 chỉ tiêu; false = tài liệu 6 chỉ tiêu như cũ.
GOP = 'const UBND_SAP_XEP_SO_2026 = true' in open(os.path.join(ROOT, 'js', 'core', 'central-level.js'), encoding='utf-8').read()
TEN_SO = 'Sở Văn hóa, Thể thao và Du lịch' if GOP else 'Sở Văn hóa và Thể thao'
NCT = 8 if GOP else 6  # số chỉ tiêu
FIELDS = json.load(open(os.path.join(ROOT, 'tools', 'vhtt-fields.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'docs', 'VHTT_SoVanHoaTheThao', 'VHTT_MO_TA_CHI_TIEU.docx')
OUT_MD = OUT[:-5] + '.md'
MD = MdMirror()

FONT = 'Times New Roman'
NAVY = RGBColor(0x1F, 0x3A, 0x5F)
BLUE = RGBColor(0x2A, 0x5C, 0x9A)
GREY = RGBColor(0x55, 0x5F, 0x6D)
HEAD_FILL, KEY_FILL, NOTE_FILL, FORM_FILL = '1F3A5F', 'EEF3F9', 'FFF7E6', 'F3F6FA'
BORDER = 'A9B8CC'
PAGE_W = 16.0  # cm vùng chữ (A4, lề trái 3, phải 2)

doc = Document()

# ---------- Trang, kiểu chữ ----------
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.left_margin, sec.right_margin, sec.top_margin, sec.bottom_margin = Cm(3), Cm(2), Cm(2), Cm(2)
sec.header_distance, sec.footer_distance = Cm(1.1), Cm(1.1)

def set_font(style, size, bold=None, color=None, italic=None):
    style.font.name = FONT; style.font.size = Pt(size)
    rpr = style.element.get_or_add_rPr(); rf = rpr.find(qn('w:rFonts'))
    if rf is None: rf = OxmlElement('w:rFonts'); rpr.append(rf)
    for a in ('w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'): rf.set(qn(a), FONT)
    # bỏ phông chủ đề (Heading dùng Calibri Light qua asciiTheme, đè lên Times New Roman)
    for a in ('w:asciiTheme', 'w:hAnsiTheme', 'w:eastAsiaTheme', 'w:cstheme'):
        if rf.get(qn(a)) is not None: del rf.attrib[qn(a)]
    if bold is not None: style.font.bold = bold
    if italic is not None: style.font.italic = italic
    if color is not None: style.font.color.rgb = color

st = doc.styles
set_font(st['Normal'], 13)
pf = st['Normal'].paragraph_format; pf.space_after = Pt(6); pf.line_spacing = 1.2
for name, size, before, after, color in (('Heading 1', 15, 18, 8, NAVY), ('Heading 2', 13.5, 14, 6, NAVY), ('Heading 3', 13, 10, 4, BLUE)):
    s = st[name]; set_font(s, size, bold=True, color=color, italic=False)
    s.paragraph_format.space_before = Pt(before); s.paragraph_format.space_after = Pt(after)
    s.paragraph_format.keep_with_next = True; s.paragraph_format.line_spacing = 1.15
for name in ('TOC 1', 'TOC 2', 'TOC 3'):
    try: s = st[name]
    except KeyError: s = st.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    set_font(s, 12.5 if name == 'TOC 1' else 12, bold=(name == 'TOC 1'))
    s.paragraph_format.space_after = Pt(3); s.paragraph_format.left_indent = Cm({'TOC 1': 0, 'TOC 2': 0.6, 'TOC 3': 1.2}[name])
set_font(st['List Bullet'], 13); st['List Bullet'].paragraph_format.space_after = Pt(3)

# ---------- Tiện ích ----------
def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr(); s = OxmlElement('w:shd')
    s.set(qn('w:val'), 'clear'); s.set(qn('w:color'), 'auto'); s.set(qn('w:fill'), fill); tcPr.append(s)

def cell_margins(table, top=70, bottom=70, left=100, right=100):
    tblPr = table._tbl.tblPr; m = OxmlElement('w:tblCellMar')
    for k, v in (('top', top), ('left', left), ('bottom', bottom), ('right', right)):
        e = OxmlElement('w:' + k); e.set(qn('w:w'), str(v)); e.set(qn('w:type'), 'dxa'); m.append(e)
    tblPr.append(m)

def borders(table, color=BORDER):
    tblPr = table._tbl.tblPr; b = OxmlElement('w:tblBorders')
    for k in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        e = OxmlElement('w:' + k); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), '4'); e.set(qn('w:color'), color); b.append(e)
    tblPr.append(b)

def fixed_layout(table, widths):
    tblPr = table._tbl.tblPr; lay = OxmlElement('w:tblLayout'); lay.set(qn('w:type'), 'fixed'); tblPr.append(lay)
    tw = OxmlElement('w:tblW'); tw.set(qn('w:w'), str(int(sum(widths) * 567))); tw.set(qn('w:type'), 'dxa'); tblPr.append(tw)
    grid = table._tbl.tblGrid
    for i, gc in enumerate(grid.findall(qn('w:gridCol'))): gc.set(qn('w:w'), str(int(widths[i] * 567)))
    for row in table.rows:
        for i, c in enumerate(row.cells): c.width = Cm(widths[i])

def no_split(row):
    trPr = row._tr.get_or_add_trPr(); e = OxmlElement('w:cantSplit'); trPr.append(e)

def repeat_header(row):
    trPr = row._tr.get_or_add_trPr(); e = OxmlElement('w:tblHeader'); trPr.append(e)

def add_runs(p, text, size=None, bold=False, color=None, italic=False):
    """**đậm**, «tên trường» in nghiêng đậm màu xanh."""
    import re
    for part in re.split(r'(\*\*[^*]+\*\*|«[^»]+»)', text):
        if not part: continue
        if part.startswith('**'):
            r = p.add_run(part[2:-2]); r.bold = True
        elif part.startswith('«'):
            r = p.add_run(part); r.bold = True; r.italic = True; r.font.color.rgb = BLUE
        else:
            r = p.add_run(part); r.bold = bold; r.italic = italic
            if color is not None: r.font.color.rgb = color
        if size: r.font.size = Pt(size)
    return p

def para(text, size=None, align=None, after=None, bold=False, color=None, italic=False, indent=None):
    p = _take_pb(doc.add_paragraph()); add_runs(p, text, size, bold, color, italic)
    MD.para(text, size, italic, bold)
    if align: p.alignment = align
    if after is not None: p.paragraph_format.space_after = Pt(after)
    if indent is not None: p.paragraph_format.left_indent = Cm(indent)
    return p

def bullet(text, size=None):
    MD.bullets([text])
    p = doc.add_paragraph(style='List Bullet'); add_runs(p, text, size); return p

def keep_together(t):
    """Giữ cả bảng trên một trang (mọi dòng trừ dòng cuối keep_with_next)."""
    for row in t.rows[:-1]:
        for c in row.cells:
            for p in c.paragraphs: p.paragraph_format.keep_with_next = True

def table(rows, widths, header=True, size=11, key_col=False, fills=None, keep=False):
    MD.table(rows, header)
    t = doc.add_table(rows=len(rows), cols=len(widths)); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    borders(t); cell_margins(t); fixed_layout(t, widths)
    for ri, row in enumerate(rows):
        no_split(t.rows[ri])
        for ci, val in enumerate(row):
            c = t.cell(ri, ci); c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.1
            lines = val if isinstance(val, list) else [val]
            for li, ln in enumerate(lines):
                if li: p = c.add_paragraph(); p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.1
                if header and ri == 0:
                    r = p.add_run(ln); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                else:
                    add_runs(p, ln, size, bold=(key_col and ci == 0))
            if header and ri == 0: shade(c, HEAD_FILL)
            elif key_col and ci == 0: shade(c, KEY_FILL)
            elif fills and fills.get((ri, ci)): shade(c, fills[(ri, ci)])
    if header: repeat_header(t.rows[0])
    if keep: keep_together(t)
    gap = doc.add_paragraph(); gap.paragraph_format.space_after = Pt(4); gap.paragraph_format.line_spacing = 0.8
    return t

def box(lines, fill=FORM_FILL, label=None, size=12):
    """Khung 1 ô có nền — dùng cho công thức / lưu ý."""
    MD.box(lines, label)
    t = doc.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    borders(t, 'C9D4E3'); cell_margins(t, 110, 110, 160, 160); fixed_layout(t, [PAGE_W])
    no_split(t.rows[0])  # khung không bị tách sang trang sau
    c = t.cell(0, 0); shade(c, fill); p = c.paragraphs[0]
    first = True
    if label:
        r = p.add_run(label); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = NAVY; first = False
    for ln in lines:
        if not first: p = c.add_paragraph()
        p.paragraph_format.space_after = Pt(2); p.paragraph_format.line_spacing = 1.15
        add_runs(p, ln, size); first = False
    gap = doc.add_paragraph(); gap.paragraph_format.space_after = Pt(4); gap.paragraph_format.line_spacing = 0.8

def field(p, instr):
    r = p.add_run(); b = OxmlElement('w:fldChar'); b.set(qn('w:fldCharType'), 'begin'); r._r.append(b)
    r = p.add_run(); t = OxmlElement('w:instrText'); t.set(qn('xml:space'), 'preserve'); t.text = instr; r._r.append(t)
    r = p.add_run(); s = OxmlElement('w:fldChar'); s.set(qn('w:fldCharType'), 'separate'); r._r.append(s)
    r = p.add_run('…'); e = OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'), 'end'); r2 = p.add_run(); r2._r.append(e)
    return r

# Sang trang = gắn "page_break_before" vào đoạn kế tiếp (không chèn đoạn ngắt trang riêng — đoạn ngắt rơi đúng cuối
# trang sẽ đẩy ra một trang trắng).
_PB = [False]
def page_break(): _PB[0] = True
def _take_pb(p):
    if _PB[0]: p.paragraph_format.page_break_before = True; _PB[0] = False
    return p
_orig_heading = doc.add_heading
def _heading(text, level=1):
    MD.heading(text, level)
    return _take_pb(_orig_heading(text, level=level))
doc.add_heading = _heading

def bottom_rule(p, color='1F3A5F', sz='8'):
    pPr = p._p.get_or_add_pPr(); bd = OxmlElement('w:pBdr'); b = OxmlElement('w:bottom')
    b.set(qn('w:val'), 'single'); b.set(qn('w:sz'), sz); b.set(qn('w:space'), '4'); b.set(qn('w:color'), color); bd.append(b); pPr.append(bd)

# ---------- Đầu trang, chân trang ----------
hp = sec.header.paragraphs[0]; hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
r = hp.add_run(TEN_SO + ' · Mô tả chỉ tiêu trên IOC'); r.italic = True; r.font.size = Pt(10); r.font.color.rgb = GREY
bottom_rule(hp, 'A9B8CC', '4')
fp = sec.footer.paragraphs[0]; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
for t in ('Trang ',):
    r = fp.add_run(t); r.font.size = Pt(10); r.font.color.rgb = GREY
r = field(fp, 'PAGE'); r.font.size = Pt(10)
r = fp.add_run(' / '); r.font.size = Pt(10); r.font.color.rgb = GREY
r = field(fp, 'NUMPAGES'); r.font.size = Pt(10)
sec.different_first_page_header_footer = True

# ======================================================= TRANG BÌA
for _ in range(5): doc.add_paragraph()
p = para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, WD_ALIGN_PARAGRAPH.CENTER, 0, bold=True)
p = para('THÀNH PHỐ HÀ NỘI', 13, WD_ALIGN_PARAGRAPH.CENTER, 0, bold=True)
p = para('', after=0); p.alignment = WD_ALIGN_PARAGRAPH.CENTER; bottom_rule(p, '1F3A5F', '6'); p.paragraph_format.left_indent = Cm(5.5); p.paragraph_format.right_indent = Cm(5.5)
for _ in range(4): doc.add_paragraph()
p = para('TÀI LIỆU MÔ TẢ CHỈ TIÊU', 22, WD_ALIGN_PARAGRAPH.CENTER, 6, bold=True, color=NAVY)
p = para(TEN_SO.upper(), 20, WD_ALIGN_PARAGRAPH.CENTER, 14, bold=True, color=NAVY)
p = para(f'Biểu đồ, trường dữ liệu và cách tính số liệu của {NCT} chỉ tiêu trên IOC', 14, WD_ALIGN_PARAGRAPH.CENTER, 4, italic=True, color=GREY)
p = para(f'xây dựng từ {NCT} eform nhập liệu của Sở', 14, WD_ALIGN_PARAGRAPH.CENTER, 0, italic=True, color=GREY)
for _ in range(6): doc.add_paragraph()
NTR_DL = sum(len(e['fields']) for e in DLP.EF)
info = [
    ['Đơn vị', TEN_SO + ' Thành phố Hà Nội'],
    ['Nguồn dữ liệu', 'File mô tả đầu vào eform, sheet "Sở VHTT": 6 eform, 152 trường nhập'
     + (f'; sheet "Sở Du lịch": 2 eform, {NTR_DL} trường nhập' if GOP else '')],
    ['Phạm vi', f'{NCT} chỉ tiêu, {22 + (DLP.SO_BIEU_DO if GOP else 0)} biểu đồ, bảng 126 phường/xã'],
    ['Số liệu ví dụ', 'Số giả lập (chưa có số liệu thật), kỳ 9 tháng năm 2026'],
    ['Phiên bản', '2.0 · ngày 19/10/2026 (Sở Du lịch nhập vào Sở Văn hóa và Thể thao theo Nghị quyết HĐND Thành phố ngày 10/8/2026: thêm Chỉ tiêu 7 Khách du lịch, Chỉ tiêu 8 Doanh thu dịch vụ du lịch, chuyển nguyên từ tài liệu của Sở Du lịch)' if GOP else
     '1.4 · ngày 13/10/2026 (theo phản hồi nhóm triển khai: chỉ dùng trường có trong eform — bỏ tách hoàn thành đúng hạn / chậm, bỏ so kế hoạch doanh thu năm)'],
]
table(info, [4.2, 10.0], header=False, size=12, key_col=True)
page_break()

# ======================================================= MỤC LỤC
p = para('MỤC LỤC', 15, WD_ALIGN_PARAGRAPH.CENTER, 10, bold=True, color=NAVY)
field(doc.add_paragraph(), 'TOC \\o "1-2" \\h \\z \\u'); MD.toc()
page_break()

# ======================================================= PHẦN I
doc.add_heading('PHẦN I. QUY ƯỚC CHUNG', level=1)
doc.add_heading('1. Mục đích tài liệu', level=2)
para(f'Tài liệu mô tả cách IOC dựng {NCT} chỉ tiêu của {TEN_SO} từ {NCT} eform nhập liệu: mỗi chỉ tiêu có những biểu đồ nào, dùng những trường nào của eform, mỗi trường dùng để làm gì, và mỗi con số được cộng, đếm, tính toán ra sao. Tên trường trong tài liệu viết đúng như tên trường trong file mô tả đầu vào eform để đội nhập liệu và đội kỹ thuật cùng đối chiếu.')
box(['Mọi con số ví dụ trong tài liệu là **số giả lập** dùng để dựng giao diện, đã được cộng kiểm cho khớp (tổng luôn bằng cộng các phần). Khi có số liệu thật, cách tính giữ nguyên, chỉ thay số.'], NOTE_FILL, 'Lưu ý: ')

doc.add_heading('2. Kỳ báo cáo', level=2)
para('Mọi eform đều có 4 trường xác định kỳ: «Kỳ báo cáo» (Tháng / Quý / Năm), «Năm», «Quý», «Tháng». IOC dùng 4 trường này để chọn bản ghi thuộc kỳ đang xem. Có hai cách lấy dữ liệu theo kỳ:')
table([
    ['Cách lấy', 'Áp dụng cho', 'Ý nghĩa'],
    ['**Bản mới nhất**', 'Chỉ tiêu 1, 2', 'Số trong eform đã là số tích lũy (tiến độ nhiệm vụ, vốn cả giai đoạn). Chỉ lấy bản báo cáo của kỳ đang xem, không cộng các kỳ với nhau.'],
    ['**Cộng dồn**', 'Chỉ tiêu 3, 4, 5, 6' + (', 7, 8' if GOP else ''),'Mỗi bản ghi là một sự việc phát sinh trong kỳ (một hoạt động, một chương trình, một tin bài). Cộng tất cả bản ghi từ tháng 1 đến tháng đang xem (mặc định: 9 tháng năm 2026).'],
], [3.2, 3.4, 9.4])

doc.add_heading('3. Các phép tính dùng trong tài liệu', level=2)
table([
    ['Ký hiệu', 'Ý nghĩa', 'Ví dụ'],
    ['ĐẾM(điều kiện)', 'Đếm số bản ghi thỏa điều kiện', 'ĐẾM(«Tiến độ thực hiện» = Hoàn thành)'],
    ['TỔNG(«trường»)', 'Cộng giá trị của trường trên các bản ghi được lấy', 'TỔNG(«Số người tham gia»)'],
    ['Nhóm theo «trường»', 'Chia bản ghi thành từng nhóm theo giá trị của trường, rồi đếm / cộng trong từng nhóm', 'Nhóm theo «Đơn vị chủ trì»'],
    ['Tỷ lệ (%)', 'Tử số ÷ Mẫu số × 100, làm tròn 1 chữ số thập phân', '26 ÷ 48 × 100 = 54,2%'],
    ['Lũy kế', 'Cộng dồn từ tháng 1 đến tháng t', 'Lũy kế T3 = T1 + T2 + T3'],
    ['Khóa chống trùng', 'Trường dùng để nhận ra một bản ghi; bản ghi trùng khóa chỉ tính một lần (lấy bản mới nhất)', '«Mã bản ghi»'],
], [3.6, 6.6, 5.8])

doc.add_heading('4. Vai trò của trường trong cách tính', level=2)
para('Ở mỗi chỉ tiêu, bảng "Trường dữ liệu sử dụng" ghi rõ vai trò của từng trường:')
table([
    ['Vai trò', 'Giải thích'],
    ['Lọc kỳ', 'Chọn bản ghi thuộc kỳ đang xem.'],
    ['Khóa', 'Nhận diện một bản ghi, dùng để đếm và chống đếm trùng.'],
    ['Điều kiện', 'Quyết định bản ghi có được tính hay không, hoặc thuộc nhóm nào.'],
    ['Nhóm', 'Tạo các cột / lát cắt của biểu đồ (trục danh mục).'],
    ['Cộng', 'Giá trị số được cộng lại để ra con số hiển thị.'],
], [3.6, 12.4], key_col=True)
para('Các trường không có vai trò trong biểu đồ (tên, mô tả, ghi chú, người nhập…) vẫn được lưu và hiện ở danh sách bản ghi chi tiết; tài liệu liệt kê ở cuối bảng trường của từng chỉ tiêu.', italic=True, color=GREY, size=12)

doc.add_heading(f'5. Tổng hợp {NCT} chỉ tiêu', level=2)
table([
    ['#', 'Chỉ tiêu trên IOC', 'Eform nguồn', 'Kỳ hiển thị', 'Biểu đồ'],
    ['1', 'Tiến độ triển khai Chương trình hành động số 08-CT', 'Báo cáo tiến độ triển khai Chương trình hành động số 08-CT', 'Tháng 9/2026', '3'],
    ['2', 'Dự án Thành phố đầu tư, hỗ trợ đầu tư lĩnh vực văn hóa, thể thao giai đoạn 2026-2030', 'Cơ cấu dự án Thành phố đầu tư, hỗ trợ đầu tư giai đoạn 2026-2030', 'Quý III/2026', '2'],
    ['3', 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý', 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý', '9 tháng 2026', '4'],
    ['4', 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý', 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý', '9 tháng 2026', '4'],
    ['5', 'Số hoạt động nghệ thuật chuyên nghiệp', 'Eform Số hoạt động nghệ thuật chuyên nghiệp', '9 tháng 2026', '5'],
    ['6', 'Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội', 'Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội', '9 tháng 2026', '4'],
] + ([[str(7 + i), r[0], r[1], '9 tháng 2026', r[3]] for i, r in enumerate(DLP.TONG_HOP)] if GOP else []), [0.8, 5.6, 5.6, 2.4, 1.6], size=10.5)
para('Mỗi chỉ tiêu trên IOC gồm: 1 khối **thẻ số tổng hợp** và các **biểu đồ**; cách tính từng số chỉ trình bày trong tài liệu này, không hiện trên giao diện. Bên phải là bảng **126 phường/xã** (Phần III). Bấm vào một biểu đồ thì bảng số của chính biểu đồ đó hiện ở ô bên phải.')

if GOP:
    doc.add_heading('6. Hai chỉ tiêu du lịch', level=2)
    para('Theo Nghị quyết HĐND Thành phố ngày 10/8/2026 về sắp xếp các sở, Sở Du lịch nhập vào Sở Văn hóa và Thể thao thành **Sở Văn hóa, Thể thao và Du lịch**. Hai chỉ tiêu theo 2 eform của Sở Du lịch trước đây chuyển nguyên vào tài liệu này thành **Chỉ tiêu 7** (khách du lịch) và **Chỉ tiêu 8** (doanh thu dịch vụ du lịch): trường dữ liệu, cách tính, con số giữ nguyên, chỉ đổi số thứ tự. Trên IOC, hai chỉ tiêu này nằm trong màn chi tiết của Sở, cùng bảng 126 phường/xã.')
    para(f'«Đơn vị báo cáo» của hai eform du lịch gồm đúng **{DLP.NDV} phường/xã**; mỗi phường/xã báo cáo số khách, doanh thu tại các điểm du lịch trên địa bàn, theo từng «Loại điểm du lịch». Số toàn Thành phố là cộng 126 phường/xã. Vì mỗi bản ghi là lượt khách tại **một loại điểm du lịch của một phường/xã**, một khách đi nhiều điểm sẽ được đếm ở mỗi điểm: con số IOC cộng ra là **tổng lượt khách đến các điểm du lịch**, có thể lớn hơn số lượt khách du lịch đến Hà Nội theo phương pháp thống kê của ngành.')

# ======================================================= PHẦN II
page_break()
doc.add_heading(f'PHẦN II. CHI TIẾT {NCT} CHỈ TIÊU', level=1)
SHOW_NOTE_BOX = False  # khối "Lưu ý, đề nghị Sở xác nhận" cuối mỗi chỉ tiêu — ẩn theo yêu cầu 14/10/2026
para('Mỗi chỉ tiêu được trình bày theo cùng một khuôn: (1) Thông tin chung · (2) Trường dữ liệu sử dụng · (3) Thẻ số tổng hợp · (4) Từng biểu đồ' + (' · (5) Lưu ý, đề nghị Sở' if SHOW_NOTE_BOX else '') + '.', italic=True, color=GREY)

USE_W = [0.8, 5.4, 2.0, 2.3, 5.5]
def fields_table(rows, unused):
    data = [['#', 'Tên trường (đúng như eform)', 'Kiểu nhập', 'Vai trò', 'Dùng để']]
    for i, r in enumerate(rows): data.append([str(i + 1), r[0], r[1], r[2], r[3]])
    table(data, USE_W, size=10.5)
    if unused:
        para('**Trường không dùng trong biểu đồ** (chỉ hiện ở danh sách chi tiết): ' + ', '.join('«' + u + '»' for u in unused) + '.', size=11.5, color=GREY)

def kpi_table(rows):
    data = [['Thẻ số', 'Công thức', 'Kết quả (giả lập)']] + rows
    table(data, [3.6, 8.2, 4.2], size=11, keep=True)

def chart(code, title, kind, axis, value, formula, example, note=None):
    doc.add_heading(f'Biểu đồ {code}. {title}', level=3)
    rows = [['Loại biểu đồ', kind], ['Trục / nhóm', axis], ['Giá trị hiển thị', value], ['Cách tính', formula], ['Ví dụ (giả lập)', example]]
    if note: rows.append(['Ghi chú', note])
    table(rows, [3.4, 12.6], header=False, size=11.5, key_col=True, keep=True)

def info_table(rows):
    table(rows, [4.0, 12.0], header=False, size=11.5, key_col=True, keep=True)

def notes(items):
    if SHOW_NOTE_BOX: box(['• ' + x for x in items], NOTE_FILL, 'Lưu ý, đề nghị Sở xác nhận', 12)

def ky(txt): return [[['Kỳ báo cáo, Năm,', 'Quý, Tháng'], 'Danh mục / Số', 'Lọc kỳ', txt]]

# ---------------- CHỈ TIÊU 1
doc.add_heading('Chỉ tiêu 1. Tiến độ triển khai Chương trình hành động số 08-CT', level=2)
doc.add_heading('1.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Báo cáo tiến độ triển khai Chương trình hành động số 08-CT'],
    ['Một bản ghi là', 'Một nhiệm vụ của Chương trình'],
    ['Cách lấy theo kỳ', '**Bản mới nhất.** Mỗi tháng Sở gửi lại cả danh sách nhiệm vụ với tiến độ mới nhất; IOC chỉ lấy bản báo cáo của tháng đang xem, không cộng các tháng.'],
    ['Kỳ hiển thị', 'Tháng 9/2026 · 48 nhiệm vụ'],
])
doc.add_heading('1.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Chọn bản báo cáo của tháng đang xem') + [
    ['Chỉ tiêu / Nhiệm vụ', 'Chữ', 'Khóa', 'Đếm số nhiệm vụ (mỗi nhiệm vụ một dòng)'],
    ['Đơn vị chủ trì', 'Chữ', 'Nhóm', 'Trục của biểu đồ 1.2'],
    ['Thời gian hoàn thành theo Kế hoạch', 'Chữ', 'Điều kiện', 'Hạn của nhiệm vụ: xác định đến hạn, quá hạn; đường Kế hoạch của biểu đồ 1.3'],
    ['Tiến độ thực hiện', 'Chữ', 'Điều kiện', 'Phân loại Hoàn thành / Đang thực hiện / Chưa thực hiện'],
], ['Ngày cập nhật tiến độ', 'Sản phẩm', 'Công việc/Thời gian dự kiến', 'Đánh giá mức độ hoàn thành theo kế hoạch hoặc đề xuất khác', 'So sánh với kỳ báo cáo trước'])
doc.add_heading('1.3. Phân loại tiến độ (dùng chung cho cả 3 biểu đồ)', level=3)
para('Mỗi nhiệm vụ được xếp vào đúng một trong 4 nhóm. "Ngày cuối kỳ" là ngày cuối của tháng đang xem (30/9/2026). Eform không có ngày hoàn thành thực tế («Ngày cập nhật tiến độ» là ngày cập nhật, không phải ngày hoàn thành), nên IOC **không tách hoàn thành đúng hạn / chậm** (phản hồi nhóm triển khai 13/10/2026).')
table([
    ['Nhóm tiến độ', 'Điều kiện', 'Số NV'],
    ['Hoàn thành', '«Tiến độ thực hiện» = Hoàn thành', '26'],
    ['Đang thực hiện, trong hạn', '«Tiến độ thực hiện» = Đang thực hiện và «Thời gian hoàn thành theo Kế hoạch» ≥ ngày cuối kỳ', '15'],
    ['Đang thực hiện, quá hạn', '«Tiến độ thực hiện» = Đang thực hiện và «Thời gian hoàn thành theo Kế hoạch» < ngày cuối kỳ', '5'],
    ['Chưa triển khai', '«Tiến độ thực hiện» = Chưa thực hiện', '2'],
    ['**Cộng**', '', '**48**'],
], [4.4, 9.9, 1.7], size=11)
doc.add_heading('1.4. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Tổng số nhiệm vụ', 'ĐẾM(«Chỉ tiêu / Nhiệm vụ») trong bản báo cáo của kỳ', '48 nhiệm vụ'],
    ['Đã hoàn thành', 'ĐẾM(«Tiến độ thực hiện» = Hoàn thành)', '26'],
    ['Tỷ lệ hoàn thành', 'Đã hoàn thành ÷ Tổng số nhiệm vụ × 100', '26 ÷ 48 = 54,2%'],
    ['Quá hạn chưa xong', 'ĐẾM(nhóm "Đang thực hiện, quá hạn")', '5 nhiệm vụ'],
])
doc.add_heading('1.5. Biểu đồ', level=3)
chart('1.1', 'Nhiệm vụ theo tiến độ', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng số nhiệm vụ',
      '4 nhóm tiến độ ở mục 1.3', 'Số nhiệm vụ của từng nhóm; di chuột hiện thêm tỷ trọng %',
      'Mỗi lát = ĐẾM(nhiệm vụ thuộc nhóm). Tỷ trọng = số của nhóm ÷ 48 × 100. Giữa vòng = Tổng số nhiệm vụ.',
      'Hoàn thành 26 (54,2%) · Đang thực hiện trong hạn 15 · Quá hạn 5 · Chưa triển khai 2 → giữa vòng 48')
chart('1.2', 'Nhiệm vụ theo đơn vị chủ trì', 'Biểu đồ cột ngang xếp chồng',
      'Trục dọc: từng giá trị của «Đơn vị chủ trì»; mỗi cột chia 4 đoạn màu theo 4 nhóm tiến độ',
      'Số trong từng đoạn = số nhiệm vụ; số ở đầu cột = tổng nhiệm vụ của đơn vị (đoạn bằng 0 không ghi số)',
      'Nhóm theo «Đơn vị chủ trì», trong mỗi đơn vị ĐẾM theo 4 nhóm tiến độ. Đầu cột = cộng 4 đoạn.',
      'Phòng Quản lý Văn hóa: 6 hoàn thành + 3 trong hạn + 1 quá hạn + 1 chưa triển khai = 11. Cộng 6 đơn vị = 48.')
chart('1.3', 'Kế hoạch và thực tế hoàn thành (lũy kế theo tháng)', 'Biểu đồ đường, 2 đường: Kế hoạch (nét đứt) và Thực tế',
      'Trục ngang: tháng T1 → T9; trục dọc: số nhiệm vụ',
      'Số nhiệm vụ lũy kế đến cuối mỗi tháng',
      ['Kế hoạch(t) = ĐẾM(«Thời gian hoàn thành theo Kế hoạch» ≤ ngày cuối tháng t).',
       'Thực tế(t) = ĐẾM(«Tiến độ thực hiện» = Hoàn thành) trong bản báo cáo tháng t.'],
      'Tháng 9: Kế hoạch 31, Thực tế 26 → còn 5 nhiệm vụ đến hạn mà chưa xong (đúng bằng thẻ Quá hạn).',
      'Khoảng cách giữa hai đường cho biết số nhiệm vụ đang chậm so với kế hoạch.')
notes(['«Tiến độ thực hiện» đang để kiểu Chữ. Đề nghị đổi sang Danh mục với 3 giá trị Hoàn thành / Đang thực hiện / Chưa thực hiện để IOC phân loại chính xác.',
       '«Thời gian hoàn thành theo Kế hoạch» đang để kiểu Chữ nhưng nội dung là ngày. Đề nghị đổi sang kiểu Ngày tháng.',
       'Mã trường của «Công việc/Thời gian dự kiến» đang gõ "thơi" (có dấu), đề nghị sửa thành "thoi".'])

# ---------------- CHỈ TIÊU 2
page_break()
doc.add_heading('Chỉ tiêu 2. Dự án Thành phố đầu tư, hỗ trợ đầu tư lĩnh vực văn hóa, thể thao giai đoạn 2026-2030', level=2)
doc.add_heading('2.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Cơ cấu dự án Thành phố đầu tư, hỗ trợ đầu tư giai đoạn 2026-2030'],
    ['Một bản ghi là', 'Một nhóm công trình («Tên công trình») trên một «Địa bàn»'],
    ['Cách lấy theo kỳ', '**Bản mới nhất.** Số dự án và số vốn là số tích lũy của cả giai đoạn, không cộng các kỳ.'],
    ['Kỳ hiển thị', 'Quý III/2026 · 36 dự án · tiền nhập triệu đồng, IOC hiển thị tỷ đồng'],
])
doc.add_heading('2.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Chọn bản báo cáo mới nhất') + [
    ['Tên công trình', 'Chữ', 'Nhóm', 'Trục của biểu đồ 2.1 (nhóm công trình)'],
    ['Số dự án theo NQ 80', 'Số', 'Cộng', 'Số dự án; giá trị của biểu đồ 2.2'],
    ['Số dự án Thành phố đã bố trí vốn KH 2026-2030', 'Số', 'Cộng', 'Số dự án đã có vốn'],
    ['Địa bàn', 'Danh mục', 'Nhóm', 'Cột "Dự án" của bảng 126 phường/xã'],
    ['Tổng giai đoạn 2026-2030 theo NQ 80', 'Số', 'Cộng', 'Tổng vốn theo Nghị quyết 80'],
    ['KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí', 'Số', 'Cộng', 'Vốn đầu tư công trung hạn đã bố trí'],
    ['Tiến độ thực hiện', 'Chữ', 'Nhóm', 'Lát cắt của biểu đồ 2.2'],
], ['Quy mô', 'Thời gian thực hiện', 'Thuyết minh đầu tư'])
doc.add_heading('2.3. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Dự án theo NQ 80', 'TỔNG(«Số dự án theo NQ 80»)', '36 dự án'],
    ['Dự án đã bố trí vốn', 'TỔNG(«Số dự án Thành phố đã bố trí vốn KH 2026-2030»); tỷ lệ = ÷ Dự án theo NQ 80 × 100', '24 dự án · 66,7%'],
    ['Tổng vốn theo NQ 80', 'TỔNG(«Tổng giai đoạn 2026-2030 theo NQ 80»)', '12.480 tỷ đồng'],
    ['Vốn đã bố trí', 'TỔNG(«KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí»); tỷ lệ = ÷ Tổng vốn theo NQ 80 × 100', '7.865 tỷ đồng · 63,0%'],
])
doc.add_heading('2.4. Biểu đồ', level=3)
chart('2.1', 'Vốn theo nhóm công trình', 'Biểu đồ cột ngang, mỗi nhóm 2 cột đứng cạnh nhau',
      'Trục dọc: từng giá trị của «Tên công trình»; 2 cột: Theo NQ 80 và Đã bố trí',
      'Số vốn (tỷ đồng)',
      ['Nhóm theo «Tên công trình», trong mỗi nhóm:',
       'Cột "Theo NQ 80" = TỔNG(«Tổng giai đoạn 2026-2030 theo NQ 80»);',
       'Cột "Đã bố trí" = TỔNG(«KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí»).'],
      'Tu bổ, tôn tạo di tích: 3.260 và 2.140 · Thiết chế văn hóa cấp Thành phố: 4.850 và 3.020 · … Cộng 5 nhóm: 12.480 và 7.865.',
      'Phần chênh giữa hai cột là số vốn còn phải bố trí của nhóm.')
chart('2.2', 'Dự án theo tiến độ thực hiện', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng số dự án',
      'Từng giá trị của «Tiến độ thực hiện»', 'Số dự án',
      'Nhóm theo «Tiến độ thực hiện», mỗi lát = TỔNG(«Số dự án theo NQ 80») của nhóm.',
      'Chuẩn bị đầu tư 15 · Đang thực hiện 17 · Đã hoàn thành 4 → giữa vòng 36')
notes(['Hai trường vốn **nhập bằng triệu đồng** (đã chốt theo bản trả lời BA, mục 85); IOC chia 1.000 và hiển thị **tỷ đồng**.',
       '«Tiến độ thực hiện» đang để kiểu Chữ; đề nghị đổi sang Danh mục (Chuẩn bị đầu tư / Đang thực hiện / Đã hoàn thành).'])

# ---------------- CHỈ TIÊU 3
page_break()
doc.add_heading('Chỉ tiêu 3. Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý', level=2)
doc.add_heading('3.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Quy mô, số lượng người tham gia hoạt động nghệ thuật Thành phố quản lý'],
    ['Một bản ghi là', 'Một hoạt động / chương trình'],
    ['Cách lấy theo kỳ', '**Cộng dồn** các bản báo cáo tháng 1 – 9/2026. Mỗi «Mã bản ghi» chỉ tính một lần; nếu một hoạt động được sửa ở tháng sau thì lấy bản mới nhất.'],
    ['Kỳ hiển thị', '9 tháng năm 2026 · 412 hoạt động'],
])
doc.add_heading('3.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Lấy tháng 1 – 9 theo «Ngày bắt đầu» của hoạt động') + [
    ['Ngày bắt đầu', 'Ngày tháng', 'Lọc kỳ, Nhóm', 'Xếp hoạt động vào tháng diễn ra (biểu đồ theo tháng)'],
    ['Mã bản ghi', 'Chữ', 'Khóa', 'Đếm số hoạt động, chống đếm trùng'],
    ['Loại hoạt động', 'Danh mục', 'Nhóm', 'Trục của biểu đồ 3.1'],
    ['Quy mô IOC', 'Danh mục', 'Nhóm', 'Lát cắt của biểu đồ 3.2'],
    ['Cấp tổ chức thực tế', 'Danh mục', 'Nhóm', 'Trục của biểu đồ 3.3'],
    ['Địa bàn', 'Danh mục', 'Nhóm', 'Cột "Hoạt động nghệ thuật", "Người tham gia" của bảng phường/xã'],
    ['Số buổi/đêm diễn', 'Số', 'Cộng', 'Thẻ Số buổi/đêm diễn'],
    ['Số người tham gia', 'Số', 'Cộng', 'Thẻ Lượt người tham gia; đường của biểu đồ 3.1, 3.4'],
    ['Trạng thái đối soát', 'Danh mục', 'Điều kiện', 'Thẻ Đã đối soát'],
], ['Đơn vị tổ chức', 'Mã đơn vị/đầu mối', 'Hoạt động/ Nghệ thuật', 'Tên hoạt động/chương trình', 'Mã hoạt động liên quan', 'Địa điểm tổ chức', 'Cụm/TDP', 'Ngày kết thúc', 'Đối tượng tham gia', 'Đơn vị phối hợp', 'Số chứng từ/HĐ/biên bản', 'Người nhập', 'Người xác nhận', 'Ghi chú'])
doc.add_heading('3.3. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Số hoạt động', 'ĐẾM(«Mã bản ghi»)', '412 hoạt động'],
    ['Lượt người tham gia', 'TỔNG(«Số người tham gia»)', '1.062.400 lượt'],
    ['Số buổi/đêm diễn', 'TỔNG(«Số buổi/đêm diễn»)', '968 buổi'],
    ['Bình quân / hoạt động', 'Lượt người tham gia ÷ Số hoạt động', '1.062.400 ÷ 412 ≈ 2.579 người'],
    ['Đã đối soát', 'ĐẾM(«Trạng thái đối soát» = Đã đối soát) ÷ Số hoạt động × 100', '338 ÷ 412 = 82,0%'],
])
doc.add_heading('3.4. Biểu đồ', level=3)
chart('3.1', 'Theo loại hoạt động', 'Biểu đồ kết hợp: cột (trục trái) + đường (trục phải)',
      'Trục ngang: từng giá trị của «Loại hoạt động» (Biểu diễn, Triển lãm, Liên hoan/Hội diễn, Sự kiện, Khác)',
      'Cột: số hoạt động · Đường: nghìn lượt người tham gia',
      ['Nhóm theo «Loại hoạt động»:', 'Cột = ĐẾM(«Mã bản ghi»);', 'Đường = TỔNG(«Số người tham gia») ÷ 1.000.'],
      'Biểu diễn 186 hoạt động / 312,4 nghìn người · Sự kiện 88 hoạt động / 486,2 nghìn người (ít hoạt động nhưng đông người nhất).',
      'Hai trục khác đơn vị nên đặt hai thang đo riêng: trái là số hoạt động, phải là nghìn người.')
chart('3.2', 'Theo quy mô', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng số hoạt động',
      'Từng giá trị của «Quy mô IOC» (Nhỏ / Vừa / Lớn)', 'Số hoạt động',
      'Nhóm theo «Quy mô IOC», mỗi lát = ĐẾM(«Mã bản ghi»).', 'Nhỏ 238 · Vừa 131 · Lớn 43 → giữa vòng 412')
chart('3.3', 'Theo cấp tổ chức thực tế', 'Biểu đồ cột ngang',
      'Trục dọc: từng giá trị của «Cấp tổ chức thực tế»', 'Số hoạt động',
      'Nhóm theo «Cấp tổ chức thực tế», mỗi cột = ĐẾM(«Mã bản ghi»).', 'Phường/Xã 214 · Thành phố 96 · Đơn vị 64 · Quận/Huyện 38 (cộng 412)')
chart('3.4', 'Diễn biến theo tháng', 'Biểu đồ kết hợp: cột (trục trái) + đường (trục phải)',
      'Trục ngang: tháng của «Ngày bắt đầu» T1 → T9', 'Cột: số hoạt động · Đường: nghìn lượt người tham gia',
      ['Nhóm theo tháng của «Ngày bắt đầu» (ngày diễn ra hoạt động, không lấy tháng báo cáo):', 'Cột = ĐẾM(«Mã bản ghi»);', 'Đường = TỔNG(«Số người tham gia») ÷ 1.000.'],
      'T1: 58 hoạt động / 186,2 nghìn người · T9: 56 hoạt động / 174,8 nghìn người. Cộng 9 tháng = 412 hoạt động / 1.062,4 nghìn người.')
notes(['Hai trường «Hoạt động/ Nghệ thuật» và «Loại hoạt động» có danh mục gần trùng nhau; IOC dùng «Loại hoạt động» để phân tổ. Đề nghị Sở bỏ bớt một trường.'])

# ---------------- CHỈ TIÊU 4
page_break()
doc.add_heading('Chỉ tiêu 4. Doanh thu của các đơn vị nghệ thuật Thành phố quản lý', level=2)
doc.add_heading('4.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Doanh thu của các đơn vị nghệ thuật Thành phố quản lý'],
    ['Một bản ghi là', 'Một chương trình của một đơn vị nghệ thuật'],
    ['Cách lấy theo kỳ', '**Cộng dồn** tháng 1 – 9/2026; bỏ bản ghi có «Tính chất» = Không phát sinh; mỗi «Mã bản ghi» tính một lần.'],
    ['Kỳ hiển thị', '9 tháng năm 2026 · 268 chương trình · tiền nhập triệu đồng, IOC hiển thị tỷ đồng (1 số lẻ)'],
    ['Kế hoạch năm', 'Eform không có trường kế hoạch doanh thu → IOC không hiện so kế hoạch (phản hồi nhóm triển khai 13/10/2026)'],
])
doc.add_heading('4.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Lấy tháng 1 – 9 theo «Ngày bắt đầu» của chương trình') + [
    ['Ngày bắt đầu', 'Ngày tháng', 'Lọc kỳ, Nhóm', 'Xếp hoạt động vào tháng diễn ra (biểu đồ theo tháng)'],
    ['Mã bản ghi', 'Chữ', 'Khóa', 'Chống đếm trùng'],
    ['Đơn vị nghệ thuật TP quản lý', 'Chữ', 'Nhóm', 'Trục của biểu đồ 4.2'],
    ['Tính chất', 'Danh mục', 'Điều kiện', 'Loại bản ghi "Không phát sinh"'],
    ['Địa bàn', 'Danh mục', 'Nhóm', 'Cột "Doanh thu" của bảng phường/xã'],
    ['Số vé bán', 'Số', 'Cộng', 'Tính giá vé bình quân'],
    ['Doanh thu bán vé (triệu đồng)', 'Số', 'Cộng', 'Khoản thu 1 (biểu đồ 4.1, 4.2); giá vé bình quân'],
    ['Doanh thu hợp đồng/đặt hàng (triệu đồng)', 'Số', 'Cộng', 'Khoản thu 2 (biểu đồ 4.1, 4.2)'],
    ['Doanh thu tài trợ/quảng cáo (triệu đồng)', 'Số', 'Cộng', 'Khoản thu 3 (biểu đồ 4.1, 4.2)'],
    ['Doanh thu dịch vụ khác (triệu đồng)', 'Số', 'Cộng', 'Khoản thu 4 (biểu đồ 4.1, 4.2)'],
    ['Tổng doanh thu (triệu đồng)', 'Số', 'Cộng', 'Thẻ Tổng doanh thu; biểu đồ 4.3, 4.4'],
    ['Lượt khán giả', 'Số', 'Cộng', 'Thẻ Lượt khán giả'],
    ['Kinh phí NSNN hỗ trợ (triệu đồng)', 'Số', 'Cộng', 'Thẻ NSNN hỗ trợ'],
    ['Chi phí trực tiếp (triệu đồng)', 'Số', 'Cộng', 'Cột Chi phí của biểu đồ 4.3'],
    ['Chênh lệch thu-chi (triệu đồng)', 'Số', 'Cộng', 'Thẻ Chênh lệch thu – chi'],
    ['Trạng thái hạch toán', 'Danh mục', 'Nhóm', 'Lát cắt của biểu đồ 4.4'],
], ['Mã đơn vị/đầu mối', 'Tên hoạt động/chương trình', 'Mã hoạt động liên quan', 'Loại hoạt động', 'Quy mô IOC', 'Cấp tổ chức thực tế', 'Địa điểm tổ chức', 'Thôn/TDP', 'Ngày kết thúc', 'Số buổi/đêm diễn', 'Giá vé bình quân (đồng)', 'Tổng doanh thu (tỷ đồng)', 'Số chứng từ/HĐ/biên bản', 'Ghi chú'])
doc.add_heading('4.3. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Tổng doanh thu', 'TỔNG(«Tổng doanh thu (triệu đồng)») ÷ 1.000', '32,2 tỷ đồng'],
    ['Chênh lệch thu – chi', 'TỔNG(«Chênh lệch thu-chi (triệu đồng)») — phải bằng Tổng doanh thu − TỔNG(«Chi phí trực tiếp (triệu đồng)»)', '32,2 − 27,4 = 4,9 tỷ đồng'],
    ['NSNN hỗ trợ', 'TỔNG(«Kinh phí NSNN hỗ trợ (triệu đồng)») ÷ 1.000', '12,3 tỷ đồng'],
    ['Lượt khán giả', 'TỔNG(«Lượt khán giả»)', '341.000 lượt'],
    ['Giá vé bình quân', 'TỔNG(«Doanh thu bán vé (triệu đồng)») × 1.000 ÷ TỔNG(«Số vé bán»), ra nghìn đồng', '19.260 triệu ÷ 214.000 vé = 90 nghìn đồng/vé'],
])
box(['Không lấy trung bình cộng của trường «Giá vé bình quân (đồng)», vì mỗi chương trình bán số vé khác nhau; chương trình bán ít vé sẽ làm lệch kết quả. Phải lấy tổng tiền vé chia tổng số vé.'], FORM_FILL, 'Vì sao giá vé bình quân tính lại: ', 11.5)
doc.add_heading('4.4. Biểu đồ', level=3)
chart('4.1', 'Cơ cấu nguồn thu', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng doanh thu',
      '4 khoản thu: Bán vé · Hợp đồng/đặt hàng · Tài trợ/quảng cáo · Dịch vụ khác', 'Số tiền (tỷ đồng), di chuột hiện tỷ trọng %',
      ['Mỗi lát = TỔNG của trường tương ứng: «Doanh thu bán vé (triệu đồng)», «Doanh thu hợp đồng/đặt hàng (triệu đồng)», «Doanh thu tài trợ/quảng cáo (triệu đồng)», «Doanh thu dịch vụ khác (triệu đồng)».',
       'Mỗi khoản ÷ 1.000 ra tỷ đồng; tỷ trọng = khoản ÷ Tổng doanh thu × 100.'],
      'Bán vé 19,3 (59,7%) · Hợp đồng 7,9 (24,6%) · Tài trợ 3,1 (9,8%) · Dịch vụ khác 1,9 (5,9%) → giữa vòng 32,2 tỷ đồng')
chart('4.2', 'Doanh thu theo đơn vị nghệ thuật', 'Biểu đồ cột ngang xếp chồng',
      'Trục dọc: từng giá trị của «Đơn vị nghệ thuật TP quản lý»; mỗi cột chia 4 đoạn theo 4 khoản thu',
      'Số trong đoạn = khoản thu; số ở đầu cột = tổng doanh thu của đơn vị (tỷ đồng)',
      'Nhóm theo «Đơn vị nghệ thuật TP quản lý», cộng riêng 4 trường doanh thu; đầu cột = cộng 4 đoạn.',
      'Nhà hát Múa rối Thăng Long: 7,9 + 1,0 + 0,5 + 1,1 = 10,5 tỷ đồng (cao nhất). Cộng 5 đơn vị = 32,2 tỷ đồng.')
chart('4.3', 'Doanh thu, chi phí theo tháng', 'Biểu đồ kết hợp: 2 cột (trục trái) + 1 đường (trục phải)',
      'Trục ngang: tháng của «Ngày bắt đầu» T1 → T9',
      'Cột: doanh thu và chi phí trong tháng · Đường: doanh thu lũy kế',
      ['Nhóm theo tháng của «Ngày bắt đầu»: cột Doanh thu = TỔNG(«Tổng doanh thu (triệu đồng)»); cột Chi phí = TỔNG(«Chi phí trực tiếp (triệu đồng)»).',
       'Đường Doanh thu lũy kế(t) = cộng doanh thu từ T1 đến t.',
       'Không vẽ đường kế hoạch: eform không có trường kế hoạch doanh thu.', 'Mọi số ÷ 1.000, hiển thị tỷ đồng.'],
      'T1: doanh thu 4,9, chi phí 4,0 tỷ đồng · Lũy kế T9: 32,2 tỷ đồng.',
      'Biểu đồ này không ghi số trên cột (quá dày); di chuột để xem số từng cột.')
chart('4.4', 'Doanh thu theo trạng thái hạch toán', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng doanh thu',
      'Từng giá trị của «Trạng thái hạch toán»', 'Số tiền (tỷ đồng)',
      'Nhóm theo «Trạng thái hạch toán», mỗi lát = TỔNG(«Tổng doanh thu (triệu đồng)»).',
      'Đã đối soát với Sở VHTT 22,2 (68,8%) · Đã hạch toán 5,1 · Đã xuất hóa đơn/chứng từ 2,3 · Tạm tính 1,7 · Chờ đối soát 0,9 tỷ đồng',
      'Cho biết bao nhiêu phần doanh thu đã là số chính thức, bao nhiêu còn tạm tính.')
notes(['Eform không có trường kế hoạch doanh thu năm nên IOC không hiện tỷ lệ so kế hoạch và đường kế hoạch lũy kế; nếu Sở cần theo dõi kế hoạch, đề nghị bổ sung trường kế hoạch vào eform.',
       'Trong file mô tả, dữ liệu mẫu của «Doanh thu dịch vụ khác (triệu đồng)» và «Tổng doanh thu (tỷ đồng)» đang là ngày tháng, cần sửa lại thành số.',
       'Nếu «Tổng doanh thu (triệu đồng)» khác cộng 4 khoản doanh thu, IOC lấy cộng 4 khoản và đánh dấu bản ghi cần kiểm tra.'])

# ---------------- CHỈ TIÊU 5
page_break()
doc.add_heading('Chỉ tiêu 5. Số hoạt động nghệ thuật chuyên nghiệp', level=2)
doc.add_heading('5.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Eform Số hoạt động nghệ thuật chuyên nghiệp'],
    ['Một bản ghi là', 'Một hoạt động nghệ thuật'],
    ['Cách lấy theo kỳ', '**Cộng dồn** tháng 1 – 9/2026; chỉ đếm hoạt động có «Trạng thái hoạt động» = Đã diễn ra; mỗi «Mã hoạt động» tính một lần.'],
    ['Phân tổ chuẩn', 'Theo QĐ 4795: chỉ gồm 3 loại hình Liên hoan, Hội diễn, Hội thi. Hoạt động "Khác/ngoài QĐ4795 - cần giải trình" hiện riêng, không cộng vào.'],
    ['Kỳ hiển thị', '9 tháng năm 2026 · 186 hoạt động · tiền trong eform tính bằng đồng, IOC đổi ra tỷ đồng'],
])
doc.add_heading('5.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Lấy tháng 1 – 9 theo «Ngày bắt đầu» của hoạt động') + [
    ['Ngày bắt đầu', 'Ngày tháng', 'Lọc kỳ, Nhóm', 'Xếp hoạt động vào tháng diễn ra (biểu đồ theo tháng)'],
    ['Đơn vị báo cáo', 'Danh mục', 'Nhóm', 'Cột "Hoạt động NT chuyên nghiệp" của bảng phường/xã'],
    ['Mã hoạt động', 'Chữ', 'Khóa', 'Đếm số hoạt động, chống đếm trùng'],
    ['Loại hình theo', 'Danh mục', 'Điều kiện, Nhóm', 'Chỉ lấy Liên hoan / Hội diễn / Hội thi; màu của biểu đồ 5.1'],
    ['Tính chất theo', 'Danh mục', 'Nhóm', 'Lát cắt của biểu đồ 5.2'],
    ['Quy mô theo', 'Danh mục', 'Nhóm', 'Lát cắt của biểu đồ 5.3'],
    ['Loại hình nghệ thuật', 'Danh mục', 'Nhóm', 'Trục của biểu đồ 5.4'],
    ['Số buổi/đêm diễn', 'Số', 'Cộng', 'Thẻ Số buổi/đêm diễn'],
    ['Số lượt nghệ sĩ/diễn viên', 'Số', 'Cộng', 'Thẻ Lượt nghệ sĩ, diễn viên'],
    ['Số lượt khán giả', 'Số', 'Cộng', 'Thẻ Lượt khán giả'],
    ['Doanh thu vé/dịch vụ (đồng)', 'Số', 'Cộng', 'Lát 1 của biểu đồ 5.5'],
    ['Kinh phí NSNN hỗ trợ (đồng)', 'Số', 'Cộng', 'Lát 2 của biểu đồ 5.5'],
    ['Nguồn kinh phí khác (đồng)', 'Số', 'Cộng', 'Lát 3 của biểu đồ 5.5'],
    ['Trạng thái hoạt động', 'Danh mục', 'Điều kiện', 'Chỉ đếm Đã diễn ra; các trạng thái khác vào dòng "Chưa diễn ra"'],
], ['Thôn/TDP', 'Tên hoạt động nghệ thuật', 'Ngày kết thúc', 'Địa chỉ chi tiết', 'Cấp tổ chức thực tế', 'Đơn vị chủ trì/tổ chức', 'Đơn vị phối hợp', 'Hình thức tổ chức', 'Số vé/khách mời phát hành', 'Căn cứ/Kế hoạch/Văn bản', 'Số giấy phép/thông báo', 'Ghi chú/vướng mắc'])
doc.add_heading('5.3. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Hoạt động đã diễn ra', 'ĐẾM(«Mã hoạt động») với «Trạng thái hoạt động» = Đã diễn ra và «Loại hình theo» ∈ {Liên hoan, Hội diễn, Hội thi}', '186 hoạt động'],
    ['Số buổi/đêm diễn', 'TỔNG(«Số buổi/đêm diễn») của các hoạt động trên', '624 buổi'],
    ['Lượt nghệ sĩ, diễn viên', 'TỔNG(«Số lượt nghệ sĩ/diễn viên»)', '9.840 lượt'],
    ['Lượt khán giả', 'TỔNG(«Số lượt khán giả»)', '486.300 lượt'],
    ['Dòng "Chưa diễn ra"', 'ĐẾM theo «Trạng thái hoạt động» = Đang chuẩn bị / Tạm hoãn / Huỷ (không cộng vào 186)', 'Đang chuẩn bị 14 · Tạm hoãn 5 · Huỷ 3'],
    ['Dòng "Ngoài QĐ 4795"', 'ĐẾM(«Loại hình theo» = Khác/ngoài QĐ4795 - cần giải trình), đã diễn ra', '6 hoạt động'],
])
doc.add_heading('5.4. Biểu đồ', level=3)
chart('5.1', 'Theo tháng và loại hình', 'Biểu đồ cột đứng xếp chồng',
      'Trục ngang: tháng của «Ngày bắt đầu» T1 → T9; mỗi cột chia 3 đoạn theo «Loại hình theo»',
      'Số hoạt động; số ở đầu cột = tổng của tháng',
      'Nhóm theo tháng của «Ngày bắt đầu», trong mỗi tháng ĐẾM(«Mã hoạt động») theo «Loại hình theo».',
      'T1: 10 Liên hoan + 14 Hội diễn + 7 Hội thi = 31. Cộng 9 tháng: Liên hoan 62 · Hội diễn 78 · Hội thi 46 = 186.')
chart('5.2', 'Theo tính chất', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng số hoạt động',
      'Từng giá trị của «Tính chất theo»', 'Số hoạt động',
      'Nhóm theo «Tính chất theo», mỗi lát = ĐẾM(«Mã hoạt động»).',
      'Phục vụ chính trị 82 · Có thu 74 · Kết hợp có thu và phục vụ chính trị 30 → giữa vòng 186',
      'Nhóm "Kết hợp" là nhóm riêng, không cộng vào cả hai nhóm Có thu và Phục vụ chính trị.')
chart('5.3', 'Theo quy mô', 'Biểu đồ tròn dạng vành khuyên',
      'Từng giá trị của «Quy mô theo»: chỉ Quốc gia và Thành phố', 'Số hoạt động',
      'Nhóm theo «Quy mô theo», mỗi lát = ĐẾM(«Mã hoạt động»). Giá trị "Khác cấp địa bàn" chỉ dùng xem chi tiết, không cộng vào phân tổ chuẩn.',
      'Thành phố 151 · Quốc gia 35 → giữa vòng 186')
chart('5.4', 'Theo loại hình nghệ thuật', 'Biểu đồ cột ngang, xếp từ nhiều đến ít',
      'Trục dọc: từng giá trị của «Loại hình nghệ thuật»', 'Số hoạt động',
      'Nhóm theo «Loại hình nghệ thuật», mỗi cột = ĐẾM(«Mã hoạt động»).',
      'Ca múa nhạc 46 · Sân khấu 32 · Chèo 28 · Nghệ thuật tổng hợp 26 · Cải lương 18 · Múa 14 · Xiếc 10 · Tuồng 6 · Khác 6 (cộng 186)')
chart('5.5', 'Nguồn kinh phí', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng kinh phí',
      '3 nguồn: Doanh thu vé/dịch vụ · Kinh phí NSNN hỗ trợ · Nguồn kinh phí khác', 'Số tiền (tỷ đồng)',
      'Mỗi lát = TỔNG của trường tương ứng («Doanh thu vé/dịch vụ (đồng)», «Kinh phí NSNN hỗ trợ (đồng)», «Nguồn kinh phí khác (đồng)») ÷ 1.000.000.000.',
      'Doanh thu vé/dịch vụ 14,6 · NSNN hỗ trợ 21,4 · Nguồn khác 6,9 → giữa vòng 42,9 tỷ đồng')
notes(['Danh mục «Quý» của eform này đang có 2 giá trị "Quý III" (thiếu "Quý II"), đề nghị sửa.',
       'Dữ liệu mẫu của «Năm» và «Tháng» đang để trống.'])

# ---------------- CHỈ TIÊU 6
page_break()
doc.add_heading('Chỉ tiêu 6. Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội', level=2)
doc.add_heading('6.1. Thông tin chung', level=3)
info_table([
    ['Eform nguồn', 'Điểm thông tin báo chí, trang tin, mạng xã hội về Thành phố Hà Nội'],
    ['Một bản ghi là', 'Một tin / bài'],
    ['Cách lấy theo kỳ', '**Cộng dồn** theo «Ngày đăng» từ tháng 1 – 9/2026; tin có cùng «Link bài viết» chỉ tính một lần; các lượt xem, chia sẻ… lấy theo «Thời gian cập nhật» mới nhất.'],
    ['Kỳ hiển thị', '9 tháng năm 2026 · 24.860 tin bài'],
])
doc.add_heading('6.2. Trường dữ liệu sử dụng', level=3)
fields_table(ky('Chọn kỳ báo cáo') + [
    ['Mã bản ghi', 'Chữ', 'Khóa', 'Đếm số tin bài'],
    ['Ngày đăng', 'Ngày tháng', 'Lọc kỳ, Nhóm', 'Xác định tin thuộc tháng nào; trục của biểu đồ 6.2'],
    ['Thời gian cập nhật', 'Ngày tháng', 'Điều kiện', 'Lấy số tương tác mới nhất của mỗi tin'],
    ['Link bài viết', 'Chữ', 'Khóa', 'Chống đếm trùng một tin được nhập nhiều lần'],
    ['Loại nguồn', 'Danh mục', 'Nhóm', 'Trục của biểu đồ 6.1'],
    ['Lĩnh vực', 'Chữ', 'Nhóm', 'Trục của biểu đồ 6.3'],
    ['Địa bàn', 'Danh mục', 'Nhóm', 'Cột "Tin bài có gắn địa bàn" của bảng phường/xã'],
    ['Mức độ cảm xúc', 'Danh mục', 'Điều kiện, Nhóm', 'Tích cực / Trung tính / Tiêu cực: thẻ số, màu biểu đồ 6.1, đường biểu đồ 6.2, lọc biểu đồ 6.4'],
    ['Mức độ ưu tiên xử lý', 'Danh mục', 'Nhóm', 'Lát cắt của biểu đồ 6.4; thẻ Tiêu cực cần xử lý gấp'],
    ['Lượt xem', 'Số', 'Cộng', 'Thẻ Lượt xem'],
    ['Lượt tiếp cận (Reach)', 'Số', 'Cộng', 'Thẻ Lượt tiếp cận'],
    ['Lượt thích', 'Số', 'Cộng', 'Dòng tương tác dưới thẻ số'],
    ['Lượt chia sẻ', 'Số', 'Cộng', 'Dòng tương tác dưới thẻ số'],
    ['Lượt bình luận', 'Số', 'Cộng', 'Dòng tương tác dưới thẻ số'],
], ['Tiêu đề tin/bài', 'Tên báo/trang tin/mạng xã hội', 'Tác giả', 'Chủ đề', 'Cơ quan/đơn vị được nhắc đến', 'Từ khóa', 'Nội dung tóm tắt', 'Mức độ lan tỏa', 'Mức độ quan tâm', 'Điểm tương tác (Engagement)', 'Xu hướng', 'Đơn vị theo dõi', 'Người nhập', 'Người xác nhận', 'Trạng thái đối soát', 'Ghi chú'])
doc.add_heading('6.3. Thẻ số tổng hợp', level=3)
kpi_table([
    ['Tổng tin bài', 'ĐẾM(«Mã bản ghi»), bỏ tin trùng «Link bài viết»', '24.860 tin'],
    ['Tích cực', 'ĐẾM(«Mức độ cảm xúc» = Tích cực) ÷ Tổng tin bài × 100', '14.850 tin · 59,7%'],
    ['Tiêu cực', 'ĐẾM(«Mức độ cảm xúc» = Tiêu cực) ÷ Tổng tin bài × 100', '1.820 tin · 7,3%'],
    ['Tiêu cực cần xử lý gấp', 'ĐẾM(«Mức độ cảm xúc» = Tiêu cực và «Mức độ ưu tiên xử lý» ∈ {Khẩn cấp, Cao})', '36 + 212 = 248 tin'],
    ['Lượt xem', 'TỔNG(«Lượt xem») ÷ 1.000', '186.400 nghìn lượt'],
    ['Lượt tiếp cận', 'TỔNG(«Lượt tiếp cận (Reach)»)', '142,6 triệu'],
    ['Dòng tương tác', 'TỔNG(«Lượt thích»), TỔNG(«Lượt chia sẻ»), TỔNG(«Lượt bình luận»)', '21,7 · 4,82 · 3,16 triệu'],
])
doc.add_heading('6.4. Biểu đồ', level=3)
chart('6.1', 'Theo loại nguồn và mức độ cảm xúc', 'Biểu đồ cột ngang xếp chồng',
      'Trục dọc: từng giá trị của «Loại nguồn»; mỗi cột chia 3 đoạn theo «Mức độ cảm xúc»',
      'Số tin bài; số ở đầu cột = tổng tin của nguồn',
      'Nhóm theo «Loại nguồn», trong mỗi nguồn ĐẾM(«Mã bản ghi») theo «Mức độ cảm xúc».',
      'Báo điện tử: 6.420 tích cực + 2.980 trung tính + 410 tiêu cực = 9.810 · Mạng xã hội: 4.860 + 3.640 + 1.180 = 9.680 (nhiều tin tiêu cực nhất).')
chart('6.2', 'Diễn biến theo tháng', 'Biểu đồ kết hợp: cột + 2 đường',
      'Trục ngang: tháng của «Ngày đăng» T1 → T9',
      'Cột: tổng tin bài (trục trái) · Đường xanh: tin tích cực (trục trái) · Đường đỏ: tin tiêu cực (trục phải)',
      ['Nhóm theo tháng của «Ngày đăng»:', 'Cột = ĐẾM(«Mã bản ghi»);', 'Đường = ĐẾM theo «Mức độ cảm xúc» = Tích cực / Tiêu cực.'],
      'T9: 3.160 tin, 1.890 tích cực, 210 tiêu cực. Cộng 9 tháng: 24.860 / 14.850 / 1.820.',
      'Tin tiêu cực ít hơn nhiều nên đặt ở trục phải để nhìn rõ xu hướng tăng giảm.')
chart('6.3', 'Theo lĩnh vực', 'Biểu đồ cột ngang, xếp từ nhiều đến ít',
      'Trục dọc: từng giá trị của «Lĩnh vực»', 'Số tin bài',
      'Nhóm theo «Lĩnh vực», mỗi cột = ĐẾM(«Mã bản ghi»).',
      'Văn hóa, lễ hội 5.240 · Du lịch 4.180 · Thể thao 3.620 · Đô thị, giao thông 3.460 · Kinh tế 2.860 · Giáo dục 1.940 · Y tế 1.320 · Khác 2.240 (cộng 24.860)')
chart('6.4', 'Tin tiêu cực theo mức ưu tiên xử lý', 'Biểu đồ tròn dạng vành khuyên; giữa vòng ghi tổng tin tiêu cực',
      'Từng giá trị của «Mức độ ưu tiên xử lý» (Khẩn cấp / Cao / Trung bình / Thấp)', 'Số tin tiêu cực',
      'Chỉ lấy tin có «Mức độ cảm xúc» = Tiêu cực; nhóm theo «Mức độ ưu tiên xử lý», mỗi lát = ĐẾM(«Mã bản ghi»).',
      'Khẩn cấp 36 · Cao 212 · Trung bình 784 · Thấp 788 → giữa vòng 1.820')
notes(['«Lĩnh vực» đang để kiểu Chữ; đề nghị đổi sang Danh mục để các tin cùng lĩnh vực được gom đúng một nhóm.',
       'Lượt xem, chia sẻ, bình luận, thích, tiếp cận là số tại lần cập nhật gần nhất của tin; IOC lấy số mới nhất, không cộng các lần cập nhật.'])

# ---------------- CHỈ TIÊU 7, 8 (du lịch, chuyển từ tài liệu Sở Du lịch — tools/dl_chi_tieu_part.py)
if GOP:
    page_break()
    DLP.write(lambda t, l: doc.add_heading(t, level=l), para, table, chart, kpi_table, info_table,
              lambda rows: fields_table(rows, []), lambda ct, items: notes(items), page_break, a=7, muc_ky='Phần I, mục 2')

# ======================================================= PHẦN III
page_break()
doc.add_heading('PHẦN III. BẢNG 126 PHƯỜNG/XÃ', level=1)
para('Ô bên phải của form là bảng 126 phường/xã. Dòng đầu **Toàn Thành phố** bằng tổng các phường/xã bên dưới. Chỉ tiêu 1 không có trường địa bàn nên không có cột.')
table([
    ['Cột trong bảng', 'Lấy từ chỉ tiêu', 'Nhóm theo trường', 'Cách tính', 'Toàn TP'],
    ['Hoạt động nghệ thuật', '3', '«Địa bàn»', 'ĐẾM(«Mã bản ghi»)', '412'],
    ['Người tham gia', '3', '«Địa bàn»', 'TỔNG(«Số người tham gia»)', '1.062.400'],
    ['Hoạt động NT chuyên nghiệp', '5', '«Đơn vị báo cáo»', 'ĐẾM(«Mã hoạt động»), đã diễn ra, đúng phân tổ chuẩn', '186'],
    ['Doanh thu (tỷ đồng)', '4', '«Địa bàn»', 'TỔNG(«Tổng doanh thu (triệu đồng)») ÷ 1.000', '32,2'],
    ['Dự án 2026-2030', '2', '«Địa bàn»', 'TỔNG(«Số dự án theo NQ 80»)', '36'],
    ['Tin bài có gắn địa bàn', '6', '«Địa bàn»', 'ĐẾM(«Mã bản ghi»); tin nói về Thành phố chung không gắn phường/xã thì không vào bảng', '15.620'],
] + ([
    ['Lượt khách du lịch (nghìn lượt)', '7', '«Đơn vị báo cáo»', '(TỔNG(«Số lượt khách du lịch quốc tế») + TỔNG(«Số lượt khách du lịch nội địa»)) ÷ 1.000', DLP.nghin(DLP.K['tong'])],
    ['Khách quốc tế (nghìn lượt)', '7', '«Đơn vị báo cáo»', 'TỔNG(«Số lượt khách du lịch quốc tế») ÷ 1.000', DLP.nghin(DLP.K['qt'])],
    ['Tổng thu từ khách du lịch (tỷ đồng)', '8', '«Đơn vị báo cáo»', 'TỔNG(«Giá trị doanh thu (VND)») có «Loại doanh thu» = Tổng thu từ khách du lịch, ÷ 10⁹', DLP.ty(DLP.T['tong'])],
    ['Lượt khách trên 1.000 dân', '7', '«Đơn vị báo cáo»', 'Lượt khách ÷ dân số của phường/xã × 1.000', '—'],
] if GOP else []), [3.7, 1.7, 3.0, 5.6, 2.0], size=10.5)
para('Bấm vào một biểu đồ bất kỳ ở cột trái thì ô bên phải đổi sang bảng số của chính biểu đồ đó; bấm nút "Danh sách 126 đơn vị" để quay lại bảng phường/xã.', italic=True, color=GREY, size=12)

# ======================================================= PHỤ LỤC
page_break()
ctm_section(lambda t, l: doc.add_heading(t, level=l), para, lambda rows, w: table(rows, w, size=10), 'ubnd-vhtt',
            'PHẦN IV. CÁCH HIỂN THỊ TRÊN GIAO DIỆN IOC', changes=(['Ngày 19/10/2026: Sở đổi tên thành Sở Văn hóa, Thể thao và Du lịch; màn chi tiết thêm 2 nhóm "Khách du lịch", "Doanh thu du lịch" và bảng 126 phường/xã của du lịch; hàng ô số chính giữ 8 ô (6 ô văn hóa, thể thao + tổng lượt khách, tổng thu du lịch); thẻ ở màn ngoài thêm dòng tổng lượt khách du lịch; thẻ riêng của Sở Du lịch bỏ khỏi màn ngoài.'] if GOP else []) + ['Theo phản hồi nhóm triển khai 13/10/2026: Chương trình 08-CT chia 4 nhóm tiến độ (gộp hoàn thành đúng hạn / chậm vì eform không có ngày hoàn thành thực tế), bỏ tỷ lệ đúng hạn; doanh thu nghệ thuật bỏ "so kế hoạch năm" và đường kế hoạch lũy kế (eform không có trường kế hoạch).', 'Doanh thu, chênh lệch thu – chi, ngân sách hỗ trợ của đơn vị nghệ thuật ghi **tỷ đồng, 1 số lẻ** ở mọi thẻ, biểu đồ, bảng (trước: triệu đồng); giá vé bình quân ghi **nghìn đồng**.', 'Lượt xem tin, bài ghi **nghìn lượt** (trước: triệu lượt); số tin, bài đếm bằng "tin bài".', 'Hai trường vốn giai đoạn 2026–2030 **nhập triệu đồng**, IOC chia 1.000 và hiển thị tỷ đồng (bản trả lời BA, mục 85; trước ghi "giả định là tỷ đồng").', 'Thẻ ở màn ngoài dùng một bộ nhãn rõ nghĩa, giống nhau ở tab UBND và tab "Tất cả"; tab UBND đọc đúng số của màn chi tiết, không tự tính lại.', 'Mọi mũi tên tăng/giảm ghi rõ mốc so sánh; chưa có số cùng kỳ thì ghi "Chưa có số cùng kỳ" thay cho mũi tên.', 'Tỷ lệ theo tháng/quý vẽ đường thay cho cột từ 0; bảng cơ cấu tối đa 6 phần chuyển sang thẻ cơ cấu; bỏ thẻ lặp đúng bộ số của thẻ khác.'])
page_break()
page_break()
doc.add_heading(f'PHỤ LỤC. DANH SÁCH TRƯỜNG CỦA {NCT} EFORM', level=1)
para('Trích nguyên từ file mô tả đầu vào eform, sheet "Sở VHTT"' + (' (eform 1 – 6) và sheet "Sở Du lịch" (eform 7, 8)' if GOP else '') + '. Cột "Dùng trên IOC" cho biết trường có tham gia tính toán biểu đồ / thẻ số hay không.')
USED = {
    0: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Chỉ tiêu / Nhiệm vụ', 'Đơn vị chủ trì', 'Thời gian hoàn thành theo Kế hoạch', 'Tiến độ thực hiện', 'Ngày cập nhật tiến độ'},
    1: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Tên công trình', 'Số dự án theo NQ 80', 'Số dự án Thành phố đã bố trí vốn KH 2026-2030', 'Địa bàn', 'Tổng giai đoạn 2026-2030 theo NQ 80', 'KH ĐTC trung hạn 2026-2030 Thành phố đã bố trí', 'Tiến độ thực hiện'},
    2: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Mã bản ghi', 'Loại hoạt động', 'Quy mô IOC', 'Cấp tổ chức thực tế', 'Địa bàn', 'Số buổi/đêm diễn', 'Số người tham gia', 'Trạng thái đối soát'},
    3: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Mã bản ghi', 'Đơn vị nghệ thuật TP quản lý', 'Tính chất', 'Địa bàn', 'Số vé bán', 'Doanh thu bán vé (triệu đồng)', 'Doanh thu hợp đồng/đặt hàng (triệu đồng)', 'Doanh thu tài trợ/quảng cáo (triệu đồng)', 'Doanh thu dịch vụ khác (triệu đồng)', 'Tổng doanh thu (triệu đồng)', 'Lượt khán giả', 'Kinh phí NSNN hỗ trợ (triệu đồng)', 'Chi phí trực tiếp (triệu đồng)', 'Chênh lệch thu-chi (triệu đồng)', 'Trạng thái hạch toán'},
    4: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Đơn vị báo cáo', 'Mã hoạt động', 'Loại hình theo', 'Tính chất theo', 'Quy mô theo', 'Loại hình nghệ thuật', 'Số buổi/đêm diễn', 'Số lượt nghệ sĩ/diễn viên', 'Số lượt khán giả', 'Doanh thu vé/dịch vụ (đồng)', 'Kinh phí NSNN hỗ trợ (đồng)', 'Nguồn kinh phí khác (đồng)', 'Trạng thái hoạt động'},
    5: {'Kỳ báo cáo', 'Năm', 'Quý', 'Tháng', 'Mã bản ghi', 'Ngày đăng', 'Thời gian cập nhật', 'Link bài viết', 'Loại nguồn', 'Lĩnh vực', 'Địa bàn', 'Mức độ cảm xúc', 'Mức độ ưu tiên xử lý', 'Lượt xem', 'Lượt tiếp cận (Reach)', 'Lượt thích', 'Lượt chia sẻ', 'Lượt bình luận'},
}
used_total = 0
for i, e in enumerate(FIELDS):
    doc.add_heading(f'{i + 1}. {e["eform"]} ({len(e["fields"])} trường)', level=2)
    rows = [['#', 'Tên trường', 'Mã trường', 'Kiểu nhập', 'Dùng trên IOC']]
    fills = {}
    for j, f in enumerate(e['fields']):
        u = f[0] in USED[i]; used_total += u
        rows.append([str(j + 1), f[0], f[1], f[2], 'Có' if u else '—'])
        if u: fills[(j + 1, 4)] = 'E6F4EA'
    t = table(rows, [0.8, 4.9, 6.5, 2.0, 1.8], size=10, fills=fills)
    for j in range(1, len(rows)):  # mã trường dùng phông đơn cách
        for r in t.cell(j, 2).paragraphs[0].runs: r.font.name = 'Consolas'; r.font.size = Pt(8.5)
print('Trường dùng trên IOC:', used_total, '/ 152')
if GOP:
    for i, e in enumerate(DLP.EF):
        doc.add_heading(f'{7 + i}. {e["eform"]} ({len(e["fields"])} trường)', level=2)
        rows, fills = [['#', 'Tên trường', 'Mã trường', 'Kiểu nhập', 'Dùng trên IOC']], {}
        for j, f in enumerate(e['fields']):
            u = f[0] in DLP.USED[i]
            rows.append([str(j + 1), f[0], f[1], f[2] or '(chưa ghi)', 'Có' if u else '—'])
            if u: fills[(j + 1, 4)] = 'E6F4EA'
        t = table(rows, [0.8, 4.9, 6.5, 2.0, 1.8], size=10, fills=fills)
        for j in range(1, len(rows)):
            for r in t.cell(j, 2).paragraphs[0].runs: r.font.name = 'Consolas'; r.font.size = Pt(8.5)

doc.save(OUT)
MD.save(OUT_MD)
print('ok', OUT_MD)
print('ok', OUT)
