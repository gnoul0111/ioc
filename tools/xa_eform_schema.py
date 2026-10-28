# -*- coding: utf-8 -*-
"""Sinh js/core/xa-eform.js — khung 12 eform cấp xã, phường — từ sheet "Xã/Phường" của "File mô tả đầu vào eform"
(Google Sheets 1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k). Chép đúng tên trường, mã, kiểu nhập, danh mục như trong file;
KHÔNG thêm, bớt hay sửa tên trường. Mã có dấu hoặc có ký tự ẩn được chuẩn hóa thành mã không dấu (giữ mã gốc ở `goc`).

Cách dùng (tải file eform về dạng .xlsx: Tệp › Tải xuống › Microsoft Excel):
  python3 tools/xa_eform_schema.py <file.xlsx>            ghi lại js/core/xa-eform.js
  python3 tools/xa_eform_schema.py <file.xlsx> --check    chỉ so sheet với js/core/xa-eform.js đang dùng: báo eform thêm,
                                                          bớt, đổi trường (màn hình chưa theo kịp) và các lỗi trong file eform
Chỉ dùng thư viện chuẩn của Python."""
import json
import os
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'core', 'xa-eform.js')
SHEET = 'XãPhường'  # tên sheet khi xuất .xlsx (Google bỏ dấu "/" của "Xã/Phường")
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
# tên khối trong sheet → mã eform dùng trong IOC, trục
KHOI = {
    'Đảng Ủy': ('dang', 'DANG'), 'Hội đồng nhân dân': ('hdnd', 'HDND'), 'Hành chính công': ('hcc', 'UBND'),
    'Tài chính - Ngân sách': ('tcns', 'UBND'), 'Quản lý văn bản': ('qlvb', 'UBND'), 'GPMB': ('gpmb', 'UBND'),
    'Giáo dục': ('gd', 'UBND'), 'Y tế': ('yte', 'UBND'), 'Văn hóa': ('vh', 'UBND'), 'Nội vụ': ('nv', 'UBND'),
    'Kinh tế xã hội': ('ktxh', 'UBND'), 'Mặt trận tổ quốc': ('mttq', 'MTTQ'),
}
KIEU = {'Danh mục': 'dm', 'Số': 'so', 'Chữ': 'chu', 'Ngày tháng': 'ngay'}


def norm_code(s):
    """Mã chuẩn: bỏ ký tự ẩn (zero-width, BOM), bỏ dấu tiếng Việt, đ → d, bỏ khoảng trắng hai đầu."""
    s = re.sub('[​-‏⁠﻿]', '', str(s)).strip()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return s.replace('đ', 'd').replace('Đ', 'D')


def read_sheet(path):
    z = zipfile.ZipFile(path)
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            ss.append(''.join(t.text or '' for t in si.iter('{%s}t' % NS['m'])))
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    target = None
    for s in wb.iter('{%s}sheet' % NS['m']):
        if s.get('name') in (SHEET, 'Xã/Phường'):
            target = rels[s.get('{%s}id' % NS['r'])]
    if not target:
        raise SystemExit('Không thấy sheet "Xã/Phường" trong ' + path)
    sh = ET.fromstring(z.read('xl/' + target.lstrip('/').replace('xl/', '', 1)))
    rows = []
    for r in sh.iter('{%s}row' % NS['m']):
        vals = {}
        for c in r.findall('m:c', NS):
            col = re.match(r'[A-Z]+', c.get('r')).group()
            ci = 0
            for ch in col:
                ci = ci * 26 + ord(ch) - 64
            t, v = c.get('t'), c.find('m:v', NS)
            if t == 's' and v is not None:
                val = ss[int(v.text)]
            elif t == 'inlineStr':
                val = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
            else:
                val = v.text if v is not None else ''
            vals[ci - 1] = val
        rows.append((int(r.get('r')), [vals.get(i, '') for i in range(6)]))
    return rows


def mau_text(v, kieu):
    """Dữ liệu mẫu: số nguyên ghi không ,0; ngày (số sê-ri Excel) đổi ra YYYY-MM-DD."""
    v = str(v).strip()
    if not v:
        return ''
    if kieu in ('so', 'ngay') and re.fullmatch(r'-?\d+(\.\d+)?', v):
        f = float(v)
        if kieu == 'ngay':
            import datetime
            return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(f))).isoformat()
        return str(int(f)) if f == int(f) else str(f)
    return v


def parse(path):
    rows = read_sheet(path)
    eforms, cur, fld, issues = [], None, None, []
    for no, (a, b, c, d, e, f) in rows:
        a, b, c = a.strip(), b.strip(), c.strip()
        if no == 1:
            continue
        if a and not b and not c and not e and not f:
            if a not in KHOI:
                raise SystemExit('Khối lạ ở dòng %d: %r — thêm vào KHOI trong tools/xa_eform_schema.py' % (no, a))
            cur = {'id': KHOI[a][0], 'truc': KHOI[a][1], 'ten': a, 'dong': no, 'fields': []}
            eforms.append(cur)
            fld = None
            continue
        if cur is None:
            continue
        if b:
            kieu = KIEU.get(c)
            if not kieu:
                raise SystemExit('Kiểu nhập lạ ở dòng %d: %r' % (no, c))
            fld = {'l': a, 'c': norm_code(b), 't': kieu, 'dong': no}
            if fld['c'] != b:
                fld['goc'] = b
                issues.append((no, cur['ten'], 'Mã trường "%s" có dấu hoặc ký tự ẩn' % b))
            m = mau_text(d, kieu)
            if m:
                fld['mau'] = m
            if kieu == 'dm':
                fld['dm'] = []
            cur['fields'].append(fld)
        if fld is not None and (e.strip() or f.strip()) and fld['t'] == 'dm':
            v0 = e.strip()
            o = {'v': norm_code(v0), 'l': f.strip()}
            if o['v'] != v0:
                o['goc'] = v0
                an = re.search('[​-‏⁠﻿]', v0)
                issues.append((no, cur['ten'], 'Mã danh mục "%s" %s' % (o['v'], 'có ký tự ẩn (U+200B)' if an else 'có dấu ("%s")' % v0)))
            if not o['l']:
                issues.append((no, cur['ten'], 'Mã danh mục "%s" của «%s» thiếu tên hiển thị' % (v0, fld['l'])))
            fld['dm'].append(o)
    for ef in eforms:
        seen = set()
        for fl in ef['fields']:
            if fl['c'] in seen:
                issues.append((fl['dong'], ef['ten'], 'Mã trường "%s" bị trùng' % fl['c']))
            seen.add(fl['c'])
            if fl['t'] == 'dm' and fl.get('mau') and fl['dm'] and not any(o['l'] == fl['mau'] or o['v'] == fl['mau'] for o in fl['dm']):
                issues.append((fl['dong'], ef['ten'], 'Dữ liệu mẫu "%s" của «%s» không có trong danh mục' % (fl['mau'], fl['l'])))
            if fl['t'] == 'so' and fl.get('mau') and not re.fullmatch(r'-?\d+(\.\d+)?', fl['mau']):
                issues.append((fl['dong'], ef['ten'], 'Trường Số «%s» có dữ liệu mẫu không phải số: "%s"' % (fl['l'], fl['mau'])))
    return eforms, issues


def render(eforms):
    lines = [
        "/* ============================== KHUNG 12 EFORM CẤP XÃ, PHƯỜNG (tự sinh — không sửa tay) ==============================",
        "   Sinh bằng tools/xa_eform_schema.py từ sheet \"Xã/Phường\" của \"File mô tả đầu vào eform\" (Google Sheets",
        "   1n1UHGnQ4sULz6_D9J0D2N02B0grCc8RbnLh0h9mY70k). Mỗi eform: id, trục, tên khối trong sheet, dòng bắt đầu, danh sách trường",
        "   đúng thứ tự trong file: { l: tên trường, c: mã (đã chuẩn hóa không dấu), goc: mã gốc khi khác, t: 'dm' | 'so' | 'chu' |",
        "   'ngay', mau: dữ liệu mẫu, dm: [{ v: mã, l: tên hiển thị }], dong: số dòng trong sheet }.",
        "   Màn hình chỉ tiêu xã, phường (ctm-xa-units.js) chỉ được dùng các trường có ở đây. Eform đổi thì chạy lại tool. */",
        "const XA_EFORM = [",
    ]
    for i, ef in enumerate(eforms):
        head = {k: ef[k] for k in ('id', 'truc', 'ten', 'dong')}
        lines.append('  ' + json.dumps(head, ensure_ascii=False)[:-1] + ', "fields": [')
        for j, fl in enumerate(ef['fields']):
            lines.append('    ' + json.dumps(fl, ensure_ascii=False) + (',' if j < len(ef['fields']) - 1 else ''))
        lines.append('  ]}' + (',' if i < len(eforms) - 1 else ''))
    lines.append('];')
    return '\n'.join(lines) + '\n'


def summary(eforms):
    return {ef['id']: {fl['c']: (fl['l'], fl['t'], tuple(o['v'] + '=' + o['l'] for o in fl.get('dm', []))) for fl in ef['fields']} for ef in eforms}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        raise SystemExit(__doc__)
    eforms, issues = parse(args[0])
    text = render(eforms)
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        m = re.search(r'const XA_EFORM = (\[.*\]);', cur, re.S)
        old = summary(json.loads(m.group(1))) if m else {}
        new = summary(eforms)
        diff = []
        for eid in sorted(set(old) | set(new)):
            o, n = old.get(eid, {}), new.get(eid, {})
            for c in n.keys() - o.keys():
                diff.append('%s: eform THÊM trường «%s» (%s) — màn hình chưa có' % (eid, n[c][0], c))
            for c in o.keys() - n.keys():
                diff.append('%s: eform BỎ trường «%s» (%s)' % (eid, o[c][0], c))
            for c in n.keys() & o.keys():
                if n[c] != o[c]:
                    diff.append('%s: trường «%s» (%s) đổi tên, kiểu hoặc danh mục' % (eid, n[c][0], c))
        print('== So sheet với js/core/xa-eform.js')
        print('\n'.join('  ' + d for d in diff) if diff else '  Khớp: %d eform, %d trường.' % (len(eforms), sum(len(e['fields']) for e in eforms)))
        print('== Lỗi trong file eform (%d)' % len(issues))
        for no, ten, msg in issues:
            print('  dòng %d · %s · %s' % (no, ten, msg))
        sys.exit(1 if diff else 0)
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print('Đã ghi %s: %d eform, %d trường.' % (os.path.relpath(OUT, ROOT), len(eforms), sum(len(e['fields']) for e in eforms)))


if __name__ == '__main__':
    main()
