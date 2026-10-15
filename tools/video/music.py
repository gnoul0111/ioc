# Tổng hợp nhạc nền + hiệu ứng âm thanh khớp từng mốc của video, rồi trộn với giọng đọc (tự hạ nhạc khi có lời).
# Nhạc tự tạo bằng code -> không vướng bản quyền.
#   python -I -X utf8 music.py <meta.json> <audio_dir> <out.wav>
import json, sys, os, wave
from functools import lru_cache
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def note_hz(n):  # 'A2' -> Hz
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    name, octv = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((names[name] + (octv - 4) * 12) / 12)


def env_adsr(n, a, d, s, r):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s, dtype=np.float64)
    a = max(1, min(a, n)); e[:a] = np.linspace(0, 1, a)
    dd = max(0, min(d, n - a))
    if dd: e[a:a + dd] = np.linspace(1, s, dd)
    if 0 < r < n: e[n - r:] *= np.linspace(1, 0, r)
    return e


def _warm(freq, dur, cut, nh, detune):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, nh + 1):
        fk = freq * k
        if fk > 16000: break
        amp = (1.0 / k) / (1.0 + (fk / cut) ** 2)
        out += amp * np.sin(2 * np.pi * fk * (1 + detune) * t + (k * 2.399 + freq * .013) % 6.283)
    return out


@lru_cache(maxsize=None)
def warm_c(freq, dur, cutoff, nh, detune):
    return _warm(freq, dur, cutoff, nh, detune)


def warm(freq, dur, cutoff=1500.0, nh=40, detune=0.0):
    """Sóng răng cưa 'ấm' bằng cộng hài; cutoff là số (có cache) hoặc mảng theo thời gian (lọc quét)."""
    if np.ndim(cutoff):
        return _warm(freq, dur, cutoff, nh, detune)
    return warm_c(round(freq, 4), round(dur, 4), float(cutoff), nh, detune).copy()


@lru_cache(maxsize=None)
def pluck_c(freq, dur, decay, harm):
    n = int(dur * SR); t = np.arange(n) / SR
    out = sum(a * np.sin(2 * np.pi * freq * (i + 1) * t) * np.exp(-t / (decay / (i + 1))) for i, a in enumerate(harm))
    att = int(.004 * SR); out[:att] *= np.linspace(0, 1, att)
    return out


def pluck(freq, dur, decay=0.6, harm=(1, .35, .12)):
    return pluck_c(round(freq, 4), dur, decay, tuple(harm)).copy()


def noise(n):
    return rng.standard_normal(n)


def lowpass_fft(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def highpass_fft(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / np.sqrt(1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass_sweep(n, f0, f1, q=0.25):
    """Nhiễu lọc dải có tâm quét f0->f1 (xử lý theo khối nhỏ)."""
    x = noise(n); out = np.zeros(n); blk = 2048
    for i in range(0, n, blk):
        seg = x[i:i + blk]
        fc = f0 * (f1 / f0) ** (i / max(1, n))
        X = np.fft.rfft(seg, 2 * blk); f = np.fft.rfftfreq(2 * blk, 1 / SR)
        X *= np.exp(-((np.log2(np.maximum(f, 1) / fc)) ** 2) / (2 * q ** 2))
        out[i:i + len(seg)] = np.fft.irfft(X)[:len(seg)]
    return out / (np.abs(out).max() + 1e-9)


def boom(dur=1.6, f0=62, f1=32, click=.25):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    out = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * .35))
    cl = noise(int(.02 * SR)) * np.linspace(1, 0, int(.02 * SR)) * click
    out[:len(cl)] += cl
    return out


def hat(dur=.06, fc=7000):
    n = int(dur * SR)
    return highpass_fft(noise(n), fc) * np.exp(-np.arange(n) / SR / (dur / 4))


class Bus:
    def __init__(self, dur):
        self.L = np.zeros(int(dur * SR) + 2 * SR); self.R = np.zeros_like(self.L)

    def add(self, t, x, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= len(self.L) or i < 0: return
        x = x[:len(self.L) - i]
        gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.L[i:i + len(x)] += x * gain * gl * 1.414
        self.R[i:i + len(x)] += x * gain * gr * 1.414


def reverb(L, R, secs=2.4, mix=.3):
    n = int(secs * SR); t = np.arange(n) / SR
    out = []
    for ch in (L, R):
        ir = noise(n) * np.exp(-t * 6.9 / secs)
        ir = lowpass_fft(ir, 6000); ir[0] = 0
        size = 1 << int(np.ceil(np.log2(len(ch) + n)))
        wet = np.fft.irfft(np.fft.rfft(ch, size) * np.fft.rfft(ir, size), size)[:len(ch)]
        wet *= np.abs(ch).max() / (np.abs(wet).max() + 1e-9)
        out.append(ch * (1 - mix) + wet * mix)
    return out


def read_wav(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        a = a.reshape(-1, w.getnchannels())
    return a[:, 0], a[:, 1] if a.shape[1] > 1 else a[:, 0]


def main(meta_path, audio_dir, out_path):
    M = json.load(open(meta_path, encoding='utf-8-sig'))
    D = M['duration']
    ev = {}
    for e in M['events']: ev.setdefault(e['type'], []).append(e)
    first = lambda k: ev[k][0]['t']
    T_FLASH, T_IMPACT, T_END = first('flash'), first('impact'), ev['end'][0]['t']
    chapters = sorted(e['t'] for e in ev.get('whoosh', []))
    mus = Bus(D); sfx = Bus(D)

    # 1) Drone trầm + riser mở đầu
    dr = warm(note_hz('A1'), T_IMPACT - .15, cutoff=420, nh=24) + .6 * warm(note_hz('E2'), T_IMPACT - .15, cutoff=420, nh=20)
    n = len(dr); e = np.minimum(1, np.arange(n) / (SR * 2.6)) * (.55 + .45 * np.linspace(0, 1, n) ** 2)
    e[-int(.12 * SR):] *= np.linspace(1, 0, int(.12 * SR))
    mus.add(0, dr * e, .28)
    rz = bandpass_sweep(int(T_FLASH * SR), 300, 5000, .35) * np.linspace(0, 1, int(T_FLASH * SR)) ** 2.5
    sfx.add(0, rz, .22)
    sfx.add(T_FLASH - .02, boom(1.8, 70, 34, .5), .75)
    sfx.add(T_FLASH, highpass_fft(noise(int(2.2 * SR)), 5000) * np.exp(-np.arange(int(2.2 * SR)) / SR / .5), .06, .2)

    # 2) Ostinato dây + taiko trong đường hầm màn hình
    s16 = 60 / 132 / 4
    pat = ['A3', 'A3', 'C4', 'A3', 'E4', 'A3', 'D4', 'A3', 'A3', 'A3', 'C4', 'A3', 'F4', 'E4', 'D4', 'C4']
    t = T_FLASH; i = 0
    while t < T_IMPACT - .25:
        u = (t - T_FLASH) / (T_IMPACT - T_FLASH)
        f = note_hz(pat[i % 16])
        cut = round(900 + 2600 * u, -2)
        x = warm(f, .16, cutoff=cut, nh=30) * env_adsr(int(.16 * SR), .004, .07, .35, .05)
        x2 = warm(f / 2, .16, cutoff=round(700 + 1200 * u, -2), nh=20) * env_adsr(int(.16 * SR), .004, .07, .35, .05)
        mus.add(t, x + .7 * x2, .10 + .16 * u, -.25 if i % 2 else .25)
        if i % 4 == 0: mus.add(t, boom(.7, 95, 48, .35), .30 + .35 * u)
        if i % 8 == 4: mus.add(t, highpass_fft(noise(int(.18 * SR)), 1800) * np.exp(-np.arange(int(.18 * SR)) / SR / .05), .05 + .08 * u)
        t += s16; i += 1
    for e_ in ev.get('flip', []) + ev.get('beat', []):
        nn = int(.09 * SR)
        x = bandpass_sweep(nn, 6000, 1200, .5) * np.exp(-np.arange(nn) / SR / .03)
        sfx.add(e_['t'] - .03, x, .16, rng.uniform(-.5, .5))
    rs0 = T_IMPACT - 4.0; nrs = int((T_IMPACT - .12 - rs0) * SR); tt = np.arange(nrs) / SR
    riser = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (tt / tt[-1] * 3)) / SR) * (tt / tt[-1]) ** 2
    riser += .5 * bandpass_sweep(nrs, 400, 9000, .4) * (tt / tt[-1]) ** 2.2
    sfx.add(rs0, riser, .28)

    # 3) BRAAM khi chốt logo (dùng lại cho cảnh kết)
    def braam(t0, g=.3, bg=1.0):
        bd = 4.5; nb = int(bd * SR); tb = np.arange(nb) / SR
        cut = 250 + 3200 * np.exp(-((tb - .25) ** 2) / .08) + 500 * np.exp(-tb / 1.2)
        br = sum(gg * _warm(note_hz(nm), bd, cut, 50, dt) for nm, gg, dt in
                 [('A1', 1, 0), ('A1', .8, .004), ('A2', .9, -.003), ('E2', .7, .002), ('A3', .35, 0), ('C3', .25, 0)])
        br *= np.minimum(1, tb / .03) * np.exp(-tb / 1.6)
        mus.add(t0, br, g)
        sfx.add(t0, boom(3.0, 58, 28, .6), bg)
        sfx.add(t0, highpass_fft(noise(int(3 * SR)), 3000) * np.exp(-np.arange(int(3 * SR)) / SR / .7), .10, .1)
    braam(T_IMPACT)
    for e_ in ev['impact'][1:]: braam(e_['t'], .09, .35)   # cú chốt ở cảnh kết nhẹ hơn vì đè lên lời đọc

    # 4) Nền nhạc cho phần có lời: Am–F–C–G, cường độ tăng dần theo từng phần
    chords = [['A2', 'E3', 'A3', 'C4', 'E4'], ['F2', 'C3', 'F3', 'A3', 'C4'], ['C3', 'G3', 'C4', 'E4', 'G4'], ['G2', 'D3', 'G3', 'B3', 'D4']]
    bar = 60 / 90 * 4
    def section(t):  # 0 intro/title, 1..4 = phần 01..04
        return sum(1 for c in chapters if t >= c + .6)
    t = T_IMPACT + 1.0; k = 0
    while t < T_END + 1.0:
        ch = chords[k % 4]; sec = section(t)
        gain = [.8, .85, 1.0, 1.05, 1.15][min(sec, 4)]
        pad = sum(warm(note_hz(nm), round(bar + 1.2, 3), cutoff=900 + 150 * sec, nh=28, detune=(-.003 if j % 2 else .003)) for j, nm in enumerate(ch))
        pad *= env_adsr(len(pad), 1.0, .5, .85, 1.2)
        mus.add(t, pad, .045 * gain)
        mus.add(t, pluck(note_hz(ch[0]) / 2, round(bar, 3), decay=1.6, harm=(1, .3)), .16 * gain)
        for j in range(8):
            nm = ch[[1, 2, 3, 4, 3, 2, 3, 4][j]]
            mus.add(t + j * bar / 8, pluck(note_hz(nm) * 2, 1.6, decay=.55), (.05 + (.015 if j == 0 else 0)) * gain, (j % 4 - 1.5) / 3)
        if sec >= 2:   # phần 02 trở đi: bass nhịp móc 8 phách
            for j in range(8):
                mus.add(t + j * bar / 8, pluck(note_hz(ch[0]) / 2, .3, decay=.12, harm=(1, .5, .2)), .07 * gain)
        if sec >= 3:   # phần 03 trở đi: trống nhẹ + hi-hat
            for j in range(4):
                mus.add(t + j * bar / 4, boom(.5, 80, 45, .15), .16 * gain)
            for j in range(8):
                mus.add(t + j * bar / 8 + bar / 16, hat(), .03 * gain, .3)
        if sec >= 4:   # phần 04: lớp dây cao ngân dài
            st = warm(note_hz(ch[3]) * 2, round(bar + .8, 3), cutoff=2400, nh=18, detune=.002)
            st *= env_adsr(len(st), .8, .4, .8, .8)
            mus.add(t, st, .025 * gain, .2)
        t += bar; k += 1
    # riser ngắn dồn vào mỗi thẻ chương
    for c in chapters:
        nn = int(.9 * SR); x = bandpass_sweep(nn, 500, 7000, .45) * np.linspace(0, 1, nn) ** 2
        sfx.add(c - .35, x, .22)

    # 5) Hiệu ứng theo cảnh
    for e_ in ev.get('whoosh', []) + ev.get('whoosh2', []):
        nn = int(1.2 * SR); x = bandpass_sweep(nn, 300, 6000, .5) * np.sin(np.linspace(0, np.pi, nn)) ** 2
        sfx.add(e_['t'], x, .26)
    for e_ in ev.get('hit', []):
        sfx.add(e_['t'], boom(1.4, 70, 36, .25), .55)
        sfx.add(e_['t'], pluck(note_hz('A5'), 1.6, .8, (1, .5, .25, .1)), .06, .2)
    for e_ in ev.get('pop', []):
        sfx.add(e_['t'], pluck(note_hz('E5'), .5, .18), .14, .2)
    for j, e_ in enumerate(ev.get('ding', [])):
        sfx.add(e_['t'], pluck(note_hz(['A5', 'C6', 'E6', 'A6'][j % 4]), 1.2, .5, (1, .5, .2)), .10, .3)
    for e_ in ev.get('tick', []):
        sfx.add(e_['t'], pluck(note_hz('A6'), .15, .04, (1, .3)), .07, -.2)
    for e_ in ev.get('swoosh', []):
        nn = int(.5 * SR); x = bandpass_sweep(nn, 1200, 5000, .45) * np.sin(np.linspace(0, np.pi, nn)) ** 2
        sfx.add(e_['t'], x, .18, .3)
    for e_ in ev.get('alert', []):
        sfx.add(e_['t'], pluck(note_hz('E5'), .4, .15), .12); sfx.add(e_['t'] + .13, pluck(note_hz('C5'), .5, .2), .12)
    for e_ in ev.get('lock', []):
        sfx.add(e_['t'], hat(.03, 2500), .25); sfx.add(e_['t'] + .02, boom(.25, 140, 90, .1), .25)
    for e_ in ev.get('click', []):
        sfx.add(e_['t'], hat(.02, 3500), .22)
    sfx.add(T_END + .2, boom(2.0, 55, 30, .2), .45)

    # 6) Reverb + hạ nhạc khi có lời
    mL, mR = reverb(mus.L, mus.R, 2.6, .32)
    sL, sR = reverb(sfx.L, sfx.R, 1.8, .25)
    duck = np.ones(len(mL))
    for v in M['voices'].values():
        a, b = int((v['start'] - .25) * SR), int((v['start'] + v['dur'] + .2) * SR)
        duck[max(0, a):b] = .38
    kk = int(.25 * SR); cs = np.concatenate([[0], np.cumsum(duck)]); idx = np.arange(len(duck)); lo = np.clip(idx - kk // 2, 0, len(duck)); hi = np.clip(idx + kk // 2, 0, len(duck)); duck = (cs[hi] - cs[lo]) / np.maximum(1, hi - lo)  # trung bình trượt O(n)
    mL *= duck; mR *= duck
    sduck = 1 - (1 - duck) * .5
    sL *= sduck; sR *= sduck
    fo0, fo1 = int(T_END * SR), int((D + .1) * SR)
    fade = np.ones(len(mL)); fade[fo0:fo1] = np.linspace(1, 0, fo1 - fo0); fade[fo1:] = 0
    mL *= fade; mR *= fade; sL *= fade; sR *= fade

    # 7) Giọng đọc
    vL = np.zeros(len(mL)); vR = np.zeros(len(mL))
    for vid, v in M['voices'].items():
        a, b = read_wav(os.path.join(audio_dir, vid + '.wav'))
        g = .86 / (np.abs(a).max() + 1e-9)
        i = int(v['start'] * SR); n = min(len(a), len(vL) - i)
        vL[i:i + n] += a[:n] * g; vR[i:i + n] += b[:n] * g

    bL, bR = mL + sL, mR + sR
    lim = .8
    bL, bR = lim * np.tanh(bL / lim), lim * np.tanh(bR / lim)
    L = bL + vL; R = bR + vR
    n = int(D * SR); L, R, bL, vL = L[:n], R[:n], bL[:n], vL[:n]
    def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    for vid, v in M['voices'].items():
        a, b = int(v['start'] * SR), int((v['start'] + v['dur']) * SR)
        print(f"  {vid}: giọng {db(vL[a:b]):.1f} dB, nhạc dưới giọng {db(bL[a:b]):.1f} dB")
    print(f"  intro nhạc {db(bL[3 * SR:int(T_IMPACT * SR)]):.1f} dB")
    peak = max(np.abs(L).max(), np.abs(R).max())
    if peak > .97: L, R = L * .97 / peak, R * .97 / peak
    pcm = (np.stack([L, R], 1) * 32767).astype(np.int16)
    with wave.open(out_path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('Đã ghi', out_path, f'{D:.1f}s, peak {peak:.2f}')


if __name__ == '__main__':
    main(*sys.argv[1:4])



