# -*- coding: utf-8 -*-
"""Sinh bộ tài liệu SRS tích hợp API cho 12 sở, ngành đang nhập eform, chưa có API → docs/SRS_TICH_HOP_API_12_SO/
    00_SRS_TICH_HOP_API_CHUNG_<ngày>.docx/.md      SRS chung: phạm vi, phương án, hợp đồng API, đồng bộ, SLA, kiểm thử, bàn giao
    NN_<MÃ>_SRS_TICH_HOP_API_<ngày>.docx/.md       mỗi sở một tài liệu: từ điển dữ liệu, mapping, ví dụ, test case, việc cần sở xác nhận
    ky_thuat/openapi/<MÃ>_openapi.yaml             hợp đồng OpenAPI 3.0 từng sở
    ky_thuat/TU_DIEN_DU_LIEU_MAPPING_12_SO_<ngày>.xlsx
Mô hình đã chốt 31/10/2026: sở mở API, IOC định kỳ gọi sang kéo dữ liệu về; trường gửi qua API là trường của eform
(quy ước chỉ tiêu theo eform bản 2.0), thêm 3 trường kỹ thuật (mã bản ghi, thời điểm cập nhật, cờ đã xóa) — anh duyệt 31/10/2026.
Trường, kiểu, danh mục đọc thẳng từ js/core/eform-khung.js (khung sinh từ file eform); một bản ghi là gì, khóa bản ghi, loại số,
chỉ tiêu dự kiến, kiểm tra, lỗi file đọc từ bản đọc eform đã duyệt (docs/BAN_DOC_EFORM/SO_*, TRUC_UBND_VPUB_*).
Chạy từ thư mục gốc ioc:  python3 tools/srs_api_so_docx.py      (cần python-docx, openpyxl)"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, GREY, PAGE_W, _borders, _cell_margins, _fixed_layout, _shade, _row_flag
from docx.shared import Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NGAY, NGAY_F, VER = '31/10/2026', '2026_10_31', '1.0 (dự thảo)'
OUTD = os.path.join(ROOT, 'docs', 'SRS_TICH_HOP_API_12_SO')
SHEET_URL = 'https://docs.google.com/spreadsheets/d/1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k'
BASE = '/ioc/v1'
CHO = '[Chờ chốt]'

# đơn vị: (mã khối trong khung, mã tài liệu, tên đầy đủ, tên ngắn)
DV = [
    ('vpub', 'VPUB', 'Văn phòng UBND Thành phố', 'VP UBND'),
    ('bql', 'BQL', 'Ban Quản lý các Khu công nghệ cao và khu công nghiệp Thành phố', 'Ban Quản lý KCNC và KCN'),
    ('dl', 'DL', 'Sở Du lịch', 'Sở Du lịch'),
    ('dttg', 'DTTG', 'Sở Dân tộc và Tôn giáo', 'Sở Dân tộc và Tôn giáo'),
    ('khcn', 'KHCN', 'Sở Khoa học và Công nghệ', 'Sở KH&CN'),
    ('nnmt', 'NNMT', 'Sở Nông nghiệp và Môi trường', 'Sở NN&MT'),
    ('sct', 'SCT', 'Sở Công Thương', 'Sở Công Thương'),
    ('snv', 'SNV', 'Sở Nội vụ', 'Sở Nội vụ'),
    ('sxd', 'SXD', 'Sở Xây dựng', 'Sở Xây dựng'),
    ('syt', 'SYT', 'Sở Y tế', 'Sở Y tế'),
    ('ttra', 'TTRA', 'Thanh tra Thành phố', 'Thanh tra Thành phố'),
    ('vhtt', 'VHTT', 'Sở Văn hóa và Thể thao', 'Sở VH&TT'),
]
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng', '': '(để trống trong file)'}
JSON_T = {'dm': 'object {ma, ten}', 'so': 'number', 'chu': 'string', 'ngay': 'string (YYYY-MM-DD)', '': 'string (tạm)'}
QUY_TAC = {
    'so': 'Nhận số như gửi, không làm tròn, không đổi đơn vị; null giữ null (không thay bằng 0)',
    'chu': 'Giữ nguyên chữ đã nhập, chỉ bỏ khoảng trắng đầu, cuối',
    'dm': 'Đối chiếu «ma» với danh mục của eform; hiện tên theo danh mục; mã ngoài danh mục → nhận, đánh dấu bản ghi',
    'ngay': 'Đọc YYYY-MM-DD; sai định dạng → nhận, đánh dấu bản ghi',
    '': 'Nhận như chữ cho tới khi sở xác nhận kiểu; không tự đổi sang số',
}
KY_C = ('ky_bao_cao', 'nam', 'thang', 'quy')

# ---------------------------------------------------------------- khung eform
_s = open(os.path.join(ROOT, 'js', 'core', 'eform-khung.js'), encoding='utf-8').read()
_i = _s.index('const EFORM_KHUNG = ') + len('const EFORM_KHUNG = ')
KH = {k['id']: k for k in json.JSONDecoder().raw_decode(_s[_i:])[0]}


# ---------------------------------------------------------------- bản đọc eform đã duyệt
def _list_after(sec, label):
    m = re.search(r'\*\*' + re.escape(label) + r'[^*]*\*\*[^\n]*\n\n((?:- [^\n]*\n?)+)', sec)
    return [ln[2:].strip() for ln in m.group(1).strip().split('\n')] if m else []


def _line(sec, label):
    m = re.search(r'- \*\*' + re.escape(label) + r'\*\*: ([^\n]*)', sec)
    return m.group(1).strip() if m else ''


BD = {}
for p in sorted(glob.glob(os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', 'SO_*.md'))) + \
        sorted(glob.glob(os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', 'TRUC_UBND_VPUB_*.md')))[-1:]:
    for sec in re.split(r'\n## ', open(p, encoding='utf-8').read())[1:]:
        if not re.match(r'\d+\. ', sec):
            continue
        sd = _line(sec, 'Sheet, dòng')
        m = re.match(r'(.+?), từ dòng (\d+)', sd)
        mid = re.search(r'mã trên IOC: ([a-z]+\d+)', sd)
        rec = dict(ban_ghi=_line(sec, 'Một bản ghi là'), khoa=_line(sec, 'Khóa bản ghi'), loai_so=_line(sec, 'Loại số'),
                   chi=_list_after(sec, 'Chỉ tiêu dự kiến') or _list_after(sec, 'Chỉ tiêu, biểu đồ dự kiến'),
                   kt=_list_after(sec, 'Đánh dấu bản ghi cần xem lại'), loi=_list_after(sec, 'Lỗi, chỗ nghi trong file eform:'),
                   nguon=os.path.basename(p))
        if mid:
            BD[mid.group(1)] = rec
        if m:
            BD[(m.group(1).strip(), int(m.group(2)))] = rec


def bandoc(kid, e):
    r = BD.get(e['id']) or BD.get((KH[kid]['sheet'], e['dong']))
    assert r, ('không tìm thấy bản đọc eform', e['id'])
    return r


def khoa_fields(e, khoa):
    """Trường thuộc khóa bản ghi → (bắt buộc?, ghi chú). Tên trong «» so khớp đúng tên trường eform."""
    by_l = {f['l'].strip(): f for f in e['fields']}
    out, names = {}, re.findall(r'«([^»]+)»(\s*\([^)]*\))?', khoa)
    for i, (n, par) in enumerate(names):
        f = by_l.get(n.strip())
        assert f, ('tên trường trong khóa không có trong eform', e['id'], n)
        out[f['c']] = 'được để trống' not in par
        if 'hai trường sau' in par and i:
            out[by_l[names[i - 1][0].strip()]['c']] = False
    return out


def bat_buoc(f, kf):
    c = f['c']
    if c == 'ky_bao_cao' or c == 'nam':
        return 'Có'
    if c == 'thang':
        return 'Có khi «Kỳ báo cáo» = Tháng'
    if c == 'quy':
        return 'Có khi «Kỳ báo cáo» = Quý'
    if c in kf:
        return 'Có (khóa)' if kf[c] else 'Không (khóa, được để trống)'
    return 'Không'


def can_cu(e):
    """Căn cứ chỉ tiêu ghi trên eform (QĐ 4795, QĐ 5279, «chỉ số …») — chỉ nhắc, không dựng chỉ tiêu ngoài eform."""
    out = []
    t = e['ten']
    q = re.findall(r'Q[DĐ]\s*(\d{4})', t)
    cs = re.search(r'[Cc]hỉ số\s*(?:CĐS\s*)?([\d][\d,\s\-]*)', t)
    if q or cs:
        out.append('Tên eform ghi ' + ', '.join(['QĐ ' + x for x in q] + (['chỉ số ' + cs.group(1).strip(' ,')] if cs else [])))
    for f in e['fields']:
        if 'QĐ4795' in f['l'] or 'QĐ 4795' in f['l'] or ('chỉ tiêu' in f['l'].lower() and 'Mã' in f['l']):
            out.append(f'Trường «{f["l"]}» ({len(f.get("dm") or [])} mã)')
    return '; '.join(out) or 'Eform không ghi mã chỉ tiêu'


# ---------------------------------------------------------------- giá trị mẫu (bản ghi mẫu, đúng kiểu trường)
def _num(v):
    try:
        x = float(str(v).replace(',', '.'))
        return int(x) if x.is_integer() else x
    except (TypeError, ValueError):
        return None


def _date(v):
    s = str(v or '')
    m = re.match(r'(\d{4})-(\d{1,2})-(\d{1,2})', s) or None
    if m:
        return f'{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}'
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', s)
    if m:
        return f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}'
    return '2026-09-15'


def mau(f):
    t, v, dm = f['t'], f.get('mau'), f.get('dm') or []
    if t == 'dm':
        if not dm:
            return None
        o = next((o for o in dm if str(v) in (o.get('l'), o['v'])), dm[0])
        return {'ma': o['v'], 'ten': o.get('l') or o['v']}
    if t == 'so':
        return _num(v) if _num(v) is not None else 0
    if t == 'ngay':
        return _date(v)
    return None if v in (None, '') else str(v)


def dm_text(f):
    dm = f.get('dm') or []
    if not dm:
        return '—'
    if f['t'] != 'dm':
        return f'Kiểu Chữ, file kèm {len(dm)} giá trị: truyền đúng chữ đã nhập, không đổi thành mã'
    if len(dm) == 126:
        return '126 xã, phường (đủ mã ở file Excel, sheet DANH_MUC)'
    lab = [(o['v'] if o['v'] == o.get('l') else f'{o["v"]} = {o.get("l")}') for o in dm]
    if len(dm) <= 6:
        return f'{len(dm)} mã: ' + '; '.join(lab)
    return f'{len(dm)} mã: ' + '; '.join(lab[:3]) + f'; … (đủ ở Excel)'


# ---------------------------------------------------------------- dữ liệu đơn vị
UNITS = []
for kid, ma, ten, ngan in DV:
    efs = []
    for e in KH[kid]['eforms']:
        b = bandoc(kid, e)
        kf = khoa_fields(e, b['khoa'])
        codes = {f['c'] for f in e['fields']}
        efs.append(dict(e=e, bd=b, kf=kf, ky=[c for c in KY_C if c in codes], db='dia_ban' in codes, cc=can_cu(e)))
    UNITS.append(dict(kid=kid, ma=ma, ten=ten, ngan=ngan, sheet=KH[kid]['sheet'], efs=efs,
                      nf=sum(len(x['e']['fields']) for x in efs)))
N_EF = sum(len(u['efs']) for u in UNITS)
N_F = sum(u['nf'] for u in UNITS)
for i, u in enumerate(UNITS):
    u['file'] = f'{i + 1:02d}_{u["ma"]}_SRS_TICH_HOP_API_{NGAY_F}'
CHUNG_FILE = f'00_SRS_TICH_HOP_API_CHUNG_{NGAY_F}'
XLSX_FILE = f'TU_DIEN_DU_LIEU_MAPPING_12_SO_{NGAY_F}.xlsx'


def ep(e, tail='ban-ghi'):
    return f'{BASE}/eform/{e["id"]}/{tail}'


def vi_du_trang(x, n=1):
    e = x['e']
    tr = {f['c']: mau(f) for f in e['fields']}
    # dữ liệu mẫu trong file eform có kỳ lệch nhau (Tháng mà «Quý» = Quý II): ví dụ đặt khớp kỳ Tháng 9/2026
    ky = next((f for f in e['fields'] if f['c'] == 'ky_bao_cao' and f['t'] == 'dm'), None)
    o = ky and next((o for o in ky.get('dm') or [] if (o.get('l') or '').lower() == 'tháng'), None)
    if o and 'thang' in tr:
        tr.update(ky_bao_cao={'ma': o['v'], 'ten': o['l']}, thang=9)
        if 'nam' in tr: tr['nam'] = 2026
        if 'quy' in tr: tr['quy'] = None
    rec = {'ma_ban_ghi': f'{e["id"].upper()}-000001', 'thoi_diem_cap_nhat': '2026-10-15T08:30:00+07:00', 'da_xoa': False, 'truong': tr}
    return {'ma_eform': e['id'], 'phien_ban_khung': '2026-10-28', 'trang': 1, 'so_ban_ghi_moi_trang': 200,
            'tong_so_ban_ghi': n, 'tong_so_trang': 1, 'thoi_diem_phan_hoi': '2026-10-15T09:00:05+07:00', 'ban_ghi': [rec]}


# ---------------------------------------------------------------- tiện ích Word
def update_fields_on_open(k):
    el = OxmlElement('w:updateFields'); el.set(qn('w:val'), 'true')
    k.doc.settings.element.append(el)


def code(k, text, lang='json', title=None):
    """Khối mã: Word = khung 1 ô Consolas; Markdown = ```lang."""
    k.md.out.append((f'**{title}**\n\n' if title else '') + f'```{lang}\n{text}\n```')
    if title:
        k.para(title, 11.5, bold=True, color=NAVY, after=2, md=False)
    t = k.doc.add_table(rows=1, cols=1)
    _borders(t, 'C9D4E3'); _cell_margins(t, 90, 90, 140, 140); _fixed_layout(t, [PAGE_W])
    c = t.cell(0, 0); _shade(c, 'F5F7FA'); first = True
    for ln in text.split('\n'):
        p = c.paragraphs[0] if first else c.add_paragraph(); first = False
        p.paragraph_format.space_after = Pt(0); p.paragraph_format.line_spacing = 1.0
        r = p.add_run(ln); r.font.name = 'Consolas'; r.font.size = Pt(8.5)
        r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Consolas')
    k._gap()


def cover(k, title_md, l1, l2, l3, info):
    k.blank(3)
    k.para('HỆ THỐNG ĐIỀU HÀNH IOC/CAD', 13, CENTER, 0, bold=True)
    k.para('THÀNH PHỐ HÀ NỘI', 13, CENTER, 0, bold=True)
    k.rule()
    k.blank(3)
    k.para(l1, 22, CENTER, 6, bold=True, color=NAVY, md=False)
    k.md.title(title_md)
    k.para(l2, 16, CENTER, 4, bold=True, color=NAVY)
    k.para(l3, 13, CENTER, 4, italic=True, color=GREY)
    k.blank(2)
    k.table(info, [3.5, 12.5], header=False, key_col=True, size=12)
    k.page_break(); k.toc(); k.page_break()


# ================================================================= SRS CHUNG
def srs_chung():
    k = Kit('SRS tích hợp API 12 sở, ngành · IOC Hà Nội')
    para, table, box, heading, bullets, note = k.para, k.table, k.box, k.heading, k.bullets, k.note
    cover(k, 'Đặc tả yêu cầu phần mềm (SRS) — Tích hợp API dữ liệu eform của 12 sở, ngành về IOC',
          'ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)', 'Tích hợp API dữ liệu eform của các sở, ngành về IOC',
          f'{len(UNITS)} sở, ngành đang nhập eform, chưa có API · {N_EF} eform · {N_F} trường', [
              ['Phạm vi', f'{len(UNITS)} sở, ngành đang nhập tay qua eform và chưa có API: {", ".join(u["ngan"] for u in UNITS)}. '
                          f'{N_EF} eform, {N_F} trường. Mỗi eform một API; sở mở API, IOC định kỳ gọi sang kéo dữ liệu về'],
              ['Căn cứ', '"File mô tả đầu vào eform" (Google Sheets); khung eform trên IOC (js/core/eform-khung.js, sinh từ file); bản đọc eform đã duyệt '
                         '28/10/2026 (docs/BAN_DOC_EFORM); quy ước chỉ tiêu theo eform bản 2.0; QĐ 4795 (nhắc ở mức căn cứ, mục 1.4)'],
              ['Bộ tài liệu', f'Tài liệu này (SRS chung) + {len(UNITS)} tài liệu riêng từng sở, ngành + hợp đồng OpenAPI + file Excel từ điển dữ liệu (Phụ lục A)'],
              ['Phiên bản', VER],
              ['Ngày lập', NGAY],
              ['Trạng thái', 'Dự thảo để review với sở, ngành và nhóm kỹ thuật. Các mục ghi ' + CHO + ' là đề xuất, cần chốt'],
          ])

    # ---------------- 1
    heading('1. GIỚI THIỆU', 1)
    heading('1.1. Mục đích', 2)
    para('Tài liệu đặc tả yêu cầu tích hợp dữ liệu eform của các sở, ngành về Hệ thống điều hành IOC Hà Nội qua API. Hiện nay các sở, ngành này nhập tay '
         'qua eform; khi có API, IOC tự kéo dữ liệu về theo lịch, không phải nhập lại.')
    para('Tài liệu dùng chung cho mọi sở, ngành trong phạm vi: hợp đồng API, cách đồng bộ, xử lý lỗi, đối soát, yêu cầu phi chức năng, kiểm thử, nghiệm thu, '
         'quản lý thay đổi. Phần riêng của từng sở, ngành (eform, trường, danh mục, ví dụ, test case, việc cần xác nhận) nằm ở tài liệu riêng.')
    para('Người đọc: đầu mối nghiệp vụ và kỹ thuật của sở, ngành; bên xây dựng API của sở; nhóm phân tích nghiệp vụ (BA), phát triển (dev), kiểm thử (QA) IOC; '
         'kiến trúc sư hệ thống; đơn vị quản lý nền tảng tích hợp (nếu đi qua nền tảng chung).')
    box(['API gửi **đúng các trường của eform**: tên, mã, kiểu, danh mục, thứ tự y hệt eform; không thêm chỉ tiêu, không thêm trường nghiệp vụ ngoài eform. '
         'Chỉ thêm 3 **trường kỹ thuật** phục vụ đồng bộ (mã bản ghi, thời điểm cập nhật, cờ đã xóa), không phải chỉ tiêu, không hiển thị như số liệu (duyệt 31/10/2026).',
         'API trả **từng bản ghi** như người nhập eform đã nhập, không trả số tổng hợp sẵn. IOC tự tổng hợp, ghi rõ "IOC tính", và mọi số lần lại được bản ghi.'],
        k.NOTE_FILL, 'Nguyên tắc: ')

    heading('1.2. Phạm vi', 2)
    para('**Trong phạm vi:**')
    bullets([f'{len(UNITS)} sở, ngành, {N_EF} eform (Bảng 2.1, 2.2).',
             'Hợp đồng API sở cung cấp cho IOC; cách IOC kéo, kiểm tra, lưu, đối soát dữ liệu; yêu cầu phi chức năng; kiểm thử, nghiệm thu, bàn giao.',
             'Từ điển dữ liệu và bảng mapping nguồn (API) → đích (IOC) cho từng trường.'])
    para('**Ngoài phạm vi:**')
    bullets(['Ba đơn vị đã có API: Trung tâm Phục vụ hành chính công, Sở Tài chính, Sở Giáo dục và Đào tạo (đã có báo cáo đối chiếu API riêng).',
             'Bốn trục cấp Thành phố (Đảng ủy, HĐND, UBND, MTTQ) và 126 xã, phường: có tài liệu SRS riêng.',
             'Cách sở xây API bên trong hệ thống của mình (cơ sở dữ liệu, phần mềm nghiệp vụ); tài liệu chỉ quy định đầu ra API.',
             'Hệ thống nhập eform: vẫn chạy song song tới khi API của từng eform được nghiệm thu (mục 4.5).',
             'Màn hình chỉ tiêu trên IOC: giữ như đã làm theo eform (tài liệu mô tả chỉ tiêu từng sở). Đổi nguồn sang API không đổi màn hình, chỉ thêm dòng nguồn dữ liệu.'])

    heading('1.3. Thuật ngữ', 2)
    table([['Thuật ngữ', 'Giải thích'],
           ['Eform', 'Biểu mẫu điện tử sở, ngành dùng để nhập số liệu báo cáo; khung từng eform mô tả trong "File mô tả đầu vào eform"'],
           ['Khung eform', 'Danh sách trường của một eform: tên, mã, kiểu (Số, Chữ, Danh mục, Ngày tháng), danh mục, thứ tự. Trên IOC sinh từ file, không sửa tay'],
           ['Mã eform', 'Mã IOC đặt cho từng eform (ví dụ sct1). Dùng làm mã trong đường dẫn API để hai bên nói cùng một eform'],
           ['Bản ghi', 'Một dòng dữ liệu đã nhập vào eform (ví dụ: kim ngạch của một doanh nghiệp tại một phường trong một tháng)'],
           ['Khóa bản ghi', 'Tập trường xác định một bản ghi về nghiệp vụ, đã chốt ở bản đọc eform (ví dụ «Địa bàn» + «Thôn/TDP» + kỳ)'],
           ['Trường kỹ thuật', 'ma_ban_ghi, thoi_diem_cap_nhat, da_xoa: do hệ thống của sở sinh, chỉ phục vụ đồng bộ, không phải chỉ tiêu'],
           ['Kỳ', 'Tháng, Quý hoặc Năm của bản ghi, lấy từ các trường «Kỳ báo cáo», «Năm», «Tháng», «Quý» của eform'],
           ['Đồng bộ lần đầu', 'Lần kéo toàn bộ bản ghi của một eform về IOC'],
           ['Đồng bộ tăng thêm', 'Các lần kéo sau, chỉ lấy bản ghi thêm, sửa, xóa từ mốc lần trước'],
           ['Hồi tố', 'Sở sửa số liệu của kỳ đã qua'],
           ['Đối soát', 'So số bản ghi và tổng các trường Số giữa API của sở và kho IOC để phát hiện thiếu, thừa, lệch'],
           ['OpenAPI', 'Chuẩn mô tả API dạng file (YAML/JSON) để dev hai bên dùng chung, sinh mã, kiểm thử tự động'],
           ['Nền tảng tích hợp', 'Nền tảng chia sẻ, tích hợp dữ liệu dùng chung của Thành phố (LGSP), nếu chọn đi qua'],
           ['SLA', 'Cam kết mức dịch vụ: thời gian hoạt động, thời gian phản hồi, độ trễ dữ liệu, thời gian khắc phục'],
           ['UAT', 'Kiểm thử chấp nhận của người dùng: sở và IOC cùng chạy kịch bản, ký xác nhận'],
           [CHO, 'Đề xuất của tài liệu, cần các bên chốt trong buổi review'],
           ], [3.6, 12.4], size=11)

    heading('1.4. Căn cứ và tài liệu liên quan', 2)
    table([['Tài liệu', 'Dùng để'],
           ['"File mô tả đầu vào eform" (Google Sheets, ' + SHEET_URL + ')', 'Nguồn duy nhất của trường, kiểu, danh mục từng eform'],
           ['js/core/eform-khung.js', 'Khung eform trên IOC, sinh từ file eform. Bảng trường trong bộ tài liệu này đọc thẳng từ đây'],
           ['docs/BAN_DOC_EFORM/SO_*, TRUC_UBND_VPUB_* (duyệt 28/10/2026)', 'Một bản ghi là gì, khóa bản ghi, loại số, chỉ tiêu dự kiến, kiểm tra, lỗi trong file eform'],
           ['docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28', 'Quy ước chỉ tiêu theo eform bản 2.0'],
           ['Tài liệu mô tả chỉ tiêu từng sở (docs/<SỞ>/*_MO_TA_CHI_TIEU)', 'Chỉ tiêu, cách tính, biểu đồ đang hiện trên IOC'],
           ['Báo cáo đối chiếu API Sở Tài chính, Sở GD&ĐT (10/2026)', 'Bài học từ các API đã có (mục 3.2)'],
           ['QĐ 4795 về bộ chỉ tiêu theo dõi', 'Căn cứ chỉ tiêu. Nhiều eform ghi mã chỉ tiêu theo QĐ này (cột "Căn cứ ghi trên eform", Bảng 2.2). '
                                              'Tài liệu chỉ nhắc mã khi eform có ghi; không dựng chỉ tiêu, không thêm trường ngoài eform'],
           ], [6.5, 9.5], size=11)

    heading('1.5. Quy ước mã yêu cầu', 2)
    bullets(['**FR-xx**: yêu cầu chức năng (API của sở, việc IOC làm). **NFR-xx**: yêu cầu phi chức năng. **DR-xx**: quy tắc dữ liệu.',
             '**TC-xx**: test case chung; **TC-<SỞ>-xx**: test case riêng ở tài liệu từng sở. **G-xx**: khoảng thiếu. **V-xx**: vấn đề còn mở.',
             '"Phải" là yêu cầu bắt buộc để nghiệm thu; "nên" là khuyến nghị. ' + CHO + ' là đề xuất, cần chốt.'])

    heading('1.6. Đối chiếu đầu việc BA với tài liệu', 2)
    table([['#', 'Đầu việc', 'Ở đâu trong bộ tài liệu', 'Còn cần'],
           ['1', 'Chuẩn hóa danh mục chỉ tiêu', f'Mục 2.2 ({N_EF} eform, căn cứ QĐ ghi trên eform); tài liệu từng sở mục 1.3', 'Lãnh đạo dự án chốt mức ưu tiên triển khai (mục 2.4)'],
           ['2', 'Làm rõ nghiệp vụ từng chỉ tiêu', 'Tài liệu từng sở mục 3 (phiếu mô tả từng eform)', 'Đầu mối nghiệp vụ sở xác nhận'],
           ['3', 'Danh mục nguồn, đầu mối', 'Mục 2.1, 2.3; tài liệu từng sở mục 1.2', 'Tên đầu mối; công văn danh mục nguồn'],
           ['4', 'Khảo sát API thực tế', 'Mục 3; tài liệu từng sở mục 2.2 (hồ sơ khảo sát)', 'Sở cung cấp tài liệu, môi trường thử'],
           ['5', 'Mức đáp ứng, danh sách thiếu', 'Mục 3.3, 3.4; tài liệu từng sở mục 2.1, 5; Excel sheet EFORM', 'Bên xử lý, hạn'],
           ['6', 'Phương án tích hợp', 'Mục 4', 'Kiến trúc sư, bên cung cấp chốt'],
           ['7', 'Từ điển dữ liệu, mapping', 'Mục 5.4; tài liệu từng sở mục 3; Excel sheet TU_DIEN_MAPPING, DANH_MUC', '—'],
           ['8', 'SRS tích hợp API, hợp đồng', 'Mục 5, 6, 7; OpenAPI từng sở (ky_thuat/openapi)', 'Chốt các mục ' + CHO],
           ['9', 'Kiểm thử, nghiệm thu', 'Mục 9; tài liệu từng sở mục 4', 'Bộ dữ liệu đối soát sở xác nhận'],
           ['10', 'Review, bàn giao, thay đổi', 'Mục 8, 10', 'Họp review'],
           ], [0.8, 3.6, 7.0, 4.6], size=10.5)

    # ---------------- 2
    heading('2. DANH MỤC CHỈ TIÊU VÀ NGUỒN DỮ LIỆU', 1)
    heading('2.1. Nguyên tắc', 2)
    bullets(['**Eform là nguồn.** Chỉ tiêu trên IOC dựng từ trường eform. API là đường chuyển dữ liệu của chính các trường đó, thay cho nhập tay.',
             '**Một eform, một API.** Mỗi eform có một đường dẫn lấy bản ghi riêng; mã eform trong đường dẫn là mã IOC (Bảng 2.2).',
             '**Chủ quản dữ liệu là sở, ngành.** Sở chịu trách nhiệm về số liệu, xây dựng và vận hành API. IOC chỉ đọc, không sửa số của sở.',
             '**QĐ 4795** được nhắc khi eform có ghi mã chỉ tiêu; tài liệu không đối chiếu toàn bộ QĐ.'])
    heading('2.2. Bảng 2.1 — Sở, ngành trong phạm vi', 2)
    table([['#', 'Sở, ngành', 'Eform', 'Trường', 'Tài liệu riêng', 'Đầu mối nghiệp vụ / kỹ thuật']] +
          [[str(i + 1), u['ten'], str(len(u['efs'])), str(u['nf']), u['file'], '…… / ……'] for i, u in enumerate(UNITS)] +
          [['', '**Cộng**', f'**{N_EF}**', f'**{N_F}**', '', '']],
          [0.8, 4.6, 1.3, 1.4, 5.0, 2.9], size=10)
    heading('Bảng 2.2 — Eform, API và căn cứ chỉ tiêu', 2)
    rows = [['Sở', 'Mã eform', 'Eform', 'Trường', 'Kỳ / Địa bàn', 'Căn cứ ghi trên eform']]
    for u in UNITS:
        for x in u['efs']:
            e = x['e']
            rows.append([u['ma'], e['id'], e['ten'], str(len(e['fields'])),
                         ('Có kỳ' if x['ky'] else 'Không có trường kỳ') + ' / ' + ('có «Địa bàn»' if x['db'] else 'không'), x['cc']])
    table(rows, [1.2, 1.4, 5.6, 1.2, 2.8, 3.8], size=9.5, mono_col=1)
    note('Kỳ: eform có «Kỳ báo cáo», «Năm», «Tháng», «Quý» thì API lọc được theo kỳ. Eform không có trường kỳ: IOC lấy theo thời điểm cập nhật.')

    heading('2.3. Phân công trách nhiệm', 2)
    table([['Bên', 'Trách nhiệm'],
           ['Sở, ngành: đầu mối nghiệp vụ', 'Xác nhận ý nghĩa trường, khóa bản ghi, trường bắt buộc, đơn vị tính; xác nhận bộ dữ liệu đối soát; ký biên bản nghiệm thu'],
           ['Sở, ngành: đầu mối kỹ thuật / bên cung cấp API', 'Xây dựng, vận hành API theo hợp đồng; cấp môi trường thử, tài khoản cho IOC; báo trước bảo trì, thay đổi; xử lý sự cố phía sở'],
           ['Nhóm BA IOC', 'Bộ tài liệu này; khảo sát, đối chiếu mức đáp ứng; theo dõi vấn đề mở; cập nhật tài liệu khi eform, API thay đổi'],
           ['Nhóm dev IOC', 'Bộ kéo dữ liệu, kiểm tra, lưu, đối soát, cảnh báo; chuyển nguồn eform sang API'],
           ['Nhóm QA IOC', 'Chạy test case chung và riêng; tổng hợp kết quả UAT'],
           ['Kiến trúc sư hệ thống', 'Chốt phương án kết nối (mục 4.3), bảo mật, hạ tầng'],
           ['Đơn vị quản lý nền tảng tích hợp', 'Chỉ khi chọn đi qua nền tảng chung: đăng ký dịch vụ, cấp quyền, giám sát'],
           ], [5.2, 10.8], size=10.5)

    heading('2.4. Mức ưu tiên triển khai ' + CHO, 2)
    para('Đề xuất thứ tự (lãnh đạo dự án chốt): (1) sở có nhiều bản ghi, cập nhật thường xuyên, nhập tay tốn công nhất; (2) sở đã có phần mềm nghiệp vụ chứa sẵn dữ liệu; '
         '(3) các sở còn lại. Thứ tự cụ thể chỉ chốt được sau khảo sát (mục 3.3).')

    # ---------------- 3
    heading('3. HIỆN TRẠNG VÀ MỨC ĐÁP ỨNG', 1)
    heading('3.1. Hiện trạng', 2)
    bullets([f'Cả {len(UNITS)} sở, ngành đang nhập tay qua eform; chưa có API, chưa có tài liệu API, chưa có môi trường thử.',
             'Chưa rõ dữ liệu gốc của từng eform đang nằm ở đâu phía sở (phần mềm nghiệp vụ, file tổng hợp, hay chỉ có trên eform). Đây là câu hỏi đầu tiên của khảo sát.',
             'Nếu sở không có hệ thống nào chứa dữ liệu thì chưa xây được API; eform đó tiếp tục nhập tay. Ghi kết luận này vào hồ sơ khảo sát.'])
    heading('3.2. Bài học từ các API đã có', 2)
    para('Đối chiếu API của Sở Tài chính, Sở GD&ĐT (10/2026) cho thấy các lỗi cần tránh ngay trong hợp đồng:')
    table([['Đã gặp', 'Yêu cầu trong tài liệu này'],
           ['API trả số tổng toàn Thành phố, không có số theo xã, phường', 'Trả từng bản ghi, đủ «Địa bàn» như eform (FR-03, DR-01)'],
           ['Chỉ gọi được theo quý; chỉ tiêu cần số tháng không lấy được', 'Lọc theo đủ trường kỳ của eform: Tháng, Quý, Năm (FR-03)'],
           ['Phần lớn API trả toàn số 0 (chưa có số vẫn trả 0)', 'Chưa có số thì null, không trả 0 (DR-05); đối soát với bộ số sở xác nhận (TC-23)'],
           ['Thiếu nhiều trường so với eform', 'Đủ mọi trường eform, đúng mã, kiểu, thứ tự; có đường dẫn trả khung để kiểm tự động (FR-02, TC-04)'],
           ], [7.0, 9.0], size=10.5)
    heading('3.3. Khảo sát API: mức đáp ứng và hồ sơ khảo sát', 2)
    para('Mỗi eform được xếp một trong các mức:')
    table([['Mức', 'Nghĩa'],
           ['Đủ', 'API trả đủ mọi trường eform, đúng kiểu, đúng mức chi tiết (bản ghi, địa bàn, kỳ)'],
           ['Một phần', 'Có API nhưng thiếu trường, thiếu địa bàn hoặc thiếu kỳ'],
           ['Có thể tính', 'API không trả thẳng trường nhưng tính được từ trường khác có trong API (ghi công thức, sở xác nhận)'],
           ['Chưa đáp ứng', 'Chưa có API cho eform'],
           ['Chưa xác minh', 'Có tài liệu API nhưng chưa thử được, hoặc chưa có dữ liệu thật'],
           ], [3.0, 13.0], size=10.5)
    para(f'**Hiện tại cả {N_EF} eform ở mức "Chưa đáp ứng".** Khi sở gửi tài liệu API, BA lập hồ sơ khảo sát theo mẫu ở tài liệu từng sở (mục 2.2) và xếp lại mức.')
    heading('3.4. Khoảng thiếu chung', 2)
    table([['Mã', 'Khoảng thiếu', 'Bên xử lý', 'Hạn'],
           ['G-01', f'Chưa có API cho {N_EF} eform', 'Sở, ngành (đầu mối kỹ thuật)', '……'],
           ['G-02', 'Chưa có đầu mối nghiệp vụ, kỹ thuật từng sở', 'Lãnh đạo dự án đề nghị sở cử', '……'],
           ['G-03', 'Eform không có mã bản ghi, thời điểm cập nhật, cờ xóa → API phải bổ sung 3 trường kỹ thuật', 'Bên xây API của sở', 'Theo G-01'],
           ['G-04', 'Một số trường để trống kiểu, đơn vị tính chưa rõ, trường Chữ không danh mục (gõ khác nhau)', 'Đầu mối nghiệp vụ sở xác nhận (danh sách ở tài liệu từng sở)', '……'],
           ['G-05', 'Chưa có bộ dữ liệu đối soát sở xác nhận', 'Đầu mối nghiệp vụ sở', 'Trước UAT'],
           ['G-06', 'Chưa chốt phương án kết nối, xác thực, SLA', 'Kiến trúc sư IOC + bên cung cấp', 'Buổi review'],
           ['G-07', 'Chưa có công văn danh mục nguồn chính thức', 'Lãnh đạo dự án', '……'],
           ], [1.3, 7.7, 4.8, 2.2], size=10.5)

    # ---------------- 4
    heading('4. PHƯƠNG ÁN TÍCH HỢP', 1)
    heading('4.1. Mô hình đã chốt', 2)
    para('**Sở mở API, IOC định kỳ gọi sang kéo dữ liệu về** (chốt 31/10/2026). Sở không phải đẩy dữ liệu; IOC chủ động lịch kéo, gọi lại khi lỗi, đối soát.')
    heading('4.2. Luồng dữ liệu', 2)
    table([['Bước', 'Bên', 'Việc', 'Đầu ra'],
           ['1', 'Sở', 'Cán bộ nhập, sửa dữ liệu trong phần mềm nghiệp vụ của sở', 'Bản ghi trong hệ thống sở'],
           ['2', 'Sở', 'API đọc bản ghi, trả theo khung eform + 3 trường kỹ thuật', 'Phản hồi JSON'],
           ['3', 'IOC', 'Bộ kéo dữ liệu gọi API theo lịch (lần đầu: toàn bộ; sau: phần thay đổi)', 'Gói dữ liệu thô'],
           ['4', 'IOC', 'Lưu nguyên gói dữ liệu thô vào vùng tạm (để tra lại, chạy lại)', 'Vùng tạm'],
           ['5', 'IOC', 'Kiểm tra theo khung eform (kiểu, danh mục, khóa, kỳ); đánh dấu bản ghi lỗi, không sửa số', 'Bản ghi đã kiểm'],
           ['6', 'IOC', 'Ghi vào kho chỉ tiêu theo mã bản ghi (thêm, sửa, xóa); ghi nhật ký thay đổi', 'Kho chỉ tiêu'],
           ['7', 'IOC', 'Tính chỉ tiêu, hiện màn hình như hiện nay; ghi nguồn "API <sở>, cập nhật lúc …"', 'Màn hình chỉ tiêu'],
           ['8', 'IOC', 'Đối soát hằng ngày với API; cảnh báo khi lệch, lỗi, quá hạn chưa có dữ liệu', 'Báo cáo đối soát, cảnh báo'],
           ], [1.2, 1.4, 9.0, 4.4], size=10.5)
    code(k, '[Phần mềm nghiệp vụ sở] → [API sở ' + BASE + '] ──HTTPS, xác thực──▶ [Bộ kéo dữ liệu IOC (lịch)]\n'
            '      → [Vùng tạm: dữ liệu thô] → [Kiểm tra theo khung eform] → [Kho chỉ tiêu IOC]\n'
            '      → [Màn hình chỉ tiêu, Dữ liệu đã nhập]          [Đối soát hằng ngày] ─▶ [Cảnh báo]', 'text', 'Sơ đồ luồng')
    heading('4.3. Phương án kết nối ' + CHO, 2)
    table([['Tiêu chí', 'PA1 — IOC gọi thẳng API của sở', 'PA2 — Đi qua nền tảng tích hợp của Thành phố (LGSP)'],
           ['Thời gian triển khai', 'Nhanh, chỉ hai bên', 'Lâu hơn: đăng ký dịch vụ, cấp quyền trên nền tảng'],
           ['Bảo mật', 'Mỗi sở tự mở cổng, tự cấp tài khoản cho IOC', 'Tập trung: xác thực, giám sát, nhật ký tại nền tảng'],
           ['Phụ thuộc', 'Chỉ phụ thuộc sở', 'Thêm phụ thuộc vào nền tảng (sự cố nền tảng ảnh hưởng mọi sở)'],
           ['Chuẩn hóa', 'Dễ lệch giữa các sở nếu không bám hợp đồng', 'Dễ áp một chuẩn chung'],
           ['Phù hợp', 'Sở chưa kết nối nền tảng, cần chạy sớm', 'Sở đã có dịch vụ trên nền tảng'],
           ], [3.2, 6.4, 6.4], size=10.5)
    para('Đề xuất: **hợp đồng API giống nhau ở cả hai phương án** (đường dẫn, tham số, cấu trúc dữ liệu), chỉ khác địa chỉ máy chủ và cách xác thực. '
         'Sở đã có trên nền tảng tích hợp thì đi PA2; sở chưa có thì đi PA1, sau chuyển PA2 không phải sửa IOC. Kiến trúc sư chốt.')
    heading('4.4. Nơi chuẩn hóa và tính chỉ tiêu', 2)
    bullets(['Sở trả **bản ghi gốc**, không tính tổng, không tính tỷ lệ thay cho trường đã nhập.',
             'IOC chuẩn hóa (mục 5.4) và tính chỉ tiêu. Số IOC tính ghi rõ "IOC tính" và công thức theo tên trường; số đã nhập (trường tỷ lệ, trường tổng) hiện đúng như nhập.',
             'Lý do: mọi số trên IOC phải lần lại được bản ghi; nếu sở gửi số tổng thì không lần lại được.'])
    heading('4.5. Nguồn ưu tiên và chuyển từ eform sang API ' + CHO, 2)
    bullets(['Mỗi eform tại một thời điểm chỉ có **một nguồn** (eform hoặc API), đặt bằng cờ trên IOC theo từng eform. **Không cộng hai nguồn.**',
             'Giai đoạn chạy song song (đề xuất 1 kỳ báo cáo): IOC kéo API vào vùng thử, vẫn hiện số eform; báo cáo lệch giữa hai nguồn cho sở xác nhận.',
             'Sau khi eform đó qua UAT: chuyển cờ sang API, sở ngừng nhập eform đó. Số liệu kỳ cũ đã nhập qua eform giữ nguyên, trừ khi sở xác nhận API có đủ lịch sử để thay.',
             'Khi API sự cố kéo dài: không tự quay về eform; IOC hiện số tới lần cập nhật cuối, ghi rõ thời điểm, cảnh báo đầu mối.'])

    # ---------------- 5
    heading('5. HỢP ĐỒNG API', 1)
    heading('5.1. Nguyên tắc chung', 2)
    bullets(['REST, chỉ phương thức **GET** (IOC chỉ đọc). HTTPS, TLS 1.2 trở lên.',
             'Dữ liệu JSON, UTF-8. Tên trường trong "truong" là **mã trường eform** (ví dụ ky_bao_cao, dia_ban), đúng thứ tự eform.',
             'Thời điểm theo ISO 8601 có múi giờ (2026-10-15T08:30:00+07:00); ngày theo YYYY-MM-DD.',
             'Phiên bản nằm trong đường dẫn: ' + BASE + '. Đổi không tương thích thì lên /ioc/v2 (mục 8).',
             'Đường dẫn, tham số, cấu trúc giống nhau cho mọi sở; chỉ khác mã eform và khung trường.'])
    heading('5.2. Danh sách đường dẫn', 2)
    table([['Mã', 'Đường dẫn', 'Dùng để'],
           ['FR-01', f'GET {BASE}/eform', 'Danh sách eform sở cung cấp: mã, tên, phiên bản khung, số trường'],
           ['FR-02', f'GET {BASE}/eform/{{ma_eform}}', 'Khung eform: mọi trường đúng thứ tự, mã, tên, kiểu, danh mục. IOC so với khung của mình để phát hiện lệch'],
           ['FR-03', f'GET {BASE}/eform/{{ma_eform}}/ban-ghi', 'Lấy bản ghi, lọc theo kỳ, địa bàn, thời điểm cập nhật; có phân trang'],
           ['FR-04', f'GET {BASE}/eform/{{ma_eform}}/ban-ghi/{{ma_ban_ghi}}', 'Lấy một bản ghi (tra lại, đối chiếu)'],
           ['FR-05', f'GET {BASE}/eform/{{ma_eform}}/danh-muc/{{ma_truong}}', 'Danh mục của một trường Danh mục: mã, tên'],
           ['FR-06', f'GET {BASE}/eform/{{ma_eform}}/doi-soat', 'Số bản ghi và tổng thô từng trường Số theo kỳ, để đối soát'],
           ['FR-07', f'GET {BASE}/trang-thai', 'Kiểm tra API còn sống'],
           ], [1.4, 7.2, 7.4], size=10, mono_col=1)
    heading('5.3. FR-03 — Lấy bản ghi', 2)
    table([['Tham số', 'Kiểu', 'Bắt buộc', 'Ý nghĩa'],
           ['ky_bao_cao', 'string', 'Không', 'Mã kỳ theo danh mục «Kỳ báo cáo» của eform (Tháng, Quý, Năm). Chỉ có ở eform có trường này'],
           ['nam', 'integer', 'Không', 'Lọc theo «Năm»'],
           ['thang', 'integer 1–12', 'Không', 'Lọc theo «Tháng»'],
           ['quy', 'string', 'Không', 'Mã quý theo danh mục «Quý» của eform'],
           ['dia_ban', 'string', 'Không', 'Mã xã, phường theo danh mục «Địa bàn» của eform. Chỉ có ở eform có «Địa bàn»'],
           ['cap_nhat_tu', 'date-time', 'Không', 'Chỉ trả bản ghi có thoi_diem_cap_nhat ≥ giá trị này (đồng bộ tăng thêm). Có tham số này thì trả cả bản ghi đã xóa'],
           ['gom_da_xoa', 'boolean', 'Không', 'Mặc định false; true thì trả cả bản ghi da_xoa = true'],
           ['trang', 'integer ≥ 1', 'Không', 'Mặc định 1'],
           ['so_ban_ghi', 'integer 1–1000', 'Không', 'Số bản ghi mỗi trang, mặc định 200'],
           ], [2.6, 2.4, 1.8, 9.2], size=10, mono_col=0)
    bullets(['Lọc theo **giá trị trường eform**, API không gộp kỳ: hỏi Quý thì trả bản ghi có «Kỳ báo cáo» = Quý; IOC tự gộp tháng thành quý, năm theo quy tắc từng eform.',
             'Sắp xếp ổn định: thoi_diem_cap_nhat tăng dần, rồi ma_ban_ghi tăng dần, để phân trang không trùng, không sót.',
             'Kỳ không có dữ liệu: trả 200 với "ban_ghi": [] (không trả 404).'])
    code(k, json.dumps(vi_du_trang(UNITS[6]['efs'][0]), ensure_ascii=False, indent=2),
         'json', f'Ví dụ: GET {BASE}/eform/sct1/ban-ghi?ky_bao_cao=thang&nam=2026&thang=9 (bản ghi mẫu, giá trị lấy từ dữ liệu mẫu trong file eform)')
    heading('5.4. Cấu trúc bản ghi và quy tắc dữ liệu', 2)
    table([['Phần', 'Trường', 'Kiểu', 'Ý nghĩa'],
           ['Kỹ thuật', 'ma_ban_ghi', 'string', 'Mã duy nhất, không đổi suốt đời bản ghi, do hệ thống sở sinh. IOC dùng để thêm, sửa, xóa, chống trùng'],
           ['Kỹ thuật', 'thoi_diem_cap_nhat', 'date-time', 'Lần thêm hoặc sửa gần nhất. Mỗi lần sửa phải tăng'],
           ['Kỹ thuật', 'da_xoa', 'boolean', 'true khi bản ghi đã bị xóa phía sở (xóa mềm). Giữ ít nhất 90 ngày để IOC kịp nhận'],
           ['Eform', 'truong', 'object', 'Mọi trường eform, khóa là mã trường, đúng thứ tự eform. Đủ trường kể cả khi giá trị null'],
           ], [1.8, 3.4, 2.2, 8.6], size=10.5, mono_col=1)
    table([['Mã', 'Quy tắc'],
           ['DR-01', '"truong" có **đủ mọi trường** của khung eform, không thiếu, không thêm trường nghiệp vụ ngoài eform.'],
           ['DR-02', '**Số** → number JSON: dấu chấm thập phân, không dấu phân cách nghìn, không kèm đơn vị, không làm tròn khác số đã nhập.'],
           ['DR-03', '**Chữ** → string, giữ nguyên chữ đã nhập. Trường Chữ có kèm danh sách trong file eform **vẫn là Chữ**: gửi đúng chữ, không đổi thành mã.'],
           ['DR-04', '**Danh mục** → {"ma": "<mã>", "ten": "<tên hiển thị>"}, mã đúng danh mục của eform (sheet DANH_MUC). Thêm mã mới phải báo trước (mục 8).'],
           ['DR-05', 'Không có giá trị → **null**. Không dùng 0, chuỗi rỗng, "N/A" thay cho null.'],
           ['DR-06', '**Ngày tháng** → "YYYY-MM-DD". Trường để trống kiểu trong file eform: gửi string tới khi sở xác nhận kiểu.'],
           ['DR-07', '**Địa bàn** gửi mã xã, phường theo danh mục «Địa bàn» của eform (126 xã, phường); IOC tự nối sang hồ sơ xã.'],
           ['DR-08', 'Trường tổng, trường tỷ lệ do người nhập điền: gửi đúng số đã nhập, không tính lại phía API.'],
           ], [1.4, 14.6], size=10.5)
    para('**Mapping nguồn → đích:** trường «truong.<mã>» của API đổ vào trường cùng mã của eform tương ứng trên IOC (1–1, không đổi tên). Quy tắc chuyển theo kiểu:')
    table([['Kiểu eform', 'Kiểu JSON', 'IOC xử lý khi nhận']] + [[KIEU[t], JSON_T[t], QUY_TAC[t]] for t in ('so', 'chu', 'dm', 'ngay', '')],
          [3.0, 3.6, 9.4], size=10.5)
    note(f'Bảng mapping đủ từng trường của {N_EF} eform: file Excel, sheet TU_DIEN_MAPPING; từng sở: tài liệu riêng mục 3.')
    heading('5.5. FR-06 — Đối soát', 2)
    para('Tham số giống FR-03 (trừ phân trang). Trả số bản ghi còn hiệu lực, số bản ghi đã xóa và **tổng thô** của từng trường Số (cộng thẳng giá trị đã nhập, '
         'kể cả trường tỷ lệ). Tổng thô chỉ dùng để so khớp hai bên, không phải chỉ tiêu, không hiển thị.')
    code(k, json.dumps({'ma_eform': 'sct1', 'loc': {'ky_bao_cao': 'thang', 'nam': 2026, 'thang': 9}, 'so_ban_ghi': 412, 'so_ban_ghi_da_xoa': 3,
                        'tong': {'kim_ngach_xuat_khau_usd': 1520033.5, 'kim_ngach_nhap_khau_usd': 980411.0, 'tong_kim_ngach_xnk_usd': 2500444.5},
                        'thoi_diem_chot': '2026-10-31T02:00:00+07:00'}, ensure_ascii=False, indent=2), 'json', 'Ví dụ phản hồi đối soát (số mẫu)')
    heading('5.6. Xác thực, phân quyền ' + CHO, 2)
    bullets(['Đề xuất **OAuth 2.0 client credentials**: IOC lấy token (hạn 60 phút) rồi gọi API với "Authorization: Bearer <token>". '
             'Sở chưa làm được OAuth thì dùng khóa API trong tiêu đề "X-API-Key".',
             'Mỗi sở cấp cho IOC **một tài khoản chỉ đọc**, quyền theo từng eform. Giới hạn địa chỉ IP máy chủ IOC.',
             'Đổi khóa bí mật định kỳ 6 tháng hoặc ngay khi nghi lộ; hai bên báo nhau qua đầu mối kỹ thuật.',
             'Đi qua nền tảng tích hợp (PA2) thì theo cơ chế xác thực của nền tảng.'])
    heading('5.7. Mã lỗi', 2)
    table([['HTTP', 'ma_loi', 'Khi nào', 'IOC xử lý'],
           ['400', 'THAM_SO_SAI', 'Tham số sai kiểu, sai mã danh mục, tháng ngoài 1–12', 'Không gọi lại; ghi log, cảnh báo dev'],
           ['401', 'CHUA_XAC_THUC', 'Thiếu, sai, hết hạn token/khóa', 'Lấy token mới, gọi lại 1 lần; vẫn lỗi thì cảnh báo'],
           ['403', 'KHONG_CO_QUYEN', 'Tài khoản không có quyền eform này', 'Không gọi lại; cảnh báo đầu mối kỹ thuật sở'],
           ['404', 'KHONG_TIM_THAY', 'Sai mã eform, mã bản ghi', 'Không gọi lại; cảnh báo'],
           ['429', 'QUA_GIOI_HAN', 'Gọi quá giới hạn tần suất', 'Chờ theo tiêu đề Retry-After rồi gọi lại'],
           ['500', 'LOI_MAY_CHU', 'Lỗi phía sở', 'Gọi lại theo FR-12'],
           ['503', 'DANG_BAO_TRI', 'Bảo trì, quá tải', 'Gọi lại theo FR-12; tôn trọng Retry-After'],
           ], [1.2, 3.4, 5.6, 5.8], size=10, mono_col=1)
    code(k, json.dumps({'ma_loi': 'THAM_SO_SAI', 'thong_diep': 'Tham số thang phải từ 1 đến 12', 'chi_tiet': {'tham_so': 'thang', 'gia_tri': '13'},
                        'ma_theo_doi': 'a1b2c3d4'}, ensure_ascii=False, indent=2), 'json', 'Cấu trúc phản hồi lỗi')
    heading('5.8. Giới hạn tần suất', 2)
    para('API phải cho IOC gọi ít nhất **60 lượt/phút**; vượt thì trả 429 kèm Retry-After. IOC gọi tuần tự từng eform, không gọi song song quá 2 luồng mỗi sở. ' + CHO)

    # ---------------- 6
    heading('6. ĐỒNG BỘ DỮ LIỆU (VIỆC IOC LÀM)', 1)
    reqs = [
        ('FR-08. Đồng bộ lần đầu', ['Kéo toàn bộ bản ghi từng eform theo trang, từ kỳ đầu tiên sở có dữ liệu (sở xác nhận kỳ bắt đầu).',
                                    'Xong thì so tổng số bản ghi với tong_so_ban_ghi; lệch thì chạy lại, không chuyển sang đồng bộ tăng thêm.']),
        ('FR-09. Đồng bộ tăng thêm', ['Mặc định **60 phút một lần** ' + CHO + ': gọi FR-03 với cap_nhat_tu = mốc lần thành công trước **trừ 10 phút** (chồng lấn để không sót bản ghi ghi muộn).',
                                      'Ghi vào kho theo ma_ban_ghi: chưa có thì thêm, có rồi thì sửa nếu thoi_diem_cap_nhat mới hơn, da_xoa = true thì xóa khỏi số liệu.',
                                      'Chỉ dời mốc khi kéo xong mọi trang của eform.']),
        ('FR-10. Sửa, xóa, hồi tố', ['Sửa bản ghi (kể cả kỳ đã qua): IOC thay giá trị, tính lại chỉ tiêu của kỳ đó, ghi nhật ký (giá trị cũ, mới, thời điểm, nguồn).',
                                     'Xóa: bản ghi không còn vào số liệu nhưng vẫn tra được trong nhật ký.',
                                     'So sánh kỳ trên màn hình dùng số mới nhất; nhật ký cho biết kỳ nào đã bị sửa sau khi chốt.']),
        ('FR-11. Chống trùng', ['Theo ma_ban_ghi: nhận lại cùng bản ghi nhiều lần không nhân đôi.',
                                'Theo khóa bản ghi nghiệp vụ (tài liệu từng sở): hai ma_ban_ghi khác nhau cùng khóa, cùng kỳ → lấy bản cập nhật sau, đánh dấu cả hai "trùng khóa" để sở xem lại.',
                                'Bản tháng và bản quý cùng khóa không cộng chồng (theo quy tắc kỳ đã chốt).']),
        ('FR-12. Gọi lại khi lỗi', ['Hết giờ chờ 30 giây hoặc lỗi 5xx: gọi lại tối đa 3 lần, cách 1, 2, 4 phút.',
                                    'Lỗi 4xx (trừ 401, 429) không gọi lại. Vẫn lỗi: giữ mốc cũ, lần chạy sau làm lại từ mốc cũ; cảnh báo.',
                                    'Mọi lần ghi đều theo ma_ban_ghi nên chạy lại bao nhiêu lần cũng cho cùng kết quả.']),
        ('FR-13. Đối soát', ['Hằng ngày 02:00: với từng eform, gọi FR-06 cho kỳ hiện tại và kỳ liền trước; so số bản ghi, tổng thô từng trường Số với kho IOC.',
                             'Hằng tuần: đối soát mọi kỳ. Lệch: kéo lại toàn bộ kỳ lệch; vẫn lệch thì cảnh báo.',
                             'Cuối kỳ báo cáo: so với bộ số sở xác nhận (nếu có).']),
        ('FR-14. Kiểm tra dữ liệu nhận về', ['Mã danh mục ngoài danh mục, ô Số không phải số, ngày sai, thiếu khóa, thiếu kỳ, thiếu trường, có trường lạ.',
                                             'Bản ghi lỗi **vẫn nhận, không tự sửa số**, đánh dấu "cần xem lại" như bản ghi eform hiện nay; trường lạ bỏ qua và cảnh báo.',
                                             'Kiểm tra riêng từng eform (ví dụ tổng khác tổng các phần): tài liệu từng sở.']),
        ('FR-15. Nhật ký', ['Mỗi lần gọi: thời điểm, đường dẫn, tham số (không ghi token), mã HTTP, số bản ghi, thời gian phản hồi.',
                            'Mỗi thay đổi bản ghi: ma_ban_ghi, giá trị cũ, mới. Lưu 12 tháng ' + CHO + '.']),
        ('FR-16. Cảnh báo', ['Gửi đầu mối kỹ thuật sở và nhóm vận hành IOC khi: lỗi sau 3 lần gọi lại; 24 giờ liền không kéo được; đối soát lệch; '
                             'khung trả về (FR-02) khác khung IOC; tỷ lệ bản ghi lỗi trên 5%; quá hạn báo cáo mà kỳ chưa có bản ghi.']),
        ('FR-17. Hiển thị nguồn trên IOC', ['Thẻ eform ghi "Nguồn: API <sở>, cập nhật lúc …"; màn "Dữ liệu đã nhập" thêm cột ma_ban_ghi (cột kỹ thuật, đặt cuối).',
                                            'Mọi số vẫn lần lại được bản ghi như hiện nay.']),
    ]
    for t, items in reqs:
        heading(t, 2); bullets(items)

    # ---------------- 7
    heading('7. YÊU CẦU PHI CHỨC NĂNG (SLA) ' + CHO, 1)
    table([['Mã', 'Yêu cầu', 'Mức đề xuất'],
           ['NFR-01', 'Thời gian API hoạt động', '≥ 99% trong giờ hành chính; ≥ 98% cả tuần'],
           ['NFR-02', 'Thời gian phản hồi', '95% lượt gọi ≤ 3 giây với trang 200 bản ghi; không lượt nào quá 30 giây'],
           ['NFR-03', 'Độ trễ dữ liệu', 'Bản ghi sở nhập, sửa có trên API ≤ 15 phút; lên màn hình IOC ≤ 75 phút'],
           ['NFR-04', 'Bảo mật', 'HTTPS; tài khoản chỉ đọc; giới hạn IP; không ghi token vào nhật ký; dữ liệu cá nhân (nếu eform có) chỉ dùng đúng mục đích, theo quy định về bảo vệ dữ liệu cá nhân'],
           ['NFR-05', 'Bảo trì', 'Báo trước ít nhất 2 ngày làm việc; tránh giờ đối soát 01:00–03:00'],
           ['NFR-06', 'Sự cố', 'Tiếp nhận trong giờ hành chính; mức nghiêm trọng (mất toàn bộ API) khắc phục ≤ 1 ngày làm việc'],
           ['NFR-07', 'Lưu bản ghi đã xóa', 'Giữ bản ghi da_xoa = true ít nhất 90 ngày'],
           ['NFR-08', 'Môi trường thử', 'Sở có môi trường thử cùng hợp đồng, dữ liệu mẫu đủ mọi eform, dùng được trong suốt thời gian kiểm thử'],
           ], [1.6, 3.6, 10.8], size=10.5)

    # ---------------- 8
    heading('8. QUẢN LÝ PHIÊN BẢN VÀ THAY ĐỔI', 1)
    bullets(['**Phiên bản API** trong đường dẫn (' + BASE + '). **Phiên bản khung** = ngày của file eform (trả ở FR-01, FR-02, mọi phản hồi FR-03).',
             '**Thay đổi tương thích** (thêm trường mới vào eform, thêm mã danh mục): sở báo trước ít nhất 10 ngày làm việc. IOC cập nhật khung từ file eform '
             '(sinh bằng công cụ, chạy kiểm tra --check), rồi mới nhận trường mới. Trước đó trường lạ bị bỏ qua và cảnh báo (FR-14).',
             '**Thay đổi không tương thích** (đổi mã, đổi kiểu, bỏ trường, đổi nghĩa mã danh mục): lên /ioc/v2, chạy song song với v1 ít nhất 1 tháng.',
             'Mọi thay đổi khung eform phải đi từ "File mô tả đầu vào eform"; không sửa tay khung trên IOC hay trên API.'])
    table([['Bước', 'Việc', 'Bên'],
           ['1', 'Gửi đề nghị thay đổi (eform nào, trường nào, lý do, ngày áp dụng)', 'Sở'],
           ['2', 'Đánh giá ảnh hưởng tới chỉ tiêu, màn hình, mapping; cập nhật tài liệu', 'BA IOC'],
           ['3', 'Cập nhật file eform, sinh lại khung IOC, sửa API', 'Bên eform, dev IOC, bên API sở'],
           ['4', 'Chạy lại test case liên quan trên môi trường thử', 'QA IOC + sở'],
           ['5', 'Áp dụng, ghi nhật ký phiên bản tài liệu', 'BA IOC'],
           ], [1.2, 10.8, 4.0], size=10.5)
    heading('Nhật ký phiên bản tài liệu', 2)
    table([['Phiên bản', 'Ngày', 'Nội dung', 'Người lập'], [VER, NGAY, 'Lập mới bộ tài liệu', 'BA IOC']], [2.6, 2.4, 8.0, 3.0], size=10.5)

    # ---------------- 9
    heading('9. KIỂM THỬ VÀ NGHIỆM THU', 1)
    heading('9.1. Môi trường và dữ liệu', 2)
    bullets(['Kiểm thử trên môi trường thử của sở (NFR-08), IOC dùng môi trường thử riêng; không đổi nguồn dữ liệu thật khi chưa nghiệm thu.',
             '**Bộ dữ liệu đối soát**: sở chọn ít nhất 1 kỳ tháng và 1 kỳ quý, xuất danh sách bản ghi và tổng các trường Số, đầu mối nghiệp vụ ký xác nhận. '
             'Đây là "đáp án" để so với dữ liệu IOC kéo về.'])
    heading('9.2. Test case chung', 2)
    tcs = [
        ('TC-01', 'Kết nối', 'Gọi FR-07 với tài khoản hợp lệ', '200, trạng thái "hoat_dong"'),
        ('TC-02', 'Xác thực', 'Gọi không token, token sai, token hết hạn; tài khoản không có quyền eform', '401; 403'),
        ('TC-03', 'Danh sách eform', 'Gọi FR-01', 'Đủ eform của sở theo tài liệu riêng, đúng mã eform'),
        ('TC-04', 'Khung', 'Gọi FR-02 từng eform, so với khung IOC bằng công cụ', 'Không khác: đủ trường, đúng thứ tự, mã, kiểu, danh mục'),
        ('TC-05', 'Kiểu giá trị', 'Kéo 1 trang mỗi eform, kiểm kiểu từng trường', 'Theo DR-02…DR-06; trống là null'),
        ('TC-06', 'Chữ có danh sách', 'Bản ghi có trường Chữ kèm danh sách', 'Gửi đúng chữ đã nhập, không phải mã'),
        ('TC-07', 'Lọc kỳ', 'Lọc Tháng, Quý, Năm', 'Chỉ trả bản ghi đúng kỳ; không gộp'),
        ('TC-08', 'Lọc địa bàn', 'Lọc một xã, phường', 'Chỉ trả bản ghi của xã, phường đó'),
        ('TC-09', 'Phân trang', 'Kéo hết các trang với so_ban_ghi = 50', 'Tổng bản ghi = tong_so_ban_ghi; không trùng, không sót'),
        ('TC-10', 'Đồng bộ lần đầu', 'Chạy FR-08', 'Số bản ghi IOC = API; số trên màn hình khớp bộ đối soát'),
        ('TC-11', 'Thêm mới', 'Sở thêm 1 bản ghi', 'Có trên IOC trong ≤ 75 phút'),
        ('TC-12', 'Sửa kỳ hiện tại', 'Sở sửa 1 trường Số', 'IOC đổi số, nhật ký có giá trị cũ, mới'),
        ('TC-13', 'Hồi tố', 'Sở sửa bản ghi của kỳ trước', 'IOC tính lại kỳ trước; so sánh kỳ đổi theo'),
        ('TC-14', 'Xóa', 'Sở xóa 1 bản ghi', 'API trả da_xoa = true; số trên IOC giảm tương ứng; vẫn tra được nhật ký'),
        ('TC-15', 'Trùng khóa', 'Hai bản ghi khác mã, cùng khóa nghiệp vụ, cùng kỳ', 'Lấy bản cập nhật sau; đánh dấu "trùng khóa"'),
        ('TC-16', 'Nhận lại', 'Chạy đồng bộ 2 lần liền, mốc chồng lấn', 'Không nhân đôi bản ghi'),
        ('TC-17', 'Không có dữ liệu', 'Lọc kỳ chưa nhập', 'API trả ban_ghi rỗng; IOC hiện "chưa có dữ liệu", không hiện 0'),
        ('TC-18', 'Dữ liệu lỗi', 'Mã danh mục lạ, ô Số là chữ, thiếu khóa, thiếu kỳ', 'Nhận, đánh dấu "cần xem lại", không sửa số'),
        ('TC-19', 'Khung lệch', 'API thêm trường lạ, bỏ một trường', 'Trường lạ bỏ qua; thiếu trường → cảnh báo'),
        ('TC-20', 'Lỗi máy chủ', 'Giả lập 500, quá 30 giây', 'Gọi lại 3 lần; giữ mốc; cảnh báo'),
        ('TC-21', 'Quá giới hạn', 'Giả lập 429 + Retry-After', 'IOC chờ đúng thời gian rồi gọi lại'),
        ('TC-22', 'Mất kết nối dài', 'Ngắt 1 ngày rồi nối lại', 'Lần chạy kế tiếp bù đủ, đối soát khớp'),
        ('TC-23', 'Đối soát', 'So FR-06 với kho IOC và bộ đối soát của sở', 'Khớp số bản ghi, khớp tổng từng trường Số'),
        ('TC-24', 'Hiệu năng', '100 lượt gọi trang 200 bản ghi', 'Đạt NFR-02'),
        ('TC-25', 'Lần lại bản ghi', 'Bấm một số trên màn hình IOC', 'Ra đúng các bản ghi tạo ra số đó, có ma_ban_ghi'),
        ('TC-26', 'Nguồn hiển thị', 'Mở thẻ eform đã chuyển sang API', 'Ghi "Nguồn: API <sở>, cập nhật lúc …"'),
        ('TC-27', 'Chuyển nguồn', 'Chuyển cờ eform → API', 'Không cộng chồng hai nguồn; kỳ cũ giữ đúng'),
    ]
    table([['Mã', 'Nhóm', 'Kịch bản', 'Kết quả mong đợi']] + [list(x) for x in tcs], [1.4, 2.6, 6.0, 6.0], size=10)
    heading('9.3. Ngưỡng chấp nhận ' + CHO, 2)
    bullets(['100% eform qua TC-04 (khung khớp) và TC-05 (kiểu đúng).',
             'Đối soát với bộ dữ liệu của sở: khớp 100% số bản ghi; tổng từng trường Số khớp tuyệt đối (sai khác chỉ do làm tròn hiển thị).',
             'Chạy thử liên tục 5 ngày làm việc: đạt NFR-01, NFR-02, NFR-03; không mất bản ghi.',
             'Không còn lỗi mức nghiêm trọng, cao; lỗi mức thấp có hạn xử lý được hai bên đồng ý.'])
    heading('9.4. Các bước nghiệm thu', 2)
    table([['Bước', 'Việc', 'Đầu ra'],
           ['1', 'Sở hoàn thành API trên môi trường thử, gửi tài liệu, tài khoản', 'Hồ sơ khảo sát API (tài liệu riêng mục 2.2)'],
           ['2', 'QA IOC chạy test case chung, riêng', 'Báo cáo kiểm thử'],
           ['3', 'Chạy song song 1 kỳ với eform (mục 4.5)', 'Báo cáo lệch hai nguồn, sở xác nhận'],
           ['4', 'UAT với đầu mối nghiệp vụ sở', 'Biên bản UAT'],
           ['5', 'Chuyển cờ nguồn sang API trên môi trường thật, theo dõi 5 ngày', 'Biên bản nghiệm thu, đưa vào vận hành'],
           ], [1.2, 9.0, 5.8], size=10.5)

    # ---------------- 10
    heading('10. REVIEW VÀ BÀN GIAO', 1)
    heading('10.1. Thành phần review', 2)
    bullets(['Đầu mối nghiệp vụ, kỹ thuật của sở (và bên xây API nếu thuê ngoài).',
             'BA, dev, QA IOC; kiến trúc sư hệ thống.',
             'Đơn vị quản lý nền tảng tích hợp nếu chọn PA2.'])
    heading('10.2. Hồ sơ bàn giao', 2)
    bullets(['SRS chung (tài liệu này) và tài liệu riêng từng sở, đã chốt các mục ' + CHO + '.',
             'Hợp đồng OpenAPI từng sở (ky_thuat/openapi/<SỞ>_openapi.yaml).',
             'File Excel từ điển dữ liệu, mapping, danh mục.',
             'Hồ sơ khảo sát API, báo cáo kiểm thử, biên bản UAT, biên bản nghiệm thu từng sở.',
             'Danh sách vấn đề còn mở (mục 10.4 và tài liệu riêng mục 5).'])
    heading('10.3. Mẫu biên bản review', 2)
    table([['Mục', 'Nội dung'],
           ['Thời gian, địa điểm', '……'],
           ['Thành phần', '……'],
           ['Tài liệu review', 'Tên tài liệu, phiên bản'],
           ['Nội dung đã thống nhất', '1. …… 2. ……'],
           ['Mục ' + CHO + ' đã chốt', 'Mục …: chốt ……'],
           ['Vấn đề còn mở', 'Mã V-xx, nội dung, bên xử lý, hạn'],
           ['Phiên bản tài liệu sau review', '……'],
           ['Xác nhận', 'Đại diện sở · Đại diện IOC'],
           ], [5.0, 11.0], size=11)
    heading('10.4. Vấn đề còn mở (chung)', 2)
    table([['Mã', 'Vấn đề', 'Bên xử lý', 'Hạn', 'Trạng thái'],
           ['V-01', 'Chốt phương án kết nối PA1/PA2 (mục 4.3)', 'Kiến trúc sư IOC', '……', 'Mở'],
           ['V-02', 'Chốt cơ chế xác thực (mục 5.6)', 'Kiến trúc sư IOC + sở', '……', 'Mở'],
           ['V-03', 'Chốt SLA (mục 7), lịch đồng bộ 60 phút (FR-09)', 'Các bên', '……', 'Mở'],
           ['V-04', 'Chốt cách chuyển nguồn, thời gian chạy song song (mục 4.5)', 'Lãnh đạo dự án', '……', 'Mở'],
           ['V-05', 'Chốt ngưỡng chấp nhận (mục 9.3)', 'Các bên', '……', 'Mở'],
           ['V-06', 'Mức ưu tiên triển khai các sở (mục 2.4)', 'Lãnh đạo dự án', '……', 'Mở'],
           ['V-07', 'Thời gian lưu nhật ký (FR-15)', 'Vận hành IOC', '……', 'Mở'],
           ], [1.3, 7.2, 3.6, 1.6, 2.3], size=10.5)

    heading('PHỤ LỤC A. DANH SÁCH TÀI LIỆU TRONG BỘ', 1)
    table([['Tệp', 'Nội dung']] +
          [[CHUNG_FILE + '.docx / .md', 'SRS chung (tài liệu này)']] +
          [[u['file'] + '.docx / .md', f'{u["ten"]}: {len(u["efs"])} eform, {u["nf"]} trường'] for u in UNITS] +
          [['ky_thuat/openapi/<SỞ>_openapi.yaml', 'Hợp đồng OpenAPI 3.0 từng sở (12 tệp)'],
           ['ky_thuat/' + XLSX_FILE, 'Từ điển dữ liệu, mapping nguồn → đích, danh mục (lọc được)']],
          [8.6, 7.4], size=10)
    update_fields_on_open(k)
    return k.save(os.path.join(OUTD, CHUNG_FILE + '.docx'))


# ================================================================= TÀI LIỆU TỪNG SỞ
def srs_so(u):
    k = Kit(f'SRS tích hợp API · {u["ngan"]} · IOC Hà Nội')
    para, table, box, heading, bullets, note = k.para, k.table, k.box, k.heading, k.bullets, k.note
    cover(k, f'SRS tích hợp API — {u["ten"]}', 'SRS TÍCH HỢP API', u['ten'].upper(),
          f'{len(u["efs"])} eform · {u["nf"]} trường · sở mở API, IOC kéo về', [
              ['Đơn vị', u['ten']],
              ['Phạm vi', f'{len(u["efs"])} eform, {u["nf"]} trường (sheet "{u["sheet"]}" của "File mô tả đầu vào eform")'],
              ['Mô hình', f'{u["ngan"]} mở API theo hợp đồng chung; IOC định kỳ gọi sang kéo dữ liệu về'],
              ['Hiện trạng', 'Nhập tay qua eform; chưa có API'],
              ['Căn cứ', f'SRS chung ({CHUNG_FILE}); khung eform trên IOC; bản đọc eform đã duyệt 28/10/2026 '
                         f'(docs/BAN_DOC_EFORM/{u["efs"][0]["bd"]["nguon"]})'],
              ['Phiên bản', VER], ['Ngày lập', NGAY],
          ])
    heading('1. THÔNG TIN CHUNG', 1)
    heading('1.1. Cách đọc tài liệu', 2)
    para('Tài liệu này là phần riêng của ' + u['ten'] + ' trong bộ SRS tích hợp API. Phần dùng chung (đường dẫn, tham số, cấu trúc phản hồi, mã lỗi, '
         'đồng bộ, SLA, nghiệm thu) xem SRS chung; ở đây chỉ nêu những gì riêng của đơn vị: eform nào, trường nào, danh mục, khóa bản ghi, ví dụ, '
         'test case, việc cần xác nhận.')
    box(['API gửi đúng các trường của eform, không thêm trường nghiệp vụ; thêm 3 trường kỹ thuật ma_ban_ghi, thoi_diem_cap_nhat, da_xoa (SRS chung mục 5.4).',
         'Cột "Bắt buộc" là đề xuất theo khóa bản ghi đã chốt ở bản đọc eform; file eform không quy định trường bắt buộc, cần sở xác nhận.'],
        k.NOTE_FILL, 'Lưu ý: ')
    heading('1.2. Đầu mối', 2)
    table([['Vai trò', 'Họ tên', 'Đơn vị', 'Điện thoại', 'Thư điện tử'],
           ['Đầu mối nghiệp vụ của sở', '……', u['ngan'], '……', '……'],
           ['Đầu mối kỹ thuật / bên xây API', '……', '……', '……', '……'],
           ['BA IOC', '……', 'IOC', '……', '……'],
           ['Dev IOC', '……', 'IOC', '……', '……'],
           ['QA IOC', '……', 'IOC', '……', '……'],
           ], [4.4, 3.2, 3.2, 2.4, 2.8], size=10.5)
    heading('1.3. Danh mục eform và API', 2)
    table([['#', 'Mã eform', 'Eform', 'Đường dẫn lấy bản ghi', 'Trường', 'Căn cứ ghi trên eform']] +
          [[str(i + 1), x['e']['id'], x['e']['ten'], ep(x['e']), str(len(x['e']['fields'])), x['cc']] for i, x in enumerate(u['efs'])],
          [0.7, 1.3, 4.6, 4.4, 1.2, 3.8], size=9.5, mono_col=3)

    heading('2. HIỆN TRẠNG VÀ MỨC ĐÁP ỨNG', 1)
    heading('2.1. Mức đáp ứng từng eform', 2)
    table([['Eform', 'Nguồn hiện tại', 'API', 'Mức đáp ứng', 'Việc cần làm']] +
          [[x['e']['ten'], 'Nhập tay qua eform', 'Chưa có', 'Chưa đáp ứng', 'Sở xác nhận dữ liệu gốc nằm ở đâu; xây API theo mục 3'] for x in u['efs']],
          [5.0, 2.6, 1.6, 2.4, 4.4], size=10)
    heading('2.2. Hồ sơ khảo sát API (sở điền, BA đối chiếu)', 2)
    table([['Hạng mục', 'Sở cung cấp', 'BA ghi nhận'],
           ['Dữ liệu gốc của từng eform đang nằm ở hệ thống nào (tên phần mềm, đơn vị vận hành)', '……', '……'],
           ['Tài liệu API, mô tả cấu trúc dữ liệu (schema)', '……', '……'],
           ['Ví dụ yêu cầu, phản hồi thật', '……', '……'],
           ['Môi trường thử: địa chỉ, tài khoản cho IOC', '……', '……'],
           ['Dữ liệu có từ kỳ nào (lịch sử), có đủ 126 xã, phường không', '……', '……'],
           ['Tần suất cập nhật dữ liệu phía sở; hạn chốt số mỗi kỳ', '……', '……'],
           ['Điều kiện, thủ tục cấp quyền cho IOC', '……', '……'],
           ['Đã có dịch vụ trên nền tảng tích hợp của Thành phố chưa', '……', '……'],
           ['Kết luận mức đáp ứng sau khảo sát (Đủ / Một phần / Có thể tính / Chưa đáp ứng / Chưa xác minh)', '', '……'],
           ], [8.0, 4.0, 4.0], size=10.5)

    heading('3. ĐẶC TẢ TỪNG EFORM', 1)
    para('Mỗi eform: phiếu mô tả nghiệp vụ, từ điển dữ liệu (cũng là bảng mapping: trường «truong.<mã>» của API đổ vào trường cùng mã trên IOC), '
         'ví dụ phản hồi, kiểm tra khi nhận, điểm cần sở xác nhận. Quy tắc chuyển theo kiểu: SRS chung mục 5.4.')
    mo, tc = [], []
    for n, x in enumerate(u['efs']):
        e, b = x['e'], x['bd']
        heading(f'3.{n + 1}. {e["ten"]}', 2)
        table([['Mã eform', e['id']],
               ['Đường dẫn', f'{ep(e)} · {ep(e, "doi-soat")}'],
               ['Nguồn khung', f'Sheet "{u["sheet"]}", từ dòng {e["dong"]} · {len(e["fields"])} trường'],
               ['Một bản ghi là', b['ban_ghi'] or '—'],
               ['Khóa bản ghi', b['khoa'] or '—'],
               ['Loại số', b['loai_so'] or '—'],
               ['Lọc kỳ / địa bàn', ('Có: ' + ', '.join(x['ky']) if x['ky'] else 'Không có trường kỳ: IOC lấy theo cap_nhat_tu') + ' · ' +
                ('lọc được «Địa bàn» (dia_ban)' if x['db'] else 'không có «Địa bàn»')],
               ['Căn cứ ghi trên eform', x['cc']],
               ], [3.6, 12.4], header=False, key_col=True, size=10.5)
        if b['chi']:
            para('**Chỉ tiêu IOC dựng từ eform này** (chỉ dùng trường của eform):', after=2)
            bullets(b['chi'], 11.5)
        para('**Từ điển dữ liệu**', after=2)
        rows = [['#', 'Tên trường (đúng như eform)', 'Mã trường (API = IOC)', 'Kiểu eform → JSON', 'Bắt buộc', 'Danh mục']]
        for j, f in enumerate(e['fields']):
            rows.append([str(j + 1), f['l'], f['c'], f'{KIEU.get(f["t"], f["t"])} → {JSON_T.get(f["t"], "string")}', bat_buoc(f, x['kf']), dm_text(f)])
        table(rows, [0.8, 3.8, 3.6, 2.6, 2.0, 3.2], size=9, mono_col=2)
        code(k, json.dumps(vi_du_trang(x), ensure_ascii=False, indent=2), 'json',
             f'Ví dụ: GET {ep(e)} (bản ghi mẫu, giá trị lấy từ dữ liệu mẫu trong file eform, không phải số thật)')
        kt = ['Lỗi chung: mã ngoài danh mục, ô Số không phải số, ngày sai, thiếu khóa, thiếu kỳ (FR-14)'] + b['kt']
        para('**Kiểm tra khi nhận** (bản ghi vẫn nhận, đánh dấu "cần xem lại"):', after=2)
        bullets(kt, 11.5)
        can = list(b['loi'])
        can += [f'Trường «{f["l"]}» để trống kiểu trong file eform: sở xác nhận kiểu (tạm gửi string)' for f in e['fields'] if f['t'] == '']
        can += [f'Trường «{f["l"]}» kiểu Chữ nhưng file kèm danh sách: sở xác nhận có nên đổi sang Danh mục (hiện gửi đúng chữ)' for f in e['fields'] if f['t'] != 'dm' and f.get('dm')]
        can.append('Cột "Bắt buộc" của từ điển dữ liệu')
        para('**Cần sở xác nhận:**', after=2)
        bullets(can, 11.5)
        mo += [(e['ten'], c) for c in can]
        # test case riêng
        so = [f['l'] for f in e['fields'] if f['t'] == 'so' and f['c'] not in KY_C]
        p = f'TC-{u["ma"]}-{n + 1:02d}'
        tc.append([p + '.1', e['ten'], f'Gọi {BASE}/eform/{e["id"]}, so khung với IOC', f'Đủ {len(e["fields"])} trường, đúng thứ tự, mã, kiểu, danh mục'])
        tc.append([p + '.2', e['ten'], 'Đồng bộ kỳ trong bộ dữ liệu đối soát; gọi đối soát',
                   'Khớp số bản ghi' + (f'; khớp tổng {len(so)} trường Số: ' + ', '.join(f'«{s}»' for s in so[:6]) + (' …' if len(so) > 6 else '') if so else '')])
        for m, c in enumerate(b['kt']):
            tc.append([f'{p}.{m + 3}', e['ten'], 'Bản ghi thử: ' + c, 'IOC nhận, đánh dấu "cần xem lại", không sửa số'])

    heading('4. TEST CASE RIÊNG', 1)
    para('Chạy cùng 27 test case chung (SRS chung mục 9.2). Bảng dưới là phần riêng của ' + u['ngan'] + '.')
    table([['Mã', 'Eform', 'Kịch bản', 'Kết quả mong đợi']] + tc, [2.2, 3.8, 5.0, 5.0], size=9.5)

    heading('5. VẤN ĐỀ CÒN MỞ, VIỆC CẦN SỞ XÁC NHẬN', 1)
    chung = ['Cử đầu mối nghiệp vụ, kỹ thuật (mục 1.2)', 'Trả lời hồ sơ khảo sát (mục 2.2)', 'Xác nhận kỳ bắt đầu có dữ liệu để đồng bộ lần đầu',
             'Cấp môi trường thử và tài khoản chỉ đọc cho IOC', 'Chuẩn bị bộ dữ liệu đối soát (1 kỳ tháng, 1 kỳ quý) có ký xác nhận',
             'Thống nhất phương án kết nối, xác thực (SRS chung mục 4.3, 5.6)']
    rows = [['Mã', 'Eform', 'Nội dung', 'Bên xử lý', 'Hạn', 'Trạng thái']]
    rows += [[f'V-{u["ma"]}-{i + 1:02d}', 'Chung', c, u['ngan'], '……', 'Mở'] for i, c in enumerate(chung)]
    rows += [[f'V-{u["ma"]}-{len(chung) + i + 1:02d}', ef, c, 'Đầu mối nghiệp vụ', '……', 'Mở'] for i, (ef, c) in enumerate(mo)]
    table(rows, [1.9, 2.8, 6.3, 2.2, 1.2, 1.6], size=9.5)

    heading('6. XÁC NHẬN', 1)
    para('Các bên xác nhận nội dung tài liệu (phiên bản ……) sau buổi review ngày ……/……/2026.')
    table([['Đại diện ' + u['ngan'] + ' (nghiệp vụ)', 'Đại diện ' + u['ngan'] + ' (kỹ thuật)', 'Đại diện IOC'],
           [['', '', '', '(Ký, ghi rõ họ tên)'], ['', '', '', '(Ký, ghi rõ họ tên)'], ['', '', '', '(Ký, ghi rõ họ tên)']]],
          [5.3, 5.3, 5.4], size=11)
    update_fields_on_open(k)
    return k.save(os.path.join(OUTD, u['file'] + '.docx'))


# ================================================================= OPENAPI (YAML)
def _yk(k):
    return k if re.fullmatch(r'[A-Za-z_][A-Za-z0-9_\-]*', k) else json.dumps(k, ensure_ascii=False)


def yaml(o, ind=0):
    sp = '  ' * ind
    out = []
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, (dict, list)) and v:
                out.append(f'{sp}{_yk(k)}:'); out.append(yaml(v, ind + 1))
            else:
                out.append(f'{sp}{_yk(k)}: {_ys(v)}')
    else:
        for v in o:
            if isinstance(v, dict) and v:
                sub = yaml(v, ind + 1).split('\n')
                out.append(f'{sp}- ' + sub[0].lstrip()); out += sub[1:]
            else:
                out.append(f'{sp}- {_ys(v)}')
    return '\n'.join(out)


def _ys(v):
    if v is None: return 'null'
    if v is True: return 'true'
    if v is False: return 'false'
    if isinstance(v, (int, float)): return str(v)
    if isinstance(v, dict): return '{}'
    if isinstance(v, list): return '[]'
    return json.dumps(v, ensure_ascii=False)


def _ref(n): return {'$ref': '#/components/' + n}


def openapi(u):
    P = {
        'KyBaoCao': {'name': 'ky_bao_cao', 'in': 'query', 'description': 'Mã kỳ theo danh mục «Kỳ báo cáo» của eform', 'schema': {'type': 'string'}},
        'Nam': {'name': 'nam', 'in': 'query', 'description': '«Năm»', 'schema': {'type': 'integer'}},
        'Thang': {'name': 'thang', 'in': 'query', 'description': '«Tháng»', 'schema': {'type': 'integer', 'minimum': 1, 'maximum': 12}},
        'Quy': {'name': 'quy', 'in': 'query', 'description': 'Mã quý theo danh mục «Quý» của eform', 'schema': {'type': 'string'}},
        'DiaBan': {'name': 'dia_ban', 'in': 'query', 'description': 'Mã xã, phường theo danh mục «Địa bàn» của eform', 'schema': {'type': 'string'}},
        'CapNhatTu': {'name': 'cap_nhat_tu', 'in': 'query', 'description': 'Chỉ trả bản ghi có thoi_diem_cap_nhat ≥ giá trị này; có tham số này thì trả cả bản ghi đã xóa',
                      'schema': {'type': 'string', 'format': 'date-time'}},
        'GomDaXoa': {'name': 'gom_da_xoa', 'in': 'query', 'schema': {'type': 'boolean', 'default': False}},
        'Trang': {'name': 'trang', 'in': 'query', 'schema': {'type': 'integer', 'minimum': 1, 'default': 1}},
        'SoBanGhi': {'name': 'so_ban_ghi', 'in': 'query', 'schema': {'type': 'integer', 'minimum': 1, 'maximum': 1000, 'default': 200}},
        'MaEform': {'name': 'ma_eform', 'in': 'path', 'required': True, 'schema': {'type': 'string', 'enum': [x['e']['id'] for x in u['efs']]}},
        'MaBanGhi': {'name': 'ma_ban_ghi', 'in': 'path', 'required': True, 'schema': {'type': 'string'}},
        'MaTruong': {'name': 'ma_truong', 'in': 'path', 'required': True, 'schema': {'type': 'string'}},
    }
    loi = {c: {'description': d, 'content': {'application/json': {'schema': _ref('schemas/Loi')}}}
           for c, d in (('400', 'Tham số sai'), ('401', 'Chưa xác thực'), ('403', 'Không có quyền'), ('404', 'Không tìm thấy'),
                        ('429', 'Quá giới hạn tần suất (kèm Retry-After)'), ('500', 'Lỗi máy chủ'), ('503', 'Đang bảo trì'))}
    R = {c: _ref('responses/L' + c) for c in loi}
    S = {
        'DanhMuc': {'type': 'object', 'required': ['ma', 'ten'], 'properties': {'ma': {'type': 'string'}, 'ten': {'type': 'string'}}},
        'Loi': {'type': 'object', 'required': ['ma_loi', 'thong_diep'], 'properties': {
            'ma_loi': {'type': 'string', 'enum': ['THAM_SO_SAI', 'CHUA_XAC_THUC', 'KHONG_CO_QUYEN', 'KHONG_TIM_THAY', 'QUA_GIOI_HAN', 'LOI_MAY_CHU', 'DANG_BAO_TRI']},
            'thong_diep': {'type': 'string'}, 'chi_tiet': {'type': 'object'}, 'ma_theo_doi': {'type': 'string'}}},
        'TrangThai': {'type': 'object', 'properties': {'trang_thai': {'type': 'string', 'enum': ['hoat_dong', 'bao_tri']},
                                                       'thoi_diem': {'type': 'string', 'format': 'date-time'}}},
        'EformTomTat': {'type': 'object', 'properties': {'ma_eform': {'type': 'string'}, 'ten': {'type': 'string'},
                                                         'phien_ban_khung': {'type': 'string'}, 'so_truong': {'type': 'integer'}}},
        'TruongKhung': {'type': 'object', 'properties': {'thu_tu': {'type': 'integer'}, 'ma': {'type': 'string'}, 'ten': {'type': 'string'},
                                                         'kieu': {'type': 'string', 'enum': ['Số', 'Chữ', 'Danh mục', 'Ngày tháng', '']},
                                                         'danh_muc': {'type': 'array', 'items': _ref('schemas/DanhMuc')}}},
        'KhungEform': {'type': 'object', 'properties': {'ma_eform': {'type': 'string'}, 'ten': {'type': 'string'}, 'phien_ban_khung': {'type': 'string'},
                                                        'truong': {'type': 'array', 'items': _ref('schemas/TruongKhung')}}},
        'DoiSoat': {'type': 'object', 'properties': {'ma_eform': {'type': 'string'}, 'loc': {'type': 'object'}, 'so_ban_ghi': {'type': 'integer'},
                                                     'so_ban_ghi_da_xoa': {'type': 'integer'},
                                                     'tong': {'type': 'object', 'additionalProperties': {'type': 'number'},
                                                              'description': 'Tổng thô từng trường Số (khóa là mã trường), chỉ để đối soát'},
                                                     'thoi_diem_chot': {'type': 'string', 'format': 'date-time'}}},
    }
    paths = {
        BASE + '/trang-thai': {'get': {'summary': 'FR-07 Kiểm tra API', 'operationId': 'trangThai', 'responses': {
            '200': {'description': 'OK', 'content': {'application/json': {'schema': _ref('schemas/TrangThai')}}}, '503': R['503']}}},
        BASE + '/eform': {'get': {'summary': 'FR-01 Danh sách eform', 'operationId': 'dsEform', 'responses': {
            '200': {'description': 'OK', 'content': {'application/json': {'schema': {'type': 'array', 'items': _ref('schemas/EformTomTat')}}}},
            '401': R['401'], '403': R['403']}}},
        BASE + '/eform/{ma_eform}': {'get': {'summary': 'FR-02 Khung eform', 'operationId': 'khungEform', 'parameters': [_ref('parameters/MaEform')],
                                             'responses': {'200': {'description': 'OK', 'content': {'application/json': {'schema': _ref('schemas/KhungEform')}}},
                                                           '401': R['401'], '403': R['403'], '404': R['404']}}},
        BASE + '/eform/{ma_eform}/danh-muc/{ma_truong}': {'get': {'summary': 'FR-05 Danh mục của một trường', 'operationId': 'danhMuc',
                                                                  'parameters': [_ref('parameters/MaEform'), _ref('parameters/MaTruong')],
                                                                  'responses': {'200': {'description': 'OK', 'content': {'application/json': {'schema': {'type': 'array', 'items': _ref('schemas/DanhMuc')}}}},
                                                                                '401': R['401'], '404': R['404']}}},
    }
    for x in u['efs']:
        e = x['e']; N = e['id'].upper()
        props = {}
        for f in e['fields']:
            d = f'{f["l"]} · {KIEU.get(f["t"], f["t"])} eform'
            if f['t'] == 'dm':
                ma = {'type': 'string'}
                if f.get('dm') and len(f['dm']) <= 200:
                    ma['enum'] = [o['v'] for o in f['dm']]
                props[f['c']] = {'type': 'object', 'nullable': True, 'description': d, 'required': ['ma', 'ten'],
                                 'properties': {'ma': ma, 'ten': {'type': 'string'}}}
            elif f['t'] == 'so':
                props[f['c']] = {'type': 'number', 'nullable': True, 'description': d}
            elif f['t'] == 'ngay':
                props[f['c']] = {'type': 'string', 'format': 'date', 'nullable': True, 'description': d}
            else:
                props[f['c']] = {'type': 'string', 'nullable': True, 'description': d}
        req = [f['c'] for f in e['fields'] if bat_buoc(f, x['kf']) in ('Có', 'Có (khóa)')]
        S[N + '_Truong'] = {'type': 'object', 'description': f'{e["ten"]} — đủ {len(e["fields"])} trường eform, đúng thứ tự', 'properties': props,
                            'required': [f['c'] for f in e['fields']], 'additionalProperties': False}
        S[N + '_BanGhi'] = {'type': 'object', 'required': ['ma_ban_ghi', 'thoi_diem_cap_nhat', 'da_xoa', 'truong'], 'properties': {
            'ma_ban_ghi': {'type': 'string', 'description': 'Trường kỹ thuật: mã duy nhất, không đổi'},
            'thoi_diem_cap_nhat': {'type': 'string', 'format': 'date-time', 'description': 'Trường kỹ thuật: lần thêm/sửa gần nhất'},
            'da_xoa': {'type': 'boolean', 'description': 'Trường kỹ thuật: xóa mềm'},
            'truong': _ref('schemas/' + N + '_Truong')}}
        if req:
            S[N + '_BanGhi']['description'] = 'Đề xuất bắt buộc có giá trị (chờ sở xác nhận): ' + ', '.join(req)
        S[N + '_Trang'] = {'type': 'object', 'required': ['ma_eform', 'trang', 'tong_so_ban_ghi', 'ban_ghi'], 'properties': {
            'ma_eform': {'type': 'string'}, 'phien_ban_khung': {'type': 'string'}, 'trang': {'type': 'integer'},
            'so_ban_ghi_moi_trang': {'type': 'integer'}, 'tong_so_ban_ghi': {'type': 'integer'}, 'tong_so_trang': {'type': 'integer'},
            'thoi_diem_phan_hoi': {'type': 'string', 'format': 'date-time'},
            'ban_ghi': {'type': 'array', 'items': _ref('schemas/' + N + '_BanGhi')}}}
        loc = ([_ref('parameters/KyBaoCao')] if 'ky_bao_cao' in x['ky'] else []) + ([_ref('parameters/Nam')] if 'nam' in x['ky'] else []) + \
              ([_ref('parameters/Thang')] if 'thang' in x['ky'] else []) + ([_ref('parameters/Quy')] if 'quy' in x['ky'] else []) + \
              ([_ref('parameters/DiaBan')] if x['db'] else [])
        ex = vi_du_trang(x)
        paths[ep(e)] = {'get': {'summary': f'FR-03 {e["ten"]}', 'operationId': 'banGhi_' + e['id'], 'tags': [e['id']],
                                'parameters': loc + [_ref('parameters/' + p) for p in ('CapNhatTu', 'GomDaXoa', 'Trang', 'SoBanGhi')],
                                'responses': {'200': {'description': 'OK', 'content': {'application/json': {'schema': _ref('schemas/' + N + '_Trang'), 'example': ex}}},
                                              **{c: R[c] for c in ('400', '401', '403', '429', '500', '503')}}}}
        paths[ep(e) + '/{ma_ban_ghi}'] = {'get': {'summary': f'FR-04 Một bản ghi — {e["ten"]}', 'operationId': 'motBanGhi_' + e['id'], 'tags': [e['id']],
                                                  'parameters': [_ref('parameters/MaBanGhi')],
                                                  'responses': {'200': {'description': 'OK', 'content': {'application/json': {'schema': _ref('schemas/' + N + '_BanGhi')}}},
                                                                **{c: R[c] for c in ('401', '403', '404')}}}}
        paths[ep(e, 'doi-soat')] = {'get': {'summary': f'FR-06 Đối soát — {e["ten"]}', 'operationId': 'doiSoat_' + e['id'], 'tags': [e['id']],
                                            'parameters': loc,
                                            'responses': {'200': {'description': 'OK', 'content': {'application/json': {'schema': _ref('schemas/DoiSoat')}}},
                                                          **{c: R[c] for c in ('400', '401', '403')}}}}
    spec = {
        'openapi': '3.0.3',
        'info': {'title': f'API dữ liệu eform — {u["ten"]} → IOC Hà Nội', 'version': '1.0.0-du-thao',
                 'description': f'Hợp đồng API {u["ten"]} cung cấp cho IOC (IOC gọi sang kéo dữ liệu). Sinh từ khung eform ngày {NGAY} bằng tools/srs_api_so_docx.py; '
                                f'không sửa tay. Nghiệp vụ, quy tắc: {CHUNG_FILE} và {u["file"]}.'},
        'servers': [{'url': 'https://{may_chu}', 'variables': {'may_chu': {'default': 'may-chu-api-cua-so', 'description': 'Sở cung cấp'}}}],
        'security': [{'oauth2': []}, {'apiKey': []}],
        'tags': [{'name': x['e']['id'], 'description': x['e']['ten']} for x in u['efs']],
        'paths': paths,
        'components': {
            'securitySchemes': {'oauth2': {'type': 'oauth2', 'flows': {'clientCredentials': {'tokenUrl': '/oauth/token', 'scopes': {}}}},
                                'apiKey': {'type': 'apiKey', 'in': 'header', 'name': 'X-API-Key'}},
            'parameters': P, 'responses': {'L' + c: v for c, v in loi.items()}, 'schemas': S},
    }
    p = os.path.join(OUTD, 'ky_thuat', 'openapi', f'{u["ma"]}_openapi.yaml')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(f'# Hợp đồng API — {u["ten"]} · sinh bằng tools/srs_api_so_docx.py ngày {NGAY} · không sửa tay\n' + yaml(spec) + '\n')
    return p


# ================================================================= EXCEL
def excel():
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    wb = Workbook()
    HF, HFont = PatternFill('solid', fgColor='1F3A5F'), Font(bold=True, color='FFFFFF')

    def sheet(ws, head, rows, widths):
        ws.append(head)
        for c in ws[1]:
            c.fill, c.font, c.alignment = HF, HFont, Alignment(wrap_text=True, vertical='center')
        for r in rows:
            ws.append(r)
        for i, w in enumerate(widths):
            ws.column_dimensions[chr(65 + i)].width = w
        ws.freeze_panes = 'A2'; ws.auto_filter.ref = ws.dimensions

    ws = wb.active; ws.title = 'HUONG_DAN'
    for ln in [f'Từ điển dữ liệu, mapping nguồn → đích — tích hợp API {len(UNITS)} sở, ngành → IOC', f'Ngày {NGAY} · sinh bằng tools/srs_api_so_docx.py từ khung eform; không sửa tay',
               '', 'EFORM: danh sách eform, đường dẫn API, khóa bản ghi, mức đáp ứng',
               'TU_DIEN_MAPPING: mọi trường của mọi eform; nguồn = trường trong "truong" của API; đích = trường cùng mã trên IOC',
               'DANH_MUC: mọi mã danh mục của trường kiểu Danh mục', 'TRUONG_KY_THUAT: 3 trường kỹ thuật thêm vào mỗi bản ghi (không phải chỉ tiêu)',
               '', 'Cột "Bắt buộc": đề xuất theo khóa bản ghi đã chốt; chờ sở xác nhận.']:
        ws.append([ln])
    ws['A1'].font = Font(bold=True, size=13); ws.column_dimensions['A'].width = 120
    sheet(wb.create_sheet('EFORM'), ['Sở', 'Mã eform', 'Eform', 'Số trường', 'Đường dẫn lấy bản ghi', 'Một bản ghi là', 'Khóa bản ghi', 'Loại số',
                                     'Trường kỳ', 'Có «Địa bàn»', 'Căn cứ ghi trên eform', 'Nguồn hiện tại', 'Mức đáp ứng'],
          [[u['ma'], x['e']['id'], x['e']['ten'], len(x['e']['fields']), ep(x['e']), x['bd']['ban_ghi'], x['bd']['khoa'], x['bd']['loai_so'],
            ', '.join(x['ky']) or '—', 'Có' if x['db'] else 'Không', x['cc'], 'Nhập tay qua eform', 'Chưa đáp ứng'] for u in UNITS for x in u['efs']],
          [7, 9, 45, 9, 38, 45, 45, 40, 26, 10, 36, 18, 14])
    rows, dmr = [], []
    for u in UNITS:
        for x in u['efs']:
            e = x['e']
            for j, f in enumerate(e['fields']):
                m = mau(f)
                rows.append([u['ma'], e['id'], e['ten'], j + 1, f['l'], f'truong.{f["c"]}', f'{e["id"]}.{f["c"]}', KIEU.get(f['t'], f['t']),
                             JSON_T.get(f['t'], 'string'), bat_buoc(f, x['kf']), 'Có' if f['c'] in x['kf'] else '', len(f.get('dm') or []) or '',
                             QUY_TAC.get(f['t'], QUY_TAC['']), f['dong'], json.dumps(m, ensure_ascii=False) if isinstance(m, dict) else m])
                for o in f.get('dm') or []:
                    dmr.append([u['ma'], e['id'], f['c'], f['l'], KIEU.get(f['t'], f['t']), o['v'], o.get('l') or o['v']])
    sheet(wb.create_sheet('TU_DIEN_MAPPING'), ['Sở', 'Mã eform', 'Eform', 'Thứ tự', 'Tên trường (đúng như eform)', 'Nguồn (API)', 'Đích (IOC)', 'Kiểu eform',
                                               'Kiểu JSON', 'Bắt buộc', 'Thuộc khóa', 'Số mã danh mục', 'Quy tắc chuyển đổi', 'Dòng trong file eform', 'Ví dụ (bản ghi mẫu)'],
          rows, [7, 9, 40, 7, 40, 34, 34, 12, 20, 24, 10, 10, 60, 10, 30])
    sheet(wb.create_sheet('DANH_MUC'), ['Sở', 'Mã eform', 'Mã trường', 'Tên trường', 'Kiểu eform', 'Mã (ma)', 'Tên hiển thị (ten)'], dmr, [7, 9, 30, 40, 12, 30, 45])
    sheet(wb.create_sheet('TRUONG_KY_THUAT'), ['Trường', 'Kiểu', 'Bắt buộc', 'Ý nghĩa'], [
        ['ma_ban_ghi', 'string', 'Có', 'Mã duy nhất, không đổi suốt đời bản ghi, do hệ thống sở sinh'],
        ['thoi_diem_cap_nhat', 'date-time ISO 8601 +07:00', 'Có', 'Lần thêm hoặc sửa gần nhất; mỗi lần sửa phải tăng'],
        ['da_xoa', 'boolean', 'Có', 'true khi bản ghi đã bị xóa phía sở; giữ ít nhất 90 ngày']], [22, 26, 10, 70])
    p = os.path.join(OUTD, 'ky_thuat', XLSX_FILE)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    wb.save(p)
    return p, len(rows), len(dmr)


def readme():
    L = [f'# Bộ tài liệu SRS tích hợp API — {len(UNITS)} sở, ngành', '',
         f'Ngày {NGAY} · phiên bản {VER} · sinh bằng `tools/srs_api_so_docx.py` (không sửa tay; sửa script rồi chạy lại).', '',
         f'Mô hình: sở mở API, IOC định kỳ gọi sang kéo dữ liệu về. API gửi đúng trường eform + 3 trường kỹ thuật. {N_EF} eform, {N_F} trường.', '',
         '| Tệp | Nội dung |', '|---|---|', f'| {CHUNG_FILE}.docx / .md | SRS chung |']
    L += [f'| {u["file"]}.docx / .md | {u["ten"]}: {len(u["efs"])} eform, {u["nf"]} trường |' for u in UNITS]
    L += ['| ky_thuat/openapi/<SỞ>_openapi.yaml | Hợp đồng OpenAPI 3.0 từng sở |', f'| ky_thuat/{XLSX_FILE} | Từ điển dữ liệu, mapping, danh mục |', '',
          'Mục lục trong file Word tự cập nhật khi mở (Word hỏi "cập nhật trường" → chọn Có).']
    open(os.path.join(OUTD, 'README.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    os.makedirs(OUTD, exist_ok=True)
    print(*srs_chung())
    for u in UNITS:
        print(*srs_so(u)); print(openapi(u))
    print(*excel())
    readme()
    print(f'{len(UNITS)} đơn vị, {N_EF} eform, {N_F} trường')
