# -*- coding: utf-8 -*-
"""Bản Markdown song song với tài liệu Word (python-docx).

Từ 2026-10-05 mọi tài liệu mô tả xuất cả .docx và .md cùng nội dung. Các script tài liệu (tools/*_doc_docx.py) gọi MdMirror
ngay trong các hàm dựng Word (para, table, box, heading…), nên hai bản luôn cùng một nội dung, không phải viết lại lần hai.

Quy ước chuyển:
  heading cấp 1/2/3 của Word  → ## / ### / ####   (# dành cho tiêu đề tài liệu ở trang bìa)
  **đậm**, «tên trường»        → giữ nguyên (Markdown hiểu **đậm**; «…» để nguyên cho dễ đối chiếu với eform)
  bảng có dòng tiêu đề         → bảng Markdown; ô nhiều dòng nối bằng <br>
  bảng 2 cột không tiêu đề     → danh sách "- **Cột 1**: cột 2" (bảng thông tin, bảng mô tả biểu đồ)
  khung ghi chú (box)          → trích dẫn ">"
  mục lục                      → danh sách các đầu mục cấp 1, 2 (sinh lúc ghi file)
"""
import re


def _cell(v):
    lines = v if isinstance(v, list) else [v]
    return '<br>'.join(str(x).replace('|', '\\|').replace('\n', '<br>') for x in lines)


def _flat(v):
    return ' '.join(str(x) for x in v) if isinstance(v, list) else str(v)


class MdMirror:
    def __init__(self):
        self.out = []          # các khối Markdown, mỗi phần tử là một đoạn
        self.heads = []        # (cấp, chữ) để dựng mục lục

    # ---- khối văn bản ----
    def title(self, text):
        self.out.append('# ' + text.strip())

    def heading(self, text, level=1):
        self.heads.append((level, text.strip()))
        self.out.append('#' * (level + 1) + ' ' + text.strip())

    def para(self, text, size=None, italic=False, bold=False):
        t = (text or '').strip()
        if not t:
            return
        if size and size >= 20:            # chữ cỡ lớn ở trang bìa = tiêu đề tài liệu
            return self.title(t)
        if bold and not t.startswith('**'):
            t = '**' + t + '**'
        if italic:
            t = '*' + t + '*'
        self.out.append(t)

    def bullets(self, items):
        self.out.append('\n'.join('- ' + _flat(x) for x in items))

    def box(self, lines, label=None):
        rows = [_flat(x) for x in lines]
        if label:
            lb = label.strip()
            if lb.endswith(':') and rows:      # "Lưu ý: nội dung" → cùng một dòng
                rows[0] = '**' + lb + '** ' + rows[0]
            else:
                rows.insert(0, '**' + lb + '**')
        self.out.append('\n>\n'.join('> ' + r for r in rows))

    def table(self, rows, header=True):
        if not rows:
            return
        if not header and len(rows[0]) == 2:
            self.out.append('\n'.join('- **' + _flat(r[0]).strip('*') + '**: ' + _cell(r[1]) for r in rows))
            return
        if not header:
            rows = [[''] * len(rows[0])] + list(rows)
        head = '| ' + ' | '.join(_cell(c) for c in rows[0]) + ' |'
        sep = '|' + '|'.join('---' for _ in rows[0]) + '|'
        body = ['| ' + ' | '.join(_cell(c) for c in r) + ' |' for r in rows[1:]]
        self.out.append('\n'.join([head, sep] + body))

    def toc(self):
        self.out.append('\0TOC\0')         # thay bằng danh sách đầu mục khi ghi file

    def rule(self):
        self.out.append('---')

    # ---- ghi file ----
    def render(self):
        toc = '\n'.join(('  ' if lv == 2 else '') + '- ' + t for lv, t in self.heads if lv <= 2)
        text = '\n\n'.join(toc if b == '\0TOC\0' else b for b in self.out)
        return re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'

    def save(self, path):
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(self.render())
