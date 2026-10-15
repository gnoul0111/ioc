# Cắt file giọng Vbee (1 file dài, có chèn đoạn ngoài lời) thành từng câu c2..c18 theo lời thoại,
# dựa trên kết quả nhận dạng giọng nói (vbee_transcribe.py). Đoạn nào không khớp lời thoại thì bỏ.
#   python -I -X utf8 vbee_split.py <source.mp3> <asr.json> <lines.json> <outdir>
# Ra: <outdir>/<id>.wav + <outdir>/timing.json (cùng khuôn với tts.py: {id: {text, dur, words:[{t,d,w}]}})
import json, os, re, subprocess, sys, unicodedata, wave
import numpy as np
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000


def norm(s):
    s = unicodedata.normalize('NFC', s.lower())
    return re.sub(r"[^\wÀ-ỹ]", '', s)


def sim(a, b):
    if a == b: return 2
    if not a or not b: return -1
    # khớp gần đúng (nhận dạng sai dấu/1 ký tự)
    da = unicodedata.normalize('NFD', a); db = unicodedata.normalize('NFD', b)
    base = lambda s: ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    if base(da) == base(db): return 1
    return -1


def main(src, asr_path, lines_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    asr = json.load(open(asr_path, encoding='utf-8'))
    lines = json.load(open(lines_path, encoding='utf-8-sig'))
    A = []  # từ nhận dạng (số viết bằng chữ số -> đổi ra chữ, chia đều thời gian)
    NUM = {'14': 'mười bốn', '3': 'ba', '126': 'một trăm hai mươi sáu', '34': 'ba mươi tư'}
    for s in asr:
        for w in s['words']:
            for part in w['w'].split():
                key = re.sub(r'\D', '', part)
                if key in NUM and key == norm(part):
                    sub = NUM[key].split(); step = (w['e'] - w['t']) / len(sub)
                    for q, x in enumerate(sub): A.append({'w': x, 't': w['t'] + q * step, 'e': w['t'] + (q + 1) * step})
                elif norm(part): A.append({'w': norm(part), 't': w['t'], 'e': w['e']})
    S = []  # từ lời thoại
    for li, ln in enumerate(lines):
        for tok in ln['text'].split():
            if norm(tok): S.append({'w': norm(tok), 'line': li, 'raw': tok})
    n, m = len(S), len(A)
    GAP_S, GAP_A = -1, -0.4   # bỏ qua từ nhận dạng thừa (quảng cáo) rẻ hơn bỏ từ lời thoại
    D = np.zeros((n + 1, m + 1)); P = np.zeros((n + 1, m + 1), dtype=np.int8)
    D[1:, 0] = np.arange(1, n + 1) * GAP_S; P[1:, 0] = 1
    D[0, 1:] = np.arange(1, m + 1) * GAP_A; P[0, 1:] = 2
    for i in range(1, n + 1):
        si = S[i - 1]['w']
        for j in range(1, m + 1):
            best, p = D[i - 1, j - 1] + sim(si, A[j - 1]['w']), 0
            v = D[i - 1, j] + GAP_S
            if v > best: best, p = v, 1
            v = D[i, j - 1] + GAP_A
            if v > best: best, p = v, 2
            D[i, j] = best; P[i, j] = p
    i, j, match = n, m, [None] * n
    used = set()
    while i > 0 or j > 0:
        p = P[i, j]
        if i > 0 and j > 0 and p == 0:
            if sim(S[i - 1]['w'], A[j - 1]['w']) > 0: match[i - 1] = j - 1; used.add(j - 1)
            i, j = i - 1, j - 1
        elif i > 0 and (p == 1 or j == 0): i -= 1
        else: j -= 1
    matched = sum(1 for x in match if x is not None)
    print(f'Khớp {matched}/{n} từ lời thoại với {m} từ nhận dạng')
    # thời gian cho từng từ lời thoại: lấy theo từ khớp, từ không khớp thì nội suy giữa 2 từ khớp kề
    times = [None] * n
    for k, x in enumerate(match):
        if x is not None: times[k] = (A[x]['t'], A[x]['e'])
    for k in range(n):
        if times[k] is None:
            L = next((times[q] for q in range(k - 1, -1, -1) if times[q] and S[q]['line'] == S[k]['line']), None)
            Rr = next((times[q] for q in range(k + 1, n) if times[q] and S[q]['line'] == S[k]['line']), None)
            if L and Rr: times[k] = (L[1], Rr[0]) if Rr[0] > L[1] else (L[1], L[1] + .2)
            elif L: times[k] = (L[1], L[1] + .35)
            elif Rr: times[k] = (max(0, Rr[0] - .35), Rr[0])
    # các đoạn nhận dạng KHÔNG thuộc lời thoại (để kiểm tra quảng cáo)
    extra = []; cur = []
    for j in range(m):
        if j not in used: cur.append(A[j])
        elif cur: extra.append(cur); cur = []
    if cur: extra.append(cur)
    print('Đoạn ngoài lời thoại (bị bỏ):')
    for e in extra:
        if len(e) >= 3: print(f"  {e[0]['t']:.2f}-{e[-1]['e']:.2f}s: {' '.join(x['w'] for x in e)}")
    # khoảng lặng thật trong file (mốc từ của máy nhận dạng lệch vài trăm ms -> cắt theo khoảng lặng cho sạch)
    log = subprocess.run([FF, '-hide_banner', '-i', src, '-af', 'silencedetect=noise=-38dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    sil = list(zip(ss, se))
    def gap_between(t_end, t_start):
        """khoảng lặng dài nhất nằm giữa cuối câu trước và đầu câu sau (cho phép lệch 0,6s)"""
        cand = [(b - a, a, b) for a, b in sil if a < t_start + .6 and b > t_end - .6 and b - a > .15]
        return max(cand)[1:] if cand else None
    spans = []
    for li in range(len(lines)):
        ks = [k for k in range(n) if S[k]['line'] == li]
        spans.append([times[ks[0]][0], times[ks[-1]][1]])
    cuts = []
    for li in range(len(lines)):
        a0, b0 = spans[li]
        a = max(0, a0 - .12); b = b0 + .25
        # đầu câu: khoảng lặng kết thúc SÁT trước từ đầu tiên (không lấy khoảng lặng xa hơn, kẻo dính đoạn chèn)
        # (mốc của máy nhận dạng hay kéo dài từ cuối/đầu vào trong khoảng lặng -> nhận cả khoảng lặng "bao quanh" mốc)
        pre = [(e, s) for s, e in sil if s <= a0 + .2 and e >= a0 - .8 and e - s > .15]
        if pre: e, s = max(pre); a = max(s, e - .10)
        # cuối câu: khoảng lặng bắt đầu SÁT sau từ cuối cùng
        post = [(s, e) for s, e in sil if e >= b0 - .2 and s <= b0 + .8 and e - s > .15]
        if post: s, e = min(post); b = min(e, s + .15)
        cuts.append((a, b))
    # cắt từng câu
    timing = {}
    for li, ln in enumerate(lines):
        ks = [k for k in range(n) if S[k]['line'] == li]
        a, b = cuts[li]
        out = os.path.join(outdir, ln['id'] + '.wav')
        subprocess.run([FF, '-y', '-loglevel', 'error', '-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', src,
                        '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.08,areverse', '-ar', str(SR), '-ac', '2', out], check=True)
        with wave.open(out) as w: dur = w.getnframes() / w.getframerate()
        words = [{'t': round(times[k][0] - a, 3), 'd': round(max(.05, times[k][1] - times[k][0]), 3), 'w': S[k]['raw']} for k in ks]
        timing[ln['id']] = {'text': ln['text'], 'dur': round(dur, 3), 'words': words, 'src': [round(a, 3), round(b, 3)]}
        print(f"{ln['id']}: {a:7.2f} → {b:7.2f}  ({dur:.2f}s)  khớp {sum(1 for k in ks if match[k] is not None)}/{len(ks)}")
    json.dump(timing, open(os.path.join(outdir, 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(*sys.argv[1:5])
