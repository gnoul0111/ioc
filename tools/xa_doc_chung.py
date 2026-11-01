# -*- coding: utf-8 -*-
"""Phần dùng chung của tài liệu chỉ tiêu xã, phường (tools/xa_srs_docx.py — SRS, tools/xa_mo_ta_docx.py — mô tả chỉ tiêu).
Số liệu đọc thẳng cấu hình đang chạy qua tools/tp_srs_dump.js xa (12 đơn vị cấp xã trên khung chung js/features/ctm-eform.js, số mẫu
của một xã, phường); lỗi file eform, câu hỏi – trả lời, sửa đổi lấy từ bản đọc docs/BAN_DOC_EFORM/XA_* (sinh bằng tools/xa_ban_doc_eform.py)."""
import json, os, re, shutil, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE = os.environ.get('NODE') or shutil.which('node')
if not NODE:
    raise SystemExit('Không tìm thấy Node: đặt biến NODE=<đường dẫn node> (hoặc Electron, tool tự bật ELECTRON_RUN_AS_NODE).')
D = json.loads(subprocess.run([NODE, 'tools/tp_srs_dump.js', 'xa'], cwd=ROOT, capture_output=True, check=True,
                              env=dict(os.environ, ELECTRON_RUN_AS_NODE='1')).stdout.decode('utf-8'))
U = D['units']
EFS = [(u, e) for u in U for e in u['eforms']]
N_EF, N_FIELD, N_CHI = len(EFS), sum(len(e['fields']) for _, e in EFS), sum(len(e['chi']) for _, e in EFS)
KIEU = {'dm': 'Danh mục', 'so': 'Số', 'chu': 'Chữ', 'ngay': 'Ngày tháng'}
TRUC = {'DANG': 'Đảng ủy', 'HDND': 'HĐND', 'UBND': 'UBND', 'MTTQ': 'Ủy ban MTTQ'}
BD_FILE = {'xa_dang': 'XA_01_DANG_UY', 'xa_hdnd': 'XA_02_HDND', 'xa_hcc': 'XA_03_HANH_CHINH_CONG', 'xa_tcns': 'XA_04_TAI_CHINH_NGAN_SACH', 'xa_qlvb': 'XA_05_QUAN_LY_VAN_BAN',
           'xa_gpmb': 'XA_06_GPMB', 'xa_gd': 'XA_07_GIAO_DUC', 'xa_yte': 'XA_08_Y_TE', 'xa_vh': 'XA_09_VAN_HOA', 'xa_nv': 'XA_10_NOI_VU', 'xa_ktxh': 'XA_11_KINH_TE_XA_HOI', 'xa_mttq': 'XA_12_MTTQ'}


def _sec(t, title):
    m = re.search(r'\n## ' + re.escape(title) + r'[^\n]*\n(.*?)(?=\n## |\Z)', t, re.S)
    return m.group(1) if m else ''


def _items(block, start=None):
    if start:
        if start not in block:
            return []
        block = block.split(start, 1)[1]
    out = []
    for ln in block.strip().split('\n'):
        ln = ln.strip()
        if ln.startswith('- ') or re.match(r'\d+\. ', ln):
            out.append(re.sub(r'^(- |\d+\. )', '', ln))
        elif out and not ln:
            break
    return out


def ban_doc(ef):
    """Bản đọc của một eform: lỗi file eform, câu hỏi, trả lời đã chốt, sửa đổi 02/11/2026"""
    p = os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', BD_FILE[ef] + '_2026_10_30.md')
    if not os.path.exists(p):
        raise SystemExit('Thiếu bản đọc ' + p + ' — chạy python3 tools/xa_ban_doc_eform.py trước')
    t = open(p, encoding='utf-8').read()
    cq = _sec(t, 'CÂU HỎI VÀ TRẢ LỜI')
    return {'loi': _items(t, '**Lỗi, chỗ nghi trong file eform:**'), 'cau': [x for x in _items(cq) if re.match(r'[A-Z]+-\d', x)],
            'traloi': [x for x in _items(cq.split('**Trả lời', 1)[1]) if not x.startswith('theo đề xuất')] if '**Trả lời' in cq else [],
            'sua': _items(_sec(t, 'SỬA, BỔ SUNG NGÀY 02/11/2026'))}


BD = {e['ef']: ban_doc(e['ef']) for _, e in EFS}
_tong = open(os.path.join(ROOT, 'docs', 'BAN_DOC_EFORM', 'XA_00_TONG_HOP_2026_10_30.md'), encoding='utf-8').read()
CHUNG = _items(_sec(_tong, '3. Phần chung'))
CAU_CHUNG = _items(_sec(_tong, '4. Câu hỏi chung và trả lời'))


def dm_text(f):
    if not f['dm']:
        return '— (file không liệt kê mã)' if f['t'] == 'dm' else '—'
    if f['t'] != 'dm':
        return f'— (file kèm {len(f["dm"])} giá trị; trường {KIEU.get(f["t"], "để trống kiểu")} nên hiện đúng chữ đã nhập)'
    return f'{len(f["dm"])} mã: ' + ', '.join(f['dm'][:4]) + (f', … (+{len(f["dm"]) - 4})' if len(f['dm']) > 4 else '')


def unit_of(c):
    return f' ({c["u"]})' if c['u'] and c['u'] != '%' and '(' + c['u'] + ')' not in c['l'] else ''


def eform_detail(k, u, e, so, mau_xa):
    """Mục chi tiết một eform (dùng ở SRS mục 5 và tài liệu mô tả Phần III)"""
    para, table, heading, note, bullets = k.para, k.table, k.heading, k.note, k.bullets
    heading(f'{so}. {u["name"]} — eform «{e["efTen"]}»', 2)
    para(f'Trục {TRUC[u["role"]]} · sheet "{e["sheet"]}" từ dòng {e["dong"]} · {len(e["fields"])} trường, {len(e["chi"])} chỉ tiêu, {len(e["bieu"])} biểu đồ.')
    bl = [f'**Một bản ghi là**: {e["banGhi"]}',
          '**Khóa bản ghi**: ' + ' + '.join(f'«{x}»' for x in e['khoa']) + ' + kỳ' + (f' (được để trống: {", ".join("«" + x + "»" for x in e["khoaRong"])})' if e['khoaRong'] else '')]
    if e['tach']:
        bl.append(f'**Chia nhóm** theo «{e["tach"]["l"]}»: màn «Tất cả nhóm» và {len(e["tach"]["nhom"])} màn nhóm — ' + ', '.join(e['tach']['nhom']))
    if e['dongTheo']:
        bl.append('**Dòng số liệu**: các bản ghi giống nhau ở ' + ', '.join(f'«{x}»' for x in e['dongTheo']) + ' (thẻ so sánh, diễn biến qua các kỳ, thanh từng dòng)')
    bl.append('**Bảng nhiều cấp**: ' + ' › '.join(f'«{x}»' for x in e['cap']) + (f'; cột chữ đã nhập: {", ".join("«" + x + "»" for x in e["cotChu"])}' if e['cotChu'] else ''))
    if e['dvt']:
        bl.append(f'**Đơn vị tính**: không cộng khác «{e["dvt"]}»; bảng chỉ ghi số «Giá trị» ở dòng gồm đúng một dòng số liệu (không cộng các chỉ tiêu khác nhau)')
    if e['kyCuoi']:
        bl.append('**Số tại thời điểm**: xem quý, năm mỗi khóa lấy bản kỳ cuối')
    if e['uuTien']:
        bl.append(f'**Bản ưu tiên**: cùng chỉ tiêu có bản {e["uuTien"]} thì chỉ dùng bản đó')
    if e['boNote']:
        bl.append('**Không tính vào số**: ' + e['boNote'])
    if e['bang']:
        bl.append('**Bảng phụ**: ' + '; '.join(f'{b["t"]} (' + ' › '.join(f'«{x}»' for x in b['cap']) + ')' for b in e['bang']))
    if e['chonDong']:
        bl.append('**Chọn chỉ tiêu xem diễn biến**: màn nhóm có thẻ chọn dòng số liệu cho biểu đồ qua các kỳ')
    if e['luuY']:
        bl.append('**Lưu ý**: ' + e['luuY'])
    bl.append(f'**Số mẫu {mau_xa}, {e["mau"]["label"]}**: {e["mau"]["n"]} bản ghi dùng ({e["mau"]["nAll"]} bản ghi mọi kỳ)')
    bullets(bl, 11)
    note('Chỉ tiêu (đúng bản đọc đã duyệt — không có chỉ tiêu nào ngoài trường eform)')
    table([['#', 'Chỉ tiêu', 'Cách tính (theo tên trường)', 'Hiện ở', e['mau']['label']]] +
          [[str(j + 1), c['l'] + unit_of(c) + (' · kế hoạch' if c['plan'] else '') + (' · so cùng kỳ' if c['ck'] else ''), c['mota'],
            ', '.join(x for x, ok in (('Ô số', c['kpi']), ('Thẻ', c['the']), ('Bảng', c['cot'])) if ok) or 'Biểu đồ, dòng số liệu',
            'theo từng dòng số liệu (không cộng các chỉ tiêu khác nhau)' if c['motDong'] else c['v'] if c['v'] is not None else '—'] for j, c in enumerate(e['chi'])],
          [0.7, 4.4, 6.8, 1.9, 2.2], size=8.5)
    if e['bieu']:
        note('Biểu đồ (mọi cột, thanh bấm được ra bản ghi; không cộng các chỉ tiêu khác nhau)')
        table([['#', 'Biểu đồ', 'Kiểu', 'Hiện ở']] + [[str(j + 1), b['t'], b['loai'] + (f' theo «{b["theo"]}»' if b['theo'] else ''), b['cho'] or 'Mọi màn của eform'] for j, b in enumerate(e['bieu'])],
              [0.7, 7.0, 5.0, 3.3], size=9)
    if e['kt']:
        para('**Kiểm tra riêng (đánh dấu cần xem lại)**: ' + '; '.join(e['kt']) + '.', 11)
    note('Trường của eform (đúng thứ tự trong sheet) — mọi trường đều hiện ở Dữ liệu đã nhập')
    table([['#', 'Tên trường', 'Mã', 'Kiểu', 'Danh mục', 'Vai trò ở phần tổng hợp']] +
          [[str(j + 1), f['l'], f['c'], KIEU.get(f['t'], '(để trống trong file)'), dm_text(f), '; '.join(f['vai'])] for j, f in enumerate(e['fields'])],
          [0.7, 3.4, 3.0, 1.6, 3.4, 3.9], size=8)
    bd = BD[e['ef']]
    if bd['sua']:
        para('**Sửa, bổ sung ngày 02/11/2026**: ' + ' '.join(bd['sua']), 10.5)
