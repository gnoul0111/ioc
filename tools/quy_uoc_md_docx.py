# -*- coding: utf-8 -*-
"""Dựng docs/CHUNG/QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28.docx từ bản .md cùng tên (bản .md viết tay là bản gốc; sửa .md rồi chạy lại).
Chạy từ thư mục gốc ioc:  python3 tools/quy_uoc_md_docx.py      (cần python-docx)
Chỉ ghi .docx — không ghi đè .md. Hiểu: # tiêu đề, ## / ### mục, "- " gạch đầu dòng, bảng "| … |", **đậm**, «tên trường», `mã`."""
import os, re, sys, tempfile, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from doc_kit import Kit, CENTER, NAVY, PAGE_W

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'docs', 'CHUNG', 'QUY_UOC_CHI_TIEU_THEO_EFORM_2026_10_28.md')
OUT = os.path.splitext(SRC)[0] + '.docx'
lines = open(SRC, encoding='utf-8').read().split('\n')
k = Kit('Quy ước dựng chỉ tiêu theo eform · IOC Hà Nội')
clean = lambda t: t.replace('`', '')


def flush_table(rows):
    if not rows:
        return
    n = max(len(r) for r in rows)
    rows = [r + [''] * (n - len(r)) for r in rows]
    first = rows[0][0].strip()
    w0 = 1.4 if first in ('#', 'Mã') or len(first) <= 3 else PAGE_W / n
    widths = [w0] + [(PAGE_W - w0) / (n - 1)] * (n - 1) if n > 1 else [PAGE_W]
    k.table([[clean(c.strip()) for c in r] for r in rows], widths, size=10)


rows, bl = [], []
for ln in lines + ['']:
    s = ln.rstrip()
    if s.startswith('|'):
        if bl: k.bullets(bl, 11); bl = []
        cells = s.strip('|').split('|')
        if not all(re.fullmatch(r'\s*:?-{2,}:?\s*', c) for c in cells):
            rows.append(cells)
        continue
    flush_table(rows); rows = []
    if s.startswith('- '):
        bl.append(clean(s[2:])); continue
    if bl: k.bullets(bl, 11); bl = []
    if not s.strip():
        continue
    if s.startswith('# '):
        k.para(clean(s[2:]), 18, CENTER, 8, bold=True, color=NAVY, md=False); k.md.title(clean(s[2:]))
    elif s.startswith('### '):
        k.heading(clean(s[4:]), 2)
    elif s.startswith('## '):
        k.heading(clean(s[3:]), 1)
    elif s.startswith('> '):
        k.note(clean(s[2:]))
    else:
        k.para(clean(s), 11)
tmp = tempfile.mkdtemp()
d, _ = k.save(os.path.join(tmp, 'quy_uoc.docx'))
shutil.copyfile(d, OUT)
shutil.rmtree(tmp)
print(os.path.relpath(OUT, ROOT))
